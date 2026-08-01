import type { FlashCardsByGroup, FlashCardsGroup } from '~/local.types';

export function getLocalGroups(): FlashCardsGroup {
  return JSON.parse(localStorage.getItem('flash-cards-group') ?? '[]');
}

export function getLocalCards(): FlashCardsByGroup {
  return JSON.parse(localStorage.getItem('cards') ?? '{}');
}

export function saveLocalGroups(groups: FlashCardsGroup) {
  localStorage.setItem('flash-cards-group', JSON.stringify(groups));
}

export function saveLocalCards(cards: FlashCardsByGroup) {
  localStorage.setItem('cards', JSON.stringify(cards));
}
