// src/pages/tools/invoices/invoices.js

/**
 * سوپراپ مالی ViXoRa — صفحه صورت‌حساب‌ها
 * ==================================================================
 * ۹ تب: خانه، تراکنش‌ها، بودجه‌ها، اهداف، بدهی‌ها، فاکتورها، قبوض، گزارش‌ها، تنظیمات
 */

import { invoicesCss } from './invoices.css.js';
import { createFinanceState, FIN_TABS, getFinanceHelpers } from './invoices-state.js';
import {
  renderDashboard,
  renderTxs,
  renderBudgets,
  renderGoals,
  renderDebts,
  renderInvoices,
  renderInvoicePrint,
  renderBills,
  renderReports,
  renderSettings,
} from './invoices-renderers.js';
import {
  txModal,
  budgetModal,
  goalModal,
  moneyModal,
  debtModal,
  invoiceModal,
  invItemRowHtml,
  billModal,
  recurringModal,
  ruleModal,
  accountModal,
  categoryModal,
  templatesModal,
  importModal,
  restoreModal,
  confirmModal,
  promptModal,
} from './invoices-editor.js';

import {
  getFinanceSettings,
  saveFinanceSettings,
  ensureFinanceDefaults,
  getFinanceBundle,
  createTx,
  updateTx,
  deleteTx,
  duplicateTx,
  bulkDeleteTxs,
  bulkUpdateTxs,
  createAccount,
  updateAccount,
  deleteAccount,
  createCategory,
  updateCategory,
  deleteCategory,
  createBudget,
  updateBudget,
  deleteBudget,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeGoal,
  withdrawGoal,
  createDebt,
  updateDebt,
  deleteDebt,
  payDebt,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  processRecurrings,
  createInvoiceDoc,
  updateInvoiceDoc,
  deleteInvoiceDoc,
  collectInvoice,
  createBill,
  updateBill,
  deleteBill,
  payBill,
  createRule,
  deleteRule,
  createSavedView,
  createTemplate,
  deleteTemplate,
  applyTemplate,
  importParsedRows,
  exportFinance,
  importFinance,
  wipeFinanceData,
  generateDemoData,
} from '../../../core/services/finance-service.js';

import { renderLoansView, afterLoansRender, handleLoansAction, handleLoansChange } from './fin-loans.js';
import { renderForecastView, afterForecastRender, handleForecastAction } from './fin-forecast.js';
import { renderDesignerView, afterDesignerRender, handleDesignerAction, handleDesignerChange } from './fin-designer.js';
import { renderInsightsView, afterInsightsRender, handleInsightsAction, handleInsightsChange, setAttTarget } from './fin-insights.js';

import {
  escapeHtml,
  financeWindow,
  parseTxCSV,
  txsToCSV,
  suggestCategoryId,
  toLocalDateInput,
  downloadTextFile,
} from '../../../core/schemas/finance-schema.js';

/* ================================================================== */
/* نقطه ورود                                                             */
/* ================================================================== */

