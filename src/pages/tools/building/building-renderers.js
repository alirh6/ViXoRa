// src/pages/tools/building/building-renderers.js

/**
 * ساختمون‌یار — رندرها (بخش ۱) 🎨
 * آنبوردینگ + پوسته + نما + تابلو اعلانات
 */

import { escapeHtml } from '../../../utilities/dom-utils.js';
import {
  faNum,
  fmtMoney,
  faDate,
  faDateTime,
  relTime,
  slotLabel,
  shortSlot,
  parseSlot,
  POST_KINDS,
  EXPENSE_CATS,
} from './building-store.js';
import { renderFacadeSVG, resolveFacadeMode } from './building-facade.js';

/* ================================================================== */
/* اجزای مشترک                                                              */
/* ================================================================== */

export function avatarHtml(name, src, cls = '') {
  const n = String(name || '؟').trim();
  if (src) return `<span class="bld-avatar ${cls}"><img src="${src}" alt="${escapeHtml(n)}" loading="lazy"></span>`;
  let h = 0;
  for (const ch of n) h = (h * 31 + ch.codePointAt(0)) % 360;
  const initial = n.replace(/^(آقای|خانم)\s+/, '').trim().charAt(0) || '؟';
  return `<span class="bld-avatar ${cls}" style="--ah:${h}">${escapeHtml(initial)}</span>`;
}

export function emptyBox(icon, title, desc = '', action = '') {
  return `<div class="bld-empty"><div class="bld-empty-ico">${icon}</div><h3>${escapeHtml(title)}</h3>${desc ? `<p>${escapeHtml(desc)}</p>` : ''}${action || ''}</div>`;
}

export function sectionHead(title, sub = '', actions = '') {
  return `<div class="bld-sec-head"><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><div class="bld-sec-actions">${actions}</div></div>`;
}

