// src/pages/tools/building/building-renderers2.js

/**
 * ساختمون‌یار — رندرها (بخش ۲) 🎨
 * مالی + گفتگو + خدمات + نظرسنجی + شکایت + اسناد + مدیریت + ورود به واحد
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
  structureSlots,
  POST_KINDS,
  EXPENSE_CATS,
  TICKET_CATS,
  TICKET_STATUS,
  COMPLAINT_CATS,
  COMPLAINT_STATUS,
  SUGGEST_AREAS,
  SUGGEST_STATUS,
  DOC_KINDS,
  PAY_METHODS,
} from './building-store.js';
import {
  avatarHtml,
  emptyBox,
  sectionHead,
  btn,
  chipBtn,
  badgeDot,
  dueChip,
  progressBar,
  donut,
  nl2br,
} from './building-renderers.js';

/* ================================================================== */
/* تب مالی                                                                  */
/* ================================================================== */

export function renderMoneyTab(C) {
  const { isManager, mySlot, moneyMode } = C;
  const modes = [];
  if (mySlot) modes.push(['mine', '💳 بدهی من']);
  if (isManager) {
    modes.push(['fund', '🏦 صندوق']);
    modes.push(['approvals', `✅ تأیید پرداخت‌ها${C.pendingCount ? ` (${faNum(C.pendingCount)})` : ''}`]);
    modes.push(['report', '📊 گزارش‌ها']);
  }
  let h = sectionHead(
    '💰 مدیریت مالی ساختمان',
    mySlot ? `واحد شما: ${slotLabel(mySlot)}` : 'شما واحدی در این ساختمان ندارید',
    isManager ? `${btn('new-post', '🧾 شارژ', 'is-primary is-sm', 'data-kind="charge"')}${btn('new-post', '💸 هزینه', 'is-sm', 'data-kind="expense"')}` : ''
  );
  h += `<div class="bld-filters">${modes.map(([v, t]) => chipBtn('money-mode', t, moneyMode === v, `data-m="${v}"`)).join('')}</div>`;
  if (moneyMode === 'mine' && mySlot) return h + renderMyDebts(C);
  if (moneyMode === 'fund' && isManager) return h + renderFund(C);
  if (moneyMode === 'approvals' && isManager) return h + renderApprovals(C);
  if (moneyMode === 'report' && isManager) return h + renderReportHtml(C);
  if (mySlot) return h + renderMyDebts(C);
  if (isManager) return h + renderFund(C);
  return h + emptyBox('💰', 'بخش مالی', 'برای مشاهده بدهی باید عضو یک واحد باشید.');
}

function renderMyDebts({ mySlot, myDebts, myBalance, myPayments }) {
  const b = myBalance;
  const pct = b.total > 0 ? (b.paid / b.total) * 100 : 100;
  let h = `<div class="bld-bal-hero">
    ${donut(pct, 132, b.remaining === 0 ? 'تسویه! 🎉' : fmtMoney(b.remaining), b.remaining === 0 ? '' : 'مانده بدهی')}
    <div class="bld-bal-stats">
      <div><small>جمع بدهی‌ها</small><b>${fmtMoney(b.total)}</b></div>
      <div><small>پرداخت‌شده</small><b class="is-green">${fmtMoney(b.paid)}</b></div>
      <div><small>مانده</small><b class="${b.remaining > 0 ? 'is-red' : 'is-green'}">${fmtMoney(b.remaining)}</b></div>
      ${b.overdue ? `<div><small>معوقه</small><b class="is-red">${faNum(b.overdue)} مورد ⚠️</b></div>` : ''}
    </div>
    ${b.remaining > 0 ? btn('pay-new', '💳 پرداخت بدهی', 'is-primary is-lg') : '<span class="bld-ok-tag">🎉 حساب شما تسویه است!</span>'}
  </div>`;

  h += `<h3 class="bld-my-title">📋 ریز بدهی‌ها</h3>`;
  if (!myDebts.length) h += emptyBox('🎉', 'بدهی ندارید!', 'همه حساب‌ها تسویه است.');
  else {
    h += `<div class="bld-debts">`;
    for (const d of myDebts) {
      const p = d.post || {};
      const kind = POST_KINDS[p.kind] || POST_KINDS.expense;
      h += `<div class="bld-debt${d.overdue ? ' is-over' : ''}${d.remaining === 0 ? ' is-paid' : ''}">
        <div class="bld-debt-top"><span class="bld-post-kind">${kind.icon} ${kind.label}</span>${dueChip(p.dueDate)}${d.remaining === 0 ? '<span class="bld-ok-tag">✅ تسویه</span>' : ''}</div>
        <b>${escapeHtml(p.title || '—')}</b>
        <div class="bld-debt-nums"><span>سهم: <b>${fmtMoney(d.amount)}</b></span><span>پرداخت: <b class="is-green">${fmtMoney(Math.min(d.paid, d.amount))}</b></span><span>مانده: <b class="is-red">${fmtMoney(d.remaining)}</b></span></div>
        ${progressBar(d.amount ? (Math.min(d.paid, d.amount) / d.amount) * 100 : 100)}
      </div>`;
    }
    h += `</div>`;
  }

  h += `<h3 class="bld-my-title">🧾 پرداخت‌های من</h3>`;
  if (!myPayments.length) h += `<p class="bld-f-hint">هنوز پرداختی ثبت نکرده‌اید.</p>`;
  else {
    h += `<div class="bld-pays">`;
    for (const p of myPayments) h += payRowHtml(p, false);
    h += `</div>`;
  }
  return h;
}

