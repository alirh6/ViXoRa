// src/core/schemas/finance-schema.js

/**
 * ViXoRa — اسکیمای سوپراپ مالی (صورت‌حساب‌ها)
 * ==================================================================
 * بدون DOM، بدون وابستگی. مدل‌ها + تقویم شمسی + محاسبات مالی خالص.
 * ذخیره: tools-service با toolName = 'invoices' (آیتم‌های kind دار)
 * تنظیمات نمایشی: LocalStorage (سرویس finance-service)
 */

export const FINANCE_TOOL_NAME = 'invoices';

export const TX_TYPES = ['expense', 'income', 'transfer'];
export const TX_TYPE_LABELS = { expense: 'خرج', income: 'درآمد', transfer: 'انتقال' };

export const ACCOUNT_TYPES = ['cash', 'bank', 'card', 'digital', 'other'];
export const ACCOUNT_TYPE_LABELS = {
  cash: 'نقدی',
  bank: 'بانکی',
  card: 'کارت',
  digital: 'دیجیتال/کیف پول',
  other: 'سایر',
};

export const DEBT_TYPES = ['owe', 'owed', 'loan'];
export const DEBT_TYPE_LABELS = { owe: 'بدهی (من بدهکارم)', owed: 'طلب (از دیگران)', loan: 'وام (قسطی)' };

export const INVOICE_STATUS = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
export const INVOICE_STATUS_LABELS = {
  draft: 'پیش‌نویس',
  sent: 'ارسال‌شده',
  paid: 'پرداخت‌شده',
  overdue: 'سررسید گذشته',
  cancelled: 'لغوشده',
};

export const RECUR_FREQ = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
export const RECUR_FREQ_LABELS = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  yearly: 'سالانه',
  custom: 'هر X روز',
};

export const FINANCE_THEMES = ['emerald', 'royal', 'sunset', 'ocean'];
export const FINANCE_THEME_LABELS = { emerald: 'زمردی', royal: 'سلطنتی', sunset: 'غروب', ocean: 'اقیانوس' };

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
export const JALALI_MONTHS_SHORT = [
  'فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف',
];
export const FA_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

export const DEFAULT_QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export const DEFAULT_WIDGETS = [
  { id: 'balance', title: '💰 موجودی کل', visible: true },
  { id: 'month', title: '📅 عملکرد این دوره', visible: true },
  { id: 'cashflow', title: '📊 نمودار دخل‌وخرج', visible: true },
  { id: 'donut', title: '🍩 تفکیک خرج‌ها', visible: true },
  { id: 'budgets', title: '📌 بودجه‌ها', visible: true },
  { id: 'goals', title: '🎯 اهداف', visible: true },
  { id: 'upcoming', title: '⏰ سررسیدها', visible: true },
  { id: 'recent', title: '🧾 آخرین تراکنش‌ها', visible: true },
  { id: 'insights', title: '💡 بینش هوشمند', visible: true },
];

export const DEFAULT_CATEGORIES = [
  { name: 'خوراک و رستوران', icon: '🍔', color: '#f59e0b', type: 'expense' },
  { name: 'حمل‌ونقل', icon: '🚕', color: '#38bdf8', type: 'expense' },
  { name: 'قبوض و شارژ', icon: '💡', color: '#facc15', type: 'expense' },
  { name: 'مسکن و اجاره', icon: '🏠', color: '#a78bfa', type: 'expense' },
  { name: 'پوشاک', icon: '👕', color: '#f472b6', type: 'expense' },
  { name: 'سلامتی و درمان', icon: '💊', color: '#34d399', type: 'expense' },
  { name: 'آموزش', icon: '📚', color: '#60a5fa', type: 'expense' },
  { name: 'تفریح و سفر', icon: '🎮', color: '#fb7185', type: 'expense' },
  { name: 'خانواده', icon: '👨‍👩‍👧', color: '#fbbf24', type: 'expense' },
  { name: 'هدیه و خیریه', icon: '🎁', color: '#e879f9', type: 'expense' },
  { name: 'پس‌انداز', icon: '🏦', color: '#2dd4bf', type: 'expense' },
  { name: 'سرمایه‌گذاری', icon: '📈', color: '#4ade80', type: 'expense' },
  { name: 'سایر خرج‌ها', icon: '🧾', color: '#94a3b8', type: 'expense' },
  { name: 'حقوق', icon: '💼', color: '#22c55e', type: 'income' },
  { name: 'کسب‌وکار', icon: '🏪', color: '#10b981', type: 'income' },
  { name: 'سود سرمایه', icon: '💹', color: '#84cc16', type: 'income' },
  { name: 'هدیه دریافتی', icon: '💝', color: '#f0abfc', type: 'income' },
  { name: 'سایر درآمدها', icon: '💰', color: '#a3e635', type: 'income' },
];

export const DEFAULT_ACCOUNTS = [
  { name: 'کیف نقدی', accType: 'cash', icon: '👛', color: '#f59e0b', initial: 0 },
  { name: 'حساب بانکی', accType: 'bank', icon: '🏦', color: '#38bdf8', initial: 0 },
  { name: 'کارت روزمره', accType: 'card', icon: '💳', color: '#a78bfa', initial: 0 },
];

/* ================================================================== */
/* ابزار پایه                                                           */
/* ================================================================== */

export function createId(prefix = 'fx') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function faDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export function latinDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

/** پارس مبلغ ورودی کاربر (حذف جداکننده‌ها و ارقام فارسی) */
export function parseAmountInput(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const clean = latinDigits(String(value ?? ''))
    .replace(/[,٬\s]/g, '')
    .replace(/[^0-9.\-]/g, '');
  if (!clean || clean === '-' || clean === '.') return NaN;
  const num = Number(clean);
  return Number.isFinite(num) ? num : NaN;
}

