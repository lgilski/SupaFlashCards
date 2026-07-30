import { useState } from 'react';
import { Form } from 'react-router';
import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/flash-cards';
import { userContext } from '~/context';

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

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const user = context.get(userContext);

  if (!params.id) {
    throw new Response('Not Found', { status: 404 });
  }

  if (user?.is_anonymous) return null;

  const { supabase } = getServerClient(request);

  const { data, error } = await supabase
    .from('flash-cards-group')
    .select(
      `
      id,
      name,
      data:cards (
        question,
        answer
        )
        `,
    )
    .eq('id', +params.id)
    .single();

  if (!data) {
    throw new Response('There is no data', { status: 404 });
  }

  return { data: data.data, categoryName: data.name, isAnonymous: false };
}

export async function clientLoader({
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  const serverData = await serverLoader();
  if (serverData) return serverData; // logged-in user, server already handled it

  // anonymous — read from localStorage instead
  const cards = JSON.parse(localStorage.getItem('cards') ?? '{}');
  const categories = JSON.parse(
    localStorage.getItem('flash-cards-group') ?? '[]',
  );
  const category = categories.find((c: any) => c.id === params.id);

  return {
    data: cards[params.id] ?? [],
    categoryName: category?.name ?? '',
    isAnonymous: true,
  };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function FlashCards({ loaderData }: Route.ComponentProps) {
  const { data, categoryName } = loaderData;
  const [cardsToDisplay, setCardsToDisplay] = useState<
    { question: string; answer: string }[]
  >(shuffle(data));

  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  const [cardsToRepeat, setCardsToRepeat] = useState<
    { question: string; answer: string }[]
  >([]);

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

  if (cardsToDisplay.length < 1) {
    return (
      <section className='max-w-3xl mx-auto flex flex-col items-center bg-white p-4 mt-16 shadow-md h-80 justify-center'>
        <h2 className='text-3xl font-semibold text-teal-900'>
          Flash cards are missing
        </h2>
        <p>Can you find them?</p>
        <Form action='edit'>
          <button
            className='font-medium text-teal-050 bg-teal-500 px-2 py-1 rounded-md cursor-pointer duration-150 hover:bg-teal-400 mt-4'
            type='submit'
          >
            Edit flash cards
          </button>
        </Form>
      </section>
    );
  }

  if (currentCard === cardsToDisplay.length) {
    return (
      <section className='max-w-3xl mx-auto flex flex-col items-center bg-white p-4 mt-16 shadow-md h-80 justify-center'>
        {cardsToRepeat.length > 0 && (
          <button
            className='font-medium text-blue-050 bg-blue-500 px-2 py-1 rounded-md cursor-pointer duration-150 hover:bg-blue-400 mt-4'
            onClick={repeatCards}
          >
            Repeat unlearned cards
          </button>
        )}
        <button
          className='font-medium text-teal-050 bg-teal-500 px-2 py-1 rounded-md cursor-pointer duration-150 hover:bg-teal-400 mt-4'
          onClick={startOver}
        >
          Start over
        </button>
      </section>
    );
  }

  return (
    <section className='max-w-3xl mx-auto flex flex-col gap-4 items-center bg-white p-4 mt-16 shadow-md'>
      <div className='w-full flex gap-2'>
        <h2 className='font-semibold'>{categoryName}</h2>
        <Form action='edit'>
          <button
            className='text-blue-grey-600 hover:text-blue-grey-700 cursor-pointer duration-150'
            type='submit'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='size-6'
            >
              <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z' />
              <path d='M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z' />
            </svg>
          </button>
        </Form>
      </div>
      <div
        className={`flex justify-center items-center text-4xl text-center rounded-md w-full h-96 p-2 bg-teal-050 border border-teal-700 text-teal-900`}
        onClick={() => setShowAnswer(prevState => !prevState)}
      >
        {showAnswer
          ? `Answer: ${cardsToDisplay[currentCard].answer}`
          : cardsToDisplay[currentCard].question}
      </div>
      <div>
        {currentCard + 1}/{cardsToDisplay.length} cards
      </div>
      <div className='grid grid-cols-2 gap-8'>
        <button
          className='text-lg bg-red-500 text-red-050 px-4 py-2 rounded-md cursor-pointer hover:bg-red-400 duration-150'
          onClick={addToRepeat}
        >
          To repeat
        </button>
        <button
          className='text-lg bg-teal-500 text-teal-050 px-4 py-2 rounded-md cursor-pointer hover:bg-teal-400 duration-150'
          onClick={nextQuestion}
        >
          I know
        </button>
      </div>
    </section>
  );
}
