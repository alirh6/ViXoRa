// src/core/i18n/i18n.js
// موتور چندزبانهٔ ViXoRa — فارسی / انگلیسی / فرانسه / عربی
// کلید storage: ViXoRa:settings.lang

import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();
const SETTINGS_KEY = 'ViXoRa:settings';

export const LANGUAGES = ['fa', 'en', 'fr', 'ar'];

export const LANGUAGE_META = {
  fa: { label: 'فارسی', dir: 'rtl', flag: '🇮🇷' },
  en: { label: 'English', dir: 'ltr', flag: '🇺🇸' },
  fr: { label: 'Français', dir: 'ltr', flag: '🇫🇷' },
  ar: { label: 'العربية', dir: 'rtl', flag: '🇸🇦' },
};

/* ------------------------------------------------------------------ */
/* دیکشنری — هر کلید در چهار زبان                                      */
/* ------------------------------------------------------------------ */
const DICT = {
  fa: {
    'nav.tools': 'ابزارها', 'nav.product': 'محصول', 'nav.guide': 'راهنما', 'nav.games': 'بازی‌ها',
    'nav.pricing': 'تعرفه', 'nav.contact': 'تماس', 'nav.login': 'ورود', 'nav.dashboard': 'داشبورد',
    'hero.badge': '✨ نسخهٔ ۳.۰ جادویی منتشر شد',
    'hero.title1': 'پایانِ عصرِ پراکندگی؛',
    'hero.title2': 'به سیستم عصبیِ کسب‌وکار خود خوش آمدید',
    'hero.caption': 'ViXoRa فقط یک مجموعه ابزار نیست؛ یک هستهٔ پردازشی بی‌نقص است که حسابداری، مدیریت و CRM شما را در یک جریان یکپارچه متحد می‌کند.',
    'hero.cta1': 'شروع رایگان', 'hero.cta2': 'دموی زنده',
    'hero.hello': 'سلام', 'hero.welcomeBack': 'خوش برگشتی',
    'marquee.1': 'یکپارچه', 'marquee.2': 'هوشمند', 'marquee.3': 'چندزبانه', 'marquee.4': 'امن', 'marquee.5': 'جادویی', 'marquee.6': 'سریع',
    'stats.title': 'اعداد حرف می‌زنند',
    'stats.users': 'کاربر فعال', 'stats.tools': 'ابزار یکپارچه', 'stats.uptime': 'آپ‌تایم ٪', 'stats.lang': 'زبان زنده',
    'features.title': 'چهار رکنِ قدرت', 'features.sub': 'همه در یک فرماندهی واحد',
    'features.crm.t': 'CRM هوشمند', 'features.crm.d': 'مشتریان را بشناسید، بخش‌بندی کنید و با یک کلیک پیام بفرستید.',
    'features.note.t': 'یادداشت جادویی', 'features.note.d': 'ذهنتان را با یادآور، تگ و اشتراک‌گذاری سازماندهی کنید.',
    'features.finance.t': 'مالی شفاف', 'features.finance.d': 'وام، اقساط و جریانเงินสด را لحظه‌ای رصد کنید.',
    'features.ai.t': 'هوش مصنوعی', 'features.ai.d': 'پیش‌بینی، پیشنهاد و خودکارسازی در همه‌جا.',
    'tools.title': 'جعبه‌ابزار شما', 'tools.sub': 'روی هر کارت کلیک کنید و وارد شوید',
    'tools.open': 'باز کردن', 'tools.locked': 'به‌زودی', 'tools.yours': 'ابزارهای شما',
    'guide.title': 'راهنمای شروع', 'guide.sub': 'در چهار قدم تا استادشدن',
    'guide.s1.t': 'حساب بسازید', 'guide.s1.d': 'در کمتر از یک دقیقه ثبت‌نام کنید.',
    'guide.s2.t': 'ابزارتان را انتخاب کنید', 'guide.s2.d': 'از جعبه‌ابزار، ابزار موردنظر را فعال کنید.',
    'guide.s3.t': 'شخصی‌سازی کنید', 'guide.s3.d': 'تم، زبان و چیدمان را مال خودتان کنید.',
    'guide.s4.t': 'جادو را ببینید', 'guide.s4.d': 'همه‌چیز همگام و یکپارچه کار می‌کند.',
    'shortcuts.title': 'شورتکات‌های حرفه‌ای', 'shortcuts.sub': 'مثل یک جادوگر حرکت کنید',
    'shortcuts.hint': 'کلید ؟ را بزنید تا همه را ببینید',
    'games.title': 'زنگ تفریح', 'games.sub': 'وقتی حوصله‌تان سر رفت، برگردید',
    'games.star.t': 'شکار ستاره', 'games.star.d': 'ستاره‌ها را قبل از فرار بگیر!',
    'games.mem.t': 'نبض حافظه', 'games.mem.d': 'الگوی نورها را تکرار کن.',
    'games.play': 'بازی', 'games.score': 'امتیاز', 'games.start': 'شروع', 'games.again': 'دوباره',
    'customize.title': 'شخصی‌سازی', 'customize.theme': 'تم', 'customize.accent': 'رنگ اصلی',
    'customize.density': 'تراکم', 'customize.motion': 'حرکت', 'customize.bg': 'پس‌زمینه',
    'customize.dark': 'تیره', 'customize.light': 'روشن', 'customize.comfy': 'راحت', 'customize.compact': 'فشرده',
    'customize.on': 'روشن', 'customize.off': 'خاموش',
    'cta.title': 'آماده‌اید جادو را ببینید؟', 'cta.sub': 'همین حالا رایگان شروع کنید؛ بدون کارت اعتباری.',
    'cta.btn': 'شروع کن',
    'footer.rights': 'تمام حقوق محفوظ است.',
  },
  en: {
    'nav.tools': 'Tools', 'nav.product': 'Product', 'nav.guide': 'Guide', 'nav.games': 'Games',
    'nav.pricing': 'Pricing', 'nav.contact': 'Contact', 'nav.login': 'Login', 'nav.dashboard': 'Dashboard',
    'hero.badge': '✨ Magical v3.0 is out',
    'hero.title1': 'The end of scattered work;',
    'hero.title2': 'welcome to your business nervous system',
    'hero.caption': 'ViXoRa is not just a toolset; it is a flawless processing core that unifies accounting, management and CRM in one flow.',
    'hero.cta1': 'Start free', 'hero.cta2': 'Live demo',
    'hero.hello': 'Hello', 'hero.welcomeBack': 'Welcome back',
    'marquee.1': 'Unified', 'marquee.2': 'Smart', 'marquee.3': 'Multilingual', 'marquee.4': 'Secure', 'marquee.5': 'Magical', 'marquee.6': 'Fast',
    'stats.title': 'Numbers talk',
    'stats.users': 'Active users', 'stats.tools': 'Integrated tools', 'stats.uptime': 'Uptime %', 'stats.lang': 'Live languages',
    'features.title': 'Four pillars of power', 'features.sub': 'All in one command',
    'features.crm.t': 'Smart CRM', 'features.crm.d': 'Know, segment and message your customers in one click.',
    'features.note.t': 'Magic Notes', 'features.note.d': 'Organize your mind with reminders, tags and sharing.',
    'features.finance.t': 'Clear finance', 'features.finance.d': 'Track loans, installments and cashflow live.',
    'features.ai.t': 'AI inside', 'features.ai.d': 'Prediction, suggestion and automation everywhere.',
    'tools.title': 'Your toolbox', 'tools.sub': 'Click a card to enter',
    'tools.open': 'Open', 'tools.locked': 'Soon', 'tools.yours': 'Your tools',
    'guide.title': 'Getting started', 'guide.sub': 'Four steps to mastery',
    'guide.s1.t': 'Create account', 'guide.s1.d': 'Sign up in under a minute.',
    'guide.s2.t': 'Pick a tool', 'guide.s2.d': 'Activate the tool you need.',
    'guide.s3.t': 'Personalize', 'guide.s3.d': 'Make theme, language and layout yours.',
    'guide.s4.t': 'See the magic', 'guide.s4.d': 'Everything works in sync.',
    'shortcuts.title': 'Pro shortcuts', 'shortcuts.sub': 'Move like a wizard',
    'shortcuts.hint': 'Press ? to see them all',
    'games.title': 'Play time', 'games.sub': 'When bored, come back',
    'games.star.t': 'Star Catch', 'games.star.d': 'Catch stars before they escape!',
    'games.mem.t': 'Memory Pulse', 'games.mem.d': 'Repeat the light pattern.',
    'games.play': 'Play', 'games.score': 'Score', 'games.start': 'Start', 'games.again': 'Again',
    'customize.title': 'Customize', 'customize.theme': 'Theme', 'customize.accent': 'Accent',
    'customize.density': 'Density', 'customize.motion': 'Motion', 'customize.bg': 'Background',
    'customize.dark': 'Dark', 'customize.light': 'Light', 'customize.comfy': 'Comfy', 'customize.compact': 'Compact',
    'customize.on': 'On', 'customize.off': 'Off',
    'cta.title': 'Ready to see the magic?', 'cta.sub': 'Start free now; no credit card.',
    'cta.btn': 'Get started',
    'footer.rights': 'All rights reserved.',
  },
  fr: {
    'nav.tools': 'Outils', 'nav.product': 'Produit', 'nav.guide': 'Guide', 'nav.games': 'Jeux',
    'nav.pricing': 'Tarifs', 'nav.contact': 'Contact', 'nav.login': 'Connexion', 'nav.dashboard': 'Tableau',
    'hero.badge': '✨ La v3.0 magique est là',
    'hero.title1': 'Fin du travail éparpillé ;',
    'hero.title2': 'bienvenue dans votre système nerveux',
    'hero.caption': 'ViXoRa n’est pas qu’une boîte à outils ; c’est un noyau de traitement qui unifie comptabilité, gestion et CRM.',
    'hero.cta1': 'Commencer', 'hero.cta2': 'Démo live',
    'hero.hello': 'Bonjour', 'hero.welcomeBack': 'Bon retour',
    'marquee.1': 'Unifié', 'marquee.2': 'Intelligent', 'marquee.3': 'Multilingue', 'marquee.4': 'Sécurisé', 'marquee.5': 'Magique', 'marquee.6': 'Rapide',
    'stats.title': 'Les chiffres parlent',
    'stats.users': 'Utilisateurs actifs', 'stats.tools': 'Outils intégrés', 'stats.uptime': 'Dispo %', 'stats.lang': 'Langues vivantes',
    'features.title': 'Quatre piliers', 'features.sub': 'Tout en un seul commande',
    'features.crm.t': 'CRM intelligent', 'features.crm.d': 'Connaissez, segmentez et messagez vos clients.',
    'features.note.t': 'Notes magiques', 'features.note.d': 'Organisez votre esprit avec rappels et tags.',
    'features.finance.t': 'Finance claire', 'features.finance.d': 'Suivez prêts et trésorerie en direct.',
    'features.ai.t': 'IA intégrée', 'features.ai.d': 'Prédiction et automatisation partout.',
    'tools.title': 'Votre boîte à outils', 'tools.sub': 'Cliquez sur une carte',
    'tools.open': 'Ouvrir', 'tools.locked': 'Bientôt', 'tools.yours': 'Vos outils',
    'guide.title': 'Démarrage', 'guide.sub': 'Quatre étapes',
    'guide.s1.t': 'Créer un compte', 'guide.s1.d': 'Inscription en une minute.',
    'guide.s2.t': 'Choisir un outil', 'guide.s2.d': 'Activez l’outil voulu.',
    'guide.s3.t': 'Personnaliser', 'guide.s3.d': 'Thème, langue et layout à vous.',
    'guide.s4.t': 'Voir la magie', 'guide.s4.d': 'Tout fonctionne en sync.',
    'shortcuts.title': 'Raccourcis pro', 'shortcuts.sub': 'Bougez comme un magicien',
    'shortcuts.hint': 'Appuyez sur ? pour tout voir',
    'games.title': 'Pause jeu', 'games.sub': 'Quand vous vous ennuyez',
    'games.star.t': 'Attrape-étoiles', 'games.star.d': 'Attrapez les étoiles !',
    'games.mem.t': 'Pulsation mémoire', 'games.mem.d': 'Répétez le motif lumineux.',
    'games.play': 'Jouer', 'games.score': 'Score', 'games.start': 'Start', 'games.again': 'Encore',
    'customize.title': 'Personnaliser', 'customize.theme': 'Thème', 'customize.accent': 'Accent',
    'customize.density': 'Densité', 'customize.motion': 'Motion', 'customize.bg': 'Fond',
    'customize.dark': 'Sombre', 'customize.light': 'Clair', 'customize.comfy': 'Confort', 'customize.compact': 'Compact',
    'customize.on': 'On', 'customize.off': 'Off',
    'cta.title': 'Prêt pour la magie ?', 'cta.sub': 'Commencez gratuitement.',
    'cta.btn': 'Démarrer',
    'footer.rights': 'Tous droits réservés.',
  },
  ar: {
    'nav.tools': 'الأدوات', 'nav.product': 'المنتج', 'nav.guide': 'الدليل', 'nav.games': 'ألعاب',
    'nav.pricing': 'الأسعار', 'nav.contact': 'اتصل', 'nav.login': 'دخول', 'nav.dashboard': 'لوحة',
    'hero.badge': '✨ الإصدار ٣.٠ السحري متاح',
    'hero.title1': 'نهاية العمل المشتت؛',
    'hero.title2': 'مرحباً بك في جهازك العصبي للأعمال',
    'hero.caption': 'فيكسورا ليست مجرد أدوات؛ بل نواة معالجة توحّد المحاسبة والإدارة و CRM في تدفق واحد.',
    'hero.cta1': 'ابدأ مجاناً', 'hero.cta2': 'عرض مباشر',
    'hero.hello': 'مرحباً', 'hero.welcomeBack': 'أهلاً بعودتك',
    'marquee.1': 'موحّد', 'marquee.2': 'ذكي', 'marquee.3': 'متعدد اللغات', 'marquee.4': 'آمن', 'marquee.5': 'سحري', 'marquee.6': 'سريع',
    'stats.title': 'الأرقام تتحدث',
    'stats.users': 'مستخدم نشط', 'stats.tools': 'أداة متكاملة', 'stats.uptime': 'توفر ٪', 'stats.lang': 'لغات حية',
    'features.title': 'أربعة أركان للقوة', 'features.sub': 'الكل في قيادة واحدة',
    'features.crm.t': 'CRM ذكي', 'features.crm.d': 'اعرف عملاءك وقسّمهم وراسلهم بنقرة.',
    'features.note.t': 'ملاحظات سحرية', 'features.note.d': 'نظّم عقلك بالتذكيرات والوسوم.',
    'features.finance.t': 'مال واضح', 'features.finance.d': 'تابع القروض والتدفق لحظة بلحظة.',
    'features.ai.t': 'ذكاء اصطناعي', 'features.ai.d': 'تنبؤ وأتمتة في كل مكان.',
    'tools.title': 'صندوق أدواتك', 'tools.sub': 'انقر على بطاقة للدخول',
    'tools.open': 'فتح', 'tools.locked': 'قريباً', 'tools.yours': 'أدواتك',
    'guide.title': 'دليل البدء', 'guide.sub': 'أربع خطوات للإتقان',
    'guide.s1.t': 'أنشئ حساباً', 'guide.s1.d': 'سجّل في أقل من دقيقة.',
    'guide.s2.t': 'اختر أداة', 'guide.s2.d': 'فعّل الأداة التي تريد.',
    'guide.s3.t': 'خصّص', 'guide.s3.d': 'اجعل الثيم واللغة لك.',
    'guide.s4.t': 'شاهد السحر', 'guide.s4.d': 'كل شيء يعمل بتناغم.',
    'shortcuts.title': 'اختصارات احترافية', 'shortcuts.sub': 'تحرك كساحر',
    'shortcuts.hint': 'اضغط ؟ لرؤية الكل',
    'games.title': 'وقت اللعب', 'games.sub': 'عند الملل عد إلينا',
    'games.star.t': 'صائد النجوم', 'games.star.d': 'التقط النجوم قبل هروبها!',
    'games.mem.t': 'نبض الذاكرة', 'games.mem.d': 'كرّر نمط الأضواء.',
    'games.play': 'العب', 'games.score': 'نقاط', 'games.start': 'ابدأ', 'games.again': 'مجدداً',
    'customize.title': 'تخصيص', 'customize.theme': 'الثيم', 'customize.accent': 'اللون',
    'customize.density': 'الكثافة', 'customize.motion': 'الحركة', 'customize.bg': 'الخلفية',
    'customize.dark': 'داكن', 'customize.light': 'فاتح', 'customize.comfy': 'مريح', 'customize.compact': 'مضغوط',
    'customize.on': 'تشغيل', 'customize.off': 'إيقاف',
    'cta.title': 'جاهز لرؤية السحر؟', 'cta.sub': 'ابدأ مجاناً الآن.',
    'cta.btn': 'ابدأ',
    'footer.rights': 'جميع الحقوق محفوظة.',
  },
};

