// src/pages/tools/note/notePage.css.js
//
// استایل فضای کاری یادداشت — scoped، بدون نیاز به build step.
// اگر خواستی فایل .css واقعی هم داشته باشی، همین متن را در notePage.css بگذار
// و در routes.js از `style: () => import('./notePage.css?inline')` استفاده کن.

export const notePageCss = /* css */ `
/* ==================================================================
   ۰) توکن‌های طراحی
   ================================================================== */

.vx-nw{
  --vx-radius-sm:10px;
  --vx-radius:16px;
  --vx-radius-lg:22px;

  --vx-gap:16px;
  --vx-pad:22px;

  --vx-ease:cubic-bezier(.22,.9,.24,1);
  --vx-ease-out:cubic-bezier(.16,1,.3,1);
  --vx-dur:.28s;

  --vx-font:inherit;

  position:relative;
  isolation:isolate;
  min-height:100%;
  padding:var(--vx-pad);
  color:var(--vx-text);
  font-family:var(--vx-font);
  direction:rtl;
}

/* تم تاریک (پیش‌فرض) */
.vx-nw.theme-dark{
  --vx-bg:#080b16;
  --vx-surface:rgba(255,255,255,.035);
  --vx-surface-2:rgba(255,255,255,.06);
  --vx-surface-3:rgba(255,255,255,.09);
  --vx-border:rgba(255,255,255,.09);
  --vx-border-strong:rgba(255,255,255,.16);
  --vx-text:#e8edf8;
  --vx-text-dim:#96a2ba;
  --vx-text-faint:#6b7791;
  --vx-shadow:0 30px 70px -40px rgba(0,0,0,.9);
  --vx-glass:saturate(150%) blur(18px);
}

/* تم روشن */
.vx-nw.theme-light{
  --vx-bg:#f3f6fc;
  --vx-surface:rgba(255,255,255,.86);
  --vx-surface-2:rgba(255,255,255,.95);
  --vx-surface-3:rgba(15,23,42,.05);
  --vx-border:rgba(15,23,42,.10);
  --vx-border-strong:rgba(15,23,42,.18);
  --vx-text:#111a2b;
  --vx-text-dim:#5a6780;
  --vx-text-faint:#8794ab;
  --vx-shadow:0 26px 60px -38px rgba(15,23,42,.45);
  --vx-glass:saturate(140%) blur(14px);
}

/* رنگ‌های یادداشت */
.vx-nw{
  --vx-color-violet:#a06bff;
  --vx-color-blue:#4d9dff;
  --vx-color-emerald:#2fd39b;
  --vx-color-amber:#ffb545;
  --vx-color-rose:#ff6b93;
  --vx-color-slate:#8895ad;

  --vx-accent:#00d0ff;
  --vx-accent-2:#7a5cff;
  --vx-danger:#ff5d7a;
  --vx-success:#2fd39b;
  --vx-warning:#ffb545;
}

/* ==================================================================
   ۱) پس‌زمینهٔ زنده
   ================================================================== */

.vx-nw__bg{
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:
    radial-gradient(900px 520px at 12% -8%, color-mix(in srgb, var(--vx-accent) 16%, transparent), transparent 62%),
    radial-gradient(760px 480px at 92% 6%, color-mix(in srgb, var(--vx-accent-2) 18%, transparent), transparent 60%),
    radial-gradient(700px 520px at 50% 110%, color-mix(in srgb, var(--vx-color-emerald) 10%, transparent), transparent 60%),
    var(--vx-bg);
  animation:vx-bg-drift 26s var(--vx-ease) infinite alternate;
}

@keyframes vx-bg-drift{
  from{background-position:0% 0%, 100% 0%, 50% 100%, 0 0;transform:scale(1)}
  to{background-position:6% 4%, 94% 6%, 46% 96%, 0 0;transform:scale(1.06)}
}

.vx-nw__shell{
  display:flex;
  flex-direction:column;
  gap:18px;
  max-width:1680px;
  margin:0 auto;
}

/* ==================================================================
   ۲) هدر
   ================================================================== */

.vx-nw__header{
  position:relative;
  display:flex;
  flex-direction:column;
  gap:16px;
  padding:20px 22px;
  border-radius:var(--vx-radius-lg);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  backdrop-filter:var(--vx-glass);
  box-shadow:var(--vx-shadow);
  overflow:hidden;
  animation:vx-rise .5s var(--vx-ease-out) both;
}

.vx-nw__header-glow{
  position:absolute;
  inset-inline:-20%;
  top:-70%;
  height:150%;
  background:conic-gradient(from 180deg, transparent, color-mix(in srgb, var(--vx-accent) 26%, transparent), transparent 42%);
  filter:blur(46px);
  opacity:.5;
  animation:vx-rotate 18s linear infinite;
  pointer-events:none;
}

@keyframes vx-rotate{to{transform:rotate(360deg)}}

.vx-nw__brand{display:flex;align-items:center;gap:14px}

.vx-nw__brand-icon{
  width:52px;height:52px;flex:0 0 auto;
  display:grid;place-items:center;
  font-size:24px;
  border-radius:18px;
  background:linear-gradient(140deg, color-mix(in srgb,var(--vx-accent) 32%, transparent), color-mix(in srgb,var(--vx-accent-2) 32%, transparent));
  border:1px solid var(--vx-border-strong);
  box-shadow:0 12px 30px -16px color-mix(in srgb,var(--vx-accent) 70%, transparent);
  animation:vx-float 6s ease-in-out infinite;
}

@keyframes vx-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

.vx-nw__title{margin:0;font-size:21px;font-weight:800;letter-spacing:-.3px}
.vx-nw__subtitle{margin:3px 0 0;font-size:12.5px;color:var(--vx-text-dim);line-height:1.8}

.vx-nw__actions{display:flex;align-items:center;gap:8px;margin-inline-start:auto}

.vx-nw__icon-btn{
  position:relative;
  width:38px;height:38px;flex:0 0 auto;
  display:grid;place-items:center;
  border-radius:13px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text);
  font-size:15px;
  cursor:pointer;
  transition:transform .18s var(--vx-ease), background var(--vx-dur), border-color var(--vx-dur), box-shadow var(--vx-dur);
}

.vx-nw__icon-btn:hover{
  transform:translateY(-2px) scale(1.04);
  border-color:color-mix(in srgb,var(--vx-accent) 45%, transparent);
  box-shadow:0 12px 26px -16px color-mix(in srgb,var(--vx-accent) 80%, transparent);
}

.vx-nw__icon-btn:active{transform:translateY(0) scale(.97)}

.vx-nw__dot{
  position:absolute;top:6px;inset-inline-end:6px;
  width:8px;height:8px;border-radius:50%;
  background:var(--vx-danger);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--vx-danger) 25%, transparent);
  animation:vx-pulse 1.8s ease-in-out infinite;
}

@keyframes vx-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.6}}

.vx-nw__more{position:relative}

.vx-nw__menu{
  position:absolute;
  top:calc(100% + 10px);
  inset-inline-end:0;
  z-index:40;
  min-width:210px;
  display:flex;flex-direction:column;gap:2px;
  padding:8px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border-strong);
  background:var(--vx-surface-2);
  backdrop-filter:var(--vx-glass);
  box-shadow:var(--vx-shadow);
  animation:vx-pop .22s var(--vx-ease-out) both;
  transform-origin:top right;
}

.vx-nw__menu .vx-nw__icon-btn{
  width:100%;height:auto;
  display:flex;align-items:center;gap:10px;
  padding:9px 12px;
  border:0;background:transparent;
  border-radius:11px;
  font-size:13px;
}

.vx-nw__menu .vx-nw__icon-btn:hover{background:var(--vx-surface-3);transform:none;box-shadow:none}

@keyframes vx-pop{from{opacity:0;transform:translateY(-8px) scale(.96)}to{opacity:1;transform:none}}
@keyframes vx-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

/* جستجو */
.vx-nw__searchbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px}

.vx-nw__search{position:relative;flex:1 1 280px;min-width:230px}

.vx-nw__search-icon{
  position:absolute;inset-inline-start:13px;top:50%;transform:translateY(-50%);
  font-size:13px;opacity:.7;pointer-events:none;
}

.vx-nw__search-input{padding-inline-start:38px !important;padding-inline-end:44px !important}

.vx-nw__kbd{
  position:absolute;inset-inline-end:10px;top:50%;transform:translateY(-50%);
  padding:2px 7px;
  border-radius:7px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-3);
  font-size:11px;color:var(--vx-text-faint);
  pointer-events:none;
}

.vx-nw__cmd-btn,.vx-nw__new-btn{white-space:nowrap}

/* معیارها */
.vx-nw__metrics{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(112px,1fr));
  gap:10px;
}

.vx-nw__metric{
  display:flex;flex-direction:column;gap:2px;
  padding:11px 13px;
  border-radius:var(--vx-radius-sm);
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  transition:transform var(--vx-dur) var(--vx-ease), border-color var(--vx-dur);
}

.vx-nw__metric:hover{transform:translateY(-2px);border-color:var(--vx-border-strong)}

.vx-nw__metric-value{font-size:17px;font-weight:800;line-height:1.2}
.vx-nw__metric-label{font-size:11.5px;color:var(--vx-text-dim)}

.vx-nw__metric.danger .vx-nw__metric-value{color:var(--vx-danger)}
.vx-nw__metric.overdue{border-color:color-mix(in srgb,var(--vx-danger) 34%, transparent)}

/* ==================================================================
   ۳) کنترل‌های پایه
   ================================================================== */

.vx-input,.vx-select,.vx-textarea{
  width:100%;
  padding:10px 13px;
  border-radius:12px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text);
  font:inherit;font-size:13px;
  outline:none;
  transition:border-color var(--vx-dur), box-shadow var(--vx-dur), background var(--vx-dur);
}

.vx-input:focus,.vx-select:focus,.vx-textarea:focus{
  border-color:color-mix(in srgb,var(--vx-accent) 55%, transparent);
  box-shadow:0 0 0 4px color-mix(in srgb,var(--vx-accent) 15%, transparent);
}

.vx-textarea{resize:vertical;min-height:88px;line-height:2}
.vx-select{cursor:pointer}

.vx-btn{
  position:relative;
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  padding:10px 17px;
  border-radius:12px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text);
  font:inherit;font-size:12.8px;font-weight:600;
  cursor:pointer;
  overflow:hidden;
  transition:transform .16s var(--vx-ease), filter var(--vx-dur), background var(--vx-dur), border-color var(--vx-dur), box-shadow var(--vx-dur);
}

.vx-btn::after{
  content:"";
  position:absolute;inset:0;
  background:radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(255,255,255,.22), transparent 55%);
  opacity:0;
  transition:opacity .4s;
}

.vx-btn:hover::after{opacity:1}
.vx-btn:hover{transform:translateY(-2px);border-color:var(--vx-border-strong)}
.vx-btn:active{transform:translateY(0) scale(.98)}
.vx-btn[disabled]{opacity:.45;cursor:not-allowed;transform:none}

.vx-btn--primary{
  border-color:transparent;
  background:linear-gradient(135deg,var(--vx-accent),var(--vx-accent-2));
  color:#04121b;
  box-shadow:0 14px 30px -16px color-mix(in srgb,var(--vx-accent) 85%, transparent);
}

.vx-nw.theme-light .vx-btn--primary{color:#fff}
.vx-btn--primary:hover{filter:brightness(1.08)}

.vx-btn--accent{
  border-color:color-mix(in srgb,var(--vx-accent) 45%, transparent);
  background:color-mix(in srgb,var(--vx-accent) 14%, transparent);
}

.vx-btn--danger{
  border-color:color-mix(in srgb,var(--vx-danger) 40%, transparent);
  background:color-mix(in srgb,var(--vx-danger) 13%, transparent);
  color:color-mix(in srgb,var(--vx-danger) 88%, var(--vx-text));
}

.vx-btn--danger:hover{background:color-mix(in srgb,var(--vx-danger) 24%, transparent)}
.vx-btn--ghost{background:transparent}
.vx-btn--sm{padding:7px 12px;font-size:12px;border-radius:10px}

.vx-mini-btn{
  padding:5px 9px;
  border-radius:9px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text-dim);
  font:inherit;font-size:11.5px;
  cursor:pointer;
  transition:.18s var(--vx-ease);
}

.vx-mini-btn:hover{color:var(--vx-text);border-color:var(--vx-border-strong);transform:translateY(-1px)}
.vx-mini-btn[disabled]{opacity:.35;cursor:not-allowed;transform:none}
.vx-mini-btn--danger:hover{color:var(--vx-danger);border-color:color-mix(in srgb,var(--vx-danger) 45%, transparent)}

.vx-chip{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 9px;
  border-radius:999px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  font-size:11px;color:var(--vx-text-dim);
  white-space:nowrap;
}

.vx-chip--star{color:var(--vx-warning);border-color:color-mix(in srgb,var(--vx-warning) 40%, transparent)}
.vx-chip--priority-urgent{color:var(--vx-danger);border-color:color-mix(in srgb,var(--vx-danger) 40%, transparent)}
.vx-chip--priority-high{color:var(--vx-warning);border-color:color-mix(in srgb,var(--vx-warning) 34%, transparent)}
.vx-chip--status-done{color:var(--vx-success);border-color:color-mix(in srgb,var(--vx-success) 36%, transparent)}
.vx-chip--status-doing{color:var(--vx-accent);border-color:color-mix(in srgb,var(--vx-accent) 36%, transparent)}

.vx-tag{
  padding:2px 8px;
  border-radius:8px;
  background:color-mix(in srgb,var(--vx-accent-2) 14%, transparent);
  color:color-mix(in srgb,var(--vx-accent-2) 82%, var(--vx-text));
  font-size:11px;
}

.vx-hint{margin:0;font-size:12px;color:var(--vx-text-faint);line-height:1.9}

.vx-nw__dot--violet{background:var(--vx-color-violet)}
.vx-nw__dot--blue{background:var(--vx-color-blue)}
.vx-nw__dot--emerald{background:var(--vx-color-emerald)}
.vx-nw__dot--amber{background:var(--vx-color-amber)}
.vx-nw__dot--rose{background:var(--vx-color-rose)}
.vx-nw__dot--slate{background:var(--vx-color-slate)}

/* ==================================================================
   ۴) نوار ابزار
   ================================================================== */

.vx-nw__toolbar{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  padding:10px 14px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  backdrop-filter:var(--vx-glass);
  animation:vx-rise .5s var(--vx-ease-out) .05s both;
}

.vx-nw__views{display:flex;flex-wrap:wrap;gap:4px;padding:4px;border-radius:14px;background:var(--vx-surface-3)}

.vx-nw__view-tab{
  display:inline-flex;align-items:center;gap:6px;
  padding:8px 13px;
  border:0;border-radius:11px;
  background:transparent;
  color:var(--vx-text-dim);
  font:inherit;font-size:12.4px;font-weight:600;
  cursor:pointer;
  transition:.2s var(--vx-ease);
}

.vx-nw__view-tab:hover{color:var(--vx-text);background:var(--vx-surface-2)}

.vx-nw__view-tab.is-active{
  color:var(--vx-text);
  background:linear-gradient(135deg, color-mix(in srgb,var(--vx-accent) 22%, transparent), color-mix(in srgb,var(--vx-accent-2) 22%, transparent));
  box-shadow:0 10px 22px -16px color-mix(in srgb,var(--vx-accent) 90%, transparent);
}

.vx-nw__toolbar-side{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.vx-nw__toolbar-side .vx-select{width:auto;min-width:150px}

/* ==================================================================
   ۵) چیدمان و سایدبار
   ================================================================== */

.vx-nw__layout{display:grid;grid-template-columns:272px minmax(0,1fr);gap:18px;align-items:start}

.vx-nw__sidebar{
  position:sticky;top:16px;
  display:flex;flex-direction:column;gap:14px;
  max-height:calc(100vh - 32px);
  overflow:auto;
  padding-inline-end:4px;
  animation:vx-rise .5s var(--vx-ease-out) .1s both;
  scrollbar-width:thin;
}

.vx-nw__side-card{
  padding:14px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  backdrop-filter:var(--vx-glass);
}

.vx-nw__side-title{margin:0 0 10px;font-size:12.5px;font-weight:700;color:var(--vx-text-dim);letter-spacing:.2px}

.vx-nw__bucket-list{display:flex;flex-direction:column;gap:3px}

.vx-nw__bucket{
  display:flex;align-items:center;gap:9px;
  width:100%;
  padding:9px 11px;
  border:1px solid transparent;
  border-radius:12px;
  background:transparent;
  color:var(--vx-text-dim);
  font:inherit;font-size:12.6px;
  cursor:pointer;
  text-align:start;
  transition:.2s var(--vx-ease);
}

.vx-nw__bucket:hover{background:var(--vx-surface-2);color:var(--vx-text);transform:translateX(-3px)}

.vx-nw__bucket.is-active{
  color:var(--vx-text);
  background:linear-gradient(90deg, color-mix(in srgb,var(--vx-accent) 16%, transparent), transparent);
  border-color:color-mix(in srgb,var(--vx-accent) 30%, transparent);
}

.vx-nw__bucket-count{
  margin-inline-start:auto;
  padding:1px 8px;
  border-radius:999px;
  background:var(--vx-surface-3);
  font-size:11px;font-weight:700;
}

.vx-nw__chip-row{display:flex;flex-wrap:wrap;gap:6px}

.vx-nw__chip{
  display:inline-flex;align-items:center;gap:5px;
  padding:6px 11px;
  border-radius:999px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text-dim);
  font:inherit;font-size:11.6px;
  cursor:pointer;
  transition:.18s var(--vx-ease);
}

.vx-nw__chip:hover{color:var(--vx-text);transform:translateY(-1px)}

.vx-nw__chip.is-active{
  color:#04121b;
  border-color:transparent;
  background:linear-gradient(135deg,var(--vx-accent),var(--vx-accent-2));
  box-shadow:0 10px 20px -14px color-mix(in srgb,var(--vx-accent) 90%, transparent);
}

.vx-nw.theme-light .vx-nw__chip.is-active{color:#fff}

.vx-nw__chip--priority-urgent.is-active{background:linear-gradient(135deg,#ff5d7a,#ff8f5d)}
.vx-nw__chip--priority-high.is-active{background:linear-gradient(135deg,#ffb545,#ff8f5d)}
.vx-nw__chip--priority-low.is-active{background:linear-gradient(135deg,#8895ad,#5f6b83)}

.vx-nw__template-list{display:flex;flex-direction:column;gap:4px}

.vx-nw__template{
  display:flex;align-items:center;gap:10px;
  width:100%;padding:9px 10px;
  border:1px solid transparent;border-radius:12px;
  background:transparent;color:var(--vx-text-dim);
  font:inherit;text-align:start;cursor:pointer;
  transition:.2s var(--vx-ease);
}

.vx-nw__template:hover{background:var(--vx-surface-2);color:var(--vx-text);transform:translateX(-3px)}

.vx-nw__template-icon{font-size:16px}
.vx-nw__template-text{display:flex;flex-direction:column;gap:1px;min-width:0}
.vx-nw__template-text strong{font-size:12.4px;font-weight:700}
.vx-nw__template-text small{font-size:10.8px;color:var(--vx-text-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.vx-nw__upcoming{display:flex;flex-direction:column;gap:4px}

.vx-nw__upcoming-item{
  display:flex;align-items:center;gap:9px;
  width:100%;padding:8px 10px;
  border:1px solid var(--vx-border);border-radius:12px;
  background:var(--vx-surface-2);
  color:var(--vx-text-dim);
  font:inherit;text-align:start;cursor:pointer;
  transition:.2s var(--vx-ease);
}

.vx-nw__upcoming-item:hover{
  color:var(--vx-text);
  transform:translateX(-3px);
  border-color:color-mix(in srgb,var(--vx-accent) 40%, transparent);
}

.vx-nw__upcoming-icon{font-size:14px}
.vx-nw__upcoming-text{display:flex;flex-direction:column;gap:1px;min-width:0}
.vx-nw__upcoming-text strong{font-size:12.2px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vx-nw__upcoming-text small{font-size:10.6px;color:var(--vx-text-faint)}

.vx-nw__usage-bar{height:8px;border-radius:999px;background:var(--vx-surface-3);overflow:hidden}
.vx-nw__usage-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--vx-accent),var(--vx-accent-2));transition:width .6s var(--vx-ease)}
.vx-nw__usage-text{display:flex;flex-direction:column;gap:2px;margin:8px 0 0;font-size:12px;color:var(--vx-text-dim)}
.vx-nw__usage-text small{font-size:10.8px;color:var(--vx-text-faint)}

/* ==================================================================
   ۶) پنل‌ها
   ================================================================== */

.vx-nw__panels{display:flex;flex-direction:column;gap:14px}

.vx-nw__panel{
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  backdrop-filter:var(--vx-glass);
  box-shadow:var(--vx-shadow);
  overflow:hidden;
  animation:vx-panel-in .34s var(--vx-ease-out) both;
}

@keyframes vx-panel-in{from{opacity:0;transform:translateY(-10px) scale(.99)}to{opacity:1;transform:none}}

.vx-nw__panel-head{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:13px 16px;
  border-bottom:1px solid var(--vx-border);
  background:var(--vx-surface-2);
}

.vx-nw__panel-head h3{margin:0;font-size:14px;font-weight:700}
.vx-nw__panel-actions{display:flex;gap:6px}
.vx-nw__panel-body{padding:16px;display:flex;flex-direction:column;gap:16px}

.vx-nw__stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:10px}

.vx-nw__stat-card{
  display:flex;flex-direction:column;gap:3px;
  padding:13px;
  border-radius:var(--vx-radius-sm);
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  transition:transform var(--vx-dur) var(--vx-ease);
}

.vx-nw__stat-card:hover{transform:translateY(-3px)}
.vx-nw__stat-card strong{font-size:18px;font-weight:800}
.vx-nw__stat-card small{font-size:11.4px;color:var(--vx-text-dim)}
.vx-nw__stat-card.danger{border-color:color-mix(in srgb,var(--vx-danger) 36%, transparent)}
.vx-nw__stat-icon{font-size:15px}

.vx-nw__chart{display:flex;flex-direction:column;gap:8px}
.vx-nw__chart h4,.vx-nw__tags-cloud h4,.vx-nw__neglected h4{margin:0 0 4px;font-size:12.4px;color:var(--vx-text-dim)}

.vx-nw__chart-row{display:flex;align-items:center;gap:9px;font-size:12px}
.vx-nw__chart-label{width:66px;color:var(--vx-text-dim)}
.vx-nw__chart-bar{flex:1;height:7px;border-radius:999px;background:var(--vx-surface-3);overflow:hidden}
.vx-nw__chart-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--vx-accent),var(--vx-accent-2));transition:width .7s var(--vx-ease)}

.vx-nw__neglected ul{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.vx-nw__neglected li{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px}
.vx-nw__neglected small{color:var(--vx-text-faint)}

.vx-nw__link-btn{
  border:0;background:transparent;padding:0;
  color:var(--vx-accent);font:inherit;font-size:12px;cursor:pointer;
  text-decoration:underline;text-underline-offset:3px;
}

.vx-nw__reminder-list,.vx-nw__notif-list{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}

.vx-nw__reminder-item,.vx-nw__notif-item{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:11px 13px;
  border-radius:var(--vx-radius-sm);
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  animation:vx-rise .3s var(--vx-ease-out) both;
}

.vx-nw__notif-item.is-unread{border-color:color-mix(in srgb,var(--vx-accent) 40%, transparent)}
.vx-nw__reminder-item div strong,.vx-nw__notif-item strong{display:block;font-size:12.8px}
.vx-nw__reminder-item small,.vx-nw__notif-item small{color:var(--vx-text-faint);font-size:11px}
.vx-nw__notif-item p{margin:3px 0;font-size:12px;color:var(--vx-text-dim)}
.vx-nw__reminder-actions,.vx-nw__notif-actions{display:flex;gap:6px;flex:0 0 auto}

.vx-nw__template-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));gap:10px}

.vx-nw__template-card{
  display:flex;flex-direction:column;align-items:flex-start;gap:5px;
  padding:15px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text);
  font:inherit;text-align:start;cursor:pointer;
  transition:.24s var(--vx-ease);
}

.vx-nw__template-card:hover{
  transform:translateY(-4px);
  border-color:color-mix(in srgb,var(--vx-accent) 42%, transparent);
  box-shadow:0 22px 44px -28px color-mix(in srgb,var(--vx-accent) 80%, transparent);
}

.vx-nw__template-card strong{font-size:13.4px}
.vx-nw__template-card small{font-size:11.4px;color:var(--vx-text-dim);line-height:1.8}
.vx-nw__template-card-icon{font-size:20px}
.vx-nw__template-card-count{margin-top:auto;padding:3px 9px;border-radius:999px;background:var(--vx-surface-3);font-size:10.8px;color:var(--vx-text-dim)}

/* فرم‌ها */
.vx-form{display:flex;flex-direction:column;gap:14px}
.vx-form--grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:13px}
.vx-form__field{display:flex;flex-direction:column;gap:6px}
.vx-form__label{font-size:11.8px;font-weight:600;color:var(--vx-text-dim)}
.vx-form__row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.vx-form__switches{display:flex;flex-wrap:wrap;gap:12px;grid-column:1/-1}
.vx-form__footer{display:flex;justify-content:flex-end;gap:8px;grid-column:1/-1}
.vx-form__error{margin:0;font-size:12px;color:var(--vx-danger)}

.vx-switch{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--vx-text-dim);cursor:pointer}
.vx-switch input{width:16px;height:16px;accent-color:var(--vx-accent);cursor:pointer}

/* ==================================================================
   ۷) کارت یادداشت
   ================================================================== */

.vx-view{display:block}

.vx-note-grid,.vx-note-list{display:grid;gap:14px}
.vx-note-grid{grid-template-columns:repeat(auto-fill,minmax(268px,1fr))}
.vx-note-list{grid-template-columns:1fr}

.vx-note-card{
  position:relative;
  display:flex;flex-direction:column;gap:10px;
  padding:16px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:linear-gradient(165deg, var(--vx-surface-2), var(--vx-surface));
  box-shadow:var(--vx-shadow);
  overflow:hidden;
  cursor:default;
  transition:transform .26s var(--vx-ease), border-color var(--vx-dur), box-shadow .26s var(--vx-ease);
  animation:vx-card-in .42s var(--vx-ease-out) both;
}

.vx-note-card:nth-child(1){animation-delay:.02s}
.vx-note-card:nth-child(2){animation-delay:.05s}
.vx-note-card:nth-child(3){animation-delay:.08s}
.vx-note-card:nth-child(4){animation-delay:.11s}
.vx-note-card:nth-child(5){animation-delay:.14s}
.vx-note-card:nth-child(6){animation-delay:.17s}
.vx-note-card:nth-child(n+7){animation-delay:.2s}

@keyframes vx-card-in{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}

.vx-note-card::before{
  content:"";
  position:absolute;inset-inline-start:0;top:0;bottom:0;width:3px;
  background:linear-gradient(180deg, var(--note-accent, var(--vx-accent)), color-mix(in srgb, var(--note-accent, var(--vx-accent)) 35%, transparent));
  opacity:.6;
  transition:opacity var(--vx-dur), width var(--vx-dur);
}

.vx-note-card::after{
  content:"";
  position:absolute;inset:0;
  background:radial-gradient(420px 200px at var(--mx,50%) var(--my,0%), color-mix(in srgb,var(--note-accent,var(--vx-accent)) 12%, transparent), transparent 60%);
  opacity:0;
  transition:opacity .35s;
  pointer-events:none;
}

.vx-note-card:hover,.vx-note-card:focus-visible{
  transform:translateY(-5px);
  border-color:color-mix(in srgb,var(--note-accent,var(--vx-accent)) 42%, transparent);
  box-shadow:0 34px 66px -34px color-mix(in srgb,var(--note-accent,var(--vx-accent)) 70%, transparent);
  outline:none;
}

.vx-note-card:hover::before{opacity:1;width:4px}
.vx-note-card:hover::after{opacity:1}

.vx-note-card.is-selected{
  border-color:color-mix(in srgb,var(--vx-accent) 60%, transparent);
  box-shadow:0 0 0 2px color-mix(in srgb,var(--vx-accent) 30%, transparent), var(--vx-shadow);
}

.vx-note-card.is-overdue{border-color:color-mix(in srgb,var(--vx-danger) 34%, transparent)}
.vx-note-card.is-trashed{opacity:.66;filter:grayscale(.35)}
.vx-note-card.is-archived{opacity:.82;filter:saturate(.75)}
.vx-note-card.is-drop-target{outline:2px dashed var(--vx-accent);outline-offset:3px}

.vx-note-card__pin{position:absolute;top:10px;inset-inline-start:12px;font-size:12px;opacity:.8}

.vx-note-card__head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.vx-note-card__heading{min-width:0;display:flex;flex-direction:column;gap:7px}
.vx-note-card__title{margin:0;font-size:15px;font-weight:700;line-height:1.65;word-break:break-word}
.vx-note-card__meta{display:flex;flex-wrap:wrap;gap:5px}

.vx-note-card__check{width:17px;height:17px;accent-color:var(--vx-accent);cursor:pointer;flex:0 0 auto}

.vx-note-card__preview{margin:0;font-size:12.6px;line-height:2;color:var(--vx-text-dim);word-break:break-word}
.vx-note-card__preview.is-empty{font-style:italic;color:var(--vx-text-faint)}

.vx-note-card__blocks{font-size:13px;letter-spacing:3px;opacity:.75}

.vx-note-card__progress{display:flex;flex-direction:column;gap:5px}
.vx-note-card__progress-bar{height:6px;border-radius:999px;background:var(--vx-surface-3);overflow:hidden}
.vx-note-card__progress-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--vx-success),var(--vx-accent));transition:width .6s var(--vx-ease)}
.vx-note-card__progress small{font-size:10.8px;color:var(--vx-text-faint)}

.vx-note-card__tags{display:flex;flex-wrap:wrap;gap:5px}

.vx-note-card__footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:9px;margin-top:auto;padding-top:4px}
.vx-note-card__badges{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;color:var(--vx-text-dim)}
.vx-note-card__due.is-overdue{color:var(--vx-danger);font-weight:700}
.vx-note-card__due.is-today{color:var(--vx-warning);font-weight:700}
.vx-note-card__reminder{color:color-mix(in srgb,var(--vx-accent) 85%, var(--vx-text))}

.vx-note-card__actions{display:flex;flex-wrap:wrap;gap:4px;opacity:.55;transition:opacity var(--vx-dur)}
.vx-note-card:hover .vx-note-card__actions,.vx-note-card:focus-within .vx-note-card__actions{opacity:1}

.vx-group{display:flex;flex-direction:column;gap:11px;margin-bottom:22px}
.vx-group__head{display:flex;align-items:center;gap:9px}
.vx-group__title{margin:0;font-size:14px;font-weight:700;color:var(--vx-text-dim)}

/* ==================================================================
   ۸) بورد / تایم‌لاین / تقویم
   ================================================================== */

.vx-view--board{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(232px,1fr));
  gap:13px;
  align-items:start;
}

.vx-board__column{
  display:flex;flex-direction:column;gap:10px;
  padding:12px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  min-height:160px;
}

.vx-board__head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.vx-board__head h3{margin:0;font-size:13px;font-weight:700}
.vx-board__body{display:flex;flex-direction:column;gap:10px}

.vx-view--timeline{position:relative;display:flex;flex-direction:column;gap:14px;padding-inline-start:22px}

.vx-view--timeline::before{
  content:"";
  position:absolute;inset-inline-start:6px;top:6px;bottom:6px;width:2px;
  background:linear-gradient(180deg, var(--vx-accent), color-mix(in srgb,var(--vx-accent-2) 40%, transparent), transparent);
}

.vx-timeline__item{position:relative}

.vx-timeline__dot{
  position:absolute;inset-inline-start:-22px;top:16px;
  width:12px;height:12px;border-radius:50%;
  background:var(--vx-accent);
  box-shadow:0 0 0 4px color-mix(in srgb,var(--vx-accent) 22%, transparent);
  animation:vx-pulse 2.4s ease-in-out infinite;
}

.vx-timeline__card{
  padding:14px 16px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  transition:transform var(--vx-dur) var(--vx-ease);
}

.vx-timeline__card:hover{transform:translateX(-4px)}
.vx-timeline__card header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}
.vx-timeline__card h3{margin:0;font-size:14px;font-weight:700}
.vx-timeline__card p{margin:0 0 9px;font-size:12.4px;line-height:1.95;color:var(--vx-text-dim)}
.vx-timeline__card footer{display:flex;flex-wrap:wrap;align-items:center;gap:7px}

.vx-view--calendar{display:grid;grid-template-columns:minmax(280px,1fr) minmax(280px,1.1fr);gap:16px;align-items:start}

.vx-calendar{
  padding:15px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
}

.vx-calendar__head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.vx-calendar__head h3{margin:0;font-size:14px;font-weight:700}

.vx-calendar__weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px}
.vx-calendar__weekdays span{text-align:center;font-size:11px;color:var(--vx-text-faint)}

.vx-calendar__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}

.vx-calendar__cell{
  position:relative;
  display:flex;flex-direction:column;align-items:center;gap:3px;
  aspect-ratio:1;
  padding:5px;
  border-radius:11px;
  border:1px solid transparent;
  background:var(--vx-surface-2);
  font-size:11.6px;
  transition:.2s var(--vx-ease);
}

.vx-calendar__cell.is-blank{background:transparent}
.vx-calendar__cell.has-notes{border-color:color-mix(in srgb,var(--vx-accent) 34%, transparent)}
.vx-calendar__cell.has-notes:hover{transform:scale(1.07)}
.vx-calendar__cell.is-today{background:linear-gradient(135deg, color-mix(in srgb,var(--vx-accent) 26%, transparent), color-mix(in srgb,var(--vx-accent-2) 26%, transparent));font-weight:800}

.vx-calendar__pill{
  padding:0 6px;border-radius:999px;
  background:var(--vx-accent);color:#04121b;
  font-size:10px;font-weight:800;
}

.vx-calendar__list{display:flex;flex-direction:column;gap:12px}
.vx-calendar__day h4{margin:0 0 8px;font-size:12.6px;color:var(--vx-text-dim)}

/* ==================================================================
   ۹) وضعیت‌ها (خالی / خطا / بارگذاری)
   ================================================================== */

.vx-state{
  display:grid;place-items:center;gap:12px;
  padding:64px 22px;
  text-align:center;
  border-radius:var(--vx-radius-lg);
  border:1px dashed var(--vx-border);
  background:var(--vx-surface);
  animation:vx-rise .4s var(--vx-ease-out) both;
}

.vx-state__icon{
  width:66px;height:66px;
  display:grid;place-items:center;
  border-radius:22px;
  font-size:26px;
  background:var(--vx-surface-2);
  border:1px solid var(--vx-border);
  animation:vx-float 5s ease-in-out infinite;
}

.vx-state__title{margin:0;font-size:16.5px;font-weight:700}
.vx-state__desc{margin:0;max-width:440px;font-size:12.8px;line-height:2;color:var(--vx-text-dim)}
.vx-state__actions{display:flex;flex-wrap:wrap;gap:9px;justify-content:center}
.vx-state--error .vx-state__icon{color:var(--vx-danger)}

.vx-skeleton-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:14px;width:100%}

.vx-skeleton-card{
  display:flex;flex-direction:column;gap:11px;
  padding:17px;
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
}

.vx-skeleton{
  display:block;height:13px;border-radius:8px;
  background:linear-gradient(90deg, var(--vx-surface-2), var(--vx-surface-3), var(--vx-surface-2));
  background-size:220% 100%;
  animation:vx-shimmer 1.4s linear infinite;
}

.vx-skeleton:nth-child(1){width:55%}
.vx-skeleton:nth-child(2){width:92%}
.vx-skeleton:nth-child(3){width:70%}

@keyframes vx-shimmer{from{background-position:220% 0}to{background-position:-220% 0}}

/* ==================================================================
   ۱۰) نوار گروهی و صفحه‌بندی
   ================================================================== */

.vx-bulkbar{
  position:sticky;bottom:14px;z-index:30;
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  margin-bottom:14px;padding:12px 16px;
  border-radius:var(--vx-radius);
  border:1px solid color-mix(in srgb,var(--vx-accent) 34%, transparent);
  background:var(--vx-surface-2);
  backdrop-filter:var(--vx-glass);
  box-shadow:var(--vx-shadow);
  animation:vx-bulk-in .3s var(--vx-ease-out) both;
}

@keyframes vx-bulk-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

.vx-bulkbar strong{font-size:13px}
.vx-bulkbar__actions{display:flex;flex-wrap:wrap;gap:6px}

.vx-pager{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:18px}
.vx-pager__info{font-size:12px;color:var(--vx-text-dim)}

/* ==================================================================
   ۱۱) کشوی ویرایشگر
   ================================================================== */

.vx-drawer-host{position:fixed;inset:0;z-index:60;pointer-events:none}

.vx-drawer{
  position:absolute;
  inset-block:0;
  inset-inline-start:450px;
  width:min(620px,100%);
  display:flex;flex-direction:column;
  border-inline-end:1px solid var(--vx-border-strong);
  background:color-mix(in srgb, var(--vx-bg) 88%, transparent);
  backdrop-filter:var(--vx-glass);
  box-shadow:40px 0 90px -50px rgba(0,0,0,.8);
  pointer-events:auto;
  animation:vx-drawer-in .38s var(--vx-ease-out) both;
}

@keyframes vx-drawer-in{from{transform:translateX(-102%)}to{transform:none}}

.vx-drawer__head{
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  padding:17px 19px;
  border-bottom:1px solid var(--vx-border);
}

.vx-drawer__title h2{margin:0;font-size:16.5px;font-weight:800;word-break:break-word}
.vx-drawer__title small{display:block;margin-top:4px;font-size:11.4px;color:var(--vx-text-faint)}

.vx-drawer__close{
  width:32px;height:32px;flex:0 0 auto;
  border-radius:11px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text-dim);
  font-size:17px;line-height:1;
  cursor:pointer;
  transition:.18s var(--vx-ease);
}

.vx-drawer__close:hover{color:var(--vx-text);transform:rotate(90deg)}

.vx-drawer__tabs{
  display:flex;flex-wrap:wrap;gap:4px;
  padding:9px 13px;
  border-bottom:1px solid var(--vx-border);
  background:var(--vx-surface);
}

.vx-drawer__tab{
  padding:8px 13px;
  border:1px solid transparent;border-radius:11px;
  background:transparent;color:var(--vx-text-dim);
  font:inherit;font-size:12.2px;font-weight:600;
  cursor:pointer;
  transition:.2s var(--vx-ease);
}

.vx-drawer__tab:hover{color:var(--vx-text);background:var(--vx-surface-2)}

.vx-drawer__tab.is-active{
  color:var(--vx-text);
  border-color:color-mix(in srgb,var(--vx-accent) 34%, transparent);
  background:color-mix(in srgb,var(--vx-accent) 13%, transparent);
}

.vx-drawer__body{flex:1;overflow:auto;padding:17px 19px;scrollbar-width:thin}

.vx-drawer__footer{
  display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;
  padding:13px 19px;
  border-top:1px solid var(--vx-border);
  background:var(--vx-surface);
}

/* ==================================================================
   ۱۲) بخش‌ها (بلوک‌ها)
   ================================================================== */

.vx-blocks{display:flex;flex-direction:column;gap:13px}

.vx-block{
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  overflow:hidden;
  animation:vx-rise .34s var(--vx-ease-out) both;
  transition:border-color var(--vx-dur), box-shadow var(--vx-dur);
}

.vx-block:hover{border-color:var(--vx-border-strong)}
.vx-block:focus-within{border-color:color-mix(in srgb,var(--vx-accent) 40%, transparent);box-shadow:0 0 0 4px color-mix(in srgb,var(--vx-accent) 10%, transparent)}

.vx-block__head{
  display:flex;align-items:center;gap:8px;
  padding:9px 11px;
  border-bottom:1px solid var(--vx-border);
  background:var(--vx-surface-3);
}

.vx-block.is-collapsed .vx-block__head{border-bottom:0}
.vx-block.is-collapsed .vx-block__body{display:none}

.vx-block__toggle{
  width:26px;height:26px;flex:0 0 auto;
  border:0;border-radius:8px;
  background:transparent;color:var(--vx-text-dim);
  cursor:pointer;transition:.18s;
}

.vx-block__toggle:hover{background:var(--vx-surface-2);color:var(--vx-text)}

.vx-block__icon{font-size:14px}

.vx-block__title{
  flex:1;min-width:0;
  padding:6px 9px;
  border:1px solid transparent;border-radius:9px;
  background:transparent;color:var(--vx-text);
  font:inherit;font-size:12.8px;font-weight:700;
  outline:none;
  transition:.18s;
}

.vx-block__title:hover{border-color:var(--vx-border)}
.vx-block__title:focus{border-color:color-mix(in srgb,var(--vx-accent) 50%, transparent);background:var(--vx-surface-2)}

.vx-block__ops{display:flex;gap:3px;flex:0 0 auto}
.vx-block__body{padding:12px;display:flex;flex-direction:column;gap:10px}

.vx-block__textarea--code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.2px;direction:ltr;text-align:left}

.vx-block__items{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}

.vx-item{
  display:flex;align-items:center;gap:8px;
  padding:7px 9px;
  border-radius:11px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  animation:vx-item-in .26s var(--vx-ease-out) both;
  transition:border-color .18s, transform .18s var(--vx-ease);
}

@keyframes vx-item-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}

.vx-item:hover{border-color:var(--vx-border-strong)}
.vx-item.is-done{opacity:.62}
.vx-item.is-done .vx-item__text{text-decoration:line-through}

.vx-item__check{width:16px;height:16px;flex:0 0 auto;accent-color:var(--vx-success);cursor:pointer}

.vx-item__text{
  flex:1;min-width:0;
  padding:6px 8px;
  border:1px solid transparent;border-radius:8px;
  background:transparent;color:var(--vx-text);
  font:inherit;font-size:12.4px;
  outline:none;
  transition:.18s;
}

.vx-item__text:hover{border-color:var(--vx-border)}
.vx-item__text:focus{border-color:color-mix(in srgb,var(--vx-accent) 50%, transparent);background:var(--vx-surface-2)}

.vx-item--kv .vx-item__text{flex:1 1 40%}

.vx-item--grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));align-items:center}
.vx-item--grid .vx-item__remove{grid-column:-1}

.vx-item__remove{
  width:24px;height:24px;flex:0 0 auto;
  border:1px solid transparent;border-radius:8px;
  background:transparent;color:var(--vx-text-faint);
  font-size:15px;line-height:1;cursor:pointer;
  transition:.18s;
}

.vx-item__remove:hover{color:var(--vx-danger);border-color:color-mix(in srgb,var(--vx-danger) 40%, transparent)}

.vx-item__open{
  width:26px;height:26px;flex:0 0 auto;
  display:grid;place-items:center;
  border-radius:8px;
  border:1px solid var(--vx-border);
  color:var(--vx-text-dim);
  text-decoration:none;font-size:12px;
  transition:.18s;
}

.vx-item__open:hover{color:var(--vx-accent);border-color:color-mix(in srgb,var(--vx-accent) 45%, transparent)}

.vx-block__quickadd{
  display:flex;flex-wrap:wrap;gap:7px;align-items:center;
  padding:9px;
  border-radius:12px;
  border:1px dashed var(--vx-border);
  background:var(--vx-surface);
}

.vx-block__quickadd .vx-input{flex:1 1 150px}

.vx-rating{display:flex;gap:2px}

.vx-rating__star{
  border:0;background:transparent;
  color:var(--vx-surface-3);
  font-size:15px;cursor:pointer;
  transition:transform .16s var(--vx-ease), color .18s;
}

.vx-rating__star.is-on{color:var(--vx-warning);text-shadow:0 0 12px color-mix(in srgb,var(--vx-warning) 55%, transparent)}
.vx-rating__star:hover{transform:scale(1.25)}

.vx-block__table-wrap{overflow:auto;border-radius:12px;border:1px solid var(--vx-border)}

.vx-block__table{width:100%;border-collapse:collapse;font-size:12.2px}
.vx-block__table th,.vx-block__table td{padding:4px;border-bottom:1px solid var(--vx-border)}
.vx-block__table thead th{background:var(--vx-surface-3);position:sticky;top:0}
.vx-block__table-op{width:34px}

.vx-block__money-summary{
  display:flex;flex-wrap:wrap;gap:12px;align-items:center;
  padding:10px 12px;
  border-radius:12px;
  background:var(--vx-surface);
  border:1px solid var(--vx-border);
  font-size:12px;
}

.vx-block__money-summary .is-income{color:var(--vx-success)}
.vx-block__money-summary .is-expense{color:var(--vx-danger)}

.vx-block-picker{
  padding:13px;
  border-radius:var(--vx-radius);
  border:1px dashed var(--vx-border);
  background:var(--vx-surface);
}

.vx-block-picker__label{display:block;margin-bottom:9px;font-size:12px;color:var(--vx-text-dim)}

.vx-block-picker__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:7px}

.vx-block-picker__item{
  display:flex;align-items:center;gap:7px;
  padding:9px 11px;
  border-radius:11px;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  color:var(--vx-text-dim);
  font:inherit;font-size:11.8px;
  cursor:pointer;
  transition:.2s var(--vx-ease);
}

.vx-block-picker__item:hover{
  color:var(--vx-text);
  transform:translateY(-3px);
  border-color:color-mix(in srgb,var(--vx-accent) 42%, transparent);
  box-shadow:0 16px 30px -20px color-mix(in srgb,var(--vx-accent) 85%, transparent);
}

/* ==================================================================
   ۱۳) یادآور / ضمیمه / اشتراک / تاریخچه
   ================================================================== */

.vx-section{
  border-radius:var(--vx-radius);
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  overflow:hidden;
}

.vx-section__head{
  display:flex;align-items:center;gap:9px;
  padding:12px 15px;
  border-bottom:1px solid var(--vx-border);
}

.vx-section__head h3{margin:0;font-size:13.6px;font-weight:700}
.vx-section__body{padding:15px;display:flex;flex-direction:column;gap:14px}

.vx-reminder-list{display:flex;flex-direction:column;gap:9px;margin:0;padding:0;list-style:none}

.vx-reminder-item{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:11px;
  padding:12px 14px;
  border-radius:var(--vx-radius-sm);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  animation:vx-rise .3s var(--vx-ease-out) both;
}

.vx-reminder-item.is-off{opacity:.55}
.vx-reminder-item__main{min-width:0;display:flex;flex-direction:column;gap:5px}
.vx-reminder-item__main strong{font-size:12.9px}
.vx-reminder-item__main p{margin:0;font-size:12px;color:var(--vx-text-dim)}
.vx-reminder-item__meta{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;color:var(--vx-text-faint)}
.vx-reminder-item__ops{display:flex;flex-wrap:wrap;gap:5px}

.vx-dropzone{
  position:relative;
  display:grid;place-items:center;
  min-height:132px;
  border-radius:var(--vx-radius);
  border:2px dashed var(--vx-border-strong);
  background:var(--vx-surface);
  cursor:pointer;
  overflow:hidden;
  transition:.24s var(--vx-ease);
}

.vx-dropzone:hover,.vx-dropzone.is-dragover{
  border-color:var(--vx-accent);
  background:color-mix(in srgb,var(--vx-accent) 8%, var(--vx-surface));
  transform:scale(1.005);
}

.vx-dropzone__input{position:absolute;inset:0;opacity:0;cursor:pointer}
.vx-dropzone__content{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;padding:16px}
.vx-dropzone__content span{font-size:24px}
.vx-dropzone__content strong{font-size:13px}
.vx-dropzone__content small{font-size:11.4px;color:var(--vx-text-faint)}

.vx-attachment-list{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}

.vx-attachment{
  display:flex;flex-wrap:wrap;align-items:center;gap:12px;
  padding:11px 13px;
  border-radius:var(--vx-radius-sm);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  animation:vx-rise .3s var(--vx-ease-out) both;
}

.vx-attachment__thumb{
  width:56px;height:56px;flex:0 0 auto;
  display:grid;place-items:center;
  border-radius:13px;
  object-fit:cover;
  border:1px solid var(--vx-border);
  background:var(--vx-surface-2);
  font-size:20px;
}

.vx-attachment__main{flex:1;min-width:180px;display:flex;flex-direction:column;gap:5px}
.vx-attachment__main strong{font-size:12.6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vx-attachment__main small{font-size:11px;color:var(--vx-text-faint)}
.vx-attachment__caption{font-size:11.8px;padding:6px 9px}
.vx-attachment__ops{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.vx-attachment__player{width:100%;max-width:280px;border-radius:10px}

.vx-share-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px}

.vx-share-btn{
  display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:13px 9px;
  border-radius:var(--vx-radius-sm);
  border:1px solid var(--vx-border);
  background:var(--vx-surface);
  color:var(--vx-text-dim);
  font:inherit;font-size:11.8px;
  cursor:pointer;
  transition:.22s var(--vx-ease);
}

.vx-share-btn:hover{
  color:var(--vx-text);
  transform:translateY(-4px);
  border-color:color-mix(in srgb,var(--vx-accent) 45%, transparent);
  box-shadow:0 18px 34px -22px color-mix(in srgb,var(--vx-accent) 85%, transparent);
}

.vx-share-btn span{font-size:19px}

.vx-share-preview h4,.vx-share-history h4{margin:0 0 7px;font-size:12.2px;color:var(--vx-text-dim)}

.vx-share-history ul{display:flex;flex-direction:column;gap:5px;margin:0;padding:0;list-style:none}
.vx-share-history li{display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:11.6px}
.vx-share-history small{color:var(--vx-text-faint)}

.vx-activity{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}

.vx-activity li{
  position:relative;
  display:flex;align-items:center;gap:9px;
  padding-inline-start:16px;
  font-size:12px;
}

.vx-activity__dot{
  position:absolute;inset-inline-start:0;top:5px;
  width:8px;height:8px;border-radius:50%;
  background:var(--vx-accent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--vx-accent) 20%, transparent);
}

.vx-activity small{margin-inline-start:auto;color:var(--vx-text-faint);font-size:10.8px}

.vx-color-picker{display:flex;flex-wrap:wrap;gap:8px}

.vx-color-picker__item{
  width:30px;height:30px;
  border-radius:11px;
  border:2px solid transparent;
  cursor:pointer;
  transition:.2s var(--vx-ease);
}

.vx-color-picker__item:hover{transform:scale(1.14) rotate(-4deg)}
.vx-color-picker__item.is-active{border-color:var(--vx-text);transform:scale(1.1)}

.vx-color-picker__item--violet{background:var(--vx-color-violet)}
.vx-color-picker__item--blue{background:var(--vx-color-blue)}
.vx-color-picker__item--emerald{background:var(--vx-color-emerald)}
.vx-color-picker__item--amber{background:var(--vx-color-amber)}
.vx-color-picker__item--rose{background:var(--vx-color-rose)}
.vx-color-picker__item--slate{background:var(--vx-color-slate)}

/* ==================================================================
   ۱۴) کمپوزر سریع + پالت فرمان + FAB
   ================================================================== */

.vx-overlay-host{position:fixed;inset:0;z-index:80;pointer-events:none}

.vx-composer{
  position:absolute;
  inset-inline:0;bottom:0;
  margin:auto;
  width:min(560px,calc(100% - 32px));
  margin-bottom:20px;
  border-radius:var(--vx-radius-lg);
  border:1px solid var(--vx-border-strong);
  background:color-mix(in srgb, var(--vx-bg) 92%, transparent);
  backdrop-filter:var(--vx-glass);
  box-shadow:0 40px 90px -40px rgba(0,0,0,.85);
  overflow:hidden;
  pointer-events:auto;
  animation:vx-composer-in .34s var(--vx-ease-out) both;
}

@keyframes vx-composer-in{from{opacity:0;transform:translateY(26px) scale(.97)}to{opacity:1;transform:none}}

.vx-composer__head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 16px;border-bottom:1px solid var(--vx-border)}
.vx-composer__head h3{margin:0;font-size:14px;font-weight:700}
.vx-composer__body{padding:15px 16px;display:flex;flex-direction:column;gap:10px}
.vx-composer__row{display:flex;flex-wrap:wrap;gap:8px}
.vx-composer__footer{display:flex;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid var(--vx-border);background:var(--vx-surface)}

.vx-cmdk__overlay{
  position:absolute;inset:0;
  display:grid;place-items:start center;
  padding-top:9vh;
  background:rgba(4,7,15,.6);
  backdrop-filter:blur(5px);
  pointer-events:auto;
  animation:vx-fade .2s ease both;
}

@keyframes vx-fade{from{opacity:0}to{opacity:1}}

.vx-cmdk{
  width:min(620px,calc(100% - 32px));
  border-radius:var(--vx-radius-lg);
  border:1px solid var(--vx-border-strong);
  background:color-mix(in srgb, var(--vx-bg) 94%, transparent);
  backdrop-filter:var(--vx-glass);
  box-shadow:0 50px 100px -46px rgba(0,0,0,.9);
  overflow:hidden;
  animation:vx-pop .26s var(--vx-ease-out) both;
}

.vx-cmdk__head{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid var(--vx-border)}
.vx-cmdk__input{flex:1;border:0;background:transparent;color:var(--vx-text);font:inherit;font-size:14px;outline:none}
.vx-cmdk__head kbd{padding:2px 8px;border-radius:7px;border:1px solid var(--vx-border);background:var(--vx-surface-2);font-size:11px;color:var(--vx-text-faint)}

.vx-cmdk__list{max-height:min(52vh,420px);overflow:auto;margin:0;padding:7px;list-style:none;scrollbar-width:thin}

.vx-cmdk__item{
  display:flex;align-items:center;gap:11px;
  padding:10px 12px;
  border-radius:12px;
  cursor:pointer;
  transition:.16s var(--vx-ease);
}

.vx-cmdk__item:hover,.vx-cmdk__item.is-active{background:color-mix(in srgb,var(--vx-accent) 14%, transparent)}
.vx-cmdk__item.is-active{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--vx-accent) 34%, transparent)}

.vx-cmdk__icon{font-size:15px}
.vx-cmdk__text{display:flex;flex-direction:column;gap:1px;min-width:0}
.vx-cmdk__text strong{font-size:12.9px;font-weight:600}
.vx-cmdk__text small{font-size:11px;color:var(--vx-text-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vx-cmdk__item kbd{margin-inline-start:auto;padding:2px 7px;border-radius:7px;border:1px solid var(--vx-border);font-size:10.6px;color:var(--vx-text-faint)}
.vx-cmdk__empty{padding:22px;text-align:center;font-size:12.4px;color:var(--vx-text-faint)}

.vx-fab{
  position:fixed;
  inset-inline-end:26px;bottom:26px;
  z-index:70;
  width:58px;height:58px;
  display:grid;place-items:center;
  border:0;border-radius:20px;
  background:linear-gradient(135deg,var(--vx-accent),var(--vx-accent-2));
  color:#04121b;
  font-size:24px;line-height:1;
  cursor:pointer;
  box-shadow:0 24px 46px -20px color-mix(in srgb,var(--vx-accent) 90%, transparent);
  transition:transform .24s var(--vx-ease), box-shadow .24s;
  animation:vx-fab-in .5s var(--vx-ease-out) .2s both;
}

.vx-nw.theme-light .vx-fab{color:#fff}

@keyframes vx-fab-in{from{opacity:0;transform:scale(.5) translateY(20px)}to{opacity:1;transform:none}}

.vx-fab:hover{transform:translateY(-4px) rotate(90deg) scale(1.06)}
.vx-fab:active{transform:scale(.94)}

/* ==================================================================
   ۱۵) تراکم و واکنش‌گرایی
   ================================================================== */

.vx-nw.density-compact{--vx-pad:14px;--vx-gap:10px}
.vx-nw.density-compact .vx-note-card{padding:11px;gap:7px}
.vx-nw.density-compact .vx-note-card__preview{font-size:11.8px;line-height:1.8}
.vx-nw.density-compact .vx-note-grid{grid-template-columns:repeat(auto-fill,minmax(214px,1fr));gap:9px}

@media (max-width:1180px){
  .vx-nw__layout{grid-template-columns:1fr}

  .vx-nw__sidebar{
    position:static;
    max-height:none;
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(232px,1fr));
  }

  .vx-view--calendar{grid-template-columns:1fr}
}

@media (max-width:720px){
  .vx-nw{padding:13px}
  .vx-nw__header{padding:15px}
  .vx-nw__brand-icon{width:44px;height:44px;font-size:20px}
  .vx-nw__title{font-size:18px}
  .vx-nw__actions{margin-inline-start:0;width:100%;justify-content:flex-start;flex-wrap:wrap}
  .vx-note-grid{grid-template-columns:1fr}
  .vx-drawer{width:100%}
  .vx-fab{inset-inline-end:16px;bottom:16px;width:52px;height:52px}
  .vx-nw__view-label{display:none}
}

@media (prefers-reduced-motion:reduce){
  .vx-nw *,.vx-nw *::before,.vx-nw *::after{
    animation-duration:.001ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.001ms !important;
  }
}

/* چاپ */
@media print{
  .vx-nw__bg,.vx-nw__sidebar,.vx-nw__toolbar,.vx-nw__actions,.vx-nw__searchbar,
  .vx-fab,.vx-drawer-host,.vx-overlay-host,.vx-note-card__actions,.vx-bulkbar{display:none !important}

  .vx-nw{padding:0;background:#fff;color:#000}
  .vx-note-card{break-inside:avoid;box-shadow:none;border-color:#ccc}
}
`;

export default notePageCss;
