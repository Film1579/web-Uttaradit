/* main.js — Nav, Hero, Render, Tabs, Search, Filter, Pagination, A11y */
(function () {
  "use strict";
  const C = window.CONFIG, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmtDate = iso => new Date(iso).toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" });
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

  /* ---------- 1. Accessibility toolbar ---------- */
  const FONT_KEY = "utt_font", CONTRAST_KEY = "utt_contrast";
  const sizes = [15, 16, 17.5, 19, 20.5];
  let fi = +(localStorage.getItem(FONT_KEY) ?? 1);
  const applyFont = () => document.documentElement.style.setProperty("--font-base", sizes[fi] + "px");
  applyFont();
  $$(".a11y [data-font]").forEach(b => b.addEventListener("click", () => {
    const a = b.dataset.font;
    fi = a === "inc" ? Math.min(fi + 1, sizes.length - 1) : a === "dec" ? Math.max(fi - 1, 0) : 1;
    localStorage.setItem(FONT_KEY, fi); applyFont();
  }));
  const cBtn = $("#btnContrast");
  const applyContrast = on => { document.documentElement.dataset.contrast = on ? "high" : "normal"; cBtn.setAttribute("aria-pressed", on); };
  applyContrast(localStorage.getItem(CONTRAST_KEY) === "1");
  cBtn.addEventListener("click", () => { const on = cBtn.getAttribute("aria-pressed") !== "true"; applyContrast(on); localStorage.setItem(CONTRAST_KEY, on ? "1" : "0"); });

  /* Theme (Light/Dark) — ระบบใหม่ แยกอิสระจาก High Contrast ด้านบนโดยสิ้นเชิง (คนละ data-attribute,
     คนละปุ่ม, คนละคีย์ localStorage) ทั้งสองระบบทำงานพร้อมกันได้ (เช่น มืด + คอนทราสต์สูงพร้อมกัน) */
  const THEME_KEY = "utt_theme";
  const tBtn = $("#btnTheme");
  const applyTheme = mode => {
    document.documentElement.dataset.theme = mode;
    tBtn.setAttribute("aria-pressed", mode === "dark");
    tBtn.setAttribute("aria-label", mode === "dark" ? "สลับธีมเป็นโหมดสว่าง" : "สลับธีมเป็นโหมดมืด");
    tBtn.textContent = mode === "dark" ? "☀️" : "🌙";
  };
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) { /* private mode ฯลฯ */ }
  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : (prefersDark ? "dark" : "light"));
  tBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode ฯลฯ */ }
  });

  /* ---------- 2. Header / Nav ---------- */
  const hd = $("#header"), burger = $("#burger"), nav = $("#nav");
  let backdrop = null;
  addEventListener("scroll", () => hd.classList.toggle("is-stuck", scrollY > 12), { passive: true });

  function closeNav() {
    nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; backdrop?.remove(); backdrop = null;
  }
  /* บั๊กด้าน Keyboard Navigation: เมนูมือถือแบบ Drawer ไม่มีการดักโฟกัส (focus trap)
     ผู้ใช้คีย์บอร์ด/สกรีนรีดเดอร์กด Tab ทะลุออกไปโต้ตอบกับเนื้อหาที่ถูกซ่อนไว้ข้างหลังได้ จึงเพิ่มการดักโฟกัสไว้ในเมนูขณะเปิดอยู่ */
  function trapNavFocus(e) {
    if (e.key !== "Tab" || !nav.classList.contains("is-open")) return;
    const items = $$('a[href], button:not([disabled])', nav);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  addEventListener("keydown", trapNavFocus);
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", open);
    nav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      backdrop.addEventListener("click", () => { closeNav(); burger.focus(); });
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add("is-on"));
      nav.querySelector("a")?.focus();
    } else closeNav();
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("is-open")) { closeNav(); burger.focus(); } });
  $$(".nav a").forEach(a => a.addEventListener("click", () => { if (innerWidth <= 1024 && !a.closest(".has-sub>a")) closeNav(); }));
  $$(".has-sub > a").forEach(a => a.addEventListener("click", e => {
    if (innerWidth > 1024) return;
    e.preventDefault();
    const li = a.parentElement, open = !li.classList.contains("is-open");
    li.classList.toggle("is-open", open); a.setAttribute("aria-expanded", open);
  }));

  /* ---------- 3. Hero slider ---------- */
  const slides = $("#heroSlides"), dots = $("#heroDots");
  C.hero.forEach((h, i) => {
    slides.insertAdjacentHTML("beforeend", `<div class="hero__slide${i === 0 ? " is-active" : ""}" role="img" aria-label="${esc(h.alt)}" style="background-image:url('${h.img}')"></div>`);
    dots.insertAdjacentHTML("beforeend", `<button role="tab" aria-selected="${i === 0}" aria-label="ภาพที่ ${i + 1}: ${esc(h.alt)}"></button>`);
  });
  let hi = 0, heroTimer = null;
  const goHero = n => {
    hi = (n + C.hero.length) % C.hero.length;
    $$(".hero__slide").forEach((s, i) => s.classList.toggle("is-active", i === hi));
    $$("#heroDots button").forEach((b, i) => b.setAttribute("aria-selected", i === hi));
  };
  $$("#heroDots button").forEach((b, i) => b.addEventListener("click", () => { goHero(i); restart(); }));
  const restart = () => { clearInterval(heroTimer); heroTimer = setInterval(() => goHero(hi + 1), C.site.heroInterval); };
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) restart();
  $(".hero").addEventListener("mouseenter", () => clearInterval(heroTimer));
  $(".hero").addEventListener("mouseleave", restart);

  /* ---------- 4. Static renders ---------- */
  $("#heroStats").innerHTML = C.stats.map(s => `<li><b>${esc(s.n)}</b><span>${esc(s.label)}</span></li>`).join("");
  $("#aboutFacts").innerHTML = C.facts.map(f => `<li><b>${esc(f.b)}</b><span>${esc(f.s)}</span></li>`).join("");
  $("#svcGrid").innerHTML = C.services.map(s => `<li><a href="${s.u}"><span class="ic" aria-hidden="true">${s.ic}</span><b>${esc(s.t)}</b><small>${esc(s.s)}</small></a></li>`).join("");
  $("#itaList").innerHTML = C.ita.map(i => `<li><a href="pages/ita.html"><span class="code">${esc(i.code)}</span><span>${esc(i.t)}</span></a></li>`).join("");
  $("#agencyChips").innerHTML = C.agencies.map(a => `<li><a href="${esc(a.u)}" target="_blank" rel="noopener noreferrer">${esc(a.t)}</a></li>`).join("");
  $("#travelGrid").innerHTML = C.travel.map(t => `
    <li class="card" data-reveal>
      <div class="card__media"><img src="${t.img}" alt="${esc(t.t)}" loading="lazy" width="600" height="450">
        <span class="card__tag">${esc(t.tag)}</span></div>
      <div class="card__body"><h3 class="card__title"><a href="pages/travel-detail.html?id=${t.id}">${esc(t.t)}</a></h3>
        <p class="card__ex">${esc(t.s)}</p><a class="card__more" href="pages/travel-detail.html?id=${t.id}">อ่านต่อ →</a></div>
    </li>`).join("");

  /* ---------- 5. News: Tabs + Search + Filter + Pagination ---------- */
  const grid = $("#newsGrid"), pager = $("#newsPager"), empty = $("#newsEmpty"),
        tabsBox = $("#newsTabs"), qBox = $("#newsQ");
  let cat = "all", query = "", page = 1;
  const PS = C.site.pageSize;

  tabsBox.innerHTML = C.newsCats.map(c => `<button role="tab" data-cat="${c.id}" aria-selected="${c.id === "all"}" aria-controls="newsPanel">${esc(c.name)}</button>`).join("");
  tabsBox.addEventListener("click", e => {
    const b = e.target.closest("button[data-cat]"); if (!b) return;
    cat = b.dataset.cat; page = 1;
    $$("#newsTabs button").forEach(x => x.setAttribute("aria-selected", x === b));
    render();
  });
  tabsBox.addEventListener("keydown", e => {          // ลูกศรซ้าย/ขวาตาม WAI-ARIA Tabs
    if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const bs = $$("#newsTabs button"), i = bs.indexOf(document.activeElement);
    if (i < 0) return;
    const n = bs[(i + (e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length];
    n.focus(); n.click(); e.preventDefault();
  });

  let deb;
  qBox.addEventListener("input", e => { clearTimeout(deb); deb = setTimeout(() => { query = e.target.value.trim().toLowerCase(); page = 1; render(); }, 220); });

  function filtered() {
    return C.news
      .filter(n => cat === "all" || n.cat === cat)
      .filter(n => !query || (n.title + n.ex).toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  function render() {
    const list = filtered(), total = Math.max(1, Math.ceil(list.length / PS));
    page = Math.min(page, total);
    const slice = list.slice((page - 1) * PS, page * PS);
    empty.hidden = list.length > 0;

    grid.innerHTML = slice.map(n => {
      const name = C.newsCats.find(c => c.id === n.cat)?.name || "";
      return `<li class="card" data-reveal>
        <div class="card__media"><img src="${n.img}" alt="${esc(n.title)}" loading="lazy" width="600" height="375">
          <span class="card__tag">${esc(name)}</span></div>
        <div class="card__body">
          <p class="card__date"><time datetime="${n.date}">${fmtDate(n.date)}</time></p>
          <h3 class="card__title"><a href="pages/news-detail.html?id=${n.id}">${esc(n.title)}</a></h3>
          <p class="card__ex">${esc(n.ex)}</p>
          <a class="card__more" href="pages/news-detail.html?id=${n.id}">อ่านรายละเอียด →</a>
        </div></li>`;
    }).join("");

    pager.innerHTML = list.length <= PS ? "" :
      `<button ${page === 1 ? "disabled" : ""} data-go="${page - 1}" aria-label="หน้าก่อนหน้า">‹</button>` +
      Array.from({ length: total }, (_, i) =>
        `<button data-go="${i + 1}" ${page === i + 1 ? 'aria-current="page"' : ""} aria-label="หน้าที่ ${i + 1}">${i + 1}</button>`).join("") +
      `<button ${page === total ? "disabled" : ""} data-go="${page + 1}" aria-label="หน้าถัดไป">›</button>`;

    observeReveal();
  }
  pager.addEventListener("click", e => {
    const b = e.target.closest("button[data-go]"); if (!b || b.disabled) return;
    page = +b.dataset.go; render();
    $("#news").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#newsPanel").focus({ preventScroll: true });
  });
  render();

  /* ---------- 6. Reveal on scroll + Counter ---------- */
  var io;  // var (ไม่ใช่ let) เพราะ render() ด้านบนถูกเรียกก่อนบรรทัดนี้ทำงาน ต้อง hoist เป็น undefined ไม่ใช่ TDZ
  function observeReveal() {
    if (!("IntersectionObserver" in window)) { $$("[data-reveal]").forEach(e => e.classList.add("is-in")); return; }
    io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -40px" });
    $$("[data-reveal]:not(.is-in)").forEach(e => io.observe(e));
  }
  observeReveal();

  $$("[data-count]").forEach(el => {
    const end = parseFloat(el.dataset.count), dec = (end % 1 !== 0) ? 2 : 0;
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting) return;
      const t0 = performance.now(), dur = 1500;
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - p, 3));
        el.textContent = v.toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      ob.unobserve(e.target);
    }), { threshold: .5 }).observe(el);
  });

  /* ---------- 7. Contact form validation ---------- */
  const form = $("#ctForm"), err = $("#ctErr"), ok = $("#ctOk");
  form.addEventListener("submit", e => {
    e.preventDefault(); ok.hidden = true;
    const bad = [...form.elements].filter(f => f.required && (!f.value.trim() || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value))));
    [...form.elements].forEach(f => f.removeAttribute("aria-invalid"));
    if (bad.length) {
      bad.forEach(f => f.setAttribute("aria-invalid", "true"));
      err.textContent = "กรุณากรอกข้อมูลให้ครบถ้วนและตรวจสอบรูปแบบอีเมลอีกครั้ง";
      err.hidden = false; bad[0].focus(); return;
    }
    err.hidden = true; ok.hidden = false; form.reset();
  });

  /* ---------- 8. Back to top + Cookie ---------- */
  const top = $("#toTop");
  addEventListener("scroll", () => { top.hidden = scrollY < 420; }, { passive: true });
  top.addEventListener("click", () => { scrollTo({ top: 0, behavior: "smooth" }); $(".skip-link").focus(); });

  /* Cookie Consent — เดิมผูกการแสดงผลกับอีเวนต์ "app:ready" ซึ่งบางกรณี (เช่นเคยดู
     พรีโหลดเดอร์แล้วในเซสชันนี้) preloader.js จะ dispatch อีเวนต์นี้แบบซิงโครนัสก่อนที่
     สคริปต์นี้ (โหลดทีหลังในลำดับ <script> ท้าย body) จะได้ลงทะเบียน listener ทัน
     ทำให้ Banner ไม่ถูกแสดงเลย จึงเปลี่ยนมาใช้ setTimeout ตรง ๆ แทน เพราะ ณ จุดที่โค้ด
     บรรทัดนี้รันอยู่ DOM ของหน้าถูกพาร์สครบแล้วเสมอ (สคริปต์อยู่ท้าย body) ไม่ต้องพึ่งอีเวนต์ใด ๆ อีก */
  const ck = $("#cookie");
  let cookieAccepted = false;
  try { cookieAccepted = localStorage.getItem("utt_cookie") === "1"; } catch (e) { cookieAccepted = false; }
  if (ck && !cookieAccepted) {
    setTimeout(() => { ck.hidden = false; }, 1200);
  }
  $("#cookieOk")?.addEventListener("click", () => {
    try { localStorage.setItem("utt_cookie", "1"); } catch (e) { /* เช่น โหมดส่วนตัว/ที่เก็บข้อมูลถูกปิด */ }
    if (ck) ck.hidden = true;
  });

  /* ---------- 9. Site search ---------- */
  $("#siteSearch").addEventListener("submit", e => {
    e.preventDefault();
    const v = $("#q").value.trim(); if (!v) return;
    qBox.value = v; query = v.toLowerCase(); cat = "all"; page = 1;
    $$("#newsTabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.cat === "all"));
    render();
    $("#news").scrollIntoView({ behavior: "smooth" });
    if (innerWidth <= 1024) closeNav();
  });
  /* ---------- 10. Cinematic depth parallax (ปรับจาก AETHER: pointer-based, เคารพ reduced-motion) ---------- */
  (function heroParallax() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* บั๊กประสิทธิภาพ: เดิมเอฟเฟกต์นี้รันซ้ำไม่หยุด (requestAnimationFrame ทุกเฟรม) แม้บนมือถือ/แท็บเล็ต
       ทั้งที่ปุ่มนี้ออกแบบมาเพื่อขยับตามเมาส์ ซึ่งอุปกรณ์ทัชสกรีนไม่มีพอยน์เตอร์ค้างอยู่ให้ขยับตามจริง
       จึงข้ามการทำงานทั้งหมดบนอุปกรณ์ pointer แบบหยาบ (touch) เพื่อประหยัดแบตเตอรี่/ประสิทธิภาพเรนเดอร์ */
    if (matchMedia("(pointer: coarse)").matches) return;
    const hero = $("#home"); if (!hero) return;
    const layers = [
      { el: $("#heroSlides"), depth: 0.4 },
      { el: hero.querySelector(".hero__body"), depth: -0.12 }
    ].filter(l => l.el);
    if (!layers.length) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const onMove = e => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
    };
    function frame() {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      layers.forEach(l => { l.el.style.transform = `translate3d(${(-cx * 14 * l.depth).toFixed(2)}px,${(-cy * 8 * l.depth).toFixed(2)}px,0)`; });
      raf = requestAnimationFrame(frame);
    }
    addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) raf = requestAnimationFrame(frame);
    });
  })();
})();


