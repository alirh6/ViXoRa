// 🧷 Breakout — آجربریک: مرحله‌ها، پاورآپ، توپ چندتایی
import { randi, pnum, sfx, vibrate, makeLoop, clamp } from '../arcade.js';

const BRICK_C = ['#fb7185', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa'];
const POWER_KINDS = ['wide', 'multi', 'slow', 'life'];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">❤️ <b data-l>۳</b></span>' +
    '<span class="ag-pill">🗺 <b data-lv>۱</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:480px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'موس، جهت‌ها یا انگشت: حرکت. 🚀 پاورآپ‌ها رو بگیر!' : 'Mouse, arrows or finger to move. Catch 🚀 powerups!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lEl = wrap.querySelector('[data-l]');
  const lvEl = wrap.querySelector('[data-lv]');
  let W = 440, H = 520;
  let pad, balls, bricks, powers, parts, score, lives, level, state, keys;

  function levelLayout(lv) {
    const rows = 4 + Math.min(3, lv);
    const cols = 8;
    const arr = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if ((r + c + lv) % 9 === 0) continue;
      const hp = (r === 0 && lv > 1) || (lv >= 3 && (r * 7 + c * 3 + lv) % 5 === 0) ? 2 : 1;
      arr.push({ r, c, hp, maxHp: hp });
    }
    return { rows, cols, arr };
  }
  function reset(full) {
    if (full) { score = 0; lives = 3; level = 1; }
    pad = { w: 92, x: W / 2 };
    balls = [{ x: W / 2, y: H - 80, vx: 0, vy: 0, stuck: true, sp: 330 + level * 25 }];
    powers = [];
    parts = [];
    const L = levelLayout(level);
    bricks = L;
    state = 'serve';
    keys = {};
    hideOver();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    lEl.textContent = pnum(lives);
    lvEl.textContent = pnum(level);
  }
  function brickRect(b) {
    const { rows, cols } = bricks;
    const gap = 6, top = 64, side = 12;
    const bw = (W - side * 2 - gap * (cols - 1)) / cols;
    const bh = 24;
    return { x: side + b.c * (bw + gap), y: top + b.r * (bh + gap), w: bw, h: bh };
  }
  function serve() {
    if (state !== 'serve') return;
    state = 'play';
    for (const b of balls) {
      if (b.stuck) { b.stuck = false; const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.9; b.vx = Math.cos(a) * b.sp; b.vy = Math.sin(a) * b.sp; }
    }
    sfx.jump();
  }
  function burst(x, y, color) {
    for (let i = 0; i < 10; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 320, vy: (Math.random() - 0.7) * 320, life: 0.5, color });
  }
  function maybePower(x, y) {
    if (Math.random() < 0.22) powers.push({ x, y, vy: 130, kind: POWER_KINDS[randi(0, 3)] });
  }
  function applyPower(k) {
    if (k === 'wide') { pad.w = Math.min(170, pad.w + 34); sfx.coin(); }
    else if (k === 'life') { lives++; sfx.level(); }
    else if (k === 'slow') { for (const b of balls) { b.vx *= 0.8; b.vy *= 0.8; b.sp *= 0.85; } sfx.coin(); }
    else if (k === 'multi' && balls.length < 6) {
      const src = balls.slice();
      for (const b of src) {
        if (balls.length >= 6) break;
        const sp = Math.hypot(b.vx, b.vy) || b.sp;
        const a = Math.atan2(b.vy, b.vx) + (Math.random() > 0.5 ? 0.5 : -0.5);
        balls.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, stuck: false, sp: b.sp });
      }
      sfx.clear();
    }
    hud();
  }
  function loseLife() {
    lives--;
    sfx.hit();
    vibrate(60);
    hud();
    if (lives <= 0) return gameOver();
    balls = [{ x: pad.x, y: H - 80, vx: 0, vy: 0, stuck: true, sp: 330 + level * 25 }];
    pad.w = 92;
    state = 'serve';
  }
  function gameOver() {
    state = 'over';
    const r = api.submitScore(score);
    sfx.lose();
    showOverlay('<h2>' + (fa ? 'بازی تمام شد!' : 'Game Over!') + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>');
  }
  function levelClear() {
    api.submitScore(score);
    sfx.win();
    level++;
    showOverlay('<h2>🎉 ' + (fa ? 'مرحله پاک شد!' : 'Level clear!') + '</h2>' +
      '<p>' + (fa ? 'مرحله ' : 'Level ') + pnum(level) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? 'بعدی ▶' : 'Next ▶') + '</button>', true);
  }
  function showOverlay(html, keepScore) {
    hideOver();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = html;
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(!keepScore); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    if (state === 'play' || state === 'serve') {
      if (keys.left) pad.x -= 420 * dt;
      if (keys.right) pad.x += 420 * dt;
      pad.x = clamp(pad.x, pad.w / 2 + 4, W - pad.w / 2 - 4);
      const py = H - 46;
      for (const b of balls) {
        if (b.stuck) { b.x = pad.x; b.y = py - 12; continue; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < 10) { b.x = 10; b.vx = Math.abs(b.vx); sfx.tick(); }
        if (b.x > W - 10) { b.x = W - 10; b.vx = -Math.abs(b.vx); sfx.tick(); }
        if (b.y < 10) { b.y = 10; b.vy = Math.abs(b.vy); sfx.tick(); }
        // پدل
        if (b.vy > 0 && b.y + 8 >= py && b.y + 8 <= py + 18 && Math.abs(b.x - pad.x) <= pad.w / 2 + 8) {
          const off = (b.x - pad.x) / (pad.w / 2);
          const sp = Math.min(620, Math.hypot(b.vx, b.vy) * 1.015);
          const a = -Math.PI / 2 + off * 1.05;
          b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
          b.y = py - 9;
          sfx.pop();
        }
        // آجرها
        for (let i = bricks.arr.length - 1; i >= 0; i--) {
          const br = bricks.arr[i];
          const R = brickRect(br);
          if (b.x + 8 > R.x && b.x - 8 < R.x + R.w && b.y + 8 > R.y && b.y - 8 < R.y + R.h) {
            const dxL = b.x + 8 - R.x, dxR = R.x + R.w - (b.x - 8);
            const dyT = b.y + 8 - R.y, dyB = R.y + R.h - (b.y - 8);
            const m = Math.min(dxL, dxR, dyT, dyB);
            if (m === dxL) b.vx = -Math.abs(b.vx);
            else if (m === dxR) b.vx = Math.abs(b.vx);
            else if (m === dyT) b.vy = -Math.abs(b.vy);
            else b.vy = Math.abs(b.vy);
            br.hp--;
            if (br.hp <= 0) {
              bricks.arr.splice(i, 1);
              score += 10 * level;
              burst(R.x + R.w / 2, R.y + R.h / 2, BRICK_C[br.r % 6]);
              maybePower(R.x + R.w / 2, R.y);
              sfx.pop();
            } else sfx.tick();
            hud();
            break;
          }
        }
      }
      balls = balls.filter((b) => b.y < H + 30);
      if (!balls.length && state === 'play') loseLife();
      if (!bricks.arr.length && state === 'play') { state = 'clear'; levelClear(); }
      // پاورآپ‌ها
      for (let i = powers.length - 1; i >= 0; i--) {
        const p = powers[i];
        p.y += p.vy * dt;
        if (p.y >= py - 6 && p.y <= py + 20 && Math.abs(p.x - pad.x) <= pad.w / 2 + 10) {
          applyPower(p.kind);
          powers.splice(i, 1);
        } else if (p.y > H + 20) powers.splice(i, 1);
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt;
        if (p.life <= 0) parts.splice(i, 1);
      }
    }
    draw();
  });

  const P_EMOJI = { wide: '↔️', multi: '✨', slow: '🐌', life: '❤️' };
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(0, 0, W, H);
    for (const br of bricks.arr) {
      const R = brickRect(br);
      ctx.fillStyle = br.hp > 1 ? '#e2e8f0' : BRICK_C[br.r % 6];
      ctx.beginPath();
      ctx.roundRect(R.x, R.y, R.w, R.h, 6);
      ctx.fill();
      if (br.hp > 1) {
        ctx.fillStyle = BRICK_C[br.r % 6];
        ctx.beginPath();
        ctx.roundRect(R.x + 3, R.y + 3, R.w - 6, R.h - 6, 4);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.fillRect(R.x + 5, R.y + 3, R.w - 10, 3);
    }
    // پدل
    const py = H - 46;
    const pg = ctx.createLinearGradient(pad.x - pad.w / 2, 0, pad.x + pad.w / 2, 0);
    pg.addColorStop(0, '#22d3ee'); pg.addColorStop(1, '#a78bfa');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.roundRect(pad.x - pad.w / 2, py, pad.w, 16, 8);
    ctx.fill();
    // توپ‌ها
    for (const b of balls) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 8, 0, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // پاورآپ
    ctx.font = '22px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of powers) ctx.fillText(P_EMOJI[p.kind], p.x, p.y);
    // ذرات
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    if (state === 'serve') {
      ctx.fillStyle = '#fff';
      ctx.font = '900 17px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fa ? '👆 ضربه بزن تا توپ پرتاب شه!' : '👆 Tap to launch!', W / 2, H / 2);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(480, box.clientWidth - 24);
    const h = Math.round(w * 1.18);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }
  function onKey(e, down) {
    if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = down; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = down; e.preventDefault(); }
    else if (down && e.key === ' ') { serve(); e.preventDefault(); }
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);
  function pointTo(x) {
    const rect = canvas.getBoundingClientRect();
    pad.x = clamp(((x - rect.left) / rect.width) * W, pad.w / 2 + 4, W - pad.w / 2 - 4);
  }
  canvas.addEventListener('pointerdown', (e) => { serve(); pointTo(e.clientX); });
  canvas.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') pointTo(e.clientX); });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(true); });
  reset(true);
  resize();
  loop.start();
  // هک تمیز: levelClear از showOverlay با restart=false استفاده می‌کند
  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    wrap.remove();
  };
}
