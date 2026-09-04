// NotePage - نسخه Functional کامل پروژه ViXoRa
// پروژه: Multi-tool CRM/Accounting SPA - Backend-free (localStorage + json-server sync)
// تاریخ: ۱۴۰۵/۰۶/۱۳ - تولید شده با Grok 4.5

import {
  state,
  setGlobalNotes,
  subscribeGlobalState,
} from "../../core/state/globalState.js";

const storageKey = "vixora_notes_page_v1";

export default function createNotePage(context = {}) {
  let rootEl = null;
  let unsubscribeGlobal = null;
  let inputRenderTimer = null;
  let isDestroyed = false;
  let currentFocus = null;

  const state = {
    notes: [],
    headerConfig: {
      pinned: ["export", "import", "theme", "density"],
      menu: ["filter", "analytics", "templates", "customize"],
    },
    ui: {
      query: "",
      searchScope: "all",
      activeView: "grid",
      activeSort: "smart",
      groupBy: "status",
      selectedIds: [],
      selectionMode: false,
      showFavoritesOnly: false,
      showPinnedOnly: false,
      showArchivedOnly: false,
      showTrashOnly: false,
      showChecklistOnly: false,
      showOverdueOnly: false,
      showTodayOnly: false,
      isMoreMenuOpen: false,
      isFilterPanelOpen: false,
      isBulkBarOpen: false,
      isAnalyticsOpen: false,
      isTemplatePanelOpen: false,
      isHeaderCustomizeOpen: false,
      isQuickAddOpen: false,
      editingNoteId: null,
      draftNote: null,
      theme: "light",
      density: "comfortable",
    },
    meta: { createdAt: Date.now(), updatedAt: Date.now() },
  };

  const getVisibleNotes = () => {
    let notes = [...state.notes];

    // فیلترها
    if (state.ui.showFavoritesOnly) notes = notes.filter((n) => n.favorite);
    if (state.ui.showPinnedOnly) notes = notes.filter((n) => n.pinned);
    if (state.ui.showArchivedOnly) notes = notes.filter((n) => n.archived);
    if (state.ui.showTrashOnly) notes = notes.filter((n) => n.trashed);
    if (state.ui.showChecklistOnly) notes = notes.filter((n) => n.checklist?.length > 0);
    if (state.ui.showOverdueOnly) notes = notes.filter(isOverdue);
    if (state.ui.showTodayOnly) notes = notes.filter(isDueToday);

    // جستجو
    if (state.ui.query) {
      notes = notes.filter((n) => matchesSearch(n, state.ui.query, state.ui.searchScope));
    }

    return notes;
  };

  const matchesSearch = (note, query, scope) => {
    const q = query.toLowerCase();
    return note.title.toLowerCase().includes(q) ||
           note.content.toLowerCase().includes(q) ||
           (scope === "tags" && note.tags?.some(t => t.toLowerCase().includes(q))) ||
           (scope === "categories" && note.category?.toLowerCase().includes(q));
  };

  const sortNotes = (notesList, sortMode = "smart") => {
    let sorted = [...notesList];
    if (sortMode === "smart") {
      sorted.sort((a, b) => (b.pinned ? 10 : 0) - (a.pinned ? 10 : 0) ||
        (b.favorite ? 5 : 0) - (a.favorite ? 5 : 0) ||
        new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sortMode === "created") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortMode === "priority") sorted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return sorted;
  };

  const groupNotes = (notesList) => {
    // گروه‌بندی پیشرفته (status, priority, color, category, dueDate)
    const grouped = {};
    notesList.forEach((note) => {
      const key = state.ui.groupBy === "status" ? note.status || "no-status" :
                 state.ui.groupBy === "priority" ? note.priority || "no-priority" :
                 state.ui.groupBy === "category" ? note.category || "no-category" :
                 note.dueDate ? "due-soon" : "no-due";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(note);
    });
    return grouped;
  };

  const persistState = () => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const readPersistedState = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved) Object.assign(state, JSON.parse(saved));
  };

  const setState = (patch, options = {}) => {
    Object.assign(state, patch);
    if (options.persist) persistState();
    if (options.syncGlobal) setGlobalNotes(state.notes);
    if (options.preserveFocus && rootEl) currentFocus = document.activeElement;
    rerender();
    if (options.preserveFocus && rootEl && currentFocus) currentFocus.focus();
  };

  const syncToGlobalState = () => {
    setGlobalNotes(state.notes);
  };

  const createEmptyDraft = () => ({
    id: crypto.randomUUID(),
    title: "",
    content: "",
    category: "",
    dueAt: "",
    priority: "medium",
    color: "slate",
    status: "todo",
    tags: [],
    checklist: [],
    pinned: false,
    favorite: false,
    archived: false,
    trashed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const renderNoteCard = (note) => {
    const visible = getVisibleNotes();
    const isSelected = state.ui.selectedIds.includes(note.id);
    return `
      <div class="note-card ${note.pinned ? 'pinned' : ''} ${isSelected ? 'selected' : ''}" data-id="${note.id}">
        <div class="note-header">
          <input type="checkbox" ${isSelected ? 'checked' : ''} data-action="toggle-select" />
          <h3>${escapeHtml(note.title)}</h3>
          ${note.pinned ? '<span class="pin-icon">📌</span>' : ''}
        </div>
        <div class="note-content">${escapeHtml(note.content).slice(0, 120)}...</div>
        <div class="note-footer">
          <span class="priority ${note.priority}">${note.priority}</span>
          ${note.dueAt ? `<span class="due">${formatDate(note.dueAt)}</span>` : ''}
          ${note.favorite ? '<span class="favorite">⭐</span>' : ''}
        </div>
        <div class="note-actions">
          <button data-action="edit-note" data-id="${note.id}">✏️</button>
          <button data-action="toggle-pin" data-id="${note.id}">${note.pinned ? '📍' : '📎'}</button>
          <button data-action="toggle-favorite" data-id="${note.id}">${note.favorite ? '⭐' : '☆'}</button>
          <button data-action="delete-note" data-id="${note.id}">🗑</button>
        </div>
      </div>
    `;
  };

  const renderGridView = () => {
    const notes = sortNotes(getVisibleNotes(), state.ui.activeSort);
    return notes.map(renderNoteCard).join('');
  };

  const renderListView = () => ` <div class="list-view">لیست (در حال توسعه)</div> `;
  const renderBoardView = () => ` <div class="board-view">بورد (در حال توسعه)</div> `;
  const renderTimelineView = () => ` <div class="timeline-view">تایم‌لاین (در حال توسعه)</div> `;
  const renderCalendarView = () => ` <div class="calendar-view">تقویم (در حال توسعه)</div> `;
  const renderMasonryView = () => ` <div class="masonry-view">مasonry (در حال توسعه)</div> `;

  const renderActiveView = () => {
    switch (state.ui.activeView) {
      case "grid": return `<div class="note-grid">${renderGridView()}</div>`;
      case "list": return renderListView();
      case "board": return renderBoardView();
      case "timeline": return renderTimelineView();
      case "calendar": return renderCalendarView();
      case "masonry": return renderMasonryView();
      default: return `<div class="note-grid">${renderGridView()}</div>`;
    }
  };

  const renderHeader = () => `
    <header class="note-header">
      <div class="brand">Note Workspace</div>
      <div class="search-area">
        <input type="text" id="search-input" value="${state.ui.query}" placeholder="جستجو در یادداشت‌ها..." data-action="search" />
        <select data-action="search-scope">
          <option value="all">همه</option>
          <option value="title">عنوان</option>
          <option value="tags">تگ‌ها</option>
        </select>
      </div>
      <div class="header-actions">
        ${state.headerConfig.pinned.map(id => `<button data-action="${id}" class="pinned-btn">${getHeaderActionMeta(id)}</button>`).join('')}
        <button data-action="more-menu" class="more-btn">⋮</button>
      </div>
    </header>
  `;

  const getHeaderActionMeta = (actionId) => {
    const icons = {
      theme: state.ui.theme === "dark" ? "☀️" : "🌙",
      density: "🪶",
      export: "📤",
      import: "📥",
    };
    return icons[actionId] || actionId;
  };

  const renderSidebar = () => `
    <aside class="note-sidebar">
      <div class="buckets">
        <div data-action="show-all" class="bucket ${!state.ui.showFavoritesOnly && !state.ui.showPinnedOnly ? 'active' : ''}">همه</div>
        <div data-action="toggle-favorites" class="bucket ${state.ui.showFavoritesOnly ? 'active' : ''}">⭐</div>
        <div data-action="toggle-pinned" class="bucket ${state.ui.showPinnedOnly ? 'active' : ''}">📌</div>
      </div>
      <div class="quick-filters">فلترهای سریع (رنگ و اولویت)</div>
    </aside>
  `;

  const renderModals = () => `
    ${state.ui.isQuickAddOpen ? `
      <div class="modal">
        <div class="modal-content">
          <input id="modal-title" placeholder="عنوان" value="${state.ui.draftNote?.title || ''}" data-action="modal-title" />
          <textarea id="modal-content" placeholder="محتوا" data-action="modal-content">${state.ui.draftNote?.content || ''}</textarea>
          <button data-action="save-quick-note">ذخیره</button>
          <button data-action="close-modal">لغو</button>
        </div>
      </div>
    ` : ''}
  `;

  const render = () => `
    <section id="note-page" class="note-page theme-${state.ui.theme}">
      <div class="note-shell">
        ${renderHeader()}
        ${renderSidebar()}
        <main class="note-main">
          ${renderPanels()}
          <div class="note-active-view">
            ${renderActiveView()}
          </div>
        </main>
        ${renderModals()}
      </div>
    </section>
  `;

  const renderPanels = () => `
    ${state.ui.isFilterPanelOpen ? `<div class="panel filter-panel">پنل فیلتر</div>` : ''}
    ${state.ui.isBulkBarOpen ? `<div class="bulk-bar">Bulk Actions</div>` : ''}
  `;

  const escapeHtml = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("fa-IR");
  };

  const isOverdue = (note) => note.dueAt && new Date(note.dueAt) < new Date();
  const isDueToday = (note) => note.dueAt && new Date(note.dueAt).toDateString() === new Date().toDateString();

  const scheduleInputRender = () => {
    if (inputRenderTimer) clearTimeout(inputRenderTimer);
    inputRenderTimer = setTimeout(() => {
      if (rootEl) rootEl.innerHTML = render();
      if (rootEl) attachEventListeners();
    }, 180);
  };

  const attachEventListeners = () => {
    rootEl.addEventListener("click", onRootClick);
    rootEl.addEventListener("input", onRootInput);
    rootEl.addEventListener("change", onRootChange);
    rootEl.addEventListener("keydown", onKeyDown);
  };

  const onRootClick = (e) => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;

    if (action === "search") {
      state.ui.query = e.target.value;
      setState({ ui: state.ui }, { persist: true });
      return;
    }

    switch (action) {
      case "toggle-select":
        state.ui.selectedIds = e.target.checked
          ? [...state.ui.selectedIds, id]
          : state.ui.selectedIds.filter((i) => i !== id);
        setState({ ui: state.ui });
        break;

      case "edit-note":
        state.ui.editingNoteId = id;
        state.ui.draftNote = state.notes.find((n) => n.id === id) || createEmptyDraft();
        state.ui.isQuickAddOpen = true;
        setState({ ui: state.ui }, { persist: true });
        break;

      case "save-quick-note":
        const draft = state.ui.draftNote;
        if (draft) {
          if (draft.id) {
            const index = state.notes.findIndex((n) => n.id === draft.id);
            state.notes[index] = { ...draft, updatedAt: Date.now() };
          } else {
            state.notes.push({ ...draft, id: crypto.randomUUID(), createdAt: Date.now() });
          }
          setState({ notes: state.notes, ui: { ...state.ui, isQuickAddOpen: false, draftNote: null } }, { persist: true, syncGlobal: true });
        }
        break;

      case "close-modal":
        state.ui.isQuickAddOpen = false;
        state.ui.draftNote = null;
        setState({ ui: state.ui }, { persist: true });
        break;

      case "toggle-pin":
        const note = state.notes.find((n) => n.id === id);
        if (note) {
          note.pinned = !note.pinned;
          setState({ notes: state.notes }, { persist: true, syncGlobal: true });
        }
        break;

      case "toggle-favorite":
        const favNote = state.notes.find((n) => n.id === id);
        if (favNote) {
          favNote.favorite = !favNote.favorite;
          setState({ notes: state.notes }, { persist: true, syncGlobal: true });
        }
        break;

      case "delete-note":
        state.notes = state.notes.filter((n) => n.id !== id);
        setState({ notes: state.notes }, { persist: true, syncGlobal: true });
        break;

      case "show-all":
        state.ui.showFavoritesOnly = false;
        state.ui.showPinnedOnly = false;
        setState({ ui: state.ui }, { persist: true });
        break;

      case "toggle-favorites":
        state.ui.showFavoritesOnly = !state.ui.showFavoritesOnly;
        setState({ ui: state.ui }, { persist: true });
        break;

      case "toggle-pinned":
        state.ui.showPinnedOnly = !state.ui.showPinnedOnly;
        setState({ ui: state.ui }, { persist: true });
        break;

      case "theme":
        state.ui.theme = state.ui.theme === "light" ? "dark" : "light";
        setState({ ui: state.ui }, { persist: true });
        break;

      case "more-menu":
        state.ui.isMoreMenuOpen = !state.ui.isMoreMenuOpen;
        setState({ ui: state.ui }, { persist: true });
        break;

      case "export":
        exportNotes();
        break;

      case "import":
        importNotes();
        break;

      // سایر اکشن‌ها (bulk، filter، view change و …) را می‌توانی گسترش بدی
    }
  };

  const onRootInput = (e) => {
    const action = e.target.dataset.action;
    if (action === "search") {
      state.ui.query = e.target.value;
      scheduleInputRender();
    } else if (state.ui.draftNote) {
      state.ui.draftNote[e.target.id.replace("modal-", "")] = e.target.value;
      setState({ ui: state.ui }, { persist: true });
    }
  };

  const onRootChange = (e) => {
    const action = e.target.dataset.action;
    if (action === "search-scope") {
      state.ui.searchScope = e.target.value;
      setState({ ui: state.ui }, { persist: true });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      state.ui.isQuickAddOpen = false;
      state.ui.draftNote = null;
      setState({ ui: state.ui }, { persist: true });
    }
  };

  const exportNotes = () => {
    const data = JSON.stringify(state.notes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importNotes = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imported = JSON.parse(ev.target.result);
        state.notes = [...state.notes, ...imported];
        setState({ notes: state.notes }, { persist: true, syncGlobal: true });
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const afterRender = () => {
    rootEl = document.getElementById("note-page") || document.querySelector(".note-page");
    if (!rootEl) return;

    attachEventListeners();

    // بازگرداندن فوکوس
    if (currentFocus) currentFocus.focus();

    // بوت‌استرپ اولیه اگر لازم
    if (state.notes.length === 0) {
      state.notes = [
        { id: crypto.randomUUID(), title: "یادداشت اول", content: "سلام دنیا!", createdAt: Date.now() },
      ];
      setState({ notes: state.notes }, { persist: true, syncGlobal: true });
    }
  };

  const cleanup = () => {
    isDestroyed = true;
    if (inputRenderTimer) clearTimeout(inputRenderTimer);
    if (unsubscribeGlobal) unsubscribeGlobal();
    if (rootEl) {
      rootEl.removeEventListener("click", onRootClick);
      rootEl.removeEventListener("input", onRootInput);
      rootEl.removeEventListener("change", onRootChange);
      rootEl.removeEventListener("keydown", onKeyDown);
    }
  };

  const rerender = () => {
    if (!rootEl) return;
    rootEl.innerHTML = render();
    afterRender();
  };

  // شروع اصلی
  const init = () => {
    readPersistedState();
    syncToGlobalState();

    unsubscribeGlobal = subscribeGlobalState((next) => {
      if (isDestroyed) return;
      if (next.notes && JSON.stringify(next.notes) !== JSON.stringify(state.notes)) {
        state.notes = next.notes;
        rerender();
      }
    });

    // رندر اولیه
    const container = document.getElementById("page-content") || document.querySelector("[data-page='note']");
    container.innerHTML = render();
    rootEl = container.firstElementChild;
    afterRender();
  };

  // برای استفاده در SPA
  return {
    render,
    afterRender,
    cleanup,
    rerender,
    init,
    destroy: cleanup,
  };
}
