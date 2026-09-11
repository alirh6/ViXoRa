// 🧠 ViXoRa Resume Wizard — ۵ سؤال، ۳۶ پروفایل، انتخاب هوشمند بدون AI
// src/pages/tools/resume/resume-wizard.js

export const WZ_QUESTIONS = [
  { id: 'goal', title: '🎯 هدفت از این رزومه چیه؟', opts: [
    ['migrate', '🛂 مهاجرت / سفارت', 'اقامت، ویزای کاری، اکسپرس‌انتری'],
    ['job-abroad', '💼 کار در شرکت خارجی', 'اپلای مستقیم به کارفرمای خارجی'],
    ['job-iran', '🏢 کار در شرکت ایرانی', 'دیجی‌کالا، اسنپ و...'],
    ['freelance', '🌐 فریلنسری / ریموت', 'کارفرمای راه‌دور یا پروژه‌ای'],
    ['academic', '🎓 تحصیل / پژوهش', 'اپلای دانشگاه، فاند، هیئت‌علمی'],
  ] },
  { id: 'exp', title: '💼 سابقه کارت چقدره؟', opts: [
    ['junior', '🌱 تازه‌کار', 'کمتر از ۱ سال یا دانشجو'],
    ['mid', '🌿 ۱ تا ۳ سال', 'نیروی میانی'],
    ['senior', '🌳 ۳ تا ۷ سال', 'ارشد و متخصص'],
    ['exec', '👔 ۷+ سال / مدیر', 'مدیریت و رهبری'],
  ] },
  { id: 'field', title: '🏭 حوزه کاریت چیه؟', opts: [
    ['tech', '💻 تکنولوژی', 'برنامه‌نویسی، دیتا، هوش مصنوعی'],
    ['finance', '💰 مالی', 'حسابداری، بانک، سرمایه‌گذاری'],
    ['medical', '⚕️ پزشکی و سلامت', 'پزشک، پرستار، پیراپزشکی'],
    ['eng', '🏗️ مهندسی', 'عمران، برق، مکانیک، صنایع'],
    ['creative', '🎨 خلاق و رسانه', 'دیزاین، محتوا، ویدیو، مارکتینگ'],
    ['sales', '🤝 فروش و عملیات', 'فروش، پشتیبانی، لجستیک'],
    ['academic', '📚 آکادمیک', 'تدریس، پژوهش، مقاله'],
    ['general', '🗂️ عمومی / اداری', 'منابع انسانی، اداری، سایر'],
  ] },
  { id: 'dest', title: '🌍 مقصدت کجاست؟', opts: [
    ['us-ca', '🇺🇸🇨🇦 آمریکا / کانادا', 'بدون عکس، ۱-۲ صفحه، ATS'],
    ['eu', '🇪🇺 اروپا', 'آلمان، فرانسه، هلند و...'],
    ['gulf', '🇦🇪 حاشیه خلیج / ترکیه', 'امارات، قطر، ترکیه'],
    ['iran', '🇮🇷 ایران', 'فارسی و راست‌چین'],
    ['remote', '🌐 ریموت / فرقی ندارد', 'قالب بین‌المللی خنثی'],
  ] },
  { id: 'vibe', title: '✨ چه حسی دوست داری؟', opts: [
    ['classic', '🎩 رسمی کلاسیک', 'سریف، سنگین، سنتی'],
    ['minimal', '⬜ مدرن مینیمال', 'تمیز، کم‌رنگ، امروزی'],
    ['bold', '🔥 جسورانه', 'رنگی، هدر پهن، پرانرژی'],
    ['elegant', '💎 شیک اجرایی', 'لوکس، مدیریتی، متمایز'],
    ['plain', '📄 فوق‌ساده ATS', 'فقط متن، عبور از ربات'],
  ] },
];

