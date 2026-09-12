/* page-detail.js — โหลดข่าวตาม ?id= + Share + Prev/Next + JSON-LD ไดนามิก */
(function () {
  "use strict";
  const C = window.CONFIG, D = window.DATA, $ = s => document.querySelector(s);
  const id = +(new URLSearchParams(location.search).get("id") || 0);
  const sorted = [...C.news].sort((a,b) => b.date.localeCompare(a.date));
  const idx = sorted.findIndex(n => n.id === id);
  const art = $("#art");

  if (idx < 0) {
    art.innerHTML = `<div class="nf"><b>404</b><h1>ไม่พบข่าวที่ต้องการ</h1>
      <p>ข่าวอาจถูกลบหรือย้ายที่แล้ว</p><p><a class="btn btn--brand" href="news.html">กลับหน้ารวมข่าว</a></p></div>`;
    return;
  }

  const n = sorted[idx], body = D.newsBody[n.id] || {};
  const catName = C.newsCats.find(c => c.id === n.cat)?.name || "";
  const url = location.href;

  /* --- meta / breadcrumb / title --- */
  document.title = n.title + " | จังหวัดอุตรดิตถ์";
  $("#metaDesc").content = n.ex;
  $("#crumbNow").textContent = catName;
  $("#pTitle").textContent = catName;

  /* --- article --- */
  art.innerHTML = `
    <h1 style="margin-bottom:14px">${escHtml(n.title)}</h1>
    <div class="art__meta">
      <span class="badge">${catName}</span>
      <span>📅 <time datetime="${n.date}">${fmtDate(n.date)}</time></span>
      ${n.src ? `<span>🏛️ ${escHtml(n.src)}</span>` : ""}
    </div>
    <figure class="art__cover">
      <img src="../${body.cover || n.img}" alt="${escHtml(n.title)}" width="900" height="506">
      ${body.caption ? `<figcaption>${escHtml(body.caption)}</figcaption>` : ""}
    </figure>
    <div class="art__body">${body.html || `<p>${escHtml(n.ex)}</p>`}</div>
    ${n.srcUrl ? `<p class="note note--src" style="margin-top:24px">
      <b>แหล่งข่าวต้นทาง:</b> ${escHtml(n.src || "")} —
      <a href="${escHtml(n.srcUrl)}" target="_blank" rel="noopener">อ่านข่าวฉบับเต็มจากต้นทาง ↗</a>
    </p>` : ""}
    ${body.tags?.length ? `<div class="tags">${body.tags.map(t =>
        `<a href="news.html?q=${encodeURIComponent(t)}">#${escHtml(t)}</a>`).join("")}</div>` : ""}
    <div class="share">
      <b>แชร์ข่าวนี้:</b>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง Facebook">f</a>
      <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง LINE">L</a>
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(n.title)}" target="_blank" rel="noopener" aria-label="แชร์ไปยัง X">𝕏</a>
      <button type="button" id="btnCopy" aria-label="คัดลอกลิงก์">🔗</button>
      <button type="button" onclick="window.print()" aria-label="พิมพ์หน้านี้">🖨️</button>
      <span id="copyMsg" role="status" style="font-size:.85rem;color:#1E7A45"></span>
    </div>
    <nav class="artnav" aria-label="ข่าวก่อนหน้า/ถัดไป">
      ${sorted[idx+1] ? `<a href="?id=${sorted[idx+1].id}"><small>‹ ข่าวก่อนหน้า</small>${escHtml(sorted[idx+1].title)}</a>` : "<span></span>"}
      ${sorted[idx-1] ? `<a class="next" href="?id=${sorted[idx-1].id}"><small>ข่าวถัดไป ›</small>${escHtml(sorted[idx-1].title)}</a>` : "<span></span>"}
    </nav>`;

  /* --- copy link --- */
  $("#btnCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(url); $("#copyMsg").textContent = "คัดลอกลิงก์แล้ว"; }
    catch { $("#copyMsg").textContent = "คัดลอกไม่สำเร็จ"; }
    setTimeout(() => $("#copyMsg").textContent = "", 2400);
  };

  /* --- related --- */
  const rel = sorted.filter(x => x.cat === n.cat && x.id !== n.id).slice(0, 5);
  $("#related").innerHTML = (rel.length ? rel : sorted.filter(x=>x.id!==n.id).slice(0,5))
    .map(r => `<li><a href="?id=${r.id}">${escHtml(r.title)}</a><time datetime="${r.date}">${fmtDate(r.date)}</time></li>`).join("");

  /* --- JSON-LD --- */
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context":"https://schema.org","@type":"NewsArticle",
    headline: n.title, datePublished: n.date, description: n.ex,
    image: [location.origin + "/" + n.img],
    author: { "@type":"Organization", name: n.src || "จังหวัดอุตรดิตถ์" },
    publisher: { "@type":"GovernmentOrganization", name:"จังหวัดอุตรดิตถ์" }
  });
  document.head.appendChild(ld);
})();


