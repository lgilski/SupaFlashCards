import { data, Form, redirect, useNavigate } from 'react-router';
import type { Route } from './+types/create-flash-cards';
import { useState, type SubmitEvent } from 'react';
import { getServerClient } from '~/utils/supabase.server';
import { userContext } from '~/context';

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return { isAnonymous: user?.is_anonymous ?? false };
}

export async function action({ request }: Route.ActionArgs) {
  // Add error handling

  let formData = await request.formData();
  let name = formData.get('name') as string;

  const { supabase } = getServerClient(request);

  const { data: nameTaken, error: errorNameTaken } = await supabase
    .from('flash-cards-group')
    .select()
    .eq('name', name);

  if (nameTaken) {
    return data({ error: 'This name is already used by other group.' });
  }

  const { data: newCategoryData, error } = await supabase
    .from('flash-cards-group')
    .insert({ name })
    .select()
    .single();

  const ids = new Set();

  // Zrozumieć to do końca i skomentować
  for (const key of formData.keys()) {
    const match = key.match(/^(question|answer)-(\d+)$/);
    if (match) ids.add(match[2]);
  }

  const flashcards = [...ids].map(id => ({
    group_id: newCategoryData!.id,
    question: formData.get(`question-${id}`) as string,
    answer: formData.get(`answer-${id}`) as string,
  }));

  await supabase.from('cards').insert(flashcards);

  return redirect('/flash-cards/' + newCategoryData!.id);
}

let id = 1;
export default function CreateFlashCards({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [clientError, setClientError] = useState('');

  // Change the naming here
  const [showServerError, setShowServerError] = useState(true);

  const serverError = showServerError ? actionData?.error : null;
  const errorMessage = clientError || serverError;

  const { isAnonymous } = loaderData;

  const navigate = useNavigate();

  const [currentFlashCards, setCurrentFlashCards] = useState<
    { id: string; question: string; answer: string }[]
  >([{ id: '0', question: '', answer: '' }]);

  function addFlashCard() {
    setCurrentFlashCards(prevState => [
      ...prevState,
      { id: '' + id, question: '', answer: '' },
    ]);
    id++;
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
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    setClientError('');
    setShowServerError(false);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');

    if (!name) {
      event.preventDefault();
      setClientError('The group has to have a name.');
      setShowServerError(true);
      return;
    }

    if (!isAnonymous) return; // let the Form submit normally to the server action

    event.preventDefault();

    const categories = JSON.parse(
      localStorage.getItem('flash-cards-group') ?? '[]',
    );
    const cards = JSON.parse(localStorage.getItem('cards') ?? '{}');

    const nameTaken = categories.find((el: any) => el.name === name);

    if (nameTaken) {
      setClientError('This name is already used by other group.');
      setShowServerError(true);
      return;
    }

    const categoryId = crypto.randomUUID();

    const ids = new Set<string>();
    for (const key of formData.keys()) {
      const match = key.match(/^(question|answer)-(\d+)$/);
      if (match) ids.add(match[2]);
    }

    const flashcards = [...ids].map(id => ({
      question: formData.get(`question-${id}`) as string,
      answer: formData.get(`answer-${id}`) as string,
    }));

    categories.push({ id: categoryId, name });
    cards[categoryId] = flashcards;

    localStorage.setItem('flash-cards-group', JSON.stringify(categories));
    localStorage.setItem('cards', JSON.stringify(cards));

    navigate('/flash-cards/' + categoryId);
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
        <label htmlFor='name'>Category name</label>
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
        </div>
      </div>
    </Form>
  );
}
