// src/core/services/outreach-service.js

/**
 * ViXoRa — سرویس دسترسی/کمپین مشتریان (Outreach & Campaigns)
 * ==========================================================
 * بدون بک‌اند: «ارسال» یعنی
 *   • inapp / push  → pushNotification + نوتیفیکیشن دسکتاپ
 *   • sms / whatsapp / telegram / email → ساخت لینک و صف‌کردن (بدون بازکردن خودکار)
 *   • webhook → درخواست واقعی fetch
 * هر ارسال هم در «لاگ کمپین» و هم در تاریخچهٔ همان مشتری (communications) ثبت می‌شود.
 *
 * کاملاً خالص (بدون DOM) و تست‌پذیر.
 */

import { createId, getCustomerName, normalizeCustomer } from '../schemas/customer-schema.js';
import { createLocalStorageAdapter } from '../../utilities/storage.js';
import { pushNotification } from './notification-service.js';

const storage = createLocalStorageAdapter();

const QUEUE_KEY = 'ViXoRa:outreach-queue';
const CAMPAIGN_KEY = 'ViXoRa:outreach-campaigns';
const TEMPLATE_KEY = 'ViXoRa:outreach-templates';
const SETTINGS_KEY = 'ViXoRa:outreach-settings';

/* ================================================================== */
/* کانال‌ها                                                            */
/* ================================================================== */

export const OUTREACH_CHANNELS = [
  { key: 'inapp', label: 'پیام درون‌برنامه‌ای', icon: '🔔', needsLink: false },
  { key: 'push', label: 'نوتیفیکیشن (پوش)', icon: '📳', needsLink: false },
  { key: 'sms', label: 'پیامک', icon: '💬', needsLink: true },
  { key: 'whatsapp', label: 'واتس‌اپ', icon: '🟢', needsLink: true },
  { key: 'telegram', label: 'تلگرام', icon: '✈️', needsLink: true },
  { key: 'email', label: 'ایمیل', icon: '✉️', needsLink: true },
  { key: 'webhook', label: 'وب‌هوک (API شما)', icon: '🔗', needsLink: false },
];

export const OUTREACH_CHANNEL_MAP = OUTREACH_CHANNELS.reduce((map, channel) => {
  map[channel.key] = channel;
  return map;
}, {});

/* ================================================================== */
/* تنظیمات سرویس                                                       */
/* ================================================================== */

const DEFAULT_SETTINGS = {
  brandName: 'ViXoRa',
  countryCode: '98',
  provider: 'sms', // برای لینک‌ها
  webhookUrl: '',
  webhookApiKey: '',
  throttleMs: 40, // فاصلهٔ بین ارسال‌های گروهی
  maxBulk: 500,
};

export function getOutreachSettings() {
  const saved = storage.get(SETTINGS_KEY, null);
  return { ...DEFAULT_SETTINGS, ...(saved && typeof saved === 'object' ? saved : {}) };
}

export function updateOutreachSettings(patch = {}) {
  const next = { ...getOutreachSettings(), ...patch };
  storage.set(SETTINGS_KEY, next);
  return next;
}

/* ================================================================== */
/* فیلدهای جای‌گذاری (merge fields)                                    */
/* ================================================================== */

