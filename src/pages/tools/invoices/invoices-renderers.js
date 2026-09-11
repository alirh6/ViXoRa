// src/pages/tools/invoices/invoices-renderers.js

/**
 * رندرهای سوپراپ مالی — داشبورد (۹ ویجت قابل تنظیم)، تراکنش‌ها، بودجه‌ها،
 * اهداف، بدهی‌ها، فاکتورها، قبوض، گزارش‌ها (نمودارهای SVG)، تنظیمات
 */

import {
  escapeHtml,
  formatMoney,
  computeBalances,
  totalBalance,
  netWorth,
  summarizeWindow,
  sumByCategory,
  monthlyCashflow,
  netWorthHistory,
  buildCalendar,
  groupTxsByDay,
  budgetProgress,
  goalSaved,
  debtRemaining,
  invoiceTotals,
  invoiceDisplayStatus,
  buildInsights,
  jalaliParts,
  jalaliMonthLabel,
  formatJalali,
  parseLocalDateInput,
  ACCOUNT_TYPE_LABELS,
} from '../../../core/schemas/finance-schema.js';

/* ================================================================== */
/* ابزار نمودار SVG                                                      */
/* ================================================================== */

function svgDonut(segments, size = 170, thickness = 30) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const arcs = segments.map((s) => {
    const frac = s.value / total;
    const dash = `${Math.max(0, frac * circ - 2)} ${circ}`;
    const off = -acc * circ;
    acc += frac;
    return `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thickness}" stroke-dasharray="${dash}" stroke-dashoffset="${off}" transform="rotate(-90 ${c} ${c})" stroke-linecap="butt"><title>${escapeHtml(s.label)} — ${s.pct}%</title></circle>`;
  }).join('');
  return `<svg class="fin-donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img">${arcs}</svg>`;
}

function svgBars(points) {
  // points: [{ label, income, expense }]
  const W = 640;
  const H = 190;
  const padB = 26;
  const padT = 8;
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]));
  const n = Math.max(1, points.length);
  const groupW = W / n;
  const barW = Math.min(26, (groupW - 14) / 2);
  const bars = points.map((p, i) => {
    const x = i * groupW + groupW / 2;
    const hI = ((H - padB - padT) * p.income) / max;
    const hE = ((H - padB - padT) * p.expense) / max;
    return `<g>
      <rect x="${(x - barW - 2).toFixed(1)}" y="${(H - padB - hI).toFixed(1)}" width="${barW}" height="${hI.toFixed(1)}" rx="4" fill="var(--fin-income, #22c55e)"><title>درآمد: ${p.income.toLocaleString('en-US')}</title></rect>
      <rect x="${(x + 2).toFixed(1)}" y="${(H - padB - hE).toFixed(1)}" width="${barW}" height="${hE.toFixed(1)}" rx="4" fill="var(--fin-expense, #ef4444)"><title>خرج: ${p.expense.toLocaleString('en-US')}</title></rect>
      <text x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle" class="fin-chart-label">${escapeHtml(p.label)}</text>
    </g>`;
  }).join('');
  return `<svg class="fin-bars" viewBox="0 0 ${W} ${H}" role="img">${bars}</svg>`;
}

