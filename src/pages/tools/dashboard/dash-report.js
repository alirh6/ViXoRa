// 📰 ViXoRa Weekly Report — گزارش خودکار هفته
// src/pages/tools/dashboard/dash-report.js
import { esc, faDigits, fmtCompact } from './dash-state.js';
import { dashDual, dashDonut, dashVBars, dashSpark } from './dash-charts.js';

export function buildReport(data) {
  const since = Date.now() - 7 * 864e5;
  const txs = (data.finance.bundle?.txs || []).filter((t) => (Date.parse(t.date || t.createdAt || 0) || 0) >= since);
  const inc = txs.filter((t) => t.type === 'income').reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const exp = txs.filter((t) => t.type === 'expense').reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const notes = (data.notes.all || []).filter((n) => (Date.parse(n.updatedAt || n.createdAt || 0) || 0) >= since);
  const customers = (data.customers.all || []).filter((c) => (Date.parse(c.updatedAt || c.createdAt || 0) || 0) >= since);
  let sessions = [];
  try { sessions = JSON.parse(localStorage.getItem('ViXoRa:music-sessions') || '[]').filter((s) => s.startedAt >= since); } catch { /* ignore */ }
  const listenMin = Math.round(sessions.reduce((a, s) => a + (s.seconds || 0), 0) / 60);
  const listenPlays = sessions.reduce((a, s) => a + (s.plays || 0), 0);
  let habits = [];
  try { habits = JSON.parse(localStorage.getItem('ViXoRa:dash-habits') || '[]'); } catch { /* ignore */ }
  const habitDone = habits.reduce((a, h) => a + (h.log || []).filter((d) => Date.parse(d) >= since).length, 0);
  let journalDays = 0;
  try {
    const j = JSON.parse(localStorage.getItem('vixora:journal') || '{}');
    journalDays = Object.keys(j).filter((k) => new Date(k + 'T12:00:00').getTime() >= since).length;
  } catch { /* ignore */ }
  let focusMin = 0;
  try {
    focusMin = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').filter((x) => x.ts >= since).reduce((a, x) => a + (x.min || 25), 0);
  } catch { /* ignore */ }
  const spentDays = new Set(txs.filter((t) => t.type === 'expense').map((t) => new Date(Date.parse(t.date || t.createdAt || 0) || 0).toDateString()));
  let noSpend = 0;
  for (let i = 0; i < 7; i++) { if (!spentDays.has(new Date(Date.now() - i * 864e5).toDateString())) noSpend++; }
  const bestDay = days.length ? days.reduce((a, b) => ((b.inc - b.exp) > (a.inc - a.exp) ? b : a), days[0]) : null;
  const prevTxs = (data.finance.bundle?.txs || []).filter((t) => {
    const at = Date.parse(t.date || t.createdAt || 0) || 0;
    return at >= since - 7 * 864e5 && at < since;
  });
  const prevExp = prevTxs.filter((t) => t.type === 'expense').reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const expDelta = prevExp ? Math.round((exp - prevExp) / prevExp * 100) : 0;
  const habitTotal = habits.length * 7;
  // روزهای هفته مالی
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
    const d1 = d0.getTime() + 864e5;
    let e = 0, im = 0;
    for (const t of data.finance.bundle?.txs || []) {
      const at = Date.parse(t.date || t.createdAt || 0) || 0;
      if (at < d0.getTime() || at >= d1) continue;
      if (t.type === 'expense') e += Number(t.amount) || 0;
      else if (t.type === 'income') im += Number(t.amount) || 0;
    }
    days.push({ label: d0.toLocaleDateString('fa-IR', { weekday: 'short' }), exp: e, inc: im });
  }
  // امتیاز هفته
  let score = 50;
  if (inc >= exp && exp > 0) score += 15;
  if (notes.length >= 3) score += 8;
  if (listenMin >= 60) score += 7;
  if (habitTotal && habitDone / habitTotal >= 0.7) score += 12;
  if (txs.length >= 5) score += 8;
  if (journalDays >= 3) score += 5;
  if (focusMin >= 60) score += 5;
  if (noSpend >= 2) score += 5;
  score = Math.min(100, score);
  const verdict = score >= 85 ? '🌟 هفته فوق‌العاده‌ای بود! همین‌طور ادامه بده.' :
    score >= 70 ? '✅ هفته خوبی بود. کمی بهترش کن!' :
    score >= 55 ? '🙂 هفته متوسطی بود — هفته بعد را بترکون!' : '🌱 هفته آرومی بود. از فردا شروع تازه!';
  // دسته‌های هفته
  const cats = new Map((data.finance.bundle?.categories || []).map((c) => [c.id, c.name || c.title || 'دسته']));
  const byCat = new Map();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    byCat.set(t.categoryId || '', (byCat.get(t.categoryId || '') || 0) + (Number(t.amount) || 0));
  }
  return {
    inc, exp, net: inc - exp, txCount: txs.length,
    journalDays, focusMin, noSpend, bestDay: bestDay ? bestDay.label : '—', expDelta, prevExp,
    notes: notes.length, customers: customers.length,
    listenMin, listenPlays, sessions: sessions.length,
    habits, habitDone, habitTotal,
    days, score, verdict,
    topCat: [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ label: cats.get(k) || 'بدون دسته', value: v })),
  };
}

