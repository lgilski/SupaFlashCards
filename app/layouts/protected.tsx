import { redirect, Outlet } from 'react-router';
import { userContext } from '~/context';
import type { Route } from './+types/protected';
import { getServerClient } from '~/utils/supabase.server';

export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    const { supabase, headers } = getServerClient(request);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw redirect('/login', { headers });
    }

    context.set(userContext, data.user);

    // Understand this part
    const response = await next();
    headers.forEach((value, key) => response.headers.append(key, value));
    return response;
  },
];

export default function ProtectedLayout() {
  return <Outlet />;
}