export function formatMoney(amount, settings = {}) {
  const num = Number(amount) || 0;
  const decimals = Math.max(0, Math.min(2, Number(settings.decimals) || 0));
  const abs = Math.abs(num);
  let str = abs.toFixed(decimals);
  const [intPart, decPart] = str.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  str = decimals > 0 ? `${grouped}.${decPart}` : grouped;
  if (settings.faDigits !== false) str = faDigits(str);
  const symbol = settings.currencySymbol || 'تومان';
  const signed = num < 0 ? `-${str}` : str;
  return settings.symbolPosition === 'before' ? `${symbol} ${signed}` : `${signed} ${symbol}`;
}

function nzStr(value, fallback = '') {
  const s = String(value ?? '').trim();
  return s || fallback;
}
function finNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function isoOrNow(value) {
  const t = Date.parse(value || '');
  return Number.isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
}

/* ================================================================== */
/* تقویم شمسی (با Intl — دقیق و بدون فرمول دستی)                           */
/* ================================================================== */

let persianFmt = null;
let faLongFmt = null;
let faShortFmt = null;
try {
  persianFmt = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' });
  faLongFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  faShortFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' });
} catch {
  persianFmt = null;
}

/** اجزای شمسی یک تاریخ → { jy, jm, jd } */
export function jalaliParts(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  if (!persianFmt) return { jy: d.getFullYear(), jm: d.getMonth() + 1, jd: d.getDate(), approx: true };
  try {
    const parts = persianFmt.formatToParts(d);
    const get = (t) => Number((parts.find((p) => p.type === t) || {}).value);
    return { jy: get('year'), jm: get('month'), jd: get('day') };
  } catch {
    return { jy: d.getFullYear(), jm: d.getMonth() + 1, jd: d.getDate(), approx: true };
  }
}

export function formatJalali(input, { weekday = false } = {}) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    if (weekday && faLongFmt) return faLongFmt.format(d);
    if (faShortFmt) return faShortFmt.format(d);
  } catch {
    /* ignore */
  }
  const p = jalaliParts(d);
  return `${p.jd} ${JALALI_MONTHS[p.jm - 1] || ''} ${p.jy}`;
}

export function jalaliKey(input) {
  const p = jalaliParts(input);
  if (!p) return '';
  return `${p.jy}/${String(p.jm).padStart(2, '0')}`;
}

export function jalaliMonthLabel(jy, jm) {
  return `${JALALI_MONTHS[(jm - 1 + 12) % 12] || ''} ${faDigits(jy)}`;
}

function shiftMonth(jy, jm, delta) {
  const total = (jy * 12 + (jm - 1)) + delta;
  return { jy: Math.floor(total / 12), jm: (total % 12) + 1 };
}

/** پیدا کردن تاریخ میلادی معادل یک روز شمسی (جست‌وجوی حداکثر ۶۲ روزه از حدس) */
export function findGregorian(jy, jm, jd, hint = new Date()) {
  let cursor = new Date(hint instanceof Date ? hint : new Date(hint));
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < 65; i += 1) {
    const p = jalaliParts(cursor);
    if (p && p.jy === jy && p.jm === jm && p.jd === jd) return cursor;
    // جهت حرکت: مقایسه تقریبی
    const cur = p ? p.jy * 372 + p.jm * 31 + p.jd : 0;
    const want = jy * 372 + jm * 31 + jd;
    cursor.setDate(cursor.getDate() + (want > cur ? 1 : -1));
  }
  return null;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * پنجره دوره مالی جاری با شروع دلخواه ماه (۱ = اول ماه شمسی)
 * → { start, end, prevStart, prevEnd, label, key }
 */
export function financeWindow(fiscalStart = 1, ref = new Date()) {
  const fs = Math.min(29, Math.max(1, Math.floor(Number(fiscalStart) || 1)));
  const p = jalaliParts(ref) || { jy: 1400, jm: 1, jd: 1 };
  let startJ, endJ;
  if (p.jd >= fs) {
    startJ = { jy: p.jy, jm: p.jm, jd: fs };
    const nm = shiftMonth(p.jy, p.jm, 1);
    endJ = { jy: nm.jy, jm: nm.jm, jd: fs };
  } else {
    const pm = shiftMonth(p.jy, p.jm, -1);
    startJ = { jy: pm.jy, jm: pm.jm, jd: fs };
    endJ = { jy: p.jy, jm: p.jm, jd: fs };
  }
  const startG = findGregorian(startJ.jy, startJ.jm, startJ.jd, ref) || new Date(ref);
  const nextStartG = findGregorian(endJ.jy, endJ.jm, endJ.jd, ref) || new Date(ref);
  const start = startOfDay(startG);
  const end = new Date(nextStartG);
  end.setDate(end.getDate() - 1);
  const endD = endOfDay(end);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const approxLen = Math.round((endD - start) / 86400000) || 30;
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - approxLen);

  let label;
  if (fs === 1) {
    const sp = jalaliParts(start);
    label = jalaliMonthLabel(sp.jy, sp.jm);
  } else {
    const sp = jalaliParts(start);
    const ep = jalaliParts(endD);
    label = `${faDigits(sp.jd)} ${JALALI_MONTHS[sp.jm - 1]} تا ${faDigits(ep.jd)} ${JALALI_MONTHS[ep.jm - 1]}`;
  }
  const kp = jalaliParts(start);
  return { start, end: endD, prevStart: startOfDay(prevEnd), prevEnd: endOfDay(prevEnd), label, key: `${kp.jy}/${kp.jm}` };
}

export function isInRange(iso, start, end) {
  const t = Date.parse(iso || '');
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t <= end.getTime();
}

/* ================================================================== */
/* نرمال‌سازی مدل‌ها                                                    */
/* ================================================================== */

