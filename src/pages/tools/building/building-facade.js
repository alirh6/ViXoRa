// src/pages/tools/building/building-facade.js

/**
 * ساختمون‌یار — نمای ساختمون 🏙️
 * ==================================================================
 * ساختمون SVG کاملاً داینامیک (هر تعداد طبقه/واحد) با انیمیشن محیطی:
 * ابرهای شناور، شب/روز خودکار، چشمک ستاره‌ها، چراغ ورودی، آنتن…
 * هر پنجره = یک واحد؛ کلیک = ورود به واحد.
 */

import { faNum, parseSlot, shortSlot } from './building-store.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** رندوم پایدار (تا با هر رندر ستاره‌ها جابه‌جا نشن) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CURTAINS = ['#e2725b', '#5b8ce2', '#63b995', '#c9a227', '#9a6ac8', '#e2915b', '#5bb8c8', '#c86a8a'];

export function resolveFacadeMode(mode) {
  if (mode === 'day' || mode === 'night') return mode;
  const h = new Date().getHours();
  return h >= 6 && h < 19 ? 'day' : 'night';
}

export function renderFacadeSVG({
  building,
  unitsBySlot = {},
  balances = {},
  mySlot = '',
  managerSlot = '',
  mode = 'auto',
} = {}) {
  const floors = Math.max(1, Number(building?.floors) || 1);
  const upf = Math.max(1, Number(building?.unitsPerFloor) || 1);
  const night = resolveFacadeMode(mode) === 'night';
  const rnd = mulberry32(floors * 131 + upf * 17 + 7);

  // ---- ابعاد ----
  const winW = 66;
  const winH = 84;
  const gapX = 30;
  const gapY = 34;
  const padX = 56;
  const padTop = 34;
  const upfCapped = upf;
  const bodyW = padX * 2 + upfCapped * winW + (upfCapped - 1) * gapX;
  const floorsH = floors * winH + (floors - 1) * gapY;
  const groundH = 132;
  const roofH = 66;
  const bodyH = padTop + floorsH + 26 + groundH;
  const side = 120;
  const W = bodyW + side * 2;
  const H = roofH + bodyH + 104;
  const bx = side; // x بدنه
  const by = roofH; // y بدنه

  const winX = (n) => bx + padX + (upfCapped - n) * (winW + gapX);
  const winY = (f) => by + padTop + (floors - f) * (winH + gapY);

  let s = `<svg class="bld-facade-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="نمای ساختمان">`;
  s += `<defs>
    <linearGradient id="bldSky" x1="0" y1="0" x2="0" y2="1">
      ${night ? '<stop offset="0" stop-color="#05081a"/><stop offset=".6" stop-color="#101b3f"/><stop offset="1" stop-color="#1d2f5e"/>' : '<stop offset="0" stop-color="#5aa9f0"/><stop offset=".65" stop-color="#a8d8ff"/><stop offset="1" stop-color="#e3f4ff"/>'}
    </linearGradient>
    <linearGradient id="bldBody" x1="0" y1="0" x2="1" y2="0">
      ${night ? '<stop offset="0" stop-color="#2a3350"/><stop offset=".5" stop-color="#39446a"/><stop offset="1" stop-color="#232b46"/>' : '<stop offset="0" stop-color="#c9b294"/><stop offset=".5" stop-color="#e8d3b3"/><stop offset="1" stop-color="#b89a78"/>'}
    </linearGradient>
    <linearGradient id="bldGlassDay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#5f9fd6"/>
    </linearGradient>
    <linearGradient id="bldGlassDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a2338"/><stop offset="1" stop-color="#0c1222"/>
    </linearGradient>
    <radialGradient id="bldLit" cx=".5" cy=".4" r=".8">
      <stop offset="0" stop-color="#ffe9b3"/><stop offset=".6" stop-color="#ffc95e"/><stop offset="1" stop-color="#e09b2d"/>
    </radialGradient>
    <radialGradient id="bldGlow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffd166" stop-opacity=".9"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bldDoor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b4a2f"/><stop offset="1" stop-color="#3d2716"/>
    </linearGradient>
    <linearGradient id="bldGrass" x1="0" y1="0" x2="0" y2="1">
      ${night ? '<stop offset="0" stop-color="#1d4a2f"/><stop offset="1" stop-color="#0f2a1b"/>' : '<stop offset="0" stop-color="#6fce7e"/><stop offset="1" stop-color="#3d9e52"/>'}
    </linearGradient>
  </defs>`;

  // ---- آسمان ----
  s += `<rect x="0" y="0" width="${W}" height="${H}" rx="24" fill="url(#bldSky)"/>`;
  if (night) {
    let stars = '';
    for (let i = 0; i < 26; i++) {
      const x = rnd() * W;
      const y = rnd() * (H * 0.45);
      const r = 0.8 + rnd() * 1.6;
      stars += `<circle class="bld-star" style="animation-delay:${(rnd() * 3).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff"/>`;
    }
    s += stars;
    s += `<g><circle cx="${W - 74}" cy="74" r="40" fill="url(#bldGlow)"/><circle cx="${W - 74}" cy="74" r="24" fill="#f4f1de"/><circle cx="${W - 64}" cy="66" r="20" fill="#101b3f" opacity=".9"/></g>`;
  } else {
    s += `<g class="bld-sun"><circle cx="96" cy="92" r="30" fill="#ffd94d"/><circle cx="96" cy="92" r="44" fill="#ffd94d" opacity=".25"/></g>`;
  }
  // ابرها
  const cloud = (cx, cy, sc, cls) =>
    `<g transform="translate(${cx} ${cy}) scale(${sc})"><g class="bld-cloud ${cls}" fill="${night ? '#ffffff22' : '#fffffff0'}"><ellipse cx="0" cy="0" rx="34" ry="16"/><ellipse cx="24" cy="-8" rx="26" ry="15"/><ellipse cx="-26" cy="-4" rx="22" ry="13"/></g></g>`;
  s += cloud(W * 0.2, 70, 1, 'c1') + cloud(W * 0.55, 130, 0.7, 'c2') + cloud(W * 0.85, 56, 1.25, 'c3');

  // ---- زمین ----
  const gy = by + bodyH;
  s += `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="url(#bldGrass)"/>`;
  s += `<rect x="0" y="${gy}" width="${W}" height="10" fill="${night ? '#0c1f14' : '#2f7a42'}"/>`;
  // پیاده‌رو تا درب
  const doorCX = bx + bodyW / 2;
  s += `<polygon points="${doorCX - 34},${gy} ${doorCX + 34},${gy} ${doorCX + 52},${H} ${doorCX - 52},${H}" fill="${night ? '#3a4160' : '#d9c9a8'}" opacity=".9"/>`;
  // درخت‌ها و بوته‌ها
  const tree = (x, sc) => {
    const ty = gy + 34;
    return `<g transform="translate(${x} ${ty}) scale(${sc})"><rect x="-5" y="-34" width="10" height="34" rx="4" fill="#5b3a22"/><circle cx="0" cy="-52" r="26" fill="${night ? '#1e5c33' : '#3fa34d'}"/><circle cx="-18" cy="-40" r="17" fill="${night ? '#277040' : '#55b563'}"/><circle cx="18" cy="-42" r="18" fill="${night ? '#17452a' : '#2e8b3d'}"/></g>`;
  };
  s += tree(58, 1) + tree(W - 58, 1.15) + tree(132, 0.7) + tree(W - 132, 0.7);
  const bush = (x) => `<circle cx="${x}" cy="${gy + 26}" r="16" fill="${night ? '#1e5c33' : '#4cbb5e'}"/>`;
  s += bush(bx - 34) + bush(bx + bodyW + 34);

  // ---- بدنه ساختمون ----
  s += `<rect x="${bx}" y="${by}" width="${bodyW}" height="${bodyH}" rx="16" fill="url(#bldBody)"/>`;
  s += `<rect x="${bx}" y="${by}" width="${bodyW}" height="${bodyH}" rx="16" fill="none" stroke="${night ? '#ffffff22' : '#00000022'}" stroke-width="2"/>`;
  // خطوط جداکننده طبقات
  for (let f = 1; f < floors; f++) {
    const ly = by + padTop + f * (winH + gapY) - gapY / 2;
    s += `<line x1="${bx + 14}" y1="${ly}" x2="${bx + bodyW - 14}" y2="${ly}" stroke="${night ? '#ffffff14' : '#00000018'}" stroke-width="2"/>`;
  }

  // ---- پشت‌بام ----
  s += `<rect x="${bx - 8}" y="${by - 26}" width="${bodyW + 16}" height="30" rx="8" fill="${night ? '#1c2440' : '#8a6f4d'}"/>`;
  for (let x = bx + 6; x < bx + bodyW - 6; x += 26) {
    s += `<rect x="${x}" y="${by - 48}" width="5" height="24" rx="2" fill="${night ? '#39446a' : '#6e5840'}"/>`;
  }
  s += `<rect x="${bx + 6}" y="${by - 52}" width="${bodyW - 12}" height="6" rx="3" fill="${night ? '#39446a' : '#6e5840'}"/>`;
  // منبع آب + آنتن
  s += `<g><rect x="${bx + bodyW - 92}" y="${by - 92}" width="56" height="42" rx="10" fill="${night ? '#2b3554' : '#7fb3d5'}" stroke="${night ? '#ffffff22' : '#00000022'}" stroke-width="2"/><rect x="${bx + bodyW - 80}" y="${by - 52}" width="8" height="6" fill="#555"/><rect x="${bx + bodyW - 56}" y="${by - 52}" width="8" height="6" fill="#555"/></g>`;
  s += `<g><line x1="${bx + 66}" y1="${by - 48}" x2="${bx + 66}" y2="${by - 108}" stroke="${night ? '#8b93b8' : '#555'}" stroke-width="4"/><circle class="bld-blink" cx="${bx + 66}" cy="${by - 112}" r="6" fill="#ff4d5e"/></g>`;

  // ---- پنجره‌ها = واحدها ----
  for (let f = 1; f <= floors; f++) {
    for (let n = 1; n <= upf; n++) {
      const key = `${f}-${n}`;
      const unit = unitsBySlot[key];
      const bal = balances[key];
      const x = winX(n);
      const y = winY(f);
      const occupied = !!unit;
      const curtain = CURTAINS[(f * 3 + n * 5) % CURTAINS.length];
      const status = !bal || bal.remaining <= 0 ? 'ok' : bal.overdue ? 'bad' : 'warn';
      const dotColor = status === 'ok' ? '#2dffb2' : status === 'warn' ? '#ffcf4d' : '#ff4d5e';
      const glassFill = occupied ? (night ? 'url(#bldLit)' : 'url(#bldGlassDay)') : 'url(#bldGlassDark)';
      const own = mySlot === key;
      const mgr = managerSlot === key;

      s += `<g class="bld-win${own ? ' is-own' : ''}" data-action="open-unit" data-slot="${key}" tabindex="0" role="button" aria-label="${esc(unit ? unit.headName + ' — ' + shortSlot(key) : 'واحد خالی ' + shortSlot(key))}">`;
      if (own) s += `<rect class="bld-win-ring" x="${x - 7}" y="${y - 7}" width="${winW + 14}" height="${winH + 14}" rx="14"/>`;
      s += `<rect x="${x}" y="${y}" width="${winW}" height="${winH}" rx="10" fill="${night ? '#141b31' : '#5e4a33'}" stroke="${night ? '#ffffff30' : '#00000030'}" stroke-width="2"/>`;
      s += `<rect x="${x + 6}" y="${y + 6}" width="${winW - 12}" height="${winH - 12}" rx="7" fill="${glassFill}"/>`;
      if (occupied) {
        s += `<rect x="${x + 6}" y="${y + 6}" width="13" height="${winH - 12}" rx="6" fill="${curtain}" opacity=".92"/>`;
        s += `<rect x="${x + winW - 19}" y="${y + 6}" width="13" height="${winH - 12}" rx="6" fill="${curtain}" opacity=".92"/>`;
        if (!night) {
          s += `<polygon points="${x + 14},${y + 6} ${x + 34},${y + 6} ${x + 16},${y + winH - 6} ${x + 8},${y + winH - 6}" fill="#ffffff" opacity=".35"/>`;
        }
      } else {
        s += `<text x="${x + winW / 2}" y="${y + winH / 2 + 4}" text-anchor="middle" font-size="11" fill="#8b93b8">خالی</text>`;
      }
      s += `<line x1="${x + winW / 2}" y1="${y + 6}" x2="${x + winW / 2}" y2="${y + winH - 6}" stroke="${night ? '#141b31' : '#5e4a33'}" stroke-width="3"/>`;
      // نقطه وضعیت بدهی
      s += `<circle cx="${x + 11}" cy="${y + 11}" r="7" fill="${dotColor}"><animate attributeName="opacity" values="1;.55;1" dur="${status === 'bad' ? '1s' : '2.6s'}" repeatCount="indefinite"/></circle>`;
      // پلاک واحد
      s += `<rect x="${x + 8}" y="${y + winH + 4}" width="${winW - 16}" height="17" rx="8.5" fill="#00000055"/><text x="${x + winW / 2}" y="${y + winH + 16.5}" text-anchor="middle" font-size="10.5" fill="#fff">${shortSlot(key)}</text>`;
      if (mgr) s += `<text x="${x + winW / 2}" y="${y - 10}" text-anchor="middle" font-size="17">👑</text>`;
      else if (own) s += `<text x="${x + winW / 2}" y="${y - 10}" text-anchor="middle" font-size="15">⭐</text>`;
      s += `</g>`;
    }
    // لیبل طبقه
    const fy = winY(f) + winH / 2 + 5;
    s += `<text x="${bx + bodyW + 14}" y="${fy}" font-size="12" fill="${night ? '#aeb8d8' : '#5a4a35'}">طبقه ${faNum(f)}</text>`;
  }

  // ---- ورودی ----
  const doorW = 84;
  const doorH = 96;
  const dx = doorCX - doorW / 2;
  const dy = gy - doorH - 8;
  s += `<rect x="${dx - 14}" y="${dy - 40}" width="${doorW + 28}" height="${doorH + 48}" rx="14" fill="${night ? '#1c2440' : '#00000022'}"/>`;
  s += `<path d="M ${dx} ${dy + doorH} L ${dx} ${dy + 26} Q ${dx} ${dy} ${dx + doorW / 2} ${dy} Q ${dx + doorW} ${dy} ${dx + doorW} ${dy + 26} L ${dx + doorW} ${dy + doorH} Z" fill="url(#bldDoor)" stroke="${night ? '#ffd16688' : '#00000044'}" stroke-width="2.5"/>`;
  s += `<line x1="${doorCX}" y1="${dy + 8}" x2="${doorCX}" y2="${dy + doorH}" stroke="#00000066" stroke-width="2"/>`;
  s += `<circle cx="${doorCX - 10}" cy="${dy + doorH - 34}" r="3.5" fill="#ffd166"/><circle cx="${doorCX + 10}" cy="${dy + doorH - 34}" r="3.5" fill="#ffd166"/>`;
  // چراغ‌های ورودی
  const lamp = (lx) => `<g><rect x="${lx - 7}" y="${dy + 6}" width="14" height="20" rx="5" fill="#2b2118" stroke="#ffd166" stroke-width="1.5"/><circle class="bld-lamp" cx="${lx}" cy="${dy + 16}" r="4" fill="#ffe9b3"/><circle cx="${lx}" cy="${dy + 16}" r="18" fill="url(#bldGlow)" opacity=".8"/></g>`;
  s += lamp(dx - 26) + lamp(dx + doorW + 26);
  // پلاک اسم ساختمون
  const name = esc(building?.name || 'ساختمان').slice(0, 26);
  s += `<rect x="${doorCX - 92}" y="${dy - 34}" width="184" height="30" rx="9" fill="#101728" stroke="#ffd166" stroke-width="1.5"/><text x="${doorCX}" y="${dy - 13}" text-anchor="middle" font-size="13.5" fill="#ffe9b3" font-weight="bold">${name}</text>`;
  // پله‌ها
  s += `<rect x="${dx - 18}" y="${gy - 8}" width="${doorW + 36}" height="8" rx="3" fill="${night ? '#39446a' : '#b09a7a'}"/>`;

  // ---- نرده حیاط ----
  for (let x = 8; x < W - 8; x += 34) {
    if (Math.abs(x - doorCX) < 56) continue;
    s += `<rect x="${x}" y="${gy + 44}" width="6" height="30" rx="3" fill="${night ? '#2c3554' : '#7a6248'}"/>`;
  }
  s += `<rect x="4" y="${gy + 48}" width="${doorCX - 58}" height="6" rx="3" fill="${night ? '#2c3554' : '#7a6248'}"/>`;
  s += `<rect x="${doorCX + 56}" y="${gy + 48}" width="${W - doorCX - 60}" height="6" rx="3" fill="${night ? '#2c3554' : '#7a6248'}"/>`;

  s += `</svg>`;
  return s;
}
