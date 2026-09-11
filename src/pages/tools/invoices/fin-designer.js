// 🧾 ViXoRa Invoice Studio — طراح فاکتور، پیش‌فاکتور، مالیات، یادآوری، اقساط فاکتور
import {
  escapeHtml, formatMoney, faDigits, invoiceTotals, invoiceDisplayStatus, toLocalDateInput,
} from '../../../core/schemas/finance-schema.js';
import { drawFinDonut, drawFinHBars } from './fin-charts.js';

const UI_KEY = 'ViXoRa:fin-designer-ui';
const PROFILE_KEY = 'ViXoRa:fin-biz-profile';
const QUOTE_KEY = 'ViXoRa:fin-quotes';
const PAY_KEY = 'ViXoRa:fin-inv-payments';
const REC_KEY = 'ViXoRa:fin-inv-recurring';

function loadUi() {
  try {
    return { view: 'gallery', invId: '', theme: 'modern', quoteFilter: 'all', ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') };
  } catch { return { view: 'gallery', invId: '', theme: 'modern', quoteFilter: 'all' }; }
}
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* ignore */ }
  return u;
}
function loadProfile() {
  try {
    return {
      name: 'کسب‌وکار من', phone: '', address: '', taxId: '', logo: '',
      prefix: 'INV-', nextNum: 1001, footer: 'از اعتماد شما سپاسگزاریم 🙏',
      ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'),
    };
  } catch { return { name: 'کسب‌وکار من', phone: '', address: '', taxId: '', logo: '', prefix: 'INV-', nextNum: 1001, footer: 'از اعتماد شما سپاسگزاریم 🙏' }; }
}
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
function loadQuotes() { try { return JSON.parse(localStorage.getItem(QUOTE_KEY) || '{}'); } catch { return {}; } }
function saveQuotes(q) { try { localStorage.setItem(QUOTE_KEY, JSON.stringify(q)); } catch { /* ignore */ } }
function loadPay() { try { return JSON.parse(localStorage.getItem(PAY_KEY) || '{}'); } catch { return {}; } }
function savePay(p) { try { localStorage.setItem(PAY_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
function loadRec() { try { return JSON.parse(localStorage.getItem(REC_KEY) || '{}'); } catch { return {}; } }
function saveRec(r) { try { localStorage.setItem(REC_KEY, JSON.stringify(r)); } catch { /* ignore */ } }

export function isQuote(id) { return !!loadQuotes()[String(id)]; }
export function invPaid(id) { return (loadPay()[String(id)] || []).reduce((a, p) => a + (Number(p.amount) || 0), 0); }
export function invRemaining(doc) { return Math.max(0, invoiceTotals(doc).total - invPaid(doc.id)); }

export const DS_THEMES = {
  modern: { name: 'مدرن بنفش', c1: '#8b5cf6', c2: '#ec4899', bg: '#ffffff', ink: '#1e1b2e' },
  classic: { name: 'کلاسیک سرمه‌ای', c1: '#1e3a5f', c2: '#3b82f6', bg: '#ffffff', ink: '#111827' },
  minimal: { name: 'مینیمال', c1: '#111827', c2: '#6b7280', bg: '#ffffff', ink: '#111827' },
  dark: { name: 'تیره', c1: '#34d399', c2: '#a3e635', bg: '#0f172a', ink: '#f1f5f9' },
  sunny: { name: 'آفتابی', c1: '#f59e0b', c2: '#ef4444', bg: '#fffbeb', ink: '#451a03' },
  sea: { name: 'دریایی', c1: '#0ea5e9', c2: '#2dd4bf', bg: '#f0fdfa', ink: '#083344' },
};

/* ---------- رندر ---------- */
const VIEWS = [
  { id: 'gallery', label: '🎨 گالری و پیش‌نمایش' },
  { id: 'profile', label: '🏪 پروفایل کسب‌وکار' },
  { id: 'quotes', label: '📝 پیش‌فاکتورها' },
  { id: 'recurring', label: '🔁 فاکتورهای دوره‌ای' },
  { id: 'aging', label: '⏰ سررسید و یادآوری' },
  { id: 'statements', label: '📒 صورت‌حساب مشتری' },
];

export function renderDesignerView(ctx, api) {
  const ui = loadUi();
  const tabs = VIEWS.map((v) =>
    `<button class="fin-btn fin-btn-sm ${ui.view === v.id ? 'fin-btn-primary' : ''}" data-action="ds-view" data-v="${v.id}">${v.label}</button>`
  ).join('');
  let body = '';
  if (ui.view === 'profile') body = renderProfile(ctx, api, ui);
  else if (ui.view === 'quotes') body = renderQuotes(ctx, api, ui);
  else if (ui.view === 'recurring') body = renderRecurring(ctx, api, ui);
  else if (ui.view === 'aging') body = renderAging(ctx, api, ui);
  else if (ui.view === 'statements') body = renderStatements(ctx, api, ui);
  else body = renderGallery(ctx, api, ui);
  return `<div class="fin-secbar"><h3>🧾 استودیو فاکتور</h3><div class="fin-secbar-actions">${tabs}</div></div>${body}`;
}

function currentInv(ctx, ui) {
  const invs = ctx.helpers.invoices || [];
  return invs.find((d) => String(d.id) === String(ui.invId)) || invs[0] || null;
}

function renderGallery(ctx, api, ui) {
  const s = ctx.state.settings;
  const invs = ctx.helpers.invoices || [];
  const inv = currentInv(ctx, ui);
  if (!inv) return `<div class="fin-panel"><div class="fin-empty">📄 فاکتوری نیست.<br /><button class="fin-btn fin-btn-primary" data-action="open-invoice-modal" style="margin-top:10px">➕ ساخت فاکتور</button></div></div>`;
  const opts = invs.map((x) => `<option value="${x.id}" ${String(x.id) === String(inv.id) ? 'selected' : ''}>${escapeHtml(x.number || '')} — ${escapeHtml(x.customer || '')}</option>`).join('');
  const themes = Object.entries(DS_THEMES).map(([k, t]) =>
    `<button class="fin-theme-card ${ui.theme === k ? 'is-on' : ''}" data-action="ds-theme" data-v="${k}">
      <span class="fin-theme-swatch" style="background:linear-gradient(135deg,${t.c1},${t.c2})"></span><b>${t.name}</b>
    </button>`).join('');
  const t = invoiceTotals(inv);
  return `
  <div class="fin-panel"><div class="fin-form-grid">
    <label>فاکتور<select data-ds="inv-sel">${opts}</select></label>
  </div>
  <div class="fin-btn-row">
    <button class="fin-btn fin-btn-sm fin-btn-primary" data-action="ds-print" data-id="${inv.id}">🖨 چاپ / PDF</button>
    <button class="fin-btn fin-btn-sm" data-action="ds-pay" data-id="${inv.id}">💰 ثبت پرداخت جزئی (${formatMoney(invRemaining(inv), s)} مانده)</button>
    <button class="fin-btn fin-btn-sm" data-action="ds-dup" data-id="${inv.id}">📋 تکثیر</button>
    <button class="fin-btn fin-btn-sm" data-action="ds-wa" data-id="${inv.id}">📲 متن واتساپ</button>
    <button class="fin-btn fin-btn-sm" data-action="${isQuote(inv.id) ? 'ds-unquote' : 'ds-quote'}" data-id="${inv.id}">${isQuote(inv.id) ? '📄 تبدیل به فاکتور' : '📝 تبدیل به پیش‌فاکتور'}</button>
    <button class="fin-btn fin-btn-sm" data-action="edit-invoice" data-id="${inv.id}">✏️ ویرایش اقلام</button>
  </div>
  <div class="fin-hint">جمع: <b>${formatMoney(t.total, s)}</b> • پرداخت‌شده: ${formatMoney(invPaid(inv.id), s)} • مانده: <b>${formatMoney(invRemaining(inv), s)}</b>${isQuote(inv.id) ? ' • 📝 پیش‌فاکتور' : ''}</div></div>
  <div class="fin-panel"><h4>🎨 قالب چاپ</h4><div class="fin-theme-grid">${themes}</div></div>
  <div class="fin-panel"><h4>👁 پیش‌نمایش زنده</h4><div class="fin-preview-frame">${invoiceHtml(ctx, inv, DS_THEMES[ui.theme] || DS_THEMES.modern, s)}</div></div>`;
}

function renderProfile(ctx, api) {
  const p = loadProfile();
  return `
  <div class="fin-panel"><h4>🏪 پروفایل کسب‌وکار (سربرگ فاکتور)</h4>
    <div class="fin-form-grid">
      <label>نام کسب‌وکار<input data-ds="p-name" value="${escapeHtml(p.name)}" /></label>
      <label>تلفن<input data-ds="p-phone" value="${escapeHtml(p.phone)}" /></label>
      <label>شناسه مالیاتی<input data-ds="p-taxid" value="${escapeHtml(p.taxId)}" /></label>
      <label>آدرس<input data-ds="p-address" value="${escapeHtml(p.address)}" /></label>
      <label>پیشوند شماره فاکتور<input data-ds="p-prefix" value="${escapeHtml(p.prefix)}" dir="ltr" /></label>
      <label>شماره بعدی<input data-ds="p-next" type="number" min="1" value="${p.nextNum}" dir="ltr" /></label>
    </div>
    <label class="fin-label">متن پانوشت<textarea data-ds="p-footer" rows="2">${escapeHtml(p.footer)}</textarea></label>
    <div class="fin-btn-row">
      <button class="fin-btn fin-btn-sm fin-btn-primary" data-action="ds-profile-save">💾 ذخیره پروفایل</button>
      <button class="fin-btn fin-btn-sm" data-action="ds-logo">🖼 آپلود لوگو</button>
      ${p.logo ? '<button class="fin-btn fin-btn-sm" data-action="ds-logo-del">✕ حذف لوگو</button>' : ''}
    </div>
    ${p.logo ? `<div class="fin-hint">لوگو ثبت شده ✅</div><img src="${p.logo}" alt="logo" class="fin-logo-preview" />` : '<div class="fin-hint">لوگویی ثبت نشده.</div>'}
    <input type="file" data-ds="logo-file" accept="image/*" class="fin-hidden" />
  </div>`;
}

function renderQuotes(ctx, api, ui) {
  const s = ctx.state.settings;
  const quotes = loadQuotes();
  const invs = (ctx.helpers.invoices || []).filter((d) => quotes[String(d.id)]);
  const cards = invs.map((d) => {
    const t = invoiceTotals(d);
    return `<div class="fin-loan-card"><div class="fin-loan-head"><b>📝 ${escapeHtml(d.customer || '')}</b><span class="fin-badge">${escapeHtml(d.number || '')}</span></div>
      <div class="fin-loan-amount">${formatMoney(t.total, s)}</div>
      <div class="fin-btn-row">
        <button class="fin-btn fin-btn-sm fin-btn-primary" data-action="ds-unquote" data-id="${d.id}">📄 تبدیل به فاکتور قطعی</button>
        <button class="fin-btn fin-btn-sm" data-action="ds-preview" data-id="${d.id}">👁 پیش‌نمایش</button>
        <button class="fin-btn fin-btn-sm" data-action="ds-wa" data-id="${d.id}">📲 ارسال</button>
      </div></div>`;
  }).join('');
  return `<div class="fin-kpis"><div class="fin-kpi"><span>📝 پیش‌فاکتورهای باز</span><b>${faDigits(String(invs.length))}</b></div>
    <div class="fin-kpi"><span>💰 ارزش کل</span><b>${formatMoney(invs.reduce((a, d) => a + invoiceTotals(d).total, 0), s)}</b></div></div>
  <div class="fin-loan-grid">${cards || '<div class="fin-panel"><div class="fin-empty">📝 پیش‌فاکتوری نیست. از گالری، هر فاکتور را به پیش‌فاکتور تبدیل کن.</div></div>'}</div>`;
}

function renderRecurring(ctx, api) {
  const s = ctx.state.settings;
  const invs = ctx.helpers.invoices || [];
  const rec = loadRec();
  const rows = invs.map((d) => {
    const r = rec[String(d.id)];
    return `<div class="fin-order-row"><b>📄</b>
      <span>${escapeHtml(d.customer || '')} — ${escapeHtml(d.number || '')} (${formatMoney(invoiceTotals(d).total, s)})</span>
      ${r?.active
        ? `<span class="fin-badge">🔁 ${r.freq === 'weekly' ? 'هفتگی' : r.freq === 'yearly' ? 'سالانه' : 'ماهانه'} • بعدی: ${new Date(r.nextRun).toLocaleDateString('fa-IR')}</span>
           <button class="fin-btn fin-btn-sm" data-action="ds-rec-off" data-id="${d.id}">⏸ توقف</button>
           <button class="fin-btn fin-btn-sm" data-action="ds-rec-now" data-id="${d.id}">⚡ صدور الآن</button>`
        : `<button class="fin-btn fin-btn-sm" data-action="ds-rec-on" data-id="${d.id}">🔁 دوره‌ای کردن</button>`}
    </div>`;
  }).join('');
  return `<div class="fin-panel"><h4>🔁 فاکتورهای دوره‌ای (اشتراک/اجاره/پشتیبانی)</h4>
    <div class="fin-hint">فاکتور دوره‌ای = الگویی که هر ماه/هفته/سال یک نسخه جدید از آن صادر می‌شود.</div>
    <div class="fin-btn-row"><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="ds-rec-due">⚡ صدور همه سررسیدشده‌ها</button></div>
    ${rows || '<div class="fin-empty">فاکتوری نیست.</div>'}</div>`;
}

function renderAging(ctx, api) {
  const s = ctx.state.settings;
  const invs = (ctx.helpers.invoices || []).filter((d) => d.status !== 'paid' && d.status !== 'cancelled' && !isQuote(d.id));
  const now = Date.now();
  const buckets = { cur: [], d30: [], d60: [], old: [] };
  for (const d of invs) {
    const rem = invRemaining(d);
    if (rem <= 0) continue;
    const due = d.dueDate ? Date.parse(d.dueDate) : NaN;
    const days = Number.isFinite(due) ? Math.floor((now - due) / 864e5) : -999;
    const row = { d, rem, days };
    if (days <= 0) buckets.cur.push(row);
    else if (days <= 30) buckets.d30.push(row);
    else if (days <= 60) buckets.d60.push(row);
    else buckets.old.push(row);
  }
  const total = [...buckets.cur, ...buckets.d30, ...buckets.d60, ...buckets.old].reduce((a, x) => a + x.rem, 0);
  const secs = [
    ['cur', '✅ نرسیده به سررسید'], ['d30', '⚠️ ۱ تا ۳۰ روز گذشته'], ['d60', '🟠 ۳۱ تا ۶۰ روز گذشته'], ['old', '🔴 بیش از ۶۰ روز'],
  ].map(([k, label]) => `
    <div class="fin-panel"><h4>${label} — ${formatMoney(buckets[k].reduce((a, x) => a + x.rem, 0), s)}</h4>
    ${buckets[k].map(({ d, rem, days }) => `<div class="fin-order-row"><b>📄</b>
      <span>${escapeHtml(d.customer || '')} — ${escapeHtml(d.number || '')} • مانده <b>${formatMoney(rem, s)}</b>${days > 0 ? ` • ${faDigits(String(days))} روز تأخیر` : ''}</span>
      <button class="fin-btn fin-btn-sm" data-action="ds-remind" data-id="${d.id}">💬 متن یادآوری</button>
      <button class="fin-btn fin-btn-sm" data-action="ds-pay" data-id="${d.id}">💰 پرداخت</button></div>`).join('') || '<div class="fin-empty">—</div>'}</div>`).join('');
  return `<div class="fin-kpis"><div class="fin-kpi"><span>💰 کل مطالبات باز</span><b>${formatMoney(total, s)}</b></div>
    <div class="fin-kpi"><span>🔴 معوق بیش از ۶۰ روز</span><b>${formatMoney(buckets.old.reduce((a, x) => a + x.rem, 0), s)}</b></div></div>
  <div class="fin-panel"><h4>📊 نمودار سنی مطالبات</h4><canvas data-ds="aging" height="150"></canvas></div>${secs}`;
}

function renderStatements(ctx, api, ui) {
  const s = ctx.state.settings;
  const invs = ctx.helpers.invoices || [];
  const customers = [...new Set(invs.map((d) => d.customer || 'مشتری'))];
  const sel = ui.customer || customers[0] || '';
  const opts = customers.map((c) => `<option ${c === sel ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
  const mine = invs.filter((d) => (d.customer || 'مشتری') === sel);
  const rows = mine.map((d) => {
    const t = invoiceTotals(d);
    const paid = invPaid(d.id);
    return `<tr><td>${new Date(d.date).toLocaleDateString('fa-IR')}</td><td>${escapeHtml(d.number || '')}${isQuote(d.id) ? ' 📝' : ''}</td>
      <td>${formatMoney(t.total, s)}</td><td class="fin-pos">${formatMoney(paid, s)}</td>
      <td><b>${formatMoney(t.total - paid, s)}</b></td><td>${statusFa(invoiceDisplayStatus(d))}</td></tr>`;
  }).join('');
  const tot = mine.reduce((a, d) => a + invoiceTotals(d).total, 0);
  const paid = mine.reduce((a, d) => a + invPaid(d.id), 0);
  return `<div class="fin-panel"><div class="fin-form-grid"><label>مشتری<select data-ds="cust-sel">${opts || '<option>—</option>'}</select></label></div>
    <div class="fin-kpis"><div class="fin-kpi"><span>📄 جمع فاکتورها</span><b>${formatMoney(tot, s)}</b></div>
    <div class="fin-kpi"><span>✅ دریافتی</span><b>${formatMoney(paid, s)}</b></div>
    <div class="fin-kpi"><span>💰 مانده حساب</span><b>${formatMoney(tot - paid, s)}</b></div></div></div>
  <div class="fin-panel"><h4>📒 صورت‌حساب ${escapeHtml(sel)}</h4>
    <div class="fin-table-wrap"><table class="fin-table"><thead><tr><th>تاریخ</th><th>شماره</th><th>مبلغ</th><th>پرداخت</th><th>مانده</th><th>وضعیت</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function statusFa(st) {
  return { draft: '📝 پیش‌نویس', sent: '📤 ارسال‌شده', paid: '✅ پرداخت‌شده', overdue: '🔴 معوق', cancelled: '🚫 لغوشده' }[st] || st;
}

/* ---------- HTML فاکتور ---------- */
export function invoiceHtml(ctx, doc, theme, s) {
  const p = loadProfile();
  const t = invoiceTotals(doc);
  const paid = invPaid(doc.id);
  const rem = Math.max(0, t.total - paid);
  const quote = isQuote(doc.id);
  const rows = (doc.items || []).map((it, i) => `<tr><td>${faDigits(String(i + 1))}</td><td>${escapeHtml(it.desc)}</td>
    <td>${faDigits(String(it.qty))}</td><td>${formatMoney(it.price, s)}</td><td>${formatMoney(it.qty * it.price, s)}</td></tr>`).join('');
  return `<div class="fin-doc" style="--dc1:${theme.c1};--dc2:${theme.c2};--dbg:${theme.bg};--dink:${theme.ink}">
    <div class="fin-doc-head">
      <div class="fin-doc-brand">
        ${p.logo ? `<img src="${p.logo}" class="fin-doc-logo" alt="" />` : `<div class="fin-doc-logo fin-doc-logo-fallback">🏪</div>`}
        <div><b>${escapeHtml(p.name)}</b><br /><small>${escapeHtml(p.phone)} ${escapeHtml(p.address)}</small></div>
      </div>
      <div class="fin-doc-title">${quote ? '📝 پیش‌فاکتور' : '🧾 فاکتور فروش'}<br /><small>${escapeHtml(doc.number || '')}</small></div>
    </div>
    <div class="fin-doc-meta">
      <span>👤 ${escapeHtml(doc.customer || '')}</span>
      <span>📅 صدور: ${new Date(doc.date).toLocaleDateString('fa-IR')}</span>
      ${doc.dueDate ? `<span>⏰ سررسید: ${new Date(doc.dueDate).toLocaleDateString('fa-IR')}</span>` : ''}
      <span>${statusFa(invoiceDisplayStatus(doc))}</span>
    </div>
    <table class="fin-doc-table"><thead><tr><th>#</th><th>شرح</th><th>تعداد</th><th>فی</th><th>مبلغ</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="fin-doc-sums">
      <span>جمع: ${formatMoney(t.subtotal, s)}</span>
      ${t.discount ? `<span>تخفیف: ${formatMoney(t.discount, s)}</span>` : ''}
      ${t.tax ? `<span>مالیات (${faDigits(String(doc.taxPercent))}٪): ${formatMoney(t.tax, s)}</span>` : ''}
      ${paid ? `<span>پرداخت‌شده: ${formatMoney(paid, s)}</span>` : ''}
      <b class="fin-doc-total">قابل پرداخت: ${formatMoney(rem, s)}</b>
    </div>
    ${doc.note ? `<div class="fin-doc-note">📝 ${escapeHtml(doc.note)}</div>` : ''}
    <div class="fin-doc-foot">${escapeHtml(p.footer)}${p.taxId ? ` • شناسه مالیاتی: ${escapeHtml(p.taxId)}` : ''}</div>
  </div>`;
}

/* ---------- پس از رندر ---------- */
export function afterDesignerRender(root, ctx) {
  const aging = root.querySelector('[data-ds="aging"]');
  if (aging) {
    const invs = (ctx.helpers.invoices || []).filter((d) => d.status !== 'paid' && d.status !== 'cancelled' && !isQuote(d.id));
    const now = Date.now();
    const sums = [0, 0, 0, 0];
    for (const d of invs) {
      const rem = invRemaining(d);
      if (rem <= 0) continue;
      const due = d.dueDate ? Date.parse(d.dueDate) : NaN;
      const days = Number.isFinite(due) ? Math.floor((now - due) / 864e5) : -999;
      sums[days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : 3] += rem;
    }
    drawFinHBars(aging, [
      { label: 'نرسیده', value: sums[0], color: '#34d399' },
      { label: '۱-۳۰ روز', value: sums[1], color: '#fbbf24' },
      { label: '۳۱-۶۰ روز', value: sums[2], color: '#fb923c' },
      { label: '۶۰+ روز', value: sums[3], color: '#f43f5e' },
    ]);
  }
  void drawFinDonut;
}

/* ---------- اکشن‌ها ---------- */
export async function handleDesignerAction(action, el, api) {
  const { ctx, root, toast, openModal, closeModal, refresh } = api;
  const s = () => ctx.state.settings;
  switch (action) {
    case 'ds-view': saveUi({ view: el.dataset.v || 'gallery' }); api.renderContent(); return true;
    case 'ds-theme': saveUi({ theme: el.dataset.v }); api.renderContent(); return true;
    case 'ds-preview': saveUi({ view: 'gallery', invId: el.dataset.id }); api.renderContent(); return true;
    case 'ds-quote': {
      const q = loadQuotes(); q[String(el.dataset.id)] = true; saveQuotes(q);
      toast('📝 به پیش‌فاکتور تبدیل شد.');
      api.renderContent(); return true;
    }
    case 'ds-unquote': {
      const q = loadQuotes(); delete q[String(el.dataset.id)]; saveQuotes(q);
      try {
        const { updateInvoiceDoc } = await import('../../../core/services/finance-service.js');
        await updateInvoiceDoc(el.dataset.id, { status: 'sent' });
        await refresh(false);
      } catch { /* ignore */ }
      toast('📄 به فاکتور قطعی تبدیل و «ارسال‌شده» شد.');
      api.renderContent(); return true;
    }
    case 'ds-dup': {
      const src = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(el.dataset.id));
      if (!src) return true;
      const { createInvoiceDoc } = await import('../../../core/services/finance-service.js');
      const p = loadProfile();
      const num = `${p.prefix}${p.nextNum}`;
      p.nextNum += 1; saveProfile(p);
      const copy = await createInvoiceDoc({ ...src, number: num, status: 'draft', date: new Date().toISOString() });
      await refresh(false);
      saveUi({ invId: copy.id });
      toast(`📋 تکثیر شد با شماره ${num}`);
      api.renderContent(); return true;
    }
    case 'ds-print': {
      const doc = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(el.dataset.id));
      if (!doc) return true;
      printInvoice(ctx, doc, DS_THEMES[loadUi().theme] || DS_THEMES.modern);
      return true;
    }
    case 'ds-pay': openModal(payModal(ctx, el.dataset.id)); return true;
    case 'ds-pay-save': {
      const form = el.closest('form');
      const id = form?.dataset.id;
      const amount = Number(form?.querySelector('[name="amount"]')?.value) || 0;
      if (!id || amount <= 0) { toast('❌ مبلغ معتبر وارد کن.'); return true; }
      const note = form.querySelector('[name="note"]')?.value?.trim() || '';
      const all = loadPay();
      all[String(id)] = [...(all[String(id)] || []), { amount, note, at: new Date().toISOString() }];
      savePay(all);
      // ثبت تراکنش درآمد هم‌زمان
      try {
        const { createTx } = await import('../../../core/services/finance-service.js');
        const doc = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(id));
        const accountId = form.querySelector('[name="account"]')?.value || '';
        if (accountId) await createTx({ type: 'income', amount, accountId, date: new Date().toISOString(), note: `دریافت فاکتور ${doc?.number || ''} ${doc?.customer || ''} ${note}`.trim(), categoryId: '' });
        await refresh(false);
      } catch { /* ignore */ }
      closeModal();
      toast('💰 پرداخت ثبت شد.');
      api.renderContent(); return true;
    }
    case 'ds-wa': {
      const doc = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(el.dataset.id));
      if (!doc) return true;
      copyText(waText(ctx, doc));
      toast('📲 متن فاکتور کپی شد — در واتساپ بچسبان.');
      return true;
    }
    case 'ds-remind': {
      const doc = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(el.dataset.id));
      if (!doc) return true;
      copyText(remindText(ctx, doc));
      toast('💬 متن یادآوری کپی شد.');
      return true;
    }
    case 'ds-profile-save': {
      saveProfile({
        ...loadProfile(),
        name: root.querySelector('[data-ds="p-name"]')?.value?.trim() || 'کسب‌وکار من',
        phone: root.querySelector('[data-ds="p-phone"]')?.value?.trim() || '',
        taxId: root.querySelector('[data-ds="p-taxid"]')?.value?.trim() || '',
        address: root.querySelector('[data-ds="p-address"]')?.value?.trim() || '',
        prefix: root.querySelector('[data-ds="p-prefix"]')?.value?.trim() || 'INV-',
        nextNum: Number(root.querySelector('[data-ds="p-next"]')?.value) || 1001,
        footer: root.querySelector('[data-ds="p-footer"]')?.value || '',
      });
      toast('💾 پروفایل ذخیره شد.');
      api.renderContent(); return true;
    }
    case 'ds-logo': root.querySelector('[data-ds="logo-file"]')?.click(); return true;
    case 'ds-logo-del': { const p = loadProfile(); p.logo = ''; saveProfile(p); api.renderContent(); return true; }
    case 'ds-rec-on': openModal(recModal(ctx, el.dataset.id)); return true;
    case 'ds-rec-save': {
      const form = el.closest('form');
      const id = form?.dataset.id;
      const freq = form?.querySelector('[name="freq"]')?.value || 'monthly';
      const all = loadRec();
      all[String(id)] = { freq, nextRun: new Date(Date.now() + (freq === 'weekly' ? 7 : freq === 'yearly' ? 365 : 30) * 864e5).toISOString(), active: true };
      saveRec(all);
      closeModal();
      toast('🔁 فاکتور دوره‌ای شد.');
      api.renderContent(); return true;
    }
    case 'ds-rec-off': {
      const all = loadRec();
      if (all[String(el.dataset.id)]) all[String(el.dataset.id)].active = false;
      saveRec(all);
      api.renderContent(); return true;
    }
    case 'ds-rec-now': {
      await issueRecurring(ctx, api, el.dataset.id, false);
      return true;
    }
    case 'ds-rec-due': {
      const all = loadRec();
      let n = 0;
      for (const [id, r] of Object.entries(all)) {
        if (r?.active && Date.parse(r.nextRun || 0) <= Date.now()) {
          await issueRecurring(ctx, api, id, true);
          n++;
        }
      }
      toast(n ? `⚡ ${faDigits(String(n))} فاکتور دوره‌ای صادر شد.` : 'مورد سررسیدشده‌ای نیست.');
      api.renderContent(); return true;
    }
    default: return false;
  }
}

