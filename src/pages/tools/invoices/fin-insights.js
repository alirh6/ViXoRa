// 💡 ViXoRa Insights — بینش هوشمند، اشتراک‌ها، واردسازی CSV، رسیدها، ارز
import {
  escapeHtml, formatMoney, faDigits, parseTxCSV, toLocalDateInput,
} from '../../../core/schemas/finance-schema.js';
import { drawFinDonut, drawFinHBars, drawFinSpark, drawFinWaterfall } from './fin-charts.js';

const UI_KEY = 'ViXoRa:fin-insights-ui';
const ATT_KEY = 'ViXoRa:fin-attachments';
const FX_KEY = 'ViXoRa:fin-fx';

function loadUi() {
  try {
    return { view: 'insights', wiz: null, fxFrom: 'USD', fxTo: 'TMN', fxAmount: '100', ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') };
  } catch { return { view: 'insights', wiz: null, fxFrom: 'USD', fxTo: 'TMN', fxAmount: '100' }; }
}
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify({ ...u, wiz: u.wiz ? { ...u.wiz, rows: u.wiz.rows?.slice(0, 500) } : null })); } catch { /* ignore */ }
  return u;
}
function loadAtt() { try { return JSON.parse(localStorage.getItem(ATT_KEY) || '{}'); } catch { return {}; } }
function saveAtt(a) { try { localStorage.setItem(ATT_KEY, JSON.stringify(a)); } catch { /* ignore */ } }
function loadFx() {
  try { return { rates: { USD: 60000, EUR: 65000, GBP: 76000, AED: 16300, TRY: 1850 }, updatedAt: 0, ...JSON.parse(localStorage.getItem(FX_KEY) || '{}') }; }
  catch { return { rates: { USD: 60000, EUR: 65000, GBP: 76000, AED: 16300, TRY: 1850 }, updatedAt: 0 }; }
}
function saveFx(fx) { try { localStorage.setItem(FX_KEY, JSON.stringify(fx)); } catch { /* ignore */ } }

export function getAttachments(txId) { return loadAtt()[String(txId)] || []; }
export function txHasAttachment(txId) { return (loadAtt()[String(txId)] || []).length > 0; }

