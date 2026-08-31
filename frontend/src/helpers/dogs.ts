import { Dog } from "./types";

// Resolves selected dog ids back to full Dog objects, dropping stale ids.
export const resolveDogsByIds = (dogIds: string[], dogs: Dog[]): Dog[] =>
  dogIds
    .map((dogId) => dogs.find(({ _id }) => _id === dogId))
    .filter((dog): dog is Dog => !!dog);
