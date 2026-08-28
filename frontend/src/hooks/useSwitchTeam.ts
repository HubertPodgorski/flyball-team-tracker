import { useState } from "react";
import axios from "axios";
import { useAuthContext } from "./useAuthContext";
import { apiSuffix } from "../helpers/apiCall";
import { getAuthErrorMessage } from "../helpers/authErrors";

export const useSwitchTeam = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthContext();

  const switchTeam = async (team: string) => {
    setLoading(true);
    setError(null);

    try {
      const { token } = JSON.parse(localStorage.getItem("user") || "{}");

      const { data } = await axios.post(`${apiSuffix}/users/switch-team`, {
        token,
        team,
      });

      localStorage.setItem("user", JSON.stringify(data));
      // new object reference from the network response - triggers the
      // socket to reconnect with the new token and refetch team-scoped data
      login(data.user);
    } catch (switchTeamError) {
      setError(getAuthErrorMessage(switchTeamError));
    } finally {
      setLoading(false);
    }
  };

  return { switchTeam, loading, error };
};