/* ---------- موتور بینش ---------- */
export function buildInsights(ctx) {
  const txs = ctx.helpers.txs || [];
  const cats = new Map((ctx.helpers.categories || []).map((c) => [c.id, c.name || c.title || 'دسته']));
  const out = [];
  const now = Date.now();
  const last30 = txs.filter((t) => (Date.parse(t.date || t.createdAt || 0) || 0) > now - 30 * 864e5);
  const prev30 = txs.filter((t) => {
    const at = Date.parse(t.date || t.createdAt || 0) || 0;
    return at <= now - 30 * 864e5 && at > now - 60 * 864e5;
  });
  const sum = (arr, type) => arr.filter((t) => t.type === type).reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const e1 = sum(last30, 'expense'), e0 = sum(prev30, 'expense');
  const i1 = sum(last30, 'income'), i0 = sum(prev30, 'income');

  if (e0 > 0) {
    const d = ((e1 - e0) / e0) * 100;
    if (d >= 15) out.push({ icon: '📈', level: 'warn', text: `خرج این ماه ${faDigits(d.toFixed(0))}٪ بیشتر از ماه قبل شده.` });
    else if (d <= -15) out.push({ icon: '📉', level: 'good', text: `آفرین! خرجت ${faDigits(Math.abs(d).toFixed(0))}٪ کمتر از ماه قبل شده.` });
  }
  if (i1 > 0 && e1 / i1 > 0.95) out.push({ icon: '🚨', level: 'bad', text: 'بیش از ۹۵٪ درآمد این ماه خرج شده — هیچ حاشیه‌ای نمانده!' });
  else if (i1 > 0 && e1 / i1 < 0.6) out.push({ icon: '💎', level: 'good', text: `نرخ پس‌اندازت عالیه (${faDigits(((1 - e1 / i1) * 100).toFixed(0))}٪).` });

  // دسته پرخرج
  const byCat = new Map();
  for (const t of last30) {
    if (t.type !== 'expense') continue;
    byCat.set(t.categoryId || '', (byCat.get(t.categoryId || '') || 0) + (Number(t.amount) || 0));
  }
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && e1 > 0) {
    const pct = (top[1] / e1) * 100;
    if (pct >= 30) out.push({ icon: '🎯', level: 'warn', text: `«${cats.get(top[0]) || 'بدون دسته'}» به‌تنهایی ${faDigits(pct.toFixed(0))}٪ خرج ماه را بلعیده.` });
  }

  // تراکنش‌های بزرگ غیرعادی (۳ برابر میانگین)
  const exps = last30.filter((t) => t.type === 'expense').map((t) => Number(t.amount) || 0);
  const avg = exps.length ? exps.reduce((a, b) => a + b, 0) / exps.length : 0;
  const big = last30.filter((t) => t.type === 'expense' && (Number(t.amount) || 0) > avg * 3 && avg > 0);
  for (const b of big.slice(0, 3)) {
    out.push({ icon: '🔍', level: 'warn', text: `تراکنش غیرعادی: «${escapeHtml(b.note || b.title || 'بدون شرح')}» به مبلغ ${formatMoney(b.amount, ctx.state.settings)} (${faDigits(((Number(b.amount) / avg)).toFixed(1))}× میانگین).`, txId: b.id });
  }

  // روزهای هفته
  const byDow = new Array(7).fill(0);
  for (const t of last30) {
    if (t.type !== 'expense') continue;
    const d = new Date(Date.parse(t.date || t.createdAt || 0));
    if (!Number.isNaN(d)) byDow[d.getDay()] += Number(t.amount) || 0;
  }
  const dowNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const maxDow = byDow.indexOf(Math.max(...byDow));
  if (byDow[maxDow] > 0) out.push({ icon: '📅', level: 'info', text: `پرخطل‌ترین روز هفته‌ات «${dowNames[maxDow]}» است.` });

  // بودجه‌های در خطر
  for (const b of ctx.helpers.budgets || []) {
    const spent = sum(last30.filter((t) => !b.categoryId || t.categoryId === b.categoryId), 'expense');
    const lim = Number(b.limit || b.amount) || 0;
    if (lim > 0 && spent / lim > 0.85 && spent / lim <= 1) out.push({ icon: '🎯', level: 'warn', text: `بودجه «${escapeHtml(b.title || b.name || '')}» ${faDigits(((spent / lim) * 100).toFixed(0))}٪ مصرف شده!` });
    else if (lim > 0 && spent > lim) out.push({ icon: '💥', level: 'bad', text: `بودجه «${escapeHtml(b.title || b.name || '')}» ترکیده: ${faDigits(((spent / lim) * 100).toFixed(0))}٪!` });
  }

  // قبوض نزدیک سررسید
  for (const bill of ctx.helpers.bills || []) {
    if (bill.active === false) continue;
    out.push({ icon: '💡', level: 'info', text: `قبض «${escapeHtml(bill.title)}» سررسید روز ${faDigits(String(bill.dueDay))} هر ماه است.${bill.expected ? ` (حدود ${formatMoney(bill.expected, ctx.state.settings)})` : ''}` });
    if (out.length > 14) break;
  }

  if (!out.length) out.push({ icon: '🌱', level: 'info', text: 'هنوز داده کافی برای بینش نیست — چند تراکنش ثبت کن.' });
  return out;
}

