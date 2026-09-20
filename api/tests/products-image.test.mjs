// api/tests/products-image.test.mjs — ทดสอบ flow "รูปสินค้า GI/OTOP" บน Worker เดิม (ไม่มี endpoint ใหม่)
// ยืนยันว่า products ใช้ระบบเดียวกับ news/travel: placeholder → path จริง → รูป + list + body ในคอมมิตเดียว
// รัน: node api/tests/products-image.test.mjs
import worker from "../worker.js";
import { createMockGitHub } from "./mock-github.mjs";

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { console.log("  ✓", name); pass++; } else { console.log("  ✗", name, extra ? "-> " + extra : ""); fail++; }
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function run() {
  const seed = [
    { id: 1, type: "gi", t: "ทุเรียนหลงลับแลอุตรดิตถ์", tag: "สินค้า GI", s: "ทุเรียน", homeSq: "assets/img/home-local/square/local-01-square.png" },
    { id: 4, type: "otop", t: "เหล็กน้ำพี้", tag: "สินค้า OTOP", s: "แร่เหล็ก" }
  ];
  const seedBody = { 1: { html: "<p>เดิม</p>", tags: ["GI"] } };
  const mock = createMockGitHub({
    "data/products.json": JSON.stringify(seed, null, 2) + "\n",
    "data/product-body.json": JSON.stringify(seedBody, null, 2) + "\n"
  });
  const env = {
    GITHUB_TOKEN: "fake", ADMIN_PASSWORD_HASH: await sha256Hex("pw-products"), SESSION_SECRET: "s",
    GITHUB_OWNER: "o", GITHUB_REPO: "r", GITHUB_BRANCH: "main", ALLOWED_ORIGIN: "*"
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, init) => mock.fetch(url, init);
  const req = (path, o = {}) => new Request("https://w.example" + path, {
    method: o.method || "GET",
    headers: { "Content-Type": "application/json", ...(o.auth ? { Authorization: "Bearer " + o.auth } : {}) },
    body: o.body ? JSON.stringify(o.body) : undefined
  });
  const load = async token => {
    const l = await (await worker.fetch(req("/content/products", { auth: token }), env)).json();
    const b = await (await worker.fetch(req("/body/products", { auth: token }), env)).json();
    return { items: l.items, itemsSha: l.sha, body: b.body, bodySha: b.sha };
  };
  const png = "data:image/png;base64," + Buffer.from("fake-product-png").toString("base64");
  const PH = "@@PENDING_IMAGE@@";

  const login = await (await worker.fetch(req("/login", { method: "POST", body: { password: "pw-products" } }), env)).json();
  const token = login.token;

  console.log("== A) แก้ไขสินค้า GI เดิม + เลือกรูปใหม่ → รูป+list+body ในคอมมิตเดียว ==");
  let cur = await load(token);
  mock.state.calls.length = 0;
  let res = await worker.fetch(req("/content/products", { method: "PUT", auth: token, body: {
    items: cur.items.map(i => i.id === 1 ? { ...i, img: PH } : i), itemsSha: cur.itemsSha,
    bodyId: 1, bodyReplace: { html: "<p>เดิม</p>", tags: ["GI"] }, bodySha: cur.bodySha,
    image: { filename: "durian.png", dataBase64: png }, message: "content: update products #1"
  } }), env);
  let data = await res.json();
  assert("PUT products + image -> 200", res.status === 200, JSON.stringify(data));
  assert("ได้ imagePath ใต้ assets/img/uploads/", /^assets\/img\/uploads\//.test(data.imagePath || ""), data.imagePath);
  assert("สร้าง commit เดียวเท่านั้น", mock.countCalls("/git/commits POST") === 1, mock.state.calls.join(","));
  assert("สร้าง blob 3 ก้อน (products.json + product-body.json + รูป)", mock.countCalls("/git/blobs POST") === 3, String(mock.countCalls("/git/blobs POST")));
  cur = await load(token);
  const p1 = cur.items.find(i => i.id === 1);
  assert("products.json เก็บ path จริง ไม่ใช่ placeholder/base64", p1.img === data.imagePath && !JSON.stringify(cur.items).includes("data:image") && !JSON.stringify(cur.items).includes(PH));
  assert("ไฟล์รูปอยู่ใน repo จริง", mock.fileExists(data.imagePath));
  assert("field เดิม (homeSq) ของสินค้ายังอยู่ครบ ไม่ถูกแตะ", p1.homeSq === "assets/img/home-local/square/local-01-square.png");
  const firstPath = data.imagePath;

  console.log("\n== B) แก้ไขสินค้า OTOP + เลือกรูป (สินค้าที่ยังไม่เคยมีรูป) ==");
  mock.state.calls.length = 0;
  res = await worker.fetch(req("/content/products", { method: "PUT", auth: token, body: {
    items: cur.items.map(i => i.id === 4 ? { ...i, img: PH } : i), itemsSha: cur.itemsSha,
    bodyId: 4, bodyReplace: {}, bodySha: cur.bodySha,
    image: { filename: "iron.jpg", dataBase64: "data:image/jpeg;base64," + Buffer.from("fake-jpg").toString("base64") }
  } }), env);
  data = await res.json();
  assert("OTOP + image -> 200", res.status === 200, JSON.stringify(data));
  cur = await load(token);
  assert("OTOP มี img เป็น path จริง", cur.items.find(i => i.id === 4).img === data.imagePath);

  console.log("\n== C) บันทึกเฉพาะข้อมูล ไม่เปลี่ยนรูป → ไม่สร้าง blob รูปใหม่ ==");
  mock.state.calls.length = 0;
  res = await worker.fetch(req("/content/products", { method: "PUT", auth: token, body: {
    items: cur.items.map(i => i.id === 1 ? { ...i, s: "คำอธิบายใหม่" } : i), itemsSha: cur.itemsSha,
    bodyId: 1, bodyReplace: { html: "<p>เดิม</p>" }, bodySha: cur.bodySha
  } }), env);
  data = await res.json();
  assert("save ข้อมูลอย่างเดียว -> 200 ไม่มี imagePath", res.status === 200 && data.imagePath === undefined);
  assert("blob = 2 ก้อนเท่านั้น (list + body)", mock.countCalls("/git/blobs POST") === 2, String(mock.countCalls("/git/blobs POST")));
  cur = await load(token);
  assert("img เดิมยังอยู่ครบ", cur.items.find(i => i.id === 1).img === firstPath);

  console.log("\n== D) เคลียร์รูป (ลบ key img) → รายการไม่มี img ==");
  res = await worker.fetch(req("/content/products", { method: "PUT", auth: token, body: {
    items: cur.items.map(i => { if (i.id !== 4) return i; const { img, ...rest } = i; return rest; }), itemsSha: cur.itemsSha,
    bodyId: 4, bodyReplace: {}, bodySha: cur.bodySha
  } }), env);
  assert("เคลียร์รูป -> 200", res.status === 200, "got " + res.status);
  cur = await load(token);
  assert("สินค้า #4 ไม่มี key img แล้ว", !("img" in cur.items.find(i => i.id === 4)));

  console.log("\n== E) ส่งรูปมาแต่ไม่มี placeholder อ้างอิง → ปฏิเสธ (กันรูป orphan) ==");
  mock.state.calls.length = 0;
  res = await worker.fetch(req("/content/products", { method: "PUT", auth: token, body: {
    items: cur.items, itemsSha: cur.itemsSha, image: { filename: "x.png", dataBase64: png }
  } }), env);
  assert("-> 422 IMAGE_NOT_REFERENCED", res.status === 422 && (await res.json()).error === "IMAGE_NOT_REFERENCED");
  assert("ไม่มีการสร้าง blob", mock.countCalls("/git/blobs POST") === 0);

  console.log("\n== F) ลบสินค้า → list + body หายพร้อมกัน (CRUD เดิมไม่เสีย) ==");
  res = await worker.fetch(req("/content/products", { method: "PUT", auth: token, body: {
    items: cur.items.filter(i => i.id !== 1), itemsSha: cur.itemsSha, bodyId: 1, deleteBody: true, bodySha: cur.bodySha
  } }), env);
  assert("ลบสินค้า -> 200", res.status === 200, "got " + res.status);
  cur = await load(token);
  assert("สินค้า #1 และ body หายไป", !cur.items.some(i => i.id === 1) && !("1" in cur.body));

  globalThis.fetch = realFetch;
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error("TEST CRASH:", e); process.exit(1); });
