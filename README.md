# เว็บไซต์จังหวัดอุตรดิตถ์ — README

เว็บไซต์แบบ Static (GitHub Pages) พร้อมระบบจัดการข้อมูล (Admin) ที่เขียนกลับเข้า **GitHub Repository จริง**
ไม่ใช่ localStorage — ข้อมูลที่ผู้ดูแลแก้ไขจะเห็นเหมือนกันทุกเครื่อง/เบราว์เซอร์

---

## 1. ระบบข้อมูลอยู่ที่ไหน

ข้อมูลจริงของเว็บไซต์ (ข่าว/ท่องเที่ยว/ของดีจังหวัด) อยู่ที่:

```
data/news.json          รายการข่าว (list)
data/news-body.json     เนื้อหาเต็มของแต่ละข่าว (สำหรับหน้า news-detail.html)
data/travel.json        รายการสถานที่ท่องเที่ยว
data/travel-body.json   เนื้อหาเต็มของแต่ละสถานที่
data/products.json      รายการของดีจังหวัด (GI/OTOP)
data/product-body.json  เนื้อหาเต็มของแต่ละสินค้า
```

หน้าเว็บ Public (`index.html`, `pages/news.html`, `pages/travel.html`, หน้ารายละเอียดต่าง ๆ) โหลดไฟล์เหล่านี้
ตอนเปิดหน้าเว็บผ่าน `js/data-loader.js` แล้วนำไปเขียนทับ `window.CONFIG`/`window.DATA` ที่ตั้งต้นมาจาก
`js/config.js`/`js/data.js` (ซึ่งตอนนี้ทำหน้าที่เป็น "ข้อมูลตั้งต้น/fallback" เท่านั้น ไม่ใช่แหล่งข้อมูลจริงอีกต่อไป)

**ไม่มีการใช้ localStorage เป็นฐานข้อมูลอีกต่อไป** — กลไก `syncAdminOverrides()` เดิมถูกลบออกจาก `js/config.js` แล้ว

## 2. Admin ทำงานอย่างไร

```
pages/admin.html + js/page-admin.js
        │  (Authorization: Bearer <session token>)
        ▼
Secure API — Cloudflare Worker (api/worker.js)
        │  (Authorization: token <GITHUB_TOKEN>, เก็บฝั่ง Server เท่านั้น)
        │  ใช้ Git Data API (blobs → tree → commit → update ref)
        ▼
GitHub Repository จริง
   data/news.json + data/news-body.json        ← แก้ "พร้อมกันในคอมมิตเดียว" เมื่อแก้ข่าวที่มีทั้ง list และเนื้อหาเต็ม
   data/travel.json + data/travel-body.json
   data/products.json + data/product-body.json
        │
        ▼
GitHub Pages build ใหม่อัตโนมัติ → ผู้ใช้ทุกคนเห็นข้อมูลใหม่ (ปกติภายใน ~1 นาที)
```

แต่ละการเพิ่ม/แก้ไข/ลบ คือการ **Commit จริง** ลง Repository (ข้อความ commit ขึ้นต้นด้วย `content:`)
Admin แก้ได้ทั้งฟิลด์ระดับรายการ (list: วันที่/หัวข้อ/หมวด ฯลฯ) และ **เนื้อหาเต็มของหน้ารายละเอียด**
(body: HTML เต็ม, คำบรรยายภาพ, แท็ก) **รวมถึงรูปภาพประกอบใหม่ (ถ้ามีการเลือกไฟล์)** ในฟอร์มเดียวกัน —
เมื่อกดบันทึก ไฟล์ที่เกี่ยวข้องทั้งหมด (list + body ถ้ามี + ไฟล์รูปภาพใหม่ถ้ามี) จะถูกประกอบเป็น
**คอมมิตเดียวจริง ๆ** ผ่าน Git Data API (ไม่ใช่ Contents API ซึ่งเขียนได้ทีละไฟล์) เพื่อไม่ให้เกิด
สถานะ "ข้อมูลครึ่งหนึ่งสำเร็จ" (เช่น list อัปเดตแล้วแต่ body ยังเก่า หรือรูปอัปโหลดสำเร็จแต่ JSON ที่อ้างอิง
ถึงรูปนั้นบันทึกไม่สำเร็จ กลายเป็นไฟล์รูปกำพร้าค้างใน repository)

