// src/pages/home/home.js
// صفحهٔ خانهٔ «جادویی» ViXoRa — چندزبانه، شخصی‌سازی‌شده، پر از رویداد اسکرول.
// قرارداد: createHomePage(ctx) -> { render, afterRender, destroy }

import { t, setLang, getLang, getDir, onLangChange, applyLangToDom, LANGUAGES, LANGUAGE_META } from '../../core/i18n/i18n.js';
import { createHomeFx, createKonami } from './fx/homeFx.js';
import { createModal } from '../../utilities/modal.js';
import { GAMES, gameById, gameTitle, gameDesc, getBest, pnum } from '../tools/entertainment/arcade.js';
import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();
const SETTINGS_KEY = 'ViXoRa:settings';

const TOOLS = [
  { key: 'note', icon: '📝', href: '/tools/note', future: false },
  { key: 'customerInfo', icon: '👥', href: '/tools/customerInfo', future: false },
  { key: 'bankLoans', icon: '🏦', href: '/tools/bankLoans', future: false },
  { key: 'music', icon: '🎵', href: '#', future: true },
  { key: 'vault', icon: '🔐', href: '#', future: true },
  { key: 'chat', icon: '💬', href: '#', future: true },
];

const TOOL_LABEL = {
  fa: { note: 'یادداشت', customerInfo: 'اطلاعات مشتریان', bankLoans: 'وام بانکی', music: 'موزیک پلیر', vault: 'گاوصندوق', chat: 'چت' },
  en: { note: 'Notes', customerInfo: 'Customers', bankLoans: 'Bank Loans', music: 'Music', vault: 'Vault', chat: 'Chat' },
  fr: { note: 'Notes', customerInfo: 'Clients', bankLoans: 'Prêts', music: 'Musique', vault: 'Coffre', chat: 'Chat' },
  ar: { note: 'ملاحظات', customerInfo: 'العملاء', bankLoans: 'قروض', music: 'موسيقى', vault: 'خزنة', chat: 'دردشة' },
};

const SHORTCUTS = [
  { keys: '?', fa: 'نمایش همهٔ شورتکات‌ها', en: 'Show all shortcuts' },
  { keys: 'G', fa: 'پرش به بازی‌ها', en: 'Jump to games' },
  { keys: 'T', fa: 'پرش به ابزارها', en: 'Jump to tools' },
  { keys: 'C', fa: 'پنل شخصی‌سازی', en: 'Customize panel' },
  { keys: 'L', fa: 'تعویض زبان', en: 'Cycle language' },
  { keys: 'Esc', fa: 'بستن پنجره‌ها', en: 'Close dialogs' },
];

function readHomeCustom() {
  const s = storage.get(SETTINGS_KEY, {}) || {};
  return {
    theme: s.homeTheme || 'dark',
    accent: s.homeAccent || '#22d3ee',
    density: s.homeDensity || 'comfy',
    motion: s.homeMotion !== 'off' ? 'on' : 'off',
    bg: s.homeBg || 'aurora',
  };
}

function writeHomeCustom(c) {
  const s = storage.get(SETTINGS_KEY, {}) || {};
  s.homeTheme = c.theme; s.homeAccent = c.accent; s.homeDensity = c.density;
  s.homeMotion = c.motion; s.homeBg = c.bg;
  storage.set(SETTINGS_KEY, s);
}

const HOME_GAMES_KEY = 'ViXoRa:home-games';
const HOME_GAME_DEFAULTS = ['subway-run', 'neon-survivors'];

function readHomeGames() {
  const v = storage.get(HOME_GAMES_KEY, null);
  const arr = Array.isArray(v) ? v.filter((id) => gameById(id)) : [];
  const out = [];
  for (const id of arr) if (!out.includes(id)) out.push(id);
  for (const d of HOME_GAME_DEFAULTS) if (out.length < 2 && !out.includes(d)) out.push(d);
  for (const g of GAMES) if (out.length < 2 && !out.includes(g.id)) out.push(g.id);
  return out.slice(0, 2);
}

function writeHomeGames(ids) {
  storage.set(HOME_GAMES_KEY, ids.slice(0, 2));
}

