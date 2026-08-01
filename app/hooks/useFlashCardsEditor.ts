import { useRef, useState } from 'react';

export function useFlashCardsEditor(
  initialCards: { id: string; question: string; answer: string }[],
) {
  const [currentFlashCards, setCurrentFlashCards] = useState(
    initialCards.length
      ? initialCards
      : [{ id: 'new-0', question: '', answer: '' }],
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // initial id is equal to those in db
  const initialIds = useRef(new Set(initialCards.map(card => card.id)));
  const nextTempId = useRef(0);

  function addFlashCard() {
    nextTempId.current++;
    setCurrentFlashCards(prev => [
      ...prev,
      { id: `new-${nextTempId.current}`, question: '', answer: '' },
    ]);
  }

  function updateFlashCard(
    id: string,
    field: 'question' | 'answer',
    newValue: string,
  ) {
    setCurrentFlashCards(prev =>
      prev.map(card =>
        card.id === id ? { ...card, [field]: newValue } : card,
      ),
    );
  }

  function removeFlashCard(id: string) {
    setCurrentFlashCards(prev => prev.filter(card => card.id !== id));

    // save only those cards to delete which are already in db
    // new ones aren't in db, so there is no need for them
    if (initialIds.current.has(id)) {
      setDeletedIds(prev => [...prev, id]);
    }
  }

  return {
    currentFlashCards,
    deletedIds,
    addFlashCard,
    updateFlashCard,
    removeFlashCard,
  };
}
