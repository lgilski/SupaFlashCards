import { Form, redirect, useNavigate } from 'react-router';
import type { Route } from './+types/create-flash-cards';
import { useState, type SubmitEvent } from 'react';
import { getServerClient } from '~/utils/supabase.server';
import { userContext } from '~/context';

// TODO: implement form checks before submiting. Give feedback to the user. Handle empty inputs.
// implement the design

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return { isAnonymous: user?.is_anonymous ?? false };
}

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let name = formData.get('name');

  const { supabase } = getServerClient(request);

  const { data: newCategoryData } = await supabase
    .from('categories')
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
    category_id: newCategoryData.id,
    question: formData.get(`question-${id}`),
    answer: formData.get(`answer-${id}`),
  }));

  await supabase.from('cards').insert(flashcards);

  return redirect('/flash-cards/' + newCategoryData.id);
}

let id = 1;
export default function CreateFlashCards({ loaderData }: Route.ComponentProps) {
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
    if (!isAnonymous) return; // let the Form submit normally to the server action

    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');

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

    const categories = JSON.parse(localStorage.getItem('categories') ?? '[]');
    const cards = JSON.parse(localStorage.getItem('cards') ?? '{}');

    categories.push({ id: categoryId, name });
    cards[categoryId] = flashcards;

    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('cards', JSON.stringify(cards));

    navigate('/flash-cards/' + categoryId);
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
              className='text-red-500 bg-red-050 rounded-md px-2 py-1 duration-150 hover:bg-red-100 cursor-pointer w-60'
              type='button'
              onClick={() => removeFlashCard(flashCard.id)}
            >
              Remove flash card
            </button>
          </div>
        ))}

        <div className='flex gap-4 mt-4'>
          <button
            className='text-lg font-medium text-blue-800 bg-blue-050 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-blue-100'
            // className='text-lg font-medium text-blue-grey-800 bg-blue-grey-050 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-blue-grey-100'
            type='button'
            onClick={addFlashCard}
          >
            Add flash card
          </button>
          <button
            className='text-lg font-medium text-teal-050 bg-teal-600 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-teal-500'
            type='submit'
          >
            Submit
          </button>
        </div>
      </div>
    </Form>
  );
}
