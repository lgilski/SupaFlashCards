// any[] is by design
export function shuffle(array: any[], shuffle = true) {
  if (!shuffle) {
    return array;
  }

  const arrayToShufle = structuredClone(array);
  let currentIndex = arrayToShufle.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [arrayToShufle[currentIndex], arrayToShufle[randomIndex]] = [
      arrayToShufle[randomIndex],
      arrayToShufle[currentIndex],
    ];
  }

  return arrayToShufle;
}
