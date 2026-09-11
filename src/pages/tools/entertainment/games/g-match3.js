// 🍬 Candy Match — سبک کندی‌کراش: زنجیره، مرحله، هدف امتیازی
import { randi, pnum, sfx, vibrate } from '../arcade.js';

const N = 8;
const TYPES = ['🍒', '🍋', '🍇', '🍬', '🫐', '🍑'];

const css = `
.m3-board{ position:relative; width:100%; aspect-ratio:1; background:rgba(0,0,0,.35); border-radius:16px;
  touch-action:none; user-select:none; -webkit-user-select:none; overflow:hidden; }
.m3-cell{ position:absolute; display:flex; align-items:center; justify-content:center; cursor:pointer;
  transition:transform .18s ease; font-size:30px; }
.m3-cell.sel{ filter:drop-shadow(0 0 8px #22d3ee); transform:scale(1.12); z-index:2; }
.m3-cell.pop{ animation:m3pop .22s ease; z-index:3; }
@keyframes m3pop{ 0%{ transform:scale(1);} 45%{ transform:scale(1.35); filter:brightness(1.8);} 100%{ transform:scale(.1); opacity:0;} }
.m3-bar{ height:10px; border-radius:99px; background:rgba(255,255,255,.08); overflow:hidden; width:100%; max-width:440px; }
.m3-bar i{ display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,#22d3ee,#a78bfa); transition:width .3s; }
`;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill">🎯 <b data-t>۰</b></span>' +
    '<span class="ag-pill">👣 <b data-m>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="m3-bar"><i data-fill style="width:0%"></i></div>' +
    '<div class="ag-board" style="width:100%;max-width:440px"><div class="m3-board" data-board></div></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-shuffle>🔀 ' + (fa ? 'بر زدن' : 'Shuffle') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'دو آبنبات کنار هم رو لمس کن یا بکش تا جابه‌جا بشن' : 'Tap two adjacent candies or drag to swap') + '</div>';
  root.appendChild(wrap);

  const board = wrap.querySelector('[data-board]');
  const sEl = wrap.querySelector('[data-s]');
  const tEl = wrap.querySelector('[data-t]');
  const mEl = wrap.querySelector('[data-m]');
  const fill = wrap.querySelector('[data-fill]');
  let grid, score, level, target, moves, sel, busy, over, timers;

  function rnd() { return randi(0, TYPES.length - 1); }
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    grid = Array.from({ length: N }, () => Array.from({ length: N }, rnd));
    while (findMatches().length) {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = rnd();
    }
    score = 0; level = 1; target = 500; moves = 20; sel = null; busy = false; over = false;
    hideOver(); paint(); hud();
  }
  function hud() {
    sEl.textContent = pnum(score);
    tEl.textContent = pnum(target);
    mEl.textContent = pnum(moves);
    fill.style.width = Math.min(100, (score / target) * 100) + '%';
  }
  function idx(r, c) { return r * N + c; }
  function paint() {
    board.innerHTML = '';
    const pad = 6;
    const size = (board.clientWidth || 400) / N;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = grid[r][c];
      if (v === -1) continue;
      const d = document.createElement('div');
      d.className = 'm3-cell' + (sel && sel.r === r && sel.c === c ? ' sel' : '');
      d.dataset.i = idx(r, c);
      d.style.width = size + 'px'; d.style.height = size + 'px';
      d.style.fontSize = Math.floor(size * 0.68) + 'px';
      d.style.transform = 'translate(' + c * size + 'px,' + r * size + 'px)';
      d.textContent = TYPES[v];
      board.appendChild(d);
    }
    void pad;
  }
  function cellAt(x, y) {
    const rect = board.getBoundingClientRect();
    const size = rect.width / N;
    const c = Math.floor((x - rect.left) / size), r = Math.floor((y - rect.top) / size);
    if (r < 0 || c < 0 || r >= N || c >= N) return null;
    return { r, c };
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function findMatches() {
    const out = [];
    for (let r = 0; r < N; r++) {
      let run = 1;
      for (let c = 1; c <= N; c++) {
        if (c < N && grid[r][c] !== -1 && grid[r][c] === grid[r][c - 1]) run++;
        else {
          if (run >= 3) for (let k = c - run; k < c; k++) out.push([r, k]);
          run = 1;
        }
      }
    }
    for (let c = 0; c < N; c++) {
      let run = 1;
      for (let r = 1; r <= N; r++) {
        if (r < N && grid[r][c] !== -1 && grid[r][c] === grid[r - 1][c]) run++;
        else {
          if (run >= 3) for (let k = r - run; k < r; k++) out.push([k, c]);
          run = 1;
        }
      }
    }
    return out;
  }
  function hasMove() {
    const dirs = [[0, 1], [1, 0]];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const [dr, dc] of dirs) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 >= N || c2 >= N) continue;
        const t = grid[r][c]; grid[r][c] = grid[r2][c2]; grid[r2][c2] = t;
        const m = findMatches().length > 0;
        const t2 = grid[r][c]; grid[r][c] = grid[r2][c2]; grid[r2][c2] = t2;
        if (m) return true;
      }
    }
    return false;
  }
  function trySwap(a, b) {
    if (busy || over) return;
    const t = grid[a.r][a.c]; grid[a.r][a.c] = grid[b.r][b.c]; grid[b.r][b.c] = t;
    if (!findMatches().length) {
      const t2 = grid[a.r][a.c]; grid[a.r][a.c] = grid[b.r][b.c]; grid[b.r][b.c] = t2;
      sel = null; paint();
      sfx.click();
      return;
    }
    moves--;
    busy = true;
    sel = null;
    resolve(1);
  }
  function resolve(mult) {
    paint(); hud();
    const m = findMatches();
    if (!m.length) {
      busy = false;
      if (score >= target) return levelUp();
      if (moves <= 0) return gameOver();
      if (!hasMove()) doShuffle(true);
      return;
    }
    const set = new Set(m.map(([r, c]) => idx(r, c)));
    board.querySelectorAll('.m3-cell').forEach((d) => {
      if (set.has(Number(d.dataset.i))) d.classList.add('pop');
    });
    const gain = m.length * 10 * mult;
    score += gain;
    if (mult > 1) sfx.clear(); else sfx.pop();
    vibrate(12);
    later(() => {
      m.forEach(([r, c]) => { grid[r][c] = -1; });
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) {
          if (grid[r][c] !== -1) { grid[w][c] = grid[r][c]; if (w !== r) grid[r][c] = -1; w--; }
        }
        for (let r = w; r >= 0; r--) grid[r][c] = rnd();
      }
      hud();
      resolve(mult + 1);
    }, 230);
  }
  function doShuffle(auto) {
    if (busy && !auto) return;
    let tries = 0;
    do {
      const flat = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) flat.push(grid[r][c] === -1 ? rnd() : grid[r][c]);
      for (let i = flat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flat[i], flat[j]] = [flat[j], flat[i]];
      }
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = flat[r * N + c];
      tries++;
    } while ((findMatches().length || !hasMove()) && tries < 60);
    sel = null;
    paint();
    if (!auto) { moves = Math.max(0, moves - 1); hud(); sfx.level(); }
  }
  function levelUp() {
    api.submitScore(score);
    sfx.win();
    level++;
    target = Math.round(target * 1.7);
    moves += 14;
    const ov = showOverlay('<h2>🎉 ' + (fa ? 'مرحله' : 'Level') + ' ' + pnum(level - 1) + '</h2>' +
      '<p>' + (fa ? 'هدف بعدی: ' : 'Next goal: ') + pnum(target) + ' ⭐ · +' + pnum(14) + (fa ? ' حرکت' : ' moves') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-cont>' + (fa ? 'برو بریم!' : "Let's go!") + '</button>');
    ov.querySelector('[data-cont]').addEventListener('click', () => { sfx.click(); hideOver(); hud(); });
    hud();
  }
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    const ov = showOverlay('<h2>' + (fa ? 'حرکت‌ها تموم شد!' : 'Out of moves!') + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>');
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); reset(); });
  }
  function showOverlay(html) {
    hideOver();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = html;
    wrap.querySelector('.ag-board').appendChild(ov);
    return ov;
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }

  let pdown = null;
  board.addEventListener('pointerdown', (e) => {
    if (busy || over) return;
    sfx.unlock();
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    pdown = cell;
  });
  board.addEventListener('pointermove', (e) => {
    if (!pdown || busy || over) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell || (cell.r === pdown.r && cell.c === pdown.c)) return;
    const dr = Math.abs(cell.r - pdown.r), dc = Math.abs(cell.c - pdown.c);
    if (dr + dc === 1) { const a = pdown; pdown = null; trySwap(a, cell); }
    else pdown = null;
  });
  board.addEventListener('pointerup', (e) => {
    if (!pdown || busy || over) { pdown = null; return; }
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) { pdown = null; return; }
    if (sel && Math.abs(cell.r - sel.r) + Math.abs(cell.c - sel.c) === 1) {
      const a = sel; sel = null; pdown = null;
      trySwap(a, cell);
    } else {
      sel = (sel && sel.r === cell.r && sel.c === cell.c) ? null : cell;
      sfx.flip();
      paint();
      pdown = null;
    }
  });
  wrap.querySelector('[data-shuffle]').addEventListener('click', () => doShuffle(false));
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  window.addEventListener('resize', paint);
  timers = [];
  reset();
  return function destroy() {
    timers.forEach(clearTimeout);
    if (score > 0) api.submitScore(score);
    window.removeEventListener('resize', paint);
    style.remove();
    wrap.remove();
  };
}
