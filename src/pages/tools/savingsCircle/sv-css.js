// 🎨 ViXoRa Savings CSS — فین‌تک پریمیوم تیره
// src/pages/tools/savingsCircle/sv-css.js

export const svCss = /* css */ `
.sv-root{--g1:#10b981;--g2:#f59e0b;--v1:#8b5cf6;--v2:#ec4899;--card:rgba(255,255,255,.055);--card2:rgba(255,255,255,.1);--bd:rgba(255,255,255,.12);--tx:#f4f2ff;--dim:rgba(244,242,255,.6);--ok:#34d399;--bad:#fb7185;--warn:#fbbf24;position:relative;min-height:100%;padding:22px 22px 46px;border-radius:24px;color:var(--tx);background:linear-gradient(165deg,#070b1d,#101736 45%,#1b0f2e);isolation:isolate;overflow:hidden}
.sv-blobs{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.sv-blobs i{position:absolute;border-radius:50%;filter:blur(100px);opacity:.4;animation:sv-float 18s ease-in-out infinite}
.sv-blobs i:nth-child(1){width:380px;height:380px;left:-100px;top:-100px;background:#10b981}
.sv-blobs i:nth-child(2){width:300px;height:300px;right:-70px;top:24%;background:#8b5cf6;animation-delay:-6s}
.sv-blobs i:nth-child(3){width:320px;height:320px;left:32%;bottom:-140px;background:#f59e0b;animation-delay:-11s;opacity:.28}
@keyframes sv-float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(34px,-30px) scale(1.12)}}
@keyframes sv-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.sv-in{animation:sv-in .4s both}
.sv-in-1{animation-delay:.05s}.sv-in-2{animation-delay:.1s}.sv-in-3{animation-delay:.15s}.sv-in-4{animation-delay:.2s}
/* سربرگ */
.sv-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.sv-logo{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;font-size:30px;background:linear-gradient(135deg,var(--g1),#0ea5e9);box-shadow:0 12px 30px -10px #10b981}
.sv-head h1{margin:0;font-size:20px}
.sv-head p{margin:2px 0 0;font-size:12.5px;color:var(--dim)}
.sv-head .sv-sp{flex:1}
/* دکمه‌ها */
.sv-btn{position:relative;overflow:hidden;border:1px solid var(--bd);background:var(--card);color:var(--tx);border-radius:13px;padding:10px 17px;font-size:13.5px;cursor:pointer;font-family:inherit;transition:.18s}
.sv-btn:hover{background:var(--card2);transform:translateY(-2px);box-shadow:0 10px 24px -10px rgba(0,0,0,.7)}
.sv-btn:active{transform:scale(.95)}
.sv-btn.primary{background:linear-gradient(135deg,#059669,#0ea5e9);border:0;font-weight:800}
.sv-btn.gold{background:linear-gradient(135deg,#b45309,#f59e0b);border:0;font-weight:800;color:#fff}
.sv-btn.violet{background:linear-gradient(135deg,var(--v1),var(--v2));border:0;font-weight:800}
.sv-btn.danger{border-color:rgba(251,113,133,.5);color:#fda4af}
.sv-btn.sm{padding:6px 12px;font-size:12px;border-radius:10px}
.sv-btn:disabled{opacity:.45;cursor:default;transform:none}
.sv-btn.primary::after{content:'';position:absolute;top:0;bottom:0;width:40%;left:-55%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:sv-sheen 3.6s ease-in-out infinite}
@keyframes sv-sheen{0%,60%{left:-55%}100%{left:135%}}
/* تب‌ها */
.sv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 16px;background:rgba(0,0,0,.28);border:1px solid var(--bd);border-radius:16px;padding:6px}
.sv-tab{position:relative;border:0;background:none;color:var(--dim);border-radius:11px;padding:10px 15px;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s;white-space:nowrap}
.sv-tab:hover{color:var(--tx)}
.sv-tab.on{background:linear-gradient(135deg,rgba(16,185,129,.35),rgba(14,165,233,.25));color:#fff;font-weight:800;box-shadow:inset 0 0 0 1px rgba(16,185,129,.5)}
.sv-tab .sv-badge{position:absolute;top:2px;left:4px;min-width:18px;height:18px;line-height:18px;font-size:10.5px;font-weight:800;background:#ef4444;border-radius:9px;padding:0 5px;animation:sv-pop .3s}
@keyframes sv-pop{0%{transform:scale(.4)}100%{transform:scale(1)}}
/* کارت‌ها و آمار */
.sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px}
.sv-stat{background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:14px 12px;text-align:center;position:relative;overflow:hidden;transition:.2s}
.sv-stat:hover{transform:translateY(-3px);border-color:rgba(16,185,129,.5)}
.sv-stat::before{content:'';position:absolute;top:0;right:12%;left:12%;height:3px;border-radius:99px;background:linear-gradient(90deg,var(--g1),var(--g2))}
.sv-stat b{font-size:21px;display:block;font-variant-numeric:tabular-nums}
.sv-stat span{font-size:11.5px;color:var(--dim)}
.sv-panel{background:var(--card);border:1px solid var(--bd);border-radius:20px;padding:16px;margin-bottom:12px}
.sv-panel>h3{margin:0 0 10px;font-size:14.5px}
.sv-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:900px){.sv-2col{grid-template-columns:1fr}}
.sv-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
.sv-hint{font-size:12px;color:var(--dim);line-height:2}
.sv-note{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.4);border-radius:13px;padding:10px 13px;font-size:12.5px;line-height:2.1;margin-top:8px}
.sv-warn{background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.45);border-radius:13px;padding:10px 13px;font-size:12.5px;line-height:2.1;margin-top:8px}
.sv-danger-note{background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.45);border-radius:13px;padding:10px 13px;font-size:12.5px;line-height:2.1;margin-top:8px}
.sv-empty{text-align:center;color:var(--dim);padding:26px 10px;line-height:2.2}
/* فرم */
.sv-field{margin-bottom:10px}
.sv-field label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--dim)}
.sv-field input,.sv-field textarea,.sv-field select{background:rgba(0,0,0,.35);border:1px solid var(--bd);color:var(--tx);border-radius:11px;padding:10px 12px;font-size:13.5px;font-family:inherit;width:100%}
.sv-field input:focus,.sv-field textarea:focus,.sv-field select:focus{border-color:var(--g1);outline:0;box-shadow:0 0 0 3px rgba(16,185,129,.2)}
.sv-field textarea{resize:vertical;line-height:2}
.sv-grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
@media(max-width:640px){.sv-grid2{grid-template-columns:1fr}}
.sv-check{flex-direction:row!important;align-items:center;gap:8px!important;cursor:pointer}
.sv-check input{width:18px;height:18px;accent-color:var(--g1)}
.sv-checks{display:flex;gap:7px;flex-wrap:wrap}
.sv-checks .sv-check{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:7px 12px;font-size:12.5px}
/* صف برنده‌ها */
.sv-tl{display:flex;flex-direction:column;gap:0}
.sv-tl-item{display:grid;grid-template-columns:44px 1fr;gap:10px;position:relative;padding-bottom:14px}
.sv-tl-item::before{content:'';position:absolute;right:21px;top:44px;bottom:0;width:2px;background:linear-gradient(var(--g1),transparent)}
.sv-tl-item:last-child::before{display:none}
.sv-tl-n{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:rgba(0,0,0,.4);border:2px solid var(--bd);font-size:14px}
.sv-tl-item.done .sv-tl-n{background:linear-gradient(135deg,var(--g1),#0ea5e9);border-color:transparent}
.sv-tl-item.now .sv-tl-n{border-color:var(--g2);box-shadow:0 0 18px rgba(245,158,11,.55);animation:sv-pulse 1.8s infinite}
@keyframes sv-pulse{50%{box-shadow:0 0 30px rgba(245,158,11,.85)}}
.sv-tl-card{flex:1;background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:10px 13px}
.sv-tl-card b{font-size:13.5px}
.sv-tl-card small{display:block;color:var(--dim);font-size:11.5px}
.sv-avatar{width:38px;height:38px;border-radius:50%;display:inline-grid;place-items:center;font-weight:800;font-size:15px;color:#fff;flex-shrink:0}
/* جدول مالی */
.sv-table-wrap{overflow:auto;border-radius:14px;border:1px solid var(--bd)}
table.sv-table{width:100%;border-collapse:collapse;font-size:12px;min-width:560px}
.sv-table th,.sv-table td{padding:9px 10px;border-bottom:1px solid var(--bd);text-align:center;white-space:nowrap}
.sv-table th{background:rgba(0,0,0,.3);font-size:11.5px;color:var(--dim)}
.sv-table tr:last-child td{border-bottom:0}
.sv-cell-ok{color:var(--ok);font-weight:800}.sv-cell-part{color:var(--warn);font-weight:800}.sv-cell-no{color:var(--bad)}
.sv-claim{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:11px 13px;margin-bottom:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.sv-claim .sv-amt{font-weight:800;font-size:15px}
.sv-receipt{width:52px;height:52px;border-radius:10px;object-fit:cover;cursor:zoom-in;border:1px solid var(--bd)}
/* چت */
.sv-chat{display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto;padding:6px 2px}
.sv-msg{max-width:82%;background:var(--card);border:1px solid var(--bd);border-radius:14px 14px 14px 4px;padding:9px 13px;font-size:13px;line-height:2;animation:sv-in .3s both}
.sv-msg.me{margin-right:auto;background:linear-gradient(135deg,rgba(16,185,129,.3),rgba(14,165,233,.2));border-color:rgba(16,185,129,.5);border-radius:14px 14px 4px 14px}
.sv-msg small{display:block;font-size:10.5px;color:var(--dim)}
.sv-announce{background:linear-gradient(135deg,rgba(245,158,11,.16),rgba(236,72,153,.12));border:1px solid rgba(245,158,11,.5);border-radius:14px;padding:10px 14px;font-size:12.5px;line-height:2.1;animation:sv-in .3s both}
.sv-chatbar{display:flex;gap:8px;margin-top:10px}
.sv-chatbar input{flex:1;background:rgba(0,0,0,.35);border:1px solid var(--bd);color:var(--tx);border-radius:12px;padding:11px 14px;font-size:13px;font-family:inherit}
.sv-chatbar input:focus{border-color:var(--g1);outline:0}
/* نظرسنجی و پیشنهاد */
.sv-poll{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:13px;margin-bottom:10px}
.sv-poll h4{margin:0 0 8px;font-size:13.5px}
.sv-opt{display:block;width:100%;text-align:right;background:rgba(0,0,0,.25);border:1px solid var(--bd);color:var(--tx);border-radius:11px;padding:9px 12px;margin-bottom:6px;cursor:pointer;font-family:inherit;font-size:12.5px;position:relative;overflow:hidden}
.sv-opt i{position:absolute;inset:0;background:linear-gradient(90deg,rgba(16,185,129,.35),rgba(16,185,129,.12));pointer-events:none}
.sv-opt b{position:relative}
.sv-opt.voted{border-color:var(--g1)}
.sv-idea{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:11px 13px;margin-bottom:8px;font-size:13px;line-height:2}
.sv-idea small{color:var(--dim)}
.sv-pill{font-size:11px;padding:2px 10px;border-radius:99px;background:rgba(0,0,0,.35);border:1px solid var(--bd)}
.sv-pill.accepted{color:var(--ok);border-color:var(--ok)}.sv-pill.rejected{color:var(--bad);border-color:var(--bad)}.sv-pill.review{color:var(--warn);border-color:var(--warn)}
/* اعضا */
.sv-member{display:flex;gap:11px;align-items:center;background:var(--card);border:1px solid var(--bd);border-radius:15px;padding:10px 13px;margin-bottom:8px}
.sv-member .sv-mi{flex:1;min-width:0}
.sv-member b{font-size:13.5px}
.sv-member small{display:block;color:var(--dim);font-size:11px}
.sv-score{width:46px;height:46px;flex-shrink:0}
.sv-code{font-size:26px;letter-spacing:6px;font-weight:800;background:rgba(0,0,0,.35);border:2px dashed rgba(245,158,11,.6);border-radius:14px;padding:10px 18px;text-align:center;direction:ltr;user-select:all}
/* مودال */
.sv-modal{position:fixed;inset:0;z-index:9998;background:rgba(2,4,12,.72);backdrop-filter:blur(5px);display:flex;justify-content:center;align-items:flex-start;padding:6vh 14px 14px;animation:sv-fade .18s}
@keyframes sv-fade{from{opacity:0}}
.sv-modal-panel{width:min(620px,100%);max-height:86vh;overflow:auto;background:#0d1330;border:1px solid rgba(16,185,129,.35);border-radius:22px;padding:20px;position:relative;animation:sv-pop-in .3s cubic-bezier(.2,.9,.3,1.15)}
@keyframes sv-pop-in{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
.sv-modal-x{position:absolute;top:14px;left:14px;background:rgba(255,255,255,.08);border:1px solid var(--bd);color:var(--tx);border-radius:10px;min-width:34px;height:34px;cursor:pointer;font-size:16px}
.sv-modal-x:hover{background:rgba(251,113,133,.25)}
.sv-modal-panel h3{margin:0 0 12px;font-size:16px;padding-left:40px}
.sv-pin{display:flex;gap:8px;justify-content:center;direction:ltr;margin:10px 0}
.sv-pin input{width:52px;height:58px;text-align:center;font-size:24px;font-weight:800;background:rgba(0,0,0,.4);border:2px solid var(--bd);border-radius:13px;color:var(--tx)}
.sv-pin input:focus{border-color:var(--g1);outline:0}
/* تست */
.sv-toast{position:fixed;bottom:18px;right:18px;z-index:10001;background:#0d1330;border:1px solid var(--g1);border-radius:13px;padding:11px 17px;font-size:13px;box-shadow:0 16px 44px rgba(0,0,0,.6);animation:sv-pop-in .3s;max-width:min(360px,90vw)}
/* حلقه پیشرفت */
.sv-ring{display:block;margin:0 auto}
.sv-count{font-variant-numeric:tabular-nums}
/* قرعه‌کشی */
.sv-shuffle{font-size:30px;font-weight:800;text-align:center;padding:26px 10px;min-height:110px}
.sv-confetti{position:fixed;inset:0;z-index:10002;pointer-events:none}
/* دمو */
.sv-demo{border:1px dashed rgba(139,92,246,.55);border-radius:16px;padding:12px 15px;margin-bottom:12px;font-size:12.5px;line-height:2.1;background:rgba(139,92,246,.08)}
@media(max-width:640px){.sv-root{padding:14px 12px 34px}.sv-head h1{font-size:17px}.sv-tab{padding:9px 11px;font-size:12px}}
@media (prefers-reduced-motion:reduce){.sv-root *,.sv-root *::before,.sv-root *::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
.sv-blobs{display:none}}
`;
