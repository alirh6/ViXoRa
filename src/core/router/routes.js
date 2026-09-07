// src/core/router/routes.js

/**
 * نقشهٔ مسیرهای ViXoRa
 * ------------------------------------------------------------------
 * هر route:
 *   path        : مسیر (پشتیبانی از :param)
 *   layout      : فکتوری لایوت (اختیاری)
 *   layoutKey   : کلید یکتای لایوت (برای جلوگیری از رندر مجدد)
 *   component   : فکتوری یا dynamic import صفحه
 *   style       : (اختیاری) dynamic import فایل CSS صفحه
 *   meta        : requiresAuth / guestOnly / roles / title
 */

import { createToolsLayout } from '../../layouts/tools/toolsLayout.js' 

export const routes = [
  {
    path: '/',
    layout: () => import('../../layouts/home/homeLayout.js'),
    layoutKey: 'home-layout',
    component: () => import('../../pages/home/home.js'),
    style: () => import('../../pages/home/home.css?inline'),
    meta: { requiresAuth: false, title: 'خانه' },
  },

  {
    path: '/dashboard',
    layout: () => import('../../layouts/dashboard/dashboardLayout.js'),
    layoutKey: 'dashboard-layout',
    component: () => import('../../pages/dashboard/dashboard.js'),
    meta: { requiresAuth: true, title: 'داشبورد' },
  },

  {
    path: '/login',
    component: () => import('../../pages/auth/login/login.js'),
    meta: { guestOnly: true, title: 'ورود' },
  },

  {
    path: '/register',
    component: () => import('../../pages/auth/register/register.js'),
    meta: { guestOnly: true, title: 'ثبت‌نام' },
  },

  {
    path: '/tools/dashboard',
    layout: createToolsLayout,
    layoutKey: 'tools-layout',
    component: () => import('../../pages/tools/dashboard/toolsDashboard.js'),
    meta: { requiresAuth: true, title: 'داشبورد ابزارها' },
  },

  {
    path: '/tools/note',
    layout: createToolsLayout,
    layoutKey: 'tools-layout',
    component: () => import('../../pages/tools/note/notePage.js'),
    // CSS صفحه توسط خود صفحه به‌صورت scoped تزریق می‌شود (notePage.css.js)
    // اگر از Vite استفاده می‌کنید می‌توانید این خط را فعال کنید:
    // style: () => import('../../pages/tools/note/notePage.css?inline'),
    meta: { requiresAuth: true, title: 'یادداشت‌ها' },
  },

{ 
    path: '/404',
    component: () => ({
      render: () => `
        <section style="padding:60px 20px;text-align:center">
          <h1>۴۰۴ — صفحه یافت نشد</h1>
          <p>مسیر درخواستی شما در این برنامه وجود ندارد.</p>
          <a href="/tools/dashboard">بازگشت به داشبورد</a>
        </section>
      `,
    }),
    meta: { title: '۴۰۴' },
  },

  {
    path: '/unauthorized',
    component: () => ({
      render: () => `
        <section style="padding:60px 20px;text-align:center">
          <h1>دسترسی غیرمجاز</h1>
          <p>شما اجازهٔ مشاهدهٔ این صفحه را ندارید.</p>
          <a href="/tools/dashboard">بازگشت</a>
        </section>
      `,
    }),
    meta: { title: 'دسترسی غیرمجاز' },
  },
];
