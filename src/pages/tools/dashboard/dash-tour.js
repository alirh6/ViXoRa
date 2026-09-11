// 🎬 ViXoRa Onboarding Tour — تور آشنایی قدم‌به‌قدم
// src/pages/tools/dashboard/dash-tour.js
import { esc, faDigits, setTourDone } from './dash-state.js';

export const TOUR_STEPS = [
  {
    sel: '[data-tour="header"]', title: '👋 به کاکپیت خوش آمدی!',
    body: 'اینجا اتاق فرمان همه ابزارهای ViXoRaست. بذار ۶۰ ثانیه‌ای نشونت بدم چه خبره!',
  },
  {
    sel: '[data-tour="views"]', title: '🧭 ۱۷ نما',
    body: 'کاکپیت، راهنما (۳۴ فصل!)، گزارش (هفته/ماه/سال)، اعلان‌ها، ژورنال، تمرکز، تقویم، عادت‌ها، ریموت موزیک، تحلیل، تم، خروجی، خودکارها، بینش‌ها، دستاوردها، اهداف و تنظیمات. یک شهر کامل! 🏙',
  },
  {
    sel: '[data-tour="cmdk"]', title: '⌨️ فرمان‌یاب',
    body: 'مهم‌ترین دکمه! یا Ctrl+K را بزن. ناوبری، پخش موزیک، محاسبه، ثبت سریع — همه اینجاست. امتحانش کن!',
  },
  {
    sel: '[data-widget="search"]', title: '🔎 جستجوی سراسری',
    body: 'در هر ۶ ابزار هم‌زمان جستجو کن: آهنگ، مشتری، یادداشت، تراکنش… فقط ۲ حرف کافی است.',
  },
  {
    sel: '.dash-widget', title: '🧩 ویجت‌ها',
    body: 'هر کارت یک ویجت زنده است: دستگیره ⋮⋮ برای جابه‌جایی، ◧ برای اندازه، ⛶ برای تمام‌صفحه، ✕ برای مخفی کردن.',
  },
  {
    sel: '[data-tour="gallery"]', title: '➕ گالری ویجت‌ها',
    body: '۱۹۰+ ویجت داریم! از اینجا هر کدام را می‌خواهی روشن کن: پومودورو، عادت‌ها، ماشین‌حساب، تقویم قبوض و…',
  },
  {
    sel: '[data-widget="music-now"]', title: '🎧 کنترل موزیک',
    body: 'بدون باز کردن صفحه موزیک، از اینجا پخش کن، بعدی بزن و صدا را کم و زیاد کن.',
    optional: true,
  },
  {
    sel: '[data-tour="views"]', title: '📖 راهنما و 📰 گزارش',
    body: 'نمای راهنما را حتماً ببین (۴۳ فصل کامل!). نمای گزارش هم کارنامه هفته/ماه/سال را می‌دهد.',
  },
  {
    sel: '[data-widget="backup"]', title: '🛟 بکاپ بگیر!',
    body: 'آخرین قدم: هفته‌ای یک‌بار از اینجا بکاپ کامل بگیر. ۱۰ ثانیه طول می‌کشد ولی خیالت راحت است.',
    optional: true,
  },
  {
    sel: '[data-widget="quick"]', title: '⚡ اقدامات سریع',
    body: '۱۲ دکمه برای کارهای پرتکرار: ثبت تراکنش، یادداشت، بازی تصادفی، پخش موزیک و…',
    optional: true,
  },
  {
    sel: '[data-widget="pomodoro"]', title: '🍅 تمرکز کن!',
    body: 'تکنیک پومودورو: ۲۵ دقیقه کار عمیق، ۵ دقیقه استراحت. تایمر حتی با بستن صفحه ادامه می‌دهد!',
    optional: true,
  },
  {
    sel: '[data-widget="health"]', title: '💊 سلامت ابزارها',
    body: 'این رادار نشان می‌دهد در کدام ابزار فعالی و کدام را فراموش کردی. امتیاز کلی را بالا نگه دار!',
    optional: true,
  },
  {
    sel: '[data-v="notify"]', title: '🔔 مرکز اعلان‌ها',
    body: 'قبض‌های نزدیک، بدهی‌ها، تحقق اهداف و یادآور بکاپ — همه اینجا جمع می‌شوند. زنگوله هدر تعدادشان را نشان می‌دهد.',
    optional: true,
  },
  {
    sel: '[data-v="journal"]', title: '📓 ژورنال روزانه',
    body: 'هر روز ۳ دقیقه: حال، انرژی، شکرگزاری و برد. بعد از یک ماه، الگوهای زندگیت را می‌بینی!',
    optional: true,
  },
  {
    sel: '[data-v="focus"]', title: '🧘 اتاق تمرکز',
    body: 'پومودورو + کار جاری + صدای باران. وارد که شدی یعنی وقت دیپ‌ورک است!',
    optional: true,
  },
  {
    sel: '[data-v="calendar"]', title: '📅 تقویم یکپارچه',
    body: 'قبض، بدهی، تراکنش، یادداشت و ژورنال روی یک تقویم. گذشته‌ات را مرور و آینده‌ات را پیش‌بینی کن.',
    optional: true,
  },
  {
    sel: '[data-v="themes"]', title: '🎨 تم خودت را بساز',
    body: '۱۰ تم آماده + سازنده تم سفارشی + حالت خودکار شب/روز. کاکپیت را به رنگ خودت کن!',
    optional: true,
  },
  {
    sel: '[data-v="goals"]', title: '🎯 هاب اهداف',
    body: 'اهداف هفتگی، مالی و مأموریت‌های ماه — هر شب ۳۰ ثانیه ＋ بزن و آخر ماه جشن بگیر!',
    optional: true,
  },
  {
    sel: '[data-v="achieve"]', title: '🏆 دستاوردها',
    body: '۲۸ مدال در ۴ خانواده. هر ورود بررسی می‌شود — برو و همه را جمع کن!',
    optional: true,
  },
  {
    sel: '[data-v="review"]', title: '🌙 مرور شبانه',
    body: '۵ قدم تا بستن کامل روز: پول، عادت، ژورنال، فردا، خواب. ۳۰ شب = زندگی جدید!',
    optional: true,
  },
  {
    sel: '[data-v="insights"]', title: '🧠 بینش‌های هوشمند',
    body: '۱۶ تحلیل خودکار از داده‌ات: وضعیت هفته، قبض‌ها، زنجیره‌ها، خواب و… هر شنبه بخوان!',
    optional: true,
  },
  {
    sel: '[data-v="changelog"]', title: '✨ تازه‌ها',
    body: 'هر نسخه چه چیزی اضافه شد؟ اینجا بخوان و از قابلیت‌های جدید جا نمان!',
    optional: true,
  },
  {
    sel: '[data-tour="header"]', title: '🎉 تمام شد!',
    body: 'حالا برو و کاکپیت را مال خودت کن. هر وقت کمک خواستی، ؟ را بزن یا فرمان‌یاب را باز کن. موفق باشی! 🚀',
  },
];

