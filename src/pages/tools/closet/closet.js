import { injectScopedCss } from '../../../utilities/css-scope.js';
import { wdCss } from './wd-css.js';
import {
  load, mutate, faNum, esc, faDate, weekdayFa, jalaliKey, seasonNow, fmtT,
  allItems, getItem, filterItems, cpw, toggleFav, markDirty, washAll, wearLook,
  saveOutfit, delOutfit, suggestToday, scoreOutfit, addCustom, delCustom,
  addWish, delWish, packList, stats, heatWorn, exportPackage, parsePackage,
  resetAll, BADGES,
} from './wd-store.js';
import { CATS, COLORS, SEASONS, OCC, WEATHER, TIPS } from './wd-data.js';

const TABS = [
  ['home', 'خانه'], ['rack', 'کمد'], ['look', 'استایل'], ['laundry', 'رختشویی'],
  ['trip', 'سفر'], ['stats', 'آمار'], ['wish', 'آرزو'], ['add', 'افزودن'], ['set', 'تنظیم'],
];
const HEX = { مشکی:'#111', سفید:'#f4f0ea', کرم:'#e6d5b8', 'نوک‌مدادی':'#4b5563', آبی:'#3b82f6', سبز:'#059669', قرمز:'#b91c1c', صورتی:'#fb7185', طلایی:'#d4af37', قهوه‌ای:'#7c4a2d', سرمه‌ای:'#1e3a5f', طوسی:'#9ca3af' };

