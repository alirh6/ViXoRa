// 🔤 حدس کلمه — وردل فارسی: ۶ حدس، صفحه‌کلید فارسی، رکورد زنجیره برد
import { choice, pnum, sfx, vibrate } from '../arcade.js';

const WORDS = ['باران', 'ستاره', 'مدرسه', 'پنجره', 'آسمان', 'کبوتر', 'پرنده', 'خوراک', 'پوشاک', 'بازار', 'میدان', 'پاییز', 'بنفشه', 'یاسمن', 'انگور', 'گیلاس', 'ماشین', 'موتور', 'شطرنج', 'صورتی', 'طلایی', 'مهندس', 'خلبان', 'سالاد', 'بستنی', 'شکلات', 'میمون', 'زرافه', 'روباه', 'قناری', 'دلفین', 'زنبور', 'خرگوش', 'سنجاب', 'دندان', 'انگشت', 'آبشار', 'جزیره', 'طوفان', 'زلزله', 'صاعقه', 'بالکن', 'دیوار', 'صندلی', 'یخچال', 'رادیو', 'دستکش', 'جوراب', 'شلوار', 'پالتو', 'روسری', 'مانتو', 'نیمکت', 'دیپلم', 'ثانیه', 'دقیقه', 'امروز', 'گذشته', 'آینده', 'یازده', 'بیدار', 'روستا', 'اداره', 'مغازه', 'سینما', 'اسکله', 'خوردن', 'دویدن', 'پریدن', 'پرواز', 'لبخند', 'فریاد', 'گفتگو', 'کوتاه', 'باریک', 'سنگین', 'تاریک', 'قدیمی', 'خوشگل', 'گورخر', 'طاووس', 'مرجان', 'فانوس', 'کبریت', 'الماس', 'یاقوت', 'فولاد', 'لوبیا'];
const ROWS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
  ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
  ['⏎', 'ظ', 'ط', 'ژ', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', '⬅'],
];
const TRIES = 6, WLEN = 5;

const css = `
.wd-grid{ display:grid; grid-template-rows:repeat(6,1fr); gap:6px; width:100%; max-width:330px; }
.wd-row{ display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }
.wd-row.shake{ animation:wdshake .4s ease; }
@keyframes wdshake{ 0%,100%{transform:none;} 25%{transform:translateX(-7px);} 75%{transform:translateX(7px);} }
.wd-cell{ aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900;
  border-radius:10px; background:rgba(255,255,255,.06); border:2px solid rgba(255,255,255,.12); color:#fff; transition:.25s; }
.wd-cell.cur{ border-color:#22d3ee; }
.wd-cell.ok{ background:#16a34a; border-color:#16a34a; animation:wdflip .4s ease; }
.wd-cell.mid{ background:#b45309; border-color:#b45309; animation:wdflip .4s ease; }
.wd-cell.no{ background:#1e293b; border-color:#1e293b; color:#64748b; animation:wdflip .4s ease; }
@keyframes wdflip{ 0%{ transform:rotateX(0);} 50%{ transform:rotateX(90deg);} 100%{ transform:rotateX(0);} }
.wd-kb{ display:flex; flex-direction:column; gap:6px; width:100%; max-width:520px; }
.wd-krow{ display:flex; gap:4px; justify-content:center; }
.wd-key{ flex:1 1 0; max-width:44px; height:52px; border-radius:9px; border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.08); color:#fff; font:inherit; font-size:17px; font-weight:800; cursor:pointer; transition:.15s; touch-action:manipulation; }
.wd-key:active{ transform:scale(.92); }
.wd-key.ok{ background:#16a34a; border-color:#16a34a; }
.wd-key.mid{ background:#b45309; border-color:#b45309; }
.wd-key.no{ background:#0f172a; color:#475569; }
.wd-key.wide{ max-width:64px; font-size:13px; }
.wd-msg{ min-height:24px; font-weight:800; font-size:14px; color:#ffd166; }
`;

