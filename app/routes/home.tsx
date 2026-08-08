import { Link, redirect } from 'react-router';
import type { Route } from './+types/home';
import { getServerClient } from '~/utils/supabase.server';
import Button from '~/components/Button';
import ButtonLink from '~/components/ButtonLink';

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
    <>
      <section className='w-full flex py-40 bg-teal-100'>
        <div className='max-w-7xl mx-auto text-center'>
          <h1 className='font-bold text-6xl text-teal-900 tracking-tight'>
            Learn as you like
          </h1>
          <p className='mt-2 mb-4 text-lg text-blue-grey-700'>
            Here you can create "supa" flash cards which will help you study
          </p>
          <div className='flex gap-2 justify-center mt-6'>
            <ButtonLink to={'/login'} color='tealDark'>
              Get started
            </ButtonLink>
            <Button color='white'>Learn more</Button>
          </div>
        </div>
      </section>
      <section>
        Fetures Without loging in Saving data in db Repeating unlearned
      </section>
    </>
  );
}
