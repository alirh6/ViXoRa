// 📝 ViXoRa Resume Builder — رزومه‌ساز هوشمند (۵۰ قالب + ویزارد + سفارشی‌ساز)
// src/pages/tools/resume/resume.js
// قرارداد صفحه: { render, afterRender, destroy }

import { injectScopedCss } from '../../../utilities/css-scope.js';
import { resumeCss } from './resume-css.js';
import { TEMPLATES, GROUPS, getTemplate } from './resume-data.js';
import { renderResume, sampleData, esc } from './resume-layouts.js';
import { WZ_QUESTIONS, scoreProfiles } from './resume-wizard.js';
import { blankDraft, draftFromTpl, draftToTpl, renderCustomBuilder, refreshCustomPreview } from './resume-custom.js';
import { renderEditorForm, applyField, addItem, delItem, editorBarHtml, pageMeterHtml } from './resume-editor.js';
import { listDocs, saveDoc, deleteDoc, newDocId, blankData, listCustomTpls, saveCustomTpl, deleteCustomTpl, fileToPhoto } from './resume-store.js';

const faNum = (n) => Number(n || 0).toLocaleString('fa-IR');
const photoTag = (p) => p === 'required' ? '📷 لازم' : p === 'forbidden' ? '📵 بدون عکس' : '📷 اختیاری';

