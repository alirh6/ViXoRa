// src/core/services/segmentation-service.js

/**
 * ViXoRa — موتور بخش‌بندی مشتریان (Segmentation Engine)
 * ==================================================================
 * دو لایه:
 *   ۱) «سطل‌های هوشمند» (Smart Buckets): فیلترهای آمادهٔ یک‌کلیکی
 *      مثل «سبد خرید پرداخت‌نشده»، «تولد امروز»، «خرید امروز»، «ریزش‌کرده»
 *   ۲) «قواعد دلخواه» (Rule Builder): ادمین خودش شرط می‌سازد
 *      (سن بین ۱۸ تا ۲۴ + موجودی بیشتر از صفر + شهر تهران) و آن را ذخیره می‌کند.
 *
 * این فایل کاملاً خالص است (بدون DOM) و کاملاً تست‌پذیر.
 */

import {
  CUSTOMER_FIELDS,
  getAge,
  getAgeRange,
  getBalanceRange,
  getCustomerStats,
  getCustomerName,
  daysBetweenDates,
  isBirthdayToday,
  toLatinDigits,
  createId,
  normalizeCustomer,
} from '../schemas/customer-schema.js';
import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();

const SEGMENTS_KEY = 'ViXoRa:customer-segments';

/* ================================================================== */
/* عملگرها                                                             */
/* ================================================================== */

export const RULE_OPERATORS = [
  { key: 'eq', label: 'برابر با', needsValue: true },
  { key: 'neq', label: 'مخالف با', needsValue: true },
  { key: 'contains', label: 'شامل متن', needsValue: true, textOnly: true },
  { key: 'not-contains', label: 'شامل متن نباشد', needsValue: true, textOnly: true },
  { key: 'starts-with', label: 'شروع با', needsValue: true, textOnly: true },
  { key: 'gt', label: 'بزرگ‌تر از', needsValue: true, numericOnly: true },
  { key: 'gte', label: 'بزرگ‌تر یا مساوی', needsValue: true, numericOnly: true },
  { key: 'lt', label: 'کوچک‌تر از', needsValue: true, numericOnly: true },
  { key: 'lte', label: 'کوچک‌تر یا مساوی', needsValue: true, numericOnly: true },
  { key: 'between', label: 'بین دو مقدار', needsValue: true, numericOnly: true, needsSecondValue: true },
  { key: 'in', label: 'یکی از این‌ها', needsValue: true, listValue: true },
  { key: 'has', label: 'دارد (پر است)', needsValue: false },
  { key: 'empty', label: 'خالی است', needsValue: false },
  { key: 'days-ago-lt', label: 'کمتر از N روز پیش', needsValue: true, numericOnly: true, dateOnly: true },
  { key: 'days-ago-gt', label: 'بیشتر از N روز پیش', needsValue: true, numericOnly: true, dateOnly: true },
];

