// 🐍 کرم — آرنای آنلاین‌نما: ۷ ربات، گوی، بوست و جدول
import { pnum, vibrate, makeLoop, rand, clamp } from '../arcade.js';

const ARENA = 2600;
const SKINS = [
  ['#39e6ff', '#1a8fd4'], ['#ff5c8a', '#c2185b'], ['#a3ff5e', '#3f9e2e'],
  ['#ffd93b', '#c78a00'], ['#c58bff', '#7b3fd4'], ['#ff8a3b', '#c25a00'],
  ['#5effc3', '#1d9e78'], ['#ff5c5c', '#b81d1d'],
];
const NAMES = ['آریا', 'سارا', 'رادین', 'نیلو', 'کیان', 'مهر', 'تهم', 'ونا', 'دارا', 'هلیا', 'پویا', 'رها'];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const { sfx } = api;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">📏 <b data-s>۰</b></span>' +
    '<span class="ag-pill">💀 <b data-k>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:640px"><canvas data-cv width="600" height="560" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    (coarse ? '<div class="ag-trow"><button class="ag-tbtn" type="button" data-boost>⚡ ' + (fa ? 'بوست' : 'Boost') + '</button></div>' : '') +
    '<div class="ag-hint">' + (fa ? 'موس/انگشت = جهت · کلیک/اسپیس = بوست · سرت به کسی نخوره!' : 'Mouse/finger = steer · click/space = boost · don\'t hit heads!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const kEl = wrap.querySelector('[data-k]');
  const W = 600, H = 560;
  let snakes, orbs, over, started, kills, camX, camY, zoom, ptrA, usePtr, boostKey, boostBtn, msgT, msg, best, tG;

  function mkSnake(bot, name, skin) {
    const a = Math.random() * Math.PI * 2;
    const d = rand(200, ARENA / 2 - 300);
    const x = ARENA / 2 + Math.cos(a) * d, y = ARENA / 2 + Math.sin(a) * d;
    const path = [];
    for (let i = 0; i < 60; i++) path.push({ x: x - Math.cos(a) * i * 4, y: y - Math.sin(a) * i * 4 });
    return {
      bot, name, skin, x, y, ang: a, targ: a, len: bot ? rand(200, 420) : 240,
      r: 11, path, dead: false, respT: 0, boost: false, dropT: 0,
      turn: bot ? rand(3.4, 4.6) : 5.2, skill: Math.random(), wt: rand(0, 3), seed: Math.random() * 9,
    };
  }
  function reset() {
    snakes = [];
    const skins = [...SKINS].sort(() => Math.random() - 0.5);
    const names = [...NAMES].sort(() => Math.random() - 0.5);
    snakes.push(mkSnake(false, fa ? 'تو' : 'You', skins[0]));
    for (let i = 0; i < 7; i++) snakes.push(mkSnake(true, names[i], skins[(i + 1) % skins.length]));
    orbs = [];
    for (let i = 0; i < 170; i++) orbs.push(mkOrb(true));
    over = false; started = false; kills = 0;
    camX = snakes[0].x - W / 2; camY = snakes[0].y - H / 2; zoom = 1;
    ptrA = 0; usePtr = !coarse; boostKey = false; boostBtn = false;
    msgT = 0; msg = ''; tG = 0;
    best = api.getBest();
    hud();
  }
  function mkOrb(anywhere, x, y) {
    if (anywhere) { x = rand(60, ARENA - 60); y = rand(60, ARENA - 60); }
    const c = SKINS[(Math.random() * SKINS.length) | 0][0];
    return { x, y, c, v: Math.random() < 0.12 ? 22 : 9, r: 5, wob: Math.random() * 9 };
  }
  function hud() {
    const me = snakes[0];
    sEl.textContent = pnum(Math.floor(me.len));
    kEl.textContent = pnum(kills);
    wrap.querySelector('[data-b]').textContent = pnum(Math.max(best, Math.floor(me.len)));
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
    ov.innerHTML = '<h2>🐍 ' + (fa ? 'کرم' : 'Slither') + '</h2>' +
      '<p>' + (fa ? 'گوی بخور و <b>بزرگ شو</b>! اگه سرت به بدن کسی بخوره می‌میری — ولی اگه اونا به تو بخورن، تو می‌خوریشون!' : 'Eat orbs and <b>grow</b>! Hit someone = you die. They hit you = feast!') + '</p>' +
      '<p>⚡ ' + (fa ? 'بوست سرعتت رو زیاد می‌کنه ولی آبَت می‌کنه' : 'Boost is fast but burns your mass') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '🐍 ورود به آرنا' : '🐍 Enter arena') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }
  function showOver() {
    const sc = Math.floor(snakes[0].len);
    const r = api.submitScore(sc);
    best = Math.max(best, sc);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>💀</h2><div class="ag-big">' + pnum(sc) + '</div>' +
      '<p>⚔️ ' + pnum(kills) + ' ' + (fa ? 'شکار' : 'kills') + (r.isBest ? ' · 🏆 ' + (fa ? 'رکورد جدید!' : 'New best!') : '') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '↻ دوباره' : '↻ Retry') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.click(); bover(); reset(); started = true;
    });
  }

  function nearestOrb(s, maxD) {
    let bo = null, bd = maxD * maxD;
    for (const o of orbs) {
      const dx = o.x - s.x, dy = o.y - s.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; bo = o; }
    }
    return bo;
  }
  function botThink(s, dt) {
    s.wt -= dt;
    const o = nearestOrb(s, 620);
    let want = s.targ;
    if (o) want = Math.atan2(o.y - s.y, o.x - s.x);
    if (s.wt <= 0) { s.wt = rand(1, 3); if (!o || Math.random() < 0.3) want = Math.random() * Math.PI * 2; }
    // دوری از سرها
    for (const q of snakes) {
      if (q === s || q.dead) continue;
      const dx = q.x - s.x, dy = q.y - s.y, d = Math.hypot(dx, dy);
      if (d < 190) {
        const away = Math.atan2(-dy, -dx);
        // عمود به مسیر حریف برای فرار بهتر
        const side = Math.sin(q.ang - Math.atan2(dy, dx)) > 0 ? 1 : -1;
        want = q.ang + side * 1.2;
        if (Math.random() < 0.02 + s.skill * 0.05) want = away;
      }
    }
    // دیوار آرنا
    const m = 220;
    if (s.x < m || s.x > ARENA - m || s.y < m || s.y > ARENA - m) {
      want = Math.atan2(ARENA / 2 - s.y, ARENA / 2 - s.x);
    }
    s.targ = want;
    s.boost = (s.len > 300 && Math.random() < 0.004) || (s.len > 600 && Math.random() < 0.01);
    if (s.len < 140) s.boost = false;
  }

  function angDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
  function kill(s, by) {
    s.dead = true; s.respT = 2.5;
    // ریختن گوی از بدن
    const n = Math.min(46, Math.floor(s.len / 14));
    for (let i = 0; i < n; i++) {
      const p = s.path[Math.floor((i / n) * (s.path.length - 1))] || { x: s.x, y: s.y };
      if (orbs.length < 420) orbs.push(mkOrb(false, p.x + rand(-14, 14), p.y + rand(-14, 14)));
    }
    if (!s.bot) {
      over = true; sfx.hit(); vibrate(100);
      setTimeout(() => { if (over && !wrap.querySelector('[data-over]')) showOver(); }, 700);
    } else if (by && !by.bot) {
      kills++;
      msg = fa ? '⚔️ ' + s.name + ' رو خوردی! +' + Math.floor(s.len / 10) : '⚔️ You ate ' + s.name + '! +' + Math.floor(s.len / 10);
      msgT = 2.2; sfx.clear();
      by.len = Math.min(1600, by.len + s.len * 0.12);
    }
  }

  function update(dt) {
    if (!started) return;
    tG += dt;
    if (msgT > 0) msgT -= dt;
    const me = snakes[0];
    // زوم با اندازه
    const zt = clamp(1.25 - me.len / 2400, 0.72, 1.15);
    zoom += (zt - zoom) * Math.min(1, dt * 2);
    for (const s of snakes) {
      if (s.dead) {
        if (s.bot) {
          s.respT -= dt;
          if (s.respT <= 0) {
            const fresh = mkSnake(true, NAMES[(Math.random() * NAMES.length) | 0], SKINS[(Math.random() * SKINS.length) | 0]);
            Object.assign(s, fresh);
          }
        }
        continue;
      }
      if (s.bot) botThink(s, dt);
      else {
        s.targ = usePtr ? ptrA : s.targ;
        s.boost = (boostKey || boostBtn) && s.len > 130;
      }
      const maxTurn = (s.boost ? s.turn * 0.62 : s.turn) * dt;
      const d = angDiff(s.ang, s.targ);
      s.ang += clamp(d, -maxTurn, maxTurn);
      const sp = s.boost ? 305 : 168 + Math.min(40, s.len / 30);
      s.x += Math.cos(s.ang) * sp * dt;
      s.y += Math.sin(s.ang) * sp * dt;
      // دیوار = مرگ
      if (s.x < 20 || s.y < 20 || s.x > ARENA - 20 || s.y > ARENA - 20) { kill(s, null); continue; }
      // بوست: مصرف + ریختن
      if (s.boost) {
        s.len = Math.max(110, s.len - 34 * dt);
        s.dropT -= dt;
        if (s.dropT <= 0 && orbs.length < 420) {
          s.dropT = 0.18;
          const tail = s.path[s.path.length - 1] || s;
          orbs.push(mkOrb(false, tail.x, tail.y));
        }
      }
      // مسیر
      s.path.unshift({ x: s.x, y: s.y });
      let acc = 0;
      const keep = s.len + 160;
      for (let i = 1; i < s.path.length; i++) {
        acc += Math.hypot(s.path[i].x - s.path[i - 1].x, s.path[i].y - s.path[i - 1].y);
        if (acc > keep) { s.path.length = i + 1; break; }
      }
      // خوردن گوی
      for (const o of orbs) {
        if (o.eaten) continue;
        const dx = o.x - s.x, dy = o.y - s.y;
        if (dx * dx + dy * dy < 30 * 30) {
          o.eaten = true;
          s.len = Math.min(1600, s.len + o.v);
          if (!s.bot && Math.random() < 0.3) sfx.point();
        }
      }
    }
    orbs = orbs.filter((o) => !o.eaten);
    while (orbs.length < 150) orbs.push(mkOrb(true));
    // برخورد سرها
    for (const s of snakes) {
      if (s.dead || over && !s.bot) continue;
      for (const q of snakes) {
        if (q.dead) continue;
        const skip = q === s ? 14 : 0;
        for (let i = skip; i < q.path.length; i += 2) {
          const p = q.path[i];
          const dx = s.x - p.x, dy = s.y - p.y;
          const rr2 = (s.r + q.r * 0.82);
          if (dx * dx + dy * dy < rr2 * rr2) { kill(s, q); break; }
        }
        if (s.dead) break;
      }
    }
    // دوربین
    if (!me.dead) {
      const look = 90;
      const tx = clamp(me.x + Math.cos(me.ang) * look - W / 2 / zoom, 0, ARENA - W / zoom);
      const ty = clamp(me.y + Math.sin(me.ang) * look - H / 2 / zoom, 0, ARENA - H / zoom);
      camX += (tx - camX) * Math.min(1, dt * 5);
      camY += (ty - camY) * Math.min(1, dt * 5);
    }
    hud();
  }

  function render(t) {
    ctx.fillStyle = '#070a18';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);
    // گرید
    const gs = 130;
    ctx.strokeStyle = 'rgba(80,120,255,.09)';
    ctx.lineWidth = 1 / zoom;
    const x0 = Math.floor(camX / gs) * gs, y0 = Math.floor(camY / gs) * gs;
    ctx.beginPath();
    for (let x = x0; x < camX + W / zoom; x += gs) { ctx.moveTo(x, camY); ctx.lineTo(x, camY + H / zoom); }
    for (let y = y0; y < camY + H / zoom; y += gs) { ctx.moveTo(camX, y); ctx.lineTo(camX + W / zoom, y); }
    ctx.stroke();
    // مرز آرنا
    ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 6;
    ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 18;
    ctx.strokeRect(8, 8, ARENA - 16, ARENA - 16);
    ctx.shadowBlur = 0;
    // گوی‌ها
    for (const o of orbs) {
      if (o.x < camX - 30 || o.x > camX + W / zoom + 30 || o.y < camY - 30 || o.y > camY + H / zoom + 30) continue;
      const r = o.r + (o.v > 15 ? 3.5 : 0) + Math.sin(t * 5 + o.wob) * 1.2;
      ctx.fillStyle = o.c;
      ctx.shadowColor = o.c; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // کرم‌ها
    for (const s of [...snakes].sort((a, b) => a.len - b.len)) {
      if (s.dead) continue;
      const [c1, c2] = s.skin;
      const step = 3;
      for (let i = s.path.length - 1; i >= 0; i -= step) {
        const p = s.path[i];
        const f = 1 - i / Math.max(1, s.path.length);
        const r = s.r * (0.45 + 0.55 * f);
        ctx.fillStyle = ((i / step) | 0) % 2 ? c1 : c2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
      }
      // چشم‌ها
      const ex = Math.cos(s.ang), ey = Math.sin(s.ang);
      const nx = -ey, ny = ex;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x + ex * 6 + nx * 6, s.y + ey * 6 + ny * 6, 4.6, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(s.x + ex * 6 - nx * 6, s.y + ey * 6 - ny * 6, 4.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(s.x + ex * 8 + nx * 6, s.y + ey * 8 + ny * 6, 2.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(s.x + ex * 8 - nx * 6, s.y + ey * 8 - ny * 6, 2.2, 0, 7); ctx.fill();
      // اسم
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = s.bot ? 'rgba(255,255,255,.75)' : '#7dffd4';
      ctx.fillText(s.name, s.x, s.y - s.r - 8);
    }
    ctx.restore();
    // لیدربورد
    const top = [...snakes].filter((s) => !s.dead).sort((a, b) => b.len - a.len).slice(0, 6);
    ctx.fillStyle = 'rgba(5,8,20,.72)';
    rr2( W - 172, 10, 162, 24 + top.length * 20, 10); ctx.fill();
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = fa ? 'right' : 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffd93b';
    ctx.fillText(fa ? '🏆 برترین‌ها' : '🏆 Leaders', fa ? W - 20 : W - 162, 15);
    ctx.font = '12px sans-serif';
    top.forEach((s, i) => {
      ctx.fillStyle = s.bot ? '#cfd6ff' : '#7dffd4';
      const label = (i + 1) + '. ' + s.name + ' ' + Math.floor(s.len);
      ctx.fillText(label, fa ? W - 20 : W - 162, 36 + i * 20);
    });
    if (msgT > 0) {
      ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffe9a3';
      ctx.fillText(msg, W / 2, 12);
    }
  }
  function rr2(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  const loop = makeLoop((dt, t) => { update(dt); render(t); });
  function canvasAngle(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const cx = (clientX - r.left) * (W / r.width);
    const cy = (clientY - r.top) * (H / r.height);
    return Math.atan2(cy - H / 2, cx - W / 2);
  }
  function onMove(e) {
    if (e.touches && e.touches.length) {
      ptrA = canvasAngle(e.touches[0].clientX, e.touches[0].clientY);
      usePtr = true;
    } else if (!coarse) {
      ptrA = canvasAngle(e.clientX, e.clientY);
      usePtr = true;
    }
  }
  function onKey(e) {
    const me = snakes[0];
    if (!me) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') { me.targ = Math.PI; usePtr = false; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd') { me.targ = 0; usePtr = false; e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'w') { me.targ = -Math.PI / 2; usePtr = false; e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's') { me.targ = Math.PI / 2; usePtr = false; e.preventDefault(); }
    else if (e.key === ' ') { boostKey = true; e.preventDefault(); }
  }
  function onKeyUp(e) { if (e.key === ' ') boostKey = false; }
  function onDown(e) { sfx.unlock(); if (!coarse) boostKey = true; onMove(e); }
  function onUp() { if (!coarse) boostKey = false; }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('touchmove', onMove, { passive: true });
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); bover(); reset(); started = true; });
  const bb = wrap.querySelector('[data-boost]');
  if (bb) {
    bb.addEventListener('pointerdown', (e) => { e.preventDefault(); boostBtn = true; });
    bb.addEventListener('pointerup', () => { boostBtn = false; });
    bb.addEventListener('pointerleave', () => { boostBtn = false; });
  }

  reset();
  showIntro();
  loop.start();
  return function destroy() {
    loop.stop();
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointerup', onUp);
    try { api.submitScore(Math.floor(snakes[0].len)); } catch { /* ignore */ }
  };
}
