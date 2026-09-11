// 🧩 ViXoRa Widgets 12 — سری دوازدهم (پایانی): متا، فان، حکمت
// src/pages/tools/dashboard/dash-widgets12.js
import { esc } from './dash-state.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');

export const WIDGETS_META_12 = {
  'cmdk-hist': { title: 'تاریخچه فرمان‌یاب', icon: '📜', desc: 'دستورهای اخیر', w: 1 },
  'palette-day': { title: 'پالت تم', icon: '🎨', desc: 'رنگ‌های فعلی', w: 1 },
  'budget-5020': { title: 'قانون ۵۰/۳۰/۲۰', icon: '📐', desc: 'بودجه ماه', w: 1 },
  'sleep-score': { title: 'نمره خواب', icon: '💤', desc: 'کیفیت هفته', w: 1 },
  'letter-self': { title: 'نامه به فردا', icon: '💌', desc: 'خودِ فردا می‌خواند', w: 1 },
  'd20': { title: 'تاس سرنوشت', icon: '🎲', desc: 'D20 تصمیم', w: 1 },
  'week-life': { title: 'عمر هفته', icon: '⏳', desc: 'هفته چقدر رفت؟', w: 1 },
  'moon': { title: 'فاز ماه', icon: '🌙', desc: 'ماه امشب', w: 1 },
  'dash-stats': { title: 'آمار کاکپیت', icon: '📊', desc: 'استفاده تو', w: 1 },
  'thanks': { title: 'تشکر', icon: '💜', desc: 'پایان خوش', w: 1 },
  'quote-lib': { title: 'کتابخانه نقل‌قول', icon: '💬', desc: '۷۸ جمله + کپی', w: 1 },
};

const MOONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
const MOON_FA = ['ماه نو', 'هلال', 'تربیع اول', 'محدب', 'بدر (کامل!)', 'محدب نزولی', 'تربیع آخر', 'هلال آخر'];

export function renderWidgets12(id) {
  const now = Date.now();
  switch (id) {
    case 'cmdk-hist': {
      let h = [];
      try { h = JSON.parse(localStorage.getItem('vixora:cmdk-hist') || '[]'); } catch {}
      return h.length ? h.slice(0, 5).map((x) => `<div class="dash-kv"><span>⌨️ ${esc(x.t || x.id || '')}</span></div>`).join('') : '<div class="dash-empty">هنوز دستوری اجرا نشده. Ctrl+K!</div>';
    }
    case 'palette-day': {
      const root = document.querySelector('.dash-root');
      const cs = root ? getComputedStyle(root) : null;
      const c1 = cs?.getPropertyValue('--d-c1').trim() || '#8b5cf6';
      const c2 = cs?.getPropertyValue('--d-c2').trim() || '#ec4899';
      return `<div class="dash-row"><span class="dash-dot on" style="background:${c1};width:34px;height:34px"></span><span class="dash-dot on" style="background:${c2};width:34px;height:34px"></span></div>
        <small dir="ltr">${esc(c1)} • ${esc(c2)}</small>
        <div><button class="dash-btn xs" data-action="w12-copy" data-v="${esc(c1 + ' ' + c2)}">📋 کپی کدها</button></div>`;
    }
    case 'budget-5020': {
      return `<div class="dash-kv"><span>🏠 ضروری (۵۰٪)</span><b>اجاره، خوراک، قبض</b></div>
        <div class="dash-kv"><span>🎉 خواسته (۳۰٪)</span><b>تفریح، رستوران</b></div>
        <div class="dash-kv"><span>🏦 آینده (۲۰٪)</span><b>پس‌انداز، بدهی</b></div>
        <small>💡 هر ماه دخلت را همین‌طور تقسیم کن!</small>`;
    }
    case 'sleep-score': {
      const arr = JSON.parse(localStorage.getItem('vixora:sleep') || '[]');
      if (arr.length < 2) return '<div class="dash-empty">حداقل ۲ شب ثبت کن! (ویجت 🛌)</div>';
      const avg = arr.slice(-7).reduce((a, x) => a + (+x.h || 0), 0) / Math.min(7, arr.length);
      const score = Math.max(0, Math.min(100, Math.round(avg / 8 * 100)));
      const e = score >= 90 ? '😴 عالی' : score >= 75 ? '🙂 خوب' : score >= 60 ? '😐 متوسط' : '🥱 کم‌خوابی!';
      return `<div class="dash-big">${fa(score)}<small>/۱۰۰ ${e}</small></div><div class="dash-bar"><i style="width:${score}%"></i></div><small>میانگین: ${avg.toFixed(1)} ساعت</small>`;
    }
    case 'letter-self': {
      const data = JSON.parse(localStorage.getItem('vixora:letter') || 'null');
      const today = new Date().toDateString();
      if (data && data.show !== today) return `<p class="dash-fact">💌 پیام دیروزت: «${esc(data.text)}»</p><button class="dash-btn xs" data-action="w12-letter-new">✍️ نامه جدید</button>`;
      if (data && data.show === today) return `<div class="dash-big">💌</div><small>نامه‌ات فردا نمایش داده می‌شود… صبر کن! ⏳</small>`;
      return `<input class="dash-input" data-letter placeholder="به خودِ فردا چه می‌گویی؟…" style="margin:0"><button class="dash-btn xs" data-action="w12-letter" style="margin-top:6px">💌 ارسال به فردا</button>`;
    }
    case 'd20': {
      return `<div class="dash-big" data-d20>🎲</div><small>برای تصمیم مهم، تاس بنداز: بالای ۱۰ = بله!</small>
        <div><button class="dash-btn dash-btn-primary" data-action="w12-d20">بنداز!</button></div>`;
    }
    case 'week-life': {
      const d = new Date();
      const passed = ((d.getDay() + 1) % 7) + d.getHours() / 24;
      const p = Math.round(passed / 7 * 100);
      return `<div class="dash-big">⏳ ${fa(p)}٪</div><div class="dash-bar"><i style="width:${p}%"></i></div><small>از شنبه تا حالا — بجنب، هفته دارد می‌رود! 🏃</small>`;
    }
    case 'moon': {
      const synodic = 29.53058867;
      const known = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
      const days = now / 86400000 - known;
      const age = ((days % synodic) + synodic) % synodic;
      const idx = Math.floor(age / synodic * 8) % 8;
      return `<div class="dash-big">${MOONS[idx]}</div><small>${MOON_FA[idx]} • روز ${fa(Math.floor(age))} چرخه</small>${idx === 4 ? '<div><small>🌕 امشب ماه کامل است — آرزو کن!</small></div>' : ''}`;
    }
    case 'dash-stats': {
      let v = 0;
      try { v = +(localStorage.getItem('vixora:dash-visits') || 0); } catch {}
      return `<div class="dash-kv"><span>🚪 بازدید کاکپیت</span><b>${fa(v)}</b></div>
        <div class="dash-kv"><span>🧩 ویجت‌های روشن</span><b data-ds-on>…</b></div>
        <div class="dash-kv"><span>🏆 دستاوردها</span><b>${fa(JSON.parse(localStorage.getItem('vixora:achieve-unlocked') || '[]').length)}/۲۸</b></div>`;
    }
    case 'quote-lib': {
      return `<p class="dash-quote" data-ql>«…»</p>
        <div class="dash-row wrap"><button class="dash-btn xs" data-action="w12-qnext">🎲 بعدی</button><button class="dash-btn xs" data-action="w12-qcopy">📋 کپی</button></div>`;
    }
    case 'thanks':
      return `<p class="dash-quote">💜 ممنون که با ViXoRa زندگی‌ات را می‌سازی!</p>
        <div class="dash-row"><button class="dash-btn xs" data-action="show-credit">🌟 اعتبار</button><button class="dash-btn xs" data-action="w-xp-backup">🛟 بکاپ</button></div>`;
    default: return '';
  }
}

