/* api.js — ชั้นกลางระหว่าง UI กับแหล่งข้อมูล
   เปลี่ยน MODE เป็น "rest" เมื่อ CMS พร้อม โดยไม่ต้องแก้โค้ดหน้าเว็บแม้แต่บรรทัดเดียว */
window.API = (function () {
  "use strict";
  const MODE = "mock";                              // "mock" | "rest"
  const BASE = "https://api.uttaradit.go.th/v1";    // endpoint จริงเมื่อขึ้นระบบ
  const TTL  = 5 * 60 * 1000;                       // cache 5 นาที
  const cache = new Map();

  const delay = ms => new Promise(r => setTimeout(r, ms));

  async function http(path, params) {
    const url = new URL(BASE + path);
    Object.entries(params || {}).forEach(([k, v]) => v != null && v !== "" && url.searchParams.set(k, v));
    const key = url.toString(), hit = cache.get(key);
    if (hit && Date.now() - hit.t < TTL) return hit.v;

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      cache.set(key, { t: Date.now(), v: json });
      return json;
    } finally { clearTimeout(to); }
  }

  /* ---------- Mock adapter ---------- */
  const mock = {
    async news({ cat = "all", q = "", page = 1, size = 6, sort = "new" } = {}) {
      await delay(120);
      const kw = q.trim().toLowerCase();
      let rows = CONFIG.news
        .filter(n => cat === "all" || n.cat === cat)
        .filter(n => !kw || (n.title + n.ex).toLowerCase().includes(kw))
        .sort((a, b) => sort === "old" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
      const total = rows.length;
      return { items: rows.slice((page - 1) * size, page * size), total, page, size, pages: Math.max(1, Math.ceil(total / size)) };
    },
    async newsOne(id) {
      await delay(80);
      const n = CONFIG.news.find(x => x.id === +id);
      if (!n) { const e = new Error("NOT_FOUND"); e.code = 404; throw e; }
      return { ...n, ...(DATA.newsBody[n.id] || {}) };
    },
    async travel({ tag = "" } = {}) { await delay(80); return { items: CONFIG.travel.filter(t => !tag || t.tag === tag) }; },
    async travelOne(id) {
      await delay(80);
      const t = CONFIG.travel.find(x => x.id === +id);
      if (!t) { const e = new Error("NOT_FOUND"); e.code = 404; throw e; }
      return { ...t, ...(DATA.travelBody[t.id] || {}) };
    },
    async products({ type = "" } = {}) { await delay(80); return { items: CONFIG.products.filter(p => !type || p.type === type) }; },
    async productOne(id) {
      await delay(80);
      const p = CONFIG.products.find(x => x.id === +id);
      if (!p) { const e = new Error("NOT_FOUND"); e.code = 404; throw e; }
      return { ...p, ...(DATA.productBody[p.id] || {}) };
    },
    async services()  { await delay(60); return { items: CONFIG.services }; },
    async agencies()  { await delay(60); return { items: CONFIG.agencies }; },
    async ita()       { await delay(90); return { groups: DATA.itaGroups, scores: DATA.itaScores }; },
    async submitContact(payload) {
      await delay(700);
      if (!payload.email?.includes("@")) { const e = new Error("INVALID_EMAIL"); e.code = 422; throw e; }
      return { ok: true, ref: "UTT" + Date.now().toString(36).toUpperCase() };
    }
  };

  /* ---------- REST adapter ---------- */
  const rest = {
    news:   p => http("/news", p),
    newsOne: id => http(`/news/${id}`),
    travel: p => http("/travel", p),
    travelOne: id => http(`/travel/${id}`),
    products: p => http("/products", p),
    productOne: id => http(`/products/${id}`),
    services: () => http("/services"),
    agencies: () => http("/agencies"),
    ita:    () => http("/ita"),
    submitContact: body => fetch(BASE + "/contact", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(r => r.ok ? r.json() : Promise.reject(new Error("SUBMIT_FAILED")))
  };

  const impl = MODE === "rest" ? rest : mock;

  /* ---------- ตัวช่วย UI: skeleton / error ---------- */
  const ui = {
    skeleton(el, n = 6) {
      el.innerHTML = Array.from({ length: n }, () => `
        <li class="card sk" aria-hidden="true">
          <div class="card__media sk__box"></div>
          <div class="card__body"><span class="sk__line" style="width:35%"></span>
          <span class="sk__line" style="width:92%"></span><span class="sk__line" style="width:70%"></span></div>
        </li>`).join("");
    },
    error(el, msg = "ไม่สามารถโหลดข้อมูลได้ในขณะนี้", onRetry) {
      el.innerHTML = `<li class="state state--err" role="alert"><p>⚠️ ${msg}</p>
        <button class="btn btn--brand btn--sm" type="button" id="btnRetry">ลองอีกครั้ง</button></li>`;
      el.querySelector("#btnRetry")?.addEventListener("click", onRetry);
    }
  };

  return { mode: MODE, ...impl, ui };
})();


