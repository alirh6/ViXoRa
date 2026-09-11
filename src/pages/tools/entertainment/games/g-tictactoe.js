// ⭕ Tic-Tac-Toe — دوز: دو نفره یا ضد هوش مصنوعی (۳ سطح)
import { pnum, sfx } from '../arcade.js';

const css = `
.tt-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; width:100%; max-width:330px; }
.tt-cell{ aspect-ratio:1; border-radius:18px; border:1px solid rgba(255,255,255,.1); cursor:pointer;
  background:rgba(255,255,255,.05); font-size:52px; display:flex; align-items:center; justify-content:center;
  transition:.15s; color:#fff; }
.tt-cell:disabled{ cursor:default; }
.tt-cell:not(:disabled):hover{ background:rgba(255,255,255,.1); }
.tt-cell.win{ background:rgba(34,211,153,.25); border-color:#34d399; animation:ttpop .35s ease; }
@keyframes ttpop{ 0%{ transform:scale(1);} 45%{ transform:scale(1.12);} 100%{ transform:scale(1);} }
`;

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

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
    '<button type="button" data-m="mid" class="is-on">' + (fa ? '🙂 متوسط' : '🙂 Medium') + '</button>' +
    '<button type="button" data-m="hard">' + (fa ? '😈 سخت' : '😈 Hard') + '</button></div>' +
    '<div class="ag-hud"><span class="ag-pill">❌ <b data-x>۰</b></span>' +
    '<span class="ag-pill">⭕ <b data-o>۰</b></span>' +
    '<span class="ag-pill">🤝 <b data-d>۰</b></span></div>' +
    '<div class="wd-msg" data-msg style="min-height:24px;font-weight:800;color:#ffd166"></div>' +
    '<div class="ag-board" style="width:100%;max-width:370px;display:flex;justify-content:center"><div class="tt-grid" data-grid></div></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>';
  root.appendChild(wrap);

  const gridEl = wrap.querySelector('[data-grid]');
  const msgEl = wrap.querySelector('[data-msg]');
  const xEl = wrap.querySelector('[data-x]');
  const oEl = wrap.querySelector('[data-o]');
  const dEl = wrap.querySelector('[data-d]');
  let mode = 'mid', board, turn, lock, score;

  function resetBoard() {
    board = Array(9).fill(null);
    turn = 'X';
    lock = false;
    gridEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tt-cell';
      b.dataset.i = i;
      gridEl.appendChild(b);
    }
    msgEl.textContent = mode === 'p2'
      ? (fa ? 'نوبت ❌' : "❌'s turn")
      : (fa ? 'تو ❌ هستی، شروع کن!' : "You're ❌, go!");
  }
  function resetAll() {
    score = { X: 0, O: 0, D: 0 };
    hud();
    resetBoard();
  }
  function hud() {
    xEl.textContent = pnum(score.X);
    oEl.textContent = pnum(score.O);
    dEl.textContent = pnum(score.D);
  }
  function winner(b) {
    for (const l of LINES) {
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]], line: l };
    }
    return b.every(Boolean) ? { who: 'D', line: [] } : null;
  }
  function play(i) {
    if (lock || board[i]) return;
    if (mode !== 'p2' && turn === 'O') return;
    move(i);
    const w = winner(board);
    if (w) return finish(w);
    turn = turn === 'X' ? 'O' : 'X';
    if (mode === 'p2') msgEl.textContent = fa ? 'نوبت ' + (turn === 'X' ? '❌' : '⭕') : turn + "'s turn";
    else if (turn === 'O') {
      lock = true;
      msgEl.textContent = fa ? '🤔 هوش مصنوعی…' : '🤔 AI thinking…';
      setTimeout(() => {
        if (mode === 'p2') return;
        move(aiMove());
        lock = false;
        const w2 = winner(board);
        if (w2) return finish(w2);
        turn = 'X';
        msgEl.textContent = fa ? 'نوبت توئه!' : 'Your turn!';
      }, 450);
    }
  }
  function move(i) {
    board[i] = turn;
    const c = gridEl.children[i];
    c.textContent = turn === 'X' ? '❌' : '⭕';
    c.disabled = true;
    sfx.flip();
  }
  function finish(w) {
    lock = true;
    w.line.forEach((i) => gridEl.children[i].classList.add('win'));
    if (w.who === 'D') {
      score.D++;
      msgEl.textContent = fa ? '🤝 مساوی!' : "🤝 Draw!";
      sfx.click();
    } else {
      score[w.who]++;
      const youWon = mode !== 'p2' && w.who === 'X';
      const aiWon = mode !== 'p2' && w.who === 'O';
      msgEl.textContent = mode === 'p2'
        ? (fa ? '🎉 برنده: ' : '🎉 Winner: ') + (w.who === 'X' ? '❌' : '⭕')
        : youWon ? '🎉 ' + (fa ? 'بردی!' : 'You win!') : '😈 ' + (fa ? 'هوش مصنوعی برد!' : 'AI wins!');
      if (youWon || mode === 'p2') sfx.win(); else sfx.lose();
      if (aiWon) void 0;
    }
    hud();
    if (mode !== 'p2') api.submitScore(score.X);
    setTimeout(() => { if (lock) resetBoard(); }, 1600);
  }
  function empties(b) {
    const o = [];
    for (let i = 0; i < 9; i++) if (!b[i]) o.push(i);
    return o;
  }
  function aiMove() {
    const e = empties(board);
    if (mode === 'easy' || Math.random() < (mode === 'mid' ? 0.25 : 0)) {
      return e[(Math.random() * e.length) | 0];
    }
    // برد یا دفاع
    for (const me of ['O', 'X']) {
      for (const i of e) {
        board[i] = me;
        const w = winner(board);
        board[i] = null;
        if (w && w.who === me) return i;
      }
    }
    if (mode === 'mid') {
      if (!board[4]) return 4;
      return e[(Math.random() * e.length) | 0];
    }
    // minimax سخت
    return minimaxRoot();
  }
  function minimax(b, isMax, depth) {
    const w = winner(b);
    if (w) {
      if (w.who === 'O') return 10 - depth;
      if (w.who === 'X') return depth - 10;
      return 0;
    }
    const e = empties(b);
    if (isMax) {
      let best = -99;
      for (const i of e) {
        b[i] = 'O';
        best = Math.max(best, minimax(b, false, depth + 1));
        b[i] = null;
      }
      return best;
    }
    let best = 99;
    for (const i of e) {
      b[i] = 'X';
      best = Math.min(best, minimax(b, true, depth + 1));
      b[i] = null;
    }
    return best;
  }
  function minimaxRoot() {
    let best = -99, bi = 0;
    for (const i of empties(board)) {
      board[i] = 'O';
      const v = minimax(board, false, 0);
      board[i] = null;
      if (v > best) { best = v; bi = i; }
    }
    return bi;
  }
  gridEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) play(Number(b.dataset.i));
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
    if (mode !== 'p2' && score.X > 0) api.submitScore(score.X);
    style.remove();
    wrap.remove();
  };
}
