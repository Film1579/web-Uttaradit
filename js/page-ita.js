/* page-ita.js — Render O1–O43 + ค้นหา/กรอง + การ์ดคะแนนย้อนหลัง (สองภาษา: วาดใหม่เมื่อสลับ TH/EN) */
(function () {
  "use strict";
  const I18N = window.UTT_I18N, t = I18N.t, pick = I18N.pick;
  const D = window.DATA, $ = s => document.querySelector(s);
  const ST = { pending:{ c:"wait", k:"ita.status.pending" }, none:{ c:"none", k:"ita.status.none" } };
  const fy = y => { const f = I18N.fiscalYear(y); return I18N.getLanguage() === "en" ? t("ita.fy", { y: f.y, ce: f.ce }) : t("ita.fy", { y: y }); };

  /* การ์ดคะแนน (ไม่ใช่ลิงก์ — เป็นการ์ดสรุปข้อมูลเท่านั้น จึงไม่ใช้ <a href="#">) */
  function renderScores() {
    $("#scoreCards").innerHTML = D.itaScores.map(s => `
    <li><div class="svc-card" role="group" aria-label="${escHtml(t("ita.scoreAria", { y: s.y, ce: +s.y - 543, s: s.s, g: pick(s, "g"), est: s.est ? t("ita.estAria") : "" }))}">
      <span class="ic" aria-hidden="true">🏅</span>
      <b>${fy(s.y)}</b>
      <small><b style="font-size:1.5rem;color:var(--brand-500)">${s.est ? "≈" : ""}${s.s}</b> ${t("ita.pointsLevel", { g: escHtml(pick(s, "g")) })}</small>
      ${s.est ? `<small style="color:var(--muted)">${t("ita.estNote")}</small>` : ""}
    </div></li>`).join("");
  }

  /* ตัวเลือกตัวชี้วัด — สร้างใหม่ตามภาษา คงตัวเลือกที่เลือกไว้ */
  const grpSel = $("#itaGrp");
  function renderGroupOptions() {
    const cur = grpSel.value;
    [...grpSel.querySelectorAll("option[data-grp]")].forEach(o => o.remove());
    grpSel.insertAdjacentHTML("beforeend",
      D.itaGroups.map((g,i) => `<option data-grp value="${i}">${escHtml(pick(g, "g"))}</option>`).join(""));
    grpSel.value = cur;
  }

  let q = "", grp = "", st = "";
  function render() {
    let rows = "", n = 0;
    D.itaGroups.forEach((g, gi) => {
      if (grp !== "" && +grp !== gi) return;
      const items = g.items.filter(it =>
        (!st || it.st === st) &&
        (!q || (it.c + " " + it.t + " " + (it.t_en || "")).toLowerCase().includes(q))     // ค้นได้ทั้งไทยและอังกฤษ
      );
      if (!items.length) return;
      n += items.length;
      rows += `<tr class="grp-row"><td colspan="4">${escHtml(pick(g, "g"))}</td></tr>`;
      rows += items.map(it => {
        const s = ST[it.st] || ST.none;
        return `<tr>
          <td class="code">${it.c}</td>
          <td>${escHtml(pick(it, "t"))}</td>
          <td><span class="st st--${s.c}">${t(s.k)}</span></td>
          <td><a href="#" data-doc-pending>${t("ita.view")}</a></td>
        </tr>`;
      }).join("");
    });
    $("#itaBody").innerHTML = rows;
    $("#itaEmpty").hidden = n > 0;
    $("#itaTable").hidden = n === 0;
    $("#itaCount").textContent = t("ita.count", { n });
  }

  let d;
  $("#itaQ").addEventListener("input", e => { clearTimeout(d); d = setTimeout(() => { q = e.target.value.trim().toLowerCase(); render(); }, 200); });
  grpSel.addEventListener("change", e => { grp = e.target.value; render(); });
  $("#itaSt").addEventListener("change", e => { st = e.target.value; render(); });
  renderScores(); renderGroupOptions(); render();
  I18N.onChange(() => { renderScores(); renderGroupOptions(); render(); });
})();