export const MERGE_FIELDS = [
  { key: 'name', label: 'نام کامل', get: (c) => getCustomerName(c) },
  { key: 'firstName', label: 'نام', get: (c) => c.firstName || getCustomerName(c) },
  { key: 'lastName', label: 'نام خانوادگی', get: (c) => c.lastName || '' },
  { key: 'mobile', label: 'موبایل', get: (c) => c.mobile || '' },
  { key: 'email', label: 'ایمیل', get: (c) => c.email || '' },
  { key: 'city', label: 'شهر', get: (c) => c.city || '' },
  { key: 'province', label: 'استان', get: (c) => c.province || '' },
  {
    key: 'balance',
    label: 'موجودی',
    get: (c) => Number(c.balance || 0).toLocaleString('fa-IR'),
  },
  {
    key: 'totalSpent',
    label: 'مجموع خرید',
    get: (c) => Number(c.totalSpent || 0).toLocaleString('fa-IR'),
  },
  { key: 'loyaltyTier', label: 'سطح وفاداری', get: (c) => c.loyaltyTier || '' },
  { key: 'loyaltyPoints', label: 'امتیاز وفاداری', get: (c) => String(c.loyaltyPoints || 0) },
  { key: 'company', label: 'شرکت', get: (c) => c.company || '' },
  { key: 'brand', label: 'نام برند شما', get: () => getOutreachSettings().brandName },
];

export const MERGE_FIELD_MAP = MERGE_FIELDS.reduce((map, field) => {
  map[field.key] = field;
  return map;
}, {});

/** جای‌گذاری `{name}` و … در متن با دادهٔ مشتری */
export function applyMergeFields(template, customer) {
  const source = normalizeCustomer(customer || {});

  return String(template ?? '').replace(/\{(\w+)\}/g, (match, key) => {
    const field = MERGE_FIELD_MAP[key];
    if (!field) return match;

    try {
      const value = field.get(source);
      return value === undefined || value === null ? '' : String(value);
    } catch {
      return '';
    }
  });
}

/* ================================================================== */
/* قالب‌های آماده                                                      */
/* ================================================================== */

const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-welcome',
    name: 'خوش‌آمدگویی',
    channel: 'sms',
    body: '{name} عزیز، به {brand} خوش آمدید 🌹 کد تخفیف شما: WELCOME10',
    builtin: true,
  },
  {
    id: 'tpl-birthday',
    name: 'تبریک تولد',
    channel: 'sms',
    body: '{name} جان، تولدت مبارک 🎂 یک هدیهٔ ویژه برایت کنار گذاشتیم.',
    builtin: true,
  },
  {
    id: 'tpl-cart',
    name: 'یادآوری سبد خرید',
    channel: 'whatsapp',
    body: '{name} عزیز، سبد خرید شما در انتظار تکمیل است 🛒 همین حالا نهایی‌اش کنید.',
    builtin: true,
  },
  {
    id: 'tpl-balance',
    name: 'شارژ کیف پول',
    channel: 'inapp',
    body: '{name} عزیز، موجودی کیف پول شما {balance} تومان است.',
    builtin: true,
  },
  {
    id: 'tpl-winback',
    name: 'بازگرداندن مشتری',
    channel: 'sms',
    body: '{name} جان، دلتنگت شدیم! ۲۰٪ تخفیف ویژه برای بازگشت شما 💙',
    builtin: true,
  },
];

export function getOutreachTemplates() {
  const saved = storage.get(TEMPLATE_KEY, []);
  const custom = Array.isArray(saved) ? saved : [];

  return [...custom, ...BUILTIN_TEMPLATES];
}

