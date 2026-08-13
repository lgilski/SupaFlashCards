import Button from '~/components/Button';
import type { Route } from './+types/forgot-password';
import { getServerClient } from '~/utils/supabase.server';
import { data, Form, useNavigation } from 'react-router';

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = getServerClient(request);
  const formData = await request.formData();
  const email = formData.get('email') as string;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.PUBLIC_SITE_URL}/update-password`,
  });

  return data({
    info: 'If an account exists for that email, a reset link has been sent.',
  });
}

export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className='flex flex-col mx-auto max-w-md bg-teal-200 rounded-md py-4 px-8 mt-30 shadow-md'>
      <h1 className='text-2xl text-center mb-4'>Reset your password</h1>

      {actionData?.info && (
        <p className='text-teal-800 text-sm text-center mb-2'>
          {actionData.info}
        </p>
      )}

      <Form className='flex flex-col gap-4' method='post'>
        <fieldset className='flex flex-col'>
          <label htmlFor='email'>Email</label>
          <input
            className='bg-teal-050 rounded-md px-2 py-1 inset-shadow-sm'
            name='email'
            id='email'
          />
        </fieldset>
        <button
          className='text-lg font-medium text-teal-050 bg-teal-600 px-4 py-2 rounded-md cursor-pointer duration-150 hover:bg-teal-500 disabled:opacity-50'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </Form>
    </div>
  );
}
