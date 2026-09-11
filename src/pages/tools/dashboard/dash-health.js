// 🩺 ViXoRa Data Health — اسکن سلامت، تعمیر خرابی، پاکسازی یتیم‌ها
import { load, esc, faDigits, fmtCompact } from './dash-state.js';

const QUARANTINE_KEY = 'vixora:quarantine';
/** کلیدهایی که اگر خالی/پوچ باشند «یتیم» حساب می‌شوند */
const ORPHANABLE = ['vixora:tmp-', 'vixora:draft-', 'ViXoRa:tmp-', 'vixora:cache-'];

export function scanHealth() {
  const out = { keys: 0, bytes: 0, corrupt: [], orphans: [], backupAge: null, score: 100 };
  let backupTs = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    out.keys++;
    let v = '';
    try { v = localStorage.getItem(k) || ''; } catch { continue; }
    out.bytes += k.length * 2 + v.length * 2;
    // خرابی JSON
    if ((k.startsWith('vixora:') || k.startsWith('ViXoRa:')) && v && (v[0] === '{' || v[0] === '[')) {
      try { JSON.parse(v); } catch { out.corrupt.push(k); }
    }
    // یتیم‌ها: کلید موقت قدیمی‌تر از ۷ روز
    if (ORPHANABLE.some((p) => k.startsWith(p))) {
      try {
        const o = JSON.parse(v);
        const ts = Number(o.ts || o.at || 0);
        if (!ts || Date.now() - ts > 7 * 864e5) out.orphans.push(k);
      } catch { out.orphans.push(k); }
    }
    if (k === 'vixora:last-backup' || k === 'ViXoRa:last-backup') backupTs = Math.max(backupTs, Number(v) || 0);
  }
  if (backupTs) out.backupAge = Math.floor((Date.now() - backupTs) / 864e5);
  out.score = Math.max(0, 100 - out.corrupt.length * 15 - out.orphans.length * 2 - (out.backupAge != null && out.backupAge > 7 ? 10 : 0));
  return out;
}

export function quarantineCorrupt(keys) {
  const q = load(QUARANTINE_KEY, {});
  let n = 0;
  for (const k of keys) {
    try {
      q[k] = { v: localStorage.getItem(k), at: Date.now() };
      localStorage.removeItem(k);
      n++;
    } catch { /* ignore */ }
  }
  try { localStorage.setItem(QUARANTINE_KEY, JSON.stringify(q)); } catch { /* ignore */ }
  return n;
}

export function cleanOrphans(keys) {
  let n = 0;
  for (const k of keys) {
    try { localStorage.removeItem(k); n++; } catch { /* ignore */ }
  }
  return n;
}

function grade(score) {
  if (score >= 90) return ['💚', 'عالی'];
  if (score >= 70) return ['💛', 'خوب'];
  if (score >= 40) return ['🟠', 'نیاز به رسیدگی'];
  return ['🔴', 'بحرانی'];
}

export function renderHealthCard() {
  const h = scanHealth();
  const [icon, label] = grade(h.score);
  return `
  <div class="dash-panel"><div class="dash-panel-title">🩺 سلامت داده‌ها</div>
    <div class="dash-kv"><span>امتیاز سلامت</span><b>${icon} ${faDigits(String(h.score))} — ${label}</b></div>
    <div class="dash-kv"><span>کلیدهای ذخیره‌شده</span><b>${faDigits(String(h.keys))}</b></div>
    <div class="dash-kv"><span>حجم تقریبی</span><b>${esc(fmtCompact(h.bytes))}B</b></div>
    <div class="dash-kv"><span>آخرین بکاپ</span><b>${h.backupAge == null ? 'ثبت نشده ⚠️' : h.backupAge === 0 ? 'امروز ✅' : `قبل ${faDigits(String(h.backupAge))} روز`}</b></div>
    <div class="dash-kv"><span>کلید خراب</span><b>${h.corrupt.length ? `🔴 ${faDigits(String(h.corrupt.length))}` : '۰ ✅'}</b></div>
    ${h.corrupt.length ? `<div class="dash-note">${h.corrupt.slice(0, 5).map((k) => `<code>${esc(k)}</code>`).join(' ')}</div>
    <div class="dash-row"><button class="dash-btn sm dash-btn-danger" data-action="set-health-fix">🛠 قرنطینه و تعمیر (${faDigits(String(h.corrupt.length))})</button></div>` : ''}
    <div class="dash-kv"><span>کلید موقت قدیمی</span><b>${h.orphans.length ? `🟠 ${faDigits(String(h.orphans.length))}` : '۰ ✅'}</b></div>
    ${h.orphans.length ? `<div class="dash-row"><button class="dash-btn sm" data-action="set-health-clean">🧹 پاکسازی (${faDigits(String(h.orphans.length))})</button></div>` : ''}
    <div class="dash-row"><button class="dash-btn sm" data-action="set-health-scan">🔄 اسکن مجدد</button>
    <button class="dash-btn sm" data-action="view" data-v="export">🛟 رفتن به بکاپ</button></div>
  </div>`;
}
