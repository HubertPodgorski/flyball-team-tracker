import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";
import { AuthContextType } from "../contexts/types";

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthContextProvider");
  }

  return context;
};
