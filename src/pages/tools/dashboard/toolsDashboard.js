// 🛩 ViXoRa Tools Dashboard — کاکپیت مرکزی هر ۶ ابزار
// src/pages/tools/dashboard/toolsDashboard.js
// قرارداد صفحه: { render, afterRender, destroy }

import { injectScopedCss } from '../../../utilities/css-scope.js';
import { dashCss } from './dash-css.js';
import {
  DASH_VIEWS, loadDashUi, saveDashUi, loadLayout, saveLayout,
  logActivity, tourDone, dashNavigate, esc, faDigits,
} from './dash-state.js';
import { getDashData, invalidateDashData } from './dash-data.js';
import { WIDGET_META, renderWidget, widgetChrome, afterWidgetsRender } from './dash-widgets.js';
import { WIDGET2_META, renderWidget2, afterWidgets2Render } from './dash-widgets2.js';
import { WIDGET3_META, renderWidget3, afterWidgets3Render, tickLyricsNow, tickCountdown, tickWorldClock, playTestSound } from './dash-widgets3.js';
import { WIDGET4_META, renderWidget4, afterWidgets4Render, tickQueueMini, logPomo } from './dash-widgets4.js';
import { WIDGETS_META_5, renderWidgets5, afterWidgets5Render } from './dash-widgets5.js';
import { WIDGETS_META_6, renderWidgets6, afterWidgets6Render } from './dash-widgets6.js';
import { WIDGETS_META_7, renderWidgets7, afterWidgets7Render } from './dash-widgets7.js';
import { WIDGETS_META_8, renderWidgets8, afterWidgets8Render } from './dash-widgets8.js';
import { WIDGETS_META_9, renderWidgets9, afterWidgets9Render } from './dash-widgets9.js';
import { WIDGETS_META_10, renderWidgets10, afterWidgets10Render } from './dash-widgets10.js';
import { WIDGETS_META_11, renderWidgets11, afterWidgets11Render } from './dash-widgets11.js';
import { WIDGETS_META_12, renderWidgets12, afterWidgets12Render } from './dash-widgets12.js';
import { renderGoals } from './dash-goals.js';
import { renderReview } from './dash-review.js';
import { renderChangelog, hasUnseen, markSeen } from './dash-changelog.js';
import { maybeWelcome, handleWelcomeAction, closeWelcome } from './dash-welcome.js';
import { renderInsights } from './dash-insights.js';
import { renderAchievements, checkAchievements, celebrateFresh } from './dash-achieve.js';
import { maybeDigest } from './dash-digest.js';
import { renderFocus, stopAmbient, stopFocusTimer } from './dash-focus.js';
import { renderNotifyCenter, scanReminders, updateNotifyBadge } from './dash-notify.js';
import { renderThemeGallery, applyTheme, currentThemeId, autoThemeTick, normalizeThemeId, cycleTheme as cycleThemeNew } from './dash-themes.js';
import { renderExportCenter, importBackup } from './dash-export.js';
import { renderAnalytics } from './dash-stats.js';
import { renderAutomations, runAutomations } from './dash-automate.js';
import { renderRemote, tickRemote } from './dash-remote.js';
import { renderJournal } from './dash-journal.js';
import { renderCalendar } from './dash-calendar.js';
import { renderHabits } from './dash-habits.js';
import { handleWidgetAction, handleWidgetInput, handleWidgetKeydown, startDashTimers, stopDashTimers } from './dash-actions.js';
import { buildCommands, renderCmdk, cmdkListHtml, filterCommands, runCommand } from './dash-cmdk.js';
import { GUIDE_CHAPTERS, guideChapterHtml, guideSearchAll } from './dash-guide.js';
import { renderReport, afterReportRender, handleReportAction } from './dash-report.js';
import { renderSettings, handleSettingsAction, handleSettingsChange } from './dash-settings.js';
import { startTour, stopTour, handleTourAction, isTourActive } from './dash-tour.js';
import { openCredit, closeCredit, isCreditOpen, creditLineText } from './dash-credit.js';

