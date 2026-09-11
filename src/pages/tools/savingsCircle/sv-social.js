// 💬 ViXoRa Savings Social — چت، دایرکت، نظرسنجی، پیشنهاد
// src/pages/tools/savingsCircle/sv-social.js
import { newId, audit, notify, memberById } from './sv-store.js';

function mustMember(c, memberId) {
  const m = memberById(c, memberId);
  if (!m || m.active === false) return { ok: false, error: 'عضو فعالی نیستی.' };
  if (!m.approved) return { ok: false, error: 'عضویتت هنوز تایید نشده.' };
  return { ok: true, m };
}
const clean = (t, n = 1000) => String(t || '').trim().slice(0, n);

/* ---------- چت عمومی (بدون حذف — همه‌چیز می‌ماند) ---------- */
export function postChat(c, memberId, text) {
  const chk = mustMember(c, memberId);
  if (!chk.ok) return chk;
  text = clean(text, 1000);
  if (!text) return { ok: false, error: 'متن خالی است.' };
  c.chat.push({ id: newId('c'), at: Date.now(), kind: 'msg', fromId: memberId, fromName: chk.m.name, text });
  c.chat = c.chat.slice(-1000);
  return { ok: true };
}
/* ---------- دایرکت با مدیر ---------- */
export function postDM(c, fromId, text) {
  const chk = mustMember(c, fromId);
  if (!chk.ok) return chk;
  text = clean(text, 1000);
  if (!text) return { ok: false, error: 'متن خالی است.' };
  const admin = (c.members || []).find((m) => m.isAdmin && m.active !== false);
  if (!admin) return { ok: false, error: 'مدیر پیدا نشد.' };
  const toId = chk.m.isAdmin ? null : admin.id; // مدیر با انتخاب گیرنده می‌فرستد
  c.dm.push({ id: newId('d'), at: Date.now(), fromId, toId, text });
  c.dm = c.dm.slice(-1000);
  if (!chk.m.isAdmin) notify(c, 'admin', `💌 پیام خصوصی از ${chk.m.name}`, 'chat');
  return { ok: true };
}
export function postDMByAdmin(c, adminMember, toMemberId, text) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  const t = memberById(c, toMemberId);
  if (!t) return { ok: false, error: 'گیرنده پیدا نشد.' };
  text = clean(text, 1000);
  if (!text) return { ok: false, error: 'متن خالی است.' };
  c.dm.push({ id: newId('d'), at: Date.now(), fromId: adminMember.id, toId: toMemberId, text });
  c.dm = c.dm.slice(-1000);
  notify(c, toMemberId, '💌 پیام خصوصی جدید از مدیر داری', 'chat');
  return { ok: true };
}
/** مکالمه خصوصی یک عضو با مدیر */
export function dmThread(c, memberId) {
  const admin = (c.members || []).find((m) => m.isAdmin);
  const aid = admin?.id;
  return (c.dm || []).filter((d) =>
    (String(d.fromId) === String(memberId) && (!d.toId || String(d.toId) === String(aid))) ||
    (String(d.fromId) === String(aid) && String(d.toId) === String(memberId)));
}

/* ---------- نظرسنجی ---------- */
export function createPoll(c, adminMember, q, opts, days = 3) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  q = clean(q, 200);
  opts = (opts || []).map((o) => clean(o, 80)).filter(Boolean).slice(0, 6);
  if (!q) return { ok: false, error: 'سؤال خالی است.' };
  if (opts.length < 2) return { ok: false, error: 'حداقل ۲ گزینه لازم است.' };
  const p = {
    id: newId('p'), q, opts: opts.map((t) => ({ t, v: [] })),
    by: adminMember.id, at: Date.now(), until: Date.now() + Math.min(30, Math.max(1, Number(days) || 3)) * 864e5, open: true,
  };
  c.polls.unshift(p);
  audit(c, adminMember.name, 'poll.create', q);
  notify(c, 'all', `📊 نظرسنجی جدید: «${q}»`, 'polls');
  return { ok: true, poll: p };
}
export function votePoll(c, pollId, memberId, optIdx) {
  const chk = mustMember(c, memberId);
  if (!chk.ok) return chk;
  const p = (c.polls || []).find((x) => x.id === pollId);
  if (!p || !p.open || Date.now() > p.until) return { ok: false, error: 'نظرسنجی بسته است.' };
  if (!(optIdx >= 0 && optIdx < p.opts.length)) return { ok: false, error: 'گزینه نامعتبر.' };
  for (const o of p.opts) o.v = (o.v || []).filter((v) => String(v) !== String(memberId)); // یک رأی (قابل تغییر)
  p.opts[optIdx].v.push(String(memberId));
  return { ok: true };
}
export function closePoll(c, pollId, adminMember) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  const p = (c.polls || []).find((x) => x.id === pollId);
  if (!p) return { ok: false, error: 'پیدا نشد.' };
  p.open = false;
  const win = [...p.opts].sort((a, b) => (b.v?.length || 0) - (a.v?.length || 0))[0];
  audit(c, adminMember.name, 'poll.close', `${p.q} ← برنده: ${win?.t}`);
  const msg = `📊 نتیجه نظرسنجی «${p.q}»: 🏆 ${win?.t} (${(win?.v || []).length} رأی)`;
  c.chat.push({ id: newId('c'), at: Date.now(), kind: 'announce', text: msg });
  notify(c, 'all', msg, 'polls');
  return { ok: true };
}

/* ---------- پیشنهادها ---------- */
export function postIdea(c, memberId, text) {
  const chk = mustMember(c, memberId);
  if (!chk.ok) return chk;
  text = clean(text, 500);
  if (!text) return { ok: false, error: 'متن خالی است.' };
  const mine = (c.ideas || []).filter((i) => String(i.memberId) === String(memberId) && Date.now() - i.at < 864e5).length;
  if (mine >= 5) return { ok: false, error: 'امروز ۵ پیشنهاد دادی! فردا دوباره. 🙂' }; // ضد اسپم
  c.ideas.unshift({ id: newId('i'), memberId, text, at: Date.now(), votes: [], status: 'new' });
  notify(c, 'admin', `💡 پیشنهاد جدید از ${chk.m.name}`, 'polls');
  return { ok: true };
}
export function voteIdea(c, ideaId, memberId) {
  const chk = mustMember(c, memberId);
  if (!chk.ok) return chk;
  const i = (c.ideas || []).find((x) => x.id === ideaId);
  if (!i) return { ok: false, error: 'پیدا نشد.' };
  const id = String(memberId);
  i.votes = i.votes || [];
  if (i.votes.includes(id)) i.votes = i.votes.filter((v) => v !== id); // toggle
  else i.votes.push(id);
  return { ok: true };
}
export function setIdeaStatus(c, ideaId, adminMember, status) {
  if (!adminMember?.isAdmin) return { ok: false, error: 'فقط مدیر.' };
  const i = (c.ideas || []).find((x) => x.id === ideaId);
  if (!i) return { ok: false, error: 'پیدا نشد.' };
  if (!['new', 'review', 'accepted', 'rejected'].includes(status)) return { ok: false, error: 'وضعیت نامعتبر.' };
  i.status = status;
  audit(c, adminMember.name, 'idea.status', `${i.text.slice(0, 60)} ← ${status}`);
  notify(c, i.memberId, `💡 پیشنهادت «${status === 'accepted' ? 'قبول' : status === 'rejected' ? 'رد' : 'در حال بررسی'}» شد`, 'polls');
  return { ok: true };
}