/** فیلدهایی که می‌توان روی آن‌ها شرط گذاشت (فیلدهای تخت + فیلدهای محاسباتی) */
export const RULE_FIELDS = [
  { key: 'firstName', label: 'نام', kind: 'text' },
  { key: 'lastName', label: 'نام خانوادگی', kind: 'text' },
  { key: 'name', label: 'نام کامل', kind: 'computed-text' },
  { key: 'mobile', label: 'موبایل', kind: 'text' },
  { key: 'email', label: 'ایمیل', kind: 'text' },
  { key: 'nationalCode', label: 'کد ملی', kind: 'text' },
  { key: 'city', label: 'شهر', kind: 'text' },
  { key: 'province', label: 'استان', kind: 'text' },
  { key: 'country', label: 'کشور', kind: 'text' },
  { key: 'district', label: 'محله', kind: 'text' },
  { key: 'address', label: 'آدرس', kind: 'text' },
  { key: 'occupation', label: 'شغل', kind: 'text' },
  { key: 'company', label: 'شرکت', kind: 'text' },
  { key: 'source', label: 'منبع آشنایی', kind: 'text' },
  { key: 'owner', label: 'مالک رابطه', kind: 'text' },
  { key: 'gender', label: 'جنسیت', kind: 'select' },
  { key: 'accountType', label: 'نوع حساب', kind: 'select' },
  { key: 'status', label: 'وضعیت', kind: 'select' },
  { key: 'loyaltyTier', label: 'سطح وفاداری', kind: 'select' },
  { key: 'age', label: 'سن', kind: 'number' },
  { key: 'ageRange', label: 'بازهٔ سنی', kind: 'select' },
  { key: 'balance', label: 'موجودی', kind: 'number' },
  { key: 'balanceRange', label: 'بازهٔ موجودی', kind: 'select' },
  { key: 'debt', label: 'بدهی', kind: 'number' },
  { key: 'totalSpent', label: 'مجموع خرید', kind: 'number' },
  { key: 'averageOrderValue', label: 'میانگین سبد', kind: 'number' },
  { key: 'orderCount', label: 'تعداد سفارش', kind: 'number' },
  { key: 'customerLifetimeValue', label: 'ارزش طول عمر', kind: 'number' },
  { key: 'cartValue', label: 'ارزش سبد باز', kind: 'number' },
  { key: 'loyaltyPoints', label: 'امتیاز وفاداری', kind: 'number' },
  { key: 'riskScore', label: 'امتیاز ریزش', kind: 'number' },
  { key: 'leadScore', label: 'امتیاز سرنخ', kind: 'number' },
  { key: 'loginCount', label: 'تعداد ورودها', kind: 'number' },
  { key: 'onlineSeconds', label: 'زمان آنلاین (ثانیه)', kind: 'number' },
  { key: 'pageViewCount', label: 'بازدید صفحه', kind: 'number' },
  { key: 'ticketCount', label: 'تعداد تیکت', kind: 'number' },
  { key: 'messageCount', label: 'تعداد پیام', kind: 'number' },
  { key: 'satisfactionScore', label: 'امتیاز رضایت', kind: 'number' },
  { key: 'tags', label: 'برچسب‌ها', kind: 'list' },
  { key: 'favoriteCategories', label: 'دسته‌های محبوب', kind: 'list' },
  { key: 'signupAt', label: 'تاریخ ثبت‌نام', kind: 'date' },
  { key: 'lastLoginAt', label: 'آخرین ورود', kind: 'date' },
  { key: 'lastPurchaseAt', label: 'آخرین خرید', kind: 'date' },
  { key: 'lastTicketAt', label: 'آخرین تیکت', kind: 'date' },
  { key: 'lastMessageAt', label: 'آخرین پیام', kind: 'date' },
  { key: 'lastSeenAt', label: 'آخرین فعالیت', kind: 'date' },
  { key: 'birthDate', label: 'تاریخ تولد', kind: 'date' },
  { key: 'hasOpenCart', label: 'سبد خرید باز', kind: 'boolean' },
  { key: 'hasOpenTicket', label: 'تیکت باز', kind: 'boolean' },
  { key: 'hasUnreadReply', label: 'پاسخ خوانده‌نشده', kind: 'boolean' },
  { key: 'smsOptIn', label: 'اجازهٔ پیامک', kind: 'boolean' },
  { key: 'emailOptIn', label: 'اجازهٔ ایمیل', kind: 'boolean' },
  { key: 'pushOptIn', label: 'اجازهٔ پوش', kind: 'boolean' },
  { key: 'doNotDisturb', label: 'تماس گرفته نشود', kind: 'boolean' },
  { key: 'birthdayToday', label: 'تولد امروز', kind: 'boolean' },
  { key: 'purchasedToday', label: 'خرید امروز', kind: 'boolean' },
  { key: 'isMinor', label: 'زیر ۱۸ سال', kind: 'boolean' },
  { key: 'isFavorite', label: 'ستاره‌دار', kind: 'boolean' },
  { key: 'daysSinceLastPurchase', label: 'روز از آخرین خرید', kind: 'number' },
  { key: 'daysSinceLastLogin', label: 'روز از آخرین ورود', kind: 'number' },
  { key: 'daysSinceSignup', label: 'روز از ثبت‌نام', kind: 'number' },
];

export const RULE_MATCHERS = ['any', 'all'];

/* ================================================================== */
/* سطل‌های هوشمند آماده                                                */
/* ================================================================== */

