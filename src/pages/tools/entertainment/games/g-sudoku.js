// 🔢 Sudoku — تولید نامحدود: سه سختی، راهنما، یادداشت، خطا
import { shuffle, pnum, sfx } from '../arcade.js';

const HOLES = { easy: 36, mid: 46, hard: 53 };

const css = `
.sd-grid{ display:grid; grid-template-columns:repeat(9,1fr); gap:2px; width:100%; max-width:420px;
  background:rgba(255,255,255,.12); border-radius:14px; padding:8px; }
.sd-cell{ aspect-ratio:1; border-radius:7px; border:0; cursor:pointer; font:inherit; font-weight:800; font-size:17px;
  background:rgba(0,0,0,.35); color:#fff; position:relative; transition:.12s; padding:0; }
.sd-cell.given{ color:#22d3ee; cursor:default; font-weight:900; }
.sd-cell.sel{ background:rgba(34,211,238,.3)!important; box-shadow:0 0 0 2px #22d3ee; }
.sd-cell.same{ background:rgba(34,211,238,.14); }
.sd-cell.err{ color:#fb7185; animation:sdshake .3s ease; }
@keyframes sdshake{ 0%,100%{transform:none;} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }
.sd-cell .nt{ position:absolute; inset:2px; display:grid; grid-template-columns:repeat(3,1fr); font-size:8px; color:#94a3b8; font-weight:700; pointer-events:none; }
.sd-cell:nth-child(3n){ margin-right:5px; }
.sd-cell:nth-child(9n){ margin-right:0; }
.sd-pad{ display:grid; grid-template-columns:repeat(9,1fr); gap:5px; width:100%; max-width:420px; }
.sd-pad button{ aspect-ratio:1; border-radius:10px; border:1px solid rgba(255,255,255,.12); cursor:pointer;
  background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:17px; font-weight:900; touch-action:manipulation; }
.sd-pad button:active{ transform:scale(.9); background:rgba(34,211,238,.25); }
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
    '<div class="ag-hud"><span class="ag-pill">❌ <b data-e>۰/۵</b></span>' +
    '<span class="ag-pill">💡 <b data-h>۳</b></span>' +
    '<span class="ag-pill">⏱ <b data-t>۰:۰۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:456px;display:flex;justify-content:center"><div class="sd-grid" data-grid></div></div>' +
    '<div class="sd-pad" data-pad></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-notes>✏️ ' + (fa ? 'یادداشت' : 'Notes') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-hint>💡 ' + (fa ? 'راهنما' : 'Hint') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-erase>⌫ ' + (fa ? 'پاک' : 'Erase') + '</button>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'جدید' : 'New') + '</button></div>';
  root.appendChild(wrap);

  const gridEl = wrap.querySelector('[data-grid]');
  const padEl = wrap.querySelector('[data-pad]');
  const eEl = wrap.querySelector('[data-e]');
  const hEl = wrap.querySelector('[data-h]');
  const tEl = wrap.querySelector('[data-t]');
  const notesBtn = wrap.querySelector('[data-notes]');
  let diff = 'mid', sol, puzzle, notes, sel, errors, hints, notesMode, over, secs, timer;

  function solvedGrid() {
    const g = Array.from({ length: 9 }, () => Array(9).fill(0));
    function ok(r, c, v) {
      for (let i = 0; i < 9; i++) {
        if (g[r][i] === v || g[i][c] === v) return false;
      }
      const br = r - (r % 3), bc = c - (c % 3);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[br + i][bc + j] === v) return false;
      return true;
    }
    function fill(i) {
      if (i >= 81) return true;
      const r = (i / 9) | 0, c = i % 9;
      for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (ok(r, c, v)) {
          g[r][c] = v;
          if (fill(i + 1)) return true;
          g[r][c] = 0;
        }
      }
      return false;
    }
    fill(0);
    return g;
  }
  function reset() {
    clearInterval(timer);
    sol = solvedGrid();
    puzzle = sol.map((r) => r.slice());
    let holes = HOLES[diff];
    const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
    for (const i of cells) {
      if (holes <= 0) break;
      const r = (i / 9) | 0, c = i % 9;
      const mr = 8 - r, mc = 8 - c;
      if (!puzzle[r][c]) continue;
      puzzle[r][c] = 0; holes--;
      if (holes > 0 && puzzle[mr][mc]) { puzzle[mr][mc] = 0; holes--; }
    }
    notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    sel = null; errors = 0; hints = 3; notesMode = false; over = false; secs = 0;
    notesBtn.classList.remove('ag-btn--primary');
    buildPad();
    paint();
    hideOver();
    hud();
    timer = setInterval(() => { if (!over) { secs++; hud(); } }, 1000);
  }
  function hud() {
    eEl.textContent = pnum(errors) + '/' + pnum(5);
    hEl.textContent = pnum(hints);
    tEl.textContent = pnum(Math.floor(secs / 60)) + ':' + pnum(String(secs % 60).padStart(2, '0'));
  }
  function buildPad() {
    padEl.innerHTML = '';
    for (let v = 1; v <= 9; v++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = pnum(v);
      b.dataset.v = v;
      padEl.appendChild(b);
    }
  }
  function paint() {
    gridEl.innerHTML = '';
    const selVal = sel ? puzzle[sel.r][sel.c] : 0;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const v = puzzle[r][c];
      const d = document.createElement('button');
      d.type = 'button';
      const given = v && notes[r][c].size === 0 && isGiven(r, c);
      d.className = 'sd-cell' + (given ? ' given' : '') +
        (sel && sel.r === r && sel.c === c ? ' sel' : '') +
        (v && v === selVal ? ' same' : '');
      d.dataset.i = r * 9 + c;
      if (v) d.textContent = pnum(v);
      else if (notes[r][c].size) {
        let nt = '<span class="nt">';
        for (let k = 1; k <= 9; k++) nt += '<span>' + (notes[r][c].has(k) ? pnum(k) : '') + '</span>';
        d.innerHTML = nt + '</span>';
      }
      if (sel && sel.r === r && sel.c === c && v && v !== sol[r][c]) d.classList.add('err');
      gridEl.appendChild(d);
    }
  }
  const givenMap = new Map();
  function isGiven(r, c) {
    return givenMap.get('k') === puzzle && givenMap.get(r * 9 + c);
  }
  function snapshotGiven() {
    givenMap.clear();
    givenMap.set('k', puzzle);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (puzzle[r][c]) givenMap.set(r * 9 + c, true);
  }
  function enter(v) {
    if (!sel || over) return;
    const { r, c } = sel;
    if (givenMap.get(r * 9 + c)) return;
    if (notesMode) {
      if (puzzle[r][c]) return;
      if (notes[r][c].has(v)) notes[r][c].delete(v);
      else notes[r][c].add(v);
      sfx.tick();
      paint();
      return;
    }
    notes[r][c].clear();
    puzzle[r][c] = v;
    if (v !== sol[r][c]) {
      errors++;
      sfx.hit();
      paint();
      const cell = gridEl.children[r * 9 + c];
      cell.classList.add('err');
      hud();
      if (errors >= 5) return fail();
    } else {
      sfx.pop();
      // حذف یادداشت همان عدد از همسایه‌ها
      for (let i = 0; i < 9; i++) {
        notes[r][i].delete(v);
        notes[i][c].delete(v);
      }
      const br = r - (r % 3), bc = c - (c % 3);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) notes[br + i][bc + j].delete(v);
      paint();
      if (puzzle.every((row, rr) => row.every((vv, cc) => vv === sol[rr][cc]))) win();
    }
  }
  function erase() {
    if (!sel || over) return;
    const { r, c } = sel;
    if (givenMap.get(r * 9 + c)) return;
    puzzle[r][c] = 0;
    notes[r][c].clear();
    sfx.click();
    paint();
  }
  function hint() {
    if (over || hints <= 0) return;
    const empt = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!puzzle[r][c] || puzzle[r][c] !== sol[r][c]) empt.push([r, c]);
    if (!empt.length) return;
    const [r, c] = empt[(Math.random() * empt.length) | 0];
    puzzle[r][c] = sol[r][c];
    notes[r][c].clear();
    hints--;
    sel = { r, c };
    sfx.coin();
    paint();
    hud();
    if (puzzle.every((row, rr) => row.every((vv, cc) => vv === sol[rr][cc]))) win();
  }
  function score() {
    const mult = diff === 'hard' ? 3 : diff === 'mid' ? 2 : 1;
    return Math.max(50, (10000 - secs * 8 - errors * 300) * mult);
  }
  function win() {
    over = true;
    clearInterval(timer);
    const sc = score();
    const r = api.submitScore(sc);
    sfx.win();
    const ov = showOverlay('<h2>🎉 ' + (fa ? 'حل شد!' : 'Solved!') + '</h2>' +
      '<p>⏱ ' + pnum(Math.floor(secs / 60)) + ':' + pnum(String(secs % 60).padStart(2, '0')) + ' · ❌ ' + pnum(errors) + '</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '🧩 جدول جدید' : '🧩 New puzzle') + '</button>');
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); reset(); snapshotGiven(); });
  }
  function fail() {
    over = true;
    clearInterval(timer);
    sfx.lose();
    const ov = showOverlay('<h2>❌ ' + (fa ? '۵ خطا!' : '5 mistakes!') + '</h2>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ تلاش دوباره' : '↻ Retry') + '</button>');
    ov.querySelector('[data-again]').addEventListener('click', () => {
      sfx.click();
      // همان جدول، خطاها صفر
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        if (!givenMap.get(r * 9 + c)) { puzzle[r][c] = 0; notes[r][c].clear(); }
      }
      errors = 0; over = false;
      hideOver();
      paint();
      hud();
      timer = setInterval(() => { if (!over) { secs++; hud(); } }, 1000);
    });
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
  gridEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b || over) return;
    const i = Number(b.dataset.i);
    sel = { r: (i / 9) | 0, c: i % 9 };
    sfx.tick();
    paint();
  });
  padEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (b) enter(Number(b.dataset.v));
  });
  function onKey(e) {
    if (e.key >= '1' && e.key <= '9') enter(Number(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') erase();
    else if (e.key === 'n' || e.key === 'N') notesBtn.click();
  }
  window.addEventListener('keydown', onKey);
  notesBtn.addEventListener('click', () => {
    notesMode = !notesMode;
    notesBtn.classList.toggle('ag-btn--primary', notesMode);
    sfx.click();
  });
  wrap.querySelector('[data-hint]').addEventListener('click', hint);
  wrap.querySelector('[data-erase]').addEventListener('click', erase);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); snapshotGiven(); });
  wrap.querySelector('[data-seg]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    diff = b.dataset.d;
    wrap.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('is-on', x === b));
    sfx.click();
    reset();
    snapshotGiven();
  });
  reset();
  snapshotGiven();
  return function destroy() {
    clearInterval(timer);
    window.removeEventListener('keydown', onKey);
    style.remove();
    wrap.remove();
  };
}
