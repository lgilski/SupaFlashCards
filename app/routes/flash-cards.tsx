import { useState } from 'react';
import { data, Form } from 'react-router';
import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/flash-cards';
import { userContext } from '~/context';
import Spinner from '~/components/Spinner';
import getErrorMessage from '~/utils/getErrorMessage';

function shuffle(array: any[], shuffle = true) {
  if (!shuffle) {
    return array;
  }

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
    throw data('Not Found', { status: 404 });
  }

  if (user?.is_anonymous) return null;

  const { supabase } = getServerClient(request);

  try {
    const { data: cardsData, error: cardsError } = await supabase
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

    if (!cardsData) {
      throw data('There is no data', { status: 404 });
    }

    if (cardsError) {
      throw data('Something went wrong.', { status: 500 });
    }

    return {
      data: cardsData.data,
      groupName: cardsData.name,
      isAnonymous: false,
    };
  } catch (error) {
    throw data(getErrorMessage(error), { status: 500 });
  }
}

export async function clientLoader({
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  const serverData = await serverLoader();
  if (serverData) return serverData; // logged-in user, server already handled it

  // anonymous — read from localStorage instead
  const cards = JSON.parse(localStorage.getItem('cards') ?? '{}');
  const groups = JSON.parse(localStorage.getItem('flash-cards-group') ?? '[]');
  const group = groups.find((c: any) => c.id === params.id);

  return {
    data: cards[params.id] ?? [],
    groupName: group?.name ?? '',
    isAnonymous: true,
  };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <Spinner />;
}

export default function FlashCards({ loaderData }: Route.ComponentProps) {
  const { data, groupName } = loaderData;
  const [triggerShuffle, setTriggerShuffle] = useState(false);
  const [cardsToDisplay, setCardsToDisplay] = useState<
    { question: string; answer: string }[]
  >(shuffle(data, triggerShuffle));

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
    setCardsToDisplay(shuffle(cardsToRepeat, triggerShuffle));
    setCardsToRepeat([]);
    setCurrentCard(0);
  }

  function startOver() {
    setCardsToDisplay(shuffle(data, triggerShuffle));
    setCardsToRepeat([]);
    setCurrentCard(0);
  }

  function shuffleChange() {
    // Its neccessary, because of the way that state gets updated. Without it the passed value would be delayed
    const newTriggerShuffle = !triggerShuffle;

    setTriggerShuffle(newTriggerShuffle);
    setCardsToDisplay(shuffle(data, newTriggerShuffle));
    setCardsToRepeat([]);
    setCurrentCard(0);
    setShowAnswer(false);
  }

  if (cardsToDisplay.length < 1) {
    return (
      <section className='max-w-3xl mx-auto flex flex-col items-center bg-white p-4 my-16 shadow-md h-80 justify-center'>
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
      <section className='max-w-3xl mx-auto flex flex-col items-center bg-white p-4 my-16 shadow-md h-80 justify-center'>
        {cardsToRepeat.length > 0 && (
          <button
            className='font-medium text-teal-800 bg-teal-100 px-2 py-1 rounded-md cursor-pointer duration-150 hover:bg-teal-200 mt-4 flex items-center gap-2'
            onClick={repeatCards}
          >
            Repeat unlearned
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='size-6'
            >
              <path d='M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z' />
              <path d='M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z' />
              <path d='M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z' />
            </svg>
          </button>
        )}
        <button
          className='font-medium text-teal-050 bg-teal-500 px-2 py-1 rounded-md cursor-pointer duration-150 hover:bg-teal-400 mt-4 flex items-center gap-2'
          onClick={startOver}
        >
          Start over
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='currentColor'
            className='size-6'
          >
            <path
              fillRule='evenodd'
              d='M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </section>
    );
  }

  return (
    <section className='max-w-3xl mx-auto flex flex-col gap-4 items-center bg-white p-4 my-16 shadow-md relative'>
      <div className='w-full flex gap-2'>
        <h2 className='font-semibold'>{groupName}</h2>
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
      <div className=''>
        <div>
          {currentCard + 1}/{cardsToDisplay.length} cards
        </div>
        <svg
          onClick={shuffleChange}
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='currentColor'
          className={`size-9 p-1 absolute right-6 -translate-y-7 rounded-full  ${triggerShuffle ? 'text-teal-100 bg-teal-600 hover:bg-teal-500' : 'text-blue-grey-600 bg-blue-grey-050 hover:bg-blue-grey-100'}`}
        >
          <path
            fillRule='evenodd'
            d='M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z'
            clipRule='evenodd'
          />
        </svg>
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
