import { useEffect, useState } from "react";
import { useAuthContext } from "./useAuthContext";
import { useIsSuperAdmin } from "./useIsSuperAdmin";
import { useDogsQuery } from "../queries/dogs";
import { Dog } from "../helpers/types";

interface Result {
  allDogs: Dog[];
  dogsToShow: Dog[];
  isSuperAdmin: boolean;
  pickedDogs: Dog[];
  setPickedDogIds: (ids: string[]) => void;
}

// Shared by My Dogs and Settings - a user sees only their own dogs; a super-admin has none, so they pick any instead.
export const useDogsToShow = (): Result => {
  const { user } = useAuthContext();
  const isSuperAdmin = useIsSuperAdmin();
  const { data: allDogs = [] } = useDogsQuery();
  const [pickedDogIds, setPickedDogIds] = useState<string[]>([]);
  const [ownDogs, setOwnDogs] = useState<Dog[]>(user?.dogs ?? []);

  // Derived fresh from the live query every render, not a pick-time snapshot - otherwise an edit elsewhere wouldn't show until reload.
  useEffect(() => {
    if (!user) return;

    const ownDogIds = user.dogs.map(({ _id }) => _id);

    setOwnDogs(
      allDogs
        .filter(({ _id }) => ownDogIds.includes(_id))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }, [user, allDogs]);

  const pickedDogs = allDogs.filter(({ _id }) => pickedDogIds.includes(_id));
  const dogsToShow = isSuperAdmin ? pickedDogs : ownDogs;

  return { allDogs, dogsToShow, isSuperAdmin, pickedDogs, setPickedDogIds };
};
