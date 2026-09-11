// 📤 ViXoRa Export Center — خروجی CSV/JSON/ICS/vCard/Markdown همه ابزارها
// src/pages/tools/dashboard/dash-export.js
import { esc, load } from './dash-state.js';

export function download(name, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob(['\ufeff' + content,], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  try { localStorage.setItem('vixora:backup-last', String(Date.now())); } catch {}
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** تراکنش‌ها → CSV */
export function exportTxCSV() {
  const txs = load('vixora:txs', []);
  const rows = [['تاریخ', 'نوع', 'مبلغ', 'دسته', 'شرح', 'حساب'].join(',')];
  txs.forEach((t) => rows.push([new Date(t.date || t.ts || Date.now()).toLocaleDateString('fa-IR'), t.type || '', t.amount || 0, t.cat || '', t.note || t.desc || '', t.account || ''].map(csvCell).join(',')));
  download(`vixora-tx-${Date.now()}.csv`, rows.join('\n'), 'text/csv;charset=utf-8');
  return txs.length;
}
/** یادداشت‌ها → Markdown */
export function exportNotesMD() {
  const notes = load('vixora:notes', []);
  const md = notes.map((n) => `## ${n.pinned ? '📌 ' : ''}${new Date(n.ts || Date.now()).toLocaleString('fa-IR')}\n\n${n.text || ''}\n`).join('\n---\n\n') || '_یادداشتی نیست._';
  download(`vixora-notes-${Date.now()}.md`, `# 📝 یادداشت‌های ViXoRa\n\n${md}`);
  return notes.length;
}
/** مشتریان → CSV + vCard */
export function exportCustomersCSV() {
  const cs = load('vixora:customers', []);
  const rows = [['نام', 'تلفن', 'شرکت', 'توضیح'].join(',')];
  cs.forEach((c) => rows.push([c.name || '', c.phone || '', c.company || '', c.note || ''].map(csvCell).join(',')));
  download(`vixora-customers-${Date.now()}.csv`, rows.join('\n'), 'text/csv;charset=utf-8');
  return cs.length;
}
export function exportCustomersVCF() {
  const cs = load('vixora:customers', []);
  const vcf = cs.map((c) => `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name || ''}\n${c.phone ? `TEL:${c.phone}\n` : ''}${c.company ? `ORG:${c.company}\n` : ''}END:VCARD`).join('\n');
  download(`vixora-customers-${Date.now()}.vcf`, vcf, 'text/vcard;charset=utf-8');
  return cs.length;
}
/** قبض‌ها/بدهی‌ها → تقویم ICS */
export function exportCalendarICS() {
  const evs = [];
  load('vixora:bills', []).filter((b) => !b.paid).forEach((b) => evs.push({ d: new Date(b.due || Date.now()), t: `💡 ${b.title || 'قبض'}` }));
  load('vixora:debts', []).forEach((d) => { if (d.due) evs.push({ d: new Date(d.due), t: `🤝 ${d.title || 'بدهی'}` }); });
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ViXoRa//FA', ...evs.map((e, i) => `BEGIN:VEVENT\nUID:vix${Date.now()}${i}@vixora\nDTSTAMP:${fmt(new Date())}\nDTSTART:${fmt(e.d)}\nSUMMARY:${e.t}\nEND:VEVENT`), 'END:VCALENDAR'].join('\n');
  download(`vixora-calendar-${Date.now()}.ics`, ics, 'text/calendar;charset=utf-8');
  return evs.length;
}
/** کتابخانه موزیک → JSON/M3U */
export function exportMusicJSON() {
  const lib = load('vixora:music-lib', load('vixora:songs', []));
  download(`vixora-music-${Date.now()}.json`, JSON.stringify(lib, null, 2), 'application/json');
  return lib.length;
}
export function exportPlaylistM3U(name = 'علاقه‌مندی‌ها') {
  const songs = load('vixora:music-lib', load('vixora:songs', []));
  const liked = songs.filter((s) => s.liked);
  const m3u = ['#EXTM3U', ...liked.map((s) => `#EXTINF:-1,${s.artist || ''} - ${s.title || ''}\n${s.src || s.url || ''}`)].join('\n');
  download(`vixora-${Date.now()}.m3u`, m3u, 'audio/x-mpegurl');
  return liked.length;
}
/** بکاپ کامل همه‌چیز */
export function exportFullBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('vixora:')) { try { data[k] = localStorage.getItem(k); } catch {} }
  }
  data._meta = { app: 'ViXoRa', ts: Date.now(), date: new Date().toLocaleString('fa-IR') };
  download(`vixora-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
  return Object.keys(data).length;
}
/** خلاصه متنی برای اشتراک */
export function buildSummaryText() {
  const txs = load('vixora:txs', []);
  const m = new Date().getMonth();
  const mt = txs.filter((t) => new Date(t.date || t.ts || 0).getMonth() === m);
  const inc = mt.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const exp = mt.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const songs = load('vixora:music-lib', load('vixora:songs', [])).length;
  const notes = load('vixora:notes', []).length;
  return `📊 خلاصه ViXoRa — ${new Date().toLocaleDateString('fa-IR')}\n💰 دخل ماه: ${inc.toLocaleString('fa-IR')} • خرج ماه: ${exp.toLocaleString('fa-IR')}\n🎵 آهنگ: ${songs} • 📝 یادداشت: ${notes}\n— ساخته ViXoRa 💜`;
}

/** ایمپورت بکاپ */
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        let n = 0;
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('vixora:') && typeof v === 'string') { localStorage.setItem(k, v); n++; }
        }
        resolve(n);
      } catch (e) { reject(e); }
    };
    r.onerror = reject;
    r.readAsText(file);
  });
}

export function renderExportCenter() {
  const counts = {
    tx: load('vixora:txs', []).length, notes: load('vixora:notes', []).length,
    cust: load('vixora:customers', []).length, songs: load('vixora:music-lib', load('vixora:songs', [])).length,
    bills: load('vixora:bills', []).length,
  };
  const btn = (act, icon, t, sub) => `<button class="dash-xp-card" data-action="${act}"><span class="dash-xp-ic">${icon}</span><b>${t}</b><small>${sub}</small></button>`;
  return `<div class="dash-xp-wrap"><div class="dash-xp-head"><b>📤 مرکز خروجی و پشتیبان</b></div>
  <div class="dash-xp-grid">
    ${btn('w-xp-backup', '🛟', 'بکاپ کامل', 'همه داده‌ها JSON')}
    ${btn('w-xp-tx', '💰', 'تراکنش‌ها CSV', counts.tx + ' رکورد → اکسل')}
    ${btn('w-xp-notes', '📝', 'یادداشت‌ها MD', counts.notes + ' یادداشت')}
    ${btn('w-xp-cust', '👥', 'مشتریان CSV', counts.cust + ' مخاطب')}
    ${btn('w-xp-vcf', '📇', 'مشتریان vCard', 'ایمپورت به گوشی')}
    ${btn('w-xp-ics', '📅', 'تقویم ICS', 'قبض‌ها و بدهی‌ها')}
    ${btn('w-xp-music', '🎵', 'کتابخانه JSON', counts.songs + ' آهنگ')}
    ${btn('w-xp-m3u', '📻', 'پلی‌لیست M3U', 'علاقه‌مندی‌ها')}
    ${btn('w-xp-summary', '📋', 'کپی خلاصه', 'متن اشتراک‌گذاری')}
  </div>
  <div class="dash-xp-import"><b>📥 بازیابی بکاپ:</b>
    <label class="dash-btn">انتخاب فایل JSON<input type="file" accept=".json" data-xp-file hidden></label>
    <small>⚠️ جایگزین داده فعلی می‌شود — اول بکاپ بگیر!</small></div></div>`;
}