**กลไกรูปภาพ (สรุปสั้น ๆ):** เนื่องจาก path จริงของรูปใหม่ (มี timestamp กำกับ) ถูกสร้างขึ้นฝั่ง Worker
เท่านั้น ฝั่ง Client (`js/page-admin.js`) จึงส่งค่า placeholder คงที่ (`@@PENDING_IMAGE@@`) แทนตำแหน่งที่
ต้องการใส่รูปในข้อมูล (เช่น `img` ของรายการ) พร้อมกับข้อมูลไฟล์รูป (`filename`, `dataBase64`) ไปในคำขอ
`PUT /content/:type` คำขอเดียว — Worker จะสร้าง blob ของรูป คำนวณ path จริง แทนที่ placeholder ด้วย path
นั้น แล้วใส่ทุกไฟล์ (list, body ถ้ามี, รูป) เข้า tree/commit เดียวกันผ่าน `ghAtomicCommit` ถ้าส่งรูปมาแต่ไม่มี
ข้อมูลใดอ้างอิงถึง placeholder เลย (เช่น bug ฝั่ง client) Worker จะปฏิเสธคำขอทันทีตั้งแต่ก่อนแตะเครือข่าย
GitHub เพื่อป้องกันไม่ให้มีไฟล์รูปที่ไม่ได้ใช้งานหลุดเข้า repository ถ้า Admin ไม่ได้เปลี่ยนรูป (ไม่ส่ง `image`
มาในคำขอ) จะไม่มีการสร้างไฟล์รูปใหม่เลย

มีการตรวจ `sha` ของ**ทุกไฟล์ที่เกี่ยวข้อง**ก่อนเขียนทับทุกครั้ง (ทั้ง list และ body — ไฟล์รูปใหม่ไม่ต้องตรวจ
เพราะเป็นไฟล์ใหม่เสมอ) และตรวจซ้ำอีกชั้นตอน อัปเดต branch ด้วย fast-forward-only update — ถ้ามีคนอื่นแก้ไป
แล้วไม่ว่าจุดไหน (รวมถึงตอนที่แนบรูปมาด้วย) ระบบจะแจ้งเตือนและโหลดข้อมูลล่าสุดให้อัตโนมัติ แทนการเขียนทับ
เงียบ ๆ และจะไม่มีการสร้างไฟล์ใด ๆ (รวมถึงรูป) เข้า repository เลยในกรณีนี้

## 3. Authentication ทำอย่างไร

ใช้รหัสผ่านผู้ดูแลเดียว (single admin password) ตรวจสอบฝั่ง Worker ด้วยการเทียบ SHA-256 hash
(`ADMIN_PASSWORD_HASH`) แล้วออก session token ที่เซ็นด้วย HMAC (`SESSION_SECRET`) อายุ 8 ชั่วโมง
เก็บไว้ใน `sessionStorage` ฝั่งเบราว์เซอร์ (หายเมื่อปิดแท็บ) — **GitHub Token ไม่เคยถูกส่งไปถึง Client เลย**

## 4. Environment Variables ที่ต้องตั้งค่า

ดูรายชื่อทั้งหมดใน [`.env.example`](./.env.example) (ไม่มีค่าจริง เป็นเอกสารอ้างอิงเท่านั้น)
ตั้งค่าจริงบน Cloudflare Worker เท่านั้น (ดูขั้นตอนหัวข้อ 5)

## 5. Deploy Secure API (Cloudflare Workers)

```bash
cd api
npm install -g wrangler   # ถ้ายังไม่มี
wrangler login

# ตั้ง secrets (จะถูกถามค่าแบบซ่อน ไม่หลุดลง git)
wrangler secret put GITHUB_TOKEN
wrangler secret put ADMIN_PASSWORD_HASH
wrangler secret put SESSION_SECRET

wrangler deploy
```

**วิธีสร้าง `GITHUB_TOKEN`:** GitHub → Settings → Developer settings → Fine-grained personal access tokens
→ New token → จำกัดสิทธิ์เฉพาะ repo `Film1579/web-Uttaradit` → Permissions: **Contents: Read and write**

**วิธีสร้าง `ADMIN_PASSWORD_HASH`:** คำนวณ SHA-256 (hex) ของรหัสผ่านที่ต้องการ เช่นบนเครื่อง macOS/Linux:

```bash
echo -n "รหัสผ่านที่ต้องการ" | shasum -a 256
```

นำค่า hex ที่ได้ไปใส่ตอน `wrangler secret put ADMIN_PASSWORD_HASH` (ห้ามใส่รหัสผ่านตัวจริงลงไฟล์ใด ๆ)