export const SMART_BUCKETS = [
  { key: 'all', label: 'همهٔ مشتریان', icon: '👥', match: () => true, priority: 'primary' },
  { key: 'active', label: 'فعال', icon: '🟢', match: (customer) => customer.status === 'active' && !customer.trashed },
  { key: 'favorites', label: 'ستاره‌دار', icon: '⭐', match: (customer) => Boolean(customer.favorite) },
  { key: 'pinned', label: 'سنجاق‌شده', icon: '📌', match: (customer) => Boolean(customer.pinned) },

  /* --- مالی --- */
  { key: 'balance-zero', label: 'موجودی صفر', icon: '💸', match: (customer) => Number(customer.balance || 0) === 0, group: 'finance' },
  { key: 'balance-positive', label: 'موجودی بیشتر از صفر', icon: '💰', match: (customer) => Number(customer.balance || 0) > 0, group: 'finance' },
  { key: 'balance-negative', label: 'بدهکار', icon: '⛔', match: (customer) => Number(customer.balance || 0) < 0 || Number(customer.debt || 0) > 0, group: 'finance' },
  { key: 'high-value', label: 'مشتریان طلایی (خرید بالا)', icon: '👑', match: (customer) => Number(customer.totalSpent || 0) >= 10_000_000, group: 'finance' },
  { key: 'never-purchased', label: 'هرگز خرید نکرده', icon: '🌱', match: (customer) => Number(customer.orderCount || 0) === 0, group: 'finance' },
  { key: 'vip', label: 'حساب ویژه (VIP)', icon: '💎', match: (customer) => customer.accountType === 'vip', group: 'finance' },
  { key: 'corporate', label: 'حقوقی/شرکتی', icon: '🏢', match: (customer) => customer.accountType === 'corporate', group: 'finance' },

  /* --- رفتاری/فروش --- */
  { key: 'open-cart', label: 'سبد خرید پرداخت‌نشده', icon: '🛒', match: (customer) => Boolean(customer.hasOpenCart), group: 'commerce' },
  { key: 'purchased-today', label: 'خرید امروز', icon: '🧾', match: (customer) => purchasedWithinDays(customer, 1), group: 'commerce' },
  { key: 'purchased-week', label: 'خرید این هفته', icon: '📆', match: (customer) => purchasedWithinDays(customer, 7), group: 'commerce' },
  { key: 'at-risk', label: 'خیلی وقت است خرید نکرده', icon: '⏳', match: (customer) => {
      const days = daysSince(customer.lastPurchaseAt);
      return days !== null && days > 60;
    }, group: 'commerce' },
  { key: 'churned', label: 'ریزش‌کرده', icon: '📉', match: (customer) => customer.status === 'churned' || Number(customer.riskScore || 0) >= 70, group: 'commerce' },
  { key: 'new-this-month', label: 'عضو این ماه', icon: '🆕', match: (customer) => daysSince(customer.signupAt || customer.createdAt) <= 30, group: 'commerce' },
  { key: 'repeat-buyer', label: 'خریدار تکراری', icon: '🔁', match: (customer) => Number(customer.orderCount || 0) >= 3, group: 'commerce' },

  /* --- پشتیبانی --- */
  { key: 'open-ticket', label: 'تیکت باز دارد', icon: '🎫', match: (customer) => hasOpenTicket(customer), group: 'support' },
  { key: 'messaged', label: 'به پشتیبانی پیام داده', icon: '💬', match: (customer) => Number(customer.messageCount || 0) > 0, group: 'support' },
  { key: 'has-ticket', label: 'تیکت ثبت کرده', icon: '📮', match: (customer) => Number(customer.ticketCount || 0) > 0, group: 'support' },
  { key: 'unhappy', label: 'ناراضی (امتیاز پایین)', icon: '😞', match: (customer) => Number(customer.satisfactionScore || 0) > 0 && Number(customer.satisfactionScore) <= 2, group: 'support' },
  { key: 'unread-reply', label: 'پاسخ خوانده‌نشده دارد', icon: '📩', match: (customer) => Boolean(customer.hasUnreadReply), group: 'support' },
  { key: 'complained', label: 'شکایت داشته', icon: '⚠️', match: (customer) => Number(customer.complaintCount || 0) > 0, group: 'support' },

  /* --- تولد و مناسبت --- */
  { key: 'birthday-today', label: 'تولد امروز', icon: '🎂', match: (customer) => isBirthdayToday(customer), group: 'occasion' },
  { key: 'birthday-week', label: 'تولد این هفته', icon: '🎉', match: (customer) => birthdayWithinDays(customer, 7), group: 'occasion' },

  /* --- داده و تماس --- */
  { key: 'no-mobile', label: 'بدون شمارهٔ موبایل', icon: '📵', match: (customer) => !String(customer.mobile || '').trim(), group: 'data' },
  { key: 'no-email', label: 'بدون ایمیل', icon: '✉️', match: (customer) => !String(customer.email || '').trim(), group: 'data' },
  { key: 'incomplete', label: 'پروفایل ناقص', icon: '🧩', match: (customer) => completeness(customer) < 60, group: 'data' },
  { key: 'has-location', label: 'موقعیت روی نقشه دارد', icon: '🗺️', match: (customer) => customer.lat !== '' && customer.lng !== '', group: 'data' },
  { key: 'never-logged-in', label: 'هرگز وارد نشده', icon: '🚪', match: (customer) => !customer.lastLoginAt && Number(customer.loginCount || 0) === 0, group: 'data' },
  { key: 'dormant', label: 'غیرفعال (بدون ورود ۳۰ روز)', icon: '😴', match: (customer) => {
      const days = daysSince(customer.lastSeenAt || customer.lastLoginAt);
      return days !== null && days > 30;
    }, group: 'data' },

  /* --- سیستمی --- */
  { key: 'blocked', label: 'مسدود', icon: '🚫', match: (customer) => Boolean(customer.blocked) || customer.status === 'blocked', group: 'system' },
  { key: 'trash', label: 'زباله‌دان', icon: '🗑️', match: (customer) => Boolean(customer.trashed), group: 'system' },
  { key: 'archived', label: 'آرشیو', icon: '🗄️', match: (customer) => Boolean(customer.archived), group: 'system' },
];

