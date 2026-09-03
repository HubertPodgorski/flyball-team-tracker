import { Dog, Lineup } from "./types";

export const LINEUP_MIN_DOGS = 2;
export const LINEUP_MAX_DOGS = 4;

// Flyball's max jump height - a dog with no measured height defaults to it
// for lineup calculations, so it never becomes the accidental limiting dog.
export const DEFAULT_JUMP_HEIGHT_CM = 35;

// A lineup jumps at its lowest dog's height.
export const getLineupJumpHeight = (dogs: Dog[]): number | undefined => {
  if (dogs.length === 0) return undefined;

  return Math.min(...dogs.map((dog) => dog.jumpHeight ?? DEFAULT_JUMP_HEIGHT_CM));
};

// "Super lineup (25cm)" - falls back to a translated placeholder name, and
// drops the height entirely for an empty (dog-less) lineup.
export const formatLineupLabel = (lineup: Lineup, fallbackName: string): string => {
  const name = lineup.name || fallbackName;
  const jumpHeight = getLineupJumpHeight(lineup.dogs);

  return jumpHeight === undefined ? name : `${name} (${jumpHeight}cm)`;
};
