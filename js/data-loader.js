/* js/data-loader.js — โหลด "แหล่งข้อมูลจริงกลาง" (data/*.json ใน Repository) มาสวมทับ
   window.CONFIG.news / travel / products และ window.DATA.newsBody / travelBody / productBody

   สถาปัตยกรรม:
     data/*.json (ใน GitHub Repository, แก้ผ่าน Admin จริง)
       ↓ fetch() ตอนเปิดหน้าเว็บ
     window.CONFIG / window.DATA (ค่าตั้งต้นจาก config.js/data.js ถูกเขียนทับที่นี่)
       ↓
     หน้าเว็บเดิม (page-news.js, page-travel.js, page-*-detail.js, home-local-showcase.js, main.js ฯลฯ)

   ทุกหน้าที่แสดงข่าว/ท่องเที่ยว/สินค้า ต้องรอ window.UTT_DATA_READY (Promise) ก่อนอ่าน CONFIG/DATA
   เพื่อให้ได้ข้อมูลกลางล่าสุดเสมอ ไม่ใช่ข้อมูลตั้งต้นที่ฝังมากับไฟล์ JS

   ต้องโหลดสคริปต์นี้ "ต่อจาก" config.js และ data.js เสมอ (ดูลำดับ <script> ในแต่ละหน้า) */
window.UTT_DATA_READY = (function () {
  "use strict";
  const B = document.documentElement.dataset.base || ""; // เทียบ path จาก root ของเว็บไซต์ (รองรับ GitHub Pages subpath)

  // เติม query string กันแคชเก่าค้าง (ทำงานร่วมกับ sw.js ที่ใช้ network-first กับ data/*.json อยู่แล้ว)
  const bust = "?v=" + Date.now();

  function fetchJson(path) {
    return fetch(B + path + bust, { cache: "no-store" }).then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status + ": " + path);
      return res.json();
    });
  }

  const targets = {
    news: window.CONFIG, travel: window.CONFIG, products: window.CONFIG,
    newsBody: window.DATA, travelBody: window.DATA, productBody: window.DATA
  };

  // เฉพาะหน้าที่โหลด js/data.js มาก่อนแล้วเท่านั้นถึงจะมี window.DATA ให้เขียนทับ newsBody/travelBody/productBody
  // (หน้ารายการ เช่น index.html/news.html/travel.html ไม่ต้องใช้ Body เต็ม จึงไม่โหลด data.js อยู่แล้ว)
  const allFiles = [
    ["news", "data/news.json"],
    ["travel", "data/travel.json"],
    ["products", "data/products.json"],
    ["newsBody", "data/news-body.json"],
    ["travelBody", "data/travel-body.json"],
    ["productBody", "data/product-body.json"]
  ];
  const files = allFiles.filter(([key]) => targets[key]);

  window.__UTT_DATA_SOURCE__ = "loading";

  return Promise.allSettled(files.map(([key, path]) => fetchJson(path).then(json => ({ key, json }))))
    .then(results => {
      let failed = 0;
      results.forEach((r, i) => {
        const [key] = files[i];
        if (r.status === "fulfilled") {
          targets[key][key] = r.value.json;
        } else {
          failed++;
          console.warn(
            "[data-loader] โหลด " + files[i][1] + " ไม่สำเร็จ — ใช้ข้อมูลตั้งต้นที่ฝังมากับเว็บไซต์แทนชั่วคราว:",
            r.reason && r.reason.message
          );
        }
      });
      // ถ้าโหลดไม่สำเร็จแม้แต่ไฟล์เดียว ให้ทำเครื่องหมายไว้อย่างตรงไปตรงมา (ไม่ใช่ "fake success")
      window.__UTT_DATA_SOURCE__ = failed === 0 ? "live" : "fallback-embedded";
      if (failed > 0) {
        document.dispatchEvent(new CustomEvent("utt:data-degraded", { detail: { failed } }));
      }
      document.dispatchEvent(new CustomEvent("utt:data-ready", { detail: { source: window.__UTT_DATA_SOURCE__ } }));
      return window.__UTT_DATA_SOURCE__;
    });
})();
