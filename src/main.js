// src/main.js

import { bootstrap } from './app.js';

import './styles/reset.css';
import './styles/font.css';
import './styles/global.css';
import './styles/responsive.css';
import './layouts/home/homeLayout.css';
import './layouts/tools/toolsLayout.css';
import './layouts/dashboard/dashboardLayout.css';
import './pages/home/home.css';
import './pages/auth/auth.css';

/**
 * راه‌اندازی امن برنامه با Fallback UI در صورت خطای بحرانی
 */
async function initApp() {
  try {
    await bootstrap();
  } catch (error) {
    console.error('[App] Critical Bootstrap Failure:', error);

    const root = document.getElementById('app');

    if (root) {
      root.innerHTML = `
        <main style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
          <h1 style="color:#e11d48;margin-bottom:8px;">خطا در راه‌اندازی برنامه</h1>
          <p style="color:#64748b;max-width:420px;line-height:1.8;">
            متأسفانه در راه‌اندازی سیستم مشکلی پیش آمده است.
            لطفاً صفحه را رفرش کنید یا با پشتیبانی تماس بگیرید.
          </p>
        </main>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
  initApp();
}
