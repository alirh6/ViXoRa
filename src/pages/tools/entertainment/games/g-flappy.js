// 🐤 Flappy — بال بزن و رد شو: مدال، چرخه روز، ابرهای پارالاکس
import { pnum, sfx, vibrate, makeLoop } from '../arcade.js';

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">🎖 <b data-md>—</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:420px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'کلیک، اسپیس یا ضربه = بال زدن' : 'Click, Space or tap = flap') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const mdEl = wrap.querySelector('[data-md]');
  let W = 380, H = 480;
  let bird, pipes, clouds, score, best, state, tGlobal, flash;

  function medal(s) {
    if (s >= 40) return '💠';
    if (s >= 30) return '🥇';
    if (s >= 20) return '🥈';
    if (s >= 10) return '🥉';
    return '—';
  }
  function reset() {
    bird = { y: H * 0.42, v: 0, rot: 0, wing: 0 };
    pipes = [];
    clouds = Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * W, y: 30 + Math.random() * 180, s: 0.5 + Math.random() * 0.9, v: 12 + i * 4 }));
    score = 0; state = 'ready'; tGlobal = 0; flash = 0;
    best = api.getBest();
    hideOver();
    hud();
  }
  function hud() { sEl.textContent = pnum(score); mdEl.textContent = medal(score); }
  function flap() {
    sfx.unlock();
    if (state === 'ready') { state = 'play'; }
    if (state !== 'play') return;
    bird.v = -330;
    bird.wing = 1;
    sfx.jump();
  }
  function spawnPipe() {
    const gap = Math.max(118, 165 - score * 1.6);
    const margin = 70;
    const gy = margin + Math.random() * (H - margin * 2 - gap - 60);
    pipes.push({ x: W + 10, w: 62, gapY: gy, gap, passed: false });
  }
  function die() {
    state = 'dead';
    flash = 1;
    const r = api.submitScore(score);
    sfx.hit();
    vibrate([70, 40, 70]);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>' + medal(score) + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  const loop = makeLoop((dt) => {
    tGlobal += dt;
    if (state === 'play') {
      bird.v += 1150 * dt;
      bird.y += bird.v * dt;
      bird.rot = Math.max(-0.4, Math.min(1.3, bird.v / 500));
      bird.wing = Math.max(0, bird.wing - dt * 4);
      if (!pipes.length || pipes[pipes.length - 1].x < W - 210) spawnPipe();
      const speed = 165 + Math.min(120, score * 3);
      for (const p of pipes) {
        p.x -= speed * dt;
        if (!p.passed && p.x + p.w < W / 2 - 40) {
          p.passed = true;
          score++;
          sfx.point();
          hud();
        }
      }
      pipes = pipes.filter((p) => p.x + p.w > -20);
      // برخورد
      const bx = W / 2 - 40, br = 15;
      const groundY = H - 54;
      if (bird.y + br >= groundY || bird.y - br <= 0) return die();
      for (const p of pipes) {
        if (bx + br > p.x && bx - br < p.x + p.w) {
          if (bird.y - br < p.gapY || bird.y + br > p.gapY + p.gap) return die();
        }
      }
    } else if (state === 'ready') {
      bird.y = H * 0.42 + Math.sin(tGlobal * 3) * 8;
    }
    for (const c of clouds) { c.x -= c.v * dt; if (c.x < -90) { c.x = W + 90; c.y = 30 + Math.random() * 180; } }
    flash = Math.max(0, flash - dt * 3);
    draw();
  });

  function skyColor() {
    const day = (Math.sin(tGlobal * 0.05) + 1) / 2;
    const top = [8 + day * 40, 12 + day * 120, 30 + day * 170];
    return 'rgb(' + top.map(Math.round).join(',') + ')';
  }
  function draw() {
    // آسمان
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, skyColor());
    g.addColorStop(1, '#0b1020');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // ابرها
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 34 * c.s, 13 * c.s, 0, 0, 7);
      ctx.ellipse(c.x + 22 * c.s, c.y + 4 * c.s, 24 * c.s, 10 * c.s, 0, 0, 7);
      ctx.fill();
    }
    // لوله‌ها
    for (const p of pipes) {
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(p.x, 0, p.w, p.gapY);
      ctx.fillRect(p.x, p.gapY + p.gap, p.w, H - p.gapY - p.gap - 54);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(p.x - 4, p.gapY - 22, p.w + 8, 22);
      ctx.fillRect(p.x - 4, p.gapY + p.gap, p.w + 8, 22);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(p.x + 8, 0, 10, p.gapY);
      ctx.fillRect(p.x + 8, p.gapY + p.gap, 10, H - p.gapY - p.gap - 54);
    }
    // زمین
    ctx.fillStyle = '#3f6212';
    ctx.fillRect(0, H - 54, W, 54);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(0, H - 54, W, 10);
    // پرنده
    const bx = W / 2 - 40;
    ctx.save();
    ctx.translate(bx, bird.y);
    ctx.rotate(bird.rot * 0.5);
    ctx.font = '34px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const flapF = bird.wing > 0.4 ? '🐤' : '🐥';
    ctx.fillText(flapF, 0, 0);
    ctx.restore();
    if (state === 'ready') {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '900 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fa ? '👆 ضربه بزن تا شروع شه!' : '👆 Tap to start!', W / 2, H / 2 - 40);
      ctx.font = '44px serif';
      ctx.fillText('🐤', W / 2, H / 2 + 20 + Math.sin(tGlobal * 4) * 6);
    }
    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,60,60,' + (flash * 0.35) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // امتیاز بزرگ
    if (state === 'play') {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.font = '900 44px system-ui';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.5)';
      ctx.lineWidth = 5;
      ctx.strokeText(String(score), W / 2, 62);
      ctx.fillText(String(score), W / 2, 62);
    }
  }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(420, box.clientWidth - 24);
    const h = Math.round(w * 1.22);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }
  function onKey(e) {
    if (e.key === ' ' || e.key === 'ArrowUp') { flap(); e.preventDefault(); }
  }
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); flap(); });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { resize(); });
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    window.removeEventListener('keydown', onKey);
    wrap.remove();
  };
}
