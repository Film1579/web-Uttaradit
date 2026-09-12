/* ui.js — Toast แจ้งสถานะ + Modal รายละเอียด (ใช้ร่วมทุกหน้า)
   แทนที่ href="#" ที่กดแล้วไม่มีการทำงาน ด้วยการแจ้งสถานะจริง หรือหน้าต่างรายละเอียด */
(function () {
  "use strict";
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function ensureToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
    return toastEl;
  }
  window.showToast = function (msg) {
    const el = ensureToast();
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 3400);
  };

  /* ---------- Modal ---------- */
  let overlay, lastFocus;
  function ensureModal() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<button type="button" class="modal__close" aria-label="ปิดหน้าต่าง">&times;</button>' +
      '<div id="modalBody"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
    overlay.querySelector(".modal__close").addEventListener("click", closeModal);
    return overlay;
  }
  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("is-on");
    document.body.style.overflow = "";
    lastFocus?.focus();
  }
  document.addEventListener("keydown", e => {
    if (!overlay?.classList.contains("is-on")) return;
    if (e.key === "Escape") { closeModal(); return; }
    if (e.key !== "Tab") return;
    const items = [...overlay.querySelectorAll('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])')];
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  window.openModal = function (html) {
    ensureModal();
    lastFocus = document.activeElement;
    overlay.querySelector("#modalBody").innerHTML = html;
    overlay.classList.add("is-on");
    document.body.style.overflow = "hidden";
    overlay.querySelector(".modal__close").focus();
  };
  window.closeModal = closeModal;

  /* ---------- Delegated click handling ---------- */
  document.addEventListener("click", function (e) {
    /* เอกสาร/ลิงก์ที่ยังไม่มีไฟล์จริง (u:"#" ใน data.js/config.js) */
    const pending = e.target.closest("[data-doc-pending]");
    if (pending) {
      e.preventDefault();
      window.showToast("เอกสารนี้อยู่ระหว่างเตรียมเผยแพร่ กรุณาติดต่อสำนักงานจังหวัดอุตรดิตถ์ โทร. 0 5541 1977");
      return;
    }
    /* การ์ดที่เปิดหน้าต่างรายละเอียด (ท่องเที่ยว/OTOP) */
    const detail = e.target.closest("[data-detail]");
    if (detail) {
      e.preventDefault();
      let info;
      try { info = JSON.parse(detail.getAttribute("data-detail")); } catch (err) { return; }
      window.openModal(
        (info.img ? `<div style="border-radius:12px;overflow:hidden;margin-bottom:16px;aspect-ratio:16/10;background:linear-gradient(150deg,var(--brand-500),var(--brand-700))"><img src="${esc(info.img)}" alt="" style="width:100%;height:100%;object-fit:cover" width="480" height="300"></div>` : "") +
        (info.tag ? `<span class="badge" style="display:inline-block;background:var(--brand-700);color:#fff;padding:4px 14px;border-radius:999px;font-size:.78rem;margin-bottom:10px">${esc(info.tag)}</span>` : "") +
        `<h3 id="modalTitle" style="margin:6px 0 10px;font-family:var(--ff-head)">${esc(info.t)}</h3>` +
        `<p style="margin:0;color:var(--muted);line-height:1.8">${esc(info.s)}</p>`
      );
    }
  });
})();


