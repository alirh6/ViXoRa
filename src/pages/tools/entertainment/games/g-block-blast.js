// 🧱 Block Blast — پرچم‌دار آرکید: درگ بلوک، پاک‌سازی خط، کمبو
import { randi, choice, pnum, sfx, vibrate } from '../arcade.js';

const N = 8;
const COLORS = ['#22d3ee', '#a78bfa', '#fb7185', '#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#f97316'];
const SHAPES = [
  [[0, 0]],
  [[0, 0], [0, 1]], [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3]],
];

const css = `
.bb-wrap{ display:flex; flex-direction:column; align-items:center; gap:12px; width:100%; max-width:460px; }
.bb-board{ display:grid; grid-template-columns:repeat(8,1fr); gap:4px; width:100%; aspect-ratio:1;
  background:rgba(0,0,0,.35); border-radius:16px; padding:10px; touch-action:none; user-select:none; -webkit-user-select:none; }
.bb-cell{ border-radius:7px; background:rgba(255,255,255,.05); transition:background .12s, transform .12s; }
.bb-cell.fill{ box-shadow:inset 0 -3px 0 rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.25); }
.bb-cell.ghost-ok{ background:rgba(52,211,153,.55)!important; transform:scale(.94); }
.bb-cell.ghost-bad{ background:rgba(251,113,133,.4)!important; }
.bb-cell.pop{ animation:bbpop .25s ease; }
@keyframes bbpop{ 0%{ transform:scale(1);} 40%{ transform:scale(1.25); filter:brightness(1.6);} 100%{ transform:scale(1);} }
.bb-tray{ display:flex; gap:14px; justify-content:center; align-items:flex-end; min-height:96px; width:100%; }
.bb-piece{ cursor:grab; touch-action:none; padding:10px; border-radius:14px; background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.07); transition:transform .12s; }
.bb-piece:active{ cursor:grabbing; }
.bb-prow{ display:flex; gap:3px; }
.bb-prow + .bb-prow{ margin-top:3px; }
.bb-pcell{ width:22px; height:22px; border-radius:5px; }
.bb-drag{ position:fixed; z-index:10000; pointer-events:none; opacity:.92; filter:drop-shadow(0 10px 20px rgba(0,0,0,.5)); }
.bb-combo{ min-height:26px; font-weight:900; font-size:16px; color:#ffd166; text-shadow:0 0 18px rgba(255,209,102,.6); }
`;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="bb-wrap"><div class="ag-hud"><span class="ag-pill">⭐ <b data-s>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="bb-combo" data-c></div><div class="ag-board" style="width:100%;max-width:460px"><div class="bb-board" data-board></div></div>' +
    '<div class="bb-tray" data-tray></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>' + (fa ? '↻ بازی جدید' : '↻ New game') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'بلوک رو بکش و روی جدول رها کن. سطر یا ستون کامل = انفجار! 💥' : 'Drag blocks onto the grid. Full row or column = blast! 💥') + '</div></div>';
  root.appendChild(wrap);

  const boardEl = wrap.querySelector('[data-board]');
  const trayEl = wrap.querySelector('[data-tray]');
  const scoreEl = wrap.querySelector('[data-s]');
  const comboEl = wrap.querySelector('[data-c]');
  const cells = [];
  for (let i = 0; i < N * N; i++) {
    const d = document.createElement('div');
    d.className = 'bb-cell';
    boardEl.appendChild(d);
    cells.push(d);
  }

  let grid, tray, score, streak, busy, over;
  let drag = null;

  function newPiece() {
    const shape = choice(SHAPES).map(([r, c]) => ({ r, c }));
    return { shape, color: choice(COLORS) };
  }
  function refill() {
    tray = [newPiece(), newPiece(), newPiece()];
  }
  function reset() {
    grid = Array.from({ length: N }, () => Array(N).fill(null));
    refill();
    score = 0; streak = 0; busy = false; over = false;
    comboEl.textContent = '';
    paint(); paintTray(); paintScore();
  }
  function paintScore() { scoreEl.textContent = pnum(score); }
  function paint() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const d = cells[r * N + c];
      const v = grid[r][c];
      d.classList.toggle('fill', !!v);
      d.style.background = v || '';
    }
  }
  function shapeHW(shape) {
    let h = 0, w = 0;
    for (const s of shape) { h = Math.max(h, s.r + 1); w = Math.max(w, s.c + 1); }
    return { h, w };
  }
  function paintTray() {
    trayEl.innerHTML = '';
    tray.forEach((p, i) => {
      if (!p) { const sp = document.createElement('div'); sp.style.minWidth = '70px'; trayEl.appendChild(sp); return; }
      const { h, w } = shapeHW(p.shape);
      const d = document.createElement('div');
      d.className = 'bb-piece';
      d.dataset.i = i;
      let html = '';
      for (let r = 0; r < h; r++) {
        html += '<div class="bb-prow">';
        for (let c = 0; c < w; c++) {
          const on = p.shape.some((s) => s.r === r && s.c === c);
          html += on ? '<div class="bb-pcell" style="background:' + p.color + ';box-shadow:inset 0 -2px 0 rgba(0,0,0,.25)"></div>' : '<div class="bb-pcell" style="background:transparent"></div>';
        }
        html += '</div>';
      }
      d.innerHTML = html;
      trayEl.appendChild(d);
    });
  }
  function canPlace(shape, br, bc) {
    for (const s of shape) {
      const r = br + s.r, c = bc + s.c;
      if (r < 0 || c < 0 || r >= N || c >= N || grid[r][c]) return false;
    }
    return true;
  }
  function fitsAnywhere(shape) {
    const { h, w } = shapeHW(shape);
    for (let r = 0; r <= N - h; r++) for (let c = 0; c <= N - w; c++) if (canPlace(shape, r, bc)) return true;
    return false;
  }
  function clearGhost() {
    cells.forEach((d) => d.classList.remove('ghost-ok', 'ghost-bad'));
  }
  function showGhost(shape, br, bc) {
    clearGhost();
    const ok = canPlace(shape, br, bc);
    for (const s of shape) {
      const r = br + s.r, c = bc + s.c;
      if (r >= 0 && c >= 0 && r < N && c < N && !grid[r][c]) cells[r * N + c].classList.add(ok ? 'ghost-ok' : 'ghost-bad');
    }
    return ok;
  }
  function cellFromPoint(x, y) {
    const rect = boardEl.getBoundingClientRect();
    const pad = 10, gap = 4;
    const inner = rect.width - pad * 2;
    const cell = (inner - gap * (N - 1)) / N;
    const c = Math.floor((x - rect.left - pad + gap / 2) / (cell + gap));
    const r = Math.floor((y - rect.top - pad + gap / 2) / (cell + gap));
    return { r, c };
  }
  function makeDragEl(p) {
    const { h, w } = shapeHW(p.shape);
    const d = document.createElement('div');
    d.className = 'bb-drag';
    let html = '';
    for (let r = 0; r < h; r++) {
      html += '<div class="bb-prow">';
      for (let c = 0; c < w; c++) {
        const on = p.shape.some((s) => s.r === r && s.c === c);
        html += on ? '<div class="bb-pcell" style="background:' + p.color + ';width:26px;height:26px"></div>' : '<div class="bb-pcell" style="background:transparent;width:26px;height:26px"></div>';
      }
      html += '</div>';
    }
    d.innerHTML = html;
    document.body.appendChild(d);
    return d;
  }
  function onDown(e) {
    if (busy || over) return;
    const t = e.target.closest('.bb-piece');
    if (!t) return;
    e.preventDefault();
    sfx.unlock();
    const i = Number(t.dataset.i);
    const p = tray[i];
    if (!p) return;
    const { h, w } = shapeHW(p.shape);
    const rect = t.getBoundingClientRect();
    const grabR = Math.min(h - 1, Math.max(0, Math.floor(((e.clientY - rect.top - 10) / (rect.height - 20)) * h)));
    const grabC = Math.min(w - 1, Math.max(0, Math.floor(((e.clientX - rect.left - 10) / (rect.width - 20)) * w)));
    drag = { i, p, grabR, grabC, el: makeDragEl(p), ok: false, br: 0, bc: 0 };
    t.style.visibility = 'hidden';
    moveDrag(e.clientX, e.clientY);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onCancel, { once: true });
  }
  function moveDrag(x, y) {
    if (!drag) return;
    drag.el.style.left = (x - drag.el.offsetWidth / 2) + 'px';
    drag.el.style.top = (y - drag.el.offsetHeight - 24) + 'px';
    const { r, c } = cellFromPoint(x, y - 24);
    drag.br = r - drag.grabR;
    drag.bc = c - drag.grabC;
    drag.ok = showGhost(drag.p.shape, drag.br, drag.bc);
  }
  function onMove(e) { moveDrag(e.clientX, e.clientY); }
  function endDrag() {
    window.removeEventListener('pointermove', onMove);
    if (drag && drag.el) drag.el.remove();
    const d = drag;
    drag = null;
    clearGhost();
    paintTray();
    return d;
  }
  function onCancel() { endDrag(); }
  function onUp(e) {
    window.removeEventListener('pointercancel', onCancel);
    const d = endDrag();
    if (!d) return;
    moveGhostToDrop(e, d);
  }
  function moveGhostToDrop(e, d) {
    const { r, c } = cellFromPoint(e.clientX, e.clientY - 24);
    const br = r - d.grabR, bc = c - d.grabC;
    if (canPlace(d.p.shape, br, bc)) placePiece(d, br, bc);
    else sfx.click();
  }
  function placePiece(d, br, bc) {
    busy = true;
    for (const s of d.p.shape) grid[br + s.r][bc + s.c] = d.p.color;
    tray[d.i] = null;
    score += d.p.shape.length;
    sfx.place();
    vibrate(15);
    paint(); paintTray(); paintScore();
    const rows = [], cols = [];
    for (let r = 0; r < N; r++) if (grid[r].every(Boolean)) rows.push(r);
    for (let c = 0; c < N; c++) { let full = true; for (let r = 0; r < N; r++) if (!grid[r][c]) full = false; if (full) cols.push(c); }
    const lines = rows.length + cols.length;
    if (lines > 0) {
      streak++;
      const bonus = [0, 10, 30, 60, 100, 150, 210, 280][Math.min(lines, 7)] + (streak > 1 ? streak * 25 : 0);
      score += bonus;
      const set = new Set();
      rows.forEach((r) => { for (let c = 0; c < N; c++) set.add(r * N + c); });
      cols.forEach((c) => { for (let r = 0; r < N; r++) set.add(r * N + c); });
      set.forEach((i) => cells[i].classList.add('pop'));
      comboEl.textContent = (streak > 1 ? '🔥 ' + (fa ? 'کمبو' : 'Combo') + ' ×' + pnum(streak) + '  ' : '') + '+' + pnum(bonus);
      sfx.clear();
      vibrate([30, 40, 30]);
      setTimeout(() => {
        rows.forEach((r) => { for (let c = 0; c < N; c++) grid[r][c] = null; });
        cols.forEach((c) => { for (let r = 0; r < N; r++) grid[r][c] = null; });
        cells.forEach((dd) => dd.classList.remove('pop'));
        paint(); paintScore();
        afterMove();
      }, 240);
    } else {
      streak = 0;
      comboEl.textContent = '';
      afterMove();
    }
  }
  function afterMove() {
    if (tray.every((t) => !t)) refill();
    paintTray();
    busy = false;
    const alive = tray.some((p) => p && fitsAnywhere(p.shape));
    if (!alive) gameOver();
  }
  function gameOver() {
    over = true;
    const r = api.submitScore(score);
    sfx.lose();
    comboEl.textContent = '';
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.style.position = 'fixed';
    ov.style.inset = '0';
    ov.style.zIndex = '20';
    ov.style.borderRadius = '0';
    ov.innerHTML = '<h2>' + (fa ? 'بازی تمام شد!' : 'Game Over!') + '</h2><div class="ag-big">' + pnum(score) + '</div>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); ov.remove(); reset(); });
  }

  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  trayEl.addEventListener('pointerdown', onDown);
  reset();

  return function destroy() {
    if (score > 0) api.submitScore(score);
    if (drag && drag.el) drag.el.remove();
    window.removeEventListener('pointermove', onMove);
    style.remove();
    wrap.remove();
  };
}
