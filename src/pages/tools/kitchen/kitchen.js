// 🍳 ViXoRa Kitchen OS
import { injectScopedCss } from '../../../utilities/css-scope.js';
import { ktCss } from './kt-css.js';
import {
  load, save, mutate, faNum, esc, faDate, weekdayFa, jalaliKey, weekKeys,
  allRecipes, getRecipe, toggleFav, isFav, rate, setNote, markCooked,
  addPantry, removePantry, expiring, expired, addShop, toggleShop, clearDoneShop,
  shopByAisle, planSet, shopFromPlan, addTimer, pauseTimer, resumeTimer, removeTimer,
  remaining, addCustom, delCustom, drinkWater, logWaste, addLeftover, useLeftover,
  viewRecipe, pushSearch, exportPackage, parsePackage, filterRecipes, dailySuggest,
  spin, missingFor, heatMap, stats, resetAll, PRESETS, AISLES, BADGE_DEFS, newId,
  pantryAll, daysLeft, expLabel, dupCheck, describePantry, pantryAggregate, matchRecipe, cookRank, canonName,
} from './kt-store.js';
import { CATS, MEALS, DIFFS, SEASONS, SUBS, HACKS, TIPS_DAY, TIPS_BANK, PANTRY_CATS, PANTRY_UNITS, scaleIngs, nutritionFor, convertQty, recipeById } from './kt-data.js';

const TABS = [
  ['home', 'خانه'], ['browse', 'دستورها'], ['cook', 'بپز'], ['plan', 'هفته'],
  ['shop', 'خرید'], ['pantry', 'انبار'], ['stats', 'آمار'], ['create', 'دستور من'], ['set', 'تنظیمات'],
];
const SLOTS = [['breakfast', 'صبحانه'], ['lunch', 'ناهار'], ['dinner', 'شام'], ['snack', 'میان‌وعده']];

