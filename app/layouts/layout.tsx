import { Outlet } from 'react-router';
import type { Route } from './+types/layout';
import { getServerClient } from '~/utils/supabase.server';
import TopNav from '~/components/TopNav';
import Footer from '~/components/Footer';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = getServerClient(request);

  const { data } = await supabase.auth.getUser();

  return { user: data.user };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <main className='flex min-h-screen flex-col justify-start'>
      <TopNav user={user} />
      <div className='h-full max-md:px-4'>
        <Outlet />
      </div>
      <Footer />
    </main>
  );
}
