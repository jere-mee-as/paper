// Runs index.html against the strict mock bridge at phone size (touch) and unfolded size.
// node src/check.js  → screenshots in /tmp/paper-shots, exits non-zero on any page error.
const { chromium } = require(process.env.PW || 'playwright');
const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const out = '/tmp/paper-shots';
  require('fs').mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') errors.push(m.type() + ': ' + m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto(file);
  await p.waitForTimeout(300);
  const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: `${out}/${n}.png` }); };
  const drag = async (x0, y0, x1, y1) => {
    await p.mouse.move(x0, y0); await p.mouse.down();
    for (let i = 1; i <= 6; i++) await p.mouse.move(x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6);
    await p.mouse.up();
  };
  await shot('01-home');
  await drag(100, 500, 330, 500); await shot('02-calendar');
  await drag(330, 500, 60, 500); await shot('03-home-back');
  await drag(330, 500, 60, 500); await shot('04-folders');
  await p.click('text=Dating'); await shot('05-folder-dating');
  await drag(60, 500, 330, 500);
  await drag(200, 300, 200, 650); await shot('06-search');
  await p.fill('#q', 'jere'); await shot('07-search-jere');
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await drag(200, 600, 200, 200);
  await drag(200, 700, 200, 250); await shot('08-now');
  await p.click('[data-reply="n1"]'); await shot('09-reply');
  await p.fill('.reply input', 'Yes'); await p.click('.reply button'); await p.waitForTimeout(400);
  await p.click('[data-media="toggle"]');
  await p.click('[data-tog="timer"]'); await shot('10-timer'); await p.click('[data-act="timer"][data-m="5"]');
  await drag(200, 250, 200, 700); await shot('11-home-again');
  // hold the clock → settings
  const c = await p.$('#clock'); const b = await c.boundingBox();
  await p.mouse.move(b.x + 20, b.y + 20); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up();
  await shot('12-settings');
  await p.click('[data-act="check"]'); await p.waitForTimeout(300); await shot('13-settings-checked');
  await p.click('[data-mode="0"]'); await p.waitForTimeout(200);
  await p.click('#scrim', { position: { x: 200, y: 40 } }); await shot('14-plain-home');
  await drag(330, 500, 60, 500); await shot('15-plain-folders');
  await drag(60, 500, 330, 500);
  // back to Jere mode via search
  await drag(200, 300, 200, 650); await p.fill('#q', 'jere mode'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  // hold an app on Home → sheet
  const a = await p.$('#colPeople .app'); const ab = await a.boundingBox();
  await p.mouse.move(ab.x + 20, ab.y + 20); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await shot('16-app-sheet');
  await p.click('#scrim', { position: { x: 200, y: 40 } });
  // rail letter
  await p.click('#rail [data-letter="P"]'); await shot('17-rail-P');
  await drag(200, 600, 200, 200);
  // edit home
  await p.evaluate(() => PAPER.onNative('back'));
  await p.evaluate(() => PAPER.onNative('update', JSON.stringify({ kind: 'app', state: 'available', version: '0.2.0', from: '0.1.0' })));
  // unfolded
  await p.setViewportSize({ width: 884, height: 760 }); await p.waitForTimeout(300); await shot('18-unfolded');
  const nav = await p.evaluate(() => typeof PAPER.bars === 'function' && PAPER.bars().length === 2);
  if (!nav) errors.push('bars() missing');
  await browser.close();
  console.log(errors.length ? errors.join('\n') : 'no page errors');
  process.exit(errors.length ? 1 : 0);
})();
