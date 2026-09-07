// src/pages/tools/note/note-state.js

/**
 * منطق خالص صفحهٔ یادداشت — بدون DOM
 * (فیلتر، جستجو، مرتب‌سازی، گروه‌بندی، آمار)
 */

import {
  getNotePlainText,
  isOverdue,
  isDueToday,
  NOTE_COLORS,
  NOTE_PRIORITIES,
} from '../../../core/schemas/note-schema.js';

/* ------------------------------------------------------------------ */
/* حالت اولیه                                                          */
/* ------------------------------------------------------------------ */

export function createDefaultUiState() {
  return {
    query: '',
    searchScope: 'all',

    activeView: 'grid',
    activeSort: 'smart',
    groupBy: 'none',

    selectedIds: [],
    selectionMode: false,

    activeBucket: 'all',
    activePriorityFilter: 'all',
    activeColorFilter: 'all',

    showFavoritesOnly: false,
    showPinnedOnly: false,
    showArchivedOnly: false,
    showTrashOnly: false,
    showChecklistOnly: false,
    showOverdueOnly: false,
    showTodayOnly: false,
    showReminderOnly: false,
    showAttachmentOnly: false,

    isMoreMenuOpen: false,
    isFilterPanelOpen: false,
    isAnalyticsOpen: false,
    isTemplatePanelOpen: false,
    isHeaderCustomizeOpen: false,
    isReminderPanelOpen: false,
    isNotificationCenterOpen: false,
    isSettingsPanelOpen: false,
    isCommandPaletteOpen: false,
    isShareSheetOpen: false,

    theme: 'dark',
    density: 'comfortable',

    editingNoteId: null,
    editorTab: 'general',
    shareNoteId: null,

    page: 1,
    pageSize: 24,
  };
}

export const DEFAULT_HEADER_CONFIG = {
  pinned: ['toggle-theme', 'toggle-density', 'toggle-analytics', 'toggle-notifications'],
  menu: [
    'toggle-template-panel',
    'toggle-reminder-panel',
    'toggle-header-customize',
    'toggle-settings',
    'export-notes',
    'import-notes',
    'auto-backup',
    'clear-filters',
  ],
};

export const HEADER_ACTION_META = {
  'toggle-theme': { label: 'تم', title: 'تغییر تم روشن/تاریک', icon: '🌓' },
  'toggle-density': { label: 'تراکم', title: 'تغییر تراکم نمایش', icon: '↔' },
  'toggle-analytics': { label: 'آمار', title: 'پنل تحلیل و آمار', icon: '📈' },
  'toggle-notifications': { label: 'اعلان‌ها', title: 'مرکز اعلان‌ها', icon: '🔔' },
  'toggle-template-panel': { label: 'قالب‌ها', title: 'ساخت یادداشت از قالب آماده', icon: '🧩' },
  'toggle-reminder-panel': { label: 'یادآورها', title: 'مدیریت یادآورهای فعال', icon: '⏰' },
  'toggle-header-customize': { label: 'چیدمان هدر', title: 'شخصی‌سازی دکمه‌های هدر', icon: '🎛️' },
  'toggle-settings': { label: 'تنظیمات', title: 'تنظیمات پیامک، اعلان و ضمیمه', icon: '⚙️' },
  'export-notes': { label: 'خروجی', title: 'خروجی گرفتن از یادداشت‌ها', icon: '⬇️' },
  'import-notes': { label: 'بازیابی', title: 'بازیابی از فایل بکاپ', icon: '⬆️' },
  'auto-backup': { label: 'بکاپ خودکار', title: 'بکاپ فوری در حافظهٔ مرورگر', icon: '🛡️' },
  'clear-filters': { label: 'پاک‌کردن', title: 'حذف همهٔ فیلترها', icon: '🧹' },
};

