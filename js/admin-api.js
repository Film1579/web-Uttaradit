/* js/admin-api.js — เชื่อม pages/admin.html เข้ากับ Secure API (Cloudflare Worker) ใน api/worker.js
   ใช้เฉพาะหน้า Admin เท่านั้น ไม่โหลดในหน้า Public

   สำคัญ: ไฟล์นี้ "ไม่มี" GitHub Token หรือ Secret ใด ๆ ทั้งสิ้น — มีเพียง URL ปลายทางของ Worker
   ซึ่งเป็นค่าสาธารณะที่เปิดเผยได้ (ตัว Worker เองเป็นผู้ตรวจสิทธิ์ด้วย session token/รหัสผ่าน) */
window.AdminAPI = (function () {
  "use strict";

  // TODO: แก้เป็น URL จริงหลัง deploy Worker แล้ว (ดู README.md หัวข้อ "Deploy Secure API")
  const WORKER_URL = "https://uttaradit-admin-api.YOUR-SUBDOMAIN.workers.dev";

  const SESSION_KEY = "utt_admin_session"; // เก็บใน sessionStorage: token สำหรับ "การยืนยันตัวตน" เท่านั้น
  // หมายเหตุ: นี่ไม่ใช่การฝ่าฝืนข้อ 22 (ห้าม localStorage เป็นฐานข้อมูล) เพราะเก็บแค่ session token
  // ที่หมดอายุได้และไม่ใช่ "ข้อมูลเว็บไซต์" — ใช้ sessionStorage (ไม่ใช่ localStorage) จึงหายไปเมื่อปิดแท็บ

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.token || !s.expiresAt || Date.now() > s.expiresAt) return null;
      return s;
    } catch { return null; }
  }
  function setSession(token, expiresAt) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt })); } catch { /* ignore */ }
  }
  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }

  async function request(path, options = {}) {
    const session = getSession();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (session) headers["Authorization"] = "Bearer " + session.token;

    let res;
    try {
      res = await fetch(WORKER_URL + path, { ...options, headers });
    } catch (e) {
      const err = new Error(window.UTT_I18N.t("admin.err.network"));
      err.code = "NETWORK_ERROR";
      throw err;
    }
    let data = null;
    try { data = await res.json(); } catch { /* ไม่ใช่ JSON */ }
    if (!res.ok) {
      if (res.status === 401 || (data && data.code === "SESSION_EXPIRED")) clearSession();
      const err = new Error(window.UTT_I18N.serverMsg(data && data.message) || window.UTT_I18N.t("admin.err.request", { status: res.status }));   // ข้อความ error ของ Worker เป็นภาษาไทย → แปลตามภาษาปัจจุบัน
      err.code = (data && data.error) || "REQUEST_FAILED";
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    isLoggedIn: () => !!getSession(),
    logout: clearSession,

    async login(password) {
      const data = await request("/login", { method: "POST", body: JSON.stringify({ password }) });
      setSession(data.token, data.expiresAt);
      return true;
    },

    // { items, sha }
    getContent: type => request("/content/" + type, { method: "GET" }),

    // { body, sha } — body = { [id]: {html, tags, ...} } ทั้งไฟล์ data/{type}-body.json
    getBody: type => request("/body/" + type, { method: "GET" }),

    /**
     * บันทึก list + (ถ้ามี) body + (ถ้ามี) รูปภาพใหม่ ของรายการหนึ่งใน "คอมมิตเดียวกัน" จริง ๆ ฝั่ง Worker
     * (atomic — ไม่มี endpoint อัปโหลดรูปแยกต่างหากอีกต่อไป เพื่อไม่ให้เกิดรูป orphan ถ้าขั้นบันทึก JSON ล้มเหลว)
     * opts: {
     *   items, itemsSha, bodyId, bodyReplace, bodySha, deleteBody, message,
     *   image?: { filename, dataBase64 }   // ส่งเฉพาะตอนมีการเลือกไฟล์รูปใหม่จริง ๆ (ดู js/page-admin.js)
     * }
     * -> { ok, itemsSha, bodySha, imagePath?, commit }
     */
    saveContent: (type, opts) =>
      request("/content/" + type, { method: "PUT", body: JSON.stringify(opts) })
  };
})();
