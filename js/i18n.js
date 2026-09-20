/* i18n.js — ระบบสองภาษา (ไทย ↔ English) แบบรวมศูนย์ ใช้ร่วมกันทุกหน้า
   ------------------------------------------------------------------------------------------
   โหลดหลัง js/i18n-dict.js (พจนานุกรม) และก่อนสคริปต์อื่นทั้งหมด (อยู่ใน <head> ของทุกหน้า)

   ภาษาเริ่มต้น = ไทย  |  เก็บภาษาที่เลือกไว้ใน localStorage คีย์ "utt_language" ("th" | "en")
   ไม่เปลี่ยน URL ใด ๆ — ทุกหน้าอ่านภาษาจาก localStorage ตัวเดียวกัน

   วิธีใช้ในโค้ด:
     UTT_I18N.getLanguage()            → "th" | "en"
     UTT_I18N.setLanguage("en")        → เปลี่ยนภาษา บันทึก อัปเดต DOM/attribute/<html lang> แล้วแจ้งผู้ฟัง
     UTT_I18N.t("common.readMore", {n:1}) → ข้อความตามภาษาปัจจุบัน (แทน {n} ด้วยพารามิเตอร์)
     UTT_I18N.pick(item, "title")      → item.title_en ถ้าเป็น English และมีค่า ไม่งั้นใช้ item.title (ภาษาไทยเดิม)
     UTT_I18N.apply(root?)             → อัปเดต [data-i18n] / [data-i18n-attr] / [data-i18n-split] ภายใต้ root
     UTT_I18N.onChange(fn)             → fn(lang) ถูกเรียกทุกครั้งที่เปลี่ยนภาษา (ไว้วาดข้อมูล dynamic ใหม่)

   HTML แบบ static:
     data-i18n="key"                   → แทน innerHTML (ต้นฉบับภาษาไทยในไฟล์ HTML ถูกเก็บไว้เพื่อสลับกลับ)
     data-i18n-attr="aria-label:key;placeholder:key2"  → แทน attribute
     data-i18n-split="key"             → แบ่งข้อความตาม "|" ใส่ทีละ <span> (ใช้กับชื่อบน Preloader)
     data-i18n-lock                    → สคริปต์หน้านั้นกำหนดค่าเอง (เช่น title/breadcrumb ของหน้ารายละเอียด) ห้ามทับ */