export const NOTE_TEMPLATES = {
  daily: {
    id: 'daily',
    label: 'مرور روزانه',
    icon: '🌅',
    description: 'اولویت‌ها، دستاوردها و بازتاب روز',
    note: {
      title: 'مرور روزانه',
      category: 'شخصی',
      priority: 'medium',
      color: 'blue',
      status: 'todo',
      tags: ['daily', 'review'],
      blocks: [
        { type: 'task', title: 'سه اولویت امروز', items: [{ text: '', done: false }] },
        { type: 'text', title: 'چه چیزی خوب پیش رفت؟', value: '' },
        { type: 'text', title: 'چه چیزی نیاز به توجه دارد؟', value: '' },
        { type: 'checklistRating', title: 'امتیاز روز', items: [{ text: 'تمرکز', score: 0 }] },
      ],
    },
  },

  project: {
    id: 'project',
    label: 'برنامه‌ریزی پروژه',
    icon: '🗂️',
    description: 'محدوده، ریسک‌ها، مایلستون‌ها و ذی‌نفعان',
    note: {
      title: 'برنامه‌ریزی پروژه',
      category: 'کار',
      priority: 'high',
      color: 'violet',
      status: 'doing',
      tags: ['project', 'planning'],
      blocks: [
        { type: 'keyvalue', title: 'شناسنامهٔ پروژه', fields: [{ label: 'کارفرما', value: '' }] },
        { type: 'task', title: 'مایلستون‌ها', items: [{ text: '', done: false }] },
        { type: 'table', title: 'ریسک‌ها', columns: ['ریسک', 'احتمال', 'اثر', 'اقدام'] },
        { type: 'contact', title: 'ذی‌نفعان', people: [{ name: '', role: '', phone: '' }] },
        { type: 'money', title: 'بودجه', entries: [{ label: 'هزینهٔ برآوردی', amount: 0, direction: 'expense' }] },
      ],
    },
  },

  customer: {
    id: 'customer',
    label: 'پروندهٔ مشتری',
    icon: '🤝',
    description: 'اطلاعات تماس، سوابق خرید و پیگیری‌ها',
    note: {
      title: 'پروندهٔ مشتری',
      category: 'مشتری',
      priority: 'medium',
      color: 'emerald',
      status: 'todo',
      tags: ['customer', 'crm'],
      blocks: [
        { type: 'contact', title: 'مشخصات', people: [{ name: '', role: '', phone: '', email: '' }] },
        { type: 'keyvalue', title: 'جزئیات', fields: [{ label: 'کد مشتری', value: '' }] },
        { type: 'money', title: 'سوابق مالی', entries: [{ label: 'خرید', amount: 0, direction: 'income' }] },
        { type: 'date', title: 'پیگیری‌ها', events: [{ label: 'تماس بعدی', at: '' }] },
      ],
    },
  },

  meeting: {
    id: 'meeting',
    label: 'صورت‌جلسه',
    icon: '📋',
    description: 'حاضرین، مصوبات و اقدامات',
    note: {
      title: 'صورت‌جلسه',
      category: 'کار',
      priority: 'medium',
      color: 'amber',
      status: 'done',
      tags: ['meeting'],
      blocks: [
        { type: 'date', title: 'زمان جلسه', events: [{ label: 'تاریخ', at: '' }] },
        { type: 'contact', title: 'حاضرین', people: [{ name: '', role: '' }] },
        { type: 'text', title: 'مصوبات', value: '' },
        { type: 'task', title: 'اقدامات', items: [{ text: '', done: false }] },
      ],
    },
  },

  brainstorm: {
    id: 'brainstorm',
    label: 'طوفان فکری',
    icon: '💡',
    description: 'ایده‌های آزاد بدون ساختار',
    note: {
      title: 'طوفان فکری',
      category: 'ایده',
      priority: 'low',
      color: 'rose',
      status: 'todo',
      tags: ['brainstorm'],
      blocks: [
        { type: 'text', title: 'ایده‌ها', value: '' },
        { type: 'quote', title: 'جملهٔ کلیدی', value: '', author: '' },
      ],
    },
  },

  finance: {
    id: 'finance',
    label: 'دفتر مالی',
    icon: '💰',
    description: 'درآمد، هزینه و قسط‌ها',
    note: {
      title: 'دفتر مالی',
      category: 'مالی',
      priority: 'high',
      color: 'emerald',
      status: 'todo',
      tags: ['finance'],
      blocks: [
        { type: 'money', title: 'درآمدها', entries: [{ label: 'حقوق', amount: 0, direction: 'income' }] },
        { type: 'money', title: 'هزینه‌ها', entries: [{ label: 'اجاره', amount: 0, direction: 'expense' }] },
        { type: 'date', title: 'سررسیدها', events: [{ label: 'قسط', at: '' }] },
      ],
    },
  },

  travel: {
    id: 'travel',
    label: 'برنامهٔ سفر',
    icon: '🧳',
    description: 'مقصد، اقامت، بودجه و چک‌لیست',
    note: {
      title: 'برنامهٔ سفر',
      category: 'سفر',
      priority: 'low',
      color: 'violet',
      status: 'todo',
      tags: ['travel'],
      blocks: [
        { type: 'location', title: 'مقصد', places: [{ label: 'شهر', address: '' }] },
        { type: 'date', title: 'زمان‌بندی', events: [{ label: 'حرکت', at: '' }] },
        { type: 'money', title: 'بودجه', entries: [{ label: 'اقامت', amount: 0, direction: 'expense' }] },
        { type: 'task', title: 'وسایل مورد نیاز', items: [{ text: '', done: false }] },
      ],
    },
  },
};

