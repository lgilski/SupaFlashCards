import { createClient } from '~/utils/supabase.server';
import type { Route } from './+types/home';
import { Link } from 'react-router';

// import { supabase } from '~/supabase';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { data, error } = await supabase.from('categories').select();

  if (error) {
    console.error(error);
  }

  return data;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const flashCards = loaderData;

  return (
    <section className='grid grid-cols-3 gap-4 mt-16 content-center'>
      {flashCards?.map(el => (
        <Link
          className='bg-teal-200 text-center align-middle'
          key={el.name}
          to={`flash-cards/${el.name}`}
        >
          {el.name}
        </Link>
      ))}
    </section>
  );
}
