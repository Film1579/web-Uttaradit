/* page-contact.js — ตรวจสอบฟอร์มระดับฟิลด์ + ส่งผ่าน API layer + สถานะปุ่ม */
(function () {
  "use strict";
  const I18N = window.UTT_I18N, t = I18N.t;
  const $ = s => document.querySelector(s);
  const form = $("#ctForm"), btn = $("#ctBtn"), errBox = $("#ctErr"), okBox = $("#ctOk");

  const RULES = {
    cName: v => v.trim().length >= 2 || t("contact.errName"),
    cMail: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || t("contact.errMail"),
    cTopic: v => !!v || t("contact.errTopic"),
    cMsg: v => (v.trim().length >= 10 && v.length <= 1000) || t("contact.errMsg")
  };

  function validate(id) {
    const el = $("#" + id), msg = RULES[id](el.value);
    const box = $("#e" + id.slice(1));
    const bad = msg !== true;
    el.setAttribute("aria-invalid", bad);
    if (box) { box.hidden = !bad; box.textContent = bad ? msg : ""; }
    return !bad;
  }
  Object.keys(RULES).forEach(id => {
    const el = $("#" + id);
    el.addEventListener("blur", () => validate(id));
    el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") validate(id); });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    okBox.hidden = true; errBox.hidden = true;

    const okAll = Object.keys(RULES).map(validate).every(Boolean);
    const pdpa = $("#cPdpa").checked;
    if (!pdpa) { errBox.dataset.k = "contact.errPdpa"; errBox.textContent = t("contact.errPdpa"); errBox.hidden = false; $("#cPdpa").focus(); return; }
    if (!okAll) { errBox.dataset.k = "contact.errAll"; errBox.textContent = t("contact.errAll"); errBox.hidden = false; form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    btn.disabled = true; btn.textContent = t("contact.sending");
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await API.submitContact(payload);
      okBox.dataset.ref = res.ref; okBox.textContent = t("contact.sent", { ref: res.ref });
      okBox.hidden = false;
      form.reset();
      okBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      errBox.dataset.k = err.code === 422 ? "contact.err422" : "contact.errSend";
      errBox.textContent = t(errBox.dataset.k);
      errBox.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = t("common.send");
    }
  });

  /* แผนที่ฝัง Google Maps: ส่งภาษาของ UI ไปด้วย (hl=th|en) — ตั้งค่าครั้งแรกให้ตรงภาษา และเปลี่ยนเมื่อสลับ */
  const mapFrame = document.querySelector('iframe[src*="google.com/maps"]');
  const syncMapLang = () => {
    if (!mapFrame) return;
    const next = mapFrame.src.replace(/([?&])hl=[a-z-]+/i, "$1hl=" + I18N.getLanguage());
    if (next !== mapFrame.src) mapFrame.src = next;
  };
  syncMapLang();

  /* สลับภาษา: ข้อความ error/สำเร็จที่กำลังแสดงอยู่ต้องเปลี่ยนภาษาตาม */
  I18N.onChange(() => {
    Object.keys(RULES).forEach(id => { if ($("#" + id).getAttribute("aria-invalid") === "true") validate(id); });
    if (!errBox.hidden && errBox.dataset.k) errBox.textContent = t(errBox.dataset.k);
    if (!okBox.hidden && okBox.dataset.ref) okBox.textContent = t("contact.sent", { ref: okBox.dataset.ref });
    if (!btn.disabled) btn.textContent = t("common.send");
    syncMapLang();
  });
})();
