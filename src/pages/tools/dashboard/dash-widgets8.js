// 🧩 ViXoRa Widgets 8 — سری هشتم: بینش، جستجوی پیشرفته، حال‌وهوا
// src/pages/tools/dashboard/dash-widgets8.js
import { esc, load } from './dash-state.js';
import { svgBars, svgDonut, svgSpark } from './dash-charts.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dk = (ts) => new Date(ts).toDateString();

export const WIDGETS_META_8 = {
  'insight-mini': { title: 'بینش امروز', icon: '💡', desc: 'هوشمندترین نکته روز', w: 1 },
  'search-adv': { title: 'جستجوی پیشرفته', icon: '🔎', desc: 'فیلتر + تاریخچه', w: 1 },
  'mood-week': { title: 'حال هفته', icon: '😊', desc: 'نمودار ۷ روز', w: 1 },
  'energy-avg': { title: 'انرژی متوسط', icon: '⚡', desc: 'ژورنال ۷ روز', w: 1 },
  'grateful-all': { title: 'شکرگزاری‌ها', icon: '🙏', desc: 'آخرین‌ها', w: 1 },
  'wins-all': { title: 'بردها', icon: '🏆', desc: 'دیوار افتخار', w: 1 },
  'journal-cal': { title: 'تقویم ژورنال', icon: '🗓', desc: '۳۰ روز حال', w: 1 },
  'tx-heat': { title: 'نقشه تراکنش', icon: '🗺', desc: 'هیت‌مپ ۵ هفته', w: 1 },
  'weekday-spend': { title: 'خرج روزهای هفته', icon: '📊', desc: 'کدام روز؟', w: 1 },
  'hour-play': { title: 'ساعت شنیداری', icon: '🕰', desc: 'چه ساعتی گوش می‌دهی؟', w: 1 },
  'bill-paid-rate': { title: 'نظم قبوض', icon: '✅', desc: 'درصد به‌موقع', w: 1 },
  'networth-trend': { title: 'روند خالص', icon: '📈', desc: '۶ ماه اخیر', w: 1 },
};

