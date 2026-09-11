// 🖨️ ViXoRa Resume Layouts — ۸ موتور لی‌اوت + رندر بخش‌ها + تخمین صفحه
// src/pages/tools/resume/resume-layouts.js
import { SECTION_DEFS, PERSONAL_DEFS, THEMES, FONTS } from './resume-data.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
export function secTitle(tpl, id) {
  const d = SECTION_DEFS[id];
  return tpl.lang === 'fa' ? d.fa : d.en;
}
function perTitle(tpl, id) {
  const d = PERSONAL_DEFS[id];
  return tpl.lang === 'fa' ? d.fa : d.en;
}
const val = (v, fb = '') => (v == null || v === '' ? fb : v);
const has = (v) => v != null && String(v).trim() !== '';
const listHas = (a) => Array.isArray(a) && a.length > 0;

/* ---------- تماس ---------- */
function contactHtml(tpl, d) {
  const items = [];
  if (has(d.email)) items.push(`✉️ ${esc(d.email)}`);
  if (has(d.phone)) items.push(`📞 <span dir="ltr">${esc(d.phone)}</span>`);
  const loc = [d.city, d.country].filter(has).map(esc).join('، ');
  if (loc) items.push(`📍 ${loc}`);
  if (has(d.linkedin)) items.push(`💼 ${esc(d.linkedin)}`);
  if (has(d.github)) items.push(`🐙 ${esc(d.github)}`);
  if (has(d.website)) items.push(`🌐 ${esc(d.website)}`);
  return items.map((x) => `<span class="rsp-ci">${x}</span>`).join('');
}

