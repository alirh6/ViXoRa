// src/core/services/finance-service.js

/**
 * ViXoRa Finance Service — سوپراپ مالی
 * ==================================================================
 * همه موجودیت‌ها در tools-service با toolName = 'invoices' و kind جدا:
 * tx | account | category | budget | goal | debt | recurring |
 * invoice | bill | rule | view | template
 */

import {
  getToolData,
  getToolItem,
  createToolItem,
  updateToolItem,
  deleteToolItem,
} from '../actions/tools-service.js';

import {
  FINANCE_TOOL_NAME,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
  DEFAULT_WIDGETS,
  DEFAULT_QUICK_AMOUNTS,
  normalizeTx,
  normalizeAccount,
  normalizeCategory,
  normalizeBudget,
  normalizeGoal,
  normalizeDebt,
  normalizeRecurring,
  normalizeInvoiceDoc,
  normalizeInvoiceItem,
  normalizeBill,
  normalizeRule,
  normalizeSavedView,
  normalizeTemplate,
  validateTxDraft,
  validateAccountDraft,
  validateCategoryDraft,
  validateBudgetDraft,
  validateGoalDraft,
  validateDebtDraft,
  validateRecurringDraft,
  validateInvoiceDraft,
  validateBillDraft,
  advanceRecurringDate,
  debtRemaining,
  createId,
} from '../schemas/finance-schema.js';

import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();
const SETTINGS_KEY = 'ViXoRa:finance-settings';

/* ================================================================== */
/* خواندن پایه                                                           */
/* ================================================================== */

async function readAll() {
  const items = await getToolData(FINANCE_TOOL_NAME);
  return Array.isArray(items) ? items : [];
}

function byKind(items, kind) {
  return items.filter((i) => i && i.kind === kind);
}

export async function getFinanceItem(id) {
  return getToolItem(FINANCE_TOOL_NAME, id).catch(() => null);
}

/* ================================================================== */
/* تنظیمات نمایشی (LocalStorage)                                          */
/* ================================================================== */

export function getFinanceSettings() {
  const saved = storage.get(SETTINGS_KEY, {});
  const defaults = DEFAULT_WIDGETS.map((w, i) => ({ ...w, order: i }));
  const savedList = Array.isArray(saved?.widgets) ? saved.widgets : [];
  const byId = new Map(savedList.map((w) => [w?.id, w]));
  const widgets = defaults.map((d) => {
    const s = byId.get(d.id) || {};
    return {
      ...d,
      visible: s.visible !== false,
      order: Number.isFinite(Number(s.order)) ? Number(s.order) : d.order,
    };
  });
  return {
    currencySymbol: 'تومان',
    symbolPosition: 'after',
    decimals: 0,
    faDigits: true,
    theme: 'emerald',
    density: 'comfortable',
    fiscalStart: 1,
    quickAmounts: [...DEFAULT_QUICK_AMOUNTS],
    widgets,
    invoiceCounter: 1,
    ...(saved || {}),
    widgets,
  };
}

export function saveFinanceSettings(patch = {}) {
  const next = { ...getFinanceSettings(), ...patch };
  if (!Array.isArray(next.widgets) || !next.widgets.length) {
    next.widgets = DEFAULT_WIDGETS.map((w) => ({ ...w }));
  }
  storage.set(SETTINGS_KEY, next);
  return next;
}

export function nextInvoiceNumber() {
  const s = getFinanceSettings();
  const num = Math.max(1, Number(s.invoiceCounter) || 1);
  saveFinanceSettings({ invoiceCounter: num + 1 });
  return `FV-${String(num).padStart(4, '0')}`;
}

/* ================================================================== */
/* پیش‌فرض‌ها                                                            */
/* ================================================================== */

export async function ensureFinanceDefaults() {
  const items = await readAll();
  const hasAccount = byKind(items, 'account').length > 0;
  const hasCategory = byKind(items, 'category').length > 0;

  if (!hasAccount) {
    for (const acc of DEFAULT_ACCOUNTS) {
      await createToolItem(FINANCE_TOOL_NAME, normalizeAccount({ ...acc, initial: 0 }));
    }
  }
  if (!hasCategory) {
    for (const cat of DEFAULT_CATEGORIES) {
      await createToolItem(FINANCE_TOOL_NAME, normalizeCategory({ ...cat, isDefault: true }));
    }
  }
  return getFinanceBundle();
}