/* ------------------------------------------------------------------ */
/* جستجو                                                               */
/* ------------------------------------------------------------------ */

export function matchesSearch(note, query, scope = 'all') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return true;

  const fullText = getNotePlainText(note).toLowerCase();

  switch (scope) {
    case 'title':
      return String(note.title || '').toLowerCase().includes(normalizedQuery);

    case 'content':
      return String(note.blocks?.map((block) => block.value || '').join(' ') || '').toLowerCase().includes(normalizedQuery);

    case 'tags':
      return (note.tags || []).join(' ').toLowerCase().includes(normalizedQuery);

    case 'category':
      return String(note.category || '').toLowerCase().includes(normalizedQuery);

    case 'color':
      return String(note.color || '').toLowerCase().includes(normalizedQuery);

    case 'date':
      return [note.createdAt, note.updatedAt, note.dueAt]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

    case 'all':
    default:
      return fullText.includes(normalizedQuery);
  }
}

/* ------------------------------------------------------------------ */
/* سطل‌ها و فیلترها                                                    */
/* ------------------------------------------------------------------ */

const PANEL_KEYS = [
  'isMoreMenuOpen',
  'isFilterPanelOpen',
  'isAnalyticsOpen',
  'isTemplatePanelOpen',
  'isHeaderCustomizeOpen',
  'isReminderPanelOpen',
  'isNotificationCenterOpen',
  'isSettingsPanelOpen',
  'isCommandPaletteOpen',
  'isShareSheetOpen',
];

export function closePanelsExcept(ui, panelKey) {
  const next = { ...ui };

  for (const key of PANEL_KEYS) {
    if (key !== panelKey) next[key] = false;
  }

  return next;
}

/* ------------------------------------------------------------------ */
/* سطل‌ها: انتخاب یک سطل، بقیه را پاک می‌کند (متقابلاً انحصاری)          */
/* ------------------------------------------------------------------ */

const BUCKET_FLAGS = [
  'showFavoritesOnly',
  'showPinnedOnly',
  'showArchivedOnly',
  'showTrashOnly',
  'showChecklistOnly',
  'showOverdueOnly',
  'showTodayOnly',
  'showReminderOnly',
  'showAttachmentOnly',
];

/** سطل فعال فعلی را از روی فلگ‌ها حدس می‌زند (برای هایلایت سایدبار) */
export function getActiveBucket(ui) {
  if (!ui) return 'all';

  const flagToBucket = {
    showFavoritesOnly: 'favorites',
    showPinnedOnly: 'pinned',
    showArchivedOnly: 'archive',
    showTrashOnly: 'trash',
    showChecklistOnly: 'withChecklist',
    showOverdueOnly: 'overdue',
    showTodayOnly: 'today',
    showReminderOnly: 'withReminder',
    showAttachmentOnly: 'withAttachment',
  };

  for (const flag of BUCKET_FLAGS) {
    if (ui[flag]) return flagToBucket[flag] || 'all';
  }

  return 'all';
}