/* ---------- بخش‌ها ---------- */
function secSummary(tpl, d, ghost) {
  if (!has(d.summary)) return ghostEl('summary', tpl, ghost);
  return `<section class="rsp-sec" data-sec="summary"><h2>${secTitle(tpl, 'summary')}</h2><p>${esc(d.summary)}</p></section>`;
}
function secObjective(tpl, d, ghost) {
  if (!has(d.objective)) return ghostEl('objective', tpl, ghost);
  return `<section class="rsp-sec" data-sec="objective"><h2>${secTitle(tpl, 'objective')}</h2><p>${esc(d.objective)}</p></section>`;
}
function secSkills(tpl, d, ghost) {
  const skills = (d.skills || []).filter(has);
  if (!skills.length) return ghostEl('skills', tpl, ghost);
  return `<section class="rsp-sec" data-sec="skills"><h2>${secTitle(tpl, 'skills')}</h2><div class="rsp-chips">${skills.map((s) => `<span>${esc(s)}</span>`).join('')}</div></section>`;
}
function expItem(e, tabular) {
  const dates = [e.s, e.e].filter(has).join(' – ') || (e.cur ? (tabular ? '' : 'Present') : '');
  const where = [e.c, e.l].filter((x) => has(x)).map(esc).join(' | ');
  const bullets = (e.d || []).filter(has).map((b) => `<li>${esc(b)}</li>`).join('');
  if (tabular) {
    return `<div class="rsp-trow"><div class="rsp-tdate">${esc(dates)}${e.cur ? ' — ' + 'Present' : ''}</div><div><b>${esc(val(e.t))}</b>${where ? ` — ${where}` : ''}${bullets ? `<ul>${bullets}</ul>` : ''}</div></div>`;
  }
  return `<div class="rsp-item"><div class="rsp-item-h"><b>${esc(val(e.t))}</b><span class="rsp-date">${esc(dates)}${e.cur ? ' — Present' : ''}</span></div>${where ? `<div class="rsp-sub">${where}</div>` : ''}${bullets ? `<ul>${bullets}</ul>` : ''}</div>`;
}
function secExp(tpl, d, ghost, mode) {
  const list = (d.exp || []).filter((e) => has(e.t) || has(e.c));
  if (!list.length) return ghostEl('exp', tpl, ghost);
  const inner = mode === 'tabular' ? list.map((e) => expItem(e, true)).join('')
    : mode === 'timeline' ? `<div class="rsp-tl">${list.map((e) => `<div class="rsp-tl-item">${expItem(e)}</div>`).join('')}</div>`
    : list.map((e) => expItem(e)).join('');
  return `<section class="rsp-sec" data-sec="exp"><h2>${secTitle(tpl, 'exp')}</h2>${inner}</section>`;
}
function eduItem(e, tabular) {
  const core = `<b>${esc(val(e.d))}</b>${has(e.s) ? ` — ${esc(e.s)}` : ''}${has(e.l) ? ` | ${esc(e.l)}` : ''}${has(e.x) ? `<div class="rsp-sub">${esc(e.x)}</div>` : ''}`;
  if (tabular) return `<div class="rsp-trow"><div class="rsp-tdate">${esc(val(e.y))}</div><div>${core}</div></div>`;
  return `<div class="rsp-item"><div class="rsp-item-h">${core}<span class="rsp-date">${esc(val(e.y))}</span></div></div>`;
}
function secEdu(tpl, d, ghost, mode) {
  const list = (d.edu || []).filter((e) => has(e.d) || has(e.s));
  if (!list.length) return ghostEl('edu', tpl, ghost);
  const inner = mode === 'tabular' ? list.map((e) => eduItem(e, true)).join('')
    : mode === 'timeline' ? `<div class="rsp-tl">${list.map((e) => `<div class="rsp-tl-item">${eduItem(e)}</div>`).join('')}</div>`
    : list.map((e) => eduItem(e)).join('');
  return `<section class="rsp-sec" data-sec="edu"><h2>${secTitle(tpl, 'edu')}</h2>${inner}</section>`;
}
function secLangs(tpl, d, ghost) {
  const list = (d.languages || []).filter((l) => has(l.n));
  if (!list.length) return ghostEl('langs', tpl, ghost);
  return `<section class="rsp-sec" data-sec="langs"><h2>${secTitle(tpl, 'langs')}</h2><div class="rsp-cols">${list.map((l) => `<div><b>${esc(l.n)}</b>${has(l.l) ? ` — ${esc(l.l)}` : ''}</div>`).join('')}</div></section>`;
}
function secCerts(tpl, d, ghost) {
  const list = (d.certs || []).filter((c) => has(c.n));
  if (!list.length) return ghostEl('certs', tpl, ghost);
  return `<section class="rsp-sec" data-sec="certs"><h2>${secTitle(tpl, 'certs')}</h2>${list.map((c) => `<div class="rsp-item"><div class="rsp-item-h"><b>${esc(c.n)}</b><span class="rsp-date">${esc(val(c.y))}</span></div>${has(c.o) ? `<div class="rsp-sub">${esc(c.o)}</div>` : ''}</div>`).join('')}</section>`;
}
function secProjects(tpl, d, ghost) {
  const list = (d.projects || []).filter((p) => has(p.n));
  if (!list.length) return ghostEl('projects', tpl, ghost);
  return `<section class="rsp-sec" data-sec="projects"><h2>${secTitle(tpl, 'projects')}</h2>${list.map((p) => `<div class="rsp-item"><b>${esc(p.n)}</b>${has(p.l) ? ` — <span class="rsp-link">${esc(p.l)}</span>` : ''}${has(p.d) ? `<div class="rsp-sub">${esc(p.d)}</div>` : ''}</div>`).join('')}</section>`;
}
function secRefs(tpl, d, ghost) {
  const list = (d.refs || []).filter((r) => has(r.n));
  if (!list.length) return ghostEl('refs', tpl, ghost);
  return `<section class="rsp-sec" data-sec="refs"><h2>${secTitle(tpl, 'refs')}</h2><div class="rsp-cols">${list.map((r) => `<div><b>${esc(r.n)}</b>${has(r.r) ? `<br>${esc(r.r)}` : ''}${has(r.c) ? `<br><span class="rsp-sub">${esc(r.c)}</span>` : ''}</div>`).join('')}</div></section>`;
}
function secPersonal(tpl, d, ghost) {
  const p = d.personal || {};
  const rows = (tpl.personal || []).filter((k) => has(p[k]));
  if (!rows.length) return ghostEl('personal', tpl, ghost);
  return `<section class="rsp-sec" data-sec="personal"><h2>${secTitle(tpl, 'personal')}</h2><dl class="rsp-dl">${rows.map((k) => `<div><dt>${perTitle(tpl, k)}</dt><dd>${esc(p[k])}</dd></div>`).join('')}</dl></section>`;
}
function secHobbies(tpl, d, ghost) {
  if (!has(d.hobbies)) return ghostEl('hobbies', tpl, ghost);
  return `<section class="rsp-sec" data-sec="hobbies"><h2>${secTitle(tpl, 'hobbies')}</h2><p>${esc(d.hobbies)}</p></section>`;
}
function secDecl(tpl, d, ghost) {
  const dec = d.decl || {};
  const clause = tpl.clause || '';
  if (!has(dec.name) && !has(dec.place) && !has(dec.date) && !clause) return ghostEl('decl', tpl, ghost);
  return `<section class="rsp-sec rsp-decl" data-sec="decl"><h2>${secTitle(tpl, 'decl')}</h2>${clause ? `<p class="rsp-clause">${esc(clause)}</p>` : ''}<div class="rsp-sign"><span>${esc(val(dec.place))} ${has(dec.date) ? '، ' + esc(dec.date) : ''}</span><span class="rsp-sign-n">${esc(val(dec.name))}</span></div></section>`;
}
function ghostEl(sec, tpl, ghost) {
  if (!ghost) return '';
  return `<section class="rsp-sec rsp-ghost" data-sec="${sec}"><h2>${secTitle(tpl, sec)}</h2><p>＋ ${tpl.lang === 'fa' ? 'از فرم سمت راست اضافه کن — اینجا زنده نمایش داده می‌شود' : 'Add from the form — live preview appears here'}</p></section>`;
}

