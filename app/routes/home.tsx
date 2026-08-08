import { Link, redirect } from 'react-router';
import type { Route } from './+types/home';
import { getServerClient } from '~/utils/supabase.server';
import Button from '~/components/Button';
import ButtonLink from '~/components/ButtonLink';
import Feature from '~/components/Feature';

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
      <section className='w-full flex py-40 bg-teal-100 px-4 '>
        <div className='max-w-7xl mx-auto text-center'>
          <h1 className='font-bold text-6xl text-teal-900 tracking-tight max-sm:text-4xl'>
            Learn as you like
          </h1>
          <p className='mt-2 mb-4 text-lg text-blue-grey-700'>
            Here you can create "supa" flash cards which will help you study
          </p>
          <div className='flex gap-4 justify-center mt-6'>
            <ButtonLink color='tealDark' to={'/login'}>
              Get started
            </ButtonLink>
            <ButtonLink
              color='white'
              to='https://github.com/lgilski/SupaFlashCards'
            >
              Learn more
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className='max-w-5xl mx-auto py-20 max-md:px-4'>
        <h2 className='text-center text-2xl text-teal-900 font-bold'>
          Features
        </h2>
        <div className='grid grid-cols-3 gap-20 mt-8 max-sm:grid-cols-1 max-sm:justify-items-center'>
          <Feature
            title='Anonymous login'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='size-8'
              >
                <path
                  fillRule='evenodd'
                  d='M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z'
                  clipRule='evenodd'
                />
              </svg>
            }
          >
            Use the app without creating an account! You can create your flash
            cards locally loging in anonymously using the Supabase feature!
          </Feature>
          <Feature
            title='Saving data'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='size-8'
              >
                <path
                  fill-rule='evenodd'
                  d='M4.5 9.75a6 6 0 0 1 11.573-2.226 3.75 3.75 0 0 1 4.133 4.303A4.5 4.5 0 0 1 18 20.25H6.75a5.25 5.25 0 0 1-2.23-10.004 6.072 6.072 0 0 1-.02-.496Z'
                  clip-rule='evenodd'
                />
              </svg>
            }
          >
            But if you will decide to create an account, your flash cards will
            be stored in Supabase, so you can access those on different devices.
          </Feature>
          <Feature
            title='Repeating flash cards'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='size-8 '
              >
                <path d='M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z' />
                <path d='M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z' />
                <path d='M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z' />
              </svg>
            }
          >
            You can repeat the flash cards which causes you troubles to
            remember. Repeat till you know the answers as your own back pocket!
          </Feature>
        </div>
      </section>
    </>
  );
}
