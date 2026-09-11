// src/layouts/tools/toolsLayout.js

/**
 * ViXoRa Tools Layout — کابین خلبان 🛩️
 * ==================================================================
 * سایدبار ۳حالته (باز/جمع/محو) • گلایدر اکتیو • ساعت فلیپ • پینگ واقعی
 * موزیک‌بار سراسری • لاگ فعالیت • پالت فرمان • شخصی‌سازی کامل • تم/زبان
 * سازگار با Router layout API: render / afterRender / getOutlet / destroy
 */

import {
  getLayoutPrefs,
  setLayoutPrefs,
  toggleLayoutWidget,
  cycleSidebarMode,
  pushRecent,
  savePreset,
  deletePreset,
  applyPreset,
  resetLayoutPrefs,
  onLayoutPrefsChange,
  ACCENTS,
  BG_MOODS,
  prefsToStyle,
} from './layout-prefs.js';

import {
  logActivity,
  getActivities,
  clearActivities,
  onActivity,
  timeAgoFa,
} from './activity-log.js';

import { getLang, setLang, onLangChange, LANGUAGES, LANGUAGE_META } from '../../core/i18n/i18n.js';
import { appStore } from '../../core/state/app-state.js';
import {
  selectUserDisplayName,
  selectUserRole,
  selectUserPlan,
  selectUserAvatar,
  selectCurrentUser,
} from '../../core/state/selectors.js';

import {
  subscribeMusicPlayer,
  getPlayerState,
  togglePlayback,
  nextTrack,
  prevTrack,
} from '../../core/services/music-player-service.js';

import { logout } from '../../core/services/auth-service.js';

/* ================================================================== */
/* داده ایستا: منو                                                        */
/* ================================================================== */

const MENU = [
  {
    id: 'main',
    title: { fa: 'اصلی', en: 'Main', ar: 'الرئيسية', fr: 'Principal' },
    items: [
      { link: '/tools/dashboard', emoji: '📊', icon: '/src/global/img/sticker/header/dashboard_layout.svg', badge: null, title: { fa: 'داشبورد', en: 'Dashboard', ar: 'لوحة التحكم', fr: 'Tableau de bord' } },
      { link: '/tools/customerInfo', emoji: '🧑‍💼', icon: '/src/global/img/sticker/header/invoice.svg', badge: null, title: { fa: 'اطلاعات مشتریان', en: 'Customers', ar: 'العملاء', fr: 'Clients' } },
      { link: '/tools/invoices', emoji: '💰', icon: '/src/global/img/sticker/header/invoice.svg', badge: null, title: { fa: 'صورت‌حساب‌ها', en: 'Finance', ar: 'المالية', fr: 'Finance' } },
    ],
  },
  {
    id: 'finance',
    title: { fa: 'مدیریت و مالی', en: 'Manage & Finance', ar: 'الإدارة والمالية', fr: 'Gestion & finance' },
    items: [
      { link: '/tools/building', emoji: '🏢', icon: '/src/global/img/sticker/header/apartment.svg', badge: null, title: { fa: 'مدیریت ساختمان', en: 'Building', ar: 'إدارة المبنى', fr: 'Immeuble' } },
      { link: '/tools/savingsCircle', emoji: '🏠', icon: '/src/global/img/sticker/header/interior.svg', badge: null, title: { fa: 'وام‌های خانگی', en: 'Home loans', ar: 'قروض منزلية', fr: 'Prêts maison' } },
      { link: '/tools/bankLoans', emoji: '🏦', icon: '/src/global/img/sticker/header/bank.svg', badge: null, title: { fa: 'وام‌های بانکی', en: 'Bank loans', ar: 'قروض بنكية', fr: 'Prêts bancaires' } },
      { link: '/tools/financial-goals', emoji: '🎯', icon: '/src/global/img/sticker/header/combo_chart.svg', badge: 'new', title: { fa: 'اهداف مالی', en: 'Money goals', ar: 'أهداف مالية', fr: 'Objectifs' } },
    ],
  },
  {
    id: 'personal',
    title: { fa: 'شخصی و بهره‌وری', en: 'Personal & Focus', ar: 'الشخصية والإنتاجية', fr: 'Perso & productivité' },
    items: [
      { link: '/tools/music', emoji: '🎵', icon: '/src/global/img/sticker/header/GameController.svg', badge: 'new', title: { fa: 'موزیک پلیر', en: 'Music', ar: 'الموسيقى', fr: 'Musique' } },
      { link: '/tools/resume', emoji: '📄', icon: '/src/global/img/sticker/header/resume.svg', badge: null, title: { fa: 'ایجاد رزومه', en: 'Resume', ar: 'السيرة الذاتية', fr: 'CV' } },
      { link: '/tools/note', emoji: '📝', icon: '/src/global/img/sticker/header/note.svg', badge: '۱۲', title: { fa: 'یادداشت‌ها', en: 'Notes', ar: 'الملاحظات', fr: 'Notes' } },
      { link: '/tools/task', emoji: '✅', icon: '/src/global/img/sticker/header/task.svg', badge: '۵', title: { fa: 'وظایف', en: 'Tasks', ar: 'المهام', fr: 'Tâches' } },
      { link: '/tools/habits', emoji: '🔥', icon: '/src/global/img/sticker/header/no_celery.svg', badge: null, title: { fa: 'عادت‌ها', en: 'Habits', ar: 'العادات', fr: 'Habitudes' } },
      { link: '/tools/entertainment', emoji: '🎮', icon: '/src/global/img/sticker/header/GameController.svg', badge: null, title: { fa: 'سرگرمی', en: 'Fun', ar: 'الترفيه', fr: 'Loisirs' } },
    ],
  },
  {
    id: 'support',
    title: { fa: 'پشتیبانی و حساب', en: 'Support & Account', ar: 'الدعم والحساب', fr: 'Support & compte' },
    items: [
      { link: '/tools/support', emoji: '💬', icon: '/src/global/img/sticker/header/online_support.svg', badge: null, title: { fa: 'ارتباط با پشتیبانی', en: 'Support', ar: 'الدعم', fr: 'Support' } },
      { link: '/tools/tickets', emoji: '🎫', icon: '/src/global/img/sticker/header/send.svg', badge: '۲', title: { fa: 'تیکت‌ها', en: 'Tickets', ar: 'التذاكر', fr: 'Tickets' } },
      { link: '/logout', emoji: '🚪', icon: '/src/global/img/sticker/header/logout.svg', badge: null, isLogout: true, title: { fa: 'خروج از اکانت', en: 'Log out', ar: 'تسجيل الخروج', fr: 'Déconnexion' } },
    ],
  },
];

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300f0ff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>'
  );

/* ================================================================== */
/* دیکشنری کروم لایوت                                                     */
/* ================================================================== */

const LT = {
  searchPh: { fa: 'جستجوی سریع در ابزارها و دستورات...', en: 'Quick search tools & commands...', ar: 'بحث سريع في الأدوات والأوامر...', fr: 'Recherche rapide outils & commandes...' },
  brandSub: { fa: 'سکوی مدیریت یکپارچه', en: 'Unified Management Platform', ar: 'منصة إدارة موحدة', fr: 'Plateforme unifiée' },
  musicIdle: { fa: 'چی پخش کنیم؟', en: 'What shall we play?', ar: 'ماذا نشغّل؟', fr: 'On écoute quoi ?' },
  musicOpen: { fa: 'موزیک پلیر', en: 'Music player', ar: 'مشغّل الموسيقى', fr: 'Lecteur musique' },
  netOffline: { fa: 'آفلاین', en: 'Offline', ar: 'غير متصل', fr: 'Hors ligne' },
  netCheck: { fa: '...', en: '...', ar: '...', fr: '...' },
  actTitle: { fa: 'فعالیت‌های من', en: 'My activity', ar: 'نشاطي', fr: 'Mon activité' },
  actEmpty: { fa: 'هنوز فعالیتی ثبت نشده. بچرخ تو ابزارها! 🚀', en: 'No activity yet. Go explore! 🚀', ar: 'لا نشاط بعد. استكشف! 🚀', fr: 'Aucune activité. Explorez ! 🚀' },
  actClear: { fa: 'پاک‌سازی', en: 'Clear', ar: 'مسح', fr: 'Effacer' },
  userAccount: { fa: 'حساب کاربری', en: 'Account', ar: 'الحساب', fr: 'Compte' },
  profile: { fa: 'پروفایل', en: 'Profile', ar: 'الملف', fr: 'Profil' },
  settings: { fa: 'تنظیمات', en: 'Settings', ar: 'الإعدادات', fr: 'Réglages' },
  soon: { fa: 'به‌زودی میاد! ✨', en: 'Coming soon! ✨', ar: 'قريباً! ✨', fr: 'Bientôt ! ✨' },
  logout: { fa: 'خروج', en: 'Log out', ar: 'خروج', fr: 'Sortie' },
  loggedOut: { fa: 'به‌زودی برمی‌گردی؟ 👋', en: 'See you soon! 👋', ar: 'نراك قريباً! 👋', fr: 'À bientôt ! 👋' },
  memberSince: { fa: 'عضویت', en: 'Member since', ar: 'عضو منذ', fr: 'Membre depuis' },
  sideToggle: { fa: 'حالت منو: باز ← جمع ← محو', en: 'Menu mode: open ← narrow ← hidden', ar: 'وضع القائمة', fr: 'Mode du menu' },
  fabOpen: { fa: 'باز کردن منو', en: 'Open menu', ar: 'فتح القائمة', fr: 'Ouvrir le menu' },
  fullscreen: { fa: 'حالت تمرکز', en: 'Focus mode', ar: 'وضع التركيز', fr: 'Mode focus' },
  customize: { fa: 'شخصی‌سازی', en: 'Customize', ar: 'تخصيص', fr: 'Personnaliser' },
  help: { fa: 'راهنما و شرتکات‌ها', en: 'Help & shortcuts', ar: 'المساعدة والاختصارات', fr: 'Aide & raccourcis' },
  lang: { fa: 'زبان', en: 'Language', ar: 'اللغة', fr: 'Langue' },
  gRecent: { fa: 'اخیر', en: 'Recent', ar: 'الأخيرة', fr: 'Récents' },
  gTools: { fa: 'ابزارها', en: 'Tools', ar: 'الأدوات', fr: 'Outils' },
  gActions: { fa: 'دستورات', en: 'Actions', ar: 'الأوامر', fr: 'Actions' },
  cmdkHint: { fa: '↑↓ انتخاب • Enter اجرا • Esc بستن', en: '↑↓ select • Enter run • Esc close', ar: '↑↓ اختيار • Enter تنفيذ • Esc إغلاق', fr: '↑↓ choisir • Enter lancer • Esc fermer' },
  cmdkEmpty: { fa: 'چیزی پیدا نشد. یه‌جور دیگه بگو! 🔍', en: 'Nothing found. Try again! 🔍', ar: 'لا نتائج! 🔍', fr: 'Rien trouvé ! 🔍' },
  newBadge: { fa: 'جدید', en: 'New', ar: 'جديد', fr: 'Nouveau' },
  // شخصی‌سازی
  cTheme: { fa: 'تم پس‌زمینه', en: 'Background theme', ar: 'سمة الخلفية', fr: 'Thème de fond' },
  cAccent: { fa: 'رنگ اصلی', en: 'Accent color', ar: 'اللون الرئيسي', fr: 'Couleur principale' },
  cCustom: { fa: 'رنگ دلخواه', en: 'Custom colors', ar: 'ألوان مخصصة', fr: 'Couleurs perso' },
  cGlow: { fa: 'شدت درخشش', en: 'Glow intensity', ar: 'شدة التوهج', fr: 'Intensité du glow' },
  cSidebar: { fa: 'حالت سایدبار', en: 'Sidebar mode', ar: 'وضع القائمة', fr: 'Mode sidebar' },
  cSide: { fa: 'جای سایدبار', en: 'Sidebar side', ar: 'جهة القائمة', fr: 'Côté sidebar' },
  cRight: { fa: 'راست', en: 'Right', ar: 'يمين', fr: 'Droite' },
  cLeft: { fa: 'چپ', en: 'Left', ar: 'يسار', fr: 'Gauche' },
  mOpen: { fa: 'باز', en: 'Open', ar: 'مفتوحة', fr: 'Ouvert' },
  mCollapsed: { fa: 'جمع', en: 'Narrow', ar: 'مصغّرة', fr: 'Réduit' },
  mHidden: { fa: 'محو', en: 'Hidden', ar: 'مخفية', fr: 'Caché' },
  cWidgets: { fa: 'ویجت‌ها', en: 'Widgets', ar: 'الودجات', fr: 'Widgets' },
  cDensity: { fa: 'تراکم', en: 'Density', ar: 'الكثافة', fr: 'Densité' },
  cComfy: { fa: 'راحت', en: 'Comfy', ar: 'مريحة', fr: 'Confort' },
  cCompact: { fa: 'فشرده', en: 'Compact', ar: 'مضغوطة', fr: 'Compact' },
  cMotion: { fa: 'انیمیشن‌ها', en: 'Animations', ar: 'الحركة', fr: 'Animations' },
  cSeconds: { fa: 'ثانیه‌شمار', en: 'Seconds', ar: 'الثواني', fr: 'Secondes' },
  cPresets: { fa: 'پریست‌های من', en: 'My presets', ar: 'إعداداتي', fr: 'Mes presets' },
  cPresetPh: { fa: 'اسم این استایل...', en: 'Name this style...', ar: 'اسم هذا الستايل...', fr: 'Nommer ce style...' },
  cSavePreset: { fa: 'ذخیره استایل', en: 'Save style', ar: 'حفظ', fr: 'Sauver' },
  cReset: { fa: 'بازنشانی همه', en: 'Reset all', ar: 'إعادة ضبط', fr: 'Tout réinitialiser' },
  cSaved: { fa: 'استایل ذخیره شد! 💾', en: 'Style saved! 💾', ar: 'تم الحفظ! 💾', fr: 'Style sauvé ! 💾' },
  cApplied: { fa: 'استایل اعمال شد! 🎨', en: 'Style applied! 🎨', ar: 'تم التطبيق! 🎨', fr: 'Style appliqué ! 🎨' },
  wSearch: { fa: 'جستجو', en: 'Search', ar: 'البحث', fr: 'Recherche' },
  wMusic: { fa: 'موزیک‌بار', en: 'Music bar', ar: 'شريط الموسيقى', fr: 'Barre musique' },
  wClock: { fa: 'ساعت', en: 'Clock', ar: 'الساعة', fr: 'Horloge' },
  wNet: { fa: 'وضعیت اتصال', en: 'Connection', ar: 'الاتصال', fr: 'Connexion' },
  wStatusbar: { fa: 'نوار وضعیت', en: 'Status bar', ar: 'شريط الحالة', fr: 'Barre de statut' },
  wSidebarUser: { fa: 'کارت کاربر', en: 'User card', ar: 'بطاقة المستخدم', fr: 'Carte user' },
  wLogoAnim: { fa: 'انیمیشن لوگو', en: 'Logo animation', ar: 'حركة الشعار', fr: 'Anim du logo' },
  wBadges: { fa: 'بج‌ها', en: 'Badges', ar: 'الشارات', fr: 'Badges' },
  focusExit: { fa: 'خروج از تمرکز', en: 'Exit focus', ar: 'خروج من التركيز', fr: 'Quitter le focus' },
  focusOn: { fa: 'حالت تمرکز فعال شد 🎯', en: 'Focus mode on 🎯', ar: 'وضع التركيز يعمل 🎯', fr: 'Mode focus activé 🎯' },
  focusOff: { fa: 'حالت تمرکز خاموش شد', en: 'Focus mode off', ar: 'تم إيقاف التركيز', fr: 'Mode focus off' },
  fsOn: { fa: 'تمام‌صفحه شدی! ⛶', en: 'Fullscreen! ⛶', ar: 'ملء الشاشة! ⛶', fr: 'Plein écran ! ⛶' },
  shuffled: { fa: 'غافلگیر شدی؟ 🎲', en: 'Surprised? 🎲', ar: 'مفاجأة؟ 🎲', fr: 'Surpris ? 🎲' },
  party: { fa: 'پارتی مود! 🎉', en: 'Party mode! 🎉', ar: 'وضع الحفلة! 🎉', fr: 'Party mode ! 🎉' },
  hidden: { fa: 'منو محو شد! گوی پایین رو بزن 👁️', en: 'Menu vanished! Hit the orb 👁️', ar: 'اختفت القائمة! 👁️', fr: 'Menu disparu ! 👁️' },
  helpSearchPh: { fa: 'فیلتر شرتکات‌ها و قابلیت‌ها...', en: 'Filter shortcuts & features...', ar: 'تصفية الاختصارات...', fr: 'Filtrer raccourcis...' },
  hShortcuts: { fa: '⌨️ شرتکات‌ها', en: '⌨️ Shortcuts', ar: '⌨️ الاختصارات', fr: '⌨️ Raccourcis' },
  hFeatures: { fa: '🚀 قابلیت‌ها', en: '🚀 Features', ar: '🚀 المميزات', fr: '🚀 Fonctionnalités' },
  hCustom: { fa: '🎨 شخصی‌سازی', en: '🎨 Customizing', ar: '🎨 التخصيص', fr: '🎨 Personnalisation' },
  hInteract: { fa: '✨ تعامل‌ها', en: '✨ Interactions', ar: '✨ التفاعلات', fr: '✨ Interactions' },
};

