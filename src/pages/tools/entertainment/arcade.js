// ViXoRa Arcade — رجیستری، رکوردها، صدا و ابزار مشترک بازی‌ها
// ⚠️ این ماژول هنگام import به DOM دست نمی‌زند (تست‌پذیر در node)

export const GAMES = [
  // ---------- سبک (۱۱) ----------
  { id: 'snake', icon: '🐍', cat: 'light', hue: 140, fa: 'مار', en: 'Snake', descFa: 'کلاسیک ابدی با سرعت تصاعدی و مراحل', descEn: 'The eternal classic with ramping speed' },
  { id: '2048', icon: '🎲', cat: 'light', hue: 35, fa: '۲۰۴۸', en: '2048', descFa: 'ادغام کن تا به ۲۰۴۸ برسی! قفلی‌ترین پازل اعداد', descEn: 'Merge tiles to reach 2048!' },
  { id: 'memory', icon: '🃏', cat: 'light', hue: 280, fa: 'حافظه', en: 'Memory', descFa: 'جفت‌ها رو پیدا کن؛ سه اندازه صفحه', descEn: 'Find the pairs; three board sizes' },
  { id: 'flappy', icon: '🐤', cat: 'light', hue: 55, fa: 'پرنده', en: 'Flappy', descFa: 'بال بزن و از لوله‌ها رد شو!', descEn: 'Flap through the pipes!' },
  { id: 'breakout', icon: '🧷', cat: 'light', hue: 180, fa: 'آجربریک', en: 'Breakout', descFa: 'توپ رو نگه دار و آجرها رو بشکن', descEn: 'Keep the ball alive, smash the bricks' },
  { id: 'stack', icon: '🗼', cat: 'light', hue: 210, fa: 'برج', en: 'Stack', descFa: 'با یه ضربه برج بساز؛ دقت = ارتفاع', descEn: 'One-tap tower stacking' },
  { id: 'dino-run', icon: '🦖', cat: 'light', hue: 120, fa: 'دایناسور', en: 'Dino Run', descFa: 'بدو و بپر! شب و روز میشه و سرعت میره بالا', descEn: 'Endless runner with day/night cycle' },
  { id: 'fruit-slice', icon: '🍉', cat: 'light', hue: 340, fa: 'میوه‌قاچ', en: 'Fruit Slice', descFa: 'میوه‌ها رو قاچ کن، بمب‌ها رو نه!', descEn: 'Slice fruits, dodge bombs!' },
  { id: 'simon', icon: '🎹', cat: 'light', hue: 45, fa: 'سایمون', en: 'Simon', descFa: 'دنباله رنگ و صدا رو تکرار کن', descEn: 'Repeat the color-tone sequence' },
  { id: 'reflex', icon: '⚡', cat: 'light', hue: 60, fa: 'رفلکس', en: 'Reflex', descFa: 'سرعت واکنشت رو در ۵ راند بسنج', descEn: 'Measure your reaction in 5 rounds' },
  { id: 'aim-trainer', icon: '🎯', cat: 'light', hue: 150, fa: 'نشانه‌گیری', en: 'Aim Trainer', descFa: '۳۰ ثانیه؛ هرچی هدف بیشتر، امتیاز بیشتر', descEn: '30 seconds of pure aim' },
  // ---------- سنگین (۱۲) ----------
  { id: 'subway-run', icon: '🛹', cat: 'heavy', hue: 210, fa: 'موج‌سوار مترو', en: 'Subway Rush', descFa: 'از قطار فرار کن! پرش، غلت و پاورآپ', descEn: 'Dodge trains! Jump, roll, powerups' },
  { id: 'slither', icon: '🐍', cat: 'heavy', hue: 130, fa: 'کرم', en: 'Slither Arena', descFa: 'بخور و بزرگ شو؛ ۷ حریف ناقلا!', descEn: 'Eat and grow vs 7 sneaky rivals' },
  { id: 'geo-dash', icon: '📐', cat: 'heavy', hue: 180, fa: 'دش هندسی', en: 'Geo Dash', descFa: 'یک دکمه، هزار مرگ! رانر ریتمی', descEn: 'One button, a thousand deaths!' },
  { id: 'hill-climb', icon: '🚜', cat: 'heavy', hue: 90, fa: 'صعود تپه', en: 'Hill Climb', descFa: 'پشتک بزن، سکه جمع کن، ماشینو تقویت کن', descEn: 'Backflip, earn coins, upgrade your ride' },
  { id: 'air-hockey', icon: '🏒', cat: 'heavy', hue: 200, fa: 'هاکی هوایی', en: 'Air Hockey', descFa: 'ضد هوش مصنوعی ۳ سطحه؛ اول به ۷!', descEn: 'Vs 3-level AI; first to 7!' },
  { id: 'angry-sling', icon: '🐦', cat: 'heavy', hue: 10, fa: 'منجنیق', en: 'Slingshot Siege', descFa: 'قلعه خوک‌ها رو با ۸ مرحله خراب کن', descEn: 'Siege the pig fortress: 8 levels' },
  { id: 'bomber', icon: '💣', cat: 'heavy', hue: 30, fa: 'بمب‌افکن', en: 'Bomber', descFa: 'بمب زنجیره‌ای، پاورآپ و در خروج', descEn: 'Chain bombs, powerups, exit door' },
  { id: 'tank-battle', icon: '🛡️', cat: 'heavy', hue: 220, fa: 'نبرد تانک', en: 'Tank Battle', descFa: 'از پایگاه دفاع کن؛ ۴ نوع دشمن!', descEn: 'Defend the base vs 4 foe types!' },
  { id: 'pacman', icon: '👻', cat: 'heavy', hue: 50, fa: 'پک‌من', en: 'Pac Maze', descFa: 'هزارتو، ۴ روح باهوش و گیلاس‌ها', descEn: 'Maze chase with 4 smart ghosts' },
  { id: 'star-def', icon: '🚀', cat: 'heavy', hue: 190, fa: 'مدافع ستارگان', en: 'Star Defender', descFa: 'شوتر فضایی: موج‌ها، پاورآپ و باس', descEn: 'Space shooter: waves, powerups, bosses' },
  { id: 'neon-racer', icon: '🏎️', cat: 'heavy', hue: 300, fa: 'مسابقه نئون', en: 'Neon Racer', descFa: 'مسابقه شبه‌س‌بعدی! باورت نمیشه بدون نصبه', descEn: 'Pseudo-3D racing. No install. Believe it.' },
  { id: 'neon-survivors', icon: '🌌', cat: 'heavy', hue: 260, fa: 'بازماندگان نئون', en: 'Neon Survivors', descFa: 'جلوی سیل دشمن‌ها دووم بیار و آپگرید شو!', descEn: 'Survive the swarm, draft upgrades!' },
  // ---------- جایزه (۲) ----------
  { id: 'sudoku', icon: '🔢', cat: 'bonus', hue: 220, fa: 'سودوکو', en: 'Sudoku', descFa: 'تولید نامحدود؛ سه سختی + راهنما', descEn: 'Endless puzzles, hints included' },
  { id: 'bubble-shooter', icon: '🫧', cat: 'bonus', hue: 195, fa: 'حباب‌زن', en: 'Bubble Shooter', descFa: 'نشونه بگیر و حباب‌ها رو بترکون', descEn: 'Aim, bounce and pop!' },
];

