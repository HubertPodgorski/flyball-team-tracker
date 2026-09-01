import { getCurrentClub } from "../helpers/authToken";

// Component wrapper - see getCurrentClub for what "current club" means.
export const useCurrentClub = (): string | undefined => getCurrentClub();
