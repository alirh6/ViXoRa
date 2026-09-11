// 💰 ViXoRa Savings Circles — صندوق‌های خانگی (کمیته) با حسابرسی دقیق
// src/pages/tools/savingsCircle/savingsCircle.js
// قرارداد صفحه: { render, afterRender, destroy }

import { injectScopedCss } from '../../../utilities/css-scope.js';
import { svCss } from './sv-css.js';
import {
  listCircles, getCircle, saveCircle, deleteCircle, findByCode, newJoinCode, newId,
  hashPin, verifyPin, faNum, fmtMoney, myMember, isAdmin, audit, notify, blankCircle,
  exportPackage, parsePackage, verifyChain,
} from './sv-store.js';
import { jalaliNow, currentRound, memberTotals, poolAudit, reliability, recordPayout } from './sv-finance.js';
import { renderRoom, handleRoomAction, handleModalOk } from './sv-room.js';
import { postChat } from './sv-social.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

export function createSavingsPage(ctx = {}) {
  const user = ctx.user || { id: 'local', name: 'کاربر' };
  let root = null;
  let releaseCss = null;
  let destroyed = false;
  let view = 'list'; // list | room
  let circleId = '';
  let tab = 'home';
  let sub = 'public';
  let dmWith = '';
  const pinOk = { m: 0, a: 0 };
  let pinCb = null;

  /* ================= شل ================= */
  function render() {
    return `<div class="sv-root"><div class="sv-blobs"><i></i><i></i><i></i></div>
      <div data-sv="body"></div><div data-sv="overlay"></div><div data-sv="toast"></div></div>`;
  }
  function roomCtx() {
    const c = getCircle(circleId);
    return c ? { c, me: myMember(c, user?.id), admin: isAdmin(c, user?.id), user, tab, sub, dmWith, A: api() } : null;
  }
  function renderBody() {
    const host = root.querySelector('[data-sv="body"]');
    if (view === 'room') {
      const r = roomCtx();
      if (!r) { view = 'list'; host.innerHTML = listHtml(); return; }
      host.innerHTML = renderRoom(r);
      countUp();
      scrollChat(false);
    } else {
      host.innerHTML = listHtml();
    }
  }

  /* ---------- لیست صندوق‌ها ---------- */
  function listHtml() {
    const all = listCircles();
    const mine = all.filter((c) => isAdmin(c, user?.id) || myMember(c, user?.id));
    const cards = mine.map((c) => {
      const pa = poolAudit(c);
      const me = myMember(c, user?.id);
      const admin = isAdmin(c, user?.id);
      const t = me ? memberTotals(c, me.id) : null;
      const un = me ? (c.notifs || []).filter((n) => (n.to === 'all' || String(n.to) === String(me.id) || (n.to === 'admin' && admin)) && !(n.readBy || []).includes(String(me.id))).length : 0;
      return `<div class="sv-panel sv-in"><div class="sv-row" style="margin:0"><b style="font-size:15px;flex:1">💰 ${esc(c.name)} ${admin ? '👑' : ''} ${un ? `<span class="sv-badge" style="background:#ef4444;border-radius:9px;padding:1px 8px;font-size:11px">${faNum(un)} جدید</span>` : ''}</b>
        <button class="sv-btn sm primary" data-open="${c.id}">ورود ←</button></div>
        <div class="sv-hint">ماهانه ${fmtMoney(c.monthlyDue)} • ${faNum(c.months)} ماه • ${faNum(pa.activeMembers)} عضو • جمع: ${fmtMoney(pa.collected)}${t ? ` • بدهی من: <b>${fmtMoney(t.remaining)}</b>` : ''}</div></div>`;
    }).join('');
    return `<div class="sv-head sv-in"><div class="sv-logo">💰</div><div><h1>صندوق‌های خانگی (کمیته)</h1><p>قسطی واریز کن، قرعه‌کشی شفاف ببین، حساب‌کتاب دقیق داشته باش — بدون دعوا! 😄</p></div><span class="sv-sp"></span>
      <button class="sv-btn primary" data-act="create">＋ ساخت صندوق</button>
      <button class="sv-btn" data-act="join">🔑 ورود با کد</button></div>
    <div class="sv-row sv-in sv-in-1"><button class="sv-btn sm" data-act="import">📥 وارد کردن پکیج (دستگاه دیگر)</button><button class="sv-btn sm violet" data-act="demo">🎭 صندوق نمایشی (امتحان کن!)</button></div>
    <div style="height:12px"></div>${cards || `<div class="sv-demo sv-in sv-in-2">👋 هنوز صندوقی نداری!<br>• <b>مدیر</b> صندوقی؟ «ساخت صندوق» را بزن و کد دعوت بگیر.<br>• <b>عضو</b> هستی؟ کد را از مدیر بگیر و «ورود با کد» را بزن.<br>• می‌خواهی اول ببینی؟ «🎭 صندوق نمایشی» را امتحان کن!</div>`}`;
  }

  /* ================= زیرساخت ================= */
  function api() {
    return {
      root, user,
      toast, openModal, closeModal, needPin, confirmDlg, download, copy, receipt, confetti, scrollChat,
      save: () => saveCircle(getCircle(circleId)),
      rerender: () => renderBody(),
      goList: () => { view = 'list'; circleId = ''; renderBody(); window.scrollTo({ top: 0 }); },
      gotoTab: (t) => { tab = t; renderBody(); },
      setSub: (s) => { sub = s; renderBody(); scrollChat(false); },
      deleteCircle: (id) => { deleteCircle(id); view = 'list'; renderBody(); toast('🗑 صندوق حذف شد.'); },
      openImport: () => openImportModal(),
    };
  }
  function toast(msg) {
    const host = root?.querySelector('[data-sv="toast"]');
    if (!host) return;
    host.innerHTML = `<div class="sv-toast">${esc(msg)}</div>`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { if (host.isConnected) host.innerHTML = ''; }, 2800);
  }
  function openModal(html, key = 'm') {
    const ov = root.querySelector('[data-sv="overlay"]');
    ov.innerHTML = `<div class="sv-modal" data-close="${key}"><div class="sv-modal-panel" role="dialog">${html}<button class="sv-modal-x" data-mclose>✕</button></div></div>`;
  }
  function closeModal() {
    const ov = root?.querySelector('[data-sv="overlay"]');
    if (ov) ov.innerHTML = '';
  }
  function confirmDlg(msg) {
    try { return confirm(msg); } catch { return false; }
  }
  function needPin(kind, title, fn) {
    if (Date.now() - (pinOk[kind] || 0) < 5 * 60 * 1000) { fn(); return; }
    pinCb = { kind, fn };
    openModal(`<h3>🔑 ${esc(title)}</h3><div class="sv-hint">پین ${kind === 'a' ? 'مدیر' : 'خودت'} را بزن (۴ تا ۶ رقم). ۵ دقیقه باز می‌ماند.</div>
      <div class="sv-pin"><input data-f="pin1" type="password" inputmode="numeric" maxlength="6" autocomplete="off" /></div>
      <div class="sv-row"><button class="sv-btn primary" data-mok="pin-go">✅ تایید</button></div>`, 'pin');
    setTimeout(() => root.querySelector('[data-f="pin1"]')?.focus(), 60);
  }
  function download(name, text) {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    } catch { toast('❌ دانلود نشد.'); }
  }
  function copy(text) {
    try {
      if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(() => null); return; }
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    } catch { /* ignore */ }
  }
  function receipt(file) {
    return new Promise((resolve, reject) => {
      if (!file?.type?.startsWith('image/')) { reject(new Error('not-image')); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const k = Math.min(1, 800 / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          URL.revokeObjectURL(url);
          resolve(cv.toDataURL('image/jpeg', 0.7));
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')); };
      img.src = url;
    });
  }
  function countUp() {
    root.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count) || 0;
      const money = el.dataset.money === '1';
      const t0 = performance.now();
      const step = (t) => {
        if (!el.isConnected) return;
        const p = Math.min(1, (t - t0) / 900);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = money ? faNum(Math.round(target * e)) : faNum(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function confetti(n = 120) {
    try {
      const cv = document.createElement('canvas');
      cv.className = 'sv-confetti';
      cv.width = innerWidth; cv.height = innerHeight;
      document.body.appendChild(cv);
      const cx = cv.getContext('2d');
      const cols = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#fff'];
      const ps = Array.from({ length: n }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * 100, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 7, c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 }));
      const t0 = performance.now();
      const draw = (t) => {
        if (!cv.isConnected) return;
        cx.clearRect(0, 0, cv.width, cv.height);
        for (const p of ps) {
          p.x += p.vx; p.y += p.vy; p.r += p.vr;
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
          cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
          cx.restore();
        }
        if (t - t0 < 2600) requestAnimationFrame(draw);
        else cv.remove();
      };
      requestAnimationFrame(draw);
    } catch { /* ignore */ }
  }
  function scrollChat(smooth = true) {
    const b = root?.querySelector('[data-chatbox]');
    if (b) { try { b.scrollTo({ top: b.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); } catch { b.scrollTop = b.scrollHeight; } }
  }

  /* ================= مودال‌های لیست ================= */
  function openCreate() {
    const n = jalaliNow();
    openModal(`<h3>＋ ساخت صندوق جدید</h3>
      <div class="sv-grid2"><div class="sv-field"><label>نام صندوق *<input data-f="c-name" maxlength="60" placeholder="مثلاً: صندوق خانوادگی کریمی" /></label></div>
      <div class="sv-field"><label>توضیح<textarea data-f="c-desc" rows="1" maxlength="300"></textarea></label></div></div>
      <div class="sv-grid2"><div class="sv-field"><label>تعداد ماه‌ها (۲ تا ۶۰)<input data-f="c-months" inputmode="numeric" value="۱۲" /></label></div>
      <div class="sv-field"><label>مبلغ ماهانه هر نفر (تومان) *<input data-f="c-due" inputmode="numeric" placeholder="مثلاً ۲۰۰۰۰۰۰" /></label></div>
      <div class="sv-field"><label>مهلت هر ماه (چندم)<input data-f="c-dueday" inputmode="numeric" value="۵" /></label></div>
      <div class="sv-field"><label>حداقل هر واریز قسطی (تومان)<input data-f="c-min" inputmode="numeric" value="۵۰۰۰۰" /></label></div>
      <div class="sv-field"><label>ماه شروع (عدد ۱ تا ۱۲)<input data-f="c-sm" inputmode="numeric" value="${faNum(n.m)}" /></label></div>
      <div class="sv-field"><label>سال شروع (شمسی)<input data-f="c-sy" inputmode="numeric" value="${faNum(n.y)}" /></label></div></div>
      <label class="sv-check"><input type="checkbox" data-f="c-first" checked /> 👑 نوبت اول برداشت مال من است (مدیر) — به همه اعلام می‌شود</label>
      <div class="sv-grid2" style="margin-top:8px"><div class="sv-field"><label>پین مدیر (۴ تا ۶ رقم) *<input data-f="c-pin" type="password" inputmode="numeric" maxlength="6" /></label></div>
      <div class="sv-field"><label>تکرار پین *<input data-f="c-pin2" type="password" inputmode="numeric" maxlength="6" /></label></div></div>
      <div class="sv-note">🔒 مبلغ و ماه‌ها بعد از اولین واریز قفل می‌شود. پین را جایی یادداشت کن!</div>
      <div class="sv-row"><button class="sv-btn primary" data-mok="create-go">🚀 ساخت + دریافت کد دعوت</button></div>`, 'create');
  }
  function openJoin() {
    openModal(`<h3>🔑 ورود با کد دعوت</h3>
      <div class="sv-field"><label>کد ۶ حرفی<input data-f="j-code" maxlength="8" dir="ltr" style="letter-spacing:4px;text-align:center;font-weight:800" placeholder="ABC123" /></label></div>
      <div class="sv-row"><button class="sv-btn primary" data-mok="join-find">🔍 پیدا کردن صندوق</button></div>
      <div class="sv-hint">کد را نداری؟ از مدیر صندوق بگیر. با دستگاه جدید آمدی؟ اول «وارد کردن پکیج» را بزن.</div>`, 'join');
  }
  function openJoinForm(c) {
    openModal(`<h3>📝 درخواست عضویت در «${esc(c.name)}»</h3>
      <div class="sv-note">ماهانه <b>${fmtMoney(c.monthlyDue)}</b> • ${faNum(c.months)} ماه • مهلت ${faNum(c.dueDay)}م<br>درخواستت برای مدیر می‌رود؛ با <b>نام + موبایل</b> راستی‌آزمایی می‌شوی.</div>
      <div class="sv-grid2"><div class="sv-field"><label>نام و نام خانوادگی *<input data-f="j-name" maxlength="40" value="${esc(user?.name || '')}" /></label></div>
      <div class="sv-field"><label>موبایل * (باید یکتا باشد)<input data-f="j-phone" dir="ltr" maxlength="15" placeholder="0912..." /></label></div>
      <div class="sv-field"><label>۴ رقم آخر کدملی (اختیاری ولی مطمئن‌تر)<input data-f="j-nat" inputmode="numeric" maxlength="4" dir="ltr" /></label></div>
      <div class="sv-field"><label>پین تو (۴ تا ۶ رقم) *<input data-f="j-pin" type="password" inputmode="numeric" maxlength="6" /></label></div></div>
      <div class="sv-row"><button class="sv-btn primary" data-mok="join-go" data-id="${c.id}">📤 ارسال درخواست</button></div>`, 'joinform');
  }
  function openImportModal() {
    openModal(`<h3>📥 ورود پکیج صندوق</h3>
      <div class="sv-field"><label>متن پکیج<textarea data-f="imp-text" rows="5" style="direction:ltr;font-size:10px"></textarea></label></div>
      <div class="sv-field"><label>یا فایل پکیج<input type="file" data-f="imp-file" accept=".json,application/json" /></label></div>
      <div class="sv-row"><button class="sv-btn primary" data-mok="import-go">📥 بررسی و ورود</button></div>`, 'import');
  }

  /* ---------- صندوق نمایشی ---------- */
  function seedDemo() {
    const n = jalaliNow();
    const nm = ['نگار کریمی', 'امیر تهرانی', 'لیلا رضایی', 'مهدی قاسمی', 'سارا محمدی', 'رضا احمدی', 'مریم حسینی'];
    const c = blankCircle({ name: 'صندوق نمایشی کریمی 🎭', desc: 'دمو — امتحان کن و حذفش کن!', months: 10, monthlyDue: 2000000, dueDay: 5, minPartial: 50000, startY: n.y, startM: n.m > 3 ? n.m - 3 : 1, adminFirst: true, adminPin: '1234' }, { id: user?.id || 'local', name: (user?.name || 'تو') + ' (مدیر)', phone: '' });
    const adminM = c.members[0];
    const ids = [adminM.id];
    nm.forEach((x, i) => {
      const m = { id: newId('m'), userId: 'demo' + i, name: x, phone: '0912' + String(1000000 + i * 137913).slice(0, 7), nat4: String(1000 + i * 731).slice(0, 4), pin: hashPin('1234', c.id + ':m'), joinedAt: Date.now() - 80 * 864e5, approved: true, verified: true, active: true, isAdmin: false };
      c.members.push(m); ids.push(m.id);
    });
    // واریزهای تاییدشده ۳ نوبت اول برای همه + ادعای درانتظار
    let k = 0;
    for (let r = 1; r <= 3; r++) {
      for (const m of c.members) {
        if (r === 3 && k++ % 3 === 0) continue; // چند بدهکار
        const cl = { id: newId('cl'), memberId: m.id, round: r, amount: 2000000, receipt: '', note: '', at: Date.now() - (40 - r * 5) * 864e5, status: 'approved', decidedAt: Date.now() - 30 * 864e5, decidedBy: adminM.id, decideNote: '' };
        c.claims.push(cl);
        c.ledger.push({ id: newId('l'), at: cl.decidedAt, kind: 'pay', memberId: m.id, round: r, amount: 2000000, ref: cl.id, by: adminM.id, note: '' });
      }
    }
    c.claims.unshift({ id: newId('cl'), memberId: ids[2], round: 3, amount: 500000, receipt: '', note: 'قسطی می‌دم 🙂', at: Date.now() - 864e5, status: 'pending', decidedAt: 0, decidedBy: '', decideNote: '' });
    c.claims.unshift({ id: newId('cl'), memberId: ids[5], round: 3, amount: 2000000, receipt: '', note: '', at: Date.now() - 3600e3, status: 'pending', decidedAt: 0, decidedBy: '', decideNote: '' });
    c.status = 'active';
    // صف: ۱ مدیر + ۲ و ۳ قرعه
    c.queue.push({ round: 2, memberId: ids[3], method: 'lottery', at: Date.now() - 20 * 864e5, by: adminM.id, seed: 'demo-seed-2' });
    c.queue.push({ round: 3, memberId: ids[1], method: 'lottery', at: Date.now() - 20 * 864e5, by: adminM.id, seed: 'demo-seed-3' });
    c.draws.push({ id: newId('d'), rounds: [2, 3], seed: 'demo-seed', picks: [{ round: 2, memberId: ids[3] }, { round: 3, memberId: ids[1] }], at: Date.now() - 20 * 864e5, by: adminM.id, redraw: false });
    c.payouts.push({ round: 1, memberId: adminM.id, amount: 16000000, at: Date.now() - 25 * 864e5, by: adminM.id, members: 8 });
    c.ledger.push({ id: newId('l'), at: Date.now() - 25 * 864e5, kind: 'payout', memberId: adminM.id, round: 1, amount: 16000000, ref: '', by: adminM.id, note: '' });
    c.chat.push(
      { id: newId('c'), at: Date.now() - 6 * 864e5, kind: 'msg', fromId: ids[1], fromName: nm[0], text: 'سلام به همه! قسط این ماه رو ریختم ✅' },
      { id: newId('c'), at: Date.now() - 5 * 864e5, kind: 'announce', text: '📢 تنظیمات صندوق تغییر کرد: مهلت: ۵م' },
      { id: newId('c'), at: Date.now() - 2 * 864e5, kind: 'msg', fromId: ids[4], fromName: nm[3], text: 'من آخر ماه کامل می‌کنم، الان ۵۰۰ ریختم 🙏' },
    );
    c.polls.unshift({ id: newId('p'), q: 'جشن آخر صندوق کجا باشه؟ 🎉', opts: [{ t: 'رستوران', v: [ids[1], ids[2]] }, { t: 'سفر یک‌روزه', v: [ids[3]] }, { t: 'پولش رو تقسیم کنیم 😄', v: [] }], by: adminM.id, at: Date.now() - 3 * 864e5, until: Date.now() + 4 * 864e5, open: true });
    c.ideas.unshift({ id: newId('i'), memberId: ids[2], text: 'مهلت رو ببریم ۱۰م که حقوق‌ها اومده باشه', at: Date.now() - 864e5, votes: [ids[1], ids[4], ids[5]], status: 'review' });
    notify(c, 'all', '🎭 به صندوق نمایشی خوش آمدی! همه‌چیز را امتحان کن.', 'home');
    audit(c, 'سیستم', 'demo.seed', 'ساخت دمو');
    saveCircle(c);
    return c;
  }

  /* ================= رویدادها ================= */
  const num = (v) => {
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    return Math.trunc(Number(String(v || '').replace(/[۰-۹]/g, (d) => fa.indexOf(d)).replace(/[^\d]/g, '')) || 0);
  };
  const val = (sel) => root.querySelector(sel)?.value ?? '';

  async function onClick(e) {
    if (e.target.hasAttribute?.('data-close') && e.target.classList.contains('sv-modal')) { closeModal(); return; }
    if (e.target.closest?.('[data-mclose]')) { closeModal(); return; }
    const mok = e.target.closest?.('[data-mok]');
    if (mok) { handleMok(mok.dataset.mok, mok); return; }

    const open = e.target.closest?.('[data-open]');
    if (open) { circleId = open.dataset.open; view = 'room'; tab = 'home'; sub = 'public'; renderBody(); window.scrollTo({ top: 0 }); return; }

    const rtab = e.target.closest?.('[data-rtab]');
    if (rtab) { tab = rtab.dataset.rtab; renderBody(); return; }

    const act = e.target.closest?.('[data-act]');
    const action = act?.dataset.act || '';
    // اکشن‌های لیست
    if (view === 'list') {
      if (action === 'create') { openCreate(); return; }
      if (action === 'join') { openJoin(); return; }
      if (action === 'import') { openImportModal(); return; }
      if (action === 'demo') { const c = seedDemo(); circleId = c.id; view = 'room'; tab = 'home'; renderBody(); confetti(120); toast('🎭 صندوق نمایشی ساخته شد! (پین مدیر: 1234)'); return; }
    }
    // اکشن‌های اتاق
    if (view === 'room') {
      const r = roomCtx();
      if (!r) { view = 'list'; renderBody(); return; }
      const el = e.target.closest('[data-approve],[data-reject],[data-payout],[data-clear-slot],[data-replay],[data-vote],[data-close-poll],[data-idea-vote],[data-approve-join],[data-reject-join],[data-reverify],[data-reset-pin],[data-settle-view],[data-deactivate],[data-reactivate],[data-cancel-claim],[data-amt],[data-receipt],[data-goto],[data-sub]');
      if (handleRoomAction(action, el || act, r)) return;
      if (el && handleRoomAction('', el, r)) return;
    }
  }

  function handleMok(id, el) {
    // پین عمومی
    if (id === 'pin-go') {
      const pin = val('[data-f="pin1"]').trim();
      const c = getCircle(circleId);
      const cb = pinCb; pinCb = null;
      if (!c || !cb) { closeModal(); return; }
      const ok = cb.kind === 'a' ? verifyPin(pin, c.id, c.adminPin) : verifyPin(pin, c.id + ':m', myMember(c, user?.id)?.pin);
      if (!ok) { toast('❌ پین اشتباه است!'); return; }
      pinOk[cb.kind] = Date.now();
      closeModal();
      try { cb.fn(); } catch { /* ignore */ }
      return;
    }
    if (id === 'create-go') {
      const name = val('[data-f="c-name"]').trim();
      const months = Math.min(60, Math.max(2, num(val('[data-f="c-months"]')) || 12));
      const due = num(val('[data-f="c-due"]'));
      const dueday = Math.min(28, Math.max(1, num(val('[data-f="c-dueday"]')) || 5));
      const min = Math.min(1000000, Math.max(10000, num(val('[data-f="c-min"]')) || 50000));
      const sm = Math.min(12, Math.max(1, num(val('[data-f="c-sm"]')) || jalaliNow().m));
      const sy = num(val('[data-f="c-sy"]')) || jalaliNow().y;
      const pin = val('[data-f="c-pin"]').trim(), pin2 = val('[data-f="c-pin2"]').trim();
      if (!name) { toast('❌ نام صندوق لازم است!'); return; }
      if (due < 10000) { toast('❌ مبلغ ماهانه معتبر نیست!'); return; }
      if (!/^\d{4,6}$/.test(pin) || pin !== pin2) { toast('❌ پین‌ها ۴ تا ۶ رقم و یکسان باشند!'); return; }
      const c = blankCircle({ name, desc: val('[data-f="c-desc"]'), months, monthlyDue: due, dueDay: dueday, minPartial: min, startY: sy, startM: sm, adminFirst: root.querySelector('[data-f="c-first"]')?.checked, adminPin: pin }, { id: user?.id || 'local', name: user?.name || 'مدیر', phone: '' });
      saveCircle(c);
      closeModal();
      circleId = c.id; view = 'room'; tab = 'members'; renderBody();
      confetti(120);
      toast(`🎉 صندوق ساخته شد! کد دعوت: ${c.code}`);
      return;
    }
    if (id === 'join-find') {
      const code = val('[data-f="j-code"]').trim().toUpperCase();
      const c = findByCode(code);
      if (!c) { toast('❌ با این کد صندوقی در این دستگاه نیست. اول پکیج را وارد کن!'); return; }
      if (isAdmin(c, user?.id) || myMember(c, user?.id)) { closeModal(); circleId = c.id; view = 'room'; tab = 'home'; renderBody(); return; }
      if ((c.pending || []).some((p) => p.userId && String(p.userId) === String(user?.id))) { toast('⏳ درخواستت قبلاً ثبت شده، منتظر تایید مدیر باش!'); return; }
      openJoinForm(c);
      return;
    }
    if (id === 'join-go') {
      const c = getCircle(el.dataset.id);
      if (!c) return;
      const name = val('[data-f="j-name"]').trim().slice(0, 40);
      const phone = val('[data-f="j-phone"]').trim().slice(0, 15);
      const nat4 = val('[data-f="j-nat"]').trim().slice(0, 4);
      const pin = val('[data-f="j-pin"]').trim();
      if (!name) { toast('❌ نام لازم است!'); return; }
      if (phone.replace(/\D/g, '').length < 10) { toast('❌ موبایل معتبر نیست!'); return; }
      if (!/^\d{4,6}$/.test(pin)) { toast('❌ پین ۴ تا ۶ رقم!'); return; }
      if ((c.members || []).some((m) => m.phone && m.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))) { toast('❌ این موبایل قبلاً عضو است!'); return; }
      c.pending = c.pending || [];
      c.pending.push({ id: newId('pj'), userId: user?.id || '', name, phone, nat4, pin: hashPin(pin, c.id + ':m'), at: Date.now() });
      audit(c, name, 'member.request', `${name} • ${phone}`);
      notify(c, 'admin', `👋 درخواست عضویت جدید: ${name} (${phone})`, 'members');
      saveCircle(c);
      closeModal();
      toast('📤 درخواستت رفت برای مدیر! بعد از تایید وارد میشی.');
      return;
    }
    if (id === 'import-go') {
      const txt = val('[data-f="imp-text"]').trim();
      if (!txt) { toast('❌ متنی وارد نکردی! (یا فایل انتخاب کن)'); return; }
      doImportText(txt);
      return;
    }
    // مودال‌های اتاق
    if (view === 'room') {
      const r = roomCtx();
      if (r && handleModalOk(id, el, r)) return;
    }
  }

  function doImportText(txt) {
    const p = parsePackage(txt);
    if (!p.ok) { toast('❌ ' + p.error); return; }
    const local = getCircle(p.circle.id);
    if (local && (local.updatedAt || 0) >= (p.circle.updatedAt || 0) && !confirmDlg(`این دستگاه نسخه جدیدتر دارد!\nدستگاه: ${new Date(local.updatedAt).toLocaleString('fa-IR')}\nپکیج: ${new Date(p.circle.updatedAt || 0).toLocaleString('fa-IR')}\nبازم جایگزین کنم؟`)) return;
    saveCircle(p.circle);
    closeModal(); renderBody();
    toast('📥 صندوق وارد شد!');
  }

  function onChange(e) {
    if (e.target.matches?.('[data-f="imp-file"]')) {
      const f = e.target.files?.[0];
      if (f) { const r = new FileReader(); r.onload = () => { const t = root.querySelector('[data-f="imp-text"]'); if (t) t.value = String(r.result || ''); }; r.readAsText(f); }
      return;
    }
    if (view === 'room' && e.target.matches?.('[data-f="dm-with"]')) { dmWith = e.target.value; renderBody(); return; }
    const ist = e.target.closest?.('[data-idea-status]');
    if (ist && view === 'room') {
      const r = roomCtx();
      if (!r?.admin) return;
      import('./sv-social.js').then(({ setIdeaStatus }) => {
        const cc = getCircle(circleId);
        const res = setIdeaStatus(cc, ist.dataset.ideaStatus, r.me, ist.value);
        if (res.ok) { saveCircle(cc); renderBody(); toast('💡 وضعیت پیشنهاد ثبت شد!'); }
      });
      return;
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      if (root.querySelector('.sv-modal')) { closeModal(); return; }
      return;
    }
    if (e.key === 'Enter' && view === 'room') {
      const t = e.target;
      if (t.matches?.('[data-f="chat-in"]')) { e.preventDefault(); const r = roomCtx(); if (r) handleRoomAction('chat-send', null, r); }
      if (t.matches?.('[data-f="dm-in"]')) { e.preventDefault(); const r = roomCtx(); if (r) handleRoomAction(r.admin ? 'dm-send-admin' : 'dm-send', null, r); }
      if (t.matches?.('[data-f="idea-in"]')) { e.preventDefault(); const r = roomCtx(); if (r) handleRoomAction('idea-send', null, r); }
      if (t.matches?.('[data-f="pin1"]')) { e.preventDefault(); handleMok('pin-go', t); }
    }
  }

  /* ================= چرخه ================= */
  async function afterRender() {
    const host = document.querySelector('.sv-root');
    if (!host) return;
    root = host;
    releaseCss = injectScopedCss(svCss, 'savings-page');
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
    renderBody();
  }
  function destroy() {
    destroyed = true;
    clearTimeout(toast._t);
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
    }
    document.removeEventListener('keydown', onKeydown);
    if (releaseCss) releaseCss();
  }
  return { render, afterRender, destroy };
}
