// src/core/schemas/customer-schema.js

/**
 * ViXoRa — اسکیمای «اطلاعات مشتریان» (CRM ابزار)
 * ==================================================================
 * این فایل قلب ابزار اطلاعات مشتری است و هیچ وابستگی به DOM ندارد.
 *
 * طراحی:
 *   - یک مشتری = یک آبجکت با «بخش‌ها» (sections)
 *   - هر بخش مجموعه‌ای «فیلد» دارد با نوع، اعتبارسنج و برچسب فارسی
 *   - ادمین خودش انتخاب می‌کند کدام بخش‌ها را پر کند (SECTION_META)
 *   - بخش‌های فنی (ورودها/دستگاه/آمار) هم دستی و هم خودکار پر می‌شوند
 *
 * نسخه: 1 — هر مشتری `version: 1` می‌گیرد تا مهاجرت بعدی ممکن باشد.
 */

/* ================================================================== */
/* ثابت‌ها                                                             */
/* ================================================================== */

export const CUSTOMER_GENDERS = ['unknown', 'male', 'female', 'other'];

export const GENDER_LABELS = {
  unknown: 'نامشخص',
  male: 'آقا',
  female: 'خانم',
  other: 'سایر',
};

export const ACCOUNT_TYPES = ['guest', 'normal', 'vip', 'corporate', 'wholesale', 'reseller'];

export const ACCOUNT_TYPE_LABELS = {
  guest: 'مهمان',
  normal: 'عادی',
  vip: 'ویژه (VIP)',
  corporate: 'حقوقی/شرکتی',
  wholesale: 'عمده‌فروش',
  reseller: 'نماینده فروش',
};

export const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked', 'pending', 'churned', 'lead'];

export const CUSTOMER_STATUS_LABELS = {
  active: 'فعال',
  inactive: 'غیرفعال',
  blocked: 'مسدود',
  pending: 'در انتظار تأیید',
  churned: 'ریزش‌کرده',
  lead: 'سرنخ فروش',
};

export const LOYALTY_TIERS = ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const LOYALTY_TIER_LABELS = {
  none: 'بدون سطح',
  bronze: 'برنزی',
  silver: 'نقره‌ای',
  gold: 'طلایی',
  platinum: 'پلاتینی',
  diamond: 'الماسی',
};

export const CUSTOMER_VIEWS = ['table', 'cards', 'list', 'board', 'map', 'timeline', 'compact'];

export const CUSTOMER_VIEW_LABELS = {
  table: 'جدولی',
  cards: 'کارتی',
  list: 'لیست',
  board: 'بورد وضعیت',
  map: 'نقشه',
  timeline: 'زمان‌بندی',
  compact: 'فشرده',
};

export const CUSTOMER_SORTS = [
  'smart',
  'newest',
  'oldest',
  'name',
  'balance-desc',
  'balance-asc',
  'spend-desc',
  'last-purchase',
  'last-login',
  'age-asc',
  'age-desc',
  'orders-desc',
  'engagement',
  'random',
];

export const CUSTOMER_SORT_LABELS = {
  smart: 'مرتب‌سازی هوشمند',
  newest: 'جدیدترین عضویت',
  oldest: 'قدیمی‌ترین عضویت',
  name: 'الفبایی (نام)',
  'balance-desc': 'بیشترین موجودی',
  'balance-asc': 'کمترین موجودی',
  'spend-desc': 'بیشترین خرید',
  'last-purchase': 'آخرین خرید',
  'last-login': 'آخرین ورود',
  'age-asc': 'کم‌سن‌ترین',
  'age-desc': 'بالاترین سن',
  'orders-desc': 'بیشترین سفارش',
  engagement: 'بیشترین تعامل',
  random: 'تصادفی',
};

export const CUSTOMER_GROUPS = ['none', 'gender', 'city', 'country', 'accountType', 'status', 'tier', 'ageRange', 'balanceRange'];

export const CUSTOMER_GROUP_LABELS = {
  none: 'بدون گروه‌بندی',
  gender: 'جنسیت',
  city: 'شهر',
  country: 'کشور',
  accountType: 'نوع حساب',
  status: 'وضعیت',
  tier: 'سطح وفاداری',
  ageRange: 'بازهٔ سنی',
  balanceRange: 'بازهٔ موجودی',
};

/** کانال‌های ارتباطی پشتیبانی‌شده برای پیام‌رسانی */
export const OUTREACH_CHANNELS = ['inapp', 'sms', 'email', 'whatsapp', 'telegram', 'push', 'webhook'];

export const CHANNEL_LABELS = {
  inapp: 'پیام درون‌برنامه‌ای',
  sms: 'پیامک',
  email: 'ایمیل',
  whatsapp: 'واتساپ',
  telegram: 'تلگرام',
  push: 'پوش نوتیفیکیشن',
  webhook: 'وب‌هوک (پنل پیامکی)',
};

/* ================================================================== */
/* تعریف بخش‌ها و فیلدها                                               */
/* ================================================================== */

/**
 * هر فیلد:
 *   key, label, type, section, placeholder?, hint?, required?, validate?, default?
 * انواع: text, textarea, number, money, tel, email, url, date, datetime, time,
 *        select, multiselect, checkbox, rating, nationalCode, cardNumber, shaba,
 *        tags, phone-list, color
 */
