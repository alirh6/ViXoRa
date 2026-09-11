// 🌌 Neon Survivors — جلوی سیل وایسا: آپگرید، جم، باس، بقا
import { randi, choice, pnum, sfx, vibrate, makeLoop, clamp } from '../arcade.js';

const UPGRADES = [
  { id: 'dmg', icon: '⚔️', fa: 'قدرت +۲۵٪', en: 'Damage +25%' },
  { id: 'rate', icon: '🔥', fa: 'سرعت شلیک +۲۰٪', en: 'Fire rate +20%' },
  { id: 'multi', icon: '🔱', fa: 'پرتابه اضافه', en: '+1 Projectile' },
  { id: 'pierce', icon: '🏹', fa: 'نفوذ +۱', en: 'Pierce +1' },
  { id: 'speed', icon: '🥾', fa: 'سرعت حرکت +۱۲٪', en: 'Move speed +12%' },
  { id: 'hp', icon: '❤️', fa: 'جان +۲۵ و درمان', en: '+25 Max HP & heal' },
  { id: 'magnet', icon: '🧲', fa: 'آهنربا +۴۰٪', en: 'Magnet +40%' },
  { id: 'regen', icon: '💚', fa: 'بازسازی جان', en: 'Regenerate HP' },
  { id: 'nova', icon: '💥', fa: 'انفجار دوره‌ای', en: 'Periodic nova' },
];