export const SMART_BUCKET_MAP = SMART_BUCKETS.reduce((map, bucket) => {
  map[bucket.key] = bucket;
  return map;
}, {});

export const BUCKET_GROUPS = {
  finance: 'مالی',
  commerce: 'رفتار خرید',
  support: 'پشتیبانی',
  occasion: 'مناسبت‌ها',
  data: 'کیفیت داده',
  system: 'سیستمی',
};

/* ================================================================== */
/* توابع کمکی سطل‌ها                                                   */
/* ================================================================== */

function daysSince(iso) {
  return daysBetweenDates(iso);
}

function purchasedWithinDays(customer, days) {
  const value = daysSince(customer.lastPurchaseAt);
  return value !== null && value >= 0 && value < days;
}

function hasOpenTicket(customer) {
  if (customer.hasOpenTicket) return true;

  return Array.isArray(customer.tickets)
    ? customer.tickets.some((ticket) => ticket.status === 'open' || ticket.status === 'pending')
    : false;
}

function birthdayWithinDays(customer, days) {
  if (!customer.birthDate) return false;

  const birth = new Date(customer.birthDate);
  if (Number.isNaN(birth.getTime())) return false;

  const now = new Date();
  const base = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());

  if (base < now) base.setFullYear(base.getFullYear() + 1);

  const diff = Math.round((base.getTime() - now.getTime()) / 86_400_000);

  return diff >= 0 && diff < days;
}

function completeness(customer) {
  return getCustomerStats(customer)?.profileCompleteness ?? 0;
}

/* ================================================================== */
/* ارزیابی یک قاعده روی یک مشتری                                        */
/* ================================================================== */

/** مقدار واقعی یک فیلد (شامل فیلدهای محاسباتی) */
export function getRuleValue(customer, fieldKey) {
  if (!customer) return '';

  switch (fieldKey) {
    case 'name':
      return getCustomerName(customer);
    case 'age':
      return getAge(customer);
    case 'ageRange':
      return getAgeRange(customer);
    case 'balanceRange':
      return getBalanceRange(customer);
    case 'birthdayToday':
      return isBirthdayToday(customer);
    case 'purchasedToday':
      return purchasedWithinDays(customer, 1);
    case 'isMinor':
      return (getAge(customer) ?? 99) < 18;
    case 'isFavorite':
      return Boolean(customer.favorite);
    case 'hasOpenTicket':
      return hasOpenTicket(customer);
    case 'daysSinceLastPurchase':
      return daysSince(customer.lastPurchaseAt);
    case 'daysSinceLastLogin':
      return daysSince(customer.lastSeenAt || customer.lastLoginAt);
    case 'daysSinceSignup':
      return daysSince(customer.signupAt || customer.createdAt);
    default:
      return customer[fieldKey];
  }
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;

  const parsed = Number(toLatinDigits(String(value)).replace(/[^\d.-]/g, ''));

  return Number.isFinite(parsed) ? parsed : null;
}

function toStringValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' ');

  return String(value);
}