/** شناسایی اشتراک‌های احتمالی از روی تکرار مبلغ+شرح */
export function detectSubscriptions(txs, recurrings = []) {
  const groups = new Map();
  for (const t of txs || []) {
    if (t.type !== 'expense') continue;
    const key = `${Math.round(Number(t.amount) || 0)}⟨⟩${String(t.note || t.title || '').trim().slice(0, 24)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  const known = new Set((recurrings || []).map((r) => `${Math.round(Number(r.amount) || 0)}⟨⟩${String(r.title || '').trim().slice(0, 24)}`));
  const subs = [];
  for (const [key, arr] of groups) {
    if (arr.length < 2) continue;
    const times = arr.map((t) => Date.parse(t.date || t.createdAt || 0) || 0).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < times.length; i++) gaps.push((times[i] - times[i - 1]) / 864e5);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / Math.max(1, gaps.length);
    if (avgGap > 5 && avgGap < 40) {
      const [amt, label] = key.split('⟨⟩');
      subs.push({
        label: label || 'بدون شرح', amount: Number(amt), count: arr.length,
        avgGap: Math.round(avgGap), lastAt: times[times.length - 1],
        monthly: (Number(amt) * 30) / Math.max(1, avgGap),
        known: known.has(key), sample: arr[arr.length - 1],
      });
    }
  }
  return subs.sort((a, b) => b.monthly - a.monthly);
}

/* ---------- رندر ---------- */
const VIEWS = [
  { id: 'insights', label: '💡 بینش هوشمند' },
  { id: 'subs', label: '🔁 رادار اشتراک' },
  { id: 'wizard', label: '📥 جادوگر CSV' },
  { id: 'attach', label: '🧾 رسیدها' },
  { id: 'fx', label: '💱 ارز' },
];

export function renderInsightsView(ctx, api) {
  const ui = loadUi();
  const tabs = VIEWS.map((v) =>
    `<button class="fin-btn fin-btn-sm ${ui.view === v.id ? 'fin-btn-primary' : ''}" data-action="iz-view" data-v="${v.id}">${v.label}</button>`
  ).join('');
  let body = '';
  if (ui.view === 'subs') body = renderSubs(ctx, api, ui);
  else if (ui.view === 'wizard') body = renderWizard(ctx, api, ui);
  else if (ui.view === 'attach') body = renderAttach(ctx, api, ui);
  else if (ui.view === 'fx') body = renderFx(ctx, api, ui);
  else body = renderInsights(ctx, api, ui);
  return `<div class="fin-secbar"><h3>💡 بینش و ابزار هوشمند</h3><div class="fin-secbar-actions">${tabs}</div></div>${body}`;
}

function renderInsights(ctx, api) {
  const list = buildInsights(ctx);
  const cards = list.map((x) => `<div class="fin-insight fin-insight-${x.level}"><b>${x.icon}</b><span>${x.text}</span>
    ${x.txId ? `<button class="fin-btn fin-btn-sm" data-action="iz-tx" data-id="${x.txId}">مشاهده</button>` : ''}</div>`).join('');
  const txs = ctx.helpers.txs || [];
  const now = Date.now();
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
    const d1 = d0.getTime() + 864e5;
    const sum = txs.filter((t) => {
      const at = Date.parse(t.date || t.createdAt || 0) || 0;
      return t.type === 'expense' && at >= d0.getTime() && at < d1;
    }).reduce((a, t) => a + (Number(t.amount) || 0), 0);
    daily.push(sum);
  }
  return `
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>📉 خرج روزانه ۱۴ روز اخیر</h4><canvas data-iz="daily" height="130"></canvas></div>
    <div class="fin-panel"><h4>🍩 خرج ماه جاری به تفکیک دسته</h4><canvas data-iz="donut" height="170"></canvas></div>
  </div>
  <div class="fin-panel"><h4>💡 بینش‌ها (${faDigits(String(list.length))})</h4>${cards}</div>
  <script type="fin-data" data-iz="daily-data">${JSON.stringify(daily)}</script>`;
}

function renderSubs(ctx, api) {
  const s = ctx.state.settings;
  const subs = detectSubscriptions(ctx.helpers.txs, ctx.helpers.recurrings);
  const total = subs.reduce((a, x) => a + x.monthly, 0);
  const rows = subs.map((x, i) => `<div class="fin-order-row"><b>🔁</b>
    <span><b>${escapeHtml(x.label)}</b> — هر ${faDigits(String(x.avgGap))} روز ${formatMoney(x.amount, s)} • ${faDigits(String(x.count))} بار دیده شده</span>
    <span class="fin-badge">~${formatMoney(Math.round(x.monthly), s)}/ماه</span>
    ${x.known ? '<span class="fin-badge">✅ دوره‌ای شده</span>' : `<button class="fin-btn fin-btn-sm" data-action="iz-sub-make" data-i="${i}">➕ دوره‌ای کن</button>`}
  </div>`).join('');
  return `<div class="fin-kpis">
    <div class="fin-kpi"><span>🔁 اشتراک احتمالی</span><b>${faDigits(String(subs.length))}</b></div>
    <div class="fin-kpi"><span>💸 هزینه ماهانه اشتراک‌ها</span><b>${formatMoney(Math.round(total), s)}</b></div>
    <div class="fin-kpi"><span>💸 هزینه سالانه</span><b>${formatMoney(Math.round(total * 12), s)}</b></div>
  </div>
  <div class="fin-panel"><h4>🔁 رادار اشتراک</h4>
    <div class="fin-hint">تراکنش‌هایی که با مبلغ مشابه تکرار شده‌اند (مثل Netflix، باشگاه، اینترنت). موارد اضافه را لغو کن!</div>
    ${rows || '<div class="fin-empty">اشتراک تکراری پیدا نشد. 🎉</div>'}</div>
  <script type="fin-data" data-iz="subs-data">${JSON.stringify(subs.map((x) => ({ label: x.label, amount: x.amount, avgGap: x.avgGap, accountId: x.sample?.accountId || '', categoryId: x.sample?.categoryId || '' })))}</script>`;
}

function renderWizard(ctx, api, ui) {
  const wiz = ui.wiz;
  if (!wiz) {
    return `<div class="fin-panel"><h4>📥 جادوگر واردسازی CSV (۵ مرحله)</h4>
      <div class="fin-hint">فایل CSV بانک یا حسابداری‌ات را بده؛ ستون‌ها را نگاشت کن، پیش‌نمایش ببین، بعد وارد کن. از هدرهای فارسی و انگلیسی پشتیبانی می‌شود.</div>
      <div class="fin-btn-row"><button class="fin-btn fin-btn-primary" data-action="iz-wiz-pick">📂 انتخاب فایل CSV</button></div>
      <input type="file" data-iz="wiz-file" accept=".csv,text/csv,text/plain" class="fin-hidden" />
      <h4>📋 نمونه قالب</h4>
      <div class="fin-code" dir="ltr">date,description,amount,type<br />2026-01-05,Coffee shop,85000,expense<br />2026-01-06,Salary,15000000,income</div>
    </div>`;
  }
  const step = wiz.step || 1;
  const stepsBar = [1, 2, 3, 4].map((n) => `<span class="fin-step ${n === step ? 'is-on' : n < step ? 'is-done' : ''}">${faDigits(String(n))}</span>`).join('<span class="fin-step-sep">←</span>');
  let body = '';
  if (step === 1) {
    body = `<h4>۱️⃣ نگاشت ستون‌ها</h4>
    <div class="fin-hint">فایل: <b>${escapeHtml(wiz.name)}</b> • ${faDigits(String(wiz.rows.length))} ردیف • هدرها: ${wiz.headers.map(escapeHtml).join('، ')}</div>
    <div class="fin-form-grid">
      <label>ستون تاریخ<select data-iz="map-date">${mapOpts(wiz.headers, wiz.map.date)}</select></label>
      <label>ستون شرح<select data-iz="map-desc">${mapOpts(wiz.headers, wiz.map.desc)}</select></label>
      <label>ستون مبلغ<select data-iz="map-amount">${mapOpts(wiz.headers, wiz.map.amount)}</select></label>
      <label>ستون نوع (اختیاری)<select data-iz="map-type">${mapOpts(wiz.headers, wiz.map.type, true)}</select></label>
    </div>
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="iz-wiz-next">بعدی ←</button></div>`;
  } else if (step === 2) {
    const accs = (ctx.helpers.accounts || []).map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
    const cats = (ctx.helpers.categories || []).map((c) => `<option value="${c.id}">${escapeHtml(c.name || c.title)}</option>`).join('');
    body = `<h4>۲️⃣ مقادیر پیش‌فرض</h4>
    <div class="fin-form-grid">
      <label>حساب پیش‌فرض<select data-iz="wiz-acc"><option value="">— بدون حساب —</option>${accs}</select></label>
      <label>دسته پیش‌فرض<select data-iz="wiz-cat"><option value="">— بدون دسته —</option>${cats}</select></label>
      <label>نوع پیش‌فرض (اگر ستون نوع نیست)<select data-iz="wiz-type"><option value="expense">💸 هزینه</option><option value="income">💰 درآمد</option></select></label>
    </div>
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm" data-action="iz-wiz-back">→ قبلی</button>
    <button class="fin-btn fin-btn-sm fin-btn-primary" data-action="iz-wiz-next">بعدی ←</button></div>`;
  } else if (step === 3) {
    const preview = wiz.preview.slice(0, 15).map((r, i) => `<tr class="${r._bad ? 'fin-row-bad' : ''}">
      <td>${faDigits(String(i + 1))}</td><td>${escapeHtml(r.date || '—')}</td><td>${escapeHtml(r.desc || '—')}</td>
      <td>${r.amount ? formatMoney(r.amount, ctx.state.settings) : '—'}</td><td>${r.type === 'income' ? '💰' : '💸'}</td>
      <td>${r._bad ? '⚠️ ' + escapeHtml(r._bad) : '✅'}</td></tr>`).join('');
    const bad = wiz.preview.filter((r) => r._bad).length;
    body = `<h4>۳️⃣ پیش‌نمایش و اعتبارسنجی</h4>
    <div class="fin-hint">✅ ${faDigits(String(wiz.preview.length - bad))} سالم • ⚠️ ${faDigits(String(bad))} مشکل‌دار (وارد نمی‌شوند)</div>
    <div class="fin-table-wrap"><table class="fin-table"><thead><tr><th>#</th><th>تاریخ</th><th>شرح</th><th>مبلغ</th><th>نوع</th><th>وضعیت</th></tr></thead><tbody>${preview}</tbody></table></div>
    ${wiz.preview.length > 15 ? `<div class="fin-hint">نمایش ۱۵ تای اول از ${faDigits(String(wiz.preview.length))}.</div>` : ''}
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm" data-action="iz-wiz-back">→ قبلی</button>
    <button class="fin-btn fin-btn-sm fin-btn-primary" data-action="iz-wiz-next">بعدی ←</button></div>`;
  } else {
    const ok = wiz.preview.filter((r) => !r._bad).length;
    body = `<h4>۴️⃣ تأیید نهایی</h4>
    <div class="fin-verdict">📥 ${faDigits(String(ok))} تراکنش وارد می‌شود.</div>
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm" data-action="iz-wiz-back">→ قبلی</button>
    <button class="fin-btn fin-btn-sm fin-btn-primary" data-action="iz-wiz-import">✅ وارد کردن الآن</button>
    <button class="fin-btn fin-btn-sm" data-action="iz-wiz-cancel">✕ انصراف</button></div>`;
  }
  return `<div class="fin-panel"><div class="fin-steps">${stepsBar}</div>${body}</div>`;
}

function mapOpts(headers, sel, optional = false) {
  return (optional ? ['<option value="">— ندارد —</option>'] : []).concat(
    headers.map((h, i) => `<option value="${i}" ${String(i) === String(sel) ? 'selected' : ''}>${escapeHtml(h)}</option>`)
  ).join('');
}

function renderAttach(ctx, api) {
  const s = ctx.state.settings;
  const att = loadAtt();
  const txs = ctx.helpers.txs || [];
  const byId = new Map(txs.map((t) => [String(t.id), t]));
  const ids = Object.keys(att).filter((id) => byId.has(id) && att[id].length);
  if (attTarget && byId.has(String(attTarget)) && !ids.includes(String(attTarget))) ids.unshift(String(attTarget));
  const total = ids.reduce((a, id) => a + att[id].length, 0);
  const cards = ids.slice(0, 40).map((id) => {
    const t = byId.get(id);
    const isTarget = String(id) === String(attTarget);
    return `<div class="fin-loan-card${isTarget ? ' fin-target' : ''}"><div class="fin-loan-head"><b>🧾 ${escapeHtml(t.note || t.title || 'تراکنش')}</b>
      <span class="fin-badge">${formatMoney(t.amount, s)}</span></div>
      <div class="fin-att-grid">${att[id].map((a, i) => `<button class="fin-att-thumb" data-action="iz-att-view" data-id="${id}" data-i="${i}"><img src="${a.data}" alt="" /></button>`).join('')}</div>
      <div class="fin-btn-row">
        <button class="fin-btn fin-btn-sm" data-action="iz-att-add" data-id="${id}">➕ افزودن رسید</button>
        <button class="fin-btn fin-btn-sm" data-action="iz-att-clear" data-id="${id}">🗑 حذف همه</button>
      </div></div>`;
  }).join('');
  return `<div class="fin-kpis"><div class="fin-kpi"><span>🧾 کل رسیدها</span><b>${faDigits(String(total))}</b></div>
    <div class="fin-kpi"><span>🧾 تراکنش‌های دارای رسید</span><b>${faDigits(String(ids.length))}</b></div></div>
  <div class="fin-panel"><div class="fin-hint">برای هر تراکنش، عکس فاکتور/رسید ذخیره کن. از لیست تراکنش‌ها هم دکمه 📎 دارد.</div>
  <input type="file" data-iz="att-file" accept="image/*" class="fin-hidden" /></div>
  <div class="fin-loan-grid">${cards || '<div class="fin-panel"><div class="fin-empty">🧾 رسیدی ثبت نشده. از تب تراکنش‌ها روی 📎 بزن.</div></div>'}</div>`;
}

const FX_LIST = [['USD', 'دلار آمریکا'], ['EUR', 'یورو'], ['GBP', 'پوند'], ['AED', 'درهم امارات'], ['TRY', 'لیر ترکیه'], ['TMN', 'تومان ایران']];
function renderFx(ctx, api, ui) {
  const fx = loadFx();
  const amt = Number(ui.fxAmount) || 0;
  const toTmn = (code, v) => code === 'TMN' ? v : v * (Number(fx.rates[code]) || 0);
  const fromTmn = (code, v) => code === 'TMN' ? v : v / (Number(fx.rates[code]) || 1);
  const result = fromTmn(ui.fxTo, toTmn(ui.fxFrom, amt));
  const opts = (sel) => FX_LIST.map(([c, n]) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${c} — ${n}</option>`).join('');
  const rates = FX_LIST.filter(([c]) => c !== 'TMN').map(([c, n]) =>
    `<label>${n} (${c})<input data-iz="fx-rate" data-c="${c}" type="number" min="0" step="any" value="${fx.rates[c] || ''}" /></label>`).join('');
  return `
  <div class="fin-grid-2">
    <div class="fin-panel"><h4>💱 تبدیل ارز</h4>
      <div class="fin-form-grid">
        <label>مبلغ<input data-iz="fx-amount" type="number" min="0" step="any" value="${ui.fxAmount}" /></label>
        <label>از<select data-iz="fx-from">${opts(ui.fxFrom)}</select></label>
        <label>به<select data-iz="fx-to">${opts(ui.fxTo)}</select></label>
      </div>
      <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="iz-fx-run">💱 تبدیل</button>
      <button class="fin-btn fin-btn-sm" data-action="iz-fx-swap">🔁 جابه‌جایی</button></div>
      <div class="fin-verdict">=${amt ? ` <b>${faDigits(result.toLocaleString('en-US', { maximumFractionDigits: 2 }))}</b> ${ui.fxTo}` : ' —'}</div>
    </div>
    <div class="fin-panel"><h4>⚙️ نرخ‌های دستی (به تومان)</h4>
      <div class="fin-form-grid">${rates}</div>
      <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="iz-fx-save">💾 ذخیره نرخ‌ها</button></div>
      <div class="fin-hint">آخرین به‌روزرسانی: ${fx.updatedAt ? new Date(fx.updatedAt).toLocaleString('fa-IR') : 'هرگز'}</div>
    </div>
  </div>
  <div class="fin-panel"><h4>💱 قیمت ارزها به تومان</h4><canvas data-iz="fxbars" height="150"></canvas></div>`;
}