export const CUSTOMER_FIELDS = [
  /* ---------- هویت ---------- */
  { key: 'firstName', label: 'نام', type: 'text', section: 'identity', required: true, default: '', placeholder: 'مثلاً سارا' },
  { key: 'lastName', label: 'نام خانوادگی', type: 'text', section: 'identity', default: '', placeholder: 'مثلاً احمدی' },
  { key: 'fatherName', label: 'نام پدر', type: 'text', section: 'identity', default: '' },
  { key: 'username', label: 'نام کاربری', type: 'text', section: 'identity', default: '', placeholder: 'username' },
  { key: 'displayName', label: 'نام نمایشی', type: 'text', section: 'identity', default: '', hint: 'اگر خالی باشد از نام و نام خانوادگی ساخته می‌شود' },
  { key: 'nationalCode', label: 'کد ملی', type: 'nationalCode', section: 'identity', default: '', validate: 'nationalCode' },
  { key: 'birthDate', label: 'تاریخ تولد', type: 'date', section: 'identity', default: '', hint: 'برای محاسبهٔ سن و تبریک تولد' },
  { key: 'gender', label: 'جنسیت', type: 'select', section: 'identity', default: 'unknown', options: CUSTOMER_GENDERS, optionLabels: GENDER_LABELS },
  { key: 'maritalStatus', label: 'وضعیت تأهل', type: 'select', section: 'identity', default: 'unknown', options: ['unknown', 'single', 'married', 'divorced', 'widowed'], optionLabels: { unknown: 'نامشخص', single: 'مجرد', married: 'متأهل', divorced: 'جداشده', widowed: 'همسر فوت‌شده' } },
  { key: 'avatar', label: 'عکس پروفایل', type: 'text', section: 'identity', default: '', hint: 'آدرس تصویر یا Data URL — اگر خالی باشد حروف اول نام نمایش داده می‌شود' },
  { key: 'occupation', label: 'شغل', type: 'text', section: 'identity', default: '' },
  { key: 'company', label: 'شرکت / سازمان', type: 'text', section: 'identity', default: '' },
  { key: 'bio', label: 'دربارهٔ مشتری', type: 'textarea', section: 'identity', default: '' },

  /* ---------- تماس ---------- */
  { key: 'mobile', label: 'موبایل', type: 'tel', section: 'contact', default: '', placeholder: '09xxxxxxxxx', validate: 'phone' },
  { key: 'phone', label: 'تلفن ثابت', type: 'tel', section: 'contact', default: '' },
  { key: 'email', label: 'ایمیل', type: 'email', section: 'contact', default: '', validate: 'email' },
  { key: 'alternateEmail', label: 'ایمیل دوم', type: 'email', section: 'contact', default: '', validate: 'email' },
  { key: 'whatsapp', label: 'واتساپ', type: 'tel', section: 'contact', default: '' },
  { key: 'telegram', label: 'تلگرام', type: 'text', section: 'contact', default: '', placeholder: '@username' },
  { key: 'instagram', label: 'اینستاگرام', type: 'text', section: 'contact', default: '' },
  { key: 'website', label: 'وب‌سایت', type: 'url', section: 'contact', default: '' },
  { key: 'preferredChannel', label: 'کانال ترجیحی ارتباط', type: 'select', section: 'contact', default: 'sms', options: OUTREACH_CHANNELS, optionLabels: CHANNEL_LABELS },
  { key: 'doNotDisturb', label: 'تماس گرفته نشود', type: 'checkbox', section: 'contact', default: false, hint: 'در کمپین‌های گروهی نادیده گرفته می‌شود' },

  /* ---------- مالی ---------- */
  { key: 'balance', label: 'موجودی کیف پول', type: 'money', section: 'finance', default: 0 },
  { key: 'creditLimit', label: 'سقف اعتبار', type: 'money', section: 'finance', default: 0 },
  { key: 'debt', label: 'بدهی', type: 'money', section: 'finance', default: 0 },
  { key: 'totalSpent', label: 'مجموع خرید', type: 'money', section: 'finance', default: 0 },
  { key: 'averageOrderValue', label: 'میانگین سبد خرید', type: 'money', section: 'finance', default: 0 },
  { key: 'orderCount', label: 'تعداد سفارش', type: 'number', section: 'finance', default: 0 },
  { key: 'refundCount', label: 'تعداد مرجوعی', type: 'number', section: 'finance', default: 0 },
  { key: 'cardNumber', label: 'شماره کارت', type: 'cardNumber', section: 'finance', default: '', validate: 'cardNumber' },
  { key: 'shabaNumber', label: 'شماره شبا', type: 'shaba', section: 'finance', default: '', validate: 'shaba', placeholder: 'IR00...' },
  { key: 'bankName', label: 'نام بانک', type: 'text', section: 'finance', default: '' },
  { key: 'taxCode', label: 'کد اقتصادی / شناسه ملی', type: 'text', section: 'finance', default: '' },
  { key: 'discountPercent', label: 'درصد تخفیف اختصاصی', type: 'number', section: 'finance', default: 0 },

  /* ---------- موقعیت ---------- */
  { key: 'country', label: 'کشور', type: 'text', section: 'location', default: 'ایران' },
  { key: 'province', label: 'استان', type: 'text', section: 'location', default: '' },
  { key: 'city', label: 'شهر', type: 'text', section: 'location', default: '' },
  { key: 'district', label: 'محله / منطقه', type: 'text', section: 'location', default: '' },
  { key: 'postalCode', label: 'کد پستی', type: 'text', section: 'location', default: '' },
  { key: 'address', label: 'آدرس کامل', type: 'textarea', section: 'location', default: '', hint: 'قابل انتخاب از نقشه و ویرایش دستی' },
  { key: 'lat', label: 'عرض جغرافیایی', type: 'number', section: 'location', default: '' },
  { key: 'lng', label: 'طول جغرافیایی', type: 'number', section: 'location', default: '' },
  { key: 'mapAccuracy', label: 'دقت مکان (متر)', type: 'number', section: 'location', default: '' },
  { key: 'timezone', label: 'منطقهٔ زمانی', type: 'text', section: 'location', default: 'Asia/Tehran' },

  /* ---------- خرید و فروشگاه ---------- */
  { key: 'hasOpenCart', label: 'سبد خرید پرداخت‌نشده', type: 'checkbox', section: 'commerce', default: false, hint: 'خودکار یا دستی' },
  { key: 'cartValue', label: 'ارزش سبد باز', type: 'money', section: 'commerce', default: 0 },
  { key: 'cartUpdatedAt', label: 'آخرین تغییر سبد', type: 'datetime', section: 'commerce', default: '' },
  { key: 'lastPurchaseAt', label: 'آخرین خرید', type: 'datetime', section: 'commerce', default: '' },
  { key: 'lastOrderNumber', label: 'شمارهٔ آخرین سفارش', type: 'text', section: 'commerce', default: '' },
  { key: 'firstPurchaseAt', label: 'اولین خرید', type: 'datetime', section: 'commerce', default: '' },
  { key: 'wishlistCount', label: 'تعداد علاقه‌مندی', type: 'number', section: 'commerce', default: 0 },
  { key: 'favoriteCategories', label: 'دسته‌های محبوب', type: 'tags', section: 'commerce', default: [] },
  { key: 'customerLifetimeValue', label: 'ارزش طول عمر (CLV)', type: 'money', section: 'commerce', default: 0 },
  { key: 'couponCode', label: 'کد تخفیف فعال', type: 'text', section: 'commerce', default: '' },
  { key: 'referralCode', label: 'کد معرفی', type: 'text', section: 'commerce', default: '' },
  { key: 'referredBy', label: 'معرفی‌شده توسط', type: 'text', section: 'commerce', default: '' },

  /* ---------- پشتیبانی ---------- */
  { key: 'hasOpenTicket', label: 'تیکت باز دارد', type: 'checkbox', section: 'support', default: false },
  { key: 'ticketCount', label: 'تعداد تیکت', type: 'number', section: 'support', default: 0 },
  { key: 'lastTicketAt', label: 'آخرین تیکت', type: 'datetime', section: 'support', default: '' },
  { key: 'messageCount', label: 'تعداد پیام به پشتیبانی', type: 'number', section: 'support', default: 0 },
  { key: 'lastMessageAt', label: 'آخرین پیام', type: 'datetime', section: 'support', default: '' },
  { key: 'hasUnreadReply', label: 'پاسخ خوانده‌نشده دارد', type: 'checkbox', section: 'support', default: false },
  { key: 'satisfactionScore', label: 'امتیاز رضایت', type: 'rating', section: 'support', default: 0 },
  { key: 'complaintCount', label: 'تعداد شکایت', type: 'number', section: 'support', default: 0 },
  { key: 'supportPriority', label: 'اولویت پشتیبانی', type: 'select', section: 'support', default: 'normal', options: ['low', 'normal', 'high', 'urgent'], optionLabels: { low: 'کم', normal: 'عادی', high: 'زیاد', urgent: 'فوری' } },
  { key: 'assignedAgent', label: 'کارشناس مسئول', type: 'text', section: 'support', default: '' },

  /* ---------- دستگاه، ورود و رفتار (خودکار/دستی) ---------- */
  { key: 'signupAt', label: 'تاریخ ثبت‌نام', type: 'datetime', section: 'telemetry', default: '' },
  { key: 'signupDevice', label: 'اولین دستگاه', type: 'text', section: 'telemetry', default: '' },
  { key: 'signupIp', label: 'اولین IP', type: 'text', section: 'telemetry', default: '' },
  { key: 'signupReferrer', label: 'منبع ورود (Referrer)', type: 'text', section: 'telemetry', default: '' },
  { key: 'lastLoginAt', label: 'آخرین ورود', type: 'datetime', section: 'telemetry', default: '' },
  { key: 'lastLoginDevice', label: 'آخرین دستگاه', type: 'text', section: 'telemetry', default: '' },
  { key: 'lastLoginIp', label: 'آخرین IP', type: 'text', section: 'telemetry', default: '' },
  { key: 'lastLoginCity', label: 'شهر آخرین ورود', type: 'text', section: 'telemetry', default: '' },
  { key: 'loginCount', label: 'تعداد ورودها', type: 'number', section: 'telemetry', default: 0 },
  { key: 'onlineSeconds', label: 'مجموع زمان آنلاین (ثانیه)', type: 'number', section: 'telemetry', default: 0, hint: 'خودکار از ردیاب نشست محاسبه می‌شود' },
  { key: 'pageViewCount', label: 'تعداد بازدید صفحه', type: 'number', section: 'telemetry', default: 0 },
  { key: 'lastSeenAt', label: 'آخرین فعالیت', type: 'datetime', section: 'telemetry', default: '' },
  { key: 'deviceCount', label: 'تعداد دستگاه‌های شناخته‌شده', type: 'number', section: 'telemetry', default: 0 },
  { key: 'preferredDevice', label: 'دستگاه غالب', type: 'text', section: 'telemetry', default: '' },
  { key: 'firstLoginAt', label: 'اولین ورود', type: 'datetime', section: 'telemetry', default: '' },
  { key: 'firstLoginDevice', label: 'دستگاه اولین ورود', type: 'text', section: 'telemetry', default: '' },
  { key: 'firstLoginIp', label: 'IP اولین ورود', type: 'text', section: 'telemetry', default: '' },
  { key: 'firstSignupDevice', label: 'دستگاه ثبت‌نام', type: 'text', section: 'telemetry', default: '' },
  { key: 'lastSeenPage', label: 'آخرین صفحهٔ دیده‌شده', type: 'text', section: 'telemetry', default: '' },
  { key: 'locationSource', label: 'منبع موقعیت', type: 'text', section: 'telemetry', default: '' },
  { key: 'lastContactAt', label: 'آخرین تماس ما', type: 'datetime', section: 'telemetry', default: '' },

  /* ---------- ترجیحات ---------- */
  { key: 'language', label: 'زبان', type: 'select', section: 'preferences', default: 'fa', options: ['fa', 'en', 'ar', 'fr', 'es', 'tr'], optionLabels: { fa: 'فارسی', en: 'انگلیسی', ar: 'عربی', fr: 'فرانسوی', es: 'اسپانیایی', tr: 'ترکی' } },
  { key: 'theme', label: 'پوسته', type: 'select', section: 'preferences', default: 'system', options: ['system', 'dark', 'light'], optionLabels: { system: 'خودکار', dark: 'تاریک', light: 'روشن' } },
  { key: 'smsOptIn', label: 'دریافت پیامک', type: 'checkbox', section: 'preferences', default: true },
  { key: 'emailOptIn', label: 'دریافت ایمیل', type: 'checkbox', section: 'preferences', default: true },
  { key: 'pushOptIn', label: 'دریافت پوش نوتیفیکیشن', type: 'checkbox', section: 'preferences', default: true },
  { key: 'birthdayReminder', label: 'یادآوری تولد', type: 'checkbox', section: 'preferences', default: true },
  { key: 'quietFrom', label: 'سکوت از ساعت', type: 'time', section: 'preferences', default: '22:00' },
  { key: 'quietTo', label: 'سکوت تا ساعت', type: 'time', section: 'preferences', default: '08:00' },
  { key: 'contactTime', label: 'بهترین زمان تماس', type: 'text', section: 'preferences', default: '' },

  /* ---------- چرخهٔ عمر و وفاداری ---------- */
  { key: 'status', label: 'وضعیت', type: 'select', section: 'lifecycle', default: 'active', options: CUSTOMER_STATUSES, optionLabels: CUSTOMER_STATUS_LABELS },
  { key: 'accountType', label: 'نوع حساب', type: 'select', section: 'lifecycle', default: 'normal', options: ACCOUNT_TYPES, optionLabels: ACCOUNT_TYPE_LABELS },
  { key: 'source', label: 'منبع آشنایی', type: 'text', section: 'lifecycle', default: '', placeholder: 'گوگل، اینستاگرام، معرفی دوستان…' },
  { key: 'loyaltyTier', label: 'سطح وفاداری', type: 'select', section: 'lifecycle', default: 'none', options: LOYALTY_TIERS, optionLabels: LOYALTY_TIER_LABELS },
  { key: 'loyaltyPoints', label: 'امتیاز وفاداری', type: 'number', section: 'lifecycle', default: 0 },
  { key: 'tags', label: 'برچسب‌ها', type: 'tags', section: 'lifecycle', default: [] },
  { key: 'riskScore', label: 'امتیاز ریزش (۰ تا ۱۰۰)', type: 'number', section: 'lifecycle', default: 0, hint: 'خودکار یا دستی' },
  { key: 'leadScore', label: 'امتیاز سرنخ (۰ تا ۱۰۰)', type: 'number', section: 'lifecycle', default: 0 },
  { key: 'contractUntil', label: 'پایان قرارداد', type: 'date', section: 'lifecycle', default: '' },
  { key: 'owner', label: 'مالک رابطه (اکانت منیجر)', type: 'text', section: 'lifecycle', default: '' },
  { key: 'nextFollowUpAt', label: 'پیگیری بعدی', type: 'datetime', section: 'lifecycle', default: '' },

  /* ---------- فیلدهای دلخواه ---------- */
  { key: 'customFields', label: 'فیلدهای دلخواه', type: 'keyvalue', section: 'custom', default: [], hint: 'هر دادهٔ دیگری که نیاز داری؛ بدون محدودیت' },
  { key: 'extraNotes', label: 'توضیحات اضافی', type: 'textarea', section: 'custom', default: '' },
];