/* دلیل‌های آماده برای هر جوابِ اثرگذار */
const WHY = {
  'goal:migrate': 'چون هدف مهاجرته، عرف رسمی سفارت (مشخصات کامل و ساختار استاندارد) اعمال شد',
  'goal:job-abroad': 'برای کارفرمای خارجی، نسخه ATS-امن و بدون حاشیه انتخاب شد',
  'goal:job-iran': 'قالب فارسی راست‌چین با عرف جذب ایران (نظام‌وظیفه و...) تنظیم شد',
  'goal:freelance': 'چون فریلنسری است، پروژه‌ها و نمونه‌کارها جلوتر آمد',
  'goal:academic': 'برای مسیر آکادمیک، تحصیلات و مدارک در اولویت قرار گرفت',
  'exp:junior': 'چون تازه‌کاری، مهارت‌ها و پروژه‌ها جلوتر از سوابق آمد',
  'exp:mid': 'برای سطح میانی، تعادل سوابق و مهارت رعایت شد',
  'exp:senior': 'چون ارشدی، دستاوردهای عددی و عمق تخصص برجسته شد',
  'exp:exec': 'برای سطح مدیریتی، لحن اجرایی و رهبری انتخاب شد',
  'field:tech': 'برای حوزه تک، استک فنی و لینک‌ها پررنگ شد',
  'field:finance': 'برای مالی، دقت، تحصیلات و اعداد در اولویت آمد',
  'field:medical': 'برای سلامت، مدارک و مجوزها بخش ویژه گرفتند',
  'field:eng': 'برای مهندسی، پروژه‌ها با مقیاس فنی برجسته شد',
  'field:creative': 'برای حوزه خلاق، ظاهر متمایز و نمونه‌کار مهم شد',
  'field:sales': 'برای فروش، اعداد رشد و دستاورد اول آمد',
  'field:academic': 'برای آکادمیک، ساختار مفصل تحصیلی انتخاب شد',
  'field:general': 'ساختار متعادل و همه‌کاره برای حوزه عمومی',
  'dest:us-ca': 'عرف آمریکا/کانادا اعمال شد: بدون عکس و مشخصات شخصی',
  'dest:eu': 'عرف اروپایی اعمال شد: عکس و مشخصات طبق کشور مقصد',
  'dest:gulf': 'عرف خلیج اعمال شد: عکس، ملیت و وضعیت ویزا',
  'dest:iran': 'قالب کاملاً فارسی و راست‌چین شد',
  'dest:remote': 'نسخه خنثی بین‌المللی بدون وابستگی کشوری',
  'vibe:classic': 'حس رسمی کلاسیک با فونت سریف اعمال شد',
  'vibe:minimal': 'استایل مینیمال مدرن اعمال شد',
  'vibe:bold': 'استایل جسورانه با هدر رنگی اعمال شد',
  'vibe:elegant': 'استایل شیک اجرایی اعمال شد',
  'vibe:plain': 'نسخه فوق‌ساده برای عبور از ATS انتخاب شد',
};

