// 🦖 Dino Run — دونده بی‌پایان: شب/روز، خم شدن، پرنده و کاکتوس
import { pnum, sfx, vibrate, makeLoop } from '../arcade.js';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">⚡ <b data-sp>۱</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:640px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    (coarse ? '<div class="ag-trow"><button class="ag-tbtn" type="button" data-duck>⬇ ' + (fa ? 'خم' : 'Duck') + '</button><button class="ag-tbtn" type="button" data-jump>⬆ ' + (fa ? 'پرش' : 'Jump') + '</button></div>' : '') +
    '<div class="ag-hint">' + (fa ? 'اسپیس/↑/ضربه = پرش · ↓ = خم شدن' : 'Space/↑/tap = jump · ↓ = duck') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const spEl = wrap.querySelector('[data-sp]');
  let W = 600, H = 260;
  const GY = () => H - 46;
  let dino, obs, clouds, score, speed, over, started, tG, night, nextSpawn, jumpBuf;

  function reset() {
    dino = { y: 0, vy: 0, duck: false, run: 0, air: false };
    obs = [];
    clouds = Array.from({ length: 4 }, () => ({ x: Math.random() * W, y: 20 + Math.random() * 80, v: 20 + Math.random() * 25 }));
    score = 0; speed = 260; over = false; started = false; tG = 0; night = 0; nextSpawn = 0; jumpBuf = 0;
    hideOver();
    hud();
  }
  function hud() {
    sEl.textContent = pnum(Math.floor(score));
    spEl.textContent = pnum(Math.round(speed / 260 * 10) / 10);
  }
  function jump() {
    sfx.unlock();
    if (over) return;
    started = true;
    if (!dino.air) {
      dino.vy = -620;
      dino.air = true;
      dino.duck = false;
      sfx.jump();
    } else jumpBuf = 0.12;
  }
  function spawn() {
    const r = Math.random();
    if (r < 0.55) {
      const n = 1 + Math.floor(Math.random() * 3);
      obs.push({ k: 'cactus', x: W + 20, n });
    } else if (r < 0.8) {
      obs.push({ k: 'cactus', x: W + 20, n: 1, tall: true });
    } else {
      const h = [0, 28, 58][Math.floor(Math.random() * 3)];
      obs.push({ k: 'bird', x: W + 20, h, flap: 0 });
    }
  }
  function dinoBox() {
    const w = dino.duck ? 52 : 34, h = dino.duck ? 26 : 46;
    return { x: 60, y: GY() - dino.y - h, w, h };
  }
  function hitTest() {
    const d = dinoBox();
    const pad = 6;
    for (const o of obs) {
      let ox, oy, ow, oh;
      if (o.k === 'cactus') {
        ow = o.n * 22 - 6; oh = o.tall ? 58 : 44;
        ox = o.x; oy = GY() - oh;
      } else {
        ow = 40; oh = 26;
        ox = o.x; oy = GY() - 46 - o.h;
      }
      if (d.x + pad < ox + ow - pad && d.x + d.w - pad > ox + pad && d.y + pad < oy + oh - pad && d.y + d.h - pad > oy + pad) return true;
    }
    return false;
  }
  function die() {
    over = true;
    const sc = Math.floor(score);
    const r = api.submitScore(sc);
    sfx.hit();
    vibrate([70, 40, 70]);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🦖💥</h2><div class="ag-big">' + pnum(sc) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    tG += dt;
    night = (Math.sin(tG * 0.08) + 1) / 2; // 0 روز، 1 شب
    for (const c of clouds) { c.x -= (c.v + (started && !over ? speed * 0.15 : 0)) * dt; if (c.x < -70) { c.x = W + 70; c.y = 20 + Math.random() * 80; } }
    if (started && !over) {
      speed = Math.min(640, speed + dt * 7);
      score += dt * speed * 0.035;
      if (Math.floor(score) % 100 < 1 && score > 10) { /* milestone tick */ }
      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        spawn();
        const gap = Math.max(0.55, 1.35 - speed / 700);
        nextSpawn = gap + Math.random() * 0.7;
      }
      for (const o of obs) {
        o.x -= speed * dt;
        if (o.k === 'bird') o.flap += dt * 10;
      }
      obs = obs.filter((o) => o.x > -80);
      // فیزیک داینو
      if (dino.air) {
        dino.vy += 2100 * dt;
        if (dino.duck) dino.vy += 2600 * dt; // فرود سریع
        dino.y -= dino.vy * dt; // vy منفی = بالا رفتن
        if (dino.y <= 0) {
          dino.y = 0; dino.air = false; dino.vy = 0;
          if (jumpBuf > 0) { jumpBuf = 0; jump(); }
        }
      }
      jumpBuf = Math.max(0, jumpBuf - dt);
      dino.run += dt * (10 + speed / 60);
      if (hitTest()) die();
      hud();
    }
    draw();
  });

  function draw() {
    const dayTop = [125, 200, 255], nightTop = [8, 12, 30];
    const mix = (a, b) => Math.round(a + (b - a) * night);
    ctx.fillStyle = 'rgb(' + mix(dayTop[0], nightTop[0]) + ',' + mix(dayTop[1], nightTop[1]) + ',' + mix(dayTop[2], nightTop[2]) + ')';
    ctx.fillRect(0, 0, W, H);
    // ماه/خورشید
    ctx.font = '30px serif';
    ctx.fillText(night > 0.5 ? '🌙' : '☀️', W - 50, 44);
    // ابرها
    ctx.fillStyle = night > 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.7)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 30, 11, 0, 0, 7);
      ctx.ellipse(c.x + 20, c.y + 3, 20, 8, 0, 0, 7);
      ctx.fill();
    }
    // زمین
    ctx.fillStyle = night > 0.5 ? '#1e293b' : '#e2e8f0';
    ctx.fillRect(0, GY(), W, H - GY());
    ctx.fillStyle = night > 0.5 ? '#334155' : '#94a3b8';
    const off = started && !over ? (tG * speed) % 40 : 0;
    for (let x = -off; x < W; x += 40) ctx.fillRect(x, GY() + 12, 20, 3);
    // موانع
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (const o of obs) {
      if (o.k === 'cactus') {
        ctx.font = (o.tall ? 56 : 42) + 'px serif';
        for (let i = 0; i < o.n; i++) ctx.fillText('🌵', o.x + 11 + i * 22, GY() + 4);
      } else {
        ctx.font = '34px serif';
        ctx.fillText(Math.sin(o.flap) > 0 ? '🦅' : '🦆', o.x + 20, GY() - o.h);
      }
    }
    // داینو
    ctx.font = (dino.duck ? 30 : 46) + 'px serif';
    const d = dinoBox();
    const runF = dino.air ? '🦖' : (Math.floor(dino.run) % 2 ? '🦖' : '🦕');
    ctx.fillText(dino.duck ? '🐊' : runF, d.x + d.w / 2, GY() - dino.y + 4);
    if (!started && !over) {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 20px system-ui';
      ctx.textBaseline = 'middle';
      ctx.fillText(fa ? '👆 ضربه بزن تا بدوی!' : '👆 Tap to run!', W / 2, H / 2);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(640, box.clientWidth - 24);
    const h = Math.max(220, Math.round(w * 0.42));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }
  function onKey(e, down) {
    if (e.key === ' ' || e.key === 'ArrowUp') { if (down) jump(); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { dino.duck = down; if (down) e.preventDefault(); }
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  const bj = wrap.querySelector('[data-jump]');
  if (bj) bj.addEventListener('click', jump);
  const bd = wrap.querySelector('[data-duck]');
  if (bd) {
    bd.addEventListener('pointerdown', () => { dino.duck = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => bd.addEventListener(t, () => { dino.duck = false; }));
  }
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(Math.floor(score));
    loop.stop();
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    wrap.remove();
  };
}
