import { data, Form, redirect, useNavigate, useNavigation } from 'react-router';
import type { Route } from './+types/edit-flash-cards';
import { useState, type MouseEvent, type SubmitEvent } from 'react';
import { getServerClient } from '~/utils/supabase.server';
import { userContext } from '~/context';
import Spinner from '~/components/Spinner';
import getErrorMessage from '~/utils/getErrorMessage';
import { FlashCardFieldset } from '~/components/FlashCardFieldSet';
import {
  deleteGroupAndCards,
  getGroupWithCards,
  syncCards,
  updateGroupName,
} from '~/services/flashCards.server';
import { parseFlashCardsFromFormData } from '~/utils/parseFlashCardsFromFormData';
import { useFlashCardsEditor } from '~/hooks/useFlashCardsEditor';
import {
  getLocalCards,
  getLocalGroups,
  saveLocalCards,
  saveLocalGroups,
} from '~/utils/localFlashCards';

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const groupId = +params.id;
  const user = context.get(userContext);

  if (user?.is_anonymous) return null;

  const { supabase } = getServerClient(request);
  try {
    const result = await getGroupWithCards(supabase, +groupId);

    if (result.error) throw data(result.error, { status: 500 });

    return {
      cardsData: result.cardsData,
      groupName: result.groupData?.name ?? '',
      isAnonymous: false,
    };
  } catch (error) {
    throw data(getErrorMessage(error), { status: 500 });
  }
}

export async function clientLoader({
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  const groupId = params.id;
  const serverData = await serverLoader();
  if (serverData) return serverData;

  const cards = getLocalCards();
  const groups = getLocalGroups();
  const group = groups.find(el => el.id === groupId);

  const cardsToPass = cards[groupId].map(el => ({
    ...el,
    id: crypto.randomUUID() as string,
    group_id: groupId,
  }));

  return {
    cardsData: cardsToPass,
    groupName: group!.name!,
    isAnonymous: true,
  };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <Spinner />;
}

export async function action({ params, request }: Route.ActionArgs) {
  const { supabase } = getServerClient(request);
  const formData = await request.formData();
  const groupId = +params.id!;

  // If pressed the delete button
  if (formData.get('delete') === 'delete-group') {
    const { error } = await deleteGroupAndCards(supabase, groupId);
    if (error) return data({ error });
    return redirect('/dashboard');
  }

  const newName = formData.get('name') as string;

  const { error: nameError } = await updateGroupName(
    supabase,
    groupId,
    newName,
  );
  if (nameError)
    return data({ error: 'This name is already used by other group.' });

  const deletedIds = formData.getAll('deletedIds').map(Number);
  const { toInsert, toUpdate } = parseFlashCardsFromFormData(formData);

  // Add, update and delete cards
  const { error: syncError } = await syncCards(supabase, groupId, {
    toInsert,
    toUpdate,
    deletedIds,
  });
  if (syncError) return data({ error: syncError });

  return redirect(`/flash-cards/${groupId}`);
}

export default function EditFlashCards({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const groupId = params.id;

  const { isAnonymous, cardsData } = loaderData;
  const [clientError, setClientError] = useState('');
  // const [includeServerError, setIncludeServerError] = useState(true);

  const actionError = actionData?.error;
  const errorMessage = clientError || actionError;

  const {
    currentFlashCards,
    deletedIds,
    updateFlashCard,
    removeFlashCard,
    addFlashCard,
  } = useFlashCardsEditor(cardsData!);

  function handleDeleteGroup(event: MouseEvent<HTMLButtonElement>) {
    // Insted of that add confirmation modal??
    const confirmed = window.confirm(
      'Are you sure you want to delete this group and all its flashcards? This cannot be undone.',
    );
    if (!confirmed) {
      event.preventDefault();
      return;
    }

    if (!isAnonymous) return; // if the user is logged in and confirmed the deletion, go to action (do stuff on server), when anonymous delete locally
    event.preventDefault();
    const groups = getLocalGroups();
    const cards = getLocalCards();

    const updatedGroups = groups.filter(el => el.id !== groupId);
    // Get rid of all the cards that are assing to the group
    delete cards[groupId!];

    saveLocalGroups(updatedGroups);
    saveLocalCards(cards);

    navigate('/dashboard');
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    setClientError('');

    if (!isAnonymous) return;
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newName = formData.get('name') as string;

    const groups = getLocalGroups();
    const cards = getLocalCards();

    const nameTaken = groups.find(el => el.name === newName);

    if (nameTaken && nameTaken.id !== params.id) {
      setClientError('Name is already used by other group.');
      return;
    }

    const updatedGroups = groups.map(el =>
      el.id === '' + groupId ? { ...el, name: newName } : el,
    );

    cards[groupId!] = currentFlashCards.map(({ question, answer }) => ({
      question,
      answer,
    }));

    saveLocalGroups(updatedGroups);
    saveLocalCards(cards);

    navigate('/flash-cards/' + groupId);
  }

  return (
    <Form
      method='post'
      onSubmit={handleSubmit}
      className='max-w-5xl mx-auto flex flex-col bg-white rounded-md py-4 px-8 my-30 shadow-md'
    >
      {errorMessage && (
        <p className='text-red-600 text-sm text-center mb-4' role='alert'>
          {errorMessage}
        </p>
      )}

      <div className='inline-flex flex-col'>
        <label htmlFor='name'>Group name</label>
        <input
          className='bg-blue-grey-050 rounded-md px-2 py-1 inset-shadow-sm'
          id='name'
          name='name'
          type='text'
          autoComplete='off'
          defaultValue={loaderData.groupName}
        />
      </div>

      {/* Those inputs are neccessary so the cards to delete can get to the action to delete them */}
      {deletedIds.map(id => (
        <input key={id} type='hidden' name='deletedIds' value={id} />
      ))}

      <div className='flex flex-col gap-4 mt-4'>
        {currentFlashCards.map((flashCard, index) => (
          <FlashCardFieldset
            key={flashCard.id}
            index={index}
            id={flashCard.id}
            answer={flashCard.answer}
            question={flashCard.question}
            onChange={updateFlashCard}
            onRemove={() => removeFlashCard(flashCard.id)}
          />
        ))}

        <div className='flex gap-4 mt-4'>
          <button
            className='text-lg font-medium text-teal-800 bg-teal-100 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-teal-200'
            type='button'
            onClick={addFlashCard}
          >
            Add flash card
          </button>
          <button
            className='text-lg font-medium text-teal-050 bg-teal-500 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-teal-400'
            type='submit'
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            className='text-lg font-medium text-red-050 bg-red-600 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-red-500'
            type='submit'
            name='delete'
            value='delete-group'
            onClick={handleDeleteGroup}
          >
            Delete
          </button>
        </div>
      </div>
    </Form>
  );
}
