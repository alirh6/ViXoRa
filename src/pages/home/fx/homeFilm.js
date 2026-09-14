// src/pages/home/fx/homeFilm.js

/**
 * سکانس سینمایی خانهٔ ViXoRa — «با اسکرول، فریم بعدی»
 * ─────────────────────────────────────────────────────────────
 * یک صحنهٔ کانواسی *واقعی* که پیشرفتش به اسکرول گره خورده است؛
 * هرچه سکشن داخل ویوپورت بالا بیاید، فریم جلوتر می‌رود.
 * بدون هیچ فایل خارجی — همه‌چیز پروسیجرال (پیش‌محاسبه‌شده و سبک).
 *
 *  پردهٔ ۱: ذرات کهکشانی به حلقهٔ نور می‌پیوندند
 *  پردهٔ ۲: «V» نئونی و صورت‌فلکی ابزار شکل می‌گیرد
 *  پردهٔ ۳: کاشی‌های ابزار فرود می‌آیند و درخشش پایانی
 */

const CAPTIONS = {
  fa: ['ذرات جمع می‌شوند…', 'هستهٔ ViXoRa شکل می‌گیرد…', 'دنیای ابزارها — یکجا ✨'],
  en: ['Particles gathering…', 'The ViXoRa core is forming…', 'Every tool — one place ✨'],
  ar: ['الجسيمات تتجمّع…', 'نواة ViXoRa تتشكّل…', 'كل الأدوات — مكان واحد ✨'],
  fr: ['Les particules se rassemblent…', 'Le noyau ViXoRa se forme…', 'Tous les outils — en un lieu ✨'],
};

const HINTS = { fa: 'اسکرول کن — فریم بعدی', en: 'Scroll for the next frame', ar: 'مرّر للإطار التالي', fr: 'Faites défiler — image suivante' };
const FRAMES = 96;

/* PRNG قطعی تا فریم‌ها همیشه یکسان رندر شوند */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