export function buildMonthly(data) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const txs = data.finance.bundle?.txs || [];
  const sum = (from, to, type) => txs.filter((t) => {
    const at = Date.parse(t.date || t.createdAt || 0) || 0;
    return at >= from && at < to && t.type === type;
  }).reduce((x, t) => x + (Number(t.amount) || 0), 0);
  const cur = { inc: sum(start, Date.now(), 'income'), exp: sum(start, Date.now(), 'expense') };
  const prev = { inc: sum(prevStart, start, 'income'), exp: sum(prevStart, start, 'expense') };
  const days = [];
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    const d0 = new Date(now.getFullYear(), now.getMonth(), d).getTime();
    days.push(sum(d0, d0 + 864e5, 'expense'));
  }
  return { cur, prev, days, monthName: now.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' }) };
}

export function renderReport(data, mode = 'week') {
  if (mode === 'month') return renderMonthly(data);
  if (mode === 'year') return renderYearly(data);
  const r = buildReport(data);
  const from = new Date(Date.now() - 6 * 864e5).toLocaleDateString('fa-IR');
  const to = new Date().toLocaleDateString('fa-IR');
  return `<div class="dash-report" data-dash="report">
    <div class="dash-row no-print"><button class="dash-btn dash-btn-sm dash-btn-primary" data-action="rp-mode" data-v="week">📰 هفتگی</button>
    <button class="dash-btn dash-btn-sm" data-action="rp-mode" data-v="month">📆 ماهانه</button></div>
    <div class="dash-report-head">
      <div><h2>📰 گزارش هفته</h2><span>${from} تا ${to}</span></div>
      <div class="dash-report-score"><b>${faDigits(String(r.score))}</b><span>امتیاز هفته</span></div>
    </div>
    <div class="dash-verdict">${r.verdict}</div>
    <div class="dash-kpis">
      <div class="dash-kpi"><span>💰 دخل هفته</span><b class="pos">+${fmtCompact(r.inc)}</b></div>
      <div class="dash-kpi"><span>💸 خرج هفته</span><b class="neg">−${fmtCompact(r.exp)}</b></div>
      <div class="dash-kpi"><span>⚖️ خالص</span><b class="${r.net >= 0 ? 'pos' : 'neg'}">${fmtCompact(r.net)}</b></div>
      <div class="dash-kpi"><span>🧾 تراکنش‌ها</span><b>${faDigits(String(r.txCount))}</b></div>
      <div class="dash-kpi"><span>📝 یادداشت‌ها</span><b>${faDigits(String(r.notes))}</b></div>
      <div class="dash-kpi"><span>👥 مشتریان</span><b>${faDigits(String(r.customers))}</b></div>
      <div class="dash-kpi"><span>🎧 گوش‌دادن</span><b>${faDigits(String(r.listenMin))} دقیقه</b></div>
      <div class="dash-kpi"><span>🔥 عادت‌ها</span><b>${faDigits(String(r.habitDone))}/${faDigits(String(r.habitTotal))}</b></div>
      <div class="dash-kpi"><span>📓 روزهای ژورنال</span><b>${faDigits(String(r.journalDays))}/۷</b></div>
      <div class="dash-kpi"><span>🍅 تمرکز عمیق</span><b>${faDigits(String(r.focusMin))} دقیقه</b></div>
      <div class="dash-kpi"><span>🚫 روزهای بدون خرج</span><b>${faDigits(String(r.noSpend))}/۷</b></div>
      <div class="dash-kpi"><span>🏅 بهترین روز</span><b>${esc(r.bestDay)}</b></div>
      <div class="dash-kpi"><span>📊 تغییر خرج/هفته قبل</span><b class="${r.expDelta <= 0 ? 'pos' : 'neg'}">${r.expDelta > 0 ? '▲ +' : r.expDelta < 0 ? '▼ ' : ''}${faDigits(String(r.expDelta))}٪</b></div>
    </div>
    <div class="dash-grid-2">
      <div class="dash-panel"><h4>📅 دخل و خرج روزانه</h4><canvas data-report="days" height="170"></canvas></div>
      <div class="dash-panel"><h4>🍩 خرج هفته به تفکیک دسته</h4><canvas data-report="cats" height="170"></canvas></div>
    </div>
    <div class="dash-panel"><h4>🏆 نکات برجسته</h4><ul class="dash-tips">${highlights(r).map((h) => `<li>${h}</li>`).join('')}</ul></div>
    <div class="dash-panel no-print"><h4>📤 اشتراک و چاپ</h4><div class="dash-row">
      <button class="dash-btn" data-action="rp-print">🖨 چاپ / PDF</button>
      <button class="dash-btn" data-action="rp-copy">📋 کپی متن گزارش</button>
      <button class="dash-btn" data-action="rp-save">💾 ذخیره در یادداشت‌ها</button>
      <button class="dash-btn" data-action="rp-html">📥 دانلود HTML</button>
    </div></div>
    <script type="dash-data" data-report="json">${JSON.stringify(r).replace(/</g, '\\u003c')}</script>
  </div>`;
}

