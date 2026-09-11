// بازتولید باگ‌های ریسپانسیو گزارش‌شده توسط کاربر
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const fs = require('fs');
fs.mkdirSync(OUT, { recursive: true });

const errors = [];

async function probeScroll(page, tag) {
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const before = window.scrollY;
    window.scrollTo(0, 600);
    const after = window.scrollY;
    window.scrollTo(0, 0);
    // آیا اسکرولر داخلی وجود دارد؟
    const scrollers = [];
    document.querySelectorAll('.vcr-panel-content,.vcr-layout,.vcr-body').forEach((el) => {
      scrollers.push(el.className + ' sh=' + el.scrollHeight + ' ch=' + el.clientHeight);
    });
    return {
      docSH: de.scrollHeight, winH: window.innerHeight,
      bodySH: document.body.scrollHeight,
      htmlOverflow: de.style.overflow || '(css:' + getComputedStyle(de).overflow + ')',
      bodyOverflow: getComputedStyle(document.body).overflow,
      layoutH: document.querySelector('.vcr-layout')?.getBoundingClientRect().height || 0,
      scrolled: after - before,
      scrollers,
    };
  });
  console.log(`[SCROLL ${tag}] docSH=${r.docSH} winH=${r.winH} scrolled=${r.scrolled} htmlOverflow=${r.htmlOverflow} bodyOverflow=${r.bodyOverflow} layoutH=${Math.round(r.layoutH)}`);
  r.scrollers.forEach((s) => console.log(`   ${s}`));
  return r;
}