export function gameById(id) {
  return GAMES.find((g) => g.id === id) || null;
}

export function arcLang() {
  try {
    const d = (typeof document !== 'undefined' && document.documentElement.getAttribute('lang')) || '';
    if (d.toLowerCase().startsWith('en')) return 'en';
    const s = (typeof localStorage !== 'undefined' && (localStorage.getItem('vixora:lang') || localStorage.getItem('vixora:layout-lang'))) || '';
    if (String(s).toLowerCase().startsWith('en')) return 'en';
  } catch { /* ignore */ }
  return 'fa';
}

export function gameTitle(g, lang) {
  const l = lang || arcLang();
  return l === 'en' ? g.en : g.fa;
}
export function gameDesc(g, lang) {
  const l = lang || arcLang();
  return l === 'en' ? g.descEn : g.descFa;
}

/* ---------------- رکورد و آمار ---------------- */
const K = (s) => 'vixora:arcade:' + s;
function lsGet(k, fb) {
  try {
    const v = localStorage.getItem(K(k));
    return v === null ? fb : v;
  } catch { return fb; }
}
function lsSet(k, v) {
  try { localStorage.setItem(K(k), String(v)); } catch { /* ignore */ }
}
export function getBest(id) {
  const n = Number(lsGet('best:' + id, 0));
  return Number.isFinite(n) ? n : 0;
}
export function setBest(id, v) {
  const cur = getBest(id);
  if (v > cur) { lsSet('best:' + id, v); return { value: v, record: cur > 0 }; }
  return { value: cur, record: false };
}
export function getPlays(id) {
  const n = Number(lsGet('plays:' + id, 0));
  return Number.isFinite(n) ? n : 0;
}
export function bumpPlays(id) {
  const n = getPlays(id) + 1;
  lsSet('plays:' + id, n);
  return n;
}
export function totalPlays() {
  return GAMES.reduce((s, g) => s + getPlays(g.id), 0);
}
export function getFeatured() {
  try {
    const raw = lsGet('featured', '');
    const arr = JSON.parse(raw || 'null');
    if (Array.isArray(arr)) {
      const ok = arr.filter((id) => gameById(id)).slice(0, 2);
      if (ok.length === 2) return ok;
    }
  } catch { /* ignore */ }
  return ['block-blast', 'neon-survivors'];
}
export function setFeatured(arr) {
  const ok = (arr || []).filter((id) => gameById(id)).slice(0, 2);
  if (ok.length === 2) lsSet('featured', JSON.stringify(ok));
  return getFeatured();
}

