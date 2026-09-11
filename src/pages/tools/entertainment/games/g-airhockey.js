// 🏒 هاکی هوایی — ضد هوش مصنوعی ۳ سطحه، اول به ۷
import { pnum, vibrate, makeLoop, rand, clamp } from '../arcade.js';

const AI_LEVELS = [
  { id: 0, fa: 'آسان', en: 'Easy', sp: 430, err: 120, react: 0.5 },
  { id: 1, fa: 'متوسط', en: 'Medium', sp: 620, err: 55, react: 0.25 },
  { id: 2, fa: 'سخت', en: 'Hard', sp: 800, err: 18, react: 0.08 },
];

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const { sfx } = api;
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🔵 <b data-p>۰</b></span>' +
    '<span class="ag-pill">🔴 <b data-a>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-seg" data-seg>' + AI_LEVELS.map((l, i) => '<button class="ag-chip" type="button" data-lv="' + i + '">' + (fa ? l.fa : l.en) + '</button>').join('') + '</div>' +
    '<div class="ag-board" style="width:100%;max-width:430px"><canvas data-cv width="420" height="620" style="width:100%;touch-action:none"></canvas></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'Restart') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'دسته آبی رو بکش · اول به ۷ می‌بره!' : 'Drag the blue mallet · first to 7 wins!') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const pEl = wrap.querySelector('[data-p]');
  const aEl = wrap.querySelector('[data-a]');
  const W = 420, H = 620, M = 18;
  const GOAL_W = 150;
  let puck, me, ai, ps, as, lv, serve, serveT, over, started, best, aiErrX, aiThink, msgT, msg;

  function reset(full) {
    puck = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 15 };
    me = { x: W / 2, y: H - 130, px: W / 2, py: H - 130, vx: 0, vy: 0, r: 26 };
    ai = { x: W / 2, y: 130, px: W / 2, py: 130, vx: 0, vy: 0, r: 26 };
    if (full) { ps = 0; as = 0; }
    serve = true; serveT = full ? 1.6 : 1.1;
    over = false;
    started = full ? false : started;
    aiErrX = 0; aiThink = 0;
    msgT = 0; msg = '';
    hud();
  }
  function hud() {
    pEl.textContent = pnum(ps);
    aEl.textContent = pnum(as);
    wrap.querySelector('[data-b]').textContent = pnum(Math.max(best, ps));
  }
  function syncSeg() {
    wrap.querySelectorAll('[data-lv]').forEach((b) => {
      b.classList.toggle('on', Number(b.dataset.lv) === lv);
    });
  }
  function bover() {
    const o = wrap.querySelector('[data-over]');
    if (o) o.remove();
  }
  function showIntro() {
    bover();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🏒 ' + (fa ? 'هاکی هوایی' : 'Air Hockey') + '</h2>' +
      '<p>' + (fa ? 'دسته <b style="color:#5af">آبی</b> مال توئه — بکشش و به پاک بزن! اول به <b>۷</b> می‌بره.' : 'The <b style="color:#5af">blue</b> mallet is yours — drag it! First to <b>7</b> wins.') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '🏒 شروع بازی' : '🏒 Face off') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true;
    });
  }
  function showOver(win) {
    const r = win ? api.submitScore(ps * 10 + (lv + 1) * 15) : api.submitScore(ps);
    best = Math.max(best, win ? ps * 10 + (lv + 1) * 15 : ps);
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>' + (win ? '🏆' : '😞') + '</h2>' +
      '<div class="ag-big">' + pnum(ps) + ' – ' + pnum(as) + '</div>' +
      '<p>' + (win ? (fa ? 'بردی! آفرین 🎉' : 'You win! 🎉') : (fa ? 'باختی… یه بار دیگه!' : 'You lose… again!')) + (r.isBest ? ' 🏆' : '') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '↻ دوباره' : '↻ Rematch') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    if (win) sfx.win(); else sfx.lose();
    vibrate(win ? 40 : 100);
    ov.querySelector('[data-go]').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.click(); bover(); reset(true); started = true;
    });
  }
  function goal(playerScored) {
    if (playerScored) {
      ps++;
      msg = choice2(['گللل! 🎉', 'آفرین! 🔥', 'چه ضربه‌ای! ⚡']);
      sfx.clear();
    } else {
      as++;
      msg = fa ? 'گل خوردی… 😅' : 'Conceded… 😅';
      sfx.hit();
    }
    msgT = 1.4;
    vibrate(50);
    hud();
    if (ps >= 7 || as >= 7) {
      over = true;
      setTimeout(() => { if (over && !wrap.querySelector('[data-over]')) showOver(ps >= 7); }, 800);
    } else {
      reset(false);
    }
  }
  function choice2(arr) { return fa ? arr[(Math.random() * arr.length) | 0] : ['Goal! 🎉', 'Nice! 🔥', 'What a shot! ⚡'][(Math.random() * 3) | 0]; }

  function collideMallet(m) {
    const dx = puck.x - m.x, dy = puck.y - m.y;
    const d = Math.hypot(dx, dy) || 0.01;
    const minD = puck.r + m.r;
    if (d < minD) {
      const nx = dx / d, ny = dy / d;
      puck.x = m.x + nx * minD;
      puck.y = m.y + ny * minD;
      const relVx = puck.vx - m.vx, relVy = puck.vy - m.vy;
      const vn = relVx * nx + relVy * ny;
      if (vn < 0) {
        const rest = 0.92;
        puck.vx -= (1 + rest) * vn * nx;
        puck.vy -= (1 + rest) * vn * ny;
        puck.vx += m.vx * 0.35;
        puck.vy += m.vy * 0.35;
        const sp = Math.hypot(puck.vx, puck.vy);
        const max = 1350;
        if (sp > max) { puck.vx *= max / sp; puck.vy *= max / sp; }
        sfx.place();
      }
    }
  }

  function update(dt) {
    if (!started || over) return;
    if (msgT > 0) msgT -= dt;
    if (serve) {
      serveT -= dt;
      if (serveT <= 0) {
        serve = false;
        const a = rand(-0.6, 0.6) + (Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2);
        puck.vx = Math.cos(a) * 320;
        puck.vy = Math.sin(a) * 320;
        sfx.tick();
      }
      return;
    }
    const L = AI_LEVELS[lv];
    // --- هوش مصنوعی ---
    aiThink -= dt;
    if (aiThink <= 0) {
      aiThink = L.react;
      aiErrX = rand(-L.err, L.err);
    }
    let atx = W / 2, aty = 130;
    const toward = puck.vy < -40;
    if (puck.y < H / 2 + 30 || toward) {
      // پیش‌بینی محل برخورد
      let px = puck.x, py = puck.y, vx = puck.vx, vy = puck.vy;
      if (vy < -10) {
        const tt = (py - 130) / -vy;
        px = px + vx * clamp(tt, 0, 1.2);
        while (px < M || px > W - M) { px = px < M ? 2 * M - px : 2 * (W - M) - px; }
      }
      atx = clamp(px + aiErrX, M + ai.r, W - M - ai.r);
      aty = clamp(py < H / 2 ? py - 30 : 130, M + ai.r, H / 2 - 40);
      // حمله: اگه پاک نزدیکه برو پشتش و بزن
      if (puck.y < H / 2 - 20 && puck.y > 60) {
        atx = clamp(puck.x + aiErrX * 0.5, M + ai.r, W - M - ai.r);
        aty = puck.y - 44;
      }
    }
    ai.px = ai.x; ai.py = ai.y;
    const adx = atx - ai.x, ady = aty - ai.y;
    const ad = Math.hypot(adx, ady) || 1;
    const ast = Math.min(L.sp, ad / Math.max(dt, 0.001));
    ai.x += (adx / ad) * Math.min(ad, ast * dt);
    ai.y += (ady / ad) * Math.min(ad, ast * dt);
    ai.x = clamp(ai.x, M + ai.r, W - M - ai.r);
    ai.y = clamp(ai.y, M + ai.r, H / 2 - 24);
    ai.vx = (ai.x - ai.px) / Math.max(dt, 0.001) * 0.85;
    ai.vy = (ai.y - ai.py) / Math.max(dt, 0.001) * 0.85;

    // --- بازیکن: سرعت دسته از حرکت ---
    me.vx = (me.x - me.px) / Math.max(dt, 0.001);
    me.vy = (me.y - me.py) / Math.max(dt, 0.001);
    me.px = me.x; me.py = me.y;
    const msp = Math.hypot(me.vx, me.vy);
    if (msp > 2600) { me.vx *= 2600 / msp; me.vy *= 2600 / msp; }

    // --- پاک ---
    puck.x += puck.vx * dt;
    puck.y += puck.vy * dt;
    puck.vx *= (1 - 0.25 * dt);
    puck.vy *= (1 - 0.25 * dt);
    if (puck.x < M + puck.r) { puck.x = M + puck.r; puck.vx = Math.abs(puck.vx) * 0.92; sfx.tick(); }
    if (puck.x > W - M - puck.r) { puck.x = W - M - puck.r; puck.vx = -Math.abs(puck.vx) * 0.92; sfx.tick(); }
    const gx0 = W / 2 - GOAL_W / 2, gx1 = W / 2 + GOAL_W / 2;
    if (puck.y < M + puck.r) {
      if (puck.x > gx0 && puck.x < gx1) { goal(true); return; }
      puck.y = M + puck.r; puck.vy = Math.abs(puck.vy) * 0.92; sfx.tick();
    }
    if (puck.y > H - M - puck.r) {
      if (puck.x > gx0 && puck.x < gx1) { goal(false); return; }
      puck.y = H - M - puck.r; puck.vy = -Math.abs(puck.vy) * 0.92; sfx.tick();
    }
    collideMallet(me);
    collideMallet(ai);
  }

  function render(t) {
    ctx.fillStyle = '#0a0f22';
    ctx.fillRect(0, 0, W, H);
    // زمین
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#141b3f'); g.addColorStop(0.5, '#10162f'); g.addColorStop(1, '#141b3f');
    ctx.fillStyle = g;
    ctx.fillRect(M, M, W - 2 * M, H - 2 * M);
    // خط وسط و دایره
    ctx.strokeStyle = 'rgba(120,160,255,.5)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(M, H / 2); ctx.lineTo(W - M, H / 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,160,255,.35)';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 62, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(120,160,255,.35)';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 6, 0, 7); ctx.fill();
    // دروازه‌ها
    const gx0 = W / 2 - GOAL_W / 2;
    ctx.fillStyle = '#05070f';
    ctx.fillRect(gx0, 0, GOAL_W, M + 6);
    ctx.fillRect(gx0, H - M - 6, GOAL_W, M + 6);
    ctx.strokeStyle = '#5aff8a'; ctx.lineWidth = 3;
    ctx.strokeRect(gx0, 2, GOAL_W, M + 4);
    ctx.strokeRect(gx0, H - M - 6, GOAL_W, M + 4);
    ctx.strokeStyle = '#3a4a8f'; ctx.lineWidth = 4;
    ctx.strokeRect(M, M, W - 2 * M, H - 2 * M);
    // رد پاک
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(puck.x, puck.y); ctx.lineTo(puck.x - puck.vx * 0.03, puck.y - puck.vy * 0.03); ctx.stroke();
    // پاک
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.arc(puck.x + 2, puck.y + 3, puck.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2f5ff';
    ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff3b5c';
    ctx.beginPath(); ctx.arc(puck.x, puck.y, 5, 0, 7); ctx.fill();
    // دسته‌ها
    drawMallet(ai, '#ff5c5c', '#8f1d1d');
    drawMallet(me, '#4da3ff', '#1d4d8f');
    // سرویس
    if (serve && started) {
      ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffe9a3';
      ctx.fillText(serveT > 0.7 ? (fa ? 'آماده…' : 'Ready…') : '🏒', W / 2, H / 2 - 90);
    }
    if (msgT > 0) {
      ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7dffd4';
      ctx.fillText(msg, W / 2, H / 2);
    }
  }
  function drawMallet(m, c1, c2) {
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.arc(m.x + 2, m.y + 3, m.r, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(m.x - 8, m.y - 8, 4, m.x, m.y, m.r);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, 7); ctx.fill();
  }

  const loop = makeLoop((dt, t) => { update(dt); render(t); });
  const keys = {};
  function onKey(e, down) {
    keys[e.key] = down;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  }
  // حرکت کیبوردی دسته در حلقه
  const keyTimer = setInterval(() => {
    if (!started || over) return;
    const st = 14;
    if (keys.ArrowLeft || keys.a) me.x -= st;
    if (keys.ArrowRight || keys.d) me.x += st;
    if (keys.ArrowUp || keys.w) me.y -= st;
    if (keys.ArrowDown || keys.s) me.y += st;
    me.x = clamp(me.x, M + me.r, W - M - me.r);
    me.y = clamp(me.y, H / 2 + 24, H - M - me.r);
  }, 16);
  function setMallet(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    me.x = clamp((clientX - r.left) * (W / r.width), M + me.r, W - M - me.r);
    me.y = clamp((clientY - r.top) * (H / r.height), H / 2 + 24, H - M - me.r);
  }
  let dragging = false;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault(); sfx.unlock(); dragging = true; setMallet(e.clientX, e.clientY);
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => { if (dragging) setMallet(e.clientX, e.clientY); });
  window.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); sfx.unlock(); const t = e.touches[0]; setMallet(t.clientX, t.clientY); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const t = e.touches[0]; setMallet(t.clientX, t.clientY); }, { passive: false });
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); bover(); reset(true); started = true; });
  wrap.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => {
    lv = Number(b.dataset.lv); syncSeg(); sfx.click(); bover(); reset(true); started = true;
  }));

  lv = 1; best = api.getBest();
  syncSeg();
  reset(true);
  showIntro();
  loop.start();
  return function destroy() {
    loop.stop();
    clearInterval(keyTimer);
    try { api.submitScore(ps); } catch { /* ignore */ }
  };
}