export function createHomePage(ctx) {
  let root = null;
  let fx = null;
  const cleanups = [];
  let custom = readHomeCustom();
  const user = ctx?.user || null;

  const on = (target, ev, fn, opts) => {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  };

  /* ---------------- HTML ---------------- */
  function render() {
    const lang = getLang();
    const toolLabel = (k) => TOOL_LABEL[lang]?.[k] || TOOL_LABEL.fa[k];
    const userTools = user?.tools ? Object.keys(user.tools) : [];
    const scLabel = (s) => (lang === 'en' ? s.en : s.fa);

    const toolsHtml = TOOLS.map((tool) => {
      const mine = userTools.includes(tool.key);
      return `
        <a class="hm-tool ${tool.future ? 'is-locked' : ''} ${mine ? 'is-mine' : ''}" data-fx-tilt
           href="${tool.future ? '#' : tool.href}" ${tool.future ? 'data-noop' : 'data-link'}>
          <span class="hm-tool__icon">${tool.icon}</span>
          <span class="hm-tool__name">${toolLabel(tool.key)}</span>
          <span class="hm-tool__tag">${tool.future ? t('tools.locked') : mine ? t('tools.yours') : t('tools.open')}</span>
        </a>`;
    }).join('');

    const greeting = user ? `${t('hero.welcomeBack')}, ${user.name || user.username} 👋` : t('hero.badge');

    const homeGameIds = readHomeGames();
    const homeGamesHtml = homeGameIds.map((id, slot) => {
      const g = gameById(id) || GAMES[0];
      return `
          <div class="hm-game hm-game--arcade" data-fx-reveal style="--gh:${g.hue}">
            <header><h3>${g.icon} ${gameTitle(g, lang)}</h3><p>${gameDesc(g, lang)}</p></header>
            <button type="button" class="hm-arcade__art" data-play="${g.id}" aria-label="${gameTitle(g, lang)}">
              <span class="hm-arcade__icon">${g.icon}</span>
              <span class="hm-arcade__go">${t('games.playNow')}</span>
            </button>
            <footer>
              <span class="hm-game__score">${t('games.best')}: <b data-best-for="${g.id}">${pnum(getBest(g.id))}</b></span>
              <span class="hm-arcade__btns">
                <button class="hm-btn hm-btn--primary" type="button" data-play="${g.id}">${t('games.playNow')}</button>
                <button class="hm-btn hm-btn--glass hm-btn--sm" type="button" data-change="${slot}">✏️ ${t('games.change')}</button>
              </span>
            </footer>
          </div>`;
    }).join('');

    return `
    <div class="hm-root" data-hm
         data-theme="${custom.theme}" data-density="${custom.density}"
         data-motion="${custom.motion}" data-bg="${custom.bg}"
         style="--hm-accent:${custom.accent}">

      <div class="hm-progress" data-fx-progress></div>
      <div class="hm-glow" data-fx-glow></div>

      <section class="hm-hero" id="hm-top">
        <canvas class="hm-hero__stars" data-fx-stars></canvas>
        <div class="hm-hero__orb hm-hero__orb--a" data-fx-parallax="0.12"></div>
        <div class="hm-hero__orb hm-hero__orb--b" data-fx-parallax="0.2"></div>

        <div class="hm-hero__inner">
          <div class="hm-hero__badge" data-fx-reveal>${greeting}</div>
          <h1 class="hm-hero__title" data-fx-reveal>
            <span class="hm-hero__t1">${t('hero.title1')}</span><br>
            <span class="hm-hero__t2 hm-grad" data-fx-scramble data-text="${t('hero.title2')}">${t('hero.title2')}</span>
          </h1>
          <p class="hm-hero__caption" data-fx-reveal>${t('hero.caption')}</p>
          <div class="hm-hero__actions" data-fx-reveal>
            <a href="/register" class="hm-btn hm-btn--primary" data-fx-magnetic data-link>${t('hero.cta1')}</a>
            <a href="#hm-games" class="hm-btn hm-btn--glass" data-fx-magnetic data-scroll>${t('hero.cta2')}</a>
          </div>
        </div>
        <div class="hm-hero__scrollhint" aria-hidden="true"><span></span></div>
      </section>

      <div class="hm-marquee" aria-hidden="true">
        <div class="hm-marquee__track">
          ${[1, 2].map(() => `
            <div class="hm-marquee__group">
              ${[1, 2, 3, 4, 5, 6].map((n) => `<span class="hm-marquee__item">${t(`marquee.${n}`)} <i>✦</i></span>`).join('')}
            </div>`).join('')}
        </div>
      </div>

      <section class="hm-stats">
        <h2 class="hm-sec-title" data-fx-reveal data-i18n="stats.title">${t('stats.title')}</h2>
        <div class="hm-stats__grid">
          <div class="hm-stat" data-fx-reveal><b data-fx-count="12500" data-fx-suffix="+">۰</b><span data-i18n="stats.users">${t('stats.users')}</span></div>
          <div class="hm-stat" data-fx-reveal><b data-fx-count="24" data-fx-suffix="+">۰</b><span data-i18n="stats.tools">${t('stats.tools')}</span></div>
          <div class="hm-stat" data-fx-reveal><b data-fx-count="99" data-fx-suffix="٪">۰</b><span data-i18n="stats.uptime">${t('stats.uptime')}</span></div>
          <div class="hm-stat" data-fx-reveal><b data-fx-count="4">۰</b><span data-i18n="stats.lang">${t('stats.lang')}</span></div>
        </div>
      </section>

      <section class="hm-features">
        <h2 class="hm-sec-title" data-fx-reveal data-i18n="features.title">${t('features.title')}</h2>
        <p class="hm-sec-sub" data-fx-reveal data-i18n="features.sub">${t('features.sub')}</p>
        <div class="hm-features__grid">
          ${['crm', 'note', 'finance', 'ai'].map((k, i) => `
            <article class="hm-feature" data-fx-tilt data-fx-reveal style="--d:${i * 90}ms">
              <span class="hm-feature__glow"></span>
              <h3 data-i18n="features.${k}.t">${t(`features.${k}.t`)}</h3>
              <p data-i18n="features.${k}.d">${t(`features.${k}.d`)}</p>
            </article>`).join('')}
        </div>
      </section>

      <section class="hm-tools" id="hm-tools">
        <h2 class="hm-sec-title" data-fx-reveal data-i18n="tools.title">${t('tools.title')}</h2>
        <p class="hm-sec-sub" data-fx-reveal data-i18n="tools.sub">${t('tools.sub')}</p>
        <div class="hm-tools__grid">${toolsHtml}</div>
      </section>

      <section class="hm-guide">
        <h2 class="hm-sec-title" data-fx-reveal data-i18n="guide.title">${t('guide.title')}</h2>
        <p class="hm-sec-sub" data-fx-reveal data-i18n="guide.sub">${t('guide.sub')}</p>
        <div class="hm-guide__steps">
          ${[1, 2, 3, 4].map((n) => `
            <div class="hm-step" data-fx-reveal style="--d:${n * 110}ms">
              <span class="hm-step__num">${['۱', '۲', '۳', '۴'][n - 1]}</span>
              <h3 data-i18n="guide.s${n}.t">${t(`guide.s${n}.t`)}</h3>
              <p data-i18n="guide.s${n}.d">${t(`guide.s${n}.d`)}</p>
            </div>`).join('')}
        </div>
      </section>

      <section class="hm-shortcuts">
        <h2 class="hm-sec-title" data-fx-reveal data-i18n="shortcuts.title">${t('shortcuts.title')}</h2>
        <p class="hm-sec-sub" data-fx-reveal>${t('shortcuts.sub')} — ${t('shortcuts.hint')}</p>
        <div class="hm-shortcuts__grid">
          ${SHORTCUTS.map((s) => `
            <div class="hm-key" data-fx-reveal><kbd>${s.keys}</kbd><span>${scLabel(s)}</span></div>`).join('')}
        </div>
      </section>

      <section class="hm-games" id="hm-games">
        <h2 class="hm-sec-title" data-fx-reveal data-i18n="games.title">${t('games.title')}</h2>
        <p class="hm-sec-sub" data-fx-reveal data-i18n="games.sub">${t('games.sub')}</p>
        <div class="hm-games__grid">
${homeGamesHtml}
        </div>
        <div class="hm-games__more">
          <a class="hm-btn hm-btn--glass" href="/tools/entertainment" data-link>${t('games.all')}</a>
        </div>
      </section>

      <section class="hm-cta">
        <div class="hm-cta__box" data-fx-reveal>
          <h2 data-i18n="cta.title">${t('cta.title')}</h2>
          <p data-i18n="cta.sub">${t('cta.sub')}</p>
          <a href="/register" class="hm-btn hm-btn--primary hm-btn--big" data-fx-magnetic data-link data-i18n="cta.btn">${t('cta.btn')}</a>
        </div>
      </section>

      <footer class="hm-footer">
        <span class="hm-grad">ViXoRa</span> © ۲۰۲۶ — <span data-i18n="footer.rights">${t('footer.rights')}</span>
      </footer>

      <div class="hm-float">
        <div class="hm-float__langs">
          ${LANGUAGES.map((l) => `
            <button type="button" class="hm-lang ${l === getLang() ? 'is-active' : ''}" data-lang="${l}" title="${LANGUAGE_META[l].label}">${LANGUAGE_META[l].flag}</button>`).join('')}
        </div>
        <button type="button" class="hm-float__customize" data-customize title="${t('customize.title')}" aria-label="${t('customize.title')}">🎨</button>
      </div>

      <aside class="hm-panel" data-panel aria-hidden="true">
        <h3 data-i18n="customize.title">${t('customize.title')}</h3>
        <div class="hm-panel__row"><span data-i18n="customize.theme">${t('customize.theme')}</span>
          <div class="hm-seg" data-seg="theme">
            <button type="button" data-val="dark" data-i18n="customize.dark">${t('customize.dark')}</button>
            <button type="button" data-val="light" data-i18n="customize.light">${t('customize.light')}</button>
          </div>
        </div>
        <div class="hm-panel__row"><span data-i18n="customize.accent">${t('customize.accent')}</span>
          <div class="hm-swatches" data-seg="accent">
            ${['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#fbbf24'].map((c) => `<button type="button" data-val="${c}" style="--sw:${c}"></button>`).join('')}
          </div>
        </div>
        <div class="hm-panel__row"><span data-i18n="customize.density">${t('customize.density')}</span>
          <div class="hm-seg" data-seg="density">
            <button type="button" data-val="comfy" data-i18n="customize.comfy">${t('customize.comfy')}</button>
            <button type="button" data-val="compact" data-i18n="customize.compact">${t('customize.compact')}</button>
          </div>
        </div>
        <div class="hm-panel__row"><span data-i18n="customize.motion">${t('customize.motion')}</span>
          <div class="hm-seg" data-seg="motion">
            <button type="button" data-val="on" data-i18n="customize.on">${t('customize.on')}</button>
            <button type="button" data-val="off" data-i18n="customize.off">${t('customize.off')}</button>
          </div>
        </div>
        <div class="hm-panel__row"><span data-i18n="customize.bg">${t('customize.bg')}</span>
          <div class="hm-seg" data-seg="bg">
            <button type="button" data-val="aurora">Aurora</button>
            <button type="button" data-val="grid">Grid</button>
            <button type="button" data-val="stars">Stars</button>
          </div>
        </div>
      </aside>

      <div class="hm-overlay" data-shortcuts-overlay aria-hidden="true">
        <div class="hm-overlay__box">
          <h3 data-i18n="shortcuts.title">${t('shortcuts.title')}</h3>
          <ul>${SHORTCUTS.map((s) => `<li><kbd>${s.keys}</kbd><span>${scLabel(s)}</span></li>`).join('')}</ul>
        </div>
      </div>

      <div class="hm-konami" data-konami hidden>🎉</div>
    </div>`;
  }

  /* ---------------- رفتار ---------------- */
  function applyCustom() {
    if (!root) return;
    root.dataset.theme = custom.theme;
    root.dataset.density = custom.density;
    root.dataset.motion = custom.motion;
    root.dataset.bg = custom.bg;
    root.style.setProperty('--hm-accent', custom.accent);
    writeHomeCustom(custom);
  }

  function syncPanel() {
    if (!root) return;
    root.querySelectorAll('[data-seg]').forEach((seg) => {
      const key = seg.getAttribute('data-seg');
      seg.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('is-on', b.getAttribute('data-val') === String(custom[key]));
      });
    });
  }

  function togglePanel() {
    const panel = root?.querySelector('[data-panel]');
    if (!panel) return;
    panel.classList.toggle('is-open');
    panel.setAttribute('aria-hidden', String(!panel.classList.contains('is-open')));
  }

  function refreshHomeBest() {
    if (!root) return;
    root.querySelectorAll('[data-best-for]').forEach((b) => {
      b.textContent = pnum(getBest(b.getAttribute('data-best-for')));
    });
  }

  function openGamePicker(slot) {
    const lang = getLang();
    const node = document.createElement('div');
    node.className = 'hm-pickgrid';
    node.innerHTML = '<p class="hm-pickgrid__hint">' + t('games.pickHint') + '</p>' +
      GAMES.map((g) => '<button type="button" class="hm-pick" data-pick="' + g.id + '" style="--gh:' + g.hue + '">' +
        '<span class="hm-pick__i">' + g.icon + '</span><span class="hm-pick__t">' + gameTitle(g, lang) + '</span></button>').join('');
    const modal = createModal({ title: t('games.pick'), contentNode: node, size: 'wide' });
    node.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      const ids = readHomeGames();
      ids[slot] = b.getAttribute('data-pick');
      writeHomeGames(ids);
      modal.close('picked');
      rebuild();
    });
    modal.open();
  }

  function cycleLang() {
    const idx = LANGUAGES.indexOf(getLang());
    setLang(LANGUAGES[(idx + 1) % LANGUAGES.length]);
  }

  function bind() {
    root = document.querySelector('[data-hm]');
    if (!root) return;

    document.documentElement.dir = getDir(getLang());
    applyLangToDom(root);
    applyCustom();
    syncPanel();

    fx = createHomeFx(root, { motionEnabled: () => custom.motion !== 'off' });
    fx.initAll();
    cleanups.push(() => fx?.destroy());

    // رکورد کارت‌ها بعد از بستن بازی تازه شود
    on(window, 'vixora:arcade-closed', refreshHomeBest);

    on(document, 'keydown', (e) => {
      if (e.target.matches?.('input,textarea')) return;
      const overlay = root.querySelector('[data-shortcuts-overlay]');
      const panel = root.querySelector('[data-panel]');
      if (e.key === '?') {
        overlay.classList.toggle('is-open');
        overlay.setAttribute('aria-hidden', String(!overlay.classList.contains('is-open')));
      } else if (e.key === 'Escape') {
        overlay.classList.remove('is-open');
        panel.classList.remove('is-open');
      } else if (e.key === 'g' || e.key === 'G') root.querySelector('#hm-games')?.scrollIntoView({ behavior: 'smooth' });
      else if (e.key === 't' || e.key === 'T') root.querySelector('#hm-tools')?.scrollIntoView({ behavior: 'smooth' });
      else if (e.key === 'c' || e.key === 'C') togglePanel();
      else if (e.key === 'l' || e.key === 'L') cycleLang();
    });

    cleanups.push(createKonami(() => {
      const k = root?.querySelector('[data-konami]');
      if (k) { k.hidden = false; root.classList.add('is-konami'); setTimeout(() => { k.hidden = true; }, 2500); }
    }));

    on(root, 'click', (e) => {
      const langBtn = e.target.closest('[data-lang]');
      if (langBtn) { setLang(langBtn.getAttribute('data-lang')); return; }

      if (e.target.closest('[data-customize]')) { togglePanel(); return; }

      const playBtn = e.target.closest('[data-play]');
      if (playBtn) {
        void import('../tools/entertainment/launch.js').then((m) => m.openArcadeGame(playBtn.getAttribute('data-play')));
        return;
      }
      const changeBtn = e.target.closest('[data-change]');
      if (changeBtn) { openGamePicker(Number(changeBtn.getAttribute('data-change'))); return; }

      const segBtn = e.target.closest('[data-seg] button');
      if (segBtn) {
        const key = segBtn.closest('[data-seg]').getAttribute('data-seg');
        custom[key] = segBtn.getAttribute('data-val');
        applyCustom(); syncPanel(); return;
      }

      const scrollBtn = e.target.closest('[data-scroll]');
      if (scrollBtn) {
        e.preventDefault();
        root.querySelector(scrollBtn.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (e.target.closest('[data-noop]')) e.preventDefault();
    });

    cleanups.push(onLangChange(() => rebuild()));
  }

  function unbind() {
    cleanups.splice(0).forEach((fn) => fn());
    fx = null;
  }

  function rebuild() {
    unbind();
    if (root) root.outerHTML = render();
    bind();
  }

  function afterRender() { bind(); }

  function destroy() { unbind(); root = null; }

  return { render, afterRender, destroy };
}