**วิธีสร้าง `SESSION_SECRET`:** สุ่มสตริงยาว ๆ เช่น `openssl rand -hex 32`

หลัง deploy สำเร็จ wrangler จะแสดง URL ของ Worker (เช่น `https://uttaradit-admin-api.<subdomain>.workers.dev`)
**ต้องนำ URL นี้ไปใส่ใน `js/admin-api.js` ตัวแปร `WORKER_URL`** แล้ว commit/push โค้ดฝั่งเว็บไซต์อีกครั้ง

ค่าที่ไม่ใช่ความลับ (`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ALLOWED_ORIGIN`) แก้ได้ตรงใน `api/wrangler.toml`

## 6. GitHub Repository ต้องตั้งค่าอะไร

- Settings → Pages → Deploy จาก branch `main` (หรือ branch ที่ใช้จริง) ตามเดิม
- Token ที่สร้างในข้อ 5 ต้องมีสิทธิ์เขียนเข้า repo นี้เท่านั้น (จำกัดสิทธิ์ให้แคบที่สุด)

## 7. วิธีเพิ่ม Admin

ระบบนี้ออกแบบให้มี "รหัสผ่านผู้ดูแลเดียว" ใช้ร่วมกัน (ไม่มีระบบ user รายบุคคล) หากต้องการเปลี่ยนรหัสผ่าน
หรือเพิกถอนสิทธิ์ผู้ดูแลคนเดิม: สร้าง hash ใหม่ (ข้อ 5) แล้ว `wrangler secret put ADMIN_PASSWORD_HASH` ทับของเดิม
แล้ว `wrangler deploy` อีกครั้ง — session เก่าที่เคย login ค้างไว้จะยังใช้ได้จนกว่าจะหมดอายุ (8 ชั่วโมง) เท่านั้น

## 8. วิธี Backup

ข้อมูลทุกเวอร์ชันอยู่ใน **Git history** ของ Repository อยู่แล้ว (ทุก commit จาก Admin ขึ้นต้นด้วย `content:`)
ดูประวัติได้ที่แท็บ Commits ของไฟล์ `data/news.json` เป็นต้น หรือดาวน์โหลดไฟล์ `data/*.json` เก็บไว้เพิ่มเติมได้ตลอดเวลา

## 9. วิธี Rollback

1. เปิดหน้า Commits ของไฟล์ที่ต้องการย้อน (เช่น `data/news.json`) บน GitHub
2. เลือก commit เวอร์ชันก่อนหน้าที่ต้องการ → กด "Revert" หรือคัดลอกเนื้อหากลับไปวางแล้ว commit ใหม่
3. GitHub Pages จะ build ใหม่อัตโนมัติ ผู้ใช้จะเห็นข้อมูลเวอร์ชันที่ย้อนกลับภายในไม่กี่นาที

(ไม่ต้องผ่านหน้า Admin ก็ทำได้ เพราะ Git history คือแหล่งประวัติที่แท้จริงอยู่แล้ว)

## 10. วิธี Deploy GitHub Pages

ไม่เปลี่ยนจากเดิม — Repository ตั้งค่า GitHub Pages ให้ deploy จาก branch ที่กำหนดอยู่แล้ว ทุกครั้งที่มีการ
commit ใหม่ (ไม่ว่าจะ push เองหรือ Admin บันทึกผ่าน API) GitHub Pages จะ build ใหม่ให้อัตโนมัติ

---

## สถาปัตยกรรมโดยสรุป

```
Admin (pages/admin.html)
   │ password login
   ▼
Cloudflare Worker (api/worker.js)  ← เก็บ GITHUB_TOKEN/ADMIN_PASSWORD_HASH/SESSION_SECRET เป็น secret เท่านั้น
   │ GitHub Contents API (อ่าน) + Git Data API (เขียนแบบ atomic — token ฝั่ง server)
   ▼
data/news.json, data/travel.json, data/products.json (ใน Repository จริง)
   │ GitHub Pages build อัตโนมัติ
   ▼
js/data-loader.js (ทุกหน้า Public) → เขียนทับ CONFIG/DATA → ผู้ใช้ทุกเครื่องเห็นข้อมูลเดียวกัน
```

## หมายเหตุสำคัญ

