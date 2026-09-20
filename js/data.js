/* data.js — คลังข้อมูลเนื้อหา (ต่อยอดจาก config.js) พร้อมสลับเป็น REST API ภายหลัง */
window.DATA = {

  /* ---------- เนื้อหาข่าวฉบับเต็ม (key = id ตรงกับ CONFIG.news) ----------
     ใช้เฉพาะข้อเท็จจริงที่ตรวจสอบได้ตาม 03-news.txt/04-news-detail.txt เท่านั้น
     ห้ามใส่ยอดผู้เข้าชม (views) หรือไฟล์แนบ (files) เนื่องจากไม่มีข้อมูลจริง — เว้นว่างไว้
     ทุกข่าวมีลิงก์ "แหล่งข่าวต้นทาง" ต่อท้ายบทความ (แสดงจาก n.src/n.srcUrl ใน page-detail.js) */
  newsBody: {
    9: {
      tags: ["คุณธรรม", "วัฒนธรรม"],
      caption: "ศาลาประชาคมจังหวัดอุตรดิตถ์ สถานที่จัดงาน",
      html: `
<p>สำนักงานวัฒนธรรมจังหวัดอุตรดิตถ์จัดงาน <b>“ตลาดนัดคุณธรรมและยกย่องเชิดชูเกียรติคนดีศรีจังหวัดอุตรดิตถ์”</b> ประจำปีงบประมาณ พ.ศ. 2569 เมื่อวันที่ 3 กันยายน 2569 เวลา 14.00 น. ณ ศาลาประชาคมจังหวัดอุตรดิตถ์ อำเภอเมืองอุตรดิตถ์ โดยมี <b>นายสันติ รังษิรุจิ</b> ผู้ว่าราชการจังหวัดอุตรดิตถ์ เป็นประธานในพิธีเปิด</p>
<p style="color:var(--muted);font-size:.92rem">หมายเหตุ: รายละเอียดกิจกรรมอื่น ๆ ภายในงาน (เช่น รายชื่อผู้ได้รับเกียรติบัตร จำนวนร้านค้า) ยังไม่พบข้อมูลยืนยันในแหล่งที่ค้นคว้าได้ ณ วันที่ตรวจสอบข้อมูล ต้องอ้างอิงจากข่าวต้นทางฉบับเต็มหรือประกาศของสำนักงานวัฒนธรรมจังหวัดโดยตรง</p>`
    },
    1: { tags: ["ป่าไม้", "สิ่งแวดล้อม"] },
    2: { tags: ["ผู้สูงอายุ"] },
    3: { tags: ["เกษตร"] },
    4: { tags: ["TO BE NUMBER ONE", "เยาวชน"] },
    5: { tags: ["ลูกเสือชาวบ้าน", "ความมั่นคง"] },
    6: { tags: ["จิตอาสา"] },
    7: { tags: ["กำนันผู้ใหญ่บ้าน"] },
    8: { tags: ["เกษตร", "มันสำปะหลัง"] }
  },

  /* ---------- ITA : แบบวัดการเปิดเผยข้อมูลสาธารณะ (OIT) O1–O43 ----------
     โครงหัวข้อ O1–O43 สอดคล้องกับกรอบการประเมินมาตรฐานของสำนักงาน ป.ป.ช. ทั่วประเทศ (ถูกต้องเชิงโครงสร้าง)
     แต่ "ลิงก์ปลายทาง" และ "สถานะเผยแพร่" ของแต่ละข้อยังไม่ได้ยืนยันกับหน้าเว็บไซต์ ITA จริงของจังหวัด
     จึงกำหนดสถานะเป็น pending ทุกข้อ (ต้องเชื่อมโยงไปยังเอกสาร/หน้าเว็บจริงก่อนเผยแพร่ — ดู 06-ita.txt) */
  itaGroups: [
    { g: "ตัวชี้วัดที่ 9.1 ข้อมูลพื้นฐาน", items: [
      { c:"O1", t:"โครงสร้างหน่วยงาน", st:"pending", u:"#" },
      { c:"O2", t:"ข้อมูลผู้บริหาร", st:"pending", u:"#" },
      { c:"O3", t:"อำนาจหน้าที่", st:"pending", u:"#" },
      { c:"O4", t:"แผนยุทธศาสตร์หรือแผนพัฒนาหน่วยงาน", st:"pending", u:"#" },
      { c:"O5", t:"ข้อมูลการติดต่อ", st:"pending", u:"#" },
      { c:"O6", t:"กฎหมายที่เกี่ยวข้อง", st:"pending", u:"#" },
      { c:"O7", t:"ข่าวประชาสัมพันธ์", st:"pending", u:"#" },
      { c:"O8", t:"Q&A (ถาม-ตอบ)", st:"pending", u:"#" },
      { c:"O9", t:"Social Network", st:"pending", u:"#" }
    ]},
    { g: "ตัวชี้วัดที่ 9.2 การบริหารงาน", items: [
      { c:"O10", t:"แผนดำเนินงานประจำปี", st:"pending", u:"#" },
      { c:"O11", t:"รายงานการกำกับติดตามการดำเนินงาน รอบ 6 เดือน", st:"pending", u:"#" },
      { c:"O12", t:"รายงานผลการดำเนินงานประจำปี", st:"pending", u:"#" },
      { c:"O13", t:"คู่มือหรือมาตรฐานการปฏิบัติงาน", st:"pending", u:"#" },
      { c:"O14", t:"คู่มือหรือมาตรฐานการให้บริการ", st:"pending", u:"#" },
      { c:"O15", t:"ข้อมูลเชิงสถิติการให้บริการ", st:"pending", u:"#" },
      { c:"O16", t:"รายงานผลการสำรวจความพึงพอใจการให้บริการ", st:"pending", u:"#" },
      { c:"O17", t:"E-Service", st:"pending", u:"#" }
    ]},
    { g: "ตัวชี้วัดที่ 9.3 การบริหารเงินงบประมาณ", items: [
      { c:"O18", t:"แผนการใช้จ่ายงบประมาณประจำปี", st:"pending", u:"#" },
      { c:"O19", t:"รายงานการกำกับติดตามการใช้จ่ายงบประมาณ รอบ 6 เดือน", st:"pending", u:"#" },
      { c:"O20", t:"รายงานผลการใช้จ่ายงบประมาณประจำปี", st:"pending", u:"#" },
      { c:"O21", t:"แผนการจัดซื้อจัดจ้างหรือแผนการจัดหาพัสดุ", st:"pending", u:"#" },
      { c:"O22", t:"ประกาศต่าง ๆ เกี่ยวกับการจัดซื้อจัดจ้าง", st:"pending", u:"#" },
      { c:"O23", t:"สรุปผลการจัดซื้อจัดจ้างรายเดือน (สขร.1)", st:"pending", u:"#" },
      { c:"O24", t:"รายงานผลการจัดซื้อจัดจ้างประจำปี", st:"pending", u:"#" }
    ]},
    { g: "ตัวชี้วัดที่ 9.4 การบริหารและพัฒนาทรัพยากรบุคคล", items: [
      { c:"O25", t:"นโยบายการบริหารทรัพยากรบุคคล", st:"pending", u:"#" },
      { c:"O26", t:"การดำเนินการตามนโยบายการบริหารทรัพยากรบุคคล", st:"pending", u:"#" },
      { c:"O27", t:"หลักเกณฑ์การบริหารและพัฒนาทรัพยากรบุคคล", st:"pending", u:"#" },
      { c:"O28", t:"รายงานผลการบริหารและพัฒนาทรัพยากรบุคคลประจำปี", st:"pending", u:"#" }
    ]},
    { g: "ตัวชี้วัดที่ 9.5 การส่งเสริมความโปร่งใส", items: [
      { c:"O29", t:"แนวปฏิบัติการจัดการเรื่องร้องเรียนการทุจริตและประพฤติมิชอบ", st:"pending", u:"#" },
      { c:"O30", t:"ช่องทางแจ้งเรื่องร้องเรียนการทุจริตและประพฤติมิชอบ", st:"pending", u:"#" },
      { c:"O31", t:"ข้อมูลเชิงสถิติเรื่องร้องเรียนการทุจริตประจำปี", st:"pending", u:"#" },
      { c:"O32", t:"ช่องทางการรับฟังความคิดเห็น", st:"pending", u:"#" },
      { c:"O33", t:"การเปิดโอกาสให้เกิดการมีส่วนร่วม", st:"pending", u:"#" }
    ]},
    { g: "ตัวชี้วัดที่ 10.1 การดำเนินการเพื่อป้องกันการทุจริต", items: [
      { c:"O34", t:"นโยบายไม่รับของขวัญ (No Gift Policy)", st:"pending", u:"#" },
      { c:"O35", t:"การมีส่วนร่วมของผู้บริหาร", st:"pending", u:"#" },
      { c:"O36", t:"การประเมินความเสี่ยงการทุจริตประจำปี", st:"pending", u:"#" },
      { c:"O37", t:"การดำเนินการเพื่อจัดการความเสี่ยงการทุจริต", st:"pending", u:"#" },
      { c:"O38", t:"การเสริมสร้างวัฒนธรรมองค์กร", st:"pending", u:"#" },
      { c:"O39", t:"แผนปฏิบัติการป้องกันการทุจริต", st:"pending", u:"#" },
      { c:"O40", t:"รายงานการกำกับติดตามการดำเนินการป้องกันการทุจริต รอบ 6 เดือน", st:"pending", u:"#" },
      { c:"O41", t:"รายงานผลการดำเนินการป้องกันการทุจริตประจำปี", st:"pending", u:"#" }
    ]},
    { g: "ตัวชี้วัดที่ 10.2 มาตรการภายในเพื่อป้องกันการทุจริต", items: [
      { c:"O42", t:"มาตรการส่งเสริมคุณธรรมและความโปร่งใสภายในหน่วยงาน", st:"pending", u:"#" },
      { c:"O43", t:"การดำเนินการตามมาตรการส่งเสริมคุณธรรมและความโปร่งใส", st:"pending", u:"#" }
    ]}
  ],

  /* ---------- รายละเอียดแหล่งท่องเที่ยว (key = id ตรงกับ CONFIG.travel) ----------
     ใช้เฉพาะข้อมูลที่ยืนยันได้ตามที่ปรากฏใน CONFIG.travel เท่านั้น ไม่เพิ่มตัวเลข
     (เวลาเปิด-ปิด/ค่าเข้าชม) ที่ยังไม่ได้ยืนยันกับหน่วยงานเจ้าของพื้นที่ */
  travelBody: {
    1: { html:`<p>เขื่อนสิริกิติ์เป็นเขื่อนดิน (Earth-fill Dam) ที่มีขนาดใหญ่ที่สุดในประเทศไทย ตั้งอยู่ที่ตำบลผาเลือด อำเภอท่าปลา กั้นแม่น้ำน่าน เก็บกักน้ำเป็นอ่างเก็บน้ำขนาดใหญ่รายล้อมด้วยภูเขา เป็นทั้งแหล่งผลิตไฟฟ้าพลังน้ำและแหล่งท่องเที่ยวเชิงธรรมชาติของจังหวัด</p>` },
    2: { html:`<p>วัดพระแท่นศิลาอาสน์เป็นพระอารามหลวง ตั้งอยู่ตำบลทุ่งยั้ง อำเภอลับแล ภายในประดิษฐาน “พระแท่นศิลาอาสน์” แท่นศิลาแลงอันเป็นที่มาของตราประจำจังหวัดอุตรดิตถ์ เป็นสถานที่ศักดิ์สิทธิ์ที่ประชาชนนิยมเดินทางมากราบไหว้สักการะ</p>` },
    3: { html:`<p>อุทยานแห่งชาติภูสอยดาว ตั้งอยู่ในเขตอำเภอน้ำปาด ขึ้นชื่อเรื่องทุ่งดอกหงอนนาคและลานสนสามใบบนยอดดอย เป็นจุดหมายยอดนิยมของนักเดินป่าในช่วงเดือนสิงหาคม–กันยายนของทุกปี ซึ่งเป็นช่วงที่ดอกหงอนนาคบานเต็มทุ่ง</p>` },
    4: { html:`<p>อุทยานแห่งชาติต้นสักใหญ่ ตั้งอยู่ตำบลน้ำไคร้ อำเภอน้ำปาด เป็นที่ตั้งของต้นสักขนาดใหญ่ที่สุดในประเทศไทย จึงเป็นที่มาของคำขวัญจังหวัดอุตรดิตถ์ที่ว่า “ถิ่นสักใหญ่ของโลก”</p>` },
    5: { html:`<p>อนุสาวรีย์พระยาพิชัยดาบหัก ตั้งอยู่บริเวณหน้าศาลากลางจังหวัด ตำบลท่าอิฐ อำเภอเมืองอุตรดิตถ์ สร้างขึ้นเพื่อเป็นอนุสรณ์แด่วีรบุรุษทหารเอกของสมเด็จพระเจ้าตากสินมหาราช ผู้เป็นชาวเมืองอุตรดิตถ์โดยกำเนิด</p>` }
  },

  /* ---------- รายละเอียดสินค้า GI/OTOP (key = id ตรงกับ CONFIG.products) ----------
     ข้อมูลสินค้ากลุ่ม GI ตรวจสอบจากประกาศกรมทรัพย์สินทางปัญญาและข่าวราชการที่อ้างอิงประกาศดังกล่าว
     - ทุเรียนหลงลับแลอุตรดิตถ์ (ทะเบียนเลขที่ สช 61100104) และทุเรียนหลินลับแลอุตรดิตถ์ (ทะเบียนเลขที่ สช 61100105)
       ประกาศขึ้นทะเบียน GI โดยกรมทรัพย์สินทางปัญญาเมื่อวันที่ 16 พฤษภาคม 2561 (พ.ศ. 2561)
       — วันที่ 13 มิถุนายน 2555 ที่เคยปรากฏในบางแหล่งเป็น "วันยื่นคำขอ" ไม่ใช่วันที่ประกาศขึ้นทะเบียนจริง
       จึงห้ามใช้วันดังกล่าวเป็นปีที่ขึ้นทะเบียน GI
     - สับปะรดห้วยมุ่น (ทะเบียนเลขที่ สช 56100056) ประกาศขึ้นทะเบียน GI เมื่อวันที่ 18 กันยายน 2556 (พ.ศ. 2556)
     ห้ามใส่ตัวเลขหรือปีที่ไม่มีแหล่งอ้างอิงยืนยัน
     สินค้ากลุ่ม OTOP ยังไม่พบประกาศขึ้นทะเบียน GI จึงแสดงเฉพาะคำอธิบายทั่วไป ไม่ใส่ปี/เลขทะเบียน GI ให้ */
  productBody: {
    1: { html:`
<p><b>คืออะไร:</b> ทุเรียนหลงลับแลอุตรดิตถ์เป็นทุเรียนพันธุ์พื้นเมืองของอำเภอลับแล ผลมีทรงกลมหรือกลมรี ขนาดเล็ก เปลือกบาง เนื้อมาก สีเหลืองเข้ม เนื้อแห้งละเอียดเหนียว มีกลิ่นอ่อน รสชาติหวานมัน เมล็ดลีบเล็ก</p>
<p><b>ขึ้นทะเบียน GI ตั้งแต่ปี:</b> พ.ศ. 2561 (ประกาศกรมทรัพย์สินทางปัญญา ณ วันที่ 16 พฤษภาคม 2561) ทะเบียนเลขที่ สช 61100104</p>
<p><b>ผลิตในพื้นที่:</b> อำเภอลับแล อำเภอเมืองอุตรดิตถ์ และอำเภอท่าปลา จังหวัดอุตรดิตถ์</p>
<p><b>เอกลักษณ์:</b> ปลูกบนที่สูงหรือไหล่เขาโดยอาศัยน้ำฝนเป็นหลัก ชาวบ้านจึงเรียกว่า “ทุเรียนเทวดาเลี้ยง” ให้ผลผลิตเฉพาะช่วงเดือนพฤษภาคม–สิงหาคมของทุกปี</p>
<p><b>เหตุใดจึงได้รับ GI:</b> เกิดจากความเชื่อมโยงระหว่างสายพันธุ์พื้นเมืองเฉพาะถิ่นกับสภาพภูมิประเทศแบบภูเขาของอำเภอลับแล ทำให้ได้ลักษณะเนื้อ กลิ่น และรสชาติเฉพาะตัวที่ไม่สามารถหาได้จากทุเรียนที่ปลูกในพื้นที่อื่น</p>`,
      tags:["GI","ทุเรียน","ลับแล"] },
    2: { html:`
<p><b>คืออะไร:</b> ทุเรียนหลินลับแลอุตรดิตถ์เป็นทุเรียนพันธุ์พื้นเมืองของอำเภอลับแลอีกสายพันธุ์หนึ่ง ผลมีทรงกระบอก ฐานผลเว้าลึก เปลือกบาง เนื้อสีเหลืองเข้ม เนื้อละเอียดเหนียวแห้ง รสชาติหวานมัน กลิ่นอ่อน เมล็ดลีบเล็ก</p>
<p><b>ขึ้นทะเบียน GI ตั้งแต่ปี:</b> พ.ศ. 2561 (ประกาศกรมทรัพย์สินทางปัญญา ณ วันที่ 16 พฤษภาคม 2561) ทะเบียนเลขที่ สช 61100105</p>
<p><b>ผลิตในพื้นที่:</b> อำเภอลับแล อำเภอเมืองอุตรดิตถ์ และอำเภอท่าปลา จังหวัดอุตรดิตถ์ (พื้นที่เดียวกับทุเรียนหลงลับแล)</p>
<p><b>เอกลักษณ์:</b> เนื้อมากเส้นใยน้อย เก็บรักษาไว้ได้นานโดยไม่แฉะ ให้ผลผลิตในช่วงเดียวกับทุเรียนหลงลับแล</p>
<p><b>เหตุใดจึงได้รับ GI:</b> เป็นสายพันธุ์พื้นเมืองของอำเภอลับแลที่ปลูกในสภาพภูมิอากาศแบบภูเขาเช่นเดียวกับหลงลับแล ทำให้มีรสชาติและเนื้อสัมผัสเฉพาะตัวที่ผูกกับแหล่งปลูก</p>`,
      tags:["GI","ทุเรียน","ลับแล"] },
    3: { html:`
<p><b>คืออะไร:</b> สับปะรดห้วยมุ่นเป็นสับปะรดพันธุ์ปัตตาเวีย ผิวบาง ตาตื้น เนื้อภายในสีเหลืองคล้ายน้ำผึ้ง เนื้อหนานุ่ม รสชาติหวานหอม ฉ่ำน้ำ รับประทานแล้วไม่ระคายลิ้น</p>
<p><b>ขึ้นทะเบียน GI ตั้งแต่ปี:</b> พ.ศ. 2556 (ประกาศกรมทรัพย์สินทางปัญญา ณ วันที่ 18 กันยายน 2556) ทะเบียนเลขที่ สช 56100056</p>
<p><b>ผลิตในพื้นที่:</b> ตำบลห้วยมุ่นและตำบลน้ำไผ่ อำเภอน้ำปาด จังหวัดอุตรดิตถ์</p>
<p><b>เอกลักษณ์:</b> ให้ผลผลิตได้เกือบตลอดปี และยังเป็นผลไม้ไทยชนิดแรกที่ได้รับการขึ้นทะเบียนสิ่งบ่งชี้ทางภูมิศาสตร์ในประเทศญี่ปุ่นด้วย (ขึ้นทะเบียนโดยกระทรวงเกษตร ป่าไม้ และประมงญี่ปุ่น เมื่อ 27 สิงหาคม 2567)</p>
<p><b>เหตุใดจึงได้รับ GI:</b> สภาพดินและภูมิอากาศเฉพาะของตำบลห้วยมุ่นและตำบลน้ำไผ่ อำเภอน้ำปาด ทำให้สับปะรดที่ปลูกในพื้นที่นี้มีรสชาติหวานหอมและเนื้อสัมผัสที่โดดเด่นแตกต่างจากแหล่งปลูกอื่น</p>`,
      tags:["GI","สับปะรด","น้ำปาด"] },
    4: { html:`<p>เหล็กน้ำพี้คือแร่เหล็กกล้าคุณภาพสูงที่พบเฉพาะบริเวณบ่อเหล็กน้ำพี้ ตำบลน้ำพี้ อำเภอทองแสนขัน ตามความเชื่อดั้งเดิมเป็นแร่เหล็กศักดิ์สิทธิ์ที่เคยใช้ตีดาบพระแสงสำหรับพระมหากษัตริย์ และเป็นที่มาของดาบพระยาพิชัยดาบหักในตำนาน ปัจจุบันนำมาแปรรูปเป็นเครื่องประดับและของที่ระลึกประจำถิ่น</p>
<p style="color:var(--muted);font-size:.92rem">หมายเหตุ: เหล็กน้ำพี้เป็นสินค้า OTOP/ของดีประจำถิ่นที่มีชื่อเสียงของจังหวัด แต่ยังไม่พบประกาศขึ้นทะเบียนเป็นสิ่งบ่งชี้ทางภูมิศาสตร์ (GI) จากกรมทรัพย์สินทางปัญญา ณ วันที่ตรวจสอบข้อมูล</p>` },
    5: { html:`<p>ลางสาดและลองกองเป็นผลไม้ประจำถิ่นของจังหวัดอุตรดิตถ์ รสชาติหวานฉ่ำ เป็นหนึ่งในผลไม้ขึ้นชื่อที่ปรากฏอยู่ในคำขวัญประจำจังหวัด “เมืองลางสาดหวาน”</p>
<p style="color:var(--muted);font-size:.92rem">หมายเหตุ: เป็นสินค้า OTOP/ผลไม้ขึ้นชื่อประจำถิ่น ยังไม่พบประกาศขึ้นทะเบียนเป็นสิ่งบ่งชี้ทางภูมิศาสตร์ (GI) จากกรมทรัพย์สินทางปัญญา ณ วันที่ตรวจสอบข้อมูล</p>` },
    6: { html:`<p>ผ้าซิ่นตีนจกลับแลเป็นภูมิปัญญาการทอผ้าด้วยมือของชาวไท-ยวน อำเภอลับแล ใช้เทคนิคการจกแบบโบราณสร้างลวดลายที่ตีนซิ่นอย่างประณีต สืบทอดมาจากบรรพบุรุษ เป็นงานหัตถกรรมที่สะท้อนอัตลักษณ์ท้องถิ่นของอำเภอลับแล</p>
<p style="color:var(--muted);font-size:.92rem">หมายเหตุ: เป็นสินค้า OTOP/งานหัตถกรรมประจำถิ่น ยังไม่พบประกาศขึ้นทะเบียนเป็นสิ่งบ่งชี้ทางภูมิศาสตร์ (GI) จากกรมทรัพย์สินทางปัญญา ณ วันที่ตรวจสอบข้อมูล</p>` },
    7: { html:`<p>ผลิตภัณฑ์ไม้สักคืองานแกะสลักและเครื่องใช้ที่ผลิตจากไม้สัก สะท้อนความเป็นถิ่นสักใหญ่ของโลกของจังหวัดอุตรดิตถ์ ซึ่งเป็นที่ตั้งของต้นสักขนาดใหญ่ที่สุดในประเทศไทยที่อุทยานแห่งชาติต้นสักใหญ่ อำเภอน้ำปาด</p>
<p style="color:var(--muted);font-size:.92rem">หมายเหตุ: เป็นสินค้า OTOP/งานหัตถกรรมประจำถิ่น ยังไม่พบประกาศขึ้นทะเบียนเป็นสิ่งบ่งชี้ทางภูมิศาสตร์ (GI) จากกรมทรัพย์สินทางปัญญา ณ วันที่ตรวจสอบข้อมูล</p>` }
  },

  /* ที่มา: แถลงข่าวสำนักงาน ป.ป.ช. ประจำจังหวัดอุตรดิตถ์ (nacc.go.th/uttaradit)
     2567 = ตัวเลขประกาศจริง (98.82, ผ่านดีเยี่ยม) / 2566 = คำนวณย้อนกลับจากส่วนต่างที่แถลง (≈89.43)
     ยังไม่พบตัวเลขปีงบประมาณ 2568–2569 ที่ประกาศแล้ว ณ วันที่ตรวจสอบข้อมูล */
  itaScores: [
    { y:"2566", s:89.43, g:"ผ่านดีเยี่ยม", est:true },
    { y:"2567", s:98.82, g:"ผ่านดีเยี่ยม" }
  ]
};


