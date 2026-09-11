// 🛡️ نبرد تانک — دفاع از پایگاه، ۴ نوع دشمن، پاورآپ
import { pnum, vibrate, makeLoop, rand, clamp, shuffle } from '../arcade.js';

const COLS = 13, ROWS = 13, T = 40;
const MAPS = [
  [
    '.............',
    '.##.#####.##.',
    '.##.#####.##.',
    '.##.#####.##.',
    '.##.##.@@.##.',
    '.##.##.@@.##.',
    '...~~...~~...',
    '%%%.##.##.%%%',
    '%%%.##.##.%%%',
    '.##.##.##.##.',
    '.##.......##.',
    '.##.#BBB#.##.',
    '.............',
  ],
  [
    '.....#.......',
    '.##..#.##.##.',
    '.##....##.##.',
    '.@@.##....##.',
    '.@@.##.##....',
    '.##.##.##.##.',
    '.....~~~.....',
    '.##.##.##.##.',
    '....##.##.@@.',
    '.##...###.@@.',
    '.##.##....##.',
    '.##.#BBB#.##.',
    '.............',
  ],
  [
    '.#...#...#...',
    '.#.##.##.#.#.',
    '.#....@@...#.',
    '##.##..##.##.',
    '...##..##....',
    '.##..~~..##.#',
    '.##..~~..##.#',
    '#.##..##..##.',
    '....##..##...',
    '.##.##..##.##',
    '.#...#...#.#.',
    '.##.#BBB#.##.',
    '.............',
  ],
];
const FOE = {
  basic: { hp: 1, sp: 78, bs: 300, sc: 100, c1: '#9aa2b5', c2: '#565d73' },
  fast: { hp: 1, sp: 132, bs: 300, sc: 200, c1: '#ffd93b', c2: '#a86e00' },
  speedy: { hp: 1, sp: 100, bs: 460, sc: 300, c1: '#ff8a3b', c2: '#a34e00' },
  armor: { hp: 4, sp: 66, bs: 380, sc: 400, c1: '#5effc3', c2: '#1d7a5c' },
};

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
    '<div class="ag-board" style="width:100%;max-width:540px"><canvas data-cv width="' + COLS * T + '" height="' + ROWS * T + '" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button></div>' +
    (coarse ? '<div class="ag-trow"><button class="ag-tbtn" type="button" data-u>▲</button><button class="ag-tbtn" type="button" data-d>▼</button><button class="ag-tbtn" type="button" data-l>◀</button><button class="ag-tbtn" type="button" data-r>▶</button><button class="ag-tbtn" type="button" data-fire>🔥</button></div>' : '') +
    '<div class="ag-hint">' + (fa ? 'جهت‌ها حرکت · اسپیس شلیک · از 🦅 محافظت کن!' : 'Arrows move · space fires · protect the 🦅!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lEl = wrap.querySelector('[data-l]');
  const vEl = wrap.querySelector('[data-v]');
  const W = COLS * T, H = ROWS * T;

  let grid, steel, base, baseAlive, pl, foes, queue, bullets, pows, parts;
  let score, lives, level, power, freezeT, spawnT, shieldT;
  let over, started, paused, best, lvlT, lvlMsg;

  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return grid[ty][tx];
  }
  function isSteel(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
    return steel[ty][tx];
  }
  function buildLevel() {
    const M = MAPS[level % MAPS.length];
    grid = []; steel = [];
    for (let y = 0; y < ROWS; y++) {
      grid.push([]); steel.push([]);
      for (let x = 0; x < COLS; x++) {
        const c = M[y][x];
        grid[y].push(c === '#' ? '#' : c === '~' ? '~' : c === '%' ? '%' : c === 'B' ? 'B' : '.');
        steel[y].push(c === '@');
      }
    }
    base = { x: 6, y: 11 };
    baseAlive = true;
    pl = { tx: 2, ty: 12, x: 2 * T + T / 2, y: 12 * T + T / 2, d: { x: 0, y: -1 }, cd: 0, respawn: 0 };
    power = Math.max(1, power || 1);
    foes = []; bullets = []; pows = []; parts = [];
    queue = [];
    const n = Math.min(16, 5 + level * 2);
    const bag = ['basic', 'basic', 'fast', 'basic', 'speedy', 'fast', 'armor', 'basic', 'speedy', 'armor', 'fast', 'basic'];
    for (let i = 0; i < n; i++) queue.push(bag[i % bag.length]);
    shuffle(queue);
    spawnT = 0.5; freezeT = 0; shieldT = 2;
    lvlMsg = (fa ? 'مرحله ' : 'Level ') + (level + 1);
    lvlT = 2;
  }
  function reset() {
    score = 0; lives = 3; level = 0; power = 1;
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
    ov.innerHTML = '<h2>🛡️ ' + (fa ? 'نبرد تانک' : 'Tank Battle') + '</h2>' +
      '<p>' + (fa ? 'موج دشمن‌ها رو نابود کن و از <b>🦅 پایگاه</b> محافظت کن! اگه پایگاه بترکه باختی.' : 'Destroy the waves and <b>protect the 🦅 base</b>! Base down = game over.') + '</p>' +
      '<p>⭐ ' + (fa ? 'قدرت · 🛡 سپر · ❄ انجماد · ❤️ جون — از تانک‌های چشمک‌زن می‌افته' : 'power · 🛡 shield · ❄ freeze · ❤️ life — dropped by flashing tanks') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '🔥 به نبرد!' : '🔥 Battle!') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }
  function showOver(win) {
    const r = api.submitScore(score);
    best = Math.max(best, score);
    if (win) sfx.win(); else sfx.lose();
    vibrate(120);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>' + (win ? '🏆' : '💥') + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (!baseAlive ? (fa ? 'پایگاه نابود شد!' : 'Base destroyed!') : win ? (fa ? 'همه موج‌ها رو بردی!' : 'All waves cleared!') : (fa ? 'تانکت نابود شد!' : 'Your tank is down!')) + (r.isBest ? ' 🏆' : '') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '↻ دوباره' : '↻ Retry') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.click(); bover(); reset(); started = true;
    });
  }

  function burst(bx, by, color, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(40, spd || 240);
      parts.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.7), c: color, r: rand(2, 5) });
    }
  }
  function spawnFoe() {
    if (!queue.length) return;
    const type = queue.shift();
    const spots = [0, 6, 12];
    const sx = spots[(Math.random() * 3) | 0];
    const F = FOE[type];
    // جای خالی؟
    for (const f of foes) {
      if (Math.abs(f.x - (sx * T + T / 2)) < T && f.y < T * 1.5) { queue.unshift(type); return; }
    }
    foes.push({
      type, hp: F.hp, x: sx * T + T / 2, y: T / 2, d: { x: 0, y: 1 },
      cd: rand(0.6, 1.6), turn: rand(0.8, 2.4), flash: Math.random() < 0.3, born: 1,
    });
  }
  function fire(x, y, d, bs, foe, pw) {
    bullets.push({ x: x + d.x * 22, y: y + d.y * 22, d: { ...d }, sp: bs, foe: !!foe, pw: pw || 1, dead: false });
    sfx.shoot();
  }
  function playerFire() {
    if (!started || over || paused || pl.respawn > 0) return;
    if (pl.cd > 0) return;
    const mine = bullets.filter((b) => !b.foe && !b.dead).length;
    if (mine >= (power >= 2 ? 2 : 1)) return;
    pl.cd = power >= 3 ? 0.16 : 0.28;
    fire(pl.x, pl.y, pl.d, 560, false, power);
  }
  function hitFoe(f, pw) {
    f.hp -= pw >= 3 ? 2 : 1;
    if (f.hp <= 0) {
      f.dead = true;
      score += FOE[f.type].sc;
      burst(f.x, f.y, '#ffb02e', 20, 300);
      burst(f.x, f.y, '#ff3b1e', 12, 220);
      sfx.boom(); vibrate(40);
      if (f.flash) {
        const kinds = ['star', 'shield', 'freeze', 'star', 'life'];
        const k = kinds[(Math.random() * kinds.length) | 0];
        const px = clamp(Math.floor(f.x / T), 1, COLS - 2), py = clamp(Math.floor(f.y / T), 1, ROWS - 2);
        pows.push({ x: px, y: py, k, t: 14 });
        sfx.coin();
      }
      hud();
    } else {
      sfx.hit();
      burst(f.x, f.y, '#fff', 6, 160);
    }
  }
  function hitPlayer() {
    if (shieldT > 0 || pl.respawn > 0 || over) return;
    lives--;
    power = 1;
    burst(pl.x, pl.y, '#4da3ff', 24, 320);
    sfx.boom(); vibrate(120);
    hud();
    if (lives <= 0) { over = true; showOver(false); }
    else { pl.respawn = 1.6; shieldT = 2.5; pl.x = 2 * T + T / 2; pl.y = 12 * T + T / 2; pl.d = { x: 0, y: -1 }; }
  }
  function blastBrick(tx, ty, pw, dx, dy) {
    // تخریب ناحیه‌ای آجر
    const cells = [[tx, ty]];
    if (pw >= 2) {
      cells.push([tx + (dy !== 0 ? 1 : 0), ty + (dx !== 0 ? 1 : 0)]);
      cells.push([tx - (dy !== 0 ? 1 : 0), ty - (dx !== 0 ? 1 : 0)]);
    }
    for (const [cx, cy] of cells) {
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) continue;
      if (grid[cy][cx] === '#') {
        grid[cy][cx] = '.';
        burst(cx * T + T / 2, cy * T + T / 2, '#c96a3b', 6, 180);
      } else if (isSteel(cx, cy) && pw >= 3) {
        steel[cy][cx] = false;
        burst(cx * T + T / 2, cy * T + T / 2, '#9aa2b5', 8, 200);
      }
      if (grid[cy][cx] === 'B') {
        baseAlive = false;
        grid[cy][cx] = '.';
        burst(cx * T + T / 2, cy * T + T / 2, '#ff3b1e', 30, 380);
        over = true;
        showOver(false);
        return;
      }
    }
  }
  function tankBlocked(x, y, half) {
    const x0 = Math.floor((x - half) / T), x1 = Math.floor((x + half) / T);
    const y0 = Math.floor((y - half) / T), y1 = Math.floor((y + half) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
      const t = grid[ty][tx];
      if (t === '#' || t === '~' || t === 'B' || isSteel(tx, ty)) return true;
    }
    return false;
  }

  const keys = {};
  function update(dt) {
    if (!started || paused || over) return;
    if (lvlT > 0) lvlT -= dt;
    if (freezeT > 0) freezeT -= dt;
    if (shieldT > 0) shieldT -= dt;
    if (pl.cd > 0) pl.cd -= dt;
    if (pl.respawn > 0) pl.respawn -= dt;
    for (const p of parts) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= (1 - 3 * dt); p.vy *= (1 - 3 * dt); }
    parts = parts.filter((p) => p.t > 0);
    for (const p of pows) p.t -= dt;
    pows = pows.filter((p) => p.t > 0);

    // اسپاون دشمن
    if (queue.length && foes.filter((f) => !f.dead).length < 4) {
      spawnT -= dt;
      if (spawnT <= 0) { spawnFoe(); spawnT = 1.4; }
    }

    // بازیکن
    if (pl.respawn <= 0) {
      let dx = 0, dy = 0;
      if (keys.ArrowLeft || keys.a || keys.A || keys.left) { dx = -1; }
      else if (keys.ArrowRight || keys.d || keys.D || keys.right) { dx = 1; }
      else if (keys.ArrowUp || keys.w || keys.W || keys.up) { dy = -1; }
      else if (keys.ArrowDown || keys.s || keys.S || keys.down) { dy = 1; }
      if (dx || dy) {
        pl.d = { x: dx, y: dy };
        const sp = 165;
        const nx = pl.x + dx * sp * dt;
        if (!tankBlocked(nx, pl.y, 15)) pl.x = nx;
        else {
          // کمک‌گوشه
          const cy = Math.floor(pl.y / T) * T + T / 2;
          if (dx !== 0 && Math.abs(pl.y - cy) < 16 && Math.abs(pl.y - cy) > 2) pl.y += (cy > pl.y ? 1 : -1) * sp * dt * 0.7;
        }
        const ny = pl.y + dy * sp * dt;
        if (!tankBlocked(pl.x, ny, 15)) pl.y = ny;
        else {
          const cx = Math.floor(pl.x / T) * T + T / 2;
          if (dy !== 0 && Math.abs(pl.x - cx) < 16 && Math.abs(pl.x - cx) > 2) pl.x += (cx > pl.x ? 1 : -1) * sp * dt * 0.7;
        }
        pl.x = clamp(pl.x, T / 2, W - T / 2);
        pl.y = clamp(pl.y, T / 2, H - T / 2);
      }
      // پاورآپ
      for (const p of pows) {
        if (p.got) continue;
        if (Math.abs(p.x * T + T / 2 - pl.x) < 30 && Math.abs(p.y * T + T / 2 - pl.y) < 30) {
          p.got = true;
          if (p.k === 'star') power = Math.min(3, power + 1);
          else if (p.k === 'shield') shieldT = 10;
          else if (p.k === 'freeze') freezeT = 7;
          else lives = Math.min(6, lives + 1);
          sfx.level();
          hud();
        }
      }
      pows = pows.filter((p) => !p.got);
    }

    // دشمن‌ها
    for (const f of foes) {
      if (f.dead) continue;
      if (f.born > 0) { f.born -= dt; continue; }
      if (freezeT > 0) continue;
      const F = FOE[f.type];
      f.turn -= dt;
      if (f.turn <= 0) {
        f.turn = rand(0.7, 2.2);
        const r = Math.random();
        if (r < 0.26) f.d = { x: 0, y: 1 }; // گرایش به پایگاه
        else if (r < 0.46) f.d = { x: pl.x > f.x ? 1 : -1, y: 0 }; // گرایش به بازیکن
        else {
          const opts = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
          f.d = { ...opts[(Math.random() * 4) | 0] };
        }
      }
      const nx = f.x + f.d.x * F.sp * dt;
      const ny = f.y + f.d.y * F.sp * dt;
      let blocked = tankBlocked(nx, ny, 15);
      if (!blocked) {
        // برخورد با تانک‌های دیگر
        for (const o of foes) {
          if (o === f || o.dead) continue;
          if (Math.abs(o.x - nx) < 30 && Math.abs(o.y - ny) < 30) { blocked = true; break; }
        }
        if (pl.respawn <= 0 && Math.abs(pl.x - nx) < 30 && Math.abs(pl.y - ny) < 30) blocked = true;
      }
      if (!blocked) { f.x = nx; f.y = ny; }
      else f.turn = 0;
      f.cd -= dt;
      if (f.cd <= 0) {
        f.cd = rand(1.25, 2.6) - Math.min(0.6, level * 0.08);
        const mine = bullets.filter((b) => b.foe && !b.dead).length;
        if (mine < 3 + Math.min(3, level)) fire(f.x, f.y, f.d, F.bs, true, 1);
      }
    }
    foes = foes.filter((f) => !f.dead);

    // گلوله‌ها
    for (const b of bullets) {
      if (b.dead) continue;
      const steps = 2;
      for (let s = 0; s < steps && !b.dead; s++) {
        b.x += b.d.x * (b.sp * dt / steps);
        b.y += b.d.y * (b.sp * dt / steps);
        if (b.x < 0 || b.y < 0 || b.x > W || b.y > H) { b.dead = true; burst(clamp(b.x, 4, W - 4), clamp(b.y, 4, H - 4), '#fff', 4, 120); break; }
        const tx = Math.floor(b.x / T), ty = Math.floor(b.y / T);
        const t = tileAt(tx, ty);
        if (t === '#' || isSteel(tx, ty) || t === 'B') {
          if (t === 'B' || t === '#') blastBrick(tx, ty, b.pw, b.d.x, b.d.y);
          else if (isSteel(tx, ty)) {
            if (b.pw >= 3) blastBrick(tx, ty, b.pw, b.d.x, b.d.y);
            else { sfx.tick(); burst(b.x, b.y, '#fff', 5, 140); }
          }
          if (!b.foe) sfx.pop();
          b.dead = true;
          break;
        }
        if (!b.foe) {
          for (const f of foes) {
            if (f.dead || f.born > 0) continue;
            if (Math.abs(f.x - b.x) < 19 && Math.abs(f.y - b.y) < 19) {
              hitFoe(f, b.pw);
              b.dead = true;
              break;
            }
          }
        } else if (pl.respawn <= 0) {
          if (Math.abs(pl.x - b.x) < 19 && Math.abs(pl.y - b.y) < 19) {
            hitPlayer();
            b.dead = true;
            break;
          }
        }
        // گلوله به گلوله
        for (const o of bullets) {
          if (o === b || o.dead || o.foe === b.foe) continue;
          if (Math.abs(o.x - b.x) < 10 && Math.abs(o.y - b.y) < 10) {
            o.dead = true; b.dead = true;
            burst(b.x, b.y, '#fff', 6, 150);
            break;
          }
        }
      }
    }
    bullets = bullets.filter((b) => !b.dead);

    // پایان مرحله؟
    if (!queue.length && !foes.length && baseAlive) {
      score += 500 + level * 250;
      level++;
      sfx.clear();
      buildLevel();
      hud();
    }
  }

  function drawTank(x, y, d, c1, c2, flash) {
    ctx.save();
    ctx.translate(x, y);
    const a = d.x === 1 ? Math.PI / 2 : d.x === -1 ? -Math.PI / 2 : d.y === 1 ? Math.PI : 0;
    ctx.rotate(a);
    if (flash && ((performance.now() / 150) | 0) % 2) { c1 = '#fff'; c2 = '#ffd93b'; }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(-15, -13, 32, 30);
    // شنی‌ها
    ctx.fillStyle = '#22242e';
    ctx.fillRect(-17, -14, 9, 30);
    ctx.fillRect(8, -14, 9, 30);
    ctx.fillStyle = '#4a4f63';
    for (let i = -14; i < 14; i += 7) {
      ctx.fillRect(-17, i, 9, 3);
      ctx.fillRect(8, i, 9, 3);
    }
    // بدنه
    const g = ctx.createLinearGradient(0, -14, 0, 14);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(-9, -12, 18, 26);
    // لوله
    ctx.fillStyle = '#22242e';
    ctx.fillRect(-3, -24, 6, 16);
    // برجک
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
    ctx.restore();
  }

  function render(t) {
    ctx.fillStyle = '#0c0e16';
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = grid[y][x];
      if (v === '.') {
        ctx.fillStyle = (x + y) % 2 ? '#101322' : '#121627';
        ctx.fillRect(x * T, y * T, T, T);
      } else if (v === '#') {
        ctx.fillStyle = '#7a2e1d';
        ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = '#c96a3b';
        ctx.fillRect(x * T + 2, y * T + 2, T - 4, 7);
        ctx.fillRect(x * T + 2, y * T + 13, T - 4, 7);
        ctx.fillRect(x * T + 2, y * T + 24, T - 4, 7);
        ctx.fillStyle = '#7a2e1d';
        ctx.fillRect(x * T + T / 2 - 1, y * T + 2, 2, 7);
        ctx.fillRect(x * T + T / 4, y * T + 13, 2, 7);
        ctx.fillRect(x * T + (3 * T) / 4, y * T + 13, 2, 7);
        ctx.fillRect(x * T + T / 2 - 1, y * T + 24, 2, 7);
      } else if (isSteel(x, y)) {
        ctx.fillStyle = '#565d73';
        ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = '#9aa2b5';
        ctx.fillRect(x * T + 3, y * T + 3, T - 6, T - 6);
        ctx.fillStyle = '#565d73';
        ctx.fillRect(x * T + 8, y * T + 8, T - 16, T - 16);
        ctx.fillStyle = '#c9cfdf';
        ctx.fillRect(x * T + 12, y * T + 12, T - 24, T - 24);
      } else if (v === '~') {
        ctx.fillStyle = '#123a6b';
        ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = 'rgba(120,200,255,.5)';
        const o = (t * 30 + x * 10 + y * 6) % 40;
        ctx.fillRect(x * T + o - 20, y * T + 10, 14, 3);
        ctx.fillRect(x * T + 40 - o - 10, y * T + 26, 14, 3);
      } else if (v === 'B' && baseAlive) {
        ctx.fillStyle = '#1c2030';
        ctx.fillRect(x * T, y * T, T, T);
        ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🦅', x * T + T / 2, y * T + T / 2);
      }
    }
    // پاورآپ‌ها
    for (const p of pows) {
      const px = p.x * T + T / 2, py = p.y * T + T / 2;
      if (p.t < 3 && ((t * 6) | 0) % 2) continue;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(p.x * T + 4, p.y * T + 4, T - 8, T - 8);
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.k === 'star' ? '⭐' : p.k === 'shield' ? '🛡' : p.k === 'freeze' ? '❄️' : '❤️', px, py);
    }
    // دشمن‌ها
    for (const f of foes) {
      if (f.born > 0) {
        ctx.font = '24px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✨', f.x, f.y);
        continue;
      }
      const F = FOE[f.type];
      drawTank(f.x, f.y, f.d, F.c1, F.c2, f.flash);
      if (f.type === 'armor') {
        ctx.fillStyle = '#0c0e16';
        ctx.fillRect(f.x - 14, f.y - 26, 28, 5);
        ctx.fillStyle = '#5effc3';
        ctx.fillRect(f.x - 13, f.y - 25, 26 * (f.hp / 4), 3);
      }
      if (freezeT > 0) {
        ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🧊', f.x, f.y - 24);
      }
    }
    // بازیکن
    if (pl.respawn <= 0) drawTank(pl.x, pl.y, pl.d, '#4da3ff', '#1d4d8f', false);
    if (shieldT > 0 && pl.respawn <= 0) {
      ctx.strokeStyle = 'rgba(90,255,255,.8)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, 24 + Math.sin(t * 8) * 2, 0, 7); ctx.stroke();
    }
    // درخت‌ها (روی همه)
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === '%') {
        ctx.fillStyle = 'rgba(20,90,40,.88)';
        ctx.beginPath(); ctx.arc(x * T + 10, y * T + 14, 12, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x * T + 28, y * T + 10, 13, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x * T + 20, y * T + 28, 13, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(60,180,90,.5)';
        ctx.beginPath(); ctx.arc(x * T + 14, y * T + 12, 5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x * T + 28, y * T + 24, 5, 0, 7); ctx.fill();
      }
    }
    // گلوله‌ها
    for (const b of bullets) {
      ctx.fillStyle = b.foe ? '#ff5c5c' : '#ffe93b';
      ctx.shadowColor = b.foe ? '#ff5c5c' : '#ffe93b';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.pw >= 3 && !b.foe ? 6 : 4.5, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // ذرات
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.t * 2.5, 0, 1);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // باقی‌مانده دشمن
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText('👾' + pnum(queue.length + foes.length) + (power > 1 ? '  ⭐' + pnum(power) : ''), 8, 6);
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
    if (down && (e.key === ' ' || e.key === 'j' || e.key === 'J')) playerFire();
    if (down && (e.key === 'p' || e.key === 'P')) togglePause();
  }
  function togglePause() {
    if (!started || over) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); bover(); reset(); started = true; });
  wrap.querySelector('[data-pause]').addEventListener('click', () => { sfx.click(); togglePause(); });
  const fb = wrap.querySelector('[data-fire]');
  if (fb) {
    fb.addEventListener('click', playerFire);
    const bind = (sel, k) => {
      const b = wrap.querySelector(sel);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.unlock(); keys[k] = true; });
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
