// 📐 دش هندسی — رانر یک‌دکمه‌ای: خار، بلوک، حلقه پرش
import { pnum, vibrate, makeLoop, rand, clamp } from '../arcade.js';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const { sfx } = api;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🛣 <b data-s>۰</b></span>' +
    '<span class="ag-pill">🪙 <b data-c>۰</b></span>' +
    '<span class="ag-pill">💀 <b data-a>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:680px"><canvas data-cv width="640" height="360" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'نگه دار = پرش‌های پشت سر هم · وسط هوا روی حلقه زرد بزن!' : 'Hold = jump · tap yellow rings mid-air!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const cEl = wrap.querySelector('[data-c]');
  const aEl = wrap.querySelector('[data-a]');
  const W = 640, H = 360, GY = H - 64, PX = 150, PS = 34;
  const GRAV = 4600, JV = 1240;
  let x, y, vy, rot, grounded, hold, speed, dist, coins, score, attempts;
  let obs, parts, dead, deadT, started, paused, shake, best, groundOff, bgOff;

  function reset(full) {
    x = 0; y = GY - PS; vy = 0; rot = 0; grounded = true; hold = false;
    speed = 380; dist = 0; coins = full ? 0 : coins; score = 0;
    if (full) attempts = 0;
    obs = []; parts = []; dead = false; deadT = 0;
    started = full ? false : started; paused = false;
    shake = 0; groundOff = 0; bgOff = 0;
    best = Math.max(best || api.getBest(), 0);
    spawnAhead(1200);
    hud();
  }
  function hud() {
    sEl.textContent = pnum(Math.floor(dist));
    cEl.textContent = pnum(coins);
    aEl.textContent = pnum(attempts);
    wrap.querySelector('[data-b]').textContent = pnum(Math.max(best, Math.floor(dist) + coins * 5));
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
    ov.innerHTML = '<h2>📐 ' + (fa ? 'دش هندسی' : 'Geo Dash') + '</h2>' +
      '<p>' + (fa ? 'مکعب خودش می‌دود — تو فقط <b>به‌موقع بپر</b>! نگه داشتن = پرش پشت سر هم.' : 'The cube auto-runs — just <b>jump in time</b>! Hold = chained jumps.') + '</p>' +
      '<p>🔺 ' + (fa ? 'خار = مرگ · 🟦 بلوک = سکو · 🟡 حلقه = پرش هوایی' : 'spike = death · 🟦 block = platform · 🟡 ring = air jump') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '🚀 شروع' : '🚀 Start') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }

  // ---- تولید مرحله ----
  function addSpike(wx, onTop) {
    obs.push({ k: 'sp', x: wx, y: onTop ? GY - 44 - 40 : GY - 40, w: 34, h: 40 });
  }
  function addBlock(wx, wy, w, h) {
    obs.push({ k: 'bl', x: wx, y: wy !== undefined ? wy : GY - 44, w: w || 44, h: h || 44 });
  }
  function addRing(wx, wy) {
    obs.push({ k: 'rg', x: wx, y: wy, used: false });
  }
  function addCoin(wx, wy) {
    obs.push({ k: 'cn', x: wx, y: wy, got: false });
  }
  function pattern(wx, diff) {
    const r = Math.random();
    const gap = 46;
    if (r < 0.2 || diff < 0.05) { addSpike(wx); return wx + 200; }
    if (r < 0.32) { addSpike(wx); addSpike(wx + 36); return wx + 250; }
    if (r < 0.42 && diff > 0.15) { addSpike(wx); addSpike(wx + 36); addSpike(wx + 72); return wx + 300; }
    if (r < 0.54) { addBlock(wx); return wx + 230; }
    if (r < 0.64 && diff > 0.1) { addBlock(wx); addSpike(wx, true); return wx + 260; }
    if (r < 0.72 && diff > 0.2) {
      addBlock(wx, GY - 44); addBlock(wx + 44, GY - 88); addBlock(wx + 88, GY - 132);
      addCoin(wx + 110, GY - 190);
      return wx + 340;
    }
    if (r < 0.8 && diff > 0.12) {
      addSpike(wx); addSpike(wx + 36);
      addRing(wx + 150, GY - 190);
      addSpike(wx + 300); addSpike(wx + 336);
      addCoin(wx + 150, GY - 250);
      return wx + 480;
    }
    if (r < 0.88 && diff > 0.25) {
      addBlock(wx, GY - 120, 44, 120); addSpike(wx + 90); addSpike(wx + 126);
      return wx + 330;
    }
    // سکوی شناور + سکه
    addBlock(wx, GY - 150, 130, 26);
    addCoin(wx + 30, GY - 200); addCoin(wx + 65, GY - 200); addCoin(wx + 100, GY - 200);
    return wx + 320 + gap;
  }
  function spawnAhead(untilX) {
    let wx = x + W + 60;
    const have = obs.filter((o) => o.x > x + W - 100);
    if (have.length) wx = Math.max(wx, ...have.map((o) => o.x + 200));
    while (wx < x + untilX) wx = pattern(wx, clamp(dist / 3000, 0, 1));
  }

  function die() {
    dead = true; deadT = 0.75; attempts++;
    sfx.hit(); vibrate(70); shake = 12;
    burst(PX, y + PS / 2, '#5ff', 26);
    burst(PX, y + PS / 2, '#f6f', 18);
    const sc = Math.floor(dist) + coins * 5;
    if (sc > best) { best = sc; api.submitScore(sc); }
    hud();
  }
  function burst(bx, by, color, n) {
    for (let i = 0; i < n; i++) {
      parts.push({ x: bx, y: by, vx: rand(-320, 320), vy: rand(-420, 60), g: 1100, t: rand(0.4, 1), c: color, r: rand(2, 5) });
    }
  }
  function trail() {
    parts.push({ x: PX - 14, y: y + PS / 2 + rand(-10, 10), vx: rand(-160, -60), vy: rand(-30, 30), g: 0, t: rand(0.2, 0.4), c: '#3ff', r: rand(2, 4) });
  }

  function press() {
    if (!started || paused) return;
    if (dead) return;
    if (!hold) {
      // حلقه زرد: پرش هوایی با ضربه
      for (const o of obs) {
        if (o.k === 'rg' && !o.used) {
          const sx = o.x - x;
          if (Math.abs(sx - PX) < 46 && Math.abs(o.y - (y + PS / 2)) < 60) {
            o.used = true; vy = -JV * 1.02; grounded = false;
            sfx.jump(); burst(o.x - x, o.y, '#fe3', 10);
            hud(); break;
          }
        }
      }
    }
    hold = true;
  }

  function update(dt) {
    if (!started || paused) return;
    if (shake > 0) shake = Math.max(0, shake - dt * 30);
    for (const p of parts) { p.t -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    parts = parts.filter((p) => p.t > 0);
    if (dead) {
      deadT -= dt;
      if (deadT <= 0) {
        // تولد دوباره فوری
        const a = attempts, c = coins;
        reset(false); attempts = a; coins = c;
        sfx.tick();
      }
      return;
    }
    speed = Math.min(660, speed + dt * 7);
    x += speed * dt;
    dist = x / 48;
    score = dist;
    groundOff = (groundOff + speed * dt) % 48;
    bgOff = (bgOff + speed * dt * 0.3) % 220;
    spawnAhead(x + W + 700);
    obs = obs.filter((o) => o.x > x - 120);

    // فیزیک
    vy += GRAV * dt;
    y += vy * dt;
    if (hold && grounded) { vy = -JV; grounded = false; sfx.jump(); }
    let landY = GY - PS;
    let onBlock = null;
    for (const o of obs) {
      if (o.k !== 'bl') continue;
      const sx = o.x - x;
      if (PX + 15 > sx && PX - 15 < sx + o.w) {
        const top = o.y - PS;
        if (y <= top + 14 && y > top - 60 && vy >= 0) { landY = Math.min(landY, top); onBlock = o; }
      }
    }
    if (y >= landY) {
      if (!grounded && vy > 900) burst(PX, y + PS, '#48f', 6);
      y = landY; vy = 0; grounded = true;
      rot = Math.round(rot / (Math.PI / 2)) * (Math.PI / 2);
    } else grounded = y >= landY - 1 ? grounded : false;
    if (!grounded) rot += dt * 10.5;
    if (Math.random() < 0.6) trail();

    // برخوردها
    const feet = y + PS;
    for (const o of obs) {
      const sx = o.x - x;
      if (sx < PX - 60 || sx > PX + 60) {
        if (o.k === 'cn' && !o.got && Math.abs(sx - PX) < 34 && Math.abs(o.y - (y + PS / 2)) < 40) {
          o.got = true; coins++; score += 5; sfx.coin(); burst(sx, o.y, '#fd3', 8);
        }
        continue;
      }
      if (o.k === 'sp') {
        // هیت‌باکس کوچک‌تر از مثلث برای عدالت
        if (PX + 12 > sx + 7 && PX - 12 < sx + o.w - 7 && feet > o.y + 12 && y < o.y + o.h) { die(); return; }
      } else if (o.k === 'bl') {
        if (o !== onBlock) {
          if (PX + 15 > sx + 3 && PX - 15 < sx + o.w - 3 && feet > o.y + 10 && y < o.y + o.h - 4) { die(); return; }
        }
      } else if (o.k === 'cn' && !o.got) {
        if (Math.abs(sx - PX) < 34 && Math.abs(o.y - (y + PS / 2)) < 40) {
          o.got = true; coins++; score += 5; sfx.coin(); burst(sx, o.y, '#fd3', 8);
        }
      }
    }
    hud();
  }

  function render(t) {
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05031a'); bg.addColorStop(0.7, '#120b3d'); bg.addColorStop(1, '#1e0f4d');
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    // ستاره‌ها/مثلث‌های دور
    ctx.fillStyle = 'rgba(120,140,255,.25)';
    for (let i = 0; i < 26; i++) {
      const sx = ((i * 220 - bgOff * 2 + W * 4) % (W + 80)) - 40;
      const sy = 20 + ((i * 67) % 150);
      ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.strokeStyle = 'rgba(150,80,255,.16)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const sx = ((i * 300 - bgOff + W * 3) % (W + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(sx, GY); ctx.lineTo(sx + 90, GY - 130 - (i % 3) * 30); ctx.lineTo(sx + 180, GY);
      ctx.stroke();
    }
    // زمین
    ctx.fillStyle = '#0a1030';
    ctx.fillRect(0, GY, W, H - GY);
    ctx.fillStyle = '#2de1ff';
    ctx.fillRect(0, GY, W, 3);
    ctx.fillStyle = 'rgba(45,225,255,.25)';
    for (let gx = -groundOff; gx < W; gx += 48) ctx.fillRect(gx, GY + 12, 24, 4);
    // موانع
    for (const o of obs) {
      const sx = o.x - x;
      if (sx < -80 || sx > W + 80) continue;
      if (o.k === 'sp') {
        ctx.fillStyle = 'rgba(0,0,0,.4)';
        ctx.beginPath();
        ctx.moveTo(sx + 2, o.y + o.h); ctx.lineTo(sx + o.w / 2 + 2, o.y + 4); ctx.lineTo(sx + o.w + 2, o.y + o.h);
        ctx.closePath(); ctx.fill();
        const g = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
        g.addColorStop(0, '#fff'); g.addColorStop(0.35, '#2de1ff'); g.addColorStop(1, '#0a5fd4');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(sx, o.y + o.h); ctx.lineTo(sx + o.w / 2, o.y); ctx.lineTo(sx + o.w, o.y + o.h);
        ctx.closePath(); ctx.fill();
      } else if (o.k === 'bl') {
        ctx.fillStyle = 'rgba(0,0,0,.4)';
        ctx.fillRect(sx + 3, o.y + 5, o.w, o.h);
        ctx.fillStyle = '#232a5e';
        ctx.fillRect(sx, o.y, o.w, o.h);
        ctx.strokeStyle = '#2de1ff'; ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, o.y + 1, o.w - 2, o.h - 2);
        ctx.strokeStyle = 'rgba(45,225,255,.4)';
        ctx.strokeRect(sx + 7, o.y + 7, o.w - 14, o.h - 14);
      } else if (o.k === 'rg' && !o.used) {
        ctx.strokeStyle = '#ffe93b'; ctx.lineWidth = 5;
        ctx.shadowColor = '#ffe93b'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(sx, o.y, 15 + Math.sin(t * 8) * 1.5, 0, 7); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#7a5b00';
        ctx.beginPath(); ctx.arc(sx, o.y, 5, 0, 7); ctx.fill();
      } else if (o.k === 'cn' && !o.got) {
        const sp = Math.abs(Math.sin(t * 6 + sx * 0.05));
        ctx.fillStyle = '#ffd93b';
        ctx.beginPath(); ctx.ellipse(sx, o.y + Math.sin(t * 4 + sx) * 3, 5 + sp * 7, 12, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#a86e00';
        ctx.beginPath(); ctx.ellipse(sx, o.y + Math.sin(t * 4 + sx) * 3, 2.5 + sp * 3, 7, 0, 0, 7); ctx.fill();
      }
    }
    // بازیکن
    if (!dead) {
      ctx.save();
      ctx.translate(PX, y + PS / 2);
      ctx.rotate(rot);
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.fillRect(-PS / 2 + 3, -PS / 2 + 5, PS, PS);
      const g = ctx.createLinearGradient(0, -PS / 2, 0, PS / 2);
      g.addColorStop(0, '#7dffd4'); g.addColorStop(1, '#0abf8f');
      ctx.fillStyle = g;
      ctx.fillRect(-PS / 2, -PS / 2, PS, PS);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
      ctx.strokeRect(-PS / 2 + 1, -PS / 2 + 1, PS - 2, PS - 2);
      // چشم
      ctx.fillStyle = '#062e24';
      ctx.fillRect(-2, -8, 12, 10);
      ctx.fillStyle = '#fff';
      ctx.fillRect(2, -8, 5, 10);
      ctx.restore();
    }
    // ذرات
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.t * 2, 0, 1);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x - (dead ? 0 : 0), p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // سرعت
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(160,200,255,.8)';
    ctx.fillText('⚡×' + (speed / 380).toFixed(1), 12, 10);
    ctx.restore();
  }

  const loop = makeLoop((dt, t) => { update(dt); render(t); });
  function onKey(e) {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { press(); e.preventDefault(); }
    else if (e.key === 'p' || e.key === 'P') togglePause();
  }
  function onKeyUp(e) {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') hold = false;
  }
  function togglePause() {
    if (!started || dead) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.unlock(); press(); });
  window.addEventListener('pointerup', () => { hold = false; });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); sfx.unlock(); press(); }, { passive: false });
  canvas.addEventListener('touchend', () => { hold = false; });
  wrap.querySelector('[data-new]').addEventListener('click', () => {
    sfx.click(); bover();
    const keepA = 0;
    best = Math.max(best, Math.floor(dist) + coins * 5);
    api.submitScore(best);
    reset(true); attempts = keepA; started = true;
  });
  wrap.querySelector('[data-pause]').addEventListener('click', () => { sfx.click(); togglePause(); });

  reset(true);
  showIntro();
  loop.start();
  return function destroy() {
    loop.stop();
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    try { api.submitScore(Math.max(best, Math.floor(dist) + coins * 5)); } catch { /* ignore */ }
  };
}
