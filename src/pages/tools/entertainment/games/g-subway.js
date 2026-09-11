// 🛹 موج‌سوار مترو — رانر ۳ لاینه: قطار، مانع، سکه و پاورآپ
import { pnum, vibrate, makeLoop, rand, clamp } from '../arcade.js';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const { sfx } = api;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">🪙 <b data-c>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:430px"><canvas data-cv width="420" height="640" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button></div>' +
    (coarse ? '<div class="ag-trow"><button class="ag-tbtn" type="button" data-left>◀</button><button class="ag-tbtn" type="button" data-jump>⤒ ' + (fa ? 'پرش' : 'Jump') + '</button><button class="ag-tbtn" type="button" data-slide>⤓ ' + (fa ? 'غلت' : 'Roll') + '</button><button class="ag-tbtn" type="button" data-right>▶</button></div>' : '') +
    '<div class="ag-hint">' + (fa ? '◀ ▶ تغییر خط · ↑ پرش · ↓ غلت · سوایپ هم کار می‌کند' : '◀ ▶ switch lane · ↑ jump · ↓ roll · swipe works too') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const cEl = wrap.querySelector('[data-c]');
  const W = 420, H = 640, PY = H - 150;
  const LANES = [70, 210, 350];
  let lane, px, jumpT, slideT, leanT, speed, dist, coins, score, mult, multT, magT, shield, invT;
  let ents, parts, over, overT, started, paused, spawnT, powT, railOff, shake, best;

  function reset() {
    lane = 0; px = LANES[1]; jumpT = 0; slideT = 0; leanT = 0;
    speed = 430; dist = 0; coins = 0; score = 0; mult = 1; multT = 0; magT = 0;
    shield = false; invT = 0;
    ents = []; parts = []; over = false; overT = 0; started = false; paused = false;
    spawnT = 1.1; powT = 18; railOff = 0; shake = 0;
    best = api.getBest();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(Math.floor(score));
    cEl.textContent = pnum(coins);
    wrap.querySelector('[data-b]').textContent = pnum(Math.max(best, Math.floor(score)));
  }
  function bover() {
    const o = wrap.querySelector('[data-over]');
    if (o) o.remove();
  }
  function showIntro() {
    bover();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🛹 ' + (fa ? 'موج‌سوار مترو' : 'Subway Rush') + '</h2>' +
      '<p>' + (fa ? '🚇 از قطارها فرار کن، از روی موانع <b>بپر</b>، زیر میله‌ها <b>غلت بزن</b>!' : '🚇 Dodge trains, <b>jump</b> barriers, <b>roll</b> under bars!') + '</p>' +
      '<p>🪙 ' + (fa ? 'سکه جمع کن · 🧲 آهنربا · 🛡 سپر · ✌ امتیاز دوبرابر' : 'Grab coins · 🧲 magnet · 🛡 shield · ✌ 2x score') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '🏃 شروع دویدن' : '🏃 Start running') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }
  function gameOver() {
    over = true; overT = 0.9;
    sfx.hit(); vibrate(80); shake = 14;
  }
  function showOver() {
    const sc = Math.floor(score);
    const r = api.submitScore(sc);
    best = Math.max(best, sc);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>💥</h2><div class="ag-big">' + pnum(sc) + '</div>' +
      '<p>🪙 ' + pnum(coins) + ' · 🛣 ' + pnum(Math.floor(dist)) + 'm' + (r.isBest ? ' · 🏆 ' + (fa ? 'رکورد جدید!' : 'New best!') : '') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '↻ دوباره' : '↻ Retry') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.click(); bover(); reset(); started = true;
    });
  }

  function goLeft() { if (!started || over || paused) return; if (lane > -1) { lane--; leanT = 0.25; sfx.tick(); } }
  function goRight() { if (!started || over || paused) return; if (lane < 1) { lane++; leanT = 0.25; sfx.tick(); } }
  function doJump() { if (!started || over || paused) return; if (jumpT <= 0) { jumpT = 0.72; slideT = 0; sfx.jump(); } }
  function doSlide() { if (!started || over || paused) return; if (slideT <= 0 && jumpT <= 0.25) { slideT = 0.72; jumpT = 0; sfx.tick(); } }

  function spawnRow() {
    const diff = clamp(dist / 2500, 0, 1);
    const nBlock = Math.random() < 0.25 + diff * 0.45 ? 2 : 1;
    const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
    const y = -140;
    for (let i = 0; i < nBlock; i++) {
      const L = lanes[i];
      const r = Math.random();
      let type = 'barrier';
      if (r < 0.34) type = 'train';
      else if (r < 0.62) type = 'lowbar';
      // قطار دوم در همان ردیف ممنوع اگر سومی هم بسته است
      ents.push({ k: 'ob', lane: L, y: y - Math.random() * 30, type, w: 104, h: type === 'train' ? 230 : type === 'lowbar' ? 26 : 58, seed: Math.random() * 9 });
    }
    // سکه در لاین آزاد
    const free = lanes[nBlock] !== undefined ? lanes[nBlock] : lanes[2];
    if (Math.random() < 0.8) {
      const n = 4 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) ents.push({ k: 'coin', lane: free, y: y - i * 52 - 40 });
    }
  }
  function spawnPow() {
    const kinds = ['magnet', 'shield', 'mult'];
    ents.push({ k: 'pow', pow: kinds[(Math.random() * 3) | 0], lane: [-1, 0, 1][(Math.random() * 3) | 0], y: -80 });
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 14); i++) {
      parts.push({ x, y, vx: rand(-260, 260), vy: rand(-380, -60), g: 900, t: rand(0.4, 0.9), c: color, r: rand(2, 5) });
    }
  }

  function crash(ob) {
    if (invT > 0) return;
    if (shield) {
      shield = false; invT = 1.6;
      burst(px, PY - 50, '#5ff', 22);
      sfx.boom(); vibrate(40);
      ob.dead = true;
      score += 50;
      return;
    }
    gameOver();
  }

  function update(dt) {
    if (!started || paused) return;
    if (over) {
      overT -= dt;
      if (overT <= 0 && !wrap.querySelector('[data-over]')) showOver();
      return;
    }
    speed = Math.min(950, speed + dt * 11);
    dist += (speed * dt) / 48;
    score += (speed * dt) / 48 * mult;
    railOff = (railOff + speed * dt) % 64;
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
    if (invT > 0) invT -= dt;
    if (multT > 0) { multT -= dt; if (multT <= 0) mult = 1; }
    if (magT > 0) magT -= dt;
    if (leanT > 0) leanT -= dt;
    if (jumpT > 0) jumpT -= dt;
    if (slideT > 0) slideT -= dt;
    const tx = LANES[lane + 1];
    px += (tx - px) * Math.min(1, dt * 13);

    spawnT -= dt;
    if (spawnT <= 0) {
      spawnRow();
      const gap = clamp(1.35 - speed / 1300, 0.5, 1.35);
      spawnT = gap * rand(0.85, 1.2);
    }
    powT -= dt;
    if (powT <= 0) { spawnPow(); powT = rand(16, 26); }

    const jH = jumpT > 0 ? Math.sin((jumpT / 0.72) * Math.PI) * 150 : 0;
    const sliding = slideT > 0;
    for (const e of ents) {
      e.y += speed * dt;
      if (magT > 0 && e.k === 'coin') {
        const ex = LANES[e.lane + 1];
        const dx = px - ex, dy = (PY - 50) - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 170 && d > 1) { e.y += (dy / d) * 420 * dt; e.laneOff = (e.laneOff || 0) + (dx / d) * 420 * dt; }
      }
    }
    ents = ents.filter((e) => e.y < H + 260 && !e.dead);
    // برخوردها
    for (const e of ents) {
      const ex = LANES[e.lane + 1] + (e.laneOff || 0);
      if (e.k === 'coin') {
        if (Math.abs(e.y - (PY - 50 + (jH ? -jH : 0))) < 46 && Math.abs(ex - px) < 52) {
          e.dead = true; coins++; score += 10 * mult; sfx.coin();
          burst(ex, e.y, '#fd3', 6);
        }
      } else if (e.k === 'pow') {
        if (Math.abs(e.y - (PY - 50)) < 52 && Math.abs(ex - px) < 56) {
          e.dead = true;
          if (e.pow === 'magnet') { magT = 8; }
          else if (e.pow === 'shield') { shield = true; }
          else { mult = 2; multT = 10; }
          sfx.level(); burst(ex, e.y, '#5f8', 16);
        }
      } else if (!e.dead) {
        const top = e.y - e.h / 2, bot = e.y + e.h / 2;
        const feet = PY - (jH || 0);
        const head = feet - (sliding ? 34 : 84);
        const overlapY = bot > head + 8 && top < feet - 6;
        if (overlapY && Math.abs(ex - px) < 62) {
          if (e.type === 'train') crash(e);
          else if (e.type === 'barrier') { if (jH < 62) crash(e); }
          else if (jH > 8 || !sliding) { if (!sliding || jH > 8) crash(e); }
        }
      }
    }
    // ذرات
    for (const p of parts) { p.t -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    parts = parts.filter((p) => p.t > 0);
    hud();
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function render(t) {
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4);
    // پس‌زمینه تونل
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1024'); bg.addColorStop(0.6, '#141a38'); bg.addColorStop(1, '#0a0d20');
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    // دیوارها
    ctx.fillStyle = '#1b2140';
    ctx.fillRect(0, 0, 26, H); ctx.fillRect(W - 26, 0, 26, H);
    ctx.fillStyle = '#2c3a72';
    for (let y = -64 + railOff; y < H + 64; y += 64) {
      ctx.fillRect(4, y, 18, 30); ctx.fillRect(W - 22, y, 18, 30);
    }
    ctx.fillStyle = 'rgba(0,255,220,.5)';
    ctx.fillRect(26, 0, 3, H); ctx.fillRect(W - 29, 0, 3, H);
    // ریل‌ها
    for (const lx of LANES) {
      ctx.fillStyle = '#232a4d';
      ctx.fillRect(lx - 52, 0, 104, H);
      ctx.fillStyle = '#313a68';
      for (let y = -64 + railOff; y < H + 64; y += 42) ctx.fillRect(lx - 46, y, 92, 12);
      ctx.fillStyle = '#4d5a96';
      ctx.fillRect(lx - 40, 0, 5, H); ctx.fillRect(lx + 35, 0, 5, H);
    }
    // موجودیت‌ها (دور به نزدیک)
    const sorted = [...ents].sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      const ex = LANES[e.lane + 1] + (e.laneOff || 0);
      if (e.k === 'coin') {
        const sp = Math.abs(Math.sin(t * 6 + e.y * 0.05));
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.beginPath(); ctx.ellipse(ex, e.y + 14, 12, 4, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffd93b';
        ctx.beginPath(); ctx.ellipse(ex, e.y, 6 + sp * 8, 14, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#a86e00';
        ctx.beginPath(); ctx.ellipse(ex, e.y, 3 + sp * 4, 8, 0, 0, 7); ctx.fill();
      } else if (e.k === 'pow') {
        ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.pow === 'magnet' ? '🧲' : e.pow === 'shield' ? '🛡' : '✌️', ex, e.y + Math.sin(t * 4) * 5);
      } else if (e.type === 'train') {
        const w = 104, h = e.h, x = ex - w / 2, y = e.y - h / 2;
        ctx.fillStyle = 'rgba(0,0,0,.4)';
        rr(x + 5, y + 8, w, h, 14); ctx.fill();
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, '#3742a8'); g.addColorStop(0.5, '#5a6ff0'); g.addColorStop(1, '#3742a8');
        ctx.fillStyle = g;
        rr(x, y, w, h, 14); ctx.fill();
        ctx.fillStyle = '#20265e';
        ctx.fillRect(x + 10, y + 18, w - 20, 44);
        ctx.fillStyle = '#9fe8ff';
        ctx.fillRect(x + 14, y + 22, w - 28, 36);
        for (let wy = y + 86; wy < y + h - 30; wy += 54) {
          ctx.fillStyle = '#20265e';
          ctx.fillRect(x + 10, wy, w - 20, 36);
          ctx.fillStyle = (e.seed + wy) % 2 < 1 ? '#ffe9a3' : '#9fe8ff';
          ctx.fillRect(x + 14, wy + 4, w - 28, 28);
        }
        ctx.fillStyle = '#ffdf3b';
        ctx.beginPath(); ctx.arc(x + 22, y + h - 14, 7, 0, 7); ctx.arc(x + w - 22, y + h - 14, 7, 0, 7); ctx.fill();
      } else if (e.type === 'barrier') {
        const w = 104, x = ex - w / 2, y = e.y - 29;
        ctx.fillStyle = '#5a5f7a';
        ctx.fillRect(x + 8, y, 10, 58); ctx.fillRect(x + w - 18, y, 10, 58);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i % 2 ? '#fff' : '#ff3b5c';
          ctx.fillRect(x + 8, y + 6 + i * 16, w - 16, 15);
        }
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.fillRect(x + 8, y + 2, w - 16, 4);
      } else {
        const w = 104, x = ex - w / 2, y = e.y - 13;
        ctx.fillStyle = '#5a5f7a';
        ctx.fillRect(x + 4, y - 64, 9, 78); ctx.fillRect(x + w - 13, y - 64, 9, 78);
        ctx.fillStyle = '#ffb02e';
        rr(x, y, w, 26, 8); ctx.fill();
        ctx.fillStyle = '#7a3c00';
        ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('▼ ▼ ▼', ex, y + 14);
      }
    }
    // بازیکن
    const jH = jumpT > 0 ? Math.sin((jumpT / 0.72) * Math.PI) * 150 : 0;
    const sliding = slideT > 0;
    const feet = PY - jH;
    if (!(invT > 0 && ((t * 12) | 0) % 2)) {
      const lean = clamp((tx0() - px) * 0.02, -0.3, 0.3);
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.ellipse(px, PY + 8, 26 * (1 - jH / 400), 8, 0, 0, 7); ctx.fill();
      ctx.save();
      ctx.translate(px, feet);
      ctx.rotate(lean);
      if (sliding) {
        ctx.fillStyle = '#ff5c8a';
        rr(-30, -34, 60, 30, 12); ctx.fill();
        ctx.fillStyle = '#ffd9a3';
        ctx.beginPath(); ctx.arc(22, -20, 11, 0, 7); ctx.fill();
      } else {
        const run = Math.sin(t * (over ? 2 : 16)) * (over ? 2 : 6);
        ctx.fillStyle = '#22263f';
        rr(-16, -8 + run * 0.4, 12, 10, 4); ctx.fill();
        rr(4, -8 - run * 0.4, 12, 10, 4); ctx.fill();
        ctx.fillStyle = '#2f6df6';
        rr(-13, -52 + run * 0.3, 26, 46, 9); ctx.fill();
        ctx.fillStyle = '#ff5c8a';
        rr(-13, -52 + run * 0.3, 26, 16, 8); ctx.fill();
        ctx.fillStyle = '#ffd9a3';
        ctx.beginPath(); ctx.arc(0, -62 + run * 0.3, 12, 0, 7); ctx.fill();
        ctx.fillStyle = '#22263f';
        ctx.beginPath(); ctx.arc(0, -66 + run * 0.3, 12, Math.PI, 0); ctx.fill();
      }
      ctx.restore();
      if (shield) {
        ctx.strokeStyle = 'rgba(90,255,255,.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px, feet - 40, 52, 0, 7); ctx.stroke();
      }
      if (magT > 0) {
        ctx.strokeStyle = 'rgba(255,80,120,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, feet - 40, 66 + Math.sin(t * 6) * 5, 0, 7); ctx.stroke();
      }
    }
    // ذرات
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.t * 2, 0, 1);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // پاورهای فعال
    ctx.font = '22px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let pi = 0;
    if (magT > 0) ctx.fillText('🧲' + Math.ceil(magT), 34, 8 + pi++ * 28);
    if (mult > 1) ctx.fillText('✌️' + Math.ceil(multT), 34, 8 + pi++ * 28);
    if (shield) ctx.fillText('🛡', 34, 8 + pi++ * 28);
    ctx.restore();
  }
  function tx0() { return LANES[lane + 1]; }

  const loop = makeLoop((dt, t) => { update(dt); render(t); });
  function onKey(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { goLeft(); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { goRight(); e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') { doJump(); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { doSlide(); e.preventDefault(); }
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
  }
  function togglePause() {
    if (!started || over) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
  }
  let swX = 0, swY = 0, swOn = false;
  function onDown(e) {
    const p = e.touches ? e.touches[0] : e;
    swX = p.clientX; swY = p.clientY; swOn = true;
  }
  function onUp(e) {
    if (!swOn) return; swOn = false;
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dx = p.clientX - swX, dy = p.clientY - swY;
    if (Math.hypot(dx, dy) < 24) { doJump(); return; }
    if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) goRight(); else goLeft(); }
    else { if (dy < 0) doJump(); else doSlide(); }
  }
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  canvas.addEventListener('touchend', onUp, { passive: true });
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); bover(); reset(); started = true; });
  wrap.querySelector('[data-pause]').addEventListener('click', () => { sfx.click(); togglePause(); });
  const bl = wrap.querySelector('[data-left]');
  if (bl) {
    bl.addEventListener('click', goLeft);
    wrap.querySelector('[data-right]').addEventListener('click', goRight);
    wrap.querySelector('[data-jump]').addEventListener('click', doJump);
    wrap.querySelector('[data-slide]').addEventListener('click', doSlide);
  }

  reset();
  showIntro();
  loop.start();
  return function destroy() {
    loop.stop();
    window.removeEventListener('keydown', onKey);
    try { api.submitScore(Math.floor(score)); } catch { /* ignore */ }
  };
}