export function renderWidgets8(id) {
  const now = Date.now();
  switch (id) {
    case 'insight-mini':
      return `<p class="dash-fact" data-insight>💡 در حال تحلیل…</p>
        <button class="dash-btn xs" data-action="view" data-v="insights">🧠 همه بینش‌ها</button>`;
    case 'search-adv':
      return `<input class="dash-input" data-adv-q placeholder="جستجو + Enter…" style="margin:0">
        <div class="dash-row wrap" style="margin-top:6px">${['همه', '🎵', '💰', '📝', '👥'].map((f, i) => `<button class="dash-btn xs ${i === 0 ? 'dash-btn-primary' : ''}" data-action="w8-filter" data-v="${i}">${f}</button>`).join('')}</div>
        <div data-adv-res style="margin-top:6px"><small class="dash-hint">تایپ کن و Enter بزن.</small></div>`;
    case 'mood-week': {
      const moods = load('vixora:mood', []);
      const vals = [];
      for (let i = 6; i >= 0; i--) {
        const d = dk(now - i * 86400000);
        const m = moods.find((x) => dk(x.ts) === d);
        vals.push(m ? (+m.v || +m.mood || 3) : 0);
      }
      return vals.some(Boolean) ? `${svgSpark(vals, 140, 40)}<small>حال ۷ روز اخیر</small>` : '<div class="dash-empty">حالی ثبت نشده. از ویجت 😊 شروع کن!</div>';
    }
    case 'energy-avg': {
      const j = load('vixora:journal', {});
      const vals = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        vals.push(+(j[k]?.energy || 0));
      }
      const avg = vals.some(Boolean) ? (vals.reduce((a, b) => a + b, 0) / vals.filter(Boolean).length).toFixed(1) : '—';
      return `<div class="dash-big">⚡ ${avg}<small>/۵</small></div>${vals.some(Boolean) ? svgSpark(vals, 140, 32) : '<small>در ژورنال انرژی ثبت کن!</small>'}`;
    }
    case 'grateful-all': {
      const j = load('vixora:journal', {});
      const all = Object.entries(j).sort().reverse().flatMap(([, e]) => e.g || []).filter(Boolean).slice(0, 4);
      return all.length ? all.map((g) => `<div class="dash-kv"><span>🙏 ${esc(g.slice(0, 50))}</span></div>`).join('') : '<div class="dash-empty">هنوز شکرگزاری ننوشتی.</div>';
    }
    case 'wins-all': {
      const j = load('vixora:journal', {});
      const wins = Object.entries(j).sort().reverse().map(([, e]) => e.win).filter(Boolean).slice(0, 3);
      return wins.length ? wins.map((w) => `<div class="dash-kv"><span>🏆 ${esc(String(w).slice(0, 60))}</span></div>`).join('') : '<div class="dash-empty">بردی ثبت نشده. امروز یک برد بساز!</div>';
    }
    case 'journal-cal': {
      const j = load('vixora:journal', {});
      let cells = '';
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const e = j[k];
        cells += `<i class="${e ? 'on m' + (e.mood || 3) : ''}" title="${d.toLocaleDateString('fa-IR')}"></i>`;
      }
      return `<div class="dash-hb-map" style="grid-template-columns:repeat(10,1fr)">${cells}</div><small>${fa(Object.keys(j).length)} روز ژورنال کل</small>`;
    }
    case 'tx-heat': {
      const txs = load('vixora:txs', []);
      let cells = '';
      for (let i = 34; i >= 0; i--) {
        const d = dk(now - i * 86400000);
        const n = txs.filter((t) => dk(t.date || t.ts || 0) === d).length;
        cells += `<i class="${n ? 'on' : ''}" style="${n > 3 ? 'opacity:1' : n ? `opacity:${0.35 + n * 0.2}` : ''}" title="${new Date(now - i * 86400000).toLocaleDateString('fa-IR')}: ${n}"></i>`;
      }
      return `<div class="dash-hb-map">${cells}</div><small>${fa(txs.length)} تراکنش کل</small>`;
    }
    case 'weekday-spend': {
      const WD = ['شنبه', '۱شنبه', '۲شنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه'];
      const sums = [0, 0, 0, 0, 0, 0, 0];
      load('vixora:txs', []).forEach((t) => {
        if (t.type === 'income') return;
        sums[(new Date(t.date || t.ts || 0).getDay() + 1) % 7] += +t.amount || 0;
      });
      return sums.some(Boolean) ? svgBars(WD.map((w, i) => [w, sums[i]])) : '<div class="dash-empty">تراکنشی نیست.</div>';
    }
    case 'hour-play': {
      const hours = new Array(24).fill(0);
      try {
        JSON.parse(localStorage.getItem('ViXoRa:music-sessions') || '[]').forEach((s) => { hours[new Date(s.startedAt).getHours()] += (s.seconds || 0); });
      } catch {}
      const peak = hours.indexOf(Math.max(...hours));
      return hours.some(Boolean) ? `<div class="dash-big">🕰 ${fa(peak)}<small>:۰۰ اوج شنیداری</small></div>${svgSpark(hours.filter((_, i) => i % 2 === 0), 140, 32)}` : '<div class="dash-empty">نشست شنیداری ثبت نشده.</div>';
    }
    case 'bill-paid-rate': {
      const bills = load('vixora:bills', []);
      const paid = bills.filter((b) => b.paid).length;
      const r = bills.length ? Math.round(paid / bills.length * 100) : 0;
      return `<div class="dash-big">${fa(r)}٪</div><div class="dash-bar"><i style="width:${r}%"></i></div><small>${fa(paid)} از ${fa(bills.length)} قبض پرداخت شده</small>`;
    }
    case 'networth-trend': {
      const txs = load('vixora:txs', []);
      const pts = [];
      let acc = 0;
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const m = txs.filter((t) => { const x = new Date(t.date || t.ts || 0); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); });
        acc += m.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0) - m.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
        pts.push(Math.max(0, acc));
      }
      return pts.some(Boolean) ? `${svgSpark(pts, 140, 44)}<small>خالص تجمیعی ۶ ماه</small><div class="dash-big ${acc >= 0 ? 'pos' : 'neg'}">${fa(acc)}</div>` : '<div class="dash-empty">داده مالی نیست.</div>';
    }
    default: return '';
  }
}

