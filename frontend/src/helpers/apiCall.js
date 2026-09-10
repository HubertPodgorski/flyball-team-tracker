import axios from "axios";
import { notAuthenticatedRoutes } from "./routesAndPaths";

export const apiSuffix = import.meta.env.VITE_HTTPS_PROXY;

// 401 = bad token (permission issues are 403 instead). Log out and reload
// to /login so a rotated SECRET doesn't just leave the app silently broken.
let lastSuspendedNotice = 0;

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

    // The club was suspended (read-only) - a write just bounced. Announce it once, not once per blocked request.
    if (
      error.response?.status === 403 &&
      error.response.data?.error === "CLUB_SUSPENDED" &&
      Date.now() - lastSuspendedNotice > 5000
    ) {
      lastSuspendedNotice = Date.now();
      window.dispatchEvent(new CustomEvent("club-suspended"));
    }

    return Promise.reject(error);
  }
);