export function normalizeOutreachTemplate(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  const channel = OUTREACH_CHANNEL_MAP[raw.channel] ? raw.channel : 'sms';

  return {
    id: raw.id || createId('tpl'),
    name: String(raw.name || 'قالب جدید').slice(0, 60),
    channel,
    subject: String(raw.subject || '').slice(0, 120),
    body: String(raw.body || '').slice(0, 1000),
    builtin: Boolean(raw.builtin),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function saveOutreachTemplate(template) {
  const normalized = normalizeOutreachTemplate(template);
  if (!normalized) return null;

  const saved = storage.get(TEMPLATE_KEY, []);
  const list = Array.isArray(saved) ? saved.slice() : [];
  const index = list.findIndex((item) => item.id === normalized.id);

  if (index === -1) list.unshift(normalized);
  else list[index] = { ...list[index], ...normalized, builtin: false };

  storage.set(TEMPLATE_KEY, list);

  return normalized;
}

export function deleteOutreachTemplate(templateId) {
  const saved = storage.get(TEMPLATE_KEY, []);
  const list = (Array.isArray(saved) ? saved : []).filter((item) => item.id !== templateId);
  storage.set(TEMPLATE_KEY, list);
  return list;
}

/* ================================================================== */
/* ساخت لینک بر اساس کانال                                             */
/* ================================================================== */

function toE164(raw, countryCode = '98') {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith('0')) return `${countryCode}${digits.slice(1)}`;

  return `${countryCode}${digits}`;
}

/**
 * لینک ارسال برای یک مشتری در کانال مشخص.
 * @returns {string|null}
 */
export function buildOutreachLink(customer, { channel = 'sms', text = '', subject = '', countryCode = '98' } = {}) {
  const source = normalizeCustomer(customer || {});
  const encoded = encodeURIComponent(text);

  switch (channel) {
    case 'sms': {
      const phone = String(source.mobile || source.phone || '').replace(/\D/g, '');
      if (!phone) return null;
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
      const separator = /iphone|ipad|ipod/i.test(ua) ? '&' : '?';
      return `sms:${phone}${separator}body=${encoded}`;
    }

    case 'whatsapp': {
      const phone = toE164(source.mobile || source.phone, countryCode);
      return phone ? `https://wa.me/${phone}?text=${encoded}` : null;
    }

    case 'telegram': {
      return `https://t.me/share/url?url=${encodeURIComponent('ViXoRa')}&text=${encoded}`;
    }

    case 'email': {
      const to = encodeURIComponent(source.email || '');
      const subjectEncoded = encodeURIComponent(subject || getOutreachSettings().brandName);
      return `mailto:${to}?subject=${subjectEncoded}&body=${encoded}`;
    }

    default:
      return null;
  }
}

/* ================================================================== */
/* صف و لاگ                                                            */
/* ================================================================== */

export function getOutreachQueue() {
  const queue = storage.get(QUEUE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

export function enqueueOutreach(entry) {
  const record = {
    id: createId('msg'),
    status: 'pending', // pending | sent | failed | delivered | scheduled
    createdAt: new Date().toISOString(),
    sentAt: '',
    error: '',
    ...entry,
  };

  storage.set(QUEUE_KEY, [record, ...getOutreachQueue()].slice(0, 500));

  return record;
}

export function updateOutreachEntry(messageId, patch = {}) {
  const queue = getOutreachQueue().map((item) =>
    item.id === messageId ? { ...item, ...patch } : item
  );
  storage.set(QUEUE_KEY, queue);
  return queue.find((item) => item.id === messageId) || null;
}

export function clearOutreachQueue({ onlySent = false } = {}) {
  const queue = onlySent
    ? getOutreachQueue().filter((item) => item.status === 'pending' || item.status === 'scheduled')
    : [];
  storage.set(QUEUE_KEY, queue);
  return queue;
}

export function getCampaignLog() {
  const log = storage.get(CAMPAIGN_KEY, []);
  return Array.isArray(log) ? log : [];
}

export function getCampaign(campaignId) {
  return getCampaignLog().find((campaign) => campaign.id === campaignId) || null;
}

function persistCampaign(campaign) {
  const log = [campaign, ...getCampaignLog().filter((item) => item.id !== campaign.id)].slice(0, 100);
  storage.set(CAMPAIGN_KEY, log);
  return campaign;
}

export function updateCampaign(campaignId, patch = {}) {
  const log = getCampaignLog().map((campaign) =>
    campaign.id === campaignId ? { ...campaign, ...patch } : campaign
  );
  storage.set(CAMPAIGN_KEY, log);
  return log.find((campaign) => campaign.id === campaignId) || null;
}

export function clearCampaignLog() {
  storage.set(CAMPAIGN_KEY, []);
  return [];
}

/* ================================================================== */
/* رکورد ارتباط برای پروفایل مشتری                                     */
/* ================================================================== */

export function buildCommunicationRecord({ channel = 'inapp', text = '', subject = '', status = 'sent', direction = 'outbound', link = '' } = {}) {
  return {
    id: createId('com'),
    channel,
    direction, // outbound | inbound
    subject: String(subject || '').slice(0, 120),
    text: String(text || '').slice(0, 1000),
    status,
    link,
    createdAt: new Date().toISOString(),
  };
}

/** افزودن یک رکورد به تاریخچهٔ مشتری (خالص — مشتری جدید برمی‌گرداند) */
export function appendCommunication(customer, record) {
  const source = normalizeCustomer(customer || {});
  const communications = Array.isArray(source.communications) ? source.communications : [];

  const next = [...communications, record].slice(-100);

  return {
    ...source,
    communications: next,
    lastContactAt: record?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/* ================================================================== */
/* ارسال تکی (شخصی)                                                    */
/* ================================================================== */

/**
 * ارسال یک پیام/نوتیفیکیشن شخصی به یک مشتری.
 * @param {Object} customer
 * @param {Object} options {channel, text, subject, countryCode, persistCustomer}
 * @returns {Promise<{delivered:boolean, queued:boolean, record:Object, link:string|null, customer:Object|null}>}
 */
export async function sendCustomerMessage(customer, options = {}) {
  const source = normalizeCustomer(customer || {});
  const {
    channel = 'inapp',
    text: rawText = '',
    subject: rawSubject = '',
    countryCode = getOutreachSettings().countryCode,
    webhookUrl = getOutreachSettings().webhookUrl,
    webhookApiKey = getOutreachSettings().webhookApiKey,
    persistCustomer = null,
  } = options;

  const text = applyMergeFields(rawText, source);
  const subject = applyMergeFields(rawSubject, source);
  const channelMeta = OUTREACH_CHANNEL_MAP[channel] || OUTREACH_CHANNEL_MAP.inapp;

  // نوتیفیکیشن درون‌برنامه‌ای / پوش
  if (channel === 'inapp' || channel === 'push') {
    const record = buildCommunicationRecord({ channel, text, subject, status: 'sent' });

    pushNotification({
      title: subject || `پیام به ${getCustomerName(source)}`,
      body: text,
      type: 'info',
    });

    const nextCustomer = appendCommunication(source, record);
    if (typeof persistCustomer === 'function') {
      await persistCustomer(nextCustomer);
    }

    return { delivered: true, queued: false, record, link: null, customer: nextCustomer };
  }

  const link = buildOutreachLink(source, { channel, text, subject, countryCode });

  // وب‌هوک: ارسال واقعی
  if (channel === 'webhook') {
    const url = webhookUrl;
    if (!url) {
      const record = buildCommunicationRecord({ channel, text, subject, status: 'failed' });
      const nextCustomer = appendCommunication(source, record);
      if (typeof persistCustomer === 'function') await persistCustomer(nextCustomer);

      return { delivered: false, queued: false, record, link: null, customer: nextCustomer, error: 'آدرس وب‌هوک تنظیم نشده است' };
    }

    const queued = enqueueOutreach({ channel, to: source.mobile || source.email, text, subject, customerId: source.id });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookApiKey ? { Authorization: `Bearer ${webhookApiKey}` } : {}),
        },
        body: JSON.stringify({ to: source.mobile || source.email, message: text, subject, customerId: source.id }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      updateOutreachEntry(queued.id, { status: 'sent', sentAt: new Date().toISOString() });

      const record = buildCommunicationRecord({ channel, text, subject, status: 'sent', link: url });
      const nextCustomer = appendCommunication(source, record);
      if (typeof persistCustomer === 'function') await persistCustomer(nextCustomer);

      return { delivered: true, queued: false, record, link: url, customer: nextCustomer };
    } catch (error) {
      updateOutreachEntry(queued.id, { status: 'failed', error: error?.message || 'ارسال ناموفق بود' });

      const record = buildCommunicationRecord({ channel, text, subject, status: 'failed' });
      const nextCustomer = appendCommunication(source, record);
      if (typeof persistCustomer === 'function') await persistCustomer(nextCustomer);

      return { delivered: false, queued: true, record, link: url, customer: nextCustomer, error: error?.message };
    }
  }

  // sms / whatsapp / telegram / email → صف‌کردن (بدون بک‌اند)
  const queued = enqueueOutreach({ channel: channelMeta.key, to: source.mobile || source.email, text, subject, link, customerId: source.id });
  const record = buildCommunicationRecord({ channel, text, subject, status: 'queued', link: link || '' });
  const nextCustomer = appendCommunication(source, record);
  if (typeof persistCustomer === 'function') await persistCustomer(nextCustomer);

  return { delivered: false, queued: true, record, link, customer: nextCustomer };
}

/* ================================================================== */
/* ارسال گروهی (کمپین)                                                 */
/* ================================================================== */

/**
 * ارسال یک کمپین به مجموعه‌ای از مشتریان.
 * @param {Object} config
 *   customers, channel, text, subject, countryCode,
 *   webhookUrl, webhookApiKey, scheduledFor (ISO), persistCustomer, onProgress
 * @returns {Promise<Object>} خلاصهٔ کمپین
 */
export async function sendBulkCampaign(config = {}) {
  const {
    customers = [],
    channel = 'inapp',
    text = '',
    subject = '',
    countryCode = getOutreachSettings().countryCode,
    webhookUrl = getOutreachSettings().webhookUrl,
    webhookApiKey = getOutreachSettings().webhookApiKey,
    scheduledFor = '',
    persistCustomer = null,
    onProgress = null,
    signal = null,
  } = config;

  const settings = getOutreachSettings();
  const list = (Array.isArray(customers) ? customers : []).slice(0, settings.maxBulk || 500);
  const channelMeta = OUTREACH_CHANNEL_MAP[channel] || OUTREACH_CHANNEL_MAP.inapp;

  // زمان‌بندی‌شده: فقط ثبت می‌کنیم، بعداً تیک می‌خورد
  if (scheduledFor) {
    const campaign = {
      id: createId('campaign'),
      name: subject || `کمپین ${channelMeta.label}`,
      channel,
      text,
      subject,
      countryCode,
      webhookUrl: channel === 'webhook' ? webhookUrl : '',
      webhookApiKey: channel === 'webhook' ? webhookApiKey : '',
      status: 'scheduled', // scheduled | running | done | failed
      scheduledFor,
      createdAt: new Date().toISOString(),
      total: list.length,
      sent: 0,
      failed: 0,
      customerIds: list.map((customer) => customer?.id).filter(Boolean),
    };

    persistCampaign(campaign);

    return { campaign, scheduled: true, delivered: 0, queued: 0, failed: 0, total: list.length };
  }

  const campaign = {
    id: createId('campaign'),
    name: subject || `کمپین ${channelMeta.label}`,
    channel,
    text,
    subject,
    countryCode,
    status: 'running',
    createdAt: new Date().toISOString(),
    finishedAt: '',
    total: list.length,
    sent: 0,
    failed: 0,
    customerIds: list.map((customer) => customer?.id).filter(Boolean),
  };

  persistCampaign(campaign);

  let sent = 0;
  let failed = 0;
  let processed = 0;

  for (const customer of list) {
    if (signal?.aborted) break;

    const result = await sendCustomerMessage(customer, {
      channel,
      text,
      subject,
      countryCode,
      webhookUrl: channel === 'webhook' ? webhookUrl : '',
      webhookApiKey: channel === 'webhook' ? webhookApiKey : '',
      persistCustomer,
    });

    if (result.delivered || result.queued) sent += 1;
    else failed += 1;

    processed += 1;

    if (typeof onProgress === 'function') {
      onProgress({ processed, total: list.length, sent, failed, current: customer });
    }

    // throttle تا مرورگر هنگ نکند
    if (settings.throttleMs > 0 && channel !== 'webhook') {
      await sleep(settings.throttleMs, signal);
    }
  }

  campaign.sent = sent;
  campaign.failed = failed;
  campaign.status = failed === list.length && list.length > 0 ? 'failed' : 'done';
  campaign.finishedAt = new Date().toISOString();

  persistCampaign(campaign);

  return { campaign, scheduled: false, delivered: sent, queued: sent, failed, total: list.length };
}

function sleep(ms, signal = null) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      resolve();
    };

    const cleanup = () => {
      signal?.removeEventListener?.('abort', onAbort);
    };

    signal?.addEventListener?.('abort', onAbort);
  });
}

