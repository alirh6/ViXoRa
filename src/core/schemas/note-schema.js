// src/core/schemas/note-schema.js

/**
 * ViXoRa — اسکیمای یادداشت غنی (Rich Note)
 * ==================================================================
 * یک یادداشت از «بلوک»ها (بخش‌ها) ساخته می‌شود تا کاربر بتواند برای هر
 * منظوری هر نوع داده‌ای اضافه کند.
 *
 * ⚠️ سازگاری با دادهٔ قدیمی: یادداشت‌های `{ title, content }` به‌صورت
 * خودکار به ساختار بلوکی مهاجرت می‌شوند (تابع normalizeNote).
 */

export const NOTE_COLORS = ['violet', 'blue', 'emerald', 'amber', 'rose', 'slate'];

export const NOTE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const NOTE_STATUSES = ['todo', 'doing', 'done', 'archived'];

export const NOTE_VIEWS = ['grid', 'list', 'board', 'timeline', 'calendar', 'masonry'];

export const NOTE_SORTS = [
  'smart',
  'updated',
  'created',
  'alphabetical',
  'priority',
  'due',
  'pinned',
  'favorite',
  'neglected',
  'momentum',
  'random',
];

export const NOTE_GROUPS = ['none', 'status', 'priority', 'color', 'category'];

export const SEARCH_SCOPES = ['all', 'title', 'content', 'tags', 'category', 'color', 'date'];

/* ------------------------------------------------------------------ */
/* بلوک‌ها                                                             */
/* ------------------------------------------------------------------ */

export const BLOCK_TYPES = {
  text: {
    key: 'text',
    label: 'متن و توضیحات',
    icon: '📝',
    hint: 'پاراگراف آزاد برای هر توضیحی',
    defaultTitle: 'توضیحات',
    create: () => ({ value: '' }),
  },

  task: {
    key: 'task',
    label: 'چک‌لیست وظایف',
    icon: '✅',
    hint: 'لیست کارها با امکان تیک‌زدن',
    defaultTitle: 'وظایف',
    create: () => ({ items: [] }),
  },

  keyvalue: {
    key: 'keyvalue',
    label: 'فیلدهای کلید/مقدار',
    icon: '🧾',
    hint: 'اطلاعات ساختاریافته مثل کد ملی، شماره قرارداد',
    defaultTitle: 'جزئیات',
    create: () => ({ fields: [] }),
  },

  table: {
    key: 'table',
    label: 'جدول',
    icon: '📊',
    hint: 'جدول با ستون و ردیف دلخواه',
    defaultTitle: 'جدول',
    create: () => ({ columns: ['ستون ۱', 'ستون ۲'], rows: [['', '']] }),
  },

  checklistRating: {
    key: 'checklistRating',
    label: 'امتیاز و ارزیابی',
    icon: '⭐',
    hint: 'امتیاز ۱ تا ۵ برای هر مورد',
    defaultTitle: 'ارزیابی',
    create: () => ({ items: [], scale: 5 }),
  },

  link: {
    key: 'link',
    label: 'لینک‌ها',
    icon: '🔗',
    hint: 'آدرس سایت، فایل یا منبع',
    defaultTitle: 'لینک‌ها',
    create: () => ({ links: [] }),
  },

  contact: {
    key: 'contact',
    label: 'اطلاعات تماس',
    icon: '📇',
    hint: 'نام، موبایل، ایمیل، نقش',
    defaultTitle: 'تماس',
    create: () => ({ people: [] }),
  },

  money: {
    key: 'money',
    label: 'مالی و مبلغ',
    icon: '💰',
    hint: 'مبالغ، بدهی، پرداخت‌ها',
    defaultTitle: 'مالی',
    create: () => ({ currency: 'IRR', entries: [] }),
  },

  date: {
    key: 'date',
    label: 'تاریخ و زمان',
    icon: '📅',
    hint: 'تاریخ‌های مهم، سررسید، بازهٔ زمانی',
    defaultTitle: 'زمان‌بندی',
    create: () => ({ events: [] }),
  },

  location: {
    key: 'location',
    label: 'موقعیت مکانی',
    icon: '📍',
    hint: 'آدرس یا مختصات',
    defaultTitle: 'موقعیت',
    create: () => ({ places: [] }),
  },

  media: {
    key: 'media',
    label: 'رسانه و ضمیمه',
    icon: '🎞️',
    hint: 'فایل، عکس، صوت یا ویدیو',
    defaultTitle: 'ضمیمه‌ها',
    create: () => ({ attachmentIds: [] }),
  },

  code: {
    key: 'code',
    label: 'کد و اسکریپت',
    icon: '⌨️',
    hint: 'قطعهٔ کد با زبان مشخص',
    defaultTitle: 'کد',
    create: () => ({ language: 'javascript', value: '' }),
  },

  quote: {
    key: 'quote',
    label: 'نقل‌قول',
    icon: '❝',
    hint: 'جملهٔ مهم یا یادآوری',
    defaultTitle: 'نقل‌قول',
    create: () => ({ value: '', author: '' }),
  },
};

