// src/layouts/home/homeLayout.js
// لایوت «معـرکه» صفحهٔ خانه — هدر شیشه‌ای متحول‌شونده، مگامنوی ابزارها،
// سوییچ زبان (i18n)، تم، منوی موبایل و فوتر گرادیانی.
// قرارداد: createHomeLayout(ctx) -> { render, afterRender, getOutlet, destroy }

import { t, setLang, getLang, getDir, onLangChange, applyLangToDom, LANGUAGES, LANGUAGE_META } from '../../core/i18n/i18n.js';
import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();
const SETTINGS_KEY = 'ViXoRa:settings';

const LAYOUT_TOOLS = [
  { key: 'note', icon: '📝', href: '/tools/note', future: false },
  { key: 'customerInfo', icon: '👥', href: '/tools/customerInfo', future: false },
  { key: 'bankLoans', icon: '🏦', href: '/tools/bankLoans', future: false },
  { key: 'music', icon: '🎵', href: '#', future: true },
  { key: 'vault', icon: '🔐', href: '#', future: true },
  { key: 'chat', icon: '💬', href: '#', future: true },
];

function readTheme() {
  const s = storage.get(SETTINGS_KEY, {}) || {};
  return s.homeTheme === 'light' ? 'light' : 'dark';
}
function writeTheme(v) {
  const s = storage.get(SETTINGS_KEY, {}) || {};
  s.homeTheme = v;
  storage.set(SETTINGS_KEY, s);
}