- `js/config.js`/`js/data.js` ยังมีอาร์เรย์ news/travel/products ฝังอยู่ — ใช้เป็น **ข้อมูลตั้งต้น/fallback**
  เท่านั้น (กรณี `data/*.json` โหลดไม่สำเร็จชั่วคราว) ไม่ใช่แหล่งข้อมูลจริงอีกต่อไป
- `sw.js` ถูกปรับให้ `data/*.json` ใช้กลยุทธ์ network-first เสมอ (ไม่ cache-first เหมือน asset ทั่วไป)
  เพื่อไม่ให้ผู้ใช้เห็นข้อมูลเก่าค้างหลัง Admin บันทึก
- Admin ต้องรอ GitHub Pages build เสร็จ (โดยทั่วไป < 1 นาที) ก่อนที่ผู้ใช้ทุกคนจะเห็นข้อมูลใหม่ — หน้า Admin
  จะแจ้งข้อความนี้ให้ทราบหลังบันทึกสำเร็จทุกครั้ง
- **ข้อจำกัดที่ทราบอยู่แล้ว (ตามข้อ 17 — แจ้งตรง ๆ แทนการแสร้งว่าไม่มีปัญหา):**
  - รหัสรายการใหม่ (`id`) คำนวณจากรายการล่าสุดที่ฝั่ง Admin โหลดไว้ (`nextId`) หาก Admin สองคนเปิดฟอร์ม
    "เพิ่มรายการใหม่" พร้อมกันเป๊ะ ๆ อาจได้ id ชนกัน — ระบบจะจับได้ตอนบันทึก (`DUPLICATE_ID` หรือ sha
    conflict) แต่ยังไม่ได้ทำระบบจอง id แบบ atomic ฝั่ง server (ไม่จำเป็นสำหรับระบบนี้ที่มี Admin คนเดียว
    เป็นจุดที่ปรับปรุงต่อได้ในอนาคตถ้าจะขยายเป็นหลาย Admin)
  - การแทนที่รูปเดิมด้วยรูปใหม่ (เช่นแก้ไขข่าวแล้วเปลี่ยนรูปประกอบ) ไฟล์รูปเดิมใน `assets/img/uploads/`
    จะยังคงอยู่ใน Git history (ไม่ถูกลบทิ้งอัตโนมัติ) เพราะแต่ละรูปมีชื่อไฟล์ไม่ซ้ำกัน (มี timestamp กำกับ)
    — ไม่กระทบความถูกต้องของเว็บไซต์ปัจจุบัน (ไม่มีใครอ้างอิงไฟล์เก่านั้นแล้ว) แต่จะสะสมพื้นที่เก็บข้อมูลใน
    repository ไปเรื่อย ๆ ตามจำนวนครั้งที่เปลี่ยนรูป — หากต้องการเก็บกวาด สามารถตรวจสอบได้จาก Git history
    ว่าไฟล์ไหนใน `assets/img/uploads/` ไม่มี `data/*.json` ไฟล์ใดอ้างอิงถึงอีกแล้ว แล้วลบออกเป็นระยะได้

## การทดสอบที่ทำจริงแล้ว vs ที่ยังต้องทดสอบเพิ่ม

Sandbox ที่ใช้พัฒนาโค้ดนี้ **ไม่มีเครือข่ายออกอินเทอร์เน็ต** จึงไม่สามารถเรียก GitHub API จริงหรือ deploy
Cloudflare Worker จริงเพื่อทดสอบ end-to-end ได้ — ต่อไปนี้คือขอบเขตที่ตรวจสอบจริงแล้ว และส่วนที่ต้อง
ทดสอบเพิ่มเติมหลัง deploy จริงตามข้อ 16:

**ทดสอบจริงแล้ว (อัตโนมัติ, ไม่ต้องมีเครือข่าย):**
- Syntax ของทุกไฟล์ `.js`/`.mjs` ผ่าน `node --check`
- ความถูกต้องของ JSON ที่ migrate มาจาก `config.js`/`data.js` (นับจำนวนรายการตรงกับต้นฉบับ: ข่าว 9,
  ท่องเที่ยว 5, สินค้า 7 — ไม่มีข้อมูลหาย)
- Logic การตรวจ schema ฝั่ง Worker (`validateItems`, `validateBodyPatch`) ด้วย unit test 17 กรณี
  (วันที่ผิดรูปแบบ, id ซ้ำ, หมวด/ประเภทนอก whitelist, path รูปภาพหลอก, ฟิลด์ body ที่ไม่รู้จัก ฯลฯ)
