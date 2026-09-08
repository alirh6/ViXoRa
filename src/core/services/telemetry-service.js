// src/core/services/telemetry-service.js

/**
 * ViXoRa — سرویس تله‌متری مشتری
 * ==============================
 * داده‌های رفتاری را از محیط مرورگر جمع می‌کند و روی مشتری می‌نویسد:
 *   • دستگاه و سیستم‌عامل و مرورگر فعلی
 *   • IP (از سرویس عمومی، با fallback)
 *   • شهر/موقعیت تقریبی از IP
 *   • ثبت ورود، زمان آنلاین، تعداد بازدید
 *
 * بدون بک‌اند: IP از یک سرویس عمومی JSON گرفته می‌شود؛ اگر در دسترس نبود
 * (محیط آفلاین/تست) مقدار خالی برمی‌گرداند و هرگز crash نمی‌کند.
 * کاملاً خالص (بدون DOM) و تست‌پذیر؛ هر تابع ورودی‌اش را می‌گیرد.
 */

import { createId, normalizeCustomer, parseDeviceLabel } from '../schemas/customer-schema.js';

/* ================================================================== */
/* شناسایی دستگاه                                                      */
/* ================================================================== */

export function detectDevice(userAgent = '') {
  const ua = String(userAgent || '');

  let os = 'unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod|ios/i.test(ua)) os = 'iOS';
  else if (/mac os x|macintosh/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|chromium/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  let deviceType = 'desktop';
  if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) deviceType = 'tablet';
  else if (/mobi|iphone|ipod|android.*mobile/i.test(ua)) deviceType = 'mobile';

  return { os, browser, deviceType, label: parseDeviceLabel(ua) || `${browser} روی ${os}` };
}

export function buildDeviceRecord(userAgent = '', extra = {}) {
  const device = detectDevice(userAgent);

  return {
    id: createId('device'),
    userAgent: String(userAgent || '').slice(0, 300),
    os: device.os,
    browser: device.browser,
    deviceType: device.deviceType,
    label: device.label,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    loginCount: 1,
    ...extra,
  };
}

/* ================================================================== */
/* IP و موقعیت جغرافیایی از IP                                         */
/* ================================================================== */

const IP_ENDPOINTS = [
  'https://ipapi.co/json/',
  'https://ipwho.is/',
  'https://ipapi.is/json/',
];

/**
 * گرفتن IP + موقعیت تقریبی از سرویس عمومی.
 * @returns {Promise<{ip:string, city:string, country:string, region:string, lat:string, lng:string, source:string}>}
 */
export async function fetchIpInfo({ signal = null, timeoutMs = 6000 } = {}) {
  const empty = { ip: '', city: '', country: '', region: '', lat: '', lng: '', source: '' };

  if (typeof fetch !== 'function') return empty;

  for (const url of IP_ENDPOINTS) {
    try {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

      const response = await fetch(url, {
        signal: controller ? controller.signal : signal,
        headers: { Accept: 'application/json' },
      });

      if (timer) clearTimeout(timer);
      if (!response.ok) continue;

      const data = await response.json();

      const ip = data.ip || data.query || data.ip_addr || '';
      const city = data.city || data.city_name || '';
      const country = data.country_name || data.country || '';
      const region = data.region || data.region_name || data.state || '';
      const lat = data.latitude || data.lat || '';
      const lng = data.longitude || data.lon || data.long || '';

      if (ip) {
        return { ip: String(ip), city, country, region, lat: lat ? String(lat) : '', lng: lng ? String(lng) : '', source: url };
      }
    } catch {
      // endpoint بعدی
    }
  }

  return empty;
}

/* ================================================================== */
/* نوشتن تله‌متری روی مشتری                                            */
/* ================================================================== */

/**
 * ثبت یک «ورود» برای مشتری: دستگاه، IP، شهر، اولین ورود، آخرین ورود، تعداد.
 * @param {Object} customer
 * @param {Object} info {userAgent, ip, city, country, lat, lng, at}
 * @returns {Object} مشتری به‌روزشده
 */