/**
 * پچ UI برای فعال/غیرفعال‌کردن یک سطل.
 * سطل‌ها انحصاری‌اند: فعال‌کردن یکی، بقیه را خاموش می‌کند.
 */
export function bucketTogglePatch(ui, bucketKey) {
  const bucketToFlag = {
    favorites: 'showFavoritesOnly',
    'toggle-favorites': 'showFavoritesOnly',
    pinned: 'showPinnedOnly',
    'toggle-pinned-filter': 'showPinnedOnly',
    archive: 'showArchivedOnly',
    'toggle-archive': 'showArchivedOnly',
    trash: 'showTrashOnly',
    'toggle-trash': 'showTrashOnly',
    withChecklist: 'showChecklistOnly',
    'toggle-checklist-filter': 'showChecklistOnly',
    overdue: 'showOverdueOnly',
    'filter-overdue': 'showOverdueOnly',
    today: 'showTodayOnly',
    'filter-today': 'showTodayOnly',
    withReminder: 'showReminderOnly',
    'toggle-reminder-filter': 'showReminderOnly',
    withAttachment: 'showAttachmentOnly',
    'toggle-attachment-filter': 'showAttachmentOnly',
  };

  const flag = bucketToFlag[bucketKey];

  const patch = {};

  for (const key of BUCKET_FLAGS) patch[key] = false;

  if (!flag) return { ...patch, activeBucket: 'all', page: 1 };

  const willEnable = !ui?.[flag];

  patch[flag] = willEnable;
  patch.activeBucket = willEnable ? getActiveBucket(patch) : 'all';
  patch.page = 1;

  return patch;
}

export function applyBucketFilter(notes, ui) {
  let list = notes;

  if (ui.showFavoritesOnly) list = list.filter((note) => note.favorite);
  if (ui.showPinnedOnly) list = list.filter((note) => note.pinned);
  if (ui.showArchivedOnly) list = list.filter((note) => note.archived);
  if (ui.showTrashOnly) list = list.filter((note) => note.trashed);
  if (ui.showChecklistOnly) {
    list = list.filter((note) =>
      (note.blocks || []).some((block) => block.type === 'task' && (block.items || []).length > 0)
    );
  }
  if (ui.showOverdueOnly) list = list.filter(isOverdue);
  if (ui.showTodayOnly) list = list.filter(isDueToday);
  if (ui.showReminderOnly) list = list.filter((note) => (note.reminders || []).length > 0);
  if (ui.showAttachmentOnly) list = list.filter((note) => (note.attachments || []).length > 0);

  if (ui.activePriorityFilter !== 'all') {
    list = list.filter((note) => (note.priority || '').toLowerCase() === ui.activePriorityFilter);
  }

  if (ui.activeColorFilter !== 'all') {
    list = list.filter((note) => (note.color || '').toLowerCase() === ui.activeColorFilter);
  }

  return list;
}

/** فیلتر پیش‌فرض: سطل زباله و آرشیو مخفی هستند مگر اینکه صراحتاً انتخاب شوند */
export function applyVisibilityRules(notes, ui) {
  return notes.filter((note) => {
    if (ui.showTrashOnly) return Boolean(note.trashed);
    if (note.trashed) return false;

    if (ui.showArchivedOnly) return Boolean(note.archived);
    if (note.archived) return false;

    return true;
  });
}

export function getVisibleNotes(notes, ui) {
  let list = applyVisibilityRules(Array.isArray(notes) ? notes : [], ui);

  list = applyBucketFilter(list, ui);

  if (String(ui.query || '').trim()) {
    list = list.filter((note) => matchesSearch(note, ui.query, ui.searchScope));
  }

  return sortNotes(list, ui.activeSort);
}

/* ------------------------------------------------------------------ */
/* مرتب‌سازی                                                           */
/* ------------------------------------------------------------------ */

const PRIORITY_RANK = { urgent: 4, high: 3, medium: 2, low: 1 };

function byDateDesc(key) {
  return (a, b) => new Date(b[key] || 0).getTime() - new Date(a[key] || 0).getTime();
}

