export const ktCss = /* css */ `
.kt-root{--a:var(--kt-accent,#fb7185);--card:rgba(255,255,255,.06);--bd:rgba(255,255,255,.12);--tx:#fff7f2;--dim:rgba(255,247,242,.62);position:relative;min-height:100%;padding:18px 18px 48px;border-radius:24px;color:var(--tx);isolation:isolate;overflow:hidden;font-family:inherit}
.kt-root[data-theme=ember]{background:linear-gradient(165deg,#1a0b0c,#2a1014 40%,#3b1d0f)}
.kt-root[data-theme=matcha]{background:linear-gradient(165deg,#0b1a12,#102a1c 40%,#0f2e22)}
.kt-root[data-theme=ocean]{background:linear-gradient(165deg,#07141f,#0c2233 40%,#0b2740)}
.kt-root[data-theme=night]{background:linear-gradient(165deg,#09090f,#14141f)}
.kt-root[data-theme=cream]{background:linear-gradient(165deg,#f4e6d4,#ead7bd);color:#3a2418;--tx:#3a2418;--dim:rgba(58,36,24,.62);--card:rgba(255,255,255,.45);--bd:rgba(58,36,24,.14)}
.kt-root[data-density=compact] .kt-card{padding:10px}
.kt-root[data-font=vazir]{letter-spacing:0}
.kt-blobs{position:absolute;inset:0;z-index:-1;pointer-events:none}
.kt-blobs i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.35;animation:ktf 16s ease-in-out infinite}
.kt-blobs i:nth-child(1){width:340px;height:340px;left:-80px;top:-80px;background:var(--a)}
.kt-blobs i:nth-child(2){width:280px;height:280px;right:-60px;top:30%;background:#fbbf24;animation-delay:-5s}
.kt-blobs i:nth-child(3){width:300px;height:300px;left:30%;bottom:-120px;background:#fb923c;animation-delay:-9s}
@keyframes ktf{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,-22px) scale(1.08)}}
.kt-in{animation:kti .4s both}
@keyframes kti{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.kt-root[data-motion=off] *{animation:none!important;transition:none!important}
.kt-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.kt-logo{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;font-size:28px;background:linear-gradient(135deg,var(--a),#fb923c);box-shadow:0 12px 28px -10px var(--a)}
.kt-head h1{margin:0;font-size:20px}
.kt-head p{margin:2px 0 0;font-size:12.5px;color:var(--dim)}
.kt-sp{flex:1}
.kt-btn{border:1px solid var(--bd);background:var(--card);color:inherit;border-radius:12px;padding:9px 14px;font-size:13px;cursor:pointer;font-family:inherit;transition:.18s}
.kt-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.kt-btn:active{transform:scale(.96)}
.kt-btn.primary{background:linear-gradient(135deg,var(--a),#fb923c);border:0;font-weight:800;color:#fff}
.kt-btn.gold{background:linear-gradient(135deg,#b45309,#f59e0b);border:0;color:#fff;font-weight:800}
.kt-btn.ghost{background:transparent}
.kt-btn.sm{padding:6px 10px;font-size:12px}
.kt-btn.danger{color:#fda4af;border-color:rgba(251,113,133,.45)}
.kt-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px;background:rgba(0,0,0,.25);border:1px solid var(--bd);border-radius:16px;padding:6px}
.kt-tab{border:0;background:none;color:var(--dim);border-radius:11px;padding:9px 13px;font-size:13px;cursor:pointer;font-family:inherit}
.kt-tab.on{background:linear-gradient(135deg,rgba(251,113,133,.4),rgba(251,146,60,.25));color:#fff;font-weight:800}
.kt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.kt-card{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:14px;backdrop-filter:blur(10px);animation:kti .4s both}
.kt-card h3{margin:0 0 6px;font-size:15px}
.kt-meta{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;font-size:11.5px;color:var(--dim)}
.kt-chip{border:1px solid var(--bd);border-radius:999px;padding:3px 8px;background:rgba(255,255,255,.04)}
.kt-bar{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.kt-bar>i{display:block;height:100%;background:linear-gradient(90deg,var(--a),#fbbf24);border-radius:99px}
.kt-search{width:100%;padding:12px 14px;border-radius:14px;border:1px solid var(--bd);background:rgba(0,0,0,.2);color:inherit;font-family:inherit;font-size:14px}
.kt-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.kt-sel,.kt-inp{padding:8px 10px;border-radius:10px;border:1px solid var(--bd);background:rgba(0,0,0,.2);color:inherit;font-family:inherit}
.kt-overlay{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:16px;animation:kti .2s}
.kt-modal{width:min(720px,100%);max-height:88vh;overflow:auto;background:linear-gradient(180deg,#2a1410,#1a0c0c);border:1px solid var(--bd);border-radius:20px;padding:18px;color:#fff7f2;position:relative}
.kt-root[data-theme=cream] .kt-modal{background:#fff6ea;color:#3a2418}
.kt-x{position:absolute;top:10px;left:10px;width:36px;height:36px;border-radius:12px;border:1px solid var(--bd);background:var(--card);color:inherit;cursor:pointer;font-size:18px}
.kt-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:90;background:#111;color:#fff;padding:10px 16px;border-radius:12px;font-size:13px;animation:kti .25s}
.kt-cook{position:fixed;inset:0;z-index:70;background:#140808;color:#fff;padding:16px;overflow:auto}
.kt-step{padding:16px;border-radius:16px;border:1px solid var(--bd);margin:8px 0}
.kt-step.on{border-color:var(--a);box-shadow:0 0 0 2px rgba(251,113,133,.35)}
.kt-timer{font-variant-numeric:tabular-nums;font-size:42px;font-weight:800}
.kt-heat{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.kt-heat i{aspect-ratio:1;border-radius:4px;background:rgba(255,255,255,.08)}
.kt-heat i.l1{background:rgba(251,113,133,.3)} .kt-heat i.l2{background:rgba(251,113,133,.55)} .kt-heat i.l3{background:rgba(251,113,133,.85)}
.kt-stars span{cursor:pointer;font-size:20px}
.kt-wheel{width:220px;height:220px;border-radius:50%;margin:12px auto;background:conic-gradient(#fb7185,#fbbf24,#34d399,#60a5fa,#c084fc,#fb7185);animation:ktw 1.2s cubic-bezier(.2,.8,.2,1)}
@keyframes ktw{from{transform:rotate(0)}to{transform:rotate(1080deg)}}
.kt-confetti{position:fixed;inset:0;pointer-events:none;z-index:95}
.kt-print-only{display:none}
@media print{
  .kt-tabs,.kt-btn,.kt-blobs,.kt-overlay{display:none!important}
  .kt-print-only{display:block}
  .kt-root{background:#fff;color:#000}
}
.kt-shop-done{opacity:.45;text-decoration:line-through}
.kt-fab{position:sticky;bottom:12px;display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
`;
