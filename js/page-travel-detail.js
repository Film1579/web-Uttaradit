/* page-travel-detail.js — โหลดแหล่งท่องเที่ยวตาม ?id= จาก CONFIG.travel + DATA.travelBody (สองภาษา: วาดใหม่เมื่อสลับ TH/EN) */
(async function () {
  "use strict";
  if (window.UTT_DATA_READY) await window.UTT_DATA_READY; // รอข้อมูลกลางจริง (data/*.json) ก่อนอ่าน CONFIG/DATA
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;
  const C = window.CONFIG, D = window.DATA, $ = s => document.querySelector(s);
  const id = +(new URLSearchParams(location.search).get("id") || 0);
  const list = C.travel;
  const idx = list.findIndex(x => x.id === id);
  const art = $("#art");

  function drawNotFound() {
    art.innerHTML = `<div class="nf"><b>404</b><h1>${t("travel.notFoundTitle")}</h1>
      <p>${t("travel.notFoundBody")}</p><p><a class="btn btn--brand" href="travel.html">${t("travel.back")}</a></p></div>`;
  }
  if (idx < 0) { drawNotFound(); I18N.onChange(drawNotFound); return; }

  const p = list[idx], body = D.travelBody[p.id] || {};
  const url = location.href;
  const ld = document.createElement("script");
  ld.type = "application/ld+json"; ld.id = "ldTravel";
  document.head.appendChild(ld);

  function draw() {
    const name = pick(p, "t"), desc = pick(p, "s"), bodyHtml = pick(body, "html");
    const thaiOnly = I18N.getLanguage() === "en" && (!I18N.hasEn(p, "t") || (body.html && !I18N.hasEn(body, "html")));

    I18N.setTitle(name + " | " + t("brand.name"));
    I18N.setMeta("#metaDesc", desc);
    I18N.setText($("#crumbNow"), name);
    I18N.setText($("#pTitle"), name);

    art.innerHTML = `
    <h1 style="margin-bottom:14px">${escHtml(name)}</h1>
    <div class="art__meta">
      <span class="badge">${escHtml(I18N.tag(p.tag, p))}</span>
    </div>
    ${thaiOnly ? `<p class="note" role="note">${t("common.thaiOnly")}</p>` : ""}
    <figure class="art__cover">
      <img src="../${p.img}" alt="${escHtml(name)}" width="900" height="506">
    </figure>
    <div class="art__body">${bodyHtml || `<p>${escHtml(desc)}</p>`}</div>
    <div class="share">
      <b>${t("share.page")}</b>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t("share.facebook")}">f</a>
      <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t("share.line")}">L</a>
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(name)}" target="_blank" rel="noopener" aria-label="${t("share.x")}">𝕏</a>
      <button type="button" id="btnCopy" aria-label="${t("share.copy")}">🔗</button>
      <button type="button" onclick="window.print()" aria-label="${t("share.print")}">🖨️</button>
      <span id="copyMsg" role="status" style="font-size:.85rem;color:#1E7A45"></span>
    </div>
    <nav class="artnav" aria-label="${t("travel.prevnextLabel")}">
      ${list[idx-1] ? `<a href="?id=${list[idx-1].id}"><small>${t("travel.prev")}</small>${escHtml(pick(list[idx-1], "t"))}</a>` : "<span></span>"}
      ${list[idx+1] ? `<a class="next" href="?id=${list[idx+1].id}"><small>${t("travel.next")}</small>${escHtml(pick(list[idx+1], "t"))}</a>` : "<span></span>"}
    </nav>`;

    $("#btnCopy").onclick = async () => {
      try { await navigator.clipboard.writeText(url); $("#copyMsg").textContent = t("share.copied"); }
      catch { $("#copyMsg").textContent = t("share.copyFail"); }
      setTimeout(() => $("#copyMsg").textContent = "", 2400);
    };

    const rel = list.filter(x => x.tag === p.tag && x.id !== p.id).slice(0, 5);
    $("#related").innerHTML = (rel.length ? rel : list.filter(x=>x.id!==p.id).slice(0,5))
      .map(r => `<li><a href="?id=${r.id}">${escHtml(pick(r, "t"))}</a></li>`).join("");

    ld.textContent = JSON.stringify({
      "@context":"https://schema.org","@type":"TouristAttraction",
      name, description: desc, inLanguage: I18N.getLanguage(),
      image: [location.origin + "/" + p.img]
    });
  }
  draw();
  I18N.onChange(draw);
})();
