import { decodeJwtPayload } from "./jwt";

// Shared by every authenticated REST client.
export const getAuthToken = (): string => {
  const { token } = JSON.parse(localStorage.getItem("user") || "{}");

  return token;
};

// Falls back to `team` for pre-rename tokens.
export const getCurrentClub = (): string | undefined => {
  const payload = decodeJwtPayload(getAuthToken());

  return payload?.club ?? payload?.team;
};
