/* page-product-detail.js — โหลดสินค้า GI/OTOP ตาม ?id= จาก CONFIG.products + DATA.productBody (สองภาษา: วาดใหม่เมื่อสลับ TH/EN) */
(async function () {
  "use strict";
  if (window.UTT_DATA_READY) await window.UTT_DATA_READY; // รอข้อมูลกลางจริง (data/*.json) ก่อนอ่าน CONFIG/DATA
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;
  const C = window.CONFIG, D = window.DATA, $ = s => document.querySelector(s);
  const id = +(new URLSearchParams(location.search).get("id") || 0);
  const list = C.products;
  const idx = list.findIndex(x => x.id === id);
  const art = $("#art");

  function drawNotFound() {
    art.innerHTML = `<div class="nf"><b>404</b><h1>${t("product.notFoundTitle")}</h1>
      <p>${t("travel.notFoundBody")}</p><p><a class="btn btn--brand" href="travel.html">${t("travel.back")}</a></p></div>`;
  }
  if (idx < 0) { drawNotFound(); I18N.onChange(drawNotFound); return; }

  const p = list[idx], body = D.productBody[p.id] || {};
  const isGI = p.type === "gi";
  const url = location.href;

  /* รูปสินค้ามาจาก field "img" ใน data/products.json (Admin อัปโหลด) — ไม่มีรูป/รูปเสีย → ภาพตัวแทนกลางของเว็บ (img-fallback.js) */
  const U = window.UTT_IMG || { pick: x => x.img || "", resolve: x => x ? "../" + x : "", placeholder: () => "" };
  const realImg = U.pick(p);
  const coverSrc = realImg ? U.resolve(realImg) : U.placeholder(900, 563);
  const ld = document.createElement("script");
  ld.type = "application/ld+json"; ld.id = "ldProduct";
  document.head.appendChild(ld);

  function draw() {
    const name = pick(p, "t"), desc = pick(p, "s"), bodyHtml = pick(body, "html"), tags = pick(body, "tags");
    const thaiOnly = I18N.getLanguage() === "en" && (!I18N.hasEn(p, "t") || (body.html && !I18N.hasEn(body, "html")));

    I18N.setTitle(name + " | " + t("brand.name"));
    I18N.setMeta("#metaDesc", desc);
    I18N.setText($("#crumbNow"), name);
    I18N.setText($("#pTitle"), name);

    art.innerHTML = `
    <h1 style="margin-bottom:14px">${escHtml(name)}</h1>
    <div class="art__meta">
      <span class="badge" style="${isGI ? "" : "background:#EFEFEF;color:#555"}">${escHtml(I18N.tag(p.tag, p))}</span>
    </div>
    ${thaiOnly ? `<p class="note" role="note">${t("common.thaiOnly")}</p>` : ""}
    <figure class="art__cover art__cover--product">
      <img src="${escHtml(coverSrc)}" alt="${realImg ? escHtml(name) : ""}" width="900" height="563" decoding="async"${realImg ? "" : ' class="img-fallback"'}>
    </figure>
    <div class="art__body">${bodyHtml || `<p>${escHtml(desc)}</p>`}</div>
    ${tags?.length ? `<div class="tags">${tags.map(tg =>
        `<span>#${escHtml(tg)}</span>`).join("")}</div>` : ""}
    <div class="share">
      <b>${t("share.page")}</b>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t("share.facebook")}">f</a>
      <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t("share.line")}">L</a>
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(name)}" target="_blank" rel="noopener" aria-label="${t("share.x")}">𝕏</a>
      <button type="button" id="btnCopy" aria-label="${t("share.copy")}">🔗</button>
      <button type="button" onclick="window.print()" aria-label="${t("share.print")}">🖨️</button>
      <span id="copyMsg" role="status" style="font-size:.85rem;color:#1E7A45"></span>
    </div>
    <nav class="artnav" aria-label="${t("product.prevnextLabel")}">
      ${list[idx-1] ? `<a href="?id=${list[idx-1].id}"><small>${t("travel.prev")}</small>${escHtml(pick(list[idx-1], "t"))}</a>` : "<span></span>"}
      ${list[idx+1] ? `<a class="next" href="?id=${list[idx+1].id}"><small>${t("travel.next")}</small>${escHtml(pick(list[idx+1], "t"))}</a>` : "<span></span>"}
    </nav>`;

    $("#btnCopy").onclick = async () => {
      try { await navigator.clipboard.writeText(url); $("#copyMsg").textContent = t("share.copied"); }
      catch { $("#copyMsg").textContent = t("share.copyFail"); }
      setTimeout(() => $("#copyMsg").textContent = "", 2400);
    };

    /* related: สินค้าประเภทเดียวกัน (GI คู่กับ GI, OTOP คู่กับ OTOP) */
    const rel = list.filter(x => x.type === p.type && x.id !== p.id).slice(0, 5);
    $("#related").innerHTML = rel.map(r => {
      const rp = U.pick(r), rs = rp ? U.resolve(rp) : U.placeholder(52, 52);
      return `<li><a class="rel-item" href="?id=${r.id}"><img src="${escHtml(rs)}" alt="" width="52" height="52" loading="lazy" decoding="async"><span>${escHtml(pick(r, "t"))}</span></a></li>`;
    }).join("")
      || `<li><span style="color:var(--muted)">${t("product.noneOther")}</span></li>`;

    ld.textContent = JSON.stringify({
      "@context":"https://schema.org","@type":"Product",
      name, description: desc, inLanguage: I18N.getLanguage(),
      ...(realImg ? { image: [new URL(U.resolve(realImg), location.href).href] } : {}),
      brand: { "@type":"Organization", name: t("brand.name") }
    });
  }
  draw();
  I18N.onChange(draw);
})();
