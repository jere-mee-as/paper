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
  const PAGE_VERSION = '0.1.0';

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
    pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ECE9E2" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#ECE9E2" aria-hidden="true"><path d="M8 5l12 7-12 7z"/></svg>'
  };

  // ------------------------------------------------------------------ navigation
  // page: 0 calendar, 1 home, 2 folders. over: '' | 'search' | 'now'.
  let page = 1, over = '';
  const wide = () => window.innerWidth >= 760;
  function setPage(p) {
    page = Math.max(0, Math.min(2, p));
    $('#track').style.transform = wide() ? '' : 'translateX(' + (-page * 100 / 3) + '%)';
    if (page === 0) renderCal();
    if (page === 2) renderFolders();
  }
  function setOver(o) {
    if (over === o) return;
    over = o;
    $('#search').classList.toggle('open', o === 'search');
    $('#now').classList.toggle('open', o === 'now');
    if (o === 'search') { renderResults(); setTimeout(() => $('#q').focus(), 60); }
    else { $('#q').blur(); }
    if (o === 'now') renderNow();
  }
  function goHome() { closeSheet(); setOver(''); setPage(1); }

  // ------------------------------------------------------------------ gestures
  let g = null, suppressClick = false;
  function scroller(el) {
    while (el && el !== document.body) { if (el.classList && el.classList.contains('scroll')) return el; el = el.parentElement; }
    return null;
  }
  document.addEventListener('pointerdown', (e) => {
    if (sheetOpen) return;
    g = { x: e.clientX, y: e.clientY, t: Date.now(), sc: scroller(e.target), target: e.target, sy: 0 };
    if (g.sc) g.sy = g.sc.scrollTop;
    startHold(e);
  }, { passive: true });
  document.addEventListener('pointermove', (e) => {
    if (!g) return;
    if (Math.abs(e.clientX - g.x) > 10 || Math.abs(e.clientY - g.y) > 10) cancelHold();
  }, { passive: true });
  document.addEventListener('pointercancel', () => { cancelHold(); g = null; });
  document.addEventListener('pointerup', (e) => {
    cancelHold();
    const s = g; g = null;
    if (!s || sheetOpen) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 44 || Date.now() - s.t > 900) return;
    let dir;
    if (ax > ay * 1.2) dir = dx > 0 ? 'right' : 'left';
    else if (ay > ax * 1.2) dir = dy > 0 ? 'down' : 'up';
    else return;
    // A vertical swipe inside a list that moved (or could still move that way) is a scroll, not navigation.
    if ((dir === 'up' || dir === 'down') && s.sc) {
      const sc = s.sc;
      if (sc.scrollTop !== s.sy) return;
      if (dir === 'down' && sc.scrollTop > 0) return;
      if (dir === 'up' && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2) return;
    }
    if (swipe(dir, s)) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 350); }
  });
  document.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);

  function swipe(dir, s) {
    if (over === 'search') { if (dir === 'up') { setOver(''); return true; } return false; }
    if (over === 'now') { if (dir === 'down') { setOver(''); return true; } return false; }
    if (dir === 'down') {
      if (page !== 1 && !wide()) return false;
      if (s.y < 70) { call('shade'); return true; }      // from the very top: the phone's own notifications
      setOver('search'); return true;
    }
    if (dir === 'up') { if (page !== 1 && !wide()) return false; setOver('now'); return true; }
    if (wide()) return false;
    if (dir === 'right' && page > 0) { setPage(page - 1); return true; }
    if (dir === 'left' && page < 2) { setPage(page + 1); return true; }
    return false;
  }

  // Hold (long-press) on anything with data-hold.
  let holdT = 0;
  function startHold(e) {
    const el = e.target.closest && e.target.closest('[data-hold]');
    if (!el) return;
    holdT = setTimeout(() => {
      holdT = 0; g = null; suppressClick = true; setTimeout(() => { suppressClick = false; }, 400);
      haptic('long');
      onHold(el);
    }, 480);
  }
  function cancelHold() { if (holdT) { clearTimeout(holdT); holdT = 0; } }

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

  // ------------------------------------------------------------------ calendar
  let EVENTS = [];
  let calAllowed = true;
  function loadEvents() {
    const p = J(call('perms'), {});
    calAllowed = !!p.calendar;
    EVENTS = calAllowed ? J(call('events', 8), []) : [];
  }
  function renderCal() {
    const box = $('#days');
    if (!calAllowed) {
      box.innerHTML = '<div class="ask"><span>Paper reads your Google Calendar from the phone. Allow calendar access once.</span><button class="btn solid" id="allowCal">Allow calendar</button></div>';
      return;
    }
    const today = dayStart(new Date());
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d0 = today + i * 864e5, d1 = d0 + 864e5;
      const d = new Date(d0);
      const evs = EVENTS.filter((e) => e.start < d1 && e.end > d0 && (!e.allDay || e.start >= d0 || i === 0));
      const name = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : DN[d.getDay()];
      out.push('<section class="day"><div class="dlab"><span class="mono">' + name + '</span><span class="dnum">' + d.getDate() + '</span></div><div class="evs">' +
        (evs.length ? evs.map((e) => {
          const s = new Date(e.start);
          const t = e.allDay ? 'All day' : (e.start < d0 ? '…' : hm(s));
          return '<button class="ev" data-ev="' + esc(e.id) + '"><span class="t">' + t + '</span><span class="n">' + esc(e.title || '(No title)') + '</span>' +
            (e.color ? '<span class="dot" style="background:' + esc(e.color) + '"></span>' : '') + '</button>';
        }).join('') : '<p class="free" style="margin:0">Free</p>') + '</div></section>');
    }
    box.innerHTML = out.join('');
  }
  function nextEvent() {
    const now = Date.now();
    return EVENTS.filter((e) => !e.allDay && e.end > now).sort((a, b) => a.start - b.start)[0] || null;
  }

  // ------------------------------------------------------------------ folders
  function folderList() {
    if (S.jere) return S.folders;
    const CAT = { audio: 'Audio', video: 'Video', image: 'Photos', social: 'Social', productivity: 'Productivity', game: 'Games', news: 'News', maps: 'Maps', other: 'Other' };
    const m = new Map();
    APPS.forEach((a) => { const c = CAT[a.cat] || 'Other'; if (!m.has(c)) m.set(c, []); m.get(c).push(a.key); });
    return [...m.entries()].sort((a, b) => (a[0] === 'Other') - (b[0] === 'Other') || a[0].localeCompare(b[0])).map(([name, keys]) => ({ name, keys, auto: true }));
  }
  function renderFolders() {
    const list = folderList();
    $('#folds').innerHTML = list.map((f, i) => {
      const isOpen = S.open === f.name;
      const apps = f.keys.map((k) => byKey.get(k)).filter(Boolean);
      return '<div class="fold"><button class="fold-h" data-fold="' + esc(f.name) + '" data-hold="' + (f.auto ? '' : 'folder:' + i) + '" aria-expanded="' + isOpen + '">' +
        '<span class="nm">' + esc(f.name) + '</span><span class="sg" aria-hidden="true">' + (isOpen ? '−' : '+') + '</span></button>' +
        (isOpen ? '<div class="chips">' + apps.map((a) => '<button class="chip" data-open="' + esc(a.key) + '" data-label="' + esc(a.label) + '" data-hold="infolder:' + i + '" data-key="' + esc(a.key) + '">' + esc(a.label) + '</button>').join('') +
          (f.auto ? '' : '<button class="chip ghost" data-addto="' + i + '">' + (apps.length ? '+ Add' : '+ Add apps') + '</button>') + '</div>' : '') +
        '</div>';
    }).join('');
  }

  // ------------------------------------------------------------------ search
  const COMMANDS = [
    ['Jere mode', 'Mode', () => setMode(true)],
    ['Plain mode', 'Mode', () => setMode(false)],
    ['Settings', 'Paper', () => openSettings()],
    ['Update Paper', 'Paper', () => { openSettings(); checkUpdates(); }],
    ['Edit home apps', 'Paper', () => openHomeEditor()],
    ['Phone notifications', 'Phone', () => call('shade')],
    ['Phone settings', 'Phone', () => call('settings', '')]
  ];
  let letter = '';
  function results() {
    const q = $('#q').value.trim(), ql = low(q);
    const out = [];
    if (!ql) return out;
    if (!letter) COMMANDS.forEach(([n, w, f]) => { if (low(n).startsWith(ql) || low(n).split(' ').some((x) => x.startsWith(ql) && ql.length > 2)) out.push({ n, w, f }); });
    const apps = APPS.filter((a) => letter ? initial(a.label) === letter : low(a.label).split(/[\s.\-]+/).some((x) => x.startsWith(ql)) || low(a.label).startsWith(ql));
    apps.forEach((a) => out.push({ n: a.label, w: whereIs(a.key), f: () => open(a.key, a.label) }));
    if (!letter) {
      folderList().forEach((f) => { if (low(f.name).startsWith(ql)) out.push({ n: f.name, w: 'Folder', f: () => { S.open = f.name; save(); setOver(''); setPage(2); } }); });
      out.push({ n: 'Search the web for “' + q + '”', w: 'Brave', f: () => call('web', q) });
      out.push({ n: 'Find “' + q + '” on the map', w: 'Maps', f: () => call('maps', q) });
    }
    return out;
  }
  function whereIs(key) {
    if (S.jere && [...S.home.people, ...S.home.things].some((h) => h.key === key)) return 'Home';
    const f = S.jere && S.folders.find((x) => x.keys.includes(key));
    return f ? f.name : 'App';
  }
  let RES = [];
  function renderResults() {
    RES = results();
    const box = $('#results');
    if (!$('#q').value.trim()) {
      box.innerHTML = '<p class="hint">Type an app, a folder or a command (try “jere mode” or “update”). Swipe up to go back.</p>';
      return;
    }
    box.innerHTML = RES.map((r, i) => '<button class="row' + (i === 0 ? ' best' : '') + '" data-res="' + i + '"><span class="l">' + esc(r.n) + '</span><span class="r mono">' + esc(r.w) + '</span></button>').join('') ||
      '<p class="hint">Nothing matches.</p>';
  }
  function runResult(i) { const r = RES[i]; if (!r) return; setOver(''); $('#q').value = ''; letter = ''; r.f(); }

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
      parts.push('<section class="sec"><div class="hd"><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="mono">' + esc(when) + '</span><span class="ti">' + esc(ev.title || '(No title)') + '</span>' +
        (ev.loc ? '<span class="tx" style="-webkit-line-clamp:1">' + esc(ev.loc) + '</span>' : '') + '</div>' +
        (ev.loc ? '<button class="btn sm" data-route="' + esc(ev.loc) + '">Route</button>' : '<button class="btn sm" data-ev="' + esc(ev.id) + '">Open</button>') + '</div></section>');
    } else if (!calAllowed) {
      parts.push('<section class="sec"><div class="hd"><span class="tx">Allow calendar to see what’s next.</span><button class="btn sm" data-perm="calendar">Allow</button></div></section>');
    }
    if (MEDIA && MEDIA.title) {
      const pct = MEDIA.duration > 0 && MEDIA.position >= 0 ? Math.min(100, Math.round(100 * (MEDIA.position + (MEDIA.playing && MEDIA.positionAt ? Date.now() - MEDIA.positionAt : 0) * (MEDIA.speed || 1)) / MEDIA.duration)) : 0;
      parts.push('<section class="sec"><div class="hd"><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="mono">' + (MEDIA.playing ? 'Playing' : 'Paused') + '</span><span class="ti">' + esc(MEDIA.title) + '</span>' +
        (MEDIA.artist ? '<span class="tx" style="-webkit-line-clamp:1">' + esc(MEDIA.artist) + '</span>' : '') + '</div><div class="ctl">' +
        '<button class="ib" data-media="prev" aria-label="Previous">' + ICON.prev + '</button>' +
        '<button class="ib solid" data-media="toggle" aria-label="' + (MEDIA.playing ? 'Pause' : 'Play') + '">' + (MEDIA.playing ? ICON.pause : ICON.play) + '</button>' +
        '<button class="ib" data-media="next" aria-label="Next">' + ICON.next + '</button></div></div>' +
        (pct ? '<div class="bar"><i style="width:' + pct + '%"></i></div>' : '') + '</section>');
    }
    const p = J(call('perms'), {});
    if (!p.notif) {
      parts.push('<section class="sec"><div class="hd"><span class="tx">Turn on notification access to see messages and music here.</span><button class="btn sm" data-perm="notif">Turn on</button></div></section>');
    } else {
      const seen = new Set();
      const msgs = NOTIFS.filter((n) => n.canReply).sort((a, b) => b.time - a.time).filter((n) => { const k = n.pkg + '|' + (n.convo || n.title); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
      msgs.forEach((n) => {
        const app = APPS.find((a) => a.pkg === n.pkg);
        const ago = agoText(n.time);
        parts.push('<section class="sec"><button style="display:flex;flex-direction:column;gap:4px;width:100%" data-notif="' + esc(n.id) + '"><span class="mono">' + esc((n.person || n.title || '') + (app ? ' · ' + app.label : '') + ' · ' + ago) + '</span><span class="tx" style="color:var(--ink);font-size:17px">' + esc(n.text) + '</span></button>' +
          (replyOpen === n.id ? '<form class="reply" data-send="' + esc(n.id) + '"><input type="text" placeholder="Reply" aria-label="Reply" enterkeyhint="send"><button class="btn solid sm" type="submit">Send</button></form>'
            : '<div class="btnrow" style="margin:0"><button class="btn sm" data-reply="' + esc(n.id) + '">Reply</button><button class="btn sm" data-clear="' + esc(n.id) + '">Clear</button></div>') + '</section>');
      });
      if (!msgs.length && !(MEDIA && MEDIA.title) && !ev) parts.push('<section class="sec"><span class="tx">Nothing waiting. Nothing playing.</span></section>');
    }
    $('#nowlist').innerHTML = parts.join('');
    $('#toggles').innerHTML =
      '<button class="btn' + (S.dnd ? ' on' : '') + '" data-tog="dnd">Silent</button>' +
      '<button class="btn' + (S.torch ? ' on' : '') + '" data-tog="torch">Torch</button>' +
      '<button class="btn" data-tog="timer">Timer</button>' +
      '<button class="btn" data-tog="camera">Camera</button>';
    if (replyOpen) { const i = $('.reply input'); if (i) setTimeout(() => i.focus(), 30); }
  }
  function agoText(t) {
    const m = Math.round((Date.now() - t) / 6e4);
    if (m < 1) return 'now'; if (m < 60) return m + ' min'; const h = Math.round(m / 60); if (h < 24) return h + ' h'; return Math.round(h / 24) + ' d';
  }

  // ------------------------------------------------------------------ sheets
  let sheetOpen = false;
  function openSheet(html) {
    $('#sbody').innerHTML = html;
    $('#sbody').scrollTop = 0;
    $('#sheet').classList.add('on'); $('#scrim').classList.add('on');
    sheetOpen = true;
  }
  function closeSheet() {
    if (!sheetOpen) return;
    $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on');
    sheetOpen = false; picker = null; sheetKind = '';
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  }
  let sheetKind = '';

  function onHold(el) {
    const h = el.dataset.hold || '';
    if (h === 'clock') return openSettings();
    if (h.startsWith('folder:')) return folderSheet(+h.split(':')[1]);
    const key = el.dataset.key, label = el.dataset.label;
    appSheet(key, label, h);
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
      moves = '<div class="grp"><p class="mono">Put in a folder</p>' + S.folders.map((f, i) =>
        '<button class="pick' + (f.keys.includes(key) ? ' on' : '') + '" data-tofold="' + i + '" data-k="' + esc(key) + '"><span>' + esc(f.name) + '</span><span class="ck">' + (f.keys.includes(key) ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ECE9E2" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '') + '</span></button>').join('') + '</div>';
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
      return '<button class="pick' + (on ? ' on' : '') + '" data-pk="' + esc(a.key) + '"><span>' + esc(a.label) + '</span><span class="ck">' + (on ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ECE9E2" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '') + '</span></button>';
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
      '<div class="grp"><p class="mono">Gestures</p><p class="hint" style="margin-top:0">Swipe right: calendar. Swipe left: folders. Swipe down: search (from the very top: the phone’s notifications). Swipe up: Now. Hold an app or a folder for options. Hold the clock for this sheet.</p></div>' +
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
    renderHome(); renderFolders();
    if (sheetKind === 'settings') openSettings();
    toast(on ? 'Jere mode' : 'Plain mode');
  }

  // ------------------------------------------------------------------ clicks
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, form');
    if (!t) { if (e.target === $('#scrim')) closeSheet(); return; }
    const d = t.dataset;
    if (d.open !== undefined) { open(d.open, d.label); return; }
    if (d.letter) { letter = d.letter; $('#q').value = d.letter; setOver('search'); renderResults(); return; }
    if (d.fold) { S.open = S.open === d.fold ? '' : d.fold; save(); renderFolders(); return; }
    if (d.addto !== undefined) { openPicker({ fold: +d.addto }); return; }
    if (d.ev) { call('openEvent', d.ev); return; }
    if (d.res !== undefined) { runResult(+d.res); return; }
    if (d.route) { call('maps', d.route); return; }
    if (d.media) { call('mediaCmd', d.media); setTimeout(renderNow, 350); return; }
    if (d.perm) { call('askPerm', d.perm); return; }
    if (d.notif) { call('notifOpen', d.notif); return; }
    if (d.reply) { replyOpen = d.reply; renderNow(); return; }
    if (d.clear) { call('notifDismiss', d.clear); setTimeout(renderNow, 200); return; }
    if (d.mode !== undefined) { setMode(d.mode === '1'); return; }
    if (d.tog) return toggle(d.tog);
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
  function toggle(k) {
    if (k === 'dnd') { const ok = call('setDnd', !S.dnd); if (ok) { S.dnd = !S.dnd; save(); } else call('askPerm', 'dnd'); }
    if (k === 'torch') { const ok = call('torch', !S.torch); if (ok) { S.torch = !S.torch; save(); } }
    if (k === 'timer') {
      sheetKind = 'timer';
      openSheet('<h2>Timer</h2><div class="toggles" style="grid-template-columns:repeat(3,1fr)">' + [1, 3, 5, 10, 15, 25, 30, 45, 60].map((m) => '<button class="btn" data-act="timer" data-m="' + m + '">' + m + ' min</button>').join('') + '</div>');
      return;
    }
    if (k === 'camera') { call('camera'); return; }
    renderNow();
  }
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
    if (a === 'timer') { const m = +d.m; call('timer', m * 60, 'Timer'); closeSheet(); toast(m + ' min timer'); return; }
  }

  // search input
  $('#q').addEventListener('input', () => { letter = ''; renderResults(); });
  $('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runResult(0); } });

  // hold the clock → settings
  $('#clock').setAttribute('data-hold', 'clock');
  $('#scrim').addEventListener('click', closeSheet);

  // ------------------------------------------------------------------ native events
  window.PAPER = {
    onNative(type, data) {
      const v = J(data, data);
      switch (type) {
        case 'back': if (sheetOpen) closeSheet(); else if (over) setOver(''); else setPage(1); break;
        case 'home': goHome(); break;
        case 'apps': loadApps(); renderHome(); renderFolders(); break;
        case 'resume': renderClock(); loadEvents(); renderCal(); if (over === 'now') renderNow(); if (sheetKind === 'settings') openSettings(); break;
        case 'perms': loadEvents(); renderCal(); if (over === 'now') renderNow(); if (sheetKind === 'settings') openSettings(); break;
        case 'notifs': case 'media': if (over === 'now' && !replyOpen) renderNow(); break;
        case 'update': onUpdate(v); break;
      }
    },
    bars() { return ['rgb(236,233,226)', 'rgb(236,233,226)']; }
  };

  // ------------------------------------------------------------------ start
  if (N.__mock) document.documentElement.style.setProperty('--top', '24px');
  else { document.documentElement.style.setProperty('--top', '0px'); document.documentElement.style.setProperty('--bot', '0px'); }
  loadApps(); loadEvents();
  renderHome(); renderCal(); renderFolders(); setPage(1);
  setInterval(renderClock, 10000);
  window.addEventListener('resize', () => setPage(page));
  call('ready');
})();