/** نمایهٔ سریع فیلد بر اساس کلید */
export const CUSTOMER_FIELD_MAP = CUSTOMER_FIELDS.reduce((map, field) => {
  map[field.key] = field;
  return map;
}, {});

/* ================================================================== */
/* متادیتای بخش‌ها                                                     */
/* ================================================================== */

export const CUSTOMER_SECTIONS = [
  { key: 'identity', label: 'هویت', icon: '🪪', description: 'نام، کد ملی، تولد، جنسیت و عکس', priority: 'high' },
  { key: 'contact', label: 'راه‌های تماس', icon: '📞', description: 'موبایل، ایمیل، شبکه‌های اجتماعی و کانال ترجیحی', priority: 'high' },
  { key: 'finance', label: 'مالی و بانکی', icon: '💳', description: 'موجودی، کارت، شبا، بدهی و تخفیف', priority: 'high' },
  { key: 'location', label: 'موقعیت و آدرس', icon: '📍', description: 'کشور، شهر، آدرس و مختصات نقشه', priority: 'high' },
  { key: 'commerce', label: 'خرید و فروشگاه', icon: '🛒', description: 'سبد باز، آخرین خرید، CLV و معرفی', priority: 'medium' },
  { key: 'support', label: 'پشتیبانی', icon: '🎧', description: 'تیکت، پیام، رضایت و کارشناس مسئول', priority: 'medium' },
  { key: 'telemetry', label: 'دستگاه و رفتار', icon: '🛰️', description: 'ورودها، IP، دستگاه و زمان آنلاین', priority: 'auto' },
  { key: 'preferences', label: 'ترجیحات ارتباطی', icon: '🔔', description: 'زبان، پوسته و اجازهٔ دریافت پیام', priority: 'medium' },
  { key: 'lifecycle', label: 'چرخهٔ عمر', icon: '🧭', description: 'وضعیت، نوع حساب، وفاداری و ریسک ریزش', priority: 'medium' },
  { key: 'custom', label: 'دلخواه', icon: '🧩', description: 'فیلدهای سفارشی و توضیحات آزاد', priority: 'low' },
];

