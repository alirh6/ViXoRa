// 🗼 Stack — برج‌سازی با یه ضربه: کمبو پرفکت، دوربین، رنگین‌کمان
import { pnum, sfx, vibrate, makeLoop } from '../arcade.js';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🗼 <b data-s>۰</b></span>' +
    '<span class="ag-pill">🔥 <b data-c>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:420px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'کلیک، اسپیس یا ضربه = گذاشتن بلوک. وسط‌چین = کمبو!' : 'Click, Space or tap = drop. Center it for combo!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const cEl = wrap.querySelector('[data-c]');
  let W = 380, H = 500;
  const BH = 26;
  let tower, cur, fall, score, combo, over, camY, camTarget, hue;

  function reset() {
    tower = [{ x: W / 2 - 90, w: 180 }];
    cur = { x: -100, w: 180, dir: 1, sp: 200 };
    fall = null;
    score = 0; combo = 0; over = false;
    camY = 0; camTarget = 0; hue = 190;
    hideOver();
    hud();
  }
  function hud() { sEl.textContent = pnum(score); cEl.textContent = pnum(combo); }
  function drop() {
    if (over) return;
    sfx.unlock();
    const prev = tower[tower.length - 1];
    const left = Math.max(prev.x, cur.x);
    const right = Math.min(prev.x + prev.w, cur.x + cur.w);
    const w = right - left;
    if (w <= 0) return gameOver();
    const off = Math.abs((cur.x + cur.w / 2) - (prev.x + prev.w / 2));
    // تکه اضافه می‌افته
    if (cur.x < prev.x) fall = { x: cur.x, w: prev.x - cur.x, vy: 0, side: -1 };
    else if (cur.x + cur.w > prev.x + prev.w) fall = { x: prev.x + prev.w, w: cur.x + cur.w - prev.x - prev.w, vy: 0, side: 1 };
    else fall = null;
    if (off < 9) {
      combo++;
      tower.push({ x: prev.x, w: prev.w });
      score += 1 + combo;
      sfx.coin();
      vibrate(15);
      if (combo >= 4 && prev.w < 190) {
        const last = tower[tower.length - 1];
        last.x -= 8; last.w += 16;
      }
    } else {
      combo = 0;
      tower.push({ x: left, w });
      score += 1;
      sfx.place();
    }
    hue = (hue + 7) % 360;
    const lvl = tower.length;
    cur = {
      x: lvl % 2 ? W + 20 : -w - 20,
      w: tower[tower.length - 1].w,
      dir: lvl % 2 ? -1 : 1,
      sp: Math.min(520, 200 + lvl * 9),
    };
    camTarget = Math.max(0, lvl * BH - (H - 160));
    hud();
  }
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    vibrate([60, 40, 60]);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🗼</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    if (!over) {
      cur.x += cur.dir * cur.sp * dt;
      if (cur.dir > 0 && cur.x > W + 30) { cur.x = -cur.w - 30; }
      if (cur.dir < 0 && cur.x + cur.w < -30) { cur.x = W + 30; }
    }
    if (fall) {
      fall.vy += 1400 * dt;
      fall.y = (fall.y || 0) + fall.vy * dt;
      if (fall.y > H) fall = null;
    }
    camY += (camTarget - camY) * Math.min(1, dt * 5);
    draw();
  });

  function blockColor(i) {
    return 'hsl(' + ((hue - i * 4 + 360) % 360) + ' 75% 58%)';
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1020');
    bg.addColorStop(1, '#131a33');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // ستاره‌ها
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 97) % W, sy = (i * 61 + camY * 0.2) % H;
      ctx.fillRect(sx, sy, 2, 2);
    }
    const baseY = H - 40 + camY;
    const lvl = tower.length;
    // برج
    for (let i = 0; i < lvl; i++) {
      const b = tower[i];
      const y = baseY - (i + 1) * BH;
      if (y < -BH || y > H + BH) continue;
      ctx.fillStyle = blockColor(lvl - i);
      ctx.fillRect(b.x, y, b.w, BH - 2);
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.fillRect(b.x, y, b.w, 4);
    }
    // بلوک متحرک
    if (!over) {
      const y = baseY - (lvl + 1) * BH;
      ctx.fillStyle = blockColor(0);
      ctx.globalAlpha = 0.95;
      ctx.fillRect(cur.x, y, cur.w, BH - 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(cur.x, y, cur.w, 4);
      // راهنمای وسط
      const prev = tower[lvl - 1];
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(prev.x + prev.w / 2, y - 4);
      ctx.lineTo(prev.x + prev.w / 2, y + BH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // تکه افتاده
    if (fall) {
      const y = baseY - (lvl + 1) * BH + (fall.y || 0);
      ctx.fillStyle = 'rgba(148,163,184,.7)';
      ctx.fillRect(fall.x, y, fall.w, BH - 2);
    }
    if (combo >= 2) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 ×' + combo, W / 2, 34);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(420, box.clientWidth - 24);
    const h = Math.round(w * 1.3);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); drop(); });
  function onKey(e) {
    if (e.key === ' ' || e.key === 'ArrowDown') { drop(); e.preventDefault(); }
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    window.removeEventListener('keydown', onKey);
    wrap.remove();
  };
}
