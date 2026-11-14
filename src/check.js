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

  // ---- 0.4.0: the hidden folders. Found only through search.
  expect(!(await p.evaluate(() => document.body.innerText.toLowerCase())).includes('fun stuff'), 'fun stuff is not on any page');
  const find = async (text) => { await swipe(180, 300, 180, 520, 160, 8); await p.fill('#q', text); await wait(150); };
  await find('fun'); expect((await p.$eval('#results .row .l', (e) => e.textContent)) === 'Fun stuff', 'search "fun" finds Fun stuff'); await shot('14-search-fun');
  await tapEl('#results .row'); await settle(); await wait(200);
  expect((await st()).kind === 'fun', 'opens the Fun stuff folder'); await shot('15-fun-folder');
  const toys = await p.evaluate(() => PAPER.toys());
  expect(toys.length >= 30, 'plenty of toys (' + toys.length + ')');
  const body = { x: 195, y: 470 };
  for (const id of toys) {
    await p.evaluate((t) => PAPER.openToy(t), id); await wait(260);
    expect((await st()).toy === id, 'toy opens: ' + id);
    expect(await p.evaluate(() => document.querySelector('#toyBody .tbox').children.length > 0 && !document.querySelector('#toyBody').innerText.includes('This one broke')), 'toy renders: ' + id);
    for (let k = 0; k < 3; k++) { await touch('touchStart', body.x + k * 14, body.y - k * 20); await wait(40); await touch('touchEnd'); await wait(110); }
    await touch('touchStart', 120, 420); for (let i = 1; i <= 5; i++) { await touch('touchMove', 120 + i * 30, 420 + i * 6); await wait(14); } await touch('touchEnd'); await wait(160);
    for (const sel of ['#toyBody .trow button', '#toyBody [data-n]']) { const el = await p.$(sel); if (el) { const bb = await el.boundingBox(); if (bb) { await touch('touchStart', bb.x + bb.width / 2, bb.y + bb.height / 2); await wait(30); await touch('touchEnd'); await wait(120); } } }
    if (['coin', 'dice', 'oracle', 'bubble', 'spinner', 'doodle', 'confetti', 'lava', 'rain', 'warp', 'life', 'snake', 'g2048', 'memory', 'simon', 'whack', 'keepy', 'rock', 'grass', 'year', 'metro', 'party'].includes(id)) { await wait(500); await shot('toy-' + id); }
    expect(near((await st()).hx, 0) && (await st()).over === '', 'swipes inside a toy do not move the launcher: ' + id);
  }
  await tapEl('#toyX'); await settle(); await wait(150);
  expect((await st()).toy === '' && (await st()).kind === 'fun', 'closing a toy returns to Fun stuff');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  // themes
  await find('themes'); expect((await p.$eval('#results .row .l', (e) => e.textContent)) === 'Themes', 'search "themes" finds Themes');
  await tapEl('#results .row'); await settle(); await wait(200);
  expect((await st()).kind === 'themes', 'opens the Themes folder'); await shot('16-themes-folder');
  const th = await p.evaluate(() => PAPER.themes());
  const weak = th.filter((t) => t.ink < 4.5 || t.ink2 < 4.5);
  expect(!weak.length, 'every theme keeps text readable: ' + JSON.stringify(weak));
  expect(th.length >= 60, 'plenty of themes (' + th.length + ')');
  const tapIn = async (sel) => { await p.evaluate((q) => document.querySelector(q).scrollIntoView({ block: 'center' }), sel); await wait(120); await tapEl(sel); };
  await tapIn('[data-color="lapis"]'); await tapIn('#sbody [data-str="bold"]'); await tapIn('[data-pat="wedges"]'); await wait(900);
  const t1 = (await st()).theme; expect(t1.color === 'lapis' && t1.pat === 'wedges' && t1.str === 'bold', 'tapping swatches sets the theme ' + JSON.stringify(t1));
  await shot('17-themes-patterns');
  expect((await p.evaluate(() => PAPER.bars()))[0] === 'rgb(22,32,122)', 'system bars follow the theme');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle(); await wait(300); await shot('18-tablet-home');
  await swipe(330, 450, 60, 450); await shot('19-tablet-folders'); await tapEl('[data-tile="1"]'); await settle(); await shot('20-tablet-folder-open');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  await swipe(60, 450, 330, 450); await swipe(60, 450, 330, 450); await shot('21-tablet-calendar'); await swipe(330, 450, 60, 450);
  await swipe(180, 700, 180, 400, 200); await shot('22-tablet-now'); await swipe(180, 200, 180, 600, 200);
  await swipe(180, 300, 180, 520, 160, 8); await shot('23-tablet-search'); await swipe(180, 640, 180, 380, 140, 8);
  // every color and every pattern applies cleanly; a sample gets photographed
  const pats = await p.evaluate(() => PAPER.patterns());
  for (const t of th) { await p.evaluate((id) => PAPER.setTheme({ color: id, pat: 'none', auto: false }), t.id); }
  for (const [c, pt, s2] of [['g-ember', 'none', 'soft'], ['g-aurora', 'stars', 'bold'], ['m-green', 'none', 'soft'], ['d-purple', 'dots', 'bold'], ['cobalt', 'memphis', 'bold'], ['sun', 'stripes', 'soft'], ['blueprint', 'blueprint', 'bold'],
    ['sand', 'terrazzo', 'bold'], ['arcade', 'maze', 'bold'], ['g-dune', 'dunes', 'bold'], ['sun-dawn', 'none', 'soft'], ['sun-dusk', 'none', 'soft'], ['sun-night', 'stars', 'bold'], ['hotpink', 'confetti', 'bold'], ['news', 'grid', 'bold'], ['terminal', 'hatch', 'soft'], ['m-red', 'gingham', 'soft'], ['mint', 'ripples', 'bold'], ['void', 'crosses', 'bold']]) {
    await p.evaluate((a) => PAPER.setTheme({ color: a[0], pat: a[1], str: a[2], auto: false }), [c, pt, s2]); await wait(850); await shot('theme-' + c + '-' + pt);
  }
  for (const pt of pats) { await p.evaluate((x) => PAPER.setTheme({ pat: x }), pt); }
  // follow the sun
  await p.evaluate(() => PAPER.setTheme({ auto: true, pat: 'none' })); await wait(300);
  const ph = await p.evaluate(() => PAPER.sunPhase(Date.now())); expect(['dawn', 'day', 'dusk', 'night'].includes(ph), 'sun phase ' + ph);
  const sun = await p.evaluate(() => { const d = new Date(2026, 5, 21), t = PAPER.sunTimes(d); const f = (x) => new Date(x).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }); return [f(t.rise), f(t.set)]; });
  expect(/^05:4[0-9]$/.test(sun[0]) && /^20:3[0-9]$/.test(sun[1]), 'solstice sunrise/sunset in Reston ≈ 05:44 / 20:39 (got ' + sun + ')');
  await find('them'); await tapEl('#results .row'); await settle(); await shot('24-themes-sun-on');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  await find('snake'); expect((await p.$eval('#results .row .l', (e) => e.textContent)) === 'Snake', 'a toy answers by name'); await tapEl('#results .row'); await wait(400); expect((await st()).toy === 'snake', 'and opens');
  await p.evaluate(() => PAPER.onNative('home', null)); await settle(); expect((await st()).toy === '', 'home closes a toy');
  await p.reload(); await wait(700); expect((await st()).theme.auto === true, 'theme survives a reload');
  await p.evaluate(() => PAPER.setTheme({ auto: false, color: 'lapis', pat: 'wedges', str: 'bold' })); await wait(800);
  // unfolded
  await p.setViewportSize({ width: 884, height: 760 }); await wait(500); await shot('13-unfolded');
  await browser.close();
  console.log(errors.length ? errors.join('\n') : 'all checks passed, no page errors');
  process.exit(errors.length ? 1 : 0);
})();
