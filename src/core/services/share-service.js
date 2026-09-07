// src/core/services/share-service.js

/**
 * ViXoRa Share Service — اشتراک‌گذاری یادداشت
 * ==================================================================
 * کانال‌ها:
 *   copy     → کپی متن در کلیپ‌بورد
 *   whatsapp / telegram / sms / email → لینک مستقیم
 *   native   → Web Share API (روی موبایل: هر اپی که نصب باشد)
 *   image    → ساخت تصویر PNG از یادداشت (برای اشتراک در مدیا)
 *   file     → دانلود Markdown / JSON
 */


import { buildSmsLink } from './reminder-service.js';
import { formatPersianDateTime, formatCurrency } from '../../utilities/formatters.js';
import { openExternal } from '../../utilities/dom-utils.js';
import { toast } from '../../utilities/toast.js';

/* ------------------------------------------------------------------ */
/* ساخت متن                                                            */
/* ------------------------------------------------------------------ */

const LABELS = {
  todo: 'در انتظار',
  doing: 'در حال انجام',
  done: 'انجام‌شده',
  archived: 'آرشیو',
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  urgent: 'فوری',
};

export function buildNoteShareText(note, options = {}) {
  const { includeMeta = true, maxLength = 4000 } = options;

  if (!note) return '';

  const lines = [`📌 ${note.title || 'بدون عنوان'}`];

  if (includeMeta) {
    const meta = [];

    if (note.category) meta.push(`دسته: ${note.category}`);
    if (note.status) meta.push(`وضعیت: ${LABELS[note.status] || note.status}`);
    if (note.priority) meta.push(`اولویت: ${LABELS[note.priority] || note.priority}`);
    if (note.dueAt) meta.push(`سررسید: ${formatPersianDateTime(note.dueAt)}`);
    if (Array.isArray(note.tags) && note.tags.length) {
      meta.push(`برچسب‌ها: ${note.tags.map((tag) => `#${tag}`).join(' ')}`);
    }

    if (meta.length) {
      lines.push(meta.join(' • '));
    }
  }

  lines.push('');

  for (const block of Array.isArray(note.blocks) ? note.blocks : []) {
    lines.push(`${block.title || 'بخش'}`);

    switch (block.type) {
      case 'text':
      case 'code':
        if (block.value) lines.push(block.value);
        break;

      case 'quote':
        if (block.value) lines.push(`«${block.value}»${block.author ? ` — ${block.author}` : ''}`);
        break;

      case 'task':
        for (const item of block.items || []) {
          lines.push(`${item.done ? '[x]' : '[ ]'} ${item.text}`);
        }
        break;

      case 'checklistRating':
        for (const item of block.items || []) {
          lines.push(`• ${item.text}: ${item.score}/${block.scale || 5}`);
        }
        break;

      case 'keyvalue':
        for (const field of block.fields || []) {
          lines.push(`• ${field.label}: ${field.value}`);
        }
        break;

      case 'table': {
        const columns = block.columns || [];
        if (columns.length) lines.push(columns.join(' | '));
        for (const row of block.rows || []) {
          lines.push(row.join(' | '));
        }
        break;
      }

      case 'link':
        for (const link of block.links || []) {
          lines.push(`• ${link.label || 'لینک'}: ${link.url}`);
        }
        break;

      case 'contact':
        for (const person of block.people || []) {
          lines.push(
            `• ${person.name}${person.role ? ` (${person.role})` : ''}${person.phone ? ` — ${person.phone}` : ''}${person.email ? ` — ${person.email}` : ''}`
          );
        }
        break;

      case 'money':
        for (const entry of block.entries || []) {
          const sign = entry.direction === 'income' ? '+' : '−';
          lines.push(`• ${entry.label}: ${sign}${formatCurrency(entry.amount)}`);
        }
        break;

      case 'date':
        for (const event of block.events || []) {
          lines.push(`• ${event.label}: ${formatPersianDateTime(event.at)}`);
        }
        break;

      case 'location':
        for (const place of block.places || []) {
          lines.push(`• ${place.label}: ${place.address}`);
        }
        break;

      default:
        break;
    }

    lines.push('');
  }

  lines.push(`— ViXoRa • ${formatPersianDateTime(new Date())}`);

  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function buildNoteMarkdown(note) {
  if (!note) return '';

  const lines = [`# ${note.title || 'بدون عنوان'}`, ''];

  if (note.summary) lines.push(`> ${note.summary}`, '');

  for (const block of Array.isArray(note.blocks) ? note.blocks : []) {
    lines.push(`## ${block.title || 'بخش'}`, '');

    switch (block.type) {
      case 'text':
        if (block.value) lines.push(block.value, '');
        break;
      case 'code':
        lines.push('```' + (block.language || ''), block.value || '', '```', '');
        break;
      case 'quote':
        lines.push(`> ${block.value || ''}${block.author ? `\n> — ${block.author}` : ''}`, '');
        break;
      case 'task':
        for (const item of block.items || []) {
          lines.push(`- [${item.done ? 'x' : ' '}] ${item.text}`);
        }
        lines.push('');
        break;
      case 'keyvalue':
        for (const field of block.fields || []) {
          lines.push(`- **${field.label}:** ${field.value}`);
        }
        lines.push('');
        break;
      case 'table': {
        const columns = block.columns || [];
        if (columns.length) {
          lines.push(`| ${columns.join(' | ')} |`);
          lines.push(`| ${columns.map(() => '---').join(' | ')} |`);
        }
        for (const row of block.rows || []) lines.push(`| ${row.join(' | ')} |`);
        lines.push('');
        break;
      }
      case 'link':
        for (const link of block.links || []) lines.push(`- [${link.label || link.url}](${link.url})`);
        lines.push('');
        break;
      case 'contact':
        for (const person of block.people || []) {
          lines.push(`- **${person.name}** ${person.role || ''} ${person.phone || ''} ${person.email || ''}`);
        }
        lines.push('');
        break;
      case 'money':
        for (const entry of block.entries || []) {
          lines.push(`- ${entry.label}: ${entry.amount} (${entry.direction})`);
        }
        lines.push('');
        break;
      case 'date':
        for (const event of block.events || []) lines.push(`- ${event.label}: ${event.at}`);
        lines.push('');
        break;
      case 'location':
        for (const place of block.places || []) lines.push(`- ${place.label}: ${place.address}`);
        lines.push('');
        break;
      default:
        break;
    }
  }

  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* لینک‌های اشتراک                                                     */
/* ------------------------------------------------------------------ */

export function canUseNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function buildShareTargets(note, { phoneNumber = '' } = {}) {
  const text = buildNoteShareText(note);
  const title = note?.title || 'یادداشت ViXoRa';
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title);

  return [
    {
      id: 'copy',
      label: 'کپی متن',
      icon: '📋',
      kind: 'action',
    },
    {
      id: 'native',
      label: 'اشتراک سیستمی',
      icon: '📤',
      kind: 'action',
      available: canUseNativeShare(),
    },
    {
      id: 'whatsapp',
      label: 'واتساپ',
      icon: '💬',
      kind: 'link',
      url: `https://wa.me/?text=${encodedText}`,
    },
    {
      id: 'telegram',
      label: 'تلگرام',
      icon: '✈️',
      kind: 'link',
      url: `https://t.me/share/url?url=${encodeURIComponent('ViXoRa')}&text=${encodedText}`,
    },
    {
      id: 'sms',
      label: 'پیامک',
      icon: '📱',
      kind: 'link',
      url: buildSmsLink(
        { id: note?.id, title, message: text, at: '' },
        { phoneNumber, provider: 'link' }
      ),
    },
    {
      id: 'email',
      label: 'ایمیل',
      icon: '✉️',
      kind: 'link',
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
    },
    {
      id: 'image',
      label: 'تصویر (PNG)',
      icon: '🖼️',
      kind: 'action',
    },
    {
      id: 'markdown',
      label: 'دانلود Markdown',
      icon: '⬇️',
      kind: 'action',
    },
  ].filter((target) => target.available !== false);
}

/* ------------------------------------------------------------------ */
/* اجرای اشتراک                                                        */
/* ------------------------------------------------------------------ */

export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.select();

    const ok = document.execCommand('copy');
    textarea.remove();

    return ok;
  } catch {
    return false;
  }
}

