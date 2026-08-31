// create-tools-layout.js

/**
 * ViXoRa Tools Layout - Functional Factory (Production Grade)
 * Compatible with ViXoRa Router layout API:
 * render / afterRender / getOutlet / destroy
 */

export function createToolsLayout() {
  let outlet = null;

  let clockIntervalId = null;
  let pingIntervalId = null;

  let toolsMenuOpen = true;
  let notificationsOpen = false;
  let userMenuOpen = false;
  let cmdkOpen = false;

  let previousBodyOverflow = "";

  const teardown = [];

  const refs = {
    body: null,
    outlet: null,
    sidebarToggle: null,
    notifBtn: null,
    notifPopover: null,
    userBtn: null,
    userPopover: null,
    cmdkBtn: null,
    cmdkOverlay: null,
    cmdkDialog: null,
    cmdkInput: null,
    cmdkList: null,
    pingText: null,
    timeEl: null,
    dateEl: null
  };

  const menuCategories = [
    {
      title: "اصلی",
      items: [
        {
          title: "داشبورد",
          link: "/tools/dashboard",
          icon: "/src/global/img/sticker/header/dashboard_layout.svg",
          badge: null
        },
        {
          title: "اطلاعات مشتریان",
          link: "/tools/customerInfo",
          icon: "/src/global/img/sticker/header/invoice.svg",
          badge: null
        },
        {
          title: "صورت حساب‌ها",
          link: "/tools/invoices",
          icon: "/src/global/img/sticker/header/invoice.svg",
          badge: null
        }
      ]
    },
    {
      title: "مدیریت & مالی",
      items: [
        {
          title: "مدیریت ساختمان",
          link: "/tools/building",
          icon: "/src/global/img/sticker/header/apartment.svg",
          badge: null
        },
        {
          title: "وام‌های خانگی",
          link: "/tools/savingsCircle",
          icon: "/src/global/img/sticker/header/interior.svg",
          badge: null
        },
        {
          title: "وام‌های بانکی",
          link: "/tools/bankLoans",
          icon: "/src/global/img/sticker/header/bank.svg",
          badge: null
        },
        {
          title: "اهداف مالی",
          link: "/tools/financial-goals",
          icon: "/src/global/img/sticker/header/combo_chart.svg",
          badge: "جدید"
        }
      ]
    },
    {
      title: "شخصی & بهره‌وری",
      items: [
        {
          title: "ایجاد رزومه",
          link: "/tools/resume",
          icon: "/src/global/img/sticker/header/resume.svg",
          badge: null
        },
        {
          title: "یادداشت‌ها",
          link: "/tools/note",
          icon: "/src/global/img/sticker/header/note.svg",
          badge: "۱۲"
        },
        {
          title: "وظایف",
          link: "/tools/task",
          icon: "/src/global/img/sticker/header/task.svg",
          badge: "۵"
        },
        {
          title: "عادت‌ها",
          link: "/tools/habits",
          icon: "/src/global/img/sticker/header/no_celery.svg",
          badge: null
        },
        {
          title: "سرگرمی",
          link: "/tools/entertainment",
          icon: "/src/global/img/sticker/header/GameController.svg",
          badge: null
        }
      ]
    },
    {
      title: "پشتیبانی & حساب",
      items: [
        {
          title: "ارتباط با پشتیبانی",
          link: "/tools/support",
          icon: "/src/global/img/sticker/header/online_support.svg",
          badge: null
        },
        {
          title: "تیکت‌ها",
          link: "/tools/tickets",
          icon: "/src/global/img/sticker/header/send.svg",
          badge: "۲"
        },
        {
          title: "خروج از اکانت",
          link: "/logout",
          icon: "/src/global/img/sticker/header/logout.svg",
          badge: null,
          isLogout: true
        }
      ]
    }
  ];

  const FALLBACK_AVATAR =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300f0ff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';

  // ---------- helpers ----------

  function on(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    teardown.push(() => target.removeEventListener(type, handler, options));
  }

  function safeQuery(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getCurrentPathname() {
    return window.location.pathname || "/";
  }

  function readSidebarState() {
    try {
      const raw = localStorage.getItem("vixora.tools.sidebar.open");
      if (raw === null) return true;
      return raw === "1";
    } catch {
      return true;
    }
  }

  function writeSidebarState(open) {
    try {
      localStorage.setItem("vixora.tools.sidebar.open", open ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function lockBodyScroll() {
    previousBodyOverflow = document.documentElement.style.overflow || "";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function unlockBodyScroll() {
    document.documentElement.style.overflow = previousBodyOverflow;
    document.body.style.overflow = "";
  }

  function getFlatMenuItems() {
    const items = [];
    for (const cat of menuCategories) {
      for (const item of cat.items) {
        items.push({
          ...item,
          category: cat.title
        });
      }
    }
    return items;
  }

  // ---------- menu render ----------

  function renderMenuItem(item, currentPath) {
    const isActive = currentPath === item.link;
    const activeClass = isActive ? "active" : "";
    const logoutClass = item.isLogout ? "vcr-menu-item--logout" : "";

    return `
      <li class="vcr-menu-item ${activeClass} ${logoutClass}" data-title="${escapeHtml(item.title)}">
        <a class="vcr-menu-link" data-link href="${item.link}">
          <div class="vcr-menu-icon-wrap">
            <img class="vcr-menu-sticker" data-vcr-avatar src="${item.icon}" alt="${escapeHtml(item.title)}">
          </div>
          <span class="vcr-menu-text">${escapeHtml(item.title)}</span>
          ${item.badge ? `<span class="vcr-menu-badge">${escapeHtml(item.badge)}</span>` : ""}
        </a>

        <div class="vcr-collapsed-tooltip" role="tooltip">
          <span>${escapeHtml(item.title)}</span>
          ${item.badge ? `<small class="vcr-tooltip-badge">${escapeHtml(item.badge)}</small>` : ""}
        </div>
      </li>
    `;
  }

  function renderCategories(currentPath) {
    return menuCategories
      .map(
        (cat) => `
        <div class="vcr-menu-group">
          <div class="vcr-menu-group__title">${escapeHtml(cat.title)}</div>
          <ul class="vcr-menu-list">
            ${cat.items.map((item) => renderMenuItem(item, currentPath)).join("")}
          </ul>
        </div>
      `
      )
      .join("");
  }

  // ---------- layout render ----------

  function render() {
    toolsMenuOpen = readSidebarState();
    const currentPath = getCurrentPathname();

    return `
      <div class="vcr-layout" dir="rtl">
        <header class="vcr-header">
          <div class="vcr-header__brand">
            <a class="vcr-header__logo-link" href="/" data-link>
              <div class="vcr-logo-icon" aria-hidden="true">
                <span class="vcr-logo-glow"></span>
                <span class="vcr-logo-text">V</span>
              </div>
              <div class="vcr-brand-info">
                <h1 class="vcr-brand-name">ViXoRa <span class="vcr-badge-version">v2.4 Pro</span></h1>
                <p class="vcr-brand-sub">Enterprise Management Platform</p>
              </div>
            </a>
          </div>

          <div class="vcr-header__center">
            <button
              class="vcr-cmd-btn"
              id="vcrCmdLauncher"
              type="button"
              title="جستجوی سریع"
              aria-haspopup="dialog"
              aria-expanded="false"
            >
              <div class="vcr-cmd-btn__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>جستجوی سریع در ابزارها...</span>
              </div>
              <kbd class="vcr-kbd">Ctrl K</kbd>
            </button>
          </div>

          <div class="vcr-header__actions">
            <div class="vcr-status-pill" title="وضعیت اتصال به سرور مرکزی">
              <span class="vcr-status-dot" aria-hidden="true"></span>
              <span class="vcr-status-text" id="vcrPingText">--ms • ...</span>
            </div>

            <div class="vcr-datetime-card" aria-label="زمان و تاریخ">
              <div class="vcr-time" id="toolsTime">--:--:--</div>
              <div class="vcr-date" id="toolsDate">در حال دریافت...</div>
            </div>

            <div class="vcr-dropdown-wrapper">
              <button
                class="vcr-action-icon-btn"
                id="vcrNotifBtn"
                type="button"
                title="اعلان‌ها"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="vcr-notif-badge" aria-hidden="true"></span>
              </button>

              <div class="vcr-popover vcr-popover--notif hidden" id="vcrNotifPopover" role="menu" aria-label="اعلان‌ها">
                <div class="vcr-popover__header">
                  <h4 class="vcr-notif-title">اعلان‌های اخیر</h4>
                  <span class="vcr-badge-count">۳ جدید</span>
                </div>
                <div class="vcr-popover__body">
                  <div class="vcr-notif-item unread">
                    <div class="vcr-notif-icon cyan">✓</div>
                    <div class="vcr-notif-content">
                      <p>مشتری جدید <strong>علی رضایی</strong> ثبت شد.</p>
                      <small>۵ دقیقه پیش</small>
                    </div>
                  </div>
                  <div class="vcr-notif-item unread">
                    <div class="vcr-notif-icon purple">!</div>
                    <div class="vcr-notif-content">
                      <p>سررسید پرداخت موعد وام خانگی</p>
                      <small>۱ ساعت پیش</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="vcr-dropdown-wrapper">
              <button
                class="vcr-user-pill"
                id="vcrUserBtn"
                type="button"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <div class="vcr-avatar">
                  <img
                    data-vcr-avatar
                    src="/src/global/img/sticker/header/dashboard_layout.svg"
                    alt="Ali Avatar"
                  >
                  <span class="vcr-avatar-online"></span>
                </div>
                <div class="vcr-user-info">
                  <span class="vcr-user-name">علی</span>
                  <span class="vcr-user-role">مدیر ارشد</span>
                </div>
              </button>

              <div class="vcr-popover vcr-popover--user hidden" id="vcrUserPopover">
                <div class="vcr-popover__header">
                  <h4 class="vcr-notif-title">حساب کاربری</h4>
                  <span class="vcr-badge-count">Pro</span>
                </div>

                <div class="vcr-popover__body">
                  <a class="vcr-popover-link" href="/tools/profile" data-link role="menuitem">پروفایل</a>
                  <a class="vcr-popover-link" href="/tools/settings" data-link role="menuitem">تنظیمات</a>
                  <div class="vcr-popover-sep" role="separator"></div>
                  <a class="vcr-popover-link vcr-popover-link--danger" href="/logout" data-link role="menuitem">خروج</a>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="vcr-body ${toolsMenuOpen ? "" : "is-collapsed"}">
          <section class="vcr-panel-content" id="page-content" data-router-outlet>
            <!-- pages render here -->
          </section>

          <aside class="vcr-sidebar" id="toolsMenu">
            <button
              class="vcr-sidebar-toggle"
              id="toolsMenuToggle"
              type="button"
              aria-label="باز و بسته کردن منو"
              title="تغییر وضعیت منو"
              aria-expanded="${toolsMenuOpen ? "true" : "false"}"
            >
              <svg class="vcr-toggle-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div class="vcr-sidebar__scroll">
              ${renderCategories(currentPath)}
            </div>
          </aside>
        </main>

        <div class="vcr-cmdk-overlay hidden" id="vcrCmdkOverlay" aria-hidden="true">
          <div class="vcr-cmdk-dialog" id="vcrCmdkDialog" role="dialog" aria-modal="true" aria-label="جستجوی سریع">
            <div class="vcr-cmdk-header">
              <div class="vcr-cmdk-title">جستجوی سریع</div>
              <button class="vcr-cmdk-close" id="vcrCmdkCloseBtn" type="button" aria-label="بستن">×</button>
            </div>

            <div class="vcr-cmdk-input-wrap">
              <input
                class="vcr-cmdk-input"
                id="vcrCmdkInput"
                type="search"
                placeholder="نام ابزار یا بخش را تایپ کنید..."
                autocomplete="off"
              >
              <div class="vcr-cmdk-hint">Enter برای رفتن • Esc برای بستن • ↑↓ برای انتخاب</div>
            </div>

            <div class="vcr-cmdk-results" id="vcrCmdkList" role="listbox" aria-label="نتایج"></div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------- lifecycle ----------

  function afterRender() {
    refs.body = safeQuery(".vcr-body");
    refs.outlet = safeQuery("#page-content");
    refs.sidebarToggle = safeQuery("#toolsMenuToggle");

    refs.notifBtn = safeQuery("#vcrNotifBtn");
    refs.notifPopover = safeQuery("#vcrNotifPopover");

    refs.userBtn = safeQuery("#vcrUserBtn");
    refs.userPopover = safeQuery("#vcrUserPopover");

    refs.cmdkBtn = safeQuery("#vcrCmdLauncher");
    refs.cmdkOverlay = safeQuery("#vcrCmdkOverlay");
    refs.cmdkDialog = safeQuery("#vcrCmdkDialog");
    refs.cmdkInput = safeQuery("#vcrCmdkInput");
    refs.cmdkList = safeQuery("#vcrCmdkList");

    refs.pingText = safeQuery("#vcrPingText");
    refs.timeEl = safeQuery("#toolsTime");
    refs.dateEl = safeQuery("#toolsDate");

    outlet = refs.outlet || null;

    attachAvatarFallbacks();
    startClock();
    startPingSimulator();
    setupSidebarToggle();
    setupDropdowns();
    setupCommandPalette();
    setupKeyboardShortcuts();
    syncActiveMenuItem();
  }

  function getOutlet() {
    return outlet;
  }

  function destroy() {
    if (clockIntervalId) window.clearInterval(clockIntervalId);
    if (pingIntervalId) window.clearInterval(pingIntervalId);

    clockIntervalId = null;
    pingIntervalId = null;

    closeAllOverlays({ force: true });
    unlockBodyScroll();

    for (const fn of teardown.splice(0)) {
      try {
        fn();
      } catch {
        // ignore
      }
    }

    outlet = null;

    for (const key of Object.keys(refs)) {
      refs[key] = null;
    }
  }

  // ---------- behaviors ----------

  function attachAvatarFallbacks() {
    const images = document.querySelectorAll("[data-vcr-avatar]");
    for (const img of images) {
      if (!(img instanceof HTMLImageElement)) continue;

      on(img, "error", () => {
        if (img.dataset.fallbackApplied === "1") return;
        img.dataset.fallbackApplied = "1";
        img.src = FALLBACK_AVATAR;
      });
    }
  }

  function startClock() {
    updateDateTime();
    clockIntervalId = window.setInterval(updateDateTime, 1000);
  }

  function updateDateTime() {
    if (!refs.dateEl || !refs.timeEl) return;

    const now = new Date();

    refs.dateEl.textContent = new Intl.DateTimeFormat("fa-IR", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(now);

    refs.timeEl.textContent = new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(now);
  }

  function startPingSimulator() {
    updatePingText();
    pingIntervalId = window.setInterval(updatePingText, 4000);
  }

  function updatePingText() {
    if (!refs.pingText) return;
    const ms = Math.floor(Math.random() * 15) + 18;
    refs.pingText.textContent = `${ms}ms • پایدار`;
  }

  function setupSidebarToggle() {
    if (!refs.sidebarToggle || !refs.body) return;

    on(refs.sidebarToggle, "click", () => {
      toolsMenuOpen = !toolsMenuOpen;
      refs.body.classList.toggle("is-collapsed", !toolsMenuOpen);
      refs.sidebarToggle.setAttribute("aria-expanded", toolsMenuOpen ? "true" : "false");
      writeSidebarState(toolsMenuOpen);
    });
  }

  function setNotifications(open) {
    notificationsOpen = Boolean(open);
    if (refs.notifPopover) refs.notifPopover.classList.toggle("hidden", !notificationsOpen);
    if (refs.notifBtn) refs.notifBtn.setAttribute("aria-expanded", notificationsOpen ? "true" : "false");
  }

  function setUserMenu(open) {
    userMenuOpen = Boolean(open);
    if (refs.userBtn) refs.userBtn.setAttribute("aria-expanded", userMenuOpen);
    if (refs.userBtn) refs.userBtn.setAttribute("aria-expanded", userMenuOpen ? "true" : "false");
  }

  function closeAllOverlays({ force = false } = {}) {
    setNotifications(false);
    setUserMenu(false);
    setCmdk(false, { force });
  }

  function setupDropdowns() {
    if (refs.notifBtn && refs.notifPopover) {
      on(refs.notifBtn, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setUserMenu(false);
        setNotifications(!notificationsOpen);
      });
    }

    if (refs.userBtn && refs.userPopover) {
      on(refs.userBtn, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setNotifications(false);
        setUserMenu(!userMenuOpen);
      });
    }

    on(document, "click", (e) => {
      const target = e.target;

      const clickedNotif =
        (refs.notifPopover && refs.notifPopover.contains(target)) ||
        (refs.notifBtn && refs.notifBtn.contains(target));

      const clickedUser =
        (refs.userPopover && refs.userPopover.contains(target)) ||
        (refs.userBtn && refs.userBtn.contains(target));

      if (!clickedNotif) setNotifications(false);
      if (!clickedUser) setUserMenu(false);

      const clickedAnyNavigationLink = target.closest?.("a[data-link], .vcr-popover-link");
      if (clickedAnyNavigationLink) {
        closeAllOverlays({ force: false });
      }
    });
  }

  function setupKeyboardShortcuts() {
    on(window, "keydown", (e) => {
      const key = (e.key || "").toLowerCase();

      // Ctrl/Cmd + B => toggle sidebar
      if ((e.ctrlKey || e.metaKey) && key === "b") {
        e + K();
        refs.sidebarToggle?.click();
        return;
      }

      // Ctrl/Cmd + K => toggle command palette
      if ((e.ctrlKey || e.metaKey) && key === "k") {
        e.preventDefault();
        if (cmdkOpen) {
          setCmdk(false);
        } else {
          setCmdk(true);
        }
        return;
      }

      // Esc => close overlays
      if (key === "escape" && (cmdkOpen || notificationsOpen || userMenuOpen)) {
        e.preventDefault();
        closeAllOverlays({ force: false });
      }
    });
  }

  function setupCommandPalette() {
    if (!refs.cmdkBtn || !refs.cmdkOverlay || !refs.cmdkInput || !refs.cmdkList) return;

    on(refs.cmdkBtn, "click", (e) => {
      e.preventDefault();
      setCmdk(true);
    });

    const closeBtn = safeQuery("#vcrCmdkCloseBtn");
    if (closeBtn) {
      on(closeBtn, "click", () => {
        setCmdk(false);
      });
    }

    on(refs.cmdkOverlay, "click", (e) => {
      if (e.target === refs.cmdkOverlay) {
        setCmdk(false);
      }
    });

    on(refs.cmdkInput, "input", () => {
      renderCmdkResults(refs.cmdkInput.value);
    });

    on(refs.cmdkInput, "keydown", (e) => {
      const key = (e.key || "").toLowerCase();
      const options = Array.from(refs.cmdkList.querySelectorAll(".vcr-cmdk-item"));

      const active = refs.cmdkList.querySelector(".vcr-cmdk-item.is-active");
      const activeIndex = active ? options.indexOf(active) : -1;

      if (key === "arrowdown") {
        e.preventDefault();
        const next = options[Math.min(activeIndex + 1, options.length - 1)] || options[0];
        setCmdkActiveItem(next);
      } else if (key === "arrowup") {
        e.preventDefault();
        const prev = options[Math.max(activeIndex - 1, 0)] || options[0];
        setCmdkActiveItem(prev);
      } else if (key === "enter") {
        e.preventDefault();
        const target = active || options[0];
        if (!target) return;
        const anchor = target.querySelector("a");
        if (anchor) {
          anchor.click();
          setCmdk(false);
        }
      } else if (key === "escape") {
        e.preventDefault();
        setCmdk(false);
      }
    });

    on(refs.cmdkList, "click", (e) => {
      const link = e.target.closest("a");
      if (link) {
        setCmdk(false);
      }
    });

    renderCmdkResults("");
  }

  function setCmdk(open, { force = false } = {}) {
    cmdkOpen = Boolean(open);

    if (!refs.cmdkOverlay || !refs.cmdkBtn) return;

    refs.cmdkOverlay.classList.toggle("hidden", !cmdkOpen);
    refs.cmdkOverlay.setAttribute("aria-hidden", cmdkOpen ? "false" : "true");
    refs.cmdkBtn.setAttribute("aria-expanded", cmdkOpen ? "true" : "false");

    if (cmdkOpen) {
      setNotifications(false);
      setUserMenu(false);
      renderCmdkResults(refs.cmdkInput?.value || "");
      lockBodyScroll();
      setTimeout(() => refs.cmdkInput?.focus(), 0);
    } else {
      unlockBodyScroll();
      if (!force) {
        setTimeout(() => refs.cmdkBtn?.focus(), 0);
      }
    }
  }

  function renderCmdkResults(query) {
    if (!refs.cmdkList) return;

    const q = String(query || "").trim().toLowerCase();
    const allItems = getFlatMenuItems();

    const filtered = q
      ? allItems.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
      : allItems;

    if (!filtered.length) {
      refs.cmdkList.innerHTML = `
        <div class="vcr-cmdk-empty">نتیجه‌ای پیدا نشد.</div>
      `;
      return;
    }

    refs.cmdkList.innerHTML = filtered
      .slice(0, 14)
      .map((item, index) => {
        const badge = item.badge
          ? `<span class="vcr-cmdk-badge">${escapeHtml(item.badge)}</span>`
          : "";

        return `
          <div class="vcr-cmdk-item ${index === 0 ? "is-active" : ""}" role="option" aria-selected="${
            index === 0 ? "true" : "false"
          }">
            <a class="vcr-cmdk-link" href="${item.link}" data-link>
              <span class="vcr-cmdk-item__title">${escapeHtml(item.title)}</span>
              <span class="vcr-cmdk-item__meta">${escapeHtml(item.category)}</span>
              ${badge}
            </a>
          </div>
        `;
      })
      .join("");
  }

  function setCmdkActiveItem(node) {
    if (!node || !refs.cmdkList) return;

    const items = refs.cmdkList.querySelectorAll(".vcr-cmdk-item");
    for (const item of items) {
      item.classList.remove("is-active");
      item.setAttribute("aria-selected", "false");
    }

    node.classList.add("is-active");
    node.setAttribute("aria-selected", "true");
    node.scrollIntoView({ block: "nearest" });
  }

  function syncActiveMenuItem() {
    const currentPath = getCurrentPathname();
    const links = document.querySelectorAll(".vcr-menu-link");

    for (const link of links) {
      const li = link.closest(".vcr-menu-item");
      if (!li) continue;

      const href = link.getAttribute("href");
      li.classList.toggle("active", href === currentPath);
    }
  }

  // ---------- public API ----------

  return {
    render,
    afterRender,
    getOutlet,
    destroy
  };
}
