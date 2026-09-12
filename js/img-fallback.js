/* img-fallback.js — เมื่อรูปภาพจริงยังไม่ถูกอัปโหลด (assets/img/*) ให้แสดงภาพตัวแทน
   โทนสีของจังหวัด (เขียว–ทอง) แทนไอคอนรูปเสียของเบราว์เซอร์ ผู้ใช้จึงยังเห็นหน้าเว็บที่สมบูรณ์
   แนวคิดยืมมาจาก AETHER: "procedural fallback" — รันได้แม้ยังไม่มีไฟล์ภาพจริงสักไฟล์เดียว */
(function () {
  "use strict";
  function placeholderSrc(w, h) {
    w = w > 0 ? w : 600; h = h > 0 ? h : 400;
    var r = Math.max(18, Math.min(w, h) / 7);
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='#2C8482'/><stop offset='1' stop-color='#12484A'/>" +
      "</linearGradient></defs>" +
      "<rect width='100%' height='100%' fill='url(#g)'/>" +
      "<circle cx='" + (w/2) + "' cy='" + (h/2) + "' r='" + r + "' fill='none' stroke='#C8A46A' stroke-width='2' opacity='.85'/>" +
      "<circle cx='" + (w/2) + "' cy='" + (h/2) + "' r='3.5' fill='#C8A46A'/>" +
      "</svg>";
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }
  function applyFallback(img) {
    if (!img || img.dataset.fbApplied) return;
    img.dataset.fbApplied = "1";
    img.classList.add("img-fallback");
    img.src = placeholderSrc(img.width || img.getAttribute("width"), img.height || img.getAttribute("height"));
  }
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG") applyFallback(t);
  }, true);
  /* เผื่อกรณีรูปเสียตั้งแต่ก่อนสคริปต์นี้ทำงาน (cache ของเบราว์เซอร์) */
  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.images, function (img) {
      if (img.complete && img.naturalWidth === 0) applyFallback(img);
    });
  });
})();


