/* page-travel.js — ฟิลเตอร์แหล่งท่องเที่ยวผ่าน API layer + sync URL */
(function () {
  "use strict";
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const grid = $("#tvGrid"), tabs = $("#tvTabs");
  const tags = ["ทั้งหมด", ...new Set(CONFIG.travel.map(t => t.tag))];
  let active = new URLSearchParams(location.search).get("tag") || "ทั้งหมด";
  if (!tags.includes(active)) active = "ทั้งหมด";

  /* ค่า data-tag / ?tag= คงเป็นภาษาไทยตามข้อมูลเดิม (URL ไม่เปลี่ยน) — เปลี่ยนเฉพาะป้ายที่แสดง */
  const tagLabel = tg => tg === "ทั้งหมด" ? t("common.all") : I18N.tag(tg, CONFIG.travel.find(x => x.tag === tg));
  const buildTabs = () => {
    tabs.innerHTML = tags.map(tg =>
      `<button role="tab" data-tag="${escHtml(tg)}" aria-selected="${tg === active}">${escHtml(tagLabel(tg))}</button>`).join("");
  };
  buildTabs();

  async function load() {
    API.ui.skeleton(grid, 6);
    try {
      const { items } = await API.travel({ tag: active === "ทั้งหมด" ? "" : active });
      grid.innerHTML = items.length ? items.map(tv => `
        <li class="card" data-reveal>
          <div class="card__media"><img src="../${tv.img}" alt="${escHtml(pick(tv, "t"))}" loading="lazy" width="600" height="450">
            <span class="card__tag">${escHtml(I18N.tag(tv.tag, tv))}</span></div>
          <div class="card__body">
            <h2 class="card__title"><a href="travel-detail.html?id=${tv.id}">${escHtml(pick(tv, "t"))}</a></h2>
            <p class="card__ex">${escHtml(pick(tv, "s"))}</p>
            <a class="card__more" href="travel-detail.html?id=${tv.id}">${t("common.viewDetail")}</a>
          </div></li>`).join("")
        : `<li class="state">${t("travel.noneInCat")}</li>`;
      observeReveal();
    } catch (e) {
      API.ui.error(grid, t("travel.loadError"), load);
    }
  }

  tabs.addEventListener("click", e => {
    const b = e.target.closest("button[data-tag]"); if (!b) return;
    active = b.dataset.tag;
    $$("#tvTabs button").forEach(x => x.setAttribute("aria-selected", x === b));
    history.replaceState(null, "", active === "ทั้งหมด" ? location.pathname : `?tag=${encodeURIComponent(active)}`);
    load();
  });
  tabs.addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const bs = $$("#tvTabs button"), i = bs.indexOf(document.activeElement); if (i < 0) return;
    const n = bs[(i + (e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length];
    n.focus(); n.click(); e.preventDefault();
  });

  load();

  /* ---------- สินค้า GI และ OTOP (แยกสองกลุ่มชัดเจน เชื่อมโยงไปหน้ารายละเอียดจริงด้วย id) ---------- */
  const giGrid = $("#giGrid"), otopGrid = $("#otopGrid");
  async function loadProducts() {
    try {
      const [gi, otop] = await Promise.all([
        API.products({ type: "gi" }),
        API.products({ type: "otop" })
      ]);
      const row = p => {
        /* รูปสินค้ามาจาก field "img" ใน data/products.json (Admin อัปโหลด) — ไม่มีรูป/รูปเสีย → ภาพตัวแทนกลางของเว็บ */
        const U = window.UTT_IMG || { pick: x => x.img || "", resolve: x => x ? "../" + x : "", placeholder: () => "" };
        const real = U.pick(p);
        const src = real ? U.resolve(real) : U.placeholder(400, 300);
        return `<li><a href="product-detail.html?id=${p.id}"><span class="svc__media"><img class="svc__img${real ? "" : " img-fallback"}" src="${escHtml(src)}" alt="${real ? escHtml(pick(p, "t")) : ""}" width="400" height="300" loading="lazy" decoding="async"></span><b>${escHtml(pick(p, "t"))}</b><small>${escHtml(pick(p, "s"))}</small></a></li>`;
      };
      if (giGrid) giGrid.innerHTML = gi.items.map(row).join("");
      if (otopGrid) otopGrid.innerHTML = otop.items.map(row).join("");
    } catch (e) {
      if (giGrid) API.ui.error(giGrid, t("travel.giLoadError"), loadProducts);
      if (otopGrid) otopGrid.innerHTML = "";
    }
  }
  loadProducts();
  I18N.onChange(() => { buildTabs(); load(); loadProducts(); });   // สลับภาษา: วาดแท็บ/การ์ดใหม่ คงหมวดที่เลือกไว้
})();
