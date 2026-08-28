import React, { createContext, useMemo } from "react";
import io from "socket.io-client";
import { useAuthContext } from "../hooks/useAuthContext";

export const SocketContext = createContext(undefined);

export const SocketContextProvider = ({ children }) => {
  const { user } = useAuthContext();

  const socket = useMemo(() => {
    const userLocalstorage = localStorage.getItem("user");

    return io.connect(
      `${process.env.REACT_APP_HTTPS_PROXY}${
        userLocalstorage ? `?token=${JSON.parse(userLocalstorage).token}` : ""
      }`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
