import { createRoutesStub } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Dashboard from './dashboard';
import { render, screen } from '@testing-library/react';
import { getServerClient } from '~/utils/supabase.server';
import { middleware as protectedMiddleware } from '~/layouts/protected';
import userEvent from '@testing-library/user-event';

vi.mock('~/utils/supabase.server.ts', () => ({
  getServerClient: vi.fn(),
}));

const mockedGetServerClient = vi.mocked(getServerClient);

function renderDashboard({
  data,
  userEmail,
}: {
  data: {
    id: string;
    name: string;
  }[];
  userEmail: string;
}) {
  const Stub = createRoutesStub([
    {
      path: '/dashboard',
      Component: Dashboard,
      loader() {
        return { data, userEmail };
      },
    },
  ]);

  render(<Stub initialEntries={['/dashboard']} />);
}

describe('Dashboard', () => {
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
        path: '/dashboard',
        middleware: [protectedMiddleware[0]] as never,
        Component: Dashboard,
      },
    ]);

    render(<Stub initialEntries={['/dashboard']} />);

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  test('displays card groups', async () => {
    renderDashboard({
      data: [
        { id: '1', name: 'Physics' },
        { id: '2', name: 'History' },
        { id: '3', name: 'Biology' },
      ],
      userEmail: 'kasztan@test.com',
    });

    expect(await screen.findByText('Physics')).toBeInTheDocument();
    expect(await screen.findByText('History')).toBeInTheDocument();
    expect(await screen.findByText('History')).toBeInTheDocument();
  });

  test('displays user email when logged in', async () => {
    renderDashboard({
      data: [
        { id: '1', name: 'Physics' },
        { id: '2', name: 'History' },
        { id: '3', name: 'Biology' },
      ],
      userEmail: 'kasztan@test.com',
    });

    expect(
      await screen.findByText('Welcome kasztan@test.com'),
    ).toBeInTheDocument();
  });

  test('displays Guest when logged in anonymously', async () => {
    renderDashboard({
      data: [
        { id: '1', name: 'Physics' },
        { id: '2', name: 'History' },
        { id: '3', name: 'Biology' },
      ],
      userEmail: '',
    });

    expect(await screen.findByText('Welcome Guest')).toBeInTheDocument();
  });

  test('redirects when clicked the category', async () => {
    const Stub = createRoutesStub([
      {
        path: '/flash-cards/:id',
        Component: () => <div>flash cards page</div>,
      },
      {
        path: '/dashboard',
        Component: Dashboard,
        loader() {
          return {
            data: [
              { id: '1', name: 'Physics' },
              { id: '2', name: 'History' },
              { id: '3', name: 'Biology' },
            ],
            userEmail: 'kasztan@test.com',
          };
        },
      },
    ]);

    render(<Stub initialEntries={['/dashboard']} />);

    const user = userEvent.setup();
    await user.click(await screen.findByText('Physics'));
    expect(await screen.findByText('flash cards page')).toBeInTheDocument();
  });
});
