/* config.js — แหล่งข้อมูลกลาง เปลี่ยนเป็น fetch() API/CMS ได้ทันทีในอนาคต */
window.CONFIG = {
  site: { name: "จังหวัดอุตรดิตถ์", pageSize: 6, heroInterval: 6500 },
  preloader: { minDuration: 2600, maxDuration: 7000, sessionOnce: true, storageKey: "utt_intro_seen" },
  fog: { puffs: 26, speed: 0.16, blur: 90, tint: "rgba(190,225,220,0.055)" },

  hero: [
    { img:"assets/img/hero-1.jpg", alt:"อุทยานแห่งชาติภูสอยดาว" },
    { img:"assets/img/hero-2.jpg", alt:"เขื่อนสิริกิติ์ อำเภอท่าปลา" },
    { img:"assets/img/hero-3.jpg", alt:"วัดพระบรมธาตุทุ่งยั้ง" }
  ],

  /* ที่มา: www2.uttaradit.go.th/content/general — พื้นที่ 7,838 ตร.กม. (4,899,120 ไร่)
     อันดับ 11 ใน 17 จังหวัดภาคเหนือ อันดับ 25 ของประเทศ / 9 อำเภอ 67 ตำบล 613 หมู่บ้าน */
  stats: [
    { n:"7,838", label:"ตร.กม. พื้นที่จังหวัด" },
    { n:"9",     label:"อำเภอ" },
    { n:"67",    label:"ตำบล" },
    { n:"613",   label:"หมู่บ้าน" }
  ],

  facts: [
    { b:"ที่ตั้ง", s:"ภาคเหนือตอนล่าง ห่างจากกรุงเทพฯ ทางรถยนต์ 491 กม. ทางรถไฟ 485 กม." },
    { b:"ต้นไม้ประจำจังหวัด", s:"ต้นสัก (Tectona grandis)" },
    { b:"ดอกไม้ประจำจังหวัด", s:"ดอกประดู่" },
    { b:"ผลไม้ขึ้นชื่อ", s:"ลางสาด · ลองกอง · ทุเรียนหลงลับแล-หลินลับแล" },
    { b:"ของดีประจำถิ่น", s:"เหล็กน้ำพี้ · ผ้าซิ่นตีนจกลับแล · ผลิตภัณฑ์ไม้สัก" }
  ],

  /* บริการที่ยืนยันได้จริง ณ วันที่ตรวจสอบข้อมูล (9 ก.ย. 2569) — ไม่พบชุด "การ์ด e-Service"
     ทางการของจังหวัดที่ตรวจสอบซ้ำได้ จึงใช้ลิงก์ไปยังบริการ/หน้าที่ยืนยันได้จริงแทน
     (ที่มา: 01-index.txt) */
  services: [
    { ic:"assets/img/damrongtham.png", t:"ศูนย์ดำรงธรรมจังหวัด",     s:"รับเรื่องร้องเรียน/ร้องทุกข์ โทร. 1567", u:"pages/contact.html" },
    { ic:"assets/img/egp.png", t:"ระบบจัดซื้อจัดจ้างภาครัฐ (e-GP)", s:"ประกาศจัดซื้อจัดจ้างของหน่วยงานรัฐ — กรมบัญชีกลาง", u:"https://www.gprocurement.go.th" },
    { ic:"assets/img/guidebook.png", t:"คู่มือประชาชน",             s:"ขั้นตอน เอกสาร ระยะเวลาให้บริการ", u:"pages/contact.html" },
    { ic:"assets/img/download.png", t:"ดาวน์โหลดแบบฟอร์ม",        s:"แบบฟอร์มติดต่อราชการ", u:"pages/contact.html" },
    { ic:"assets/img/gov-info.png", t:"ข้อมูลข่าวสารราชการ",       s:"ตาม พ.ร.บ. ข้อมูลข่าวสารของราชการ", u:"pages/news.html" },
    { ic:"assets/img/briefcase.png", t:"สมัครงาน/สอบบรรจุ",         s:"ติดตามประกาศผ่านข่าวสารจังหวัด", u:"pages/news.html" }
  ],

  /* หมวดข่าวตามที่ปรากฏจริงในแหล่งข่าว ส.ปชส.อุตรดิตถ์ (uttaradit.prd.go.th) — ดู 03-news.txt
     "จัดซื้อจัดจ้าง" และ "รับสมัครงาน" ยังไม่มีประกาศจริงที่ตรวจสอบได้ในการค้นคว้าครั้งนี้
     (ต้องดึงจากระบบ e-GP/หน้าประกาศ ณ วันที่เว็บไซต์จริงเผยแพร่) จึงคงแท็บไว้แต่ยังไม่มีรายการ */
  newsCats: [
    { id:"all",      name:"ทั้งหมด" },
    { id:"featured", name:"ข่าวเด่น" },
    { id:"activity", name:"กิจกรรมจังหวัด" },
    { id:"econ",     name:"เศรษฐกิจ-เกษตร" },
    { id:"health",   name:"สาธารณสุข-เยาวชน" },
    { id:"security", name:"ความมั่นคง" },
    { id:"bid",       name:"ประกาศจัดซื้อจัดจ้าง" },
    { id:"job",       name:"ประกาศรับสมัครงาน" }
  ],

  /* ข่าวจริงจากสำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์ (uttaradit.prd.go.th) และ TOPNEWS
     เรียงจากล่าสุด ตรวจสอบ ณ 9 ก.ย. 2569 — ดูรายละเอียด/ลิงก์ต้นทางครบถ้วนใน 03-news.txt
     ห้ามคัดลอกเนื้อหาข่าวเต็มจากต้นทาง จึงใช้บทสรุปสั้นตามข้อเท็จจริงที่ระบุเท่านั้น */
  news: [
    { id:1, cat:"featured", date:"2026-09-09",
      title:"ผู้ว่าฯ อุตรดิตถ์ เปิดโครงการฟื้นฟูความชุ่มชื้นป่าไม้ ใช้ “ต้นกล้า–เชื้อเห็ดไมคอร์ไรซา” ดึงชุมชนร่วมสร้างป่าอย่างยั่งยืน",
      ex:"ผู้ว่าราชการจังหวัดเป็นประธานเปิดโครงการฟื้นฟูความชุ่มชื้นของป่าไม้โดยใช้ต้นกล้าผสมเชื้อเห็ดไมคอร์ไรซา เน้นการมีส่วนร่วมของชุมชน",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/540202",
      img:"assets/img/n1.jpg" },
    { id:2, cat:"featured", date:"2026-09-07",
      title:"ผู้ว่าฯ อุตรดิตถ์ เปิดโครงการพัฒนาศักยภาพและส่งเสริมการเรียนรู้ผู้สูงอายุ มุ่งสร้างผู้สูงวัยคุณภาพ มีทักษะ พร้อมเป็นพลังสำคัญของชุมชน",
      ex:"โครงการพัฒนาศักยภาพผู้สูงอายุในจังหวัด มุ่งเน้นทักษะและการเป็นพลังของชุมชน",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/539442",
      img:"assets/img/n2.jpg" },
    { id:9, cat:"activity", date:"2026-09-03",
      title:"อุตรดิตถ์จัด “ตลาดนัดคุณธรรม” ปี 69 มอบเกียรติบัตรเชิดชูคนดีศรีจังหวัด",
      ex:"สำนักงานวัฒนธรรมจังหวัดจัดงานตลาดนัดคุณธรรมและยกย่องเชิดชูเกียรติคนดีศรีจังหวัด ประจำปีงบประมาณ พ.ศ. 2569 ณ ศาลาประชาคมจังหวัด โดยนายสันติ รังษิรุจิ ผู้ว่าราชการจังหวัด เป็นประธานในพิธีเปิด",
      src:"TOPNEWS", srcUrl:"https://www.topnews.co.th/news/1681768",
      img:"assets/img/n3.jpg" },
    { id:3, cat:"econ", date:"2026-09-01",
      title:"อุตรดิตถ์ เปิดเวที “ข้อมูลนำทาง สู่การพัฒนาเกษตรอุตรดิตถ์” สรุปผลงานปี 2569 วางแนวทางขับเคลื่อนภาคเกษตรปี 2570",
      ex:"เวทีสรุปผลงานภาคเกษตรของจังหวัดประจำปี 2569 พร้อมวางแนวทางขับเคลื่อนภาคเกษตรในปีถัดไป",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/537572",
      img:"assets/img/n4.jpg" },
    { id:4, cat:"health", date:"2026-08-26",
      title:"ผู้ว่าฯ อุตรดิตถ์ เปิดประชุมเชิงปฏิบัติการพัฒนาและขยายเครือข่าย TO BE NUMBER ONE มุ่งสู่ความยั่งยืน",
      ex:"กิจกรรมพัฒนาและขยายเครือข่าย TO BE NUMBER ONE ของจังหวัด ด้านสาธารณสุขและเยาวชน",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/535758",
      img:"assets/img/n5.jpg" },
    { id:5, cat:"security", date:"2026-08-17",
      title:"จังหวัดอุตรดิตถ์จัดฝึกอบรมวิทยากรลูกเสือชาวบ้าน หลักสูตรทบทวน ประจำปี 2569 เสริมศักยภาพเครือข่ายประชาชน",
      ex:"การฝึกอบรมวิทยากรลูกเสือชาวบ้านหลักสูตรทบทวน เพื่อเสริมศักยภาพเครือข่ายด้านความมั่นคงของจังหวัด",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/532227",
      img:"assets/img/n6.jpg" },
    { id:6, cat:"activity", date:"2026-08-11",
      title:"อุตรดิตถ์รวมพลังจิตอาสา ทำความดีเพื่อแผ่นดิน เนื่องในโอกาสวันคล้ายวันพระราชสมภพฯ และวันแม่แห่งชาติ",
      ex:"กิจกรรมจิตอาสาของจังหวัด เนื่องในโอกาสวันคล้ายวันพระราชสมภพฯ และวันแม่แห่งชาติ",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/530639",
      img:"assets/img/n7.jpg" },
    { id:7, cat:"activity", date:"2026-08-10",
      title:"อุตรดิตถ์จัดงาน “วันกำนัน ผู้ใหญ่บ้าน” ประจำปี 2569 เชิดชูผู้ทำหน้าที่ “บำบัดทุกข์ บำรุงสุข” เคียงข้างประชาชน",
      ex:"งานวันกำนัน ผู้ใหญ่บ้าน ประจำปี 2569 ของจังหวัดอุตรดิตถ์",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/530271",
      img:"assets/img/n8.jpg" },
    { id:8, cat:"econ", date:"2026-08-06",
      title:"จังหวัดอุตรดิตถ์ประชุมคณะกรรมการ กจร. คุมเข้มมาตรการควบคุมการเคลื่อนย้ายต้นพันธุ์มันสำปะหลัง หวังยับยั้งการแพร่ระบาดโรคใบด่าง",
      ex:"การประชุมคณะกรรมการ กจร. เพื่อคุมเข้มมาตรการควบคุมการเคลื่อนย้ายต้นพันธุ์มันสำปะหลัง ป้องกันโรคใบด่าง",
      src:"สำนักงานประชาสัมพันธ์จังหวัดอุตรดิตถ์", srcUrl:"https://uttaradit.prd.go.th/th/content/category/detail/id/33/iid/529011",
      img:"assets/img/n9.jpg" }
  ],

  /* แหล่งท่องเที่ยวที่ตรวจสอบรายละเอียดได้จริง — ดู 05-travel.txt (เวลาเปิด-ปิด/ค่าเข้าชม
     ยังไม่มีตัวเลขยืนยันแน่ชัดสำหรับทุกแห่ง จึงไม่แสดงบนหน้าเว็บจนกว่าจะยืนยันกับหน่วยงานเจ้าของพื้นที่) */
  travel: [
    { id:1, t:"เขื่อนสิริกิติ์", s:"เขื่อนดินที่ใหญ่ที่สุดในประเทศไทย ต.ผาเลือด อ.ท่าปลา วิวอ่างเก็บน้ำรายล้อมภูเขา", tag:"ธรรมชาติ", img:"assets/img/t1.jpg" },
    { id:2, t:"วัดพระแท่นศิลาอาสน์ (พระอารามหลวง)", s:"ต.ทุ่งยั้ง อ.ลับแล — พระแท่นศิลาแลง ที่มาของตราประจำจังหวัด", tag:"ศาสนสถาน", img:"assets/img/t2.jpg" },
    { id:3, t:"อุทยานแห่งชาติภูสอยดาว", s:"อ.น้ำปาด — ทุ่งดอกหงอนนาคและลานสนสามใบ นิยมเดินป่าช่วง ส.ค.–ก.ย.", tag:"ธรรมชาติ", img:"assets/img/t3.jpg" },
    { id:4, t:"อุทยานแห่งชาติต้นสักใหญ่", s:"ต.น้ำไคร้ อ.น้ำปาด — ต้นสักขนาดใหญ่ที่สุดในประเทศไทย", tag:"ธรรมชาติ", img:"assets/img/t4.jpg" },
    { id:5, t:"อนุสาวรีย์พระยาพิชัยดาบหัก", s:"บริเวณศาลากลางจังหวัด ต.ท่าอิฐ อ.เมืองอุตรดิตถ์", tag:"ประวัติศาสตร์", img:"assets/img/t5.jpg" }
  ],

  /* ---------- สินค้า GI (สิ่งบ่งชี้ทางภูมิศาสตร์) และ OTOP ของจังหวัดอุตรดิตถ์ ----------
     แยกสองกลุ่มชัดเจนด้วย field "type": "gi" | "otop"
     กลุ่ม "gi" คือสินค้าที่ประกาศขึ้นทะเบียนสิ่งบ่งชี้ทางภูมิศาสตร์จริงโดยกรมทรัพย์สินทางปัญญา
     (ตรวจสอบแล้วว่าจังหวัดอุตรดิตถ์มีสินค้า GI ที่ขึ้นทะเบียนแล้ว 3 รายการเท่านั้น ณ วันที่ตรวจสอบข้อมูล
     คือ ทุเรียนหลงลับแลอุตรดิตถ์, ทุเรียนหลินลับแลอุตรดิตถ์ และสับปะรดห้วยมุ่น — ที่มา: กรมทรัพย์สินทางปัญญา/
     สำนักงานเกษตรจังหวัดอุตรดิตถ์ ดูรายละเอียดและเลขทะเบียนใน DATA.productBody)
     กลุ่ม "otop" คือของดี/สินค้าเด่นประจำถิ่นทั่วไปที่ยังไม่พบประกาศขึ้นทะเบียน GI จึงห้ามระบุว่าเป็นสินค้า GI

     รูปภาพสินค้า: ใช้ field "img" (path ใต้ assets/img/uploads/ ที่ Worker สร้างให้ตอน Admin อัปโหลด) — เหมือน news/travel
     สินค้าชุดตั้งต้นใช้รูป assets/img/home-local/featured/local-0N-featured.jpg (ไฟล์เดียวกับภาพหลักของ Showcase) — Admin อัปโหลดรูปใหม่ทับได้ทุกเมื่อ
     รายการที่ไม่มีรูป/รูปเสียจะใช้ภาพตัวแทนจาก img-fallback.js — field "ic" แบบเก่าไม่ถูกใช้แล้ว (อ่านย้อนหลังผ่าน UTT_IMG.pick เท่านั้น)
     homeSq / homeFeatured เป็น asset เฉพาะ Showcase หน้าแรก แยกจากรูปโพสต์สินค้า */
  products: [
    { id:1, type:"gi",   t:"ทุเรียนหลงลับแลอุตรดิตถ์", tag:"สินค้า GI", img:"assets/img/home-local/featured/local-01-featured.jpg",
      s:"ทุเรียนพันธุ์พื้นเมืองอำเภอลับแล ผลเล็ก เนื้อแห้งละเอียด รสหวานมัน ขึ้นทะเบียน GI ตั้งแต่ปี 2561",
      homeSq:"assets/img/home-local/square/local-01-square.png", homeFeatured:"assets/img/home-local/featured/local-01-featured.jpg" },
    { id:2, type:"gi",   t:"ทุเรียนหลินลับแลอุตรดิตถ์", tag:"สินค้า GI", img:"assets/img/home-local/featured/local-02-featured.jpg",
      s:"ทุเรียนพันธุ์พื้นเมืองอำเภอลับแลอีกสายพันธุ์ ผลทรงกระบอก เนื้อเหนียวแห้ง ขึ้นทะเบียน GI ตั้งแต่ปี 2561",
      homeSq:"assets/img/home-local/square/local-02-square.png", homeFeatured:"assets/img/home-local/featured/local-02-featured.jpg" },
    { id:3, type:"gi",   t:"สับปะรดห้วยมุ่น", tag:"สินค้า GI", img:"assets/img/home-local/featured/local-03-featured.jpg",
      s:"สับปะรดพันธุ์ปัตตาเวียจากอำเภอน้ำปาด เนื้อสีเหลืองน้ำผึ้ง หวานฉ่ำ ขึ้นทะเบียน GI ตั้งแต่ปี 2556",
      homeSq:"assets/img/home-local/square/local-03-square.png", homeFeatured:"assets/img/home-local/featured/local-03-featured.jpg" },
    { id:4, type:"otop", t:"เหล็กน้ำพี้", tag:"สินค้า OTOP", img:"assets/img/home-local/featured/local-04-featured.jpg",
      s:"แร่เหล็กศักดิ์สิทธิ์ ต้นกำเนิดดาบพระยาพิชัย",
      homeSq:"assets/img/home-local/square/local-04-square.png", homeFeatured:"assets/img/home-local/featured/local-04-featured.jpg" },
    { id:5, type:"otop", t:"ลางสาด–ลองกอง", tag:"สินค้า OTOP", img:"assets/img/home-local/featured/local-05-featured.jpg",
      s:"ผลไม้ประจำถิ่นรสหวานฉ่ำ",
      homeSq:"assets/img/home-local/square/local-05-square.png", homeFeatured:"assets/img/home-local/featured/local-05-featured.jpg" },
    { id:6, type:"otop", t:"ผ้าซิ่นตีนจกลับแล", tag:"สินค้า OTOP", img:"assets/img/home-local/featured/local-06-featured.jpg",
      s:"ภูมิปัญญาทอมือลวดลายโบราณ",
      homeSq:"assets/img/home-local/square/local-06-square.png", homeFeatured:"assets/img/home-local/featured/local-06-featured.jpg" },
    { id:7, type:"otop", t:"ผลิตภัณฑ์ไม้สัก", tag:"สินค้า OTOP", img:"assets/img/home-local/featured/local-07-featured.jpg",
      s:"งานแกะสลักจากถิ่นสักใหญ่ของโลก",
      homeSq:"assets/img/home-local/square/local-07-square.png", homeFeatured:"assets/img/home-local/featured/local-07-featured.jpg" }
  ],

  ita: [
    { code:"O1",  t:"โครงสร้างหน่วยงาน" },       { code:"O2",  t:"ข้อมูลผู้บริหาร" },
    { code:"O5",  t:"ข้อมูลการติดต่อ" },          { code:"O9",  t:"Social Network" },
    { code:"O10", t:"แผนดำเนินงานประจำปี" },      { code:"O14", t:"คู่มือหรือมาตรฐานการให้บริการ" },
    { code:"O18", t:"แผนการใช้จ่ายงบประมาณ" },    { code:"O21", t:"แผนการจัดซื้อจัดจ้าง" },
    { code:"O27", t:"แนวปฏิบัติการจัดการเรื่องร้องเรียนการทุจริต" },
    { code:"O31", t:"การประเมินความเสี่ยงการทุจริต" },
    { code:"O34", t:"เจตจำนงสุจริตของผู้บริหาร" },
    { code:"O43", t:"มาตรการส่งเสริมคุณธรรมและความโปร่งใส" }
  ],

  /* หน่วยงานในจังหวัด — ทุกรายการใช้ URL จริงของเว็บไซต์ทางการหน่วยงานนั้น ๆ เท่านั้น (ห้ามเดา domain)
     ทุก URL ผ่านการตรวจสอบด้วยการค้นหา/เปิดดูเนื้อหาจริงบนเว็บไซต์ปลายทาง ณ วันที่แก้ไขไฟล์นี้
     เก็บ "src" ไว้เป็นหลักฐานอ้างอิงว่าตรวจพบ/ยืนยัน URL จากที่ใด เพื่อให้ตรวจสอบย้อนหลังได้
     ทุกรายการเป็นลิงก์ภายนอก (external) — main.js จะใส่ target="_blank" rel="noopener noreferrer" ให้อัตโนมัติ

     หมายเหตุกรณี "ที่ทำการปกครองจังหวัด" และ 9 อำเภอ: ค้นหาแล้วไม่พบเว็บไซต์ทางการแยกเฉพาะของหน่วยงาน/
     ที่ว่าการอำเภอเหล่านี้ (หน่วยงานเหล่านี้เผยแพร่ข่าว/ประกาศผ่านเว็บไซต์กลางของจังหวัดเท่านั้น เช่น
     ประกาศรับสมัครงานของที่ทำการปกครองจังหวัดปรากฏอยู่ที่ www2.uttaradit.go.th/news/detail/559)
     จึงใช้หน้าเว็บไซต์ทางการของจังหวัดที่เกี่ยวกับอำเภอนั้นแทนตามเงื่อนไขที่กำหนด:
     - ที่ทำการปกครองจังหวัด → หน้าแรกเว็บไซต์จังหวัด (หน่วยงานเดียวกับศาลากลาง ไม่มีเว็บไซต์แยก)
     - 9 อำเภอ → หน้า "แผนที่ภาพรวมของแต่ละอำเภอ" ของเว็บไซต์จังหวัด (www2.uttaradit.go.th/amphur_map)
       ซึ่งเป็นหน้าข้อมูลอำเภอจริงบนเว็บไซต์ทางการของจังหวัด ไม่ใช่การเดา URL */
  agencies: [
    { t:"ที่ทำการปกครองจังหวัด", u:"https://www2.uttaradit.go.th",
      src:"ไม่พบเว็บไซต์แยกเฉพาะ — ประกาศของหน่วยงานเผยแพร่ผ่าน www2.uttaradit.go.th/news/detail/559 จึงใช้เว็บไซต์จังหวัด" },
    { t:"สำนักงานจังหวัด", u:"https://www2.uttaradit.go.th",
      src:"ยืนยันจากเนื้อหาหน้าแรกจริง (ผู้ว่าราชการจังหวัด/วิสัยทัศน์จังหวัด) ที่ www2.uttaradit.go.th/frontpage" },
    { t:"สำนักงานคลังจังหวัด", u:"https://www.cgd.go.th/cs/utt/utt/ติดต่อสำนักงานคลัง.html",
      src:"หน้าเว็บไซต์คลังจังหวัดอุตรดิตถ์ สังกัดกรมบัญชีกลาง (cgd.go.th) ระบุที่อยู่/เบอร์โทรตรงกับสำนักงานคลังจังหวัดอุตรดิตถ์" },
    { t:"สำนักงานพาณิชย์จังหวัด", u:"https://uttaradit.moc.go.th",
      src:"เว็บไซต์สังกัดกระทรวงพาณิชย์ ระบุชื่อ-ที่อยู่สำนักงานพาณิชย์จังหวัดอุตรดิตถ์ตรงกัน" },
    { t:"สำนักงานเกษตรจังหวัด", u:"https://uttaradit.doae.go.th",
      src:"เว็บไซต์สังกัดกรมส่งเสริมการเกษตร ระบุชื่อสำนักงานเกษตรจังหวัดอุตรดิตถ์และข่าวกิจกรรมของเกษตรจังหวัดตรงกัน" },
    { t:"สำนักงานสาธารณสุขจังหวัด", u:"http://uto.moph.go.th",
      src:"อ้างอิงตนเองในระบบ UTO E-Slip ของหน่วยงานว่าเป็นเว็บไซต์ของสำนักงานสาธารณสุขจังหวัดอุตรดิตถ์ (moph.go.th)" },
    { t:"สำนักงานท้องถิ่นจังหวัด", u:"http://www.uttaraditlocal.go.th",
      src:"เว็บไซต์ สถ.จ.อุตรดิตถ์ (สำนักงานส่งเสริมการปกครองท้องถิ่นจังหวัด) ระบุที่อยู่ชั้น 3 ศาลากลางจังหวัด อีเมล utt@dla.go.th" },
    { t:"สำนักงานประชาสัมพันธ์จังหวัด", u:"https://uttaradit.prd.go.th",
      src:"ใช้เป็นแหล่งข่าวต้นทางใน CONFIG.news อยู่แล้ว เป็นเว็บไซต์กรมประชาสัมพันธ์ประจำจังหวัดอุตรดิตถ์" },
    { t:"องค์การบริหารส่วนจังหวัดอุตรดิตถ์", u:"https://www.uttaradit-pao.go.th",
      src:"เว็บไซต์ทางการของ อบจ.อุตรดิตถ์ ระบุชื่อหน่วยงาน นายก อบจ. และข่าวกิจกรรมสภา อบจ. ตรงกัน" },
    { t:"เทศบาลเมืองอุตรดิตถ์", u:"https://www.uttaraditcity.go.th",
      src:"เว็บไซต์ทางการของเทศบาลเมืองอุตรดิตถ์ (uttaraditcity.go.th)" },
    { t:"อำเภอเมืองอุตรดิตถ์", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอลับแล", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอตรอน", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอพิชัย", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอท่าปลา", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอน้ำปาด", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอฟากท่า", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอบ้านโคก", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" },
    { t:"อำเภอทองแสนขัน", u:"https://www2.uttaradit.go.th/amphur_map", src:"ไม่พบเว็บไซต์ที่ว่าการอำเภอแยกเฉพาะ — ใช้หน้าข้อมูลอำเภอบนเว็บไซต์จังหวัด" }
  ]
};