/* ================================================================== */
/* زمان‌بند کمپین‌های زمان‌بندی‌شده                                    */
/* ================================================================== */

/** کمپین‌های آمادهٔ اجرا */
export function getDueCampaigns(now = Date.now()) {
  return getCampaignLog().filter(
    (campaign) => campaign.status === 'scheduled' && campaign.scheduledFor && Date.parse(campaign.scheduledFor) <= now
  );
}

/**
 * اجرای کمپین‌های سررسیدشده.
 * @param {Function} getCustomersFn تابعی که لیست مشتریان را برمی‌گرداند
 */
export async function tickCampaigns(getCustomersFn, options = {}) {
  const { persistCustomer = null, signal = null } = options;
  const due = getDueCampaigns();

  if (due.length === 0) return [];

  const allCustomers = typeof getCustomersFn === 'function' ? await getCustomersFn() : [];
  const results = [];

  for (const campaign of due) {
    updateCampaign(campaign.id, { status: 'running' });

    const targets = (Array.isArray(allCustomers) ? allCustomers : []).filter(
      (customer) => campaign.customerIds.includes(customer?.id)
    );

    const summary = await sendBulkCampaign({
      customers: targets,
      channel: campaign.channel,
      text: campaign.text,
      subject: campaign.subject,
      countryCode: campaign.countryCode,
      webhookUrl: campaign.webhookUrl,
      webhookApiKey: campaign.webhookApiKey,
      persistCustomer,
      signal,
    });

    updateCampaign(campaign.id, {
      status: 'done',
      sent: summary.sent,
      failed: summary.failed,
      finishedAt: new Date().toISOString(),
      total: targets.length,
    });

    results.push({ campaignId: campaign.id, ...summary });
  }

  return results;
}

