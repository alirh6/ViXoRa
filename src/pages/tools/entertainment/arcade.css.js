// ViXoRa Arcade — استایل هاب + استیج تمام‌صفحه + ابزار مشترک بازی‌ها (ag-)
export const arcadeCss = `
/* ================= هاب ================= */
.ag-hub{ --ag-ac:#22d3ee; max-width:1180px; margin:0 auto; padding:26px 22px 120px; color:#eef1fb; }
.ag-hero{ position:relative; overflow:hidden; border-radius:26px; padding:38px 30px;
  background:linear-gradient(135deg,rgba(34,211,238,.14),rgba(167,139,250,.14)),#0b1020;
  border:1px solid rgba(255,255,255,.1); margin-bottom:22px; }
.ag-hero::after{ content:"🎮"; position:absolute; inset-inline-end:18px; top:50%; transform:translateY(-50%) rotate(-12deg);
  font-size:110px; opacity:.16; pointer-events:none; }
.ag-hero__kicker{ display:inline-block; font-size:12px; font-weight:800; letter-spacing:1px; color:var(--ag-ac);
  background:rgba(34,211,238,.12); border:1px solid rgba(34,211,238,.3); padding:5px 14px; border-radius:999px; margin-bottom:12px; }
.ag-hero h1{ margin:0 0 8px; font-size:clamp(26px,4vw,42px); font-weight:900; }
.ag-hero p{ margin:0 0 18px; color:#9aa5c4; max-width:560px; line-height:2; }
.ag-stats{ display:flex; gap:10px; flex-wrap:wrap; }
.ag-stat{ display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.09); padding:9px 16px; border-radius:14px; font-size:13.5px; font-weight:700; }
.ag-stat b{ color:var(--ag-ac); font-size:17px; }

.ag-bar{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
.ag-search{ flex:1 1 220px; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:10px 14px; }
.ag-search input{ flex:1; background:none; border:0; outline:0; color:#fff; font:inherit; font-size:14px; min-width:0; }
.ag-search input::placeholder{ color:#6b7694; }
.ag-chips{ display:flex; gap:8px; flex-wrap:wrap; }
.ag-chip{ border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.04); color:#c4cddd;
  padding:9px 16px; border-radius:999px; font:inherit; font-size:13px; font-weight:700; cursor:pointer; transition:.2s; }
.ag-chip:hover{ border-color:var(--ag-ac); color:#fff; }
.ag-chip.is-on{ background:linear-gradient(90deg,#22d3ee,#a78bfa); color:#04101c; border-color:transparent; }

.ag-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(168px,1fr)); gap:14px; }
.ag-card{ position:relative; text-align:start; cursor:pointer; border-radius:20px; padding:20px 16px 16px;
  background:linear-gradient(165deg,hsl(var(--h,260) 45% 16%),hsl(var(--h,260) 55% 9%));
  border:1px solid hsl(var(--h,260) 80% 60% / .25); color:#eef1fb; font:inherit;
  transition:transform .22s cubic-bezier(.22,.9,.24,1), box-shadow .22s, border-color .22s; overflow:hidden; }
.ag-card::before{ content:""; position:absolute; inset:0;
  background:radial-gradient(220px 140px at 50% -20%, hsl(var(--h,260) 90% 62% / .28), transparent 70%); pointer-events:none; }
.ag-card:hover{ transform:translateY(-6px); border-color:hsl(var(--h,260) 90% 65% / .6);
  box-shadow:0 18px 44px -14px hsl(var(--h,260) 90% 55% / .45); }
.ag-card__icon{ font-size:44px; line-height:1; filter:drop-shadow(0 6px 14px hsl(var(--h,260) 90% 55% / .5)); position:relative; }
.ag-card__cat{ position:absolute; top:12px; inset-inline-end:12px; font-size:10.5px; font-weight:800;
  padding:3px 10px; border-radius:999px; background:hsl(var(--h,260) 90% 60% / .18);
  border:1px solid hsl(var(--h,260) 90% 65% / .4); color:hsl(var(--h,260) 95% 78%); }
.ag-card h3{ margin:12px 0 4px; font-size:15.5px; font-weight:800; position:relative; }
.ag-card p{ margin:0 0 12px; font-size:11.5px; color:#9aa5c4; line-height:1.8; min-height:42px; position:relative; }
.ag-card__meta{ display:flex; align-items:center; justify-content:space-between; gap:8px; position:relative; }
.ag-best{ font-size:11.5px; font-weight:800; color:#ffd166; background:rgba(255,209,102,.1);
  border:1px solid rgba(255,209,102,.3); padding:4px 10px; border-radius:999px; }
.ag-plays{ font-size:11px; color:#6b7694; }
.ag-card__play{ margin-top:10px; width:100%; border:0; cursor:pointer; border-radius:12px; padding:10px;
  font:inherit; font-size:13.5px; font-weight:800; color:#04101c;
  background:linear-gradient(90deg,hsl(var(--h,260) 90% 62%),hsl(calc(var(--h,260) + 40) 90% 62%));
  transition:filter .2s; position:relative; }
.ag-card__play:hover{ filter:brightness(1.1); }
.ag-empty{ text-align:center; color:#9aa5c4; padding:50px 10px; font-size:15px; grid-column:1/-1; }

/* ================= استیج تمام‌صفحه ================= */
.ag-stage{ position:fixed; inset:0; z-index:9990; display:flex; flex-direction:column;
  background:radial-gradient(1000px 500px at 50% -10%,hsl(var(--h,260) 60% 22% / .5),transparent 60%),#05070f;
  animation:ag-stage-in .28s cubic-bezier(.2,.9,.25,1); }
@keyframes ag-stage-in{ from{ opacity:0; transform:scale(1.03); } to{ opacity:1; transform:none; } }
.ag-stage__head{ display:flex; align-items:center; gap:10px; padding:12px 16px; flex-wrap:wrap;
  background:rgba(8,11,22,.85); backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,.08);
  padding-top:calc(12px + env(safe-area-inset-top,0px)); }
.ag-stage__title{ display:flex; align-items:center; gap:10px; font-weight:900; font-size:16px; color:#fff; margin-inline-end:auto; min-width:0; }
.ag-stage__title .ag-ico{ font-size:26px; }
.ag-stage__title small{ display:block; font-size:11px; color:#ffd166; font-weight:700; }
.ag-stage__body{ flex:1; min-height:0; position:relative; display:flex; flex-direction:column; }
.ag-hbtn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; min-width:44px; min-height:44px;
  padding:8px 14px; border-radius:13px; border:1px solid rgba(255,255,255,.12); cursor:pointer;
  background:rgba(255,255,255,.05); color:#e7ecf5; font:inherit; font-size:13.5px; font-weight:700; transition:.18s; }
.ag-hbtn:hover{ background:rgba(255,255,255,.12); }
.ag-hbtn--exit{ background:linear-gradient(135deg,#fb7185,#e11d48); border-color:transparent; color:#fff; }
.ag-hbtn--exit:hover{ filter:brightness(1.1); }

/* ================= ابزار مشترک داخل بازی ================= */
.ag-game{ flex:1; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
  gap:12px; padding:16px 14px calc(20px + env(safe-area-inset-bottom,0px)); overflow-y:auto; width:100%; }
.ag-hud{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; align-items:center; }
.ag-pill{ display:inline-flex; align-items:center; gap:7px; background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.1); border-radius:999px; padding:7px 15px; font-size:13px; font-weight:800; color:#fff; }
.ag-pill b{ color:var(--ag-ac,#22d3ee); font-size:15px; }
.ag-pill--gold b{ color:#ffd166; }
.ag-board{ position:relative; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09);
  border-radius:18px; padding:12px; }
.ag-game canvas{ display:block; border-radius:14px; touch-action:none; user-select:none; -webkit-user-select:none; }
.ag-controls{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.ag-btn{ border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); color:#fff;
  border-radius:13px; padding:10px 20px; font:inherit; font-size:14px; font-weight:800; cursor:pointer; transition:.18s; min-height:46px; }
.ag-btn:hover{ background:rgba(255,255,255,.12); }
.ag-btn--primary{ background:linear-gradient(90deg,#22d3ee,#a78bfa); border-color:transparent; color:#04101c; }
.ag-btn--primary:hover{ filter:brightness(1.1); }
.ag-btn--sm{ padding:7px 13px; font-size:12.5px; min-height:38px; }
.ag-overlay{ position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:12px; text-align:center; background:rgba(4,7,15,.78); backdrop-filter:blur(6px); border-radius:18px; padding:24px;
  animation:ag-pop .3s cubic-bezier(.2,.9,.25,1.2); }
@keyframes ag-pop{ from{ opacity:0; transform:scale(.92); } to{ opacity:1; transform:none; } }
.ag-overlay h2{ margin:0; font-size:clamp(24px,5vw,38px); font-weight:900; color:#fff; }
.ag-overlay p{ margin:0; color:#9aa5c4; font-size:14px; line-height:2; }
.ag-overlay .ag-big{ font-size:clamp(30px,7vw,52px); font-weight:900; color:#ffd166; }
.ag-hint{ font-size:12px; color:#6b7694; text-align:center; line-height:2; max-width:520px; }
/* دکمه‌های لمسی جهت‌دار */
.ag-pad{ display:grid; grid-template-columns:repeat(3,58px); grid-template-rows:repeat(2,58px); gap:7px; justify-content:center; }
.ag-pad button, .ag-tbtn{ border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:#fff;
  border-radius:16px; font-size:22px; cursor:pointer; min-width:58px; min-height:58px; touch-action:manipulation; }
.ag-pad button:active, .ag-tbtn:active{ background:rgba(34,211,238,.3); transform:scale(.93); }
.ag-trow{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.ag-seg{ display:flex; gap:6px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:13px; padding:5px; }
.ag-seg button{ border:0; background:transparent; color:#9aa5c4; font:inherit; font-size:12.5px; font-weight:800;
  padding:8px 15px; border-radius:9px; cursor:pointer; }
.ag-seg button.is-on{ background:linear-gradient(90deg,#22d3ee,#a78bfa); color:#04101c; }

/* انتخاب بازی ویژه در خانه */
.ag-pick-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:9px; max-height:46vh; overflow-y:auto; }
.ag-pick{ display:flex; flex-direction:column; align-items:center; gap:5px; padding:12px 6px; border-radius:14px; cursor:pointer;
  background:rgba(255,255,255,.04); border:2px solid rgba(255,255,255,.09); color:#e7ecf5; font:inherit; font-size:11.5px; font-weight:700; transition:.15s; }
.ag-pick i{ font-style:normal; font-size:26px; }
.ag-pick.is-sel{ border-color:#22d3ee; background:rgba(34,211,238,.12); box-shadow:0 0 0 1px #22d3ee; }

@media (max-width:560px){
  .ag-hub{ padding:18px 12px 110px; }
  .ag-hero{ padding:26px 18px; }
  .ag-hero::after{ font-size:70px; }
  .ag-grid{ grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:10px; }
  .ag-card p{ min-height:0; }
  .ag-stage__title{ font-size:14px; }
  .ag-hbtn{ min-width:44px; padding:8px 10px; font-size:12.5px; }
  .ag-hbtn .ag-hbtn__txt{ display:none; }
  .ag-game{ padding:12px 8px calc(16px + env(safe-area-inset-bottom,0px)); }
}
@media (pointer:coarse){
  .ag-card:hover{ transform:none; }
}
`;
