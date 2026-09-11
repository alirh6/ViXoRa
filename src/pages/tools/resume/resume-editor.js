// ✏️ ViXoRa Resume Editor — فرم + پیش‌نمایش زنده A4
// src/pages/tools/resume/resume-editor.js
import { SECTION_DEFS, PERSONAL_DEFS, THEMES } from './resume-data.js';
import { renderResume, sampleData, estimatePages, esc } from './resume-layouts.js';
import { blankData, fileToPhoto } from './resume-store.js';

const faNum = (n) => Number(n || 0).toLocaleString('fa-IR');

function fld(label, inner, hint = '') {
  return `<div class="rs-field"><label>${label}${inner}</label>${hint ? `<small class="rs-hint">${hint}</small>` : ''}</div>`;
}
const inp = (path, v = '', ph = '') => `<input data-f="${path}" value="${esc(v)}" placeholder="${esc(ph)}" />`;
const area = (path, v = '', ph = '', rows = 3) => `<textarea data-f="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(v)}</textarea>`;

function groupHead(id, title) {
  return `<div class="rs-fgroup" id="rsf-${id}"><h4>${title}</h4>`;
}

export function renderEditorForm(tpl, d) {
  const secs = tpl.sections || [];
  let h = '';
  // سربرگ / تماس
  h += groupHead('header', '👤 مشخصات و تماس');
  h += `<div class="rs-grid2">`
    + fld('نام و نام خانوادگی *', inp('fullName', d.fullName, tpl.lang === 'fa' ? 'مثلاً: سارا محمدی' : 'e.g. Sara Mohammadi'))
    + fld('عنوان شغلی', inp('title', d.title, tpl.lang === 'fa' ? 'مثلاً: توسعه‌دهنده ارشد' : 'e.g. Senior Developer'))
    + fld('ایمیل', inp('email', d.email, 'name@example.com'))
    + fld('تلفن', inp('phone', d.phone, '0912... / +1...'))
    + fld('شهر', inp('city', d.city)) + fld('کشور', inp('country', d.country))
    + fld('لینکدین', inp('linkedin', d.linkedin, 'linkedin.com/in/...'))
    + fld('گیت‌هاب', inp('github', d.github)) + fld('وب‌سایت', inp('website', d.website)) + `</div>`;
  if (tpl.photo === 'forbidden') h += `<div class="rs-note">📵 این قالب عکس ندارد (عرف مقصد) — فیلد عکس مخفی است.</div>`;
  else {
    h += fld(`📷 عکس پرسنلی ${tpl.photo === 'required' ? '(لازم)' : '(اختیاری)'}`,
      `<div class="rs-photo-row">${d.photo ? `<img src="${d.photo}" class="rs-photo-thumb" alt="" />` : ''}<input type="file" data-fphoto accept="image/*" />${d.photo ? '<button class="rs-btn sm" data-fphoto-del>✕ حذف</button>' : ''}</div>`,
      'عکس خودکار فشرده می‌شود.');
  }
  h += `</div>`;
  // بخش‌های متنی ساده
  if (secs.includes('summary')) h += groupHead('summary', '📝 ' + (tpl.lang === 'fa' ? 'خلاصه حرفه‌ای' : 'Summary')) + fld('خلاصه (۳-۴ خط قوی)', area('summary', d.summary, 'تخصص + سال تجربه + بزرگ‌ترین دستاورد', 4)) + `</div>`;
  if (secs.includes('objective')) h += groupHead('objective', '🎯 ' + (tpl.lang === 'fa' ? 'هدف شغلی' : 'Objective')) + fld('هدف', area('objective', d.objective, 'دنبال چه نقشی و کجا هستی؟', 3)) + `</div>`;
  if (secs.includes('skills')) h += groupHead('skills', '🛠 مهارت‌ها') + fld('هر مهارت در یک خط', area('skills', (d.skills || []).join('\n'), 'React\nTypeScript\n...', 5)) + `</div>`;
  if (secs.includes('hobbies')) h += groupHead('hobbies', '🎯 علایق') + fld('علایق', inp('hobbies', d.hobbies)) + `</div>`;
  // سوابق
  if (secs.includes('exp')) {
    h += groupHead('exp', '💼 سوابق کاری');
    (d.exp || []).forEach((e, i) => {
      h += `<div class="rs-item" data-item="exp.${i}"><div class="rs-item-h"><b>#${faNum(i + 1)}</b><button class="rs-btn sm danger" data-edel="exp.${i}">🗑 حذف</button></div><div class="rs-grid2">`
        + fld('سمت', inp(`exp.${i}.t`, e.t)) + fld('شرکت', inp(`exp.${i}.c`, e.c))
        + fld('مکان', inp(`exp.${i}.l`, e.l)) + fld('شروع', inp(`exp.${i}.s`, e.s, '۱۴۰۱ / 2022'))
        + fld('پایان', inp(`exp.${i}.e`, e.e)) + fld('الان اینجا کار می‌کنم', `<label class="rs-check"><input type="checkbox" data-fcheck="exp.${i}.cur" ${e.cur ? 'checked' : ''}> شغل فعلی</label>`)
        + `</div>` + fld('دستاوردها (هر بولت یک خط، با عدد!)', area(`exp.${i}.d`, (e.d || []).join('\n'), 'فروش را ۳۰٪ رشد دادم\n...', 4)) + `</div>`;
    });
    h += `<button class="rs-btn sm" data-eadd="exp">＋ افزودن سابقه</button></div>`;
  }
  // تحصیلات
  if (secs.includes('edu')) {
    h += groupHead('edu', '🎓 تحصیلات');
    (d.edu || []).forEach((e, i) => {
      h += `<div class="rs-item" data-item="edu.${i}"><div class="rs-item-h"><b>#${faNum(i + 1)}</b><button class="rs-btn sm danger" data-edel="edu.${i}">🗑 حذف</button></div><div class="rs-grid2">`
        + fld('مدرک/رشته', inp(`edu.${i}.d`, e.d)) + fld('دانشگاه', inp(`edu.${i}.s`, e.s))
        + fld('مکان', inp(`edu.${i}.l`, e.l)) + fld('سال', inp(`edu.${i}.y`, e.y)) + `</div>`
        + fld('توضیح (معدل، پایان‌نامه...)', inp(`edu.${i}.x`, e.x)) + `</div>`;
    });
    h += `<button class="rs-btn sm" data-eadd="edu">＋ افزودن مدرک</button></div>`;
  }
  // زبان‌ها
  if (secs.includes('langs')) {
    h += groupHead('langs', '🗣 زبان‌ها');
    (d.languages || []).forEach((l, i) => {
      h += `<div class="rs-item"><div class="rs-grid2">` + fld('زبان', inp(`languages.${i}.n`, l.n)) + fld('سطح', inp(`languages.${i}.l`, l.l, 'آیلتس ۷ / B2')) + `</div><button class="rs-btn sm danger" data-edel="languages.${i}">🗑 حذف</button></div>`;
    });
    h += `<button class="rs-btn sm" data-eadd="languages">＋ افزودن زبان</button></div>`;
  }
  // مدارک
  if (secs.includes('certs')) {
    h += groupHead('certs', '📜 گواهینامه‌ها');
    (d.certs || []).forEach((c, i) => {
      h += `<div class="rs-item"><div class="rs-grid2">` + fld('عنوان', inp(`certs.${i}.n`, c.n)) + fld('مرجع', inp(`certs.${i}.o`, c.o)) + fld('سال', inp(`certs.${i}.y`, c.y)) + `</div><button class="rs-btn sm danger" data-edel="certs.${i}">🗑 حذف</button></div>`;
    });
    h += `<button class="rs-btn sm" data-eadd="certs">＋ افزودن مدرک</button></div>`;
  }
  // پروژه‌ها
  if (secs.includes('projects')) {
    h += groupHead('projects', '🚀 پروژه‌ها');
    (d.projects || []).forEach((p, i) => {
      h += `<div class="rs-item">` + fld('نام پروژه', inp(`projects.${i}.n`, p.n)) + fld('لینک', inp(`projects.${i}.l`, p.l)) + fld('توضیح', area(`projects.${i}.d`, p.d, '', 2)) + `<button class="rs-btn sm danger" data-edel="projects.${i}">🗑 حذف</button></div>`;
    });
    h += `<button class="rs-btn sm" data-eadd="projects">＋ افزودن پروژه</button></div>`;
  }
  // معرف‌ها
  if (secs.includes('refs')) {
    h += groupHead('refs', '🧑‍💼 معرف‌ها');
    (d.refs || []).forEach((r, i) => {
      h += `<div class="rs-item"><div class="rs-grid2">` + fld('نام', inp(`refs.${i}.n`, r.n)) + fld('سمت', inp(`refs.${i}.r`, r.r)) + fld('تماس', inp(`refs.${i}.c`, r.c)) + `</div><button class="rs-btn sm danger" data-edel="refs.${i}">🗑 حذف</button></div>`;
    });
    h += `<button class="rs-btn sm" data-eadd="refs">＋ افزودن معرف</button></div>`;
  }
  // مشخصات فردی
  if (secs.includes('personal') && (tpl.personal || []).length) {
    h += groupHead('personal', '🪪 مشخصات فردی') + `<div class="rs-grid2">`;
    for (const k of tpl.personal) {
      const lbl = tpl.lang === 'fa' ? PERSONAL_DEFS[k].fa : PERSONAL_DEFS[k].en;
      h += fld(lbl, inp(`personal.${k}`, (d.personal || {})[k] || ''));
    }
    h += `</div></div>`;
  }
  // تعهدنامه
  if (secs.includes('decl')) {
    h += groupHead('decl', '✍️ امضا و تاریخ') + `<div class="rs-grid2">`
      + fld('نام امضاکننده', inp('decl.name', (d.decl || {}).name)) + fld('مکان', inp('decl.place', (d.decl || {}).place)) + fld('تاریخ', inp('decl.date', (d.decl || {}).date)) + `</div>`;
    if (tpl.clause) h += `<div class="rs-note">📌 بند حقوقی این قالب: «${esc(tpl.clause)}»</div>`;
    h += `</div>`;
  }
  return h;
}

