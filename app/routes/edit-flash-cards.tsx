import { Form, redirect } from 'react-router';
import type { Route } from './+types/edit-flash-cards';
import { useRef, useState } from 'react';
import { createClient } from '~/utils/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const { data: categoryData } = await supabase
    .from('categories')
    .select()
    .eq('name', params.name)
    .single();

  const { data: cardsData } = await supabase
    .from('cards')
    .select()
    .eq('category_id', categoryData.id);

  return { cardsData, categoryName: params.name };
}

export async function action({ params, request }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  const { data: categoryData } = await supabase
    .from('categories')
    .select()
    .eq('name', params.name)
    .single();

  const formData = await request.formData();
  const newName = formData.get('name');

  if (newName !== params.name) {
    await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', categoryData.id);
  }

  // Usunięcie kart
  const deletedIds = formData.getAll('deletedIds') as string[];
  if (deletedIds.length > 0) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .in('id', deletedIds);
    if (error) console.error('delete error:', error);
  }

  // składanie pytań i odpowiedzi w pary
  const ids = new Set<string>();
  for (const key of formData.keys()) {
    const match = key.match(/^(question|answer)-(.+)$/);
    if (match) ids.add(match[2]);
  }

  // Rozdzielenie pomiędzy elementami do aktualizacji a elementami do dodania
  const toUpdate: {
    id: string;
    category_id: string;
    question: string;
    answer: string;
  }[] = [];
  const toInsert: { category_id: string; question: string; answer: string }[] =
    [];

  for (const id of ids) {
    const card = {
      category_id: categoryData.id,
      question: formData.get(`question-${id}`) as string,
      answer: formData.get(`answer-${id}`) as string,
    };
    if (id.startsWith('new-')) {
      toInsert.push(card);
    } else {
      toUpdate.push({ id, ...card });
    }
  }

  // Zaktualizuj istniejące karty
  if (toUpdate.length > 0) {
    for (const card of toUpdate) {
      const { id, ...fields } = card;
      const { error } = await supabase
        .from('cards')
        .update(fields)
        .eq('id', id);
      if (error) console.error('update error:', error);
    }
  }

  // Dodaj nowe karty
  if (toInsert.length > 0) {
    const { error } = await supabase.from('cards').insert(toInsert);
    if (error) console.error('insert error:', error);
  }

  return redirect(`/flash-cards/${newName}`);
}

export default function EditFlashCards({ loaderData }: Route.ComponentProps) {
  const [currentFlashCards, setCurrentFlashCards] = useState<
    { id: string; question: string; answer: string }[]
  >(
    loaderData.cardsData
      ? loaderData.cardsData
      : [{ id: 'new-0', question: '', answer: '' }],
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // początkowe id jest zgodne z tym z bazy danych
  const initialIds = useRef(
    new Set(loaderData?.cardsData?.map(card => card.id) ?? []),
  );

  // Generowanie tymczasowych id dla nowych elementów
  const nextTempId = useRef(0);

  function addFlashCard() {
    nextTempId.current++;
    setCurrentFlashCards(prevState => [
      ...prevState,
      { id: `new-${nextTempId.current}`, question: '', answer: '' },
    ]);
  }

  function updateFlashCard(id: string, field: string, newValue: string) {
    setCurrentFlashCards(prevState =>
      prevState.map(flashCard =>
        flashCard.id === id ? { ...flashCard, [field]: newValue } : flashCard,
      ),
    );
  }

  function removeFlashCard(id: string) {
    setCurrentFlashCards(prevState =>
      prevState.filter(flashCard => flashCard.id !== id),
    );
    // zapamiętać do usunięcia tylko te karty, które już są w bazie.
    // Nowo stworzone elementy jeszcze nie zostały dodane, także nie ma potrzeby zapisania tego.
    if (initialIds.current.has(id)) {
      setDeletedIds(prev => [...prev, id]);
    }
  }

  return (
    <Form method='post'>
      <div className='inline-flex flex-col'>
        <label htmlFor='name'>Category name</label>
        <input
          className='bg-teal-100'
          name='name'
          type='text'
          defaultValue={loaderData.categoryName}
        />
      </div>

      {/* Ten input jest potrzebny, aby karty do usunięcia dotarły do action i aby móc je usunąc z bazy */}
      {deletedIds.map(id => (
        <input key={id} type='hidden' name='deletedIds' value={id} />
      ))}

      <div className='flex flex-col gap-4'>
        {currentFlashCards.map((flashCard, index) => (
          <fieldset key={flashCard.id} className='flex'>
            <legend>Flash card number {index + 1}</legend>
            <div>
              <label htmlFor={`question-${flashCard.id}`}>Question</label>
              <input
                className='bg-teal-100'
                name={`question-${flashCard.id}`}
                id={`question-${flashCard.id}`}
                value={flashCard.question}
                onChange={e =>
                  updateFlashCard(
                    flashCard.id,
                    'question',
                    e.currentTarget.value,
                  )
                }
              />
            </div>
            <div>
              <label htmlFor={`answer-${flashCard.id}`}>Answer</label>
              <input
                className='bg-teal-100'
                name={`answer-${flashCard.id}`}
                id={`answer-${flashCard.id}`}
                value={flashCard.answer}
                onChange={e =>
                  updateFlashCard(flashCard.id, 'answer', e.currentTarget.value)
                }
              />
            </div>
            <button type='button' onClick={() => removeFlashCard(flashCard.id)}>
              Remove flash card
            </button>
          </fieldset>
        ))}
        <button type='button' onClick={addFlashCard}>
          Add flash card
        </button>
        <button type='submit'>Submit</button>
      </div>
    </Form>
  );
}
