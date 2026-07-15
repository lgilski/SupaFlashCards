import { useState } from 'react';
import { cardsData } from '~/data';
import type { Route } from './+types/flash-cards';
import { supabase } from '~/supabase';
import { Form, Link } from 'react-router';

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response('Not Found', { status: 404 });
  }

  // const cards = cardsData.find(el => el.name === params.id);

  // const { data, error } = await supabase
  //   .from('flash-cards')
  //   .select()
  //   .eq('title', params.id);

  // return data[0].data.length < 1 ? data[0].data : JSON.parse(data[0].data);
}

export default function FlashCards({ loaderData }: Route.ComponentProps) {
  const data = loaderData;
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  console.log(data);

  if (!data[0].question || !data[0].answer)
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
        className='flex justify-center items-center text-5xl text-center bg-amber-800 rounded-xl w-3xl h-96 p-2'
        onClick={() => setShowAnswer(prevState => !prevState)}
      >
        {!showAnswer
          ? data[currentCard].question
          : `Odpowiedź: ${data[currentCard].answer}`}
      </div>
      <div>
        {currentCard + 1}/{data.length} cards
      </div>
      <div className='flex gap-8'>
        <button className='bg-amber-600' onClick={previouseQuestion}>
          Previouse question
        </button>
        <button className='bg-amber-600' onClick={nextQuestion}>
          Next question
        </button>
      </div>
    </section>
  );
}
