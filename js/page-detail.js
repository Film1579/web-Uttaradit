/* page-detail.js — โหลดข่าวตาม ?id= + Share + Prev/Next + JSON-LD ไดนามิก (สองภาษา: วาดใหม่เมื่อสลับ TH/EN) */
(async function () {
  "use strict";
  if (window.UTT_DATA_READY) await window.UTT_DATA_READY; // รอข้อมูลกลางจริง (data/*.json) ก่อนอ่าน CONFIG/DATA
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;
  const C = window.CONFIG, D = window.DATA, $ = s => document.querySelector(s);
  const id = +(new URLSearchParams(location.search).get("id") || 0);
  const sorted = [...C.news].sort((a,b) => b.date.localeCompare(a.date));
  const idx = sorted.findIndex(n => n.id === id);
  const art = $("#art");

  function drawNotFound() {
    art.innerHTML = `<div class="nf"><b>404</b><h1>${t("news.notFoundTitle")}</h1>
      <p>${t("news.notFoundBody")}</p><p><a class="btn btn--brand" href="news.html">${t("news.backToList")}</a></p></div>`;
  }
  if (idx < 0) { drawNotFound(); I18N.onChange(drawNotFound); return; }

  const n = sorted[idx], body = D.newsBody[n.id] || {};
  const url = location.href;
  const ld = document.createElement("script");
  ld.type = "application/ld+json"; ld.id = "ldNews";
  document.head.appendChild(ld);

  function draw() {
    const title = pick(n, "title"), ex = pick(n, "ex");
    const catName = pick(C.newsCats.find(c => c.id === n.cat), "name") || "";
    const src = pick(n, "src");
    const tags = pick(body, "tags");
    const bodyHtml = pick(body, "html");
    const caption = pick(body, "caption");
    const thaiOnly = I18N.getLanguage() === "en" && (!I18N.hasEn(n, "title") || (body.html && !I18N.hasEn(body, "html")));

    /* --- meta / breadcrumb / title (ล็อกไว้ ไม่ให้ i18n.apply() ทับด้วยค่ากลางของหน้า) --- */
    I18N.setTitle(title + " | " + t("brand.name"));
    I18N.setMeta("#metaDesc", ex);
    I18N.setText($("#crumbNow"), catName);
    I18N.setText($("#pTitle"), catName);

    art.innerHTML = `
    <h1 style="margin-bottom:14px">${escHtml(title)}</h1>
    <div class="art__meta">
      <span class="badge">${escHtml(catName)}</span>
      <span>📅 <time datetime="${n.date}">${fmtDate(n.date)}</time></span>
      ${src ? `<span>🏛️ ${escHtml(src)}</span>` : ""}
    </div>
    ${thaiOnly ? `<p class="note" role="note">${t("common.thaiOnly")}</p>` : ""}
    <figure class="art__cover">
      <img src="../${body.cover || n.img}" alt="${escHtml(title)}" width="900" height="506">
      ${caption ? `<figcaption>${escHtml(caption)}</figcaption>` : ""}
    </figure>
    <div class="art__body">${bodyHtml || `<p>${escHtml(ex)}</p>`}</div>
    ${n.srcUrl ? `<p class="note note--src" style="margin-top:24px">
      <b>${t("news.source")}</b> ${escHtml(src || "")} —
      <a href="${escHtml(n.srcUrl)}" target="_blank" rel="noopener">${t("news.readOriginal")}</a>
    </p>` : ""}
    ${tags?.length ? `<div class="tags">${tags.map(tg =>
        `<a href="news.html?q=${encodeURIComponent(tg)}">#${escHtml(tg)}</a>`).join("")}</div>` : ""}
    <div class="share">
      <b>${t("news.shareThis")}</b>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t("share.facebook")}">f</a>
      <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t("share.line")}">L</a>
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}" target="_blank" rel="noopener" aria-label="${t("share.x")}">𝕏</a>
      <button type="button" id="btnCopy" aria-label="${t("share.copy")}">🔗</button>
      <button type="button" onclick="window.print()" aria-label="${t("share.print")}">🖨️</button>
      <span id="copyMsg" role="status" style="font-size:.85rem;color:#1E7A45"></span>
    </div>
    <nav class="artnav" aria-label="${t("news.prevnextLabel")}">
      ${sorted[idx+1] ? `<a href="?id=${sorted[idx+1].id}"><small>${t("news.prev")}</small>${escHtml(pick(sorted[idx+1], "title"))}</a>` : "<span></span>"}
      ${sorted[idx-1] ? `<a class="next" href="?id=${sorted[idx-1].id}"><small>${t("news.next")}</small>${escHtml(pick(sorted[idx-1], "title"))}</a>` : "<span></span>"}
    </nav>`;

    /* --- copy link --- */
    $("#btnCopy").onclick = async () => {
      try { await navigator.clipboard.writeText(url); $("#copyMsg").textContent = t("share.copied"); }
      catch { $("#copyMsg").textContent = t("share.copyFail"); }
      setTimeout(() => $("#copyMsg").textContent = "", 2400);
    };

    /* --- related --- */
    const rel = sorted.filter(x => x.cat === n.cat && x.id !== n.id).slice(0, 5);
    $("#related").innerHTML = (rel.length ? rel : sorted.filter(x=>x.id!==n.id).slice(0,5))
      .map(r => `<li><a href="?id=${r.id}">${escHtml(pick(r, "title"))}</a><time datetime="${r.date}">${fmtDate(r.date)}</time></li>`).join("");

    /* --- JSON-LD --- */
    ld.textContent = JSON.stringify({
      "@context":"https://schema.org","@type":"NewsArticle",
      headline: title, datePublished: n.date, description: ex, inLanguage: I18N.getLanguage(),
      image: [location.origin + "/" + n.img],
      author: { "@type":"Organization", name: src || t("brand.name") },
      publisher: { "@type":"GovernmentOrganization", name: t("brand.name") }
    });
  }
  draw();
  I18N.onChange(draw);
})();
