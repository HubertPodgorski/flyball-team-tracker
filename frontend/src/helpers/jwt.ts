// Display-only decode - never trust this for authorization, the server
// verifies the token itself on every privileged action.
export const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};
