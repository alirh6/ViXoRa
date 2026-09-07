// src/core/services/attachment-service.js

/**
 * ViXoRa Attachment Service — ضمیمهٔ فایل/عکس/صوت/متن
 * ==================================================================
 * ذخیره‌سازی: LocalStorage به‌صورت Data URL (بدون بک‌اند، بدون سرور).
 *
 * نکات:
 *  - حداکثر اندازهٔ هر فایل قابل تنظیم است (پیش‌فرض ۳ مگابایت)
 *  - برای عکس‌ها بندانگشتی فشرده ساخته می‌شود تا حافظه هدر نرود
 *  - پر شدن سهمیه (QuotaExceededError) به‌صورت پیام فارسی به کاربر گزارش می‌شود
 */

import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();

const SETTINGS_KEY = 'ViXoRa:attachment-settings';

const DEFAULT_SETTINGS = {
  maxFileSizeBytes: 3 * 1024 * 1024, // 3MB
  thumbnailMaxWidth: 200,
  allowedMimePrefixes: ['image/', 'audio/', 'video/', 'text/', 'application/pdf', 'application/json'],
};

/* ------------------------------------------------------------------ */
/* تنظیمات و ابزارها                                                   */
/* ------------------------------------------------------------------ */

export function getAttachmentSettings() {
  return { ...DEFAULT_SETTINGS, ...(storage.get(SETTINGS_KEY, {}) || {}) };
}

export function updateAttachmentSettings(patch = {}) {
  const next = { ...getAttachmentSettings(), ...patch };
  storage.set(SETTINGS_KEY, next);
  return next;
}

export function storageKeyFor(noteId) {
  return `ViXoRa:attachments:${noteId}`;
}

