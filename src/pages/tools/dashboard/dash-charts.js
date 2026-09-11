// 📊 ViXoRa Cockpit Charts — کیت نمودار کانوسی داشبورد
// src/pages/tools/dashboard/dash-charts.js
import { faDigits } from './dash-state.js';

export const DASH_PALETTE = ['#8b5cf6', '#ec4899', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#a3e635', '#818cf8', '#2dd4bf'];

function setup(canvas, h) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300;
  const hh = h || canvas.clientHeight || 160;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(hh * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, hh);
  return { c, w, h: hh };
}

export function dashEmpty(canvas, msg = 'داده‌ای نیست') {
  const { c, w, h } = setup(canvas);
  c.fillStyle = 'rgba(255,255,255,.4)';
  c.font = '12.5px Tahoma';
  c.textAlign = 'center';
  c.fillText(msg, w / 2, h / 2);
}

export function dashSpark(canvas, values, { h = 90, color = '#8b5cf6' } = {}) {
  if (!values?.length) return dashEmpty(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const min = Math.min(...values), max = Math.max(...values);
  const rng = max - min || 1;
  const px = (i) => 6 + (i / Math.max(1, values.length - 1)) * (w - 12);
  const py = (v) => hh - 8 - ((v - min) / rng) * (hh - 22);
  c.beginPath(); c.moveTo(px(0), hh - 4);
  values.forEach((v, i) => c.lineTo(px(i), py(v)));
  c.lineTo(px(values.length - 1), hh - 4); c.closePath();
  c.fillStyle = color + '2e'; c.fill();
  c.beginPath();
  values.forEach((v, i) => { if (i === 0) c.moveTo(px(i), py(v)); else c.lineTo(px(i), py(v)); });
  c.strokeStyle = color; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
  const lx = px(values.length - 1), ly = py(values[values.length - 1]);
  c.beginPath(); c.arc(lx, ly, 4, 0, 7); c.fillStyle = color; c.fill();
}

export function dashDonut(canvas, items, { h = 180, thickness = 26 } = {}) {
  if (!items?.length) return dashEmpty(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const total = items.reduce((a, b) => a + Math.max(0, b.value), 0) || 1;
  const cx = Math.min(hh / 2 + 6, 110), cy = hh / 2, R = Math.min(hh / 2 - 8, 72);
  let a = -Math.PI / 2;
  items.forEach((it, i) => {
    const frac = Math.max(0, it.value) / total;
    const a2 = a + frac * Math.PI * 2;
    c.beginPath();
    c.arc(cx, cy, R, a, Math.max(a + 0.02, a2 - 0.025));
    c.strokeStyle = it.color || DASH_PALETTE[i % DASH_PALETTE.length];
    c.lineWidth = thickness;
    c.stroke();
    a = a2;
  });
  c.fillStyle = '#fff'; c.textAlign = 'center';
  c.font = 'bold 14px Tahoma';
  c.fillText(faDigits(String(Math.round(total))), cx, cy + 2);
  c.font = '10px Tahoma'; c.fillStyle = 'rgba(255,255,255,.55)';
  c.fillText('جمع', cx, cy + 17);
  c.textAlign = 'right';
  const lx = w - 6;
  let y = 18;
  items.slice(0, 6).forEach((it, i) => {
    c.fillStyle = it.color || DASH_PALETTE[i % DASH_PALETTE.length];
    c.beginPath(); c.arc(lx - 6, y - 4, 5, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.font = '11px Tahoma';
    c.fillText(`${String(it.label || '').slice(0, 14)} ${faDigits(String(Math.round((Math.max(0, it.value) / total) * 100)))}٪`, lx - 16, y);
    y += 24;
  });
}

export function dashHBars(canvas, items, { perRow = 32 } = {}) {
  if (!items?.length) return dashEmpty(canvas);
  const H = Math.max(60, items.length * perRow + 14);
  const { c, w } = setup(canvas, H);
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  items.forEach((it, i) => {
    const y = 8 + i * perRow;
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.font = '11px Tahoma'; c.textAlign = 'right';
    c.fillText(String(it.label || '').slice(0, 18), w - 6, y + 11);
    const bw = w - 120;
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.beginPath(); c.roundRect(100, y, bw, 13, 6); c.fill();
    const fill = Math.max(4, (Math.abs(it.value) / max) * bw);
    c.fillStyle = it.color || DASH_PALETTE[i % DASH_PALETTE.length];
    c.beginPath(); c.roundRect(100, y, fill, 13, 6); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.font = 'bold 10.5px Tahoma';
    c.fillText(faDigits(String(Math.round(it.value))), 6, y + 11);
  });
}

export function dashVBars(canvas, items, { h = 160 } = {}) {
  if (!items?.length) return dashEmpty(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const n = items.length;
  const bw = Math.min(40, (w - 14) / n - 6);
  const base = hh - 24;
  items.forEach((it, i) => {
    const bh = Math.max(3, (Math.abs(it.value) / max) * (base - 22));
    const x = w - 7 - (i + 1) * ((w - 14) / n) + ((w - 14) / n - bw) / 2;
    const col = it.color || DASH_PALETTE[i % DASH_PALETTE.length];
    const g = c.createLinearGradient(0, base - bh, 0, base);
    g.addColorStop(0, col); g.addColorStop(1, col + '44');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(x, base - bh, bw, bh, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '9.5px Tahoma'; c.textAlign = 'center';
    c.fillText(String(it.label || '').slice(0, 7), x + bw / 2, hh - 8);
  });
}

export function dashRing(canvas, frac, { color = '#34d399', label = '', h = 120 } = {}) {
  const { c, w, h: hh } = setup(canvas, h);
  const cx = w / 2, cy = hh / 2, R = Math.min(w, hh) / 2 - 11;
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 12; c.stroke();
  c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac)));
  c.strokeStyle = color; c.lineWidth = 12; c.lineCap = 'round'; c.stroke();
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 16px Tahoma';
  c.fillText(faDigits(String(Math.round(frac * 100))) + '٪', cx, cy + 1);
  if (label) { c.font = '10.5px Tahoma'; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(label, cx, cy + 18); }
}

export function dashGauge(canvas, frac, { label = '', h = 110 } = {}) {
  const { c, w, h: hh } = setup(canvas, h);
  const cx = w / 2, cy = hh - 14, R = Math.min(w / 2 - 16, hh - 26);
  c.beginPath(); c.arc(cx, cy, R, Math.PI, 2 * Math.PI);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 14; c.stroke();
  const col = frac >= 0.7 ? '#34d399' : frac >= 0.4 ? '#fbbf24' : '#f43f5e';
  c.beginPath(); c.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * Math.max(0, Math.min(1, frac)));
  c.strokeStyle = col; c.lineWidth = 14; c.lineCap = 'round'; c.stroke();
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 15px Tahoma';
  c.fillText(faDigits(String(Math.round(frac * 100))) + '٪', cx, cy - 8);
  if (label) { c.font = '10.5px Tahoma'; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(label, cx, cy + 10); }
}

// نقشه حرارتی ۷×N هفته
export function dashHeatmap(canvas, weeks, { h = 120 } = {}) {
  if (!weeks?.length) return dashEmpty(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const cols = weeks.length, rows = 7;
  const gx = (w - 10) / cols, gy = (hh - 10) / rows;
  const s = Math.max(4, Math.min(gx, gy) - 3);
  const max = Math.max(...weeks.flat(), 1);
  weeks.forEach((week, ci) => {
    week.forEach((v, ri) => {
      const x = w - 5 - (ci + 1) * (s + 3) + 3;
      const y = 5 + ri * (s + 3);
      const t = v / max;
      c.fillStyle = t <= 0 ? 'rgba(255,255,255,.07)' : `rgba(52,211,153,${0.25 + t * 0.75})`;
      c.beginPath(); c.roundRect(x, y, s, s, 2); c.fill();
    });
  });
}

// رادار چندمحوره
export function dashRadar(canvas, axes, { h = 200 } = {}) {
  if (!axes?.length) return dashEmpty(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const cx = w / 2, cy = hh / 2, R = Math.min(w, hh) / 2 - 30;
  const n = axes.length;
  const pt = (i, f) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f];
  };
  for (const f of [0.25, 0.5, 0.75, 1]) {
    c.beginPath();
    axes.forEach((_, i) => { const [x, y] = pt(i, f); if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); });
    c.closePath();
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.stroke();
  }
  c.beginPath();
  axes.forEach((ax, i) => { const [x, y] = pt(i, Math.max(0.03, Math.min(1, ax.value))); if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); });
  c.closePath();
  c.fillStyle = 'rgba(139,92,246,.3)'; c.fill();
  c.strokeStyle = '#8b5cf6'; c.lineWidth = 2; c.stroke();
  c.font = '10.5px Tahoma'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.8)';
  axes.forEach((ax, i) => {
    const [x, y] = pt(i, 1.18);
    c.fillText(String(ax.label || '').slice(0, 10), Math.max(30, Math.min(w - 30, x)), Math.max(12, Math.min(hh - 4, y)));
  });
}