export function createHomeFilm(root, { motionEnabled = () => true } = {}) {
  const host = root.querySelector('[data-hm-film]');
  const canvas = host?.querySelector('[data-hm-film-canvas]');
  const captionEl = host?.querySelector('[data-hm-film-caption]');
  const countEl = host?.querySelector('[data-hm-film-count]');
  const progEl = host?.querySelector('[data-hm-film-prog]');
  if (!host || !canvas) return { start() {}, stop() {} };

  const ctx = canvas.getContext('2d');
  const lang = (document.documentElement.lang || 'fa').slice(0, 2);
  const dict = CAPTIONS[lang] || CAPTIONS.fa;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = false;
  let destroyed = false;
  let progress = 0; // نرم‌شده
  let target = 0;
  let lastFrame = -1;

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── داده‌های صحنه (یک‌بار ساخته می‌شوند) ─── */
  const rnd = mulberry32(0x9e3779);
  const STARS = Array.from({ length: 130 }, () => ({
    x: rnd(), y: rnd(), z: 0.35 + rnd() * 0.65, tw: rnd() * Math.PI * 2,
  }));
  const DUST = Array.from({ length: 210 }, () => {
    const ang = rnd() * Math.PI * 2;
    return {
      sx: rnd(), sy: rnd(),                 // نقطهٔ شروع (پخش)
      ang, rad: 0.86 + rnd() * 0.24,        // مقصد: روی حلقه
      sp: 0.75 + rnd() * 0.9, hue: 186 + rnd() * 96, sz: 0.7 + rnd() * 2.1,
      lag: rnd() * 0.35,
    };
  });
  const ORBITERS = Array.from({ length: 26 }, (_, i) => ({
    ang: (i / 26) * Math.PI * 2 + rnd() * 0.2,
    rad: 1.02 + rnd() * 0.1, sp: (i % 2 ? 1 : -1) * (0.24 + rnd() * 0.3),
    sz: 1.1 + rnd() * 1.6, hue: 190 + rnd() * 80,
  }));
  const rnd2 = mulberry32(0x51ed27);
  const TILES = Array.from({ length: 12 }, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    return {
      col, row,
      hue: 186 + ((i * 37) % 100) * 1.4,    // طیف فیروزه‌ای تا بنفش
      delay: (row * 6 + col) * 0.028 + rnd2() * 0.05,
      jit: (rnd2() - 0.5) * 0.2,
    };
  });

  function resize() {
    const r = host.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(200, Math.round(r.width));
    H = Math.max(160, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastFrame = -1;
    draw(progress, true);
  }

  /* پیشرفت اسکرول: نه «وارد شدن» و نه «وسط کادر» — طوری که فریم آخر
   * دقیقاً زمانی شکل بگیرد که سکشن جلوی چشم کاربر است (نه وقتی از
   * ویوپورت خارج شده!). مرکز سکشن از زیر صفحه تا ۴۲٪ ارتفاع ویوپورت
   * سفر می‌کند و همین نگاشت ۰→۱ است؛ بعد از آن فریم کامل «قفل» می‌ماند. */
  function measure() {
    const r = host.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const center = r.top + r.height / 2;
    const start = vh * 1.02; // مرکز کمی پایین‌تر از لبهٔ صفحه → آغاز
    const end = vh * 0.42;   // مرکز روی ۴۲٪ صفحه → تکمیل (کاملاً قابل مشاهده)
    target = clamp01((start - center) / (start - end));
  }

  function draw(p, force = false) {
    const frame = Math.round(p * (FRAMES - 1));
    if (!force && frame === lastFrame) return;
    lastFrame = frame;

    ctx.clearRect(0, 0, W, H);

    /* پس‌زمینهٔ فضا */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    const hueShift = p * 46;
    bg.addColorStop(0, `hsl(${232 + hueShift * 0.3}, 46%, ${6 + p * 3}%)`);
    bg.addColorStop(0.62, `hsl(${248 + hueShift * 0.5}, 52%, ${8 + p * 4}%)`);
    bg.addColorStop(1, `hsl(${214 + hueShift}, 58%, ${5 + p * 3}%)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* ستارگان با پارالاکس نرم */
    ctx.save();
    for (const s of STARS) {
      const drift = (p - 0.5) * 26 * s.z;
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.tw + p * 6.283));
      ctx.fillStyle = `rgba(205,230,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x * W + drift, s.y * H + drift * 0.4, s.z * 1.25, 0, 6.283);
      ctx.fill();
    }
    ctx.restore();

    const cx = W / 2;
    const cy = H * 0.46;
    const R = Math.min(W, H) * 0.31;

    /* پردهٔ ۱ — ذرات به حلقه می‌پیوندند */
    const gather = easeOut(smooth(0.02, 0.4, p));
    const ringVis = smooth(0.3, 0.44, p);
    for (const d of DUST) {
      const t = clamp01((gather - d.lag * 0.5) / (1 - d.lag * 0.5));
      const ex = cx + Math.cos(d.ang) * R * d.rad;
      const ey = cy + Math.sin(d.ang) * R * d.rad * 0.97;
      const x = lerp(d.sx * W, ex, t);
      const y = lerp(d.sy * H, ey, t);
      const a = (0.16 + 0.84 * t) * (0.35 + 0.65 * ringVis);
      ctx.fillStyle = `hsla(${d.hue}, 92%, ${62 + t * 8}%, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, d.sz * (0.8 + t * 0.6), 0, 6.283);
      ctx.fill();
    }

    /* خود حلقه */
    if (ringVis > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const spin = p * 2.2;
      for (const [rr, aa, lw] of [[1, 0.5, 2.4], [1.05, 0.22, 1.4], [0.94, 0.16, 1]]) {
        ctx.strokeStyle = `hsla(${188 + p * 60}, 95%, 64%, ${(ringVis * aa).toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.setLineDash([Math.PI * R * 0.06, Math.PI * R * 0.05]);
        ctx.lineDashOffset = -spin * 40 * rr;
        ctx.beginPath();
        ctx.arc(cx, cy, R * rr, 0, 6.283);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      /* مدارگردها */
      for (const o of ORBITERS) {
        const a = o.ang + o.sp * p * 6.283;
        ctx.fillStyle = `hsla(${o.hue}, 96%, 68%, ${(ringVis * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * R * o.rad, cy + Math.sin(a) * R * o.rad, o.sz, 0, 6.283);
        ctx.fill();
      }
      ctx.restore();
    }

    /* پردهٔ ۲ — «V» نئونی مونتاژ می‌شود */
    const vIn = smooth(0.42, 0.62, p);
    if (vIn > 0) {
      const vs = R * 1.06;
      const topY = cy - vs * 0.6;
      const botY = cy + vs * 0.62;
      const halfSpan = vs * 0.56;
      const trace = (x0, y0, x1, y1, t) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(lerp(x0, x1, t), lerp(y0, y1, t));
        ctx.stroke();
      };
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const pass of [['rgba(34,211,238,.28)', 13], ['rgba(190,245,255,.95)', 4.6]]) {
        ctx.strokeStyle = pass[0];
        ctx.lineWidth = pass[1];
        ctx.lineCap = 'round';
        trace(cx - halfSpan, topY, cx, botY, vIn);          // ساق چپ
        trace(cx, botY, cx + halfSpan, topY, smooth(0.5, 1, vIn)); // ساق راست (تأخیری)
      }
      /* جرقهٔ نوک */
      if (vIn > 0.97) {
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.beginPath();
        ctx.arc(cx + halfSpan, topY, 5.2, 0, 6.283);
        ctx.fill();
      }
      ctx.restore();
    }

    /* پردهٔ ۳ — کاشی‌های ابزار فرود می‌آیند */
    const tilesIn = smooth(0.66, 0.9, p);
    if (tilesIn > 0) {
      const cols = 6;
      const gapT = Math.max(5, W * 0.008);
      const tw = (Math.min(W * 0.78, 560) - gapT * (cols - 1)) / cols;
      const gx = cx - (tw * cols + gapT * (cols - 1)) / 2;
      const topRow = cy - R * 0.7 - tw * 2.35;
      for (const tile of TILES) {
        const t = easeOut(clamp01((tilesIn - tile.delay) / 0.45));
        if (t <= 0) continue;
        const hx = gx + tile.col * (tw + gapT);
        const hy = topRow + tile.row * (tw + gapT);
        const y = lerp(H + 30 + tile.jit * 60, hy, t);
        const a = t * 0.92;
        ctx.save();
        ctx.globalAlpha = a;
        const r2 = Math.min(12, tw * 0.22);
        ctx.beginPath();
        ctx.roundRect(hx, y, tw, tw, r2);
        ctx.fillStyle = `hsla(${tile.hue}, 72%, 15%, .92)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${tile.hue}, 95%, 64%, .75)`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
        /* هستهٔ درخشان کاشی */
        ctx.fillStyle = `hsla(${tile.hue}, 100%, 70%, ${(a * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(hx + tw / 2, y + tw / 2, tw * 0.16 * t, 0, 6.283);
        ctx.fill();
      }
    }

    /* هالهٔ مرکزی ملایم */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
    glow.addColorStop(0, `hsla(${196 + p * 46}, 95%, 62%, ${(0.12 + p * 0.15).toFixed(3)})`);
    glow.addColorStop(1, 'hsla(250, 80%, 40%, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* وینیت */
    const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.4, cx, cy, Math.max(W, H) * 0.85);
    vg.addColorStop(0, 'rgba(4,6,14,0)');
    vg.addColorStop(1, 'rgba(3,5,11,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    /* HUD */
    if (countEl) {
      const fa = '۰۱۲۳۴۵۶۷۸۹';
      const num = String(frame + 1).padStart(2, '0');
      countEl.textContent = lang === 'fa' || lang === 'ar' ? num.replace(/\d/g, (d) => fa[+d]) : num;
    }
    if (progEl) progEl.style.width = `${(p * 100).toFixed(1)}%`;
    if (captionEl) {
      const act = p < 0.38 ? 0 : p < 0.68 ? 1 : 2;
      if (captionEl.dataset.act !== String(act)) {
        captionEl.dataset.act = String(act);
        captionEl.textContent = `${dict[act]}  ·  ${(HINTS[lang] || HINTS.fa)}`;
      }
    }
  }

  function tick() {
    rafId = 0;
    if (destroyed) return;
    measure();
    progress += (target - progress) * 0.16;
    if (Math.abs(target - progress) < 0.0015) progress = target;
    draw(progress);
    if (!reduceMotion && motionEnabled() && visible && progress !== target) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function kick() {
    if (!rafId && !destroyed) rafId = requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting === true;
      if (visible) kick();
    },
    { rootMargin: '35% 0px' },
  );

  const ro = new ResizeObserver(resize);

  function start() {
    ro.observe(host);
    io.observe(host);
    resize();
    measure();
    progress = target;
    draw(progress, true);
    if (!reduceMotion && motionEnabled()) {
      /* حتی بدون رویداد اسکرول (تغییر اندازه/ناوبری) چک سبک می‌کنیم */
      window.addEventListener('scroll', kick, { passive: true });
    }
  }

  function stop() {
    destroyed = true;
    window.removeEventListener('scroll', kick);
    io.disconnect();
    ro.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  if (reduceMotion || !motionEnabled()) {
    /* حالت ایستا: یک فریم نمایشی زیبا بدون حلقهٔ انیمیشن */
    setTimeout(() => {
      progress = 0.58;
      draw(progress, true);
    }, 0);
  }

  return { start, stop };
}
