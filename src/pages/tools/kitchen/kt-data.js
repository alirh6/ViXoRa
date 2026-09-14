// 🍳 ViXoRa Kitchen OS — recipe corpus + aisles + substitutions
export const AISLES = [
  ['produce', 'تره‌بار'], ['dairy', 'لبنیات'], ['meat', 'گوشت و مرغ'], ['fish', 'ماهی'],
  ['grain', 'نان و غلات'], ['spice', 'ادویه'], ['oil', 'روغن و چاشنی'], ['can', 'کنسرو'],
  ['frozen', 'منجمد'], ['sweet', 'شیرینی'], ['other', 'متفرقه'],
];
export const UNITS = ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'pcs', 'pinch'];
export const CATS = ['ایرانی', 'خاورمیانه', 'ایتالیایی', 'آسیایی', 'صبحانه', 'سوپ', 'سالاد', 'دسر', 'فست‌فود خانگی', 'گیاهی'];
export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
export const DIFFS = ['آسان', 'متوسط', 'حرفه‌ای'];
export const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان', 'همه'];
export const PRESETS = [
  { id: 'egg', label: 'تخم‌مرغ آب‌پز', sec: 480 },
  { id: 'rice', label: 'برنج دم', sec: 1800 },
  { id: 'pasta', label: 'پاستا', sec: 600 },
  { id: 'steak', label: 'استیک مدیوم', sec: 240 },
  { id: 'tea', label: 'چای', sec: 180 },
  { id: 'coffee', label: 'قهوه فرانسه', sec: 240 },
  { id: 'chicken', label: 'مرغ کبابی', sec: 1500 },
  { id: 'bread', label: 'نان تست', sec: 180 },
  { id: 'soup', label: 'سوپ جوش', sec: 1200 },
  { id: 'rest', label: 'استراحت خمیر', sec: 3600 },
];
export const SUBS = {
  butter: ['روغن زیتون', 'روغن نارگیل'],
  milk: ['شیر بادام', 'شیر سویا'],
  egg: ['تخم کتان + آب', 'موز له'],
  yogurt: ['خامه ترش', 'لبنه'],
  chicken: ['قارچ', 'توفو'],
  rice: ['کینوا', 'بلغور'],
  sugar: ['عسل', 'شیره انگور'],
  flour: ['آرد برنج', 'آرد بادام'],
};
export const HACKS = [
  'برای برنج دانه‌دانه، بعد از آبکش کمی روغن و درب حوله بگذار.',
  'نمک را آخر سوپ تنظیم کن تا حبوبات دیر نرم نشوند.',
  'سیر را آخر سرخ کن تا تلخ نشود.',
  'گوشت را ۳۰ دقیقه قبل از پخت از یخچال بیرون بیاور.',
  'لیمو را در مایکرو ۱۰ ثانیه گرم کن تا آب بیشتری بدهد.',
  'پاستا را یک دقیقه کمتر از بسته بپز، با سس تمام شود.',
  'سبزی را خشک کن تا خورشت آب نیندازد.',
  'برای قورمه‌سبزی، سبزی را جدا سرخ کن تا عطر بماند.',
];
export const TIPS_DAY = [
  'امروز یک وعده رنگارنگ بپز — تنوع رنگ = تنوع ویتامین.',
  'پروتئین صبحانه استریکت را نگه می‌دارد.',
  'لیست خرید را قبل از فروشگاه تیک بزن؛ خرید هیجانی کم می‌شود.',
  'باقیمانده برنج = فردا تهچین یا دمی.',
];

const I = (k, q, u, aisle = 'other') => ({ k, q, u, aisle });
const S = (t, sec = 0) => ({ t, sec });

function R(p) { return p; }

