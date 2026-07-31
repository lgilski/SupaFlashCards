import { Link, redirect } from 'react-router';
import type { Route } from './+types/home';
import { getServerClient } from '~/utils/supabase.server';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = getServerClient(request);

  const { data } = await supabase.auth.getUser();

  if (data.user) return redirect('/dashboard');

  return null;
}

export default function Home() {
  return (
    <section className='w-full flex py-40 bg-teal-100'>
      <div className='max-w-7xl mx-auto text-center'>
        <h1 className='font-bold text-4xl'>
          Welcome to <span className='text-teal-600'>Supa</span>FlashCards!
        </h1>
        <p className='mt-2 mb-4'>
          Here you can create "supa" flash cards so you can learn how you like
          :)
        </p>
      </div>
    </section>
  );
}
