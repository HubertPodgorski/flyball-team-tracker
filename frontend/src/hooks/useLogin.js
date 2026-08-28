import { useAuthContext } from "./useAuthContext";
import { useState } from "react";
import axios from "axios";
import { userPaths } from "../helpers/routesAndPaths";
import { useNavigate } from "react-router-dom";
import { apiSuffix } from "../helpers/apiCall";
import { getAuthErrorMessage } from "../helpers/authErrors";

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuthContext();

  const innerLogin = async (email, password) => {
    setLoading(true);
    setError(null);

    const data = {
      password,
      email,
    };

    try {
      const { data: responseData } = await axios.post(
        `${apiSuffix}/users/login`,
        data
      );

      localStorage.setItem("user", JSON.stringify(responseData));
      login(responseData.user);
      navigate(userPaths.root);
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  return { login: innerLogin, loading, error };
};
