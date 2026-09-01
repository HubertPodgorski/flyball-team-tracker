import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiSuffix } from "../helpers/apiCall";
import { getAuthToken } from "../helpers/authToken";
import { teamsQueryOptions } from "../queries/teams";
import { Team } from "../helpers/types";

// Live updates for entities migrated off socket.io.
const SseHandler = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const token = getAuthToken();

    if (!token) return;

    const source = new EventSource(`${apiSuffix}/stream?token=${token}`);

    source.addEventListener("squads_updated", (event: MessageEvent) => {
      const teams: Team[] = JSON.parse(event.data);

      queryClient.setQueryData(teamsQueryOptions().queryKey, teams);
    });

    return () => source.close();
  }, [user, queryClient]);

  return null;
};

export default SseHandler;