export function createHomeLayout(ctx) {
  let outlet = null;
  let layoutRoot = null;
  const cleanups = [];
  const on = (target, ev, fn, opts) => {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  };

  const user = ctx?.user || null;
  let theme = readTheme();

  function render() {
    const lang = getLang();
    const megaHtml = LAYOUT_TOOLS.map((tool) => `
      <a class="HL-mega__card ${tool.future ? 'is-locked' : ''}" href="${tool.future ? '#' : tool.href}" ${tool.future ? 'data-noop' : 'data-link'}>
        <span class="HL-mega__icon">${tool.icon}</span>
        <span class="HL-mega__txt">
          <b data-i18n="tool.${tool.key}.t">${t(`tool.${tool.key}.t`)}</b>
          <i data-i18n="tool.${tool.key}.d">${t(`tool.${tool.key}.d`)}</i>
        </span>
      </a>`).join('');

    return `
    <div class="HL" data-hl data-theme="${theme}">
      <header class="HL-header" data-hl-header>
        <a class="HL-logo" href="/" data-link aria-label="ViXoRa">
          <span class="HL-logo__mark">✦</span>
          <span class="HL-logo__text"><b>ViXo</b><i>Ra</i></span>
        </a>

        <nav class="HL-nav" aria-label="Main">
          <a class="HL-nav__a" href="/tools/dashboard" data-link data-i18n="nav.tools">${t('nav.tools')}</a>
          <button class="HL-nav__a" type="button" data-scrollto="hm-guide" data-i18n="nav.guide">${t('nav.guide')}</button>
          <button class="HL-nav__a" type="button" data-scrollto="hm-games" data-i18n="nav.games">${t('nav.games')}</button>
        </nav>

        <div class="HL-actions">
          <div class="HL-drop" data-hl-langdrop>
            <button class="HL-iconbtn" type="button" data-hl-langbtn aria-haspopup="true" aria-expanded="false">
              🌐 <span class="HL-langlabel" data-hl-langlabel>${LANGUAGE_META[lang].label}</span>
            </button>
            <div class="HL-drop__menu" data-hl-langmenu>
              ${LANGUAGES.map((l) => `
                <button type="button" class="HL-drop__item ${l === lang ? 'is-active' : ''}" data-lang="${l}">
                  <span>${LANGUAGE_META[l].flag}</span><span>${LANGUAGE_META[l].label}</span>
                </button>`).join('')}
            </div>
          </div>

          <button class="HL-iconbtn" type="button" data-hl-theme title="${t('customize.theme')}" aria-label="${t('customize.theme')}">
            <span data-hl-themeicon>${theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>

          <div class="HL-drop HL-drop--mega" data-hl-toolsdrop>
            <button class="HL-toolsbtn" type="button" data-hl-toolsbtn aria-haspopup="true" aria-expanded="false">
              <span class="HL-toolsbtn__grid" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              <span data-i18n="nav.tools">${t('nav.tools')}</span>
            </button>
            <div class="HL-mega" data-hl-mega>
              <div class="HL-mega__grid">${megaHtml}</div>
              <a class="HL-mega__all" href="/tools/dashboard" data-link data-i18n="layout.allTools">${t('layout.allTools')} ←</a>
            </div>
          </div>

          ${user?.id
            ? `<a class="HL-cta" href="/dashboard" data-link data-i18n="nav.dashboard">${t('nav.dashboard')}</a>`
            : `<a class="HL-cta" href="/login" data-link data-i18n="nav.login">${t('nav.login')}</a>`}

          <button class="HL-burger" type="button" data-hl-burger aria-label="Menu"><span></span><span></span><span></span></button>
        </div>
      </header>

      <div class="HL-drawer" data-hl-drawer aria-hidden="true">
        <a class="HL-drawer__a" href="/tools/dashboard" data-link data-i18n="nav.tools">${t('nav.tools')}</a>
        <button class="HL-drawer__a" type="button" data-scrollto="hm-guide" data-i18n="nav.guide">${t('nav.guide')}</button>
        <button class="HL-drawer__a" type="button" data-scrollto="hm-games" data-i18n="nav.games">${t('nav.games')}</button>
        <a class="HL-drawer__a" href="${user?.id ? '/dashboard' : '/login'}" data-link>${user?.id ? t('nav.dashboard') : t('nav.login')}</a>
      </div>

      <main class="HL-main" data-router-outlet></main>

      <footer class="HL-footer">
        <div class="HL-footer__grid">
          <div class="HL-footer__brand">
            <span class="HL-logo__text HL-logo__text--big"><b>ViXo</b><i>Ra</i></span>
            <p data-i18n="footer.tagline">${t('footer.tagline')}</p>
            <div class="HL-footer__social">
              <a href="#" data-noop aria-label="X">𝕏</a>
              <a href="#" data-noop aria-label="GitHub">⌥</a>
              <a href="#" data-noop aria-label="Telegram">✈</a>
              <a href="#" data-noop aria-label="Instagram">◉</a>
            </div>
          </div>
          <div class="HL-footer__col">
            <h4 data-i18n="footer.quick">${t('footer.quick')}</h4>
            <a href="/tools/dashboard" data-link data-i18n="nav.tools">${t('nav.tools')}</a>
            <button type="button" data-scrollto="hm-guide" data-i18n="nav.guide">${t('nav.guide')}</button>
            <button type="button" data-scrollto="hm-games" data-i18n="nav.games">${t('nav.games')}</button>
          </div>
          <div class="HL-footer__col">
            <h4 data-i18n="footer.toolst">${t('footer.toolst')}</h4>
            ${LAYOUT_TOOLS.slice(0, 3).map((tool) => `
              <a href="${tool.href}" data-link data-i18n="tool.${tool.key}.t">${t(`tool.${tool.key}.t`)}</a>`).join('')}
          </div>
          <div class="HL-footer__col">
            <h4 data-i18n="footer.follow">${t('footer.follow')}</h4>
            <div class="HL-footer__langs">
              ${LANGUAGES.map((l) => `<button type="button" data-lang="${l}" class="${l === lang ? 'is-active' : ''}">${LANGUAGE_META[l].flag}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="HL-footer__base">
          <span>© ۲۰۲۶ ViXoRa — <span data-i18n="footer.rights">${t('footer.rights')}</span></span>
          <span data-i18n="footer.made">${t('footer.made')}</span>
        </div>
      </footer>

      <button class="HL-top" type="button" data-hl-top aria-label="${t('layout.top')}">↑</button>
    </div>`;
  }

  function setDrop(drop, open) {
    drop.classList.toggle('is-open', open);
    drop.querySelector('button[aria-haspopup]')?.setAttribute('aria-expanded', String(open));
  }
  function closeAllDrops() {
    layoutRoot?.querySelectorAll('.HL-drop.is-open').forEach((d) => setDrop(d, false));
  }

  function refreshLang() {
    if (!layoutRoot) return;
    const lang = getLang();
    document.documentElement.dir = getDir(lang);
    applyLangToDom(layoutRoot);
    const label = layoutRoot.querySelector('[data-hl-langlabel]');
    if (label) label.textContent = LANGUAGE_META[lang].label;
    layoutRoot.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-lang') === lang));
  }

  function afterRender() {
    layoutRoot = document.querySelector('[data-hl]');
    outlet = layoutRoot?.querySelector('[data-router-outlet]');
    if (!layoutRoot) return;

    document.documentElement.dir = getDir(getLang());
    applyLangToDom(layoutRoot);

    /* هدر متحول با اسکرول + دکمهٔ بالا */
    const header = layoutRoot.querySelector('[data-hl-header]');
    const topBtn = layoutRoot.querySelector('[data-hl-top]');
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      topBtn.classList.toggle('is-show', window.scrollY > 400);
    };
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();
    on(topBtn, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    /* دراپ‌داون‌ها (زبان + مگامنو) */
    on(layoutRoot, 'click', (e) => {
      const langBtn = layoutRoot.querySelector('[data-hl-langbtn]');
      const toolsBtn = layoutRoot.querySelector('[data-hl-toolsbtn]');
      const langDrop = layoutRoot.querySelector('[data-hl-langdrop]');
      const toolsDrop = layoutRoot.querySelector('[data-hl-toolsdrop]');

      if (e.target.closest('[data-hl-langbtn]')) { setDrop(langDrop, !langDrop.classList.contains('is-open')); setDrop(toolsDrop, false); return; }
      if (e.target.closest('[data-hl-toolsbtn]')) { setDrop(toolsDrop, !toolsDrop.classList.contains('is-open')); setDrop(langDrop, false); return; }

      const langItem = e.target.closest('[data-lang]');
      if (langItem) { setLang(langItem.getAttribute('data-lang')); closeAllDrops(); return; }

      const themeBtn = e.target.closest('[data-hl-theme]');
      if (themeBtn) {
        theme = theme === 'dark' ? 'light' : 'dark';
        writeTheme(theme);
        layoutRoot.dataset.theme = theme;
        themeBtn.querySelector('[data-hl-themeicon]').textContent = theme === 'dark' ? '🌙' : '☀️';
        document.querySelector('[data-hm]')?.setAttribute('data-theme', theme);
        return;
      }

      const burger = e.target.closest('[data-hl-burger]');
      if (burger) {
        const drawer = layoutRoot.querySelector('[data-hl-drawer]');
        const open = !drawer.classList.contains('is-open');
        drawer.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', String(!open));
        return;
      }

      const scrollBtn = e.target.closest('[data-scrollto]');
      if (scrollBtn) {
        const id = scrollBtn.getAttribute('data-scrollto');
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        closeAllDrops();
        layoutRoot.querySelector('[data-hl-drawer]')?.classList.remove('is-open');
        return;
      }

      if (e.target.closest('[data-noop]')) e.preventDefault();
    });

    on(document, 'click', (e) => {
      if (!e.target.closest('.HL-drop')) closeAllDrops();
    });
    on(document, 'keydown', (e) => { if (e.key === 'Escape') closeAllDrops(); });

    cleanups.push(onLangChange(refreshLang));
  }

  function getOutlet() { return outlet; }

  function destroy() {
    cleanups.splice(0).forEach((fn) => fn());
    layoutRoot = null;
    outlet = null;
  }

  return { render, afterRender, getOutlet, destroy };
}
