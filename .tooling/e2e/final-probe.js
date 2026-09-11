// پراب نهایی: اسکرامبل هیرو، کارت‌های بازی خانه، تبلت
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const fails = [];
function ok(cond, msg) { console.log((cond ? '  ✅ ' : '  ❌ ') + msg); if (!cond) fails.push(msg); }

(async () => {
  const browser = await chromium.launch();

  // ۱) هیرو + بازی‌های خانه (موبایل)
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('HOME PAGEERROR:', String(e).slice(0, 200)));
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    const hero = await page.textContent('[data-fx-scramble]');
    ok(!/[_\\{\\}\\[\\]<>=!^]/.test(hero || ''), `hero scramble resolves (got: ${(hero || '').slice(0, 40)})`);
    await page.evaluate(() => document.getElementById('hm-games')?.scrollIntoView());
    await page.waitForTimeout(800);
    await page.screenshot({ path: OUT + '/home-games.png' });
    const cards = await page.locator('.hm-game--arcade').count();
    ok(cards === 2, `2 arcade cards on home (got ${cards})`);
    // انتخاب‌کننده
    await page.click('.hm-game--arcade [data-change="0"]');
    await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + '/home-picker.png' });
    const picks = await page.locator('.hm-pick').count();
    ok(picks === 25, `picker lists 25 games (got ${picks})`);
    await page.click('.hm-pick[data-pick="tetris"]');
    await page.waitForTimeout(800);
    const firstCard = await page.textContent('.hm-game--arcade header h3');
    ok(/تتریس|Tetris/.test(firstCard || ''), `card 1 changed to tetris (got ${firstCard})`);
    const saved = await page.evaluate(() => localStorage.getItem('ViXoRa:home-games'));
    ok(saved && saved.includes('tetris'), `pick persisted (${saved})`);
    // اجرای بازی از خانه + خروج
    await page.evaluate(() => document.getElementById('hm-games')?.scrollIntoView());
    await page.waitForTimeout(400);
    await page.click('.hm-game--arcade [data-play="tetris"]');
    await page.waitForTimeout(1200);
    const stage = await page.evaluate(() => !!document.querySelector('.ag-stage'));
    ok(stage, 'game opens fullscreen from home card');
    await page.screenshot({ path: OUT + '/home-game-open.png' });
    await page.click('[data-ag-exit]');
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => ({ stage: !!document.querySelector('.ag-stage'), ov: document.documentElement.style.overflow || '(none)' }));
    ok(!st.stage && st.ov === '(none)', 'home game exit restores');
    await ctx.close();
  }

  // ۲) تبلت ۸۰۰ و ۱۰۲۴
  for (const w of [800, 1024]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="username"]', 'alirh');
    await page.fill('input[name="password"]', 'ali12345');
    await page.click('[data-submit-button]');
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
    for (const t of ['note', 'customerInfo']) {
      await page.goto(BASE + '/tools/' + t, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        window.scrollTo(0, 300);
        const y = window.scrollY;
        window.scrollTo(0, 0);
        const burger = document.getElementById('vcrBurger');
        const bnav = document.getElementById('vcrBottomNav');
        return {
          docSH: de.scrollHeight, scrolled: y, hOver: de.scrollWidth - window.innerWidth,
          burgerVis: burger ? getComputedStyle(burger).display !== 'none' : null,
          bnavVis: bnav ? getComputedStyle(bnav).display !== 'none' : null,
        };
      });
      console.log(`[tablet-${w}/${t}] docSH=${r.docSH} scrolled=${r.scrolled} hOver=${r.hOver} burger=${r.burgerVis} bnav=${r.bnavVis}`);
      ok(r.scrolled > 100, `tablet-${w}/${t} scrolls`);
      ok(r.hOver <= 1, `tablet-${w}/${t} no h-overflow (${r.hOver})`);
    }
    await page.screenshot({ path: `${OUT}/tablet-${w}.png` });
    await ctx.close();
  }

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  await browser.close();
  process.exit(fails.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
