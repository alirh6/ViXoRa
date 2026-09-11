// 🗄️ ViXoRa Savings Store — صندوق‌ها، اعضا، پین، زنجیره حسابرسی، اعلان‌ها
// src/pages/tools/savingsCircle/sv-store.js

const KEY = 'vixora:savings-circles';

export function newId(p = 'x') {
  return p + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

/* ---------- هش سبک cyrb53 (زنجیره ضد دستکاری + پین) ---------- */
export function cyrb53(str, seed = 7) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
export function hashPin(pin, salt) {
  return 'p$' + cyrb53(`pin:${salt}:${String(pin).trim()}`);
}
export function verifyPin(pin, salt, hash) {
  if (!hash || !String(pin).trim()) return false;
  return hashPin(pin, salt) === hash;
}

/* ---------- اعداد فارسی ---------- */
const FA_D = '۰۱۲۳۴۵۶۷۸۹';
export function faNum(n) {
  const neg = Number(n) < 0;
  const parts = String(Math.abs(Math.trunc(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return (neg ? '−' : '') + parts.replace(/\d/g, (d) => FA_D[d]);
}
export function fmtMoney(n) { return faNum(n) + ' تومان'; }
export function maskPhone(p) {
  const s = String(p || '').replace(/\D/g, '');
  if (s.length < 7) return '•••';
  return s.slice(0, 4) + '•••' + s.slice(-2);
}

/* ---------- CRUD صندوق ---------- */
export function listCircles() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}
function writeAll(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); return true; }
  catch { return false; }
}
export function getCircle(id) {
  return listCircles().find((c) => String(c.id) === String(id)) || null;
}
export function saveCircle(c) {
  c.updatedAt = Date.now();
  const arr = listCircles().filter((x) => String(x.id) !== String(c.id));
  arr.unshift(c);
  return writeAll(arr.slice(0, 60));
}
export function deleteCircle(id) {
  return writeAll(listCircles().filter((x) => String(x.id) !== String(id)));
}
export function findByCode(code) {
  const c = String(code || '').trim().toUpperCase();
  return listCircles().find((x) => x.code === c) || null;
}
export function newJoinCode() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const have = new Set(listCircles().map((c) => c.code));
  for (let i = 0; i < 200; i++) {
    let s = '';
    for (let j = 0; j < 6; j++) s += abc[Math.floor(Math.random() * abc.length)];
    if (!have.has(s)) return s;
  }
  return 'X' + Date.now().toString(36).toUpperCase().slice(-5);
}

/* ---------- نقش‌ها ---------- */
export function myMember(c, userId) {
  if (!userId) return null;
  return (c.members || []).find((m) => String(m.userId || '') === String(userId) && m.active !== false) || null;
}
export function isAdmin(c, userId) {
  return !!userId && String(c.managerId) === String(userId);
}
export function memberById(c, mid) {
  return (c.members || []).find((m) => String(m.id) === String(mid)) || null;
}

/* ---------- زنجیره حسابرسی (append-only + hash) ---------- */
export function audit(c, actor, action, detail = '') {
  c.audit = c.audit || [];
  const prev = c.audit.length ? c.audit[c.audit.length - 1].hash : 'GENESIS';
  const entry = {
    i: c.audit.length, at: Date.now(), actor: String(actor || 'system').slice(0, 60),
    action: String(action).slice(0, 40), detail: String(detail).slice(0, 300), prev,
  };
  entry.hash = cyrb53(`${c.id}|${entry.i}|${entry.at}|${entry.actor}|${entry.action}|${entry.detail}|${prev}`);
  c.audit.push(entry);
  return entry;
}
export function verifyChain(c) {
  const a = c.audit || [];
  let prev = 'GENESIS';
  for (let k = 0; k < a.length; k++) {
    const e = a[k];
    if (e.i !== k || e.prev !== prev) return { ok: false, bad: k };
    const h = cyrb53(`${c.id}|${e.i}|${e.at}|${e.actor}|${e.action}|${e.detail}|${e.prev}`);
    if (h !== e.hash) return { ok: false, bad: k };
    prev = e.hash;
  }
  return { ok: true, count: a.length };
}

