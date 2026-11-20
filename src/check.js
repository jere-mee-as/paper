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
  await p.route(/api\.open-meteo\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ current: { weather_code: 95, temperature_2m: 61.3 } }) }));
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

  await wait(800);
  expect((await st()).theme.view === 'grid', 'icon view is the default'); await shot('00-grid-default');
  await p.evaluate(() => PAPER.setTheme({ view: 'list' })); await wait(300);   // the older checks below run on the name lists
  await shot('01-home');
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
  expect(await p.$$eval('#fview .fi .fic', (e) => e.length) >= 2 && !(await p.$('#fview .chip')), 'inside a folder: app icons');
  expect(await p.$$eval('#fview .fi .fil', (e) => e.every((x) => x.textContent.length > 0)), 'icons keep a small name');
  const al = await p.evaluate(() => { const v = document.querySelector('#fview'), n = v.querySelector('.fname').getBoundingClientRect(), i = v.querySelector('.fi .fic').getBoundingClientRect(), g = v.querySelector('.ficons').getBoundingClientRect(), h = v.querySelector('.fhead .mono').getBoundingClientRect(); return [n.left, i.left, g.right, h.right]; });
  expect(Math.abs(al[0] - al[1]) < 4 && Math.abs(al[2] - al[3]) < 2, 'first icon lines up with the folder name, the grid with the count (' + al.map(Math.round) + ')');
  expect(await p.$$eval('#tiles .tapps span', (e) => e.length) > 4 && !(await p.$('#tiles img')), 'outside, the tiles stay names');
  const ic = await (await p.$('#fview .fi')).boundingBox(); await touch('touchStart', ic.x + ic.width / 2, ic.y + 20); await wait(620); await touch('touchEnd'); await wait(450);
  expect((await st()).lift && !!(await p.$('#liftItem.fi img')), 'holding an icon lifts the icon'); await shot('06b-folder-icon-held');
  await touch('touchStart', 30, 80); await touch('touchEnd'); await wait(300);
  expect(!(await p.$('#fview [data-addto]')), 'no Add tile among the icons');
  const fn = await (await p.$('#fview .fname')).boundingBox(); await touch('touchStart', fn.x + 20, fn.y + 14); await wait(620); await touch('touchEnd'); await wait(450);
  const mi = await p.$$eval('#liftMenu .mi span:first-child', (e) => e.map((x) => x.textContent));
  expect((await st()).lift && mi[0] === 'Add apps', 'hold the folder name → Add apps (' + mi + ')'); await shot('06c-folder-title-held');
  await tapEl('#liftMenu [data-lift="a"]'); await settle(); await wait(200);
  expect((await st()).sheet && (await st()).kind === 'picker' && (await st()).folder === -1, 'Add apps opens the picker');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  if ((await st()).folder !== 1) { await tapEl('[data-tile="1"]'); await settle(); }
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
  // the player
  expect(!!(await p.$('#nowlist .mcard .mart img')) && !!(await p.$('#nowlist .mcard .mbg')), 'player shows the artwork');
  expect(/Playing · YT Music/.test(await p.$eval('#nowlist .mcard .mono', (e) => e.textContent)), 'player says where it plays from');
  const tr = await (await p.$('#nowlist .strack')).boundingBox();
  await touch('touchStart', tr.x + tr.width * 0.5, tr.y + 2); await wait(60);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', tr.x + tr.width * (0.5 - i * 0.04), tr.y + 2 + i * 3); await wait(30); }
  await shot('09b-now-seeking'); await touch('touchEnd'); await wait(300);
  const mpos = await p.evaluate(() => JSON.parse(PaperNative.media()).position);
  expect(Math.abs(mpos - 240000 * 0.26) < 4000 && (await st()).over === 'now', 'drag the bar seeks to ~1:02 and Now stays open (' + mpos + ')');
  await tapEl('#nowlist [data-media="toggle"]'); await wait(80);
  expect((await p.$eval('#nowlist [data-media="toggle"]', (e) => e.getAttribute('aria-label'))) === 'Play', 'pause flips at once (' + (await p.$eval('#nowlist [data-media="toggle"]', (e) => e.getAttribute('aria-label'))) + ', playing ' + (await p.evaluate(() => JSON.parse(PaperNative.media()).playing)) + ')');
  await wait(700); expect(/Paused/.test(await p.$eval('#nowlist .mcard .mono', (e) => e.textContent)), 'and the card says Paused');
  await tapEl('#nowlist [data-media="next"]'); await wait(700);
  expect((await p.$eval('#nowlist .mcard .ti', (e) => e.textContent)) === 'Night drive, side A', 'next track');
  await tapEl('#nowlist [data-media="toggle"]'); await wait(800); await shot('09c-now-player');
  // notifications: no buttons; tap opens; swipe right clears; a short drag springs back; vertical still closes Now
  await p.evaluate(() => { window.__opened = []; const f = PaperNative.notifOpen; PaperNative.notifOpen = (id) => { __opened.push(id); return f(id); }; });
  expect(!(await p.$('#nowlist [data-reply], #nowlist [data-clear]')), 'no Reply / Clear buttons');
  const nc = () => p.$$eval('#nowlist .ncard', (e) => e.map((x) => x.dataset.nid));
  const n0 = await nc(); expect(n0.length >= 2, 'messages on Now (' + n0 + ')');
  let nb = await (await p.$('#nowlist .ncard')).boundingBox();
  await touch('touchStart', nb.x + 60, nb.y + nb.height / 2); await wait(60); await touch('touchEnd'); await wait(200);
  expect((await p.evaluate(() => __opened))[0] === n0[0], 'tap opens the message');
  nb = await (await p.$('#nowlist .ncard')).boundingBox();
  await swipe(nb.x + 40, nb.y + nb.height / 2, nb.x + 100, nb.y + nb.height / 2, 400, 8); await wait(400);
  expect((await nc()).length === n0.length && (await p.$eval('#nowlist .ncard', (e) => e.style.transform)) === '', 'short slow drag springs back');
  await touch('touchStart', nb.x + 40, nb.y + nb.height / 2); for (let i = 1; i <= 6; i++) { await touch('touchMove', nb.x + 40 + i * 22, nb.y + nb.height / 2 + 2); await wait(16); }
  await shot('09d-now-swiping-notif'); await touch('touchEnd'); await wait(900);
  const n1 = await nc(); expect(n1.length === n0.length - 1 && !n1.includes(n0[0]) && (await st()).over === 'now', 'swipe right clears it (' + n1 + ')');
  expect((await p.evaluate(() => __opened)).length === 1, 'and does not open it');
  await shot('09e-now-after-clear');
  nb = await (await p.$('#nowlist .ncard')).boundingBox();
  await swipe(nb.x + 80, nb.y + 20, nb.x + 84, nb.y + 360, 220, 10); expect((await st()).over === '', 'pull down starting on a message still closes Now');
  await swipe(180, 700, 180, 400, 200); expect((await st()).over === 'now', 'back to Now');
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
  await swipe(200, 700, 200, 300, 260, 12); await wait(400);
  expect((await p.evaluate(() => document.querySelector('#sbody').scrollTop)) > 100 && (await st()).sheet, 'Fun stuff scrolls');
  await p.evaluate(() => { document.querySelector('#sbody').scrollTop = 0; }); await wait(100);
  await swipe(200, 400, 200, 750, 200, 10); expect(!(await st()).sheet, 'pull down from the top closes the sheet');
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
  // the sheet's content scrolls under the finger; only a pull down from the top moves the sheet
  const sy = () => p.evaluate(() => document.querySelector('#sbody').scrollTop);
  await swipe(200, 700, 200, 300, 260, 12); await wait(400);
  expect((await sy()) > 150 && (await st()).sheet && (await st()).kind === 'themes', 'swipe up inside Themes scrolls it (' + (await sy()) + ')');
  const mid = await sy(); await swipe(200, 350, 200, 600, 260, 12); await wait(400);
  expect((await st()).sheet && (await sy()) < mid, 'swipe down while scrolled scrolls back, sheet stays');
  await p.evaluate(() => { document.querySelector('#sbody').scrollTop = 0; }); await wait(100);
  await swipe(200, 500, 200, 520, 30, 2); expect((await st()).sheet, 'a tiny touch does not close the sheet');
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
  await swipe(180, 700, 180, 400, 200); await shot('22-tablet-now');
  await p.evaluate(() => PAPER.setTheme({ color: 'g-ember', pat: 'none' })); await wait(800); await shot('22b-ember-now'); await p.evaluate(() => PAPER.setTheme({ color: 'lapis', pat: 'wedges' })); await wait(300); await swipe(180, 200, 180, 600, 200);
  await swipe(180, 300, 180, 520, 160, 8); await shot('23-tablet-search'); await swipe(180, 640, 180, 380, 140, 8);
  // every color and every pattern applies cleanly; a sample gets photographed
  const pats = await p.evaluate(() => PAPER.patterns());
  for (const t of th) { await p.evaluate((id) => PAPER.setTheme({ color: id, pat: 'none', auto: false }), t.id); }
  for (const [c, pt, s2] of [['g-ember', 'none', 'soft'], ['g-aurora', 'stars', 'bold'], ['m-green', 'none', 'soft'], ['d-purple', 'dots', 'bold'], ['cobalt', 'memphis', 'bold'], ['sun', 'stripes', 'soft'], ['blueprint', 'blueprint', 'bold'],
    ['sand', 'terrazzo', 'bold'], ['arcade', 'maze', 'bold'], ['g-dune', 'dunes', 'bold'], ['sun-dawn', 'none', 'soft'], ['sun-dusk', 'none', 'soft'], ['sun-night', 'stars', 'bold'], ['hotpink', 'confetti', 'bold'], ['news', 'grid', 'bold'], ['terminal', 'hatch', 'soft'], ['m-red', 'gingham', 'soft'], ['mint', 'ripples', 'bold'], ['void', 'crosses', 'bold']]) {
    await p.evaluate((a) => PAPER.setTheme({ color: a[0], pat: a[1], str: a[2], auto: false }), [c, pt, s2]); await wait(850); await shot('theme-' + c + '-' + pt);
  }
  for (const pt of pats) { await p.evaluate((x) => PAPER.setTheme({ pat: x }), pt); }
  // SHELL themes, one-color-per-page themes, fonts
  expect(th.filter((t) => t.g === 'shell').length === 9 && th.filter((t) => t.g === 'tri').length === 9, 'SHELL and per-page groups');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  for (const id of ['s-ember', 's-ice', 's-void']) { await p.evaluate((x) => PAPER.setTheme({ color: x, pat: 'none', font: 'shell' }), id); await wait(800); await shot('28-' + id + '-home'); }
  await swipe(180, 700, 180, 400, 200); await shot('29-s-void-now'); await swipe(180, 200, 180, 600, 200);
  await p.evaluate(() => PAPER.setTheme({ color: 's-ember', pat: 'scan', str: 'bold', font: 'shell' })); await wait(800); await shot('30-shell-scanlines');
  await p.evaluate(() => PAPER.setTheme({ color: 'tri-fruit', pat: 'none', font: 'paper' })); await wait(800);
  const wallC = () => p.evaluate(() => getComputedStyle(document.getElementById('wall')).backgroundColor);
  const cHome = await wallC(); await shot('31-tri-home');
  await swipe(330, 450, 60, 450); const cFold = await wallC(); await shot('32-tri-folders');
  await swipe(60, 450, 330, 450); await swipe(60, 450, 330, 450); const cCal = await wallC(); await shot('33-tri-calendar');
  expect(cHome !== cFold && cHome !== cCal && cFold !== cCal, 'each page its own color: ' + [cCal, cHome, cFold]);
  expect(cFold === 'rgb(213, 240, 198)' && cCal === 'rgb(255, 214, 194)', 'Fruit: peach calendar, lemon home, lime folders');
  await touch('touchStart', 300, 450); for (let i = 1; i <= 6; i++) { await touch('touchMove', 300 - i * 25, 450); await wait(16); }
  const cMid = await wallC(); await shot('34-tri-mid-swipe'); await touch('touchEnd'); await settle();
  expect(cMid !== cCal && cMid !== cHome, 'blends mid-swipe (' + cMid + ')');
  expect((await p.evaluate(() => PAPER.bars()))[0].replace(/ /g, '') === (await wallC()).replace(/ /g, ''), 'bars follow the page color');
  if (Math.round((await st()).hx) !== 0) await swipe(330, 450, 60, 450);
  const fonts = ['paper', 'shell', 'serif', 'editorial', 'grotesk', 'rounded', 'typewriter', 'terminal', 'system'];
  for (const f of fonts) { await p.evaluate((x) => PAPER.setTheme({ color: 'paper', pat: 'none', font: x }), f); await wait(250); expect((await p.evaluate(() => document.documentElement.dataset.font)) === f, 'font ' + f);
    const cut = await p.evaluate(async () => { await document.fonts.ready; return [...document.querySelectorAll('#cols .app .an')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent); });
    expect(!cut.length, 'font ' + f + ': every Home name fits (' + cut + ')'); }
  await p.evaluate(() => PAPER.setTheme({ color: 'sand', font: 'serif' })); await wait(700); await shot('35-font-serif');
  await p.evaluate(() => PAPER.setTheme({ color: 'news', font: 'editorial' })); await wait(700); await shot('36-font-editorial');
  await p.evaluate(() => PAPER.setTheme({ color: 'terminal', pat: 'scan', font: 'terminal' })); await wait(700); await shot('37-font-terminal');
  await find('them'); await tapEl('#results .row'); await settle(); await p.evaluate(() => document.querySelector('[data-font]').scrollIntoView({ block: 'center' })); await wait(400); await shot('38-themes-fonts');
  await p.evaluate(() => document.querySelector('[data-color="s-ember"]').scrollIntoView({ block: 'center' })); await wait(300); await shot('39-themes-shell-tri');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  await p.evaluate(() => PAPER.setTheme({ color: 'paper', pat: 'none', font: 'paper' })); await wait(300);
  // 0.8.0 — SHELL layout, app icons, folder icons (all off by default)
  expect(!(await p.$('#app.ledger')) && !(await p.$('#cols .hic')) && !(await p.$('#tiles .ficon')), 'Paper defaults: no SHELL layout, no icons');
  const fitAll = async (label) => { const cut = await p.evaluate(async () => { await document.fonts.ready; return [...document.querySelectorAll('#cols .app .an')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent); }); expect(!cut.length, label + ': every Home name fits (' + cut + ')'); };
  await p.evaluate(() => PAPER.setTheme({ color: 's-ember', pat: 'none', layout: 'shell', icons: 'off' })); await p.evaluate(() => PAPER.onNative('resume', null)); await wait(700);
  expect(!!(await p.$('#app.ledger')) && (await p.$eval('#clock', (e) => e.innerHTML)).includes('<br>') && /PAPER \[HOME\]/i.test(await p.$eval('#lhead', (e) => e.innerText)), 'SHELL layout: stacked clock and ledger block');
  expect((await p.evaluate(() => document.documentElement.dataset.font)) === 'shell', 'SHELL layout uses SHELL\'s font');
  await fitAll('SHELL layout'); await shot('40-shell-layout-ember');
  await p.evaluate(() => PAPER.setTheme({ icons: 'tint' })); await p.evaluate(() => PAPER.onNative('resume', null)); await wait(600); await fitAll('SHELL layout + tinted icons'); await shot('41-shell-layout-tinted-icons');
  await p.evaluate(() => PAPER.setTheme({ color: 'paper', layout: 'paper', icons: 'color', font: 'paper' })); await p.evaluate(() => PAPER.onNative('resume', null)); await wait(600);
  expect((await p.$$('#cols .hic img')).length >= 10 && !(await p.$('#app.ledger')), 'app colors: icons beside names, Paper layout back'); await fitAll('Paper + app icons'); await shot('42-paper-app-icons');
  await p.evaluate(() => PAPER.setTheme({ icons: 'tint' })); await p.evaluate(() => PAPER.onNative('resume', null)); await wait(500);
  expect(await p.$eval('#cols .hic img', (e) => getComputedStyle(e).filter.includes('duo')), 'tinted: duotone filter'); await shot('43-paper-tinted-icons');
  await p.evaluate(() => PAPER.setTheme({ color: 'lapis', icons: 'tint' })); await p.evaluate(() => PAPER.onNative('resume', null)); await wait(600); await shot('44-lapis-tinted-icons');
  await p.evaluate(() => PAPER.setTheme({ color: 'paper', icons: 'off', ficons: 'filled' })); await swipe(330, 450, 60, 450); await wait(300);
  expect((await p.$$('#tiles .tname .ficon')).length >= 8, 'filled folder icons on every tile'); await shot('45-folders-filled');
  const ft = await (await p.$('[data-tile="0"]')).boundingBox(); await touch('touchStart', ft.x + 40, ft.y + 40); await wait(620); await touch('touchEnd'); await wait(450);
  expect((await p.$$eval('#liftMenu .mi span:first-child', (e) => e.map((x) => x.textContent))).includes('Icon'), 'hold a folder → Icon');
  await tapEl('#liftMenu [data-lift="i"]'); await settle(); await wait(250);
  expect((await st()).kind === 'ficon', 'opens the icon picker');
  await p.evaluate(() => document.querySelector('[data-fic="Grape"]').scrollIntoView({ block: 'center' })); await wait(150); await tapEl('#sbody [data-fic="Grape"]'); await wait(150); await p.evaluate(() => document.querySelector('[data-fig="plane"]').scrollIntoView({ block: 'center' })); await wait(150); await tapEl('#sbody [data-fig="plane"]'); await wait(200);
  const ic0 = await p.evaluate(() => JSON.parse(localStorage.getItem('paper.v1')).folders[0].icon);
  expect(ic0 && ic0.g === 'plane' && ic0.c === '#8E4EC6', 'picked icon and color are kept (' + JSON.stringify(ic0) + ')');
  await p.evaluate(() => document.querySelector('#sbody').scrollTo(0, 0)); await wait(150); await shot('46-folder-icon-picker');
  await tapEl('#sbody [data-fis="line"]'); await wait(200); await shot('47-folder-icon-picker-line');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle(); await wait(250); await shot('48-folders-line');
  await tapEl('[data-tile="2"]'); await settle(); await wait(300); expect(!!(await p.$('#fview .fname .ficon')), 'open folder shows its icon'); await shot('49-folder-open-line-icon');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  await p.evaluate(() => PAPER.setTheme({ color: 's-void', layout: 'shell', ficons: 'filled', icons: 'color' })); await wait(600); await shot('50-shell-folders');
  expect(!(await p.$$eval('#tiles .tname>span:last-child', (e) => e.filter((x) => x.scrollWidth > x.clientWidth + 1).map((x) => x.textContent))).length, 'SHELL font: folder names fit');
  await swipe(60, 450, 330, 450); await settle(); await shot('51-shell-home-color-icons');
  await p.evaluate(() => PAPER.setTheme({ color: 'paper', layout: 'paper', ficons: 'off', icons: 'off', font: 'paper' })); await p.evaluate(() => PAPER.onNative('resume', null)); await wait(400);
  expect(!(await p.$('#app.ledger')) && !(await p.$('#cols .hic')), 'back to Paper defaults');
  // icon view (0.9.0): H3 home grid, F1 tile previews, F3 big icons in an open folder
  await p.evaluate(() => PAPER.setTheme({ view: 'grid' })); await p.evaluate(() => PAPER.onNative('home', null)); await settle(); await wait(400); await shot('52-grid-home');
  const gh = await p.evaluate(() => { const g = [...document.querySelectorAll('#cols .gi')]; return { n: g.length, named: g.filter((x) => x.querySelector('.fil').offsetWidth > 0).length, tops: g.slice(0, 5).map((x) => Math.round(x.getBoundingClientRect().top)), right: Math.max(...g.map((x) => x.getBoundingClientRect().right)), rail: document.querySelector('#rail').getBoundingClientRect().left, withicons: document.querySelector('#app').classList.contains('withicons') }; });
  expect(gh.n === 14 && gh.named === 0, 'home is 14 bare icons ' + JSON.stringify(gh));
  expect(gh.tops[0] === gh.tops[3] && gh.tops[4] > gh.tops[3], 'four icons per row ' + gh.tops);
  expect(gh.right <= gh.rail + 4, 'icons stay clear of the A–Z rail ' + gh.right + ' / ' + gh.rail);
  const gi = await (await p.$('#colPeople .gi')).boundingBox(); await touch('touchStart', gi.x + 30, gi.y + 30); await wait(620); await touch('touchEnd'); await wait(450);
  const ln = await p.evaluate(() => { const f = document.querySelector('#liftItem .fil'); return f && f.offsetWidth > 0 ? f.textContent : ''; });
  expect(!!ln, 'holding an icon shows its name (' + ln + ')'); await shot('53-grid-hold');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle(); await wait(200);
  const nL = await p.evaluate(() => __launched.length); await tapEl('#colThings .gi'); await wait(200);
  expect((await p.evaluate(() => __launched.length)) === nL + 1, 'tapping an icon opens the app');
  await p.evaluate(() => PAPER.onNative('home', null)); await settle();
  await swipe(330, 450, 60, 450); await wait(300); await shot('54-grid-folders');
  const tg = await p.evaluate(() => ({ tiles: document.querySelectorAll('#tiles .tile.tg').length, cells: [...document.querySelectorAll('#tiles .tmini')].map((m) => m.children.length), cut: [...document.querySelectorAll('#tiles .tgn>span:not(.tc)')].filter((x) => x.scrollWidth > x.clientWidth + 1).map((x) => x.textContent) }));
  expect(tg.tiles >= 8 && tg.cells.every((n) => n === 8) && !tg.cut.length, 'folder tiles preview 8 cells and names fit ' + JSON.stringify(tg));
  await tapEl('[data-tile="1"]'); await settle(); await wait(300); await shot('55-grid-folder-open');
  const cols = await p.evaluate(() => getComputedStyle(document.querySelector('#fview .ficons')).gridTemplateColumns.split(' ').length);
  const big = await p.evaluate(() => document.querySelector('#fview .fi .fic').getBoundingClientRect().width);
  expect(cols === 3 && Math.round(big) === 78, 'open folder: 3 columns of 78 px icons (' + cols + ', ' + big + ')');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  const tb = await (await p.$('[data-tile="0"]')).boundingBox(); await touch('touchStart', tb.x + 40, tb.y + 40); await wait(620); await touch('touchEnd'); await wait(450);
  const tl = await p.evaluate(() => document.querySelector('#liftItem').textContent.trim()); expect(tl.length > 0 && !/\d/.test(tl), 'a held tile lifts as its name (' + tl + ')');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
  // names toggle (0.9.1)
  await p.evaluate(() => PAPER.setTheme({ gnames: true })); await p.evaluate(() => PAPER.onNative('home', null)); await settle(); await wait(300); await shot('58-grid-names');
  const gn = await p.evaluate(() => { const g = [...document.querySelectorAll('#cols .gi')]; return { named: g.filter((x) => x.querySelector('.fil').offsetWidth > 0).length, rail: !!document.querySelector('#rail button'), right: Math.max(...g.map((x) => x.getBoundingClientRect().right)), railL: document.querySelector('#rail').getBoundingClientRect().left, bottom: Math.max(...g.map((x) => x.getBoundingClientRect().bottom)) }; });
  expect(gn.named === 14 && gn.rail && gn.right <= gn.railL + 4 && gn.bottom < 760, 'names under every icon, rail kept, fits ' + JSON.stringify(gn));
  await find('hide nam'); await tapEl('#results .row'); await settle(); await wait(200);
  expect((await st()).theme.gnames === false, 'search "hide names" turns them off');
  await p.evaluate(() => PAPER.setTheme({ gnames: true })); await p.evaluate(() => PAPER.onNative('home', null)); await settle();
  await p.evaluate(() => PAPER.setTheme({ color: 's-ember', layout: 'shell', icons: 'tint', ficons: 'filled' })); await p.evaluate(() => PAPER.onNative('home', null)); await settle(); await wait(500); await shot('56-grid-shell-tint');
  expect((await p.$$('#cols .gi.tint')).length === 14, 'Tinted recolors the grid');
  await swipe(60, 450, 330, 450); await settle(); await shot('57b-grid-shell-names'); await swipe(330, 450, 60, 450); await swipe(330, 450, 60, 450); await wait(300); await shot('57-grid-shell-folders');
  await p.evaluate(() => PAPER.setTheme({ color: 'paper', layout: 'paper', icons: 'off', ficons: 'off', gnames: false })); await p.evaluate(() => PAPER.onNative('home', null)); await settle();
  // weather
  await p.evaluate(() => PAPER.setTheme({ color: 'sun-night', pat: 'none', wx: 'rain' })); await wait(700);
  let wx = await p.evaluate(() => PAPER.weather()); expect(wx.kind === 'rain' && wx.running && wx.drops > 20, 'rain falls ' + JSON.stringify(wx)); await shot('25-weather-rain-night');
  await p.evaluate(() => PAPER.setTheme({ color: 'sun-day', wx: 'storm' })); await wait(3200);
  wx = await p.evaluate(() => PAPER.weather()); expect(wx.kind === 'storm' && wx.running, 'storm'); await shot('26-weather-storm-day');
  await p.evaluate(() => PAPER.openToy('coin')); await wait(200); expect(!(await p.evaluate(() => PAPER.weather())).running, 'rain pauses under a toy');
  await p.evaluate(() => PAPER.closeToy(true)); await wait(200); expect((await p.evaluate(() => PAPER.weather())).running, 'and resumes after');
  await p.evaluate(() => PAPER.setTheme({ wx: 'real' })); await wait(800);
  wx = await p.evaluate(() => PAPER.weather()); expect(wx.kind === 'storm', 'Real: Reston thunderstorm → storm (' + wx.kind + ')');
  await find('them'); await tapEl('#results .row'); await settle(); await wait(300);
  const wl = await p.$eval('#wxLine', (e) => e.textContent); expect(/Thunderstorm, 61°/.test(wl), 'Real shows the conditions: ' + wl); await shot('27-themes-weather');
  expect((await p.evaluate(() => document.querySelector('#sbody').scrollTop)) === 0, 'Themes opens at the top (' + (await p.evaluate(() => document.querySelector('#sbody').scrollTop)) + ')');
  await p.evaluate(() => document.querySelector('#sbody [data-wx="clear"]').scrollIntoView({ block: 'center' })); await wait(150);
  await tapEl('#sbody [data-wx="clear"]'); await wait(200); wx = await p.evaluate(() => PAPER.weather()); expect(!wx.kind && !wx.running, 'Clear stops the rain');
  await p.evaluate(() => PAPER.onNative('back', null)); await settle();
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
