import { decodeJwtPayload } from "./jwt";

// Shared by every authenticated REST client.
export const getAuthToken = (): string => {
  const { token } = JSON.parse(localStorage.getItem("user") || "{}");

  return token;
};

// Differs from a super-admin's own `team` while impersonating.
export const getCurrentClub = (): string | undefined =>
  decodeJwtPayload(getAuthToken())?.team;