export function createClosetPage() {
  let root, releaseCss, tab = 'home', overlay = false, tick;
  let f = { q: '', cat: 'all', color: 'all', season: 'all', occ: 'all', sort: 'name', fav: false, clean: false, capsule: false };
  let draft = [];

  const st = () => load();
  function theme() {
    const s = st().settings;
    root.dataset.theme = s.theme;
    root.dataset.motion = s.motion ? 'on' : 'off';
    root.style.setProperty('--wd-accent', s.accent);
  }
  function toast(m) {
    const el = root.querySelector('[data-wd=toast]');
    el.innerHTML = `<div class="wd-toast">${esc(m)}</div>`;
    setTimeout(() => { if (el) el.innerHTML = ''; }, 2200);
  }
  function openModal(html) {
    overlay = true;
    root.querySelector('[data-wd=overlay]').innerHTML = `<div class="wd-overlay" data-act="ov"><div class="wd-modal" data-stop="1"><button class="wd-x" data-act="close" aria-label="بستن">✕</button>${html}</div></div>`;
  }
  function closeModal() { overlay = false; root.querySelector('[data-wd=overlay]').innerHTML = ''; }

  function render() {
    return `<div class="wd-root" data-theme="runway"><div class="wd-grain"></div><div class="wd-spot"></div>
      <div data-wd="body"></div><div data-wd="overlay"></div><div data-wd="toast"></div></div>`;
  }
  function paint() {
    if (!root) return;
    theme();
    root.querySelector('[data-wd=body]').innerHTML = body();
    bind();
  }
  function body() {
    const s = st();
    return `<header class="wd-head wd-in">
      <div class="wd-mark">👗</div>
      <div><h1>کمد هوشمند ویکسورا</h1><p>${weekdayFa()} ${faDate()} · ${seasonNow()} · استریک ${faNum(s.streak)} · XP ${faNum(s.xp)}</p></div>
      <div class="wd-sp"></div>
      <button class="wd-btn pri sm" data-act="today">✨ امروز چی بپوشم؟</button>
      <button class="wd-btn sm" data-act="tip">نکته استایل</button>
    </header>
    <nav class="wd-tabs">${TABS.map(([id, l]) => `<button class="wd-tab ${tab===id?'on':''}" data-act="tab" data-id="${id}">${l}</button>`).join('')}</nav>
    <div>${view()}</div>`;
  }
  function view() {
    return ({ home, rack, look, laundry, trip, stats: statsV, wish, add, set }[tab] || home)();
  }

  function card(it) {
    return `<article class="wd-card wd-in" data-act="open" data-id="${it.id}">
      <div class="wd-swatch" style="background:${HEX[it.color]||'#888'}"></div>
      <h3>${esc(it.name)} ${it.fav?'♥':''} ${it.dirty?'🧺':''}</h3>
      <div class="wd-meta"><span class="wd-chip">${esc(it.cat)}</span><span class="wd-chip">${esc(it.color)}</span>
        <span class="wd-chip">${fmtT(it.price)}</span><span class="wd-chip">پوشش ${faNum(it.wears||0)}</span></div>
      <div class="wd-row">
        <button class="wd-btn sm" data-act="fav" data-id="${it.id}">محبوب</button>
        <button class="wd-btn sm" data-act="dirty" data-id="${it.id}">${it.dirty?'تمیز شد':'چرک'}</button>
        <button class="wd-btn sm pri" data-act="draft" data-id="${it.id}">به استایل</button>
      </div>
    </article>`;
  }

  function home() {
    const s = st(); const stt = stats();
    const sug = suggestToday(s.settings.modest ? 'روزمره' : 'روزمره');
    const tip = TIPS[Number(jalaliKey().replace(/\D/g, '')) % TIPS.length];
    return `<div class="wd-grid">
      <div class="wd-card"><h3>پیشنهاد امروز</h3>
        <div class="wd-man">${sug.map((x) => `<span>${esc(x.cat)}: ${esc(x.name)}</span>`).join('')}
          <div class="wd-score">${faNum(scoreOutfit(sug.map((x) => x.id)))}</div>
        </div>
        <button class="wd-btn pri sm" data-act="wear-sug">پوشیدم</button>
        <button class="wd-btn sm" data-act="save-sug">ذخیره استایل</button>
      </div>
      <div class="wd-card"><h3>کمد در یک نگاه</h3>
        <p>${faNum(stt.n)} لباس · ارزش ${fmtT(stt.value)}</p>
        <p>چرک ${faNum(stt.dirty)} · بی‌استفاده ${faNum(stt.idle)}</p>
        <div class="wd-bar"><i style="width:${Math.min(100, (stt.wears/(stt.n||1))*8)}%"></i></div>
        <button class="wd-btn sm" data-act="tab" data-id="laundry">رختشویی</button>
      </div>
      <div class="wd-card"><h3>نکته روز</h3><p>${esc(tip)}</p>
        <p>آب‌وهوا: ${esc(s.settings.weather)} — ${esc(s.settings.city)}</p>
        ${WEATHER.map((w) => `<button class="wd-btn sm ${s.settings.weather===w?'pri':''}" data-act="wx" data-id="${w}">${w}</button>`).join('')}
      </div>
      <div class="wd-card"><h3>استریک استایل</h3><p>${faNum(s.streak)} روز پشت‌سرهم ثبت پوشش</p>
        <button class="wd-btn sm" data-act="demo">🎭 کمد نمایشی</button></div>
    </div>`;
  }

  function rack() {
    const list = filterItems(f);
    return `<div class="wd-row" style="margin-bottom:10px">
      <input class="wd-search" data-el="q" placeholder="جستجو نام، برند، رنگ..." value="${esc(f.q)}">
      <select class="wd-sel" data-el="cat">${[['all','همه'],...CATS.map((c)=>[c,c])].map(([v,l])=>`<option ${f.cat===v?'selected':''} value="${esc(v)}">${esc(l)}</option>`).join('')}</select>
      <select class="wd-sel" data-el="color">${[['all','رنگ'],...COLORS.map((c)=>[c,c])].map(([v,l])=>`<option ${f.color===v?'selected':''} value="${esc(v)}">${esc(l)}</option>`).join('')}</select>
      <select class="wd-sel" data-el="season">${[['all','فصل'],...SEASONS.map((c)=>[c,c])].map(([v,l])=>`<option ${f.season===v?'selected':''} value="${esc(v)}">${esc(l)}</option>`).join('')}</select>
      <select class="wd-sel" data-el="occ">${[['all','موقعیت'],...OCC.map((c)=>[c,c])].map(([v,l])=>`<option ${f.occ===v?'selected':''} value="${esc(v)}">${esc(l)}</option>`).join('')}</select>
      <select class="wd-sel" data-el="sort">${[['name','نام'],['price','قیمت'],['wears','پوشش'],['cpw','هزینه هر پوشش']].map(([v,l])=>`<option ${f.sort===v?'selected':''} value="${v}">${l}</option>`).join('')}</select>
      <button class="wd-btn sm ${f.fav?'pri':''}" data-act="tf">محبوب</button>
      <button class="wd-btn sm ${f.clean?'pri':''}" data-act="tc">فقط تمیز</button>
      <button class="wd-btn sm ${f.capsule?'pri':''}" data-act="tcap">کپسول</button>
    </div>
    <p class="wd-meta">${faNum(list.length)} قطعه</p>
    <div class="wd-grid">${list.map(card).join('')}</div>`;
  }

  function look() {
    const s = st();
    const items = draft.map(getItem).filter(Boolean);
    const sc = scoreOutfit(draft);
    return `<div class="wd-grid">
      <div class="wd-card"><h3>مانکن استایل</h3>
        <div class="wd-man">${items.length?items.map((x)=>`<span>${esc(x.cat)} · ${esc(x.name)}</span>`).join(''):'<span>از کمد «به استایل» بزن</span>'}
          <div class="wd-score">${faNum(sc)}</div></div>
        <div class="wd-row">
          <button class="wd-btn pri sm" data-act="wear-draft" ${!draft.length?'disabled':''}>پوشیدم</button>
          <button class="wd-btn sm" data-act="save-draft">ذخیره</button>
          <button class="wd-btn sm" data-act="clear-draft">خالی</button>
        </div>
        <p>هارمونی رنگ + رسمی بودن = امتیاز استایل</p>
      </div>
      <div class="wd-card"><h3>استایل‌های ذخیره‌شده</h3>
        ${s.outfits.map((o)=>`<div class="wd-row" style="margin:6px 0"><b>${esc(o.name)}</b>
          <span>${faNum(scoreOutfit(o.ids))}</span>
          <button class="wd-btn sm" data-act="load-o" data-id="${o.id}">بارگذاری</button>
          <button class="wd-btn sm" data-act="wear-o" data-id="${o.id}">پوشیدم</button>
          <button class="wd-btn sm danger" data-act="del-o" data-id="${o.id}">حذف</button></div>`).join('')||'<p>هنوز استایلی نداری.</p>'}
      </div>
    </div>`;
  }

  function laundry() {
    const s = st();
    const items = s.laundry.map(getItem).filter(Boolean);
    return `<div class="wd-card"><h3>سبد چرک ${faNum(items.length)}</h3>
      ${st().settings.laundryWarn && items.length>=st().settings.laundryWarn?`<p>آستانه رختشویی رسید 🧺</p>`:''}
      <div class="wd-grid">${items.map(card).join('')||'<p>سبد خالی — آفرین.</p>'}</div>
      <button class="wd-btn pri" data-act="wash">همه شسته شد</button>
    </div>`;
  }

  function trip() {
    const s = st();
    return `<div class="wd-card"><h3>چمدان هوشمند</h3>
      <p>بر اساس لباس تمیز کمد، لیست بسته‌بندی می‌سازد.</p>
      <button class="wd-btn pri sm" data-act="pack" data-id="weekend">آخر هفته</button>
      <button class="wd-btn sm" data-act="pack" data-id="work3">۳ روز اداری</button>
      <button class="wd-btn sm" data-act="pack" data-id="beach">سفر گرم</button>
      <button class="wd-btn sm" data-act="copy-pack">کپی آخرین لیست</button>
      ${s.packs.slice(0,3).map((p)=>`<div style="margin-top:10px"><b>${esc(p.kind)}</b><ul>${p.ids.map(getItem).filter(Boolean).map((x)=>`<li>${esc(x.name)}</li>`).join('')}</ul></div>`).join('')}
    </div>`;
  }

  function statsV() {
    const s = st(); const stt = stats(); const heat = heatWorn();
    const idle = allItems().filter((x) => !x.wears).slice(0, 8);
    const top = [...allItems()].sort((a, b) => (b.wears || 0) - (a.wears || 0)).slice(0, 5);
    return `<div class="wd-grid">
      <div class="wd-card"><h3>اقتصاد کمد</h3>
        <p>ارزش کل ${fmtT(stt.value)}</p>
        <p>میانگین هزینه هر پوشش (نمونه برتر): ${top[0]?fmtT(cpw(top[0])): '—'}</p>
        <p>XP ${faNum(stt.xp)} · استایل ذخیره‌ ${faNum(stt.outfits)}</p>
      </div>
      <div class="wd-card"><h3>بج‌ها</h3>${BADGES.map((b)=>`<span class="wd-chip">${s.badges.includes(b.id)?'🏆':'🔒'} ${esc(b.name)}</span>`).join(' ')}</div>
    </div>
    <h4>۲۸ روز پوشش</h4>
    <div class="wd-heat">${Object.keys(heat).reverse().map((k)=>{ const n=heat[k]; return `<i class="${n>=3?'l3':n===2?'l2':n===1?'l1':''}" title="${k}"></i>`; }).join('')}</div>
    <h4>پرکارترین‌ها</h4>${top.map((x)=>`<div>${esc(x.name)} · ${faNum(x.wears)} · CPW ${fmtT(cpw(x))}</div>`).join('')}
    <h4>بی‌استفاده (بفروش یا بپوش)</h4>${idle.map((x)=>`<span class="wd-chip">${esc(x.name)}</span>`).join(' ')}`;
  }

  function wish() {
    const s = st();
    return `<div class="wd-card">
      <div class="wd-row">
        <input class="wd-inp" data-el="wn" placeholder="نام آرزو">
        <input class="wd-inp" data-el="wp" type="number" placeholder="قیمت" style="width:120px">
        <button class="wd-btn pri sm" data-act="add-wish">افزودن</button>
      </div>
      ${s.wish.map((w)=>`<div class="wd-row" style="margin-top:8px">${esc(w.name)} · ${fmtT(w.price)}
        <button class="wd-btn sm danger" data-act="del-wish" data-id="${w.id}">حذف</button></div>`).join('')||'<p>لیست خالی.</p>'}
    </div>`;
  }

  function add() {
    return `<div class="wd-card"><h3>قطعه جدید</h3>
      <input class="wd-inp" data-el="an" placeholder="نام" style="width:100%;margin:6px 0">
      <div class="wd-row">
        <select class="wd-sel" data-el="ac">${CATS.map((c)=>`<option>${c}</option>`).join('')}</select>
        <select class="wd-sel" data-el="acol">${COLORS.map((c)=>`<option>${c}</option>`).join('')}</select>
        <select class="wd-sel" data-el="as">${SEASONS.map((c)=>`<option>${c}</option>`).join('')}</select>
        <input class="wd-inp" data-el="ap" type="number" value="500000" style="width:120px">
        <input class="wd-inp" data-el="ab" placeholder="برند">
      </div>
      <p>موقعیت‌ها:</p>
      ${OCC.map((o)=>`<label style="margin-left:8px"><input type="checkbox" data-occ="${o}"> ${o}</label>`).join('')}
      <p><button class="wd-btn pri" data-act="save-item">ذخیره در کمد</button></p>
      <h4>سفارشی‌های من</h4>
      <div class="wd-grid">${st().custom.map((x)=>`${card(x)}<button class="wd-btn sm danger" data-act="del-c" data-id="${x.id}">حذف</button>`).join('')}</div>
    </div>`;
  }

  function set() {
    const s = st().settings;
    return `<div class="wd-card"><h3>شخصی‌سازی</h3>
      <p>تم</p>${['runway','atelier','noir','blush','linen'].map((t)=>`<button class="wd-btn sm ${s.theme===t?'pri':''}" data-act="theme" data-id="${t}">${t}</button>`).join(' ')}
      <p>آکسان</p>${['#e8b4b8','#d4af37','#60a5fa','#34d399','#c084fc'].map((c)=>`<button class="wd-btn sm" data-act="accent" data-id="${c}" style="background:${c};width:28px;height:28px;padding:0"></button>`).join(' ')}
      <p>شهر <input class="wd-inp" data-el="city" value="${esc(s.city)}"> <button class="wd-btn sm" data-act="save-city">ذخیره</button></p>
      <p>آستانه رختشویی <input class="wd-inp" data-el="lw" type="number" value="${s.laundryWarn}" style="width:70px"> <button class="wd-btn sm" data-act="save-lw">ذخیره</button></p>
      <p><label><input type="checkbox" data-act="mot" ${s.motion?'checked':''}> انیمیشن</label>
         <label><input type="checkbox" data-act="mod" ${s.modest?'checked':''}> پوشش کامل‌تر در پیشنهاد</label></p>
      <div class="wd-row" style="margin-top:10px">
        <button class="wd-btn" data-act="export">پشتیبان</button>
        <button class="wd-btn" data-act="import">ورود</button>
        <button class="wd-btn danger" data-act="reset">بازنشانی</button>
      </div>
    </div>`;
  }

  function openItem(id) {
    const it = getItem(id);
    if (!it) return;
    openModal(`<h2>${esc(it.name)}</h2>
      <div class="wd-swatch" style="background:${HEX[it.color]||'#888'};height:90px"></div>
      <p>${esc(it.brand||'')} · ${esc(it.season)} · رسمی ${faNum(it.formal)}/۵ · گرما ${faNum(it.warm)}/۵</p>
      <p>قیمت ${fmtT(it.price)} · هر پوشش ${fmtT(cpw(it))} · آخرین ${esc(it.last||'—')}</p>
      <p>${(it.occ||[]).map((o)=>`<span class="wd-chip">${esc(o)}</span>`).join(' ')}</p>
      <textarea class="wd-inp" data-el="note" rows="2" style="width:100%">${esc(it.note||'')}</textarea>
      <button class="wd-btn sm" data-act="save-note" data-id="${id}">یادداشت</button>
      <div class="wd-row" style="margin-top:8px">
        <button class="wd-btn pri" data-act="draft" data-id="${id}">به استایل</button>
        <button class="wd-btn" data-act="fav" data-id="${id}">محبوب</button>
        <button class="wd-btn" data-act="close">بستن</button>
      </div>`);
  }

  function bind() {
    const q = root.querySelector('[data-el=q]');
    if (q) q.addEventListener('change', () => { f.q = q.value; paint(); });
    for (const el of root.querySelectorAll('select[data-el]')) {
      if (['cat','color','season','occ','sort'].includes(el.getAttribute('data-el'))) {
        el.addEventListener('change', () => { f[el.getAttribute('data-el')] = el.value; paint(); });
      }
    }
  }

  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, id = el.dataset.id;
    if (act === 'ov' && e.target === el) { closeModal(); return; }
    const A = {
      close: () => closeModal(),
      tab: () => { tab = id; paint(); },
      open: () => openItem(id),
      fav: () => { toggleFav(id); paint(); if (overlay) openItem(id); },
      dirty: () => { const it = getItem(id); markDirty(id, !it.dirty); paint(); },
      draft: () => { if (!draft.includes(id)) draft.push(id); tab = 'look'; closeModal(); paint(); toast('به مانکن اضافه شد'); },
      today: () => { tab = 'home'; paint(); toast('پیشنهاد بر اساس فصل و هوا'); },
      tip: () => toast(TIPS[Math.floor(Math.random() * TIPS.length)]),
      wx: () => { mutate((s) => { s.settings.weather = id; }); paint(); },
      'wear-sug': () => { wearLook(suggestToday().map((x) => x.id)); toast('ثبت شد ✨'); paint(); },
      'save-sug': () => { saveOutfit('امروز ' + faDate(), suggestToday().map((x) => x.id)); toast('استایل ذخیره شد'); paint(); },
      'wear-draft': () => { wearLook(draft); draft = []; toast('پوشش ثبت و لباس‌ها چرک شدند'); paint(); },
      'save-draft': () => { saveOutfit('استایل ' + faNum(st().outfits.length + 1), draft); toast('ذخیره'); paint(); },
      'clear-draft': () => { draft = []; paint(); },
      'load-o': () => { const o = st().outfits.find((x) => x.id === id); if (o) draft = [...o.ids]; paint(); },
      'wear-o': () => { const o = st().outfits.find((x) => x.id === id); if (o) wearLook(o.ids); paint(); },
      'del-o': () => { delOutfit(id); paint(); },
      wash: () => { washAll(); toast('همه تمیز شد'); paint(); },
      pack: () => { packList(id); paint(); toast('چمدان آماده'); },
      'copy-pack': () => {
        const p = st().packs[0];
        if (!p) return toast('لیستی نیست');
        navigator.clipboard?.writeText(p.ids.map(getItem).filter(Boolean).map((x) => x.name).join('\n'));
        toast('کپی شد');
      },
      'add-wish': () => { addWish(root.querySelector('[data-el=wn]').value, root.querySelector('[data-el=wp]').value); paint(); },
      'del-wish': () => { delWish(id); paint(); },
      'save-item': () => {
        const occ = [...root.querySelectorAll('[data-occ]:checked')].map((x) => x.getAttribute('data-occ'));
        addCustom({ name: root.querySelector('[data-el=an]').value || 'بدون نام', cat: root.querySelector('[data-el=ac]').value, color: root.querySelector('[data-el=acol]').value, season: root.querySelector('[data-el=as]').value, occ: occ.length ? occ : ['روزمره'], warm: 3, formal: 2, price: +root.querySelector('[data-el=ap]').value || 0, brand: root.querySelector('[data-el=ab]').value || 'خانه' });
        toast('به کمد اضافه شد'); paint();
      },
      'del-c': () => { delCustom(id); paint(); },
      theme: () => { mutate((s) => { s.settings.theme = id; }); paint(); },
      accent: () => { mutate((s) => { s.settings.accent = id; }); paint(); },
      'save-city': () => { mutate((s) => { s.settings.city = root.querySelector('[data-el=city]').value; }); toast('شهر ذخیره'); },
      'save-lw': () => { mutate((s) => { s.settings.laundryWarn = +root.querySelector('[data-el=lw]').value || 3; }); paint(); },
      mot: () => { mutate((s) => { s.settings.motion = !s.settings.motion; }); paint(); },
      mod: () => { mutate((s) => { s.settings.modest = !s.settings.modest; }); paint(); },
      export: () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(exportPackage(), null, 2)], { type: 'application/json' }));
        a.download = 'vixora-closet.json'; a.click();
      },
      import: () => openModal(`<h3>ورود پشتیبان</h3><textarea class="wd-inp" data-el="imp" rows="8" style="width:100%"></textarea>
        <button class="wd-btn pri" data-act="imp-go">وارد کن</button> <button class="wd-btn" data-act="close">بستن</button>`),
      'imp-go': () => { try { parsePackage(JSON.parse(root.querySelector('[data-el=imp]').value)); closeModal(); paint(); } catch (err) { toast(err.message); } },
      reset: () => { if (confirm('کمد صفر شود؟')) { resetAll(); draft = []; paint(); } },
      'save-note': () => { mutate((s) => { const it = [...s.items, ...s.custom].find((x) => x.id === id); if (it) it.note = root.querySelector('[data-el=note]').value; }); toast('یادداشت'); },
      demo: () => { wearLook(['g4', 'g6', 'g7', 'g13']); toast('یک استایل اداری ثبت شد'); paint(); },
      tf: () => { f.fav = !f.fav; paint(); },
      tc: () => { f.clean = !f.clean; paint(); },
      tcap: () => { f.capsule = !f.capsule; paint(); },
    };
    if (A[act]) A[act]();
  }
  function onKey(e) { if (e.key === 'Escape' && overlay) closeModal(); }

  function afterRender() {
    root = document.querySelector('.wd-root');
    if (!root) return;
    releaseCss = injectScopedCss(wdCss, 'closet-page');
    paint();
    root.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
  }
  function destroy() {
    if (root) root.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    releaseCss?.();
    if (tick) clearInterval(tick);
  }
  return { render, afterRender, destroy };
}
export default createClosetPage;
