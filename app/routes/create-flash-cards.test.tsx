import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CreateFlashCards from './create-flash-cards';
import { createRoutesStub } from 'react-router';
import userEvent from '@testing-library/user-event';
import { getServerClient } from '~/utils/supabase.server';
import { middleware as protectedMiddleware } from '~/layouts/protected';

vi.mock('~/utils/supabase.server.ts', () => ({
  getServerClient: vi.fn(),
}));

const mockedGetServerClient = vi.mocked(getServerClient);

// usuwanie kart, wpisywanie danych, dane do action są poprawne, jest przekierowanie do nowej strony, pojawiają się nowe pola
function renderCreateFlashCards() {
  const Stub = createRoutesStub([
    {
      path: '/flash-cards/create',
      Component: CreateFlashCards,
      loader() {
        return { isAnonymous: false };
      },
      HydrateFallback: () => <div>Loading...</div>,
    },
  ]);

  render(<Stub initialEntries={['/flash-cards/create']} />);
}

describe('Test create flash cards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('user must be logged in, in other case redirect to the login page', async () => {
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
        path: '/flash-cards/create',
        middleware: [protectedMiddleware[0]] as never,
        Component: CreateFlashCards,
        HydrateFallback: () => <div>Loading...</div>,
      },
    ]);

    render(<Stub initialEntries={['/flash-cards/create']} />);

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });
  test('renders a group name input', async () => {
    renderCreateFlashCards();

    expect(await screen.findByLabelText('Group name')).toBeInTheDocument();
  });

  test('can add flash cards', async () => {
    const user = userEvent.setup();
    renderCreateFlashCards();

    await user.click(
      await screen.findByRole('button', { name: 'Add flash card' }),
    );

    expect(await screen.findByText('Flash card number 1')).toBeInTheDocument();
  });

  test('can remove flash cards', async () => {
    const user = userEvent.setup();
    renderCreateFlashCards();
    await user.click(
      await screen.findByRole('button', { name: 'Add flash card' }),
    );

    await user.click(await screen.findByLabelText('delete-flash-card-new-1'));

    // getBy when element exists, queryBy when element might not exist
    expect(screen.queryByText('Flash card number 1')).not.toBeInTheDocument();
  });
  test('can type in question and answer fields', async () => {
    const user = userEvent.setup();
    renderCreateFlashCards();

    await user.click(await screen.findByText('Add flash card'));

    const questionField = await screen.findByLabelText('question-new-1');
    const answerField = await screen.findByLabelText('answer-new-1');

    await user.type(questionField, 'Question');
    await user.type(answerField, 'Answer');

    expect(questionField).toHaveValue('Question');
    expect(answerField).toHaveValue('Answer');
  });
});
