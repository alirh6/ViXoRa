// 🏦 ViXoRa Loan Lab — آزمایشگاه وام و بدهی: اقساط، سود، گلوله‌برفی/بهمنی
import {
  escapeHtml, formatMoney, faDigits, debtPaid, debtRemaining, toLocalDateInput,
} from '../../../core/schemas/finance-schema.js';
import { drawFinDonut, drawFinHBars, drawFinSpark } from './fin-charts.js';

const UI_KEY = 'ViXoRa:fin-loans-ui';
const TERMS_KEY = 'ViXoRa:fin-loan-terms';

function loadUi() {
  try {
    return {
      view: 'overview', debtId: '', extra: '', simRate: '18', simMonths: '12', simExtra: '',
      strategy: 'avalanche', payoffExtra: '', ...JSON.parse(localStorage.getItem(UI_KEY) || '{}'),
    };
  } catch { return { view: 'overview', debtId: '', extra: '', simRate: '18', simMonths: '12', simExtra: '', strategy: 'avalanche', payoffExtra: '' }; }
}
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* ignore */ }
  return u;
}
function loadTerms() { try { return JSON.parse(localStorage.getItem(TERMS_KEY) || '{}'); } catch { return {}; } }
function saveTerms(t) { try { localStorage.setItem(TERMS_KEY, JSON.stringify(t)); } catch { /* ignore */ } }
export function getLoanTerms(debtId) {
  const t = loadTerms()[String(debtId)] || {};
  return { rate: Number(t.rate) || 0, extra: Number(t.extra) || 0, startMonth: t.startMonth || '' };
}
export function setLoanTerms(debtId, patch) {
  const all = loadTerms();
  all[String(debtId)] = { ...(all[String(debtId)] || {}), ...patch };
  saveTerms(all);
}

/* ---------- ریاضیات وام ---------- */
export function monthlyPayment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  if (!annualRate) return principal / months;
  const r = annualRate / 100 / 12;
  const k = Math.pow(1 + r, months);
  return (principal * r * k) / (k - 1);
}

export function amortization(principal, annualRate, months, extraMonthly = 0, startDate = null) {
  const rows = [];
  let bal = principal;
  const r = annualRate / 100 / 12;
  const base = monthlyPayment(principal, annualRate, months);
  const pmt = base + Math.max(0, extraMonthly);
  let totalInterest = 0;
  for (let m = 1; m <= months * 3 && bal > 0.005; m++) {
    const interest = bal * r;
    let pay = Math.min(pmt, bal + interest);
    const princ = Math.max(0, pay - interest);
    bal = Math.max(0, bal - princ);
    totalInterest += interest;
    const d = startDate ? new Date(startDate) : new Date();
    d.setMonth(d.getMonth() + m);
    rows.push({ n: m, date: d.toISOString(), pay, princ, interest, bal });
    if (m > 600) break;
  }
  return { rows, base, totalInterest, monthsUsed: rows.length, totalPaid: rows.reduce((a, x) => a + x.pay, 0) };
}

/** شبیه‌سازی بازپرداخت چند بدهی با استراتژی */
export function payoffPlan(debts, termsMap, monthlyBudget, strategy = 'avalanche') {
  const items = debts.map((d) => ({
    id: d.id, title: d.person || d.title || 'بدهی',
    bal: debtRemaining(d),
    rate: Number(termsMap[String(d.id)]?.rate) || 0,
    minPay: Number(d.monthlyAmount) || 0,
  })).filter((x) => x.bal > 0);
  if (!items.length || monthlyBudget <= 0) return { months: 0, interest: 0, order: [], timeline: [] };
  const order = [...items].sort((a, b) =>
    strategy === 'snowball' ? a.bal - b.bal : b.rate - a.rate || a.bal - b.bal
  );
  const bals = new Map(items.map((x) => [x.id, x.bal]));
  let interest = 0, m = 0;
  const timeline = [];
  const guard = 1200;
  while ([...bals.values()].some((b) => b > 0.005) && m < guard) {
    m++;
    let budget = monthlyBudget;
    // حداقل‌ها
    for (const o of order) {
      const b = bals.get(o.id);
      if (b <= 0.005) continue;
      const r = o.rate / 100 / 12;
      const it = b * r;
      interest += it;
      const nb = b + it;
      const pay = Math.min(budget, Math.max(o.minPay, it + 1), nb);
      bals.set(o.id, Math.max(0, nb - pay));
      budget -= pay;
    }
    // مازاد به هدف اول
    for (const o of order) {
      if (budget <= 0.005) break;
      const b = bals.get(o.id);
      if (b <= 0.005) continue;
      const pay = Math.min(budget, b);
      bals.set(o.id, b - pay);
      budget -= pay;
    }
    timeline.push({ m, total: [...bals.values()].reduce((a, b) => a + b, 0) });
  }
  return { months: m, interest, order: order.map((o) => o.title), timeline };
}

