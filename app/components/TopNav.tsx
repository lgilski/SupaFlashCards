import type { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { Link } from 'react-router';

export default function TopNav({
  user,
  hideAll = false,
}: {
  user: User | null;
  hideAll?: boolean;
}) {
  const [showMobileNav, setShowMobileNav] = useState(false);

  return (
    <nav className='flex items-baseline justify-between px-4 py-2 bg-white'>
      <Link to={user ? '/dashboard' : '/'} className='font-semibold text-2xl'>
        <span className='text-teal-600'>Supa</span>FlashCards
      </Link>
      {!hideAll && (
        <>
          <div className='flex gap-8 text-blue-grey-700 max-md:hidden'>
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
          <button
            className='md:hidden'
            onClick={() => setShowMobileNav(prevState => !prevState)}
          >
            {!showMobileNav ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='size-6'
              >
                <path
                  fillRule='evenodd'
                  d='M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='size-6'
              >
                <path
                  fillRule='evenodd'
                  d='M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </button>
        </>
      )}
    </nav>
  );
}
