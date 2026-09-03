import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getCurrentClub } from "../helpers/authToken";
import {
  changeOwnPassword,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from "../helpers/usersApi";

export const usersQueryOptions = (club = getCurrentClub()) =>
  queryOptions({
    queryKey: ["users", club],
    queryFn: fetchUsers,
    enabled: !!club,
  });

export const useUsersQuery = () => useQuery(usersQueryOptions());

// No cache update on success - users_updated (SSE) is the source of truth.
export const useUpdateUserMutation = () =>
  useMutation({ mutationFn: updateUser });

export const useDeleteUserMutation = () =>
  useMutation({ mutationFn: deleteUser });

export const useChangeOwnPasswordMutation = () =>
  useMutation({ mutationFn: changeOwnPassword });

// Trainer, own club only - see superAdminApi's resetSuperAdminUserPassword
// for the cross-club equivalent.
export const useResetUserPasswordMutation = () =>
  useMutation({ mutationFn: resetUserPassword });