// دو خط مقایسه‌ای
export function dashDual(canvas, a, b, { h = 140, labels = ['A', 'B'], colors = ['#64748b', '#8b5cf6'] } = {}) {
  const n = Math.max(a?.length || 0, b?.length || 0);
  if (!n) return dashEmpty(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const all = [...(a || []), ...(b || [])];
  const min = Math.min(...all), max = Math.max(...all);
  const rng = max - min || 1;
  const px = (i) => 10 + (i / Math.max(1, n - 1)) * (w - 20);
  const py = (v) => hh - 26 - ((v - min) / rng) * (hh - 48);
  const line = (arr, col, dash) => {
    if (!arr?.length) return;
    c.beginPath();
    arr.forEach((v, i) => { if (i === 0) c.moveTo(px(i), py(v)); else c.lineTo(px(i), py(v)); });
    c.strokeStyle = col; c.lineWidth = 2.5; c.setLineDash(dash); c.stroke(); c.setLineDash([]);
  };
  line(a, colors[0], [5, 4]);
  line(b, colors[1], []);
  c.font = '10.5px Tahoma'; c.textAlign = 'right';
  c.fillStyle = colors[0]; c.fillText('┄ ' + labels[0], w - 10, 14);
  c.fillStyle = colors[1]; c.fillText('━ ' + labels[1], w - 10, 30);
}

// میله انباشته افقی (سهم‌ها از کل)
export function dashStack(canvas, parts, { h = 60 } = {}) {
  const { c, w, h: hh } = setup(canvas, h);
  const total = parts.reduce((a, b) => a + Math.max(0, b.value), 0) || 1;
  let x = 8;
  const bw = w - 16;
  parts.forEach((p, i) => {
    const f = Math.max(0, p.value) / total;
    c.fillStyle = p.color || DASH_PALETTE[i % DASH_PALETTE.length];
    c.beginPath(); c.roundRect(x, hh / 2 - 12, Math.max(2, f * bw), 24, 6); c.fill();
    x += f * bw;
  });
  c.font = '10px Tahoma'; c.textAlign = 'center';
  x = 8;
  parts.forEach((p) => {
    const f = Math.max(0, p.value) / total;
    if (f > 0.12) {
      c.fillStyle = '#fff';
      c.fillText(String(p.label || '').slice(0, 10), x + (f * bw) / 2, hh / 2 + 4);
    }
    x += f * bw;
  });
}

// حلقه‌های متحدالمرکز
export function dashMultiRing(canvas, rings, { h = 150 } = {}) {
  const { c, w, h: hh } = setup(canvas, h);
  const cx = w / 2, cy = hh / 2;
  const base = Math.min(w, hh) / 2 - 8;
  rings.slice(0, 4).forEach((r, i) => {
    const R = base - i * 16;
    if (R <= 8) return;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 10; c.stroke();
    c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, r.value)));
    c.strokeStyle = r.color || DASH_PALETTE[i % DASH_PALETTE.length];
    c.lineWidth = 10; c.lineCap = 'round'; c.stroke();
  });
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 13px Tahoma';
  c.fillText(String(rings[0]?.label || ''), cx, cy + 4);
}