- **Integration test เต็ม flow** โดยจำลอง GitHub REST + Git Data API แบบ in-memory (`mock-github.mjs`)
  ครอบคลุม 53 เคส: login ผิด/ถูกรหัส, auth guard, session หมดอายุ, อ่าน list/body, บันทึก list+body
  พร้อมกันในคอมมิตเดียวจริง, sha conflict, race ตอน update ref ชนกันพอดี, ลบรายการแล้ว body หายไปด้วยแบบ
  atomic, validate schema ฝั่ง server — **และรูปภาพ + list/body ในคอมมิตเดียวจริง** โดยเฉพาะ:
  - create รายการใหม่พร้อมรูป → commit เดียว (ตรวจนับจำนวนเรียก `POST /git/commits`/`PATCH ref` = 1 ครั้ง)
  - update รายการเดิมแล้วเปลี่ยนรูป → commit เดียว, path รูปใน list ถูกแทนที่ถูกต้อง
  - update ทั้ง body และรูปพร้อมกัน → commit เดียว มีทั้ง list+body+รูปอยู่ใน tree เดียวกันจริง
  - update โดยไม่แตะรูป → ไม่มีการสร้าง blob รูปใหม่เลย (`POST /git/blobs` นับได้เท่าจำนวนไฟล์ JSON เท่านั้น)
  - ส่งรูปมาโดยไม่มีข้อมูลอ้างอิงถึง placeholder → ปฏิเสธคำขอ (`IMAGE_NOT_REFERENCED`) ก่อนแตะเครือข่าย
    GitHub เลย (ยืนยันว่าไม่มีทางเกิดรูปกำพร้าแม้จะมี bug ฝั่ง client)
  - นามสกุลไฟล์รูปไม่อยู่ใน whitelist → ปฏิเสธ
  - จำลอง GitHub ล่มตอนสร้าง commit object (`POST /git/commits` คืน 500) → Worker ตอบ error จริง
    (`502 GITHUB_ERROR`) ไม่ถือว่าบันทึกสำเร็จ และข้อมูลใน mock repo ไม่เปลี่ยนแปลงเลย
  - sha conflict ตอนแนบรูปมาด้วย → ปฏิเสธด้วย `409 CONFLICT` ก่อนสร้าง blob รูปใด ๆ (ยืนยันว่าไม่มีรูป
    กำพร้าแม้ในเคส conflict)

**ยังทดสอบไม่ได้ในสภาพแวดล้อมนี้ (ต้องทำหลัง deploy จริง):**
- Login → CRUD → เปิดจากเบราว์เซอร์/อุปกรณ์อื่นแล้วเห็นข้อมูลเดียวกันจริง (ต้องมี Worker ที่ deploy แล้ว
  และ GitHub repo จริงที่มี token สิทธิ์เขียน)
- พฤติกรรมจริงของ GitHub Pages build/deploy time หลังคอมมิต
- SHA conflict และพฤติกรรม error จริงของ GitHub API ตัวจริง (ทดสอบด้วย mock แล้วเท่านั้น — mock จำลอง
  พฤติกรรม Git Data API ตามเอกสารและ HTTP status code ที่ GitHub ใช้จริง แต่ edge case จริงบางอย่าง เช่น
  รูปแบบ error message หรือ rate limit อาจต่างจาก mock เล็กน้อย)
- การอัปโหลด/commit รูปภาพขนาดใหญ่จริงผ่านเครือข่ายจริง รวมถึงเวลาที่ใช้จริงเมื่อคอมมิตมีทั้ง JSON และ
  ไฟล์รูปภาพพร้อมกัน (ทดสอบเฉพาะ logic ตรวจนามสกุล/ขนาด/การประกอบ tree ด้วย mock แล้วเท่านั้น — **ไม่มี
  การอ้างว่าได้ทดสอบกับ GitHub API จริง เพราะ sandbox ที่ใช้พัฒนานี้ไม่มีเครือข่ายออกอินเทอร์เน็ต**)

แนะนำให้ทำตาม checklist ข้อ 16 บน Repository ทดสอบ (ไม่ใช่ของจริง) ก่อน แล้วค่อยย้ายมาใช้กับ
`Film1579/web-Uttaradit` จริง เพื่อความปลอดภัย


## รูปภาพสินค้า GI / OTOP (`data/products.json`)

