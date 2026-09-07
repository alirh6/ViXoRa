// src/core/services/reminder-service.js

/**
 * ViXoRa Reminder Engine
 * ==================================================================
 * یادآور = زمان‌بندی + کانال‌های ارسال
 *
 * کانال‌ها:
 *   inapp    → مرکز اعلان‌ها (NotificationCenter) + Toast
 *   desktop  → اعلان سیستم‌عامل (Notification API)
 *   sound    → بیپ با WebAudio
 *   sms      → ارسال پیامک (فعلاً با گوشی خود کاربر از طریق sms:/WhatsApp/
 *              Telegram، بعداً با اتصال به پنل پیامکی از طریق webhook)
 *
 * ⚠️ پروژه بک‌اند ندارد، پس همه‌چیز در LocalStorage و مرورگر انجام می‌شود.
 * برای پیامک واقعی فقط کافی است `provider: 'webhook'` را با آدرس پنل
 * پیامکی خودت تنظیم کنی — هیچ کد دیگری لازم نیست تغییر کند.
 */

import {
  pushNotification,
  showDesktopNotification,
  playNotificationSound,
  getNotificationSettings,
  isInQuietHours,
} from './notification-service.js';

import { createLocalStorageAdapter } from '../../utilities/storage.js';
import { toast } from '../../utilities/toast.js';
import { openExternal } from '../../utilities/dom-utils.js';

const storage = createLocalStorageAdapter();

const SETTINGS_KEY = 'ViXoRa:reminder-settings';
const QUEUE_KEY = 'ViXoRa:sms-queue';

const DEFAULT_SETTINGS = {
  /** link | whatsapp | telegram | email | webhook */
  provider: 'link',
  /** شمارهٔ موبایل خودت برای دریافت پیامک (مثلاً 09397988728) */
  phoneNumber: '',
  /** پیش‌شمارهٔ کشور برای لینک‌های بین‌المللی */
  countryCode: '98',
  /** آدرس پنل پیامکی (فقط برای provider = webhook) */
  webhookUrl: '',
  webhookApiKey: '',
  /** متن پیش‌فرض پیامک */
  messageTemplate: 'یادآوری ViXoRa: {title}\n{message}\nزمان: {time}',
  /** آیا پیامک خودکار ارسال شود یا فقط در صف آماده شود */
  autoSendSms: false,
  /** فاصلهٔ بررسی (میلی‌ثانیه) */
  tickIntervalMs: 30_000,
};

/* ------------------------------------------------------------------ */
/* تنظیمات                                                             */
/* ------------------------------------------------------------------ */

export function getReminderSettings() {
  return { ...DEFAULT_SETTINGS, ...(storage.get(SETTINGS_KEY, {}) || {}) };
}