/* ---------- رندر ---------- */
const VIEWS = [
  { id: 'overview', label: '🏦 نمای کلی' },
  { id: 'detail', label: '📑 جدول اقساط' },
  { id: 'sim', label: '🧮 شبیه‌ساز وام' },
  { id: 'strategy', label: '⚔️ استراتژی بازپرداخت' },
  { id: 'calendar', label: '🗓 تقویم اقساط' },
];

export function renderLoansView(ctx, api) {
  const { helpers } = ctx;
  const ui = loadUi();
  const debts = (helpers.debts || []).filter((d) => !d.settled);
  const tabs = VIEWS.map((v) =>
    `<button class="fin-btn fin-btn-sm ${ui.view === v.id ? 'fin-btn-primary' : ''}" data-action="ln-view" data-v="${v.id}">${v.label}</button>`
  ).join('');
  let body = '';
  if (ui.view === 'detail') body = debts.length ? renderDetail(ctx, api, ui) : emptyDebts();
  else if (ui.view === 'sim') body = renderSim(ctx, api, ui);
  else if (ui.view === 'strategy') body = renderStrategy(ctx, api, ui);
  else if (ui.view === 'calendar') body = renderCalendar(ctx, api, ui);
  else body = renderOverview(ctx, api, ui);
  return `<div class="fin-secbar"><h3>🏦 آزمایشگاه وام و بدهی</h3><div class="fin-secbar-actions">${tabs}</div></div>${body}`;
}

function emptyDebts() {
  return `<div class="fin-panel"><div class="fin-empty">🤝 بدهی فعالی نیست.<br /><button class="fin-btn fin-btn-primary" data-action="open-debt-modal" style="margin-top:10px">➕ ثبت بدهی / وام</button></div></div>`;
}

