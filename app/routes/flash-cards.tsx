import { useState } from 'react';
import { cardsData } from '~/data';
import type { Route } from './+types/flash-cards';

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response('Not Found', { status: 404 });
  }

  const cards = cardsData.find(el => el.name === params.id);

  return cards;
}

export default function FlashCards({ loaderData }: Route.ComponentProps) {
  const data = loaderData?.data;
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  if (!data) return <div>Brak danych...</div>;

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
