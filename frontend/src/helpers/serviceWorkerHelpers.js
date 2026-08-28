export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    let url = import.meta.env.BASE_URL + "serviceWorker.js";
    return await navigator.serviceWorker.register(url, { scope: "/" });
  }

  throw Error("serviceworker not supported");
};

export const subscribe = async (socket, setSubscriptionDetails) => {
  const serviceWorker = await navigator.serviceWorker.ready;

  const push = await serviceWorker.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey:
      "BMvqn2yS-nL3Z5J6DeiHGCnP3nw72L21vyftP2YePMTnXIVMiBggqxkPFYpMYXKuKinLPE8IRRCYhiwbJMgHTh8",
  });

  socket.emit("save_subscription", push, (subscriptionDetails) => {
    if (subscriptionDetails) {
      setSubscriptionDetails(subscriptionDetails);
    }
  });
};