export function payRowHtml(p, showUnit) {
  const st = p.status === 'approved' ? ['✅ تأیید شد', 'is-ok'] : p.status === 'pending' ? ['⏳ در انتظار تأیید', 'is-warn'] : ['🚫 رد شد', 'is-bad'];
  return `<div class="bld-pay">
    <div class="bld-pay-main">
      <b>${fmtMoney(p.amount)}</b>
      <small>${showUnit ? `${shortSlot(p.slotKey)} · ` : ''}${escapeHtml(p.byName || '')} · ${PAY_METHODS[p.method] || ''} · ${relTime(p.createdAt)}</small>
      ${p.note ? `<small class="bld-pay-note">📝 ${escapeHtml(p.note)}</small>` : ''}
      ${p.decidedBy ? `<small>توسط ${escapeHtml(p.decidedBy)}</small>` : ''}
    </div>
    <span class="bld-status ${st[1]}">${st[0]}</span>
    ${p.receipt ? `<button type="button" class="bld-thumb is-sm" data-action="view-img" data-src="${p.receipt}" data-cap="فیش ${fmtMoney(p.amount)}"><img src="${p.receipt}" alt="فیش" loading="lazy"></button>` : ''}
  </div>`;
}

function renderFund({ fund, recentPayments, isManager }) {
  return `<div class="bld-fund-grid">
    <div class="bld-fund-main"><small>🏦 موجودی صندوق ساختمان</small><b class="${fund.balance >= 0 ? 'is-green' : 'is-red'}">${fmtMoney(fund.balance)}</b>
    ${progressBar(fund.income + fund.start > 0 ? ((fund.income + fund.start) / Math.max(1, fund.income + fund.start + Math.max(0, -fund.balance))) * 100 : 0)}</div>
    <div class="bld-fund-card"><small>💰 دریافتی تأییدشده</small><b class="is-green">${fmtMoney(fund.income)}</b></div>
    <div class="bld-fund-card"><small>💸 هزینه‌های انجام‌شده</small><b class="is-red">${fmtMoney(fund.outcome)}</b></div>
    <div class="bld-fund-card"><small>📥 طلب از واحدها</small><b>${fmtMoney(fund.expected)}</b></div>
    <div class="bld-fund-card"><small>🌱 موجودی اولیه ${isManager ? btn('fund-edit', '✏️', 'is-sm', '') : ''}</small><b>${fmtMoney(fund.start)}</b></div>
  </div>
  <h3 class="bld-my-title">آخرین پرداخت‌ها</h3>
  ${recentPayments.length ? `<div class="bld-pays">${recentPayments.slice(0, 6).map((p) => payRowHtml(p, true)).join('')}</div>` : '<p class="bld-f-hint">پرداختی ثبت نشده.</p>'}`;
}

function renderApprovals({ pendingPayments, historyPayments, isManager }) {
  let h = `<h3 class="bld-my-title">⏳ در انتظار تأیید (${faNum(pendingPayments.length)})</h3>`;
  if (!pendingPayments.length) h += emptyBox('✅', 'صف تأیید خالی است', 'پرداخت جدیدی برای بررسی وجود ندارد.');
  else {
    h += `<div class="bld-pays">`;
    for (const p of pendingPayments) {
      h += `<div class="bld-pay is-pending">${payRowHtml(p, true)}
        <div class="bld-pay-actions">${btn('approve-pay', '✅ تأیید', 'is-primary is-sm', `data-id="${p.id}"`)}${btn('reject-pay', '🚫 رد', 'is-sm is-danger', `data-id="${p.id}"`)}</div>
      </div>`;
    }
    h += `</div>`;
  }
  h += `<h3 class="bld-my-title">📜 تاریخچه تصمیم‌ها</h3>`;
  if (!historyPayments.length) h += `<p class="bld-f-hint">موردی نیست.</p>`;
  else {
    h += `<div class="bld-pays">`;
    for (const p of historyPayments.slice(0, 20)) {
      h += `<div class="bld-pay">${payRowHtml(p, true)}${isManager ? btn('delete-pay', '🗑', 'is-sm is-danger is-icon', `data-id="${p.id}" title="حذف پرداخت"`) : ''}</div>`;
    }
    h += `</div>`;
  }
  return h;
}

