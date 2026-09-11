// src/pages/tools/invoices/invoices-editor.js

/**
 * مودال‌های سوپراپ مالی — همه با دکمه بستن + ESC + کلیک بیرون
 */

import { escapeHtml, toLocalDateInput, ACCOUNT_TYPE_LABELS } from '../../../core/schemas/finance-schema.js';

function shell({ title, body, wide = false }) {
  return `<div class="modal-overlay fin-modal-overlay" data-close-modal>
    <div class="modal-panel fin-modal ${wide ? 'fin-modal-wide' : ''}" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>${title}</h3>
        <button class="modal-x" data-close-modal aria-label="بستن">✕</button>
      </div>
      <div class="modal-body">${body}</div>
    </div>
  </div>`;
}

function accountOptions(accounts, selected = '') {
  return accounts.map((a) => `<option value="${a.id}" ${selected === a.id ? 'selected' : ''}>${escapeHtml(a.icon)} ${escapeHtml(a.name)}</option>`).join('');
}

function categoryOptions(categories, type, selected = '') {
  const list = categories.filter((c) => c.type === type || c.type === 'both');
  return `<option value="">— بدون دسته —</option>` + list.map((c) => `<option value="${c.id}" ${selected === c.id ? 'selected' : ''}>${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('');
}

/* --- تراکنش --- */

export function txModal(h, { type = 'expense', existing = null, template = null } = {}) {
  const t = existing || {};
  const v = {
    type: t.type || template?.type || type,
    amount: t.amount ?? template?.amount ?? '',
    title: t.title ?? template?.title ?? '',
    accountId: t.accountId ?? template?.accountId ?? h.accounts[0]?.id ?? '',
    toAccountId: t.toAccountId ?? '',
    categoryId: t.categoryId ?? template?.categoryId ?? '',
    at: t.at ? toLocalDateInput(t.at) : toLocalDateInput(new Date().toISOString()),
    time: t.at ? new Date(t.at).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
    note: t.note ?? '',
    tags: (t.tags || []).join(', '),
  };
  const quick = (h.settings.quickAmounts || []).map((q) => `<button type="button" class="fin-btn fin-btn-sm fin-quick" data-amount="${q}">${Number(q).toLocaleString('en-US')}</button>`).join('');
  return shell({
    title: existing ? '✏️ ویرایش تراکنش' : v.type === 'income' ? '📥 درآمد جدید' : v.type === 'transfer' ? '🔄 انتقال جدید' : '📤 خرج جدید',
    body: `<form class="fin-form" data-form="tx" data-id="${existing?.id || ''}">
      <div class="fin-type-tabs">
        ${[['expense', '📤 خرج'], ['income', '📥 درآمد'], ['transfer', '🔄 انتقال']].map(([val, label]) => `<button type="button" class="fin-btn fin-btn-sm ${v.type === val ? 'fin-btn-primary' : ''}" data-tx-type="${val}">${label}</button>`).join('')}
      </div>
      <input type="hidden" name="type" value="${v.type}" />
      <label>مبلغ*<input class="fin-input fin-amount" name="amount" type="number" min="0" step="any" required value="${escapeHtml(String(v.amount))}" inputmode="numeric" /></label>
      ${quick ? `<div class="fin-quick-row">${quick}</div>` : ''}
      <label>عنوان*<input class="fin-input" name="title" required value="${escapeHtml(v.title)}" placeholder="مثلاً ناهار، حقوق…" /></label>
      <div class="fin-form-2col">
        <label>${v.type === 'transfer' ? 'از حساب' : 'حساب'}*<select class="fin-input" name="accountId">${accountOptions(h.accounts, v.accountId)}</select></label>
        ${v.type === 'transfer'
          ? `<label>به حساب*<select class="fin-input" name="toAccountId">${accountOptions(h.accounts, v.toAccountId)}</select></label>`
          : `<label>دسته<select class="fin-input" name="categoryId" data-cat-select>${categoryOptions(h.categories, v.type, v.categoryId)}</select></label>`}
      </div>
      <div class="fin-form-2col">
        <label>تاریخ<input type="date" class="fin-input" name="date" value="${v.at}" /></label>
        <label>ساعت<input type="time" class="fin-input" name="time" value="${v.time}" /></label>
      </div>
      <label>تگ‌ها (با کاما)<input class="fin-input" name="tags" value="${escapeHtml(v.tags)}" placeholder="مثلاً ضروری، سفر" /></label>
      <label>یادداشت<textarea class="fin-input" name="note" rows="2">${escapeHtml(v.note)}</textarea></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره تغییرات' : 'ثبت تراکنش'}</button>
      </div>
    </form>`,
  });
}

/* --- بودجه --- */

export function budgetModal(h, existing = null) {
  return shell({
    title: existing ? '✏️ ویرایش بودجه' : '🎯 بودجه جدید',
    body: `<form class="fin-form" data-form="budget" data-id="${existing?.id || ''}">
      <label>دسته<select class="fin-input" name="categoryId">
        <option value="all" ${!existing || existing.categoryId === 'all' ? 'selected' : ''}>🌍 کل خرج‌ها</option>
        ${h.categories.filter((c) => c.type !== 'income').map((c) => `<option value="${c.id}" ${existing?.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('')}
      </select></label>
      <label>سقف دوره*<input class="fin-input" name="amount" type="number" min="1" required value="${escapeHtml(String(existing?.amount ?? ''))}" /></label>
      <label class="fin-check-label"><input type="checkbox" name="rollover" ${existing?.rollover ? 'checked' : ''} /> مانده مصرف‌نشده به دوره بعد منتقل شود</label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ساخت بودجه'}</button>
      </div>
    </form>`,
  });
}

/* --- هدف --- */

export function goalModal(h, existing = null) {
  return shell({
    title: existing ? '✏️ ویرایش هدف' : '🌟 هدف جدید',
    body: `<form class="fin-form" data-form="goal" data-id="${existing?.id || ''}">
      <label>عنوان هدف*<input class="fin-input" name="title" required value="${escapeHtml(existing?.title || '')}" placeholder="مثلاً سفر، لپ‌تاپ…" /></label>
      <div class="fin-form-2col">
        <label>آیکون (ایموجی)<input class="fin-input" name="icon" value="${escapeHtml(existing?.icon || '🌟')}" maxlength="4" /></label>
        <label>رنگ<input type="color" class="fin-input fin-color" name="color" value="${escapeHtml(existing?.color || '#10b981')}" /></label>
      </div>
      <label>مبلغ هدف*<input class="fin-input" name="target" type="number" min="1" required value="${escapeHtml(String(existing?.target ?? ''))}" /></label>
      <div class="fin-form-2col">
        <label>موجودی فعلی<input class="fin-input" name="saved" type="number" min="0" value="${escapeHtml(String(existing?.saved ?? 0))}" /></label>
        <label>مهلت<input type="date" class="fin-input" name="deadline" value="${existing?.deadline ? toLocalDateInput(existing.deadline) : ''}" /></label>
      </div>
      <label>یادداشت<textarea class="fin-input" name="note" rows="2">${escapeHtml(existing?.note || '')}</textarea></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ساخت هدف'}</button>
      </div>
    </form>`,
  });
}

export function moneyModal({ title, action, id, amount = '', accounts = [], showAccount = true, accountLabel = 'حساب', note = '' }) {
  return shell({
    title,
    body: `<form class="fin-form" data-form="${action}" data-id="${id}">
      <label>مبلغ*<input class="fin-input fin-amount" name="amount" type="number" min="1" step="any" required value="${escapeHtml(String(amount))}" /></label>
      ${showAccount ? `<label>${accountLabel}<select class="fin-input" name="accountId"><option value="">— بدون ثبت بانکی —</option>${accountOptions(accounts)}</select></label>` : ''}
      <label>یادداشت<input class="fin-input" name="note" value="${escapeHtml(note)}" /></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">ثبت</button>
      </div>
    </form>`,
  });
}

/* --- بدهی --- */

export function debtModal(h, existing = null) {
  return shell({
    title: existing ? '✏️ ویرایش' : '🤝 ثبت بدهی / طلب / وام',
    body: `<form class="fin-form" data-form="debt" data-id="${existing?.id || ''}">
      <label>نوع<select class="fin-input" name="debtType">
        ${[['owe', '📤 بدهی من (به دیگران بدهکارم)'], ['owed', '📥 طلب من (از دیگران طلبکارم)'], ['loan', '🏦 وام / قسطی']].map(([v, l]) => `<option value="${v}" ${existing?.debtType === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
      <label>طرف مقابل*<input class="fin-input" name="person" required value="${escapeHtml(existing?.person || '')}" placeholder="مثلاً علی، بانک…" /></label>
      <label>عنوان<input class="fin-input" name="title" value="${escapeHtml(existing?.title || '')}" placeholder="مثلاً قرض، وام ازدواج…" /></label>
      <div class="fin-form-2col">
        <label>مبلغ کل*<input class="fin-input" name="total" type="number" min="1" required value="${escapeHtml(String(existing?.total ?? ''))}" /></label>
        <label>مهلت تسویه<input type="date" class="fin-input" name="dueDate" value="${existing?.dueDate ? toLocalDateInput(existing.dueDate) : ''}" /></label>
      </div>
      <div class="fin-form-2col">
        <label>تعداد اقساط (وام)<input class="fin-input" name="months" type="number" min="0" value="${escapeHtml(String(existing?.months ?? 0))}" /></label>
        <label>مبلغ هر قسط<input class="fin-input" name="monthlyAmount" type="number" min="0" value="${escapeHtml(String(existing?.monthlyAmount ?? 0))}" /></label>
      </div>
      <label>یادداشت<input class="fin-input" name="note" value="${escapeHtml(existing?.note || '')}" /></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ثبت'}</button>
      </div>
    </form>`,
  });
}

/* --- فاکتور --- */

export function invoiceModal(h, existing = null) {
  const items = existing?.items?.length ? existing.items : [{ desc: '', qty: 1, price: '' }];
  return shell({
    title: existing ? `✏️ ویرایش فاکتور ${escapeHtml(existing.number || '')}` : '📄 فاکتور جدید',
    wide: true,
    body: `<form class="fin-form" data-form="invoice" data-id="${existing?.id || ''}">
      <div class="fin-form-2col">
        <label>نام مشتری*<input class="fin-input" name="customer" required value="${escapeHtml(existing?.customer || '')}" /></label>
        <label>وضعیت<select class="fin-input" name="status">
          ${[['draft', 'پیش‌نویس'], ['sent', 'ارسال‌شده'], ['paid', 'پرداخت‌شده'], ['cancelled', 'لغوشده']].map(([v, l]) => `<option value="${v}" ${existing?.status === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></label>
      </div>
      <div class="fin-form-2col">
        <label>تاریخ صدور<input type="date" class="fin-input" name="date" value="${existing ? toLocalDateInput(existing.date) : toLocalDateInput(new Date().toISOString())}" /></label>
        <label>سررسید<input type="date" class="fin-input" name="dueDate" value="${existing?.dueDate ? toLocalDateInput(existing.dueDate) : ''}" /></label>
      </div>
      <div class="fin-inv-items" data-inv-items>
        ${items.map((it) => invItemRow(it)).join('')}
      </div>
      <button type="button" class="fin-btn fin-btn-sm" data-action="inv-add-row">➕ افزودن قلم</button>
      <div class="fin-form-2col">
        <label>تخفیف (مبلغ)<input class="fin-input" name="discount" type="number" min="0" value="${escapeHtml(String(existing?.discount ?? 0))}" /></label>
        <label>مالیات (درصد)<input class="fin-input" name="taxPercent" type="number" min="0" max="100" value="${escapeHtml(String(existing?.taxPercent ?? 0))}" /></label>
      </div>
      <label>حساب واریز (برای وصول)<select class="fin-input" name="accountId"><option value="">—</option>${accountOptions(h.accounts, existing?.accountId || '')}</select></label>
      <label>توضیحات<textarea class="fin-input" name="note" rows="2">${escapeHtml(existing?.note || '')}</textarea></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ثبت فاکتور'}</button>
      </div>
    </form>`,
  });
}

function invItemRow(it = {}) {
  return `<div class="fin-inv-row" data-inv-row>
    <input class="fin-input" data-cell="desc" placeholder="شرح کالا/خدمت*" value="${escapeHtml(it.desc || '')}" />
    <input class="fin-input" data-cell="qty" type="number" min="0" step="any" placeholder="تعداد" value="${escapeHtml(String(it.qty ?? 1))}" />
    <input class="fin-input" data-cell="price" type="number" min="0" step="any" placeholder="فی*" value="${escapeHtml(String(it.price ?? ''))}" />
    <button type="button" class="fin-icon-btn" data-action="inv-del-row">🗑</button>
  </div>`;
}

export function invItemRowHtml() {
  return invItemRow({});
}

/* --- قبض --- */

export function billModal(h, existing = null) {
  return shell({
    title: existing ? '✏️ ویرایش قبض' : '💡 قبض جدید',
    body: `<form class="fin-form" data-form="bill" data-id="${existing?.id || ''}">
      <label>عنوان قبض*<input class="fin-input" name="title" required value="${escapeHtml(existing?.title || '')}" placeholder="مثلاً اجاره، برق، اینترنت…" /></label>
      <div class="fin-form-2col">
        <label>آیکون<input class="fin-input" name="icon" value="${escapeHtml(existing?.icon || '💡')}" maxlength="4" /></label>
        <label>سررسید هر ماه شمسی (روز)<input class="fin-input" name="dueDay" type="number" min="1" max="29" value="${escapeHtml(String(existing?.dueDay ?? 1))}" /></label>
      </div>
      <label>مبلغ تقریبی<input class="fin-input" name="expected" type="number" min="0" value="${escapeHtml(String(existing?.expected ?? ''))}" /></label>
      <div class="fin-form-2col">
        <label>دسته<select class="fin-input" name="categoryId">${categoryOptions(h.categories, 'expense', existing?.categoryId || '')}</select></label>
        <label>حساب پرداخت<select class="fin-input" name="accountId"><option value="">—</option>${accountOptions(h.accounts, existing?.accountId || '')}</select></label>
      </div>
      <label class="fin-check-label"><input type="checkbox" name="active" ${!existing || existing.active !== false ? 'checked' : ''} /> فعال (در یادآورها نمایش داده شود)</label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ثبت قبض'}</button>
      </div>
    </form>`,
  });
}

/* --- تکرارشونده --- */

export function recurringModal(h, existing = null) {
  return shell({
    title: existing ? '✏️ ویرایش تراکنش دوره‌ای' : '🔁 تراکنش دوره‌ای جدید',
    body: `<form class="fin-form" data-form="recurring" data-id="${existing?.id || ''}">
      <label>عنوان*<input class="fin-input" name="title" required value="${escapeHtml(existing?.title || '')}" placeholder="مثلاً حقوق، اجاره…" /></label>
      <div class="fin-form-2col">
        <label>نوع<select class="fin-input" name="type"><option value="expense" ${!existing || existing.type === 'expense' ? 'selected' : ''}>📤 خرج</option><option value="income" ${existing?.type === 'income' ? 'selected' : ''}>📥 درآمد</option></select></label>
        <label>مبلغ*<input class="fin-input" name="amount" type="number" min="1" required value="${escapeHtml(String(existing?.amount ?? ''))}" /></label>
      </div>
      <div class="fin-form-2col">
        <label>حساب*<select class="fin-input" name="accountId">${accountOptions(h.accounts, existing?.accountId || '')}</select></label>
        <label>دسته<select class="fin-input" name="categoryId">${categoryOptions(h.categories, existing?.type || 'expense', existing?.categoryId || '')}</select></label>
      </div>
      <div class="fin-form-2col">
        <label>تکرار<select class="fin-input" name="frequency">
          ${[['daily', 'روزانه'], ['weekly', 'هفتگی'], ['monthly', 'ماهانه'], ['yearly', 'سالانه'], ['custom', 'هر چند روز یک‌بار']].map(([v, l]) => `<option value="${v}" ${existing?.frequency === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></label>
        <label>هر چند روز (سفارشی)<input class="fin-input" name="customDays" type="number" min="1" value="${escapeHtml(String(existing?.customDays ?? 30))}" /></label>
      </div>
      <label>اولین اجرا<input type="date" class="fin-input" name="nextRun" value="${existing ? toLocalDateInput(existing.nextRun) : toLocalDateInput(new Date().toISOString())}" /></label>
      <label class="fin-check-label"><input type="checkbox" name="active" ${!existing || existing.active !== false ? 'checked' : ''} /> فعال</label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ثبت'}</button>
      </div>
    </form>`,
  });
}

/* --- قانون --- */

export function ruleModal(h) {
  return shell({
    title: '🤖 قانون دسته‌بندی خودکار',
    body: `<form class="fin-form" data-form="rule">
      <p class="fin-hint">وقتی عنوان تراکنش شامل کلیدواژه باشد، به‌صورت خودکار به این دسته می‌رود.</p>
      <label>کلیدواژه*<input class="fin-input" name="keyword" required placeholder="مثلاً اسنپ" /></label>
      <label>دسته*<select class="fin-input" name="categoryId">${h.categories.map((c) => `<option value="${c.id}">${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('')}</select></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">ثبت قانون</button>
      </div>
    </form>`,
  });
}

/* --- حساب / دسته --- */

const ACCOUNT_ICONS = ['💵', '🏦', '👛', '💳', '📈', '🪙', '💰'];

export function accountModal(h, existing = null) {
  return shell({
    title: existing ? '✏️ ویرایش حساب' : '🏦 حساب جدید',
    body: `<form class="fin-form" data-form="account" data-id="${existing?.id || ''}">
      <label>نام حساب*<input class="fin-input" name="name" required value="${escapeHtml(existing?.name || '')}" /></label>
      <div class="fin-form-2col">
        <label>نوع<select class="fin-input" name="accType">${Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => `<option value="${v}" ${existing?.accType === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>آیکون<select class="fin-input" name="icon">${ACCOUNT_ICONS.map((i) => `<option ${existing?.icon === i ? 'selected' : ''}>${i}</option>`).join('')}</select></label>
      </div>
      <label>موجودی اولیه<input class="fin-input" name="initial" type="number" step="any" value="${escapeHtml(String(existing?.initial ?? 0))}" /></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ساخت حساب'}</button>
      </div>
    </form>`,
  });
}

export function categoryModal(h, existing = null) {
  return shell({
    title: existing ? '✏️ ویرایش دسته' : '🏷 دسته جدید',
    body: `<form class="fin-form" data-form="category" data-id="${existing?.id || ''}">
      <label>نام دسته*<input class="fin-input" name="name" required value="${escapeHtml(existing?.name || '')}" /></label>
      <div class="fin-form-2col">
        <label>نوع<select class="fin-input" name="type">
          ${[['expense', 'خرج'], ['income', 'درآمد'], ['both', 'هر دو']].map(([v, l]) => `<option value="${v}" ${existing?.type === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></label>
        <label>آیکون (ایموجی)<input class="fin-input" name="icon" value="${escapeHtml(existing?.type ? existing.icon : '🏷')}" maxlength="4" /></label>
      </div>
      <label>رنگ<input type="color" class="fin-input fin-color" name="color" value="${escapeHtml(existing?.color || '#8b5cf6')}" /></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">${existing ? 'ذخیره' : 'ساخت دسته'}</button>
      </div>
    </form>`,
  });
}

/* --- قالب‌ها --- */

export function templatesModal(h) {
  return shell({
    title: '⚡ قالب‌های سریع',
    body: `
      <p class="fin-hint">یک قالب یعنی یک تراکنش آماده؛ با یک کلیک ثبت می‌شود.</p>
      <form class="fin-form" data-form="template">
        <div class="fin-form-2col">
          <label>عنوان*<input class="fin-input" name="title" required placeholder="مثلاً ناهار" /></label>
          <label>مبلغ*<input class="fin-input" name="amount" type="number" min="0" required value="0" /></label>
        </div>
        <div class="fin-form-2col">
          <label>نوع<select class="fin-input" name="type"><option value="expense">📤 خرج</option><option value="income">📥 درآمد</option></select></label>
          <label>آیکون<input class="fin-input" name="icon" value="⚡" maxlength="4" /></label>
        </div>
        <div class="fin-form-2col">
          <label>حساب<select class="fin-input" name="accountId"><option value="">—</option>${accountOptions(h.accounts)}</select></label>
          <label>دسته<select class="fin-input" name="categoryId">${categoryOptions(h.categories, 'expense')}</select></label>
        </div>
        <div class="modal-actions"><button type="submit" class="fin-btn fin-btn-primary">➕ ساخت قالب</button></div>
      </form>
      <hr class="fin-hr" />
      <ul class="fin-mini-list">
        ${h.templates.length ? h.templates.map((t) => `<li><div class="fin-mini-row">
          <span>${escapeHtml(t.icon)} ${escapeHtml(t.title)} — ${t.amount ? `${Number(t.amount).toLocaleString('en-US')}` : '؟'}</span>
          <span><button class="fin-btn fin-btn-sm fin-btn-primary" data-action="tpl-apply" data-id="${t.id}">ثبت ⚡</button>
          <button class="fin-icon-btn" data-action="tpl-del" data-id="${t.id}">🗑</button></span>
        </div></li>`).join('') : '<li class="fin-hint">قالبی نداری.</li>'}
      </ul>
      <div class="modal-actions"><button class="fin-btn" data-close-modal>بستن</button></div>`,
  });
}

/* --- ایمپورت / بازیابی --- */

export function importModal(accounts, categories) {
  return shell({
    title: '⬆️ ایمپورت CSV',
    wide: true,
    body: `<form class="fin-form" data-form="import">
      <p class="fin-hint">ستون‌ها (فارسی یا انگلیسی): عنوان، مبلغ، نوع، تاریخ، دسته، حساب، یادداشت. سطر اول باید سرستون باشد.</p>
      <label>فایل CSV<input type="file" class="fin-input" name="file" accept=".csv,text/csv,text/plain" required /></label>
      <div class="fin-form-2col">
        <label>حساب پیش‌فرض*<select class="fin-input" name="defaultAccountId">${accountOptions(accounts)}</select></label>
        <label>دسته پیش‌فرض<select class="fin-input" name="defaultCategoryId"><option value="">—</option>${categories.map((c) => `<option value="${c.id}">${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('')}</select></label>
      </div>
      <div class="fin-import-preview" data-import-preview></div>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">ایمپورت</button>
      </div>
    </form>`,
  });
}

export function restoreModal() {
  return shell({
    title: '⬆️ بازیابی از بکاپ JSON',
    body: `<form class="fin-form" data-form="restore">
      <p class="fin-hint">فایل بکاپی که قبلاً دانلود کرده‌ای را انتخاب کن. داده‌ها به داده‌های فعلی اضافه می‌شوند.</p>
      <label>فایل بکاپ<input type="file" class="fin-input" name="file" accept=".json,application/json" required /></label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">بازیابی</button>
      </div>
    </form>`,
  });
}

/* --- تأیید --- */

export function confirmModal({ title = 'مطمئنی؟', body = '', action, id = '' }) {
  return shell({
    title,
    body: `<div class="fin-confirm">${body}<div class="modal-actions">
      <button class="fin-btn" data-close-modal>انصراف</button>
      <button class="fin-btn fin-btn-danger" data-action="${action}" data-id="${escapeHtml(String(id))}">تأیید حذف</button>
    </div></div>`,
  });
}

export function promptModal({ title, action, id = '', label = 'مقدار', value = '', options = null }) {
  return shell({
    title,
    body: `<form class="fin-form" data-form="${action}" data-id="${escapeHtml(String(id))}">
      <label>${escapeHtml(label)}${options
        ? `<select class="fin-input" name="value">${options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}</select>`
        : `<input class="fin-input" name="value" value="${escapeHtml(value)}" />`}</label>
      <div class="modal-actions">
        <button type="button" class="fin-btn" data-close-modal>انصراف</button>
        <button type="submit" class="fin-btn fin-btn-primary">ثبت</button>
      </div>
    </form>`,
  });
}
