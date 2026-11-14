/* Preview bridge: stands in for window.PaperNative in a browser, on made-up data. Never used on the phone.
   Strict: every method checks its argument count against the Kotlin signatures (arity.json), so a wrong call fails here first. */
if (!window.PaperNative) window.PaperNative = (function () {
  var ARITY = __ARITY__;
  var now = Date.now(), MIN = 6e4, HOUR = 36e5;
  var names = ['Phone', 'Messages', 'WhatsApp', 'Discord', 'Instagram', 'Gmail', 'Proton Mail', 'Brave', 'Claude', 'Camera', 'Gallery', 'Maps',
    'YouTube', 'YouTube Music', 'Chase', 'Venmo', 'Capital One', 'Robinhood', 'Hinge', 'Bumble', 'Reddit', 'X', 'Threads', 'ChatGPT', 'Gemini',
    'Perplexity', 'Spotify', 'Pocket Casts', 'Shazam', 'Netflix', 'Max', 'Letterboxd', 'Slack', 'Drive', 'Docs', 'Procore', 'Proton Drive',
    'Proton Pass', 'Proton VPN', 'Proton Calendar', 'Calendar', 'Clock', 'Calculator', 'Contacts', 'My Files', 'Settings', 'Weather', 'Uber'];
  var cats = { Spotify: 'audio', 'Pocket Casts': 'audio', 'YouTube Music': 'audio', Shazam: 'audio', YouTube: 'video', Netflix: 'video', Max: 'video',
    Instagram: 'social', Discord: 'social', Reddit: 'social', X: 'social', Threads: 'social', Maps: 'maps', Gallery: 'image', Camera: 'image',
    Slack: 'productivity', Docs: 'productivity', Drive: 'productivity', Calendar: 'productivity' };
  // Stand-in icons for the preview (the phone serves real ones at /icon/…). A few are left empty to show the letter fallback.
  function fakeIcon(n) {
    if (/^(Uber|Weather|Max)$/.test(n)) return '';
    var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360;
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(" + h + ",70%,58%)'/><stop offset='1' stop-color='hsl(" + ((h + 40) % 360) + ",70%,42%)'/></linearGradient></defs><rect width='96' height='96' fill='url(#g)'/><text x='48' y='64' font-family='sans-serif' font-size='44' font-weight='600' fill='#fff' text-anchor='middle'>" + n.charAt(0) + "</text></svg>";
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  var apps = names.map(function (n) { var pkg = 'app.' + n.toLowerCase().replace(/[^a-z]/g, ''); return { key: pkg + '/Main', pkg: pkg, label: n, cat: cats[n] || 'other', icon: fakeIcon(n) }; });
  var notifs = [
    { id: 'n1', pkg: 'app.messages', kind: 'msg', title: 'Ana', text: 'Can you bring the charger?', person: 'Ana', convo: 'Ana', group: false, time: now - 5 * MIN, live: true, canReply: true, actions: [] },
    { id: 'n2', pkg: 'app.whatsapp', kind: 'msg', title: 'Leo', text: 'pizza after? you owe me 20', person: 'Leo', convo: 'Leo', group: false, time: now - 31 * MIN, live: true, canReply: true, actions: [] },
    { id: 'n3', pkg: 'app.gmail', kind: 'email', title: 'Permit office', text: 'Your review comments are ready', person: '', convo: '', group: false, time: now - 52 * MIN, live: true, canReply: false, actions: ['Archive'] }
  ];
  var media = { pkg: 'app.youtubemusic', title: 'Slow piano, side B', artist: 'Example Artist', album: 'Quiet Rooms', duration: 240000, position: 80000, positionAt: now, speed: 1, playing: true,
    art: 'data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#F2B544'/><stop offset='.55' stop-color='#C4551F'/><stop offset='1' stop-color='#3A1458'/></linearGradient></defs><rect width='200' height='200' fill='url(#a)'/><circle cx='138' cy='70' r='34' fill='#FBE7C6' opacity='.85'/><path d='M0 150 Q60 112 110 140 T200 128 V200 H0Z' fill='#1E1A3E' opacity='.8'/></svg>") };
  var perms = { notif: true, calendar: true, contacts: true, dnd: true, phone: true, alarms: true, usage: false, isHome: false };
  function at(addDays, h, m) { var d = new Date(); d.setDate(d.getDate() + addDays); d.setHours(h, m, 0, 0); return d.getTime(); }
  function emit(type, data) { setTimeout(function () { window.PAPER && PAPER.onNative(type, data === undefined ? null : data); }, 60); }
  var ev = [
    ['Farmers market', 1, 9, 0, 60, 'Reston Town Center'], ['Call with Sam', 1, 14, 0, 30, ''], ['Dinner at Lucía’s', 1, 19, 30, 120, 'Lucía’s'],
    ['Dentist', 3, 8, 30, 60, ''], ['Gym', 3, 18, 0, 60, ''], ['Lunch with Priya', 4, 12, 30, 60, ''], ['Book club', 6, 19, 0, 90, '']
  ].map(function (e, i) { var s = at(e[1], e[2], e[3]); return { id: 'e' + i, title: e[0], start: s, end: s + e[4] * MIN, allDay: false, loc: e[5], color: i % 3 ? '#3F51B5' : '#C4551F' }; });
  ev.unshift({ id: 'eh', title: 'Holiday', start: at(5, 0, 0), end: at(6, 0, 0), allDay: true, loc: '' });
  var impl = {
    apps: function () { return JSON.stringify(apps); },
    launch: function () { return true; }, appInfo: function () {}, uninstall: function () {},
    notifs: function () { return JSON.stringify(notifs); },
    notifOpen: function () {}, notifAction: function () {},
    notifDismiss: function (id) { notifs = notifs.filter(function (n) { return n.id !== id; }); emit('notifs'); },
    dismissAll: function () { notifs = []; emit('notifs'); },
    notifReply: function (id) { notifs = notifs.filter(function (n) { return n.id !== id; }); emit('notifs'); return true; },
    media: function () { return JSON.stringify(media); },
    mediaCmd: function (c) {
      var at = Date.now(); media.position = Math.min(media.duration, media.position + (media.playing ? at - media.positionAt : 0)); media.positionAt = at;
      if (/^seek:/.test(c)) media.position = +c.slice(5);
      else if (c === 'next' || c === 'prev') { media.position = 0; media.title = c === 'next' ? 'Night drive, side A' : 'Slow piano, side B'; }
      else media.playing = c === 'toggle' ? !media.playing : c !== 'pause';
      emit('media', JSON.stringify(media));
    },
    events: function () { return JSON.stringify(ev); },
    openEvent: function () {}, newEvent: function () { return true; },
    contacts: function () { return '[]'; }, call: function () {}, sms: function () {}, openContact: function () {},
    profile: function () { return '{}'; }, battery: function () { return '{"pct":80,"charging":false}'; }, device: function () { return '{}'; },
    perms: function () { return JSON.stringify(perms); },
    askPerm: function (n) { if (n in perms) perms[n] = true; if (n === 'home') perms.isHome = true; emit('perms'); },
    setHome: function () {}, setDnd: function () { return true; }, torch: function () { return true; },
    timer: function () { return true; }, alarm: function () { return true; }, remind: function () { return true; }, cancelRemind: function () { return true; },
    usage: function () { return '{"ok":false}'; }, camera: function () { return true; },
    web: function () {}, url: function () {}, maps: function () {}, settings: function () {}, shade: function () {},
    copy: function () { return true; }, haptic: function () {}, shareFile: function () { return true; },
    ready: function () {},
    updateInfo: function () { return '{"app":"0.1.0","live":false,"pageAt":0,"pageSha":"","onLive":false}'; },
    checkUpdate: function (w) { emit('update', JSON.stringify(w === 'page' ? { kind: 'page', state: 'current' } : { kind: 'app', state: 'current', version: '0.1.0', latest: '0.1.0' })); },
    installUpdate: function () {}, applyPage: function () {}, resetPage: function () {},
    version: function () { return '0.1.0'; }
  };
  var out = { __mock: true };
  Object.keys(ARITY).forEach(function (k) {
    if (!impl[k]) throw new Error('mock is missing ' + k);
    out[k] = function () {
      if (arguments.length !== ARITY[k]) throw new Error('PaperNative.' + k + ' takes ' + ARITY[k] + ' argument(s), got ' + arguments.length);
      return impl[k].apply(null, arguments);
    };
  });
  return out;
})();