export async function shareNative(note) {
  if (!canUseNativeShare()) return false;

  try {
    await navigator.share({
      title: note?.title || 'یادداشت ViXoRa',
      text: buildNoteShareText(note),
    });

    return true;
  } catch (error) {
    // کاربر لغو کرد
    if (error?.name === 'AbortError') return false;

    console.warn('[Share] Native share failed:', error);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* ساخت تصویر                                                          */
/* ------------------------------------------------------------------ */

function wrapText(context, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);

  return lines;
}

/**
 * ساخت تصویر PNG از یادداشت برای اشتراک در مدیا.
 * @returns {Promise<string|null>} data URL تصویر
 */
export async function createNoteImage(note, { width = 720 } = {}) {
  if (typeof document === 'undefined') return null;

  const text = buildNoteShareText(note, { maxLength: 1600 });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;

  const padding = 36;
  const lineHeight = 30;

  canvas.width = width;
  canvas.height = 200;

  context.font = '16px Vazirmatn, Tahoma, sans-serif';
  const lines = wrapText(context, text, width - padding * 2);

  canvas.height = Math.max(260, padding * 2 + lines.length * lineHeight + 90);

  // پس‌زمینهٔ گرادیانی
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#141a2b');
  gradient.addColorStop(0.55, '#101528');
  gradient.addColorStop(1, '#1b1330');

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // نوار رنگی بالا
  const accent = context.createLinearGradient(0, 0, canvas.width, 0);
  accent.addColorStop(0, '#00d0ff');
  accent.addColorStop(1, '#7a5cff');

  context.fillStyle = accent;
  context.fillRect(0, 0, canvas.width, 6);

  // متن
  context.direction = 'rtl';
  context.textAlign = 'right';
  context.font = '16px Vazirmatn, Tahoma, sans-serif';
  context.fillStyle = '#dfe6f3';

  let y = padding + 18;

  for (const line of lines) {
    context.fillText(line, canvas.width - padding, y);
    y += lineHeight;
  }

  // امضا
  context.font = '13px Vazirmatn, Tahoma, sans-serif';
  context.fillStyle = 'rgba(223,230,243,.55)';
  context.fillText('ViXoRa — فضای کاری هوشمند', canvas.width - padding, canvas.height - 26);

  try {
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('[Share] Image creation failed:', error);
    return null;
  }
}

export function downloadDataUrl(dataUrl, filename) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => anchor.remove(), 200);
}

