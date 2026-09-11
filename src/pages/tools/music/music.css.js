// src/pages/tools/music/music.css.js

/**
 * ViXoRa Music Page — استایل اسکوپد (mx-*)
 * ۴ تم: neon / midnight / sunset / emerald
 */

export const musicCss = /* css */ `
.mx-root{--mx-bg1:#0b0620;--mx-bg2:#1c0b38;--mx-accent:#8b5cf6;--mx-accent2:#ec4899;--mx-glow:rgba(139,92,246,.45);
--mx-text:#f3f1ff;--mx-dim:rgba(243,241,255,.6);--mx-card:rgba(255,255,255,.06);--mx-card2:rgba(255,255,255,.1);
--mx-border:rgba(255,255,255,.12);--mx-shadow:0 18px 50px -18px rgba(0,0,0,.7);
position:relative;min-height:100%;padding:22px 22px 30px;border-radius:22px;overflow:hidden;color:var(--mx-text);
background:linear-gradient(160deg,var(--mx-bg1),var(--mx-bg2));isolation:isolate}
.mx-root[data-music-theme="midnight"]{--mx-bg1:#020617;--mx-bg2:#0b1e3a;--mx-accent:#38bdf8;--mx-accent2:#818cf8;--mx-glow:rgba(56,189,248,.4)}
.mx-root[data-music-theme="sunset"]{--mx-bg1:#1a0a14;--mx-bg2:#3b0f22;--mx-accent:#fb923c;--mx-accent2:#f43f5e;--mx-glow:rgba(251,146,60,.4)}
.mx-root[data-music-theme="emerald"]{--mx-bg1:#02241c;--mx-bg2:#053b2c;--mx-accent:#34d399;--mx-accent2:#a3e635;--mx-glow:rgba(52,211,153,.4)}

/* پس‌زمینه متحرک */
.mx-bg{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.mx-bg i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;animation:mx-float 14s ease-in-out infinite}
.mx-bg i:nth-child(1){width:420px;height:420px;left:-120px;top:-120px;background:var(--mx-accent)}
.mx-bg i:nth-child(2){width:360px;height:360px;right:-100px;top:20%;background:var(--mx-accent2);animation-delay:-5s}
.mx-bg i:nth-child(3){width:300px;height:300px;left:30%;bottom:-140px;background:var(--mx-accent);animation-delay:-9s}
@keyframes mx-float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.12)}}

/* دراپ‌اور آپلود (pointer-events:none تا خودش هدف درگ نشود و شمارنده به‌هم نریزد) */
.mx-drop{position:absolute;inset:0;z-index:60;display:grid;place-items:center;background:rgba(5,2,20,.7);backdrop-filter:blur(6px);pointer-events:none}
.mx-drop[hidden]{display:none}
.mx-drop__box{border:2px dashed var(--mx-accent);border-radius:24px;padding:40px 56px;text-align:center;font-size:18px;
display:flex;flex-direction:column;gap:8px;align-items:center;background:rgba(255,255,255,.05);box-shadow:0 0 60px var(--mx-glow);animation:mx-pulse 1.2s ease-in-out infinite}
.mx-drop__close{pointer-events:auto;margin-top:8px;border:1px solid var(--mx-border);background:rgba(255,255,255,.1);color:var(--mx-text);
border-radius:10px;padding:7px 18px;font-size:13px;font-weight:700;cursor:pointer}
.mx-drop__close:hover{background:rgba(255,255,255,.22)}
@keyframes mx-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}

/* سربرگ */
.mx-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px}
.mx-head__brand{display:flex;align-items:center;gap:12px}
.mx-logo{width:52px;height:52px;border-radius:18px;display:grid;place-items:center;font-size:28px;
background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));box-shadow:0 10px 30px -8px var(--mx-glow);position:relative}
.mx-logo::after{content:'';position:absolute;inset:-4px;border-radius:22px;border:2px solid var(--mx-accent);opacity:.5;animation:mx-ring 2.4s ease-out infinite}
@keyframes mx-ring{0%{transform:scale(.9);opacity:.7}100%{transform:scale(1.15);opacity:0}}
.mx-head__title{margin:0;font-size:22px;font-weight:800}
.mx-head__badge{font-size:11px;font-weight:700;background:rgba(255,255,255,.14);padding:3px 10px;border-radius:99px;vertical-align:middle}
.mx-head__sub{margin:2px 0 0;font-size:12.5px;color:var(--mx-dim)}
.mx-head__actions{display:flex;gap:8px;flex-wrap:wrap}

/* دکمه‌ها */
.mx-btn{border:1px solid var(--mx-border);background:var(--mx-card);color:var(--mx-text);border-radius:12px;
padding:9px 16px;font-size:13.5px;font-weight:700;cursor:pointer;transition:transform .15s ease,box-shadow .2s,background .2s;backdrop-filter:blur(8px)}
.mx-btn:hover{background:var(--mx-card2);transform:translateY(-1px);box-shadow:var(--mx-shadow)}
.mx-btn:active{transform:translateY(0) scale(.98)}
.mx-btn--primary{background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));border:0;box-shadow:0 10px 26px -10px var(--mx-glow)}
.mx-btn--primary:hover{filter:brightness(1.12)}
.mx-btn--danger{border-color:rgba(244,63,94,.5);color:#fda4af}
.mx-btn--danger:hover{background:rgba(244,63,94,.15)}
.mx-btn--liked{border-color:rgba(244,114,182,.6);background:rgba(244,114,182,.14)}
.mx-btn--sm{padding:6px 12px;font-size:12.5px;border-radius:10px}
.mx-btn--icon{padding:9px 12px;font-size:16px}
.mx-btn:disabled{opacity:.6;cursor:wait;transform:none}
.mx-iconbtn{width:34px;height:34px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--mx-text);
font-size:16px;cursor:pointer;display:inline-grid;place-items:center;transition:background .2s,transform .15s}
.mx-iconbtn:hover{background:rgba(255,255,255,.12);transform:scale(1.1)}
.mx-iconbtn.is-on{background:rgba(255,255,255,.16);border-color:var(--mx-accent);box-shadow:0 0 14px -4px var(--mx-glow)}
.mx-link{background:none;border:0;color:var(--mx-accent2);font-weight:700;cursor:pointer;font-size:13px}
.mx-link:hover{text-decoration:underline}
.mx-dim{color:var(--mx-dim);font-size:12.5px}
.mx-warn{font-size:11px;color:#fbbf24;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);padding:2px 8px;border-radius:99px}

/* تب‌ها */
.mx-tabs{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 12px;margin-bottom:6px;scrollbar-width:thin}
.mx-tab{flex:0 0 auto;display:flex;align-items:center;gap:8px;border:1px solid var(--mx-border);background:var(--mx-card);
color:var(--mx-text);border-radius:14px;padding:9px 16px;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .2s}
.mx-tab:hover{background:var(--mx-card2)}
.mx-tab.is-active{background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));border:0;box-shadow:0 10px 26px -10px var(--mx-glow);transform:translateY(-1px)}
.mx-tab__icon{font-size:16px}
.mx-tab__badge{font-size:11px;background:rgba(0,0,0,.3);padding:1px 8px;border-radius:99px}

.mx-content{min-height:300px;animation:mx-fadeup .35s ease}
@keyframes mx-fadeup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* تولبار آهنگ‌ها */
.mx-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
.mx-search{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;background:var(--mx-card);
border:1px solid var(--mx-border);border-radius:12px;padding:9px 14px}
.mx-search input{flex:1;background:none;border:0;outline:0;color:var(--mx-text);font-size:13.5px}
.mx-search input::placeholder{color:var(--mx-dim)}
.mx-select{background:var(--mx-card);border:1px solid var(--mx-border);color:var(--mx-text);border-radius:12px;padding:9px 12px;font-size:13px;cursor:pointer}
.mx-select option{background:#1a1035;color:#fff}
.mx-seg{display:flex;background:var(--mx-card);border:1px solid var(--mx-border);border-radius:12px;overflow:hidden}
.mx-seg__btn{border:0;background:none;color:var(--mx-text);padding:9px 14px;font-size:12.5px;font-weight:700;cursor:pointer;opacity:.65}
.mx-seg__btn.is-active{background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));opacity:1}
.mx-bulkrow{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}

/* ردیف آهنگ */
.mx-rows{display:flex;flex-direction:column;gap:8px}
.mx-row{display:flex;align-items:center;gap:12px;background:var(--mx-card);border:1px solid var(--mx-border);
border-radius:16px;padding:10px 14px;cursor:pointer;transition:transform .15s,background .2s,border-color .2s,box-shadow .2s}
.mx-row:hover{background:var(--mx-card2);transform:translateX(-3px);border-color:var(--mx-accent)}
.mx-row.is-current{border-color:var(--mx-accent);background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.04));box-shadow:0 0 24px -8px var(--mx-glow)}
.mx-row.is-missing{opacity:.75;border-style:dashed}
.mx-row__idx{width:30px;text-align:center;font-size:13px;color:var(--mx-dim);flex:0 0 auto}
.mx-row__meta{flex:1;min-width:0}
.mx-row__title{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:8px}
.mx-row__sub{font-size:12px;color:var(--mx-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.mx-row__tags{display:flex;gap:6px;align-items:center}
.mx-mini{font-size:11.5px;background:rgba(255,255,255,.09);padding:3px 9px;border-radius:99px;white-space:nowrap}
.mx-row__ops{display:flex;gap:2px;align-items:center}
.mx-row__ops .mx-iconbtn{width:30px;height:30px;font-size:14px}

/* اکولایزر مینی (ردیف در حال پخش) */
.mx-eqmini{display:inline-flex;align-items:flex-end;gap:2px;height:16px}
.mx-eqmini i{width:3px;border-radius:2px;background:linear-gradient(180deg,var(--mx-accent2),var(--mx-accent));animation:mx-eqmini 1s ease-in-out infinite}
.mx-eqmini i:nth-child(1){height:60%}.mx-eqmini i:nth-child(2){height:100%;animation-delay:.15s}
.mx-eqmini i:nth-child(3){height:40%;animation-delay:.3s}.mx-eqmini i:nth-child(4){height:80%;animation-delay:.45s}
@keyframes mx-eqmini{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
.mx-root:not(.mx-is-playing) .mx-eqmini i{animation-play-state:paused;transform:scaleY(.4)}

/* کاور */
.mx-cover{border-radius:12px;display:grid;place-items:center;overflow:hidden;color:#fff;font-weight:800;flex:0 0 auto;position:relative}
.mx-cover span{font-size:18px;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.mx-cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mx-row__cover{width:46px;height:46px}
.mx-bar__cover{width:52px;height:52px}
.mx-cover--lg{width:100%;aspect-ratio:1;font-size:30px;border-radius:18px}
.mx-cover--xl{width:190px;height:190px;border-radius:22px;box-shadow:var(--mx-shadow)}
.mx-cover--xl span{font-size:64px}

/* کارت‌ها */
.mx-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:20px}
.mx-card{background:var(--mx-card);border:1px solid var(--mx-border);border-radius:18px;padding:12px;cursor:pointer;
color:var(--mx-text);text-align:right;transition:transform .18s,box-shadow .2s,border-color .2s}
.mx-card:hover{transform:translateY(-4px);box-shadow:var(--mx-shadow);border-color:var(--mx-accent)}
.mx-card__cover{position:relative}
.mx-card__count{position:absolute;bottom:8px;left:8px;font-size:11px;background:rgba(0,0,0,.6);padding:3px 10px;border-radius:99px;backdrop-filter:blur(4px)}
.mx-card__title{font-weight:800;font-size:14px;margin-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mx-card__sub{font-size:12px;color:var(--mx-dim);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mx-secbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 0 12px;flex-wrap:wrap}
.mx-secbar h3{margin:0;font-size:16px}
.mx-back{background:none;border:0;color:var(--mx-dim);cursor:pointer;font-size:13.5px;font-weight:700;margin-bottom:12px}
.mx-back:hover{color:var(--mx-text)}

/* جزئیات کالکشن */
.mx-detail{display:flex;gap:18px;align-items:center;background:var(--mx-card);border:1px solid var(--mx-border);
border-radius:20px;padding:18px;margin-bottom:16px;flex-wrap:wrap}
.mx-detail__meta{flex:1;min-width:220px}
.mx-detail__meta h2{margin:0 0 4px;font-size:22px}
.mx-detail__meta p{margin:3px 0}

/* نمای در حال پخش */
.mx-now{display:grid;grid-template-columns:minmax(280px,420px) 1fr;gap:26px;align-items:start}
.mx-now__stage{display:flex;flex-direction:column;gap:16px;align-items:center}
.mx-vinylwrap{position:relative;width:min(300px,70vw);aspect-ratio:1}
.mx-vinylwrap--big{width:min(340px,72vw)}
.mx-vinyl{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 50%,#000 0 18%,#16121f 19% 100%);
box-shadow:0 24px 70px -18px rgba(0,0,0,.9),0 0 50px -18px var(--mx-glow);transition:transform .5s}
.mx-vinylwrap.is-playing .mx-vinyl{animation:mx-spin 6s linear infinite}
@keyframes mx-spin{to{transform:rotate(360deg)}}
.mx-vinyl__disc{position:absolute;inset:0;border-radius:50%;
background:repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.05) 0 2px,transparent 2px 5px)}
.mx-vinyl__label{position:absolute;inset:31%;border-radius:50%;display:grid;place-items:center;overflow:hidden;
color:#fff;font-size:30px;font-weight:800;border:4px solid rgba(0,0,0,.55)}
.mx-vinyl__label::after{content:'';position:absolute;width:12px;height:12px;border-radius:50%;background:#0b0620;border:2px solid #fff}
.mx-vinyl__label img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mx-vinyl__glow{position:absolute;inset:-16px;border-radius:50%;background:conic-gradient(from 0deg,var(--mx-accent),transparent 30%,var(--mx-accent2),transparent 60%,var(--mx-accent));
filter:blur(26px);opacity:.35;z-index:-1;animation:mx-spin 10s linear infinite reverse}
.mx-vinylwrap:not(.is-playing) .mx-vinyl__glow{animation-play-state:paused;opacity:.15}
.mx-tonearm{position:absolute;top:-8px;left:6px;width:90px;height:90px;z-index:2;transform-origin:20px 20px;transform:rotate(-32deg);transition:transform .8s cubic-bezier(.3,1.4,.4,1)}
.mx-vinylwrap.is-playing .mx-tonearm{transform:rotate(8deg)}
.mx-tonearm::before{content:'';position:absolute;top:8px;left:8px;width:26px;height:26px;border-radius:50%;
background:radial-gradient(circle,#e8e8f0,#888);box-shadow:0 4px 10px rgba(0,0,0,.5)}
.mx-tonearm i{position:absolute;top:18px;left:20px;width:8px;height:76px;border-radius:6px;
background:linear-gradient(180deg,#e8e8f0,#777);transform-origin:top center;transform:rotate(24deg)}
.mx-now__visual{width:100%}
.mx-visual{width:100%;height:120px;background:rgba(0,0,0,.3);border:1px solid var(--mx-border);border-radius:16px}
.mx-now__live{text-align:center;font-size:11.5px;color:var(--mx-dim);margin-top:6px}
.mx-now__info{min-width:0}
.mx-now__kicker{font-size:12px;color:var(--mx-accent2);font-weight:800;letter-spacing:.5px}
.mx-now__title{margin:6px 0;font-size:clamp(22px,3.4vw,34px);font-weight:900;overflow:hidden}
.mx-now__artist{font-size:15px;color:var(--mx-dim);margin-bottom:12px}
.mx-now__chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.mx-chip{font-size:12px;background:var(--mx-card2);border:1px solid var(--mx-border);padding:5px 12px;border-radius:99px}
.mx-chip--sm{font-size:10.5px;padding:2px 8px;background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));border:0}
.mx-now__row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.mx-stars{color:#facc15;letter-spacing:1px}
.mx-stars span{opacity:.25}
.mx-stars span.on{opacity:1;text-shadow:0 0 8px #facc15}

/* مارکی */
.mx-marquee{display:inline-block;max-width:100%;overflow:hidden;vertical-align:bottom}
.mx-marquee__track{display:inline-flex;gap:48px;white-space:nowrap;animation:mx-marquee 12s linear infinite}
@keyframes mx-marquee{0%{transform:translateX(0)}100%{transform:translateX(50%)}}

/* متن آهنگ */
.mx-lyrics{background:rgba(0,0,0,.25);border:1px solid var(--mx-border);border-radius:16px;padding:14px 16px}
.mx-lyrics__head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.mx-lyrics__body{font-size:13.5px;line-height:2.2;max-height:220px;overflow-y:auto;white-space:pre-wrap;scrollbar-width:thin}

/* آمار */
.mx-stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:8px}
.mx-stat{background:var(--mx-card);border:1px solid var(--mx-border);border-radius:18px;padding:16px 10px;text-align:center;transition:transform .18s}
.mx-stat:hover{transform:translateY(-3px);border-color:var(--mx-accent)}
.mx-stat__icon{font-size:26px}
.mx-stat__value{font-size:20px;font-weight:900;margin:4px 0}
.mx-stat__label{font-size:12px;color:var(--mx-dim)}
.mx-panel{background:var(--mx-card);border:1px solid var(--mx-border);border-radius:18px;padding:16px;margin-bottom:8px}
.mx-bar-row{display:grid;grid-template-columns:minmax(110px,200px) 1fr auto;gap:10px;align-items:center;padding:7px 0}
.mx-bar-row__label{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mx-bar-row__label small{color:var(--mx-dim);font-weight:400}
.mx-bar-row__track{height:10px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.mx-bar-row__track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--mx-accent),var(--mx-accent2));
box-shadow:0 0 12px var(--mx-glow);animation:mx-grow .8s cubic-bezier(.2,.9,.3,1)}
.mx-bar-row__track i.alt{background:linear-gradient(90deg,#22d3ee,#818cf8)}
.mx-bar-row__track i.hot{background:linear-gradient(90deg,#f59e0b,#ef4444)}
@keyframes mx-grow{from{width:0!important}}
.mx-bar-row__value{font-size:12px;color:var(--mx-dim);white-space:nowrap}
.mx-themes{display:flex;gap:8px;flex-wrap:wrap}

/* نوار پخش */
.mx-bar{position:sticky;bottom:10px;z-index:40;margin-top:18px;display:flex;align-items:center;gap:14px;
background:linear-gradient(150deg,rgba(22,14,50,.92),rgba(40,10,60,.92));border:1px solid var(--mx-border);
border-radius:20px;padding:12px 16px;backdrop-filter:blur(20px);box-shadow:var(--mx-shadow)}
.mx-bar__idle{width:100%;text-align:center;font-size:14px;color:var(--mx-dim);padding:10px}
.mx-bar__song{flex:0 1 260px;min-width:0;display:flex;align-items:center;gap:10px;cursor:pointer;border-radius:14px;padding:4px}
.mx-bar__song:hover{background:rgba(255,255,255,.06)}
.mx-bar__meta{flex:1;min-width:0}
.mx-bar__title{font-size:13.5px;font-weight:800;overflow:hidden}
.mx-bar__artist{font-size:12px;color:var(--mx-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mx-bar__center{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.mx-bar__controls{display:flex;align-items:center;justify-content:center;gap:4px}
.mx-playbtn{width:48px;height:48px;border-radius:50%;border:0;font-size:19px;color:#fff;cursor:pointer;
background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));box-shadow:0 10px 26px -8px var(--mx-glow);
display:grid;place-items:center;transition:transform .15s;position:relative}
.mx-playbtn:hover{transform:scale(1.07)}
.mx-playbtn.is-playing::after{content:'';position:absolute;inset:-5px;border-radius:50%;border:2px solid var(--mx-accent2);opacity:.6;animation:mx-ring 1.8s ease-out infinite}
.mx-playbtn--big{width:64px;height:64px;font-size:24px}
.mx-bar__seek{display:flex;align-items:center;gap:10px}
.mx-time{font-size:11.5px;color:var(--mx-dim);min-width:44px;text-align:center;font-variant-numeric:tabular-nums}
.mx-bar__side{display:flex;align-items:center;gap:6px}

/* رنج */
.mx-range{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;height:20px}
.mx-range--seek{flex:1}
.mx-range--vol{width:90px}
.mx-range::-webkit-slider-runnable-track{height:6px;border-radius:99px;background:rgba(255,255,255,.16)}
.mx-range::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;margin-top:-5px;
background:linear-gradient(135deg,var(--mx-accent2),#fff);box-shadow:0 0 12px var(--mx-glow);transition:transform .15s}
.mx-range::-webkit-slider-thumb:hover{transform:scale(1.25)}
.mx-range::-moz-range-track{height:6px;border-radius:99px;background:rgba(255,255,255,.16)}
.mx-range::-moz-range-thumb{width:16px;height:16px;border:0;border-radius:50%;background:#fff;box-shadow:0 0 12px var(--mx-glow)}

/* حالت تهی */
.mx-empty{text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:10px}
.mx-empty__icon{font-size:56px;animation:mx-floaty 3s ease-in-out infinite}
@keyframes mx-floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.mx-empty__title{font-size:18px;font-weight:800}
.mx-empty__hint{font-size:13px;color:var(--mx-dim);max-width:420px;line-height:2}

/* حالت فراگیر — سطح body (بیرون از stacking context صفحه) تا زیر منو نرود */
.mx-immersive{position:fixed;inset:0;z-index:8900;display:flex;align-items:center;justify-content:center;
background:radial-gradient(ellipse at 50% 30%,#241040,#070313 75%);overflow:hidden;
--mx-bg1:#0b0620;--mx-bg2:#1c0b38;--mx-accent:#8b5cf6;--mx-accent2:#ec4899;--mx-glow:rgba(139,92,246,.45);
--mx-text:#f3f1ff;--mx-dim:rgba(243,241,255,.6);--mx-card:rgba(255,255,255,.06);--mx-card2:rgba(255,255,255,.1);--mx-border:rgba(255,255,255,.12)}
.mx-immersive[data-music-theme="midnight"]{--mx-bg1:#020617;--mx-bg2:#0b1e3c;--mx-accent:#38bdf8;--mx-accent2:#818cf8;--mx-glow:rgba(56,189,248,.4)}
.mx-immersive[data-music-theme="sunset"]{--mx-bg1:#1a0a14;--mx-bg2:#3b0f22;--mx-accent:#fb923c;--mx-accent2:#f43f5e;--mx-glow:rgba(251,146,60,.4)}
.mx-immersive[data-music-theme="emerald"]{--mx-bg1:#02241c;--mx-bg2:#053b2c;--mx-accent:#34d399;--mx-accent2:#a3e635;--mx-glow:rgba(52,211,153,.4)}
.mx-im__bg{position:absolute;inset:0;overflow:hidden}
.mx-im__bg i{position:absolute;border-radius:50%;filter:blur(110px);opacity:.55;animation:mx-float 10s ease-in-out infinite}
.mx-im__bg i:nth-child(1){width:50vw;height:50vw;left:-10vw;top:-10vw;background:var(--mx-accent)}
.mx-im__bg i:nth-child(2){width:44vw;height:44vw;right:-8vw;bottom:-8vw;background:var(--mx-accent2);animation-delay:-4s}
.mx-im__bg i:nth-child(3){width:30vw;height:30vw;left:35vw;bottom:-10vw;background:var(--mx-accent);animation-delay:-7s}
.mx-im__close{position:absolute;top:18px;left:18px;z-index:2;background:rgba(255,255,255,.1);border:1px solid var(--mx-border);
color:#fff;border-radius:12px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer}
.mx-im__close:hover{background:rgba(255,255,255,.2)}
.mx-im__core{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:12px;width:min(560px,92vw);color:#fff}
.mx-im__title{margin:6px 0 0;font-size:clamp(20px,4vw,30px);text-align:center}
.mx-im__artist{color:rgba(255,255,255,.65);font-size:14px}
.mx-visual--big{height:160px;width:100%}
.mx-im__controls{display:flex;align-items:center;gap:10px}
.mx-im__controls .mx-iconbtn{width:44px;height:44px;font-size:19px;background:rgba(255,255,255,.1)}
.mx-im__seek{display:flex;align-items:center;gap:10px;width:100%}
.mx-im__seek .mx-time{color:rgba(255,255,255,.7)}

/* اسپینر */
.mx-spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;
display:inline-block;animation:mx-spin .7s linear infinite;vertical-align:-4px}
.mx-spinner--sm{width:14px;height:14px}

/* فرم‌های مودال */
.mx-form{display:flex;flex-direction:column;gap:12px}
.mx-form__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mx-form__inline{display:flex;gap:8px}
.mx-field{display:flex;flex-direction:column;gap:6px}
.mx-field__label{font-size:12.5px;font-weight:700;opacity:.85}
.mx-field input[type="text"],.mx-field input[type="url"],.mx-field input[type="number"],.mx-field select,.mx-field textarea,.mx-input{
background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:#f2f5ff;border-radius:10px;
padding:10px 12px;font-size:13.5px;outline:0;width:100%;box-sizing:border-box;font-family:inherit}
.mx-field textarea{resize:vertical;line-height:1.9}
.mx-field select option{background:#1a1035}
.mx-field input:focus,.mx-field select:focus,.mx-field textarea:focus,.mx-input:focus{border-color:var(--mx-accent,#8b5cf6);box-shadow:0 0 0 3px rgba(139,92,246,.2)}
.mx-hint{font-size:12.5px;line-height:2;background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.2);
border-radius:10px;padding:8px 12px;color:#d7dcf0}
.mx-check{display:flex;align-items:center;gap:8px;font-size:13.5px;cursor:pointer}
.mx-check input{width:18px;height:18px;accent-color:#8b5cf6}
.mx-menu{display:flex;flex-direction:column;gap:6px}
.mx-menu__item{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#f2f5ff;border-radius:12px;
padding:11px 14px;font-size:13.5px;font-weight:700;cursor:pointer;text-align:right;transition:background .2s}
.mx-menu__item:hover{background:rgba(255,255,255,.13)}
.mx-menu__item.is-danger{color:#fda4af;border-color:rgba(244,63,94,.4)}
.mx-menu__item small{opacity:.6}
.mx-picklist{display:flex;flex-direction:column;gap:6px;max-height:320px;overflow-y:auto}
.mx-pickitem{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
border-radius:10px;padding:8px 12px;cursor:pointer;font-size:13px}
.mx-pickitem:hover{background:rgba(255,255,255,.1)}
.mx-pickitem input{width:17px;height:17px;accent-color:#8b5cf6}
.mx-pickitem__t{font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mx-pickitem__a{opacity:.6;font-size:12px;white-space:nowrap}
.mx-coverrow{display:flex;gap:14px;align-items:center}
.mx-coverrow__ops{display:flex;flex-direction:column;gap:8px}
.mx-rate{display:flex;gap:4px;align-items:center}
.mx-rate button{background:none;border:0;font-size:26px;color:rgba(255,255,255,.25);cursor:pointer;transition:transform .15s}
.mx-rate button.on{color:#facc15;text-shadow:0 0 12px #facc15}
.mx-rate button:hover{transform:scale(1.2)}
.mx-rate__clear{font-size:12px!important;color:rgba(255,255,255,.5)!important}
.mx-eqpresets{display:flex;gap:6px;flex-wrap:wrap}
.mx-eqbands{display:flex;flex-direction:column;gap:10px}
.mx-eqband{display:grid;grid-template-columns:70px 1fr 40px;gap:10px;align-items:center;background:rgba(255,255,255,.04);
border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 12px}
.mx-eqband span{font-size:12px;font-weight:700}
.mx-eqband b{font-size:12px;text-align:left;color:#a5b4fc}
.mx-eqband input{width:100%}
.mx-pick{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#f2f5ff;border-radius:10px;
padding:9px;font-size:13px;font-weight:700;cursor:pointer}
.mx-pick.is-active{background:linear-gradient(135deg,#7c3aed,#db2777);border:0}

/* ریسپانسیو */
@media (max-width:900px){
.mx-now{grid-template-columns:1fr}
.mx-bar{flex-wrap:wrap}
.mx-bar__center{flex:1 1 100%;order:3}
.mx-bar__song{flex:1}
}
@media (max-width:560px){
.mx-root{padding:14px 12px 20px}
.mx-head__title{font-size:18px}
.mx-bar__hide-sm{display:none}
.mx-row__tags{display:none}
.mx-form__grid{grid-template-columns:1fr}
.mx-bar-row{grid-template-columns:1fr;gap:4px}
.mx-detail{flex-direction:column;text-align:center}
}

/* ---------- واکنش‌گرای تکمیلی موبایل ---------- */
@media (max-width:560px){
.mx-form__inline{flex-wrap:wrap}
.mx-coverrow{flex-wrap:wrap}
.mx-drop__box{padding:26px 20px;font-size:15px;border-radius:18px}
.mx-im__core{width:min(560px,94vw);gap:8px}
.mx-im__close{top:12px;left:12px;padding:8px 14px}
.mx-bar{bottom:calc(84px + env(safe-area-inset-bottom,0px));gap:8px}
}
@media (max-width:420px){
.mx-cards{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.mx-stats-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
}

/* ================= ماژول‌های توسعه: شعر/آزمایشگاه/رادیو/استودیو ================= */
.mx-btn-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;align-items:center}
.mx-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media (max-width:900px){.mx-grid-2{grid-template-columns:1fr}}
.mx-form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin:10px 0}
.mx-form-grid label{display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:var(--mx-dim)}
.mx-form-grid input,.mx-form-grid select,.mx-form-grid textarea{background:rgba(0,0,0,.3);border:1px solid var(--mx-border);color:var(--mx-text);border-radius:10px;padding:9px 10px;font-size:13px;font-family:inherit}
.mx-form-grid input:focus,.mx-form-grid select:focus,.mx-form-grid textarea:focus{border-color:var(--mx-accent);outline:0;box-shadow:0 0 0 3px rgba(139,92,246,.2)}
input.mx-search{width:100%;background:rgba(0,0,0,.3);border:1px solid var(--mx-border);color:var(--mx-text);border-radius:12px;padding:10px 14px;font-size:13.5px;font-family:inherit;display:block}
input.mx-search:focus{border-color:var(--mx-accent);outline:0}
.mx-secbar-actions{display:flex;gap:8px;flex-wrap:wrap}
.mx-hint-inline{font-size:12.5px;color:var(--mx-dim)}
.mx-inline{display:flex;align-items:center;gap:8px}
.mx-inline input[type="range"]{flex:1;accent-color:var(--mx-accent)}
.mx-hidden{display:none!important}
.mx-progress{height:10px;background:rgba(0,0,0,.35);border-radius:99px;overflow:hidden;margin:10px 0;border:1px solid var(--mx-border)}
.mx-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--mx-accent),var(--mx-accent2));transition:width .25s}
.mx-tips{margin:8px 0;padding-right:18px;line-height:2.1;font-size:13px}
.mx-num{font-variant-numeric:tabular-nums;color:var(--mx-accent2);font-weight:800;min-width:34px;text-align:center}
.mx-badge{font-size:11.5px;background:var(--mx-card2);border:1px solid var(--mx-border);padding:3px 10px;border-radius:99px;white-space:nowrap}
.mx-badge.mx-ok{border-color:rgba(52,211,153,.5);color:#6ee7b7}
.mx-badge.mx-bad{border-color:rgba(244,63,94,.5);color:#fda4af}
.mx-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.mx-chip{cursor:pointer;transition:all .15s;color:var(--mx-text)}
.mx-chip:hover{border-color:var(--mx-accent);transform:translateY(-1px)}
.mx-chip.is-on{background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));border:0;box-shadow:0 6px 18px -6px var(--mx-glow)}
.mx-chip-custom{border-style:dashed}
.mx-stats-row{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}
.mx-stats-row .mx-stat{flex:1;min-width:110px;padding:10px 8px;font-size:12.5px}
.mx-panel h4{margin:14px 0 8px;font-size:14px}
.mx-panel h4:first-child{margin-top:0}

/* ---- ردیف‌های آزمایشگاه ---- */
.mx-lab-list{display:flex;flex-direction:column;gap:6px;max-height:420px;overflow:auto;margin-top:8px}
.mx-lab-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border:1px solid var(--mx-border);border-radius:12px;padding:8px 12px;font-size:13px}
.mx-lab-row.is-sel{border-color:var(--mx-accent);background:rgba(139,92,246,.12)}
.mx-lab-row input[type="checkbox"]{width:17px;height:17px;accent-color:var(--mx-accent);flex:0 0 auto}
.mx-lab-title{font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mx-lab-sub{color:var(--mx-dim);font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mx-lab-plays{color:var(--mx-dim);font-size:12px;white-space:nowrap}

/* ---- تکراری ---- */
.mx-dup-row{display:flex;align-items:center;gap:8px;font-size:12.5px;padding:8px;border-bottom:1px dashed var(--mx-border);flex-wrap:wrap}
.mx-dup-row span:first-child{font-weight:700;flex:1;min-width:180px}
.mx-dup-meta{color:var(--mx-dim);font-size:11.5px;flex:1;min-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ---- نواقص ---- */
.mx-miss-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin:12px 0}
.mx-miss-card{background:var(--mx-card);border:1px solid var(--mx-border);border-radius:16px;padding:14px 8px;display:flex;flex-direction:column;gap:4px;align-items:center;color:var(--mx-text);cursor:pointer;transition:all .15s}
.mx-miss-card:hover{transform:translateY(-2px);border-color:var(--mx-accent)}
.mx-miss-card b{font-size:22px;color:var(--mx-accent2)}
.mx-miss-card span{font-size:12px;color:var(--mx-dim)}

/* ---- کاور ---- */
.mx-cover-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:10px}
.mx-cover-card{background:var(--mx-card);border:1px solid var(--mx-border);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center}
.mx-cover-card b{font-size:12.5px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mx-cover-card span{font-size:11.5px;color:var(--mx-dim)}
.mx-cover-box{width:100%;aspect-ratio:1;border-radius:12px;display:grid;place-items:center;font-size:34px;background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(236,72,153,.25));background-size:cover;background-position:center;border:1px solid var(--mx-border)}
.mx-cover-box.has-img{font-size:0}

/* ---- کشف ---- */
.mx-discover-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:10px 0}
.mx-discover{background:var(--mx-card);border:1px solid var(--mx-border);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;gap:4px;align-items:center;color:var(--mx-text);cursor:pointer;font-size:24px;transition:all .15s}
.mx-discover:hover{transform:translateY(-2px) scale(1.02);border-color:var(--mx-accent2)}
.mx-discover b{font-size:13px}
.mx-discover span{font-size:11px;color:var(--mx-dim)}

/* ---- شعر ---- */
.mx-lx-now{font-size:14px;line-height:2.4;text-align:center}
.mx-lx-line{padding:8px 10px;border-radius:12px;transition:all .25s;color:var(--mx-text);opacity:.85}
.mx-lx-line.is-active{background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(236,72,153,.25));border:1px solid var(--mx-accent);font-weight:800;font-size:16px;opacity:1;box-shadow:0 8px 24px -8px var(--mx-glow)}
.mx-lx-line.is-past{opacity:.45}
.mx-lx-line .mx-t{font-size:10.5px;color:var(--mx-dim);margin-left:8px;font-variant-numeric:tabular-nums}
.mx-lx-line.is-due{border-color:var(--mx-accent2)}
.mx-karaoke-fonts{display:flex;gap:6px;align-items:center}
.mx-lx-editor{width:100%;min-height:220px;background:rgba(0,0,0,.35);border:1px solid var(--mx-border);color:var(--mx-text);border-radius:14px;padding:14px;font-size:14px;line-height:2.1;font-family:inherit;resize:vertical}
.mx-lx-editor:focus{border-color:var(--mx-accent);outline:0}
.mx-star-btn{background:none;border:0;font-size:22px;cursor:pointer;opacity:.35;transition:all .12s;padding:2px 4px}
.mx-star-btn.on{opacity:1;transform:scale(1.15);text-shadow:0 0 12px #facc15}
.mx-ab-a{border-color:rgba(52,211,153,.6)!important}
.mx-ab-b{border-color:rgba(244,63,94,.6)!important}

/* ---- همگام‌ساز ---- */
.mx-sync-stage{text-align:center}
.mx-sync-current{font-size:22px;font-weight:800;min-height:64px;display:grid;place-items:center;background:rgba(0,0,0,.3);border:1px solid var(--mx-accent);border-radius:16px;padding:14px;margin:10px 0}
.mx-sync-next{color:var(--mx-dim);font-size:13px;min-height:22px}
.mx-sync-tap{font-size:18px!important;padding:14px 40px!important}
.mx-sync-list{max-height:200px;overflow:auto;margin-top:10px}
.mx-sync-line{display:flex;gap:10px;align-items:center;font-size:12.5px;padding:6px 10px;border-bottom:1px dashed var(--mx-border)}
.mx-sync-line.is-cur{background:rgba(139,92,246,.15);border-radius:8px}
.mx-sync-line .mx-t{font-variant-numeric:tabular-nums;color:var(--mx-accent2);min-width:44px}
.mx-sync-line button{margin-right:auto}

/* ---- استودیو ---- */
.mx-eq-row{display:flex;gap:6px;justify-content:space-between;margin:12px 0}
.mx-eq-band{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid var(--mx-border);border-radius:12px;padding:10px 4px}
.mx-eq-band input[type="range"]{writing-mode:vertical-lr;direction:rtl;width:22px;height:110px;accent-color:var(--mx-accent);cursor:pointer}
.mx-eq-band b{font-size:12px;color:var(--mx-accent2);font-variant-numeric:tabular-nums}
.mx-eq-band span{font-size:11px;color:var(--mx-dim)}
.mx-visual{height:180px}
.mx-input{flex:1;min-width:140px}
canvas[data-rd="goal-chart"]{width:100%;height:120px;background:rgba(0,0,0,.25);border:1px solid var(--mx-border);border-radius:14px}
canvas[data-lab="gauge"]{width:100%;height:150px}
`;