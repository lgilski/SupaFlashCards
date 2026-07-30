import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/dashboard';
import { Link } from 'react-router';
import { userContext } from '~/context';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.get(userContext);

  if (user?.is_anonymous) return null;

  const { supabase } = getServerClient(request);
  const { data, error } = await supabase.from('flash-cards-group').select();

  if (error) {
    console.error(error);
  }

  return { data, userEmail: user?.email, isAnonymous: false };
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const serverData = await serverLoader();
  if (serverData) return serverData; // user is logged in

  const categories: { id: string; name: string }[] = JSON.parse(
    localStorage.getItem('flash-cards-group') ?? '[]',
  );
  return { data: categories, userEmail: '', isAnonymous: true };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { data: categories, userEmail } = loaderData;

  return (
    <section className='max-w-7xl mx-auto pt-16'>
      <h3 className='text-center text-xl'>
        Welcome {userEmail ? userEmail : 'Guest'}
      </h3>
      {/* Add graphics for each category/group?? */}
      {/* min-h-155 */}
      <div
        className={` bg-white rounded-md py-4 px-8 my-4 shadow-md min-h-80 ${categories && categories.length < 1 ? 'flex flex-col items-center justify-center' : 'grid grid-cols-3 gap-8 '}`}
      >
        {categories && categories.length < 1 && (
          <>
            <h2 className='text-3xl font-semibold text-teal-900'>
              There are no flash cards yet
            </h2>
            <p>You could try to create a new ones!</p>
            <Link
              to={'/flash-cards/create'}
              className='font-medium text-teal-050 bg-teal-500 px-2 py-1 rounded-md cursor-pointer duration-150 hover:bg-teal-400 mt-4'
            >
              Create flash cards
            </Link>
          </>
        )}
        {categories?.map(el => (
          <Link
            className='bg-teal-200 px-4 py-2 h-32 items-center justify-center flex text-xl rounded-xl transition-all duration-200 hover:-translate-y-1'
            key={el.id}
            to={`/flash-cards/${el.id}`}
          >
            {el.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
