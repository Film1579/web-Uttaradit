/* page-product-detail.js — โหลดสินค้า GI/OTOP ตาม ?id= จาก CONFIG.products + DATA.productBody */
(function () {
  "use strict";
  const C = window.CONFIG, D = window.DATA, $ = s => document.querySelector(s);
  const id = +(new URLSearchParams(location.search).get("id") || 0);
  const list = C.products;
  const idx = list.findIndex(p => p.id === id);
  const art = $("#art");

  if (idx < 0) {
    art.innerHTML = `<div class="nf"><b>404</b><h1>ไม่พบสินค้าที่ต้องการ</h1>
      <p>รายการนี้อาจถูกลบหรือย้ายที่แล้ว</p><p><a class="btn btn--brand" href="travel.html">กลับหน้าท่องเที่ยว &amp; ของดี</a></p></div>`;
    return;
  }

  const p = list[idx], body = D.productBody[p.id] || {};
  const isGI = p.type === "gi";
  const url = location.href;

  /* --- meta / breadcrumb / title --- */
  document.title = p.t + " | จังหวัดอุตรดิตถ์";
  $("#metaDesc").content = p.s;
  $("#crumbNow").textContent = p.t;
  $("#pTitle").textContent = p.t;

  /* --- article --- */
  art.innerHTML = `
    <h1 style="margin-bottom:14px">${p.ic ? `<span aria-hidden="true">${p.ic}</span> ` : ""}${escHtml(p.t)}</h1>
    <div class="art__meta">
      <span class="badge" style="${isGI ? "" : "background:#EFEFEF;color:#555"}">${escHtml(p.tag)}</span>
    </div>
    <div class="art__body">${body.html || `<p>${escHtml(p.s)}</p>`}</div>
    ${body.tags?.length ? `<div class="tags">${body.tags.map(t =>
        `<span>#${escHtml(t)}</span>`).join("")}</div>` : ""}
    <div class="share">
      <b>แชร์หน้านี้:</b>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง Facebook">f</a>
      <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง LINE">L</a>
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(p.t)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง X">𝕏</a>
      <button type="button" id="btnCopy" aria-label="คัดลอกลิงก์">🔗</button>
      <button type="button" onclick="window.print()" aria-label="พิมพ์หน้านี้">🖨️</button>
      <span id="copyMsg" role="status" style="font-size:.85rem;color:#1E7A45"></span>
    </div>
    <nav class="artnav" aria-label="สินค้าก่อนหน้า/ถัดไป">
      ${list[idx-1] ? `<a href="?id=${list[idx-1].id}"><small>‹ ก่อนหน้า</small>${escHtml(list[idx-1].t)}</a>` : "<span></span>"}
      ${list[idx+1] ? `<a class="next" href="?id=${list[idx+1].id}"><small>ถัดไป ›</small>${escHtml(list[idx+1].t)}</a>` : "<span></span>"}
    </nav>`;

  /* --- copy link --- */
  $("#btnCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(url); $("#copyMsg").textContent = "คัดลอกลิงก์แล้ว"; }
    catch { $("#copyMsg").textContent = "คัดลอกไม่สำเร็จ"; }
    setTimeout(() => $("#copyMsg").textContent = "", 2400);
  };

  /* --- related: สินค้าประเภทเดียวกัน (GI คู่กับ GI, OTOP คู่กับ OTOP) --- */
  const rel = list.filter(x => x.type === p.type && x.id !== p.id).slice(0, 5);
  $("#related").innerHTML = rel.map(r =>
    `<li><a href="?id=${r.id}">${r.ic ? `${r.ic} ` : ""}${escHtml(r.t)}</a></li>`).join("")
    || `<li><span style="color:var(--muted)">ไม่มีสินค้าอื่นในกลุ่มนี้</span></li>`;

  /* --- JSON-LD --- */
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context":"https://schema.org","@type":"Product",
    name: p.t, description: p.s,
    brand: { "@type":"Organization", name:"จังหวัดอุตรดิตถ์" }
  });
  document.head.appendChild(ld);
})();