- สินค้าทุกรายการมีรูปประจำรายการได้ผ่าน field เดียวคือ **`img`** (path ใต้ `assets/img/uploads/`) — โครงสร้างเดียวกับ News/Travel
  field `ic` (ไอคอน/อีโมจิ) เดิมถูกเลิกใช้ ค่าเดิมที่เป็น path รูปยังอ่านย้อนหลังได้ผ่าน `UTT_IMG.pick()` ใน `js/img-fallback.js`
- Admin: แท็บ “ของดีจังหวัด” → แก้ไข/เพิ่ม → ช่อง “รูปภาพสินค้า” (`products-imgFile` / `products-img` / `products-imgPreview`)
  เลือกไฟล์ → Preview ทันที → กด “บันทึก” → `AdminAPI.saveContent("products", …)` ส่งรูปพร้อม list/body ในคอมมิตเดียว
  (ใช้ `prepareImageBlob()` + placeholder เดิมของ Worker — ไม่มี endpoint ใหม่, Worker ไม่ต้องแก้)
  ไม่เลือกไฟล์ใหม่ = ไม่สร้างไฟล์รูปใหม่ / กด “ลบรูปภาพ” = ลบ key `img` ออกจากรายการ
- สินค้าชุดตั้งต้น 7 รายการใช้ `img` ชี้ไปที่ `assets/img/home-local/featured/local-0N-featured.jpg` (N = id สินค้า)
  ถ้ารายการไหนไม่มีรูป/รูปเสีย หน้าเว็บจะแสดงภาพตัวแทนจาก `img-fallback.js`
- `homeSq` / `homeFeatured` ยังเป็น asset เฉพาะ Showcase หน้าแรก แยกจากรูปโพสต์สินค้า (ไม่ถูกแก้)


## ระบบสองภาษา (ไทย ↔ English)

- **ปุ่ม TH | EN** อยู่แถบบนของทุกหน้า สร้างโดย `js/i18n.js` (ที่เดียว) — จำภาษาใน `localStorage` คีย์ `utt_language` (ค่าเริ่มต้น = ไทย) ไม่เปลี่ยน URL ใด ๆ
- **ไฟล์หลัก:** `js/i18n.js` (ตัวเปลี่ยนภาษา/API: `getLanguage`, `setLanguage`, `t`, `pick`, `apply`, `onChange`) และ `js/i18n-dict.js` (พจนานุกรม th/en) — ต้องโหลดใน `<head>` ก่อนสคริปต์อื่น
- **HTML แบบ static:** ใส่ `data-i18n="key"` (แทนเนื้อหา) หรือ `data-i18n-attr="aria-label:key"` (แทน attribute) — ข้อความไทยในไฟล์ HTML คือต้นฉบับ ส่วน English อยู่ใน `i18n-dict.js` (`en`)
- **ข้อความที่ JS สร้าง:** ใช้ `UTT_I18N.t("กลุ่ม.ชื่อ")` และลงทะเบียน `UTT_I18N.onChange(render)` เพื่อวาดใหม่เมื่อสลับภาษา
- **เนื้อหา (ข่าว/ท่องเที่ยว/GI-OTOP):** เพิ่มฟิลด์ `*_en` ข้างฟิลด์ไทยเดิม — รายการ: `title_en, ex_en, src_en` (ข่าว), `t_en, s_en, tag_en` (ท่องเที่ยว/สินค้า); เนื้อหาเต็ม (`data/*-body.json`): `html_en, caption_en, tags_en` — อ่านผ่าน `UTT_I18N.pick(item, "title")` ถ้าไม่มี `_en` จะถอยกลับเป็นไทยและแสดงข้อความแจ้งในหน้ารายละเอียด
- **Admin:** ฟอร์มมีช่อง "(English)" ทุกประเภท เว้นว่างได้; `api/worker.js` อนุญาตฟิลด์ `html_en/caption_en/tags_en` ใน body (ไม่เปลี่ยนการยืนยันตัวตนหรือ API อื่น)
- **เพิ่มข้อความใหม่:** เพิ่ม key ใน `js/i18n-dict.js` (`en` เสมอ, `th` ด้วยถ้าเรียกผ่าน `t()`)
- **Service Worker:** เปลี่ยนเป็น `utt-v10` และ precache ไฟล์ i18n แล้ว
- **ข้อจำกัด:** `manifest.webmanifest` เป็นไทยอย่างเดียว; ชื่อ/ตำแหน่ง/คำแปลเนื้อหาควรให้เจ้าหน้าที่จังหวัดตรวจก่อนเผยแพร่
