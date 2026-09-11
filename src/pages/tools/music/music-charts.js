// 🎨 ViXoRa Music Charts — کیت نمودار کانوسی (دونات، میله، خط، هیت‌مپ، اسپارک، گیج)
import { faDigits } from '../../../core/schemas/music-schema.js';

const PALETTE = ['#8b5cf6', '#ec4899', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a3e635', '#f472b6', '#818cf8', '#facc15'];

function ctx2d(canvas, h) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 300;
  canvas.width = Math.max(50, Math.round(w * dpr));
  canvas.height = Math.round(h * dpr);
  canvas.style.height = h + 'px';
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, w, h };
}
function fmtN(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

/** نمودار دونات؛ items: [{label, value, color?}] */
export function drawDonut(canvas, items, { h = 220, centerLabel = '', centerValue = '' } = {}) {
  const { c, w } = ctx2d(canvas, h);
  const total = items.reduce((a, b) => a + (b.value || 0), 0) || 1;
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 12, r = R * 0.58;
  let a = -Math.PI / 2;
  c.lineWidth = 1;
  items.forEach((it, i) => {
    const frac = (it.value || 0) / total;
    const a2 = a + frac * Math.PI * 2;
    c.beginPath();
    c.arc(cx, cy, R, a + 0.012, a2 - 0.012);
    c.arc(cx, cy, r, a2 - 0.012, a + 0.012, true);
    c.closePath();
    c.fillStyle = it.color || PALETTE[i % PALETTE.length];
    c.fill();
    a = a2;
  });
  c.fillStyle = '#e6e9f5';
  c.font = '700 15px Tahoma, sans-serif';
  c.textAlign = 'center';
  c.fillText(faDigits(String(centerValue)), cx, cy - 2);
  c.fillStyle = '#9aa3c0';
  c.font = '11px Tahoma, sans-serif';
  c.fillText(centerLabel, cx, cy + 16);
  canvas._tip = items.map((it) => `${it.label}: ${fmtN(it.value)} (${Math.round((it.value / total) * 100)}٪)`);
  canvas.title = canvas._tip.join('\n');
}

/** میله‌های افقی */
export function drawHBars(canvas, items, { h = 0, max = 8, unit = '' } = {}) {
  const rows = items.slice(0, max);
  const H = h || Math.max(120, rows.length * 34 + 16);
  const { c, w } = ctx2d(canvas, H);
  const maxV = Math.max(1, ...rows.map((r) => r.value || 0));
  rows.forEach((r, i) => {
    const y = 10 + i * 34;
    c.fillStyle = '#9aa3c0';
    c.font = '12px Tahoma, sans-serif';
    c.textAlign = 'right';
    const label = String(r.label || '').slice(0, 22);
    c.fillText(label, w - 8, y + 14);
    const bw = w - 170;
    const fill = Math.max(3, ((r.value || 0) / maxV) * bw);
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.beginPath(); c.roundRect(150, y, bw, 16, 8); c.fill();
    const g = c.createLinearGradient(150, 0, 150 + bw, 0);
    const col = r.color || PALETTE[i % PALETTE.length];
    g.addColorStop(0, col + '55'); g.addColorStop(1, col);
    c.fillStyle = g;
    c.beginPath(); c.roundRect(150 + bw - fill, y, fill, 16, 8); c.fill();
    c.fillStyle = '#e6e9f5';
    c.font = '700 12px Tahoma, sans-serif';
    c.textAlign = 'left';
    c.fillText(faDigits(fmtN(r.value || 0)) + unit, 8, y + 14);
  });
}

/** میله‌های عمودی */
export function drawVBars(canvas, items, { h = 200, unit = '' } = {}) {
  const { c, w } = ctx2d(canvas, h);
  const maxV = Math.max(1, ...items.map((r) => r.value || 0));
  const n = Math.max(1, items.length);
  const slot = w / n;
  const base = h - 26;
  items.forEach((r, i) => {
    const bh = Math.max(3, ((r.value || 0) / maxV) * (base - 30));
    const x = i * slot + slot * 0.2;
    const bw = slot * 0.6;
    const col = r.color || PALETTE[i % PALETTE.length];
    const g = c.createLinearGradient(0, base - bh, 0, base);
    g.addColorStop(0, col); g.addColorStop(1, col + '44');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(x, base - bh, bw, bh, 5); c.fill();
    c.fillStyle = '#e6e9f5';
    c.font = '700 11px Tahoma, sans-serif';
    c.textAlign = 'center';
    if (bh > 22) c.fillText(faDigits(fmtN(r.value || 0)), x + bw / 2, base - bh + 15);
    c.fillStyle = '#9aa3c0';
    c.font = '11px Tahoma, sans-serif';
    c.fillText(String(r.label || '').slice(0, 8), x + bw / 2, base + 16);
  });
  void unit;
}

/** خط/ناحیه */
export function drawLine(canvas, points, { h = 200, color = '#8b5cf6', fill = true, unit = '' } = {}) {
  const { c, w } = ctx2d(canvas, h);
  if (!points.length) return;
  const maxV = Math.max(1, ...points.map((p) => p.value || 0));
  const minV = Math.min(0, ...points.map((p) => p.value || 0));
  const pad = 30;
  const X = (i) => pad + (i / Math.max(1, points.length - 1)) * (w - pad * 2);
  const Y = (v) => (h - 26) - ((v - minV) / Math.max(1, maxV - minV)) * (h - 60);
  // گرید
  c.strokeStyle = 'rgba(255,255,255,.08)';
  c.lineWidth = 1;
  for (let gLine = 0; gLine < 4; gLine++) {
    const y = 14 + gLine * ((h - 44) / 3);
    c.beginPath(); c.moveTo(pad, y); c.lineTo(w - 8, y); c.stroke();
    c.fillStyle = '#7c86a5';
    c.font = '10px Tahoma, sans-serif';
    c.textAlign = 'left';
    const vv = maxV - (gLine / 3) * (maxV - minV);
    c.fillText(faDigits(fmtN(vv)) + unit, 2, y + 3);
  }
  if (fill) {
    const g = c.createLinearGradient(0, 10, 0, h - 26);
    g.addColorStop(0, color + '66'); g.addColorStop(1, color + '00');
    c.beginPath();
    c.moveTo(X(0), Y(points[0].value || 0));
    points.forEach((p, i) => c.lineTo(X(i), Y(p.value || 0)));
    c.lineTo(X(points.length - 1), h - 26); c.lineTo(X(0), h - 26);
    c.closePath(); c.fillStyle = g; c.fill();
  }
  c.beginPath();
  points.forEach((p, i) => { if (i === 0) c.moveTo(X(i), Y(p.value || 0)); else c.lineTo(X(i), Y(p.value || 0)); });
  c.strokeStyle = color; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
  points.forEach((p, i) => {
    c.beginPath(); c.arc(X(i), Y(p.value || 0), 3.5, 0, 7); c.fillStyle = '#fff'; c.fill();
    c.lineWidth = 2; c.strokeStyle = color; c.stroke();
  });
  c.fillStyle = '#9aa3c0';
  c.font = '10px Tahoma, sans-serif';
  c.textAlign = 'center';
  const step = Math.max(1, Math.ceil(points.length / 8));
  points.forEach((p, i) => { if (i % step === 0 && p.label) c.fillText(String(p.label).slice(0, 10), X(i), h - 8); });
}

/** هیت‌مپ ۷×۲۴ (روز هفته × ساعت)؛ matrix[7][24] */
export function drawHeatmap(canvas, matrix, { h = 190 } = {}) {
  const { c, w } = ctx2d(canvas, h);
  const days = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  let mx = 1;
  matrix.forEach((row) => row.forEach((v) => { if (v > mx) mx = v; }));
  const left = 26, top = 8;
  const cw = (w - left - 10) / 24, ch = (h - top - 26) / 7;
  for (let d = 0; d < 7; d++) {
    c.fillStyle = '#9aa3c0';
    c.font = '11px Tahoma, sans-serif';
    c.textAlign = 'right';
    c.fillText(days[d], left - 6, top + d * ch + ch / 2 + 4);
    for (let hh = 0; hh < 24; hh++) {
      const v = (matrix[d] && matrix[d][hh]) || 0;
      const f = v / mx;
      c.fillStyle = f <= 0 ? 'rgba(255,255,255,.06)' : `rgba(139,92,246,${0.15 + f * 0.85})`;
      c.beginPath(); c.roundRect(left + hh * cw + 1, top + d * ch + 1, cw - 2, ch - 2, 2); c.fill();
    }
  }
  c.fillStyle = '#7c86a5';
  c.font = '10px Tahoma, sans-serif';
  c.textAlign = 'center';
  for (let hh = 0; hh < 24; hh += 4) c.fillText(faDigits(String(hh)), left + hh * cw + cw / 2, h - 8);
}

/** اسپارک‌لاین */
export function drawSpark(canvas, values, { h = 44, color = '#38bdf8' } = {}) {
  const { c, w } = ctx2d(canvas, h);
  if (!values.length) return;
  const mx = Math.max(1, ...values), mn = Math.min(0, ...values);
  const X = (i) => 2 + (i / Math.max(1, values.length - 1)) * (w - 4);
  const Y = (v) => (h - 4) - ((v - mn) / Math.max(1, mx - mn)) * (h - 10);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00');
  c.beginPath();
  c.moveTo(X(0), Y(values[0]));
  values.forEach((v, i) => c.lineTo(X(i), Y(v)));
  c.lineTo(X(values.length - 1), h); c.lineTo(X(0), h);
  c.closePath(); c.fillStyle = g; c.fill();
  c.beginPath();
  values.forEach((v, i) => { if (i === 0) c.moveTo(X(i), Y(v)); else c.lineTo(X(i), Y(v)); });
  c.strokeStyle = color; c.lineWidth = 2; c.stroke();
}

/** گیج دایره‌ای ۰..۱ */
export function drawGauge(canvas, frac, { h = 130, color = '#34d399', label = '' } = {}) {
  const { c, w } = ctx2d(canvas, h);
  const cx = w / 2, cy = h - 18, R = Math.min(w / 2 - 16, h - 34);
  c.lineWidth = 13; c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,.1)';
  c.beginPath(); c.arc(cx, cy, R, Math.PI, 0); c.stroke();
  c.strokeStyle = color;
  c.beginPath(); c.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * Math.min(1, Math.max(0, frac))); c.stroke();
  c.fillStyle = '#e6e9f5';
  c.font = '700 20px Tahoma, sans-serif';
  c.textAlign = 'center';
  c.fillText(faDigits(String(Math.round(frac * 100))) + '٪', cx, cy - 8);
  if (label) {
    c.fillStyle = '#9aa3c0';
    c.font = '12px Tahoma, sans-serif';
    c.fillText(label, cx, cy + 14);
  }
}

/** دانلود PNG نمودار */
export function downloadChartPng(canvas, name) {
  try {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = (name || 'chart') + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch { return false; }
}

export function legendHtml(items) {
  return `<div class="mx-legend">${items.map((it, i) =>
    `<span class="mx-legend-item"><i style="background:${esc(it.color || PALETTE[i % PALETTE.length])}"></i>${esc(it.label)} <b>${faDigits(fmtN(it.value || 0))}</b></span>`
  ).join('')}</div>`;
}
