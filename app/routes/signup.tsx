import { Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/signup';
import { getServerClient } from '~/utils/supabase.server';
import { useEffect, useState } from 'react';

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = getServerClient(request);

  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // Handle a situation when the user already exists
  if (error) {
    throw error;
  }

  return redirect('/login');
}

export default function SignUp({ actionData }: Route.ComponentProps) {
  const [errorMessage, setErrorMessage] = useState();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Give feedback to the user. React to changes. Show, hide and change error messages

  // password check etc
  function handleSubmit() {}

  // useEffect(() => {
  //   if (actionData) setErrorMessage(actionData);
  // }, [actionData, setErrorMessage]);

  return (
    <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
      <h1 className='text-2xl text-center mb-4'>Sign up</h1>
      <Form
        className='flex flex-col gap-4'
        method='post'
        onSubmit={handleSubmit}
      >
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
        <fieldset className='flex flex-col'>
          <label htmlFor='repeat-password'>Repeat password</label>
          <input
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='repeat-password'
            id='repeat-password'
            type='password'
            placeholder='Repeat password'
          />
        </fieldset>
        <button
          className='text-lg font-medium text-teal-050
           bg-teal-600 px-4 py-2 rounded-md mt-2 cursor-pointer duration-150 hover:bg-teal-500'
          type='submit'
        >
          {isSubmitting ? 'Submiting...' : 'Submit'}
        </button>
      </Form>
    </div>
  );
}