export function sortNotes(notes, mode = 'smart') {
  const list = Array.isArray(notes) ? [...notes] : [];

  switch (mode) {
    case 'created':
      return list.sort(byDateDesc('createdAt'));

    case 'updated':
      return list.sort(byDateDesc('updatedAt'));

    case 'alphabetical':
      return list.sort((a, b) =>
        String(a.title || '').localeCompare(String(b.title || ''), 'fa-IR')
      );

    case 'priority':
      return list.sort(
        (a, b) => (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0)
      );

    case 'due':
      return list.sort((a, b) => {
        const first = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const second = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return first - second;
      });

    case 'pinned':
      return list.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

    case 'favorite':
      return list.sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));

    case 'neglected':
      return list.sort((a, b) => {
        const first = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const second = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return first - second;
      });

    case 'momentum':
      return list.sort((a, b) => scoreMomentum(b) - scoreMomentum(a));

    case 'random':
      return list.sort(() => Math.random() - 0.5);

    case 'smart':
    default:
      return list.sort((a, b) => {
        const pinned = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        if (pinned !== 0) return pinned;

        const favorite = Number(Boolean(b.favorite)) - Number(Boolean(a.favorite));
        if (favorite !== 0) return favorite;

        const priority = (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
        if (priority !== 0) return priority;

        const overdue = Number(isOverdue(b)) - Number(isOverdue(a));
        if (overdue !== 0) return overdue;

        return byDateDesc('updatedAt')(a, b);
      });
  }
}

function scoreMomentum(note) {
  const tasks = (note.blocks || [])
    .filter((block) => block.type === 'task')
    .reduce((sum, block) => sum + (block.items || []).length, 0);

  const textLength = (note.blocks || []).reduce(
    (sum, block) => sum + String(block.value || '').length,
    0
  );

  return tasks * 10 + textLength / 100 + (note.attachments || []).length * 5;
}

/* ------------------------------------------------------------------ */
/* گروه‌بندی                                                           */
/* ------------------------------------------------------------------ */

export function groupNotes(notes, groupBy = 'none') {
  const list = Array.isArray(notes) ? notes : [];

  if (groupBy === 'none') {
    return { flattened: list, groups: [] };
  }

  const buckets = new Map();

  const labelOf = (note) => {
    switch (groupBy) {
      case 'status':
        return STATUS_LABELS[note.status] || 'در انتظار';
      case 'priority':
        return PRIORITY_LABELS[note.priority] || 'متوسط';
      case 'color':
        return COLOR_LABELS[note.color] || 'خاکستری';
      case 'category':
        return note.category || 'بدون دسته';
      default:
        return 'سایر';
    }
  };

  for (const note of list) {
    const label = labelOf(note);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label).push(note);
  }

  return {
    flattened: list,
    groups: Array.from(buckets.entries()).map(([label, items]) => ({ label, items })),
  };
}

export const STATUS_LABELS = {
  todo: 'در انتظار',
  doing: 'در حال انجام',
  done: 'انجام‌شده',
  archived: 'آرشیو',
};

export const PRIORITY_LABELS = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  urgent: 'فوری',
};

export const COLOR_LABELS = {
  violet: 'بنفش',
  blue: 'آبی',
  emerald: 'سبز',
  amber: 'کهربایی',
  rose: 'صورتی',
  slate: 'خاکستری',
};

export function groupByStatus(notes) {
  const result = { todo: [], doing: [], done: [], archived: [] };

  for (const note of Array.isArray(notes) ? notes : []) {
    const status = result[note.status] ? note.status : 'todo';
    result[status].push(note);
  }

  return result;
}

