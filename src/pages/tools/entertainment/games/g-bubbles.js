// 🫧 Bubble Shooter — نشونه بگیر، بترکون، شناورها رو بریز
import { randi, pnum, sfx, vibrate, makeLoop } from '../arcade.js';

const COLS = 10;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#c084fc', '#fb923c'];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">🗺 <b data-lv>۱</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:440px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-swap>🔄 ' + (fa ? 'تعویض' : 'Swap') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'بکش و رها کن تا شلیک شه! دیوارها کمانه می‌کنن' : 'Drag and release to shoot! Walls bounce') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lvEl = wrap.querySelector('[data-lv]');
  let W = 400, H = 500, R = 20, RH = 34;
  let grid, cur, next, flying, parts, falling, score, level, misses, over, aiming, aimA;

  function colors() { return Math.min(COLORS.length, 3 + Math.ceil(level / 2)); }
  function reset(full) {
    if (full) { score = 0; level = 1; }
    grid = [];
    const rows = Math.min(5 + Math.floor(level / 2), 8);
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push(Math.random() < 0.92 ? randi(0, colors() - 1) : -1);
      grid.push(row);
    }
    cur = randColor(); next = randColor();
    flying = null; parts = []; falling = [];
    misses = 0; over = false; aiming = false; aimA = -Math.PI / 2;
    hideOver();
    hud();
  }
  function presentColors() {
    const s = new Set();
    for (const row of grid) for (const v of row) if (v >= 0) s.add(v);
    return s.size ? [...s] : [0];
  }
  function randColor() {
    const p = presentColors();
    return p[(Math.random() * p.length) | 0];
  }
  function hud() {
    sEl.textContent = pnum(score);
    lvEl.textContent = pnum(level);
  }
  function cellXY(r, c) {
    return { x: R + c * R * 2 + (r % 2 ? R : 0), y: R + 8 + r * RH };
  }
  function neighbors(r, c) {
    const odd = r % 2 === 1;
    const d = odd
      ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
      : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
    const out = [];
    for (const [dr, dc] of d) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < grid.length + 1 && cc >= 0 && cc < COLS) out.push([rr, cc]);
    }
    return out;
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 360, vy: (Math.random() - 0.5) * 360, life: 0.5, color });
  }
  function shoot(a) {
    const sx = W / 2, sy = H - 44;
    flying = { x: sx, y: sy, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, color: cur };
    cur = next;
    next = randColor();
    sfx.shoot();
  }
  function snap() {
    const f = flying;
    flying = null;
    // نزدیک‌ترین خانه خالی معتبر
    let best = null, bd = 1e18;
    const maxR = grid.length;
    for (let r = 0; r <= maxR; r++) {
      for (let c = 0; c < COLS; c++) {
        if (r < maxR && grid[r][c] >= 0) continue;
        const { x, y } = cellXY(r, c);
        if (x - R < -2 || x + R > W + 2) continue;
        // باید همسایه پر یا سطر صفر باشد
        let okN = r === 0;
        if (!okN) {
          for (const [rr, cc] of neighbors(r, c)) {
            if (rr < maxR && grid[rr] && grid[rr][cc] >= 0) { okN = true; break; }
          }
        }
        if (!okN) continue;
        const d = (x - f.x) * (x - f.x) + (y - f.y) * (y - f.y);
        if (d < bd) { bd = d; best = [r, c]; }
      }
    }
    if (!best) { // سقف
      best = [0, Math.max(0, Math.min(COLS - 1, Math.round((f.x - R) / (R * 2))))];
    }
    while (grid.length <= best[0]) grid.push(Array(COLS).fill(-1));
    grid[best[0]][best[1]] = f.color;
    const { x, y } = cellXY(best[0], best[1]);
    // انفجار هم‌رنگ‌ها
    const cluster = flood(best[0], best[1], f.color);
    if (cluster.length >= 3) {
      for (const [r, c] of cluster) {
        const p = cellXY(r, c);
        burst(p.x, p.y, COLORS[f.color], 6);
        grid[r][c] = -1;
      }
      const gain = cluster.length * 20 + (cluster.length - 3) * 15;
      score += gain;
      sfx.clear();
      vibrate(25);
      dropFloating();
    } else {
      misses++;
      sfx.place();
      const limit = Math.max(3, 6 - Math.floor(level / 3));
      if (misses >= limit) {
        misses = 0;
        addRow();
      }
    }
    hud();
    checkEnd();
  }
  function flood(sr, sc, color) {
    const seen = new Set([sr * COLS + sc]);
    const stack = [[sr, sc]];
    const out = [];
    while (stack.length) {
      const [r, c] = stack.pop();
      out.push([r, c]);
      for (const [rr, cc] of neighbors(r, c)) {
        const k = rr * COLS + cc;
        if (rr < grid.length && grid[rr][cc] === color && !seen.has(k)) {
          seen.add(k);
          stack.push([rr, cc]);
        }
      }
    }
    return out;
  }
  function dropFloating() {
    const seen = new Set();
    const stack = [];
    if (grid.length) for (let c = 0; c < COLS; c++) if (grid[0][c] >= 0) { seen.add(c); stack.push([0, c]); }
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [rr, cc] of neighbors(r, c)) {
        const k = rr * COLS + cc;
        if (rr < grid.length && grid[rr][cc] >= 0 && !seen.has(k)) { seen.add(k); stack.push([rr, cc]); }
      }
    }
    let dropped = 0;
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c] >= 0 && !seen.has(r * COLS + c)) {
        const p = cellXY(r, c);
        falling.push({ x: p.x, y: p.y, vy: 60, color: COLORS[grid[r][c]], life: 1.4 });
        grid[r][c] = -1;
        dropped++;
      }
    }
    if (dropped) {
      score += dropped * 30;
      sfx.win();
      addMsg('+' + pnum(dropped * 30));
    }
  }
  function addRow() {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(randColor());
    grid.unshift(row);
    sfx.hit();
  }
  function addMsg(t) { msg = t; msgT = 1; }
  let msg = '', msgT = 0;
  function checkEnd() {
    let any = false;
    const dangerY = H - 110;
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c] < 0) continue;
      any = true;
      const { y } = cellXY(r, c);
      if (y + R >= dangerY) return gameOver();
    }
    while (grid.length && grid[grid.length - 1].every((v) => v < 0)) grid.pop();
    if (!any) {
      score += 500 * level;
      api.submitScore(score);
      sfx.win();
      level++;
      hud();
      reset(false);
      addMsg(fa ? '🎉 مرحله ' + pnum(level) : '🎉 Level ' + level);
    }
  }
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🫧</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(true); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    msgT = Math.max(0, msgT - dt);
    if (flying && !over) {
      const f = flying;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x < R) { f.x = R; f.vx = Math.abs(f.vx); sfx.tick(); }
      if (f.x > W - R) { f.x = W - R; f.vx = -Math.abs(f.vx); sfx.tick(); }
      if (f.y <= R + 8) { snap(); }
      else {
        let hit = false;
        outer: for (let r = 0; r < grid.length; r++) for (let c = 0; c < COLS; c++) {
          if (grid[r][c] < 0) continue;
          const { x, y } = cellXY(r, c);
          if ((f.x - x) * (f.x - x) + (f.y - y) * (f.y - y) <= (R * 1.85) * (R * 1.85)) { hit = true; break outer; }
        }
        if (hit) snap();
        else if (f.y > H + 40) flying = null;
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (let i = falling.length - 1; i >= 0; i--) {
      const p = falling[i];
      p.vy += 900 * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.y > H + 30) falling.splice(i, 1);
    }
    draw();
  });

  function bubble(x, y, r, color) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, color);
    g.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(1, '#131a33');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // خط خطر
    ctx.strokeStyle = 'rgba(251,113,133,.5)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 110);
    ctx.lineTo(W, H - 110);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c] < 0) continue;
      const { x, y } = cellXY(r, c);
      if (y > -R && y < H + R) bubble(x, y, R - 1, COLORS[grid[r][c]]);
    }
    for (const p of falling) {
      ctx.globalAlpha = Math.min(1, p.life);
      bubble(p.x, p.y, R - 1, p.color);
    }
    ctx.globalAlpha = 1;
    if (flying) bubble(flying.x, flying.y, R - 1, COLORS[flying.color]);
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // شوتر
    if (!over) {
      const sx = W / 2, sy = H - 44;
      // راهنمای هدف
      if ((aiming || true) && !flying) {
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        let ax = sx, ay = sy, vx = Math.cos(aimA), vy = Math.sin(aimA);
        for (let i = 0; i < 14; i++) {
          ax += vx * 22; ay += vy * 22;
          if (ax < R || ax > W - R) vx *= -1;
          if (ay < R) break;
          ctx.beginPath();
          ctx.arc(ax, ay, 3, 0, 7);
          ctx.fill();
        }
      }
      ctx.font = '40px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(aimA + Math.PI / 2);
      ctx.fillText('🔫', 0, 0);
      ctx.restore();
      bubble(sx, sy, R - 1, COLORS[cur]);
      bubble(34, H - 40, 13, COLORS[next]);
      ctx.fillStyle = '#9aa5c4';
      ctx.font = '700 11px system-ui';
      ctx.fillText(fa ? 'بعدی' : 'next', 34, H - 16);
    }
    if (msgT > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(msg, W / 2, H / 2);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(440, box.clientWidth - 24);
    R = Math.max(13, Math.min(21, w / (COLS * 2 + 1)));
    W = R * (COLS * 2 + 1);
    H = Math.max(420, Math.round(W * 1.22));
    RH = R * 1.74;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function angleFrom(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    let a = Math.atan2(y - (H - 44), x - W / 2);
    if (a > -0.15) a = -0.15;
    if (a < -Math.PI + 0.15) a = -Math.PI + 0.15;
    return a;
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (over || flying) return;
    e.preventDefault();
    sfx.unlock();
    aiming = true;
    aimA = angleFrom(e);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!aiming || over || flying) return;
    aimA = angleFrom(e);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!aiming || over || flying) { aiming = false; return; }
    aiming = false;
    aimA = angleFrom(e);
    shoot(aimA);
  });
  canvas.addEventListener('pointercancel', () => { aiming = false; });
  function onKey(e) {
    if (e.key === 'ArrowLeft') { aimA = Math.max(-Math.PI + 0.15, aimA - 0.09); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { aimA = Math.min(-0.15, aimA + 0.09); e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'ArrowUp') { if (!flying && !over) shoot(aimA); e.preventDefault(); }
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-swap]').addEventListener('click', () => {
    if (flying || over) return;
    const t = cur; cur = next; next = t;
    sfx.flip();
  });
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(true); });
  reset(true);
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    window.removeEventListener('keydown', onKey);
    wrap.remove();
  };
}