export const BLOCK_TYPE_KEYS = Object.keys(BLOCK_TYPES);

/* ------------------------------------------------------------------ */
/* ابزارهای عمومی                                                      */
/* ------------------------------------------------------------------ */

export function createId(prefix = 'id') {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${uuid}`;
}

function toSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toSafeString(value) {
  return typeof value === 'string' ? value : '';
}

function toSafeBoolean(value) {
  return value === true || value === 'true';
}

/* ------------------------------------------------------------------ */
/* نرمال‌سازی بلوک                                                     */
/* ------------------------------------------------------------------ */

export function createBlock(type, { title = '', ...data } = {}) {
  const definition = BLOCK_TYPES[type];

  if (!definition) {
    throw new TypeError(`[NoteSchema] Unknown block type "${type}".`);
  }

  return {
    id: createId('block'),
    type,
    title: title || definition.defaultTitle,
    collapsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...definition.create(),
    ...data,
  };
}

export function normalizeBlock(rawBlock) {
  if (!rawBlock || typeof rawBlock !== 'object') return null;

  const type = BLOCK_TYPES[rawBlock.type] ? rawBlock.type : 'text';
  const definition = BLOCK_TYPES[type];

  const block = {
    id: toSafeString(rawBlock.id) || createId('block'),
    type,
    title: toSafeString(rawBlock.title) || definition.defaultTitle,
    collapsed: toSafeBoolean(rawBlock.collapsed),
    createdAt: toSafeString(rawBlock.createdAt) || new Date().toISOString(),
    updatedAt: toSafeString(rawBlock.updatedAt) || new Date().toISOString(),
    ...definition.create(),
  };

  switch (type) {
    case 'text':
    case 'quote':
      block.value = toSafeString(rawBlock.value);
      if (type === 'quote') block.author = toSafeString(rawBlock.author);
      break;

    case 'task':
      block.items = toSafeArray(rawBlock.items)
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          id: toSafeString(item.id) || createId('task'),
          text: toSafeString(item.text),
          done: toSafeBoolean(item.done),
        }));
      break;

    case 'checklistRating':
      block.scale = Number.isFinite(Number(rawBlock.scale)) ? Number(rawBlock.scale) : 5;
      block.items = toSafeArray(rawBlock.items)
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          id: toSafeString(item.id) || createId('rate'),
          text: toSafeString(item.text),
          score: Number.isFinite(Number(item.score)) ? Number(item.score) : 0,
        }));
      break;

    case 'keyvalue':
      block.fields = toSafeArray(rawBlock.fields)
        .filter((field) => field && typeof field === 'object')
        .map((field) => ({
          id: toSafeString(field.id) || createId('field'),
          label: toSafeString(field.label),
          value: toSafeString(field.value),
        }));
      break;

    case 'table':
      block.columns = toSafeArray(rawBlock.columns).map(toSafeString);
      if (block.columns.length === 0) block.columns = ['ستون ۱', 'ستون ۲'];

      block.rows = toSafeArray(rawBlock.rows).map((row) =>
        toSafeArray(row).map(toSafeString)
      );
      break;

    case 'link':
      block.links = toSafeArray(rawBlock.links)
        .filter((link) => link && typeof link === 'object')
        .map((link) => ({
          id: toSafeString(link.id) || createId('link'),
          label: toSafeString(link.label),
          url: toSafeString(link.url),
        }));
      break;

    case 'contact':
      block.people = toSafeArray(rawBlock.people)
        .filter((person) => person && typeof person === 'object')
        .map((person) => ({
          id: toSafeString(person.id) || createId('person'),
          name: toSafeString(person.name),
          role: toSafeString(person.role),
          phone: toSafeString(person.phone),
          email: toSafeString(person.email),
        }));
      break;

    case 'money':
      block.currency = toSafeString(rawBlock.currency) || 'IRR';
      block.entries = toSafeArray(rawBlock.entries)
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
          id: toSafeString(entry.id) || createId('money'),
          label: toSafeString(entry.label),
          amount: Number.isFinite(Number(entry.amount)) ? Number(entry.amount) : 0,
          direction: entry.direction === 'income' ? 'income' : 'expense',
          paidAt: toSafeString(entry.paidAt),
        }));
      break;

    case 'date':
      block.events = toSafeArray(rawBlock.events)
        .filter((event) => event && typeof event === 'object')
        .map((event) => ({
          id: toSafeString(event.id) || createId('date'),
          label: toSafeString(event.label),
          at: toSafeString(event.at),
          repeat: toSafeString(event.repeat) || 'none',
        }));
      break;

    case 'location':
      block.places = toSafeArray(rawBlock.places)
        .filter((place) => place && typeof place === 'object')
        .map((place) => ({
          id: toSafeString(place.id) || createId('place'),
          label: toSafeString(place.label),
          address: toSafeString(place.address),
          lat: toSafeString(place.lat),
          lng: toSafeString(place.lng),
        }));
      break;

    case 'media':
      block.attachmentIds = toSafeArray(rawBlock.attachmentIds).map(toSafeString);
      break;

    case 'code':
      block.language = toSafeString(rawBlock.language) || 'javascript';
      block.value = toSafeString(rawBlock.value);
      break;

    default:
      break;
  }

  return block;
}

/* ------------------------------------------------------------------ */
/* نرمال‌سازی یادداشت                                                  */
/* ------------------------------------------------------------------ */

export function createEmptyNote(overrides = {}) {
  const now = new Date().toISOString();

  return {
    id: createId('notes'),
    title: '',
    summary: '',
    category: '',
    tags: [],
    color: 'blue',
    priority: 'medium',
    status: 'todo',
    pinned: false,
    favorite: false,
    archived: false,
    trashed: false,
    dueAt: '',
    blocks: [],
    reminders: [],
    attachments: [],
    shares: [],
    activity: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 2,
    ...overrides,
  };
}

/**
 * مهاجرت + نرمال‌سازی: هر شکل از داده را به یادداشت استاندارد تبدیل می‌کند.
 * یادداشت‌های قدیمی `{ title, content, checklist }` هم پشتیبانی می‌شوند.
 */
/**
 * تبدیل مقدار تاریخ به ISO — بدون جابه‌جایی منطقهٔ زمانی برای مقدارهای محلی.
 * ورودی‌های پشتیبانی‌شده: ISO کامل، «YYYY-MM-DD»، «YYYY-MM-DDTHH:mm» و timestamp عددی.
 */
function toIsoString(value) {
  if (value === undefined || value === null || value === '') return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? '' : fromNumber.toISOString();
  }

  const text = String(value).trim();
  if (!text) return '';

  // مقدار محلی بدون منطقهٔ زمانی: همان ساعت محلی کاربر حفظ می‌شود
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?$/.test(text)) {
    const parts = text.replace(' ', 'T').split('T');
    const [year, month, day] = parts[0].split('-').map(Number);
    const [hour = 0, minute = 0, second = 0] = (parts[1] || '00:00:00').split(':').map(Number);

    const local = new Date(year, month - 1, day, hour, minute, second);
    return Number.isNaN(local.getTime()) ? '' : local.toISOString();
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function normalizeNote(rawNote = {}) {
  if (!rawNote || typeof rawNote !== 'object') return null;

  const now = new Date().toISOString();

  // سازگار با دادهٔ نسخهٔ ۱ (کلاس NotePage قدیم):
  //   dueDate / deadline / due  -> dueAt
  //   isPinned / starred        -> pinned
  //   isFavorite                -> favorite
  //   isArchived                -> archived
  //   isDeleted                 -> trashed
  //   text / description        -> summary
  //   labels                    -> tags
  const firstOf = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  };

  const legacyCreatedAt = toSafeString(rawNote.createdAt) || toSafeString(firstOf(rawNote.created, rawNote.created_at));
  const legacyDue = firstOf(rawNote.dueAt, rawNote.dueDate, rawNote.deadline, rawNote.due);

  const note = createEmptyNote({
    id: toSafeString(rawNote.id) || createId('notes'),
    title: toSafeString(rawNote.title),
    summary: toSafeString(firstOf(rawNote.summary, rawNote.text, rawNote.description)),
    category: toSafeString(rawNote.category),
    color: NOTE_COLORS.includes(rawNote.color) ? rawNote.color : 'blue',
    priority: NOTE_PRIORITIES.includes(rawNote.priority) ? rawNote.priority : 'medium',
    status: NOTE_STATUSES.includes(rawNote.status) ? rawNote.status : 'todo',
    pinned: toSafeBoolean(firstOf(rawNote.pinned, rawNote.isPinned, rawNote.starred)),
    favorite: toSafeBoolean(firstOf(rawNote.favorite, rawNote.isFavorite)),
    archived: toSafeBoolean(firstOf(rawNote.archived, rawNote.isArchived)),
    trashed: toSafeBoolean(firstOf(rawNote.trashed, rawNote.isDeleted)),
    dueAt: toIsoString(legacyDue),
    createdAt: legacyCreatedAt || now,
    updatedAt: toSafeString(rawNote.updatedAt) || legacyCreatedAt || now,
    deletedAt: toSafeString(rawNote.deletedAt) || null,
    version: 2,
  });

  // tags: هم آرایه و هم رشتهٔ «a, b» قبول می‌شود (+ labels در نسخهٔ ۱)
  const rawTags = Array.isArray(rawNote.tags) ? rawNote.tags : rawNote.tags ?? rawNote.labels;

  if (Array.isArray(rawTags)) {
    note.tags = rawTags.map(toSafeString).map((tag) => tag.trim()).filter(Boolean);
  } else if (typeof rawTags === 'string') {
    note.tags = rawTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  // blocks
  const rawBlocks = toSafeArray(rawNote.blocks)
    .map(normalizeBlock)
    .filter(Boolean);

  if (rawBlocks.length > 0) {
    note.blocks = rawBlocks;
  } else {
    // مهاجرت از ساختار قدیمی
    const legacyContent = toSafeString(rawNote.content);

    if (legacyContent.trim()) {
      note.blocks.push(
        createBlock('text', { title: 'توضیحات', value: legacyContent })
      );
    }

    const legacyChecklist = toSafeArray(rawNote.checklist);

    if (legacyChecklist.length > 0) {
      note.blocks.push(
        createBlock('task', {
          title: 'وظایف',
          items: legacyChecklist.map((item, index) =>
            typeof item === 'string'
              ? { id: createId('task'), text: item, done: false }
              : {
                  id: toSafeString(item.id) || createId('task'),
                  text: toSafeString(item.text),
                  done: toSafeBoolean(item.done),
                  _legacyIndex: index,
                }
          ),
        })
      );
    }

    if (note.blocks.length === 0) {
      note.blocks.push(createBlock('text', { title: 'توضیحات', value: '' }));
    }
  }

  note.reminders = toSafeArray(rawNote.reminders)
    .filter((reminder) => reminder && typeof reminder === 'object')
    .map((reminder) => ({
      id: toSafeString(reminder.id) || createId('reminder'),
      title: toSafeString(reminder.title),
      message: toSafeString(reminder.message),
      at: toSafeString(reminder.at),
      repeat: toSafeString(reminder.repeat) || 'none',
      channels: toSafeArray(reminder.channels).length
        ? toSafeArray(reminder.channels)
        : ['inapp'],
      enabled: reminder.enabled !== false,
      createdAt: toSafeString(reminder.createdAt) || now,
      lastFiredAt: toSafeString(reminder.lastFiredAt) || '',
      nextAt: toSafeString(reminder.nextAt) || toSafeString(reminder.at),
      history: toSafeArray(reminder.history),
    }));

  note.attachments = toSafeArray(rawNote.attachments).map(toSafeString);
  note.shares = toSafeArray(rawNote.shares).filter((share) => share && typeof share === 'object');
  note.activity = toSafeArray(rawNote.activity).filter((entry) => entry && typeof entry === 'object');

  return note;
}

export function normalizeNoteList(rawList) {
  return toSafeArray(rawList).map(normalizeNote).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* مشتق‌سازی                                                           */
/* ------------------------------------------------------------------ */

/** متن کامل یادداشت (برای جستجو) — شامل همهٔ بلوک‌ها */
export function getNotePlainText(note) {
  if (!note) return '';

  const parts = [note.title, note.summary, note.category, toSafeArray(note.tags).join(' ')];

  for (const block of toSafeArray(note.blocks)) {
    parts.push(block.title);

    switch (block.type) {
      case 'text':
      case 'quote':
      case 'code':
        parts.push(block.value);
        if (block.author) parts.push(block.author);
        break;
      case 'task':
      case 'checklistRating':
        parts.push(toSafeArray(block.items).map((item) => item.text).join(' '));
        break;
      case 'keyvalue':
        parts.push(toSafeArray(block.fields).map((f) => `${f.label} ${f.value}`).join(' '));
        break;
      case 'table':
        parts.push(toSafeArray(block.columns).join(' '));
        parts.push(toSafeArray(block.rows).map((row) => row.join(' ')).join(' '));
        break;
      case 'link':
        parts.push(toSafeArray(block.links).map((l) => `${l.label} ${l.url}`).join(' '));
        break;
      case 'contact':
        parts.push(
          toSafeArray(block.people).map((p) => `${p.name} ${p.role} ${p.phone} ${p.email}`).join(' ')
        );
        break;
      case 'money':
        parts.push(toSafeArray(block.entries).map((e) => `${e.label} ${e.amount}`).join(' '));
        break;
      case 'date':
        parts.push(toSafeArray(block.events).map((e) => `${e.label} ${e.at}`).join(' '));
        break;
      case 'location':
        parts.push(toSafeArray(block.places).map((p) => `${p.label} ${p.address}`).join(' '));
        break;
      default:
        break;
    }
  }

  return parts.filter(Boolean).join('\n');
}

/** پیش‌نمایش متنی کوتاه برای کارت */
export function getNotePreview(note, maxLength = 150) {
  const text = getNotePlainText(note)
    .split('\n')
    .slice(1)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';

  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

/** آمار چک‌لیست‌ها برای نوار پیشرفت */
export function getTaskStats(note) {
  let total = 0;
  let done = 0;

  for (const block of toSafeArray(note.blocks)) {
    if (block.type === 'task') {
      for (const item of toSafeArray(block.items)) {
        total += 1;
        if (item.done) done += 1;
      }
    }
  }

  return { total, done, ratio: total === 0 ? 0 : done / total };
}

export function getNextReminder(note) {
  const now = Date.now();

  return toSafeArray(note.reminders)
    .filter((reminder) => reminder.enabled && reminder.nextAt)
    .map((reminder) => ({ reminder, time: new Date(reminder.nextAt).getTime() }))
    .filter((entry) => Number.isFinite(entry.time) && entry.time >= now - 60_000)
    .sort((a, b) => a.time - b.time)[0]?.reminder || null;
}

export function isOverdue(note) {
  if (!note?.dueAt || note.status === 'done') return false;

  const due = new Date(note.dueAt);
  if (Number.isNaN(due.getTime())) return false;

  due.setHours(23, 59, 59, 999);

  return due.getTime() < Date.now();
}

export function isDueToday(note) {
  if (!note?.dueAt) return false;

  const due = new Date(note.dueAt);
  if (Number.isNaN(due.getTime())) return false;

  const now = new Date();

  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

/** اعتبارسنجی فرم یادداشت */
export function validateNoteDraft(draft = {}) {
  const title = toSafeString(draft.title).trim();
  const hasContent =
    toSafeString(draft.summary).trim() !== '' ||
    toSafeArray(draft.blocks).some((block) => getNotePlainText({ title: '', blocks: [block] }).trim() !== '');

  if (!title && !hasContent) {
    return { valid: false, message: 'حداقل عنوان یا محتوا را وارد کن.' };
  }

  if (title.length > 120) {
    return { valid: false, message: 'عنوان نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.' };
  }

  return { valid: true };
}

/** تبدیل tags رشته‌ای به آرایه */
export function parseTags(input) {
  return toSafeString(input)
    .split(/[,،\n]/)
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, 30);
}
