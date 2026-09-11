// 💣 Minesweeper — مین‌یاب: سه سختی، پرچم با راست‌کلیک/لمس طولانی
import { pnum, sfx, vibrate } from '../arcade.js';

const DIFFS = {
  easy: { n: 9, mines: 10 },
  mid: { n: 12, mines: 24 },
  hard: { n: 15, mines: 50 },
};
const NUM_C = ['', '#60a5fa', '#4ade80', '#fb7185', '#a78bfa', '#fbbf24', '#22d3ee', '#f472b6', '#94a3b8'];

const css = `
.mn-grid{ display:grid; gap:3px; width:100%; touch-action:none; user-select:none; -webkit-user-select:none; }
.mn-cell{ aspect-ratio:1; border-radius:6px; border:0; cursor:pointer; font:inherit; font-weight:900;
  background:rgba(255,255,255,.08); color:#fff; font-size:15px; padding:0; touch-action:none; }
.mn-cell:active{ transform:scale(.94); }
.mn-cell.open{ background:rgba(0,0,0,.4); cursor:default; }
.mn-cell.boom{ background:#e11d48; }
.mn-cell.flagged{ color:#fbbf24; }
`;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-seg" data-seg>' +
    '<button type="button" data-d="easy">' + (fa ? 'راحت' : 'Easy') + '</button>' +
    '<button type="button" data-d="mid" class="is-on">' + (fa ? 'متوسط' : 'Medium') + '</button>' +
    '<button type="button" data-d="hard">' + (fa ? 'سخت' : 'Hard') + '</button></div>' +
    '<div class="ag-hud"><span class="ag-pill">💣 <b data-mn>۰</b></span>' +
    '<span class="ag-pill">⏱ <b data-t>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:460px"><div class="mn-grid" data-grid></div></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'پرچم: راست‌کلیک یا لمس طولانی 🚩' : 'Flag: right-click or long-press 🚩') + '</div>';
  root.appendChild(wrap);

  const gridEl = wrap.querySelector('[data-grid]');
  const mnEl = wrap.querySelector('[data-mn]');
  const tEl = wrap.querySelector('[data-t]');
  let diff = 'mid', n, mineCount, grid, open, flags, started, over, secs, timer, lpTimer, lpFired;

  function reset() {
    clearInterval(timer);
    const D = DIFFS[diff];
    n = D.n; mineCount = D.mines;
    grid = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ m: false, n: 0, o: false, f: false })));
    open = 0; flags = 0; started = false; over = false; secs = 0;
    gridEl.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
    gridEl.innerHTML = '';
    for (let i = 0; i < n * n; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mn-cell';
      b.dataset.i = i;
      gridEl.appendChild(b);
    }
    hud();
    timer = setInterval(() => { if (started && !over) { secs++; tEl.textContent = pnum(secs); } }, 1000);
  }
  function hud() {
    mnEl.textContent = pnum(mineCount - flags);
    tEl.textContent = pnum(secs);
  }
  function plant(sr, sc) {
    let placed = 0, guard = 0;
    while (placed < mineCount && guard++ < 4000) {
      const r = Math.floor(Math.random() * n), c = Math.floor(Math.random() * n);
      if (grid[r][c].m || (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1)) continue;
      grid[r][c].m = true;
      placed++;
    }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (grid[r][c].m) continue;
      let k = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < n && cc < n && grid[rr][cc].m) k++;
      }
      grid[r][c].n = k;
    }
  }
  function paint(r, c) {
    const cell = grid[r][c];
    const d = gridEl.children[r * n + c];
    d.classList.toggle('open', cell.o);
    d.classList.toggle('flagged', cell.f && !cell.o);
    if (cell.o) {
      if (cell.m) { d.textContent = '💥'; d.classList.add('boom'); }
      else { d.textContent = cell.n ? cell.n : ''; d.style.color = NUM_C[cell.n] || '#fff'; }
    } else {
      d.textContent = cell.f ? '🚩' : '';
    }
  }
  function reveal(r, c) {
    if (over) return;
    const cell = grid[r][c];
    if (cell.o || cell.f) return;
    if (!started) { started = true; plant(r, c); }
    if (cell.m) return explode(r, c);
    const stack = [[r, c]];
    while (stack.length) {
      const [rr, cc] = stack.pop();
      const cl = grid[rr][cc];
      if (cl.o || cl.f) continue;
      cl.o = true; open++;
      paint(rr, cc);
      if (cl.n === 0) {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const a = rr + dr, b = cc + dc;
          if (a >= 0 && b >= 0 && a < n && b < n && !grid[a][b].o) stack.push([a, b]);
        }
      }
    }
    sfx.tick();
    if (open === n * n - mineCount) win();
  }
  function toggleFlag(r, c) {
    if (over || !started && false) return;
    const cell = grid[r][c];
    if (cell.o) return;
    cell.f = !cell.f;
    flags += cell.f ? 1 : -1;
    sfx.flip();
    vibrate(15);
    paint(r, c);
    hud();
  }
  function explode(r, c) {
    over = true;
    clearInterval(timer);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (grid[i][j].m) { grid[i][j].o = true; paint(i, j); }
    }
    sfx.boom();
    vibrate([80, 50, 80]);
    const ov = showOverlay('<h2>💥 ' + (fa ? 'بوم!' : 'Boom!') + '</h2>' +
      '<p>⏱ ' + pnum(secs) + (fa ? ' ثانیه' : 's') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>');
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); ov.remove(); reset(); });
    void r; void c;
  }
  function win() {
    over = true;
    clearInterval(timer);
    const mult = diff === 'hard' ? 3 : diff === 'mid' ? 2 : 1;
    const score = Math.max(10, (5000 - secs * 15) * mult);
    const r = api.submitScore(score);
    sfx.win();
    const ov = showOverlay('<h2>🎉 ' + (fa ? 'بردی!' : 'You win!') + '</h2>' +
      '<p>⏱ ' + pnum(secs) + (fa ? ' ثانیه' : 's') + '</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>');
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); ov.remove(); reset(); });
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

  function coordsFromEvent(e) {
    const b = e.target.closest('.mn-cell');
    if (!b) return null;
    const i = Number(b.dataset.i);
    return { r: Math.floor(i / n), c: i % n };
  }
  gridEl.addEventListener('click', (e) => {
    if (lpFired) { lpFired = false; return; }
    const p = coordsFromEvent(e);
    if (p) reveal(p.r, p.c);
  });
  gridEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const p = coordsFromEvent(e);
    if (p) toggleFlag(p.r, p.c);
  });
  gridEl.addEventListener('pointerdown', (e) => {
    const p = coordsFromEvent(e);
    if (!p) return;
    lpFired = false;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => {
      lpFired = true;
      toggleFlag(p.r, p.c);
    }, 480);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => gridEl.addEventListener(t, () => clearTimeout(lpTimer)));
  wrap.querySelector('[data-seg]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    diff = b.dataset.d;
    wrap.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('is-on', x === b));
    hideOver();
    sfx.click();
    reset();
  });
  wrap.querySelector('[data-new]').addEventListener('click', () => { hideOver(); sfx.click(); reset(); });
  reset();
  return function destroy() {
    clearInterval(timer);
    clearTimeout(lpTimer);
    style.remove();
    wrap.remove();
  };
}
