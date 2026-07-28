import { Form, redirect } from 'react-router';
import type { Route } from './+types/create-flash-cards';
import { useState, type SubmitEvent } from 'react';
import { getServerClient } from '~/utils/supabase.server';
import { userContext } from '~/context';

// TODO: implement form checks before submiting. Give feedback to the user. Handle empty inputs.

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

    window.location.href = `/flash-cards/${categoryId}`;
  }

  return (
    <Form method='post' onSubmit={handleSubmit} className='max-w-5xl mx-auto'>
      <div className='inline-flex flex-col'>
        <label htmlFor='name'>Category name</label>
        <input className='bg-teal-100' id='name' name='name' type='text' />
      </div>
      <div className='flex flex-col gap-4 mt-4'>
        {currentFlashCards.map((flashCard, index) => (
          <fieldset key={flashCard.id} className='flex justify-between'>
            <legend>Flash card number {index + 1}</legend>
            <div className='flex gap-4'>
              <div className='flex flex-col'>
                <label htmlFor={`question-${flashCard.id}`}>Question</label>
                <input
                  className='bg-teal-100'
                  name={`question-${flashCard.id}`}
                  id={`question-${flashCard.id}`}
                  value={flashCard.question}
                  onChange={e =>
                    updateFlashCard(
                      flashCard.id,
                      'question',
                      e.currentTarget.value,
                    )
                  }
                />
              </div>
              <div className='flex flex-col'>
                <label htmlFor={`answer-${flashCard.id}`}>Answer</label>
                <input
                  className='bg-teal-100'
                  name={`answer-${flashCard.id}`}
                  id={`answer-${flashCard.id}`}
                  value={flashCard.answer}
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
            <button
              className='text-red-500'
              type='button'
              onClick={() => removeFlashCard(flashCard.id)}
            >
              Remove flash card
            </button>
          </fieldset>
        ))}
        <button
          className='mx-auto bg-teal-100'
          type='button'
          onClick={addFlashCard}
        >
          Add flash card
        </button>
        <button type='submit'>Submit</button>
      </div>
    </Form>
  );
}
