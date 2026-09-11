// 💸 ViXoRa Savings Finance — قسط‌بندی، ادعای واریز، دفترکل، حسابرسی، تسویه
// src/pages/tools/savingsCircle/sv-finance.js
import { newId, audit, notify, memberById } from './sv-store.js';

export const J_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/** تاریخ شمسی واقعی امروز */
export function jalaliNow() {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
    const g = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
    return { y: g('year'), m: g('month'), d: g('day') };
  } catch { return { y: 1404, m: 7, d: 1 }; }
}
export function roundLabel(c, round) {
  const idx = (c.startM - 1 + (round - 1)) % 12;
  const y = c.startY + Math.floor((c.startM - 1 + (round - 1)) / 12);
  return `${J_MONTHS[idx]} ${y.toLocaleString('fa-IR')}`;
}
/** نوبت جاری بر اساس ماه واقعی (۱..months) */
export function currentRound(c) {
  const n = jalaliNow();
  const diff = (n.y - c.startY) * 12 + (n.m - c.startM);
  return Math.min(c.months, Math.max(1, diff + 1));
}
export function daysToDue(c) {
  const n = jalaliNow();
  const diff = (n.y - c.startY) * 12 + (n.m - c.startM);
  if (diff < 0 || diff >= c.months) return null;
  return c.dueDay - n.d; // منفی = معوق
}

/* ---------- پرداخت‌های تاییدشده یک عضو در یک نوبت ---------- */
export function roundPaid(c, memberId, round) {
  let paid = 0;
  for (const e of (c.ledger || [])) {
    if (e.kind === 'pay' && String(e.memberId) === String(memberId) && Number(e.round) === Number(round)) paid += e.amount;
  }
  return paid;
}
export function roundPending(c, memberId, round) {
  let p = 0;
  for (const cl of (c.claims || [])) {
    if (cl.status === 'pending' && String(cl.memberId) === String(memberId) && Number(cl.round) === Number(round)) p += cl.amount;
  }
  return p;
}
export function memberTotals(c, memberId) {
  const el = Math.min(currentRound(c), c.months);
  const dueTotal = el * c.monthlyDue;
  let paid = 0;
  for (const e of (c.ledger || [])) {
    if (e.kind === 'pay' && String(e.memberId) === String(memberId)) paid += e.amount;
  }
  let pending = 0;
  for (const cl of (c.claims || [])) {
    if (cl.status === 'pending' && String(cl.memberId) === String(memberId)) pending += cl.amount;
  }
  const remaining = Math.max(0, dueTotal - paid);
  const credit = Math.max(0, paid - dueTotal);
  return { elapsed: el, dueTotal, paid, pending, remaining, credit };
}

/* ---------- ثبت ادعای واریز (نیازمند پین عضو — بررسی در صفحه) ---------- */
export function submitClaim(c, memberId, o) {
  const m = memberById(c, memberId);
  if (!m || m.active === false) return { ok: false, error: 'عضو فعالی نیستی.' };
  if (!m.verified) return { ok: false, error: 'مشخصاتت در انتظار تایید مجدد مدیر است.' };
  const amount = Math.trunc(Number(o.amount) || 0);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'مبلغ نامعتبر است.' };
  if (amount < c.minPartial) return { ok: false, error: `حداقل هر واریز ${c.minPartial.toLocaleString('fa-IR')} تومان است.` };
  if (amount > 1000000000) return { ok: false, error: 'مبلغ بیش از حد مجاز است.' };
  const round = Math.min(c.months, Math.max(1, Number(o.round) || currentRound(c)));
  const cl = {
    id: newId('cl'), memberId, round, amount,
    receipt: String(o.receipt || '').slice(0, 400000), // فیش فشرده
    note: String(o.note || '').slice(0, 200),
    at: Date.now(), status: 'pending', decidedAt: 0, decidedBy: '', decideNote: '',
  };
  c.claims.unshift(cl);
  audit(c, m.name, 'claim.submit', `ادعای ${amount} برای نوبت ${round}`);
  notify(c, 'admin', `🧾 ادعای واریز جدید از ${m.name} (${amount.toLocaleString('fa-IR')} تومان)`, 'finance');
  return { ok: true, claim: cl };
}
export function cancelClaim(c, claimId, memberId) {
  const cl = (c.claims || []).find((x) => x.id === claimId);
  if (!cl || String(cl.memberId) !== String(memberId)) return { ok: false, error: 'پیدا نشد.' };
  if (cl.status !== 'pending') return { ok: false, error: 'فقط ادعای درانتظار لغو می‌شود.' };
  cl.status = 'cancelled';
  const m = memberById(c, memberId);
  audit(c, m?.name || '?', 'claim.cancel', `لغو ادعای ${cl.amount}`);
  return { ok: true };
}

