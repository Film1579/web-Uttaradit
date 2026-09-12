/* preloader.js — State Machine: loading → ready → revealing → complete | skipped */
(function () {
  "use strict";
  const CFG = window.CONFIG.preloader, el = document.getElementById("preloader");
  if (!el) return;

  const bar = document.getElementById("plBar"), pct = document.getElementById("plPct"),
        skipBtn = document.getElementById("plSkip"), body = document.body;

  const S = { LOADING:"loading", READY:"ready", REVEALING:"revealing", COMPLETE:"complete", SKIPPED:"skipped" };
  let state = S.LOADING, progress = 0, t0 = performance.now(), timer = null, guard = null;
  const fog = new window.FogEngine(document.getElementById("fogCanvas"), window.CONFIG.fog);

  const transitions = {
    loading:  [S.READY, S.SKIPPED],
    ready:    [S.REVEALING, S.SKIPPED],
    revealing:[S.COMPLETE],
    complete: [], skipped: []
  };

  function setState(next) {
    if (!transitions[state].includes(next)) return false;
    state = next; el.dataset.state = next;
    document.dispatchEvent(new CustomEvent("preloader:state", { detail: next }));
    ({ ready: onReady, revealing: onRevealing, complete: onDone, skipped: onSkipped })[next]?.();
    return true;
  }

  function setProgress(v) {
    progress = Math.max(0, Math.min(100, v));
    bar.style.width = progress + "%";
    pct.textContent = Math.round(progress);
  }

  function onReady()     { setProgress(100); setTimeout(() => setState(S.REVEALING), 420); }
  function onRevealing() { fog.stop(); setTimeout(() => setState(S.COMPLETE), 1000); }
  function onDone()      { finish(); }
  function onSkipped()   { fog.stop(); finish(); }

  function finish() {
    clearInterval(timer); clearTimeout(guard);
    body.classList.remove("is-preloading");
    el.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onKey);
    if (CFG.sessionOnce) { try { sessionStorage.setItem(CFG.storageKey, "1"); } catch (e) {} }
    document.dispatchEvent(new Event("app:ready"));
    document.querySelector(".skip-link")?.focus({ preventScroll: true });
  }

  function onKey(e) { if (e.key === "Escape") setState(S.SKIPPED); }

  /* ---- ข้ามอัตโนมัติถ้าเคยดูแล้วในเซสชันนี้ ---- */
  let seen = false;
  try { seen = CFG.sessionOnce && sessionStorage.getItem(CFG.storageKey) === "1"; } catch (e) {}
  if (seen) { el.dataset.state = S.SKIPPED; state = S.SKIPPED; body.classList.remove("is-preloading"); document.dispatchEvent(new Event("app:ready")); return; }

  /* ---- เริ่มทำงาน ---- */
  fog.start();
  skipBtn.addEventListener("click", () => setState(S.SKIPPED));
  document.addEventListener("keydown", onKey);

  timer = setInterval(() => {
    const elapsed = performance.now() - t0;
    const target = document.readyState === "complete" ? 100 : 88;
    if (progress < target) setProgress(progress + Math.max(0.6, (target - progress) * 0.06));
    if (progress >= 99.2 && elapsed >= CFG.minDuration) setState(S.READY);
  }, 60);

  window.addEventListener("load", () => {
    const wait = Math.max(0, CFG.minDuration - (performance.now() - t0));
    setTimeout(() => { setProgress(100); setState(S.READY); }, wait);
  });

  guard = setTimeout(() => { if (state === S.LOADING) setState(S.SKIPPED); }, CFG.maxDuration);
})();


