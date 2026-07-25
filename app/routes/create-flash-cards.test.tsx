import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CreateFlashCards from './create-flash-cards';
import { createMemoryRouter, RouterProvider } from 'react-router';
import userEvent from '@testing-library/user-event';

// usuwanie kart, wpisywanie danych, dane do action są poprawne, jest przekierowanie do nowej strony, pojawiają się nowe pola

// Jest to potrzebne, bo Form jest w tym komponencie
// Żeby to działało jest potrzebny kontekst routera

// Musi być tego typu funkcja gdy: jest form, loader/action, i zachowanie po submicie
function renderCreateFlashCards() {
  // createMemoryRouter tworzy obiekt routera i daje potrzebny kontekst (route, nawigacja i kontekst dla form)
  const router = createMemoryRouter([
    {
      // Tutaj tworzy się fakeowe routing - tutaj mówimy, że jest tylko jedna ścieżka.
      // Gdyby test zależał od innych ścieżek, wpisałoby się tutaj inne ścieżki
      path: '/',
      // A to jest przykład przy nested strukturze
      // children: [{ path: ':id', element: <SomeComponent /> }],
      element: <CreateFlashCards />,
    },
  ]);

  // To łączy to co stworzył createMemoryRouter z drzewem renderu komponentu
  return render(<RouterProvider router={router} />);
}

describe('Test create flash cards', () => {
  test('renders a category name input', () => {
    renderCreateFlashCards();

    expect(screen.getByLabelText('Category name')).toBeInTheDocument();
  });

  test('creates empty flash card', () => {
    renderCreateFlashCards();

    expect(screen.getByText('Flash card number 1')).toBeInTheDocument();
  });

  test('can add flash cards', async () => {
    const user = userEvent.setup();
    renderCreateFlashCards();

    await user.click(screen.getByRole('button', { name: 'Add flash card' }));

    expect(screen.getByText('Flash card number 2')).toBeInTheDocument();
  });

  test.todo('can remove flash cards', async () => {
    const user = userEvent.setup();
    renderCreateFlashCards();

    await user.click(
      screen.getAllByRole('button', { name: 'Remove flash card' })[0],
    );

    // getBy gdy istnieje, queryBy gdy może nie istnieć
    expect(screen.queryByText('Flash card number 1')).not.toBeInTheDocument();
  });
  test.todo('can type in question and answer fields');
  test.todo('card name must be filled');
  test.todo('card question and answer must be filled');
});
