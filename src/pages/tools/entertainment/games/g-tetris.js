// 🧩 Tetris — کامل: hold، سایه، کمبو، مرحله، 7-bag
import { shuffle, pnum, sfx, vibrate, makeLoop } from '../arcade.js';

const COLS = 10, ROWS = 20;
const SHAPES = [
  { m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], c: '#22d3ee' },
  { m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], c: '#60a5fa' },
  { m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], c: '#fb923c' },
  { m: [[1, 1], [1, 1]], c: '#facc15' },
  { m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], c: '#4ade80' },
  { m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], c: '#c084fc' },
  { m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], c: '#fb7185' },
];
const KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">🗺 <b data-lv>۱</b></span>' +
    '<span class="ag-pill">📏 <b data-ln>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:430px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-trow"><button class="ag-tbtn" type="button" data-k="left">◀</button>' +
    '<button class="ag-tbtn" type="button" data-k="right">▶</button>' +
    '<button class="ag-tbtn" type="button" data-k="down">⬇</button>' +
    '<button class="ag-tbtn" type="button" data-k="rot">⟳</button>' +
    '<button class="ag-tbtn" type="button" data-k="hard">⤓</button>' +
    '<button class="ag-tbtn" type="button" data-k="hold">📦</button></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? '←→ حرکت · ↓ نرم · Space فرود · ↑ چرخش · C نگه‌داشتن' : '←→ move · ↓ soft · Space hard · ↑ rotate · C hold') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lvEl = wrap.querySelector('[data-lv]');
  const lnEl = wrap.querySelector('[data-ln]');
  let cell = 24, W = 0, H = 0;
  let grid, bag, cur, hold, canHold, score, level, lines, combo, over, paused, dropAcc, lockResets, flash, parts;

  function reset() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    bag = [];
    hold = null; canHold = true;
    score = 0; level = 1; lines = 0; combo = -1;
    over = false; paused = false; dropAcc = 0; lockResets = 0; flash = [];
    parts = [];
    keys.left = keys.right = keys.down = false;
    hideOver();
    spawn();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    lvEl.textContent = pnum(level);
    lnEl.textContent = pnum(lines);
  }
  function refillBag() {
    if (!bag.length) bag = shuffle([0, 1, 2, 3, 4, 5, 6]);
  }
  function spawn() {
    refillBag();
    const t = bag.shift();
    cur = { t, m: SHAPES[t].m.map((r) => r.slice()), x: 3, y: t === 0 ? -1 : 0 };
    if (t === 3) cur.x = 4;
    canHold = true;
    lockResets = 0;
    dropAcc = 0;
    if (collide(cur.m, cur.x, cur.y)) gameOver();
  }
  function collide(m, px, py) {
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const x = px + c, y = py + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && grid[y][x]) return true;
    }
    return false;
  }
  function rotCW(m) {
    const N = m.length;
    return Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => m[N - 1 - c][r]));
  }
  function doRotate() {
    if (!cur || over || paused) return;
    const rm = rotCW(cur.m);
    for (const [kx, ky] of KICKS) {
      if (!collide(rm, cur.x + kx, cur.y + ky)) {
        cur.m = rm; cur.x += kx; cur.y += ky;
        sfx.tick();
        lockResets = Math.min(15, lockResets + 1);
        return;
      }
    }
  }
  function doMove(dx) {
    if (!cur || over || paused) return;
    if (!collide(cur.m, cur.x + dx, cur.y)) {
      cur.x += dx;
      lockResets = Math.min(15, lockResets + 1);
    }
  }
  function ghostY() {
    let y = cur.y;
    while (!collide(cur.m, cur.x, y + 1)) y++;
    return y;
  }
  function hardDrop() {
    if (!cur || over || paused) return;
    const gy = ghostY();
    score += (gy - cur.y) * 2;
    cur.y = gy;
    sfx.hit();
    vibrate(20);
    lock();
  }
  function doHold() {
    if (!cur || over || paused || !canHold) return;
    sfx.flip();
    canHold = false;
    if (hold === null) {
      hold = cur.t;
      spawn();
      canHold = false;
    } else {
      const t = hold;
      hold = cur.t;
      cur = { t, m: SHAPES[t].m.map((r) => r.slice()), x: t === 3 ? 4 : 3, y: t === 0 ? -1 : 0 };
      if (collide(cur.m, cur.x, cur.y)) gameOver();
    }
  }
  function lock() {
    for (let r = 0; r < cur.m.length; r++) for (let c = 0; c < cur.m[r].length; c++) {
      if (cur.m[r][c] && cur.y + r >= 0) grid[cur.y + r][cur.x + c] = SHAPES[cur.t].c;
    }
    sfx.place();
    const full = [];
    for (let r = 0; r < ROWS; r++) if (grid[r].every(Boolean)) full.push(r);
    if (full.length) {
      combo++;
      const pts = [0, 100, 300, 500, 800][full.length] * level + Math.max(0, combo) * 50 * level;
      score += pts;
      lines += full.length;
      flash = full.map((r) => ({ r, t: 0.22 }));
      for (const r of full) for (let c = 0; c < COLS; c++) parts.push({ x: (c + 0.5) * cell, y: (r + 0.5) * cell, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300, life: 0.5, c: grid[r][c] || '#fff' });
      grid = grid.filter((_, r) => !full.includes(r));
      while (grid.length < ROWS) grid.unshift(Array(COLS).fill(null));
      if (full.length === 4) { sfx.level(); vibrate([30, 40, 30]); } else sfx.clear();
      const nl = Math.floor(lines / 10) + 1;
      if (nl !== level) { level = nl; sfx.win(); }
      hud();
      if (score > 0) api.submitScore(score);
    } else {
      combo = -1;
      hud();
    }
    spawn();
  }
  function gravity() { return Math.max(0.045, 0.85 * Math.pow(0.88, level - 1)); }
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🧩</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>📏 ' + pnum(lines) + (fa ? ' خط' : ' lines') + '</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const keys = { left: false, right: false, down: false };
  const das = { left: 0, right: 0, down: 0 };
  const loop = makeLoop((dt) => {
    if (!over && !paused && cur) {
      // DAS
      for (const k of ['left', 'right']) {
        if (keys[k]) {
          das[k] += dt;
          if (das[k] > 0.15) { doMove(k === 'left' ? -1 : 1); das[k] = 0.15 - 0.045; }
        }
      }
      if (keys.down) {
        das.down += dt;
        if (das.down > 0.03) {
          das.down = 0;
          if (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; score += 1; }
          else lock();
        }
      }
      dropAcc += dt;
      if (dropAcc >= gravity()) {
        dropAcc = 0;
        if (!collide(cur.m, cur.x, cur.y + 1)) cur.y++;
        else if (lockResets < 15) { /* wait for move */ lockResets++; }
        else lock();
      }
    }
    for (let i = flash.length - 1; i >= 0; i--) { flash[i].t -= dt; if (flash[i].t <= 0) flash.splice(i, 1); }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    draw();
  });

  function drawCell(x, y, color, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, 4);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(x * cell + 1, (y + 1) * cell - 5, cell - 2, 4);
    ctx.globalAlpha = 1;
  }
  function drawMini(m, color, ox, oy, cs) {
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + c * cs, oy + r * cs, cs - 1, cs - 1);
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0, 0, COLS * cell, ROWS * cell);
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(COLS * cell, r * cell); ctx.stroke(); }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) drawCell(c, r, grid[r][c]);
    if (cur && !over) {
      const gy = ghostY();
      const col = SHAPES[cur.t].c;
      for (let r = 0; r < cur.m.length; r++) for (let c = 0; c < cur.m[r].length; c++) {
        if (!cur.m[r][c]) continue;
        if (gy + r >= 0) {
          ctx.strokeStyle = col;
          ctx.globalAlpha = 0.4;
          ctx.strokeRect((cur.x + c) * cell + 1, (gy + r) * cell + 1, cell - 2, cell - 2);
          ctx.globalAlpha = 1;
        }
        if (cur.y + r >= 0) drawCell(cur.x + c, cur.y + r, col);
      }
    }
    for (const f of flash) {
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.8, f.t * 3) + ')';
      ctx.fillRect(0, f.r * cell, COLS * cell, cell);
    }
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
    // پنل کناری
    const px = COLS * cell + 10;
    ctx.fillStyle = '#9aa5c4';
    ctx.font = '700 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(fa ? 'نگه‌داشته' : 'HOLD', px, 16);
    if (hold !== null) drawMini(SHAPES[hold].m, SHAPES[hold].c, px, 24, cell * 0.55);
    ctx.fillText(fa ? 'بعدی' : 'NEXT', px, 24 + cell * 1.9);
    refillBag();
    for (let i = 0; i < 3 && i < bag.length; i++) {
      drawMini(SHAPES[bag[i]].m, SHAPES[bag[i]].c, px, 32 + cell * 1.9 + i * cell * 1.7, cell * 0.5);
    }
    if (combo > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 14px system-ui';
      ctx.fillText('🔥×' + (combo + 1), px, H - 40);
    }
    if (paused && !over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 26px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fa ? '⏸ مکث' : '⏸ Paused', W / 2, H / 2);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    cell = Math.max(16, Math.min(28, Math.floor((box.clientWidth - 24) / 15)));
    W = cell * 15; H = cell * 20;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function onKey(e, down) {
    if (e.key === 'ArrowLeft' || e.key === 'a') { if (down && !keys.left) { doMove(-1); das.left = 0; } keys.left = down; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd') { if (down && !keys.right) { doMove(1); das.right = 0; } keys.right = down; e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's') { keys.down = down; if (down) das.down = 1; e.preventDefault(); }
    else if (down && (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'x')) { doRotate(); e.preventDefault(); }
    else if (down && e.key === ' ') { hardDrop(); e.preventDefault(); }
    else if (down && (e.key === 'c' || e.key === 'C' || e.key === 'Shift')) { doHold(); }
    else if (down && (e.key === 'p' || e.key === 'P')) { togglePause(); }
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);
  function togglePause() {
    if (over) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
    sfx.click();
  }
  wrap.querySelectorAll('[data-k]').forEach((b) => {
    const k = b.dataset.k;
    const dn = (e) => {
      e.preventDefault();
      sfx.unlock();
      if (k === 'left') { doMove(-1); keys.left = true; das.left = 0; }
      else if (k === 'right') { doMove(1); keys.right = true; das.right = 0; }
      else if (k === 'down') { keys.down = true; das.down = 1; }
      else if (k === 'rot') doRotate();
      else if (k === 'hard') hardDrop();
      else if (k === 'hold') doHold();
    };
    const up = () => { if (k === 'left') keys.left = false; if (k === 'right') keys.right = false; if (k === 'down') keys.down = false; };
    b.addEventListener('pointerdown', dn);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => b.addEventListener(t, up));
  });
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-pause]').addEventListener('click', togglePause);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    wrap.remove();
  };
}
