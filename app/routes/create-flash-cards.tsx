import { Form, redirect } from 'react-router';
import type { Route } from './+types/create-flash-cards';
import { supabase } from '~/supabase';
import { useState } from 'react';

// TODO: implement form checks before submiting. Give feedback to the user. Handle empty imputs.

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let name = formData.get('name');

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

  return redirect('/flash-cards/' + name);
}

let id = 1;
export default function CreateFlashCards() {
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

  return (
    <Form method='post'>
      <div className='inline-flex flex-col'>
        <label htmlFor='name'>Category name</label>
        <input className='bg-teal-100' name='name' type='text' />
      </div>
      <div className='flex flex-col gap-4'>
        {currentFlashCards.map((flashCard, index) => (
          <fieldset key={flashCard.id} className='flex'>
            <legend>Flash card number {index + 1}</legend>
            <div>
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
            <div>
              <label htmlFor={`answer-${flashCard.id}`}>Answer</label>
              <input
                className='bg-teal-100'
                name={`answer-${flashCard.id}`}
                id={`answer-${flashCard.id}`}
                value={flashCard.answer}
                onChange={e =>
                  updateFlashCard(flashCard.id, 'answer', e.currentTarget.value)
                }
              />
            </div>
            <button type='button' onClick={() => removeFlashCard(flashCard.id)}>
              Remove flash card
            </button>
          </fieldset>
        ))}
        <button type='button' onClick={addFlashCard}>
          Add flash card
        </button>
        <button type='submit'>Submit</button>
      </div>
    </Form>
  );
}
