// import { createDashboardLayout } from '../../layouts/home/homeLayout.js';
// import { createToolsLayout } from '../../layouts/tools/toolsLayout.js';


// export const routes = [
//   // صفحه اصلی (ریدایرکت خودکار به داشبورد)
//   {
//     path: '/',
//     layout: createDashboardLayout,
//     layoutKey: 'dashboard-layout',
//     component: () => import('../../pages/home/home.js'),
//     meta: { requiresAuth: false, title: 'داشبورد' }
//   },
//   {
//     path: '/tools/dashboard',
//     layout: createToolsLayout,
//     layoutKey: 'toolsLayout',
//     component: () => import('../../pages/tools/dashboard/toolsDashboard.js'),
//     meta: { requiresAuth: false, title: 'داشبورد' }
//   },
//   {
//     path: '/tools/note',
//     layout: createToolsLayout,
//     layoutKey: 'toolsLayout',
//     component: () => import('../../pages/tools/note/note.js'),
//     meta: { requiresAuth: false, title: 'داشبورد' }
//   },
// ];






// src/core/router/routes.js

import { createDashboardLayout } from '../../layouts/home/homeLayout.js';
import { createToolsLayout } from '../../layouts/tools/toolsLayout.js';

export const routes = [
  {
    path: '/',
    layout: createDashboardLayout,
    layoutKey: 'dashboard-layout',
    component: () => import('../../pages/home/home.js'),
    meta: {
      requiresAuth: false,
      title: 'خانه',
    },
  },

  {
    path: '/login',
    component: () =>
      import('../../pages/auth/login/login.js'),
    meta: {
      guestOnly: true,
      title: 'ورود',
    },
  },

  {
    path: '/register',
    component: () =>
      import('../../pages/auth/register/register.js'),
    meta: {
      guestOnly: true,
      title: 'ثبت‌نام',
    },
  },

  {
    path: '/tools/dashboard',
    layout: createToolsLayout,
    layoutKey: 'tools-layout',
    component: () =>
      import('../../pages/tools/dashboard/toolsDashboard.js'),
    meta: {
      requiresAuth: true,
      title: 'داشبورد ابزارها',
    },
  },

  {
    path: '/tools/note',
    layout: createToolsLayout,
    layoutKey: 'tools-layout',
    component: () => import('../../pages/tools/note/note.js'),
    meta: { requiresAuth: true, title: 'داشبورد' }
  },

  //  {
  //   path: '/tools/dashboard',
  //   layout: createToolsLayout,
  //   layoutKey: 'toolsLayout',
  //   component: () => import('../../pages/tools/dashboard/toolsDashboard.js'),
  //   meta: { requiresAuth: false, title: 'داشبورد' }
  // },

  {
    path: '/unauthorized',
    component: () => ({
      render: () => `
        <section style="padding:40px;text-align:center">
          <h1>دسترسی غیرمجاز</h1>
          <p>شما اجازه مشاهده این صفحه را ندارید.</p>
          <a href="/tools/dashboard">بازگشت</a>
        </section>
      `,
    }),
    meta: {
      title: 'دسترسی غیرمجاز',
    },
  },
];