/* ===========================================================
   ข้อมูลกลางจริงของเว็บไซต์ (แทนที่กลไก localStorage เดิม)
   -----------------------------------------------------------
   หน้าแอดมิน (pages/admin.html) บันทึกการเพิ่ม/แก้ไข/ลบ "ข่าวสารประจำจังหวัด", "ข้อมูลท่องเที่ยว"
   และ "ของดีจังหวัด" ลงแหล่งข้อมูลกลางจริง (GitHub Repository) ผ่าน Secure API แล้ว ไม่ใช่ localStorage
   ก่อนหน้านี้ไฟล์นี้เคยมีฟังก์ชัน syncAdminOverrides() ที่อ่าน localStorage
   (utt_admin_news / utt_admin_travel / utt_admin_products) มาสวมทับค่าด้านบน — กลไกนี้ถูก
   ยกเลิกทั้งหมดแล้ว เพราะทำให้ข้อมูลที่ Admin แก้ไขเห็นได้เฉพาะเบราว์เซอร์/เครื่องเดียวกัน

   ตอนนี้ news / travel / products ด้านบนใน CONFIG ทำหน้าที่เป็น "ข้อมูลตั้งต้น" (seed/fallback)
   เท่านั้น ข้อมูลจริงที่ผู้ใช้ทุกคนเห็นจะถูกโหลดทับจาก data/news.json, data/travel.json,
   data/products.json (แหล่งข้อมูลกลางใน Repository) โดย js/data-loader.js ซึ่งต้องถูกโหลด
   ต่อจากไฟล์นี้ในทุกหน้า — ดู data-loader.js สำหรับรายละเอียดการโหลดและ fallback */


