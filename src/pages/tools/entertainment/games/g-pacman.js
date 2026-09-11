// 👻 Pac Maze — پک‌من: هزارتوی procedural، ۴ روح باهوش، میوه، مرحله‌ها
import { pnum, sfx, vibrate, makeLoop } from '../arcade.js';

const COLS = 19, ROWS = 15;
const DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">❤️ <b data-l>۳</b></span>' +
    '<span class="ag-pill">🗺 <b data-lv>۱</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:560px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    (coarse ? '<div class="ag-pad" data-pad><span></span><button type="button" data-d="0,-1">▲</button><span></span>' +
      '<button type="button" data-d="-1,0">◀</button><button type="button" data-d="0,1">▼</button><button type="button" data-d="1,0">▶</button></div>' : '') +
    '<div class="ag-hint">' + (fa ? 'نقطه‌ها رو بخور! با 🔵 آبی روح‌ها فرار می‌کنن' : 'Eat dots! 🔵 power turns the hunt around') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lEl = wrap.querySelector('[data-l]');
  const lvEl = wrap.querySelector('[data-lv]');
  let T = 24, W = 0, H = 0;
  let maze, pellets, powers, pac, ghosts, fruit, score, lives, level, dotsLeft, fright, frightT, chain, over, paused, mode, modeT, ready, readyT, mouthT;

  function genMaze() {
    const m = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    const stack = [[1, 1]];
    m[1][1] = 0;
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1];
      const opts = [];
      for (const d of DIRS) {
        const nx = cx + d.x * 2, ny = cy + d.y * 2;
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && m[ny][nx] === 1) opts.push([nx, ny, d.x, d.y]);
      }
      if (!opts.length) { stack.pop(); continue; }
      const [nx, ny, wx, wy] = opts[(Math.random() * opts.length) | 0];
      m[cy + wy][cx + wx] = 0;
      m[ny][nx] = 0;
      stack.push([nx, ny]);
    }
    // خانه ارواح وسط
    const cc = 9, r0 = 5, r1 = 9;
    for (let y = r0 + 1; y < r1; y++) for (let x = cc - 2; x <= cc + 2; x++) m[y][x] = 0;
    for (let x = cc - 2; x <= cc + 2; x++) { m[r0][x] = 1; m[r1][x] = 1; }
    for (let y = r0; y <= r1; y++) { m[y][cc - 3] = 1; m[y][cc + 3] = 1; }
    m[r0][cc] = 2; // در
    // راهرو اتصال بالای در
    for (let y = 1; y < r0; y++) m[y][cc] = 0;
    return m;
  }
  function buildLevel() {
    maze = genMaze();
    pellets = new Set();
    powers = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (maze[y][x] !== 0) continue;
      if (y >= 6 && y <= 8 && x >= 7 && x <= 11) continue; // داخل خانه
      pellets.add(y * COLS + x);
    }
    // فقط خانه‌های قابل دسترس از محل شروع (تضمین تمام‌شدنی بودن مرحله)
    const reach = new Set();
    const rstack = [[1, ROWS - 2]];
    while (rstack.length) {
      const [rx, ry] = rstack.pop();
      const rk = ry * COLS + rx;
      if (reach.has(rk)) continue;
      reach.add(rk);
      for (const d of DIRS) {
        const nx = rx + d.x, ny = ry + d.y;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        if (maze[ny][nx] !== 0) continue;
        rstack.push([nx, ny]);
      }
    }
    for (const k of [...pellets]) if (!reach.has(k)) pellets.delete(k);
    // ۴ پاور در گوشه‌ها
    const corners = [[1, 1], [COLS - 2, 1], [1, ROWS - 2], [COLS - 2, ROWS - 2]];
    for (const [cx, cy] of corners) {
      let best = null, bd = 1e9;
      for (const k of pellets) {
        const x = k % COLS, y = (k / COLS) | 0;
        const d = Math.abs(x - cx) + Math.abs(y - cy);
        if (d < bd) { bd = d; best = k; }
      }
      if (best !== null) { pellets.delete(best); powers.push(best); }
    }
    dotsLeft = pellets.size + powers.length;
    fruit = null;
    resetActors();
  }
  function tile(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return 1;
    return maze[y][x];
  }
  function resetActors() {
    pac = { x: 1.5, y: ROWS - 1.5, d: { x: 1, y: 0 }, want: { x: 1, y: 0 }, sp: 7.6 };
    const defs = [
      { c: '#ef4444', corner: { x: COLS - 2, y: 1 }, delay: 0, px: 0 },
      { c: '#f9a8d4', corner: { x: 1, y: 1 }, delay: 2, px: -1 },
      { c: '#22d3ee', corner: { x: COLS - 2, y: ROWS - 2 }, delay: 4, px: 1 },
      { c: '#fb923c', corner: { x: 1, y: ROWS - 2 }, delay: 6, px: 0.5 },
    ];
    ghosts = defs.map((g, i) => ({
      c: g.c, corner: g.corner, delay: g.delay,
      x: 9.5 + g.px, y: 7.5, d: { x: i % 2 ? -1 : 1, y: 0 },
      state: 'house', t: 0, bob: Math.random() * 6,
    }));
    fright = 0; chain = 0; mode = 'scatter'; modeT = 5;
    ready = true; readyT = 1.4;
  }
  function reset(full) {
    if (full) { score = 0; lives = 3; level = 1; }
    over = false; paused = false;
    hideOver();
    buildLevel();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    lEl.textContent = pnum(lives);
    lvEl.textContent = pnum(level);
  }
  function centerOf(e) { return { cx: Math.floor(e.x), cy: Math.floor(e.y) }; }
  function atCenter(e) {
    const fx = e.x - Math.floor(e.x) - 0.5, fy = e.y - Math.floor(e.y) - 0.5;
    return Math.abs(fx) < 0.12 && Math.abs(fy) < 0.12;
  }
  function snap(e) { e.x = Math.floor(e.x) + 0.5; e.y = Math.floor(e.y) + 0.5; }
  function blocked(x, y, ghost, passDoor) {
    const t = tile(x, y);
    if (t === 1) return true;
    if (t === 2) return ghost ? !passDoor : true;
    return false;
  }
  function ghostTarget(g) {
    if (g.state === 'eyes') return { x: 9, y: 5 };
    if (fright > 0 && g.state === 'out') return null; // تصادفی
    if (g.state === 'leaving') return { x: 9, y: 4 };
    if (mode === 'scatter') return g.corner;
    const p = centerOf(pac);
    if (g.c === '#ef4444') return p;
    if (g.c === '#f9a8d4') return { x: p.cx + pac.d.x * 4, y: p.cy + pac.d.y * 4 };
    if (g.c === '#22d3ee') {
      const b = ghosts[0];
      return { x: p.cx * 2 - Math.floor(b.x), y: p.cy * 2 - Math.floor(b.y) };
    }
    const d = Math.hypot(pac.x - g.x, pac.y - g.y);
    return d > 6 ? p : g.corner;
  }
  function stepGhost(g, dt) {
    const spd = g.state === 'eyes' ? 13 : fright > 0 && g.state === 'out' ? 4.2 : 6.2 + level * 0.35;
    g.t -= dt;
    if (g.state === 'house') {
      g.bob += dt * 6;
      g.y += Math.sin(g.bob) * dt * 1.2;
      if (g.t <= 0 && g.delay <= 0) { g.state = 'leaving'; g.x = 9.5; }
      else if (g.delay > 0) g.delay -= dt;
      return;
    }
    if (g.state === 'leaving') {
      const dx = 9.5 - g.x;
      if (Math.abs(dx) > 0.1) g.x += Math.sign(dx) * 6 * dt;
      else {
        g.y -= 6 * dt;
        if (g.y <= 4.55) { g.y = 4.5; g.state = 'out'; g.d = { x: Math.random() > 0.5 ? 1 : -1, y: 0 }; }
      }
      return;
    }
    if (g.state === 'entering') {
      const dx = 9.5 - g.x;
      if (Math.abs(dx) > 0.08) g.x += Math.sign(dx) * 8 * dt;
      else {
        g.y += 8 * dt;
        if (g.y >= 7.4) { g.state = 'house'; g.t = 0.6; g.delay = 0; }
      }
      return;
    }
    // out / eyes
    const passDoor = g.state === 'eyes';
    let remaining = spd * dt, guard = 0;
    while (remaining > 0.0001 && guard++ < 14) {
      const step = Math.min(remaining, 0.06);
      remaining -= step;
      if (nearCenter(g)) {
        g.x = Math.floor(g.x) + 0.5;
        g.y = Math.floor(g.y) + 0.5;
        const { cx, cy } = centerOf(g);
        if (g.state === 'eyes' && cx === 9 && cy === 5) { g.state = 'entering'; return; }
        const tgt = ghostTarget(g);
        const opts = [];
        for (const d of DIRS) {
          if (d.x === -g.d.x && d.y === -g.d.y) continue;
          if (!blocked(cx + d.x, cy + d.y, true, passDoor)) opts.push(d);
        }
        if (!opts.length) g.d = { x: -g.d.x, y: -g.d.y };
        else if (!tgt) g.d = { ...opts[(Math.random() * opts.length) | 0] };
        else {
          let bestD = opts[0], bd = 1e18;
          for (const d of opts) {
            const dd = (cx + d.x - tgt.x) * (cx + d.x - tgt.x) + (cy + d.y - tgt.y) * (cy + d.y - tgt.y);
            if (dd < bd) { bd = dd; bestD = d; }
          }
          g.d = { x: bestD.x, y: bestD.y };
        }
      }
      if (!tryMove(g, g.d.x, g.d.y, step, true, passDoor)) {
        g.x = Math.floor(g.x) + 0.5;
        g.y = Math.floor(g.y) + 0.5;
        g.d = { x: -g.d.x, y: -g.d.y };
        return;
      }
    }
  }
  function dirBlocked(e, dx, dy, ghost, passDoor) {
    return blocked(Math.floor(e.x + dx * 0.34), Math.floor(e.y + dy * 0.34), ghost, passDoor);
  }
  function tryMove(e, dx, dy, dist, ghost, passDoor) {
    if (dx !== 0) {
      const nx = e.x + dx * dist;
      const edge = nx + dx * 0.32;
      if (blocked(Math.floor(edge), Math.floor(e.y), ghost, passDoor)) {
        if (dx > 0) e.x = Math.min(e.x, Math.floor(edge) - 0.33);
        else e.x = Math.max(e.x, Math.floor(edge) + 1 + 0.33);
        return false;
      }
      e.x = nx;
    } else if (dy !== 0) {
      const ny = e.y + dy * dist;
      const edge = ny + dy * 0.32;
      if (blocked(Math.floor(e.x), Math.floor(edge), ghost, passDoor)) {
        if (dy > 0) e.y = Math.min(e.y, Math.floor(edge) - 0.33);
        else e.y = Math.max(e.y, Math.floor(edge) + 1 + 0.33);
        return false;
      }
      e.y = ny;
    }
    return true;
  }
  function nearCenter(e) {
    return Math.abs(e.x - Math.floor(e.x) - 0.5) < 0.18 && Math.abs(e.y - Math.floor(e.y) - 0.5) < 0.18;
  }
  function stepPac(dt) {
    let remaining = (fright > 0 ? 8 : 7.6) * dt, guard = 0;
    while (remaining > 0.0001 && guard++ < 12) {
      const step = Math.min(remaining, 0.06);
      remaining -= step;
      const curBlocked = dirBlocked(pac, pac.d.x, pac.d.y, false, false);
      if (curBlocked || nearCenter(pac)) {
        if (!dirBlocked(pac, pac.want.x, pac.want.y, false, false)) {
          if (pac.want.x !== pac.d.x || pac.want.y !== pac.d.y) {
            pac.d = { ...pac.want };
            pac.x = Math.floor(pac.x) + 0.5;
            pac.y = Math.floor(pac.y) + 0.5;
          }
        } else if (curBlocked) {
          pac.x = Math.floor(pac.x) + 0.5;
          pac.y = Math.floor(pac.y) + 0.5;
          const cc0 = centerOf(pac);
          eatAt(cc0.cx, cc0.cy);
          return;
        }
      }
      if (!tryMove(pac, pac.d.x, pac.d.y, step, false, false)) {
        const cc0 = centerOf(pac);
        eatAt(cc0.cx, cc0.cy);
        if (!dirBlocked(pac, pac.want.x, pac.want.y, false, false)) pac.d = { ...pac.want };
        else return;
      }
      const cc1 = centerOf(pac);
      eatAt(cc1.cx, cc1.cy);
    }
  }
  function eatAt(cx, cy) {
    const k = cy * COLS + cx;
    if (pellets.has(k)) {
      pellets.delete(k);
      score += 10;
      dotsLeft--;
      if (dotsLeft % 12 === 0) sfx.tick();
      if (dotsLeft === Math.floor((pellets.size + powers.length) / 2) && !fruit) {
        const opts = [...pellets];
        if (opts.length) {
          const fk = opts[(Math.random() * opts.length) | 0];
          fruit = { x: (fk % COLS) + 0.5, y: ((fk / COLS) | 0) + 0.5, t: 9 };
        }
      }
      if (dotsLeft <= 0) return nextLevel();
      hud();
    } else {
      const pi = powers.indexOf(k);
      if (pi >= 0) {
        powers.splice(pi, 1);
        score += 50;
        dotsLeft--;
        fright = Math.max(2.5, 6.5 - level * 0.5);
        chain = 0;
        sfx.level();
        vibrate(25);
        if (dotsLeft <= 0) return nextLevel();
        hud();
      }
    }
    if (fruit && Math.abs(pac.x - fruit.x) < 0.7 && Math.abs(pac.y - fruit.y) < 0.7) {
      score += 300 * level;
      sfx.coin();
      fruit = null;
      hud();
    }
  }
  function nextLevel() {
    api.submitScore(score);
    sfx.win();
    level++;
    buildLevel();
    hud();
  }
  function die() {
    lives--;
    sfx.lose();
    vibrate([80, 50, 80]);
    hud();
    if (lives <= 0) {
      over = true;
      const r = api.submitScore(score);
      const ov = document.createElement('div');
      ov.className = 'ag-overlay';
      ov.dataset.over = '1';
      ov.innerHTML = '<h2>👻</h2><div class="ag-big">' + pnum(score) + '</div>' +
        '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
        '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
      wrap.querySelector('.ag-board').appendChild(ov);
      ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(true); });
    } else resetActors();
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }
  function checkCaught() {
    for (const g of ghosts) {
      if (g.state !== 'out' && g.state !== 'eyes') continue;
      if (Math.abs(g.x - pac.x) > 0.7 || Math.abs(g.y - pac.y) > 0.7) continue;
      if (g.state === 'eyes') continue;
      if (fright > 0) {
        g.state = 'eyes';
        chain++;
        score += 200 * Math.pow(2, Math.min(3, chain - 1));
        sfx.boom();
        vibrate(30);
        hud();
      } else {
        die();
        return;
      }
    }
  }

  const loop = makeLoop((dt) => {
    mouthT += dt;
    if (!over && !paused) {
      if (ready) {
        readyT -= dt;
        if (readyT <= 0) ready = false;
      } else {
        fright = Math.max(0, fright - dt);
        modeT -= dt;
        if (modeT <= 0) { mode = mode === 'scatter' ? 'chase' : 'scatter'; modeT = mode === 'scatter' ? 5 : 9; }
        if (fruit) { fruit.t -= dt; if (fruit.t <= 0) fruit = null; }
        stepPac(dt);
        if (!over) for (const g of ghosts) stepGhost(g, dt);
        if (!over) checkCaught();
      }
    }
    draw();
  });

  function tileXY(x, y) { return { x: x * T, y: y * T }; }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, W, H);
    // دیوارها
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = maze[y][x];
      const { x: px, y: py } = tileXY(x, y);
      if (t === 1) {
        ctx.fillStyle = '#16215c';
        ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#2f4bff';
        if (tile(x, y - 1) !== 1) ctx.fillRect(px + 2, py + 2, T - 4, 3);
        if (tile(x, y + 1) !== 1) ctx.fillRect(px + 2, py + T - 5, T - 4, 3);
        if (tile(x - 1, y) !== 1) ctx.fillRect(px + 2, py + 2, 3, T - 4);
        if (tile(x + 1, y) !== 1) ctx.fillRect(px + T - 5, py + 2, 3, T - 4);
      } else if (t === 2) {
        ctx.fillStyle = '#f9a8d4';
        ctx.fillRect(px + 2, py + T / 2 - 2, T - 4, 4);
      }
    }
    // نقطه‌ها
    ctx.fillStyle = '#fbbf24';
    for (const k of pellets) {
      const x = k % COLS, y = (k / COLS) | 0;
      ctx.beginPath();
      ctx.arc(x * T + T / 2, y * T + T / 2, 3, 0, 7);
      ctx.fill();
    }
    const blink = Math.sin(mouthT * 6) > -0.3;
    if (blink) {
      for (const k of powers) {
        const x = k % COLS, y = (k / COLS) | 0;
        ctx.beginPath();
        ctx.arc(x * T + T / 2, y * T + T / 2, 6, 0, 7);
        ctx.fill();
      }
    }
    if (fruit && (fruit.t > 2 || blink)) {
      ctx.font = (T - 4) + 'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🍒', fruit.x * T, fruit.y * T);
    }
    // ارواح
    for (const g of ghosts) drawGhost(g);
    // پک
    const px = pac.x * T, py = pac.y * T;
    const mouth = over ? 0 : (Math.sin(mouthT * 14) * 0.28 + 0.28);
    const ang = pac.d.x === 1 ? 0 : pac.d.x === -1 ? Math.PI : pac.d.y === 1 ? Math.PI / 2 : -Math.PI / 2;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, T * 0.42, ang + mouth, ang - mouth + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    if (ready && !over) {
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fde047';
      ctx.font = '900 26px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(fa ? 'آماده؟!' : 'READY!', W / 2, H / 2);
    }
    if (paused && !over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fa ? '⏸ مکث' : '⏸ Paused', W / 2, H / 2);
    }
  }
  function drawGhost(g) {
    const x = g.x * T, y = g.y * T, r = T * 0.44;
    const eyesOnly = g.state === 'eyes';
    let body = g.c;
    if (g.state === 'out' && fright > 0) body = fright < 2 && blink2() ? '#e2e8f0' : '#3b82f6';
    if (!eyesOnly) {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(x, y - 2, r, Math.PI, 0);
      ctx.lineTo(x + r, y + r);
      for (let i = 0; i < 3; i++) {
        ctx.lineTo(x + r - (i * 2 + 1) * r / 3, y + r - 4);
        ctx.lineTo(x + r - (i * 2 + 2) * r / 3, y + r);
      }
      ctx.closePath();
      ctx.fill();
    }
    if (!(g.state === 'out' && fright > 0)) {
      // چشم‌ها
      const ex = g.d.x * 2.5, ey = g.d.y * 2.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(x - 5, y - 4 + ey, 4, 5, 0, 0, 7);
      ctx.ellipse(x + 5, y - 4 + ey, 4, 5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(x - 5 + ex, y - 4 + ey * 1.6, 2.4, 0, 7);
      ctx.arc(x + 5 + ex, y - 4 + ey * 1.6, 2.4, 0, 7);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fecaca';
      ctx.beginPath();
      ctx.arc(x - 5, y - 4, 2.5, 0, 7);
      ctx.arc(x + 5, y - 4, 2.5, 0, 7);
      ctx.fill();
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const wx = x - 9 + i * 6;
        ctx.moveTo(wx, y + 7);
        ctx.lineTo(wx + 3, y + 4);
        ctx.lineTo(wx + 6, y + 7);
      }
      ctx.stroke();
    }
  }
  function blink2() { return Math.sin(mouthT * 10) > 0; }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    T = Math.max(14, Math.min(30, Math.floor((box.clientWidth - 24) / COLS)));
    W = T * COLS; H = T * ROWS;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function turn(x, y) {
    if (over || paused) return;
    pac.want = { x, y };
  }
  function onKey(e) {
    if (e.key === 'ArrowUp' || e.key === 'w') { turn(0, -1); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's') { turn(0, 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'a') { turn(-1, 0); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd') { turn(1, 0); e.preventDefault(); }
    else if (e.key === 'p' || e.key === 'P') { togglePause(); }
  }
  let sx = 0, sy = 0;
  canvas.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
    sx = t.clientX; sy = t.clientY;
    e.preventDefault();
  }, { passive: false });
  function togglePause() {
    if (over) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
    sfx.click();
  }
  const pad = wrap.querySelector('[data-pad]');
  if (pad) pad.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const [x, y] = b.dataset.d.split(',').map(Number);
    turn(x, y);
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-pause]').addEventListener('click', togglePause);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(true); });
  mouthT = 0;
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
