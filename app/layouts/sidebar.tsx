import { Link, Outlet } from 'react-router';

export default function Sidebar() {
  return (
    <>
      <nav className='flex items-baseline justify-between px-4 py-2'>
        <Link to={'/'} className='font-semibold text-2xl'>
          <span className='text-teal-600'>Supa</span>FlashCards
        </Link>
        <div className='flex gap-8'>
          <Link to={'/flash-cards/create'}>Create flash cards</Link>
          <Link to={'/login'}>Log in</Link>
          <Link to={'/signup'}>Sign up</Link>
          <Link to={'/logout'}>Log out</Link>
        </div>
      </nav>
      <main className='bg-gray-50 h-full'>
        <Outlet />
      </main>
    </>
  );
}