/** ارزیابی یک قاعدهٔ منفرد */
export function evaluateRule(customer, rule) {
  if (!rule || !rule.field) return true;

  const rawValue = getRuleValue(customer, rule.field);
  const operator = rule.operator || 'eq';

  // عملگرهای بدون مقدار
  if (operator === 'has') {
    if (Array.isArray(rawValue)) return rawValue.length > 0;
    if (typeof rawValue === 'boolean') return rawValue;
    if (typeof rawValue === 'number') return rawValue !== 0;

    return toStringValue(rawValue).trim() !== '';
  }

  if (operator === 'empty') {
    if (Array.isArray(rawValue)) return rawValue.length === 0;
    if (typeof rawValue === 'boolean') return !rawValue;
    if (typeof rawValue === 'number') return rawValue === 0;

    return toStringValue(rawValue).trim() === '';
  }

  // عددی
  const fieldMeta = RULE_FIELDS.find((field) => field.key === rule.field);
  const isNumeric = fieldMeta?.kind === 'number';

  if (isNumeric || ['gt', 'gte', 'lt', 'lte', 'between'].includes(operator)) {
    const actual = toNumberOrNull(rawValue);
    const first = toNumberOrNull(rule.value);
    const second = toNumberOrNull(rule.value2);

    if (actual === null) return false;

    switch (operator) {
      case 'eq':
        return first !== null && actual === first;
      case 'neq':
        return first !== null && actual !== first;
      case 'gt':
        return first !== null && actual > first;
      case 'gte':
        return first !== null && actual >= first;
      case 'lt':
        return first !== null && actual < first;
      case 'lte':
        return first !== null && actual <= first;
      case 'between':
        return first !== null && second !== null && actual >= Math.min(first, second) && actual <= Math.max(first, second);
      case 'in': {
        const list = toStringValue(rule.value).split(',').map((item) => item.trim()).filter(Boolean);
        return list.some((item) => toNumberOrNull(item) === actual);
      }
      default:
        return false;
    }
  }

  // تاریخ بر حسب روز
  if (operator === 'days-ago-lt' || operator === 'days-ago-gt') {
    const actual = toNumberOrNull(rawValue);
    const limit = toNumberOrNull(rule.value);

    if (actual === null || limit === null) return false;

    return operator === 'days-ago-lt' ? actual < limit : actual > limit;
  }

  // بولی
  if (fieldMeta?.kind === 'boolean') {
    const expected = String(rule.value).toLowerCase() === 'true' || rule.value === true;
    return Boolean(rawValue) === expected;
  }

  // لیست
  if (Array.isArray(rawValue)) {
    const expected = toStringValue(rule.value).trim().toLowerCase();

    if (operator === 'in') {
      const list = toStringValue(rule.value).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
      return rawValue.some((item) => list.includes(String(item).toLowerCase()));
    }

    return rawValue.some((item) => String(item).toLowerCase().includes(expected));
  }

  // متنی
  const actual = toStringValue(rawValue).toLowerCase();
  const expected = toStringValue(rule.value).toLowerCase();

  switch (operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'contains':
      return expected !== '' && actual.includes(expected);
    case 'not-contains':
      return expected !== '' && !actual.includes(expected);
    case 'starts-with':
      return expected !== '' && actual.startsWith(expected);
    case 'in': {
      const list = toStringValue(rule.value).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
      return list.includes(actual);
    }
    default:
      return false;
  }
}

/* ================================================================== */
/* نرمال‌سازی و ذخیرهٔ بخش‌های سفارشی                                  */
/* ================================================================== */

export function normalizeRule(raw = {}) {
  const field = RULE_FIELDS.find((item) => item.key === raw?.field) ? raw.field : '';
  const operator = RULE_OPERATORS.find((item) => item.key === raw?.operator) ? raw.operator : 'eq';

  return {
    id: raw?.id || createId('rule'),
    field,
    operator,
    value: raw?.value === undefined ? '' : raw.value,
    value2: raw?.value2 === undefined ? '' : raw.value2,
    enabled: raw?.enabled !== false,
  };
}

