// 🎨 ViXoRa Cockpit CSS — استایل اسکوپد داشبورد (dash-*)
// src/pages/tools/dashboard/dash-css.js

export const dashCss = /* css */ `
.dash-root{--d-c1:#8b5cf6;--d-c2:#ec4899;--d-bg1:#0b0620;--d-bg2:#1c0b38;
--d-text:#f3f1ff;--d-dim:rgba(243,241,255,.62);--d-card:rgba(255,255,255,.06);--d-card2:rgba(255,255,255,.1);
--d-border:rgba(255,255,255,.12);--d-shadow:0 18px 50px -18px rgba(0,0,0,.7);
position:relative;min-height:100%;padding:20px 20px 40px;border-radius:22px;color:var(--d-text);
background:linear-gradient(160deg,var(--d-bg1),var(--d-bg2));isolation:isolate}
.dash-root[data-theme="ocean"]{--d-c1:#38bdf8;--d-c2:#818cf8;--d-bg1:#020617;--d-bg2:#0b1e3a}
.dash-root[data-theme="sunset"]{--d-c1:#fb923c;--d-c2:#f43f5e;--d-bg1:#1a0a14;--d-bg2:#3b0f22}
.dash-root[data-theme="forest"]{--d-c1:#34d399;--d-c2:#a3e635;--d-bg1:#02241c;--d-bg2:#053b2c}
.dash-root[data-theme="royal"]{--d-c1:#fbbf24;--d-c2:#f472b6;--d-bg1:#17102b;--d-bg2:#2b1037}
.dash-root[data-theme="mono"]{--d-c1:#94a3b8;--d-c2:#e2e8f0;--d-bg1:#0f172a;--d-bg2:#1e293b}
.dash-root[data-density="compact"]{font-size:13px}
.dash-root[data-density="compact"] .dash-w-body{padding:10px}
.dash-bg{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;border-radius:22px}
.dash-bg i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.45;animation:dash-float 16s ease-in-out infinite}
.dash-bg i:nth-child(1){width:340px;height:340px;left:-80px;top:-80px;background:var(--d-c1)}
.dash-bg i:nth-child(2){width:280px;height:280px;right:-60px;top:20%;background:var(--d-c2);animation-delay:-6s}
.dash-bg i:nth-child(3){width:300px;height:300px;left:30%;bottom:-120px;background:var(--d-c1);animation-delay:-11s;opacity:.3}
@keyframes dash-float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-30px) scale(1.1)}}

/* هدر */
.dash-header{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.dash-logo{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;font-size:28px;
background:linear-gradient(135deg,var(--d-c1),var(--d-c2));box-shadow:0 10px 26px -10px var(--d-c1)}
.dash-title h1{margin:0;font-size:20px}
.dash-title span{font-size:12.5px;color:var(--d-dim)}
.dash-header-ops{margin-right:auto;display:flex;gap:8px;flex-wrap:wrap}
.dash-views{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.dash-view-btn{border:1px solid var(--d-border);background:var(--d-card);color:var(--d-text);border-radius:12px;
padding:9px 16px;font-size:13.5px;cursor:pointer;transition:all .15s;font-family:inherit}
.dash-view-btn:hover{background:var(--d-card2);transform:translateY(-1px)}
.dash-view-btn.is-on{background:linear-gradient(135deg,var(--d-c1),var(--d-c2));border:0;font-weight:800;
box-shadow:0 10px 26px -10px var(--d-c1)}

/* دکمه‌ها و فرم‌ها */
.dash-btn{border:1px solid var(--d-border);background:var(--d-card);color:var(--d-text);border-radius:12px;
padding:9px 16px;font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s}
.dash-btn:hover{background:var(--d-card2);transform:translateY(-1px)}
.dash-btn-primary{background:linear-gradient(135deg,var(--d-c1),var(--d-c2));border:0;font-weight:700}
.dash-btn-sm{padding:6px 12px;font-size:12px;border-radius:10px}
.dash-danger{border-color:rgba(244,63,94,.5);color:#fda4af}
.dash-icon-btn{background:var(--d-card);border:1px solid var(--d-border);color:var(--d-text);border-radius:9px;
min-width:30px;height:30px;font-size:14px;cursor:pointer;display:inline-grid;place-items:center}
.dash-icon-btn:hover{background:var(--d-card2)}
.dash-icon-btn.big{width:44px;height:44px;font-size:20px;border-radius:50%;
background:linear-gradient(135deg,var(--d-c1),var(--d-c2));border:0}
.dash-input,.dash-form select,.dash-form input,.dash-form textarea{background:rgba(0,0,0,.3);
border:1px solid var(--d-border);color:var(--d-text);border-radius:10px;padding:9px 11px;font-size:13px;
font-family:inherit;width:100%}
.dash-input:focus,.dash-form select:focus,.dash-form input:focus{border-color:var(--d-c1);outline:0}
.dash-form{display:flex;flex-direction:column;gap:10px}
.dash-form label{display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:var(--d-dim)}
.dash-check{flex-direction:row!important;align-items:center;gap:8px!important;cursor:pointer}
.dash-check input{width:18px;height:18px;accent-color:var(--d-c1)}
.dash-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
.dash-hidden{display:none!important}
.dash-empty{text-align:center;color:var(--d-dim);font-size:13px;padding:22px 10px;line-height:2}
.dash-hint{font-size:12px;color:var(--d-dim);line-height:2;margin-top:6px}
.dash-tips{margin:8px 0;padding-right:18px;line-height:2.1;font-size:13px}
.dash-verdict{font-size:14px;font-weight:700;background:rgba(139,92,246,.12);border:1px solid var(--d-c1);
border-radius:12px;padding:12px;margin:10px 0;text-align:center;line-height:2}
.dash-chip{font-size:12.5px;background:var(--d-card);border:1px solid var(--d-border);padding:8px 14px;
border-radius:99px;color:var(--d-text);cursor:pointer;font-family:inherit}
.dash-chip.is-exp{background:linear-gradient(135deg,#f43f5e,#fb923c);border:0}
.dash-chip.is-inc{background:linear-gradient(135deg,#34d399,#2dd4bf);border:0}
kbd{background:rgba(0,0,0,.4);border:1px solid var(--d-border);border-bottom-width:2px;border-radius:6px;
padding:1px 7px;font-size:11.5px;font-family:inherit;white-space:nowrap}
.pos{color:#6ee7b7!important}.neg{color:#fda4af!important}

/* گرید ویجت‌ها */
.dash-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
.dash-widget[data-size="s"]{grid-column:span 3}
.dash-widget[data-size="m"]{grid-column:span 4}
.dash-widget[data-size="l"]{grid-column:span 6}
.dash-widget[data-size="xl"]{grid-column:span 12}
@media (max-width:1200px){.dash-widget[data-size="s"]{grid-column:span 4}.dash-widget[data-size="m"]{grid-column:span 6}.dash-widget[data-size="l"]{grid-column:span 12}}
@media (max-width:760px){.dash-widget{grid-column:span 12!important}}
.dash-widget{background:var(--d-card);border:1px solid var(--d-border);border-radius:18px;overflow:hidden;
box-shadow:var(--d-shadow);min-width:0}
.dash-widget.dragging{opacity:.5;border-style:dashed}
.dash-w-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--d-border);
background:rgba(0,0,0,.18)}
.dash-w-drag{cursor:grab;color:var(--d-dim);letter-spacing:2px;font-size:12px}
.dash-w-title{font-size:13.5px;font-weight:800;flex:1}
.dash-w-ops{display:flex;gap:4px}
.dash-w-body{padding:14px}
.dash-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media (max-width:900px){.dash-grid-2{grid-template-columns:1fr}}
.dash-panel{background:var(--d-card);border:1px solid var(--d-border);border-radius:18px;padding:16px;margin-bottom:12px}
.dash-panel h4{margin:0 0 10px;font-size:14px}
.dash-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin:12px 0}
.dash-kpi{background:var(--d-card);border:1px solid var(--d-border);border-radius:14px;padding:11px 8px;
text-align:center;display:flex;flex-direction:column;gap:3px}
.dash-kpi span{font-size:11.5px;color:var(--d-dim)}
.dash-kpi b{font-size:14.5px}

/* خطوط و آمار */
.dash-rowline{display:flex;align-items:center;gap:8px;font-size:12.5px;padding:7px 8px;
border-bottom:1px dashed var(--d-border)}
.dash-rowline:last-child{border-bottom:0}
.dash-rowline.is-done .dash-t{text-decoration:line-through;opacity:.6}
.dash-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.dash-s{color:var(--d-dim);font-size:11.5px;white-space:nowrap}
.dash-n{font-variant-numeric:tabular-nums;font-weight:800;color:var(--d-c2);white-space:nowrap}
.dash-num{min-width:26px;text-align:center;font-weight:800;color:var(--d-c2)}
.dash-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:8px;margin-bottom:8px}
.dash-stats>div{background:rgba(0,0,0,.22);border:1px solid var(--d-border);border-radius:12px;padding:9px 4px;
text-align:center;display:flex;flex-direction:column;gap:2px}
.dash-stats b{font-size:16px}
.dash-stats span{font-size:11px;color:var(--d-dim)}
.dash-big{font-size:20px;font-weight:800;text-align:center;margin:8px 0}
.dash-big small{font-size:12px;font-weight:400;color:var(--d-dim)}
.dash-bar{height:9px;background:rgba(0,0,0,.35);border-radius:99px;overflow:hidden;margin:6px 0}
.dash-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--d-c1),var(--d-c2));border-radius:99px}
.dash-kv{display:flex;gap:8px;flex-wrap:wrap;font-size:12.5px;margin:4px 0}
.dash-kv span{background:rgba(0,0,0,.22);border:1px solid var(--d-border);border-radius:9px;padding:4px 10px}
.dash-goal{margin-bottom:10px}
.dash-goal-head{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px}
canvas[data-dash-chart],canvas[data-dash-chart2],canvas[data-report]{width:100%;background:rgba(0,0,0,.22);
border:1px solid var(--d-border);border-radius:14px}

/* سلام و ساعت */
.dash-greet b{font-size:16px}
.dash-date{color:var(--d-dim);font-size:12.5px;margin:4px 0 8px}
.dash-net{font-size:13.5px;font-weight:800;margin:8px 0}
.dash-clock{text-align:center}
.dash-clock b{font-size:34px;font-variant-numeric:tabular-nums;display:block}
.dash-clock>span{color:var(--d-dim);font-size:12.5px}
.dash-clock .dash-row{justify-content:center}
.dash-sw{margin-top:8px}
.dash-sw b{font-size:24px}
.dash-laps{display:flex;flex-direction:column;gap:3px;font-size:11.5px;color:var(--d-dim);margin-top:6px}

/* جستجو و نتایج */
.dash-search{width:100%;background:rgba(0,0,0,.3);border:1px solid var(--d-border);color:var(--d-text);
border-radius:12px;padding:11px 14px;font-size:13.5px;font-family:inherit}
.dash-search:focus{border-color:var(--d-c1);outline:0}
.dash-results{display:flex;flex-direction:column;gap:5px;margin-top:8px;max-height:300px;overflow:auto}
.dash-result{background:rgba(255,255,255,.04);border:1px solid var(--d-border);border-radius:11px;padding:8px 10px;
display:flex;gap:8px;align-items:center;color:var(--d-text);cursor:pointer;text-align:right;font-family:inherit;font-size:12.5px}
.dash-result:hover{border-color:var(--d-c1)}
.dash-result b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-result span{color:var(--d-dim);font-size:11.5px;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-result i{font-style:normal;font-size:10.5px;background:rgba(0,0,0,.3);padding:2px 8px;border-radius:99px}
.dash-qa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:8px}
.dash-qa{background:var(--d-card2);border:1px solid var(--d-border);border-radius:12px;padding:11px 6px;
color:var(--d-text);cursor:pointer;font-size:12.5px;font-family:inherit;transition:all .15s}
.dash-qa:hover{transform:translateY(-2px);border-color:var(--d-c1)}
.dash-fav{display:flex;gap:8px;align-items:center;margin-bottom:6px}
.dash-link{flex:1;background:none;border:1px solid var(--d-border);border-radius:10px;color:var(--d-text);
padding:8px 12px;cursor:pointer;text-align:right;font-family:inherit;font-size:13px}
.dash-link:hover{border-color:var(--d-c1)}

/* موزیک */
.dash-mn{display:flex;flex-direction:column;gap:8px}
.dash-mn-cover{width:100%;aspect-ratio:16/7;border-radius:12px;display:grid;place-items:center;font-size:40px;
background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(236,72,153,.25));border:1px solid var(--d-border)}
.dash-mn-info b{display:block;font-size:14px}
.dash-mn-info span{font-size:12px;color:var(--d-dim)}
.dash-mn-bar{height:6px;background:rgba(0,0,0,.4);border-radius:99px;margin-top:6px;overflow:hidden}
.dash-mn-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--d-c1),var(--d-c2))}
.dash-mn-time{display:flex;justify-content:space-between;font-size:11px;color:var(--d-dim)}
.dash-mn-ctl{display:flex;gap:8px;justify-content:center;align-items:center}
.dash-mn input[type="range"]{flex:1;accent-color:var(--d-c1)}

/* پومودورو/تاس/نقل‌قول */
.dash-pomo{text-align:center}
.dash-pomo b{font-size:32px;font-variant-numeric:tabular-nums;display:block}
.dash-pomo .dash-row{justify-content:center}
.dash-dice{text-align:center}
.dash-dice b{font-size:52px}
.dash-quote{font-size:14.5px;line-height:2.2;text-align:center}
.dash-quote span{display:block;font-size:12px;color:var(--d-dim);margin-top:4px}
.dash-calc{font-size:16px;text-align:center;direction:ltr}

/* فرمان‌یاب */
.dash-cmdk{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);
display:flex;justify-content:center;padding:12vh 16px 16px;animation:dash-fade .15s}
@keyframes dash-fade{from{opacity:0}}
.dash-cmdk-panel{width:min(620px,100%);max-height:70vh;display:flex;flex-direction:column;
background:#14101f;border:1px solid var(--d-c1);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.dash-cmdk-head{display:flex;gap:8px;align-items:center;padding:12px;border-bottom:1px solid var(--d-border)}
.dash-cmdk-head input{flex:1;background:rgba(0,0,0,.4);border:1px solid var(--d-border);color:#fff;
border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit}
.dash-cmdk-list{overflow:auto;padding:8px}
.dash-cmdk-item{width:100%;display:flex;gap:10px;align-items:center;background:none;border:1px solid transparent;
border-radius:11px;padding:10px;color:#fff;cursor:pointer;text-align:right;font-family:inherit;font-size:13.5px}
.dash-cmdk-item b{font-size:17px}
.dash-cmdk-item span{flex:1}
.dash-cmdk-item i{font-style:normal;font-size:11px;color:var(--d-dim)}
.dash-cmdk-item.is-sel{background:rgba(139,92,246,.2);border-color:var(--d-c1)}
.dash-cmdk-foot{padding:8px 14px;border-top:1px solid var(--d-border);font-size:11px;color:var(--d-dim)}
.dash-recent{color:var(--d-c2)!important}

/* گالری */
.dash-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;max-height:55vh;overflow:auto}
.dash-gal-card{background:var(--d-card);border:1px solid var(--d-border);border-radius:14px;padding:12px;
display:flex;flex-direction:column;gap:6px}
.dash-gal-card.is-on{border-color:var(--d-c1)}
.dash-gal-card b{font-size:13px}
.dash-gal-card span{font-size:11.5px;color:var(--d-dim);flex:1}
.dash-modal{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.6);display:flex;justify-content:center;
align-items:flex-start;padding:8vh 16px 16px;animation:dash-fade .15s}
.dash-modal-panel{width:min(760px,100%);max-height:82vh;overflow:auto;background:#14101f;
border:1px solid var(--d-border);border-radius:18px;padding:18px;position:relative}
.dash-modal-x{position:absolute;top:12px;left:12px}
.dash-modal-panel h3{margin:0 0 12px;font-size:16px}

/* راهنما */
.dash-guide-layout{display:grid;grid-template-columns:230px 1fr;gap:12px}
@media (max-width:820px){.dash-guide-layout{grid-template-columns:1fr}}
.dash-guide-nav{background:var(--d-card);border:1px solid var(--d-border);border-radius:16px;padding:10px;
display:flex;flex-direction:column;gap:4px;align-self:start;position:sticky;top:10px;max-height:80vh;overflow:auto}
.dash-guide-link{background:none;border:1px solid transparent;border-radius:10px;color:var(--d-text);
padding:9px 12px;cursor:pointer;text-align:right;font-family:inherit;font-size:13px}
.dash-guide-link:hover{background:var(--d-card2)}
.dash-guide-link.is-on{background:linear-gradient(135deg,var(--d-c1),var(--d-c2));font-weight:800}
.dash-guide-sec{background:var(--d-card);border:1px solid var(--d-border);border-radius:16px;padding:16px;margin-bottom:12px}
.dash-guide-sec h3{margin:0 0 10px;font-size:15px;color:var(--d-c2)}
.dash-guide-sec p,.dash-guide-sec li{font-size:13.5px;line-height:2.2}
.dash-guide-sec ul,.dash-guide-sec ol{margin:8px 0;padding-right:20px}
.dash-guide-search{margin-bottom:12px}

/* گزارش */
.dash-report-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}
.dash-report-head h2{margin:0;font-size:19px}
.dash-report-score{text-align:center;background:linear-gradient(135deg,var(--d-c1),var(--d-c2));
border-radius:16px;padding:10px 22px}
.dash-report-score b{font-size:26px;display:block}
.dash-report-score span{font-size:11.5px}

/* تنظیمات */
.dash-theme-row{display:flex;gap:8px}
.dash-swatch{width:38px;height:38px;border-radius:12px;border:2px solid transparent;cursor:pointer}
.dash-swatch.is-on{border-color:#fff;box-shadow:0 0 0 3px var(--d-c1)}

/* تور */
.dash-tour-mask{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9990}
.dash-tour-hl{position:relative;z-index:9991!important;box-shadow:0 0 0 4px var(--d-c1),0 0 40px var(--d-c1)!important;
border-radius:16px}
.dash-tour-card{position:fixed;z-index:9992;width:min(330px,calc(100vw - 20px));background:#1a1430;
border:1px solid var(--d-c1);border-radius:16px;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.dash-tour-card.is-mobile{bottom:12px;left:10px;right:10px;width:auto}
.dash-tour-card h4{margin:6px 0;font-size:15px}
.dash-tour-card p{font-size:13px;line-height:2.1;color:var(--d-dim)}
.dash-tour-progress{font-size:11px;color:var(--d-c2);font-weight:800}

/* اعتبار */
.dash-credit{position:fixed;inset:0;z-index:10000;background:radial-gradient(ellipse at center,#1a0b38 0%,#050310 70%);
display:grid;place-items:center;overflow:hidden;animation:dash-fade .4s}
.dash-credit canvas{position:absolute;inset:0}
.dash-credit-inner{position:relative;text-align:center;padding:20px;max-width:640px}
.dash-credit-kicker{font-size:15px;color:var(--d-dim);margin-bottom:10px;animation:dash-pop .6s .2s both}
.dash-credit-line{font-size:clamp(30px,6vw,54px);margin:10px 0;min-height:1.4em;
background:linear-gradient(90deg,#fbbf24,#ec4899,#8b5cf6,#38bdf8,#fbbf24);background-size:300% 100%;
-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
animation:dash-shine 4s linear infinite}
@keyframes dash-shine{to{background-position:300% 0}}
.dash-caret{animation:dash-blink 1s steps(1) infinite;-webkit-text-fill-color:#fff}
@keyframes dash-blink{50%{opacity:0}}
@keyframes dash-pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.dash-credit-sub{font-size:17px;opacity:0;transform:translateY(10px);transition:all .6s}
.dash-credit-sub.show{opacity:1;transform:none}
.dash-credit-sub b{color:#fbbf24}
.dash-credit-model{color:var(--d-dim);font-size:14px}
.dash-credit-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin:22px 0}
.dash-credit-stat{background:rgba(255,255,255,.07);border:1px solid var(--d-border);border-radius:14px;padding:12px 6px}
.dash-credit-stat b{font-size:22px;display:block;color:#fbbf24}
.dash-credit-stat span{font-size:11.5px;color:var(--d-dim)}
.dash-credit-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.dash-credit-hint{font-size:11.5px;color:var(--d-dim);margin-top:12px}

/* فوتر داشبورد */
.dash-footer{text-align:center;margin-top:20px;color:var(--d-dim);font-size:12.5px;line-height:2}
.dash-footer button{background:none;border:0;color:var(--d-c2);cursor:pointer;font-family:inherit;font-size:12.5px}

/* تمرکز ویجت */
.dash-focus-veil{position:fixed;inset:0;z-index:9995;background:rgba(0,0,0,.7);display:grid;place-items:center;padding:20px}
.dash-focus-panel{width:min(860px,100%);max-height:88vh;overflow:auto;background:#14101f;
border:1px solid var(--d-c1);border-radius:20px;padding:20px;position:relative}

@media print{
.dash-header-ops,.dash-views,.dash-footer,.no-print,.dash-w-ops,.dash-bg{display:none!important}
.dash-root{background:#fff;color:#000;border-radius:0}
.dash-widget,.dash-panel,.dash-guide-sec{break-inside:avoid;border-color:#ccc;background:#fff;color:#000}
}

/* ویجت‌های سری ۳ و ۴ */
.dash-moods{display:flex;gap:6px;justify-content:center;margin:8px 0}
.dash-mood{font-size:26px;background:var(--d-card);border:2px solid transparent;border-radius:12px;
width:48px;height:48px;cursor:pointer;transition:all .15s}
.dash-mood:hover{transform:scale(1.15)}
.dash-mood.is-on{border-color:var(--d-c1);background:var(--d-card2)}
.dash-rings{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px}
.dash-ringbox{text-align:center}
.dash-ringbox span{font-size:11px;color:var(--d-dim)}
.dash-gameday{text-align:center;display:flex;flex-direction:column;gap:6px;margin-bottom:8px}
.dash-gameday b{font-size:16px}
.dash-gameday span{font-size:12px;color:var(--d-dim);line-height:1.9}
.dash-lyrics-now{display:flex;flex-direction:column;gap:6px;text-align:center;min-height:90px;justify-content:center}
.dash-lyrics-now b{font-size:16px;color:var(--d-c2)}
.dash-lyrics-now .dim{opacity:.5;font-size:12.5px}
.dash-lyrics-now span{font-size:13px}
/* دستورپخت‌ها */
.dash-recipe{background:var(--d-card);border:1px solid var(--d-border);border-radius:16px;padding:16px;margin-bottom:12px}
.dash-recipe h3{margin:0 0 6px;font-size:15px}
.dash-recipe ol{margin:8px 0;padding-right:20px;line-height:2.2;font-size:13.5px}
.dash-recipe .dash-diff{font-size:11px;background:rgba(0,0,0,.3);padding:2px 10px;border-radius:99px;margin-right:8px}
.dash-diff-easy{color:#6ee7b7}.dash-diff-mid{color:#fcd34d}.dash-diff-hard{color:#fda4af}
/* واژه‌نامه */
.dash-gloss{background:var(--d-card);border:1px solid var(--d-border);border-radius:12px;padding:10px 14px;margin-bottom:8px}
.dash-gloss b{color:var(--d-c2)}
.dash-gloss p{margin:4px 0 0;font-size:13px;line-height:2;color:var(--d-dim)}
/* نقل‌قول اعتبار */
.dash-credit-quote{font-size:15px;color:var(--d-dim);margin:14px 0;opacity:0;transition:opacity .8s;min-height:24px}
.dash-credit-quote.show{opacity:1}
/* اسکرول‌بار */
.dash-root ::-webkit-scrollbar{width:9px;height:9px}
.dash-root ::-webkit-scrollbar-track{background:transparent}
.dash-root ::-webkit-scrollbar-thumb{background:rgba(139,92,246,.4);border-radius:99px}
.dash-root ::-webkit-scrollbar-thumb:hover{background:rgba(139,92,246,.7)}
/* انیمیشن ورود ویجت */
@keyframes dash-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.dash-widget{animation:dash-in .35s both}
.dash-grid .dash-widget:nth-child(2){animation-delay:.03s}
.dash-grid .dash-widget:nth-child(3){animation-delay:.06s}
.dash-grid .dash-widget:nth-child(4){animation-delay:.09s}
.dash-grid .dash-widget:nth-child(n+5){animation-delay:.12s}
.dash-root[data-anim="off"] .dash-widget{animation:none}
.dash-root[data-anim="off"] .dash-bg i{animation:none}
/* درخشش */
@keyframes dash-glow{0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.4)}50%{box-shadow:0 0 24px 4px rgba(139,92,246,.35)}}
.dash-view-btn.is-on{animation:dash-glow 3s infinite}
/* چاپ */
@media print{
.dash-cmdk,.dash-modal,.dash-tour-mask,.dash-tour-card,.dash-credit,.dash-gallery-grid{display:none!important}
.dash-views{break-after:avoid}
}

/* ---------- پل تم جدید ---------- */
.dash-root[data-theme="violet"],.dash-root[data-theme="ocean"],.dash-root[data-theme="forest"],.dash-root[data-theme="sunset"],.dash-root[data-theme="rose"],.dash-root[data-theme="midnight"],.dash-root[data-theme="gold"],.dash-root[data-theme="mint"],.dash-root[data-theme="paper"],.dash-root[data-theme="candy"],.dash-root[data-theme="custom"]{--d-c1:var(--d1,#8b5cf6);--d-c2:var(--d2,#ec4899);--d-bg1:var(--dbg,#0f0c29);--d-bg2:var(--dbg,#0f0c29);--d-text:var(--dtx,#f4f1ff)}
.dash-root.dash-light{--d-card:rgba(0,0,0,.05);--d-card2:rgba(0,0,0,.09);--d-border:rgba(0,0,0,.14);--d-dim:rgba(20,10,40,.62);--d-shadow:0 18px 50px -22px rgba(80,60,140,.35)}
.dash-root.dash-light .dash-bg i{opacity:.25}
/* ---------- بج اعلان ---------- */
.dash-notify-badge{display:inline-block;min-width:18px;height:18px;line-height:18px;text-align:center;font-size:11px;font-weight:800;background:#ef4444;color:#fff;border-radius:9px;padding:0 5px;margin-right:4px;animation:dash-pop .3s}
@keyframes dash-pop{from{transform:scale(.4)}to{transform:scale(1)}}
/* ---------- تست‌ها ---------- */
.dash-toasts{position:fixed;bottom:18px;left:18px;z-index:10002;display:flex;flex-direction:column;gap:8px;max-width:min(340px,90vw)}
.dash-toast{display:flex;gap:10px;align-items:center;background:#1c1436;color:#f4f1ff;border:1px solid var(--d-c1,#8b5cf6);border-radius:14px;padding:11px 15px;font-size:13.5px;box-shadow:0 14px 40px -10px rgba(0,0,0,.7);cursor:pointer;animation:dash-toast-in .3s}
.dash-toast.out{opacity:0;transform:translateY(8px);transition:.35s}
@keyframes dash-toast-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* ---------- مرکز اعلان ---------- */
.dash-notify-wrap{display:flex;flex-direction:column;gap:12px}
.dash-notify-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-notify-list{display:flex;flex-direction:column;gap:8px}
.dash-notify-item{display:flex;gap:12px;align-items:flex-start;background:var(--d-card);border:1px solid var(--d-border);border-radius:14px;padding:11px 14px;cursor:pointer;transition:.2s}
.dash-notify-item:hover{background:var(--d-card2)}
.dash-notify-item.unread{border-color:var(--d-c1);box-shadow:inset 3px 0 0 var(--d-c1)}
.dash-notify-ic{font-size:22px}
.dash-notify-tx{flex:1;display:flex;flex-direction:column;gap:2px}
.dash-notify-tx small{color:var(--d-dim)}
.dash-notify-ts{font-size:11px;opacity:.75}
/* ---------- گالری تم ---------- */
.dash-theme-wrap{display:flex;flex-direction:column;gap:14px}
.dash-theme-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-theme-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.dash-theme-card{position:relative;display:flex;flex-direction:column;gap:8px;align-items:center;background:var(--cb,#222);color:var(--ct,#fff);border:2px solid transparent;border-radius:16px;padding:14px 10px;cursor:pointer;transition:.2s}
.dash-theme-card:hover{transform:translateY(-2px)}
.dash-theme-card.on{border-color:var(--ct,#fff);box-shadow:0 0 0 3px var(--c1)}
.dash-theme-prev{display:flex;gap:5px}
.dash-theme-prev i{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--c1),var(--c2))}
.dash-theme-prev i:nth-child(2){background:var(--c1)}
.dash-theme-prev i:nth-child(3){background:var(--c2)}
.dash-theme-nm{font-size:12.5px;font-weight:700}
.dash-theme-on{position:absolute;top:6px;left:6px;background:#22c55e;color:#fff;width:22px;height:22px;border-radius:50%;font-size:13px;line-height:22px}
.dash-theme-custom{background:var(--d-card);border:1px solid var(--d-border);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px}
.dash-theme-custom label{display:flex;align-items:center;gap:6px;font-size:12.5px}
.dash-theme-custom input[type=color]{width:36px;height:30px;border:none;border-radius:8px;background:none;cursor:pointer}
.dash-theme-dots{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px}
.dash-dot{width:26px;height:26px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:.2s}
.dash-dot:hover{transform:scale(1.15)}
.dash-dot.on{border-color:#fff;box-shadow:0 0 0 2px var(--d-c1)}
/* ---------- مرکز خروجی ---------- */
.dash-xp-wrap{display:flex;flex-direction:column;gap:14px}
.dash-xp-head{font-size:15px}
.dash-xp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.dash-xp-card{display:flex;flex-direction:column;gap:6px;align-items:center;background:var(--d-card);border:1px solid var(--d-border);border-radius:16px;padding:16px 10px;cursor:pointer;color:inherit;transition:.2s}
.dash-xp-card:hover{background:var(--d-card2);transform:translateY(-2px);border-color:var(--d-c1)}
.dash-xp-ic{font-size:28px}
.dash-xp-card small{color:var(--d-dim);font-size:11.5px}
.dash-xp-import{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:var(--d-card);border:1px dashed var(--d-border);border-radius:14px;padding:12px 14px}
/* ---------- تحلیل شخصی ---------- */
.dash-an-wrap{display:flex;flex-direction:column;gap:12px}
.dash-an-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-an-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.dash-an-parts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.dash-an-parts span{background:var(--d-card);border:1px solid var(--d-border);border-radius:8px;padding:3px 9px;font-size:12px}
.dash-ring-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:6px 0}
.dash-ring-wrap{display:flex;flex-direction:column;align-items:center;gap:2px}
.dash-ring{width:64px;height:64px}
.dash-ring-wrap small{font-size:11px;color:var(--d-dim)}
.dash-streak-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--d-border);font-size:13px}
.dash-streak-row:last-child{border:none}
.dash-goal-row{display:flex;flex-direction:column;gap:6px;padding:8px 0;border-bottom:1px dashed var(--d-border)}
.dash-goal-row:last-child{border:none}
.dash-spark{width:100%;height:40px;margin-top:6px}
/* ---------- خودکارها ---------- */
.dash-auto-wrap{display:flex;flex-direction:column;gap:12px}
.dash-auto-head{display:flex;justify-content:space-between;align-items:center}
.dash-auto-list{display:flex;flex-direction:column;gap:8px}
.dash-auto-row{display:flex;gap:12px;align-items:center;background:var(--d-card);border:1px solid var(--d-border);border-radius:14px;padding:10px 14px;opacity:.55;transition:.2s}
.dash-auto-row.on{opacity:1;border-color:var(--d-c1)}
.dash-auto-ic{font-size:22px}
.dash-auto-tx{flex:1;display:flex;flex-direction:column}
.dash-auto-tx small{color:var(--d-dim)}
.dash-switch{width:46px;height:26px;border-radius:13px;background:rgba(128,128,128,.35);border:none;cursor:pointer;position:relative;transition:.2s;flex-shrink:0}
.dash-switch i{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}
.dash-switch.on{background:#22c55e}
.dash-switch.on i{right:23px}
/* ---------- ویجت‌های سری ۵ ---------- */
.dash-fact{font-size:13.5px;line-height:1.9}
.dash-quote{font-size:14px;line-height:2;font-style:italic;text-align:center}
.dash-breathe{display:flex;justify-content:center;margin:4px 0}
.dash-breathe span{font-size:40px;display:inline-block}
.dash-breathe.on span{animation:dash-breathe 8s ease-in-out infinite}
@keyframes dash-breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.5);opacity:1}}
.dash-big small{font-size:13px;color:var(--d-dim);font-weight:400}
/* ---------- متفرقه ---------- */
.dash-hint{font-size:12px;color:var(--d-dim)}
.dash-bar{height:8px;background:rgba(128,128,128,.25);border-radius:4px;overflow:hidden;margin-top:6px}
.dash-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--d-c1),var(--d-c2));border-radius:4px;transition:width .5s}
.dash-swatch{font-size:15px}

/* ---------- ریموت موزیک ---------- */
.dash-rm-wrap{display:flex;flex-direction:column;gap:12px}
.dash-rm-head{display:flex;justify-content:space-between;align-items:center}
.dash-rm-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:12px}
@media(max-width:900px){.dash-rm-grid{grid-template-columns:1fr}}
.dash-rm-now{display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center}
.dash-rm-cover{width:150px;height:150px;border-radius:20px;background:linear-gradient(135deg,var(--d-c1),var(--d-c2));display:flex;align-items:center;justify-content:center;font-size:56px;overflow:hidden;box-shadow:var(--d-shadow)}
.dash-rm-cover img{width:100%;height:100%;object-fit:cover}
.dash-rm-meta b{font-size:17px;display:block}
.dash-rm-meta small{display:block;color:var(--d-dim)}
.dash-rm-seek{width:100%;accent-color:var(--d-c1);cursor:pointer}
.dash-rm-times{display:flex;justify-content:space-between;width:100%;font-size:12px;color:var(--d-dim)}
.dash-rm-transport{display:flex;gap:8px;align-items:center}
.dash-rm-transport .dash-btn{font-size:17px;padding:9px 14px}
.dash-rm-transport .is-on{outline:2px solid var(--d-c1)}
.dash-rm-play{font-size:22px!important;border-radius:50%!important;width:56px;height:56px;padding:0!important}
.dash-rm-sliders{width:100%;display:flex;flex-direction:column;gap:6px}
.dash-rm-sliders label{display:flex;gap:8px;align-items:center;font-size:12px}
.dash-rm-sliders input{flex:1;accent-color:var(--d-c1)}
.dash-rm-sliders span{min-width:44px;text-align:left}
.dash-rm-lyric{background:var(--d-card);border:1px solid var(--d-border);border-radius:12px;padding:9px 14px;font-size:13.5px;width:100%;min-height:40px}
.dash-rm-side{display:flex;flex-direction:column;gap:12px}
.dash-rm-eq{display:flex;flex-wrap:wrap;gap:6px}
.dash-rm-queue{display:flex;flex-direction:column;gap:5px;max-height:300px;overflow:auto}
.dash-rm-q{display:flex;gap:8px;align-items:center;background:var(--d-card);border:1px solid var(--d-border);border-radius:10px;padding:6px 9px;font-size:12.5px}
.dash-rm-q.cur{border-color:var(--d-c1)}
.dash-rm-q-n{min-width:22px;text-align:center;color:var(--d-dim)}
.dash-rm-q-t{flex:1;display:flex;flex-direction:column;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-rm-q-t small{color:var(--d-dim)}
/* ---------- ژورنال ---------- */
.dash-j-wrap{display:flex;flex-direction:column;gap:12px}
.dash-j-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-j-date{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-j-strip{display:flex;gap:6px;overflow-x:auto;padding:4px 2px 8px}
.dash-j-day{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:56px;background:var(--d-card);border:1px solid var(--d-border);border-radius:12px;padding:7px 4px;cursor:pointer;color:inherit;font-size:11px}
.dash-j-day i{font-style:normal;color:var(--d-dim);font-size:10px}
.dash-j-day b{font-size:15px}
.dash-j-day u{text-decoration:none;font-size:14px;height:18px}
.dash-j-day.has{border-color:var(--d-c2)}
.dash-j-day.on{border-color:var(--d-c1);background:var(--d-card2);box-shadow:0 0 0 2px var(--d-c1)}
.dash-j-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.dash-j-picks{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.dash-j-pick{display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--d-card);border:2px solid var(--d-border);border-radius:12px;padding:8px 6px;min-width:58px;cursor:pointer;color:inherit;font-size:22px}
.dash-j-pick small{font-size:10px;color:var(--d-dim)}
.dash-j-pick.on{border-color:var(--d-c1);background:var(--d-card2)}
.dash-j-prompt{color:var(--d-c1);font-weight:700}
.dash-input{width:100%;background:var(--d-card);border:1px solid var(--d-border);border-radius:10px;padding:8px 11px;color:inherit;font-family:inherit;font-size:13px;margin-top:6px;resize:vertical}
.dash-input:focus{outline:2px solid var(--d-c1);border-color:var(--d-c1)}

/* ---------- تقویم ---------- */
.dash-cal-wrap{display:flex;flex-direction:column;gap:12px}
.dash-cal-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-cal-chips{display:flex;gap:8px;flex-wrap:wrap}
.dash-cal-grid{background:var(--d-card);border:1px solid var(--d-border);border-radius:16px;padding:12px}
.dash-cal-wd{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}
.dash-cal-wd span{text-align:center;font-size:12px;color:var(--d-dim)}
.dash-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.dash-cal-wd{grid-column:1/-1}
.dash-cal-empty{min-height:52px}
.dash-cal-day{display:flex;flex-direction:column;align-items:center;gap:0;background:rgba(128,128,128,.08);border:1px solid transparent;border-radius:12px;padding:6px 2px;cursor:pointer;color:inherit;min-height:52px;transition:.15s}
.dash-cal-day:hover{border-color:var(--d-c1)}
.dash-cal-day b{font-size:14px}
.dash-cal-day small{font-size:10px;height:14px;letter-spacing:-1px}
.dash-cal-day.today b{color:var(--d-c1)}
.dash-cal-day.has{background:rgba(128,128,128,.16)}
.dash-cal-day.on{border-color:var(--d-c1);box-shadow:0 0 0 2px var(--d-c1)}
.dash-cal-evs{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.dash-cal-ev{display:flex;gap:9px;align-items:center;background:var(--d-card);border:1px solid var(--d-border);border-radius:10px;padding:7px 11px;font-size:13px}
/* ---------- عادت‌ها ---------- */
.dash-hb-wrap{display:flex;flex-direction:column;gap:12px}
.dash-hb-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-hb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.dash-hb-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.dash-hb-map{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:9px}
.dash-hb-map i{aspect-ratio:1.4;border-radius:4px;background:rgba(128,128,128,.18)}
.dash-hb-map i.on{background:linear-gradient(135deg,#f97316,#ef4444);box-shadow:0 0 6px rgba(239,68,68,.5)}
.dash-hb-rules{margin:6px 0 0;padding-right:18px;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.9}

/* ---------- اتاق تمرکز ---------- */
.dash-fx-wrap{display:flex;flex-direction:column;gap:12px}
.dash-fx-head{display:flex;justify-content:space-between;align-items:center}
.dash-fx-quote{background:linear-gradient(135deg,var(--d-c1),var(--d-c2));border-radius:16px;padding:18px;text-align:center;font-size:16px;line-height:2;display:flex;flex-direction:column;gap:6px;align-items:center}
.dash-fx-quote small{opacity:.85;font-size:12px}
.dash-fx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.dash-fx-pomo{text-align:center}
.dash-fx-pomo .dash-big{font-size:44px}
.dash-fx-task{font-size:15px;font-weight:800;background:var(--d-card);border:1px solid var(--d-c1);border-radius:12px;padding:10px 13px;margin-top:6px}
.dash-fx-amb{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.dash-btn.is-on{outline:2px solid var(--d-c1)}

/* ---------- بینش‌ها ---------- */
.dash-in-wrap{display:flex;flex-direction:column;gap:10px}
.dash-in-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.dash-in-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
.dash-in-card{border-right:4px solid var(--d-c1)}
.dash-in-card.good{border-color:#22c55e}
.dash-in-card.warn{border-color:#f59e0b}
.dash-in-card.bad{border-color:#ef4444}
.dash-in-card.info{border-color:#38bdf8}
.dash-in-top{display:flex;gap:8px;align-items:center}
.dash-in-ic{font-size:24px}
.dash-in-top b{flex:1}
.dash-in-lvl{font-size:11px;color:var(--d-dim);white-space:nowrap}
.dash-in-card p{font-size:13px;line-height:1.9;color:var(--d-dim);margin:6px 0}
/* ---------- هیت‌مپ حال ژورنال ---------- */
.dash-hb-map i.m1{background:#38bdf8}
.dash-hb-map i.m2{background:#34d399}
.dash-hb-map i.m3{background:#facc15}
.dash-hb-map i.m4{background:#fb923c}
.dash-hb-map i.m5{background:#ef4444}

/* ---------- ماتریس آیزنهاور ---------- */
.dash-eis{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dash-eis-q{background:var(--d-card);border:1px solid var(--d-border);border-radius:12px;padding:9px;display:flex;flex-direction:column;gap:6px}
.dash-eis-q b{font-size:12px}
.dash-eis-q span{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;background:rgba(128,128,128,.12);border-radius:8px;padding:3px 8px;margin-bottom:3px}
.dash-eis-q input{flex:1;background:rgba(128,128,128,.12);border:1px solid var(--d-border);border-radius:8px;padding:5px 8px;color:inherit;font-family:inherit;font-size:12px;min-width:0}

/* ---------- نمودارهای رشته‌ای ---------- */
.dash-svg-spark{display:block;margin-top:6px}
.dash-svg-bars{display:flex;flex-direction:column;gap:5px;margin-top:6px}
.dash-svg-bar-row{display:grid;grid-template-columns:minmax(60px,90px) 1fr auto;gap:8px;align-items:center;font-size:12px}
.dash-svg-bar-l{color:var(--d-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-svg-bar-t{height:10px;background:rgba(128,128,128,.2);border-radius:5px;overflow:hidden}
.dash-svg-bar-t i{display:block;height:100%;border-radius:5px;transition:width .5s}
.dash-svg-bar-v{font-size:12px;min-width:40px;text-align:left}
.dash-svg-donut{display:flex;gap:12px;align-items:center;margin-top:6px}
.dash-svg-donut-c{width:84px;height:84px;border-radius:50%;flex-shrink:0;position:relative}
.dash-svg-donut-c::after{content:'';position:absolute;inset:20px;background:var(--d-bg1,#0f0c29);border-radius:50%}
.dash-svg-donut-l{display:flex;flex-direction:column;gap:4px;font-size:12px}
.dash-svg-donut-l i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-left:5px}
/* ---------- دستاوردها ---------- */
.dash-ac-wrap{display:flex;flex-direction:column;gap:10px}
.dash-ac-head{display:flex;justify-content:space-between;align-items:center}
.dash-ac-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.dash-ac-card{display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center;border-radius:16px;padding:14px 10px}
.dash-ac-card.on{border:1px solid #f59e0b;background:linear-gradient(160deg,rgba(245,158,11,.14),transparent)}
.dash-ac-card.lock{opacity:.55;filter:grayscale(.6)}
.dash-ac-ic{font-size:34px}
.dash-ac-card small{color:var(--d-dim);font-size:11.5px}

/* ---------- هاب اهداف ---------- */
.dash-gls-wrap{display:flex;flex-direction:column;gap:10px}
.dash-gls-head{display:flex;justify-content:space-between;align-items:center}
.dash-gls-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}

/* ---------- مرور شبانه ---------- */
.dash-rv-wrap{display:flex;flex-direction:column;gap:10px}
.dash-rv-head{display:flex;justify-content:space-between;align-items:center}
.dash-rv-list{display:flex;flex-direction:column;gap:10px}
.dash-rv-card{transition:.2s}
.dash-rv-card.done{opacity:.75;border-color:#22c55e}
.dash-rv-top{display:flex;gap:10px;align-items:center}
.dash-rv-n{width:30px;height:30px;border-radius:50%;background:var(--d-card2);display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0}
.dash-rv-top div:nth-child(2){flex:1}
.dash-rv-body{margin-top:8px;display:flex;flex-direction:column;gap:6px}
/* ---------- واکنش‌گرایی نهایی ---------- */
@media(max-width:700px){
.dash-root{padding:12px 12px 30px}
.dash-header-ops{flex-wrap:wrap}
.dash-views{overflow-x:auto;padding-bottom:4px}
.dash-view-btn{white-space:nowrap}
.dash-an-grid,.dash-gls-grid,.dash-hb-grid,.dash-rm-grid,.dash-in-list{grid-template-columns:1fr!important}
.dash-cal-day{min-height:44px}
.dash-j-day{min-width:50px}
.dash-toasts{left:12px;right:12px;max-width:none}
.dash-eis{grid-template-columns:1fr}
}
/* ---------- چاپ نهایی ---------- */
@media print{
.dash-root{background:#fff!important;color:#000!important}
.dash-bg,.dash-views,.dash-header-ops,.dash-footer,.no-print,.dash-toasts,.dash-w-ops,.dash-btn,.dash-icon-btn{display:none!important}
.dash-widget,.dash-card,.dash-panel{break-inside:avoid;border:1px solid #ccc!important;background:#fff!important}
}

/* ---------- لاگ تغییرات ---------- */
.dash-cl-wrap{display:flex;flex-direction:column;gap:10px}
.dash-cl-card.new{border-color:#f59e0b}
.dash-cl-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dash-cl-title{font-size:16px;margin:4px 0}
.dash-cl-card ul{margin:6px 0 0;padding-right:20px;display:flex;flex-direction:column;gap:4px;font-size:13px;line-height:1.9}
/* ---------- آجندا ---------- */
.dash-ag-day{background:var(--d-card);border:1px solid var(--d-border);border-radius:12px;padding:9px 12px;margin-bottom:7px;display:flex;flex-direction:column;gap:5px}
.dash-ag-day b{color:var(--d-c1)}

/* ---------- ویزارد خوش‌آمد ---------- */
.dash-wc-panel{max-width:560px;text-align:center}
.dash-wc-hero{font-size:56px;animation:dash-float 3s ease-in-out infinite}
.dash-wc-step{margin:14px 0;text-align:right}
.dash-wc-step b{display:block;margin-bottom:8px}
.dash-wc-packs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dash-wc-pack{background:var(--d-card);border:2px solid var(--d-border);border-radius:14px;padding:10px;cursor:pointer;color:inherit;text-align:right;display:flex;flex-direction:column;gap:3px;transition:.15s}
.dash-wc-pack small{color:var(--d-dim);font-size:11px}
.dash-wc-pack.on{border-color:var(--d-c1);background:var(--d-card2)}
@media(max-width:500px){.dash-wc-packs{grid-template-columns:1fr}}
`;