function svgLine(points) {
  // points: [{ label, value }]
  const W = 640;
  const H = 190;
  const padB = 26;
  const padT = 10;
  const vals = points.map((p) => p.value);
  const min = Math.min(0, ...vals);
  const max = Math.max(1, ...vals);
  const range = max - min || 1;
  const n = Math.max(1, points.length);
  const stepX = n === 1 ? 0 : (W - 20) / (n - 1);
  const coords = points.map((p, i) => {
    const x = 10 + i * stepX;
    const y = padT + (H - padB - padT) * (1 - (p.value - min) / range);
    return [x, y];
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${(10 + (n - 1) * stepX).toFixed(1)},${H - padB} L10,${H - padB} Z`;
  const dots = coords.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="var(--fin-accent, #10b981)"><title>${escapeHtml(points[i].label)}: ${points[i].value.toLocaleString('en-US')}</title></circle>`).join('');
  const labels = coords.map(([x], i) => (i % Math.ceil(n / 6) === 0 || i === n - 1 ? `<text x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle" class="fin-chart-label">${escapeHtml(points[i].label)}</text>` : '')).join('');
  return `<svg class="fin-line" viewBox="0 0 ${W} ${H}" role="img">
    <path d="${area}" fill="var(--fin-accent-soft, rgba(16,185,129,.15))" stroke="none"></path>
    <path d="${path}" fill="none" stroke="var(--fin-accent, #10b981)" stroke-width="2.5" stroke-linejoin="round"></path>
    ${dots}${labels}</svg>`;
}

function progressBar(pct, tone = '') {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return `<div class="fin-progress ${tone}"><span style="width:${v}%"></span></div>`;
}

function txIcon(type) {
  return type === 'income' ? '📥' : type === 'expense' ? '📤' : '🔄';
}

function catName(catById, id, fallback = 'بدون دسته') {
  if (!id) return fallback;
  return catById.get(id)?.name || '؟';
}

/* ================================================================== */
/* داشبورد                                                               */
/* ================================================================== */

export function renderDashboard(ctx) {
  const { helpers: h } = ctx;
  const widgets = (h.settings.widgets || []).filter((w) => w.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!widgets.length) {
    return `<div class="fin-empty">همه ویجت‌ها خاموش‌اند. از تب تنظیمات ویجت‌ها را روشن کن.</div>`;
  }
  return `<div class="fin-grid">${widgets.map((w) => renderWidget(w, ctx)).join('')}</div>`;
}

function renderWidget(w, ctx) {
  const inner = {
    balance: () => widgetBalance(ctx),
    month: () => widgetMonth(ctx),
    cashflow: () => widgetCashflow(ctx),
    donut: () => widgetDonut(ctx),
    budgets: () => widgetBudgets(ctx),
    goals: () => widgetGoals(ctx),
    upcoming: () => widgetUpcoming(ctx),
    recent: () => widgetRecent(ctx),
    insights: () => widgetInsights(ctx),
  }[w.id];
  if (!inner) return '';
  return `<section class="fin-card fin-widget" data-widget="${escapeHtml(w.id)}">
    <div class="fin-card-head"><h3>${escapeHtml(w.title || w.id)}</h3></div>
    ${inner()}
  </section>`;
}

function widgetBalance(ctx) {
  const { helpers: h } = ctx;
  const balances = computeBalances(h.txs, h.accounts);
  const cash = totalBalance(balances);
  const net = netWorth(h.txs, h.accounts, h.debts, h.goals);
  return `<div class="fin-networth"><span class="fin-net-num ${net >= 0 ? 'fin-in' : 'fin-out'}">${formatMoney(net, h.settings)}</span>
    <div class="fin-net-rows">
      <span>💰 موجودی حساب‌ها: ${formatMoney(cash, h.settings)}</span>
      ${h.accounts.slice(0, 4).map((a) => {
        const b = balances.get(a.id)?.balance || 0;
        return `<span>${escapeHtml(a.icon)} ${escapeHtml(a.name)}: <b class="${b < 0 ? 'fin-out' : 'fin-in'}">${formatMoney(b, h.settings)}</b></span>`;
      }).join('')}
    </div></div>`;
}

function widgetMonth(ctx) {
  const { helpers: h, window: w } = ctx;
  const { income, expense } = summarizeWindow(h.txs, w.start, w.end);
  const balance = income - expense;
  return `<div class="fin-hint" style="margin-bottom:8px">🗓 ${escapeHtml(w.label)}</div>
  <div class="fin-stats3">
    <div class="fin-stat fin-in"><span class="fin-stat-label">درآمد</span><strong>${formatMoney(income, h.settings)}</strong></div>
    <div class="fin-stat fin-out"><span class="fin-stat-label">خرج</span><strong>${formatMoney(expense, h.settings)}</strong></div>
    <div class="fin-stat ${balance >= 0 ? 'fin-in' : 'fin-out'}"><span class="fin-stat-label">مانده</span><strong>${formatMoney(balance, h.settings)}</strong></div>
  </div>`;
}

function widgetCashflow(ctx) {
  const { helpers: h } = ctx;
  const series = monthlyCashflow(h.txs, 6);
  if (!series.some((p) => p.income || p.expense)) return `<div class="fin-empty">هنوز تراکنشی ثبت نشده.</div>`;
  return `${svgBars(series)}<div class="fin-legend"><span><i class="fin-dot fin-dot-in"></i>درآمد</span><span><i class="fin-dot fin-dot-out"></i>خرج</span></div>`;
}

function donutSegments(h, w) {
  const rows = sumByCategory(h.txs, 'expense', w.start, w.end);
  const total = rows.reduce((a, r) => a + r.total, 0) || 1;
  return rows.map((r) => {
    const cat = r.categoryId === 'none' ? null : h.catById.get(r.categoryId);
    return {
      name: cat ? cat.name : 'بدون دسته',
      value: r.total,
      color: cat?.color || '#94a3b8',
      pct: Math.round((r.total / total) * 100),
    };
  });
}

function widgetDonut(ctx) {
  const { helpers: h, window: w } = ctx;
  const segs = donutSegments(h, w);
  if (!segs.length) return `<div class="fin-empty">خرجی در این دوره ثبت نشده.</div>`;
  const top = segs.slice(0, 6);
  const rest = segs.slice(6).reduce((a, s) => a + s.value, 0);
  if (rest > 0) {
    const total = segs.reduce((a, s) => a + s.value, 0);
    top.push({ name: 'سایر', value: rest, color: '#94a3b8', pct: Math.round((rest / total) * 100) });
  }
  return `<div class="fin-donut-wrap">${svgDonut(top.map((s) => ({ label: s.name, value: s.value, color: s.color, pct: s.pct })))}
    <ul class="fin-donut-legend">${top.map((s) => `<li><i style="background:${s.color}"></i>${escapeHtml(s.name)}<b>${s.pct}٪</b></li>`).join('')}</ul></div>`;
}

function widgetBudgets(ctx) {
  const { helpers: h, window: w } = ctx;
  const list = h.budgets.filter((b) => b.active !== false);
  if (!list.length) return `<div class="fin-empty">بودجه‌ای تعریف نشده. <button class="fin-link" data-action="goto" data-tab="budgets">ساخت بودجه</button></div>`;
  return `<ul class="fin-mini-list">${list.slice(0, 5).map((b) => {
    const p = budgetProgress(b, h.txs, w);
    const name = b.categoryId === 'all' ? 'کل خرج‌ها' : catName(h.catById, b.categoryId);
    return `<li><div class="fin-mini-row"><span>${escapeHtml(name)}</span><span>${p.pct}٪</span></div>${progressBar(p.pct, p.pct >= 100 ? 'is-over' : p.pct >= 80 ? 'is-warn' : 'is-ok')}</li>`;
  }).join('')}</ul>`;
}

function widgetUpcoming(ctx) {
  const { helpers: h, window: w } = ctx;
  const items = [];
  const now = new Date();
  for (const b of (h.bills || []).filter((b) => b.active !== false).slice(0, 20)) {
    items.push({ date: billNextDue(b, now), text: `💡 ${b.title} — ${formatMoney(b.expected, h.settings)}` });
  }
  for (const d of (h.debts || []).filter((d) => !d.settled && d.dueDate)) {
    items.push({ date: d.dueDate, text: `🤝 ${d.person} — ${formatMoney(debtRemaining(d), h.settings)}` });
  }
  for (const r of (h.recurrings || []).filter((r) => r.active !== false)) {
    items.push({ date: r.nextRun, text: `🔁 ${r.title} — ${formatMoney(r.amount, h.settings)}` });
  }
  const upcoming = items
    .filter((i) => i.date)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(0, 6);
  if (!upcoming.length) return `<div class="fin-empty">سررسید نزدیکی نداری. 🎉</div>`;
  return `<ul class="fin-mini-list">${upcoming.map((i) => {
    const days = Math.ceil((Date.parse(i.date) - now.getTime()) / 86400000);
    const when = days < 0 ? `${-days} روز عقب‌افتاده` : days === 0 ? 'امروز' : days === 1 ? 'فردا' : `${days} روز دیگر`;
    return `<li class="fin-rem ${days < 0 ? 'is-late' : ''}"><span>${escapeHtml(i.text)}</span><b>${escapeHtml(when)}</b></li>`;
  }).join('')}</ul>`;
}

function billNextDue(bill, now = new Date()) {
  const d = new Date(now);
  d.setDate(Math.min(bill.dueDay || 1, 28));
  d.setHours(12, 0, 0, 0);
  if (d < now) d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function widgetRecent(ctx) {
  const { helpers: h } = ctx;
  const recent = [...h.txs].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 5);
  if (!recent.length) return `<div class="fin-empty">تراکنشی ثبت نشده.</div>`;
  return `<ul class="fin-mini-list">${recent.map((t) => `<li><div class="fin-mini-row"><span>${escapeHtml(txIcon(t.type))} ${escapeHtml(t.title)}</span><b class="${t.type === 'income' ? 'fin-in' : t.type === 'expense' ? 'fin-out' : ''}">${t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '⇄'}${formatMoney(t.amount, h.settings)}</b></div></li>`).join('')}</ul>`;
}

function widgetGoals(ctx) {
  const { helpers: h } = ctx;
  const goals = h.goals.filter((g) => !g.done).slice(0, 4);
  if (!goals.length) return `<div class="fin-empty">هدف فعالی نداری.</div>`;
  return `<ul class="fin-mini-list">${goals.map((g) => {
    const saved = goalSaved(g);
    const pct = g.target > 0 ? Math.round((saved / g.target) * 100) : 0;
    return `<li><div class="fin-mini-row"><span>${escapeHtml(g.icon)} ${escapeHtml(g.title)}</span><span>${pct}٪</span></div>${progressBar(Math.min(100, pct), 'is-ok')}</li>`;
  }).join('')}</ul>`;
}

function widgetInsights(ctx) {
  const { helpers: h, window: w } = ctx;
  const tips = buildInsights({
    txs: h.txs,
    window: w,
    prevWindow: { start: w.prevStart, end: w.prevEnd },
    categories: h.categories,
    budgets: h.budgets,
  });
  if (!tips.length) return `<div class="fin-empty">🌱 هرچه بیشتر ثبت کنی، تحلیل‌های دقیق‌تری می‌گیری.</div>`;
  return `<ul class="fin-mini-list">${tips.slice(0, 5).map((t) => `<li class="fin-tip">${escapeHtml(t.icon)} <b>${escapeHtml(t.title)}</b><br /><span class="fin-hint">${escapeHtml(t.desc)}</span></li>`).join('')}</ul>`;
}

/* ================================================================== */
/* تراکنش‌ها                                                             */
/* ================================================================== */

export function renderTxs(ctx) {
  const { helpers: h, state } = ctx;
  const f = state.txFilters;
  const allTags = [...new Set(h.txs.flatMap((t) => t.tags || []))];

  const filtered = filterTxsLocal(h.txs, f);
  const perPage = 40;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  state.txPage = Math.min(Math.max(1, state.txPage), totalPages);
  const pageItems = filtered.slice((state.txPage - 1) * perPage, state.txPage * perPage);

  const sumIn = filtered.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const sumOut = filtered.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  return `
  <div class="fin-toolbar">
    <button class="fin-btn fin-btn-primary" data-action="open-tx-modal" data-type="expense">➕ خرج</button>
    <button class="fin-btn fin-btn-income" data-action="open-tx-modal" data-type="income">➕ درآمد</button>
    <button class="fin-btn" data-action="open-tx-modal" data-type="transfer">🔄 انتقال</button>
    <button class="fin-btn" data-action="open-tpl-modal">⚡ قالب‌ها</button>
    <div class="fin-toolbar-spacer"></div>
    <button class="fin-btn fin-btn-ghost" data-action="export-csv">⬇️ CSV</button>
    <button class="fin-btn fin-btn-ghost" data-action="open-import-modal">⬆️ ایمپورت</button>
  </div>

  <div class="fin-card fin-filters">
    <div class="fin-filter-row">
      <input class="fin-input fin-search" data-filter="q" value="${escapeHtml(f.q)}" placeholder="🔍 جست‌وجو در عنوان، یادداشت، تگ…" />
      <select class="fin-input" data-filter="period">
        ${[['all', 'همه زمان‌ها'], ['today', 'امروز'], ['week', '۷ روز اخیر'], ['month', '۳۰ روز اخیر']].map(([v, l]) => `<option value="${v}" ${f.period === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select class="fin-input" data-filter="sort">
        ${[['newest', 'جدیدترین'], ['oldest', 'قدیمی‌ترین'], ['amountDesc', 'مبلغ نزولی'], ['amountAsc', 'مبلغ صعودی']].map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    <div class="fin-filter-row">
      <select class="fin-input" data-filter="type">
        ${[['all', 'همه انواع'], ['income', '📥 درآمد'], ['expense', '📤 خرج'], ['transfer', '🔄 انتقال']].map(([v, l]) => `<option value="${v}" ${f.type === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select class="fin-input" data-filter="categoryId">
        <option value="all">همه دسته‌ها</option>
        ${h.categories.map((c) => `<option value="${c.id}" ${f.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('')}
      </select>
      <select class="fin-input" data-filter="accountId">
        <option value="all">همه حساب‌ها</option>
        ${h.accounts.map((a) => `<option value="${a.id}" ${f.accountId === a.id ? 'selected' : ''}>${escapeHtml(a.icon)} ${escapeHtml(a.name)}</option>`).join('')}
      </select>
      <select class="fin-input" data-filter="tag">
        <option value="all">همه تگ‌ها</option>
        ${allTags.map((t) => `<option value="${escapeHtml(t)}" ${f.tag === t ? 'selected' : ''}>#${escapeHtml(t)}</option>`).join('')}
      </select>
    </div>
    <div class="fin-filter-row">
      <label class="fin-date-label">از <input type="date" class="fin-input" data-filter="from" value="${escapeHtml(f.from)}" /></label>
      <label class="fin-date-label">تا <input type="date" class="fin-input" data-filter="to" value="${escapeHtml(f.to)}" /></label>
      <select class="fin-input" data-filter="view">
        <option value="">📌 نماهای ذخیره‌شده…</option>
        ${h.views.map((v) => `<option value="${v.id}" ${state.activeViewId === v.id ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
      </select>
      <button class="fin-btn fin-btn-ghost" data-action="save-view">💾 ذخیره نما</button>
      <button class="fin-btn fin-btn-ghost" data-action="clear-filters">✖ پاک‌سازی</button>
    </div>
  </div>

  <div class="fin-tx-summary">
    <span>📥 ${formatMoney(sumIn, h.settings)}</span>
    <span>📤 ${formatMoney(sumOut, h.settings)}</span>
    <span>🧾 ${filtered.length} تراکنش</span>
    <div class="fin-toolbar-spacer"></div>
    <button class="fin-btn fin-btn-ghost fin-btn-sm" data-action="toggle-select">${state.selectMode ? '✔ پایان انتخاب' : '☑ انتخاب چندتایی'}</button>
  </div>

  ${state.selectMode && state.selectedTx.size ? `
  <div class="fin-bulkbar">
    <span>${state.selectedTx.size} انتخاب شده</span>
    <button class="fin-btn fin-btn-sm" data-action="bulk-categorize">🏷 تغییر دسته</button>
    <button class="fin-btn fin-btn-sm fin-btn-danger" data-action="bulk-delete">🗑 حذف</button>
  </div>` : ''}

  <div class="fin-tx-list">
    ${pageItems.length ? renderTxGroups(pageItems, ctx) : `<div class="fin-empty">تراکنشی با این فیلترها نیست. <button class="fin-link" data-action="open-tx-modal" data-type="expense">ثبت اولین تراکنش</button></div>`}
  </div>

  ${totalPages > 1 ? `<div class="fin-pager">
    <button class="fin-btn fin-btn-sm" data-action="tx-page" data-dir="-1" ${state.txPage <= 1 ? 'disabled' : ''}>→ قبلی</button>
    <span>صفحه ${state.txPage} از ${totalPages}</span>
    <button class="fin-btn fin-btn-sm" data-action="tx-page" data-dir="1" ${state.txPage >= totalPages ? 'disabled' : ''}>بعدی ←</button>
  </div>` : ''}`;
}

function filterTxsLocal(txs, f) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const list = txs.filter((t) => {
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.categoryId !== 'all' && t.categoryId !== f.categoryId) return false;
    if (f.accountId !== 'all' && t.accountId !== f.accountId && t.toAccountId !== f.accountId) return false;
    if (f.tag !== 'all' && !(t.tags || []).includes(f.tag)) return false;
    if (f.period === 'today' && Date.parse(t.at) < startOfToday.getTime()) return false;
    if (f.period === 'week' && Date.parse(t.at) < now.getTime() - 7 * 86400000) return false;
    if (f.period === 'month' && Date.parse(t.at) < now.getTime() - 30 * 86400000) return false;
    if (f.from) {
      const from = parseLocalDateInput(f.from);
      if (!Number.isNaN(from) && Date.parse(t.at) < from) return false;
    }
    if (f.to) {
      const to = parseLocalDateInput(f.to);
      if (!Number.isNaN(to) && Date.parse(t.at) > to + 86399999) return false;
    }
    if (f.q) {
      const q = f.q.trim().toLowerCase();
      const hay = `${t.title} ${t.note || ''} ${(t.tags || []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (f.sort === 'oldest') list.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  else if (f.sort === 'amountDesc') list.sort((a, b) => b.amount - a.amount);
  else if (f.sort === 'amountAsc') list.sort((a, b) => a.amount - b.amount);
  else list.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return list;
}

function renderTxGroups(items, ctx) {
  const { helpers: h } = ctx;
  const groups = groupTxsByDay(items);
  return groups.map((g) => `
    <div class="fin-day-group">
      <div class="fin-day-head">${escapeHtml(formatJalali(g.date))} ${g.expense ? `• 📤 ${formatMoney(g.expense, h.settings)}` : ''} ${g.income ? `• 📥 ${formatMoney(g.income, h.settings)}` : ''}</div>
      ${g.items.map((t) => renderTxRow(t, ctx)).join('')}
    </div>`).join('');
}

function renderTxRow(t, ctx) {
  const { helpers: h, state } = ctx;
  const cat = h.catById.get(t.categoryId);
  const acc = h.accountById.get(t.accountId);
  const toAcc = t.toAccountId ? h.accountById.get(t.toAccountId) : null;
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '';
  const cls = t.type === 'income' ? 'fin-in' : t.type === 'expense' ? 'fin-out' : '';
  const sub = t.type === 'transfer'
    ? `${acc ? escapeHtml(acc.name) : '؟'} → ${toAcc ? escapeHtml(toAcc.name) : '؟'}`
    : `${cat ? `${escapeHtml(cat.icon)} ${escapeHtml(cat.name)}` : 'بدون دسته'} • ${acc ? escapeHtml(acc.name) : '؟'}`;
  return `<div class="fin-tx ${state.selectedTx.has(t.id) ? 'is-selected' : ''}" data-tx="${t.id}">
    ${state.selectMode ? `<input type="checkbox" class="fin-check" data-action="tx-check" data-id="${t.id}" ${state.selectedTx.has(t.id) ? 'checked' : ''} />` : ''}
    <div class="fin-tx-main">
      <div class="fin-tx-title">${escapeHtml(txIcon(t.type))} ${escapeHtml(t.title)}</div>
      <div class="fin-tx-sub">${sub}${(t.tags || []).length ? ` • ${t.tags.map((g) => `<span class="fin-tag">#${escapeHtml(g)}</span>`).join(' ')}` : ''}</div>
    </div>
    <div class="fin-tx-amount ${cls}">${sign}${formatMoney(t.amount, h.settings)}</div>
    <div class="fin-tx-actions">
      <button class="fin-icon-btn" data-action="edit-tx" data-id="${t.id}" title="ویرایش">✏️</button>
      <button class="fin-icon-btn" data-action="dup-tx" data-id="${t.id}" title="تکثیر">⧉</button>
      <button class="fin-icon-btn" data-action="iz-tx-attach" data-id="${t.id}" title="رسیدها">📎</button>
      <button class="fin-icon-btn" data-action="del-tx" data-id="${t.id}" title="حذف">🗑</button>
    </div>
  </div>`;
}

/* ================================================================== */
/* بودجه‌ها، اهداف، بدهی‌ها                                               */
/* ================================================================== */

export function renderBudgets(ctx) {
  const { helpers: h, window: w } = ctx;
  const totalB = h.budgets.reduce((a, b) => a + Number(b.amount || 0), 0);
  return `
  <div class="fin-toolbar">
    <button class="fin-btn fin-btn-primary" data-action="open-budget-modal">➕ بودجه جدید</button>
    <div class="fin-toolbar-spacer"></div>
    <span class="fin-hint">🗓 ${escapeHtml(w.label)} • مجموع سقف: ${formatMoney(totalB, h.settings)}</span>
  </div>
  ${h.budgets.length ? `<div class="fin-grid">${h.budgets.map((b) => {
    const p = budgetProgress(b, h.txs, w);
    const cat = b.categoryId === 'all' ? null : h.catById.get(b.categoryId);
    const name = b.categoryId === 'all' ? '🌍 کل خرج‌ها' : `${escapeHtml(cat?.icon || '🏷')} ${escapeHtml(cat?.name || '؟')}`;
    return `<section class="fin-card">
      <div class="fin-card-head"><h3>${name}</h3>
        <div><button class="fin-icon-btn" data-action="edit-budget" data-id="${b.id}">✏️</button>
        <button class="fin-icon-btn" data-action="del-budget" data-id="${b.id}">🗑</button></div>
      </div>
      <div class="fin-budget-nums"><span>خرج: <b class="fin-out">${formatMoney(p.spent, h.settings)}</b></span><span>از ${formatMoney(p.available, h.settings)}</span></div>
      ${progressBar(p.pct, p.pct >= 100 ? 'is-over' : p.pct >= 80 ? 'is-warn' : 'is-ok')}
      <div class="fin-hint">${p.pct >= 100 ? '🚨 بودجه تمام شد!' : `مانده: ${formatMoney(Math.max(0, p.remaining), h.settings)} (${100 - Math.min(100, p.pct)}٪)`}${p.carried ? ` • انتقال‌یافته: ${formatMoney(p.carried, h.settings)}` : ''}</div>
    </section>`;
  }).join('')}</div>` : `<div class="fin-empty">بودجه‌ای نداری. بودجه بساز تا خرجت کنترل شود 🎯</div>`}`;
}

export function renderGoals(ctx) {
  const { helpers: h } = ctx;
  return `
  <div class="fin-toolbar">
    <button class="fin-btn fin-btn-primary" data-action="open-goal-modal">➕ هدف جدید</button>
  </div>
  ${h.goals.length ? `<div class="fin-grid">${h.goals.map((g) => {
    const saved = goalSaved(g);
    const pct = g.target > 0 ? Math.min(100, Math.round((saved / g.target) * 100)) : 0;
    return `<section class="fin-card ${g.done ? 'is-done' : ''}">
      <div class="fin-card-head"><h3>${escapeHtml(g.icon)} ${escapeHtml(g.title)}</h3>
        <div><button class="fin-icon-btn" data-action="edit-goal" data-id="${g.id}">✏️</button>
        <button class="fin-icon-btn" data-action="del-goal" data-id="${g.id}">🗑</button></div>
      </div>
      <div class="fin-budget-nums"><span>${formatMoney(saved, h.settings)}</span><span>از ${formatMoney(g.target, h.settings)}</span></div>
      ${progressBar(pct, 'is-ok')}
      <div class="fin-hint">${g.done ? '🎉 به هدفت رسیدی!' : `${pct}٪ • مانده: ${formatMoney(Math.max(0, g.target - saved), h.settings)}`}${g.deadline ? ` • مهلت: ${escapeHtml(formatJalali(g.deadline))}` : ''}</div>
      ${!g.done ? `<div class="fin-card-actions">
        <button class="fin-btn fin-btn-sm fin-btn-income" data-action="goal-contrib" data-id="${g.id}">💰 واریز</button>
        <button class="fin-btn fin-btn-sm" data-action="goal-withdraw" data-id="${g.id}">برداشت</button>
      </div>` : ''}
    </section>`;
  }).join('')}</div>` : `<div class="fin-empty">هدفی ثبت نشده. یک رویا را به عدد تبدیل کن 🌟</div>`}`;
}

export function renderDebts(ctx) {
  const { helpers: h } = ctx;
  const groups = [
    ['owe', '📤 بدهی‌های من'],
    ['owed', '📥 طلب‌های من'],
    ['loan', '🏦 وام‌ها و اقساط'],
  ];
  const body = groups.map(([type, title]) => {
    const list = h.debts.filter((d) => d.debtType === type);
    if (!list.length) return '';
    return `<h3 class="fin-section-title">${title}</h3><div class="fin-grid">${list.map((d) => {
      const rem = debtRemaining(d);
      const pct = d.total > 0 ? Math.min(100, Math.round(((d.total - rem) / d.total) * 100)) : 100;
      return `<section class="fin-card ${d.settled ? 'is-done' : ''}">
        <div class="fin-card-head"><h3>${escapeHtml(d.person)}${d.title ? ` — ${escapeHtml(d.title)}` : ''}</h3>
          <div><button class="fin-icon-btn" data-action="edit-debt" data-id="${d.id}">✏️</button>
          <button class="fin-icon-btn" data-action="del-debt" data-id="${d.id}">🗑</button></div>
        </div>
        <div class="fin-budget-nums"><span>پرداخت‌شده: ${formatMoney(d.total - rem, h.settings)}</span><span>از ${formatMoney(d.total, h.settings)}</span></div>
        ${progressBar(pct, d.settled ? 'is-ok' : 'is-warn')}
        <div class="fin-hint">${d.settled ? '✅ تسویه شد' : `مانده: ${formatMoney(rem, h.settings)}`}${d.dueDate ? ` • مهلت: ${escapeHtml(formatJalali(d.dueDate))}` : ''}${d.months ? ` • ${d.months} قسط${d.monthlyAmount ? ` × ${formatMoney(d.monthlyAmount, h.settings)}` : ''}` : ''}</div>
        ${!d.settled ? `<div class="fin-card-actions"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="debt-pay" data-id="${d.id}">💵 ثبت پرداخت</button></div>` : ''}
      </section>`;
    }).join('')}</div>`;
  }).join('');
  return `
  <div class="fin-toolbar">
    <button class="fin-btn fin-btn-primary" data-action="open-debt-modal">➕ ثبت بدهی / طلب / وام</button>
  </div>
  ${body || `<div class="fin-empty">بدهی یا طلبی ثبت نشده 🤝</div>`}`;
}

/* ================================================================== */
/* فاکتورها                                                              */
/* ================================================================== */

const INVOICE_BADGES = {
  paid: 'پرداخت‌شده',
  overdue: 'عقب‌افتاده',
  sent: 'ارسال‌شده',
  draft: 'پیش‌نویس',
  cancelled: 'لغوشده',
};

export function renderInvoices(ctx) {
  const { helpers: h } = ctx;
  const list = [...h.invoices].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return `
  <div class="fin-toolbar">
    <button class="fin-btn fin-btn-primary" data-action="open-invoice-modal">➕ فاکتور جدید</button>
  </div>
  ${list.length ? `<div class="fin-grid">${list.map((d) => {
    const { total } = invoiceTotals(d);
    const st = invoiceDisplayStatus(d);
    return `<section class="fin-card">
      <div class="fin-card-head"><h3>📄 ${escapeHtml(d.number || 'بدون شماره')} — ${escapeHtml(d.customer)}</h3>
        <span class="fin-badge fin-badge-${st}">${INVOICE_BADGES[st] || st}</span>
      </div>
      <div class="fin-hint">${(d.items || []).length} قلم • جمع: <b>${formatMoney(total, h.settings)}</b></div>
      <div class="fin-hint">صدور: ${escapeHtml(formatJalali(d.date))}${d.dueDate ? ` • سررسید: ${escapeHtml(formatJalali(d.dueDate))}` : ''}</div>
      <div class="fin-card-actions">
        <button class="fin-btn fin-btn-sm" data-action="invoice-print" data-id="${d.id}">🖨 چاپ</button>
        ${st !== 'paid' && st !== 'cancelled' ? `<button class="fin-btn fin-btn-sm fin-btn-income" data-action="invoice-collect" data-id="${d.id}">💰 وصول</button>` : ''}
        <button class="fin-btn fin-btn-sm" data-action="edit-invoice" data-id="${d.id}">✏️</button>
        <button class="fin-btn fin-btn-sm fin-btn-danger" data-action="del-invoice" data-id="${d.id}">🗑</button>
      </div>
    </section>`;
  }).join('')}</div>` : `<div class="fin-empty">فاکتوری نداری. فاکتور حرفه‌ای بساز و چاپ کن 📄</div>`}`;
}

export function renderInvoicePrint(doc, settings) {
  const { subtotal, discount, tax, total } = invoiceTotals(doc);
  const rows = (doc.items || []).map((it, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(it.desc)}</td><td>${it.qty}</td><td>${formatMoney(it.price, settings)}</td><td>${formatMoney(it.qty * it.price, settings)}</td></tr>`).join('');
  return `<div class="fin-print-doc">
    <h2>فاکتور فروش</h2>
    <div class="fin-print-meta"><span>شماره: <b>${escapeHtml(doc.number || '—')}</b></span><span>تاریخ: ${escapeHtml(formatJalali(doc.date))}</span></div>
    <div class="fin-print-meta"><span>خریدار: <b>${escapeHtml(doc.customer)}</b></span>${doc.dueDate ? `<span>سررسید: ${escapeHtml(formatJalali(doc.dueDate))}</span>` : ''}</div>
    <table class="fin-print-table"><thead><tr><th>#</th><th>شرح</th><th>تعداد</th><th>فی</th><th>مبلغ</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="fin-print-totals"><span>جمع: ${formatMoney(subtotal, settings)}</span>${discount ? `<span>تخفیف: ${formatMoney(discount, settings)}</span>` : ''}${tax ? `<span>مالیات (${doc.taxPercent}٪): ${formatMoney(tax, settings)}</span>` : ''}<strong>قابل پرداخت: ${formatMoney(total, settings)}</strong></div>
    ${doc.note ? `<p class="fin-print-notes">${escapeHtml(doc.note)}</p>` : ''}
  </div>`;
}

/* ================================================================== */
/* قبوض + تکرارشونده‌ها + قوانین                                          */
/* ================================================================== */

export function renderBills(ctx) {
  const { helpers: h } = ctx;
  return `
  <div class="fin-toolbar">
    <button class="fin-btn fin-btn-primary" data-action="open-bill-modal">➕ قبض جدید</button>
    <button class="fin-btn" data-action="open-rec-modal">🔁 تراکنش دوره‌ای</button>
    <button class="fin-btn" data-action="open-rule-modal">🤖 قانون دسته‌بندی</button>
  </div>

  <h3 class="fin-section-title">💡 قبوض</h3>
  ${h.bills.length ? `<div class="fin-grid">${h.bills.map((b) => `
    <section class="fin-card ${b.active !== false ? '' : 'is-muted'}">
      <div class="fin-card-head"><h3>${escapeHtml(b.icon)} ${escapeHtml(b.title)}</h3>
        <div><button class="fin-icon-btn" data-action="edit-bill" data-id="${b.id}">✏️</button>
        <button class="fin-icon-btn" data-action="del-bill" data-id="${b.id}">🗑</button></div>
      </div>
      <div class="fin-hint">مبلغ تقریبی: <b>${formatMoney(b.expected, h.settings)}</b> • سررسید هر ماه شمسی: روز ${b.dueDay}</div>
      <div class="fin-hint">${b.lastPaidAt ? `آخرین پرداخت: ${escapeHtml(formatJalali(b.lastPaidAt))}` : 'هنوز پرداختی ثبت نشده'}</div>
      <div class="fin-card-actions"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="bill-pay" data-id="${b.id}">💵 پرداخت</button></div>
    </section>`).join('')}</div>` : `<div class="fin-empty">قبضی ثبت نشده.</div>`}

  <h3 class="fin-section-title">🔁 تراکنش‌های دوره‌ای (خودکار)</h3>
  ${h.recurrings.length ? `<div class="fin-grid">${h.recurrings.map((r) => `
    <section class="fin-card ${r.active !== false ? '' : 'is-muted'}">
      <div class="fin-card-head"><h3>${escapeHtml(txIcon(r.type))} ${escapeHtml(r.title)}</h3>
        <div><button class="fin-icon-btn" data-action="edit-rec" data-id="${r.id}">✏️</button>
        <button class="fin-icon-btn" data-action="del-rec" data-id="${r.id}">🗑</button></div>
      </div>
      <div class="fin-hint">${r.active !== false ? 'فعال' : 'متوقف'} • ${formatMoney(r.amount, h.settings)} • اجرای بعد: ${escapeHtml(formatJalali(r.nextRun))}</div>
    </section>`).join('')}</div>` : `<div class="fin-empty">تراکنش دوره‌ای نداری.</div>`}

  <h3 class="fin-section-title">🤖 قوانین دسته‌بندی خودکار</h3>
  ${h.rules.length ? `<ul class="fin-mini-list fin-card">${h.rules.map((r) => {
    const cat = h.catById.get(r.categoryId);
    return `<li><div class="fin-mini-row"><span>اگر عنوان شامل «${escapeHtml(r.keyword)}» → ${escapeHtml(cat?.icon || '')} ${escapeHtml(cat?.name || '؟')}</span><button class="fin-icon-btn" data-action="del-rule" data-id="${r.id}">🗑</button></div></li>`;
  }).join('')}</ul>` : `<div class="fin-empty">قانونی تعریف نشده. مثلاً: هر تراکنشی که «اسنپ» دارد → حمل‌ونقل.</div>`}`;
}

/* ================================================================== */
/* گزارش‌ها                                                              */
/* ================================================================== */

export function renderReports(ctx) {
  const { helpers: h, state, window: w } = ctx;
  const months = state.reportPeriod === '1m' ? 1 : state.reportPeriod === '3m' ? 3 : state.reportPeriod === '1y' ? 12 : 6;
  const chart = state.reportChart;
  let body = '';
  if (chart === 'cashflow') {
    const series = monthlyCashflow(h.txs, months);
    body = series.some((p) => p.income || p.expense)
      ? `${svgBars(series)}<div class="fin-legend"><span><i class="fin-dot fin-dot-in"></i>درآمد</span><span><i class="fin-dot fin-dot-out"></i>خرج</span></div>`
      : `<div class="fin-empty">داده‌ای نیست.</div>`;
  } else if (chart === 'donut') {
    const segs = donutSegments(h, w);
    body = segs.length ? renderDonutFull(segs) : `<div class="fin-empty">خرجی در این دوره نیست.</div>`;
  } else if (chart === 'networth') {
    const series = netWorthHistory(h.txs, h.accounts, months).map((p) => ({ label: p.label, value: p.worth }));
    body = `${svgLine(series)}<div class="fin-hint">خالص دارایی ≈ موجودی حساب‌ها در پایان هر ماه شمسی.</div>`;
  } else if (chart === 'calendar') {
    body = renderHeatmap(h);
  } else if (chart === 'compare') {
    body = renderCompare(ctx);
  }
  return `
  <div class="fin-toolbar fin-toolbar-wrap">
    ${[['cashflow', '📊 جریان نقدی'], ['donut', '🍩 تفکیک دسته‌ها'], ['networth', '📈 ارزش خالص'], ['calendar', '🗓 تقویم خرج'], ['compare', '⚖️ مقایسه ماه‌ها']].map(([v, l]) => `<button class="fin-btn fin-btn-sm ${chart === v ? 'fin-btn-primary' : ''}" data-action="report-chart" data-v="${v}">${l}</button>`).join('')}
    <div class="fin-toolbar-spacer"></div>
    ${chart === 'cashflow' || chart === 'networth' ? [['1m', '۱ ماه'], ['3m', '۳ ماه'], ['6m', '۶ ماه'], ['1y', '۱ سال']].map(([v, l]) => `<button class="fin-btn fin-btn-sm ${state.reportPeriod === v ? 'fin-btn-primary' : ''}" data-action="report-period" data-v="${v}">${l}</button>`).join('') : ''}
  </div>
  <section class="fin-card">${body}</section>`;
}

function renderDonutFull(segs) {
  const top = segs.slice(0, 8);
  return `<div class="fin-donut-wrap fin-donut-big">${svgDonut(top.map((s) => ({ label: s.name, value: s.value, color: s.color, pct: s.pct })), 200, 36)}
    <ul class="fin-donut-legend">${top.map((s) => `<li><i style="background:${s.color}"></i>${escapeHtml(s.name)}<b>${s.pct}٪</b></li>`).join('')}</ul></div>`;
}

function renderHeatmap(h) {
  const p = jalaliParts(new Date()) || { jy: 1404, jm: 1 };
  const cells = buildCalendar(h.txs, p.jy, p.jm);
  const max = Math.max(1, ...cells.map((c) => c.expense));
  return `<h3 class="fin-section-title">🗓 ${escapeHtml(jalaliMonthLabel(p.jy, p.jm))}</h3>
  <div class="fin-heat-grid">${['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d) => `<span class="fin-heat-dow">${d}</span>`).join('')}
  ${cells.map((c) => {
    if (!c.inMonth) return `<span class="fin-heat-blank"></span>`;
    const lvl = c.expense <= 0 ? 0 : c.expense / max < 0.25 ? 1 : c.expense / max < 0.5 ? 2 : c.expense / max < 0.75 ? 3 : 4;
    return `<span class="fin-heat-cell fin-heat-${lvl} ${c.isToday ? 'is-today' : ''}" title="خرج ${c.expense.toLocaleString('en-US')} • درآمد ${c.income.toLocaleString('en-US')}"><b>${c.jd}</b></span>`;
  }).join('')}</div>
  <div class="fin-legend"><span>کم</span><span class="fin-heat-cell fin-heat-0"></span><span class="fin-heat-cell fin-heat-1"></span><span class="fin-heat-cell fin-heat-2"></span><span class="fin-heat-cell fin-heat-3"></span><span class="fin-heat-cell fin-heat-4"></span><span>زیاد</span></div>`;
}

function renderCompare(ctx) {
  const { helpers: h } = ctx;
  const rows = monthlyCashflow(h.txs, 6).map((b) => ({ ...b, net: b.income - b.expense }));
  const max = Math.max(1, ...rows.map((r) => r.expense));
  return `<table class="fin-table"><thead><tr><th>ماه</th><th>درآمد</th><th>خرج</th><th>مانده</th><th>نمودار خرج</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td>${escapeHtml(r.label)}</td><td class="fin-in">${formatMoney(r.income, h.settings)}</td><td class="fin-out">${formatMoney(r.expense, h.settings)}</td><td class="${r.net >= 0 ? 'fin-in' : 'fin-out'}">${formatMoney(r.net, h.settings)}</td><td><div class="fin-progress is-warn"><span style="width:${Math.round((r.expense / max) * 100)}%"></span></div></td></tr>`).join('')}
  </tbody></table>`;
}

/* ================================================================== */
/* تنظیمات                                                               */
/* ================================================================== */

const CAT_TYPE_LABELS = { expense: 'خرج', income: 'درآمد', both: 'هر دو' };

export function renderSettings(ctx) {
  const { helpers: h } = ctx;
  const s = h.settings;
  const allTags = [...new Set(h.txs.flatMap((t) => t.tags || []))];
  return `
  <div class="fin-grid">
  <section class="fin-card">
    <div class="fin-card-head"><h3>💱 واحد پول و نمایش</h3></div>
    <div class="fin-form-grid">
      <label>نام واحد پول<input class="fin-input" data-setting="currencySymbol" value="${escapeHtml(s.currencySymbol)}" /></label>
      <label>جایگاه واحد<select class="fin-input" data-setting="symbolPosition"><option value="after" ${s.symbolPosition === 'after' ? 'selected' : ''}>بعد از مبلغ</option><option value="before" ${s.symbolPosition === 'before' ? 'selected' : ''}>قبل از مبلغ</option></select></label>
      <label>اعشار<select class="fin-input" data-setting="decimals"><option value="0" ${Number(s.decimals) === 0 ? 'selected' : ''}>بدون اعشار</option><option value="2" ${Number(s.decimals) === 2 ? 'selected' : ''}>دو رقم</option></select></label>
      <label class="fin-check-label"><input type="checkbox" data-setting="faDigits" ${s.faDigits ? 'checked' : ''} /> اعداد فارسی</label>
      <label>شروع دوره مالی (روز ماه شمسی)<input type="number" min="1" max="29" class="fin-input" data-setting="fiscalStart" value="${Number(s.fiscalStart) || 1}" /></label>
      <label>تم<select class="fin-input" data-setting="theme">${[['emerald', 'زمردی 💚'], ['ocean', 'اقیانوسی 💙'], ['violet', 'بنفش 💜'], ['amber', 'کهربایی 🧡'], ['rose', 'رز 🌹']].map(([v, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>تراکم<select class="fin-input" data-setting="density"><option value="comfortable" ${s.density === 'comfortable' ? 'selected' : ''}>راحت</option><option value="compact" ${s.density === 'compact' ? 'selected' : ''}>فشرده</option></select></label>
    </div>
  </section>

  <section class="fin-card">
    <div class="fin-card-head"><h3>⚡ مبالغ سریع (دکمه‌های ثبت تراکنش)</h3></div>
    <div class="fin-form-grid">
      <label>مبالغ (با کاما جدا کن)<input class="fin-input" data-setting="quickAmounts" value="${escapeHtml((s.quickAmounts || []).join(', '))}" dir="ltr" /></label>
    </div>
    <div class="fin-hint">مثلاً: 50000, 100000, 200000, 500000</div>
  </section>

  <section class="fin-card">
    <div class="fin-card-head"><h3>🏠 ویجت‌های داشبورد</h3></div>
    <ul class="fin-widget-list">
      ${(s.widgets || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((w) => `
        <li><label class="fin-check-label"><input type="checkbox" data-widget-toggle="${escapeHtml(w.id)}" ${w.visible !== false ? 'checked' : ''} /> ${escapeHtml(w.title || w.id)}</label>
        <span><button class="fin-icon-btn" data-action="widget-move" data-id="${escapeHtml(w.id)}" data-dir="-1">⬆️</button><button class="fin-icon-btn" data-action="widget-move" data-id="${escapeHtml(w.id)}" data-dir="1">⬇️</button></span></li>`).join('')}
    </ul>
  </section>

  <section class="fin-card">
    <div class="fin-card-head"><h3>🏦 حساب‌ها</h3><button class="fin-btn fin-btn-sm" data-action="open-account-modal">➕</button></div>
    <ul class="fin-mini-list">${h.accounts.map((a) => `<li><div class="fin-mini-row"><span>${escapeHtml(a.icon)} ${escapeHtml(a.name)} <small class="fin-hint">${escapeHtml(ACCOUNT_TYPE_LABELS[a.accType] || a.accType)}</small></span><span><button class="fin-icon-btn" data-action="edit-account" data-id="${a.id}">✏️</button><button class="fin-icon-btn" data-action="del-account" data-id="${a.id}">🗑</button></span></div></li>`).join('')}</ul>
  </section>

  <section class="fin-card">
    <div class="fin-card-head"><h3>🏷 دسته‌ها</h3><button class="fin-btn fin-btn-sm" data-action="open-cat-modal">➕</button></div>
    <ul class="fin-mini-list fin-cat-list">${h.categories.map((c) => `<li><div class="fin-mini-row"><span><i class="fin-dot" style="background:${c.color}"></i>${escapeHtml(c.icon)} ${escapeHtml(c.name)} <small class="fin-hint">${CAT_TYPE_LABELS[c.type] || c.type}</small></span><span><button class="fin-icon-btn" data-action="edit-cat" data-id="${c.id}">✏️</button><button class="fin-icon-btn" data-action="del-cat" data-id="${c.id}">🗑</button></span></div></li>`).join('')}</ul>
  </section>

  <section class="fin-card">
    <div class="fin-card-head"><h3>#️⃣ تگ‌ها (${allTags.length})</h3></div>
    <div class="fin-tag-cloud">${allTags.length ? allTags.map((t) => `<span class="fin-tag">#${escapeHtml(t)}</span>`).join(' ') : '<span class="fin-hint">تگی ثبت نشده.</span>'}</div>
  </section>

  <section class="fin-card">
    <div class="fin-card-head"><h3>💾 بکاپ و داده</h3></div>
    <div class="fin-card-actions fin-card-actions-col">
      <button class="fin-btn" data-action="export-json">⬇️ دانلود بکاپ کامل (JSON)</button>
      <button class="fin-btn" data-action="open-restore-modal">⬆️ بازیابی از بکاپ</button>
      <button class="fin-btn" data-action="export-csv">⬇️ خروجی CSV تراکنش‌ها</button>
      <button class="fin-btn" data-action="gen-demo">🎲 ساخت داده نمایشی</button>
      <button class="fin-btn fin-btn-danger" data-action="wipe-data">🗑 پاک‌سازی همه داده‌های مالی</button>
    </div>
  </section>
  </div>`;
}
