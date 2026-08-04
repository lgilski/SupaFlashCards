import { expect, test } from 'vitest';
import { shuffle } from './shuffle';

test('returns different array when shuffle true', () => {
  const arrayOne = [1, 2, 3, 4, 5, 6, 7, 8];
  const arrayTwo = ['test', 'cat', 'dog', 'foo', 'bar'];
  const arrayThree = [
    { name: 'Tomas', secondName: 'Smith' },
    { name: 'Cail', secondName: 'Newton' },
    { name: 'Will', secondName: 'Woodcroft' },
    { name: 'James', secondName: 'Wolf' },
    { name: 'Cristine', secondName: 'Adams' },
  ];

  const firstShuffeled = shuffle(arrayOne, true);
  const secondShuffeled = shuffle(arrayTwo, true);
  const thirdShuffeled = shuffle(arrayThree, true);

  expect(firstShuffeled).not.toEqual(arrayOne);
  expect(secondShuffeled).not.toEqual(arrayTwo);
  expect(thirdShuffeled).not.toEqual(arrayThree);
});

test('returns the same array when shuffle false', () => {
  const arrayOne = [1, 2, 3, 4, 5];
  const arrayTwo = ['test', 'cat', 'dog', 'foo'];
  const arrayThree = [
    { name: 'Tomas', secondName: 'Smith' },
    { name: 'Cail', secondName: 'Newton' },
    { name: 'Will', secondName: 'Woodcroft' },
  ];

  const firstShuffeled = shuffle(arrayOne, false);
  const secondShuffeled = shuffle(arrayTwo, false);
  const thirdShuffeled = shuffle(arrayThree, false);

  expect(firstShuffeled).toEqual(arrayOne);
  expect(secondShuffeled).toEqual(arrayTwo);
  expect(thirdShuffeled).toEqual(arrayThree);
});
