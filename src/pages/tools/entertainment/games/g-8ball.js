// 🎱 Magic 8-Ball — یه سوال بپرس، گوی جواب میده!
import { choice, sfx, vibrate } from '../arcade.js';

const ANSWERS_FA = ['قطعاً بله', 'بدون شک', 'بله، حتماً', 'نشانه‌ها خوبن', 'به احتمال زیاد', 'چشم‌انداز خوبه', 'بله', 'جواب مثبته', 'بهتره دوباره بپرسی', 'الان نمیشه گفت', 'تمرکز کن و دوباره بپرس', 'بهتره صبر کنی', 'شانست کمه', 'به نظرم نه', 'اصلاً', 'بعیده', 'جواب منفیه', 'روش حساب نکن', 'آینده روشنه', 'به قلبت گوش بده'];
const ANSWERS_EN = ['It is certain', 'Without a doubt', 'Yes definitely', 'Signs point to yes', 'Most likely', 'Outlook good', 'Yes', 'My reply is yes', 'Ask again later', 'Cannot predict now', 'Concentrate and ask again', 'Better to wait', 'My sources say no', 'Outlook not so good', 'Very doubtful', 'No', 'Doubtful', 'Do not count on it', 'The future is bright', 'Follow your heart'];

const css = `
.eb-ball{ width:min(300px,72vw); aspect-ratio:1; border-radius:50%; margin:6px auto; position:relative;
  background:radial-gradient(circle at 32% 28%,#475569,#0f172a 55%,#000);
  box-shadow:0 24px 60px rgba(0,0,0,.6), inset 0 -14px 40px rgba(0,0,0,.7);
  display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; -webkit-user-select:none; }
.eb-ball.shaking{ animation:ebshake .6s ease; }
@keyframes ebshake{ 0%,100%{transform:none;} 20%{transform:rotate(-9deg) translateY(-6px);} 40%{transform:rotate(8deg);} 60%{transform:rotate(-6deg);} 80%{transform:rotate(5deg);} }
.eb-win{ width:52%; aspect-ratio:1; border-radius:50%; background:radial-gradient(circle at 50% 40%,#1e293b,#020617);
  border:3px solid rgba(255,255,255,.15); display:flex; align-items:center; justify-content:center; text-align:center;
  color:#e0f2fe; font-weight:900; font-size:17px; line-height:1.7; padding:16px; }
.eb-win.reveal{ animation:ebreveal .5s ease; }
@keyframes ebreveal{ from{ opacity:0; transform:scale(.6);} to{ opacity:1; transform:scale(1);} }
.eb-q{ width:100%; max-width:420px; display:flex; gap:8px; }
.eb-q input{ flex:1; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:13px;
  padding:12px 14px; color:#fff; font:inherit; font-size:14px; outline:0; min-width:0; }
.eb-hist{ display:flex; flex-direction:column; gap:6px; width:100%; max-width:420px; }
.eb-hist div{ background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:11px;
  padding:8px 12px; font-size:12.5px; color:#9aa5c4; }
.eb-hist b{ color:#e0f2fe; }
`;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="eb-q"><input data-q maxlength="120" placeholder="' + (fa ? 'سوالت رو بنویس…' : 'Type your question…') + '">' +
    '<button class="ag-btn ag-btn--primary" type="button" data-ask>' + (fa ? 'بپرس' : 'Ask') + '</button></div>' +
    '<div class="eb-ball" data-ball><div class="eb-win" data-win>🎱</div></div>' +
    '<div class="ag-hint">' + (fa ? 'روی گوی بزن یا تکونش بده!' : 'Tap or shake the ball!') + '</div>' +
    '<div class="eb-hist" data-hist></div>';
  root.appendChild(wrap);

  const ball = wrap.querySelector('[data-ball]');
  const win = wrap.querySelector('[data-win]');
  const input = wrap.querySelector('[data-q]');
  const hist = wrap.querySelector('[data-hist]');
  const ANSWERS = fa ? ANSWERS_FA : ANSWERS_EN;
  let busy = false;

  function ask() {
    if (busy) return;
    busy = true;
    sfx.unlock();
    ball.classList.remove('shaking');
    void ball.offsetWidth;
    ball.classList.add('shaking');
    win.classList.remove('reveal');
    win.textContent = '…';
    sfx.hit();
    vibrate([40, 60, 40]);
    setTimeout(() => {
      const a = choice(ANSWERS);
      win.textContent = a;
      win.classList.add('reveal');
      sfx.coin();
      const q = input.value.trim();
      if (q) {
        const d = document.createElement('div');
        d.innerHTML = '❓ ' + q.replace(/</g, '&lt;') + '<br>🎱 <b>' + a + '</b>';
        hist.prepend(d);
        while (hist.children.length > 4) hist.lastChild.remove();
        input.value = '';
      }
      busy = false;
    }, 650);
  }
  ball.addEventListener('click', ask);
  wrap.querySelector('[data-ask]').addEventListener('click', ask);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(); e.stopPropagation(); });
  void api;
  return function destroy() {
    style.remove();
    wrap.remove();
  };
}