function renderOverview(ctx, api, ui) {
  const { helpers, state } = ctx;
  const s = state.settings;
  const debts = (helpers.debts || []).filter((d) => !d.settled);
  if (!debts.length) return emptyDebts();
  const terms = loadTerms();
  const total = debts.reduce((a, d) => a + debtRemaining(d), 0);
  const paid = debts.reduce((a, d) => a + debtPaid(d), 0);
  const monthlyMin = debts.reduce((a, d) => a + (Number(d.monthlyAmount) || 0), 0);
  const weightedRate = total ? debts.reduce((a, d) => a + debtRemaining(d) * (Number(terms[String(d.id)]?.rate) || 0), 0) / total : 0;
  const cards = debts.map((d) => {
    const rem = debtRemaining(d);
    const t = terms[String(d.id)] || {};
    const pct = d.total ? Math.round((debtPaid(d) / d.total) * 100) : 0;
    return `<div class="fin-loan-card">
      <div class="fin-loan-head"><b>${escapeHtml(d.person || d.title || 'بدهی')}</b>
        <span class="fin-badge">${d.debtType === 'loan' ? '🏦 وام' : d.debtType === 'lend' ? '📤 طلب' : '📥 بدهی'}</span></div>
      <div class="fin-loan-amount">${formatMoney(rem, s)} <small>مانده از ${formatMoney(d.total, s)}</small></div>
      <div class="fin-progress"><i style="width:${pct}%"></i></div>
      <div class="fin-loan-meta">
        <span>📊 ${faDigits(String(pct))}٪ پرداخت</span>
        <span>💸 سود: ${faDigits(String(t.rate || 0))}٪</span>
        ${d.monthlyAmount ? `<span>🗓 قسط: ${formatMoney(d.monthlyAmount, s)}</span>` : ''}
        ${d.dueDate ? `<span>⏰ ${new Date(d.dueDate).toLocaleDateString('fa-IR')}</span>` : ''}
      </div>
      <div class="fin-btn-row">
        <button class="fin-btn fin-btn-sm" data-action="ln-open" data-id="${d.id}">📑 جدول اقساط</button>
        <button class="fin-btn fin-btn-sm" data-action="ln-terms" data-id="${d.id}">⚙️ سود و شرایط</button>
        <button class="fin-btn fin-btn-sm" data-action="debt-pay" data-id="${d.id}">💰 پرداخت</button>
      </div>
    </div>`;
  }).join('');
  return `
  <div class="fin-kpis">
    <div class="fin-kpi"><span>💰 کل مانده</span><b>${formatMoney(total, s)}</b></div>
    <div class="fin-kpi"><span>✅ پرداخت‌شده</span><b>${formatMoney(paid, s)}</b></div>
    <div class="fin-kpi"><span>🗓 حداقل قسط ماهانه</span><b>${formatMoney(monthlyMin, s)}</b></div>
    <div class="fin-kpi"><span>📊 میانگین سود وزنی</span><b>${faDigits(weightedRate.toFixed(1))}٪</b></div>
  </div>
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>🍩 سهم هر بدهی از مانده</h4><canvas data-ln="donut" height="190"></canvas></div>
    <div class="fin-panel"><h4>📊 مانده بدهی‌ها</h4><canvas data-ln="bars" height="190"></canvas></div>
  </div>
  <div class="fin-loan-grid">${cards}</div>`;
}

function currentDebt(ctx, ui) {
  const debts = (ctx.helpers.debts || []).filter((d) => !d.settled);
  return debts.find((d) => String(d.id) === String(ui.debtId)) || debts[0] || null;
}

function renderDetail(ctx, api, ui) {
  const { state } = ctx;
  const s = state.settings;
  const debts = (ctx.helpers.debts || []).filter((d) => !d.settled);
  const d = currentDebt(ctx, ui);
  if (!d) return emptyDebts();
  const terms = getLoanTerms(d.id);
  const rem = debtRemaining(d);
  const months = d.months || 12;
  const sched = amortization(rem, terms.rate, months, terms.extra, d.startDate || Date.now());
  const noExtra = amortization(rem, terms.rate, months, 0, d.startDate || Date.now());
  const saveInterest = noExtra.totalInterest - sched.totalInterest;
  const saveMonths = noExtra.monthsUsed - sched.monthsUsed;
  const opts = debts.map((x) => `<option value="${x.id}" ${String(x.id) === String(d.id) ? 'selected' : ''}>${escapeHtml(x.person || x.title || '')}</option>`).join('');
  const rows = sched.rows.slice(0, 120).map((r) => `<tr>
      <td>${faDigits(String(r.n))}</td>
      <td>${new Date(r.date).toLocaleDateString('fa-IR')}</td>
      <td>${formatMoney(r.pay, s)}</td>
      <td class="fin-pos">${formatMoney(r.princ, s)}</td>
      <td class="fin-neg">${formatMoney(r.interest, s)}</td>
      <td>${formatMoney(r.bal, s)}</td>
    </tr>`).join('');
  return `
  <div class="fin-panel"><div class="fin-form-grid">
    <label>بدهی<select data-ln="debt-sel">${opts}</select></label>
    <label>نرخ سود سالانه (٪)<input data-ln="rate" type="number" min="0" max="100" step="0.5" value="${terms.rate}" /></label>
    <label>پرداخت اضافه ماهانه<input data-ln="extra" type="number" min="0" step="any" value="${terms.extra || ''}" placeholder="مثلاً ۵۰۰٬۰۰۰" /></label>
  </div>
  <div class="fin-btn-row">
    <button class="fin-btn fin-btn-sm fin-btn-primary" data-action="ln-save-terms" data-id="${d.id}">💾 ذخیره شرایط</button>
    <button class="fin-btn fin-btn-sm" data-action="ln-export-sched" data-id="${d.id}">📥 خروجی CSV جدول</button>
  </div></div>
  <div class="fin-kpis">
    <div class="fin-kpi"><span>💵 قسط پایه ماهانه</span><b>${formatMoney(sched.base, s)}</b></div>
    <div class="fin-kpi"><span>📅 مدت بازپرداخت</span><b>${faDigits(String(sched.monthsUsed))} ماه</b></div>
    <div class="fin-kpi"><span>💸 کل سود پرداختی</span><b>${formatMoney(sched.totalInterest, s)}</b></div>
    <div class="fin-kpi"><span>💎 صرفه‌جویی با پرداخت اضافه</span><b>${formatMoney(Math.max(0, saveInterest), s)}${saveMonths > 0 ? ` • ${faDigits(String(saveMonths))} ماه زودتر` : ''}</b></div>
  </div>
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>🥧 اصل در برابر سود</h4><canvas data-ln="pi" height="170"></canvas></div>
    <div class="fin-panel"><h4>📉 مانده در طول زمان</h4><canvas data-ln="spark" height="170"></canvas></div>
  </div>
  <div class="fin-panel"><h4>📑 جدول اقساط (${faDigits(String(sched.rows.length))} قسط)</h4>
    <div class="fin-table-wrap"><table class="fin-table"><thead><tr><th>#</th><th>تاریخ</th><th>قسط</th><th>اصل</th><th>سود</th><th>مانده</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    ${sched.rows.length > 120 ? `<div class="fin-hint">نمایش ۱۲۰ قسط اول.</div>` : ''}</div>`;
}

