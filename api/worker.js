/**
 * api/worker.js — Secure API layer (Cloudflare Worker)
 *
 * "แหล่งข้อมูลจริงกลาง" ตัวเดียวที่มีสิทธิ์เขียน Repository จริง (Film1579/web-Uttaradit)
 * ต้นทาง : pages/admin.html + js/page-admin.js (ผ่าน js/admin-api.js)
 * ปลายทาง: GitHub Git Data API (blobs → tree → commit → update ref)
 *          → data/news.json, data/news-body.json, data/travel.json, data/travel-body.json,
 *            data/products.json, data/product-body.json, assets/img/uploads/*
 *
 * ทำไมใช้ Git Data API แทน Contents API ตรง ๆ:
 *   Contents API เขียนได้ครั้งละ "หนึ่งไฟล์ต่อหนึ่งคอมมิต" เท่านั้น — ถ้า Admin แก้ทั้งรายการ (list)
 *   และเนื้อหาเต็ม (body) ของข่าวเดียวกันพร้อมกัน แล้วเขียนสองคอมมิตแยกกัน จะมีช่วงเวลาสั้น ๆ ที่
 *   ข้อมูลครึ่งหนึ่งสำเร็จ (เช่น list อัปเดตแล้วแต่ body ยังเป็นของเก่า) — requirement ข้อ 5 ห้ามสิ่งนี้
 *   จึงต้องประกอบคอมมิตเองด้วย Git Data API เพื่อให้ไฟล์ที่เกี่ยวข้องกันเปลี่ยนแปลงในคอมมิตเดียวจริง ๆ
 *
 * Environment variables (ดู README.md หัวข้อ "Deploy Secure API"):
 *   GITHUB_TOKEN         (secret) Fine-grained PAT: Contents: Read & Write เฉพาะ repo นี้
 *   ADMIN_PASSWORD_HASH  (secret) SHA-256 hex ของรหัสผ่านแอดมิน
 *   SESSION_SECRET       (secret) สตริงสุ่มยาว ๆ ใช้เซ็นชื่อ session token
 *   GITHUB_OWNER         (var)    "Film1579"
 *   GITHUB_REPO          (var)    "web-Uttaradit"
 *   GITHUB_BRANCH        (var)    "main"
 *   ALLOWED_ORIGIN       (var)    "https://film1579.github.io"
 */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 ชั่วโมง

const TYPES = {
  news: {
    listPath: "data/news.json", bodyPath: "data/news-body.json",
    requiredFields: ["date", "cat", "title", "ex"],
    bodyFields: ["html", "caption", "cover", "tags", "html_en", "caption_en", "tags_en"]
  },
  travel: {
    listPath: "data/travel.json", bodyPath: "data/travel-body.json",
    requiredFields: ["t", "s", "tag"],
    bodyFields: ["html", "html_en"]
  },
  products: {
    listPath: "data/products.json", bodyPath: "data/product-body.json",
    requiredFields: ["t", "type", "s"],
    bodyFields: ["html", "tags", "html_en", "tags_en"]
  }
};
const NEWS_CAT_WHITELIST = ["all", "featured", "activity", "econ", "health", "security", "bid", "job"];
const PRODUCT_TYPE_WHITELIST = ["gi", "otop"];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    try {
      const url = new URL(request.url);
      const segs = url.pathname.replace(/^\/+/, "").split("/");

      if (segs[0] === "login" && request.method === "POST") {
        return await handleLogin(request, env, cors);
      }
      if (segs[0] === "content" && segs[1] && request.method === "GET") {
        await requireAuth(request, env);
        return await handleGetContent(segs[1], env, cors);
      }
      if (segs[0] === "content" && segs[1] && request.method === "PUT") {
        await requireAuth(request, env);
        return await handlePutContent(segs[1], request, env, cors);
      }
      if (segs[0] === "body" && segs[1] && request.method === "GET") {
        await requireAuth(request, env);
        return await handleGetBody(segs[1], env, cors);
      }

      return json({ error: "NOT_FOUND" }, 404, cors);
    } catch (e) {
      const status = e.status || 500;
      return json({ error: e.code || "SERVER_ERROR", message: e.message || String(e) }, status, cors);
    }
  }
};