export function renderReportHtml({ building, unitsBySlot, slotBalances, payments, stats }) {
  const billed = Object.values(slotBalances).reduce((s, b) => s + b.total, 0);
  const collected = Object.values(slotBalances).reduce((s, b) => s + Math.min(b.paid, b.total), 0);
  const rate = billed ? (collected / billed) * 100 : 100;
  // ۶ ماه اخیر
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({ key, label: d.toLocaleDateString('fa-IR', { month: 'short' }), sum: 0 });
  }
  for (const p of payments) {
    if (p.status !== 'approved') continue;
    const d = new Date(p.createdAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.sum += p.amount || 0;
  }
  const maxM = Math.max(1, ...months.map((m) => m.sum));
  // بدهکاران برتر
  const debtors = Object.entries(slotBalances)
    .map(([sk, b]) => ({ sk, ...b }))
    .filter((d) => d.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 6);
  const maxD = Math.max(1, ...(debtors.map((d) => d.remaining) || [1]));

  let h = `<div class="bld-rep-top">
    ${donut(rate, 140, faNum(Math.round(rate)) + '٪', 'نرخ وصول')}
    <div class="bld-rep-cards">
      <div class="bld-fund-card"><small>🧾 کل صورتحساب صادره</small><b>${fmtMoney(billed)}</b></div>
      <div class="bld-fund-card"><small>✅ وصول‌شده</small><b class="is-green">${fmtMoney(collected)}</b></div>
      <div class="bld-fund-card"><small>⏳ مانده</small><b class="is-red">${fmtMoney(billed - collected)}</b></div>
      <div class="bld-fund-card"><small>🏦 صندوق</small><b>${fmtMoney(stats.fund.balance)}</b></div>
    </div>
  </div>
  <div class="bld-rep-grid">
    <div class="bld-rep-box"><h4>📊 وصول ۶ ماه اخیر</h4><div class="bld-bars">
      ${months.map((m) => `<div class="bld-bar-col" title="${m.label}: ${fmtMoney(m.sum)}"><span class="bld-bar-val">${m.sum ? faNum(Math.round(m.sum / 1000000)) + 'م' : ''}</span><i style="height:${Math.max(3, Math.round((m.sum / maxM) * 100))}%"></i><small>${m.label}</small></div>`).join('')}
    </div></div>
    <div class="bld-rep-box"><h4>🔴 بیشترین بدهی</h4>
      ${debtors.length ? debtors.map((d) => `<div class="bld-debtor"><span>${shortSlot(d.sk)} ${escapeHtml(unitsBySlot[d.sk]?.headName || '(خالی)')}</span>${progressBar((d.remaining / maxD) * 100)}<b>${fmtMoney(d.remaining)}</b></div>`).join('') : '<p class="bld-f-hint">🎉 بدهکاری وجود ندارد!</p>'}
    </div>
  </div>
  <div class="bld-rep-box"><h4>📋 تراز همه واحدها ${btn('export-csv', '📥 خروجی CSV', 'is-sm', '')}</h4>
    <div class="bld-table-wrap"><table class="bld-table"><thead><tr><th>واحد</th><th>ساکن</th><th>جمع بدهی</th><th>پرداخت</th><th>مانده</th><th>وضعیت</th></tr></thead><tbody>
    ${structureSlots(building).map((sk) => {
      const u = unitsBySlot[sk];
      const b = slotBalances[sk] || { total: 0, paid: 0, remaining: 0, overdue: 0 };
      return `<tr class="${b.remaining > 0 ? (b.overdue ? 'is-over' : 'is-debt') : ''}"><td><button type="button" class="bld-link" data-action="open-unit" data-slot="${sk}">${shortSlot(sk)}</button></td><td>${escapeHtml(u?.headName || '— خالی —')}</td><td>${fmtMoney(b.total)}</td><td class="is-green">${fmtMoney(Math.min(b.paid, b.total))}</td><td class="is-red">${fmtMoney(b.remaining)}</td><td>${b.remaining === 0 ? '✅ تسویه' : b.overdue ? '⚠️ معوقه' : '⏳ بدهکار'}</td></tr>`;
    }).join('')}
    </tbody></table></div>
  </div>`;
  return h;
}

/* ================================================================== */
/* تب گفتگو                                                                 */
/* ================================================================== */

export function renderChatTab({ meId, isManager, managerId, managerName, mySlot, chatMode, groupMsgs, threads, dmMsgs, dmTarget, members, unitsBySlot, seenGroup, seenDm }) {
  const isGroup = chatMode === 'group';
  const groupUnread = groupMsgs.filter((m) => m.createdAt > (seenGroup || 0) && String(m.fromId) !== String(meId)).length;
  let h = `<div class="bld-chat">
    <aside class="bld-threads">
      <button type="button" class="bld-thread${isGroup ? ' is-active' : ''}" data-action="chat-mode-group">
        <span class="bld-thread-ico">👥</span>
        <span class="bld-thread-txt"><b>گروه ساختمان</b><small>${groupMsgs.length ? escapeHtml((groupMsgs[groupMsgs.length - 1].text || '📷 عکس').slice(0, 30)) : 'هنوز پیامی نیست'}</small></span>
        ${groupUnread ? badgeDot(groupUnread) : ''}
      </button>
      <div class="bld-thread-sep">پیام‌های خصوصی</div>
      ${threads.length ? threads.map((t) => {
        const unread = listUnreadDm(t, meId, seenDm);
        return `<button type="button" class="bld-thread${!isGroup && dmTarget?.userId === t.otherId ? ' is-active' : ''}" data-action="chat-mode-dm" data-user="${escapeHtml(t.otherId)}" data-name="${escapeHtml(t.otherName)}" data-slot="${escapeHtml(t.otherSlot || '')}">
          ${avatarHtml(t.otherName, '')}
          <span class="bld-thread-txt"><b>${escapeHtml(t.otherName)}${t.otherSlot ? ` <small>(${shortSlot(t.otherSlot)})</small>` : ''}</b><small>${escapeHtml((t.last.text || '📷 عکس').slice(0, 30))}</small></span>
          ${unread ? badgeDot(unread) : ''}
        </button>`;
      }).join('') : '<p class="bld-f-hint" style="padding:0 12px">گفتگوی خصوصی نداری.</p>'}
      ${members.length ? `<div class="bld-thread-sep">شروع گفتگو با…</div>` + members.map((m) =>
        `<button type="button" class="bld-thread is-new" data-action="chat-mode-dm" data-user="${escapeHtml(m.userId)}" data-name="${escapeHtml(m.name)}" data-slot="${escapeHtml(m.slot || '')}">${avatarHtml(m.name, m.avatar)}<span class="bld-thread-txt"><b>${escapeHtml(m.name)}</b><small>${m.slot ? shortSlot(m.slot) + ' · ' : ''}${m.role}</small></span><span>💬</span></button>`
      ).join('') : ''}
    </aside>
    <div class="bld-conv">
      <div class="bld-conv-head">${isGroup ? '👥 <b>گروه ساختمان</b><small>همه اعضا این‌جا هستن</small>' : `${avatarHtml(dmTarget?.name || '?', '')}<b>${escapeHtml(dmTarget?.name || '')}</b>${dmTarget?.slot ? `<small>${slotLabel(dmTarget.slot)}</small>` : ''}<small>🔒 خصوصی</small>`}</div>
      <div class="bld-msgs" id="bldMsgs">${(isGroup ? groupMsgs : dmMsgs).map((m) => msgHtml(m, meId, isManager)).join('') || emptyBox('💬', 'هنوز پیامی نیست', 'اولین پیام را بفرست!')}</div>
      ${chatComposerHtml(isGroup ? 'group' : 'dm', dmTarget)}
    </div>
  </div>`;
  return h;
}

