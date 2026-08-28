import { useContext } from "react";
import { SocketContext } from "../contexts/SocketContext";
import { Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket<any, any>;
}

export const useSocketContext = (): SocketContextType => {
  const context = useContext<SocketContextType | undefined>(SocketContext);

  if (context === undefined) {
    throw new Error("useSocketContext must be used within a SocketContextProvider");
  }

  return context;
};
