import { Link, Outlet } from 'react-router';
import type { Route } from './+types/sidebar';
import { getServerClient } from '~/utils/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = getServerClient(request);

  const { data } = await supabase.auth.getUser();

  return { user: data.user };
}

export default function Sidebar({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <>
      <nav className='flex items-baseline justify-between px-4 py-2'>
        <Link to={'/'} className='font-semibold text-2xl'>
          <span className='text-teal-600'>Supa</span>FlashCards
        </Link>
        <div className='flex gap-8'>
          {user ? (
            <>
              <Link to={'/dashboard'}>Go to dashboard</Link>
              <Link to={'/flash-cards/create'}>Create flash cards</Link>
              <Link to={'/logout'}>Log out</Link>
            </>
          ) : (
            <>
              <Link to={'/login'}>Log in</Link>
              <Link to={'/signup'}>Sign up</Link>
            </>
          )}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
