/* офлайн-кэш оболочки + надёжное обновление (обход HTTP-кеша для HTML) */
const CACHE = "budget-v4";
const ASSETS = ["index.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))
      .catch(() => {})
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isNav = e.request.mode === "navigate" || e.request.destination === "document";
  // навигацию тянем мимо HTTP-кеша, чтобы свежий index приходил сразу
  const netReq = isNav ? new Request(e.request.url, { cache: "no-store" }) : e.request;
  e.respondWith(
    fetch(netReq)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
