import { Form, redirect, useNavigate } from 'react-router';
import type { Route } from './+types/edit-flash-cards';
import { useRef, useState, type MouseEvent, type SubmitEvent } from 'react';
import { getServerClient } from '~/utils/supabase.server';
import { userContext } from '~/context';

// Check if the name is already used by other group

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const user = context.get(userContext);

  if (user?.is_anonymous) return null;

  const { supabase } = getServerClient(request);

  const { data: categoryData } = await supabase
    .from('flash-cards-group')
    .select()
    .eq('id', +params.id)
    .single();

  const { data: cardsData } = await supabase
    .from('cards')
    .select()
    .eq('group_id', +params.id);

  return {
    cardsData,
    categoryName: categoryData?.name ?? '',
    isAnonymous: false,
  };
}

export async function clientLoader({
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  const serverData = await serverLoader();
  if (serverData) return serverData;

  const cards = JSON.parse(localStorage.getItem('cards') ?? '{}');
  const categories = JSON.parse(
    localStorage.getItem('flash-cards-group') ?? '[]',
  );
  const category = categories.find((el: any) => el.id === params.id);

  return {
    cardsData: cards[params.id],
    categoryName: category.name,
    isAnonymous: true,
  };
}

clientLoader.hydrate = true as const;

// Add cool loading spinner
export function HydrateFallback() {
  return <div>Loading...</div>;
}

export async function action({ params, request }: Route.ActionArgs) {
  const { supabase } = getServerClient(request);
  const formData = await request.formData();
  const newName = formData.get('name') as string;

  // If pressed the delete button
  if (formData.get('delete') === 'delete-category') {
    const { error: cardsError } = await supabase
      .from('cards')
      .delete()
      .eq('group_id', +params.id);
    if (cardsError) console.error('delete cards error:', cardsError);

    const { error: categoryError } = await supabase
      .from('flash-cards-group')
      .delete()
      .eq('id', +params.id);
    if (categoryError) console.error('delete category error:', categoryError);

    return redirect('/dashboard');
  }

  const { data: categoryData } = await supabase
    .from('flash-cards-group')
    .select()
    .eq('id', +params.id)
    .single();

  if (newName !== categoryData!.name) {
    await supabase
      .from('flash-cards-group')
      .update({ name: newName })
      .eq('id', +params.id);
  }

  // Delete flash cards
  const deletedIds = formData.getAll('deletedIds').map(Number);
  if (deletedIds.length > 0) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .in('id', deletedIds);
    if (error) console.error('delete error:', error);
  }

  // asembling questions and answers into pairs
  const ids = new Set<string>();
  for (const key of formData.keys()) {
    const match = key.match(/^(question|answer)-(.+)$/);
    if (match) ids.add(match[2]);
  }

  // divide elements into those to add and those to update
  const toUpdate: {
    id: number;
    group_id: number;
    question: string;
    answer: string;
  }[] = [];
  const toInsert: { group_id: number; question: string; answer: string }[] = [];

  for (const id of ids) {
    const card = {
      group_id: +categoryData!.id,
      question: formData.get(`question-${id}`) as string,
      answer: formData.get(`answer-${id}`) as string,
    };
    if (id.startsWith('new-')) {
      toInsert.push(card);
    } else {
      toUpdate.push({ id: +id, ...card });
    }
  }

  // Update existing cards
  if (toUpdate.length > 0) {
    for (const card of toUpdate) {
      const { id, ...fields } = card;
      const { error } = await supabase
        .from('cards')
        .update(fields)
        .eq('id', id);
      if (error) console.error('update error:', error);
    }
  }

  // Add new cards
  if (toInsert.length > 0) {
    const { error } = await supabase.from('cards').insert(toInsert);
    if (error) console.error('insert error:', error);
  }

  return redirect(`/flash-cards/${params.id}`);
}

