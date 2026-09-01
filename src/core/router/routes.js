import { createDashboardLayout } from '../../layouts/home/homeLayout.js';
import { createToolsLayout } from '../../layouts/tools/toolsLayout.js';


export const routes = [
  // صفحه اصلی (ریدایرکت خودکار به داشبورد)
  {
    path: '/',
    layout: createDashboardLayout,
    layoutKey: 'dashboard-layout',
    component: () => import('../../pages/home/home.js'),
    meta: { requiresAuth: false, title: 'داشبورد' }
  },
  {
    path: '/tools/dashboard',
    layout: createToolsLayout,
    layoutKey: 'toolsLayout',
    component: () => import('../../pages/home/home.js'),
    meta: { requiresAuth: false, title: 'داشبورد' }
  },
  {
    path: '/tools/note',
    layout: createToolsLayout,
    layoutKey: 'toolsLayout',
    component: () => import('../../pages/tools/note/note.js'),
    meta: { requiresAuth: false, title: 'داشبورد' }
  },
];