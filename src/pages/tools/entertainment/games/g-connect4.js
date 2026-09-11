// 🔴 Connect 4 — چهارتایی: دو نفره یا ضد هوش مصنوعی مینی‌مکس
import { pnum, sfx } from '../arcade.js';

const COLS = 7, ROWS = 6;

const css = `
.c4-board{ display:grid; grid-template-columns:repeat(7,1fr); gap:7px; width:100%; max-width:440px;
  background:linear-gradient(165deg,#1d4ed8,#1e3a8a); border-radius:20px; padding:14px; }
.c4-col{ display:grid; grid-template-rows:repeat(6,1fr); gap:7px; cursor:pointer; border-radius:12px; }
.c4-col:hover{ background:rgba(255,255,255,.08); }
.c4-cell{ aspect-ratio:1; border-radius:50%; background:rgba(0,0,0,.45); box-shadow:inset 0 3px 6px rgba(0,0,0,.5); }
.c4-cell.r{ background:radial-gradient(circle at 35% 30%,#fda4af,#e11d48); animation:c4drop .3s ease; }
.c4-cell.y{ background:radial-gradient(circle at 35% 30%,#fde68a,#d97706); animation:c4drop .3s ease; }
.c4-cell.win{ box-shadow:0 0 0 3px #22d3ee, 0 0 20px #22d3ee; }
@keyframes c4drop{ from{ transform:translateY(-160px);} to{ transform:none;} }
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
    '<button type="button" data-m="p2">' + (fa ? '👥 دو نفره' : '👥 2P') + '</button>' +
    '<button type="button" data-m="easy">' + (fa ? '😊 راحت' : '😊 Easy') + '</button>' +
    '<button type="button" data-m="hard" class="is-on">' + (fa ? '😈 سخت' : '😈 Hard') + '</button></div>' +
    '<div class="ag-hud"><span class="ag-pill">🔴 <b data-r>۰</b></span>' +
    '<span class="ag-pill">🟡 <b data-y>۰</b></span>' +
    '<span class="ag-pill">🤝 <b data-d>۰</b></span></div>' +
    '<div class="wd-msg" data-msg style="min-height:24px;font-weight:800;color:#ffd166"></div>' +
    '<div class="ag-board" style="width:100%;max-width:480px;display:flex;justify-content:center"><div class="c4-board" data-board></div></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>';
  root.appendChild(wrap);

  const boardEl = wrap.querySelector('[data-board]');
  const msgEl = wrap.querySelector('[data-msg]');
  const rEl = wrap.querySelector('[data-r]');
  const yEl = wrap.querySelector('[data-y]');
  const dEl = wrap.querySelector('[data-d]');
  let mode = 'hard', grid, turn, lock, score;
  const AI = 2, HUMAN = 1;

  function resetBoard() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    turn = HUMAN;
    lock = false;
    paint();
    msgEl.textContent = mode === 'p2' ? (fa ? 'نوبت 🔴' : "🔴's turn") : (fa ? 'تو 🔴 هستی!' : "You're 🔴!");
  }
  function resetAll() {
    score = { 1: 0, 2: 0, D: 0 };
    hud();
    resetBoard();
  }
  function hud() {
    rEl.textContent = pnum(score[1]);
    yEl.textContent = pnum(score[2]);
    dEl.textContent = pnum(score.D);
  }
  function paint(winCells) {
    boardEl.innerHTML = '';
    const set = new Set((winCells || []).map(([r, c]) => r * COLS + c));
    for (let c = 0; c < COLS; c++) {
      const col = document.createElement('div');
      col.className = 'c4-col';
      col.dataset.c = c;
      for (let r = 0; r < ROWS; r++) {
        const d = document.createElement('div');
        d.className = 'c4-cell' + (grid[r][c] === 1 ? ' r' : grid[r][c] === 2 ? ' y' : '') + (set.has(r * COLS + c) ? ' win' : '');
        col.appendChild(d);
      }
      boardEl.appendChild(col);
    }
  }
  function dropRow(c) {
    for (let r = ROWS - 1; r >= 0; r--) if (!grid[r][c]) return r;
    return -1;
  }
  function checkWin(g) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const v = g[r][c];
      if (!v) continue;
      const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (const [dr, dc] of dirs) {
        const cells = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k, cc = c + dc * k;
          if (rr < 0 || cc < 0 || rr >= ROWS || cc >= COLS || g[rr][cc] !== v) break;
          cells.push([rr, cc]);
        }
        if (cells.length === 4) return { who: v, cells };
      }
    }
    return g[0].every(Boolean) ? { who: 'D', cells: [] } : null;
  }
  function play(c) {
    if (lock) return;
    if (mode !== 'p2' && turn !== HUMAN) return;
    const r = dropRow(c);
    if (r < 0) return;
    grid[r][c] = turn;
    sfx.place();
    paint();
    const w = checkWin(grid);
    if (w) return finish(w);
    turn = turn === HUMAN ? AI : HUMAN;
    if (mode === 'p2') msgEl.textContent = fa ? 'نوبت ' + (turn === 1 ? '🔴' : '🟡') : turn === 1 ? "🔴's turn" : "🟡's turn";
    else {
      lock = true;
      msgEl.textContent = fa ? '🤔 هوش مصنوعی…' : '🤔 AI thinking…';
      setTimeout(() => {
        if (mode === 'p2') return;
        const ac = aiMove();
        const ar = dropRow(ac);
        grid[ar][ac] = AI;
        sfx.place();
        paint();
        lock = false;
        const w2 = checkWin(grid);
        if (w2) return finish(w2);
        turn = HUMAN;
        msgEl.textContent = fa ? 'نوبت توئه!' : 'Your turn!';
      }, 500);
    }
  }
  function finish(w) {
    lock = true;
    paint(w.cells);
    if (w.who === 'D') {
      score.D++;
      msgEl.textContent = fa ? '🤝 مساوی!' : '🤝 Draw!';
      sfx.click();
    } else {
      score[w.who]++;
      if (mode === 'p2') {
        msgEl.textContent = (fa ? '🎉 برنده: ' : '🎉 Winner: ') + (w.who === 1 ? '🔴' : '🟡');
        sfx.win();
      } else if (w.who === HUMAN) {
        msgEl.textContent = '🎉 ' + (fa ? 'بردی!' : 'You win!');
        sfx.win();
      } else {
        msgEl.textContent = '😈 ' + (fa ? 'هوش مصنوعی برد!' : 'AI wins!');
        sfx.lose();
      }
    }
    hud();
    if (mode !== 'p2') api.submitScore(score[HUMAN]);
    setTimeout(() => { if (lock) resetBoard(); }, 2000);
  }
  function validCols(g) {
    const o = [];
    for (let c = 0; c < COLS; c++) if (!g[0][c]) o.push(c);
    return o;
  }
  function aiMove() {
    const cols = validCols(grid);
    if (mode === 'easy' || Math.random() < 0.15) return cols[(Math.random() * cols.length) | 0];
    // برد فوری یا دفاع فوری
    for (const me of [AI, HUMAN]) {
      for (const c of cols) {
        const g2 = grid.map((r) => r.slice());
        for (let r = ROWS - 1; r >= 0; r--) {
          if (!g2[r][c]) { g2[r][c] = me; break; }
        }
        const w = checkWin(g2);
        if (w && w.who === me) return c;
      }
    }
    // مینی‌مکس عمق ۴
    let best = -1e9, bc = cols[0];
    const order = cols.slice().sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
    for (const c of order) {
      const g2 = grid.map((r) => r.slice());
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!g2[r][c]) { g2[r][c] = AI; break; }
      }
      const v = minimax(g2, 4, -1e9, 1e9, false);
      if (v > best) { best = v; bc = c; }
    }
    return bc;
  }
  function scoreWindow(win, me) {
    const opp = me === AI ? HUMAN : AI;
    const mine = win.filter((v) => v === me).length;
    const op = win.filter((v) => v === opp).length;
    const empty = win.filter((v) => !v).length;
    if (mine === 4) return 100000;
    if (mine === 3 && empty === 1) return 120;
    if (mine === 2 && empty === 2) return 12;
    if (op === 3 && empty === 1) return -150;
    if (op === 4) return -100000;
    return 0;
  }
  function evalBoard(g) {
    let s = 0;
    for (let c = 0; c < COLS; c++) {
      let center = 0;
      for (let r = 0; r < ROWS; r++) if (g[r][3] === AI) center++;
      s += center * 6;
      break;
    }
    const wins = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) wins.push([g[r][c], g[r][c + 1], g[r][c + 2], g[r][c + 3]]);
    for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c < COLS; c++) wins.push([g[r][c], g[r + 1][c], g[r + 2][c], g[r + 3][c]]);
    for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c <= COLS - 4; c++) wins.push([g[r][c], g[r + 1][c + 1], g[r + 2][c + 2], g[r + 3][c + 3]]);
    for (let r = 3; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) wins.push([g[r][c], g[r - 1][c + 1], g[r - 2][c + 2], g[r - 3][c + 3]]);
    for (const w of wins) s += scoreWindow(w, AI);
    return s;
  }
  function minimax(g, depth, alpha, beta, isMax) {
    const w = checkWin(g);
    if (w) {
      if (w.who === AI) return 1000000 + depth;
      if (w.who === HUMAN) return -1000000 - depth;
      return 0;
    }
    if (!depth) return evalBoard(g);
    const cols = validCols(g).sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
    if (isMax) {
      let best = -1e9;
      for (const c of cols) {
        const g2 = g.map((r) => r.slice());
        for (let r = ROWS - 1; r >= 0; r--) {
          if (!g2[r][c]) { g2[r][c] = AI; break; }
        }
        best = Math.max(best, minimax(g2, depth - 1, alpha, beta, false));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = 1e9;
    for (const c of cols) {
      const g2 = g.map((r) => r.slice());
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!g2[r][c]) { g2[r][c] = HUMAN; break; }
      }
      best = Math.min(best, minimax(g2, depth - 1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  boardEl.addEventListener('click', (e) => {
    const col = e.target.closest('[data-c]');
    if (col) play(Number(col.dataset.c));
  });
  wrap.querySelector('[data-seg]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    mode = b.dataset.m;
    wrap.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('is-on', x === b));
    sfx.click();
    resetAll();
  });
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); resetAll(); });
  resetAll();
  return function destroy() {
    if (mode !== 'p2' && score[HUMAN] > 0) api.submitScore(score[HUMAN]);
    style.remove();
    wrap.remove();
  };
}
