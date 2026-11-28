/* Malik Sports: lets the shop and the admin panel install like real apps.
   Shop pages always ask the network first, so customers get your newest products and prices.
   admin.html is never cached, so you always see live orders.
   If the internet is off, BOTH the shop and the admin app open the friendly offline page (offline.html)
   instead of a browser error. The offline page is saved on the phone the first time the app is opened online. */
var V = "ms-v3";
var OFFLINE = "offline.html";
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.add(new Request(OFFLINE, { cache: "reload" })).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== V; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); }));
});
function offlinePage() {
  return caches.match(OFFLINE).then(function (m) {
    return m || new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><body style='margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#08090a;color:#fff;font-family:sans-serif;text-align:center'><div><h2>INTERNET NAHI HAI</h2><p>Internet on kar ke dobara koshish karein.</p><button onclick='location.reload()' style='padding:14px 24px;border:0;border-radius:12px;background:#00fe66;font-weight:700'>Dobara koshish karein</button></div>", { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  });
}
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (r.mode === "navigate") {
    /* Opening the shop or the admin panel: live page if the internet works, otherwise the offline page. Pages are not kept on the phone, so nobody sees old prices or old orders. */
    e.respondWith(fetch(r).catch(offlinePage));
    return;
  }
  if (/admin\.html$/.test(u.pathname)) return;   /* admin files are never saved */
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var c = res.clone(); caches.open(V).then(function (x) { x.put(r, c); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) { return m || Response.error(); });
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
