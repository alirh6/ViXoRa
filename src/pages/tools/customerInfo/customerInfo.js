// features/customer-info/create-customer-info-page.js

const DEFAULT_PAGE_SIZE = 20;

function safeUUID() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // Fallback: still very unlikely collision
  return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.min(max, Math.max(min, x));
}

function normalizeText(s) {
  return String(s ?? "").trim().toLowerCase();
}

function isValidEmail(email) {
  const v = normalizeText(email);
  if (!v) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(phone) {
  const v = normalizeText(phone);
  if (!v) return true; // optional
  // permissive (international-ish)
  return /^[0-9+\-()\s]{7,20}$/.test(v);
}

function parseMoney(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

function formatMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Weighted search scoring:
 * - exact prefix match higher
 * - substring match lower
 */
function scoreField(fieldValue, q) {
  const v = normalizeText(fieldValue);
  if (!v || !q) return 0;
  if (v === q) return 100;
  if (v.startsWith(q)) return 70;
  const idx = v.indexOf(q);
  if (idx >= 0) return 40 - Math.min(idx, 20);
  return 0;
}

function scoreCustomer(c, q) {
  if (!q) return 1;
  const s =
    scoreField(c.name, q) * 3 +
    scoreField(c.email, q) * 2 +
    scoreField(c.phone, q) * 2 +
    scoreField(c.address, q) * 1 +
    scoreField(c.notes, q) * 1;

  return s;
}

function sortCustomers(list, sortKey) {
  const arr = [...list];
  switch (sortKey) {
    case "alphabetical":
      arr.sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name)));
      return arr;
    case "balance-asc":
      arr.sort((a, b) => (Number(a.balance) || 0) - (Number(b.balance) || 0));
      return arr;
    case "balance-desc":
      arr.sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0));
      return arr;
    case "recent":
    default:
      arr.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      return arr;
  }
}

function deriveInsights(customers) {
  const total = customers.reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
  const avg = customers.length ? total / customers.length : 0;
  const vip = customers.filter((c) => c.tier === "vip").length;
  const regular = customers.length - vip;
  return {
    total,
    avg,
    count: customers.length,
    vip,
    regular,
    vipRatio: customers.length ? vip / customers.length : 0,
  };
}

function toCSV(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows
    .map((r) => columns.map((c) => esc(typeof c.get === "function" ? c.get(r) : r[c.key])).join(","))
    .join("\n");

  return `${header}\n${body}\n`;
}

function downloadTextFile({ filename, text, mime = "text/plain;charset=utf-8" }) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Factory
 * Expected ctx shape (adapt as needed):
 * - ctx.appStore: { getState, setState, subscribe }
 */