export async function getFinanceBundle() {
  const items = await readAll();
  return {
    txs: byKind(items, 'tx').map((i) => normalizeTx(i)),
    accounts: byKind(items, 'account').map((i) => normalizeAccount(i)),
    categories: byKind(items, 'category').map((i) => normalizeCategory(i)),
    budgets: byKind(items, 'budget').map((i) => normalizeBudget(i)),
    goals: byKind(items, 'goal').map((i) => normalizeGoal(i)),
    debts: byKind(items, 'debt').map((i) => normalizeDebt(i)),
    recurrings: byKind(items, 'recurring').map((i) => normalizeRecurring(i)),
    invoices: byKind(items, 'invoice').map((i) => normalizeInvoiceDoc(i)),
    bills: byKind(items, 'bill').map((i) => normalizeBill(i)),
    rules: byKind(items, 'rule').map((i) => normalizeRule(i)),
    views: byKind(items, 'view').map((i) => normalizeSavedView(i)),
    templates: byKind(items, 'template').map((i) => normalizeTemplate(i)),
  };
}

/* ================================================================== */
/* تراکنش‌ها                                                             */
/* ================================================================== */

export async function createTx(draft) {
  const v = validateTxDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(
    FINANCE_TOOL_NAME,
    normalizeTx({ ...draft, amount: v.amount })
  );
  return normalizeTx(created);
}

export async function updateTx(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'tx') throw new Error('تراکنش یافت نشد.');
  const merged = { ...normalizeTx(current), ...patch, id, kind: 'tx' };
  const v = validateTxDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, amount: v.amount, updatedAt: new Date().toISOString() });
  return normalizeTx(updated);
}

export async function deleteTx(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

export async function duplicateTx(id) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'tx') throw new Error('تراکنش یافت نشد.');
  const copy = normalizeTx({ ...current, id: undefined, at: new Date().toISOString(), title: `${current.title} (کپی)` });
  delete copy.id;
  const created = await createToolItem(FINANCE_TOOL_NAME, { ...copy, id: createId('tx') });
  return normalizeTx(created);
}

export async function bulkDeleteTxs(ids) {
  let count = 0;
  for (const id of ids || []) {
    try {
      await deleteToolItem(FINANCE_TOOL_NAME, id);
      count += 1;
    } catch {
      /* ignore */
    }
  }
  return count;
}

export async function bulkUpdateTxs(ids, patch) {
  let count = 0;
  for (const id of ids || []) {
    try {
      const current = await getFinanceItem(id);
      if (!current || current.kind !== 'tx') continue;
      await updateToolItem(FINANCE_TOOL_NAME, id, { ...patch, updatedAt: new Date().toISOString() });
      count += 1;
    } catch {
      /* ignore */
    }
  }
  return count;
}

/* ================================================================== */
/* حساب‌ها و دسته‌ها                                                      */
/* ================================================================== */

export async function createAccount(draft) {
  const v = validateAccountDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeAccount(draft));
  return normalizeAccount(created);
}

export async function updateAccount(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'account') throw new Error('حساب یافت نشد.');
  const merged = { ...normalizeAccount(current), ...patch, id, kind: 'account' };
  const v = validateAccountDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, updatedAt: new Date().toISOString() });
  return normalizeAccount(updated);
}

export async function deleteAccount(id) {
  const items = await readAll();
  const used = byKind(items, 'tx').filter((t) => t.accountId === id || t.toAccountId === id).length;
  if (used > 0) throw new Error(`این حساب در ${used} تراکنش استفاده شده؛ اول آن‌ها را جابه‌جا یا حذف کن.`);
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

export async function createCategory(draft) {
  const v = validateCategoryDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeCategory(draft));
  return normalizeCategory(created);
}

export async function updateCategory(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'category') throw new Error('دسته یافت نشد.');
  const merged = { ...normalizeCategory(current), ...patch, id, kind: 'category' };
  const v = validateCategoryDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, updatedAt: new Date().toISOString() });
  return normalizeCategory(updated);
}

