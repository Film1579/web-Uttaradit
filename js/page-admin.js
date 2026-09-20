/* page-admin.js — หน้าจัดการข้อมูลเว็บไซต์ (pages/admin.html)
   เชื่อมกับแหล่งข้อมูลจริงกลาง (GitHub Repository) ผ่าน Secure API (js/admin-api.js -> api/worker.js)
   ไม่มีการใช้ localStorage เป็นฐานข้อมูลอีกต่อไป — ทุกการเพิ่ม/แก้/ลบต้อง Commit ผ่าน API จริง */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = window.escHtml || (s => String(s));
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;      // ระบบภาษากลาง (js/i18n.js)
  const C = window.CONFIG || {};

  if (!window.AdminAPI) {
    console.error("[page-admin] js/admin-api.js ต้องถูกโหลดก่อนไฟล์นี้เสมอ");
    return;
  }

  /* state[type] = { items: [...], sha, body: {id:{...}}, bodySha } — sha ใช้ตรวจการแก้ไขซ้อนกัน (ข้อ 8, 18) */
  const state = {
    news: { items: [], sha: null, body: {}, bodySha: null },
    travel: { items: [], sha: null, body: {}, bodySha: null },
    products: { items: [], sha: null, body: {}, bodySha: null }
  };
  const BODY_FIELDS = {
    news: { html: "body_html", caption: "body_caption", cover: "body_cover", tags: "body_tags",
            html_en: "body_html_en", caption_en: "body_caption_en", tags_en: "body_tags_en" },
    travel: { html: "body_html", html_en: "body_html_en" },
    products: { html: "body_html", tags: "body_tags", html_en: "body_html_en", tags_en: "body_tags_en" }
  };
  const pendingImage = {}; // type -> { dataUrl, filename } รูปที่เลือกไว้แต่ยังไม่อัปโหลดจริง
  // ค่า placeholder ที่ใส่แทน path รูปชั่วคราวตอนส่งฟอร์ม (Worker เป็นผู้สร้าง path จริงจาก timestamp
  // แล้วแทนที่ placeholder นี้ด้วย path จริง "ในคอมมิตเดียวกัน" กับ list/body — ดู api/worker.js
  // ต้องเป็นค่าเดียวกับ IMAGE_PLACEHOLDER ฝั่ง Worker เป๊ะ ๆ)
  const IMAGE_PLACEHOLDER = "@@PENDING_IMAGE@@";

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function nextId(list) { return list.reduce((m, i) => Math.max(m, +i.id || 0), 0) + 1; }

  /* ---------- ตัวช่วยแสดงผล ---------- */
  const catName = id => pick((C.newsCats || []).find(c => c.id === id), "name") || id || "-";
  const typeName = ty => ty === "gi" ? t("type.gi") : ty === "otop" ? t("type.otop") : ty || "-";
  const loaded = { news: false, travel: false, products: false };

  function renderCount(type) {
    const el = $("#adminCount-" + type);
    if (el) el.textContent = state[type].items.length;
  }

  function renderNews() {
    const rows = state.news.items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    renderCount("news");
    $("#adminBody-news").innerHTML = rows.length ? rows.map(n => `
      <tr>
        <td data-l="${t("admin.col.date")}">${esc(n.date || "-")}</td>
        <td data-l="${t("admin.col.cat")}">${esc(catName(n.cat))}</td>
        <td data-l="${t("admin.col.newsTitle")}"><b>${esc(pick(n, "title") || "")}</b><br><small class="muted">${esc(pick(n, "ex") || "")}</small></td>
        <td data-l="${t("admin.col.actions")}">
          <div class="admin-row-actions">
            <button type="button" class="btn btn--sm btn--brand" data-edit="news" data-id="${n.id}">${t("admin.edit")}</button>
            <button type="button" class="btn btn--sm btn--ghost" data-del="news" data-id="${n.id}">${t("admin.delete")}</button>
          </div>
        </td>
      </tr>`).join("") : `<tr><td colspan="4" class="empty">${t("admin.emptyNews")}</td></tr>`;
  }

  function renderTravel() {
    const rows = state.travel.items;
    renderCount("travel");
    $("#adminBody-travel").innerHTML = rows.length ? rows.map(tv => `
      <tr>
        <td data-l="${t("admin.col.place")}"><b>${esc(pick(tv, "t") || "")}</b><br><small class="muted">${esc(pick(tv, "s") || "")}</small></td>
        <td data-l="${t("admin.col.cat")}">${esc(tv.tag ? I18N.tag(tv.tag, tv) : "-")}</td>
        <td data-l="${t("admin.col.actions")}">
          <div class="admin-row-actions">
            <button type="button" class="btn btn--sm btn--brand" data-edit="travel" data-id="${tv.id}">${t("admin.edit")}</button>
            <button type="button" class="btn btn--sm btn--ghost" data-del="travel" data-id="${tv.id}">${t("admin.delete")}</button>
          </div>
        </td>
      </tr>`).join("") : `<tr><td colspan="3" class="empty">${t("admin.emptyTravel")}</td></tr>`;
  }

  /* thumbnail รูปสินค้าในตาราง — ใช้ field "img" (รองรับ "ic" แบบเก่าที่เป็น path รูปเท่านั้น ไม่ใช่อีโมจิ)
     alt ว่างโดยตั้งใจ: ชื่อสินค้าอยู่ในเซลล์ถัดไปแล้ว จึงไม่ให้ screen reader อ่านซ้ำ */
  function productThumb(p) {
    const U = window.UTT_IMG;
    const path = U ? U.pick(p) : (p.img || "");
    if (!path) return `<span class="admin-thumb admin-thumb--empty">${t("admin.noImage")}</span>`;
    const src = U ? U.resolve(path) : "../" + path;
    return `<img class="admin-thumb" src="${esc(src)}" alt="" width="64" height="48" loading="lazy" decoding="async">`;
  }

  function renderProducts() {
    const rows = state.products.items;
    renderCount("products");
    $("#adminBody-products").innerHTML = rows.length ? rows.map(p => `
      <tr>
        <td data-l="${t("admin.col.image")}">${productThumb(p)}</td>
        <td data-l="${t("admin.col.product")}"><b>${esc(pick(p, "t") || "")}</b><br><small class="muted">${esc(pick(p, "s") || "")}</small></td>
        <td data-l="${t("admin.col.type")}">${esc(p.tag ? I18N.tag(p.tag, p) : typeName(p.type))}</td>
        <td data-l="${t("admin.col.actions")}">
          <div class="admin-row-actions">
            <button type="button" class="btn btn--sm btn--brand" data-edit="products" data-id="${p.id}">${t("admin.edit")}</button>
            <button type="button" class="btn btn--sm btn--ghost" data-del="products" data-id="${p.id}">${t("admin.delete")}</button>
          </div>
        </td>
      </tr>`).join("") : `<tr><td colspan="4" class="empty">${t("admin.emptyProducts")}</td></tr>`;
  }

  const RENDER = { news: renderNews, travel: renderTravel, products: renderProducts };

  function loadingRow(type, msg) {
    const cols = { news: 4, travel: 3, products: 4 }[type];
    $("#adminBody-" + type).innerHTML = `<tr><td colspan="${cols}" class="empty">${esc(msg)}</td></tr>`;
  }

  /* ---------- โหลดข้อมูลจริงจาก Secure API (GitHub) ---------- */
  async function loadType(type) {
    loaded[type] = false;
    loadingRow(type, t("common.loading"));
    try {
      const [list, bodyRes] = await Promise.all([
        window.AdminAPI.getContent(type),
        window.AdminAPI.getBody(type)
      ]);
      state[type] = { items: list.items || [], sha: list.sha, body: bodyRes.body || {}, bodySha: bodyRes.sha };
      loaded[type] = true;
      RENDER[type]();
    } catch (err) {
      loadingRow(type, t("admin.loadFail", { msg: err.message || err }));
      if (err.code === "UNAUTHENTICATED" || err.code === "SESSION_EXPIRED") showLogin();
    }
  }
  async function loadAll() { await Promise.all(["news", "travel", "products"].map(loadType)); }

  /* ---------- Login gate ---------- */
  const loginSection = $("#adminLogin"), appSection = $("#adminApp");
  function showApp() { loginSection.hidden = true; appSection.hidden = false; }
  function showLogin() { loginSection.hidden = false; appSection.hidden = true; }

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const pass = $("#loginPassword").value;
    const btn = $("#loginBtn"), err = $("#loginErr");
    err.hidden = true;
    btn.disabled = true; btn.textContent = t("admin.checking");
    try {
      await window.AdminAPI.login(pass);
      $("#loginPassword").value = "";
      showApp();
      await loadAll();
    } catch (e2) {
      err.textContent = e2.code === "NETWORK_ERROR"
        ? e2.message
        : (e2.message || t("admin.loginFail"));
      err.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = t("admin.loginBtn");
    }
  });
  $("#logoutBtn")?.addEventListener("click", () => { window.AdminAPI.logout(); showLogin(); });

  if (window.AdminAPI.isLoggedIn()) { showApp(); loadAll(); } else { showLogin(); }

  /* ---------- Tabs ---------- */
  const tabs = $$("#adminTabs [data-tab]");
  function selectTab(name) {
    tabs.forEach(b => b.setAttribute("aria-selected", b.dataset.tab === name));
    $$(".admin__panel").forEach(p => {
      const on = p.id === "panel-" + name;
      p.hidden = !on;
      p.classList.toggle("is-active", on);
    });
  }
  tabs.forEach(b => b.addEventListener("click", () => selectTab(b.dataset.tab)));

  /* ---------- ฟอร์ม: เติม select หมวดข่าวจาก config (ค่าคงที่ ไม่ผ่าน Admin) ---------- */
  const catSelect = $("#news-cat");
  function buildCatSelect() {
    if (!catSelect) return;
    const cur = catSelect.value;
    catSelect.innerHTML = (C.newsCats || []).filter(c => c.id !== "all")
      .map(c => `<option value="${esc(c.id)}">${esc(pick(c, "name"))}</option>`).join("");
    if (cur) catSelect.value = cur;
  }
  buildCatSelect();

  /* ---------- เปิด/ปิดฟอร์ม ---------- */
  function formEl(type) { return $("#form-" + type); }
  function updateImgPreview(type) {
    const hidden = $("#" + type + "-img"), box = $("#" + type + "-imgPreview");
    if (!hidden || !box) return;
    const val = hidden.value;
    if (val) {
      const isAbsoluteRef = /^(data:|https?:|\/)/i.test(val);
      box.querySelector("img").src = isAbsoluteRef ? val : "../" + val;
      box.hidden = false;
    } else {
      box.querySelector("img").src = "";
      box.hidden = true;
    }
  }
  const formMode = {};          // type -> "Edit" | "Add" (ไว้เปลี่ยนหัวข้อฟอร์มตามภาษา)
  function setFormTitle(type) {
    const el = $("#formTitle-" + type);
    if (el && formMode[type]) { el.textContent = t("admin.form" + formMode[type] + "." + type); el.setAttribute("data-i18n-lock", ""); }
  }
  function openForm(type, id) {
    const form = formEl(type);
    if (!form) return;
    form.reset();
    // form.reset() ไม่ล้าง <input type="hidden"> ที่ถูกตั้งค่าด้วย JS (ค่า default ถูกเปลี่ยนไปแล้ว) —
    // ต้องล้างเองเสมอ ไม่งั้นเปิด “เพิ่มรายการใหม่” ต่อจากการเลือกรูปจะได้รูป/Base64 ของรายการก่อนหน้าติดมา
    const imgHidden = $("#" + type + "-img");
    if (imgHidden) imgHidden.value = "";
    delete pendingImage[type];
    $("#err-" + type).hidden = true;
    const item = id ? state[type].items.find(i => String(i.id) === String(id)) : null;
    form.elements.id.value = item ? item.id : "";
    if (item) {
      Object.keys(item).forEach(k => { if (form.elements[k]) form.elements[k].value = item[k]; });
    } else if (type === "products") {
      form.elements.type.value = "gi";
    }
    // เติมฟิลด์เนื้อหาเต็ม (body) ของรายการเดิม ถ้ามี
    const bodyItem = (item && state[type].body[String(item.id)]) || null;
    const fieldMap = BODY_FIELDS[type] || {};
    Object.entries(fieldMap).forEach(([key, fieldName]) => {
      const el = form.elements[fieldName];
      if (!el) return;
      const v = bodyItem ? bodyItem[key] : undefined;
      el.value = (key === "tags" || key === "tags_en") ? (Array.isArray(v) ? v.join(", ") : "") : (v || "");
    });
    const fileInput = $("#" + type + "-imgFile");
    if (fileInput) fileInput.value = "";
    updateImgPreview(type);
    formMode[type] = item ? "Edit" : "Add";
    setFormTitle(type);
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.querySelector("input[name], select[name], textarea[name]")?.focus();
  }
  function closeForm(type) { const f = formEl(type); if (f) f.hidden = true; }

  /* ---------- เลือกรูปภาพ (ยังไม่อัปโหลดจริง — จะอัปโหลดตอนกด “บันทึก” เท่านั้น) ----------
     เก็บ Data URL ไว้ชั่วคราวเพื่อพรีวิว ตามข้อ 11 ห้ามเก็บ Base64 ลง JSON โดยไม่จำเป็น
     ตอนบันทึกจริงจะส่งรูปนี้ไปพร้อมกับ list/body ในคำขอเดียว (AdminAPI.saveContent) แล้ว Worker
     จะสร้าง path จริงและแทนที่ placeholder ให้ในคอมมิตเดียวกัน — ไม่มีการอัปโหลดแยกคอมมิตอีกต่อไป */
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // สอดคล้องกับเพดานของ Worker (base64 ≤ 7,000,000 ตัวอักษร ≈ 5.25 MB)
  function rejectFile(type, fileInput, msg) {
    window.showToast?.(msg);
    const errEl = $("#err-" + type);
    if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
    fileInput.value = "";
  }
  ["news", "travel", "products"].forEach(type => {
    const fileInput = $("#" + type + "-imgFile");
    const hidden = $("#" + type + "-img");
    if (!fileInput || !hidden) return;
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const okType = /^image\/(jpeg|jpg|png|webp)$/.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!okType) { rejectFile(type, fileInput, t("admin.imgType")); return; }
      if (file.size > MAX_IMAGE_BYTES) { rejectFile(type, fileInput, t("admin.imgSize")); return; }
      const errEl0 = $("#err-" + type);
      if (errEl0) errEl0.hidden = true;
      const reader = new FileReader();
      reader.onload = () => {
        hidden.value = String(reader.result || "");
        pendingImage[type] = { dataUrl: hidden.value, filename: file.name };
        updateImgPreview(type);
      };
      reader.onerror = () => { window.showToast?.(t("admin.imgRead")); };
      reader.readAsDataURL(file);
    });
  });
  document.addEventListener("click", e => {
    const clearBtn = e.target.closest("[data-clear-img]");
    if (!clearBtn) return;
    const type = clearBtn.dataset.clearImg;
    const hidden = $("#" + type + "-img"), fileInput = $("#" + type + "-imgFile");
    if (hidden) hidden.value = "";
    if (fileInput) fileInput.value = "";
    delete pendingImage[type];
    updateImgPreview(type);
  });

  /* ---------- ปุ่มในตาราง/แถบเครื่องมือ (เพิ่ม/แก้ไข/ยกเลิก/ลบ/โหลดล่าสุด) ---------- */
  document.addEventListener("click", async e => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) { openForm(addBtn.dataset.add, null); return; }
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) { openForm(editBtn.dataset.edit, editBtn.dataset.id); return; }
    const cancelBtn = e.target.closest("[data-cancel-form]");
    if (cancelBtn) { closeForm(cancelBtn.dataset.cancelForm); return; }

    const delBtn = e.target.closest("[data-del]");
    if (delBtn) {
      const type = delBtn.dataset.del, id = delBtn.dataset.id;
      const item = state[type].items.find(i => String(i.id) === String(id));
      const label = item ? (pick(item, "title") || pick(item, "t") || t("admin.itemFallback", { id })) : t("admin.itemFallback", { id });
      if (!confirm(t("admin.confirmDelete", { label }))) return;

      delBtn.disabled = true;
      const original = delBtn.textContent;
      delBtn.textContent = t("admin.deleting");
      try {
        const list = state[type].items.filter(i => String(i.id) !== String(id));
        const res = await window.AdminAPI.saveContent(type, {
          items: list, itemsSha: state[type].sha,
          bodyId: id, deleteBody: true, bodySha: state[type].bodySha,
          message: `content: delete ${type} #${id}`
        });
        const newBody = { ...state[type].body };
        delete newBody[String(id)];
        state[type] = { items: list, sha: res.itemsSha, body: newBody, bodySha: res.bodySha ?? state[type].bodySha };
        RENDER[type]();
        window.showToast?.(t("admin.deleteOk"));
      } catch (err) {
        await handleSaveError(type, err);
      } finally {
        delBtn.disabled = false; delBtn.textContent = original;
      }
      return;
    }

    const resetBtn = e.target.closest("[data-reset]");
    if (resetBtn) {
      const type = resetBtn.dataset.reset;
      if (confirm(t("admin.confirmReset"))) {
        closeForm(type);
        await loadType(type);
        window.showToast?.(t("admin.resetOk"));
      }
    }
  });

  /* แจ้งเมื่อข้อมูลถูกแก้จากที่อื่นระหว่างที่เปิดฟอร์มอยู่ (ข้อ 18) — ไม่เขียนทับเงียบ ๆ */
  async function handleSaveError(type, err) {
    const errEl = $("#err-" + type);
    if (err.code === "CONFLICT") {
      if (errEl) { errEl.textContent = err.message; errEl.hidden = false; }
      window.showToast?.(err.message);
      await loadType(type); // ซิงก์ตารางกับข้อมูลล่าสุดจริงทันที กันข้อมูลค้าง
    } else if (err.code === "UNAUTHENTICATED" || err.code === "SESSION_EXPIRED") {
      window.showToast?.(t("admin.sessionExpired"));
      showLogin();
    } else {
      if (errEl) { errEl.textContent = t("admin.saveFail", { msg: err.message || err }); errEl.hidden = false; }
      window.showToast?.(t("admin.saveFailToast"));
    }
  }

  /* ---------- บันทึกฟอร์ม (ตรวจข้อมูล → อัปโหลดรูปถ้ามี → commit จริง) ---------- */
  function readForm(type, form) {
    const data = {};
    [...form.elements].forEach(el => {
      if (el.name && !el.name.startsWith("body_")) data[el.name] = el.value.trim();
    });
    return data;
  }
  /* ฟิลด์ English ของรายการ (title_en, t_en ฯลฯ) — ถ้าเว้นว่างต้อง "เอาออก" จากรายการ ไม่เก็บสตริงว่าง
     (และต้องลบค่าเดิมที่เคยมีด้วย เพราะการ merge {...เดิม, ...ใหม่} จะไม่ลบคีย์ที่หายไป) */
  function enFieldNames(form) {
    return [...form.elements].map(el => el.name).filter(n => n && n.endsWith("_en") && !n.startsWith("body_"));
  }
  function readBodyPatch(type, form) {
    const fieldMap = BODY_FIELDS[type] || {};
    const patch = {};
    Object.entries(fieldMap).forEach(([key, fieldName]) => {
      const el = form.elements[fieldName];
      if (!el) return;
      const raw = el.value.trim();
      if (!raw) return;
      patch[key] = (key === "tags" || key === "tags_en") ? raw.split(",").map(s => s.trim()).filter(Boolean) : raw;
    });
    return patch; // อาจเป็น {} ถ้าไม่ได้กรอกอะไรเลย — หมายถึง "ไม่มีเนื้อหาเต็ม"
  }
  function requiredOk(type, data) {
    const req = {
      news: ["date", "cat", "title", "ex"],
      travel: ["t", "s", "tag"],
      products: ["t", "type", "s"]
    }[type];
    return req.every(k => data[k]);
  }
  function extraValidationError(type, data) {
    if (type === "news" && data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      return t("admin.badDate");
    }
    if (data.srcUrl && !/^https?:\/\//i.test(data.srcUrl)) return t("admin.badUrl");
    return null;
  }

  $$(".admin__form").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const type = form.dataset.type;
      const data = readForm(type, form);
      const errEl = $("#err-" + type);
      const saveBtn = form.querySelector('button[type="submit"]');

      if (!requiredOk(type, data)) {
        errEl.textContent = t("admin.required");
        errEl.hidden = false;
        return;
      }
      const extraErr = extraValidationError(type, data);
      if (extraErr) { errEl.textContent = extraErr; errEl.hidden = false; return; }
      errEl.hidden = true;

      saveBtn.disabled = true;
      const originalText = saveBtn.textContent;
      try {
        // ---------- ถ้ามีการเลือกไฟล์รูปใหม่: ใส่ placeholder แทน path ไปก่อน ----------
        // รูปจริงจะถูกอัปโหลด "พร้อมกับ" list/body ในคำขอเดียวกันด้านล่าง (คอมมิตเดียวกันจริง ๆ ฝั่ง Worker)
        // ไม่อัปโหลดแยกต่างหากอีกต่อไป เพื่อไม่ให้เกิดรูป orphan ถ้าขั้นบันทึก JSON ถัดไปล้มเหลว
        // กันเหนียว: Data URL ต้องไม่หลุดเข้า JSON เด็ดขาด — ถ้าไม่มีไฟล์ที่รอส่งจริงให้ถือว่าไม่มีรูป
        if (data.img && data.img.startsWith("data:") && !pendingImage[type]) data.img = "";
        let imagePayload = null;
        if (pendingImage[type] && data.img && data.img.startsWith("data:")) {
          imagePayload = { filename: pendingImage[type].filename, dataBase64: pendingImage[type].dataUrl };
          data.img = IMAGE_PLACEHOLDER;
        }

        const list = state[type].items.slice();
        let isNew = false;
        if (data.id) {
          const idx = list.findIndex(i => String(i.id) === String(data.id));
          if (idx > -1) list[idx] = { ...list[idx], ...data, id: list[idx].id };
        } else {
          isNew = true;
          data.id = nextId(list);
          list.push(data);
        }

        // ฟิลด์ English ที่ถูกล้างในฟอร์ม → ลบออกจากรายการ (ไม่เก็บสตริงว่าง)
        const enTarget = list.find(i => String(i.id) === String(data.id));
        enFieldNames(form).forEach(n => { if (enTarget && !data[n]) delete enTarget[n]; });

        if (type === "products") {
          // กด “ลบรูปภาพ” = ไม่มีรูป → เอา key img ออกจากรายการ (ไม่เก็บสตริงว่างไว้ใน data/products.json)
          const target = list.find(i => String(i.id) === String(data.id));
          if (target && !target.img) delete target.img;
        }

        const bodyPatch = readBodyPatch(type, form);

        saveBtn.textContent = imagePayload ? t("admin.savingImg") : t("admin.saving");
        const message = `content: ${isNew ? "add" : "update"} ${type} #${data.id}`;
        const res = await window.AdminAPI.saveContent(type, {
          items: list, itemsSha: state[type].sha,
          bodyId: data.id, bodyReplace: bodyPatch, bodySha: state[type].bodySha,
          image: imagePayload,
          message
        });

        // Worker แทน placeholder ด้วย path จริงแล้ว (res.imagePath) — sync กลับเข้า state ฝั่งนี้ด้วย
        if (imagePayload && res.imagePath) {
          const idx = list.findIndex(i => String(i.id) === String(data.id));
          if (idx > -1) list[idx] = { ...list[idx], img: res.imagePath };
        }

        const newBody = { ...state[type].body };
        if (Object.keys(bodyPatch).length) newBody[String(data.id)] = bodyPatch;
        else delete newBody[String(data.id)];
        state[type] = { items: list, sha: res.itemsSha, body: newBody, bodySha: res.bodySha ?? state[type].bodySha };
        RENDER[type]();
        closeForm(type);
        delete pendingImage[type];
        window.showToast?.(t("admin.saveOk"));
      } catch (err) {
        await handleSaveError(type, err);
      } finally {
        saveBtn.disabled = false; saveBtn.textContent = originalText;
      }
    });
  });

  /* ---------- สลับภาษา: วาดตาราง/ตัวเลือก/หัวข้อฟอร์มใหม่ (ไม่กระทบสถานะล็อกอิน/ฟอร์มที่กรอกค้าง) ---------- */
  I18N.onChange(() => {
    buildCatSelect();
    ["news", "travel", "products"].forEach(type => { if (loaded[type]) RENDER[type](); else renderCount(type); setFormTitle(type); });
  });
})();