export function createCustomerInfoPage(ctx) {
  if (!ctx?.appStore) throw new Error("createCustomerInfoPage: ctx.appStore is required");

  // ---- Store adapter (map to your real createStore API if different)
  const store = ctx.appStore;
  const getRootState = () => (typeof store.getState === "function" ? store.getState() : store.state);
  const setRootState = (updater) => {
    // supports either setState(fn) or setState(partial)
    if (typeof store.setState === "function") {
      store.setState(updater);
      return;
    }
    throw new Error("appStore.setState is required");
  };

  // ---- State slice helpers
  const SLICE_PATH = ["tools", "customerInfo"];

  function getSlice(s) {
    let cur = s;
    for (const k of SLICE_PATH) cur = cur?.[k];
    return cur;
  }

  function ensureDefaults(prevSlice) {
    const slice = prevSlice ?? {};
    return {
      customers: Array.isArray(slice.customers) ? slice.customers : [],
      preferences: {
        view: slice.preferences?.view ?? "grid", // grid | table | split
        sort: slice.preferences?.sort ?? "recent", // recent | alphabetical | balance-asc | balance-desc
        pageSize: slice.preferences?.pageSize ?? DEFAULT_PAGE_SIZE,
      },
      ui: {
        query: slice.ui?.query ?? "",
        page: slice.ui?.page ?? 1,
        selectedId: slice.ui?.selectedId ?? null,
        selectedIds: Array.isArray(slice.ui?.selectedIds) ? slice.ui.selectedIds : [],
        modalOpen: slice.ui?.modalOpen ?? false,
        modalMode: slice.ui?.modalMode ?? "create", // create | edit
        spotlightOpen: slice.ui?.spotlightOpen ?? false,
      },
    };
  }

  function updateSlice(mutator) {
    setRootState((prev) => {
      const prevSlice = ensureDefaults(getSlice(prev));
      const nextSlice = mutator(structuredClone(prevSlice));
      const next = structuredClone(prev ?? {});
      next.tools = next.tools ?? {};
      next.tools.customerInfo = nextSlice;
      return next;
    });
  }

  // ---- DOM
  let rootEl = null;
  let unsub = null;

  const sel = {
    query: () => rootEl?.querySelector("[data-ci='query']"),
    sort: () => rootEl?.querySelector("[data-ci='sort']"),
    viewBtns: () => rootEl?.querySelectorAll("[data-ci-view]"),
    list: () => rootEl?.querySelector("[data-ci='list']"),
    pagination: () => rootEl?.querySelector("[data-ci='pagination']"),
    batchBar: () => rootEl?.querySelector("[data-ci='batch']"),
    insights: () => rootEl?.querySelector("[data-ci='insights']"),
    modal: () => rootEl?.querySelector("[data-ci='modal']"),
    modalTitle: () => rootEl?.querySelector("[data-ci='modal-title']"),
    modalForm: () => rootEl?.querySelector("[data-ci='modal-form']"),
    spotlight: () => rootEl?.querySelector("[data-ci='spotlight']"),
    spotlightInput: () => rootEl?.querySelector("[data-ci='spotlight-input']"),
    spotlightResults: () => rootEl?.querySelector("[data-ci='spotlight-results']"),
  };

  function deriveProcessed(slice) {
    const q = normalizeText(slice.ui.query);
    const scored = slice.customers
      .map((c) => ({ c, score: scoreCustomer(c, q) }))
      .filter((x) => x.score > 0);

    // If query present => prefer score ordering, then preference sort as tie-break
    if (q) {
      scored.sort((a, b) => b.score - a.score);
      const base = scored.map((x) => x.c);
      return base;
    }
    return sortCustomers(scored.map((x) => x.c), slice.preferences.sort);
  }

  function paginate(list, page, pageSize) {
    const total = list.length;
    const size = clampInt(pageSize, 5, 200);
    const totalPages = Math.max(1, Math.ceil(total / size));
    const p = clampInt(page, 1, totalPages);
    const start = (p - 1) * size;
    const end = start + size;
    return { page: p, pageSize: size, total, totalPages, items: list.slice(start, end) };
  }

  function renderShell(container) {
    container.innerHTML = `
      <section class="vcr-card vcr-ci">
        <header class="vcr-toolbar vcr-ci__toolbar">
          <div class="vcr-toolbar__left">
            <button class="vcr-btn vcr-btn--primary" data-ci-action="open-create" type="button">
              Add customer
            </button>

            <div class="vcr-inputGroup vcr-ci__search">
              <input class="vcr-input" data-ci="query" type="search" placeholder="Search customers…" autocomplete="off" />
              <button class="vcr-btn vcr-btn--ghost" data-ci-action="open-spotlight" type="button" aria-label="Open spotlight">
                Ctrl K
              </button>
            </div>
          </div>

          <div class="vcr-toolbar__right">
            <select class="vcr-select" data-ci="sort" aria-label="Sort">
              <option value="recent">Recent</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="balance-desc">Balance desc</option>
              <option value="balance-asc">Balance asc</option>
            </select>

            <div class="vcr-seg" role="tablist" aria-label="View">
              <button class="vcr-seg__btn" data-ci-view="grid" type="button">Grid</button>
              <button class="vcr-seg__btn" data-ci-view="table" type="button">Table</button>
              <button class="vcr-seg__btn" data-ci-view="split" type="button">Split</button>
            </div>
          </div>
        </header>

        <div class="vcr-ci__meta" data-ci="insights"></div>

        <div class="vcr-ci__batch vcr-hidden" data-ci="batch">
          <div class="vcr-ci__batchLeft">
            <span class="vcr-text-muted" data-ci="batch-count">0 selected</span>
          </div>
          <div class="vcr-ci__batchRight">
            <button class="vcr-btn vcr-btn--danger" data-ci-action="batch-delete" type="button">Delete</button>
            <button class="vcr-btn vcr-btn--secondary" data-ci-action="batch-csv" type="button">Export CSV</button>
            <button class="vcr-btn vcr-btn--ghost" data-ci-action="batch-clear" type="button">Clear</button>
          </div>
        </div>

        <main class="vcr-ci__content">
          <div data-ci="list"></div>
          <div class="vcr-ci__pagination" data-ci="pagination"></div>
        </main>

        <div class="vcr-overlay vcr-hidden" data-ci="modal" role="dialog" aria-modal="true" aria-label="Customer modal">
          <div class="vcr-modal">
            <div class="vcr-modal__head">
              <h3 class="vcr-modal__title" data-ci="modal-title">Add customer</h3>
              <button class="vcr-btn vcr-btn--ghost" data-ci-action="close-modal" type="button" aria-label="Close">X</button>
            </div>

            <form class="vcr-modal__body" data-ci="modal-form">
              <div class="vcr-grid2">
                <label class="vcr-field">
                  <span>Name *</span>
                  <input class="vcr-input" name="name" required />
                </label>

                <label class="vcr-field">
                  <span>Tier</span>
                  <select class="vcr-select" name="tier">
                    <option value="regular">Regular</option>
                    <option value="vip">VIP</option>
                  </select>
                </label>

                <label class="vcr-field">
                  <span>Email</span>
                  <input class="vcr-input" name="email" type="email" />
                </label>

                <label class="vcr-field">
                  <span>Phone</span>
                  <input class="vcr-input" name="phone" inputmode="tel" />
                </label>

                <label class="vcr-field">
                  <span>Balance</span>
                  <input class="vcr-input" name="balance" inputmode="decimal" placeholder="0" />
                </label>

                <label class="vcr-field">
                  <span>Avatar URL</span>
                  <input class="vcr-input" name="avatarUrl" />
                </label>
              </div>

              <label class="vcr-field">
                <span>Address</span>
                <input class="vcr-input" name="address" />
              </label>

              <label class="vcr-field">
                <span>Notes</span>
                <textarea class="vcr-textarea" name="notes" rows="4"></textarea>
              </label>

              <div class="vcr-modal__foot">
                <div class="vcr-formError vcr-hidden" data-ci="form-error"></div>
                <button class="vcr-btn vcr-btn--primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>

        <div class="vcr-overlay vcr-hidden" data-ci="spotlight" role="dialog" aria-modal="true" aria-label="Spotlight">
          <div class="vcr-spotlight">
            <div class="vcr-spotlight__head">
              <input class="vcr-input vcr-spotlight__input" data-ci="spotlight-input" type="search" placeholder="Type to search…" />
              <button class="vcr-btn vcr-btn--ghost" data-ci-action="close-spotlight" type="button">Esc</button>
            </div>
            <div class="vcr-spotlight__results" data-ci="spotlight-results"></div>
          </div>
        </div>
      </section>
    `;
  }

  function renderInsights(slice) {
    const box = sel.insights();
    const processed = deriveProcessed(slice);
    const ins = deriveInsights(processed);
    box.innerHTML = `
      <div class="vcr-ci__insights">
        <div class="vcr-ci__chip"><span class="k">Customers</span><span class="v">${ins.count}</span></div>
        <div class="vcr-ci__chip"><span class="k">Total</span><span class="v">${formatMoney(ins.total)}</span></div>
        <div class="vcr-ci__chip"><span class="k">Average</span><span class="v">${formatMoney(ins.avg)}</span></div>
        <div class="vcr-ci__chip"><span class="k">VIP</span><span class="v">${ins.vip}</span></div>
      </div>
    `;
  }

  function renderBatchBar(slice) {
    const bar = sel.batchBar();
    const count = slice.ui.selectedIds.length;
    bar.classList.toggle("vcr-hidden", count === 0);
    const c = bar.querySelector("[data-ci='batch-count']");
    if (c) c.textContent = `${count} selected`;
  }

  function renderPagination(p) {
    const el = sel.pagination();
    el.innerHTML = `
      <div class="vcr-ci__pager">
        <button class="vcr-btn vcr-btn--ghost" data-ci-action="page-prev" type="button" ${p.page <= 1 ? "disabled" : ""}>Prev</button>
        <span class="vcr-text-muted">Page ${p.page} / ${p.totalPages}</span>
        <button class="vcr-btn vcr-btn--ghost" data-ci-action="page-next" type="button" ${p.page >= p.totalPages ? "disabled" : ""}>Next</button>

        <span class="vcr-ci__pagerSep"></span>

        <label class="vcr-field vcr-ci__pageSize">
          <span class="vcr-text-muted">Page size</span>
          <select class="vcr-select" data-ci-action="page-size">
            ${[10, 20, 50, 100]
              .map((n) => `<option value="${n}" ${Number(p.pageSize) === n ? "selected" : ""}>${n}</option>`)
              .join("")}
          </select>
        </label>
      </div>
    `;
  }

  function renderList(slice) {
    const listEl = sel.list();
    const processed = deriveProcessed(slice);
    const p = paginate(processed, slice.ui.page, slice.preferences.pageSize);

    // keep ui.page clamped in state
    if (p.page !== slice.ui.page || p.pageSize !== slice.preferences.pageSize) {
      updateSlice((s) => {
        s.ui.page = p.page;
        s.preferences.pageSize = p.pageSize;
        return s;
      });
      return;
    }

    const selectedSet = new Set(slice.ui.selectedIds);
    const view = slice.preferences.view;

    if (view === "table") {
      listEl.innerHTML = `
        <div class="vcr-tableWrap">
          <table class="vcr-table">
            <thead>
              <tr>
                <th><input type="checkbox" data-ci-action="select-all-page" aria-label="Select all on page" /></th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tier</th>
                <th class="num">Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${p.items
                .map((c) => {
                  const checked = selectedSet.has(c.id) ? "checked" : "";
                  return `
                    <tr data-ci-row="${c.id}">
                      <td><input type="checkbox" data-ci-action="toggle-select" data-id="${c.id}" ${checked} /></td>
                      <td>
                        <button class="vcr-link" type="button" data-ci-action="open-details" data-id="${c.id}">
                          ${c.name ?? "—"}
                        </button>
                      </td>
                      <td>${c.email ?? ""}</td>
                      <td>${c.phone ?? ""}</td>
                      <td><span class="vcr-badge ${c.tier === "vip" ? "vcr-badge--vip" : "vcr-badge--regular"}">${c.tier ?? "regular"}</span></td>
                      <td class="num">${formatMoney(c.balance)}</td>
                      <td class="actions">
                        <button class="vcr-btn vcr-btn--ghost" type="button" data-ci-action="open-edit" data-id="${c.id}">Edit</button>
                        <button class="vcr-btn vcr-btn--ghost" type="button" data-ci-action="delete-one" data-id="${c.id}">Delete</button>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } else if (view === "split") {
      const activeId = slice.ui.selectedId ?? p.items[0]?.id ?? null;
      const active = slice.customers.find((x) => x.id === activeId) ?? null;

      listEl.innerHTML = `
        <div class="vcr-ci__split">
          <aside class="vcr-ci__splitList">
            ${p.items
              .map((c) => {
                const isActive = c.id === activeId;
                return `
                  <button class="vcr-ci__splitItem ${isActive ? "is-active" : ""}" type="button" data-ci-action="select-split" data-id="${c.id}">
                    <div class="t">${c.name ?? "—"}</div>
                    <div class="s">${c.email ?? c.phone ?? ""}</div>
                  </button>
                `;
              })
              .join("")}
          </aside>

          <section class="vcr-ci__splitDetail">
            ${
              active
                ? `
                  <div class="vcr-ci__detailHead">
                    <div class="vcr-ci__avatar">${(active.name ?? "?").slice(0, 1).toUpperCase()}</div>
                    <div class="vcr-ci__detailTitle">
                      <div class="name">${active.name ?? "—"}</div>
                      <div class="meta">
                        <span class="vcr-badge ${active.tier === "vip" ? "vcr-badge--vip" : "vcr-badge--regular"}">${active.tier ?? "regular"}</span>
                        <span class="vcr-text-muted">${formatMoney(active.balance)}</span>
                      </div>
                    </div>
                    <div class="vcr-ci__detailActions">
                      <button class="vcr-btn vcr-btn--secondary" type="button" data-ci-action="open-edit" data-id="${active.id}">Edit</button>
                      <button class="vcr-btn vcr-btn--danger" type="button" data-ci-action="delete-one" data-id="${active.id}">Delete</button>
                    </div>
                  </div>

                  <div class="vcr-ci__detailBody">
                    <div class="vcr-ci__kv"><span class="k">Email</span><span class="v">${active.email ?? ""}</span></div>
                    <div class="vcr-ci__kv"><span class="k">Phone</span><span class="v">${active.phone ?? ""}</span></div>
                    <div class="vcr-ci__kv"><span class="k">Address</span><span class="v">${active.address ?? ""}</span></div>
                    <div class="vcr-ci__kv"><span class="k">Notes</span><span class="v">${active.notes ?? ""}</span></div>
                  </div>

                  <div class="vcr-ci__timeline">
                    <div class="vcr-ci__timelineTitle">Activity</div>
                    <div class="vcr-text-muted">Hook this to your Logs slice when ready.</div>
                  </div>
                `
                : `<div class="vcr-empty">No customer selected.</div>`
            }
          </section>
        </div>
      `;
    } else {
      // grid
      listEl.innerHTML = `
        <div class="vcr-ci__grid">
          ${p.items
            .map((c) => {
              const checked = selectedSet.has(c.id) ? "checked" : "";
              return `
                <article class="vcr-ci__card" data-ci-card="${c.id}">
                  <header class="vcr-ci__cardHead">
                    <div class="vcr-ci__avatar">${(c.name ?? "?").slice(0, 1).toUpperCase()}</div>
                    <div class="vcr-ci__cardTitle">
                      <div class="name">${c.name ?? "—"}</div>
                      <div class="sub">${c.email ?? c.phone ?? ""}</div>
                    </div>
                    <input type="checkbox" data-ci-action="toggle-select" data-id="${c.id}" ${checked} aria-label="Select customer" />
                  </header>

                  <div class="vcr-ci__cardBody">
                    <div class="row">
                      <span class="vcr-badge ${c.tier === "vip" ? "vcr-badge--vip" : "vcr-badge--regular"}">${c.tier ?? "regular"}</span>
                      <span class="vcr-ci__money">${formatMoney(c.balance)}</span>
                    </div>
                    <div class="vcr-ci__muted">${c.address ?? ""}</div>
                  </div>

                  <footer class="vcr-ci__cardFoot">
                    <button class="vcr-btn vcr-btn--ghost" type="button" data-ci-action="open-edit" data-id="${c.id}">Edit</button>
                    <button class="vcr-btn vcr-btn--ghost" type="button" data-ci-action="delete-one" data-id="${c.id}">Delete</button>
                  </footer>
                </article>
              `;
            })
            .join("")}
        </div>
      `;
    }

    renderPagination(p);
  }

  function setActiveViewButtons(view) {
    for (const btn of sel.viewBtns() ?? []) {
      btn.classList.toggle("is-active", btn.getAttribute("data-ci-view") === view);
    }
  }

  function openModal(mode, customer) {
    updateSlice((s) => {
      s.ui.modalOpen = true;
      s.ui.modalMode = mode;
      if (mode === "edit") s.ui.selectedId = customer?.id ?? s.ui.selectedId;
      return s;
    });

    const modal = sel.modal();
    const title = sel.modalTitle();
    const form = sel.modalForm();
    const err = rootEl.querySelector("[data-ci='form-error']");

    modal.classList.remove("vcr-hidden");
    if (err) err.classList.add("vcr-hidden");

    title.textContent = mode === "edit" ? "Edit customer" : "Add customer";

    form.reset();
    if (customer) {
      form.elements.name.value = customer.name ?? "";
      form.elements.tier.value = customer.tier ?? "regular";
      form.elements.email.value = customer.email ?? "";
      form.elements.phone.value = customer.phone ?? "";
      form.elements.balance.value = customer.balance ?? 0;
      form.elements.avatarUrl.value = customer.avatarUrl ?? "";
      form.elements.address.value = customer.address ?? "";
      form.elements.notes.value = customer.notes ?? "";
    }

    // focus
    setTimeout(() => form.elements.name.focus(), 0);
  }

  function closeModal() {
    updateSlice((s) => {
      s.ui.modalOpen = false;
      return s;
    });
    sel.modal()?.classList.add("vcr-hidden");
  }

  function openSpotlight() {
    updateSlice((s) => {
      s.ui.spotlightOpen = true;
      return s;
    });
    const sp = sel.spotlight();
    sp.classList.remove("vcr-hidden");
    setTimeout(() => sel.spotlightInput()?.focus(), 0);
    renderSpotlightResults();
  }

  function closeSpotlight() {
    updateSlice((s) => {
      s.ui.spotlightOpen = false;
      return s;
    });
    sel.spotlight()?.classList.add("vcr-hidden");
  }

  function renderSpotlightResults() {
    const slice = ensureDefaults(getSlice(getRootState()));
    const q = normalizeText(sel.spotlightInput()?.value ?? "");
    const processed = slice.customers
      .map((c) => ({ c, score: scoreCustomer(c, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.c);

    const box = sel.spotlightResults();
    box.innerHTML = processed.length
      ? processed
          .map(
            (c) => `
              <button class="vcr-spotlight__item" type="button" data-ci-action="spotlight-pick" data-id="${c.id}">
                <div class="t">${c.name ?? "—"}</div>
                <div class="s">${c.email ?? c.phone ?? ""}</div>
              </button>
            `
          )
          .join("")
      : `<div class="vcr-empty">No results</div>`;
  }

  function toggleSelect(id) {
    updateSlice((s) => {
      const set = new Set(s.ui.selectedIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      s.ui.selectedIds = [...set];
      return s;
    });
  }

  function selectAllOnPage() {
    const slice = ensureDefaults(getSlice(getRootState()));
    const processed = deriveProcessed(slice);
    const p = paginate(processed, slice.ui.page, slice.preferences.pageSize);

    updateSlice((s) => {
      const set = new Set(s.ui.selectedIds);
      for (const c of p.items) set.add(c.id);
      s.ui.selectedIds = [...set];
      return s;
    });
  }

  function clearSelection() {
    updateSlice((s) => {
      s.ui.selectedIds = [];
      return s;
    });
  }

  function deleteOne(id) {
    updateSlice((s) => {
      s.customers = s.customers.filter((c) => c.id !== id);
      s.ui.selectedIds = s.ui.selectedIds.filter((x) => x !== id);
      if (s.ui.selectedId === id) s.ui.selectedId = null;
      return s;
    });
  }

  function deleteSelected() {
    const slice = ensureDefaults(getSlice(getRootState()));
    const ids = new Set(slice.ui.selectedIds);
    if (!ids.size) return;
    updateSlice((s) => {
      s.customers = s.customers.filter((c) => !ids.has(c.id));
      s.ui.selectedIds = [];
      if (s.ui.selectedId && ids.has(s.ui.selectedId)) s.ui.selectedId = null;
      return s;
    });
  }

  function exportCSV() {
    const slice = ensureDefaults(getSlice(getRootState()));
    const selected = new Set(slice.ui.selectedIds);
    const processed = deriveProcessed(slice);

    const rows = selected.size
      ? slice.customers.filter((c) => selected.has(c.id))
      : processed;

    const csv = toCSV(rows, [
      { label: "id", key: "id" },
      { label: "name", key: "name" },
      { label: "tier", key: "tier" },
      { label: "email", key: "email" },
      { label: "phone", key: "phone" },
      { label: "balance", get: (c) => Number(c.balance) || 0 },
      { label: "address", key: "address" },
      { label: "notes", key: "notes" },
      { label: "createdAt", key: "createdAt" },
      { label: "updatedAt", key: "updatedAt" },
    ]);

    downloadTextFile({
      filename: `vixora_customers_${new Date().toISOString().slice(0, 10)}.csv`,
      text: csv,
      mime: "text/csv;charset=utf-8",
    });
  }

  function validateForm(formData) {
    const name = String(formData.get("name") ?? "").trim();
    const tier = String(formData.get("tier") ?? "regular");
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const balanceRaw = formData.get("balance");

    if (!name) return { ok: false, message: "Name is required." };
    if (!isValidEmail(email)) return { ok: false, message: "Email is invalid." };
    if (!isValidPhone(phone)) return { ok: false, message: "Phone is invalid." };

    const balance = parseMoney(balanceRaw);
    if (Number.isNaN(balance)) return { ok: false, message: "Balance must be a number." };
    if (balance < 0) return { ok: false, message: "Balance cannot be negative." };

    const normalizedTier = tier === "vip" ? "vip" : "regular";

    return {
      ok: true,
      value: { name, tier: normalizedTier, email, phone, address, avatarUrl, notes, balance },
    };
  }

  function showFormError(message) {
    const el = rootEl.querySelector("[data-ci='form-error']");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("vcr-hidden");
  }

  function hideFormError() {
    const el = rootEl.querySelector("[data-ci='form-error']");
    if (!el) return;
    el.classList.add("vcr-hidden");
    el.textContent = "";
  }

  function bindEvents() {
    rootEl.addEventListener("input", (e) => {
      const t = e.target;

      if (t?.matches?.("[data-ci='query']")) {
        updateSlice((s) => {
          s.ui.query = t.value ?? "";
          s.ui.page = 1;
          return s;
        });
      }

      if (t?.matches?.("[data-ci='spotlight-input']")) {
        renderSpotlightResults();
      }
    });

    rootEl.addEventListener("change", (e) => {
      const t = e.target;

      if (t?.matches?.("[data-ci='sort']")) {
        updateSlice((s) => {
          s.preferences.sort = t.value;
          s.ui.page = 1;
          return s;
        });
      }

      if (t?.matches?.("[data-ci-action='page-size']")) {
        const n = Number(t.value);
        updateSlice((s) => {
          s.preferences.pageSize = n;
          s.ui.page = 1;
          return s;
        });
      }
    });

    rootEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ci-action], [data-ci-view]");
      if (!btn) return;

      const action = btn.getAttribute("data-ci-action");
      const view = btn.getAttribute("data-ci-view");
      const id = btn.getAttribute("data-id");

      if (view) {
        updateSlice((s) => {
          s.preferences.view = view;
          return s;
        });
        return;
      }

      switch (action) {
        case "open-create":
          openModal("create", null);
          break;

        case "open-edit": {
          const slice = ensureDefaults(getSlice(getRootState()));
          const customer = slice.customers.find((c) => c.id === id);
          if (customer) openModal("edit", customer);
          break;
        }

        case "close-modal":
          closeModal();
          break;

        case "delete-one":
          deleteOne(id);
          break;

        case "toggle-select":
          toggleSelect(id);
          break;

        case "select-all-page":
          selectAllOnPage();
          break;

        case "batch-clear":
          clearSelection();
          break;

        case "batch-delete":
          deleteSelected();
          break;

        case "batch-csv":
          exportCSV();
          break;

        case "page-prev":
          updateSlice((s) => {
            s.ui.page = Math.max(1, (s.ui.page || 1) - 1);
            return s;
          });
          break;

        case "page-next":
          updateSlice((s) => {
            s.ui.page = (s.ui.page || 1) + 1;
            return s;
          });
          break;

        case "open-details":
          updateSlice((s) => {
            s.ui.selectedId = id;
            s.preferences.view = "split";
            return s;
          });
          break;

        case "select-split":
          updateSlice((s) => {
            s.ui.selectedId = id;
            return s;
          });
          break;

        case "open-spotlight":
          openSpotlight();
          break;

        case "close-spotlight":
          closeSpotlight();
          break;

        case "spotlight-pick":
          updateSlice((s) => {
            s.ui.selectedId = id;
            s.preferences.view = "split";
            s.ui.spotlightOpen = false;
            return s;
          });
          closeSpotlight();
          break;

        default:
          break;
      }
    });

    rootEl.addEventListener("submit", (e) => {
      const form = e.target;
      if (!form?.matches?.("[data-ci='modal-form']")) return;

      e.preventDefault();
      hideFormError();

      const fd = new FormData(form);
      const v = validateForm(fd);
      if (!v.ok) {
        showFormError(v.message);
        return;
      }

      const slice = ensureDefaults(getSlice(getRootState()));
      const now = Date.now();

      if (slice.ui.modalMode === "edit" && slice.ui.selectedId) {
        const id = slice.ui.selectedId;
        updateSlice((s) => {
          s.customers = s.customers.map((c) =>
            c.id === id
              ? { ...c, ...v.value, updatedAt: now }
              : c
          );
          return s;
        });
      } else {
        updateSlice((s) => {
          const id = safeUUID();
          s.customers.unshift({
            id,
            ...v.value,
            createdAt: now,
            updatedAt: now,
          });
          return s;
        });
      }

      closeModal();
    });

    // Global-ish shortcuts (scoped to root)
    rootEl.addEventListener("keydown", (e) => {
      const isMac = /mac/i.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        openSpotlight();
      }

      if (e.key === "Escape") {
        if (!sel.modal()?.classList.contains("vcr-hidden")) closeModal();
        if (!sel.spotlight()?.classList.contains("vcr-hidden")) closeSpotlight();
      }
    });
  }

  function syncUIFromState(slice) {
    const q = sel.query();
    if (q && q.value !== slice.ui.query) q.value = slice.ui.query;

    const s = sel.sort();
    if (s && s.value !== slice.preferences.sort) s.value = slice.preferences.sort;

    setActiveViewButtons(slice.preferences.view);
  }

  function rerender() {
    if (!rootEl) return;
    const slice = ensureDefaults(getSlice(getRootState()));
    syncUIFromState(slice);
    renderInsights(slice);
    renderBatchBar(slice);
    renderList(slice);
  }

  function mount(container) {
    rootEl = container;
    renderShell(rootEl);
    bindEvents();

    // ensure slice exists at least once
    updateSlice((s) => s);

    unsub =
      typeof store.subscribe === "function"
        ? store.subscribe(() => rerender())
        : null;

    rerender();
  }

  function unmount() {
    // simple hard unmount (no leaked handlers because rootEl goes away)
    if (typeof unsub === "function") unsub();
    unsub = null;
    if (rootEl) rootEl.innerHTML = "";
    rootEl = null;
  }

  return {
    key: "customer-info",
    mount,
    unmount,
  };
}
