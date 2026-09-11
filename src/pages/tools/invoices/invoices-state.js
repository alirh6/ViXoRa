// src/pages/tools/invoices/invoices-state.js

/**
 * State سوپراپ مالی — ۹ تب، فیلترها، انتخاب چندتایی، کش تنظیمات و باندل داده
 */

export const FIN_TABS = [
  { id: 'dashboard', title: 'خانه', icon: '🏠' },
  { id: 'txs', title: 'تراکنش‌ها', icon: '🧾' },
  { id: 'budgets', title: 'بودجه‌ها', icon: '🎯' },
  { id: 'goals', title: 'اهداف', icon: '🌟' },
  { id: 'debts', title: 'بدهی‌ها', icon: '🤝' },
  { id: 'invoices', title: 'فاکتورها', icon: '📄' },
  { id: 'bills', title: 'قبوض', icon: '💡' },
  { id: 'reports', title: 'گزارش‌ها', icon: '📊' },
  { id: 'loans', title: 'وام‌ها', icon: '🏦' },
  { id: 'forecast', title: 'پیش‌بینی', icon: '🔮' },
  { id: 'studio', title: 'استودیو فاکتور', icon: '🧾' },
  { id: 'insights', title: 'بینش', icon: '💡' },
  { id: 'settings', title: 'تنظیمات', icon: '⚙️' },
];

export function createFinanceState() {
  return {
    ready: false,
    activeTab: 'dashboard',
    bundle: null, // getFinanceBundle()
    settings: null,
    // --- تراکنش‌ها ---
    txFilters: {
      q: '',
      type: 'all', // all | income | expense | transfer
      categoryId: 'all',
      accountId: 'all',
      tag: 'all',
      from: '',
      to: '',
      sort: 'newest', // newest | oldest | amountDesc | amountAsc
      group: 'day', // day | none
      period: 'all', // all | today | week | month
    },
    activeViewId: '',
    selectedTx: new Set(),
    selectMode: false,
    txPage: 1,
    // --- گزارش‌ها ---
    reportPeriod: '6m', // 1m | 3m | 6m | 1y
    reportChart: 'cashflow', // cashflow | donut | networth | calendar
    // --- داخلی ---
    recurringNote: null,
    toastTimer: null,
    lastAction: null, // برای Undo حذف تکی تراکنش { kind:'tx', item }
  };
}

export function getFinanceHelpers(bundle, settings) {
  const txs = bundle?.txs || [];
  const accounts = bundle?.accounts || [];
  const categories = bundle?.categories || [];
  return {
    txs,
    accounts,
    categories,
    budgets: bundle?.budgets || [],
    goals: bundle?.goals || [],
    debts: bundle?.debts || [],
    recurrings: bundle?.recurrings || [],
    invoices: bundle?.invoices || [],
    bills: bundle?.bills || [],
    rules: bundle?.rules || [],
    views: bundle?.views || [],
    templates: bundle?.templates || [],
    accountById: new Map(accounts.map((a) => [a.id, a])),
    catById: new Map(categories.map((c) => [c.id, c])),
    settings,
  };
}
