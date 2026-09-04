import { useContext } from "react";
import { PwaInstallContext } from "../contexts/PwaInstallContext";

export const usePwaInstall = () => {
  const context = useContext(PwaInstallContext);

  if (context === undefined) {
    throw new Error("usePwaInstall must be used within a PwaInstallProvider");
  }

  return context;
};
