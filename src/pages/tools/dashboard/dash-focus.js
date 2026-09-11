// 🧘 ViXoRa Focus Room — اتاق تمرکز: پومودورو+تسک+حال‌وهوا+نقل‌قول
// src/pages/tools/dashboard/dash-focus.js
import { esc, load } from './dash-state.js';

const QUOTES = [
  ['تمرکز یعنی گفتن نه به صد چیز خوب.', 'استیو جابز'],
  ['تو نمی‌توانی امواج را متوقف کنی، ولی می‌توانی موج‌سواری یاد بگیری.', 'جان کابات-زین'],
  ['راز جلو افتادن، شروع کردن است.', 'مارک تواین'],
  ['ساعت‌های عمیق، کارهای عمیق می‌سازند.', 'کال نیوپورت'],
  ['هر روز ۴ ساعت تمرکز عمیق از ۸ ساعت پراکنده بهتر است.', 'قانون دیپ‌ورک'],
  ['توجه تو، باارزش‌ترین دارایی توست.', 'ناشناس'],
  ['کار مهم را اول صبح انجام بده؛ قورباغه را قورت بده!', 'برایان تریسی'],
  ['چندکارگی = هیچ‌کاری.', 'قانون فوکوس'],
];
const AMBIENT = [
  ['rain', '🌧 باران', 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_808b94521d.mp3?filename=rain-and-thunder-128.mp3'],
  ['forest', '🌲 جنگل', 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b4aadbf.mp3?filename=forest-137300.mp3'],
  ['ocean', '🌊 دریا', 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2c8a2b5c9d.mp3?filename=ocean-waves-112906.mp3'],
  ['cafe', '☕ کافه', 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_c9d771aedf.mp3?filename=cafe-ambience-110624.mp3'],
  ['fire', '🔥 آتش', 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_3f2c9d3b9d.mp3?filename=crackling-fireplace-119520.mp3'],
  ['night', '🦗 شب', 'https://cdn.pixabay.com/download/audio/2022/08/05/audio_4c2a5b3d9d.mp3?filename=crickets-at-night-113100.mp3'],
];

let ambAudio = null;
let ambCur = '';

export function stopAmbient() {
  try { ambAudio?.pause(); } catch {}
  ambAudio = null;
  ambCur = '';
  document.querySelectorAll('[data-action="f-amb"].is-on').forEach((b) => b.classList.remove('is-on'));
}
export function toggleAmbient(id) {
  if (ambCur === id && ambAudio) {
    if (ambAudio.paused) ambAudio.play().catch(() => null);
    else ambAudio.pause();
    return ambAudio.paused ? '' : id;
  }
  const a = AMBIENT.find((x) => x[0] === id);
  if (!a) return '';
  stopAmbient();
  ambAudio = new Audio(a[2]);
  ambAudio.loop = true;
  ambAudio.volume = 0.4;
  ambAudio.play().catch(() => null);
  ambCur = id;
  return id;
}

export function renderFocus(st = {}) {
  const q = QUOTES[Math.floor(Date.now() / 3600000) % QUOTES.length];
  const tasks = JSON.parse(localStorage.getItem('vixora:tasks-' + new Date().toDateString()) || '[]');
  const open = tasks.filter((t) => !t.done);
  const pomoLog = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]');
  const todayMin = pomoLog.filter((p) => new Date(p.ts).toDateString() === new Date().toDateString()).reduce((a, p) => a + (p.min || 25), 0);
  return `<div class="dash-fx-wrap">
    <div class="dash-fx-head"><b>🧘 اتاق تمرکز</b><span class="dash-chip">🍅 امروز ${todayMin} دقیقه عمیق</span></div>
    <div class="dash-fx-quote">«${q[0]}»<small>— ${q[1]}</small>
      <button class="dash-btn xs" data-action="f-quote">✨ نقل دیگر</button></div>
    <div class="dash-fx-grid">
      <div class="dash-card dash-fx-pomo"><b>🍅 پومودورو</b>
        <div class="dash-big" data-fx="clock">۲۵:۰۰</div>
        <small data-fx="mode">آماده‌ای؟ یک بازه شروع کن!</small>
        <div class="dash-row wrap" style="margin-top:8px">
          <button class="dash-btn dash-btn-primary" data-action="f-start" data-v="25">▶ ۲۵ دقیقه</button>
          <button class="dash-btn xs" data-action="f-start" data-v="50">۵۰</button>
          <button class="dash-btn xs" data-action="f-start" data-v="15">۱۵</button>
          <button class="dash-btn xs" data-action="f-break" data-v="5">☕ استراحت ۵</button>
          <button class="dash-btn xs danger" data-action="f-stop">⏹ توقف</button><button class="dash-btn xs" data-action="f-custom">✏️ دلخواه</button></div></div>
      <div class="dash-card"><b>🎯 کار جاری</b>
        ${open.length ? `<div class="dash-fx-task">▶ ${esc(open[0].text)}</div><small>${open.length - 1} کار دیگر در صف</small>` : '<div class="dash-empty">کاری نیست! از ویجت ✅ اضافه کن.</div>'}
        <div class="dash-row" style="margin-top:8px"><input class="dash-input" data-fx-task placeholder="کار بعدی… (Enter)" style="margin:0"><button class="dash-btn xs" data-action="f-task">＋</button></div></div>
      <div class="dash-card"><b>🎧 حال‌وهوای صوتی</b><small class="dash-hint">صدای پس‌زمینه برای تمرکز (نیاز به اینترنت)</small>
        <div class="dash-fx-amb">${AMBIENT.map(([v, t]) => `<button class="dash-btn xs ${ambCur === v ? 'is-on' : ''}" data-action="f-amb" data-v="${v}">${t}</button>`).join('')}
        <button class="dash-btn xs danger" data-action="f-amb-off">⏹ قطع</button></div></div>
      <div class="dash-card"><b>🕘 تاریخچه اخیر</b><div data-fx-hist>${(() => {
      try {
        const log = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').slice(-6).reverse();
        return log.length ? log.map((x) => `<div class="dash-kv"><span>🍅 ${new Date(x.ts).toLocaleDateString('fa-IR')} ${new Date(x.ts).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span><b>${x.min || 25} دقیقه</b></div>`).join('') : '<div class="dash-empty">هنوز بازه‌ای ثبت نشده.</div>';
      } catch { return ''; }
    })()}</div></div>
    <div class="dash-card"><b>📜 قوانین اتاق</b><ul class="dash-hb-rules">
        <li>📵 گوشی را سایلنت و دور بگذار.</li>
        <li>🚪 یک تب، یک کار، یک بازه.</li>
        <li>☕ استراحت = آب + کشش، نه اینستا!</li>
        <li>🏁 پایان بازه = تیک تسک + ثبت پومودورو.</li></ul></div>
    </div></div>`;
}

let fxInt = 0;
let fxLeft = 0;

export function stopFocusTimer() { clearInterval(fxInt); fxInt = 0; }

export async function handleFocusAction(action, el, api) {
  switch (action) {
    case 'f-quote': api.rerender(); return true;
    case 'f-start': case 'f-break': {
      const mins = +(el.dataset.v || 25);
      const isBreak = action === 'f-break';
      clearInterval(fxInt);
      fxLeft = mins * 60;
      const clock = api.root.querySelector('[data-fx="clock"]');
      const mode = api.root.querySelector('[data-fx="mode"]');
      const endAt = Date.now() + fxLeft * 1000;
      if (mode) mode.textContent = isBreak ? '☕ استراحت…' : '🔥 تمرکز عمیق…';
      api.toast(isBreak ? `☕ ${mins} دقیقه استراحت!` : `🔥 ${mins} دقیقه تمرکز! گوشی را بگذار کنار!`);
      fxInt = setInterval(() => {
        fxLeft = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        const c = document.querySelector('[data-fx="clock"]');
        if (c) c.textContent = `${String(Math.floor(fxLeft / 60)).padStart(2, '0')}:${String(fxLeft % 60).padStart(2, '0')}`;
        if (fxLeft <= 0) {
          clearInterval(fxInt); fxInt = 0;
          if (!isBreak) {
            const log = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]');
            log.push({ ts: Date.now(), min: mins });
            localStorage.setItem('vixora:pomo-log', JSON.stringify(log.slice(-200)));
          }
          import('./dash-notify.js').then((N) => {
            N.pushNotify('🍅', isBreak ? 'استراحت تمام شد!' : 'بازه تمرکز تمام شد! 🎉', isBreak ? 'برگرد سر کارت! 💪' : `${mins} دقیقه عمیق ثبت شد.`);
            N.showToast(isBreak ? 'برگرد سر کارت! 💪' : '🎉 بازه تمام شد!', '🍅', 5000);
          }).catch(() => null);
          try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play().catch(() => null); } catch {}
          const m2 = document.querySelector('[data-fx="mode"]');
          if (m2) m2.textContent = 'تمام شد! 🎉';
        }
      }, 1000);
      return true;
    }
    case 'f-custom': {
      const v = prompt('⏱ چند دقیقه تمرکز؟', '25');
      if (v && +v > 0 && +v <= 180) { el.dataset.v = String(+v); return handleFocusAction('f-start', el, api); }
      return true;
    }
    case 'f-stop': stopFocusTimer(); { const c = api.root.querySelector('[data-fx="clock"]'); if (c) c.textContent = '۲۵:۰۰'; } api.toast('⏹ متوقف شد.'); return true;
    case 'f-task': {
      const inp = api.root.querySelector('[data-fx-task]');
      const t = inp?.value.trim();
      if (!t) return true;
      const key = 'vixora:tasks-' + new Date().toDateString();
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push({ text: t, done: false });
      localStorage.setItem(key, JSON.stringify(arr));
      api.rerender(); return true;
    }
    case 'f-amb': {
      const id = toggleAmbient(el.dataset.v);
      api.root.querySelectorAll('[data-action="f-amb"]').forEach((b) => b.classList.toggle('is-on', b.dataset.v === id && id !== ''));
      return true;
    }
    case 'f-amb-off': stopAmbient(); api.rerender(); return true;
    default: return false;
  }
}
