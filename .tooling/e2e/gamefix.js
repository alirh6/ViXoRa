// راستی‌آزمایی فیکس‌های حافظه/پک‌من + تست ریسر
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
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
  await page.goto(BASE + '/tools/entertainment', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  // ---- ۱) حافظه: حل خودکار کامل ----
  await page.click('[data-ag-open="memory"]');
  await page.waitForTimeout(900);
  // حل برد متوسط با خواندن کارت‌ها از DOM
  for (let round = 0; round < 14; round++) {
    const done = await page.evaluate(() => !!document.querySelector('[data-over]'));
    if (done) break;
    const pairs = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.mm-card')];
      const seen = {};
      const out = [];
      cards.forEach((c, i) => {
        if (c.classList.contains('done') || c.classList.contains('open')) return;
        const v = c.querySelector('.back').textContent;
        if (seen[v] !== undefined) { out.push([seen[v], i]); delete seen[v]; }
        else seen[v] = i;
      });
      return out.slice(0, 1);
    });
    if (!pairs.length) break;
    await page.click(`.mm-card[data-i="${pairs[0][0]}"]`);
    await page.waitForTimeout(250);
    await page.click(`.mm-card[data-i="${pairs[0][1]}"]`);
    await page.waitForTimeout(450);
  }
  const memWin = await page.evaluate(() => !!document.querySelector('[data-over]'));
  const memFound = await page.textContent('[data-f]');
  ok(memWin, `memory auto-solve wins (found=${memFound})`);
  await page.screenshot({ path: OUT + '/fix-memory-win.png' });
  await page.click('[data-ag-exit]');
  await page.waitForTimeout(500);

  // ---- ۲) پک‌من: پرسه ۴۵ ثانیه‌ای با ورودی تصادفی ----
  await page.click('[data-ag-open="pacman"]');
  await page.waitForTimeout(2500);
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  let lastScore = -1, stuckTicks = 0, maxStuck = 0, over = false;
  for (let i = 0; i < 110; i++) {
    await page.keyboard.press(keys[(Math.random() * 4) | 0]);
    await page.waitForTimeout(400);
    const st = await page.evaluate(() => ({
      s: document.querySelector('[data-s]')?.textContent,
      l: document.querySelector('[data-l]')?.textContent,
      over: !!document.querySelector('[data-over]'),
    }));
    if (st.over) { over = true; break; }
    if (st.s === lastScore) { stuckTicks++; maxStuck = Math.max(maxStuck, stuckTicks); }
    else { stuckTicks = 0; lastScore = st.s; }
  }
  console.log(`  (pacman maxStuckTicks=${maxStuck} over=${over} lastScore=${lastScore})`);
  ok(maxStuck < 30, `pacman keeps eating (max stuck ${maxStuck * 0.4}s)`);
  await page.screenshot({ path: OUT + '/fix-pacman-play.png' });
  // ۳ مپ تازه برای تنوع ژنراتور
  for (let i = 0; i < 3; i++) {
    await page.click('[data-new]');
    await page.waitForTimeout(2200);
    await page.keyboard.press(keys[i % 4]);
    await page.waitForTimeout(1200);
  }
  ok(true, 'pacman 3 fresh mazes without errors');
  await page.click('[data-ag-exit]');
  await page.waitForTimeout(500);

  // ---- ۳) ریسر: رانندگی ۲۰ ثانیه ----
  await page.click('[data-ag-open="neon-racer"]');
  await page.waitForTimeout(4500);
  const t0 = await page.textContent('[data-t]');
  for (let i = 0; i < 20; i++) {
    const k = i % 2 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(k);
    await page.waitForTimeout(500);
    await page.keyboard.up(k);
  }
  const rst = await page.evaluate(() => ({
    s: document.querySelector('[data-s]')?.textContent,
    t: document.querySelector('[data-t]')?.textContent,
    v: document.querySelector('[data-v]')?.textContent,
  }));
  console.log(`  (racer t0=${t0} now=${JSON.stringify(rst)})`);
  ok(rst.s !== '۰' && rst.t !== t0, 'racer drives: score climbs, time ticks');
  await page.screenshot({ path: OUT + '/fix-racer-drive.png' });
  await page.click('[data-ag-exit]');

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  console.log(`==== ERRORS: ${errs.length} ====`);
  [...new Set(errs)].slice(0, 10).forEach((e) => console.log(e));
  await browser.close();
  process.exit(fails.length || errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