function createAttachmentId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `att-${crypto.randomUUID()}`
    : `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function detectKind(mimeType = '', fileName = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('text/') || /\.(txt|md|json|csv)$/i.test(fileName)) return 'text';
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)) return 'pdf';
  return 'file';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('خواندن فایل ناموفق بود.'));

    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('بارگذاری تصویر ناموفق بود.'));

    image.src = dataUrl;
  });
}

/** بندانگشتی فشرده (JPEG) برای عکس‌ها */
async function createThumbnail(dataUrl, maxWidth = 200) {
  try {
    const image = await loadImage(dataUrl);

    if (image.width === 0) return '';

    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return '';

    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.62);
  } catch (error) {
    console.warn('[Attachments] Thumbnail creation failed:', error);
    return '';
  }
}

function isMimeAllowed(mimeType) {
  const { allowedMimePrefixes } = getAttachmentSettings();

  if (!Array.isArray(allowedMimePrefixes) || allowedMimePrefixes.length === 0) return true;

  return allowedMimePrefixes.some((prefix) => String(mimeType || '').startsWith(prefix));
}

/* ------------------------------------------------------------------ */
/* خواندن                                                              */
/* ------------------------------------------------------------------ */

export function listAttachments(noteId) {
  if (!noteId) return [];

  const list = storage.get(storageKeyFor(noteId), []);

  return Array.isArray(list) ? list : [];
}

export function getAttachment(noteId, attachmentId) {
  return (
    listAttachments(noteId).find((item) => String(item.id) === String(attachmentId)) || null
  );
}

export function getAttachmentsForMany(noteIds) {
  const map = {};

  for (const noteId of Array.isArray(noteIds) ? noteIds : []) {
    map[noteId] = listAttachments(noteId);
  }

  return map;
}

/** مصرف حافظهٔ ضمیمه‌ها (به بایت، تقریبی) */
export function getStorageUsage() {
  let totalBytes = 0;
  let count = 0;

  for (let index = 0; index < globalThis.localStorage.length; index += 1) {
    const key = globalThis.localStorage.key(index);
    if (!key || !key.startsWith('ViXoRa:attachments:')) continue;

    const raw = globalThis.localStorage.getItem(key) || '';
    totalBytes += raw.length; // هر کاراکتر ≈ ۱ بایت در UTF-16 → تقریب قابل قبول
    count += 1;
  }

  return { totalBytes, noteCount: count };
}

/* ------------------------------------------------------------------ */
/* نوشتن                                                               */
/* ------------------------------------------------------------------ */

/**
 * افزودن یک فایل به‌عنوان ضمیمه.
 * @returns {Promise<{ok:boolean, attachment?:Object, message?:string}>}
 */
export async function addAttachmentFromFile(noteId, file, meta = {}) {
  if (!noteId) return { ok: false, message: 'شناسهٔ یادداشت مشخص نیست.' };
  if (!file) return { ok: false, message: 'فایلی انتخاب نشده است.' };

  const settings = getAttachmentSettings();

  if (file.size > settings.maxFileSizeBytes) {
    const limitMb = Math.round(settings.maxFileSizeBytes / (1024 * 1024));
    return {
      ok: false,
      message: `حجم فایل بیشتر از حد مجاز (${limitMb} مگابایت) است.`,
    };
  }

  if (!isMimeAllowed(file.type)) {
    return { ok: false, message: 'نوع این فایل مجاز نیست.' };
  }

  const dataUrl = await readFileAsDataUrl(file);
  const kind = detectKind(file.type, file.name);

  const thumbnail = kind === 'image' ? await createThumbnail(dataUrl, settings.thumbnailMaxWidth) : '';

  return saveAttachmentData(noteId, {
    name: file.name || 'فایل بی‌نام',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    kind,
    dataUrl,
    thumbnail,
    ...meta,
  });
}

/** افزودن متن/لینک/دادهٔ آماده به‌عنوان ضمیمه */
export function saveAttachmentData(noteId, data = {}) {
  if (!noteId) return { ok: false, message: 'شناسهٔ یادداشت مشخص نیست.' };

  const attachment = {
    id: createAttachmentId(),
    noteId,
    name: String(data.name || 'ضمیمه'),
    mimeType: String(data.mimeType || 'application/octet-stream'),
    size: Number.isFinite(Number(data.size)) ? Number(data.size) : 0,
    kind: detectKind(data.mimeType, data.name),
    dataUrl: String(data.dataUrl || ''),
    thumbnail: String(data.thumbnail || ''),
    caption: String(data.caption || ''),
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  };

  const list = listAttachments(noteId);

  try {
    storage.set(storageKeyFor(noteId), [attachment, ...list]);
  } catch (error) {
    return {
      ok: false,
      message: 'حافظهٔ مرورگر پر شده است. چند ضمیمهٔ قدیمی را حذف کن.',
      error,
    };
  }

  // بررسی عملی سهمیه (برخی مرورگرها بی‌صدا رد می‌کنند)
  const persisted = storage.get(storageKeyFor(noteId), []);

  if (!Array.isArray(persisted) || !persisted.some((item) => item.id === attachment.id)) {
    return {
      ok: false,
      message: 'ذخیرهٔ ضمیمه ناموفق بود — احتمالاً حافظهٔ مرورگر پر شده است.',
    };
  }

  return { ok: true, attachment };
}

export function updateAttachment(noteId, attachmentId, patch = {}) {
  const list = listAttachments(noteId);

  const next = list.map((item) =>
    String(item.id) === String(attachmentId)
      ? { ...item, ...patch, id: item.id, updatedAt: new Date().toISOString() }
      : item
  );

  const exists = next.some((item) => String(item.id) === String(attachmentId));
  if (!exists) return { ok: false, message: 'ضمیمه پیدا نشد.' };

  storage.set(storageKeyFor(noteId), next);

  return { ok: true, attachment: next.find((item) => String(item.id) === String(attachmentId)) };
}

export function removeAttachment(noteId, attachmentId) {
  const list = listAttachments(noteId);
  const next = list.filter((item) => String(item.id) !== String(attachmentId));

  if (next.length === list.length) return { ok: false, message: 'ضمیمه پیدا نشد.' };

  storage.set(storageKeyFor(noteId), next);

  return { ok: true };
}

export function removeAllAttachments(noteId) {
  storage.remove(storageKeyFor(noteId));
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* دانلود / بازکردن                                                    */
/* ------------------------------------------------------------------ */

export function downloadAttachment(attachment) {
  if (!attachment?.dataUrl) return false;

  const anchor = document.createElement('a');
  anchor.href = attachment.dataUrl;
  anchor.download = attachment.name || 'attachment';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => anchor.remove(), 200);

  return true;
}

/** آبجکت URL موقت برای پخش صوت/ویدیو (باید revoke شود) */
export function createObjectUrlFor(attachment) {
  if (!attachment?.dataUrl) return null;

  try {
    const [meta, base64] = String(attachment.dataUrl).split(',');
    const mime = /data:([^;]+)/.exec(meta)?.[1] || 'application/octet-stream';

    const binary = globalThis.atob(base64 || '');
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch (error) {
    console.warn('[Attachments] Failed to create object URL:', error);
    return attachment.dataUrl;
  }
}
