const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const errs = [];
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
  await page.goto(BASE + '/tools/entertainment', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.click('[data-ag-open="tank-battle"]');
  await page.waitForTimeout(1100);
  await page.click('[data-go]');
  await page.waitForTimeout(700);
  // مدافع: جارو کردن ردیف پایین + شلیک مداوم
  for (let i = 0; i < 60; i++) {
    const k = i % 4 < 2 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(k);
    await page.waitForTimeout(280);
    await page.keyboard.up(k);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press(' ');
    await page.waitForTimeout(200);
    const ov = await page.evaluate(() => !!document.querySelector('[data-over]'));
    if (ov) break;
  }
  const st = await page.evaluate(() => ({
    s: document.querySelector('[data-s]').textContent,
    l: document.querySelector('[data-l]').textContent,
    v: document.querySelector('[data-v]').textContent,
    over: !!document.querySelector('[data-over]'),
  }));
  console.log('tank-defense:', JSON.stringify(st));
  await page.screenshot({ path: '/home/user/.tooling/e2e/shots/final-tank2.png' });
  console.log('ERRORS: ' + errs.length);
  [...new Set(errs)].slice(0, 5).forEach((e) => console.log(e));
  await browser.close();
  process.exit(errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