async function probeNav(page, tag) {
  const r = await page.evaluate(() => {
    const layout = document.querySelector('.vcr-layout');
    const bd = document.getElementById('vcrBackdrop');
    const side = document.querySelector('.vcr-sidebar');
    const sr = side ? side.getBoundingClientRect() : null;
    return {
      mnavOpen: layout?.classList.contains('vcr-mnav-open'),
      backdropHidden: bd?.classList.contains('hidden'),
      backdropVisible: bd ? getComputedStyle(bd).display !== 'none' : null,
      htmlOverflow: document.documentElement.style.overflow || '(none)',
      sidebar: sr ? { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height), vis: getComputedStyle(side).visibility } : null,
    };
  });
  console.log(`[NAV ${tag}] mnav=${r.mnavOpen} bdHidden=${r.backdropHidden} bdVisible=${r.backdropVisible} htmlOverflow=${r.htmlOverflow} sidebar=${JSON.stringify(r.sidebar)}`);
  return r;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push('PAGEERROR: ' + String(e).slice(0, 200)); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });

  // لاگین
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 }).catch(() => {});
  console.log('after login URL:', page.url());

  // ۱) ابزار مشتریان — موبایل
  await page.goto(BASE + '/tools/customerInfo', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/m1-customer-initial.png' });
  await probeScroll(page, 'customer-mobile-initial');
  await probeNav(page, 'customer-mobile-initial');

  // ۲) باز کردن منو با برگر
  const burger = page.locator('#vcrBurger');
  console.log('burger visible:', await burger.isVisible().catch(() => 'ERR'));
  console.log('burger count:', await page.locator('#vcrBurger').count());
  console.log('h-overflow:', await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
  if (await burger.isVisible().catch(() => false)) {
    await burger.tap().catch(() => burger.click());
    await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + '/m2-menu-open.png' });
    await probeNav(page, 'after-burger-tap');

    // ۳) ضربه روی بک‌دراپ وسط صفحه
    await page.touchscreen.tap(195, 300).catch(() => page.mouse.click(195, 300));
    await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + '/m3-after-backdrop-tap.png' });
    await probeNav(page, 'after-backdrop-tap');
  }

  // ۴) نوبار پایین: باز با «منو» بعد ناوبری
  await page.locator('#vcrBottomMenu').tap().catch(() => page.click('#vcrBottomMenu'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/m4-bottommenu-open.png' });
  await probeNav(page, 'after-bottommenu-tap');
  // ضربه روی لینک مالی در نوبار
  await page.locator('#vcrBottomNav [data-bnav="/tools/invoices"]').tap().catch(() => page.click('#vcrBottomNav [data-bnav="/tools/invoices"]'));
  await page.waitForTimeout(1000);
  console.log('after bottomnav invoices URL:', page.url());
  await page.screenshot({ path: OUT + '/m5-after-nav-invoices.png' });
  await probeNav(page, 'after-nav-invoices');
  await probeScroll(page, 'invoices-mobile');

  // ۵) پاپ‌اور کاربر: باز/بسته؟
  const userBtn = page.locator('#vcrUserBtn');
  if (await userBtn.isVisible().catch(() => false)) {
    await userBtn.tap().catch(() => userBtn.click());
    await page.waitForTimeout(500);
    await page.screenshot({ path: OUT + '/m6-user-popover.png' });
    const pop = await page.evaluate(() => ({
      htmlOverflow: document.documentElement.style.overflow || '(none)',
      pops: [...document.querySelectorAll('.vcr-popover')].map((p) => p.className + ' disp=' + getComputedStyle(p).display),
    }));
    console.log('[POPOVER]', JSON.stringify(pop));
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }

  // ۶) دسکتاپ: اسکرول ابزارها
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const d = await ctx2.newPage();
  d.on('pageerror', (e) => { errors.push('D-PAGEERROR: ' + String(e).slice(0, 200)); });
  await d.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await d.fill('input[name="username"]', 'alirh');
  await d.fill('input[name="password"]', 'ali12345');
  await d.click('[data-submit-button]');
  await d.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 }).catch(() => {});
  for (const p of ['/tools/note', '/tools/customerInfo', '/tools/invoices', '/tools/building', '/tools/entertainment']) {
    await d.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    await d.waitForTimeout(700);
    await probeScroll(d, 'desktop' + p);
  }
  await d.goto(BASE + '/tools/entertainment', { waitUntil: 'domcontentloaded' });
  await d.screenshot({ path: OUT + '/d1-hub.png' });

  // ۷) خانه موبایل: هدر + دراور
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const h = await ctx3.newPage();
  await h.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await h.waitForTimeout(800);
  await h.screenshot({ path: OUT + '/h1-home-mobile.png' });
  const hb = h.locator('[data-hl-burger]');
  console.log('home burger visible:', await hb.isVisible().catch(() => 'ERR'));
  if (await hb.isVisible().catch(() => false)) {
    await hb.tap().catch(() => hb.click());
    await h.waitForTimeout(500);
    await h.screenshot({ path: OUT + '/h2-home-drawer.png' });
    const dr = await h.evaluate(() => {
      const el = document.querySelector('[data-hl-drawer]');
      const r = el.getBoundingClientRect();
      return { open: el.classList.contains('is-open'), disp: getComputedStyle(el).display, h: Math.round(r.height), top: Math.round(r.top) };
    });
    console.log('[HOME-DRAWER]', JSON.stringify(dr));
  }
  const hscroll = await h.evaluate(() => {
    window.scrollTo(0, 800);
    const y = window.scrollY;
    window.scrollTo(0, 0);
    return { docSH: document.documentElement.scrollHeight, winH: window.innerHeight, scrolled: y };
  });
  console.log('[SCROLL home-mobile]', JSON.stringify(hscroll));
  // اسکرول وسط صفحه خانه (بخش ابزارها)
  await h.evaluate(() => document.getElementById('hm-tools')?.scrollIntoView());
  await h.waitForTimeout(600);
  await h.screenshot({ path: OUT + '/h3-home-tools-section.png' });

  console.log('\n==== ERRORS (' + errors.length + ') ====');
  [...new Set(errors)].slice(0, 15).forEach((e) => console.log(e));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
