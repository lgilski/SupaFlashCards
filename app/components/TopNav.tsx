import type { User } from '@supabase/supabase-js';
import { Link } from 'react-router';

export default function TopNav({ user }: { user: User | null }) {
  return (
    <nav className='flex items-baseline justify-between px-4 py-2 bg-white'>
      <Link to={user ? '/dashboard' : '/'} className='font-semibold text-2xl'>
        <span className='text-teal-600'>Supa</span>FlashCards
      </Link>
      <div className='flex gap-8 text-blue-grey-700'>
        {user ? (
          <>
            <Link to={'/dashboard'}>Go to dashboard</Link>
            <Link to={'/flash-cards/create'}>Create flash cards</Link>
            <Link to={'/logout'}>Log out</Link>
          </>
        ) : (
          <>
            <Link to={'/login'}>Log in</Link>
            <Link to={'/signup'}>Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