/* کلیدهای لایوت صفحهٔ خانه */
Object.assign(DICT.fa, {
  'nav.home':'خانه',
  'tool.note.t':'یادداشت','tool.note.d':'ذهنت را سازماندهی کن',
  'tool.customerInfo.t':'مشتریان','tool.customerInfo.d':'CRM جادویی',
  'tool.bankLoans.t':'وام بانکی','tool.bankLoans.d':'اقساط و مالی شفاف',
  'tool.music.t':'موزیک','tool.music.d':'به‌زودی','tool.vault.t':'گاوصندوق','tool.vault.d':'به‌زودی','tool.chat.t':'چت','tool.chat.d':'به‌زودی',
  'layout.allTools':'همهٔ ابزارها',
  'footer.tagline':'سیستم عصبی کسب‌وکار شما',
  'footer.quick':'دسترسی سریع','footer.toolst':'ابزارها','footer.follow':'همراه ما',
  'footer.made':'ساخته‌شده با جادو ✨','layout.top':'بازگشت بالا',
});
Object.assign(DICT.en, {
  'nav.home':'Home',
  'tool.note.t':'Notes','tool.note.d':'Organize your mind',
  'tool.customerInfo.t':'Customers','tool.customerInfo.d':'Magic CRM',
  'tool.bankLoans.t':'Bank Loans','tool.bankLoans.d':'Installments & finance',
  'tool.music.t':'Music','tool.music.d':'Soon','tool.vault.t':'Vault','tool.vault.d':'Soon','tool.chat.t':'Chat','tool.chat.d':'Soon',
  'layout.allTools':'All tools',
  'footer.tagline':'Your business nervous system',
  'footer.quick':'Quick access','footer.toolst':'Tools','footer.follow':'Follow us',
  'footer.made':'Made with magic ✨','layout.top':'Back to top',
});
Object.assign(DICT.fr, {
  'nav.home':'Accueil',
  'tool.note.t':'Notes','tool.note.d':'Organisez votre esprit',
  'tool.customerInfo.t':'Clients','tool.customerInfo.d':'CRM magique',
  'tool.bankLoans.t':'Prêts','tool.bankLoans.d':'Finance claire',
  'tool.music.t':'Musique','tool.music.d':'Bientôt','tool.vault.t':'Coffre','tool.vault.d':'Bientôt','tool.chat.t':'Chat','tool.chat.d':'Bientôt',
  'layout.allTools':'Tous les outils',
  'footer.tagline':'Votre système nerveux',
  'footer.quick':'Accès rapide','footer.toolst':'Outils','footer.follow':'Suivez-nous',
  'footer.made':'Fait avec magie ✨','layout.top':'Haut',
});
Object.assign(DICT.ar, {
  'nav.home':'الرئيسية',
  'tool.note.t':'ملاحظات','tool.note.d':'نظّم عقلك',
  'tool.customerInfo.t':'العملاء','tool.customerInfo.d':'CRM سحري',
  'tool.bankLoans.t':'قروض','tool.bankLoans.d':'أقساط ومال واضح',
  'tool.music.t':'موسيقى','tool.music.d':'قريباً','tool.vault.t':'خزنة','tool.vault.d':'قريباً','tool.chat.t':'دردشة','tool.chat.d':'قريباً',
  'layout.allTools':'كل الأدوات',
  'footer.tagline':'جهازك العصبي للأعمال',
  'footer.quick':'وصول سريع','footer.toolst':'الأدوات','footer.follow':'تابعنا',
  'footer.made':'صُنع بالسحر ✨','layout.top':'الأعلى',
});

