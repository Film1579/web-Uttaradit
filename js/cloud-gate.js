/* ============================================================
   cloud-gate.js — Cloud Gate Page Transition
   นำ CloudGate class มาจาก cloud-gate-demo4.html (คงตรรกะ/พฤติกรรมแอนิเมชันเดิม
   ของ cloudIn()/cloudOut()/การคำนวณ layout ทั้งหมด) มาใช้งานจริงกับเว็บไซต์
   จังหวัดอุตรดิตถ์ ไฟล์นี้มี 2 ส่วน:

   1) CloudGate class            — เหมือนต้นฉบับ เพิ่มเฉพาะส่วนที่จำเป็นสำหรับใช้งานจริง:
        - DEFAULT_TEXTURE โหลดจากไฟล์ assets/img/cloud.png (ไม่ฝัง Base64)
        - opts.startCovered      ให้เริ่มต้นในสถานะปิดจอได้ทันที (ไม่มีแอนิเมชัน)
        - หรี่ duration ให้สั้นมากอัตโนมัติเมื่อผู้ใช้ตั้ง prefers-reduced-motion
          (กันปัญหา overlay ที่มองไม่เห็นแต่ยังดัก pointer-events ค้างอยู่)
        - snapOpen() เปิดจอทันทีแบบไม่มีแอนิเมชัน ใช้เป็น fallback ด้านความปลอดภัย
   2) Site router                — ผูก Cloud Gate เข้ากับวงจรชีวิตของหน้าเว็บ:
        - เริ่มหน้าใหม่ทุกหน้าด้วยจอที่ถูกปิดอยู่ก่อน แล้วเล่น Cloud OUT เมื่อพร้อม
        - หน้าแรก (index.html) ประสานกับ preloader เดิมผ่านอีเวนต์ "app:ready"
          ที่ preloader.js ยิงอยู่แล้ว (ไม่แก้โค้ด preloader.js/fog.js เลยสักบรรทัด)
        - ดัก click ลิงก์ภายใน/submit ฟอร์มภายใน แล้วเล่น Cloud IN ก่อนเปลี่ยนหน้าเสมอ
        - ยกเว้น mailto:/tel:/external/_blank/download/anchor เดิมบนหน้าเดียวกัน
        - กันคลิกซ้อนระหว่างทรานซิชัน + รองรับ back/forward cache (bfcache)
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     0. หา URL ของ cloud.png โดยอิงตำแหน่งไฟล์สคริปต์นี้เอง แทนที่จะพึ่ง data-base
        วิธีนี้ทำงานถูกต้องทั้งจาก uttaradit/js/cloud-gate.js (หน้า root)
        และจาก uttaradit/pages/*.html (ที่ include ผ่าน ../js/cloud-gate.js)
        เพราะเบราว์เซอร์ resolve src ของ <script> เป็น absolute URL ให้เองอยู่แล้ว
        — ไม่มีทาง 404 ไม่ว่าหน้าไหนจะอยู่ลึกแค่ไหนก็ตาม
  --------------------------------------------------------------------- */
  var CG_SCRIPT_URL = (document.currentScript && document.currentScript.src) || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1].src;
  })();
  var CG_JS_DIR = CG_SCRIPT_URL.replace(/[^\/]*(?:\?.*)?$/, ""); // .../uttaradit/js/
  var CG_TEXTURE_URL = CG_JS_DIR + "../assets/img/cloud.png";

  /* ============================================================
     1. CLOUD GATE — พอร์ตมาจาก cloud-gate-demo4.html
     ============================================================ */
  class CloudGate {
    constructor(opts) {
      opts = opts || {};
      this.mount = opts.mount || document.body;
      this.texture = opts.texture || CloudGate.DEFAULT_TEXTURE;
      this.duration = opts.duration || 1500; // ms
      this._puffCountOpt = opts.puffCount; // ถ้าไม่ระบุ จะคำนวณจากขนาดจอ

      /* Accessibility: ผู้ใช้ที่ตั้ง prefers-reduced-motion ไว้ ควรยังกดลิงก์แล้ว
         เปลี่ยนหน้าได้ตามปกติโดยไม่ต้องรอแอนิเมชันยาว ๆ (CSS ด้านล่างหรี่
         transition-duration เหลือ 1ms อยู่แล้ว แต่ตัวจับเวลาฝั่ง JS ใน
         cloudIn()/cloudOut() ต้องสั้นลงตามด้วย ไม่งั้น .cloud-gate ที่ยังมี
         .is-interactive ค้างอยู่จะบัง pointer-events ทั้งจอไว้โดยที่มองไม่เห็น) */
      this._reducedMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (this._reducedMotion) this.duration = Math.min(this.duration, 50);

      // เริ่มต้นในสถานะปิดจอได้ทันทีถ้าระบุมา (ไม่มีแอนิเมชัน แค่เป็นสถานะตั้งต้นของ DOM)
      this.covered = !!opts.startCovered;
      this._busy = false;
      this._pendingRebuild = false;
      this._built = false;
      this._puffs = [];
      this._build();

      // สร้างใหม่อัตโนมัติเมื่อขนาดจอเปลี่ยน (หมุนจอ / ย่อขยายหน้าต่าง)
      // เพื่อให้จำนวนและขนาดเมฆสัมพันธ์กับจอปัจจุบันเสมอ
      this._onResize = () => {
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => this._rebuild(), 250);
      };
      window.addEventListener('resize', this._onResize);
      window.addEventListener('orientationchange', this._onResize);
    }

    /* ขนาดเมฆและจำนวนคำนวณจากมิติจอ ไม่ใช่ค่า px ตายตัว
       - base = ค่าเฉลี่ยเรขาคณิตของกว้าง/สูง → ใช้ได้ทั้งแนวตั้ง แนวนอน จอ ultrawide
       - จอสัดส่วนยาวมาก (มือถือแนวตั้ง / ultrawide) ใช้เมฆมากขึ้นเพื่อเติมด้านยาว */
    _layoutMetrics() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const base = Math.sqrt(vw * vh);
      const aspect = Math.max(vw, vh) / Math.min(vw, vh);
      let count = Math.round(92 * Math.sqrt(aspect) / 1.265);
      count = Math.max(72, Math.min(count, 130));
      if (this._puffCountOpt != null) count = this._puffCountOpt;
      return { vw, vh, base, count };
    }

    _rebuild() {
      if (!this._built) return;
      if (this._busy) { this._pendingRebuild = true; return; } // รอให้แอนิเมชันจบก่อน
      this._pendingRebuild = false;
      this.el?.remove();
      this._puffs = [];
      this._build();
    }

    static _isSmallScreen() {
      return window.innerWidth < 720;
    }

    _build() {
      const root = document.createElement('div');
      root.className = 'cloud-gate';
      root.style.setProperty('--cg-texture-a', `url("${this.texture}")`);
      // decorative overlay ล้วน ๆ ไม่มีข้อความ/ความหมายที่ผู้ใช้ screen reader ต้องรับรู้
      // และไม่มี element ที่ focus ได้อยู่ข้างในเลย จึงไม่มีโอกาสทำให้ผู้ใช้คีย์บอร์ดติดอยู่ข้างใน
      root.setAttribute('aria-hidden', 'true');

      // base slabs (coverage guarantee)
      const baseLeft = document.createElement('div');
      baseLeft.className = 'cloud-gate__base cloud-gate__base--left';
      const baseRight = document.createElement('div');
      baseRight.className = 'cloud-gate__base cloud-gate__base--right';
      root.appendChild(baseLeft);
      root.appendChild(baseRight);

      // decorative puffs — these carry the actual cloud texture and
      // create depth/overlap. Randomized individually (no CSS repeat),
      // so no tile-pattern can appear. Sizes are clamped to the
      // viewport so large puffs still read as single soft cloud
      // masses, not oversized crops, on small screens.
      const puffs = [];
      const rows = 3; // top, mid, bottom bands
      const { vw, vh, base, count } = this._layoutMetrics();
      const startCovered = this.covered; // rebuild ระหว่างปิดอยู่ต้องคงสถานะปิดไว้

      // วางเมฆแบบ "กริดสุ่มเล็กน้อย" (jittered grid) ครอบทั้งจอรวมขอบ
      // → กระจายสม่ำเสมอ ไม่กระจุกและไม่โหว่ที่ขอบ (เดิมสุ่มล้วน ๆ + อิงมุมซ้ายบน
      //   ทำให้ศูนย์กลางเมฆเยื้องไปขวา/ล่าง และขอบจอแทบไม่มีเมฆ)
      const cols = Math.max(3, Math.ceil(Math.sqrt(count * vw / vh)));
      const gridRows = Math.max(3, Math.ceil(count / cols));
      const cells = [];
      for (let r = 0; r < gridRows; r++)
        for (let c = 0; c < cols; c++) cells.push({ r, c });
      for (let k = cells.length - 1; k > 0; k--) {          // shuffle → ลำดับซ้อน (z) สุ่ม
        const j = Math.floor(Math.random() * (k + 1));
        [cells[k], cells[j]] = [cells[j], cells[k]];
      }
      this.puffCount = cells.length;
      const RIGHT_BIAS = 1.5; // vw — เอียงขวาเล็กน้อย (ตั้ง 0 ถ้าต้องการสมมาตรเป๊ะ)
      const SPAN = 108, PAD = 4; // ศูนย์กลางเมฆกระจาย -4%..104% ของจอ → ครอบถึงขอบ

      for (let i = 0; i < this.puffCount; i++) {
        const el = document.createElement('div');
        el.className = 'cloud-gate__puff';

        const cell = cells[i];
        const cx = (cell.c + this._rand(.1, .9)) / cols * SPAN - PAD + RIGHT_BIAS; // vw (จุดกึ่งกลาง)
        const cy = (cell.r + this._rand(.1, .9)) / gridRows * SPAN - PAD;          // vh (จุดกึ่งกลาง)
        const side = Math.abs(cx - 50) < 3 ? (i % 2 === 0 ? 'left' : 'right')
                   : (cx < 50 ? 'left' : 'right');
        const sizeRoll = Math.random();
        // ขนาดเป็นสัดส่วนของ base (เดิมเป็น px ตายตัว → จอใหญ่เมฆเล็กและโปร่ง)
        let size = sizeRoll < .30 ? this._rand(.14, .23) * base   // small
                 : sizeRoll < .65 ? this._rand(.23, .37) * base   // medium
                 : this._rand(.37, .60) * base;                   // large / "mega"
        size = Math.max(90, Math.min(size, vw * 0.95));

        const rot = this._rand(-14, 14);
        const scaleFinal = this._rand(.94, 1.12);
        const opacity = this._rand(.78, 1);

        // off-screen starting offset (in viewport widths), used as the
        // "open" transform target for this puff.
        // FIX: คำนวณให้ puff พ้นขอบจอจริง ๆ (อิงตำแหน่งปลายทาง + ขนาดของมันเอง)
        // เดิมใช้ค่า vw สุ่มตายตัว บนจอแคบ puff ใหญ่จะค้างโผล่ในจอตอน "เปิด"
        // แล้วถูกตัดหายตอน is-interactive ถูกปิด
        // ตำแหน่งอิง "จุดกึ่งกลาง" ของเมฆ → ครึ่งหนึ่งของขนาด + ส่วนเผื่อ scale/หมุน
        const clearPx = Math.round(size * 0.85 + this._rand(30, 110));
        const travel = side === 'left'
          ? `calc(${(-cx).toFixed(2)}vw - ${clearPx}px)`
          : `calc(${(100 - cx).toFixed(2)}vw + ${clearPx}px)`;

        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.left = `calc(${cx.toFixed(2)}vw - ${(size / 2).toFixed(1)}px)`;
        el.style.top = `calc(${cy.toFixed(2)}vh - ${(size / 2).toFixed(1)}px)`;
        el.style.opacity = opacity;
        el.style.setProperty('--rot', rot + 'deg');
        const mirrorX = Math.random() < .5 ? -1 : 1;
        const mirrorY = Math.random() < .25 ? -1 : 1;
        el.style.setProperty('--sx', (scaleFinal * mirrorX).toFixed(3));
        el.style.setProperty('--sy', (scaleFinal * mirrorY).toFixed(3));

        // start OPEN (off-screen): tx = travel offset
        el.style.setProperty('--tx', startCovered ? '0px' : travel);
        el.dataset.travel = travel;
        el.dataset.distFromCenter = Math.abs(cx - 50).toFixed(1);

        root.appendChild(el);
        puffs.push(el);
      }

      if (startCovered) {
        baseLeft.style.transform = 'translate3d(0,0,0)';
        baseRight.style.transform = 'translate3d(0,0,0)';
        root.classList.add('is-interactive');
      }

      this.mount.appendChild(root);
      this.el = root;
      this.baseLeft = baseLeft;
      this.baseRight = baseRight;
      this._puffs = puffs;
      this._built = true;
    }

    _rand(min, max) { return min + Math.random() * (max - min); }

    _setTransition(ms, easing) {
      const t = `transform ${ms}ms ${easing}`;
      this.baseLeft.style.transition = t;
      this.baseRight.style.transition = t;
      this._puffs.forEach(p => { p.style.transition = t; });
    }

    /* FIX: เดิมรอแค่ transitionend ของแผ่นรองซ้าย ซึ่งจบก่อน puff ที่มี delay
       ทำให้ state เปลี่ยน / ปิด is-interactive ทั้งที่เมฆยังวิ่งอยู่
       ตอนนี้รอเท่ากับ duration + delay สูงสุดของทุกชิ้น */
    _whenDone(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * CLOUD IN — clouds sweep in from both edges and converge until
     * the viewport is 100% covered.
     */
    cloudIn(easing = 'cubic-bezier(.4,.05,.2,1)') {
      if (!this._built) return Promise.resolve();
      this.el.classList.add('is-interactive');

      // puff นำหน้าก่อน แผ่นรองตามหลังเล็กน้อย → ขอบหน้าของม่านเมฆเป็นก้อนเมฆ
      // ไม่ใช่ขอบแผ่นเรียบ ๆ
      let maxDelay = 0;
      this._puffs.forEach(p => {
        const delay = Math.round(this._rand(0, 260));
        maxDelay = Math.max(maxDelay, delay);
        p.style.transitionDelay = delay + 'ms';
      });
      const slabDelay = 140;
      maxDelay = Math.max(maxDelay, slabDelay);
      this.baseLeft.style.transitionDelay = slabDelay + 'ms';
      this.baseRight.style.transitionDelay = slabDelay + 'ms';

      this._setTransition(this.duration, easing);

      // force reflow so the transition is picked up before we change values
      // eslint-disable-next-line no-unused-expressions
      this.el.offsetHeight;

      requestAnimationFrame(() => {
        this.baseLeft.style.transform = 'translate3d(0,0,0)';
        this.baseRight.style.transform = 'translate3d(0,0,0)';
        this._puffs.forEach(p => { p.style.setProperty('--tx', '0px'); });
      });

      this.covered = true;
      this._busy = true;
      return this._whenDone(this.duration + maxDelay + 40).then(() => {
        this._busy = false;
        if (this._pendingRebuild) this._rebuild();
      });
    }

    /**
     * CLOUD OUT — clouds separate starting from the center and move
     * back off-screen, revealing the page beneath.
     */
    cloudOut(easing = 'cubic-bezier(.45,0,.25,1)') {
      if (!this._built) return Promise.resolve();
      this.el.classList.add('is-interactive');

      // center-most puffs start moving first for a true "opening" feel
      const maxDist = 60;
      let maxDelay = 0;
      this._puffs.forEach(p => {
        const dist = parseFloat(p.dataset.distFromCenter || '0');
        const delay = Math.round((dist / maxDist) * 260 + this._rand(0, 60));
        maxDelay = Math.max(maxDelay, delay);
        p.style.transitionDelay = delay + 'ms';
      });
      this.baseLeft.style.transitionDelay = '0ms';
      this.baseRight.style.transitionDelay = '0ms';

      this._setTransition(this.duration, easing);
      this.el.offsetHeight;

      requestAnimationFrame(() => {
        this.baseLeft.style.transform = 'translate3d(-100%,0,0)';
        this.baseRight.style.transform = 'translate3d(100%,0,0)';
        this._puffs.forEach(p => { p.style.setProperty('--tx', p.dataset.travel); });
      });

      this.covered = false;
      this._busy = true;
      return this._whenDone(this.duration + maxDelay + 40).then(() => {
        this._busy = false;
        this.el.classList.remove('is-interactive');
        if (this._pendingRebuild) this._rebuild();
      });
    }

    /* ส่วนเสริมนอกเหนือจาก Demo: เปิดจอทันทีแบบไม่มีแอนิเมชัน/ไม่รอ timer ใด ๆ
       ใช้เป็นทางออกฉุกเฉินเท่านั้น — เมื่อเกิดข้อผิดพลาดระหว่างโหลดหน้า (กัน
       Cloud Gate บังหน้าเว็บค้างถาวร) และตอนหน้าเว็บถูกดึงกลับมาจาก bfcache
       (ปุ่ม Back/Forward) ที่อาจค้างอยู่ในสถานะ "ปิดจอ" จากก่อนออกจากหน้า */
    snapOpen() {
      if (!this._built || !this.el) return;
      this._setTransition(0, 'linear');
      this.el.offsetHeight;
      this.baseLeft.style.transform = 'translate3d(-100%,0,0)';
      this.baseRight.style.transform = 'translate3d(100%,0,0)';
      this._puffs.forEach(p => p.style.setProperty('--tx', p.dataset.travel || '0px'));
      this.covered = false;
      this._busy = false;
      this.el.classList.remove('is-interactive');
    }

    destroy() {
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('orientationchange', this._onResize);
      clearTimeout(this._resizeTimer);
      this.el?.remove();
    }
  }

  // Cloud texture โหลดจากไฟล์จริง uttaradit/assets/img/cloud.png เสมอ
  // (ไม่ฝัง Base64 อีกต่อไป) — path คำนวณจากตำแหน่งของสคริปต์นี้เอง ใช้ได้ทุกหน้า
  CloudGate.DEFAULT_TEXTURE = CG_TEXTURE_URL;

  // เผยแพร่ class ไว้ที่ window เผื่อหน้าใดต้องการเรียกใช้ตรง ๆ ในอนาคต
  window.CloudGate = CloudGate;

  /* ============================================================
     2. SITE ROUTER — ผูก Cloud Gate เข้ากับวงจรชีวิตหน้าเว็บ/การนำทาง
        ครอบทั้งหมดด้วย try/catch: ถ้าขั้นตอนใดพัง ต้องไม่ทำให้ลิงก์ในเว็บไซต์
        ใช้งานไม่ได้ (ข้อกำหนด #14 — ต้องไม่บังการใช้งานถาวรหาก JS error)
     ============================================================ */
  try {
    var HAS_PRELOADER = !!document.getElementById('preloader');

    var gate;
    try {
      // หน้าแรก (มี preloader): เริ่มแบบ "เปิดอยู่" (ไม่ได้ปิดจอไว้ล่วงหน้า) เพื่อให้
      // คลาวด์ได้เล่นแอนิเมชัน "เข้ามาบัง" จริง ๆ ตอนโหลดครบ 100% แทนที่จะปิดจอนิ่ง ๆ
      // ซ้อนอยู่ใต้ preloader มาตั้งแต่ต้นแบบไม่มีใครเห็นแอนิเมชันเลย
      // หน้าอื่น ๆ ที่ไม่มี preloader ยังคงเริ่มแบบ "ปิดจอไว้ก่อน" เหมือนเดิมทุกประการ
      gate = new CloudGate({ mount: document.body, startCovered: !HAS_PRELOADER });
    } catch (buildErr) {
      gate = null; // สร้างไม่สำเร็จ → ปล่อยเว็บไซต์ทำงานตามปกติแบบไม่มี Cloud Gate เลย
    }
    if (!gate) return;

    var navigating = false;   // กันคลิกซ้อน/เปลี่ยนหน้าซ้อนระหว่างทรานซิชัน
    var revealed = false;     // กันการเรียก reveal() ซ้ำจากหลายทาง (event + safety timer)
    var reachedReady = false; // true ทันทีที่ preloader ยิงสถานะ "ready" (โหลดครบ 100%)

    function reveal() {
      if (revealed) return;
      revealed = true;
      try {
        if (gate.covered) gate.cloudOut();
      } catch (e) {
        try { gate.snapOpen(); } catch (e2) { /* หมดหนทางจริง ๆ ปล่อยผ่าน อย่างน้อย DOM ใต้ไม่ได้ถูกลบ */ }
      }
    }

    /* ---- จังหวะการเปิดจอเมื่อหน้าเว็บพร้อม ---- */
    if (HAS_PRELOADER) {
      var preloaderEl = document.getElementById('preloader');
      function hidePreloaderNow() {
        try {
          document.body.classList.remove('is-preloading');
          preloaderEl && preloaderEl.setAttribute('aria-hidden', 'true');
        } catch (e) {}
      }

      /* หน้าแรก: preloader เดิม (fog เดิม) ยิงอีเวนต์ "preloader:state" ทุกครั้งที่
         เปลี่ยนสถานะอยู่แล้ว (ไม่ต้องแก้ preloader.js เลยสักบรรทัด) — ที่สถานะ "ready"
         คือจังหวะที่แถบโหลดถึง 100% พอดี ยังไม่ทันเฟดหาย เราจึงสั่ง Cloud IN
         (z-index สูงกว่า preloader) ให้เมฆพัดเข้ามาบังทับหน้าจอ preloader เดิมที่ยัง
         แสดงอยู่ตรงนั้นเลย พอบังจนมิดจอแล้ว (cloudIn resolve) ค่อยซ่อน preloader เดิม
         ทิ้งทันที (ปลอดภัย เพราะเมฆทึบบังอยู่แล้ว) เว้นจังหวะสั้น ๆ ให้ดูเป็นจอปิดสนิท
         แล้วค่อยเล่น Cloud OUT เผยหน้าเว็บจริง — ผู้ใช้จะไม่เห็นเนื้อหาทะลุผ่านหรือ
         กระพริบเลย เพราะสลับจาก "จอทึบของ preloader" ไปเป็น "จอทึบของเมฆ" โดยตรง */
      document.addEventListener('preloader:state', function onPlState(e) {
        if (e.detail !== 'ready') return;
        document.removeEventListener('preloader:state', onPlState);
        reachedReady = true;
        var run;
        try { run = gate.cloudIn(); } catch (err) { run = Promise.resolve(); }
        Promise.resolve(run).then(function () {
          hidePreloaderNow();
          setTimeout(reveal, 450); // จอปิดสนิทค้างไว้สั้น ๆ ก่อนเปิดออก
        });
      });

      /* เผื่อกรณี preloader ข้ามตรงไปสถานะ "skipped" เลย (ผู้ใช้กด Esc หรือเคยดู
         จบแล้วในเซสชันนี้แล้ว fast-skip) ซึ่งจะไม่ผ่านสถานะ "ready" เลยสักครั้ง —
         กรณีนี้เปิดจอทันทีแบบไม่มีคลาวด์เข้ามาบัง (ไม่เคยปิดไว้ตั้งแต่แรกอยู่แล้ว) */
      document.addEventListener('app:ready', function () {
        if (!reachedReady) reveal();
      }, { once: true });
    } else {
      /* หน้าอื่น ๆ ทั้งหมด (รวม 404.html): ไม่มี preloader เดิม จึงเริ่มปิดจอไว้ก่อน
         ตั้งแต่โหลด แล้วรอให้ DOM หลักพาร์สเสร็จ (DOMContentLoaded ครอบคลุม
         shell.js ที่ฉีด header/nav แล้วด้วย เพราะเป็น script ธรรมดาไม่ async/defer)
         บวก 2 รอบ requestAnimationFrame ให้ layout/paint นิ่งก่อน ค่อยเล่น Cloud OUT */
      document.addEventListener('DOMContentLoaded', function () {
        requestAnimationFrame(function () { requestAnimationFrame(reveal); });
      });
      // เผื่อสคริปต์นี้ถูกโหลดหลัง DOMContentLoaded ไปแล้วด้วยเหตุผลใดก็ตาม
      if (document.readyState !== 'loading') {
        requestAnimationFrame(function () { requestAnimationFrame(reveal); });
      }
    }
    // ตาข่ายนิรภัย: ไม่ว่ากรณีใดก็ตาม ต้องไม่ปล่อยให้จอถูกปิดค้างถาวรเกิน ~9 วินาที
    setTimeout(reveal, 9000);

    /* ---------------------------------------------------------------------
       ตรวจสอบว่า URL เป็นลิงก์ "ภายในเว็บไซต์เดียวกัน" หรือไม่
       รองรับทั้งกรณีรันผ่านเว็บเซิร์ฟเวอร์ปกติ (เทียบ origin) และกรณีเปิดไฟล์
       ตรง ๆ จากเครื่อง (file://) ที่ origin อาจไม่เสถียรข้ามเบราว์เซอร์
    --------------------------------------------------------------------- */
    function isInternalUrl(url) {
      if (location.protocol === 'file:') return url.protocol === 'file:';
      return url.origin === location.origin;
    }

    function goTo(url) {
      if (navigating) return;
      navigating = true;
      document.documentElement.classList.add('cloud-gate-busy');
      var run;
      try { run = gate.cloudIn(); } catch (e) { run = Promise.resolve(); }
      Promise.resolve(run).then(function () {
        location.href = url;
      }).catch(function () {
        location.href = url;
      });
    }

    /* ---------------------------------------------------------------------
       ดักคลิกลิงก์ภายในทั้งเว็บไซต์ (event delegation บน document เพื่อให้ครอบคลุม
       ลิงก์ที่ยังไม่ถูกสร้างตอนนี้ด้วย เช่น การ์ดข่าว/ท่องเที่ยว/OTOP ที่ main.js
       เรนเดอร์ทีหลัง) — ปุ่ม UI ล้วน ๆ (ธีม/ฟอนต์/คอนทราสต์/เมนูมือถือ/carousel/
       modal/แท็บ/pagination) เป็น <button> ทั้งหมดในเว็บไซต์นี้อยู่แล้ว จึงไม่ถูก
       เลือกโดย selector "a[href]" ด้านล่าง ไม่ต้องกันซ้ำเป็นรายตัว
    --------------------------------------------------------------------- */
    document.addEventListener('click', function (e) {
      if (navigating) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var a = e.target.closest('a[href]');
      if (!a) return;
      if (a.hasAttribute('data-no-cloud-gate')) return;
      if (a.hasAttribute('download')) return;

      var targetAttr = (a.getAttribute('target') || '').toLowerCase();
      if (targetAttr && targetAttr !== '_self') return; // _blank ฯลฯ

      var href = a.getAttribute('href') || '';
      if (href === '' || href.charAt(0) === '#') return; // เลื่อนไปจุดบนหน้าเดียวกัน
      if (/^(mailto:|tel:|sms:|fax:|javascript:)/i.test(href)) return;

      var url;
      try { url = new URL(href, location.href); } catch (err) { return; }
      if (!isInternalUrl(url)) return;

      // ลิงก์ที่ชี้ไปยัง section บนหน้าเดียวกัน (เช่น "#about" ที่ resolve เต็มเป็น
      // ".../index.html#about" ขณะอยู่หน้า index.html เอง) — ปล่อยให้เลื่อนตามปกติ
      if (url.pathname === location.pathname && url.hash) return;

      e.preventDefault();
      goTo(url.href);
    });

    /* ---------------------------------------------------------------------
       ดัก submit ของฟอร์มที่นำทางไปหน้าอื่นจริง ๆ (เช่น ฟอร์มค้นหาบนแถบเมนูของ
       หน้าใน /pages/ ที่ shell.js ฉีดมาพร้อม action ไปหน้า news.html) — ฟอร์มที่
       ไม่มี action (เช่น ฟอร์มติดต่อ/ฟอร์มค้นหาข่าวในหน้า ที่ JS อื่นจัดการเองด้วย
       preventDefault แล้ว) จะไม่ถูกแตะต้องเลย
    --------------------------------------------------------------------- */
    document.addEventListener('submit', function (e) {
      if (navigating) { e.preventDefault(); return; }
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.hasAttribute('data-no-cloud-gate')) return;
      var method = (form.getAttribute('method') || 'get').toLowerCase();
      if (method !== 'get') return; // ไม่ยุ่งกับฟอร์มที่ POST/ตรวจสอบเอง
      var action = form.getAttribute('action');
      if (!action) return; // ไม่มี action ชัดเจน = จัดการทั้งหมดด้วย JS อื่นอยู่แล้ว

      var url;
      try { url = new URL(action, location.href); } catch (err) { return; }
      if (!isInternalUrl(url)) return;

      var qs;
      try { qs = new URLSearchParams(new FormData(form)).toString(); } catch (err) { qs = ''; }
      var finalHref = url.pathname + (qs ? '?' + qs : '') + url.hash;

      e.preventDefault();
      goTo(new URL(finalHref, location.href).href);
    });

    /* ---------------------------------------------------------------------
       Back/Forward: ถ้าหน้านี้ถูกดึงกลับมาจาก bfcache (Cloud Gate อาจค้างอยู่ใน
       สถานะ "ปิดจอ" จากตอนก่อนออกจากหน้า) ให้เปิดจอกลับมาทันทีแบบไม่มีแอนิเมชัน
       และปลดล็อกสถานะกันคลิกซ้อน — ป้องกันหน้าจอค้าง/Cloud Gate ค้างตามข้อกำหนด
    --------------------------------------------------------------------- */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      navigating = false;
      document.documentElement.classList.remove('cloud-gate-busy');
      if (gate.covered) {
        try { gate.snapOpen(); } catch (err) { /* no-op */ }
      }
    });

  } catch (routerErr) {
    // ความผิดพลาดใด ๆ ในชั้น router ต้องไม่ทำให้สคริปต์อื่นของเว็บไซต์หยุดทำงาน
    // (สคริปต์ที่โหลดถัดไปยังรันต่อได้ตามปกติ ลิงก์ทุกอันยังคลิกได้ด้วยพฤติกรรม
    // เบราว์เซอร์ปกติ เพียงแต่ไม่มีเอฟเฟกต์ Cloud Gate เท่านั้น)
  }
})();
