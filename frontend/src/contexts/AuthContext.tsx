import React, { createContext, useCallback, useMemo, useState } from "react";
import i18next from "i18next";
import { Dog, User } from "../helpers/types";
import { AuthContextType } from "./types";
import { queryClient } from "../queryClient";

// Every entity migrated to React Query - cleared on logout so the next
// login (possibly a different club) doesn't briefly show stale data.
const ENTITY_QUERY_KEYS = [
  "teams",
  "crossPasses",
  "dogTasks",
  "users",
  "events",
  "tasks",
  "dogs",
];

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const getInitialUser = (): User | null => {
  const userLocalstorage = localStorage.getItem("user");

  if (!userLocalstorage) return null;

  const { user, token } = JSON.parse(userLocalstorage);

  if (!token) {
    localStorage.removeItem("user");
    return null;
  }

  const parsedToken = JSON.parse(atob(token.split(".")[1]));

  if (parsedToken.exp * 1000 < new Date().getTime()) {
    localStorage.removeItem("user");
    return null;
  }

  return user;
};

// TODO: start using reducers and actions
export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    ENTITY_QUERY_KEYS.forEach((queryKey) =>
      queryClient.removeQueries({ queryKey: [queryKey] })
    );
  }, []);

  const login = useCallback((user) => {
    setUser(user);
  }, []);

  // Also patches the cached localStorage blob - a hard reload re-derives from that, not React state.
  const setUserDogs = useCallback((dogs: Dog[]) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, dogs } : prevUser));

    const userLocalstorage = localStorage.getItem("user");

    if (!userLocalstorage) return;

    const parsed = JSON.parse(userLocalstorage);

    localStorage.setItem(
      "user",
      JSON.stringify({ ...parsed, user: { ...parsed.user, dogs } })
    );
  }, []);

  // Also patches the cached localStorage blob - i18n reads language from there on next boot.
  const setUserLanguage = useCallback((language: "en" | "pl") => {
    setUser((prevUser) => (prevUser ? { ...prevUser, language } : prevUser));
    i18next.changeLanguage(language);

    const userLocalstorage = localStorage.getItem("user");

    if (!userLocalstorage) return;

    const parsed = JSON.parse(userLocalstorage);

    localStorage.setItem(
      "user",
      JSON.stringify({ ...parsed, user: { ...parsed.user, language } })
    );
  }, []);

  // Stable reference - SseHandler's reconnect effect depends on setUserDogs, and an unstable one reopened the connection on every broadcast it processed.
  const value = useMemo(
    () => ({ user, login, logout, setUser, setUserDogs, setUserLanguage }),
    [user, login, logout, setUserDogs, setUserLanguage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
