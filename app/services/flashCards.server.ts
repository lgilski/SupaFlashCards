import type { SupabaseClient } from '@supabase/supabase-js';

export async function getGroupWithCards(
  supabase: SupabaseClient,
  groupId: number,
) {
  const { data: groupData, error: groupError } = await supabase
    .from('flash-cards-group')
    .select()
    .eq('id', groupId)
    .single();

  if (groupError) return { error: groupError.message };

  const { data: cardsData, error: cardsError } = await supabase
    .from('cards')
    .select()
    .eq('group_id', groupId);

  if (cardsError) return { error: cardsError.message };

  return { groupData, cardsData };
}

export async function deleteGroupAndCards(
  supabase: SupabaseClient,
  groupId: number,
) {
  const { error: cardsError } = await supabase
    .from('cards')
    .delete()
    .eq('group_id', groupId);
  if (cardsError) return { error: cardsError.message };

  const { error: groupError } = await supabase
    .from('flash-cards-group')
    .delete()
    .eq('id', groupId);
  if (groupError) return { error: groupError.message };

  return { error: null };
}

export async function updateGroupName(
  supabase: SupabaseClient,
  groupId: number,
  newName: string,
) {
  const { error } = await supabase
    .from('flash-cards-group')
    .update({ name: newName })
    .eq('id', groupId);
  return { error: error?.message ?? null };
}

export async function syncCards(
  supabase: SupabaseClient,
  groupId: number,
  {
    toInsert,
    toUpdate,
    deletedIds,
  }: {
    toInsert: { question: string; answer: string }[];
    toUpdate: { id: number; question: string; answer: string }[];
    deletedIds: number[];
  },
) {
  // Delete flash cards
  if (deletedIds.length > 0) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .in('id', deletedIds);
    if (error) return { error: error.message };
  }

  // Update existing cards
  for (const card of toUpdate) {
    const { id, ...fields } = card;
    const { error } = await supabase.from('cards').update(fields).eq('id', id);
    if (error) return { error: error.message };
  }

  // Add new cards
  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('cards')
      .insert(toInsert.map(card => ({ ...card, group_id: groupId })));
    if (error) return { error: error.message };
  }

  return { error: null };
}