export const CUSTOMER_SECTION_MAP = CUSTOMER_SECTIONS.reduce((map, section) => {
  map[section.key] = section;
  return map;
}, {});

/** فیلدهای هر بخش (به‌ترتیب تعریف) */
export function getSectionFields(sectionKey) {
  return CUSTOMER_FIELDS.filter((field) => field.section === sectionKey);
}

/** بخش‌های «پرکاربرد» که در فرم سریع پیش‌فرض باز هستند */
export const FREQUENT_FIELDS = [
  'firstName',
  'lastName',
  'mobile',
  'email',
  'balance',
  'city',
  'gender',
  'accountType',
  'status',
  'tags',
];

/* ================================================================== */
/* ابزارهای کمکی                                                       */
/* ================================================================== */

export function createId(prefix = 'cust') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toSafeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function toSafeNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  return false;
}

function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,،\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/** مقدار پیش‌فرض یک فیلد بر اساس نوعش */
export function getFieldDefault(field) {
  if (field.default !== undefined) {
    return Array.isArray(field.default) ? [...field.default] : field.default;
  }

  switch (field.type) {
    case 'number':
    case 'money':
    case 'rating':
      return 0;
    case 'checkbox':
      return false;
    case 'tags':
    case 'keyvalue':
      return [];
    default:
      return '';
  }
}

