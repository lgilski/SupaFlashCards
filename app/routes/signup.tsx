import { Form, redirect } from 'react-router';
import type { Route } from './+types/signup';
import { getServerClient } from '~/utils/supabase.server';

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = getServerClient(request);

  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return redirect('/login');
}

export default function SignUp() {
  return (
    <Form method='post'>
      <input name='email' id='email' type='email' />
      <input name='password' id='password' type='password' />
      <button type='submit'>Submit</button>
    </Form>
  );
}