function listUnreadDm(t, meId, seenDm) {
  void t;
  void meId;
  void seenDm;
  return 0; // محاسبه دقیق در کنترلر؛ این‌جا ساده
}

function msgHtml(m, meId, isManager) {
  const own = String(m.fromId) === String(meId);
  const canDel = own || isManager;
  return `<div class="bld-msg${own ? ' is-own' : ''}">
    ${!own ? avatarHtml(m.fromName, '', 'is-xs') : ''}
    <div class="bld-bubble">
      ${!own ? `<div class="bld-bubble-head"><b>${escapeHtml(m.anonymous ? 'ناشناس' : m.fromName)}</b>${m.fromSlot ? `<small>${shortSlot(m.fromSlot)}</small>` : ''}</div>` : ''}
      ${m.text ? `<p>${nl2br(m.text)}</p>` : ''}
      ${m.image ? `<button type="button" class="bld-thumb is-msg" data-action="view-img" data-src="${m.image}" data-cap="عکس از ${escapeHtml(m.fromName)}"><img src="${m.image}" alt="" loading="lazy"></button>` : ''}
      <small class="bld-bubble-time">${faDateTime(m.createdAt)}${own ? ' ✓' : ''}</small>
      ${canDel ? `<button type="button" class="bld-msg-del" data-action="del-msg" data-id="${m.id}" title="حذف">×</button>` : ''}
    </div>
  </div>`;
}

function chatComposerHtml(scope, dmTarget) {
  return `<form class="bld-composer" data-form="chat" data-scope="${scope}" ${dmTarget ? `data-to="${escapeHtml(dmTarget.userId)}" data-toname="${escapeHtml(dmTarget.name)}" data-toslot="${escapeHtml(dmTarget.slot || '')}"` : ''}>
    <label class="bld-attach" title="ارسال عکس">📎<input type="file" name="image" accept="image/*" class="hidden"></label>
    <input class="bld-f-input" name="text" placeholder="${scope === 'group' ? 'پیام به گروه ساختمان…' : 'پیام خصوصی…'}" autocomplete="off" maxlength="2000">
    <button type="submit" class="bld-btn is-primary">ارسال 🚀</button>
  </form>`;
}

/* ================================================================== */
/* تب خدمات                                                                 */
/* ================================================================== */

export function renderServicesTab({ isManager, cleaning, unitsBySlot, events, tickets, mySlot }) {
  let h = sectionHead('🛠 خدمات ساختمان', 'نوبت نظافت، رویدادها و درخواست‌های تعمیرات', `${btn('new-ticket', '🛠 درخواست تعمیرات', 'is-primary is-sm', '')}${isManager ? btn('new-event', '📅 رویداد', 'is-sm', '') : ''}`);

  // نظافت
  if (cleaning) {
    const cur = unitsBySlot[cleaning.current];
    const nxt = unitsBySlot[cleaning.next];
    h += `<div class="bld-clean">
      <div class="bld-clean-now"><small>🧹 نوبت نظافت این هفته (هفته ${faNum(cleaning.weekNo)})</small>
        <div class="bld-clean-unit">${avatarHtml(cur?.headName || '?', cur?.avatar || '')}<div><b>${escapeHtml(cur?.headName || '؟')}</b><small>${slotLabel(cleaning.current)}</small></div></div>
        <small class="bld-f-hint">هفته بعد: ${escapeHtml(nxt?.headName || '؟')} (${shortSlot(cleaning.next)})</small>
      </div>
      <div class="bld-clean-order">${cleaning.order.map((sk) => `<span class="bld-clean-dot${sk === cleaning.current ? ' is-now' : ''}${sk === cleaning.next ? ' is-next' : ''}" title="${slotLabel(sk)} — ${escapeHtml(unitsBySlot[sk]?.headName || '')}">${shortSlot(sk)}</span>`).join('')}</div>
      ${isManager ? `<div class="bld-clean-btns">${btn('clean-prev', '→ قبلی', 'is-sm', '')}${btn('clean-next', 'بعدی ←', 'is-sm', '')}</div>` : ''}
    </div>`;
  }

  // رویدادها
  h += `<h3 class="bld-my-title">📅 رویدادهای پیش‌رو</h3>`;
  const upcoming = events.filter((e) => e.date >= Date.now() - 86400000);
  if (!upcoming.length) h += `<p class="bld-f-hint">رویدادی ثبت نشده.</p>`;
  else {
    h += `<div class="bld-events">`;
    for (const e of upcoming.slice(0, 6)) {
      const days = Math.ceil((e.date - Date.now()) / 86400000);
      h += `<div class="bld-event"><div><b>${escapeHtml(e.title)}</b><small>📍 ${escapeHtml(e.place || '—')} · 🕐 ${escapeHtml(e.time || '')} · ${faDate(e.date)}</small>${e.body ? `<p>${nl2br(e.body)}</p>` : ''}</div>
      <span class="bld-countdown">${days <= 0 ? '🎯 امروز!' : `${faNum(days)} روز مانده`}</span>
      ${isManager ? btn('del-event', '🗑', 'is-sm is-danger is-icon', `data-id="${e.id}"`) : ''}</div>`;
    }
    h += `</div>`;
  }

  // تعمیرات
  h += `<h3 class="bld-my-title">🔧 درخواست‌های تعمیرات</h3>`;
  if (!tickets.length) h += emptyBox('🔧', 'درخواستی نیست', 'خرابی دیدی؟ همین‌جا ثبت کن!');
  else {
    h += `<div class="bld-tickets">`;
    for (const t of tickets) {
      const cat = TICKET_CATS[t.category] || TICKET_CATS.other;
      const st = TICKET_STATUS[t.status] || TICKET_STATUS.new;
      const pri = t.priority === 'high' ? '🔴 فوری' : t.priority === 'low' ? '🟢 کم' : '🟡 معمولی';
      h += `<div class="bld-ticket is-${t.status}">
        <span class="bld-ticket-ico">${cat.icon}</span>
        <div class="bld-ticket-main"><b>${escapeHtml(t.title)}</b>
          <small>${cat.label} · ${pri} · ${escapeHtml(t.byName)}${t.bySlot ? ` (${shortSlot(t.bySlot)})` : ''} · ${relTime(t.createdAt)}</small>
          ${t.body ? `<p>${nl2br(t.body)}</p>` : ''}
          ${t.assignee ? `<small>👷 مسئول: ${escapeHtml(t.assignee)}</small>` : ''}
        </div>
        <span class="bld-status ${t.status === 'done' ? 'is-ok' : t.status === 'new' ? 'is-warn' : ''}">${st.icon} ${st.label}</span>
        ${t.image ? `<button type="button" class="bld-thumb is-sm" data-action="view-img" data-src="${t.image}" data-cap="${escapeHtml(t.title)}"><img src="${t.image}" alt="" loading="lazy"></button>` : ''}
        <div class="bld-row-btns">${isManager ? btn('manage-ticket', '⚙️', 'is-sm', `data-id="${t.id}" title="مدیریت"`) : ''}${isManager || t.bySlot === mySlot ? btn('del-ticket', '🗑', 'is-sm is-danger is-icon', `data-id="${t.id}"`) : ''}</div>
      </div>`;
    }
    h += `</div>`;
  }
  return h;
}