const listeners = new Set();
let currentLang = readStoredLang();

function readStoredLang() {
  const settings = storage.get(SETTINGS_KEY, null);
  const lang = settings?.lang;
  return LANGUAGES.includes(lang) ? lang : 'fa';
}

export function getLang() {
  return currentLang;
}

export function getDir(lang = currentLang) {
  return LANGUAGE_META[lang]?.dir || 'rtl';
}

export function t(key, lang = currentLang) {
  return DICT[lang]?.[key] ?? DICT.fa[key] ?? key;
}

export function setLang(lang) {
  if (!LANGUAGES.includes(lang)) return;
  currentLang = lang;

  const settings = storage.get(SETTINGS_KEY, {}) || {};
  settings.lang = lang;
  storage.set(SETTINGS_KEY, settings);

  document.documentElement.lang = lang;
  document.documentElement.dir = getDir(lang);

  // snapshot تا listenerهایی که حین اجرا اضافه/حذف می‌شوند (مثل rebuild صفحه)
  // باعث بازگشت بی‌نهایت نشوند
  [...listeners].forEach((fn) => fn(lang));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyLangToDom(root) {
  if (!root) return;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const [attr, key] = el.getAttribute('data-i18n-attr').split(':');
    el.setAttribute(attr, t(key));
  });
}
