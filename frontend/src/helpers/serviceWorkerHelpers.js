export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    let url = import.meta.env.BASE_URL + "serviceWorker.js";
    return await navigator.serviceWorker.register(url, { scope: "/" });
  }

  throw Error("serviceworker not supported");
};
