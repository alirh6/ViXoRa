// 🎲 ViXoRa Savings Lottery — قرعه‌کشی قطعی با سید عمومی + صف دستی
// src/pages/tools/savingsCircle/sv-lottery.js
import { newId, audit, notify, memberById, cyrb53 } from './sv-store.js';
import { roundLabel } from './sv-finance.js';

/** مولد قطعی از روی سید (قابل بازپخش) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedToInt(seed) {
  const s = cyrb53(seed);
  let n = 0;
  for (const ch of s) n = (n * 36 + parseInt(ch, 36)) >>> 0;
  return n;
}
export function drawSeed(c, rounds) {
  const nonce = (c.draws || []).length + 1;
  return `${c.id}:R${[...rounds].sort((a, b) => a - b).join('-')}#${nonce}:${Date.now().toString(36)}`;
}

/** چه کسانی حق نوبت دارند؟ فعال + تاییدشده + بدون نوبت قبلی (هرکس یک‌بار) */
export function eligible(c, ignoreRounds = []) {
  const taken = new Set((c.queue || []).filter((q) => !ignoreRounds.includes(Number(q.round))).map((q) => String(q.memberId)));
  return (c.members || []).filter((m) => m.active !== false && m.approved && !taken.has(String(m.id)));
}

/** قرعه‌کشی برای چند نوبت — فقط مدیر */
export function drawLots(c, rounds, adminMember) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  rounds = [...new Set(rounds.map(Number).filter((r) => r >= 1 && r <= c.months))].sort((a, b) => a - b);
  if (!rounds.length) return { ok: false, error: 'نوبتی انتخاب نشده.' };
  const redraw = rounds.filter((r) => (c.queue || []).some((q) => Number(q.round) === r));
  const pool = eligible(c, rounds);
  if (pool.length < rounds.length) return { ok: false, error: `عضو واجد فقط ${pool.length} نفر است ولی ${rounds.length} نوبت خواستی.` };
  const seed = drawSeed(c, rounds);
  const rnd = mulberry32(seedToInt(seed));
  const bag = [...pool];
  const picks = rounds.map((r) => {
    const i = Math.floor(rnd() * bag.length);
    const [m] = bag.splice(i, 1);
    return { round: r, memberId: m.id };
  });
  // اعمال
  c.queue = (c.queue || []).filter((q) => !rounds.includes(Number(q.round)));
  for (const p of picks) c.queue.push({ round: p.round, memberId: p.memberId, method: 'lottery', at: Date.now(), by: adminMember.id, seed });
  c.queue.sort((a, b) => a.round - b.round);
  const draw = { id: newId('d'), rounds, seed, picks, at: Date.now(), by: adminMember.id, redraw: redraw.length > 0 };
  c.draws.push(draw);
  const names = picks.map((p) => `${roundLabel(c, p.round)} ← ${memberById(c, p.memberId)?.name}`).join('، ');
  audit(c, adminMember.name, redraw.length ? 'lottery.redraw' : 'lottery.draw', `نوبت‌ها ${rounds.join('،')} • ${names} • سید ${seed}`);
  const msg = `${redraw.length ? '🔁 قرعه‌کشی مجدد' : '🎲 نتیجه قرعه‌کشی'}: ${names} — سید عمومی: ${seed.slice(-10)} (از بخش قرعه‌کشی قابل بازپخش است)`;
  c.chat.push({ id: newId('c'), at: Date.now(), kind: 'announce', text: msg });
  notify(c, 'all', msg, 'lottery');
  return { ok: true, draw };
}

/** بازپخش یک قرعه‌کشی برای اثبات سلامت */
export function replayDraw(c, drawId) {
  const d = (c.draws || []).find((x) => x.id === drawId);
  if (!d) return { ok: false, error: 'پیدا نشد.' };
  const rnd = mulberry32(seedToInt(d.seed));
  // بازسازی استخر آن لحظه: اعضای فعالِ بدون نوبتِ خارج از این نوبت‌ها + خود برنده‌ها
  const others = new Set((c.queue || []).filter((q) => !d.rounds.includes(Number(q.round))).map((q) => String(q.memberId)));
  const pool = (c.members || []).filter((m) => {
    if (others.has(String(m.id))) return false;
    if (d.picks.some((p) => String(p.memberId) === String(m.id))) return true;
    return m.active !== false && m.approved;
  });
  // ترتیب استخر باید همان ترتیب اصلی باشد: ترتیب members
  const bag = [...pool];
  const picks = [...d.rounds].sort((a, b) => a - b).map((r) => {
    if (!bag.length) return { round: r, memberId: '' };
    const i = Math.floor(rnd() * bag.length);
    return { round: r, memberId: bag.splice(i, 1)[0].id };
  });
  const match = picks.every((p, i) => String(p.memberId) === String(d.picks[i]?.memberId));
  return { ok: true, match, picks };
}

/** ثبت دستی نوبت — فقط مدیر (با اعلام غیرقابل حذف) */
export function assignManual(c, round, memberId, adminMember) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  round = Number(round);
  if (!(round >= 1 && round <= c.months)) return { ok: false, error: 'نوبت نامعتبر.' };
  const m = memberById(c, memberId);
  if (!m || m.active === false || !m.approved) return { ok: false, error: 'عضو معتبر نیست.' };
  const hasOther = (c.queue || []).some((q) => String(q.memberId) === String(memberId) && Number(q.round) !== round);
  if (hasOther) return { ok: false, error: `${m.name} قبلاً یک نوبت دارد (هرکس فقط یک‌بار).` };
  const prev = (c.queue || []).find((q) => Number(q.round) === round);
  c.queue = (c.queue || []).filter((q) => Number(q.round) !== round);
  c.queue.push({ round, memberId, method: 'manual', at: Date.now(), by: adminMember.id });
  c.queue.sort((a, b) => a.round - b.round);
  const prevName = prev ? memberById(c, prev.memberId)?.name : null;
  audit(c, adminMember.name, 'queue.set', `نوبت ${round} ← ${m.name} (دستی)${prevName ? ` • قبلی: ${prevName}` : ''}`);
  const msg = `📢 تغییر صف توسط مدیر: نوبت «${roundLabel(c, round)}» ← ${m.name}${prevName ? ` (قبلاً: ${prevName})` : ''}.`;
  c.chat.push({ id: newId('c'), at: Date.now(), kind: 'announce', text: msg });
  notify(c, 'all', msg, 'lottery');
  return { ok: true };
}
export function clearSlot(c, round, adminMember) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  const prev = (c.queue || []).find((q) => Number(q.round) === Number(round));
  if (!prev) return { ok: false, error: 'این نوبت خالی است.' };
  if (prev.method === 'admin-first') return { ok: false, error: 'نوبت اولِ مدیر (قانون صندوق) پاک نمی‌شود.' };
  if ((c.payouts || []).some((p) => Number(p.round) === Number(round))) return { ok: false, error: 'این نوبت پرداخت شده و قفل است.' };
  c.queue = (c.queue || []).filter((q) => Number(q.round) !== Number(round));
  const nm = memberById(c, prev.memberId)?.name;
  audit(c, adminMember.name, 'queue.clear', `نوبت ${round} (قبلی: ${nm}) خالی شد`);
  const msg = `📢 تغییر صف توسط مدیر: نوبت «${roundLabel(c, round)}» خالی شد (قبلاً: ${nm}).`;
  c.chat.push({ id: newId('c'), at: Date.now(), kind: 'announce', text: msg });
  notify(c, 'all', msg, 'lottery');
  return { ok: true };
}