export async function deleteCategory(id) {
  const items = await readAll();
  const used = byKind(items, 'tx').filter((t) => t.categoryId === id).length;
  if (used > 0) throw new Error(`این دسته در ${used} تراکنش استفاده شده؛ اول دسته آن‌ها را عوض کن.`);
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

export function extractTags(txs) {
  const map = new Map();
  for (const tx of txs || []) {
    for (const tag of tx.tags || []) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

/* ================================================================== */
/* بودجه‌ها                                                              */
/* ================================================================== */

export async function createBudget(draft) {
  const v = validateBudgetDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeBudget({ ...draft, amount: v.amount }));
  return normalizeBudget(created);
}

export async function updateBudget(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'budget') throw new Error('بودجه یافت نشد.');
  const merged = { ...normalizeBudget(current), ...patch, id, kind: 'budget' };
  const v = validateBudgetDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, amount: v.amount, updatedAt: new Date().toISOString() });
  return normalizeBudget(updated);
}

export async function deleteBudget(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

/* ================================================================== */
/* اهداف                                                                 */
/* ================================================================== */

export async function createGoal(draft) {
  const v = validateGoalDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeGoal({ ...draft, target: v.target }));
  return normalizeGoal(created);
}

export async function updateGoal(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'goal') throw new Error('هدف یافت نشد.');
  const merged = { ...normalizeGoal(current), ...patch, id, kind: 'goal' };
  const v = validateGoalDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, target: v.target, updatedAt: new Date().toISOString() });
  return normalizeGoal(updated);
}

export async function deleteGoal(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

/** واریز به هدف (اختیاراً با ساخت تراکنش خرج از حساب) */
export async function contributeGoal(id, { amount, accountId = '', categoryId = '', note = '' } = {}) {
  const goal = await getFinanceItem(id);
  if (!goal || goal.kind !== 'goal') throw new Error('هدف یافت نشد.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ معتبر وارد کنید.');
  const contributions = [...(goal.contributions || []), { amount: value, at: new Date().toISOString(), note: String(note || '') }].slice(-100);
  const saved = Math.max(0, Number(goal.saved) || 0) + value;
  const done = saved >= Number(goal.target);
  await updateToolItem(FINANCE_TOOL_NAME, id, { saved, contributions, done, updatedAt: new Date().toISOString() });
  if (accountId) {
    await createTx({
      type: 'expense',
      amount: value,
      title: `واریز به هدف: ${goal.title}`,
      accountId,
      categoryId,
      at: new Date().toISOString(),
      note: String(note || ''),
      tags: ['هدف'],
    });
  }
  const updated = await getFinanceItem(id);
  return normalizeGoal(updated);
}

export async function withdrawGoal(id, { amount, accountId = '', note = '' } = {}) {
  const goal = await getFinanceItem(id);
  if (!goal || goal.kind !== 'goal') throw new Error('هدف یافت نشد.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ معتبر وارد کنید.');
  const saved = Math.max(0, (Number(goal.saved) || 0) - value);
  const contributions = [...(goal.contributions || []), { amount: -value, at: new Date().toISOString(), note: String(note || '') }].slice(-100);
  await updateToolItem(FINANCE_TOOL_NAME, id, { saved, contributions, done: false, updatedAt: new Date().toISOString() });
  if (accountId) {
    await createTx({
      type: 'income',
      amount: value,
      title: `برداشت از هدف: ${goal.title}`,
      accountId,
      at: new Date().toISOString(),
      note: String(note || ''),
      tags: ['هدف'],
    });
  }
  const updated = await getFinanceItem(id);
  return normalizeGoal(updated);
}

/* ================================================================== */
/* بدهی‌ها                                                               */
/* ================================================================== */

export async function createDebt(draft) {
  const v = validateDebtDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeDebt({ ...draft, total: v.total }));
  return normalizeDebt(created);
}

export async function updateDebt(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'debt') throw new Error('مورد یافت نشد.');
  const merged = { ...normalizeDebt(current), ...patch, id, kind: 'debt' };
  const v = validateDebtDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, total: v.total, updatedAt: new Date().toISOString() });
  return normalizeDebt(updated);
}

