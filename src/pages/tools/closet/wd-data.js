export const CATS = ['تیشرت','پیراهن','شلوار','دامن','کت','هودی','کفش','کیف','اکسسوری','مانتو','شلوارک','بافت'];
export const COLORS = ['مشکی','سفید','کرم','نوک‌مدادی','آبی','سبز','قرمز','صورتی','طلایی','قهوه‌ای','سرمه‌ای','طوسی'];
export const SEASONS = ['بهار','تابستان','پاییز','زمستان','همه'];
export const OCC = ['روزمره','اداری','مهمانی','ورزش','سفر','خانه','عزاداری','عقد/عروسی'];
export const WEATHER = ['آفتابی','ابری','باران','برف','گرم','سرد','باد'];
export const TIPS = [
  'قانون سه‌رنگ: حداکثر سه رنگ در یک استایل.',
  'کفش تیره پا را کشیده‌تر نشان می‌دهد.',
  'یک قطعه بیانیه کافی است؛ بقیه ساده باشد.',
  'رنگ‌های خنثی کپسول کمد را قوی می‌کنند.',
  'لباس شسته را همان روز آویزان کن تا چروک نماند.',
];
export function harmony(a, b) {
  const n = new Set(['مشکی','سفید','کرم','طوسی','نوک‌مدادی','سرمه‌ای','قهوه‌ای']);
  if (a === b) return 90;
  if (n.has(a) || n.has(b)) return 78;
  const pair = [a, b].sort().join();
  if (['آبی,سفید','سبز,کرم','قرمز,مشکی','صورتی,کرم','طلایی,مشکی'].includes(pair)) return 88;
  return 62;
}