function renderSim(ctx, api, ui) {
  const s = ctx.state.settings;
  const amount = Number(ui.simAmount) || 50000000;
  const rate = Number(ui.simRate) || 0;
  const months = Math.max(1, Math.min(360, Number(ui.simMonths) || 12));
  const extra = Number(ui.simExtra) || 0;
  const sched = amortization(amount, rate, months, extra);
  const noExtra = amortization(amount, rate, months, 0);
  return `
  <div class="fin-panel"><h4>🧮 شبیه‌ساز وام جدید</h4>
    <div class="fin-form-grid">
      <label>مبلغ وام<input data-ln="sim-amount" type="number" min="0" step="any" value="${amount}" /></label>
      <label>نرخ سود سالانه (٪)<input data-ln="sim-rate" type="number" min="0" max="100" step="0.5" value="${rate}" /></label>
      <label>مدت (ماه)<input data-ln="sim-months" type="number" min="1" max="360" value="${months}" /></label>
      <label>پرداخت اضافه ماهانه<input data-ln="sim-extra" type="number" min="0" step="any" value="${ui.simExtra || ''}" /></label>
    </div>
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="ln-sim-run">🧮 محاسبه</button>
    <button class="fin-btn fin-btn-sm" data-action="ln-sim-create">➕ ثبت این وام به‌عنوان بدهی</button></div>
  </div>
  <div class="fin-kpis">
    <div class="fin-kpi"><span>💵 قسط ماهانه</span><b>${formatMoney(sched.base + extra, s)}</b></div>
    <div class="fin-kpi"><span>📅 مدت واقعی</span><b>${faDigits(String(sched.monthsUsed))} ماه</b></div>
    <div class="fin-kpi"><span>💸 کل سود</span><b>${formatMoney(sched.totalInterest, s)}</b></div>
    <div class="fin-kpi"><span>💎 صرفه با پرداخت اضافه</span><b>${formatMoney(Math.max(0, noExtra.totalInterest - sched.totalInterest), s)}</b></div>
  </div>
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>🥧 اصل در برابر سود</h4><canvas data-ln="sim-pi" height="170"></canvas></div>
    <div class="fin-panel"><h4>📉 مسیر مانده</h4><canvas data-ln="sim-spark" height="170"></canvas></div>
  </div>`;
}