export function downloadTextFile(text, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);

  downloadDataUrl(url, filename);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* ثبت رویداد اشتراک                                                   */
/* ------------------------------------------------------------------ */

export function createShareRecord(targetId, noteId, { success = true } = {}) {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `share-${Date.now()}`,
    channel: targetId,
    noteId,
    success,
    sharedAt: new Date().toISOString(),
  };
}

export async function executeShare(targetId, note, options = {}) {
  const text = buildNoteShareText(note);

  switch (targetId) {
    case 'copy': {
      const ok = await copyToClipboard(text);
      if (ok) toast.success('متن یادداشت کپی شد.');
      else toast.error('کپی کردن ممکن نشد.');
      return { success: ok, record: createShareRecord(targetId, note.id, { success: ok }) };
    }

    case 'native': {
      const ok = await shareNative(note);
      return { success: ok, record: createShareRecord(targetId, note.id, { success: ok }) };
    }

    case 'image': {
      const dataUrl = await createNoteImage(note);

      if (!dataUrl) {
        toast.error('ساخت تصویر ممکن نشد.');
        return { success: false, record: createShareRecord(targetId, note.id, { success: false }) };
      }

      downloadDataUrl(dataUrl, `vixora-${note.title || 'note'}.png`);
      toast.success('تصویر یادداشت ساخته و دانلود شد.');

      return { success: true, record: createShareRecord(targetId, note.id), dataUrl };
    }

    case 'markdown': {
      downloadTextFile(buildNoteMarkdown(note), `vixora-${note.title || 'note'}.md`, 'text/markdown;charset=utf-8');
      toast.success('فایل Markdown دانلود شد.');

      return { success: true, record: createShareRecord(targetId, note.id) };
    }

    default: {
      const target = buildShareTargets(note, options).find((item) => item.id === targetId);

      if (target?.url) {
        openExternal(target.url);
        return { success: true, record: createShareRecord(targetId, note.id), url: target.url };
      }

      return { success: false, record: createShareRecord(targetId, note.id, { success: false }) };
    }
  }
}

