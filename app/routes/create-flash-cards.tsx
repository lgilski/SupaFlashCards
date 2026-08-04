import { data, Form, redirect, useNavigate } from 'react-router';
import type { Route } from './+types/create-flash-cards';
import { useState, type SubmitEvent } from 'react';
import { getServerClient } from '~/utils/supabase.server';
import { userContext } from '~/context';
import getErrorMessage from '~/utils/getErrorMessage';
import { FlashCardFieldset } from '~/components/FlashCardFieldSet';
import {
  getLocalCards,
  getLocalGroups,
  saveLocalCards,
  saveLocalGroups,
} from '~/utils/localFlashCards';
import { useFlashCardsEditor } from '~/hooks/useFlashCardsEditor';

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return { isAnonymous: user?.is_anonymous ?? false };
}

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let name = formData.get('name') as string;

  const { supabase } = getServerClient(request);

  try {
    const { data: newGroupData, error: newGroupError } = await supabase
      .from('flash-cards-group')
      .insert({ name })
      .select()
      .single();

    if (newGroupError) {
      return data({ error: newGroupError.message });
    }

    const ids = new Set();

    for (const key of formData.keys()) {
      // Matching names to the question-number or answer-number cnovention. If it matches that then the key gets returned but with additional stuff
      const match = key.match(/^(question|answer)-(\d+)$/);

      // on index 2 there is a number at the end of question-number
      if (match) ids.add(match[2]);
    }

    // Then we get the full data of those elements by id that we added to the set earlier
    const flashcards = [...ids].map(id => ({
      group_id: newGroupData!.id,
      question: formData.get(`question-${id}`) as string,
      answer: formData.get(`answer-${id}`) as string,
    }));

    const { error: insertError } = await supabase
      .from('cards')
      .insert(flashcards);

    if (insertError) {
      return data({ error: insertError.message });
    }

    return redirect('/flash-cards/' + newGroupData!.id);
  } catch (error) {
    throw data(getErrorMessage(error), { status: 500 });
  }
}

export default function CreateFlashCards({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [clientError, setClientError] = useState('');

  const actionError = actionData?.error;
  const errorMessage = clientError || actionError;

  const { isAnonymous } = loaderData;

  const navigate = useNavigate();

  const { addFlashCard, currentFlashCards, removeFlashCard, updateFlashCard } =
    useFlashCardsEditor([]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    setClientError('');

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;

    if (!name) {
      event.preventDefault();
      setClientError('The group has to have a name.');
      return;
    }

    if (!isAnonymous) return; // let the Form submit normally to the server action

    event.preventDefault();

    const groups = getLocalGroups();
    const cards = getLocalCards();

    const nameTaken = groups.find(el => el.name === name);

    if (nameTaken) {
      setClientError('This name is already used by other group.');
      return;
    }

    const groupId = crypto.randomUUID();

    const ids = new Set<string>();
    for (const key of formData.keys()) {
      const match = key.match(/^(question|answer)-(\d+)$/);
      if (match) ids.add(match[2]);
    }

    const flashcards = [...ids].map(id => ({
      question: formData.get(`question-${id}`) as string,
      answer: formData.get(`answer-${id}`) as string,
    }));

    groups.push({ id: groupId, name });
    cards[groupId] = flashcards;

    saveLocalGroups(groups);
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
        <p className='text-red-600 text-sm text-center mb-2' role='alert'>
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
        />
      </div>
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
            Submit
          </button>
        </div>
      </div>
    </Form>
  );
}
