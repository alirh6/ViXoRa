// src/pages/tools/customer/customer.js

import {
  getToolData,
  createToolItem,
  updateToolItem,
  deleteToolItem,
} from '../../../core/actions/tools-service.js';

const TOOL_NAME = 'customerInfo';
const PREFS_KEY = 'ViXoRa:customer:preferences';
const LOGS_KEY = 'ViXoRa:customer:logs';

export default function createCustomerPage(ctx) {
  // State محلی صفحه
  let customers = [];
  let logs = [];
  let prefs = {
    searchQuery: '',
    sortBy: 'alphabetical',
    viewMode: 'view-grid',
  };

  let selectedCustomerId = null;
  let selectedCustomerIds = [];

  // نگهداشت Listenerها برای پاکسازی کامل در destroy
  const boundHandlers = {};

  // --- مدیریت Preferences و لاگ‌ها ---
  function loadLocalData() {
    try {
      const savedPrefs = localStorage.getItem(PREFS_KEY);
      if (savedPrefs) {
        prefs = { ...prefs, ...JSON.parse(savedPrefs) };
      }
      const savedLogs = localStorage.getItem(LOGS_KEY);
      if (savedLogs) {
        logs = JSON.parse(savedLogs);
      }
    } catch (err) {
      console.error('[CustomerPage] Error loading local storage data:', err);
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (err) {
      console.error('[CustomerPage] Failed to save preferences:', err);
    }
  }

  function saveLog(actionType, message) {
    const log = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionType,
      message,
    };
    logs.unshift(log);
    if (logs.length > 30) logs.pop();
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error('[CustomerPage] Failed to save log:', err);
    }
  }

  // --- سیستم Toast اعلان ---
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.vcr-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `vcr-toast vcr-toast--${type}`;
    toast.innerHTML = `
      <div class="vcr-toast__icon">⚡</div>
      <div class="vcr-toast__content">
        <span class="vcr-toast__title">سیستم هوشمند ViXoRa</span>
        <span class="vcr-toast__message">${message}</span>
      </div>
      <div class="vcr-toast__progress"></div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3200);
  }

  // --- افکت کانفتی ---
  function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.className = 'vcr-confetti-canvas';
    document.body.appendChild(canvas);

    const canvasCtx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#00f0ff', '#bd00ff', '#ff007c', '#39ff14', '#ffeb3b'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 5 + 3,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
      });
    }

    let animationId;
    function draw() {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      let finished = true;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 1.5;
        p.x += Math.sin(p.tiltAngle) * 2;
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

        if (p.y < canvas.height) finished = false;

        canvasCtx.beginPath();
        canvasCtx.lineWidth = p.r;
        canvasCtx.strokeStyle = p.color;
        canvasCtx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        canvasCtx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        canvasCtx.stroke();
      });

      if (!finished) {
        animationId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animationId);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    }
    draw();
  }

  // --- موتور فیلتر و مرتب‌سازی ---
  function getProcessedCustomers() {
    let list = [...customers];

    const query = (prefs.searchQuery || '').toLowerCase().trim();
    if (query) {
      list = list
        .map((customer) => {
          let score = 0;
          const name = String(customer.name || '').toLowerCase();
          const lastName = String(customer.lastName || '').toLowerCase();
          const username = String(customer.username || '').toLowerCase();
          const email = String(customer.email || '').toLowerCase();
          const phone = String(customer.phoneNumber || '');
          const job = String(customer.job || '').toLowerCase();
          const address = String(customer.address || '').toLowerCase();
          const country = String(customer.country || '').toLowerCase();

          if (name.includes(query)) score += 100;
          if (lastName.includes(query)) score += 100;
          if (username.includes(query)) score += 80;
          if (email.includes(query)) score += 80;
          if (phone.includes(query)) score += 50;
          if (job.includes(query)) score += 50;
          if (address.includes(query)) score += 20;
          if (country.includes(query)) score += 20;

          return { customer, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.customer);
    }

    const sortVal = prefs.sortBy;
    list.sort((a, b) => {
      if (sortVal === 'alphabetical') {
        return (a.lastName || '').localeCompare(b.lastName || '', 'fa');
      }
      if (sortVal === 'inventory-desc') {
        return (Number(b.inventory) || 0) - (Number(a.inventory) || 0);
      }
      if (sortVal === 'inventory-asc') {
        return (Number(a.inventory) || 0) - (Number(b.inventory) || 0);
      }
      if (sortVal === 'plan-premium') {
        const planWeight = { plus: 5, pro: 4, eco: 3, gift: 2, free: 1 };
        return (planWeight[b.plan] || 0) - (planWeight[a.plan] || 0);
      }
      if (sortVal === 'has-avatar') {
        return (b.avatar ? 1 : 0) - (a.avatar ? 1 : 0);
      }
      return 0;
    });

    return list;
  }

  // --- به‌روزرسانی پنل آمار ---
  function updateInsights(list) {
    const statTotalEl = document.getElementById('vcr-stat-total');
    const statAvgEl = document.getElementById('vcr-stat-avg');
    const statPremiumEl = document.getElementById('vcr-stat-premium');
    const donutSegment = document.getElementById('vcr-donut-segment');
    const donutPct = document.getElementById('vcr-donut-percentage');
    const legendEl = document.getElementById('vcr-chart-legend');

    if (!list || list.length === 0) {
      if (statTotalEl) statTotalEl.textContent = '۰ تومان';
      if (statAvgEl) statAvgEl.textContent = '۰ تومان';
      if (statPremiumEl) statPremiumEl.textContent = '۰٪';
      if (donutSegment) donutSegment.setAttribute('stroke-dasharray', '0 100');
      if (donutPct) donutPct.textContent = '۰٪';
      if (legendEl) legendEl.innerHTML = '<span class="vcr-chart-legend__empty">داده‌ای ثبت نشده</span>';
      return;
    }

    const totalInventory = list.reduce((sum, c) => sum + (Number(c.inventory) || 0), 0);
    const avgInventory = Math.round(totalInventory / list.length) || 0;
    const premiumCount = list.filter((c) => ['pro', 'plus', 'gift'].includes(c.plan)).length;
    const premiumPercent = Math.round((premiumCount / list.length) * 100) || 0;

    if (statTotalEl) statTotalEl.textContent = `${new Intl.NumberFormat('fa-IR').format(totalInventory)} تومان`;
    if (statAvgEl) statAvgEl.textContent = `${new Intl.NumberFormat('fa-IR').format(avgInventory)} تومان`;
    if (statPremiumEl) statPremiumEl.textContent = `${premiumPercent}٪`;

    const planCounts = list.reduce((acc, c) => {
      const p = c.plan || 'free';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    const topPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0];

    if (topPlan && donutSegment && donutPct && legendEl) {
      const topPercentage = Math.round((topPlan[1] / list.length) * 100);
      donutSegment.setAttribute('stroke-dasharray', `${topPercentage} ${100 - topPercentage}`);
      donutPct.textContent = `${topPercentage}٪`;

      const planColors = {
        plus: 'var(--vcr-neon-cyan)',
        pro: 'var(--vcr-neon-purple)',
        eco: '#10b981',
        gift: '#f59e0b',
        free: '#64748b',
      };

      legendEl.innerHTML = Object.entries(planCounts)
        .slice(0, 3)
        .map(([plan, count]) => {
          const pct = Math.round((count / list.length) * 100);
          const color = planColors[plan] || 'var(--vcr-neon-cyan)';
          return `
            <div class="vcr-chart-legend__item">
              <span class="vcr-chart-legend__dot" style="background:${color};"></span>
              <span class="vcr-chart-legend__label">${plan.toUpperCase()}: ${pct}٪ (${count} نفر)</span>
            </div>`;
        })
        .join('');
    }
  }

  // --- رندر ویوهای ۳ گانه ---
  function renderGridView(list) {
    return list
      .map((c) => {
        const isChecked = selectedCustomerIds.includes(String(c.id)) ? 'checked' : '';
        const formattedInventory = new Intl.NumberFormat('fa-IR').format(c.inventory || 0);
        const nameLetter = (c.name || 'U').charAt(0).toUpperCase();
        const avatarHTML = c.avatar
          ? `<img class="vcr-custCard__avatar-img" src="${c.avatar}" alt="${c.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="vcr-custCard__avatar-placeholder" style="display:none;">${nameLetter}</div>`
          : `<div class="vcr-custCard__avatar-placeholder">${nameLetter}</div>`;

        return `
          <article class="vcr-custCard" data-id="${c.id}">
            <div class="vcr-custCard__checkbox-wrap">
              <input type="checkbox" value="${c.id}" class="vcr-batch-checkbox" ${isChecked}>
            </div>

            <span class="vcr-custPlan vcr-custPlan--${c.plan || 'free'}">${c.plan || 'free'}</span>
            
            <div class="vcr-custCard__header">
              <div class="vcr-custCard__avatar-wrap">
                ${avatarHTML}
              </div>
              <div class="vcr-custCard__meta">
                <h3 class="vcr-custCard__fullname">${c.name || ''} ${c.lastName || ''}</h3>
                <span class="vcr-custCard__username">@${c.username || 'user'}</span>
              </div>
            </div>

            <div class="vcr-custCard__details">
              <div class="vcr-custCard__row">
                <span class="vcr-custCard__label">شغل:</span>
                <span class="vcr-custCard__val">${c.job || 'ثبت نشده'}</span>
              </div>
              <div class="vcr-custCard__row">
                <span class="vcr-custCard__label">موجودی:</span>
                <span class="vcr-custCard__val vcr-custCard__val--accent">${formattedInventory} تومان</span>
              </div>
              <div class="vcr-custCard__row">
                <span class="vcr-custCard__label">موبایل:</span>
                <span class="vcr-custCard__val vcr-custCard__val--ltr">${c.phoneNumber || '---'}</span>
              </div>
              <div class="vcr-custCard__row">
                <span class="vcr-custCard__label">آدرس:</span>
                <span class="vcr-custCard__val vcr-custCard__val--truncate" title="${c.address || ''}">${c.address || 'ثبت نشده'}</span>
              </div>
            </div>

            <div class="vcr-custCard__actions">
              <button class="vcr-btn vcr-btn--danger-ghost vcr-custCard__btn" data-action="delete">حذف</button>
              <button class="vcr-btn vcr-btn--primary-ghost vcr-custCard__btn" data-action="edit">ویرایش</button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function renderTableView(list) {
    const allSelected = list.length > 0 && list.every((c) => selectedCustomerIds.includes(String(c.id)));
    const tableHeader = `
      <div class="vcr-table-wrapper">
        <table class="vcr-table">
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" id="vcr-select-all" ${allSelected ? 'checked' : ''} /></th>
              <th>پروفایل</th>
              <th>نام و نام خانوادگی</th>
              <th>یوزرنیم</th>
              <th>موبایل</th>
              <th>شغل</th>
              <th>موجودی (تومان)</th>
              <th style="text-align: center;">عملیات</th>
            </tr>
          </thead>
          <tbody>
    `;

    const rows = list
      .map((c) => {
        const isChecked = selectedCustomerIds.includes(String(c.id)) ? 'checked' : '';
        const formattedInventory = new Intl.NumberFormat('fa-IR').format(c.inventory || 0);
        const nameLetter = (c.name || 'U').charAt(0).toUpperCase();
        const avatarHTML = c.avatar
          ? `<img class="vcr-table__avatar-img" src="${c.avatar}" alt="${c.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="vcr-table__avatar-placeholder" style="display:none;">${nameLetter}</div>`
          : `<div class="vcr-table__avatar-placeholder">${nameLetter}</div>`;

        return `
          <tr data-id="${c.id}">
            <td><input type="checkbox" value="${c.id}" class="vcr-batch-checkbox" ${isChecked} /></td>
            <td><div class="vcr-table__avatar-wrap">${avatarHTML}</div></td>
            <td class="vcr-table__name">${c.name || ''} ${c.lastName || ''}</td>
            <td class="vcr-table__username">@${c.username || 'user'}</td>
            <td class="vcr-table__phone">${c.phoneNumber || '---'}</td>
            <td>${c.job || 'ثبت نشده'}</td>
            <td class="vcr-table__inventory">${formattedInventory}</td>
            <td>
              <div class="vcr-table__actions">
                <button class="vcr-btn vcr-btn--icon vcr-btn--edit" data-action="edit" title="ویرایش">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="vcr-btn vcr-btn--icon vcr-btn--delete" data-action="delete" title="حذف">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    return `${tableHeader}${rows}</tbody></table></div>`;
  }

  function renderSplitView(list) {
    if ((!selectedCustomerId || !list.some((c) => String(c.id) === String(selectedCustomerId))) && list.length > 0) {
      selectedCustomerId = list[0].id;
    }

    const activeCustomer = list.find((c) => String(c.id) === String(selectedCustomerId)) || list[0];

    const sidebarHtml = list
      .map((c) => {
        const isActive = String(c.id) === String(activeCustomer.id) ? 'active' : '';
        const nameLetter = (c.name || 'U').charAt(0).toUpperCase();
        return `
          <div class="vcr-split-item ${isActive}" data-id="${c.id}" data-action="select-split">
            <div class="vcr-split-item__avatar">
              ${
                c.avatar
                  ? `<img src="${c.avatar}" alt="${c.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="vcr-split-item__placeholder" style="display:none;">${nameLetter}</div>`
                  : `<div class="vcr-split-item__placeholder">${nameLetter}</div>`
              }
            </div>
            <div class="vcr-split-item__info">
              <span class="vcr-split-item__title">${c.name || ''} ${c.lastName || ''}</span>
              <span class="vcr-split-item__sub">@${c.username || 'user'} | ${c.job || '---'}</span>
            </div>
          </div>
        `;
      })
      .join('');

    const formattedInventory = new Intl.NumberFormat('fa-IR').format(activeCustomer.inventory || 0);
    const activeLetter = (activeCustomer.name || 'U').charAt(0).toUpperCase();

    const logsHtml =
      logs.length > 0
        ? logs
            .slice(0, 4)
            .map(
              (l) => `
            <div class="vcr-timeline-item">
              <span class="vcr-timeline-item__dot"></span>
              <div class="vcr-timeline-item__content">
                <span class="vcr-timeline-item__time">${l.time}</span>
                <span class="vcr-timeline-item__msg">${l.message}</span>
              </div>
            </div>`
            )
            .join('')
        : `<span class="vcr-timeline-empty">هیچ رخدادی ثبت نشده است.</span>`;

    const detailPaneHtml = `
      <div class="vcr-split-detail-pane" data-id="${activeCustomer.id}">
        <div class="vcr-pane-card">
          <div class="vcr-pane-card__header">
            <div class="vcr-pane-card__avatar-wrap">
              ${
                activeCustomer.avatar
                  ? `<img class="vcr-pane-card__avatar-img" src="${activeCustomer.avatar}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="vcr-pane-card__avatar-placeholder" style="display:none;">${activeLetter}</div>`
                  : `<div class="vcr-pane-card__avatar-placeholder">${activeLetter}</div>`
              }
            </div>
            <div class="vcr-pane-card__meta">
              <h2 class="vcr-pane-card__title">${activeCustomer.name || ''} ${activeCustomer.lastName || ''}</h2>
              <span class="vcr-pane-card__username">@${activeCustomer.username || 'user'}</span>
            </div>
            <span class="vcr-custPlan vcr-custPlan--${activeCustomer.plan || 'free'}">${activeCustomer.plan || 'free'}</span>
          </div>

          <div class="vcr-pane-grid">
            <div class="vcr-pane-grid__item">
              <span class="vcr-pane-grid__label">موجودی حساب:</span>
              <span class="vcr-pane-grid__val vcr-pane-grid__val--highlight">${formattedInventory} تومان</span>
            </div>
            <div class="vcr-pane-grid__item">
              <span class="vcr-pane-grid__label">شغل:</span>
              <span class="vcr-pane-grid__val">${activeCustomer.job || 'ثبت نشده'}</span>
            </div>
            <div class="vcr-pane-grid__item">
              <span class="vcr-pane-grid__label">موبایل:</span>
              <span class="vcr-pane-grid__val vcr-pane-grid__val--ltr">${activeCustomer.phoneNumber || '---'}</span>
            </div>
            <div class="vcr-pane-grid__item">
              <span class="vcr-pane-grid__label">ایمیل:</span>
              <span class="vcr-pane-grid__val">${activeCustomer.email || 'ثبت نشده'}</span>
            </div>
            <div class="vcr-pane-grid__item">
              <span class="vcr-pane-grid__label">کشور / ملیت:</span>
              <span class="vcr-pane-grid__val">${activeCustomer.country || 'iran'} / ${activeCustomer.nationality || 'iran'}</span>
            </div>
            <div class="vcr-pane-grid__item">
              <span class="vcr-pane-grid__label">وضعیت تاهل:</span>
              <span class="vcr-pane-grid__val">${activeCustomer.maritalStatus || 'نامشخص'}</span>
            </div>
            <div class="vcr-pane-grid__item vcr-pane-grid__item--full">
              <span class="vcr-pane-grid__label">خریدهای مشتری:</span>
              <span class="vcr-pane-grid__val">${activeCustomer.purchases || 'موردی ثبت نشده'}</span>
            </div>
            <div class="vcr-pane-grid__item vcr-pane-grid__item--full">
              <span class="vcr-pane-grid__label">آدرس کامل:</span>
              <span class="vcr-pane-grid__val">${activeCustomer.address || 'ثبت نشده'}</span>
            </div>
            <div class="vcr-pane-grid__item vcr-pane-grid__item--full">
              <span class="vcr-pane-grid__label">توضیحات و یادداشت‌ها:</span>
              <span class="vcr-pane-grid__val">${activeCustomer.Description || 'توضیحاتی وجود ندارد.'}</span>
            </div>
          </div>

          <div class="vcr-activity-feed">
            <h4 class="vcr-activity-feed__title">آخرین رخدادهای سیستم</h4>
            <div class="vcr-activity-feed__list">
              ${logsHtml}
            </div>
          </div>

          <div class="vcr-pane-card__footer">
            <button class="vcr-btn vcr-btn--danger vcr-custCard__btn" data-action="delete">حذف مشتری</button>
            <button class="vcr-btn vcr-btn--primary vcr-custCard__btn" data-action="edit">ویرایش اطلاعات</button>
          </div>
        </div>
      </div>
    `;

    return `
      <div class="vcr-split-layout">
        <div class="vcr-split-sidebar">
          ${sidebarHtml}
        </div>
        ${detailPaneHtml}
      </div>
    `;
  }

  function renderCustomerShow() {
    const showSection = document.querySelector('.CI-show');
    if (!showSection) return;

    const list = getProcessedCustomers();
    updateInsights(list);

    if (list.length === 0) {
      showSection.innerHTML = `
        <div class="vcr-empty-state">
          <div class="vcr-empty-state__icon">🔍</div>
          <h4 class="vcr-empty-state__title">هیچ مشتری یافت نشد</h4>
          <p class="vcr-empty-state__text">با تغییر فیلتر جستجو یا افزودن مشتری جدید شروع کنید.</p>
        </div>
      `;
      return;
    }

    switch (prefs.viewMode) {
      case 'view-table':
        showSection.innerHTML = renderTableView(list);
        break;
      case 'view-split':
        showSection.innerHTML = renderSplitView(list);
        break;
      case 'view-grid':
      default:
        showSection.innerHTML = renderGridView(list);
        break;
    }
  }

  function updateBatchToolbarUI() {
    const batchToolbar = document.getElementById('vcr-batch-toolbar');
    const batchCount = document.getElementById('vcr-batch-count');
    if (!batchToolbar) return;

    const count = selectedCustomerIds.length;
    if (count > 0) {
      batchToolbar.classList.remove('hidden');
      if (batchCount) batchCount.textContent = count;
    } else {
      batchToolbar.classList.add('hidden');
    }
  }

  // --- ارتباط با tools-service ---
  async function handleAddOrUpdateCustomer(e) {
    e.preventDefault();
    const form = document.querySelector('.addCIModal-form');
    if (!form) return;

    const formData = new FormData(form);
    const formValue = Object.fromEntries(formData);
    const editId = form.getAttribute('data-edit-id');

    const customerPayload = {
      name: formValue.name || '',
      lastName: formValue.lastName || '',
      username: formValue.username || '',
      avatar: formValue.avatar || '',
      email: formValue.email || '',
      phoneNumber: formValue.phone || '',
      job: formValue.job || 'نامشخص',
      purchases: formValue.purchases || '',
      inventory: Number(formValue.inventory) || 0,
      address: formValue.address || 'ثبت نشده',
      Description: formValue.Description || '',
      country: formValue.country || 'iran',
      nationality: formValue.nationality || 'iran',
      plan: formValue.plan || 'free',
      maritalStatus: formValue.maritalStatus || 'unspecified',
    };

    try {
      if (editId) {
        const updated = await updateToolItem(TOOL_NAME, editId, customerPayload);
        customers = customers.map((c) => (String(c.id) === String(editId) ? updated : c));
        saveLog('UPDATE', `ویرایش مشتری: ${customerPayload.name} ${customerPayload.lastName}`);
        showToast(`اطلاعات مشتری "${customerPayload.name}" به‌روزرسانی شد.`, 'success');
      } else {
        const created = await createToolItem(TOOL_NAME, customerPayload);
        customers = [created, ...customers];
        saveLog('CREATE', `افزودن مشتری جدید: ${customerPayload.name} ${customerPayload.lastName}`);
        triggerConfetti();
        showToast(`مشتری "${customerPayload.name}" با موفقیت اضافه شد.`, 'success');
      }

      closeModal();
      renderCustomerShow();
    } catch (err) {
      console.error('[CustomerPage] Operation failed:', err);
      showToast('خطا در برقراری ارتباط و ذخیره داده!', 'error');
    }
  }

  async function handleDeleteCustomer(id) {
    const customer = customers.find((c) => String(c.id) === String(id));
    const fullName = customer ? `${customer.name} ${customer.lastName}` : 'مشتری';

    if (!confirm(`آیا از حذف "${fullName}" اطمینان دارید؟`)) return;

    try {
      await deleteToolItem(TOOL_NAME, id);
      customers = customers.filter((c) => String(c.id) !== String(id));
      selectedCustomerIds = selectedCustomerIds.filter((x) => String(x) !== String(id));

      if (String(selectedCustomerId) === String(id)) {
        selectedCustomerId = null;
      }

      saveLog('DELETE', `حذف مشتری: ${fullName}`);
      showToast(`مشتری "${fullName}" با موفقیت حذف شد.`, 'success');
      updateBatchToolbarUI();
      renderCustomerShow();
    } catch (err) {
      console.error('[CustomerPage] Delete failed:', err);
      showToast('خطا در حذف آیتم مشتری!', 'error');
    }
  }

  function handleEditCustomer(id) {
    const customer = customers.find((c) => String(c.id) === String(id));
    if (!customer) return;

    const form = document.querySelector('.addCIModal-form');
    if (!form) return;

    form.name.value = customer.name || '';
    form.lastName.value = customer.lastName || '';
    form.avatar.value = customer.avatar || '';
    form.username.value = customer.username || '';
    form.email.value = customer.email || '';
    form.phone.value = customer.phoneNumber || '';
    form.job.value = customer.job || '';
    form.purchases.value = customer.purchases || '';
    form.inventory.value = customer.inventory || 0;
    form.address.value = customer.address || '';
    form.Description.value = customer.Description || '';
    form.country.value = customer.country || 'iran';
    form.nationality.value = customer.nationality || 'iran';
    form.plan.value = customer.plan || 'free';
    form.maritalStatus.value = customer.maritalStatus || 'unspecified';

    form.setAttribute('data-edit-id', id);
    const titleEl = document.querySelector('.addCIModal-title');
    if (titleEl) titleEl.textContent = 'ویرایش اطلاعات مشتری';

    openModal();
  }

  async function handleBatchAction(action) {
    if (selectedCustomerIds.length === 0) return;

    if (action === 'delete') {
      if (!confirm(`آیا از حذف گروهی ${selectedCustomerIds.length} مشتری اطمینان دارید؟`)) return;

      try {
        for (const id of selectedCustomerIds) {
          await deleteToolItem(TOOL_NAME, id);
        }
        customers = customers.filter((c) => !selectedCustomerIds.includes(String(c.id)));
        saveLog('BATCH_DELETE', `حذف گروهی ${selectedCustomerIds.length} مشتری`);
        showToast(`${selectedCustomerIds.length} مشتری با موفقیت حذف شدند.`, 'success');
        selectedCustomerIds = [];
        updateBatchToolbarUI();
        renderCustomerShow();
      } catch (err) {
        console.error('[CustomerPage] Batch delete failed:', err);
        showToast('خطا در حذف گروهی مشتریان!', 'error');
      }
    } else if (action === 'csv') {
      const selectedData = customers.filter((c) => selectedCustomerIds.includes(String(c.id)));
      let csvContent = 'data:text/csv;charset=utf-8,ID,Name,LastName,Username,Email,Phone,Job,Inventory,Plan,Country\n';

      selectedData.forEach((c) => {
        csvContent += `"${c.id}","${c.name || ''}","${c.lastName || ''}","${c.username || ''}","${c.email || ''}","${c.phoneNumber || ''}","${c.job || ''}","${c.inventory || 0}","${c.plan || 'free'}","${c.country || 'iran'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ViXoRa_Customers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      saveLog('CSV_EXPORT', `خروجی CSV برای ${selectedCustomerIds.length} مشتری`);
      showToast('فایل CSV با موفقیت تولید شد.', 'success');
      selectedCustomerIds = [];
      updateBatchToolbarUI();
      renderCustomerShow();
    }
  }

  // --- مدال و پالت سریع ---
  function openModal() {
    const modal = document.querySelector('.addCI-modal');
    modal?.classList.remove('hidden');
  }

  function closeModal() {
    const modal = document.querySelector('.addCI-modal');
    const form = document.querySelector('.addCIModal-form');
    const titleEl = document.querySelector('.addCIModal-title');
    modal?.classList.add('hidden');
    form?.reset();
    form?.removeAttribute('data-edit-id');
    if (titleEl) titleEl.textContent = 'ثبت مشتری جدید';
  }

  function toggleSpotlight(show) {
    const spotlight = document.getElementById('vcr-spotlight');
    const input = document.getElementById('vcr-spotlight-input');
    const results = document.getElementById('vcr-spotlight-results');

    if (!spotlight) return;
    if (show) {
      spotlight.classList.remove('hidden');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 80);
      }
      if (results) {
        results.innerHTML = `<div class="vcr-spotlight-msg">نام، ایمیل، موبایل یا شغل مشتری را تایپ کنید...</div>`;
      }
    } else {
      spotlight.classList.add('hidden');
    }
  }

  function handleSpotlightSearch(e) {
    const query = (e.target.value || '').toLowerCase().trim();
    const resultsEl = document.getElementById('vcr-spotlight-results');
    if (!resultsEl) return;

    if (!query) {
      resultsEl.innerHTML = `<div class="vcr-spotlight-msg">نام، ایمیل، موبایل یا شغل مشتری را تایپ کنید...</div>`;
      return;
    }

    const filtered = customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.lastName && c.lastName.toLowerCase().includes(query)) ||
        (c.username && c.username.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phoneNumber && c.phoneNumber.includes(query)) ||
        (c.job && c.job.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
      resultsEl.innerHTML = `<div class="vcr-spotlight-msg">هیچ مشتری با این مشخصات یافت نشد.</div>`;
      return;
    }

    resultsEl.innerHTML = filtered
      .map(
        (c) => `
        <div class="vcr-spotlight-item" data-id="${c.id}">
          <div class="vcr-spotlight-item__left">
            <div class="vcr-spotlight-item__avatar">${(c.name || 'U').charAt(0).toUpperCase()}</div>
            <div class="vcr-spotlight-item__meta">
              <span class="vcr-spotlight-item__name">${c.name || ''} ${c.lastName || ''}</span>
              <span class="vcr-spotlight-item__sub">@${c.username || 'user'} | ${c.job || '---'}</span>
            </div>
          </div>
          <span class="vcr-spotlight-item__inv">${new Intl.NumberFormat('fa-IR').format(c.inventory || 0)} تومان</span>
        </div>
      `
      )
      .join('');
  }

  // --- رندر ساختار کامل HTML ---
  function render() {
    loadLocalData();

    return `
      <div class="CI-root">
        <!-- تولبار کنترل کامل -->
        <section class="vcr-toolbar">
          <div class="vcr-toolbar__right">
            <div class="vcr-brand-badge">
              <h3 class="vcr-brand-badge__title">اطلاعات مشتریان</h3>
              <span class="vcr-brand-badge__dot"></span>
            </div>
            <button class="vcr-btn vcr-btn--neon addCITools-btn" type="button">
              + مشتری جدید
            </button>
          </div>

          <div class="vcr-toolbar__left">
            <div class="vcr-kbd-hint">
              <span>جستجوی سریع:</span>
              <kbd>Ctrl + K</kbd>
            </div>

            <div class="vcr-search-box">
              <svg class="vcr-search-box__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input placeholder="جستجو بین مشتریان..." class="vcr-search-box__input addCISearch-input" type="text" value="${prefs.searchQuery || ''}">
              
              <div class="vcr-search-tooltip">
                <div class="vcr-search-tooltip__header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <span>موتور سرچ هوشمند و وزنی</span>
                </div>
                <p class="vcr-search-tooltip__desc">جستجو همزمان بر اساس اولویت وزنی در فیلدهای زیر انجام می‌شود:</p>
                <ul class="vcr-search-tooltip__list">
                  <li><span>نام و نام خانوادگی</span> <span class="vcr-badge vcr-badge--gold">ضریب ۱۰۰</span></li>
                  <li><span>نام کاربری و ایمیل</span> <span class="vcr-badge vcr-badge--silver">ضریب ۸۰</span></li>
                  <li><span>شماره موبایل و شغل</span> <span class="vcr-badge vcr-badge--bronze">ضریب ۵۰</span></li>
                  <li><span>آدرس و کشور</span> <span class="vcr-badge">ضریب ۲۰</span></li>
                </ul>
              </div>
            </div>

            <select class="vcr-select vcr-sort-select">
              <option value="alphabetical" ${prefs.sortBy === 'alphabetical' ? 'selected' : ''}>🔤 حروف الفبا (نام خانوادگی)</option>
              <option value="inventory-desc" ${prefs.sortBy === 'inventory-desc' ? 'selected' : ''}>💰 موجودی (بیشترین)</option>
              <option value="inventory-asc" ${prefs.sortBy === 'inventory-asc' ? 'selected' : ''}>🪙 موجودی (کمترین)</option>
              <option value="plan-premium" ${prefs.sortBy === 'plan-premium' ? 'selected' : ''}>👑 سطح پلن (پرایم)</option>
              <option value="has-avatar" ${prefs.sortBy === 'has-avatar' ? 'selected' : ''}>🖼️ دارای عکس پروفایل</option>
            </select>

            <!-- دکمه‌های ۳ گانه تغییر نما -->
            <div class="vcr-view-toggles">
              <button class="vcr-view-btn ${prefs.viewMode === 'view-grid' ? 'active' : ''}" data-view="view-grid" title="نمای کارتی (Grid)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button class="vcr-view-btn ${prefs.viewMode === 'view-table' ? 'active' : ''}" data-view="view-table" title="نمای جدولی (Table)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
              <button class="vcr-view-btn ${prefs.viewMode === 'view-split' ? 'active' : ''}" data-view="view-split" title="نمای اسپلیت (Split View)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
              </button>
            </div>
          </div>
        </section>

        <!-- پنل آمار و اینسایت‌های تحلیلی -->
        <section class="vcr-insights">
          <div class="vcr-insight-card vcr-insight-card--chart">
            <div class="vcr-insight-card__info">
              <span class="vcr-insight-card__title">توزیع پلن‌های کاربری</span>
              <div id="vcr-chart-legend" class="vcr-chart-legend"></div>
            </div>
            <div class="vcr-donut-wrap">
              <svg class="vcr-donut-svg" width="76" height="76" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3.2"></circle>
                <circle id="vcr-donut-segment" cx="18" cy="18" r="15.915" fill="none" stroke="var(--vcr-neon-cyan)" stroke-width="3.2" stroke-dasharray="0 100" stroke-dashoffset="0"></circle>
              </svg>
              <div id="vcr-donut-percentage" class="vcr-donut-percentage">۰٪</div>
            </div>
          </div>

          <div class="vcr-insight-card">
            <span class="vcr-insight-card__title">کل سرمایه در چرخه</span>
            <h4 id="vcr-stat-total" class="vcr-insight-card__val vcr-insight-card__val--cyan">۰ تومان</h4>
          </div>
          <div class="vcr-insight-card">
            <span class="vcr-insight-card__title">میانگین دارایی مشتریان</span>
            <h4 id="vcr-stat-avg" class="vcr-insight-card__val vcr-insight-card__val--purple">۰ تومان</h4>
          </div>
          <div class="vcr-insight-card">
            <span class="vcr-insight-card__title">نسبت کاربران پرمیوم</span>
            <h4 id="vcr-stat-premium" class="vcr-insight-card__val vcr-insight-card__val--green">۰٪</h4>
          </div>
        </section>

        <!-- تولبار شناور عملیات گروهی -->
        <div id="vcr-batch-toolbar" class="vcr-batch-toolbar hidden">
          <span class="vcr-batch-toolbar__text"><strong id="vcr-batch-count">0</strong> مشتری انتخاب شده است</span>
          <div class="vcr-batch-toolbar__actions">
            <button id="vcr-batch-del-btn" class="vcr-btn vcr-btn--danger vcr-btn--sm">حذف گروهی</button>
            <button id="vcr-batch-csv-btn" class="vcr-btn vcr-btn--secondary vcr-btn--sm">خروجی CSV</button>
            <button id="vcr-batch-cancel-btn" class="vcr-btn vcr-btn--ghost vcr-btn--sm">انصراف</button>
          </div>
        </div>

        <!-- Spotlight Command Palette -->
        <div id="vcr-spotlight" class="vcr-spotlight hidden">
          <div class="vcr-spotlight__dialog">
            <div class="vcr-spotlight__header">
              <span class="vcr-spotlight__icon">🔍</span>
              <input id="vcr-spotlight-input" class="vcr-spotlight__input" type="text" placeholder="نام، ایمیل یا شماره موبایل را برای جستجوی فوری بنویسید...">
              <kbd class="vcr-spotlight__kbd">ESC</kbd>
            </div>
            <div id="vcr-spotlight-results" class="vcr-spotlight__results"></div>
          </div>
        </div>

        <!-- مودال ثبت و ویرایش مشتری -->
        <section class="addCI-modal hidden">
          <div class="addCIModal-bg"></div>
          <div class="addCIModal-card">
            <div class="addCIModal-header">
              <h3 class="addCIModal-title">ثبت مشتری جدید</h3>
              <p class="addCIModal-description">اطلاعات فیلدهای زیر را جهت ذخیره در سامانه وارد نمایید.</p>
            </div>

            <form class="addCIModal-form">
              <div class="vcr-form-grid">
                <div class="vcr-form-group">
                  <label for="name" class="vcr-form-label">نام مشتری <span class="vcr-req">*</span></label>
                  <input id="name" class="vcr-input" name="name" type="text" placeholder="مثال: علی" required>
                </div>

                <div class="vcr-form-group">
                  <label for="lastName" class="vcr-form-label">نام خانوادگی <span class="vcr-req">*</span></label>
                  <input id="lastName" class="vcr-input" name="lastName" type="text" placeholder="مثال: محمدی" required>
                </div>

                <div class="vcr-form-group">
                  <label for="avatar" class="vcr-form-label">لینک آواتار (URL)</label>
                  <input id="avatar" class="vcr-input" name="avatar" type="url" placeholder="https://example.com/avatar.jpg">
                </div>

                <div class="vcr-form-group">
                  <label for="username" class="vcr-form-label">نام کاربری <span class="vcr-req">*</span></label>
                  <input id="username" class="vcr-input" name="username" type="text" placeholder="username" required>
                </div>

                <div class="vcr-form-group">
                  <label for="email" class="vcr-form-label">ایمیل</label>
                  <input id="email" class="vcr-input" name="email" type="email" placeholder="example@domain.com">
                </div>

                <div class="vcr-form-group">
                  <label for="phone" class="vcr-form-label">شماره موبایل</label>
                  <input id="phone" class="vcr-input" name="phone" type="text" placeholder="۰۹۱۲۳۴۵۶۷۸۹">
                </div>

                <div class="vcr-form-group">
                  <label for="job" class="vcr-form-label">عنوان شغلی</label>
                  <input id="job" class="vcr-input" name="job" type="text" placeholder="توسعه‌دهنده وب">
                </div>

                <div class="vcr-form-group">
                  <label for="inventory" class="vcr-form-label">موجودی حساب (تومان)</label>
                  <input id="inventory" class="vcr-input" name="inventory" type="number" placeholder="15000000">
                </div>

                <div class="vcr-form-group vcr-form-group--full">
                  <label for="purchases" class="vcr-form-label">خریدهای مشتری</label>
                  <input id="purchases" class="vcr-input" name="purchases" type="text" placeholder="مثال: لپ تاپ، مانیتور">
                </div>

                <div class="vcr-form-group">
                  <label for="CICountry" class="vcr-form-label">کشور</label>
                  <select class="vcr-select" id="CICountry" name="country">
                    <option value="iran">ایران</option>
                    <option value="UAE">امارات</option>
                    <option value="USA">آمریکا</option>
                    <option value="Germany">آلمان</option>
                  </select>
                </div>

                <div class="vcr-form-group">
                  <label for="CInationality" class="vcr-form-label">ملیت</label>
                  <select class="vcr-select" id="CInationality" name="nationality">
                    <option value="iran">ایرانی</option>
                    <option value="UAE">اماراتی</option>
                    <option value="USA">آمریکایی</option>
                    <option value="Germany">آلمانی</option>
                  </select>
                </div>

                <div class="vcr-form-group">
                  <label for="CIPlan" class="vcr-form-label">سطح پلن</label>
                  <select class="vcr-select" id="CIPlan" name="plan">
                    <option value="free">free</option>
                    <option value="eco">eco</option>
                    <option value="pro">pro</option>
                    <option value="plus">plus</option>
                    <option value="gift">gift</option>
                  </select>
                </div>

                <div class="vcr-form-group">
                  <label for="CImaritalStatus" class="vcr-form-label">وضعیت تاهل</label>
                  <select class="vcr-select" id="CImaritalStatus" name="maritalStatus">
                    <option value="single">مجرد</option>
                    <option value="married">متاهل</option>
                    <option value="unspecified">نامشخص</option>
                  </select>
                </div>

                <div class="vcr-form-group vcr-form-group--full">
                  <label for="address" class="vcr-form-label">آدرس کامل</label>
                  <textarea placeholder="آدرس دقیق..." id="address" class="vcr-textarea" name="address" rows="2"></textarea>
                </div>

                <div class="vcr-form-group vcr-form-group--full">
                  <label for="Description" class="vcr-form-label">جزئیات و یادداشت‌ها</label>
                  <textarea placeholder="توضیحات تکمیلی..." id="Description" class="vcr-textarea" name="Description" rows="2"></textarea>
                </div>
              </div>

              <div class="addCIModal-actions">
                <button class="vcr-btn vcr-btn--ghost CIModal-formCancelBtn" type="button">انصراف</button>
                <button class="vcr-btn vcr-btn--neon CIModal-formAddBtn" type="submit">ذخیره مشتری</button>
              </div>
            </form>
          </div>
        </section>

        <!-- بخش اصلی نمایش مشتریان -->
        <section class="CI-show ${prefs.viewMode}"></section>
      </div>
    `;
  }

  // --- بعد از رندر در DOM ---
  async function afterRender() {
    loadLocalData();

    try {
      customers = await getToolData(TOOL_NAME);
    } catch (err) {
      console.error('[CustomerPage] Failed to fetch tool data:', err);
      customers = [];
    }

    const rootEl = document.querySelector('.CI-root');
    if (!rootEl) return;

    const addCustomerBtn = rootEl.querySelector('.addCITools-btn');
    const modalBg = rootEl.querySelector('.addCIModal-bg');
    const modalCancelBtn = rootEl.querySelector('.CIModal-formCancelBtn');
    const addForm = rootEl.querySelector('.addCIModal-form');
    const showSection = rootEl.querySelector('.CI-show');
    const searchInput = rootEl.querySelector('.addCISearch-input');
    const sortSelect = rootEl.querySelector('.vcr-sort-select');
    const spotlightModal = document.getElementById('vcr-spotlight');
    const spotlightInput = document.getElementById('vcr-spotlight-input');
    const spotlightResults = document.getElementById('vcr-spotlight-results');

    // ثبت هندلرها
    boundHandlers.openModal = () => openModal();
    boundHandlers.closeModal = () => closeModal();
    boundHandlers.submitForm = (e) => handleAddOrUpdateCustomer(e);

    boundHandlers.handleSearch = (e) => {
      prefs.searchQuery = e.target.value;
      savePreferences();
      renderCustomerShow();
    };

    boundHandlers.handleSortChange = (e) => {
      prefs.sortBy = e.target.value;
      savePreferences();
      renderCustomerShow();
    };

    boundHandlers.changeView = (e) => {
      const btn = e.target.closest('.vcr-view-btn');
      if (!btn) return;
      rootEl.querySelectorAll('.vcr-view-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      prefs.viewMode = btn.dataset.view;
      savePreferences();

      if (showSection) {
        showSection.className = `CI-show ${prefs.viewMode}`;
      }
      renderCustomerShow();
    };

    boundHandlers.handleSectionClick = (e) => {
      const splitItem = e.target.closest("[data-action='select-split']");
      if (splitItem) {
        selectedCustomerId = splitItem.dataset.id;
        renderCustomerShow();
        return;
      }

      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const container = btn.closest('[data-id]');
      if (!container) return;

      const customerId = container.dataset.id;
      const action = btn.dataset.action;

      if (action === 'delete') {
        handleDeleteCustomer(customerId);
      } else if (action === 'edit') {
        handleEditCustomer(customerId);
      }
    };

    boundHandlers.handleSectionChange = (e) => {
      if (e.target.classList.contains('vcr-batch-checkbox')) {
        const id = String(e.target.value);
        if (e.target.checked) {
          if (!selectedCustomerIds.includes(id)) selectedCustomerIds.push(id);
        } else {
          selectedCustomerIds = selectedCustomerIds.filter((x) => x !== id);
        }
        updateBatchToolbarUI();
      } else if (e.target.id === 'vcr-select-all') {
        const currentList = getProcessedCustomers();
        if (e.target.checked) {
          selectedCustomerIds = currentList.map((c) => String(c.id));
        } else {
          selectedCustomerIds = [];
        }
        rootEl.querySelectorAll('.vcr-batch-checkbox').forEach((box) => {
          box.checked = e.target.checked;
        });
        updateBatchToolbarUI();
      }
    };

    boundHandlers.handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSpotlight(true);
      } else if (
        e.key === '/' &&
        document.activeElement !== searchInput &&
        document.activeElement !== spotlightInput &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        toggleSpotlight(true);
      }

      if (e.key === 'Escape') {
        toggleSpotlight(false);
        closeModal();
      }
    };

    boundHandlers.handleSpotlightResultsClick = (e) => {
      const item = e.target.closest('.vcr-spotlight-item');
      if (!item) return;

      selectedCustomerId = item.dataset.id;
      prefs.viewMode = 'view-split';
      savePreferences();

      rootEl.querySelectorAll('.vcr-view-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.view === 'view-split');
      });

      if (showSection) showSection.className = 'CI-show view-split';
      toggleSpotlight(false);
      renderCustomerShow();
    };

    // اضافه کردن لیسنرها
    addCustomerBtn?.addEventListener('click', boundHandlers.openModal);
    modalBg?.addEventListener('click', boundHandlers.closeModal);
    modalCancelBtn?.addEventListener('click', boundHandlers.closeModal);
    addForm?.addEventListener('submit', boundHandlers.submitForm);
    searchInput?.addEventListener('input', boundHandlers.handleSearch);
    sortSelect?.addEventListener('change', boundHandlers.handleSortChange);
    showSection?.addEventListener('click', boundHandlers.handleSectionClick);
    showSection?.addEventListener('change', boundHandlers.handleSectionChange);
    spotlightInput?.addEventListener('input', handleSpotlightSearch);
    spotlightResults?.addEventListener('click', boundHandlers.handleSpotlightResultsClick);
    spotlightModal?.addEventListener('click', (e) => {
      if (e.target === spotlightModal) toggleSpotlight(false);
    });

    rootEl.querySelectorAll('.vcr-view-btn').forEach((btn) => {
      btn.addEventListener('click', boundHandlers.changeView);
    });

    document.getElementById('vcr-batch-del-btn')?.addEventListener('click', () => handleBatchAction('delete'));
    document.getElementById('vcr-batch-csv-btn')?.addEventListener('click', () => handleBatchAction('csv'));
    document.getElementById('vcr-batch-cancel-btn')?.addEventListener('click', () => {
      selectedCustomerIds = [];
      updateBatchToolbarUI();
      renderCustomerShow();
    });

    window.addEventListener('keydown', boundHandlers.handleKeyDown);

    // رندر اولیه
    renderCustomerShow();
  }

  // --- تخریب کامپوننت و جلوگیری از نشت حافظه ---
  function destroy() {
    window.removeEventListener('keydown', boundHandlers.handleKeyDown);
    const spotlightModal = document.getElementById('vcr-spotlight');
    if (spotlightModal) spotlightModal.remove();
    const batchToolbar = document.getElementById('vcr-batch-toolbar');
    if (batchToolbar) batchToolbar.remove();
    const toast = document.querySelector('.vcr-toast');
    if (toast) toast.remove();
  }

  return {
    render,
    afterRender,
    destroy,
  };
}
