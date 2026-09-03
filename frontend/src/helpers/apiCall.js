import axios from "axios";
import { notAuthenticatedRoutes } from "./routesAndPaths";

export const apiSuffix = import.meta.env.VITE_HTTPS_PROXY;

// A 401 here only ever means "this token is bad" - missing, expired, or
// signed with a SECRET that's since changed (see decodeToken.js/
// requireSuperAdmin.js on the API side) - a permission problem returns 403
// instead, so this never misfires on e.g. viewing something you're not
// allowed to. Without this, a stale token just failed every request
// forever with no visible explanation - the user stayed on whatever page
// they were on, looking "logged in", while every load/save silently broke.
// Hard-navigating (not the router) is deliberate: a full reload is what
// actually clears React Query's in-memory cache and every component's
// state, not just localStorage - a soft redirect would leave stale
// "logged in" UI mounted behind the login form.
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