export const RECIPES = [
  R({ id:'r1', name:'قورمه‌سبزی', cat:'ایرانی', meal:'lunch', time:150, diff:'متوسط', kcal:420, p:28, c:22, f:22, srv:4, veg:false, vegan:false, gluten:true, dairy:false, nut:false, spice:2, cost:3, season:'همه', region:'ایران', tags:['خورشت','کلاسیک'],
    ings:[I('گوشت خورشتی',500,'g','meat'),I('سبزی قورمه',600,'g','produce'),I('لوبیا قرمز',200,'g','can'),I('لیمو عمانی',4,'pcs','spice'),I('پیاز',2,'pcs','produce'),I('روغن',40,'ml','oil'),I('نمک',8,'g','spice'),I('زردچوبه',4,'g','spice')],
    steps:[S('پیاز و گوشت را تفت بده تا رنگ بگیرد.',600),S('سبزی را جدا سرخ کن و اضافه کن.',900),S('لوبیا و آب را اضافه کن، ۲ ساعت آرام بپز.',7200),S('لیمو عمانی را در ۲۰ دقیقه آخر بینداز.',1200)],
    tips:'آب را کم‌کم اضافه کن تا خورشت جا بیفتد.' }),
  R({ id:'r2', name:'فسنجان', cat:'ایرانی', meal:'dinner', time:180, diff:'حرفه‌ای', kcal:510, p:26, c:18, f:36, srv:6, veg:false, vegan:false, gluten:true, dairy:false, nut:true, spice:2, cost:4, season:'پاییز', region:'شمال', tags:['مجلسی','گردو'],
    ings:[I('گوشت اردک یا مرغ',800,'g','meat'),I('گردو',400,'g','other'),I('رب انار',250,'ml','oil'),I('پیاز',2,'pcs','produce'),I('شکر',20,'g','sweet'),I('زردچوبه',3,'g','spice')],
    steps:[S('گردو را آسیاب و تفت بده تا روغن بیندازد.',1200),S('گوشت و پیاز را جدا بپز.',1800),S('رب انار و شکر را تنظیم کن و ۳ ساعت جا بده.',10800)],
    tips:'شیرینی/ترشی را آخر با چشیدن میزان کن.' }),
  R({ id:'r3', name:'زرشک‌پلو با مرغ', cat:'ایرانی', meal:'lunch', time:70, diff:'آسان', kcal:480, p:32, c:55, f:14, srv:4, veg:false, vegan:false, gluten:true, dairy:false, nut:false, spice:1, cost:3, season:'همه', region:'ایران', tags:['مهمانی'],
    ings:[I('برنج',400,'g','grain'),I('مرغ',800,'g','meat'),I('زرشک',80,'g','produce'),I('کره',30,'g','dairy'),I('زعفران',1,'g','spice'),I('پیاز',1,'pcs','produce')],
    steps:[S('مرغ را با پیاز بپز.',2400),S('برنج را آبکش کن.',1200),S('زرشک را در کره تفت بده و با زعفران مخلوط کن.',180)],
    tips:'زرشک را نسوزان — ۱۰ ثانیه کافی است.' }),
  R({ id:'r4', name:'کباب کوبیده', cat:'ایرانی', meal:'dinner', time:50, diff:'متوسط', kcal:390, p:30, c:8, f:26, srv:4, veg:false, vegan:false, gluten:true, dairy:false, nut:false, spice:2, cost:3, season:'تابستان', region:'ایران', tags:['کباب'],
    ings:[I('گوشت چرخ‌کرده',700,'g','meat'),I('پیاز رنده‌شده',2,'pcs','produce'),I('نمک',8,'g','spice'),I('فلفل',3,'g','spice'),I('سماق',5,'g','spice')],
    steps:[S('گوشت و پیاز را خوب ورز بده و ۳۰ دقیقه استراحت.',1800),S('سیخ کن و روی حرارت بپز.',720)],
    tips:'چربی گوشت حدود ۲۰٪ باشد تا نشکند.' }),
  R({ id:'r5', name:'میرزاقاسمی', cat:'ایرانی', meal:'dinner', time:45, diff:'آسان', kcal:260, p:12, c:18, f:16, srv:3, veg:true, vegan:false, gluten:true, dairy:false, nut:false, spice:2, cost:2, season:'تابستان', region:'گیلان', tags:['شمال','بادمجان'],
    ings:[I('بادمجان',4,'pcs','produce'),I('سیر',6,'pcs','produce'),I('تخم‌مرغ',3,'pcs','dairy'),I('رب گوجه',30,'g','can'),I('روغن',20,'ml','oil')],
    steps:[S('بادمجان را کبابی کن و پوست بگیر.',900),S('سیر و رب را تفت بده، تخم‌مرغ را آخر اضافه کن.',480)],
    tips:'بادمجان باید کاملاً نرم و دودی باشد.' }),
  R({ id:'r6', name:'کشک بادمجان', cat:'ایرانی', meal:'lunch', time:40, diff:'آسان', kcal:310, p:10, c:20, f:20, srv:4, veg:true, vegan:false, gluten:true, dairy:true, nut:true, spice:1, cost:2, season:'همه', region:'ایران', tags:['پیش‌غذا'],
    ings:[I('بادمجان',4,'pcs','produce'),I('کشک',150,'ml','dairy'),I('نعنا خشک',8,'g','spice'),I('گردو',40,'g','other'),I('سیر',4,'pcs','produce'),I('پیاز داغ',30,'g','produce')],
    steps:[S('بادمجان را سرخ یا فر کن.',1200),S('کشک و نعنا داغ و گردو را روی آن بریز.',180)],
    tips:'کشک را رقیق نکن تا غلیظ بماند.' }),
  R({ id:'r7', name:'عدسی', cat:'ایرانی', meal:'breakfast', time:40, diff:'آسان', kcal:280, p:16, c:40, f:6, srv:4, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:1, cost:1, season:'زمستان', region:'ایران', tags:['صبحانه','ارزان'],
    ings:[I('عدس',300,'g','can'),I('پیاز',1,'pcs','produce'),I('سیب‌زمینی',1,'pcs','produce'),I('زردچوبه',3,'g','spice'),I('روغن',15,'ml','oil')],
    steps:[S('عدس را با پیاز و زردچوبه بپز تا جا بیفتد.',2100)],
    tips:'با نان سنگک و لیمو عالی است.' }),
  R({ id:'r8', name:'املت گوجه', cat:'صبحانه', meal:'breakfast', time:15, diff:'آسان', kcal:220, p:14, c:8, f:14, srv:2, veg:true, vegan:false, gluten:true, dairy:false, nut:false, spice:1, cost:1, season:'همه', region:'ایران', tags:['سریع'],
    ings:[I('تخم‌مرغ',4,'pcs','dairy'),I('گوجه',3,'pcs','produce'),I('روغن',15,'ml','oil'),I('نمک',3,'g','spice')],
    steps:[S('گوجه را سرخ کن، تخم‌مرغ را بشکن و ببند.',480)],
    tips:'درِ ماهیتابه را نگذار تا آب نیندازد اگر خشک دوست داری.' }),
  R({ id:'r9', name:'آش رشته', cat:'ایرانی', meal:'dinner', time:90, diff:'متوسط', kcal:350, p:14, c:48, f:10, srv:6, veg:true, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:2, season:'زمستان', region:'ایران', tags:['نذری'],
    ings:[I('رشته آش',200,'g','grain'),I('حبوبات مخلوط',250,'g','can'),I('سبزی آش',400,'g','produce'),I('کشک',120,'ml','dairy'),I('پیاز داغ',40,'g','produce'),I('نعنا داغ',10,'g','spice')],
    steps:[S('حبوبات را بپز.',2400),S('سبزی و رشته را اضافه کن.',1800),S('با کشک و نعنا داغ سرو کن.',120)],
    tips:'رشته را دیر بینداز تا خمیر نشود.' }),
  R({ id:'r10', name:'کوکو سبزی', cat:'ایرانی', meal:'lunch', time:35, diff:'آسان', kcal:240, p:12, c:10, f:16, srv:4, veg:true, vegan:false, gluten:true, dairy:false, nut:true, spice:1, cost:2, season:'بهار', region:'ایران', tags:['کوکو'],
    ings:[I('سبزی کوکو',400,'g','produce'),I('تخم‌مرغ',4,'pcs','dairy'),I('گردو',40,'g','other'),I('زرشک',20,'g','produce'),I('آرد',20,'g','grain')],
    steps:[S('مواد را مخلوط کن و در روغن دو طرف سرخ کن.',900)],
    tips:'شعله کم باشد تا مغز بپزد.' }),
  R({ id:'r11', name:'تهچین مرغ', cat:'ایرانی', meal:'dinner', time:90, diff:'متوسط', kcal:520, p:30, c:58, f:18, srv:6, veg:false, vegan:false, gluten:true, dairy:true, nut:false, spice:1, cost:3, season:'همه', region:'ایران', tags:['مجلسی'],
    ings:[I('برنج',500,'g','grain'),I('مرغ',700,'g','meat'),I('ماست',250,'g','dairy'),I('زعفران',1,'g','spice'),I('تخم‌مرغ',2,'pcs','dairy'),I('کره',40,'g','dairy')],
    steps:[S('مرغ را بپز و رشته‌رشته کن.',1800),S('برنج را نیم‌پز کن.',900),S('لایه‌لایه در قابلمه بچین و ته Dig بگذار.',2400)],
    tips:'کره ته قابلمه را فراموش نکن.' }),
  R({ id:'r12', name:'دلمه برگ مو', cat:'خاورمیانه', meal:'lunch', time:120, diff:'حرفه‌ای', kcal:280, p:8, c:36, f:10, srv:6, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:2, cost:2, season:'بهار', region:'آذربایجان', tags:['دلمه'],
    ings:[I('برگ مو',40,'pcs','produce'),I('برنج',250,'g','grain'),I('سبزی دلمه',200,'g','produce'),I('لپه',80,'g','can'),I('روغن',30,'ml','oil')],
    steps:[S('مواد را مخلوط و برگ‌ها را بپیچ.',1800),S('چیدمان فشرده و آرام بپز.',3600)],
    tips:'یک بشقاب روی دلمه‌ها بگذار تا باز نشوند.' }),
  R({ id:'r13', name:'پاستا آلفردو', cat:'ایتالیایی', meal:'dinner', time:25, diff:'آسان', kcal:610, p:22, c:62, f:28, srv:3, veg:true, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:3, season:'همه', region:'ایتالیا', tags:['خامه'],
    ings:[I('پاستا',300,'g','grain'),I('خامه',200,'ml','dairy'),I('کره',30,'g','dairy'),I('پارمسان',60,'g','dairy'),I('سیر',2,'pcs','produce')],
    steps:[S('پاستا را آب‌پز کن.',600),S('سس خامه و پنیر را بساز و مخلوط کن.',300)],
    tips:'کمی آب پاستا سس را ابریشمی می‌کند.' }),
  R({ id:'r14', name:'پیتزا مارگاریتا خانگی', cat:'ایتالیایی', meal:'dinner', time:40, diff:'متوسط', kcal:540, p:20, c:64, f:20, srv:2, veg:true, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:2, season:'همه', region:'ایتالیا', tags:['فر'],
    ings:[I('خمیر پیتزا',400,'g','grain'),I('سس گوجه',120,'g','can'),I('موتزارلا',150,'g','dairy'),I('ریحان',10,'g','produce'),I('روغن زیتون',15,'ml','oil')],
    steps:[S('خمیر را پهن کن.',300),S('مواد را بگذار و در فر داغ بپز.',720)],
    tips:'فر را از قبل ۲۳۰ درجه داغ کن.' }),
  R({ id:'r15', name:'نودل سبزیجات', cat:'آسیایی', meal:'lunch', time:20, diff:'آسان', kcal:390, p:12, c:58, f:12, srv:2, veg:true, vegan:true, gluten:false, dairy:false, nut:false, spice:2, cost:2, season:'همه', region:'شرق آسیا', tags:['سریع','وگان'],
    ings:[I('نودل',200,'g','grain'),I('فلفل دلمه‌ای',1,'pcs','produce'),I('هویج',1,'pcs','produce'),I('سس سویا',30,'ml','oil'),I('سیر',2,'pcs','produce'),I('روغن کنجد',10,'ml','oil')],
    steps:[S('نودل را نیم‌پز کن.',240),S('سبزی را تفت و با سس مخلوط کن.',360)],
    tips:'شعله زیاد و تفت کوتاه = تردی.' }),
  R({ id:'r16', name:'چیکن کاری', cat:'آسیایی', meal:'dinner', time:45, diff:'متوسط', kcal:430, p:32, c:18, f:24, srv:4, veg:false, vegan:false, gluten:true, dairy:true, nut:false, spice:3, cost:3, season:'همه', region:'هند', tags:['تند'],
    ings:[I('مرغ',600,'g','meat'),I('ماست',100,'g','dairy'),I('پودر کاری',15,'g','spice'),I('پیاز',2,'pcs','produce'),I('گوجه',2,'pcs','produce'),I('شیر نارگیل',150,'ml','can')],
    steps:[S('مرغ را با ماست و ادویه مزه‌دار کن.',900),S('پیاز و گوجه را تفت و با مرغ بپز.',1500)],
    tips:'ادویه را در روغن ۳۰ ثانیه بو بده.' }),
  R({ id:'r17', name:'سالاد سزار', cat:'سالاد', meal:'lunch', time:15, diff:'آسان', kcal:320, p:18, c:14, f:22, srv:2, veg:false, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:2, season:'همه', region:'جهان', tags:['سبک'],
    ings:[I('کاهو رومی',1,'pcs','produce'),I('مرغ گریل',200,'g','meat'),I('نان تست',60,'g','grain'),I('پارمسان',30,'g','dairy'),I('سس سزار',50,'ml','oil')],
    steps:[S('مرغ را گریل کن.',480),S('مواد را مخلوط کن.',120)],
    tips:'کاهو را خشک کن تا سس رقیق نشود.' }),
  R({ id:'r18', name:'سوپ جو', cat:'سوپ', meal:'dinner', time:50, diff:'آسان', kcal:210, p:8, c:28, f:6, srv:4, veg:true, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:1, season:'زمستان', region:'ایران', tags:['گرم'],
    ings:[I('جو پرک',80,'g','grain'),I('هویج',2,'pcs','produce'),I('مرغ آب‌پز',150,'g','meat'),I('جعفری',20,'g','produce'),I('کره',15,'g','dairy')],
    steps:[S('جو و سبزی را با آب مرغ بپز تا لعاب بگیرد.',2400)],
    tips:'آخر جعفری تازه بزن.' }),
  R({ id:'r19', name:'ماکارونی با سس گوشت', cat:'فست‌فود خانگی', meal:'dinner', time:35, diff:'آسان', kcal:560, p:24, c:62, f:22, srv:4, veg:false, vegan:false, gluten:false, dairy:false, nut:false, spice:2, cost:2, season:'همه', region:'ایران', tags:['خانوادگی'],
    ings:[I('ماکارونی',400,'g','grain'),I('گوشت چرخ',400,'g','meat'),I('رب',80,'g','can'),I('پیاز',1,'pcs','produce'),I('سیب‌زمینی خلال',200,'g','produce')],
    steps:[S('سس گوشت را بپز.',1200),S('ماکارونی آبکش و لایه‌لایه بچین.',600)],
    tips:'سیب‌زمینی روی ماکارونی تردی می‌دهد.' }),
  R({ id:'r20', name:'فلافل خانگی', cat:'خاورمیانه', meal:'lunch', time:40, diff:'متوسط', kcal:340, p:14, c:32, f:16, srv:4, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:2, cost:1, season:'همه', region:'لبنان', tags:['وگان'],
    ings:[I('نخود خیس‌خورده',300,'g','can'),I('جعفری',40,'g','produce'),I('سیر',3,'pcs','produce'),I('زیره',4,'g','spice'),I('بیکینگ‌پودر',4,'g','grain')],
    steps:[S('مواد را چرخ کن و استراحت بده.',1200),S('سرخ کن تا طلایی شود.',480)],
    tips:'نخود پخته نباشد — خیس‌خورده خام.' }),
  R({ id:'r21', name:'شاک شوکا', cat:'خاورمیانه', meal:'breakfast', time:25, diff:'آسان', kcal:290, p:16, c:16, f:18, srv:2, veg:true, vegan:false, gluten:true, dairy:false, nut:false, spice:2, cost:2, season:'همه', region:'فلسطین', tags:['تخم‌مرغ'],
    ings:[I('گوجه',4,'pcs','produce'),I('فلفل دلمه',1,'pcs','produce'),I('تخم‌مرغ',4,'pcs','dairy'),I('زیره',3,'g','spice'),I('روغن زیتون',20,'ml','oil')],
    steps:[S('سس گوجه را بپز، تخم‌مرغ را داخل گودال‌ها ببند.',900)],
    tips:'زرده کمی نرم بماند.' }),
  R({ id:'r22', name:'پنه آرابیاتا', cat:'ایتالیایی', meal:'lunch', time:20, diff:'آسان', kcal:470, p:14, c:72, f:12, srv:3, veg:true, vegan:true, gluten:false, dairy:false, nut:false, spice:3, cost:1, season:'همه', region:'ایتالیا', tags:['تند','وگان'],
    ings:[I('پنه',300,'g','grain'),I('گوجه خرد',400,'g','can'),I('سیر',3,'pcs','produce'),I('فلفل قرمز',4,'g','spice'),I('ریحان',8,'g','produce')],
    steps:[S('سیر و فلفل را در روغن بو بده، گوجه را ۱۰ دقیقه بجوشان.',720),S('با پاستا مخلوط کن.',120)],
    tips:'روغن زیتون خوب کیفیت سس را عوض می‌کند.' }),
  R({ id:'r23', name:'املت اسفناج', cat:'صبحانه', meal:'breakfast', time:12, diff:'آسان', kcal:240, p:16, c:6, f:16, srv:1, veg:true, vegan:false, gluten:true, dairy:true, nut:false, spice:1, cost:1, season:'همه', region:'جهان', tags:['پروتئین'],
    ings:[I('تخم‌مرغ',3,'pcs','dairy'),I('اسفناج',80,'g','produce'),I('پنیر',30,'g','dairy'),I('کره',10,'g','dairy')],
    steps:[S('اسفناج را پژمرده کن، تخم‌مرغ را بریز.',360)],
    tips:'شعله متوسط تا املت چرمی نشود.' }),
  R({ id:'r24', name:'خوراک لوبیا چیتی', cat:'ایرانی', meal:'dinner', time:30, diff:'آسان', kcal:260, p:12, c:36, f:6, srv:3, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:2, cost:1, season:'زمستان', region:'ایران', tags:['ارزان'],
    ings:[I('لوبیا چیتی',400,'g','can'),I('رب',40,'g','can'),I('پیاز',1,'pcs','produce'),I('سیب‌زمینی',1,'pcs','produce')],
    steps:[S('پیاز و رب را تفت، لوبیا و سیب را بپز.',1500)],
    tips:'با نان بربری کلاسیک است.' }),
  R({ id:'r25', name:'جوجه کباب', cat:'ایرانی', meal:'dinner', time:40, diff:'آسان', kcal:360, p:34, c:6, f:20, srv:4, veg:false, vegan:false, gluten:true, dairy:true, nut:false, spice:2, cost:3, season:'تابستان', region:'ایران', tags:['کباب'],
    ings:[I('سینه مرغ',700,'g','meat'),I('ماست',150,'g','dairy'),I('زعفران',1,'g','spice'),I('پیاز',1,'pcs','produce'),I('لیمو',1,'pcs','produce')],
    steps:[S('مرغ را حداقل ۲ ساعت مزه‌دار کن.',0),S('سیخ یا تابه گریل کن.',720)],
    tips:'ماست گوشت را نرم می‌کند.' }),
  R({ id:'r26', name:'سالاد شیرازی', cat:'سالاد', meal:'snack', time:10, diff:'آسان', kcal:70, p:2, c:10, f:2, srv:4, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:1, cost:1, season:'تابستان', region:'شیراز', tags:['خنک'],
    ings:[I('خیار',2,'pcs','produce'),I('گوجه',2,'pcs','produce'),I('پیاز',1,'pcs','produce'),I('آبغوره',20,'ml','oil'),I('نعنا خشک',3,'g','spice')],
    steps:[S('همه را ریز خرد و مخلوط کن.',300)],
    tips:'نمک را درست قبل سرو بزن.' }),
  R({ id:'r27', name:'ماست و خیار', cat:'سالاد', meal:'snack', time:5, diff:'آسان', kcal:90, p:5, c:8, f:4, srv:3, veg:true, vegan:false, gluten:true, dairy:true, nut:true, spice:1, cost:1, season:'تابستان', region:'ایران', tags:['جانبی'],
    ings:[I('ماست',300,'g','dairy'),I('خیار',2,'pcs','produce'),I('گردو',20,'g','other'),I('نعناداغ',3,'g','spice'),I('کشمش',15,'g','sweet')],
    steps:[S('مخلوط کن و خنک سرو کن.',120)],
    tips:'خیار را آب نگیر مگر غلیظ بخواهی.' }),
  R({ id:'r28', name:'کیک هویج خانگی', cat:'دسر', meal:'dessert', time:70, diff:'متوسط', kcal:380, p:6, c:48, f:18, srv:8, veg:true, vegan:false, gluten:false, dairy:true, nut:true, spice:1, cost:2, season:'همه', region:'جهان', tags:['فر','شیرین'],
    ings:[I('هویج رنده',250,'g','produce'),I('آرد',220,'g','grain'),I('شکر',150,'g','sweet'),I('تخم‌مرغ',3,'pcs','dairy'),I('روغن',120,'ml','oil'),I('دارچین',4,'g','spice'),I('گردو',50,'g','other')],
    steps:[S('مواد خشک و تر را جدا مخلوط کن.',300),S('۴۵ دقیقه در فر ۱۷۵ بپز.',2700)],
    tips:'خلال دندان باید تمیز بیرون بیاید.' }),
  R({ id:'r29', name:'شله‌زرد', cat:'دسر', meal:'dessert', time:60, diff:'آسان', kcal:220, p:3, c:44, f:4, srv:6, veg:true, vegan:true, gluten:true, dairy:false, nut:true, spice:1, cost:2, season:'همه', region:'ایران', tags:['نذری'],
    ings:[I('برنج',150,'g','grain'),I('شکر',180,'g','sweet'),I('زعفران',1,'g','spice'),I('گلاب',30,'ml','oil'),I('خلال بادام',30,'g','other')],
    steps:[S('برنج را کاملاً نرم بپز، شکر و زعفران را اضافه کن.',3000)],
    tips:'هم بزن تا ته‌نگیرد.' }),
  R({ id:'r30', name:'فرنی', cat:'دسر', meal:'dessert', time:25, diff:'آسان', kcal:210, p:6, c:32, f:6, srv:4, veg:true, vegan:false, gluten:true, dairy:true, nut:false, spice:1, cost:1, season:'همه', region:'ایران', tags:['کودک'],
    ings:[I('آرد برنج',60,'g','grain'),I('شیر',700,'ml','dairy'),I('شکر',80,'g','sweet'),I('گلاب',10,'ml','oil')],
    steps:[S('آرد را با کمی شیر حل کن، بقیه را بجوشان تا غلیظ شود.',900)],
    tips:'مدام هم بزن تا گلوله نشود.' }),
  R({ id:'r31', name:'املت قارچ', cat:'صبحانه', meal:'breakfast', time:15, diff:'آسان', kcal:250, p:16, c:6, f:18, srv:1, veg:true, vegan:false, gluten:true, dairy:false, nut:false, spice:1, cost:2, season:'همه', region:'جهان', tags:['سریع'],
    ings:[I('تخم‌مرغ',3,'pcs','dairy'),I('قارچ',120,'g','produce'),I('پیازچه',20,'g','produce'),I('روغن',10,'ml','oil')],
    steps:[S('قارچ را تفت تا آبش بخار شود، تخم‌مرغ را اضافه کن.',480)],
    tips:'قارچ را شلوغ نکن تا سرخ شود نه بخارپز.' }),
  R({ id:'r32', name:'استیک گوشت با کره سیر', cat:'فست‌فود خانگی', meal:'dinner', time:20, diff:'متوسط', kcal:480, p:40, c:2, f:34, srv:2, veg:false, vegan:false, gluten:true, dairy:true, nut:false, spice:1, cost:4, season:'همه', region:'جهان', tags:['پروتئین'],
    ings:[I('استیک',400,'g','meat'),I('کره',30,'g','dairy'),I('سیر',3,'pcs','produce'),I('رزماری',4,'g','spice'),I('نمک',4,'g','spice')],
    steps:[S('گوشت را خشک کن و تابه داغ ۳–۴ دقیقه هر طرف.',480),S('کره سیر را روی گوشت آب کن.',60)],
    tips:'۵ دقیقه استراحت بعد از پخت.' }),
  R({ id:'r33', name:'عدس‌پلو', cat:'ایرانی', meal:'lunch', time:55, diff:'آسان', kcal:430, p:16, c:68, f:10, srv:4, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:1, cost:1, season:'همه', region:'ایران', tags:['گیاهی'],
    ings:[I('برنج',400,'g','grain'),I('عدس',200,'g','can'),I('کشمش',40,'g','sweet'),I('پیاز داغ',40,'g','produce'),I('زردچوبه',3,'g','spice')],
    steps:[S('عدس را نیم‌پز، با برنج دم کن.',1800)],
    tips:'کشمش را جدا تفت بده تا نسوزد.' }),
  R({ id:'r34', name:'باقالی‌پلو با ماهیچه', cat:'ایرانی', meal:'lunch', time:100, diff:'حرفه‌ای', kcal:520, p:28, c:58, f:16, srv:5, veg:false, vegan:false, gluten:true, dairy:false, nut:false, spice:1, cost:4, season:'بهار', region:'ایران', tags:['مجلسی'],
    ings:[I('برنج',500,'g','grain'),I('باقالی',250,'g','produce'),I('شوید',80,'g','produce'),I('ماهیچه',700,'g','meat')],
    steps:[S('ماهیچه را جدا بپز.',3600),S('باقالی و شوید را با برنج دم کن.',1800)],
    tips:'باقالی را زیاد نرم نکن.' }),
  R({ id:'r35', name:'سوپ گوجه', cat:'سوپ', meal:'dinner', time:25, diff:'آسان', kcal:140, p:4, c:18, f:6, srv:3, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:1, cost:1, season:'همه', region:'جهان', tags:['سبک'],
    ings:[I('گوجه',6,'pcs','produce'),I('پیاز',1,'pcs','produce'),I('سیر',2,'pcs','produce'),I('ریحان',8,'g','produce'),I('روغن زیتون',15,'ml','oil')],
    steps:[S('مواد را بپز و پوره کن.',1200)],
    tips:'کمی شکر ترشی گوجه را بالانس می‌کند.' }),
  R({ id:'r36', name:'توفو سرخ‌شده با سس سویا', cat:'گیاهی', meal:'dinner', time:20, diff:'آسان', kcal:280, p:18, c:12, f:16, srv:2, veg:true, vegan:true, gluten:false, dairy:false, nut:false, spice:2, cost:2, season:'همه', region:'شرق آسیا', tags:['وگان','پروتئین'],
    ings:[I('توفو سفت',300,'g','other'),I('سس سویا',25,'ml','oil'),I('کنجد',10,'g','other'),I('پیازچه',20,'g','produce'),I('نشاسته',15,'g','grain')],
    steps:[S('توفو را خشک، آغشته به نشاسته و سرخ کن.',600)],
    tips:'پرس کردن آب توفو طلایی می‌کند.' }),
  R({ id:'r37', name:'پنکیک صبحانه', cat:'صبحانه', meal:'breakfast', time:20, diff:'آسان', kcal:340, p:10, c:48, f:12, srv:3, veg:true, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:1, season:'همه', region:'جهان', tags:['شیرین'],
    ings:[I('آرد',180,'g','grain'),I('شیر',200,'ml','dairy'),I('تخم‌مرغ',1,'pcs','dairy'),I('بیکینگ‌پودر',6,'g','grain'),I('شکر',20,'g','sweet')],
    steps:[S('خمیر را هم‌بزن، روی تابه حلقه بپز.',600)],
    tips:'وقتی حباب زد برگردان.' }),
  R({ id:'r38', name:'گرانولا ماست', cat:'صبحانه', meal:'breakfast', time:8, diff:'آسان', kcal:310, p:12, c:36, f:12, srv:1, veg:true, vegan:false, gluten:true, dairy:true, nut:true, spice:1, cost:2, season:'همه', region:'جهان', tags:['سریع'],
    ings:[I('ماست یونانی',200,'g','dairy'),I('گرانولا',60,'g','grain'),I('عسل',15,'g','sweet'),I('توت',50,'g','produce')],
    steps:[S('لایه‌لایه در کاسه بچین.',120)],
    tips:'گرانولا را آخر بریز تا نرم نشود.' }),
  R({ id:'r39', name:'سمبوسه سیب‌زمینی', cat:'خاورمیانه', meal:'snack', time:40, diff:'متوسط', kcal:290, p:6, c:34, f:14, srv:6, veg:true, vegan:true, gluten:false, dairy:false, nut:false, spice:2, cost:1, season:'همه', region:'جنوب', tags:['سرخ‌کردنی'],
    ings:[I('خمیر سمبوسه',12,'pcs','grain'),I('سیب‌زمینی',400,'g','produce'),I('پیاز',1,'pcs','produce'),I('ادویه کاری',8,'g','spice')],
    steps:[S('ماده را بپز، بپیچ و سرخ کن.',1200)],
    tips:'هوای داخل را خالی کن تا نترکد.' }),
  R({ id:'r40', name:'حلیم گندم', cat:'ایرانی', meal:'breakfast', time:180, diff:'حرفه‌ای', kcal:360, p:22, c:42, f:10, srv:8, veg:false, vegan:false, gluten:false, dairy:true, nut:true, spice:1, cost:3, season:'زمستان', region:'ایران', tags:['نذری'],
    ings:[I('گندم پوست‌کنده',400,'g','grain'),I('گوشت',500,'g','meat'),I('دارچین',6,'g','spice'),I('کره',40,'g','dairy'),I('شکر',40,'g','sweet')],
    steps:[S('گندم و گوشت را ساعت‌ها بپز و بکوب.',10800)],
    tips:'هم زدن مداوم لعاب می‌دهد.' }),
  R({ id:'r41', name:'سالاد کینوا', cat:'سالاد', meal:'lunch', time:25, diff:'آسان', kcal:330, p:12, c:42, f:12, srv:3, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:1, cost:3, season:'تابستان', region:'جهان', tags:['سالم'],
    ings:[I('کینوا',150,'g','grain'),I('خیار',1,'pcs','produce'),I('گوجه گیلاسی',120,'g','produce'),I('جعفری',30,'g','produce'),I('لیمو',1,'pcs','produce'),I('روغن زیتون',20,'ml','oil')],
    steps:[S('کینوا را بپز و خنک کن، با سبزی مخلوط کن.',900)],
    tips:'کینوا را بعد جوش آبکشی کن تا تلخی برود.' }),
  R({ id:'r42', name:'برگر خانگی', cat:'فست‌فود خانگی', meal:'dinner', time:30, diff:'آسان', kcal:620, p:32, c:40, f:34, srv:4, veg:false, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:3, season:'همه', region:'جهان', tags:['مهمانی'],
    ings:[I('گوشت چرخ',500,'g','meat'),I('نان برگر',4,'pcs','grain'),I('پنیر',80,'g','dairy'),I('کاهو',40,'g','produce'),I('گوجه',1,'pcs','produce')],
    steps:[S('گوشت را فرم بده و گریل کن.',600),S('نان را تست و اسمبل کن.',180)],
    tips:'وسط گوشت را گود کن تا باد نکند.' }),
  R({ id:'r43', name:'خوراک بادمجان', cat:'ایرانی', meal:'dinner', time:45, diff:'آسان', kcal:240, p:6, c:18, f:16, srv:4, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:2, cost:1, season:'تابستان', region:'ایران', tags:['گیاهی'],
    ings:[I('بادمجان',4,'pcs','produce'),I('گوجه',3,'pcs','produce'),I('پیاز',1,'pcs','produce'),I('رب',30,'g','can'),I('سیر',3,'pcs','produce')],
    steps:[S('بادمجان را سرخ، با سس گوجه بپز.',1500)],
    tips:'نمک روی بادمجان تلخی را کم می‌کند.' }),
  R({ id:'r44', name:'پلو شوید با شویدماهی', cat:'ایرانی', meal:'lunch', time:70, diff:'متوسط', kcal:450, p:26, c:56, f:12, srv:4, veg:false, vegan:false, gluten:true, dairy:false, nut:false, spice:1, cost:4, season:'بهار', region:'شمال', tags:['ماهی'],
    ings:[I('برنج',400,'g','grain'),I('شوید',100,'g','produce'),I('ماهی سفید',500,'g','fish'),I('سیر',4,'pcs','produce'),I('آب نارنج',30,'ml','oil')],
    steps:[S('ماهی را مزه‌دار و سرخ/فر کن.',900),S('برنج شوید را دم کن.',1800)],
    tips:'ماهی را زیاد نپز تا خشک نشود.' }),
  R({ id:'r45', name:'سوپ قارچ خامه', cat:'سوپ', meal:'dinner', time:30, diff:'آسان', kcal:220, p:6, c:14, f:16, srv:3, veg:true, vegan:false, gluten:true, dairy:true, nut:false, spice:1, cost:2, season:'پاییز', region:'جهان', tags:['خامه‌ای'],
    ings:[I('قارچ',300,'g','produce'),I('خامه',120,'ml','dairy'),I('پیاز',1,'pcs','produce'),I('کره',20,'g','dairy'),I('جعفری',10,'g','produce')],
    steps:[S('قارچ را تفت، با آب و خامه پوره کن.',1200)],
    tips:'کمی قارچ را جدا نگه دار برای تکسچر.' }),
  R({ id:'r46', name:'نان سیر', cat:'ایتالیایی', meal:'snack', time:15, diff:'آسان', kcal:280, p:6, c:32, f:14, srv:4, veg:true, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:1, season:'همه', region:'ایتالیا', tags:['جانبی'],
    ings:[I('نان باگت',1,'pcs','grain'),I('کره',40,'g','dairy'),I('سیر',4,'pcs','produce'),I('جعفری',10,'g','produce')],
    steps:[S('کره سیر را بمال و ۱۰ دقیقه در فر بگذار.',600)],
    tips:'آخر پنیر هم می‌توانی بپاشی.' }),
  R({ id:'r47', name:'اسموتی توت', cat:'صبحانه', meal:'breakfast', time:5, diff:'آسان', kcal:180, p:6, c:28, f:4, srv:1, veg:true, vegan:false, gluten:true, dairy:true, nut:false, spice:0, cost:2, season:'تابستان', region:'جهان', tags:['نوشیدنی'],
    ings:[I('توت مخلوط',150,'g','produce'),I('ماست',120,'g','dairy'),I('موز',1,'pcs','produce'),I('عسل',10,'g','sweet')],
    steps:[S('همه را در مخلوط‌کن بزن.',60)],
    tips:'یخ توت یخچالی کافی است.' }),
  R({ id:'r48', name:'املت سیب‌زمینی', cat:'صبحانه', meal:'breakfast', time:20, diff:'آسان', kcal:310, p:14, c:28, f:16, srv:2, veg:true, vegan:false, gluten:true, dairy:false, nut:false, spice:1, cost:1, season:'همه', region:'ایران', tags:['سیرکننده'],
    ings:[I('سیب‌زمینی',2,'pcs','produce'),I('تخم‌مرغ',3,'pcs','dairy'),I('پیاز',1,'pcs','produce'),I('زردچوبه',2,'g','spice')],
    steps:[S('سیب را سرخ، تخم‌مرغ را روی آن ببند.',720)],
    tips:'خلال نازک زودتر می‌پزد.' }),
  R({ id:'r49', name:'لازانیا سبزیجات', cat:'ایتالیایی', meal:'dinner', time:70, diff:'متوسط', kcal:490, p:18, c:52, f:22, srv:6, veg:true, vegan:false, gluten:false, dairy:true, nut:false, spice:1, cost:3, season:'همه', region:'ایتالیا', tags:['فر'],
    ings:[I('ورق لازانیا',250,'g','grain'),I('کدو',200,'g','produce'),I('اسفناج',150,'g','produce'),I('سس بشامل',300,'ml','dairy'),I('سس گوجه',250,'g','can'),I('پنیر',150,'g','dairy')],
    steps:[S('لایه‌لایه بچین و ۴۰ دقیقه بپز.',2400)],
    tips:'۱۰ دقیقه بعد فر استراحت بده.' }),
  R({ id:'r50', name:'خوراک نخود', cat:'گیاهی', meal:'lunch', time:35, diff:'آسان', kcal:300, p:14, c:38, f:8, srv:4, veg:true, vegan:true, gluten:true, dairy:false, nut:false, spice:2, cost:1, season:'همه', region:'خاورمیانه', tags:['وگان','ارزان'],
    ings:[I('نخود پخته',400,'g','can'),I('گوجه',2,'pcs','produce'),I('پیاز',1,'pcs','produce'),I('زیره',4,'g','spice'),I('روغن زیتون',20,'ml','oil')],
    steps:[S('پیاز و ادویه را تفت، نخود را ۲۰ دقیقه بجوشان.',1200)],
    tips:'با نان یا برنج سرو کن.' }),
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function scaleIngs(ings, from, to) {
  const f = (to || 1) / (from || 1);
  return ings.map((x) => ({ ...x, q: Math.round(x.q * f * 100) / 100 }));
}

export function nutritionFor(r, srv) {
  const f = (srv || r.srv) / r.srv;
  return { kcal: Math.round(r.kcal * f), p: Math.round(r.p * f), c: Math.round(r.c * f), fat: Math.round(r.f * f) };
}

export function convertQty(q, from, to) {
  const g = { g: 1, kg: 1000, ml: 1, l: 1000, cup: 240, tbsp: 15, tsp: 5, pcs: 50, pinch: 0.3 };
  const a = g[from] ?? 1, b = g[to] ?? 1;
  return Math.round((q * a / b) * 100) / 100;
}

export function matchesDiet(r, diet) {
  if (!diet || diet === 'all') return true;
  if (diet === 'veg') return r.veg;
  if (diet === 'vegan') return r.vegan;
  if (diet === 'gf') return r.gluten;
  if (diet === 'df') return !r.dairy;
  if (diet === 'lowcal') return r.kcal <= 320;
  if (diet === 'hiP') return r.p >= 24;
  return true;
}

// ═══ ادغام بانک ۲۰۵ دستوری نسبی رفیق ═══
import { BANK_A } from './kt-bank-a.js';
import { BANK_B } from './kt-bank-b.js';
import { BANK_C } from './kt-bank-c.js';
import { BANK_D } from './kt-bank-d.js';
import { BANK_E } from './kt-bank-e.js';
RECIPES.push(...BANK_A, ...BANK_B, ...BANK_C, ...BANK_D, ...BANK_E);
if (!CATS.includes('نوشیدنی')) CATS.push('نوشیدنی');
export { TIPS_BANK, PANTRY_CATS, PANTRY_UNITS } from './kt-bank-lib.js';
