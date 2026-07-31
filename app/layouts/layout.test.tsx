import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { createRoutesStub } from 'react-router';
import Sidebar from './layout';

describe('Sidebar', () => {
  test('renders', () => {
    const Stub = createRoutesStub([
      {
        path: '/',
        Component: Sidebar,
        loader() {
          return { user: null };
        },
      },
    ]);

    render(<Stub initialEntries={['/']} />);

    expect(screen.getByText('FlashCards')).toBeInTheDocument();
  });
});
