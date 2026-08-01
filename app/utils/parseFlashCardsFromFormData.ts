export function parseFlashCardsFromFormData(formData: FormData) {
  const ids = new Set<string>();

  for (const key of formData.keys()) {
    // Matching names to the question-number or answer-number cnovention. If it matches that then the key gets returned but with additional stuff
    const match = key.match(/^(question|answer)-(.+)$/);

    // on index 2 there is a number at the end of question-number
    if (match) ids.add(match[2]);
  }

  // divide elements into those to add and those to update
  const toUpdate: { id: number; question: string; answer: string }[] = [];
  const toInsert: { question: string; answer: string }[] = [];

  for (const id of ids) {
    const card = {
      question: formData.get(`question-${id}`) as string,
      answer: formData.get(`answer-${id}`) as string,
    };
    if (id.startsWith('new-')) {
      toInsert.push(card);
    } else {
      toUpdate.push({ id: +id, ...card });
    }
  }

  return { toInsert, toUpdate };
}
