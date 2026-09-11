// ViXoRa — صفحه سرگرمی / آرکید بازی‌ها 🎮
import { GAMES, gameTitle, gameDesc, getBest, getPlays, totalPlays, pnum, arcLang, sfx, escapeHtml } from './arcade.js';
import { arcadeCss } from './arcade.css.js';
import { openArcadeGame, closeArcadeGame } from './launch.js';
import { injectScopedCss } from '../../../utilities/css-scope.js';

export function createEntertainmentPage(ctx) {
  void ctx;
  let releaseCss = null;
  let root = null;
  let filter = 'all';
  let query = '';

  const fa = () => arcLang() !== 'en';

  function catLabel(cat) {
    const f = fa();
    if (cat === 'light') return f ? 'سبک' : 'Light';
    if (cat === 'heavy') return f ? 'سنگین' : 'Heavy';
    return f ? 'جایزه' : 'Bonus';
  }

  function statsHtml() {
    const f = fa();
    const records = GAMES.filter((g) => getBest(g.id) > 0).length;
    return (
      '<div class="ag-stat">🎮 <b>' + pnum(GAMES.length) + '</b> ' + (f ? 'بازی' : 'games') + '</div>' +
      '<div class="ag-stat">▶️ <b>' + pnum(totalPlays()) + '</b> ' + (f ? 'دفعات بازی' : 'plays') + '</div>' +
      '<div class="ag-stat">🏆 <b>' + pnum(records) + '</b> ' + (f ? 'رکورد ثبت‌شده' : 'records') + '</div>'
    );
  }

  function cardHtml(g) {
    const lang = arcLang();
    const best = getBest(g.id);
    const plays = getPlays(g.id);
    const f = fa();
    return (
      '<button type="button" class="ag-card" style="--h:' + g.hue + '" data-ag-open="' + g.id + '">' +
      '<span class="ag-card__cat">' + catLabel(g.cat) + '</span>' +
      '<div class="ag-card__icon">' + g.icon + '</div>' +
      '<h3>' + escapeHtml(gameTitle(g, lang)) + '</h3>' +
      '<p>' + escapeHtml(gameDesc(g, lang)) + '</p>' +
      '<div class="ag-card__meta"><span class="ag-best">🏆 ' + pnum(best) + '</span><span class="ag-plays">▶ ' + pnum(plays) + '</span></div>' +
      '<span class="ag-card__play">▶ ' + (f ? 'بازی کن' : 'Play') + '</span>' +
      '</button>'
    );
  }

  function gridHtml() {
    const lang = arcLang();
    const q = query.trim().toLowerCase();
    const list = GAMES.filter((g) => {
      if (filter !== 'all' && g.cat !== filter) return false;
      if (!q) return true;
      return (g.fa + ' ' + g.en + ' ' + g.descFa + ' ' + g.descEn).toLowerCase().includes(q);
    });
    if (!list.length) {
      return '<div class="ag-empty">' + (fa() ? '😕 چیزی پیدا نشد. یه چیز دیگه رو امتحان کن!' : '😕 Nothing found.') + '</div>';
    }
    void lang;
    return list.map(cardHtml).join('');
  }

  function render() {
    const f = fa();
    return (
      '<div class="ag-hub" id="agHub">' +
      '<div class="ag-hero"><span class="ag-hero__kicker">' + (f ? '🎮 شهربازی ViXoRa' : '🎮 ViXoRa Arcade') + '</span>' +
      '<h1>' + (f ? 'کدوم بازی امشب؟' : 'What to play tonight?') + '</h1>' +
      '<p>' + (f ? 'از بلاک‌بلستِ قفلی تا مسابقه شبه‌س‌بعدی؛ بدون نصب، روی گوشی و کامپیوتر. رکورد بزن و برگرد بالاترش ببر! 🏆' : 'From addictive puzzlers to pseudo-3D racing. No install, phone or desktop. Set records! 🏆') + '</p>' +
      '<div class="ag-stats" data-ag-stats>' + statsHtml() + '</div></div>' +
      '<div class="ag-bar"><label class="ag-search">🔎<input type="search" data-ag-q placeholder="' + (f ? 'جستجوی بازی…' : 'Search games…') + '"></label>' +
      '<div class="ag-chips" data-ag-chips>' +
      '<button type="button" class="ag-chip is-on" data-ag-f="all">' + (f ? 'همه' : 'All') + '</button>' +
      '<button type="button" class="ag-chip" data-ag-f="light">' + (f ? '⚡ سبک' : '⚡ Light') + '</button>' +
      '<button type="button" class="ag-chip" data-ag-f="heavy">' + (f ? '🔥 سنگین' : '🔥 Heavy') + '</button>' +
      '<button type="button" class="ag-chip" data-ag-f="bonus">' + (f ? '🎁 جایزه' : '🎁 Bonus') + '</button>' +
      '</div></div>' +
      '<div class="ag-grid" data-ag-grid>' + gridHtml() + '</div>' +
      '</div>'
    );
  }

  function refresh() {
    if (!root) return;
    const st = root.querySelector('[data-ag-stats]');
    if (st) st.innerHTML = statsHtml();
    const gr = root.querySelector('[data-ag-grid]');
    if (gr) gr.innerHTML = gridHtml();
  }

  function onClosed() { refresh(); }
  function onClick(e) {
    const chip = e.target.closest('[data-ag-f]');
    if (chip) {
      sfx.click();
      filter = chip.getAttribute('data-ag-f');
      root.querySelectorAll('[data-ag-f]').forEach((c) => c.classList.toggle('is-on', c === chip));
      const gr = root.querySelector('[data-ag-grid]');
      if (gr) gr.innerHTML = gridHtml();
      return;
    }
    const card = e.target.closest('[data-ag-open]');
    if (card) {
      const id = card.getAttribute('data-ag-open');
      void openArcadeGame(id).then((ok) => { if (ok) refresh(); });
    }
  }
  function onInput(e) {
    if (e.target && e.target.matches('[data-ag-q]')) {
      query = e.target.value || '';
      const gr = root.querySelector('[data-ag-grid]');
      if (gr) gr.innerHTML = gridHtml();
    }
  }

  function afterRender() {
    releaseCss = injectScopedCss(arcadeCss, 'arcade');
    root = document.getElementById('agHub');
    if (!root) return;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    window.addEventListener('vixora:arcade-closed', onClosed);
  }

  function destroy() {
    window.removeEventListener('vixora:arcade-closed', onClosed);
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
    }
    closeArcadeGame();
    if (releaseCss) releaseCss();
    releaseCss = null;
    root = null;
  }

  return { render, afterRender, destroy };
}
