// 📊 ViXoRa Fin Charts — کیت نمودار کانوسی مالی (بدون وابستگی)
import { faDigits } from '../../../core/schemas/finance-schema.js';

export const FIN_PALETTE = ['#34d399', '#8b5cf6', '#fbbf24', '#38bdf8', '#f472b6', '#fb923c', '#a3e635', '#f43f5e', '#818cf8', '#2dd4bf', '#facc15', '#e879f9'];
export const FIN_CSS = ['#34d399', '#8b5cf6', '#fbbf24', '#38bdf8', '#f472b6', '#fb923c'];

function setup(canvas, h) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 320;
  const hh = h || canvas.clientHeight || 180;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(hh * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, hh);
  return { c, w, h: hh };
}

function shortNum(n) {
  const a = Math.abs(n);
  const f = (v, u) => faDigits(v.toFixed(v >= 100 ? 0 : 1)) + u;
  if (a >= 1e9) return f(n / 1e9, ' م');
  if (a >= 1e6) return f(n / 1e6, ' م');
  if (a >= 1e3) return f(n / 1e3, ' ه');
  return faDigits(String(Math.round(n)));
}

export function emptyPlot(canvas, msg = 'داده‌ای نیست') {
  const { c, w, h } = setup(canvas);
  c.fillStyle = 'rgba(255,255,255,.45)';
  c.font = '13px Tahoma';
  c.textAlign = 'center';
  c.fillText(msg, w / 2, h / 2);
}