/** نرمال‌سازی مقدار یک فیلد بر اساس نوعش */
export function coerceFieldValue(field, value) {
  if (!field) return toSafeString(value);

  switch (field.type) {
    case 'number':
    case 'money':
      return value === '' || value === null || value === undefined ? 0 : toSafeNumber(value);
    case 'rating':
      return Math.max(0, Math.min(5, toSafeNumber(value)));
    case 'checkbox':
      return toSafeBoolean(value);
    case 'tags':
      return toSafeArray(value).map((tag) => toSafeString(tag)).slice(0, 40);
    case 'keyvalue':
      return toSafeArray(value)
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          id: toSafeString(item.id) || createId('field'),
          label: toSafeString(item.label),
          value: toSafeString(item.value),
        }));
    case 'select': {
      const options = field.options || [];
      const next = toSafeString(value);
      return options.includes(next) ? next : toSafeString(field.default) || options[0] || '';
    }
    default:
      return toSafeString(value);
  }
}

/* ================================================================== */
/* اعتبارسنج‌ها                                                        */
/* ================================================================== */

export function toLatinDigits(input) {
  return toSafeString(input)
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

/** الگوی mod-11 کد ملی ایران */
export function isValidNationalCode(input) {
  const code = toLatinDigits(input).replace(/\D/g, '');
  if (code.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;

  const check = Number(code[9]);
  const sum = code
    .slice(0, 9)
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * (10 - index), 0);

  const remainder = sum % 11;

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

/** الگوی Luhn شمارهٔ کارت ۱۶ رقمی */
export function isValidCardNumber(input) {
  const digits = toLatinDigits(input).replace(/\D/g, '');
  if (digits.length !== 16) return false;

  const sum = digits
    .split('')
    .reverse()
    .reduce((acc, digit, index) => {
      const value = Number(digit) * (index % 2 === 0 ? 1 : 2);
      return acc + (value > 9 ? value - 9 : value);
    }, 0);

  return sum % 10 === 0;
}

/** شمارهٔ شبا: IR + ۲۴ رقم */
export function isValidShaba(input) {
  const value = toLatinDigits(input).replace(/\s|-/g, '').toUpperCase();
  return /^IR\d{24}$/.test(value);
}

export function isValidEmail(input) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(toSafeString(input).trim());
}

export function isValidPhone(input) {
  const digits = toLatinDigits(input).replace(/\D/g, '');
  return /^(?:\+?98|0)?9\d{9}$/.test(digits) || digits.length >= 7;
}

/** شمارهٔ موبایل ایرانی را به قالب ۰۹xxxxxxxxx نرمال می‌کند */
export function normalizeIranMobile(input) {
  const digits = toLatinDigits(input).replace(/\D/g, '');

  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  if (/^09\d{9}$/.test(digits)) return digits;

  return toSafeString(input).trim();
}

/** تبدیل ۰۹xxxxxxxxx به ۹۸۹xxxxxxxxx برای لینک‌های بین‌المللی */
export function toE164Mobile(input, countryCode = '98') {
  const digits = toLatinDigits(input).replace(/\D/g, '');

  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith('0')) return `${countryCode}${digits.slice(1)}`;

  return `${countryCode}${digits}`;
}

export function validateFieldValue(field, value) {
  if (!field) return { valid: true };

  const text = toSafeString(value).trim();

  if (field.required && !text) {
    return { valid: false, message: `${field.label} الزامی است.` };
  }

  if (!text) return { valid: true };

  switch (field.validate) {
    case 'nationalCode':
      return isValidNationalCode(text)
        ? { valid: true }
        : { valid: false, message: 'کد ملی معتبر نیست (۱۰ رقم).' };
    case 'cardNumber':
      return isValidCardNumber(text)
        ? { valid: true }
        : { valid: false, message: 'شمارهٔ کارت معتبر نیست (۱۶ رقم).' };
    case 'shaba':
      return isValidShaba(text) ? { valid: true } : { valid: false, message: 'شبا باید با IR و ۲۴ رقم باشد.' };
    case 'email':
      return isValidEmail(text) ? { valid: true } : { valid: false, message: 'ایمیل معتبر نیست.' };
    case 'phone':
      return isValidPhone(text) ? { valid: true } : { valid: false, message: 'شمارهٔ تماس معتبر نیست.' };
    default:
      return { valid: true };
  }
}

/* ================================================================== */
/* ساخت و نرمال‌سازی مشتری                                             */
/* ================================================================== */

export function createEmptyCustomer(overrides = {}) {
  const now = new Date().toISOString();

  const customer = {
    id: toSafeString(overrides.id) || createId('customer'),
    version: 1,

    // فیلدهای تخت (همهٔ فیلدهای اسکیمای بالا)
    ...CUSTOMER_FIELDS.reduce((acc, field) => {
      acc[field.key] = getFieldDefault(field);
      return acc;
    }, {}),

    // آرایه‌ها و آبجکت‌های ساختاریافته
    addresses: [], // { id, label, country, province, city, address, postalCode, lat, lng, isDefault }
    devices: [], // { id, label, os, browser, firstSeenAt, lastSeenAt, ip, sessions }
    sessions: [], // { id, startedAt, endedAt, ip, device, seconds, pageViews }
    transactions: [], // { id, at, type, amount, note, reference }
    tickets: [], // { id, subject, status, createdAt, updatedAt, priority }
    messages: [], // { id, at, direction, body, channel }
    communications: [], // { id, at, channel, direction, subject, body, status }
    reminders: [], // همان ساختار یادآورهای نوت
    attachments: [], // شناسهٔ ضمیمه‌ها (داده در attachment-service)
    activity: [], // { id, at, type, label, actor }
    tags: [],

    createdAt: toSafeString(overrides.createdAt) || now,
    updatedAt: toSafeString(overrides.updatedAt) || now,
    deletedAt: null,
  };

  return customer;
}

/**
 * نرمال‌سازی هر دادهٔ ورودی (دستی، ایمپورت CSV، یا ابزار دیگر) به شکل معتبر.
 * دادهٔ خراب دور ریخته نمی‌شود؛ ترمیم می‌شود.
 */
