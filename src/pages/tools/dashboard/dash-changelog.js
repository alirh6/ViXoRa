// ✨ ViXoRa Changelog — تاریخچه نسخه‌ها + «تازه‌ها»
// src/pages/tools/dashboard/dash-changelog.js
import { esc } from './dash-state.js';

export const CHANGELOG = [
  {
    v: '۲٫۰', date: 'شهریور ۱۴۰۵', title: 'شهر ویکسورا 🏙', isNew: true,
    items: [
      '🧩 ۱۹۴ ویجت در ۱۲ سری (از ۴۶ ویجت!)',
      '📖 ۴۵ فصل راهنما + ۵۵ دستورپخت + ۱۲۰ واژه + ۶۰ سؤال پرتکرار',
      '🎛 ریموت کامل موزیک (صف، EQ، خواب، سرعت، بالانس، شعر)',
      '📓 ژورنال روزانه با حال، انرژی، شکرگزاری و بینش',
      '🧘 اتاق تمرکز با پومودورو و ۶ صدای محیط',
      '📅 تقویم یکپارچه همه ابزارها + 🔥 اتاق عادت‌ها با هیت‌مپ',
      '🧠 بینش‌های هوشمند (۱۶ تحلیل خودکار) + 🌅 دایجست صبح + 🌙 مرور شبانه',
      '🏆 ۳۲ دستاورد + 🎯 هاب اهداف + 🎨 ۱۰ تم + تم سفارشی',
      '📤 مرکز خروجی (CSV/MD/vCard/ICS/M3U/JSON) + بازیابی بکاپ',
      '🤖 ۹ قانون خودکار + 🔔 مرکز اعلان + 📈 تحلیل شخصی',
      '⌨️ ۹۰+ دستور فرمان‌یاب + 🧮 ماشین‌حساب + تاریخچه',
      '📰 گزارش سالانه + 🗓 کارنامه + مقایسات دوره‌ای',
    ],
  },
  {
    v: '۱٫۵', date: 'مرداد ۱۴۰۵', title: 'کاکپیت پرو 🚀',
    items: ['۴۶ ویجت در ۳ سری', 'فرمان‌یاب با دیپ‌لینک تب‌ها', 'گزارش هفتگی/ماهانه', 'تور آشنایی', 'پروفایل چیدمان', 'اعتبار متحرک ✨'],
  },
  {
    v: '۱٫۰', date: 'تیر ۱۴۰۵', title: 'تولد کاکپیت 🛩',
    items: ['کاکپیت مرکزی ۶ ابزار', 'راهنمای ۱۲ فصلی', 'گالری ویجت‌ها', 'تم‌های پایه', 'میانبرهای صفحه‌کلید'],
  },
];

const SEEN_KEY = 'vixora:changelog-seen';

export function hasUnseen() {
  try { return localStorage.getItem(SEEN_KEY) !== CHANGELOG[0].v; } catch { return true; }
}
export function markSeen() {
  try { localStorage.setItem(SEEN_KEY, CHANGELOG[0].v); } catch {}
}

export function renderChangelog() {
  return `<div class="dash-cl-wrap">
    <div class="dash-cl-head"><b>✨ تازه‌های ViXoRa</b></div>
    ${CHANGELOG.map((c) => `
    <div class="dash-card dash-cl-card ${c.isNew ? 'new' : ''}">
      <div class="dash-cl-top"><b>نسخه ${esc(c.v)}</b><span>${esc(c.date)}</span>${c.isNew ? '<span class="dash-chip">🎉 جدید!</span>' : ''}</div>
      <div class="dash-cl-title">${esc(c.title)}</div>
      <ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>`).join('')}
    <small class="dash-hint">💜 ساخته علی — هر نسخه با عشق و بی‌خوابی!</small></div>`;
}
