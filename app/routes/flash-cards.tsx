import { useState } from 'react';
import { data, Form } from 'react-router';
import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/flash-cards';
import { userContext } from '~/context';
import Spinner from '~/components/Spinner';
import getErrorMessage from '~/utils/getErrorMessage';
import { shuffle } from '~/utils/shuffle';
import EmptyMessage from '~/components/flash-cards/EmptyMessage';
import RestartFlashCards from '~/components/flash-cards/RestartFlashCards';
import Button from '~/components/Button';

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
    return <EmptyMessage groupName={groupName} />;
  }

  if (currentCard === cardsToDisplay.length) {
    return (
      <RestartFlashCards
        cardsToRepeat={cardsToRepeat}
        repeatCards={repeatCards}
        startOver={startOver}
      />
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
        className={`flex justify-center items-center text-4xl text-center rounded-md w-full min-h-96 p-2 bg-teal-050 border border-teal-700 text-teal-900`}
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
        <Button
          color='redDark'

          onClick={addToRepeat}
        >
          Repeat
        </Button>
        <Button color='tealDark' onClick={nextQuestion}>
          I know
        </Button>
      </div>
    </section>
  );
}
