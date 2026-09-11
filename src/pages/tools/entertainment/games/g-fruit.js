// 🍉 Fruit Slice — میوه‌قاچ: رد شمشیر، کمبو، بمب
import { randi, choice, pnum, sfx, vibrate, makeLoop } from '../arcade.js';

const FRUITS = [
  { e: '🍉', r: 34 }, { e: '🍎', r: 28 }, { e: '🍊', r: 28 }, { e: '🍋', r: 26 },
  { e: '🍇', r: 26 }, { e: '🍑', r: 28 }, { e: '🥝', r: 24 }, { e: '🍒', r: 22 },
];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">❤️ <b data-l>❤❤❤</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:560px"><canvas data-cv style="width:100%;cursor:crosshair"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'انگشت یا موس رو بکش تا میوه‌ها قاچ بشن. 💣 = وای!' : 'Drag finger or mouse to slice. 💣 = ouch!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lEl = wrap.querySelector('[data-l]');
  let W = 520, H = 420;
  let items, halves, parts, trail, score, lives, over, started, spawnT, comboTxt, comboT, frozen;

  function reset() {
    items = []; halves = []; parts = []; trail = [];
    score = 0; lives = 3; over = false; started = false;
    spawnT = 0.5; comboTxt = ''; comboT = 0; frozen = 0;
    hideOver();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    lEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(Math.max(0, 3 - lives));
  }
  function spawnWave() {
    const n = randi(1, 3) + (score > 150 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const bomb = Math.random() < Math.min(0.22, 0.1 + score / 1500);
      const f = bomb ? { e: '💣', r: 26 } : choice(FRUITS);
      const x = W * (0.15 + Math.random() * 0.7);
      items.push({
        e: f.e, r: f.r, bomb,
        x, y: H + 30,
        vx: (W / 2 - x) * (0.6 + Math.random() * 0.5) + (Math.random() - 0.5) * 120,
        vy: -(H * (1.15 + Math.random() * 0.35)),
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6,
        sliced: false,
      });
    }
  }
  function segCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((cx - x1) * dx + (cy - y1) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + dx * t, py = y1 + dy * t;
    return (cx - px) * (cx - px) + (cy - py) * (cy - py) <= (r + 8) * (r + 8);
  }
  function sliceAt(x1, y1, x2, y2) {
    if (over || frozen > 0) return;
    started = true;
    let sliced = 0;
    for (const it of items) {
      if (it.sliced) continue;
      if (segCircle(x1, y1, x2, y2, it.x, it.y, it.r)) {
        it.sliced = true;
        sliced++;
        if (it.bomb) {
          lives--;
          frozen = 0.7;
          sfx.boom();
          vibrate([80, 40, 80]);
          burst(it.x, it.y, '#fb7185', 26);
          comboTxt = fa ? '💥 بمب!' : '💥 Bomb!';
          comboT = 1;
          hud();
          if (lives <= 0) { gameOver(); return; }
        } else {
          const gain = 10;
          score += gain;
          sfx.pop();
          halves.push({ e: it.e, r: it.r, x: it.x - 8, y: it.y, vx: it.vx * 0.4 - 90, vy: it.vy * 0.3 - 60, rot: 0, vr: -7, life: 1 });
          halves.push({ e: it.e, r: it.r, x: it.x + 8, y: it.y, vx: it.vx * 0.4 + 90, vy: it.vy * 0.3 - 60, rot: 0, vr: 7, life: 1 });
          burst(it.x, it.y, '#fef08a', 8);
        }
      }
    }
    items = items.filter((i) => !i.sliced);
    if (sliced >= 3) {
      const bonus = sliced * 15;
      score += bonus;
      comboTxt = '🔥 ' + (fa ? 'کمبو' : 'Combo') + ' ×' + pnum(sliced) + ' +' + pnum(bonus);
      comboT = 1.2;
      sfx.clear();
    }
    hud();
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 420, vy: (Math.random() - 0.6) * 420, life: 0.6, color });
  }
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🍉</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    frozen = Math.max(0, frozen - dt);
    comboT = Math.max(0, comboT - dt);
    if (started && !over && frozen <= 0) {
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnWave();
        spawnT = Math.max(0.55, 1.25 - score / 900);
      }
      const G = H * 2.4;
      for (const it of items) {
        it.vy += G * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
      }
      // میوه‌های افتاده = از دست دادن جان
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.y > H + 60) {
          items.splice(i, 1);
          if (!it.bomb) {
            lives--;
            sfx.hit();
            vibrate(40);
            hud();
            if (lives <= 0) gameOver();
          }
        }
      }
    }
    // نیمه‌ها و ذرات همیشه
    for (let i = halves.length - 1; i >= 0; i--) {
      const h = halves[i];
      h.vy += H * 2.4 * dt;
      h.x += h.vx * dt; h.y += h.vy * dt;
      h.rot += h.vr * dt; h.life -= dt;
      if (h.life <= 0 || h.y > H + 60) halves.splice(i, 1);
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 800 * dt; p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].life -= dt * 3;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }
    draw();
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1e1b4b');
    g.addColorStop(1, '#0b1020');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const it of items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(Math.sin(it.rot) * 0.3);
      ctx.font = it.r * 2 + 'px serif';
      ctx.fillText(it.e, 0, 0);
      ctx.restore();
    }
    for (const h of halves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, h.life);
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      ctx.font = h.r * 2 + 'px serif';
      ctx.fillText(h.e, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life * 1.6);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // رد شمشیر
    if (trail.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        ctx.strokeStyle = 'rgba(34,211,238,' + (trail[i].life * 0.9) + ')';
        ctx.lineWidth = 2 + trail[i].life * 6;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
    }
    if (comboT > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 24px system-ui';
      ctx.fillText(comboTxt, W / 2, 44);
    }
    if (!started && !over) {
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 21px system-ui';
      ctx.fillText(fa ? '🔪 بکش تا قاچ کنی!' : '🔪 Swipe to slice!', W / 2, H / 2);
    }
    if (frozen > 0) {
      ctx.fillStyle = 'rgba(225,29,72,.22)';
      ctx.fillRect(0, 0, W, H);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(560, box.clientWidth - 24);
    const h = Math.max(340, Math.round(w * 0.78));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }
  let drawing = false, lx = 0, ly = 0;
  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sfx.unlock();
    drawing = true;
    const p = pos(e);
    lx = p.x; ly = p.y;
    trail.push({ x: p.x, y: p.y, life: 1 });
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    sliceAt(lx, ly, p.x, p.y);
    trail.push({ x: p.x, y: p.y, life: 1 });
    lx = p.x; ly = p.y;
  });
  ['pointerup', 'pointercancel'].forEach((t) => canvas.addEventListener(t, () => { drawing = false; }));
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    wrap.remove();
  };
}