export function normalizeSegment(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: raw.id || createId('segment'),
    name: String(raw.name || 'بخش جدید').slice(0, 60),
    description: String(raw.description || '').slice(0, 200),
    matcher: raw.matcher === 'any' ? 'any' : 'all',
    rules: Array.isArray(raw.rules) ? raw.rules.map(normalizeRule).filter((rule) => rule.field) : [],
    color: String(raw.color || 'blue'),
    icon: String(raw.icon || '🎯'),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getSavedSegments() {
  const list = storage.get(SEGMENTS_KEY, []);

  return Array.isArray(list) ? list.map(normalizeSegment).filter(Boolean) : [];
}

export function saveSegment(segment) {
  const normalized = normalizeSegment(segment);
  if (!normalized) return null;

  const list = getSavedSegments();
  const index = list.findIndex((item) => item.id === normalized.id);

  if (index === -1) list.unshift(normalized);
  else list[index] = { ...list[index], ...normalized };

  storage.set(SEGMENTS_KEY, list);

  return normalized;
}

export function deleteSegment(segmentId) {
  const list = getSavedSegments().filter((segment) => segment.id !== segmentId);
  storage.set(SEGMENTS_KEY, list);

  return list;
}

/* ================================================================== */
/* اعمال فیلتر                                                         */
/* ================================================================== */

/**
 * اعمال «سطل + قواعد + جستجو» روی لیست مشتریان.
 * @param {Array} customers
 * @param {Object} filter { bucket, segment, rules, matcher, query, queryScope, excludeTrash }
 */
export function filterCustomers(customers, filter = {}) {
  const list = Array.isArray(customers) ? customers : [];

  const {
    bucket = 'all',
    segment = null,
    rules = [],
    matcher = 'all',
    query = '',
    excludeTrash = true,
  } = filter;

  const bucketMeta = SMART_BUCKET_MAP[bucket] || SMART_BUCKET_MAP.all;

  const activeRules = (Array.isArray(rules) ? rules : []).filter((rule) => rule && rule.field && rule.enabled !== false);
  const segmentRules = segment
    ? (segment.rules || []).filter((rule) => rule.field && rule.enabled !== false)
    : [];

  const segmentMatcher = segment?.matcher === 'any' ? 'any' : 'all';

  const search = String(query || '').trim().toLowerCase();

  return list.filter((customer) => {
    if (!customer || typeof customer !== 'object') return false;

    if (excludeTrash && bucket !== 'trash' && customer.trashed) return false;
    if (bucket !== 'archived' && customer.archived && excludeTrash) return false;

    if (!bucketMeta.match(customer)) return false;

    if (activeRules.length > 0 && !matchRuleSet(customer, activeRules, matcher)) return false;
    if (segmentRules.length > 0 && !matchRuleSet(customer, segmentRules, segmentMatcher)) return false;

    if (search && !customerMatchesQuery(customer, search)) return false;

    return true;
  });
}

export function matchRuleSet(customer, rules, matcher = 'all') {
  if (!Array.isArray(rules) || rules.length === 0) return true;

  return matcher === 'any'
    ? rules.some((rule) => evaluateRule(customer, rule))
    : rules.every((rule) => evaluateRule(customer, rule));
}

function customerMatchesQuery(customer, search) {
  const haystack = [
    getCustomerName(customer),
    customer.username,
    customer.mobile,
    customer.phone,
    customer.email,
    customer.nationalCode,
    customer.city,
    customer.province,
    customer.country,
    customer.address,
    customer.company,
    customer.occupation,
    customer.source,
    customer.owner,
    customer.lastOrderNumber,
    customer.cardNumber,
    customer.shabaNumber,
    customer.signupIp,
    customer.lastLoginIp,
    customer.bio,
    customer.extraNotes,
    Array.isArray(customer.tags) ? customer.tags.join(' ') : '',
    Array.isArray(customer.addresses) ? customer.addresses.map((item) => `${item.label} ${item.city} ${item.address}`).join(' ') : '',
    Array.isArray(customer.customFields) ? customer.customFields.map((item) => `${item.label} ${item.value}`).join(' ') : '',
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();

  return haystack.includes(search);
}

/* ================================================================== */
/* شمارش سطل‌ها (برای سایدبار)                                         */
/* ================================================================== */

export function countBuckets(customers) {
  const list = Array.isArray(customers) ? customers : [];
  const counts = {};

  for (const bucket of SMART_BUCKETS) {
    counts[bucket.key] = list.filter((customer) => {
      if (!customer || typeof customer !== 'object') return false;

      // سطل‌های سیستمی روی همه اعمال می‌شوند؛ بقیه فقط روی دادهٔ سالم
      if (bucket.key !== 'trash' && customer.trashed) return false;

      try {
        return bucket.match(customer);
      } catch {
        return false;
      }
    }).length;
  }

  return counts;
}

export function countSegment(customers, segment) {
  const rules = (segment?.rules || []).filter((rule) => rule.field && rule.enabled !== false);

  return (Array.isArray(customers) ? customers : []).filter(
    (customer) => customer && !customer.trashed && matchRuleSet(customer, rules, segment?.matcher || 'all')
  ).length;
}

/* ================================================================== */
/* آمار کلان (داشبورد ابزار)                                           */
/* ================================================================== */

export function getDashboardStats(customers) {
  const list = (Array.isArray(customers) ? customers : []).filter((customer) => !customer.trashed);

  const now = new Date();

  const totalBalance = list.reduce((sum, customer) => sum + Number(customer.balance || 0), 0);
  const totalSpent = list.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0);
  const totalOrders = list.reduce((sum, customer) => sum + Number(customer.orderCount || 0), 0);
  const totalDebt = list.reduce((sum, customer) => sum + Number(customer.debt || 0), 0);

  const genders = { male: 0, female: 0, other: 0, unknown: 0 };
  const cities = {};
  const accountTypes = {};
  const ageRanges = {};

  let withMobile = 0;
  let withEmail = 0;
  let withLocation = 0;
  let minors = 0;
  let openCarts = 0;
  let openTickets = 0;
  let birthdaysToday = 0;
  let purchasedToday = 0;
  let completenessSum = 0;

  for (const customer of list) {
    const stats = getCustomerStats(customer);

    const gender = genders[customer.gender] !== undefined ? customer.gender : 'unknown';
    genders[gender] += 1;

    const city = String(customer.city || '').trim() || 'نامشخص';
    cities[city] = (cities[city] || 0) + 1;

    const accountType = String(customer.accountType || 'normal');
    accountTypes[accountType] = (accountTypes[accountType] || 0) + 1;

    const ageRange = stats?.ageRange || 'unknown';
    ageRanges[ageRange] = (ageRanges[ageRange] || 0) + 1;

    if (String(customer.mobile || '').trim()) withMobile += 1;
    if (String(customer.email || '').trim()) withEmail += 1;
    if (customer.lat !== '' && customer.lng !== '') withLocation += 1;
    if (stats?.isMinor) minors += 1;
    if (customer.hasOpenCart) openCarts += 1;
    if (stats?.hasOpenTicket) openTickets += 1;
    if (stats?.isBirthdayToday) birthdaysToday += 1;
    if (stats?.daysSinceLastPurchase === 0) purchasedToday += 1;

    completenessSum += stats?.profileCompleteness || 0;
  }

  const newThisMonth = list.filter(
    (customer) => (daysSince(customer.signupAt || customer.createdAt) ?? 999) <= 30
  ).length;

  return {
    total: list.length,
    trashed: (Array.isArray(customers) ? customers : []).length - list.length,
    totalBalance,
    totalSpent,
    totalOrders,
    totalDebt,
    averageBalance: list.length ? Math.round(totalBalance / list.length) : 0,
    averageSpent: list.length ? Math.round(totalSpent / list.length) : 0,
    genders,
    cities,
    accountTypes,
    ageRanges,
    withMobile,
    withEmail,
    withLocation,
    minors,
    adults: list.length - minors,
    openCarts,
    openTickets,
    birthdaysToday,
    purchasedToday,
    newThisMonth,
    averageCompleteness: list.length ? Math.round(completenessSum / list.length) : 0,
    topCities: Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count })),
    generatedAt: now.toISOString(),
  };
}