/* ---------- تایید/رد ادعا توسط مدیر (پین مدیر در صفحه بررسی می‌شود) ---------- */
export function approveClaim(c, claimId, adminMember) {
  const cl = (c.claims || []).find((x) => x.id === claimId);
  if (!cl) return { ok: false, error: 'ادعا پیدا نشد.' };
  if (cl.status !== 'pending') return { ok: false, error: 'این ادعا قبلاً تعیین‌تکلیف شده.' }; // ضد تایید دوباره
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  const m = memberById(c, cl.memberId);
  if (!m || m.active === false) return { ok: false, error: 'عضو غیرفعال است.' };
  cl.status = 'approved';
  cl.decidedAt = Date.now();
  cl.decidedBy = adminMember.id;
  const self = String(cl.memberId) === String(adminMember.id);
  c.ledger.push({
    id: newId('l'), at: Date.now(), kind: 'pay', memberId: cl.memberId,
    round: cl.round, amount: cl.amount, ref: cl.id, by: adminMember.id,
    note: self ? '⚠️ تایید توسط خود عضو (مدیر)' : '',
  });
  audit(c, adminMember.name, 'claim.approve', `${m.name} • نوبت ${cl.round} • ${cl.amount}${self ? ' • SELF-APPROVED' : ''}`);
  notify(c, cl.memberId, `✅ واریزت تایید شد (${cl.amount.toLocaleString('fa-IR')} تومان — ${roundLabel(c, cl.round)})`, 'finance');
  // آیا نوبت کامل تسویه شد؟
  if (roundComplete(c, cl.round)) {
    const msg = `🎉 قسط «${roundLabel(c, cl.round)}» کامل تسویه شد! همه اعضا پرداخت کردند.`;
    c.chat.push({ id: newId('c'), at: Date.now(), kind: 'announce', text: msg });
    notify(c, 'all', msg, 'finance');
    audit(c, 'سیستم', 'round.complete', `نوبت ${cl.round}`);
  }
  if (c.status === 'forming') c.status = 'active'; // قفل مبلغ از اینجا
  return { ok: true, self };
}
export function rejectClaim(c, claimId, adminMember, note = '') {
  const cl = (c.claims || []).find((x) => x.id === claimId);
  if (!cl) return { ok: false, error: 'ادعا پیدا نشد.' };
  if (cl.status !== 'pending') return { ok: false, error: 'قبلاً تعیین‌تکلیف شده.' };
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  cl.status = 'rejected';
  cl.decidedAt = Date.now();
  cl.decidedBy = adminMember.id;
  cl.decideNote = String(note).slice(0, 200);
  const m = memberById(c, cl.memberId);
  audit(c, adminMember.name, 'claim.reject', `${m?.name} • ${cl.amount} • ${cl.decideNote || 'بدون توضیح'}`);
  notify(c, cl.memberId, `❌ واریزت رد شد (${cl.amount.toLocaleString('fa-IR')} تومان). ${cl.decideNote}`, 'finance');
  return { ok: true };
}
export function roundComplete(c, round) {
  const act = (c.members || []).filter((m) => m.active !== false && m.approved);
  if (!act.length) return false;
  return act.every((m) => roundPaid(c, m.id, round) >= c.monthlyDue);
}

