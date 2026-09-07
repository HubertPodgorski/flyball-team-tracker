import axios from "axios";
import { apiSuffix } from "./apiCall";
import { getAuthToken } from "./authToken";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export const fetchVapidPublicKey = async (): Promise<string> => {
  const { data } = await axios.get(
    `${apiSuffix}/push-subscriptions/vapid-public-key`,
    authHeaders()
  );

  return data.publicKey;
};

export const subscribeToPush = async (subscription: PushSubscriptionJSON): Promise<void> => {
  await axios.post(`${apiSuffix}/push-subscriptions`, subscription, authHeaders());
};

export const unsubscribeFromPush = async (endpoint: string): Promise<void> => {
  await axios.delete(
    `${apiSuffix}/push-subscriptions/${encodeURIComponent(endpoint)}`,
    authHeaders()
  );
};
