export const wdCss = /* css */ `
.wd-root{--a:var(--wd-accent,#e8b4b8);--ink:#f6efe6;--dim:rgba(246,239,230,.62);--line:rgba(255,255,255,.12);--glass:rgba(255,255,255,.06);position:relative;min-height:100%;padding:20px 20px 52px;border-radius:28px;color:var(--ink);isolation:isolate;overflow:hidden;font-family:inherit}
.wd-root[data-theme=runway]{background:
  radial-gradient(1200px 500px at 10% -10%,rgba(232,180,184,.35),transparent 50%),
  radial-gradient(900px 400px at 100% 0%,rgba(212,175,55,.18),transparent 45%),
  linear-gradient(165deg,#140f14 0%,#1c141c 40%,#241820 100%)}
.wd-root[data-theme=atelier]{background:linear-gradient(160deg,#1a1714,#2a241c 50%,#1e1a16);--ink:#f3eadc}
.wd-root[data-theme=noir]{background:linear-gradient(180deg,#0a0a0c,#17171c);--a:#d4af37}
.wd-root[data-theme=blush]{background:linear-gradient(160deg,#3a2430,#5a3344);--a:#ffb6c1}
.wd-root[data-theme=linen]{background:linear-gradient(160deg,#efe6d6,#e4d5c0);color:#3a2a22;--ink:#3a2a22;--dim:rgba(58,42,34,.6);--line:rgba(58,42,34,.14);--glass:rgba(255,255,255,.5)}
.wd-root[data-motion=off] *{animation:none!important;transition:none!important}
.wd-grain{pointer-events:none;position:absolute;inset:0;z-index:0;opacity:.07;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.wd-spot{position:absolute;inset:auto;width:480px;height:480px;border-radius:50%;filter:blur(80px);opacity:.28;background:var(--a);top:-120px;left:20%;animation:wd-spot 14s ease-in-out infinite;z-index:0}
@keyframes wd-spot{50%{transform:translateX(80px) scale(1.12)}}
.wd-in{animation:wd-up .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes wd-up{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
.wd-head{position:relative;z-index:1;display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.wd-mark{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-size:28px;background:linear-gradient(145deg,var(--a),#d4af37);box-shadow:0 16px 40px -16px var(--a);animation:wd-spin 12s linear infinite}
@keyframes wd-spin{from{filter:hue-rotate(0)}to{filter:hue-rotate(20deg)}}
.wd-head h1{margin:0;font-size:22px;letter-spacing:-.02em;font-weight:800}
.wd-head p{margin:3px 0 0;font-size:12.5px;color:var(--dim)}
.wd-sp{flex:1}
.wd-btn{border:1px solid var(--line);background:var(--glass);color:inherit;border-radius:999px;padding:9px 16px;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s;backdrop-filter:blur(12px)}
.wd-btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px -12px var(--a)}
.wd-btn:active{transform:scale(.96)}
.wd-btn.pri{background:linear-gradient(135deg,var(--a),#d4af37);border:0;color:#1a1210;font-weight:800}
.wd-btn.sm{padding:6px 11px;font-size:12px}
.wd-btn.danger{color:#fda4af;border-color:rgba(253,164,175,.4)}
.wd-tabs{position:relative;z-index:1;display:flex;gap:4px;flex-wrap:wrap;padding:5px;border-radius:999px;background:rgba(0,0,0,.28);border:1px solid var(--line);margin:8px 0 16px}
.wd-tab{border:0;background:none;color:var(--dim);border-radius:999px;padding:8px 14px;cursor:pointer;font-family:inherit;font-size:13px}
.wd-tab.on{background:linear-gradient(135deg,rgba(232,180,184,.45),rgba(212,175,55,.25));color:#fff;font-weight:800}
.wd-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.wd-card{position:relative;background:var(--glass);border:1px solid var(--line);border-radius:22px;padding:14px;backdrop-filter:blur(16px);overflow:hidden;transition:.25s}
.wd-card:hover{transform:translateY(-4px) rotate(-.4deg);border-color:rgba(232,180,184,.45)}
.wd-swatch{width:100%;height:72px;border-radius:16px;margin-bottom:10px;position:relative}
.wd-swatch::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent,rgba(0,0,0,.25));border-radius:inherit}
.wd-card h3{margin:0 0 4px;font-size:14.5px}
.wd-meta{display:flex;flex-wrap:wrap;gap:5px;font-size:11px;color:var(--dim);margin:6px 0}
.wd-chip{border:1px solid var(--line);border-radius:999px;padding:2px 8px}
.wd-bar{height:7px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.wd-bar>i{display:block;height:100%;background:linear-gradient(90deg,var(--a),#d4af37)}
.wd-search,.wd-inp,.wd-sel{padding:10px 12px;border-radius:14px;border:1px solid var(--line);background:rgba(0,0,0,.22);color:inherit;font-family:inherit}
.wd-search{width:100%}
.wd-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.wd-overlay{position:fixed;inset:0;z-index:80;background:rgba(10,8,10,.62);display:grid;place-items:center;padding:16px;backdrop-filter:blur(8px);animation:wd-up .2s}
.wd-modal{width:min(680px,100%);max-height:88vh;overflow:auto;background:linear-gradient(180deg,#2a1f24,#161214);border:1px solid var(--line);border-radius:24px;padding:20px 18px 18px;position:relative;color:#f6efe6;box-shadow:0 30px 80px -20px #000}
.wd-root[data-theme=linen] .wd-modal{background:#f7efe3;color:#3a2a22}
.wd-x{position:absolute;top:10px;left:10px;width:36px;height:36px;border-radius:12px;border:1px solid var(--line);background:var(--glass);color:inherit;cursor:pointer}
.wd-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:90;background:#1a1210;color:#f6efe6;padding:10px 16px;border-radius:999px;font-size:13px;border:1px solid var(--line)}
.wd-heat{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.wd-heat i{aspect-ratio:1;border-radius:5px;background:rgba(255,255,255,.08)}
.wd-heat i.l1{background:rgba(232,180,184,.35)} .wd-heat i.l2{background:rgba(232,180,184,.6)} .wd-heat i.l3{background:#d4af37}
.wd-man{width:min(280px,100%);margin:8px auto;aspect-ratio:3/5;border-radius:140px 140px 40px 40px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));border:1px dashed var(--line);display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:16px}
.wd-man span{font-size:12px;opacity:.85}
.wd-score{font-size:42px;font-weight:800;background:linear-gradient(90deg,var(--a),#d4af37);-webkit-background-clip:text;color:transparent}
@media print{.wd-tabs,.wd-btn,.wd-overlay{display:none!important}}
`;
