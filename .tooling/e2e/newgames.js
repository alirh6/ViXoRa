// دودتست ۸ بازی جدید: باز شدن، شروع، ورودی، اسکرین‌شات
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const fails = [];
const errs = [];
function ok(c, m) { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails.push(m); }

const IDS = ['subway-run', 'slither', 'geo-dash', 'hill-climb', 'air-hockey', 'angry-sling', 'bomber', 'tank-battle'];

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

  for (const id of IDS) {
    console.log('--- ' + id + ' ---');
    await page.click(`[data-ag-open="${id}"]`);
    await page.waitForTimeout(1100);
    const hasCv = await page.evaluate(() => !!document.querySelector('[data-cv]'));
    const hasGo = await page.evaluate(() => !!document.querySelector('[data-go]'));
    ok(hasCv && hasGo, `${id} mounts with intro`);
    await page.screenshot({ path: `${OUT}/new-${id}-intro.png` });
    if (hasGo) await page.click('[data-go]');
    await page.waitForTimeout(800);
    const cv = page.locator('[data-cv]');
    const box = await cv.boundingBox();
    try {
      if (id === 'subway-run') {
        for (let i = 0; i < 8; i++) {
          await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'][i % 4]);
          await page.waitForTimeout(500);
        }
      } else if (id === 'slither') {
        for (let i = 0; i < 10; i++) {
          await page.mouse.move(box.x + box.width * (0.2 + 0.6 * Math.random()), box.y + box.height * (0.2 + 0.6 * Math.random()), { steps: 6 });
          await page.waitForTimeout(350);
        }
        await page.keyboard.down(' ');
        await page.waitForTimeout(900);
        await page.keyboard.up(' ');
      } else if (id === 'geo-dash') {
        for (let i = 0; i < 6; i++) {
          await page.keyboard.down(' ');
          await page.waitForTimeout(450);
          await page.keyboard.up(' ');
          await page.waitForTimeout(450);
        }
      } else if (id === 'hill-climb') {
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(5000);
        await page.keyboard.up('ArrowRight');
      } else if (id === 'air-hockey') {
        for (let i = 0; i < 8; i++) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height - 60, { steps: 3 });
          await page.mouse.move(box.x + box.width * (0.2 + 0.6 * Math.random()), box.y + box.height * (0.6 + 0.3 * Math.random()), { steps: 5 });
          await page.waitForTimeout(400);
        }
      } else if (id === 'angry-sling') {
        // درگ پرنده از روی منجنیق
        const sx = box.x + box.width * 0.3, sy = box.y + box.height * 0.62;
        await page.mouse.move(sx, sy);
        await page.mouse.down();
        await page.mouse.move(sx - 90, sy + 40, { steps: 8 });
        await page.waitForTimeout(300);
        await page.mouse.up();
        await page.waitForTimeout(3500);
      } else if (id === 'bomber') {
        await page.keyboard.press(' ');
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(900);
        await page.keyboard.up('ArrowRight');
        await page.keyboard.down('ArrowDown');
        await page.waitForTimeout(900);
        await page.keyboard.up('ArrowDown');
        await page.waitForTimeout(1500);
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(800);
      } else if (id === 'tank-battle') {
        await page.keyboard.press(' ');
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(700);
        await page.keyboard.up('ArrowRight');
        await page.keyboard.press(' ');
        await page.keyboard.down('ArrowUp');
        await page.waitForTimeout(700);
        await page.keyboard.up('ArrowUp');
        await page.keyboard.press(' ');
        await page.waitForTimeout(1200);
      }
    } catch (e) { console.log('  (input warn: ' + String(e).slice(0, 100) + ')'); }
    const hud = await page.evaluate(() => document.querySelector('[data-s]')?.textContent ?? 'MISSING');
    console.log(`  (hud score=${hud})`);
    await page.screenshot({ path: `${OUT}/new-${id}-play.png` });
    await page.click('[data-ag-exit]');
    await page.waitForTimeout(600);
  }

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  console.log(`==== ERRORS: ${errs.length} ====`);
  [...new Set(errs)].slice(0, 12).forEach((e) => console.log(e));
  await browser.close();
  process.exit(fails.length || errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
