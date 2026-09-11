// ⚡ Reflex — تست سرعت واکنش: ۵ راند، تشخیص شروع زودهنگام، رتبه
import { randi, pnum, sfx, vibrate } from '../arcade.js';

const css = `
.rx-pad{ width:100%; max-width:440px; min-height:300px; border-radius:22px; border:0; cursor:pointer;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
  font:inherit; color:#fff; font-weight:900; font-size:24px; transition:background .15s; touch-action:manipulation;
  user-select:none; -webkit-user-select:none; }
.rx-pad small{ font-size:14px; font-weight:600; opacity:.85; }
.rx-times{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
`;

function rank(ms, fa) {
  if (ms < 200) return fa ? '🚀 فراانسانی!' : '🚀 Superhuman!';
  if (ms < 250) return fa ? '⚡ حرفه‌ای!' : '⚡ Pro!';
  if (ms < 320) return fa ? '👏 عالی!' : '👏 Great!';
  if (ms < 420) return fa ? '🙂 خوبه!' : '🙂 Good!';
  return fa ? '🐌 خواب بودی؟!' : '🐌 Asleep?!';
}

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🎯 <b data-r>۰/۵</b></span>' +
    '<span class="ag-pill">⏱ <b data-a>—</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:480px;display:flex;justify-content:center"><button type="button" class="rx-pad" data-pad style="background:#3b82f6">👆<small>' + (fa ? 'برای شروع ضربه بزن' : 'Tap to start') + '</small></button></div>' +
    '<div class="rx-times" data-times></div>' +
    '<div class="ag-hint">' + (fa ? 'صبر کن سبز شه بعد بزن! زود بزنی خطاست ⛔' : 'Wait for green, then tap! Early tap = fault ⛔') + '</div>';
  root.appendChild(wrap);

  const pad = wrap.querySelector('[data-pad]');
  const rEl = wrap.querySelector('[data-r]');
  const aEl = wrap.querySelector('[data-a]');
  const timesEl = wrap.querySelector('[data-times]');
  let state, t0, waitTimer, times;

  function reset() {
    clearTimeout(waitTimer);
    state = 'idle';
    times = [];
    rEl.textContent = pnum(0) + '/' + pnum(5);
    aEl.textContent = '—';
    timesEl.innerHTML = '';
    setPad('#3b82f6', '👆', fa ? 'برای شروع ضربه بزن' : 'Tap to start');
  }
  function setPad(bg, big, small) {
    pad.style.background = bg;
    pad.innerHTML = big + '<small>' + small + '</small>';
  }
  function avg() { return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0; }
  function paintTimes() {
    timesEl.innerHTML = times.map((t) => '<span class="ag-pill">⚡ <b>' + pnum(t) + '</b>ms</span>').join('');
  }
  pad.addEventListener('click', () => {
    sfx.unlock();
    if (state === 'idle' || state === 'done') {
      if (state === 'done') { times = []; paintTimes(); }
      state = 'wait';
      rEl.textContent = pnum(times.length + 1) + '/' + pnum(5);
      setPad('#e11d48', '🟥', fa ? 'صبر کن سبز شه…' : 'Wait for green…');
      clearTimeout(waitTimer);
      waitTimer = setTimeout(() => {
        state = 'go';
        t0 = performance.now();
        setPad('#16a34a', '🟩', fa ? 'بزن!!!' : 'TAP!!!');
      }, randi(1400, 4200));
    } else if (state === 'wait') {
      clearTimeout(waitTimer);
      state = 'idle';
      sfx.hit();
      vibrate(60);
      setPad('#7c2d12', '⛔', fa ? 'زود زدی! دوباره ضربه بزن' : 'Too soon! Tap to retry');
    } else if (state === 'go') {
      const ms = Math.round(performance.now() - t0);
      times.push(ms);
      sfx.point();
      vibrate(15);
      paintTimes();
      aEl.textContent = pnum(avg()) + 'ms';
      if (times.length >= 5) {
        state = 'done';
        const a = avg();
        const score = Math.max(10, 2000 - a);
        const r = api.submitScore(score);
        sfx.win();
        setPad('#7c3aed', rank(a, fa), (fa ? 'میانگین: ' : 'Average: ') + pnum(a) + 'ms' +
          (r.record ? ' 🎉 ' + (fa ? 'رکورد!' : 'Record!') : '') + ' · ' + (fa ? 'ضربه برای بازی دوباره' : 'tap to replay'));
        rEl.textContent = pnum(5) + '/' + pnum(5);
      } else {
        state = 'idle';
        setPad('#3b82f6', '⏱ ' + pnum(ms) + 'ms', rank(ms, fa) + ' · ' + (fa ? 'ضربه برای راند بعد' : 'tap for next round'));
      }
    }
  });
  reset();
  return function destroy() {
    clearTimeout(waitTimer);
    style.remove();
    wrap.remove();
  };
}
