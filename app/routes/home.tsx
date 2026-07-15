import { useState } from 'react';
import type { Route } from './+types/home';
import { cardsData } from '~/data';
import { Link } from 'react-router';

import { supabase } from '~/supabase';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export async function loader() {
  const { data, error } = await supabase.from('categories').select();

  if (error) {
    console.error(error);
  }

  return data;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const flashCards = loaderData;

  console.log(flashCards);

  return (
    <section className='inline-flex flex-col mt-16 gap-1'>
      <Link to={'/flash-cards/create'}>Crate flash cards</Link>
      {flashCards?.map(el => (
        <Link className='' key={el.name} to={`flash-cards/${el.name}`}>
          {el.name}
        </Link>
      ))}
    </section>
  );
}
