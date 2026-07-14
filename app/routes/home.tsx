import { useState } from 'react';
import type { Route } from './+types/home';
import { cardsData } from '~/data';
import { Link } from 'react-router';

import { createClient } from '@supabase/supabase-js';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export async function loader() {
  // tutaj z serwera

  const { data, error } = await supabase.from('instruments').select();

  return data;
  // return cardsData;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const flashCards = loaderData;

  console.log(flashCards);

  return (
    <section className='inline-flex flex-col mt-16 gap-1'>
      {/* {flashCards.map(el => (
        <Link className='' key={el.name} to={`flash-cards/${el.name}`}>
          {el.name}
        </Link>
      ))} */}
    </section>
  );
}
