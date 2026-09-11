// 🚜 صعود تپه — گاز/ترمز، پشتک، سکه، بنزین و گاراژ ارتقا
import { pnum, vibrate, makeLoop, rand, clamp } from '../arcade.js';

const SAVE_KEY = 'ViXoRa:hill-garage';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const { sfx } = api;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🛣 <b data-s>۰</b></span>' +
    '<span class="ag-pill">🪙 <b data-c>۰</b></span>' +
    '<span class="ag-pill">⛽ <b data-f>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:680px"><canvas data-cv width="640" height="400" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-garage>🔧 ' + (fa ? 'گاراژ' : 'Garage') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button></div>' +
    '<div class="ag-trow"><button class="ag-tbtn" type="button" data-brake>◀ ' + (fa ? 'ترمز' : 'Brake') + '</button><button class="ag-tbtn" type="button" data-gas>' + (fa ? 'گاز' : 'Gas') + ' ▶</button></div>' +
    '<div class="ag-hint">' + (fa ? 'گاز/ترمز نگه دار · وسط هوا با گاز/ترمز بچرخ · سقف نزن زمین!' : 'Hold gas/brake · tilt mid-air · don\'t land on your roof!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const cEl = wrap.querySelector('[data-c]');
  const fEl = wrap.querySelector('[data-f]');
  const W = 640, H = 400;

  let save;
  try { save = JSON.parse(localStorage.getItem(SAVE_KEY) || '') || null; } catch { save = null; }
  if (!save || typeof save !== 'object') save = { coins: 0, eng: 1, tir: 1, tank: 1 };
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ } }

  const ENG = () => 560 + save.eng * 130;
  const GRIP = () => 0.55 + save.tir * 0.16;
  const TANK = () => 100 + (save.tank - 1) * 30;
  const MAXV = () => 430 + save.tir * 45 + save.eng * 12;

  let x, y, vy, v, ang, va, fuel, dist, coins, airT, flips;
  let items, parts, over, started, paused, camY, seed, best, deadMsg, fuelWarned;

  function ground(gx) {
    if (gx < 380) return 300;
    const t = gx - 380;
    const amp = Math.min(2.6, 1 + t / 9000);
    return 300 - (62 * Math.sin(t * 0.004 + seed) + 36 * Math.sin(t * 0.0113 + seed * 2) + 15 * Math.sin(t * 0.033 + seed * 3)) * amp;
  }
  function slopeAt(gx) { return (ground(gx + 8) - ground(gx - 8)) / 16; }

  function reset() {
    x = 120; y = ground(120); vy = 0; v = 0; ang = 0; va = 0;
    fuel = TANK(); dist = 0; coins = 0; airT = 0; flips = 0;
    items = []; parts = [];
    over = false; started = false; paused = false; deadMsg = '';
    camY = ground(120) - 230; seed = Math.random() * 9; fuelWarned = false;
    best = api.getBest();
    // سکه‌ها و بنزین‌ها
    let ix = 700;
    let fuelNext = 2600;
    while (ix < 30000) {
      const g = ground(ix);
      if (ix >= fuelNext - 100 && ix <= fuelNext + 100) {
        items.push({ k: 'fuel', x: ix, y: g - 46, got: false });
        fuelNext += rand(2400, 3400);
      } else if (Math.random() < 0.75) {
        const n = 3 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) items.push({ k: 'coin', x: ix + i * 44, y: g - 70 - Math.sin(i * 0.9) * 26, got: false });
      }
      ix += rand(420, 720);
    }
    hud();
  }
  function hud() {
    sEl.textContent = pnum(Math.floor(dist));
    cEl.textContent = pnum(coins);
    fEl.textContent = pnum(Math.max(0, Math.ceil(fuel)));
    wrap.querySelector('[data-b]').textContent = pnum(Math.max(best, Math.floor(dist)));
    fEl.parentElement.style.outline = fuel < 25 ? '2px solid #ff3b5c' : 'none';
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
    ov.innerHTML = '<h2>🚜 ' + (fa ? 'صعود تپه' : 'Hill Climb') + '</h2>' +
      '<p>' + (fa ? 'هرچی <b>دورتر</b> بری بهتر! وسط هوا بچرخ و با چرخ فرود بیا.' : 'Drive as <b>far</b> as you can! Tilt mid-air, land on wheels.') + '</p>' +
      '<p>⛽ ' + (fa ? 'بنزین تموم نشه! گالن‌ها رو بگیر · 🪙 سکه‌ها رو خرج گاراژ کن' : 'Don\'t run dry! Grab cans · spend coins in the garage') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '🏁 حرکت!' : '🏁 Go!') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }
  function gameOver(msg) {
    over = true; deadMsg = msg;
    save.coins += coins;
    persist();
    const sc = Math.floor(dist);
    const r = api.submitScore(sc);
    best = Math.max(best, sc);
    sfx.lose(); vibrate(120);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>' + (msg === 'crash' ? '💥' : '🏜️') + '</h2>' +
      '<p>' + (msg === 'crash' ? (fa ? 'چپ کردی!' : 'You flipped!') : (fa ? 'بنزین تموم شد!' : 'Out of fuel!')) + '</p>' +
      '<div class="ag-big">' + pnum(sc) + 'm</div>' +
      '<p>🪙 +' + pnum(coins) + ' ' + (fa ? 'به گاراژ رفت' : 'banked') + (r.isBest ? ' · 🏆 ' + (fa ? 'رکورد!' : 'Record!') : '') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '↻ دوباره' : '↻ Retry') + '</button> ' +
      '<button class="ag-btn" type="button" data-gar>🔧 ' + (fa ? 'گاراژ' : 'Garage') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); bover(); reset(); started = true; });
    ov.querySelector('[data-gar]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); openGarage(true); });
  }
  function cost(lv) { return Math.floor(50 * Math.pow(lv, 1.7)); }
  function openGarage(fromOver) {
    const wasStarted = started;
    started = false;
    bover();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    const row = (key, icon, name) => {
      const lv = save[key];
      const maxed = lv >= 5;
      return '<p>' + icon + ' ' + name + ' <b>' + pnum(lv) + '/۵' + '</b> ' +
        (maxed ? '✅' : '<button class="ag-btn ag-btn--sm" type="button" data-up="' + key + '">⬆ 🪙' + pnum(cost(lv)) + '</button>') + '</p>';
    };
    ov.innerHTML = '<h2>🔧 ' + (fa ? 'گاراژ' : 'Garage') + '</h2>' +
      '<p>🪙 <b data-wallet>' + pnum(save.coins) + '</b></p>' +
      row('eng', '⚙️', fa ? 'موتور' : 'Engine') +
      row('tir', '🛞', fa ? 'لاستیک' : 'Tires') +
      row('tank', '⛽', fa ? 'باک' : 'Tank') +
      '<button class="ag-btn ag-btn--primary" type="button" data-back>' + (fa ? '🏁 رانندگی' : '🏁 Drive') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = b.dataset.up;
      const c = cost(save[k]);
      if (save.coins >= c && save[k] < 5) {
        save.coins -= c; save[k]++; persist(); sfx.level();
        openGarage(fromOver);
      } else { sfx.hit(); }
    }));
    ov.querySelector('[data-back]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.click(); bover();
      if (fromOver || over) { reset(); }
      started = true;
    });
    void wasStarted;
  }

  const keys = {};
  function gasOn() { return keys.gas || keys.ArrowRight || keys.d || keys.D || keys.ArrowUp || keys.w || keys.W; }
  function brakeOn() { return keys.brake || keys.ArrowLeft || keys.a || keys.A || keys.ArrowDown || keys.s || keys.S; }

  function dust(n, col) {
    for (let i = 0; i < n; i++) {
      parts.push({ x: x - 26 + rand(-8, 8), y: y - 8, vx: rand(-120, -20) - v * 0.2, vy: rand(-140, -20), g: 500, t: rand(0.3, 0.7), c: col || '#8a7a5f', r: rand(2, 5) });
    }
  }

  function update(dt) {
    if (!started || paused || over) return;
    const g = ground(x);
    const sl = slopeAt(x);
    const grounded = y >= g - 1;
    if (grounded) {
      y = g; vy = 0;
      airT = 0;
      const slopeAng = Math.atan(sl);
      let da = slopeAng - ang;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      ang += da * Math.min(1, dt * 10);
      va = 0;
      if (gasOn() && fuel > 0) { v += ENG() * dt * (1 - Math.max(0, sl) * 0.5 * (1.4 - GRIP())); fuel -= dt * 1.7; if (Math.random() < 0.5) dust(1); }
      else fuel -= dt * 0.35;
      if (brakeOn()) v -= 700 * dt;
      v -= sl * 1050 * dt * (1.2 - GRIP() * 0.5); // گرانش شیب
      v -= v * 0.35 * dt;
      v = clamp(v, -90, MAXV());
      const prevG = g;
      x += v * dt;
      const ng = ground(x);
      if (ng < prevG - 3 && v > 120) {
        // پرش از لبه
        vy = (ng - prevG) / Math.max(dt, 0.001) * 0.9;
        vy = clamp(vy, -950, 200);
        y = prevG;
      } else {
        y = ng;
      }
    } else {
      airT += dt;
      vy += 2100 * dt;
      x += v * dt;
      y += vy * dt;
      if (gasOn()) va += 2.6 * dt;
      if (brakeOn()) va -= 3.2 * dt;
      va = clamp(va, -3.4, 3.4);
      const prevA = ang;
      ang += va * dt;
      // شمارش پشتک
      if (Math.abs(ang - prevA) > 0.01) {
        flips += 0;
      }
      v -= v * 0.06 * dt;
      const ng = ground(x);
      if (y >= ng) {
        y = ng;
        const slopeAng = Math.atan(slopeAt(x));
        let da = ang - slopeAng;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const turns = Math.round((ang - slopeAng) / (Math.PI * 2));
        if (Math.abs(da) > 1.15) {
          gameOver('crash');
          return;
        }
        if (vy > 1250) { gameOver('crash'); return; }
        if (turns !== 0 && airT > 0.5) {
          const bonus = Math.abs(turns) * 25;
          coins += 0;
          dist += bonus;
          sfx.clear();
        }
        ang = slopeAng; va = 0; vy = 0;
        if (vy === 0 && Math.random() < 0.8) dust(4);
      }
    }
    if (fuel <= 0) {
      fuel = 0;
      if (!fuelWarned) { fuelWarned = true; sfx.lose(); }
      if (Math.abs(v) < 8 && grounded) { gameOver('fuel'); return; }
    }
    dist = Math.max(dist, (x - 120) / 48);
    camY += ((y - 230) - camY) * Math.min(1, dt * 3);
    // آیتم‌ها
    for (const it of items) {
      if (it.got || it.x < x - 80 || it.x > x + 80) continue;
      if (Math.abs(it.y - (y - 40)) < 60) {
        it.got = true;
        if (it.k === 'coin') { coins++; sfx.coin(); }
        else { fuel = Math.min(TANK(), fuel + 40); sfx.level(); }
      }
    }
    for (const p of parts) { p.t -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    parts = parts.filter((p) => p.t > 0);
    hud();
  }

  function render(t) {
    const camX = x - 200;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#7ec8ff'); sky.addColorStop(0.6, '#c9ecff'); sky.addColorStop(1, '#eafbff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // خورشید و ابرها
    ctx.fillStyle = '#ffdf3b';
    ctx.beginPath(); ctx.arc(W - 90, 70, 34, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 260 - camX * 0.15 + 2000) % 1100) - 200;
      const cy = 50 + (i % 3) * 36;
      ctx.beginPath(); ctx.ellipse(cx, cy, 52, 20, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 30, cy + 6, 38, 16, 0, 0, 7); ctx.fill();
    }
    // کوه‌های دور
    ctx.fillStyle = '#9db8d8';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 20) {
      const wx = camX * 0.4 + sx;
      ctx.lineTo(sx, 250 - Math.sin(wx * 0.006) * 60 - Math.sin(wx * 0.017 + 2) * 24 - (camY * 0.2));
    }
    ctx.lineTo(W, H);
    ctx.closePath(); ctx.fill();
    // زمین
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 8) {
      ctx.lineTo(sx, ground(camX + sx) - camY);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    const gg = ctx.createLinearGradient(0, 0, 0, H);
    gg.addColorStop(0, '#6fbf4d'); gg.addColorStop(0.25, '#4d8f35'); gg.addColorStop(1, '#2c5a22');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.strokeStyle = '#2c5a22'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 8) {
      const sy = ground(camX + sx) - camY;
      if (sx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    const sy = (wx, wy) => wy - camY;
    // آیتم‌ها
    for (const it of items) {
      if (it.got) continue;
      const sx = it.x - camX;
      if (sx < -40 || sx > W + 40) continue;
      if (it.k === 'coin') {
        const sp = Math.abs(Math.sin(t * 6 + it.x * 0.05));
        ctx.fillStyle = '#ffd93b';
        ctx.beginPath(); ctx.ellipse(sx, sy(0, it.y), 5 + sp * 7, 12, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#a86e00';
        ctx.beginPath(); ctx.ellipse(sx, sy(0, it.y), 2.5 + sp * 3, 7, 0, 0, 7); ctx.fill();
      } else {
        ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🛢️', sx, sy(0, it.y) + Math.sin(t * 4) * 4);
      }
    }
    // ذرات
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.t * 2, 0, 1);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // جیپ
    const jx = x - camX, jy = y - camY;
    ctx.save();
    ctx.translate(jx, jy);
    ctx.rotate(ang);
    const wig = gasOn() && fuel > 0 ? Math.sin(t * 50) * 1.2 : 0;
    // چرخ‌ها
    const wr = (t * (4 + v * 0.05)) % (Math.PI * 2);
    for (const wx of [-26, 26]) {
      ctx.fillStyle = '#1c1e26';
      ctx.beginPath(); ctx.arc(wx, -12 + wig, 15, 0, 7); ctx.fill();
      ctx.fillStyle = '#8a93ad';
      ctx.beginPath(); ctx.arc(wx, -12 + wig, 7, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1c1e26'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wx, -12 + wig);
      ctx.lineTo(wx + Math.cos(wr) * 7, -12 + wig + Math.sin(wr) * 7);
      ctx.stroke();
    }
    // بدنه
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(-34, -38 + wig + 3, 68, 20);
    const bg2 = ctx.createLinearGradient(0, -44, 0, -18);
    bg2.addColorStop(0, '#ff7a3b'); bg2.addColorStop(1, '#d63c00');
    ctx.fillStyle = bg2;
    ctx.beginPath();
    ctx.roundRect(-34, -40 + wig, 68, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.roundRect(-20, -56 + wig, 34, 18, 5);
    ctx.fill();
    ctx.fillStyle = '#7a2c00';
    ctx.fillRect(26, -34 + wig, 10, 8);
    ctx.restore();
    // هشدار بنزین
    if (fuel < 25 && !over) {
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = ((t * 3) | 0) % 2 ? '#ff3b5c' : '#fff';
      ctx.fillText(fa ? '⛽ بنزین رو به اتمامه!' : '⛽ Low fuel!', W / 2, 10);
    }
  }

  const loop = makeLoop((dt, t) => { update(dt); render(t); });
  function onKey(e, down) {
    keys[e.key] = down;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
    if (down && (e.key === 'p' || e.key === 'P')) togglePause();
  }
  function togglePause() {
    if (!started || over) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  function holdBtn(sel, key) {
    const b = wrap.querySelector(sel);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.unlock(); keys[key] = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => { keys[key] = false; }));
  }
  holdBtn('[data-gas]', 'gas');
  holdBtn('[data-brake]', 'brake');
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); bover(); reset(); started = true; });
  wrap.querySelector('[data-garage]').addEventListener('click', () => { sfx.click(); if (!over) { save.coins += coins; coins = 0; persist(); } openGarage(false); });
  wrap.querySelector('[data-pause]').addEventListener('click', () => { sfx.click(); togglePause(); });

  reset();
  showIntro();
  loop.start();
  return function destroy() {
    loop.stop();
    try { api.submitScore(Math.floor(dist)); } catch { /* ignore */ }
  };
}