// ناحیه‌ای با آستانه
export function dashArea(canvas, values, { h = 110, color = '#38bdf8', threshold = null } = {}) {
  if (!values?.length) return dashEmpty(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const min = Math.min(...values, threshold ?? Infinity), max = Math.max(...values, threshold ?? -Infinity);
  const rng = max - min || 1;
  const px = (i) => 6 + (i / Math.max(1, values.length - 1)) * (w - 12);
  const py = (v) => hh - 8 - ((v - min) / rng) * (hh - 20);
  c.beginPath(); c.moveTo(px(0), hh - 4);
  values.forEach((v, i) => c.lineTo(px(i), py(v)));
  c.lineTo(px(values.length - 1), hh - 4); c.closePath();
  const g = c.createLinearGradient(0, 0, 0, hh);
  g.addColorStop(0, color); g.addColorStop(1, color + '11');
  c.fillStyle = g; c.fill();
  if (threshold != null) {
    c.strokeStyle = '#f43f5e'; c.setLineDash([5, 4]); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, py(threshold)); c.lineTo(w, py(threshold)); c.stroke();
    c.setLineDash([]);
  }
}

// شمارنده بزرگ متنی
export function dashBigNum(canvas, value, label, { h = 80, color = '#fff' } = {}) {
  const { c, w, h: hh } = setup(canvas, h);
  c.fillStyle = color; c.textAlign = 'center'; c.font = 'bold 26px Tahoma';
  c.fillText(faDigits(String(value)), w / 2, hh / 2 + 2);
  c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '11px Tahoma';
  c.fillText(String(label || ''), w / 2, hh / 2 + 22);
}

