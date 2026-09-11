// تست نهایی بمب و تانک: تخریب واقعی
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const fails = [];
const errs = [];
function ok(c, m) { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails.push(m); }
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 220)));
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
  await page.goto(BASE + '/tools/entertainment', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  // بمب: برو کنار آجرها، بمب بذار، فرار کن به گوشه امن
  await page.click('[data-ag-open="bomber"]');
  await page.waitForTimeout(1100);
  await page.click('[data-go]');
  await page.waitForTimeout(700);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(1100);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.press(' ');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(2000);
  const bScore = await page.textContent('[data-s]');
  const bLives = await page.textContent('[data-l]');
  console.log(`  (bomber score=${bScore} lives=${bLives})`);
  await page.screenshot({ path: OUT + '/final-bomber.png' });
  ok(bScore !== '۰' && bScore !== '0', 'bomber destroys bricks (score>0)');
  await page.click('[data-ag-exit]');
  await page.waitForTimeout(600);

  // تانک: دفاع کریدور ۳۵ ثانیه
  await page.click('[data-ag-open="tank-battle"]');
  await page.waitForTimeout(1100);
  await page.click('[data-go]');
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowUp');
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press(' ');
    await page.waitForTimeout(500);
    if (i % 8 === 7) {
      const k = ['ArrowLeft', 'ArrowRight', 'ArrowUp'][i % 3];
      await page.keyboard.down(k);
      await page.waitForTimeout(400);
      await page.keyboard.up(k);
    }
    const ov = await page.evaluate(() => !!document.querySelector('[data-over]'));
    if (ov) break;
  }
  const tScore = await page.textContent('[data-s]');
  const tLives = await page.textContent('[data-l]');
  const tOver = await page.evaluate(() => !!document.querySelector('[data-over]'));
  console.log(`  (tank score=${tScore} lives=${tLives} over=${tOver})`);
  await page.screenshot({ path: OUT + '/final-tank.png' });
  ok(tScore !== '۰' && tScore !== '0', 'tank kills foes (score>0)');
  await page.click('[data-ag-exit]');

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  console.log(`==== ERRORS: ${errs.length} ====`);
  [...new Set(errs)].slice(0, 10).forEach((e) => console.log(e));
  await browser.close();
  process.exit(fails.length || errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
