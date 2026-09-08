// src/core/services/location-service.js

/**
 * ViXoRa — سرویس موقعیت و نقشه
 * =============================
 * • انتخاب نقطه روی نقشه (OpenStreetMap از طریق iframe)
 * • تبدیل «آدرس → مختصات» (geocode) با Nominatim
 * • تبدیل «مختصات → آدرس» (reverse geocode) با Nominatim
 * • fallback آفلاین: تصویر ایستا از maps.google.com و ویرایش دستی lat/lng
 *
 * همهٔ توابع خالص/بدون DOM هستند (جز آن‌ها که صریحاً element می‌گیرند) و
 * در محیط آفلاین/تست بدون crash مقدار خالی برمی‌گردانند.
 */

import { normalizeCustomer, toLatinDigits } from '../schemas/customer-schema.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ViXoRa-CRM/1.0';

/* ================================================================== */
/* اعتبارسنجی مختصات                                                   */
/* ================================================================== */

export function isValidLat(value) {
  const num = Number(toLatinDigits(String(value ?? '')).trim());
  return Number.isFinite(num) && num >= -90 && num <= 90;
}

export function isValidLng(value) {
  const num = Number(toLatinDigits(String(value ?? '')).trim());
  return Number.isFinite(num) && num >= -180 && num <= 180;
}

export function isValidCoordinate(lat, lng) {
  return isValidLat(lat) && isValidLng(lng);
}

export function toCoordinateNumber(value) {
  const num = Number(toLatinDigits(String(value ?? '')).trim());
  return Number.isFinite(num) ? num : null;
}

/* ================================================================== */
/* Geocode: آدرس → مختصات                                              */
/* ================================================================== */

/**
 * @param {string} query آدرس/شهر
 * @returns {Promise<Array<{lat:string,lng:string,displayName:string,type:string}>>}
 */
export async function geocode(query, { signal = null, limit = 5 } = {}) {
  const text = String(query || '').trim();
  if (!text || typeof fetch !== 'function') return [];

  try {
    const url = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, { signal, headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item && item.lat !== undefined && item.lon !== undefined)
      .map((item) => ({
        lat: String(item.lat),
        lng: String(item.lon),
        displayName: String(item.display_name || ''),
        type: String(item.type || item.class || ''),
      }));
  } catch {
    return [];
  }
}

/* ================================================================== */
/* Reverse geocode: مختصات → آدرس                                      */
/* ================================================================== */

/**
 * @returns {Promise<{address:string, city:string, province:string, country:string, postalCode:string, houseNumber:string, road:string}|null>}
 */
