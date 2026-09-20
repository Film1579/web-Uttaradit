/* cookie-consent.js — แบนเนอร์แจ้งเตือนคุกกี้ (สคริปต์อิสระ)
   สาเหตุของบั๊กที่พบ (2 ข้อ):
   1) .cookie ตั้ง display:flex ทับกฎ [hidden] ของเบราว์เซอร์ → ซ่อนด้วย hidden ไม่ได้ผล (แก้ที่ CSS + style.display)
   2) แบนเนอร์เด้งขึ้นที่ ~1.2 วินาที ขณะที่ Preloader (z-index 9999) และ Cloud Gate (9998, pointer-events:auto
      ระหว่างเปิดเมฆ) ยังบังทั้งจออยู่ → ผู้ใช้เห็นปุ่มผ่านเมฆแต่กดแล้วคลิกไปโดน overlay ไม่ถึงปุ่ม
      จึงรอให้ทั้งสองอย่างจบก่อนค่อยแสดงแบนเนอร์ */
(function () {
  "use strict";
  var KEY = "utt_cookie";
  var ck = document.getElementById("cookie");
  if (!ck) return;

  function accepted() {
    try { if (localStorage.getItem(KEY) === "1") return true; } catch (e) {}
    try { return document.cookie.split("; ").indexOf(KEY + "=1") !== -1; } catch (e) { return false; }
  }
  function save() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    try { document.cookie = KEY + "=1; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {}
  }
  var timer = 0, done = false;
  function hide() {
    done = true;
    clearTimeout(timer);
    ck.hidden = true;
    ck.style.display = "none";
  }

  if (accepted()) { hide(); return; }

  /* ปุ่ม "ยอมรับ": ดักที่ document (capture) เพื่อไม่ขึ้นกับ element ที่ผูกไว้/สคริปต์อื่น ใช้ได้ทั้งเมาส์และทัช */
  function onActivate(e) {
    var t = e.target;
    if (!t || !t.closest || !t.closest("#cookieOk")) return;
    save();
    hide();
  }
  document.addEventListener("click", onActivate, true);
  document.addEventListener("touchend", onActivate, true);
  addEventListener("storage", function (e) { if (e.key === KEY && e.newValue === "1") hide(); });

  /* แสดงเมื่อไม่มี Preloader / Cloud Gate บังจออยู่แล้วเท่านั้น (สำรอง: แสดงแน่นอนที่ 15 วินาที) */
  function blocked() {
    var pl = document.getElementById("preloader");
    if (pl && getComputedStyle(pl).display !== "none" && pl.dataset.state !== "complete" && pl.dataset.state !== "skipped") return true;
    return !!document.querySelector(".cloud-gate.is-interactive");
  }
  var t0 = Date.now();
  (function wait() {
    if (done) return;
    if (accepted()) { hide(); return; }
    if (blocked() && Date.now() - t0 < 15000) { timer = setTimeout(wait, 250); return; }
    timer = setTimeout(function () {
      if (done || accepted()) return;
      ck.style.display = "";
      ck.hidden = false;
    }, 400);
  })();
})();