export function normalizeTx(raw = {}) {
  const now = new Date().toISOString();
  const type = TX_TYPES.includes(raw.type) ? raw.type : 'expense';
  return {
    id: nzStr(raw.id, createId('tx')),
    kind: 'tx',
    type,
    amount: Math.max(0, finNum(raw.amount, 0)),
    at: isoOrNow(raw.at || now),
    title: nzStr(raw.title, type === 'transfer' ? 'انتقال' : 'بدون عنوان'),
    note: nzStr(raw.note, '').slice(0, 500),
    categoryId: nzStr(raw.categoryId, ''),
    accountId: nzStr(raw.accountId, ''),
    toAccountId: type === 'transfer' ? nzStr(raw.toAccountId, '') : '',
    tags: Array.isArray(raw.tags) ? [...new Set(raw.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10) : [],
    recurringId: nzStr(raw.recurringId, ''),
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateTxDraft(d = {}) {
  const amount = parseAmountInput(d.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { valid: false, message: 'مبلغ معتبر وارد کنید (بزرگ‌تر از صفر).' };
  if (amount > 1e15) return { valid: false, message: 'مبلغ خیلی بزرگ است.' };
  if (!String(d.title || '').trim() && d.type !== 'transfer') return { valid: false, message: 'عنوان تراکنش را وارد کنید.' };
  if (!d.accountId) return { valid: false, message: 'حساب را انتخاب کنید.' };
  if (d.type === 'transfer' && !d.toAccountId) return { valid: false, message: 'حساب مقصد را انتخاب کنید.' };
  if (d.type === 'transfer' && d.accountId === d.toAccountId) return { valid: false, message: 'حساب مبدأ و مقصد یکی است.' };
  if (!d.at || Number.isNaN(Date.parse(d.at))) return { valid: false, message: 'تاریخ معتبر نیست.' };
  return { valid: true, amount };
}

export function normalizeAccount(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('acc')),
    kind: 'account',
    name: nzStr(raw.name, 'حساب بدون نام'),
    accType: ACCOUNT_TYPES.includes(raw.accType) ? raw.accType : 'other',
    icon: nzStr(raw.icon, '💰'),
    color: /^#[0-9a-f]{6}$/i.test(String(raw.color || '')) ? raw.color : '#38bdf8',
    initial: finNum(raw.initial, 0),
    includeInTotal: raw.includeInTotal !== false,
    note: nzStr(raw.note, '').slice(0, 300),
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateAccountDraft(d = {}) {
  if (!String(d.name || '').trim()) return { valid: false, message: 'نام حساب را وارد کنید.' };
  return { valid: true };
}

export function normalizeCategory(raw = {}) {
  const now = new Date().toISOString();
  const type = ['expense', 'income', 'both'].includes(raw.type) ? raw.type : 'expense';
  return {
    id: nzStr(raw.id, createId('cat')),
    kind: 'category',
    name: nzStr(raw.name, 'دسته بدون نام'),
    icon: nzStr(raw.icon, '📦'),
    color: /^#[0-9a-f]{6}$/i.test(String(raw.color || '')) ? raw.color : '#94a3b8',
    type,
    isDefault: raw.isDefault === true,
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateCategoryDraft(d = {}) {
  if (!String(d.name || '').trim()) return { valid: false, message: 'نام دسته را وارد کنید.' };
  return { valid: true };
}

export function normalizeBudget(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('bud')),
    kind: 'budget',
    categoryId: nzStr(raw.categoryId, 'all'), // 'all' = کل خرج‌ها
    amount: Math.max(0, finNum(raw.amount, 0)),
    rollover: raw.rollover === true,
    active: raw.active !== false,
    note: nzStr(raw.note, '').slice(0, 200),
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateBudgetDraft(d = {}) {
  const amount = parseAmountInput(d.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { valid: false, message: 'مبلغ بودجه را وارد کنید.' };
  return { valid: true, amount };
}

export function normalizeGoal(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('goal')),
    kind: 'goal',
    title: nzStr(raw.title, 'هدف بدون نام'),
    icon: nzStr(raw.icon, '🎯'),
    color: /^#[0-9a-f]{6}$/i.test(String(raw.color || '')) ? raw.color : '#22c55e',
    target: Math.max(0, finNum(raw.target, 0)),
    saved: Math.max(0, finNum(raw.saved, 0)),
    deadline: raw.deadline && !Number.isNaN(Date.parse(raw.deadline)) ? new Date(raw.deadline).toISOString() : '',
    note: nzStr(raw.note, '').slice(0, 300),
    contributions: Array.isArray(raw.contributions) ? raw.contributions.slice(-100) : [],
    done: raw.done === true,
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateGoalDraft(d = {}) {
  if (!String(d.title || '').trim()) return { valid: false, message: 'نام هدف را وارد کنید.' };
  const target = parseAmountInput(d.target);
  if (!Number.isFinite(target) || target <= 0) return { valid: false, message: 'مبلغ هدف را وارد کنید.' };
  return { valid: true, target };
}

export function normalizeDebt(raw = {}) {
  const now = new Date().toISOString();
  const debtType = DEBT_TYPES.includes(raw.debtType) ? raw.debtType : 'owe';
  return {
    id: nzStr(raw.id, createId('debt')),
    kind: 'debt',
    debtType,
    person: nzStr(raw.person, debtType === 'loan' ? 'وام' : 'شخص'),
    title: nzStr(raw.title, ''),
    total: Math.max(0, finNum(raw.total, 0)),
    dueDate: raw.dueDate && !Number.isNaN(Date.parse(raw.dueDate)) ? new Date(raw.dueDate).toISOString() : '',
    months: debtType === 'loan' ? Math.max(1, Math.floor(finNum(raw.months, 12))) : 0,
    monthlyAmount: debtType === 'loan' ? Math.max(0, finNum(raw.monthlyAmount, 0)) : 0,
    startDate: raw.startDate && !Number.isNaN(Date.parse(raw.startDate)) ? new Date(raw.startDate).toISOString() : '',
    note: nzStr(raw.note, '').slice(0, 300),
    payments: Array.isArray(raw.payments) ? raw.payments.slice(-200) : [],
    settled: raw.settled === true,
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateDebtDraft(d = {}) {
  if (!String(d.person || '').trim()) return { valid: false, message: 'نام شخص/وام را وارد کنید.' };
  const total = parseAmountInput(d.total);
  if (!Number.isFinite(total) || total <= 0) return { valid: false, message: 'مبلغ را وارد کنید.' };
  return { valid: true, total };
}

export function debtPaid(debt) {
  return (debt?.payments || []).reduce((a, p) => a + Math.max(0, finNum(p.amount, 0)), 0);
}
export function debtRemaining(debt) {
  return Math.max(0, finNum(debt?.total, 0) - debtPaid(debt));
}

export function normalizeRecurring(raw = {}) {
  const now = new Date().toISOString();
  const freq = RECUR_FREQ.includes(raw.frequency) ? raw.frequency : 'monthly';
  return {
    id: nzStr(raw.id, createId('rec')),
    kind: 'recurring',
    title: nzStr(raw.title, 'تراکنش دوره‌ای'),
    type: raw.type === 'income' ? 'income' : 'expense',
    amount: Math.max(0, finNum(raw.amount, 0)),
    categoryId: nzStr(raw.categoryId, ''),
    accountId: nzStr(raw.accountId, ''),
    frequency: freq,
    customDays: freq === 'custom' ? Math.min(365, Math.max(1, Math.floor(finNum(raw.customDays, 30)))) : 0,
    nextRun: isoOrNow(raw.nextRun || now),
    lastRun: raw.lastRun || '',
    active: raw.active !== false,
    note: nzStr(raw.note, '').slice(0, 200),
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateRecurringDraft(d = {}) {
  if (!String(d.title || '').trim()) return { valid: false, message: 'عنوان را وارد کنید.' };
  const amount = parseAmountInput(d.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { valid: false, message: 'مبلغ را وارد کنید.' };
  if (!d.accountId) return { valid: false, message: 'حساب را انتخاب کنید.' };
  return { valid: true, amount };
}

export function advanceRecurringDate(iso, frequency, customDays = 30) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  const next = new Date(d);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') {
    const day = next.getDate();
    next.setMonth(next.getMonth() + 1);
    if (next.getDate() < day) next.setDate(0); // آخر ماه قبل اگر روز وجود نداشت
  } else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else next.setDate(next.getDate() + Math.max(1, customDays || 30));
  return next.toISOString();
}

export function describeRecurring(rec) {
  const f = RECUR_FREQ_LABELS[rec.frequency] || '';
  const extra = rec.frequency === 'custom' ? ` (${faDigits(rec.customDays)} روز)` : '';
  return `${f}${extra} • ${TX_TYPE_LABELS[rec.type] || ''}`;
}

export function normalizeInvoiceItem(raw = {}) {
  return {
    desc: nzStr(raw.desc, 'قلم'),
    qty: Math.max(0, finNum(raw.qty, 1)),
    price: Math.max(0, finNum(raw.price, 0)),
  };
}

export function normalizeInvoiceDoc(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('inv')),
    kind: 'invoice',
    number: nzStr(raw.number, ''),
    customer: nzStr(raw.customer, 'مشتری'),
    date: isoOrNow(raw.date || now),
    dueDate: raw.dueDate && !Number.isNaN(Date.parse(raw.dueDate)) ? new Date(raw.dueDate).toISOString() : '',
    items: Array.isArray(raw.items) ? raw.items.slice(0, 100).map(normalizeInvoiceItem) : [],
    taxPercent: Math.min(100, Math.max(0, finNum(raw.taxPercent, 0))),
    discount: Math.max(0, finNum(raw.discount, 0)),
    status: INVOICE_STATUS.includes(raw.status) ? raw.status : 'draft',
    accountId: nzStr(raw.accountId, ''),
    note: nzStr(raw.note, '').slice(0, 500),
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function invoiceTotals(doc) {
  const subtotal = (doc?.items || []).reduce((a, it) => a + finNum(it.qty, 0) * finNum(it.price, 0), 0);
  const discount = Math.min(subtotal, Math.max(0, finNum(doc?.discount, 0)));
  const tax = ((subtotal - discount) * Math.max(0, finNum(doc?.taxPercent, 0))) / 100;
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

/** وضعیت نمایشی (سررسید گذشته خودکار) */
export function invoiceDisplayStatus(doc) {
  if (!doc) return 'draft';
  if (doc.status === 'paid' || doc.status === 'cancelled') return doc.status;
  if (doc.dueDate && Date.parse(doc.dueDate) < Date.now()) return 'overdue';
  return doc.status || 'draft';
}

export function validateInvoiceDraft(d = {}) {
  if (!String(d.customer || '').trim()) return { valid: false, message: 'نام مشتری را وارد کنید.' };
  if (!Array.isArray(d.items) || !d.items.length) return { valid: false, message: 'حداقل یک قلم اضافه کنید.' };
  return { valid: true };
}

export function normalizeBill(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('bill')),
    kind: 'bill',
    title: nzStr(raw.title, 'قبض'),
    icon: nzStr(raw.icon, '🧾'),
    expected: Math.max(0, finNum(raw.expected, 0)),
    dueDay: Math.min(29, Math.max(1, Math.floor(finNum(raw.dueDay, 1)))),
    categoryId: nzStr(raw.categoryId, ''),
    accountId: nzStr(raw.accountId, ''),
    active: raw.active !== false,
    lastPaidAt: raw.lastPaidAt || '',
    note: nzStr(raw.note, '').slice(0, 200),
    createdAt: nzStr(raw.createdAt, now),
    updatedAt: nzStr(raw.updatedAt, now),
  };
}

export function validateBillDraft(d = {}) {
  if (!String(d.title || '').trim()) return { valid: false, message: 'عنوان قبض را وارد کنید.' };
  return { valid: true };
}

/** وضعیت قبض در ماه جاری شمسی: paid | overdue | upcoming | today */
export function billStatus(bill, ref = new Date()) {
  if (!bill || bill.active === false) return 'off';
  const p = jalaliParts(ref);
  if (!p) return 'upcoming';
  if (bill.lastPaidAt) {
    const lp = jalaliParts(bill.lastPaidAt);
    if (lp && lp.jy === p.jy && lp.jm === p.jm) return 'paid';
  }
  if (p.jd > bill.dueDay) return 'overdue';
  if (p.jd === bill.dueDay) return 'today';
  return 'upcoming';
}

export function normalizeRule(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('rule')),
    kind: 'rule',
    keyword: nzStr(raw.keyword, '').slice(0, 60),
    categoryId: nzStr(raw.categoryId, ''),
    createdAt: nzStr(raw.createdAt, now),
  };
}

export function normalizeSavedView(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('view')),
    kind: 'view',
    name: nzStr(raw.name, 'نمای ذخیره‌شده'),
    filter: raw.filter && typeof raw.filter === 'object' ? raw.filter : {},
    createdAt: nzStr(raw.createdAt, now),
  };
}

export function normalizeTemplate(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: nzStr(raw.id, createId('tpl')),
    kind: 'template',
    title: nzStr(raw.title, 'قالب'),
    icon: nzStr(raw.icon, '⚡'),
    type: raw.type === 'income' ? 'income' : 'expense',
    amount: Math.max(0, finNum(raw.amount, 0)),
    categoryId: nzStr(raw.categoryId, ''),
    accountId: nzStr(raw.accountId, ''),
    createdAt: nzStr(raw.createdAt, now),
  };
}

/* ================================================================== */
/* موجودی و جمع‌بندی                                                     */
/* ================================================================== */

/** موجودی هر حساب = اولیه + درآمدها − خرج‌ها ± انتقال‌ها */
export function computeBalances(txs, accounts) {
  const map = new Map();
  for (const acc of accounts || []) {
    map.set(acc.id, { account: acc, balance: finNum(acc.initial, 0), income: 0, expense: 0 });
  }
  for (const tx of txs || []) {
    if (tx.type === 'income') {
      const row = map.get(tx.accountId);
      if (row) {
        row.balance += tx.amount;
        row.income += tx.amount;
      }
    } else if (tx.type === 'expense') {
      const row = map.get(tx.accountId);
      if (row) {
        row.balance -= tx.amount;
        row.expense += tx.amount;
      }
    } else if (tx.type === 'transfer') {
      const from = map.get(tx.accountId);
      const to = map.get(tx.toAccountId);
      if (from) from.balance -= tx.amount;
      if (to) to.balance += tx.amount;
    }
  }
  return map;
}

export function totalBalance(balances) {
  let sum = 0;
  for (const row of balances?.values?.() || []) {
    if (row.account?.includeInTotal !== false) sum += row.balance;
  }
  return sum;
}

export function summarizeWindow(txs, start, end) {
  let income = 0;
  let expense = 0;
  let transfers = 0;
  for (const tx of txs || []) {
    if (!isInRange(tx.at, start, end)) continue;
    if (tx.type === 'income') income += tx.amount;
    else if (tx.type === 'expense') expense += tx.amount;
    else transfers += tx.amount;
  }
  return { income, expense, net: income - expense, transfers };
}

/** خالص دارایی = موجودی حساب‌ها + طلب‌ها + پس‌انداز اهداف − بدهی‌ها و وام‌ها */
export function netWorth(txs, accounts, debts, goals) {
  const balances = computeBalances(txs, accounts);
  let worth = totalBalance(balances);
  for (const g of goals || []) {
    if (!g.done) worth += Math.max(0, finNum(g.saved, 0));
  }
  for (const d of debts || []) {
    if (d.settled) continue;
    const rem = debtRemaining(d);
    if (d.debtType === 'owed') worth += rem;
    else worth -= rem;
  }
  return worth;
}

/* ================================================================== */
/* فیلتر و گروه‌بندی تراکنش‌ها                                            */
/* ================================================================== */

export function filterTxs(txs, f = {}) {
  const q = String(f.query || '').trim().toLowerCase();
  const words = q ? q.split(/\s+/) : [];
  const min = f.minAmount ? Number(f.minAmount) : 0;
  const max = f.maxAmount ? Number(f.maxAmount) : Infinity;
  return (txs || []).filter((tx) => {
    if (f.type && f.type !== 'all' && tx.type !== f.type) return false;
    if (f.accountId && f.accountId !== 'all' && tx.accountId !== f.accountId && tx.toAccountId !== f.accountId) return false;
    if (f.categoryId && f.categoryId !== 'all') {
      if (f.categoryId === 'none') {
        if (tx.categoryId) return false;
      } else if (tx.categoryId !== f.categoryId) return false;
    }
    if (f.tag && tx.tags?.includes(f.tag) !== true) return false;
    if (tx.amount < min || tx.amount > max) return false;
    if (f.from && Date.parse(tx.at) < Date.parse(f.from)) return false;
    if (f.to) {
      const end = new Date(f.to);
      end.setHours(23, 59, 59, 999);
      if (Date.parse(tx.at) > end.getTime()) return false;
    }
    if (words.length) {
      const hay = `${tx.title} ${tx.note} ${(tx.tags || []).join(' ')}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

export function sortTxs(txs, sort = 'newest') {
  const list = [...(txs || [])];
  if (sort === 'oldest') return list.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  if (sort === 'highest') return list.sort((a, b) => b.amount - a.amount);
  if (sort === 'lowest') return list.sort((a, b) => a.amount - b.amount);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

/** گروه‌بندی روزانه (کلید: YYYY-MM-DD میلادی) با جمع روزانه */
export function groupTxsByDay(txs) {
  const groups = new Map();
  for (const tx of sortTxs(txs, 'newest')) {
    const d = new Date(tx.at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, { key, date: d.toISOString(), items: [], income: 0, expense: 0 });
    const g = groups.get(key);
    g.items.push(tx);
    if (tx.type === 'income') g.income += tx.amount;
    else if (tx.type === 'expense') g.expense += tx.amount;
  }
  return [...groups.values()];
}

/* ================================================================== */
/* گزارش‌ها                                                             */
/* ================================================================== */

/** جریان نقدی N ماه شمسی اخیر (انتقال‌ها حساب نمی‌شوند) */
export function monthlyCashflow(txs, count = 6, ref = new Date()) {
  const p = jalaliParts(ref) || { jy: 1400, jm: 1 };
  const buckets = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const m = shiftMonth(p.jy, p.jm, -i);
    buckets.push({ key: `${m.jy}/${m.jm}`, jy: m.jy, jm: m.jm, label: JALALI_MONTHS_SHORT[m.jm - 1], income: 0, expense: 0 });
  }
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const tx of txs || []) {
    const tp = jalaliParts(tx.at);
    if (!tp) continue;
    const b = map.get(`${tp.jy}/${tp.jm}`);
    if (!b) continue;
    if (tx.type === 'income') b.income += tx.amount;
    else if (tx.type === 'expense') b.expense += tx.amount;
  }
  return buckets;
}

/** تاریخچه خالص دارایی (تقریبی، پایان هر ماه شمسی) */
export function netWorthHistory(txs, accounts, count = 6, ref = new Date()) {
  const flow = monthlyCashflow(txs, count, ref);
  let base = 0;
  for (const acc of accounts || []) {
    if (acc.includeInTotal !== false) base += finNum(acc.initial, 0);
  }
  // تراکنش‌های قبل از بازه
  const firstKey = flow[0]?.key;
  if (firstKey) {
    const [fy, fm] = firstKey.split('/').map(Number);
    for (const tx of txs || []) {
      const tp = jalaliParts(tx.at);
      if (!tp) continue;
      if (tp.jy * 12 + tp.jm < fy * 12 + fm) {
        if (tx.type === 'income') base += tx.amount;
        else if (tx.type === 'expense') base -= tx.amount;
      }
    }
  }
  let running = base;
  return flow.map((b) => {
    running += b.income - b.expense;
    return { ...b, worth: running };
  });
}

export function sumByCategory(txs, type = 'expense', start = null, end = null) {
  const map = new Map();
  for (const tx of txs || []) {
    if (tx.type !== type) continue;
    if (start && end && !isInRange(tx.at, start, end)) continue;
    const key = tx.categoryId || 'none';
    map.set(key, (map.get(key) || 0) + tx.amount);
  }
  return [...map.entries()].map(([categoryId, total]) => ({ categoryId, total })).sort((a, b) => b.total - a.total);
}

export function topTitles(txs, type = 'expense', limit = 8, start = null, end = null) {
  const map = new Map();
  for (const tx of txs || []) {
    if (tx.type !== type) continue;
    if (start && end && !isInRange(tx.at, start, end)) continue;
    const key = tx.title || 'بدون عنوان';
    const row = map.get(key) || { title: key, total: 0, count: 0 };
    row.total += tx.amount;
    row.count += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

/** سلول‌های تقویم ماه شمسی (۴۲ خانه، هفته از شنبه) */
export function buildCalendar(txs, jy, jm) {
  const first = findGregorian(jy, jm, 1, new Date()) || new Date();
  const startDow = (first.getDay() + 1) % 7; // شنبه=۰
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - startDow);
  const dayMap = new Map();
  for (const tx of txs || []) {
    const d = new Date(tx.at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const row = dayMap.get(key) || { income: 0, expense: 0, count: 0 };
    if (tx.type === 'income') row.income += tx.amount;
    else if (tx.type === 'expense') row.expense += tx.amount;
    row.count += 1;
    dayMap.set(key, row);
  }
  const cells = [];
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const p = jalaliParts(d);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const sums = dayMap.get(key) || { income: 0, expense: 0, count: 0 };
    cells.push({
      date: d.toISOString(),
      jd: p?.jd || 0,
      inMonth: p && p.jy === jy && p.jm === jm,
      isToday: key === todayKey,
      ...sums,
    });
  }
  return cells;
}

/* ================================================================== */
/* بودجه، هدف، سررسید                                                    */
/* ================================================================== */

export function budgetSpent(budget, txs, start, end) {
  let spent = 0;
  for (const tx of txs || []) {
    if (tx.type !== 'expense') continue;
    if (!isInRange(tx.at, start, end)) continue;
    if (budget.categoryId !== 'all' && tx.categoryId !== budget.categoryId) continue;
    spent += tx.amount;
  }
  return spent;
}

export function budgetProgress(budget, txs, window) {
  const spent = budgetSpent(budget, txs, window.start, window.end);
  let available = budget.amount;
  let carried = 0;
  if (budget.rollover) {
    const prevSpent = budgetSpent(budget, txs, window.prevStart, window.prevEnd);
    carried = Math.max(0, budget.amount - prevSpent);
    available = budget.amount + carried;
  }
  const pct = available > 0 ? Math.min(999, Math.round((spent / available) * 100)) : 0;
  return { spent, available, carried, remaining: available - spent, pct };
}

export function goalProjection(goal) {
  const remaining = Math.max(0, goal.target - goal.saved);
  if (remaining <= 0) return { remaining: 0, monthsLeft: 0, monthlyNeeded: 0 };
  if (!goal.deadline) return { remaining, monthsLeft: 0, monthlyNeeded: 0 };
  const ms = Date.parse(goal.deadline) - Date.now();
  const monthsLeft = Math.max(0, ms / (30 * 86400000));
  return { remaining, monthsLeft, monthlyNeeded: monthsLeft > 0 ? remaining / monthsLeft : remaining };
}

/* ================================================================== */
/* بینش هوشمند و یادآورها                                                 */
/* ================================================================== */

export function buildInsights({ txs, window, prevWindow, categories, budgets }) {
  const insights = [];
  const cur = summarizeWindow(txs, window.start, window.end);
  const prev = summarizeWindow(txs, window.prevStart, window.prevEnd);

  if (cur.income > 0 || cur.expense > 0) {
    const rate = cur.income > 0 ? Math.round(((cur.income - cur.expense) / cur.income) * 100) : 0;
    insights.push({
      icon: rate >= 20 ? '🌟' : rate >= 0 ? '⚖️' : '🚨',
      title: `نرخ پس‌انداز این دوره: ${faDigits(rate)}٪`,
      desc: rate >= 20 ? 'عالی! بالای ۲۰٪ درآمدت را نگه داشتی.' : rate >= 0 ? 'خرجت از درآمدت بیشتر نشده. ادامه بده!' : 'هشدار: خرجت از درآمدت بیشتر شده!',
      tone: rate >= 20 ? 'good' : rate >= 0 ? 'ok' : 'bad',
    });
  }

  if (prev.expense > 0 && cur.expense > 0) {
    const diff = Math.round(((cur.expense - prev.expense) / prev.expense) * 100);
    if (Math.abs(diff) >= 5) {
      insights.push({
        icon: diff > 0 ? '📈' : '📉',
        title: `خرج این دوره ${faDigits(Math.abs(diff))}٪ ${diff > 0 ? 'بیشتر' : 'کمتر'} از دوره قبل`,
        desc: diff > 0 ? 'ببین کدام دسته بیشتر شده.' : 'آفرین! روند کاهشی داری.',
        tone: diff > 0 ? 'warn' : 'good',
      });
    }
  }

  // پرشتاب‌ترین دسته
  const catMap = new Map((categories || []).map((c) => [c.id, c]));
  const curCats = sumByCategory(txs, 'expense', window.start, window.end);
  const prevCats = new Map(sumByCategory(txs, 'expense', prevWindow.start, prevWindow.end).map((r) => [r.categoryId, r.total]));
  let best = null;
  for (const row of curCats.slice(0, 6)) {
    const before = prevCats.get(row.categoryId) || 0;
    if (before > 0) {
      const growth = (row.total - before) / before;
      if (!best || growth > best.growth) best = { ...row, growth, before };
    }
  }
  if (best && best.growth >= 0.3) {
    const cat = catMap.get(best.categoryId);
    insights.push({
      icon: '🔥',
      title: `«${cat ? cat.name : 'بدون دسته'}» ${faDigits(Math.round(best.growth * 100))}٪ رشد کرده!`,
      desc: 'بیشترین رشد بین دسته‌ها. یه نگاه به تراکنش‌هاش بنداز.',
      tone: 'warn',
    });
  }

  // میانگین روزانه
  const days = Math.max(1, Math.round((window.end - window.start) / 86400000));
  if (cur.expense > 0) {
    insights.push({
      icon: '📆',
      title: `میانگین خرج روزانه: ${formatMoney(Math.round(cur.expense / days), { decimals: 0 })}`,
      desc: `در ${faDigits(days)} روز این دوره.`,
      tone: 'ok',
    });
  }

  // بدون دسته‌ها
  const uncat = (txs || []).filter((t) => t.type !== 'transfer' && !t.categoryId).length;
  if (uncat > 0) {
    insights.push({
      icon: '🏷️',
      title: `${faDigits(uncat)} تراکنش بدون دسته داری`,
      desc: 'دسته‌بندی‌شون کن تا گزارش‌ها دقیق بشن.',
      tone: 'warn',
    });
  }

  // بودجه‌های در خطر
  const danger = (budgets || []).filter((b) => {
    if (b.active === false) return false;
    const p = budgetProgress(b, txs, window);
    return p.pct >= 100;
  });
  if (danger.length) {
    insights.push({
      icon: '🚧',
      title: `${faDigits(danger.length)} بودجه رد شده!`,
      desc: 'سقف خرجت را رد کردی. تب بودجه‌ها را ببین.',
      tone: 'bad',
    });
  }

  return insights.slice(0, 6);
}

export function buildReminders({ bills, debts, budgets, goals, txs, window }) {
  const out = [];
  const now = Date.now();
  for (const bill of bills || []) {
    if (bill.active === false) continue;
    const st = billStatus(bill);
    if (st === 'paid' || st === 'off') continue;
    out.push({
      icon: bill.icon || '🧾',
      title: bill.title,
      sub: st === 'overdue' ? 'سررسید گذشته!' : st === 'today' ? 'امروز سررسید است' : `${faDigits(bill.dueDay - (jalaliParts(new Date())?.jd || 0))} روز مانده`,
      severity: st === 'overdue' ? 'bad' : st === 'today' ? 'warn' : 'ok',
      tab: 'bills',
      dueAt: st === 'overdue' ? now - 1 : now + 86400000,
    });
  }
  for (const debt of debts || []) {
    if (debt.settled || debtRemaining(debt) <= 0) continue;
    if (!debt.dueDate) continue;
    const diff = Date.parse(debt.dueDate) - now;
    if (diff < 0) {
      out.push({ icon: '🔴', title: `${DEBT_TYPE_LABELS[debt.debtType]}: ${debt.person}`, sub: 'مهلت گذشته!', severity: 'bad', tab: 'debts', dueAt: Date.parse(debt.dueDate) });
    } else if (diff < 7 * 86400000) {
      out.push({ icon: '🟡', title: `${DEBT_TYPE_LABELS[debt.debtType]}: ${debt.person}`, sub: `${faDigits(Math.ceil(diff / 86400000))} روز مانده`, severity: 'warn', tab: 'debts', dueAt: Date.parse(debt.dueDate) });
    }
  }
  for (const b of budgets || []) {
    if (b.active === false) continue;
    const p = budgetProgress(b, txs, window);
    if (p.pct >= 100) {
      out.push({ icon: '🚧', title: 'بودجه رد شده', sub: `${faDigits(p.pct)}٪ مصرف`, severity: 'bad', tab: 'budgets', dueAt: now });
    } else if (p.pct >= 80) {
      out.push({ icon: '⚠️', title: 'بودجه نزدیک سقف', sub: `${faDigits(p.pct)}٪ مصرف`, severity: 'warn', tab: 'budgets', dueAt: now + 1 });
    }
  }
  for (const g of goals || []) {
    if (g.done || !g.deadline) continue;
    const diff = Date.parse(g.deadline) - now;
    if (diff < 0) {
      out.push({ icon: '⏰', title: `مهلت «${g.title}» گذشته`, sub: 'تمدیدش کن یا ببندش', severity: 'warn', tab: 'goals', dueAt: now });
    }
  }
  return out.sort((a, b) => a.dueAt - b.dueAt).slice(0, 12);
}

/* ================================================================== */
/* قوانین خودکار                                                         */
/* ================================================================== */

export function suggestCategoryId(title, rules) {
  const t = String(title || '').trim().toLowerCase();
  if (!t || !Array.isArray(rules)) return '';
  for (const rule of rules) {
    const kw = String(rule.keyword || '').trim().toLowerCase();
    if (kw && t.includes(kw)) return rule.categoryId;
  }
  return '';
}

/* ================================================================== */
/* CSV                                                                  */
/* ================================================================== */

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

const CSV_HEADERS = {
  date: ['date', 'at', 'تاریخ'],
  title: ['title', 'desc', 'description', 'عنوان', 'شرح'],
  amount: ['amount', 'price', 'مبلغ', 'مقدار'],
  type: ['type', 'نوع'],
  category: ['category', 'دسته', 'دسته‌بندی'],
  account: ['account', 'حساب'],
  note: ['note', 'notes', 'یادداشت', 'توضیح'],
};

export function parseTxCSV(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ['فایل خالی است یا فقط سربرگ دارد.'] };
  // حذف BOM
  const headerCells = splitCsvLine(lines[0].replace(/^\uFEFF/, '')).map((h) => h.toLowerCase());
  const colIndex = {};
  for (const [key, aliases] of Object.entries(CSV_HEADERS)) {
    const idx = headerCells.findIndex((h) => aliases.includes(h));
    if (idx >= 0) colIndex[key] = idx;
  }
  if (colIndex.title === undefined || colIndex.amount === undefined) {
    return { rows: [], errors: ['ستون‌های «عنوان» و «مبلغ» پیدا نشد.'] };
  }
  const rows = [];
  const errors = [];
  for (let i = 1; i < Math.min(lines.length, 2001); i += 1) {
    const cells = splitCsvLine(lines[i]);
    const get = (k) => (colIndex[k] !== undefined ? (cells[colIndex[k]] || '').trim() : '');
    const amount = parseAmountInput(get('amount'));
    if (!Number.isFinite(amount) || amount === 0) {
      errors.push(`سطر ${faDigits(i + 1)}: مبلغ نامعتبر.`);
      continue;
    }
    let type = 'expense';
    const rawType = get('type').toLowerCase();
    if (['income', 'درآمد', 'دخل', '+', 'in'].includes(rawType)) type = 'income';
    else if (amount < 0) type = 'income';
    rows.push({
      title: get('title') || 'بدون عنوان',
      amount: Math.abs(amount),
      type,
      at: get('date') && !Number.isNaN(Date.parse(get('date'))) ? new Date(get('date')).toISOString() : new Date().toISOString(),
      categoryName: get('category'),
      accountName: get('account'),
      note: get('note'),
    });
  }
  return { rows, errors: errors.slice(0, 10) };
}

/* ================================================================== */
/* ابزار نمایشی و سازگاری صفحه                                            */
/* ================================================================== */

/** فرار HTML برای رندر امن رشته‌های کاربر */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** ISO → مقدار input[type=date] محلی (YYYY-MM-DD) */
export function toLocalDateInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** مقدار input[type=date] → میلی‌ثانیه محلی */
export function parseLocalDateInput(value) {
  if (!value) return NaN;
  const t = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/** دانلود فایل متنی در مرورگر */
export function downloadTextFile(text, filename, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** پس‌انداز فعلی هدف */
export function goalSaved(goal) {
  return Math.max(0, Number(goal?.saved) || 0);
}

/** جمع نهایی فاکتور */
export function invoiceTotal(doc) {
  return invoiceTotals(doc).total;
}

export function txsToCSV(txs, { catMap, accMap }) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = ['date,title,amount,type,category,account,note'];
  for (const tx of txs || []) {
    lines.push(
      [
        new Date(tx.at).toISOString().slice(0, 10),
        q(tx.title),
        tx.type === 'income' ? tx.amount : -tx.amount,
        tx.type,
        q(catMap?.get(tx.categoryId)?.name || ''),
        q(accMap?.get(tx.accountId)?.name || ''),
        q(tx.note || ''),
      ].join(',')
    );
  }
  return `\uFEFF${lines.join('\n')}`;
}