async function issueRecurring(ctx, api, id, advance) {
  const src = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(id));
  if (!src) return;
  const { createInvoiceDoc } = await import('../../../core/services/finance-service.js');
  const p = loadProfile();
  const num = `${p.prefix}${p.nextNum}`;
  p.nextNum += 1; saveProfile(p);
  await createInvoiceDoc({ ...src, number: num, status: 'sent', date: new Date().toISOString() });
  if (advance) {
    const all = loadRec();
    const r = all[String(id)];
    if (r) {
      const days = r.freq === 'weekly' ? 7 : r.freq === 'yearly' ? 365 : 30;
      r.nextRun = new Date(Date.parse(r.nextRun || 0) + days * 864e5).toISOString();
      saveRec(all);
    }
  }
  await api.refresh(false);
}

export function handleDesignerChange(el, api) {
  if (el.matches?.('[data-ds="inv-sel"]')) { saveUi({ invId: el.value }); api.renderContent(); return true; }
  if (el.matches?.('[data-ds="cust-sel"]')) { saveUi({ customer: el.value }); api.renderContent(); return true; }
  if (el.matches?.('[data-ds="logo-file"]')) {
    const f = el.files?.[0];
    if (f) {
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const cv = document.createElement('canvas');
          const sc = Math.min(1, 240 / Math.max(img.width, img.height));
          cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          const p = loadProfile();
          p.logo = cv.toDataURL('image/jpeg', 0.82);
          saveProfile(p);
          api.renderContent();
          api.toast('🖼 لوگو ثبت شد.');
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

function payModal(ctx, id) {
  const doc = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(id));
  if (!doc) return '';
  const s = ctx.state.settings;
  const pays = loadPay()[String(id)] || [];
  const accs = (ctx.helpers.accounts || []).map((a) => `<option value="${a.id}">${escapeHtml(a.name || '')}</option>`).join('');
  return `<div class="fin-modal" data-close-modal><div class="fin-modal-panel" role="dialog">
    <button class="modal-x" data-close-modal>✕</button>
    <h3>💰 پرداخت فاکتور ${escapeHtml(doc.number || '')}</h3>
    <div class="fin-hint">جمع: <b>${formatMoney(invoiceTotals(doc).total, s)}</b> • مانده: <b>${formatMoney(invRemaining(doc), s)}</b></div>
    <form data-form="__none" data-id="${doc.id}" onsubmit="return false">
      <div class="fin-form-grid">
        <label>مبلغ دریافتی<input name="amount" type="number" min="0" step="any" value="${invRemaining(doc)}" /></label>
        <label>واریز به حساب<select name="account"><option value="">— فقط ثبت روی فاکتور —</option>${accs}</select></label>
        <label>یادداشت<input name="note" placeholder="مثلاً: کارت‌به‌کارت" /></label>
      </div>
      <div class="fin-btn-row">
        <button type="button" class="fin-btn fin-btn-primary" data-action="ds-pay-save">💾 ثبت پرداخت</button>
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
      </div>
    </form>
    ${pays.length ? `<h4>🧾 پرداخت‌های قبلی</h4>${pays.map((p) => `<div class="fin-order-row"><span>${new Date(p.at).toLocaleDateString('fa-IR')} — ${escapeHtml(p.note || '—')}</span><b>${formatMoney(p.amount, s)}</b></div>`).join('')}` : ''}
  </div></div>`;
}

function recModal(ctx, id) {
  const doc = (ctx.helpers.invoices || []).find((d) => String(d.id) === String(id));
  if (!doc) return '';
  return `<div class="fin-modal" data-close-modal><div class="fin-modal-panel" role="dialog">
    <button class="modal-x" data-close-modal>✕</button>
    <h3>🔁 دوره‌ای کردن: ${escapeHtml(doc.customer || '')}</h3>
    <form data-form="__none" data-id="${doc.id}" onsubmit="return false">
      <div class="fin-form-grid"><label>تکرار<select name="freq"><option value="weekly">هفتگی</option><option value="monthly" selected>ماهانه</option><option value="yearly">سالانه</option></select></label></div>
      <div class="fin-btn-row">
        <button type="button" class="fin-btn fin-btn-primary" data-action="ds-rec-save">🔁 فعال‌سازی</button>
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
      </div>
    </form>
  </div></div>`;
}

function waText(ctx, doc) {
  const s = ctx.state.settings;
  const p = loadProfile();
  const t = invoiceTotals(doc);
  const lines = [
    `${isQuote(doc.id) ? '📝 پیش‌فاکتور' : '🧾 فاکتور'} ${doc.number || ''} — ${p.name}`,
    `👤 ${doc.customer || ''}`,
    `📅 ${new Date(doc.date).toLocaleDateString('fa-IR')}`,
    '➖➖➖',
    ...(doc.items || []).map((it) => `• ${it.desc} ×${faDigits(String(it.qty))} = ${formatMoney(it.qty * it.price, s)}`),
    '➖➖➖',
    `💰 جمع: ${formatMoney(t.total, s)}`,
    invPaid(doc.id) ? `✅ پرداخت‌شده: ${formatMoney(invPaid(doc.id), s)}` : '',
    `💳 مانده: ${formatMoney(invRemaining(doc), s)}`,
    p.phone ? `📞 ${p.phone}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function remindText(ctx, doc) {
  const s = ctx.state.settings;
  const p = loadProfile();
  const due = doc.dueDate ? Date.parse(doc.dueDate) : NaN;
  const days = Number.isFinite(due) ? Math.max(0, Math.floor((Date.now() - due) / 864e5)) : 0;
  return [
    `سلام ${doc.customer || ''} عزیز 🌹`,
    `یادآوری پرداخت ${isQuote(doc.id) ? 'پیش‌فاکتور' : 'فاکتور'} ${doc.number || ''} به مبلغ ${formatMoney(invRemaining(doc), s)}`,
    days ? `(${faDigits(String(days))} روز از سررسید گذشته)` : '',
    `با تشکر — ${p.name}${p.phone ? ` (${p.phone})` : ''}`,
  ].filter(Boolean).join('\n');
}

function copyText(text) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* ignore */ }
  ta.remove();
}

function printInvoice(ctx, doc, theme) {
  const s = ctx.state.settings;
  const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>${escapeHtml(doc.number || 'invoice')}</title>
  <style>
    *{box-sizing:border-box} body{font-family:Tahoma,Arial;margin:0;padding:24px;color:${theme.ink};background:${theme.bg}}
    .fin-doc{max-width:720px;margin:auto;border:2px solid ${theme.c1};border-radius:16px;overflow:hidden}
    .fin-doc-head{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${theme.c1},${theme.c2});color:#fff;padding:18px 22px}
    .fin-doc-brand{display:flex;gap:12px;align-items:center}
    .fin-doc-logo{width:54px;height:54px;border-radius:12px;object-fit:cover;background:#fff}
    .fin-doc-title{font-size:20px;font-weight:800;text-align:left}
    .fin-doc-meta{display:flex;gap:14px;flex-wrap:wrap;padding:12px 22px;border-bottom:1px dashed #999;font-size:13px}
    .fin-doc-table{width:100%;border-collapse:collapse;font-size:13px}
    .fin-doc-table th{background:${theme.c1};color:#fff;padding:9px}
    .fin-doc-table td{padding:8px;border-bottom:1px solid #ddd;text-align:center}
    .fin-doc-sums{display:flex;flex-direction:column;gap:4px;align-items:flex-end;padding:14px 22px;font-size:14px}
    .fin-doc-total{font-size:18px;color:${theme.c1}}
    .fin-doc-note{margin:0 22px 10px;font-size:12px}
    .fin-doc-foot{text-align:center;font-size:12px;padding:12px;border-top:1px dashed #999}
    @media print{body{padding:0}}
  </style></head><body>${invoiceHtml(ctx, doc, theme, s)}
  <script>window.onload=()=>{window.print();};<\/script></body></html>`;
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
