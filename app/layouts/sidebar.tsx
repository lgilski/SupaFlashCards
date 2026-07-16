import { Link, Outlet } from 'react-router';

export default function Sidebar() {
  return (
    <>
      <nav className='flex items-center justify-between px-4 bg-teal-050 py-2'>
        <Link to={'/'} className='font-semibold text-2xl'>
          <span className='text-teal-600'>Supa</span>FlashCards
        </Link>
        <Link to={'/flash-cards/create'}>Create flash cards</Link>
      </nav>
      <main className='max-w-7xl mx-auto h-screen items-center justify-center'>
        <Outlet />
      </main>
    </>
  );
}