/* ---------- دونات ---------- */
export function drawFinDonut(canvas, items, { h = 190, thickness = 30 } = {}) {
  if (!items?.length) return emptyPlot(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const total = items.reduce((a, b) => a + Math.max(0, b.value), 0) || 1;
  const cx = hh / 2 + 8, cy = hh / 2, R = Math.min(hh / 2 - 8, 80);
  let a = -Math.PI / 2;
  const anim = canvas._finAnim || 0;
  items.forEach((it, i) => {
    const frac = Math.max(0, it.value) / total;
    const a2 = a + frac * Math.PI * 2;
    c.beginPath();
    c.arc(cx, cy, R, a, Math.max(a + 0.02, a2 - 0.02));
    c.strokeStyle = it.color || FIN_PALETTE[i % FIN_PALETTE.length];
    c.lineWidth = thickness;
    c.lineCap = 'butt';
    c.stroke();
    a = a2;
  });
  c.fillStyle = '#fff'; c.textAlign = 'center';
  c.font = 'bold 15px Tahoma';
  c.fillText(shortNum(total), cx, cy + 1);
  c.font = '10.5px Tahoma'; c.fillStyle = 'rgba(255,255,255,.55)';
  c.fillText('جمع', cx, cy + 17);
  // راهنما
  c.textAlign = 'right';
  const lx = w - 8;
  let y = 16;
  items.slice(0, 7).forEach((it, i) => {
    c.fillStyle = it.color || FIN_PALETTE[i % FIN_PALETTE.length];
    c.beginPath(); c.arc(lx - 6, y - 4, 5, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.font = '11px Tahoma';
    const label = String(it.label || '').slice(0, 16);
    c.fillText(`${label} ${faDigits(String(Math.round((Math.max(0, it.value) / total) * 100)))}٪`, lx - 16, y);
    y += 22;
  });
  void anim;
}

/* ---------- میله‌ای افقی ---------- */
export function drawFinHBars(canvas, items, { h = 44, perRow = 34 } = {}) {
  if (!items?.length) return emptyPlot(canvas);
  const H = Math.max(h, items.length * perRow + 16);
  const { c, w } = setup(canvas, H);
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  items.forEach((it, i) => {
    const y = 10 + i * perRow;
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.font = '11.5px Tahoma'; c.textAlign = 'right';
    c.fillText(String(it.label || '').slice(0, 20), w - 8, y + 12);
    const bw = w - 130;
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.beginPath(); c.roundRect(112, y, bw, 14, 7); c.fill();
    const fill = Math.max(4, (Math.abs(it.value) / max) * bw);
    const col = it.color || (it.value < 0 ? '#f43f5e' : FIN_PALETTE[i % FIN_PALETTE.length]);
    const g = c.createLinearGradient(112, 0, 112 + bw, 0);
    g.addColorStop(0, col + '55'); g.addColorStop(1, col);
    c.fillStyle = g;
    c.beginPath(); c.roundRect(112, y, fill, 14, 7); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.font = 'bold 11px Tahoma';
    c.fillText(shortNum(it.value), 8, y + 12);
  });
}

/* ---------- میله‌ای عمودی ---------- */
export function drawFinVBars(canvas, items, { h = 170, showVals = true } = {}) {
  if (!items?.length) return emptyPlot(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const n = items.length;
  const bw = Math.min(44, (w - 16) / n - 6);
  const base = hh - 26;
  items.forEach((it, i) => {
    const bh = Math.max(3, (Math.abs(it.value) / max) * (base - 24));
    const x = w - 8 - (i + 1) * ((w - 16) / n) + ((w - 16) / n - bw) / 2;
    const col = it.color || (it.value < 0 ? '#f43f5e' : FIN_PALETTE[i % FIN_PALETTE.length]);
    const g = c.createLinearGradient(0, base - bh, 0, base);
    g.addColorStop(0, col); g.addColorStop(1, col + '44');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(x, base - bh, bw, bh, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '10px Tahoma'; c.textAlign = 'center';
    c.fillText(String(it.label || '').slice(0, 8), x + bw / 2, hh - 10);
    if (showVals && bh > 18) {
      c.fillStyle = '#fff'; c.font = 'bold 10px Tahoma';
      c.fillText(shortNum(it.value), x + bw / 2, base - bh + 13);
    }
  });
}

/* ---------- اسپارک‌لاین ---------- */
export function drawFinSpark(canvas, values, { h = 90, color = '#34d399', fill = true } = {}) {
  if (!values?.length) return emptyPlot(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const min = Math.min(...values), max = Math.max(...values);
  const rng = max - min || 1;
  const px = (i) => 6 + (i / Math.max(1, values.length - 1)) * (w - 12);
  const py = (v) => hh - 10 - ((v - min) / rng) * (hh - 26);
  if (fill) {
    c.beginPath(); c.moveTo(px(0), hh - 4);
    values.forEach((v, i) => c.lineTo(px(i), py(v)));
    c.lineTo(px(values.length - 1), hh - 4); c.closePath();
    c.fillStyle = color + '2e'; c.fill();
  }
  c.beginPath();
  values.forEach((v, i) => { if (i === 0) c.moveTo(px(i), py(v)); else c.lineTo(px(i), py(v)); });
  c.strokeStyle = color; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
  const lx = px(values.length - 1), ly = py(values[values.length - 1]);
  c.beginPath(); c.arc(lx, ly, 4, 0, 7); c.fillStyle = color; c.fill();
  c.beginPath(); c.arc(lx, ly, 7, 0, 7); c.fillStyle = color + '44'; c.fill();
}

/* ---------- آبشاری (درآمد/هزینه/خالص) ---------- */
export function drawFinWaterfall(canvas, steps, { h = 190 } = {}) {
  if (!steps?.length) return emptyPlot(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  let run = 0;
  const tops = steps.map((s) => { run += s.value; return run; });
  const min = Math.min(0, ...tops), max = Math.max(0, ...tops);
  const rng = max - min || 1;
  const base = hh - 30, top = 18;
  const py = (v) => base - ((v - min) / rng) * (base - top);
  const n = steps.length;
  const slot = (w - 16) / n, bw = Math.min(52, slot - 10);
  let prev = 0;
  steps.forEach((s, i) => {
    const next = prev + s.value;
    const y1 = py(prev), y2 = py(next);
    const x = w - 8 - (i + 1) * slot + (slot - bw) / 2;
    const isTotal = !!s.total;
    const col = isTotal ? '#8b5cf6' : s.value >= 0 ? '#34d399' : '#f43f5e';
    c.fillStyle = col + 'dd';
    c.beginPath(); c.roundRect(x, Math.min(y1, y2), bw, Math.max(3, Math.abs(y2 - y1)), 4); c.fill();
    if (i > 0) {
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.setLineDash([4, 4]);
      c.beginPath();
      const px = w - 8 - i * slot + (slot - bw) / 2 + bw;
      c.moveTo(px, y1); c.lineTo(x + bw, y1); c.stroke();
      c.setLineDash([]);
    }
    c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '10px Tahoma'; c.textAlign = 'center';
    c.fillText(String(s.label || '').slice(0, 10), x + bw / 2, hh - 12);
    c.fillStyle = '#fff'; c.font = 'bold 10px Tahoma';
    c.fillText(shortNum(isTotal ? next : s.value), x + bw / 2, Math.min(y1, y2) - 5);
    prev = next;
  });
}

/* ---------- مخروط پیش‌بینی ---------- */
export function drawFinForecast(canvas, series, { h = 200 } = {}) {
  // series: [{label, mid, lo, hi, actual?}]
  if (!series?.length) return emptyPlot(canvas);
  const { c, w, h: hh } = setup(canvas, h);
  const all = series.flatMap((s) => [s.lo, s.hi, s.mid, s.actual ?? s.mid]);
  const min = Math.min(...all), max = Math.max(...all);
  const rng = max - min || 1;
  const base = hh - 28, top = 16;
  const py = (v) => base - ((v - min) / rng) * (base - top);
  const px = (i) => 10 + (i / Math.max(1, series.length - 1)) * (w - 20);
  // باند
  c.beginPath();
  series.forEach((s, i) => { if (i === 0) c.moveTo(px(i), py(s.hi)); else c.lineTo(px(i), py(s.hi)); });
  for (let i = series.length - 1; i >= 0; i--) c.lineTo(px(i), py(series[i].lo));
  c.closePath();
  c.fillStyle = 'rgba(139,92,246,.22)'; c.fill();
  // خط میانی
  c.beginPath();
  series.forEach((s, i) => { if (i === 0) c.moveTo(px(i), py(s.mid)); else c.lineTo(px(i), py(s.mid)); });
  c.strokeStyle = '#8b5cf6'; c.lineWidth = 2.5; c.stroke();
  // واقعی
  const actuals = series.map((s, i) => ({ ...s, i })).filter((s) => s.actual != null);
  if (actuals.length > 1) {
    c.beginPath();
    actuals.forEach((s, j) => { if (j === 0) c.moveTo(px(s.i), py(s.actual)); else c.lineTo(px(s.i), py(s.actual)); });
    c.strokeStyle = '#34d399'; c.lineWidth = 2.5; c.stroke();
  }
  c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '10px Tahoma'; c.textAlign = 'center';
  series.forEach((s, i) => { if (i % Math.ceil(series.length / 8) === 0) c.fillText(String(s.label || '').slice(0, 8), px(i), hh - 10); });
}

/* ---------- حلقه پیشرفت ---------- */
export function drawFinRing(canvas, frac, { color = '#34d399', label = '', h = 130 } = {}) {
  const { c, w, h: hh } = setup(canvas, h);
  const cx = w / 2, cy = hh / 2, R = Math.min(w, hh) / 2 - 12;
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 13; c.stroke();
  c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac)));
  c.strokeStyle = color; c.lineWidth = 13; c.lineCap = 'round'; c.stroke();
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 17px Tahoma';
  c.fillText(faDigits(String(Math.round(frac * 100))) + '٪', cx, cy + 2);
  if (label) { c.font = '11px Tahoma'; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(label, cx, cy + 19); }
}

/* ---------- مقایسه دو ستون ---------- */
export function drawFinCompare(canvas, a, b, { h = 120, labels = ['A', 'B'] } = {}) {
  const { c, w, h: hh } = setup(canvas, h);
  const max = Math.max(Math.abs(a), Math.abs(b), 1);
  const pairs = [[a, '#f43f5e', labels[0]], [b, '#34d399', labels[1]]];
  pairs.forEach(([v, col, label], i) => {
    const bw = (w - 20) / 2 - 8;
    const x = 10 + i * ((w - 20) / 2 + 4);
    const bh = Math.max(6, (Math.abs(v) / max) * (hh - 52));
    c.fillStyle = col;
    c.beginPath(); c.roundRect(x, hh - 30 - bh, bw, bh, 6); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 12px Tahoma';
    c.fillText(shortNum(v), x + bw / 2, hh - 34 - bh);
    c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '11px Tahoma';
    c.fillText(String(label).slice(0, 14), x + bw / 2, hh - 12);
  });
}