export async function deleteDebt(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

/** ثبت پرداخت/دریافت قسط (اختیاراً با تراکنش بانکی) */
export async function payDebt(id, { amount, accountId = '', categoryId = '', note = '' } = {}) {
  const debt = await getFinanceItem(id);
  if (!debt || debt.kind !== 'debt') throw new Error('مورد یافت نشد.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ معتبر وارد کنید.');
  const payments = [...(debt.payments || []), { amount: value, at: new Date().toISOString(), note: String(note || '') }].slice(-200);
  const paidTotal = payments.reduce((a, p) => a + Math.max(0, Number(p.amount) || 0), 0);
  const settled = paidTotal >= Number(debt.total);
  await updateToolItem(FINANCE_TOOL_NAME, id, { payments, settled, updatedAt: new Date().toISOString() });
  if (accountId) {
    const isOwed = debt.debtType === 'owed';
    await createTx({
      type: isOwed ? 'income' : 'expense',
      amount: value,
      title: `${isOwed ? 'دریافت طلب از' : debt.debtType === 'loan' ? 'پرداخت قسط' : 'پرداخت بدهی به'} ${debt.person}`,
      accountId,
      categoryId,
      at: new Date().toISOString(),
      note: String(note || ''),
      tags: [debt.debtType === 'loan' ? 'وام' : 'بدهی'],
    });
  }
  const updated = await getFinanceItem(id);
  return normalizeDebt(updated);
}

/* ================================================================== */
/* تکرارشونده‌ها                                                         */
/* ================================================================== */

export async function createRecurring(draft) {
  const v = validateRecurringDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeRecurring({ ...draft, amount: v.amount }));
  return normalizeRecurring(created);
}

export async function updateRecurring(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'recurring') throw new Error('مورد یافت نشد.');
  const merged = { ...normalizeRecurring(current), ...patch, id, kind: 'recurring' };
  const v = validateRecurringDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, amount: v.amount, updatedAt: new Date().toISOString() });
  return normalizeRecurring(updated);
}

export async function deleteRecurring(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

/** اجرای تراکنش‌های دوره‌ای سررسیده (حداکثر ۶۰ مورد عقب‌افتاده) */
export async function processRecurrings() {
  const items = await readAll();
  const list = byKind(items, 'recurring').map((i) => normalizeRecurring(i)).filter((r) => r.active);
  const now = Date.now();
  let created = 0;
  const createdTitles = [];
  for (const rec of list) {
    let next = rec.nextRun;
    let guard = 0;
    while (Date.parse(next) <= now && guard < 60) {
      guard += 1;
      try {
        await createTx({
          type: rec.type,
          amount: rec.amount,
          title: rec.title,
          accountId: rec.accountId,
          categoryId: rec.categoryId,
          at: next,
          note: rec.note || 'خودکار (دوره‌ای)',
          tags: ['خودکار'],
          recurringId: rec.id,
        });
        created += 1;
        if (createdTitles.length < 5) createdTitles.push(rec.title);
      } catch {
        break;
      }
      next = advanceRecurringDate(next, rec.frequency, rec.customDays);
    }
    if (guard > 0) {
      await updateToolItem(FINANCE_TOOL_NAME, rec.id, { nextRun: next, lastRun: new Date().toISOString() }).catch(() => null);
    }
  }
  return { created, titles: createdTitles };
}

/* ================================================================== */
/* فاکتورها                                                              */
/* ================================================================== */

export async function createInvoiceDoc(draft) {
  const v = validateInvoiceDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const doc = normalizeInvoiceDoc(draft);
  if (!doc.number) doc.number = nextInvoiceNumber();
  const created = await createToolItem(FINANCE_TOOL_NAME, doc);
  return normalizeInvoiceDoc(created);
}

export async function updateInvoiceDoc(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'invoice') throw new Error('فاکتور یافت نشد.');
  const merged = { ...normalizeInvoiceDoc(current), ...patch, id, kind: 'invoice' };
  if (patch.items) merged.items = patch.items.map((i) => normalizeInvoiceItem(i));
  const v = validateInvoiceDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, updatedAt: new Date().toISOString() });
  return normalizeInvoiceDoc(updated);
}