/** اعمال یک ورودی فرم روی داک */
export function applyField(data, path, value, isCheck = false) {
  const v = isCheck ? !!value : value;
  if (path === 'skills') { data.skills = String(value).split('\n').map((x) => x.trim()).filter(Boolean); return; }
  const parts = path.split('.');
  if (parts.length === 1) { data[path] = v; return; }
  if (parts[0] === 'personal' || parts[0] === 'decl') { data[parts[0]] = data[parts[0]] || {}; data[parts[0]][parts[1]] = v; return; }
  const arr = data[parts[0]];
  if (!Array.isArray(arr)) return;
  const it = arr[Number(parts[1])];
  if (!it) return;
  const key = parts[2];
  it[key] = key === 'd' ? String(value).split('\n').map((x) => x.trim()).filter(Boolean) : v;
}

const BLANKS = {
  exp: () => ({ t: '', c: '', l: '', s: '', e: '', cur: false, d: [] }),
  edu: () => ({ d: '', s: '', l: '', y: '', x: '' }),
  languages: () => ({ n: '', l: '' }),
  certs: () => ({ n: '', o: '', y: '' }),
  projects: () => ({ n: '', l: '', d: '' }),
  refs: () => ({ n: '', r: '', c: '' }),
};
export function addItem(data, key) {
  if (!BLANKS[key]) return;
  data[key] = data[key] || [];
  data[key].push(BLANKS[key]());
}
export function delItem(data, path) {
  const [arr, idx] = path.split('.');
  if (Array.isArray(data[arr])) data[arr].splice(Number(idx), 1);
}