function renderStrategy(ctx, api, ui) {
  const s = ctx.state.settings;
  const debts = (ctx.helpers.debts || []).filter((d) => !d.settled && debtRemaining(d) > 0);
  if (!debts.length) return emptyDebts();
  const terms = loadTerms();
  const budget = Number(ui.payoffExtra) || debts.reduce((a, d) => a + (Number(d.monthlyAmount) || 0), 0) || 1000000;
  const strategy = ui.strategy || 'avalanche';
  const plan = payoffPlan(debts, terms, budget, strategy);
  const other = payoffPlan(debts, terms, budget, strategy === 'avalanche' ? 'snowball' : 'avalanche');
  const order = plan.order.map((t, i) => `<div class="fin-order-row"><b class="fin-num">${faDigits(String(i + 1))}</b><span>${escapeHtml(t)}</span></div>`).join('');
  return `
  <div class="fin-panel"><h4>⚔️ استراتژی بازپرداخت چند بدهی</h4>
    <div class="fin-btn-row">
      <button class="fin-chip ${strategy === 'avalanche' ? 'is-on' : ''}" data-action="ln-strategy" data-v="avalanche">🏔 بهمنی (سود بالا اول — ارزان‌تر)</button>
      <button class="fin-chip ${strategy === 'snowball' ? 'is-on' : ''}" data-action="ln-strategy" data-v="snowball">⛄ گلوله‌برفی (مانده کم اول — انگیزشی)</button>
    </div>
    <div class="fin-form-grid"><label>بودجه ماهانه بازپرداخت<input data-ln="budget" type="number" min="0" step="any" value="${budget}" /></label></div>
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="ln-plan-run">⚔️ محاسبه نقشه</button></div>
  </div>
  <div class="fin-kpis">
    <div class="fin-kpi"><span>📅 آزادی از بدهی در</span><b>${faDigits(String(plan.months))} ماه (${faDigits((plan.months / 12).toFixed(1))} سال)</b></div>
    <div class="fin-kpi"><span>💸 کل سود پرداختی</span><b>${formatMoney(plan.interest, s)}</b></div>
    <div class="fin-kpi"><span>⚖️ اختلاف با روش دیگر</span><b>${formatMoney(Math.abs(other.interest - plan.interest), s)}</b></div>
  </div>
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>🏁 ترتیب بازپرداخت</h4>${order}</div>
    <div class="fin-panel"><h4>📉 مسیر آزادی از بدهی</h4><canvas data-ln="plan-spark" height="170"></canvas>
      <div class="fin-hint">پایان: ${plan.timeline.length ? new Date(Date.now() + plan.months * 30 * 864e5).toLocaleDateString('fa-IR') : '—'}</div></div>
  </div>`;
}

function renderCalendar(ctx, api) {
  const s = ctx.state.settings;
  const debts = (ctx.helpers.debts || []).filter((d) => !d.settled && Number(d.monthlyAmount) > 0);
  const terms = loadTerms();
  const events = [];
  for (const d of debts) {
    const rem = debtRemaining(d);
    const t = terms[String(d.id)] || {};
    const sched = amortization(rem, Number(t.rate) || 0, 360, 0, d.startDate || Date.now());
    // فقط ۱۲ قسط آینده که قسطش با حداقل ماهانه سازگار است
    for (const r of sched.rows.slice(0, 12)) {
      events.push({ date: new Date(r.date), title: d.person || d.title, amount: d.monthlyAmount });
    }
  }
  events.sort((a, b) => a.date - b.date);
  const byMonth = new Map();
  for (const e of events) {
    const k = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    if (!byMonth.has(k)) byMonth.set(k, { d: e.date, items: [] });
    byMonth.get(k).items.push(e);
  }
  const blocks = [...byMonth.values()].slice(0, 12).map(({ d, items }) => `
    <div class="fin-panel"><h4>🗓 ${d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })} — جمع: ${formatMoney(items.reduce((a, x) => a + x.amount, 0), s)}</h4>
    ${items.map((e) => `<div class="fin-cal-row"><span>${e.date.toLocaleDateString('fa-IR', { day: 'numeric', weekday: 'long' })}</span><b>${escapeHtml(e.title || '')}</b><span>${formatMoney(e.amount, s)}</span></div>`).join('')}</div>`).join('');
  return debts.length ? blocks : `<div class="fin-panel"><div class="fin-empty">🗓 بدهی قسطی فعالی نیست.</div></div>`;
}