export function afterWidgets8Render(root) {
  // بینش امروز: ساده و سریع
  root.querySelectorAll('[data-insight]').forEach(async (box) => {
    try {
      const I = await import('./dash-insights.js');
      const list = I.buildInsights() || [];
      box.textContent = list[0] ? `${list[0].icon} ${list[0].title}` : '💡 داده کافی برای بینش نیست — ثبت را شروع کن!';
    } catch { box.textContent = '💡 —'; }
  });
}

export async function handleWidgets8Action(action, el, api) {
  if (action === 'w8-filter') {
    const scope = el.closest('section') || api.root;
    scope.querySelectorAll('[data-action="w8-filter"]').forEach((b) => b.classList.toggle('dash-btn-primary', b === el));
    api.st.advFilter = +(el.dataset?.v || 0);
    return true;
  }
  if (action === 'w8-hist') {
    const scope = el.closest('section') || api.root;
    const inp = scope.querySelector('[data-adv-q]');
    if (inp) { inp.value = el.dataset?.v || ''; runAdvSearch(inp, api); }
    return true;
  }
  if (action === 'w8-search') return true;
  return false;
}

/** اجرای جستجوی پیشرفته (Enter) */
export async function runAdvSearch(input, api) {
  const q = input.value.trim();
  const scope = input.closest('section') || api.root;
  const box = scope.querySelector('[data-adv-res]');
  if (!box) return;
  if (q.length < 2) { box.innerHTML = '<small class="dash-hint">حداقل ۲ حرف!</small>'; return; }
  const f = api.st.advFilter || 0;
  const out = [];
  const ql = q.toLowerCase();
  if (f === 0 || f === 1) load('vixora:music-lib', load('vixora:songs', [])).filter((s) => `${s.title || ''} ${s.artist || ''}`.toLowerCase().includes(ql)).slice(0, 4).forEach((s) => out.push(`<div class="dash-kv"><span>🎵 ${esc(s.title || '')} <small>${esc(s.artist || '')}</small></span></div>`));
  if (f === 0 || f === 2) load('vixora:txs', []).filter((t) => `${t.note || t.desc || ''} ${t.cat || ''}`.toLowerCase().includes(ql)).slice(0, 4).forEach((t) => out.push(`<div class="dash-kv"><span>💰 ${esc(t.note || t.desc || t.cat || '')}</span><b>${fa(t.amount)}</b></div>`));
  if (f === 0 || f === 3) load('vixora:notes', []).filter((n) => (n.text || '').toLowerCase().includes(ql)).slice(0, 4).forEach((n) => out.push(`<div class="dash-kv"><span>📝 ${esc((n.text || '').slice(0, 50))}</span></div>`));
  if (f === 0 || f === 4) load('vixora:customers', []).filter((c) => `${c.name || ''} ${c.phone || ''}`.includes(q)).slice(0, 4).forEach((c) => out.push(`<div class="dash-kv"><span>👥 ${esc(c.name || '')}</span><b>${esc(c.phone || '')}</b></div>`));
  box.innerHTML = out.length ? out.join('') : '<div class="dash-empty">چیزی پیدا نشد.</div>';
  try {
    const h = JSON.parse(localStorage.getItem('vixora:adv-hist') || '[]');
    h.unshift({ q, ts: Date.now() });
    localStorage.setItem('vixora:adv-hist', JSON.stringify(h.slice(0, 20)));
  } catch {}
}