export function groupByDueDate(notes) {
  const result = new Map();

  for (const note of Array.isArray(notes) ? notes : []) {
    const key = note.dueAt ? new Date(note.dueAt).toISOString().slice(0, 10) : 'بدون سررسید';

    if (!result.has(key)) result.set(key, []);
    result.get(key).push(note);
  }

  return Array.from(result.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** گروه‌بندی بر اساس ماه برای نمای تقویم */
export function buildCalendarMatrix(notes, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // شنبه = اولین روز هفته
  const leadingBlanks = (firstDay.getDay() + 1) % 7;

  const byDay = new Map();

  for (const note of Array.isArray(notes) ? notes : []) {
    if (!note.dueAt) continue;

    const due = new Date(note.dueAt);
    if (Number.isNaN(due.getTime())) continue;
    if (due.getFullYear() !== year || due.getMonth() !== month) continue;

    const day = due.getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(note);
  }

  const cells = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push({ day: null, notes: [] });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, notes: byDay.get(day) || [], isToday: isSameDay(new Date(year, month, day), new Date()) });
  }

  // تکمیل خانه‌های خالی انتهای جدول تا تعداد خانه‌ها همیشه مضرب ۷ باشد
  // (وگرنه ستون‌های گرید CSS در ردیف آخر جابه‌جا رندر می‌شوند)
  const remainder = cells.length % 7;

  if (remainder !== 0) {
    const trailing = 7 - remainder;

    for (let index = 0; index < trailing; index += 1) {
      cells.push({
        day: null,
        date: '',
        isBlank: true,
        isToday: false,
        isWeekend: false,
        notes: [],
      });
    }
  }

  return { year, month, daysInMonth, cells, weeks: cells.length / 7 };
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ------------------------------------------------------------------ */
/* صفحه‌بندی                                                           */
/* ------------------------------------------------------------------ */

export function paginate(list, page = 1, pageSize = 24) {
  const items = Array.isArray(list) ? list : [];

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    return { items, totalPages: 1, page: 1, total: items.length };
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    page: currentPage,
    total: items.length,
  };
}

/* ------------------------------------------------------------------ */
/* آمار                                                                */
/* ------------------------------------------------------------------ */

export function getNoteStats(notes) {
  const list = Array.isArray(notes) ? notes : [];
  const active = list.filter((note) => !note.trashed);

  const tasks = active.reduce(
    (acc, note) => {
      for (const block of note.blocks || []) {
        if (block.type !== 'task') continue;

        for (const item of block.items || []) {
          acc.total += 1;
          if (item.done) acc.done += 1;
        }
      }
      return acc;
    },
    { total: 0, done: 0 }
  );

  return {
    total: list.length,
    active: active.length,
    favorites: active.filter((note) => note.favorite).length,
    pinned: active.filter((note) => note.pinned).length,
    archived: active.filter((note) => note.archived).length,
    trashed: list.filter((note) => note.trashed).length,
    withChecklist: active.filter((note) =>
      (note.blocks || []).some((block) => block.type === 'task' && (block.items || []).length > 0)
    ).length,
    withReminder: active.filter((note) => (note.reminders || []).length > 0).length,
    withAttachment: active.filter((note) => (note.attachments || []).length > 0).length,
    overdue: active.filter(isOverdue).length,
    todayDue: active.filter(isDueToday).length,
    tasksTotal: tasks.total,
    tasksDone: tasks.done,
    completionRatio: tasks.total === 0 ? 0 : tasks.done / tasks.total,
    blocksTotal: active.reduce((sum, note) => sum + (note.blocks || []).length, 0),
    categories: countBy(active, (note) => note.category || 'بدون دسته'),
    colors: NOTE_COLORS.map((color) => ({
      color,
      count: active.filter((note) => note.color === color).length,
    })),
    priorities: NOTE_PRIORITIES.map((priority) => ({
      priority,
      count: active.filter((note) => note.priority === priority).length,
    })),
    allTags: countBy(
      active.flatMap((note) => note.tags || []),
      (tag) => tag
    ),
  };
}

function countBy(list, keyFn) {
  const map = new Map();

  for (const item of list) {
    const key = keyFn(item);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** یادداشت‌هایی که مدت زیادی به‌روز نشده‌اند */
export function getNeglectedNotes(notes, days = 14, limit = 5) {
  const threshold = Date.now() - days * 86400000;

  return (Array.isArray(notes) ? notes : [])
    .filter((note) => !note.trashed && note.status !== 'done')
    .filter((note) => new Date(note.updatedAt || note.createdAt || 0).getTime() < threshold)
    .sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0))
    .slice(0, limit);
}
