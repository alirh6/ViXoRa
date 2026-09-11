// 🎹 Simon — دنباله رنگ و صدا: سرعت تصاعدی، رکورد مرحله
import { randi, pnum, sfx } from '../arcade.js';

const PADS = [
  { c: '#22c55e', f: 262 },
  { c: '#ef4444', f: 330 },
  { c: '#facc15', f: 392 },
  { c: '#3b82f6', f: 523 },
];

const css = `
.sm-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; width:100%; max-width:340px; }
.sm-pad{ aspect-ratio:1; border-radius:22px; border:0; cursor:pointer; opacity:.55; transition:.12s;
  box-shadow:inset 0 -6px 0 rgba(0,0,0,.3); touch-action:manipulation; }
.sm-pad.lit{ opacity:1; transform:scale(1.04); box-shadow:0 0 34px currentColor, inset 0 -6px 0 rgba(0,0,0,.3); }
.sm-pad:active{ transform:scale(.96); }
`;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🎼 <b data-s>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="wd-msg" data-msg style="min-height:24px;font-weight:800;color:#ffd166"></div>' +
    '<div class="ag-board" style="width:100%;max-width:380px;display:flex;justify-content:center"><div class="sm-grid" data-grid></div></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--primary" type="button" data-new>▶ ' + (fa ? 'شروع' : 'Start') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'دنباله رو ببین و تکرار کن. هر مرحله یه قدم بلندتر!' : 'Watch and repeat. Each round adds one step!') + '</div>';
  root.appendChild(wrap);

  const gridEl = wrap.querySelector('[data-grid]');
  const sEl = wrap.querySelector('[data-s]');
  const msgEl = wrap.querySelector('[data-msg]');
  PADS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sm-pad';
    b.dataset.i = i;
    b.style.background = p.c;
    b.style.color = p.c;
    gridEl.appendChild(b);
  });
  let seq, pos, accept, level, over, timers;

  function reset() {
    timers.forEach(clearTimeout); timers = [];
    seq = []; pos = 0; accept = false; level = 0; over = false;
    msgEl.textContent = '';
    hud();
    next();
  }
  function hud() { sEl.textContent = pnum(level); }
  function light(i, ms) {
    const b = gridEl.children[i];
    b.classList.add('lit');
    sfx.beep(PADS[i].f, ms / 1000);
    timers.push(setTimeout(() => b.classList.remove('lit'), ms));
  }
  function next() {
    seq.push(randi(0, 3));
    level = seq.length;
    pos = 0;
    accept = false;
    hud();
    msgEl.textContent = fa ? '👀 نگاه کن…' : '👀 Watch…';
    const speed = Math.max(220, 520 - level * 14);
    seq.forEach((s, k) => {
      timers.push(setTimeout(() => light(s, speed * 0.6), 600 + k * speed));
    });
    timers.push(setTimeout(() => {
      accept = true;
      msgEl.textContent = fa ? '👆 نوبت توئه!' : '👆 Your turn!';
    }, 600 + seq.length * speed));
  }
  function press(i) {
    if (!accept || over) return;
    sfx.unlock();
    light(i, 200);
    if (i === seq[pos]) {
      pos++;
      if (pos === seq.length) {
        accept = false;
        api.submitScore(level);
        sfx.point();
        msgEl.textContent = fa ? '✅ آفرین!' : '✅ Nice!';
        timers.push(setTimeout(next, 800));
      }
    } else {
      over = true;
      accept = false;
      const r = api.submitScore(Math.max(0, level - 1));
      sfx.lose();
      msgEl.textContent = (fa ? '❌ اشتباه! رسیدی به مرحله ' : '❌ Wrong! You reached ') + pnum(level) +
        (r.record ? ' 🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : '');
      wrap.querySelector('[data-new]').textContent = '↻ ' + (fa ? 'دوباره' : 'Again');
    }
  }
  gridEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) press(Number(b.dataset.i));
  });
  const keyMap = { 1: 0, 2: 1, 3: 2, 4: 3, q: 0, w: 1, a: 2, s: 3 };
  function onKey(e) {
    const i = keyMap[e.key.toLowerCase()];
    if (i !== undefined) press(i);
  }
  window.addEventListener('keydown', onKey);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  timers = [];
  return function destroy() {
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    style.remove();
    wrap.remove();
  };
}