const RENDERERS = {
  summary: secSummary, objective: secObjective, skills: secSkills, exp: secExp, edu: secEdu,
  langs: secLangs, certs: secCerts, projects: secProjects, refs: secRefs,
  personal: secPersonal, hobbies: secHobbies, decl: secDecl,
};
function renderSec(tpl, d, sec, ghost, mode) {
  const fn = RENDERERS[sec];
  return fn ? fn(tpl, d, ghost, mode) : '';
}

/* ---------- هدرها ---------- */
function photoHtml(d, cls = '') {
  if (!has(d.photo)) return '';
  return `<img class="rsp-photo ${cls}" src="${d.photo}" alt="" />`;
}
function hdrMinimal(tpl, d) {
  return `<header class="rsp-hdr rsp-hdr-min" data-sec="header"><h1>${esc(val(d.fullName, tpl.lang === 'fa' ? 'نام و نام خانوادگی' : 'Your Name'))}</h1>${has(d.title) ? `<div class="rsp-role">${esc(d.title)}</div>` : ''}<div class="rsp-contact">${contactHtml(tpl, d)}</div></header>`;
}
function hdrClassic(tpl, d, withPhoto) {
  return `<header class="rsp-hdr rsp-hdr-classic" data-sec="header">${withPhoto ? photoHtml(d) : ''}<h1>${esc(val(d.fullName, tpl.lang === 'fa' ? 'نام و نام خانوادگی' : 'Your Name'))}</h1>${has(d.title) ? `<div class="rsp-role">${esc(d.title)}</div>` : ''}<div class="rsp-contact">${contactHtml(tpl, d)}</div></header>`;
}
function hdrBand(tpl, d) {
  return `<header class="rsp-hdr rsp-hdr-band" data-sec="header"><h1>${esc(val(d.fullName, tpl.lang === 'fa' ? 'نام و نام خانوادگی' : 'Your Name'))}</h1>${has(d.title) ? `<div class="rsp-role">${esc(d.title)}</div>` : ''}<div class="rsp-contact">${contactHtml(tpl, d)}</div></header>`;
}

