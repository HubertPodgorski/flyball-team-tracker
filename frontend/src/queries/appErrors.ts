import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchAppErrors, clearAppErrors } from "../helpers/appErrorsApi";

export const appErrorsQueryOptions = () =>
  queryOptions({ queryKey: ["appErrors"], queryFn: fetchAppErrors });

export const useAppErrorsQuery = () => useQuery(appErrorsQueryOptions());

export const useClearAppErrorsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearAppErrors,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appErrors"] }),
  });
};
