import React, { createContext, useState } from "react";
import { Dog, User } from "../helpers/types";
import { AuthContextType } from "./types";

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
  };

  const logout = () => {
    clearUserData();
  };

  const login = (user) => {
    setUser(user);
  };

  const setUserDogs = (dogs: Dog[]) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, dogs } : prevUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setUser,
        setUserDogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