function norm(s) {
  return String(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه').replace(/‌/g, '').replace(/[^آابپتثجچحخدرذزژسشصضطظعغفقکگلمنوهی]/g, '');
}

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🔥 <b data-st>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span>' +
    '<button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'کلمه جدید' : 'New word') + '</button></div>' +
    '<div class="wd-msg" data-msg></div>' +
    '<div class="wd-grid" data-grid></div>' +
    '<div class="wd-kb" data-kb></div>' +
    '<div class="ag-hint">' + (fa ? 'کلمه ۵ حرفی فارسی رو در ۶ حدس پیدا کن' : 'Guess the 5-letter word in 6 tries') + '</div>';
  root.appendChild(wrap);

  const gridEl = wrap.querySelector('[data-grid]');
  const kbEl = wrap.querySelector('[data-kb]');
  const msgEl = wrap.querySelector('[data-msg]');
  const stEl = wrap.querySelector('[data-st]');
  let answer, rows, cur, done, streak;

  try { streak = Number(localStorage.getItem('vixora:arcade:wordle-streak') || 0) || 0; } catch { streak = 0; }
  function saveStreak() { try { localStorage.setItem('vixora:arcade:wordle-streak', String(streak)); } catch { /* ignore */ } }

  function buildKb() {
    kbEl.innerHTML = '';
    ROWS.forEach((row) => {
      const r = document.createElement('div');
      r.className = 'wd-krow';
      row.forEach((k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wd-key' + (k === '⏎' || k === '⬅' ? ' wide' : '');
        b.dataset.k = k;
        b.textContent = k;
        r.appendChild(b);
      });
      kbEl.appendChild(r);
    });
  }
  function reset() {
    answer = choice(WORDS);
    rows = Array.from({ length: TRIES }, () => []);
    cur = 0; done = false;
    msgEl.textContent = '';
    gridEl.innerHTML = '';
    for (let i = 0; i < TRIES; i++) {
      const r = document.createElement('div');
      r.className = 'wd-row';
      for (let j = 0; j < WLEN; j++) {
        const c = document.createElement('div');
        c.className = 'wd-cell';
        r.appendChild(c);
      }
      gridEl.appendChild(r);
    }
    kbEl.querySelectorAll('.wd-key').forEach((k) => k.classList.remove('ok', 'mid', 'no'));
    paint();
  }
  function paint() {
    stEl.textContent = pnum(streak);
    const rowEls = gridEl.children;
    for (let i = 0; i < TRIES; i++) {
      const cells = rowEls[i].children;
      for (let j = 0; j < WLEN; j++) {
        cells[j].textContent = rows[i][j] || '';
        cells[j].classList.toggle('cur', i === cur && !done);
      }
    }
  }
  function keyState(k, st) {
    const b = kbEl.querySelector('[data-k="' + k + '"]');
    if (!b) return;
    const rank = { no: 1, mid: 2, ok: 3 };
    const curRank = b.classList.contains('ok') ? 3 : b.classList.contains('mid') ? 2 : b.classList.contains('no') ? 1 : 0;
    if ((rank[st] || 0) > curRank) {
      b.classList.remove('ok', 'mid', 'no');
      b.classList.add(st);
    }
  }
  function type(ch) {
    if (done) return;
    ch = norm(ch);
    if (!ch) return;
    if (rows[cur].length < WLEN) {
      rows[cur].push(ch);
      sfx.tick();
      paint();
    }
  }
  function back() {
    if (done) return;
    rows[cur].pop();
    sfx.click();
    paint();
  }
  function submit() {
    if (done) return;
    if (rows[cur].length < WLEN) {
      msgEl.textContent = fa ? 'کلمه باید ۵ حرف باشه!' : 'Word must be 5 letters!';
      gridEl.children[cur].classList.add('shake');
      setTimeout(() => gridEl.children[cur] && gridEl.children[cur].classList.remove('shake'), 450);
      return;
    }
    const guess = rows[cur].join('');
    if (!WORDS.includes(guess)) {
      msgEl.textContent = fa ? 'این کلمه تو لیست نیست!' : 'Not in word list!';
      sfx.click();
      gridEl.children[cur].classList.add('shake');
      setTimeout(() => gridEl.children[cur] && gridEl.children[cur].classList.remove('shake'), 450);
      return;
    }
    // ارزیابی استاندارد با حروف تکراری
    const res = Array(WLEN).fill('no');
    const counts = {};
    for (let i = 0; i < WLEN; i++) {
      if (guess[i] === answer[i]) res[i] = 'ok';
      else counts[answer[i]] = (counts[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < WLEN; i++) {
      if (res[i] !== 'ok' && counts[guess[i]] > 0) { res[i] = 'mid'; counts[guess[i]]--; }
    }
    const cells = gridEl.children[cur].children;
    res.forEach((st, i) => {
      setTimeout(() => {
        cells[i].classList.add(st);
        keyState(guess[i], st);
        sfx.flip();
      }, i * 120);
    });
    msgEl.textContent = '';
    if (guess === answer) {
      done = true;
      streak++;
      saveStreak();
      api.submitScore(streak);
      setTimeout(() => {
        sfx.win();
        vibrate([40, 50, 40]);
        msgEl.textContent = ['🎉 ' + (fa ? 'آفرین!' : 'Bravo!'), '🔥 ' + (fa ? 'زنجیره: ' : 'Streak: ') + pnum(streak)].join('  ');
        paint();
      }, WLEN * 120 + 150);
    } else if (cur === TRIES - 1) {
      done = true;
      streak = 0;
      saveStreak();
      setTimeout(() => {
        sfx.lose();
        msgEl.textContent = (fa ? 'کلمه این بود: ' : 'The word was: ') + answer;
        paint();
      }, WLEN * 120 + 150);
    } else {
      cur++;
      paint();
    }
  }
  kbEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    const k = b.dataset.k;
    if (k === '⏎') submit();
    else if (k === '⬅') back();
    else type(k);
  });
  function onKey(e) {
    if (e.key === 'Enter') submit();
    else if (e.key === 'Backspace') back();
    else if (e.key.length === 1) type(e.key);
  }
  window.addEventListener('keydown', onKey);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  buildKb();
  reset();
  return function destroy() {
    window.removeEventListener('keydown', onKey);
    style.remove();
    wrap.remove();
  };
}