function highlights(r) {
  const out = [];
  if (r.net >= 0) out.push(`این هفته <b>${fmtCompact(r.net)} تومان</b> جلو هستی — آفرین! 🎉`);
  else out.push(`این هفته <b>${fmtCompact(-r.net)} تومان</b> عقب هستی — هفته بعد جبران کن. 💪`);
  if (r.topCat.length) out.push(`پرخرج‌ترین دسته: <b>${esc(r.topCat[0].label)}</b> با ${fmtCompact(r.topCat[0].value)} تومان.`);
  if (r.listenMin >= 30) out.push(`<b>${faDigits(String(r.listenMin))} دقیقه</b> موزیک گوش دادی — روحت شاد! 🎧`);
  if (r.notes >= 3) out.push(`<b>${faDigits(String(r.notes))} یادداشت</b> ثبت کردی — ذهن مرتب! 📝`);
  if (r.habitTotal && r.habitDone / r.habitTotal >= 0.7) out.push(`انجام عادت‌ها <b>${faDigits(String(Math.round((r.habitDone / r.habitTotal) * 100)))}٪</b> — استریک را نگه دار! 🔥`);
  if (r.sessions) out.push(`<b>${faDigits(String(r.sessions))} نشست شنیداری</b> داشتی.`);
  if (r.journalDays >= 5) out.push(`<b>${faDigits(String(r.journalDays))} روز ژورنال</b> نوشتی — ذهن شفاف! 📓`);
  if (r.focusMin >= 120) out.push(`<b>${faDigits(String(r.focusMin))} دقیقه تمرکز عمیق</b> — مغزت دارد عضله می‌سازد! 🧠`);
  if (r.noSpend >= 3) out.push(`<b>${faDigits(String(r.noSpend))} روز بدون خرج</b> — کیف‌پولت ممنون است! 🚫`);
  if (r.bestDay && r.bestDay !== '—') out.push(`بهترین روز هفته: <b>${esc(r.bestDay)}</b> 🏅`);
  if (!out.length) out.push('هفته آرومی بود — داده بیشتری ثبت کن تا گزارش غنی‌تر شود. 🌱');
  return out;
}

