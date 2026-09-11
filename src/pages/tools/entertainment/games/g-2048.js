// 🎲 2048 — ادغام تا بی‌نهایت: سوایپ/کیبورد، Undo، ادامه بعد از برد
import { randi, pnum, sfx } from '../arcade.js';

const N = 4;
const TILE_C = { 2: '#3b4256,#2b3040', 4: '#4d5a7d,#39415c', 8: '#f59e0b,#d97706', 16: '#fb923c,#ea580c', 32: '#fb7185,#e11d48', 64: '#e11d48,#9f1239', 128: '#facc15,#ca8a04', 256: '#fbbf24,#b45309', 512: '#a3e635,#65a30d', 1024: '#34d399,#059669', 2048: '#22d3ee,#0284c7' };
function tileColor(v) { return TILE_C[v] || '#a78bfa,#7c3aed'; }

const css = `
.t4-board{ position:relative; width:100%; aspect-ratio:1; background:rgba(0,0,0,.35); border-radius:16px; touch-action:none; user-select:none; -webkit-user-select:none; }
.t4-bg{ position:absolute; inset:0; display:grid; grid-template-columns:repeat(4,1fr); grid-template-rows:repeat(4,1fr); gap:8px; padding:10px; }
.t4-bg div{ background:rgba(255,255,255,.06); border-radius:10px; }
.t4-tiles{ position:absolute; inset:10px; }
.t4-tile{ position:absolute; width:calc((100% - 24px)/4); height:calc((100% - 24px)/4); display:flex; align-items:center; justify-content:center;
  border-radius:10px; font-weight:900; color:#fff; transition:transform .13s ease; text-shadow:0 2px 6px rgba(0,0,0,.4);
  box-shadow:inset 0 -4px 0 rgba(0,0,0,.22), inset 0 2px 0 rgba(255,255,255,.2); }
.t4-tile.new{ animation:t4new .18s ease; }
.t4-tile.merged{ animation:t4merge .22s ease; }
@keyframes t4new{ from{ transform:scale(.4); opacity:0; } }
@keyframes t4merge{ 0%{ transform:scale(1);} 45%{ transform:scale(1.18);} 100%{ transform:scale(1);} }
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
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:440px"><div class="t4-board" data-board><div class="t4-bg"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div><div class="t4-tiles" data-t></div></div></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-undo>↩ ' + (fa ? 'برگرد' : 'Undo') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'با سوایپ یا جهت‌های کیبورد کاشی‌ها رو حرکت بده' : 'Swipe or use arrow keys') + '</div>';
  root.appendChild(wrap);

  const board = wrap.querySelector('[data-board]');
  const layer = wrap.querySelector('[data-t]');
  const scoreEl = wrap.querySelector('[data-s]');
  let grid, score, prev, over, won, keepGoing, maxSubmit;

  function emptyCells() {
    const out = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) out.push([r, c]);
    return out;
  }
  function spawn() {
    const e = emptyCells();
    if (!e.length) return;
    const [r, c] = e[randi(0, e.length - 1)];
    grid[r][c] = { v: Math.random() < 0.9 ? 2 : 4, fresh: true };
  }
  function reset() {
    grid = Array.from({ length: N }, () => Array(N).fill(null));
    score = 0; prev = null; over = false; won = false; keepGoing = false; maxSubmit = 0;
    spawn(); spawn();
    hideOver(); paint();
  }
  function paint() {
    scoreEl.textContent = pnum(score);
    layer.innerHTML = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = grid[r][c];
      if (!t) continue;
      const d = document.createElement('div');
      d.className = 't4-tile' + (t.fresh ? ' new' : '') + (t.merged ? ' merged' : '');
      d.style.transform = 'translate(calc(' + c + ' * (100% + 8px)), calc(' + r + ' * (100% + 8px)))';
      d.style.background = 'linear-gradient(135deg,' + tileColor(t.v) + ')';
      d.style.fontSize = (t.v >= 1024 ? 20 : t.v >= 128 ? 26 : 32) + 'px';
      d.textContent = pnum(t.v);
      layer.appendChild(d);
      t.fresh = false; t.merged = false;
    }
  }
  function slide(row) {
    const arr = row.filter(Boolean).map((t) => t.v);
    const out = [];
    let gained = 0, mergedAny = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i + 1] === arr[i]) {
        const v = arr[i] * 2;
        out.push({ v, merged: true });
        gained += v; mergedAny = true;
        i++;
      } else out.push({ v: arr[i] });
    }
    while (out.length < N) out.push(null);
    return { out, gained, mergedAny };
  }
  function move(dx, dy) {
    if (over) return;
    prev = { grid: grid.map((row) => row.map((t) => (t ? { v: t.v } : null))), score };
    let gained = 0, mergedAny = false, moved = false;
    const get = (i, j) => (dx !== 0 ? grid[i][dx > 0 ? N - 1 - j : j] : grid[dy > 0 ? N - 1 - j : j][i]);
    const set = (i, j, v) => { if (dx !== 0) grid[i][dx > 0 ? N - 1 - j : j] = v; else grid[dy > 0 ? N - 1 - j : j][i] = v; };
    for (let i = 0; i < N; i++) {
      const line = [];
      for (let j = 0; j < N; j++) line.push(get(i, j));
      const before = line.map((t) => (t ? t.v : 0)).join(',');
      const { out, gained: g, mergedAny: m } = slide(line);
      gained += g; mergedAny = mergedAny || m;
      for (let j = 0; j < N; j++) set(i, j, out[j]);
      const after = out.map((t) => (t ? t.v : 0)).join(',');
      if (before !== after) moved = true;
    }
    if (!moved) { prev = prev; return; }
    score += gained;
    if (mergedAny) { sfx.pop(); if (gained >= 128) sfx.coin(); }
    else sfx.tick();
    spawn();
    paint();
    if (score > maxSubmit) { maxSubmit = score; api.submitScore(score); }
    let max = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c]) max = Math.max(max, grid[r][c].v);
    if (max >= 2048 && !won) { won = true; winOver(); }
    else if (!canMove()) gameOver();
  }
  function canMove() {
    if (emptyCells().length) return true;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = grid[r][c] && grid[r][c].v;
      if (c + 1 < N && grid[r][c + 1] && grid[r][c + 1].v === v) return true;
      if (r + 1 < N && grid[r + 1][c] && grid[r + 1][c].v === v) return true;
    }
    return false;
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
  function winOver() {
    sfx.win();
    const ov = showOverlay('<h2>🎉 ' + pnum(2048) + '!</h2><p>' + (fa ? 'بردی! ادامه میدی؟' : 'You won! Keep going?') + '</p>' +
      '<div class="ag-controls"><button class="ag-btn ag-btn--primary" type="button" data-cont>' + (fa ? 'ادامه' : 'Continue') + '</button>' +
      '<button class="ag-btn" type="button" data-again>' + (fa ? 'از اول' : 'Restart') + '</button></div>');
    ov.querySelector('[data-cont]').addEventListener('click', () => { sfx.click(); keepGoing = true; hideOver(); });
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); reset(); });
    void keepGoing;
  }
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    const ov = showOverlay('<h2>' + (fa ? 'تمام شد!' : 'Game Over!') + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>');
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); reset(); });
  }
  function undo() {
    if (!prev || over) return;
    grid = prev.grid; score = prev.score; prev = null;
    sfx.click();
    paint();
  }
  function onKey(e) {
    if (e.key === 'ArrowUp' || e.key === 'w') { move(0, -1); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's') { move(0, 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'a') { move(-1, 0); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd') { move(1, 0); e.preventDefault(); }
  }
  let sx = 0, sy = 0;
  board.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
  board.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
    else move(0, dy > 0 ? 1 : -1);
  }, { passive: true });
  window.addEventListener('keydown', onKey);
  wrap.querySelector('[data-undo]').addEventListener('click', undo);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  return function destroy() {
    if (score > 0) api.submitScore(score);
    window.removeEventListener('keydown', onKey);
    style.remove();
    wrap.remove();
  };
}
