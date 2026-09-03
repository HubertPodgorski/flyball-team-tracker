import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClubCodes } from "../helpers/clubCodesApi";

export const clubCodesQueryOptions = () =>
  queryOptions({
    queryKey: ["club-codes"],
    queryFn: fetchClubCodes,
    // Same list all session, and needed before login exists to invalidate on.
    staleTime: Infinity,
    // This only powers an inline hint on the signup form (the server is the
    // real gate on submit either way - see SignupForm.jsx) - the default 3
    // retries with backoff would leave that hint stuck "loading" for several
    // seconds before giving up. One retry settles it quickly.
    retry: 1,
  });

export const useClubCodesQuery = () => useQuery(clubCodesQueryOptions());