export function renderMonthly(data) {
  const m = buildMonthly(data);
  const dInc = m.prev.inc ? ((m.cur.inc - m.prev.inc) / m.prev.inc) * 100 : 0;
  const dExp = m.prev.exp ? ((m.cur.exp - m.prev.exp) / m.prev.exp) * 100 : 0;
  const avgDaily = m.cur.exp / Math.max(1, new Date().getDate());
  const proj = avgDaily * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  return `<div class="dash-report" data-dash="report">
    <div class="dash-row no-print"><button class="dash-btn dash-btn-sm" data-action="rp-mode" data-v="week">📰 هفتگی</button>
    <button class="dash-btn dash-btn-sm dash-btn-primary" data-action="rp-mode" data-v="month">📆 ماهانه</button></div>
    <div class="dash-report-head"><div><h2>📆 گزارش ماه ${esc(m.monthName)}</h2></div></div>
    <div class="dash-kpis">
      <div class="dash-kpi"><span>💰 دخل این ماه</span><b class="pos">+${fmtCompact(m.cur.inc)}</b><span>${dInc >= 0 ? '📈 +' : '📉 '}${faDigits(dInc.toFixed(0))}٪ نسبت به قبل</span></div>
      <div class="dash-kpi"><span>💸 خرج این ماه</span><b class="neg">−${fmtCompact(m.cur.exp)}</b><span>${dExp >= 0 ? '📈 +' : '📉 '}${faDigits(dExp.toFixed(0))}٪ نسبت به قبل</span></div>
      <div class="dash-kpi"><span>📊 میانگین خرج روزانه</span><b>${fmtCompact(avgDaily)}</b></div>
      <div class="dash-kpi"><span>🔮 پیش‌بینی پایان ماه</span><b>${fmtCompact(proj)}</b></div>
    </div>
    <div class="dash-grid-2">
      <div class="dash-panel"><h4>📊 خرج روزانه ماه</h4><canvas data-report="mdays" height="170"></canvas></div>
      <div class="dash-panel"><h4>⚖️ مقایسه با ماه قبل</h4><canvas data-report="mcomp" height="170"></canvas></div>
    </div>
    <div class="dash-panel"><h4>💡 تحلیل ماه</h4><ul class="dash-tips">${monthlyTips(m).map((h) => `<li>${h}</li>`).join('')}</ul></div>
    <div class="dash-panel no-print"><div class="dash-row">
      <button class="dash-btn" data-action="rp-print">🖨 چاپ</button>
      <button class="dash-btn" data-action="rp-copy-month">📋 کپی متن</button>
    </div></div>
    <script type="dash-data" data-report="mjson">${JSON.stringify(m).replace(/</g, '\\u003c')}</script>
  </div>`;
}


