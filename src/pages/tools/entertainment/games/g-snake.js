// 🐍 Snake — مار کلاسیک: سوایپ/کیبورد/دکمه، سرعت تصاعدی، میوه جایزه
import { randi, clamp, pnum, sfx, vibrate, makeLoop, fitCanvas } from '../arcade.js';

const N = 21;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🍎 <b data-s>۰</b></span>' +
    '<span class="ag-pill">⚡ <b data-lv>۱</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:440px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-pause>⏸ ' + (fa ? 'مکث' : 'Pause') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    (coarse ? '<div class="ag-pad" data-pad><span></span><button type="button" data-d="0,-1">▲</button><span></span>' +
      '<button type="button" data-d="-1,0">◀</button><button type="button" data-d="0,1">▼</button><button type="button" data-d="1,0">▶</button></div>' : '') +
    '<div class="ag-hint">' + (fa ? 'با سوایپ، کیبورد یا دکمه‌ها هدایت کن. میوه ستاره‌ای = امتیاز دوبرابر!' : 'Swipe, arrows or pad. Star fruit = double!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const scoreEl = wrap.querySelector('[data-s]');
  const lvEl = wrap.querySelector('[data-lv]');
  let W = 400, cell = W / N;

  let snake, dir, queue, food, bonus, bonusT, score, level, alive, paused, acc, step, dead;
  function reset() {
    const m = Math.floor(N / 2);
    snake = [{ x: m, y: m }, { x: m - 1, y: m }, { x: m - 2, y: m }];
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0; level = 1; alive = true; paused = false; acc = 0; step = 0.14;
    bonus = null; bonusT = 8;
    spawnFood();
    paintHud();
    hideOver();
  }
  function freeCell() {
    for (let k = 0; k < 400; k++) {
      const x = randi(0, N - 1), y = randi(0, N - 1);
      if (!snake.some((s) => s.x === x && s.y === y) && (!food || food.x !== x || food.y !== y)) return { x, y };
    }
    return { x: 0, y: 0 };
  }
  function spawnFood() { food = freeCell(); }
  function paintHud() { scoreEl.textContent = pnum(score); lvEl.textContent = pnum(level); }
  function turn(x, y) {
    if (!alive || paused) return;
    const last = queue.length ? queue[queue.length - 1] : dir;
    if ((x === -last.x && y === -last.y) || (x === last.x && y === last.y)) return;
    if (queue.length < 3) queue.push({ x, y });
  }
  function tick() {
    if (queue.length) dir = queue.shift();
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || snake.some((s) => s.x === head.x && s.y === head.y)) {
      return die();
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10 * level;
      sfx.point();
      if (score / (10 * level) % 5 === 0) { level++; step = Math.max(0.055, step - 0.012); sfx.level(); }
      spawnFood();
      if (Math.random() < 0.3 && !bonus) { bonus = freeCell(); bonusT = 7; }
    } else if (bonus && head.x === bonus.x && head.y === bonus.y) {
      score += 50 * level;
      sfx.coin();
      vibrate(30);
      bonus = null;
    } else {
      snake.pop();
    }
    paintHud();
  }
  function die() {
    alive = false;
    const r = api.submitScore(score);
    sfx.hit();
    vibrate([60, 40, 60]);
    showOver(fa ? 'بازی تمام شد!' : 'Game Over!', r);
  }
  function showOver(title, r) {
    hideOver();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>' + title + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r && r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(api.getBest())) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  function draw() {
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(0, 0, W, W);
    // غذا
    ctx.font = (cell * 0.9) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍎', food.x * cell + cell / 2, food.y * cell + cell / 2 + 1);
    if (bonus) {
      const blink = Math.sin(performance.now() / 150) > -0.2;
      if (blink) ctx.fillText('⭐', bonus.x * cell + cell / 2, bonus.y * cell + cell / 2 + 1);
    }
    // مار
    for (let i = snake.length - 1; i >= 0; i--) {
      const s = snake[i];
      const t = i / Math.max(1, snake.length);
      ctx.fillStyle = i === 0 ? '#4ade80' : 'hsl(' + (140 - t * 40) + ' 70% ' + (55 - t * 18) + '%)';
      const pad = i === 0 ? 1 : 2;
      const x = s.x * cell + pad, y = s.y * cell + pad, w = cell - pad * 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, w, 5);
      else ctx.rect(x, y, w, w);
      ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#052e16';
        const ex = s.x * cell + cell / 2 + dir.x * 3, ey = s.y * cell + cell / 2 + dir.y * 3;
        ctx.beginPath();
        ctx.arc(ex - 4, ey - 3, 2.2, 0, 7);
        ctx.arc(ex + 4, ey - 3, 2.2, 0, 7);
        ctx.fill();
      }
    }
    if (paused && alive) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(0, 0, W, W);
      ctx.fillStyle = '#fff';
      ctx.font = '900 28px system-ui';
      ctx.fillText(fa ? '⏸ مکث' : '⏸ Paused', W / 2, W / 2);
    }
  }
  const loop = makeLoop((dt) => {
    if (!alive || paused) { draw(); return; }
    acc += dt;
    if (bonus) { bonusT -= dt; if (bonusT <= 0) bonus = null; }
    while (acc >= step && alive) { acc -= step; tick(); }
    draw();
  });

  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(440, box.clientWidth - 24);
    canvas.style.width = w + 'px';
    canvas.style.height = w + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; cell = W / N;
    draw();
  }
  function onKey(e) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { turn(0, -1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { turn(0, 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { turn(-1, 0); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { turn(1, 0); e.preventDefault(); }
    else if (k === 'p' || k === 'P' || k === ' ') { togglePause(); e.preventDefault(); }
  }
  let tsx = 0, tsy = 0;
  function onTs(e) { const t = e.changedTouches[0]; tsx = t.clientX; tsy = t.clientY; }
  function onTe(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - tsx, dy = t.clientY - tsy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
  }
  function togglePause() {
    if (!alive) return;
    paused = !paused;
    wrap.querySelector('[data-pause]').innerHTML = paused ? '▶ ' + (fa ? 'ادامه' : 'Resume') : '⏸ ' + (fa ? 'مکث' : 'Pause');
    sfx.click();
  }
  wrap.querySelector('[data-pause]').addEventListener('click', togglePause);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  const pad = wrap.querySelector('[data-pad]');
  if (pad) pad.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const [x, y] = b.dataset.d.split(',').map(Number);
    turn(x, y);
  });
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('touchstart', onTs, { passive: true });
  canvas.addEventListener('touchend', onTe, { passive: true });
  window.addEventListener('resize', resize);

  reset();
  resize();
  loop.start();
  void fitCanvas; void clamp;

  return function destroy() {
    if (score > 0) api.submitScore(score);
    loop.stop();
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', resize);
    wrap.remove();
  };
}
