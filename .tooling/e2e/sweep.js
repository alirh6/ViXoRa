// جاروی کامل: همه ابزارها × موبایل/دسکتاپ + استرس اورلی‌ها + آرکید
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const errors = [];
const fails = [];
function ok(cond, msg) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + msg);
  if (!cond) fails.push(msg);
}

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
}

async function toolProbe(page, tag) {
  return page.evaluate(() => {
    const de = document.documentElement;
    de.scrollTop = 0; document.body.scrollTop = 0; window.scrollTo(0, 0);
    const maxDown = de.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.min(400, maxDown));
    const y = window.scrollY;
    window.scrollTo(0, 0);
    return {
      url: location.pathname,
      docSH: de.scrollHeight, winH: window.innerHeight, scrolled: y,
      canScroll: maxDown > 40 ? y > 40 : 'n/a(short)',
      hOver: de.scrollWidth - window.innerWidth,
      htmlOverflow: de.style.overflow || '(none)',
      mnav: document.querySelector('.vcr-layout')?.classList.contains('vcr-mnav-open'),
      bdVis: (() => { const b = document.getElementById('vcrBackdrop'); return b ? getComputedStyle(b).display !== 'none' : null; })(),
    };
  }).then((r) => { console.log(`[${tag}] url=${r.url} docSH=${r.docSH} scrolled=${r.scrolled} canScroll=${r.canScroll} hOver=${r.hOver} htmlOverflow=${r.htmlOverflow} mnav=${r.mnav} bdVis=${r.bdVis}`); return r; });
}

(async () => {
  const browser = await chromium.launch();
  const TOOLS = ['dashboard', 'note', 'music', 'invoices', 'customerInfo', 'building', 'entertainment'];

  for (const vp of [{ n: 'm', w: 390, h: 844, mob: true }, { n: 'd', w: 1440, h: 900, mob: false }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.mob, hasTouch: vp.mob });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`[${vp.n}] PAGEERROR: ${page.url()} :: ${String(e).slice(0, 160)}`));
    await login(page);
    for (const t of TOOLS) {
      await page.goto(BASE + '/tools/' + t, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const r = await toolProbe(page, `${vp.n}/${t}`);
      ok(r.url === '/tools/' + t, `${vp.n}/${t} navigated`);
      ok(r.canScroll === true || r.canScroll === 'n/a(short)', `${vp.n}/${t} vertical scroll`);
      ok(r.hOver <= 1, `${vp.n}/${t} no h-overflow (got ${r.hOver})`);
      ok(r.htmlOverflow === '(none)', `${vp.n}/${t} no stuck lock`);
      ok(r.mnav === false && r.bdVis === false, `${vp.n}/${t} nav closed`);
      await page.screenshot({ path: `${OUT}/sweep-${vp.n}-${t}-top.png` });
      await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) / 2));
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${OUT}/sweep-${vp.n}-${t}-mid.png` });
    }
    await ctx.close();
  }

  // ---- جریان دراور موبایل: باز → لینک سایدبار → ناوبری + بسته شدن ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await login(page);
    await page.goto(BASE + '/tools/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.click('#vcrBurger');
    await page.waitForTimeout(500);
    const lbl = await page.textContent('#vcrBottomMenu .vcr-bottomnav__lbl');
    ok(lbl === 'بستن', `bottom menu label swaps to بستن (got ${lbl})`);
    // لینک سایدبار باید بالای بک‌دراپ و کلیک‌پذیر باشد
    await page.click('.vcr-sidebar a[href="/tools/music"]');
    await page.waitForTimeout(1000);
    ok(page.url().endsWith('/tools/music'), 'drawer link navigates to music');
    const st = await page.evaluate(() => ({
      mnav: document.querySelector('.vcr-layout').classList.contains('vcr-mnav-open'),
      ov: document.documentElement.style.overflow || '(none)',
    }));
    ok(st.mnav === false && st.ov === '(none)', 'drawer auto-closed + unlocked after nav');
    await page.screenshot({ path: OUT + '/flow-drawer-nav.png' });
    await ctx.close();
  }

  // ---- استرس اورلی‌ها (دسکتاپ) ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    await page.goto(BASE + '/tools/note', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const ov = () => page.evaluate(() => document.documentElement.style.overflow || '(none)');
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+k'); // بستن با دومین
    await page.waitForTimeout(300);
    ok((await ov()) === '(none)', 'cmdk double-toggle unlocks');
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    ok((await ov()) === 'hidden', 'cmdk open locks');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    ok((await ov()) === '(none)', 'Esc closes cmdk + unlocks');
    await page.click('#vcrHelpBtn');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    ok((await ov()) === '(none)', 'help open/esc unlocks');
    await page.click('#vcrCustBtn');
    await page.waitForTimeout(400);
    await page.screenshot({ path: OUT + '/stress-drawer.png' });
    await page.click('#vcrDrawerClose');
    await page.waitForTimeout(300);
    ok((await ov()) === '(none)', 'customize drawer open/close unlocks');
    // پاپ‌اور حین ناوبری
    await page.click('#vcrUserBtn');
    await page.waitForTimeout(300);
    await page.goto(BASE + '/tools/music', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const popHidden = await page.evaluate(() => document.getElementById('vcrUserPop').classList.contains('hidden'));
    ok(popHidden && (await ov()) === '(none)', 'route guard closes popover');
    await ctx.close();
  }

  // ---- آرکید: باز/بسته (دسکتاپ + موبایل) ----
  for (const vp of [{ n: 'd', w: 1440, h: 900, mob: false }, { n: 'm', w: 390, h: 844, mob: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.mob, hasTouch: vp.mob });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`[arc-${vp.n}] PAGEERROR: ${String(e).slice(0, 160)}`));
    await login(page);
    await page.goto(BASE + '/tools/entertainment', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.click('[data-ag-open="subway-run"]');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/arc-${vp.n}-game.png` });
    const open = await page.evaluate(() => !!document.querySelector('.ag-stage'));
    ok(open, `arcade ${vp.n} game stage opens`);
    await page.click('[data-ag-exit]');
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => ({
      stage: !!document.querySelector('.ag-stage'),
      ov: document.documentElement.style.overflow || '(none)',
    }));
    ok(!st.stage && st.ov === '(none)', `arcade ${vp.n} exit restores scroll`);
    await ctx.close();
  }

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  console.log(`==== ERRORS: ${errors.length} ====`);
  [...new Set(errors)].slice(0, 20).forEach((e) => console.log(e));
  await browser.close();
  process.exit(fails.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