const ALL_META = { ...WIDGET_META, ...WIDGET2_META, ...WIDGET3_META, ...WIDGET4_META, ...WIDGETS_META_5, ...WIDGETS_META_6, ...WIDGETS_META_7, ...WIDGETS_META_8, ...WIDGETS_META_9, ...WIDGETS_META_10, ...WIDGETS_META_11, ...WIDGETS_META_12 };
const W2 = new Set(Object.keys(WIDGET2_META));
const W3 = new Set(Object.keys(WIDGET3_META));
const W4 = new Set(Object.keys(WIDGET4_META));
const W5 = new Set(Object.keys(WIDGETS_META_5));
const W6 = new Set(Object.keys(WIDGETS_META_6));
const W7 = new Set(Object.keys(WIDGETS_META_7));
const W8 = new Set(Object.keys(WIDGETS_META_8));
const W9 = new Set(Object.keys(WIDGETS_META_9));
const W10 = new Set(Object.keys(WIDGETS_META_10));
const W11 = new Set(Object.keys(WIDGETS_META_11));
const W12 = new Set(Object.keys(WIDGETS_META_12));

export function createToolsDashboardPage(ctx = {}) {
  let root = null;
  let releaseCss = null;
  let destroyed = false;
  let ui = loadDashUi();
  if (!sessionStorage.getItem('vixora:dash-visited')) {
    try { sessionStorage.setItem('vixora:dash-visited', '1'); } catch { /* ignore */ }
    if (ui.defaultView && DASH_VIEWS.some((v) => v.id === ui.defaultView)) ui.view = ui.defaultView;
  }
  let layout = loadLayout();
  let data = null;
  let st = { gq: '', gqResults: '', quoteShift: 0, dice: 0, diceOut: '', calcQ: '', calcOut: '=' };
  let cmdkIdx = 0;
  let cmdkCommands = [];
  let dragId = null;
  let pendingG = false;

  /* ================= رندر ================= */

  function render() {
    return `<div class="dash-root" data-theme="${esc(ui.theme)}" data-density="${esc(ui.density || 'comfortable')}">
      <div class="dash-bg"><i></i><i></i><i></i></div>
      <div data-dash="shell"><div class="dash-empty">⏳ در حال بارگذاری کاکپیت…</div></div>
      <div data-dash="overlay"></div>
      <div data-dash="toast"></div>
    </div>`;
  }

  function shellHtml() {
    const t = ui.theme;
    void t;
    return `
    <header class="dash-header" data-tour="header">
      <div class="dash-logo">🛩</div>
      <div class="dash-title"><h1>کاکپیت ViXoRa</h1>
        <span>${data ? `📝${faDigits(String(data.notes.count))} 👥${faDigits(String(data.customers.count))} 🎵${faDigits(String(data.music.count))} 🧾${faDigits(String(data.finance.txs))} 🎮${faDigits(String(data.arcade.plays))}` : '…'}</span></div>
      <div class="dash-header-ops">
        <button class="dash-btn dash-btn-sm" data-action="open-cmdk" data-tour="cmdk">⌨️ فرمان‌یاب <kbd>Ctrl K</kbd></button>
        <button class="dash-btn dash-btn-sm" data-action="open-gallery" data-tour="gallery">🧩 ویجت‌ها</button>
        <button class="dash-btn dash-btn-sm" data-action="view" data-v="notify" title="مرکز اعلان‌ها">🔔<span class="dash-notify-badge" style="display:none"></span></button>
        <button class="dash-btn dash-btn-sm" data-action="cycle-theme" title="تم بعدی (T)">🎨</button>
        <button class="dash-btn dash-btn-sm" data-action="reload" title="تازه‌سازی (R)">🔄</button>
      </div>
    </header>
    <nav class="dash-views" data-tour="views">
      ${DASH_VIEWS.map((v) => `<button class="dash-view-btn ${ui.view === v.id ? 'is-on' : ''}" data-action="view" data-v="${v.id}">${v.icon} ${v.title}</button>`).join('')}
    </nav>
    <div data-dash="body">${bodyHtml()}</div>
    <footer class="dash-footer">🛩 ViXoRa Cockpit • ${esc(creditLineText())} • <button data-action="show-credit">🌟 اعتبار</button> • <button data-action="view" data-v="changelog">✨ تازه‌ها</button></footer>`;
  }

  function bodyHtml() {
    if (ui.view === 'guide') return guideHtml();
    if (ui.view === 'report') return data ? renderReport(data, st.reportMode || 'week') : '<div class="dash-empty">⏳…</div>';
    if (ui.view === 'settings') return renderSettings(ui);
    if (ui.view === 'notify') return renderNotifyCenter();
    if (ui.view === 'analytics') return renderAnalytics();
    if (ui.view === 'themes') return renderThemeGallery();
    if (ui.view === 'export') return renderExportCenter();
    if (ui.view === 'auto') return renderAutomations();
    if (ui.view === 'journal') return renderJournal(st);
    if (ui.view === 'remote') return renderRemote();
    if (ui.view === 'calendar') return renderCalendar(st);
    if (ui.view === 'habits') return renderHabits();
    if (ui.view === 'focus') return renderFocus(st);
    if (ui.view === 'insights') return renderInsights();
    if (ui.view === 'achieve') return renderAchievements();
    if (ui.view === 'goals') return renderGoals();
    if (ui.view === 'review') return renderReview();
    if (ui.view === 'changelog') { setTimeout(() => markSeen(), 500); return renderChangelog(); }
    return cockpitHtml();
  }

  function cockpitHtml() {
    if (!data) return '<div class="dash-empty">⏳ در حال بارگذاری داده‌ها…</div>';
    const visible = layout.filter((w) => w.on && ALL_META[w.id]);
    if (!visible.length) return '<div class="dash-empty">ویجتی روشن نیست.<br /><button class="dash-btn" data-action="open-gallery">🧩 باز کردن گالری</button></div>';
    if (ui.focusWidget) {
      const w = visible.find((x) => x.id === ui.focusWidget);
      if (w) return `<div class="dash-grid">${widgetChrome(w.id, renderBody(w.id), { size: 'xl', link: widgetLink(w.id), meta: ALL_META[w.id] })}</div>
      <div class="dash-row"><button class="dash-btn" data-action="w-unfocus">✕ خروج از تمرکز</button></div>`;
    }
    return `<div class="dash-grid" data-dash="grid">${visible.map((w) =>
      widgetChrome(w.id, renderBody(w.id), { size: w.size || 'm', link: widgetLink(w.id), meta: ALL_META[w.id] })).join('')}</div>`;
  }

  function renderBody(id) {
    try {
      if (W12.has(id)) return renderWidgets12(id);
      if (W11.has(id)) return renderWidgets11(id);
      if (W10.has(id)) return renderWidgets10(id);
      if (W9.has(id)) return renderWidgets9(id);
      if (W8.has(id)) return renderWidgets8(id);
      if (W7.has(id)) return renderWidgets7(id);
      if (W6.has(id)) return renderWidgets6(id);
      if (W5.has(id)) return renderWidgets5(id, api());
      if (W4.has(id)) return renderWidget4(id, data, st, ui);
      if (W3.has(id)) return renderWidget3(id, data, st, ui);
      return W2.has(id) ? renderWidget2(id, data, st, ui) : renderWidget(id, data, st, ui);
    } catch (e) {
      return `<div class="dash-empty">❌ خطا در ویجت ${esc(id)}</div>`;
    }
  }

  function widgetLink(id) {
    if (id.startsWith('music') || id === 'top-songs' || id === 'radio' || id === 'playlists' || id === 'sessions' || id === 'lyrics-now' || id === 'eq-quick' || id === 'sleep' || id === 'sound-board' || id === 'pl-stats' || id === 'album-wall' || id === 'song-fresh' || id === 'song-liked' || id === 'queue-mini' || id === 'vol-ctl' || id === 'rate-ctl' || id === 'artist-top' || id === 'genre-pie' || id === 'listen-week' || id === 'remote-mini' || id === 'eq-mini' || id === 'sleep-mini' || id === 'album-count' || id === 'longest-song' || id === 'hour-play') return '/tools/music';
    if (['fin-kpi', 'fin-cash', 'finance-chart', 'debts', 'goals', 'bills', 'forecast', 'subs', 'insights', 'tx-quick', 'networth', 'bills-cal', 'quotes-day', 'week', 'cats', 'accounts', 'goal-ring', 'aging-mini', 'fx-quick', 'tx-by-day', 'top-cats', 'tx-types', 'debt-list', 'inv-open', 'bill-next', 'week-review', 'month-compare', 'top-days', 'cat-year', 'money-mood', 'debt-free', 'save-rate', 'bill-total', 'sub-audit', 'tx-heat', 'weekday-spend', 'bill-paid-rate', 'networth-trend', 'top-expense-day', 'avg-tx', 'cash-days', 'goal-eta'].includes(id)) return '/tools/invoices';
    if (id === 'notes' || id === 'notes-stats' || id === 'note-cal' || id === 'note-tags') return '/tools/note';
    if (id === 'customers' || id === 'cust-growth' || id === 'cust-new' || id === 'cust-top') return '/tools/customerInfo';
    if (id === 'building' || id === 'unit-occ' || id === 'build-detail') return '/tools/building';
    if (id === 'arcade' || id === 'arcade-top') return '/tools/entertainment';
    return '';
  }

  function guideHtml() {
    const ch = ui.guideChapter || 'start';
    return `<div class="dash-panel dash-guide-search"><input class="dash-search" data-dash="guide-q" placeholder="🔎 جستجو در راهنما…" value="${esc(ui.guideQuery || '')}" />
    <div data-dash="guide-results">${ui.guideQuery ? guideResultsHtml(ui.guideQuery) : ''}</div></div>
    <div class="dash-guide-layout">
      <nav class="dash-guide-nav">${GUIDE_CHAPTERS.map((c) => `<button class="dash-guide-link ${ch === c.id ? 'is-on' : ''}" data-action="guide-ch" data-v="${c.id}">${c.icon} ${c.title}</button>`).join('')}</nav>
      <div>${guideChapterHtml(ch, (ch === 'recipes' || ch === 'gloss') ? (ui.guideQuery || '') : '')}</div>
    </div>`;
  }

  function guideResultsHtml(q) {
    const res = guideSearchAll(q);
    if (!res.length) return '<div class="dash-empty">چیزی پیدا نشد.</div>';
    return res.map((r) => `<button class="dash-result" data-action="guide-goto" data-v="${r.chId}">
      <b>📖 ${esc(r.h)}</b><span>${esc(r.snippet)}</span><i>${esc(r.chTitle)}</i></button>`).join('');
  }

  /* ================= چرخه ================= */

  let refreshTimer = 0;
  function setupAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = 0;
    const mins = Number(ui.refreshMin) || 0;
    if (mins > 0 && ui.view === 'cockpit') {
      refreshTimer = setInterval(() => { if (!destroyed) reload(); }, mins * 60 * 1000);
    }
  }

  function rerenderShell() {
    if (destroyed || !root) return;
    const shell = root.querySelector('[data-dash="shell"]');
    if (!shell) return;
    const effTheme = autoThemeTick()?.id || normalizeThemeId(ui.theme);
    if (effTheme !== ui.theme) ui = saveDashUi({ theme: effTheme });
    applyTheme(effTheme);
    root.dataset.density = ui.density || 'comfortable';
    root.dataset.anim = ui.anim === false ? 'off' : 'on';
    setupAutoRefresh();
    shell.innerHTML = shellHtml();
    afterBodyRender();
  }

  function afterBodyRender() {
    if (!data) return;
    afterWidgetsRender(root, data);
    afterWidgets2Render(root, data);
    afterWidgets3Render(root, data);
    afterWidgets4Render(root, data);
    afterWidgets5Render(root);
    afterWidgets6Render(root);
    afterWidgets7Render(root);
    afterWidgets8Render(root);
    afterWidgets9Render(root);
    afterWidgets10Render(root);
    afterWidgets11Render(root);
    afterWidgets12Render(root);
    if (ui.view === 'report') afterReportRender(root);
    if (ui.view === 'remote') tickRemote(root);
    if (ui.view === 'settings') fillStorageOut(root);
  }

  function fillStorageOut(root) {
    const box = root.querySelector('[data-set="storage-out"]');
    if (!box) return;
    try {
      const groups = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        if (!k.startsWith('vixora:')) continue;
        const g = k.split(':')[1] || 'misc';
        groups[g] = (groups[g] || 0) + ((localStorage.getItem(k) || '').length * 2);
      }
      const total = Object.values(groups).reduce((a, b) => a + b, 0);
      const rows = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 8);
      box.innerHTML = `<div class="dash-kv"><span>💾 جمع کل</span><b>${(total / 1048576).toFixed(2)} MB</b></div>` +
        rows.map(([g, b]) => `<div class="dash-svg-bar-row"><span class="dash-svg-bar-l">${esc(g)}</span><span class="dash-svg-bar-t"><i style="width:${Math.max(2, Math.round(b / Math.max(1, total) * 100))}%;background:var(--d-c1)"></i></span><b class="dash-svg-bar-v">${(b / 1024).toFixed(0)}K</b></div>`).join('');
    } catch { box.innerHTML = '<div class="dash-hint">خطا در محاسبه.</div>'; }
  }

  async function reload() {
    invalidateDashData();
    try { data = await getDashData(true); } catch { /* ignore */ }
    rerenderShell();
  }

  function toast(msg) {
    const host = root?.querySelector('[data-dash="toast"]');
    if (!host) return;
    host.innerHTML = `<div class="dash-cmdk-foot" style="position:fixed;bottom:16px;right:16px;z-index:10001;background:#1a1430;border:1px solid var(--d-c1);border-radius:12px;padding:10px 16px;">${esc(msg)}</div>`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { if (host.isConnected) host.innerHTML = ''; }, 2800);
  }

  function api() {
    return {
      root, toast, data, ui, st,
      navigate: (h) => dashNavigate(h),
      gotoView: (v) => { ui = saveDashUi({ view: v, focusWidget: '' }); rerenderShell(); },
      rerender: () => rerenderShell(),
      reload,
      openCmdk,
      openGallery,
      cycleTheme,
      exportAll: () => handleWidgetAction('w-qa-export', {}, api()),
      startTour: () => { ui = saveDashUi({ view: 'cockpit' }); rerenderShell(); setTimeout(() => startTour(root, api()), 200); },
      showCredit: () => openCredit(),
    };
  }

  /* ---------- فرمان‌یاب ---------- */
  function openCmdk() {
    cmdkCommands = buildCommands(api());
    cmdkIdx = 0;
    const ov = root.querySelector('[data-dash="overlay"]');
    ov.innerHTML = renderCmdk(cmdkCommands);
    setTimeout(() => ov.querySelector('[data-cmdk="q"]')?.focus(), 30);
  }
  function closeCmdk() {
    const ov = root.querySelector('[data-dash="overlay"]');
    if (ov) ov.innerHTML = '';
  }
  function cmdkMove(d) {
    const items = root.querySelectorAll('.dash-cmdk-item');
    if (!items.length) return;
    cmdkIdx = (cmdkIdx + d + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle('is-sel', i === cmdkIdx));
    items[cmdkIdx]?.scrollIntoView({ block: 'nearest' });
  }
  function cmdkRunSel() {
    const items = root.querySelectorAll('.dash-cmdk-item');
    const sel = items[cmdkIdx];
    if (!sel) return;
    if (sel.dataset.action === 'cmdk-calc') {
      const v = sel.dataset.v;
      if (v) navigator.clipboard?.writeText(v).catch(() => null);
      toast(`📋 کپی شد: ${v}`);
      closeCmdk();
      return;
    }
    const id = sel.dataset.id;
    closeCmdk();
    runCommand(cmdkCommands, id, api());
  }

  /* ---------- گالری ---------- */
  function openGallery() {
    const map = new Map(layout.map((w) => [w.id, w]));
    const cards = Object.entries(ALL_META).map(([id, m]) => {
      const on = map.get(id)?.on;
      return `<div class="dash-gal-card ${on ? 'is-on' : ''}"><b>${m.icon} ${esc(m.title)}</b><span>${esc(m.desc)}</span>
        <button class="dash-btn dash-btn-sm ${on ? '' : 'dash-btn-primary'}" data-action="gal-toggle" data-id="${id}">${on ? '✕ مخفی' : '➕ افزودن'}</button></div>`;
    }).join('');
    const ov = root.querySelector('[data-dash="overlay"]');
    ov.innerHTML = `<div class="dash-modal" data-close-gallery><div class="dash-modal-panel" role="dialog" aria-label="گالری ویجت‌ها">
      <button class="dash-icon-btn dash-modal-x" data-action="gal-close">✕</button>
      <h3>🧩 گالری ویجت‌ها (${faDigits(String(Object.keys(ALL_META).length))})</h3>
      <input class="dash-search" data-dash="gal-q" placeholder="🔎 جستجوی ویجت…" style="margin-bottom:10px" />
      <div class="dash-gallery-grid" data-dash="gal-grid">${cards}</div></div></div>`;
    setTimeout(() => ov.querySelector('[data-dash="gal-q"]')?.focus(), 30);
  }
  function closeGallery() {
    const ov = root.querySelector('[data-dash="overlay"]');
    if (ov && ov.querySelector('[data-close-gallery]')) ov.innerHTML = '';
  }

  function cycleTheme() {
    const t = cycleThemeNew();
    ui = saveDashUi({ theme: t.id });
    rerenderShell();
    toast(`🎨 ${t.icon} ${t.name}`);
  }

  /* ================= رویدادها ================= */

  async function onClick(e) {
    // بستن اورلی‌ها با کلیک بیرون
    if (e.target.hasAttribute?.('data-close-cmdk') && e.target.classList.contains('dash-cmdk')) { closeCmdk(); return; }
    if (e.target.hasAttribute?.('data-close-gallery') && e.target.classList.contains('dash-modal')) { closeGallery(); return; }
    if (e.target.hasAttribute?.('data-close-welcome') && e.target.classList.contains('dash-modal')) { handleWelcomeAction('wc-close', e.target, api()); return; }
    const el = e.target.closest('[data-action]');
    if (!el || !root.contains(el)) return;
    const action = el.dataset.action;

    if (action === 'go') { dashNavigate(el.dataset.link); return; }
    if (action === 'view') { try { stopAmbient(); stopFocusTimer(); } catch { /* ignore */ } ui = saveDashUi({ view: el.dataset.v, focusWidget: '' }); rerenderShell(); return; }
    if (action === 'open-cmdk') { openCmdk(); return; }
    if (action === 'cmdk-close') { closeCmdk(); return; }
    if (action === 'cmdk-run') {
      const id = el.dataset.id;
      closeCmdk();
      runCommand(cmdkCommands, id, api());
      return;
    }
    if (action === 'cmdk-calc') {
      const v = el.dataset.v;
      if (v) navigator.clipboard?.writeText(v).catch(() => null);
      toast(`📋 کپی شد: ${v}`);
      closeCmdk();
      return;
    }
    if (action === 'open-gallery') { openGallery(); return; }
    if (action === 'gal-close') { closeGallery(); return; }
    if (action === 'gal-toggle') {
      const id = el.dataset.id;
      const w = layout.find((x) => x.id === id);
      if (w) { w.on = !w.on; saveLayout(layout); }
      logActivity('🧩', `ویجت «${ALL_META[id]?.title}» ${w.on ? 'روشن' : 'خاموش'} شد`);
      openGallery();
      rerenderShell();
      // گالری را نگه دار
      openGallery();
      return;
    }
    if (action === 'cycle-theme') { cycleTheme(); return; }
    if (action === 'reload') { await reload(); toast('🔄 تازه شد.'); return; }
    if (action === 'show-credit') { openCredit(); return; }
    if (action === 'credit-close') { closeCredit(); return; }
    if (action === 'credit-copy') {
      try { await navigator.clipboard.writeText(creditLineText()); toast('📋 کپی شد.'); } catch { /* ignore */ }
      return;
    }
    // ویجت: اندازه/تمرکز/مخفی
    if (action === 'w-size') {
      const w = layout.find((x) => x.id === el.dataset.id);
      if (w) {
        const order = ['s', 'm', 'l', 'xl'];
        w.size = order[(order.indexOf(w.size || 'm') + 1) % order.length];
        saveLayout(layout);
        rerenderShell();
      }
      return;
    }
    if (action === 'w-hide') {
      const w = layout.find((x) => x.id === el.dataset.id);
      if (w) { w.on = false; saveLayout(layout); rerenderShell(); toast('ویجت مخفی شد. از 🧩 برمی‌گردد.'); }
      return;
    }
    if (action === 'w-focus') {
      ui = saveDashUi({ focusWidget: el.dataset.id });
      rerenderShell();
      return;
    }
    if (action === 'w-unfocus') {
      ui = saveDashUi({ focusWidget: '' });
      rerenderShell();
      return;
    }
    // راهنما
    if (action === 'guide-ch') { ui = saveDashUi({ guideChapter: el.dataset.v }); rerenderShell(); return; }
    if (action === 'guide-goto') {
      ui = saveDashUi({ guideChapter: el.dataset.v, guideQuery: '' });
      rerenderShell();
      return;
    }
    // تور
    if (action.startsWith('tour-')) { handleTourAction(action, root, api()); return; }
    // گزارش
    if (action.startsWith('rp-')) { handleReportAction(action, el, api()); return; }
    // تنظیمات
    if (action.startsWith('set-')) { handleSettingsAction(action, el, api()); return; }
    // ویزارد خوش‌آمد
    if (action.startsWith('wc-')) { handleWelcomeAction(action, el, api()); return; }
    // اکشن‌های ویجت/ریموت/ژورنال
    if (action.startsWith('w-') || action.startsWith('r-') || action.startsWith('j-') || action.startsWith('cal-') || action.startsWith('hb-') || action.startsWith('f-') || action.startsWith('gl-') || action.startsWith('rv-')) {
      const handled = await handleWidgetAction(action, el, api()).catch(() => false);
      if (!handled) toast('این دکمه هنوز کاری ندارد!');
      return;
    }
  }

  function onInput(e) {
    const galQ = e.target.closest?.('[data-dash="gal-q"]');
    if (galQ) {
      const q = galQ.value.trim().toLowerCase();
      root.querySelectorAll('.dash-gal-card').forEach((card) => {
        card.style.display = !q || card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      return;
    }
    const gq = e.target.closest?.('[data-dash="guide-q"]');
    if (gq) {
      clearTimeout(onInput._g);
      onInput._g = setTimeout(() => {
        ui = saveDashUi({ guideQuery: gq.value });
        const box = root.querySelector('[data-dash="guide-results"]');
        if (box) box.innerHTML = gq.value.trim() ? guideResultsHtml(gq.value) : '';
      }, 300);
      return;
    }
    const cq = e.target.closest?.('[data-cmdk="q"]');
    if (cq) {
      cmdkIdx = 0;
      const list = root.querySelector('[data-cmdk="list"]');
      if (list) list.innerHTML = cmdkListHtml(filterCommands(cmdkCommands, cq.value), cq.value);
      return;
    }
    const w = e.target.closest?.('[data-dash]');
    if (w && ['gq', 'calc', 'mn-vol', 'focus', 'fx-amt', 'balance', 'r-vol', 'r-seek', 'r-bal'].includes(w.dataset.dash)) {
      handleWidgetInput(w, api());
    }
  }

  function onChange(e) {
    if (e.target.matches?.('[data-xp-file]')) {
      const f = e.target.files?.[0];
      if (f && confirm('⚠️ بکاپ جایگزین داده فعلی می‌شود. ادامه می‌دهی؟')) {
        importBackup(f).then((n) => { toast(`✅ ${n} کلید بازیابی شد. صفحه رفرش می‌شود…`); setTimeout(() => location.reload(), 1200); }).catch(() => toast('❌ فایل معتبر نیست.'));
      } else { e.target.value = ''; }
      return;
    }
    if (e.target.matches?.('[data-set]')) {
      if (handleSettingsChange(e.target, api())) return;
      if (['greetName', 'clock24', 'showSeconds'].includes(e.target.dataset.set)) {
        const patch = {};
        if (e.target.dataset.set === 'greetName') patch.greetName = e.target.value.trim().slice(0, 30);
        else patch[e.target.dataset.set] = e.target.checked;
        ui = saveDashUi(patch);
        toast('💾 ذخیره شد.');
      }
      return;
    }
    const w = e.target.closest?.('[data-dash]');
    if (w && ['mn-vol', 'balance'].includes(w.dataset.dash)) handleWidgetInput(w, api());
  }

  function onKeydown(e) {
    // داخل اورلی cmdk
    if (root.querySelector('.dash-cmdk')) {
      if (e.key === 'Escape') { closeCmdk(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdkMove(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); cmdkMove(-1); return; }
      if (e.key === 'Enter' && e.target.closest?.('[data-cmdk="q"]')) { e.preventDefault(); cmdkRunSel(); return; }
    }
    if (isCreditOpen()) {
      if (e.key === 'Escape') closeCredit();
      return;
    }
    if (e.key === 'Escape') {
      if (root.querySelector('[data-close-gallery]')) { closeGallery(); return; }
      if (ui.focusWidget) { ui = saveDashUi({ focusWidget: '' }); rerenderShell(); return; }
      if (isTourActive()) { stopTour(root); return; }
    }
    // ورودی‌های ویجت
    if (handleWidgetKeydown(e, api())) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); return; }
    if (typing) return;
    if (e.key === '?') { ui = saveDashUi({ view: 'guide', focusWidget: '' }); rerenderShell(); return; }
    if (pendingG) {
      pendingG = false;
      const map = { d: '/tools/dashboard', n: '/tools/note', m: '/tools/music', f: '/tools/invoices', c: '/tools/customerInfo', b: '/tools/building', a: '/tools/entertainment' };
      const link = map[e.key.toLowerCase()];
      if (link) dashNavigate(link);
      return;
    }
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) { pendingG = true; setTimeout(() => { pendingG = false; }, 1200); return; }
    if (e.key.toLowerCase() === 't' && ui.view === 'cockpit') { cycleTheme(); return; }
    if (e.key.toLowerCase() === 'n') { ui = saveDashUi({ view: 'notify', focusWidget: '' }); rerenderShell(); return; }
    if (e.key.toLowerCase() === 'i') { ui = saveDashUi({ view: 'insights', focusWidget: '' }); rerenderShell(); return; }
    if (e.key.toLowerCase() === 'r' && ui.view === 'cockpit') { reload(); return; }
  }

  /* ---------- درگ‌اندراپ ---------- */
  function onDragStart(e) {
    const handle = e.target.closest?.('.dash-w-drag');
    if (!handle) return;
    const card = handle.closest('[data-widget]');
    if (!card) return;
    dragId = card.dataset.widget;
    card.classList.add('dragging');
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); } catch { /* ignore */ }
  }
  function onDragOver(e) {
    if (!dragId) return;
    const card = e.target.closest?.('[data-widget]');
    if (!card || card.dataset.widget === dragId) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch { /* ignore */ }
  }
  function onDrop(e) {
    if (!dragId) return;
    const card = e.target.closest?.('[data-widget]');
    if (!card) return;
    e.preventDefault();
    const from = layout.findIndex((w) => w.id === dragId);
    const to = layout.findIndex((w) => w.id === card.dataset.widget);
    if (from >= 0 && to >= 0 && from !== to) {
      const [moved] = layout.splice(from, 1);
      layout.splice(to, 0, moved);
      saveLayout(layout);
      logActivity('↔️', `جابه‌جایی ویجت «${ALL_META[dragId]?.title}»`);
      rerenderShell();
    }
    dragId = null;
  }
  function onDragEnd() {
    dragId = null;
    root.querySelectorAll('.dragging').forEach((el) => el.classList.remove('dragging'));
  }

  /* ================= afterRender / destroy ================= */

  async function afterRender() {
    root = document.querySelector('.dash-root')?.parentElement || document.getElementById('app');
    const host = document.querySelector('.dash-root');
    if (!host) return;
    root = host;
    releaseCss = injectScopedCss(dashCss, 'cockpit-page');
    // draggable روی دستگیره‌ها (delegation با dragstart)
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('dragover', onDragOver);
    root.addEventListener('drop', onDrop);
    root.addEventListener('dragend', onDragEnd);
    // دستگیره‌ها draggable
    const markDraggable = () => root.querySelectorAll('.dash-w-drag').forEach((h) => { h.setAttribute('draggable', 'true'); });
    const mo = new MutationObserver(markDraggable);
    mo.observe(root, { childList: true, subtree: true });
    root._dashMo = mo;

    rerenderShell();
    try { data = await getDashData(); } catch { /* ignore */ }
    if (destroyed) return;
    rerenderShell();
    markDraggable();
    startDashTimers(root, api());
    try { applyTheme(currentThemeId()); autoThemeTick(); } catch { /* ignore */ }
    try { runAutomations(); scanReminders(); } catch { /* ignore */ }
    try { const { fresh } = checkAchievements(); if (fresh.length) setTimeout(() => celebrateFresh(fresh), 2500); } catch { /* ignore */ }
    try { maybeDigest(); } catch { /* ignore */ }
    try { if (hasUnseen()) setTimeout(() => { if (!destroyed) toast('✨ نسخه ۲٫۰! تب «تازه‌ها» را ببین!'); }, 6000); } catch { /* ignore */ }
    try { const { maybeWeeklySummary, updateNotifyBadge } = await import('./dash-notify.js'); if (maybeWeeklySummary()) updateNotifyBadge(); } catch { /* ignore */ }
    try { updateNotifyBadge(); } catch { /* ignore */ }
    logActivity('🛩', 'ورود به کاکپیت');
    try { localStorage.setItem('vixora:dash-visits', String(+(localStorage.getItem('vixora:dash-visits') || 0) + 1)); } catch { /* ignore */ }
    try { maybeWelcome(root); } catch { /* ignore */ }
    if (!tourDone()) {
      setTimeout(() => { if (!destroyed) startTour(root, api()); }, 600);
    }
  }

  function destroy() {
    destroyed = true;
    try { stopAmbient(); stopFocusTimer(); } catch { /* ignore */ }
    clearInterval(refreshTimer);
    stopDashTimers();
    stopTour(root || document);
    closeCredit();
    closeCmdk();
    try { closeWelcome(root); } catch { /* ignore */ }
    try { root._dashMo?.disconnect(); } catch { /* ignore */ }
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
      root.removeEventListener('change', onChange);
      root.removeEventListener('dragstart', onDragStart);
      root.removeEventListener('dragover', onDragOver);
      root.removeEventListener('drop', onDrop);
      root.removeEventListener('dragend', onDragEnd);
    }
    document.removeEventListener('keydown', onKeydown);
    if (releaseCss) releaseCss();
  }

  return { render, afterRender, destroy };
}