export function buildYearly(data) {
  const y = new Date().getFullYear();
  const txs = data.finance.bundle?.txs || [];
  const months = [];
  for (let mm = 0; mm < 12; mm++) {
    const from = new Date(y, mm, 1).getTime();
    const to = new Date(y, mm + 1, 1).getTime();
    let inc = 0, exp = 0;
    for (const t of txs) {
      const at = Date.parse(t.date || t.createdAt || 0) || 0;
      if (at < from || at >= to) continue;
      if (t.type === 'income') inc += Number(t.amount) || 0;
      else if (t.type === 'expense') exp += Number(t.amount) || 0;
    }
    months.push({ label: new Date(y, mm, 1).toLocaleDateString('fa-IR', { month: 'short' }), inc, exp, future: to > Date.now() && from > Date.now() });
  }
  const past = months.filter((m) => !m.future);
  const tInc = past.reduce((a, m) => a + m.inc, 0);
  const tExp = past.reduce((a, m) => a + m.exp, 0);
  const best = past.length ? past.reduce((a, b) => (b.inc - b.exp) > (a.inc - a.exp) ? b : a, past[0]) : null;
  const worst = past.length ? past.reduce((a, b) => (b.exp - b.inc) > (a.exp - a.inc) ? b : a, past[0]) : null;
  return { months, tInc, tExp, net: tInc - tExp, avgExp: past.length ? tExp / past.length : 0, saveRate: tInc ? Math.round((tInc - tExp) / tInc * 100) : 0, best: best?.label || '—', worst: worst?.label || '—', year: y };
}

export function renderYearly(data) {
  const m = buildYearly(data);
  return `<div class="dash-report" data-dash="report">
    <div class="dash-row no-print"><button class="dash-btn dash-btn-sm" data-action="rp-mode" data-v="week">📰 هفتگی</button>
    <button class="dash-btn dash-btn-sm" data-action="rp-mode" data-v="month">📆 ماهانه</button>
    <button class="dash-btn dash-btn-sm dash-btn-primary" data-action="rp-mode" data-v="year">🗓 سالانه</button></div>
    <div class="dash-report-head"><div><h2>🗓 کارنامه سال ${faDigits(String(m.year))}</h2><span>از فروردین تا امروز</span></div>
    <div class="dash-report-score"><b>${faDigits(String(m.saveRate))}٪</b><span>نرخ پس‌انداز</span></div></div>
    <div class="dash-kpis">
      <div class="dash-kpi"><span>💰 دخل سال</span><b class="pos">+${fmtCompact(m.tInc)}</b></div>
      <div class="dash-kpi"><span>💸 خرج سال</span><b class="neg">−${fmtCompact(m.tExp)}</b></div>
      <div class="dash-kpi"><span>⚖️ خالص سال</span><b class="${m.net >= 0 ? 'pos' : 'neg'}">${fmtCompact(m.net)}</b></div>
      <div class="dash-kpi"><span>📊 میانگین خرج ماه</span><b>${fmtCompact(m.avgExp)}</b></div>
      <div class="dash-kpi"><span>🏅 بهترین ماه</span><b>${esc(m.best)}</b></div>
      <div class="dash-kpi"><span>📉 پرخرج‌ترین ماه</span><b>${esc(m.worst)}</b></div>
    </div>
    <div class="dash-grid-2">
      <div class="dash-panel"><h4>📊 دخل و خرج ماه‌ها</h4><canvas data-report="ybars" height="180"></canvas></div>
      <div class="dash-panel"><h4>📈 خالص تجمیعی</h4><canvas data-report="ynet" height="180"></canvas></div>
    </div>
    <div class="dash-panel"><h4>💡 تحلیل سال</h4><ul class="dash-tips">${yearlyTips(m).map((h) => `<li>${h}</li>`).join('')}</ul></div>
    <div class="dash-panel no-print"><div class="dash-row">
      <button class="dash-btn" data-action="rp-print">🖨 چاپ</button>
      <button class="dash-btn" data-action="rp-copy-year">📋 کپی متن</button>
    </div></div>
    <script type="dash-data" data-report="yjson">${JSON.stringify(m).replace(/</g, '\\u003c')}</script>
  </div>`;
}

