  // ------------------------------------------------------------------ fun stuff (hidden folder: search "fun")
  // Each toy is [id, name, group, run(box)]. run() builds its UI inside a fresh box; anything it registers through
  // tOn / tEvery / tLater / tLoop is torn down when the toy closes. Scores live in S.fun.
  let toyOpen = '', toyOffs = [];
  const R = (n) => Math.floor(Math.random() * n), pickOf = (a) => a[R(a.length)];
  const cssv = (k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  const FUN = () => (S.fun = S.fun || {});
  const best = (k, v, lower) => { const f = FUN(); if (f[k] == null || (lower ? v < f[k] : v > f[k])) { f[k] = v; save(); } return f[k]; };
  const tOn = (el, ev, fn) => { el.addEventListener(ev, fn); toyOffs.push(() => el.removeEventListener(ev, fn)); };
  const tEvery = (ms, fn) => { const t = setInterval(fn, ms); toyOffs.push(() => clearInterval(t)); return t; };
  const tLater = (ms, fn) => { const t = setTimeout(fn, ms); toyOffs.push(() => clearTimeout(t)); return t; };
  function tLoop(fn) {
    let id = 0, last = performance.now(), dead = false;
    const f = (t) => { if (dead) return; const dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t; fn(dt, t / 1000); id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f); toyOffs.push(() => { dead = true; cancelAnimationFrame(id); });
  }
  function canvasIn(b) {
    const cv = document.createElement('canvas'); cv.className = 'tcan'; b.appendChild(cv);
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(2, Math.round(r.width * dpr)); cv.height = Math.max(2, Math.round(r.height * dpr));
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    return { cv, ctx, W: r.width, H: r.height };
  }
  const ptIn = (el, e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function swipeOn(el, fn) {
    let s = null;
    tOn(el, 'pointerdown', (e) => { s = [e.clientX, e.clientY]; });
    tOn(el, 'pointerup', (e) => { if (!s) return; const dx = e.clientX - s[0], dy = e.clientY - s[1]; s = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u')); });
  }
  const bar = (b, html) => { const d = document.createElement('div'); d.className = 'trow'; d.innerHTML = html; b.appendChild(d); return d; };
  const sub = (b, text) => { const d = document.createElement('p'); d.className = 'tsub'; d.style.margin = '0'; d.textContent = text; b.appendChild(d); return d; };
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const ORACLE = ['Yes.', 'No.', 'Obviously.', 'Not today.', 'Ask again after coffee.', 'Do it.', 'Sleep on it.', 'Only if it’s fun.', 'Hard no.', 'You already know.', 'Signs point to snacks.', 'Yes, but text first.',
    'Later.', 'Absolutely not.', 'Try it and see.', 'The vibes say yes.', 'Wait a week.', 'Yes. Loudly.', 'Not like that.', 'Ask someone taller.'];
  const FORTUNES = ['A small yes today turns into a big one by spring.', 'The thing you’re avoiding takes eleven minutes.', 'Someone is about to text you something funny.', 'You will find it in the last place, as usual.',
    'Your next good idea arrives in the shower.', 'Drink some water. The rest follows.', 'A stranger’s dog approves of you.', 'The email can wait. The walk can’t.', 'You were right. Don’t gloat.',
    'Tonight’s dinner will be better than planned.', 'Luck favors whoever charges their phone.', 'An old song is about to fix your mood.', 'The calendar is lying. You have time.', 'Say the nice thing out loud.',
    'Something you lost was never that important.', 'Your future self says thanks for doing it now.'];
  const HYPE = ['You’re him.', 'Certified unit.', 'Main character behavior.', 'They’re not ready for you.', 'Built different. Confirmed.', 'Absolute cinema.', 'You cooked. You’re still cooking.', 'Menace (complimentary).',
    'Generational run in progress.', 'Somebody stop this man.', 'The spreadsheet fears you.', 'Aura: unreasonable.', 'Clean hands, cold heart, warm inbox.', 'Undefeated on weekdays.', 'Your calendar respects you.'];
  const EX = [['Sorry,', 'Can’t make it,', 'Running late,', 'I’d love to, but', 'Bad news:', 'Small problem:'],
    ['my cat', 'the group chat', 'a very slow train', 'my neighbor’s parrot', 'a rogue software update', 'my other phone', 'a pigeon', 'the moon', 'my sourdough starter', 'an urgent nap'],
    ['locked me out', 'scheduled something over this', 'needs me right now', 'ate my keys', 'has opinions about it', 'is on fire, slightly', 'declared a holiday', 'won’t stop staring at me', 'called an emergency meeting', 'has my full attention'],
    ['until further notice.', 'so, tomorrow?', 'and I’m choosing peace.', 'again.', 'for legal reasons.', 'and honestly it’s for the best.']];
  const ROCK = ['The rock is unmoved.', 'The rock noticed. Probably.', 'Still a rock.', 'The rock appreciates consistency.', 'A good rock. The best rock.', 'The rock has no notes.', 'The rock will remember this. It won’t.', 'Solid.'];

  const TOYS = [
    // ---- decide
    ['coin', 'Coin flip', 'Decide', (b) => {
      b.innerHTML = '<button class="tpad"><span class="coin">?</span><span class="tsub">Tap to flip</span></button>';
      const c = b.querySelector('.coin'), s = b.querySelector('.tsub'); let h = 0, t = 0, busy = false;
      tOn(b.firstChild, 'click', () => { if (busy) return; busy = true; c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip'); c.textContent = ''; haptic('tick');
        tLater(600, () => { const r = Math.random() < 0.5; if (r) h++; else t++; c.textContent = r ? 'H' : 'T'; s.textContent = (r ? 'Heads' : 'Tails') + ' · ' + h + ' heads, ' + t + ' tails'; busy = false; haptic('tap'); }); });
    }],
    ['dice', 'Dice', 'Decide', (b) => {
      let n = FUN().dice || 2;
      const face = (v) => '<span class="die popin">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => '<i' + (PIPS[v].includes(i) ? ' class="p"' : '') + '></i>').join('') + '</span>';
      const draw = () => { const vs = Array.from({ length: n }, () => 1 + R(6));
        b.innerHTML = '<button class="tpad"><span class="trow">' + vs.map(face).join('') + '</span><span class="tbig">' + vs.reduce((a, c) => a + c, 0) + '</span><span class="tsub">Tap to roll</span></button><div class="trow">' +
          [1, 2, 3, 4].map((k) => '<button class="btn sm' + (k === n ? ' on' : '') + '" data-n="' + k + '">' + k + '</button>').join('') + '</div>'; };
      draw();
      tOn(b, 'click', (e) => { const t = e.target.closest('button'); if (!t) return; if (t.dataset.n) { n = +t.dataset.n; FUN().dice = n; save(); } draw(); haptic('tap'); });
    }],
    ['number', 'Random number', 'Decide', (b) => {
      let top = FUN().top || 100;
      const draw = (v) => { b.innerHTML = '<button class="tpad"><span class="tbig popin">' + (v || '?') + '</span><span class="tsub">1 to ' + top + ' · tap for another</span></button><div class="trow">' +
        [6, 10, 100, 1000].map((k) => '<button class="btn sm' + (k === top ? ' on' : '') + '" data-n="' + k + '">' + k + '</button>').join('') + '</div>'; };
      draw();
      tOn(b, 'click', (e) => { const t = e.target.closest('button'); if (!t) return; if (t.dataset.n) { top = +t.dataset.n; FUN().top = top; save(); draw(); return; } draw(1 + R(top)); haptic('tap'); });
    }],
    ['oracle', 'Oracle', 'Decide', (b) => {
      b.innerHTML = '<button class="tpad"><span class="orb">Ask out loud, then tap.</span><span class="tsub">Yes-or-no questions only</span></button>';
      const o = b.querySelector('.orb');
      tOn(b.firstChild, 'click', () => { o.classList.remove('shake'); void o.offsetWidth; o.classList.add('shake'); o.textContent = '…'; haptic('tick'); tLater(520, () => { o.textContent = pickOf(ORACLE); haptic('tap'); }); });
    }],
    ['fortune', 'Fortune', 'Decide', (b) => {
      const draw = () => { b.innerHTML = '<button class="tpad"><span class="tmid popin">' + esc(pickOf(FORTUNES)) + '</span><span class="tsub">Lucky number ' + (1 + R(99)) + ' · tap for another</span></button>'; };
      draw(); tOn(b, 'click', () => { draw(); haptic('tap'); });
    }],
    ['pick', 'Pick for me', 'Decide', (b) => {
      b.innerHTML = '<span class="tmid" id="pkOut">What are the options?</span><input class="tin" id="pkIn" placeholder="pizza, tacos, sushi" autocomplete="off" spellcheck="false"><div class="trow"><button class="btn solid" id="pkGo">Pick one</button></div>';
      const inp = b.querySelector('#pkIn'), out = b.querySelector('#pkOut'); inp.value = FUN().pick || '';
      tOn(b.querySelector('#pkGo'), 'click', () => { const o = inp.value.split(/[,\n]/).map((x) => x.trim()).filter(Boolean); FUN().pick = inp.value; save(); inp.blur();
        if (o.length < 2) { out.textContent = 'Give me at least two, with commas.'; return; } out.classList.remove('popin'); void out.offsetWidth; out.classList.add('popin'); out.textContent = pickOf(o) + '.'; haptic('tap'); });
    }],
    ['rps', 'Rock paper scissors', 'Decide', (b) => {
      const N3 = ['Rock', 'Paper', 'Scissors']; let w = 0, l = 0;
      b.innerHTML = '<div class="tpad"><span class="tmid" id="rpOut">Best of forever.</span><span class="tsub" id="rpSc">You 0 · Phone 0</span></div><div class="trow">' + N3.map((n, i) => '<button class="btn" data-n="' + i + '">' + n + '</button>').join('') + '</div>';
      tOn(b, 'click', (e) => { const t = e.target.closest('[data-n]'); if (!t) return; const me = +t.dataset.n, it = R(3), d = (me - it + 3) % 3; if (d === 1) w++; if (d === 2) l++;
        b.querySelector('#rpOut').textContent = N3[me] + ' vs ' + N3[it].toLowerCase() + '. ' + (d === 0 ? 'Draw.' : d === 1 ? 'You win.' : 'Phone wins.'); b.querySelector('#rpSc').textContent = 'You ' + w + ' · Phone ' + l; haptic(d === 1 ? 'tap' : 'tick'); });
    }],
    ['excuse', 'Excuse generator', 'Decide', (b) => {
      const draw = () => { b.innerHTML = '<button class="tpad"><span class="tmid popin">' + esc(EX.map(pickOf).join(' ')) + '</span><span class="tsub">Tap for a better one</span></button>'; };
      draw(); tOn(b, 'click', () => { draw(); haptic('tap'); });
    }],
    ['hype', 'Hype man', 'Decide', (b) => {
      const draw = () => { b.innerHTML = '<button class="tpad"><span class="tmid popin" style="font-size:38px;font-weight:200">' + esc(pickOf(HYPE)) + '</span><span class="tsub">Tap for more</span></button>'; };
      draw(); tOn(b, 'click', () => { draw(); haptic('tap'); });
    }],
    // ---- fidget
    ['bubble', 'Bubble wrap', 'Fidget', (b) => {
      const draw = () => { b.innerHTML = '<div class="bwg">' + Array.from({ length: 48 }, () => '<i class="bw"></i>').join('') + '</div><p class="tsub" style="margin:0">Tap or drag across</p>'; };
      draw(); let down = false;
      const pop = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); if (!el || !el.classList.contains('bw') || el.classList.contains('x')) return; el.classList.add('x'); haptic('tick');
        if (!b.querySelector('.bw:not(.x)')) tLater(500, () => { draw(); toast('Fresh sheet'); }); };
      tOn(b, 'pointerdown', (e) => { down = true; pop(e); }); tOn(b, 'pointermove', (e) => { if (down) pop(e); }); tOn(window, 'pointerup', () => { down = false; });
    }],
    ['spinner', 'Fidget spinner', 'Fidget', (b) => {
      const { cv, ctx, W, H } = canvasIn(b), out = sub(b, 'Flick it'); const cx = W / 2, cy = H / 2, rr = Math.min(W, H) * 0.3;
      let a = 0, w = 0, grab = null, top = 0;
      const ang = (e) => { const [x, y] = ptIn(cv, e); return Math.atan2(y - cy, x - cx); };
      tOn(cv, 'pointerdown', (e) => { grab = { a0: ang(e), t: performance.now() }; w = 0; });
      tOn(cv, 'pointermove', (e) => { if (!grab) return; const n = ang(e), t = performance.now(); let d = n - grab.a0; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; a += d; w = d / Math.max(0.008, (t - grab.t) / 1000); grab = { a0: n, t }; });
      tOn(window, 'pointerup', () => { if (grab) { grab = null; w = Math.max(-60, Math.min(60, w)); haptic('tick'); } });
      tLoop((dt) => { if (!grab) { a += w * dt; w *= Math.pow(0.82, dt); if (Math.abs(w) < 0.05) w = 0; }
        const rpm = Math.round(Math.abs(w) * 9.55); top = Math.max(top, rpm); out.textContent = rpm ? rpm + ' rpm · best ' + best('spin', top) : 'Flick it · best ' + (FUN().spin || 0) + ' rpm';
        ctx.clearRect(0, 0, W, H); ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillStyle = cssv('--ink'); ctx.strokeStyle = cssv('--ink'); ctx.lineWidth = rr * 0.36; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { ctx.rotate(2 * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(rr, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(rr, 0, rr * 0.34, 0, 7); ctx.fill(); }
        ctx.fillStyle = cssv('--acc'); for (let i = 0; i < 3; i++) { ctx.rotate(2 * Math.PI / 3); ctx.beginPath(); ctx.arc(rr, 0, rr * 0.17, 0, 7); ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, 0, rr * 0.2, 0, 7); ctx.fill(); ctx.restore(); });
    }],
    ['breathe', 'Breathe', 'Fidget', (b) => {
      b.innerHTML = '<div class="tpad"><div class="breath"></div><span class="tmid" id="brT">In</span><span class="tsub" id="brC">Four in, four hold, four out, four hold</span></div>';
      const o = b.querySelector('.breath'), tx = b.querySelector('#brT'), c = b.querySelector('#brC'); let t = 0, last = -1;
      tLoop((dt) => { t += dt; const ph = Math.floor(t / 4) % 4, f = (t % 4) / 4, e = f * f * (3 - 2 * f), s = ph === 0 ? 0.6 + e * 0.9 : ph === 1 ? 1.5 : ph === 2 ? 1.5 - e * 0.9 : 0.6;
        o.style.transform = 'scale(' + s.toFixed(3) + ')';
        if (ph !== last) { last = ph; tx.textContent = ['In', 'Hold', 'Out', 'Hold'][ph]; if (ph === 0 && t > 1) c.textContent = Math.floor(t / 16) + ' breaths'; haptic('tick'); } });
    }],
    ['metro', 'Metronome', 'Fidget', (b) => {
      let bpm = FUN().bpm || 96, onNow = false, timer = 0, ac = null, beat = 0;
      b.innerHTML = '<div class="tpad"><span class="tbig" id="mtB"></span><span class="tsub">beats per minute</span><div class="g4" style="max-width:220px" id="mtD">' + [0, 1, 2, 3].map(() => '<i class="tc" style="aspect-ratio:auto;height:14px;border-radius:7px"></i>').join('') + '</div></div>' +
        '<div class="trow"><button class="btn" data-n="-5">−5</button><button class="btn solid" id="mtGo">Start</button><button class="btn" data-n="5">+5</button></div>';
      const show = () => { b.querySelector('#mtB').textContent = bpm; };
      const tick = () => { const ds = b.querySelectorAll('#mtD i'); ds.forEach((d, i) => d.classList.toggle('hot', i === beat % 4)); haptic(beat % 4 ? 'tick' : 'tap');
        try { if (ac) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = beat % 4 ? 880 : 1320; g.gain.setValueAtTime(0.25, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.07); } } catch (e) {}
        beat++; };
      const stop = () => { clearInterval(timer); timer = 0; onNow = false; b.querySelector('#mtGo').textContent = 'Start'; };
      const start = () => { stop(); onNow = true; beat = 0; b.querySelector('#mtGo').textContent = 'Stop'; try { const AC = window.AudioContext || window.webkitAudioContext; ac = ac || (AC ? new AC() : null); } catch (e) { ac = null; } tick(); timer = setInterval(tick, 60000 / bpm); };
      show(); toyOffs.push(() => { clearInterval(timer); try { ac && ac.close(); } catch (e) {} });
      tOn(b, 'click', (e) => { const t = e.target.closest('button'); if (!t) return; if (t.dataset.n) { bpm = Math.max(40, Math.min(220, bpm + (+t.dataset.n))); FUN().bpm = bpm; save(); show(); if (onNow) start(); return; } if (onNow) stop(); else start(); });
    }],
    ['lamp', 'Lamp', 'Fidget', (b) => {
      const L = [['Warm', '#FFE2B8'], ['White', '#FFFFFF'], ['Candle', '#FFB25E'], ['Red, for night', '#FF2A1F'], ['Blue', '#9CC8FF'], ['Green', '#A8F5B8']]; let i = FUN().lamp || 0;
      b.innerHTML = '<button class="tpad" style="color:#141312"><span class="tmid"></span><span style="font-size:14px;opacity:.6">Tap to change the light</span></button>';
      const p = b.firstChild, show = () => { p.style.background = L[i][1]; p.querySelector('.tmid').textContent = L[i][0]; };
      show(); tOn(p, 'click', () => { i = (i + 1) % L.length; FUN().lamp = i; save(); show(); haptic('tick'); });
    }],
    ['doodle', 'Doodle', 'Fidget', (b) => {
      const { cv, ctx, W, H } = canvasIn(b); let mirror = false, acc = false, last = null;
      const row = bar(b, '<button class="btn sm" data-n="m">Mirror</button><button class="btn sm" data-n="c">Accent</button><button class="btn sm" data-n="x">Clear</button>');
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3.5;
      const seg = (a, c) => { ctx.strokeStyle = cssv(acc ? '--acc' : '--ink'); const go = (fx, fy) => { ctx.beginPath(); ctx.moveTo(fx(a[0]), fy(a[1])); ctx.lineTo(fx(c[0]), fy(c[1])); ctx.stroke(); };
        const I = (v) => v, X = (v) => W - v, Y = (v) => H - v; go(I, I); if (mirror) { go(X, I); go(I, Y); go(X, Y); } };
      tOn(cv, 'pointerdown', (e) => { last = ptIn(cv, e); seg(last, [last[0] + 0.1, last[1]]); });
      tOn(cv, 'pointermove', (e) => { if (!last) return; const p = ptIn(cv, e); seg(last, p); last = p; });
      tOn(window, 'pointerup', () => { last = null; });
      tOn(row, 'click', (e) => { const t = e.target.closest('button'); if (!t) return; const k = t.dataset.n; if (k === 'm') { mirror = !mirror; t.classList.toggle('on', mirror); } if (k === 'c') { acc = !acc; t.classList.toggle('on', acc); } if (k === 'x') ctx.clearRect(0, 0, W, H); });
    }],
    ['tally', 'Tally counter', 'Fidget', (b) => {
      const draw = () => { b.innerHTML = '<button class="tpad" id="tlP"><span class="tbig">' + (FUN().tally || 0) + '</span><span class="tsub">Tap to count. It’s kept.</span></button><div class="trow"><button class="btn sm" id="tlM">−1</button><button class="btn sm" id="tlR">Reset</button></div>'; };
      draw();
      tOn(b, 'click', (e) => { const t = e.target.closest('button'); if (!t) return; const f = FUN(); f.tally = t.id === 'tlR' ? 0 : Math.max(0, (f.tally || 0) + (t.id === 'tlM' ? -1 : 1)); save(); draw(); haptic('tick'); });
    }],
    // ---- watch
    ['confetti', 'Confetti', 'Watch', (b) => {
      const { cv, ctx, W, H } = canvasIn(b); sub(b, 'Tap anywhere'); let P = [];
      const burst = (x, y) => { const cols = [cssv('--acc'), cssv('--ink'), '#F2B544', '#3B82F6', '#EC4899', '#22C55E']; for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, s = 120 + Math.random() * 420; P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 220, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 14, c: pickOf(cols), w: 5 + Math.random() * 6, l: 2.4 }); } haptic('tap'); };
      tOn(cv, 'pointerdown', (e) => { const [x, y] = ptIn(cv, e); burst(x, y); }); tLater(250, () => burst(W / 2, H * 0.45));
      tLoop((dt) => { ctx.clearRect(0, 0, W, H); P = P.filter((p) => p.l > 0 && p.y < H + 20);
        P.forEach((p) => { p.vy += 900 * dt; p.vx *= Math.pow(0.35, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.l -= dt; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.l); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); ctx.restore(); }); });
    }],
    ['lava', 'Lava lamp', 'Watch', (b) => {
      const { ctx, W, H } = canvasIn(b); const B = Array.from({ length: 8 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, r: 50 + Math.random() * 60, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 30, c: i % 3 }));
      tLoop((dt) => { ctx.clearRect(0, 0, W, H); const cols = [cssv('--acc'), cssv('--ink'), cssv('--acc')];
        B.forEach((o) => { o.x += o.vx * dt; o.y += o.vy * dt; if (o.x < 0 || o.x > W) o.vx *= -1; if (o.y < 0 || o.y > H) o.vy *= -1;
          const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r); g.addColorStop(0, cols[o.c]); g.addColorStop(1, 'rgba(128,128,128,0)'); ctx.globalAlpha = o.c === 1 ? 0.35 : 0.75; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1; });
    }],
    ['party', 'Party light', 'Watch', (b) => {
      b.innerHTML = '<button class="tpad" style="color:#fff"><span class="tbig" style="text-shadow:0 2px 20px rgba(0,0,0,.25)"></span><span style="font-size:14px;opacity:.8">Tap to change speed</span></button>';
      const p = b.firstChild, c = p.querySelector('.tbig'); let hue = R(360), sp = 30;
      tOn(p, 'click', () => { sp = sp === 30 ? 140 : sp === 140 ? 600 : 30; haptic('tick'); });
      tLoop((dt) => { hue = (hue + sp * dt) % 360; p.style.background = 'linear-gradient(160deg,hsl(' + hue + ',85%,52%),hsl(' + ((hue + 70) % 360) + ',85%,45%))'; const d = new Date(); c.textContent = hm(d); });
    }],
    ['rain', 'Code rain', 'Watch', (b) => {
      const { ctx, W, H } = canvasIn(b), fs = 15, cols = Math.floor(W / fs), drops = Array.from({ length: cols }, () => Math.random() * -40), CH = 'アカサタナハマヤラワ0123456789PAPER<>/=+';
      let accT = 0; ctx.font = fs + 'px monospace';
      tLoop((dt) => { accT += dt; if (accT < 0.05) return; accT = 0; ctx.fillStyle = 'rgba(' + cssv('--bgRGB') + ',.16)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = cssv('--acc');
        drops.forEach((y, i) => { ctx.fillText(CH[R(CH.length)], i * fs, y * fs); drops[i] = y * fs > H && Math.random() > 0.96 ? 0 : y + 1; }); });
    }],
    ['warp', 'Warp speed', 'Watch', (b) => {
      const { cv, ctx, W, H } = canvasIn(b); sub(b, 'Hold to go faster'); const st = Array.from({ length: 220 }, () => ({ x: (Math.random() - 0.5) * W, y: (Math.random() - 0.5) * H, z: Math.random() * W })); let sp = 90, hold = false;
      tOn(cv, 'pointerdown', () => { hold = true; haptic('tick'); }); tOn(window, 'pointerup', () => { hold = false; });
      tLoop((dt) => { sp += ((hold ? 900 : 90) - sp) * Math.min(1, dt * 3); ctx.clearRect(0, 0, W, H); ctx.strokeStyle = cssv('--ink'); ctx.lineCap = 'round';
        st.forEach((s) => { const z0 = s.z; s.z -= sp * dt; if (s.z < 1) { s.x = (Math.random() - 0.5) * W; s.y = (Math.random() - 0.5) * H; s.z = W; return; }
          const k = 180 / s.z, k0 = 180 / z0; ctx.globalAlpha = Math.min(1, 1.2 - s.z / W); ctx.lineWidth = Math.min(3, k * 1.2); ctx.beginPath(); ctx.moveTo(W / 2 + s.x * k0, H / 2 + s.y * k0); ctx.lineTo(W / 2 + s.x * k, H / 2 + s.y * k + 0.1); ctx.stroke(); }); ctx.globalAlpha = 1; });
    }],
    ['life', 'Life', 'Watch', (b) => {
      const { cv, ctx, W, H } = canvasIn(b), cs = 11, cw = Math.floor(W / cs), ch = Math.floor(H / cs); let g = new Uint8Array(cw * ch), down = false, accT = 0;
      const row = bar(b, '<button class="btn sm">Reseed</button>'); sub(b, 'Draw on it to add cells');
      const seed = () => { for (let i = 0; i < g.length; i++) g[i] = Math.random() < 0.24 ? 1 : 0; }; seed();
      const put = (e) => { const [x, y] = ptIn(cv, e), cx = Math.floor(x / cs), cy = Math.floor(y / cs); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.random() < 0.7) g[((cy + dy + ch) % ch) * cw + ((cx + dx + cw) % cw)] = 1; };
      tOn(cv, 'pointerdown', (e) => { down = true; put(e); }); tOn(cv, 'pointermove', (e) => { if (down) put(e); }); tOn(window, 'pointerup', () => { down = false; }); tOn(row, 'click', () => { seed(); haptic('tick'); });
      tLoop((dt) => { accT += dt; if (accT > 0.11 && !down) { accT = 0; const n = new Uint8Array(g.length);
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) c += g[((y + dy + ch) % ch) * cw + ((x + dx + cw) % cw)]; const a = g[y * cw + x]; n[y * cw + x] = c === 3 || (a && c === 2) ? 1 : 0; } g = n; }
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = cssv('--ink'); for (let i = 0; i < g.length; i++) if (g[i]) ctx.fillRect((i % cw) * cs + 1, Math.floor(i / cw) * cs + 1, cs - 2, cs - 2); });
    }],
    ['bounce', 'Bouncing logo', 'Watch', (b) => {
      const { ctx, W, H } = canvasIn(b), out = sub(b, 'Waiting for a corner…'); const bw = 104, bh = 44; let x = Math.random() * (W - bw), y = Math.random() * (H - bh), vx = 105, vy = 88, col = 0, corners = FUN().corners || 0;
      const show = () => { out.textContent = corners ? 'Corner hits: ' + corners : 'Waiting for a corner…'; }; show();
      tLoop((dt) => { x += vx * dt; y += vy * dt; let hx2 = false, hy2 = false; if (x <= 0 || x >= W - bw) { vx *= -1; x = Math.max(0, Math.min(W - bw, x)); hx2 = true; } if (y <= 0 || y >= H - bh) { vy *= -1; y = Math.max(0, Math.min(H - bh, y)); hy2 = true; }
        if (hx2 || hy2) col++; if (hx2 && hy2) { corners++; FUN().corners = corners; save(); show(); haptic('tap'); toast('CORNER'); }
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = col % 2 ? cssv('--acc') : cssv('--ink'); ctx.font = '300 34px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top'; ctx.fillText('Paper', x, y + 2); });
    }],
    ['year', 'Year progress', 'Watch', (b) => {
      const draw = () => { const d = new Date(), y = d.getFullYear(), a = new Date(y, 0, 1).getTime(), z = new Date(y + 1, 0, 1).getTime(), f = (d.getTime() - a) / (z - a), day = Math.floor((d.getTime() - a) / 864e5) + 1, tot = Math.round((z - a) / 864e5), df = (d.getHours() * 60 + d.getMinutes()) / 1440;
        b.innerHTML = '<div class="tpad"><span class="tbig">' + (f * 100).toFixed(1) + '%</span><span class="tsub">of ' + y + ' is done · day ' + day + ' of ' + tot + ' · ' + (tot - day) + ' to go</span><div class="pbar"><i style="width:' + (f * 100).toFixed(2) + '%"></i></div>' +
          '<span class="tmid" style="margin-top:22px">' + Math.round(df * 100) + '%</span><span class="tsub">of today</span><div class="pbar"><i style="width:' + (df * 100).toFixed(1) + '%"></i></div></div>'; };
      draw(); tEvery(30000, draw);
    }],
    // ---- play
    ['snake', 'Snake', 'Play', (b) => {
      const { cv, ctx, W, H } = canvasIn(b), out = sub(b, ''), cs = Math.floor(W / 17), cw = Math.floor(W / cs), ch = Math.floor(H / cs); let s, d, nd, food, dead, timer = 0;
      const place = () => { do { food = [R(cw), R(ch)]; } while (s.some((p) => p[0] === food[0] && p[1] === food[1])); };
      const draw = () => { ctx.clearRect(0, 0, W, H); ctx.fillStyle = cssv('--acc'); ctx.beginPath(); ctx.arc(food[0] * cs + cs / 2, food[1] * cs + cs / 2, cs * 0.36, 0, 7); ctx.fill(); ctx.fillStyle = cssv('--ink'); s.forEach((p, i) => { ctx.globalAlpha = dead ? 0.35 : i ? 0.85 : 1; ctx.fillRect(p[0] * cs + 1, p[1] * cs + 1, cs - 2, cs - 2); }); ctx.globalAlpha = 1;
        out.textContent = dead ? 'Ouch. ' + (s.length - 3) + ' · best ' + best('snake', s.length - 3) + ' · tap to go again' : 'Swipe to steer · ' + (s.length - 3) + ' · best ' + (FUN().snake || 0); };
      const step = () => { if (dead) return; d = nd; const h = [s[0][0] + d[0], s[0][1] + d[1]]; if (h[0] < 0 || h[1] < 0 || h[0] >= cw || h[1] >= ch || s.some((p) => p[0] === h[0] && p[1] === h[1])) { dead = true; haptic('tap'); draw(); return; }
        s.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { place(); haptic('tick'); } else s.pop(); draw(); };
      const reset = () => { const cx = Math.floor(cw / 2), cy = Math.floor(ch / 2); s = [[cx, cy], [cx - 1, cy], [cx - 2, cy]]; d = nd = [1, 0]; dead = false; place(); draw(); };
      reset(); timer = tEvery(135, step);
      swipeOn(cv, (k) => { const v = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[k]; if (v[0] !== -d[0] || v[1] !== -d[1]) nd = v; });
      tOn(cv, 'click', () => { if (dead) reset(); });
    }],
    ['g2048', '2048', 'Play', (b) => {
      let g, score, over;
      const add = () => { const e = []; g.forEach((v, i) => { if (!v) e.push(i); }); if (e.length) g[pickOf(e)] = Math.random() < 0.9 ? 2 : 4; };
      const draw = () => { b.innerHTML = '<span class="tsub">' + (over ? 'No moves left · ' : 'Swipe to slide · ') + score + ' · best ' + best('g2048', score) + '</span><div class="g4">' + g.map((v) => '<i class="tc' + (v >= 128 ? ' hot' : v >= 8 ? ' inv' : '') + '" style="font-style:normal;font-size:' + (v > 999 ? 18 : 24) + 'px">' + (v || '') + '</i>').join('') + '</div><div class="trow"><button class="btn sm">New game</button></div>'; };
      const reset = () => { g = new Array(16).fill(0); score = 0; over = false; add(); add(); draw(); };
      const line = (a) => { const v = a.filter(Boolean), o = []; for (let i = 0; i < v.length; i++) { if (v[i] === v[i + 1]) { o.push(v[i] * 2); score += v[i] * 2; i++; } else o.push(v[i]); } while (o.length < 4) o.push(0); return o; };
      const move = (k) => { const before = g.join(), n = g.slice();
        for (let i = 0; i < 4; i++) { const idx = [0, 1, 2, 3].map((j) => (k === 'l' ? i * 4 + j : k === 'r' ? i * 4 + 3 - j : k === 'u' ? j * 4 + i : (3 - j) * 4 + i)), o = line(idx.map((q) => g[q])); idx.forEach((q, j) => { n[q] = o[j]; }); }
        g = n; if (g.join() !== before) { add(); haptic('tick'); }
        over = !g.includes(0) && ![0, 1, 2, 3].some((r) => [0, 1, 2].some((c) => g[r * 4 + c] === g[r * 4 + c + 1] || g[c * 4 + r] === g[(c + 1) * 4 + r])); draw(); };
      reset(); swipeOn(b, move); tOn(b, 'click', (e) => { if (e.target.closest('button')) reset(); });
    }],
    ['ttt', 'Tic-tac-toe', 'Play', (b) => {
      const WIN = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]; let g, done, msg;
      const won = (p) => WIN.find((w) => w.every((i) => g[i] === p));
      const draw = () => { const w = won('X') || won('O') || []; b.innerHTML = '<span class="tsub">' + msg + '</span><div class="g3">' + g.map((v, i) => '<button class="tc' + (w.includes(i) ? ' hot' : '') + '" data-n="' + i + '" style="font-size:44px;font-weight:200">' + v + '</button>').join('') + '</div>'; };
      const reset = () => { g = new Array(9).fill(''); done = false; msg = 'You’re X. Go.'; draw(); };
      const ai = () => { const free = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); const tryP = (p) => free.find((i) => { g[i] = p; const w = won(p); g[i] = ''; return w; }); let m = tryP('O'); if (m === undefined) m = tryP('X'); if (m === undefined) m = free.includes(4) && Math.random() < 0.8 ? 4 : pickOf(free); g[m] = 'O'; };
      reset();
      tOn(b, 'click', (e) => { const t = e.target.closest('[data-n]'); if (!t) return; if (done) { reset(); return; } const i = +t.dataset.n; if (g[i]) return; g[i] = 'X'; haptic('tick');
        if (won('X')) { done = true; msg = 'You win. Tap to play again.'; } else if (!g.includes('')) { done = true; msg = 'Draw. Tap to play again.'; } else { ai(); if (won('O')) { done = true; msg = 'Phone wins. Tap to play again.'; } else if (!g.includes('')) { done = true; msg = 'Draw. Tap to play again.'; } else msg = 'Your move.'; } draw(); });
    }],
    ['memory', 'Memory', 'Play', (b) => {
      const SY = ['▲', '●', '■', '◆', '✚', '★', '☾', '♥']; let deck, open2, found, moves, lock;
      const draw = () => { b.innerHTML = '<span class="tsub">' + (found.size === 16 ? 'Done in ' + moves + ' moves · best ' + best('memory', moves, true) + ' · tap to deal again' : moves + ' moves' + (FUN().memory ? ' · best ' + FUN().memory : '')) + '</span><div class="g4">' +
        deck.map((s, i) => { const up = found.has(i) || open2.includes(i); return '<button class="tc' + (found.has(i) ? ' dim' : up ? ' inv' : '') + '" data-n="' + i + '">' + (up ? s : '') + '</button>'; }).join('') + '</div>'; };
      const reset = () => { deck = SY.concat(SY).map((s) => [Math.random(), s]).sort((a, c) => a[0] - c[0]).map((x) => x[1]); open2 = []; found = new Set(); moves = 0; lock = false; draw(); };
      reset();
      tOn(b, 'click', (e) => { const t = e.target.closest('[data-n]'); if (!t || lock) return; if (found.size === 16) { reset(); return; } const i = +t.dataset.n; if (found.has(i) || open2.includes(i)) return; open2.push(i); haptic('tick'); draw();
        if (open2.length === 2) { moves++; if (deck[open2[0]] === deck[open2[1]]) { found.add(open2[0]); found.add(open2[1]); open2 = []; draw(); haptic('tap'); } else { lock = true; tLater(650, () => { open2 = []; lock = false; draw(); }); } } });
    }],
    ['simon', 'Simon', 'Play', (b) => {
      const HUE = ['#E5484D', '#3B82F6', '#F2B544', '#22C55E']; let seq = [], pos = 0, playing = true;
      b.innerHTML = '<span class="tsub" id="smT">Watch.</span><div class="g3" style="grid-template-columns:1fr 1fr;max-width:300px">' + HUE.map((c, i) => '<button class="tc" data-n="' + i + '" style="background:' + c + ';opacity:.4"></button>').join('') + '</div>';
      const pads = b.querySelectorAll('[data-n]'), tx = b.querySelector('#smT');
      const flash = (i) => { pads[i].style.opacity = '1'; pads[i].style.transform = 'scale(1.04)'; haptic('tick'); tLater(260, () => { pads[i].style.opacity = '.4'; pads[i].style.transform = ''; }); };
      const play = () => { playing = true; tx.textContent = 'Watch. Round ' + seq.length; seq.forEach((v, k) => tLater(500 + k * 520, () => flash(v))); tLater(500 + seq.length * 520, () => { playing = false; pos = 0; tx.textContent = 'Your turn.'; }); };
      const next = () => { seq.push(R(4)); play(); }; tLater(300, next);
      tOn(b, 'click', (e) => { const t = e.target.closest('[data-n]'); if (!t || playing) return; const i = +t.dataset.n; flash(i);
        if (i !== seq[pos]) { tx.textContent = 'Nope. You reached ' + (seq.length - 1) + ' · best ' + best('simon', seq.length - 1) + '. Starting over.'; seq = []; playing = true; tLater(1500, next); return; }
        pos++; if (pos === seq.length) { playing = true; tLater(650, next); } });
    }],
    ['whack', 'Whack-a-dot', 'Play', (b) => {
      let score = 0, left = 20, on2 = -1, live = false;
      b.innerHTML = '<span class="tsub" id="whT">Twenty seconds. Tap a hole to start.</span><div class="g3">' + Array.from({ length: 12 }, (_, i) => '<button class="wh" data-n="' + i + '"></button>').join('') + '</div>';
      const hs = b.querySelectorAll('.wh'), tx = b.querySelector('#whT');
      const pop = () => { if (on2 >= 0) hs[on2].classList.remove('up'); let n; do { n = R(12); } while (n === on2); on2 = n; hs[n].classList.add('up'); };
      const show = () => { tx.textContent = live ? left + 's · ' + score : 'Time. ' + score + ' · best ' + best('whack', score) + ' · tap to go again'; };
      tEvery(1000, () => { if (!live) return; left--; if (left <= 0) { live = false; hs.forEach((x) => x.classList.remove('up')); on2 = -1; haptic('tap'); } show(); });
      tEvery(720, () => { if (live) pop(); });
      tOn(b, 'pointerdown', (e) => { const t = e.target.closest('[data-n]'); if (!t) return; if (!live) { if (left <= 0 || score === 0) { score = 0; left = 20; live = true; pop(); show(); } return; } if (+t.dataset.n === on2) { score++; haptic('tick'); pop(); show(); } });
    }],
    ['react', 'Reaction time', 'Play', (b) => {
      b.innerHTML = '<button class="tpad"><span class="tmid">Tap, then wait for the color.</span><span class="tsub"></span></button>';
      const p = b.firstChild, m = p.querySelector('.tmid'), s = p.querySelector('.tsub'); let state = 0, t0 = 0, timer = 0;
      const idle = (msg) => { state = 0; p.style.background = ''; p.style.color = ''; m.textContent = msg; s.textContent = FUN().react ? 'Best ' + FUN().react + ' ms · tap to try' : 'Tap to try'; };
      idle('Tap, then wait for the color.');
      tOn(p, 'pointerdown', () => {
        if (state === 0) { state = 1; m.textContent = 'Wait…'; s.textContent = ''; timer = tLater(1400 + Math.random() * 2600, () => { state = 2; t0 = performance.now(); p.style.background = cssv('--acc'); p.style.color = cssv('--onAcc'); m.textContent = 'NOW'; haptic('tap'); }); }
        else if (state === 1) { clearTimeout(timer); idle('Too soon.'); }
        else { const ms = Math.round(performance.now() - t0); best('react', ms, true); idle(ms + ' ms'); } });
    }],
    ['taps', 'Tap speed', 'Play', (b) => {
      b.innerHTML = '<button class="tpad"><span class="tbig">0</span><span class="tsub">Five seconds. Starts on your first tap.</span></button>';
      const p = b.firstChild, n = p.querySelector('.tbig'), s = p.querySelector('.tsub'); let c = 0, t0 = 0, state = 0;
      tEvery(100, () => { if (state !== 1) return; const left = 5 - (performance.now() - t0) / 1000; if (left <= 0) { state = 2; s.textContent = (c / 5).toFixed(1) + ' taps a second · best ' + best('taps', c) + ' · wait…'; haptic('tap'); tLater(1500, () => { state = 0; s.textContent = s.textContent.replace('wait…', 'tap to go again'); }); } else s.textContent = left.toFixed(1) + 's'; });
      tOn(p, 'pointerdown', () => { if (state === 2) return; if (state === 0) { state = 1; c = 0; t0 = performance.now(); } c++; n.textContent = c; });
    }],
    ['keepy', 'Keepy-uppy', 'Play', (b) => {
      const { cv, ctx, W, H } = canvasIn(b), out = sub(b, 'Tap the ball. Don’t let it land.'), r = 34; let x = W / 2, y = H / 2, vx = 0, vy = 0, n = 0, live = false;
      tOn(cv, 'pointerdown', (e) => { const [px, py] = ptIn(cv, e); if (Math.hypot(px - x, py - y) > r + 26) return; live = true; vy = -640; vx = (x - px) * 9 + (Math.random() - 0.5) * 60; n++; haptic('tick'); out.textContent = n + ' · best ' + Math.max(n, FUN().keepy || 0); });
      tLoop((dt) => { if (live) { vy += 1500 * dt; x += vx * dt; y += vy * dt; if (x < r) { x = r; vx *= -0.8; } if (x > W - r) { x = W - r; vx *= -0.8; } if (y < r) { y = r; vy *= -0.5; }
        if (y > H - r) { best('keepy', n); out.textContent = 'Dropped at ' + n + ' · best ' + (FUN().keepy || 0) + ' · tap the ball'; n = 0; live = false; x = W / 2; y = H / 2; vx = vy = 0; haptic('tap'); } }
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = cssv('--acc'); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    }],
    // ---- odd
    ['rock', 'Pet rock', 'Odd', (b) => {
      b.innerHTML = '<button class="tpad"><svg width="210" height="160" viewBox="0 0 210 160" aria-hidden="true"><path d="M28 118C14 92 30 54 62 38c30-16 78-14 104 8 24 20 30 54 12 76-14 18-136 22-150-4z" style="fill:var(--ink2)"/><path d="M62 38c30-16 78-14 104 8" fill="none" style="stroke:var(--bg)" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="88" cy="84" r="5" style="fill:var(--bg)"/><circle cx="124" cy="84" r="5" style="fill:var(--bg)"/></svg><span class="tmid" style="font-size:22px"></span><span class="tsub"></span></button>';
      const p = b.firstChild, g = p.querySelector('svg'), m = p.querySelector('.tmid'), s = p.querySelector('.tsub');
      const show = (line) => { m.textContent = line; s.textContent = 'Pats: ' + (FUN().pats || 0); }; show('This is your rock. Pat it.');
      tOn(p, 'click', () => { FUN().pats = (FUN().pats || 0) + 1; save(); g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); haptic('tick'); show(pickOf(ROCK)); });
    }],
    ['grass', 'Touch grass', 'Odd', (b) => {
      const { cv, ctx, W, H } = canvasIn(b), out = sub(b, ''); const N4 = 150, bl = Array.from({ length: N4 }, (_, i) => ({ x: (i + Math.random()) * W / N4, h: H * (0.28 + Math.random() * 0.3), b: 0, p: Math.random() * 6.28, hit: false })); let px = -999, py = 0, n = FUN().grass || 0;
      const show = () => { out.textContent = n ? 'Grass touched: ' + n + ' blades' : 'Go on. Touch it.'; }; show();
      const mv = (e) => { [px, py] = ptIn(cv, e); }; tOn(cv, 'pointerdown', mv); tOn(cv, 'pointermove', mv); tOn(window, 'pointerup', () => { px = -999; bl.forEach((q) => { q.hit = false; }); FUN().grass = n; save(); });
      tLoop((dt, t) => { ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round'; ctx.lineWidth = 3;
        bl.forEach((q, i) => { const dx = q.x - px, near = Math.abs(dx) < 46 && py > H - q.h - 30, tgt = near ? (dx >= 0 ? 1 : -1) * (1 - Math.abs(dx) / 46) * 0.9 : 0; q.b += (tgt - q.b) * Math.min(1, dt * 9);
          if (near && !q.hit) { q.hit = true; n++; if (n % 6 === 0) haptic('tick'); show(); }
          const sway = Math.sin(t * 1.3 + q.p) * 0.07 + q.b, tx = q.x + Math.sin(sway) * q.h, ty = H - Math.cos(sway) * q.h; ctx.strokeStyle = i % 4 === 0 ? cssv('--acc') : cssv('--ink'); ctx.globalAlpha = i % 4 === 0 ? 0.9 : 0.55; ctx.beginPath(); ctx.moveTo(q.x, H); ctx.quadraticCurveTo(q.x + Math.sin(sway) * q.h * 0.3, H - q.h * 0.6, tx, ty); ctx.stroke(); }); ctx.globalAlpha = 1; });
    }]
  ];

  function openToy(id) {
    const t = TOYS.find((x) => x[0] === id); if (!t) return;
    stopToy(); if (sheetOpen) closeSheet();
    const el = $('#toy'), wall = $('#wall'), body = $('#toyBody');
    ['backgroundImage', 'backgroundBlendMode'].forEach((k) => { el.style[k] = wall.style[k]; });
    $('#toyName').textContent = t[1]; body.innerHTML = '<div class="tbox"></div>';
    toyOpen = id; el.classList.add('on'); closeRail(); closeLift();
    try { t[3](body.firstChild); } catch (e) { body.firstChild.innerHTML = '<p class="tsub">This one broke: ' + esc(String(e && e.message || e)) + '</p>'; }
  }
  function stopToy() { toyOffs.forEach((f) => { try { f(); } catch (e) {} }); toyOffs = []; }
  function closeToy(quiet) { if (!toyOpen) return; stopToy(); toyOpen = ''; applyWeather(); $('#toy').classList.remove('on'); $('#toyBody').innerHTML = ''; if (!quiet) openFun(); }
  function openFun() {
    sheetKind = 'fun';
    const groups = ['Decide', 'Fidget', 'Watch', 'Play', 'Odd'];
    openSheet('<h2>Fun stuff</h2><p class="hint" style="margin:0">' + TOYS.length + ' things that do nothing useful.</p>' +
      groups.map((g) => '<div class="grp"><p class="mono">' + g + '</p><div class="ftg">' + TOYS.filter((t) => t[2] === g).map((t) => '<button class="ft" data-toy="' + t[0] + '">' + esc(t[1]) + '</button>').join('') + '</div></div>').join('') +
      '<div class="btnrow"><button class="btn solid" data-toy="?">Surprise me</button></div>');
  }
