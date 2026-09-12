/* shell.js — ฉีด topbar/header/footer/utility ให้หน้ารองทุกหน้า (base = "../" เมื่ออยู่ใน /pages) */
(function () {
  "use strict";
  const B = document.documentElement.dataset.base || "";   // <html data-base="../">
  const MENU = [
    { t:"หน้าแรก", u:B+"index.html" },
    { t:"แนะนำจังหวัด", u:B+"pages/about.html" },
    { t:"หน่วยงาน", u:B+"index.html#agencies" },
    { t:"บริการประชาชน", u:B+"index.html#services" },
    { t:"ข่าวสาร", u:B+"pages/news.html" },
    { t:"ท่องเที่ยว & ของดี", u:B+"pages/travel.html" },
    { t:"ITA", u:B+"pages/ita.html" },
    { t:"ติดต่อเรา", u:B+"pages/contact.html" }
  ];
  const here = location.pathname.split("/").pop();

  document.body.insertAdjacentHTML("afterbegin", `
<a class="skip-link" href="#main">ข้ามไปยังเนื้อหาหลัก</a>
<div class="topbar"><div class="container topbar__in">
  <p class="topbar__txt">ศูนย์ดำรงธรรมจังหวัดอุตรดิตถ์ โทร. <a href="tel:1567">1567</a></p>
  <div class="a11y" role="group" aria-label="เครื่องมือช่วยการเข้าถึง">
    <button type="button" data-font="dec" aria-label="ลดขนาดตัวอักษร">ก-</button>
    <button type="button" data-font="reset" aria-label="ขนาดตัวอักษรปกติ">ก</button>
    <button type="button" data-font="inc" aria-label="เพิ่มขนาดตัวอักษร">ก+</button>
    <button type="button" id="btnTheme" aria-pressed="false" aria-label="สลับธีมเป็นโหมดมืด">🌙</button>
    <button type="button" id="btnContrast" aria-pressed="false" aria-label="สลับโหมดความต่างสีสูง">◐</button>
  </div>
</div></div>
<header class="hd" id="header"><div class="container hd__in">
  <a class="hd__brand" href="${B}index.html">
    <img src="${B}assets/img/logo.png" alt="ตราประจำจังหวัดอุตรดิตถ์" width="52" height="52">
    <span><b>จังหวัดอุตรดิตถ์</b><small>Uttaradit Province</small></span></a>
  <button class="hd__burger" id="burger" aria-expanded="false" aria-controls="nav" aria-label="เปิดเมนู"><i></i><i></i><i></i></button>
  <nav class="nav" id="nav" aria-label="เมนูหลัก"><ul class="nav__list">
    ${MENU.map(m => `<li><a href="${m.u}"${m.u.endsWith(here) && here ? ' aria-current="page"' : ""}>${m.t}</a></li>`).join("")}
  </ul>
  <form class="nav__search" role="search" action="${B}pages/news.html">
    <label class="sr-only" for="q">ค้นหาในเว็บไซต์</label>
    <input id="q" name="q" type="search" placeholder="ค้นหา…" autocomplete="off">
    <button type="submit" aria-label="ค้นหา">🔍</button></form>
  </nav>
</div></header>`);

  document.body.insertAdjacentHTML("beforeend", `
<footer class="ft"><div class="container ft__grid">
  <div><img src="${B}assets/img/logo.png" alt="" width="56" height="56">
    <p><b>จังหวัดอุตรดิตถ์</b><br>ศาลากลางจังหวัดอุตรดิตถ์ ถนนประชานิมิตร<br>ต.ท่าอิฐ อ.เมืองอุตรดิตถ์ 53000</p></div>
  <nav aria-label="ลิงก์ส่วนท้าย 1"><h3>บริการ</h3><ul>
    <li><a href="${B}index.html#services">e-Service</a></li><li><a href="${B}index.html#services">ดาวน์โหลดแบบฟอร์ม</a></li>
    <li><a href="${B}index.html#services">คู่มือประชาชน</a></li><li><a href="${B}index.html#services">ร้องเรียน/ร้องทุกข์</a></li></ul></nav>
  <nav aria-label="ลิงก์ส่วนท้าย 2"><h3>ข้อมูลองค์กร</h3><ul>
    <li><a href="${B}pages/about.html">เกี่ยวกับจังหวัด</a></li><li><a href="${B}pages/ita.html">ITA / OIT</a></li>
    <li><a href="${B}index.html#agencies">หน่วยงานในสังกัด</a></li><li><a href="${B}sitemap.xml">แผนผังเว็บไซต์</a></li></ul></nav>
  <nav aria-label="ลิงก์ส่วนท้าย 3"><h3>นโยบาย</h3><ul>
    <li><a href="${B}pages/policy.html#pdpa">นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</a></li><li><a href="${B}pages/policy.html#cookie">นโยบายคุกกี้</a></li>
    <li><a href="${B}pages/policy.html#website">นโยบายเว็บไซต์</a></li><li><a href="${B}pages/policy.html#security">นโยบายความมั่นคงปลอดภัย</a></li></ul></nav>
</div>
<div class="ft__bar"><div class="container">
  <p>© 2569 จังหวัดอุตรดิตถ์ — สงวนลิขสิทธิ์</p>
  <p>พัฒนาตามมาตรฐานเว็บไซต์ภาครัฐ v2.0 &amp; WCAG 2.1 Level AA</p>
</div></div></footer>
<button id="toTop" class="totop" aria-label="กลับขึ้นด้านบน" hidden>↑</button>`);

  /* --- utilities ที่ใช้ร่วม --- */
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const sizes = [15,16,17.5,19,20.5];
  let fi = +(localStorage.getItem("utt_font") ?? 1);
  const applyFont = () => document.documentElement.style.setProperty("--font-base", sizes[fi]+"px");
  applyFont();
  $$(".a11y [data-font]").forEach(b => b.onclick = () => {
    const a = b.dataset.font;
    fi = a==="inc" ? Math.min(fi+1,4) : a==="dec" ? Math.max(fi-1,0) : 1;
    localStorage.setItem("utt_font", fi); applyFont();
  });
  const cb = $("#btnContrast");
  const setC = on => { document.documentElement.dataset.contrast = on?"high":"normal"; cb.setAttribute("aria-pressed", on); };
  setC(localStorage.getItem("utt_contrast")==="1");
  cb.onclick = () => { const on = cb.getAttribute("aria-pressed")!=="true"; setC(on); localStorage.setItem("utt_contrast", on?"1":"0"); };

  /* Theme (Light/Dark) — เหมือนกับ main.js ทุกประการ เพื่อให้ธีมสอดคล้องกันทุกหน้าที่ใช้ shell.js */
  const tb = $("#btnTheme");
  const setT = mode => {
    document.documentElement.dataset.theme = mode;
    tb.setAttribute("aria-pressed", mode === "dark");
    tb.setAttribute("aria-label", mode === "dark" ? "สลับธีมเป็นโหมดสว่าง" : "สลับธีมเป็นโหมดมืด");
    tb.textContent = mode === "dark" ? "☀️" : "🌙";
  };
  let savedTheme = null;
  try { savedTheme = localStorage.getItem("utt_theme"); } catch (e) { /* private mode ฯลฯ */ }
  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  setT(savedTheme === "dark" || savedTheme === "light" ? savedTheme : (prefersDark ? "dark" : "light"));
  tb.onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setT(next);
    try { localStorage.setItem("utt_theme", next); } catch (e) { /* private mode ฯลฯ */ }
  };

  const hd = $("#header"), burger = $("#burger"), nav = $("#nav"), top = $("#toTop");
  let bd = null;
  const closeNav = () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded","false"); document.body.style.overflow=""; bd?.remove(); bd=null; };
  /* บั๊กด้าน Keyboard Navigation: เมนูมือถือของหน้าย่อยไม่ได้ย้ายโฟกัสเข้าเมนูตอนเปิด (ต่างจาก main.js)
     และไม่มีการดักโฟกัส (focus trap) ทำให้กด Tab ทะลุออกไปโต้ตอบกับเนื้อหาด้านหลังที่ถูกซ่อนได้ */
  function trapNavFocus(e) {
    if (e.key !== "Tab" || !nav.classList.contains("is-open")) return;
    const items = $$('a[href], button:not([disabled])').filter(el => nav.contains(el));
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  addEventListener("keydown", trapNavFocus);
  burger.onclick = () => {
    const open = burger.getAttribute("aria-expanded")!=="true";
    if (!open) return closeNav();
    burger.setAttribute("aria-expanded","true"); nav.classList.add("is-open"); document.body.style.overflow="hidden";
    bd = Object.assign(document.createElement("div"), { className:"nav-backdrop" });
    bd.onclick = () => { closeNav(); burger.focus(); }; document.body.appendChild(bd);
    requestAnimationFrame(() => bd.classList.add("is-on"));
    nav.querySelector("a")?.focus();
  };
  addEventListener("keydown", e => { if (e.key==="Escape" && nav.classList.contains("is-open")) { closeNav(); burger.focus(); } });
  addEventListener("scroll", () => {
    hd.classList.toggle("is-stuck", scrollY > 12);
    top.hidden = scrollY < 420;
  }, { passive:true });
  top.onclick = () => scrollTo({ top:0, behavior:"smooth" });

  /* reveal ใช้ร่วม */
  window.observeReveal = function () {
    if (!("IntersectionObserver" in window)) return $$("[data-reveal]").forEach(e=>e.classList.add("is-in"));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold:.12 });
    $$("[data-reveal]:not(.is-in)").forEach(e => io.observe(e));
  };
  window.escHtml = s => String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  window.fmtDate = iso => new Date(iso).toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" });
})();


