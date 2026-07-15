import { Form, redirect } from 'react-router';
import type { Route } from './+types/edit-flash-cards';
import { supabase } from '~/supabase';

export async function loader({ params }: Route.LoaderArgs) {
  // load this flash cards data
}

export async function action({ params, request }: Route.ActionArgs) {
  // delete/edit/delete cards

  // Work on postgre dana structure

  const fromData = await request.formData();
  const question = fromData.get('question');
  const answer = fromData.get('answer');

  const { data: categoriesWithCards, error } = await supabase.from('categories')
    .select(`
    name,
    data:cards (
      question,
      answer
    )
  `);

  console.log(categoriesWithCards);

  // const { data } = await supabase
  //   .from('flash-cards')
  //   .select()
  //   .eq('title', params.id);

  // console.log(data[0].data);

  return redirect(`/flash-cards/${params.id}`);
}

export default function EditFlashCards({ loaderData }: Route.ComponentProps) {
  return (
    <section>
      <div>EDIT MEE PLEEEEEEASE</div>
      <Form method='post'>
        <input className='bg-amber-100' name='question' />
        <input className='bg-amber-100' name='answer' />
        <button type='submit'>Submit</button>
      </Form>
    </section>
  );
}
