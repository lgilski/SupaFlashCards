import { data, Form, redirect, useNavigate, useNavigation } from 'react-router';
import type { Route } from './+types/update-password';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

export async function loader() {
  return data({
    env: {
      SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
      SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    },
  });
}

export default function UpdatePassword({ loaderData }: Route.ComponentProps) {
  const { env } = loaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setErrorMessage('This reset link is invalid or has expired.');
      return;
    }

    const supabase = createBrowserClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
    );

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === 'PASSWORD_RECOVERY' ||
          (event === 'SIGNED_IN' && session)
        ) {
          setReady(true);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    const repeatPassword = formData.get('repeat-password') as string;

    if (password !== repeatPassword) {
      setErrorMessage('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    const supabase = createBrowserClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
    );
    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate('/dashboard');
  }

  if (errorMessage && !ready) {
    return (
      <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
        <p className='text-red-600 text-center'>{errorMessage}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
        <p className='text-center'>Verifying your reset link...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
      <h1 className='text-2xl text-center mb-4'>Set a new password</h1>
      {errorMessage && (
        <p className='text-red-600 text-sm text-center mb-2' role='alert'>
          {errorMessage}
        </p>
      )}
      <Form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <fieldset className='flex flex-col'>
          <label htmlFor='password'>New password</label>
          <input
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='password'
            id='password'
            type='password'
          />
        </fieldset>
        <fieldset className='flex flex-col'>
          <label htmlFor='repeat-password'>Repeat password</label>
          <input
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='repeat-password'
            id='repeat-password'
            type='password'
          />
        </fieldset>
        <button
          className='text-lg font-medium text-teal-050 bg-teal-600 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-teal-500 disabled:opacity-50'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update password'}
        </button>
      </Form>
    </div>
  );
}
