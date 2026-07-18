import { useState } from 'react';
import type { Route } from './+types/flash-cards';
import { Form, Link } from 'react-router';
import { createClient } from '~/utils/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!params.name) {
    throw new Response('Not Found', { status: 404 });
  }

  const { supabase } = createClient(request);

  const { data, error } = await supabase
    .from('categories')
    .select(
      `
    name,
    data:cards (
      question,
      answer
    )
  `,
    )
    .eq('name', params.name)
    .single();

  if (!data) {
    throw new Response('There is no data', { status: 404 });
  }

  return data.data;
}

export default function FlashCards({ loaderData }: Route.ComponentProps) {
  const data = loaderData;
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  if (data.length < 1)
    return (
      <section>
        <div>Brak danych...</div>
        <Form action='edit'>
          <button type='submit'>Edit</button>
        </Form>
      </section>
    );

  function nextQuestion() {
    if (currentCard + 1 < data!.length) {
      setCurrentCard(prevState => prevState + 1);
      setShowAnswer(false);
    }
  }

  function previouseQuestion() {
    if (currentCard - 1 >= 0) {
      setCurrentCard(prevState => prevState - 1);
      setShowAnswer(false);
    }
  }

  return (
    <section className='flex flex-col gap-4 items-center'>
      <Form action='edit'>
        <button type='submit'>Edit</button>
      </Form>
      <div
        className={`flex justify-center items-center text-5xl text-center rounded-xl w-3xl h-96 p-2 bg-teal-050 border border-teal-700 text-teal-900`}
        onClick={() => setShowAnswer(prevState => !prevState)}
      >
        {showAnswer
          ? `Odpowiedź: ${data[currentCard].answer}`
          : data[currentCard].question}
      </div>
      <div>
        {currentCard + 1}/{data.length} cards
      </div>
      <div className='grid grid-cols-4 gap-8'>
        <button
          className='bg-teal-600 text-teal-100 px-4 py-2 rounded-xl'
          onClick={previouseQuestion}
        >
          Previouse
        </button>
        <button
          className='bg-blue-grey-600 text-blue-grey-100 px-4 py-2 rounded-xl'
          // onClick={nextQuestion}
        >
          Done
        </button>
        <button
          className='bg-yellow-600 text-yellow-100 px-4 py-2 rounded-xl'
          // onClick={nextQuestion}
        >
          Repeat
        </button>
        <button
          className='bg-teal-600 text-teal-100 px-4 py-2 rounded-xl'
          onClick={nextQuestion}
        >
          Next
        </button>
      </div>
    </section>
  );
}