export function createResumePage(ctx = {}) {
  let root = null;
  let releaseCss = null;
  let destroyed = false;
  let tab = 'tpls';
  let view = 'tabs';
  let query = '';
  let wzStep = 0;
  let wzAnswers = {};
  let cbDraft = blankDraft();
  let edit = null; // { tplId, tpl, doc, dirty }
  let prevT = 0;

  function allTpls() { return [...TEMPLATES, ...listCustomTpls()]; }
  function tplById(id) { return getTemplate(id, listCustomTpls()); }

  /* ================= رندر ================= */
  function render() {
    return `<div class="rs-root">
      <div class="rs-head"><div class="rs-logo">📝</div>
        <div><h1>رزومه‌ساز هوشمند ViXoRa</h1><p>۵۰ قالب دقیق کشور و شرکت + ویزارد ۵سؤالی + سفارشی‌ساز کامل — با پیش‌نمایش زنده و چاپ A4</p></div></div>
      <div data-rs="tabs"></div>
      <div data-rs="body"></div>
      <div data-rs="overlay"></div>
      <div data-rs="toast"></div>
    </div>`;
  }

  function renderTabs() {
    const host = root.querySelector('[data-rs="tabs"]');
    if (view === 'edit') { host.innerHTML = ''; return; }
    const n = listDocs().length;
    host.innerHTML = `<nav class="rs-tabs">
      <button class="rs-tab ${tab === 'tpls' ? 'on' : ''}" data-rs-tab="tpls">🗂 قالب‌های آماده (${faNum(allTpls().length)})</button>
      <button class="rs-tab ${tab === 'wz' ? 'on' : ''}" data-rs-tab="wz">🧠 ویزارد هوشمند</button>
      <button class="rs-tab ${tab === 'cb' ? 'on' : ''}" data-rs-tab="cb">🎨 سفارشی‌ساز</button>
      <button class="rs-tab ${tab === 'mine' ? 'on' : ''}" data-rs-tab="mine">📁 رزومه‌های من (${faNum(n)})</button>
    </nav>`;
  }

  function tplCard(t) {
    return `<div class="rs-tcard"><b>${t.icon} ${esc(t.fa)}</b><small>${esc(t.blurb || '')}</small>
      <div class="rs-tmeta"><i>${esc(t.pages || '')}</i><i>${photoTag(t.photo)}</i><i>${t.lang === 'fa' ? 'فارسی' : 'English'}</i></div>
      <div class="rs-row"><button class="rs-btn sm primary" data-use="${t.id}">✨ ساخت رزومه با این قالب</button>
      ${t.custom ? `<button class="rs-btn sm danger" data-deltpl="${t.id}">🗑</button>` : ''}</div></div>`;
  }

  function tplsHtml() {
    const q = query.trim().toLowerCase();
    const match = (t) => !q || (t.fa + ' ' + t.name + ' ' + (t.blurb || '')).toLowerCase().includes(q);
    const groups = ['country', 'intl', 'iran'].map((g) => {
      const list = TEMPLATES.filter((t) => t.group === g && match(t));
      if (!list.length) return '';
      return `<div class="rs-group"><h3>${GROUPS[g].title}</h3><p>${GROUPS[g].desc}</p><div class="rs-tgrid">${list.map(tplCard).join('')}</div></div>`;
    }).join('');
    const customs = listCustomTpls().filter(match);
    const customHtml = customs.length ? `<div class="rs-group"><h3>🎨 قالب‌های سفارشی من (${faNum(customs.length)})</h3><p>قالب‌هایی که خودت ساختی</p><div class="rs-tgrid">${customs.map(tplCard).join('')}</div></div>` : '';
    return `<input class="rs-search" data-rs-q value="${esc(query)}" placeholder="🔎 جستجو: کانادا، گوگل، دیجی‌کالا..." />${groups}${customHtml}` || '<div class="rs-note">چیزی پیدا نشد.</div>';
  }

  function wzHtml() {
    if (wzStep < WZ_QUESTIONS.length) {
      const q = WZ_QUESTIONS[wzStep];
      return `<div class="rs-wz"><div class="rs-wz-bar"><i style="width:${Math.round((wzStep / WZ_QUESTIONS.length) * 100)}%"></i></div>
        <p class="rs-wz-q">سؤال ${faNum(wzStep + 1)} از ${faNum(WZ_QUESTIONS.length)} — ${esc(q.title)}</p>
        <div class="rs-wz-opts">${q.opts.map(([v, t, d]) => `<button class="rs-wz-opt" data-wz="${q.id}:${v}"><b>${esc(t)}</b><small>${esc(d)}</small></button>`).join('')}</div>
        <div class="rs-wz-nav"><button class="rs-btn sm" data-wzback ${wzStep === 0 ? 'disabled' : ''}>→ قبلی</button><button class="rs-btn sm" data-wzrestart>↺ از اول</button></div></div>`;
    }
    const top = scoreProfiles(wzAnswers).slice(0, 3);
    return `<div class="rs-wz"><p class="rs-wz-q">🎉 بهترین قالب‌های پیشنهادی برای تو</p><div class="rs-wz-res">
      ${top.map((p, i) => `<div class="rs-wz-card ${i === 0 ? 'top' : ''}"><h4>${i === 0 ? '🏆' : '🥈'} ${esc(p.fa)} <span class="rs-wz-pct">${faNum(p.pct)}٪ تطابق</span></h4>
        <div class="rs-tmeta"><i>${esc(p.cfg.pages)}</i><i>${photoTag(p.cfg.photo)}</i><i>${p.cfg.lang === 'fa' ? 'فارسی' : 'English'}</i></div>
        ${p.reasons.length ? `<ul>${p.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
        <div class="rs-row"><button class="rs-btn sm primary" data-wzuse="${p.id}">✨ ساخت رزومه با این قالب</button>
        ${(p.match || []).slice(0, 2).map((m) => { const t = tplById(m); return t ? `<button class="rs-btn sm" data-use="${t.id}">${t.icon} قالب آماده: ${esc(t.fa)}</button>` : ''; }).join('')}</div></div>`).join('')}
      </div><div class="rs-wz-nav"><button class="rs-btn sm" data-wzrestart>↺ پاسخ دوباره</button></div></div>`;
  }

  function cbHtml() { return renderCustomBuilder(cbDraft); }

  function mineHtml() {
    const docs = listDocs();
    if (!docs.length) return `<div class="rs-note">📁 هنوز رزومه‌ای نساختی.<br><br><button class="rs-btn primary" data-rs-tab="tpls">🗂 رفتن به قالب‌ها</button> <button class="rs-btn" data-rs-tab="wz">🧠 ویزارد هوشمند</button></div>`;
    return `<div class="rs-dgrid">${docs.map((d) => {
      const t = tplById(d.templateId);
      return `<div class="rs-dcard"><b>${t ? t.icon : '📄'} ${esc(d.name || 'بدون نام')}</b>
        <small>${t ? esc(t.fa) : 'قالب حذف شده'} • ${new Date(d.updatedAt || 0).toLocaleDateString('fa-IR')}</small>
        <div class="rs-row"><button class="rs-btn sm primary" data-open="${d.id}">✏️ ویرایش</button>
        <button class="rs-btn sm" data-printdoc="${d.id}">🖨 چاپ</button>
        <button class="rs-btn sm" data-dup="${d.id}">📋 کپی</button>
        <button class="rs-btn sm danger" data-del="${d.id}">🗑</button></div></div>`;
    }).join('')}</div>`;
  }

  function editHtml() {
    const { tpl, doc, dirty } = edit;
    return `${editorBarHtml(tpl, doc, dirty)}
      <details class="rs-note" style="margin-bottom:10px"><summary>💡 راهنمای این قالب (${esc(tpl.pages || '')}، ${photoTag(tpl.photo)}) — کلیک کن</summary>
      <div style="margin-top:6px">${esc(tpl.blurb || '')}<ul style="margin:6px 0;padding-right:18px">${(tpl.tips || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div></details>
      <div class="rs-ed-grid"><div class="rs-formpane" data-formpane>${renderEditorForm(tpl, doc.data)}</div>
      <div class="rs-prevpane" data-prevpane>${renderResume(tpl, doc.data, { ghost: true })}</div></div>`;
  }

  function renderBody() {
    renderTabs();
    const host = root.querySelector('[data-rs="body"]');
    if (view === 'edit') host.innerHTML = editHtml();
    else if (tab === 'tpls') host.innerHTML = tplsHtml();
    else if (tab === 'wz') host.innerHTML = wzHtml();
    else if (tab === 'cb') host.innerHTML = cbHtml();
    else host.innerHTML = mineHtml();
    if (view === 'edit') refreshPreview(false);
  }

  /* ================= اکشن‌ها ================= */

  function toast(msg) {
    const host = root.querySelector('[data-rs="toast"]');
    if (!host) return;
    host.innerHTML = `<div class="rs-toast">${esc(msg)}</div>`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { if (host.isConnected) host.innerHTML = ''; }, 2600);
  }

  function startEdit(tplId, doc = null) {
    const tpl = tplById(tplId);
    if (!tpl) { toast('قالب پیدا نشد!'); return; }
    edit = { tplId, tpl, doc: doc || { id: newDocId(), templateId: tplId, name: '', data: blankData(), updatedAt: Date.now() }, dirty: !doc };
    view = 'edit';
    renderBody();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function refreshPreview(debounced = true) {
    clearTimeout(prevT);
    const run = () => {
      if (destroyed || view !== 'edit' || !edit) return;
      const pane = root.querySelector('[data-prevpane]');
      if (pane) pane.innerHTML = renderResume(edit.tpl, edit.doc.data, { ghost: true });
      const pm = root.querySelector('[data-pagemeter]');
      if (pm) pm.innerHTML = pageMeterHtml(edit.tpl, edit.doc.data);
      const dd = root.querySelector('[data-dirty]');
      if (dd) dd.textContent = edit.dirty ? '● ذخیره نشده' : '✓ ذخیره شده';
    };
    if (debounced) prevT = setTimeout(run, 160);
    else run();
  }

  function doSave(silent = false) {
    if (!edit) return;
    if (!edit.doc.name.trim()) edit.doc.name = `${edit.tpl.fa} — ${edit.doc.data.fullName || 'بدون نام'}`.slice(0, 80);
    edit.doc.templateId = edit.tplId;
    saveDoc(edit.doc);
    edit.dirty = false;
    refreshPreview(false);
    if (!silent) toast('💾 ذخیره شد! از «رزومه‌های من» همیشه داریش.');
  }

  function doPrint() {
    if (!edit && view === 'edit') return;
    const tpl = view === 'edit' ? edit.tpl : tplById(currentPrintTpl);
    const data = view === 'edit' ? edit.doc.data : currentPrintData;
    if (!tpl || !data) return;
    if (tpl.photo === 'required' && !data.photo) toast('⚠️ این قالب عکس لازم دارد ولی عکس نگذاشتی!');
    let pr = document.getElementById('rs-print-root');
    if (!pr) { pr = document.createElement('div'); pr.id = 'rs-print-root'; document.body.appendChild(pr); }
    pr.innerHTML = renderResume(tpl, data, { ghost: false });
    document.body.classList.add('rs-printing');
    const cleanup = () => document.body.classList.remove('rs-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 3000);
    setTimeout(() => { try { window.print(); } catch { cleanup(); } }, 60);
  }
  let currentPrintTpl = null, currentPrintData = null;

  function openSwitch() {
    const ov = root.querySelector('[data-rs="overlay"]');
    ov.innerHTML = `<div class="rs-modal" data-close-sw><div class="rs-modal-panel" role="dialog" aria-label="تغییر قالب">
      <button class="rs-modal-x" data-swclose>✕</button><h3>🎨 تغییر قالب (اطلاعاتت حفظ می‌شود)</h3>
      <input class="rs-search" data-swq placeholder="🔎 جستجو..." />
      <div class="rs-tgrid" data-swgrid>${allTpls().map((t) => `<div class="rs-tcard"><b>${t.icon} ${esc(t.fa)}</b><div class="rs-tmeta"><i>${esc(t.pages || '')}</i><i>${t.lang === 'fa' ? 'فارسی' : 'English'}</i></div><button class="rs-btn sm primary" data-swpick="${t.id}">${t.id === edit.tplId ? '✓ فعلی' : 'انتخاب'}</button></div>`).join('')}</div></div></div>`;
    setTimeout(() => ov.querySelector('[data-swq]')?.focus(), 40);
  }
  function closeSwitch() {
    const ov = root.querySelector('[data-rs="overlay"]');
    if (ov?.querySelector('[data-close-sw]')) ov.innerHTML = '';
  }

  function goBack() {
    if (edit?.dirty && !confirm('تغییرات ذخیره نشده! خارج میشی؟')) return;
    edit = null; view = 'tabs'; tab = 'mine';
    renderBody();
  }

  /* ================= رویدادها ================= */

  function onClick(e) {
    if (e.target.hasAttribute?.('data-close-sw') && e.target.classList.contains('rs-modal')) { closeSwitch(); return; }
    const swq = e.target.closest?.('[data-swq]');
    void swq;
    // کلیک روی پیش‌نمایش → پرش به فیلد فرم
    if (view === 'edit') {
      const sec = e.target.closest?.('[data-prevpane] [data-sec]');
      if (sec && !e.target.closest('button')) {
        const g = root.querySelector('#rsf-' + sec.dataset.sec);
        if (g) { g.scrollIntoView({ behavior: 'smooth', block: 'center' }); g.classList.add('flash'); setTimeout(() => g.classList.remove('flash'), 1300); }
        return;
      }
    }
    const tabBtn = e.target.closest?.('[data-rs-tab]');
    if (tabBtn) { tab = tabBtn.dataset.rsTab; view = 'tabs'; edit = null; renderBody(); return; }
    const use = e.target.closest?.('[data-use]');
    if (use) { closeSwitch(); startEdit(use.dataset.use); return; }
    const deltpl = e.target.closest?.('[data-deltpl]');
    if (deltpl) { if (confirm('این قالب سفارشی حذف شود؟')) { deleteCustomTpl(deltpl.dataset.deltpl); renderBody(); toast('🗑 قالب حذف شد.'); } return; }
    // ویزارد
    const wzo = e.target.closest?.('[data-wz]');
    if (wzo) {
      const [q, v] = wzo.dataset.wz.split(':');
      wzAnswers[q] = v; wzStep++;
      renderBody();
      return;
    }
    if (e.target.closest?.('[data-wzback]')) { wzStep = Math.max(0, wzStep - 1); renderBody(); return; }
    if (e.target.closest?.('[data-wzrestart]')) { wzStep = 0; wzAnswers = {}; renderBody(); return; }
    const wzuse = e.target.closest?.('[data-wzuse]');
    if (wzuse) {
      const { WZ_PROFILES } = { WZ_PROFILES: scoreProfiles(wzAnswers) };
      const p = WZ_PROFILES.find((x) => x.id === wzuse.dataset.wzuse);
      if (p) {
        const tpl = draftToTpl({ name: p.fa, personal: [], ...p.cfg }, 'wz-' + p.id + '-' + Date.now().toString(36));
        saveCustomTpl(tpl);
        startEdit(tpl.id);
        toast('✨ قالب هوشمند ساخته شد! حالا پرش کن.');
      }
      return;
    }
    // سفارشی‌ساز
    const cbpick = e.target.closest?.('[data-cbpick]');
    if (cbpick) { cbDraft[cbpick.dataset.cbpick] = cbpick.dataset.v; renderBody(); return; }
    if (e.target.closest?.('[data-cbadd]')) {
      const sel = root.querySelector('[data-cb="addsec"]');
      if (sel?.value && !cbDraft.sections.includes(sel.value)) { cbDraft.sections.push(sel.value); renderBody(); }
      return;
    }
    const up = e.target.closest?.('[data-cbup]');
    if (up) { const i = +up.dataset.cbup; [cbDraft.sections[i - 1], cbDraft.sections[i]] = [cbDraft.sections[i], cbDraft.sections[i - 1]]; renderBody(); return; }
    const down = e.target.closest?.('[data-cbdown]');
    if (down) { const i = +down.dataset.cbdown; [cbDraft.sections[i + 1], cbDraft.sections[i]] = [cbDraft.sections[i], cbDraft.sections[i + 1]]; renderBody(); return; }
    const cbdel = e.target.closest?.('[data-cbdel]');
    if (cbdel) { cbDraft.sections = cbDraft.sections.filter((s) => s !== cbdel.dataset.cbdel); renderBody(); return; }
    if (e.target.closest?.('[data-cbsave]')) {
      if (!cbDraft.sections.length) { toast('⚠️ حداقل یک بخش انتخاب کن!'); return; }
      const tpl = draftToTpl(cbDraft);
      saveCustomTpl(tpl);
      cbDraft = blankDraft();
      startEdit(tpl.id);
      toast('🎨 قالبت ذخیره شد! حالا پرش کن.');
      return;
    }
    // رزومه‌های من
    const open = e.target.closest?.('[data-open]');
    if (open) { const d = listDocs().find((x) => String(x.id) === String(open.dataset.open)); if (d) startEdit(d.templateId, JSON.parse(JSON.stringify(d))); return; }
    const prt = e.target.closest?.('[data-printdoc]');
    if (prt) {
      const d = listDocs().find((x) => String(x.id) === String(prt.dataset.printdoc));
      if (d && tplById(d.templateId)) {
        const keepView = view, keepEdit = edit;
        view = 'tabs-print'; currentPrintTpl = d.templateId; currentPrintData = d.data;
        // چاپ مستقیم سند ذخیره‌شده
        let pr = document.getElementById('rs-print-root');
        if (!pr) { pr = document.createElement('div'); pr.id = 'rs-print-root'; document.body.appendChild(pr); }
        pr.innerHTML = renderResume(tplById(d.templateId), d.data, { ghost: false });
        document.body.classList.add('rs-printing');
        window.addEventListener('afterprint', () => document.body.classList.remove('rs-printing'), { once: true });
        setTimeout(() => { try { window.print(); } catch {} }, 60);
        view = keepView; edit = keepEdit;
      }
      return;
    }
    const dup = e.target.closest?.('[data-dup]');
    if (dup) {
      const d = listDocs().find((x) => String(x.id) === String(dup.dataset.dup));
      if (d) { const c = JSON.parse(JSON.stringify(d)); c.id = newDocId(); c.name = (c.name || '') + ' (کپی)'; saveDoc(c); renderBody(); toast('📋 کپی شد!'); }
      return;
    }
    const del = e.target.closest?.('[data-del]');
    if (del) { if (confirm('این رزومه حذف شود؟')) { deleteDoc(del.dataset.del); renderBody(); toast('🗑 حذف شد.'); } return; }
    // ویرایشگر
    if (view === 'edit' && edit) {
      const add = e.target.closest?.('[data-eadd]');
      if (add) { addItem(edit.doc.data, add.dataset.eadd); edit.dirty = true; renderBody(); return; }
      const edel = e.target.closest?.('[data-edel]');
      if (edel) { delItem(edit.doc.data, edel.dataset.edel); edit.dirty = true; renderBody(); return; }
      if (e.target.closest?.('[data-fphoto-del]')) { edit.doc.data.photo = ''; edit.dirty = true; renderBody(); return; }
      const swpick = e.target.closest?.('[data-swpick]');
      if (swpick) {
        const t = tplById(swpick.dataset.swpick);
        if (t) { edit.tpl = t; edit.tplId = t.id; edit.doc.templateId = t.id; edit.dirty = true; closeSwitch(); renderBody(); toast(`🎨 قالب «${t.fa}» اعمال شد!`); }
        return;
      }
      if (e.target.closest?.('[data-swclose]')) { closeSwitch(); return; }
      const act = e.target.closest?.('[data-act]');
      if (act) {
        const a = act.dataset.act;
        if (a === 'back') goBack();
        else if (a === 'save') doSave();
        else if (a === 'print') { doSave(true); doPrint(); }
        else if (a === 'switch') openSwitch();
        else if (a === 'sample') { edit.doc.data = sampleData(edit.tpl.lang); edit.dirty = true; renderBody(); toast('🪄 با داده نمونه پر شد! جایگزینش کن.'); }
        else if (a === 'clear') { if (confirm('همه فیلدها پاک شود؟')) { edit.doc.data = blankData(); edit.dirty = true; renderBody(); } }
        return;
      }
    }
  }

  function onInput(e) {
    const q = e.target.closest?.('[data-rs-q]');
    if (q) { query = q.value; clearTimeout(onInput._q); onInput._q = setTimeout(() => { const pos = q.selectionStart; renderBody(); const nq = root.querySelector('[data-rs-q]'); if (nq) { nq.focus(); nq.setSelectionRange(pos, pos); } }, 350); return; }
    const swq = e.target.closest?.('[data-swq]');
    if (swq) {
      const v = swq.value.trim().toLowerCase();
      root.querySelectorAll('[data-swgrid] .rs-tcard').forEach((c) => { c.style.display = !v || c.textContent.toLowerCase().includes(v) ? '' : 'none'; });
      return;
    }
    if (view === 'edit' && edit) {
      if (e.target.matches?.('[data-docname]')) { edit.doc.name = e.target.value; edit.dirty = true; refreshPreview(); return; }
      const f = e.target.closest?.('[data-f]');
      if (f && !f.matches('input[type="checkbox"]')) { applyField(edit.doc.data, f.dataset.f, f.value); edit.dirty = true; refreshPreview(); return; }
    }
    if (tab === 'cb' && view === 'tabs') {
      const cb = e.target.closest?.('[data-cb="name"]');
      if (cb) { cbDraft.name = cb.value; refreshCustomPreview(root, cbDraft); return; }
    }
  }

  function onChange(e) {
    if (view === 'edit' && edit) {
      if (e.target.matches?.('[data-fphoto]')) {
        const file = e.target.files?.[0];
        if (file) fileToPhoto(file).then((url) => { edit.doc.data.photo = url; edit.dirty = true; renderBody(); toast('📷 عکس اضافه شد!'); }).catch(() => toast('❌ فایل معتبر نیست.'));
        return;
      }
      const chk = e.target.closest?.('[data-fcheck]');
      if (chk) { applyField(edit.doc.data, chk.dataset.fcheck, chk.checked, true); edit.dirty = true; refreshPreview(); return; }
    }
    if (tab === 'cb' && view === 'tabs') {
      const sel = e.target.closest?.('[data-cb]');
      if (sel && sel.dataset.cb !== 'name' && sel.dataset.cb !== 'addsec') {
        const k = sel.dataset.cb;
        if (k === 'base' && sel.value) { const t = tplById(sel.value); if (t) cbDraft = draftFromTpl(t); }
        else if (k === 'pageMax') cbDraft.pageMax = Number(sel.value);
        else cbDraft[k] = sel.value;
        renderBody();
        return;
      }
      const per = e.target.closest?.('[data-cbper]');
      if (per) {
        const k = per.dataset.cbper;
        cbDraft.personal = per.checked ? [...cbDraft.personal, k] : cbDraft.personal.filter((x) => x !== k);
        renderBody();
        return;
      }
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      if (root.querySelector('[data-close-sw]')) { closeSwitch(); return; }
      if (view === 'edit') goBack();
    }
  }

  /* ================= چرخه ================= */

  async function afterRender() {
    const host = document.querySelector('.rs-root');
    if (!host) return;
    root = host;
    releaseCss = injectScopedCss(resumeCss, 'resume-page');
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
    renderBody();
  }

  function destroy() {
    destroyed = true;
    clearTimeout(prevT);
    clearTimeout(toast._t);
    document.body.classList.remove('rs-printing');
    document.getElementById('rs-print-root')?.remove();
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
      root.removeEventListener('change', onChange);
    }
    document.removeEventListener('keydown', onKeydown);
    if (releaseCss) releaseCss();
  }

  return { render, afterRender, destroy };
}