const G = (p) => p;
export const GARMENTS = [
  G({ id:'g1', name:'تیشرت سفید ساده', cat:'تیشرت', color:'سفید', season:'همه', occ:['روزمره','ورزش','خانه'], warm:3, formal:1, price:250000, brand:'Basic', tags:['کپسول'] }),
  G({ id:'g2', name:'تیشرت مشکی', cat:'تیشرت', color:'مشکی', season:'همه', occ:['روزمره','مهمانی'], warm:3, formal:2, price:280000, brand:'Basic', tags:['کپسول'] }),
  G({ id:'g3', name:'پیراهن آبی آسمانی', cat:'پیراهن', color:'آبی', season:'بهار', occ:['اداری','روزمره'], warm:2, formal:4, price:890000, brand:'Formal', tags:['اداری'] }),
  G({ id:'g4', name:'پیراهن سفید رسمی', cat:'پیراهن', color:'سفید', season:'همه', occ:['اداری','عقد/عروسی'], warm:2, formal:5, price:1200000, brand:'Formal', tags:['کپسول'] }),
  G({ id:'g5', name:'جین آبی کلاسیک', cat:'شلوار', color:'آبی', season:'همه', occ:['روزمره','سفر'], warm:3, formal:2, price:1100000, brand:'Denim', tags:['کپسول'] }),
  G({ id:'g6', name:'شلوار پارچه‌ای مشکی', cat:'شلوار', color:'مشکی', season:'همه', occ:['اداری','مهمانی'], warm:3, formal:5, price:1400000, brand:'Formal', tags:['اداری'] }),
  G({ id:'g7', name:'کت سرمه‌ای', cat:'کت', color:'سرمه‌ای', season:'پاییز', occ:['اداری','مهمانی'], warm:4, formal:5, price:3200000, brand:'Tailor', tags:['مجلسی'] }),
  G({ id:'g8', name:'هودی طوسی', cat:'هودی', color:'طوسی', season:'پاییز', occ:['خانه','روزمره','ورزش'], warm:4, formal:1, price:720000, brand:'Sport', tags:[] }),
  G({ id:'g9', name:'بافت کرم', cat:'بافت', color:'کرم', season:'زمستان', occ:['روزمره','سفر'], warm:5, formal:2, price:980000, brand:'Wool', tags:['زمستانه'] }),
  G({ id:'g10', name:'مانتو مشکی بلند', cat:'مانتو', color:'مشکی', season:'همه', occ:['اداری','عزاداری','روزمره'], warm:4, formal:4, price:2100000, brand:'Modest', tags:['کپسول'] }),
  G({ id:'g11', name:'مانتو بهاری سبز', cat:'مانتو', color:'سبز', season:'بهار', occ:['روزمره','سفر'], warm:3, formal:3, price:1800000, brand:'Modest', tags:[] }),
  G({ id:'g12', name:'کفش سفید اسنیکر', cat:'کفش', color:'سفید', season:'همه', occ:['روزمره','ورزش','سفر'], warm:2, formal:1, price:1500000, brand:'Sneak', tags:['کپسول'] }),
  G({ id:'g13', name:'کفش رسمی مشکی', cat:'کفش', color:'مشکی', season:'همه', occ:['اداری','مهمانی','عقد/عروسی'], warm:2, formal:5, price:2400000, brand:'Leather', tags:['اداری'] }),
  G({ id:'g14', name:'کیف دستی کرم', cat:'کیف', color:'کرم', season:'همه', occ:['اداری','مهمانی'], warm:1, formal:4, price:1600000, brand:'Bag', tags:[] }),
  G({ id:'g15', name:'شال نخی سفید', cat:'اکسسوری', color:'سفید', season:'تابستان', occ:['روزمره'], warm:1, formal:2, price:320000, brand:'Scarf', tags:[] }),
  G({ id:'g16', name:'دامن میدی مشکی', cat:'دامن', color:'مشکی', season:'همه', occ:['اداری','مهمانی'], warm:2, formal:4, price:890000, brand:'Midi', tags:[] }),
  G({ id:'g17', name:'شلوارک جین', cat:'شلوارک', color:'آبی', season:'تابستان', occ:['خانه','ورزش'], warm:1, formal:1, price:540000, brand:'Denim', tags:[] }),
  G({ id:'g18', name:'کاپشن بادگیر', cat:'کت', color:'نوک‌مدادی', season:'زمستان', occ:['سفر','روزمره'], warm:5, formal:2, price:2700000, brand:'Outdoor', tags:['باران'] }),
  G({ id:'g19', name:'پیراهن چهارخونه', cat:'پیراهن', color:'قرمز', season:'پاییز', occ:['روزمره','خانه'], warm:3, formal:2, price:670000, brand:'Casual', tags:[] }),
  G({ id:'g20', name:'ساعت طلایی', cat:'اکسسوری', color:'طلایی', season:'همه', occ:['مهمانی','اداری','عقد/عروسی'], warm:1, formal:5, price:4500000, brand:'Watch', tags:['بیانیه'] }),
  G({ id:'g21', name:'بوت قهوه‌ای', cat:'کفش', color:'قهوه‌ای', season:'پاییز', occ:['روزمره','سفر'], warm:4, formal:3, price:1900000, brand:'Boot', tags:[] }),
  G({ id:'g22', name:'تیشرت صورتی', cat:'تیشرت', color:'صورتی', season:'بهار', occ:['روزمره','خانه'], warm:2, formal:1, price:260000, brand:'Basic', tags:[] }),
  G({ id:'g23', name:'مانتو کرم لینن', cat:'مانتو', color:'کرم', season:'تابستان', occ:['روزمره','اداری'], warm:2, formal:3, price:1650000, brand:'Linen', tags:['خنک'] }),
  G({ id:'g24', name:'کیف کوله مشکی', cat:'کیف', color:'مشکی', season:'همه', occ:['سفر','ورزش','روزمره'], warm:1, formal:1, price:980000, brand:'Pack', tags:[] }),
  G({ id:'g25', name:'شال مشکی رسمی', cat:'اکسسوری', color:'مشکی', season:'همه', occ:['عزاداری','اداری'], warm:2, formal:4, price:410000, brand:'Scarf', tags:[] }),
  G({ id:'g26', name:'بافت یقه اسکی', cat:'بافت', color:'مشکی', season:'زمستان', occ:['روزمره','سفر'], warm:5, formal:3, price:1100000, brand:'Wool', tags:[] }),
  G({ id:'g27', name:'کت جین', cat:'کت', color:'آبی', season:'بهار', occ:['روزمره'], warm:3, formal:2, price:1300000, brand:'Denim', tags:[] }),
  G({ id:'g28', name:'کفش ورزشی مشکی', cat:'کفش', color:'مشکی', season:'همه', occ:['ورزش'], warm:2, formal:1, price:1800000, brand:'Sport', tags:[] }),
  G({ id:'g29', name:'پیراهن لینن کرم', cat:'پیراهن', color:'کرم', season:'تابستان', occ:['سفر','روزمره'], warm:1, formal:3, price:920000, brand:'Linen', tags:['خنک'] }),
  G({ id:'g30', name:'کمربند چرم', cat:'اکسسوری', color:'قهوه‌ای', season:'همه', occ:['اداری','روزمره'], warm:1, formal:4, price:480000, brand:'Leather', tags:[] }),
  G({ id:'g31', name:'هودی سرمه‌ای', cat:'هودی', color:'سرمه‌ای', season:'زمستان', occ:['خانه','روزمره'], warm:4, formal:1, price:760000, brand:'Sport', tags:[] }),
  G({ id:'g32', name:'دامن پلیسه کرم', cat:'دامن', color:'کرم', season:'بهار', occ:['مهمانی','روزمره'], warm:2, formal:3, price:740000, brand:'Midi', tags:[] }),
  G({ id:'g33', name:'مانتو بارانی', cat:'مانتو', color:'نوک‌مدادی', season:'پاییز', occ:['سفر','روزمره'], warm:4, formal:3, price:2200000, brand:'Rain', tags:['باران'] }),
  G({ id:'g34', name:'صندل کرم', cat:'کفش', color:'کرم', season:'تابستان', occ:['خانه','روزمره'], warm:1, formal:2, price:690000, brand:'Sand', tags:[] }),
  G({ id:'g35', name:'تیشرت گرافیکی', cat:'تیشرت', color:'سفید', season:'تابستان', occ:['روزمره'], warm:2, formal:1, price:390000, brand:'Print', tags:['بیانیه'] }),
  G({ id:'g36', name:'شلوار کارگو', cat:'شلوار', color:'سبز', season:'پاییز', occ:['سفر','روزمره'], warm:3, formal:1, price:980000, brand:'Cargo', tags:[] }),
  G({ id:'g37', name:'گوشواره طلایی', cat:'اکسسوری', color:'طلایی', season:'همه', occ:['مهمانی','عقد/عروسی'], warm:1, formal:5, price:850000, brand:'Jewel', tags:['بیانیه'] }),
  G({ id:'g38', name:'کت مخمل مهمانی', cat:'کت', color:'مشکی', season:'زمستان', occ:['مهمانی','عقد/عروسی'], warm:4, formal:5, price:4100000, brand:'Eve', tags:['مجلسی'] }),
  G({ id:'g39', name:'شلوار راحتی خانه', cat:'شلوار', color:'طوسی', season:'همه', occ:['خانه'], warm:3, formal:0, price:320000, brand:'Home', tags:[] }),
  G({ id:'g40', name:'کلاه بافت', cat:'اکسسوری', color:'کرم', season:'زمستان', occ:['سفر','روزمره'], warm:4, formal:1, price:210000, brand:'Wool', tags:[] }),
];
export const PACK_PRESETS = {
  weekend: ['تیشرت','شلوار','کفش','مانتو','اکسسوری'],
  work3: ['پیراهن','شلوار','کت','کفش','کیف'],
  beach: ['تیشرت','شلوارک','صندل','شال'],
};