function yearlyTips(m) {
  const out = [];
  if (m.saveRate >= 20) out.push(`🎉 نرخ پس‌انداز <b>${faDigits(String(m.saveRate))}٪</b> — در سطح عالی هستی!`);
  else if (m.saveRate >= 0) out.push(`نرخ پس‌انداز <b>${faDigits(String(m.saveRate))}٪</b> است؛ هدف: بالای ۲۰٪. 🎯`);
  else out.push('🚨 امسال بیشتر از دخلت خرج کردی! بودجه‌بندی را جدی بگیر.');
  if (m.best !== '—') out.push(`بهترین ماهت <b>${esc(m.best)}</b> بود — رازش را پیدا و تکرار کن! 🏅`);
  if (m.worst !== '—' && m.worst !== m.best) out.push(`پرخرج‌ترین ماه: <b>${esc(m.worst)}</b> — چه اتفاقی افتاد؟ 📝`);
  const proj = m.avgExp * 12;
  out.push(`اگر با همین روند پیش بروی، خرج سال ≈ <b>${fmtCompact(proj)}</b> تومان می‌شود. 🔮`);
  return out;
}

function drawYearBars(canvas, m) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300, h = 180;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const max = Math.max(...m.months.map((x) => Math.max(x.inc, x.exp)), 1);
  const n = 12, slot = (w - 16) / n, bw = Math.max(3, slot / 2 - 3), base = h - 24;
  m.months.forEach((mm, i) => {
    const x0 = w - 8 - (i + 1) * slot;
    [[mm.inc, '#34d399', 0], [mm.exp, '#f43f5e', 1]].forEach(([v, col, bi]) => {
      const bh = Math.max(v > 0 ? 3 : 1, (v / max) * (base - 16));
      c.globalAlpha = mm.future ? 0.25 : 1;
      c.fillStyle = col;
      c.beginPath(); c.roundRect(x0 + bi * (bw + 2) + 1, base - bh, bw, bh, 2); c.fill();
    });
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '9px Tahoma'; c.textAlign = 'center';
    c.fillText(mm.label, x0 + slot / 2, h - 8);
  });
}

function drawYearNet(canvas, m) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300, h = 180;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  let acc = 0;
  const pts = m.months.filter((x) => !x.future).map((x) => (acc += x.inc - x.exp));
  if (!pts.length) {
    c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '13px Tahoma'; c.textAlign = 'center';
    c.fillText('داده‌ای نیست', w / 2, 90);
    return;
  }
  const max = Math.max(...pts, 0), min = Math.min(...pts, 0), rg = Math.max(1, max - min);
  const X = (i) => 14 + (i / Math.max(1, pts.length - 1)) * (w - 28);
  const Y = (v) => 14 + (1 - (v - min) / rg) * (h - 40);
  const zy = Y(0);
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.setLineDash([4, 4]);
  c.beginPath(); c.moveTo(8, zy); c.lineTo(w - 8, zy); c.stroke(); c.setLineDash([]);
  const pos = pts[pts.length - 1] >= 0;
  const g = c.createLinearGradient(0, 14, 0, h - 16);
  g.addColorStop(0, pos ? '#34d39988' : '#f43f5e88'); g.addColorStop(1, 'transparent');
  c.beginPath(); c.moveTo(X(0), zy);
  pts.forEach((v, i) => c.lineTo(X(i), Y(v)));
  c.lineTo(X(pts.length - 1), zy); c.closePath(); c.fillStyle = g; c.fill();
  c.beginPath(); pts.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))));
  c.strokeStyle = pos ? '#34d399' : '#f43f5e'; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
  pts.forEach((v, i) => { c.beginPath(); c.arc(X(i), Y(v), 3, 0, 7); c.fillStyle = pos ? '#34d399' : '#f43f5e'; c.fill(); });
}

function monthlyTips(m) {
  const out = [];
  if (m.cur.exp > m.prev.exp * 1.2 && m.prev.exp > 0) out.push('⚠️ خرجت بیش از ۲۰٪ از ماه قبل بیشتر شده — دسته‌ها را بررسی کن.');
  else if (m.cur.exp < m.prev.exp * 0.85 && m.prev.exp > 0) out.push('🎉 خرجت کمتر از ماه قبل شده — آفرین!');
  if (m.cur.inc < m.cur.exp) out.push('🚨 دخل از خرج کمتر است! برای آخر ماه برنامه داشته باش.');
  else out.push(`💎 مازاد این ماه: ${fmtCompact(m.cur.inc - m.cur.exp)} تومان.`);
  const peak = Math.max(...m.days);
  if (peak > 0) out.push(`📅 پرخرج‌ترین روز: روز ${faDigits(String(m.days.indexOf(peak) + 1))} با ${fmtCompact(peak)} تومان.`);
  return out;
}

