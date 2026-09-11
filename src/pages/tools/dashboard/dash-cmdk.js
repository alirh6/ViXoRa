// ⌨️ ViXoRa Command Palette — فرمان‌یاب سراسری داشبورد
// src/pages/tools/dashboard/dash-cmdk.js
import { esc, faDigits, getFavs } from './dash-state.js';

const RECENT_KEY = 'ViXoRa:dash-cmdk-recent';

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(id) {
  try {
    const r = [id, ...getRecent().filter((x) => x !== id)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(r));
  } catch { /* ignore */ }
}

/* ================================================================== */
/* رجیستری دستورات (۶۰+)                                                  */
/* ================================================================== */
export function buildCommands(api) {
  const go = (link) => () => api.navigate(link);
  const C = [];
  const add = (id, icon, title, hint, run, keywords = '') => C.push({ id, icon, title, hint, run, keywords });

  // ناوبری ابزارها
  add('go-note', '📝', 'یادداشت‌ها', 'Go N', go('/tools/note'), 'note یادداشت نوشتن');
  add('go-music', '🎵', 'موزیک', 'Go M', go('/tools/music'), 'music موزیک آهنگ پلیر');
  add('go-fin', '💰', 'سوپراپ مالی', 'Go F', go('/tools/invoices'), 'مالی پول حساب فاکتور finance');
  add('go-cust', '👥', 'مشتریان', 'Go C', go('/tools/customerInfo'), 'مشتری customer');
  add('go-build', '🏢', 'ساختمان', 'Go B', go('/tools/building'), 'ساختمان واحد building');
  add('go-arcade', '🎮', 'آرکید', 'Go A', go('/tools/entertainment'), 'بازی arcade game');
  add('go-dash', '🛩', 'کاکپیت', 'Go D', go('/tools/dashboard'), 'داشبورد cockpit');

  // موزیک
  add('mx-toggle', '⏯', 'پخش / مکث موزیک', 'Space', async () => {
    const P = await import('../../../core/services/music-player-service.js');
    const st = P.getPlayerState();
    if (!st.song) {
      const L = await import('../../../core/services/music-library-service.js');
      const songs = await L.listSongs().catch(() => []);
      if (songs.length) await P.playSongs(songs, 0);
      else api.toast('🎵 آهنگی نیست.');
    } else P.togglePlayback();
  }, 'پخش مکث play pause');
  add('mx-next', '⏭', 'آهنگ بعدی', '', async () => (await import('../../../core/services/music-player-service.js')).nextTrack(false), 'بعدی next');
  add('mx-prev', '⏮', 'آهنگ قبلی', '', async () => (await import('../../../core/services/music-player-service.js')).prevTrack(), 'قبلی prev');
  add('mx-shuffle', '🔀', 'شافل همه آهنگ‌ها', '', async () => {
    const L = await import('../../../core/services/music-library-service.js');
    const P = await import('../../../core/services/music-player-service.js');
    const songs = [...(await L.listSongs().catch(() => []))].sort(() => Math.random() - 0.5);
    if (songs.length) { await P.playSongs(songs, 0); api.toast('🔀 شافل شروع شد.'); }
  }, 'شافل تصادفی shuffle');
  add('mx-liked', '❤️', 'پخش علاقه‌مندی‌ها', '', async () => {
    const L = await import('../../../core/services/music-library-service.js');
    const P = await import('../../../core/services/music-player-service.js');
    const songs = (await L.listSongs().catch(() => [])).filter((s) => s.liked);
    if (songs.length) { await P.playSongs(songs, 0); api.toast('❤️ علاقه‌مندی‌ها در حال پخش.'); }
    else api.toast('علاقه‌مندی نداری.');
  }, 'علاقه liked favorite');
  add('mx-vol-up', '🔊', 'صدا +۱۰٪', '', async () => {
    const P = await import('../../../core/services/music-player-service.js');
    const st = P.getPlayerState();
    P.setVolume(Math.min(1, (st.volume ?? 0.8) + 0.1));
  }, 'صدا volume بلند');
  add('mx-vol-down', '🔈', 'صدا −۱۰٪', '', async () => {
    const P = await import('../../../core/services/music-player-service.js');
    const st = P.getPlayerState();
    P.setVolume(Math.max(0, (st.volume ?? 0.8) - 0.1));
  }, 'صدا volume کم');

  // مالی سریع
  add('fin-tx', '🧾', 'ثبت سریع تراکنش', '', () => {
    api.gotoView('cockpit');
    setTimeout(() => api.root.querySelector('[data-dash="tx-amount"]')?.focus(), 300);
  }, 'تراکنش هزینه دخل ثبت');
  add('fin-report', '📊', 'گزارش‌های مالی', '', go('/tools/invoices'), 'گزارش report');
  add('fin-loans', '🏦', 'آزمایشگاه وام', '', go('/tools/invoices'), 'وام loan قسط');
  add('fin-forecast', '🔮', 'پیش‌بینی مالی', '', go('/tools/invoices'), 'پیش‌بینی forecast آینده');
  add('fin-studio', '🧾', 'استودیو فاکتور', '', go('/tools/invoices'), 'فاکتور invoice چاپ');
  add('fin-insights', '💡', 'بینش مالی', '', go('/tools/invoices'), 'بینش insight اشتراک');

  // یادداشت/مشتری
  add('note-new', '📝', 'یادداشت سریع', '', () => {
    api.gotoView('cockpit');
    setTimeout(() => api.root.querySelector('[data-dash="note-q"]')?.focus(), 300);
  }, 'یادداشت جدید note');
  add('cust-new', '👥', 'مشتری جدید', '', go('/tools/customerInfo'), 'مشتری جدید');

  // داشبورد
  add('dash-guide', '📖', 'راهنمای کامل', '?', () => api.gotoView('guide'), 'راهنما help guide');
  add('dash-report', '📰', 'گزارش هفتگی', '', () => api.gotoView('report'), 'گزارش هفتگی report');
  add('dash-settings', '⚙️', 'تنظیمات کاکپیت', '', () => api.gotoView('settings'), 'تنظیمات settings');
  add('dash-notify', '🔔', 'مرکز اعلان‌ها', '', () => api.gotoView('notify'), 'اعلان نوتیف notification');
  add('dash-analytics', '📈', 'تحلیل شخصی', '', () => api.gotoView('analytics'), 'تحلیل آمار امتیاز analytics');
  add('dash-themes', '🎨', 'گالری تم', '', () => api.gotoView('themes'), 'تم رنگ theme');
  add('dash-export-center', '📤', 'مرکز خروجی', '', () => api.gotoView('export'), 'خروجی بکاپ export backup');
  add('dash-auto', '🤖', 'خودکارسازی‌ها', '', () => api.gotoView('auto'), 'خودکار اتومیشن auto');
  add('dash-journal', '📓', 'ژورنال روزانه', '', () => api.gotoView('journal'), 'ژورنال حال روزانه journal');
  add('dash-remote', '🎛', 'ریموت موزیک', '', () => api.gotoView('remote'), 'ریموت کنترل remote');
  add('dash-calendar', '📅', 'تقویم یکپارچه', '', () => api.gotoView('calendar'), 'تقویم رویداد calendar');
  add('dash-habits', '🔥', 'اتاق عادت‌ها', '', () => api.gotoView('habits'), 'عادت habit');
  add('dash-focus', '🧘', 'اتاق تمرکز', '', () => api.gotoView('focus'), 'تمرکز فوکوس focus');
  add('dash-insights', '🧠', 'بینش‌های هوشمند', '', () => api.gotoView('insights'), 'بینش هوشمند insight');
  add('dash-achieve', '🏆', 'دستاوردها', '', () => api.gotoView('achieve'), 'دستاورد مدال جام achieve');
  add('digest-show', '🌅', 'خلاصه امروز (دایجست)', '', async () => { (await import('./dash-digest.js')).showDigestNow(api); }, 'دایجست خلاصه امروز digest');
  add('dash-goals', '🎯', 'هاب اهداف', '', () => api.gotoView('goals'), 'هدف goals');
  add('dash-review', '🌙', 'مرور شبانه', '', () => api.gotoView('review'), 'مرور شب review');
  add('dash-changelog', '✨', 'تازه‌های نسخه', '', () => { api.gotoView('changelog'); }, 'تازه جدید changelog update');
  add('welcome-replay', '👋', 'اجرای ویزارد شروع', '', async () => { (await import('./dash-welcome.js')).openWelcome(api.root); }, 'ویزارد شروع welcome');
  add('review-start', '🌙', 'شروع مرور امشب', '', () => { api.gotoView('review'); api.toast('🌙 ۵ قدم تا خواب آرام!'); }, 'بستن روز');
  add('quote-copy', '💬', 'کپی نقل‌قول امروز', '', async () => { const Q = await import('./dash-quotes.js'); const q = Q.quoteOfDay(); try { await navigator.clipboard.writeText(`«${q[0]}» — ${q[1]}`); localStorage.setItem('vixora:quote-copied', '1'); api.toast('📋 کپی شد!'); } catch { api.toast(q[0]); } }, 'نقل قول quote');
  add('agenda-show', '📌', 'دستور ۱۴ روز آینده', '', async () => { api.gotoView('calendar'); }, 'آجندا برنامه agenda');
  add('habit-export', '🔥', 'خروجی CSV عادت‌ها', '', async () => { const H = await import('./dash-habits.js'); H.exportHabitsCSV(); api.toast('✅ خروجی گرفته شد.'); }, 'عادت csv');
  add('journal-insights-go', '📊', 'بینش‌های ژورنال', '', () => api.gotoView('journal'), 'بینش ژورنال');
  add('letter-write', '💌', 'نامه به خود فردا', '', () => { api.gotoView('cockpit'); api.toast('💌 ویجت «نامه به فردا» را روشن کن!'); }, 'نامه فردا letter');
  add('moon-show', '🌙', 'ماه امشب', '', () => { const M = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']; const i = Math.floor(((Date.now()/86400000 - 10957.5) % 29.53 + 29.53) % 29.53 / 29.53 * 8) % 8; api.toast(`ماه امشب: ${M[i]}`); }, 'ماه moon');
  add('eisenhower-go', '◫', 'ماتریس آیزنهاور', '', () => { api.gotoView('cockpit'); api.toast('◫ ویجت آیزنهاور را از گالری روشن کن!'); }, 'آیزنهاور اولویت');
  add('year-progress', '🎆', 'سال چقدر رفته؟', '', () => { const d = new Date(); const p = Math.round((d - new Date(d.getFullYear(),0,1)) / (365*86400000) * 100); api.toast(`🎆 ${p}٪ از سال رفته — بجنب!`); }, 'سال پیشرفت year');
  add('song-roulette', '🎰', 'رولت آهنگ', '', async () => { const W = await import('./dash-widgets11.js'); await W.handleWidgets11Action('w11-song', { closest: () => null }, api); }, 'رولت شانسی');
  add('insight-refresh', '✨', 'تولید بینش تازه', '', () => { api.gotoView('insights'); api.toast('✨ بینش‌ها تازه شدند!'); }, 'تحلیل تازه');
  add('go-journal-cmdk', '✍️', 'نوشتن سریع ژورنال', '', () => api.gotoView('journal'), 'ژورنال نوشتن');
  add('go-cal-cmdk', '📅', 'تقویم امروز', '', () => api.gotoView('calendar'), 'تقویم امروز');
  add('sleep-15', '😴', 'تایمر خواب ۱۵ دقیقه', '', async () => { (await import('../../../core/services/music-player-service.js')).setSleepTimer(15); api.toast('😴 ۱۵ دقیقه دیگر می‌خوابد.'); }, 'خواب تایمر');
  add('vol-up', '🔊', 'صدا +۱۰٪', '', async () => { const P = await import('../../../core/services/music-player-service.js'); const st = P.getPlayerState(); P.setVolume(Math.min(1, st.volume + 0.1)); }, 'صدا زیاد volume');
  add('vol-down', '🔉', 'صدا −۱۰٪', '', async () => { const P = await import('../../../core/services/music-player-service.js'); const st = P.getPlayerState(); P.setVolume(Math.max(0, st.volume - 0.1)); }, 'صدا کم volume');
  add('rate-cycle', '⏩', 'چرخه سرعت پخش', '', async () => { const P = await import('../../../core/services/music-player-service.js'); const st = P.getPlayerState(); const rs = [1, 1.25, 1.5, 2, 0.75]; P.setRate(rs[(rs.indexOf(st.rate) + 1) % rs.length] || 1); }, 'سرعت rate');
  add('water-log', '💧', 'ثبت یک لیوان آب', '', () => { const k = 'vixora:water-' + new Date().toDateString(); localStorage.setItem(k, String(+(localStorage.getItem(k) || 0) + 1)); api.toast('💧 ثبت شد!'); }, 'آب water');
  add('task-quick', '✅', 'کار سریع امروز', '', () => { const t = prompt('✅ متن کار:'); if (t?.trim()) { const k = 'vixora:tasks-' + new Date().toDateString(); const a = JSON.parse(localStorage.getItem(k) || '[]'); a.push({ text: t.trim(), done: false }); localStorage.setItem(k, JSON.stringify(a)); api.toast('✅ اضافه شد.'); } }, 'کار تسک task');
  add('mood-quick', '😊', 'ثبت سریع حال', '', () => { const m = prompt('😊 حالت؟ (۱-۵ یا ایموجی)', '🙂'); if (m) { const a = JSON.parse(localStorage.getItem('vixora:mood') || '[]'); a.push({ ts: Date.now(), mood: m }); localStorage.setItem('vixora:mood', JSON.stringify(a.slice(-365))); api.toast('😊 ثبت شد!'); } }, 'حال مود mood');
  add('breathe-go', '🫁', 'یک دقیقه تنفس', '', () => { api.gotoView('cockpit'); api.toast('🫁 ویجت تنفس را روشن کن و با دایره نفس بکش!'); }, 'تنفس آرامش');
  add('focus-25', '🍅', 'شروع پومودورو ۲۵', '', () => { api.gotoView('focus'); setTimeout(() => document.querySelector('[data-action="f-start"]')?.click(), 300); }, 'پومودورو تمرکز');
  add('habit-tick-first', '✅', 'تیک اولین عادت امروز', '', async () => {
    const H = await import('./dash-habits.js');
    const hs = H.getHabits();
    if (hs[0]) await H.handleHabitsAction('hb-tick', { dataset: { v: hs[0].id } }, api);
    else api.toast('عادتی نیست!');
  }, 'تیک عادت');
  add('journal-today', '✍️', 'نوشتن ژورنال امروز', '', () => { api.st.jDay = ''; api.gotoView('journal'); }, 'نوشتن خاطرات');
  add('remote-toggle', '⏯', 'پخش/مکث (ریموت)', '', async () => { const R = await import('./dash-remote.js'); await R.handleRemoteAction('r-toggle', {}, api); }, 'پخش ریموت');
  add('notify-scan', '🔍', 'بررسی یادآورها', '', async () => {
    const N = await import('./dash-notify.js');
    N.scanReminders(); N.updateNotifyBadge();
    api.toast(`🔍 بررسی شد: ${N.unreadCount()} خوانده‌نشده`);
  }, 'یادآور بررسی remind');
  add('notify-read', '✓', 'خواندن همه اعلان‌ها', '', async () => { (await import('./dash-notify.js')).markAllRead(); api.rerender(); }, 'خوانده شدن');
  add('xp-quick-backup', '🛟', 'بکاپ فوری', '', async () => { const n = (await import('./dash-export.js')).exportFullBackup(); api.toast(`✅ بکاپ کامل (${n} کلید)`); }, 'بکاپ فوری backup');
  add('xp-quick-csv', '💰', 'خروجی CSV تراکنش‌ها', '', async () => { const n = (await import('./dash-export.js')).exportTxCSV(); api.toast(`✅ ${n} تراکنش خروجی شد`); }, 'csv اکسل excel');
  add('theme-cycle2', '🎨', 'تم بعدی (گالری جدید)', '', async () => { const T = await import('./dash-themes.js'); const t = T.cycleTheme(); api.toast(`🎨 ${t.name}`); }, 'تم بعدی');
  add('goal-quick', '🏁', 'هدف سریع هفته', '', async () => {
    const t = prompt('🏁 متن هدف:');
    if (t?.trim()) { (await import('./dash-stats.js')).addWeeklyGoal(t.trim(), 5); api.toast('🏁 اضافه شد.'); }
  }, 'هدف goal');
  add('decide-quick', '🎯', 'تصمیم شانسی', '', () => { api.gotoView('cockpit'); api.toast('🎯 ویجت تصمیم‌گیر را روشن کن!'); }, 'تصمیم شیرخط');
  add('dash-gallery', '🧩', 'گالری ویجت‌ها', '', () => api.openGallery(), 'ویجت widget اضافه');
  add('dash-theme', '🎨', 'تم بعدی', 'T', () => api.cycleTheme(), 'تم theme رنگ');
  add('dash-refresh', '🔄', 'تازه‌سازی داده‌ها', 'R', () => api.reload(), 'رفرش refresh');
  add('dash-export', '📥', 'دانلود بکاپ کامل', '', () => api.exportAll(), 'بکاپ backup خروجی');
  add('dash-tour', '🎬', 'تور آشنایی', '', () => api.startTour(), 'تور tour آموزش');
  add('dash-credit', '🌟', 'نمایش اعتبار و سازندگان', '', () => api.showCredit(), 'اعتبار credit سازنده');
  add('dash-fullscreen', '⛶', 'تمام‌صفحه', '', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => null);
    else document.documentElement.requestFullscreen().catch(() => null);
  }, 'تمام صفحه fullscreen');
  add('dash-print', '🖨', 'چاپ داشبورد', '', () => window.print(), 'چاپ print');

  // پومودورو/تمرکز
  add('pomo-start', '🍅', 'شروع پومودورو', '', () => {
    localStorage.setItem('ViXoRa:dash-pomo', JSON.stringify({ mode: 'focus', endAt: Date.now() + 25 * 60 * 1000, left: 25 * 60 }));
    api.toast('🍅 تمرکز شروع شد!');
    api.rerender();
  }, 'پومودورو تمرکز pomodoro focus');
  add('habit-add', '🔥', 'عادت جدید', '', () => {
    const v = prompt('نام عادت جدید:');
    if (v?.trim()) {
      const all = JSON.parse(localStorage.getItem('ViXoRa:dash-habits') || '[]');
      all.push({ name: v.trim().slice(0, 60), log: [] });
      localStorage.setItem('ViXoRa:dash-habits', JSON.stringify(all.slice(0, 12)));
      api.toast('🔥 عادت اضافه شد.');
      api.rerender();
    }
  }, 'عادت habit');

  // بازی
  add('game-random', '🎲', 'بازی تصادفی', '', () => {
    const games = api.data.arcade.all || [];
    if (games.length) {
      const g = games[(Math.random() * games.length) | 0];
      api.navigate('/tools/entertainment');
      api.toast(`🎲 ${g.fa || g.en || g.id}`);
    }
  }, 'بازی تصادفی game random');

  // ماشین‌حساب: با = شروع شود
  // دیپ‌لینک تب‌های موزیک
  const mxTabs = [
    ['now', '🎧', 'در حال پخش'], ['songs', '🎵', 'آهنگ‌ها'], ['playlists', '📝', 'پلی‌لیست‌ها'],
    ['albums', '💿', 'آلبوم‌ها'], ['queue', '⏭️', 'صف پخش'], ['history', '🕘', 'تاریخچه'],
    ['stats', '📊', 'آمار'], ['lyrics', '🎤', 'استودیو شعر'], ['lab', '🧪', 'آزمایشگاه تگ'],
    ['radio', '📻', 'رادیو'], ['studio', '🎛', 'استودیو صدا'],
  ];
  for (const [tab, icon, title] of mxTabs) {
    add('mx-tab:' + tab, icon, 'موزیک ← ' + title, 'تب', () => {
      try { sessionStorage.setItem('vixora:music-tab', tab); } catch { /* ignore */ }
      api.navigate('/tools/music');
    }, 'موزیک تب ' + title);
  }
  // دیپ‌لینک تب‌های مالی
  const finTabs = [
    ['dashboard', '🏠', 'خانه مالی'], ['txs', '🧾', 'تراکنش‌ها'], ['budgets', '🎯', 'بودجه‌ها'],
    ['goals', '🌟', 'اهداف'], ['debts', '🤝', 'بدهی‌ها'], ['invoices', '📄', 'فاکتورها'],
    ['bills', '💡', 'قبوض'], ['reports', '📊', 'گزارش‌ها'], ['loans', '🏦', 'وام‌ها'],
    ['forecast', '🔮', 'پیش‌بینی'], ['studio', '🧾', 'استودیو فاکتور'], ['insights', '💡', 'بینش'],
    ['settings', '⚙️', 'تنظیمات مالی'],
  ];
  for (const [tab, icon, title] of finTabs) {
    add('fin-tab:' + tab, icon, 'مالی ← ' + title, 'تب', () => {
      try { sessionStorage.setItem('vixora:fin-tab', tab); } catch { /* ignore */ }
      api.navigate('/tools/invoices');
    }, 'مالی تب ' + title);
  }
  // عملیات داشبورد بیشتر
  add('dash-hide-all', '🧹', 'مخفی کردن همه ویجت‌ها', '', async () => {
    if (!confirm('همه ویجت‌ها مخفی شوند؟')) return;
    const S = await import('./dash-state.js');
    S.saveLayout(S.loadLayout().map((w) => ({ ...w, on: false })));
    api.toast('🧹 همه مخفی شدند. از گالری برگردان.');
    api.rerender();
  }, 'مخفی همه');
  add('dash-show-all', '🧩', 'روشن کردن همه ویجت‌ها', '', () => api.toast('از گالری ویجت‌ها تک‌تک روشن کن 🧩'), 'روشن همه');
  add('dash-focus-search', '🔎', 'تمرکز روی جستجو', '/', () => {
    api.gotoView('cockpit');
    setTimeout(() => api.root.querySelector('[data-dash="gq"]')?.focus(), 300);
  }, 'جستجو focus');
  add('dash-mood', '😊', 'ثبت حال امروز', '', () => {
    const moods = ['😭', '🙁', '😐', '🙂', '🤩'];
    const v = prompt('حالت چطوره؟ یکی را کپی کن: ' + moods.join(' '));
    if (v && moods.includes(v.trim())) {
      const all = JSON.parse(localStorage.getItem('ViXoRa:dash-moods') || '{}');
      all[new Date().toDateString()] = v.trim();
      localStorage.setItem('ViXoRa:dash-moods', JSON.stringify(all));
      api.toast(v.trim() + ' ثبت شد!');
      api.rerender();
    }
  }, 'حال mood');
  add('dash-quote-copy', '🌟', 'کپی جمله روز', '', () => {
    const q = api.root.querySelector('.dash-quote');
    if (q) { navigator.clipboard?.writeText(q.textContent).catch(() => null); api.toast('📋 کپی شد.'); }
    else api.toast('ویجت جمله روز روشن نیست.');
  }, 'جمله quote');
  add('dash-scroll-top', '⬆️', 'رفتن به بالای صفحه', 'Home', () => window.scrollTo({ top: 0, behavior: 'smooth' }), 'بالا top');
  add('dash-activity-copy', '📜', 'کپی فید فعالیت', '', async () => {
    try {
      const acts = JSON.parse(localStorage.getItem('ViXoRa:dash-activity-v1') || '[]').slice(0, 20);
      await navigator.clipboard.writeText(acts.map((a) => `${a.icon} ${a.text} (${new Date(a.at).toLocaleString('fa-IR')})`).join('\n'));
      api.toast('📋 کپی شد.');
    } catch { api.toast('ناموفق بود.'); }
  }, 'فعالیت activity');
  add('dash-widget-count', '🔢', 'آمار ویجت‌ها', '', () => {
    const layout = JSON.parse(localStorage.getItem('ViXoRa:dash-layout-v1') || '[]');
    api.toast(`🧩 ${layout.filter((w) => w.on).length} روشن از ${layout.length} ویجت`);
  }, 'آمار ویجت');

  // علاقه‌مندی‌ها
  for (const f of getFavs().slice(0, 6)) {
    add('fav:' + f.link, '⭐', f.title, 'علاقه‌مندی', go(f.link), 'ستاره fav');
  }
  return C;
}

