import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/login';
import { data, Form, Link, redirect, useNavigate } from 'react-router';
import { createBrowserClient } from '@supabase/ssr';
import { useState, type SubmitEvent } from 'react';
import type { Database } from '~/database.types';
import getErrorMessage from '~/utils/getErrorMessage';
import Button from '~/components/Button';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = getServerClient(request);

  try {
    const { data: userResponse, error: userError } =
      await supabase.auth.getUser();

    if (userError && userError.name !== 'AuthSessionMissingError') {
      return {
        error: userError.message,
        env: {
          SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
          SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
        },
      };
    }

    if (userResponse?.user) {
      throw redirect('/dashboard');
    }

    return data(
      {
        error: '',
        env: {
          SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
          SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
        },
      },
      { headers },
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    return data(
      {
        error: 'Unable to load the login page right now.',
        env: {
          SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
          SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
        },
      },
      { headers },
    );
  }
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { env, error: loaderError } = loaderData;
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function doLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const dataFields = Object.fromEntries(formData.entries());

    const supabase = createBrowserClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
    );

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: dataFields.email as string,
          password: dataFields.password as string,
        });

      if (signInError) {
        setErrorMessage(signInError.message);
        return;
      }

      if (data.session) {
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loginAnonymously(event: React.SubmitEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createBrowserClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
    );

    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loaderError) {
    return <div>{loaderError}</div>;
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
          <Link className='text-right' to={'/forgot-password'}>
            Forgot password?
          </Link>
        </fieldset>
        <Button
          className='mt-2'
          color='tealDark'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Submit'}
        </Button>
      </Form>
      <p className='text-center my-2'>or</p>
      <Form className='flex flex-col' method='post' onSubmit={loginAnonymously}>
        <Button color='white' type='submit' disabled={isSubmitting}>
          Log in anonymously
        </Button>
      </Form>
    </div>
  );
}
