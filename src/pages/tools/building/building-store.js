// src/pages/tools/building/building-store.js

/**
 * ساختمون‌یار — موتور دیتا (قلب تپنده 🫀)
 * ==================================================================
 * دیتابیس سراسری در LocalStorage (مشترک بین همه اکانت‌های این مرورگر)
 * تا سناریوی واقعی کار کند: مدیر می‌سازد + کد می‌دهد ← واحدها جوین می‌شوند.
 * سینک زنده بین تب‌ها از طریق ایونت storage.
 */

const DB_KEY = 'ViXoRa:building-db-v1';
const SEEN_KEY = 'ViXoRa:building-seen-v1';

/* ================================================================== */
/* ابزارهای پایه                                                          */
/* ================================================================== */

export function uid(prefix = 'x') {
  return (
    prefix +
    '_' +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

export function slotKey(floor, no) {
  return `${Number(floor)}-${Number(no)}`;
}

export function parseSlot(key) {
  const [f, n] = String(key || '').split('-').map(Number);
  return { floor: f || 0, no: n || 0 };
}

export function faNum(n) {
  return Number(n || 0).toLocaleString('fa-IR');
}

export function fmtMoney(n) {
  return `${faNum(Math.round(Number(n) || 0))} تومان`;
}

export function faDate(ts) {
  try {
    return new Date(Number(ts)).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function faDateTime(ts) {
  try {
    return new Date(Number(ts)).toLocaleDateString('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function relTime(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || 0));
  const s = Math.floor(diff / 1000);
  if (s < 10) return 'لحظاتی پیش';
  if (s < 60) return `${faNum(s)} ثانیه پیش`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${faNum(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${faNum(h)} ساعت پیش`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${faNum(d)} روز پیش`;
  if (d < 30) return `${faNum(Math.floor(d / 7))} هفته پیش`;
  return faDate(ts);
}

export function toISODateInput(ts) {
  const d = new Date(Number(ts) || Date.now());
  const p = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function slotLabel(key) {
  const { floor, no } = parseSlot(key);
  return `طبقه ${faNum(floor)} واحد ${faNum(no)}`;
}

export function shortSlot(key) {
  const { floor, no } = parseSlot(key);
  return `${faNum(floor)}-${faNum(no)}`;
}

/** تقسیم عادلانه مبلغ بین n سهم (باقی‌مانده بین سهم‌های اول توزیع می‌شود) */
export function splitMoney(total, count) {
  const t = Math.max(0, Math.round(Number(total) || 0));
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const base = Math.floor(t / n);
  const rem = t - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export function displayNameOf(user) {
  if (!user) return 'کاربر';
  const full = `${user.name || ''} ${user.lastName || ''}`.trim();
  return full || user.username || user.email || 'کاربر';
}

/* ================================================================== */
/* لیبل‌ها                                                               */
/* ================================================================== */

export const POST_KINDS = {
  charge: { label: 'شارژ ماهانه', icon: '🧾' },
  expense: { label: 'هزینه', icon: '💸' },
  notice: { label: 'اطلاعیه', icon: '📢' },
  discussion: { label: 'بحث و گفتگو', icon: '💭' },
};

export const EXPENSE_CATS = {
  maintenance: { label: 'تعمیرات', icon: '🔧' },
  cleaning: { label: 'نظافت', icon: '🧹' },
  elevator: { label: 'آسانسور', icon: '🛗' },
  utilities: { label: 'قبوض مشاعات', icon: '💡' },
  garden: { label: 'فضای سبز', icon: '🌳' },
  security: { label: 'امنیت و دوربین', icon: '🎥' },
  improvement: { label: 'عمرانی و زیباسازی', icon: '🏗️' },
  other: { label: 'سایر', icon: '📦' },
};

export const TICKET_CATS = {
  elevator: { label: 'آسانسور', icon: '🛗' },
  plumbing: { label: 'لوله و تأسیسات', icon: '🚰' },
  electric: { label: 'برق', icon: '⚡' },
  cleaning: { label: 'نظافت مشاعات', icon: '🧹' },
  parking: { label: 'پارکینگ', icon: '🅿️' },
  garden: { label: 'فضای سبز', icon: '🌳' },
  door: { label: 'درب و آیفون', icon: '🚪' },
  other: { label: 'سایر', icon: '🧰' },
};

export const TICKET_STATUS = {
  new: { label: 'جدید', icon: '🆕' },
  doing: { label: 'در حال انجام', icon: '⏳' },
  done: { label: 'انجام شد', icon: '✅' },
  cancelled: { label: 'لغو شد', icon: '🚫' },
};

export const COMPLAINT_CATS = {
  noise: { label: 'سروصدا', icon: '🔊' },
  parking: { label: 'پارکینگ', icon: '🅿️' },
  cleaning: { label: 'نظافت', icon: '🧹' },
  pets: { label: 'حیوانات', icon: '🐾' },
  smoke: { label: 'دود و سیگار', icon: '🚬' },
  charges: { label: 'شارژ و مالی', icon: '💰' },
  behavior: { label: 'رفتار', icon: '😐' },
  other: { label: 'سایر', icon: '📝' },
};

export const COMPLAINT_STATUS = {
  new: { label: 'ثبت شد', icon: '📥' },
  review: { label: 'در حال بررسی', icon: '🔍' },
  resolved: { label: 'حل شد', icon: '✅' },
  rejected: { label: 'رد شد', icon: '🚫' },
};

export const SUGGEST_AREAS = {
  lobby: { label: 'لابی', icon: '🛋️' },
  facade: { label: 'نما', icon: '🏢' },
  garden: { label: 'حیاط و فضای سبز', icon: '🌳' },
  parking: { label: 'پارکینگ', icon: '🅿️' },
  stairs: { label: 'راه‌پله', icon: '🪜' },
  roof: { label: 'پشت‌بام', icon: '🌇' },
  unit: { label: 'داخل واحد', icon: '🛋️' },
  other: { label: 'سایر', icon: '💡' },
};

export const SUGGEST_STATUS = {
  idea: { label: 'ایده', icon: '💡' },
  review: { label: 'در حال بررسی', icon: '🔍' },
  approved: { label: 'تصویب شد', icon: '👍' },
  doing: { label: 'در حال اجرا', icon: '🚧' },
  done: { label: 'اجرا شد', icon: '🎉' },
  rejected: { label: 'رد شد', icon: '🚫' },
};

export const DOC_KINDS = {
  minutes: { label: 'صورتجلسه', icon: '📋' },
  bill: { label: 'قبض و فاکتور', icon: '🧾' },
  contract: { label: 'قرارداد', icon: '📝' },
  insurance: { label: 'بیمه', icon: '🛡️' },
  other: { label: 'سایر', icon: '📁' },
};

export const PAY_METHODS = {
  card: 'کارت‌به‌کارت 💳',
  cash: 'نقدی 💵',
  pos: 'پوز 🏧',
  other: 'سایر 📝',
};

/* ================================================================== */
/* دیتابیس                                                               */
/* ================================================================== */

const EMPTY_DB = () => ({
  v: 1,
  buildings: [],
  units: [],
  posts: [],
  debts: [],
  payments: [],
  messages: [],
  complaints: [],
  suggestions: [],
  polls: [],
  tickets: [],
  docs: [],
  contacts: [],
  events: [],
});

let db = null;
const listeners = new Set();
let storageHooked = false;

function readLS(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadDb() {
  if (db) return db;
  db = EMPTY_DB();
  try {
    const raw = readLS(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const k of Object.keys(db)) {
          if (Array.isArray(parsed[k])) db[k] = parsed[k];
        }
      }
    }
  } catch {
    /* ignore */
  }
  return db;
}

export function saveDb() {
  loadDb();
  const ok = writeLS(DB_KEY, JSON.stringify(db));
  emit();
  return ok;
}

function emit() {
  for (const fn of [...listeners]) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  if (!storageHooked && typeof window !== 'undefined') {
    storageHooked = true;
    window.addEventListener('storage', (e) => {
      if (e.key === DB_KEY) {
        db = null;
        loadDb();
        emit();
      }
    });
  }
  return () => listeners.delete(fn);
}

/* ---------- دیده‌شده‌ها (بج خوانده‌نشده) ---------- */

export function getSeen(userId) {
  try {
    const raw = readLS(SEEN_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all?.[String(userId)] || {};
  } catch {
    return {};
  }
}

export function setSeen(userId, patch) {
  try {
    const raw = readLS(SEEN_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[String(userId)] = { ...(all[String(userId)] || {}), ...patch };
    writeLS(SEEN_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/* ================================================================== */
/* ساختمان                                                               */
/* ================================================================== */

function genCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function structureSlots(building) {
  const out = [];
  const floors = Math.max(1, Number(building?.floors) || 1);
  const upf = Math.max(1, Number(building?.unitsPerFloor) || 1);
  for (let f = 1; f <= floors; f++) {
    for (let n = 1; n <= upf; n++) out.push(slotKey(f, n));
  }
  return out;
}

export function createBuilding(draft, manager) {
  loadDb();
  const d = db;
  let code = genCode();
  while (d.buildings.some((b) => b.code === code)) code = genCode();
  const b = {
    id: uid('b'),
    code,
    name: String(draft.name || 'ساختمان من').trim().slice(0, 60) || 'ساختمان من',
    address: String(draft.address || '').trim().slice(0, 160),
    city: String(draft.city || '').trim().slice(0, 40),
    floors: Math.min(30, Math.max(1, Number(draft.floors) || 1)),
    unitsPerFloor: Math.min(12, Math.max(1, Number(draft.unitsPerFloor) || 1)),
    managerId: String(manager?.id || ''),
    managerName: displayNameOf(manager),
    cover: draft.cover || '',
    fundStart: Math.max(0, Math.round(Number(draft.fundStart) || 0)),
    rules: String(draft.rules || '').slice(0, 4000),
    cleaning: { order: [], start: Date.now(), offset: 0 },
    createdAt: Date.now(),
    demo: !!draft.demo,
  };
  d.buildings.push(b);
  saveDb();
  return b;
}

export function getBuilding(id) {
  loadDb();
  return db.buildings.find((b) => String(b.id) === String(id)) || null;
}

export function findByCode(code) {
  loadDb();
  const clean = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;
  return db.buildings.find((b) => String(b.code || '').toUpperCase() === clean) || null;
}

export function updateBuilding(id, patch = {}) {
  loadDb();
  const b = getBuilding(id);
  if (!b) return null;
  const allowed = ['name', 'address', 'city', 'cover', 'fundStart', 'rules', 'cleaning', 'managerName'];
  for (const k of allowed) {
    if (patch[k] !== undefined) b[k] = patch[k];
  }
  saveDb();
  return b;
}

export function deleteBuilding(id) {
  loadDb();
  const bid = String(id);
  db.buildings = db.buildings.filter((b) => String(b.id) !== bid);
  for (const k of ['units', 'posts', 'debts', 'payments', 'messages', 'complaints', 'suggestions', 'polls', 'tickets', 'docs', 'contacts', 'events']) {
    db[k] = db[k].filter((it) => String(it.buildingId) !== bid);
  }
  saveDb();
}

export function listBuildingsForUser(userId) {
  loadDb();
  const me = String(userId || '');
  const out = [];
  for (const b of db.buildings) {
    const myUnit = db.units.find((u) => String(u.buildingId) === String(b.id) && String(u.userId || '') === me) || null;
    const isManager = String(b.managerId) === me;
    if (isManager || myUnit) {
      out.push({ building: b, isManager, myUnit, unitsCount: db.units.filter((u) => String(u.buildingId) === String(b.id)).length });
    }
  }
  return out.sort((a, b) => (b.building.createdAt || 0) - (a.building.createdAt || 0));
}

/* ================================================================== */
/* واحدها                                                                 */
/* ================================================================== */

export function listUnits(buildingId) {
  loadDb();
  return db.units
    .filter((u) => String(u.buildingId) === String(buildingId))
    .sort((a, b) => a.floor - b.floor || a.no - b.no);
}

export function getUnit(id) {
  loadDb();
  return db.units.find((u) => String(u.id) === String(id)) || null;
}

export function getSlotUnit(buildingId, key) {
  loadDb();
  return db.units.find((u) => String(u.buildingId) === String(buildingId) && u.slotKey === key) || null;
}

export function joinUnit(buildingId, key, profile, user) {
  loadDb();
  const b = getBuilding(buildingId);
  if (!b) return { error: 'ساختمان پیدا نشد.' };
  if (!structureSlots(b).includes(key)) return { error: 'این واحد در ساختار ساختمان وجود ندارد.' };
  if (getSlotUnit(buildingId, key)) return { error: 'این واحد قبلاً پر شده است.' };
  const { floor, no } = parseSlot(key);
  const headName = String(profile.headName || displayNameOf(user) || '').trim();
  if (!headName) return { error: 'نام سرپرست واحد لازم است.' };
  const u = {
    id: uid('u'),
    buildingId: String(buildingId),
    slotKey: key,
    floor,
    no,
    headName: headName.slice(0, 60),
    family: String(profile.family || '').trim().slice(0, 80),
    phone: String(profile.phone || '').trim().slice(0, 20),
    ownerType: profile.ownerType === 'tenant' ? 'tenant' : 'owner',
    residents: Math.min(30, Math.max(1, Number(profile.residents) || 1)),
    userId: user?.id != null ? String(user.id) : '',
    avatar: user?.avatar || '',
    photo: profile.photo || '',
    bio: String(profile.bio || '').slice(0, 300),
    cars: Array.isArray(profile.cars) ? profile.cars.slice(0, 4) : [],
    meters: profile.meters || {},
    pets: String(profile.pets || '').slice(0, 80),
    joinedAt: Date.now(),
  };
  db.units.push(u);
  saveDb();
  const inherited = slotDebts(buildingId, key).reduce((s, d) => s + d.remaining, 0);
  return { unit: u, inherited };
}

export function updateUnit(id, patch = {}) {
  loadDb();
  const u = getUnit(id);
  if (!u) return null;
  const allowed = ['headName', 'family', 'phone', 'ownerType', 'residents', 'photo', 'bio', 'cars', 'meters', 'pets', 'userId', 'avatar'];
  for (const k of allowed) {
    if (patch[k] !== undefined) u[k] = patch[k];
  }
  saveDb();
  return u;
}

/** حذف واحد = آزاد شدن اسلات؛ بدهی‌ها روی اسلات می‌مانند */
export function removeUnit(id) {
  loadDb();
  db.units = db.units.filter((u) => String(u.id) !== String(id));
  saveDb();
}

/* ================================================================== */
/* پست‌ها (شارژ / هزینه / اطلاعیه / بحث) + بدهی‌ها                         */
/* ================================================================== */

export function listPosts(buildingId) {
  loadDb();
  return db.posts
    .filter((p) => String(p.buildingId) === String(buildingId))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0));
}

export function getPost(id) {
  loadDb();
  return db.posts.find((p) => String(p.id) === String(id)) || null;
}

export function createPost(buildingId, draft, author) {
  loadDb();
  const b = getBuilding(buildingId);
  if (!b) return { error: 'ساختمان پیدا نشد.' };
  const kind = POST_KINDS[draft.kind] ? draft.kind : 'notice';
  const amount = Math.max(0, Math.round(Number(draft.amount) || 0));
  const title = String(draft.title || '').trim().slice(0, 120);
  if (!title) return { error: 'عنوان لازم است.' };
  if ((kind === 'charge' || kind === 'expense') && amount <= 0) return { error: 'مبلغ باید بیشتر از صفر باشد.' };
  const p = {
    id: uid('p'),
    buildingId: String(buildingId),
    kind,
    title,
    body: String(draft.body || '').slice(0, 3000),
    amount: kind === 'charge' || kind === 'expense' ? amount : 0,
    category: draft.category || (kind === 'charge' ? '' : 'other'),
    month: String(draft.month || '').slice(0, 30),
    dueDate: draft.dueDate ? Number(draft.dueDate) : 0,
    receipt: draft.receipt || '',
    pinned: !!draft.pinned,
    authorId: author?.id != null ? String(author.id) : '',
    authorName: displayNameOf(author),
    createdAt: Date.now(),
  };
  db.posts.push(p);
  // صدور بدهی برای همه واحدهای تعریف‌شده (نه فقط جوین‌شده‌ها!)
  if (p.amount > 0) {
    const slots = structureSlots(b);
    const shares = splitMoney(p.amount, slots.length);
    slots.forEach((sk, i) => {
      db.debts.push({ id: uid('d'), buildingId: String(buildingId), postId: p.id, slotKey: sk, amount: shares[i], paid: 0, createdAt: Date.now() });
    });
  }
  saveDb();
  return { post: p };
}

export function updatePost(id, patch = {}) {
  loadDb();
  const p = getPost(id);
  if (!p) return { error: 'پست پیدا نشد.' };
  if (patch.title !== undefined) p.title = String(patch.title || '').trim().slice(0, 120);
  if (patch.body !== undefined) p.body = String(patch.body || '').slice(0, 3000);
  if (patch.month !== undefined) p.month = String(patch.month || '').slice(0, 30);
  if (patch.dueDate !== undefined) p.dueDate = patch.dueDate ? Number(patch.dueDate) : 0;
  if (patch.category !== undefined) p.category = patch.category;
  if (patch.receipt !== undefined) p.receipt = patch.receipt;
  if (patch.pinned !== undefined) p.pinned = !!patch.pinned;
  if (patch.amount !== undefined && p.amount > 0) {
    const next = Math.max(0, Math.round(Number(patch.amount) || 0));
    if (next <= 0) return { error: 'برای حذف مبلغ، پست را حذف کنید.' };
    const b = getBuilding(p.buildingId);
    const slots = structureSlots(b);
    const shares = splitMoney(next, slots.length);
    slots.forEach((sk, i) => {
      const d = db.debts.find((x) => x.postId === p.id && x.slotKey === sk);
      if (d) d.amount = shares[i];
      else db.debts.push({ id: uid('d'), buildingId: p.buildingId, postId: p.id, slotKey: sk, amount: shares[i], paid: 0, createdAt: Date.now() });
    });
    p.amount = next;
  }
  saveDb();
  return { post: p };
}

export function deletePost(id) {
  loadDb();
  const p = getPost(id);
  if (!p) return { error: 'پست پیدا نشد.' };
  const paid = db.debts.filter((d) => d.postId === p.id && (d.paid || 0) > 0);
  if (paid.length) return { error: `برای این پست ${faNum(paid.length)} پرداخت ثبت شده؛ اول پرداخت‌ها را حذف کنید.` };
  db.debts = db.debts.filter((d) => d.postId !== p.id);
  db.posts = db.posts.filter((x) => x.id !== p.id);
  saveDb();
  return { ok: true };
}

export function togglePinPost(id) {
  loadDb();
  const p = getPost(id);
  if (!p) return null;
  p.pinned = !p.pinned;
  saveDb();
  return p;
}

/** بدهی‌های یک اسلات با join روی پست (عنوان، سررسید، معوقه) */
export function slotDebts(buildingId, key) {
  loadDb();
  const now = Date.now();
  return db.debts
    .filter((d) => String(d.buildingId) === String(buildingId) && d.slotKey === key)
    .map((d) => {
      const post = getPost(d.postId);
      const remaining = Math.max(0, (d.amount || 0) - (d.paid || 0));
      const overdue = remaining > 0 && post?.dueDate && post.dueDate < now;
      return { ...d, post, remaining, overdue };
    })
    .sort((a, b) => (a.post?.createdAt || 0) - (b.post?.createdAt || 0));
}

export function slotBalance(buildingId, key) {
  const list = slotDebts(buildingId, key);
  const total = list.reduce((s, d) => s + (d.amount || 0), 0);
  const paid = list.reduce((s, d) => s + Math.min(d.paid || 0, d.amount || 0), 0);
  const remaining = list.reduce((s, d) => s + d.remaining, 0);
  const overdue = list.filter((d) => d.overdue).length;
  return { total, paid, remaining, overdue, count: list.length };
}

/** تخصیص خودکار مبلغ از قدیمی‌ترین بدهی */
export function allocatePayment(buildingId, key, amount) {
  const open = slotDebts(buildingId, key).filter((d) => d.remaining > 0);
  let left = Math.max(0, Math.round(Number(amount) || 0));
  const allocs = [];
  for (const d of open) {
    if (left <= 0) break;
    const take = Math.min(d.remaining, left);
    allocs.push({ debtId: d.id, amount: take });
    left -= take;
  }
  return { allocs, leftover: left };
}

/* ================================================================== */
/* پرداخت‌ها                                                               */
/* ================================================================== */

export function listPayments(buildingId) {
  loadDb();
  return db.payments
    .filter((p) => String(p.buildingId) === String(buildingId))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function createPayment(buildingId, key, draft, by) {
  loadDb();
  const amount = Math.max(0, Math.round(Number(draft.amount) || 0));
  if (amount <= 0) return { error: 'مبلغ پرداخت معتبر نیست.' };
  const { allocs, leftover } = allocatePayment(buildingId, key, amount);
  if (!allocs.length) return { error: 'بدهی بازی برای این واحد وجود ندارد.' };
  const pay = {
    id: uid('pay'),
    buildingId: String(buildingId),
    slotKey: key,
    amount: amount - leftover,
    allocs,
    method: PAY_METHODS[draft.method] ? draft.method : 'card',
    receipt: draft.receipt || '',
    note: String(draft.note || '').slice(0, 300),
    byId: by?.id != null ? String(by.id) : '',
    byName: displayNameOf(by),
    status: 'pending',
    createdAt: Date.now(),
    decidedAt: 0,
    decidedBy: '',
  };
  db.payments.push(pay);
  saveDb();
  return { payment: pay, leftover };
}

export function decidePayment(id, approve, managerName) {
  loadDb();
  const pay = db.payments.find((p) => String(p.id) === String(id));
  if (!pay || pay.status !== 'pending') return { error: 'پرداخت معتبر نیست.' };
  if (approve) {
    for (const a of pay.allocs || []) {
      const d = db.debts.find((x) => String(x.id) === String(a.debtId));
      if (d) d.paid = Math.min(d.amount || 0, (d.paid || 0) + (a.amount || 0));
    }
    pay.status = 'approved';
  } else {
    pay.status = 'rejected';
  }
  pay.decidedAt = Date.now();
  pay.decidedBy = String(managerName || '');
  saveDb();
  return { payment: pay };
}

export function deletePayment(id) {
  loadDb();
  const pay = db.payments.find((p) => String(p.id) === String(id));
  if (!pay) return { error: 'پرداخت پیدا نشد.' };
  if (pay.status === 'approved') {
    for (const a of pay.allocs || []) {
      const d = db.debts.find((x) => String(x.id) === String(a.debtId));
      if (d) d.paid = Math.max(0, (d.paid || 0) - (a.amount || 0));
    }
  }
  db.payments = db.payments.filter((p) => String(p.id) !== String(id));
  saveDb();
  return { ok: true };
}

/** صندوق: دریافتی‌های تأییدشده − هزینه‌های انجام‌شده */
export function fundOf(buildingId) {
  loadDb();
  const b = getBuilding(buildingId);
  const income = db.payments
    .filter((p) => String(p.buildingId) === String(buildingId) && p.status === 'approved')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const outcome = db.posts
    .filter((p) => String(p.buildingId) === String(buildingId) && p.kind === 'expense')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const expected = db.debts
    .filter((d) => String(d.buildingId) === String(buildingId))
    .reduce((s, d) => s + Math.max(0, (d.amount || 0) - (d.paid || 0)), 0);
  const start = b?.fundStart || 0;
  return { start, income, outcome, expected, balance: start + income - outcome };
}

/* ================================================================== */
/* پیام‌ها (گروه + خصوصی)                                                  */
/* ================================================================== */

export function dmThreadKey(a, b) {
  return ['dm', ...[String(a), String(b)].sort()].join(':');
}

export function listGroupMessages(buildingId, limit = 200) {
  loadDb();
  return db.messages
    .filter((m) => String(m.buildingId) === String(buildingId) && m.scope === 'group')
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-limit);
}

export function listThreads(buildingId, userId) {
  loadDb();
  const me = String(userId || '');
  const map = new Map();
  for (const m of db.messages) {
    if (String(m.buildingId) !== String(buildingId) || m.scope !== 'dm') continue;
    if (String(m.fromId) !== me && String(m.toId) !== me) continue;
    const other = String(m.fromId) === me ? String(m.toId) : String(m.fromId);
    const cur = map.get(other);
    if (!cur || (m.createdAt || 0) > (cur.last.createdAt || 0)) {
      map.set(other, {
        otherId: other,
        otherName: String(m.fromId) === me ? m.toName : m.fromName,
        otherSlot: String(m.fromId) === me ? m.toSlot : m.fromSlot,
        last: m,
      });
    }
  }
  return [...map.values()].sort((a, b) => (b.last.createdAt || 0) - (a.last.createdAt || 0));
}

export function listDmMessages(buildingId, threadKey, limit = 200) {
  loadDb();
  return db.messages
    .filter((m) => String(m.buildingId) === String(buildingId) && m.scope === 'dm' && m.threadKey === threadKey)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-limit);
}

export function sendMessage(buildingId, draft, from) {
  loadDb();
  const text = String(draft.text || '').trim().slice(0, 2000);
  const image = draft.image || '';
  if (!text && !image) return { error: 'متن پیام خالی است.' };
  const scope = draft.scope === 'dm' ? 'dm' : 'group';
  if (scope === 'dm' && !draft.toId) return { error: 'گیرنده مشخص نیست.' };
  const m = {
    id: uid('m'),
    buildingId: String(buildingId),
    scope,
    threadKey: scope === 'dm' ? dmThreadKey(from?.id, draft.toId) : 'group',
    fromId: from?.id != null ? String(from.id) : '',
    fromName: displayNameOf(from),
    fromSlot: draft.fromSlot || '',
    toId: scope === 'dm' ? String(draft.toId) : '',
    toName: scope === 'dm' ? String(draft.toName || '') : '',
    toSlot: scope === 'dm' ? String(draft.toSlot || '') : '',
    text,
    image,
    createdAt: Date.now(),
  };
  db.messages.push(m);
  saveDb();
  return { message: m };
}

export function deleteMessage(id, userId) {
  loadDb();
  const m = db.messages.find((x) => String(x.id) === String(id));
  if (!m) return { error: 'پیام پیدا نشد.' };
  const b = getBuilding(m.buildingId);
  const isManager = b && String(b.managerId) === String(userId);
  if (String(m.fromId) !== String(userId) && !isManager) return { error: 'اجازه حذف ندارید.' };
  db.messages = db.messages.filter((x) => String(x.id) !== String(id));
  saveDb();
  return { ok: true };
}

/* ================================================================== */
/* شکایات                                                                  */
/* ================================================================== */

export function listComplaints(buildingId) {
  loadDb();
  return db.complaints
    .filter((c) => String(c.buildingId) === String(buildingId))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function createComplaint(buildingId, draft, from) {
  loadDb();
  const title = String(draft.title || '').trim().slice(0, 120);
  if (!title) return { error: 'عنوان شکایت لازم است.' };
  const targetKind = ['unit', 'manager', 'common'].includes(draft.targetKind) ? draft.targetKind : 'manager';
  const c = {
    id: uid('c'),
    buildingId: String(buildingId),
    fromId: from?.id != null ? String(from.id) : '',
    fromName: displayNameOf(from),
    fromSlot: draft.fromSlot || '',
    anonymous: !!draft.anonymous,
    targetKind,
    targetSlot: targetKind === 'unit' ? String(draft.targetSlot || '') : '',
    category: COMPLAINT_CATS[draft.category] ? draft.category : 'other',
    title,
    body: String(draft.body || '').slice(0, 2000),
    status: 'new',
    response: '',
    createdAt: Date.now(),
  };
  db.complaints.push(c);
  saveDb();
  return { complaint: c };
}

export function updateComplaint(id, patch = {}) {
  loadDb();
  const c = db.complaints.find((x) => String(x.id) === String(id));
  if (!c) return null;
  if (patch.status && COMPLAINT_STATUS[patch.status]) c.status = patch.status;
  if (patch.response !== undefined) c.response = String(patch.response || '').slice(0, 2000);
  saveDb();
  return c;
}

export function deleteComplaint(id) {
  loadDb();
  db.complaints = db.complaints.filter((x) => String(x.id) !== String(id));
  saveDb();
}

/* ================================================================== */
/* پیشنهادها                                                                */
/* ================================================================== */

export function listSuggestions(buildingId) {
  loadDb();
  return db.suggestions
    .filter((s) => String(s.buildingId) === String(buildingId))
    .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0) || (b.createdAt || 0) - (a.createdAt || 0));
}

export function createSuggestion(buildingId, draft, by) {
  loadDb();
  const title = String(draft.title || '').trim().slice(0, 120);
  if (!title) return { error: 'عنوان پیشنهاد لازم است.' };
  const s = {
    id: uid('s'),
    buildingId: String(buildingId),
    byId: by?.id != null ? String(by.id) : '',
    byName: displayNameOf(by),
    bySlot: draft.bySlot || '',
    area: SUGGEST_AREAS[draft.area] ? draft.area : 'other',
    title,
    body: String(draft.body || '').slice(0, 2000),
    image: draft.image || '',
    votes: [],
    status: 'idea',
    createdAt: Date.now(),
  };
  db.suggestions.push(s);
  saveDb();
  return { suggestion: s };
}

export function toggleSuggestionVote(id, userId) {
  loadDb();
  const s = db.suggestions.find((x) => String(x.id) === String(id));
  if (!s) return null;
  s.votes = s.votes || [];
  const me = String(userId);
  s.votes = s.votes.includes(me) ? s.votes.filter((v) => v !== me) : [...s.votes, me];
  saveDb();
  return s;
}

export function setSuggestionStatus(id, status) {
  loadDb();
  const s = db.suggestions.find((x) => String(x.id) === String(id));
  if (!s || !SUGGEST_STATUS[status]) return null;
  s.status = status;
  saveDb();
  return s;
}

export function deleteSuggestion(id) {
  loadDb();
  db.suggestions = db.suggestions.filter((x) => String(x.id) !== String(id));
  saveDb();
}

/* ================================================================== */
/* نظرسنجی                                                                 */
/* ================================================================== */

export function listPolls(buildingId) {
  loadDb();
  return db.polls
    .filter((p) => String(p.buildingId) === String(buildingId))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function createPoll(buildingId, draft, by) {
  loadDb();
  const question = String(draft.question || '').trim().slice(0, 200);
  const options = (draft.options || []).map((o) => String(o || '').trim().slice(0, 80)).filter(Boolean).slice(0, 6);
  if (!question) return { error: 'سؤال نظرسنجی لازم است.' };
  if (options.length < 2) return { error: 'حداقل ۲ گزینه لازم است.' };
  const p = {
    id: uid('poll'),
    buildingId: String(buildingId),
    question,
    options,
    votes: {},
    byName: displayNameOf(by),
    closesAt: draft.closesAt ? Number(draft.closesAt) : 0,
    status: 'open',
    createdAt: Date.now(),
  };
  db.polls.push(p);
  saveDb();
  return { poll: p };
}

export function votePoll(id, userId, idx) {
  loadDb();
  const p = db.polls.find((x) => String(x.id) === String(id));
  if (!p || p.status !== 'open') return { error: 'نظرسنجی بسته است.' };
  if (p.closesAt && p.closesAt < Date.now()) {
    p.status = 'closed';
    saveDb();
    return { error: 'مهلت رأی‌گیری تمام شده.' };
  }
  if (idx < 0 || idx >= p.options.length) return { error: 'گزینه نامعتبر.' };
  p.votes = p.votes || {};
  p.votes[String(userId)] = idx;
  saveDb();
  return { poll: p };
}

export function setPollStatus(id, status) {
  loadDb();
  const p = db.polls.find((x) => String(x.id) === String(id));
  if (!p || !['open', 'closed'].includes(status)) return null;
  p.status = status;
  saveDb();
  return p;
}

export function deletePoll(id) {
  loadDb();
  db.polls = db.polls.filter((x) => String(x.id) !== String(id));
  saveDb();
}

export function pollResults(poll) {
  const counts = (poll.options || []).map(() => 0);
  for (const v of Object.values(poll.votes || {})) {
    if (counts[v] !== undefined) counts[v] += 1;
  }
  const total = counts.reduce((s, c) => s + c, 0);
  return { counts, total };
}

/* ================================================================== */
/* تعمیرات و خدمات                                                          */
/* ================================================================== */

export function listTickets(buildingId) {
  loadDb();
  return db.tickets
    .filter((t) => String(t.buildingId) === String(buildingId))
    .sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0));
}

export function createTicket(buildingId, draft, by) {
  loadDb();
  const title = String(draft.title || '').trim().slice(0, 120);
  if (!title) return { error: 'عنوان درخواست لازم است.' };
  const t = {
    id: uid('t'),
    buildingId: String(buildingId),
    byId: by?.id != null ? String(by.id) : '',
    byName: displayNameOf(by),
    bySlot: draft.bySlot || '',
    category: TICKET_CATS[draft.category] ? draft.category : 'other',
    title,
    body: String(draft.body || '').slice(0, 2000),
    image: draft.image || '',
    priority: ['low', 'normal', 'high'].includes(draft.priority) ? draft.priority : 'normal',
    status: 'new',
    assignee: '',
    createdAt: Date.now(),
    doneAt: 0,
  };
  db.tickets.push(t);
  saveDb();
  return { ticket: t };
}

export function updateTicket(id, patch = {}) {
  loadDb();
  const t = db.tickets.find((x) => String(x.id) === String(id));
  if (!t) return null;
  if (patch.status && TICKET_STATUS[patch.status]) {
    t.status = patch.status;
    t.doneAt = patch.status === 'done' ? Date.now() : 0;
  }
  if (patch.assignee !== undefined) t.assignee = String(patch.assignee || '').slice(0, 60);
  if (patch.title !== undefined) t.title = String(patch.title || '').slice(0, 120);
  if (patch.body !== undefined) t.body = String(patch.body || '').slice(0, 2000);
  saveDb();
  return t;
}

export function deleteTicket(id) {
  loadDb();
  db.tickets = db.tickets.filter((x) => String(x.id) !== String(id));
  saveDb();
}

/* ---------- نوبت نظافت چرخشی (خودکار بر اساس هفته) ---------- */

export function ensureCleaning(buildingId) {
  loadDb();
  const b = getBuilding(buildingId);
  if (!b) return null;
  b.cleaning = b.cleaning || { order: [], start: Date.now(), offset: 0 };
  if (!b.cleaning.order?.length) {
    b.cleaning.order = listUnits(buildingId).map((u) => u.slotKey);
    b.cleaning.start = Date.now();
    b.cleaning.offset = 0;
    saveDb();
  }
  return b.cleaning;
}

export function cleaningState(buildingId) {
  loadDb();
  const cl = ensureCleaning(buildingId);
  if (!cl || !cl.order?.length) return null;
  const weeks = Math.floor((Date.now() - (cl.start || Date.now())) / (7 * 86400000));
  const idx = (((weeks + (cl.offset || 0)) % cl.order.length) + cl.order.length) % cl.order.length;
  return {
    current: cl.order[idx],
    next: cl.order[(idx + 1) % cl.order.length],
    weekNo: weeks + 1,
    order: cl.order,
  };
}

export function rotateCleaning(buildingId, dir = 1) {
  loadDb();
  const b = getBuilding(buildingId);
  if (!b) return null;
  b.cleaning = b.cleaning || { order: [], start: Date.now(), offset: 0 };
  b.cleaning.offset = (b.cleaning.offset || 0) + dir;
  saveDb();
  return cleaningState(buildingId);
}

/* ================================================================== */
/* اسناد / مخاطبین / رویدادها / قوانین                                      */
/* ================================================================== */

export function listDocs(buildingId) {
  loadDb();
  return db.docs.filter((d) => String(d.buildingId) === String(buildingId)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function createDoc(buildingId, draft, by) {
  loadDb();
  const title = String(draft.title || '').trim().slice(0, 120);
  if (!title) return { error: 'عنوان سند لازم است.' };
  const d = {
    id: uid('doc'),
    buildingId: String(buildingId),
    title,
    kind: DOC_KINDS[draft.kind] ? draft.kind : 'other',
    body: String(draft.body || '').slice(0, 4000),
    file: draft.file || '',
    fileName: draft.fileName || '',
    byName: displayNameOf(by),
    createdAt: Date.now(),
  };
  db.docs.push(d);
  saveDb();
  return { doc: d };
}

export function deleteDoc(id) {
  loadDb();
  db.docs = db.docs.filter((x) => String(x.id) !== String(id));
  saveDb();
}

export function listContacts(buildingId) {
  loadDb();
  return db.contacts.filter((c) => String(c.buildingId) === String(buildingId)).sort((a, b) => String(a.name).localeCompare(String(b.name), 'fa'));
}

export function upsertContact(buildingId, draft) {
  loadDb();
  const name = String(draft.name || '').trim().slice(0, 60);
  if (!name) return { error: 'نام لازم است.' };
  if (draft.id) {
    const c = db.contacts.find((x) => String(x.id) === String(draft.id));
    if (!c) return { error: 'مخاطب پیدا نشد.' };
    c.name = name;
    c.role = String(draft.role || '').slice(0, 60);
    c.phone = String(draft.phone || '').slice(0, 20);
    c.note = String(draft.note || '').slice(0, 300);
    saveDb();
    return { contact: c };
  }
  const c = {
    id: uid('ct'),
    buildingId: String(buildingId),
    name,
    role: String(draft.role || '').slice(0, 60),
    phone: String(draft.phone || '').slice(0, 20),
    note: String(draft.note || '').slice(0, 300),
  };
  db.contacts.push(c);
  saveDb();
  return { contact: c };
}

export function deleteContact(id) {
  loadDb();
  db.contacts = db.contacts.filter((x) => String(x.id) !== String(id));
  saveDb();
}

export function listEvents(buildingId) {
  loadDb();
  return db.events.filter((e) => String(e.buildingId) === String(buildingId)).sort((a, b) => (a.date || 0) - (b.date || 0));
}

export function createEvent(buildingId, draft, by) {
  loadDb();
  const title = String(draft.title || '').trim().slice(0, 120);
  if (!title) return { error: 'عنوان رویداد لازم است.' };
  const e = {
    id: uid('ev'),
    buildingId: String(buildingId),
    title,
    date: draft.date ? Number(draft.date) : Date.now(),
    time: String(draft.time || '').slice(0, 10),
    place: String(draft.place || '').slice(0, 80),
    body: String(draft.body || '').slice(0, 1000),
    byName: displayNameOf(by),
    createdAt: Date.now(),
  };
  db.events.push(e);
  saveDb();
  return { event: e };
}

export function deleteEvent(id) {
  loadDb();
  db.events = db.events.filter((x) => String(x.id) !== String(id));
  saveDb();
}

export function setRules(buildingId, text) {
  return updateBuilding(buildingId, { rules: String(text || '').slice(0, 4000) });
}

/* ================================================================== */
/* آمار و خروجی                                                            */
/* ================================================================== */

export function statsOf(buildingId) {
  loadDb();
  const b = getBuilding(buildingId);
  if (!b) return null;
  const slots = structureSlots(b);
  const units = listUnits(buildingId);
  const debts = db.debts.filter((d) => String(d.buildingId) === String(buildingId));
  const remaining = debts.reduce((s, d) => s + Math.max(0, (d.amount || 0) - (d.paid || 0)), 0);
  const collected = db.payments
    .filter((p) => String(p.buildingId) === String(buildingId) && p.status === 'approved')
    .reduce((s, p) => s + (p.amount || 0), 0);
  return {
    totalSlots: slots.length,
    joined: units.length,
    occupancy: slots.length ? Math.round((units.length / slots.length) * 100) : 0,
    emptySlots: slots.filter((sk) => !units.some((u) => u.slotKey === sk)),
    remaining,
    collected,
    pendingPayments: db.payments.filter((p) => String(p.buildingId) === String(buildingId) && p.status === 'pending').length,
    openTickets: db.tickets.filter((t) => String(t.buildingId) === String(buildingId) && (t.status === 'new' || t.status === 'doing')).length,
    openComplaints: db.complaints.filter((c) => String(c.buildingId) === String(buildingId) && (c.status === 'new' || c.status === 'review')).length,
    openPolls: db.polls.filter((p) => String(p.buildingId) === String(buildingId) && p.status === 'open').length,
    fund: fundOf(buildingId),
  };
}

export function exportBuildingCSV(buildingId) {
  loadDb();
  const b = getBuilding(buildingId);
  if (!b) return '';
  const rows = [['نوع', 'اسلات', 'واحد', 'شرح', 'مبلغ (تومان)', 'پرداخت‌شده', 'مانده', 'وضعیت', 'تاریخ']];
  const unitsBySlot = {};
  for (const u of listUnits(buildingId)) unitsBySlot[u.slotKey] = u.headName;
  for (const d of db.debts.filter((x) => String(x.buildingId) === String(buildingId))) {
    const post = getPost(d.postId);
    const rem = Math.max(0, (d.amount || 0) - (d.paid || 0));
    rows.push([
      post?.kind === 'charge' ? 'شارژ' : 'هزینه',
      d.slotKey,
      unitsBySlot[d.slotKey] || 'خالی',
      post?.title || '',
      d.amount || 0,
      d.paid || 0,
      rem,
      rem === 0 ? 'تسویه' : 'بدهکار',
      post ? faDate(post.createdAt) : '',
    ]);
  }
  for (const p of listPayments(buildingId)) {
    rows.push(['پرداخت', p.slotKey, unitsBySlot[p.slotKey] || '', p.note || PAY_METHODS[p.method] || '', p.amount || 0, '', '', p.status === 'approved' ? 'تأییدشده' : p.status === 'pending' ? 'در انتظار' : 'ردشده', faDate(p.createdAt)]);
  }
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

/** کوچک‌سازی عکس (محافظت از سقف LocalStorage) */
export function imageFileToDataURL(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('فایل عکس معتبر نیست.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const w = Math.max(1, Math.round((img.width || 1) * scale));
          const h = Math.max(1, Math.round((img.height || 1) * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('خواندن عکس ناموفق بود.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('خواندن فایل ناموفق بود.'));
    reader.readAsDataURL(file);
  });
}

/* ================================================================== */
/* سید دموی زنده                                                           */
/* ================================================================== */

const DAY = 86400000;

export function seedDemoBuilding(user) {
  loadDb();
  const now = Date.now();
  const ago = (days, h = 0) => now - days * DAY - h * 3600000;
  const me = displayNameOf(user);
  const meId = user?.id != null ? String(user.id) : 'demo-user';

  const b = createBuilding(
    {
      name: 'برج سپیدار 🌳',
      address: 'خیابان ولیعصر، بالاتر از پارک ساعی، کوچه سپیدار، پلاک ۱۲',
      city: 'تهران',
      floors: 4,
      unitsPerFloor: 3,
      fundStart: 12000000,
      demo: true,
      rules:
        '۱) ساعت سکوت: ۱۴ تا ۱۶ و ۲۲ تا ۸ صبح 🤫\n۲) پارکینگ مهمان فقط با هماهنگی مدیر 🅿️\n۳) شارژ تا دهم هر ماه پرداخت شود 🧾\n۴) نظافت راه‌پله طبق نوبت هفتگی 🧹\n۵) حیوانات خانگی فقط داخل واحد 🐾\n۶) زباله‌ها ساعت ۲۱ بیرون گذاشته شود 🗑️',
    },
    user
  );
  const bid = b.id;

  // ---- واحدها (۸ جوین‌شده از ۱۲) ----
  const seedUnits = [
    { sk: '1-1', headName: 'رضا کریمی', family: 'کریمی', ownerType: 'owner', residents: 4, phone: '۰۹۱۲۳۴۵۶۷۸۹', cars: [{ plate: '۱۲ب۳۴۵-۱۱', type: 'پژو ۲۰۷' }], pets: '', bio: 'ساکن قدیمی ساختمان 🏡' },
    { sk: '1-3', headName: 'سارا محمدی', family: 'محمدی', ownerType: 'tenant', residents: 2, phone: '۰۹۳۵۱۱۱۲۲۳۳', cars: [], pets: 'یک گربه 🐱', bio: '' },
    { sk: '2-1', headName: 'امیر تهرانی', family: 'تهرانی', ownerType: 'owner', residents: 3, phone: '۰۹۱۹۸۷۶۵۴۳۲', cars: [{ plate: '۴۴ج۶۷۸-۲۲', type: 'دنا پلاس' }], pets: '', bio: '' },
    { sk: '2-3', headName: 'لیلا رضایی', family: 'رضایی', ownerType: 'owner', residents: 2, phone: '۰۹۲۰۴۴۵۵۶۶۷', cars: [], pets: '', bio: 'طراح داخلی 🎨' },
    { sk: '3-1', headName: me, family: '', ownerType: 'owner', residents: 3, phone: '', cars: [], pets: '', bio: 'واحد شما ⭐', linkMe: true },
    { sk: '4-1', headName: 'مهدی قاسمی', family: 'قاسمی', ownerType: 'owner', residents: 5, phone: '۰۹۱۲۵۵۶۶۷۷۸', cars: [{ plate: '۷۷د۹۹۰-۳۳', type: 'سمند' }], pets: '', bio: '' },
    { sk: '4-2', headName: 'نگار کریمی', family: 'کریمی', ownerType: 'tenant', residents: 1, phone: '۰۹۳۰۱۱۲۲۳۳۴', cars: [], pets: '', bio: 'دانشجو 📚' },
    { sk: '4-3', headName: 'حسین مرادی', family: 'مرادی', ownerType: 'owner', residents: 2, phone: '۰۹۱۷۷۶۶۵۵۴۴', cars: [{ plate: '۹۹ه۱۲۳-۴۴', type: 'تیبا' }], pets: 'قناری 🐤', bio: '' },
  ];
  const unitIds = {};
  for (const s of seedUnits) {
    const { floor, no } = parseSlot(s.sk);
    const u = {
      id: uid('u'),
      buildingId: bid,
      slotKey: s.sk,
      floor,
      no,
      headName: s.headName,
      family: s.family,
      phone: s.phone,
      ownerType: s.ownerType,
      residents: s.residents,
      userId: s.linkMe ? meId : '',
      avatar: s.linkMe ? user?.avatar || '' : '',
      photo: '',
      bio: s.bio,
      cars: s.cars,
      meters: { water: `W-${s.sk}`, electricity: `E-${s.sk}` },
      pets: s.pets,
      joinedAt: ago(120 + floor * 10),
    };
    db.units.push(u);
    unitIds[s.sk] = u;
  }

  // ---- پست‌ها + بدهی ----
  const mkPost = (draft, createdAt) => {
    const r = createPost(bid, draft, { id: b.managerId, name: me });
    if (r.post) {
      r.post.createdAt = createdAt;
      for (const d of db.debts) {
        if (d.postId === r.post.id) d.createdAt = createdAt;
      }
    }
    return r.post;
  };
  const charge1 = mkPost(
    { kind: 'charge', title: 'شارژ مرداد 🧾', body: 'شارژ ماه مرداد شامل نظافت، سرایدار و قبوض مشاعات. مهلت پرداخت تا ۱۰ مرداد.', amount: 4800000, month: 'مرداد', dueDate: ago(30), pinned: false },
    ago(45)
  );
  const charge2 = mkPost(
    { kind: 'charge', title: 'شارژ شهریور 🧾', body: 'شارژ ماه شهریور. لطفاً تا ۱۰ شهریور پرداخت کنید تا مشمول تذکر نشوید 🙏', amount: 5400000, month: 'شهریور', dueDate: ago(2), pinned: true },
    ago(12)
  );
  const exp1 = mkPost(
    { kind: 'expense', category: 'elevator', title: 'تعمیر اساسی آسانسور 🛗', body: 'تعویض سیم‌بکسل و سرویس موتور آسانسور توسط شرکت ایمن‌بالابر. فاکتور در بخش اسناد.', amount: 18000000, dueDate: ago(5) },
    ago(20)
  );
  mkPost(
    { kind: 'expense', category: 'cleaning', title: 'نظافت ویژه راه‌پله و لابی 🧹', body: 'نظافت ویژه پایان فصل + شستشوی موکت لابی.', amount: 2400000, dueDate: ago(1) },
    ago(6)
  );
  mkPost(
    { kind: 'notice', title: 'جلسه مجمع عمومی 📢', body: 'جلسه مجمع عمومی ساختمان جمعه ساعت ۱۷ در لابی برگزار می‌شود. دستور جلسه: تصویب بودجه پاییز و انتخاب بازرس. حضور همه واحدها الزامی است.', pinned: true },
    ago(3)
  );
  mkPost(
    { kind: 'discussion', title: 'نصب دوربین مداربسته؟ 🎥', body: 'دوستان نظرتون درباره نصب ۴ دوربین برای پارکینگ و ورودی چیه؟ هزینه تقریبی ۸ میلیون. لطفاً تو نظرسنجی شرکت کنید.' },
    ago(2, 5)
  );

  // ---- پرداخت‌ها (تخصیص مستقیم به بدهی همان پست — قطعی و قابل پیش‌بینی) ----
  const payFor = (sk, debtPost, amount, daysAgo, status = 'approved', byName = '') => {
    const d = db.debts.find((x) => x.postId === debtPost.id && x.slotKey === sk && String(x.buildingId) === bid);
    if (!d) return;
    const take = Math.min((d.amount || 0) - (d.paid || 0), amount);
    if (take <= 0) return;
    const mine = [{ debtId: d.id, amount: take }];
    const sum = take;
    const pay = {
      id: uid('pay'),
      buildingId: bid,
      slotKey: sk,
      amount: sum,
      allocs: mine,
      method: 'card',
      receipt: '',
      note: 'کارت‌به‌کارت',
      byId: '',
      byName: byName || unitIds[sk]?.headName || 'ساکن',
      status,
      createdAt: ago(daysAgo),
      decidedAt: status === 'pending' ? 0 : ago(daysAgo) + 3600000,
      decidedBy: status === 'pending' ? '' : me,
    };
    db.payments.push(pay);
    if (status === 'approved') {
      for (const a of mine) {
        const d = db.debts.find((x) => x.id === a.debtId);
        if (d) d.paid = Math.min(d.amount, (d.paid || 0) + a.amount);
      }
    }
  };
  if (charge1 && charge2 && exp1) {
    for (const sk of ['1-1', '2-1', '2-3', '4-1', '4-3']) {
      payFor(sk, charge1, 400000, 32);
      payFor(sk, charge2, 450000, 4);
    }
    payFor('1-3', charge1, 400000, 28);
    payFor('4-2', charge1, 400000, 25);
    payFor('1-1', exp1, 1500000, 15);
    payFor('2-1', exp1, 1500000, 14);
    payFor('4-1', exp1, 1500000, 13);
    payFor('1-3', charge2, 450000, 1, 'pending');
    payFor('2-3', exp1, 1500000, 0, 'pending');
  }

  // ---- پیام‌های گروه ----
  const g = (fromSlot, fromName, text, daysAgo, h = 0) => {
    db.messages.push({ id: uid('m'), buildingId: bid, scope: 'group', threadKey: 'group', fromId: '', fromName, fromSlot, toId: '', toName: '', toSlot: '', text, image: '', createdAt: ago(daysAgo, h) });
  };
  g('3-1', me, 'سلام همسایه‌ها 👋 من مدیر ساختمان شدم. از این به بعد همه‌چیز (شارژ، هزینه‌ها، اطلاعیه‌ها) همین‌جاست.', 12, 2);
  g('1-1', 'رضا کریمی', 'سلام و خسته نباشید 👏 عالیه، بالاخره ساختمون ما هم دیجیتال شد!', 12, 1);
  g('2-3', 'لیلا رضایی', 'من یه پیشنهاد برای دیزاین لابی گذاشتم، لطفاً رأی بدید 🎨', 5, 3);
  g('4-1', 'مهدی قاسمی', 'آسانسور دوباره صدا میده 😅 کی قراره درست شه؟', 4, 6);
  g('3-1', me, 'تعمیرکار پنجشنبه میاد، هزینه‌ش هم تو بخش مالی ثبت شده 🛗', 4, 5);
  g('2-1', 'امیر تهرانی', 'شارژ شهریور رو پرداخت کردم، فیش رو هم آپلود کردم ✅', 4, 2);
  g('4-2', 'نگار کریمی', 'کسی بسته منو دیده؟ پستچی گفته تحویل لابی داده 📦', 2, 7);
  g('1-3', 'سارا محمدی', 'آره عزیزم پیش منه، هر وقت اومدی ببر 😊', 2, 6);
  g('4-3', 'حسین مرادی', 'جمعه جلسه یادتون نره! من شیرینی میارم 🍬', 1, 4);
  g('2-3', 'لیلا رضایی', 'دوربین رو من موافقم، پارکینگ خیلی تاریکه 🎥', 0, 8);

  // ---- پیام خصوصی به مدیر ----
  db.messages.push({ id: uid('m'), buildingId: bid, scope: 'dm', threadKey: dmThreadKey('u-seed-4-2', meId), fromId: 'u-seed-4-2', fromName: 'نگار کریمی', fromSlot: '4-2', toId: meId, toName: me, toSlot: '3-1', text: 'سلام، امکانش هست شارژ من رو دو قسط کنم؟ این ماه یکم سختمه 🙏', image: '', createdAt: ago(1, 2) });

  // ---- شکایات ----
  db.complaints.push(
    { id: uid('c'), buildingId: bid, fromId: '', fromName: 'امیر تهرانی', fromSlot: '2-1', anonymous: false, targetKind: 'unit', targetSlot: '4-1', category: 'noise', title: 'سروصدای شبانه', body: 'دو شب پشت سر هم از واحد ۴-۱ صدای مهمونی تا ساعت ۲ شب میومد. لطفاً رعایت کنید.', status: 'review', response: 'با واحد صحبت شد و قول همکاری دادند. 🙏', createdAt: ago(6) },
    { id: uid('c'), buildingId: bid, fromId: '', fromName: 'ساکن', fromSlot: '1-3', anonymous: true, targetKind: 'common', targetSlot: '', category: 'parking', title: 'پارک دوبله در پارکینگ', body: 'یه ماشین غریبه سه روزه جلوی جای پارک منه. لطفاً پیگیری شود.', status: 'new', response: '', createdAt: ago(1, 5) },
    { id: uid('c'), buildingId: bid, fromId: '', fromName: 'حسین مرادی', fromSlot: '4-3', anonymous: false, targetKind: 'manager', targetSlot: '', category: 'cleaning', title: 'نظافت پشت‌بام', body: 'پشت‌بام خیلی کثیفه و موقع بارون آب جمع میشه.', status: 'resolved', response: 'نظافت انجام شد ✅', createdAt: ago(15) }
  );

  // ---- پیشنهادها ----
  db.suggestions.push(
    { id: uid('s'), buildingId: bid, byId: '', byName: 'لیلا رضایی', bySlot: '2-3', area: 'lobby', title: 'دیوار سبز برای لابی 🌿', body: 'یه دیوار سبز مصنوعی با نور مخفی برای لابی خیلی قشنگ میشه. هزینه‌ش حدود ۳ میلیونه.', image: '', votes: ['v1', 'v2', 'v3', 'v4', 'v5'], status: 'review', createdAt: ago(5) },
    { id: uid('s'), buildingId: bid, byId: '', byName: 'امیر تهرانی', bySlot: '2-1', area: 'parking', title: 'خط‌کشی و شماره‌گذاری پارکینگ 🅿️', body: 'جاهای پارک مشخص بشن تا دعوا نشه. هر واحد یه شماره.', image: '', votes: ['v1', 'v2', 'v3'], status: 'approved', createdAt: ago(9) },
    { id: uid('s'), buildingId: bid, byId: '', byName: 'نگار کریمی', bySlot: '4-2', area: 'garden', title: 'باغچه سبزیجات مشترک 🥬', body: 'یه گوشه حیاط باغچه بزنیم، هر واحد یه ردیف. هم قشنگه هم دورهمی!', image: '', votes: ['v1', 'v2'], status: 'idea', createdAt: ago(2) }
  );

  // ---- نظرسنجی ----
  db.polls.push(
    { id: uid('poll'), buildingId: bid, question: 'دوربین مداربسته نصب بشه؟ (سهم هر واحد ~۷۰۰ هزار تومان)', options: ['بله، حتماً 👍', 'نه، لازم نیست 👎', 'نظری ندارم 🤷'], votes: { v1: 0, v2: 0, v3: 0, v4: 1, v5: 0 }, byName: me, closesAt: now + 5 * DAY, status: 'open', createdAt: ago(2) },
    { id: uid('poll'), buildingId: bid, question: 'ساعت نظافت هفتگی راه‌پله؟', options: ['شنبه صبح', 'چهارشنبه عصر', 'پنجشنبه صبح'], votes: { v1: 0, v2: 2, v3: 2, v4: 0, v5: 2, v6: 1 }, byName: me, closesAt: 0, status: 'closed', createdAt: ago(20) }
  );

  // ---- تعمیرات ----
  db.tickets.push(
    { id: uid('t'), buildingId: bid, byId: '', byName: 'مهدی قاسمی', bySlot: '4-1', category: 'elevator', title: 'صدای عجیب آسانسور', body: 'موقع حرکت بین طبقه ۲ و ۳ صدای تق‌تق میده.', image: '', priority: 'high', status: 'doing', assignee: 'شرکت ایمن‌بالابر', createdAt: ago(4), doneAt: 0 },
    { id: uid('t'), buildingId: bid, byId: '', byName: 'سارا محمدی', bySlot: '1-3', category: 'electric', title: 'لامپ سوخته راه‌پله طبقه ۱', body: '', image: '', priority: 'low', status: 'done', assignee: 'سرایدار', createdAt: ago(10), doneAt: ago(9) },
    { id: uid('t'), buildingId: bid, byId: '', byName: 'حسین مرادی', bySlot: '4-3', category: 'plumbing', title: 'نشتی لوله پارکینگ', body: 'از سقف پارکینگ چکه می‌کنه، جای واحد ۴-۳.', image: '', priority: 'normal', status: 'new', assignee: '', createdAt: ago(0, 6), doneAt: 0 }
  );

  // ---- اسناد ----
  db.docs.push(
    { id: uid('doc'), buildingId: bid, title: 'صورتجلسه مجمع مرداد', kind: 'minutes', body: 'حاضرین: ۸ واحد از ۱۲. مصوبات: ۱) افزایش شارژ به ۴۵۰ هزار ۲) تعمیر آسانسور تصویب شد ۳) آقای ... به‌عنوان بازرس انتخاب شد.', file: '', fileName: '', byName: me, createdAt: ago(30) },
    { id: uid('doc'), buildingId: bid, title: 'فاکتور تعمیر آسانسور', kind: 'bill', body: 'شرکت ایمن‌بالابر — تعویض سیم‌بکسل + سرویس دوره‌ای: ۱۸٬۰۰۰٬۰۰۰ تومان', file: '', fileName: '', byName: me, createdAt: ago(19) }
  );

  // ---- مخاطبین ----
  const cts = [
    ['آقای نادری (سرایدار)', 'سرایدار', '۰۹۱۲۱۱۱۲۲۳۳', 'ساعت کاری ۸ تا ۱۸'],
    ['شرکت ایمن‌بالابر', 'تعمیر آسانسور', '۰۲۱۴۴۵۵۶۶۷۷', 'قرارداد سالانه'],
    ['تأسیسات کریمی', 'لوله‌کش', '۰۹۱۹۸۸۷۷۶۶۵', ''],
    ['اورژانس', 'اضطراری', '۱۱۵', '🚨'],
  ];
  for (const [name, role, phone, note] of cts) {
    db.contacts.push({ id: uid('ct'), buildingId: bid, name, role, phone, note });
  }

  // ---- رویدادها ----
  db.events.push(
    { id: uid('ev'), buildingId: bid, title: 'جلسه مجمع عمومی 🏛️', date: now + 3 * DAY, time: '۱۷:۰۰', place: 'لابی ساختمان', body: 'دستور جلسه: بودجه پاییز + انتخاب بازرس', byName: me, createdAt: ago(3) },
    { id: uid('ev'), buildingId: bid, title: 'سرویس دوره‌ای آسانسور 🛗', date: now + 10 * DAY, time: '۱۰:۰۰', place: '', body: '', byName: me, createdAt: ago(1) }
  );

  // ---- نوبت نظافت ----
  b.cleaning = { order: ['1-1', '1-3', '2-1', '2-3', '3-1', '4-1', '4-2', '4-3'], start: ago(14), offset: 0 };

  saveDb();
  return b;
}

/* ================================================================== */
/* انتقال به دستگاه جدید 📲 (بسته قابل حمل)                                */
/* ================================================================== */

const TRANSFER_MAGIC = 'VXBLD1';
const TRANSFER_VERSION = 1;
const TRANSFER_COLLECTIONS = ['units', 'posts', 'debts', 'payments', 'messages', 'complaints', 'suggestions', 'polls', 'tickets', 'docs', 'contacts', 'events'];

function b64encode(str) {
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf8').toString('base64');
  return btoa(unescape(encodeURIComponent(str)));
}

function b64decode(b64) {
  if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
  return decodeURIComponent(
    Array.prototype.map.call(atob(b64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function stripDataImages(value) {
  if (Array.isArray(value)) return value.map(stripDataImages);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) {
      const v = value[k];
      if (['cover', 'photo', 'receipt', 'image', 'file'].includes(k) && typeof v === 'string' && v.startsWith('data:')) out[k] = '';
      else out[k] = stripDataImages(v);
    }
    return out;
  }
  return value;
}

/** ساخت بسته انتقال یک ساختمان */
export function exportBuildingPackage(buildingId, { includeImages = true } = {}) {
  loadDb();
  const building = getBuilding(buildingId);
  if (!building) return { error: 'ساختمان پیدا نشد.' };
  const bid = String(buildingId);
  const data = { building: { ...building } };
  for (const k of TRANSFER_COLLECTIONS) {
    data[k] = db[k].filter((it) => String(it.buildingId) === bid).map((it) => ({ ...it }));
  }
  const envelope = { app: 'vixora-building', v: TRANSFER_VERSION, exportedAt: Date.now(), data: includeImages ? data : stripDataImages(data) };
  const json = JSON.stringify(envelope);
  const b64 = b64encode(json);
  const payload = `${TRANSFER_MAGIC}.${fnv1a(b64)}.${b64}`;
  const counts = {};
  for (const k of TRANSFER_COLLECTIONS) counts[k] = data[k].length;
  return { payload, size: payload.length, jsonSize: json.length, counts };
}

/** اعتبارسنجی و خواندن بسته (بدون وارد کردن) */
export function parseTransferPayload(input) {
  const clean = String(input || '').trim().replace(/\s+/g, '');
  if (!clean) return { error: 'متن بسته خالی است.' };
  const parts = clean.split('.');
  if (parts.length !== 3 || parts[0] !== TRANSFER_MAGIC) return { error: 'این متن، بسته معتبر ساختمان نیست.' };
  const hash = parts[1];
  const b64 = parts[2];
  if (fnv1a(b64) !== String(hash).toLowerCase()) return { error: 'بسته خراب است (کد صحت مطابقت ندارد). دوباره کپی کنید.' };
  let envelope;
  try {
    envelope = JSON.parse(b64decode(b64));
  } catch {
    return { error: 'خواندن بسته ناموفق بود.' };
  }
  if (!envelope || envelope.app !== 'vixora-building' || !envelope.data?.building?.id) return { error: 'ساختار بسته معتبر نیست.' };
  return { envelope };
}

/**
 * وارد کردن بسته
 * mode: 'ask' (اگر تکراری بود conflict برمی‌گرداند) | 'overwrite' | 'copy'
 */
export function importBuildingPackage(input, { mode = 'ask' } = {}) {
  const parsed = parseTransferPayload(input);
  if (parsed.error) return parsed;
  loadDb();
  const src = parsed.envelope.data.building;
  const exists = getBuilding(src.id);
  if (exists && mode === 'ask') return { conflict: exists, envelope: parsed.envelope, incoming: src };
  let buildingId = String(src.id);
  const data = parsed.envelope.data;
  if (exists && mode === 'overwrite') {
    deleteBuilding(buildingId);
    loadDb();
  } else if (exists && mode === 'copy') {
    buildingId = uid('b');
    let code = genCode();
    while (db.buildings.some((b) => b.code === code)) code = genCode();
    data.building = { ...src, id: buildingId, code, name: `${src.name} (کپی)` };
  }
  db.buildings.push({ ...data.building, id: buildingId });
  for (const k of TRANSFER_COLLECTIONS) {
    if (Array.isArray(data[k])) {
      for (const it of data[k]) db[k].push({ ...it, buildingId });
    }
  }
  saveDb();
  const counts = {};
  for (const k of TRANSFER_COLLECTIONS) counts[k] = Array.isArray(data[k]) ? data[k].length : 0;
  return { building: getBuilding(buildingId), counts, copied: !!(exists && mode === 'copy') };
}