export function afterReportRender(root) {
  const yj = root.querySelector('[data-report="yjson"]');
  if (yj) {
    try {
      const m = JSON.parse(yj.textContent || '{}');
      const yb = root.querySelector('[data-report="ybars"]');
      if (yb && m.months) drawYearBars(yb, m);
      const yn = root.querySelector('[data-report="ynet"]');
      if (yn && m.months) drawYearNet(yn, m);
    } catch { /* ignore */ }
    return;
  }
  const j = root.querySelector('[data-report="json"]');
  if (!j) return;
  let r = null;
  try { r = JSON.parse(j.textContent || '{}'); } catch { return; }
  const days = root.querySelector('[data-report="days"]');
  if (days && r.days) dashDual(days, r.days.map((d) => d.inc), r.days.map((d) => d.exp), { h: 170, labels: ['دخل', 'خرج'], colors: ['#34d399', '#f43f5e'] });
  const mj = root.querySelector('[data-report="mjson"]');
  if (mj) {
    let m = null;
    try { m = JSON.parse(mj.textContent || '{}'); } catch { return; }
    const md = root.querySelector('[data-report="mdays"]');
    if (md && m.days) {
      drawMiniBars(md, m.days);
    }
    const mc = root.querySelector('[data-report="mcomp"]');
    if (mc && m.cur && m.prev) drawMiniCompare(mc, m);
  }
  const cats = root.querySelector('[data-report="cats"]');
  if (cats) {
    if (r.topCat?.length) dashDonut(cats, r.topCat, { h: 170 });
    else {
      const c = cats.getContext('2d');
      const w = cats.clientWidth || 300;
      cats.width = w; cats.height = 170;
      c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '13px Tahoma'; c.textAlign = 'center';
      c.fillText('خرجی ثبت نشده', w / 2, 85);
    }
  }
  void dashVBars; void dashSpark;
}

export function reportText(data) {
  const r = buildReport(data);
  return [
    '📰 گزارش هفته ViXoRa',
    `${new Date(Date.now() - 6 * 864e5).toLocaleDateString('fa-IR')} تا ${new Date().toLocaleDateString('fa-IR')}`,
    `⭐ امتیاز: ${r.score} از ۱۰۰`,
    '',
    `💰 دخل: ${r.inc.toLocaleString('en-US')} تومان`,
    `💸 خرج: ${r.exp.toLocaleString('en-US')} تومان`,
    `⚖️ خالص: ${r.net.toLocaleString('en-US')} تومان`,
    `📝 یادداشت: ${r.notes} • 👥 مشتری: ${r.customers}`,
    `🎧 گوش‌دادن: ${r.listenMin} دقیقه (${r.listenPlays} پخش)`,
    `🔥 عادت‌ها: ${r.habitDone} از ${r.habitTotal}`,
    '',
    r.verdict.replace(/<[^>]+>/g, ''),
  ].join('\n');
}

function drawMiniBars(canvas, values) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300, h = 170;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const max = Math.max(...values, 1);
  const n = values.length;
  const bw = Math.max(2, (w - 16) / n - 2);
  const base = h - 14;
  values.forEach((v, i) => {
    const bh = Math.max(2, (v / max) * (base - 20));
    const x = w - 8 - (i + 1) * ((w - 16) / n) + ((w - 16) / n - bw) / 2;
    const g = c.createLinearGradient(0, base - bh, 0, base);
    g.addColorStop(0, '#f43f5e'); g.addColorStop(1, '#f43f5e44');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(x, base - bh, bw, bh, 2); c.fill();
  });
}

