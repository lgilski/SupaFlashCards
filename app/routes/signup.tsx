import { data, Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/signup';
import { getServerClient } from '~/utils/supabase.server';
import { useState, type SubmitEvent } from 'react';
import Button from '~/components/Button';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = getServerClient(request);
  const { data: userResponse, error } = await supabase.auth.getUser();

  if (error && error.message !== 'Auth session missing!') {
    return { error: error.message };
  }

  return null;
}
export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = getServerClient(request);
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // Passing headers because of the cookies provided by supabase auth
  if (error) {
    return data({ error: error.message }, { headers });
  }

  // When account already exists the identities length is equal to zero
  if (signUpData.user && signUpData.user.identities?.length === 0) {
    return data(
      {
        error:
          'An account with this email already exists. Try logging in instead.',
      },
      { headers },
    );
  }

  if (!signUpData.session) {
    return data(
      { error: 'Check your email to confirm your account.' },
      { headers },
    );
  }

  return redirect('/login', { headers });
}

export default function SignUp({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const loaderError = loaderData;

  const [clientError, setClientError] = useState('');
  const [showServerError, setShowServerError] = useState(true);

  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const serverError = showServerError ? actionData?.error : null;

  const errorMessage = clientError || serverError;

  function handleChange() {
    if (!showServerError) return;
    setShowServerError(false);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    setClientError('');
    setShowServerError(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    const repeatPassword = formData.get('repeat-password');

    if (repeatPassword !== password) {
      event.preventDefault();
      setClientError('Passwords do not match');
    }
  }

  if (loaderError) {
    return <div>{loaderError?.error}</div>;
  }

  return (
    <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
      <h1 className='text-2xl text-center mb-4'>Sign up</h1>

      {errorMessage && (
        <p className='text-red-600 text-sm text-center mb-2' role='alert'>
          {errorMessage}
        </p>
      )}

      <Form
        className='flex flex-col gap-4'
        method='post'
        onSubmit={handleSubmit}
      >
        <fieldset className='flex flex-col'>
          <label htmlFor='email'>Email</label>
          <input
            onChange={handleChange}
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='email'
            id='email'
            placeholder='Enter email'
          />
        </fieldset>
        <fieldset className='flex flex-col'>
          <label htmlFor='password'>Password</label>
          <input
            onChange={handleChange}
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='password'
            id='password'
            type='password'
            placeholder='Enter password'
          />
        </fieldset>
        <fieldset className='flex flex-col'>
          <label htmlFor='repeat-password'>Repeat password</label>
          <input
            onChange={handleChange}
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='repeat-password'
            id='repeat-password'
            type='password'
            placeholder='Repeat password'
          />
        </fieldset>
        <Button
          className='mt-2'
          color='tealDark'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submiting...' : 'Submit'}
        </Button>
      </Form>
    </div>
  );
}
