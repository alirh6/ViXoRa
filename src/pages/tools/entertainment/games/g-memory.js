// 🃏 Memory — جفت‌یابی: سه اندازه، تایمر، کمترین حرکت
import { shuffle, pnum, sfx, vibrate } from '../arcade.js';

const SETS = {
  small: { pairs: 6, cols: 4, label: '۴×۳' },
  mid: { pairs: 12, cols: 6, label: '۶×۴' },
  big: { pairs: 16, cols: 8, label: '۸×۴' },
};
const EMOJI = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐙', '🦄', '🍕', '🍩', '⚽', '🚀', '🌙', '🔥', '💎', '🎧'];

const css = `
.mm-grid{ display:grid; gap:8px; width:100%; max-width:520px; }
.mm-card{ aspect-ratio:1; border-radius:14px; border:1px solid rgba(255,255,255,.1); cursor:pointer;
  background:linear-gradient(135deg,rgba(34,211,238,.15),rgba(167,139,250,.15)); font-size:30px;
  display:flex; align-items:center; justify-content:center; transition:transform .18s, background .2s;
  user-select:none; -webkit-user-select:none; touch-action:manipulation; }
.mm-card:active{ transform:scale(.93); }
.mm-card .back{ display:none; }
.mm-card.open{ background:rgba(255,255,255,.1); }
.mm-card.open .front{ display:none; }
.mm-card.open .back{ display:block; animation:mmflip .25s ease; }
@keyframes mmflip{ from{ transform:rotateY(90deg);} to{ transform:rotateY(0);} }
.mm-card.done{ background:rgba(34,211,153,.18); border-color:rgba(34,211,153,.5); cursor:default; }
.mm-card.done .front{ display:none; }
.mm-card.done .back{ display:block; }
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
    '<button type="button" data-size="small">' + (fa ? 'کوچیک' : 'Small') + '</button>' +
    '<button type="button" data-size="mid" class="is-on">' + (fa ? 'متوسط' : 'Medium') + '</button>' +
    '<button type="button" data-size="big">' + (fa ? 'بزرگ' : 'Large') + '</button></div>' +
    '<div class="ag-hud"><span class="ag-pill">👣 <b data-m>۰</b></span>' +
    '<span class="ag-pill">⏱ <b data-t>۰</b></span>' +
    '<span class="ag-pill">✅ <b data-f>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:560px"><div class="mm-grid" data-grid></div></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New') + '</button></div>';
  root.appendChild(wrap);

  const gridEl = wrap.querySelector('[data-grid]');
  const mEl = wrap.querySelector('[data-m]');
  const tEl = wrap.querySelector('[data-t]');
  const fEl = wrap.querySelector('[data-f]');
  let size = 'mid', cards, first, lock, moves, found, secs, timer, over;

  function reset() {
    clearInterval(timer);
    const { pairs, cols } = SETS[size];
    const deck = shuffle(shuffle(EMOJI).slice(0, pairs).flatMap((e) => [e, e]));
    cards = deck.map((e) => ({ e, open: false, done: false }));
    first = null; lock = false; moves = 0; found = 0; secs = 0; over = false;
    gridEl.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    gridEl.innerHTML = '';
    cards.forEach((c, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'mm-card';
      d.dataset.i = i;
      d.innerHTML = '<span class="front">✨</span><span class="back">' + c.e + '</span>';
      gridEl.appendChild(d);
    });
    timer = setInterval(() => { if (!over && (moves > 0 || secs > 0)) { secs++; tEl.textContent = pnum(secs); } }, 1000);
    hud();
  }
  function hud() {
    mEl.textContent = pnum(moves);
    tEl.textContent = pnum(secs);
    fEl.textContent = pnum(found) + '/' + pnum(cards.length / 2);
  }
  function flip(i) {
    if (lock || over) return;
    const c = cards[i];
    if (c.open || c.done) return;
    c.open = true;
    sfx.flip();
    gridEl.children[i].classList.add('open');
    if (first === null) { first = i; return; }
    moves++;
    const a = cards[first], b = c;
    if (a.e === b.e) {
      a.done = b.done = true;
      found++;
      sfx.point();
      vibrate(20);
      gridEl.children[first].classList.add('done');
      gridEl.children[i].classList.add('done');
      first = null;
      hud();
      if (found === cards.length / 2) win();
    } else {
      lock = true;
      const f0 = first;
      first = null;
      hud();
      setTimeout(() => {
        a.open = false; b.open = false;
        gridEl.children[f0].classList.remove('open');
        gridEl.children[i].classList.remove('open');
        lock = false;
      }, 650);
    }
  }
  function win() {
    over = true;
    clearInterval(timer);
    const score = Math.max(10, cards.length * 50 - moves * 3 - secs * 2);
    const r = api.submitScore(score);
    sfx.win();
    vibrate([40, 50, 40]);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🎉 ' + (fa ? 'تمومه!' : 'Done!') + '</h2>' +
      '<p>👣 ' + pnum(moves) + (fa ? ' حرکت' : ' moves') + ' · ⏱ ' + pnum(secs) + (fa ? ' ثانیه' : 's') + '</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value)) + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ دوباره' : '↻ Again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', () => { sfx.click(); ov.remove(); reset(); });
  }
  gridEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) flip(Number(b.dataset.i));
  });
  wrap.querySelector('[data-seg]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]');
    if (!b) return;
    size = b.dataset.size;
    wrap.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('is-on', x === b));
    const o = wrap.querySelector('[data-over]');
    if (o) o.remove();
    sfx.click();
    reset();
  });
  wrap.querySelector('[data-new]').addEventListener('click', () => {
    const o = wrap.querySelector('[data-over]');
    if (o) o.remove();
    sfx.click();
    reset();
  });
  reset();
  return function destroy() {
    clearInterval(timer);
    style.remove();
    wrap.remove();
  };
}
