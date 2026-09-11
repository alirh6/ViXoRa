// 🎯 Aim Trainer — ۳۰ ثانیه شکار هدف: کمبو، دقت، هدف متحرک
import { randi, pnum, sfx, vibrate, makeLoop } from '../arcade.js';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">⏱ <b data-t>۳۰</b></span>' +
    '<span class="ag-pill">🔥 <b data-c>۰</b></span>' +
    '<span class="ag-pill">🎯 <b data-a>—</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:560px"><canvas data-cv style="width:100%;cursor:crosshair"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--primary" type="button" data-new>▶ ' + (fa ? 'شروع' : 'Start') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'هدف‌ها رو بزن! هرچی کوچیک‌تر و سریع‌تر، امتیاز بیشتر' : 'Hit targets! Smaller & faster = more points') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const tEl = wrap.querySelector('[data-t]');
  const cEl = wrap.querySelector('[data-c]');
  const aEl = wrap.querySelector('[data-a]');
  let W = 520, H = 400;
  let targets, parts, score, combo, bestCombo, hits, shots, time, running, spawnT, elapsed;

  function reset() {
    targets = []; parts = [];
    score = 0; combo = 0; bestCombo = 0; hits = 0; shots = 0;
    time = 30; elapsed = 0; spawnT = 0; running = true;
    hideOver();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    tEl.textContent = pnum(Math.ceil(Math.max(0, time)));
    cEl.textContent = pnum(combo);
    aEl.textContent = shots ? Math.round((hits / shots) * 100) + '٪' : '—';
  }
  function spawn() {
    const lvl = Math.min(1, elapsed / 30);
    const r = 30 - lvl * 14 - Math.random() * 8;
    const moving = elapsed > 10 && Math.random() < 0.4;
    targets.push({
      x: r + 10 + Math.random() * (W - 2 * r - 20),
      y: r + 10 + Math.random() * (H - 2 * r - 20),
      r: Math.max(13, r),
      life: Math.max(0.7, 1.4 - lvl * 0.6),
      maxLife: 1.4,
      vx: moving ? (Math.random() - 0.5) * 260 : 0,
      vy: moving ? (Math.random() - 0.5) * 260 : 0,
      hue: randi(0, 360),
    });
  }
  function burst(x, y, hue) {
    for (let i = 0; i < 12; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 380, vy: (Math.random() - 0.5) * 380, life: 0.45, hue });
  }
  function shoot(x, y) {
    if (!running) return;
    sfx.unlock();
    shots++;
    let hit = null;
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if ((x - t.x) * (x - t.x) + (y - t.y) * (y - t.y) <= t.r * t.r) { hit = t; targets.splice(i, 1); break; }
    }
    if (hit) {
      hits++;
      combo++;
      bestCombo = Math.max(bestCombo, combo);
      const gain = Math.round((40 - hit.r) * 2 + combo * 5 + (hit.life < 0.4 ? 25 : 0));
      score += Math.max(10, gain);
      burst(hit.x, hit.y, hit.hue);
      sfx.pop();
      vibrate(8);
    } else {
      combo = 0;
      sfx.click();
    }
    hud();
  }
  function finish() {
    running = false;
    const r = api.submitScore(score);
    const acc = shots ? Math.round((hits / shots) * 100) : 0;
    if (acc >= 70) sfx.win(); else sfx.lose();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🎯</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>🎯 ' + (fa ? 'دقت: ' : 'Accuracy: ') + pnum(acc) + '٪ · 🔥 ' + (fa ? 'بهترین کمبو: ' : 'Best combo: ') + pnum(bestCombo) + '</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    if (running) {
      time -= dt;
      elapsed += dt;
      if (time <= 0) { time = 0; hud(); finish(); }
      spawnT -= dt;
      const want = elapsed < 8 ? 2 : elapsed < 18 ? 3 : 4;
      if (spawnT <= 0 && targets.length < want) { spawn(); spawnT = 0.25; }
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        t.life -= dt;
        t.x += t.vx * dt; t.y += t.vy * dt;
        if (t.x < t.r || t.x > W - t.r) t.vx *= -1;
        if (t.y < t.r || t.y > H - t.r) t.vy *= -1;
        if (t.life <= 0) { targets.splice(i, 1); combo = 0; }
      }
      hud();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    draw();
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(0, 0, W, H);
    // گرید
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (const t of targets) {
      const a = Math.min(1, t.life * 2.5);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'hsl(' + t.hue + ' 85% 60%)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.55, 0, 7);
      ctx.fill();
      ctx.fillStyle = 'hsl(' + t.hue + ' 85% 55%)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.28, 0, 7);
      ctx.fill();
      // حلقه زمان
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r + 5, -Math.PI / 2, -Math.PI / 2 + (t.life / t.maxLife) * Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life * 2.2);
      ctx.fillStyle = 'hsl(' + p.hue + ' 90% 65%)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!running && !wrap.querySelector('[data-over]') && elapsed === 0) {
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fa ? '▶ دکمه شروع رو بزن!' : '▶ Press start!', W / 2, H / 2);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(560, box.clientWidth - 24);
    const h = Math.max(320, Math.round(w * 0.72));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    shoot(((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H);
  });
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-new]').addEventListener('click', () => {
    sfx.click();
    wrap.querySelector('[data-new]').innerHTML = '↻ ' + (fa ? 'از اول' : 'Restart');
    reset();
  });
  targets = []; parts = [];
  score = 0; combo = 0; bestCombo = 0; hits = 0; shots = 0;
  time = 30; elapsed = 0; spawnT = 0; running = false;
  hud();
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    wrap.remove();
  };
}