export function normalizeCustomer(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  const now = new Date().toISOString();

  const customer = createEmptyCustomer({
    id: raw.id,
    createdAt: raw.createdAt,
  });

  // ۱) فیلدهای اسکیمایی
  for (const field of CUSTOMER_FIELDS) {
    if (raw[field.key] === undefined) continue;
    customer[field.key] = coerceFieldValue(field, raw[field.key]);
  }

  // ۲) کلیدهای رایج در داده‌های قدیمی/ابزارهای دیگر
  const aliases = {
    name: 'firstName',
    firstname: 'firstName',
    family: 'lastName',
    surname: 'lastName',
    lastName: 'lastName',
    phone: 'mobile',
    phoneNumber: 'mobile',
    mobileNumber: 'mobile',
    mail: 'email',
    inventory: 'balance',
    wallet: 'balance',
    birthDate: 'birthDate',
    birthday: 'birthDate',
    nationalCode: 'nationalCode',
    cardNumber: 'cardNumber',
    shabaNumber: 'shabaNumber',
    sheba: 'shabaNumber',
    about: 'bio',
    jobTitle: 'occupation',
    memberSince: 'signupAt',
    registerDate: 'signupAt',
    lastLoginAt: 'lastLoginAt',
    totalExpenditure: 'totalSpent',
  };

  for (const [sourceKey, targetKey] of Object.entries(aliases)) {
    if (raw[sourceKey] === undefined || raw[sourceKey] === null) continue;

    const field = CUSTOMER_FIELD_MAP[targetKey];
    if (!field) continue;

    const isEmpty =
      customer[targetKey] === getFieldDefault(field) || customer[targetKey] === '' || customer[targetKey] === 0;

    if (isEmpty) customer[targetKey] = coerceFieldValue(field, raw[sourceKey]);
  }

  // ۳) امنیت/ورود از ساختار security ابزار دیگر
  const security = raw.security && typeof raw.security === 'object' ? raw.security : null;

  if (security) {
    customer.signupAt = customer.signupAt || toSafeString(security.firstLoginAt);
    customer.signupIp = customer.signupIp || toSafeString(security.firstLoginIp);
    customer.signupDevice = customer.signupDevice || parseDeviceLabel(security.firstLoginUserAgent);
    customer.lastLoginAt = customer.lastLoginAt || toSafeString(security.lastLoginAt);
    customer.lastLoginIp = customer.lastLoginIp || toSafeString(security.lastLoginIp);
    customer.lastLoginDevice = customer.lastLoginDevice || parseDeviceLabel(security.lastLoginUserAgent);
  }

  // ۴) آرایه‌ها
  customer.addresses = toSafeArray(raw.addresses)
    .map((item) => normalizeAddress(item))
    .filter(Boolean);

  customer.devices = toSafeArray(raw.devices).map(normalizeDevice).filter(Boolean);
  customer.sessions = toSafeArray(raw.sessions).slice(0, 500);
  customer.transactions = toSafeArray(raw.transactions).map(normalizeTransaction).filter(Boolean);
  customer.tickets = toSafeArray(raw.tickets).map(normalizeTicket).filter(Boolean);
  customer.messages = toSafeArray(raw.messages).slice(0, 500);
  customer.communications = toSafeArray(raw.communications).slice(0, 500);
  customer.reminders = toSafeArray(raw.reminders).map(normalizeReminder).filter(Boolean);
  customer.attachments = toSafeArray(raw.attachments).map(toSafeString).filter(Boolean);
  customer.activity = toSafeArray(raw.activity).slice(0, 120);
  customer.tags = toSafeArray(raw.tags).slice(0, 40);

  // ۵) اگر آدرس اصلی خالی است و آدرسی در آرایه هست، آن را بالا بیاور
  if (!customer.address && customer.addresses.length > 0) {
    const preferred = customer.addresses.find((item) => item.isDefault) || customer.addresses[0];
    customer.address = preferred.address;
    customer.city = customer.city || preferred.city;
    customer.country = customer.country || preferred.country;
    customer.province = customer.province || preferred.province;
    customer.postalCode = customer.postalCode || preferred.postalCode;
    customer.lat = customer.lat || preferred.lat;
    customer.lng = customer.lng || preferred.lng;
  }

  // ۶) متادیتا
  customer.version = 1;
  customer.createdAt = customer.createdAt || now;
  customer.updatedAt = toSafeString(raw.updatedAt) || customer.createdAt;
  customer.deletedAt = raw.deletedAt ? toSafeString(raw.deletedAt) : null;
  customer.archived = toSafeBoolean(raw.archived);
  customer.trashed = toSafeBoolean(raw.trashed) || toSafeBoolean(raw.isDeleted);
  customer.favorite = toSafeBoolean(raw.favorite) || toSafeBoolean(raw.starred);
  customer.pinned = toSafeBoolean(raw.pinned);
  customer.blocked = toSafeBoolean(raw.blocked) || customer.status === 'blocked';

  customer.mobile = normalizeIranMobile(customer.mobile);

  return customer;
}

export function normalizeCustomerList(rawList) {
  return toSafeArray(rawList).map(normalizeCustomer).filter(Boolean);
}

export function normalizeAddress(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: toSafeString(raw.id) || createId('addr'),
    label: toSafeString(raw.label) || 'آدرس',
    country: toSafeString(raw.country) || 'ایران',
    province: toSafeString(raw.province),
    city: toSafeString(raw.city),
    district: toSafeString(raw.district),
    address: toSafeString(raw.address),
    postalCode: toSafeString(raw.postalCode),
    lat: raw.lat === '' || raw.lat === null ? '' : toSafeNumber(raw.lat, ''),
    lng: raw.lng === '' || raw.lng === null ? '' : toSafeNumber(raw.lng, ''),
    isDefault: toSafeBoolean(raw.isDefault),
    createdAt: toSafeString(raw.createdAt) || new Date().toISOString(),
  };
}

export function normalizeDevice(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: toSafeString(raw.id) || createId('device'),
    label: toSafeString(raw.label) || 'دستگاه ناشناس',
    os: toSafeString(raw.os),
    browser: toSafeString(raw.browser),
    userAgent: toSafeString(raw.userAgent),
    firstSeenAt: toSafeString(raw.firstSeenAt) || new Date().toISOString(),
    lastSeenAt: toSafeString(raw.lastSeenAt) || new Date().toISOString(),
    ip: toSafeString(raw.ip),
    loginCount: toSafeNumber(raw.loginCount) || 1,
    sessions: toSafeNumber(raw.sessions),
  };
}

