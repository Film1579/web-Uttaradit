/* page-travel-detail.js — โหลดแหล่งท่องเที่ยวตาม ?id= จาก CONFIG.travel + DATA.travelBody */
(function () {
  "use strict";
  const C = window.CONFIG, D = window.DATA, $ = s => document.querySelector(s);
  const id = +(new URLSearchParams(location.search).get("id") || 0);
  const list = C.travel;
  const idx = list.findIndex(t => t.id === id);
  const art = $("#art");

  if (idx < 0) {
    art.innerHTML = `<div class="nf"><b>404</b><h1>ไม่พบแหล่งท่องเที่ยวที่ต้องการ</h1>
      <p>รายการนี้อาจถูกลบหรือย้ายที่แล้ว</p><p><a class="btn btn--brand" href="travel.html">กลับหน้าท่องเที่ยว &amp; ของดี</a></p></div>`;
    return;
  }

  const t = list[idx], body = D.travelBody[t.id] || {};
  const url = location.href;

  /* --- meta / breadcrumb / title --- */
  document.title = t.t + " | จังหวัดอุตรดิตถ์";
  $("#metaDesc").content = t.s;
  $("#crumbNow").textContent = t.t;
  $("#pTitle").textContent = t.t;

  /* --- article --- */
  art.innerHTML = `
    <h1 style="margin-bottom:14px">${escHtml(t.t)}</h1>
    <div class="art__meta">
      <span class="badge">${escHtml(t.tag)}</span>
    </div>
    <figure class="art__cover">
      <img src="../${t.img}" alt="${escHtml(t.t)}" width="900" height="506">
    </figure>
    <div class="art__body">${body.html || `<p>${escHtml(t.s)}</p>`}</div>
    <div class="share">
      <b>แชร์หน้านี้:</b>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง Facebook">f</a>
      <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง LINE">L</a>
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(t.t)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง X">𝕏</a>
      <button type="button" id="btnCopy" aria-label="คัดลอกลิงก์">🔗</button>
      <button type="button" onclick="window.print()" aria-label="พิมพ์หน้านี้">🖨️</button>
      <span id="copyMsg" role="status" style="font-size:.85rem;color:#1E7A45"></span>
    </div>
    <nav class="artnav" aria-label="แหล่งท่องเที่ยวก่อนหน้า/ถัดไป">
      ${list[idx-1] ? `<a href="?id=${list[idx-1].id}"><small>‹ ก่อนหน้า</small>${escHtml(list[idx-1].t)}</a>` : "<span></span>"}
      ${list[idx+1] ? `<a class="next" href="?id=${list[idx+1].id}"><small>ถัดไป ›</small>${escHtml(list[idx+1].t)}</a>` : "<span></span>"}
    </nav>`;

  /* --- copy link --- */
  $("#btnCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(url); $("#copyMsg").textContent = "คัดลอกลิงก์แล้ว"; }
    catch { $("#copyMsg").textContent = "คัดลอกไม่สำเร็จ"; }
    setTimeout(() => $("#copyMsg").textContent = "", 2400);
  };

  /* --- related --- */
  const rel = list.filter(x => x.tag === t.tag && x.id !== t.id).slice(0, 5);
  $("#related").innerHTML = (rel.length ? rel : list.filter(x=>x.id!==t.id).slice(0,5))
    .map(r => `<li><a href="?id=${r.id}">${escHtml(r.t)}</a></li>`).join("");

  /* --- JSON-LD --- */
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context":"https://schema.org","@type":"TouristAttraction",
    name: t.t, description: t.s,
    image: [location.origin + "/" + t.img]
  });
  document.head.appendChild(ld);
})();