export function createInvoicesPage(ctx = {}) {
  const root = document.createElement('div');
  root.className = 'fin-app';
  root.innerHTML = `<div class="fin-empty">⏳ در حال بارگذاری سوپراپ مالی…</div>`;

  const state = createFinanceState();
  ensureCss();
  let helpers = null;
  let storeUnsub = null;
  let destroyed = false;
  let booted = false;

  function render() {
    return root;
  }

  async function afterRender() {
    if (booted) return;
    booted = true;
    attachListeners();
    await boot();
  }

  async function boot() {
    try {
      try {
        const deep = sessionStorage.getItem('vixora:fin-tab');
        if (deep) {
          sessionStorage.removeItem('vixora:fin-tab');
          state.activeTab = deep;
        }
      } catch { /* ignore */ }
      await ensureFinanceDefaults();
      try {
        const r = await processRecurrings();
        if (r.created > 0) state.recurringNote = `${r.created} تراکنش دوره‌ای خودکار ثبت شد.`;
      } catch {
        /* ignore */
      }
      await refresh(false);
      state.ready = true;
      renderContent();
      if (state.recurringNote) toast(state.recurringNote);
    } catch (err) {
      if (destroyed) return;
      root.innerHTML = `<div class="fin-empty">❌ خطا در بارگذاری: ${escapeHtml(err?.message || err)}<br /><button class="fin-btn fin-btn-primary" data-action="retry-boot" style="margin-top:10px">تلاش مجدد</button></div>`;
    }
  }

  async function refresh(renderAfter = true) {
    state.settings = getFinanceSettings();
    state.bundle = await getFinanceBundle();
    helpers = getFinanceHelpers(state.bundle, state.settings);
    if (renderAfter) renderContent();
  }

  /* ---------- رندر ---------- */

  function renderContent() {
    if (destroyed || !state.ready) return;
    root.dataset.theme = state.settings.theme || 'emerald';
    root.dataset.density = state.settings.density || 'comfortable';
    const tab = state.activeTab;
    const body = tab === 'dashboard' ? renderDashboard(ctxObj())
      : tab === 'txs' ? renderTxs(ctxObj())
      : tab === 'budgets' ? renderBudgets(ctxObj())
      : tab === 'goals' ? renderGoals(ctxObj())
      : tab === 'debts' ? renderDebts(ctxObj())
      : tab === 'invoices' ? renderInvoices(ctxObj())
      : tab === 'bills' ? renderBills(ctxObj())
      : tab === 'reports' ? renderReports(ctxObj())
      : tab === 'loans' ? renderLoansView(ctxObj(), finApi())
      : tab === 'forecast' ? renderForecastView(ctxObj(), finApi())
      : tab === 'studio' ? renderDesignerView(ctxObj(), finApi())
      : tab === 'insights' ? renderInsightsView(ctxObj(), finApi())
      : renderSettings(ctxObj());

    root.innerHTML = `
      <header class="fin-hero">
        <div class="fin-logo">💰</div>
        <div class="fin-hero-text">
          <h2>سوپراپ مالی</h2>
          <p class="fin-hero-sub">${helpers.txs.length} تراکنش • ${helpers.accounts.length} حساب • ${helpers.budgets.length} بودجه فعال</p>
        </div>
        <div class="fin-hero-side">
          ${state.lastAction ? `<button class="fin-btn fin-btn-sm" data-action="undo">↩ بازگشت حذف</button>` : ''}
        </div>
      </header>
      <nav class="fin-tabs" role="tablist">
        ${FIN_TABS.map((t) => `<button class="fin-tab ${tab === t.id ? 'is-active' : ''}" role="tab" data-action="tab" data-tab="${t.id}">${t.icon} ${t.title}</button>`).join('')}
      </nav>
      <div class="fin-body" data-fin-body>${body}</div>
      <div data-modal-root></div>
      <div data-toast-root></div>`;
    afterModuleRender();
  }

  function ctxObj() {
    const fiscalStart = Number(state.settings.fiscalStart) || 1;
    return { helpers, state, fiscalStart, window: financeWindow(fiscalStart) };
  }

  function finApi() {
    return {
      ctx: ctxObj(), root, toast, openModal, closeModal, refresh, renderContent,
      gotoTab: (tab) => { state.activeTab = tab; renderContent(); },
    };
  }

  function afterModuleRender() {
    try {
      if (state.activeTab === 'loans') afterLoansRender(root, ctxObj());
      else if (state.activeTab === 'forecast') afterForecastRender(root, ctxObj());
      else if (state.activeTab === 'studio') afterDesignerRender(root, ctxObj());
      else if (state.activeTab === 'insights') afterInsightsRender(root, ctxObj());
    } catch { /* ignore */ }
  }

  /* ---------- مودال ---------- */

  function openModal(html) {
    closeModal();
    root.querySelector('[data-modal-root]').innerHTML = html;
    const first = root.querySelector('.fin-modal input, .fin-modal select, .fin-modal textarea');
    if (first) setTimeout(() => first.focus?.(), 50);
  }

  function closeModal() {
    const m = root.querySelector('[data-modal-root]');
    if (m) m.innerHTML = '';
  }

  function toast(msg, ms = 3500) {
    const host = root.querySelector('[data-toast-root]');
    if (!host) return;
    host.innerHTML = `<div class="fin-toast">${escapeHtml(msg)}</div>`;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { if (host.isConnected) host.innerHTML = ''; }, ms);
  }

  /* ================================================================== */
  /* رویدادها                                                              */
  /* ================================================================== */

  function onClick(e) {
    // بستن مودال: دکمه ✕ / انصراف / کلیک روی اورلی
    const closer = e.target.closest('[data-close-modal]');
    if (closer) {
      const panel = e.target.closest('.fin-modal');
      if (!panel || closer.classList.contains('modal-x') || closer.tagName === 'BUTTON') {
        closeModal();
        return;
      }
    }

    // تغییر نوع تراکنش داخل مودال
    const typeBtn = e.target.closest('[data-tx-type]');
    if (typeBtn) {
      const form = typeBtn.closest('form');
      const draft = readForm(form);
      draft.type = typeBtn.dataset.txType;
      const existing = form.dataset.id ? helpers.txs.find((t) => t.id === form.dataset.id) : null;
      const txDraft = draftToTx(draft);
      openModal(txModal(helpers, {
        type: txDraft.type,
        existing: existing ? { ...existing, ...txDraft } : null,
        template: existing ? null : txDraft,
      }));
      return;
    }

    // مبالغ سریع
    const quick = e.target.closest('.fin-quick');
    if (quick) {
      const form = quick.closest('form');
      form.querySelector('input[name="amount"]').value = quick.dataset.amount;
      return;
    }

    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id || '';
    handleAction(action, el, id).catch((err) => toast(`❌ ${err?.message || err}`));
  }

  function onChange(e) {
    if (e.target.matches && (e.target.matches('[data-ln]') || e.target.matches('[data-ds]') || e.target.matches('[data-iz]'))) {
      const api = finApi();
      if (handleLoansChange(e.target, api)) return;
      if (handleDesignerChange(e.target, api)) return;
      if (handleInsightsChange(e.target, api)) return;
      return;
    }
    const filter = e.target.closest('[data-filter]');
    if (filter) {
      const key = filter.dataset.filter;
      if (key === 'view') {
        applyView(filter.value);
        return;
      }
      state.txFilters[key] = filter.value;
      state.txPage = 1;
      state.activeViewId = '';
      refresh();
      return;
    }
    const check = e.target.closest('[data-action="tx-check"]');
    if (check) {
      if (check.checked) state.selectedTx.add(check.dataset.id);
      else state.selectedTx.delete(check.dataset.id);
      refresh();
      return;
    }
    const setting = e.target.closest('[data-setting]');
    if (setting) {
      saveSettingInput(setting);
      return;
    }
    const widgetToggle = e.target.closest('[data-widget-toggle]');
    if (widgetToggle) {
      const widgets = state.settings.widgets.map((w) => (w.id === widgetToggle.dataset.widgetToggle ? { ...w, visible: widgetToggle.checked } : w));
      state.settings = saveFinanceSettings({ widgets });
      helpers = getFinanceHelpers(state.bundle, state.settings);
      toast(widgetToggle.checked ? 'ویجت روشن شد.' : 'ویجت خاموش شد.');
      return;
    }
    // تغییر فایل ایمپورت → پیش‌نمایش
    const fileInput = e.target.closest('form[data-form="import"] input[name="file"]');
    if (fileInput && fileInput.files?.[0]) {
      previewImport(fileInput.files[0]);
    }
  }

  function onInput(e) {
    const search = e.target.closest('[data-filter="q"]');
    if (search) {
      clearTimeout(search._t);
      search._t = setTimeout(() => {
        state.txFilters.q = search.value;
        state.txPage = 1;
        const body = root.querySelector('[data-fin-body]');
        if (body && state.activeTab === 'txs') {
          body.innerHTML = renderTxs(ctxObj());
          const again = body.querySelector('[data-filter="q"]');
          if (again) {
            again.focus();
            again.setSelectionRange(again.value.length, again.value.length);
          }
        }
      }, 350);
    }
  }

  function onSubmit(e) {
    const form = e.target.closest('form[data-form]');
    if (!form || !root.contains(form)) return;
    e.preventDefault();
    handleForm(form.dataset.form, form).catch((err) => toast(`❌ ${err?.message || err}`));
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      if (root.querySelector('.fin-modal')) {
        e.stopPropagation();
        closeModal();
      }
    }
  }

  async function previewImport(file) {
    try {
      const text = await file.text();
      const { rows, errors } = parseTxCSV(text);
      const host = root.querySelector('[data-import-preview]');
      if (host) {
        host.innerHTML = `<div class="fin-hint">✅ ${rows.length} ردیف معتبر${errors.length ? ` • ⚠️ ${errors.length} خطا (مثل: ${escapeHtml(errors[0])})` : ''}</div>`;
      }
    } catch {
      /* ignore */
    }
  }

  /* ---------- اکشن‌ها ---------- */

  async function handleAction(action, el, id) {
    if (action === 'iz-tx-attach') {
      setAttTarget(id);
      try {
        const raw = JSON.parse(localStorage.getItem('ViXoRa:fin-insights-ui') || '{}');
        raw.view = 'attach';
        localStorage.setItem('ViXoRa:fin-insights-ui', JSON.stringify(raw));
      } catch { /* ignore */ }
      state.activeTab = 'insights';
      renderContent();
      toast('🧾 حالا «➕ افزودن رسید» را بزن یا از کارت تراکنش اقدام کن.');
      return;
    }
    if (action.startsWith('ln-') || action.startsWith('fc-') || action.startsWith('ds-') || action.startsWith('iz-')) {
      const api = finApi();
      let handled = false;
      if (action.startsWith('ln-')) handled = await handleLoansAction(action, el, api);
      else if (action.startsWith('fc-')) handled = await handleForecastAction(action, el, api);
      else if (action.startsWith('ds-')) handled = await handleDesignerAction(action, el, api);
      else handled = await handleInsightsAction(action, el, api);
      if (handled) return;
    }
    switch (action) {
      case 'retry-boot': return boot();
      case 'tab':
        state.activeTab = el.dataset.tab;
        renderContent();
        return;
      case 'goto':
        state.activeTab = el.dataset.tab;
        renderContent();
        return;
      case 'undo': return doUndo();

      /* --- تراکنش --- */
      case 'open-tx-modal': return openModal(txModal(helpers, { type: el.dataset.type || 'expense' }));
      case 'edit-tx': {
        const t = helpers.txs.find((x) => x.id === id);
        if (t) openModal(txModal(helpers, { existing: t }));
        return;
      }
      case 'dup-tx':
        await duplicateTx(id);
        toast('کپی تراکنش ثبت شد.');
        return refresh();
      case 'del-tx': {
        const t = helpers.txs.find((x) => x.id === id);
        if (!t) return;
        return openModal(confirmModal({
          title: '🗑 حذف تراکنش',
          body: `<p>«${escapeHtml(t.title)}» حذف شود؟</p>`,
          action: 'del-tx-yes',
          id,
        }));
      }
      case 'del-tx-yes': {
        const t = helpers.txs.find((x) => x.id === id);
        await deleteTx(id);
        state.lastAction = t ? { kind: 'tx', item: { ...t } } : null;
        closeModal();
        toast('تراکنش حذف شد.');
        return refresh();
      }
      case 'toggle-select':
        state.selectMode = !state.selectMode;
        state.selectedTx.clear();
        return refresh();
      case 'bulk-delete': {
        if (!state.selectedTx.size) return;
        return openModal(confirmModal({
          title: '🗑 حذف گروهی',
          body: `<p>${state.selectedTx.size} تراکنش حذف شود؟ این عمل قابل بازگشت نیست.</p>`,
          action: 'bulk-delete-yes',
        }));
      }
      case 'bulk-delete-yes': {
        const n = await bulkDeleteTxs([...state.selectedTx]);
        state.selectedTx.clear();
        state.selectMode = false;
        closeModal();
        toast(`${n} تراکنش حذف شد.`);
        return refresh();
      }
      case 'bulk-categorize':
        return openModal(promptModal({
          title: '🏷 تغییر دسته گروهی',
          action: 'bulk-categorize-go',
          label: 'دسته جدید',
          options: [{ value: '', label: '— بدون دسته —' }, ...helpers.categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))],
        }));
      case 'save-view': {
        const name = prompt('نام این نما:');
        if (!name?.trim()) return;
        await createSavedView({ name: name.trim(), filter: { ...state.txFilters } });
        toast('نما ذخیره شد. 📌');
        return refresh();
      }
      case 'clear-filters':
        state.txFilters = { q: '', type: 'all', categoryId: 'all', accountId: 'all', tag: 'all', from: '', to: '', sort: 'newest', group: 'day', period: 'all' };
        state.activeViewId = '';
        state.txPage = 1;
        return refresh();
      case 'tx-page':
        state.txPage += Number(el.dataset.dir);
        return refresh();

      /* --- قالب‌ها --- */
      case 'open-tpl-modal': return openModal(templatesModal(helpers));
      case 'tpl-apply':
        await applyTemplate(id);
        closeModal();
        toast('تراکنش از قالب ثبت شد. ⚡');
        return refresh();
      case 'tpl-del':
        await deleteTemplate(id);
        await refresh(false);
        openModal(templatesModal(helpers));
        return;

      /* --- CSV --- */
      case 'export-csv': {
        const csv = txsToCSV(helpers.txs, { catMap: helpers.catById, accMap: helpers.accountById });
        downloadTextFile(csv, 'vixora-transactions.csv', 'text/csv');
        toast('فایل CSV دانلود شد.');
        return;
      }
      case 'open-import-modal': return openModal(importModal(helpers.accounts, helpers.categories));

      /* --- بودجه --- */
      case 'open-budget-modal': return openModal(budgetModal(helpers));
      case 'edit-budget': {
        const b = helpers.budgets.find((x) => x.id === id);
        if (b) openModal(budgetModal(helpers, b));
        return;
      }
      case 'del-budget':
        return openModal(confirmModal({ title: 'حذف بودجه', body: '<p>این بودجه حذف شود؟</p>', action: 'del-budget-yes', id }));
      case 'del-budget-yes':
        await deleteBudget(id);
        closeModal();
        return refresh();

      /* --- هدف --- */
      case 'open-goal-modal': return openModal(goalModal(helpers));
      case 'edit-goal': {
        const g = helpers.goals.find((x) => x.id === id);
        if (g) openModal(goalModal(helpers, g));
        return;
      }
      case 'del-goal':
        return openModal(confirmModal({ title: 'حذف هدف', body: '<p>این هدف حذف شود؟</p>', action: 'del-goal-yes', id }));
      case 'del-goal-yes':
        await deleteGoal(id);
        closeModal();
        return refresh();
      case 'goal-contrib':
        return openModal(moneyModal({ title: '💰 واریز به هدف', action: 'goal-contrib-go', id, accounts: helpers.accounts, accountLabel: 'برداشت از حساب (اختیاری)' }));
      case 'goal-withdraw':
        return openModal(moneyModal({ title: 'برداشت از هدف', action: 'goal-withdraw-go', id, accounts: helpers.accounts, accountLabel: 'واریز به حساب (اختیاری)' }));

      /* --- بدهی --- */
      case 'open-debt-modal': return openModal(debtModal(helpers));
      case 'edit-debt': {
        const d = helpers.debts.find((x) => x.id === id);
        if (d) openModal(debtModal(helpers, d));
        return;
      }
      case 'del-debt':
        return openModal(confirmModal({ title: 'حذف مورد', body: '<p>این مورد حذف شود؟</p>', action: 'del-debt-yes', id }));
      case 'del-debt-yes':
        await deleteDebt(id);
        closeModal();
        return refresh();
      case 'debt-pay':
        return openModal(moneyModal({ title: '💵 ثبت پرداخت', action: 'debt-pay-go', id, accounts: helpers.accounts, accountLabel: 'حساب بانکی (اختیاری)' }));

      /* --- فاکتور --- */
      case 'open-invoice-modal': return openModal(invoiceModal(helpers));
      case 'edit-invoice': {
        const d = helpers.invoices.find((x) => x.id === id);
        if (d) openModal(invoiceModal(helpers, d));
        return;
      }
      case 'del-invoice':
        return openModal(confirmModal({ title: 'حذف فاکتور', body: '<p>این فاکتور حذف شود؟</p>', action: 'del-invoice-yes', id }));
      case 'del-invoice-yes':
        await deleteInvoiceDoc(id);
        closeModal();
        return refresh();
      case 'inv-add-row': {
        const host = root.querySelector('[data-inv-items]');
        if (host) host.insertAdjacentHTML('beforeend', invItemRowHtml());
        return;
      }
      case 'inv-del-row': {
        const row = el.closest('[data-inv-row]');
        const host = root.querySelector('[data-inv-items]');
        if (row && host && host.children.length > 1) row.remove();
        else toast('حداقل یک قلم لازم است.');
        return;
      }
      case 'invoice-print': {
        const d = helpers.invoices.find((x) => x.id === id);
        if (!d) return;
        return openModal(`<div class="modal-overlay fin-modal-overlay" data-close-modal>
          <div class="modal-panel fin-modal fin-modal-wide" role="dialog" aria-modal="true">
            <div class="modal-head"><h3>🖨 پیش‌نمایش چاپ</h3><button class="modal-x" data-close-modal>✕</button></div>
            <div class="modal-body">${renderInvoicePrint(d, state.settings)}
              <div class="modal-actions fin-no-print">
                <button class="fin-btn" data-close-modal>بستن</button>
                <button class="fin-btn fin-btn-primary" data-action="invoice-print-go">🖨 چاپ</button>
              </div>
            </div>
          </div>
        </div>`);
      }
      case 'invoice-print-go':
        window.print();
        return;
      case 'invoice-collect': {
        const d = helpers.invoices.find((x) => x.id === id);
        if (!d) return;
        return openModal(`<div class="modal-overlay fin-modal-overlay" data-close-modal>
          <div class="modal-panel fin-modal" role="dialog" aria-modal="true">
            <div class="modal-head"><h3>💰 وصول فاکتور ${escapeHtml(d.number)}</h3><button class="modal-x" data-close-modal>✕</button></div>
            <div class="modal-body"><form class="fin-form" data-form="invoice-collect-go" data-id="${d.id}">
              <label>واریز به حساب*<select class="fin-input" name="accountId">${helpers.accounts.map((a) => `<option value="${a.id}" ${d.accountId === a.id ? 'selected' : ''}>${escapeHtml(a.icon)} ${escapeHtml(a.name)}</option>`).join('')}</select></label>
              <div class="modal-actions">
                <button type="button" class="fin-btn" data-close-modal>انصراف</button>
                <button type="submit" class="fin-btn fin-btn-primary">ثبت وصول</button>
              </div>
            </form></div>
          </div>
        </div>`);
      }

      /* --- قبض / دوره‌ای / قانون --- */
      case 'open-bill-modal': return openModal(billModal(helpers));
      case 'edit-bill': {
        const b = helpers.bills.find((x) => x.id === id);
        if (b) openModal(billModal(helpers, b));
        return;
      }
      case 'del-bill':
        return openModal(confirmModal({ title: 'حذف قبض', body: '<p>این قبض حذف شود؟</p>', action: 'del-bill-yes', id }));
      case 'del-bill-yes':
        await deleteBill(id);
        closeModal();
        return refresh();
      case 'bill-pay': {
        const b = helpers.bills.find((x) => x.id === id);
        return openModal(moneyModal({ title: `💵 پرداخت ${b?.title || 'قبض'}`, action: 'bill-pay-go', id, amount: b?.expected || '', accounts: helpers.accounts, accountLabel: 'پرداخت از حساب' }));
      }
      case 'open-rec-modal': return openModal(recurringModal(helpers));
      case 'edit-rec': {
        const r = helpers.recurrings.find((x) => x.id === id);
        if (r) openModal(recurringModal(helpers, r));
        return;
      }
      case 'del-rec':
        return openModal(confirmModal({ title: 'حذف تراکنش دوره‌ای', body: '<p>این مورد حذف شود؟</p>', action: 'del-rec-yes', id }));
      case 'del-rec-yes':
        await deleteRecurring(id);
        closeModal();
        return refresh();
      case 'open-rule-modal': return openModal(ruleModal(helpers));
      case 'del-rule':
        await deleteRule(id);
        toast('قانون حذف شد.');
        return refresh();

      /* --- گزارش --- */
      case 'report-chart':
        state.reportChart = el.dataset.v;
        return refresh();
      case 'report-period':
        state.reportPeriod = el.dataset.v;
        return refresh();

      /* --- تنظیمات --- */
      case 'open-account-modal': return openModal(accountModal(helpers));
      case 'edit-account': {
        const a = helpers.accounts.find((x) => x.id === id);
        if (a) openModal(accountModal(helpers, a));
        return;
      }
      case 'del-account': {
        const a = helpers.accounts.find((x) => x.id === id);
        return openModal(confirmModal({ title: 'حذف حساب', body: `<p>حساب «${escapeHtml(a?.name || '')}» حذف شود؟</p>`, action: 'del-account-yes', id }));
      }
      case 'del-account-yes':
        await deleteAccount(id);
        closeModal();
        toast('حساب حذف شد.');
        return refresh();
      case 'open-cat-modal': return openModal(categoryModal(helpers));
      case 'edit-cat': {
        const c = helpers.categories.find((x) => x.id === id);
        if (c) openModal(categoryModal(helpers, c));
        return;
      }
      case 'del-cat': {
        const c = helpers.categories.find((x) => x.id === id);
        return openModal(confirmModal({ title: 'حذف دسته', body: `<p>دسته «${escapeHtml(c?.name || '')}» حذف شود؟</p>`, action: 'del-cat-yes', id }));
      }
      case 'del-cat-yes':
        await deleteCategory(id);
        closeModal();
        toast('دسته حذف شد.');
        return refresh();
      case 'widget-move': {
        const widgets = [...state.settings.widgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const i = widgets.findIndex((w) => w.id === id);
        const j = i + Number(el.dataset.dir);
        if (i < 0 || j < 0 || j >= widgets.length) return;
        [widgets[i], widgets[j]] = [widgets[j], widgets[i]];
        widgets.forEach((w, k) => { w.order = k; });
        state.settings = saveFinanceSettings({ widgets });
        helpers = getFinanceHelpers(state.bundle, state.settings);
        return refresh();
      }
      case 'export-json': {
        const data = await exportFinance();
        downloadTextFile(JSON.stringify(data, null, 2), `vixora-finance-backup-${toLocalDateInput(new Date().toISOString())}.json`, 'application/json');
        toast('بکاپ دانلود شد.');
        return;
      }
      case 'open-restore-modal': return openModal(restoreModal());
      case 'gen-demo':
        return openModal(confirmModal({ title: '🎲 داده نمایشی', body: '<p>حدود ۲۰۰ تراکنش ۳ ماه اخیر + بودجه، هدف، بدهی، قبض و فاکتور نمونه ساخته شود؟</p>', action: 'gen-demo-yes' }));
      case 'gen-demo-yes':
        closeModal();
        toast('در حال ساخت داده نمایشی…');
        await generateDemoData();
        toast('داده نمایشی ساخته شد! 🎉');
        return refresh();
      case 'wipe-data':
        return openModal(confirmModal({ title: '🗑 پاک‌سازی کامل', body: '<p><b>همه</b> داده‌های مالی (تراکنش‌ها، بودجه‌ها، اهداف، فاکتورها و…) برای همیشه حذف می‌شود. مطمئنی؟</p>', action: 'wipe-data-yes' }));
      case 'wipe-data-yes':
        await wipeFinanceData();
        closeModal();
        state.lastAction = null;
        await ensureFinanceDefaults();
        toast('همه داده‌ها پاک شد.');
        return refresh();
    }
  }

  /* ---------- فرم‌ها ---------- */

  async function handleForm(kind, form) {
    const draft = readForm(form);
    const id = form.dataset.id || '';
    switch (kind) {
      case 'tx': {
        const payload = draftToTx(draft);
        if (!payload.categoryId && payload.type !== 'transfer') {
          const auto = suggestCategoryId(payload.title, helpers.rules);
          if (auto) payload.categoryId = auto;
        }
        if (id) {
          await updateTx(id, payload);
          toast('تراکنش به‌روز شد.');
        } else {
          await createTx(payload);
          toast('تراکنش ثبت شد. ✅');
        }
        closeModal();
        return refresh();
      }
      case 'budget': {
        const payload = { categoryId: draft.categoryId, amount: Number(draft.amount) || 0, rollover: !!draft.rollover };
        if (id) await updateBudget(id, payload);
        else await createBudget(payload);
        closeModal();
        toast('بودجه ذخیره شد.');
        return refresh();
      }
      case 'goal': {
        const payload = {
          title: draft.title, icon: draft.icon || '🌟', color: draft.color,
          target: Number(draft.target) || 0, saved: Number(draft.saved) || 0,
          deadline: draft.deadline || '', note: draft.note || '',
        };
        if (id) await updateGoal(id, payload);
        else await createGoal(payload);
        closeModal();
        toast('هدف ذخیره شد.');
        return refresh();
      }
      case 'goal-contrib-go':
        await contributeGoal(id, { amount: Number(draft.amount) || 0, accountId: draft.accountId, note: draft.note });
        closeModal();
        toast('واریز ثبت شد. 💰');
        return refresh();
      case 'goal-withdraw-go':
        await withdrawGoal(id, { amount: Number(draft.amount) || 0, accountId: draft.accountId, note: draft.note });
        closeModal();
        toast('برداشت ثبت شد.');
        return refresh();
      case 'debt': {
        const payload = {
          debtType: draft.debtType, person: draft.person, title: draft.title || '',
          total: Number(draft.total) || 0, dueDate: draft.dueDate || '',
          months: Number(draft.months) || 0, monthlyAmount: Number(draft.monthlyAmount) || 0,
          note: draft.note || '',
        };
        if (id) await updateDebt(id, payload);
        else await createDebt(payload);
        closeModal();
        toast('ثبت شد.');
        return refresh();
      }
      case 'debt-pay-go':
        await payDebt(id, { amount: Number(draft.amount) || 0, accountId: draft.accountId, note: draft.note });
        closeModal();
        toast('پرداخت ثبت شد.');
        return refresh();
      case 'invoice': {
        const items = [...form.querySelectorAll('[data-inv-row]')].map((row) => ({
          desc: row.querySelector('[data-cell="desc"]').value.trim(),
          qty: Number(row.querySelector('[data-cell="qty"]').value) || 0,
          price: Number(row.querySelector('[data-cell="price"]').value) || 0,
        })).filter((i) => i.desc);
        const payload = {
          customer: draft.customer, status: draft.status,
          date: draft.date || new Date().toISOString(), dueDate: draft.dueDate || '',
          items, discount: Number(draft.discount) || 0, taxPercent: Number(draft.taxPercent) || 0,
          accountId: draft.accountId || '', note: draft.note || '',
        };
        if (id) await updateInvoiceDoc(id, payload);
        else await createInvoiceDoc(payload);
        closeModal();
        toast('فاکتور ذخیره شد. 📄');
        return refresh();
      }
      case 'invoice-collect-go':
        await collectInvoice(id, { accountId: draft.accountId });
        closeModal();
        toast('فاکتور وصول شد. 💰');
        return refresh();
      case 'bill': {
        const payload = {
          title: draft.title, icon: draft.icon || '💡', dueDay: Number(draft.dueDay) || 1,
          expected: Number(draft.expected) || 0, categoryId: draft.categoryId || '',
          accountId: draft.accountId || '', active: !!draft.active,
        };
        if (id) await updateBill(id, payload);
        else await createBill(payload);
        closeModal();
        toast('قبض ذخیره شد.');
        return refresh();
      }
      case 'bill-pay-go':
        await payBill(id, { amount: Number(draft.amount) || 0, accountId: draft.accountId, note: draft.note });
        closeModal();
        toast('پرداخت قبض ثبت شد.');
        return refresh();
      case 'recurring': {
        const payload = {
          title: draft.title, type: draft.type, amount: Number(draft.amount) || 0,
          accountId: draft.accountId, categoryId: draft.categoryId || '',
          frequency: draft.frequency, customDays: Number(draft.customDays) || 30,
          nextRun: draft.nextRun || new Date().toISOString(), active: !!draft.active,
        };
        if (id) await updateRecurring(id, payload);
        else await createRecurring(payload);
        closeModal();
        toast('تراکنش دوره‌ای ذخیره شد. 🔁');
        try {
          await processRecurrings();
          await refresh(false);
        } catch {
          /* ignore */
        }
        return refresh();
      }
      case 'rule':
        await createRule({ keyword: draft.keyword, categoryId: draft.categoryId });
        closeModal();
        toast('قانون ثبت شد. 🤖');
        return refresh();
      case 'account': {
        const payload = { name: draft.name, accType: draft.accType, icon: draft.icon, initial: Number(draft.initial) || 0 };
        if (id) await updateAccount(id, payload);
        else await createAccount(payload);
        closeModal();
        toast('حساب ذخیره شد.');
        return refresh();
      }
      case 'category': {
        const payload = { name: draft.name, type: draft.type, icon: draft.icon || '🏷', color: draft.color };
        if (id) await updateCategory(id, payload);
        else await createCategory(payload);
        closeModal();
        toast('دسته ذخیره شد.');
        return refresh();
      }
      case 'template':
        await createTemplate({ title: draft.title, amount: Number(draft.amount) || 0, type: draft.type, icon: draft.icon || '⚡', accountId: draft.accountId || '', categoryId: draft.categoryId || '' });
        await refresh(false);
        openModal(templatesModal(helpers));
        toast('قالب ساخته شد.');
        return;
      case 'bulk-categorize-go':
        await bulkUpdateTxs([...state.selectedTx], { categoryId: draft.value || '' });
        state.selectedTx.clear();
        state.selectMode = false;
        closeModal();
        toast('دسته تراکنش‌ها تغییر کرد.');
        return refresh();
      case 'import': {
        const file = form.querySelector('input[name="file"]').files?.[0];
        if (!file) throw new Error('فایلی انتخاب نشده.');
        const text = await file.text();
        const { rows, errors } = parseTxCSV(text);
        if (!rows.length) throw new Error(errors[0] || 'ردیف معتبری در فایل نیست.');
        const catByName = new Map(helpers.categories.map((c) => [c.name.trim(), c.id]));
        const accByName = new Map(helpers.accounts.map((a) => [a.name.trim(), a.id]));
        const n = await importParsedRows(rows, { defaultAccountId: draft.defaultAccountId, defaultCategoryId: draft.defaultCategoryId || '', catByName, accByName });
        closeModal();
        toast(`${n} تراکنش ایمپورت شد.${errors.length ? ` (${errors.length} سطر خطا)` : ''}`);
        return refresh();
      }
      case 'restore': {
        const file = form.querySelector('input[name="file"]').files?.[0];
        if (!file) throw new Error('فایلی انتخاب نشده.');
        const text = await file.text();
        const n = await importFinance(text);
        closeModal();
        toast(`${n} رکورد بازیابی شد.`);
        return refresh();
      }
    }
  }

  /* ---------- ابزار ---------- */

  function applyView(viewId) {
    const view = helpers.views.find((v) => v.id === viewId);
    if (!view) return;
    state.txFilters = { ...state.txFilters, ...(view.filter || {}) };
    state.activeViewId = viewId;
    state.txPage = 1;
    refresh();
    toast(`نمای «${view.name}» اعمال شد.`);
  }

  function saveSettingInput(input) {
    const key = input.dataset.setting;
    let value;
    if (input.type === 'checkbox') value = input.checked;
    else if (key === 'quickAmounts') {
      value = String(input.value).split(',').map((s) => Number(String(s).trim().replace(/[^0-9]/g, ''))).filter((n) => Number.isFinite(n) && n > 0).slice(0, 8);
      if (!value.length) {
        toast('مبالغ سریع معتبر نیست.');
        return;
      }
    } else if (key === 'decimals' || key === 'fiscalStart') value = Number(input.value);
    else value = input.value;
    state.settings = saveFinanceSettings({ [key]: value });
    helpers = getFinanceHelpers(state.bundle, state.settings);
    root.dataset.theme = state.settings.theme || 'emerald';
    root.dataset.density = state.settings.density || 'comfortable';
    toast('تنظیمات ذخیره شد.');
  }

  async function doUndo() {
    const last = state.lastAction;
    if (!last) return;
    try {
      if (last.kind === 'tx') {
        const { id, ...rest } = last.item;
        await createTx({ ...rest });
      }
      state.lastAction = null;
      toast('برگردانده شد. ↩');
      await refresh();
    } catch (err) {
      toast(`❌ ${err?.message || err}`);
    }
  }

  function readForm(form) {
    const data = {};
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) {
      if (data[k] !== undefined) continue;
      data[k] = typeof v === 'string' ? v.trim() : v;
    }
    // چک‌باکس‌های unchecked در FormData نیستند
    form.querySelectorAll('input[type="checkbox"][name]').forEach((c) => {
      data[c.name] = c.checked;
    });
    return data;
  }

  function draftToTx(d) {
    let at = new Date().toISOString();
    if (d.date) {
      const t = d.time || '12:00';
      const parsed = new Date(`${d.date}T${t}:00`);
      if (!Number.isNaN(parsed.getTime())) at = parsed.toISOString();
    }
    return {
      type: d.type || 'expense',
      amount: Number(d.amount) || 0,
      title: d.title || '',
      accountId: d.accountId || '',
      toAccountId: d.toAccountId || '',
      categoryId: d.categoryId || '',
      at,
      note: d.note || '',
      tags: String(d.tags || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean).slice(0, 10),
    };
  }

  /* ---------- اتصال / قطع ---------- */

  function attachListeners() {
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKey, true);

    if (ctx.store?.subscribe) {
      try {
        storeUnsub = ctx.store.subscribe(() => {
          /* فعلاً بدون واکنش خودکار */
        });
      } catch {
        /* ignore */
      }
    }
  }

  return {
    render,
    afterRender,
    destroy() {
      destroyed = true;
      clearTimeout(state.toastTimer);
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      root.removeEventListener('input', onInput);
      root.removeEventListener('submit', onSubmit);
      document.removeEventListener('keydown', onKey, true);
      if (typeof storeUnsub === 'function') {
        try {
          storeUnsub();
        } catch {
          /* ignore */
        }
      }
      closeModal();
    },
  };
}

export default { createInvoicesPage };

/* ---------- CSS یک‌بارمصرف ---------- */

function ensureCss() {
  let el = document.querySelector('style[data-fin-css]');
  if (!el) {
    el = document.createElement('style');
    el.setAttribute('data-fin-css', '1');
    el.textContent = invoicesCss;
    document.head.appendChild(el);
  }
  return el;
}
