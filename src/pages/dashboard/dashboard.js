// src/pages/dashboard/dashboard.js

/**
 * داشبورد شخصی کاربر (/dashboard)
 * ─────────────────────────────────────────────────────────────
 * ⚠️ نسخهٔ موقت: فایل اصلی این صفحه هنگام مهاجرت پروژه در دسترس
 * نبود و چون routes.js به آن ارجاع می‌دهد، نبودِ فایل کل اپ را
 * می‌شکست (خطای vite import-analysis روی همهٔ صفحات).
 * این پیاده‌سازی سبک و واکنش‌گرا جای فایل اصلی می‌نشیند تا
 * هر وقت فایل واقعی پیدا شد، مستقیماً جایگزین شود.
 */

import { appStore } from '../../core/state/app-state.js';
import {
  selectUserDisplayName,
  selectUserRole,
  selectUserPlan,
} from '../../core/state/selectors.js';

const QUICK_LINKS = [
  { href: '/tools/dashboard', icon: '📊', title: 'کاکپیت', desc: 'داشبورد و ابزارک‌ها' },
  { href: '/tools/note', icon: '📝', title: 'یادداشت‌ها', desc: 'ثبت و سازماندهی' },
  { href: '/tools/music', icon: '🎵', title: 'موزیک پلیر', desc: 'پخش و مدیریت آهنگ‌ها' },
  { href: '/tools/invoices', icon: '💰', title: 'صورت‌حساب‌ها', desc: 'مدیریت مالی' },
  { href: '/tools/building', icon: '🏢', title: 'مدیریت ساختمان', desc: 'واحدها و شارژ' },
  { href: '/tools/entertainment', icon: '🎮', title: 'شهربازی', desc: 'بازی‌ها و سرگرمی' },
];

const STYLES = `
  .pd-root { direction: rtl; padding: 28px clamp(12px, 4vw, 40px) 56px; max-width: 1100px; margin: 0 auto; color: #e7ecf8; font-family: inherit; }
  .pd-hero { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding: 22px clamp(16px, 3vw, 28px);
    border-radius: 22px; border: 1px solid rgba(255,255,255,.09);
    background: linear-gradient(135deg, rgba(34,211,238,.12), rgba(167,139,250,.12)), rgba(13,18,38,.65);
    backdrop-filter: blur(10px); }
  .pd-hero h1 { margin: 0 0 4px; font-size: clamp(18px, 3.2vw, 26px); }
  .pd-hero p { margin: 0; color: #93a0c4; font-size: 14px; }
  .pd-meta { margin-inline-start: auto; display: flex; gap: 8px; flex-wrap: wrap; }
  .pd-chip { padding: 7px 14px; border-radius: 999px; font-size: 12.5px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); }
  .pd-grid { margin-top: 22px; display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); }
  .pd-card { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 18px; text-decoration: none; color: inherit;
    background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.08);
    transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
  .pd-card:hover { transform: translateY(-3px); border-color: rgba(34,211,238,.45); box-shadow: 0 14px 34px -16px rgba(34,211,238,.4); }
  .pd-card__icon { font-size: 26px; }
  .pd-card__t { font-weight: 700; font-size: 14.5px; }
  .pd-card__d { color: #8b96b8; font-size: 12px; }
  @media (max-width: 560px) { .pd-root { padding-top: 18px; } .pd-meta { margin-inline-start: 0; } }
`;

export default function createDashboardPage() {
  let styleEl = null;

  function render() {
    const st = appStore.getState();
    const name = selectUserDisplayName(st) || 'کاربر';
    const role = selectUserRole(st) === 'admin' ? 'مدیر ارشد' : 'کاربر';
    const plan = selectUserPlan(st) || 'free';

    return `
      <div class="pd-root">
        <header class="pd-hero">
          <div>
            <h1>سلام ${escapeHtml(name)} 👋</h1>
            <p>به داشبورد شخصی‌ات خوش آمدی — میان‌بر ابزارهای ViXoRa</p>
          </div>
          <div class="pd-meta">
            <span class="pd-chip">${escapeHtml(role)}</span>
            <span class="pd-chip">پلن: ${escapeHtml(String(plan))}</span>
          </div>
        </header>
        <div class="pd-grid">
          ${QUICK_LINKS.map((l) => `
            <a class="pd-card" href="${l.href}" data-link>
              <span class="pd-card__icon">${l.icon}</span>
              <span><span class="pd-card__t">${l.title}</span><br><span class="pd-card__d">${l.desc}</span></span>
            </a>`).join('')}
        </div>
      </div>`;
  }

  function afterRender() {
    styleEl = document.createElement('style');
    styleEl.dataset.pdStyles = '1';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
    document.querySelectorAll('.pd-card[data-link]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (globalThis.appRouter && href) {
          e.preventDefault();
          globalThis.appRouter.navigate(href);
        }
      });
    });
  }

  function destroy() {
    styleEl?.remove();
    styleEl = null;
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { render, afterRender, destroy };
}