/* ================================================================== */
/* تب نظرسنجی و پیشنهاد                                                       */
/* ================================================================== */

export function renderVotesTab({ isManager, polls, suggestions, meId, mySlot }) {
  let h = sectionHead('🗳 نظرسنجی‌ها', 'رأی شما سرنوشت ساختمان را می‌سازد!', isManager ? btn('new-poll', '🗳 نظرسنجی جدید', 'is-primary is-sm', '') : '');
  if (!polls.length) h += `<p class="bld-f-hint">نظرسنجی فعالی نیست.</p>`;
  else {
    h += `<div class="bld-polls">`;
    for (const p of polls) {
      const counts = p.options.map(() => 0);
      for (const v of Object.values(p.votes || {})) if (counts[v] !== undefined) counts[v]++;
      const total = counts.reduce((s, c) => s + c, 0);
      const myVote = p.votes?.[String(meId)];
      const closed = p.status !== 'open' || (p.closesAt && p.closesAt < Date.now());
      h += `<div class="bld-poll${closed ? ' is-closed' : ''}">
        <div class="bld-poll-head"><b>${escapeHtml(p.question)}</b>
        <small>از ${escapeHtml(p.byName)} · ${closed ? '🔒 بسته' : p.closesAt ? `⏳ تا ${faDate(p.closesAt)}` : '🟢 باز'} · ${faNum(total)} رأی</small></div>
        <div class="bld-poll-opts">`;
      p.options.forEach((opt, i) => {
        const pct = total ? Math.round((counts[i] / total) * 100) : 0;
        if (closed || myVote !== undefined) {
          h += `<div class="bld-poll-res${myVote === i ? ' is-mine' : ''}"><span>${escapeHtml(opt)} ${myVote === i ? '✅' : ''}</span>${progressBar(pct)}<b>${faNum(pct)}٪ (${faNum(counts[i])})</b></div>`;
        } else {
          h += `<button type="button" class="bld-poll-opt" data-action="vote" data-id="${p.id}" data-idx="${i}">${escapeHtml(opt)}</button>`;
        }
      });
      h += `</div>
        <div class="bld-row-btns">${!closed && myVote !== undefined ? '<small class="bld-f-hint">✅ رأی شما ثبت شد</small>' : ''}${isManager ? `${btn('poll-toggle', p.status === 'open' ? '🔒 بستن' : '🔓 بازگشایی', 'is-sm', `data-id="${p.id}"`)}${btn('del-poll', '🗑', 'is-sm is-danger is-icon', `data-id="${p.id}"`)}` : ''}</div>
      </div>`;
    }
    h += `</div>`;
  }

  h += sectionHead('💡 پیشنهادهای ساکنین', 'برای لابی، نما، حیاط… بهترین‌ها با رأی شما بالا میان!', btn('new-suggestion', '💡 ثبت پیشنهاد', 'is-primary is-sm', ''));
  if (!suggestions.length) h += emptyBox('💡', 'پیشنهادی نیست', 'اولین ایده برای قشنگ‌تر شدن ساختمون رو تو بده!');
  else {
    h += `<div class="bld-sugs">`;
    for (const s of suggestions) {
      const area = SUGGEST_AREAS[s.area] || SUGGEST_AREAS.other;
      const st = SUGGEST_STATUS[s.status] || SUGGEST_STATUS.idea;
      const voted = (s.votes || []).includes(String(meId));
      h += `<div class="bld-sug">
        ${s.image ? `<button type="button" class="bld-sug-img" data-action="view-img" data-src="${s.image}" data-cap="${escapeHtml(s.title)}"><img src="${s.image}" alt="" loading="lazy"></button>` : ''}
        <div class="bld-sug-body">
          <div class="bld-sug-top"><span class="bld-post-kind">${area.icon} ${area.label}</span><span class="bld-status">${st.icon} ${st.label}</span></div>
          <b>${escapeHtml(s.title)}</b>
          ${s.body ? `<p>${nl2br(s.body)}</p>` : ''}
          <small>${escapeHtml(s.byName)}${s.bySlot ? ` (${shortSlot(s.bySlot)})` : ''} · ${relTime(s.createdAt)}</small>
          <div class="bld-sug-foot">
            <button type="button" class="bld-vote${voted ? ' is-on' : ''}" data-action="sug-vote" data-id="${s.id}">👍 ${faNum(s.votes?.length || 0)}</button>
            ${isManager ? `<span class="bld-row-btns">${btn('sug-cycle', '⏭ وضعیت بعدی', 'is-sm', `data-id="${s.id}"`)}${btn('del-sug', '🗑', 'is-sm is-danger is-icon', `data-id="${s.id}"`)}</span>` : ''}
          </div>
        </div>
      </div>`;
    }
    h += `</div>`;
  }
  return h;
}

