import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlashCards from './flash-cards';
import { middleware as protectedMiddleware } from '../layouts/protected';
import { getServerClient } from '~/utils/supabase.server';

// Whenever any code in this test file imports from supabase.server,
// give it this fake module instead of the real one.
vi.mock('~/utils/supabase.server', () => ({
  getServerClient: vi.fn(),
}));

const mockedGetServerClient = vi.mocked(getServerClient);

function renderFlashCards(cards: { question: string; answer: string }[]) {
  const Stub = createRoutesStub([
    {
      path: '/flash-cards/:id',
      Component: FlashCards,
      loader() {
        return { data: cards, groupName: 'Science', isAnonymous: false };
      },
      HydrateFallback: () => <div>Loading...</div>,
    },
  ]);

  render(<Stub initialEntries={['/flash-cards/1']} />);
}

describe('FlashCards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('redirects to the login page when the user is not authenticated', async () => {
    mockedGetServerClient.mockReturnValue({
      supabase: {
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: null }),
        },
      },
      headers: new Headers(),
    } as never);

    const Stub = createRoutesStub([
      { path: '/login', Component: () => <div>Login page</div> },
      {
        path: '/flash-cards/:id',
        // protectedMiddleware[0]'s type is generated specifically for its own route
        // file, which is structurally incompatible with createRoutesStub's generic
        // middleware type (differs only in how strictly `next`'s return type is
        // declared) — safe to cast.
        middleware: [protectedMiddleware[0]] as never,
        Component: FlashCards,
        HydrateFallback: () => <div>Loading...</div>,
      },
    ]);

    render(<Stub initialEntries={['/flash-cards/1']} />);

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  test('shows a message when there are no cards', async () => {
    renderFlashCards([]);

    expect(
      await screen.findByText("Flash cards for 'Science' are missing"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Edit flash cards' }),
    ).toBeInTheDocument();
  });

  test('shows the answer on click and the question on another click', async () => {
    const user = userEvent.setup();
    renderFlashCards([{ question: 'What is React?', answer: 'A UI library.' }]);

    expect(await screen.findByText('What is React?')).toBeInTheDocument();

    await user.click(screen.getByText('What is React?'));

    expect(
      await screen.findByText('Answer: A UI library.'),
    ).toBeInTheDocument();

    await user.click(screen.getByText('Answer: A UI library.'));

    expect(await screen.findByText('What is React?')).toBeInTheDocument();
  });

  test('shows the start-over button when there are no cards to repeat', async () => {
    const user = userEvent.setup();
    renderFlashCards([{ question: 'What is React?', answer: 'A UI library.' }]);

    await user.click(await screen.findByRole('button', { name: 'I know' }));

    expect(
      await screen.findByRole('button', { name: 'Start over' }),
    ).toBeInTheDocument();
  });

  test('shows the repeat-unlearned button and can restart the review from the repeated cards', async () => {
    const user = userEvent.setup();
    renderFlashCards([
      { question: 'Question 1', answer: 'Answer 1' },
      { question: 'Question 2', answer: 'Answer 2' },
    ]);

    await user.click(await screen.findByRole('button', { name: 'To repeat' }));
    await user.click(await screen.findByRole('button', { name: 'I know' }));

    expect(
      await screen.findByRole('button', { name: 'Repeat unlearned' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Repeat unlearned' }));

    expect(await screen.findByText('Question 1')).toBeInTheDocument();
  });
});
