// 🔮 ViXoRa Forecast — پیش‌بینی جریان نقدی، ران‌وی، سناریوهای چی‌اگه، حق‌واقع
import {
  escapeHtml, formatMoney, faDigits, advanceRecurringDate,
} from '../../../core/schemas/finance-schema.js';
import { drawFinForecast, drawFinSpark, drawFinRing, drawFinWaterfall, drawFinVBars } from './fin-charts.js';

const UI_KEY = 'ViXoRa:fin-forecast-ui';
const SCEN_KEY = 'ViXoRa:fin-scenarios';

function loadUi() {
  try {
    return {
      view: 'runway', months: '6', cutPct: '10', saveTarget: '', retireAge: '', whatif: [], ...JSON.parse(localStorage.getItem(UI_KEY) || '{}'),
    };
  } catch { return { view: 'runway', months: '6', cutPct: '10', saveTarget: '', retireAge: '', whatif: [] }; }
}
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* ignore */ }
  return u;
}
function loadScenarios() { try { return JSON.parse(localStorage.getItem(SCEN_KEY) || '[]'); } catch { return []; } }
function saveScenarios(s) { try { localStorage.setItem(SCEN_KEY, JSON.stringify(s.slice(0, 20))); } catch { /* ignore */ } }

const MONTHS_FA = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/* ---------- موتور پیش‌بینی ---------- */
export function monthlyAverages(txs, monthsBack = 3) {
  const since = Date.now() - monthsBack * 30 * 864e5;
  let inc = 0, exp = 0;
  for (const t of txs || []) {
    const at = Date.parse(t.date || t.createdAt || 0) || 0;
    if (at < since) continue;
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') inc += amt;
    else if (t.type === 'expense') exp += amt;
  }
  return { income: inc / monthsBack, expense: exp / monthsBack, net: (inc - exp) / monthsBack };
}

export function projectRecurrings(recurrings, monthsAhead = 6) {
  // خروجی: آرایه ماهانه {income, expense} از روی دوره‌ای‌های فعال
  const out = Array.from({ length: monthsAhead }, () => ({ income: 0, expense: 0 }));
  for (const r of recurrings || []) {
    if (r.active === false || !(Number(r.amount) > 0)) continue;
    let next = Date.parse(r.nextRun || 0) || Date.now();
    const guard = monthsAhead * 31 + 10;
    for (let i = 0; i < guard; i++) {
      const mi = monthIndex(next);
      if (mi >= 0 && mi < monthsAhead) {
        if (r.type === 'income') out[mi].income += Number(r.amount);
        else out[mi].expense += Number(r.amount);
      }
      if (mi >= monthsAhead) break;
      next = Date.parse(advanceRecurringDate(new Date(next).toISOString(), r.frequency, r.customDays)) || (next + 30 * 864e5);
      if (mi < -1) break;
    }
  }
  return out;
}

function monthIndex(ts) {
  const now = new Date();
  const d = new Date(ts);
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
}

export function forecastCashflow(ctx, monthsAhead = 6, adjust = {}) {
  const { helpers } = ctx;
  const txs = helpers.txs || [];
  const avg = monthlyAverages(txs, 3);
  const rec = projectRecurrings(helpers.recurrings, monthsAhead);
  const cut = Number(adjust.cutPct) || 0;
  const extraInc = Number(adjust.extraIncome) || 0;
  const extraExp = Number(adjust.extraExpense) || 0;
  let balance = totalLiquid(ctx);
  const series = [];
  for (let m = 0; m < monthsAhead; m++) {
    // هزینه = میانگین + دوره‌ای‌ها (حداکثر، برای پرهیز از دوباره‌شماری نصف میانگین دوره‌ای)
    const recExp = rec[m].expense;
    const recInc = rec[m].income;
    const expense = Math.max(avg.expense, recExp * 0.7 + avg.expense * 0.5) * (1 - cut / 100) + extraExp;
    const income = Math.max(avg.income, recInc) + extraInc;
    const net = income - expense;
    const prevBal = balance;
    balance += net;
    const vol = Math.abs(net) * 0.25 + (avg.expense + avg.income) * 0.03;
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    series.push({
      label: d.toLocaleDateString('fa-IR', { month: 'short' }),
      mid: balance, lo: balance - vol * (m + 1) * 0.7, hi: balance + vol * (m + 1) * 0.7,
      income, expense, net, prevBal,
    });
  }
  return { series, avg };
}

