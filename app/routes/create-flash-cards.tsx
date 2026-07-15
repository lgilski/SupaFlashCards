import { data, Form, redirect } from 'react-router';
import type { Route } from './+types/create-flash-cards';
import { supabase } from '~/supabase';

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let title = formData.get('title');

  const { error } = await supabase.from('categories').insert({ name: title });

  if (error) {
    throw data('Record Not Found', { status: 404 });
  }

  return redirect('/');
}

export default function CreateFlashCards() {
  return (
    <Form method='post'>
      <input name='title' type='text' />
      <button type='submit'>submit</button>
    </Form>
  );
}
