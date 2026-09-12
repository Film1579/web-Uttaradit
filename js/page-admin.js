/* page-admin.js — หน้าจัดการข้อมูลเว็บไซต์ (pages/admin.html)
   ทำงานฝั่ง Frontend ล้วน ๆ: เก็บข้อมูลไว้ใน localStorage ของเบราว์เซอร์ ยังไม่มีการเชื่อมต่อ Backend/ฐานข้อมูลจริง
   โครงสร้างข้อมูลอ้างอิงจาก window.CONFIG (news / travel / products) ในไฟล์ config.js เพื่อให้ตรงกับข้อมูลจริงของเว็บไซต์ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = window.escHtml || (s => String(s));
  const C = window.CONFIG || {};

  const STORE_KEY = { news: "utt_admin_news", travel: "utt_admin_travel", products: "utt_admin_products" };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function loadList(type) {
    try {
      const raw = localStorage.getItem(STORE_KEY[type]);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* localStorage อาจถูกปิด เช่น โหมดส่วนตัว */ }
    return clone(C[type] || []);
  }
  function saveList(type, list) {
    state[type] = list;
    try { localStorage.setItem(STORE_KEY[type], JSON.stringify(list)); } catch (e) { /* เพิกเฉยถ้าบันทึกไม่ได้ */ }
  }
  function nextId(list) {
    return list.reduce((m, i) => Math.max(m, +i.id || 0), 0) + 1;
  }

  const state = { news: loadList("news"), travel: loadList("travel"), products: loadList("products") };

  /* ---------- ตัวช่วยแสดงผล ---------- */
  const catName = id => (C.newsCats || []).find(c => c.id === id)?.name || id || "-";
  const typeName = t => t === "gi" ? "สินค้า GI" : t === "otop" ? "สินค้า OTOP" : t || "-";

  function renderCount(type) {
    const el = $("#adminCount-" + type);
    if (el) el.textContent = state[type].length;
  }

  function renderNews() {
    const rows = state.news.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    renderCount("news");
    $("#adminBody-news").innerHTML = rows.length ? rows.map(n => `
      <tr>
        <td data-l="วันที่">${esc(n.date || "-")}</td>
        <td data-l="หมวด">${esc(catName(n.cat))}</td>
        <td data-l="หัวข้อข่าว"><b>${esc(n.title || "")}</b><br><small class="muted">${esc(n.ex || "")}</small></td>
        <td data-l="การจัดการ">
          <div class="admin-row-actions">
            <button type="button" class="btn btn--sm btn--brand" data-edit="news" data-id="${n.id}">แก้ไข</button>
            <button type="button" class="btn btn--sm btn--ghost" data-del="news" data-id="${n.id}">ลบ</button>
          </div>
        </td>
      </tr>`).join("") : `<tr><td colspan="4" class="empty">ยังไม่มีข่าวสาร — กด “เพิ่มข่าวใหม่” เพื่อเริ่มต้น</td></tr>`;
  }

  function renderTravel() {
    const rows = state.travel;
    renderCount("travel");
    $("#adminBody-travel").innerHTML = rows.length ? rows.map(t => `
      <tr>
        <td data-l="ชื่อสถานที่"><b>${esc(t.t || "")}</b><br><small class="muted">${esc(t.s || "")}</small></td>
        <td data-l="หมวด">${esc(t.tag || "-")}</td>
        <td data-l="การจัดการ">
          <div class="admin-row-actions">
            <button type="button" class="btn btn--sm btn--brand" data-edit="travel" data-id="${t.id}">แก้ไข</button>
            <button type="button" class="btn btn--sm btn--ghost" data-del="travel" data-id="${t.id}">ลบ</button>
          </div>
        </td>
      </tr>`).join("") : `<tr><td colspan="3" class="empty">ยังไม่มีข้อมูลท่องเที่ยว — กด “เพิ่มสถานที่ใหม่” เพื่อเริ่มต้น</td></tr>`;
  }

  function renderProducts() {
    const rows = state.products;
    renderCount("products");
    $("#adminBody-products").innerHTML = rows.length ? rows.map(p => `
      <tr>
        <td data-l="ไอคอน" style="font-size:1.3rem">${esc(p.ic || "🏷️")}</td>
        <td data-l="ชื่อสินค้า"><b>${esc(p.t || "")}</b><br><small class="muted">${esc(p.s || "")}</small></td>
        <td data-l="ประเภท">${esc(p.tag || typeName(p.type))}</td>
        <td data-l="การจัดการ">
          <div class="admin-row-actions">
            <button type="button" class="btn btn--sm btn--brand" data-edit="products" data-id="${p.id}">แก้ไข</button>
            <button type="button" class="btn btn--sm btn--ghost" data-del="products" data-id="${p.id}">ลบ</button>
          </div>
        </td>
      </tr>`).join("") : `<tr><td colspan="4" class="empty">ยังไม่มีของดีจังหวัด — กด “เพิ่มของดีใหม่” เพื่อเริ่มต้น</td></tr>`;
  }

  const RENDER = { news: renderNews, travel: renderTravel, products: renderProducts };
  function renderAll() { Object.keys(RENDER).forEach(t => RENDER[t]()); }

  /* ---------- Tabs ---------- */
  const tabs = $$("#adminTabs [data-tab]");
  function selectTab(name) {
    tabs.forEach(b => {
      const on = b.dataset.tab === name;
      b.setAttribute("aria-selected", on);
    });
    $$(".admin__panel").forEach(p => {
      const on = p.id === "panel-" + name;
      p.hidden = !on;
      p.classList.toggle("is-active", on);
    });
  }
  tabs.forEach(b => b.addEventListener("click", () => selectTab(b.dataset.tab)));

  /* ---------- ฟอร์ม: เติม select หมวดข่าวจาก config ---------- */
  const catSelect = $("#news-cat");
  if (catSelect) {
    catSelect.innerHTML = (C.newsCats || []).filter(c => c.id !== "all")
      .map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  }

  /* ---------- เปิด/ปิดฟอร์ม ---------- */
  function formEl(type) { return $("#form-" + type); }
  function openForm(type, id) {
    const form = formEl(type);
    if (!form) return;
    form.reset();
    $("#err-" + type).hidden = true;
    const item = id ? state[type].find(i => String(i.id) === String(id)) : null;
    form.elements.id.value = item ? item.id : "";
    if (item) {
      Object.keys(item).forEach(k => { if (form.elements[k]) form.elements[k].value = item[k]; });
    } else if (type === "products") {
      form.elements.type.value = "gi";
    }
    $("#formTitle-" + type).textContent = item
      ? (type === "news" ? "แก้ไขข่าว" : type === "travel" ? "แก้ไขสถานที่ท่องเที่ยว" : "แก้ไขของดีจังหวัด")
      : (type === "news" ? "เพิ่มข่าวใหม่" : type === "travel" ? "เพิ่มสถานที่ท่องเที่ยวใหม่" : "เพิ่มของดีจังหวัดใหม่");
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.querySelector("input[name], select[name], textarea[name]")?.focus();
  }
  function closeForm(type) { const f = formEl(type); if (f) f.hidden = true; }

  document.addEventListener("click", e => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) { openForm(addBtn.dataset.add, null); return; }
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) { openForm(editBtn.dataset.edit, editBtn.dataset.id); return; }
    const cancelBtn = e.target.closest("[data-cancel-form]");
    if (cancelBtn) { closeForm(cancelBtn.dataset.cancelForm); return; }
    const delBtn = e.target.closest("[data-del]");
    if (delBtn) {
      const type = delBtn.dataset.del, id = delBtn.dataset.id;
      const item = state[type].find(i => String(i.id) === String(id));
      const label = item ? (item.title || item.t || ("รายการ #" + id)) : ("รายการ #" + id);
      if (confirm(`ยืนยันการลบ “${label}” ใช่หรือไม่? การลบนี้ลบออกจากเบราว์เซอร์นี้เท่านั้น`)) {
        saveList(type, state[type].filter(i => String(i.id) !== String(id)));
        RENDER[type]();
        window.showToast?.("ลบรายการเรียบร้อยแล้ว");
      }
      return;
    }
    const resetBtn = e.target.closest("[data-reset]");
    if (resetBtn) {
      const type = resetBtn.dataset.reset;
      const labelMap = { news: "ข่าวสารประจำจังหวัด", travel: "ข้อมูลท่องเที่ยว", products: "ของดีจังหวัด" };
      if (confirm(`คืนค่า “${labelMap[type]}” กลับไปเป็นชุดข้อมูลเริ่มต้นของเว็บไซต์ (ล้างการแก้ไขทั้งหมดในเบราว์เซอร์นี้)?`)) {
        try { localStorage.removeItem(STORE_KEY[type]); } catch (err) { /* เพิกเฉย */ }
        state[type] = clone(C[type] || []);
        closeForm(type);
        RENDER[type]();
        window.showToast?.("คืนค่าเริ่มต้นเรียบร้อยแล้ว");
      }
    }
  });

  /* ---------- บันทึกฟอร์ม ---------- */
  function readForm(type, form) {
    const data = {};
    [...form.elements].forEach(el => { if (el.name) data[el.name] = el.value.trim(); });
    return data;
  }
  function requiredOk(type, data) {
    const req = {
      news: ["date", "cat", "title", "ex"],
      travel: ["t", "s", "tag"],
      products: ["t", "type", "s"]
    }[type];
    return req.every(k => data[k]);
  }

  $$(".admin__form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const type = form.dataset.type;
      const data = readForm(type, form);
      const errEl = $("#err-" + type);
      if (!requiredOk(type, data)) {
        errEl.textContent = "กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน";
        errEl.hidden = false;
        return;
      }
      errEl.hidden = true;
      const list = state[type];
      if (data.id) {
        const idx = list.findIndex(i => String(i.id) === String(data.id));
        if (idx > -1) list[idx] = { ...list[idx], ...data, id: list[idx].id };
      } else {
        data.id = nextId(list);
        list.push(data);
      }
      saveList(type, list);
      RENDER[type]();
      closeForm(type);
      window.showToast?.("บันทึกข้อมูลเรียบร้อยแล้ว");
    });
  });

  renderAll();
})();