/* ---------- لی‌اوت‌ها ---------- */
const SIDE_DEFAULT = ['skills', 'langs', 'certs', 'personal', 'hobbies'];
export function renderResume(tpl, data, opts = {}) {
  const d = { personal: {}, decl: {}, ...data };
  const ghost = !!opts.ghost;
  const th = THEMES[tpl.theme] || THEMES.navy;
  const fo = FONTS[tpl.font] || FONTS.modern;
  const dir = tpl.lang === 'fa' ? 'rtl' : 'ltr';
  const showPhoto = tpl.photo !== 'forbidden' && has(d.photo);
  const secs = tpl.sections || [];
  let body = '';
  const mode = tpl.layout === 'tabular' ? 'tabular' : tpl.layout === 'timeline' ? 'timeline' : '';

  if (tpl.layout === 'minimal') {
    body = hdrMinimal(tpl, d) + secs.map((s) => renderSec(tpl, d, s, ghost, '')).join('');
  } else if (tpl.layout === 'band') {
    body = hdrBand(tpl, d) + secs.map((s) => renderSec(tpl, d, s, ghost, '')).join('');
  } else if (tpl.layout === 'card') {
    body = hdrClassic(tpl, d, showPhoto) + secs.map((s) => renderSec(tpl, d, s, ghost, '')).join('');
  } else if (tpl.layout === 'tabular' || tpl.layout === 'timeline' || tpl.layout === 'academic') {
    body = hdrClassic(tpl, d, showPhoto && tpl.layout === 'tabular') + secs.map((s) => renderSec(tpl, d, s, ghost, mode)).join('');
  } else if (tpl.layout === 'sidebar') {
    const sideSecs = secs.filter((s) => SIDE_DEFAULT.includes(s));
    const mainSecs = secs.filter((s) => !SIDE_DEFAULT.includes(s));
    const firstMain = mainSecs[0];
    const restMain = mainSecs.slice(1);
    body = `<div class="rsp-cols2"><aside class="rsp-side">${showPhoto ? photoHtml(d, 'rsp-photo-side') : ''}<div class="rsp-side-contact" data-sec="header">${contactHtml(tpl, d).replaceAll('</span> <span', '</span><span').replaceAll('</span><span', '</span><span') || ''}</div>${sideSecs.map((s) => renderSec(tpl, d, s, ghost, '')).join('')}</aside>`
      + `<div class="rsp-main"><header class="rsp-hdr rsp-hdr-side" data-sec="header"><h1>${esc(val(d.fullName, tpl.lang === 'fa' ? 'نام و نام خانوادگی' : 'Your Name'))}</h1>${has(d.title) ? `<div class="rsp-role">${esc(d.title)}</div>` : ''}</header>${firstMain ? renderSec(tpl, d, firstMain, ghost, '') : ''}${restMain.map((s) => renderSec(tpl, d, s, ghost, '')).join('')}</div></div>`;
  } else {
    body = hdrClassic(tpl, d, showPhoto && tpl.layout === 'card') + secs.map((s) => renderSec(tpl, d, s, ghost, '')).join('');
  }
  return `<div class="rsp-paper rsp-${tpl.layout}" dir="${dir}" style="--r-c1:${th.c1};--r-c2:${th.c2};--r-font:${tpl.lang === 'fa' ? fo.fa : fo.en}">${body}</div>`;
}

/* ---------- تخمین تعداد صفحات ---------- */
const CAPACITY = { minimal: 3400, classic: 3500, sidebar: 3100, band: 3300, tabular: 3000, card: 3200, timeline: 2900, academic: 3900 };
export function estimatePages(tpl, data) {
  let n = 0;
  try {
    const d = data || {};
    n += (d.fullName || '').length + (d.title || '').length + (d.summary || '').length + (d.objective || '').length + (d.hobbies || '').length;
    n += (d.skills || []).join(' ').length;
    for (const e of (d.exp || [])) n += ((e.t || '') + (e.c || '') + (e.d || []).join(' ')).length + 60;
    for (const e of (d.edu || [])) n += ((e.d || '') + (e.s || '') + (e.x || '')).length + 40;
    for (const l of (d.languages || [])) n += ((l.n || '') + (l.l || '')).length + 10;
    for (const c of (d.certs || [])) n += ((c.n || '') + (c.o || '')).length + 20;
    for (const p of (d.projects || [])) n += ((p.n || '') + (p.d || '')).length + 30;
    for (const r of (d.refs || [])) n += ((r.n || '') + (r.r || '') + (r.c || '')).length + 20;
    n += Object.values(d.personal || {}).join(' ').length;
    if (d.photo && tpl.photo !== 'forbidden') n += 250;
  } catch { /* ignore */ }
  const cap = CAPACITY[tpl.layout] || 3300;
  return Math.max(0.1, n / cap);
}