/* ---------- اعلان‌ها ---------- */
export function notify(c, to, text, link = '') {
  c.notifs = c.notifs || [];
  c.notifs.unshift({ id: newId('n'), at: Date.now(), to, text: String(text).slice(0, 200), link, readBy: [] });
  c.notifs = c.notifs.slice(0, 300);
}
export function unreadCount(c, memberId) {
  const ms = memberById(c, memberId);
  return (c.notifs || []).filter((n) => (n.to === 'all' || String(n.to) === String(memberId) || (n.to === 'admin' && ms?.isAdmin)) && !(n.readBy || []).includes(String(memberId))).length;
}
export function markAllRead(c, memberId) {
  for (const n of (c.notifs || [])) {
    n.readBy = n.readBy || [];
    if (!n.readBy.includes(String(memberId))) n.readBy.push(String(memberId));
  }
}

/* ---------- ساخت صندوق ---------- */
export function blankCircle(o, manager) {
  const months = Math.min(60, Math.max(2, Number(o.months) || 12));
  const c = {
    id: newId('sv'), name: String(o.name || '').trim().slice(0, 60), desc: String(o.desc || '').slice(0, 300),
    createdAt: Date.now(), updatedAt: Date.now(), managerId: manager.id, managerName: manager.name || 'مدیر',
    adminPin: hashPin(o.adminPin, 'tmp'),
    code: newJoinCode(), months,
    monthlyDue: Math.max(10000, Math.trunc(Number(o.monthlyDue) || 0)),
    dueDay: Math.min(28, Math.max(1, Number(o.dueDay) || 5)),
    minPartial: Math.min(1000000, Math.max(10000, Math.trunc(Number(o.minPartial) || 50000))),
    startY: Number(o.startY), startM: Math.min(12, Math.max(1, Number(o.startM))),
    adminFirst: !!o.adminFirst, status: 'forming',
    members: [], pending: [], queue: [], draws: [], claims: [], ledger: [], payouts: [],
    chat: [], dm: [], polls: [], ideas: [], notifs: [], audit: [],
  };
  c.adminPin = hashPin(o.adminPin, c.id);
  // مدیر خودش عضو اول است
  const admin = {
    id: newId('m'), userId: manager.id, name: manager.name || 'مدیر', phone: String(manager.phone || ''),
    nat4: '', pin: hashPin(o.adminPin, c.id + ':m'), joinedAt: Date.now(), approved: true,
    verified: true, active: true, isAdmin: true,
  };
  c.members.push(admin);
  audit(c, manager.name || 'مدیر', 'circle.create', `صندوق «${c.name}» • ${months} ماهه • ماهانه ${c.monthlyDue}`);
  if (c.adminFirst) {
    c.queue.push({ round: 1, memberId: admin.id, method: 'admin-first', at: Date.now(), by: admin.id });
    audit(c, admin.name, 'queue.set', 'نوبت ۱ 👑 مدیر (قانون صندوق از روز اول)');
    c.chat.push({ id: newId('c'), at: Date.now(), kind: 'announce', text: `📢 طبق قانون این صندوق، نوبت اول برداشت 👑 ${admin.name} (مدیر) است.` });
  }
  return c;
}

/* ---------- پکیج اشتراک‌گذاری بین دستگاه‌ها (نسخه‌دار + امضاشده) ---------- */
function stable(o) {
  if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
  if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}';
  return JSON.stringify(o);
}
export function exportPackage(c) {
  const circle = JSON.parse(JSON.stringify(c));
  return { app: 'vixora-savings', v: 1, exportedAt: Date.now(), circle, sig: cyrb53('pkg1:' + stable(circle)) };
}
export function parsePackage(input) {
  try {
    const o = typeof input === 'string' ? JSON.parse(input) : input;
    if (!o || o.app !== 'vixora-savings' || !o.circle || !o.circle.id) return { ok: false, error: 'پکیج معتبر نیست.' };
    if (Number(o.v) > 1) return { ok: false, error: 'این پکیج با نسخه جدیدتر ساخته شده؛ اول سایت را به‌روز کن.' };
    if (!o.sig || cyrb53('pkg1:' + stable(o.circle)) !== o.sig) return { ok: false, error: 'پکیج دستکاری شده است! (امضا نامعتبر)' };
    return { ok: true, circle: o.circle, exportedAt: o.exportedAt || 0 };
  } catch { return { ok: false, error: 'متن/فایل خراب است.' }; }
}