export function createKitchenPage() {
  let root = null, releaseCss = null, destroyed = false;
  let tab = 'home';
  let filters = { q: '', cat: 'all', meal: 'all', diff: 'all', timeMax: '', sort: 'name', fav: false, pantry: false, spice: '', cost: 'all', season: 'all' };
  let detailId = '';
  let scaleSrv = 4;
  let cook = null; // { id, step, srv }
  let pnWarn = '';   // هشدار «تکراری نباش!» انبار
  let qNote = '';    // ترجمهٔ جستجوی هوشمند
  let overlay = null;
  let tick = null;
  let wake = null;

  function st() { return load(); }
  function setTheme() {
    const s = st().settings;
    root.dataset.theme = s.theme;
    root.dataset.density = s.density;
    root.dataset.font = s.font;
    root.dataset.motion = s.motion ? 'on' : 'off';
    root.style.setProperty('--kt-accent', s.accent);
  }

  function toast(m) {
    const el = root.querySelector('[data-kt=toast]');
    el.innerHTML = `<div class="kt-toast">${esc(m)}</div>`;
    setTimeout(() => { if (el) el.innerHTML = ''; }, 2400);
  }
  function confetti() {
    const box = root.querySelector('[data-kt=confetti]');
    box.innerHTML = '<div class="kt-confetti">' + Array.from({ length: 24 }, (_, i) => `<i style="position:absolute;left:${Math.random()*100}%;top:-10px;width:8px;height:12px;background:hsl(${i*15},80%,60%);animation:kti .8s ${i*40}ms both"></i>`).join('') + '</div>';
    setTimeout(() => { box.innerHTML = ''; }, 1200);
  }
  function openModal(html) {
    overlay = true;
    root.querySelector('[data-kt=overlay]').innerHTML = `<div class="kt-overlay" data-act="ov-bg"><div class="kt-modal" data-stop="1"><button class="kt-x" data-act="close" aria-label="بستن">✕</button>${html}</div></div>`;
  }
  function closeModal() {
    overlay = false;
    root.querySelector('[data-kt=overlay]').innerHTML = '';
  }
  function speak(t) {
    if (!st().settings.tts || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'fa-IR';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  function beep() {
    if (!st().settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } catch { /* */ }
  }

  function render() {
    return `<div class="kt-root" data-theme="ember"><div class="kt-blobs"><i></i><i></i><i></i></div>
      <div data-kt="body"></div><div data-kt="overlay"></div><div data-kt="toast"></div><div data-kt="confetti"></div></div>`;
  }

  function body() {
    const s = st();
    return `<header class="kt-head kt-in">
      <div class="kt-logo">🍳</div>
      <div><h1>آشپزخونه هوشمند ویکسورا</h1><p>${weekdayFa()} ${faDate()} · استریک ${faNum(s.streak)} 🔥 · XP ${faNum(s.xp)}</p></div>
      <div class="kt-sp"></div>
      <button class="kt-btn gold sm" data-act="spin">🎰 چی بپزم؟</button>
      <button class="kt-btn sm" data-act="hack">💡 نکته</button>
      <button class="kt-btn sm" data-act="water">💧 آب ${faNum(s.water[jalaliKey()]||0)}</button>
    </header>
    <nav class="kt-tabs">${TABS.map(([id,l]) => `<button class="kt-tab ${tab===id?'on':''}" data-act="tab" data-id="${id}">${l}</button>`).join('')}</nav>
    <div class="kt-main">${view()}</div>
    ${cookBar()}`;
  }

  function cookBar() {
    const ts = st().timers;
    if (!ts.length && !cook) return '';
    return `<div class="kt-fab">${ts.map((t) => {
      const left = remaining(t);
      return `<button class="kt-btn sm" data-act="focus-timer" data-id="${t.id}">⏱ ${esc(t.label)} ${fmtSec(left)}</button>`;
    }).join('')}${cook ? `<button class="kt-btn primary sm" data-act="resume-cook">▶️ ادامه پخت</button>` : ''}</div>`;
  }

  function view() {
    if (tab === 'home') return home();
    if (tab === 'browse') return browse();
    if (tab === 'cook') return cookView();
    if (tab === 'plan') return planView();
    if (tab === 'shop') return shopView();
    if (tab === 'pantry') return pantryView();
    if (tab === 'stats') return statsView();
    if (tab === 'create') return createView();
    if (tab === 'set') return setView();
    return '';
  }


  // ═══ جستجوی هوشمند (فارسیِ بی‌قاعده!) ═══
  function smartParse(q) {
    const eff = { q: '', meal: null, dietVeg: false, maxT: 0, lowcal: false, hiP: false, cheap: false, tag: null, withIng: [], withoutIng: [], noMeat: false };
    if (!q) return eff;
    let rest = q;
    const moods = [
      [/بدون\s+گوشت|بی گوشت/g, () => { eff.noMeat = true; }],
      [/گل[ێي]اهي|گیاهی|وگن/g, () => { eff.dietVeg = true; }],
      [/تمرینی|باشگاه|پروتئین/g, () => { eff.hiP = true; }],
      [/رژیمی|کم‌?کالری|لاغری/g, () => { eff.lowcal = true; }],
      [/اقتصادی|ارزان|دانشجویی/g, () => { eff.cheap = true; }],
      [/فوری|سریع|عجله/g, () => { eff.maxT = 30; }],
      [/پیک[‌\s]?نیک/g, () => { eff.tag = 'پیک‌نیک'; }],
      [/صبحانه/g, () => { eff.meal = 'breakfast'; }],
      [/ناهار/g, () => { eff.meal = 'lunch'; }],
      [/شام/g, () => { eff.meal = 'dinner'; }],
      [/دسر|شیرین/g, () => { eff.tag = 'شیرین'; }],
      [/مهمانی|مجلسی/g, () => { eff.tag = 'مجلسی'; }],
      [/کودک/g, () => { eff.tag = 'کودک'; }],
      [/زیر\s*(\d+)\s*دقیقه|کمتر از (\d+) دقیقه/g, (m) => { eff.maxT = +(m[1] || m[2]); }],
    ];
    const notes = [];
    moods.forEach(([re, fn]) => { const m = rest.match(re); if (m) { fn(m); rest = rest.replace(re, ' '); } });
    // با X / بدون X (مواد)
    rest.replace(/با\s+([\u0600-\u06FF]+)/g, (m, ing) => { if (!/(گوشت|مرغ)/.test(ing)) { eff.withIng.push(ing); notes.push('با '+ing); } return ' '; });
    rest.replace(/بدون\s+([\u0600-\u06FF]+)/g, (m, ing) => { if (!/گوشت/.test(ing)) { eff.withoutIng.push(ing); notes.push('بدون '+ing); } return ' '; });
    eff.q = rest.trim();
    const bits = [];
    if (eff.noMeat) bits.push('بدون گوشت');
    if (eff.dietVeg) bits.push('گیاهی');
    if (eff.hiP) bits.push('تمرینی');
    if (eff.lowcal) bits.push('رژیمی');
    if (eff.cheap) bits.push('اقتصادی');
    if (eff.maxT) bits.push('≤'+eff.maxT+'د');
    if (eff.tag) bits.push(eff.tag);
    if (eff.meal) bits.push(eff.meal);
    eff._note = notes.concat(bits).join(' · ');
    return eff;
  }
  function smartFilter(q) {
    const sp = smartParse(q);
    qNote = sp._note || '';
    let opts = { ...filters, q: sp.q };
    if (sp.meal) opts.meal = sp.meal;
    let list = filterRecipes(opts);
    if (sp.maxT) list = list.filter((r) => r.time <= sp.maxT);
    if (sp.lowcal) list = list.filter((r) => r.kcal <= 360);
    if (sp.hiP) list = list.filter((r) => r.p >= 22 || (r.tags||[]).includes('تمرینی'));
    if (sp.cheap) list = list.filter((r) => r.cost <= 1);
    if (sp.tag) list = list.filter((r) => (r.tags||[]).some((t) => t.includes(sp.tag.replace('‌',''))) || (r.tags||[]).some((t) => t.includes(sp.tag)));
    if (sp.dietVeg) list = list.filter((r) => r.veg);
    if (sp.noMeat) list = list.filter((r) => !r.ings.some((i) => i.aisle === 'meat' || /گوشت|مرغ|سوسیس|کالباس|ژامبون|تونی/.test(i.k)));
    sp.withIng.forEach((ing) => { list = list.filter((r) => r.ings.some((i) => i.k.includes(ing) || (i.subs && i.subs.includes(ing)))); });
    sp.withoutIng.forEach((ing) => { list = list.filter((r) => !r.ings.some((i) => i.k.includes(ing))); });
    return list;
  }

  function card(r) {
    const s = st();
    const stars = s.ratings[r.id] || 0;
    return `<article class="kt-card" data-act="open" data-id="${r.id}">
      <h3>${esc(r.name)} ${isFav(r.id)?'❤️':''}</h3>
      <div class="kt-meta">
        <span class="kt-chip">⏱ ${faNum(r.time)}د</span>
        <span class="kt-chip">${esc(r.diff)}</span>
        <span class="kt-chip">${faNum(r.kcal)} kcal</span>
        <span class="kt-chip">${esc(r.cat)}</span>
        <span class="kt-chip">${'🌶️'.repeat(r.spice||0)||'ملایم'}</span>
        ${stars?`<span class="kt-chip">${'★'.repeat(stars)}</span>`:''}
      </div>
      <div class="kt-row">
        <button class="kt-btn sm" data-act="open" data-id="${r.id}">جزئیات</button>
        <button class="kt-btn sm" data-act="fav" data-id="${r.id}">${isFav(r.id)?'حذف محبوب':'محبوب'}</button>
        <button class="kt-btn primary sm" data-act="start-cook" data-id="${r.id}">بپز</button>
      </div>
    </article>`;
  }

  function home() {
    const s = st();
    const day = dailySuggest();
    const tip = TIPS_DAY[Number(jalaliKey().replace(/\D/g,'')) % TIPS_DAY.length];
    const exp = expiring();
    const exd = expired();
    const recent = (s.viewed || []).slice(0, 4).map(getRecipe).filter(Boolean);
    const stt = stats();
    return `<div class="kt-grid">
      <div class="kt-card kt-in"><h3>پیشنهاد امروز</h3><p>${esc(day.name)}</p>
        <button class="kt-btn primary sm" data-act="open" data-id="${day.id}">ببین</button>
        <button class="kt-btn sm" data-act="start-cook" data-id="${day.id}">بپز</button></div>
      <div class="kt-card"><h3>عادت‌ها</h3>
        <p>استریک ${faNum(s.streak)} روز</p>
        <div class="kt-bar"><i style="width:${Math.min(100,s.streak*10)}%"></i></div>
        <p>XP ${faNum(s.xp)} · پخت ${faNum(stt.cooked)}</p>
        <p>آب امروز ${faNum(stt.waterToday)} / ${faNum(s.settings.hydrationGoal)}</p>
        <button class="kt-btn sm" data-act="water">یک لیوان</button></div>
      <div class="kt-card"><h3>نکته روز</h3><p>${esc(tip)}</p>
        <button class="kt-btn sm" data-act="hack">نکته تصادفی</button></div>
      <div class="kt-card"><h3>انقضا</h3>
        ${exp.length?exp.map(p=>`<div>${esc(p.k)} تا ${esc(p.exp)}</div>`).join(''):'<p>چیزی نزدیک انقضا نیست.</p>'}
        ${exd.length?`<p class="danger">منقضی: ${exd.map(p=>esc(p.k)).join('، ')}</p>`:''}
        <button class="kt-btn sm" data-act="tab" data-id="pantry">انبار</button></div>
    </div>
    <h3 style="margin-top:16px">اخیراً دیده‌شده</h3>
    <div class="kt-grid">${recent.length?recent.map(card).join(''):'<p>هنوز دستوری باز نکردی.</p>'}</div>
    <div class="kt-row" style="margin-top:12px">
      <button class="kt-btn" data-act="demo">🎭 داده نمایشی</button>
      <button class="kt-btn" data-act="quick-egg">${PRESETS[0].label}</button>
      <button class="kt-btn" data-act="quick-rice">تایمر برنج</button>
    </div>`;
  }

function browse() {
    const smart = (filters.q || '').trim();
    const list = smart ? smartFilter(filters.q) : (qNote = '', filterRecipes(filters));
    let panBlock = '';
    if (filters.pantry) {
      const { full, near } = cookRank();
      panBlock = `<div class="kt-card" style="margin:10px 0;padding:10px">
        <b>🧺 با انبارت:</b> ${faNum(full.length)} دستور کامل آمادهٔ پخت.
        ${near.length ? `<p style="margin:6px 0 4px">نزدیک‌ها — فقط ۱-۲ قلم کم داری:</p>
        ${near.map(({ r, miss }) => `<div class="kt-row" style="justify-content:space-between;font-size:12px;padding:3px 0">
          <button class="kt-btn sm" data-act="open" data-id="${r.id}">${esc(r.name)}</button>
          <span class="kt-meta">کم داری: ${miss.map((i) => esc(i.k)).join('، ')}</span>
        </div>`).join('')}` : ''}
      </div>`;
    }
    return `<div class="kt-row" style="margin-bottom:10px">
      <input class="kt-search" data-el="q" placeholder="مثلاً: نهار بدون گوشت با سیب‌زمینی، پیک‌نیک اقتصادی، شام تمرینی زیر ۳۰ دقیقه..." value="${esc(filters.q)}">
      <select class="kt-sel" data-el="cat">${[['all','همه دسته‌ها'],...CATS.map(c=>[c,c])].map(([v,l])=>`<option value="${esc(v)}" ${filters.cat===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <select class="kt-sel" data-el="meal">${[['all','همه وعده‌ها'],...MEALS.map(m=>[m,m])].map(([v,l])=>`<option value="${v}" ${filters.meal===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <select class="kt-sel" data-el="diff">${[['all','هر سختی'],...DIFFS.map(d=>[d,d])].map(([v,l])=>`<option value="${esc(v)}" ${filters.diff===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <select class="kt-sel" data-el="timeMax">${[['','هر زمان'],['15','≤۱۵د'],['30','≤۳۰د'],['60','≤۶۰د'],['90','≤۹۰د']].map(([v,l])=>`<option value="${v}" ${String(filters.timeMax)===v?'selected':''}>${l}</option>`).join('')}</select>
      <select class="kt-sel" data-el="sort">${[['name','نام'],['time','زمان'],['kcal','کالری'],['rate','امتیاز']].map(([v,l])=>`<option value="${v}" ${filters.sort===v?'selected':''}>${l}</option>`).join('')}</select>
      <select class="kt-sel" data-el="cost">${[['all','هر قیمت'],['1','ارزان'],['2','متوسط'],['3','گران‌تر']].map(([v,l])=>`<option value="${v}" ${filters.cost===v?'selected':''}>${l}</option>`).join('')}</select>
      <select class="kt-sel" data-el="season">${[['all','هر فصل'],...SEASONS.map(x=>[x,x])].map(([v,l])=>`<option value="${esc(v)}" ${filters.season===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <button class="kt-btn sm ${filters.fav?'primary':''}" data-act="tog-favf">فقط محبوب</button>
      <button class="kt-btn sm ${filters.pantry?'primary':''}" data-act="tog-panf">با مواد انبار</button>
    </div>
    ${qNote ? `<p class="kt-meta">🧠 فهمیدم: ${esc(qNote)}</p>` : ''}
    ${panBlock}
    <p class="kt-meta">${faNum(list.length)} دستور از کتابخانه کامل · تاریخچه: ${(st().searchHist||[]).slice(0,5).map(q=>`<button class="kt-chip" data-act="use-q" data-q="${esc(q)}">${esc(q)}</button>`).join(' ')}</p>
    <div class="kt-grid">${list.map(card).join('')||'<p>چیزی پیدا نشد؛ جستجو را ساده‌تر کن.</p>'}</div>`;
  }

  function cookView() {
    if (!cook) {
      return `<div class="kt-card"><p>دستوری انتخاب نشده. از «دستورها» بپز را بزن یا تایمر سریع:</p>
        <div class="kt-row">${PRESETS.map(p=>`<button class="kt-btn sm" data-act="preset" data-id="${p.id}">${esc(p.label)} ${faNum(p.sec/60)}د</button>`).join('')}</div>
        <div class="kt-row" style="margin-top:8px">
          <input class="kt-inp" data-el="tl" placeholder="برچسب تایمر">
          <input class="kt-inp" data-el="ts" type="number" value="5" min="1" style="width:80px"> دقیقه
          <button class="kt-btn primary sm" data-act="custom-timer">شروع</button>
        </div>
        ${timerList()}
      </div>`;
    }
    const r = getRecipe(cook.id);
    if (!r) return '؟';
    const step = r.steps[cook.step] || r.steps[0];
    const n = nutritionFor(r, cook.srv);
    return `<div class="kt-card">
      <div class="kt-row">
        <h3>${esc(r.name)}</h3>
        <button class="kt-btn sm" data-act="end-cook">پایان</button>
        <button class="kt-btn sm" data-act="tts-step">🔊 بخوان</button>
        <button class="kt-btn sm" data-act="wake">${wake?'صفحه بیدار':'بیدار نگه دار'}</button>
      </div>
      <p>نفر ${faNum(cook.srv)} · ${faNum(n.kcal)} kcal · پروتئین ${faNum(n.p)}</p>
      <div class="kt-bar"><i style="width:${((cook.step+1)/r.steps.length)*100}%"></i></div>
      ${r.steps.map((st,i)=>`<div class="kt-step ${i===cook.step?'on':''}"><b>گام ${faNum(i+1)}</b> ${esc(st.t)}
        ${st.sec?`<button class="kt-btn sm" data-act="step-timer" data-sec="${st.sec}" data-i="${i}">⏱ ${faNum(Math.round(st.sec/60))}د</button>`:''}
      </div>`).join('')}
      <div class="kt-row">
        <button class="kt-btn" data-act="prev-step" ${cook.step<=0?'disabled':''}>قبلی</button>
        <button class="kt-btn primary" data-act="next-step">${cook.step>=r.steps.length-1?'تمام شد':'بعدی'}</button>
      </div>
      ${timerList()}
    </div>`;
  }
  function timerList() {
    const ts = st().timers;
    if (!ts.length) return '';
    return `<h4>تایمرها</h4>${ts.map(t=>{
      const left=remaining(t);
      return `<div class="kt-row kt-card"><span class="kt-timer" style="font-size:22px">${fmtSec(left)}</span>
        <span>${esc(t.label)}</span>
        <button class="kt-btn sm" data-act="${t.paused?'resume-t':'pause-t'}" data-id="${t.id}">${t.paused?'▶️':'⏸️'}</button>
        <button class="kt-btn sm danger" data-act="del-t" data-id="${t.id}">✕</button>
        <button class="kt-btn sm" data-act="+30" data-id="${t.id}">+۳۰ث</button>
        <button class="kt-btn sm" data-act="+60" data-id="${t.id}">+۱د</button>
      </div>`;
    }).join('')}`;
  }
  function fmtSec(s) {
    s = Math.max(0, s|0);
    const m = Math.floor(s/60), sec = s%60;
    return faNum(String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'));
  }

  function planView() {
    const days = weekKeys();
    const recs = allRecipes();
    return `<div class="kt-row"><button class="kt-btn primary sm" data-act="shop-week">لیست خرید هفته</button>
      <button class="kt-btn sm" data-act="fill-week">پر کردن هوشمند</button>
      <button class="kt-btn sm" data-act="print-plan">چاپ برنامه</button></div>
      <div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <tr><th></th>${SLOTS.map(([,l])=>`<th>${l}</th>`).join('')}<th></th></tr>
        ${days.map(d=>`<tr>
          <td><b>${d.label}</b><br>${d.fa}</td>
          ${SLOTS.map(([k])=>{
            const rid = (st().plan[d.key]||{})[k]||'';
            const r = rid && getRecipe(rid);
            return `<td><select class="kt-sel" data-act="plan" data-day="${d.key}" data-slot="${k}">
              <option value="">—</option>${recs.map(x=>`<option value="${x.id}" ${x.id===rid?'selected':''}>${esc(x.name)}</option>`).join('')}
            </select>${r?`<div>${faNum(r.time)}د</div>`:''}</td>`;
          }).join('')}
          <td><button class="kt-btn sm" data-act="clear-day" data-day="${d.key}">پاک</button></td>
        </tr>`).join('')}
      </table></div>
      <div class="kt-print-only" id="plan-print"></div>`;
  }

  function shopView() {
    const by = shopByAisle();
    return `<div class="kt-row">
      <input class="kt-inp" data-el="sk" placeholder="ماده">
      <input class="kt-inp" data-el="sq" type="number" value="1" style="width:70px">
      <select class="kt-sel" data-el="su"><option>g</option><option>pcs</option><option>ml</option></select>
      <select class="kt-sel" data-el="sa">${AISLES.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select>
      <button class="kt-btn primary sm" data-act="add-shop">افزودن</button>
      <button class="kt-btn sm" data-act="clear-shop">پاک‌کردن تیک‌خورده</button>
      <button class="kt-btn sm" data-act="copy-shop">کپی متن</button>
    </div>
    ${(() => {
      const agg = pantryAggregate();
      return agg.length ? `<p class="kt-meta">🧺 موجودی انبار: ${agg.slice(0, 12).map((a) => esc(a.k) + ' ' + faNum(a.total) + ' ' + esc(a.u)).join(' · ')}${agg.length > 12 ? ' …' : ''}</p>` : '';
    })()}
    ${AISLES.map(([k,l])=>{
      const items = by[k]||[];
      if (!items.length) return '';
      return `<h4>${l}</h4>${items.map(it=>`<label class="${it.done?'kt-shop-done':''}">
        <input type="checkbox" data-act="tog-shop" data-id="${it.id}" ${it.done?'checked':''}> ${esc(it.k)} ${faNum(it.q)} ${esc(it.u||'')}
      </label>`).join('<br>')}`;
    }).join('') || '<p>لیست خالی است.</p>'}`;
  }

function pantryView() {
    const s = st();
    const items = [...s.pantry].sort((a, b) => {
      const da = daysLeft(a), db = daysLeft(b);
      return (da === null ? 9e9 : da) - (db === null ? 9e9 : db);
    });
    const near = items.filter((p) => { const d = daysLeft(p); return d !== null && d >= 0 && d <= 3; });
    const dead = items.filter((p) => { const d = daysLeft(p); return d !== null && d < 0; });
    const agg = pantryAggregate();
    const warnBox = pnWarn ? `<div class="kt-card" style="border-color:var(--warn,#e9a13b);padding:10px;margin:8px 0">
      <b>⚠️ تکراری نباش!</b><p>${esc(pnWarn)}</p>
      <button class="kt-btn sm" data-act="pn-ok">فهمیدم</button></div>` : '';
    return `${warnBox}
    <div class="kt-card" style="padding:10px;margin-bottom:10px"><b>افزودن قلم به انبار</b>
      <div class="kt-row" style="flex-wrap:wrap;margin-top:8px">
        <input class="kt-inp" data-el="pk" placeholder="نام قلم (مثلاً شیر)" style="min-width:130px">
        <input class="kt-inp" data-el="pbrand" placeholder="برند (اختیاری)" style="min-width:100px">
        <input class="kt-inp" data-el="pmodel" placeholder="مدل (اختیاری)" style="min-width:90px">
        <select class="kt-sel" data-el="pcat">${PANTRY_CATS.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
        <input class="kt-inp" data-el="pq" type="number" value="1" min="0" step="0.5" style="width:70px">
        <select class="kt-sel" data-el="pu">${PANTRY_UNITS.map((u) => `<option>${u}</option>`).join('')}</select>
      </div>
      <div class="kt-row" style="flex-wrap:wrap;margin-top:6px;font-size:12px">
        <label>تولید: <input class="kt-inp" data-el="pp" type="date" style="width:150px"></label>
        <label>انقضا: <input class="kt-inp" data-el="pe" type="date" style="width:150px"></label>
        <button class="kt-btn primary sm" data-act="pn-add">افزودن انبار</button>
      </div>
    </div>
    <div class="kt-card" style="padding:10px;margin-bottom:10px"><b>الان این‌ها تموم میشن:</b>
      ${near.length || dead.length ? '' : '<p class="kt-meta">هیچی نزدیک انقضا نیست؛ حالت سبز ✅</p>'}
      ${dead.map((p) => `<div class="kt-row" style="justify-content:space-between;padding:3px 0"><span class="danger">💀 ${esc(p.k)}${p.brand ? ' ('+esc(p.brand)+')' : ''} — ${esc(expLabel(p).txt)}</span>
        <span><button class="kt-btn sm danger" data-act="waste" data-id="${p.id}">دورریخت شد</button> <button class="kt-btn sm" data-act="pn-keep" data-id="${p.id}">هنوز خوبه</button></span></div>`).join('')}
      ${near.map((p) => `<div class="kt-row" style="justify-content:space-between;padding:3px 0"><span style="color:var(--warn,#e9a13b)">⏰ ${esc(p.k)}${p.brand ? ' ('+esc(p.brand)+')' : ''} — ${esc(expLabel(p).txt)}</span>
        <span><button class="kt-btn sm" data-act="tab" data-id="browse">چی باهاش بپزم؟</button></span></div>`).join('')}
    </div>
    <p class="kt-meta">جمع انبار: ${faNum(items.length)} قلم · ${faNum(agg.length)} نوع مادهٔ متمایز</p>
    <div class="kt-grid">${items.map((p) => {
      const e = expLabel(p);
      return `<div class="kt-card"><b>${esc(p.k)}</b>
      <div class="kt-meta">${faNum(p.q)} ${esc(p.u || '')}${p.brand ? ' · ' + esc(p.brand) : ''}${p.model ? ' · ' + esc(p.model) : ''}${p.cat ? ' · ' + esc(p.cat) : ''}</div>
      <div class="kt-meta">${p.prod ? 'تولید: ' + esc(p.prod) + ' · ' : ''}${p.exp ? 'انقضا: ' + esc(p.exp) : 'بدون انقضا'} ${e.txt ? '· <span class="' + e.cls + '">' + e.txt + '</span>' : ''}</div>
      <div class="kt-row"><button class="kt-btn sm" data-act="waste" data-id="${p.id}">دورریخت شد</button>
      <button class="kt-btn sm danger" data-act="del-pan" data-id="${p.id}">حذف</button></div></div>`;
    }).join('') || '<p>انبار خالی است؛ اولین شی را اضافه کن.</p>'}</div>
    ${agg.length ? `<details style="margin-top:10px"><summary><b>هرچقدر که داری (تجمیع)</b></summary>
      ${agg.map((a) => `<div class="kt-row" style="justify-content:space-between;font-size:12px;padding:2px 0"><span>${esc(a.k)}</span><span>${faNum(a.total)} ${esc(a.u)} ${a.count > 1 ? '· ' + faNum(a.count) + ' قلم' : ''}${a.expired ? ' · <span class="danger">منقضی</span>' : a.near ? ' · <span style="color:var(--warn,#e9a13b)">نزدیک انقضا</span>' : ''}</span></div>`).join('')}</details>` : ''}`;
  }

  function statsView() {
    const s = st(); const stt = stats(); const heat = heatMap(28);
    const keys = Object.keys(heat).reverse();
    return `<div class="kt-grid">
      <div class="kt-card"><h3>خلاصه</h3><p>پخت ${faNum(stt.cooked)}</p><p>XP ${faNum(stt.xp)}</p><p>کالری تخمینی ${faNum(stt.kcal)}</p></div>
      <div class="kt-card"><h3>بج‌ها</h3>${BADGE_DEFS.map(b=>`<span class="kt-chip">${s.badges.includes(b.id)?'🏆':'🔒'} ${esc(b.name)}</span>`).join(' ')}</div>
    </div>
    <h4>۲۸ روز اخیر</h4>
    <div class="kt-heat">${keys.map(k=>{ const n=heat[k]; const cls=n>=3?'l3':n===2?'l2':n===1?'l1':''; return `<i class="${cls}" title="${k}"></i>`; }).join('')}</div>
    <h4>تاریخچه پخت</h4>
    ${s.cooked.slice(-12).reverse().map(c=>`<div>${esc(getRecipe(c.id)?.name||c.id)} · ${esc(c.day)}</div>`).join('')||'<p>—</p>'}
    <h4>تاریخچه گردونه</h4>
    ${s.spinHist.slice(0,8).map(x=>`<button class="kt-chip" data-act="open" data-id="${x.id}">${esc(getRecipe(x.id)?.name||'')}</button>`).join(' ')}`;
  }

  function createView() {
    const s = st();
    return `<div class="kt-card">
      <h3>دستور سفارشی</h3>
      <input class="kt-inp" data-el="cn" placeholder="نام غذا" style="width:100%;margin:6px 0">
      <div class="kt-row">
        <input class="kt-inp" data-el="ct" type="number" value="30" style="width:80px"> دقیقه
        <select class="kt-sel" data-el="cd">${DIFFS.map(d=>`<option>${d}</option>`).join('')}</select>
        <select class="kt-sel" data-el="cc">${CATS.map(c=>`<option>${c}</option>`).join('')}</select>
        <input class="kt-inp" data-el="ck" type="number" value="300" style="width:90px"> kcal
      </div>
      <textarea class="kt-inp" data-el="ci" rows="3" placeholder="مواد: هر خط «نام، مقدار، واحد»" style="width:100%;margin:6px 0"></textarea>
      <textarea class="kt-inp" data-el="cs" rows="3" placeholder="مراحل، هر خط یک گام" style="width:100%"></textarea>
      <button class="kt-btn primary" data-act="save-custom">ذخیره دستور</button>
    </div>
    <div class="kt-grid">${s.custom.map(r=>`<div class="kt-card">${card(r)}<button class="kt-btn sm danger" data-act="del-custom" data-id="${r.id}">حذف</button></div>`).join('')}</div>`;
  }

  function setView() {
    const s = st().settings;
    return `<div class="kt-card">
      <h3>شخصی‌سازی</h3>
      <p>تم</p>
      ${['ember','matcha','ocean','night','cream'].map(t=>`<button class="kt-btn sm ${s.theme===t?'primary':''}" data-act="theme" data-id="${t}">${t}</button>`).join(' ')}
      <p>آکسان</p>
      ${['#fb7185','#34d399','#60a5fa','#fbbf24','#c084fc'].map(c=>`<button class="kt-btn sm" data-act="accent" data-id="${c}" style="background:${c};width:32px;height:32px"></button>`).join(' ')}
      <p>چگالی</p>
      ${['comfy','compact'].map(d=>`<button class="kt-btn sm ${s.density===d?'primary':''}" data-act="dens" data-id="${d}">${d}</button>`).join(' ')}
      <p>رژیم پیش‌فرض</p>
      ${[['all','همه'],['veg','گیاهی'],['vegan','وگان'],['gf','بدون گلوتن*'],['df','بدون لبنیات'],['lowcal','کم‌کالری'],['hiP','پروتئین بالا'],['nutfree','بدون مغز']].map(([v,l])=>`<button class="kt-btn sm ${s.diet===v?'primary':''}" data-act="diet" data-id="${v}">${l}</button>`).join(' ')}
      <p>آلرژی (با کاما)</p>
      <input class="kt-inp" data-el="al" value="${esc((s.allergies||[]).join(','))}" style="width:100%">
      <button class="kt-btn sm" data-act="save-al">ذخیره آلرژی</button>
      <p>نفر پیش‌فرض <input class="kt-inp" data-el="dsrv" type="number" value="${s.defaultSrv}" style="width:70px"></p>
      <button class="kt-btn sm" data-act="save-srv">ذخیره</button>
      <p>
        <label><input type="checkbox" data-act="tog-tts" ${s.tts?'checked':''}> صدای راهنما</label>
        <label><input type="checkbox" data-act="tog-snd" ${s.sound?'checked':''}> آلارم</label>
        <label><input type="checkbox" data-act="tog-mot" ${s.motion?'checked':''}> انیمیشن</label>
        <label><input type="checkbox" data-act="tog-ram" ${s.ramadan?'checked':''}> حالت رمضان</label>
      </p>
      <p>هدف آب <input class="kt-inp" data-el="hg" type="number" value="${s.hydrationGoal}" style="width:70px"> <button class="kt-btn sm" data-act="save-h">ذخیره</button></p>
      <div class="kt-row" style="margin-top:10px">
        <button class="kt-btn" data-act="export">خروجی پشتیبان</button>
        <button class="kt-btn" data-act="import">وارد کردن</button>
        <button class="kt-btn danger" data-act="reset">بازنشانی</button>
      </div>
      <h4>مبدل واحد</h4>
      <div class="kt-row">
        <input class="kt-inp" data-el="cq" type="number" value="100" style="width:80px">
        <select class="kt-sel" data-el="cf"><option>g</option><option>kg</option><option>cup</option><option>tbsp</option><option>ml</option></select>
        →
        <select class="kt-sel" data-el="cto"><option>g</option><option>cup</option><option>tbsp</option><option>kg</option></select>
        <button class="kt-btn sm" data-act="convert">تبدیل</button>
        <span data-el="cresult"></span>
      </div>
    </div>`;
  }

  function openDetail(id) {
    const r = getRecipe(id);
    if (!r) return;
    viewRecipe(id);
    scaleSrv = st().settings.defaultSrv || r.srv;
    paintDetail(r);
  }
  function paintDetail(r) {
    const ings = scaleIngs(r.ings, r.srv, scaleSrv);
    const n = nutritionFor(r, scaleSrv);
    const miss = missingFor({ ...r, ings: r.ings }, scaleSrv);
    const note = st().notes[r.id] || '';
    const stars = st().ratings[r.id] || 0;
    const subHtml = r.ings.map(i => SUBS[Object.keys(SUBS).find(k => i.k.includes(k)) ] || null).filter(Boolean)
      .map(arr => arr.join(' / ')).join(' · ');
    openModal(`<h2>${esc(r.name)}</h2>
      <div class="kt-meta"><span class="kt-chip">${esc(r.region||'')}</span><span class="kt-chip">${esc(r.season)}</span>
        ${r.veg?'<span class="kt-chip">گیاهی</span>':''}${r.vegan?'<span class="kt-chip">وگان</span>':''}
        ${r.nut?'<span class="kt-chip">حاوی مغز</span>':''}</div>
      <p>نفر: <input class="kt-inp" data-el="scale" type="number" min="1" value="${scaleSrv}" style="width:70px">
        <button class="kt-btn sm" data-act="re-scale" data-id="${r.id}">اعمال</button></p>
      <p>${faNum(n.kcal)} kcal · P ${faNum(n.p)} · C ${faNum(n.c)} · F ${faNum(n.fat)}</p>
      <div class="kt-stars">${[1,2,3,4,5].map(i=>`<span data-act="rate" data-id="${r.id}" data-n="${i}">${i<=stars?'★':'☆'}</span>`).join('')}</div>
      <h4>مواد</h4>
      <ul>${ings.map(i=>`<li>${esc(i.k)} — ${faNum(i.q)} ${esc(i.u)}</li>`).join('')}</ul>
      ${miss.length?`<p>کمبود انبار: ${miss.map(m=>esc(m.k)).join('، ')} <button class="kt-btn sm" data-act="miss-shop" data-id="${r.id}">به خرید اضافه کن</button></p>`:''}
      ${subHtml?`<p>جایگزین: ${esc(subHtml)}</p>`:''}
      <h4>مراحل</h4>
      <ol>${r.steps.map(s=>`<li>${esc(s.t)}</li>`).join('')}</ol>
      <p>${esc(r.tips||'')}</p>
      <textarea class="kt-inp" data-el="note" rows="2" placeholder="یادداشت شخصی" style="width:100%">${esc(note)}</textarea>
      <button class="kt-btn sm" data-act="save-note" data-id="${r.id}">ذخیره یادداشت</button>
      <div class="kt-row" style="margin-top:8px">
        <button class="kt-btn primary" data-act="start-cook" data-id="${r.id}">حالت پخت</button>
        <button class="kt-btn" data-act="fav" data-id="${r.id}">محبوب</button>
        <button class="kt-btn" data-act="plan-now" data-id="${r.id}">به امشب</button>
        <button class="kt-btn" data-act="print-r" data-id="${r.id}">چاپ</button>
        <button class="kt-btn" data-act="share-r" data-id="${r.id}">اشتراک متن</button>
        <button class="kt-btn" data-act="close">بستن</button>
      </div>`);
  }

  function paint() {
    if (!root) return;
    setTheme();
    root.querySelector('[data-kt=body]').innerHTML = body();
    bind();
  }

  function bind() {
    const q = root.querySelector('[data-el=q]');
    if (q) q.addEventListener('change', () => { filters.q = q.value; pushSearch(q.value); paint(); });
    for (const el of root.querySelectorAll('select[data-el]')) {
      el.addEventListener('change', () => { filters[el.getAttribute('data-el')] = el.value; paint(); });
    }
    for (const el of root.querySelectorAll('select[data-act=plan]')) {
      el.addEventListener('change', () => { planSet(el.dataset.day, el.dataset.slot, el.value); toast('برنامه ذخیره شد'); paint(); });
    }
  }

  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const id = el.dataset.id;
    if (act === 'ov-bg' && e.target === el) { closeModal(); return; }
    if (el.closest('[data-stop]') && act === 'ov-bg') return;
    const A = {
      close: () => closeModal(),
      tab: () => { tab = id; paint(); },
      open: () => openDetail(id),
      fav: () => { toggleFav(id); paint(); if (overlay && detailId) {} toast('محبوب به‌روز شد'); },
      'start-cook': () => { cook = { id, step: 0, srv: st().settings.defaultSrv }; tab = 'cook'; closeModal(); paint(); speak('شروع پخت'); },
      'end-cook': () => { if (cook) { markCooked(cook.id, cook.srv); confetti(); toast('پخت ثبت شد 🔥'); } cook = null; paint(); },
      'next-step': () => {
        const r = getRecipe(cook.id);
        if (cook.step >= r.steps.length - 1) { A['end-cook'](); return; }
        cook.step++; paint(); speak(r.steps[cook.step].t);
      },
      'prev-step': () => { cook.step = Math.max(0, cook.step - 1); paint(); },
      'tts-step': () => { const r = getRecipe(cook.id); speak(r.steps[cook.step].t); },
      wake: () => {
        if (wake) { wake.release?.(); wake = null; toast('قفل صفحه آزاد'); }
        else if (navigator.wakeLock) navigator.wakeLock.request('screen').then((x) => { wake = x; toast('صفحه بیدار می‌ماند'); }).catch(() => toast('WakeLock پشتیبانی نشد'));
        paint();
      },
      preset: () => { const p = PRESETS.find((x) => x.id === id); addTimer({ label: p.label, sec: p.sec }); paint(); toast('تایمر شروع شد'); },
      'custom-timer': () => {
        const sec = (+root.querySelector('[data-el=ts]')?.value || 5) * 60;
        const label = root.querySelector('[data-el=tl]')?.value || 'تایمر';
        addTimer({ label, sec }); paint();
      },
      'pause-t': () => { pauseTimer(id); paint(); },
      'resume-t': () => { resumeTimer(id); paint(); },
      'del-t': () => { removeTimer(id); paint(); },
      '+30': () => { mutate((s) => { const t = s.timers.find((x) => x.id === id); if (t) { t.endAt += 30000; t.left += 30; } }); paint(); },
      '+60': () => { mutate((s) => { const t = s.timers.find((x) => x.id === id); if (t) { t.endAt += 60000; t.left += 60; } }); paint(); },
      'step-timer': () => { addTimer({ label: 'گام', sec: +el.dataset.sec, recipeId: cook?.id }); paint(); },
      spin: () => {
        const r = spin(st().settings.spinMood || 'any');
        openModal(`<div class="kt-wheel"></div><h2>${esc(r.name)}</h2>
          <button class="kt-btn primary" data-act="open" data-id="${r.id}">باز کن</button>
          <button class="kt-btn" data-act="spin">دوباره</button>
          <button class="kt-btn" data-act="close">بستن</button>`);
      },
      hack: () => toast(HACKS[Math.floor(Math.random() * HACKS.length)]),
      water: () => { drinkWater(); paint(); toast('نوش جان 💧'); },
      'tog-favf': () => { filters.fav = !filters.fav; paint(); },
      'tog-panf': () => { filters.pantry = !filters.pantry; paint(); },
      'use-q': () => { filters.q = el.dataset.q; paint(); },
      'add-shop': () => { addShop({ k: root.querySelector('[data-el=sk]').value, q: +root.querySelector('[data-el=sq]').value, u: root.querySelector('[data-el=su]').value, aisle: root.querySelector('[data-el=sa]').value }); paint(); },
      'tog-shop': () => { toggleShop(id); paint(); },
      'clear-shop': () => { clearDoneShop(); paint(); },
      'copy-shop': () => {
        const t = st().shop.map((x) => `${x.done ? '✓' : '☐'} ${x.k} ${x.q}${x.u || ''}`).join('\n');
        navigator.clipboard?.writeText(t); toast('کپی شد');
      },
      'shop-week': () => { shopFromPlan(weekKeys().map((d) => d.key)); tab = 'shop'; paint(); toast('لیست از برنامه ساخته شد'); },
      'fill-week': () => {
        const days = weekKeys(); const recs = filterRecipes({});
        days.forEach((d, i) => SLOTS.forEach(([k], j) => planSet(d.key, k, recs[(i * 4 + j) % recs.length].id)));
        paint(); toast('هفته پر شد');
      },
      'clear-day': () => { mutate((s) => { delete s.plan[el.dataset.day]; }); paint(); },
      'print-plan': () => window.print(),
      'pn-add': () => {
        const item = {
          k: root.querySelector('[data-el=pk]').value.trim(),
          brand: root.querySelector('[data-el=pbrand]').value.trim(),
          model: root.querySelector('[data-el=pmodel]').value.trim(),
          cat: root.querySelector('[data-el=pcat]').value,
          q: +root.querySelector('[data-el=pq]').value || 1,
          u: root.querySelector('[data-el=pu]').value,
          prod: root.querySelector('[data-el=pp]').value,
          exp: root.querySelector('[data-el=pe]').value,
        };
        if (!item.k) { toast('نام قلم را بنویس'); return; }
        pnWarn = dupCheck(item.k) || '';
        addPantry(item);
        paint();
        toast(pnWarn ? 'اضافه شد — ولی هشدار را بخوان!' : 'ثبت شد در انبار');
      },
      'pn-ok': () => { pnWarn = ''; paint(); },
      'pn-keep': () => { mutate((s) => { const p = s.pantry.find((x) => x.id === id); if (p) p.exp = ''; }); paint(); toast('خوبه که چکش کردی 👍'); },
      'del-pan': () => { removePantry(id); paint(); },
      waste: () => { const p = st().pantry.find((x) => x.id === id); if (p) { logWaste(p.k, p.q, p.u); removePantry(id); } paint(); toast('ثبت دورریز'); },
      'add-left': () => { addLeftover(root.querySelector('[data-el=ln]').value, +root.querySelector('[data-el=lp]').value); paint(); },
      'use-left': () => { useLeftover(id); paint(); },
      'save-custom': () => {
        const name = root.querySelector('[data-el=cn]').value;
        const ings = (root.querySelector('[data-el=ci]').value || '').split('\n').filter(Boolean).map((ln) => {
          const [k, q, u] = ln.split(/[,،]/).map((x) => x.trim());
          return { k, q: +q || 1, u: u || 'g', aisle: 'other' };
        });
        const steps = (root.querySelector('[data-el=cs]').value || '').split('\n').filter(Boolean).map((t) => ({ t, sec: 0 }));
        addCustom({ name, cat: root.querySelector('[data-el=cc]').value, meal: 'dinner', time: +root.querySelector('[data-el=ct]').value, diff: root.querySelector('[data-el=cd]').value, kcal: +root.querySelector('[data-el=ck]').value, p: 10, c: 20, f: 8, srv: 4, veg: true, vegan: false, gluten: true, dairy: false, nut: false, spice: 1, cost: 2, season: 'همه', region: 'خانه', tags: ['سفارشی'], ings, steps, tips: '' });
        paint(); confetti(); toast('دستور ذخیره شد');
      },
      'del-custom': () => { delCustom(id); paint(); },
      theme: () => { mutate((s) => { s.settings.theme = id; }); paint(); },
      accent: () => { mutate((s) => { s.settings.accent = id; }); paint(); },
      dens: () => { mutate((s) => { s.settings.density = id; }); paint(); },
      diet: () => { mutate((s) => { s.settings.diet = id; }); paint(); },
      'save-al': () => { mutate((s) => { s.settings.allergies = root.querySelector('[data-el=al]').value.split(/[,،]/).map((x) => x.trim()).filter(Boolean); }); toast('آلرژی ذخیره شد'); paint(); },
      'save-srv': () => { mutate((s) => { s.settings.defaultSrv = +root.querySelector('[data-el=dsrv]').value || 4; }); paint(); },
      'tog-tts': () => { mutate((s) => { s.settings.tts = !s.settings.tts; }); paint(); },
      'tog-snd': () => { mutate((s) => { s.settings.sound = !s.settings.sound; }); paint(); },
      'tog-mot': () => { mutate((s) => { s.settings.motion = !s.settings.motion; }); paint(); },
      'tog-ram': () => { mutate((s) => { s.settings.ramadan = !s.settings.ramadan; }); toast(st().settings.ramadan ? 'حالت رمضان: وعده‌ها روی سحر/افطار متمرکزند' : 'رمضان خاموش'); paint(); },
      'save-h': () => { mutate((s) => { s.settings.hydrationGoal = +root.querySelector('[data-el=hg]').value || 8; }); paint(); },
      export: () => {
        const blob = new Blob([JSON.stringify(exportPackage(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vixora-kitchen.json'; a.click();
      },
      import: () => {
        openModal(`<h3>وارد کردن پشتیبان</h3><textarea class="kt-inp" data-el="imp" rows="8" style="width:100%"></textarea>
          <button class="kt-btn primary" data-act="imp-go">وارد کن</button> <button class="kt-btn" data-act="close">بستن</button>`);
      },
      'imp-go': () => {
        try { parsePackage(JSON.parse(root.querySelector('[data-el=imp]').value)); closeModal(); paint(); toast('وارد شد'); }
        catch (err) { toast(String(err.message || err)); }
      },
      reset: () => { if (confirm('همه داده آشپزخانه پاک شود؟')) { resetAll(); paint(); } },
      convert: () => {
        const q = +root.querySelector('[data-el=cq]').value;
        const v = convertQty(q, root.querySelector('[data-el=cf]').value, root.querySelector('[data-el=cto]').value);
        const out = root.querySelector('[data-el=cresult]'); if (out) out.textContent = faNum(v);
      },
      're-scale': () => { scaleSrv = +root.querySelector('[data-el=scale]').value || 1; paintDetail(getRecipe(id)); },
      rate: () => { rate(id, +el.dataset.n); paintDetail(getRecipe(id)); toast('امتیاز ثبت شد'); },
      'save-note': () => { setNote(id, root.querySelector('[data-el=note]').value); toast('یادداشت ذخیره شد'); },
      'miss-shop': () => { missingFor(getRecipe(id), scaleSrv).forEach((m) => addShop({ k: m.k, q: m.miss, u: m.u, aisle: m.aisle })); toast('به خرید اضافه شد'); },
      'plan-now': () => { planSet(jalaliKey(), 'dinner', id); toast('رفت روی شام امروز'); closeModal(); },
      'print-r': () => { closeModal(); window.print(); },
      'share-r': () => {
        const r = getRecipe(id);
        const t = `${r.name}\n${r.ings.map((i) => `- ${i.k} ${i.q}${i.u}`).join('\n')}\n${r.steps.map((s, i) => `${i + 1}. ${s.t}`).join('\n')}`;
        navigator.clipboard?.writeText(t); toast('متن کپی شد');
      },
      demo: () => {
        addPantry({ k: 'برنج', q: 2000, u: 'g' });
        addPantry({ k: 'مرغ', q: 1000, u: 'g', exp: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) });
        addShop({ k: 'زعفران', q: 1, u: 'g', aisle: 'spice' });
        markCooked('r3', 4); markCooked('r8', 2);
        toast('داده نمایشی آماده شد'); paint();
      },
      'quick-egg': () => { addTimer({ label: 'تخم‌مرغ', sec: 480 }); tab = 'cook'; paint(); },
      'quick-rice': () => { addTimer({ label: 'برنج', sec: 1800 }); tab = 'cook'; paint(); },
      'focus-timer': () => { tab = 'cook'; paint(); },
      'resume-cook': () => { tab = 'cook'; paint(); },
    };
    if (A[act]) A[act]();
  }

  function onKey(e) {
    if (e.key === 'Escape' && overlay) closeModal();
  }

  function afterRender() {
    root = document.querySelector('.kt-root');
    if (!root) return;
    releaseCss = injectScopedCss(ktCss, 'kitchen-page');
    setTheme();
    paint();
    root.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    tick = setInterval(() => {
      const ts = st().timers;
      let dirty = false;
      for (const t of ts) {
        if (!t.paused && remaining(t) === 0 && !t.rang) {
          t.rang = true; save(); beep(); speak(t.label + ' تمام شد'); toast('⏱ ' + t.label); dirty = true;
        }
      }
      if (tab === 'cook' && ts.length) paint();
      else if (dirty) paint();
    }, 1000);
  }
  function destroy() {
    destroyed = true;
    if (tick) clearInterval(tick);
    window.removeEventListener('keydown', onKey);
    releaseCss?.();
    wake?.release?.();
  }

  return { render, afterRender, destroy };
}
export default createKitchenPage;
