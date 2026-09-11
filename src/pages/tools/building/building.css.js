// src/pages/tools/building/building.css.js

/**
 * ساختمون‌یار — استایل‌ها 🏢
 * تم تیره گلس‌مورفیسم هم‌خانواده با لایوت ابزارها
 */

export const buildingCss = /* css */ `
.bld-app {
  color-scheme: dark;
  --bld-text: var(--vcr-text, rgba(255,255,255,.92));
  --bld-muted: var(--vcr-muted, rgba(255,255,255,.6));
  --bld-dim: var(--vcr-dim, rgba(255,255,255,.42));
  --bld-surface: var(--vcr-surface, rgba(16,22,36,.78));
  --bld-surface-2: var(--vcr-surface-2, rgba(20,27,43,.88));
  --bld-card: rgba(255,255,255,.045);
  --bld-card-2: rgba(255,255,255,.07);
  --bld-border: var(--vcr-border, rgba(255,255,255,.09));
  --bld-border-2: rgba(255,255,255,.15);
  --bld-accent: #ffc44d;
  --bld-accent-2: #ff8a5c;
  --bld-green: #2dffb2;
  --bld-red: #ff5d7a;
  --bld-blue: #5aa9f0;
  --bld-radius: 18px;
  --bld-shadow: 0 18px 50px rgba(0,0,0,.45);
  position: relative;
  color: var(--bld-text);
  font-variant-numeric: tabular-nums;
  padding-bottom: 28px;
}
.bld-app .is-green { color: var(--bld-green); }
.bld-app .is-red { color: var(--bld-red); }
.bld-app .is-accent { color: var(--bld-accent); }

/* ---------- دکمه‌ها ---------- */
.bld-app .bld-btn {
  border: 1px solid var(--bld-border-2);
  background: var(--bld-card-2);
  color: var(--bld-text);
  border-radius: 12px;
  padding: 9px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s, background .15s, border-color .15s, box-shadow .15s;
  white-space: nowrap;
}
.bld-app .bld-btn:hover:not(:disabled) { transform: translateY(-1px); border-color: rgba(255,196,77,.5); background: rgba(255,196,77,.1); }
.bld-app .bld-btn:disabled { opacity: .45; cursor: not-allowed; }
.bld-app .bld-btn.is-primary { background: linear-gradient(135deg, var(--bld-accent), var(--bld-accent-2)); border-color: transparent; color: #241300; box-shadow: 0 8px 24px rgba(255,170,60,.28); }
.bld-app .bld-btn.is-primary:hover:not(:disabled) { background: linear-gradient(135deg, #ffd06e, #ff9a6e); box-shadow: 0 10px 30px rgba(255,170,60,.4); }
.bld-app .bld-btn.is-danger { border-color: rgba(255,93,122,.4); color: #ffb3c1; }
.bld-app .bld-btn.is-danger:hover:not(:disabled) { background: rgba(255,93,122,.14); border-color: var(--bld-red); }
.bld-app .bld-btn.is-sm { padding: 6px 12px; font-size: 12.5px; border-radius: 10px; }
.bld-app .bld-btn.is-lg { padding: 13px 26px; font-size: 15px; border-radius: 14px; }
.bld-app .bld-btn.is-icon { padding: 6px 10px; }
.bld-app .bld-btn-group { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-app .bld-chip {
  border: 1px solid var(--bld-border);
  background: var(--bld-card);
  color: var(--bld-muted);
  border-radius: 999px;
  padding: 7px 15px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
}
.bld-app .bld-chip:hover { color: var(--bld-text); border-color: var(--bld-border-2); }
.bld-app .bld-chip.is-active { background: rgba(255,196,77,.14); border-color: rgba(255,196,77,.5); color: var(--bld-accent); }
.bld-app .bld-dot {
  min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
  background: var(--bld-red); color: #fff; font-size: 11px; font-weight: 800;
  display: inline-grid; place-items: center; box-shadow: 0 0 12px rgba(255,93,122,.6);
}
.bld-app .bld-link { background: none; border: 0; color: var(--bld-accent); font-weight: 800; cursor: pointer; font-size: inherit; padding: 0; }
.bld-app .bld-link:hover { text-decoration: underline; }
.bld-app .bld-row-btns { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

/* ---------- کارت‌های عمومی ---------- */
.bld-app .bld-empty { text-align: center; padding: 44px 20px; border: 1px dashed var(--bld-border-2); border-radius: var(--bld-radius); background: var(--bld-card); }
.bld-app .bld-empty-ico { font-size: 46px; margin-bottom: 10px; animation: bld-float 3s ease-in-out infinite; }
.bld-app .bld-empty h3 { margin: 0 0 6px; font-size: 16px; }
.bld-app .bld-empty p { margin: 0 0 14px; color: var(--bld-muted); font-size: 13px; }
@keyframes bld-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.bld-app .bld-sec-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin: 6px 0 14px; flex-wrap: wrap; }
.bld-app .bld-sec-head h3 { margin: 0; font-size: 17px; }
.bld-app .bld-sec-head p { margin: 4px 0 0; color: var(--bld-muted); font-size: 12.5px; }
.bld-app .bld-sec-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-app .bld-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.bld-app .bld-toolbar { margin-bottom: 14px; display: flex; gap: 8px; }
.bld-app .bld-my-title { font-size: 15px; margin: 22px 0 12px; }
.bld-app .bld-f-hint { color: var(--bld-muted); font-size: 12.5px; }
.bld-app .bld-tag { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: rgba(255,196,77,.14); border: 1px solid rgba(255,196,77,.4); color: var(--bld-accent); }
.bld-app .bld-tag.is-demo { background: rgba(90,169,240,.14); border-color: rgba(90,169,240,.4); color: var(--bld-blue); }
.bld-app .bld-ok-tag { font-size: 13px; font-weight: 800; color: var(--bld-green); }
.bld-app .bld-status { font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 999px; background: var(--bld-card-2); border: 1px solid var(--bld-border); white-space: nowrap; }
.bld-app .bld-status.is-ok { color: var(--bld-green); border-color: rgba(45,255,178,.35); }
.bld-app .bld-status.is-warn { color: var(--bld-accent); border-color: rgba(255,196,77,.35); }
.bld-app .bld-status.is-bad { color: var(--bld-red); border-color: rgba(255,93,122,.4); }
.bld-app .bld-avatar { width: 40px; height: 40px; border-radius: 13px; display: inline-grid; place-items: center; font-weight: 800; font-size: 17px; color: #fff; background: linear-gradient(135deg, hsl(var(--ah,200) 60% 45%), hsl(calc(var(--ah,200) + 40) 65% 35%)); overflow: hidden; flex-shrink: 0; }
.bld-app .bld-avatar img { width: 100%; height: 100%; object-fit: cover; }
.bld-app .bld-avatar.is-xs { width: 28px; height: 28px; border-radius: 9px; font-size: 13px; }
.bld-app .bld-avatar.is-sm { width: 34px; height: 34px; border-radius: 11px; font-size: 15px; }
.bld-app .bld-avatar.is-lg { width: 62px; height: 62px; border-radius: 18px; font-size: 26px; }
.bld-app .bld-progress { display: block; height: 8px; border-radius: 99px; background: rgba(255,255,255,.09); overflow: hidden; }
.bld-app .bld-progress i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--bld-accent), var(--bld-accent-2)); transition: width .5s; }
.bld-app .bld-due { font-size: 11.5px; font-weight: 800; color: var(--bld-blue); background: rgba(90,169,240,.12); padding: 3px 10px; border-radius: 999px; }
.bld-app .bld-due.is-today { color: var(--bld-accent); background: rgba(255,196,77,.14); }
.bld-app .bld-due.is-over { color: #fff; background: rgba(255,93,122,.25); border: 1px solid rgba(255,93,122,.5); animation: bld-blink-soft 1.6s infinite; }
@keyframes bld-blink-soft { 50% { opacity: .6; } }
.bld-app .bld-donut { position: relative; display: inline-block; flex-shrink: 0; }
.bld-app .bld-donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.bld-app .bld-donut-bg { fill: none; stroke: rgba(255,255,255,.09); stroke-width: 13; }
.bld-app .bld-donut-fg { fill: none; stroke: url(#bldDonutGrad); stroke: url(#bldDonutGrad); stroke-width: 13; stroke-linecap: round; stroke: #ffc44d; transition: stroke-dashoffset .8s cubic-bezier(.22,.9,.24,1); filter: drop-shadow(0 0 8px rgba(255,196,77,.5)); }
.bld-app .bld-donut-c { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
.bld-app .bld-donut-c b { font-size: 15px; }
.bld-app .bld-donut-c small { color: var(--bld-muted); font-size: 11px; }
.bld-app .bld-thumb { border: 1px solid var(--bld-border-2); background: rgba(0,0,0,.3); border-radius: 12px; padding: 4px; cursor: pointer; display: inline-flex; flex-direction: column; align-items: center; gap: 4px; color: var(--bld-muted); font-size: 11px; transition: transform .15s, border-color .15s; }
.bld-app .bld-thumb:hover { transform: scale(1.04); border-color: var(--bld-accent); }
.bld-app .bld-thumb img { width: 120px; height: 80px; object-fit: cover; border-radius: 8px; }
.bld-app .bld-thumb.is-sm img { width: 64px; height: 48px; }
.bld-app .bld-thumb.is-msg img { width: 180px; height: auto; max-height: 220px; }

/* ---------- آنبوردینگ ---------- */
.bld-app .bld-hero { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: center; padding: 30px; border-radius: 24px; background: linear-gradient(135deg, rgba(255,196,77,.1), rgba(255,138,92,.05) 40%, rgba(90,169,240,.08)); border: 1px solid rgba(255,196,77,.25); margin-bottom: 20px; position: relative; overflow: hidden; }
.bld-app .bld-hero-hi { color: var(--bld-accent); font-weight: 800; margin: 0 0 6px; }
.bld-app .bld-hero h2 { margin: 0 0 10px; font-size: 26px; }
.bld-app .bld-hero-txt p { color: var(--bld-muted); font-size: 14px; line-height: 2; margin: 0 0 12px; }
.bld-app .bld-hero-feats { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-app .bld-hero-feats span { font-size: 12px; background: rgba(255,255,255,.06); border: 1px solid var(--bld-border); padding: 5px 12px; border-radius: 999px; }
.bld-app .bld-hero-art { position: relative; height: 210px; }
.bld-app .bld-hero-bld { position: absolute; bottom: 0; right: 12%; width: 170px; height: 185px; border-radius: 14px 14px 0 0; background: linear-gradient(180deg, #3a4568, #232b46); border: 1px solid rgba(255,255,255,.14); display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; padding: 20px 16px; }
.bld-app .bld-hero-bld i { border-radius: 6px; background: linear-gradient(180deg, #ffe9b3, #e09b2d); animation: bld-win-tw 3s ease-in-out infinite; }
.bld-app .bld-hero-bld i:nth-child(3n) { background: #141b31; animation: none; }
.bld-app .bld-hero-bld i:nth-child(2) { animation-delay: -.7s; } .bld-app .bld-hero-bld i:nth-child(5) { animation-delay: -1.4s; } .bld-app .bld-hero-bld i:nth-child(7) { animation-delay: -2s; }
@keyframes bld-win-tw { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
.bld-app .bld-hero-moon { position: absolute; top: 6px; left: 8%; width: 52px; height: 52px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff8e1, #e8c85a); box-shadow: 0 0 40px rgba(255,220,120,.5); }
.bld-app .bld-hero-cloud { position: absolute; width: 110px; height: 30px; border-radius: 999px; background: rgba(255,255,255,.16); filter: blur(1px); animation: bld-hero-drift 9s ease-in-out infinite alternate; }
.bld-app .bld-hero-cloud.a { top: 30px; left: 30%; } .bld-app .bld-hero-cloud.b { top: 90px; left: 5%; animation-delay: -4s; width: 80px; }
@keyframes bld-hero-drift { from { transform: translateX(-24px); } to { transform: translateX(30px); } }
.bld-app .bld-onb-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 8px; }
.bld-app .bld-onb-card { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: var(--bld-radius); padding: 22px 18px; cursor: pointer; text-align: center; color: var(--bld-text); display: grid; gap: 6px; justify-items: center; transition: transform .18s, border-color .18s, box-shadow .18s; }
.bld-app .bld-onb-card:hover { transform: translateY(-4px); border-color: rgba(255,196,77,.5); box-shadow: 0 18px 44px rgba(0,0,0,.4); }
.bld-app .bld-onb-card.is-demo { background: linear-gradient(160deg, rgba(255,196,77,.12), rgba(255,138,92,.06)); border-color: rgba(255,196,77,.4); }
.bld-app .bld-onb-ico { font-size: 40px; }
.bld-app .bld-onb-card b { font-size: 15px; }
.bld-app .bld-onb-card small { color: var(--bld-muted); font-size: 12px; line-height: 1.9; }
.bld-app .bld-onb-go { color: var(--bld-accent); font-weight: 800; font-size: 13px; }
.bld-app .bld-my-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(300px,1fr)); gap: 14px; }
.bld-app .bld-my-card { border: 1px solid var(--bld-border-2); border-radius: var(--bld-radius); overflow: hidden; background: var(--bld-card); transition: transform .18s, box-shadow .18s; }
.bld-app .bld-my-card:hover { transform: translateY(-3px); box-shadow: var(--bld-shadow); }
.bld-app .bld-my-cover { width: 100%; height: 110px; object-fit: cover; display: block; }
.bld-app .bld-my-cover.is-fallback { display: grid; place-items: center; font-size: 44px; background: linear-gradient(135deg, #2a3350, #171e33); }
.bld-app .bld-my-body { padding: 14px 16px 16px; display: grid; gap: 8px; }
.bld-app .bld-my-top { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.bld-app .bld-my-top b { font-size: 15px; }
.bld-app .bld-my-body small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-my-meta { display: flex; gap: 14px; font-size: 12px; color: var(--bld-muted); }
.bld-app .bld-my-actions { display: flex; gap: 8px; margin-top: 4px; }
.bld-app .bld-my-actions .bld-btn:first-child { flex: 1; }

/* ---------- جوین ---------- */
.bld-app .bld-join { margin: 22px 0; border: 1px solid rgba(255,196,77,.35); border-radius: 22px; padding: 22px; background: linear-gradient(180deg, rgba(255,196,77,.07), transparent); }
.bld-app .bld-join-head h3 { margin: 0 0 4px; }
.bld-app .bld-join-head p { margin: 0 0 16px; color: var(--bld-muted); font-size: 13px; }
.bld-app .bld-slot-grid { display: grid; gap: 10px; }
.bld-app .bld-slot-row { display: grid; grid-template-columns: 90px 1fr; gap: 12px; align-items: center; }
.bld-app .bld-slot-floor { font-size: 12.5px; font-weight: 800; color: var(--bld-muted); }
.bld-app .bld-slot-cells { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-app .bld-slot { border: 1px solid var(--bld-border-2); background: var(--bld-card-2); border-radius: 13px; padding: 10px 14px; cursor: pointer; color: var(--bld-text); display: grid; gap: 2px; min-width: 86px; transition: all .15s; }
.bld-app .bld-slot b { font-size: 17px; }
.bld-app .bld-slot small { color: var(--bld-muted); font-size: 11px; }
.bld-app .bld-slot:hover:not(:disabled) { border-color: var(--bld-accent); transform: translateY(-2px); }
.bld-app .bld-slot.is-picked { border-color: var(--bld-accent); background: rgba(255,196,77,.14); box-shadow: 0 0 0 2px rgba(255,196,77,.3), 0 8px 22px rgba(255,170,60,.25); }
.bld-app .bld-slot.is-full { opacity: .55; cursor: not-allowed; }
.bld-app .bld-join-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 18px; flex-wrap: wrap; }
.bld-app .bld-picked { font-size: 13px; }
.bld-app .bld-join-btns { display: flex; gap: 8px; }

/* ---------- پوسته ---------- */
.bld-app .bld-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; }
.bld-app .bld-back { border: 1px solid var(--bld-border-2); background: var(--bld-card); color: var(--bld-text); border-radius: 12px; padding: 8px 14px; cursor: pointer; font-weight: 800; font-size: 13px; }
.bld-app .bld-back:hover { border-color: var(--bld-accent); }
.bld-app .bld-id { display: flex; align-items: center; gap: 12px; }
.bld-app .bld-id-cover { width: 48px; height: 48px; border-radius: 14px; object-fit: cover; }
.bld-app .bld-id-cover.is-fallback { display: grid; place-items: center; font-size: 26px; background: linear-gradient(135deg,#3a4568,#232b46); }
.bld-app .bld-id b { font-size: 16px; display: block; }
.bld-app .bld-id small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-code-mini { background: rgba(255,196,77,.1); border: 1px dashed rgba(255,196,77,.45); color: var(--bld-accent); border-radius: 8px; padding: 2px 9px; cursor: pointer; font-weight: 800; letter-spacing: 1px; }
.bld-app .bld-code-mini:hover { background: rgba(255,196,77,.2); }
.bld-app .bld-top-spacer { flex: 1; }
.bld-app .bld-tabs { display: flex; gap: 6px; overflow-x: auto; padding: 4px 2px 12px; margin-bottom: 6px; scrollbar-width: thin; }
.bld-app .bld-tab { border: 1px solid transparent; background: transparent; color: var(--bld-muted); border-radius: 13px; padding: 9px 14px; cursor: pointer; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; transition: all .15s; }
.bld-app .bld-tab:hover { background: var(--bld-card-2); color: var(--bld-text); }
.bld-app .bld-tab.is-active { background: rgba(255,196,77,.13); border-color: rgba(255,196,77,.4); color: var(--bld-accent); }
.bld-app .bld-tab-ico { font-size: 16px; }

/* ---------- نما ---------- */
.bld-app .bld-facade-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.bld-app .bld-stat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-app .bld-stat-chip { font-size: 12.5px; background: var(--bld-card); border: 1px solid var(--bld-border); padding: 7px 13px; border-radius: 999px; color: var(--bld-muted); }
.bld-app .bld-stat-chip b { color: var(--bld-text); }
.bld-app .bld-seg { display: flex; gap: 6px; }
.bld-app .bld-facade-frame { border-radius: 24px; overflow: hidden; border: 1px solid var(--bld-border-2); box-shadow: var(--bld-shadow); }
.bld-app .bld-facade-svg { width: 100%; height: auto; display: block; }
.bld-app .bld-legend { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin-top: 12px; font-size: 12.5px; color: var(--bld-muted); }
.bld-app .bld-lg-dot { display: inline-block; width: 11px; height: 11px; border-radius: 50%; background: var(--c); margin-left: 5px; box-shadow: 0 0 8px var(--c); }
.bld-app .bld-legend-hint { margin-right: auto; color: var(--bld-accent); font-weight: 700; }
/* انیمیشن‌های SVG */
.bld-app .bld-star { animation: bld-tw 2.8s ease-in-out infinite; }
@keyframes bld-tw { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
.bld-app .bld-cloud { animation: bld-drift 11s ease-in-out infinite alternate; }
.bld-app .bld-cloud.c2 { animation-duration: 15s; } .bld-app .bld-cloud.c3 { animation-duration: 8s; }
@keyframes bld-drift { from { transform: translateX(-26px); } to { transform: translateX(30px); } }
.bld-app .bld-blink { animation: bld-blink-soft 1.2s infinite; }
.bld-app .bld-sun { animation: bld-sun-pulse 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes bld-sun-pulse { 50% { transform: scale(1.07); } }
.bld-app .bld-lamp { animation: bld-tw 2.2s ease-in-out infinite; }
.bld-app .bld-win { cursor: pointer; transition: transform .18s; transform-box: fill-box; transform-origin: center; }
.bld-app .bld-win:hover, .bld-app .bld-win:focus { transform: scale(1.07); outline: none; }
.bld-app .bld-win-ring { fill: none; stroke: var(--bld-accent); stroke-width: 2.5; stroke-dasharray: 8 6; animation: bld-dash 6s linear infinite; filter: drop-shadow(0 0 6px rgba(255,196,77,.7)); }
@keyframes bld-dash { to { stroke-dashoffset: -140; } }

/* ---------- تابلو ---------- */
.bld-app .bld-feed { display: grid; gap: 14px; }
.bld-app .bld-post { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: var(--bld-radius); padding: 18px; position: relative; animation: bld-rise .35s both; }
@keyframes bld-rise { from { opacity: 0; transform: translateY(10px); } }
.bld-app .bld-post.is-pinned { border-color: rgba(255,196,77,.45); background: linear-gradient(180deg, rgba(255,196,77,.07), var(--bld-card)); }
.bld-app .bld-post.is-charge { border-inline-start: 4px solid var(--bld-accent); }
.bld-app .bld-post.is-expense { border-inline-start: 4px solid var(--bld-red); }
.bld-app .bld-post.is-notice { border-inline-start: 4px solid var(--bld-blue); }
.bld-app .bld-post.is-discussion { border-inline-start: 4px solid #9a6ac8; }
.bld-app .bld-pin { position: absolute; top: 12px; left: 14px; font-size: 11.5px; font-weight: 800; color: var(--bld-accent); }
.bld-app .bld-post-head { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.bld-app .bld-post-kind { font-size: 12px; font-weight: 800; background: var(--bld-card-2); border: 1px solid var(--bld-border); padding: 4px 11px; border-radius: 999px; }
.bld-app .bld-post-time { font-size: 11.5px; color: var(--bld-dim); }
.bld-app .bld-post h4 { margin: 0 0 8px; font-size: 15.5px; }
.bld-app .bld-post-body { margin: 0 0 12px; color: rgba(255,255,255,.82); font-size: 13.5px; line-height: 2; }
.bld-app .bld-post-money { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; background: rgba(0,0,0,.25); border: 1px solid var(--bld-border); border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; }
.bld-app .bld-post-money small { display: block; color: var(--bld-muted); font-size: 11px; margin-bottom: 3px; }
.bld-app .bld-post-money b { font-size: 14.5px; }
.bld-app .bld-post-month, .bld-app .bld-post-cat { font-size: 12.5px; color: var(--bld-muted); margin-bottom: 8px; }
.bld-app .bld-post-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.bld-app .bld-post-admin { display: flex; gap: 6px; flex-wrap: wrap; }

/* ---------- مالی ---------- */
.bld-app .bld-bal-hero { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; border: 1px solid rgba(255,196,77,.3); background: linear-gradient(135deg, rgba(255,196,77,.08), transparent); border-radius: 22px; padding: 22px; margin-bottom: 8px; }
.bld-app .bld-bal-stats { display: grid; grid-template-columns: repeat(2,minmax(120px,1fr)); gap: 12px 26px; flex: 1; min-width: 220px; }
.bld-app .bld-bal-stats small { display: block; color: var(--bld-muted); font-size: 11.5px; margin-bottom: 2px; }
.bld-app .bld-bal-stats b { font-size: 16px; }
.bld-app .bld-debts { display: grid; gap: 10px; }
.bld-app .bld-debt { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 15px; padding: 14px 16px; display: grid; gap: 8px; }
.bld-app .bld-debt.is-over { border-color: rgba(255,93,122,.5); background: linear-gradient(180deg, rgba(255,93,122,.06), transparent); }
.bld-app .bld-debt.is-paid { opacity: .75; }
.bld-app .bld-debt-top { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.bld-app .bld-debt-nums { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--bld-muted); }
.bld-app .bld-pays { display: grid; gap: 10px; }
.bld-app .bld-pay { border: 1px solid var(--bld-border); background: var(--bld-card); border-radius: 15px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.bld-app .bld-pay.is-pending { border-color: rgba(255,196,77,.4); }
.bld-app .bld-pay-main { flex: 1; min-width: 200px; display: grid; gap: 2px; }
.bld-app .bld-pay-main b { font-size: 15px; }
.bld-app .bld-pay-main small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-pay-actions { display: flex; gap: 8px; }
.bld-app .bld-fund-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 12px; margin-bottom: 6px; }
.bld-app .bld-fund-main { grid-row: span 2; border-radius: 20px; padding: 22px; background: linear-gradient(150deg, rgba(45,255,178,.12), rgba(45,255,178,.03)); border: 1px solid rgba(45,255,178,.3); display: grid; gap: 8px; align-content: center; }
.bld-app .bld-fund-main small { color: var(--bld-muted); }
.bld-app .bld-fund-main b { font-size: 26px; }
.bld-app .bld-fund-card { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 16px; padding: 14px 16px; display: grid; gap: 4px; align-content: center; }
.bld-app .bld-fund-card small { color: var(--bld-muted); font-size: 12px; display: flex; align-items: center; gap: 6px; }
.bld-app .bld-fund-card b { font-size: 16.5px; }
.bld-app .bld-rep-top { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
.bld-app .bld-rep-cards { display: grid; grid-template-columns: repeat(2,minmax(150px,1fr)); gap: 10px; flex: 1; min-width: 260px; }
.bld-app .bld-rep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.bld-app .bld-rep-box { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 18px; padding: 18px; margin-bottom: 12px; }
.bld-app .bld-rep-box h4 { margin: 0 0 14px; font-size: 14px; display: flex; align-items: center; gap: 8px; justify-content: space-between; flex-wrap: wrap; }
.bld-app .bld-bars { display: flex; gap: 8px; align-items: flex-end; height: 170px; }
.bld-app .bld-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
.bld-app .bld-bar-val { font-size: 10.5px; color: var(--bld-accent); font-weight: 800; min-height: 16px; }
.bld-app .bld-bar-col i { width: 70%; border-radius: 8px 8px 4px 4px; background: linear-gradient(180deg, var(--bld-accent), var(--bld-accent-2)); box-shadow: 0 0 16px rgba(255,180,60,.3); }
.bld-app .bld-bar-col small { font-size: 11px; color: var(--bld-muted); }
.bld-app .bld-debtor { display: grid; grid-template-columns: 1fr 1.2fr auto; gap: 10px; align-items: center; font-size: 12.5px; padding: 7px 0; border-bottom: 1px dashed var(--bld-border); }
.bld-app .bld-debtor:last-child { border-bottom: 0; }
.bld-app .bld-table-wrap { overflow-x: auto; }
.bld-app .bld-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.bld-app .bld-table th, .bld-app .bld-table td { padding: 9px 10px; text-align: right; border-bottom: 1px solid var(--bld-border); white-space: nowrap; }
.bld-app .bld-table th { color: var(--bld-muted); font-size: 11.5px; }
.bld-app .bld-table tr.is-over { background: rgba(255,93,122,.07); }
.bld-app .bld-table tr.is-debt { background: rgba(255,196,77,.05); }

/* ---------- چت ---------- */
.bld-app .bld-chat { display: grid; grid-template-columns: 300px 1fr; gap: 14px; height: 600px; min-height: 480px; }
.bld-app .bld-threads { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: var(--bld-radius); padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.bld-app .bld-thread { display: flex; align-items: center; gap: 10px; width: 100%; text-align: right; border: 1px solid transparent; background: transparent; color: var(--bld-text); border-radius: 13px; padding: 9px 10px; cursor: pointer; transition: background .15s; }
.bld-app .bld-thread:hover { background: var(--bld-card-2); }
.bld-app .bld-thread.is-active { background: rgba(255,196,77,.1); border-color: rgba(255,196,77,.35); }
.bld-app .bld-thread-ico { font-size: 24px; }
.bld-app .bld-thread-txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
.bld-app .bld-thread-txt b { font-size: 13px; }
.bld-app .bld-thread-txt small { color: var(--bld-muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bld-app .bld-thread-sep { font-size: 11px; font-weight: 800; color: var(--bld-dim); padding: 8px 6px 2px; }
.bld-app .bld-conv { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: var(--bld-radius); display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.bld-app .bld-conv-head { padding: 12px 16px; border-bottom: 1px solid var(--bld-border); display: flex; align-items: center; gap: 10px; background: rgba(255,196,77,.05); }
.bld-app .bld-conv-head small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.bld-app .bld-msg { display: flex; gap: 8px; align-items: flex-end; animation: bld-rise .25s both; }
.bld-app .bld-msg.is-own { flex-direction: row-reverse; }
.bld-app .bld-bubble { max-width: 72%; background: var(--bld-card-2); border: 1px solid var(--bld-border); border-radius: 16px 16px 16px 4px; padding: 10px 13px; position: relative; }
.bld-app .bld-msg.is-own .bld-bubble { background: linear-gradient(135deg, rgba(255,196,77,.2), rgba(255,138,92,.12)); border-color: rgba(255,196,77,.35); border-radius: 16px 16px 4px 16px; }
.bld-app .bld-bubble-head { display: flex; gap: 8px; align-items: center; margin-bottom: 3px; }
.bld-app .bld-bubble-head b { font-size: 12px; color: var(--bld-accent); }
.bld-app .bld-bubble-head small { font-size: 10.5px; color: var(--bld-dim); }
.bld-app .bld-bubble p { margin: 0; font-size: 13.5px; line-height: 1.9; word-break: break-word; }
.bld-app .bld-bubble-time { display: block; margin-top: 5px; font-size: 10.5px; color: var(--bld-dim); }
.bld-app .bld-msg-del { position: absolute; top: 4px; left: 6px; border: 0; background: none; color: var(--bld-dim); cursor: pointer; font-size: 15px; opacity: 0; transition: opacity .15s; }
.bld-app .bld-bubble:hover .bld-msg-del { opacity: 1; }
.bld-app .bld-msg-del:hover { color: var(--bld-red); }
.bld-app .bld-composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--bld-border); background: rgba(0,0,0,.2); position: relative; }
.bld-app .bld-composer .bld-f-input { flex: 1; }
.bld-app .bld-attach { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--bld-border-2); background: var(--bld-card-2); display: grid; place-items: center; font-size: 19px; cursor: pointer; flex-shrink: 0; }
.bld-app .bld-attach:hover { border-color: var(--bld-accent); }
.bld-app .bld-img-prev { position: absolute; bottom: calc(100% + 8px); right: 12px; border: 1px solid var(--bld-border-2); border-radius: 12px; overflow: hidden; }
.bld-app .bld-img-prev img { width: 120px; height: 90px; object-fit: cover; display: block; }
.bld-app .bld-img-prev button { position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; border-radius: 50%; border: 0; background: rgba(0,0,0,.7); color: #fff; cursor: pointer; }

/* ---------- خدمات ---------- */
.bld-app .bld-clean { border: 1px solid rgba(45,255,178,.3); background: linear-gradient(135deg, rgba(45,255,178,.07), transparent); border-radius: 20px; padding: 18px; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
.bld-app .bld-clean-now small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-clean-unit { display: flex; gap: 10px; align-items: center; margin: 8px 0; }
.bld-app .bld-clean-unit b { font-size: 16px; display: block; }
.bld-app .bld-clean-order { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.bld-app .bld-clean-dot { font-size: 11.5px; font-weight: 800; padding: 5px 10px; border-radius: 999px; background: var(--bld-card-2); border: 1px solid var(--bld-border); color: var(--bld-muted); }
.bld-app .bld-clean-dot.is-now { background: rgba(45,255,178,.15); border-color: var(--bld-green); color: var(--bld-green); }
.bld-app .bld-clean-dot.is-next { border-style: dashed; }
.bld-app .bld-clean-btns { display: flex; gap: 6px; }
.bld-app .bld-events { display: grid; gap: 10px; }
.bld-app .bld-event { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 15px; padding: 13px 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.bld-app .bld-event > div:first-child { flex: 1; min-width: 200px; }
.bld-app .bld-event small { color: var(--bld-muted); font-size: 12px; display: block; margin-top: 2px; }
.bld-app .bld-event p { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,.8); }
.bld-app .bld-countdown { font-weight: 800; font-size: 13px; background: rgba(90,169,240,.12); border: 1px solid rgba(90,169,240,.35); color: var(--bld-blue); padding: 7px 14px; border-radius: 999px; white-space: nowrap; }
.bld-app .bld-tickets { display: grid; gap: 10px; }
.bld-app .bld-ticket { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 15px; padding: 13px 16px; display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.bld-app .bld-ticket-ico { font-size: 28px; }
.bld-app .bld-ticket-main { flex: 1; min-width: 220px; display: grid; gap: 3px; }
.bld-app .bld-ticket-main small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-ticket-main p { margin: 4px 0 0; font-size: 13px; }
.bld-app .bld-ticket.is-done { opacity: .7; }

/* ---------- رأی‌گیری ---------- */
.bld-app .bld-polls { display: grid; gap: 12px; margin-bottom: 6px; }
.bld-app .bld-poll { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: var(--bld-radius); padding: 18px; }
.bld-app .bld-poll-head { margin-bottom: 12px; }
.bld-app .bld-poll-head b { font-size: 15px; display: block; margin-bottom: 4px; }
.bld-app .bld-poll-head small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-poll-opts { display: grid; gap: 8px; margin-bottom: 10px; }
.bld-app .bld-poll-opt { border: 1px solid var(--bld-border-2); background: var(--bld-card-2); color: var(--bld-text); border-radius: 12px; padding: 11px 15px; cursor: pointer; font-weight: 700; font-size: 13.5px; text-align: right; transition: all .15s; }
.bld-app .bld-poll-opt:hover { border-color: var(--bld-accent); background: rgba(255,196,77,.08); transform: translateX(-3px); }
.bld-app .bld-poll-res { display: grid; grid-template-columns: 1fr 1.4fr auto; gap: 10px; align-items: center; font-size: 13px; background: var(--bld-card-2); border-radius: 11px; padding: 8px 12px; }
.bld-app .bld-poll-res.is-mine { border: 1px solid rgba(255,196,77,.4); }
.bld-app .bld-sugs { display: grid; grid-template-columns: repeat(auto-fill,minmax(300px,1fr)); gap: 12px; }
.bld-app .bld-sug { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: var(--bld-radius); overflow: hidden; display: flex; flex-direction: column; }
.bld-app .bld-sug-img { border: 0; padding: 0; cursor: zoom-in; background: none; }
.bld-app .bld-sug-img img { width: 100%; height: 170px; object-fit: cover; display: block; }
.bld-app .bld-sug-body { padding: 15px 16px; display: grid; gap: 8px; flex: 1; }
.bld-app .bld-sug-top { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.bld-app .bld-sug-body p { margin: 0; font-size: 13px; color: rgba(255,255,255,.8); line-height: 1.9; }
.bld-app .bld-sug-body small { color: var(--bld-muted); font-size: 11.5px; }
.bld-app .bld-sug-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: auto; padding-top: 6px; flex-wrap: wrap; }
.bld-app .bld-vote { border: 1px solid var(--bld-border-2); background: var(--bld-card-2); color: var(--bld-text); border-radius: 999px; padding: 7px 16px; font-weight: 800; cursor: pointer; font-size: 13px; transition: all .15s; }
.bld-app .bld-vote:hover { border-color: var(--bld-green); transform: scale(1.05); }
.bld-app .bld-vote.is-on { background: rgba(45,255,178,.13); border-color: var(--bld-green); color: var(--bld-green); }

/* ---------- شکایت / اسناد ---------- */
.bld-app .bld-comps { display: grid; gap: 12px; }
.bld-app .bld-comp { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: var(--bld-radius); padding: 16px 18px; display: grid; gap: 8px; }
.bld-app .bld-comp-head { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-app .bld-comp small { color: var(--bld-muted); font-size: 12px; }
.bld-app .bld-comp p { margin: 0; font-size: 13.5px; line-height: 1.9; }
.bld-app .bld-response { background: rgba(255,196,77,.07); border: 1px solid rgba(255,196,77,.3); border-radius: 13px; padding: 11px 14px; font-size: 13px; }
.bld-app .bld-response b { color: var(--bld-accent); }
.bld-app .bld-response p { margin: 4px 0 0; }
.bld-app .bld-docs { display: grid; gap: 10px; }
.bld-app .bld-doc { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 15px; padding: 13px 16px; display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.bld-app .bld-doc-ico { font-size: 30px; }
.bld-app .bld-doc-main { flex: 1; min-width: 220px; }
.bld-app .bld-doc-main small { color: var(--bld-muted); font-size: 12px; display: block; margin: 2px 0 6px; }
.bld-app .bld-doc-main p { margin: 0; font-size: 13px; line-height: 1.9; color: rgba(255,255,255,.8); }
.bld-app .bld-contacts { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 10px; }
.bld-app .bld-contact { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 15px; padding: 13px 16px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.bld-app .bld-contact-ico { font-size: 26px; }
.bld-app .bld-contact > div { flex: 1; min-width: 140px; }
.bld-app .bld-contact small { color: var(--bld-muted); font-size: 12px; display: block; }
.bld-app .bld-rules { border: 1px solid var(--bld-border-2); background: linear-gradient(180deg, rgba(255,248,225,.05), transparent); border-radius: var(--bld-radius); padding: 24px 26px; font-size: 14px; line-height: 2.4; white-space: pre-wrap; }

/* ---------- مدیریت ---------- */
.bld-app .bld-invite { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; border: 1px dashed rgba(255,196,77,.5); background: rgba(255,196,77,.06); border-radius: 18px; padding: 16px 20px; margin-bottom: 16px; }
.bld-app .bld-invite b { font-size: 15px; }
.bld-app .bld-invite p { margin: 4px 0 0; color: var(--bld-muted); font-size: 12.5px; }
.bld-app .bld-units { display: grid; gap: 12px; }
.bld-app .bld-mfloor { display: grid; grid-template-columns: 90px 1fr; gap: 12px; align-items: start; }
.bld-app .bld-munits { display: grid; grid-template-columns: repeat(auto-fill,minmax(230px,1fr)); gap: 10px; }
.bld-app .bld-munit { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 15px; padding: 12px 14px; display: grid; gap: 8px; }
.bld-app .bld-munit.is-empty { opacity: .72; border-style: dashed; align-content: center; text-align: center; }
.bld-app .bld-munit-head { display: flex; gap: 10px; align-items: center; background: none; border: 0; color: var(--bld-text); cursor: pointer; text-align: right; padding: 0; }
.bld-app .bld-munit-head small { color: var(--bld-muted); font-size: 11.5px; display: block; }
.bld-app .bld-munit small { font-size: 12px; }
.bld-app .bld-settings { display: grid; gap: 12px; max-width: 640px; }
.bld-app .bld-set-card { border: 1px solid var(--bld-border-2); background: var(--bld-card); border-radius: 16px; padding: 16px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.bld-app .bld-set-card p { margin: 4px 0 0; color: var(--bld-muted); font-size: 12.5px; }
.bld-app .bld-danger-zone { border: 1px solid rgba(255,93,122,.4); background: rgba(255,93,122,.05); border-radius: 16px; padding: 16px 18px; margin-top: 8px; }
.bld-app .bld-danger-zone b { color: #ffb3c1; }
.bld-app .bld-danger-zone p { color: var(--bld-muted); font-size: 12.5px; margin: 6px 0 12px; }
.bld-app .bld-myunit { margin-bottom: 14px; }

/* ---------- ورود به واحد ---------- */
.bld-shell .bld-unit { display: grid; gap: 14px; }
.bld-shell .bld-unit-photo { width: 100%; height: 220px; object-fit: cover; border-radius: 16px; }
.bld-shell .bld-unit-head { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.bld-shell .bld-unit-head h3 { margin: 0 0 4px; font-size: 18px; }
.bld-shell .bld-unit-head p { margin: 0; color: var(--bld-muted, #9aa6bd); font-size: 12.5px; }
.bld-shell .bld-unit-bio { margin: 0; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09); border-radius: 12px; padding: 10px 14px; font-size: 13px; }
.bld-shell .bld-unit-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-shell .bld-unit-item { font-size: 12.5px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 7px 12px; color: #e7ecf5; text-decoration: none; }
.bld-shell a.bld-unit-item:hover { border-color: #ffc44d; }
.bld-shell .bld-unit-bal { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; background: rgba(0,0,0,.25); border-radius: 14px; padding: 13px 15px; }
.bld-shell .bld-unit-bal small { display: block; color: #9aa6bd; font-size: 11px; }
.bld-shell .bld-unit-bal b { font-size: 14.5px; }
.bld-shell .bld-unit-bal .bld-progress { grid-column: 1/-1; height: 8px; border-radius: 99px; background: rgba(255,255,255,.09); overflow: hidden; display: block; }
.bld-shell .bld-unit-bal .bld-progress i { display: block; height: 100%; background: linear-gradient(90deg,#ffc44d,#ff8a5c); border-radius: 99px; }
.bld-shell .is-green { color: #2dffb2; } .bld-shell .is-red { color: #ff8d9f; }
.bld-shell .bld-unit-debts { display: grid; gap: 5px; font-size: 13px; }
.bld-shell .bld-unit-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-shell .bld-btn { border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.07); color: #e7ecf5; border-radius: 12px; padding: 9px 16px; font-weight: 700; font-size: 13px; cursor: pointer; }
.bld-shell .bld-btn:hover { border-color: #ffc44d; }
.bld-shell .bld-btn.is-primary { background: linear-gradient(135deg,#ffc44d,#ff8a5c); color: #241300; border-color: transparent; }
.bld-shell .bld-btn.is-danger { border-color: rgba(255,93,122,.4); color: #ffb3c1; }
.bld-shell .bld-tag { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: rgba(255,196,77,.14); border: 1px solid rgba(255,196,77,.4); color: #ffc44d; }
.bld-shell .bld-f-hint { color: #9aa6bd; font-size: 12.5px; }
.bld-shell .bld-unit-empty-big { text-align: center; padding: 20px; display: grid; gap: 8px; justify-items: center; }
.bld-shell .bld-unit-empty-big .bld-empty-ico { font-size: 46px; }
.bld-shell .bld-unit-empty-big h3 { margin: 0; } .bld-shell .bld-unit-empty-big p { margin: 0; color: #cfd6e4; font-size: 13.5px; }

/* ---------- فرم‌های مودال (داخل body) ---------- */
.bld-form { display: grid; gap: 13px; }
.bld-f-row { display: grid; gap: 6px; }
.bld-f-label { font-size: 13px; font-weight: 800; color: #e7ecf5; }
.bld-f-input { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.13); border-radius: 12px; padding: 10px 13px; color: #eef2fa; font-size: 13.5px; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
.bld-f-input:focus { outline: none; border-color: #ffc44d; box-shadow: 0 0 0 3px rgba(255,196,77,.18); }
.bld-f-input::placeholder { color: #6d7a93; }
.bld-form select.bld-f-input option { background: #141a2c; }
.bld-f-input[type="date"], .bld-f-input[type="time"] { color-scheme: dark; }
.bld-form textarea.bld-f-input { resize: vertical; line-height: 1.9; }
.bld-f-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bld-f-hint { color: #8b97ad; font-size: 12px; margin: 0; }
.bld-f-hint b { color: #ffc44d; }
.bld-f-check { display: flex; align-items: center; gap: 9px; font-size: 13.5px; cursor: pointer; color: #e7ecf5; }
.bld-f-check input { width: 19px; height: 19px; accent-color: #ffc44d; cursor: pointer; }
.bld-f-err { margin: 0; color: #ff8d9f; font-size: 13px; font-weight: 700; background: rgba(255,93,122,.1); border: 1px solid rgba(255,93,122,.35); border-radius: 11px; padding: 9px 13px; }
.bld-f-preview { width: 100%; max-height: 170px; object-fit: cover; border-radius: 12px; margin-top: 6px; }
.bld-code-show { text-align: center; display: grid; gap: 12px; justify-items: center; padding: 8px 0; }
.bld-code-show p { margin: 0; color: #cfd6e4; font-size: 13.5px; }
.bld-code-big { font-size: 34px; font-weight: 900; letter-spacing: 8px; direction: ltr; background: linear-gradient(135deg, rgba(255,196,77,.16), rgba(255,138,92,.08)); border: 2px dashed rgba(255,196,77,.55); color: #ffd98a; border-radius: 18px; padding: 14px 26px 14px 34px; cursor: pointer; transition: transform .15s; }
.bld-code-big:hover { transform: scale(1.03); }
.bld-code-big.is-sm { font-size: 24px; padding: 10px 20px 10px 26px; letter-spacing: 5px; }
.bld-pay-total { text-align: center; background: rgba(255,196,77,.08); border: 1px solid rgba(255,196,77,.3); border-radius: 13px; padding: 11px; font-size: 14px; color: #e7ecf5; }
.bld-pay-total b { color: #ffc44d; }
.bld-quote { background: rgba(255,255,255,.04); border-inline-start: 3px solid #ffc44d; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #cfd6e4; }
.bld-quote small { color: #8b97ad; }

/* ---------- انتقال به دستگاه جدید ---------- */
.bld-transfer { display: grid; gap: 12px; color: #e7ecf5; }
.bld-transfer p { margin: 0; font-size: 13.5px; color: #cfd6e4; }
.bld-transfer .bld-t-steps { margin: 0; display: grid; gap: 6px; font-size: 13px; color: #cfd6e4; background: rgba(255,196,77,.06); border: 1px solid rgba(255,196,77,.25); border-radius: 13px; padding: 12px 34px 12px 14px; }
.bld-t-meta { font-size: 12.5px; color: #9aa6bd; }
.bld-t-meta b { color: #ffc44d; }
.bld-payload { direction: ltr; font-family: ui-monospace, Menlo, Consolas, monospace !important; font-size: 11px !important; line-height: 1.7; word-break: break-all; }
.bld-t-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.bld-t-btn { flex: 1; border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.07); color: #e7ecf5; border-radius: 12px; padding: 11px 14px; font-weight: 800; font-size: 13.5px; cursor: pointer; min-width: 150px; transition: border-color .15s, transform .15s; }
.bld-t-btn:hover { border-color: #ffc44d; transform: translateY(-1px); }
.bld-t-btn.is-primary { background: linear-gradient(135deg,#ffc44d,#ff8a5c); color: #241300; border-color: transparent; }
.bld-t-file { display: flex; align-items: center; gap: 10px; border: 1px dashed rgba(255,255,255,.22); border-radius: 12px; padding: 11px 14px; cursor: pointer; font-size: 13px; font-weight: 700; }
.bld-t-file:hover { border-color: #ffc44d; }
.bld-t-file small { color: #9aa6bd; font-weight: 400; }
.bld-t-conflict { background: rgba(255,196,77,.07); border: 1px solid rgba(255,196,77,.35); border-radius: 13px; padding: 13px 15px; display: grid; gap: 8px; font-size: 13px; }
.bld-t-conflict p { margin: 0; }
@media (max-width: 1250px) {
  .bld-app .bld-onb-grid { grid-template-columns: repeat(2,1fr); }
}

/* ---------- کانفتی ---------- */
.bld-confetti { position: fixed; inset: 0; z-index: 9999; pointer-events: none; overflow: hidden; }
.bld-confetti span { position: absolute; top: -40px; animation: bld-confetti-fall linear forwards; }
@keyframes bld-confetti-fall { to { transform: translateY(110vh) rotate(540deg); } }

/* ---------- پوسته و ساختار ---------- */
.bld-app .bld-b { display: grid; gap: 4px; }
.bld-app .bld-content { min-height: 300px; display: grid; gap: 4px; align-content: start; }
.bld-app .bld-onb { display: grid; gap: 4px; }
.bld-app .bld-facade-wrap { display: grid; gap: 4px; }
.bld-app .bld-pay-note { display: block; }

/* ---------- ریسپانسیو ---------- */
@media (max-width: 900px) {
  .bld-app .bld-hero { grid-template-columns: 1fr; padding: 22px; }
  .bld-app .bld-hero-art { display: none; }
  .bld-app .bld-onb-grid { grid-template-columns: 1fr; }
  .bld-app .bld-chat { grid-template-columns: 1fr; height: auto; }
  .bld-app .bld-threads { max-height: 220px; }
  .bld-app .bld-msgs { min-height: 300px; max-height: 420px; }
  .bld-app .bld-post-money { grid-template-columns: 1fr; }
  .bld-app .bld-fund-grid { grid-template-columns: 1fr 1fr; }
  .bld-app .bld-fund-main { grid-column: 1/-1; grid-row: auto; }
  .bld-app .bld-rep-grid { grid-template-columns: 1fr; }
  .bld-app .bld-slot-row, .bld-app .bld-mfloor { grid-template-columns: 1fr; }
  .bld-app .bld-back span { display: none; }
}
@media (max-width: 560px) {
  .bld-app .bld-fund-grid { grid-template-columns: 1fr; }
  .bld-app .bld-bal-hero { gap: 14px; }
  .bld-f-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .bld-app .bld-cloud, .bld-app .bld-star, .bld-app .bld-win-ring, .bld-app .bld-hero-cloud, .bld-app .bld-hero-bld i { animation: none !important; }
}

/* ---------- واکنش‌گرای تکمیلی موبایل ---------- */
@media (max-width: 640px) {
  .bld-app .bld-toolbar { flex-wrap: wrap; }
  .bld-app .bld-pay-actions { flex-wrap: wrap; }
  .bld-app .bld-composer { gap: 6px; padding: 10px; }
  .bld-app .bld-composer .bld-f-input{min-width:0}
  .bld-app .bld-my-grid { grid-template-columns: 1fr; }
  .bld-app .bld-hero { padding: 20px 16px; }
  .bld-app .bld-table-wrap { overflow-x: auto; }
  .bld-app .bld-table th, .bld-app .bld-table td { white-space: nowrap; }
  .bld-app .bld-t-btns .bld-t-btn { flex: 1 1 200px; }
}
`;
