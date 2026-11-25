/* Malik Sports: lets the shop and the admin panel install like real apps.
   Shop pages always ask the network first, so customers get your newest products and prices.
   admin.html is never cached, so you always see live orders.
   If the internet is off, the shop opens a friendly offline page instead of a browser error. */
var V = "ms-v2";
var OFFLINE = "offline.html";
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.add(OFFLINE).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== V; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (/admin\.html$/.test(u.pathname)) {
    /* The admin panel is never saved on the phone (you always see live orders). With no internet it shows the friendly offline page. */
    if (r.mode === "navigate") e.respondWith(fetch(r).catch(function () { return caches.match(OFFLINE).then(function (m) { return m || Response.error(); }); }));
    return;
  }
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var c = res.clone(); caches.open(V).then(function (x) { x.put(r, c); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) {
      if (m) return m;
      if (r.mode === "navigate") return caches.match("./").then(function (h) { return h || caches.match(OFFLINE); });
      return Response.error();
    });
  }));
});
/* Tapping a notification opens (or focuses) the admin app on the orders screen. */
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var d = e.notification.data || {};
  var url = d.url || (self.registration.scope + "admin.html");
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.split("#")[0].split("?")[0] === url.split("#")[0].split("?")[0] && "focus" in c) return c.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