/* ---------- پرداخت به برنده ---------- */
export function recordPayout(c, round, adminMember, amountOverride = 0) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  const slot = (c.queue || []).find((q) => Number(q.round) === Number(round));
  if (!slot) return { ok: false, error: 'برای این نوبت برنده‌ای ثبت نشده.' };
  if ((c.payouts || []).some((p) => Number(p.round) === Number(round))) return { ok: false, error: 'این نوبت قبلاً پرداخت شده.' }; // ضد پرداخت دوباره
  const act = (c.members || []).filter((m) => m.active !== false && m.approved).length;
  const amount = amountOverride > 0 ? Math.trunc(amountOverride) : c.monthlyDue * Math.max(1, act);
  if (amount <= 0) return { ok: false, error: 'مبلغ نامعتبر.' };
  const w = memberById(c, slot.memberId);
  c.payouts.push({ round, memberId: slot.memberId, amount, at: Date.now(), by: adminMember.id, members: act });
  c.ledger.push({ id: newId('l'), at: Date.now(), kind: 'payout', memberId: slot.memberId, round, amount, ref: '', by: adminMember.id, note: '' });
  audit(c, adminMember.name, 'payout.record', `نوبت ${round} → ${w?.name} • ${amount}`);
  const msg = `💰 برداشت نوبت «${roundLabel(c, round)}» به ${w?.name} پرداخت شد (${amount.toLocaleString('fa-IR')} تومان). مبارکه! 🎉`;
  c.chat.push({ id: newId('c'), at: Date.now(), kind: 'announce', text: msg });
  notify(c, 'all', msg, 'finance');
  return { ok: true };
}

/* ---------- حسابرسی خودکار ---------- */
export function poolAudit(c) {
  const errors = [];
  let collected = 0, paidOut = 0;
  const refs = new Set();
  for (const e of (c.ledger || [])) {
    if (e.kind === 'pay') {
      collected += e.amount;
      if (e.ref) {
        if (refs.has(e.ref)) errors.push(`سند تکراری: ${e.ref}`);
        refs.add(e.ref);
        const cl = (c.claims || []).find((x) => x.id === e.ref);
        if (!cl) errors.push(`سند یتیم بدون ادعا: ${e.id}`);
        else if (cl.status !== 'approved') errors.push(`سند برای ادعای تاییدنشده: ${e.ref}`);
        else if (cl.amount < e.amount) errors.push(`مبلغ سند بیش از ادعا: ${e.ref}`);
      }
      if (!(e.amount > 0)) errors.push(`مبلغ نامعتبر در سند: ${e.id}`);
    } else if (e.kind === 'payout') {
      paidOut += e.amount;
      if (!(e.amount > 0)) errors.push(`پرداخت نامعتبر: ${e.id}`);
    }
  }
  const act = (c.members || []).filter((m) => m.active !== false && m.approved).length;
  const el = Math.min(currentRound(c), c.months);
  const expected = el * c.monthlyDue * act;
  const perRound = [];
  for (let r = 1; r <= el; r++) {
    let col = 0;
    for (const e of (c.ledger || [])) if (e.kind === 'pay' && Number(e.round) === r) col += e.amount;
    perRound.push({ round: r, label: roundLabel(c, r), expected: c.monthlyDue * act, collected: col, complete: col >= c.monthlyDue * act });
  }
  let pending = 0;
  for (const cl of (c.claims || [])) if (cl.status === 'pending') pending += cl.amount;
  return { expected, collected, pending, paidOut, balance: collected - paidOut, perRound, errors, activeMembers: act, elapsed: el };
}

