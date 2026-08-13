import { data, Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/update-password';
import { getServerClient } from '~/utils/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const { supabase, headers } = getServerClient(request);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw redirect('/login', { headers });
    }
    // strip ?code= so a refresh doesn't try to re-exchange a used code
    return redirect('/update-password', { headers });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw redirect('/login', { headers });
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = getServerClient(request);
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const repeatPassword = formData.get('repeat-password') as string;

  if (password !== repeatPassword) {
    return data({ error: 'Passwords do not match' }, { headers });
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return data({ error: error.message }, { headers });
  }

  return redirect('/dashboard', { headers });
}

export default function UpdatePassword({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
      <h1 className='text-2xl text-center mb-4'>Set a new password</h1>

      {actionData?.error && (
        <p className='text-red-600 text-sm text-center mb-2' role='alert'>
          {actionData.error}
        </p>
      )}

      <Form className='flex flex-col gap-4' method='post'>
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
