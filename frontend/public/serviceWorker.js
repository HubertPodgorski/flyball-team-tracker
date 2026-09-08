self.addEventListener("install", (event) => {
  console.log("Service worker installed");
  self.skipWaiting(); // without this, an updated file sits idle until every tab closes
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  event.waitUntil(clients.claim()); // take over already-open tabs immediately, not just new ones
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
      eventId: notificationData.eventId,
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
  const eventId = event.notification.data?.eventId;
  // Calendar page is reachable by every role, unlike the trainer-only Events page.
  const targetUrl = eventId
    ? `${rootUrl}user-panel/calendar?eventId=${eventId}`
    : `${rootUrl}user-panel/calendar`;

  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(async (matchedClients) => {
      const existing = matchedClients.find((client) => client.url.indexOf(rootUrl) >= 0);

      if (existing) {
        try {
          const navigated = await existing.navigate(targetUrl);

          if (navigated) return navigated.focus();
        } catch (error) {
          // Some browsers refuse navigate() on an inactive client - fall
          // through to opening a fresh, correctly-routed tab instead.
        }
      }

      const opened = await clients.openWindow(targetUrl);

      if (opened) return opened.focus();
    })
  );
});