/* ---------------- موتور صدا (WebAudio، بدون فایل) ---------------- */
let AC = null;
let muted = lsGet('mute', '0') === '1';
export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  lsSet('mute', muted ? '1' : '0');
  return muted;
}
function ac() {
  if (typeof window === 'undefined') return null;
  try {
    if (!AC) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      AC = new Ctor();
    }
    if (AC.state === 'suspended') void AC.resume();
    return AC;
  } catch { return null; }
}
function tone({ f = 440, f2 = 0, d = 0.12, type = 'sine', vol = 0.18, at = 0 } = {}) {
  if (muted) return;
  const ctx = ac();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(30, f), t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + d + 0.05);
  } catch { /* ignore */ }
}
function noise({ d = 0.25, vol = 0.2, at = 0, lp = 1200 } = {}) {
  if (muted) return;
  const ctx = ac();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + at;
    const len = Math.max(1, Math.floor(ctx.sampleRate * d));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = lp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    src.connect(flt).connect(g).connect(ctx.destination);
    src.start(t0);
  } catch { /* ignore */ }
}
export const sfx = {
  unlock() { ac(); },
  click() { tone({ f: 660, d: 0.06, type: 'triangle', vol: 0.12 }); },
  pop() { tone({ f: 520, f2: 990, d: 0.09, type: 'square', vol: 0.1 }); },
  place() { tone({ f: 330, d: 0.07, type: 'triangle', vol: 0.14 }); },
  point() { tone({ f: 880, f2: 1320, d: 0.08, type: 'sine', vol: 0.14 }); },
  coin() { tone({ f: 990, d: 0.08 }); tone({ f: 1320, d: 0.14, at: 0.07 }); },
  jump() { tone({ f: 300, f2: 640, d: 0.12, type: 'square', vol: 0.08 }); },
  shoot() { tone({ f: 920, f2: 240, d: 0.1, type: 'sawtooth', vol: 0.06 }); },
  hit() { tone({ f: 220, f2: 90, d: 0.2, type: 'sawtooth', vol: 0.16 }); noise({ d: 0.15, vol: 0.1 }); },
  boom() { noise({ d: 0.4, vol: 0.22, lp: 900 }); tone({ f: 160, f2: 40, d: 0.4, type: 'sine', vol: 0.2 }); },
  flip() { tone({ f: 500, f2: 700, d: 0.06, type: 'triangle', vol: 0.1 }); },
  clear() { [523, 659, 784, 1046].forEach((f, i) => tone({ f, d: 0.12, at: i * 0.06, vol: 0.13 })); },
  level() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone({ f, d: 0.14, at: i * 0.07, vol: 0.13 })); },
  win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone({ f, d: 0.16, at: i * 0.09, vol: 0.14 })); },
  lose() { [420, 340, 270, 200].forEach((f, i) => tone({ f, d: 0.2, at: i * 0.12, type: 'triangle', vol: 0.14 })); },
  tick() { tone({ f: 1200, d: 0.03, type: 'square', vol: 0.05 }); },
  beep(f, d = 0.18) { tone({ f, d, type: 'sine', vol: 0.2 }); },
};

/* ---------------- ابزار مشترک ---------------- */
export function rand(a, b) { return a + Math.random() * (b - a); }
export function randi(a, b) { return Math.floor(rand(a, b + 1)); }
export function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
export function pnum(n) {
  const s = String(n);
  if (arcLang() !== 'fa') return s;
  return s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}
export function vibrate(p) {
  try { if (navigator.vibrate) navigator.vibrate(p); } catch { /* ignore */ }
}
/** حلقه بازی با delta-time؛ خروجی stop برای destroy */
export function makeLoop(fn) {
  let raf = 0;
  let last = 0;
  let running = false;
  const step = (ts) => {
    if (!running) return;
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
    last = ts;
    fn(dt, ts / 1000);
    raf = requestAnimationFrame(step);
  };
  return {
    start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(step); } },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}
/** کانوس را به اندازه ظرف با DPR تنظیم می‌کند؛ {w,h} منطقی را برمی‌گرداند */
export function fitCanvas(canvas, maxW = 0, aspect = 0) {
  const parent = canvas.parentElement;
  if (!parent) return { w: 0, h: 0 };
  const rect = parent.getBoundingClientRect();
  let w = Math.max(200, rect.width);
  let h = Math.max(200, rect.height);
  if (maxW && w > maxW) w = maxW;
  if (aspect) h = Math.min(h, w / aspect);
  const dpr = Math.min(2.5, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}
