import { decodeJwtPayload } from "../helpers/jwt";

// Display-only: the active team currently encoded in the stored token.
// Distinct from the super-admin's own `team` on their user record, which
// never changes when they switch teams.
export const useCurrentTeam = (): string | undefined => {
  const userLocalstorage = localStorage.getItem("user");

  if (!userLocalstorage) return undefined;

  const { token } = JSON.parse(userLocalstorage);

  return decodeJwtPayload(token)?.team;
};
