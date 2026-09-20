import worker from "../worker.js";
import { createMockGitHub } from "./mock-github.mjs";

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { console.log("  ✓", name); pass++; }
  else { console.log("  ✗", name, extra ? "-> " + extra : ""); fail++; }
}

const ADMIN_PASSWORD = "test-password-123";
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function run() {
  const seedNews = [{ id: 1, date: "2026-09-09", cat: "featured", title: "ข่าวเดิม", ex: "สรุปเดิม" }];
  const seedNewsBody = { 1: { tags: ["เดิม"] } };
  const mock = createMockGitHub({
    "data/news.json": JSON.stringify(seedNews, null, 2) + "\n",
    "data/news-body.json": JSON.stringify(seedNewsBody, null, 2) + "\n"
  });

  const env = {
    GITHUB_TOKEN: "fake-token",
    ADMIN_PASSWORD_HASH: await sha256Hex(ADMIN_PASSWORD),
    SESSION_SECRET: "fake-session-secret",
    GITHUB_OWNER: "Film1579", GITHUB_REPO: "web-Uttaradit", GITHUB_BRANCH: "main",
    ALLOWED_ORIGIN: "https://film1579.github.io"
  };

  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, init) => mock.fetch(url, init);

  function req(path, opts = {}) {
    return new Request("https://worker.example" + path, {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json", ...(opts.auth ? { Authorization: "Bearer " + opts.auth } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
  }

  console.log("== 1) Login ==");
  let res = await worker.fetch(req("/login", { method: "POST", body: { password: "wrong-password" } }), env);
  assert("รหัสผ่านผิด -> 401", res.status === 401, "got " + res.status);

  res = await worker.fetch(req("/login", { method: "POST", body: { password: ADMIN_PASSWORD } }), env);
  assert("รหัสผ่านถูก -> 200", res.status === 200, "got " + res.status);
  const loginData = await res.json();
  const token = loginData.token;
  assert("ได้ session token กลับมา", typeof token === "string" && token.includes("."));

  console.log("\n== 2) Auth guard ==");
  res = await worker.fetch(req("/content/news"), env); // ไม่มี Authorization header
  assert("ไม่ส่ง token -> 401 UNAUTHENTICATED", res.status === 401, "got " + res.status);

  res = await worker.fetch(req("/content/news", { auth: "garbage.token" }), env);
  assert("token ปลอม -> 401", res.status === 401, "got " + res.status);

  console.log("\n== 3) GET content ==");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  assert("GET /content/news -> 200", res.status === 200, "got " + res.status);
  const listData = await res.json();
  assert("ได้ข้อมูลเดิม 1 รายการ", listData.items.length === 1 && listData.items[0].title === "ข่าวเดิม");
  assert("ได้ sha กลับมา", typeof listData.sha === "string");
  const itemsSha = listData.sha;

  res = await worker.fetch(req("/body/news", { auth: token }), env);
  const bodyData = await res.json();
  assert("GET /body/news ได้ body เดิม", bodyData.body["1"].tags[0] === "เดิม");
  const bodySha = bodyData.sha;

  console.log("\n== 4) แก้ไข list + body พร้อมกัน (atomic 2-file commit) ==");
  mock.state.calls.length = 0;
  const newItems = [{ id: 1, date: "2026-09-09", cat: "featured", title: "ข่าวที่แก้แล้ว", ex: "สรุปใหม่" }];
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: {
      items: newItems, itemsSha,
      bodyId: 1, bodyReplace: { html: "<p>เนื้อหาใหม่</p>", tags: ["ใหม่", "ทดสอบ"] }, bodySha,
      message: "content: update news #1 (test)"
    }
  }), env);
  assert("PUT /content/news (list+body) -> 200", res.status === 200, "got " + res.status + " " + JSON.stringify(await res.clone().json().catch(()=>({}))));
  const putResult = await res.json();
  assert("ได้ commit sha กลับมา", typeof putResult.commit === "string");
  assert("ได้ itemsSha ใหม่", typeof putResult.itemsSha === "string" && putResult.itemsSha !== itemsSha);
  assert("ได้ bodySha ใหม่", typeof putResult.bodySha === "string" && putResult.bodySha !== bodySha);

  const fileAfter = JSON.parse(mock.readFile("data/news.json"));
  assert("data/news.json มีค่าที่แก้จริงในคอมมิตเดียว", fileAfter[0].title === "ข่าวที่แก้แล้ว");
  const bodyAfter = JSON.parse(mock.readFile("data/news-body.json"));
  assert("data/news-body.json มีเนื้อหาใหม่ในคอมมิตเดียวกัน", bodyAfter["1"].html === "<p>เนื้อหาใหม่</p>" && bodyAfter["1"].tags.includes("ทดสอบ"));
  assert("เรียก GitHub API ครบขั้นตอน blob(list)+blob(body)+tree+commit+ref (>=5 calls)", mock.state.calls.length >= 5, mock.state.calls.join(","));

  console.log("\n== 5) SHA conflict — คนอื่นแก้ list ไปแล้วระหว่างที่เปิดฟอร์มอยู่ ==");
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: [{ id: 1, date: "2026-09-09", cat: "featured", title: "แก้ซ้อน", ex: "x" }], itemsSha /* sha เก่าที่หมดอายุไปแล้ว */ }
  }), env);
  assert("ใช้ itemsSha เก่า -> 409 CONFLICT", res.status === 409, "got " + res.status);
  const conflictData = await res.json();
  assert("error code = CONFLICT", conflictData.error === "CONFLICT");
  assert("ข้อมูลจริงไม่ถูกเขียนทับ (ยังเป็นค่าจากข้อ 4)", JSON.parse(mock.readFile("data/news.json"))[0].title === "ข่าวที่แก้แล้ว");

  console.log("\n== 6) Race ตอน update ref พอดี (สองคำขอชนกัน) ==");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const fresh = await res.json();
  mock.state.forceConflictOnNextRefUpdate = true;
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: [{ id: 1, date: "2026-09-09", cat: "featured", title: "อีกครั้ง", ex: "x" }], itemsSha: fresh.sha }
  }), env);
  assert("ref update ไม่ fast-forward -> 409 CONFLICT", res.status === 409, "got " + res.status);

  console.log("\n== 7) Validation ที่ Worker (ไม่ใช่แค่ client) ==");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const fresh2 = await res.json();
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: [{ id: 1, date: "ไม่ใช่วันที่", cat: "featured", title: "x", ex: "x" }], itemsSha: fresh2.sha }
  }), env);
  assert("วันที่ผิดรูปแบบ -> 422 INVALID_SCHEMA", res.status === 422, "got " + res.status);

  console.log("\n== 8) ลบรายการ: items + body key หายพร้อมกัน (atomic) ==");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeDel = await res.json();
  res = await worker.fetch(req("/body/news", { auth: token }), env);
  const bodyBeforeDel = await res.json();
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: [], itemsSha: beforeDel.sha, bodyId: 1, deleteBody: true, bodySha: bodyBeforeDel.sha }
  }), env);
  assert("ลบสำเร็จ -> 200", res.status === 200, "got " + res.status);
  assert("data/news.json ว่างแล้ว", JSON.parse(mock.readFile("data/news.json")).length === 0);
  assert("data/news-body.json ไม่มี key 1 แล้ว", !("1" in JSON.parse(mock.readFile("data/news-body.json"))));

  console.log("\n== 9) อัปโหลดรูปภาพ + บันทึกข้อมูล \"พร้อมกันในคอมมิตเดียว\" (ข้อ 1–4) ==");

  // เตรียมรายการข่าวไว้ก่อน (ยังไม่มีรูป)
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  let cur = await res.json();
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: [{ id: 2, date: "2026-09-11", cat: "featured", title: "ข่าวไม่มีรูป", ex: "e" }], itemsSha: cur.sha }
  }), env);
  assert("เตรียมข่าว #2 (ยังไม่มีรูป) สำเร็จ", res.status === 200, "got " + res.status);
  cur = await res.json();

  const fakePng = "data:image/png;base64," + Buffer.from("fake-png-bytes-01").toString("base64");

  console.log("  -- create + image → 1 commit --");
  mock.state.calls.length = 0;
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeCreate = await res.json();
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: {
      items: [...beforeCreate.items, { id: 3, date: "2026-09-12", cat: "featured", title: "ข่าวใหม่มีรูป", ex: "e", img: "@@PENDING_IMAGE@@" }],
      itemsSha: beforeCreate.sha,
      image: { filename: "cover.png", dataBase64: fakePng },
      message: "content: add news #3 (test, with image)"
    }
  }), env);
  assert("create + image -> 200", res.status === 200, "got " + res.status + " " + JSON.stringify(await res.clone().json().catch(() => ({}))));
  let saveData = await res.json();
  assert("ได้ imagePath กลับมา", /^assets\/img\/uploads\//.test(saveData.imagePath || ""), saveData.imagePath);
  assert("เรียก POST /git/commits แค่ครั้งเดียว (1 commit จริง)", mock.countCalls("/git/commits POST") === 1, mock.state.calls.join(","));
  assert("เรียก PATCH ref แค่ครั้งเดียว", mock.countCalls("/git/refs/heads/") === 1);
  const listAfterCreate = JSON.parse(mock.readFile("data/news.json"));
  const itemWithImage = listAfterCreate.find(i => i.id === 3);
  assert("item.img ถูกแทนด้วย path จริงแล้ว (ไม่ใช่ placeholder)", itemWithImage && itemWithImage.img === saveData.imagePath, JSON.stringify(itemWithImage));
  assert("ไฟล์รูปถูกเขียนจริงในคอมมิตเดียวกัน (อยู่ใน tree ปัจจุบันพร้อมกับ list)", mock.fileExists(saveData.imagePath));

  console.log("  -- update (แก้รูปเดิม) + image → 1 commit --");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeUpdateImg = await res.json();
  mock.state.calls.length = 0;
  const fakePng2 = "data:image/png;base64," + Buffer.from("fake-png-bytes-02").toString("base64");
  const itemsForUpdate = beforeUpdateImg.items.map(i => i.id === 3 ? { ...i, title: "ข่าวใหม่มีรูป (แก้รูป)", img: "@@PENDING_IMAGE@@" } : i);
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: {
      items: itemsForUpdate, itemsSha: beforeUpdateImg.sha,
      image: { filename: "cover2.png", dataBase64: fakePng2 },
      message: "content: update news #3 (test, replace image)"
    }
  }), env);
  assert("update + image (เปลี่ยนรูปเดิม) -> 200", res.status === 200, "got " + res.status);
  saveData = await res.json();
  assert("เรียก POST /git/commits แค่ครั้งเดียว", mock.countCalls("/git/commits POST") === 1);
  const listAfterUpdateImg = JSON.parse(mock.readFile("data/news.json"));
  const item3After = listAfterUpdateImg.find(i => i.id === 3);
  assert("path รูปเปลี่ยนเป็นรูปใหม่ในคอมมิตเดียวกับ list", item3After.img === saveData.imagePath && item3After.title === "ข่าวใหม่มีรูป (แก้รูป)");

  console.log("  -- update body + image → 1 commit (list+body+รูป ในคอมมิตเดียว) --");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeBodyImg = await res.json();
  res = await worker.fetch(req("/body/news", { auth: token }), env);
  const bodyBeforeBodyImg = await res.json();
  mock.state.calls.length = 0;
  const fakePng3 = "data:image/png;base64," + Buffer.from("fake-png-bytes-03").toString("base64");
  const itemsForBodyImg = beforeBodyImg.items.map(i => i.id === 3 ? { ...i, img: "@@PENDING_IMAGE@@" } : i);
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: {
      items: itemsForBodyImg, itemsSha: beforeBodyImg.sha,
      bodyId: 3, bodyReplace: { html: "<p>เนื้อหาข่าว #3</p>" }, bodySha: bodyBeforeBodyImg.sha,
      image: { filename: "cover3.png", dataBase64: fakePng3 },
      message: "content: update news #3 body+image"
    }
  }), env);
  assert("update body + image -> 200", res.status === 200, "got " + res.status);
  saveData = await res.json();
  assert("เรียก POST /git/commits แค่ครั้งเดียว (list+body+รูปในคอมมิตเดียว)", mock.countCalls("/git/commits POST") === 1);
  const listAfterBodyImg = JSON.parse(mock.readFile("data/news.json"));
  const bodyAfterBodyImg = JSON.parse(mock.readFile("data/news-body.json"));
  assert("list เปลี่ยน img แล้ว", listAfterBodyImg.find(i => i.id === 3).img === saveData.imagePath);
  assert("body เปลี่ยน html แล้ว ในคอมมิตเดียวกัน", bodyAfterBodyImg["3"].html === "<p>เนื้อหาข่าว #3</p>");
  assert("ไฟล์รูปมีอยู่ใน tree เดียวกับ list/body", mock.fileExists(saveData.imagePath));

  console.log("  -- update โดยไม่มี image → ไม่สร้าง image blob ใหม่ --");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeNoImg = await res.json();
  mock.state.calls.length = 0;
  const itemsNoImg = beforeNoImg.items.map(i => i.id === 3 ? { ...i, title: "แก้แค่ข้อความ ไม่แตะรูป" } : i);
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: itemsNoImg, itemsSha: beforeNoImg.sha, message: "content: update news #3 text only" }
  }), env);
  assert("update ไม่มี image -> 200", res.status === 200, "got " + res.status);
  assert("จำนวน POST /git/blobs = 1 (แค่ list) ไม่มี blob รูปเพิ่ม", mock.countCalls("/git/blobs POST") === 1, mock.state.calls.join(","));
  assert("ไม่มี field imagePath กลับมา", (await res.clone().json()).imagePath === undefined);

  console.log("  -- ส่งรูปมาแต่ไม่มีที่อ้างอิง (placeholder ไม่ถูกใช้) → ปฏิเสธ ไม่สร้าง blob ใด ๆ เลย (กันรูป orphan) --");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeUnused = await res.json();
  mock.state.calls.length = 0;
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: {
      items: beforeUnused.items, // ไม่มี placeholder ในนี้เลย
      itemsSha: beforeUnused.sha,
      image: { filename: "unused.png", dataBase64: fakePng },
      message: "content: forgot to reference image"
    }
  }), env);
  assert("ไม่มี placeholder อ้างอิงรูป -> 422 IMAGE_NOT_REFERENCED", res.status === 422, "got " + res.status);
  assert("ไม่มีการเรียก GitHub API ใด ๆ เลย (fail ก่อนแตะเครือข่าย)", mock.state.calls.length === 0, mock.state.calls.join(","));

  console.log("  -- นามสกุลไฟล์ไม่อยู่ใน whitelist -> 422 --");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeBadExt = await res.json();
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: {
      items: beforeBadExt.items.map(i => i.id === 3 ? { ...i, img: "@@PENDING_IMAGE@@" } : i),
      itemsSha: beforeBadExt.sha,
      image: { filename: "malware.exe", dataBase64: "data:image/png;base64,AAA=" }
    }
  }), env);
  assert("นามสกุลไฟล์ไม่อยู่ใน whitelist -> 422", res.status === 422, "got " + res.status);

  console.log("\n== 10) GitHub commit ล้มเหลว → Admin ต้องได้รับ error จริง (ไม่ถือว่าบันทึกสำเร็จ) ==");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const beforeFail = await res.json();
  mock.state.forceFailOnNextCommitCreate = true;
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: [...beforeFail.items, { id: 99, date: "2026-09-13", cat: "featured", title: "ไม่ควรถูกบันทึก", ex: "e" }], itemsSha: beforeFail.sha }
  }), env);
  assert("GitHub ล่มตอนสร้าง commit -> 502 GITHUB_ERROR (ไม่ใช่ 200)", res.status === 502, "got " + res.status);
  const failData = await res.json();
  assert("error code = GITHUB_ERROR", failData.error === "GITHUB_ERROR");
  const listAfterFail = JSON.parse(mock.readFile("data/news.json"));
  assert("ข้อมูลจริงไม่เปลี่ยน (ไม่มีรายการ id 99)", !listAfterFail.some(i => i.id === 99));

  console.log("\n== 11) SHA conflict ตอนแก้พร้อมรูป → ไม่มีการเขียนทับ/ไม่มีรูปกำพร้า ==");
  res = await worker.fetch(req("/content/news", { auth: token }), env);
  const staleForImg = await res.json();
  // แก้ข้อมูลแทรกก่อนจริง ๆ เพื่อให้ sha ที่ถืออยู่ในมือ "เก่า" ไปแล้ว
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: { items: staleForImg.items, itemsSha: staleForImg.sha, message: "content: no-op touch to bump sha" }
  }), env);
  assert("เตรียมสถานการณ์ sha เก่าสำเร็จ", res.status === 200, "got " + res.status);
  mock.state.calls.length = 0;
  res = await worker.fetch(req("/content/news", {
    method: "PUT", auth: token,
    body: {
      items: staleForImg.items.map(i => i.id === 3 ? { ...i, img: "@@PENDING_IMAGE@@" } : i),
      itemsSha: staleForImg.sha, // sha เก่าที่หมดอายุไปแล้ว
      image: { filename: "conflict.png", dataBase64: fakePng }
    }
  }), env);
  assert("sha เก่า + มีรูปแนบมาด้วย -> ยังคง 409 CONFLICT", res.status === 409, "got " + res.status);
  assert("ไม่มีการสร้าง blob รูปใหม่ตอน conflict (fail-fast ก่อนสร้าง blob ใด ๆ)", mock.countCalls("/git/blobs POST") === 0, mock.state.calls.join(","));

  console.log("\n== 12) Session expired ==");
  const expiredPayload = Buffer.from(JSON.stringify({ exp: Date.now() - 1000 })).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expiredPayload))).toString("hex");
  res = await worker.fetch(req("/content/news", { auth: expiredPayload + "." + sig }), env);
  assert("session หมดอายุ -> 401 SESSION_EXPIRED", res.status === 401, "got " + res.status);
  const expData = await res.json();
  assert("error code = SESSION_EXPIRED", expData.error === "SESSION_EXPIRED");

  globalThis.fetch = realFetch;
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

run().catch(e => { console.error("TEST CRASH:", e); process.exit(1); });
