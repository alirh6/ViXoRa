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

  // ۱. داشبورد و شاخص‌ها
  // {
  //   path: '/dashboard',
  //   layout: createDashboardLayout,
  //   layoutKey: 'dashboard-layout',
  //   component: createPlaceholderPage('میز کار و داشبورد', 'نمایش نمودارهای فروش، درآمد و آخرین فاکتورها'),
  //   meta: { requiresAuth: true, title: 'داشبورد مدیریت' }
  // },

  // // ۲. مدیریت فاکتورها
  // {
  //   path: '/invoices',
  //   layout: createDashboardLayout,
  //   layoutKey: 'dashboard-layout',
  //   component: createPlaceholderPage('مدیریت فاکتورها', 'لیست صدور فاکتورها، وضعیت پرداخت و چاپ صورت‌حساب'),
  //   meta: { requiresAuth: true, title: 'فاکتورها' }
  // },

  // // ۳. مدیریت مشتریان (CRM)
  // {
  //   path: '/customers',
  //   layout: createDashboardLayout,
  //   layoutKey: 'dashboard-layout',
  //   component: createPlaceholderPage('بانک اطلاعات مشتریان', 'لیست سرنخ‌ها، مشتریان ثابت و تاریخچه تعاملات'),
  //   meta: { requiresAuth: true, title: 'مشتریان' }
  // },

  // // ۴. ماژول حسابداری (مخصوص نقش Admin)
  // {
  //   path: '/accounting',
  //   layout: createDashboardLayout,
  //   layoutKey: 'dashboard-layout',
  //   component: createPlaceholderPage('ماژول حسابداری دوبل', 'دفتر روزنامه، تراز آزمایشی و سود و زیان دوره'),
  //   meta: { requiresAuth: true, roles: ['admin'], title: 'حسابداری پیشرفته' }
  // },

  // // ۵. تنظیمات سیستم
  // {
  //   path: '/settings',
  //   layout: createDashboardLayout,
  //   layoutKey: 'dashboard-layout',
  //   component: createPlaceholderPage('تنظیمات برنامه', 'مدیریت تم، زبان برنامه و پیکربندی سیستم'),
  //   meta: { requiresAuth: true, title: 'تنظیمات' }
  // },

  // // ۶. صفحه ورود (Auth Layout - فقط مخصوص کاربران لاگین‌نکرده)
  // {
  //   path: '/login',
  //   layout: createAuthLayout,
  //   layoutKey: 'auth-layout',
  //   component: createPlaceholderPage('ورود به حساب کاربری', 'لطفاً نام کاربری و کلمه عبور خود را وارد کنید.'),
  //   meta: { guestOnly: true, title: 'ورود به سیستم' }
  // },

  // // ۷. صفحه عدم دسترسی ۴۰۳
  // {
  //   path: '/unauthorized',
  //   layout: null, // بدون لایوت (تمام صفحه)
  //   layoutKey: null,
  //   component: createPlaceholderPage('عدم دسترسی (403)', 'شما مجوز مشاهده این صفحه را ندارید. (نیاز به نقش Admin)'),
  //   meta: { title: 'دسترسی غیرمجاز' }
  // },

  // // ۸. صفحه خطای ۴۰۴
  // {
  //   path: '/404',
  //   layout: null, // بدون لایوت
  //   layoutKey: null,
  //   component: createPlaceholderPage('صفحه پیدا نشد (404)', 'مسیر درخواستی در سامانه وجود ندارد.'),
  //   meta: { title: 'صفحه پیدا نشد' }
  // }
];