export function btn(action, label, cls = '', extra = '') {
  return `<button type="button" class="bld-btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
}

export function chipBtn(action, label, active = false, extra = '') {
  return `<button type="button" class="bld-chip${active ? ' is-active' : ''}" data-action="${action}" ${extra}>${label}</button>`;
}

export function badgeDot(count) {
  if (!count) return '';
  return `<span class="bld-dot">${count > 9 ? '۹+' : faNum(count)}</span>`;
}

export function dueChip(dueDate) {
  if (!dueDate) return '';
  const diff = Number(dueDate) - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `<span class="bld-due is-over">⚠️ ${faNum(Math.abs(days))} روز معوقه</span>`;
  if (days === 0) return `<span class="bld-due is-today">⏰ امروز آخرین مهلت</span>`;
  return `<span class="bld-due">⏳ ${faNum(days)} روز مانده</span>`;
}

export function progressBar(pct, cls = '') {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return `<span class="bld-progress"><i class="${cls}" style="width:${p}%"></i></span>`;
}

export function donut(pct, size = 120, label = '', sub = '') {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const r = 44;
  const c = 2 * Math.PI * r;
  const off = c - (c * p) / 100;
  return `<span class="bld-donut" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="${r}" class="bld-donut-bg"/><circle cx="55" cy="55" r="${r}" class="bld-donut-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg>
    <span class="bld-donut-c"><b>${label || faNum(p) + '٪'}</b>${sub ? `<small>${sub}</small>` : ''}</span>
  </span>`;
}

export function nl2br(s) {
  return escapeHtml(s || '').replace(/\n/g, '<br>');
}

/* ================================================================== */
/* آنبوردینگ                                                                */
/* ================================================================== */

export function renderOnboarding({ user, myList, joinBuilding, unitsBySlot, pickedSlot, totalSlots }) {
  const name = String(user?.name || user?.username || 'دوست').split(' ')[0];
  let h = `<div class="bld-onb">
    <div class="bld-hero">
      <div class="bld-hero-txt">
        <p class="bld-hero-hi">سلام ${escapeHtml(name)}! 👋</p>
        <h2>ساختمون‌تو دیجیتالی کن 🏢✨</h2>
        <p>شارژ، هزینه‌ها، گفتگو، نظرسنجی، تعمیرات، شکایت، پیشنهاد… همه‌چیز ساختمان <b>یک‌جا</b>، برای مدیر و همه واحدها.</p>
        <div class="bld-hero-feats">
          <span>🧾 تقسیم خودکار هزینه</span><span>💬 چت گروهی و خصوصی</span><span>🗳 رأی‌گیری زنده</span><span>🏠 نمای تعاملی</span><span>📊 گزارش مالی</span>
        </div>
      </div>
      <div class="bld-hero-art" aria-hidden="true">
        <div class="bld-hero-bld"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="bld-hero-moon"></div><div class="bld-hero-cloud a"></div><div class="bld-hero-cloud b"></div>
      </div>
    </div>
    <div class="bld-onb-grid">
      <button type="button" class="bld-onb-card" data-action="new-building"><span class="bld-onb-ico">👑</span><b>من مدیرم، ساختمان بساز</b><small>ساختمان جدید + دریافت کد دعوت ۶ حرفی</small><span class="bld-onb-go">شروع →</span></button>
      <button type="button" class="bld-onb-card" data-action="join-code"><span class="bld-onb-ico">🔑</span><b>من ساکنم، با کد وارد شو</b><small>کد را از مدیر بگیر، طبقه و واحدت را انتخاب کن</small><span class="bld-onb-go">ورود →</span></button>
      <button type="button" class="bld-onb-card is-demo" data-action="seed-demo"><span class="bld-onb-ico">🤩</span><b>تماشای دموی زنده</b><small>برج سپیدار با ۸ واحد، شارژ، چت و نظرسنجی واقعی</small><span class="bld-onb-go">بزن بریم →</span></button>
      <button type="button" class="bld-onb-card" data-action="restore-building"><span class="bld-onb-ico">📥</span><b>بازیابی ساختمان</b><small>با دستگاه جدید اومدی؟ بسته ساختمان را وارد کن</small><span class="bld-onb-go">بازیابی →</span></button>
    </div>`;

  if (joinBuilding) {
    h += renderJoinPicker({ building: joinBuilding, unitsBySlot, pickedSlot, totalSlots });
  }

  if (myList?.length) {
    h += `<h3 class="bld-my-title">ساختمان‌های من (${faNum(myList.length)})</h3><div class="bld-my-grid">`;
    for (const { building: b, isManager, myUnit, unitsCount } of myList) {
      const total = b.floors * b.unitsPerFloor;
      h += `<div class="bld-my-card">
        ${b.cover ? `<img class="bld-my-cover" src="${b.cover}" alt="" loading="lazy">` : `<div class="bld-my-cover is-fallback">🏢</div>`}
        <div class="bld-my-body">
          <div class="bld-my-top"><b>${escapeHtml(b.name)}</b>${b.demo ? '<span class="bld-tag is-demo">دمو</span>' : ''}</div>
          <small>${isManager ? '👑 مدیر ساختمان' : `🏠 واحد ${myUnit ? shortSlot(myUnit.slotKey) : ''}`} · کد: <b dir="ltr">${escapeHtml(b.code)}</b></small>
          <div class="bld-my-meta"><span>🧍 ${faNum(unitsCount)}/${faNum(total)} واحد</span><span>🏗 ${faNum(b.floors)} طبقه</span></div>
          ${progressBar((unitsCount / Math.max(1, total)) * 100)}
          <div class="bld-my-actions">
            ${btn('open-building', 'ورود 🚀', 'is-primary', `data-id="${b.id}"`)}
            ${btn('copy-code', 'کپی کد 📋', '', `data-code="${escapeHtml(b.code)}"`)}
            ${isManager ? btn('delete-building', '🗑', 'is-danger is-icon', `data-id="${b.id}" title="حذف ساختمان"`) : ''}
          </div>
        </div>
      </div>`;
    }
    h += `</div>`;
  }

  h += `</div>`;
  return h;
}

function renderJoinPicker({ building, unitsBySlot, pickedSlot }) {
  let h = `<div class="bld-join" id="bldJoin">
    <div class="bld-join-head"><h3>🔑 عضویت در «${escapeHtml(building.name)}»</h3>
    <p>طبقه و واحد خودت را انتخاب کن — واحدهای پرشده قفل‌اند 🔒</p></div>
    <div class="bld-slot-grid">`;
  for (let f = building.floors; f >= 1; f--) {
    h += `<div class="bld-slot-row"><span class="bld-slot-floor">طبقه ${faNum(f)}</span><div class="bld-slot-cells">`;
    for (let n = 1; n <= building.unitsPerFloor; n++) {
      const key = `${f}-${n}`;
      const u = unitsBySlot[key];
      if (u) {
        h += `<button type="button" class="bld-slot is-full" disabled title="${escapeHtml(u.headName)}">🔒<small>${escapeHtml((u.family || u.headName).split(' ')[0])}</small></button>`;
      } else {
        h += `<button type="button" class="bld-slot${pickedSlot === key ? ' is-picked' : ''}" data-action="pick-slot" data-slot="${key}"><b>${faNum(n)}</b><small>واحد ${faNum(n)}</small></button>`;
      }
    }
    h += `</div></div>`;
  }
  h += `</div>
    <div class="bld-join-foot">
      ${pickedSlot ? `<span class="bld-picked">✅ انتخاب: <b>${slotLabel(pickedSlot)}</b></span>` : '<span class="bld-f-hint">هنوز واحدی انتخاب نشده</span>'}
      <div class="bld-join-btns">${btn('cancel-join', 'انصراف', '')}${btn('confirm-join', 'ادامه و تکمیل مشخصات ←', 'is-primary', pickedSlot ? '' : 'disabled')}</div>
    </div></div>`;
  return h;
}

/* ================================================================== */
/* پوسته ساختمان                                                            */
/* ================================================================== */

export function renderShell({ building, isManager, myUnit, tabs, activeTab, badges, contentHtml }) {
  const tabsHtml = tabs
    .map((t) => {
      const b = badges?.[t.id] || 0;
      return `<button type="button" class="bld-tab${t.id === activeTab ? ' is-active' : ''}" data-action="tab" data-tab="${t.id}"><span class="bld-tab-ico">${t.icon}</span><span>${t.title}</span>${badgeDot(b)}</button>`;
    })
    .join('');
  return `<div class="bld-b">
    <div class="bld-topbar">
      <button type="button" class="bld-back" data-action="back-list" title="ساختمان‌های من">→ <span>ساختمان‌ها</span></button>
      <div class="bld-id">
        ${building.cover ? `<img class="bld-id-cover" src="${building.cover}" alt="">` : '<span class="bld-id-cover is-fallback">🏢</span>'}
        <div><b>${escapeHtml(building.name)}</b>
        <small>${isManager ? '👑 مدیر' : myUnit ? `🏠 ${slotLabel(myUnit.slotKey)}` : '👁 مهمان'}
        · کد: <button type="button" class="bld-code-mini" data-action="copy-code" data-code="${escapeHtml(building.code)}" title="کپی کد">${escapeHtml(building.code)} 📋</button></small></div>
      </div>
      <div class="bld-top-spacer"></div>
    </div>
    <nav class="bld-tabs" aria-label="بخش‌ها">${tabsHtml}</nav>
    <div class="bld-content">${contentHtml}</div>
  </div>`;
}

/* ================================================================== */
/* تب نما                                                                   */
/* ================================================================== */

export function renderFacadeTab({ building, unitsBySlot, balances, mySlot, managerSlot, facadeMode, stats }) {
  const svg = renderFacadeSVG({ building, unitsBySlot, balances, mySlot, managerSlot, mode: facadeMode });
  const mode = resolveFacadeMode(facadeMode);
  return `<div class="bld-facade-wrap">
    <div class="bld-facade-bar">
      <div class="bld-stat-chips">
        <span class="bld-stat-chip">🧍 ظرفیت: <b>${faNum(stats.joined)}/${faNum(stats.totalSlots)}</b></span>
        <span class="bld-stat-chip">🏦 صندوق: <b>${fmtMoney(stats.fund.balance)}</b></span>
        <span class="bld-stat-chip">💳 مانده کل: <b>${fmtMoney(stats.remaining)}</b></span>
      </div>
      <div class="bld-seg">
        ${chipBtn('facade-mode', '✨ خودکار', facadeMode === 'auto', 'data-mode="auto"')}
        ${chipBtn('facade-mode', '☀️ روز', facadeMode === 'day', 'data-mode="day"')}
        ${chipBtn('facade-mode', '🌙 شب', facadeMode === 'night', 'data-mode="night"')}
      </div>
    </div>
    <div class="bld-facade-frame" data-night="${mode === 'night' ? '1' : '0'}">${svg}</div>
    <div class="bld-legend">
      <span><i class="bld-lg-dot" style="--c:#2dffb2"></i> تسویه</span>
      <span><i class="bld-lg-dot" style="--c:#ffcf4d"></i> بدهکار</span>
      <span><i class="bld-lg-dot" style="--c:#ff4d5e"></i> معوقه</span>
      <span>⭐ واحد شما</span><span>👑 واحد مدیر</span>
      <span class="bld-legend-hint">👆 روی هر پنجره بزن تا وارد واحد شی</span>
    </div>
  </div>`;
}

/* ================================================================== */
/* تب تابلو اعلانات                                                           */
/* ================================================================== */

export function renderFeedTab({ isManager, posts, mySlot, feedFilter, totalSlots }) {
  const filters = [
    ['all', 'همه 📋'],
    ['pinned', '📌 سنجاق‌شده'],
    ['charge', '🧾 شارژ'],
    ['expense', '💸 هزینه'],
    ['notice', '📢 اطلاعیه'],
    ['discussion', '💭 بحث'],
  ];
  let h = sectionHead(
    '📢 تابلوی اعلانات ساختمان',
    'شارژها، هزینه‌ها، اطلاعیه‌ها و بحث‌ها — جدیدترین‌ها بالا',
    isManager
      ? `<div class="bld-btn-group">
        ${btn('new-post', '🧾 شارژ', 'is-primary', 'data-kind="charge"')}
        ${btn('new-post', '💸 هزینه', '', 'data-kind="expense"')}
        ${btn('new-post', '📢 اطلاعیه', '', 'data-kind="notice"')}
        ${btn('new-post', '💭 بحث', '', 'data-kind="discussion"')}
      </div>`
      : ''
  );
  h += `<div class="bld-filters">${filters.map(([v, t]) => chipBtn('feed-filter', t, feedFilter === v, `data-f="${v}"`)).join('')}</div>`;

  const list = posts.filter((p) => {
    if (feedFilter === 'all') return true;
    if (feedFilter === 'pinned') return p.pinned;
    return p.kind === feedFilter;
  });
  if (!list.length) {
    h += emptyBox('📭', 'چیزی این‌جا نیست', 'مدیر هنوز چیزی منتشر نکرده.', isManager ? btn('new-post', '🧾 صدور اولین شارژ', 'is-primary', 'data-kind="charge"') : '');
    return h;
  }
  h += `<div class="bld-feed">`;
  for (const p of list) {
    const kind = POST_KINDS[p.kind] || POST_KINDS.notice;
    const per = p.amount > 0 ? Math.floor(p.amount / Math.max(1, totalSlots)) : 0;
    h += `<article class="bld-post is-${p.kind}${p.pinned ? ' is-pinned' : ''}">
      ${p.pinned ? '<span class="bld-pin">📌 سنجاق شده</span>' : ''}
      <div class="bld-post-head">
        <span class="bld-post-kind">${kind.icon} ${kind.label}</span>
        <span class="bld-post-time">${relTime(p.createdAt)} · ${escapeHtml(p.authorName || '')}</span>
      </div>
      <h4>${escapeHtml(p.title)}</h4>
      ${p.body ? `<p class="bld-post-body">${nl2br(p.body)}</p>` : ''}
      ${p.amount > 0 ? `<div class="bld-post-money">
        <div><small>مبلغ کل</small><b>${fmtMoney(p.amount)}</b></div>
        <div><small>سهم هر واحد (از ${faNum(totalSlots)} واحد)</small><b class="is-accent">${fmtMoney(per)}</b></div>
        <div><small>مهلت</small><div>${p.dueDate ? faDate(p.dueDate) : '—'} ${dueChip(p.dueDate)}</div></div>
      </div>` : ''}
      ${p.month ? `<div class="bld-post-month">🗓 ماه: <b>${escapeHtml(p.month)}</b></div>` : ''}
      ${p.category ? `<div class="bld-post-cat">${(EXPENSE_CATS[p.category] || {}).icon || '📦'} ${(EXPENSE_CATS[p.category] || {}).label || ''}</div>` : ''}
      ${p.receipt ? `<button type="button" class="bld-thumb" data-action="view-img" data-src="${p.receipt}" data-cap="${escapeHtml(p.title)}"><img src="${p.receipt}" alt="فیش" loading="lazy"><span>🧾 مشاهده فیش</span></button>` : ''}
      <div class="bld-post-foot">
        ${p.amount > 0 && mySlot ? btn('goto', '💳 پرداخت سهم من', 'is-primary is-sm', 'data-tab="money"') : ''}
        ${isManager ? `<span class="bld-post-admin">
          ${btn('pin-post', p.pinned ? '📌 بردار' : '📌 سنجاق', 'is-sm', `data-id="${p.id}"`)}
          ${btn('edit-post', '✏️ ویرایش', 'is-sm', `data-id="${p.id}"`)}
          ${btn('delete-post', '🗑 حذف', 'is-sm is-danger', `data-id="${p.id}"`)}
        </span>` : ''}
      </div>
    </article>`;
  }
  h += `</div>`;
  return h;
}
