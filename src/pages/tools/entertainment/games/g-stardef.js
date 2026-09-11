// 🚀 Star Defender — شوتر فضایی: موج‌ها، باس، پاورآپ، ذرات
import { randi, choice, pnum, sfx, vibrate, makeLoop, clamp } from '../arcade.js';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">🌊 <b data-w>۱</b></span>' +
    '<span class="ag-pill">❤️ <b data-l>۳</b></span>' +
    '<span class="ag-pill">🔫 <b data-p>۱</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:480px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-bomb>💣 <b data-bc>۱</b></button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'با موس/انگشت/جهت‌ها حرکت کن؛ شلیک خودکاره!' : 'Move with mouse/finger/arrows; firing is automatic!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const wEl = wrap.querySelector('[data-w]');
  const lEl = wrap.querySelector('[data-l]');
  const pEl = wrap.querySelector('[data-p]');
  const bcEl = wrap.querySelector('[data-bc]');
  let W = 440, H = 560;
  let ship, bullets, ebullets, foes, powers, parts, stars, score, lives, wave, weapon, bombs, shield, over, started, waveT, spawnQ, boss, shake, fireT, keys, pointer;

  function reset() {
    ship = { x: W / 2, y: H - 90, inv: 2 };
    bullets = []; ebullets = []; foes = []; powers = []; parts = [];
    stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.3 + Math.random() * 1.4, v: 40 + Math.random() * 160 }));
    score = 0; lives = 3; wave = 1; weapon = 1; bombs = 1; shield = 0;
    over = false; started = false; waveT = 0; spawnQ = []; boss = null; shake = 0; fireT = 0;
    keys = {};
    pointer = null;
    hideOver();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    wEl.textContent = pnum(wave);
    lEl.textContent = pnum(lives);
    pEl.textContent = pnum(weapon);
    bcEl.textContent = pnum(bombs);
  }
  function startWave() {
    if (wave % 5 === 0) {
      spawnBoss();
      return;
    }
    const n = 4 + wave * 2;
    spawnQ = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      const kind = wave >= 4 && r < 0.15 ? 'tank' : wave >= 3 && r < 0.35 ? 'weaver' : wave >= 2 && r < 0.55 ? 'diver' : 'chaser';
      spawnQ.push(kind);
    }
    waveT = 0;
  }
  function spawnFoe(kind) {
    const base = {
      kind, t: 0,
      x: 30 + Math.random() * (W - 60), y: -30,
      hp: 1, r: 16, score: 50, fire: 0,
    };
    if (kind === 'chaser') { base.hp = 1; base.score = 50; }
    else if (kind === 'diver') { base.hp = 1; base.score = 80; base.vy = 200; }
    else if (kind === 'weaver') { base.hp = 2; base.score = 120; }
    else if (kind === 'tank') { base.hp = 8 + wave; base.r = 26; base.score = 300; }
    foes.push(base);
  }
  function spawnBoss() {
    const tier = wave / 5;
    boss = {
      boss: true, x: W / 2, y: -70, ty: 120, t: 0, fire: 1.5, pat: 0,
      hp: 60 * tier + wave * 8, maxHp: 60 * tier + wave * 8, r: 46, score: 2000 * tier,
    };
    foes.push(boss);
    sfx.level();
  }
  function foeShoot(f) {
    const dx = ship.x - f.x, dy = ship.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    const sp = 220 + wave * 12;
    ebullets.push({ x: f.x, y: f.y + 10, vx: (dx / d) * sp, vy: (dy / d) * sp, r: 5 });
  }
  function fireWeapon() {
    const lv = weapon;
    const mk = (dx, a) => bullets.push({ x: ship.x + dx, y: ship.y - 22, vx: Math.sin(a) * 520, vy: -Math.cos(a) * 620, r: 5 });
    if (lv === 1) mk(0, 0);
    else if (lv === 2) { mk(-9, 0); mk(9, 0); }
    else if (lv === 3) { mk(-10, 0); mk(10, 0); mk(0, 0); }
    else if (lv === 4) { mk(-12, -0.12); mk(12, 0.12); mk(-4, 0); mk(4, 0); }
    else { mk(-14, -0.18); mk(14, 0.18); mk(-5, -0.06); mk(5, 0.06); mk(0, 0); }
    sfx.shoot();
  }
  function burst(x, y, color, n, big) {
    for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * (big ? 520 : 320), vy: (Math.random() - 0.5) * (big ? 520 : 320), life: 0.4 + Math.random() * 0.4, color, s: big ? 5 : 3 });
  }
  function damageShip() {
    if (ship.inv > 0 || over) return;
    if (shield > 0) {
      shield--;
      ship.inv = 1.2;
      sfx.hit();
      burst(ship.x, ship.y, '#22d3ee', 16);
      hud();
      return;
    }
    lives--;
    ship.inv = 2.5;
    weapon = Math.max(1, weapon - 1);
    sfx.boom();
    vibrate([80, 50, 80]);
    shake = 0.5;
    burst(ship.x, ship.y, '#fb7185', 30, true);
    hud();
    if (lives <= 0) gameOver();
  }
  function useBomb() {
    if (over || !started || bombs <= 0) return;
    bombs--;
    sfx.boom();
    shake = 0.8;
    vibrate([100, 50, 100]);
    ebullets = [];
    for (const f of foes) {
      f.hp -= 12;
      burst(f.x, f.y, '#fde047', 10);
    }
    flashBomb = 0.35;
    hud();
  }
  let flashBomb = 0;
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🚀💥</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>🌊 ' + (fa ? 'موج ' : 'Wave ') + pnum(wave) + '</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }
  function maybePower(x, y) {
    const r = Math.random();
    if (r < 0.1) powers.push({ x, y, vy: 110, kind: choice(['P', 'P', 'S', 'B']) });
    else if (r < 0.115) powers.push({ x, y, vy: 110, kind: 'L' });
  }

  const loop = makeLoop((dt) => {
    for (const s of stars) { s.y += s.v * dt * (started && !over ? 1.6 : 0.5); if (s.y > H) { s.y = -4; s.x = Math.random() * W; } }
    shake = Math.max(0, shake - dt);
    flashBomb = Math.max(0, flashBomb - dt);
    if (started && !over) {
      ship.inv = Math.max(0, ship.inv - dt);
      // حرکت
      const MSP = 400;
      if (keys.left) ship.x -= MSP * dt;
      if (keys.right) ship.x += MSP * dt;
      if (keys.up) ship.y -= MSP * dt;
      if (keys.down) ship.y += MSP * dt;
      if (pointer) {
        ship.x += (pointer.x - ship.x) * Math.min(1, dt * 12);
        ship.y += (pointer.y - 60 - ship.y) * Math.min(1, dt * 12);
      }
      ship.x = clamp(ship.x, 24, W - 24);
      ship.y = clamp(ship.y, H * 0.35, H - 40);
      // شلیک
      fireT -= dt;
      if (fireT <= 0) { fireWeapon(); fireT = Math.max(0.12, 0.22 - weapon * 0.012); }
      // موج
      if (!boss && spawnQ.length) {
        waveT -= dt;
        if (waveT <= 0) { spawnFoe(spawnQ.shift()); waveT = Math.max(0.25, 0.9 - wave * 0.06); }
      }
      if (!boss && !spawnQ.length && !foes.length) {
        wave++;
        hud();
        sfx.win();
        startWave();
      }
      // دشمن‌ها
      for (let i = foes.length - 1; i >= 0; i--) {
        const f = foes[i];
        f.t += dt; f.fire -= dt;
        if (f.boss) {
          f.y += (f.ty - f.y) * Math.min(1, dt * 1.5);
          f.x = W / 2 + Math.sin(f.t * 0.9) * (W * 0.28);
          if (f.fire <= 0) {
            f.pat++;
            const n = 5 + Math.min(6, wave / 2);
            for (let k = 0; k < n; k++) {
              const a = Math.PI / 2 + (k - (n - 1) / 2) * 0.28 + Math.sin(f.t) * 0.2;
              ebullets.push({ x: f.x, y: f.y + 30, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, r: 6 });
            }
            if (f.pat % 3 === 0) foeShoot(f);
            f.fire = Math.max(0.7, 1.6 - wave * 0.05);
            sfx.shoot();
          }
        } else if (f.kind === 'chaser') {
          f.y += (90 + wave * 8) * dt;
          f.x += Math.sign(ship.x - f.x) * 60 * dt;
          if (f.fire <= 0 && f.y > 0 && f.y < H * 0.6) { foeShoot(f); f.fire = 2.2; }
        } else if (f.kind === 'diver') {
          f.y += f.vy * dt;
        } else if (f.kind === 'weaver') {
          f.y += (70 + wave * 6) * dt;
          f.x += Math.sin(f.t * 4) * 130 * dt;
          if (f.fire <= 0 && f.y > 0) { foeShoot(f); f.fire = 2.8; }
        } else if (f.kind === 'tank') {
          f.y += 45 * dt;
          if (f.fire <= 0 && f.y > 0) {
            for (const a of [-0.25, 0, 0.25]) ebullets.push({ x: f.x, y: f.y + 20, vx: Math.sin(a) * 230, vy: Math.cos(a) * 230, r: 6 });
            f.fire = 2.4;
          }
        }
        // گلوله‌های ما
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if ((b.x - f.x) * (b.x - f.x) + (b.y - f.y) * (b.y - f.y) <= (f.r + b.r) * (f.r + b.r)) {
            bullets.splice(j, 1);
            f.hp -= 1;
            burst(b.x, b.y, '#fef08a', 4);
            if (f.hp <= 0) {
              foes.splice(i, 1);
              score += f.score;
              sfx.boom();
              vibrate(20);
              burst(f.x, f.y, f.boss ? '#c084fc' : '#fb923c', f.boss ? 60 : 18, !!f.boss);
              maybePower(f.x, f.y);
              if (f.boss) {
                boss = null;
                shake = 0.7;
                score += 500;
                wave++;
                hud();
                startWave();
              }
              hud();
            }
            break;
          }
        }
        if (f.hp > 0 && f.y > H + 60) foes.splice(i, 1);
      }
      // گلوله‌ها
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y < -20 || b.x < -20 || b.x > W + 20) bullets.splice(i, 1);
      }
      for (let i = ebullets.length - 1; i >= 0; i--) {
        const b = ebullets[i];
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y > H + 20 || b.x < -20 || b.x > W + 20 || b.y < -40) { ebullets.splice(i, 1); continue; }
        if ((b.x - ship.x) * (b.x - ship.x) + (b.y - ship.y) * (b.y - ship.y) <= 16 * 16) {
          ebullets.splice(i, 1);
          damageShip();
        }
      }
      // برخورد بدنه
      for (const f of foes) {
        if ((f.x - ship.x) * (f.x - ship.x) + (f.y - ship.y) * (f.y - ship.y) <= (f.r + 14) * (f.r + 14)) {
          damageShip();
          f.hp -= 3;
          break;
        }
      }
      // پاورآپ‌ها
      for (let i = powers.length - 1; i >= 0; i--) {
        const p = powers[i];
        p.y += p.vy * dt;
        if (p.y > H + 20) { powers.splice(i, 1); continue; }
        if (Math.abs(p.x - ship.x) < 30 && Math.abs(p.y - ship.y) < 30) {
          powers.splice(i, 1);
          if (p.kind === 'P') { weapon = Math.min(5, weapon + 1); sfx.level(); }
          else if (p.kind === 'S') { shield = Math.min(3, shield + 1); sfx.coin(); }
          else if (p.kind === 'B') { bombs = Math.min(3, bombs + 1); sfx.coin(); }
          else if (p.kind === 'L') { lives++; sfx.win(); }
          hud();
        }
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    draw();
  });

  const FOE_E = { chaser: '👾', diver: '🛸', weaver: '👹', tank: '🤖' };
  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 22, (Math.random() - 0.5) * shake * 22);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0c0630');
    g.addColorStop(1, '#05070f');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s * 2.2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of foes) {
      if (f.boss) {
        ctx.font = '84px serif';
        ctx.fillText('👹', f.x, f.y);
        // نوار جان باس
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(30, 14, W - 60, 12);
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(30, 14, (W - 60) * Math.max(0, f.hp / f.maxHp), 12);
        ctx.fillStyle = '#fff';
        ctx.font = '900 12px system-ui';
        ctx.fillText('☠️ ' + (fa ? 'باس' : 'BOSS'), W / 2, 42);
      } else {
        ctx.font = (f.r * 2) + 'px serif';
        ctx.fillText(FOE_E[f.kind] || '👾', f.x, f.y);
        if (f.hp > 2) {
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(f.x - 16, f.y - f.r - 10, 32, 4);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(f.x - 16, f.y - f.r - 10, 32 * Math.min(1, f.hp / (8 + wave)), 4);
        }
      }
    }
    // گلوله دشمن
    ctx.fillStyle = '#fb7185';
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 10;
    for (const b of ebullets) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); }
    // گلوله ما
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    for (const b of bullets) {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 4, 9, Math.atan2(b.vx, -b.vy), 0, 7);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    // پاورآپ
    const P_E = { P: '🔫', S: '🛡️', B: '💣', L: '❤️' };
    ctx.font = '26px serif';
    for (const p of powers) {
      ctx.fillStyle = 'rgba(34,211,238,.15)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, 7);
      ctx.fill();
      ctx.fillText(P_E[p.kind], p.x, p.y);
    }
    // سفینه
    if (!(ship.inv > 0 && Math.sin(performance.now() / 60) > 0)) {
      ctx.font = '40px serif';
      ctx.fillText('🚀', ship.x, ship.y);
      if (shield > 0) {
        ctx.strokeStyle = 'rgba(34,211,238,.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, 30, 0, 7);
        ctx.stroke();
      }
      // شعله
      ctx.fillStyle = 'rgba(251,146,60,.8)';
      ctx.beginPath();
      ctx.ellipse(ship.x, ship.y + 24, 6, 10 + Math.random() * 8, 0, 0, 7);
      ctx.fill();
    }
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (flashBomb > 0) {
      ctx.fillStyle = 'rgba(253,224,71,' + flashBomb * 1.6 + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (!started && !over) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 21px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fa ? '🚀 ضربه بزن تا پرواز کنی!' : '🚀 Tap to launch!', W / 2, H / 2);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(480, box.clientWidth - 24);
    const h = Math.max(440, Math.round(w * 1.25));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
    if (ship) { ship.x = clamp(ship.x, 24, W - 24); ship.y = clamp(ship.y, H * 0.35, H - 40); }
  }
  function begin() {
    if (started) return;
    started = true;
    startWave();
  }
  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  }
  canvas.addEventListener('pointerdown', (e) => {
    sfx.unlock();
    begin();
    pointer = pos(e);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => { if (pointer) pointer = pos(e); });
  ['pointerup', 'pointercancel'].forEach((t) => canvas.addEventListener(t, () => { pointer = null; }));
  function onKey(e, down) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
      if (down) begin();
      if (e.key === 'ArrowLeft') keys.left = down;
      if (e.key === 'ArrowRight') keys.right = down;
      if (e.key === 'ArrowUp') keys.up = down;
      if (e.key === 'ArrowDown') keys.down = down;
      if (down && e.key === ' ') useBomb();
      e.preventDefault();
    } else if (down && (e.key === 'b' || e.key === 'B')) useBomb();
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-bomb]').addEventListener('click', useBomb);
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
