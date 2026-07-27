import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/login';
import { data, Form, redirect, useNavigate } from 'react-router';
import { createBrowserClient } from '@supabase/ssr';

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

export default function doLogin({ loaderData }: Route.ComponentProps) {
  const { env } = loaderData;
  const navigate = useNavigate();

  async function doLogin(event: React.SubmitEvent) {
    event.preventDefault();

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

    if (data.session) {
      navigate('/dashboard');
    }
  }

  return (
    <Form method='post' onSubmit={doLogin}>
      <input name='email' id='email' placeholder='Enter email' />
      <input name='password' id='password' placeholder='Enter password' />
      <button type='submit'>Submit</button>
    </Form>
  );
}
