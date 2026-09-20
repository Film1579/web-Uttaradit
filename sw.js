/* sw.js — แคชทรัพยากรหลัก + offline fallback (network-first สำหรับ HTML และ data/*.json)
   หมายเหตุ (ข้อ 14 ของ requirement): data/*.json คือแหล่งข้อมูลกลางที่ Admin แก้ไขจริง
   ต้องไม่ถูก cache-first เหมือน asset ทั่วไป มิฉะนั้นผู้ใช้จะเห็นข้อมูลเก่าค้างนานโดยไม่จำเป็น
   จึงตรวจแยกเส้นทาง /data/*.json ออกมาใช้กลยุทธ์ network-first เหมือน HTML */
const V = "utt-v10";   // v10: เพิ่มระบบสองภาษา (js/i18n.js, js/i18n-dict.js) + ฟิลด์ *_en ใน data/*.json
const CORE = [
  "./", "./index.html", "./404.html",
  "./css/style.css", "./css/pages.css", "./css/responsive.css", "./css/preloader.css", "./css/home-local.css",
  "./js/i18n-dict.js", "./js/i18n.js", "./js/config.js", "./js/data.js", "./js/data-loader.js", "./js/api.js", "./js/shell.js", "./js/main.js", "./js/cookie-consent.js", "./js/img-fallback.js",
  "./js/ui.js", "./js/fog.js", "./js/preloader.js", "./js/home-local-showcase.js",
  "./manifest.webmanifest", "./assets/favicon.svg",
  "./assets/icons/icon-192.png", "./assets/icons/icon-512.png", "./assets/icons/maskable-512.png",
  "./assets/img/home-local/square/local-01-square.svg", "./assets/img/home-local/square/local-02-square.svg",
  "./assets/img/home-local/square/local-03-square.svg", "./assets/img/home-local/square/local-04-square.svg",
  "./assets/img/home-local/square/local-05-square.svg", "./assets/img/home-local/square/local-06-square.svg",
  "./assets/img/home-local/square/local-07-square.svg",
  "./assets/img/home-local/featured/local-01-featured.svg", "./assets/img/home-local/featured/local-02-featured.svg",
  "./assets/img/home-local/featured/local-03-featured.svg", "./assets/img/home-local/featured/local-04-featured.svg",
  "./assets/img/home-local/featured/local-05-featured.svg", "./assets/img/home-local/featured/local-06-featured.svg",
  "./assets/img/home-local/featured/local-07-featured.svg"
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
    e.respondWith(fetch(request).catch(() => caches.match("./404.html")));
    return;
  }
  const url = new URL(request.url);
  if (/\/data\/[^/]+\.json(\?.*)?$/.test(url.pathname + url.search) || /\/data\//.test(url.pathname)) {
    // ข้อมูลกลาง (news/travel/products): network-first เสมอ ไม่ใช้ของแคชเป็นค่าเริ่มต้น
    e.respondWith(
      fetch(request).then(res => {
        const copy = res.clone();
        caches.open(V).then(c => c.put(request, copy)); // เก็บสำรองไว้เผื่อออฟไลน์เท่านั้น
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }
  if (request.destination === "script" || request.destination === "style" || /\/assets\/img\/preloader-bg\.jpg$/.test(url.pathname)) {
    // JS/CSS: network-first เพื่อไม่ให้โค้ดเก่าค้างในแคชหลังมีการแก้ไข (ใช้แคชเป็นสำรองตอนออฟไลน์)
    e.respondWith(
      fetch(request).then(res => {
        const copy = res.clone();
        caches.open(V).then(c => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }
  e.respondWith(                               // Asset อื่น ๆ: cache-first
    caches.match(request).then(hit => hit || fetch(request).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(request, copy));
      return res;
    }).catch(() => hit))
  );
});