export function totalLiquid(ctx) {
  // جمع حساب‌ها + تراکنش‌های بدون حساب؟ ساده: جمع بالانس حساب‌ها اگر دارند، وگرنه خالص تراکنش‌ها
  const accs = ctx.helpers.accounts || [];
  const withBal = accs.filter((a) => Number.isFinite(Number(a.balance)));
  if (withBal.length) return withBal.reduce((s, a) => s + Number(a.balance), 0);
  let net = 0;
  for (const t of ctx.helpers.txs || []) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') net += amt;
    else if (t.type === 'expense') net -= amt;
  }
  return net;
}

export function runwayMonths(ctx) {
  const avg = monthlyAverages(ctx.helpers.txs, 3);
  const liq = totalLiquid(ctx);
  if (avg.expense <= 0) return { months: 99, liq, burn: 0 };
  if (avg.net >= 0) return { months: 99, liq, burn: avg.expense, surplus: true };
  return { months: Math.max(0, liq / avg.expense), liq, burn: avg.expense };
}

/* ---------- رندر ---------- */
const VIEWS = [
  { id: 'runway', label: '🛬 ران‌وی و بقا' },
  { id: 'cashflow', label: '🌊 جریان نقدی آینده' },
  { id: 'whatif', label: '🧪 چی‌اگه؟' },
  { id: 'scenarios', label: '📚 سناریوها' },
  { id: 'freedom', label: '🕊 عدد آزادی' },
];

export function renderForecastView(ctx, api) {
  const ui = loadUi();
  const tabs = VIEWS.map((v) =>
    `<button class="fin-btn fin-btn-sm ${ui.view === v.id ? 'fin-btn-primary' : ''}" data-action="fc-view" data-v="${v.id}">${v.label}</button>`
  ).join('');
  let body = '';
  if (ui.view === 'cashflow') body = renderCashflow(ctx, api, ui);
  else if (ui.view === 'whatif') body = renderWhatif(ctx, api, ui);
  else if (ui.view === 'scenarios') body = renderScenarios(ctx, api, ui);
  else if (ui.view === 'freedom') body = renderFreedom(ctx, api, ui);
  else body = renderRunway(ctx, api, ui);
  return `<div class="fin-secbar"><h3>🔮 پیش‌بینی و آینده‌نگری</h3><div class="fin-secbar-actions">${tabs}</div></div>${body}`;
}

function renderRunway(ctx, api, ui) {
  const s = ctx.state.settings;
  const r = runwayMonths(ctx);
  const avg = monthlyAverages(ctx.helpers.txs, 3);
  const rec = projectRecurrings(ctx.helpers.recurrings, 3);
  const recExpNext = rec[0]?.expense || 0;
  const verdict = r.surplus
    ? '🌟 دخلت از خرجت بیشتره — داری پس‌انداز می‌کنی!'
    : r.months >= 12 ? '✅ بیش از یک سال ذخیره داری. عالی!'
    : r.months >= 6 ? '🙂 ذخیره‌ات خوبه؛ بالای ۶ ماه دوام میاری.'
    : r.months >= 3 ? '⚠️ ذخیره‌ات زیر ۶ ماهه — احتیاط کن.'
    : '🚨 کمتر از ۳ ماه ذخیره داری! هزینه‌ها را فوری بررسی کن.';
  const tips = [];
  if (!r.surplus && avg.expense > 0) {
    const need = avg.expense * 6 - r.liq;
    if (need > 0) tips.push(`برای رسیدن به ذخیره ۶ ماهه، ${formatMoney(need, s)} کم داری.`);
  }
  if (recExpNext > avg.expense * 0.5) tips.push(`هزینه‌های دوره‌ای ماه آینده (${formatMoney(recExpNext, s)}) سهم بزرگی از خرجته — اشتراک‌ها را در تب «💡 بینش» بررسی کن.`);
  if (avg.income > 0 && avg.expense / avg.income > 0.9) tips.push('بیش از ۹۰٪ درآمدت خرج می‌شود — قانون ۵۰/۳۰/۲۰ را امتحان کن.');
  if (!tips.length) tips.push('وضعیتت پایداره. سناریوهای «چی‌اگه» را برای برنامه‌های بزرگ امتحان کن.');
  return `
  <div class="fin-kpis">
    <div class="fin-kpi"><span>🛬 ران‌وی (دوام بدون درآمد)</span><b>${r.surplus ? '∞ نامحدود' : faDigits(r.months >= 99 ? '∞' : r.months.toFixed(1)) + ' ماه'}</b></div>
    <div class="fin-kpi"><span>💧 نقدینگی فعلی</span><b>${formatMoney(r.liq, s)}</b></div>
    <div class="fin-kpi"><span>🔥 میانگین خرج ماهانه</span><b>${formatMoney(avg.expense, s)}</b></div>
    <div class="fin-kpi"><span>💰 میانگین دخل ماهانه</span><b>${formatMoney(avg.income, s)}</b></div>
  </div>
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>🛬 وضعیت بقا</h4><canvas data-fc="ring" height="150"></canvas>
      <div class="fin-verdict">${verdict}</div></div>
    <div class="fin-panel"><h4>💡 پیشنهادهای هوشمند</h4><ul class="fin-tips">${tips.map((t) => `<li>${t}</li>`).join('')}</ul>
      <h4>📅 هزینه‌های دوره‌ای ۳ ماه آینده</h4><canvas data-fc="rec" height="120"></canvas></div>
  </div>`;
}

