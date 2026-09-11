// ⚙️ ViXoRa Cockpit Settings — تنظیمات، پروفایل‌ها، عیب‌یابی
// src/pages/tools/dashboard/dash-settings.js
import { esc, faDigits, loadProfiles, saveProfiles, loadLayout, saveLayout, DEFAULT_LAYOUT, saveDashUi, resetTour } from './dash-state.js';
import { THEMES, applyTheme, getCustomTheme, normalizeThemeId } from './dash-themes.js';
import { renderHealthCard, scanHealth, quarantineCorrupt, cleanOrphans } from './dash-health.js';

export function renderSettings(ui) {
  const profiles = loadProfiles();
  const names = Object.keys(profiles);
  const layout = loadLayout();
  const onCount = layout.filter((w) => w.on).length;
  return `
  <div class="dash-grid-2">
    <div class="dash-panel"><h4>🎨 ظاهر</h4>
      <div class="dash-form">
        <label>تم<select data-set="theme">${THEMES.map((t) => `<option value="${t.id}" ${ui.theme === t.id ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}${getCustomTheme() ? `<option value="custom" ${ui.theme === 'custom' ? 'selected' : ''}>🖌 ${esc(getCustomTheme().name || 'تم من')}</option>` : ''}</select></label>
        <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="view" data-v="themes">🎨 گالری کامل تم + ساخت تم</button></div>
        <div class="dash-theme-row">${THEMES.map((t) => `<button class="dash-swatch ${ui.theme === t.id ? 'is-on' : ''}" data-action="set-theme" data-v="${t.id}" style="background:linear-gradient(135deg,${t.c1},${t.c2})" title="${t.name}">${t.icon}</button>`).join('')}</div>
        <label>تراکم<select data-set="density"><option value="comfortable" ${ui.density !== 'compact' ? 'selected' : ''}>راحت</option><option value="compact" ${ui.density === 'compact' ? 'selected' : ''}>فشرده</option></select></label>
        <label>نام نمایشی (برای سلام)<input data-set="greetName" value="${esc(ui.greetName || '')}" placeholder="مثلاً: علی" /></label>
        <label class="dash-check"><input type="checkbox" data-set="clock24" ${ui.clock24 !== false ? 'checked' : ''} /> ساعت ۲۴ ساعته</label>
        <label class="dash-check"><input type="checkbox" data-set="showSeconds" ${ui.showSeconds ? 'checked' : ''} /> نمایش ثانیه</label>
        <div class="dash-row"><button class="dash-btn dash-btn-primary" data-action="set-save">💾 ذخیره ظاهر</button></div>
      </div>
    </div>
    <div class="dash-panel"><h4>👤 پروفایل‌های چیدمان (${faDigits(String(names.length))})</h4>
      <div class="dash-hint">چیدمان فعلی: ${faDigits(String(onCount))} ویجت روشن از ${faDigits(String(layout.length))}</div>
      <div class="dash-form"><label>نام پروفایل جدید<input data-set="profile-name" placeholder="مثلاً: حالت کاری" /></label>
      <div class="dash-row"><button class="dash-btn dash-btn-sm dash-btn-primary" data-action="set-profile-save">💾 ذخیره چیدمان فعلی</button></div></div>
      ${names.length ? names.map((n) => `<div class="dash-rowline"><span class="dash-t">👤 ${esc(n)}</span>
        <span class="dash-s">${faDigits(String((profiles[n].layout || []).filter((w) => w.on).length))} ویجت • ${new Date(profiles[n].at || 0).toLocaleDateString('fa-IR')}</span>
        <button class="dash-btn dash-btn-sm" data-action="set-profile-apply" data-v="${esc(n)}">📥 اعمال</button>
        <button class="dash-icon-btn" data-action="set-profile-del" data-v="${esc(n)}">🗑</button></div>`).join('')
        : '<div class="dash-empty">پروفایلی نیست.</div>'}
    </div>
  </div>
  <div class="dash-grid-2">
    <div class="dash-panel"><h4>📦 انتقال چیدمان</h4>
      <div class="dash-row">
        <button class="dash-btn dash-btn-sm" data-action="set-export">📥 خروجی JSON چیدمان</button>
        <button class="dash-btn dash-btn-sm" data-action="set-import">📤 ورود JSON</button>
        <button class="dash-btn dash-btn-sm" data-action="set-copy">📋 کپی چیدمان</button>
      </div>
      <input type="file" data-set="import-file" accept=".json,application/json" class="dash-hidden" />
      <div class="dash-hint">چیدمان را به دستگاه دیگر منتقل کن یا با دوستت به اشتراک بگذار!</div>
    </div>
    <div class="dash-panel"><h4>🔧 عیب‌یابی</h4>
      <div class="dash-row">
        <button class="dash-btn dash-btn-sm" data-action="set-refresh">🔄 تازه‌سازی داده‌ها</button>
        <button class="dash-btn dash-btn-sm" data-action="set-tour">🎬 اجرای تور آشنایی</button>
        <button class="dash-btn dash-btn-sm" data-action="set-diag">🩺 بررسی سلامت</button>
      </div>
      <div class="dash-hint" data-set="diag-out">—</div>
    </div>
  </div>
  <div class="dash-grid-2">
    <div class="dash-panel"><h4>🚀 رفتار</h4>
      <div class="dash-form">
        <label>نمای پیش‌فرض هنگام ورود<select data-set="defaultView">
          ${[['cockpit', '🛩 کاکپیت'], ['guide', '📖 راهنما'], ['report', '📰 گزارش'], ['notify', '🔔 اعلان‌ها'], ['journal', '📓 ژورنال'], ['focus', '🧘 تمرکز'], ['calendar', '📅 تقویم'], ['habits', '🔥 عادت‌ها'], ['insights', '🧠 بینش‌ها'], ['remote', '🎛 ریموت']].map(([v, l]) => `<option value="${v}" ${(ui.defaultView || 'cockpit') === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></label>
        <label>تازه‌سازی خودکار داده‌ها<select data-set="refreshMin">
          ${[[0, 'خاموش'], [1, 'هر ۱ دقیقه'], [5, 'هر ۵ دقیقه'], [15, 'هر ۱۵ دقیقه']].map(([v, l]) => `<option value="${v}" ${String(ui.refreshMin || 0) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}
        </select></label>
        <label class="dash-check"><input type="checkbox" data-set="anim" ${ui.anim !== false ? 'checked' : ''} /> انیمیشن‌های پس‌زمینه</label>
        <label class="dash-check"><input type="checkbox" data-set="sounds" ${ui.sounds ? 'checked' : ''} /> صدای اعلان پومودورو</label>
        <label class="dash-check"><input type="checkbox" data-set="compactNums" ${ui.compactNums !== false ? 'checked' : ''} /> اعداد فشرده (هزار/میلیون)</label>
        <div class="dash-row"><button class="dash-btn dash-btn-sm dash-btn-primary" data-action="set-save2">💾 ذخیره رفتار</button></div>
      </div>
    </div>
    <div class="dash-panel"><h4>⌨️ مرجع سریع کلیدها</h4>
      ${[['Ctrl/⌘ K', 'فرمان‌یاب'], ['?', 'راهنما'], ['Esc', 'بستن'], ['G + حرف', 'پرش به ابزار'], ['T', 'تم بعدی'], ['R', 'تازه‌سازی'], ['↑↓ Enter', 'در فرمان‌یاب']].map(([k, d]) => `<div class="dash-rowline"><kbd>${k}</kbd><span class="dash-t">${d}</span></div>`).join('')}
      <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="set-shortcuts">📖 همه میانبرها</button></div>
    </div>
  </div>
  <div class="dash-panel"><h4>ℹ️ درباره کاکپیت</h4>
    <div class="dash-hint">🛩 ViXoRa Cockpit نسخه ۲٫۰ — اتاق فرمان ۷ ابزار + ۱۹۴ ویجت + ۴۵ فصل راهنما + ۱۹ نما.<br />ساخته‌شده با ❤️ برای علی — Nova (Arena Agent Mode)</div>
    <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="show-credit">🌟 نمایش اعتبار متحرک</button></div>
  </div>
  ${renderHealthCard()}
  <div class="dash-panel"><h4>💾 داده و حافظه</h4>
    <div data-set="storage-out"><div class="dash-hint">⏳ در حال محاسبه…</div></div>
    <div class="dash-row" style="margin-top:8px">
      <button class="dash-btn dash-btn-sm" data-action="set-cache-clear">🧹 پاک‌سازی کش‌ها</button>
      <button class="dash-btn dash-btn-sm" data-action="set-digest-test">🌅 تست دایجست صبح</button>
      <button class="dash-btn dash-btn-sm" data-action="set-notif-test">🔔 تست اعلان</button>
      <button class="dash-btn dash-btn-sm" data-action="set-ach-reset">🏆 ریست دستاوردها</button>
    </div>
    <div class="dash-hint">کش‌ها = داده موقت (ایموجی، پیش‌نمایش). پاک‌سازی‌شان امن است و داده اصلی دست نمی‌خورد.</div>
  </div>
  <div class="dash-panel"><h4>☢️ منطقه خطر</h4>
    <div class="dash-row">
      <button class="dash-btn dash-btn-sm" data-action="set-reset-layout">↺ بازنشانی چیدمان پیش‌فرض</button>
      <button class="dash-btn dash-btn-sm dash-danger" data-action="set-wipe-ui">🗑 حذف همه تنظیمات کاکپیت</button>
    </div>
    <div class="dash-hint">⚠️ «حذف تنظیمات» فقط ظاهر/چیدمان/عادت‌های داشبورد را پاک می‌کند — داده ابزارها (یادداشت، مالی، موزیک…) دست نمی‌خورد.</div>
  </div>`;
}

export async function handleSettingsAction(action, el, api) {
  const { root, toast } = api;
  switch (action) {
    case 'set-cache-clear': {
      let n = 0, bytes = 0;
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i) || '';
          if (/cache|preview|temp|draft/i.test(k)) { bytes += (localStorage.getItem(k) || '').length; localStorage.removeItem(k); n++; }
        }
      } catch { /* ignore */ }
      toast(n ? `🧹 ${faDigits(String(n))} کش پاک شد (${faDigits((bytes / 1024).toFixed(0))}KB آزاد!)` : 'کش قابل پاک‌سازی نیست. ✨');
      api.rerender();
      return true;
    }
    case 'set-digest-test': {
      const { buildDigest } = await import('./dash-digest.js');
      const d = buildDigest();
      toast(`🌅 ${d.greet} — ${d.lines[0] || ''}`);
      return true;
    }
    case 'set-notif-test': {
      const { pushNotify, showToast, updateNotifyBadge } = await import('./dash-notify.js');
      pushNotify('🔔', 'اعلان آزمایشی', 'سیستم اعلان سالم است! ✅');
      updateNotifyBadge();
      showToast('سیستم اعلان سالم است! ✅', '🔔');
      api.rerender();
      return true;
    }
    case 'set-ach-reset': {
      if (!confirm('🏆 همه دستاوردها قفل شوند؟')) return true;
      try { localStorage.removeItem('vixora:achieve-unlocked'); } catch { /* ignore */ }
      toast('🏆 ریست شد. دوباره جمعشان کن!');
      return true;
    }
    case 'set-theme': {
      const t = applyTheme(normalizeThemeId(el.dataset.v));
      saveDashUi({ theme: t.id });
      api.toast(`🎨 ${t.icon} ${t.name}`);
      api.rerender();
      try { applyTheme(t.id); } catch { /* ignore */ }
      return true;
    }
    case 'set-save': {
      saveDashUi({
        theme: normalizeThemeId(root.querySelector('[data-set="theme"]')?.value || 'violet'),
        density: root.querySelector('[data-set="density"]')?.value || 'comfortable',
        greetName: root.querySelector('[data-set="greetName"]')?.value?.trim().slice(0, 30) || '',
        clock24: root.querySelector('[data-set="clock24"]')?.checked !== false,
        showSeconds: root.querySelector('[data-set="showSeconds"]')?.checked === true,
      });
      toast('💾 ذخیره شد.');
      api.rerender();
      return true;
    }
    case 'set-profile-save': {
      const name = root.querySelector('[data-set="profile-name"]')?.value?.trim();
      if (!name) { toast('❌ نام پروفایل را بنویس.'); return true; }
      const profiles = loadProfiles();
      profiles[name] = { layout: loadLayout(), theme: api.ui.theme, at: Date.now() };
      saveProfiles(profiles);
      toast(`👤 پروفایل «${name}» ذخیره شد.`);
      api.rerender();
      return true;
    }
    case 'set-profile-apply': {
      const p = loadProfiles()[el.dataset.v];
      if (!p) return true;
      saveLayout(p.layout || []);
      if (p.theme) saveDashUi({ theme: p.theme });
      toast(`📥 پروفایل «${el.dataset.v}» اعمال شد.`);
      api.gotoView('cockpit');
      return true;
    }
    case 'set-profile-del': {
      if (!confirm(`🗑 پروفایل «${el.dataset.v}» حذف شود؟`)) return true;
      const profiles = loadProfiles();
      delete profiles[el.dataset.v];
      saveProfiles(profiles);
      api.rerender();
      return true;
    }
    case 'set-export': {
      const payload = { app: 'ViXoRa-cockpit', at: new Date().toISOString(), layout: loadLayout(), profiles: loadProfiles() };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vixora-cockpit-layout.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('📥 خروجی دانلود شد.');
      return true;
    }
    case 'set-import': root.querySelector('[data-set="import-file"]')?.click(); return true;
    case 'set-copy': {
      try {
        await navigator.clipboard.writeText(JSON.stringify({ layout: loadLayout() }));
        toast('📋 کپی شد.');
      } catch { toast('کپی ناموفق بود.'); }
      return true;
    }
    case 'set-save2': {
      saveDashUi({
        defaultView: root.querySelector('[data-set="defaultView"]')?.value || 'cockpit',
        refreshMin: Number(root.querySelector('[data-set="refreshMin"]')?.value) || 0,
        anim: root.querySelector('[data-set="anim"]')?.checked !== false,
        sounds: root.querySelector('[data-set="sounds"]')?.checked === true,
        compactNums: root.querySelector('[data-set="compactNums"]')?.checked !== false,
      });
      toast('💾 ذخیره شد.');
      api.rerender();
      return true;
    }
    case 'set-shortcuts': {
      saveDashUi({ guideChapter: 'shortcuts' });
      api.gotoView('guide');
      return true;
    }
    case 'set-health-scan': api.gotoView('settings'); toast('🔄 اسکن مجدد انجام شد.'); return true;
    case 'set-health-fix': {
      const h = scanHealth();
      const n = quarantineCorrupt(h.corrupt);
      toast(n ? `🛠 ${n} کلید خراب قرنطینه شد.` : '✅ کلید خرابی نیست.');
      api.gotoView('settings');
      return true;
    }
    case 'set-health-clean': {
      const h = scanHealth();
      const n = cleanOrphans(h.orphans);
      toast(n ? `🧹 ${n} کلید موقت پاک شد.` : '✅ چیزی برای پاکسازی نیست.');
      api.gotoView('settings');
      return true;
    }
    case 'set-refresh': await api.reload(); toast('🔄 تازه شد.'); return true;
    case 'set-tour': api.startTour(); return true;
    case 'set-diag': {
      const d = api.data;
      const errs = (d.errors || []).join('، ') || 'هیچ‌کدام';
      const out = root.querySelector('[data-set="diag-out"]');
      if (out) out.innerHTML = `🩺 ابزارها: 📝${faDigits(String(d.notes.count))} 👥${faDigits(String(d.customers.count))} 🎵${faDigits(String(d.music.count))} 🧾${faDigits(String(d.finance.txs))} 🎮${faDigits(String(d.arcade.plays))} • خطا: ${esc(errs)}`;
      return true;
    }
    case 'set-reset-layout': {
      if (!confirm('↺ چیدمان به حالت پیش‌فرض برگردد؟')) return true;
      saveLayout(DEFAULT_LAYOUT.map((x) => ({ ...x })));
      toast('↺ چیدمان بازنشانی شد.');
      api.gotoView('cockpit');
      return true;
    }
    case 'set-wipe-ui': {
      if (!confirm('🗑 همه تنظیمات کاکپیت (تم، چیدمان، پروفایل‌ها، عادت‌ها، علاقه‌مندی‌ها) حذف شود؟\nداده ابزارها دست نمی‌خورد.')) return true;
      ['ViXoRa:dash-ui-v1', 'ViXoRa:dash-layout-v1', 'ViXoRa:dash-profiles-v1', 'ViXoRa:dash-activity-v1', 'ViXoRa:dash-fav-v1', 'ViXoRa:dash-habits', 'ViXoRa:dash-focus3', 'ViXoRa:dash-pomo', 'ViXoRa:dash-cmdk-recent', 'ViXoRa:dash-tour-v1']
        .forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
      toast('🗑 تنظیمات پاک شد. در حال بارگذاری مجدد…');
      setTimeout(() => location.reload(), 800);
      return true;
    }
    default: return false;
  }
}

export function handleSettingsChange(el, api) {
  if (el.matches?.('[data-set="import-file"]')) {
    const f = el.files?.[0];
    if (f) {
      f.text().then((text) => {
        try {
          const obj = JSON.parse(text);
          if (Array.isArray(obj.layout) && obj.layout.length) {
            saveLayout(obj.layout);
            if (obj.profiles) saveProfiles(obj.profiles);
            api.toast('📤 چیدمان وارد شد.');
            api.gotoView('cockpit');
          } else api.toast('❌ فایل معتبر نیست.');
        } catch { api.toast('❌ فایل معتبر نیست.'); }
      }).catch(() => api.toast('❌ خواندن فایل ناموفق بود.'));
    }
    el.value = '';
    return true;
  }
  if (el.matches?.('[data-set="theme"]')) {
    const t = applyTheme(normalizeThemeId(el.value));
    saveDashUi({ theme: t.id });
    api.rerender();
    try { applyTheme(t.id); } catch { /* ignore */ }
    return true;
  }
  if (el.matches?.('[data-set="density"]')) {
    saveDashUi({ density: el.value });
    api.rerender();
    return true;
  }
  return false;
}
