// 🏎️ Neon Racer — مسابقه شبه‌س‌بعدی شبانه: تپه، پیچ، ترافیک، چک‌پوینت
import { pnum, sfx, vibrate, makeLoop, clamp } from '../arcade.js';

const SEG = 200;
const RUMBLE = 3;
const DRAW = 150;
const ROAD_W = 2200;
const CAM_H = 1150;
const CAM_D = 0.84;
const MAX_SPEED = SEG * 60;
const CENTRIFUGAL = 0.18;

export function mount(root, api) {
  const fa = api.lang !== 'en';
  const wrap = document.createElement('div');
  wrap.className = 'ag-game';
  wrap.innerHTML =
    '<div class="ag-hud"><span class="ag-pill">🏁 <b data-s>۰</b>m</span>' +
    '<span class="ag-pill">⏱ <b data-t>۰</b></span>' +
    '<span class="ag-pill">🚗 <b data-v>۰</b></span>' +
    '<span class="ag-pill ag-pill--gold">🏆 <b data-b>' + pnum(api.getBest()) + '</b></span></div>' +
    '<div class="ag-board" style="width:100%;max-width:520px"><canvas data-cv style="width:100%"></canvas></div>' +
    '<div class="ag-trow"><button class="ag-tbtn" type="button" data-k="left">◀</button>' +
    '<button class="ag-tbtn" type="button" data-k="brake">🛑</button>' +
    '<button class="ag-tbtn" type="button" data-k="right">▶</button></div>' +
    '<div class="ag-controls"><button class="ag-btn ag-btn--sm" type="button" data-new>↻ ' + (fa ? 'از اول' : 'New race') + '</button></div>' +
    '<div class="ag-hint">' + (fa ? 'گاز خودکاره! فقط فرمون بده و از ترافیک رد شو 🚗💨' : 'Auto-gas! Just steer and dodge traffic 🚗💨') + '</div>';
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-cv]');
  const ctx = canvas.getContext('2d');
  const sEl = wrap.querySelector('[data-s]');
  const tEl = wrap.querySelector('[data-t]');
  const vEl = wrap.querySelector('[data-v]');
  const W = 480, H = 620;
  let segments, trackLength, cars, position, playerX, speed, time, over, countdown, cdT, nextCp, score, shake, skyOff, keys, steerTouch, msg, msgT, crashCd, nearCd, started;

  const easeIn = (a, b, t) => a + (b - a) * t * t;
  const easeInOut = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);
  function lastY() { return segments.length ? segments[segments.length - 1].y2 : 0; }
  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({ i: n, curve, y1: lastY(), y2: y, sprites: [], cars: [], clip: 0, fog: 0, p1: {}, p2: {} });
  }
  function addRoad(enter, hold, leave, curve, dy) {
    const sy = lastY(), ey = sy + (dy || 0) * SEG;
    const total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(sy, ey, n / total));
    for (let n = 0; n < hold; n++) addSegment(curve, easeInOut(sy, ey, (enter + n) / total));
    for (let n = 0; n < leave; n++) addSegment(easeInOut(curve, 0, n / leave), easeInOut(sy, ey, (enter + hold + n) / total));
  }
  function buildTrack() {
    segments = [];
    addRoad(40, 40, 40, 0, 0);
    addRoad(50, 40, 50, 2.5, 20);
    addRoad(40, 30, 40, -3, -10);
    addRoad(60, 40, 60, 4, 30);
    addRoad(40, 40, 40, 0, -25);
    addRoad(50, 50, 50, -4.5, 15);
    addRoad(40, 30, 40, 3, 0);
    addRoad(60, 50, 60, -2, -20);
    addRoad(50, 40, 50, 0, 10);
    trackLength = segments.length * SEG;
    // دکور کنار جاده
    const kinds = ['neon', 'palm', 'rock', 'sign'];
    for (let i = 10; i < segments.length; i += 4) {
      if (Math.random() < 0.7) segments[i].sprites.push({ k: kinds[(Math.random() * kinds.length) | 0], off: (Math.random() > 0.5 ? 1 : -1) * (1.3 + Math.random() * 2.5) });
      if (Math.random() < 0.3) segments[i].sprites.push({ k: 'neon', off: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.5) });
    }
    // ترافیک
    cars = [];
    const carColors = ['#fb7185', '#facc15', '#4ade80', '#c084fc', '#fb923c', '#e2e8f0'];
    for (let i = 0; i < 26; i++) {
      cars.push({
        z: Math.random() * trackLength,
        off: (Math.random() - 0.5) * 1.5,
        speed: MAX_SPEED * (0.25 + Math.random() * 0.25),
        color: carColors[i % carColors.length],
        passed: false,
      });
    }
  }
  function findSeg(z) { return segments[Math.floor(z / SEG) % segments.length]; }
  function reset() {
    buildTrack();
    position = 0; playerX = 0; speed = 0; time = 45;
    over = false; countdown = false; started = false; cdT = 3.0;
    nextCp = 1; score = 0; shake = 0; skyOff = 0;
    msg = ''; msgT = 0; crashCd = 0; nearCd = 0;
    keys = {};
    steerTouch = 0;
    hideOver();
    hud();
    showIntro();
  }
  function showIntro() {
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>\u{1F3CE}\uFE0F ' + (fa ? 'مسابقه نئون' : 'Neon Racer') + '</h2>' +
      '<p>' + (fa ? '\u{1F3C1} گاز <b>خودکاره</b> — فقط فرمون بده!' : '\u{1F3C1} Auto-gas — just steer!') + '</p>' +
      '<p>\u25C0 \u25B6 / A D ' + (fa ? 'یا درگ روی صفحه' : 'or drag') + ' · \u{1F6D1} ' + (fa ? 'ترمز' : 'brake') + '</p>' +
      '<p>' + (fa ? '\u{1F697} از ترافیک رد شو · \u{1F631} نزدیک = +۱۵۰' : '\u{1F697} Dodge traffic · \u{1F631} Near-miss = +150') + '</p>' +
      '<p>' + (fa ? '\u23F1 هر چک‌پوینت +۱۸ ثانیه' : '\u23F1 Each checkpoint +18s') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-go>' + (fa ? '\u{1F3C1} شروع مسابقه' : '\u{1F3C1} Start race') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-go]').addEventListener('click', (e) => { e.stopPropagation(); sfx.unlock(); sfx.click(); ov.remove(); started = true; countdown = true; });
  }
  function hud() {
    sEl.textContent = pnum(Math.floor(position / SEG));
    tEl.textContent = pnum(Math.ceil(Math.max(0, time)));
    vEl.textContent = pnum(Math.round((speed / MAX_SPEED) * 320));
  }
  function project(p, camX, camY, camZ) {
    const dz = p.z - camZ;
    p.sx = 0; p.sy = 0; p.sw = 0;
    if (dz <= CAM_D) { p.behind = true; return; }
    p.behind = false;
    const scale = CAM_D / dz;
    p.sx = Math.round(W / 2 + (scale * (p.x - camX) * W) / 2);
    p.sy = Math.round(H / 2 - (scale * (p.y - camY) * H) / 2);
    p.sw = Math.round((scale * ROAD_W * W) / 2);
  }
  function poly(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }
  function renderSeg(x1, y1, w1, x2, y2, w2, i) {
    const light = Math.floor(i / RUMBLE) % 2 === 0;
    const g1 = light ? '#0e2a1a' : '#0b2316';
    // زمین
    ctx.fillStyle = g1;
    ctx.fillRect(0, y2, W, y1 - y2);
    // شانه نئونی
    const rum = light ? '#f43f5e' : '#e2e8f0';
    poly(x1 - w1 * 1.25, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 * 1.25, y2, rum);
    poly(x1 + w1 * 1.25, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 * 1.25, y2, rum);
    // جاده
    const road = light ? '#232a3d' : '#202639';
    poly(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, road);
    // خط‌کشی نئونی
    if (light) {
      const l1 = w1 / 16, l2 = w2 / 16;
      for (const ln of [-0.5, 0.5]) {
        const lx1 = x1 + w1 * ln, lx2 = x2 + w2 * ln;
        ctx.fillStyle = 'rgba(34,211,238,.85)';
        ctx.fillRect(lx1 - l1 / 2, y1 - 2, l1, 3);
        ctx.fillRect(lx2 - l2 / 2, y2 - 2, l2, 3);
      }
    }
  }
  function drawCarScene(x, y, w, color, brake) {
    const h = w * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.55, h * 0.18, 0, 0, 7);
    ctx.fill();
    // چرخ‌ها
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - w * 0.52, y - h * 0.55, w * 0.2, h * 0.5);
    ctx.fillRect(x + w * 0.32, y - h * 0.55, w * 0.2, h * 0.5);
    // بدنه
    const g = ctx.createLinearGradient(x, y - h, x, y);
    g.addColorStop(0, color);
    g.addColorStop(1, '#0f172a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.42, y);
    ctx.lineTo(x - w * 0.34, y - h * 0.8);
    ctx.lineTo(x + w * 0.34, y - h * 0.8);
    ctx.lineTo(x + w * 0.42, y);
    ctx.closePath();
    ctx.fill();
    // کابین
    ctx.fillStyle = 'rgba(180,240,255,.9)';
    ctx.fillRect(x - w * 0.13, y - h * 0.72, w * 0.26, h * 0.3);
    // اسپویلر
    ctx.fillStyle = color;
    ctx.fillRect(x - w * 0.5, y - h * 0.95, w, h * 0.12);
    // چراغ عقب
    ctx.fillStyle = brake ? '#fff' : '#ff2244';
    ctx.shadowColor = '#ff2244';
    ctx.shadowBlur = 12;
    ctx.fillRect(x - w * 0.32, y - h * 0.28, w * 0.2, h * 0.1);
    ctx.fillRect(x + w * 0.12, y - h * 0.28, w * 0.2, h * 0.1);
    ctx.shadowBlur = 0;
  }
  function drawSprite(sp, x, y, scale) {
    const s = Math.min(230, scale * W * 60);
    if (s < 4) return;
    if (sp.k === 'palm') {
      ctx.font = s + 'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('🌴', x, y);
    } else if (sp.k === 'rock') {
      ctx.font = s * 0.7 + 'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('🪨', x, y);
    } else if (sp.k === 'sign') {
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(x - s * 0.25, y - s, s * 0.5, s * 0.5);
      ctx.fillStyle = '#fff';
      ctx.font = '900 ' + s * 0.3 + 'px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ViX', x, y - s * 0.75);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x - 2, y - s * 0.5, 4, s * 0.5);
    } else {
      // ستون نئون
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 14;
      ctx.fillRect(x - 3, y - s, 6, s);
      ctx.shadowBlur = 0;
    }
  }

  const loop = makeLoop((dt) => {
    dt = Math.min(dt, 0.05);
    if (started && countdown && !over) {
      cdT -= dt;
      if (cdT <= 0) { countdown = false; sfx.level(); }
    }
    if (started && !over && !countdown) {
      const pSeg = findSeg(position + (CAM_H * CAM_D));
      const speedRatio = speed / MAX_SPEED;
      // فرمان
      let steer = 0;
      if (keys.left) steer -= 1;
      if (keys.right) steer += 1;
      steer += steerTouch;
      steer = clamp(steer, -1, 1);
      const dx = dt * 2.4 * Math.min(1, speedRatio * 1.6);
      playerX += steer * dx;
      // گریز از مرکز
      playerX -= dx * speedRatio * pSeg.curve * CENTRIFUGAL;
      playerX = clamp(playerX, -2.4, 2.4);
      // گاز/ترمز
      if (keys.brake) speed = Math.max(0, speed - MAX_SPEED * 1.2 * dt);
      else speed = Math.min(MAX_SPEED, speed + MAX_SPEED * 0.55 * dt);
      if (Math.abs(playerX) > 1.15) {
        speed = Math.max(MAX_SPEED * 0.25, speed - MAX_SPEED * 1.4 * dt);
        if (speed > MAX_SPEED * 0.4 && Math.random() < 0.3) sfx.tick();
      }
      position += speed * dt;
      skyOff += pSeg.curve * speedRatio * dt * 2;
      // ترافیک
      for (const c of cars) {
        c.z += c.speed * dt;
        if (c.z >= trackLength) { c.z -= trackLength; c.passed = false; }
        if (c.z < 0) c.z += trackLength;
      }
      // برخورد
      crashCd = Math.max(0, crashCd - dt);
      nearCd = Math.max(0, nearCd - dt);
      const pz = position + CAM_H * CAM_D;
      for (const c of cars) {
        let rel = c.z - pz;
        if (rel < -trackLength / 2) rel += trackLength;
        if (rel > trackLength / 2) rel -= trackLength;
        if (Math.abs(rel) < SEG * 1.2) {
          if (Math.abs(playerX - c.off) < 0.42 && crashCd <= 0) {
            speed = Math.min(speed, c.speed * 0.4);
            crashCd = 1;
            shake = 0.6;
            sfx.hit();
            vibrate([70, 40, 70]);
            msg = fa ? '💥 تصادف!' : '💥 Crash!';
            msgT = 1;
          } else if (!c.passed && rel < 0 && Math.abs(playerX - c.off) < 0.7 && speedRatio > 0.7 && nearCd <= 0) {
            c.passed = true;
            nearCd = 0.8;
            score += 150;
            sfx.coin();
            msg = fa ? '😱 نزدیک بود! +۱۵۰' : '😱 Close! +150';
            msgT = 1;
          }
        }
        if (rel < -SEG * 2) c.passed = true;
      }
      // امتیاز و زمان
      score += (speed / MAX_SPEED) * dt * 60;
      time -= dt;
      const cpAt = nextCp * 400 * SEG;
      if (position >= cpAt) {
        nextCp++;
        time += 18;
        sfx.win();
        vibrate(40);
        msg = (fa ? '🏁 چک‌پوینت! +۱۸ ثانیه' : '🏁 Checkpoint! +18s');
        msgT = 1.6;
      }
      msgT = Math.max(0, msgT - dt);
      hud();
      if (time <= 0) {
        time = 0;
        gameOver();
      }
    }
    shake = Math.max(0, shake - dt * 1.6);
    render();
  });

  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 16, (Math.random() - 0.5) * shake * 12);
    // آسمان شب
    const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
    sky.addColorStop(0, '#070313');
    sky.addColorStop(0.7, '#1c0b38');
    sky.addColorStop(1, '#4c1d95');
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, W + 40, H / 2 + 20);
    // ستاره‌ها
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 89 - skyOff * 60) % (W + 40) + W + 40) % (W + 40) - 20;
      const sy = (i * 53) % Math.floor(H / 2.4);
      ctx.fillRect(sx, sy, 2, 2);
    }
    // ماه
    ctx.font = '54px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const moonX = (((W * 0.78 - skyOff * 20) % (W + 160)) + W + 160) % (W + 160) - 80;
    ctx.fillText('🌕', moonX, H * 0.13);
    // کوهستان
    ctx.fillStyle = '#150a30';
    ctx.beginPath();
    ctx.moveTo(-20, H / 2);
    for (let x = -20; x <= W + 20; x += 40) {
      const hgt = 30 + ((x * 7919 + Math.floor(skyOff * 40) * 131) % 70);
      ctx.lineTo(x, H / 2 - hgt);
      ctx.lineTo(x + 20, H / 2);
    }
    ctx.lineTo(W + 20, H / 2);
    ctx.closePath();
    ctx.fill();
    // زمین پایه
    ctx.fillStyle = '#0b2316';
    ctx.fillRect(-20, H / 2, W + 40, H / 2 + 20);

    // رندر جاده
    const base = findSeg(position);
    const basePct = (position % SEG) / SEG;
    const pZ = CAM_H * CAM_D;
    const playerSeg = findSeg(position + pZ);
    const playerPct = ((position + pZ) % SEG) / SEG;
    const playerY = playerSeg.y1 + (playerSeg.y2 - playerSeg.y1) * playerPct;
    let maxy = H;
    let x = 0, dxc = -(base.curve * basePct);
    for (let n = 0; n < DRAW; n++) {
      const seg = segments[(base.i + n) % segments.length];
      const looped = seg.i < base.i;
      const camZ = position - (looped ? trackLength : 0);
      seg.p1.z = seg.i * SEG + (looped ? trackLength : 0);
      seg.p1.x = 0; seg.p1.y = seg.y1;
      seg.p2.z = (seg.i + 1) * SEG + (looped ? trackLength : 0);
      seg.p2.x = 0; seg.p2.y = seg.y2;
      const camX = playerX * ROAD_W - x;
      const camY = playerY + CAM_H;
      project(seg.p1, camX, camY, camZ);
      project(seg.p2, camX - dxc, camY, camZ);
      // اصلاح انحنا برای p2
      x += dxc;
      dxc += seg.curve;
      seg.clip = 0;
      if (seg.p1.behind || seg.p2.sy >= seg.p1.sy || seg.p2.sy >= maxy) continue;
      renderSeg(seg.p1.sx, seg.p1.sy, seg.p1.sw, seg.p2.sx, seg.p2.sy, seg.p2.sw, seg.i);
      // مه
      const fogA = Math.pow(n / DRAW, 2.2) * 0.75;
      if (fogA > 0.02) {
        ctx.fillStyle = 'rgba(76,29,149,' + fogA.toFixed(3) + ')';
        ctx.fillRect(0, seg.p2.sy, W, seg.p1.sy - seg.p2.sy + 1);
      }
      seg.clip = maxy;
      maxy = seg.p1.sy;
    }
    // ماشین‌ها و اشیا (عقب به جلو)
    for (let n = DRAW - 1; n > 0; n--) {
      const seg = segments[(base.i + n) % segments.length];
      if (!seg.clip) continue;
      const segZ = seg.i * SEG + (seg.i < base.i ? trackLength : 0);
      // ماشین‌ها
      for (const c of cars) {
        let rel = c.z - position;
        if (rel < 0) rel += trackLength;
        const cSeg = Math.floor(((base.i + n) % segments.length));
        const carSegIdx = Math.floor((c.z / SEG)) % segments.length;
        if (carSegIdx !== cSeg) continue;
        const scale = CAM_D / ((segZ - position) || 1);
        if (scale <= 0) continue;
        const destX = seg.p1.sx + (seg.p1.sw * c.off);
        const destY = seg.p1.sy;
        const carW = seg.p1.sw * 0.42;
        if (carW < 3 || destY > seg.clip) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, seg.clip);
        ctx.clip();
        drawCarScene(destX, destY, carW, c.color, false);
        ctx.restore();
      }
      // دکور
      for (const sp of seg.sprites) {
        const scale = CAM_D / ((segZ - position) || 1);
        if (scale <= 0) continue;
        const destX = seg.p1.sx + seg.p1.sw * sp.off;
        if (destX < -60 || destX > W + 60 || seg.p1.sy > seg.clip) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, seg.clip);
        ctx.clip();
        drawSprite(sp, destX, seg.p1.sy, scale);
        ctx.restore();
      }
    }
    // ماشین بازیکن
    const pw = W * 0.3;
    drawCarScene(W / 2, H - 34, pw, '#22d3ee', !!keys.brake);
    // خط سرعت
    if (speed / MAX_SPEED > 0.85) {
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const lx = Math.random() * W;
        ctx.beginPath();
        ctx.moveTo(lx, Math.random() * H);
        ctx.lineTo(lx, Math.random() * H + 60);
        ctx.stroke();
      }
    }
    ctx.restore();
    // پیام
    if (msgT > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(msg, W / 2, 120);
    }
    // شمارش معکوس
    if (countdown) {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#22d3ee';
      ctx.font = '900 84px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const n = Math.ceil(cdT);
      ctx.fillText(cdT <= 0.4 ? (fa ? 'برو!' : 'GO!') : String(Math.max(1, n - 0)), W / 2, H / 2);
    }
  }
  function gameOver() {
    over = true;
    const sc = Math.floor(score);
    const r = api.submitScore(sc);
    sfx.lose();
    const ov = document.createElement('div');
    ov.className = 'ag-overlay';
    ov.dataset.over = '1';
    ov.innerHTML = '<h2>🏁</h2><div class="ag-big">' + pnum(sc) + '</div>' +
      '<p>🛣 ' + '" + pnum(Math.floor(position / SEG)) + "' + 'm</p>' +
      '<p>' + (r.record ? '🎉 ' + (fa ? 'رکورد جدید!' : 'New record!') : (fa ? 'رکورد: ' : 'Best: ') + pnum(r.value) + 'm') + '</p>' +
      '<button class="ag-btn ag-btn--primary" type="button" data-again>' + (fa ? '↻ مسابقه دوباره' : '↻ Race again') + '</button>';
    wrap.querySelector('.ag-board').appendChild(ov);
    ov.querySelector('[data-again]').addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); reset(); });
  }
  function hideOver() { const o = wrap.querySelector('[data-over]'); if (o) o.remove(); }
  function resize() {
    const box = wrap.querySelector('.ag-board');
    const w = Math.min(520, box.clientWidth - 24);
    const h = Math.round(w * (H / W));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function onKey(e, down) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = down; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = down; e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { keys.brake = down; e.preventDefault(); }
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);
  wrap.querySelectorAll('[data-k]').forEach((b) => {
    const k = b.dataset.k;
    const dn = (e) => { e.preventDefault(); sfx.unlock(); if (k === 'left') keys.left = true; if (k === 'right') keys.right = true; if (k === 'brake') keys.brake = true; };
    const up = () => { if (k === 'left') keys.left = false; if (k === 'right') keys.right = false; if (k === 'brake') keys.brake = false; };
    b.addEventListener('pointerdown', dn);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => b.addEventListener(t, up));
  });
  // فرمون لمسی با درگ روی کانوس
  let dragX = null;
  canvas.addEventListener('pointerdown', (e) => { dragX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (dragX === null) return;
    steerTouch = clamp((e.clientX - dragX) / 90, -1, 1);
  });
  ['pointerup', 'pointercancel'].forEach((t) => canvas.addEventListener(t, () => { dragX = null; steerTouch = 0; }));
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  wrap.querySelector('[data-new]').addEventListener('click', () => { sfx.click(); reset(); });
  reset();
  resize();
  loop.start();
  return function destroy() {
    if (score > 0) api.submitScore(Math.floor(score));
    loop.stop();
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    wrap.remove();
  };
}