/* ================================================================== */
/* خروجی گرفتن                                                         */
/* ================================================================== */

/** توضیح فارسی یک قاعده (برای نمایش چیپ‌ها) */
export function describeRule(rule) {
  if (!rule || !rule.field) return '';

  const fieldMeta = RULE_FIELDS.find((field) => field.key === rule.field);
  const operatorMeta = RULE_OPERATORS.find((item) => item.key === rule.operator);

  const label = fieldMeta?.label || rule.field;
  const operatorLabel = operatorMeta?.label || rule.operator;

  if (!operatorMeta?.needsValue) return `${label} ${operatorLabel}`;

  const value = String(rule.value ?? '');
  const second = rule.value2 !== '' && rule.value2 !== undefined ? ` تا ${rule.value2}` : '';

  return `${label} ${operatorLabel} ${value}${second}`;
}

export function describeSegment(segment) {
  if (!segment) return '';

  const rules = (segment.rules || []).map(describeRule).filter(Boolean);

  if (rules.length === 0) return segment.name || '';

  const joiner = segment.matcher === 'any' ? ' یا ' : ' و ';

  return `${segment.name}: ${rules.join(joiner)}`;
}

/**
 * تبدیل مشتریان به CSV (برای اکسل) با سرستون فارسی.
 */
export function customersToCsv(customers, { columns = null, delimiter = ',' } = {}) {
  const list = Array.isArray(customers) ? customers : [];

  const keys = Array.isArray(columns) && columns.length
    ? columns
    : ['firstName', 'lastName', 'mobile', 'email', 'city', 'province', 'balance', 'totalSpent', 'orderCount', 'accountType', 'status', 'lastPurchaseAt', 'signupAt'];

  const escape = (value) => {
    const text = toStringValue(value ?? '').replace(/\r?\n/g, ' ');

    if (text.includes(delimiter) || text.includes('"')) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const header = keys.map((key) => escape(CUSTOMER_FIELD_LABELS[key] || key)).join(delimiter);

  const rows = list.map((customer) =>
    keys
      .map((key) => {
        const value = getRuleValue(customer, key);
        return escape(Array.isArray(value) ? value.join(' | ') : value);
      })
      .join(delimiter)
  );

  // BOM برای نمایش درست فارسی در اکسل
  return `\uFEFF${[header, ...rows].join('\n')}`;
}

const CUSTOMER_FIELD_LABELS = CUSTOMER_FIELDS.reduce((map, field) => {
  map[field.key] = field.label;
  return map;
}, {});

/**
 * تبدیل آرایهٔ CSV به آرایهٔ آبجکت (برای ایمپورت مشتری از ابزار دیگر/اکسل).
 * سرستون‌های فارسی و انگلیسی و نام‌های رایج را می‌شناسد.
 */
export function parseCsv(text, { delimiter = null } = {}) {
  const raw = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!raw) return { rows: [], columns: [] };

  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return { rows: [], columns: [] };

  const separator = delimiter || detectDelimiter(lines[0]);

  const columns = splitCsvLine(lines[0], separator).map((column) => column.trim());

  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, separator);

    return cells.reduce((row, cell, index) => {
      const key = columns[index];
      if (key) row[key] = cell.trim();
      return row;
    }, {});
  });

  return { rows, columns };
}

