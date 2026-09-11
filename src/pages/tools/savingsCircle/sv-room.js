// 🏠 ViXoRa Savings Room — اتاق صندوق: ۸ تب + اکشن‌ها
// src/pages/tools/savingsCircle/sv-room.js
import { faNum, fmtMoney, maskPhone, memberById, audit, notify, verifyChain, myMember, isAdmin, hashPin, verifyPin, saveCircle, getCircle, exportPackage } from './sv-store.js';
import { currentRound, roundLabel, daysToDue, memberTotals, roundPaid, roundPending, submitClaim, cancelClaim, approveClaim, rejectClaim, recordPayout, poolAudit, reliability, settlement, ledgerCSV, roundComplete } from './sv-finance.js';
import { eligible, drawLots, replayDraw, assignManual, clearSlot } from './sv-lottery.js';
import { postChat, postDM, postDMByAdmin, dmThread, createPoll, votePoll, closePoll, postIdea, voteIdea, setIdeaStatus } from './sv-social.js';

export const TABS = [
  ['home', '🏠 صندوق'], ['finance', '💸 مالی'], ['lottery', '🎲 قرعه‌کشی'], ['chat', '💬 چت'],
  ['polls', '📊 نظر'], ['members', '👥 اعضا'], ['notifs', '🔔 اعلان‌ها'], ['settings', '⚙️ تنظیمات'],
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function avatar(name, id) {
  const h = [...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const g = [['#059669', '#0ea5e9'], ['#7c3aed', '#ec4899'], ['#b45309', '#f59e0b'], ['#0ea5e9', '#6366f1'], ['#e11d48', '#f97316']][h % 5];
  return `<span class="sv-avatar" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${esc((name || '?').trim()[0] || '?')}</span>`;
}
function ring(pct, size = 54, label = '') {
  const r = (size - 8) / 2, cf = (2 * Math.PI * r).toFixed(1), off = (cf * (1 - Math.min(100, Math.max(0, pct)) / 100)).toFixed(1);
  const col = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185';
  return `<svg class="sv-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="6"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${cf}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" dy="4" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">${label || faNum(pct)}</text></svg>`;
}
export function parseMoney(v) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const en = String(v || '').replace(/[۰-۹]/g, (d) => fa.indexOf(d)).replace(/[^\d]/g, '');
  return Math.trunc(Number(en) || 0);
}
const slotOf = (c, mid) => (c.queue || []).find((q) => String(q.memberId) === String(mid));

/* ================= بدنه اتاق ================= */
export function renderRoom(ctx) {
  const { c, me, admin, tab, A } = ctx;
  const pa = poolAudit(c);
  const cr = currentRound(c);
  const due = daysToDue(c);
  const dueChip = due == null ? '' : due < 0 ? `<span class="sv-pill" style="color:var(--bad);border-color:var(--bad)">⏰ ${faNum(-due)} روز معوق!</span>` : due === 0 ? `<span class="sv-pill" style="color:var(--warn);border-color:var(--warn)">⏰ امروز مهلت!</span>` : `<span class="sv-pill">⏰ ${faNum(due)} روز تا مهلت</span>`;
  const pct = pa.expected ? Math.round((pa.collected / pa.expected) * 100) : 0;
  const badges = roomBadges(ctx);
  return `
  <div class="sv-head sv-in"><button class="sv-btn sm" data-act="back-list">→ همه صندوق‌ها</button>
    <div><h1>💰 ${esc(c.name)} ${c.status === 'forming' ? '<span class="sv-pill">در حال شکل‌گیری</span>' : ''}</h1>
    <p>کد: <b style="user-select:all" dir="ltr">${esc(c.code)}</b> • ماهانه ${fmtMoney(c.monthlyDue)} • ${faNum(c.months)} ماه • مهلت ${faNum(c.dueDay)}م ${dueChip} ${admin ? '• 👑 مدیر' : ''}</p></div></div>
  <div class="sv-grid sv-in sv-in-1">
    <div class="sv-stat"><b class="sv-count" data-count="${pa.collected}" data-money="1">۰</b><span>💰 جمع‌آوری‌شده</span></div>
    <div class="sv-stat"><b class="sv-count" data-count="${pa.expected}" data-money="1">۰</b><span>🎯 انتظار تا امروز</span></div>
    <div class="sv-stat"><b>${faNum(pa.activeMembers)} نفر</b><span>👥 اعضای فعال</span></div>
    <div class="sv-stat"><b style="font-size:15px">${esc(roundLabel(c, cr))}</b><span>📌 نوبت جاری (${faNum(cr)} از ${faNum(c.months)})</span></div>
    <div class="sv-stat"><b>${faNum(Math.min(100, pct))}٪</b><span>📊 درصد تسویه</span></div>
  </div>
  <nav class="sv-tabs sv-in sv-in-2">${TABS.map(([id, t]) => `<button class="sv-tab ${tab === id ? 'on' : ''}" data-rtab="${id}">${t}${badges[id] ? `<span class="sv-badge">${faNum(badges[id])}</span>` : ''}</button>`).join('')}</nav>
  <div data-room-body>${renderTab(ctx)}</div>`;
}

function roomBadges(ctx) {
  const { c, me, admin } = ctx;
  const b = {};
  if (me) {
    const un = (c.notifs || []).filter((n) => (n.to === 'all' || String(n.to) === String(me.id) || (n.to === 'admin' && admin)) && !(n.readBy || []).includes(String(me.id))).length;
    if (un) b.notifs = un;
  }
  if (admin) {
    const pc = (c.claims || []).filter((x) => x.status === 'pending').length;
    if (pc) b.finance = pc;
    if ((c.pending || []).length) b.members = (c.pending || []).length;
  }
  return b;
}

function renderTab(ctx) {
  const t = ctx.tab;
  if (t === 'finance') return tabFinance(ctx);
  if (t === 'lottery') return tabLottery(ctx);
  if (t === 'chat') return tabChat(ctx);
  if (t === 'polls') return tabPolls(ctx);
  if (t === 'members') return tabMembers(ctx);
  if (t === 'notifs') return tabNotifs(ctx);
  if (t === 'settings') return tabSettings(ctx);
  return tabHome(ctx);
}

/* ---------- خانه ---------- */
function tabHome(ctx) {
  const { c, me, admin } = ctx;
  const cr = currentRound(c);
  let myCard = '';
  if (me) {
    const t = memberTotals(c, me.id);
    const r = reliability(c, me.id);
    const slot = slotOf(c, me.id);
    myCard = `<div class="sv-panel sv-in"><h3>🙋 کارت من</h3><div class="sv-grid">
      <div class="sv-stat"><b>${fmtMoney(t.remaining)}</b><span>بدهی تا امروز</span></div>
      <div class="sv-stat"><b>${fmtMoney(t.paid)}</b><span>پرداخت تاییدشده</span></div>
      <div class="sv-stat"><b>${fmtMoney(t.pending)}</b><span>در انتظار تایید</span></div>
      <div class="sv-stat"><b>${fmtMoney(t.credit)}</b><span>اعتبار اضافه‌پرداخت</span></div>
      <div class="sv-stat"><b>${slot ? esc(roundLabel(c, slot.round)) : '—'}</b><span>🎰 نوبت برداشت من</span></div>
      <div class="sv-stat"><span>🏆 خوش‌قولی</span><div style="margin-top:4px">${ring(r.score, 58)}</div></div>
    </div></div>`;
  }
  const board = (c.members || []).filter((m) => m.active !== false && m.approved)
    .map((m) => ({ m, r: reliability(c, m.id) })).sort((a, b) => b.r.score - a.r.score).slice(0, 5);
  const tl = [];
  for (let r = 1; r <= c.months; r++) {
    const q = (c.queue || []).find((x) => Number(x.round) === r);
    const paid = (c.payouts || []).some((p) => Number(p.round) === r);
    const w = q ? memberById(c, q.memberId) : null;
    tl.push(`<div class="sv-tl-item ${paid ? 'done' : r === cr ? 'now' : ''}"><div class="sv-tl-n">${paid ? '✓' : faNum(r)}</div>
      <div class="sv-tl-card"><b>${esc(roundLabel(c, r))}</b>
      <small>${paid ? `✅ پرداخت شد به ${esc(w?.name || '?')}` : w ? `🎰 ${esc(w.name)} ${q.method === 'admin-first' ? '👑 (قانون صندوق)' : q.method === 'lottery' ? '(قرعه‌کشی 🎲)' : '(دستی ✍️)'}` : '⬜ هنوز قرعه‌کشی نشده'}</small></div></div>`);
  }
  return `${myCard}
  <div class="sv-2col"><div class="sv-panel sv-in sv-in-1"><h3>🏆 تابلوی خوش‌قولی</h3>
    ${board.map(({ m, r }, i) => `<div class="sv-member">${avatar(m.name, m.id)}<div class="sv-mi"><b>${['🥇', '🥈', '🥉', '۴.', '۵.'][i]} ${esc(m.name)}</b><small>${faNum(r.ontime)} به‌موقع • ${faNum(r.late)} دیرکرد</small></div>${ring(r.score, 46)}</div>`).join('') || '<div class="sv-empty">عضوی نیست.</div>'}</div>
  <div class="sv-panel sv-in sv-in-2"><h3>🎰 صف برنده‌ها (${faNum((c.queue || []).length)} از ${faNum(c.months)} نوبت)</h3><div class="sv-tl">${tl.join('')}</div></div></div>`;
}

/* ---------- مالی ---------- */
function tabFinance(ctx) {
  const { c, me, admin, A } = ctx;
  let h = '';
  if (me && !admin) h += financeMine(ctx);
  if (me && admin) h += financeMine(ctx);
  if (admin) h += financeAdmin(ctx);
  if (!me && !admin) h += `<div class="sv-note">برای استفاده از بخش مالی باید عضو صندوق باشی.</div>`;
  return h;
}
function financeMine(ctx) {
  const { c, me } = ctx;
  const t = memberTotals(c, me.id);
  const rows = [];
  for (let r = 1; r <= Math.min(currentRound(c), c.months); r++) {
    const paid = roundPaid(c, me.id, r), pend = roundPending(c, me.id, r);
    const st = paid >= c.monthlyDue ? '<span class="sv-cell-ok">✅ تسویه</span>' : pend > 0 ? '<span class="sv-cell-part">⏳ در انتظار</span>' : '<span class="sv-cell-no">❌ بدهکار</span>';
    rows.push(`<tr><td>${esc(roundLabel(c, r))}</td><td>${faNum(c.monthlyDue)}</td><td>${faNum(paid)}</td><td>${faNum(pend)}</td><td>${faNum(Math.max(0, c.monthlyDue - paid))}</td><td>${st}</td></tr>`);
  }
  const unpaid = [];
  for (let r = 1; r <= c.months; r++) if (roundPaid(c, me.id, r) < c.monthlyDue) unpaid.push(r);
  const defR = unpaid[0] || currentRound(c);
  const myClaims = (c.claims || []).filter((x) => String(x.memberId) === String(me.id)).slice(0, 8);
  return `<div class="sv-panel sv-in"><h3>💸 ثبت واریز (قسطی هم میشه! حداقل ${fmtMoney(c.minPartial)})</h3>
    ${!me.verified ? `<div class="sv-warn">⚠️ مشخصاتت تغییر کرده و در انتظار تایید مجدد مدیر است. فعلاً نمی‌تونی واریز ثبت کنی.</div>` : `
    <div class="sv-grid2"><div class="sv-field"><label>نوبت<select data-f="cl-round">${unpaid.map((r) => `<option value="${r}" ${r === defR ? 'selected' : ''}>${esc(roundLabel(c, r))} — مانده ${faNum(Math.max(0, c.monthlyDue - roundPaid(c, me.id, r)))}</option>`).join('')}</select></label></div>
    <div class="sv-field"><label>مبلغ (تومان)<input data-f="cl-amount" inputmode="numeric" placeholder="مثلاً ۵۰۰٬۰۰۰" /></label></div></div>
    <div class="sv-row"><span class="sv-hint">سریع:</span>${[50000, 100000, 200000, 500000].map((v) => `<button class="sv-btn sm" data-amt="${v}">${faNum(v)}</button>`).join('')}<button class="sv-btn sm" data-amt="rest">کل مانده این نوبت</button></div>
    <div class="sv-grid2" style="margin-top:8px"><div class="sv-field"><label>🧾 عکس فیش (اختیاری ولی مطمئن‌تر)<input type="file" data-f="cl-receipt" accept="image/*" /></label></div>
    <div class="sv-field"><label>توضیح<input data-f="cl-note" maxlength="200" placeholder="مثلاً: کارت به کارت شبانه" /></label></div></div>
    <div class="sv-row"><button class="sv-btn primary" data-act="claim-submit">📤 ثبت واریز (نیازمند پین)</button>
    <span class="sv-hint">بعد از ثبت، مدیر تایید می‌کند و از بدهیت کم می‌شود.</span></div>`}
  </div>
  <div class="sv-2col"><div class="sv-panel sv-in sv-in-1"><h3>📋 اقساط من تا امروز</h3><div class="sv-table-wrap"><table class="sv-table"><tr><th>نوبت</th><th>مبلغ</th><th>پرداخت</th><th>انتظار</th><th>مانده</th><th>وضعیت</th></tr>${rows.join('')}</table></div>
  <div class="sv-note">جمع بدهی: <b>${fmtMoney(t.remaining)}</b> • اعتبار اضافه‌پرداخت: <b>${fmtMoney(t.credit)}</b></div></div>
  <div class="sv-panel sv-in sv-in-2"><h3>🧾 آخرین ادعاهای من</h3>${myClaims.map((x) => `<div class="sv-claim"><span class="sv-amt">${faNum(x.amount)}</span><span class="sv-hint">${esc(roundLabel(c, x.round))} • ${new Date(x.at).toLocaleDateString('fa-IR')}</span>
    ${x.receipt ? `<img class="sv-receipt" src="${x.receipt}" data-receipt="${x.id}" alt="فیش" />` : ''}
    <span class="sv-pill">${x.status === 'pending' ? '⏳ در انتظار' : x.status === 'approved' ? '✅ تایید' : x.status === 'rejected' ? '❌ رد' : '🚫 لغو'}</span>
    ${x.status === 'rejected' && x.decideNote ? `<small class="sv-hint">علت: ${esc(x.decideNote)}</small>` : ''}
    ${x.status === 'pending' ? `<button class="sv-btn sm danger" data-cancel-claim="${x.id}">لغو</button>` : ''}</div>`).join('') || '<div class="sv-empty">هنوز واریزی ثبت نکردی.</div>'}</div></div>`;
}
function financeAdmin(ctx) {
  const { c } = ctx;
  const pa = poolAudit(c);
  const pend = (c.claims || []).filter((x) => x.status === 'pending');
  const el = Math.min(currentRound(c), c.months);
  const act = (c.members || []).filter((m) => m.active !== false && m.approved);
  const head = `<tr><th>عضو</th>${Array.from({ length: el }, (_, i) => `<th>${faNum(i + 1)}</th>`).join('')}<th>جمع</th></tr>`;
  const body = act.map((m) => {
    let sum = 0;
    const tds = Array.from({ length: el }, (_, i) => {
      const r = i + 1, p = roundPaid(c, m.id, r);
      sum += p;
      const cls = p >= c.monthlyDue ? 'sv-cell-ok' : p > 0 ? 'sv-cell-part' : 'sv-cell-no';
      const ic = p >= c.monthlyDue ? '✅' : p > 0 ? '◐' : '—';
      return `<td class="${cls}" title="${faNum(p)}">${ic}</td>`;
    }).join('');
    return `<tr><td>${esc(m.name)}</td>${tds}<td>${faNum(sum)}</td></tr>`;
  }).join('');
  const unpayout = (c.queue || []).filter((q) => !(c.payouts || []).some((p) => Number(p.round) === Number(q.round)));
  return `<div class="sv-panel sv-in"><h3>🧾 صف تایید واریزها (${faNum(pend.length)})</h3>
    ${pend.map((x) => { const m = memberById(c, x.memberId); return `<div class="sv-claim">${avatar(m?.name, m?.id)}<div style="flex:1;min-width:150px"><b>${esc(m?.name)}</b> <span class="sv-amt">${fmtMoney(x.amount)}</span><br><small class="sv-hint">${esc(roundLabel(c, x.round))} • ${new Date(x.at).toLocaleString('fa-IR')}${x.note ? ' • ' + esc(x.note) : ''}</small></div>
    ${x.receipt ? `<img class="sv-receipt" src="${x.receipt}" data-receipt="${x.id}" alt="فیش" />` : '<small class="sv-hint">بدون فیش</small>'}
    <button class="sv-btn sm primary" data-approve="${x.id}">✅ تایید</button><button class="sv-btn sm danger" data-reject="${x.id}">❌ رد</button></div>`; }).join('') || '<div class="sv-empty">صف خالیه، همه‌چیز روبراهه! 🎉</div>'}</div>
  <div class="sv-panel sv-in sv-in-1"><h3>💰 ثبت برداشت برنده</h3>
    ${unpayout.map((q) => { const w = memberById(c, q.memberId); return `<div class="sv-claim"><b>${esc(roundLabel(c, q.round))}</b><span>🎰 ${esc(w?.name)}</span><span class="sv-hint">مبلغ پیش‌فرض صندوق: ${fmtMoney(c.monthlyDue * Math.max(1, act.length))}</span><button class="sv-btn sm gold" data-payout="${q.round}">💰 ثبت پرداخت</button></div>`; }).join('') || '<div class="sv-empty">نوبت پرداخت‌نشده‌ای نیست.</div>'}</div>
  <div class="sv-panel sv-in sv-in-2"><h3>🧮 ماتریس تسویه (نوبت‌های ۱ تا ${faNum(el)})</h3><div class="sv-table-wrap"><table class="sv-table">${head}${body}</table></div></div>
  <div class="sv-panel sv-in sv-in-3"><h3>🛡 حسابرسی خودکار</h3>
    <div class="sv-grid"><div class="sv-stat"><b>${fmtMoney(pa.expected)}</b><span>انتظار</span></div><div class="sv-stat"><b>${fmtMoney(pa.collected)}</b><span>جمع تاییدشده</span></div><div class="sv-stat"><b>${fmtMoney(pa.pending)}</b><span>در انتظار</span></div><div class="sv-stat"><b>${fmtMoney(pa.paidOut)}</b><span>پرداخت به برنده‌ها</span></div><div class="sv-stat"><b>${fmtMoney(pa.balance)}</b><span>موجودی نزد مدیر</span></div></div>
    ${pa.errors.length ? `<div class="sv-danger-note">⚠️ ${faNum(pa.errors.length)} مغایرت:<br>${pa.errors.map(esc).join('<br>')}</div>` : `<div class="sv-note">✅ دفاتر ترازن؛ هیچ مغایرتی نیست.</div>`}
    <div class="sv-row"><button class="sv-btn sm" data-act="dl-csv">📥 خروجی اکسل (CSV)</button><button class="sv-btn sm" data-act="verify-chain">🔗 بررسی زنجیره حسابرسی</button></div></div>`;
}

/* ---------- قرعه‌کشی ---------- */
function tabLottery(ctx) {
  const { c, admin } = ctx;
  const paidRounds = new Set((c.payouts || []).map((p) => Number(p.round)));
  const free = [];
  for (let r = 1; r <= c.months; r++) if (!paidRounds.has(r)) free.push(r);
  const el = eligible(c);
  const tumbler = admin ? `<div class="sv-panel sv-in"><h3>🎲 قرعه‌کشی سیستمی (قابل راستی‌آزمایی)</h3>
    <div class="sv-hint">نوبت‌ها را انتخاب کن (از ۱ نوبت تا همه ${faNum(free.length)} نوبت آزاد). واجدین: ${faNum(el.length)} نفر (فعال، تاییدشده، بدون نوبت).</div>
    <div class="sv-checks" style="margin:10px 0">${free.map((r) => { const q = (c.queue || []).find((x) => Number(x.round) === r); return `<label class="sv-check"><input type="checkbox" data-draw-r="${r}" /> ${esc(roundLabel(c, r))}${q ? ' (پر — قرعه مجدد)' : ''}</label>`; }).join('')}</div>
    <div class="sv-row"><button class="sv-btn sm" data-act="draw-all">✅ انتخاب همه آزادها</button><button class="sv-btn gold" data-act="draw-go">🎲 اجرای قرعه‌کشی (نیازمند پین)</button></div>
    <div class="sv-note">🔒 سید عمومی هر قرعه‌کشی ثبت و اعلام می‌شود؛ هر عضوی می‌تواند با «بازپخش» همان نتیجه را بگیرد. قرعه مجدد هم با برچسب قرمز ثبت می‌شود.</div></div>
  <div class="sv-panel sv-in sv-in-1"><h3>✍️ ثبت دستی نوبت (قرعه بیرون از سایت)</h3>
    <div class="sv-grid2"><div class="sv-field"><label>نوبت<select data-f="man-round">${free.filter((r) => { const q = (c.queue || []).find((x) => Number(x.round) === r); return !q || q.method !== 'admin-first'; }).map((r) => `<option value="${r}">${esc(roundLabel(c, r))}</option>`).join('')}</select></label></div>
    <div class="sv-field"><label>برنده<select data-f="man-member">${el.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('') || '<option value="">— واجدی نیست —</option>'}</select></label></div></div>
    <div class="sv-row"><button class="sv-btn violet" data-act="man-go">📌 ثبت در صف (نیازمند پین)</button></div></div>` : '';
  const slots = [];
  for (let r = 1; r <= c.months; r++) {
    const q = (c.queue || []).find((x) => Number(x.round) === r);
    const paid = paidRounds.has(r);
    const w = q ? memberById(c, q.memberId) : null;
    slots.push(`<div class="sv-claim"><b>${esc(roundLabel(c, r))}</b>
      ${w ? `<span>🎰 ${esc(w.name)}</span><span class="sv-pill">${q.method === 'admin-first' ? '👑 قانون صندوق' : q.method === 'lottery' ? '🎲 سیستمی' : '✍️ دستی'}</span>${paid ? '<span class="sv-pill">✅ پرداخت شد</span>' : ''}` : '<span class="sv-hint">⬜ خالی</span>'}
      ${admin && q && !paid && q.method !== 'admin-first' ? `<button class="sv-btn sm danger" data-clear-slot="${r}">خالی کردن</button>` : ''}</div>`);
  }
  const draws = [...(c.draws || [])].reverse().map((d) => `<div class="sv-claim"><span>🎲 ${d.redraw ? '<b style="color:var(--bad)">قرعه مجدد</b>' : 'قرعه‌کشی'}</span><small class="sv-hint">نوبت‌ها: ${d.rounds.map((r) => esc(roundLabel(c, r))).join('، ')} • سید: <span dir="ltr">${esc(String(d.seed).slice(-12))}</span> • ${new Date(d.at).toLocaleDateString('fa-IR')}</small><button class="sv-btn sm" data-replay="${d.id}">🔁 بازپخش و راستی‌آزمایی</button></div>`).join('');
  return `${tumbler}<div class="sv-panel sv-in sv-in-2"><h3>📋 همه نوبت‌ها</h3>${slots.join('')}</div>
  <div class="sv-panel sv-in sv-in-3"><h3>🗂 تاریخچه قرعه‌کشی‌ها</h3>${draws || '<div class="sv-empty">هنوز قرعه‌کشی نشده.</div>'}</div>`;
}

/* ---------- چت ---------- */
function tabChat(ctx) {
  const { c, me, admin, sub } = ctx;
  const s = sub || 'public';
  const adminM = (c.members || []).find((m) => m.isAdmin && m.active !== false);
  let body = '';
  if (s === 'public') {
    const msgs = (c.chat || []).slice(-80).map((m) => m.kind === 'announce'
      ? `<div class="sv-announce">📢 ${esc(m.text)}<br><small class="sv-hint">${new Date(m.at).toLocaleString('fa-IR')} — غیرقابل حذف 🔒</small></div>`
      : `<div class="sv-msg ${me && String(m.fromId) === String(me.id) ? 'me' : ''}"><b>${esc(m.fromName || '')}</b><br>${esc(m.text)}<small>${new Date(m.at).toLocaleString('fa-IR')}</small></div>`).join('');
    body = `<div class="sv-chat" data-chatbox>${msgs || '<div class="sv-empty">هنوز پیامی نیست. سلام کن! 👋</div>'}</div>
    <div class="sv-chatbar"><input data-f="chat-in" maxlength="1000" placeholder="بنویس... (Enter = ارسال)" /><button class="sv-btn primary" data-act="chat-send">📤</button></div>
    <div class="sv-hint">🔒 پیام‌ها و اعلام‌ها حذف نمی‌شوند — حافظه شفاف صندوق.</div>`;
  } else if (!admin) {
    const th = me ? dmThread(c, me.id) : [];
    body = `<div class="sv-chat" data-chatbox>${th.map((d) => `<div class="sv-msg ${me && String(d.fromId) === String(me.id) ? 'me' : ''}">${esc(d.text)}<small>${new Date(d.at).toLocaleString('fa-IR')}</small></div>`).join('') || '<div class="sv-empty">گفتگوی خصوصی با مدیر. سوالت را بپرس! 💌</div>'}</div>
    <div class="sv-chatbar"><input data-f="dm-in" maxlength="1000" placeholder="پیام خصوصی به مدیر..." /><button class="sv-btn primary" data-act="dm-send">📤</button></div>`;
  } else {
    const sel = ctx.dmWith || '';
    const list = (c.members || []).filter((m) => !m.isAdmin && m.active !== false);
    const th = sel ? dmThread(c, sel) : [];
    const unreadM = new Set((c.dm || []).filter((d) => !d.toId || String(d.fromId) !== String(adminM?.id)).map((d) => String(d.fromId)));
    body = `<div class="sv-field"><label>گفتگو با<select data-f="dm-with"><option value="">— انتخاب عضو —</option>${list.map((m) => `<option value="${m.id}" ${sel === m.id ? 'selected' : ''}>${unreadM.has(String(m.id)) ? '💌 ' : ''}${esc(m.name)}</option>`).join('')}</select></label></div>
    ${sel ? `<div class="sv-chat" data-chatbox>${th.map((d) => `<div class="sv-msg ${String(d.fromId) === String(adminM?.id) ? 'me' : ''}">${esc(d.text)}<small>${new Date(d.at).toLocaleString('fa-IR')}</small></div>`).join('') || '<div class="sv-empty">هنوز پیامی نیست.</div>'}</div>
    <div class="sv-chatbar"><input data-f="dm-in" maxlength="1000" placeholder="پاسخ به ${esc(memberById(c, sel)?.name)}..." /><button class="sv-btn primary" data-act="dm-send-admin">📤</button></div>` : '<div class="sv-empty">یک عضو را انتخاب کن.</div>'}`;
  }
  return `<div class="sv-panel sv-in"><div class="sv-row" style="margin:0 0 10px"><button class="sv-btn sm ${s === 'public' ? 'primary' : ''}" data-sub="public">📢 چت عمومی</button><button class="sv-btn sm ${s === 'dm' ? 'primary' : ''}" data-sub="dm">💌 خصوصی با مدیر</button></div>${body}</div>`;
}

/* ---------- نظرسنجی و پیشنهاد ---------- */
function tabPolls(ctx) {
  const { c, me, admin } = ctx;
  const polls = (c.polls || []).map((p) => {
    const total = p.opts.reduce((a, o) => a + (o.v?.length || 0), 0);
    const live = p.open && Date.now() < p.until;
    return `<div class="sv-poll"><h4>📊 ${esc(p.q)} ${live ? `<span class="sv-pill">🟢 باز تا ${new Date(p.until).toLocaleDateString('fa-IR')}</span>` : '<span class="sv-pill">🔴 بسته</span>'}</h4>
    ${p.opts.map((o, i) => { const n = (o.v || []).length; const pct = total ? Math.round((n / total) * 100) : 0; const mine = me && (o.v || []).includes(String(me.id));
      return live && me ? `<button class="sv-opt ${mine ? 'voted' : ''}" data-vote="${p.id}:${i}"><i style="width:${pct}%"></i><b>${mine ? '✅ ' : ''}${esc(o.t)} — ${faNum(n)} رأی (${faNum(pct)}٪)</b></button>`
        : `<div class="sv-opt ${mine ? 'voted' : ''}"><i style="width:${pct}%"></i><b>${esc(o.t)} — ${faNum(n)} رأی (${faNum(pct)}٪)</b></div>`; }).join('')}
    ${admin && live ? `<button class="sv-btn sm danger" data-close-poll="${p.id}">بستن و اعلام نتیجه</button>` : ''}</div>`;
  }).join('');
  const ideas = (c.ideas || []).map((i) => { const m = memberById(c, i.memberId); const mine = me && (i.votes || []).includes(String(me.id));
    const pill = i.status === 'accepted' ? '<span class="sv-pill accepted">✅ قبول</span>' : i.status === 'rejected' ? '<span class="sv-pill rejected">❌ رد</span>' : i.status === 'review' ? '<span class="sv-pill review">👀 در حال بررسی</span>' : '<span class="sv-pill">🆕 جدید</span>';
    return `<div class="sv-idea">💡 ${esc(i.text)}<br><small>از ${esc(m?.name)} • ${new Date(i.at).toLocaleDateString('fa-IR')} ${pill}</small>
    <div class="sv-row">${me ? `<button class="sv-btn sm ${mine ? 'primary' : ''}" data-idea-vote="${i.id}">👍 ${faNum((i.votes || []).length)}</button>` : `<span class="sv-hint">👍 ${faNum((i.votes || []).length)}</span>`}
    ${admin ? `<select data-idea-status="${i.id}">${[['new', 'جدید'], ['review', 'در حال بررسی'], ['accepted', 'قبول ✅'], ['rejected', 'رد ❌']].map(([v, t]) => `<option value="${v}" ${i.status === v ? 'selected' : ''}>${t}</option>`).join('')}</select>` : ''}</div></div>`; }).join('');
  return `${admin ? `<div class="sv-panel sv-in"><h3>📊 نظرسنجی جدید</h3><div class="sv-grid2"><div class="sv-field"><label>سؤال<input data-f="poll-q" maxlength="200" /></label></div><div class="sv-field"><label>مدت (روز)<input data-f="poll-days" inputmode="numeric" value="۳" /></label></div></div><div class="sv-field"><label>گزینه‌ها (هر خط یکی، ۲ تا ۶ تا)<textarea data-f="poll-opts" rows="3"></textarea></label></div><button class="sv-btn violet" data-act="poll-create">📊 انتشار (نیازمند پین)</button></div>` : ''}
  <div class="sv-2col"><div><h3 style="font-size:14px">📊 نظرسنجی‌ها</h3>${polls || '<div class="sv-empty">نظرسنجی نیست.</div>'}</div>
  <div><h3 style="font-size:14px">💡 پیشنهادها</h3>
  ${me ? `<div class="sv-chatbar" style="margin:0 0 10px"><input data-f="idea-in" maxlength="500" placeholder="پیشنهادت..." /><button class="sv-btn primary" data-act="idea-send">📤</button></div>` : ''}
  ${ideas || '<div class="sv-empty">پیشنهادی نیست.</div>'}</div></div>`;
}

/* ---------- اعضا ---------- */
function tabMembers(ctx) {
  const { c, me, admin } = ctx;
  const pend = (c.pending || []).map((p) => `<div class="sv-claim">${avatar(p.name, p.id)}<div style="flex:1"><b>${esc(p.name)}</b><br><small class="sv-hint">📞 ${esc(p.phone)}${p.nat4 ? ` • ۴ رقم آخر ملی: ${esc(p.nat4)}` : ''} • ${new Date(p.at).toLocaleDateString('fa-IR')}</small></div>
    ${admin ? `<button class="sv-btn sm primary" data-approve-join="${p.id}">✅ تایید عضویت</button><button class="sv-btn sm danger" data-reject-join="${p.id}">❌ رد</button>` : '<span class="sv-pill">⏳ در انتظار تایید مدیر</span>'}</div>`).join('');
  const mems = (c.members || []).map((m) => {
    const r = reliability(c, m.id);
    const slot = slotOf(c, m.id);
    const st = settlement(c, m.id);
    return `<div class="sv-member">${avatar(m.name, m.id)}<div class="sv-mi"><b>${esc(m.name)} ${m.isAdmin ? '👑' : ''} ${me && m.id === me.id ? '(تو)' : ''} ${!m.verified ? '<span class="sv-pill review">تغییر — نیازمند تایید</span>' : ''} ${m.active === false ? '<span class="sv-pill rejected">غیرفعال</span>' : ''}</b>
    <small>📞 ${admin || (me && m.id === me.id) ? esc(m.phone || '—') : maskPhone(m.phone)}${m.nat4 ? ` • ملی: •••${esc(m.nat4)}` : ''} • نوبت: ${slot ? esc(roundLabel(c, slot.round)) : '—'} • بدهی: ${faNum(st.remaining)} • خوش‌قولی ${faNum(r.score)}٪</small></div>${ring(r.score, 44)}
    ${admin && !m.isAdmin ? `<span class="sv-row" style="margin:0">${!m.verified ? `<button class="sv-btn sm primary" data-reverify="${m.id}">تایید مجدد</button>` : ''}<button class="sv-btn sm" data-reset-pin="${m.id}">🔑 ریست پین</button><button class="sv-btn sm" data-settle-view="${m.id}">🧾 تسویه</button>${m.active === false ? `<button class="sv-btn sm primary" data-reactivate="${m.id}">فعال‌سازی</button>` : `<button class="sv-btn sm danger" data-deactivate="${m.id}">غیرفعال</button>`}</span>` : ''}</div>`;
  }).join('');
  return `<div class="sv-panel sv-in"><h3>🔑 کد دعوت صندوق</h3><div class="sv-code" dir="ltr">${esc(c.code)}</div>
    <div class="sv-row"><button class="sv-btn sm" data-act="copy-code">📋 کپی کد</button><span class="sv-hint">این کد را به اعضا بده؛ بعد از درخواست، تو تاییدشان می‌کنی (راستی‌آزمایی با نام + موبایل).</span></div></div>
  ${admin && (c.pending || []).length ? `<div class="sv-panel sv-in sv-in-1"><h3>⏳ درخواست‌های عضویت (${faNum((c.pending || []).length)})</h3>${pend}</div>` : ''}
  ${!admin && (c.pending || []).length ? `<div class="sv-panel sv-in sv-in-1"><h3>⏳ در انتظار تایید</h3>${pend}</div>` : ''}
  <div class="sv-panel sv-in sv-in-2"><h3>👥 اعضا (${faNum((c.members || []).length)})</h3>${mems}</div>
  <div class="sv-panel sv-in sv-in-3"><h3>📦 اشتراک بین دستگاه‌ها</h3>
    <div class="sv-hint">صندوق روی این دستگاه ذخیره است. برای دستگاه دیگر (یا بکاپ) پکیج بگیر و آنجا وارد کن. ورود پکیج قدیمی‌تر جایگزین نمی‌شود مگر خودت تایید کنی.</div>
    <div class="sv-row"><button class="sv-btn sm" data-act="pkg-export">📤 خروجی پکیج</button><button class="sv-btn sm" data-act="pkg-import">📥 ورود پکیج</button></div></div>`;
}

/* ---------- اعلان‌ها ---------- */
function tabNotifs(ctx) {
  const { c, me, admin } = ctx;
  if (!me) return '<div class="sv-empty">عضو نیستی.</div>';
  const list = (c.notifs || []).filter((n) => n.to === 'all' || String(n.to) === String(me.id) || (n.to === 'admin' && admin));
  return `<div class="sv-panel sv-in"><div class="sv-row" style="margin:0 0 10px"><h3 style="margin:0;flex:1">🔔 اعلان‌ها</h3><button class="sv-btn sm" data-act="notif-read">✓ خواندم همه</button></div>
  ${list.slice(0, 60).map((n) => { const read = (n.readBy || []).includes(String(me.id)); return `<div class="sv-claim" style="${read ? 'opacity:.65' : 'border-color:var(--g1)'}"><span>${read ? '✉️' : '🆕'}</span><div style="flex:1">${esc(n.text)}<br><small class="sv-hint">${new Date(n.at).toLocaleString('fa-IR')}</small></div>${n.link ? `<button class="sv-btn sm" data-goto="${n.link}">مشاهده ←</button>` : ''}</div>`; }).join('') || '<div class="sv-empty">اعلانی نیست. 🎉</div>'}</div>`;
}

/* ---------- تنظیمات ---------- */
function tabSettings(ctx) {
  const { c, me, admin } = ctx;
  let h = '';
  if (admin) {
    const locked = c.status === 'active';
    h += `<div class="sv-panel sv-in"><h3>⚙️ تنظیمات صندوق</h3>
    <div class="sv-grid2"><div class="sv-field"><label>نام صندوق<input data-f="set-name" value="${esc(c.name)}" maxlength="60" /></label></div>
    <div class="sv-field"><label>مهلت هر ماه (چندم)<input data-f="set-dueday" inputmode="numeric" value="${faNum(c.dueDay)}" /></label></div></div>
    <div class="sv-field"><label>توضیح<textarea data-f="set-desc" rows="2">${esc(c.desc || '')}</textarea></label></div>
    <div class="sv-row"><button class="sv-btn primary" data-act="set-save">💾 ذخیره (نیازمند پین)</button></div>
    ${locked ? `<div class="sv-warn">🔒 مبلغ ماهانه (${fmtMoney(c.monthlyDue)}) و تعداد ماه‌ها (${faNum(c.months)}) چون صندوق فعال شده قفل است — هیچ‌کس (حتی تو) نمی‌تواند وسط بازی قانون پول را عوض کند.</div>` : `<div class="sv-note">صندوق هنوز فعال نشده (اولین واریز تایید نشده). مبلغ و ماه‌ها را موقع ساخت تعیین کردی.</div>`}</div>
    <div class="sv-panel sv-in sv-in-1"><h3>🔑 پین مدیر</h3><div class="sv-grid2"><div class="sv-field"><label>پین فعلی<input data-f="pin-old" type="password" inputmode="numeric" maxlength="6" /></label></div><div class="sv-field"><label>پین جدید (۴ تا ۶ رقم)<input data-f="pin-new" type="password" inputmode="numeric" maxlength="6" /></label></div></div><button class="sv-btn sm" data-act="pin-change">تغییر پین</button></div>
    <div class="sv-panel sv-in sv-in-2"><h3>🧾 زنجیره حسابرسی (${faNum((c.audit || []).length)} رویداد)</h3><div class="sv-hint">هر تغییر مهم (صف، تایید، پرداخت، تنظیمات) اینجا با هش زنجیره‌ای ثبت می‌شود. حذف ندارد.</div>
    <div class="sv-row"><button class="sv-btn sm" data-act="verify-chain">🔗 بررسی سلامت زنجیره</button><button class="sv-btn sm" data-act="audit-view">👁 مشاهده رویدادها</button></div><div data-audit-out></div></div>
    <div class="sv-panel sv-in sv-in-3"><h3>☢️ منطقه خطر</h3><button class="sv-btn danger" data-act="circle-delete">🗑 حذف کامل صندوق</button></div>`;
  }
  if (me) {
    h += `<div class="sv-panel sv-in"><h3>🙋 حساب من</h3>
    <div class="sv-grid2"><div class="sv-field"><label>نام نمایشی<input data-f="me-name" value="${esc(me.name)}" maxlength="40" /></label></div><div class="sv-field"><label>موبایل<input data-f="me-phone" value="${esc(me.phone || '')}" dir="ltr" /></label></div></div>
    <div class="sv-row"><button class="sv-btn sm primary" data-act="me-save">💾 ذخیره مشخصات</button></div>
    <div class="sv-hint">⚠️ تغییر نام/موبایل نیازمند تایید مجدد مدیر است و تا آن لحظه واریزت قفل می‌شود (ضد جعل هویت).</div>
    <div class="sv-grid2" style="margin-top:8px"><div class="sv-field"><label>پین فعلی<input data-f="mepin-old" type="password" inputmode="numeric" maxlength="6" /></label></div><div class="sv-field"><label>پین جدید<input data-f="mepin-new" type="password" inputmode="numeric" maxlength="6" /></label></div></div>
    <div class="sv-row"><button class="sv-btn sm" data-act="mepin-change">🔑 تغییر پین من</button></div></div>`;
    if (!admin) h += `<div class="sv-panel sv-in sv-in-1"><h3>🚪 خروج از صندوق</h3><div class="sv-hint">خروج = غیرفعال شدن بعد از تسویه کامل. درخواستت برای مدیر می‌رود.</div><div class="sv-row"><button class="sv-btn danger sm" data-act="exit-req">درخواست خروج</button></div></div>`;
  }
  return h || '<div class="sv-empty">—</div>';
}

/* ================= اکشن‌های اتاق ================= */
export function handleRoomAction(action, el, ctx) {
  const { c } = ctx;
  const A = ctx.A;
  const val = (sel) => A.root.querySelector(sel)?.value ?? '';
  const me = () => myMember(getCircle(c.id) || c, ctx.user?.id);
  const refresh = () => { ctx.c = getCircle(c.id) || ctx.c; ctx.me = myMember(ctx.c, ctx.user?.id); ctx.admin = isAdmin(ctx.c, ctx.user?.id); };
  const done = (r) => {
    if (!r.ok) { A.toast('❌ ' + r.error); return true; }
    saveCircle(ctx.c); refresh(); A.rerender();
    return true;
  };

  switch (action) {
    case 'back-list': A.goList(); return true;
    case 'notif-read': { refresh(); const m = me(); if (m) { (ctx.c.notifs || []).forEach((n) => { n.readBy = n.readBy || []; if (!n.readBy.includes(String(m.id))) n.readBy.push(String(m.id)); }); saveCircle(ctx.c); } A.rerender(); return true; }
    case 'copy-code': A.copy(ctx.c.code); A.toast('📋 کد کپی شد!'); return true;
    case 'dl-csv': A.download(`${ctx.c.name}-ledger.csv`, ledgerCSV(ctx.c)); return true;
    case 'verify-chain': {
      refresh();
      const v = verifyChain(ctx.c);
      const box = A.root.querySelector('[data-audit-out]');
      const msg = v.ok ? `✅ زنجیره سالم است (${faNum(v.count)} رویداد، هیچ دستکاری).` : `❌ زنجیره از رویداد ${faNum(v.bad)} شکسته! (دستکاری دیتا)`;
      if (box) box.innerHTML = `<div class="${v.ok ? 'sv-note' : 'sv-danger-note'}" style="margin-top:8px">${msg}</div>`;
      A.toast(v.ok ? '✅ زنجیره حسابرسی سالم است.' : '❌ زنجیره شکسته!');
      return true;
    }
    case 'audit-view': {
      refresh();
      const rows = [...(ctx.c.audit || [])].reverse().slice(0, 60).map((e) => `<tr><td>${faNum(e.i)}</td><td>${esc(e.actor)}</td><td dir="ltr">${esc(e.action)}</td><td>${esc(e.detail)}</td><td>${new Date(e.at).toLocaleString('fa-IR')}</td></tr>`).join('');
      A.openModal(`<h3>🧾 رویدادهای حسابرسی</h3><div class="sv-table-wrap"><table class="sv-table"><tr><th>#</th><th>کننده</th><th>عمل</th><th>جزئیات</th><th>زمان</th></tr>${rows}</table></div>`, 'audit');
      return true;
    }
  }
  // اکشن‌های نیازمند عضویت/مدیر — el-based
  if (el) {
    if (el.dataset.amt) {
      const inp = A.root.querySelector('[data-f="cl-amount"]');
      if (inp) {
        if (el.dataset.amt === 'rest') {
          refresh();
          const m = me(); const r = Number(val('[data-f="cl-round"]')) || currentRound(ctx.c);
          inp.value = Math.max(0, ctx.c.monthlyDue - roundPaid(ctx.c, m.id, r));
        } else inp.value = el.dataset.amt;
      }
      return true;
    }
    if (el.dataset.receipt) {
      refresh();
      const x = (ctx.c.claims || []).find((c2) => c2.id === el.dataset.receipt);
      if (x?.receipt) A.openModal(`<h3>🧾 فیش واریز</h3><img src="${x.receipt}" style="width:100%;border-radius:14px" alt="فیش" /><div class="sv-hint">${faNum(x.amount)} تومان • ${esc(roundLabel(ctx.c, x.round))}</div>`, 'receipt');
      return true;
    }
    if (el.dataset.cancelClaim) { refresh(); return done(cancelClaim(ctx.c, el.dataset.cancelClaim, me()?.id)); }
    if (el.dataset.approve) {
      const id = el.dataset.approve;
      A.needPin('a', 'تایید واریز (پین مدیر)', () => { refresh(); const r = approveClaim(getCircle(ctx.c.id), id, me()); if (r.ok) { saveCircle(getCircle(ctx.c.id)); } done(r); if (r.ok) setTimeout(() => A.confetti(60), 200); });
      return true;
    }
    if (el.dataset.reject) {
      const id = el.dataset.reject;
      A.openModal(`<h3>❌ رد واریز</h3><div class="sv-field"><label>علت (به عضو نشان داده می‌شود)<input data-f="rej-note" maxlength="200" placeholder="مثلاً: فیش ناخواناست" /></label></div><div class="sv-row"><button class="sv-btn danger" data-mok="reject-go" data-id="${id}">❌ رد قطعی</button></div>`, 'reject');
      return true;
    }
    if (el.dataset.payout) {
      const r = Number(el.dataset.payout);
      refresh();
      const act = (ctx.c.members || []).filter((m) => m.active !== false && m.approved).length;
      const def = ctx.c.monthlyDue * Math.max(1, act);
      const w = memberById(ctx.c, (ctx.c.queue || []).find((q) => Number(q.round) === r)?.memberId);
      A.openModal(`<h3>💰 ثبت برداشت «${esc(roundLabel(ctx.c, r))}»</h3><div class="sv-note">برنده: <b>${esc(w?.name)}</b><br>مبلغ پیش‌فرض صندوق: <b>${fmtMoney(def)}</b> (${faNum(act)} عضو × ${fmtMoney(ctx.c.monthlyDue)})</div><div class="sv-field"><label>مبلغ پرداختی (تومان)<input data-f="pay-amount" inputmode="numeric" value="${def}" /></label></div><div class="sv-row"><button class="sv-btn gold" data-mok="payout-go" data-round="${r}">💰 ثبت پرداخت (نیازمند پین)</button></div>`, 'payout');
      return true;
    }
    if (el.dataset.clearSlot) {
      const r = Number(el.dataset.clearSlot);
      if (!A.confirmDlg(`نوبت «${roundLabel(ctx.c, r)}» خالی شود؟ (ثبت در حسابرسی + اعلام به همه)`)) return true;
      A.needPin('a', 'خالی کردن نوبت', () => { refresh(); const cc = getCircle(ctx.c.id); const res = clearSlot(cc, r, me()); if (res.ok) saveCircle(cc); done(res); });
      return true;
    }
    if (el.dataset.replay) {
      refresh();
      const res = replayDraw(ctx.c, el.dataset.replay);
      let body = '';
      if (!res.ok) {
        body = '<div class="sv-danger-note">' + esc(res.error) + '</div>';
      } else if (res.match) {
        body = '<div class="sv-note">✅ <b>تایید شد!</b> با همان سید عمومی، دقیقاً همان برنده‌ها بیرون آمد — قرعه‌کشی سالم بوده. 🎲</div>';
      } else {
        const names = res.picks.map((p) => esc(memberById(ctx.c, p.memberId)?.name || '?')).join('، ');
        body = '<div class="sv-danger-note">❌ نتیجه بازپخش با ثبت‌شده فرق دارد! (اعضا بعداً تغییر کرده‌اند یا دستکاری)</div>'
          + '<div class="sv-hint">بازپخش: ' + names + '</div>';
      }
      A.openModal('<h3>🔁 نتیجه بازپخش</h3>' + body, 'replay');
      return true;
    }
    if (el.dataset.vote) {
      const [pid, oi] = el.dataset.vote.split(':');
      A.needPin('m', 'ثبت رأی (پین تو)', () => { refresh(); const cc = getCircle(ctx.c.id); const res = votePoll(cc, pid, me()?.id, Number(oi)); if (res.ok) saveCircle(cc); done(res); });
      return true;
    }
    if (el.dataset.closePoll) {
      if (!A.confirmDlg('نظرسنجی بسته و نتیجه اعلام شود؟')) return true;
      A.needPin('a', 'بستن نظرسنجی', () => { refresh(); const cc = getCircle(ctx.c.id); const res = closePoll(cc, el.dataset.closePoll, me()); if (res.ok) saveCircle(cc); done(res); });
      return true;
    }
    if (el.dataset.ideaVote) { refresh(); const cc = getCircle(ctx.c.id); const res = voteIdea(cc, el.dataset.ideaVote, me()?.id); if (res.ok) saveCircle(cc); return done(res); }
    if (el.dataset.approveJoin) {
      const pid = el.dataset.approveJoin;
      A.needPin('a', 'تایید عضویت', () => {
        refresh();
        const cc = getCircle(ctx.c.id);
        const p = (cc.pending || []).find((x) => x.id === pid);
        if (!p) { A.toast('❌ پیدا نشد.'); return; }
        if ((cc.members || []).some((m) => m.phone && p.phone && m.phone.replace(/\D/g, '') === p.phone.replace(/\D/g, ''))) { A.toast('❌ این موبایل قبلاً عضو شده!'); return; }
        if ((cc.members || []).some((m) => m.userId && p.userId && String(m.userId) === String(p.userId))) { A.toast('❌ این کاربر قبلاً عضو است!'); return; }
        cc.pending = (cc.pending || []).filter((x) => x.id !== pid);
        const nm = { id: p.memberId || ('m' + Date.now().toString(36)), userId: p.userId, name: p.name, phone: p.phone, nat4: p.nat4 || '', pin: p.pin, joinedAt: Date.now(), approved: true, verified: true, active: true, isAdmin: false };
        cc.members.push(nm);
        audit(cc, me()?.name || 'مدیر', 'member.approve', `${p.name} • ${p.phone}`);
        cc.chat.push({ id: 'c' + Date.now().toString(36), at: Date.now(), kind: 'announce', text: `👋 ${p.name} به صندوق پیوست! خوش آمدی! 🎉` });
        notify(cc, nm.id, `✅ عضویتت در «${cc.name}» تایید شد! خوش آمدی 🎉`, 'home');
        saveCircle(cc); refresh(); A.rerender(); A.toast(`✅ ${p.name} عضو شد!`);
      });
      return true;
    }
    if (el.dataset.rejectJoin) {
      if (!A.confirmDlg('درخواست عضویت رد شود؟')) return true;
      refresh();
      const cc = getCircle(ctx.c.id);
      const p = (cc.pending || []).find((x) => x.id === el.dataset.rejectJoin);
      cc.pending = (cc.pending || []).filter((x) => x.id !== el.dataset.rejectJoin);
      if (p) audit(cc, me()?.name || 'مدیر', 'member.reject', `${p.name}`);
      saveCircle(cc); refresh(); A.rerender();
      return true;
    }
    if (el.dataset.reverify) {
      refresh();
      const cc = getCircle(ctx.c.id);
      const m = memberById(cc, el.dataset.reverify);
      if (m) { m.verified = true; audit(cc, me()?.name || 'مدیر', 'member.reverify', m.name); notify(cc, m.id, '✅ مشخصاتت توسط مدیر تایید شد.', 'finance'); saveCircle(cc); }
      refresh(); A.rerender(); A.toast('✅ تایید شد.');
      return true;
    }
    if (el.dataset.resetPin) {
      refresh();
      const m = memberById(ctx.c, el.dataset.resetPin);
      if (!m) return true;
      A.openModal(`<h3>🔑 ریست پین ${esc(m.name)}</h3><div class="sv-field"><label>پین جدید (۴ تا ۶ رقم)<input data-f="new-pin" type="password" inputmode="numeric" maxlength="6" /></label></div><div class="sv-row"><button class="sv-btn primary" data-mok="pinreset-go" data-id="${m.id}">ذخیره پین جدید</button></div><div class="sv-hint">این کار در حسابرسی ثبت و به عضو اطلاع‌رسانی می‌شود.</div>`, 'pinreset');
      return true;
    }
    if (el.dataset.settleView) {
      refresh();
      const m = memberById(ctx.c, el.dataset.settleView);
      if (!m) return true;
      const s = settlement(ctx.c, m.id);
      A.openModal(`<h3>🧾 تسویه ${esc(m.name)}</h3><div class="sv-grid">
        <div class="sv-stat"><b>${fmtMoney(s.dueTotal)}</b><span>سهم تا امروز</span></div>
        <div class="sv-stat"><b>${fmtMoney(s.paid)}</b><span>پرداخت‌شده</span></div>
        <div class="sv-stat"><b>${fmtMoney(s.received)}</b><span>برداشت کرده</span></div>
        <div class="sv-stat"><b>${fmtMoney(Math.abs(s.net))}</b><span>${s.net >= 0 ? '💚 بستانکار (صندوق بدهکار)' : '💔 بدهکار (باید بدهد)'}</span></div></div>
        <div class="sv-hint">مبنای خروج منصفانه: سهم ماه‌های سپری‌شده منهای پرداختی‌ها. برداشت‌ها جداگانه نمایش داده می‌شود چون حق نوبت بوده.</div>`, 'settle');
      return true;
    }
    if (el.dataset.deactivate || el.dataset.reactivate) {
      const mid = el.dataset.deactivate || el.dataset.reactivate;
      const off = !!el.dataset.deactivate;
      refresh();
      const cc = getCircle(ctx.c.id);
      const m = memberById(cc, mid);
      if (!m || m.isAdmin) { A.toast('❌ مدیر غیرفعال نمی‌شود.'); return true; }
      if (off) {
        const slot = slotOf(cc, mid);
        const now = currentRound(cc);
        if (slot && Number(slot.round) >= now && !(cc.payouts || []).some((p) => Number(p.round) === Number(slot.round))) { A.toast('❌ اول نوبت آینده‌اش را از صف خالی کن، بعد غیرفعالش کن.'); return true; }
        const s = settlement(cc, mid);
        if (!A.confirmDlg(`${m.name} غیرفعال شود؟\nوضعیت تسویه: ${s.net >= 0 ? 'بستانکار ' + s.net : 'بدهکار ' + (-s.net)} تومان\n(در حسابرسی ثبت و اعلام می‌شود)`)) return true;
        m.active = false;
        audit(cc, me()?.name || 'مدیر', 'member.deactivate', m.name);
        cc.chat.push({ id: 'c' + Date.now().toString(36), at: Date.now(), kind: 'announce', text: `📢 ${m.name} از صندوق خارج شد.` });
      } else {
        m.active = true;
        audit(cc, me()?.name || 'مدیر', 'member.reactivate', m.name);
      }
      saveCircle(cc); refresh(); A.rerender();
      return true;
    }
    const goto = el.dataset.goto;
    if (goto) { A.gotoTab(goto); return true; }
    const sub = el.dataset.sub;
    if (sub) { A.setSub(sub); return true; }
  }

  /* ---------- اکشن‌های متنی ---------- */
  switch (action) {
    case 'claim-submit': {
      refresh();
      const m = me();
      const r = Number(val('[data-f="cl-round"]')) || currentRound(ctx.c);
      const amt = parseMoney(val('[data-f="cl-amount"]'));
      const note = val('[data-f="cl-note"]');
      A.needPin('m', 'ثبت واریز (پین تو)', async () => {
        const file = A.root.querySelector('[data-f="cl-receipt"]')?.files?.[0] || null;
        let receipt = '';
        if (file) { try { receipt = await A.receipt(file); } catch { receipt = ''; } }
        const cc = getCircle(ctx.c.id);
        const res = submitClaim(cc, m.id, { round: r, amount: amt, receipt, note });
        if (res.ok) saveCircle(cc);
        done(res);
        if (res.ok) A.toast('📤 ثبت شد! بعد از تایید مدیر از بدهیت کم می‌شود.');
      });
      return true;
    }
    case 'chat-send': case 'dm-send': case 'dm-send-admin': {
      refresh();
      const m = me();
      if (!m) return true;
      if (action === 'chat-send') {
        const t = val('[data-f="chat-in"]');
        const cc = getCircle(ctx.c.id);
        const res = postChat(cc, m.id, t);
        if (res.ok) { saveCircle(cc); refresh(); A.rerender(); A.scrollChat(); }
        else A.toast('❌ ' + res.error);
      } else if (action === 'dm-send') {
        const t = val('[data-f="dm-in"]');
        const cc = getCircle(ctx.c.id);
        const res = postDM(cc, m.id, t);
        if (res.ok) { saveCircle(cc); refresh(); A.rerender(); A.scrollChat(); }
        else A.toast('❌ ' + res.error);
      } else {
        const to = val('[data-f="dm-with"]');
        const t = val('[data-f="dm-in"]');
        if (!to) { A.toast('❌ عضو را انتخاب کن.'); return true; }
        const cc = getCircle(ctx.c.id);
        const res = postDMByAdmin(cc, m, to, t);
        if (res.ok) { saveCircle(cc); refresh(); A.rerender(); A.scrollChat(); }
        else A.toast('❌ ' + res.error);
      }
      return true;
    }
    case 'poll-create': {
      const q = val('[data-f="poll-q"]');
      const opts = val('[data-f="poll-opts"]').split('\n');
      const days = parseMoney(val('[data-f="poll-days"]')) || 3;
      A.needPin('a', 'انتشار نظرسنجی', () => { refresh(); const cc = getCircle(ctx.c.id); const res = createPoll(cc, me(), q, opts, days); if (res.ok) saveCircle(cc); done(res); });
      return true;
    }
    case 'idea-send': {
      const t = val('[data-f="idea-in"]');
      refresh();
      const cc = getCircle(ctx.c.id);
      const res = postIdea(cc, me()?.id, t);
      if (res.ok) { saveCircle(cc); refresh(); A.rerender(); A.toast('💡 پیشنهادت ثبت شد!'); }
      else A.toast('❌ ' + res.error);
      return true;
    }
    case 'draw-all': {
      A.root.querySelectorAll('[data-draw-r]').forEach((x) => { x.checked = true; });
      return true;
    }
    case 'draw-go': {
      const rounds = [...A.root.querySelectorAll('[data-draw-r]:checked')].map((x) => Number(x.dataset.drawR));
      if (!rounds.length) { A.toast('❌ اول نوبت‌ها را تیک بزن!'); return true; }
      refresh();
      const names = eligible(ctx.c, rounds).map((m) => m.name);
      A.openModal(`<h3>🎲 تایید قرعه‌کشی</h3><div class="sv-note">نوبت‌ها: <b>${rounds.map((r) => esc(roundLabel(ctx.c, r))).join('، ')}</b><br>استخر: ${faNum(names.length)} نفر — ${esc(names.slice(0, 6).join('، '))}${names.length > 6 ? '...' : ''}</div><div class="sv-row"><button class="sv-btn gold" data-mok="draw-exec" data-rounds="${rounds.join(',')}">🎲 بزن بریم! (نیازمند پین)</button></div>`, 'draw');
      return true;
    }
    case 'man-go': {
      const r = Number(val('[data-f="man-round"]'));
      const mid = val('[data-f="man-member"]');
      if (!mid) { A.toast('❌ عضوی انتخاب نشده.'); return true; }
      A.needPin('a', 'ثبت دستی نوبت', () => { refresh(); const cc = getCircle(ctx.c.id); const res = assignManual(cc, r, mid, me()); if (res.ok) saveCircle(cc); done(res); });
      return true;
    }
    case 'set-save': {
      const name = val('[data-f="set-name"]').trim();
      const dueday = Math.min(28, Math.max(1, parseMoney(val('[data-f="set-dueday"]')) || ctx.c.dueDay));
      const desc = val('[data-f="set-desc"]');
      if (!name) { A.toast('❌ نام خالی است.'); return true; }
      A.needPin('a', 'ذخیره تنظیمات', () => {
        refresh();
        const cc = getCircle(ctx.c.id);
        const ch = [];
        if (cc.name !== name) ch.push(`نام: ${name}`);
        if (cc.dueDay !== dueday) ch.push(`مهلت: ${dueday}م`);
        cc.name = name.slice(0, 60); cc.dueDay = dueday; cc.desc = desc.slice(0, 300);
        if (ch.length) {
          audit(cc, me()?.name || 'مدیر', 'circle.settings', ch.join(' • '));
          cc.chat.push({ id: 'c' + Date.now().toString(36), at: Date.now(), kind: 'announce', text: `📢 تنظیمات صندوق تغییر کرد: ${ch.join('، ')}` });
          notify(cc, 'all', `📢 تنظیمات صندوق تغییر کرد: ${ch.join('، ')}`, 'settings');
        }
        saveCircle(cc); refresh(); A.rerender(); A.toast('💾 ذخیره شد!');
      });
      return true;
    }
    case 'pin-change': {
      const old = val('[data-f="pin-old"]').trim(), nw = val('[data-f="pin-new"]').trim();
      refresh();
      if (!verifyPin(old, ctx.c.id, ctx.c.adminPin)) { A.toast('❌ پین فعلی اشتباه است.'); return true; }
      if (!/^\d{4,6}$/.test(nw)) { A.toast('❌ پین جدید باید ۴ تا ۶ رقم باشد.'); return true; }
      const cc = getCircle(ctx.c.id);
      cc.adminPin = hashPin(nw, cc.id);
      const am = (cc.members || []).find((m) => m.isAdmin);
      if (am) am.pin = hashPin(nw, cc.id + ':m');
      audit(cc, me()?.name || 'مدیر', 'pin.change', 'پین مدیر عوض شد');
      saveCircle(cc); refresh(); A.rerender(); A.toast('🔑 پین عوض شد!');
      return true;
    }
    case 'me-save': {
      const name = val('[data-f="me-name"]').trim().slice(0, 40);
      const phone = val('[data-f="me-phone"]').trim().slice(0, 20);
      if (!name) { A.toast('❌ نام خالی است.'); return true; }
      refresh();
      const cc = getCircle(ctx.c.id);
      const m = memberById(cc, me()?.id);
      if (!m) return true;
      if (phone && phone.replace(/\D/g, '') && (cc.members || []).some((x) => x.id !== m.id && x.phone && x.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))) { A.toast('❌ این موبایل مال عضو دیگری است!'); return true; }
      const changed = m.name !== name || (m.phone || '') !== phone;
      m.name = name; m.phone = phone;
      if (changed && !m.isAdmin) { m.verified = false; notify(cc, 'admin', `⚠️ ${name} مشخصاتش را عوض کرد — نیازمند تایید مجدد`, 'members'); }
      audit(cc, name, 'member.edit', changed ? 'تغییر مشخصات (نیازمند تایید)' : 'بدون تغییر');
      saveCircle(cc); refresh(); A.rerender(); A.toast(changed && !m.isAdmin ? '💾 ذخیره شد — تا تایید مدیر واریزت قفل است.' : '💾 ذخیره شد!');
      return true;
    }
    case 'mepin-change': {
      const old = val('[data-f="mepin-old"]').trim(), nw = val('[data-f="mepin-new"]').trim();
      refresh();
      const cc = getCircle(ctx.c.id);
      const m = memberById(cc, me()?.id);
      if (!m || !verifyPin(old, cc.id + ':m', m.pin)) { A.toast('❌ پین فعلی اشتباه است.'); return true; }
      if (!/^\d{4,6}$/.test(nw)) { A.toast('❌ پین جدید باید ۴ تا ۶ رقم باشد.'); return true; }
      m.pin = hashPin(nw, cc.id + ':m');
      audit(cc, m.name, 'pin.change', 'پین عضو عوض شد');
      saveCircle(cc); refresh(); A.rerender(); A.toast('🔑 پینت عوض شد!');
      return true;
    }
    case 'exit-req': {
      refresh();
      const m = me();
      const s = settlement(ctx.c, m.id);
      if (s.remaining > 0) { A.toast(`❌ اول بدهیت (${fmtMoney(s.remaining)}) را تسویه کن!`); return true; }
      if (!A.confirmDlg('درخواست خروج ثبت شود؟ مدیر بعد از بررسی غیرفعالت می‌کند.')) return true;
      const cc = getCircle(ctx.c.id);
      notify(cc, 'admin', `🚪 ${m.name} درخواست خروج داده (تسویه: ${s.net >= 0 ? 'بستانکار ' + s.net : 'بدهکار ' + (-s.net)})`, 'members');
      audit(cc, m.name, 'member.exit-req', `net=${s.net}`);
      saveCircle(cc); A.toast('🚪 درخواستت برای مدیر رفت.');
      return true;
    }
    case 'circle-delete': {
      if (!A.confirmDlg(`«${ctx.c.name}» برای همیشه حذف شود؟ این کار برگشت ندارد!`)) return true;
      if (!A.confirmDlg('مطمئنی؟ بار دوم می‌پرسم! همه دفاتر پاک می‌شود.')) return true;
      A.deleteCircle(ctx.c.id);
      return true;
    }
    case 'pkg-export': {
      refresh();
      const pkg = JSON.stringify(exportPackage(ctx.c));
      A.openModal(`<h3>📤 پکیج صندوق</h3><div class="sv-row"><button class="sv-btn sm primary" data-act="pkg-dl">📥 دانلود فایل</button><button class="sv-btn sm" data-act="pkg-copy">📋 کپی متن</button></div><textarea data-f="pkg-text" rows="6" readonly style="direction:ltr;font-size:10px">${esc(pkg)}</textarea>`, 'pkg');
      return true;
    }
    case 'pkg-dl': A.download(`${ctx.c.name}-package.json`, val('[data-f="pkg-text"]')); return true;
    case 'pkg-copy': A.copy(val('[data-f="pkg-text"]')); A.toast('📋 کپی شد!'); return true;
    case 'pkg-import': A.openImport(); return true;
  }
  return false;
}

