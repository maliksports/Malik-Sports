/* Malik Sports: lets the shop install like an app and open when the internet is weak.
   Always asks the network first, so customers get your newest products and prices. */
var V = "ms-v1";
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== V; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || /admin\.html$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var c = res.clone(); caches.open(V).then(function (x) { x.put(r, c); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("./"); }); }));
});