const css = `
.sv-pick{ display:grid; gap:10px; width:100%; max-width:340px; }
.sv-card{ display:flex; align-items:center; gap:12px; text-align:start; cursor:pointer; border-radius:16px; padding:14px 16px;
  background:rgba(34,211,238,.08); border:1px solid rgba(34,211,238,.35); color:#fff; font:inherit; font-weight:800; font-size:14px; transition:.15s; }
.sv-card:hover{ background:rgba(34,211,238,.18); transform:translateY(-2px); }
.sv-card i{ font-style:normal; font-size:30px; }
`;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⏱ <b data-t>۰:۰۰</b></span>' +
    '<span class="ag-pill">💜 <b data-lv>۱</b></span>' +
    '<span class="ag-pill">💀 <b data-k>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:560px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'حرکت کن، بقیه خودکاره! جم‌ها رو جمع کن و قوی شو 💪' : 'Just move, rest is auto! Grab gems and power up 💪') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const tEl = wrap.querySelector('[data-t]');
  const lvEl = wrap.querySelector('[data-lv]');
  const kEl = wrap.querySelector('[data-k]');
  let W = 520, H = 440;
  let P, foes, shots, gems, parts, floats, time, kills, over, paused, picking, spawnT, bossT, fireT, novaT, shake, keys, pointer, cam;

  function reset() {
    P = { x: 0, y: 0, hp: 100, maxHp: 100, sp: 190, dmg: 12, rate: 1.6, multi: 1, pierce: 0, magnet: 90, regen: 0, nova: 0, xp: 0, need: 8, level: 1, inv: 0 };
    foes = []; shots = []; gems = []; parts = []; floats = [];
    time = 0; kills = 0; over = false; paused = false; picking = false;
    spawnT = 0; bossT = 45; fireT = 0; novaT = 0; shake = 0;
    keys = {};
    pointer = null;
    cam = { x: 0, y: 0 };
    hideOver();
    hud();
  }
  function fmtT(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return pnum(m) + ':' + pnum(String(ss).padStart(2, '0'));
  }
  function hud() {
    tEl.textContent = fmtT(time);
    lvEl.textContent = pnum(P.level);
    kEl.textContent = pnum(kills);
  }
  function diff() { return 1 + time / 75; }
  function spawnFoe(boss) {
    const a = Math.random() * Math.PI * 2;
    const dist = Math.max(W, H) * 0.62 + Math.random() * 120;
    const x = P.x + Math.cos(a) * dist, y = P.y + Math.sin(a) * dist;
    const d = diff();
    if (boss) {
      foes.push({ boss: true, e: '👹', x, y, hp: 320 * d, maxHp: 320 * d, sp: 62, r: 34, dmg: 25, xp: 40, t: 0 });
      sfx.level();
      addFloat(P.x, P.y - 60, fa ? '☠️ باس!' : '☠️ BOSS!', '#fb7185', 22);
      return;
    }
    const r = Math.random();
    if (r < 0.5) foes.push({ e: '👾', x, y, hp: 18 * d, maxHp: 18 * d, sp: 78 + time * 0.12, r: 16, dmg: 8, xp: 1, t: Math.random() * 9 });
    else if (r < 0.75) foes.push({ e: '🦇', x, y, hp: 10 * d, maxHp: 10 * d, sp: 128 + time * 0.15, r: 13, dmg: 6, xp: 1, t: Math.random() * 9 });
    else if (r < 0.92) foes.push({ e: '🤖', x, y, hp: 55 * d, maxHp: 55 * d, sp: 52, r: 20, dmg: 14, xp: 3, t: Math.random() * 9 });
    else foes.push({ e: '👻', x, y, hp: 30 * d, maxHp: 30 * d, sp: 95, r: 15, dmg: 10, xp: 5, t: Math.random() * 9, ghost: true });
  }
  function nearestFoe(range) {
    let best = null, bd = range * range;
    for (const f of foes) {
      const dd = (f.x - P.x) * (f.x - P.x) + (f.y - P.y) * (f.y - P.y);
      if (dd < bd) { bd = dd; best = f; }
    }
    return best;
  }
  function fire() {
    const tgt = nearestFoe(460);
    if (!tgt) return;
    const base = Math.atan2(tgt.y - P.y, tgt.x - P.x);
    for (let i = 0; i < P.multi; i++) {
      const a = base + (i - (P.multi - 1) / 2) * 0.14;
      shots.push({ x: P.x, y: P.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, dmg: P.dmg, pierce: P.pierce, hit: new Set(), life: 1.4 });
    }
    sfx.shoot();
  }
  function nova() {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      shots.push({ x: P.x, y: P.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, dmg: P.dmg * 1.5, pierce: 3, hit: new Set(), life: 0.8, nova: true });
    }
    burst(P.x, P.y, '#c084fc', 24);
    sfx.boom();
    shake = Math.max(shake, 0.3);
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 380, vy: (Math.random() - 0.5) * 380, life: 0.5, color });
  }
  function addFloat(x, y, txt, color, size) {
    floats.push({ x, y, txt, color: color || '#fff', life: 1, size: size || 14 });
  }
  function gainXp(v, x, y) {
    P.xp += v;
    if (P.xp >= P.need) {
      P.xp -= P.need;
      P.level++;
      P.need = Math.round(8 + P.level * 5.5);
      hud();
      draft();
    }
    void x; void y;
  }
  function draft() {
    picking = true;
    sfx.level();
    const pool = UPGRADES.filter((u) => !(u.id === 'multi' && P.multi >= 5) && !(u.id === 'pierce' && P.pierce >= 4) && !(u.id === 'nova' && P.nova >= 3));
    const opts = [];
    const cp = pool.slice();
    while (opts.length < 3 && cp.length) opts.push(cp.splice((Math.random() * cp.length) | 0, 1)[0]);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>⬆️ ' + (fa ? 'لول ' : 'Level ') + pnum(P.level) + '</h2><p>' + (fa ? 'یکی رو انتخاب کن:' : 'Choose one:') + '</p>' +
      '<div class="sv-pick">' + opts.map((o, i) => '<button type="button" class="sv-card" data-pick="' + i + '"><i>' + o.icon + '</i><span>' + (fa ? o.fa : o.en) + '</span></button>').join('') + '</div>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      const u = opts[Number(b.dataset.pick)];
      applyUpgrade(u.id);
      sfx.coin();
      ov.remove();
      picking = false;
    });
  }
  function applyUpgrade(id) {
    if (id === 'dmg') P.dmg *= 1.25;
    else if (id === 'rate') P.rate *= 1.2;
    else if (id === 'multi') P.multi++;
    else if (id === 'pierce') P.pierce++;
    else if (id === 'speed') P.sp *= 1.12;
    else if (id === 'hp') { P.maxHp += 25; P.hp = Math.min(P.maxHp, P.hp + 40); }
    else if (id === 'magnet') P.magnet *= 1.4;
    else if (id === 'regen') P.regen += 1.2;
    else if (id === 'nova') P.nova++;
  }
  function hurtPlayer(dmg) {
    if (P.inv > 0 || over) return;
    P.hp -= dmg;
    P.inv = 0.5;
    sfx.hit();
    vibrate(40);
    shake = Math.max(shake, 0.35);
    burst(P.x, P.y, '#fb7185', 10);
    if (P.hp <= 0) {
      P.hp = 0;
      gameOver();
    }
  }
  function gameOver() {
    over = true;
    const sc = Math.floor(time) * 10 + kills * 15 + P.level * 50;
    const r = api.submitScore(sc);
    sfx.lose();
    burst(P.x, P.y, '#22d3ee', 50);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>💀</h2><div class="ag-big">' + pnum(sc) + '</div>' +
      '<p>⏱ ' + fmtT(time) + ' · 💀 ' + pnum(kills) + ' · 💜 ' + (fa ? 'لول ' : 'Lv ') + pnum(P.level) + '</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    setTimeout(() => {
      if (!over) return;
      wrap.querySelector('.ag-board').appendChild(ov);
      ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
    }, 900);
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    if (!over && !paused && !picking) {
      time += dt;
      P.inv = Math.max(0, P.inv - dt);
      if (P.regen) P.hp = Math.min(P.maxHp, P.hp + P.regen * dt);
      // حرکت
      let mx = 0, my = 0;
      if (keys.left) mx -= 1;
      if (keys.right) mx += 1;
      if (keys.up) my -= 1;
      if (keys.down) my += 1;
      if (pointer) {
        const dx = pointer.x - W / 2, dy = pointer.y - H / 2;
        const d = Math.hypot(dx, dy);
        if (d > 14) { mx = dx / d; my = dy / d; }
      }
      const ml = Math.hypot(mx, my);
      if (ml > 0.01) {
        P.x += (mx / Math.max(1, ml)) * P.sp * dt;
        P.y += (my / Math.max(1, ml)) * P.sp * dt;
      }
      cam.x += (P.x - cam.x) * Math.min(1, dt * 6);
      cam.y += (P.y - cam.y) * Math.min(1, dt * 6);
      // اسپاون
      spawnT -= dt;
      const want = Math.min(110, 8 + time * 0.55);
      if (spawnT <= 0 && foes.length < want) {
        const batch = Math.min(6, 1 + Math.floor(time / 40));
        for (let i = 0; i < batch; i++) spawnFoe(false);
        spawnT = Math.max(0.25, 1.1 - time / 200);
      }
      bossT -= dt;
      if (bossT <= 0) { spawnFoe(true); bossT = 60; }
      // شلیک
      fireT -= dt;
      if (fireT <= 0) { fire(); fireT = 1 / P.rate; }
      if (P.nova > 0) {
        novaT -= dt;
        if (novaT <= 0) { nova(); novaT = Math.max(2.2, 5 - P.nova * 0.7); }
      }
      // دشمن‌ها
      for (let i = foes.length - 1; i >= 0; i--) {
        const f = foes[i];
        f.t += dt;
        const dx = P.x - f.x, dy = P.y - f.y;
        const d = Math.hypot(dx, dy) || 1;
        let vx = (dx / d) * f.sp, vy = (dy / d) * f.sp;
        if (!f.boss) {
          // جداسازی گله
          for (const o of foes) {
            if (o === f) continue;
            const ox = f.x - o.x, oy = f.y - o.y;
            const od = Math.hypot(ox, oy);
            if (od > 0.1 && od < 30) { vx += (ox / od) * 90; vy += (oy / od) * 90; }
          }
        }
        f.x += vx * dt;
        f.y += vy * dt;
        if (d < f.r + 16) hurtPlayer(f.dmg * (f.boss ? 1 : 0.6) * (1 + time / 300));
      }
      // پرتابه‌ها
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i];
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        if (s.life <= 0) { shots.splice(i, 1); continue; }
        for (let j = foes.length - 1; j >= 0; j--) {
          const f = foes[j];
          if (s.hit.has(f)) continue;
          if ((s.x - f.x) * (s.x - f.x) + (s.y - f.y) * (s.y - f.y) <= (f.r + 6) * (f.r + 6)) {
            s.hit.add(f);
            f.hp -= s.dmg * (0.9 + Math.random() * 0.2);
            f.flash = 0.08;
            addFloat(f.x, f.y - f.r - 6, pnum(Math.round(s.dmg)), '#fef08a', 12);
            if (f.hp <= 0) {
              foes.splice(j, 1);
              kills++;
              burst(f.x, f.y, '#a78bfa', f.boss ? 40 : 10);
              const gn = f.boss ? 8 : f.xp >= 5 ? 2 : 1;
              for (let g = 0; g < gn; g++) gems.push({ x: f.x + (Math.random() - 0.5) * 30, y: f.y + (Math.random() - 0.5) * 30, v: Math.ceil(f.xp / gn), t: 0 });
              if (f.boss) { P.hp = Math.min(P.maxHp, P.hp + 30); addFloat(P.x, P.y - 40, '+30 ❤️', '#4ade80', 16); }
              sfx.pop();
              hud();
            }
            if (s.hit.size > s.pierce) { shots.splice(i, 1); break; }
          }
        }
      }
      // جم‌ها
      for (let i = gems.length - 1; i >= 0; i--) {
        const gm = gems[i];
        gm.t += dt;
        const dx = P.x - gm.x, dy = P.y - gm.y;
        const d = Math.hypot(dx, dy);
        if (d < P.magnet) {
          const pull = 340 * (1 + (P.magnet - d) / P.magnet);
          gm.x += (dx / (d || 1)) * pull * dt;
          gm.y += (dy / (d || 1)) * pull * dt;
        }
        if (d < 22) {
          gems.splice(i, 1);
          gainXp(gm.v, gm.x, gm.y);
          sfx.tick();
        } else if (gm.t > 30) gems.splice(i, 1);
      }
      hud();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.y -= 44 * dt; f.life -= dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
    shake = Math.max(0, shake - dt * 2);
    draw();
  });

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 18, (Math.random() - 0.5) * shake * 18);
    ctx.fillStyle = '#070313';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    const ox = W / 2 - cam.x, oy = H / 2 - cam.y;
    // گرید
    ctx.strokeStyle = 'rgba(139,92,246,.13)';
    ctx.lineWidth = 1;
    const gs = 64;
    const gx0 = Math.floor((cam.x - W / 2) / gs) * gs, gy0 = Math.floor((cam.y - H / 2) / gs) * gs;
    ctx.beginPath();
    for (let x = gx0; x < cam.x + W / 2 + gs; x += gs) { ctx.moveTo(x + ox, 0); ctx.lineTo(x + ox, H); }
    for (let y = gy0; y < cam.y + H / 2 + gs; y += gs) { ctx.moveTo(0, y + oy); ctx.lineTo(W, y + oy); }
    ctx.stroke();
    const inView = (x, y, m) => x + ox > -m && x + ox < W + m && y + oy > -m && y + oy < H + m;
    // جم‌ها
    for (const gm of gems) {
      if (!inView(gm.x, gm.y, 30)) continue;
      const bob = Math.sin(gm.t * 5) * 3;
      ctx.font = '20px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('💎', gm.x + ox, gm.y + oy + bob);
    }
    // دشمن‌ها
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of foes) {
      if (!inView(f.x, f.y, 60)) continue;
      const wob = Math.sin(f.t * 6) * 2;
      if (f.flash > 0) { f.flash -= 1 / 60; }
      ctx.font = (f.r * 2) + 'px serif';
      if (f.flash > 0) {
        ctx.save();
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 18;
        ctx.fillText(f.e, f.x + ox, f.y + oy + wob);
        ctx.restore();
      } else ctx.fillText(f.e, f.x + ox, f.y + oy + wob);
      if (f.hp < f.maxHp) {
        const w = f.r * 2;
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(f.x + ox - w / 2, f.y + oy - f.r - 10, w, 4);
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(f.x + ox - w / 2, f.y + oy - f.r - 10, w * Math.max(0, f.hp / f.maxHp), 4);
      }
    }
    // پرتابه‌ها
    for (const s of shots) {
      if (!inView(s.x, s.y, 20)) continue;
      ctx.fillStyle = s.nova ? '#c084fc' : '#22d3ee';
      ctx.shadowColor = s.nova ? '#c084fc' : '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, s.nova ? 7 : 5, 0, 7);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    // بازیکن
    if (!over) {
      const blink = P.inv > 0 && Math.sin(performance.now() / 70) > 0;
      if (!blink) {
        ctx.font = '38px serif';
        ctx.fillText('🧙', P.x + ox, P.y + oy);
      }
      // نوار جان
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(P.x + ox - 26, P.y + oy - 32, 52, 7);
      ctx.fillStyle = P.hp / P.maxHp > 0.35 ? '#4ade80' : '#e11d48';
      ctx.fillRect(P.x + ox - 26, P.y + oy - 32, 52 * Math.max(0, P.hp / P.maxHp), 7);
    }
    // ذرات و اعداد
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x + ox, p.y + oy, 3.5, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5));
      ctx.fillStyle = f.color;
      ctx.font = '900 ' + f.size + 'px system-ui';
      ctx.fillText(f.txt, f.x + ox, f.y + oy);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // نوار XP
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(0, 0, W, 10);
    const xg = ctx.createLinearGradient(0, 0, W, 0);
    xg.addColorStop(0, '#c084fc');
    xg.addColorStop(1, '#f0abfc');
    ctx.fillStyle = xg;
    ctx.fillRect(0, 0, W * Math.min(1, P.xp / P.need), 10);
    if (paused && !over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fa ? '⏸ مکث' : '⏸ Paused', W / 2, H / 2);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(560, box.clientWidth - 24);
    const h = Math.max(360, Math.round(w * 0.8));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }
  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  }
  canvas.addEventListener('pointerdown', (e) => {
    sfx.unlock();
    pointer = pos(e);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => { if (pointer) pointer = pos(e); });
  ['pointerup', 'pointercancel'].forEach((t) => canvas.addEventListener(t, () => { pointer = null; }));
  function onKey(e, down) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = down; e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { keys.right = down; e.preventDefault(); }
    else if (k === 'arrowup' || k === 'w') { keys.up = down; e.preventDefault(); }
    else if (k === 'arrowdown' || k === 's') { keys.down = down; e.preventDefault(); }
    else if (down && (k === 'p' || k === ' ')) { togglePause(); e.preventDefault(); }
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);
  function togglePause() {
    if (over || picking) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
    sfx.click();
  }
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-pause]').addEventListener('click', togglePause);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  resize();
  loop.start();
  return function destroy() {
    if (time > 0 || kills > 0) api.submitScore(Math.floor(time) * 10 + kills * 15 + P.level * 50);
    loop.stop();
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    wrap.remove();
  };
}
