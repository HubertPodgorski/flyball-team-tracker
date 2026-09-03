import axios from "axios";
import { notAuthenticatedRoutes } from "./routesAndPaths";

export const apiSuffix = import.meta.env.VITE_HTTPS_PROXY;

// 401 = bad token (permission issues are 403 instead). Log out and reload
// to /login so a rotated SECRET doesn't just leave the app silently broken.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const onAuthPage =
      window.location.pathname === notAuthenticatedRoutes.login ||
      window.location.pathname === notAuthenticatedRoutes.signup;

    if (error.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem("user");
      window.location.href = notAuthenticatedRoutes.login;
    }

    return Promise.reject(error);
  }
);
