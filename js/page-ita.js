/* page-ita.js — Render O1–O43 + ค้นหา/กรอง + การ์ดคะแนนย้อนหลัง */
(function () {
  "use strict";
  const D = window.DATA, $ = s => document.querySelector(s);
  const ST = { pending:{ c:"wait", t:"รอเชื่อมโยงข้อมูลจริง" }, none:{ c:"none", t:"ยังไม่เผยแพร่" } };

  /* การ์ดคะแนน (ไม่ใช่ลิงก์ — เป็นการ์ดสรุปข้อมูลเท่านั้น จึงไม่ใช้ <a href="#">) */
  $("#scoreCards").innerHTML = D.itaScores.map(s => `
    <li><div class="svc-card" role="group" aria-label="ผลประเมิน ITA ปีงบประมาณ ${s.y} ได้ ${s.s} คะแนน ระดับ ${s.g}${s.est ? ' (ตัวเลขคำนวณย้อนกลับ ยังไม่ยืนยันตรง)' : ''}">
      <span class="ic" aria-hidden="true">🏅</span>
      <b>ปีงบประมาณ ${s.y}</b>
      <small><b style="font-size:1.5rem;color:var(--brand-500)">${s.est ? "≈" : ""}${s.s}</b> คะแนน · ระดับ ${s.g}</small>
      ${s.est ? `<small style="color:var(--muted)">*คำนวณย้อนกลับจากส่วนต่างที่แถลง ต้องยืนยันซ้ำ</small>` : ""}
    </div></li>`).join("");

  /* ตัวเลือกตัวชี้วัด */
  $("#itaGrp").insertAdjacentHTML("beforeend",
    D.itaGroups.map((g,i) => `<option value="${i}">${g.g}</option>`).join(""));

  let q = "", grp = "", st = "";
  function render() {
    let rows = "", n = 0;
    D.itaGroups.forEach((g, gi) => {
      if (grp !== "" && +grp !== gi) return;
      const items = g.items.filter(it =>
        (!st || it.st === st) &&
        (!q || (it.c + " " + it.t).toLowerCase().includes(q))
      );
      if (!items.length) return;
      n += items.length;
      rows += `<tr class="grp-row"><td colspan="4">${g.g}</td></tr>`;
      rows += items.map(it => {
        const s = ST[it.st] || ST.none;
        return `<tr>
          <td class="code">${it.c}</td>
          <td>${escHtml(it.t)}</td>
          <td><span class="st st--${s.c}">${s.t}</span></td>
          <td><a href="#" data-doc-pending>ดูข้อมูล →</a></td>
        </tr>`;
      }).join("");
    });
    $("#itaBody").innerHTML = rows;
    $("#itaEmpty").hidden = n > 0;
    $("#itaTable").hidden = n === 0;
    $("#itaCount").textContent = `แสดง ${n} รายการ จากทั้งหมด 43 รายการ`;
  }

  let d;
  $("#itaQ").addEventListener("input", e => { clearTimeout(d); d = setTimeout(() => { q = e.target.value.trim().toLowerCase(); render(); }, 200); });
  $("#itaGrp").addEventListener("change", e => { grp = e.target.value; render(); });
  $("#itaSt").addEventListener("change", e => { st = e.target.value; render(); });
  render();
})();


