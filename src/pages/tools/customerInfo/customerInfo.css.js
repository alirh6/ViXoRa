// src/pages/tools/customerInfo/customerInfo.css.js
//
// استایل فضای کاری «اطلاعات مشتریان» — scoped، بدون build step.
// prefix: vci- (اختصاصی) — کیت مشترک (مودال/توست) از vx- استفاده می‌کند.

export const customerInfoCss = /* css */ `
/* ==================================================================
   ۰) توکن‌های طراحی
   ================================================================== */

.vci-ws{
  --vci-radius-sm:10px;
  --vci-radius:16px;
  --vci-radius-lg:24px;

  --vci-gap:16px;
  --vci-pad:12px;

  --vci-ease:cubic-bezier(.22,.9,.24,1);
  --vci-ease-bounce:cubic-bezier(.34,1.56,.64,1);

  --vci-font:inherit;

  position:relative;
  min-height:100%;
  padding:var(--vci-pad);
  color:var(--vci-text);
  font-family:var(--vci-font);
  background:
    radial-gradient(900px 500px at 88% -8%, var(--vci-accent-soft), transparent 60%),
    radial-gradient(700px 460px at 6% 104%, rgba(94,234,212,.12), transparent 58%),
    var(--vci-bg);
}

/* پوستهٔ تاریک (پیش‌فرض) */
.vci-ws.theme-dark{
  --vci-bg:#0b1020;
  --vci-bg-soft:#121a30;
  --vci-surface:rgba(255,255,255,.04);
  --vci-surface-2:rgba(255,255,255,.07);
  --vci-border:rgba(255,255,255,.09);
  --vci-border-strong:rgba(255,255,255,.16);
  --vci-text:#e8ecf6;
  --vci-text-dim:#9aa6c4;
  --vci-text-faint:#6b779b;
  --vci-accent:#7c8cff;
  --vci-accent-2:#5eead4;
  --vci-accent-soft:rgba(124,140,255,.16);
  --vci-danger:#ff6b81;
  --vci-warn:#ffc14d;
  --vci-ok:#3ddc97;
  --vci-shadow:0 18px 50px -18px rgba(0,0,0,.7);
  --vci-glow:0 0 0 1px rgba(124,140,255,.3), 0 12px 40px -12px rgba(124,140,255,.4);
}

/* پوستهٔ روشن */
.vci-ws.theme-light{
  --vci-bg:#f4f6fc;
  --vci-bg-soft:#ffffff;
  --vci-surface:rgba(15,23,42,.03);
  --vci-surface-2:rgba(15,23,42,.06);
  --vci-border:rgba(15,23,42,.09);
  --vci-border-strong:rgba(15,23,42,.18);
  --vci-text:#131a2b;
  --vci-text-dim:#4b5876;
  --vci-text-faint:#8a94ad;
  --vci-accent:#4f5fe0;
  --vci-accent-2:#0d9488;
  --vci-accent-soft:rgba(79,95,224,.12);
  --vci-danger:#e11d48;
  --vci-warn:#d97706;
  --vci-ok:#059669;
  --vci-shadow:0 18px 44px -22px rgba(15,23,42,.4);
  --vci-glow:0 0 0 1px rgba(79,95,224,.25), 0 12px 34px -14px rgba(79,95,224,.35);
}

/* تراکم */
.vci-ws.density-compact{ --vci-pad:12px; --vci-gap:10px; }


.vci-ws__shell{
  max-width:1560px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:var(--vci-gap);
}

.vci-ws__layout{
  display:grid;
  grid-template-columns:264px minmax(0,1fr);
  gap:var(--vci-gap);
  align-items:start;
}

.vci-ws__main{ min-width:0; }

/* اسکرول‌بار ظریف */
.vci-ws ::-webkit-scrollbar{ width:10px; height:10px; }
.vci-ws ::-webkit-scrollbar-thumb{ background:var(--vci-border-strong); border-radius:20px; border:3px solid transparent; background-clip:content-box; }
.vci-ws ::-webkit-scrollbar-track{ background:transparent; }

/* ==================================================================
   ۱) آواتار — قاب گرادیانی
   ================================================================== */

.vci-avatar{
  --vci-avatar-size:44px;
  position:relative;
  display:inline-grid;
  place-items:center;
  width:var(--vci-avatar-size);
  height:var(--vci-avatar-size);
  border-radius:50%;
  overflow:visible;
  flex-shrink:0;
  transition:transform .3s var(--vci-ease-bounce);
}
.vci-avatar--ring{ padding:2px; background:linear-gradient(140deg, var(--vci-ring-a), var(--vci-ring-b)); }
.vci-avatar--ring > *{ border-radius:50%; }
.vci-avatar:hover{ transform:translateY(-2px) scale(1.04); }

.vci-avatar__img{
  width:100%; height:100%;
  border-radius:50%;
  object-fit:cover;
  display:block;
  background:var(--vci-bg-soft);
}
.vci-avatar--ring .vci-avatar__img,
.vci-avatar--ring .vci-avatar__initials{
  width:calc(var(--vci-avatar-size) - 4px);
  height:calc(var(--vci-avatar-size) - 4px);
}

.vci-avatar__initials{
  display:grid; place-items:center;
  width:100%; height:100%;
  border-radius:50%;
  font-weight:800;
  color:#fff;
  font-size:calc(var(--vci-avatar-size) * .38);
  letter-spacing:.5px;
  text-shadow:0 1px 3px rgba(0,0,0,.25);
  background:linear-gradient(140deg, var(--vci-ring-a), var(--vci-ring-b));
}

/* رنگ‌های آواتار */
.vci-avatar--violet{ --vci-ring-a:#8b5cf6; --vci-ring-b:#d946ef; }
.vci-avatar--blue{ --vci-ring-a:#3b82f6; --vci-ring-b:#06b6d4; }
.vci-avatar--emerald{ --vci-ring-a:#10b981; --vci-ring-b:#5eead4; }
.vci-avatar--amber{ --vci-ring-a:#f59e0b; --vci-ring-b:#fbbf24; }
.vci-avatar--rose{ --vci-ring-a:#f43f5e; --vci-ring-b:#fb7185; }
.vci-avatar--slate{ --vci-ring-a:#64748b; --vci-ring-b:#94a3b8; }

.vci-avatar__edit{
  position:absolute;
  bottom:-2px; left:-2px;
  width:30px; height:30px;
  border-radius:50%;
  border:2px solid var(--vci-bg-soft);
  background:var(--vci-accent);
  color:#fff;
  cursor:pointer;
  display:grid; place-items:center;
  font-size:13px;
  opacity:0;
  transform:scale(.7);
  transition:all .25s var(--vci-ease-bounce);
}
.vci-avatar:hover .vci-avatar__edit{ opacity:1; transform:scale(1); }

/* ==================================================================
   ۲) هدر
   ================================================================== */

.vci-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:var(--vci-gap);
  flex-wrap:wrap;
  padding:14px 18px;
  border-radius:var(--vci-radius-lg);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  backdrop-filter:blur(14px);
  box-shadow:var(--vci-shadow);
  animation:vci-fade-down .5s var(--vci-ease) both;
}
.vci-header.is-pinned{ position:sticky; top:12px; z-index:20; }

.vci-header__brand{ display:flex; align-items:center; gap:14px; }
.vci-header__logo{
  width:50px; height:50px;
  display:grid; place-items:center;
  font-size:24px;
  border-radius:16px;
  background:linear-gradient(140deg, var(--vci-accent), var(--vci-accent-2));
  box-shadow:0 8px 24px -8px var(--vci-accent);
}
.vci-header__title{ margin:0; font-size:21px; font-weight:800; letter-spacing:-.3px; }
.vci-header__subtitle{ margin:3px 0 0; font-size:13px; color:var(--vci-text-dim); }
.vci-header__subtitle strong{ color:var(--vci-text); }

.vci-header__actions{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

.vci-hbtn{
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 14px;
  border-radius:12px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface-2);
  color:var(--vci-text);
  font-size:13px; font-weight:600;
  cursor:pointer;
  transition:all .22s var(--vci-ease);
}
.vci-hbtn:hover{ border-color:var(--vci-border-strong); transform:translateY(-2px); background:var(--vci-surface); }
.vci-hbtn--primary{
  background:linear-gradient(140deg, var(--vci-accent), var(--vci-accent-2));
  border-color:transparent; color:#fff;
  box-shadow:0 8px 22px -10px var(--vci-accent);
}
.vci-hbtn--primary:hover{ box-shadow:0 12px 28px -10px var(--vci-accent); }
.vci-hbtn__icon{ font-size:15px; }

.vci-iconbtn{
  width:38px; height:38px;
  display:grid; place-items:center;
  border-radius:11px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface-2);
  color:var(--vci-text);
  cursor:pointer;
  font-size:15px;
  transition:all .2s var(--vci-ease);
}
.vci-iconbtn:hover{ border-color:var(--vci-accent); color:var(--vci-accent); transform:translateY(-2px); }
.vci-iconbtn--sm{ width:30px; height:30px; font-size:13px; border-radius:9px; }
.vci-iconbtn--danger:hover{ border-color:var(--vci-danger); color:var(--vci-danger); }

/* ==================================================================
   ۳) نوار ابزار
   ================================================================== */

.vci-toolbar{
  display:flex;
  align-items:center;
  gap:12px;
  flex-wrap:wrap;
  padding:12px 16px;
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  animation:vci-fade-down .5s .05s var(--vci-ease) both;
}

.vci-toolbar__search{
  position:relative;
  display:flex; align-items:center;
  flex:1 1 280px;
  min-width:220px;
  gap:6px;
}
.vci-toolbar__searchicon{ position:absolute; right:12px; font-size:14px; opacity:.6; pointer-events:none; }
.vci-toolbar__input{
  flex:1;
  padding:11px 40px 11px 12px;
  border-radius:12px;
  border:1px solid var(--vci-border);
  background:var(--vci-bg-soft);
  color:var(--vci-text);
  font-size:14px;
  transition:all .2s var(--vci-ease);
}
.vci-toolbar__input:focus{ outline:none; border-color:var(--vci-accent); box-shadow:0 0 0 3px var(--vci-accent-soft); }
.vci-toolbar__scope{
  padding:11px 10px;
  border-radius:12px;
  border:1px solid var(--vci-border);
  background:var(--vci-bg-soft);
  color:var(--vci-text-dim);
  font-size:13px;
  cursor:pointer;
}

.vci-toolbar__group{ display:flex; align-items:center; gap:8px; }
.vci-field-inline{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--vci-text-dim); }
.vci-field-inline select{
  padding:9px 10px;
  border-radius:10px;
  border:1px solid var(--vci-border);
  background:var(--vci-bg-soft);
  color:var(--vci-text);
  font-size:13px;
  cursor:pointer;
}

.vci-toolbar__views{
  display:flex;
  padding:4px;
  gap:2px;
  border-radius:12px;
  background:var(--vci-surface-2);
  border:1px solid var(--vci-border);
}
.vci-viewbtn{
  width:34px; height:34px;
  display:grid; place-items:center;
  border:none;
  border-radius:9px;
  background:transparent;
  color:var(--vci-text-dim);
  cursor:pointer;
  font-size:15px;
  transition:all .2s var(--vci-ease);
}
.vci-viewbtn:hover{ color:var(--vci-text); background:var(--vci-surface); }
.vci-viewbtn.is-active{ background:var(--vci-accent); color:#fff; box-shadow:0 4px 12px -4px var(--vci-accent); }

.vci-toolbar__meta{ display:flex; align-items:center; gap:10px; margin-right:auto; }
.vci-toolbar__count{ font-size:12px; color:var(--vci-text-faint); white-space:nowrap; }
.vci-textbtn{
  display:inline-flex; align-items:center; gap:6px;
  padding:8px 12px;
  border-radius:10px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface-2);
  color:var(--vci-text-dim);
  font-size:13px;
  cursor:pointer;
  transition:all .2s var(--vci-ease);
}
.vci-textbtn:hover, .vci-textbtn[aria-pressed="true"]{ border-color:var(--vci-accent); color:var(--vci-accent); }
.vci-badge{
  display:inline-grid; place-items:center;
  min-width:18px; height:18px; padding:0 5px;
  border-radius:9px;
  background:var(--vci-accent); color:#fff;
  font-size:11px; font-weight:700;
}

/* ==================================================================
   ۴) پنل فیلتر
   ================================================================== */

.vci-filter{
  padding:16px;
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  animation:vci-fade-down .35s var(--vci-ease) both;
}
.vci-filter__head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; font-weight:700; }
.vci-filter__rules{ display:flex; flex-direction:column; gap:8px; }
.vci-rule{ display:grid; grid-template-columns:1.4fr 1fr 1fr auto; gap:8px; align-items:center; }
.vci-rule select, .vci-rule input{
  padding:9px 10px;
  border-radius:10px;
  border:1px solid var(--vci-border);
  background:var(--vci-bg-soft);
  color:var(--vci-text);
  font-size:13px;
}
.vci-filter__actions{ display:flex; gap:8px; margin-top:12px; }

.vci-toggle{ display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--vci-text-dim); cursor:pointer; }

/* ==================================================================
   ۵) سایدبار
   ================================================================== */

.vci-sidebar{
  position:sticky; top:12px;
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  overflow:hidden;
  animation:vci-fade-right .5s var(--vci-ease) both;
}
.vci-sidebar.is-collapsed{ display:none; }
.vci-sidebar__scroll{ max-height:calc(100vh - 140px); overflow-y:auto; padding:10px; }

.vci-buckets{ display:flex; flex-direction:column; gap:2px; }
.vci-bucket{
  display:flex; align-items:center; gap:10px;
  width:100%;
  padding:9px 11px;
  border:none; border-radius:11px;
  background:transparent;
  color:var(--vci-text-dim);
  font-size:13px;
  cursor:pointer;
  text-align:right;
  transition:all .18s var(--vci-ease);
}
.vci-bucket:hover{ background:var(--vci-surface-2); color:var(--vci-text); }
.vci-bucket.is-active{ background:var(--vci-accent-soft); color:var(--vci-accent); font-weight:700; }
.vci-bucket__icon{ font-size:15px; width:20px; text-align:center; }
.vci-bucket__label{ flex:1; }
.vci-bucket__count{
  font-size:11px; font-weight:700;
  padding:2px 8px; border-radius:9px;
  background:var(--vci-surface-2); color:var(--vci-text-faint);
}
.vci-bucket.is-active .vci-bucket__count{ background:var(--vci-accent); color:#fff; }

.vci-bucketgroup{ margin-top:14px; }
.vci-bucketgroup__title{
  margin:0 0 6px; padding:0 11px;
  font-size:11px; font-weight:700;
  text-transform:uppercase; letter-spacing:.5px;
  color:var(--vci-text-faint);
}

.vci-sidebar__section{ margin-top:18px; padding-top:14px; border-top:1px solid var(--vci-border); }
.vci-sidebar__sectionhead{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.vci-sidebar__sectionhead h3{ margin:0; font-size:13px; font-weight:700; }
.vci-sidebar__empty{ font-size:12px; padding:6px 11px; }

.vci-segment{
  display:flex; align-items:center; gap:9px;
  width:100%; padding:8px 11px;
  border:none; border-radius:10px;
  background:transparent; color:var(--vci-text-dim);
  font-size:13px; cursor:pointer; text-align:right;
  transition:all .18s var(--vci-ease);
}
.vci-segment:hover{ background:var(--vci-surface-2); color:var(--vci-text); }
.vci-segment.is-active{ background:var(--vci-accent-soft); color:var(--vci-accent); font-weight:700; }
.vci-segment__label{ flex:1; }
.vci-segment__count{ font-size:11px; color:var(--vci-text-faint); }

.vci-meter{ margin:8px 11px; }
.vci-meter__bar{ height:7px; border-radius:6px; background:var(--vci-surface-2); overflow:hidden; }
.vci-meter__bar span{ display:block; height:100%; border-radius:6px; background:linear-gradient(90deg, var(--vci-accent), var(--vci-accent-2)); transition:width .6s var(--vci-ease); }
.vci-meter__label{ display:block; margin-top:6px; font-size:11px; color:var(--vci-text-dim); }

.vci-statlist{ list-style:none; margin:10px 0 0; padding:0 11px; display:flex; flex-direction:column; gap:6px; }
.vci-statlist li{ display:flex; justify-content:space-between; font-size:12px; color:var(--vci-text-dim); }
.vci-statlist strong{ color:var(--vci-text); }

/* ==================================================================
   ۶) دکمه‌ها و ورودی‌های عمومی
   ================================================================== */

.vci-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  padding:10px 16px;
  border-radius:12px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface-2);
  color:var(--vci-text);
  font-size:13px; font-weight:600;
  cursor:pointer;
  transition:all .2s var(--vci-ease);
}
.vci-btn:hover{ transform:translateY(-2px); border-color:var(--vci-border-strong); }
.vci-btn:disabled{ opacity:.5; cursor:not-allowed; transform:none; }
.vci-btn--sm{ padding:7px 12px; font-size:12px; border-radius:10px; }
.vci-btn--primary{ background:linear-gradient(140deg, var(--vci-accent), var(--vci-accent-2)); border-color:transparent; color:#fff; box-shadow:0 8px 22px -10px var(--vci-accent); }
.vci-btn--ghost{ background:transparent; }
.vci-btn--danger{ background:var(--vci-danger); border-color:transparent; color:#fff; }

.vci-input{
  width:100%;
  padding:11px 13px;
  border-radius:12px;
  border:1px solid var(--vci-border);
  background:var(--vci-bg-soft);
  color:var(--vci-text);
  font-size:14px;
  font-family:inherit;
  transition:all .2s var(--vci-ease);
}
.vci-input:focus{ outline:none; border-color:var(--vci-accent); box-shadow:0 0 0 3px var(--vci-accent-soft); }
.vci-input--area{ resize:vertical; min-height:80px; line-height:1.7; }
.vci-input--inline{ padding:8px 10px; font-size:13px; }

.vci-check{ display:inline-flex; align-items:center; gap:7px; cursor:pointer; font-size:13px; color:var(--vci-text-dim); }
.vci-check input{ width:17px; height:17px; accent-color:var(--vci-accent); cursor:pointer; }
.vci-check--inline{ padding:8px 0; }

.vci-muted{ color:var(--vci-text-faint); font-size:12px; }
.vci-req{ color:var(--vci-danger); }

/* ==================================================================
   ۷) pills و chips
   ================================================================== */

.vci-pill{
  display:inline-flex; align-items:center;
  padding:3px 10px;
  border-radius:20px;
  font-size:11px; font-weight:700;
  background:var(--vci-surface-2); color:var(--vci-text-dim);
  white-space:nowrap;
}
.vci-pill--active{ background:rgba(61,220,151,.15); color:var(--vci-ok); }
.vci-pill--inactive{ background:rgba(154,166,196,.15); color:var(--vci-text-dim); }
.vci-pill--blocked{ background:rgba(255,107,129,.15); color:var(--vci-danger); }
.vci-pill--pending{ background:rgba(255,193,77,.15); color:var(--vci-warn); }
.vci-pill--churned{ background:rgba(255,107,129,.12); color:var(--vci-danger); }
.vci-pill--lead{ background:rgba(124,140,255,.15); color:var(--vci-accent); }
.vci-pill--acct-vip{ background:linear-gradient(140deg, rgba(245,158,11,.2), rgba(251,191,36,.2)); color:var(--vci-warn); }
.vci-pill--acct-corporate{ background:rgba(59,130,246,.15); color:#60a5fa; }
.vci-pill--tier-gold{ background:rgba(245,158,11,.18); color:var(--vci-warn); }
.vci-pill--tier-platinum, .vci-pill--tier-diamond{ background:rgba(124,140,255,.18); color:var(--vci-accent); }
.vci-pill--fav{ background:rgba(251,191,36,.18); color:var(--vci-warn); }
.vci-pill--ok{ background:rgba(61,220,151,.15); color:var(--vci-ok); }
.vci-pill--warn{ background:rgba(255,193,77,.15); color:var(--vci-warn); }
.vci-pill--err{ background:rgba(255,107,129,.15); color:var(--vci-danger); }

.vci-chips{ display:inline-flex; gap:4px; flex-wrap:wrap; }
.vci-chip{ padding:2px 9px; border-radius:14px; font-size:11px; background:var(--vci-accent-soft); color:var(--vci-accent); }

/* ==================================================================
   ۸) نمای جدول
   ================================================================== */

.vci-tablewrap{
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  overflow:auto;
  animation:vci-fade-up .45s var(--vci-ease) both;
}
.vci-table{ width:100%; border-collapse:collapse; }
.vci-th{
  position:sticky; top:0; z-index:2;
  padding:13px 14px;
  text-align:right;
  font-size:11px; font-weight:700;
  text-transform:uppercase; letter-spacing:.4px;
  color:var(--vci-text-faint);
  background:var(--vci-bg-soft);
  border-bottom:1px solid var(--vci-border);
  white-space:nowrap;
  user-select:none;
}
.vci-th[role="button"]{ cursor:pointer; }
.vci-th[role="button"]:hover{ color:var(--vci-accent); }
.vci-th.is-left{ text-align:left; }
.vci-th.is-center{ text-align:center; }
.vci-th__arrow{ color:var(--vci-accent); margin-right:4px; }

.vci-row{ transition:background .18s var(--vci-ease); animation:vci-fade-up .4s var(--vci-ease) both; }
.vci-row:hover{ background:var(--vci-surface-2); }
.vci-row.is-selected{ background:var(--vci-accent-soft); }
.vci-row.is-trashed{ opacity:.5; }
.vci-td{
  padding:11px 14px;
  font-size:13px;
  border-bottom:1px solid var(--vci-border);
  vertical-align:middle;
  white-space:nowrap;
}
.vci-td.is-left{ text-align:left; }
.vci-td.is-center{ text-align:center; }

.vci-cell-avatar{ display:flex; align-items:center; gap:8px; }
.vci-cell-avatar__btn{ border:none; background:none; padding:0; cursor:pointer; line-height:0; }

.vci-cell-name{
  display:flex; flex-direction:column; align-items:flex-start; gap:2px;
  border:none; background:none; padding:0; cursor:pointer; text-align:right;
}
.vci-cell-name__text{ font-weight:700; color:var(--vci-text); font-size:13px; }
.vci-cell-name:hover .vci-cell-name__text{ color:var(--vci-accent); }
.vci-cell-name__sub{ font-size:11px; color:var(--vci-text-faint); }
.vci-cell-name__star{ color:var(--vci-warn); font-size:12px; }
.vci-cell-name__blocked{ font-size:11px; }

.vci-cell-link{ color:var(--vci-text-dim); text-decoration:none; }
.vci-cell-link:hover{ color:var(--vci-accent); }

.vci-money{ font-variant-numeric:tabular-nums; font-weight:600; }
.vci-money--neg{ color:var(--vci-danger); }
.vci-money--pos{ color:var(--vci-ok); }
.vci-money--zero{ color:var(--vci-text-faint); }
.vci-num{ font-variant-numeric:tabular-nums; }

.vci-rowactions{ display:flex; gap:4px; opacity:0; transition:opacity .2s var(--vci-ease); }
.vci-row:hover .vci-rowactions{ opacity:1; }

/* ==================================================================
   ۹) نمای کارت
   ================================================================== */

.vci-cards{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
  gap:var(--vci-gap);
}
.vci-card{
  position:relative;
  display:flex; flex-direction:column;
  padding:18px;
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  overflow:hidden;
  transition:all .3s var(--vci-ease);
  animation:vci-fade-up .45s var(--vci-ease) both;
}
.vci-card::before{
  content:"";
  position:absolute; inset:0 0 auto 0; height:3px;
  background:linear-gradient(90deg, var(--vci-accent), var(--vci-accent-2));
  transform:scaleX(0); transform-origin:right;
  transition:transform .4s var(--vci-ease);
}
.vci-card:hover{ transform:translateY(-4px); box-shadow:var(--vci-shadow); border-color:var(--vci-border-strong); }
.vci-card:hover::before{ transform:scaleX(1); }
.vci-card.is-selected{ border-color:var(--vci-accent); box-shadow:var(--vci-glow); }
.vci-card.is-favorite{ border-color:rgba(251,191,36,.4); }

.vci-card__top{ display:flex; align-items:center; gap:10px; }
.vci-card__top .vci-check{ margin-left:auto; }
.vci-card__avatar{ border:none; background:none; padding:0; cursor:pointer; line-height:0; }
.vci-card__star{ border:none; background:none; cursor:pointer; font-size:18px; color:var(--vci-text-faint); transition:all .2s var(--vci-ease); }
.vci-card__star:hover{ transform:scale(1.2); color:var(--vci-warn); }

.vci-card__body{ margin-top:14px; flex:1; }
.vci-card__name{ border:none; background:none; padding:0; cursor:pointer; font-size:16px; font-weight:800; color:var(--vci-text); text-align:right; }
.vci-card__name:hover{ color:var(--vci-accent); }
.vci-card__preview{ margin:4px 0 10px; font-size:12px; color:var(--vci-text-dim); }
.vci-card__pills{ display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px; }

.vci-card__stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:14px 0; padding:12px 0; border-top:1px solid var(--vci-border); border-bottom:1px solid var(--vci-border); }
.vci-stat{ display:flex; flex-direction:column; gap:3px; }
.vci-stat__label{ font-size:10px; color:var(--vci-text-faint); }
.vci-stat__value{ font-size:13px; font-weight:700; color:var(--vci-text); }
.vci-stat__value.is-neg{ color:var(--vci-danger); }

.vci-card__meter{ height:4px; border-radius:4px; background:var(--vci-surface-2); overflow:hidden; margin-bottom:14px; }
.vci-card__meter span{ display:block; height:100%; background:linear-gradient(90deg, var(--vci-accent), var(--vci-accent-2)); transition:width .6s var(--vci-ease); }

.vci-card__actions{ display:flex; gap:8px; }

/* ==================================================================
   ۱۰) نمای لیست / فشرده
   ================================================================== */

.vci-list{ display:flex; flex-direction:column; gap:8px; }
.vci-listrow{
  display:flex; align-items:center; gap:12px;
  padding:12px 16px;
  border-radius:14px;
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  transition:all .2s var(--vci-ease);
  animation:vci-fade-up .4s var(--vci-ease) both;
}
.vci-listrow:hover{ transform:translateX(-4px); border-color:var(--vci-border-strong); }
.vci-listrow.is-selected{ border-color:var(--vci-accent); background:var(--vci-accent-soft); }
.vci-listrow__avatar{ border:none; background:none; padding:0; cursor:pointer; line-height:0; }
.vci-listrow__main{ flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
.vci-listrow__name{ border:none; background:none; padding:0; cursor:pointer; font-size:14px; font-weight:700; color:var(--vci-text); text-align:right; }
.vci-listrow__name:hover{ color:var(--vci-accent); }
.vci-listrow__sub{ font-size:12px; color:var(--vci-text-dim); }
.vci-star{ color:var(--vci-warn); }
.vci-listrow__pills{ display:flex; gap:5px; }
.vci-listrow__balance{ font-weight:700; font-variant-numeric:tabular-nums; min-width:110px; text-align:left; }
.vci-listrow__balance.is-neg{ color:var(--vci-danger); }
.vci-listrow__actions{ display:flex; gap:4px; }

.vci-compact{ display:flex; flex-direction:column; gap:3px; }
.vci-compactrow{
  display:grid;
  grid-template-columns:auto auto 1.6fr 1fr 1fr auto;
  align-items:center; gap:12px;
  padding:7px 14px;
  border-radius:10px;
  font-size:13px;
  transition:background .15s var(--vci-ease);
}
.vci-compactrow:hover{ background:var(--vci-surface-2); }
.vci-compactrow.is-selected{ background:var(--vci-accent-soft); }
.vci-compactrow__avatar{ border:none; background:none; padding:0; cursor:pointer; line-height:0; }
.vci-compactrow__name{ border:none; background:none; padding:0; cursor:pointer; font-weight:600; color:var(--vci-text); text-align:right; }
.vci-compactrow__name:hover{ color:var(--vci-accent); }
.vci-compactrow__mobile, .vci-compactrow__city{ color:var(--vci-text-dim); font-size:12px; }
.vci-compactrow__balance{ text-align:left; font-variant-numeric:tabular-nums; font-weight:600; }

/* ==================================================================
   ۱۱) نمای برد
   ================================================================== */

.vci-board{ display:flex; gap:var(--vci-gap); overflow-x:auto; padding-bottom:10px; align-items:flex-start; }
.vci-boardcol{
  flex:0 0 300px;
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  animation:vci-fade-up .45s var(--vci-ease) both;
}
.vci-boardcol__head{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--vci-border); }
.vci-boardcol__head h3{ margin:0; font-size:14px; font-weight:700; }
.vci-boardcol__count{ font-size:12px; padding:2px 9px; border-radius:10px; background:var(--vci-surface-2); color:var(--vci-text-dim); }
.vci-boardcol__body{ padding:12px; display:flex; flex-direction:column; gap:12px; max-height:70vh; overflow-y:auto; }
.vci-boardcol__body .vci-card{ animation:none; }

/* ==================================================================
   ۱۲) نمای نقشه
   ================================================================== */

.vci-mapview{ display:grid; grid-template-columns:320px minmax(0,1fr); gap:var(--vci-gap); }
.vci-mapview__list{ display:flex; flex-direction:column; gap:6px; max-height:70vh; overflow-y:auto; }
.vci-mapitem{
  display:flex; align-items:center; gap:10px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface);
  cursor:pointer; text-align:right;
  transition:all .2s var(--vci-ease);
}
.vci-mapitem:hover{ border-color:var(--vci-accent); transform:translateX(-3px); }
.vci-mapitem__name{ font-weight:700; font-size:13px; color:var(--vci-text); }
.vci-mapitem__addr{ font-size:11px; color:var(--vci-text-dim); }
.vci-mapview__map{
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  min-height:420px;
  display:grid; place-items:center;
  overflow:hidden;
}
.vci-mapview__placeholder{ text-align:center; color:var(--vci-text-dim); }
.vci-mapview__placeholder span{ font-size:42px; }
.vci-mapframe{ width:100%; height:100%; min-height:420px; border:none; }

/* ==================================================================
   ۱۳) نمای تایم‌لاین
   ================================================================== */

.vci-timeline{ position:relative; display:flex; flex-direction:column; gap:4px; padding-right:8px; }
.vci-timeline::before{ content:""; position:absolute; right:27px; top:8px; bottom:8px; width:2px; background:var(--vci-border); }
.vci-tlitem{
  position:relative;
  display:flex; align-items:center; gap:14px;
  padding:10px 12px;
  border-radius:12px;
  transition:background .2s var(--vci-ease);
  animation:vci-fade-up .4s var(--vci-ease) both;
}
.vci-tlitem:hover{ background:var(--vci-surface-2); }
.vci-tlitem__dot{ position:absolute; right:-1px; width:12px; height:12px; border-radius:50%; background:var(--vci-accent); box-shadow:0 0 0 4px var(--vci-bg); }
.vci-tlitem__avatar{ border:none; background:none; padding:0; cursor:pointer; line-height:0; }
.vci-tlitem__body{ flex:1; display:flex; flex-direction:column; gap:2px; }
.vci-tlitem__name{ border:none; background:none; padding:0; cursor:pointer; font-weight:700; font-size:14px; color:var(--vci-text); text-align:right; }
.vci-tlitem__name:hover{ color:var(--vci-accent); }
.vci-tlitem__meta{ font-size:12px; color:var(--vci-text-dim); }
.vci-tlitem__time{ font-size:11px; color:var(--vci-text-faint); }

/* ==================================================================
   ۱۴) نوار گروهی + صفحه‌بندی
   ================================================================== */

.vci-bulkbar{
  position:sticky; bottom:16px; z-index:15;
  display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
  padding:12px 18px;
  margin-bottom:12px;
  border-radius:14px;
  background:var(--vci-bg-soft);
  border:1px solid var(--vci-accent);
  box-shadow:var(--vci-glow);
  animation:vci-fade-up .3s var(--vci-ease-bounce) both;
}
.vci-bulkbar__count{ font-weight:700; color:var(--vci-accent); }
.vci-bulkbar__actions{ display:flex; gap:8px; flex-wrap:wrap; }

.vci-pager{ display:flex; align-items:center; justify-content:center; gap:4px; margin-top:18px; }
.vci-pager__btn{
  min-width:36px; height:36px; padding:0 10px;
  border-radius:10px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface);
  color:var(--vci-text-dim);
  cursor:pointer; font-size:13px;
  transition:all .2s var(--vci-ease);
}
.vci-pager__btn:hover:not(:disabled){ border-color:var(--vci-accent); color:var(--vci-accent); }
.vci-pager__btn.is-active{ background:var(--vci-accent); border-color:transparent; color:#fff; }
.vci-pager__btn:disabled{ opacity:.4; cursor:not-allowed; }
.vci-pager__gap{ padding:0 4px; color:var(--vci-text-faint); }

/* ==================================================================
   ۱۵) وضعیت خالی / بارگذاری / خطا
   ================================================================== */

.vci-empty{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:10px; padding:70px 20px; text-align:center;
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px dashed var(--vci-border-strong);
  animation:vci-fade-up .5s var(--vci-ease) both;
}
.vci-empty__icon{ font-size:54px; opacity:.85; animation:vci-float 3.5s ease-in-out infinite; }
.vci-empty h3{ margin:0; font-size:18px; font-weight:800; }
.vci-empty p{ margin:0; color:var(--vci-text-dim); font-size:14px; max-width:420px; }
.vci-empty__actions{ display:flex; gap:10px; margin-top:8px; }
.vci-empty--error .vci-empty__icon{ animation:none; }

.vci-skeletons{ display:flex; flex-direction:column; gap:10px; }
.vci-skeleton{
  height:58px; border-radius:14px;
  background:linear-gradient(100deg, var(--vci-surface) 30%, var(--vci-surface-2) 50%, var(--vci-surface) 70%);
  background-size:220% 100%;
  animation:vci-shimmer 1.4s infinite;
}

/* ==================================================================
   ۱۶) پروفایل
   ================================================================== */

.vci-profile-host{ position:relative; }
.vci-profile{
  position:fixed; inset:0; z-index:120;
  overflow-y:auto;
  background:var(--vci-bg);
  animation:vci-slide-up .4s var(--vci-ease) both;
}

.vci-profile__hero{
  position:relative;
  padding:26px 32px 22px;
  background:var(--vci-surface);
  border-bottom:1px solid var(--vci-border);
}
.vci-profile__heroart{
  position:absolute; inset:0;
  background:
    radial-gradient(700px 300px at 90% 0%, var(--vci-accent-soft), transparent 60%),
    radial-gradient(500px 260px at 5% 100%, rgba(94,234,212,.1), transparent 55%);
  pointer-events:none;
}
.vci-profile__back{
  position:relative;
  border:none; background:var(--vci-surface-2);
  color:var(--vci-text-dim);
  padding:8px 14px; border-radius:10px;
  cursor:pointer; font-size:13px;
  transition:all .2s var(--vci-ease);
}
.vci-profile__back:hover{ color:var(--vci-accent); transform:translateX(4px); }

.vci-profile__id{ position:relative; display:flex; align-items:center; gap:20px; margin-top:16px; flex-wrap:wrap; }
.vci-profile__avatarwrap{ position:relative; }
.vci-profile__name{ margin:0; font-size:26px; font-weight:800; letter-spacing:-.4px; }
.vci-profile__preview{ margin:5px 0 10px; color:var(--vci-text-dim); font-size:14px; }
.vci-profile__pills{ display:flex; gap:6px; flex-wrap:wrap; }

.vci-profile__quick{ position:relative; display:flex; gap:8px; margin-right:auto; flex-wrap:wrap; }

.vci-profile__kpis{ position:relative; display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:12px; margin-top:22px; }
.vci-kpi{
  padding:14px 16px;
  border-radius:14px;
  background:var(--vci-surface-2);
  border:1px solid var(--vci-border);
  display:flex; flex-direction:column; gap:4px;
}
.vci-kpi span{ font-size:11px; color:var(--vci-text-faint); }
.vci-kpi strong{ font-size:17px; font-weight:800; }
.vci-kpi strong.is-neg{ color:var(--vci-danger); }

.vci-profile__tabs{
  position:sticky; top:0; z-index:5;
  display:flex; gap:4px; overflow-x:auto;
  padding:10px 32px;
  background:var(--vci-bg-soft);
  border-bottom:1px solid var(--vci-border);
}
.vci-ptab{
  display:inline-flex; align-items:center; gap:6px;
  padding:9px 14px;
  border:none; border-radius:11px;
  background:transparent; color:var(--vci-text-dim);
  font-size:13px; font-weight:600;
  cursor:pointer; white-space:nowrap;
  transition:all .2s var(--vci-ease);
}
.vci-ptab:hover{ background:var(--vci-surface-2); color:var(--vci-text); }
.vci-ptab.is-active{ background:var(--vci-accent); color:#fff; box-shadow:0 6px 16px -8px var(--vci-accent); }

.vci-profile__content{ padding:24px 32px 80px; max-width:1100px; margin:0 auto; }

.vci-psection{
  padding:20px 22px;
  border-radius:var(--vci-radius);
  background:var(--vci-surface);
  border:1px solid var(--vci-border);
  animation:vci-fade-up .4s var(--vci-ease) both;
}
.vci-psection__head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.vci-psection__head h3{ margin:0; font-size:16px; font-weight:800; }
.vci-psection__subhead{ margin:18px 0 10px; font-size:14px; font-weight:700; }

.vci-fieldgrid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px,1fr)); gap:12px; }
.vci-field{
  display:flex; flex-direction:column; gap:5px;
  padding:11px 13px;
  border-radius:12px;
  background:var(--vci-surface-2);
  border:1px solid transparent;
  transition:all .2s var(--vci-ease);
}
.vci-field:hover{ border-color:var(--vci-border-strong); }
.vci-field.is-empty{ background:transparent; border:1px dashed var(--vci-border); }
.vci-field__label{ font-size:11px; color:var(--vci-text-faint); font-weight:600; }
.vci-field__value{
  border:none; background:none; padding:0;
  cursor:pointer; text-align:right;
  font-size:14px; font-weight:600; color:var(--vci-text);
  transition:color .2s var(--vci-ease);
}
.vci-field__value:hover{ color:var(--vci-accent); }
.vci-field__placeholder{ color:var(--vci-text-faint); font-weight:400; font-size:13px; }
.vci-field__editor{ margin-top:6px; }

.vci-rating{ display:flex; gap:2px; }
.vci-starbtn{ border:none; background:none; cursor:pointer; font-size:20px; color:var(--vci-border-strong); transition:all .15s var(--vci-ease); }
.vci-starbtn.is-on{ color:var(--vci-warn); }
.vci-starbtn:hover{ transform:scale(1.15); }

.vci-kv{ display:flex; flex-direction:column; gap:8px; }
.vci-kvrow{ display:grid; grid-template-columns:1fr 1fr auto; gap:6px; }

.vci-overviewgrid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:12px; }
.vci-overviewcell{
  display:flex; flex-direction:column; gap:4px;
  padding:14px 16px;
  border-radius:12px;
  background:var(--vci-surface-2);
}
.vci-overviewcell span{ font-size:11px; color:var(--vci-text-faint); }
.vci-overviewcell strong{ font-size:15px; font-weight:700; }

.vci-outreach{ display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
.vci-commlist{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
.vci-comm{ display:flex; gap:12px; padding:12px 14px; border-radius:12px; background:var(--vci-surface-2); }
.vci-comm__icon{ font-size:20px; }
.vci-comm__body{ flex:1; }
.vci-comm__body strong{ font-size:13px; }
.vci-comm__body p{ margin:4px 0; font-size:13px; color:var(--vci-text-dim); }
.vci-comm__meta{ font-size:11px; color:var(--vci-text-faint); }

.vci-activitylist{ list-style:none; margin:0; padding:0; }
.vci-activity{ display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--vci-border); }
.vci-activity__dot{ width:8px; height:8px; border-radius:50%; background:var(--vci-accent); flex-shrink:0; }
.vci-activity__label{ flex:1; font-size:13px; }
.vci-activity__time{ font-size:11px; color:var(--vci-text-faint); }

/* ==================================================================
   ۱۷) داشبورد
   ================================================================== */

.vci-dashboard{ display:flex; flex-direction:column; gap:20px; }
.vci-dashgrid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:12px; }
.vci-dashcard{
  display:flex; flex-direction:column; gap:6px;
  padding:18px;
  border-radius:14px;
  background:var(--vci-surface-2);
  border:1px solid var(--vci-border);
  animation:vci-fade-up .4s var(--vci-ease) both;
}
.vci-dashcard span{ font-size:12px; color:var(--vci-text-dim); }
.vci-dashcard strong{ font-size:20px; font-weight:800; }
.vci-dashcols{ display:grid; grid-template-columns:repeat(auto-fit, minmax(280px,1fr)); gap:16px; }
.vci-dashcol{ padding:18px; border-radius:14px; background:var(--vci-surface); border:1px solid var(--vci-border); }
.vci-dashcol h4{ margin:0 0 14px; font-size:14px; font-weight:700; }
.vci-bar{ display:grid; grid-template-columns:90px 1fr auto; align-items:center; gap:10px; margin-bottom:10px; }
.vci-bar__label{ font-size:12px; color:var(--vci-text-dim); }
.vci-bar__track{ height:9px; border-radius:6px; background:var(--vci-surface-2); overflow:hidden; }
.vci-bar__track span{ display:block; height:100%; border-radius:6px; background:linear-gradient(90deg, var(--vci-accent), var(--vci-accent-2)); transition:width .7s var(--vci-ease); }
.vci-bar__value{ font-size:12px; font-weight:700; min-width:30px; text-align:left; }

/* ==================================================================
   ۱۸) پالت فرمان
   ================================================================== */

.vci-overlay-host{ position:relative; }
.vci-cmdk{
  position:fixed; inset:0; z-index:200;
  display:grid; place-items:start center;
  padding-top:12vh;
  background:rgba(4,8,20,.6);
  backdrop-filter:blur(6px);
  animation:vci-fade .2s var(--vci-ease) both;
}
.vci-cmdk__panel{
  width:min(560px, 92vw);
  border-radius:18px;
  background:var(--vci-bg-soft);
  border:1px solid var(--vci-border-strong);
  box-shadow:var(--vci-shadow);
  overflow:hidden;
  animation:vci-scale-in .28s var(--vci-ease-bounce) both;
}
.vci-cmdk__input{
  width:100%; padding:18px 20px;
  border:none; border-bottom:1px solid var(--vci-border);
  background:transparent; color:var(--vci-text);
  font-size:16px;
}
.vci-cmdk__input:focus{ outline:none; }
.vci-cmdk__list{ max-height:50vh; overflow-y:auto; padding:8px; }
.vci-cmdk__item{
  display:flex; align-items:center; gap:12px;
  width:100%; padding:12px 14px;
  border:none; border-radius:12px;
  background:transparent; color:var(--vci-text);
  font-size:14px; cursor:pointer; text-align:right;
  transition:background .15s var(--vci-ease);
}
.vci-cmdk__item:hover, .vci-cmdk__item.is-active{ background:var(--vci-accent-soft); }
.vci-cmdk__icon{ font-size:17px; }
.vci-cmdk__label{ flex:1; }
.vci-cmdk__hint{ font-size:11px; color:var(--vci-text-faint); }
.vci-cmdk__empty{ padding:20px; text-align:center; }

/* ==================================================================
   ۱۹) منوی ردیف
   ================================================================== */

.vci-menu{
  min-width:210px;
  padding:6px;
  border-radius:14px;
  background:var(--vci-bg-soft);
  border:1px solid var(--vci-border-strong);
  box-shadow:var(--vci-shadow);
  animation:vci-scale-in .18s var(--vci-ease-bounce) both;
}
.vci-menu__item{
  display:flex; align-items:center; gap:10px;
  width:100%; padding:10px 12px;
  border:none; border-radius:10px;
  background:transparent; color:var(--vci-text);
  font-size:13px; cursor:pointer; text-align:right;
  transition:background .15s var(--vci-ease);
}
.vci-menu__item:hover{ background:var(--vci-surface-2); }
.vci-menu__item--danger{ color:var(--vci-danger); }
.vci-menu__item--danger:hover{ background:rgba(255,107,129,.12); }

/* ==================================================================
   ۲۰) FAB
   ================================================================== */

.vci-fab{
  position:fixed; bottom:26px; left:26px; z-index:40;
  width:58px; height:58px;
  border-radius:50%;
  border:none;
  background:linear-gradient(140deg, var(--vci-accent), var(--vci-accent-2));
  color:#fff; font-size:26px;
  cursor:pointer;
  box-shadow:0 14px 34px -10px var(--vci-accent);
  display:grid; place-items:center;
  transition:all .3s var(--vci-ease-bounce);
}
.vci-fab:hover{ transform:scale(1.1) rotate(90deg); box-shadow:0 18px 40px -10px var(--vci-accent); }

/* ==================================================================
   ۲۱) فرم‌ها و مودال‌ها
   ================================================================== */

.vci-form{ display:flex; flex-direction:column; gap:16px; }
.vci-form__subtitle{ margin:0; font-size:14px; font-weight:700; color:var(--vci-text); }
.vci-form__frequent{ padding:16px; border-radius:14px; background:var(--vci-accent-soft); }
.vci-formgrid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:12px; margin-top:12px; }

.vci-formfield{ display:flex; flex-direction:column; gap:6px; }
.vci-formfield__label{ font-size:12px; font-weight:600; color:var(--vci-text-dim); }
.vci-formfield__hint{ font-size:11px; color:var(--vci-text-faint); }
.vci-formfield__error{ font-size:11px; color:var(--vci-danger); min-height:0; }
.vci-formfield.has-error .vci-input{ border-color:var(--vci-danger); }

.vci-formsection{ border:1px solid var(--vci-border); border-radius:14px; overflow:hidden; }
.vci-formsection__head{
  display:flex; align-items:center; gap:10px;
  padding:14px 16px;
  cursor:pointer;
  background:var(--vci-surface-2);
  transition:background .2s var(--vci-ease);
}
.vci-formsection__head:hover{ background:var(--vci-surface); }
.vci-formsection__icon{ font-size:17px; }
.vci-formsection__title{ font-weight:700; font-size:14px; }
.vci-formsection__desc{ font-size:12px; color:var(--vci-text-faint); margin-right:auto; }
.vci-formsection__body{ max-height:0; overflow:hidden; transition:max-height .4s var(--vci-ease); }
.vci-formsection.is-open .vci-formsection__body{ max-height:2000px; padding:16px; }

.vci-campaignform, .vci-messageform, .vci-settingsform, .vci-segform{ display:flex; flex-direction:column; gap:14px; }
.vci-mergebar{ display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
.vci-mergebtn{
  padding:4px 10px; border-radius:9px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface-2); color:var(--vci-accent);
  font-size:11px; cursor:pointer; font-family:monospace;
  transition:all .15s var(--vci-ease);
}
.vci-mergebtn:hover{ background:var(--vci-accent); color:#fff; border-color:transparent; }
.vci-campaignpreview{ padding:14px; border-radius:12px; background:var(--vci-surface-2); }
.vci-campaignpreview p{ margin:6px 0 0; font-size:14px; line-height:1.7; }
.vci-messageform__to{ display:flex; gap:10px; align-items:center; font-weight:700; padding-bottom:8px; border-bottom:1px solid var(--vci-border); }

.vci-segments__list{ display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
.vci-segitem{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-radius:12px; background:var(--vci-surface-2); }
.vci-segitem__main{ display:flex; flex-direction:column; gap:3px; }
.vci-segitem__actions{ display:flex; gap:6px; }
.vci-segrules{ display:flex; flex-direction:column; gap:8px; }
.vci-segrule{ display:grid; grid-template-columns:1.4fr 1fr 1fr auto; gap:8px; align-items:center; }

.vci-import{ display:flex; flex-direction:column; gap:14px; }
.vci-dropzone{
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
  padding:34px; border-radius:14px;
  border:2px dashed var(--vci-border-strong);
  background:var(--vci-surface-2);
  cursor:pointer; text-align:center;
  color:var(--vci-text-dim);
  transition:all .2s var(--vci-ease);
}
.vci-dropzone:hover{ border-color:var(--vci-accent); background:var(--vci-accent-soft); }
.vci-dropzone__icon{ font-size:36px; }
.vci-import__actions{ display:flex; gap:10px; }
.vci-import__summary{ display:flex; gap:8px; margin-bottom:10px; }

.vci-mappicker{ display:flex; flex-direction:column; gap:14px; }
.vci-mappicker__search{ display:flex; gap:8px; }
.vci-mappicker__search .vci-input{ flex:1; }
.vci-mappicker__results{ display:flex; flex-direction:column; gap:6px; max-height:160px; overflow-y:auto; }
.vci-mapresult{
  padding:10px 12px; border-radius:10px;
  border:1px solid var(--vci-border);
  background:var(--vci-surface-2); color:var(--vci-text);
  font-size:12px; cursor:pointer; text-align:right;
  transition:all .15s var(--vci-ease);
}
.vci-mapresult:hover{ border-color:var(--vci-accent); }
.vci-mappicker__map{
  height:320px; border-radius:14px;
  background:var(--vci-surface-2);
  border:1px solid var(--vci-border);
  display:grid; place-items:center;
  overflow:hidden;
}
.vci-mappicker__hint{ color:var(--vci-text-faint); font-size:13px; }
.vci-mappicker__coords{ display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; }
.vci-mappicker__coords .vci-field-inline{ flex:1; flex-direction:column; align-items:stretch; gap:5px; }

/* ==================================================================
   ۲۲) انیمیشن‌ها
   ================================================================== */

@keyframes vci-fade{ from{ opacity:0 } to{ opacity:1 } }
@keyframes vci-fade-up{ from{ opacity:0; transform:translateY(14px) } to{ opacity:1; transform:translateY(0) } }
@keyframes vci-fade-down{ from{ opacity:0; transform:translateY(-14px) } to{ opacity:1; transform:translateY(0) } }
@keyframes vci-fade-right{ from{ opacity:0; transform:translateX(20px) } to{ opacity:1; transform:translateX(0) } }
@keyframes vci-slide-up{ from{ opacity:0; transform:translateY(40px) } to{ opacity:1; transform:translateY(0) } }
@keyframes vci-scale-in{ from{ opacity:0; transform:scale(.94) } to{ opacity:1; transform:scale(1) } }
@keyframes vci-shimmer{ 0%{ background-position:180% 0 } 100%{ background-position:-80% 0 } }
@keyframes vci-float{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-9px) } }

/* ==================================================================
   ۲۳) واکنش‌گرایی
   ================================================================== */

@media (max-width: 1080px){
  .vci-ws__layout{ grid-template-columns:1fr; }
  .vci-sidebar{ position:static; }
  .vci-sidebar__scroll{ max-height:none; overflow:visible; padding:10px 12px; display:flex; flex-direction:column; gap:10px; }
  /* به‌جای ستون عمودی بلند، باکت‌ها به چیپ‌های افقی تبدیل می‌شوند تا صفحه «زیر هم» نشود */
  .vci-buckets{ flex-direction:row; flex-wrap:wrap; gap:6px; }
  .vci-bucket{ flex:0 0 auto; width:auto; padding:8px 12px; border-radius:999px; }
  .vci-bucket__label{ white-space:nowrap; }
  .vci-bucketgroup{ display:contents; }
  .vci-bucketgroup__title{ width:100%; margin:8px 0 0; }
  .vci-sidebar__section{ display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
  .vci-sidebar__sectionhead{ width:100%; margin:0; }
  .vci-segment{ flex:0 0 auto; width:auto; padding:8px 12px; border-radius:999px; }
  .vci-segment__label{ white-space:nowrap; }
  .vci-sidebar__stats{ display:none; }
  .vci-mapview{ grid-template-columns:1fr; }
}

@media (max-width: 720px){
  .vci-ws{ padding:12px; }
  .vci-header{ padding:14px 16px; }
  .vci-header__title{ font-size:18px; }
  .vci-hbtn__label{ display:none; }
  .vci-hbtn{ padding:9px 11px; }
  .vci-toolbar{ flex-direction:column; align-items:stretch; }
  .vci-toolbar__meta{ margin-right:0; justify-content:space-between; }
  .vci-rule{ grid-template-columns:1fr 1fr; }
  .vci-segrule{ grid-template-columns:1fr 1fr; }
  .vci-compactrow{ grid-template-columns:auto auto 1fr auto; }
  .vci-compactrow__city{ display:none; }
  .vci-profile__content{ padding:16px 16px 70px; }
  .vci-profile__hero{ padding:18px 16px; }
  .vci-profile__tabs{ padding:8px 16px; }
  .vci-profile__quick{ margin-right:0; width:100%; }
  .vci-fieldgrid{ grid-template-columns:1fr; }
}

/* ==================================================================
   ۲۴) چاپ
   ================================================================== */

@media print{
  .vci-fab, .vci-profile-host, .vci-overlay-host, .vci-bulkbar, .vci-toolbar, .vci-sidebar, .vci-header__actions{ display:none !important; }
  .vci-ws{ padding:0; background:#fff; color:#000; }
  .vci-card, .vci-row{ break-inside:avoid; box-shadow:none; }
}

/* کاهش حرکت برای کاربران حساس */
@media (prefers-reduced-motion: reduce){
  .vci-ws *{ animation-duration:.01ms !important; transition-duration:.01ms !important; }
}

/* ---------- واکنش‌گرای تکمیلی: موبایل کوچک ---------- */
@media (max-width:560px){
  .vci-header__actions{flex-wrap:wrap}
  .vci-header__title{font-size:16px}
  .vci-rule,.vci-segrule{grid-template-columns:1fr}
  .vci-compactrow{grid-template-columns:auto 1fr auto}
  .vci-bulkbar{bottom:calc(88px + env(safe-area-inset-bottom,0px))}
  .vci-fab{bottom:calc(88px + env(safe-area-inset-bottom,0px));left:16px;width:52px;height:52px}
  .vci-cmdk{padding-top:6vh}
  .vci-profile__content{padding:14px 14px 90px}
}
`;

export default customerInfoCss;