export async function deleteInvoiceDoc(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

export async function setInvoiceStatus(id, status) {
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { status, updatedAt: new Date().toISOString() });
  return normalizeInvoiceDoc(updated);
}

/** ثبت وصول فاکتور (ساخت تراکنش درآمد + وضعیت پرداخت‌شده) */
export async function collectInvoice(id, { accountId, categoryId = '' } = {}) {
  const doc = await getFinanceItem(id);
  if (!doc || doc.kind !== 'invoice') throw new Error('فاکتور یافت نشد.');
  if (!accountId) throw new Error('حساب واریز را انتخاب کنید.');
  const subtotal = (doc.items || []).reduce((a, it) => a + Number(it.qty || 0) * Number(it.price || 0), 0);
  const discount = Math.min(subtotal, Number(doc.discount) || 0);
  const tax = ((subtotal - discount) * (Number(doc.taxPercent) || 0)) / 100;
  const total = subtotal - discount + tax;
  await createTx({
    type: 'income',
    amount: total,
    title: `وصول فاکتور ${doc.number} — ${doc.customer}`,
    accountId,
    categoryId,
    at: new Date().toISOString(),
    tags: ['فاکتور'],
  });
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { status: 'paid', updatedAt: new Date().toISOString() });
  return normalizeInvoiceDoc(updated);
}

/* ================================================================== */
/* قبوض                                                                 */
/* ================================================================== */

export async function createBill(draft) {
  const v = validateBillDraft(draft);
  if (!v.valid) throw new Error(v.message);
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeBill(draft));
  return normalizeBill(created);
}

export async function updateBill(id, patch) {
  const current = await getFinanceItem(id);
  if (!current || current.kind !== 'bill') throw new Error('قبض یافت نشد.');
  const merged = { ...normalizeBill(current), ...patch, id, kind: 'bill' };
  const v = validateBillDraft(merged);
  if (!v.valid) throw new Error(v.message);
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, { ...merged, updatedAt: new Date().toISOString() });
  return normalizeBill(updated);
}