/* ------------------------------------------------------------------ */
/* بکاپ / بازیابی                                                      */
/* ------------------------------------------------------------------ */

export function createBackupPayload(notes, { user = null } = {}) {
  return {
    app: 'ViXoRa',
    type: 'notes-backup',
    tool: 'notes',
    version: 2,
    createdAt: new Date().toISOString(),
    user: user ? { id: user.id, username: user.username, name: user.name } : null,
    count: Array.isArray(notes) ? notes.length : 0,
    notes: Array.isArray(notes) ? notes : [],
  };
}

/**
 * ترکیب بکاپ با دادهٔ فعلی.
 * @param {Array} currentNotes
 * @param {Array|Object} backup فایل بکاپ یا آرایهٔ یادداشت
 * @param {'merge'|'replace'} mode
 */
export function mergeBackup(currentNotes, backup, mode = 'merge') {
  const incoming = Array.isArray(backup) ? backup : backup?.notes;

  if (!Array.isArray(incoming)) {
    throw new TypeError('[Share] فایل بکاپ معتبر نیست.');
  }

  if (mode === 'replace') {
    return { notes: incoming, added: incoming.length, updated: 0, skipped: 0 };
  }

  const map = new Map((currentNotes || []).map((note) => [String(note.id), note]));

  let added = 0;
  let updated = 0;

  for (const note of incoming) {
    if (!note || typeof note !== 'object' || !note.id) {
      added += 0;
      continue;
    }

    const existing = map.get(String(note.id));

    if (!existing) {
      map.set(String(note.id), note);
      added += 1;
    } else {
      const existingTime = new Date(existing.updatedAt || 0).getTime();
      const incomingTime = new Date(note.updatedAt || 0).getTime();

      if (incomingTime > existingTime) {
        map.set(String(note.id), note);
        updated += 1;
      }
    }
  }

  return {
    notes: Array.from(map.values()),
    added,
    updated,
    skipped: incoming.length - added - updated,
  };
}

/** خواندن فایل بکاپ از input[type=file] */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('فایلی انتخاب نشده است.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result || '')));
      } catch {
        reject(new Error('فایل JSON معتبر نیست.'));
      }
    };

    reader.onerror = () => reject(reader.error || new Error('خواندن فایل ناموفق بود.'));

    reader.readAsText(file);
  });
}

/** اعتبارسنجی سادهٔ فایل بکاپ */
export function isValidBackup(payload) {
  // آرایهٔ خام یادداشت‌ها هم به‌عنوان بکاپ معتبر پذیرفته می‌شود
  if (Array.isArray(payload)) return true;

  if (!payload || typeof payload !== 'object') return false;
  if (!Array.isArray(payload.notes)) return false;

  return payload.type === 'notes-backup' || payload.app === 'ViXoRa';
}
