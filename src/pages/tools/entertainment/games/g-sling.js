// 🐦 منجنیق — پرتاب پرنده، تخریب قلعه خوک‌ها؛ ۸ مرحله
import { pnum, vibrate, makeLoop, rand, clamp } from '../arcade.js';

const SAVE_KEY = 'ViXoRa:sling-progress';
const GRAV = 1350;
const MAT = {
  glass: { hp: 22, c1: '#bfefff', c2: '#5fb8d4', sc: 30 },
  wood: { hp: 46, c1: '#d29a54', c2: '#8a5a24', sc: 50 },
  stone: { hp: 95, c1: '#9aa2b5', c2: '#565d73', sc: 80 },
};
// blocks: [x, yOff(از زمین), w, h, mat] — چیدمان دقیق روی هم
const LEVELS = [
  { birds: ['red', 'red'], blocks: [[1050, 0, 26, 120, 'glass'], [1150, 0, 26, 120, 'glass'], [1040, 120, 150, 24, 'wood']], pigs: [[1100, 0, 20]], tnt: [] },
  { birds: ['red', 'red', 'red'], blocks: [[1020, 0, 26, 150, 'wood'], [1140, 0, 26, 150, 'wood'], [1010, 150, 166, 24, 'wood'], [1070, 174, 60, 60, 'glass']], pigs: [[1080, 0, 20], [1100, 174, 18]], tnt: [] },
  { birds: ['red', 'bomb', 'red'], blocks: [[1000, 0, 26, 120, 'wood'], [1120, 0, 26, 120, 'wood'], [990, 120, 166, 24, 'wood']], pigs: [[1060, 0, 22]], tnt: [[1060, 144]] },
  { birds: ['chuck', 'red', 'red'], blocks: [[980, 0, 30, 180, 'stone'], [1120, 0, 30, 180, 'stone'], [970, 180, 190, 26, 'stone'], [1030, 206, 70, 70, 'wood']], pigs: [[1060, 0, 20], [1065, 276, 18]], tnt: [] },
  { birds: ['bomb', 'chuck', 'red'], blocks: [[960, 0, 26, 140, 'wood'], [1060, 0, 26, 140, 'wood'], [950, 140, 146, 24, 'wood'], [1140, 0, 26, 140, 'wood'], [1240, 0, 26, 140, 'wood'], [1130, 140, 146, 24, 'stone']], pigs: [[1010, 0, 20], [1190, 0, 20]], tnt: [[1100, 0]] },
  { birds: ['chuck', 'bomb', 'red', 'red'], blocks: [[940, 0, 30, 200, 'stone'], [1080, 0, 30, 200, 'stone'], [930, 200, 190, 26, 'stone'], [1000, 226, 60, 90, 'glass'], [1150, 0, 26, 130, 'wood'], [1250, 0, 26, 130, 'wood'], [1140, 130, 146, 24, 'wood']], pigs: [[1010, 0, 20], [1030, 316, 18], [1200, 0, 20]], tnt: [[1100, 0]] },
  { birds: ['bomb', 'bomb', 'chuck', 'red'], blocks: [[920, 0, 30, 220, 'stone'], [1060, 0, 30, 220, 'stone'], [910, 220, 190, 26, 'stone'], [960, 246, 60, 100, 'wood'], [1020, 246, 60, 100, 'wood'], [950, 346, 160, 24, 'glass'], [1180, 0, 26, 150, 'stone'], [1290, 0, 26, 150, 'stone'], [1170, 150, 146, 24, 'stone']], pigs: [[990, 0, 22], [985, 370, 18], [1235, 0, 20]], tnt: [[1110, 0], [1030, 370]] },
  { birds: ['chuck', 'bomb', 'bomb', 'red', 'red'], blocks: [[900, 0, 30, 240, 'stone'], [1040, 0, 30, 240, 'stone'], [890, 240, 190, 26, 'stone'], [940, 266, 56, 110, 'stone'], [1000, 266, 56, 110, 'stone'], [930, 376, 170, 24, 'wood'], [960, 400, 80, 80, 'glass'], [1160, 0, 30, 170, 'stone'], [1300, 0, 30, 170, 'stone'], [1150, 170, 190, 26, 'stone'], [1210, 196, 70, 70, 'wood']], pigs: [[970, 0, 22], [1000, 480, 20], [1230, 0, 20], [1245, 266, 18]], tnt: [[1090, 0], [896, 266]] },
];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const { sfx } = api;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🎯 <b data-s>۰</b></span>' +
    '<span class="ag-pill">🗺 <b data-lv>۱</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:680px"><canvas data-cv width="640" height="400" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'مرحله' : 'Level') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'بکش و ول کن! · وسط پرواز بزن: 💣 انفجار · ⚡ سرعت' : 'Drag & release! · tap mid-flight: 💣 boom · ⚡ dash') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const lEl = wrap.querySelector('[data-lv]');
  const W = 640, H = 400, GY = H - 46, WORLD = 1450;
  const SLING = { x: 190, y: GY - 120 };

  let progress = 0;
  try { progress = Number(localStorage.getItem(SAVE_KEY) || 0) || 0; } catch { /* ignore */ }
  progress = clamp(progress, 0, LEVELS.length - 1);

  let level, birds, bird, blocks, pigs, tnts, parts, score, best;
  let dragging, dragX, dragY, state, stateT, camX, started, shake, abilityUsed;

  function blk(x, yOff, w, h, mat) {
    return { x, y: GY - yOff - h, w, h, mat, hp: MAT[mat].hp, vx: 0, vy: 0, awake: false, dead: false, wob: 0 };
  }
  function loadLevel(i) {
    level = i;
    const L = LEVELS[i];
    birds = [...L.birds];
    blocks = L.blocks.map((b) => blk(b[0], b[1], b[2], b[3], b[4]));
    pigs = L.pigs.map((p) => ({ x: p[0], y: GY - p[1] - p[2] * 2, r: p[2], hp: 30, vx: 0, vy: 0, awake: false, dead: false }));
    tnts = L.tnt.map((t) => ({ x: t[0], y: GY - t[1] - 34, w: 34, h: 34, hp: 30, dead: false, vx: 0, vy: 0, awake: true, wob: 0 }));
    parts = [];
    nextBird();
    state = 'aim'; stateT = 0; camX = 0; shake = 0;
    hud();
  }
  function nextBird() {
    dragging = false; abilityUsed = false;
    if (!birds.length) { bird = null; return; }
    const type = birds.shift();
    bird = { type, x: SLING.x, y: SLING.y, vx: 0, vy: 0, r: 17, flying: false, rest: 0, dead: false, trail: [] };
  }
  function hud() {
    sEl.textContent = pnum(score);
    lEl.textContent = pnum(level + 1) + '/' + pnum(LEVELS.length);
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
    ov.innerHTML = '<h2>🐦 ' + (fa ? 'منجنیق' : 'Slingshot') + '</h2>' +
      '<p>' + (fa ? 'پرنده رو <b>بکش و ول کن</b> تا قلعه خوک‌ها رو خراب کنی! هر مرحله با پرنده کمتر = ستاره بیشتر.' : '<b>Drag & release</b> to smash the pig fortress! Fewer birds = more stars.') + '</p>' +
      '<p>💣 ' + (fa ? 'بمبی وسط هوا بزن منفجر میشه · ⚡ رعدی سرعت می‌گیره' : 'tap Bomber mid-air to explode · Chuck dashes') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '🐦 شروع نبرد' : '🐦 Battle!') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }
  function levelOver(win) {
    state = win ? 'win' : 'lose';
    stateT = win ? 1.4 : 1.2;
    if (win) {
      const stars = birds.length >= 2 ? 3 : birds.length === 1 ? 2 : 1;
      const bonus = birds.length * 500 + stars * 250;
      score += bonus + 1000;
      best = Math.max(best, score);
      api.submitScore(score);
      sfx.win();
      if (level + 1 > progress) { progress = Math.min(LEVELS.length - 1, level + 1); try { localStorage.setItem(SAVE_KEY, String(progress)); } catch { /* ignore */ } }
      setTimeout(() => {
        if (state !== 'win') return;
        const ov = document.createElement('div');
        ov.className = 'ag-overlay';
        ov.dataset.over = '1';
        const last = level >= LEVELS.length - 1;
        ov.innerHTML = '<h2>' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</h2>' +
          '<div class="ag-big">' + pnum(score) + '</div>' +
          '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (last ? (fa ? '🏆 از اول (سخت‌تر؟ نه، حال کن!)' : '🏆 Replay') : (fa ? '▶ مرحله بعد' : '▶ Next')) + '</button> ' +
          '<button class="ag-btn" type="button" data-rp>↻</button>';
        wrap.querySelector('.ag-board').appendChild(ov);
        ov.querySelector('[data-go]').addEventListener('click', (e) => {
          e.stopPropagation(); sfx.click(); ov.remove();
          loadLevel(last ? 0 : level + 1);
        });
        ov.querySelector('[data-rp]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); ov.remove(); loadLevel(level); });
      }, 1400);
    } else {
      sfx.lose();
      setTimeout(() => {
        if (state !== 'lose') return;
        const ov = document.createElement('div');
        ov.className = 'ag-overlay';
        ov.dataset.over = '1';
        ov.innerHTML = '<h2>🐷</h2><p>' + (fa ? 'خوک‌ها هنوز زندن! دوباره تلاش کن' : 'Pigs survived! Try again') + '</p>' +
          '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '↻ تلاش دوباره' : '↻ Retry') + '</button>';
        wrap.querySelector('.ag-board').appendChild(ov);
        ov.querySelector('[data-go]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); ov.remove(); loadLevel(level); });
      }, 1200);
    }
    hud();
  }

  function burst(bx, by, color, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(60, spd || 320);
      parts.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, g: 900, t: rand(0.4, 0.9), c: color, r: rand(2, 5) });
    }
  }
  function explode(wx, wy, radius, dmg) {
    sfx.boom(); vibrate(80); shake = 16;
    burst(wx - camX, wy, '#ff9a3b', 24, 420);
    burst(wx - camX, wy, '#ff3b5c', 16, 320);
    burst(wx - camX, wy, '#fff', 10, 200);
    const all = [...blocks, ...pigs, ...tnts.filter((t) => !t.dead)];
    for (const b of all) {
      if (b.dead) continue;
      const px = b.r ? b.x : b.x + b.w / 2;
      const py = b.r ? b.y + b.r : b.y + b.h / 2;
      const d = Math.hypot(px - wx, py - wy);
      if (d < radius) {
        const f = 1 - d / radius;
        damage(b, dmg * (0.4 + f), (px - wx) * 6 * f, (py - wy) * 6 * f - 260 * f);
      }
    }
  }
  function damage(b, dmg, kx, ky) {
    if (b.dead) return;
    b.hp -= dmg;
    b.awake = true;
    b.vx = (b.vx || 0) + (kx || 0);
    b.vy = (b.vy || 0) + (ky || 0);
    if (b.w && b.wob !== undefined) b.wob = 0.3;
    if (b.hp <= 0) {
      b.dead = true;
      const px = b.r ? b.x : b.x + b.w / 2;
      const py = b.r ? b.y + b.r : b.y + b.h / 2;
      if (b.r) {
        burst(px - camX, py, '#7dff8a', 18, 300);
        score += 500; sfx.clear();
      } else if (b.mat) {
        burst(px - camX, py, MAT[b.mat].c1, 12, 260);
        score += MAT[b.mat].sc; sfx.pop();
      } else {
        explode(px, py, 150, 130);
        return;
      }
      hud();
    } else if (b.mat) sfx.place();
  }

  function physBody(b, dt, isCircle) {
    if (!b.awake || b.dead) return;
    b.vy += GRAV * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= (1 - 0.4 * dt);
    const hh = isCircle ? b.r * 2 : b.h;
    if (b.y + hh >= GY) {
      b.y = GY - hh;
      if (b.vy > 620) damage(b, (b.vy - 620) * 0.06, 0, 0);
      b.vy = -b.vy * 0.18;
      if (Math.abs(b.vy) < 30) b.vy = 0;
      b.vx *= (1 - 3 * dt);
    }
    if (b.wob > 0) b.wob -= dt;
  }
  // برخورد جعبه‌ها با هم (AABB ساده)
  function collideBoxes() {
    const solids = [...blocks.filter((b) => !b.dead), ...tnts.filter((t) => !t.dead)];
    for (let i = 0; i < solids.length; i++) {
      for (let j = i + 1; j < solids.length; j++) {
        const a = solids[i], c = solids[j];
        if (!a.awake && !c.awake) continue;
        const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
        const oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
        if (ox > 0 && oy > 0) {
          const impact = Math.abs(a.vy - c.vy) + Math.abs(a.vx - c.vx);
          if (ox < oy) {
            const push = ox / 2 + 0.5;
            if (a.x < c.x) { a.x -= push; c.x += push; } else { a.x += push; c.x -= push; }
            const tv = a.vx; a.vx = c.vx * 0.4; c.vx = tv * 0.4;
          } else {
            const push = oy / 2 + 0.5;
            if (a.y < c.y) { a.y -= push; c.y += push; } else { a.y += push; c.y -= push; }
            const tv = a.vy; a.vy = c.vy * 0.2; c.vy = tv * 0.2;
          }
          if (impact > 260) {
            damage(a, impact * 0.045, 0, 0);
            damage(c, impact * 0.045, 0, 0);
          }
          a.awake = c.awake = true;
        }
      }
    }
    // له شدن خوک زیر جعبه
    for (const p of pigs) {
      if (p.dead) continue;
      for (const b of solids) {
        if (b.dead) continue;
        if (p.x > b.x - p.r && p.x < b.x + b.w + p.r && p.y + p.r * 2 > b.y && p.y < b.y + b.h) {
          if (b.vy > 200 || b.awake) damage(p, 60, 0, 0);
          else if (!p.awake) { /* ساکن زیر سقف — زنده */ }
        }
      }
    }
  }
  // پرنده در برابر همه
  function birdHits() {
    if (!bird || !bird.flying || bird.dead) return;
    const sp = Math.hypot(bird.vx, bird.vy);
    if (bird.y + bird.r * 2 >= GY && bird.vy > 0) {
      bird.y = GY - bird.r * 2;
      bird.vy = -bird.vy * 0.3;
      bird.vx *= 0.7;
      if (sp > 500) { sfx.place(); burst(bird.x - camX, GY, '#8a7a5f', 8, 200); }
    }
    for (const b of blocks) {
      if (b.dead) continue;
      const nx = clamp(bird.x, b.x, b.x + b.w), ny = clamp(bird.y + bird.r, b.y, b.y + b.h);
      if (Math.hypot(bird.x - nx, bird.y + bird.r - ny) < bird.r) {
        const imp = sp * (bird.type === 'chuck' && bird.dashed ? 1.8 : 1);
        damage(b, 20 + imp * 0.075, bird.vx * 0.25, -120);
        // بازتاب
        if (Math.abs(nx - bird.x) > Math.abs(ny - (bird.y + bird.r))) bird.vx = -bird.vx * 0.35;
        else bird.vy = -Math.abs(bird.vy) * 0.35;
        bird.vx *= 0.82; bird.vy *= 0.82;
        sfx.hit();
      }
    }
    for (const p of pigs) {
      if (p.dead) continue;
      if (Math.hypot(bird.x - p.x, bird.y + bird.r - (p.y + p.r)) < bird.r + p.r) {
        damage(p, 30 + sp * 0.06, bird.vx * 0.4, -160);
        bird.vx *= 0.75; bird.vy *= 0.75;
      }
    }
    for (const t of tnts) {
      if (t.dead) continue;
      const nx = clamp(bird.x, t.x, t.x + t.w), ny = clamp(bird.y + bird.r, t.y, t.y + t.h);
      if (Math.hypot(bird.x - nx, bird.y + bird.r - ny) < bird.r && sp > 220) {
        t.dead = true;
        explode(t.x + t.w / 2, t.y + t.h / 2, 150, 130);
      }
    }
  }

  function update(dt) {
    if (!started) return;
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
    for (const p of parts) { p.t -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    parts = parts.filter((p) => p.t > 0);
    if (state === 'win' || state === 'lose') return;

    // حلقه فیزیک
    const sub = 2;
    for (let s = 0; s < sub; s++) {
      const h = dt / sub;
      if (bird && bird.flying && !bird.dead) {
        bird.vy += GRAV * h;
        bird.x += bird.vx * h;
        bird.y += bird.vy * h;
        bird.trail.push({ x: bird.x, y: bird.y + bird.r });
        if (bird.trail.length > 26) bird.trail.shift();
      }
      for (const b of blocks) physBody(b, h, false);
      for (const p of pigs) physBody(p, h, true);
      for (const t of tnts) physBody(t, h, false);
      birdHits();
      collideBoxes();
      // چک تکیه‌گاه بلوک‌های ساکن
      for (const b of blocks) {
        if (b.dead || b.awake) continue;
        const belowY = b.y + b.h + 5;
        let support = belowY >= GY;
        if (!support) {
          for (const o of blocks) {
            if (o === b || o.dead) continue;
            if (b.x + b.w / 2 > o.x && b.x + b.w / 2 < o.x + o.w && belowY > o.y && b.y + b.h <= o.y + 12) { support = true; break; }
          }
        }
        if (!support) { b.awake = true; b.vy = 20; }
      }
    }
    // پایان پرواز؟
    if (bird && bird.flying) {
      const sp = Math.hypot(bird.vx, bird.vy);
      if (sp < 60) bird.rest += dt; else bird.rest = 0;
      if (bird.rest > 0.9 || bird.x > WORLD + 100 || bird.x < -100) {
        bird.flying = false; bird.dead = true;
        setTimeout(() => {
          if (state !== 'settle') return;
          if (pigs.every((p) => p.dead)) levelOver(true);
          else if (!birds.length && pigs.some((p) => !p.dead)) levelOver(false);
          else { nextBird(); state = 'aim'; }
        }, 600);
        state = 'settle';
      }
    }
    if (state === 'settle') {
      // اگر خوک‌ها همه مردن وسط settle
      if (pigs.every((p) => p.dead)) levelOver(true);
    }
    // دوربین
    let tx = 0;
    if (bird && bird.flying) tx = clamp(bird.x - 230, 0, WORLD - W);
    else if (state === 'aim') tx = 0;
    else tx = clamp((bird ? bird.x : 400) - 230, 0, WORLD - W);
    camX += (tx - camX) * Math.min(1, dt * 3.5);
  }

  function render(t) {
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#6ec6ff'); sky.addColorStop(1, '#d8f4ff');
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 300 - camX * 0.2 + 1500) % 1100) - 200;
      ctx.beginPath(); ctx.ellipse(cx, 60 + i * 28, 60, 22, 0, 0, 7); ctx.fill();
    }
    // تپه‌ها
    ctx.fillStyle = '#8fd694';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 16) {
      ctx.lineTo(sx, GY - 40 - Math.sin((camX * 0.5 + sx) * 0.008) * 34);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // زمین
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(0, GY, W, H - GY);
    ctx.fillStyle = '#5da244';
    ctx.fillRect(0, GY, W, 10);

    const X = (wx) => wx - camX;
    // رد پرنده
    if (bird && bird.trail.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
      ctx.beginPath();
      bird.trail.forEach((p, i) => { if (i === 0) ctx.moveTo(X(p.x), p.y); else ctx.lineTo(X(p.x), p.y); });
      ctx.stroke();
    }
    // منجنیق
    ctx.strokeStyle = '#6b3f1d'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X(SLING.x), GY); ctx.lineTo(X(SLING.x), SLING.y + 10); ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(X(SLING.x), SLING.y + 26); ctx.lineTo(X(SLING.x) - 20, SLING.y - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(SLING.x), SLING.y + 26); ctx.lineTo(X(SLING.x) + 20, SLING.y - 6); ctx.stroke();
    // کش
    const anchor = bird && !bird.flying ? { x: X(bird.x), y: bird.y + bird.r } : null;
    if (anchor && (dragging || state === 'aim')) {
      ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(X(SLING.x) - 20, SLING.y - 6); ctx.lineTo(anchor.x, anchor.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(SLING.x) + 20, SLING.y - 6); ctx.lineTo(anchor.x, anchor.y); ctx.stroke();
    }
    // مسیر پیش‌نمایش
    if (dragging && bird && !bird.flying) {
      const vx = (SLING.x - bird.x) * 12, vy = (SLING.y - (bird.y + bird.r)) * 12;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 1; i <= 12; i++) {
        const tt = i * 0.09;
        const px = X(bird.x + vx * tt);
        const py = bird.y + bird.r + vy * tt + 0.5 * GRAV * tt * tt;
        ctx.beginPath(); ctx.arc(px, py, 4 - i * 0.2, 0, 7); ctx.fill();
      }
    }
    // بلوک‌ها
    for (const b of blocks) {
      if (b.dead) continue;
      const sx = X(b.x);
      if (sx < -120 || sx > W + 120) continue;
      const m = MAT[b.mat];
      ctx.save();
      if (b.wob > 0) {
        ctx.translate(sx + b.w / 2, b.y + b.h / 2);
        ctx.rotate(Math.sin(t * 40) * 0.03 * b.wob * 3);
        ctx.translate(-(sx + b.w / 2), -(b.y + b.h / 2));
      }
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(sx + 2, b.y + 3, b.w, b.h);
      const g = ctx.createLinearGradient(sx, 0, sx + b.w, 0);
      g.addColorStop(0, m.c2); g.addColorStop(0.5, m.c1); g.addColorStop(1, m.c2);
      ctx.fillStyle = g;
      ctx.fillRect(sx, b.y, b.w, b.h);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, b.y + 1, b.w - 2, b.h - 2);
      // ترک با آسیب
      const dmgF = 1 - b.hp / m.hp;
      if (dmgF > 0.35) {
        ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx + b.w * 0.2, b.y + 3);
        ctx.lineTo(sx + b.w * 0.5, b.y + b.h * 0.5);
        ctx.lineTo(sx + b.w * 0.35, b.y + b.h - 3);
        ctx.stroke();
      }
      ctx.restore();
    }
    // تی‌ان‌تی
    for (const tn of tnts) {
      if (tn.dead) continue;
      const sx = X(tn.x);
      ctx.fillStyle = '#d42a1e';
      ctx.fillRect(sx, tn.y, tn.w, tn.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('TNT', sx + tn.w / 2, tn.y + tn.h / 2);
      ctx.strokeStyle = '#7a150e'; ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, tn.y + 1, tn.w - 2, tn.h - 2);
    }
    // خوک‌ها
    for (const p of pigs) {
      if (p.dead) continue;
      const sx = X(p.x);
      if (sx < -60 || sx > W + 60) continue;
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(sx, p.y + p.r * 2 + 3, p.r, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#7dff8a';
      ctx.beginPath(); ctx.arc(sx, p.y + p.r, p.r, 0, 7); ctx.fill();
      ctx.fillStyle = '#3fa34d';
      ctx.beginPath(); ctx.arc(sx - p.r * 0.55, p.y + p.r * 0.35, p.r * 0.28, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + p.r * 0.55, p.y + p.r * 0.35, p.r * 0.28, 0, 7); ctx.fill();
      // پوزه
      ctx.fillStyle = '#b8ffbf';
      ctx.beginPath(); ctx.ellipse(sx, p.y + p.r + 5, p.r * 0.42, p.r * 0.3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2c7a38';
      ctx.beginPath(); ctx.arc(sx - 4, p.y + p.r + 5, 2, 0, 7); ctx.arc(sx + 4, p.y + p.r + 5, 2, 0, 7); ctx.fill();
      // چشم
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx - 6, p.y + p.r - 5, 4.5, 0, 7); ctx.arc(sx + 6, p.y + p.r - 5, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(sx - 6, p.y + p.r - 5, 2, 0, 7); ctx.arc(sx + 6, p.y + p.r - 5, 2, 0, 7); ctx.fill();
    }
    // پرنده
    if (bird && !bird.dead) {
      const sx = X(bird.x), by = bird.y + bird.r;
      const cols = bird.type === 'bomb' ? ['#3a3f4d', '#15171f'] : bird.type === 'chuck' ? ['#ffe93b', '#d6a400'] : ['#ff5c5c', '#c22424'];
      ctx.fillStyle = cols[1];
      ctx.beginPath(); ctx.arc(sx, by, bird.r + 2, 0, 7); ctx.fill();
      ctx.fillStyle = cols[0];
      ctx.beginPath(); ctx.arc(sx, by, bird.r, 0, 7); ctx.fill();
      // شکم
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.ellipse(sx, by + 7, 9, 7, 0, 0, 7); ctx.fill();
      // چشم خشمگین
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx + 3, by - 4, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(sx + 5, by - 4, 3, 0, 7); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx - 6, by - 12); ctx.lineTo(sx + 9, by - 7); ctx.stroke();
      // نوک
      ctx.fillStyle = '#ff9a1f';
      ctx.beginPath();
      ctx.moveTo(sx + 9, by + 1); ctx.lineTo(sx + 17, by + 4); ctx.lineTo(sx + 9, by + 7);
      ctx.closePath(); ctx.fill();
      if (bird.type === 'bomb') {
        ctx.fillStyle = '#ffe93b';
        ctx.fillRect(sx - 3, by - bird.r - 8, 6, 8);
      }
    }
    // صف پرنده‌ها
    if (state === 'aim' && bird) {
      ctx.font = '22px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const icons = birds.map((b) => b === 'bomb' ? '💣' : b === 'chuck' ? '⚡' : '🐦').join('');
      ctx.fillText(icons, 10, 8);
    }
    // ذرات
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.t * 2, 0, 1);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  const loop = makeLoop((dt, t) => { update(dt); render(t); });
  function toWorld(e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (W / r.width);
    const cy = (e.clientY - r.top) * (H / r.height);
    return { x: cx + camX, y: cy };
  }
  function onDown(e) {
    sfx.unlock();
    if (!started || state !== 'aim' || !bird || bird.flying) return;
    const p = e.touches ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } : e;
    const w = toWorld(p);
    if (Math.hypot(w.x - SLING.x, w.y - SLING.y) < 130) {
      dragging = true;
      e.preventDefault && e.preventDefault();
    }
  }
  function onMove(e) {
    if (!dragging || !bird || bird.flying) return;
    const p = e.touches ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } : e;
    const w = toWorld(p);
    let dx = w.x - SLING.x, dy = w.y - SLING.y;
    const d = Math.hypot(dx, dy);
    const max = 105;
    if (d > max) { dx *= max / d; dy *= max / d; }
    bird.x = SLING.x + dx;
    bird.y = SLING.y + dy - bird.r;
    e.preventDefault && e.preventDefault();
  }
  function onUp() {
    if (!dragging || !bird || bird.flying) return;
    dragging = false;
    const dx = SLING.x - bird.x, dy = SLING.y - (bird.y + bird.r);
    if (Math.hypot(dx, dy) < 18) {
      bird.x = SLING.x; bird.y = SLING.y - bird.r;
      return;
    }
    bird.vx = dx * 12;
    bird.vy = dy * 12;
    const sp = Math.hypot(bird.vx, bird.vy);
    if (sp > 1700) { bird.vx *= 1700 / sp; bird.vy *= 1700 / sp; }
    bird.flying = true;
    state = 'fly';
    sfx.shoot();
  }
  function ability() {
    if (!started || !bird || !bird.flying || bird.dead || abilityUsed) return;
    if (bird.type === 'bomb') {
      abilityUsed = true;
      explode(bird.x, bird.y + bird.r, 150, 130);
      bird.dead = true; bird.flying = false;
      state = 'settle';
      setTimeout(() => {
        if (state !== 'settle') return;
        if (pigs.every((p) => p.dead)) levelOver(true);
        else if (!birds.length) levelOver(false);
        else { nextBird(); state = 'aim'; }
      }, 700);
    } else if (bird.type === 'chuck') {
      abilityUsed = true;
      bird.dashed = true;
      const sp = Math.hypot(bird.vx, bird.vy) || 1;
      bird.vx = (bird.vx / sp) * 1350;
      bird.vy = (bird.vy / sp) * 1350;
      sfx.jump();
    }
  }
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);
  canvas.addEventListener('dblclick', ability);
  window.addEventListener('keydown', function onK(e) {
    if (e.key === ' ') ability();
  });
  // ضربه برای ability روی موبایل: تپ سریع وسط پرواز
  let lastTap = 0;
  canvas.addEventListener('pointerdown', () => {
    const now = performance.now();
    if (now - lastTap < 320 && bird && bird.flying) ability();
    lastTap = now;
  });
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); bover(); loadLevel(level); });

  score = 0; best = api.getBest();
  loadLevel(progress);
  showIntro();
  loop.start();
  return function destroy() {
    loop.stop();
    try { api.submitScore(score); } catch { /* ignore */ }
  };
}
