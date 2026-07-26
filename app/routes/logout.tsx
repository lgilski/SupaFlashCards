import { getServerClient } from '~/utils/supabase.server';
import type { Route } from './+types/logout';
import { redirect } from 'react-router';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = getServerClient(request);
  supabase.auth.signOut();

  return redirect('/');
}
