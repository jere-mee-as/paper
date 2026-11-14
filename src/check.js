// Runs index.html against the strict mock bridge with real touch events (CDP), at phone size and unfolded.
// node src/check.js  → screenshots in /tmp/paper-shots, exits non-zero on any page error or failed expectation.
const { chromium } = require(process.env.PW || 'playwright');
const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const out = '/tmp/paper-shots';
  require('fs').rmSync(out, { recursive: true, force: true });
  require('fs').mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if ((m.type() === 'warning' || m.type() === 'error') && !/ERR_FAILED/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto(file);
  await p.evaluate(() => { window.__launched = []; const f = PaperNative.launch; PaperNative.launch = (k) => { __launched.push(k); return f(k); }; });
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const wait = (ms) => p.waitForTimeout(ms);
  // A swipe: steps over `ms` milliseconds (slow = drag, fast = flick).
  async function swipe(x0, y0, x1, y1, ms = 220, steps = 12, hold = 0) {
    await touch('touchStart', x0, y0); if (hold) await wait(hold);
    for (let i = 1; i <= steps; i++) { await touch('touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await wait(ms / steps); }
    await touch('touchEnd');
    await wait(560);
  }
  const shot = async (n) => { await wait(200); await p.screenshot({ path: `${out}/${n}.png` }); };
  const state = () => p.evaluate(() => ({
    tx: getComputedStyle(document.getElementById('track')).transform,
    search: document.getElementById('search').style.transform, now: document.getElementById('now').style.transform,
    sheet: document.getElementById('sheet').classList.contains('on'), rail: document.getElementById('railPop').classList.contains('on')
  }));
  const expect = (ok, what) => { if (!ok) errors.push('FAILED: ' + what); };
  const pageIndex = async () => { const m = (await state()).tx.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([-\d.]+)/); return m ? Math.round(-parseFloat(m[1]) / 390) : 1; };

  await wait(700); await shot('01-home');
  await swipe(60, 450, 300, 450); expect(await pageIndex() === 0, 'swipe right → calendar'); await shot('02-calendar');
  await swipe(300, 450, 220, 450, 400, 12); expect(await pageIndex() === 0, 'short slow drag springs back');
  await swipe(320, 450, 250, 450, 60, 4); expect(await pageIndex() === 1, 'short flick → home');
  // mid-drag frame
  await touch('touchStart', 330, 450); for (let i = 1; i <= 6; i++) { await touch('touchMove', 330 - i * 25, 450); await wait(16); }
  await shot('03-mid-drag'); await touch('touchEnd'); await wait(560);
  expect(await pageIndex() === 2, 'drag left past a quarter → folders');
  await p.tap('[data-fold="Dating"]'); await wait(500); await shot('04-folder-open');
  await swipe(60, 450, 300, 450); expect(await pageIndex() === 1, 'back to home');
  // search: half pull, then full
  await touch('touchStart', 180, 300); for (let i = 1; i <= 6; i++) { await touch('touchMove', 180, 300 + i * 30); await wait(16); }
  await shot('05-pulling-search'); await touch('touchEnd'); await wait(560);
  expect((await state()).search.includes('0px, 0px') || (await state()).search.includes('(0px, 0px'), 'pull down → search open');
  await shot('06-search');
  await swipe(180, 600, 180, 350, 150, 8); expect(/-\d/.test((await state()).search), 'swipe up closes search');
  // now
  await swipe(180, 700, 180, 380, 200); await shot('07-now');
  expect((await state()).now.includes('0px, 0px'), 'swipe up → now open');
  const dock = await p.$$eval('#dock .dl', (els) => els.map((e) => e.textContent));
  expect(dock.join(',') === 'Camera,Gallery,Clock,Settings,Contacts', 'dock is Camera, Gallery, Clock, Settings, Contacts (got ' + dock + ')');
  await p.tap('[data-dock="gallery"]'); await wait(150);
  await swipe(180, 300, 180, 650, 200); expect(!/\(0px, 0px/.test((await state()).now), 'swipe down closes now');
  // rail scrub: P → S, slide left onto an app, release opens it
  const rail = await p.$('#rail'); const rb = await rail.boundingBox();
  const ly = (L) => rb.y + (('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(L) + 0.5) * rb.height / 26);
  const rx = rb.x + rb.width / 2;
  await touch('touchStart', rx, ly('P')); await wait(80); await shot('08-rail-P');
  for (const L of 'QRS') { await touch('touchMove', rx, ly(L)); await wait(60); }
  await shot('09-rail-S'); expect((await state()).rail, 'rail card shows while scrubbing');
  const first = await p.$('#railPop .ra'); const fb = await first.boundingBox();
  await touch('touchMove', fb.x + 40, fb.y + fb.height / 2); await wait(60);
  await touch('touchEnd'); await wait(300);
  const launched = await p.evaluate(() => __launched.slice(-1)[0]);
  expect(/^app\.s/.test(launched || ''), 'release on a rail app opens it (got ' + launched + ')');
  expect(!(await state()).rail, 'rail card closes after opening');
  expect(!/\(0px, 0px/.test((await state()).search), 'rail never opens search');
  // tap a letter: card stays pinned; tap outside closes
  await touch('touchStart', rx, ly('C')); await touch('touchEnd'); await wait(300);
  expect((await state()).rail, 'tapped letter keeps the card'); await shot('10-rail-pinned');
  await p.tap('#clock'); await wait(300); expect(!(await state()).rail, 'tap outside closes the card');
  // hold Settings in Now → Paper settings
  await swipe(180, 700, 180, 380, 200);
  const sb = await (await p.$('[data-dock="settings"]')).boundingBox();
  await touch('touchStart', sb.x + sb.width / 2, sb.y + 20); await wait(650); await touch('touchEnd'); await wait(500);
  expect((await state()).sheet, 'hold Settings → Paper settings'); await shot('11-settings');
  // drag the sheet down to close
  const gb = await (await p.$('#sheet .grab')).boundingBox();
  await swipe(gb.x + 20, gb.y + 2, gb.x + 20, gb.y + 260, 200);
  expect(!(await state()).sheet, 'drag sheet down closes it');
  await swipe(180, 300, 180, 650, 200);
  // unfolded
  await p.setViewportSize({ width: 884, height: 760 }); await wait(500); await shot('12-unfolded');
  await browser.close();
  console.log(errors.length ? errors.join('\n') : 'all checks passed, no page errors');
  process.exit(errors.length ? 1 : 0);
})();