/** نوار وضعیت: نام، متر صفحه، دکمه‌ها */
export function editorBarHtml(tpl, doc, dirty) {
  return `<div class="rs-ebar">
    <button class="rs-btn sm" data-act="back">→ بازگشت</button>
    <b class="rs-ebar-t">${tpl.icon} ${esc(doc.name || tpl.fa)}</b>
    <span class="rs-pagemeter" data-pagemeter></span>
    <span class="rs-dirty" data-dirty>${dirty ? '● ذخیره نشده' : '✓ ذخیره شده'}</span>
    <span class="rs-ebar-ops">
      <button class="rs-btn sm" data-act="sample">🪄 داده نمونه</button>
      <button class="rs-btn sm" data-act="clear">🧹 پاک کردن</button>
      <button class="rs-btn sm" data-act="switch">🎨 تغییر قالب</button>
      <button class="rs-btn sm primary" data-act="save">💾 ذخیره</button>
      <button class="rs-btn sm primary" data-act="print">🖨 چاپ / PDF</button>
    </span></div>
    <div class="rs-docname"><input data-docname value="${esc(doc.name || '')}" placeholder="نام این رزومه (مثلاً: رزومه کانادا — سارا)" maxlength="80" /></div>`;
}

export function pageMeterHtml(tpl, data) {
  const p = estimatePages(tpl, data);
  const over = p > (tpl.pageMax || 2) + 0.05;
  const fa = (n) => n.toLocaleString('fa-IR', { maximumFractionDigits: 1 });
  return `<span class="rs-pm ${over ? 'over' : 'ok'}" title="تخمین بر اساس حجم متن">📄 ≈${fa(p)} صفحه از ${faNum(tpl.pageMax || 2)} ${over ? '⚠️ زیاد شد!' : '✓'}</span>`;
}

export { blankData, fileToPhoto, sampleData };