export function updateReminderSettings(patch = {}) {
  const next = { ...getReminderSettings(), ...patch };
  storage.set(SETTINGS_KEY, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* ابزارهای زمان                                                       */
/* ------------------------------------------------------------------ */

const REPEAT_UNITS = {
  none: 0,
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export function addInterval(isoDate, repeat) {
  const base = new Date(isoDate);
  if (Number.isNaN(base.getTime())) return null;

  const step = REPEAT_UNITS[repeat] || 0;
  if (step === 0) return null;

  return new Date(base.getTime() + step).toISOString();
}

export function addMinutes(isoDate, minutes) {
  const base = new Date(isoDate);
  if (Number.isNaN(base.getTime())) return null;

  return new Date(base.getTime() + Number(minutes || 0) * 60 * 1000).toISOString();
}

function toE164(phoneNumber, countryCode = '98') {
  const digits = String(phoneNumber || '').replace(/\D/g, '');

  if (!digits) return '';
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith('0')) return `${countryCode}${digits.slice(1)}`;

  return digits;
}

/* ------------------------------------------------------------------ */
/* ساخت پیام و لینک پیامک                                              */
/* ------------------------------------------------------------------ */

export function buildReminderText(reminder, { template = null } = {}) {
  const settings = getReminderSettings();

  const values = {
    title: reminder.title || 'یادآوری',
    message: reminder.message || '',
    time: reminder.at ? formatReminderTime(reminder.at) : '',
  };

  const pattern = template || settings.messageTemplate || DEFAULT_SETTINGS.messageTemplate;

  return String(pattern)
    .replace(/\{title\}/g, values.title)
    .replace(/\{message\}/g, values.message)
    .replace(/\{time\}/g, values.time)
    .trim();
}

export function formatReminderTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/**
 * ساخت لینک ارسال پیامک/پیام با گوشی خود کاربر.
 * @returns {string|null}
 */
export function buildSmsLink(reminder, options = {}) {
  const settings = { ...getReminderSettings(), ...options };
  const text = buildReminderText(reminder, { template: options.template });
  const encoded = encodeURIComponent(text);

  switch (settings.provider) {
    case 'whatsapp': {
      const phone = toE164(settings.phoneNumber, settings.countryCode);
      return phone ? `https://wa.me/${phone}?text=${encoded}` : null;
    }

    case 'telegram': {
      return `https://t.me/share/url?url=${encodeURIComponent('ViXoRa')}&text=${encoded}`;
    }

    case 'email': {
      const subject = encodeURIComponent(reminder.title || 'یادآوری ViXoRa');
      return `mailto:?subject=${subject}&body=${encoded}`;
    }

    case 'link':
    default: {
      const phone = String(settings.phoneNumber || '').replace(/\D/g, '');
      // iOS: sms:number&body=  |  Android: sms:number?body=
      const separator = /iphone|ipad|ipod/i.test(navigator?.userAgent || '') ? '&' : '?';
      return `sms:${phone}${phone ? separator : ''}body=${encoded}`;
    }
  }
}

/* ------------------------------------------------------------------ */
/* صف پیامک                                                            */
/* ------------------------------------------------------------------ */

export function getSmsQueue() {
  const queue = storage.get(QUEUE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

export function enqueueSms(entry) {
  const record = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending', // pending | sent | failed | delivered
    createdAt: new Date().toISOString(),
    sentAt: '',
    error: '',
    ...entry,
  };

  storage.set(QUEUE_KEY, [record, ...getSmsQueue()].slice(0, 100));

  return record;
}

export function updateSmsEntry(smsId, patch) {
  const next = getSmsQueue().map((item) =>
    String(item.id) === String(smsId) ? { ...item, ...patch } : item
  );

  storage.set(QUEUE_KEY, next);

  return next.find((item) => String(item.id) === String(smsId)) || null;
}

export function clearSmsQueue({ onlySent = false } = {}) {
  const next = onlySent
    ? getSmsQueue().filter((item) => item.status === 'pending' || item.status === 'failed')
    : [];

  storage.set(QUEUE_KEY, next);

  return next;
}

/**
 * ارسال پیامک از طریق پنل پیامکی (webhook).
 * اگر webhook تنظیم نشده باشد، پیام در صف می‌ماند تا کاربر دستی بفرستد.
 */
export async function sendSmsNow(reminder, options = {}) {
  const settings = { ...getReminderSettings(), ...options };

  const text = buildReminderText(reminder, { template: options.template });
  const link = buildSmsLink(reminder, options);

  if (settings.provider !== 'webhook') {
    const queued = enqueueSms({
      provider: settings.provider,
      to: settings.phoneNumber,
      text,
      link,
      reminderId: reminder.id || '',
      noteId: reminder.noteId || '',
    });

    return { delivered: false, queued: true, record: queued, link };
  }

  const queued = enqueueSms({
    provider: 'webhook',
    to: settings.phoneNumber,
    text,
    link: settings.webhookUrl,
    reminderId: reminder.id || '',
    noteId: reminder.noteId || '',
  });

  try {
    const response = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.webhookApiKey ? { Authorization: `Bearer ${settings.webhookApiKey}` } : {}),
      },
      body: JSON.stringify({
        to: settings.phoneNumber,
        message: text,
        reminderId: reminder.id || '',
        noteId: reminder.noteId || '',
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    updateSmsEntry(queued.id, { status: 'sent', sentAt: new Date().toISOString() });

    return { delivered: true, queued: false, record: queued, link };
  } catch (error) {
    updateSmsEntry(queued.id, {
      status: 'failed',
      error: error?.message || 'ارسال ناموفق بود',
    });

    return { delivered: false, queued: true, record: queued, link, error: error?.message };
  }
}

/* ------------------------------------------------------------------ */
/* ارزیابی سررسید                                                      */
/* ------------------------------------------------------------------ */

export function isReminderDue(reminder, now = Date.now()) {
  if (!reminder || reminder.enabled === false) return false;

  const fireAt = reminder.nextAt || reminder.at;
  if (!fireAt) return false;

  const time = new Date(fireAt).getTime();
  if (Number.isNaN(time)) return false;

  if (time > now) return false;

  // جلوی تکرار بی‌پایان: اگر قبلاً در همین لحظه فایر شده، دیگر فایر نکن
  if (reminder.lastFiredAt) {
    const lastFired = new Date(reminder.lastFiredAt).getTime();
    if (Number.isFinite(lastFired) && now - lastFired < 60_000) return false;
  }

  return true;
}

/**
 * محاسبهٔ وضعیت بعدی یادآور بعد از فایر شدن
 */
export function advanceReminder(reminder, now = new Date()) {
  const firedAt = now.toISOString();

  // تاریخچهٔ شلیک‌ها (حداکثر ۳۰ مورد آخر) تا کاربر بداند چه زمانی ارسال شده
  const history = [
    { at: firedAt, title: reminder.title || '', message: reminder.message || '' },
    ...(Array.isArray(reminder.history) ? reminder.history : []),
  ].slice(0, 30);

  if (reminder.repeat && reminder.repeat !== 'none') {
    const nextAt = addInterval(reminder.nextAt || reminder.at, reminder.repeat);

    return {
      ...reminder,
      history,
      lastFiredAt: firedAt,
      nextAt: nextAt || '',
      enabled: Boolean(nextAt),
    };
  }

  return {
    ...reminder,
    history,
    lastFiredAt: firedAt,
    nextAt: '',
    enabled: false,
  };
}

/* ------------------------------------------------------------------ */
/* ارسال                                                               */
/* ------------------------------------------------------------------ */

/**
 * اجرای همهٔ کانال‌های یک یادآور.
 * @returns {Promise<Object>} خلاصهٔ کارهایی که انجام شد
 */
export async function dispatchReminder(reminder, options = {}) {
  const { noteTitle = '', noteId = null, silent = false, openSms = false } = options;

  const settings = getReminderSettings();
  const notifSettings = getNotificationSettings();

  const channels = Array.isArray(reminder.channels) && reminder.channels.length
    ? reminder.channels
    : ['inapp'];

  const text = buildReminderText(reminder);
  const title = reminder.title || noteTitle || 'یادآوری ViXoRa';
  const quiet = isInQuietHours();

  const result = {
    inapp: false,
    desktop: false,
    sound: false,
    sms: null,
    quietHours: quiet,
  };

  // ۱) مرکز اعلان‌ها — همیشه فعال است
  const smsLink = channels.includes('sms') ? buildSmsLink({ ...reminder, noteId }) : null;

  if (channels.includes('inapp') || channels.length === 0) {
    pushNotification({
      title,
      body: reminder.message || noteTitle,
      type: 'reminder',
      noteId: noteId || reminder.noteId || null,
      reminderId: reminder.id || null,
      link: noteId ? `/tools/note?focus=${encodeURIComponent(noteId)}` : null,
      actions: smsLink
        ? [{ id: 'send-sms', label: 'ارسال پیامک', url: smsLink }]
        : [],
    });

    result.inapp = true;
  }

  // ۲) Toast
  if (!silent) {
    toast.show(`${title}${reminder.message ? ` — ${reminder.message}` : ''}`, {
      title: 'یادآوری',
      duration: 8000,
      action: smsLink
        ? {
            label: 'پیامک',
            onClick: () => openExternal(smsLink),
          }
        : null,
    });
  }

  // ۳) اعلان دسکتاپ
  if (channels.includes('desktop') && notifSettings.desktopEnabled && !quiet) {
    result.desktop = showDesktopNotification({
      title,
      body: reminder.message || noteTitle,
      tag: reminder.id || undefined,
    });
  }

  // ۴) صدا
  if (channels.includes('sound') && notifSettings.soundEnabled && !quiet) {
    result.sound = playNotificationSound(reminder.priority === 'urgent' ? 'urgent' : 'default');
  }

  // ۵) پیامک
  if (channels.includes('sms') && notifSettings.smsEnabled) {
    const smsResult = await sendSmsNow({ ...reminder, noteId });

    result.sms = smsResult;

    // اگر provider از نوع لینک باشد و کاربر اجازهٔ باز شدن خودکار داده باشد
    if (openSms && smsResult.link && settings.autoSendSms && settings.provider !== 'webhook') {
      openExternal(smsResult.link);
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* موتور زمان‌بندی                                                     */
/* ------------------------------------------------------------------ */

/**
 * یک دور بررسی.
 * @param {Function} getNotes تابعی که لیست یادداشت‌ها را می‌دهد
 * @param {Function} persistNote تابعی که یادداشت به‌روزشده را ذخیره می‌کند
 */
export async function tickReminders(getNotes, persistNote, options = {}) {
  if (typeof getNotes !== 'function' || typeof persistNote !== 'function') {
    throw new TypeError('[ReminderService] getNotes and persistNote are required.');
  }

  const now = new Date();
  const fired = [];

  const notes = (await getNotes()) || [];

  for (const note of notes) {
    if (!Array.isArray(note.reminders) || note.reminders.length === 0) continue;
    if (note.trashed) continue;

    let changed = false;
    let nextReminders = note.reminders;

    for (const reminder of note.reminders) {
      if (!isReminderDue(reminder, now.getTime())) continue;

      await dispatchReminder(reminder, {
        noteTitle: note.title,
        noteId: note.id,
        ...options,
      });

      const advanced = advanceReminder(reminder, now);

      nextReminders = nextReminders.map((item) =>
        item.id === reminder.id ? advanced : item
      );

      changed = true;

      fired.push({
        reminderId: reminder.id,
        noteId: note.id,
        noteTitle: note.title,
        firedAt: now.toISOString(),
      });
    }

    if (changed) {
      await persistNote({ ...note, reminders: nextReminders });
    }
  }

  return fired;
}

let tickTimer = null;
let stopHandle = null;

/**
 * راه‌اندازی موتور زمان‌بندی سراسری.
 * @returns {Function} تابع توقف
 */
export function startReminderScheduler(getNotes, persistNote, options = {}) {
  stopReminderScheduler();

  const settings = getReminderSettings();
  const interval = Math.max(5_000, Number(settings.tickIntervalMs) || 30_000);

  const run = () => {
    tickReminders(getNotes, persistNote, options).catch((error) => {
      console.error('[ReminderService] tick failed:', error);
    });
  };

  run();
  tickTimer = globalThis.setInterval(run, interval);

  const onVisibility = () => {
    if (document.visibilityState === 'visible') run();
  };

  document.addEventListener('visibilitychange', onVisibility);

  stopHandle = () => {
    if (tickTimer) globalThis.clearInterval(tickTimer);
    tickTimer = null;

    document.removeEventListener('visibilitychange', onVisibility);
    stopHandle = null;
  };

  return stopHandle;
}

export function stopReminderScheduler() {
  if (typeof stopHandle === 'function') stopHandle();
}

export function isSchedulerRunning() {
  return tickTimer !== null;
}

/* ------------------------------------------------------------------ */
/* کوئری‌های کمکی                                                      */
/* ------------------------------------------------------------------ */

export function collectReminders(notes, { includeDisabled = false } = {}) {
  const list = [];

  for (const note of Array.isArray(notes) ? notes : []) {
    for (const reminder of Array.isArray(note.reminders) ? note.reminders : []) {
      if (!includeDisabled && reminder.enabled === false) continue;

      list.push({ ...reminder, noteId: note.id, noteTitle: note.title });
    }
  }

  return list.sort((a, b) => {
    const first = new Date(a.nextAt || a.at || 0).getTime();
    const second = new Date(b.nextAt || b.at || 0).getTime();
    return first - second;
  });
}

export function getUpcomingReminders(notes, limit = 5) {
  const now = Date.now();

  return collectReminders(notes)
    .filter((reminder) => {
      const time = new Date(reminder.nextAt || reminder.at || 0).getTime();
      return Number.isFinite(time) && time >= now;
    })
    .slice(0, limit);
}