export async function reverseGeocode(lat, lng, { signal = null } = {}) {
  if (!isValidCoordinate(lat, lng) || typeof fetch !== 'function') return null;

  try {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;

    const response = await fetch(url, { signal, headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || typeof data !== 'object') return null;

    const addr = data.address && typeof data.address === 'object' ? data.address : {};

    return {
      address: String(data.display_name || '').trim(),
      road: String(addr.road || addr.pedestrian || addr.street || '').trim(),
      houseNumber: String(addr.house_number || '').trim(),
      city: String(addr.city || addr.town || addr.village || addr.municipality || '').trim(),
      province: String(addr.state || addr.province || addr.region || '').trim(),
      country: String(addr.country || '').trim(),
      postalCode: String(addr.postcode || '').trim(),
    };
  } catch {
    return null;
  }
}

/* ================================================================== */
/* ساخت آدرس از نتیجهٔ reverse geocode                                 */
/* ================================================================== */

/** ترکیب اجزای آدرس به یک خط تمیز (بدون تکرار) */
export function formatAddressParts(parts = {}) {
  const order = [parts.houseNumber && parts.road ? `${parts.road}، پلاک ${parts.houseNumber}` : parts.road, parts.city, parts.province, parts.country];

  const seen = new Set();
  const clean = [];

  for (const part of order) {
    const value = String(part || '').trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    clean.push(value);
  }

  return clean.join('، ');
}

/* ================================================================== */
/* لینک‌ها و URLهای نقشه                                               */
/* ================================================================== */

/** iframe نقشهٔ OpenStreetMap برای نمایش یک نقطه */
export function buildOsmEmbedUrl(lat, lng, { zoom = 16 } = {}) {
  if (!isValidCoordinate(lat, lng)) return '';

  const d = 0.01;
  const bbox = `${Number(lng) - d},${Number(lat) - d},${Number(lng) + d},${Number(lat) + d}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

/** تصویر ایستا (fallback آفلاین/سبک) */
export function buildStaticMapUrl(lat, lng, { zoom = 16, width = 640, height = 360 } = {}) {
  if (!isValidCoordinate(lat, lng)) return '';

  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

/** لینک بازکردن نقشه در تب جدید (Google Maps) */
export function buildExternalMapUrl(lat, lng) {
  if (!isValidCoordinate(lat, lng)) return '';

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** لینک OpenStreetMap */
export function buildOsmUrl(lat, lng) {
  if (!isValidCoordinate(lat, lng)) return '';

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

/* ================================================================== */
/* فاصلهٔ دو نقطه (Haversine) — برای «نزدیک‌ترین مشتریان»               */
/* ================================================================== */

export function distanceKm(lat1, lng1, lat2, lng2) {
  const a1 = toCoordinateNumber(lat1);
  const o1 = toCoordinateNumber(lng1);
  const a2 = toCoordinateNumber(lat2);
  const o2 = toCoordinateNumber(lng2);

  if (a1 === null || o1 === null || a2 === null || o2 === null) return null;

  const R = 6371;
  const dLat = ((a2 - a1) * Math.PI) / 180;
  const dLng = ((o2 - o1) * Math.PI) / 180;

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a1 * Math.PI) / 180) * Math.cos((a2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 100) / 100;
}

/** مرتب‌سازی مشتریان بر اساس نزدیکی به یک نقطه */
export function sortCustomersByDistance(customers, lat, lng) {
  const list = Array.isArray(customers) ? customers : [];

  return list
    .map((customer) => ({
      customer,
      distance: isValidCoordinate(customer?.lat, customer?.lng) ? distanceKm(lat, lng, customer.lat, customer.lng) : null,
    }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

/* ================================================================== */
/* گرفتن موقعیت فعلی کاربر از مرورگر                                  */
/* ================================================================== */

/**
 * موقعیت جغرافیایی مرورگر (با اجازهٔ کاربر).
 * @returns {Promise<{lat:string,lng:string,accuracy:number}|null>}
 */
export function getCurrentPosition({ timeoutMs = 10_000 } = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    const timer = setTimeout(() => resolve(null), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        resolve({
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
          accuracy: Number(position.coords.accuracy || 0),
        });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

/* ================================================================== */
/* اعمال موقعیت روی مشتری                                              */
/* ================================================================== */

/**
 * ست‌کردن مختصات + (اختیاری) آدرس روی مشتری.
 * @param {Object} customer
 * @param {Object} location {lat, lng, address?, city?, province?, country?, postalCode?, source?}
 */
export function applyLocation(customer, location = {}) {
  const source = normalizeCustomer(customer || {});

  const patch = {
    updatedAt: new Date().toISOString(),
    locationSource: location.source || 'manual',
  };

  if (isValidCoordinate(location.lat, location.lng)) {
    patch.lat = String(location.lat);
    patch.lng = String(location.lng);
  }

  if (location.address !== undefined) patch.address = String(location.address);
  if (location.city !== undefined && location.city !== '') patch.city = String(location.city);
  if (location.province !== undefined && location.province !== '') patch.province = String(location.province);
  if (location.country !== undefined && location.country !== '') patch.country = String(location.country);
  if (location.postalCode !== undefined && location.postalCode !== '') patch.postalCode = String(location.postalCode);

  return { ...source, ...patch };
}

/** خلاصهٔ موقعیت برای نمایش */
export function getLocationSummary(customer) {
  const source = normalizeCustomer(customer || {});
  const hasCoord = isValidCoordinate(source.lat, source.lng);

  return {
    hasCoordinate: hasCoord,
    lat: source.lat,
    lng: source.lng,
    address: source.address || '',
    city: source.city || '',
    province: source.province || '',
    country: source.country || '',
    postalCode: source.postalCode || '',
    source: source.locationSource || '',
    mapUrl: hasCoord ? buildExternalMapUrl(source.lat, source.lng) : '',
    embedUrl: hasCoord ? buildOsmEmbedUrl(source.lat, source.lng) : '',
  };
}