/* ---------------------------------------------------------------- */
/* CORS + response helpers                                          */
/* ---------------------------------------------------------------- */
function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Vary": "Origin"
  };
}
function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
  });
}
function fail(status, code, message) {
  const e = new Error(message);
  e.status = status; e.code = code;
  throw e;
}

/* ---------------------------------------------------------------- */
/* Auth: password login → HMAC-signed session token                 */
/* ---------------------------------------------------------------- */
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function b64url(str) { return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64urlDecode(str) { return atob(str.replace(/-/g, "+").replace(/_/g, "/")); }
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handleLogin(request, env, cors) {
  let body;
  try { body = await request.json(); } catch { fail(400, "BAD_REQUEST", "invalid JSON"); }
  const password = String(body.password || "");
  if (!password) fail(400, "BAD_REQUEST", "password required");

  const hash = await sha256Hex(password);
  const expected = env.ADMIN_PASSWORD_HASH || "";
  if (!expected || !timingSafeEqual(hash, expected)) {
    fail(401, "INVALID_PASSWORD", "รหัสผ่านไม่ถูกต้อง");
  }

  const exp = Date.now() + SESSION_TTL_MS;
  const payloadB64 = b64url(JSON.stringify({ exp }));
  const sig = await hmacHex(env.SESSION_SECRET, payloadB64);
  return json({ token: payloadB64 + "." + sig, expiresAt: exp }, 200, cors);
}

async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (!m) fail(401, "UNAUTHENTICATED", "ต้องเข้าสู่ระบบก่อน");
  const [payloadB64, sig] = m[1].split(".");
  if (!payloadB64 || !sig) fail(401, "UNAUTHENTICATED", "session token ไม่ถูกต้อง");
  const expectedSig = await hmacHex(env.SESSION_SECRET, payloadB64);
  if (!timingSafeEqual(sig, expectedSig)) fail(401, "UNAUTHENTICATED", "session token ไม่ถูกต้อง");
  let payload;
  try { payload = JSON.parse(b64urlDecode(payloadB64)); } catch { fail(401, "UNAUTHENTICATED", "session token เสีย"); }
  if (!payload.exp || Date.now() > payload.exp) fail(401, "SESSION_EXPIRED", "หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่");
}

/* ---------------------------------------------------------------- */
/* GitHub REST helpers (Contents API สำหรับอ่าน + Git Data API สำหรับเขียน) */
/* ---------------------------------------------------------------- */
function ghHeaders(env, extra) {
  return {
    "Authorization": "token " + env.GITHUB_TOKEN,
    "Accept": "application/vnd.github+json",
    "User-Agent": "uttaradit-admin-worker",
    ...extra
  };
}
function ghApi(env, path) { return `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${path}`; }
function utf8ToBase64(str) { return btoa(unescape(encodeURIComponent(str))); }
function base64ToUtf8(b64) { return decodeURIComponent(escape(atob(b64.replace(/\n/g, "")))); }

async function ghJson(env, path, init) {
  const res = await fetch(ghApi(env, path), { ...init, headers: ghHeaders(env, init && init.headers) });
  return { res, data: await res.json().catch(() => null) };
}

/** อ่านไฟล์ผ่าน Contents API — คืน null ถ้าไม่มีไฟล์ */
async function ghGetFile(env, path) {
  const { res, data } = await ghJson(env, `/contents/${path}?ref=${env.GITHUB_BRANCH}`);
  if (res.status === 404) return null;
  if (!res.ok) fail(502, "GITHUB_ERROR", "อ่านไฟล์จาก GitHub ไม่สำเร็จ: " + res.status);
  return data; // { content(base64), sha, ... }
}