/* ---------- پس از رندر ---------- */
export function afterInsightsRender(root, ctx) {
  const daily = root.querySelector('[data-iz="daily-data"]');
  const dc = root.querySelector('[data-iz="daily"]');
  if (daily && dc) {
    try { drawFinSpark(dc, JSON.parse(daily.textContent || '[]'), { h: 130, color: '#f43f5e' }); } catch { /* ignore */ }
  }
  const donut = root.querySelector('[data-iz="donut"]');
  if (donut) {
    const now = Date.now();
    const cats = new Map((ctx.helpers.categories || []).map((c) => [c.id, c.name || c.title || 'دسته']));
    const byCat = new Map();
    for (const t of ctx.helpers.txs || []) {
      const at = Date.parse(t.date || t.createdAt || 0) || 0;
      if (t.type !== 'expense' || at < now - 30 * 864e5) continue;
      byCat.set(t.categoryId || '', (byCat.get(t.categoryId || '') || 0) + (Number(t.amount) || 0));
    }
    drawFinDonut(donut, [...byCat.entries()].map(([k, v]) => ({ label: cats.get(k) || 'بدون دسته', value: v })), { h: 170 });
  }
  const fx = root.querySelector('[data-iz="fxbars"]');
  if (fx) {
    const rates = loadFx().rates;
    drawFinHBars(fx, FX_LIST.filter(([c]) => c !== 'TMN').map(([c, n]) => ({ label: `${n} (${c})`, value: Number(rates[c]) || 0 })));
  }
  void drawFinWaterfall;
}

