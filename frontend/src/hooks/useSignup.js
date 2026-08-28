import { useAuthContext } from "./useAuthContext";
import { useState } from "react";
import axios from "axios";
import { userPaths } from "../helpers/routesAndPaths";
import { useNavigate } from "@tanstack/react-router";
import { apiSuffix } from "../helpers/apiCall";
import { getAuthErrorMessage } from "../helpers/authErrors";

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuthContext();

  const signup = async (name, email, password, teamCode) => {
    setLoading(true);
    setError(null);

    const data = {
      password,
      email,
      name,
      teamCode,
    };

    try {
      const { data: responseData } = await axios.post(
        `${apiSuffix}/users/signup`,
        data
      );

      localStorage.setItem("user", JSON.stringify(responseData));
      login(responseData.user);
      navigate({ to: userPaths.root });
    } catch (signupError) {
      setError(getAuthErrorMessage(signupError));
    } finally {
      setLoading(false);
    }
  };

  return { signup, loading, error };
};
