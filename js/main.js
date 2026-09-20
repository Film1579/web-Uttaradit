/* main.js — Nav, Hero, Render, Tabs, Search, Filter, Pagination, A11y */
(function () {
  "use strict";
  const C = window.CONFIG, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;      // ระบบภาษากลาง (js/i18n.js)
  const fmtDate = iso => I18N.fmtDate(iso);
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
    tBtn.setAttribute("aria-label", t(mode === "dark" ? "a11y.themeToLight" : "a11y.themeToDark"));
    tBtn.textContent = mode === "dark" ? "☀️" : "🌙";
  };
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) { /* private mode ฯลฯ */ }
  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : (prefersDark ? "dark" : "light"));
  I18N.onChange(() => applyTheme(document.documentElement.dataset.theme));   // ป้ายกำกับปุ่มธีมตามภาษา
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
    slides.insertAdjacentHTML("beforeend", `<div class="hero__slide${i === 0 ? " is-active" : ""}" role="img" style="background-image:url('${h.img}')"></div>`);
    dots.insertAdjacentHTML("beforeend", `<button role="tab" aria-selected="${i === 0}"></button>`);
  });
  const heroLabels = () => C.hero.forEach((h, i) => {                       // alt / aria-label ตามภาษา
    const alt = pick(h, "alt");
    $$(".hero__slide")[i].setAttribute("aria-label", alt);
    $$("#heroDots button")[i].setAttribute("aria-label", t("hero.dotLabel", { n: i + 1, alt }));
  });
  heroLabels();
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
  function renderStatic() {
    $("#heroStats").innerHTML = C.stats.map(s => `<li><b>${esc(s.n)}</b><span>${esc(pick(s, "label"))}</span></li>`).join("");
    $("#aboutFacts").innerHTML = C.facts.map(f => `<li><b>${esc(pick(f, "b"))}</b><span>${esc(pick(f, "s"))}</span></li>`).join("");
    $("#svcGrid").innerHTML = C.services.map(s => `<li><a href="${s.u}"><img class="ic" src="${s.ic}" alt="" width="44" height="44" loading="lazy"><b>${esc(pick(s, "t"))}</b><small>${esc(pick(s, "s"))}</small></a></li>`).join("");
    $("#itaList").innerHTML = C.ita.map(i => `<li><a href="pages/ita.html"><span class="code">${esc(i.code)}</span><span>${esc(pick(i, "t"))}</span></a></li>`).join("");
    $("#agencyChips").innerHTML = C.agencies.map(a => `<li><a href="${esc(a.u)}" target="_blank" rel="noopener noreferrer">${esc(pick(a, "t"))}</a></li>`).join("");
  }
  renderStatic();
  function renderTravelHome() {
    $("#travelGrid").innerHTML = C.travel.map(tv => `
      <li class="card" data-reveal>
        <div class="card__media"><img src="${tv.img}" alt="${esc(pick(tv, "t"))}" loading="lazy" width="600" height="450">
          <span class="card__tag">${esc(I18N.tag(tv.tag, tv))}</span></div>
        <div class="card__body"><h3 class="card__title"><a href="pages/travel-detail.html?id=${tv.id}">${esc(pick(tv, "t"))}</a></h3>
          <p class="card__ex">${esc(pick(tv, "s"))}</p><a class="card__more" href="pages/travel-detail.html?id=${tv.id}">${t("common.readOn")}</a></div>
      </li>`).join("");
    observeReveal();
  }
  renderTravelHome(); // ทาสีครั้งแรกด้วยข้อมูลตั้งต้น (instant paint) ก่อนข้อมูลกลางจริงจะโหลดเสร็จ

  /* ---------- 4b. Home GI/OTOP Showcase ----------
     ย้ายไปเป็นระบบ auto-rotating carousel แยกต่างหากใน js/home-local-showcase.js
     (controller "HomeLocalShowcase" อ่านจาก CONFIG.products แหล่งเดียว ไม่ hard-code ซ้ำ,
     ไม่ปนกับ Hero Slider ด้านบน) ดูการเริ่มทำงานท้ายไฟล์นั้น */

  /* ---------- 5. News: Tabs + Search + Filter + Pagination ---------- */
  const grid = $("#newsGrid"), pager = $("#newsPager"), empty = $("#newsEmpty"),
        tabsBox = $("#newsTabs"), qBox = $("#newsQ");
  let cat = "all", query = "", page = 1;
  const PS = C.site.pageSize;

  const buildTabs = () => { tabsBox.innerHTML = C.newsCats.map(c => `<button role="tab" data-cat="${c.id}" aria-selected="${c.id === cat}" aria-controls="newsPanel">${esc(pick(c, "name"))}</button>`).join(""); };
  buildTabs();
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
      .filter(n => !query || (n.title + n.ex + (n.title_en || "") + (n.ex_en || "")).toLowerCase().includes(query))   // ค้นได้ทั้งไทยและอังกฤษ
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  function render() {
    const list = filtered(), total = Math.max(1, Math.ceil(list.length / PS));
    page = Math.min(page, total);
    const slice = list.slice((page - 1) * PS, page * PS);
    empty.hidden = list.length > 0;

    grid.innerHTML = slice.map(n => {
      const name = pick(C.newsCats.find(c => c.id === n.cat), "name") || "";
      return `<li class="card" data-reveal>
        <div class="card__media"><img src="${n.img}" alt="${esc(pick(n, "title"))}" loading="lazy" width="600" height="375">
          <span class="card__tag">${esc(name)}</span></div>
        <div class="card__body">
          <p class="card__date"><time datetime="${n.date}">${fmtDate(n.date)}</time></p>
          <h3 class="card__title"><a href="pages/news-detail.html?id=${n.id}">${esc(pick(n, "title"))}</a></h3>
          <p class="card__ex">${esc(pick(n, "ex"))}</p>
          <a class="card__more" href="pages/news-detail.html?id=${n.id}">${t("common.readMore")}</a>
        </div></li>`;
    }).join("");

    pager.innerHTML = list.length <= PS ? "" :
      `<button ${page === 1 ? "disabled" : ""} data-go="${page - 1}" aria-label="${t("pager.prev")}">‹</button>` +
      Array.from({ length: total }, (_, i) =>
        `<button data-go="${i + 1}" ${page === i + 1 ? 'aria-current="page"' : ""} aria-label="${t("pager.page", { n: i + 1 })}">${i + 1}</button>`).join("") +
      `<button ${page === total ? "disabled" : ""} data-go="${page + 1}" aria-label="${t("pager.next")}">›</button>`;

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
      err.textContent = t("home.formError");
      err.hidden = false; bad[0].focus(); return;
    }
    err.hidden = true; ok.hidden = false; form.reset();
  });

  /* ---------- 7b. เปลี่ยนภาษา → วาดส่วนที่สร้างด้วย JS ใหม่ (คง cat/query/page ของผู้ใช้ไว้) ---------- */
  I18N.onChange(() => {
    heroLabels(); renderStatic(); renderTravelHome(); buildTabs(); render();
    if (!err.hidden) err.textContent = t("home.formError");
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
  /* Cookie Consent ย้ายไปอยู่ js/cookie-consent.js (สคริปต์อิสระ ไม่ขึ้นกับโค้ดอื่นใน main.js) */

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

  /* ---------- 7. ข้อมูลกลางจริง (data/*.json) โหลดเสร็จ → วาดใหม่ด้วยข้อมูลล่าสุด ----------
     renderTravelHome()/render() วาดครั้งแรกด้วยข้อมูลตั้งต้นที่ฝังมากับเว็บไซต์ไปก่อนแล้ว (instant paint)
     เมื่อ data-loader.js โหลด data/travel.json และ data/news.json (ของจริงจาก Admin) เสร็จ ให้วาดซ้ำ
     ด้วยข้อมูลล่าสุด — คง cat/query/page ปัจจุบันของผู้ใช้ไว้เหมือนเดิม ไม่รีเซ็ตตัวกรอง */
  if (window.UTT_DATA_READY && typeof window.UTT_DATA_READY.then === "function") {
    window.UTT_DATA_READY.then(source => {
      if (source !== "live") return; // fallback-embedded: ข้อมูลที่วาดไปแล้วคือชุดเดียวกัน ไม่ต้องวาดซ้ำ
      renderTravelHome();
      render();
    });
  }
})();