/* ================================================================== */
/* تب شکایات                                                                  */
/* ================================================================== */

export function renderComplaintsTab({ isManager, complaints, meId, mySlot }) {
  const visible = isManager ? complaints : complaints.filter((c) => String(c.fromId) === String(meId) || c.fromSlot === mySlot || (c.targetKind === 'unit' && c.targetSlot === mySlot));
  let h = sectionHead('⚖️ شکایات', isManager ? 'رسیدگی منصفانه = ساختمان آروم 🕊' : 'مشکل داری؟ این‌جا بگو تا پیگیری بشه', btn('new-complaint', '⚖️ ثبت شکایت', 'is-primary is-sm', ''));
  if (!visible.length) h += emptyBox('🕊', 'شکایتی نیست', 'چه ساختمان آرومی! 😌');
  else {
    h += `<div class="bld-comps">`;
    for (const c of visible) {
      const cat = COMPLAINT_CATS[c.category] || COMPLAINT_CATS.other;
      const st = COMPLAINT_STATUS[c.status] || COMPLAINT_STATUS.new;
      const target = c.targetKind === 'manager' ? '👑 مدیر ساختمان' : c.targetKind === 'unit' && c.targetSlot ? `🏠 واحد ${shortSlot(c.targetSlot)}` : '🏢 مشاعات';
      const own = String(c.fromId) === String(meId) || c.fromSlot === mySlot;
      h += `<div class="bld-comp is-${c.status}">
        <div class="bld-comp-head"><span class="bld-post-kind">${cat.icon} ${cat.label}</span><span class="bld-status">${st.icon} ${st.label}</span></div>
        <b>${escapeHtml(c.title)}</b>
        <small>از: ${c.anonymous && !isManager ? '🙈 ناشناس' : `${escapeHtml(c.fromName)}${c.fromSlot ? ` (${shortSlot(c.fromSlot)})` : ''}`} · به: ${target} · ${relTime(c.createdAt)}</small>
        ${c.body ? `<p>${nl2br(c.body)}</p>` : ''}
        ${c.response ? `<div class="bld-response"><b>👑 پاسخ مدیر:</b><p>${nl2br(c.response)}</p></div>` : ''}
        <div class="bld-row-btns">${isManager ? btn('resp-complaint', '✍️ رسیدگی', 'is-sm is-primary', `data-id="${c.id}"`) : ''}${isManager || own ? btn('del-complaint', '🗑 حذف', 'is-sm is-danger', `data-id="${c.id}"`) : ''}</div>
      </div>`;
    }
    h += `</div>`;
  }
  return h;
}

/* ================================================================== */
/* تب اسناد                                                                     */
/* ================================================================== */

export function renderDocsTab({ isManager, docsMode, docs, contacts, rules }) {
  let h = sectionHead('📁 اسناد و اطلاعات', 'صورتجلسات، مخاطبین ضروری و قوانین', '');
  h += `<div class="bld-filters">${chipBtn('docs-mode', '📁 اسناد', docsMode === 'docs', 'data-m="docs"')}${chipBtn('docs-mode', '📞 مخاطبین', docsMode === 'contacts', 'data-m="contacts"')}${chipBtn('docs-mode', '📜 قوانین', docsMode === 'rules', 'data-m="rules"')}</div>`;

  if (docsMode === 'docs') {
    if (isManager) h += `<div class="bld-toolbar">${btn('new-doc', '📁 سند جدید', 'is-primary is-sm', '')}</div>`;
    if (!docs.length) h += emptyBox('📁', 'سندی ثبت نشده', 'صورتجلسات و فاکتورهای مهم این‌جا بایگانی می‌شن.');
    else {
      h += `<div class="bld-docs">`;
      for (const d of docs) {
        const k = DOC_KINDS[d.kind] || DOC_KINDS.other;
        h += `<div class="bld-doc"><span class="bld-doc-ico">${k.icon}</span>
          <div class="bld-doc-main"><b>${escapeHtml(d.title)}</b><small>${k.label} · ${escapeHtml(d.byName || '')} · ${faDate(d.createdAt)}</small>
          ${d.body ? `<p>${nl2br(d.body.slice(0, 300))}${d.body.length > 300 ? '…' : ''}</p>` : ''}</div>
          <div class="bld-row-btns">
            ${d.file ? `<button type="button" class="bld-thumb is-sm" data-action="view-img" data-src="${d.file}" data-cap="${escapeHtml(d.title)}"><img src="${d.file}" alt="" loading="lazy"></button><a class="bld-btn is-sm" href="${d.file}" download="${escapeHtml(d.fileName || 'doc.jpg')}">📥</a>` : ''}
            ${isManager ? btn('del-doc', '🗑', 'is-sm is-danger is-icon', `data-id="${d.id}"`) : ''}
          </div>
        </div>`;
      }
      h += `</div>`;
    }
  } else if (docsMode === 'contacts') {
    if (isManager) h += `<div class="bld-toolbar">${btn('new-contact', '📞 مخاطب جدید', 'is-primary is-sm', '')}</div>`;
    if (!contacts.length) h += emptyBox('📞', 'مخاطبی نیست', 'شماره سرایدار، تأسیساتی و موارد ضروری…');
    else {
      h += `<div class="bld-contacts">`;
      for (const c of contacts) {
        h += `<div class="bld-contact"><span class="bld-contact-ico">📞</span><div><b>${escapeHtml(c.name)}</b><small>${escapeHtml(c.role || '')}${c.note ? ` · ${escapeHtml(c.note)}` : ''}</small></div>
        ${c.phone ? `<a class="bld-btn is-sm is-primary" href="tel:${escapeHtml(c.phone.replace(/\s/g, ''))}">${escapeHtml(c.phone)} 📲</a>` : ''}
        ${isManager ? `<span class="bld-row-btns">${btn('edit-contact', '✏️', 'is-sm', `data-id="${c.id}"`)}${btn('del-contact', '🗑', 'is-sm is-danger is-icon', `data-id="${c.id}"`)}</span>` : ''}</div>`;
      }
      h += `</div>`;
    }
  } else {
    if (isManager) h += `<div class="bld-toolbar">${btn('edit-rules', '✏️ ویرایش قوانین', 'is-primary is-sm', '')}</div>`;
    h += `<div class="bld-rules">${rules ? nl2br(rules) : '📜 هنوز قانونی ثبت نشده.'}</div>`;
  }
  return h;
}

