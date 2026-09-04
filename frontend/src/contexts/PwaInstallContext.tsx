import React, { createContext, useCallback, useEffect, useState } from "react";

// Chromium-only event - not in lib.dom.d.ts.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIosDevice = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS 13+ reports as "MacIntel" but is touch-capable, unlike an actual Mac.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandaloneDisplay = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari's own non-standard "added to home screen" flag.
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

interface PwaInstallContextValue {
  isStandalone: boolean;
  isIos: boolean;
  canPromptInstall: boolean;
  promptInstall: () => Promise<void>;
}

export const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined);

// beforeinstallprompt fires at most once per page load - capturing it here
// (not per-consumer) is what lets a later-mounted page still see it.
export const PwaInstallProvider = ({ children }: { children: React.ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Stops Chrome's own ambient mini-infobar so only our UI offers it.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // A captured prompt can only ever be used once, accepted or not.
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const value = {
    isStandalone,
    isIos: isIosDevice(),
    canPromptInstall: !!deferredPrompt,
    promptInstall,
  };

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
};
