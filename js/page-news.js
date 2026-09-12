/* page-news.js — Tabs + Search + Filter + Pagination (อ่านค่าเริ่มต้นจาก URL query) */
(function () {
  "use strict";
  const C = window.CONFIG, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const P = new URLSearchParams(location.search);
  let cat = P.get("cat") || "all", query = (P.get("q") || "").toLowerCase(), page = +(P.get("page") || 1);
  const PS = C.site.pageSize;
  const grid = $("#newsGrid"), pager = $("#newsPager"), empty = $("#newsEmpty");

  $("#newsQ").value = P.get("q") || "";
  $("#newsTabs").innerHTML = C.newsCats.map(c =>
    `<button role="tab" data-cat="${c.id}" aria-selected="${c.id===cat}" aria-controls="newsPanel">${c.name}</button>`).join("");

  $("#newsTabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-cat]"); if (!b) return;
    cat = b.dataset.cat; page = 1;
    $$("#newsTabs button").forEach(x => x.setAttribute("aria-selected", x === b));
    render();
  });
  $("#newsTabs").addEventListener("keydown", e => {
    if (!["ArrowRight","ArrowLeft"].includes(e.key)) return;
    const bs = $$("#newsTabs button"), i = bs.indexOf(document.activeElement); if (i < 0) return;
    const n = bs[(i + (e.key==="ArrowRight"?1:-1) + bs.length) % bs.length];
    n.focus(); n.click(); e.preventDefault();
  });

  let d; $("#newsQ").addEventListener("input", e => {
    clearTimeout(d); d = setTimeout(() => { query = e.target.value.trim().toLowerCase(); page = 1; render(); }, 220);
  });

  const sorted = [...C.news].sort((a,b) => b.date.localeCompare(a.date));
  const filtered = () => sorted
    .filter(n => cat === "all" || n.cat === cat)
    .filter(n => !query || (n.title + n.ex).toLowerCase().includes(query));

  function syncURL() {
    const q = new URLSearchParams();
    if (cat !== "all") q.set("cat", cat);
    if (query) q.set("q", query);
    if (page > 1) q.set("page", page);
    history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
  }

  function render() {
    const list = filtered(), total = Math.max(1, Math.ceil(list.length / PS));
    page = Math.min(Math.max(1, page), total);
    empty.hidden = list.length > 0;

    grid.innerHTML = list.slice((page-1)*PS, page*PS).map(n => {
      const name = C.newsCats.find(c => c.id === n.cat)?.name || "";
      return `<li class="card" data-reveal>
        <div class="card__media"><img src="../${n.img}" alt="${escHtml(n.title)}" loading="lazy" width="600" height="375">
          <span class="card__tag">${name}</span></div>
        <div class="card__body">
          <p class="card__date"><time datetime="${n.date}">${fmtDate(n.date)}</time></p>
          <h3 class="card__title"><a href="news-detail.html?id=${n.id}">${escHtml(n.title)}</a></h3>
          <p class="card__ex">${escHtml(n.ex)}</p>
          <a class="card__more" href="news-detail.html?id=${n.id}">อ่านรายละเอียด →</a>
        </div></li>`;
    }).join("");

    pager.innerHTML = list.length <= PS ? "" :
      `<button ${page===1?"disabled":""} data-go="${page-1}" aria-label="หน้าก่อนหน้า">‹</button>` +
      Array.from({length: total}, (_,i) => `<button data-go="${i+1}" ${page===i+1?'aria-current="page"':""} aria-label="หน้าที่ ${i+1}">${i+1}</button>`).join("") +
      `<button ${page===total?"disabled":""} data-go="${page+1}" aria-label="หน้าถัดไป">›</button>`;

    syncURL(); observeReveal();
  }
  pager.addEventListener("click", e => {
    const b = e.target.closest("button[data-go]"); if (!b || b.disabled) return;
    page = +b.dataset.go; render();
    scrollTo({ top: document.querySelector("#main").offsetTop - 90, behavior:"smooth" });
  });

  /* Sidebar */
  document.querySelector("#sideLatest").innerHTML = sorted.slice(0,5).map(n =>
    `<li><a href="news-detail.html?id=${n.id}">${escHtml(n.title)}</a><time datetime="${n.date}">${fmtDate(n.date)}</time></li>`).join("");
  document.querySelector("#sideCats").innerHTML = C.newsCats.filter(c => c.id !== "all").map(c =>
    `<li><a href="?cat=${c.id}">${c.name}</a> <span style="color:var(--muted)">(${C.news.filter(n=>n.cat===c.id).length})</span></li>`).join("");

  render();
})();


