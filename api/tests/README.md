# api/tests/ — ชุดทดสอบ Worker แบบไม่ต้องมีเครือข่าย

ทดสอบ logic ของ `api/worker.js` โดยตรง (validate schema + full flow ผ่าน mock GitHub API)
โดยไม่ต้องมี Cloudflare account, GitHub token, หรือเครือข่ายอินเทอร์เน็ตใด ๆ

**ต้องใช้ Node.js 18 ขึ้นไป** (ใช้ `fetch`/`Request`/`Response`/`crypto.subtle` ที่มีในตัว ซึ่งพฤติกรรม
ใกล้เคียงกับ Cloudflare Workers runtime มากพอสำหรับทดสอบ logic แม้จะไม่ใช่ตัวเดียวกันเป๊ะ ๆ)

```bash
cd api/tests
node validate.test.mjs      # ทดสอบ validateItems/validateBodyPatch (20 เคส)
node integration.test.mjs   # ทดสอบ flow เต็ม: login/auth/atomic commit (list+body+รูปภาพ)/conflict/commit ล้มเหลว (53 เคส)
node products-image.test.mjs # ทดสอบ flow รูปสินค้า GI/OTOP: อัปโหลด/แทนที่/ไม่เปลี่ยนรูป/เคลียร์รูป/ลบ (18 เคส)
```

**สิ่งที่ทดสอบครอบคลุม:** login ผิด/ถูกรหัส, auth guard, session หมดอายุ, อ่าน list/body, บันทึก
list+body พร้อมกันในคอมมิตเดียวจริง (atomic), sha conflict, race ตอน update ref ชนกัน, ลบรายการแบบ
atomic (list+body หายพร้อมกัน), validate schema ฝั่ง server, **รูปภาพใหม่ + list/body ในคอมมิตเดียวจริง**
(create/update/update body ทั้งสามเคสพร้อมรูป, ไม่แตะรูปแล้วไม่สร้าง blob รูปใหม่, ปฏิเสธถ้าส่งรูปมาแต่ไม่มี
ที่อ้างอิง, ปฏิเสธนามสกุลไฟล์นอก whitelist, จำลอง GitHub ล่มตอนสร้าง commit แล้วตรวจว่า Worker ไม่ถือว่า
บันทึกสำเร็จ, sha conflict ตอนแนบรูปมาด้วย)

**สิ่งที่ทดสอบไม่ได้ที่นี่** (ต้องทำกับ Worker ที่ deploy จริง + GitHub repo จริง): พฤติกรรม edge case
จริงของ GitHub API, เวลา build จริงของ GitHub Pages, การใช้งานข้ามอุปกรณ์จริง — ดู README.md หัวข้อ
"การทดสอบที่ทำจริงแล้ว vs ที่ยังต้องทดสอบเพิ่ม" สำหรับรายละเอียดและ checklist ที่แนะนำให้ทำต่อ
