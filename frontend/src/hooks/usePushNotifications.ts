import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "../helpers/pushHelpers";
import {
  fetchVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
} from "../helpers/pushSubscriptionsApi";

const isSupported = () => "Notification" in window && "serviceWorker" in navigator;

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported() ? Notification.permission : "denied"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported()) return;

    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();

      setIsSubscribed(!!subscription);
    });
  }, []);

  // Must run from a click handler - browsers ignore requestPermission()
  // calls not triggered by a direct user gesture.
  const subscribe = async (): Promise<boolean> => {
    if (!isSupported()) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const publicKey = await fetchVapidPublicKey();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // TS's BufferSource<ArrayBuffer> type is stricter than what a plain
      // Uint8Array satisfies, though it's exactly what the real API accepts.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    await subscribeToPush(subscription.toJSON() as PushSubscriptionJSON);
    setIsSubscribed(true);

    return true;
  };

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const { endpoint } = subscription;

      await subscription.unsubscribe();

      // Treat the UI as unsubscribed even if this fails - a stale DB row
      // self-cleans next time a push to it 404s/410s.
      unsubscribeFromPush(endpoint).catch(() => {});
    }

    setIsSubscribed(false);
  };

  return { isSupported: isSupported(), permission, isSubscribed, subscribe, unsubscribe };
};