function renderCashflow(ctx, api, ui) {
  const s = ctx.state.settings;
  const months = Math.max(3, Math.min(24, Number(ui.months) || 6));
  const cut = Number(ui.cutPct) || 0;
  const { series } = forecastCashflow(ctx, months, { cutPct: cut });
  const rows = series.map((p) => `<tr>
      <td>${escapeHtml(p.label)}</td>
      <td class="fin-pos">${formatMoney(p.income, s)}</td>
      <td class="fin-neg">${formatMoney(p.expense, s)}</td>
      <td class="${p.net >= 0 ? 'fin-pos' : 'fin-neg'}">${formatMoney(p.net, s)}</td>
      <td><b>${formatMoney(p.mid, s)}</b></td>
    </tr>`).join('');
  const worst = series[series.length - 1];
  return `
  <div class="fin-panel"><div class="fin-form-grid">
    <label>افق پیش‌بینی (ماه)<select data-fc="months">${[3, 6, 9, 12, 18, 24].map((m) => `<option value="${m}" ${m === months ? 'selected' : ''}>${faDigits(String(m))} ماه</option>`).join('')}</select></label>
    <label>کاهش هزینه (٪)<input data-fc="cut" type="number" min="0" max="80" value="${cut}" /></label>
  </div>
  <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="fc-run">🔮 اجرای پیش‌بینی</button></div>
  <div class="fin-hint">بر اساس میانگین ۳ ماه گذشته + تراکنش‌های دوره‌ای فعال. باند بنفش = بازه اطمینان.</div></div>
  <div class="fin-panel"><h4>🔮 موجودی پیش‌بینی‌شده</h4><canvas data-fc="forecast" height="210"></canvas>
    <div class="fin-hint">پایان دوره: حدود <b>${formatMoney(worst.mid, s)}</b> (بازه ${formatMoney(worst.lo, s)} تا ${formatMoney(worst.hi, s)})</div></div>
  <div class="fin-panel"><h4>🌊 جزئیات ماهانه</h4>
    <div class="fin-table-wrap"><table class="fin-table"><thead><tr><th>ماه</th><th>دخل</th><th>خرج</th><th>خالص</th><th>موجودی</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function renderWhatif(ctx, api, ui) {
  const s = ctx.state.settings;
  const months = Math.max(3, Math.min(24, Number(ui.months) || 6));
  const base = forecastCashflow(ctx, months, {});
  const items = ui.whatif || [];
  const totalExtraInc = items.filter((x) => x.kind === 'inc').reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const totalExtraExp = items.filter((x) => x.kind === 'exp').reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const cut = items.filter((x) => x.kind === 'cut').reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const alt = forecastCashflow(ctx, months, { extraIncome: totalExtraInc, extraExpense: totalExtraExp, cutPct: Math.min(80, cut) });
  const endBase = base.series[base.series.length - 1].mid;
  const endAlt = alt.series[alt.series.length - 1].mid;
  const diff = endAlt - endBase;
  const list = items.map((x, i) => `<div class="fin-order-row"><b>${x.kind === 'inc' ? '💰' : x.kind === 'exp' ? '💸' : '✂️'}</b>
    <span>${escapeHtml(x.title || '')} — ${x.kind === 'cut' ? faDigits(String(x.amount)) + '٪' : formatMoney(x.amount, s)} ماهانه</span>
    <button class="fin-btn fin-btn-sm" data-action="fc-del-item" data-i="${i}">✕</button></div>`).join('');
  return `
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>🧪 افزودن فرض «چی‌اگه»</h4>
      <div class="fin-form-grid">
        <label>عنوان<input data-fc="w-title" placeholder="مثلاً: افزایش حقوق" /></label>
        <label>نوع<select data-fc="w-kind"><option value="inc">💰 درآمد اضافه ماهانه</option><option value="exp">💸 هزینه اضافه ماهانه</option><option value="cut">✂️ کاهش هزینه (٪)</option></select></label>
        <label>مبلغ / درصد<input data-fc="w-amount" type="number" min="0" step="any" /></label>
      </div>
      <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="fc-add-item">➕ افزودن فرض</button>
      <button class="fin-btn fin-btn-sm" data-action="fc-clear-items">🧹 پاک کردن همه</button>
      <button class="fin-btn fin-btn-sm" data-action="fc-save-scen">💾 ذخیره به‌عنوان سناریو</button></div>
      <h4>فرض‌های فعال (${faDigits(String(items.length))})</h4>${list || '<div class="fin-empty">فرضی نیست — یکی اضافه کن.</div>'}
    </div>
    <div class="fin-panel"><h4>⚖️ نتیجه مقایسه (${faDigits(String(months))} ماه)</h4>
      <canvas data-fc="compare" height="130"></canvas>
      <div class="fin-kpis"><div class="fin-kpi"><span>📍 بدون تغییر</span><b>${formatMoney(endBase, s)}</b></div>
      <div class="fin-kpi"><span>🧪 با فرض‌ها</span><b>${formatMoney(endAlt, s)}</b></div></div>
      <div class="fin-verdict">${diff >= 0 ? `✅ فرض‌هایت ${formatMoney(diff, s)} بهترت می‌کند!` : `⚠️ فرض‌هایت ${formatMoney(-diff, s)} بدترت می‌کند.`}</div>
    </div>
  </div>
  <div class="fin-panel"><h4>📈 مسیر مقایسه</h4><canvas data-fc="both" height="170"></canvas></div>`;
}

function renderScenarios(ctx, api, ui) {
  const s = ctx.state.settings;
  const scenarios = loadScenarios();
  const months = Math.max(3, Math.min(24, Number(ui.months) || 6));
  const base = forecastCashflow(ctx, months, {});
  const endBase = base.series[base.series.length - 1].mid;
  const cards = scenarios.map((sc, i) => {
    const alt = forecastCashflow(ctx, months, sc.adjust || {});
    const end = alt.series[alt.series.length - 1].mid;
    const diff = end - endBase;
    return `<div class="fin-loan-card"><div class="fin-loan-head"><b>📚 ${escapeHtml(sc.name)}</b>
      <span class="fin-badge">${faDigits(String((sc.items || []).length))} فرض</span></div>
      <div class="fin-loan-amount">${formatMoney(end, s)} <small>${diff >= 0 ? '✅ +' : '⚠️ '}${formatMoney(diff, s)} نسبت به پایه</small></div>
      <div class="fin-btn-row">
        <button class="fin-btn fin-btn-sm" data-action="fc-load-scen" data-i="${i}">📥 بارگذاری در چی‌اگه</button>
        <button class="fin-btn fin-btn-sm" data-action="fc-del-scen" data-i="${i}">🗑 حذف</button>
      </div></div>`;
  }).join('');
  return `<div class="fin-panel"><div class="fin-hint">سناریو = مجموعه‌ای از فرض‌های چی‌اگه که ذخیره می‌کنی تا بعداً مقایسه‌شان کنی (مثلاً «زندگی با حقوق جدید» یا «خرید ماشین»).</div>
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm" data-action="fc-view" data-v="whatif">🧪 رفتن به چی‌اگه</button></div></div>
  <div class="fin-loan-grid">${cards || '<div class="fin-panel"><div class="fin-empty">📚 سناریویی ذخیره نشده.</div></div>'}</div>`;
}

function renderFreedom(ctx, api, ui) {
  const s = ctx.state.settings;
  const avg = monthlyAverages(ctx.helpers.txs, 3);
  const liq = totalLiquid(ctx);
  const monthlyNeed = avg.expense || 0;
  const freedomNum = monthlyNeed * 12 * 25; // قانون ۴٪
  const saveRate = avg.income > 0 ? Math.max(0, (avg.income - avg.expense) / avg.income) : 0;
  const monthlySave = Math.max(0, avg.income - avg.expense);
  const monthsToNum = monthlySave > 0 ? Math.max(0, (freedomNum - liq) / monthlySave) : Infinity;
  const targetPct = Math.min(100, Number(ui.saveTarget) || 20);
  const targetSave = avg.income * (targetPct / 100);
  const monthsToTarget = targetSave > 0 ? Math.max(0, (freedomNum - liq) / targetSave) : Infinity;
  const rules = [
    { k: '۵۰/۳۰/۲۰', needs: avg.income * 0.5, wants: avg.income * 0.3, save: avg.income * 0.2 },
    { k: '۶۰/۲۰/۲۰', needs: avg.income * 0.6, wants: avg.income * 0.2, save: avg.income * 0.2 },
    { k: '۷۰/۲۰/۱۰', needs: avg.income * 0.7, wants: avg.income * 0.2, save: avg.income * 0.1 },
  ];
  return `
  <div class="fin-kpis">
    <div class="fin-kpi"><span>🕊 عدد آزادی مالی (قانون ۴٪)</span><b>${formatMoney(freedomNum, s)}</b></div>
    <div class="fin-kpi"><span>📊 نرخ پس‌انداز فعلی</span><b>${faDigits((saveRate * 100).toFixed(1))}٪</b></div>
    <div class="fin-kpi"><span>⏳ رسیدن با روند فعلی</span><b>${Number.isFinite(monthsToNum) ? faDigits((monthsToNum / 12).toFixed(1)) + ' سال' : '♾'}</b></div>
  </div>
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>🎯 هدف‌گذاری نرخ پس‌انداز</h4>
      <div class="fin-form-grid"><label>هدف پس‌انداز (٪ درآمد)<input data-fc="target" type="number" min="1" max="90" value="${targetPct}" /></label></div>
      <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="fc-target-run">🎯 محاسبه</button></div>
      <div class="fin-kpis"><div class="fin-kpi"><span>💰 پس‌انداز ماهانه هدف</span><b>${formatMoney(targetSave, s)}</b></div>
      <div class="fin-kpi"><span>⏳ رسیدن با این هدف</span><b>${Number.isFinite(monthsToTarget) ? faDigits((monthsToTarget / 12).toFixed(1)) + ' سال' : '♾'}</b></div></div>
      <canvas data-fc="target-ring" height="140"></canvas>
    </div>
    <div class="fin-panel"><h4>⚖️ قانون‌های بودجه‌بندی (بر اساس دخل ${formatMoney(avg.income, s)})</h4>
      ${rules.map((r) => `<div class="fin-rule-row"><b>${r.k}</b>
        <span>🏠 نیازها: ${formatMoney(r.needs, s)}</span>
        <span>🎈 خواسته‌ها: ${formatMoney(r.wants, s)}</span>
        <span>💎 پس‌انداز: ${formatMoney(r.save, s)}</span></div>`).join('')}
      <div class="fin-hint">💡 خرج فعلی‌ات (${formatMoney(avg.expense, s)}) معادل ${avg.income ? faDigits(((avg.expense / avg.income) * 100).toFixed(0)) + '٪' : '—'} درآمدته.</div>
    </div>
  </div>`;
}

/* ---------- پس از رندر ---------- */
export function afterForecastRender(root, ctx) {
  const ui = loadUi();
  const s = ctx.state.settings;
  const r = runwayMonths(ctx);
  const ring = root.querySelector('[data-fc="ring"]');
  if (ring) {
    const frac = r.surplus ? 1 : Math.min(1, r.months / 12);
    drawRingInline(ring, frac, r.surplus ? '∞' : `${r.months.toFixed(1)} ماه`);
  }
  const rec = root.querySelector('[data-fc="rec"]');
  if (rec) {
    const p = projectRecurrings(ctx.helpers.recurrings, 3);
    drawFinVBars(rec, p.map((x, i) => {
      const d = new Date(); d.setMonth(d.getMonth() + i);
      return { label: d.toLocaleDateString('fa-IR', { month: 'short' }), value: x.expense };
    }), { h: 120, showVals: false });
  }
  const fc = root.querySelector('[data-fc="forecast"]');
  if (fc) {
    const months = Math.max(3, Math.min(24, Number(ui.months) || 6));
    drawFinForecast(fc, forecastCashflow(ctx, months, { cutPct: Number(ui.cutPct) || 0 }).series, { h: 210 });
  }
  const cmp = root.querySelector('[data-fc="compare"]');
  if (cmp) {
    const months = Math.max(3, Math.min(24, Number(ui.months) || 6));
    const items = ui.whatif || [];
    const alt = forecastCashflow(ctx, months, {
      extraIncome: items.filter((x) => x.kind === 'inc').reduce((a, x) => a + (Number(x.amount) || 0), 0),
      extraExpense: items.filter((x) => x.kind === 'exp').reduce((a, x) => a + (Number(x.amount) || 0), 0),
      cutPct: items.filter((x) => x.kind === 'cut').reduce((a, x) => a + (Number(x.amount) || 0), 0),
    });
    const base = forecastCashflow(ctx, months, {});
    drawCompareInline(cmp, base.series[base.series.length - 1].mid, alt.series[alt.series.length - 1].mid);
    const both = root.querySelector('[data-fc="both"]');
    if (both) drawBothInline(both, base.series, alt.series);
  }
  const tr = root.querySelector('[data-fc="target-ring"]');
  if (tr) {
    const avg = monthlyAverages(ctx.helpers.txs, 3);
    const rate = avg.income > 0 ? Math.max(0, (avg.income - avg.expense) / avg.income) : 0;
    drawRingInline(tr, Math.min(1, rate / (Math.max(1, Number(ui.saveTarget) || 20) / 100)), `فعلی ${faDigits((rate * 100).toFixed(0))}٪`);
  }
  void s;
}

function drawRingInline(canvas, frac, label) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 280, h = canvas.clientHeight || 150;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 12;
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 14; c.stroke();
  c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac)));
  c.strokeStyle = frac >= 0.5 ? '#34d399' : frac >= 0.25 ? '#fbbf24' : '#f43f5e';
  c.lineWidth = 14; c.lineCap = 'round'; c.stroke();
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 16px Tahoma';
  c.fillText(faDigits(label), cx, cy + 6);
}

function drawCompareInline(canvas, a, b) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 280, h = canvas.clientHeight || 130;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const max = Math.max(Math.abs(a), Math.abs(b), 1);
  [['پایه', a, '#64748b'], ['با فرض‌ها', b, '#8b5cf6']].forEach(([label, v, col], i) => {
    const bw = (w - 30) / 2;
    const x = 10 + i * (bw + 10);
    const bh = Math.max(6, (Math.abs(v) / max) * (h - 60));
    c.fillStyle = col;
    c.beginPath(); c.roundRect(x, h - 30 - bh, bw, bh, 8); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 12px Tahoma';
    c.fillText(shortMoney(v), x + bw / 2, h - 34 - bh);
    c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '11px Tahoma';
    c.fillText(label, x + bw / 2, h - 12);
  });
}

function drawBothInline(canvas, base, alt) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300, h = canvas.clientHeight || 170;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const all = [...base.map((x) => x.mid), ...alt.map((x) => x.mid)];
  const min = Math.min(...all), max = Math.max(...all);
  const rng = max - min || 1;
  const px = (i, n) => 10 + (i / Math.max(1, n - 1)) * (w - 20);
  const py = (v) => h - 26 - ((v - min) / rng) * (h - 44);
  const line = (arr, col, dash) => {
    c.beginPath();
    arr.forEach((p, i) => { if (i === 0) c.moveTo(px(i, arr.length), py(p.mid)); else c.lineTo(px(i, arr.length), py(p.mid)); });
    c.strokeStyle = col; c.lineWidth = 2.5; c.setLineDash(dash); c.stroke(); c.setLineDash([]);
  };
  line(base, '#64748b', [5, 4]);
  line(alt, '#8b5cf6', []);
  c.font = '11px Tahoma'; c.textAlign = 'right';
  c.fillStyle = '#64748b'; c.fillText('┄ پایه', w - 10, 16);
  c.fillStyle = '#8b5cf6'; c.fillText('━ با فرض‌ها', w - 10, 32);
}

function shortMoney(n) {
  const a = Math.abs(n);
  if (a >= 1e9) return faDigits((n / 1e9).toFixed(1)) + ' م';
  if (a >= 1e6) return faDigits((n / 1e6).toFixed(1)) + ' م';
  if (a >= 1e3) return faDigits((n / 1e3).toFixed(0)) + ' ه';
  return faDigits(String(Math.round(n)));
}


/* ---------- اکشن‌ها ---------- */
export async function handleForecastAction(action, el, api) {
  const { root, toast } = api;
  const ui = loadUi();
  switch (action) {
    case 'fc-view': saveUi({ view: el.dataset.v || 'runway' }); api.renderContent(); return true;
    case 'fc-run': {
      saveUi({
        months: root.querySelector('[data-fc="months"]')?.value || '6',
        cutPct: root.querySelector('[data-fc="cut"]')?.value || '0',
      });
      api.renderContent();
      return true;
    }
    case 'fc-add-item': {
      const title = root.querySelector('[data-fc="w-title"]')?.value?.trim() || 'فرض جدید';
      const kind = root.querySelector('[data-fc="w-kind"]')?.value || 'inc';
      const amount = Number(root.querySelector('[data-fc="w-amount"]')?.value) || 0;
      if (amount <= 0) { toast('❌ مبلغ/درصد معتبر وارد کن.'); return true; }
      saveUi({ whatif: [...(ui.whatif || []), { title, kind, amount }] });
      api.renderContent();
      return true;
    }
    case 'fc-del-item': {
      const items = [...(ui.whatif || [])];
      items.splice(Number(el.dataset.i), 1);
      saveUi({ whatif: items });
      api.renderContent();
      return true;
    }
    case 'fc-clear-items': saveUi({ whatif: [] }); api.renderContent(); return true;
    case 'fc-save-scen': {
      const items = ui.whatif || [];
      if (!items.length) { toast('❌ اول فرضی اضافه کن.'); return true; }
      const name = prompt('📚 نام سناریو:', `سناریو ${faDigits(String(loadScenarios().length + 1))}`);
      if (!name) return true;
      const adjust = {
        extraIncome: items.filter((x) => x.kind === 'inc').reduce((a, x) => a + (Number(x.amount) || 0), 0),
        extraExpense: items.filter((x) => x.kind === 'exp').reduce((a, x) => a + (Number(x.amount) || 0), 0),
        cutPct: items.filter((x) => x.kind === 'cut').reduce((a, x) => a + (Number(x.amount) || 0), 0),
      };
      const all = loadScenarios();
      all.push({ name: name.trim(), items, adjust, at: Date.now() });
      saveScenarios(all);
      toast('📚 سناریو ذخیره شد.');
      saveUi({ view: 'scenarios' });
      api.renderContent();
      return true;
    }
    case 'fc-load-scen': {
      const sc = loadScenarios()[Number(el.dataset.i)];
      if (!sc) return true;
      saveUi({ view: 'whatif', whatif: sc.items || [] });
      api.renderContent();
      return true;
    }
    case 'fc-del-scen': {
      const all = loadScenarios();
      all.splice(Number(el.dataset.i), 1);
      saveScenarios(all);
      api.renderContent();
      return true;
    }
    case 'fc-target-run': {
      saveUi({ saveTarget: root.querySelector('[data-fc="target"]')?.value || '20' });
      api.renderContent();
      return true;
    }
    default: return false;
  }
}

export { MONTHS_FA };