export function tourProgress() {
  return { step: tourIdx + 1, total: TOUR_STEPS.length };
}

let tourIdx = 0;
let tourActive = false;

export function isTourActive() { return tourActive; }

export function startTour(root, api) {
  tourIdx = 0;
  tourActive = true;
  showStep(root, api);
}

export function stopTour(root) {
  tourActive = false;
  root.querySelector('[data-tour-overlay]')?.remove();
  root.querySelectorAll('.dash-tour-hl').forEach((el) => el.classList.remove('dash-tour-hl'));
  setTourDone();
}

function showStep(root, api) {
  root.querySelector('[data-tour-overlay]')?.remove();
  root.querySelectorAll('.dash-tour-hl').forEach((el) => el.classList.remove('dash-tour-hl'));
  if (tourIdx >= TOUR_STEPS.length) { stopTour(root); api.toast('🎉 تور تمام شد!'); return; }
  const step = TOUR_STEPS[tourIdx];
  let target = root.querySelector(step.sel);
  if (!target && step.optional) { tourIdx++; showStep(root, api); return; }
  if (!target) target = root.querySelector('[data-tour="header"]') || root;
  target.classList.add('dash-tour-hl');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const r = target.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.setAttribute('data-tour-overlay', '1');
  const isMobile = window.innerWidth < 700;
  overlay.innerHTML = `<div class="dash-tour-mask"></div>
    <div class="dash-tour-card ${isMobile ? 'is-mobile' : ''}" style="${isMobile ? '' : `top:${Math.min(window.innerHeight - 260, Math.max(10, r.bottom + 12))}px;left:${Math.max(10, Math.min(window.innerWidth - 340, r.left))}px;`}">
      <div class="dash-tour-progress">${faDigits(String(tourIdx + 1))} از ${faDigits(String(TOUR_STEPS.length))}</div>
      <h4>${esc(step.title)}</h4>
      <p>${esc(step.body)}</p>
      <div class="dash-row">
        ${tourIdx > 0 ? '<button class="dash-btn dash-btn-sm" data-action="tour-prev">→ قبلی</button>' : ''}
        <button class="dash-btn dash-btn-sm dash-btn-primary" data-action="tour-next">${tourIdx === TOUR_STEPS.length - 1 ? '🎉 پایان' : 'بعدی ←'}</button>
        <button class="dash-btn dash-btn-sm" data-action="tour-skip">رد کردن ✕</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

export function handleTourAction(action, root, api) {
  if (action === 'tour-next') { tourIdx++; showStep(root, api); return true; }
  if (action === 'tour-prev') { tourIdx = Math.max(0, tourIdx - 1); showStep(root, api); return true; }
  if (action === 'tour-skip') { stopTour(root); return true; }
  return false;
}
