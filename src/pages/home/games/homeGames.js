// src/pages/home/games/homeGames.js
// دو بازی سبک و اعتیادآور برای صفحهٔ خانه — بدون وابستگی خارجی.
// در محیط بدون canvas (مثل jsdom) به‌صورت امن no-op می‌شوند.

/* ------------------------------------------------------------------ */
/* بازی ۱: شکار ستاره                                                  */
/* ------------------------------------------------------------------ */
export function mountStarCatch(canvas, hooks = {}) {
  if (!canvas || !canvas.getContext) return { start(){}, destroy(){} };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { start(){}, destroy(){} };

  let raf = 0; let running = false; let score = 0; let timeLeft = 30;
  let stars = []; let lastSpawn = 0; let lastTick = 0;
  const W = () => (canvas.width = canvas.offsetWidth || 300);
  const H = () => (canvas.height = canvas.offsetHeight || 220);

  const onScore = hooks.onScore || (() => {});
  const onEnd = hooks.onEnd || (() => {});

  function spawn() {
    stars.push({ x: Math.random() * (canvas.width - 20) + 10, y: -10, r: 9 + Math.random() * 6, vy: 1 + Math.random() * 1.6, hue: 180 + Math.random() * 120, dead: false });
  }

  function drawStar(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = `hsl(${s.hue} 90% 65%)`;
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * s.r, -Math.sin((18 + i * 72) * Math.PI / 180) * s.r);
      ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (s.r / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (s.r / 2));
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function loop(t) {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (t - lastSpawn > 600) { spawn(); lastSpawn = t; }
    if (t - lastTick > 1000) { timeLeft--; lastTick = t; onScore(score, timeLeft); if (timeLeft <= 0) return end(); }
    stars = stars.filter((s) => !s.dead && s.y < canvas.height + 20);
    for (const s of stars) { s.y += s.vy; drawStar(s); }
    raf = requestAnimationFrame(loop);
  }

  function onClick(e) {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    for (const s of stars) {
      if (!s.dead && Math.hypot(s.x - x, s.y - y) < s.r + 6) { s.dead = true; score++; onScore(score, timeLeft); break; }
    }
  }

  function end() {
    running = false; cancelAnimationFrame(raf);
    onEnd(score);
  }

  function start() {
    W(); H();
    score = 0; timeLeft = 30; stars = []; running = true;
    lastSpawn = 0; lastTick = performance.now();
    onScore(0, timeLeft);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointerdown', onClick);

  return {
    start,
    destroy() {
      running = false; cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onClick);
    },
  };
}

/* ------------------------------------------------------------------ */
/* بازی ۲: نبض حافظه (Simon)                                           */
/* ------------------------------------------------------------------ */
export function mountMemoryPulse(container, hooks = {}) {
  if (!container) return { start(){}, destroy(){} };
  const onLevel = hooks.onLevel || (() => {});
  const onEnd = hooks.onEnd || (() => {});

  const pads = Array.from(container.querySelectorAll('[data-pad]'));
  if (pads.length < 4) return { start(){}, destroy(){} };

  const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6'];
  let seq = []; let input = []; let playing = false; let showing = false; let level = 0;
  const timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };

  function flash(i, dur = 320) {
    const pad = pads[i];
    pad.style.background = COLORS[i];
    pad.style.boxShadow = `0 0 26px ${COLORS[i]}`;
    later(() => { pad.style.background = ''; pad.style.boxShadow = ''; }, dur);
  }

  function showSeq() {
    showing = true;
    seq.forEach((idx, n) => later(() => {
      flash(idx);
      if (n === seq.length - 1) later(() => { showing = false; input = []; }, 400);
    }, n * 520));
  }

  function next() {
    level++; onLevel(level);
    seq.push(Math.floor(Math.random() * 4));
    input = [];
    later(showSeq, 500);
  }

  function onPad(e) {
    if (!playing || showing) return;
    const i = pads.indexOf(e.currentTarget);
    flash(i, 200);
    input.push(i);
    const pos = input.length - 1;
    if (input[pos] !== seq[pos]) { playing = false; onEnd(level - 1); return; }
    if (input.length === seq.length) later(next, 600);
  }

  pads.forEach((p) => p.addEventListener('click', onPad));

  function start() {
    playing = true; seq = []; level = 0;
    next();
  }

  return {
    start,
    destroy() {
      playing = false;
      timers.forEach(clearTimeout);
      pads.forEach((p) => p.removeEventListener('click', onPad));
    },
  };
}