/* ---------- تاییدهای داخل مودال ---------- */
export function handleModalOk(id, el, ctx) {
  const A = ctx.A;
  const val = (sel) => A.root.querySelector(sel)?.value ?? '';
  const refresh = () => { ctx.c = getCircle(ctx.c.id) || ctx.c; ctx.me = myMember(ctx.c, ctx.user?.id); ctx.admin = isAdmin(ctx.c, ctx.user?.id); };
  if (id === 'reject-go') {
    const cid = el.dataset.id;
    const note = val('[data-f="rej-note"]');
    A.needPin('a', 'رد واریز', () => { refresh(); const cc = getCircle(ctx.c.id); const res = rejectClaim(cc, cid, myMember(cc, ctx.user?.id), note); if (res.ok) saveCircle(cc); A.closeModal(); refresh(); A.rerender(); A.toast(res.ok ? '❌ رد شد و به عضو خبر دادم.' : '❌ ' + res.error); });
    return true;
  }
  if (id === 'payout-go') {
    const r = Number(el.dataset.round);
    const amt = parseMoney(val('[data-f="pay-amount"]'));
    A.needPin('a', 'ثبت برداشت', () => {
      refresh();
      const cc = getCircle(ctx.c.id);
      const act = (cc.members || []).filter((m) => m.active !== false && m.approved).length;
      const def = cc.monthlyDue * Math.max(1, act);
      if (amt <= 0) { A.toast('❌ مبلغ نامعتبر.'); return; }
      if (amt !== def && !A.confirmDlg(`مبلغ (${amt.toLocaleString('fa-IR')}) با پیش‌فرض صندوق (${def.toLocaleString('fa-IR')}) فرق دارد. ادامه؟`)) return;
      const res = recordPayout(cc, r, myMember(cc, ctx.user?.id), amt);
      if (res.ok) { saveCircle(cc); A.closeModal(); refresh(); A.rerender(); A.confetti(120); A.toast('💰 ثبت شد! مبارک برنده! 🎉'); }
      else A.toast('❌ ' + res.error);
    });
    return true;
  }
  if (id === 'draw-exec') {
    const rounds = String(el.dataset.rounds || '').split(',').map(Number).filter(Boolean);
    A.closeModal();
    A.needPin('a', 'اجرای قرعه‌کشی', () => {
      refresh();
      const cc = getCircle(ctx.c.id);
      // انیمیشن گردونه
      const pool = eligible(cc, rounds);
      A.openModal(`<h3>🎲 در حال قرعه‌کشی...</h3><div class="sv-shuffle" data-shuffle>🎰</div>`, 'drawing');
      const box = A.root.querySelector('[data-shuffle]');
      let i = 0;
      const tick = setInterval(() => {
        if (!box?.isConnected) { clearInterval(tick); return; }
        box.textContent = '🎲 ' + (pool.length ? pool[Math.floor(Math.random() * pool.length)].name : '؟');
        if (++i > 14) {
          clearInterval(tick);
          const res = drawLots(cc, rounds, myMember(cc, ctx.user?.id));
          if (!res.ok) { A.closeModal(); A.toast('❌ ' + res.error); return; }
          saveCircle(cc);
          A.closeModal(); refresh(); A.rerender(); A.confetti(150);
          A.toast('🎉 قرعه‌کشی انجام شد!');
        }
      }, 110);
    });
    return true;
  }
  if (id === 'pinreset-go') {
    const mid = el.dataset.id;
    const nw = val('[data-f="new-pin"]').trim();
    if (!/^\d{4,6}$/.test(nw)) { A.toast('❌ پین باید ۴ تا ۶ رقم باشد.'); return true; }
    refresh();
    const cc = getCircle(ctx.c.id);
    const m = memberById(cc, mid);
    if (m) {
      m.pin = hashPin(nw, cc.id + ':m');
      audit(cc, myMember(cc, ctx.user?.id)?.name || 'مدیر', 'pin.reset', `ریست پین ${m.name}`);
      notify(cc, m.id, '🔑 پینت توسط مدیر ریست شد. پین جدید را از مدیر بگیر.', 'settings');
      saveCircle(cc);
    }
    A.closeModal(); refresh(); A.rerender(); A.toast('🔑 پین ریست شد! به عضو خبر دادم.');
    return true;
  }
  return false;
}
