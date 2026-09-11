// 🎨 ViXoRa Resume Custom Builder — سفارشی‌ساز ۱۰۰٪ قالب
// src/pages/tools/resume/resume-custom.js
import { TEMPLATES, SECTION_DEFS, PERSONAL_DEFS, THEMES, FONTS, LAYOUTS } from './resume-data.js';
import { renderResume, sampleData, esc } from './resume-layouts.js';

export function blankDraft() {
  return {
    name: '', layout: 'classic', theme: 'navy', font: 'modern', lang: 'fa', photo: 'optional',
    pageMax: 2, pages: '۱ تا ۲ صفحه',
    sections: ['summary', 'skills', 'exp', 'edu', 'langs'],
    personal: ['dob', 'marital', 'military'],
  };
}
export function draftFromTpl(t) {
  return {
    name: (t.fa || t.name || '') + ' (سفارشی)', layout: t.layout, theme: t.theme, font: t.font,
    lang: t.lang, photo: t.photo, pageMax: t.pageMax || 2, pages: t.pages || '',
    sections: [...(t.sections || [])], personal: [...(t.personal || [])],
  };
}
export function draftToTpl(d, id) {
  return {
    id: id || ('cx-' + Date.now().toString(36)), group: 'custom', custom: true, icon: '🎨',
    name: d.name || 'Custom', fa: d.name || 'قالب سفارشی من', layout: d.layout, theme: d.theme,
    font: d.font, lang: d.lang, photo: d.photo, pageMax: d.pageMax, pages: d.pages,
    sections: [...d.sections], personal: [...d.personal],
    blurb: 'قالب ساخته‌شده توسط خودت — ۱۰۰٪ سفارشی.',
    tips: ['این قالب را خودت ساختی؛ هر وقت خواستی از «رزومه‌های من» ویرایشش کن.'],
  };
}

export function renderCustomBuilder(d) {
  const secs = Object.keys(SECTION_DEFS);
  const inSecs = new Set(d.sections);
  return `<div class="rs-cb-grid">
  <div class="rs-cb-form">
    <div class="rs-field"><label>نام قالب<input data-cb="name" value="${esc(d.name)}" placeholder="مثلاً: رزومه استارتاپی من" maxlength="60"></label></div>
    <div class="rs-field"><label>شروع از روی<select data-cb="base"><option value="">— صفحه سفید —</option>${TEMPLATES.map((t) => `<option value="${t.id}">${t.icon} ${esc(t.fa)}</option>`).join('')}</select></label></div>
    <div class="rs-field"><label>زبان و جهت<select data-cb="lang"><option value="fa" ${d.lang === 'fa' ? 'selected' : ''}>🇮🇷 فارسی (راست‌چین)</option><option value="en" ${d.lang === 'en' ? 'selected' : ''}>🇬🇧 انگلیسی (چپ‌چین)</option></select></label></div>
    <div class="rs-field"><b>🧱 لی‌اوت</b><div class="rs-pick-grid">${Object.entries(LAYOUTS).map(([k, l]) => `<button class="rs-pick ${d.layout === k ? 'on' : ''}" data-cbpick="layout" data-v="${k}" title="${esc(l.desc)}">${esc(l.name)}</button>`).join('')}</div></div>
    <div class="rs-field"><b>🎨 رنگ</b><div class="rs-dots">${Object.entries(THEMES).map(([k, t]) => `<button class="rs-dot ${d.theme === k ? 'on' : ''}" data-cbpick="theme" data-v="${k}" title="${esc(t.name)}" style="background:linear-gradient(135deg,${t.c1},${t.c2})"></button>`).join('')}</div></div>
    <div class="rs-field"><b>✍️ فونت</b><div class="rs-pick-grid">${Object.entries(FONTS).map(([k, f]) => `<button class="rs-pick ${d.font === k ? 'on' : ''}" data-cbpick="font" data-v="${k}">${esc(f.name)}</button>`).join('')}</div></div>
    <div class="rs-field"><label>📷 عکس<select data-cb="photo"><option value="optional" ${d.photo === 'optional' ? 'selected' : ''}>اختیاری</option><option value="required" ${d.photo === 'required' ? 'selected' : ''}>لازم (جای ثابت دارد)</option><option value="forbidden" ${d.photo === 'forbidden' ? 'selected' : ''}>ممنوع (مثل آمریکا)</option></select></label></div>
    <div class="rs-field"><label>📄 سقف صفحه پیشنهادی<select data-cb="pageMax">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${String(d.pageMax) === String(n) ? 'selected' : ''}>${n} صفحه</option>`).join('')}</select></label></div>
    <div class="rs-field"><b>🧩 بخش‌ها (ترتیب = ترتیب نمایش)</b><div class="rs-sec-list">
      ${d.sections.map((s, i) => `<div class="rs-sec-row"><span>${d.lang === 'fa' ? SECTION_DEFS[s].fa : SECTION_DEFS[s].en}</span><span class="rs-sec-ops"><button data-cbup="${i}" ${i === 0 ? 'disabled' : ''}>▲</button><button data-cbdown="${i}" ${i === d.sections.length - 1 ? 'disabled' : ''}>▼</button><button data-cbdel="${s}">✕</button></span></div>`).join('') || '<div class="rs-hint">بخشی انتخاب نشده!</div>'}
    </div><div class="rs-addrow"><select data-cb="addsec">${secs.filter((s) => !inSecs.has(s)).map((s) => `<option value="${s}">＋ ${d.lang === 'fa' ? SECTION_DEFS[s].fa : SECTION_DEFS[s].en}</option>`).join('') || '<option value="">— همه اضافه شدند —</option>'}</select><button class="rs-btn sm" data-cbadd>افزودن</button></div></div>
    <div class="rs-field"><b>🪪 فیلدهای مشخصات فردی</b><div class="rs-checks">${Object.keys(PERSONAL_DEFS).map((k) => `<label class="rs-check"><input type="checkbox" data-cbper="${k}" ${d.personal.includes(k) ? 'checked' : ''}> ${d.lang === 'fa' ? PERSONAL_DEFS[k].fa : PERSONAL_DEFS[k].en}</label>`).join('')}</div></div>
    <div class="rs-row"><button class="rs-btn primary" data-cbsave>💾 ذخیره قالب و شروع رزومه</button></div>
  </div>
  <div class="rs-cb-prev"><div class="rs-prev-head">👁 پیش‌نمایش زنده (با داده نمونه)</div><div class="rs-paper-scale" data-cbprev>${renderResume(draftToTpl(d, 'cb-preview'), sampleData(d.lang), {})}</div></div>
  </div>`;
}

export function refreshCustomPreview(host, d) {
  const box = host.querySelector('[data-cbprev]');
  if (box) box.innerHTML = renderResume(draftToTpl(d, 'cb-preview'), sampleData(d.lang), {});
}
