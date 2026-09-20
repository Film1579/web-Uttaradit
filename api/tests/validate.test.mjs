// api/tests/validate.test.mjs — ทดสอบ logic ตรวจสอบข้อมูล (schema) ของ Worker แบบไม่ต้องมีเครือข่าย
// รัน: node api/tests/validate.test.mjs
import { validateItems, validateBodyPatch } from "../worker.js";

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); console.log("  ✓", name); pass++; }
  catch (e) { console.log("  ✗", name, "->", e.message); fail++; }
}
function expectThrow(name, fn, codeMatch) {
  try { fn(); console.log("  ✗", name, "-> ควร throw แต่ไม่ throw"); fail++; }
  catch (e) {
    if (codeMatch && e.code !== codeMatch) { console.log("  ✗", name, "-> throw ผิดชนิด:", e.code); fail++; }
    else { console.log("  ✓", name, "(throws:", e.code + ")"); pass++; }
  }
}

console.log("validateItems — news");
ok("รายการถูกต้องผ่าน", () => validateItems("news", [{ id: 1, date: "2026-09-09", cat: "featured", title: "t", ex: "e" }]));
expectThrow("date ผิดรูปแบบ", () => validateItems("news", [{ id: 1, date: "09-09-2026", cat: "featured", title: "t", ex: "e" }]), "INVALID_SCHEMA");
expectThrow("cat ไม่อยู่ใน whitelist", () => validateItems("news", [{ id: 1, date: "2026-09-09", cat: "x", title: "t", ex: "e" }]), "INVALID_SCHEMA");
expectThrow("id ซ้ำ", () => validateItems("news", [
  { id: 1, date: "2026-09-09", cat: "featured", title: "a", ex: "e" },
  { id: 1, date: "2026-09-10", cat: "featured", title: "b", ex: "e" }
]), "DUPLICATE_ID");
expectThrow("ขาดฟิลด์จำเป็น", () => validateItems("news", [{ id: 1, date: "2026-09-09", cat: "featured", ex: "e" }]), "INVALID_SCHEMA");
expectThrow("srcUrl ไม่ใช่ http(s)", () => validateItems("news", [{ id: 1, date: "2026-09-09", cat: "featured", title: "t", ex: "e", srcUrl: "javascript:x" }]), "INVALID_SCHEMA");
expectThrow("img path หลอก", () => validateItems("news", [{ id: 1, date: "2026-09-09", cat: "featured", title: "t", ex: "e", img: "javascript:x" }]), "INVALID_SCHEMA");
expectThrow("items ไม่ใช่ array", () => validateItems("news", {}), "INVALID_SCHEMA");

console.log("\nvalidateItems — products");
ok("type gi/otop ถูกต้อง", () => validateItems("products", [{ id: 1, type: "gi", t: "t", s: "s" }]));
expectThrow("type ไม่ใช่ gi/otop", () => validateItems("products", [{ id: 1, type: "bogus", t: "t", s: "s" }]), "INVALID_SCHEMA");
ok("สินค้าไม่มี img (ยังไม่อัปโหลดรูป) ผ่าน", () => validateItems("products", [{ id: 1, type: "otop", t: "t", s: "s" }]));
ok("สินค้ามี img เป็น path ใต้ assets/ ผ่าน", () => validateItems("products", [{ id: 1, type: "gi", t: "t", s: "s", img: "assets/img/uploads/abc-durian.jpg" }]));
expectThrow("สินค้า img path หลอก", () => validateItems("products", [{ id: 1, type: "gi", t: "t", s: "s", img: "javascript:x" }]), "INVALID_SCHEMA");

console.log("\nvalidateBodyPatch");
ok("news body ถูกต้อง", () => validateBodyPatch("news", { html: "<p>x</p>", caption: "c", tags: ["a", "b"] }));
expectThrow("ฟิลด์ไม่รู้จัก", () => validateBodyPatch("news", { unknownField: 1 }), "INVALID_SCHEMA");
expectThrow("tags ไม่ใช่ array", () => validateBodyPatch("news", { tags: "x" }), "INVALID_SCHEMA");
expectThrow("html ไม่ใช่ string", () => validateBodyPatch("news", { html: 123 }), "INVALID_SCHEMA");
expectThrow("travel body ใส่ tags (ไม่มีในสคีมา)", () => validateBodyPatch("travel", { tags: ["x"] }), "INVALID_SCHEMA");
ok("travel body มีแค่ html ผ่าน", () => validateBodyPatch("travel", { html: "<p>x</p>" }));
ok("null patch ผ่าน", () => validateBodyPatch("news", null));

// --- ฟิลด์ฉบับภาษาอังกฤษ (i18n) ---
ok("news body: html_en/caption_en/tags_en ผ่าน", () => validateBodyPatch("news", { html_en: "<p>x</p>", caption_en: "c", tags_en: ["a", "b"] }));
ok("travel body: html_en ผ่าน", () => validateBodyPatch("travel", { html_en: "<p>x</p>" }));
ok("products body: html_en/tags_en ผ่าน", () => validateBodyPatch("products", { html_en: "x", tags_en: ["GI"] }));
expectThrow("tags_en ไม่ใช่ array -> INVALID_SCHEMA", () => validateBodyPatch("news", { tags_en: "x" }), "INVALID_SCHEMA");
expectThrow("travel ไม่มี tags_en -> INVALID_SCHEMA", () => validateBodyPatch("travel", { tags_en: [] }), "INVALID_SCHEMA");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