export default function EditFlashCards({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { isAnonymous } = loaderData;
  const navigate = useNavigate();

  const [currentFlashCards, setCurrentFlashCards] = useState<
    { id: string; question: string; answer: string }[]
  >(
    loaderData.cardsData
      ? loaderData.cardsData
      : [{ id: 'new-0', question: '', answer: '' }],
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // initial id is equal to those in db
  const initialIds = useRef(
    new Set(loaderData?.cardsData?.map((card: any) => card.id) ?? []),
  );

  const nextTempId = useRef(0);

  function addFlashCard() {
    nextTempId.current++;
    setCurrentFlashCards(prevState => [
      ...prevState,
      { id: `new-${nextTempId.current}`, question: '', answer: '' },
    ]);
  }

  function updateFlashCard(id: string, field: string, newValue: string) {
    setCurrentFlashCards(prevState =>
      prevState.map(flashCard =>
        flashCard.id === id ? { ...flashCard, [field]: newValue } : flashCard,
      ),
    );
  }

  function removeFlashCard(id: string) {
    setCurrentFlashCards(prevState =>
      prevState.filter(flashCard => flashCard.id !== id),
    );
    // save only those cards to delete which are already in db
    // new ones aren't in db, so there no need for them
    if (initialIds.current.has(id)) {
      setDeletedIds(prev => [...prev, id]);
    }
  }

  function handleDeleteCategory(event: MouseEvent<HTMLButtonElement>) {
    // Insted of that add confirmation modal
    const confirmed = window.confirm(
      'Are you sure you want to delete this category and all its flashcards? This cannot be undone.',
    );
    if (!confirmed) {
      event.preventDefault();
      return;
    }

    if (!isAnonymous) return; // if the user is logged in and confirmed the deletion, go to action (do stuff on server), when anonymous delete locally

    event.preventDefault();

    const categories = JSON.parse(
      localStorage.getItem('flash-cards-group') ?? '[]',
    );
    const cards = JSON.parse(localStorage.getItem('cards') ?? '{}');

    const updatedCategories = categories.filter(
      (el: any) => el.id !== params.id,
    );
    delete cards[params.id!];

    localStorage.setItem(
      'flash-cards-group',
      JSON.stringify(updatedCategories),
    );
    localStorage.setItem('cards', JSON.stringify(cards));

    navigate('/dashboard');
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    if (!isAnonymous) return;
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newName = formData.get('name') as string;

    const categories = JSON.parse(
      localStorage.getItem('flash-cards-group') ?? '[]',
    );
    const cards = JSON.parse(localStorage.getItem('cards') ?? '{}');

    const updatedCategories = categories.map((el: any) =>
      el.id === params.id ? { ...el, name: newName } : el,
    );

    cards[params.id!] = currentFlashCards.map(({ question, answer }) => ({
      question,
      answer,
    }));

    localStorage.setItem(
      'flash-cards-group',
      JSON.stringify(updatedCategories),
    );
    localStorage.setItem('cards', JSON.stringify(cards));

    navigate('/flash-cards/' + params.id);
  }

  return (
    <Form
      method='post'
      onSubmit={handleSubmit}
      className='max-w-5xl mx-auto flex flex-col bg-white rounded-md py-4 px-8 my-30 shadow-md'
    >
      <div className='inline-flex flex-col'>
        <label htmlFor='name'>Category name</label>
        <input
          className='bg-blue-grey-050 rounded-md px-2 py-1 inset-shadow-sm'
          id='name'
          name='name'
          type='text'
          autoComplete='off'
          defaultValue={loaderData.categoryName}
        />
      </div>

      {/* Those inputs are neccessary so the cards to delete can get to the action to delete them */}
      {deletedIds.map(id => (
        <input key={id} type='hidden' name='deletedIds' value={id} />
      ))}

      <div className='flex flex-col gap-4 mt-4'>
        {currentFlashCards.map((flashCard, index) => (
          <div
            key={flashCard.id}
            className='flex justify-between items-end gap-32'
          >
            <fieldset className='w-full'>
              <legend>Flash card number {index + 1}</legend>
              <div className='flex gap-4'>
                <div className='flex flex-col w-full'>
                  <label htmlFor={`question-${flashCard.id}`}>Question</label>
                  <input
                    className='bg-blue-grey-050 rounded-md px-2 py-1 inset-shadow-sm w-full'
                    name={`question-${flashCard.id}`}
                    id={`question-${flashCard.id}`}
                    value={flashCard.question}
                    autoComplete='off'
                    onChange={e =>
                      updateFlashCard(
                        flashCard.id,
                        'question',
                        e.currentTarget.value,
                      )
                    }
                  />
                </div>
                <div className='flex flex-col w-full'>
                  <label htmlFor={`answer-${flashCard.id}`}>Answer</label>
                  <input
                    className='bg-blue-grey-050 rounded-md px-2 py-1 inset-shadow-sm w-full'
                    name={`answer-${flashCard.id}`}
                    id={`answer-${flashCard.id}`}
                    value={flashCard.answer}
                    autoComplete='off'
                    onChange={e =>
                      updateFlashCard(
                        flashCard.id,
                        'answer',
                        e.currentTarget.value,
                      )
                    }
                  />
                </div>
              </div>
            </fieldset>
            <button
              className='text-red-500 rounded-md duration-150 p-1 hover:text-red-600 cursor-pointer w-min'
              type='button'
              onClick={() => removeFlashCard(flashCard.id)}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='size-6'
              >
                <path
                  fillRule='evenodd'
                  d='M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        ))}

        <div className='flex gap-4 mt-4'>
          <button
            className='text-lg font-medium text-blue-800 bg-blue-050 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-blue-100'
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
          <button
            className='text-lg font-medium text-red-050 bg-red-600 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-red-500'
            type='submit'
            name='delete'
            value='delete-category'
            onClick={handleDeleteCategory}
          >
            Delete category
          </button>
        </div>
      </div>
    </Form>
  );
}
