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
  const st = () => p.evaluate(() => PAPER.state());
  const settle = async () => { for (let i = 0; i < 60; i++) { if ((await st()).springs === 0) return; await wait(50); } };
  async function swipe(x0, y0, x1, y1, ms = 220, steps = 12, hold = 0) {
    await touch('touchStart', x0, y0); if (hold) await wait(hold);
    for (let i = 1; i <= steps; i++) { await touch('touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await wait(ms / steps); }
    await touch('touchEnd');
    await settle(); await wait(80);
  }
  const shot = async (n) => { await wait(120); await p.screenshot({ path: `${out}/${n}.png` }); };
  const expect = (ok, what) => { if (!ok) errors.push('FAILED: ' + what); };
  const near = (a, b) => Math.abs(a - b) < 0.01;
  async function tapEl(sel) { const b = await (await p.$(sel)).boundingBox(); await touch('touchStart', b.x + b.width / 2, b.y + b.height / 2); await wait(40); await touch('touchEnd'); await wait(60); }

  await wait(800); await shot('01-home');
  await swipe(60, 450, 300, 450); expect(near((await st()).hx, -1), 'swipe right → calendar'); await shot('02-calendar');
  await swipe(300, 450, 240, 450, 500, 12); expect(near((await st()).hx, -1), 'short slow drag springs back');
  await swipe(320, 450, 260, 450, 50, 4); expect(near((await st()).hx, 0), 'short flick → home');
  await touch('touchStart', 330, 450); for (let i = 1; i <= 7; i++) { await touch('touchMove', 330 - i * 22, 450); await wait(16); }
  await shot('03-mid-drag'); await touch('touchEnd'); await settle();
  expect(near((await st()).hx, 1), 'drag left → folders');
  await shot('04-library');
  // catch mid-flight: flick back toward home, grab it, it freezes, release settles on a page
  await touch('touchStart', 80, 450); for (let i = 1; i <= 4; i++) { await touch('touchMove', 80 + i * 40, 450); await wait(12); } await touch('touchEnd');
  await wait(70); await touch('touchStart', 200, 600); await wait(120);
  const caught = (await st()).hx; await wait(150); const still = (await st()).hx;
  expect(caught > 0.02 && caught < 0.98 && Math.abs(caught - still) < 0.002, 'touch catches the page mid-flight (' + caught.toFixed(3) + ' → ' + still.toFixed(3) + ')');
  await touch('touchEnd'); await settle();
  const h = (await st()).hx; expect(near(h, Math.round(h)), 'released catch settles on a page (' + h + ')');
  if (!near(h, 1)) await swipe(330, 450, 60, 450);
  if (!near(h, 1) && !near((await st()).hx, 1)) await swipe(330, 450, 60, 450);
  // folder springs out of its tile
  await tapEl('[data-tile="1"]'); await wait(20); await shot('05-folder-opening'); await settle(); await shot('06-folder-open');
  expect((await st()).folder === 1, 'tile opens folder');
  const fv = await (await p.$('#fview .fhead')).boundingBox();
  await swipe(fv.x + 40, fv.y + 10, fv.x + 40, fv.y + 320, 200);
  expect((await st()).folder === -1, 'drag folder down closes it');
  // dots: scrub from the folders end to the calendar end, then tap the middle
  const d = await (await p.$('#dots')).boundingBox();
  await swipe(d.x + d.width - 4, d.y + d.height / 2, d.x + 4, d.y + d.height / 2, 300, 10);
  expect(near((await st()).hx, -1), 'scrub dots → calendar');
  expect(await p.evaluate(() => getComputedStyle(document.getElementById('dots')).opacity) === '0', 'dots hidden on calendar');
  await swipe(320, 450, 120, 450, 160, 8); expect(near((await st()).hx, 0), 'calendar → home');
  await swipe(d.x + d.width - 6, d.y + d.height / 2, d.x + d.width - 5, d.y + d.height / 2, 30, 1);
  expect(near((await st()).hx, 1), 'tap folders dot → folders');
  await swipe(d.x + d.width / 2, d.y + d.height / 2, d.x + d.width / 2 + 1, d.y + d.height / 2, 30, 1);
  expect(near((await st()).hx, 0), 'tap middle dot → home');
  // search: half pull frame, then open
  await touch('touchStart', 180, 300); for (let i = 1; i <= 6; i++) { await touch('touchMove', 180, 300 + i * 26); await wait(16); }
  await shot('07-pulling-search'); await touch('touchEnd'); await settle();
  expect((await st()).over === 'search', 'pull down → search'); await shot('08-search');
  await swipe(180, 640, 180, 380, 140, 8); expect((await st()).over === '' && near((await st()).tS, 0), 'swipe up closes search');
  await swipe(180, 700, 180, 400, 200); expect((await st()).over === 'now', 'swipe up → now'); await shot('09-now');
  const dock = await p.$$eval('#dock .dl', (els) => els.map((e) => e.textContent));
  expect(dock.join(',') === 'Camera,Gallery,Clock,Settings,Contacts', 'dock (got ' + dock + ')');
  await swipe(180, 200, 180, 600, 200); expect((await st()).over === '', 'swipe down closes now');
  // rail
  const rail = await (await p.$('#rail')).boundingBox();
  const ly = (L) => rail.y + (('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(L) + 0.5) * rail.height / 26);
  const rx = rail.x + rail.width / 2;
  await touch('touchStart', rx, ly('P')); await wait(80);
  for (const L of 'QRS') { await touch('touchMove', rx, ly(L)); await wait(60); }
  await wait(250); await shot('10-rail-S'); expect((await st()).rail, 'rail card while scrubbing');
  const first = await (await p.$('#railPop .ra')).boundingBox();
  await touch('touchMove', first.x + 40, first.y + first.height / 2); await wait(60); await touch('touchEnd'); await wait(300);
  const launched = await p.evaluate(() => __launched.slice(-1)[0]);
  expect(/^app\.s/.test(launched || ''), 'release on rail app opens it (' + launched + ')');
  // hold an app: lift + menu
  const ap = await (await p.$('#colPeople .app:nth-child(5)')).boundingBox();
  await touch('touchStart', ap.x + 20, ap.y + 20); await wait(620); await touch('touchEnd'); await wait(500);
  expect((await st()).lift, 'hold lifts the app'); await shot('11-lift');
  await touch('touchStart', 30, 60); await touch('touchEnd'); await wait(250); expect(!(await st()).lift, 'tap outside drops it');
  // hold the clock: settings sheet springs up; drag it down to close
  const ck = await (await p.$('#clock')).boundingBox();
  await touch('touchStart', ck.x + 20, ck.y + 20); await wait(620); await touch('touchEnd'); await settle();
  expect((await st()).sheet, 'hold clock → settings'); await shot('12-settings');
  const gb = await (await p.$('#sheet .grab')).boundingBox();
  await swipe(gb.x + gb.width / 2, gb.y + gb.height / 2, gb.x + gb.width / 2, gb.y + 300, 180);
  expect(!(await st()).sheet, 'drag sheet down closes it');
  // unfolded
  await p.setViewportSize({ width: 884, height: 760 }); await wait(500); await shot('13-unfolded');
  await browser.close();
  console.log(errors.length ? errors.join('\n') : 'all checks passed, no page errors');
  process.exit(errors.length ? 1 : 0);
})();
