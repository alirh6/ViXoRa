// src/pages/tools/invoices/invoices.css.js

/**
 * استایل‌های سوپراپ مالی — تم تیره گلس‌مورفیسم هم‌خانواده با موزیک/یادداشت
 * توکن‌های پایه از لایوت ابزارها (--vcr-*) + توکن‌های محلی --fin-*
 */

export const invoicesCss = /* css */ `
/* ================= توکن‌ها ================= */
.fin-app {
  color-scheme: dark;
  --fin-text: var(--vcr-text, rgba(255,255,255,.92));
  --fin-muted: var(--vcr-muted, rgba(255,255,255,.6));
  --fin-dim: var(--vcr-dim, rgba(255,255,255,.42));
  --fin-surface: var(--vcr-surface, rgba(16,22,36,.78));
  --fin-surface-2: var(--vcr-surface-2, rgba(20,27,43,.88));
  --fin-surface-3: rgba(255,255,255,.07);
  --fin-border: var(--vcr-border, rgba(255,255,255,.08));
  --fin-border-2: rgba(255,255,255,.14);
  --fin-income: #2dffb2;
  --fin-income-dim: rgba(45,255,178,.13);
  --fin-expense: #ff5d7a;
  --fin-expense-dim: rgba(255,93,122,.13);
  --fin-warn: #ffd166;
  --fin-shadow: 0 18px 50px rgba(0,0,0,.45);
  --fin-radius: 18px;
  position: relative;
  color: var(--fin-text);
  font-variant-numeric: tabular-nums;
  padding-bottom: 24px;
}
.fin-app[data-theme="emerald"] { --fin-accent: #34d399; --fin-accent-2: #a3e635; --fin-glow: rgba(52,211,153,.45); --fin-accent-soft: rgba(52,211,153,.14); }
.fin-app[data-theme="ocean"] { --fin-accent: #38bdf8; --fin-accent-2: #818cf8; --fin-glow: rgba(56,189,248,.45); --fin-accent-soft: rgba(56,189,248,.14); }
.fin-app[data-theme="violet"] { --fin-accent: #a78bfa; --fin-accent-2: #ec4899; --fin-glow: rgba(167,139,250,.45); --fin-accent-soft: rgba(167,139,250,.15); }
.fin-app[data-theme="amber"] { --fin-accent: #fbbf24; --fin-accent-2: #fb7185; --fin-glow: rgba(251,191,36,.4); --fin-accent-soft: rgba(251,191,36,.14); }
.fin-app[data-theme="rose"] { --fin-accent: #fb7185; --fin-accent-2: #f43f5e; --fin-glow: rgba(251,113,133,.45); --fin-accent-soft: rgba(251,113,133,.14); }
.fin-app[data-density="compact"] { font-size: 13px; }
.fin-app[data-density="compact"] .fin-card { padding: 10px 12px; border-radius: 14px; }
.fin-app[data-density="compact"] .fin-tx { padding: 8px 10px; }

/* هاله پس‌زمینه (مثل نوت: fixed با z منفی، بدون stacking-context روی روت) */
.fin-app::before {
  content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(560px 340px at 12% -4%, var(--fin-glow), transparent 65%),
    radial-gradient(640px 380px at 88% 12%, var(--fin-accent-soft), transparent 65%),
    radial-gradient(700px 480px at 50% 110%, rgba(0,240,255,.08), transparent 65%);
}
.fin-app ::selection { background: var(--fin-accent); color: #06121f; }
.fin-app ::-webkit-scrollbar { width: 10px; height: 10px; }
.fin-app ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.16); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
.fin-app ::-webkit-scrollbar-track { background: transparent; }

/* ================= هیرو و تب‌ها ================= */
.fin-hero { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; animation: fin-rise .45s both; }
.fin-logo {
  width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; font-size: 26px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--fin-accent), var(--fin-accent-2));
  box-shadow: 0 12px 32px -8px var(--fin-glow);
  position: relative;
}
.fin-logo::after { content: ''; position: absolute; inset: -5px; border-radius: 20px; border: 2px solid var(--fin-accent); opacity: .45; animation: fin-ring 2.6s ease-out infinite; }
.fin-hero-text { display: flex; flex-direction: column; gap: 2px; }
.fin-hero h2 {
  margin: 0; font-size: 1.35rem; font-weight: 800;
  background: linear-gradient(120deg, #fff 30%, var(--fin-accent) 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.fin-hero-sub { margin: 0; font-size: .82em; color: var(--fin-muted); }
.fin-hero-side { margin-inline-start: auto; display: flex; gap: 8px; align-items: center; }
.fin-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.fin-head h2 { margin: 0; font-size: 1.25rem; }

.fin-tabs {
  display: flex; gap: 8px; overflow-x: auto; padding: 10px 12px; margin-bottom: 14px;
  position: sticky; top: 0; z-index: 50;
  background: rgba(7,11,20,.72); backdrop-filter: saturate(150%) blur(18px); -webkit-backdrop-filter: saturate(150%) blur(18px);
  border: 1px solid var(--fin-border); border-radius: var(--fin-radius);
  scrollbar-width: thin;
  animation: fin-rise .45s .05s both;
}
.fin-tab {
  flex: 0 0 auto; display: flex; align-items: center; gap: 7px;
  border: 1px solid var(--fin-border); background: rgba(255,255,255,.04); color: var(--fin-text);
  border-radius: 12px; padding: 9px 15px; cursor: pointer; font: inherit; font-size: .88em; font-weight: 700;
  transition: transform .18s, background .2s, box-shadow .2s, border-color .2s;
  white-space: nowrap;
}
.fin-tab:hover { background: rgba(255,255,255,.09); transform: translateY(-1px); }
.fin-tab.is-active {
  background: linear-gradient(135deg, var(--fin-accent), var(--fin-accent-2));
  border-color: transparent; color: #06121f;
  box-shadow: 0 10px 26px -10px var(--fin-glow); transform: translateY(-1px);
}

/* ================= دکمه‌ها و ورودی‌ها ================= */
.fin-btn {
  border: 1px solid var(--fin-border-2); background: rgba(255,255,255,.06); color: var(--fin-text);
  border-radius: 12px; padding: 9px 16px; cursor: pointer; font: inherit; font-weight: 700; font-size: .88em;
  transition: transform .16s, background .2s, box-shadow .2s, border-color .2s, filter .2s;
}
.fin-btn:hover { background: rgba(255,255,255,.11); transform: translateY(-1px); box-shadow: var(--fin-shadow); }
.fin-btn:active { transform: translateY(0); }
.fin-btn:disabled { opacity: .45; cursor: default; transform: none; box-shadow: none; }
.fin-btn-primary { background: linear-gradient(135deg, var(--fin-accent), var(--fin-accent-2)); border: 0; color: #06121f; box-shadow: 0 10px 26px -10px var(--fin-glow); }
.fin-btn-primary:hover { background: linear-gradient(135deg, var(--fin-accent), var(--fin-accent-2)); filter: brightness(1.1); }
.fin-btn-income { background: linear-gradient(135deg, #2dffb2, #00c2ff); border: 0; color: #04120c; box-shadow: 0 10px 26px -10px rgba(45,255,178,.5); }
.fin-btn-income:hover { background: linear-gradient(135deg, #2dffb2, #00c2ff); filter: brightness(1.1); }
.fin-btn-danger { background: rgba(255,77,109,.12); border-color: rgba(255,77,109,.4); color: #ff8fa3; }
.fin-btn-danger:hover { background: rgba(255,77,109,.22); }
.fin-btn-ghost { background: transparent; border-color: var(--fin-border); color: var(--fin-muted); }
.fin-btn-ghost:hover { color: var(--fin-text); background: rgba(255,255,255,.06); }
.fin-btn-sm { padding: 6px 12px; font-size: .82em; border-radius: 10px; }
.fin-btn .fin-btn-sm, .fin-icon-btn { touch-action: manipulation; }

.fin-input {
  border: 1px solid var(--fin-border-2); background: rgba(255,255,255,.05); color: var(--fin-text);
  border-radius: 12px; padding: 10px 13px; font: inherit; font-size: .9em; width: 100%; box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.fin-input::placeholder { color: var(--fin-dim); }
.fin-input:focus { outline: none; border-color: var(--fin-accent); box-shadow: 0 0 0 3px var(--fin-accent-soft); background: rgba(255,255,255,.07); }
select.fin-input option { background: #0d1424; color: #edf2ff; }
.fin-color { padding: 4px; height: 42px; cursor: pointer; }
.fin-amount { font-size: 1.35rem; font-weight: 800; text-align: center; letter-spacing: .5px; }
textarea.fin-input { resize: vertical; min-height: 56px; }
.fin-link { background: none; border: none; color: var(--fin-accent); cursor: pointer; font: inherit; font-weight: 700; padding: 0; }
.fin-link:hover { text-decoration: underline; }
.fin-icon-btn {
  background: rgba(255,255,255,.05); border: 1px solid transparent; cursor: pointer; font-size: .95rem;
  min-width: 32px; height: 32px; padding: 2px 6px; border-radius: 10px; color: var(--fin-text);
  transition: background .2s, transform .15s, border-color .2s;
}
.fin-icon-btn:hover { background: rgba(255,255,255,.14); border-color: var(--fin-border-2); transform: translateY(-1px); }
.fin-check { width: 18px; height: 18px; accent-color: var(--fin-accent); flex-shrink: 0; }
.fin-tag { background: var(--fin-accent-soft); border: 1px solid var(--fin-border-2); color: var(--fin-text); border-radius: 7px; padding: 1px 7px; font-size: .78em; white-space: nowrap; }
.fin-hint { color: var(--fin-muted); font-size: .85em; }
.fin-toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; animation: fin-rise .45s .1s both; }
.fin-toolbar-spacer { flex: 1; }
.fin-toolbar-wrap { row-gap: 8px; }

/* ================= کارت و گرید ================= */
.fin-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.fin-card {
  position: relative;
  background: linear-gradient(165deg, rgba(255,255,255,.075), rgba(255,255,255,.028));
  border: 1px solid var(--fin-border); border-radius: var(--fin-radius); padding: 16px 18px;
  box-shadow: var(--fin-shadow);
  backdrop-filter: saturate(140%) blur(14px); -webkit-backdrop-filter: saturate(140%) blur(14px);
  transition: transform .2s, border-color .2s, box-shadow .25s;
  animation: fin-rise .5s both;
  overflow: hidden;
}
.fin-card::before {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--fin-accent), transparent);
  opacity: .55;
}
.fin-card:hover { transform: translateY(-2px); border-color: var(--fin-border-2); box-shadow: 0 24px 60px rgba(0,0,0,.5), 0 0 0 1px var(--fin-accent-soft); }
.fin-grid > :nth-child(2) { animation-delay: .04s; } .fin-grid > :nth-child(3) { animation-delay: .08s; }
.fin-grid > :nth-child(4) { animation-delay: .12s; } .fin-grid > :nth-child(5) { animation-delay: .16s; }
.fin-grid > :nth-child(6) { animation-delay: .2s; } .fin-grid > :nth-child(n+7) { animation-delay: .24s; }
.fin-card.is-done { border-color: rgba(45,255,178,.4); }
.fin-card.is-done::before { background: linear-gradient(90deg, transparent, var(--fin-income), transparent); opacity: .8; }
.fin-card.is-muted { opacity: .6; }
.fin-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.fin-card-head h3 { margin: 0; font-size: .98rem; font-weight: 800; display: flex; align-items: center; gap: 8px; min-width: 0; }
.fin-card-head h3 + div { display: flex; gap: 4px; flex-shrink: 0; }
.fin-card-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.fin-card-actions-col { flex-direction: column; align-items: stretch; }
.fin-section-title { margin: 20px 0 12px; font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.fin-section-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--fin-border-2), transparent); }
.fin-empty {
  text-align: center; color: var(--fin-muted); padding: 30px 14px;
  border: 1px dashed var(--fin-border-2); border-radius: var(--fin-radius);
  background: rgba(255,255,255,.025);
  animation: fin-rise .45s both;
}
.fin-hr { border: none; border-top: 1px solid var(--fin-border); margin: 14px 0; }
.fin-badge { border-radius: 999px; padding: 3px 12px; font-size: .75em; font-weight: 800; background: rgba(255,255,255,.1); border: 1px solid var(--fin-border-2); white-space: nowrap; }
.fin-badge-paid { background: var(--fin-income-dim); color: var(--fin-income); border-color: rgba(45,255,178,.35); }
.fin-badge-overdue { background: var(--fin-expense-dim); color: #ff8fa3; border-color: rgba(255,93,122,.4); }
.fin-badge-sent { background: rgba(56,189,248,.13); color: #7dd3fc; border-color: rgba(56,189,248,.35); }
.fin-badge-cancelled { background: rgba(255,255,255,.06); color: var(--fin-dim); }
.fin-badge-draft { background: rgba(255,255,255,.07); color: var(--fin-muted); }

/* ================= ویجت‌ها ================= */
.fin-widget[data-widget="balance"] { grid-column: 1 / -1; background: linear-gradient(150deg, rgba(255,255,255,.09), rgba(255,255,255,.03)), radial-gradient(600px 200px at 85% 0%, var(--fin-accent-soft), transparent 70%); }
.fin-stats3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.fin-stat { background: rgba(255,255,255,.045); border: 1px solid var(--fin-border); border-radius: 14px; padding: 12px 8px; text-align: center; transition: transform .18s, background .2s; }
.fin-stat:hover { transform: translateY(-2px); background: rgba(255,255,255,.07); }
.fin-stat-label { display: block; font-size: .76em; color: var(--fin-muted); margin-bottom: 5px; }
.fin-stat strong { font-size: 1.02em; word-break: break-word; font-weight: 800; }
.fin-in { color: var(--fin-income); }
.fin-out { color: var(--fin-expense); }
.fin-networth { text-align: center; padding: 6px 0 2px; }
.fin-net-num {
  font-size: 2rem; font-weight: 800; letter-spacing: .5px;
  background: linear-gradient(120deg, #fff 20%, var(--fin-accent) 90%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.fin-net-rows { display: grid; gap: 6px; margin-top: 12px; font-size: .87em; text-align: start; }
.fin-net-rows > span { display: flex; justify-content: space-between; gap: 8px; padding: 7px 12px; background: rgba(255,255,255,.035); border: 1px solid var(--fin-border); border-radius: 10px; }
.fin-mini-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
.fin-mini-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.fin-mini-row > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
ul.fin-mini-list.fin-card { padding: 16px 18px; }
.fin-rem b { white-space: nowrap; font-size: .85em; color: var(--fin-accent); }
.fin-rem.is-late b { color: var(--fin-expense); }
.fin-tip { font-size: .9em; line-height: 1.8; background: rgba(255,255,255,.035); border: 1px solid var(--fin-border); border-radius: 12px; padding: 9px 12px; }
.fin-legend { display: flex; gap: 14px; justify-content: center; font-size: .85em; margin-top: 8px; align-items: center; flex-wrap: wrap; color: var(--fin-muted); }
.fin-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-inline-end: 5px; box-shadow: 0 0 8px currentColor; }
.fin-dot-in { background: var(--fin-income); color: var(--fin-income); }
.fin-dot-out { background: var(--fin-expense); color: var(--fin-expense); }
.fin-donut-wrap { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.fin-donut-big { gap: 26px; padding: 8px 4px; }
.fin-donut-legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; font-size: .88em; flex: 1; min-width: 155px; }
.fin-donut-legend li { display: flex; align-items: center; gap: 7px; }
.fin-donut-legend b { margin-inline-start: auto; color: var(--fin-accent); }
.fin-donut-legend i { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,255,255,.15); }

/* ================= نمودارها ================= */
.fin-bars, .fin-line { width: 100%; height: auto; direction: ltr; filter: drop-shadow(0 6px 18px rgba(0,0,0,.4)); }
.fin-chart-label { font-size: 12px; fill: var(--fin-muted); font-weight: 700; }
.fin-donut { flex-shrink: 0; direction: ltr; filter: drop-shadow(0 8px 22px rgba(0,0,0,.45)); }

/* ================= تراکنش‌ها ================= */
.fin-filters { margin-bottom: 12px; display: grid; gap: 10px; }
.fin-filters::before { display: none; }
.fin-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.fin-filter-row .fin-input, .fin-filter-row .fin-search { flex: 1; min-width: 130px; width: auto; }
.fin-search { border-radius: 999px !important; padding-inline-start: 16px !important; }
.fin-date-label { display: flex; align-items: center; gap: 6px; font-size: .85em; flex: 1; min-width: 175px; color: var(--fin-muted); }
.fin-date-label .fin-input { flex: 1; }
.fin-tx-summary { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin: 12px 2px; font-size: .9em; font-weight: 700; }
.fin-bulkbar { display: flex; gap: 8px; align-items: center; background: var(--fin-accent-soft); border: 1px solid var(--fin-border-2); border-radius: 12px; padding: 9px 13px; margin-bottom: 10px; }
.fin-day-head { font-weight: 800; margin: 16px 2px 8px; font-size: .88em; color: var(--fin-muted); display: flex; align-items: center; gap: 8px; }
.fin-day-head::after { content: ''; flex: 1; height: 1px; background: var(--fin-border); }
.fin-tx {
  display: flex; gap: 10px; align-items: center;
  background: linear-gradient(165deg, rgba(255,255,255,.06), rgba(255,255,255,.025));
  border: 1px solid var(--fin-border); border-radius: 14px; padding: 11px 13px; margin-bottom: 7px;
  transition: transform .16s, border-color .2s, background .2s, box-shadow .2s;
  animation: fin-rise .4s both;
}
.fin-tx:hover { transform: translateX(-3px); border-color: var(--fin-border-2); background: rgba(255,255,255,.07); box-shadow: var(--fin-shadow); }
.fin-tx.is-selected { border-color: var(--fin-accent); background: var(--fin-accent-soft); box-shadow: 0 0 0 1px var(--fin-accent); }
.fin-tx-main { flex: 1; min-width: 0; }
.fin-tx-title { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .93em; }
.fin-tx-sub { font-size: .79em; color: var(--fin-muted); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fin-tx-amount { font-weight: 800; white-space: nowrap; font-size: .95em; }
.fin-tx-actions { display: flex; gap: 3px; flex-shrink: 0; }
.fin-pager { display: flex; gap: 10px; align-items: center; justify-content: center; margin: 16px 0; color: var(--fin-muted); font-size: .88em; }

/* ================= پیشرفت ================= */
.fin-progress { height: 10px; border-radius: 999px; background: rgba(255,255,255,.09); overflow: hidden; margin: 9px 0 5px; box-shadow: inset 0 1px 3px rgba(0,0,0,.4); }
.fin-progress > span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--fin-accent), var(--fin-accent-2)); box-shadow: 0 0 12px var(--fin-glow); transition: width .6s cubic-bezier(.22,.9,.24,1); }
.fin-progress.is-ok > span { background: linear-gradient(90deg, #2dffb2, #00c2ff); box-shadow: 0 0 12px rgba(45,255,178,.5); }
.fin-progress.is-warn > span { background: linear-gradient(90deg, #ffd166, #ff9f43); box-shadow: 0 0 12px rgba(255,209,102,.45); }
.fin-progress.is-over > span { background: linear-gradient(90deg, #ff5d7a, #ff2d55); box-shadow: 0 0 12px rgba(255,93,122,.55); }
.fin-budget-nums { display: flex; justify-content: space-between; font-size: .9em; gap: 8px; }

/* ================= جدول ================= */
.fin-table { width: 100%; border-collapse: collapse; font-size: .9em; }
.fin-table th, .fin-table td { padding: 10px 8px; border-bottom: 1px solid var(--fin-border); text-align: start; }
.fin-table th { color: var(--fin-muted); font-weight: 700; font-size: .82em; }
.fin-table tbody tr { transition: background .15s; }
.fin-table tbody tr:hover { background: rgba(255,255,255,.04); }
.fin-table tbody tr:last-child td { border-bottom: none; }

/* ================= تقویم حرارتی ================= */
.fin-heat-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; max-width: 560px; }
.fin-heat-dow { text-align: center; font-size: .78em; color: var(--fin-dim); font-weight: 700; }
.fin-heat-cell { aspect-ratio: 1; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-size: .8em; background: rgba(255,255,255,.05); border: 1px solid var(--fin-border); min-width: 22px; min-height: 22px; transition: transform .15s; }
.fin-heat-cell:hover { transform: scale(1.12); }
.fin-heat-cell b { font-weight: 700; }
.fin-heat-blank { aspect-ratio: 1; }
.fin-heat-1 { background: rgba(45,255,178,.16); border-color: rgba(45,255,178,.3); }
.fin-heat-2 { background: rgba(45,255,178,.32); border-color: rgba(45,255,178,.45); }
.fin-heat-3 { background: rgba(255,209,102,.4); border-color: rgba(255,209,102,.55); }
.fin-heat-4 { background: rgba(255,93,122,.5); border-color: rgba(255,93,122,.65); }
.fin-heat-cell.is-today { outline: 2px solid var(--fin-accent); outline-offset: 1px; }

/* ================= فرم‌ها ================= */
.fin-form { display: grid; gap: 11px; }
.fin-form > label, .fin-form-grid > label, .fin-form-2col > label { display: grid; gap: 6px; font-size: .87em; color: var(--fin-muted); font-weight: 700; }
.fin-form-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.fin-check-label { display: flex !important; align-items: center; gap: 9px; flex-direction: row !important; cursor: pointer; }
.fin-check-label input { width: 18px; height: 18px; accent-color: var(--fin-accent); }
.fin-form-grid { display: grid; gap: 11px; grid-template-columns: 1fr 1fr; }
.fin-type-tabs { display: flex; gap: 6px; background: rgba(255,255,255,.04); border: 1px solid var(--fin-border); padding: 5px; border-radius: 14px; }
.fin-type-tabs .fin-btn { flex: 1; border: 0; background: transparent; box-shadow: none; color: var(--fin-muted); }
.fin-type-tabs .fin-btn:hover { background: rgba(255,255,255,.07); color: var(--fin-text); transform: none; }
.fin-type-tabs .fin-btn-primary { background: linear-gradient(135deg, var(--fin-accent), var(--fin-accent-2)) !important; color: #06121f !important; }
.fin-quick-row { display: flex; gap: 6px; flex-wrap: wrap; }
.fin-quick { direction: ltr; }
.fin-confirm { display: grid; gap: 12px; }
.fin-widget-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.fin-widget-list li { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,.035); border: 1px solid var(--fin-border); border-radius: 11px; padding: 7px 10px; }
.fin-tag-cloud { display: flex; gap: 7px; flex-wrap: wrap; }
.fin-cat-list { max-height: 300px; overflow-y: auto; padding-inline-end: 2px; }
.fin-import-preview { font-size: .85em; max-height: 150px; overflow-y: auto; }
.fin-inv-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 6px; margin-bottom: 6px; }
.fin-inv-items { display: grid; gap: 2px; }

/* ================= مودال (اسکوپ مالی) ================= */
.fin-app .modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(3,6,14,.72);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 40px 16px; overflow-y: auto;
  animation: fin-fade .22s ease-out;
}
.fin-app .modal-panel {
  width: 520px; max-width: 100%;
  background: linear-gradient(170deg, #131b30, #0b1120);
  border: 1px solid var(--fin-border-2); border-radius: 22px;
  box-shadow: 0 40px 100px rgba(0,0,0,.65), 0 0 0 1px var(--fin-accent-soft), 0 0 60px -20px var(--fin-glow);
  overflow: hidden;
  animation: fin-pop .3s cubic-bezier(.22,.9,.24,1.1);
  position: relative;
}
.fin-app .modal-panel::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 3px; background: linear-gradient(90deg, transparent, var(--fin-accent), var(--fin-accent-2), transparent); }
.fin-app .fin-modal-wide { width: 720px; }
.fin-app .modal-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 18px 20px 12px; }
.fin-app .modal-head h3 { margin: 0; font-size: 1.05rem; font-weight: 800; }
.fin-app .modal-x {
  width: 34px; height: 34px; border-radius: 11px; flex-shrink: 0;
  border: 1px solid var(--fin-border-2); background: rgba(255,255,255,.06); color: var(--fin-text);
  cursor: pointer; font-size: .95rem; transition: background .2s, transform .15s;
}
.fin-app .modal-x:hover { background: rgba(255,77,109,.22); border-color: rgba(255,77,109,.5); transform: rotate(90deg); }
.fin-app .modal-body { padding: 4px 20px 20px; }
.fin-app .modal-actions { display: flex; gap: 9px; justify-content: flex-start; margin-top: 14px; flex-wrap: wrap; }

/* ================= تست ================= */
.fin-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: rgba(13,20,36,.92); color: var(--fin-text);
  border: 1px solid var(--fin-accent); border-radius: 14px;
  padding: 11px 20px; font-size: .89em; font-weight: 700; z-index: 99999;
  box-shadow: 0 12px 40px rgba(0,0,0,.55), 0 0 24px -6px var(--fin-glow);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  max-width: calc(100vw - 40px); text-align: center;
  animation: fin-toast-in .3s cubic-bezier(.22,.9,.24,1.15);
}

/* ================= چاپ فاکتور ================= */
.fin-print-doc { background: #fff; color: #111; border-radius: 14px; padding: 20px; }
.fin-print-doc h2 { text-align: center; color: #111; margin-top: 0; }
.fin-print-meta { display: flex; justify-content: space-between; margin: 8px 0; flex-wrap: wrap; gap: 6px; color: #333; }
.fin-print-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
.fin-print-table th, .fin-print-table td { border: 1px solid #999; padding: 7px 9px; text-align: start; color: #111; }
.fin-print-table th { background: #f1f5f9; }
.fin-print-totals { display: grid; gap: 4px; text-align: end; color: #111; }
.fin-print-notes { color: #444; border-top: 1px dashed #bbb; padding-top: 8px; }
@media print {
  body * { visibility: hidden; }
  .fin-app .modal-panel, .fin-app .modal-panel * { visibility: visible; }
  .fin-app .modal-panel { position: absolute; inset: 0; width: auto; box-shadow: none; border: none; background: #fff; }
  .fin-app .modal-head, .fin-app .modal-actions, .fin-no-print { display: none !important; }
  .fin-print-doc { border-radius: 0; padding: 0; }
}

/* ================= انیمیشن‌ها ================= */
@keyframes fin-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fin-pop { from { opacity: 0; transform: translateY(22px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes fin-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fin-ring { 0% { transform: scale(.92); opacity: .6; } 70% { transform: scale(1.08); opacity: 0; } 100% { transform: scale(.92); opacity: 0; } }
@keyframes fin-toast-in { from { opacity: 0; transform: translateX(-50%) translateY(14px) scale(.95); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
@media (prefers-reduced-motion: reduce) {
  .fin-app *, .fin-app *::before, .fin-app *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}

/* ================= موبایل ================= */
@media (max-width: 640px) {
  .fin-grid { grid-template-columns: 1fr; }
  .fin-form-2col, .fin-form-grid { grid-template-columns: 1fr; }
  .fin-inv-row { grid-template-columns: 1fr 1fr; }
  .fin-inv-row .fin-icon-btn { grid-column: -1; justify-self: end; }
  .fin-tx-actions .fin-icon-btn { min-width: 36px; height: 36px; }
  .fin-stats3 { gap: 6px; }
  .fin-stat strong { font-size: .85em; }
  .fin-net-num { font-size: 1.6rem; }
  .fin-app .modal-overlay { padding: 20px 10px; align-items: flex-end; }
  .fin-app .modal-panel { border-radius: 20px 20px 16px 16px; }
  .fin-hero h2 { font-size: 1.15rem; }
  .fin-logo { width: 44px; height: 44px; font-size: 22px; }
}

/* ---------- واکنش‌گرای تکمیلی موبایل ---------- */
@media (max-width: 560px) {
  .fin-app{min-width:0}
  .fin-card{overflow-x:auto}
  .fin-table th,.fin-table td{white-space:nowrap}
  .fin-bulkbar{flex-wrap:wrap}
  .fin-type-tabs{overflow-x:auto}
  .fin-type-tabs .fin-btn{flex:0 0 auto}
  .fin-app .modal-panel{max-height:92dvh}
  .fin-modal-wide{width:calc(100vw - 20px);max-width:100%}
  .fin-toast{bottom:calc(90px + env(safe-area-inset-bottom,0px));max-width:calc(100vw - 24px)}
}

/* ================= ماژول‌های توسعه مالی: وام/پیش‌بینی/استودیو/بینش ================= */
.fin-secbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 0 12px;flex-wrap:wrap}
.fin-secbar h3{margin:0;font-size:16px}
.fin-secbar-actions{display:flex;gap:8px;flex-wrap:wrap}
.fin-panel{background:var(--fin-card,rgba(255,255,255,.06));border:1px solid var(--fin-border,rgba(255,255,255,.12));border-radius:18px;padding:16px;margin-bottom:12px}
.fin-panel h4{margin:14px 0 8px;font-size:14px}
.fin-panel h4:first-child{margin-top:0}
.fin-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media (max-width:900px){.fin-grid-2{grid-template-columns:1fr}}
.fin-btn-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;align-items:center}
.fin-chip{font-size:12.5px;background:var(--fin-card,rgba(255,255,255,.06));border:1px solid var(--fin-border,rgba(255,255,255,.14));padding:8px 14px;border-radius:99px;color:inherit;cursor:pointer;transition:all .15s}
.fin-chip:hover{transform:translateY(-1px)}
.fin-chip.is-on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border:0;color:#fff;box-shadow:0 6px 18px -6px rgba(139,92,246,.5)}
.fin-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0}
.fin-kpi{background:var(--fin-card,rgba(255,255,255,.06));border:1px solid var(--fin-border,rgba(255,255,255,.12));border-radius:16px;padding:12px 10px;text-align:center;display:flex;flex-direction:column;gap:4px}
.fin-kpi span{font-size:12px;opacity:.75}
.fin-kpi b{font-size:15px}
.fin-kpi small{font-size:11px;opacity:.7}
.fin-pos{color:#6ee7b7!important}
.fin-neg{color:#fda4af!important}
.fin-hidden{display:none!important}
.fin-label{display:flex;flex-direction:column;gap:6px;font-size:12.5px;margin:8px 0}
.fin-label textarea,.fin-form-grid input,.fin-form-grid select,.fin-form-grid textarea{background:rgba(0,0,0,.3);border:1px solid var(--fin-border,rgba(255,255,255,.14));color:inherit;border-radius:10px;padding:9px 10px;font-size:13px;font-family:inherit}
.fin-code{background:rgba(0,0,0,.4);border:1px solid var(--fin-border,rgba(255,255,255,.12));border-radius:12px;padding:12px;font-size:12px;line-height:2;overflow:auto;margin:8px 0}
.fin-table-wrap{overflow:auto;max-height:440px;border-radius:12px}
.fin-row-bad td{background:rgba(244,63,94,.1)}
.fin-num{font-variant-numeric:tabular-nums;color:#a5b4fc;font-weight:800;min-width:30px;text-align:center}
.fin-target{border-color:#8b5cf6!important;box-shadow:0 0 0 3px rgba(139,92,246,.25)}
.fin-verdict{font-size:14px;font-weight:700;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.4);border-radius:12px;padding:12px;margin:10px 0;text-align:center;line-height:2}
.fin-tips{margin:8px 0;padding-right:18px;line-height:2.1;font-size:13px}
.fin-order-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border:1px solid var(--fin-border,rgba(255,255,255,.1));border-radius:12px;padding:9px 12px;font-size:13px;margin-bottom:6px;flex-wrap:wrap}
.fin-order-row span{flex:1;min-width:160px}
.fin-cal-row{display:flex;align-items:center;gap:10px;font-size:13px;padding:8px;border-bottom:1px dashed var(--fin-border,rgba(255,255,255,.12))}
.fin-cal-row span:first-child{color:#a5b4fc;min-width:110px}
.fin-cal-row b{flex:1}
.fin-rule-row{display:flex;gap:8px;align-items:center;font-size:12.5px;background:rgba(255,255,255,.04);border-radius:12px;padding:10px;margin-bottom:6px;flex-wrap:wrap}
.fin-rule-row b{color:#fbbf24;min-width:70px}

/* وام */
.fin-loan-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin:12px 0}
.fin-loan-card{background:var(--fin-card,rgba(255,255,255,.06));border:1px solid var(--fin-border,rgba(255,255,255,.12));border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:8px}
.fin-loan-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.fin-loan-head b{font-size:14px}
.fin-loan-amount{font-size:17px;font-weight:800}
.fin-loan-amount small{font-size:11.5px;opacity:.65;font-weight:400}
.fin-loan-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;opacity:.85}
canvas[data-ln],canvas[data-fc],canvas[data-ds],canvas[data-iz]{width:100%;background:rgba(0,0,0,.22);border:1px solid var(--fin-border,rgba(255,255,255,.1));border-radius:14px}

/* استودیو فاکتور */
.fin-theme-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin:10px 0}
.fin-theme-card{background:var(--fin-card,rgba(255,255,255,.06));border:2px solid var(--fin-border,rgba(255,255,255,.12));border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:6px;align-items:center;color:inherit;cursor:pointer}
.fin-theme-card.is-on{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.25)}
.fin-theme-swatch{width:100%;height:44px;border-radius:10px}
.fin-theme-card b{font-size:12px}
.fin-preview-frame{border-radius:14px;overflow:hidden;border:1px solid var(--fin-border,rgba(255,255,255,.12))}
.fin-doc{background:var(--dbg,#fff);color:var(--dink,#111);padding:0;font-size:13px}
.fin-doc-head{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,var(--dc1),var(--dc2));color:#fff;padding:16px 20px}
.fin-doc-brand{display:flex;gap:12px;align-items:center}
.fin-doc-logo{width:52px;height:52px;border-radius:12px;object-fit:cover;background:#fff}
.fin-doc-logo-fallback{display:grid;place-items:center;font-size:26px}
.fin-doc-title{font-size:18px;font-weight:800;text-align:left}
.fin-doc-meta{display:flex;gap:14px;flex-wrap:wrap;padding:10px 20px;border-bottom:1px dashed #999;font-size:12px}
.fin-doc-table{width:100%;border-collapse:collapse;font-size:12.5px}
.fin-doc-table th{background:var(--dc1);color:#fff;padding:8px}
.fin-doc-table td{padding:7px;border-bottom:1px solid rgba(128,128,128,.3);text-align:center}
.fin-doc-sums{display:flex;flex-direction:column;gap:3px;align-items:flex-end;padding:12px 20px}
.fin-doc-total{font-size:17px;color:var(--dc1)}
.fin-doc-note{margin:0 20px 8px;font-size:12px}
.fin-doc-foot{text-align:center;font-size:11.5px;padding:10px;border-top:1px dashed #999;opacity:.85}
.fin-logo-preview{max-width:180px;border-radius:12px;border:1px solid var(--fin-border,rgba(255,255,255,.14));margin-top:8px}

/* بینش */
.fin-insight{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid var(--fin-border,rgba(255,255,255,.1);border-right-width:4px;border-radius:12px;padding:10px 12px;font-size:13px;margin-bottom:8px;line-height:2}
.fin-insight b{font-size:16px}
.fin-insight span{flex:1}
.fin-insight-good{border-right-color:#34d399}
.fin-insight-warn{border-right-color:#fbbf24}
.fin-insight-bad{border-right-color:#f43f5e}
.fin-insight-info{border-right-color:#38bdf8}
.fin-steps{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.fin-step{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid var(--fin-border,rgba(255,255,255,.15));font-weight:800}
.fin-step.is-on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border:0;color:#fff}
.fin-step.is-done{background:rgba(52,211,153,.2);border-color:#34d399;color:#6ee7b7}
.fin-step-sep{opacity:.4}
.fin-att-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px}
.fin-att-thumb{border:1px solid var(--fin-border,rgba(255,255,255,.14));border-radius:10px;overflow:hidden;padding:0;cursor:pointer;background:none}
.fin-att-thumb img{width:100%;height:80px;object-fit:cover;display:block}
.fin-att-full{max-width:100%;border-radius:12px}
`;