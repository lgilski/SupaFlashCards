import type { ReactNode } from 'react';

export default function Feature({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className='flex flex-col gap-2 max-w-2xs'>
      <div className='p-2 rounded-md bg-teal-200 text-teal-900 grow-0 w-min'>
        {icon}
      </div>
      <h3 className='text-xl font-semibold text-teal-900'>{title}</h3>
      <p className='text-blue-grey-700'>{children}</p>
    </div>
  );
}
