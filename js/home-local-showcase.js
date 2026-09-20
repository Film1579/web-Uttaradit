/* ===========================================================
   js/home-local-showcase.js
   "HomeLocalShowcase" — ระบบหมุนอัตโนมัติของ "ของดีจังหวัดอุตรดิตถ์" บนหน้าแรกเท่านั้น
   อ่านข้อมูลจาก CONFIG.products แหล่งเดียว (ไม่สร้างข้อมูลสินค้าใหม่)
   ใช้ homeSq/homeFeatured (asset แยกเฉพาะหน้าแรก, isolate จาก ic ที่หน้าอื่นใช้)
   แยก logic ออกจาก Hero Slider ใน main.js โดยสิ้นเชิง ไม่มีปุ่ม/ลูกศร/dots
   =========================================================== */
(function () {
  "use strict";

  const C = window.CONFIG;
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;
  const root = document.getElementById("homeLocalShowcase");
  const featuredEl = document.getElementById("homeGiFeatured");
  const subgridEl = document.getElementById("homeOtopGrid");
  const announceEl = document.getElementById("hlsAnnounce");
  if (!C || !root || !featuredEl || !subgridEl) return;

  /* รอข้อมูลกลางจริง (data/products.json) ก่อนคำนวณ ITEMS/N — มิฉะนั้นจะใช้ข้อมูลตั้งต้นที่ฝังมา
     กับเว็บไซต์ไปตลอดอายุของหน้า (เพราะระบบนี้อ่านค่าเพียงครั้งเดียวตอนเริ่มต้น) */
  const startShowcase = () => runShowcase(Array.isArray(C.products) ? C.products.slice() : []);
  if (window.UTT_DATA_READY && typeof window.UTT_DATA_READY.then === "function") {
    window.UTT_DATA_READY.then(startShowcase);
  } else {
    startShowcase();
  }

  function runShowcase(ITEMS) {
  const N = ITEMS.length;
  if (N < 5) return; /* ระบบนี้ออกแบบไว้สำหรับ 5+ รายการ (หลัก 1 + ย่อย 4) */

  const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  const reduceMotionMq = matchMedia("(prefers-reduced-motion: reduce)");
  const applyReducedClass = () => root.classList.toggle("hls--reduced", reduceMotionMq.matches);
  applyReducedClass();
  reduceMotionMq.addEventListener ? reduceMotionMq.addEventListener("change", applyReducedClass) : reduceMotionMq.addListener(applyReducedClass);

  const DISPLAY_MS = 5000;   /* 4–6s ตาม UX spec */
  const TRANS_MS = 760;      /* 500–900ms */
  const SUB_STAGGER_MS = 90; /* 60–120ms */

  let index = 0;
  let timer = null;
  let transitioning = false;
  let pausedByHover = false;
  let pausedByInteraction = false;

  const detailUrl = id => `pages/product-detail.html?id=${id}`;
  /* ตัวสำรองเท่านั้น: homeSq/homeFeatured (asset เฉพาะหน้าแรก) ยังมาก่อนเสมอ — ถ้าไม่มีจึงใช้รูปโพสต์สินค้า (field "img") */
  const productImg = item => (window.UTT_IMG ? window.UTT_IMG.pick(item) : (item.img || ""));

  function buildFeaturedNode(item) {
    const div = document.createElement("div");
    div.className = "hls__featItem";
    const media = item.homeFeatured || productImg(item);
    div.innerHTML = `
      <a class="hls__featMedia" href="${detailUrl(item.id)}" tabindex="-1" aria-hidden="true">
        <img src="${media}" alt="" loading="eager" width="960" height="540">
      </a>
      <div class="hls__featBody">
        <span class="card__tag">${esc(I18N.tag(item.tag, item))}</span>
        <h3 class="hls__featTitle"><a href="${detailUrl(item.id)}">${esc(pick(item, "t"))}</a></h3>
        <p class="hls__featDesc">${esc(pick(item, "s"))}</p>
        <a class="btn btn--gold btn--sm hls__featCta" href="${detailUrl(item.id)}">${t("common.viewDetail")}</a>
      </div>`;
    return div;
  }

  function subItemsFor(centerIdx) {
    const out = [];
    for (let k = 1; k <= 4; k++) out.push(ITEMS[(centerIdx + k) % N]);
    return out;
  }

  function renderFeatured(item, animate) {
    const prev = featuredEl.querySelector(".hls__featItem:not(.is-leaving)");
    const next = buildFeaturedNode(item);
    featuredEl.appendChild(next);

    if (animate && prev) {
      next.classList.add("is-entering");
      prev.classList.add("is-leaving");
      const cleanup = () => prev.remove();
      prev.addEventListener("animationend", cleanup, { once: true });
      setTimeout(cleanup, TRANS_MS + 120); /* กันเหนียวถ้า animationend ไม่ยิง */
      next.addEventListener("animationend", () => next.classList.remove("is-entering"), { once: true });
      setTimeout(() => next.classList.remove("is-entering"), TRANS_MS + 120);
    } else {
      if (prev) prev.remove();
    }
  }

  function renderSubs(items, animate) {
    /* fade-out รายการเดิมสั้น ๆ ก่อนแทนที่ เพื่อไม่ให้เกิดอาการสลับกระทันหัน */
    const oldLis = [...subgridEl.children];
    if (animate && oldLis.length) {
      oldLis.forEach(li => li.classList.add("hls-sub-leave"));
    }

    const doReplace = () => {
      subgridEl.innerHTML = items.map((p, i) => `
        <li class="${animate ? "hls-sub-enter" : ""}" style="--hls-sub-delay:${i * SUB_STAGGER_MS}ms">
          <a class="hls__subCard" href="${detailUrl(p.id)}">
            <span class="hls__subMedia"><img src="${p.homeSq || productImg(p)}" alt="" loading="lazy" width="52" height="52"></span>
            <span class="hls__subBody"><b>${esc(pick(p, "t"))}</b><small>${esc(I18N.tag(p.tag, p))}</small></span>
          </a>
        </li>`).join("");
    };

    if (animate && oldLis.length) {
      setTimeout(doReplace, 150);
    } else {
      doReplace();
    }
  }

  function preload(item) {
    if (!item) return;
    const src = item.homeFeatured || productImg(item);
    if (!src) return;
    const img = new Image();
    img.src = src;
  }

  function announce(item) {
    if (!announceEl) return;
    announceEl.textContent = t("hls.announce", { name: pick(item, "t") });
  }

  function render(animate) {
    const featured = ITEMS[index];
    renderFeatured(featured, animate);
    renderSubs(subItemsFor(index), animate);
    announce(featured);
    preload(ITEMS[(index + 1) % N]);
  }

  function goTo(newIndex, animate) {
    if (transitioning) return;
    transitioning = true;
    index = ((newIndex % N) + N) % N;
    render(animate);
    setTimeout(() => { transitioning = false; }, animate ? TRANS_MS + 160 : 0);
  }

  function next() { goTo(index + 1, true); }
  function previous() { goTo(index - 1, true); }

  function scheduleNext() {
    clearTimeout(timer);
    if (pausedByHover || pausedByInteraction) return;
    timer = setTimeout(() => { next(); scheduleNext(); }, DISPLAY_MS);
  }

  function pause() { clearTimeout(timer); }
  function resume() { scheduleNext(); }

  /* ---------- Hover pause (Desktop) ---------- */
  root.addEventListener("mouseenter", () => { pausedByHover = true; pause(); });
  root.addEventListener("mouseleave", () => { pausedByHover = false; resume(); });

  /* ---------- Keyboard navigation ---------- */
  root.setAttribute("tabindex", "0");
  root.setAttribute("role", "group");
  root.setAttribute("aria-roledescription", t("hls.roledesc"));
  I18N.onChange(() => { root.setAttribute("aria-roledescription", t("hls.roledesc")); render(false); });   // สลับภาษา: วาดรายการปัจจุบันใหม่
  root.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); pausedByInteraction = true; next(); pause(); restartInteractionTimeout(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); pausedByInteraction = true; previous(); pause(); restartInteractionTimeout(); }
  });

  /* ---------- Swipe / pointer gesture ---------- */
  let sx = 0, sy = 0, dx = 0, dy = 0, swiping = false;
  const THRESHOLD = 42;

  function onStart(x, y) { sx = x; sy = y; dx = 0; dy = 0; swiping = true; pausedByInteraction = true; pause(); }
  function onMove(x, y) { if (!swiping) return; dx = x - sx; dy = y - sy; }
  function onEnd() {
    if (!swiping) return;
    swiping = false;
    const movedFar = Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(dy);
    if (movedFar) { if (dx < 0) next(); else previous(); }
    restartInteractionTimeout();
    /* ไม่รีเซ็ต dx ทันที: ปล่อยให้ click handler ด้านล่าง (ซึ่งยิงหลัง touchend/pointerup) เห็นค่าล่าสุด
       เพื่อกันไม่ให้ swipe กลายเป็นคลิกเปิดลิงก์โดยไม่ตั้งใจ — dx จะถูกรีเซ็ตเองที่ onStart ของ gesture ถัดไป */
  }

  let interactionTimeout = null;
  function restartInteractionTimeout() {
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => { pausedByInteraction = false; resume(); }, 900);
  }

  featuredEl.addEventListener("touchstart", e => { const t = e.changedTouches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
  featuredEl.addEventListener("touchmove", e => { const t = e.changedTouches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
  featuredEl.addEventListener("touchend", onEnd);

  let pointerDown = false;
  featuredEl.addEventListener("pointerdown", e => {
    if (e.pointerType === "touch") return; /* touch จัดการผ่าน touch events ด้านบนแล้ว กัน double-trigger */
    pointerDown = true;
    onStart(e.clientX, e.clientY);
  });
  featuredEl.addEventListener("pointermove", e => { if (pointerDown) onMove(e.clientX, e.clientY); });
  window.addEventListener("pointerup", () => { if (pointerDown) { pointerDown = false; onEnd(); } });

  /* ป้องกัน swipe เล็กน้อยกลายเป็นคลิกเปิดลิงก์โดยไม่ตั้งใจ */
  featuredEl.addEventListener("click", e => {
    if (Math.abs(dx) > 10) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ---------- Cleanup (เผื่อกรณีมีการนำ section ออกจาก DOM แบบ dynamic ในอนาคต) ---------- */
  function cleanup() {
    pause();
    clearTimeout(interactionTimeout);
    reduceMotionMq.removeEventListener ? reduceMotionMq.removeEventListener("change", applyReducedClass) : reduceMotionMq.removeListener(applyReducedClass);
  }
  window.addEventListener("pagehide", cleanup);

  /* ---------- Init ---------- */
  render(false);
  /* ระบบยังคงหมุนอัตโนมัติแม้ reduced-motion เพราะข้อมูล/ลิงก์ต้องยังทำงานได้ตามสเปก
     เพียงแต่ CSS จะลด motion ให้เหลือ fade เบา ๆ แทน transform หนัก ๆ (ดู .hls--reduced) */
  scheduleNext();

  window.HomeLocalShowcase = { next, previous, pause, resume, goTo };
  } // end runShowcase()
})();
