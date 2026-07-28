import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/login';
import { data, Form, redirect, useNavigate } from 'react-router';
import { createBrowserClient } from '@supabase/ssr';
import { useState, type SubmitEvent } from 'react';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = getServerClient(request);
  const userResponse = await supabase.auth.getUser();

  if (userResponse?.data?.user) {
    throw redirect('/dashboard');
  }

  return data(
    {
      env: {
        SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
        SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      },
    },
    { headers },
  );
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { env } = loaderData;
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function doLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const dataFields = Object.fromEntries(formData.entries());

    const supabase = createBrowserClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dataFields.email as string,
      password: dataFields.password as string,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      navigate('/dashboard');
    }
  }

  async function loginAnonymously(event: React.SubmitEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createBrowserClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
    );

    setIsSubmitting(false);

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      navigate('/dashboard');
    }
  }

  return (
    <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
      <h1 className='text-2xl text-center mb-4'>Log in</h1>

      {errorMessage && (
        <p className='text-red-600 text-sm text-center mb-2' role='alert'>
          {errorMessage}
        </p>
      )}

      <Form className='flex flex-col gap-4' method='post' onSubmit={doLogin}>
        <fieldset className='flex flex-col'>
          <label htmlFor='email'>Email</label>
          <input
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='email'
            id='email'
            placeholder='Enter email'
          />
        </fieldset>
        <fieldset className='flex flex-col'>
          <label htmlFor='password'>Password</label>
          <input
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='password'
            id='password'
            type='password'
            placeholder='Enter password'
          />
        </fieldset>
        <button
          className='text-lg font-medium text-teal-050
           bg-teal-600 px-4 py-2 rounded-md mt-2 cursor-pointer duration-150 hover:bg-teal-500'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Submit'}
        </button>
      </Form>
      <p className='text-center my-2'>or</p>
      <Form className='flex flex-col' method='post' onSubmit={loginAnonymously}>
        <button
          className='text-lg font-medium text-blue-grey-800 bg-blue-grey-050 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-blue-grey-100'
          type='submit'
          disabled={isSubmitting}
        >
          Log in anonymously
        </button>
      </Form>
    </div>
  );
}
