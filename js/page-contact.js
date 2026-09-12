/* page-contact.js — ตรวจสอบฟอร์มระดับฟิลด์ + ส่งผ่าน API layer + สถานะปุ่ม */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const form = $("#ctForm"), btn = $("#ctBtn"), errBox = $("#ctErr"), okBox = $("#ctOk");

  const RULES = {
    cName: v => v.trim().length >= 2 || "กรุณากรอกชื่อ-นามสกุล อย่างน้อย 2 ตัวอักษร",
    cMail: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com",
    cTopic: v => !!v || "กรุณาเลือกประเภทเรื่อง",
    cMsg: v => (v.trim().length >= 10 && v.length <= 1000) || "กรุณากรอกรายละเอียด 10–1,000 ตัวอักษร"
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
    if (!pdpa) { errBox.textContent = "กรุณายอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคลก่อนส่งข้อความ"; errBox.hidden = false; $("#cPdpa").focus(); return; }
    if (!okAll) { errBox.textContent = "กรุณาตรวจสอบข้อมูลที่กรอกให้ถูกต้องครบถ้วน"; errBox.hidden = false; form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    btn.disabled = true; btn.textContent = "กำลังส่ง…";
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await API.submitContact(payload);
      okBox.textContent = `ส่งข้อความเรียบร้อยแล้ว หมายเลขอ้างอิง: ${res.ref} — เจ้าหน้าที่จะติดต่อกลับภายใน 3 วันทำการ`;
      okBox.hidden = false;
      form.reset();
      okBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      errBox.textContent = err.code === 422
        ? "ข้อมูลอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"
        : "ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่ หรือโทร 0 5541 1977";
      errBox.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = "ส่งข้อความ";
    }
  });
})();