function lt(key) {
  const lang = getLang();
  return LT[key]?.[lang] ?? LT[key]?.en ?? LT[key]?.fa ?? key;
}

/* ================================================================== */
/* شرتکات‌ها، نکات، راهنما                                                */
/* ================================================================== */

const SHORTCUT_GROUPS = [
  { id: 'nav', title: { fa: '🧭 ناوبری', en: '🧭 Navigation' } },
  { id: 'music', title: { fa: '🎵 موزیک', en: '🎵 Music' } },
  { id: 'view', title: { fa: '🎨 نما و تم', en: '🎨 View & theme' } },
  { id: 'sys', title: { fa: '⚙️ سیستم', en: '⚙️ System' } },
];

const SHORTCUTS = [
  { g: 'nav', keys: 'Ctrl + K', desc: { fa: 'پالت فرمان: جستجوی ابزار + اجرای دستور', en: 'Command palette: search tools + run actions' } },
  { g: 'nav', keys: 'Ctrl + B / Alt + S', desc: { fa: 'چرخه سایدبار: باز ← جمع ← محو', en: 'Cycle sidebar: open ← narrow ← hidden' } },
  { g: 'nav', keys: 'Alt + 1..0', desc: { fa: 'پرش مستقیم به ۱۰ ابزار اول', en: 'Jump straight to the first 10 tools' } },
  { g: 'nav', keys: 'Alt + A', desc: { fa: 'پنل فعالیت‌های من', en: 'My activity panel' } },
  { g: 'nav', keys: 'Alt + C', desc: { fa: 'دراور شخصی‌سازی', en: 'Customization drawer' } },
  { g: 'nav', keys: '?', desc: { fa: 'این راهنما (؟)', en: 'This guide (?)' } },
  { g: 'music', keys: 'Alt + M', desc: { fa: 'پخش / توقف موزیک از هرجا', en: 'Play / pause music from anywhere' } },
  { g: 'music', keys: 'Alt + .', desc: { fa: 'آهنگ بعدی', en: 'Next track' } },
  { g: 'music', keys: 'Alt + ,', desc: { fa: 'آهنگ قبلی', en: 'Previous track' } },
  { g: 'music', keys: 'Alt + G', desc: { fa: 'پرش به موزیک پلیر', en: 'Jump to music player' } },
  { g: 'view', keys: 'Alt + F', desc: { fa: 'حالت تمرکز (مخفی شدن کروم)', en: 'Focus mode (hide the chrome)' } },
  { g: 'view', keys: 'Alt + Shift + F', desc: { fa: 'تمام‌صفحه واقعی مرورگر', en: 'Real browser fullscreen' } },
  { g: 'view', keys: 'Alt + T', desc: { fa: 'غافلگیرم کن: تم و رنگ تصادفی', en: 'Surprise me: random theme + accent' } },
  { g: 'view', keys: 'Alt + Shift + T', desc: { fa: 'چرخه رنگ اصلی', en: 'Cycle accent color' } },
  { g: 'view', keys: 'Alt + Shift + P', desc: { fa: 'پارتی مود! (خطرناک 😄)', en: 'Party mode! (dangerous 😄)' } },
  { g: 'sys', keys: 'Alt + L', desc: { fa: 'چرخه زبان (۴ زبان)', en: 'Cycle language (4 langs)' } },
  { g: 'sys', keys: 'Esc', desc: { fa: 'بستن بالاترین پنجره', en: 'Close the topmost overlay' } },
];

const TIPS = {
  fa: [
    'با Alt + T یه تم تصادفی غافلگیرت می‌کنه 🎲',
    'آیتم‌های منو رو می‌تونی با درگ جابه‌جا کنی ✋',
    'موزیک رو از همین بالا کنترل کن؛ لازم نیست برگردی 🎵',
    'سه بار روی دکمه منو بزن تا محو بشه، بعد گوی جادویی میاد 👁️',
    'استایل خودت رو بساز و ذخیره کن، بعد اسکرین‌شات بفرست 📸',
    'کلید ؟ رو بزن؛ یه دنیا شرتکات یاد می‌گیری ⌨️',
    'Alt + Shift + P رو فقط اگه جرئت داری بزن 🎉',
  ],
  en: [
    'Alt + T surprises you with a random theme 🎲',
    'Drag menu items to reorder them ✋',
    'Control music from up here; no need to go back 🎵',
    'Cycle the menu button to vanish it, then the magic orb appears 👁️',
    'Build your own style, save it, screenshot it 📸',
    'Press ? and learn a world of shortcuts ⌨️',
    'Press Alt + Shift + P only if you dare 🎉',
  ],
};

const FEATURES_GUIDE = [
  { icon: '🔎', fa: 'پالت فرمان (Ctrl+K): ابزارها، دستورات و اخیرها با جستجوی فازی', en: 'Command palette (Ctrl+K): tools, actions & recents with fuzzy search' },
  { icon: '👁️', fa: 'سایدبار ۳حالته با انیمیشن محو و گوی جادویی بازگشت', en: '3-state sidebar with vanish animation and magic return orb' },
  { icon: '🌊', fa: 'گلایدر اکتیو: نشانگر نئونی با پرواز کشسان بین ابزارها', en: 'Active glider: neon indicator that warps between tools' },
  { icon: '🕐', fa: 'ساعت فلیپ با تاریخ شمسی/میلادی و نوار پیشرفت روز', en: 'Flip clock with Jalali/Gregorian date and day-progress bar' },
  { icon: '📶', fa: 'پینگ واقعی: اندازه‌گیری زنده تأخیر + نوع شبکه', en: 'Real ping: live latency measurement + network type' },
  { icon: '🎵', fa: 'موزیک‌بار سراسری: کنترل پخش از هر ابزاری', en: 'Global music bar: control playback from any tool' },
  { icon: '📜', fa: 'لاگ فعالیت: همه کارهات ثبت میشه و زنگوله خبرت می‌کنه', en: 'Activity log: everything is tracked, the bell tells you' },
  { icon: '🌍', fa: '۴ زبان زنده با تغییر جهت خودکار صفحه', en: '4 live languages with automatic direction switch' },
  { icon: '⛶', fa: 'حالت تمرکز + تمام‌صفحه واقعی برای ابزارها', en: 'Focus mode + real fullscreen for tools' },
  { icon: '🎉', fa: 'پارتی مود: فقط امتحانش کن...', en: 'Party mode: just try it...' },
];

const CUSTOM_GUIDE = [
  { icon: '🎨', fa: '۶ رنگ اصلی + ۲ رنگ دلخواه + شدت درخشش', en: '6 accents + 2 custom colors + glow intensity' },
  { icon: '🌌', fa: '۳ تم پس‌زمینه: نیمه‌شب، مغاک، سلطنتی', en: '3 background moods: midnight, abyss, royal' },
  { icon: '🧩', fa: '۸ ویجت قابل خاموش/روشن: لایوت رو کوچیک و بزرگ کن', en: '8 toggleable widgets: shrink or grow the layout' },
  { icon: '↔️', fa: 'سایدبار راست یا چپ، باز یا جمع یا محو', en: 'Sidebar right or left, open or narrow or hidden' },
  { icon: '💾', fa: 'پریست نامحدود: استایلت رو ذخیره کن و هر وقت خواستی برگردون', en: 'Unlimited presets: save your style and restore anytime' },
];

const INTERACT_GUIDE = [
  { icon: '✋', fa: 'درگ آیتم‌های منو برای جابه‌جایی (ترتیب ذخیره میشه)', en: 'Drag menu items to reorder (order is saved)' },
  { icon: '🔔', fa: 'زنگوله: با هر فعالیت جدید می‌لرزه و می‌درخشه', en: 'The bell shakes and glows on every new activity' },
  { icon: '💿', fa: 'کاور موزیک موقع پخش می‌چرخه و اکولایزر می‌رقصه', en: 'Cover spins while playing and the equalizer dances' },
  { icon: '⏱️', fa: 'ثانیه‌شمار ساعت با هر تیک یه پالس می‌زنه', en: 'Clock seconds pulse on every tick' },
  { icon: '🪄', fa: 'گوی جادویی: وقتی منو محوه، راه برگشتته', en: 'The magic orb: your way back when the menu is gone' },
];

function helpLang() {
  const l = getLang();
  return l === 'fa' ? 'fa' : 'en';
}

/* ================================================================== */
/* ابزار کوچک                                                             */
/* ================================================================== */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normSearch(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .trim();
}

function fuzzyScore(query, text) {
  const q = normSearch(query);
  const t = normSearch(text);
  if (!q) return 1;
  if (t.includes(q)) return 200 - t.indexOf(q);
  let qi = 0;
  let score = 0;
  let last = -2;
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) {
      score += last === i - 1 ? 3 : 1;
      last = i;
      qi += 1;
    }
  }
  return qi === q.length ? score : -1;
}

/** پچ یک‌باره history برای تشخیص ناوبری SPA */
function patchHistoryOnce() {
  if (typeof window === 'undefined' || window.__vcrHistPatched) return;
  window.__vcrHistPatched = true;
  for (const m of ['pushState', 'replaceState']) {
    try {
      const orig = window.history[m].bind(window.history);
      window.history[m] = (...args) => {
        const r = orig(...args);
        window.dispatchEvent(new Event('vixora:navigate'));
        return r;
      };
    } catch {
      /* ignore */
    }
  }
}