/**
 * เขียนหลายไฟล์ให้อยู่ใน "คอมมิตเดียว" จริง ๆ (atomic) ด้วย Git Data API
 * files: [{ path, content, expectedSha(string|null), encoding?("base64") }]
 *   - content เป็น utf8 string ตามปกติ (เช่นไฟล์ JSON) เว้นแต่ encoding === "base64"
 *     ซึ่งใช้กับไฟล์ไบนารี (เช่นรูปภาพ) — ตรงกรณีนี้ content ต้องเป็น base64 string อยู่แล้ว
 *     (ไม่ถูกนำไป utf8-encode ซ้ำ ซึ่งจะทำให้ข้อมูลไบนารีเสีย)
 *   - รูปภาพใหม่ที่ยังไม่เคย commit จะมี expectedSha: null เสมอ (ไฟล์ใหม่ ยังไม่มีอยู่ใน repo)
 * - ตรวจ sha ปัจจุบันของทุกไฟล์ก่อนสร้าง blob ใด ๆ ทั้งหมด (fail-fast ถ้ามีไฟล์ไหน conflict — ข้อ 5, 8, 18)
 * - ใช้ update ref แบบ fast-forward only (force:false) เป็นเซฟตี้เน็ตชั้นสอง กันสองคำขอชนกันพอดี
 * - คืนค่า sha ใหม่ของแต่ละไฟล์ (คือ blob sha ที่สร้าง — ตรงกับค่า sha ที่ Contents API จะรายงาน)
 */
