import { useAuthContext } from "./useAuthContext";
import { Roles } from "../helpers/types";

export const useIsSuperAdmin = (): boolean => {
  const { user } = useAuthContext();

  return !!(
    user &&
    user.roles &&
    user.roles.length > 0 &&
    user.roles.includes(Roles.SUPER_ADMIN)
  );
};