function drawMiniCompare(canvas, m) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300, h = 170;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const max = Math.max(m.cur.inc, m.cur.exp, m.prev.inc, m.prev.exp, 1);
  const groups = [[m.prev.inc, m.prev.exp, 'ماه قبل'], [m.cur.inc, m.cur.exp, 'این ماه']];
  groups.forEach(([inc, exp, label], gi) => {
    const gx = 14 + gi * ((w - 28) / 2);
    const gw = (w - 28) / 2 - 8;
    [[inc, '#34d399'], [exp, '#f43f5e']].forEach(([v, col], bi) => {
      const bw = gw / 2 - 4;
      const bh = Math.max(4, (v / max) * (h - 60));
      c.fillStyle = col;
      c.beginPath(); c.roundRect(gx + bi * (gw / 2), h - 30 - bh, bw, bh, 4); c.fill();
    });
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '11px Tahoma'; c.textAlign = 'center';
    c.fillText(label, gx + gw / 2, h - 12);
  });
  c.font = '10px Tahoma'; c.textAlign = 'right';
  c.fillStyle = '#34d399'; c.fillText('■ دخل', w - 10, 14);
  c.fillStyle = '#f43f5e'; c.fillText('■ خرج', w - 10, 29);
}

export async function handleReportAction(action, el, api) {
  if (action === 'rp-mode') {
    api.st.reportMode = el?.dataset?.v || 'week';
    api.rerender();
    return true;
  }
  if (action === 'rp-copy-month') {
    const m = buildMonthly(api.data);
    const txt = `📆 گزارش ماه ${m.monthName}\n💰 دخل: ${Math.round(m.cur.inc).toLocaleString('en-US')}\n💸 خرج: ${Math.round(m.cur.exp).toLocaleString('en-US')}`;
    try { await navigator.clipboard.writeText(txt); api.toast('📋 کپی شد.'); } catch { api.toast('ناموفق بود.'); }
    return true;
  }
  if (action === 'rp-copy-year') {
    const m = buildYearly(api.data);
    const txt = `🗓 کارنامه سال ${m.year}\n💰 دخل: ${Math.round(m.tInc).toLocaleString('en-US')}\n💸 خرج: ${Math.round(m.tExp).toLocaleString('en-US')}\n⚖️ خالص: ${Math.round(m.net).toLocaleString('en-US')}\n🏦 نرخ پس‌انداز: ${m.saveRate}٪`;
    try { await navigator.clipboard.writeText(txt); api.toast('📋 کپی شد.'); } catch { api.toast('ناموفق بود.'); }
    return true;
  }
  if (action === 'rp-html') {
      const { download } = await import('./dash-export.js');
      const node = api.root.querySelector('[data-dash="report"]');
      download(`vixora-report-${new Date().toISOString().slice(0, 10)}.html`, `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>گزارش ViXoRa</title></head><body style="font-family:Tahoma;max-width:800px;margin:auto">${node ? node.innerHTML : ''}</body></html>`, 'text/html;charset=utf-8');
      api.toast('✅ گزارش دانلود شد.');
      return true;
    }
  if (action === 'rp-print') { window.print(); return true; }
  if (action === 'rp-copy') {
    try { await navigator.clipboard.writeText(reportText(api.data)); api.toast('📋 گزارش کپی شد.'); }
    catch { api.toast('کپی ناموفق بود.'); }
    return true;
  }
  if (action === 'rp-save') {
    try {
      const { createToolItem } = await import('../../../core/actions/tools-service.js');
      await createToolItem('notes', { title: `📰 گزارش هفته ${new Date().toLocaleDateString('fa-IR')}`, body: reportText(api.data), createdAt: new Date().toISOString() });
      api.toast('💾 گزارش در یادداشت‌ها ذخیره شد.');
    } catch { api.toast('❌ ذخیره ناموفق بود.'); }
    return true;
  }
  return false;
}