/* ===========================================================
   i18n overlay — ฟิลด์ภาษาอังกฤษ (*_en) สำหรับเนื้อหาตั้งต้น/fallback ในไฟล์นี้
   (ข้อมูลจริงจาก data/*-body.json มีฟิลด์ *_en ครบอยู่แล้ว) — ภาษาไทยเดิมไม่ถูกแตะต้อง
   =========================================================== */
(function (D) {
  "use strict";
  var EN = {
 "newsBody": {
  "9": {
   "tags_en": [
    "Morality",
    "Culture"
   ],
   "caption_en": "Uttaradit Provincial Community Hall, the event venue",
   "html_en": "\n<p>The Uttaradit Provincial Cultural Office held the <b>“Moral Market Fair and Honoring of Good People of Uttaradit”</b> for fiscal year B.E. 2569 (2026) on 3 September 2026 at 2:00 p.m. at the Uttaradit Provincial Community Hall, Mueang Uttaradit District, with <b>Mr. Santi Rangsiruji</b>, Governor of Uttaradit, presiding at the opening ceremony.</p>\n<p style=\"color:var(--muted);font-size:.92rem\">Note: Other details of the event (such as the list of certificate recipients and the number of stalls) could not be confirmed from the sources available at the time of review. Please refer to the full original news report or announcements from the Provincial Cultural Office directly.</p>"
  },
  "1": {
   "tags_en": [
    "Forestry",
    "Environment"
   ]
  },
  "2": {
   "tags_en": [
    "Older persons"
   ]
  },
  "3": {
   "tags_en": [
    "Agriculture"
   ]
  },
  "4": {
   "tags_en": [
    "TO BE NUMBER ONE",
    "Youth"
   ]
  },
  "5": {
   "tags_en": [
    "Village Scouts",
    "Security"
   ]
  },
  "6": {
   "tags_en": [
    "Volunteering"
   ]
  },
  "7": {
   "tags_en": [
    "Kamnan & Village Headmen"
   ]
  },
  "8": {
   "tags_en": [
    "Agriculture",
    "Cassava"
   ]
  }
 },
 "travelBody": {
  "1": {
   "html_en": "<p>Sirikit Dam is an earth-fill dam and the largest in Thailand, located in Pha Lueat Subdistrict, Tha Pla District, across the Nan River. It impounds a large reservoir surrounded by mountains and serves both as a hydroelectric power source and a nature-based tourist destination for the province.</p>"
  },
  "2": {
   "html_en": "<p>Wat Phra Thaen Sila At is a royal monastery in Thung Yang Subdistrict, Lap Lae District. It enshrines the “Phra Thaen Sila At”, a laterite stone seat that is the origin of the Uttaradit provincial seal. It is a sacred site that many people travel to worship and pay respects.</p>"
  },
  "3": {
   "html_en": "<p>Phu Soi Dao National Park is in Nam Pat District and is known for its Hong Nak flower fields and three-needle pine meadows on the mountaintop. It is a favorite destination for trekkers from August to September each year, when the Hong Nak flowers bloom across the fields.</p>"
  },
  "4": {
   "html_en": "<p>Ton Sak Yai National Park is in Nam Khrai Subdistrict, Nam Pat District, and is home to the largest teak tree in Thailand — the origin of the provincial motto “Land of the World's Largest Teak.”</p>"
  },
  "5": {
   "html_en": "<p>The Phraya Phichai Dap Hak Monument stands in front of the Provincial Hall in Tha It Subdistrict, Mueang Uttaradit District. It was built in memory of the great general of King Taksin the Great, a native of Uttaradit.</p>"
  }
 },
 "productBody": {
  "1": {
   "tags_en": [
    "GI",
    "Durian",
    "Lap Lae"
   ],
   "html_en": "\n<p><b>What it is:</b> Long Lap Lae Uttaradit durian is a native durian variety of Lap Lae District. The fruit is round or oval and small, with a thin rind and plentiful, deep-yellow flesh that is fine, dry and firm, with a mild aroma, a rich sweet taste, and a small, shriveled seed.</p>\n<p><b>Registered as a GI since:</b> B.E. 2561 (2018) (announced by the Department of Intellectual Property on 16 May 2018), registration no. Sor Chor 61100104</p>\n<p><b>Production area:</b> Lap Lae District, Mueang Uttaradit District, and Tha Pla District, Uttaradit Province</p>\n<p><b>Distinctiveness:</b> Grown on highlands or mountain slopes mainly on rainwater, which is why villagers call it “the durian raised by the gods.” It fruits only from May to August each year.</p>\n<p><b>Why it received GI status:</b> The link between a native, locally specific variety and the mountainous terrain of Lap Lae District gives it a texture, aroma, and flavor that cannot be found in durians grown elsewhere.</p>"
  },
  "2": {
   "tags_en": [
    "GI",
    "Durian",
    "Lap Lae"
   ],
   "html_en": "\n<p><b>What it is:</b> Lin Lap Lae Uttaradit durian is another native durian variety of Lap Lae District. The fruit is cylindrical with a deeply indented base and thin rind; the flesh is deep yellow, fine, firm and dry, with a rich sweet taste, mild aroma, and a small, shriveled seed.</p>\n<p><b>Registered as a GI since:</b> B.E. 2561 (2018) (announced by the Department of Intellectual Property on 16 May 2018), registration no. Sor Chor 61100105</p>\n<p><b>Production area:</b> Lap Lae District, Mueang Uttaradit District, and Tha Pla District, Uttaradit Province (the same area as Long Lap Lae durian)</p>\n<p><b>Distinctiveness:</b> Plentiful flesh with few fibers, and it keeps for a long time without turning soggy. It fruits in the same season as Long Lap Lae durian.</p>\n<p><b>Why it received GI status:</b> A native variety of Lap Lae District grown in the same mountain climate as Long Lap Lae, giving it a distinctive flavor and texture tied to its growing area.</p>"
  },
  "3": {
   "tags_en": [
    "GI",
    "Pineapple",
    "Nam Pat"
   ],
   "html_en": "\n<p><b>What it is:</b> Huai Mun pineapple is a Smooth Cayenne (Pattavia) variety with thin skin, shallow eyes, and honey-yellow flesh that is thick and tender, sweet, fragrant, and juicy, and does not irritate the tongue.</p>\n<p><b>Registered as a GI since:</b> B.E. 2556 (2013) (announced by the Department of Intellectual Property on 18 September 2013), registration no. Sor Chor 56100056</p>\n<p><b>Production area:</b> Huai Mun and Nam Phai Subdistricts, Nam Pat District, Uttaradit Province</p>\n<p><b>Distinctiveness:</b> Produces fruit almost year-round, and is the first Thai fruit to be registered as a Geographical Indication in Japan (registered by Japan's Ministry of Agriculture, Forestry and Fisheries on 27 August 2024).</p>\n<p><b>Why it received GI status:</b> The specific soil and climate of Huai Mun and Nam Phai Subdistricts in Nam Pat District give pineapples grown here a sweet, fragrant flavor and texture that stand out from other growing areas.</p>"
  },
  "4": {
   "html_en": "<p>Namphi iron is a high-quality steel ore found only at the Namphi iron mines in Namphi Subdistrict, Thong Saen Khan District. According to tradition it is sacred iron ore once used to forge royal swords and is the source of the legendary sword of Phraya Phichai Dap Hak. Today it is processed into jewelry and local souvenirs.</p>\n<p style=\"color:var(--muted);font-size:.92rem\">Note: Namphi iron is a famous OTOP / local specialty of the province, but as of the date of review no Geographical Indication (GI) registration announcement from the Department of Intellectual Property has been found.</p>"
  },
  "5": {
   "html_en": "<p>Langsat and longkong are local fruits of Uttaradit Province, known for their sweet, juicy taste. They are among the renowned fruits mentioned in the provincial motto, “Sweet Langsat Town.”</p>\n<p style=\"color:var(--muted);font-size:.92rem\">Note: This is an OTOP / renowned local fruit, but as of the date of review no Geographical Indication (GI) registration announcement from the Department of Intellectual Property has been found.</p>"
  },
  "6": {
   "html_en": "<p>Lap Lae tin chok skirt cloth is a hand-weaving tradition of the Tai Yuan people of Lap Lae District. Using ancient “chok” (discontinuous supplementary weft) techniques, weavers create intricate patterns on the hem of the skirt, passed down from their ancestors. It is a handicraft that reflects the local identity of Lap Lae District.</p>\n<p style=\"color:var(--muted);font-size:.92rem\">Note: This is an OTOP / local handicraft, but as of the date of review no Geographical Indication (GI) registration announcement from the Department of Intellectual Property has been found.</p>"
  },
  "7": {
   "html_en": "<p>Teak wood products are carvings and household items made from teak, reflecting Uttaradit's identity as the Land of the World's Largest Teak — home to the largest teak tree in Thailand at Ton Sak Yai National Park, Nam Pat District.</p>\n<p style=\"color:var(--muted);font-size:.92rem\">Note: This is an OTOP / local handicraft, but as of the date of review no Geographical Indication (GI) registration announcement from the Department of Intellectual Property has been found.</p>"
  }
 },
 "itaGroups": [
  [
   "Indicator 9.1 Basic Information",
   [
    "Organizational structure",
    "Executive information",
    "Powers and duties",
    "Strategic plan or agency development plan",
    "Contact information",
    "Relevant laws",
    "Press releases",
    "Q&A",
    "Social networks"
   ]
  ],
  [
   "Indicator 9.2 Administration",
   [
    "Annual operational plan",
    "6-month operational monitoring report",
    "Annual performance report",
    "Operating manual or standard",
    "Service manual or standard",
    "Service statistics",
    "Service satisfaction survey report",
    "E-Service"
   ]
  ],
  [
   "Indicator 9.3 Budget Management",
   [
    "Annual budget expenditure plan",
    "6-month budget expenditure monitoring report",
    "Annual budget expenditure report",
    "Procurement plan or supplies acquisition plan",
    "Procurement announcements",
    "Monthly procurement results summary (SKR.1)",
    "Annual procurement results report"
   ]
  ],
  [
   "Indicator 9.4 Human Resource Management and Development",
   [
    "Human resource management policy",
    "Implementation of the human resource management policy",
    "Human resource management and development criteria",
    "Annual human resource management and development report"
   ]
  ],
  [
   "Indicator 9.5 Promoting Transparency",
   [
    "Guidelines for handling corruption and misconduct complaints",
    "Channels for reporting corruption and misconduct",
    "Annual corruption complaint statistics",
    "Channels for public feedback",
    "Opportunities for public participation"
   ]
  ],
  [
   "Indicator 10.1 Corruption Prevention Actions",
   [
    "No Gift Policy",
    "Executive participation",
    "Annual corruption risk assessment",
    "Actions to manage corruption risks",
    "Strengthening organizational culture",
    "Anti-corruption action plan",
    "6-month anti-corruption monitoring report",
    "Annual anti-corruption performance report"
   ]
  ],
  [
   "Indicator 10.2 Internal Anti-Corruption Measures",
   [
    "Internal measures promoting integrity and transparency",
    "Implementation of integrity and transparency measures"
   ]
  ]
 ],
 "itaGrade": "Excellent (Passed)"
};
  ["newsBody", "travelBody", "productBody"].forEach(function (k) {
    Object.keys(EN[k]).forEach(function (id) { D[k][id] = Object.assign(D[k][id] || {}, EN[k][id]); });
  });
  D.itaGroups.forEach(function (g, gi) {
    g.g_en = EN.itaGroups[gi][0];
    g.items.forEach(function (it, ii) { it.t_en = EN.itaGroups[gi][1][ii]; });
  });
  D.itaScores.forEach(function (s) { s.g_en = EN.itaGrade; });
})(window.DATA);