/* ---------- اکشن‌ها ---------- */
let attTarget = '';

function autoMap(headers) {
  const find = (...keys) => {
    const i = headers.findIndex((h) => keys.some((k) => String(h).toLowerCase().includes(k)));
    return i >= 0 ? String(i) : '0';
  };
  return {
    date: find('date', 'tarikh', 'تاریخ'),
    desc: find('desc', 'title', 'note', 'شرح', 'عنوان', 'توضیح'),
    amount: find('amount', 'price', 'مبلغ', 'قیمت'),
    type: (() => { const i = headers.findIndex((h) => /type|kind|نوع/i.test(String(h))); return i >= 0 ? String(i) : ''; })(),
  };
}

function parseAmountFa(raw) {
  if (raw == null) return NaN;
  let s = String(raw).replace(/[٬,٬\s]/g, '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  s = s.replace(/[^\d.\-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? Math.abs(n) : NaN;
}

function buildPreview(wiz) {
  const { rows, headers, map, def } = wiz;
  return rows.map((r) => {
    const dateRaw = String(r[Number(map.date)] ?? '').trim();
    const at = Date.parse(dateRaw);
    const desc = String(r[Number(map.desc)] ?? '').trim();
    const amount = parseAmountFa(r[Number(map.amount)]);
    let type = def.type || 'expense';
    if (map.type !== '' && map.type != null) {
      const tv = String(r[Number(map.type)] ?? '').toLowerCase();
      if (/in|income|دخل|درآمد|واریز|credit/.test(tv)) type = 'income';
      else if (/out|expense|خرج|هزینه|برداشت|debit/.test(tv)) type = 'expense';
    }
    const out = { date: Number.isFinite(at) ? new Date(at).toISOString() : '', desc, amount, type };
    if (!out.date) out._bad = 'تاریخ نامعتبر';
    else if (!Number.isFinite(amount) || amount <= 0) out._bad = 'مبلغ نامعتبر';
    return out;
  });
}

export async function handleInsightsAction(action, el, api) {
  const { ctx, root, toast, openModal, closeModal, refresh } = api;
  const ui = loadUi();
  switch (action) {
    case 'iz-view': saveUi({ view: el.dataset.v || 'insights' }); api.renderContent(); return true;
    case 'iz-tx': {
      api.gotoTab?.('txs');
      return true;
    }
    case 'iz-sub-make': {
      const dataEl = root.querySelector('[data-iz="subs-data"]');
      const subs = dataEl ? JSON.parse(dataEl.textContent || '[]') : [];
      const sub = subs[Number(el.dataset.i)];
      if (!sub) return true;
      const { createRecurring } = await import('../../../core/services/finance-service.js');
      const accs = ctx.helpers.accounts || [];
      await createRecurring({
        title: sub.label, type: 'expense', amount: sub.amount,
        accountId: sub.accountId || accs[0]?.id || '', categoryId: sub.categoryId || '',
        frequency: sub.avgGap <= 10 ? 'weekly' : sub.avgGap >= 350 ? 'yearly' : 'monthly',
        nextRun: new Date(Date.now() + sub.avgGap * 864e5).toISOString(),
      });
      await refresh(false);
      toast('🔁 تراکنش دوره‌ای ساخته شد.');
      api.renderContent();
      return true;
    }
    case 'iz-wiz-pick': root.querySelector('[data-iz="wiz-file"]')?.click(); return true;
    case 'iz-wiz-next': {
      const wiz = ui.wiz;
      if (!wiz) return true;
      if (wiz.step === 1) {
        wiz.map = {
          date: root.querySelector('[data-iz="map-date"]')?.value ?? '0',
          desc: root.querySelector('[data-iz="map-desc"]')?.value ?? '0',
          amount: root.querySelector('[data-iz="map-amount"]')?.value ?? '0',
          type: root.querySelector('[data-iz="map-type"]')?.value ?? '',
        };
      } else if (wiz.step === 2) {
        wiz.def = {
          accountId: root.querySelector('[data-iz="wiz-acc"]')?.value || '',
          categoryId: root.querySelector('[data-iz="wiz-cat"]')?.value || '',
          type: root.querySelector('[data-iz="wiz-type"]')?.value || 'expense',
        };
        wiz.preview = buildPreview(wiz);
      }
      wiz.step = Math.min(4, (wiz.step || 1) + 1);
      saveUi({ wiz });
      api.renderContent();
      return true;
    }
    case 'iz-wiz-back': {
      const wiz = ui.wiz;
      if (!wiz) return true;
      wiz.step = Math.max(1, (wiz.step || 2) - 1);
      saveUi({ wiz });
      api.renderContent();
      return true;
    }
    case 'iz-wiz-cancel': saveUi({ wiz: null }); api.renderContent(); return true;
    case 'iz-wiz-import': {
      const wiz = ui.wiz;
      if (!wiz) return true;
      const ok = (wiz.preview || []).filter((r) => !r._bad);
      if (!ok.length) { toast('❌ ردیف سالمی نیست.'); return true; }
      const { importParsedRows } = await import('../../../core/services/finance-service.js');
      const rows = ok.map((r) => ({ date: r.date, note: r.desc, amount: r.amount, type: r.type }));
      await importParsedRows(rows, { defaultAccountId: wiz.def?.accountId || '', defaultCategoryId: wiz.def?.categoryId || '' });
      await refresh(false);
      saveUi({ wiz: null });
      toast(`📥 ${faDigits(String(rows.length))} تراکنش وارد شد.`);
      api.gotoTab?.('txs');
      return true;
    }
    case 'iz-att-add': {
      attTarget = el.dataset.id;
      root.querySelector('[data-iz="att-file"]')?.click();
      return true;
    }
    case 'iz-att-clear': {
      if (!confirm('🗑 همه رسیدهای این تراکنش حذف شود؟')) return true;
      const all = loadAtt();
      delete all[String(el.dataset.id)];
      saveAtt(all);
      api.renderContent();
      return true;
    }
    case 'iz-att-view': {
      const arr = loadAtt()[String(el.dataset.id)] || [];
      const a = arr[Number(el.dataset.i)];
      if (!a) return true;
      openModal(`<div class="fin-modal" data-close-modal><div class="fin-modal-panel fin-modal-wide" role="dialog">
        <button class="modal-x" data-close-modal>✕</button>
        <h3>🧾 رسید</h3><img src="${a.data}" class="fin-att-full" alt="receipt" />
        <div class="fin-btn-row"><button class="fin-btn" data-close-modal>بستن</button></div>
      </div></div>`);
      return true;
    }
    case 'iz-fx-run': {
      saveUi({
        fxAmount: root.querySelector('[data-iz="fx-amount"]')?.value || '0',
        fxFrom: root.querySelector('[data-iz="fx-from"]')?.value || 'USD',
        fxTo: root.querySelector('[data-iz="fx-to"]')?.value || 'TMN',
      });
      api.renderContent();
      return true;
    }
    case 'iz-fx-swap': {
      saveUi({ fxFrom: ui.fxTo, fxTo: ui.fxFrom });
      api.renderContent();
      return true;
    }
    case 'iz-fx-save': {
      const fx = loadFx();
      root.querySelectorAll('[data-iz="fx-rate"]').forEach((inp) => {
        const v = Number(inp.value);
        if (v > 0) fx.rates[inp.dataset.c] = v;
      });
      fx.updatedAt = Date.now();
      saveFx(fx);
      toast('💾 نرخ‌ها ذخیره شد.');
      api.renderContent();
      return true;
    }
    default: return false;
  }
}

export function handleInsightsChange(el, api) {
  if (el.matches?.('[data-iz="wiz-file"]')) {
    const f = el.files?.[0];
    if (f) {
      f.text().then((text) => {
        try {
          const parsed = parseSmartCsv(text);
          if (!parsed.headers.length || !parsed.rows.length) { api.toast('❌ فایل خالی یا نامعتبر است.'); return; }
          saveUi({ wiz: { name: f.name, headers: parsed.headers, rows: parsed.rows.slice(0, 2000), map: autoMap(parsed.headers), def: { type: 'expense' }, step: 1, preview: [] } });
          api.renderContent();
        } catch { api.toast('❌ خواندن فایل ناموفق بود.'); }
      }).catch(() => api.toast('❌ خواندن فایل ناموفق بود.'));
    }
    el.value = '';
    return true;
  }
  if (el.matches?.('[data-iz="att-file"]')) {
    const f = el.files?.[0];
    if (f && attTarget) {
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const cv = document.createElement('canvas');
          const sc = Math.min(1, 900 / Math.max(img.width, img.height));
          cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          const all = loadAtt();
          const arr = all[String(attTarget)] || [];
          arr.push({ data: cv.toDataURL('image/jpeg', 0.78), at: Date.now() });
          all[String(attTarget)] = arr.slice(-6);
          try { saveAtt(all); } catch { api.toast('❌ حافظه مرورگر پر شد!'); return; }
          api.renderContent();
          api.toast('🧾 رسید ثبت شد.');
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    }
    el.value = '';
    return true;
  }
  return false;
}

export function setAttTarget(id) { attTarget = id; }

function parseSmartCsv(text) {
  const clean = String(text || '').replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const delim = [',', ';', '\t', '|'].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const split = (line) => {
    const out = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; }
        else q = !q;
      } else if (ch === delim && !q) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out.map((x) => x.replace(/^"|"$/g, ''));
  };
  return { headers: split(lines[0]), rows: lines.slice(1).map(split) };
}

export { toLocalDateInput };
