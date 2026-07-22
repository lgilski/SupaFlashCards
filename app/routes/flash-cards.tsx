import { useState } from 'react';
import type { Route } from './+types/flash-cards';
import { Form, Link } from 'react-router';
import { createClient } from '~/utils/supabase.server';

function shuffle(array: any[]) {
  const arrayToShufle = structuredClone(array);
  let currentIndex = arrayToShufle.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [arrayToShufle[currentIndex], arrayToShufle[randomIndex]] = [
      arrayToShufle[randomIndex],
      arrayToShufle[currentIndex],
    ];
  }

  return arrayToShufle;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response('Not Found', { status: 404 });
  }

  const { supabase } = createClient(request);

  const { data, error } = await supabase
    .from('categories')
    .select(
      `
    id,
    data:cards (
      question,
      answer
    )
  `,
    )
    .eq('id', params.id)
    .single();

  if (!data) {
    throw new Response('There is no data', { status: 404 });
  }

  return data.data;
}

// Add randomized order of those flash cards
export default function FlashCards({ loaderData }: Route.ComponentProps) {
  const data = loaderData;
  const [cardsToDisplay, setCardsToDisplay] = useState<
    { question: string; answer: string }[]
  >(shuffle(data));

  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  const [cardsToRepeat, setCardsToRepeat] = useState<
    { question: string; answer: string }[]
  >([]);

  if (cardsToDisplay.length < 1)
    return (
      <section>
        <div>Brak danych...</div>
        <Form action='edit'>
          <button type='submit'>Edit</button>
        </Form>
      </section>
    );

  function nextQuestion() {
    if (currentCard + 1 <= cardsToDisplay.length) {
      setCurrentCard(prevState => prevState + 1);
      setShowAnswer(false);
    }
  }

  function addToRepeat() {
    setCardsToRepeat(prevState => [...prevState, cardsToDisplay[currentCard]]);

    nextQuestion();
  }

  function repeatCards() {
    setCardsToDisplay(shuffle(cardsToRepeat));
    setCardsToRepeat([]);
    setCurrentCard(0);
  }

  function startOver() {
    setCardsToDisplay(shuffle(data));
    setCardsToRepeat([]);
    setCurrentCard(0);
  }

  if (currentCard === cardsToDisplay.length) {
    return (
      <section className='flex flex-col gap-4 items-center'>
        {cardsToRepeat.length > 0 && (
          <button onClick={repeatCards}>Repeat unlearned cards</button>
        )}
        <button onClick={startOver}>Start over</button>
      </section>
    );
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
          ? `Odpowiedź: ${cardsToDisplay[currentCard].answer}`
          : cardsToDisplay[currentCard].question}
      </div>
      <div>
        {currentCard + 1}/{cardsToDisplay.length} cards
      </div>
      <div className='grid grid-cols-2 gap-8'>
        <button
          className='bg-red-600 text-teal-100 px-4 py-2 rounded-xl'
          onClick={addToRepeat}
        >
          To repeat
        </button>
        <button
          className='bg-teal-600 text-teal-100 px-4 py-2 rounded-xl'
          onClick={nextQuestion}
        >
          I know
        </button>
      </div>
    </section>
  );
}
