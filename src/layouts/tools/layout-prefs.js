// src/layouts/tools/layout-prefs.js

/**
 * ViXoRa Tools Layout Prefs — موتور شخصی‌سازی کابین ابزارها
 * تم، رنگ اصلی، حالت سایدبار، ویجت‌ها، چیدمان منو، پریست‌ها
 */

const PREFS_KEY = 'ViXoRa:layout-prefs-v2';
const LEGACY_SIDEBAR_KEY = 'vixora.tools.sidebar.open';

export const SIDEBAR_MODES = ['open', 'collapsed', 'hidden'];

export const BG_MOODS = {
  midnight: { label: 'نیمه‌شب', bg: '#070b14' },
  abyss: { label: 'مغاک', bg: '#04070f' },
  royal: { label: 'سلطنتی', bg: '#0c0716' },
};

export const ACCENTS = {
  cyan: { label: 'فیروزه‌ای', a: '#00f0ff', b: '#5a89ff' },
  violet: { label: 'بنفش', a: '#a78bfa', b: '#ec4899' },
  green: { label: 'زمردی', a: '#2dffb2', b: '#00c2ff' },
  amber: { label: 'کهربایی', a: '#ffd166', b: '#ff7a3d' },
  rose: { label: 'رز', a: '#ff5d7a', b: '#ff9f43' },
  blue: { label: 'آبی', a: '#4d9dff', b: '#7a5cff' },
};

export const DEFAULT_WIDGETS = {
  search: true,
  music: true,
  clock: true,
  net: true,
  statusbar: true,
  sidebarUser: true,
  logoAnim: true,
  badges: true,
};

const DEFAULT_PREFS = {
  sidebar: 'open',
  sidebarSide: 'right',
  mood: 'midnight',
  accent: 'cyan',
  customA: '#00f0ff',
  customB: '#5a89ff',
  useCustom: false,
  glow: 1, // 0..1.5 شدت درخشش
  widgets: { ...DEFAULT_WIDGETS },
  density: 'comfortable',
  motion: true,
  seconds: true,
  navOrder: null, // [{ link, group }]
  presets: [], // [{ name, prefs }]
  recent: [], // [link, ...] آخرین ابزارها
};

function migrateLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_SIDEBAR_KEY);
    if (raw === '0') return { sidebar: 'collapsed' };
  } catch {
    /* ignore */
  }
  return {};
}

function load() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {};
  } catch {
    saved = {};
  }
  const legacy = Object.keys(saved).length ? {} : migrateLegacy();
  return {
    ...DEFAULT_PREFS,
    ...legacy,
    ...saved,
    widgets: { ...DEFAULT_WIDGETS, ...(saved.widgets || {}) },
  };
}

let prefs = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function getLayoutPrefs() {
  return { ...prefs, widgets: { ...prefs.widgets } };
}

export function setLayoutPrefs(patch = {}) {
  prefs = { ...prefs, ...patch };
  if (patch.widgets) prefs.widgets = { ...prefs.widgets, ...patch.widgets };
  persist();
  emit();
  return getLayoutPrefs();
}

export function toggleLayoutWidget(key) {
  const widgets = { ...prefs.widgets, [key]: !prefs.widgets[key] };
  return setLayoutPrefs({ widgets });
}

export function cycleSidebarMode() {
  const i = SIDEBAR_MODES.indexOf(prefs.sidebar);
  const next = SIDEBAR_MODES[(i + 1) % SIDEBAR_MODES.length];
  return setLayoutPrefs({ sidebar: next });
}

export function pushRecent(link) {
  if (!link || !link.startsWith('/tools/')) return;
  const recent = [link, ...prefs.recent.filter((l) => l !== link)].slice(0, 6);
  prefs = { ...prefs, recent };
  persist();
  emit();
}

export function savePreset(name) {
  const clean = String(name || '').trim().slice(0, 30);
  if (!clean) return null;
  const { presets, recent, navOrder, ...snap } = prefs;
  const entry = { name: clean, prefs: JSON.parse(JSON.stringify({ ...snap, widgets: { ...snap.widgets } })) };
  const next = [...prefs.presets.filter((p) => p.name !== clean), entry].slice(-12);
  setLayoutPrefs({ presets: next });
  return entry;
}

export function deletePreset(name) {
  setLayoutPrefs({ presets: prefs.presets.filter((p) => p.name !== name) });
}

export function applyPreset(name) {
  const entry = prefs.presets.find((p) => p.name === name);
  if (!entry) return null;
  const { presets, recent, navOrder } = prefs;
  prefs = { ...DEFAULT_PREFS, ...entry.prefs, presets, recent, navOrder };
  persist();
  emit();
  return getLayoutPrefs();
}

export function resetLayoutPrefs() {
  const { presets, recent, navOrder } = prefs;
  prefs = { ...DEFAULT_PREFS, presets, recent, navOrder, widgets: { ...DEFAULT_WIDGETS } };
  persist();
  emit();
  return getLayoutPrefs();
}

export function onLayoutPrefsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  const snap = getLayoutPrefs();
  for (const fn of [...listeners]) {
    try {
      fn(snap);
    } catch {
      /* ignore */
    }
  }
}

export function accentVars(p = prefs) {
  if (p.useCustom) return { a: p.customA, b: p.customB };
  const preset = ACCENTS[p.accent] || ACCENTS.cyan;
  return { a: preset.a, b: preset.b };
}

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 240, 255];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** استایل اینلاین روت لایوت از روی prefs */
export function prefsToStyle(p = prefs) {
  const { a, b } = accentVars(p);
  const [r, g, bl] = hexToRgb(a);
  const mood = BG_MOODS[p.mood] || BG_MOODS.midnight;
  const glow = Math.min(1.5, Math.max(0, Number(p.glow) || 0));
  return [
    `--vcr-accent:${a}`,
    `--vcr-accent-2:${b}`,
    `--vcr-accent-rgb:${r},${g},${bl}`,
    `--vcr-glow-op:${glow}`,
    `--vcr-bg:${mood.bg}`,
  ].join(';');
}