function navigateTo(href) {
  if (!href) return;
  if (href === window.location.pathname) return;
  window.history.pushState({}, '', href);
  window.dispatchEvent(new Event('vixora:navigate'));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/* ================================================================== */
/* فکتوری لایوت                                                            */
/* ================================================================== */

export function createToolsLayout() {
  let root = null;
  let outlet = null;
  const teardown = [];
  const intervals = [];
  const unsubs = [];
  let destroyed = false;

  let cmdkOpen = false;
  let openPopover = null; // 'activity' | 'user' | 'lang' | null
  let customizeOpen = false;
  let helpOpen = false;
  let mobileNavOpen = false;
  let mqMobile = null;
  let langHome = null; // جایگاه اصلی دکمه زبان در هدر
  let focusMode = false;
  let lastSeenActivity = 0;
  try {
    lastSeenActivity = Number(localStorage.getItem('ViXoRa:layout-activity-seen') || 0);
  } catch {
    /* ignore */
  }

  let navGroups = [];
  let cmdkActiveIndex = 0;
  let cmdkFlat = [];
  let partyTimer = null;
  let tipIndex = 0;
  let vanishTimer = null;

  const refs = {};

  function on(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    teardown.push(() => {
      try {
        target.removeEventListener(type, handler, options);
      } catch {
        /* ignore */
      }
    });
  }

  function every(ms, fn) {
    fn();
    const id = window.setInterval(() => {
      if (!destroyed) fn();
    }, ms);
    intervals.push(id);
    return id;
  }

  function qs(sel) {
    return root ? root.querySelector(sel) : null;
  }

  function qsa(sel) {
    return root ? [...root.querySelectorAll(sel)] : [];
  }

  /* ---------------- منو: ساختار + ترتیب ---------------- */

  function flatMenu() {
    const out = [];
    for (const g of MENU) for (const it of g.items) out.push({ ...it, group: g.id });
    return out;
  }

  function buildNavGroups() {
    const prefs = getLayoutPrefs();
    const byLink = new Map(flatMenu().map((i) => [i.link, i]));
    const groups = MENU.map((g) => ({ id: g.id, title: g.title, items: [] }));
    const gmap = new Map(groups.map((g) => [g.id, g]));
    const placed = new Set();
    if (Array.isArray(prefs.navOrder)) {
      for (const row of prefs.navOrder) {
        const item = byLink.get(row.link);
        const g = gmap.get(row.group);
        if (item && g && !placed.has(item.link)) {
          g.items.push({ ...item });
          placed.add(item.link);
        }
      }
    }
    for (const g of MENU) {
      for (const it of g.items) {
        if (!placed.has(it.link)) {
          gmap.get(g.id).items.push({ ...it });
          placed.add(it.link);
        }
      }
    }
    navGroups = groups.filter((g) => g.items.length);
  }

  function persistNavOrder() {
    const order = [];
    for (const g of navGroups) for (const it of g.items) order.push({ link: it.link, group: g.id });
    setLayoutPrefs({ navOrder: order });
  }

  function menuTitle(item) {
    const lang = getLang();
    return item.title?.[lang] ?? item.title?.en ?? item.title?.fa ?? '';
  }

  function groupTitle(g) {
    const lang = getLang();
    return g.title?.[lang] ?? g.title?.en ?? g.title?.fa ?? '';
  }

  /* ---------------- رندر ---------------- */

  function renderMenuItem(item, currentPath) {
    const isActive = currentPath === item.link;
    const badge = item.badge === 'new' ? lt('newBadge') : item.badge;
    return (
      '<li class="vcr-menu-item' + (isActive ? ' active' : '') + (item.isLogout ? ' vcr-menu-item--logout' : '') + '" data-link="' + escapeHtml(item.link) + '" draggable="true">' +
      '<a class="vcr-menu-link" href="' + escapeHtml(item.link) + '"' + (item.isLogout ? ' data-logout="1"' : ' data-link') + '>' +
      '<span class="vcr-menu-icon-wrap"><img class="vcr-menu-sticker" data-vcr-avatar src="' + escapeHtml(item.icon) + '" alt=""><span class="vcr-menu-emoji">' + escapeHtml(item.emoji) + '</span></span>' +
      '<span class="vcr-menu-text">' + escapeHtml(menuTitle(item)) + '</span>' +
      (badge ? '<span class="vcr-menu-badge">' + escapeHtml(badge) + '</span>' : '') +
      '</a>' +
      '<span class="vcr-collapsed-tooltip" role="tooltip"><span>' + escapeHtml(menuTitle(item)) + '</span>' +
      (badge ? '<small class="vcr-tooltip-badge">' + escapeHtml(badge) + '</small>' : '') + '</span>' +
      '</li>'
    );
  }

  function renderMenu(currentPath) {
    return (
      '<div class="vcr-menu" id="vcrMenu">' +
      '<div class="vcr-active-glider" id="vcrGlider" aria-hidden="true"><span class="vcr-glider-ring"></span></div>' +
      navGroups
        .map(
          (g) =>
            '<div class="vcr-menu-group" data-group="' + escapeHtml(g.id) + '">' +
            '<div class="vcr-menu-group__title">' + escapeHtml(groupTitle(g)) + '</div>' +
            '<ul class="vcr-menu-list">' +
            g.items.map((it) => renderMenuItem(it, currentPath)).join('') +
            '</ul></div>'
        )
        .join('') +
      '</div>'
    );
  }

  function userSnapshot() {
    const st = appStore.getState();
    return {
      name: selectUserDisplayName(st),
      role: selectUserRole(st),
      plan: selectUserPlan(st),
      avatar: selectUserAvatar(st),
      raw: selectCurrentUser(st),
    };
  }

  function roleLabel(role) {
    const lang = getLang();
    if (role === 'admin') return lang === 'fa' ? 'مدیر ارشد' : lang === 'ar' ? 'مدير' : lang === 'fr' ? 'Admin' : 'Admin';
    return lang === 'fa' ? 'کاربر' : lang === 'ar' ? 'مستخدم' : lang === 'fr' ? 'Utilisateur' : 'User';
  }

  function render() {
    buildNavGroups();
    const prefs = getLayoutPrefs();
    const lang = getLang();
    const dir = lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr';
    const currentPath = window.location.pathname || '/';
    const user = userSnapshot();
    const langMeta = LANGUAGE_META[lang] || LANGUAGE_META.fa;

    return (
      '<div class="vcr-layout" id="vcrLayout" dir="' + dir + '" data-sidebar="' + prefs.sidebar + '" data-mood="' + prefs.mood + '" data-accent="' + prefs.accent + '" data-side="' + prefs.sidebarSide + '" data-density="' + prefs.density + '" style="' + prefsToStyle(prefs) + '">' +
      '<div class="vcr-ambient" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="vcr-flash" id="vcrFlash" aria-hidden="true"></div>' +

      /* ---------- هدر ---------- */
      '<header class="vcr-header">' +
      '<button class="vcr-burger" id="vcrBurger" type="button" aria-label="منو | Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<div class="vcr-header__brand">' +
      '<a class="vcr-header__logo-link" href="/" data-link>' +
      '<span class="vcr-logo" aria-hidden="true"><span class="vcr-logo-ring"></span><span class="vcr-logo-core"><span class="vcr-logo-v">V</span><span class="vcr-logo-shine"></span></span><span class="vcr-logo-spark s1"></span><span class="vcr-logo-spark s2"></span><span class="vcr-logo-spark s3"></span></span>' +
      '<span class="vcr-brand-info"><span class="vcr-brand-name">ViXoRa <span class="vcr-badge-version">v3 Pro</span></span>' +
      '<span class="vcr-brand-sub" data-vcr-i18n="brandSub">' + escapeHtml(lt('brandSub')) + '</span></span>' +
      '</a></div>' +

      '<div class="vcr-header__center" data-widget="search">' +
      '<button class="vcr-cmd-btn" id="vcrCmdLauncher" type="button" aria-haspopup="dialog" aria-expanded="false">' +
      '<span class="vcr-cmd-btn__left"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
      '<span data-vcr-i18n="searchPh">' + escapeHtml(lt('searchPh')) + '</span></span>' +
      '<kbd class="vcr-kbd">Ctrl K</kbd></button>' +
      /* موزیک‌بار */
      '<div class="vcr-musicbar" id="vcrMusicbar" data-widget="music">' +
      '<button class="vcr-music-cover" id="vcrMusicCover" type="button" title="' + escapeHtml(lt('musicOpen')) + '"><span class="vcr-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="vcr-music-note">🎵</span></button>' +
      '<button class="vcr-music-meta" id="vcrMusicMeta" type="button"><span class="vcr-music-title" id="vcrMusicTitle"><span>' + escapeHtml(lt('musicIdle')) + '</span></span><span class="vcr-music-sub" id="vcrMusicSub">ViXoRa Radio</span><span class="vcr-music-progress"><i id="vcrMusicProg"></i></span></button>' +
      '<span class="vcr-music-btns"><button class="vcr-mini-btn" id="vcrPrev" type="button" title="⏮ (Alt+,)">⏮</button>' +
      '<button class="vcr-mini-btn vcr-mini-btn--play" id="vcrPlay" type="button" title="▶ (Alt+M)">▶</button>' +
      '<button class="vcr-mini-btn" id="vcrNext" type="button" title="⏭ (Alt+.)">⏭</button></span>' +
      '</div>' +
      '</div>' +

      '<div class="vcr-header__actions">' +
      '<div class="vcr-status-pill" id="vcrNetPill" data-widget="net" title="Ping"><span class="vcr-status-dot is-check" id="vcrNetDot"></span><span class="vcr-status-text" id="vcrNetText">…</span></div>' +
      '<div class="vcr-datetime-card" data-widget="clock" aria-label="clock"><div class="vcr-time" id="vcrTime"><span>--:--</span></div><div class="vcr-date" id="vcrDate">…</div><span class="vcr-daybar"><i id="vcrDaybar"></i></span></div>' +

      '<button class="vcr-action-icon-btn" id="vcrSideCycle" type="button" title="' + escapeHtml(lt('sideToggle')) + '"><span class="vcr-side-ico" id="vcrSideIco">◀</span></button>' +
      '<button class="vcr-action-icon-btn" id="vcrFocusBtn" type="button" title="' + escapeHtml(lt('fullscreen')) + ' (Alt+F)">⛶</button>' +
      '<button class="vcr-action-icon-btn" id="vcrCustBtn" type="button" title="' + escapeHtml(lt('customize')) + ' (Alt+C)">🎨</button>' +
      '<button class="vcr-action-icon-btn" id="vcrHelpBtn" type="button" title="' + escapeHtml(lt('help')) + ' (?)">❔</button>' +

      '<div class="vcr-dropdown-wrapper" id="vcrLangWrap">' +
      '<button class="vcr-action-icon-btn" id="vcrLangBtn" type="button" title="' + escapeHtml(lt('lang')) + ' (Alt+L)" aria-haspopup="menu" aria-expanded="false"><span id="vcrLangFlag">' + escapeHtml(langMeta.flag) + '</span></button>' +
      '<div class="vcr-popover vcr-popover--lang hidden" id="vcrLangPop" role="menu"><div class="vcr-popover__header"><h4 class="vcr-notif-title">' + escapeHtml(lt('lang')) + '</h4></div><div class="vcr-popover__body" id="vcrLangList"></div></div>' +
      '</div>' +

      '<div class="vcr-dropdown-wrapper">' +
      '<button class="vcr-action-icon-btn" id="vcrActBtn" type="button" title="' + escapeHtml(lt('actTitle')) + ' (Alt+A)" aria-haspopup="menu" aria-expanded="false">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' +
      '<span class="vcr-notif-badge hidden" id="vcrActBadge"></span></button>' +
      '<div class="vcr-popover vcr-popover--notif hidden" id="vcrActPop" role="menu"><div class="vcr-popover__header"><h4 class="vcr-notif-title">' + escapeHtml(lt('actTitle')) + '</h4><button class="vcr-chip-btn" id="vcrActClear" type="button">' + escapeHtml(lt('actClear')) + '</button></div><div class="vcr-popover__body" id="vcrActList"></div></div>' +
      '</div>' +

      '<div class="vcr-dropdown-wrapper">' +
      '<button class="vcr-user-pill" id="vcrUserBtn" type="button" aria-haspopup="menu" aria-expanded="false">' +
      '<span class="vcr-avatar"><img data-vcr-avatar id="vcrAvatarImg" src="' + escapeHtml(user.avatar || FALLBACK_AVATAR) + '" alt=""><span class="vcr-avatar-online"></span></span>' +
      '<span class="vcr-user-info"><span class="vcr-user-name" id="vcrUserName">' + escapeHtml(user.name) + '</span><span class="vcr-user-role" id="vcrUserRole">' + escapeHtml(roleLabel(user.role)) + ' • ' + escapeHtml(String(user.plan || 'free')) + '</span></span>' +
      '</button>' +
      '<div class="vcr-popover vcr-popover--user hidden" id="vcrUserPop" role="menu"><div class="vcr-popover__header"><h4 class="vcr-notif-title" data-vcr-i18n="userAccount">' + escapeHtml(lt('userAccount')) + '</h4><span class="vcr-badge-count" id="vcrUserPlan">' + escapeHtml(String(user.plan || 'free')) + '</span></div><div class="vcr-popover__body" id="vcrUserBody"></div></div>' +
      '</div>' +
      '</div>' +
      '</header>' +

      /* ---------- بدنه ---------- */
      '<main class="vcr-body' + (prefs.sidebar === 'collapsed' ? ' is-collapsed' : '') + (prefs.sidebar === 'hidden' ? ' is-hidden' : '') + '" id="vcrBody">' +
      '<section class="vcr-panel-content" id="page-content" data-router-outlet></section>' +
      '<aside class="vcr-sidebar" id="vcrSidebar">' +
      '<button class="vcr-sidebar-toggle" id="vcrSideToggle" type="button" title="' + escapeHtml(lt('sideToggle')) + '"><svg class="vcr-toggle-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg></button>' +
      '<div class="vcr-side-quick" id="vcrSideQuick" role="toolbar" aria-label="دسترسی سریع | Quick">' +
      '<button class="vcr-quick-btn" id="vcrQTheme" type="button" title="تم تصادفی (Alt+T)">🎲<span>تم</span></button>' +
      '<button class="vcr-quick-btn" id="vcrQFocus" type="button" title="تمرکز (Alt+F)">⛶<span>تمرکز</span></button>' +
      '<button class="vcr-quick-btn" id="vcrQCust" type="button" title="شخصی‌سازی (Alt+C)">🎨<span>نما</span></button>' +
      '<button class="vcr-quick-btn" id="vcrQHelp" type="button" title="راهنما (?)">❔<span>راهنما</span></button>' +
      '</div>' +
      '<div class="vcr-sidebar__scroll" id="vcrSideScroll">' + renderMenu(currentPath) + '</div>' +
      '<div class="vcr-side-user" id="vcrSideUser" data-widget="sidebarUser"></div>' +
      '</aside>' +
      '<div class="vcr-backdrop hidden" id="vcrBackdrop" aria-hidden="true"></div>' +
      '</main>' +

      /* گوی جادویی */
      '<button class="vcr-fab' + (prefs.sidebar === 'hidden' ? ' is-show' : '') + '" id="vcrFab" type="button" title="' + escapeHtml(lt('fabOpen')) + '" aria-label="' + escapeHtml(lt('fabOpen')) + '"><span class="vcr-fab-ring"></span><span class="vcr-fab-core">☰</span><span class="vcr-fab-wave"></span></button>' +

      /* نوار وضعیت */
      '<footer class="vcr-statusbar" data-widget="statusbar"><span class="vcr-tip" id="vcrTip"></span><span class="vcr-statusbar__spacer"></span><span class="vcr-statusbar__meta" id="vcrStatusMeta"></span><span class="vcr-statusbar__hint"><kbd class="vcr-kbd vcr-kbd--sm">Ctrl K</kbd> ⌕ <kbd class="vcr-kbd vcr-kbd--sm">?</kbd> ' + escapeHtml(lt('help')) + '</span></footer>' +

      '<nav class="vcr-bottomnav" id="vcrBottomNav" aria-label="ناوبری اصلی | Main">' +
      '<a class="vcr-bottomnav__item" href="/tools/dashboard" data-link data-bnav="/tools/dashboard"><span class="vcr-bottomnav__ico">📊</span><span class="vcr-bottomnav__lbl">داشبورد</span></a>' +
      '<a class="vcr-bottomnav__item" href="/tools/invoices" data-link data-bnav="/tools/invoices"><span class="vcr-bottomnav__ico">💰</span><span class="vcr-bottomnav__lbl">مالی</span></a>' +
      '<a class="vcr-bottomnav__item" href="/tools/building" data-link data-bnav="/tools/building"><span class="vcr-bottomnav__ico">🏢</span><span class="vcr-bottomnav__lbl">ساختمان</span></a>' +
      '<a class="vcr-bottomnav__item" href="/tools/music" data-link data-bnav="/tools/music"><span class="vcr-bottomnav__ico">🎵</span><span class="vcr-bottomnav__lbl">موزیک</span></a>' +
      '<button class="vcr-bottomnav__item" id="vcrBottomMenu" type="button" aria-label="منوی همه ابزارها"><span class="vcr-bottomnav__ico">☰</span><span class="vcr-bottomnav__lbl">منو</span><span class="vcr-bottomnav__dot hidden" id="vcrBottomDot"></span></button>' +
      '</nav>' +

      /* چیپ خروج از تمرکز */
      '<div class="vcr-focus-chip hidden" id="vcrFocusChip"><button class="vcr-chip-btn" id="vcrFocusExit" type="button">🎯 ' + escapeHtml(lt('focusExit')) + ' (Alt+F)</button><button class="vcr-chip-btn" id="vcrFocusPalette" type="button">🔎 Ctrl+K</button></div>' +

      /* پالت فرمان */
      '<div class="vcr-cmdk-overlay hidden" id="vcrCmdk" aria-hidden="true"><div class="vcr-cmdk-dialog" role="dialog" aria-modal="true"><div class="vcr-cmdk-header"><div class="vcr-cmdk-title">⚡ ViXoRa Command</div><button class="vcr-cmdk-close" id="vcrCmdkClose" type="button">×</button></div>' +
      '<div class="vcr-cmdk-input-wrap"><input class="vcr-cmdk-input" id="vcrCmdkInput" type="search" autocomplete="off" placeholder="' + escapeHtml(lt('searchPh')) + '"><div class="vcr-cmdk-hint" data-vcr-i18n="cmdkHint">' + escapeHtml(lt('cmdkHint')) + '</div></div>' +
      '<div class="vcr-cmdk-results" id="vcrCmdkList" role="listbox"></div></div></div>' +

      /* دراور شخصی‌سازی */
      '<div class="vcr-drawer-overlay hidden" id="vcrDrawer"><div class="vcr-drawer" role="dialog" aria-modal="true"><div class="vcr-drawer__head"><h3>🎨 <span data-vcr-i18n="customize">' + escapeHtml(lt('customize')) + '</span></h3><button class="vcr-cmdk-close" id="vcrDrawerClose" type="button">×</button></div><div class="vcr-drawer__body" id="vcrDrawerBody"></div></div></div>' +

      /* مودال راهنما */
      '<div class="vcr-help-overlay hidden" id="vcrHelp"><div class="vcr-help-dialog" role="dialog" aria-modal="true"><div class="vcr-cmdk-header"><div class="vcr-cmdk-title">❔ <span data-vcr-i18n="help">' + escapeHtml(lt('help')) + '</span></div><button class="vcr-cmdk-close" id="vcrHelpClose" type="button">×</button></div>' +
      '<div class="vcr-cmdk-input-wrap"><input class="vcr-cmdk-input" id="vcrHelpFilter" type="search" autocomplete="off" placeholder="' + escapeHtml(lt('helpSearchPh')) + '"></div>' +
      '<div class="vcr-help-body" id="vcrHelpBody"></div></div></div>' +

      /* تست‌ها */
      '<div class="vcr-toasts" id="vcrToasts" aria-live="polite"></div>' +
      '</div>'
    );
  }

  /* ================================================================== */
  /* afterRender                                                            */
  /* ================================================================== */

  function afterRender() {
    root = document.getElementById('vcrLayout');
    if (!root) return;
    patchHistoryOnce();

    refs.body = qs('#vcrBody');
    refs.outlet = qs('#page-content');
    refs.sidebar = qs('#vcrSidebar');
    refs.sideScroll = qs('#vcrSideScroll');
    refs.menu = qs('#vcrMenu');
    refs.glider = qs('#vcrGlider');
    refs.fab = qs('#vcrFab');
    refs.sideToggle = qs('#vcrSideToggle');
    refs.sideCycle = qs('#vcrSideCycle');
    refs.sideIco = qs('#vcrSideIco');
    refs.cmdk = qs('#vcrCmdk');
    refs.cmdkInput = qs('#vcrCmdkInput');
    refs.cmdkList = qs('#vcrCmdkList');
    refs.time = qs('#vcrTime');
    refs.date = qs('#vcrDate');
    refs.daybar = qs('#vcrDaybar');
    refs.netDot = qs('#vcrNetDot');
    refs.netText = qs('#vcrNetText');
    refs.toasts = qs('#vcrToasts');
    refs.flash = qs('#vcrFlash');
    refs.tip = qs('#vcrTip');
    refs.statusMeta = qs('#vcrStatusMeta');
    refs.focusChip = qs('#vcrFocusChip');

    outlet = refs.outlet || null;

    attachAvatarFallbacks();
    applyPrefsToDom();
    renderSideUser();
    renderUserPop();
    renderLangList();
    renderActList();
    updateActBadge();
    bindSidebar();
    bindNav();
    bindMobileNav();
    startClock();
    startNetMonitor();
    bindMusic();
    bindPopovers();
    bindPalette();
    bindDrawer();
    bindHelp();
    bindLang();
    bindUser();
    bindFocusFullscreen();
    bindShortcuts();
    bindActivityLive();
    bindStoreUser();
    startTips();
    syncRoute(window.location.pathname || '/', { animate: false, silent: true });

    unsubs.push(onLayoutPrefsChange(() => applyPrefsToDom()));
    unsubs.push(
      onLangChange(() => {
        applyI18n();
      })
    );

    logActivity({ icon: '🚀', text: menuTitleByLink(window.location.pathname) || window.location.pathname });
  }

  function getOutlet() {
    return outlet;
  }

  function destroy() {
    destroyed = true;
    for (const id of intervals.splice(0)) window.clearInterval(id);
    if (partyTimer) window.clearInterval(partyTimer);
    if (vanishTimer) window.clearTimeout(vanishTimer);
    for (const u of unsubs.splice(0)) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
    closeAll({ force: true });
    resetScrollLock();
    for (const fn of teardown.splice(0)) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch {
        /* ignore */
      }
    }
    outlet = null;
    root = null;
  }

  /* ================================================================== */
  /* prefs → DOM                                                            */
  /* ================================================================== */

  function applyPrefsToDom() {
    if (!root) return;
    const p = getLayoutPrefs();
    root.setAttribute('style', prefsToStyle(p));
    root.dataset.sidebar = p.sidebar;
    root.dataset.mood = p.mood;
    root.dataset.accent = p.useCustom ? 'custom' : p.accent;
    root.dataset.side = p.sidebarSide;
    root.dataset.density = p.density;
    root.classList.toggle('vcr-no-motion', !p.motion);
    root.classList.toggle('vcr-no-logo-anim', !p.widgets.logoAnim);
    root.classList.toggle('vcr-no-badges', !p.widgets.badges);
    if (refs.body) {
      refs.body.classList.toggle('is-collapsed', p.sidebar === 'collapsed');
      refs.body.classList.toggle('is-hidden', p.sidebar === 'hidden');
    }
    qsa('[data-widget]').forEach((el) => {
      const key = el.getAttribute('data-widget');
      el.classList.toggle('hidden', p.widgets[key] === false);
    });
    if (refs.fab) refs.fab.classList.toggle('is-show', p.sidebar === 'hidden');
    if (refs.sideIco) refs.sideIco.textContent = p.sidebar === 'open' ? '◀' : p.sidebar === 'collapsed' ? '▶' : '👁';
    if (refs.sideToggle) refs.sideToggle.setAttribute('aria-expanded', p.sidebar === 'open' ? 'true' : 'false');
    updateStatusMeta();
    syncDrawerUI();
    requestAnimationFrame(() => glideToActive(false));
  }

  function updateStatusMeta() {
    if (!refs.statusMeta) return;
    const p = getLayoutPrefs();
    const mood = BG_MOODS[p.mood]?.label || p.mood;
    const acc = p.useCustom ? '🎨' : ACCENTS[p.accent]?.label || p.accent;
    refs.statusMeta.textContent = mood + ' • ' + acc;
  }

  /* ================================================================== */
  /* i18n                                                                   */
  /* ================================================================== */

  function applyI18n() {
    if (!root) return;
    const lang = getLang();
    root.dir = lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr';
    qsa('[data-vcr-i18n]').forEach((el) => {
      el.textContent = lt(el.getAttribute('data-vcr-i18n'));
    });
    const launcher = qs('#vcrCmdLauncher [data-vcr-i18n]');
    if (launcher) launcher.textContent = lt('searchPh');
    if (refs.cmdkInput) refs.cmdkInput.placeholder = lt('searchPh');
    const hf = qs('#vcrHelpFilter');
    if (hf) hf.placeholder = lt('helpSearchPh');
    const flag = qs('#vcrLangFlag');
    if (flag) flag.textContent = (LANGUAGE_META[lang] || {}).flag || '🌍';
    // منو، کاربر، زبان، راهنما، دراور
    refreshMenu(window.location.pathname || '/', false);
    renderSideUser();
    renderUserPop();
    renderLangList();
    renderActList();
    renderHelp(qs('#vcrHelpFilter')?.value || '');
    renderDrawer();
    updateClock(true);
  }

  /* ================================================================== */
  /* سایدبار ۳حالته + محو                                                    */
  /* ================================================================== */

  function setSidebar(mode, opts = {}) {
    const p = getLayoutPrefs();
    if (p.sidebar === mode && !opts.force) return;
    const motion = p.motion;
    const fromHidden = p.sidebar === 'hidden';
    const toHidden = mode === 'hidden';

    setLayoutPrefs({ sidebar: mode });

    if (!motion || destroyed) {
      applyPrefsToDom();
      return;
    }
    // انیمیشن محو شدن
    if (toHidden && refs.sidebar && refs.fab) {
      refs.body.classList.remove('is-hidden');
      refs.sidebar.classList.remove('is-appearing');
      refs.sidebar.classList.add('is-vanishing');
      refs.fab.classList.remove('is-show');
      if (vanishTimer) window.clearTimeout(vanishTimer);
      vanishTimer = window.setTimeout(() => {
        if (destroyed) return;
        refs.sidebar.classList.remove('is-vanishing');
        refs.body.classList.add('is-hidden');
        refs.fab.classList.add('is-show');
        refs.fab.classList.remove('is-pop');
        void refs.fab.offsetWidth;
        refs.fab.classList.add('is-pop');
      }, 480);
    } else if (fromHidden && refs.sidebar) {
      refs.body.classList.remove('is-hidden');
      refs.sidebar.classList.add('is-appearing');
      refs.fab.classList.remove('is-show', 'is-pop');
      window.setTimeout(() => {
        if (!destroyed) refs.sidebar.classList.remove('is-appearing');
      }, 550);
    }
    if (toHidden) toast(lt('hidden'), '👁️');
    logActivity({ icon: '📐', text: 'سایدبار: ' + (mode === 'open' ? lt('mOpen') : mode === 'collapsed' ? lt('mCollapsed') : lt('mHidden')) });
  }

  function bindSidebar() {
    on(refs.sideToggle, 'click', () => setSidebar(cycleSidebarMode().sidebar, { force: true }));
    on(refs.sideCycle, 'click', () => setSidebar(cycleSidebarMode().sidebar, { force: true }));
    on(refs.fab, 'click', () => setSidebar('open'));
  }

  /* ================================================================== */
  /* ناوبری + گلایدر اکتیو                                                    */
  /* ================================================================== */

  function menuTitleByLink(link) {
    const item = flatMenu().find((i) => i.link === link);
    return item ? menuTitle(item) : '';
  }

  function refreshMenu(currentPath, animate) {
    if (!refs.sideScroll) return;
    refs.sideScroll.innerHTML = renderMenu(currentPath);
    refs.menu = qs('#vcrMenu');
    refs.glider = qs('#vcrGlider');
    attachAvatarFallbacks();
    bindMenuDrag();
    glideToActive(animate);
  }

  function glideToActive(animate = true) {
    if (!refs.glider || !refs.menu) return;
    const prefs = getLayoutPrefs();
    const active = refs.menu.querySelector('.vcr-menu-item.active');
    if (!active || prefs.sidebar !== 'open') {
      refs.glider.classList.add('is-off');
      return;
    }
    refs.glider.classList.remove('is-off');
    // offsetParent آیتمِ فعال نزدیک‌ترین جدِ positionدار است یعنی .vcr-menu (همان والد گلایدر)
    // پس active.offsetTop دقیقاً همان مختصات Y داخل فضای گلایدر است — بدون هیچ تفریق اضافه
    const targetTop = active.offsetTop;
    const h = active.offsetHeight;
    const prevTop = Number(refs.glider.dataset.top || targetTop);
    refs.glider.style.height = h + 'px';
    refs.glider.dataset.top = String(targetTop);
    const ring = refs.glider.querySelector('.vcr-glider-ring');

    if (!animate || !prefs.motion || Math.abs(prevTop - targetTop) < 2) {
      refs.glider.style.transform = 'translateY(' + targetTop + 'px)';
      return;
    }
    try {
      const mid = (prevTop + targetTop) / 2;
      const dist = Math.min(1.9, 1 + Math.abs(targetTop - prevTop) / 260);
      const anim = refs.glider.animate(
        [
          { transform: 'translateY(' + prevTop + 'px) scaleY(1)', opacity: 0.85 },
          { transform: 'translateY(' + mid + 'px) scaleY(' + dist.toFixed(2) + ')', opacity: 1, offset: 0.5 },
          { transform: 'translateY(' + targetTop + 'px) scaleY(1)', opacity: 1 },
        ],
        { duration: 460, easing: 'cubic-bezier(.22,.9,.24,1)', fill: 'forwards' }
      );
      anim.onfinish = () => {
        refs.glider.style.transform = 'translateY(' + targetTop + 'px)';
        if (ring) {
          ring.classList.remove('is-ping');
          void ring.offsetWidth;
          ring.classList.add('is-ping');
        }
      };
    } catch {
      refs.glider.style.transform = 'translateY(' + targetTop + 'px)';
    }
    try {
      active.scrollIntoView({ block: 'nearest', behavior: prefs.motion ? 'smooth' : 'auto' });
    } catch {
      /* ignore */
    }
  }

  /* ---------- ناوبری موبایل/تبلت (≤900px): دراور + نوبار پایین ---------- */
  function isMobileView() {
    try {
      if (mqMobile) return mqMobile.matches;
      return window.matchMedia('(max-width: 900px)').matches;
    } catch {
      return window.innerWidth <= 900;
    }
  }
  function setMobileNav(open) {
    const want = open === true;
    if (mobileNavOpen === want) return;
    mobileNavOpen = want;
    if (root) root.classList.toggle('vcr-mnav-open', mobileNavOpen);
    try {
      const mm = qs('#vcrBottomMenu');
      if (mm) {
        const lang = getLang();
        const ic = mm.querySelector('.vcr-bottomnav__ico');
        const lb = mm.querySelector('.vcr-bottomnav__lbl');
        if (!mm.dataset.lbl && lb) mm.dataset.lbl = lb.textContent;
        if (ic) ic.textContent = mobileNavOpen ? '\u2715' : '\u2630';
        if (lb) lb.textContent = mobileNavOpen ? (lang === 'en' ? 'Close' : 'بستن') : (mm.dataset.lbl || (lang === 'en' ? 'Menu' : 'منو'));
      }
    } catch { /* ignore */ }
    const bd = qs('#vcrBackdrop');
    if (bd) bd.classList.toggle('hidden', !mobileNavOpen);
    const burger = qs('#vcrBurger');
    if (burger) burger.setAttribute('aria-expanded', mobileNavOpen ? 'true' : 'false');
    if (mobileNavOpen) lockScroll();
    else if (!cmdkOpen && !customizeOpen && !helpOpen && !openPopover) unlockScroll();
  }
  function syncBottomNavLabels() {
    try {
      qsa('#vcrBottomNav [data-bnav]').forEach((a) => {
        const t = menuTitleByLink(a.getAttribute('data-bnav'));
        const lbl = a.querySelector('.vcr-bottomnav__lbl');
        if (t && lbl) lbl.textContent = t;
      });
    } catch { /* ignore */ }
  }
  function syncBottomNav(path) {
    const nav = qs('#vcrBottomNav');
    if (!nav) return;
    const p = path || window.location.pathname || '/';
    nav.querySelectorAll('[data-bnav]').forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('data-bnav') === p);
    });
    syncBottomNavLabels();
  }
  function placeLangBtn() {
    const wrap = qs('#vcrLangWrap');
    const quick = qs('#vcrSideQuick');
    if (!wrap) return;
    if (!langHome) langHome = { parent: wrap.parentNode, next: wrap.nextSibling };
    if (!langHome.parent) return;
    if (isMobileView()) {
      if (quick && wrap.parentNode !== quick) quick.appendChild(wrap);
    } else if (wrap.parentNode !== langHome.parent) {
      langHome.parent.insertBefore(wrap, langHome.next);
    }
  }
  function bindMobileNav() {
    try {
      mqMobile = window.matchMedia('(max-width: 900px)');
    } catch {
      mqMobile = null;
    }
    placeLangBtn();
    if (mqMobile) {
      on(mqMobile, 'change', () => {
        placeLangBtn();
        if (!isMobileView() && mobileNavOpen) setMobileNav(false);
        if (isMobileView()) syncBottomNav();
      });
    }
    on(qs('#vcrBurger'), 'click', () => setMobileNav(true));
    on(qs('#vcrBackdrop'), 'click', () => setMobileNav(false));
    on(qs('#vcrBottomMenu'), 'click', () => setMobileNav(!mobileNavOpen));
    on(qs('#vcrQTheme'), 'click', () => { try { shuffleTheme(); } catch { /* ignore */ } });
    on(qs('#vcrQFocus'), 'click', () => toggleFocus());
    on(qs('#vcrQCust'), 'click', () => { setMobileNav(false); openDrawer(); });
    on(qs('#vcrQHelp'), 'click', () => { setMobileNav(false); openHelp(); });
    on(document, 'click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[data-link]') : null;
      if (a && mobileNavOpen && isMobileView()) setMobileNav(false);
    });
    syncBottomNav(window.location.pathname || '/');
  }

  function syncRoute(path, { animate = true, silent = false } = {}) {
    if (!refs.menu) return;
    const items = refs.menu.querySelectorAll('.vcr-menu-item');
    let changed = false;
    items.forEach((li) => {
      const should = li.getAttribute('data-link') === path;
      if (li.classList.contains('active') !== should) {
        changed = true;
        li.classList.toggle('active', should);
      }
    });
    if (changed || animate === false) glideToActive(animate && changed);
    if (!silent) {
      pushRecent(path);
      syncBottomNav(path);
      const title = menuTitleByLink(path);
      if (title) logActivity({ icon: '🧭', text: title, link: path });
    }
  }

  function bindNav() {
    const onRoute = () => {
      setMobileNav(false);
      closeAll({ force: true, keepToasts: true });
      syncRoute(window.location.pathname || '/', { animate: true });
    };
    on(window, 'vixora:navigate', onRoute);
    on(window, 'popstate', onRoute);
    // خروج واقعی
    on(document, 'click', (e) => {
      const a = e.target?.closest?.('a[data-logout]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      doLogout();
    }, true);
    // بستن اورلی‌ها با ناوبری
    on(document, 'click', (e) => {
      if (e.target?.closest?.('a[data-link]')) closeAll({ keepToasts: true });
    });
  }

  async function doLogout() {
    toast(lt('loggedOut'), '👋');
    logActivity({ icon: '🚪', text: lt('logout') });
    try {
      await logout();
    } catch {
      /* ignore */
    }
    window.location.href = '/login';
  }

  /* ================================================================== */
  /* درگ و مرتب‌سازی منو                                                     */
  /* ================================================================== */

  function bindMenuDrag() {
    if (!refs.menu) return;
    const prefs = getLayoutPrefs();
    const items = refs.menu.querySelectorAll('.vcr-menu-item');
    items.forEach((li) => {
      li.draggable = prefs.sidebar === 'open';
      on(li, 'dragstart', (e) => {
        li.classList.add('is-dragging');
        try {
          e.dataTransfer.setData('text/vcr-link', li.getAttribute('data-link'));
          e.dataTransfer.effectAllowed = 'move';
        } catch {
          /* ignore */
        }
      });
      on(li, 'dragend', () => {
        li.classList.remove('is-dragging');
        refs.menu.querySelectorAll('.drop-before,.drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after'));
      });
      on(li, 'dragover', (e) => {
        if (!refs.menu.querySelector('.is-dragging')) return;
        e.preventDefault();
        const rect = li.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        refs.menu.querySelectorAll('.drop-before,.drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after'));
        li.classList.add(before ? 'drop-before' : 'drop-after');
      });
      on(li, 'drop', (e) => {
        e.preventDefault();
        const src = refs.menu.querySelector('.is-dragging');
        const dstLink = li.getAttribute('data-link');
        const before = li.classList.contains('drop-before');
        refs.menu.querySelectorAll('.drop-before,.drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after'));
        if (!src) return;
        moveMenuItem(src.getAttribute('data-link'), dstLink, before);
      });
    });
    refs.menu.querySelectorAll('.vcr-menu-group').forEach((g) => {
      on(g, 'dragover', (e) => {
        if (refs.menu.querySelector('.is-dragging')) e.preventDefault();
      });
      on(g, 'drop', (e) => {
        const src = refs.menu.querySelector('.is-dragging');
        if (!src || e.target.closest('.vcr-menu-item')) return;
        e.preventDefault();
        moveMenuItemToGroup(src.getAttribute('data-link'), g.getAttribute('data-group'));
      });
    });
  }

  function findItem(link) {
    for (const g of navGroups) {
      const i = g.items.findIndex((x) => x.link === link);
      if (i >= 0) return { g, i };
    }
    return null;
  }

  function moveMenuItem(srcLink, dstLink, before) {
    if (srcLink === dstLink) return;
    const src = findItem(srcLink);
    const dst = findItem(dstLink);
    if (!src || !dst) return;
    const [moved] = navGroups.find((g) => g.id === src.g.id).items.splice(src.i, 1);
    const dstArr = navGroups.find((g) => g.id === dst.g.id).items;
    let di = dstArr.findIndex((x) => x.link === dstLink);
    if (di < 0) di = dstArr.length;
    dstArr.splice(before ? di : di + 1, 0, moved);
    persistNavOrder();
    refreshMenu(window.location.pathname || '/', false);
    logActivity({ icon: '✋', text: 'جابه‌جایی منو: ' + menuTitle(moved) });
  }

  function moveMenuItemToGroup(srcLink, groupId) {
    const src = findItem(srcLink);
    const g = navGroups.find((x) => x.id === groupId);
    if (!src || !g || src.g.id === groupId) return;
    const [moved] = navGroups.find((x) => x.id === src.g.id).items.splice(src.i, 1);
    g.items.push(moved);
    persistNavOrder();
    refreshMenu(window.location.pathname || '/', false);
  }

  /* ================================================================== */
  /* ساعت فلیپ                                                               */
  /* ================================================================== */

  function startClock() {
    every(1000, () => updateClock(false));
  }

  function updateClock(force) {
    if (!refs.time || !refs.date) return;
    const prefs = getLayoutPrefs();
    const lang = getLang();
    const now = new Date();
    const locale = lang === 'fa' ? 'fa-IR' : lang === 'ar' ? 'ar-EG-u-ca-persian' : lang === 'fr' ? 'fr-FR' : 'en-US';

    const parts = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(now);
    const get = (t) => (parts.find((p) => p.type === t) || {}).value || '00';
    const hh = get('hour');
    const mm = get('minute');
    const ss = get('second');

    const html =
      '<span class="vcr-tick">' + escapeHtml(hh) + '</span><span class="vcr-colon">:</span>' +
      '<span class="vcr-tick">' + escapeHtml(mm) + '</span>' +
      (prefs.seconds ? '<span class="vcr-colon">:</span><span class="vcr-tick vcr-sec" id="vcrSec">' + escapeHtml(ss) + '</span>' : '');
    if (refs.time.innerHTML !== html || force) {
      refs.time.innerHTML = html;
      if (prefs.motion && prefs.seconds) {
        const sec = qs('#vcrSec');
        if (sec) {
          sec.classList.remove('is-tick');
          void sec.offsetWidth;
          sec.classList.add('is-tick');
        }
      }
    }

    try {
      refs.date.textContent = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
    } catch {
      refs.date.textContent = now.toLocaleDateString();
    }
    if (refs.daybar) {
      const pct = ((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400) * 100;
      refs.daybar.style.width = pct.toFixed(2) + '%';
    }
  }

  /* ================================================================== */
  /* پینگ واقعی                                                              */
  /* ================================================================== */

  function netType() {
    try {
      return navigator.connection?.effectiveType || '';
    } catch {
      return '';
    }
  }

  async function measurePing() {
    if (!refs.netDot || !refs.netText) return;
    if (!navigator.onLine) {
      refs.netDot.className = 'vcr-status-dot is-off';
      refs.netText.textContent = '🔴 ' + lt('netOffline');
      return;
    }
    const t0 = performance.now();
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 6000);
      await fetch(window.location.href.split('#')[0], { method: 'HEAD', cache: 'no-store', credentials: 'omit', signal: ctrl.signal });
      window.clearTimeout(timer);
      const ms = Math.max(1, Math.round(performance.now() - t0));
      const cls = ms < 150 ? 'is-good' : ms < 450 ? 'is-mid' : 'is-bad';
      refs.netDot.className = 'vcr-status-dot ' + cls;
      refs.netText.textContent = ms + 'ms' + (netType() ? ' • ' + netType() : '');
    } catch {
      refs.netDot.className = 'vcr-status-dot is-mid';
      refs.netText.textContent = netType() || lt('netCheck');
    }
  }

  function startNetMonitor() {
    measurePing();
    const id = window.setInterval(() => {
      if (!destroyed) measurePing();
    }, 12000);
    intervals.push(id);
    on(window, 'online', measurePing);
    on(window, 'offline', measurePing);
  }

  /* ================================================================== */
  /* موزیک‌بار                                                               */
  /* ================================================================== */

  function bindMusic() {
    const bar = qs('#vcrMusicbar');
    if (!bar) return;
    const render = (snap) => renderMusic(snap || getPlayerState());
    unsubs.push(subscribeMusicPlayer(render));
    render(getPlayerState());
    const id = window.setInterval(() => {
      if (destroyed) return;
      const s = getPlayerState();
      if (s.status === 'playing') renderMusic(s);
    }, 800);
    intervals.push(id);

    on(qs('#vcrPlay'), 'click', () => togglePlayback().catch(() => {}));
    on(qs('#vcrNext'), 'click', () => { try { const r = nextTrack(); if (r && typeof r.catch === 'function') r.catch(() => {}); } catch { /* ignore */ } });
    on(qs('#vcrPrev'), 'click', () => { try { const r = prevTrack(); if (r && typeof r.catch === 'function') r.catch(() => {}); } catch { /* ignore */ } });
    const goMusic = () => navigateTo('/tools/music');
    on(qs('#vcrMusicMeta'), 'click', goMusic);
    on(qs('#vcrMusicCover'), 'click', goMusic);
  }

  function renderMusic(s) {
    const titleEl = qs('#vcrMusicTitle');
    if (!titleEl) return;
    const playing = s.status === 'playing';
    const song = s.song || {};
    const title = song.title || song.name || (playing || s.status === 'paused' ? lt('musicOpen') : lt('musicIdle'));
    const artist = song.artist || song.singer || (s.queue?.length ? s.queue.length + ' tracks' : 'ViXoRa Radio');
    const span = titleEl.querySelector('span');
    if (span && span.textContent !== title) {
      span.textContent = title;
      titleEl.classList.toggle('is-long', title.length > 22);
    }
    const sub = qs('#vcrMusicSub');
    if (sub) sub.textContent = artist;
    const play = qs('#vcrPlay');
    if (play) play.textContent = playing ? '⏸' : '▶';
    const cover = qs('#vcrMusicCover');
    if (cover) cover.classList.toggle('is-playing', playing);
    const prog = qs('#vcrMusicProg');
    if (prog) {
      const pct = s.duration > 0 ? Math.min(100, (s.currentTime / s.duration) * 100) : 0;
      prog.style.width = pct.toFixed(1) + '%';
    }
    // بج زنده روی آیتم موزیک
    const musicLi = refs.menu?.querySelector('[data-link="/tools/music"] .vcr-menu-badge');
    if (musicLi && playing) {
      musicLi.innerHTML = '<span class="vcr-live-eq"><i></i><i></i><i></i></span>';
    } else if (musicLi && !playing && musicLi.querySelector('.vcr-live-eq')) {
      musicLi.textContent = lt('newBadge');
    }
  }

  /* ================================================================== */
  /* کاربر                                                                   */
  /* ================================================================== */

  function bindStoreUser() {
    try {
      const un = appStore.subscribe(() => {
        if (destroyed) return;
        renderSideUser();
        renderUserPop();
        const u = userSnapshot();
        const img = qs('#vcrAvatarImg');
        if (img && u.avatar) img.src = u.avatar;
        const nm = qs('#vcrUserName');
        if (nm) nm.textContent = u.name;
        const rl = qs('#vcrUserRole');
        if (rl) rl.textContent = roleLabel(u.role) + ' • ' + String(u.plan || 'free');
      });
      unsubs.push(un);
    } catch {
      /* ignore */
    }
  }

  function renderSideUser() {
    const host = qs('#vcrSideUser');
    if (!host) return;
    const u = userSnapshot();
    host.innerHTML =
      '<button class="vcr-side-user__card" id="vcrSideUserBtn" type="button">' +
      '<span class="vcr-avatar vcr-avatar--sm"><img data-vcr-avatar src="' + escapeHtml(u.avatar || FALLBACK_AVATAR) + '" alt=""><span class="vcr-avatar-online"></span></span>' +
      '<span class="vcr-user-info"><span class="vcr-user-name">' + escapeHtml(u.name) + '</span><span class="vcr-user-role">' + escapeHtml(String(u.plan || 'free')) + ' • ' + escapeHtml(roleLabel(u.role)) + '</span></span>' +
      '<span class="vcr-side-user__logout" id="vcrSideLogout" title="' + escapeHtml(lt('logout')) + '">🚪</span>' +
      '</button>';
    attachAvatarFallbacks();
    on(qs('#vcrSideLogout'), 'click', (e) => {
      e.stopPropagation();
      doLogout();
    });
    on(qs('#vcrSideUserBtn'), 'click', (e) => { e.stopPropagation(); togglePopover('user'); });
  }

  function renderUserPop() {
    const body = qs('#vcrUserBody');
    if (!body) return;
    const u = userSnapshot();
    const raw = u.raw || {};
    const email = raw.email || '';
    const username = raw.username || '';
    const since = raw.memberSince || raw.createdAt || '';
    let sinceTxt = '—';
    try {
      if (since) sinceTxt = new Date(since).toLocaleDateString(getLang() === 'fa' ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      /* ignore */
    }
    body.innerHTML =
      '<div class="vcr-user-card"><span class="vcr-avatar vcr-avatar--lg"><img data-vcr-avatar src="' + escapeHtml(u.avatar || FALLBACK_AVATAR) + '" alt=""></span>' +
      '<div class="vcr-user-card__info"><strong>' + escapeHtml(u.name) + '</strong>' +
      (username ? '<small>@' + escapeHtml(username) + '</small>' : '') +
      (email ? '<small>' + escapeHtml(email) + '</small>' : '') + '</div></div>' +
      '<div class="vcr-user-stats"><span>🏷️ ' + escapeHtml(roleLabel(u.role)) + '</span><span>💎 ' + escapeHtml(String(u.plan || 'free')) + '</span><span>📅 ' + escapeHtml(lt('memberSince')) + ': ' + escapeHtml(sinceTxt) + '</span></div>' +
      '<div class="vcr-popover-sep"></div>' +
      '<button class="vcr-popover-link" id="vcrGoProfile" type="button">👤 ' + escapeHtml(lt('profile')) + '</button>' +
      '<button class="vcr-popover-link" id="vcrGoSettings" type="button">⚙️ ' + escapeHtml(lt('settings')) + '</button>' +
      '<div class="vcr-popover-sep"></div>' +
      '<button class="vcr-popover-link vcr-popover-link--danger" id="vcrDoLogout" type="button">🚪 ' + escapeHtml(lt('logout')) + '</button>';
    attachAvatarFallbacks();
    on(qs('#vcrGoProfile'), 'click', () => toast(lt('soon'), '✨'));
    on(qs('#vcrGoSettings'), 'click', () => {
      closeAll();
      openDrawer();
    });
    on(qs('#vcrDoLogout'), 'click', doLogout);
  }

  function bindUser() {
    on(qs('#vcrUserBtn'), 'click', (e) => {
      e.stopPropagation();
      togglePopover('user');
    });
  }

  /* ================================================================== */
  /* پاپ‌اورها (فعالیت/کاربر/زبان)                                            */
  /* ================================================================== */

  const POP_IDS = { activity: 'vcrActPop', user: 'vcrUserPop', lang: 'vcrLangPop' };
  const POP_BTNS = { activity: 'vcrActBtn', user: 'vcrUserBtn', lang: 'vcrLangBtn' };

  function togglePopover(which) {
    if (openPopover === which) {
      closeAll();
      return;
    }
    closeAll({ silent: true });
    setMobileNav(false);
    openPopover = which;
    const pop = document.getElementById(POP_IDS[which]);
    const btn = document.getElementById(POP_BTNS[which]);
    if (pop) {
      pop.classList.remove('hidden');
      pop.classList.remove('is-pop');
      void pop.offsetWidth;
      pop.classList.add('is-pop');
    }
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (which === 'activity') {
      renderActList();
      markActivitySeen();
    }
  }

  function bindPopovers() {
    on(qs('#vcrActBtn'), 'click', (e) => {
      e.stopPropagation();
      togglePopover('activity');
    });
    on(qs('#vcrLangBtn'), 'click', (e) => {
      e.stopPropagation();
      togglePopover('lang');
    });
    on(qs('#vcrActClear'), 'click', () => {
      clearActivities();
      renderActList();
      updateActBadge(true);
    });
    on(document, 'click', (e) => {
      if (!openPopover) return;
      const pop = document.getElementById(POP_IDS[openPopover]);
      const btn = document.getElementById(POP_BTNS[openPopover]);
      if (pop && (pop.contains(e.target) || (btn && btn.contains(e.target)))) return;
      // کلیک روی دکمه همان پاپ‌اور را خود هندلرش مدیریت می‌کند
      closeAll();
    });
  }

  function renderActList() {
    const host = qs('#vcrActList');
    if (!host) return;
    const list = getActivities(30);
    if (!list.length) {
      host.innerHTML = '<div class="vcr-cmdk-empty">' + escapeHtml(lt('actEmpty')) + '</div>';
      return;
    }
    host.innerHTML = list
      .map(
        (a) =>
          '<div class="vcr-notif-item' + (a.at > lastSeenActivity ? ' unread' : '') + '">' +
          '<div class="vcr-notif-icon">' + escapeHtml(a.icon || '•') + '</div>' +
          '<div class="vcr-notif-content"><p>' + escapeHtml(a.text) + '</p><small>' + escapeHtml(timeAgoFa(a.at)) + '</small></div></div>'
      )
      .join('');
  }

  function updateActBadge(forceSeen) {
    const badge = qs('#vcrActBadge');
    if (!badge) return;
    const unread = getActivities(80).filter((a) => a.at > lastSeenActivity).length;
    badge.classList.toggle('hidden', unread === 0);
    if (unread > 0) badge.textContent = unread > 9 ? '9+' : String(unread);
    if (forceSeen) badge.classList.add('hidden');
    const dot = document.getElementById('vcrBottomDot');
    if (dot) dot.classList.toggle('hidden', unread === 0 || !!forceSeen);
  }

  function markActivitySeen() {
    lastSeenActivity = Date.now();
    try {
      localStorage.setItem('ViXoRa:layout-activity-seen', String(lastSeenActivity));
    } catch {
      /* ignore */
    }
    window.setTimeout(() => updateActBadge(), 600);
  }

  function bindActivityLive() {
    unsubs.push(
      onActivity(() => {
        if (destroyed) return;
        if (openPopover === 'activity') renderActList();
        updateActBadge();
        const btn = qs('#vcrActBtn');
        if (btn && getLayoutPrefs().motion) {
          btn.classList.remove('is-ring');
          void btn.offsetWidth;
          btn.classList.add('is-ring');
        }
      })
    );
  }

  /* ================================================================== */
  /* زبان                                                                     */
  /* ================================================================== */

  function renderLangList() {
    const host = qs('#vcrLangList');
    if (!host) return;
    const cur = getLang();
    host.innerHTML = LANGUAGES.map(
      (l) =>
        '<button class="vcr-lang-opt' + (l === cur ? ' is-active' : '') + '" data-lang="' + l + '" type="button" role="menuitem"><span class="vcr-lang-flag">' +
        escapeHtml((LANGUAGE_META[l] || {}).flag || '🌍') + '</span><span>' + escapeHtml((LANGUAGE_META[l] || {}).label || l) + '</span>' +
        (l === cur ? '<span class="vcr-lang-check">✓</span>' : '') + '</button>'
    ).join('');
    host.querySelectorAll('[data-lang]').forEach((b) => {
      on(b, 'click', () => {
        applyLang(b.getAttribute('data-lang'));
        closeAll();
      });
    });
  }

  function applyLang(lang) {
    if (!LANGUAGES.includes(lang) || lang === getLang()) return;
    setLang(lang);
    toast((LANGUAGE_META[lang] || {}).flag + ' ' + ((LANGUAGE_META[lang] || {}).label || lang), '🌍');
    logActivity({ icon: '🌍', text: lt('lang') + ': ' + ((LANGUAGE_META[lang] || {}).label || lang) });
  }

  function cycleLang() {
    const i = LANGUAGES.indexOf(getLang());
    applyLang(LANGUAGES[(i + 1) % LANGUAGES.length]);
    syncBottomNavLabels();
  }

  function bindLang() {
    /* دکمه و لیست در bindPopovers/renderLangList */
  }

  /* ================================================================== */
  /* پالت فرمان                                                               */
  /* ================================================================== */

  function paletteActions() {
    return [
      { id: 'sidebar', icon: '📐', label: lt('sideToggle'), kbd: 'Ctrl B', run: () => setSidebar(cycleSidebarMode().sidebar, { force: true }) },
      { id: 'focus', icon: '⛶', label: lt('fullscreen'), kbd: 'Alt F', run: () => toggleFocus() },
      { id: 'play', icon: '⏯', label: '⏯ Play / Pause', kbd: 'Alt M', run: () => togglePlayback().catch(() => {}) },
      { id: 'next', icon: '⏭', label: 'Next track', kbd: 'Alt .', run: () => { try { nextTrack(); } catch { /* ignore */ } } },
      { id: 'prev', icon: '⏮', label: 'Previous track', kbd: 'Alt ,', run: () => { try { prevTrack(); } catch { /* ignore */ } } },
      { id: 'gomusic', icon: '🎵', label: lt('musicOpen'), kbd: 'Alt G', run: () => navigateTo('/tools/music') },
      { id: 'shuffle', icon: '🎲', label: lt('shuffled').replace('؟', '').replace('?', ''), kbd: 'Alt T', run: () => shuffleTheme() },
      { id: 'accent', icon: '🎨', label: lt('cAccent'), kbd: '⇧Alt T', run: () => cycleAccent() },
      { id: 'lang', icon: '🌍', label: lt('lang'), kbd: 'Alt L', run: () => cycleLang() },
      { id: 'custom', icon: '🧩', label: lt('customize'), kbd: 'Alt C', run: () => openDrawer() },
      { id: 'help', icon: '❔', label: lt('help'), kbd: '?', run: () => openHelp() },
      { id: 'activity', icon: '🔔', label: lt('actTitle'), kbd: 'Alt A', run: () => togglePopover('activity') },
      { id: 'party', icon: '🎉', label: lt('party'), kbd: '⇧Alt P', run: () => partyMode() },
      { id: 'logout', icon: '🚪', label: lt('logout'), kbd: '', run: () => doLogout() },
    ];
  }

  function bindPalette() {
    const launcher = qs('#vcrCmdLauncher');
    on(launcher, 'click', () => setCmdk(true));
    on(qs('#vcrCmdkClose'), 'click', () => setCmdk(false));
    on(refs.cmdk, 'click', (e) => {
      if (e.target === refs.cmdk) setCmdk(false);
    });
    on(refs.cmdkInput, 'input', () => renderCmdk(refs.cmdkInput.value));
    on(refs.cmdkInput, 'keydown', (e) => {
      const key = (e.key || '').toLowerCase();
      if (key === 'arrowdown') {
        e.preventDefault();
        moveCmdk(1);
      } else if (key === 'arrowup') {
        e.preventDefault();
        moveCmdk(-1);
      } else if (key === 'enter') {
        e.preventDefault();
        runCmdk(cmdkActiveIndex);
      } else if (key === 'escape') {
        e.preventDefault();
        setCmdk(false);
      }
    });
    on(refs.cmdkList, 'click', (e) => {
      const row = e.target.closest('[data-cmdk-idx]');
      if (row) runCmdk(Number(row.getAttribute('data-cmdk-idx')));
    });
    on(refs.cmdkList, 'mousemove', (e) => {
      const row = e.target.closest('[data-cmdk-idx]');
      if (row) setCmdkActive(Number(row.getAttribute('data-cmdk-idx')));
    });
    on(qs('#vcrFocusPalette'), 'click', () => setCmdk(true));
  }

  function setCmdk(open) {
    const wantCmdk = Boolean(open);
    if (cmdkOpen === wantCmdk) return;
    cmdkOpen = wantCmdk;
    if (!refs.cmdk) return;
    refs.cmdk.classList.toggle('hidden', !cmdkOpen);
    refs.cmdk.setAttribute('aria-hidden', cmdkOpen ? 'false' : 'true');
    const launcher = qs('#vcrCmdLauncher');
    if (launcher) launcher.setAttribute('aria-expanded', cmdkOpen ? 'true' : 'false');
    if (cmdkOpen) {
      closeAll({ silent: true, keepCmdk: true });
      setMobileNav(false);
      renderCmdk('');
      if (refs.cmdkInput) {
        refs.cmdkInput.value = '';
        window.setTimeout(() => refs.cmdkInput?.focus(), 30);
      }
      lockScroll();
    } else {
      unlockScroll();
    }
  }

  function renderCmdk(query) {
    if (!refs.cmdkList) return;
    const q = normSearch(query);
    const items = flatMenu().filter((i) => !i.isLogout);
    const scored = items
      .map((it) => ({ it, s: fuzzyScore(q, menuTitle(it) + ' ' + (it.title?.en || '') + ' ' + it.link) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => ({ type: 'tool', ...r.it }));
    const actions = paletteActions()
      .map((a) => ({ a, s: fuzzyScore(q, a.label + ' ' + a.id) }))
      .filter((r) => r.s >= 0)
      .sort((a2, b2) => b2.s - a2.s)
      .slice(0, q ? 8 : 6)
      .map((r) => ({ type: 'action', ...r.a }));

    let recent = [];
    if (!q) {
      const prefs = getLayoutPrefs();
      recent = prefs.recent
        .map((l) => items.find((i) => i.link === l))
        .filter(Boolean)
        .slice(0, 4)
        .map((it) => ({ type: 'tool', ...it, isRecent: true }));
    }

    cmdkFlat = [...recent, ...scored.filter((s) => !recent.some((r) => r.link === s.link)), ...actions];
    cmdkActiveIndex = 0;

    if (!cmdkFlat.length) {
      refs.cmdkList.innerHTML = '<div class="vcr-cmdk-empty">' + escapeHtml(lt('cmdkEmpty')) + '</div>';
      return;
    }
    let html = '';
    let lastGroup = '';
    cmdkFlat.forEach((row, idx) => {
      const g = row.type === 'action' ? lt('gActions') : row.isRecent ? lt('gRecent') : lt('gTools');
      if (g !== lastGroup) {
        html += '<div class="vcr-cmdk-group">' + escapeHtml(g) + '</div>';
        lastGroup = g;
      }
      if (row.type === 'tool') {
        html +=
          '<div class="vcr-cmdk-item" data-cmdk-idx="' + idx + '" role="option"><span class="vcr-cmdk-emoji">' + escapeHtml(row.emoji) + '</span>' +
          '<span class="vcr-cmdk-item__title">' + escapeHtml(menuTitle(row)) + '</span>' +
          '<span class="vcr-cmdk-item__meta">' + escapeHtml(row.link) + '</span></div>';
      } else {
        html +=
          '<div class="vcr-cmdk-item vcr-cmdk-item--action" data-cmdk-idx="' + idx + '" role="option"><span class="vcr-cmdk-emoji">' + escapeHtml(row.icon) + '</span>' +
          '<span class="vcr-cmdk-item__title">' + escapeHtml(row.label) + '</span>' +
          (row.kbd ? '<kbd class="vcr-kbd vcr-kbd--sm">' + escapeHtml(row.kbd) + '</kbd>' : '') + '</div>';
      }
    });
    refs.cmdkList.innerHTML = html;
    setCmdkActive(0);
  }

  function setCmdkActive(idx) {
    cmdkActiveIndex = Math.max(0, Math.min(cmdkFlat.length - 1, idx));
    refs.cmdkList.querySelectorAll('.vcr-cmdk-item').forEach((el) => {
      const on_ = Number(el.getAttribute('data-cmdk-idx')) === cmdkActiveIndex;
      el.classList.toggle('is-active', on_);
      el.setAttribute('aria-selected', on_ ? 'true' : 'false');
      if (on_) {
        try {
          el.scrollIntoView({ block: 'nearest' });
        } catch {
          /* ignore */
        }
      }
    });
  }

  function moveCmdk(dir) {
    if (!cmdkFlat.length) return;
    setCmdkActive((cmdkActiveIndex + dir + cmdkFlat.length) % cmdkFlat.length);
  }

  function runCmdk(idx) {
    const row = cmdkFlat[idx];
    if (!row) return;
    setCmdk(false);
    if (row.type === 'tool') {
      navigateTo(row.link);
    } else if (typeof row.run === 'function') {
      try {
        row.run();
      } catch {
        /* ignore */
      }
    }
  }

  /* ================================================================== */
  /* تم و اکسنت و افکت‌ها                                                     */
  /* ================================================================== */

  function flashScreen() {
    if (!refs.flash || !getLayoutPrefs().motion) return;
    refs.flash.classList.remove('is-flash');
    void refs.flash.offsetWidth;
    refs.flash.classList.add('is-flash');
  }

  function shuffleTheme() {
    const moods = Object.keys(BG_MOODS);
    const accents = Object.keys(ACCENTS);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setLayoutPrefs({ mood: pick(moods), accent: pick(accents), useCustom: false });
    flashScreen();
    toast(lt('shuffled'), '🎲');
    logActivity({ icon: '🎲', text: lt('shuffled') });
  }

  function cycleAccent() {
    const accents = Object.keys(ACCENTS);
    const cur = getLayoutPrefs().accent;
    const next = accents[(accents.indexOf(cur) + 1) % accents.length];
    setLayoutPrefs({ accent: next, useCustom: false });
    toast(ACCENTS[next].label, '🎨');
  }

  function partyMode() {
    if (partyTimer) {
      window.clearInterval(partyTimer);
      partyTimer = null;
      toast('🛑 Party over!', '🎉');
      return;
    }
    toast(lt('party'), '🎉');
    logActivity({ icon: '🎉', text: lt('party') });
    const accents = Object.keys(ACCENTS);
    let i = 0;
    partyTimer = window.setInterval(() => {
      if (destroyed) {
        window.clearInterval(partyTimer);
        partyTimer = null;
        return;
      }
      setLayoutPrefs({ accent: accents[i % accents.length], useCustom: false });
      flashScreen();
      i += 1;
      if (i >= 10) {
        window.clearInterval(partyTimer);
        partyTimer = null;
      }
    }, 700);
  }

  /* ================================================================== */
  /* حالت تمرکز + تمام‌صفحه                                                    */
  /* ================================================================== */

  function toggleFocus(force) {
    focusMode = typeof force === 'boolean' ? force : !focusMode;
    if (!root) return;
    root.classList.toggle('vcr-focus', focusMode);
    if (refs.focusChip) refs.focusChip.classList.toggle('hidden', !focusMode);
    toast(focusMode ? lt('focusOn') : lt('focusOff'), '🎯');
    logActivity({ icon: '🎯', text: focusMode ? lt('focusOn') : lt('focusOff') });
  }

  async function toggleBrowserFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const el = refs.outlet || root;
        if (el?.requestFullscreen) await el.requestFullscreen();
      }
      toast(lt('fsOn'), '⛶');
    } catch {
      toggleFocus();
    }
  }

  function bindFocusFullscreen() {
    on(qs('#vcrFocusBtn'), 'click', () => toggleFocus());
    on(qs('#vcrFocusExit'), 'click', () => toggleFocus(false));
  }

  /* ================================================================== */
  /* دراور شخصی‌سازی                                                          */
  /* ================================================================== */

  function bindDrawer() {
    on(qs('#vcrCustBtn'), 'click', () => openDrawer());
    on(qs('#vcrDrawerClose'), 'click', () => closeAll());
    on(qs('#vcrDrawer'), 'click', (e) => {
      if (e.target.id === 'vcrDrawer') closeAll();
    });
  }

  function openDrawer() {
    if (customizeOpen) { renderDrawer(); return; }
    closeAll({ silent: true });
    setMobileNav(false);
    customizeOpen = true;
    const d = qs('#vcrDrawer');
    if (!d) return;
    renderDrawer();
    d.classList.remove('hidden');
    lockScroll();
  }

  function widgetLabel(key) {
    return lt({ search: 'wSearch', music: 'wMusic', clock: 'wClock', net: 'wNet', statusbar: 'wStatusbar', sidebarUser: 'wSidebarUser', logoAnim: 'wLogoAnim', badges: 'wBadges' }[key] || 'wSearch');
  }

  function renderDrawer() {
    const body = qs('#vcrDrawerBody');
    if (!body) return;
    const p = getLayoutPrefs();
    const moods = Object.keys(BG_MOODS)
      .map((m) => '<button class="vcr-swatch' + (p.mood === m ? ' is-active' : '') + '" data-mood="' + m + '" type="button" style="--sw:' + BG_MOODS[m].bg + '" title="' + escapeHtml(BG_MOODS[m].label) + '"><span>' + escapeHtml(BG_MOODS[m].label) + '</span></button>')
      .join('');
    const accents = Object.keys(ACCENTS)
      .map(
        (a) =>
          '<button class="vcr-swatch vcr-swatch--accent' + (!p.useCustom && p.accent === a ? ' is-active' : '') + '" data-accent="' + a + '" type="button" style="--sw:' + ACCENTS[a].a + ';--sw2:' + ACCENTS[a].b + '" title="' + escapeHtml(ACCENTS[a].label) + '"><span>' + escapeHtml(ACCENTS[a].label) + '</span></button>'
      )
      .join('');
    const modes = ['open', 'collapsed', 'hidden']
      .map((m) => '<button class="vcr-seg' + (p.sidebar === m ? ' is-active' : '') + '" data-side-mode="' + m + '" type="button">' + escapeHtml(lt(m === 'open' ? 'mOpen' : m === 'collapsed' ? 'mCollapsed' : 'mHidden')) + '</button>')
      .join('');
    const sides = ['right', 'left']
      .map((s) => '<button class="vcr-seg' + (p.sidebarSide === s ? ' is-active' : '') + '" data-side-pos="' + s + '" type="button">' + escapeHtml(lt(s === 'right' ? 'cRight' : 'cLeft')) + '</button>')
      .join('');
    const widgets = Object.keys(p.widgets)
      .map(
        (k) =>
          '<label class="vcr-switch-row"><span>' + escapeHtml(widgetLabel(k)) + '</span><span class="vcr-switch"><input type="checkbox" data-widget-tg="' + k + '"' + (p.widgets[k] ? ' checked' : '') + '><i></i></span></label>'
      )
      .join('');
    const presets = p.presets.length
      ? p.presets
          .map((pr) => '<div class="vcr-preset"><button class="vcr-preset__apply" data-preset-apply="' + escapeHtml(pr.name) + '" type="button">💾 ' + escapeHtml(pr.name) + '</button><button class="vcr-preset__del" data-preset-del="' + escapeHtml(pr.name) + '" type="button">🗑</button></div>')
          .join('')
      : '<div class="vcr-cmdk-empty">—</div>';

    body.innerHTML =
      '<div class="vcr-cust-sec"><h4>' + escapeHtml(lt('cTheme')) + '</h4><div class="vcr-swatches">' + moods + '</div></div>' +
      '<div class="vcr-cust-sec"><h4>' + escapeHtml(lt('cAccent')) + '</h4><div class="vcr-swatches">' + accents + '</div>' +
      '<label class="vcr-switch-row"><span>' + escapeHtml(lt('cCustom')) + '</span><span class="vcr-switch"><input type="checkbox" id="vcrCustomTg"' + (p.useCustom ? ' checked' : '') + '><i></i></span></label>' +
      '<div class="vcr-colors"><input type="color" id="vcrColorA" value="' + escapeHtml(p.customA) + '" title="A"><input type="color" id="vcrColorB" value="' + escapeHtml(p.customB) + '" title="B"></div></div>' +
      '<div class="vcr-cust-sec"><h4>' + escapeHtml(lt('cGlow')) + '</h4><input type="range" class="vcr-range" id="vcrGlow" min="0" max="1.5" step="0.1" value="' + escapeHtml(String(p.glow)) + '"></div>' +
      '<div class="vcr-cust-sec"><h4>' + escapeHtml(lt('cSidebar')) + '</h4><div class="vcr-seg-row">' + modes + '</div><h4>' + escapeHtml(lt('cSide')) + '</h4><div class="vcr-seg-row">' + sides + '</div></div>' +
      '<div class="vcr-cust-sec"><h4>' + escapeHtml(lt('cWidgets')) + '</h4>' + widgets + '</div>' +
      '<div class="vcr-cust-sec"><h4>' + escapeHtml(lt('cDensity')) + '</h4><div class="vcr-seg-row"><button class="vcr-seg' + (p.density === 'comfortable' ? ' is-active' : '') + '" data-density="comfortable" type="button">' + escapeHtml(lt('cComfy')) + '</button><button class="vcr-seg' + (p.density === 'compact' ? ' is-active' : '') + '" data-density="compact" type="button">' + escapeHtml(lt('cCompact')) + '</button></div>' +
      '<label class="vcr-switch-row"><span>' + escapeHtml(lt('cMotion')) + '</span><span class="vcr-switch"><input type="checkbox" id="vcrMotionTg"' + (p.motion ? ' checked' : '') + '><i></i></span></label>' +
      '<label class="vcr-switch-row"><span>' + escapeHtml(lt('cSeconds')) + '</span><span class="vcr-switch"><input type="checkbox" id="vcrSecTg"' + (p.seconds ? ' checked' : '') + '><i></i></span></label></div>' +
      '<div class="vcr-cust-sec"><h4>' + escapeHtml(lt('cPresets')) + '</h4><div class="vcr-preset-save"><input class="vcr-cmdk-input vcr-cmdk-input--sm" id="vcrPresetName" placeholder="' + escapeHtml(lt('cPresetPh')) + '"><button class="vcr-chip-btn" id="vcrPresetSave" type="button">' + escapeHtml(lt('cSavePreset')) + '</button></div><div class="vcr-presets">' + presets + '</div></div>' +
      '<div class="vcr-cust-sec"><button class="vcr-chip-btn vcr-chip-btn--danger" id="vcrResetPrefs" type="button">↩ ' + escapeHtml(lt('cReset')) + '</button></div>';

    body.querySelectorAll('[data-mood]').forEach((b) => on(b, 'click', () => {
      setLayoutPrefs({ mood: b.getAttribute('data-mood') });
      logActivity({ icon: '🌌', text: lt('cTheme') + ': ' + BG_MOODS[b.getAttribute('data-mood')].label });
    }));
    body.querySelectorAll('[data-accent]').forEach((b) => on(b, 'click', () => {
      setLayoutPrefs({ accent: b.getAttribute('data-accent'), useCustom: false });
      logActivity({ icon: '🎨', text: lt('cAccent') + ': ' + ACCENTS[b.getAttribute('data-accent')].label });
    }));
    body.querySelectorAll('[data-side-mode]').forEach((b) => on(b, 'click', () => setSidebar(b.getAttribute('data-side-mode'), { force: true })));
    body.querySelectorAll('[data-side-pos]').forEach((b) => on(b, 'click', () => setLayoutPrefs({ sidebarSide: b.getAttribute('data-side-pos') })));
    body.querySelectorAll('[data-density]').forEach((b) => on(b, 'click', () => setLayoutPrefs({ density: b.getAttribute('data-density') })));
    body.querySelectorAll('[data-widget-tg]').forEach((c) => on(c, 'change', () => toggleLayoutWidget(c.getAttribute('data-widget-tg'))));
    on(body.querySelector('#vcrCustomTg'), 'change', (e) => setLayoutPrefs({ useCustom: e.target.checked }));
    on(body.querySelector('#vcrColorA'), 'input', (e) => setLayoutPrefs({ customA: e.target.value, useCustom: true }));
    on(body.querySelector('#vcrColorB'), 'input', (e) => setLayoutPrefs({ customB: e.target.value, useCustom: true }));
    on(body.querySelector('#vcrGlow'), 'input', (e) => setLayoutPrefs({ glow: Number(e.target.value) }));
    on(body.querySelector('#vcrMotionTg'), 'change', (e) => setLayoutPrefs({ motion: e.target.checked }));
    on(body.querySelector('#vcrSecTg'), 'change', (e) => {
      setLayoutPrefs({ seconds: e.target.checked });
      updateClock(true);
    });
    on(body.querySelector('#vcrPresetSave'), 'click', () => {
      const inp = body.querySelector('#vcrPresetName');
      const entry = savePreset(inp?.value || '');
      if (entry) {
        toast(lt('cSaved'), '💾');
        logActivity({ icon: '💾', text: lt('cSaved') + ' ' + entry.name });
        renderDrawer();
      }
    });
    body.querySelectorAll('[data-preset-apply]').forEach((b) => on(b, 'click', () => {
      if (applyPreset(b.getAttribute('data-preset-apply'))) {
        toast(lt('cApplied'), '🎨');
        flashScreen();
        refreshMenu(window.location.pathname || '/', false);
        renderDrawer();
      }
    }));
    body.querySelectorAll('[data-preset-del]').forEach((b) => on(b, 'click', () => {
      deletePreset(b.getAttribute('data-preset-del'));
      renderDrawer();
    }));
    on(body.querySelector('#vcrResetPrefs'), 'click', () => {
      resetLayoutPrefs();
      refreshMenu(window.location.pathname || '/', false);
      renderDrawer();
      toast('↩ OK', '✨');
    });
  }

  function syncDrawerUI() {
    if (!customizeOpen) return;
    const body = qs('#vcrDrawerBody');
    if (!body) return;
    const p = getLayoutPrefs();
    // سینک درجا (بدون innerHTML دوباره) تا درگ اسلایدر/انتخاب رنگ نمیرد
    const mark = (sel, attr, val) => body.querySelectorAll(sel).forEach((b) => b.classList.toggle('is-active', b.getAttribute(attr) === val));
    mark('[data-mood]', 'data-mood', p.mood);
    body.querySelectorAll('[data-accent]').forEach((b) => b.classList.toggle('is-active', !p.useCustom && b.getAttribute('data-accent') === p.accent));
    mark('[data-side-mode]', 'data-side-mode', p.sidebar);
    mark('[data-side-pos]', 'data-side-pos', p.sidebarSide);
    mark('[data-density]', 'data-density', p.density);
    body.querySelectorAll('[data-widget-tg]').forEach((c) => {
      if (document.activeElement !== c) c.checked = !!p.widgets[c.getAttribute('data-widget-tg')];
    });
    const setChk = (id, v) => {
      const el = body.querySelector(id);
      if (el && document.activeElement !== el) el.checked = !!v;
    };
    setChk('#vcrCustomTg', p.useCustom);
    setChk('#vcrMotionTg', p.motion);
    setChk('#vcrSecTg', p.seconds);
    const glow = body.querySelector('#vcrGlow');
    if (glow && document.activeElement !== glow) glow.value = String(p.glow);
    const ca = body.querySelector('#vcrColorA');
    if (ca && document.activeElement !== ca) ca.value = p.customA;
    const cb = body.querySelector('#vcrColorB');
    if (cb && document.activeElement !== cb) cb.value = p.customB;
  }

  /* ================================================================== */
  /* راهنما                                                                    */
  /* ================================================================== */

  function bindHelp() {
    on(qs('#vcrHelpBtn'), 'click', () => openHelp());
    on(qs('#vcrHelpClose'), 'click', () => closeAll());
    on(qs('#vcrHelp'), 'click', (e) => {
      if (e.target.id === 'vcrHelp') closeAll();
    });
    on(qs('#vcrHelpFilter'), 'input', (e) => renderHelp(e.target.value));
  }

  function openHelp() {
    if (helpOpen) return;
    closeAll({ silent: true });
    setMobileNav(false);
    helpOpen = true;
    const h = qs('#vcrHelp');
    if (!h) return;
    const f = qs('#vcrHelpFilter');
    if (f) f.value = '';
    renderHelp('');
    h.classList.remove('hidden');
    lockScroll();
    window.setTimeout(() => qs('#vcrHelpFilter')?.focus(), 30);
  }

  function renderHelp(filter) {
    const body = qs('#vcrHelpBody');
    if (!body) return;
    const hl = helpLang();
    const q = normSearch(filter);
    const match = (txt) => !q || fuzzyScore(q, txt) >= 0;

    let html = '';
    try {
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        const touchTitle = hl === 'fa' ? 'لمسی 👆' : 'Touch 👆';
        const touchRows = hl === 'fa'
          ? ['نوبار پایین — جابه‌جایی بین ابزارها', '☰ منو — باز کردن همهٔ ابزارها', '🎲 تم — تم تصادفی', '⛶ تمرکز — حالت تمرکز', '🎨 نما — شخصی‌سازی', '🔎 — پالت فرمان لمسی']
          : ['Bottom bar — switch tools', '☰ Menu — open all tools', '🎲 Theme — random theme', '⛶ Focus — focus mode', '🎨 View — customize', '🔎 — touch command palette'];
        html += '<h4 class="vcr-help-title">' + escapeHtml(touchTitle) + '</h4>';
        html += touchRows.map((r) => '<div class="vcr-help-row"><span>' + escapeHtml(r) + '</span></div>').join('');
      }
    } catch { /* ignore */ }
    html += '<h4 class="vcr-help-title">' + escapeHtml(lt('hShortcuts')) + '</h4>';
    for (const g of SHORTCUT_GROUPS) {
      const rows = SHORTCUTS.filter((s) => s.g === g.id && match(s.desc[hl] + ' ' + s.keys));
      if (!rows.length) continue;
      html += '<div class="vcr-help-group">' + escapeHtml(g.title[hl]) + '</div>';
      html += rows.map((s) => '<div class="vcr-help-row"><span>' + escapeHtml(s.desc[hl]) + '</span><kbd class="vcr-kbd vcr-kbd--sm">' + escapeHtml(s.keys) + '</kbd></div>').join('');
    }
    const feat = FEATURES_GUIDE.filter((f) => match(f[hl]));
    if (feat.length) {
      html += '<h4 class="vcr-help-title">' + escapeHtml(lt('hFeatures')) + '</h4>';
      html += feat.map((f) => '<div class="vcr-help-row"><span>' + escapeHtml(f.icon + ' ' + f[hl]) + '</span></div>').join('');
    }
    const cust = CUSTOM_GUIDE.filter((f) => match(f[hl]));
    if (cust.length) {
      html += '<h4 class="vcr-help-title">' + escapeHtml(lt('hCustom')) + '</h4>';
      html += cust.map((f) => '<div class="vcr-help-row"><span>' + escapeHtml(f.icon + ' ' + f[hl]) + '</span></div>').join('');
    }
    const inter = INTERACT_GUIDE.filter((f) => match(f[hl]));
    if (inter.length) {
      html += '<h4 class="vcr-help-title">' + escapeHtml(lt('hInteract')) + '</h4>';
      html += inter.map((f) => '<div class="vcr-help-row"><span>' + escapeHtml(f.icon + ' ' + f[hl]) + '</span></div>').join('');
    }
    body.innerHTML = html || '<div class="vcr-cmdk-empty">' + escapeHtml(lt('cmdkEmpty')) + '</div>';
  }

  /* ================================================================== */
  /* شرتکات‌های سراسری                                                        */
  /* ================================================================== */

  function isTyping(e) {
    const t = e.target;
    if (!t) return false;
    const tag = (t.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (t.isContentEditable) return true;
    return false;
  }

  function bindShortcuts() {
    on(window, 'keydown', (e) => {
      if (destroyed) return;
      const key = (e.key || '').toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      // Esc — بستن بالاترین لایه
      if (key === 'escape') {
        if (cmdkOpen || customizeOpen || helpOpen || openPopover) {
          e.preventDefault();
          closeAll();
          return;
        }
        if (mobileNavOpen) {
          e.preventDefault();
          setMobileNav(false);
          return;
        }
      }

      // Ctrl+K — پالت
      if (mod && key === 'k') {
        e.preventDefault();
        setCmdk(!cmdkOpen);
        return;
      }
      // Ctrl+B — سایدبار
      if (mod && key === 'b') {
        e.preventDefault();
        setSidebar(cycleSidebarMode().sidebar, { force: true });
        return;
      }
      if (isTyping(e)) return;

      // Alt+1..0 — پرش ابزار
      if (e.altKey && !e.ctrlKey && !e.metaKey && /^[0-9]$/.test(e.key || '')) {
        const flat = flatMenu().filter((i) => !i.isLogout);
        const idx = e.key === '0' ? 9 : Number(e.key) - 1;
        if (flat[idx]) {
          e.preventDefault();
          navigateTo(flat[idx].link);
        }
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = key;
        if (k === 'm') {
          e.preventDefault();
          togglePlayback().catch(() => {});
        } else if (k === '.' || k === 'ʼ') {
          e.preventDefault();
          try { nextTrack(); } catch { /* ignore */ }
        } else if (k === ',') {
          e.preventDefault();
          try { prevTrack(); } catch { /* ignore */ }
        } else if (k === 'g') {
          e.preventDefault();
          navigateTo('/tools/music');
        } else if (k === 'f' && e.shiftKey) {
          e.preventDefault();
          toggleBrowserFullscreen();
        } else if (k === 'f') {
          e.preventDefault();
          toggleFocus();
        } else if (k === 't' && e.shiftKey) {
          e.preventDefault();
          cycleAccent();
        } else if (k === 't') {
          e.preventDefault();
          shuffleTheme();
        } else if (k === 'p' && e.shiftKey) {
          e.preventDefault();
          partyMode();
        } else if (k === 'l') {
          e.preventDefault();
          cycleLang();
        } else if (k === 'a') {
          e.preventDefault();
          togglePopover('activity');
        } else if (k === 'c') {
          e.preventDefault();
          if (customizeOpen) closeAll();
          else openDrawer();
        } else if (k === 'h') {
          e.preventDefault();
          if (helpOpen) closeAll();
          else openHelp();
        } else if (k === 's') {
          e.preventDefault();
          setSidebar(cycleSidebarMode().sidebar, { force: true });
        }
        return;
      }

      // ? — راهنما
      if ((e.key === '?' || key === '؟') && !mod) {
        e.preventDefault();
        if (helpOpen) closeAll();
        else openHelp();
      }
    });
  }

  /* ================================================================== */
  /* تست، نکات، اسکرول، آواتار                                                */
  /* ================================================================== */

  function toast(msg, icon = '✨') {
    if (!refs.toasts) return;
    while (refs.toasts.children.length >= 3) refs.toasts.firstChild.remove();
    const el = document.createElement('div');
    el.className = 'vcr-toast';
    el.innerHTML = '<span class="vcr-toast__ico">' + escapeHtml(icon) + '</span><span>' + escapeHtml(msg) + '</span>';
    refs.toasts.appendChild(el);
    window.setTimeout(() => {
      el.classList.add('is-out');
      window.setTimeout(() => el.remove(), 350);
    }, 2600);
  }

  function startTips() {
    const show = () => {
      if (!refs.tip || destroyed) return;
      const lang = getLang();
      const list = TIPS[lang] || TIPS.fa;
      refs.tip.textContent = '💡 ' + list[tipIndex % list.length];
      tipIndex += 1;
      if (getLayoutPrefs().motion) {
        refs.tip.classList.remove('is-swap');
        void refs.tip.offsetWidth;
        refs.tip.classList.add('is-swap');
      }
    };
    show();
    const id = window.setInterval(show, 9000);
    intervals.push(id);
  }

  let prevOverflow = '';
  let scrollLockCount = 0;
  function lockScroll() {
    const de = document.documentElement;
    if (scrollLockCount === 0) {
      prevOverflow = de.style.overflow || '';
      de.style.overflow = 'hidden';
    }
    scrollLockCount += 1;
  }
  function unlockScroll() {
    const de = document.documentElement;
    if (scrollLockCount > 0) scrollLockCount -= 1;
    if (scrollLockCount === 0 && de.style.overflow === 'hidden') de.style.overflow = prevOverflow;
  }
  function resetScrollLock() {
    scrollLockCount = 0;
    document.documentElement.style.overflow = prevOverflow;
  }

  function attachAvatarFallbacks() {
    const scope = root || document;
    scope.querySelectorAll('img[data-vcr-avatar]').forEach((img) => {
      if (!(img instanceof HTMLImageElement) || img.dataset.fbBound === '1') return;
      img.dataset.fbBound = '1';
      on(img, 'error', () => {
        if (img.dataset.fallbackApplied === '1') return;
        img.dataset.fallbackApplied = '1';
        img.src = FALLBACK_AVATAR;
      });
    });
  }

  function closeAll({ force = false, silent = false, keepCmdk = false, keepToasts = true } = {}) {
    void silent;
    void keepToasts;
    openPopover = null;
    qsa('.vcr-popover').forEach((p) => p.classList.add('hidden'));
    ['vcrActBtn', 'vcrUserBtn', 'vcrLangBtn'].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    if (!keepCmdk && cmdkOpen) {
      cmdkOpen = false;
      if (refs.cmdk) {
        refs.cmdk.classList.add('hidden');
        refs.cmdk.setAttribute('aria-hidden', 'true');
      }
    }
    if (customizeOpen) {
      customizeOpen = false;
      qs('#vcrDrawer')?.classList.add('hidden');
    }
    if (helpOpen) {
      helpOpen = false;
      qs('#vcrHelp')?.classList.add('hidden');
    }
    if (force) resetScrollLock();
    else if (!cmdkOpen && !customizeOpen && !helpOpen) unlockScroll();
  }

  /* ---------------- public API ---------------- */

  return {
    render,
    afterRender,
    getOutlet,
    destroy,
  };
}
