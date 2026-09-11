// عیب‌یابی منوی هدر خانه (موبایل)
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 200)); });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const b = document.querySelector('[data-hl-burger]');
    const r = b.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const stack = document.elementsFromPoint(cx, cy).slice(0, 5).map((el) =>
      el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 3).join('.'));
    const cs = getComputedStyle(b);
    const drawer = document.querySelector('[data-hl-drawer]');
    const dr = drawer.getBoundingClientRect();
    return {
      burger: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), disp: cs.display, vis: cs.visibility, pe: cs.pointerEvents, z: cs.zIndex },
      stackAtCenter: stack,
      drawer: { open: drawer.classList.contains('is-open'), disp: getComputedStyle(drawer).display, h: Math.round(dr.height), top: Math.round(dr.top) },
      headerH: getComputedStyle(document.querySelector('.HL-header')).height,
      varH: getComputedStyle(document.documentElement).getPropertyValue('--hl-header-h'),
    };
  });
  console.log(JSON.stringify(info, null, 1));

  // کلیک مستقیم DOM (دور زدن اکشن‌پذیری پلی‌رایت)
  await page.evaluate(() => document.querySelector('[data-hl-burger]').click());
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => {
    const drawer = document.querySelector('[data-hl-drawer]');
    const r = drawer.getBoundingClientRect();
    return { open: drawer.classList.contains('is-open'), disp: getComputedStyle(drawer).display, h: Math.round(r.height), top: Math.round(r.top) };
  });
  console.log('after DOM click:', JSON.stringify(after));
  await page.screenshot({ path: '/home/user/.tooling/e2e/shots/h2-home-drawer.png' });

  // اسکرول خانه
  const hs = await page.evaluate(() => {
    window.scrollTo(0, 900);
    const y = window.scrollY;
    return { docSH: document.documentElement.scrollHeight, winH: window.innerHeight, scrolled: y };
  });
  console.log('home scroll:', JSON.stringify(hs));
  await browser.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
