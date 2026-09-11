// 🎨 ViXoRa Resume CSS — رابط + کاغذ A4 + چاپ
// src/pages/tools/resume/resume-css.js

export const resumeCss = /* css */ `
.rs-root{--c1:#8b5cf6;--c2:#ec4899;--card:rgba(255,255,255,.06);--card2:rgba(255,255,255,.1);--bd:rgba(255,255,255,.12);--tx:#f3f1ff;--dim:rgba(243,241,255,.62);position:relative;min-height:100%;padding:20px 20px 40px;border-radius:22px;color:var(--tx);background:linear-gradient(160deg,#0b0620,#1c0b38)}
.rs-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.rs-logo{width:50px;height:50px;border-radius:15px;display:grid;place-items:center;font-size:27px;background:linear-gradient(135deg,var(--c1),var(--c2))}
.rs-head h1{margin:0;font-size:19px}
.rs-head p{margin:2px 0 0;font-size:12.5px;color:var(--dim)}
.rs-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 16px}
.rs-tab{border:1px solid var(--bd);background:var(--card);color:var(--tx);border-radius:12px;padding:9px 16px;font-size:13.5px;cursor:pointer;font-family:inherit}
.rs-tab:hover{background:var(--card2)}
.rs-tab.on{background:linear-gradient(135deg,var(--c1),var(--c2));border:0;font-weight:800}
.rs-search{width:100%;background:rgba(0,0,0,.3);border:1px solid var(--bd);color:var(--tx);border-radius:12px;padding:11px 14px;font-size:13.5px;font-family:inherit;margin-bottom:12px}
.rs-group{margin-bottom:18px}
.rs-group>h3{margin:0 0 4px;font-size:15px}
.rs-group>p{margin:0 0 10px;font-size:12px;color:var(--dim)}
.rs-tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.rs-tcard{background:var(--card);border:1px solid var(--bd);border-radius:15px;padding:13px;display:flex;flex-direction:column;gap:6px;transition:.18s}
.rs-tcard:hover{transform:translateY(-2px);border-color:var(--c1)}
.rs-tcard b{font-size:13.5px}
.rs-tcard small{color:var(--dim);font-size:11.5px;line-height:1.9;flex:1}
.rs-tmeta{display:flex;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--dim)}
.rs-tmeta i{font-style:normal;background:rgba(0,0,0,.3);padding:2px 9px;border-radius:99px}
.rs-btn{border:1px solid var(--bd);background:var(--card);color:var(--tx);border-radius:11px;padding:9px 15px;font-size:13px;cursor:pointer;font-family:inherit}
.rs-btn:hover{background:var(--card2)}
.rs-btn.primary{background:linear-gradient(135deg,var(--c1),var(--c2));border:0;font-weight:700}
.rs-btn.sm{padding:6px 11px;font-size:12px;border-radius:9px}
.rs-btn.danger{border-color:rgba(244,63,94,.5);color:#fda4af}
.rs-btn:disabled{opacity:.4;cursor:default}
.rs-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
.rs-hint{font-size:11.5px;color:var(--dim);line-height:1.9}
.rs-note{background:rgba(139,92,246,.12);border:1px solid var(--c1);border-radius:11px;padding:9px 12px;font-size:12.5px;line-height:2;margin-top:8px}
.rs-field{margin-bottom:10px}
.rs-field label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--dim)}
.rs-field input,.rs-field textarea,.rs-field select{background:rgba(0,0,0,.32);border:1px solid var(--bd);color:var(--tx);border-radius:10px;padding:9px 11px;font-size:13px;font-family:inherit;width:100%}
.rs-field input:focus,.rs-field textarea:focus,.rs-field select:focus{border-color:var(--c1);outline:0}
.rs-field textarea{resize:vertical;line-height:2}
.rs-grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
@media(max-width:700px){.rs-grid2{grid-template-columns:1fr}}
.rs-check{flex-direction:row!important;align-items:center;gap:7px!important;cursor:pointer}
.rs-check input{width:17px;height:17px;accent-color:var(--c1)}
.rs-checks{display:flex;gap:8px;flex-wrap:wrap}
.rs-checks .rs-check{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:6px 11px;font-size:12px}
/* ویزارد */
.rs-wz{max-width:760px;margin:0 auto}
.rs-wz-bar{height:9px;background:rgba(0,0,0,.35);border-radius:99px;overflow:hidden;margin-bottom:14px}
.rs-wz-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--c1),var(--c2));transition:width .4s}
.rs-wz-q{font-size:16px;margin:0 0 12px;text-align:center}
.rs-wz-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:640px){.rs-wz-opts{grid-template-columns:1fr}}
.rs-wz-opt{background:var(--card);border:2px solid var(--bd);border-radius:14px;padding:13px;cursor:pointer;color:var(--tx);text-align:right;font-family:inherit;display:flex;flex-direction:column;gap:3px;transition:.15s}
.rs-wz-opt small{color:var(--dim);font-size:11.5px}
.rs-wz-opt:hover{border-color:var(--c1);transform:translateY(-2px)}
.rs-wz-nav{display:flex;justify-content:space-between;margin-top:14px}
.rs-wz-res{display:flex;flex-direction:column;gap:10px}
.rs-wz-card{background:var(--card);border:1px solid var(--bd);border-radius:15px;padding:14px}
.rs-wz-card.top{border-color:var(--c1);box-shadow:0 0 0 1px var(--c1)}
.rs-wz-card h4{margin:0 0 6px;font-size:15px}
.rs-wz-pct{font-size:12px;color:var(--c2);font-weight:800}
.rs-wz-card ul{margin:6px 0;padding-right:18px;font-size:12.5px;line-height:2;color:var(--dim)}
/* سفارشی‌ساز */
.rs-cb-grid{display:grid;grid-template-columns:380px 1fr;gap:14px;align-items:start}
@media(max-width:1000px){.rs-cb-grid{grid-template-columns:1fr}}
.rs-pick-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.rs-pick{background:var(--card);border:1px solid var(--bd);border-radius:10px;color:var(--tx);padding:8px;cursor:pointer;font-family:inherit;font-size:12px}
.rs-pick.on{border-color:var(--c1);background:var(--card2);font-weight:800}
.rs-dots{display:flex;gap:7px;flex-wrap:wrap}
.rs-dot{width:30px;height:30px;border-radius:50%;border:2px solid transparent;cursor:pointer}
.rs-dot.on{border-color:#fff;box-shadow:0 0 0 2px var(--c1)}
.rs-sec-list{display:flex;flex-direction:column;gap:5px;margin-bottom:8px}
.rs-sec-row{display:flex;justify-content:space-between;align-items:center;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:7px 11px;font-size:12.5px}
.rs-sec-ops{display:flex;gap:4px}
.rs-sec-ops button{background:rgba(0,0,0,.3);border:1px solid var(--bd);color:var(--tx);border-radius:7px;cursor:pointer;font-size:11px;padding:3px 8px}
.rs-addrow{display:flex;gap:6px}
.rs-addrow select{flex:1;background:rgba(0,0,0,.32);border:1px solid var(--bd);color:var(--tx);border-radius:10px;padding:8px;font-family:inherit}
.rs-prev-head{font-size:13px;color:var(--dim);margin-bottom:8px}
/* ویرایشگر */
.rs-ebar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:rgba(0,0,0,.25);border:1px solid var(--bd);border-radius:14px;padding:10px 12px;margin-bottom:8px;position:sticky;top:0;z-index:30}
.rs-ebar-t{flex:1;min-width:140px;font-size:14px}
.rs-ebar-ops{display:flex;gap:6px;flex-wrap:wrap}
.rs-pm{font-size:12px;background:rgba(0,0,0,.3);padding:4px 11px;border-radius:99px}
.rs-pm.ok{color:#6ee7b7}.rs-pm.over{color:#fda4af;border:1px solid rgba(244,63,94,.5)}
.rs-dirty{font-size:11.5px;color:var(--dim)}
.rs-docname{margin-bottom:10px}
.rs-docname input{width:100%;background:rgba(0,0,0,.3);border:1px solid var(--bd);color:var(--tx);border-radius:11px;padding:10px 13px;font-size:13.5px;font-family:inherit}
.rs-ed-grid{display:grid;grid-template-columns:400px 1fr;gap:14px;align-items:start}
@media(max-width:1000px){.rs-ed-grid{grid-template-columns:1fr}}
.rs-formpane{max-height:calc(100vh - 220px);overflow:auto;padding-left:6px}
@media(max-width:1000px){.rs-formpane{max-height:none}}
.rs-fgroup{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:13px;margin-bottom:10px;transition:box-shadow .3s,border-color .3s}
.rs-fgroup.flash{border-color:var(--c2);box-shadow:0 0 0 2px var(--c2)}
.rs-fgroup h4{margin:0 0 8px;font-size:13.5px}
.rs-item{background:rgba(0,0,0,.2);border:1px dashed var(--bd);border-radius:12px;padding:10px;margin-bottom:8px}
.rs-item-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.rs-photo-row{display:flex;gap:8px;align-items:center}
.rs-photo-thumb{width:52px;height:52px;border-radius:12px;object-fit:cover}
.rs-prevpane{position:sticky;top:70px;max-height:calc(100vh - 160px);overflow:auto;border-radius:14px}
@media(max-width:1000px){.rs-prevpane{position:static;max-height:80vh}}
/* رزومه‌های من */
.rs-dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.rs-dcard{background:var(--card);border:1px solid var(--bd);border-radius:15px;padding:14px;display:flex;flex-direction:column;gap:7px}
.rs-dcard b{font-size:14px}
.rs-dcard small{color:var(--dim);font-size:11.5px}
/* مودال */
.rs-modal{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.65);display:flex;justify-content:center;align-items:flex-start;padding:7vh 14px 14px}
.rs-modal-panel{width:min(760px,100%);max-height:84vh;overflow:auto;background:#14101f;border:1px solid var(--bd);border-radius:18px;padding:18px;position:relative}
.rs-modal-x{position:absolute;top:12px;left:12px;background:var(--card);border:1px solid var(--bd);color:var(--tx);border-radius:9px;min-width:32px;height:32px;cursor:pointer;font-size:15px}
/* تست */
.rs-toast{position:fixed;bottom:16px;right:16px;z-index:10001;background:#1a1430;border:1px solid var(--c1);border-radius:12px;padding:10px 16px;font-size:13px}
/* ================= کاغذ رزومه ================= */
.rsp-paper{--r-c1:#1e3a8a;--r-c2:#3b82f6;--r-font:Arial,sans-serif;background:#fff;color:#1a1a2e;font-family:var(--r-font);max-width:820px;margin:0 auto;padding:44px 46px;border-radius:6px;box-shadow:0 24px 70px -20px rgba(0,0,0,.7);font-size:13.5px;line-height:1.75}
.rsp-paper h1{margin:0;font-size:29px;line-height:1.3;color:#111}
.rsp-role{font-size:15px;color:var(--r-c1);font-weight:700;margin-top:2px}
.rsp-contact{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:12px;color:#444;margin-top:8px}
.rsp-ci{white-space:nowrap}
.rsp-hdr{border-bottom:3px solid var(--r-c1);padding-bottom:12px;margin-bottom:14px}
.rsp-hdr-min h1{font-size:25px}
.rsp-hdr-classic{text-align:center}
.rsp-hdr-classic .rsp-contact{justify-content:center}
.rsp-hdr-band{background:linear-gradient(135deg,var(--r-c1),var(--r-c2));color:#fff;margin:-44px -46px 16px;padding:30px 46px 20px;border:0;border-radius:6px 6px 0 0}
.rsp-hdr-band h1{color:#fff}
.rsp-hdr-band .rsp-role{color:#fff;opacity:.92}
.rsp-hdr-band .rsp-contact{color:#fff}
.rsp-hdr-side{border:0;padding:0;margin-bottom:10px}
.rsp-photo{width:110px;height:130px;object-fit:cover;border-radius:10px;border:3px solid var(--r-c1);margin-bottom:8px}
.rsp-photo-side{width:120px;height:140px;margin:0 auto 10px;display:block}
.rsp-sec{margin-bottom:13px;cursor:pointer;border-radius:8px}
.rsp-sec h2{font-size:14.5px;color:var(--r-c1);text-transform:uppercase;letter-spacing:.4px;border-bottom:1.5px solid var(--r-c1);padding-bottom:3px;margin:0 0 7px}
[dir="rtl"] .rsp-sec h2{letter-spacing:0}
.rsp-sec p{margin:0}
.rsp-ghost{border:1.5px dashed #bbb;background:#fafafa}
.rsp-ghost h2{color:#999!important;border-color:#ccc!important}
.rsp-ghost p{color:#999;font-size:12px;padding:6px 8px}
.rsp-chips{display:flex;gap:6px;flex-wrap:wrap}
.rsp-chips span{background:#f1f2f9;border:1px solid #dfe1f0;border-radius:99px;padding:2px 12px;font-size:12px}
.rsp-item{margin-bottom:8px}
.rsp-item-h{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.rsp-date{font-size:12px;color:#666;white-space:nowrap}
.rsp-sub{font-size:12.5px;color:#444}
.rsp-sec ul{margin:4px 0;padding-inline-start:20px}
.rsp-sec li{margin-bottom:2px}
.rsp-cols{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}
.rsp-link{color:var(--r-c2);font-size:12px}
.rsp-dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}
.rsp-dl>div{display:flex;gap:6px}
.rsp-dl dt{font-weight:700;color:#333;white-space:nowrap}
.rsp-dl dt::after{content:':'}
.rsp-dl dd{margin:0}
.rsp-trow{display:grid;grid-template-columns:130px 1fr;gap:12px;margin-bottom:9px}
.rsp-tdate{font-size:12px;color:#555;font-weight:700}
.rsp-tl{border-inline-start:2.5px solid var(--r-c1);padding-inline-start:16px;display:flex;flex-direction:column;gap:10px}
.rsp-tl-item{position:relative}
.rsp-tl-item::before{content:'';position:absolute;inset-inline-start:-23.5px;top:4px;width:11px;height:11px;border-radius:50%;background:var(--r-c1)}
.rsp-cols2{display:grid;grid-template-columns:225px 1fr;gap:0}
.rsp-side{background:#f4f5fb;margin:-44px 0 -44px -46px;padding:34px 20px}
[dir="rtl"] .rsp-side{margin:-44px -46px -44px 0}
.rsp-side .rsp-sec h2{font-size:12.5px}
.rsp-side .rsp-chips span{font-size:11px;padding:1px 9px}
.rsp-side-contact{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#333;margin-bottom:12px;word-break:break-word}
.rsp-side-contact .rsp-ci{white-space:normal}
.rsp-main{padding-inline-start:26px}
.rsp-decl{margin-top:18px}
.rsp-clause{font-size:11px;color:#555;font-style:italic}
.rsp-sign{display:flex;justify-content:space-between;margin-top:26px;font-size:13px}
.rsp-sign-n{font-weight:800;border-top:1.5px solid #333;padding-top:2px;min-width:150px;text-align:center}
.rsp-academic .rsp-sec h2{font-size:15px}
.rsp-academic .rsp-item{margin-bottom:10px}
/* ================= چاپ ================= */
#rs-print-root{display:none}
@page{size:A4;margin:9mm}
@media print{
body.rs-printing>*:not(#rs-print-root){display:none!important}
#rs-print-root{display:block!important}
#rs-print-root .rsp-paper{max-width:none;margin:0;box-shadow:none;border-radius:0;padding:0;font-size:12px}
#rs-print-root .rsp-hdr-band{margin:0 0 14px;padding:22px 26px 16px}
#rs-print-root .rsp-side{margin:0;padding:0 16px 0 0}
#rs-print-root .rsp-ghost{display:none!important}
}
@media(max-width:560px){.rsp-paper{padding:26px 20px}.rsp-hdr-band{margin:-26px -20px 14px;padding:22px 20px 14px}.rsp-cols,.rsp-dl{grid-template-columns:1fr}.rsp-trow{grid-template-columns:1fr}.rsp-cols2{grid-template-columns:1fr}.rsp-side{margin:0 0 12px;padding:16px;border-radius:10px}.rsp-main{padding:0}}
`;
