// src/core/services/notification-service.js

/**
 * ViXoRa Notification Center
 * ------------------------------------------------------------------
 * مرکز اعلان‌های درون‌برنامه‌ای. همه در LocalStorage ذخیره می‌شوند تا
 * بعد از رفرش هم باقی بمانند و لایوت ابزار بتواند آن‌ها را نشان دهد.
 *
 * کلید: ViXoRa:notifications
 */

import { createLocalStorageAdapter } from '../../utilities/storage.js';
import { STORAGE_KEYS } from '../../config/app-config.js';

const storage = createLocalStorageAdapter();

const NOTIFICATIONS_KEY = 'ViXoRa:notifications';
const SETTINGS_KEY = 'ViXoRa:notification-settings';
const MAX_ITEMS = 80;

const listeners = new Set();

/* ------------------------------------------------------------------ */
/* تنظیمات                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  desktopEnabled: true,
  smsEnabled: false,
  quietHoursEnabled: false,
  quietFrom: '23:00',
  quietTo: '07:00',
};

export function getNotificationSettings() {
  return { ...DEFAULT_SETTINGS, ...(storage.get(SETTINGS_KEY, {}) || {}) };
}

export function updateNotificationSettings(patch = {}) {
  const next = { ...getNotificationSettings(), ...patch };
  storage.set(SETTINGS_KEY, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* داده                                                                */
/* ------------------------------------------------------------------ */

function emit() {
  const snapshot = getNotifications();

  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('[NotificationCenter] listener failed:', error);
    }
  }
}

export function getNotifications() {
  const list = storage.get(NOTIFICATIONS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function getUnreadCount() {
  return getNotifications().filter((item) => !item.read).length;
}

export function subscribeNotifications(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('[NotificationCenter] listener must be a function.');
  }

  listeners.add(listener);

  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------------ */
/* عملیات                                                              */
/* ------------------------------------------------------------------ */

export function pushNotification({
  title,
  body = '',
  type = 'info',
  noteId = null,
  reminderId = null,
  link = null,
  actions = [],
} = {}) {
  if (!title) {
    throw new TypeError('[NotificationCenter] title is required.');
  }

  const notification = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(title),
    body: String(body || ''),
    type: ['info', 'success', 'warning', 'error', 'reminder'].includes(type) ? type : 'info',
    noteId,
    reminderId,
    link,
    actions: Array.isArray(actions) ? actions : [],
    createdAt: new Date().toISOString(),
    read: false,
  };

  const next = [notification, ...getNotifications()].slice(0, MAX_ITEMS);
  storage.set(NOTIFICATIONS_KEY, next);
  emit();

  return notification;
}

export function markNotificationRead(notificationId) {
  const next = getNotifications().map((item) =>
    String(item.id) === String(notificationId) ? { ...item, read: true } : item
  );

  storage.set(NOTIFICATIONS_KEY, next);
  emit();

  return true;
}

export function markAllNotificationsRead() {
  storage.set(
    NOTIFICATIONS_KEY,
    getNotifications().map((item) => ({ ...item, read: true }))
  );
  emit();

  return true;
}

export function removeNotification(notificationId) {
  storage.set(
    NOTIFICATIONS_KEY,
    getNotifications().filter((item) => String(item.id) !== String(notificationId))
  );
  emit();

  return true;
}

export function clearNotifications() {
  storage.set(NOTIFICATIONS_KEY, []);
  emit();

  return true;
}

/* ------------------------------------------------------------------ */
/* ساعت سکوت                                                           */
/* ------------------------------------------------------------------ */

function toMinutes(hhmm) {
  const [hours, minutes] = String(hhmm || '00:00').split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function isInQuietHours(date = new Date()) {
  const settings = getNotificationSettings();

  if (!settings.quietHoursEnabled) return false;

  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const from = toMinutes(settings.quietFrom);
  const to = toMinutes(settings.quietTo);

  if (from === to) return false;

  // بازهٔ شبانه (مثلاً 23:00 تا 07:00)
  if (from > to) {
    return nowMinutes >= from || nowMinutes < to;
  }

  return nowMinutes >= from && nowMinutes < to;
}

/* ------------------------------------------------------------------ */
/* اعلان دسکتاپ + صدا                                                  */
/* ------------------------------------------------------------------ */

export async function requestDesktopPermission() {
  if (typeof Notification === 'undefined') {
    return { supported: false, granted: false };
  }

  if (Notification.permission === 'granted') {
    return { supported: true, granted: true };
  }

  if (Notification.permission === 'denied') {
    return { supported: true, granted: false };
  }

  try {
    const result = await Notification.requestPermission();
    return { supported: true, granted: result === 'granted' };
  } catch {
    return { supported: true, granted: false };
  }
}

export function showDesktopNotification({ title, body, tag, icon } = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(String(title || 'ViXoRa'), {
      body: String(body || ''),
      tag: tag || undefined,
      icon: icon || undefined,
      dir: 'rtl',
      lang: 'fa',
    });

    notification.onclick = () => {
      globalThis.focus?.();
      notification.close();
    };

    return true;
  } catch (error) {
    console.warn('[NotificationCenter] Desktop notification failed:', error);
    return false;
  }
}

let audioContext = null;

/** بیپ کوتاه با WebAudio — بدون فایل صوتی */
export function playNotificationSound(kind = 'default') {
  try {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return false;

    if (!audioContext) audioContext = new AudioContextClass();

    if (audioContext.state === 'suspended') audioContext.resume();

    const now = audioContext.currentTime;

    const frequencies =
      kind === 'urgent' ? [880, 1174, 1568] : kind === 'success' ? [659, 988] : [784, 1046];

    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      const startAt = now + index * 0.11;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + 0.18);
    });

    return true;
  } catch (error) {
    console.warn('[NotificationCenter] Sound failed:', error);
    return false;
  }
}
