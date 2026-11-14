/* Paper — a calm Android home screen.
   Calendar ← Home → Folders. Swipe down: search. Swipe up: Now. Hold the clock (or search "settings"): settings.
   Native bridge: window.PaperNative (android/…/Native.kt). Native events arrive at PAPER.onNative(type, data). */
(function () {
  'use strict';
  const N = window.PaperNative;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const J = (s, d) => { try { const v = typeof s === 'string' ? JSON.parse(s) : s; return v == null ? d : v; } catch (e) { return d; } };
  const call = (fn, ...a) => { try { return N[fn](...a); } catch (e) { console.warn('PaperNative.' + fn, e); return null; } };
  const PAGE_VERSION = '0.4.0';

  // ------------------------------------------------------------------ saved state
  const KEY = 'paper.v1';
  const PEOPLE = [['Phone', ['Phone']], ['Messages', ['Messages', 'Google Messages', 'Samsung Messages']], ['WhatsApp', ['WhatsApp']],
    ['Discord', ['Discord']], ['Instagram', ['Instagram']], ['Gmail', ['Gmail']], ['Proton Mail', ['Proton Mail', 'ProtonMail']]];
  const THINGS = [['Brave', ['Brave', 'Brave Browser']], ['Claude', ['Claude']], ['Camera', ['Camera']], ['Gallery', ['Gallery', 'Google Photos', 'Photos']],
    ['Maps', ['Maps', 'Google Maps']], ['YouTube', ['YouTube']], ['YT Music', ['YouTube Music', 'YT Music']]];
  const FOLDER_SEED = [
    ['Finance', ['bank', 'chase', 'capital one', 'amex', 'american express', 'wells', 'citi', 'discover', 'venmo', 'cash app', 'paypal', 'zelle', 'wallet', 'robinhood', 'fidelity', 'schwab', 'vanguard', 'coinbase', 'credit karma', 'monarch', 'ynab', 'mint', 'navy federal', 'ally', 'sofi', 'apple card']],
    ['Dating', ['hinge', 'bumble', 'tinder', 'raya', 'feeld', 'okcupid', 'ok cupid', 'grindr', 'her', 'coffee meets bagel', 'the league', 'match']],
    ['Social', ['instagram', 'x', 'twitter', 'threads', 'bluesky', 'reddit', 'tiktok', 'facebook', 'snapchat', 'linkedin', 'discord', 'telegram', 'whatsapp', 'substack', 'are.na', 'mastodon']],
    ['AI', ['claude', 'chatgpt', 'gemini', 'perplexity', 'copilot', 'grok', 'meta ai', 'le chat', 'deepseek']],
    ['Audio', ['spotify', 'youtube music', 'yt music', 'soundcloud', 'podcasts', 'pocket casts', 'audible', 'tidal', 'bandcamp', 'shazam', 'apple music', 'deezer']],
    ['Media', ['youtube', 'netflix', 'hbo', 'max', 'hulu', 'prime video', 'disney', 'twitch', 'plex', 'crunchyroll', 'peacock', 'paramount', 'letterboxd', 'kindle', 'gallery', 'photos']],
    ['Work', ['slack', 'teams', 'outlook', 'drive', 'docs', 'sheets', 'slides', 'notion', 'zoom', 'meet', 'calendar', 'procore', 'dropbox', 'office', 'word', 'excel', 'hubspot', 'adobe', 'acrobat', 'files', 'my files']],
    ['Proton', ['proton']]
  ];
  let S = J(localStorage.getItem(KEY), null);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  if (!S || S.v !== 1) {
    S = { v: 1, jere: true, home: { people: PEOPLE.map(([n, a]) => ({ name: n, alias: a, key: '' })), things: THINGS.map(([n, a]) => ({ name: n, alias: a, key: '' })) },
      folders: null, open: 'Finance', torch: false, dnd: false };
  }

  S.theme = Object.assign({ color: 'paper', pat: 'none', str: 'soft', auto: false }, S.theme || {});

  // ------------------------------------------------------------------ apps
  let APPS = [];
  const byKey = new Map();
  function loadApps() {
    APPS = J(call('apps'), []).filter((a) => a && a.key && a.label).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    byKey.clear();
    APPS.forEach((a) => byKey.set(a.key, a));
    resolveHome();
    if (!S.folders) seedFolders();
    S.folders.forEach((f) => { f.keys = f.keys.filter((k) => byKey.has(k)); });
    save();
  }
  const low = (s) => String(s || '').toLowerCase();
  function findApp(aliases) {
    for (const al of aliases) { const a = APPS.find((x) => low(x.label) === low(al)); if (a) return a; }
    for (const al of aliases) { const a = APPS.find((x) => low(x.label).startsWith(low(al))); if (a) return a; }
    return null;
  }
  function resolveHome() {
    ['people', 'things'].forEach((c) => S.home[c].forEach((h) => {
      if (h.key && byKey.has(h.key)) return;
      const a = findApp(h.alias && h.alias.length ? h.alias : [h.name]);
      h.key = a ? a.key : '';
    }));
  }
  function seedFolders() {
    const taken = new Set();
    S.folders = FOLDER_SEED.map(([name, words]) => {
      const keys = APPS.filter((a) => {
        const l = low(a.label);
        return words.some((w) => w.length <= 3 ? (l === w || l.split(/\s+/)[0] === w) : (l === w || l.startsWith(w + ' ') || l.startsWith(w) || l.includes(' ' + w)));
      }).map((a) => a.key);
      keys.forEach((k) => taken.add(k));
      return { name, keys };
    });
  }
  function open(key, label) {
    if (!key || !byKey.has(key)) { toast((label || 'That app') + ' isn’t installed'); return; }
    S.uses = S.uses || {}; S.uses[key] = (S.uses[key] || 0) + 1; save();
    call('launch', key);
  }

  // ------------------------------------------------------------------ helpers
  let toastT = 0;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1600); }
  const DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hm = (d) => { const h = d.getHours() % 12 || 12; const m = d.getMinutes(); return h + ':' + (m < 10 ? '0' : '') + m; };
  const ampm = (d) => (d.getHours() < 12 ? 'am' : 'pm');
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const haptic = (k) => call('haptic', k || 'tap');
  const ICON = {
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    prev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 5v14M19 5l-10 7 10 7z"/></svg>',
    next: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 5v14M5 5l10 7-10 7z"/></svg>',
    pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="stroke:var(--bg)" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
    play: '<svg width="18" height="18" viewBox="0 0 24 24" style="fill:var(--bg)" aria-hidden="true"><path d="M8 5l12 7-12 7z"/></svg>'
  };

  // ------------------------------------------------------------------ springs
  // A damped spring per animated value. It starts from the finger's speed, can be stopped mid-flight
  // (the value freezes under the finger), and settles at its own pace: a flick snaps, a nudge glides.
  // response = seconds for one oscillation, damping 1 = no overshoot.
  const running = new Map();
  function spring(key, from, to, v0, opt, onFrame, onDone) {
    stopSpring(key);
    const response = (opt && opt.response) || 0.42, damping = (opt && opt.damping) || 0.9, eps = (opt && opt.eps) || 0.001;
    const k = Math.pow(2 * Math.PI / response, 2), c = 4 * Math.PI * damping / response;
    let x = from - to, v = v0 || 0, last = performance.now(), id = 0;
    const s = { value: from, to, cancel() { cancelAnimationFrame(id); running.delete(key); } };
    function step(now) {
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      for (let i = 0; i < 4; i++) { const h = dt / 4; const a = -k * x - c * v; v += a * h; x += v * h; }
      s.value = to + x; s.v = v;
      if (Math.abs(x) < eps && Math.abs(v) < eps * 12) { s.value = to; onFrame(to); running.delete(key); if (onDone) onDone(); return; }
      onFrame(s.value);
      id = requestAnimationFrame(step);
    }
    id = requestAnimationFrame(step);
    running.set(key, s);
    return s;
  }
  function stopSpring(key) { const s = running.get(key); if (s) s.cancel(); return s; }
  const PAGE_SPRING = { response: 0.44, damping: 0.9, eps: 0.0006 };
  const OVER_SPRING = { response: 0.46, damping: 0.88, eps: 0.0006 };
  const SHEET_SPRING = { response: 0.48, damping: 0.8, eps: 0.3 };
  // iOS-style rubber band: the further you pull past the end, the harder it gets.
  const rubber = (x, d) => (1 - 1 / (Math.abs(x) * 0.55 / d + 1)) * d * Math.sign(x);

  // ------------------------------------------------------------------ layout state
  // hx: horizontal position in pages. -1 = Calendar (comes over Home), 0 = Home, 1 = Folders.
  // tS / tN: how far Search / Now are open, 0..1. Home blurs and steps back behind anything on top of it.
  let hx = 0, hxTarget = 0, tS = 0, tN = 0, over = '';
  const W = () => window.innerWidth, H = () => window.innerHeight;
  const wide = () => W() >= 760;
  const stage = $('#stage'), track = $('#track'), calEl = $('#cal'), searchEl = $('#search'), nowEl = $('#now'), veil = $('#veil'), dotsEl = $('#dots');
  function paint() {
    const w = W(), h = H();
    if (wide()) {
      track.style.transform = ''; calEl.style.transform = ''; calEl.style.visibility = 'visible';
    } else {
      const left = Math.min(hx, 0), right = Math.max(hx, 0);
      track.style.transform = 'translate3d(' + (-right * w) + 'px,0,0)';
      calEl.style.transform = 'translate3d(' + ((-1 - left) * w) + 'px,0,0)';
      calEl.style.visibility = left < -0.001 ? 'visible' : 'hidden';
    }
    searchEl.style.transform = 'translate3d(0,' + (-(1 - tS) * h * 0.55) + 'px,0)';
    searchEl.style.opacity = String(Math.min(1, tS * 1.6));
    searchEl.style.visibility = tS > 0.001 ? 'visible' : 'hidden';
    nowEl.style.transform = 'translate3d(0,' + ((1 - tN) * h) + 'px,0)';
    nowEl.style.visibility = tN > 0.001 ? 'visible' : 'hidden';
    const b = Math.max(0, Math.min(1, Math.max(tS, tN, wide() ? 0 : -Math.min(hx, 0))));
    stage.style.transform = b ? 'scale(' + (1 - 0.06 * b) + ')' : '';
    stage.style.filter = b > 0.01 ? 'blur(' + (b * 16).toFixed(1) + 'px)' : '';
    veil.style.opacity = String(0.5 * b);
    // page dots: which page, and fade them away under overlays
    const near = Math.round(Math.max(-1, Math.min(1, hx)));
    dotsEl.querySelectorAll('[data-dot]').forEach((d) => d.classList.toggle('on', +d.dataset.dot === near));
    const hide = Math.max(tS, tN, -Math.min(hx, 0));
    dotsEl.style.opacity = String(Math.max(0, 1 - hide * 2.2) * (wide() ? 0 : 1));
    dotsEl.style.pointerEvents = hide > 0.5 ? 'none' : '';
  }

  function goPage(target, v0) {
    target = Math.max(-1, Math.min(1, target));
    const was = hxTarget;
    hxTarget = target;
    if (target !== was) {
      haptic('tick');
      if (target === -1) { renderCal(); stagger($('#days')); }
      if (target === 1) { renderFolders(); stagger($('#tiles')); }
      if (target === 0 && was !== 0) staggerHome();
    }
    spring('hx', hx, target, v0 || 0, PAGE_SPRING, (v) => { hx = v; paint(); });
  }
  function setOver(o, v0) {
    const prev = over;
    over = o;
    if (o === 'search' && prev !== 'search') { renderResults(); stagger($('#results')); setTimeout(() => { if (over === 'search') $('#q').focus(); }, 160); }
    if (o !== 'search') $('#q').blur();
    if (o === 'now' && prev !== 'now') { renderNow(); stagger($('#nowlist')); }
    spring('tS', tS, o === 'search' ? 1 : 0, o === 'search' || prev === 'search' ? (v0 || 0) : 0, OVER_SPRING, (v) => { tS = v; paint(); });
    spring('tN', tN, o === 'now' ? 1 : 0, o === 'now' || prev === 'now' ? (v0 || 0) : 0, OVER_SPRING, (v) => { tN = v; paint(); });
    closeRail();
  }
  // Legacy names used elsewhere in the page.
  function setPage(p) { goPage(p === 0 ? -1 : p === 2 ? 1 : 0); }
  function goHome() { closeSheet(); closeLift(); closeFolder(true); setOver(''); goPage(0); }

  // Children rise into place one after another.
  function stagger(box, max) {
    if (!box) return;
    [...box.children].slice(0, max || 14).forEach((c, i) => {
      c.style.animation = 'none'; void c.offsetWidth;
      c.style.animation = 'rise 560ms cubic-bezier(.22,1,.36,1) ' + (i * 26) + 'ms both';
    });
  }
  function staggerHome() { stagger($('#colPeople')); stagger($('#colThings')); if (!S.jere) stagger($('#plainList'), 12); }

  // ------------------------------------------------------------------ gestures
  // Touch drives everything (mouse too, for the desktop preview). Touching anything that is moving
  // stops it under the finger. The axis locks after a few pixels; release hands the finger's speed to a spring,
  // and the destination is where that throw would land.
  let G = null, suppressClick = false;
  const SLOP = 7, PROJECT = 0.2;
  function scroller(el) {
    while (el && el !== document.body) { if (el.classList && el.classList.contains('scroll')) return el; el = el.parentElement; }
    return null;
  }
  function canScroll(sc, fingerDown) {
    if (!sc) return false;
    return fingerDown ? sc.scrollTop > 0 : sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1;
  }
  function gStart(x, y, target) {
    if (toyOpen) { G = null; return; }
    if (target.closest('#rail')) { railStart(y, x); G = { rail: true }; return; }
    if (target.closest('#dots')) { G = { dots: true, x, y, moved: false, pts: [[performance.now(), x]] }; stopSpring('hx'); dotsAt(x); return; }
    if (liftOpen) { if (!target.closest('#liftMenu')) { closeLift(); G = { eat: true }; } return; }
    if (sheetOpen) {
      const sb = $('#sbody');
      if (target.closest('#sheet') && (target.closest('.grab') || sb.scrollTop <= 0) && !target.closest('input')) { stopSpring('sheet'); G = { sheet: true, y, y0: sheetY, pts: [[performance.now(), y]] }; }
      return;
    }
    if (folderOpen >= 0) {
      if (!target.closest('#fview')) { closeFolder(); G = { eat: true }; return; }
      const fb = $('#fview .fbody');
      if (fb && fb.scrollTop > 0 && !target.closest('.fhead')) return;
      G = { fold: true, y, pts: [[performance.now(), y]] };
      startHold(target);
      return;
    }
    if (railPinned && !target.closest('#railPop')) { closeRail(); G = { eat: true }; return; }
    // Catch anything in flight.
    const caught = stopSpring('hx') || stopSpring('tS') || stopSpring('tN');
    stopSpring('tS'); stopSpring('tN');
    G = { x, y, target, sc: scroller(target), axis: '', mode: '', hx0: hx, tS0: tS, tN0: tN, caught: !!caught, pts: [[performance.now(), x, y]] };
    startHold(target);
  }
  function gMove(x, y) {
    if (!G) return false;
    if (G.rail) { railMove(y, x); return true; }
    if (G.eat) return true;
    if (G.dots) { G.moved = G.moved || Math.abs(x - G.x) > 6; G.pts.push([performance.now(), x]); dotsAt(x); return true; }
    if (G.sheet) {
      const dy = y - G.y; G.pts.push([performance.now(), y]); if (G.pts.length > 6) G.pts.shift();
      sheetY = Math.max(0, G.y0 + dy) + (G.y0 + dy < 0 ? -rubber(-(G.y0 + dy), 120) : 0); paintSheet();
      return true;
    }
    if (G.fold) {
      const dy = y - G.y; G.pts.push([performance.now(), y]); if (G.pts.length > 6) G.pts.shift();
      if (Math.abs(dy) > SLOP) cancelHold();
      if (dy > 0) { $('#fview').style.transform = 'translate3d(0,' + rubber(dy, 400) + 'px,0)'; return true; }
      return false;
    }
    const dx = x - G.x, dy = y - G.y;
    G.pts.push([performance.now(), x, y]); if (G.pts.length > 6) G.pts.shift();
    if (!G.axis) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return G.caught;
      cancelHold();
      G.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      G.mode = pickMode(dy);
      if (!G.mode) { const c = G.caught; G = null; if (c) settle(); return false; }
      if (G.mode === 'search' && !tS) renderResults();
      if (G.mode === 'now' && !tN) renderNow();
    }
    switch (G.mode) {
      case 'h': {
        let v = G.hx0 - dx / W();
        if (v < -1) v = -1 - rubber(-1 - v, 1); if (v > 1) v = 1 + rubber(v - 1, 1);
        hx = v; break;
      }
      case 'search': tS = Math.max(0, Math.min(1, G.tS0 + dy / (H() * 0.55))); break;
      case 'now': tN = Math.max(0, Math.min(1, G.tN0 - dy / (H() * 0.7))); break;
      case 'shade': return true;
    }
    paint();
    return true;
  }
  function pickMode(dy) {
    const down = dy > 0;
    if (G.axis === 'h') return over || wide() ? '' : 'h';
    if (over === 'search' || G.tS0 > 0.02) return !down && !canScroll(G.sc, false) ? 'search' : '';
    if (over === 'now' || G.tN0 > 0.02) return down && !canScroll(G.sc, true) ? 'now' : '';
    if (Math.abs(hx) > 0.02 && !wide()) return '';
    if (canScroll(G.sc, down)) return '';
    if (down && G.y < 56) return 'shade';
    return down ? 'search' : 'now';
  }
  function vel(pts, i) {   // px per second along coordinate i
    if (pts.length < 2) return 0;
    const a = pts[0], b = pts[pts.length - 1], dt = Math.max(8, b[0] - a[0]) / 1000;
    return (b[i] - a[i]) / dt;
  }
  function gEnd(x, y) {
    cancelHold();
    const s = G; G = null;
    if (!s) return;
    if (s.rail) { railEnd(x, y); suppress(); return; }
    if (s.eat) { suppress(); return; }
    if (s.dots) {
      const v = vel(s.pts, 1) / Math.max(1, dotsEl.offsetWidth / 2.2);
      const target = s.moved ? Math.round(hx + v * 0.12) : Math.round(hx);
      goPage(target, 0); suppress(); return;
    }
    if (s.sheet) {
      const v = vel(s.pts, 1);
      if (sheetY + v * 0.15 > 140) closeSheet(v); else openSheetSpring(v);
      return;
    }
    if (s.fold) {
      const v = vel(s.pts, 1), dy = y - s.y;
      if (dy + v * 0.15 > 160) { closeFolder(false, v); suppress(); }
      else if (dy > SLOP) { $('#fview').style.transition = 'transform .4s cubic-bezier(.22,1,.36,1)'; $('#fview').style.transform = ''; setTimeout(() => { const f = $('#fview'); if (f) f.style.transition = ''; }, 420); suppress(); }
      return;
    }
    if (!s.mode) { if (s.caught) settle(); return; }
    suppress();
    const dy = y - s.y;
    switch (s.mode) {
      case 'h': {
        const v = -vel(s.pts, 1) / W();                       // pages per second
        const proj = hx + v * PROJECT;
        let t = Math.round(proj);
        // A real flick (over ~350 px/s) always moves one page in its direction, however short.
        if (Math.abs(v) > 0.9) t = v > 0 ? Math.ceil(hx - 0.02) : Math.floor(hx + 0.02);
        t = Math.max(Math.round(s.hx0) - 1, Math.min(Math.round(s.hx0) + 1, t));
        goPage(t, v);
        break;
      }
      case 'search': {
        const v = vel(s.pts, 2) / (H() * 0.55);
        setOver(Math.abs(v) > 1.2 ? (v > 0 ? 'search' : '') : tS + v * PROJECT > 0.5 ? 'search' : '', v);
        break;
      }
      case 'now': {
        const v = -vel(s.pts, 2) / (H() * 0.7);
        setOver(Math.abs(v) > 1.2 ? (v > 0 ? 'now' : '') : tN + v * PROJECT > 0.5 ? 'now' : '', v);
        break;
      }
      case 'shade': if (dy > 30) call('shade'); break;
    }
  }
  function settle() { goPage(Math.round(hx)); setOver(over); }
  function suppress() { suppressClick = true; setTimeout(() => { suppressClick = false; }, 320); }

  document.addEventListener('touchstart', (e) => { if (e.touches.length > 1) { G = null; return; } const t = e.touches[0]; gStart(t.clientX, t.clientY, e.target); }, { passive: true });
  document.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (gMove(t.clientX, t.clientY) && e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchend', (e) => { const t = e.changedTouches[0]; gEnd(t.clientX, t.clientY); });
  document.addEventListener('touchcancel', () => { cancelHold(); const s = G; G = null; if (s && (s.mode || s.caught)) settle(); });
  let mouseDown = false;
  document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; mouseDown = true; gStart(e.clientX, e.clientY, e.target); });
  document.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || !mouseDown) return; gMove(e.clientX, e.clientY); });
  document.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') return; mouseDown = false; gEnd(e.clientX, e.clientY); });
  document.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);

  // Page dots: tap one, or drag along them to scrub between pages.
  function dotsAt(x) {
    const r = dotsEl.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (x - r.left) / r.width));
    const v = -1 + f * 2;
    const before = Math.round(hx);
    hx = v; hxTarget = Math.round(v);
    if (Math.round(v) !== before) { haptic('tick'); if (hxTarget === -1) renderCal(); if (hxTarget === 1) renderFolders(); }
    paint();
  }

  // ------------------------------------------------------------------ hold: lift + menu
  let holdT = 0, holdEl = null, liftOpen = false;
  function startHold(target) {
    const el = target.closest && target.closest('[data-hold]');
    if (!el || !el.dataset.hold) return;
    holdEl = el; el.classList.add('pressing');
    holdT = setTimeout(() => {
      holdT = 0; el.classList.remove('pressing');
      G = null; suppress();
      haptic('long');
      onHold(el);
    }, 450);
  }
  function cancelHold() {
    if (holdT) { clearTimeout(holdT); holdT = 0; }
    if (holdEl) { holdEl.classList.remove('pressing'); holdEl = null; }
  }
  // The held thing lifts, everything else blurs, and its menu springs out of it.
  function lift(el, items) {
    const r = el.getBoundingClientRect();
    const box = $('#lift');
    box.innerHTML = '<div id="liftItem"></div><div id="liftMenu" role="menu"></div>';
    const it = $('#liftItem');
    it.textContent = el.textContent.trim();
    it.style.font = getComputedStyle(el).font;
    it.style.letterSpacing = getComputedStyle(el).letterSpacing;
    it.style.left = (r.left - 14) + 'px'; it.style.top = (r.top - 6) + 'px'; it.style.minHeight = (r.height + 12) + 'px';
    const menu = $('#liftMenu');
    menu.innerHTML = items.map((m) => '<button role="menuitem" class="mi' + (m.red ? ' red' : '') + '" data-lift="' + m.id + '"><span>' + esc(m.label) + '</span>' + (m.note ? '<span class="mn">' + esc(m.note) + '</span>' : '') + '</button>').join('');
    const below = r.bottom + 12 + items.length * 50 < H() - 20;
    menu.style.left = Math.max(14, Math.min(W() - 264, r.left - 14)) + 'px';
    if (below) { menu.style.top = (r.bottom + 14) + 'px'; menu.style.transformOrigin = '20% 0'; }
    else { menu.style.top = Math.max(14, r.top - 14 - items.length * 50) + 'px'; menu.style.transformOrigin = '20% 100%'; }
    liftMenuItems = items;
    box.classList.add('on'); document.body.classList.add('held');
    liftOpen = true;
  }
  let liftMenuItems = [];
  function closeLift() {
    if (!liftOpen) return;
    liftOpen = false;
    $('#lift').classList.remove('on'); document.body.classList.remove('held');
  }
  $('#lift').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lift]');
    if (!b) { closeLift(); return; }
    const m = liftMenuItems.find((x) => x.id === b.dataset.lift);
    closeLift();
    if (m) setTimeout(m.run, 120);
  });

  // ------------------------------------------------------------------ A–Z rail
  // Touch the rail and slide: a card beside your finger shows that letter's apps.
  // Slide left onto an app and let go to open it, or let go on the rail and the card stays: tap one.
  let railLetter = '', railPinned = false;
  const railPop = $('#railPop');
  function railLetterAt(y) {
    const r = $('#rail').getBoundingClientRect();
    const i = Math.max(0, Math.min(25, Math.floor((y - r.top) / (r.height / 26))));
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i];
  }
  function railStart(y) { railPinned = false; railShow(railLetterAt(y), y); }
  function railMove(y, x) {
    const r = $('#rail').getBoundingClientRect();
    if (x < r.left - 14) return;
    railShow(railLetterAt(y), y);
  }
  function railShow(L, y) {
    if (L !== railLetter) {
      railLetter = L; haptic('tick');
      document.querySelectorAll('#rail button').forEach((b) => b.classList.toggle('on', b.dataset.letter === L));
      if (!S.jere) {
        const h = document.getElementById('L-' + L);
        if (h) $('#plainList').scrollTo({ top: h.offsetTop - $('#plainList').offsetTop, behavior: 'smooth' });
      }
      const apps = APPS.filter((a) => initial(a.label) === L);
      railPop.innerHTML = '<p class="rl">' + L + '</p>' + (apps.length ? '<div class="rlist scroll">' + apps.map((a) =>
        '<button class="ra" data-open="' + esc(a.key) + '" data-label="' + esc(a.label) + '">' + esc(a.label) + '</button>').join('') + '</div>' : '<p class="rnone">No apps</p>');
    }
    railPop.style.top = Math.max(16, Math.min(H() - 330, y - 50)) + 'px';
    railPop.classList.add('on');
  }
  function railEnd(x, y) {
    const el = document.elementFromPoint(x, y);
    const hit = el && el.closest && el.closest('#railPop [data-open]');
    if (hit) { const k = hit.dataset.open, l = hit.dataset.label; closeRail(); open(k, l); return; }
    if (railPop.querySelector('[data-open]') && S.jere) railPinned = true; else closeRail();
  }
  function closeRail() {
    railPinned = false; railLetter = '';
    railPop.classList.remove('on');
    document.querySelectorAll('#rail button.on').forEach((b) => b.classList.remove('on'));
  }
  // ------------------------------------------------------------------ home
  function renderClock() {
    const d = new Date();
    $('#clock').textContent = hm(d);
    $('#date').textContent = DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()];
  }
  function appBtn(h, where) {
    const ok = h.key && byKey.has(h.key);
    return '<button class="app' + (ok ? '' : ' missing') + '" data-open="' + esc(h.key) + '" data-label="' + esc(h.name) + '" data-hold="' + esc(where) + '" data-key="' + esc(h.key) + '">' + esc(h.name) + '</button>';
  }
  function renderHome() {
    renderClock();
    const jere = S.jere;
    $('#cols').hidden = !jere;
    $('#plainList').hidden = jere;
    if (jere) {
      $('#colPeople').innerHTML = S.home.people.map((h, i) => appBtn(h, 'home:people:' + i)).join('');
      $('#colThings').innerHTML = S.home.things.map((h, i) => appBtn(h, 'home:things:' + i)).join('');
    } else {
      let last = '';
      $('#plainList').innerHTML = APPS.map((a) => {
        const L = initial(a.label);
        const head = L !== last ? '<p class="mono letter" id="L-' + L + '">' + L + '</p>' : '';
        last = L;
        return head + '<button class="app" data-open="' + esc(a.key) + '" data-label="' + esc(a.label) + '" data-hold="app" data-key="' + esc(a.key) + '">' + esc(a.label) + '</button>';
      }).join('');
    }
    const have = new Set(APPS.map((a) => initial(a.label)));
    $('#rail').innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((L) =>
      '<button data-letter="' + L + '" class="' + (have.has(L) ? '' : 'off') + '" aria-label="Apps starting with ' + L + '">' + L + '</button>').join('');
  }
  const initial = (s) => { const c = String(s).trim().charAt(0).toUpperCase(); return c >= 'A' && c <= 'Z' ? c : '#'; };

  // ------------------------------------------------------------------ calendar (Today view)
  let EVENTS = [];
  let calAllowed = true;
  function loadEvents() {
    const p = J(call('perms'), {});
    calAllowed = !!p.calendar;
    EVENTS = calAllowed ? J(call('events', 8), []) : [];
  }
  function renderCal() {
    const box = $('#days');
    $('#calCount').textContent = calAllowed ? (EVENTS.length === 1 ? '1 event' : EVENTS.length + ' events') : '';
    if (!calAllowed) {
      box.innerHTML = '<section class="glass card ask"><span>Paper reads your Google Calendar from the phone. Allow calendar access once.</span><button class="btn solid" id="allowCal">Allow calendar</button></section>';
      return;
    }
    const today = dayStart(new Date());
    const out = [], free = [];
    for (let i = 0; i < 7; i++) {
      const d0 = today + i * 864e5, d1 = d0 + 864e5;
      const d = new Date(d0);
      const evs = EVENTS.filter((e) => e.start < d1 && e.end > d0 && (!e.allDay || e.start >= d0 || i === 0));
      const name = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DN[d.getDay()];
      if (!evs.length && i > 0) { free.push(DN[d.getDay()] + ' ' + d.getDate()); continue; }
      if (!evs.length) { out.push('<section class="glass card row1"><span class="mono">' + name + ' · ' + d.getDate() + '</span><span class="sub">Free all day</span></section>'); continue; }
      out.push('<section class="glass card"><span class="mono">' + name + ' · ' + d.getDate() + '</span>' + evs.map((e) => {
        const s = new Date(e.start);
        const t = e.allDay ? 'All day' : (e.start < d0 ? '…' : hm(s));
        return '<button class="ev" data-ev="' + esc(e.id) + '"><span class="t">' + t + '</span><span class="n"><span class="nt">' + esc(e.title || '(No title)') + '</span>' + (e.loc ? '<span class="nl">' + esc(e.loc) + '</span>' : '') + '</span>' +
          (e.color ? '<span class="dot" style="background:' + esc(e.color) + '"></span>' : '') + '</button>';
      }).join('') + '</section>');
    }
    if (free.length) out.push('<p class="freeline">' + esc(free.length === 1 ? free[0] + ' is free.' : free.slice(0, -1).join(', ') + ' and ' + free[free.length - 1] + ' are free.') + '</p>');
    box.innerHTML = out.join('');
  }
  function nextEvent() {
    const now = Date.now();
    return EVENTS.filter((e) => !e.allDay && e.end > now).sort((a, b) => a.start - b.start)[0] || null;
  }

  // ------------------------------------------------------------------ folders (App Library)
  function folderList() {
    if (S.jere) return S.folders;
    const CAT = { audio: 'Audio', video: 'Video', image: 'Photos', social: 'Social', productivity: 'Productivity', game: 'Games', news: 'News', maps: 'Maps', other: 'Other' };
    const m = new Map();
    APPS.forEach((a) => { const c = CAT[a.cat] || 'Other'; if (!m.has(c)) m.set(c, []); m.get(c).push(a.key); });
    return [...m.entries()].sort((a, b) => (a[0] === 'Other') - (b[0] === 'Other') || a[0].localeCompare(b[0])).map(([name, keys]) => ({ name, keys, auto: true }));
  }
  let fq = '';
  function renderFolders() {
    const box = $('#tiles');
    const list = folderList();
    if (fq) {
      const ql = low(fq);
      const hits = APPS.filter((a) => low(a.label).split(/[\s.\-]+/).some((x) => x.startsWith(ql)) || low(a.label).startsWith(ql));
      const fh = list.map((f, i) => [f, i]).filter(([f]) => low(f.name).startsWith(ql));
      box.className = 'flist scroll';
      box.innerHTML = fh.map(([f, i]) => '<button class="row" data-tile="' + i + '"><span class="l">' + esc(f.name) + '</span><span class="r mono">Folder</span></button>').join('') +
        hits.map((a) => '<button class="row" data-open="' + esc(a.key) + '" data-label="' + esc(a.label) + '"><span class="l">' + esc(a.label) + '</span><span class="r mono">' + esc(whereIs(a.key)) + '</span></button>').join('') ||
        '<p class="hint">Nothing matches.</p>';
      return;
    }
    box.className = 'tiles scroll';
    box.innerHTML = list.map((f, i) => {
      const apps = f.keys.map((k) => byKey.get(k)).filter(Boolean);
      const more = apps.length - 3;
      return '<button class="tile" data-tile="' + i + '" data-hold="' + (f.auto ? '' : 'folder:' + i) + '">' +
        '<span class="tapps">' + (apps.length ? apps.slice(0, 3).map((a) => '<span>' + esc(shortName(a.label)) + '</span>').join('') : '<span class="tempty">Empty</span>') +
        (more > 0 ? '<span class="mono">+' + more + ' more</span>' : '') + '</span>' +
        '<span class="tname">' + esc(f.name) + '</span></button>';
    }).join('');
  }

  // A folder opens out of its tile: the card springs from the tile's rectangle to the middle of the screen.
  let folderOpen = -1;
  function openFolder(i) {
    const list = folderList();
    const f = list[i]; if (!f) return;
    const tile = document.querySelector('[data-tile="' + i + '"]');
    const apps = f.keys.map((k) => byKey.get(k)).filter(Boolean);
    const v = $('#fview');
    v.innerHTML = '<div class="fhead"><span class="fname">' + esc(f.name) + '</span><span class="mono">' + apps.length + (apps.length === 1 ? ' app' : ' apps') + '</span></div>' +
      '<div class="fbody scroll"><div class="chips">' + apps.map((a) => '<button class="chip" data-open="' + esc(a.key) + '" data-label="' + esc(a.label) + '" data-hold="infolder:' + i + '" data-key="' + esc(a.key) + '">' + esc(a.label) + '</button>').join('') +
      (f.auto ? '' : '<button class="chip ghost" data-addto="' + i + '">' + (apps.length ? '+ Add' : '+ Add apps') + '</button>') + '</div></div>';
    folderOpen = i;
    $('#fwrap').classList.add('on');
    v.style.transform = '';
    const end = v.getBoundingClientRect();
    const r = tile ? tile.getBoundingClientRect() : end;
    const sx = r.width / end.width, sy = r.height / end.height, dx = r.left - end.left, dy = r.top - end.top;
    spring('fold', 0, 1, 0, { response: 0.46, damping: 0.82, eps: 0.0008 }, (p) => {
      const q = Math.max(0, p);
      v.style.transform = 'translate3d(' + dx * (1 - p) + 'px,' + dy * (1 - p) + 'px,0) scale(' + (sx + (1 - sx) * p) + ',' + (sy + (1 - sy) * p) + ')';
      v.style.opacity = String(Math.min(1, 0.4 + q));
      $('#fwrap').style.setProperty('--fb', String(Math.min(1, q)));
    });
    stagger(v.querySelector('.chips'));
  }
  function closeFolder(instant, v0) {
    if (folderOpen < 0) return;
    const i = folderOpen; folderOpen = -1;
    const v = $('#fview'), wrap = $('#fwrap');
    if (instant) { stopSpring('fold'); wrap.classList.remove('on'); return; }
    const tile = document.querySelector('[data-tile="' + i + '"]');
    const cur = v.getBoundingClientRect();
    v.style.transform = ''; const end = v.getBoundingClientRect();
    const r = tile ? tile.getBoundingClientRect() : end;
    const sx = r.width / end.width, sy = r.height / end.height, dx = r.left - end.left, dy = r.top - end.top;
    const startP = 1 - Math.max(0, (cur.top - end.top)) / Math.max(1, dy || 1) * 0;
    spring('fold', startP, 0, -(v0 || 0) / 800, { response: 0.4, damping: 0.95, eps: 0.002 }, (p) => {
      v.style.transform = 'translate3d(' + dx * (1 - p) + 'px,' + dy * (1 - p) + 'px,0) scale(' + (sx + (1 - sx) * p) + ',' + (sy + (1 - sy) * p) + ')';
      v.style.opacity = String(Math.max(0, Math.min(1, p * 1.4)));
      wrap.style.setProperty('--fb', String(Math.max(0, p)));
    }, () => { wrap.classList.remove('on'); v.style.transform = ''; });
  }
  $('#fq').addEventListener('input', (e) => { fq = e.target.value.trim(); renderFolders(); });

  // ------------------------------------------------------------------ search (Spotlight)
  const COMMANDS = [
    ['Jere mode', 'Mode', () => setMode(true)],
    ['Plain mode', 'Mode', () => setMode(false)],
    ['Settings', 'Paper', () => openSettings()],
    ['Update Paper', 'Paper', () => { openSettings(); checkUpdates(); }],
    ['Edit home apps', 'Paper', () => openHomeEditor()],
    ['Fun stuff', 'Hidden', () => openFun()],
    ['Themes', 'Hidden', () => openThemes()],
    ['Phone notifications', 'Phone', () => call('shade')],
    ['Phone settings', 'Phone', () => call('settings', '')]
  ];
  function results() {
    const q = $('#q').value.trim(), ql = low(q);
    const out = [];
    if (!ql) return out;
    COMMANDS.forEach(([n, w, f]) => { if (low(n).startsWith(ql) || low(n).split(' ').some((x) => x.startsWith(ql) && ql.length > 2)) out.push({ n, w, f, cmd: n }); });
    APPS.filter((a) => low(a.label).split(/[\s.\-]+/).some((x) => x.startsWith(ql)) || low(a.label).startsWith(ql))
      .forEach((a) => out.push({ n: a.label, w: whereIs(a.key), f: () => open(a.key, a.label), key: a.key }));
    folderList().forEach((f, i) => { if (low(f.name).startsWith(ql)) out.push({ n: f.name, w: 'Folder', f: () => { goPage(1); setTimeout(() => openFolder(i), 380); } }); });
    // the hidden folders' contents answer by name too
    if (ql.length > 2) {
      const hit = (n) => low(n).split(/[\s\-]+/).some((x) => x.startsWith(ql));
      TOYS.filter((t) => hit(t[1])).slice(0, 4).forEach((t) => out.push({ n: t[1], w: 'Fun', f: () => openToy(t[0]) }));
      TH.filter((c) => hit(c.n)).slice(0, 4).forEach((c) => out.push({ n: c.n + ' theme', w: 'Theme', f: () => { setTheme({ color: c.id, auto: false }); toast(c.n); } }));
    }
    out.push({ n: 'Search the web for “' + q + '”', w: 'Brave', f: () => call('web', q), q });
    out.push({ n: 'Find “' + q + '” on the map', w: 'Maps', f: () => call('maps', q), q, maps: true });
    return out;
  }
  function whereIs(key) {
    if (S.jere && [...S.home.people, ...S.home.things].some((h) => h.key === key)) return 'Home';
    const f = S.jere && S.folders.find((x) => x.keys.includes(key));
    return f ? f.name : 'App';
  }
  function suggested() {
    const homeKeys = new Set(S.jere ? [...S.home.people, ...S.home.things].map((h) => h.key) : []);
    const used = Object.entries(S.uses || {}).filter(([k]) => byKey.has(k)).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const picks = used.filter((k) => !homeKeys.has(k));
    for (const f of S.folders || []) for (const k of f.keys) { if (picks.length >= 8) break; if (!picks.includes(k) && byKey.has(k) && !homeKeys.has(k)) picks.push(k); }
    return picks.slice(0, 4).map((k) => byKey.get(k));
  }
  let RES = [];
  function renderResults() {
    RES = results();
    const box = $('#results');
    if (!$('#q').value.trim()) {
      const sug = suggested();
      const rec = (S.recent || []).slice(0, 4);
      box.innerHTML = (sug.length ? '<section class="glass card"><span class="mono">Suggested</span><div class="sug">' + sug.map((a) => '<button class="sg" data-open="' + esc(a.key) + '" data-label="' + esc(a.label) + '">' + esc(shortName(a.label)) + '</button>').join('') + '</div></section>' : '') +
        (rec.length ? '<section class="glass card"><span class="mono">Recent</span>' + rec.map((r, i) => '<button class="row" data-recent="' + i + '"><span class="l">' + esc(r.n) + '</span><span class="r mono">' + esc(r.w) + '</span></button>').join('') + '</section>' : '') +
        '<p class="hint">Apps, folders, or commands like “jere mode” and “update”. Swipe up to go back.</p>';
      return;
    }
    box.innerHTML = RES.length ? '<section class="glass card">' + RES.map((r, i) => '<button class="row' + (i === 0 ? ' best' : '') + '" data-res="' + i + '"><span class="l">' + esc(r.n) + '</span><span class="r mono">' + esc(r.w) + '</span></button>').join('') + '</section>' :
      '<p class="hint">Nothing matches.</p>';
  }
  function remember(r) {
    if (r.q !== undefined) return;
    const entry = r.key ? { n: r.n, w: r.w, key: r.key } : r.cmd ? { n: r.n, w: r.w, cmd: r.cmd } : null;
    if (!entry) return;
    S.recent = [entry].concat((S.recent || []).filter((x) => x.n !== entry.n)).slice(0, 6); save();
  }
  function runResult(i) { const r = RES[i]; if (!r) return; remember(r); setOver(''); $('#q').value = ''; setTimeout(r.f, 60); }
  function runRecent(i) {
    const r = (S.recent || [])[i]; if (!r) return;
    setOver(''); $('#q').value = '';
    if (r.key) setTimeout(() => open(r.key, r.n), 60);
    else { const c = COMMANDS.find((x) => x[0] === r.cmd); if (c) setTimeout(c[2], 60); }
  }

  // ------------------------------------------------------------------ now
  let MEDIA = null, NOTIFS = [], replyOpen = '';
  function loadNow() {
    MEDIA = J(call('media'), null);
    NOTIFS = J(call('notifs'), []);
  }
  function renderNow() {
    loadNow();
    const parts = [];
    const ev = nextEvent();
    if (ev) {
      const s = new Date(ev.start), now = Date.now();
      const when = ev.start <= now ? 'Now · until ' + hm(new Date(ev.end)) :
        (dayStart(s) === dayStart(new Date()) ? 'Next · today ' : dayStart(s) - dayStart(new Date()) === 864e5 ? 'Next · tomorrow ' : 'Next · ' + DN[s.getDay()] + ' ') + hm(s) + ' ' + ampm(s);
      parts.push('<section class="glass card hrow"><span class="col"><span class="mono">' + esc(when) + '</span><span class="ti">' + esc(ev.title || '(No title)') + '</span>' +
        (ev.loc ? '<span class="tx one">' + esc(ev.loc) + '</span>' : '') + '</span>' +
        (ev.loc ? '<button class="btn sm solid" data-route="' + esc(ev.loc) + '">Route</button>' : '<button class="btn sm" data-ev="' + esc(ev.id) + '">Open</button>') + '</section>');
    } else if (!calAllowed) {
      parts.push('<section class="glass card hrow"><span class="tx">Allow calendar to see what’s next.</span><button class="btn sm" data-perm="calendar">Allow</button></section>');
    }
    if (MEDIA && MEDIA.title) {
      const pct = MEDIA.duration > 0 && MEDIA.position >= 0 ? Math.min(100, Math.round(100 * (MEDIA.position + (MEDIA.playing && MEDIA.positionAt ? Date.now() - MEDIA.positionAt : 0) * (MEDIA.speed || 1)) / MEDIA.duration)) : 0;
      parts.push('<section class="glass card"><div class="hrow"><span class="col"><span class="mono">' + (MEDIA.playing ? 'Playing' : 'Paused') + '</span><span class="ti">' + esc(MEDIA.title) + '</span>' +
        (MEDIA.artist ? '<span class="tx one">' + esc(MEDIA.artist) + '</span>' : '') + '</span><span class="ctl">' +
        '<button class="ib" data-media="prev" aria-label="Previous">' + ICON.prev + '</button>' +
        '<button class="ib solid" data-media="toggle" aria-label="' + (MEDIA.playing ? 'Pause' : 'Play') + '">' + (MEDIA.playing ? ICON.pause : ICON.play) + '</button>' +
        '<button class="ib" data-media="next" aria-label="Next">' + ICON.next + '</button></span></div>' +
        (pct ? '<div class="bar"><i style="width:' + pct + '%"></i></div>' : '') + '</section>');
    }
    const p = J(call('perms'), {});
    if (!p.notif) {
      parts.push('<section class="glass card hrow"><span class="tx">Turn on notification access to see messages and music here.</span><button class="btn sm" data-perm="notif">Turn on</button></section>');
    } else {
      const seen = new Set();
      const msgs = NOTIFS.filter((n) => n.canReply).sort((a, b) => b.time - a.time).filter((n) => { const k = n.pkg + '|' + (n.convo || n.title); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
      msgs.forEach((n) => {
        const app = APPS.find((a) => a.pkg === n.pkg);
        parts.push('<section class="glass card"><button class="col msg" data-notif="' + esc(n.id) + '"><span class="mono">' + esc((n.person || n.title || '') + (app ? ' · ' + app.label : '') + ' · ' + agoText(n.time)) + '</span><span class="mt">' + esc(n.text) + '</span></button>' +
          (replyOpen === n.id ? '<form class="reply" data-send="' + esc(n.id) + '"><input type="text" placeholder="Reply" aria-label="Reply" enterkeyhint="send"><button class="btn solid sm" type="submit">Send</button></form>'
            : '<div class="btnrow" style="margin:0"><button class="btn sm" data-reply="' + esc(n.id) + '">Reply</button><button class="btn sm" data-clear="' + esc(n.id) + '">Clear</button></div>') + '</section>');
      });
      if (!msgs.length && !(MEDIA && MEDIA.title) && !ev) parts.push('<section class="glass card"><span class="tx">Nothing waiting. Nothing playing.</span></section>');
    }
    $('#nowlist').innerHTML = parts.join('');
    $('#dock').innerHTML = DOCK.map(([k, label, icon]) =>
      '<button class="dk" data-dock="' + k + '"' + (k === 'settings' ? ' data-hold="paper-settings"' : '') + '><span class="di">' + icon + '</span><span class="dl">' + label + '</span></button>').join('');
    if (replyOpen) { const i = $('.reply input'); if (i) setTimeout(() => i.focus(), 30); }
  }
  const DI = (d) => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  const DOCK = [
    ['camera', 'Camera', DI('M4 8h3l2-3h6l2 3h3v11H4z M8.5 13a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0')],
    ['gallery', 'Gallery', DI('M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4')],
    ['clock', 'Clock', DI('M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M12 8v4l3 2')],
    ['settings', 'Settings', DI('M4 8h10 M18 8h2 M4 16h2 M10 16h10 M14 8a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M6 16a2 2 0 1 0 4 0a2 2 0 1 0-4 0')],
    ['contacts', 'Contacts', DI('M12 12a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7 M5 20c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5')]
  ];
  function dock(k) {
    if (k === 'camera') { if (!call('camera')) openFirst(['Camera']); return; }
    if (k === 'gallery') return openFirst(['Gallery', 'Google Photos', 'Photos']);
    if (k === 'clock') return openFirst(['Clock']);
    if (k === 'contacts') return openFirst(['Contacts', 'Phone']);
    if (k === 'settings') { const a = findApp(['Settings']); if (a) open(a.key, a.label); else call('settings', ''); }
  }
  function openFirst(names) { const a = findApp(names); if (a) open(a.key, a.label); else toast(names[0] + ' isn’t installed'); }
  function agoText(t) {
    const m = Math.round((Date.now() - t) / 6e4);
    if (m < 1) return 'now'; if (m < 60) return m + ' min'; const h = Math.round(m / 60); if (h < 24) return h + ' h'; return Math.round(h / 24) + ' d';
  }
  // ------------------------------------------------------------------ sheets
  let sheetOpen = false, sheetY = 0, sheetKind = '';
  function paintSheet() {
    const sh = $('#sheet'), h = sh.offsetHeight || H();
    sh.style.transform = 'translate3d(0,' + sheetY + 'px,0)';
    $('#scrim').style.opacity = String(Math.max(0, 1 - sheetY / h));
  }
  function openSheet(html) {
    $('#sbody').innerHTML = html;
    $('#sbody').scrollTop = 0;
    const sh = $('#sheet');
    if (!sheetOpen) { sh.classList.add('on'); $('#scrim').classList.add('on'); sheetY = sh.offsetHeight || H(); paintSheet(); }
    sheetOpen = true;
    closeRail(); closeLift();
    openSheetSpring(0);
  }
  function openSheetSpring(v0) { spring('sheet', sheetY, 0, v0 || 0, SHEET_SPRING, (v) => { sheetY = v; paintSheet(); }); }
  function closeSheet(v0) {
    if (!sheetOpen) return;
    sheetOpen = false; picker = null; sheetKind = '';
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    const sh = $('#sheet');
    spring('sheet', sheetY, sh.offsetHeight + 40, typeof v0 === 'number' ? v0 : 0, { response: 0.4, damping: 1, eps: 0.5 }, (v) => { sheetY = v; paintSheet(); },
      () => { if (!sheetOpen) { sh.classList.remove('on'); $('#scrim').classList.remove('on'); } });
  }

  function onHold(el) {
    const h = el.dataset.hold || '';
    if (h === 'clock' || h === 'paper-settings') return openSettings();
    if (h.startsWith('folder:')) {
      const i = +h.split(':')[1];
      return lift(el.querySelector('.tname') || el, [
        { id: 'o', label: 'Open', run: () => openFolder(i) },
        { id: 'a', label: 'Add apps', run: () => openPicker({ fold: i }) },
        { id: 'r', label: 'Rename', run: () => folderSheet(i) },
        { id: 'd', label: 'Delete folder', red: true, run: () => { S.folders.splice(i, 1); save(); renderFolders(); toast('Folder deleted'); } }
      ]);
    }
    const key = el.dataset.key, label = el.dataset.label, a = byKey.get(key);
    const items = [];
    if (a) items.push({ id: 'o', label: 'Open', run: () => open(key, label) });
    if (h.startsWith('home:')) {
      if (!a) items.push({ id: 'c', label: 'Choose the app', run: () => openPicker({ where: h }) });
      items.push({ id: 'h', label: 'Remove from Home', run: () => { const [, c, i] = h.split(':'); S.home[c].splice(+i, 1); save(); renderHome(); } });
    }
    if (h.startsWith('infolder:')) items.push({ id: 'f', label: 'Remove from folder', run: () => { const i = +h.split(':')[1]; S.folders[i].keys = S.folders[i].keys.filter((x) => x !== key); save(); renderFolders(); if (folderOpen === i) { closeFolder(true); openFolder(i); } } });
    if (a && S.jere) { const f = S.folders.find((x) => x.keys.includes(key)); items.push({ id: 'm', label: 'Move to folder…', note: f ? f.name : '', run: () => appSheet(key, label, h) }); }
    if (a) items.push({ id: 'i', label: 'App info', run: () => call('appInfo', a.pkg) });
    if (a) items.push({ id: 'u', label: 'Uninstall', red: true, run: () => call('uninstall', a.pkg) });
    lift(el, items);
  }
  function appSheet(key, label, where) {
    const a = byKey.get(key);
    const btns = [];
    if (a) btns.push('<button class="btn solid" data-act="open" data-k="' + esc(key) + '">Open</button>');
    if (where.startsWith('home:')) btns.push('<button class="btn" data-act="rmhome" data-w="' + esc(where) + '">Remove from Home</button>');
    if (where.startsWith('infolder:')) btns.push('<button class="btn" data-act="rmfold" data-w="' + esc(where) + '" data-k="' + esc(key) + '">Remove from folder</button>');
    if (!a && where.startsWith('home:')) btns.push('<button class="btn" data-act="pickfor" data-w="' + esc(where) + '">Choose the app</button>');
    let moves = '';
    if (a && S.jere) {
      moves = '<div class="grp"><p class="mono">In folders</p>' + S.folders.map((f, i) =>
        '<button class="pick' + (f.keys.includes(key) ? ' on' : '') + '" data-tofold="' + i + '" data-k="' + esc(key) + '"><span>' + esc(f.name) + '</span><span class="ck">' + (f.keys.includes(key) ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="stroke:var(--bg)" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '') + '</span></button>').join('') + '</div>';
    }
    sheetKind = 'app';
    openSheet('<h2>' + esc(label || (a && a.label) || 'App') + '</h2>' + (a && a.label !== label ? '<p class="mono" style="margin:0">' + esc(a.label) + '</p>' : '') +
      '<div class="btnrow">' + btns.join('') + '</div>' + moves +
      (a ? '<div class="btnrow" style="margin-top:20px"><button class="btn" data-act="info" data-p="' + esc(a.pkg) + '">App info</button><button class="btn" data-act="uninstall" data-p="' + esc(a.pkg) + '">Uninstall</button></div>' : ''));
  }
  function folderSheet(i) {
    const f = S.folders[i];
    sheetKind = 'folder';
    openSheet('<h2>' + esc(f.name) + '</h2><div class="grp"><p class="mono">Name</p><input class="namein" id="fname" value="' + esc(f.name) + '" aria-label="Folder name"></div>' +
      '<div class="btnrow"><button class="btn solid" data-act="fsave" data-i="' + i + '">Save name</button><button class="btn" data-addto="' + i + '">Add apps</button>' +
      (i > 0 ? '<button class="btn" data-act="fup" data-i="' + i + '">Move up</button>' : '') +
      '<button class="btn" data-act="fdel" data-i="' + i + '">Delete folder</button></div>');
  }

  // App picker: toggles membership in a folder, or fills a Home slot.
  let picker = null;
  function openPicker(p) {
    picker = p;
    const title = p.fold != null ? 'Add to ' + S.folders[p.fold].name : 'Choose the app for this spot';
    const list = APPS.map((a) => {
      const on = p.fold != null ? S.folders[p.fold].keys.includes(a.key) : false;
      return '<button class="pick' + (on ? ' on' : '') + '" data-pk="' + esc(a.key) + '"><span>' + esc(a.label) + '</span><span class="ck">' + (on ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="stroke:var(--bg)" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '') + '</span></button>';
    }).join('');
    sheetKind = 'picker';
    openSheet('<h2>' + esc(title) + '</h2><div class="grp">' + list + '</div>' + (p.fold != null ? '<div class="btnrow" style="margin-top:16px"><button class="btn solid" data-act="close">Done</button></div>' : ''));
  }

  function openHomeEditor() {
    const col = (c, label) => '<div class="grp"><p class="mono">' + label + '</p>' + S.home[c].map((h, i) =>
      '<div class="kv"><span class="k">' + esc(h.name) + (h.key && byKey.has(h.key) ? '' : ' <span class="v">· not found</span>') + '</span><span style="display:flex;gap:6px">' +
      (i > 0 ? '<button class="btn sm" data-act="hup" data-w="home:' + c + ':' + i + '">Up</button>' : '') +
      '<button class="btn sm" data-act="pickfor" data-w="home:' + c + ':' + i + '">Change</button>' +
      '<button class="btn sm" data-act="rmhome" data-w="home:' + c + ':' + i + '">Remove</button></span></div>').join('') +
      '<div class="btnrow"><button class="btn" data-act="addhome" data-c="' + c + '">+ Add to ' + label + '</button></div></div>';
    sheetKind = 'home';
    openSheet('<h2>Home apps</h2><p class="hint" style="margin-top:0">Seven a column fits best. Hold any app on Home for the same options.</p>' + col('people', 'People') + col('things', 'Things'));
  }

  // ------------------------------------------------------------------ settings + updates
  let UPD = { page: '', app: '', avail: null };
  function openSettings() {
    const info = J(call('updateInfo'), {});
    const p = J(call('perms'), {});
    const perm = (k, label, name) => '<div class="kv"><span class="k">' + label + '</span>' + (p[k] ? '<span class="v">On</span>' : '<button class="btn sm" data-perm="' + name + '">Turn on</button>') + '</div>';
    const when = info.pageAt ? new Date(info.pageAt) : null;
    sheetKind = 'settings';
    openSheet('<h2>Settings</h2>' +
      '<div class="grp"><p class="mono">Mode</p><div class="seg"><button class="btn' + (S.jere ? ' on' : '') + '" data-mode="1">Jere mode</button><button class="btn' + (S.jere ? '' : ' on') + '" data-mode="0">Plain</button></div>' +
      '<p class="hint" style="margin-top:10px">Jere mode: your 14 apps, your folders. Plain: every app A–Z, folders by type.</p></div>' +
      '<div class="grp"><p class="mono">Updates</p>' +
      '<div class="kv"><span class="k">App</span><span class="v">' + esc(info.app || call('version') || '?') + '</span></div>' +
      '<div class="kv"><span class="k">Page</span><span class="v">' + esc(PAGE_VERSION) + (info.onLive ? ' · from GitHub' + (when ? ', ' + MN[when.getMonth()] + ' ' + when.getDate() + ' ' + hm(when) : '') : ' · built in') + '</span></div>' +
      '<div class="btnrow"><button class="btn solid" data-act="check">Check for updates</button>' +
      (UPD.avail ? '<button class="btn solid" data-act="install">Install app ' + esc(UPD.avail) + '</button>' : '') +
      (info.onLive ? '<button class="btn" data-act="resetpage">Use the built-in page</button>' : '') + '</div>' +
      '<p class="status" id="updStatus">' + esc([UPD.page, UPD.app].filter(Boolean).join(' · ')) + '</p>' +
      '<p class="hint" style="margin-top:4px">Page updates come straight from GitHub (main/index.html) and apply in a second. App updates download the newest release and hand it to Android to install.</p></div>' +
      '<div class="grp"><p class="mono">Layout</p><div class="btnrow" style="margin-top:0"><button class="btn" data-act="edithome">Edit home apps</button><button class="btn" data-act="newfold">New folder</button><button class="btn" data-act="reseed">Re-sort folders</button></div></div>' +
      '<div class="grp"><p class="mono">Access</p>' + perm('isHome', 'Home app', 'home') + perm('calendar', 'Calendar', 'calendar') + perm('notif', 'Notifications (messages, music)', 'notif') + perm('dnd', 'Do Not Disturb', 'dnd') + '</div>' +
      '<div class="grp"><p class="mono">Gestures</p><p class="hint" style="margin-top:0">Swipe right: calendar. Swipe left: folders. Drag along the dots at the bottom to scrub. Swipe down: search (from the very top: the phone’s notifications). Swipe up: Now. Hold an app or a folder for options. Hold the clock, or Settings on Now, for this sheet.</p></div>' +
      '<p class="mono" style="margin:22px 0 0">Paper · github.com/jere-mee-as/paper</p>');
  }
  function checkUpdates() { UPD.page = 'Checking the page…'; UPD.app = 'Checking the app…'; paintUpd(); call('checkUpdate', 'page'); call('checkUpdate', 'app'); }
  function paintUpd() { const el = $('#updStatus'); if (el) el.textContent = [UPD.page, UPD.app].filter(Boolean).join(' · '); }
  function onUpdate(u) {
    if (!u) return;
    if (u.kind === 'page') {
      UPD.page = { checking: 'Checking the page…', current: 'Page is up to date', ready: 'New page downloaded, applying…', error: 'Page: ' + (u.msg || 'failed'), 'rolled-back': 'The new page didn’t start, so Paper went back to the built-in one' }[u.state] || '';
      if (u.state === 'ready') setTimeout(() => call('applyPage'), 500);
      if (u.state === 'rolled-back') toast('Update rolled back');
    } else if (u.kind === 'app') {
      if (u.state === 'available') { UPD.avail = u.version; UPD.app = 'App ' + u.version + ' is out (you have ' + u.from + ')'; if (sheetKind === 'settings') openSettings(); }
      else UPD.app = { checking: 'Checking the app…', current: 'App is up to date', downloading: 'Downloading ' + (u.pct >= 0 ? u.pct + '%' : '…'), installing: 'Handing it to Android…', confirm: 'Confirm the install', done: 'Installed', canceled: 'Install canceled', 'needs-permission': 'Allow Paper to install apps, then tap Install again', busy: 'Already downloading', error: (u.msg || 'Failed') }[u.state] || '';
    }
    paintUpd();
  }
  function setMode(on) {
    S.jere = !!on; save();
    renderHome(); renderFolders(); staggerHome();
    if (sheetKind === 'settings') openSettings();
    toast(on ? 'Jere mode' : 'Plain mode');
  }

  // ------------------------------------------------------------------ clicks
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, form');
    if (!t) { if (e.target === $('#scrim')) closeSheet(); return; }
    if (t.closest('#lift')) return;
    if (t.closest('#toy')) { if (t.id === 'toyX') closeToy(); return; }
    const d = t.dataset;
    if (d.toy) { openToy(d.toy === '?' ? pickOf(TOYS)[0] : d.toy); return; }
    if (d.color) { setTheme({ color: d.color, auto: false }); return; }
    if (d.pat) { setTheme({ pat: d.pat }); return; }
    if (d.str) { setTheme({ str: d.str }); return; }
    if (d.set !== undefined) { const z = SETS[+d.set]; setTheme({ color: z[1], pat: z[2], str: z[3], auto: false }); return; }
    if (d.thact) { themeAct(d.thact); return; }
    if (d.open !== undefined) { open(d.open, d.label); return; }
    if (d.tile !== undefined) { openFolder(+d.tile); return; }
    if (d.recent !== undefined) { runRecent(+d.recent); return; }
    if (d.addto !== undefined) { const i = +d.addto; closeFolder(true); openPicker({ fold: i }); return; }
    if (d.ev) { call('openEvent', d.ev); return; }
    if (d.res !== undefined) { runResult(+d.res); return; }
    if (d.route) { call('maps', d.route); return; }
    if (d.media) { call('mediaCmd', d.media); setTimeout(renderNow, 350); return; }
    if (d.perm) { call('askPerm', d.perm); return; }
    if (d.notif) { call('notifOpen', d.notif); return; }
    if (d.reply) { replyOpen = d.reply; renderNow(); return; }
    if (d.clear) { call('notifDismiss', d.clear); setTimeout(renderNow, 200); return; }
    if (d.mode !== undefined) { setMode(d.mode === '1'); return; }
    if (d.dock) return dock(d.dock);
    if (d.pk) return pick(d.pk);
    if (d.tofold !== undefined) {
      const f = S.folders[+d.tofold], k = d.k;
      if (f.keys.includes(k)) f.keys = f.keys.filter((x) => x !== k); else f.keys.push(k);
      save(); renderFolders(); appSheet(k, (byKey.get(k) || {}).label, 'app'); return;
    }
    if (d.act) return act(d.act, d);
    if (t.id === 'addEv') { const s = new Date(); s.setMinutes(0, 0, 0); s.setHours(s.getHours() + 1); call('newEvent', '', s.getTime(), s.getTime() + 36e5, false); return; }
    if (t.id === 'allowCal') { call('askPerm', 'calendar'); return; }
  });
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.dataset.send) {
      const text = f.querySelector('input').value.trim();
      if (!text) return;
      const ok = call('notifReply', f.dataset.send, text);
      toast(ok ? 'Sent' : 'Couldn’t send. Open the app instead.');
      replyOpen = ''; setTimeout(renderNow, 300);
    }
  });
  function pick(key) {
    if (!picker) return;
    if (picker.fold != null) {
      const f = S.folders[picker.fold];
      if (f.keys.includes(key)) f.keys = f.keys.filter((x) => x !== key); else f.keys.push(key);
      save(); renderFolders(); openPicker(picker);
    } else if (picker.where) {
      const [, c, i] = picker.where.split(':');
      const a = byKey.get(key);
      if (picker.add) S.home[c].push({ name: shortName(a.label), alias: [a.label], key });
      else Object.assign(S.home[c][+i], { key, alias: [a.label], name: S.home[c][+i].key ? shortName(a.label) : S.home[c][+i].name });
      const back = picker.back;
      save(); renderHome(); closeSheet(); if (back) openHomeEditor();
    }
  }
  const shortName = (l) => l.replace(/^Samsung |^Google (?!Maps)/, '').replace(/^YouTube Music$/, 'YT Music');
  function act(a, d) {
    if (a === 'open') { closeSheet(); open(d.k); return; }
    if (a === 'close') { closeSheet(); return; }
    if (a === 'info') { closeSheet(); call('appInfo', d.p); return; }
    if (a === 'uninstall') { closeSheet(); call('uninstall', d.p); return; }
    if (a === 'rmhome') { const [, c, i] = d.w.split(':'); S.home[c].splice(+i, 1); save(); renderHome(); if (sheetKind === 'home') openHomeEditor(); else closeSheet(); return; }
    if (a === 'hup') { const [, c, i] = d.w.split(':'); const L = S.home[c]; [L[i - 1], L[i]] = [L[i], L[i - 1]]; save(); renderHome(); openHomeEditor(); return; }
    if (a === 'pickfor') { const back = sheetKind === 'home'; openPicker({ where: d.w, back }); return; }
    if (a === 'addhome') { openPicker({ where: 'home:' + d.c + ':0', add: true, back: true }); return; }
    if (a === 'rmfold') { const i = +d.w.split(':')[1]; S.folders[i].keys = S.folders[i].keys.filter((x) => x !== d.k); save(); renderFolders(); closeSheet(); return; }
    if (a === 'fsave') { const n = $('#fname').value.trim(); if (n) { if (S.open === S.folders[+d.i].name) S.open = n; S.folders[+d.i].name = n; save(); renderFolders(); } closeSheet(); return; }
    if (a === 'fup') { const i = +d.i, L = S.folders; [L[i - 1], L[i]] = [L[i], L[i - 1]]; save(); renderFolders(); closeSheet(); return; }
    if (a === 'fdel') { S.folders.splice(+d.i, 1); save(); renderFolders(); closeSheet(); toast('Folder deleted'); return; }
    if (a === 'newfold') { S.folders.push({ name: 'New folder', keys: [] }); save(); renderFolders(); folderSheet(S.folders.length - 1); return; }
    if (a === 'reseed') { seedFolders(); save(); renderFolders(); toast('Folders re-sorted'); return; }
    if (a === 'edithome') { openHomeEditor(); return; }
    if (a === 'check') { checkUpdates(); return; }
    if (a === 'install') { UPD.app = 'Starting download…'; paintUpd(); call('installUpdate'); return; }
    if (a === 'resetpage') { call('resetPage'); return; }
  }

  // search input
  $('#q').addEventListener('input', () => renderResults());
  $('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runResult(0); } });

  // hold the clock → settings
  $('#clock').setAttribute('data-hold', 'clock');
  $('#scrim').addEventListener('click', () => closeSheet());

/*__THEMES__*/
/*__FUN__*/
  // ------------------------------------------------------------------ native events
  window.PAPER = {
    onNative(type, data) {
      const v = J(data, data);
      switch (type) {
        case 'back': if (toyOpen) closeToy(); else if (liftOpen) closeLift(); else if (railPinned) closeRail(); else if (sheetOpen) closeSheet(); else if (folderOpen >= 0) closeFolder(); else if (over) setOver(''); else goPage(0); break;
        case 'home': closeToy(true); closeRail(); if (hxTarget === 0 && !over && !sheetOpen && folderOpen < 0) staggerHome(); goHome(); break;
        case 'apps': loadApps(); renderHome(); if (folderOpen < 0) renderFolders(); break;
        case 'resume': sunTick(); renderClock(); loadEvents(); renderCal(); if (over === 'now') renderNow(); if (sheetKind === 'settings') openSettings(); break;
        case 'perms': loadEvents(); renderCal(); if (over === 'now') renderNow(); if (sheetKind === 'settings') openSettings(); break;
        case 'notifs': case 'media': if (over === 'now' && !replyOpen) renderNow(); break;
        case 'update': onUpdate(v); break;
      }
    },
    bars() { return themeBars; },
    // For the automated checks (src/check.js).
    state() { return { hx, hxTarget, tS, tN, over, sheet: sheetOpen, lift: liftOpen, folder: folderOpen, rail: railPop.classList.contains('on'), springs: running.size, toy: toyOpen, kind: sheetKind, theme: Object.assign({}, S.theme) }; },
    themes() { return TH.map((c) => { const d = derive(c); return { id: c.id, n: c.n, g: c.g, ink: +d.inkMin.toFixed(2), ink2: +d.ink2Min.toFixed(2) }; }); },
    patterns() { return PATS.map((x) => x[0]); },
    toys() { return TOYS.map((t) => t[0]); },
    setTheme, openToy, closeToy, sunPhase, sunTimes
  };

  // ------------------------------------------------------------------ start
  if (N.__mock) document.documentElement.style.setProperty('--top', '24px');
  else { document.documentElement.style.setProperty('--top', '0px'); document.documentElement.style.setProperty('--bot', '0px'); }
  // Nothing may scroll the frame itself (focus or scroll-into-view would shift every page under the finger).
  ['#app', '#stage', '#pHome', '#pFold'].forEach((sel) => { const el = $(sel); el.addEventListener('scroll', () => { if (el.scrollLeft || el.scrollTop) { el.scrollLeft = 0; el.scrollTop = 0; } }); });
  applyTheme(false);
  loadApps(); loadEvents();
  renderHome(); renderCal(); renderFolders(); renderNow();
  paint();
  requestAnimationFrame(() => staggerHome());
  setInterval(renderClock, 10000);
  setInterval(sunTick, 60000);
  window.addEventListener('resize', paint);
  call('ready');
})();
