import React, { createContext, useState } from "react";
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

  const clearUserData = () => {
    setUser(null);
    localStorage.removeItem("user");
    ENTITY_QUERY_KEYS.forEach((queryKey) =>
      queryClient.removeQueries({ queryKey: [queryKey] })
    );
  };

  const logout = () => {
    clearUserData();
  };

  const login = (user) => {
    setUser(user);
  };

  // Also patches the cached localStorage blob, not just React state - a hard
  // navigation (page.goto in e2e, an actual browser reload for real users)
  // re-derives the initial `user` from that cached blob, not from whatever
  // this render's React state holds, so a dogs sync that only touched state
  // was invisible again the moment the page next reloaded.
  const setUserDogs = (dogs: Dog[]) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, dogs } : prevUser));

    const userLocalstorage = localStorage.getItem("user");

    if (!userLocalstorage) return;

    const parsed = JSON.parse(userLocalstorage);

    localStorage.setItem(
      "user",
      JSON.stringify({ ...parsed, user: { ...parsed.user, dogs } })
    );
  };

  // Also patches the cached localStorage blob, not just React state - i18n
  // reads the language from there synchronously on the next app boot.
  const setUserLanguage = (language: "en" | "pl") => {
    setUser((prevUser) => (prevUser ? { ...prevUser, language } : prevUser));
    i18next.changeLanguage(language);

    const userLocalstorage = localStorage.getItem("user");

    if (!userLocalstorage) return;

    const parsed = JSON.parse(userLocalstorage);

    localStorage.setItem(
      "user",
      JSON.stringify({ ...parsed, user: { ...parsed.user, language } })
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setUser,
        setUserDogs,
        setUserLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
