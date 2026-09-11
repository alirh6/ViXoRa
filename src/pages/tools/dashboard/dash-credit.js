// 🌟 ViXoRa Credit Finale — اعتبار متحرک پایانی
// src/pages/tools/dashboard/dash-credit.js
import { esc, faDigits } from './dash-state.js';

export const ASSISTANT_NAME = 'Nova';
export const ASSISTANT_MODEL_NOTE = 'Arena Agent Mode';

let raf = 0;
let particles = [];
let startAt = 0;

const BUILD_STATS = [
  ['🛠', 'ابزار یکپارچه', 6],
  ['🧩', 'ویجت کاکپیت', 46],
  ['⌨️', 'دستور فرمان‌یاب', 60],
  ['🎮', 'بازی آرکید', 25],
  ['📖', 'فصل راهنما', 12],
  ['💡', 'قابلیت (بیش از)', 150],
];

export function openCredit() {
  closeCredit();
  startAt = Date.now();
  particles = [];
  const overlay = document.createElement('div');
  overlay.setAttribute('data-credit', '1');
  overlay.innerHTML = `<div class="dash-credit">
    <canvas data-credit="canvas"></canvas>
    <div class="dash-credit-inner">
      <div class="dash-credit-kicker">🎉 ViXoRa • سوپراپ فارسی 🎉</div>
      <h2 class="dash-credit-line"><span data-credit="typed"></span><span class="dash-caret">▌</span></h2>
      <div class="dash-credit-sub" data-credit="sub"></div>
      <div class="dash-credit-stats">${BUILD_STATS.map(([i, t, v]) => `<div class="dash-credit-stat"><b data-count="${v}">۰</b><span>${i} ${t}</span></div>`).join('')}</div>
      <div class="dash-credit-quote" data-credit="quote"></div>
      <div class="dash-credit-row">
        <button class="dash-btn" data-action="credit-copy">📋 کپی اعتبار</button>
        <button class="dash-btn" data-action="credit-share">📤 اشتراک</button>
        <button class="dash-btn dash-btn-primary" data-action="credit-close">🚀 برگشت به کاکپیت</button>
      </div>
      <div class="dash-credit-hint">Esc یا کلیک بیرون برای بستن</div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const QUOTES = [
    '✨ «بهترین ابزار، ابزاری است که هر روز بازش می‌کنی.»',
    '🚀 «نظم کوچک روزانه، معجزه سالانه می‌سازد.»',
    '💜 «ساخته‌شده با وسواس، برای کسی که بهترین را می‌خواهد.»',
  ];
  setTimeout(() => {
    const q = overlay.querySelector('[data-credit="quote"]');
    if (q) { q.textContent = QUOTES[(Math.random() * QUOTES.length) | 0]; q.classList.add('show'); }
  }, 2200);
  overlay.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="credit-share"]')) {
      const txt = creditLineText() + ' | ViXoRa 🛩';
      if (navigator.share) navigator.share({ title: 'ViXoRa', text: txt }).catch(() => null);
      else navigator.clipboard?.writeText(txt).catch(() => null);
      return;
    }
    if (e.target.closest('[data-action="credit-close"]')) closeCredit();
    else if (e.target.closest('[data-action="credit-copy"]')) {
      const txt = `ساخته‌شده با ❤️ برای علی — ${ASSISTANT_NAME} (${ASSISTANT_MODEL_NOTE}) | ViXoRa 🛩`;
      navigator.clipboard?.writeText(txt).catch(() => null);
    } else if (e.target.classList.contains('dash-credit')) closeCredit();
  });
  // تایپ انیمیشنی
  const line = 'ساخته‌شده با ❤️ برای علی';
  const typed = overlay.querySelector('[data-credit="typed"]');
  const sub = overlay.querySelector('[data-credit="sub"]');
  let i = 0;
  const typeIv = setInterval(() => {
    if (!overlay.isConnected) { clearInterval(typeIv); return; }
    i += 1;
    typed.textContent = line.slice(0, i);
    if (i >= line.length) {
      clearInterval(typeIv);
      setTimeout(() => {
        if (!sub.isConnected) return;
        sub.innerHTML = `طراحی و ساخت: <b>${ASSISTANT_NAME}</b> <span class="dash-credit-model">(${ASSISTANT_MODEL_NOTE})</span>`;
        sub.classList.add('show');
      }, 400);
    }
  }, 90);
  // شمارنده‌ها
  setTimeout(() => {
    overlay.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count) || 0;
      const t0 = Date.now();
      const step = () => {
        if (!el.isConnected) return;
        const p = Math.min(1, (Date.now() - t0) / 1600);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = faDigits(String(Math.round(target * eased)));
        if (p < 1) requestAnimationFrame(step);
      };
      step();
    });
  }, 1200);
  // ذرات
  const canvas = overlay.querySelector('[data-credit="canvas"]');
  spawnLoop(canvas);
}

export function closeCredit() {
  cancelAnimationFrame(raf);
  raf = 0;
  document.querySelector('[data-credit]')?.remove();
}

export function isCreditOpen() {
  return !!document.querySelector('[data-credit]');
}

function spawnLoop(canvas) {
  cancelAnimationFrame(raf);
  const draw = () => {
    if (!canvas.isConnected) { raf = 0; return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    // اسپاون
    if (particles.length < 220 && Math.random() < 0.7) {
      particles.push(newParticle(w, h));
    }
    const t = Date.now() - startAt;
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life -= p.decay; p.rot += p.vr;
      if (p.y > h + 30) p.life = 0;
      const a = Math.max(0, Math.min(1, p.life));
      c.save();
      c.globalAlpha = a;
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      if (p.shape === 'note') {
        c.font = `${p.size}px Tahoma`;
        c.textAlign = 'center';
        c.fillStyle = p.color;
        c.fillText(p.char, 0, 0);
      } else if (p.shape === 'circle') {
        c.beginPath(); c.arc(0, 0, p.size / 3, 0, 7);
        c.fillStyle = p.color; c.fill();
      } else {
        c.fillStyle = p.color;
        c.fillRect(-p.size / 4, -p.size / 6, p.size / 2, p.size / 3);
      }
      c.restore();
    }
    // موج نورانی پایین
    const g = c.createLinearGradient(0, h - 120, 0, h);
    g.addColorStop(0, 'rgba(139,92,246,0)');
    g.addColorStop(1, `rgba(139,92,246,${0.25 + Math.sin(t / 600) * 0.1})`);
    c.fillStyle = g;
    c.fillRect(0, h - 120, w, 120);
    raf = requestAnimationFrame(draw);
  };
  draw();
}

const COLORS = ['#8b5cf6', '#ec4899', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a3e635'];
const NOTES = ['🎵', '🎶', '⭐', '💜', '✨', '🎮', '💰', '📝'];

function newParticle(w, h) {
  const shape = Math.random() < 0.3 ? 'note' : Math.random() < 0.5 ? 'circle' : 'rect';
  return {
    x: Math.random() * w,
    y: h + 20 + Math.random() * 40,
    vx: (Math.random() - 0.5) * 1.2,
    vy: -(0.6 + Math.random() * 2.2),
    g: 0.008,
    size: 10 + Math.random() * 22,
    color: COLORS[(Math.random() * COLORS.length) | 0],
    char: NOTES[(Math.random() * NOTES.length) | 0],
    shape,
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.1,
    life: 1,
    decay: 0.001 + Math.random() * 0.004,
  };
}

export function creditLineText() {
  return `ساخته‌شده با ❤️ برای علی — ${ASSISTANT_NAME} (${ASSISTANT_MODEL_NOTE})`;
}
