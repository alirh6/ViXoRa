// تست عمق: مسیر برد منجنیق، تخریب بمب/تانک، گاراژ تپه، هاکی
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
  async function open(id) {
    await page.click(`[data-ag-open="${id}"]`);
    await page.waitForTimeout(1100);
    await page.click('[data-go]');
    await page.waitForTimeout(700);
  }
  async function close() { await page.click('[data-ag-exit]'); await page.waitForTimeout(600); }

  // منجنیق: پرتاب ۴۵ درجه قوی به سمت قلعه (دو تلاش)
  await open('angry-sling');
  for (let attempt = 0; attempt < 2; attempt++) {
    const lb = await page.locator('[data-cv]').boundingBox();
    const sx = lb.x + lb.width * (190 / 640), sy = lb.y + lb.height * (234 / 400);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx - 64, sy + 64, { steps: 10 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    await page.waitForTimeout(4500);
  }
  const slingScore = await page.textContent('[data-s]');
  console.log('  (sling score=' + slingScore + ')');
  await page.screenshot({ path: OUT + '/deep-sling.png' });
  ok(slingScore !== '۰' && slingScore !== '0', 'sling hits fortress (score>0)');
  await close();

  // بمب: دو انفجار کنار آجر
  await open('bomber');
  await page.keyboard.press(' ');
  await page.waitForTimeout(2600);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press(' ');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(2600);
  const bScore = await page.textContent('[data-s]');
  console.log('  (bomber score=' + bScore + ')');
  await page.screenshot({ path: OUT + '/deep-bomber.png' });
  ok(bScore !== '۰' && bScore !== '0', 'bomber destroys bricks (score>0)');
  await close();

  // تانک: ۲۵ ثانیه نبرد تصادفی
  await open('tank-battle');
  const tkeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  for (let i = 0; i < 22; i++) {
    const k = tkeys[(Math.random() * 4) | 0];
    await page.keyboard.down(k);
    await page.waitForTimeout(700);
    await page.keyboard.up(k);
    await page.keyboard.press(' ');
    await page.waitForTimeout(350);
  }
  const tScore = await page.textContent('[data-s]');
  console.log('  (tank score=' + tScore + ')');
  await page.screenshot({ path: OUT + '/deep-tank.png' });
  ok(true, 'tank 25s autoplay survived');
  await close();

  // تپه: گاراژ
  await open('hill-climb');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2500);
  await page.keyboard.up('ArrowRight');
  await page.click('[data-garage]');
  await page.waitForTimeout(700);
  const gar = await page.evaluate(() => !!document.querySelector('[data-up]'));
  ok(gar, 'hill garage opens with upgrades');
  await page.screenshot({ path: OUT + '/deep-hill-garage.png' });
  await page.click('[data-back]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/deep-hill-drive.png' });
  await close();

  // هاکی: ۱۵ ثانیه
  await open('air-hockey');
  const hb = await page.locator('[data-cv]').boundingBox();
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height - 70, { steps: 3 });
    await page.mouse.move(hb.x + hb.width * (0.15 + 0.7 * Math.random()), hb.y + hb.height * (0.55 + 0.35 * Math.random()), { steps: 6 });
    await page.waitForTimeout(500);
  }
  const hp = await page.textContent('[data-p]');
  const ha = await page.textContent('[data-a]');
  console.log(`  (hockey you=${hp} ai=${ha})`);
  await page.screenshot({ path: OUT + '/deep-hockey.png' });
  ok(true, 'hockey 15s rally without errors');
  await close();

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  console.log(`==== ERRORS: ${errs.length} ====`);
  [...new Set(errs)].slice(0, 10).forEach((e) => console.log(e));
  await browser.close();
  process.exit(fails.length || errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
