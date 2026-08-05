import { createRoutesStub } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getServerClient } from '~/utils/supabase.server';
import EditFlashCards from './edit-flash-cards';
import { render, screen } from '@testing-library/react';
import { middleware as protectedMiddleware } from '~/layouts/protected';
import userEvent from '@testing-library/user-event';

vi.mock('~/utils/supabase.server', () => ({
  getServerClient: vi.fn(),
}));

const mockedGetServerClient = vi.mocked(getServerClient);

function renderFlashCards(
  cards: { id: string; question: string; answer: string }[],
) {
  const Stub = createRoutesStub([
    {
      path: '/flash-cards/:id/edit',
      Component: EditFlashCards,
      loader() {
        return { cardsData: cards, isAnonymous: false };
      },
    },
  ]);

  render(<Stub initialEntries={['/flash-cards/1/edit']} />);
}

describe('EditFlashCards', () => {
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
        path: '/flash-cards/:id/edit',
        // protectedMiddleware[0]'s type is generated specifically for its own route
        // file, which is structurally incompatible with createRoutesStub's generic
        // middleware type (differs only in how strictly `next`'s return type is
        // declared) — safe to cast.
        middleware: [protectedMiddleware[0]] as never,
        Component: EditFlashCards,
      },
    ]);

    render(<Stub initialEntries={['/flash-cards/1/edit']} />);

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });
  test('displayes inputs for existing flash cards', async () => {
    renderFlashCards([
      { id: '1', question: 'Q 1', answer: 'A 1' },
      { id: '2', question: 'Q 2', answer: 'A 2' },
    ]);

    expect(await screen.findByText('Flash card number 1')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Q 1')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('A 1')).toBeInTheDocument();

    expect(await screen.findByText('Flash card number 2')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Q 2')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('A 2')).toBeInTheDocument();
  });
  test('can edit question and answer', async () => {
    renderFlashCards([
      { id: '1', question: 'Q 1', answer: 'A 1' },
      { id: '2', question: 'Q 2', answer: 'A 2' },
    ]);

    const user = userEvent.setup();

    const questionInput = await screen.findByDisplayValue('Q 1');
    const answerInput = await screen.findByDisplayValue('A 1');

    await user.clear(questionInput);
    await user.type(questionInput, 'This is test question');

    await user.clear(answerInput);
    await user.type(answerInput, 'This is test answer');

    expect(
      await screen.findByDisplayValue('This is test question'),
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue('This is test answer'),
    ).toBeInTheDocument();
  });

  test('can delete flashcards', async () => {
    renderFlashCards([
      { id: '1', question: 'Q 1', answer: 'A 1' },
      { id: '2', question: 'Q 2', answer: 'A 2' },
    ]);

    const user = userEvent.setup();

    await user.click(await screen.findByLabelText('delete-flash-card-1'));

    expect(screen.queryByDisplayValue('Q 1')).not.toBeInTheDocument();
  });

  test('can add flashcards', async () => {
    renderFlashCards([
      { id: '1', question: 'Q 1', answer: 'A 1' },
      { id: '2', question: 'Q 2', answer: 'A 2' },
    ]);

    const user = userEvent.setup();

    await user.click(await screen.findByText('Add flash card'));

    expect(await screen.findByText('Flash card number 3')).toBeInTheDocument();
  });
});