export async function deleteBill(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

/** پرداخت قبض (ساخت تراکنش خرج + ثبت تاریخ پرداخت) */
export async function payBill(id, { amount, accountId = '', categoryId = '' } = {}) {
  const bill = await getFinanceItem(id);
  if (!bill || bill.kind !== 'bill') throw new Error('قبض یافت نشد.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ معتبر وارد کنید.');
  if (accountId) {
    await createTx({
      type: 'expense',
      amount: value,
      title: `پرداخت ${bill.title}`,
      accountId,
      categoryId: categoryId || bill.categoryId,
      at: new Date().toISOString(),
      tags: ['قبض'],
    });
  }
  const updated = await updateToolItem(
    FINANCE_TOOL_NAME,
    id,
    { lastPaidAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  );
  return normalizeBill(updated);
}

/* ================================================================== */
/* قوانین، نماها، قالب‌ها                                                 */
/* ================================================================== */

export async function createRule(draft) {
  if (!String(draft.keyword || '').trim()) throw new Error('کلیدواژه را وارد کنید.');
  if (!draft.categoryId) throw new Error('دسته را انتخاب کنید.');
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeRule(draft));
  return normalizeRule(created);
}

export async function deleteRule(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

export async function createSavedView(draft) {
  if (!String(draft.name || '').trim()) throw new Error('نام نما را وارد کنید.');
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeSavedView({ name: draft.name, filter: draft.filter || draft.filters || {} }));
  return normalizeSavedView(created);
}

export async function deleteSavedView(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

export async function createTemplate(draft) {
  if (!String(draft.title || '').trim()) throw new Error('عنوان قالب را وارد کنید.');
  const amount = Number(draft.amount) || 0;
  const created = await createToolItem(FINANCE_TOOL_NAME, normalizeTemplate({ ...draft, amount }));
  return normalizeTemplate(created);
}

export async function updateTemplate(id, patch) {
  const updated = await updateToolItem(FINANCE_TOOL_NAME, id, patch);
  return normalizeTemplate(updated);
}

export async function deleteTemplate(id) {
  await deleteToolItem(FINANCE_TOOL_NAME, id);
  return true;
}

export async function applyTemplate(id) {
  const tpl = await getFinanceItem(id);
  if (!tpl || tpl.kind !== 'template') throw new Error('قالب یافت نشد.');
  if (!tpl.accountId) throw new Error('این قالب حساب ندارد؛ ویرایشش کن.');
  return createTx({
    type: tpl.type,
    amount: tpl.amount,
    title: tpl.title,
    accountId: tpl.accountId,
    categoryId: tpl.categoryId,
    at: new Date().toISOString(),
    tags: ['قالب'],
  });
}

/* ================================================================== */
/* ایمپورت CSV                                                           */
/* ================================================================== */

export async function importParsedRows(rows, { defaultAccountId = '', defaultCategoryId = '', catByName, accByName }) {
  let count = 0;
  for (const row of (rows || []).slice(0, 1000)) {
    try {
      const categoryId = (row.categoryName && catByName?.get(row.categoryName.trim())) || defaultCategoryId || '';
      const accountId = (row.accountName && accByName?.get(row.accountName.trim())) || defaultAccountId;
      if (!accountId) continue;
      await createTx({ ...row, categoryId, accountId });
      count += 1;
    } catch {
      /* skip */
    }
  }
  return count;
}

/* ================================================================== */
/* بکاپ                                                                  */
/* ================================================================== */

export async function exportFinance() {
  const bundle = await getFinanceBundle();
  return {
    app: 'ViXoRa-finance',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: getFinanceSettings(),
    ...bundle,
  };
}

export async function importFinance(payload) {
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  if (!data || typeof data !== 'object') throw new Error('فایل بکاپ معتبر نیست.');
  const kinds = ['txs', 'accounts', 'categories', 'budgets', 'goals', 'debts', 'recurrings', 'invoices', 'bills', 'rules', 'views', 'templates'];
  const normalizers = {
    txs: normalizeTx, accounts: normalizeAccount, categories: normalizeCategory, budgets: normalizeBudget,
    goals: normalizeGoal, debts: normalizeDebt, recurrings: normalizeRecurring, invoices: normalizeInvoiceDoc,
    bills: normalizeBill, rules: normalizeRule, views: normalizeSavedView, templates: normalizeTemplate,
  };
  const existing = await readAll();
  const existingIds = new Set(existing.map((i) => i.id));
  let count = 0;
  for (const kind of kinds) {
    const list = Array.isArray(data[kind]) ? data[kind] : [];
    for (const raw of list.slice(0, 3000)) {
      try {
        const normalized = normalizers[kind](raw || {});
        if (existingIds.has(normalized.id)) {
          normalized.id = `${normalized.id}-i${Date.now().toString(36)}`;
        }
        existingIds.add(normalized.id);
        await createToolItem(FINANCE_TOOL_NAME, normalized);
        count += 1;
      } catch {
        /* skip */
      }
    }
  }
  if (data.settings && typeof data.settings === 'object') {
    saveFinanceSettings(data.settings);
  }
  return count;
}

export async function wipeFinanceData() {
  const items = await readAll();
  let count = 0;
  for (const item of items) {
    try {
      await deleteToolItem(FINANCE_TOOL_NAME, item.id);
      count += 1;
    } catch {
      /* ignore */
    }
  }
  return count;
}

/* ================================================================== */
/* داده نمایشی (برای آشنایی و تست)                                        */
/* ================================================================== */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function generateDemoData() {
  await ensureFinanceDefaults();
  const bundle = await getFinanceBundle();
  const rand = mulberry32(14030404);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  const catByName = new Map(bundle.categories.map((c) => [c.name, c.id]));
  const accIds = bundle.accounts.map((a) => a.id);
  if (!accIds.length) throw new Error('حسابی وجود ندارد.');

  const expenses = [
    ['ناهار رستوران', 'خوراک و رستوران', 180000, 450000],
    ['خرید سوپرمارکت', 'خوراک و رستوران', 200000, 900000],
    ['اسنپ رفت', 'حمل‌ونقل', 80000, 220000],
    ['بنزین', 'حمل‌ونقل', 300000, 600000],
    ['قبض برق', 'قبوض و شارژ', 150000, 500000],
    ['شارژ اینترنت', 'قبوض و شارژ', 200000, 400000],
    ['خرید کتاب', 'آموزش', 150000, 600000],
    ['سینما', 'تفریح و سفر', 200000, 400000],
    ['کافه با دوستان', 'تفریح و سفر', 150000, 500000],
    ['داروخانه', 'سلامتی و درمان', 100000, 800000],
    ['باشگاه ورزشی', 'سلامتی و درمان', 800000, 800000],
    ['لباس', 'پوشاک', 500000, 2000000],
    ['هدیه تولد', 'هدیه و خیریه', 300000, 1000000],
  ];

  const now = new Date();
  let txCount = 0;
  for (let d = 89; d >= 0; d -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    // حقوق اول هر ماه شمسی (تقریبی: روز اول میلادی)
    if (day.getDate() === 1) {
      await createTx({
        type: 'income', amount: 25000000, title: 'حقوق ماهانه',
        accountId: accIds[1] || accIds[0], categoryId: catByName.get('حقوق') || '',
        at: day.toISOString(), tags: ['حقوق'],
      });
      txCount += 1;
    }
    const n = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k += 1) {
      const [title, cat, min, max] = pick(expenses);
      const at = new Date(day);
      at.setHours(8 + Math.floor(rand() * 13), Math.floor(rand() * 60));
      try {
        await createTx({
          type: 'expense',
          amount: Math.round((min + rand() * (max - min)) / 10000) * 10000,
          title,
          accountId: pick(accIds),
          categoryId: catByName.get(cat) || '',
          at: at.toISOString(),
          tags: rand() > 0.7 ? ['ضروری'] : [],
        });
        txCount += 1;
      } catch {
        /* ignore */
      }
    }
  }

  // بودجه‌ها
  try {
    await createBudget({ categoryId: catByName.get('خوراک و رستوران') || 'all', amount: 6000000, rollover: true });
    await createBudget({ categoryId: catByName.get('حمل‌ونقل') || 'all', amount: 2500000 });
    await createBudget({ categoryId: 'all', amount: 20000000 });
  } catch {
    /* ignore */
  }

  // هدف
  try {
    const goal = await createGoal({ title: 'سفر شمال 🏖️', icon: '🏖️', target: 15000000, deadline: new Date(now.getTime() + 90 * 86400000).toISOString() });
    await contributeGoal(goal.id, { amount: 4500000, note: 'شروع' });
  } catch {
    /* ignore */
  }

  // بدهی و قبض و تکرارشونده و فاکتور
  try {
    await createDebt({ debtType: 'owe', person: 'علی', title: 'قرض', total: 2000000, dueDate: new Date(now.getTime() + 10 * 86400000).toISOString() });
    await createBill({ title: 'اجاره خانه', icon: '🏠', expected: 8000000, dueDay: 5, categoryId: catByName.get('مسکن و اجاره') || '', accountId: accIds[0] });
    await createRecurring({ title: 'اشتراک باشگاه', type: 'expense', amount: 800000, categoryId: catByName.get('سلامتی و درمان') || '', accountId: accIds[0], frequency: 'monthly', nextRun: new Date(now.getTime() + 20 * 86400000).toISOString() });
    await createInvoiceDoc({
      customer: 'شرکت نمونه', items: [{ desc: 'طراحی سایت', qty: 1, price: 12000000 }, { desc: 'پشتیبانی', qty: 3, price: 1500000 }],
      taxPercent: 9, status: 'sent', accountId: accIds[0],
    });
    await createRule({ keyword: 'اسنپ', categoryId: catByName.get('حمل‌ونقل') || '' });
    await createTemplate({ title: 'ناهار', icon: '🍔', type: 'expense', amount: 250000, categoryId: catByName.get('خوراک و رستوران') || '', accountId: accIds[0] });
  } catch {
    /* ignore */
  }

  return { txs: txCount };
}
