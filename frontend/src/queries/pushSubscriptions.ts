import { useMutation } from "@tanstack/react-query";
import {
  fetchVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPushNotification,
} from "../helpers/pushSubscriptionsApi";

// Not a useQuery/SSE pair - there's no live list of this shown anywhere,
// just a one-off fetch each time a subscribe attempt needs the key.
export const useVapidPublicKeyMutation = () =>
  useMutation({ mutationFn: fetchVapidPublicKey });

export const useSubscribeToPushMutation = () =>
  useMutation({ mutationFn: subscribeToPush });

export const useUnsubscribeFromPushMutation = () =>
  useMutation({ mutationFn: unsubscribeFromPush });

export const useSendTestPushNotificationMutation = () =>
  useMutation({ mutationFn: sendTestPushNotification });
