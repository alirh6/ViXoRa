// ViXoRa Arcade — لانچر تمام‌صفحه بازی (از هاب و از خانه استفاده می‌شود)
import { gameById, gameTitle, getBest, setBest, bumpPlays, getPlays, pnum, sfx, isMuted, toggleMute, arcLang } from './arcade.js';
import { arcadeCss } from './arcade.css.js';
import { injectScopedCss } from '../../../utilities/css-scope.js';

const LOADERS = {
  'snake': () => import('./games/g-snake.js'),
  '2048': () => import('./games/g-2048.js'),
  'memory': () => import('./games/g-memory.js'),
  'flappy': () => import('./games/g-flappy.js'),
  'breakout': () => import('./games/g-breakout.js'),
  'stack': () => import('./games/g-stack.js'),
  'dino-run': () => import('./games/g-dino.js'),
  'fruit-slice': () => import('./games/g-fruit.js'),
  'simon': () => import('./games/g-simon.js'),
  'reflex': () => import('./games/g-reflex.js'),
  'aim-trainer': () => import('./games/g-aim.js'),
  'subway-run': () => import('./games/g-subway.js'),
  'slither': () => import('./games/g-slither.js'),
  'geo-dash': () => import('./games/g-geodash.js'),
  'hill-climb': () => import('./games/g-hill.js'),
  'air-hockey': () => import('./games/g-airhockey.js'),
  'angry-sling': () => import('./games/g-sling.js'),
  'bomber': () => import('./games/g-bomber.js'),
  'tank-battle': () => import('./games/g-tank.js'),
  'pacman': () => import('./games/g-pacman.js'),
  'star-def': () => import('./games/g-stardef.js'),
  'neon-racer': () => import('./games/g-racer.js'),
  'neon-survivors': () => import('./games/g-survivors.js'),
  'sudoku': () => import('./games/g-sudoku.js'),
  'bubble-shooter': () => import('./games/g-bubbles.js'),
};

let stage = null;
let destroyGame = null;
let escHandler = null;
let prevOverflow = '';

export function isGameOpen() { return !!stage; }

export function loaderIds() { return Object.keys(LOADERS); }

export async function openArcadeGame(id) {
  const g = gameById(id);
  if (!g || !LOADERS[id]) return false;
  closeArcadeGame();
  sfx.unlock();
  sfx.click();
  const lang = arcLang();
  const fa = lang !== 'en';

  injectScopedCss(arcadeCss, 'arcade');
  prevOverflow = document.documentElement.style.overflow || '';
  document.documentElement.style.overflow = 'hidden';

  stage = document.createElement('div');
  stage.className = 'ag-stage';
  stage.style.setProperty('--h', String(g.hue));
  stage.setAttribute('role', 'dialog');
  stage.setAttribute('aria-label', gameTitle(g, lang));
  stage.innerHTML =
    '<div class="ag-stage__head">' +
    '<div class="ag-stage__title"><span class="ag-ico">' + g.icon + '</span><span>' + gameTitle(g, lang) +
    '<small>🏆 <span data-ag-best>' + pnum(getBest(id)) + '</span></small></span></div>' +
    '<button class="ag-hbtn" type="button" data-ag-mute title="' + (fa ? 'صدا' : 'Sound') + '">🔊<span class="ag-hbtn__txt">' + (fa ? 'صدا' : 'Sound') + '</span></button>' +
    '<button class="ag-hbtn" type="button" data-ag-restart title="' + (fa ? 'از اول' : 'Restart') + '">↻<span class="ag-hbtn__txt">' + (fa ? 'از اول' : 'Restart') + '</span></button>' +
    '<button class="ag-hbtn ag-hbtn--exit" type="button" data-ag-exit title="' + (fa ? 'برگشت به بازی‌ها (Esc)' : 'Back to games (Esc)') + '">✕<span class="ag-hbtn__txt">' + (fa ? 'خروج' : 'Exit') + '</span></button>' +
    '</div><div class="ag-stage__body" data-ag-body></div>';
  document.body.appendChild(stage);

  const syncMute = () => {
    const b = stage.querySelector('[data-ag-mute]');
    if (b) b.firstChild.textContent = isMuted() ? '🔇' : '🔊';
  };
  syncMute();
  stage.querySelector('[data-ag-mute]').addEventListener('click', () => { toggleMute(); syncMute(); sfx.click(); });
  stage.querySelector('[data-ag-exit]').addEventListener('click', () => closeArcadeGame());
  stage.querySelector('[data-ag-restart]').addEventListener('click', () => { sfx.click(); void mountGame(); });
  escHandler = (e) => {
    if (e.key === 'Escape' && stage) { e.stopPropagation(); closeArcadeGame(); }
  };
  window.addEventListener('keydown', escHandler, true);

  async function mountGame() {
    if (!stage) return;
    if (destroyGame) { try { destroyGame(); } catch { /* ignore */ } destroyGame = null; }
    const body = stage.querySelector('[data-ag-body]');
    body.innerHTML = '<div class="ag-game"><div class="ag-pill">⏳ ' + (fa ? 'در حال بارگذاری…' : 'Loading…') + '</div></div>';
    try {
      const mod = await LOADERS[id]();
      if (!stage || !body.isConnected) return;
      body.innerHTML = '';
      const api = {
        id, lang,
        sfx,
        getBest: () => getBest(id),
        submitScore(v) {
          const r = setBest(id, v);
          const el = stage && stage.querySelector('[data-ag-best]');
          if (el) el.textContent = pnum(r.value);
          return r;
        },
        exit: () => closeArcadeGame(),
      };
      destroyGame = mod.mount(body, api) || null;
      bumpPlays(id);
    } catch (err) {
      if (!body.isConnected) return;
      body.innerHTML = '<div class="ag-game"><div class="ag-overlay"><h2>😢</h2><p>' +
        (fa ? 'بازی بارگذاری نشد. دوباره تلاش کن.' : 'Failed to load. Try again.') +
        '</p><button class="ag-btn ag-btn--primary" type="button" data-ag-retry>' + (fa ? 'تلاش دوباره' : 'Retry') + '</button></div></div>';
      const rb = body.querySelector('[data-ag-retry]');
      if (rb) rb.addEventListener('click', () => void mountGame());
    }
  }
  await mountGame();
  return true;
}

export function closeArcadeGame() {
  if (destroyGame) { try { destroyGame(); } catch { /* ignore */ } destroyGame = null; }
  if (escHandler) { window.removeEventListener('keydown', escHandler, true); escHandler = null; }
  if (stage) { stage.remove(); stage = null; }
  try { document.documentElement.style.overflow = prevOverflow; } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('vixora:arcade-closed')); } catch { /* ignore */ }
}

export function arcadePlays(id) { return getPlays(id); }