/* ---------- حلقه چندگانه (تا ۳ مقدار) ---------- */
export function dashRings(canvas, vals, { h = 130 } = {}) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 220;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = w / 2, cy = h / 2;
  const cols = ['#8b5cf6', '#22d3ee', '#f59e0b'];
  vals.slice(0, 3).forEach(([v, max], i) => {
    const r = Math.min(w, h) / 2 - 8 - i * 16;
    const p = Math.max(0, Math.min(1, v / Math.max(1, max)));
    c.lineWidth = 10; c.lineCap = 'round';
    c.strokeStyle = 'rgba(128,128,128,.2)';
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = cols[i % 3];
    c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); c.stroke();
  });
}

/* ---------- میله افقی رتبه‌بندی ---------- */
export function dashRank(canvas, rows, { h = 150 } = {}) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const max = Math.max(...rows.map((r) => r[1]), 1);
  const rh = Math.min(26, (h - 10) / Math.max(1, rows.length) - 6);
  rows.slice(0, 7).forEach(([label, v], i) => {
    const y = 8 + i * (rh + 8);
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '11px Tahoma'; c.textAlign = 'right';
    c.fillText(String(label).slice(0, 14), w - 8, y + rh / 2 + 4);
    const bw = (w - 130) * (v / max);
    const g = c.createLinearGradient(w - 122, 0, w - 122 - bw, 0);
    g.addColorStop(0, '#8b5cf6'); g.addColorStop(1, '#ec4899');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(w - 122 - bw, y, Math.max(4, bw), rh, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.textAlign = 'left';
    c.fillText(Number(v).toLocaleString('fa-IR'), 8, y + rh / 2 + 4);
  });
}

/* ---------- هلپرهای رشته‌ای SVG/HTML برای ویجت‌ها ---------- */
const SVG_PALETTE = ['#8b5cf6', '#ec4899', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a3e635', '#fb923c'];
const svgEsc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const svgFa = (n) => Number(n || 0).toLocaleString('fa-IR');

/** اسپارک‌لاین رشته‌ای */
export function svgSpark(vals, w = 140, h = 36, color = '#8b5cf6') {
  if (!vals || !vals.length) return '';
  const mx = Math.max(...vals, 1), mn = Math.min(...vals, 0);
  const pts = vals.map((v, i) => `${(i / Math.max(1, vals.length - 1) * w).toFixed(1)},${(h - 3 - ((v - mn) / Math.max(1, mx - mn)) * (h - 6)).toFixed(1)}`).join(' ');
  return `<svg class="dash-svg-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:${h}px"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/** میله‌های افقی رشته‌ای — rows: [[label, value]] */
export function svgBars(rows, maxRows = 6) {
  const list = (rows || []).slice(0, maxRows);
  if (!list.length) return '';
  const max = Math.max(...list.map((r) => +r[1] || 0), 1);
  return `<div class="dash-svg-bars">${list.map(([l, v], i) => `
    <div class="dash-svg-bar-row"><span class="dash-svg-bar-l">${svgEsc(l)}</span>
    <span class="dash-svg-bar-t"><i style="width:${Math.max(2, Math.round((+v || 0) / max * 100))}%;background:${SVG_PALETTE[i % SVG_PALETTE.length]}"></i></span>
    <b class="dash-svg-bar-v">${svgFa(v)}</b></div>`).join('')}</div>`;
}

/** دونات رشته‌ای — rows: [[label, value]] */
export function svgDonut(rows, maxRows = 6) {
  const list = (rows || []).filter((r) => (+r[1] || 0) > 0).slice(0, maxRows);
  if (!list.length) return '';
  const total = list.reduce((a, r) => a + (+r[1] || 0), 0) || 1;
  let acc = 0;
  const segs = list.map(([l, v], i) => {
    const p0 = acc / total * 100;
    acc += (+v || 0);
    const p1 = acc / total * 100;
    return `${SVG_PALETTE[i % SVG_PALETTE.length]} ${p0.toFixed(1)}% ${p1.toFixed(1)}%`;
  }).join(', ');
  return `<div class="dash-svg-donut"><span class="dash-svg-donut-c" style="background:conic-gradient(${segs})"></span>
    <span class="dash-svg-donut-l">${list.map(([l, v], i) => `<span><i style="background:${SVG_PALETTE[i % SVG_PALETTE.length]}"></i>${svgEsc(l)} <b>${svgFa(v)}</b></span>`).join('')}</span></div>`;
}