/* ===========================================================
   i18n overlay — ฟิลด์ภาษาอังกฤษ (*_en) สำหรับข้อมูลตั้งต้น/fallback ที่ฝังมากับไฟล์นี้
   (ข้อมูลจริงจาก data/*.json มีฟิลด์ *_en ครบอยู่แล้ว) — ภาษาไทยเดิมไม่ถูกแตะต้อง
   อ่านผ่าน UTT_I18N.pick(item, "field") ซึ่งจะ fallback กลับเป็นภาษาไทยถ้าไม่มี *_en
   =========================================================== */
(function (C) {
  "use strict";
  var EN = {
 "hero": [
  "Phu Soi Dao National Park",
  "Sirikit Dam, Tha Pla District",
  "Wat Phra Borommathat Thung Yang"
 ],
 "stats": [
  "sq. km province area",
  "Districts",
  "Subdistricts",
  "Villages"
 ],
 "facts": [
  [
   "Location",
   "Lower northern Thailand, 491 km from Bangkok by road and 485 km by rail"
  ],
  [
   "Provincial Tree",
   "Teak (Tectona grandis)"
  ],
  [
   "Provincial Flower",
   "Padauk (Pterocarpus) flower"
  ],
  [
   "Renowned Fruits",
   "Langsat · Longkong · Long and Lin Lap Lae durians"
  ],
  [
   "Local Specialties",
   "Namphi iron · Lap Lae tin chok skirt · teak products"
  ]
 ],
 "services": [
  [
   "Provincial Damrongdhama Center",
   "Receives complaints and grievances. Tel. 1567"
  ],
  [
   "Government Procurement System (e-GP)",
   "Government procurement announcements — Comptroller General's Department"
  ],
  [
   "Citizen's Handbook",
   "Procedures, documents, and service timeframes"
  ],
  [
   "Download Forms",
   "Forms for dealing with government agencies"
  ],
  [
   "Official Information",
   "Under the Official Information Act"
  ],
  [
   "Jobs & Civil Service Exams",
   "Follow announcements via provincial news"
  ]
 ],
 "newsCats": {
  "all": "All",
  "featured": "Featured News",
  "activity": "Provincial Activities",
  "econ": "Economy & Agriculture",
  "health": "Public Health & Youth",
  "security": "Security",
  "bid": "Procurement Announcements",
  "job": "Job Announcements"
 },
 "ita": {
  "O1": "Organizational structure",
  "O2": "Executive information",
  "O5": "Contact information",
  "O9": "Social networks",
  "O10": "Annual operational plan",
  "O14": "Service manual or standard",
  "O18": "Budget expenditure plan",
  "O21": "Procurement plan",
  "O27": "Guidelines for handling corruption complaints",
  "O31": "Corruption risk assessment",
  "O34": "Executive integrity pledge",
  "O43": "Measures promoting integrity and transparency"
 },
 "agencies": {
  "ที่ทำการปกครองจังหวัด": "Provincial Administration Office",
  "สำนักงานจังหวัด": "Provincial Office",
  "สำนักงานคลังจังหวัด": "Provincial Treasury Office",
  "สำนักงานพาณิชย์จังหวัด": "Provincial Commerce Office",
  "สำนักงานเกษตรจังหวัด": "Provincial Agriculture Office",
  "สำนักงานสาธารณสุขจังหวัด": "Provincial Public Health Office",
  "สำนักงานท้องถิ่นจังหวัด": "Provincial Local Administration Office",
  "สำนักงานประชาสัมพันธ์จังหวัด": "Provincial Public Relations Office",
  "องค์การบริหารส่วนจังหวัดอุตรดิตถ์": "Uttaradit Provincial Administrative Organization",
  "เทศบาลเมืองอุตรดิตถ์": "Uttaradit City Municipality",
  "อำเภอเมืองอุตรดิตถ์": "Mueang Uttaradit District",
  "อำเภอลับแล": "Lap Lae District",
  "อำเภอตรอน": "Tron District",
  "อำเภอพิชัย": "Phichai District",
  "อำเภอท่าปลา": "Tha Pla District",
  "อำเภอน้ำปาด": "Nam Pat District",
  "อำเภอฟากท่า": "Fak Tha District",
  "อำเภอบ้านโคก": "Ban Khok District",
  "อำเภอทองแสนขัน": "Thong Saen Khan District"
 },
 "news": {
  "1": {
   "title_en": "Uttaradit Governor Launches Forest Moisture Restoration Project Using Seedlings and Mycorrhizal Fungi, Engaging Communities in Sustainable Forest Building",
   "ex_en": "The provincial governor presided over the launch of a project to restore forest moisture using tree seedlings inoculated with mycorrhizal fungi, with an emphasis on community participation.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  },
  "2": {
   "title_en": "Uttaradit Governor Opens Project to Develop Older Persons' Potential and Promote Learning, Aiming for Skilled, Quality Seniors Who Are a Vital Force for Their Communities",
   "ex_en": "A project to develop the potential of older persons in the province, focusing on skills and their role as a driving force in the community.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  },
  "9": {
   "title_en": "Uttaradit Holds 2026 “Moral Market Fair” and Presents Certificates Honoring Good People of the Province",
   "ex_en": "The Provincial Cultural Office held the Moral Market Fair and honored the “Good People of the Province” for fiscal year B.E. 2569 (2026) at the Provincial Community Hall, with Governor Mr. Santi Rangsiruji presiding at the opening ceremony.",
   "src_en": "TOPNEWS"
  },
  "3": {
   "title_en": "Uttaradit Opens “Data-Driven Agriculture” Forum, Summarizing 2026 Results and Setting Direction for Agriculture in 2027",
   "ex_en": "A forum summarizing the province's 2026 agricultural achievements and setting directions for driving the agricultural sector next year.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  },
  "4": {
   "title_en": "Uttaradit Governor Opens Workshop to Develop and Expand the TO BE NUMBER ONE Network Toward Sustainability",
   "ex_en": "Activities to develop and expand the province's TO BE NUMBER ONE network in public health and youth.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  },
  "5": {
   "title_en": "Uttaradit Trains Village Scout Instructors in 2026 Refresher Course to Strengthen Public Networks",
   "ex_en": "Refresher training for Village Scout instructors to strengthen the province's public security network.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  },
  "6": {
   "title_en": "Uttaradit Unites for Volunteer Spirit — Doing Good for the Nation on the Royal Birthday Anniversary and National Mother's Day",
   "ex_en": "Provincial volunteer activities held on the royal birthday anniversary and National Mother's Day.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  },
  "7": {
   "title_en": "Uttaradit Holds 2026 “Kamnan and Village Headmen Day,” Honoring Those Who “Relieve Suffering and Nurture Happiness” Alongside the People",
   "ex_en": "The 2026 Kamnan and Village Headmen Day event in Uttaradit Province.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  },
  "8": {
   "title_en": "Uttaradit Holds Committee Meeting to Tighten Measures on Movement of Cassava Planting Stock to Curb Mosaic Disease Outbreak",
   "ex_en": "A meeting of the provincial working committee to tighten controls on the movement of cassava planting stock and prevent cassava mosaic disease.",
   "src_en": "Uttaradit Provincial Public Relations Office"
  }
 },
 "travel": {
  "1": {
   "t_en": "Sirikit Dam",
   "s_en": "The largest earth-fill dam in Thailand, in Pha Lueat Subdistrict, Tha Pla District — a reservoir with views ringed by mountains",
   "tag_en": "Nature"
  },
  "2": {
   "t_en": "Wat Phra Thaen Sila At (Royal Monastery)",
   "s_en": "Thung Yang Subdistrict, Lap Lae District — the laterite Phra Thaen (sacred stone seat) that inspired the provincial seal",
   "tag_en": "Religious Site"
  },
  "3": {
   "t_en": "Phu Soi Dao National Park",
   "s_en": "Nam Pat District — Hong Nak flower fields and three-needle pine meadows; popular for trekking from August to September",
   "tag_en": "Nature"
  },
  "4": {
   "t_en": "Ton Sak Yai (Giant Teak) National Park",
   "s_en": "Nam Khrai Subdistrict, Nam Pat District — the largest teak tree in Thailand",
   "tag_en": "Nature"
  },
  "5": {
   "t_en": "Phraya Phichai Dap Hak Monument",
   "s_en": "Located at the Provincial Hall, Tha It Subdistrict, Mueang Uttaradit District",
   "tag_en": "History"
  }
 },
 "products": {
  "1": {
   "t_en": "Long Lap Lae Durian of Uttaradit",
   "tag_en": "GI Product",
   "s_en": "A native durian variety of Lap Lae District: small fruit, fine dry flesh, rich sweet flavor. Registered as a GI in B.E. 2561 (2018)."
  },
  "2": {
   "t_en": "Lin Lap Lae Durian of Uttaradit",
   "tag_en": "GI Product",
   "s_en": "Another native Lap Lae durian variety: cylindrical fruit with firm, dry flesh. Registered as a GI in B.E. 2561 (2018)."
  },
  "3": {
   "t_en": "Huai Mun Pineapple",
   "tag_en": "GI Product",
   "s_en": "A Smooth Cayenne (Pattavia) pineapple from Nam Pat District with honey-yellow, sweet, juicy flesh. Registered as a GI in B.E. 2556 (2013)."
  },
  "4": {
   "t_en": "Namphi Iron",
   "tag_en": "OTOP Product",
   "s_en": "Sacred iron ore, the origin of Phraya Phichai's sword"
  },
  "5": {
   "t_en": "Langsat–Longkong",
   "tag_en": "OTOP Product",
   "s_en": "Sweet, juicy local fruits"
  },
  "6": {
   "t_en": "Lap Lae Tin Chok Skirt",
   "tag_en": "OTOP Product",
   "s_en": "Hand-woven heritage with ancient patterns"
  },
  "7": {
   "t_en": "Teak Wood Products",
   "tag_en": "OTOP Product",
   "s_en": "Carvings from the Land of the World's Largest Teak"
  }
 }
};
  C.hero.forEach(function (h, i) { h.alt_en = EN.hero[i]; });
  C.stats.forEach(function (s, i) { s.label_en = EN.stats[i]; });
  C.facts.forEach(function (f, i) { f.b_en = EN.facts[i][0]; f.s_en = EN.facts[i][1]; });
  C.services.forEach(function (s, i) { s.t_en = EN.services[i][0]; s.s_en = EN.services[i][1]; });
  C.newsCats.forEach(function (c) { c.name_en = EN.newsCats[c.id]; });
  C.ita.forEach(function (i) { i.t_en = EN.ita[i.code]; });
  C.agencies.forEach(function (a) { a.t_en = EN.agencies[a.t]; });
  ["news", "travel", "products"].forEach(function (k) {
    C[k].forEach(function (it) { Object.assign(it, EN[k][it.id] || {}); });
  });
})(window.CONFIG);