export function recordLogin(customer, info = {}) {
  const source = normalizeCustomer(customer || {});
  const at = info.at || new Date().toISOString();

  const device = buildDeviceRecord(info.userAgent || '', { firstSeenAt: at, lastSeenAt: at });

  // افزودن/به‌روزرسانی دستگاه
  const devices = Array.isArray(source.devices) ? source.devices.slice() : [];
  const existingIndex = devices.findIndex((item) => item.userAgent === device.userAgent && item.userAgent !== '');
  if (existingIndex === -1) {
    devices.unshift(device);
  } else {
    devices[existingIndex] = {
      ...devices[existingIndex],
      lastSeenAt: at,
      loginCount: Number(devices[existingIndex].loginCount || 0) + 1,
    };
  }

  const loginCount = Number(source.loginCount || 0) + 1;
  const isFirstLogin = !source.firstLoginAt;

  return {
    ...source,
    devices: devices.slice(0, 20),
    loginCount,
    lastLoginAt: at,
    lastLoginDevice: device.label,
    lastLoginIp: info.ip || source.lastLoginIp || '',
    lastLoginCity: info.city || source.lastLoginCity || '',
    lastSeenAt: at,
    // اولین ورود فقط یک‌بار پر می‌شود
    firstLoginAt: isFirstLogin ? at : source.firstLoginAt,
    firstLoginDevice: isFirstLogin ? device.label : source.firstLoginDevice,
    firstLoginIp: isFirstLogin ? info.ip || '' : source.firstLoginIp,
    firstSignupDevice: isFirstLogin ? device.label : source.firstSignupDevice,
    updatedAt: at,
  };
}

/** افزودن یک «بازدید صفحه» */
export function recordPageView(customer, info = {}) {
  const source = normalizeCustomer(customer || {});
  const at = info.at || new Date().toISOString();

  return {
    ...source,
    pageViewCount: Number(source.pageViewCount || 0) + 1,
    lastSeenAt: at,
    lastSeenPage: info.page || source.lastSeenPage || '',
    updatedAt: at,
  };
}

/** افزودن زمان آنلاین (ثانیه) */
export function addOnlineSeconds(customer, seconds = 0) {
  const source = normalizeCustomer(customer || {});
  const value = Number(seconds || 0);

  return {
    ...source,
    onlineSeconds: Number(source.onlineSeconds || 0) + value,
    updatedAt: new Date().toISOString(),
  };
}

/** ثبت یک نشست (session) */
export function recordSession(customer, info = {}) {
  const source = normalizeCustomer(customer || {});
  const startedAt = info.startedAt || new Date().toISOString();

  const session = {
    id: createId('session'),
    startedAt,
    endedAt: info.endedAt || '',
    durationSeconds: Number(info.durationSeconds || 0),
    device: info.device || '',
    ip: info.ip || '',
    city: info.city || '',
    pages: Number(info.pages || 0),
  };

  const sessions = Array.isArray(source.sessions) ? [session, ...source.sessions].slice(0, 50) : [session];

  return { ...source, sessions, lastSeenAt: session.endedAt || startedAt, updatedAt: new Date().toISOString() };
}

/* ================================================================== */
/* جمع‌آوری خودکار از محیط                                             */
/* ================================================================== */

/**
 * جمع‌آوری کامل تله‌متری فعلی از مرورگر و اعمال آن روی مشتری.
 * در محیط آفلاین/تست بخش IP خالی می‌ماند ولی بقیه کار می‌کند.
 */
export async function collectTelemetry(customer, options = {}) {
  const { signal = null, withIp = true } = options;

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';

  let ipInfo = { ip: '', city: '', country: '', region: '', lat: '', lng: '' };
  if (withIp) ipInfo = await fetchIpInfo({ signal });

  let next = recordLogin(customer, {
    userAgent,
    ip: ipInfo.ip,
    city: ipInfo.city,
    country: ipInfo.country,
  });

  // اگر مشتری موقعیت نداشت و IP موقعیت داد، پیشنهادی ذخیره کن
  if ((!next.lat || !next.lng) && ipInfo.lat && ipInfo.lng) {
    next = { ...next, lat: ipInfo.lat, lng: ipInfo.lng, locationSource: 'ip' };
  }

  return { customer: next, device: detectDevice(userAgent), ipInfo };
}

/** خلاصهٔ تله‌متری برای نمایش در پروفایل */
export function getTelemetrySummary(customer) {
  const source = normalizeCustomer(customer || {});
  const devices = Array.isArray(source.devices) ? source.devices : [];
  const sessions = Array.isArray(source.sessions) ? source.sessions : [];

  const onlineMinutes = Math.round(Number(source.onlineSeconds || 0) / 60);

  return {
    loginCount: Number(source.loginCount || 0),
    deviceCount: devices.length,
    primaryDevice: devices[0]?.label || source.lastLoginDevice || 'نامشخص',
    lastLoginAt: source.lastLoginAt || '',
    lastLoginCity: source.lastLoginCity || '',
    lastLoginIp: source.lastLoginIp || '',
    firstLoginAt: source.firstLoginAt || '',
    pageViewCount: Number(source.pageViewCount || 0),
    onlineMinutes,
    sessionCount: sessions.length,
    lastSeenAt: source.lastSeenAt || '',
  };
}
