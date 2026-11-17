// Life Quest — service worker. При обновлении приложения увеличьте номер версии.
const VERSION = "life-quest-v5";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./favicon.svg", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Страницы: сначала сеть, при отсутствии интернета — копия из кэша
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { caches.open(VERSION).then(c => c.put("./index.html", res.clone())); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Свои файлы и шрифты Google: из кэша, с фоновым обновлением
  if (url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") caches.open(VERSION).then(c => c.put(req, res.clone())); return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