/* ================================================================== */
/* تب مدیریت                                                                 */
/* ================================================================== */

export function renderManageTab(C) {
  const { isManager, building, manageMode, myUnit } = C;
  if (!isManager) {
    let h = sectionHead('⚙️ واحد من', 'اطلاعات و تنظیمات واحد شما', myUnit ? btn('edit-my-unit', '✏️ ویرایش واحد من', 'is-primary is-sm', '') : '');
    if (!myUnit) return h + emptyBox('🏠', 'واحدی نداری', 'با کد ساختمان وارد شو تا واحد بگیری.');
    h += `<div class="bld-myunit">${unitDetailHtml({ ...C, unit: myUnit, slotKey: myUnit.slotKey, inModal: false })}</div>`;
    h += `<div class="bld-danger-zone"><b>⛔ ترک واحد</b><p>با ترک واحد، اسلات شما آزاد می‌شود ولی بدهی‌ها روی واحد می‌ماند.</p>${btn('leave-unit', 'ترک واحد 🚪', 'is-danger', '')}</div>`;
    return h;
  }
  let h = sectionHead('⚙️ مدیریت ساختمان', `مدیر: ${escapeHtml(building.managerName || '')}`, '');
  h += `<div class="bld-filters">${chipBtn('manage-mode', '🧍 واحدها', manageMode === 'units', 'data-m="units"')}${chipBtn('manage-mode', '📊 گزارش‌ها', manageMode === 'reports', 'data-m="reports"')}${chipBtn('manage-mode', '🔧 تنظیمات', manageMode === 'settings', 'data-m="settings"')}</div>`;
  if (manageMode === 'units') return h + renderManageUnits(C);
  if (manageMode === 'reports') return h + renderReportHtml(C);
  return h + renderManageSettings(C);
}

function renderManageUnits({ building, unitsBySlot, slotBalances }) {
  let h = `<div class="bld-invite"><div><b>🔑 کد دعوت ساختمان</b><p>این کد را به ساکنین جدید بدهید:</p></div>
    <button type="button" class="bld-code-big is-sm" data-action="copy-code" data-code="${escapeHtml(building.code)}">${escapeHtml(building.code)} 📋</button></div>`;
  h += `<div class="bld-units">`;
  for (let f = building.floors; f >= 1; f--) {
    h += `<div class="bld-mfloor"><span class="bld-slot-floor">طبقه ${faNum(f)}</span><div class="bld-munits">`;
    for (let n = 1; n <= building.unitsPerFloor; n++) {
      const sk = `${f}-${n}`;
      const u = unitsBySlot[sk];
      const b = slotBalances[sk] || { total: 0, paid: 0, remaining: 0 };
      if (!u) {
        h += `<div class="bld-munit is-empty"><b>${shortSlot(sk)}</b><small>خالی 🈳</small>${b.remaining > 0 ? `<small class="is-red">${fmtMoney(b.remaining)} بدهی ⚠️</small>` : ''}</div>`;
      } else {
        h += `<div class="bld-munit">
          <button type="button" class="bld-munit-head" data-action="open-unit" data-slot="${sk}">${avatarHtml(u.headName, u.avatar || u.photo, 'is-sm')}<span><b>${escapeHtml(u.headName)}</b><small>${shortSlot(sk)} · ${u.ownerType === 'tenant' ? 'مستأجر 🔑' : 'مالک 🏠'} · ${faNum(u.residents)} نفر</small></span></button>
          <small class="${b.remaining > 0 ? 'is-red' : 'is-green'}">${b.remaining > 0 ? `${fmtMoney(b.remaining)} بدهی` : '✅ تسویه'}</small>
          <div class="bld-row-btns">${btn('edit-unit', '✏️', 'is-sm', `data-id="${u.id}"`)}${btn('msg-unit', '💬', 'is-sm', `data-id="${u.id}" title="پیام خصوصی"`)}${btn('del-unit', '🗑', 'is-sm is-danger is-icon', `data-id="${u.id}" title="حذف واحد"`)}</div>
        </div>`;
      }
    }
    h += `</div></div>`;
  }
  h += `</div>`;
  return h;
}

function renderManageSettings({ building, stats }) {
  return `<div class="bld-settings">
    <div class="bld-set-card"><div><b>🏦 موجودی اولیه صندوق</b><p>${fmtMoney(building.fundStart || 0)}</p></div>${btn('fund-edit', '✏️ ویرایش', 'is-sm', '')}</div>
    <div class="bld-set-card"><div><b>📜 قوانین ساختمان</b><p>${building.rules ? faNum(building.rules.split('\n').filter(Boolean).length) + ' قانون ثبت شده' : 'ثبت نشده'}</p></div>${btn('edit-rules', '✏️ ویرایش', 'is-sm', '')}</div>
    <div class="bld-set-card"><div><b>📥 خروجی اکسل (CSV)</b><p>ریز بدهی‌ها و پرداخت‌های همه واحدها</p></div>${btn('export-csv', '📥 دانلود', 'is-sm', '')}</div>
    <div class="bld-set-card"><div><b>🧍 ظرفیت</b><p>${faNum(stats.joined)} از ${faNum(stats.totalSlots)} واحد پر شده (${faNum(stats.occupancy)}٪)</p></div>${progressBar(stats.occupancy)}</div>
    <div class="bld-set-card"><div><b>📲 انتقال به دستگاه جدید</b><p>ساخت بسته (فایل یا متن) برای گوشی/سیستم دیگر</p></div>${btn('transfer-building', '📲 ساخت بسته', 'is-sm is-primary', '')}</div>
    <div class="bld-danger-zone"><b>⛔ حذف ساختمان</b><p>کل اطلاعات (واحدها، بدهی‌ها، پیام‌ها…) برای همیشه پاک می‌شود!</p>${btn('delete-building', 'حذف ساختمان 🗑', 'is-danger', `data-id="${building.id}"`)}</div>
  </div>`;
}

