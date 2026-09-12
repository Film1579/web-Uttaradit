/* sw.js — แคชทรัพยากรหลัก + offline fallback (network-first สำหรับ HTML) */
const V = "utt-v4";
const CORE = [
  "/", "/index.html", "/404.html",
  "/css/style.css", "/css/pages.css", "/css/responsive.css", "/css/preloader.css",
  "/js/config.js", "/js/data.js", "/js/api.js", "/js/shell.js", "/js/main.js", "/js/img-fallback.js",
  "/js/ui.js", "/js/fog.js", "/js/preloader.js",
  "/manifest.webmanifest", "/assets/favicon.svg",
  "/assets/icons/icon-192.png", "/assets/icons/icon-512.png", "/assets/icons/maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))) // อย่าให้ทรัพยากรใดล้มเหลวจนขัดขวางการติดตั้งทั้งหมด
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const { request } = e;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  if (request.mode === "navigate") {           // HTML: network-first
    e.respondWith(fetch(request).catch(() => caches.match("/404.html")));
    return;
  }
  e.respondWith(                               // Asset: cache-first
    caches.match(request).then(hit => hit || fetch(request).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(request, copy));
      return res;
    }).catch(() => hit))
  );
});


