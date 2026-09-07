// src/utilities/formatters.js

/**
 * ViXoRa Formatters — تاریخ/ساعت فارسی، اعداد، پول، فایل
 */

const PERSIAN_LOCALE = 'fa-IR';

const NUMBER_FORMATTERS = new Map();

function getNumberFormat(options) {
  const key = JSON.stringify(options || {});
  if (!NUMBER_FORMATTERS.has(key)) {
    NUMBER_FORMATTERS.set(key, new Intl.NumberFormat(PERSIAN_LOCALE, options));
  }
  return NUMBER_FORMATTERS.get(key);
}

function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === 'number') {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  if (typeof value === 'string' && value.trim()) {
    const fromString = new Date(value);
    return Number.isNaN(fromString.getTime()) ? null : fromString;
  }

  return null;
}

/* ---------------- اعداد ---------------- */

export function formatNumber(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '۰';
  return getNumberFormat(options).format(number);
}

export function toLatinDigits(value) {
  return String(value ?? '').replace(/[۰-۹]/g, (digit) =>
    String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
  ).replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(toLatinDigits(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatCurrency(value, currency = 'IRR') {
  const number = toNumber(value, 0);

  const formatted = getNumberFormat({ maximumFractionDigits: 0 }).format(Math.round(number));

  return currency === 'IRR' ? `${formatted} تومان` : `${formatted} ${currency}`;
}

export function formatCompactNumber(value) {
  const number = toNumber(value, 0);

  if (Math.abs(number) < 1000) return formatNumber(number);

  return getNumberFormat({ notation: 'compact', maximumFractionDigits: 1 }).format(number);
}

export function formatPercent(value, fractionDigits = 0) {
  const number = toNumber(value, 0);
  return getNumberFormat({
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(number / 100);
}

/* ---------------- تاریخ ---------------- */

export function formatPersianDate(value, options = {}) {
  const date = toDate(value);
  if (!date) return '—';

  const merged = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(PERSIAN_LOCALE, merged).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatPersianDateTime(value) {
  const date = toDate(value);
  if (!date) return '—';

  return `${formatPersianDate(date)} — ${formatPersianTime(date)}`;
}

export function formatPersianTime(value) {
  const date = toDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatWeekday(value) {
  const date = toDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat(PERSIAN_LOCALE, { weekday: 'long' }).format(date);
}

export function formatDateInput(value) {
  const date = toDate(value);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** «۳ روز پیش»، «همین حالا»، «۲ هفته پیش» */
export function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) return '—';

  const diffMs = Date.now() - date.getTime();
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  const units = [
    { label: 'ثانیه', ms: 1000 },
    { label: 'دقیقه', ms: 60 * 1000 },
    { label: 'ساعت', ms: 60 * 60 * 1000 },
    { label: 'روز', ms: 24 * 60 * 60 * 1000 },
    { label: 'هفته', ms: 7 * 24 * 60 * 60 * 1000 },
    { label: 'ماه', ms: 30 * 24 * 60 * 60 * 1000 },
    { label: 'سال', ms: 365 * 24 * 60 * 60 * 1000 },
  ];

  if (absDiff < 45 * 1000) return 'همین حالا';

  let chosen = units[0];
  for (const unit of units) {
    if (absDiff >= unit.ms) chosen = unit;
  }

  const amount = Math.floor(absDiff / chosen.ms);
  const text = `${formatNumber(amount)} ${chosen.label}`;

  return isFuture ? `${text} دیگر` : `${text} پیش`;
}

/** تفاوت روز بین دو تاریخ (مثلاً برای سررسید) */
export function daysBetween(fromValue, toValue = Date.now()) {
  const from = toDate(fromValue);
  const to = toDate(toValue);

  if (!from || !to) return 0;

  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export function isToday(value) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/* ---------------- متن ---------------- */

export function truncateText(value, maxLength = 60, suffix = '…') {
  const text = String(value ?? '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}${suffix}`;
}

export function getInitials(name, fallback = '؟') {
  const text = String(name ?? '').trim();
  if (!text) return fallback;

  const parts = text.split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part.charAt(0)).join('') || fallback;
}

export function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '');
}

/* ---------------- فایل ---------------- */

export function formatFileSize(bytes) {
  const size = toNumber(bytes, 0);
  if (size <= 0) return '۰ بایت';

  const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** exponent;

  return `${formatNumber(value.toFixed(exponent === 0 ? 0 : 1))} ${units[exponent]}`;
}