/* ---------- پس از رندر ---------- */
export function afterLoansRender(root, ctx) {
  const { helpers, state } = ctx;
  const s = state.settings;
  const ui = loadUi();
  const debts = (helpers.debts || []).filter((d) => !d.settled);
  const donut = root.querySelector('[data-ln="donut"]');
  if (donut) drawFinDonut(donut, debts.map((d) => ({ label: d.person || d.title, value: debtRemaining(d) })));
  const bars = root.querySelector('[data-ln="bars"]');
  if (bars) drawFinHBars(bars, debts.map((d) => ({ label: d.person || d.title, value: debtRemaining(d) })));
  const d = currentDebt(ctx, ui);
  const terms = d ? getLoanTerms(d.id) : { rate: 0, extra: 0 };
  const sched = d ? amortization(debtRemaining(d), terms.rate, d.months || 12, terms.extra) : null;
  const pi = root.querySelector('[data-ln="pi"]');
  if (pi && sched) drawFinDonut(pi, [
    { label: 'اصل', value: debtRemaining(d), color: '#34d399' },
    { label: 'سود', value: sched.totalInterest, color: '#f43f5e' },
  ]);
  const spark = root.querySelector('[data-ln="spark"]');
  if (spark && sched) {
    const rows = sched.rows.filter((_, i) => i % Math.ceil(sched.rows.length / 40) === 0);
    drawFinSpark(spark, rows.map((r) => r.bal), { h: 170 });
  }
  const simPi = root.querySelector('[data-ln="sim-pi"]');
  if (simPi) {
    const amount = Number(ui.simAmount) || 50000000;
    const sc = amortization(amount, Number(ui.simRate) || 0, Math.max(1, Number(ui.simMonths) || 12), Number(ui.simExtra) || 0);
    drawFinDonut(simPi, [
      { label: 'اصل', value: amount, color: '#34d399' },
      { label: 'سود', value: sc.totalInterest, color: '#f43f5e' },
    ]);
    const simSpark = root.querySelector('[data-ln="sim-spark"]');
    if (simSpark) drawFinSpark(simSpark, sc.rows.filter((_, i) => i % Math.ceil(sc.rows.length / 40) === 0).map((r) => r.bal), { h: 170 });
  }
  const planSpark = root.querySelector('[data-ln="plan-spark"]');
  if (planSpark) {
    const act = debts.filter((x) => debtRemaining(x) > 0);
    const budget = Number(ui.payoffExtra) || act.reduce((a, x) => a + (Number(x.monthlyAmount) || 0), 0) || 1000000;
    const plan = payoffPlan(act, loadTerms(), budget, ui.strategy || 'avalanche');
    drawFinSpark(planSpark, plan.timeline.map((t) => t.total), { h: 170, color: '#8b5cf6' });
  }
}



