/* fog.js — หมอกเชิงภาพยนตร์บน Canvas (ประหยัดพลังงาน + เคารพ reduced-motion) */
(function (w) {
  "use strict";
  function FogEngine(canvas, opt) {
    this.c = canvas; this.ctx = canvas.getContext("2d");
    this.o = Object.assign({ puffs: 24, speed: 0.16, blur: 90, tint: "rgba(190,225,220,0.055)" }, opt || {});
    this.puffs = []; this.raf = null; this.running = false;
    this.reduced = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this._resize = this.resize.bind(this);
  }
  FogEngine.prototype.sprite = function () {
    const s = 512, cv = document.createElement("canvas"); cv.width = cv.height = s;
    const g = cv.getContext("2d").createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    g.addColorStop(0, this.o.tint); g.addColorStop(.45, this.o.tint.replace(/[\d.]+\)$/, "0.028)")); g.addColorStop(1, "rgba(0,0,0,0)");
    const cx = cv.getContext("2d"); cx.fillStyle = g; cx.fillRect(0, 0, s, s);
    this.sp = cv;
  };
  FogEngine.prototype.resize = function () {
    const dpr = Math.min(w.devicePixelRatio || 1, 2);
    this.w = this.c.clientWidth; this.h = this.c.clientHeight;
    this.c.width = this.w * dpr; this.c.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  FogEngine.prototype.seed = function () {
    this.puffs = [];
    const n = this.reduced ? 6 : this.o.puffs;
    for (let i = 0; i < n; i++) {
      const depth = Math.random();            // 0 = ไกล, 1 = ใกล้ → ความลึกของภาพ
      this.puffs.push({
        x: Math.random() * this.w, y: this.h * (0.25 + Math.random() * 0.85),
        r: (140 + Math.random() * 380) * (0.5 + depth),
        vx: (0.25 + depth) * this.o.speed * (Math.random() < .5 ? -1 : 1),
        vy: -0.02 - Math.random() * 0.05,
        a: 0.25 + depth * 0.55, ph: Math.random() * Math.PI * 2
      });
    }
  };
  FogEngine.prototype.frame = function (t) {
    if (!this.running) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.puffs) {
      p.x += p.vx; p.y += p.vy; p.ph += 0.004;
      if (p.x - p.r > this.w) p.x = -p.r;
      if (p.x + p.r < 0) p.x = this.w + p.r;
      if (p.y + p.r < 0) { p.y = this.h + p.r; p.x = Math.random() * this.w; }
      ctx.globalAlpha = p.a * (0.72 + Math.sin(p.ph) * 0.28);
      const d = p.r * 2;
      ctx.drawImage(this.sp, p.x - p.r, p.y - p.r, d, d);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    this.raf = requestAnimationFrame(this.frame.bind(this));
  };
  FogEngine.prototype.start = function () {
    if (this.running) return;
    this.sprite(); this.resize(); this.seed();
    w.addEventListener("resize", this._resize, { passive: true });
    this.running = true; this.raf = requestAnimationFrame(this.frame.bind(this));
    if (this.reduced) { this.frame(0); this.running = false; cancelAnimationFrame(this.raf); }
  };
  FogEngine.prototype.stop = function () {
    this.running = false; cancelAnimationFrame(this.raf);
    w.removeEventListener("resize", this._resize);
    this.ctx && this.ctx.clearRect(0, 0, this.w, this.h);
  };
  w.FogEngine = FogEngine;
})(window);


