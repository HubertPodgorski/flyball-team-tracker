self.addEventListener("install", (event) => {
  console.log("Service worker installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
});

self.addEventListener("push", (event) => {
  const notificationData = JSON.parse(event.data.text());

  const options = {
    body: notificationData.body ?? "",
    icon: "./favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  //For root applications: just change "'./'" to "'/'"
  //Very important having the last forward slash on "new URL('./', location)..."
  const rootUrl = new URL("./", location).href;
  event.notification.close();
  event.waitUntil(
    clients.matchAll().then((matchedClients) => {
      for (let client of matchedClients) {
        if (client.url.indexOf(rootUrl) >= 0) {
          return client.focus();
        }
      }

      return clients.openWindow(rootUrl).then(function (client) {
        client.focus();
      });
    })
  );
});
