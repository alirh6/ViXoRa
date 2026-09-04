import { state as globalStateRef, setGlobalNotes } from "../../core/state/globalState.js";

export const STORAGE_KEY = "vixora_notes_page_v1";

/**
 * وضعیت پیش‌فرض کامل منطبق بر کلاس NotePage
 */
export function getDefaultState() {
  const now = new Date().toISOString();
  return {
    notes: [],
    headerConfig: {
      pinned: ["toggle-theme", "toggle-density", "toggle-analytics"],
      menu: [
        "toggle-template-panel",
        "toggle-header-customize",
        "export-notes",
        "import-notes",
        "clear-filters",
      ],
    },
    ui: {
      query: "",
      searchScope: "all",
      activeView: "grid",
      activeSort: "smart",
      groupBy: "none",
      selectedIds: [],
      selectionMode: false,
      activeBucket: "all",
      activePriorityFilter: "all",
      activeColorFilter: "all",
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
      theme: "dark",
      density: "comfortable",
      editingNoteId: null,
      draftNote: {
        title: "",
        content: "",
        category: "",
        priority: "medium",
        color: "blue",
        status: "todo",
        dueAt: "",
        tags: "",
      },
    },
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * خواندن امن داده‌ها از localStorage
 */
export function readPersistedState(storageKey = STORAGE_KEY) {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[NoteState] Failed to read persisted state:", err);
    return null;
  }
}

/**
 * ذخیره امن کل وضعیت در localStorage
 */
export function persistState(currentState, storageKey = STORAGE_KEY) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(currentState));
  } catch (err) {
    console.warn("[NoteState] Failed to persist state:", err);
  }
}

/**
 * همگام‌سازی یک‌طرفه با globalState
 * - ارسال آرایه یادداشت‌ها به setGlobalNotes
 * - درج مشخصات تکمیلی در customGlobalState.noteWorkspace
 */
export function syncToGlobalState(currentState, customGlobalState = globalStateRef) {
  if (!customGlobalState) return;

  const notes = Array.isArray(currentState.notes)
    ? currentState.notes.map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? [...note.tags] : [],
        checklist: Array.isArray(note.checklist) ? [...note.checklist] : [],
      }))
    : [];

  if (typeof setGlobalNotes === "function") {
    setGlobalNotes(notes);
  } else {
    customGlobalState.notes = notes;
  }

  customGlobalState.noteWorkspace = {
    ui: {
      ...currentState.ui,
      draftNote: { ...(currentState.ui?.draftNote || {}) },
    },
    headerConfig: {
      ...currentState.headerConfig,
      pinned: [...(currentState.headerConfig?.pinned || [])],
      menu: [...(currentState.headerConfig?.menu || [])],
    },
    meta: { ...(currentState.meta || {}) },
  };
}

/**
 * آماده‌سازی وضعیت اولیه با حفظ اولویت:
 * localStorage > globalState.notes > defaultState
 */
export function getInitialState({
  storageKey = STORAGE_KEY,
  customGlobalState = globalStateRef,
} = {}) {
  const defaults = getDefaultState();
  const saved = readPersistedState(storageKey);

  if (!saved) {
    const globalNotes = customGlobalState?.notes;
    if (Array.isArray(globalNotes) && globalNotes.length > 0) {
      return {
        ...defaults,
        notes: [...globalNotes],
      };
    }
    return defaults;
  }

  const initialNotes = Array.isArray(saved.notes)
    ? saved.notes
    : Array.isArray(customGlobalState?.notes)
    ? customGlobalState.notes
    : defaults.notes;

  return {
    ...defaults,
    ...saved,
    notes: initialNotes,
    headerConfig: {
      ...defaults.headerConfig,
      ...(saved.headerConfig || {}),
      pinned: Array.isArray(saved.headerConfig?.pinned)
        ? saved.headerConfig.pinned
        : defaults.headerConfig.pinned,
      menu: Array.isArray(saved.headerConfig?.menu)
        ? saved.headerConfig.menu
        : defaults.headerConfig.menu,
    },
    ui: {
      ...defaults.ui,
      ...(saved.ui || {}),
      selectedIds: Array.isArray(saved.ui?.selectedIds) ? saved.ui.selectedIds : [],
      draftNote: {
        ...defaults.ui.draftNote,
        ...(saved.ui?.draftNote || {}),
      },
    },
    meta: {
      ...defaults.meta,
      ...(saved.meta || {}),
    },
  };
}

/**
 * کارخانه ساخت State Store برای ماژول Note
 */
export function createNoteState({
  storageKey = STORAGE_KEY,
  customGlobalState = globalStateRef,
  onRender = () => {},
} = {}) {
  let state = getInitialState({ storageKey, customGlobalState });

  function getState() {
    return state;
  }

  function setState(patch = {}, options = {}) {
    const {
      render = true,
      persist = true,
      syncGlobal = true,
      preserveFocus = false,
    } = options;

    const nextUI = patch.ui
      ? {
          ...state.ui,
          ...patch.ui,
          draftNote: patch.ui.draftNote
            ? { ...state.ui.draftNote, ...patch.ui.draftNote }
            : state.ui.draftNote,
        }
      : state.ui;

    const nextHeaderConfig = patch.headerConfig
      ? { ...state.headerConfig, ...patch.headerConfig }
      : state.headerConfig;

    const nextMeta = {
      ...state.meta,
      ...(patch.meta || {}),
      updatedAt: new Date().toISOString(),
    };

    state = {
      ...state,
      ...patch,
      ui: nextUI,
      headerConfig: nextHeaderConfig,
      meta: nextMeta,
    };

    if (syncGlobal) {
      syncToGlobalState(state, customGlobalState);
    }

    if (persist) {
      persistState(state, storageKey);
    }

    if (render) {
      onRender({ preserveFocus });
    }

    return state;
  }

  function updateUI(updater, opts = {}) {
    const nextUI =
      typeof updater === "function" ? updater({ ...state.ui }) : updater;
    return setState({ ui: nextUI }, opts);
  }

  function findNoteById(noteId) {
    return (state.notes || []).find((n) => n.id === noteId) || null;
  }

  // اولین سینک در زمان راه‌اندازی (مطابق خط ۳۱ کلاس قدیمی)
  syncToGlobalState(state, customGlobalState);

  return {
    getState,
    setState,
    updateUI,
    findNoteById,
  };
}