let schedulerTimer = null;

export function startCampaignScheduler(getCustomersFn, options = {}) {
  stopCampaignScheduler();

  const intervalMs = options.intervalMs || 30_000;

  const run = () => {
    tickCampaigns(getCustomersFn, options).catch(() => {});
  };

  run();
  schedulerTimer = setInterval(run, intervalMs);

  return schedulerTimer;
}

export function stopCampaignScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

export function isCampaignSchedulerRunning() {
  return schedulerTimer !== null;
}

/* ================================================================== */
/* آمار                                                                */
/* ================================================================== */

export function getOutreachStats() {
  const campaigns = getCampaignLog();
  const queue = getOutreachQueue();

  const byChannel = {};
  for (const campaign of campaigns) {
    byChannel[campaign.channel] = (byChannel[campaign.channel] || 0) + (campaign.sent || 0);
  }

  return {
    campaignCount: campaigns.length,
    scheduledCount: campaigns.filter((campaign) => campaign.status === 'scheduled').length,
    totalSent: campaigns.reduce((sum, campaign) => sum + (campaign.sent || 0), 0),
    totalFailed: campaigns.reduce((sum, campaign) => sum + (campaign.failed || 0), 0),
    queueLength: queue.length,
    pendingCount: queue.filter((item) => item.status === 'pending' || item.status === 'scheduled').length,
    byChannel,
  };
}
