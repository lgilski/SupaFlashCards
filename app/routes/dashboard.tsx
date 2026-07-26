import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/dashboard';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = getServerClient(request);
  const { data, error } = await supabase.from('categories').select();

  if (error) {
    console.error(error);
  }

  return { data, userEmail: (await supabase.auth.getUser()).data.user?.email };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { data: flashCards, userEmail } = loaderData;

  return (
    <section className='max-w-7xl mx-auto grid grid-cols-3 gap-8 pt-16 content-center'>
      <div>Welcome {userEmail}</div>
      {/* Add graphics for each category/group */}
      {flashCards?.map(el => (
        <Link
          className='bg-teal-200 px-4 py-2 h-32 items-center justify-center flex text-xl rounded-xl transition-all duration-200 hover:-translate-y-1'
          key={el.name}
          to={`/flash-cards/${el.id}`}
        >
          {el.name}
        </Link>
      ))}
    </section>
  );
}
