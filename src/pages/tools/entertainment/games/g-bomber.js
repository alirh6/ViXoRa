// 💣 بمب‌افکن — هزارتو، بمب زنجیره‌ای، پاورآپ و در خروج
import { pnum, vibrate, makeLoop, rand, clamp, shuffle } from '../arcade.js';

const COLS = 15, ROWS = 11, T = 38;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const { sfx } = api;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">❤️ <b data-l>۰</b></span>' +
    '<span class="ag-pill">🗺 <b data-v>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:580px"><canvas data-cv width="' + COLS * T + '" height="' + ROWS * T + '" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button></div>' +
    (coarse ? '<div class="ag-trow"><button class="ag-tbtn" type="button" data-u>▲</button><button class="ag-tbtn" type="button" data-d>▼</button><button class="ag-tbtn" type="button" data-l>◀</button><button class="ag-tbtn" type="button" data-r>▶</button><button class="ag-tbtn" type="button" data-bomb>💣</button></div>' : '') +
    '<div class="ag-hint">' + (fa ? 'جهت‌ها/سوایپ حرکت · اسپیس/💣 بمب · همه دشمن‌ها رو بکش و برو تو در!' : 'Move with arrows/swipe · space = bomb · kill all, then enter the door!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lEl = wrap.querySelector('[data-l]');
  const vEl = wrap.querySelector('[data-v]');
  const W = COLS * T, H = ROWS * T;

  let grid, softs, door, pows, bombs, flames, foes, pl;
  let score, lives, level, range, maxB, spdMul;
  let over, started, paused, best, invT, lvlMsg, lvlT;

  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return grid[ty][tx];
  }
  function buildLevel() {
    grid = [];
    for (let y = 0; y < ROWS; y++) {
      grid.push([]);
      for (let x = 0; x < COLS; x++) {
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 || (x % 2 === 0 && y % 2 === 0)) grid[y].push('#');
        else grid[y].push(Math.random() < 0.72 ? '%' : '.');
      }
    }
    // فضای امن شروع
    grid[1][1] = grid[1][2] = grid[2][1] = '.';
    // در زیر یک بلوک تصادفی دور از شروع
    const cands = [];
    for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
      if (grid[y][x] === '%' && x + y > 8) cands.push([x, y]);
    }
    const dk = cands[(Math.random() * cands.length) | 0];
    door = { x: dk[0], y: dk[1], open: false };
    pows = [];
    // پاورآپ‌ها زیر بلوک‌ها
    const spots = shuffle(cands.filter((c) => !(c[0] === dk[0] && c[1] === dk[1]))).slice(0, 5);
    const kinds = ['range', 'bomb', 'speed', 'range', 'bomb'];
    spots.forEach((s, i) => pows.push({ x: s[0], y: s[1], k: kinds[i], hidden: true, got: false }));
    bombs = []; flames = [];
    // دشمن‌ها دور از شروع
    foes = [];
    const nf = Math.min(2 + level, 5);
    const esp = [];
    for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
      if (grid[y][x] === '.' && x + y > 9) esp.push([x, y]);
    }
    shuffle(esp);
    for (let i = 0; i < nf && i < esp.length; i++) {
      foes.push({
        x: esp[i][0] * T + T / 2, y: esp[i][1] * T + T / 2,
        d: { x: 1, y: 0 }, sp: Math.min(128, 62 + level * 12 + i * 6),
        dead: false, wob: Math.random() * 9, chase: level >= 3 && i === 0,
      });
    }
    pl = { x: 1 * T + T / 2, y: 1 * T + T / 2, d: { x: 0, y: 1 }, moving: false, dead: false };
    invT = 2;
    lvlMsg = (fa ? 'مرحله ' : 'Level ') + (level + 1);
    lvlT = 2;
  }
  function reset() {
    score = 0; lives = 3; level = 0; range = 1; maxB = 1; spdMul = 1;
    over = false; started = false; paused = false;
    best = api.getBest();
    buildLevel();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    lEl.textContent = pnum(lives);
    vEl.textContent = pnum(level + 1);
    wrap.querySelector('[data-b]').textContent = pnum(Math.max(best, score));
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
    ov.innerHTML = '<h2>💣 ' + (fa ? 'بمب‌افکن' : 'Bomber') + '</h2>' +
      '<p>' + (fa ? 'بمب بذار و <b>فرار کن</b>! آتیش خودت هم می‌کشتت. همه دشمن‌ها رو بکش بعد برو تو 🚪' : 'Drop bombs and <b>run</b>! Your own fire kills you. Clear foes, then enter 🚪') + '</p>' +
      '<p>🧨 ' + (fa ? 'بمب‌ها زنجیره‌ای منفجر میشن · 🎁 زیر آجرها پاورآپه' : 'Bombs chain-react · 🎁 powerups hide under bricks') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '💣 شروع' : '💣 Start') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }
  function showOver(win) {
    const r = api.submitScore(score);
    best = Math.max(best, score);
    if (win) sfx.win(); else sfx.lose();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>' + (win ? '🏆' : '💀') + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (win ? (fa ? 'همه مراحل رو ترکوندی!' : 'You cleared everything!') : (fa ? 'ترکیدی!' : 'Blown up!')) + (r.isBest ? ' 🏆' : '') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '↻ دوباره' : '↻ Retry') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.click(); bover(); reset(); started = true;
    });
  }

  function bombAt(tx, ty) {
    return bombs.some((b) => b.tx === tx && b.ty === ty);
  }
  function solidFor(tx, ty, isFoe, self) {
    const t = tileAt(tx, ty);
    if (t === '#' || t === '%') return true;
    if (bombAt(tx, ty)) {
      // بمبی که تازه گذاشتی تا وقتی روش وایسادی رد میشی
      if (self) {
        const stx = Math.floor(self.x / T), sty = Math.floor(self.y / T);
        if (stx === tx && sty === ty) return false;
      }
      return true;
    }
    return false;
  }
  function placeBomb() {
    if (!started || over || paused || pl.dead) return;
    const tx = Math.floor(pl.x / T), ty = Math.floor(pl.y / T);
    if (bombAt(tx, ty)) return;
    if (bombs.length >= maxB) return;
    bombs.push({ tx, ty, fuse: 2.1, r: range });
    sfx.place();
  }
  function detonate(b) {
    if (b.boom) return;
    b.boom = true;
    sfx.boom(); vibrate(60);
    const cells = [{ x: b.tx, y: b.ty, c: true }];
    for (const d of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
      for (let i = 1; i <= b.r; i++) {
        const nx = b.tx + d.x * i, ny = b.ty + d.y * i;
        const t = tileAt(nx, ny);
        if (t === '#') break;
        cells.push({ x: nx, y: ny, c: false, end: i === b.r });
        if (t === '%') {
          grid[ny][nx] = '.';
          score += 10;
          if (door.x === nx && door.y === ny) door.open = true;
          const pw = pows.find((p) => p.hidden && p.x === nx && p.y === ny);
          if (pw) pw.hidden = false;
          // آخر بازو بعد از آجر متوقف میشه
          cells[cells.length - 1].end = true;
          break;
        }
      }
    }
    for (const c of cells) {
      flames.push({ x: c.x, y: c.y, t: 0.55, c: c.c });
      // زنجیره
      const other = bombs.find((o) => !o.boom && o.tx === c.x && o.ty === c.y && o !== b);
      if (other) other.fuse = 0;
    }
    hud();
  }
  function killPlayer() {
    if (invT > 0 || pl.dead || over) return;
    pl.dead = true;
    lives--;
    sfx.hit(); vibrate(120);
    hud();
    setTimeout(() => {
      if (lives <= 0) { over = true; showOver(false); }
      else {
        pl.x = 1 * T + T / 2; pl.y = 1 * T + T / 2; pl.dead = false;
        invT = 2.5;
        // دشمن‌های نزدیک شروع رو دور کن
        for (const f of foes) {
          if (f.dead) continue;
          if (f.x < 3 * T && f.y < 3 * T) { f.x = (COLS - 2) * T; f.y = (ROWS - 2) * T; }
        }
      }
    }, 900);
  }

  function moveActor(a, dx, dy, sp, dt, isFoe) {
    const r = 13;
    // محور X
    if (dx !== 0) {
      const nx = a.x + dx * sp * dt;
      const edge = nx + dx * r;
      const ty = Math.floor(a.y / T);
      if (!solidFor(Math.floor(edge / T), ty, isFoe, a)) a.x = nx;
      else {
        // کمک‌گوشه: نزدیک مرکز بود بلغز
        const cy = Math.floor(a.y / T) * T + T / 2;
        if (Math.abs(a.y - cy) < 14 && Math.abs(a.y - cy) > 2) a.y += (cy > a.y ? 1 : -1) * sp * dt * 0.8;
      }
    }
    if (dy !== 0) {
      const ny = a.y + dy * sp * dt;
      const edge = ny + dy * r;
      const tx = Math.floor(a.x / T);
      if (!solidFor(tx, Math.floor(edge / T), isFoe, a)) a.y = ny;
      else {
        const cx = Math.floor(a.x / T) * T + T / 2;
        if (Math.abs(a.x - cx) < 14 && Math.abs(a.x - cx) > 2) a.x += (cx > a.x ? 1 : -1) * sp * dt * 0.8;
      }
    }
    a.x = clamp(a.x, T + r, W - T - r);
    a.y = clamp(a.y, T + r, H - T - r);
  }

  const keys = {};
  function update(dt) {
    if (!started || paused || over) return;
    if (lvlT > 0) lvlT -= dt;
    if (invT > 0) invT -= dt;
    // بازیکن
    if (!pl.dead) {
      let dx = 0, dy = 0;
      if (keys.ArrowLeft || keys.a || keys.A || keys.left) dx = -1;
      else if (keys.ArrowRight || keys.d || keys.D || keys.right) dx = 1;
      else if (keys.ArrowUp || keys.w || keys.W || keys.up) dy = -1;
      else if (keys.ArrowDown || keys.s || keys.S || keys.down) dy = 1;
      if (dx || dy) {
        pl.d = { x: dx, y: dy };
        moveActor(pl, dx, 0, 168 * spdMul, dt, false);
        moveActor(pl, 0, dy, 168 * spdMul, dt, false);
      }
      // پاورآپ
      for (const p of pows) {
        if (p.hidden || p.got) continue;
        if (Math.abs(p.x * T + T / 2 - pl.x) < 24 && Math.abs(p.y * T + T / 2 - pl.y) < 24) {
          p.got = true;
          if (p.k === 'range') range = Math.min(6, range + 1);
          else if (p.k === 'bomb') maxB = Math.min(5, maxB + 1);
          else spdMul = Math.min(1.5, spdMul + 0.12);
          sfx.level();
        }
      }
      // در خروج
      if (door.open && foes.every((f) => f.dead)) {
        if (Math.floor(pl.x / T) === door.x && Math.floor(pl.y / T) === door.y) {
          score += 200 + level * 100;
          level++;
          sfx.clear();
          if (level >= 8) { over = true; showOver(true); return; }
          buildLevel();
          hud();
        }
      }
    }
    // بمب‌ها
    for (const b of bombs) {
      b.fuse -= dt;
      if (b.fuse <= 0) detonate(b);
    }
    bombs = bombs.filter((b) => !b.boom);
    // آتیش
    for (const f of flames) f.t -= dt;
    flames = flames.filter((f) => f.t > 0);
    // اصابت آتیش
    const inFlame = (a) => flames.some((f) => Math.abs(f.x * T + T / 2 - a.x) < T / 2 && Math.abs(f.y * T + T / 2 - a.y) < T / 2);
    if (!pl.dead && inFlame(pl)) killPlayer();
    for (const f of foes) {
      if (f.dead) continue;
      if (inFlame(f)) {
        f.dead = true;
        score += 100 * (level + 1);
        sfx.pop();
        hud();
      }
    }
    // دشمن‌ها
    for (const f of foes) {
      if (f.dead) continue;
      f.wob += dt * 8;
      const cx = Math.floor(f.x / T) * T + T / 2;
      const cy = Math.floor(f.y / T) * T + T / 2;
      if (Math.abs(f.x - cx) < 5 && Math.abs(f.y - cy) < 5) {
        f.x = cx; f.y = cy;
        const tx = Math.floor(cx / T), ty = Math.floor(cy / T);
        const opts = [];
        for (const d of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
          if (d.x === -f.d.x && d.y === -f.d.y) continue;
          if (!solidFor(tx + d.x, ty + d.y, true, f)) opts.push(d);
        }
        if (!opts.length) f.d = { x: -f.d.x, y: -f.d.y };
        else if (f.chase && !pl.dead && Math.random() < 0.6) {
          opts.sort((a, b2) => (Math.abs(tx + a.x - pl.x / T) + Math.abs(ty + a.y - pl.y / T)) - (Math.abs(tx + b2.x - pl.x / T) + Math.abs(ty + b2.y - pl.y / T)));
          f.d = { ...opts[0] };
        } else f.d = { ...opts[(Math.random() * opts.length) | 0] };
      }
      moveActor(f, f.d.x, 0, f.sp, dt, true);
      moveActor(f, 0, f.d.y, f.sp, dt, true);
      // تماس با بازیکن
      if (!pl.dead && Math.abs(f.x - pl.x) < 26 && Math.abs(f.y - pl.y) < 26) killPlayer();
    }
  }

  function render(t) {
    ctx.fillStyle = '#1a2b1a';
    ctx.fillRect(0, 0, W, H);
    // کف شطرنجی
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#22402a' : '#25452d';
      ctx.fillRect(x * T, y * T, T, T);
    }
    // در
    if (door.open) {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(door.x * T + 4, door.y * T + 4, T - 8, T - 8);
      ctx.strokeStyle = '#ffd93b'; ctx.lineWidth = 3;
      ctx.strokeRect(door.x * T + 4, door.y * T + 4, T - 8, T - 8);
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🚪', door.x * T + T / 2, door.y * T + T / 2);
    }
    // پاورآپ‌ها
    for (const p of pows) {
      if (p.hidden || p.got) continue;
      const px = p.x * T + T / 2, py = p.y * T + T / 2;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(p.x * T + 3, p.y * T + 3, T - 6, T - 6);
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.k === 'range' ? '🧨' : p.k === 'bomb' ? '💣' : '👟', px, py + Math.sin(t * 4) * 2);
    }
    // دیوارها و آجرها
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = grid[y][x];
      if (v === '#') {
        ctx.fillStyle = '#3a4358';
        ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = '#565f7d';
        ctx.fillRect(x * T + 3, y * T + 3, T - 6, T - 6);
        ctx.fillStyle = '#2b3247';
        ctx.fillRect(x * T + 7, y * T + 7, T - 14, 5);
        ctx.fillRect(x * T + 7, y * T + 18, T - 14, 5);
      } else if (v === '%') {
        ctx.fillStyle = '#8a5a24';
        ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
        ctx.fillStyle = '#c98a3b';
        ctx.fillRect(x * T + 4, y * T + 4, T - 8, 9);
        ctx.fillRect(x * T + 4, y * T + 19, T - 8, 9);
        ctx.fillStyle = '#6b421a';
        ctx.fillRect(x * T + T / 2 - 1, y * T + 4, 2, 9);
        ctx.fillRect(x * T + T / 4, y * T + 19, 2, 9);
        ctx.fillRect(x * T + (3 * T) / 4, y * T + 19, 2, 9);
      }
    }
    // بمب‌ها
    for (const b of bombs) {
      const bx = b.tx * T + T / 2, by = b.ty * T + T / 2;
      const panic = b.fuse < 0.7 && ((t * 14) | 0) % 2;
      ctx.fillStyle = panic ? '#ff5c5c' : '#15171f';
      ctx.beginPath(); ctx.arc(bx, by + 2, 14, 0, 7); ctx.fill();
      ctx.fillStyle = panic ? '#ff9a9a' : '#3a3f52';
      ctx.beginPath(); ctx.arc(bx - 4, by - 3, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#c98a3b'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bx + 4, by - 12); ctx.quadraticCurveTo(bx + 10, by - 20, bx + 16, by - 18); ctx.stroke();
      ctx.fillStyle = '#ffe93b';
      ctx.beginPath(); ctx.arc(bx + 16 + Math.sin(t * 30) * 2, by - 18, 3.5, 0, 7); ctx.fill();
    }
    // آتیش
    for (const f of flames) {
      const fx = f.x * T, fy = f.y * T;
      const a = clamp(f.t * 2.4, 0, 1);
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(fx + T / 2, fy + T / 2, 2, fx + T / 2, fy + T / 2, T * 0.75);
      g.addColorStop(0, '#fff7ae'); g.addColorStop(0.45, '#ffb02e'); g.addColorStop(1, '#ff3b1e');
      ctx.fillStyle = g;
      ctx.fillRect(fx - 3, fy - 3, T + 6, T + 6);
      ctx.globalAlpha = 1;
    }
    // دشمن‌ها
    for (const f of foes) {
      if (f.dead) continue;
      const sq = 1 + Math.sin(f.wob) * 0.08;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(f.x, f.y + 14, 13, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = f.chase ? '#c724b8' : '#ff5c5c';
      ctx.beginPath(); ctx.ellipse(f.x, f.y, 14 * sq, 15 / sq, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      const ex = f.d.x * 4, ey = f.d.y * 4;
      ctx.beginPath(); ctx.arc(f.x - 5 + ex, f.y - 3 + ey, 4.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(f.x + 5 + ex, f.y - 3 + ey, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(f.x - 5 + ex * 1.6, f.y - 3 + ey * 1.6, 2.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(f.x + 5 + ex * 1.6, f.y - 3 + ey * 1.6, 2.2, 0, 7); ctx.fill();
    }
    // بازیکن
    if (!pl.dead) {
      if (!(invT > 0 && ((t * 10) | 0) % 2)) {
        const bob = (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown || keys.a || keys.d || keys.w || keys.s) ? Math.sin(t * 14) * 2 : 0;
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.beginPath(); ctx.ellipse(pl.x, pl.y + 15, 13, 5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#f2f5ff';
        ctx.beginPath(); ctx.arc(pl.x, pl.y + bob, 14, 0, 7); ctx.fill();
        ctx.fillStyle = '#2f6df6';
        ctx.beginPath(); ctx.arc(pl.x, pl.y + bob - 4, 14, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#2f6df6';
        ctx.fillRect(pl.x - 14, pl.y + bob + 6, 28, 5);
        ctx.fillStyle = '#111';
        const ex = pl.d.x * 4, ey = pl.d.y * 4;
        ctx.beginPath(); ctx.arc(pl.x - 5 + ex, pl.y + ey + bob, 2.6, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(pl.x + 5 + ex, pl.y + ey + bob, 2.6, 0, 7); ctx.fill();
      }
    }
    if (lvlT > 0) {
      ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(0, H / 2 - 30, W, 60);
      ctx.fillStyle = '#ffe9a3';
      ctx.fillText(lvlMsg, W / 2, H / 2);
    }
  }

  const loop = makeLoop((dt, t) => { update(dt); render(t); });
  function onKey(e, down) {
    keys[e.key] = down;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
    if (down && e.key === ' ') placeBomb();
    if (down && (e.key === 'p' || e.key === 'P')) togglePause();
  }
  function togglePause() {
    if (!started || over) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
  }
  let swX = 0, swY = 0, swT = 0;
  canvas.addEventListener('pointerdown', (e) => { swX = e.clientX; swY = e.clientY; swT = performance.now(); sfx.unlock(); });
  canvas.addEventListener('pointerup', (e) => {
    const dx = e.clientX - swX, dy = e.clientY - swY;
    if (Math.hypot(dx, dy) < 20) {
      if (performance.now() - swT < 300) placeBomb();
      return;
    }
    const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    keys[k] = true;
    setTimeout(() => { keys[k] = false; }, 260);
  });
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); bover(); reset(); started = true; });
  wrap.querySelector('[data-pause]').addEventListener('click', () => { sfx.click(); togglePause(); });
  const bb = wrap.querySelector('[data-bomb]');
  if (bb) {
    bb.addEventListener('click', placeBomb);
    const bind = (sel, k) => {
      const b = wrap.querySelector(sel);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[k] = true; });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => { keys[k] = false; }));
    };
    bind('[data-u]', 'up'); bind('[data-d]', 'down'); bind('[data-l]', 'left'); bind('[data-r]', 'right');
  }

  reset();
  showIntro();
  loop.start();
  return function destroy() {
    loop.stop();
    try { api.submitScore(score); } catch { /* ignore */ }
  };
}