/* ================================================================== */
/* فازی‌مچ                                                                */
/* ================================================================== */
export function fuzzyScore(text, q) {
  text = String(text || '').toLowerCase();
  q = String(q || '').trim().toLowerCase();
  if (!q) return 1;
  if (text.includes(q)) return 100 + q.length;
  let ti = 0, score = 0;
  for (const ch of q) {
    const i = text.indexOf(ch, ti);
    if (i < 0) return 0;
    score += (i === ti ? 2 : 1);
    ti = i + 1;
  }
  return score;
}

export function filterCommands(commands, q) {
  const recent = getRecent();
  if (!q.trim()) {
    const byId = new Map(commands.map((c) => [c.id, c]));
    const rec = recent.map((id) => byId.get(id)).filter(Boolean);
    const rest = commands.filter((c) => !recent.includes(c.id));
    return [...rec.map((c) => ({ ...c, recent: true })), ...rest].slice(0, 14);
  }
  // ماشین‌حساب
  if (/^[=]?\s*[\d۰-۹+\-*/×÷().\s%٬,]+$/.test(q) && /[\d]/.test(q) && /[+\-*/×÷%]/.test(q)) {
    return [{ id: '__calc', icon: '🧮', title: q, hint: 'محاسبه', calc: true }];
  }
  return commands
    .map((c) => ({ c, s: Math.max(fuzzyScore(c.title, q), fuzzyScore(c.keywords, q) * 0.7, fuzzyScore(c.id, q) * 0.5) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 14)
    .map((x) => x.c);
}

/* ================================================================== */
/* رندر پالت                                                              */
/* ================================================================== */
export function renderCmdk(commands, q = '') {
  const list = filterCommands(commands, q);
  return `<div class="dash-cmdk" data-close-cmdk>
    <div class="dash-cmdk-panel" role="dialog" aria-label="فرمان‌یاب">
      <div class="dash-cmdk-head"><span>⌨️</span>
        <input data-cmdk="q" placeholder="دستور، ابزار یا محاسبه… (مثل 150000*12)" value="${esc(q)}" autocomplete="off" />
        <button class="dash-icon-btn" data-action="cmdk-close">✕</button>
      </div>
      <div class="dash-cmdk-list" data-cmdk="list">${cmdkListHtml(list, q)}</div>
      <div class="dash-cmdk-foot"><span>↑↓ انتخاب • Enter اجرا • Esc بستن</span></div>
    </div>
  </div>`;
}

export function cmdkListHtml(list, q) {
  if (!list.length) return '<div class="dash-empty">دستوری پیدا نشد.</div>';
  return list.map((c, i) => {
    if (c.calc) {
      let val = null;
      try {
        const s = q.replace(/^=\s*/, '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/٬|,/g, '').replace(/%/g, '/100');
        if (/^[\d\s+\-*/.()]+$/.test(s)) val = Function(`"use strict"; return (${s})`)();
      } catch { /* ignore */ }
      return `<button class="dash-cmdk-item is-sel" data-i="0" data-action="cmdk-calc" data-v="${esc(String(val ?? ''))}">
        <b>🧮</b><span>${esc(q)} = <b>${val == null || !Number.isFinite(val) ? '؟' : faDigits(Number(val.toFixed(4)).toLocaleString('en-US'))}</b></span><i>Enter: کپی</i></button>`;
    }
    return `<button class="dash-cmdk-item ${i === 0 ? 'is-sel' : ''}" data-i="${i}" data-action="cmdk-run" data-id="${esc(c.id)}">
      <b>${c.icon}</b><span>${esc(c.title)}${c.recent ? ' <i class="dash-recent">🕘 اخیر</i>' : ''}</span><i>${esc(c.hint || '')}</i></button>`;
  }).join('');
}

export function runCommand(commands, id, api) {
  const c = commands.find((x) => x.id === id);
  if (!c) return false;
  pushRecent(id);
  try {
    const h = JSON.parse(localStorage.getItem('vixora:cmdk-hist') || '[]');
    h.unshift({ id, t: `${c.icon || ''} ${c.title || id}`, ts: Date.now() });
    localStorage.setItem('vixora:cmdk-hist', JSON.stringify(h.slice(0, 30)));
  } catch { /* ignore */ }
  try { c.run(); } catch (e) { api.toast('❌ اجرای دستور ناموفق بود.'); }
  return true;
}
