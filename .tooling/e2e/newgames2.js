// اکشن زنده ۸ بازی: اسکرین‌شات وسط گیم‌پلی فعال
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const errs = [];
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

  async function open(id) {
    await page.click(`[data-ag-open="${id}"]`);
    await page.waitForTimeout(1100);
    await page.click('[data-go]');
    await page.waitForTimeout(700);
    return page.locator('[data-cv]');
  }
  async function close() { await page.click('[data-ag-exit]'); await page.waitForTimeout(600); }

  // مترو: ۲ ثانیه صاف + پرش
  let cv = await open('subway-run');
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + '/live-subway.png' });
  await close();

  // کرم: هدایت ملایم به مرکز
  cv = await open('slither');
  const sb = await cv.boundingBox();
  await page.mouse.move(sb.x + sb.width / 2 + 60, sb.y + sb.height / 2, { steps: 4 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: OUT + '/live-slither.png' });
  await close();

  // دش: دو پرش
  await open('geo-dash');
  await page.waitForTimeout(900);
  await page.keyboard.down(' ');
  await page.waitForTimeout(300);
  await page.keyboard.up(' ');
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + '/live-geo.png' });
  await close();

  // تپه: ۳ ثانیه گاز
  await open('hill-climb');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowRight');
  await page.screenshot({ path: OUT + '/live-hill.png' });
  await close();

  // هاکی: ضربه
  cv = await open('air-hockey');
  const hb = await cv.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height - 80);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height * 0.55, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '/live-hockey.png' });
  await close();

  // منجنیق: پرتاب قوی
  cv = await open('angry-sling');
  const lb = await cv.boundingBox();
  const sx = lb.x + lb.width * 0.3, sy = lb.y + lb.height * 0.6;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx - 100, sy + 30, { steps: 10 });
  await page.screenshot({ path: OUT + '/live-sling-aim.png' });
  await page.mouse.up();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: OUT + '/live-sling-fly.png' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: OUT + '/live-sling-after.png' });
  await close();

  // بمب: بمب + فرار
  await open('bomber');
  await page.keyboard.press(' ');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '/live-bomber.png' });
  await close();

  // تانک: حرکت + شلیک
  await open('tank-battle');
  await page.waitForTimeout(1500);
  await page.keyboard.press(' ');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press(' ');
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + '/live-tank.png' });
  await close();

  console.log('ERRORS: ' + errs.length);
  [...new Set(errs)].slice(0, 10).forEach((e) => console.log(e));
  await browser.close();
  process.exit(errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
