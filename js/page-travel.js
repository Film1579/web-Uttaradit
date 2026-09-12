/* page-travel.js — ฟิลเตอร์แหล่งท่องเที่ยวผ่าน API layer + sync URL */
(function () {
  "use strict";
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const grid = $("#tvGrid"), tabs = $("#tvTabs");
  const tags = ["ทั้งหมด", ...new Set(CONFIG.travel.map(t => t.tag))];
  let active = new URLSearchParams(location.search).get("tag") || "ทั้งหมด";
  if (!tags.includes(active)) active = "ทั้งหมด";

  tabs.innerHTML = tags.map(t =>
    `<button role="tab" data-tag="${escHtml(t)}" aria-selected="${t === active}">${escHtml(t)}</button>`).join("");

  async function load() {
    API.ui.skeleton(grid, 6);
    try {
      const { items } = await API.travel({ tag: active === "ทั้งหมด" ? "" : active });
      grid.innerHTML = items.length ? items.map(t => `
        <li class="card" data-reveal>
          <div class="card__media"><img src="../${t.img}" alt="${escHtml(t.t)}" loading="lazy" width="600" height="450">
            <span class="card__tag">${escHtml(t.tag)}</span></div>
          <div class="card__body">
            <h2 class="card__title"><a href="travel-detail.html?id=${t.id}">${escHtml(t.t)}</a></h2>
            <p class="card__ex">${escHtml(t.s)}</p>
            <a class="card__more" href="travel-detail.html?id=${t.id}">ดูรายละเอียด →</a>
          </div></li>`).join("")
        : `<li class="state">ไม่พบแหล่งท่องเที่ยวในหมวดนี้</li>`;
      observeReveal();
    } catch (e) {
      API.ui.error(grid, "ไม่สามารถโหลดข้อมูลแหล่งท่องเที่ยวได้", load);
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
      const row = p => `<li><a href="product-detail.html?id=${p.id}"><span class="ic" aria-hidden="true">${p.ic}</span><b>${escHtml(p.t)}</b><small>${escHtml(p.s)}</small></a></li>`;
      if (giGrid) giGrid.innerHTML = gi.items.map(row).join("");
      if (otopGrid) otopGrid.innerHTML = otop.items.map(row).join("");
    } catch (e) {
      if (giGrid) API.ui.error(giGrid, "ไม่สามารถโหลดข้อมูลสินค้า GI ได้", loadProducts);
      if (otopGrid) otopGrid.innerHTML = "";
    }
  }
  loadProducts();
})();