/* ۳۶ پروفایل: cfg + match (قالب آماده نزدیک) + w (وزن هر جواب) */
const P = (id, fa, cfg, match, w) => ({ id, fa, cfg, match, w });
export const WZ_PROFILES = [
  P('us-ats-tech', 'رزومه ATS آمریکایی', { layout: 'minimal', theme: 'mono', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'skills', 'exp', 'projects', 'edu'] }, ['ct-usa', 'co-google'], { 'goal:job-abroad': 3, 'dest:us-ca': 3, 'vibe:plain': 3, 'vibe:minimal': 2, 'field:tech': 2, 'goal:migrate': 1 }),
  P('us-exec', 'رزومه اجرایی آمریکایی', { layout: 'classic', theme: 'charcoal', font: 'serif', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'exp', 'edu', 'skills', 'certs'] }, ['co-goldman', 'ct-usa'], { 'exp:exec': 3, 'dest:us-ca': 2, 'vibe:elegant': 3, 'vibe:classic': 2, 'field:finance': 1 }),
  P('ca-bilingual', 'رزومه کانادایی دوزبانه', { layout: 'classic', theme: 'slate', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'skills', 'exp', 'edu', 'langs', 'certs'] }, ['ct-canada'], { 'goal:migrate': 3, 'dest:us-ca': 3, 'goal:job-abroad': 1 }),
  P('de-lebenslauf', 'لبنزلاف آلمانی', { layout: 'tabular', theme: 'navy', font: 'modern', lang: 'en', photo: 'required', pageMax: 2, pages: '۲ صفحه جدولی', sections: ['personal', 'exp', 'edu', 'skills', 'langs', 'certs', 'decl'], personal: ['dob', 'pob', 'nat', 'marital', 'address'] }, ['ct-germany'], { 'dest:eu': 3, 'goal:migrate': 2, 'vibe:classic': 2, 'field:eng': 2, 'field:medical': 2 }),
  P('uk-cv', 'سی‌وی بریتانیایی', { layout: 'classic', theme: 'navy', font: 'serif', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۲ صفحه', sections: ['summary', 'exp', 'edu', 'skills', 'refs'] }, ['ct-uk', 'ct-ireland'], { 'dest:eu': 2, 'goal:job-abroad': 2, 'vibe:classic': 2, 'goal:migrate': 1 }),
  P('au-full', 'رزومه استرالیایی کامل', { layout: 'classic', theme: 'ocean', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 3, pages: '۲ تا ۳ صفحه', sections: ['summary', 'skills', 'exp', 'edu', 'certs', 'refs'], personal: ['visa'] }, ['ct-australia', 'ct-nz'], { 'goal:migrate': 2, 'dest:remote': 1, 'exp:senior': 1, 'exp:exec': 1 }),
  P('fr-elegant', 'سی‌وی فرانسوی شیک', { layout: 'card', theme: 'wine', font: 'serif', lang: 'en', photo: 'optional', pageMax: 1, pages: '۱ تا ۲ صفحه', sections: ['summary', 'exp', 'edu', 'skills', 'langs', 'hobbies'], personal: ['dob', 'nat'] }, ['ct-france'], { 'dest:eu': 2, 'vibe:elegant': 2, 'field:creative': 1 }),
  P('nordic-clean', 'رزومه اسکاندیناوی تمیز', { layout: 'minimal', theme: 'slate', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'exp', 'edu', 'skills', 'langs'] }, ['ct-sweden', 'ct-norway'], { 'dest:eu': 2, 'vibe:minimal': 2, 'goal:job-abroad': 1 }),
  P('gulf-luxe', 'رزومه لوکس خلیج', { layout: 'band', theme: 'gold', font: 'modern', lang: 'en', photo: 'required', pageMax: 3, pages: '۲ تا ۳ صفحه', sections: ['objective', 'personal', 'exp', 'edu', 'skills', 'langs', 'refs'], personal: ['dob', 'nat', 'marital', 'visa', 'address'] }, ['ct-uae'], { 'dest:gulf': 3, 'goal:migrate': 1, 'vibe:bold': 1, 'vibe:elegant': 1 }),
  P('eu-general', 'رزومه اروپایی عمومی', { layout: 'classic', theme: 'royal', font: 'modern', lang: 'en', photo: 'optional', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'exp', 'edu', 'skills', 'langs', 'certs'], personal: ['dob', 'nat'] }, ['ct-netherlands', 'ct-belgium'], { 'dest:eu': 2, 'goal:job-abroad': 1, 'field:general': 2 }),
  P('fa-startup', 'رزومه استارتاپی فارسی', { layout: 'sidebar', theme: 'royal', font: 'modern', lang: 'fa', photo: 'optional', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'skills', 'exp', 'projects', 'edu', 'langs'], personal: ['dob', 'military'] }, ['ir-snapp', 'ir-divar'], { 'goal:job-iran': 3, 'dest:iran': 3, 'vibe:bold': 2, 'vibe:minimal': 1, 'field:tech': 1 }),
  P('fa-corporate', 'رزومه شرکتی فارسی', { layout: 'classic', theme: 'gold', font: 'modern', lang: 'fa', photo: 'optional', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'personal', 'exp', 'edu', 'skills', 'certs', 'langs'], personal: ['dob', 'marital', 'military', 'address', 'nat'] }, ['ir-irancell', 'ir-pasargad'], { 'goal:job-iran': 2, 'dest:iran': 2, 'vibe:classic': 3, 'field:finance': 1, 'field:general': 1 }),
  P('fa-creative', 'رزومه خلاق فارسی', { layout: 'sidebar', theme: 'wine', font: 'round', lang: 'fa', photo: 'optional', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'exp', 'projects', 'skills', 'edu', 'langs'], personal: ['dob'] }, ['ir-filimo', 'ir-sabaidea'], { 'goal:job-iran': 2, 'dest:iran': 2, 'field:creative': 3, 'vibe:bold': 2 }),
  P('fa-tech', 'رزومه فنی فارسی', { layout: 'minimal', theme: 'charcoal', font: 'modern', lang: 'fa', photo: 'optional', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'skills', 'exp', 'projects', 'edu'], personal: ['dob', 'military'] }, ['ir-divar', 'ir-torob'], { 'goal:job-iran': 2, 'dest:iran': 2, 'field:tech': 3, 'vibe:plain': 2, 'vibe:minimal': 1 }),
  P('remote-async', 'رزومه ریموت جهانی', { layout: 'minimal', theme: 'teal', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'skills', 'exp', 'projects', 'edu', 'langs'] }, ['co-google', 'ct-usa'], { 'goal:freelance': 3, 'dest:remote': 3, 'vibe:minimal': 1 }),
  P('academic-cv', 'سی‌وی آکادمیک', { layout: 'academic', theme: 'navy', font: 'serif', lang: 'en', photo: 'forbidden', pageMax: 4, pages: '۲ تا ۴ صفحه', sections: ['summary', 'edu', 'exp', 'projects', 'certs', 'langs', 'refs'] }, [], { 'goal:academic': 3, 'field:academic': 3, 'vibe:classic': 1 }),
  P('medical-pro', 'رزومه پزشکی', { layout: 'classic', theme: 'teal', font: 'modern', lang: 'en', photo: 'optional', pageMax: 2, pages: '۲ صفحه', sections: ['summary', 'edu', 'certs', 'exp', 'skills', 'langs'], personal: ['dob', 'nat'] }, [], { 'field:medical': 3, 'goal:migrate': 1, 'dest:eu': 1 }),
  P('finance-sharp', 'رزومه مالی تیز', { layout: 'classic', theme: 'charcoal', font: 'serif', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['edu', 'exp', 'skills', 'certs', 'hobbies'] }, ['co-goldman'], { 'field:finance': 3, 'vibe:classic': 1, 'dest:us-ca': 1 }),
  P('consulting-one', 'رزومه مشاوره‌ای', { layout: 'classic', theme: 'navy', font: 'serif', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['edu', 'exp', 'skills', 'langs', 'hobbies'] }, ['co-mckinsey'], { 'field:finance': 1, 'vibe:elegant': 1, 'exp:senior': 1, 'goal:job-abroad': 1, 'field:general': 1 }),
  P('creative-portfolio', 'رزومه پورتفولیویی', { layout: 'timeline', theme: 'copper', font: 'round', lang: 'en', photo: 'optional', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'projects', 'exp', 'skills', 'edu', 'langs'] }, [], { 'field:creative': 3, 'vibe:bold': 2, 'goal:freelance': 1 }),
  P('sales-driver', 'رزومه فروشنده قهرمان', { layout: 'band', theme: 'copper', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'exp', 'skills', 'edu', 'hobbies'] }, [], { 'field:sales': 3, 'vibe:bold': 1 }),
  P('pm-product', 'رزومه مدیر محصول', { layout: 'classic', theme: 'ocean', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'exp', 'projects', 'skills', 'edu'] }, ['ir-cafebazaar', 'co-microsoft'], { 'field:tech': 1, 'exp:senior': 1, 'goal:job-abroad': 1, 'vibe:minimal': 1 }),
  P('data-scientist', 'رزومه دیتاساینتیست', { layout: 'minimal', theme: 'teal', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'skills', 'projects', 'exp', 'edu', 'certs'] }, ['co-nvidia', 'ir-torob'], { 'field:tech': 2, 'vibe:plain': 1, 'goal:job-abroad': 1 }),
  P('designer-visual', 'رزومه دیزاینر', { layout: 'sidebar', theme: 'crimson', font: 'round', lang: 'en', photo: 'optional', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'projects', 'exp', 'skills', 'edu'] }, ['ir-filimo'], { 'field:creative': 2, 'vibe:bold': 1, 'vibe:minimal': 1 }),
  P('junior-skills', 'رزومه تازه‌کار مهارت‌محور', { layout: 'sidebar', theme: 'teal', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'skills', 'projects', 'edu', 'exp', 'langs'] }, ['ct-nz'], { 'exp:junior': 3, 'exp:mid': 1 }),
  P('career-switch', 'رزومه تغییر مسیر', { layout: 'classic', theme: 'slate', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'projects', 'skills', 'exp', 'edu'] }, [], { 'exp:junior': 1, 'exp:mid': 1, 'goal:freelance': 1, 'goal:job-abroad': 1 }),
  P('freelancer-pitch', 'رزومه فریلنسری', { layout: 'band', theme: 'royal', font: 'round', lang: 'en', photo: 'optional', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'projects', 'skills', 'exp', 'langs'] }, [], { 'goal:freelance': 2, 'dest:remote': 1, 'vibe:bold': 1 }),
  P('exec-board', 'رزومه مدیریتی لوکس', { layout: 'band', theme: 'charcoal', font: 'serif', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'exp', 'edu', 'skills', 'certs', 'refs'] }, ['co-goldman'], { 'exp:exec': 3, 'vibe:elegant': 2 }),
  P('gov-formal', 'رزومه رسمی دولتی', { layout: 'tabular', theme: 'charcoal', font: 'serif', lang: 'en', photo: 'optional', pageMax: 2, pages: '۲ صفحه', sections: ['personal', 'edu', 'exp', 'skills', 'langs', 'decl'], personal: ['dob', 'nat', 'marital', 'address'] }, ['ct-canada'], { 'goal:migrate': 2, 'vibe:classic': 2, 'field:general': 1 }),
  P('startup-hustle', 'رزومه استارتاپی جسور', { layout: 'minimal', theme: 'copper', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'exp', 'projects', 'skills', 'edu'] }, ['co-tesla', 'ir-tapsi'], { 'goal:job-abroad': 1, 'vibe:bold': 2, 'exp:mid': 1, 'field:tech': 1 }),
  P('ai-research', 'رزومه پژوهشگر AI', { layout: 'minimal', theme: 'mono', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'projects', 'exp', 'skills', 'edu', 'refs'] }, ['co-openai'], { 'field:tech': 2, 'goal:job-abroad': 1, 'vibe:plain': 1, 'field:academic': 1 }),
  P('marketing-brand', 'رزومه مارکتر برند', { layout: 'band', theme: 'wine', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'exp', 'projects', 'skills', 'edu'] }, ['co-netflix'], { 'field:creative': 1, 'vibe:bold': 1, 'field:sales': 1 }),
  P('support-ops', 'رزومه عملیات و پشتیبانی', { layout: 'classic', theme: 'forest', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['summary', 'exp', 'skills', 'edu', 'langs'] }, ['ir-snappfood'], { 'field:sales': 1, 'field:general': 1, 'exp:mid': 1 }),
  P('student-intern', 'رزومه کارآموزی', { layout: 'classic', theme: 'teal', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 1, pages: '۱ صفحه', sections: ['edu', 'projects', 'skills', 'exp', 'langs'] }, ['ct-nz'], { 'exp:junior': 2, 'goal:academic': 1 }),
  P('tr-photo-card', 'رزومه ترکیه‌ای عکسی', { layout: 'card', theme: 'crimson', font: 'modern', lang: 'en', photo: 'required', pageMax: 2, pages: '۲ صفحه', sections: ['summary', 'personal', 'exp', 'edu', 'skills', 'langs'], personal: ['dob', 'pob', 'nat', 'marital', 'military'] }, ['ct-turkey'], { 'dest:gulf': 2, 'goal:migrate': 1 }),
  P('ch-precision', 'رزومه دقیق سوئیسی', { layout: 'tabular', theme: 'crimson', font: 'serif', lang: 'en', photo: 'required', pageMax: 2, pages: '۲ صفحه', sections: ['personal', 'exp', 'edu', 'skills', 'langs', 'certs', 'refs'], personal: ['dob', 'nat', 'marital', 'address'] }, ['ct-swiss'], { 'dest:eu': 1, 'vibe:elegant': 1, 'vibe:classic': 1, 'exp:senior': 1 }),
  P('sg-merit', 'رزومه شایستگی سنگاپور', { layout: 'minimal', theme: 'teal', font: 'modern', lang: 'en', photo: 'forbidden', pageMax: 2, pages: '۱ تا ۲ صفحه', sections: ['summary', 'skills', 'exp', 'edu', 'certs'], personal: ['nat'] }, ['ct-singapore'], { 'dest:remote': 1, 'goal:job-abroad': 1, 'field:finance': 1, 'field:tech': 1 }),
];

/** امتیازدهی: جمع وزن جواب‌ها + درصد تطابق + دلیل‌ها */
export function scoreProfiles(answers) {
  const picked = Object.entries(answers).map(([q, opt]) => `${q}:${opt}`);
  return WZ_PROFILES.map((p) => {
    let score = 0;
    const reasons = [];
    for (const key of picked) {
      const w = p.w[key] || 0;
      score += w;
      if (w >= 2 && WHY[key] && reasons.length < 3) reasons.push(WHY[key]);
    }
    // بهترین حالت ممکن برای نرمال‌سازی
    let best = 0;
    for (const q of WZ_QUESTIONS) {
      let m = 0;
      for (const [opt] of q.opts) m = Math.max(m, p.w[`${q.id}:${opt}`] || 0);
      best += m || 1;
    }
    const pct = best ? Math.min(99, Math.round((score / best) * 100)) : 0;
    return { ...p, score, pct, reasons };
  }).sort((a, b) => b.score - a.score || b.pct - a.pct);
}
