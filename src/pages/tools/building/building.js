// src/pages/tools/building/building.js

/**
 * ساختمون‌یار — کنترلر اصلی 🏢
 * سوپراپ مدیریت ساختمان: ۹ تب، نمای تعاملی، چت، مالی، رأی‌گیری و…
 */

import { buildingCss } from './building.css.js';
import { createBuildingState, BLD_TABS } from './building-state.js';
import * as Store from './building-store.js';
import {
  renderOnboarding,
  renderShell,
  renderFacadeTab,
  renderFeedTab,
} from './building-renderers.js';
import {
  renderMoneyTab,
  renderChatTab,
  renderServicesTab,
  renderVotesTab,
  renderComplaintsTab,
  renderDocsTab,
  renderManageTab,
  unitDetailHtml,
} from './building-renderers2.js';
import * as E from './building-editor.js';
import { toast } from '../../../utilities/toast.js';

export function createBuildingPage(ctx = {}) {
  const user = ctx.user || null;
  const meId = user?.id != null ? String(user.id) : 'guest';
  const root = document.createElement('div');
  root.className = 'bld-app';
  ensureCss();

  const state = createBuildingState();
  let destroyed = false;
  let unsub = null;
  let joinBid = '';
  let shellModal = null;
  let chatImg = '';
  let chatBusy = false;

  /* ================================================================== */
  /* کانتکست و داده                                                          */
  /* ================================================================== */

  function bctx() {
    const building = Store.getBuilding(state.buildingId);
    if (!building) return null;
    const units = Store.listUnits(building.id);
    const unitsBySlot = {};
    for (const u of units) unitsBySlot[u.slotKey] = u;
    const isManager = String(building.managerId) === meId;
    const myUnit = units.find((u) => String(u.userId || '') === meId) || null;
    const mgrUnit = units.find((u) => String(u.userId || '') === String(building.managerId)) || null;
    const slots = Store.structureSlots(building);
    const slotBalances = {};
    for (const sk of slots) slotBalances[sk] = Store.slotBalance(building.id, sk);
    return {
      user, meId, building, units, unitsBySlot, isManager, myUnit,
      mySlot: myUnit?.slotKey || '',
      managerSlot: mgrUnit?.slotKey || '',
      slots, slotBalances, stats: Store.statsOf(building.id),
    };
  }

  function computeBadges(c) {
    const bid = c.building.id;
    const seen = Store.getSeen(meId);
    const b = { facade: 0, feed: 0, money: 0, chat: 0, services: 0, votes: 0, complaints: 0, docs: 0, manage: 0 };
    b.feed = Store.listPosts(bid).filter((p) => p.createdAt > (seen[`f_${bid}`] || 0)).length;
    const g = Store.listGroupMessages(bid).filter(
      (m) => m.createdAt > (seen[`g_${bid}`] || 0) && String(m.fromId) !== meId
    ).length;
    let dm = 0;
    for (const t of Store.listThreads(bid, meId)) {
      const th = Store.dmThreadKey(meId, t.otherId);
      if (String(t.last.fromId) !== meId && t.last.createdAt > (seen[`d_${bid}_${th}`] || 0)) dm++;
    }
    b.chat = g + dm;
    if (c.isManager) {
      b.money = Store.listPayments(bid).filter((p) => p.status === 'pending').length;
      b.services = Store.listTickets(bid).filter((t) => t.status === 'new').length;
      b.complaints = Store.listComplaints(bid).filter((x) => x.status === 'new').length;
    } else if (c.mySlot) {
      b.money = (c.slotBalances[c.mySlot]?.overdue || 0) + (c.slotBalances[c.mySlot]?.remaining > 0 ? 1 : 0);
    }
    return b;
  }

  function markSeen(c) {
    const bid = c.building.id;
    if (state.activeTab === 'feed') Store.setSeen(meId, { [`f_${bid}`]: Date.now() });
    if (state.activeTab === 'chat') {
      if (state.chatMode === 'group') Store.setSeen(meId, { [`g_${bid}`]: Date.now() });
      else if (state.dmTarget) {
        const th = Store.dmThreadKey(meId, state.dmTarget.userId);
        Store.setSeen(meId, { [`d_${bid}_${th}`]: Date.now() });
      }
    }
  }

  function membersForDm(c) {
    const list = [];
    for (const u of c.units) {
      if (u.userId && String(u.userId) !== meId) {
        list.push({ userId: String(u.userId), name: u.headName, slot: u.slotKey, role: 'همسایه 🏠', avatar: u.avatar || '' });
      }
    }
    if (String(c.building.managerId) !== meId && !list.some((m) => m.userId === String(c.building.managerId))) {
      const mu = c.units.find((u) => String(u.userId || '') === String(c.building.managerId));
      list.unshift({ userId: String(c.building.managerId), name: c.building.managerName || 'مدیر', slot: mu?.slotKey || '', role: 'مدیر ساختمان 👑', avatar: '' });
    }
    return list;
  }

  /* ================================================================== */
  /* رندر                                                                    */
  /* ================================================================== */

  function view() {
    if (!user) {
      return `<div class="bld-app"><div class="bld-empty"><div class="bld-empty-ico">🔒</div><h3>وارد شوید</h3><p>برای استفاده از ساختمون‌یار باید وارد حساب شوید.</p><a class="bld-btn is-primary" href="/login">ورود →</a></div></div>`;
    }
    if (state.view === 'building') {
      const c = bctx();
      if (!c) {
        state.view = 'onboarding';
        state.buildingId = '';
        return view();
      }
      const badges = computeBadges(c);
      const content = tabContent(c);
      markSeen(c);
      return renderShell({ building: c.building, isManager: c.isManager, myUnit: c.myUnit, tabs: BLD_TABS, activeTab: state.activeTab, badges, contentHtml: content });
    }
    // آنبوردینگ
    const myList = Store.listBuildingsForUser(meId);
    let joinBuilding = null;
    let unitsBySlot = {};
    if (joinBid) {
      joinBuilding = Store.getBuilding(joinBid);
      if (joinBuilding) {
        for (const u of Store.listUnits(joinBid)) unitsBySlot[u.slotKey] = u;
      } else joinBid = '';
    }
    return renderOnboarding({ user, myList, joinBuilding, unitsBySlot, pickedSlot: state.pickedSlot, totalSlots: joinBuilding ? joinBuilding.floors * joinBuilding.unitsPerFloor : 0 });
  }

  function tabContent(c) {
    const bid = c.building.id;
    const base = { ...c, ...state };
    switch (state.activeTab) {
      case 'facade': {
        const balances = {};
        for (const sk of c.slots) balances[sk] = c.slotBalances[sk];
        return renderFacadeTab({ building: c.building, unitsBySlot: c.unitsBySlot, balances, mySlot: c.mySlot, managerSlot: c.managerSlot, facadeMode: state.facadeMode, stats: c.stats });
      }
      case 'feed':
        return renderFeedTab({ isManager: c.isManager, posts: Store.listPosts(bid), mySlot: c.mySlot, feedFilter: state.feedFilter, totalSlots: c.slots.length });
      case 'money': {
        const myDebts = c.mySlot ? Store.slotDebts(bid, c.mySlot) : [];
        return renderMoneyTab({
          ...base,
          myDebts,
          myBalance: c.mySlot ? c.slotBalances[c.mySlot] : { total: 0, paid: 0, remaining: 0, overdue: 0 },
          myPayments: c.mySlot ? Store.listPayments(bid).filter((p) => p.slotKey === c.mySlot) : [],
          fund: c.stats.fund,
          recentPayments: Store.listPayments(bid).filter((p) => p.status === 'approved'),
          pendingPayments: Store.listPayments(bid).filter((p) => p.status === 'pending'),
          historyPayments: Store.listPayments(bid).filter((p) => p.status !== 'pending'),
          payments: Store.listPayments(bid),
          pendingCount: Store.listPayments(bid).filter((p) => p.status === 'pending').length,
        });
      }
      case 'chat': {
        const isGroup = state.chatMode === 'group';
        return renderChatTab({
          meId, isManager: c.isManager, managerId: c.building.managerId, managerName: c.building.managerName,
          mySlot: c.mySlot, chatMode: state.chatMode,
          groupMsgs: Store.listGroupMessages(bid),
          threads: Store.listThreads(bid, meId),
          dmMsgs: !isGroup && state.dmTarget ? Store.listDmMessages(bid, Store.dmThreadKey(meId, state.dmTarget.userId)) : [],
          dmTarget: state.dmTarget || null,
          members: membersForDm(c),
          unitsBySlot: c.unitsBySlot,
          seenGroup: Store.getSeen(meId)[`g_${bid}`] || 0,
          seenDm: 0,
        });
      }
      case 'services':
        return renderServicesTab({ isManager: c.isManager, cleaning: Store.cleaningState(bid), unitsBySlot: c.unitsBySlot, events: Store.listEvents(bid), tickets: Store.listTickets(bid), mySlot: c.mySlot });
      case 'votes':
        return renderVotesTab({ isManager: c.isManager, polls: Store.listPolls(bid), suggestions: Store.listSuggestions(bid), meId, mySlot: c.mySlot });
      case 'complaints':
        return renderComplaintsTab({ isManager: c.isManager, complaints: Store.listComplaints(bid), meId, mySlot: c.mySlot });
      case 'docs':
        return renderDocsTab({ isManager: c.isManager, docsMode: state.docsMode, docs: Store.listDocs(bid), contacts: Store.listContacts(bid), rules: c.building.rules || '' });
      case 'manage':
        return renderManageTab({ ...base, payments: Store.listPayments(bid) });
      default:
        return '';
    }
  }

  function paint() {
    if (destroyed) return;
    // حفظ پیش‌نویس چت
    const composer = root.querySelector('[data-form="chat"] input[name="text"]');
    const draft = composer ? { text: composer.value, focus: document.activeElement === composer } : null;
    root.innerHTML = view();
    if (draft) {
      const input = root.querySelector('[data-form="chat"] input[name="text"]');
      if (input) {
        input.value = draft.text;
        if (draft.focus) input.focus();
      }
      if (chatImg) renderChatImgPreview();
    }
    if (state._scrollChat) {
      state._scrollChat = false;
      const box = root.querySelector('#bldMsgs');
      if (box) box.scrollTop = box.scrollHeight;
    }
  }

  function refresh() {
    paint();
  }

  function openBuilding(id) {
    state.view = 'building';
    state.buildingId = id;
    state.activeTab = 'facade';
    state.moneyMode = 'mine';
    state.chatMode = 'group';
    state.dmTarget = null;
    state.docsMode = 'docs';
    state.manageMode = 'units';
    state.feedFilter = 'all';
    joinBid = '';
    state.pickedSlot = '';
    refresh();
  }

  /* ================================================================== */
  /* اکشن‌ها                                                                 */
  /* ================================================================== */

  function needBuilding() {
    const c = bctx();
    if (!c) {
      state.view = 'onboarding';
      refresh();
      return null;
    }
    return c;
  }

  function slotOptions(c, excludeMine = false) {
    return c.units
      .filter((u) => !excludeMine || u.slotKey !== c.mySlot)
      .map((u) => ({ key: u.slotKey, label: `${Store.shortSlot(u.slotKey)} — ${u.headName}` }));
  }

  async function restoreFlow() {
    const nb = await E.restoreModal();
    if (!nb) return;
    openBuilding(nb.id);
    confettiBurst();
    toast.success(`«${nb.name}» وارد این دستگاه شد! 🎉`);
  }

  async function handleAction(action, el) {
    switch (action) {
      /* ---------- آنبوردینگ ---------- */
      case 'new-building': {
        const d = await E.buildingCreateModal();
        if (!d) return;
        d.floors = Math.min(30, Math.max(1, Number(d.floors) || 1));
        d.unitsPerFloor = Math.min(12, Math.max(1, Number(d.unitsPerFloor) || 1));
        const b = Store.createBuilding(d, user);
        toast.success(`ساختمان «${b.name}» ساخته شد! 🎉`);
        await E.showCodeModal(b);
        openBuilding(b.id);
        confettiBurst();
        return;
      }
      case 'join-code': {
        const code = await E.joinCodeModal();
        if (!code) return;
        const b = Store.findByCode(code);
        if (!b) {
          const go = await E.confirmAction({
            title: 'ساختمان پیدا نشد 🔍',
            message: 'با این کد چیزی در این دستگاه نیست. اگر با دستگاه جدید آمده‌ای، اول باید بسته ساختمان را وارد کنی. الان بازیابی می‌کنی؟',
            confirmLabel: '📥 بازیابی ساختمان',
          });
          if (go) await restoreFlow();
          return;
        }
        joinBid = b.id;
        state.pickedSlot = '';
        refresh();
        setTimeout(() => root.querySelector('#bldJoin')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        return;
      }
      case 'restore-building':
        await restoreFlow();
        return;
      case 'seed-demo': {
        const b = Store.seedDemoBuilding(user);
        toast.success('دموی زنده ساخته شد! 🤩');
        openBuilding(b.id);
        confettiBurst();
        return;
      }
      case 'open-building':
        openBuilding(el.dataset.id);
        return;
      case 'cancel-join':
        joinBid = '';
        state.pickedSlot = '';
        refresh();
        return;
      case 'pick-slot':
        state.pickedSlot = el.dataset.slot;
        refresh();
        return;
      case 'confirm-join': {
        if (!joinBid || !state.pickedSlot) return;
        const b = Store.getBuilding(joinBid);
        const d = await E.joinProfileModal(Store.slotLabel(state.pickedSlot));
        if (!d) return;
        const r = Store.joinUnit(joinBid, state.pickedSlot, d, user);
        if (r.error) {
          toast.error(r.error);
          return;
        }
        joinBid = '';
        state.pickedSlot = '';
        openBuilding(b.id);
        confettiBurst();
        toast.success(`به «${b.name}» خوش اومدی! 🎉`);
        if (r.inherited > 0) {
          setTimeout(() => toast.warning(`⚠️ این واحد ${Store.fmtMoney(r.inherited)} بدهی انباشته دارد.`), 600);
        }
        return;
      }
      case 'back-list':
        state.view = 'onboarding';
        state.buildingId = '';
        refresh();
        return;
      case 'copy-code': {
        try {
          await navigator.clipboard.writeText(el.dataset.code || '');
          toast.success('کد کپی شد! 📋');
        } catch {
          toast.info(el.dataset.code || '');
        }
        return;
      }
      case 'tab':
        state.activeTab = el.dataset.tab;
        if (state.activeTab === 'chat') state._scrollChat = true;
        refresh();
        return;
      case 'goto':
        state.activeTab = el.dataset.tab;
        if (state.activeTab === 'chat') state._scrollChat = true;
        refresh();
        return;
    }

    const c = needBuilding();
    if (!c) return;
    const bid = c.building.id;

    switch (action) {
      /* ---------- نما ---------- */
      case 'facade-mode':
        state.facadeMode = el.dataset.mode || 'auto';
        refresh();
        return;
      case 'open-unit': {
        const sk = el.dataset.slot;
        const unit = c.unitsBySlot[sk] || null;
        const html = unitDetailHtml({
          ...c, unit, slotKey: sk,
          balance: c.slotBalances[sk] || { total: 0, paid: 0, remaining: 0, overdue: 0 },
          debts: Store.slotDebts(bid, sk),
          isOwn: !!unit && unit.slotKey === c.mySlot,
          canMessage: !!unit && !!unit.userId && String(unit.userId) !== meId,
          mySlot: c.mySlot,
        });
        shellModal = E.shellModal({ title: unit ? `🏠 ${unit.headName} — واحد ${Store.shortSlot(sk)}` : `🈳 واحد ${Store.shortSlot(sk)}`, html });
        bindShell();
        return;
      }

      /* ---------- تابلو ---------- */
      case 'feed-filter':
        state.feedFilter = el.dataset.f;
        refresh();
        return;
      case 'new-post': {
        const kind = el.dataset.kind || 'notice';
        const p = E.postModal(kind, c.slots.length);
        E.wireSplitPreview(c.slots.length);
        const d = await p;
        if (!d) return;
        const r = Store.createPost(bid, { ...d, kind }, user);
        if (r.error) {
          toast.error(r.error);
          return;
        }
        if (r.post.amount > 0) {
          const per = Math.floor(r.post.amount / c.slots.length);
          toast.success(`ثبت شد! سهم هر واحد: ${Store.fmtMoney(per)} 🧾`);
        } else toast.success('منتشر شد! 📢');
        refresh();
        return;
      }
      case 'edit-post': {
        const p = Store.getPost(el.dataset.id);
        if (!p) return;
        const q = E.postModal(p.kind, c.slots.length, {
          title: p.title, body: p.body, amount: p.amount || '', category: p.category,
          month: p.month, dueDate: p.dueDate ? Store.toISODateInput(p.dueDate) : '', pinned: p.pinned,
        });
        E.wireSplitPreview(c.slots.length);
        const d = await q;
        if (!d) return;
        if (!d.receipt) delete d.receipt;
        const r = Store.updatePost(p.id, d);
        if (r.error) toast.error(r.error);
        else toast.success('ویرایش شد ✏️');
        refresh();
        return;
      }
      case 'delete-post': {
        const ok = await E.confirmAction({ title: 'حذف پست؟', message: 'این پست و بدهی‌های بدون پرداختش حذف می‌شود.', confirmLabel: 'حذف', danger: true });
        if (!ok) return;
        const r = Store.deletePost(el.dataset.id);
        if (r.error) toast.error(r.error);
        else toast.success('حذف شد 🗑');
        refresh();
        return;
      }
      case 'pin-post':
        Store.togglePinPost(el.dataset.id);
        refresh();
        return;
      case 'view-img':
        E.imageModal(el.dataset.src, el.dataset.cap || '');
        return;

      /* ---------- مالی ---------- */
      case 'money-mode':
        state.moneyMode = el.dataset.m;
        refresh();
        return;
      case 'pay-new': {
        if (!c.mySlot) return;
        const rem = c.slotBalances[c.mySlot]?.remaining || 0;
        if (rem <= 0) {
          toast.info('بدهی نداری! 🎉');
          return;
        }
        const d = await E.payModal(rem);
        if (!d) return;
        const r = Store.createPayment(bid, c.mySlot, d, user);
        if (r.error) {
          toast.error(r.error);
          return;
        }
        toast.success('پرداخت ثبت و برای مدیر ارسال شد! 📤');
        refresh();
        return;
      }
      case 'approve-pay': {
        Store.decidePayment(el.dataset.id, true, c.building.managerName);
        toast.success('پرداخت تأیید شد ✅');
        refresh();
        return;
      }
      case 'reject-pay': {
        Store.decidePayment(el.dataset.id, false, c.building.managerName);
        toast.warning('پرداخت رد شد 🚫');
        refresh();
        return;
      }
      case 'delete-pay': {
        const ok = await E.confirmAction({ title: 'حذف پرداخت؟', message: 'اگر تأییدشده باشد، مبلغ به بدهی برمی‌گردد.', confirmLabel: 'حذف', danger: true });
        if (!ok) return;
        Store.deletePayment(el.dataset.id);
        toast.success('حذف شد 🗑');
        refresh();
        return;
      }
      case 'fund-edit': {
        const v = await E.fundModal(c.building.fundStart || 0);
        if (v === null) return;
        Store.updateBuilding(bid, { fundStart: v });
        toast.success('صندوق به‌روز شد 🏦');
        refresh();
        return;
      }
      case 'transfer-building': {
        if (!c.isManager) {
          toast.error('فقط مدیر ساختمان می‌تواند بسته انتقال بسازد. 👑');
          return;
        }
        const first = Store.exportBuildingPackage(bid, { includeImages: true });
        if (first.error) {
          toast.error(first.error);
          return;
        }
        await E.transferModal({ building: c.building, counts: first.counts, makePayload: (withImg) => Store.exportBuildingPackage(bid, { includeImages: withImg }) });
        return;
      }
      case 'export-csv': {
        const csv = Store.exportBuildingCSV(bid);
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sakhteman-${bid.slice(-6)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast.success('فایل CSV دانلود شد 📥');
        return;
      }

      /* ---------- چت ---------- */
      case 'chat-mode-group':
        state.chatMode = 'group';
        state.dmTarget = null;
        state._scrollChat = true;
        refresh();
        return;
      case 'chat-mode-dm':
        state.chatMode = `dm:${el.dataset.user}`;
        state.dmTarget = { userId: el.dataset.user, name: el.dataset.name, slot: el.dataset.slot || '' };
        state._scrollChat = true;
        refresh();
        return;
      case 'del-msg':
        Store.deleteMessage(el.dataset.id, meId);
        refresh();
        return;

      /* ---------- خدمات ---------- */
      case 'new-ticket': {
        const d = await E.ticketModal();
        if (!d) return;
        Store.createTicket(bid, { ...d, bySlot: c.mySlot }, user);
        toast.success('درخواست ثبت شد! 🛠');
        refresh();
        return;
      }
      case 'manage-ticket': {
        const t = Store.listTickets(bid).find((x) => x.id === el.dataset.id);
        if (!t) return;
        const d = await E.ticketManageModal(t);
        if (!d) return;
        Store.updateTicket(t.id, d);
        toast.success('ثبت شد ✅');
        refresh();
        return;
      }
      case 'del-ticket': {
        const ok = await E.confirmAction({ title: 'حذف درخواست؟', message: '', confirmLabel: 'حذف', danger: true });
        if (!ok) return;
        Store.deleteTicket(el.dataset.id);
        refresh();
        return;
      }
      case 'new-event': {
        const d = await E.eventModal();
        if (!d) return;
        Store.createEvent(bid, d, user);
        toast.success('رویداد ثبت شد 📅');
        refresh();
        return;
      }
      case 'del-event':
        Store.deleteEvent(el.dataset.id);
        refresh();
        return;
      case 'clean-next':
        Store.rotateCleaning(bid, 1);
        refresh();
        return;
      case 'clean-prev':
        Store.rotateCleaning(bid, -1);
        refresh();
        return;

      /* ---------- رأی‌گیری ---------- */
      case 'new-poll': {
        const d = await E.pollModal();
        if (!d) return;
        const r = Store.createPoll(bid, d, user);
        if (r.error) toast.error(r.error);
        else toast.success('نظرسنجی شروع شد! 🗳');
        refresh();
        return;
      }
      case 'vote': {
        const r = Store.votePoll(el.dataset.id, meId, Number(el.dataset.idx));
        if (r.error) toast.error(r.error);
        else toast.success('رأی شما ثبت شد! ✅');
        refresh();
        return;
      }
      case 'poll-toggle': {
        const p = Store.listPolls(bid).find((x) => x.id === el.dataset.id);
        if (p) Store.setPollStatus(p.id, p.status === 'open' ? 'closed' : 'open');
        refresh();
        return;
      }
      case 'del-poll':
        Store.deletePoll(el.dataset.id);
        refresh();
        return;
      case 'new-suggestion': {
        const d = await E.suggestionModal();
        if (!d) return;
        Store.createSuggestion(bid, { ...d, bySlot: c.mySlot }, user);
        toast.success('پیشنهاد ثبت شد! 💡');
        refresh();
        return;
      }
      case 'sug-vote':
        Store.toggleSuggestionVote(el.dataset.id, meId);
        refresh();
        return;
      case 'sug-cycle': {
        const order = ['idea', 'review', 'approved', 'doing', 'done'];
        const s = Store.listSuggestions(bid).find((x) => x.id === el.dataset.id);
        if (s) {
          const i = order.indexOf(s.status);
          Store.setSuggestionStatus(s.id, order[(i + 1) % order.length] || 'idea');
        }
        refresh();
        return;
      }
      case 'del-sug':
        Store.deleteSuggestion(el.dataset.id);
        refresh();
        return;

      /* ---------- شکایت ---------- */
      case 'new-complaint': {
        const d = await E.complaintModal(slotOptions(c));
        if (!d) return;
        Store.createComplaint(bid, { ...d, fromSlot: c.mySlot }, user);
        toast.success('شکایت ثبت و برای مدیر ارسال شد 📮');
        refresh();
        return;
      }
      case 'complain-unit': {
        const sk = el.dataset.slot;
        const d = await E.complaintModal(slotOptions(c));
        if (!d) return;
        d.targetKind = 'unit';
        d.targetSlot = sk;
        Store.createComplaint(bid, { ...d, fromSlot: c.mySlot }, user);
        toast.success(`شکایت از واحد ${Store.shortSlot(sk)} ثبت شد 📮`);
        state.activeTab = 'complaints';
        refresh();
        return;
      }
      case 'resp-complaint': {
        const cmp = Store.listComplaints(bid).find((x) => x.id === el.dataset.id);
        if (!cmp) return;
        const d = await E.complaintResponseModal(cmp);
        if (!d) return;
        Store.updateComplaint(cmp.id, d);
        toast.success('رسیدگی ثبت شد ✅');
        refresh();
        return;
      }
      case 'del-complaint': {
        const ok = await E.confirmAction({ title: 'حذف شکایت؟', message: '', confirmLabel: 'حذف', danger: true });
        if (!ok) return;
        Store.deleteComplaint(el.dataset.id);
        refresh();
        return;
      }

      /* ---------- اسناد ---------- */
      case 'docs-mode':
        state.docsMode = el.dataset.m;
        refresh();
        return;
      case 'new-doc': {
        const d = await E.docModal();
        if (!d) return;
        const r = Store.createDoc(bid, d, user);
        if (r.error) toast.error(r.error);
        else {
          if (!r.doc.file && !r.doc.body) toast.warning('سند بدون متن و فایل ذخیره شد.');
          else toast.success('سند ذخیره شد 📁');
        }
        refresh();
        return;
      }
      case 'del-doc':
        Store.deleteDoc(el.dataset.id);
        refresh();
        return;
      case 'new-contact': {
        const d = await E.contactModal();
        if (!d) return;
        Store.upsertContact(bid, d);
        toast.success('مخاطب ذخیره شد 📞');
        refresh();
        return;
      }
      case 'edit-contact': {
        const ct = Store.listContacts(bid).find((x) => x.id === el.dataset.id);
        if (!ct) return;
        const d = await E.contactModal(ct);
        if (!d) return;
        Store.upsertContact(bid, { ...d, id: ct.id });
        toast.success('ویرایش شد ✏️');
        refresh();
        return;
      }
      case 'del-contact':
        Store.deleteContact(el.dataset.id);
        refresh();
        return;
      case 'edit-rules': {
        const v = await E.rulesModal(c.building.rules || '');
        if (v === null) return;
        Store.setRules(bid, v);
        toast.success('قوانین ذخیره شد 📜');
        refresh();
        return;
      }

      /* ---------- مدیریت ---------- */
      case 'manage-mode':
        state.manageMode = el.dataset.m;
        refresh();
        return;
      case 'edit-unit':
      case 'edit-my-unit': {
        const u = action === 'edit-my-unit' ? c.myUnit : Store.getUnit(el.dataset.id);
        if (!u) return;
        const d = await E.unitEditModal(u);
        if (!d) return;
        Store.updateUnit(u.id, d);
        toast.success('واحد به‌روز شد ✏️');
        refresh();
        return;
      }
      case 'del-unit': {
        const u = Store.getUnit(el.dataset.id);
        if (!u) return;
        const bal = Store.slotBalance(bid, u.slotKey);
        const ok = await E.confirmAction({
          title: `حذف واحد ${Store.shortSlot(u.slotKey)}؟`,
          message: `«${u.headName}» حذف و اسلات آزاد می‌شود.${bal.remaining > 0 ? ` توجه: ${Store.fmtMoney(bal.remaining)} بدهی روی واحد می‌ماند!` : ''}`,
          confirmLabel: 'حذف واحد',
          danger: true,
        });
        if (!ok) return;
        Store.removeUnit(u.id);
        if (shellModal) {
          shellModal.close();
          shellModal = null;
        }
        toast.success('واحد حذف شد 🗑');
        refresh();
        return;
      }
      case 'msg-unit': {
        const u = Store.getUnit(el.dataset.id);
        if (!u) return;
        if (!u.userId) {
          toast.warning('این واحد هنوز عضو اپ نشده؛ نمی‌توان پیام داد. 📵');
          return;
        }
        state.activeTab = 'chat';
        state.chatMode = `dm:${u.userId}`;
        state.dmTarget = { userId: String(u.userId), name: u.headName, slot: u.slotKey };
        state._scrollChat = true;
        refresh();
        return;
      }
      case 'leave-unit': {
        if (!c.myUnit) return;
        const ok = await E.confirmAction({ title: 'ترک واحد؟', message: 'اسلات شما آزاد می‌شود ولی بدهی‌ها روی واحد می‌ماند.', confirmLabel: 'ترک واحد', danger: true });
        if (!ok) return;
        Store.removeUnit(c.myUnit.id);
        toast.warning('واحد را ترک کردی 🚪');
        if (!c.isManager) {
          state.view = 'onboarding';
          state.buildingId = '';
        }
        refresh();
        return;
      }
      case 'delete-building': {
        const b = Store.getBuilding(el.dataset.id);
        if (!b) return;
        const ok = await E.confirmAction({
          title: `حذف «${b.name}»؟`,
          message: 'کل اطلاعات ساختمان (واحدها، بدهی‌ها، پیام‌ها و…) برای همیشه پاک می‌شود!',
          confirmLabel: 'حذف برای همیشه',
          danger: true,
        });
        if (!ok) return;
        Store.deleteBuilding(b.id);
        state.view = 'onboarding';
        state.buildingId = '';
        toast.success('ساختمان حذف شد 🗑');
        refresh();
        return;
      }
      default:
        break;
    }
  }

  /* ---------- مودال ورود به واحد: دلیگیت کلیک ---------- */
  function bindShell() {
    if (!shellModal) return;
    setTimeout(() => {
      const body = shellModal.bodyElement;
      const shell = body?.querySelector('.bld-shell');
      if (!shell) return;
      shell.addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if (!el || !shell.contains(el)) return;
        if (el.dataset.shell === 'close' && shellModal) {
          shellModal.close();
          shellModal = null;
        }
        handleAction(el.dataset.action, el);
      });
    }, 60);
  }

  /* ---------- چت: ارسال ---------- */
  async function onSubmit(e) {
    const form = e.target.closest?.('[data-form="chat"]');
    if (!form || !root.contains(form)) return;
    e.preventDefault();
    if (chatBusy) return;
    const c = needBuilding();
    if (!c) return;
    const input = form.querySelector('input[name="text"]');
    const text = (input?.value || '').trim();
    if (!text && !chatImg) return;
    chatBusy = true;
    try {
      const scope = form.dataset.scope === 'dm' ? 'dm' : 'group';
      const r = Store.sendMessage(
        c.building.id,
        {
          scope,
          text,
          image: chatImg,
          fromSlot: c.mySlot,
          toId: form.dataset.to || '',
          toName: form.dataset.toname || '',
          toSlot: form.dataset.toslot || '',
        },
        user
      );
      if (r.error) toast.error(r.error);
      else {
        chatImg = '';
        state._scrollChat = true;
        refresh();
      }
    } finally {
      chatBusy = false;
    }
  }

  function renderChatImgPreview() {
    const form = root.querySelector('[data-form="chat"]');
    if (!form) return;
    form.querySelector('.bld-img-prev')?.remove();
    if (!chatImg) return;
    const div = document.createElement('div');
    div.className = 'bld-img-prev';
    const img = document.createElement('img');
    img.src = chatImg;
    img.alt = 'عکس پیوست';
    const x = document.createElement('button');
    x.type = 'button';
    x.textContent = '×';
    x.addEventListener('click', () => {
      chatImg = '';
      div.remove();
      const fi = form.querySelector('input[name="image"]');
      if (fi) fi.value = '';
    });
    div.append(img, x);
    form.prepend(div);
  }

  async function onChange(e) {
    const inp = e.target.closest?.('[data-form="chat"] input[name="image"]');
    if (!inp || !root.contains(inp)) return;
    const f = inp.files?.[0];
    if (!f) {
      chatImg = '';
      renderChatImgPreview();
      return;
    }
    try {
      chatImg = await Store.imageFileToDataURL(f, 800);
      renderChatImgPreview();
      toast.success('عکس پیوست شد 📎');
    } catch {
      toast.error('خواندن عکس ناموفق بود.');
    }
  }

  function onClick(e) {
    const el = e.target.closest?.('[data-action]');
    if (!el || !root.contains(el)) return;
    if (el.tagName === 'BUTTON' && el.disabled) return;
    handleAction(el.dataset.action, el);
  }

  /* ---------- افکت‌ها ---------- */
  function confettiBurst() {
    const emo = ['🎉', '✨', '🏢', '🎊', '⭐', '🔑', '💰'];
    const layer = document.createElement('div');
    layer.className = 'bld-confetti';
    for (let i = 0; i < 46; i++) {
      const s = document.createElement('span');
      s.textContent = emo[i % emo.length];
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 0.6}s`;
      s.style.animationDuration = `${2.2 + Math.random() * 1.4}s`;
      s.style.fontSize = `${14 + Math.random() * 18}px`;
      layer.appendChild(s);
    }
    root.appendChild(layer);
    setTimeout(() => layer.remove(), 4200);
  }

  /* ================================================================== */
  /* چرخه حیات                                                              */
  /* ================================================================== */

  function attach() {
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    root.addEventListener('change', onChange);
    unsub = Store.subscribe(() => {
      if (!destroyed) refresh();
    });
  }

  attach();

  return {
    render() {
      refresh();
      return root;
    },
    afterRender() {
      /* همه‌چیز سینک است */
    },
    destroy() {
      destroyed = true;
      try {
        unsub?.();
      } catch {
        /* ignore */
      }
      root.removeEventListener('click', onClick);
      root.removeEventListener('submit', onSubmit);
      root.removeEventListener('change', onChange);
      if (shellModal) {
        try {
          shellModal.close();
        } catch {
          /* ignore */
        }
        shellModal = null;
      }
    },
  };
}

export default { createBuildingPage };

/* ---------- CSS یک‌بارمصرف ---------- */

function ensureCss() {
  let el = document.querySelector('style[data-bld-css]');
  if (!el) {
    el = document.createElement('style');
    el.setAttribute('data-bld-css', '1');
    el.textContent = buildingCss;
    document.head.appendChild(el);
  }
  return el;
}
