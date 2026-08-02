export interface FlashCardsGroupElement {
  id: string;
  name: string;
}

export interface FlashCardContent {
  question: string;
  answer: string;
}

// Record is for the situations where key is of type A and content of type B
// A = string
// B = FlashCardContent
export type FlashCardsByGroup = Record<string, FlashCardContent[]>;

export type FlashCardsGroup = FlashCardsGroupElement[];

export type FlatFlashCard = FlashCardContent & { id: string };