/* ---------- اکشن‌ها ---------- */
export async function handleLoansAction(action, el, api) {
  const { ctx, root, toast, refresh, openModal } = api;
  const ui = loadUi();
  switch (action) {
    case 'ln-view': saveUi({ view: el.dataset.v || 'overview' }); api.renderContent(); return true;
    case 'ln-open': saveUi({ view: 'detail', debtId: el.dataset.id }); api.renderContent(); return true;
    case 'ln-terms': openModal(termsModal(ctx, el.dataset.id)); return true;
    case 'ln-terms-save': {
      const form = el.closest('form');
      const id = form?.dataset.id;
      if (!id) return true;
      const rate = Number(form.querySelector('[name="rate"]')?.value) || 0;
      const extra = Number(form.querySelector('[name="extra"]')?.value) || 0;
      setLoanTerms(id, { rate: Math.max(0, Math.min(100, rate)), extra: Math.max(0, extra) });
      api.closeModal();
      toast('💾 شرایط ذخیره شد.');
      api.renderContent();
      return true;
    }
    case 'ln-save-terms': {
      const id = el.dataset.id;
      const rate = Number(root.querySelector('[data-ln="rate"]')?.value) || 0;
      const extra = Number(root.querySelector('[data-ln="extra"]')?.value) || 0;
      setLoanTerms(id, { rate: Math.max(0, Math.min(100, rate)), extra: Math.max(0, extra) });
      toast('💾 شرایط ذخیره شد.');
      api.renderContent();
      return true;
    }
    case 'ln-export-sched': {
      const d = (ctx.helpers.debts || []).find((x) => String(x.id) === String(el.dataset.id));
      if (!d) return true;
      const t = getLoanTerms(d.id);
      const sched = amortization(debtRemaining(d), t.rate, d.months || 12, t.extra, d.startDate || Date.now());
      const lines = ['n,date,pay,principal,interest,balance'];
      sched.rows.forEach((r) => lines.push([r.n, toLocalDateInput(r.date), Math.round(r.pay), Math.round(r.princ), Math.round(r.interest), Math.round(r.bal)].join(',')));
      downloadCsv(`amortization-${d.id}.csv`, '﻿' + lines.join('\n'));
      toast('📥 فایل CSV دانلود شد.');
      return true;
    }
    case 'ln-sim-run': {
      saveUi({
        simAmount: root.querySelector('[data-ln="sim-amount"]')?.value || '',
        simRate: root.querySelector('[data-ln="sim-rate"]')?.value || '0',
        simMonths: root.querySelector('[data-ln="sim-months"]')?.value || '12',
        simExtra: root.querySelector('[data-ln="sim-extra"]')?.value || '',
      });
      api.renderContent();
      return true;
    }
    case 'ln-sim-create': {
      const u2 = loadUi();
      const amount = Number(u2.simAmount) || 0;
      if (amount <= 0) { toast('❌ مبلغ وام معتبر نیست.'); return true; }
      const { createDebt } = await import('../../../core/services/finance-service.js');
      const months = Math.max(1, Math.min(360, Number(u2.simMonths) || 12));
      const pmt = monthlyPayment(amount, Number(u2.simRate) || 0, months);
      const debt = await createDebt({ debtType: 'loan', person: 'وام جدید', title: 'وام شبیه‌سازی‌شده', total: amount, months, monthlyAmount: Math.round(pmt), startDate: new Date().toISOString() });
      setLoanTerms(debt.id, { rate: Number(u2.simRate) || 0 });
      await refresh(false);
      saveUi({ view: 'detail', debtId: debt.id });
      toast('🏦 وام ثبت شد.');
      api.renderContent();
      return true;
    }
    case 'ln-strategy': saveUi({ strategy: el.dataset.v }); api.renderContent(); return true;
    case 'ln-plan-run': {
      saveUi({ payoffExtra: root.querySelector('[data-ln="budget"]')?.value || '' });
      api.renderContent();
      return true;
    }
    default: return false;
  }
}

export function handleLoansChange(el, api) {
  if (el.matches?.('[data-ln="debt-sel"]')) {
    saveUi({ debtId: el.value });
    api.renderContent();
    return true;
  }
  return false;
}

function termsModal(ctx, debtId) {
  const d = (ctx.helpers.debts || []).find((x) => String(x.id) === String(debtId));
  if (!d) return '';
  const t = getLoanTerms(debtId);
  return `<div class="fin-modal" data-close-modal>
    <div class="fin-modal-panel" role="dialog" aria-label="شرایط وام">
      <button class="modal-x" data-close-modal>✕</button>
      <h3>⚙️ سود و شرایط: ${escapeHtml(d.person || d.title || '')}</h3>
      <form data-form="__none" data-id="${d.id}" onsubmit="return false">
        <div class="fin-form-grid">
          <label>نرخ سود سالانه (٪)<input name="rate" type="number" min="0" max="100" step="0.5" value="${t.rate}" /></label>
          <label>پرداخت اضافه ماهانه<input name="extra" type="number" min="0" step="any" value="${t.extra || ''}" /></label>
        </div>
        <div class="fin-hint">💡 این محاسبات تحلیلی‌اند و موجودی حساب‌ها را تغییر نمی‌دهند. پرداخت واقعی از دکمه «💰 پرداخت» ثبت می‌شود.</div>
        <div class="fin-btn-row">
          <button type="button" class="fin-btn fin-btn-primary" data-action="ln-terms-save">💾 ذخیره</button>
          <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        </div>
      </form>
    </div>
  </div>`;
}

function downloadCsv(name, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