/* ================================================================== */
/* ورود به واحد (پروفایل واحد)                                               */
/* ================================================================== */

export function unitDetailHtml({ unit, slotKey, balance, debts, isManager, isOwn, canMessage, mySlot }) {
  if (!unit) {
    const b = balance || { total: 0, paid: 0, remaining: 0 };
    return `<div class="bld-unit-empty-big"><div class="bld-empty-ico">🈳</div>
      <h3>واحد ${shortSlot(slotKey)} خالی است</h3><p>${slotLabel(slotKey)}</p>
      ${b.remaining > 0 ? `<p class="is-red">⚠️ این واحد خالی ${fmtMoney(b.remaining)} بدهی انباشته دارد که به ساکن جدید منتقل می‌شود.</p>` : '<p>بدون بدهی ✅</p>'}
      ${isManager ? `<p class="bld-f-hint">کد دعوت را به ساکن جدید بدهید تا این واحد را بگیرد 🔑</p>` : ''}
    </div>`;
  }
  const b = balance || { total: 0, paid: 0, remaining: 0, overdue: 0 };
  const pct = b.total ? (Math.min(b.paid, b.total) / b.total) * 100 : 100;
  let h = `<div class="bld-unit">
    ${unit.photo ? `<img class="bld-unit-photo" src="${unit.photo}" alt="عکس واحد">` : ''}
    <div class="bld-unit-head">${avatarHtml(unit.headName, unit.avatar || '', 'is-lg')}
      <div><h3>${escapeHtml(unit.headName)}</h3><p>${slotLabel(slotKey)} · ${unit.ownerType === 'tenant' ? 'مستأجر 🔑' : 'مالک 🏠'} · ${faNum(unit.residents)} نفر 🧍</p>
      ${unit.family ? `<p>پلاک: ${escapeHtml(unit.family)}</p>` : ''}</div>
      ${isOwn ? '<span class="bld-tag">⭐ واحد شما</span>' : ''}
    </div>
    ${unit.bio ? `<p class="bld-unit-bio">💬 ${escapeHtml(unit.bio)}</p>` : ''}
    <div class="bld-unit-grid">
      ${unit.phone ? `<a class="bld-unit-item" href="tel:${escapeHtml(unit.phone.replace(/\s/g, ''))}">📱 <b>${escapeHtml(unit.phone)}</b></a>` : ''}
      ${(unit.cars || []).map((c) => `<span class="bld-unit-item">🚗 ${escapeHtml(c.type || 'ماشین')} <b dir="ltr">${escapeHtml(c.plate || '')}</b></span>`).join('')}
      ${unit.pets ? `<span class="bld-unit-item">🐾 ${escapeHtml(unit.pets)}</span>` : ''}
      ${unit.meters?.water ? `<span class="bld-unit-item">🚰 کنتور آب: <b dir="ltr">${escapeHtml(unit.meters.water)}</b></span>` : ''}
      ${unit.meters?.electricity ? `<span class="bld-unit-item">⚡ کنتور برق: <b dir="ltr">${escapeHtml(unit.meters.electricity)}</b></span>` : ''}
      <span class="bld-unit-item">📅 عضویت: <b>${faDate(unit.joinedAt)}</b></span>
    </div>
    <div class="bld-unit-bal">
      <div><small>جمع بدهی</small><b>${fmtMoney(b.total)}</b></div>
      <div><small>پرداخت</small><b class="is-green">${fmtMoney(Math.min(b.paid, b.total))}</b></div>
      <div><small>مانده</small><b class="${b.remaining ? 'is-red' : 'is-green'}">${fmtMoney(b.remaining)}</b></div>
      ${progressBar(pct)}
    </div>
    ${(debts || []).filter((d) => d.remaining > 0).length ? `<div class="bld-unit-debts"><b>⏳ بدهی‌های باز:</b>${(debts || []).filter((d) => d.remaining > 0).map((d) => `<span>${escapeHtml(d.post?.title || '')} — <b class="is-red">${fmtMoney(d.remaining)}</b></span>`).join('')}</div>` : ''}
    <div class="bld-unit-actions">
      ${isOwn && b.remaining > 0 ? btn('goto', '💳 پرداخت بدهی', 'is-primary', 'data-tab="money" data-shell="close"') : ''}
      ${!isOwn && canMessage ? btn('msg-unit', '💬 پیام خصوصی', '', `data-id="${unit.id}" data-shell="close"`) : ''}
      ${!isOwn && !isManager ? btn('complain-unit', '⚖️ شکایت از این واحد', '', `data-slot="${slotKey}" data-shell="close"`) : ''}
      ${isManager && !isOwn ? btn('edit-unit', '✏️ ویرایش واحد', '', `data-id="${unit.id}" data-shell="close"`) : ''}
      ${isOwn && !isManager ? btn('edit-my-unit', '✏️ ویرایش واحد من', '', `data-shell="close"`) : ''}
      ${isManager && !isOwn ? btn('del-unit', '🗑 حذف واحد', 'is-danger', `data-id="${unit.id}"`) : ''}
    </div>
  </div>`;
  return h;
}