(function () {
  "use strict";
  var D = window.UTT_I18N_DICT || { th: {}, en: {}, tagMap: {}, serverRules: [] };
  var KEY = "utt_language", LANGS = ["th", "en"], DEFAULT = "th";
  var doc = document, root = doc.documentElement;
  var lang = DEFAULT;
  try { var saved = localStorage.getItem(KEY); if (LANGS.indexOf(saved) > -1) lang = saved; } catch (e) { /* private mode */ }

  function reflectHtml() { root.setAttribute("lang", lang); root.setAttribute("data-lang", lang); }
  reflectHtml();

  var listeners = [], warned = {};
  var origStore = typeof WeakMap === "function" ? new WeakMap() : null;

  /* ---------- แปลข้อความ ---------- */
  function fill(str, params) {
    return params ? String(str).replace(/\{(\w+)\}/g, function (m, k) { return params[k] != null ? params[k] : m; }) : str;
  }
  function t(key, params) {
    var v = (D[lang] || {})[key];
    if (v == null) {
      if (!warned[key]) { warned[key] = 1; if (window.console) console.warn("[i18n] missing " + lang + " key:", key); }
      v = D.th[key] != null ? D.th[key] : (D.en[key] != null ? D.en[key] : key);
    }
    return fill(v, params);
  }
  function has(key) { return (D[lang] || {})[key] != null; }

  /* เลือกฟิลด์ตามภาษา: English → <field>_en (ถ้ามีค่า) ไม่งั้นถอยกลับเป็นฟิลด์ไทยเดิม */
  function pick(obj, field) {
    if (!obj) return "";
    if (lang === "en") {
      var v = obj[field + "_en"];
      if (v != null && v !== "" && !(Array.isArray(v) && !v.length)) return v;
    }
    return obj[field];
  }
  /* มีฉบับ English ของฟิลด์นี้จริงหรือไม่ (ใช้แจ้ง "มีเฉพาะภาษาไทย" เมื่อ Admin ยังไม่ได้กรอกฉบับ English) */
  function hasEn(obj, field) {
    var v = obj && obj[field + "_en"];
    return v != null && v !== "" && !(Array.isArray(v) && !v.length);
  }
  function tag(thTag, item) {
    if (lang !== "en") return thTag;
    if (item && hasEn(item, "tag")) return item.tag_en;
    return D.tagMap[thTag] || thTag;
  }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    } catch (e) { return iso; }
  }
  function fiscalYear(y) { var n = +y; return lang === "en" && n ? { y: n, ce: n - 543 } : { y: y, ce: n - 543 }; }
  /* ข้อความ error ภาษาไทยจาก Secure API → English (เมื่ออยู่โหมด English) */
  function serverMsg(msg) {
    if (lang !== "en" || !msg) return msg;
    var rules = D.serverRules || [];
    for (var i = 0; i < rules.length; i++) {
      var re = new RegExp(rules[i][0]);
      if (re.test(msg)) return msg.replace(re, rules[i][1]);
    }
    return msg;
  }

  /* ---------- อัปเดต DOM ---------- */
  function store(el) {
    var s = origStore && origStore.get(el);
    if (!s) { s = { attrs: {} }; if (origStore) origStore.set(el, s); }
    return s;
  }
  function apply(scope) {
    scope = scope || doc;
    var i, el, s, key, v;
    var nodes = scope.querySelectorAll("[data-i18n]");
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      if (el.hasAttribute("data-i18n-lock")) continue;
      s = store(el);
      if (s.html === undefined) s.html = el.innerHTML;       // ต้นฉบับภาษาไทยจาก HTML
      key = el.getAttribute("data-i18n");
      v = lang === "en" ? D.en[key] : s.html;
      if (v == null) { if (!warned[key]) { warned[key] = 1; if (window.console) console.warn("[i18n] missing en key:", key); } v = s.html; }
      if (el.innerHTML !== v) el.innerHTML = v;
    }
    nodes = scope.querySelectorAll("[data-i18n-attr]");
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      if (el.hasAttribute("data-i18n-lock")) continue;
      s = store(el);
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.indexOf(":"); if (p < 1) return;
        var attr = pair.slice(0, p).trim(), k = pair.slice(p + 1).trim();
        if (s.attrs[attr] === undefined) s.attrs[attr] = el.getAttribute(attr);
        var val = lang === "en" ? D.en[k] : s.attrs[attr];
        if (val == null) { if (!warned[k]) { warned[k] = 1; if (window.console) console.warn("[i18n] missing en key:", k); } val = s.attrs[attr]; }
        if (val != null && el.getAttribute(attr) !== val) el.setAttribute(attr, val);
      });
    }
    nodes = scope.querySelectorAll("[data-i18n-split]");
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i]; s = store(el);
      var kids = el.children;
      if (!s.split) { s.split = []; for (var j = 0; j < kids.length; j++) s.split.push(kids[j].textContent); }
      var parts = t(el.getAttribute("data-i18n-split")).split("|");
      for (var m = 0; m < kids.length; m++) kids[m].textContent = lang === "en" ? (parts[m] || "") : s.split[m];
    }
  }

  /* Title / meta ที่หน้าไดนามิกกำหนดเอง — ล็อกไว้ไม่ให้ apply() ทับ */
  function setTitle(text) {
    doc.title = text;
    var el = doc.querySelector("title"); if (el) el.setAttribute("data-i18n-lock", "");
  }
  function setMeta(selector, text) {
    var el = doc.querySelector(selector); if (!el) return;
    el.content = text; el.setAttribute("data-i18n-lock", "");
  }
  function setText(el, text) { if (!el) return; el.textContent = text; el.setAttribute("data-i18n-lock", ""); }

  /* ---------- ปุ่มสลับภาษา (สร้างจากที่เดียว ใช้เหมือนกันทุกหน้า) ---------- */
  var switcher = null, statusEl = null;
  function mountSwitcher() {
    if (switcher || !doc.body) return;
    var bar = doc.querySelector(".topbar__in");
    if (!bar) return;
    switcher = doc.createElement("div");
    switcher.className = "lang";
    switcher.setAttribute("role", "group");
    switcher.innerHTML =
      '<button type="button" class="lang__btn" data-lang="th">TH</button>' +
      '<button type="button" class="lang__btn" data-lang="en">EN</button>';
    statusEl = doc.createElement("span");
    statusEl.className = "sr-only"; statusEl.id = "langStatus";
    statusEl.setAttribute("role", "status"); statusEl.setAttribute("aria-live", "polite");
    var tools = doc.createElement("div");
    tools.className = "topbar__tools";
    var a11y = bar.querySelector(".a11y");
    bar.insertBefore(tools, a11y || null);
    tools.appendChild(switcher);
    if (a11y) tools.appendChild(a11y);
    tools.appendChild(statusEl);
    switcher.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-lang]") : null;
      if (b) setLanguage(b.getAttribute("data-lang"), true);
    });
    refreshSwitcher();
  }
  function refreshSwitcher() {
    if (!switcher) return;
    switcher.setAttribute("aria-label", t("lang.group"));
    var btns = switcher.querySelectorAll("[data-lang]");
    for (var i = 0; i < btns.length; i++) {
      var l = btns[i].getAttribute("data-lang"), on = l === lang;
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      btns[i].setAttribute("aria-label", t(l === "th" ? "lang.switchTh" : "lang.switchEn"));
      btns[i].title = btns[i].getAttribute("aria-label");
      btns[i].classList.toggle("is-active", on);
    }
  }

  /* ---------- เปลี่ยนภาษา ---------- */
  function notify() {
    listeners.slice().forEach(function (fn) { try { fn(lang); } catch (e) { if (window.console) console.error("[i18n] listener error", e); } });
    try { doc.dispatchEvent(new CustomEvent("utt:lang-change", { detail: { lang: lang } })); } catch (e) { /* IE */ }
  }
  function setLanguage(next, announce) {
    if (LANGS.indexOf(next) < 0 || next === lang) { refreshSwitcher(); return lang; }
    lang = next;
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode: ใช้ได้เฉพาะหน้านี้ */ }
    reflectHtml();
    apply(doc);
    refreshSwitcher();
    notify();
    if (announce && statusEl) statusEl.textContent = t("lang.changed");
    return lang;
  }
  function onChange(fn) { if (typeof fn === "function") listeners.push(fn); }

  /* แท็บอื่นเปลี่ยนภาษา → ตามให้ทันที */
  addEventListener("storage", function (e) {
    if (e.key === KEY && LANGS.indexOf(e.newValue) > -1 && e.newValue !== lang) setLanguage(e.newValue);
  });

  function init() { mountSwitcher(); apply(doc); refreshSwitcher(); }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else init();

  window.UTT_I18N = {
    getLanguage: function () { return lang; }, setLanguage: setLanguage, t: t, has: has,
    pick: pick, hasEn: hasEn, tag: tag, fmtDate: fmtDate, fiscalYear: fiscalYear, serverMsg: serverMsg,
    apply: apply, onChange: onChange, setTitle: setTitle, setMeta: setMeta, setText: setText,
    mountSwitcher: mountSwitcher, LANGS: LANGS, KEY: KEY
  };
})();