export function afterWidgets12Render(root) {
  root.querySelectorAll('[data-ql]').forEach(async (box) => {
    try {
      const Q = await import('./dash-quotes.js');
      qlCur = Q.quoteOfDay();
      box.textContent = `«${qlCur[0]}» — ${qlCur[1]}`;
    } catch { /* ignore */ }
  });
  const el = root.querySelector('[data-ds-on]');
  if (el) {
    try {
      const l = JSON.parse(localStorage.getItem('ViXoRa:dash-layout-v1') || localStorage.getItem('vixora:dash-layout') || '[]');
      el.textContent = Array.isArray(l) ? fa(l.filter((w) => w.on).length) : '…';
    } catch { el.textContent = '…'; }
  }
}

let qlCur = null;
export async function handleWidgets12Action(action, el, api) {
  switch (action) {
    case 'w12-copy': {
      try { await navigator.clipboard.writeText(el.dataset?.v || ''); api.toast('📋 کپی شد!'); }
      catch { api.toast('❌ نشد.'); }
      return true;
    }
    case 'w12-letter': {
      const scope = el.closest('section') || api.root;
      const v = scope.querySelector('[data-letter]')?.value.trim();
      if (!v) return true;
      localStorage.setItem('vixora:letter', JSON.stringify({ text: v, show: new Date().toDateString() }));
      api.toast('💌 فردا بهت نشانش می‌دهم!');
      api.rerender(); return true;
    }
    case 'w12-letter-new': localStorage.removeItem('vixora:letter'); api.rerender(); return true;
    case 'w12-qnext': {
      const Q = await import('./dash-quotes.js');
      qlCur = Q.randomQuote();
      const scope = el.closest('section') || api.root;
      const box = scope.querySelector('[data-ql]');
      if (box) box.textContent = `«${qlCur[0]}» — ${qlCur[1]}`;
      return true;
    }
    case 'w12-qcopy': {
      if (!qlCur) { const Q = await import('./dash-quotes.js'); qlCur = Q.quoteOfDay(); }
      try { await navigator.clipboard.writeText(`«${qlCur[0]}» — ${qlCur[1]}`); localStorage.setItem('vixora:quote-copied', '1'); api.toast('📋 کپی شد!'); }
      catch { api.toast('❌ نشد.'); }
      return true;
    }
    case 'w12-d20': {
      const scope = el.closest('section') || api.root;
      const box = scope.querySelector('[data-d20]');
      const roll = 1 + Math.floor(Math.random() * 20);
      if (box) {
        box.textContent = '🎲…';
        setTimeout(() => { box.textContent = roll === 20 ? '🌟 ۲۰! حتماً بله!' : roll === 1 ? '💀 ۱! حتماً نه!' : `${roll > 10 ? '✅' : '❌'} ${roll}`; }, 600);
      }
      return true;
    }
    default: return false;
  }
}
