import { Outlet } from 'react-router';

export default function Sidebar() {
  return (
    <main className='w-7xl mx-auto h-screen items-center justify-center'>
      <div>kasztan</div>
      <Outlet />
    </main>
  );
}