/* ---------- داده نمونه ---------- */
export function sampleData(lang) {
  if (lang === 'fa') {
    return {
      photo: '', fullName: 'سارا محمدی', title: 'توسعه‌دهنده ارشد فرانت‌اند', email: 'sara.m@example.com', phone: '0912 345 6789',
      city: 'تهران', country: 'ایران', linkedin: 'linkedin.com/in/saram', website: 'saram.dev', github: 'github.com/saram',
      summary: 'توسعه‌دهنده فرانت‌اند با ۵ سال تجربه در ساخت محصول‌های مقیاس‌پذیر. متخصص React و TypeScript؛ عاشق تجربه کاربری تمیز و کد قابل‌نگهداری.',
      objective: '', skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind', 'Git', 'تست‌نویسی', 'اجایل/اسکرام'],
      languages: [{ n: 'انگلیسی', l: 'پیشرفته (آیلتس ۷)' }, { n: 'آلمانی', l: 'مقدماتی (A2)' }],
      exp: [
        { t: 'توسعه‌دهنده ارشد فرانت‌اند', c: 'دیجی‌کالا', l: 'تهران', s: '۱۴۰۱', e: '', cur: true, d: ['بازطراحی صفحه محصول با ۲ میلیون بازدید روزانه؛ نرخ تبدیل ۱۸٪ رشد کرد', 'کاهش ۴۰٪ زمان بارگذاری با کداسپلیتینگ و بهینه‌سازی باندل', 'منتورینگ ۳ توسعه‌دهنده جونیور و برگزاری کدریویو هفتگی'] },
        { t: 'توسعه‌دهنده فرانت‌اند', c: 'کافه‌بازار', l: 'تهران', s: '۱۳۹۹', e: '۱۴۰۱', cur: false, d: ['توسعه پنل توسعه‌دهندگان با React؛ ۱۲ هزار کاربر فعال', 'پیاده‌سازی دیزاین‌سیستم مشترک بین ۴ تیم'] },
      ],
      edu: [{ d: 'کارشناسی مهندسی کامپیوتر', s: 'دانشگاه تهران', l: 'تهران', y: '۱۳۹۸', x: 'معدل ۱۷٫۴ — پروژه پایانی: سیستم پیشنهادگر فیلم' }],
      certs: [{ n: 'AWS Certified Developer', o: 'Amazon', y: '۱۴۰۲' }],
      projects: [{ n: 'فارسی‌ساز تاریخ', l: 'github.com/saram/fa-date', d: 'کتابخانه اوپن‌سورس تاریخ شمسی با ۴۰۰+ استار' }],
      refs: [{ n: 'مهندس رضا کریمی', r: 'مدیر فنی، دیجی‌کالا', c: 'reza.k@example.com' }],
      personal: { dob: '۱۳۷۵/۰۳/۱۲', pob: '', nat: 'ایرانی', marital: 'مجرد', gender: '', address: 'تهران، خیابان ولیعصر', visa: '', military: 'معافیت تحصیلی', children: '' },
      hobbies: 'عکاسی خیابانی، کوهنوردی، پادکست تکنولوژی', decl: { name: '', place: '', date: '' },
    };
  }
  return {
    photo: '', fullName: 'Sara Mohammadi', title: 'Senior Frontend Developer', email: 'sara.m@example.com', phone: '+1 (416) 555-0132',
    city: 'Toronto', country: 'Canada', linkedin: 'linkedin.com/in/saram', website: 'saram.dev', github: 'github.com/saram',
    summary: 'Senior Frontend Developer with 5 years of experience building scalable products. Specialized in React and TypeScript with a passion for clean UX and maintainable code.',
    objective: 'Seeking a Senior Frontend role in Toronto where I can ship high-impact product used by millions.',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind', 'Testing', 'Agile/Scrum', 'CI/CD'],
    languages: [{ n: 'English', l: 'Fluent (IELTS 7.0)' }, { n: 'Persian', l: 'Native' }, { n: 'French', l: 'Intermediate (B1)' }],
    exp: [
      { t: 'Senior Frontend Developer', c: 'Digikala', l: 'Tehran, Iran', s: '2022', e: '', cur: true, d: ['Redesigned product page serving 2M daily visits; conversion grew 18%', 'Cut load time 40% via code-splitting and bundle optimization', 'Mentored 3 junior developers with weekly code reviews'] },
      { t: 'Frontend Developer', c: 'Cafe Bazaar', l: 'Tehran, Iran', s: '2020', e: '2022', cur: false, d: ['Built developer console in React; 12K active users', 'Implemented shared design system across 4 teams'] },
    ],
    edu: [{ d: 'B.Sc. Computer Engineering', s: 'University of Tehran', l: 'Tehran', y: '2019', x: 'GPA 3.5/4 — Thesis: movie recommender system' }],
    certs: [{ n: 'AWS Certified Developer', o: 'Amazon', y: '2023' }],
    projects: [{ n: 'fa-date', l: 'github.com/saram/fa-date', d: 'Open-source Jalali date library, 400+ stars' }],
    refs: [{ n: 'Reza Karimi', r: 'Engineering Manager, Digikala', c: 'reza.k@example.com' }, { n: 'Available on request', r: '', c: '' }],
    personal: { dob: '1996-06-02', pob: 'Tehran', nat: 'Iranian', marital: '', gender: '', address: 'Toronto, ON', visa: 'Open work permit', military: '', children: '' },
    hobbies: 'Street photography, hiking, tech podcasts', decl: { name: 'Sara Mohammadi', place: 'Toronto', date: '2026-09-09' },
  };
}
