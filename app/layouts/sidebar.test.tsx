import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Sidebar from './sidebar';
import { MemoryRouter } from 'react-router';

describe('Sidebar', () => {
  test('renders', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('FlashCards')).toBeInTheDocument();
  });
});