export function normalizeTransaction(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  const type = ['purchase', 'refund', 'deposit', 'withdraw', 'gift', 'adjust'].includes(raw.type)
    ? raw.type
    : 'purchase';

  return {
    id: toSafeString(raw.id) || createId('txn'),
    at: toSafeString(raw.at) || new Date().toISOString(),
    type,
    amount: toSafeNumber(raw.amount),
    currency: toSafeString(raw.currency) || 'IRR',
    note: toSafeString(raw.note),
    reference: toSafeString(raw.reference),
  };
}

export function normalizeTicket(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: toSafeString(raw.id) || createId('ticket'),
    subject: toSafeString(raw.subject) || 'بدون موضوع',
    status: ['open', 'pending', 'answered', 'closed'].includes(raw.status) ? raw.status : 'open',
    priority: ['low', 'normal', 'high', 'urgent'].includes(raw.priority) ? raw.priority : 'normal',
    createdAt: toSafeString(raw.createdAt) || new Date().toISOString(),
    updatedAt: toSafeString(raw.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeReminder(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  const at = toSafeString(raw.at) || toSafeString(raw.nextAt);

  return {
    id: toSafeString(raw.id) || createId('reminder'),
    title: toSafeString(raw.title) || 'یادآوری مشتری',
    message: toSafeString(raw.message),
    at,
    nextAt: toSafeString(raw.nextAt) || at,
    repeat: toSafeString(raw.repeat) || 'none',
    channels: toSafeArray(raw.channels).length ? toSafeArray(raw.channels) : ['inapp'],
    enabled: raw.enabled !== false,
    createdAt: toSafeString(raw.createdAt) || new Date().toISOString(),
    lastFiredAt: toSafeString(raw.lastFiredAt),
    history: toSafeArray(raw.history).slice(0, 30),
  };
}

/* ================================================================== */
/* مشتق‌سازی                                                           */
/* ================================================================== */

export function getCustomerName(customer) {
  if (!customer) return '';

  const full = `${toSafeString(customer.firstName)} ${toSafeString(customer.lastName)}`.trim();

  return toSafeString(customer.displayName).trim() || full || toSafeString(customer.username).trim() || 'مشتری بدون نام';
}

/** حروف اول نام برای آواتار متنی (تا ۲ حرف) */
export function getInitials(customer) {
  const name = getCustomerName(customer);

  const parts = name
    .replace(/[(){}[\]<>]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '؟';

  if (parts.length === 1) return parts[0].slice(0, 2);

  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

/** رنگ پایدار آواتار بر اساس شناسه (بدون تصادف در هر رندر) */
export function getAvatarColor(customer) {
  const palette = ['violet', 'blue', 'emerald', 'amber', 'rose', 'slate'];
  const seed = toSafeString(customer?.id) || 'x';

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }

  return palette[hash % palette.length];
}

/** سن دقیق از تاریخ تولد */
export function getAge(customer, reference = new Date()) {
  const raw = toSafeString(customer?.birthDate).trim();
  if (!raw) return null;

  const birth = new Date(raw);
  if (Number.isNaN(birth.getTime())) return null;

  const base = reference instanceof Date ? reference : new Date(reference);

  let age = base.getFullYear() - birth.getFullYear();
  const monthDiff = base.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && base.getDate() < birth.getDate())) age -= 1;

  return age >= 0 && age < 150 ? age : null;
}

export function getAgeRange(customer, reference = new Date()) {
  const age = getAge(customer, reference);
  if (age === null) return 'unknown';

  if (age < 18) return 'under18';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';

  return '65plus';
}

export const AGE_RANGE_LABELS = {
  unknown: 'سن نامشخص',
  under18: 'زیر ۱۸ سال',
  '18-24': '۱۸ تا ۲۴ سال',
  '25-34': '۲۵ تا ۳۴ سال',
  '35-44': '۳۵ تا ۴۴ سال',
  '45-54': '۴۵ تا ۵۴ سال',
  '55-64': '۵۵ تا ۶۴ سال',
  '65plus': '۶۵ سال به بالا',
};

export function getBalanceRange(customer) {
  const balance = toSafeNumber(customer?.balance);

  if (balance < 0) return 'negative';
  if (balance === 0) return 'zero';
  if (balance < 1_000_000) return 'low';
  if (balance < 10_000_000) return 'medium';

  return 'high';
}

export const BALANCE_RANGE_LABELS = {
  negative: 'منفی (بدهکار)',
  zero: 'صفر',
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
};

function parseDeviceLabel(userAgent) {
  const text = toSafeString(userAgent);
  if (!text) return '';

  if (/mobile|android.*mobile|iphone/i.test(text)) return 'موبایل';
  if (/tablet|ipad/i.test(text)) return 'تبلت';
  if (/windows/i.test(text)) return 'ویندوز';
  if (/macintosh|mac os/i.test(text)) return 'مک';
  if (/linux/i.test(text)) return 'لینوکس';

  return '';
}

export { parseDeviceLabel };

export function daysBetweenDates(fromIso, reference = new Date()) {
  const raw = toSafeString(fromIso).trim();
  if (!raw) return null;

  const from = new Date(raw);
  if (Number.isNaN(from.getTime())) return null;

  const base = reference instanceof Date ? reference : new Date(reference);

  return Math.floor((base.getTime() - from.getTime()) / 86_400_000);
}

export function isBirthdayToday(customer, reference = new Date()) {
  const age = getAge(customer, reference);
  const raw = toSafeString(customer?.birthDate).trim();
  if (!raw || age === null) return false;

  const birth = new Date(raw);
  const base = reference instanceof Date ? reference : new Date(reference);

  return birth.getMonth() === base.getMonth() && birth.getDate() === base.getDate();
}

/** متن کامل مشتری برای جستجو */
export function getCustomerSearchText(customer) {
  if (!customer) return '';

  const parts = [
    getCustomerName(customer),
    customer.username,
    customer.mobile,
    customer.phone,
    customer.email,
    customer.nationalCode,
    customer.city,
    customer.province,
    customer.country,
    customer.address,
    customer.company,
    customer.occupation,
    customer.bio,
    customer.extraNotes,
    customer.source,
    customer.owner,
    customer.lastOrderNumber,
    customer.cardNumber,
    customer.shabaNumber,
    customer.signupIp,
    customer.lastLoginIp,
    (customer.tags || []).join(' '),
    (customer.favoriteCategories || []).join(' '),
    (customer.addresses || []).map((item) => `${item.label} ${item.city} ${item.address}`).join(' '),
    (customer.customFields || []).map((item) => `${item.label} ${item.value}`).join(' '),
    (customer.tickets || []).map((item) => item.subject).join(' '),
    (customer.messages || []).map((item) => item.body).join(' '),
  ];

  return parts.filter(Boolean).join('\n').toLowerCase();
}

export function getCustomerPreview(customer, maxLength = 120) {
  const parts = [
    customer.city,
    customer.occupation,
    customer.company,
    customer.email,
    customer.bio,
    customer.extraNotes,
  ].filter((item) => toSafeString(item).trim());

  const text = parts.join(' • ').replace(/\s+/g, ' ').trim();

  if (!text) return '';

  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

/** آمار تجمعی یک مشتری (برای کارت‌ها و پنل‌ها) */
export function getCustomerStats(customer) {
  if (!customer) return null;

  const transactions = toSafeArray(customer.transactions);

  const purchases = transactions.filter((item) => item.type === 'purchase');
  const refunds = transactions.filter((item) => item.type === 'refund');

  const totalTransactions = purchases.reduce((sum, item) => sum + toSafeNumber(item.amount), 0);

  const openTickets = toSafeArray(customer.tickets).filter(
    (ticket) => ticket.status === 'open' || ticket.status === 'pending'
  );

  const sessions = toSafeArray(customer.sessions);

  const engagement =
    toSafeNumber(customer.loginCount) * 2 +
    toSafeNumber(customer.pageViewCount) / 10 +
    toSafeNumber(customer.messageCount) * 3 +
    toSafeNumber(customer.ticketCount) * 2;

  return {
    age: getAge(customer),
    ageRange: getAgeRange(customer),
    balanceRange: getBalanceRange(customer),
    daysSinceSignup: daysBetweenDates(customer.signupAt || customer.createdAt),
    daysSinceLastPurchase: daysBetweenDates(customer.lastPurchaseAt),
    daysSinceLastLogin: daysBetweenDates(customer.lastLoginAt),
    daysSinceLastActivity: daysBetweenDates(customer.lastSeenAt || customer.lastLoginAt),
    transactionCount: transactions.length,
    purchaseTotal: totalTransactions,
    refundTotal: refunds.reduce((sum, item) => sum + Math.abs(toSafeNumber(item.amount)), 0),
    openTicketCount: openTickets.length,
    hasOpenTicket: Boolean(customer.hasOpenTicket) || openTickets.length > 0,
    onlineMinutes: Math.round(toSafeNumber(customer.onlineSeconds) / 60),
    engagementScore: Math.round(engagement),
    profileCompleteness: getProfileCompleteness(customer),
    isBirthdayToday: isBirthdayToday(customer),
    isMinor: (getAge(customer) ?? 99) < 18,
  };
}

/** درصد کامل‌بودن پروفایل (۰ تا ۱۰۰) */
export function getProfileCompleteness(customer) {
  if (!customer) return 0;

  const keys = [
    'firstName',
    'lastName',
    'mobile',
    'email',
    'nationalCode',
    'birthDate',
    'gender',
    'city',
    'address',
    'occupation',
    'balance',
    'accountType',
  ];

  const filled = keys.filter((key) => {
    const value = customer[key];

    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (Array.isArray(value)) return value.length > 0;

    return toSafeString(value).trim() !== '';
  }).length;

  return Math.round((filled / keys.length) * 100);
}

/** متن خلاصهٔ یک مشتری برای اشتراک‌گذاری */
export function buildCustomerSummary(customer) {
  if (!customer) return '';

  const lines = [getCustomerName(customer)];
  const stats = getCustomerStats(customer);

  if (customer.mobile) lines.push(`موبایل: ${customer.mobile}`);
  if (customer.email) lines.push(`ایمیل: ${customer.email}`);
  if (customer.city) lines.push(`شهر: ${[customer.province, customer.city].filter(Boolean).join('، ')}`);
  if (customer.address) lines.push(`آدرس: ${customer.address}`);
  if (stats?.age !== null && stats?.age !== undefined) lines.push(`سن: ${stats.age}`);
  if (customer.accountType) lines.push(`نوع حساب: ${ACCOUNT_TYPE_LABELS[customer.accountType] || customer.accountType}`);
  if (customer.balance) lines.push(`موجودی: ${customer.balance}`);
  if (customer.totalSpent) lines.push(`مجموع خرید: ${customer.totalSpent}`);
  if (customer.orderCount) lines.push(`تعداد سفارش: ${customer.orderCount}`);
  if (customer.lastPurchaseAt) lines.push(`آخرین خرید: ${customer.lastPurchaseAt.slice(0, 10)}`);
  if (customer.tags?.length) lines.push(`برچسب‌ها: ${customer.tags.join('، ')}`);
  if (customer.extraNotes) lines.push(`یادداشت: ${customer.extraNotes}`);

  return lines.join('\n');
}

export function parseCustomerTags(input) {
  return toSafeArray(input)
    .map((tag) => toSafeString(tag).trim().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, 40);
}

/** اعتبارسنج فرم کامل مشتری */
export function validateCustomerDraft(draft = {}) {
  const firstName = toSafeString(draft.firstName).trim();
  const lastName = toSafeString(draft.lastName).trim();
  const mobile = toSafeString(draft.mobile).trim();
  const email = toSafeString(draft.email).trim();

  if (!firstName && !lastName && !mobile && !email) {
    return { valid: false, message: 'حداقل نام، موبایل یا ایمیل را وارد کن.' };
  }

  if (firstName.length > 60 || lastName.length > 60) {
    return { valid: false, message: 'نام و نام خانوادگی نمی‌تواند بیشتر از ۶۰ کاراکتر باشد.' };
  }

  const errors = {};

  for (const field of CUSTOMER_FIELDS) {
    const value = draft[field.key];
    if (value === undefined) continue;

    const result = validateFieldValue(field, value);
    if (!result.valid) errors[field.key] = result.message;
  }

  const keys = Object.keys(errors);

  return {
    valid: keys.length === 0,
    errors,
    message: keys.length === 0 ? '' : errors[keys[0]],
  };
}