function detectDelimiter(sample) {
  const candidates = [',', ';', '\t', '|'];

  let best = ',';
  let bestCount = 0;

  for (const candidate of candidates) {
    const count = sample.split(candidate).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }

  return best;
}

function splitCsvLine(line, delimiter) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);

  return cells;
}

/** نگاشت سرستون (فارسی/انگلیسی/رایج) به کلید فیلد مشتری */
const HEADER_ALIASES = {
  'نام': 'firstName',
  'نام کوچک': 'firstName',
  'firstname': 'firstName',
  'name': 'firstName',
  'نام خانوادگی': 'lastName',
  'فامیلی': 'lastName',
  'lastname': 'lastName',
  'موبایل': 'mobile',
  'شماره تماس': 'mobile',
  'تلفن همراه': 'mobile',
  'phone': 'mobile',
  'phonenumber': 'mobile',
  'mobile': 'mobile',
  'ایمیل': 'email',
  'email': 'email',
  'mail': 'email',
  'کد ملی': 'nationalCode',
  'nationalcode': 'nationalCode',
  'شهر': 'city',
  'city': 'city',
  'استان': 'province',
  'کشور': 'country',
  'آدرس': 'address',
  'کد پستی': 'postalCode',
  'موجودی': 'balance',
  'inventory': 'balance',
  'balance': 'balance',
  'مجموع خرید': 'totalSpent',
  'تعداد سفارش': 'orderCount',
  'تاریخ تولد': 'birthDate',
  'تولد': 'birthDate',
  'جنسیت': 'gender',
  'شغل': 'occupation',
  'شرکت': 'company',
  'تاریخ ثبت نام': 'signupAt',
  'memberSince': 'signupAt',
  'برچسب': 'tags',
  'تگ': 'tags',
  'tags': 'tags',
};

export function mapImportRow(row, mapping = {}) {
  if (!row || typeof row !== 'object') return null;

  const customer = {};

  for (const [header, value] of Object.entries(row)) {
    const normalizedHeader = String(header).trim().toLowerCase();

    const key =
      mapping[header] ||
      HEADER_ALIASES[String(header).trim()] ||
      HEADER_ALIASES[normalizedHeader] ||
      null;

    if (key && value !== '') customer[key] = value;
  }

  return Object.keys(customer).length ? normalizeCustomer(customer) : null;
}

/** پیش‌نمایش ایمپورت: چند ردیف معتبر، چند تکراری، چند خراب */
export function previewImport(rows, existingCustomers = []) {
  const list = Array.isArray(rows) ? rows : [];

  const seen = new Set(
    (Array.isArray(existingCustomers) ? existingCustomers : [])
      .map((customer) => dedupeKey(customer))
      .filter(Boolean)
  );

  const valid = [];
  const duplicates = [];
  const invalid = [];

  for (const row of list) {
    const customer = mapImportRow(row);

    if (!customer) {
      invalid.push(row);
      continue;
    }

    const key = dedupeKey(customer);

    if (key && seen.has(key)) {
      duplicates.push(customer);
      continue;
    }

    if (key) seen.add(key);
    valid.push(customer);
  }

  return {
    total: list.length,
    valid,
    duplicates,
    invalid,
    validCount: valid.length,
    duplicateCount: duplicates.length,
    invalidCount: invalid.length,
  };
}

function dedupeKey(customer) {
  const mobile = String(customer.mobile || '').replace(/\D/g, '');
  if (mobile) return `m:${mobile}`;

  const email = String(customer.email || '').trim().toLowerCase();
  if (email) return `e:${email}`;

  const national = String(customer.nationalCode || '').replace(/\D/g, '');
  if (national) return `n:${national}`;

  return '';
}

export { dedupeKey };