/* ---------- امتیاز خوش‌قولی (بر اساس مهلت واقعی هر نوبت) ---------- */
// کبیسه شمسی (قاعده ۳۳ساله — کافی برای ۱۴۰۰ تا ۱۴۵۰)
function isLeapJ(y) {
  const r = y % 33;
  return r === 1 || r === 5 || r === 9 || r === 13 || r === 17 || r === 22 || r === 26 || r === 30;
}
function jMonthLen(y, m) {
  if (m <= 6) return 31;
  if (m <= 11) return 30;
  return isLeapJ(y) ? 30 : 29;
}
/** تبدیل شمسی به میلادی (لنگر: ۱۴۰۴/۰۱/۰۱ = 2025-03-21) */
export function jalaliToGregorian(y, m, d) {
  let days = 0;
  const step = (y > 1404 || (y === 1404 && (m > 1 || (m === 1 && d >= 1)))) ? 1 : -1;
  if (step === 1) {
    let cy = 1404, cm = 1, cd = 1;
    while (cy < y || (cy === y && cm < m) || (cy === y && cm === m && cd < d)) {
      days++; cd++;
      if (cd > jMonthLen(cy, cm)) { cd = 1; cm++; if (cm > 12) { cm = 1; cy++; } }
      if (days > 3000) break;
    }
  } else {
    let cy = 1404, cm = 1, cd = 1;
    while (cy > y || (cy === y && cm > m) || (cy === y && cm === m && cd > d)) {
      days--; cd--;
      if (cd < 1) { cm--; if (cm < 1) { cm = 12; cy--; } cd = jMonthLen(cy, cm); }
      if (days < -3000) break;
    }
  }
  return new Date(Date.UTC(2025, 2, 21) + days * 864e5).getTime();
}
/** پایان مهلت نوبت r (آخرِ روزِ dueDay آن ماه، به timestamp) */
export function roundDeadlineTs(c, r) {
  const idx = (c.startM - 1 + (r - 1)) % 12;
  const y = c.startY + Math.floor((c.startM - 1 + (r - 1)) / 12);
  const m = idx + 1;
  const d = Math.min(c.dueDay, jMonthLen(y, m));
  return jalaliToGregorian(y, m, d) + 86399999;
}
export function reliability(c, memberId) {
  const el = Math.min(currentRound(c), c.months);
  let ontime = 0, late = 0;
  for (let r = 1; r <= el; r++) {
    const paid = roundPaid(c, memberId, r);
    const dl = roundDeadlineTs(c, r);
    if (paid >= c.monthlyDue) {
      const times = (c.ledger || []).filter((e) => e.kind === 'pay' && String(e.memberId) === String(memberId) && Number(e.round) === r).map((e) => e.at);
      const doneAt = Math.max(...times, 0);
      if (doneAt && doneAt <= dl) ontime++;
      else late++; // دیر تسویه کرده
    } else if (Date.now() > dl) {
      late++; // مهلت گذشته و کامل نکرده
    }
    // نوبت جاریِ دارای مهلت شمرده نمی‌شود (نه مثبت نه منفی)
  }
  const denom = ontime + late;
  return { score: denom ? Math.round((ontime / denom) * 100) : 100, ontime, late, counted: denom };
}

/* ---------- تسویه خروج ---------- */
export function settlement(c, memberId) {
  const t = memberTotals(c, memberId);
  let received = 0;
  for (const p of (c.payouts || [])) if (String(p.memberId) === String(memberId)) received += p.amount;
  // سهم منصفانه: باید تا امروز elapsed قسط داده باشد
  const net = t.paid - t.dueTotal; // مثبت = بستانکار
  return { ...t, received, net, verdict: net >= 0 ? 'receive' : 'pay' };
}

/* ---------- خروجی CSV ---------- */
export function ledgerCSV(c) {
  const rows = [['تاریخ', 'نوع', 'عضو', 'نوبت', 'مبلغ (تومان)', 'توضیح']];
  const nm = (id) => memberById(c, id)?.name || id;
  for (const e of (c.ledger || [])) {
    rows.push([new Date(e.at).toLocaleString('fa-IR'), e.kind === 'pay' ? 'واریز' : 'برداشت', nm(e.memberId), e.round || '-', String(e.amount), (e.note || '').replace(/,/g, '؛')]);
  }
  return '﻿' + rows.map((r) => r.join(',')).join('\n');
}