async function ghAtomicCommit(env, files, message) {
  // 1) ตรวจ sha ปัจจุบันของทุกไฟล์เทียบกับที่ client คาดไว้ — ก่อนแตะ Git Data API เลย
  for (const f of files) {
    const current = await ghGetFile(env, f.path);
    const currentSha = current ? current.sha : null;
    const expected = f.expectedSha || null;
    if (expected !== currentSha) {
      fail(409, "CONFLICT", `ข้อมูลไฟล์ "${f.path}" ถูกแก้ไขจากที่อื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึกอีกครั้ง`);
    }
  }

  // 2) อ่าน ref ปัจจุบันของ branch → base commit → base tree
  const refRes = await ghJson(env, `/git/ref/heads/${env.GITHUB_BRANCH}`);
  if (!refRes.res.ok) fail(502, "GITHUB_ERROR", "อ่าน branch ref ไม่สำเร็จ: " + refRes.res.status);
  const baseCommitSha = refRes.data.object.sha;

  const commitRes = await ghJson(env, `/git/commits/${baseCommitSha}`);
  if (!commitRes.res.ok) fail(502, "GITHUB_ERROR", "อ่าน base commit ไม่สำเร็จ: " + commitRes.res.status);
  const baseTreeSha = commitRes.data.tree.sha;

  // 3) สร้าง blob ให้ทุกไฟล์ที่จะเปลี่ยน
  const treeItems = [];
  const newShaByPath = {};
  for (const f of files) {
    const blobRes = await ghJson(env, "/git/blobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: f.encoding === "base64" ? f.content : utf8ToBase64(f.content),
        encoding: "base64"
      })
    });
    if (!blobRes.res.ok) fail(502, "GITHUB_ERROR", "สร้าง blob ไม่สำเร็จ: " + blobRes.res.status);
    treeItems.push({ path: f.path, mode: "100644", type: "blob", sha: blobRes.data.sha });
    newShaByPath[f.path] = blobRes.data.sha;
  }

  // 4) สร้าง tree ใหม่บนฐาน tree เดิม (ไฟล์อื่นที่ไม่เกี่ยวข้องจะไม่ถูกแตะต้อง)
  const treeRes = await ghJson(env, "/git/trees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
  });
  if (!treeRes.res.ok) fail(502, "GITHUB_ERROR", "สร้าง tree ไม่สำเร็จ: " + treeRes.res.status);

  // 5) สร้าง commit ใหม่ (parent = base commit ที่อ่านไว้ตอนต้น)
  const newCommitRes = await ghJson(env, "/git/commits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, tree: treeRes.data.sha, parents: [baseCommitSha] })
  });
  if (!newCommitRes.res.ok) fail(502, "GITHUB_ERROR", "สร้าง commit ไม่สำเร็จ: " + newCommitRes.res.status);
  const newCommitSha = newCommitRes.data.sha;

  // 6) อัปเดต ref แบบ fast-forward only — ถ้ามีคอมมิตอื่นแทรกระหว่างขั้นตอนนี้พอดี จะ fail ตรงนี้แทนการเขียนทับ
  const updateRefRes = await ghJson(env, `/git/refs/heads/${env.GITHUB_BRANCH}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommitSha, force: false })
  });
  if (updateRefRes.res.status === 422 || updateRefRes.res.status === 409) {
    fail(409, "CONFLICT", "มีการบันทึกข้อมูลอื่นแทรกเข้ามาพอดีในจังหวะเดียวกัน กรุณาโหลดข้อมูลล่าสุดแล้วลองบันทึกอีกครั้ง");
  }
  if (!updateRefRes.res.ok) fail(502, "GITHUB_ERROR", "อัปเดต branch ไม่สำเร็จ: " + updateRefRes.res.status);

  return { commitSha: newCommitSha, shaByPath: newShaByPath };
}

/* ---------------------------------------------------------------- */
/* Validation (ข้อ 9, 17) — Worker ต้องตรวจเองเสมอ ไม่พึ่ง client ฝ่ายเดียว */
/* ---------------------------------------------------------------- */
function validateItems(type, items) {
  const cfg = TYPES[type];
  if (!Array.isArray(items)) fail(422, "INVALID_SCHEMA", "ข้อมูลต้องเป็นรายการ (array)");
  const ids = new Set();
  for (const it of items) {
    if (it == null || typeof it !== "object") fail(422, "INVALID_SCHEMA", "พบรายการที่ไม่ถูกต้อง");
    if (it.id === undefined || it.id === null || it.id === "") fail(422, "INVALID_SCHEMA", "ทุกรายการต้องมี id");
    if (ids.has(String(it.id))) fail(422, "DUPLICATE_ID", "id ซ้ำ: " + it.id);
    ids.add(String(it.id));
    for (const f of cfg.requiredFields) {
      if (!it[f] && it[f] !== 0) fail(422, "INVALID_SCHEMA", `รายการ id ${it.id} ขาดฟิลด์ที่จำเป็น: ${f}`);
    }
    if (type === "news") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(it.date)) fail(422, "INVALID_SCHEMA", `รูปแบบวันที่ไม่ถูกต้อง (id ${it.id}): ต้องเป็น YYYY-MM-DD`);
      if (!NEWS_CAT_WHITELIST.includes(it.cat)) fail(422, "INVALID_SCHEMA", `หมวดข่าวไม่ถูกต้อง (id ${it.id}): ${it.cat}`);
      if (it.srcUrl && !/^https?:\/\//i.test(it.srcUrl)) fail(422, "INVALID_SCHEMA", `ลิงก์แหล่งข่าวไม่ถูกต้อง (id ${it.id})`);
    }
    if (type === "products") {
      if (!PRODUCT_TYPE_WHITELIST.includes(it.type)) fail(422, "INVALID_SCHEMA", `ประเภทสินค้าไม่ถูกต้อง (id ${it.id}): ${it.type}`);
    }
    if (it.img && !/^(assets\/|data:image\/|https?:\/\/)/.test(it.img)) {
      fail(422, "INVALID_SCHEMA", `พาธรูปภาพไม่ถูกต้อง (id ${it.id}): ${it.img}`);
    }
  }
}

function validateBodyPatch(type, patch) {
  if (patch == null) return;
  if (typeof patch !== "object" || Array.isArray(patch)) fail(422, "INVALID_SCHEMA", "body ต้องเป็นออบเจกต์");
  const cfg = TYPES[type];
  for (const k of Object.keys(patch)) {
    if (!cfg.bodyFields.includes(k)) fail(422, "INVALID_SCHEMA", `ฟิลด์ body ไม่รู้จัก: ${k}`);
  }
  if (patch.html !== undefined && typeof patch.html !== "string") fail(422, "INVALID_SCHEMA", "body.html ต้องเป็นข้อความ");
  if (patch.caption !== undefined && typeof patch.caption !== "string") fail(422, "INVALID_SCHEMA", "body.caption ต้องเป็นข้อความ");
  // ฟิลด์ฉบับภาษาอังกฤษ (i18n) — ชนิดข้อมูลเดียวกับฉบับไทย
  if (patch.html_en !== undefined && typeof patch.html_en !== "string") fail(422, "INVALID_SCHEMA", "body.html_en ต้องเป็นข้อความ");
  if (patch.caption_en !== undefined && typeof patch.caption_en !== "string") fail(422, "INVALID_SCHEMA", "body.caption_en ต้องเป็นข้อความ");
  if (patch.tags_en !== undefined && (!Array.isArray(patch.tags_en) || patch.tags_en.some(t => typeof t !== "string"))) {
    fail(422, "INVALID_SCHEMA", "body.tags_en ต้องเป็นรายการข้อความ (array of string)");
  }
  if (patch.cover !== undefined && patch.cover && !/^(assets\/|data:image\/|https?:\/\/)/.test(patch.cover)) {
    fail(422, "INVALID_SCHEMA", "body.cover พาธรูปภาพไม่ถูกต้อง");
  }
  if (patch.tags !== undefined && (!Array.isArray(patch.tags) || patch.tags.some(t => typeof t !== "string"))) {
    fail(422, "INVALID_SCHEMA", "body.tags ต้องเป็นรายการข้อความ (array of string)");
  }
}

export { validateItems, validateBodyPatch };

/* ---------------------------------------------------------------- */
/* Content handlers: news / travel / products                       */
/* ---------------------------------------------------------------- */
async function handleGetContent(type, env, cors) {
  const cfg = TYPES[type];
  if (!cfg) fail(400, "BAD_TYPE", "ประเภทข้อมูลไม่ถูกต้อง");
  const file = await ghGetFile(env, cfg.listPath);
  const items = file ? JSON.parse(base64ToUtf8(file.content)) : [];
  return json({ items, sha: file ? file.sha : null }, 200, cors);
}

async function handleGetBody(type, env, cors) {
  const cfg = TYPES[type];
  if (!cfg) fail(400, "BAD_TYPE", "ประเภทข้อมูลไม่ถูกต้อง");
  const file = await ghGetFile(env, cfg.bodyPath);
  const body = file ? JSON.parse(base64ToUtf8(file.content)) : {};
  return json({ body, sha: file ? file.sha : null }, 200, cors);
}

/**
 * PUT /content/:type
 * body: {
 *   items, itemsSha,                 // แทนที่ data/{type}.json ทั้งไฟล์ (เหมือนเดิม)
 *   bodyId, bodyReplace, bodySha,    // ถ้ามี: แทนที่ body[bodyId] ทั้งก้อนใน data/{type}-body.json
 *   deleteBody,                      // true = ลบ key bodyId ออกจาก body object (ใช้ตอนลบรายการ)
 *   image,                           // ถ้ามี: { filename, dataBase64 } รูปใหม่ที่ต้อง commit "พร้อมกัน" ในคอมมิตนี้เลย
 *   message
 * }
 *
 * เรื่องรูปภาพ (ข้อ 1–4, 10, 11, 12):
 *   ก่อนหน้านี้ POST /upload-image เป็นคอมมิตแยกต่างหาก ทำให้เกิดช่วงเวลาที่รูปอัปโหลดสำเร็จแต่ JSON
 *   บันทึกไม่สำเร็จ (รูป orphan) — ตอนนี้ยกเลิก endpoint นั้นแล้ว รูปภาพใหม่ (ถ้ามี) ถูกสร้างเป็น blob
 *   และใส่เข้า tree เดียวกับ list/body JSON ผ่าน ghAtomicCommit ทำให้ "รูป + JSON" อยู่ใน commit เดียวกันจริง ๆ
 *   ฝั่ง client (js/page-admin.js) ไม่รู้ path จริงของรูปล่วงหน้า (Worker เป็นผู้สร้าง path จาก timestamp)
 *   จึงส่งค่า placeholder คงที่ (IMAGE_PLACEHOLDER) มาแทนตำแหน่งที่ต้องการใส่รูป เช่น items[i].img หรือ
 *   bodyReplace.cover แล้ว Worker จะแทนที่ placeholder ด้วย path จริงก่อนตรวจ validate/สร้างไฟล์ — ถ้าส่ง
 *   image มาแต่ไม่มีใครอ้างอิง placeholder เลย ให้ปฏิเสธคำขอทันที (ข้อ 11: กันไม่ให้มีรูปเข้า repo โดยไม่ถูกใช้)
 *   ถ้า Admin ไม่ได้เปลี่ยนรูป (ไม่ส่ง image มา) จะไม่มีการสร้าง blob รูปใหม่เลย (ข้อ 10)
 *
 * ทุกไฟล์ที่เกี่ยวข้อง (list + body ถ้ามี + รูปถ้ามี) ถูก commit "พร้อมกันในคอมมิตเดียว" ผ่าน ghAtomicCommit — ข้อ 5
 */
async function handlePutContent(type, request, env, cors) {
  const cfg = TYPES[type];
  if (!cfg) fail(400, "BAD_TYPE", "ประเภทข้อมูลไม่ถูกต้อง");
  let body;
  try { body = await request.json(); } catch { fail(400, "BAD_REQUEST", "invalid JSON"); }

  // ---------- เตรียมรูปภาพ (ถ้ามี) ก่อนตรวจ schema เพื่อแทน placeholder ด้วย path จริง ----------
  let imageFile = null; // { path, base64 } — จะถูกใส่เข้า tree เดียวกับ list/body ด้านล่าง
  if (body.image) {
    imageFile = prepareImageBlob(body.image);
    let placeholderUsed = false;
    if (Array.isArray(body.items)) {
      for (const it of body.items) {
        if (it && typeof it === "object" && it.img === IMAGE_PLACEHOLDER) {
          it.img = imageFile.path;
          placeholderUsed = true;
        }
      }
    }
    if (body.bodyReplace && typeof body.bodyReplace === "object" && body.bodyReplace.cover === IMAGE_PLACEHOLDER) {
      body.bodyReplace.cover = imageFile.path;
      placeholderUsed = true;
    }
    if (!placeholderUsed) {
      fail(422, "IMAGE_NOT_REFERENCED", "มีการส่งรูปภาพมาแต่ไม่มีข้อมูลใดอ้างอิงถึงตำแหน่งของรูปนี้ ป้องกันไฟล์รูปกำพร้าใน repository");
    }
  }

  validateItems(type, body.items);

  const files = [{
    path: cfg.listPath,
    content: JSON.stringify(body.items, null, 2) + "\n",
    expectedSha: body.itemsSha || null
  }];

  const touchesBody = body.bodyId !== undefined && body.bodyId !== null;
  let newBodyObj = null;
  if (touchesBody) {
    if (!body.deleteBody) validateBodyPatch(type, body.bodyReplace || {});
    // อ่าน body object ปัจจุบันมาก่อน เพื่อแก้เฉพาะ key ของ id นี้ โดยไม่กระทบ id อื่นในไฟล์เดียวกัน
    const bodyFile = await ghGetFile(env, cfg.bodyPath);
    const currentBodyObj = bodyFile ? JSON.parse(base64ToUtf8(bodyFile.content)) : {};
    const currentSha = bodyFile ? bodyFile.sha : null;
    if ((body.bodySha || null) !== currentSha) {
      fail(409, "CONFLICT", `เนื้อหาเต็ม (body) ของรายการนี้ถูกแก้ไขจากที่อื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึกอีกครั้ง`);
    }
    if (body.deleteBody) {
      delete currentBodyObj[body.bodyId];
    } else {
      const replace = body.bodyReplace || {};
      if (Object.keys(replace).length) currentBodyObj[body.bodyId] = replace;
      else delete currentBodyObj[body.bodyId]; // เคลียร์ฟิลด์ทั้งหมด = ไม่ต้องเก็บ key ว่าง ๆ ไว้
    }
    newBodyObj = currentBodyObj;
    files.push({
      path: cfg.bodyPath,
      content: JSON.stringify(newBodyObj, null, 2) + "\n",
      expectedSha: currentSha
    });
  }

  if (imageFile) {
    files.push({
      path: imageFile.path,
      content: imageFile.base64,
      expectedSha: null, // ไฟล์รูปใหม่เสมอ (path มี timestamp กำกับ) — ยังไม่เคยมีอยู่ใน repo
      encoding: "base64"
    });
  }

  const message = (body.message && String(body.message).slice(0, 200)) ||
    `content: update ${type} (${new Date().toISOString()})`;

  const result = await ghAtomicCommit(env, files, message);

  return json({
    ok: true,
    itemsSha: result.shaByPath[cfg.listPath],
    bodySha: touchesBody ? result.shaByPath[cfg.bodyPath] : undefined,
    imagePath: imageFile ? imageFile.path : undefined,
    commit: result.commitSha
  }, 200, cors);
}

/* ---------------------------------------------------------------- */
/* รูปภาพ — เตรียม blob เพื่อใส่เข้า tree เดียวกับ list/body JSON        */
/* (ไม่มี network call ในนี้ — การเขียนจริงเกิดใน ghAtomicCommit เท่านั้น    */
/* เพื่อให้รูป + JSON อยู่ใน commit เดียวกันจริง ๆ ตามข้อ 1–4, 11)          */
/* ---------------------------------------------------------------- */
const IMAGE_EXT_WHITELIST = ["jpg", "jpeg", "png", "webp"];
const IMAGE_PLACEHOLDER = "@@PENDING_IMAGE@@"; // ต้องตรงกับค่าคงที่ฝั่ง js/page-admin.js

/** ตรวจ + คำนวณ path จริงของรูปใหม่ (path มี timestamp กำกับกันชนกับของเดิม/กันซ้ำ) */
function prepareImageBlob(image) {
  const filename = String((image && image.filename) || "").toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  const ext = (filename.split(".").pop() || "");
  if (!filename || !IMAGE_EXT_WHITELIST.includes(ext)) {
    fail(422, "INVALID_FILE", "รองรับเฉพาะไฟล์ .jpg .jpeg .png .webp เท่านั้น");
  }
  const dataUrlMatch = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i.exec(String((image && image.dataBase64) || ""));
  if (!dataUrlMatch) fail(422, "INVALID_FILE", "ข้อมูลรูปภาพไม่ถูกต้อง");
  const base64 = dataUrlMatch[2];
  if (base64.length > 7_000_000) fail(413, "FILE_TOO_LARGE", "ไฟล์รูปภาพใหญ่เกินไป (จำกัด ~5MB)");

  // path อยู่ใต้ assets/img/uploads/ — สอดคล้องกับ base path ของ GitHub Pages "/web-Uttaradit/" เดิม
  // (เป็น path สัมพัทธ์ในตัว repo เอง ไม่ผูกกับ domain ตรงกับที่หน้า public ใช้ผ่าน "../" อยู่แล้ว — ข้อ 12)
  const stamped = `${Date.now().toString(36)}-${filename}`;
  const path = `assets/img/uploads/${stamped}`;
  return { path, base64 };
}

export { prepareImageBlob, IMAGE_PLACEHOLDER };
