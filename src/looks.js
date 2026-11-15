  // ------------------------------------------------------------------ looks: SHELL layout, app icons, folder icons
  // S.theme.layout: 'paper' (default) | 'shell'  — SHELL's ledger layout: mono everything, a mono header block, a thin stacked clock.
  // S.theme.icons:  'off' (default) | 'color' | 'tint'  — small app icons beside names on Home.
  // S.theme.ficons: 'off' (default) | 'filled' | 'line' — a generic icon beside each folder's name; each folder keeps its own {g, c}.
  const FICONS = {
    coin: '<circle cx="12" cy="12" r="7"/><path d="M14.5 9.5c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.7-2.5 1.8 0 2.6 5 1.4 5 4 0 1.1-1.1 1.9-2.5 1.9-1.2 0-2.2-.5-2.6-1.4M12 6.8v1.5M12 15.8v1.4"/>',
    heart: '<path d="M12 18.5s-6.5-4-6.5-8.6A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.5 1.7c0 4.6-6.5 8.6-6.5 8.6z"/>',
    people: '<circle cx="9" cy="9.5" r="2.6"/><path d="M4.5 18c.4-2.6 2.2-4 4.5-4s4.1 1.4 4.5 4"/><circle cx="16" cy="9" r="2.2"/><path d="M15.5 13.2c2 0 3.6 1.2 4 3.8"/>',
    spark: '<path d="M12 4.5c.6 4 2.9 6.4 7 7-4.1.6-6.4 3-7 7-.6-4-2.9-6.4-7-7 4.1-.6 6.4-3 7-7z"/>',
    phones: '<path d="M5.5 13.5v-1a6.5 6.5 0 0 1 13 0v1"/><rect x="4.5" y="13.5" width="3.5" height="5" rx="1.2"/><rect x="16" y="13.5" width="3.5" height="5" rx="1.2"/>',
    film: '<rect x="4.5" y="5.5" width="15" height="13" rx="2"/><path d="M8.5 5.5v13M15.5 5.5v13M4.5 9.5h4M4.5 14.5h4M15.5 9.5h4M15.5 14.5h4"/>',
    brief: '<rect x="4.5" y="8" width="15" height="10.5" rx="2"/><path d="M9.5 8V6.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V8M4.5 12.5h15"/>',
    shield: '<path d="M12 4.5 18.5 7v4.5c0 3.8-2.8 6.4-6.5 7.5-3.7-1.1-6.5-3.7-6.5-7.5V7z"/>',
    cart: '<path d="M4.5 5.5h2l1.6 9h9l1.5-6.5H7.4"/><circle cx="9.5" cy="18" r="1.1"/><circle cx="16" cy="18" r="1.1"/>',
    plane: '<path d="M10.5 13.5 5 12l1-1.5 5 .3 3.6-4.2a1.3 1.3 0 0 1 1.9 1.8L12.4 12l.4 5-1.5 1-1.6-5.4z"/>',
    game: '<rect x="4.5" y="8" width="15" height="9" rx="4.5"/><path d="M8.5 11v3M7 12.5h3"/><circle cx="15.5" cy="12.5" r=".8"/>',
    book: '<path d="M5.5 6.5c2.3-.9 4.6-.9 6.5.5v11c-1.9-1.4-4.2-1.4-6.5-.5zM18.5 6.5c-2.3-.9-4.6-.9-6.5.5v11c1.9-1.4 4.2-1.4 6.5-.5z"/>',
    pulse: '<path d="M4.5 12.5h3.5l2-4.5 3.5 8 2-3.5h4"/>',
    leaf: '<path d="M6 18c0-7 4.5-11.5 12-12-.4 7.5-5 12-12 12zM6 18l6-6"/>',
    home: '<path d="M5.5 11 12 5.5l6.5 5.5v7.5h-4.5v-4.5h-4v4.5H5.5z"/>',
    cup: '<path d="M6 9.5h10v4.5a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4zM16 11h1.2a2 2 0 0 1 0 4H16M9 4.5v2.5M12 4.5v2.5"/>',
    star: '<path d="m12 5 2.1 4.4 4.8.6-3.5 3.3.9 4.7L12 15.8 7.7 18l.9-4.7-3.5-3.3 4.8-.6z"/>',
    tool: '<path d="M14.5 5.5a3.5 3.5 0 0 0-3.8 4.6L5.5 15.3a1.6 1.6 0 0 0 2.2 2.2l5.2-5.2a3.5 3.5 0 0 0 4.6-3.8l-2 2-2-.5-.5-2z"/>',
    cal: '<rect x="5" y="6" width="14" height="13" rx="2"/><path d="M5 10h14M9 4.5v3M15 4.5v3"/>',
    bolt: '<path d="M13 4.5 6.5 13H12l-1 6.5L17.5 11H12z"/>',
    chat: '<path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-3.5 3v-3A1.5 1.5 0 0 1 5 14.5z"/>',
    cam: '<rect x="4.5" y="7.5" width="15" height="11" rx="2.5"/><circle cx="12" cy="13" r="3"/><path d="M9 7.5 10 5.5h4l1 2"/>',
    note: '<path d="M10 17V7l8-1.5v10"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="15.5" r="2"/>',
    globe: '<circle cx="12" cy="12" r="7"/><path d="M5 12h14M12 5c2.2 2.4 2.2 11.6 0 14M12 5c-2.2 2.4-2.2 11.6 0 14"/>'
  };
  const FPAL = [['Clay', '#C4551F'], ['Coral', '#E5484D'], ['Pink', '#D6409F'], ['Grape', '#8E4EC6'], ['Indigo', '#3E63DD'], ['Sky', '#0090FF'],
    ['Teal', '#12A594'], ['Green', '#30A46C'], ['Lime', '#7DA82B'], ['Amber', '#E2A336'], ['Brown', '#8F6E4E'], ['Ink', '']];   // Ink = the theme's text color
  const FGUESS = [[/financ|bank|money|pay|budget/, 'coin', '#30A46C'], [/dat|love/, 'heart', '#E5484D'], [/social|friend/, 'people', '#3E63DD'], [/\bai\b|^ai$|bot|gpt/, 'spark', '#C4551F'],
    [/audio|music|podcast|sound/, 'phones', '#8E4EC6'], [/media|video|photo|watch|tv/, 'film', '#D6409F'], [/work|office|job/, 'brief', '#8F6E4E'], [/proton|secur|privacy|vault/, 'shield', '#3E63DD'],
    [/shop|store|buy/, 'cart', '#E2A336'], [/travel|trip|fly/, 'plane', '#0090FF'], [/game|play/, 'game', '#8E4EC6'], [/read|book|news/, 'book', '#8F6E4E'], [/health|fit|gym/, 'pulse', '#E5484D'],
    [/home|house/, 'home', '#12A594'], [/food|eat|coffee/, 'cup', '#8F6E4E'], [/tool|util/, 'tool', '#3A3936'], [/cal|plan/, 'cal', '#0090FF'], [/chat|message/, 'chat', '#0090FF']];
  function folderIconOf(f) {
    if (f.icon && FICONS[f.icon.g]) return f.icon;
    const n = String(f.name || '').toLowerCase(), hit = FGUESS.find((x) => x[0].test(n));
    if (hit) return { g: hit[1], c: hit[2] };
    let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) % 997;
    return { g: 'star', c: FPAL[h % 11][1] };
  }
  function ficonHTML(ic, size, style) {
    const col = ic.c || 'var(--ink)', g = FICONS[ic.g] || FICONS.star;
    if (style === 'line') return '<span class="ficon line" aria-hidden="true" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="stroke:' + col + '">' + g + '</svg></span>';
    const s = Math.round(size * 0.7);
    return '<span class="ficon" aria-hidden="true" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + Math.round(size * 0.3) + 'px;background:' + col + '"><svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="stroke:' + (ic.c ? '#FFFFFF' : 'var(--bg)') + '">' + g + '</svg></span>';
  }
  const folderIcon = (f, size) => (S.theme.ficons === 'filled' || S.theme.ficons === 'line' ? ficonHTML(folderIconOf(f), size || 22, S.theme.ficons) : '');

  // Small app icons on Home. Tinted = the real icon redrawn in the theme's two colors (an SVG duotone filter).
  const homeIcon = (key) => {
    if (S.theme.icons !== 'color' && S.theme.icons !== 'tint') return '';
    const a = byKey.get(key) || { label: '?' };
    return '<span class="hic' + (S.theme.icons === 'tint' ? ' tint' : '') + '">' + appIcon(a) + '</span>';
  };
  function updateDuo(c) {
    const lo = rgbOf(c.ink), mid = rgbOf(mix(c.ink, c.bg, 0.55)), hi = rgbOf(c.bg);
    ['R', 'G', 'B'].forEach((ch, i) => { const f = document.getElementById('duo' + ch); if (f) f.setAttribute('tableValues', [lo[i], lo[i], mid[i], hi[i]].map((v) => (v / 255).toFixed(3)).join(' ')); });
  }

  // SHELL layout
  function applyLayout() {
    const on = S.theme.layout === 'shell';
    $('#app').classList.toggle('ledger', on);
    if (on && !document.getElementById('font-ledgerclock')) {
      const l = document.createElement('link'); l.id = 'font-ledgerclock'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100&display=swap'; document.head.appendChild(l);
    }
  }
  function ledgerHead(d) {
    const two = (n) => String(n).padStart(2, '0');
    const today = (EVENTS || []).filter((e) => { const t = new Date(e.start); return t.toDateString() === d.toDateString(); }).length;
    const waiting = (NOTIFS || []).length;
    const L = S.theme.live, wx = S.theme.wx === 'real' && L && L.code >= 0 ? '<p>' + (L.temp != null ? L.temp + '°' : '--') + ' / ' + esc(WX_TEXT[L.code] || 'Weather') + '</p>' : '';
    return '<p>Paper [Home]</p><p>' + DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()] + '</p><p class="gap">' + two(today) + ' / Today</p><p>' + two(waiting) + ' / Waiting</p>' + wx;
  }

  // Hold a folder → Icon
  let ficonFolder = -1;
  function openFolderIcon(i) {
    ficonFolder = i; sheetKind = 'ficon';
    if (S.theme.ficons !== 'filled' && S.theme.ficons !== 'line') { S.theme.ficons = 'filled'; save(); renderFolders(); }
    const f = S.folders[i];
    openSheet('<div class="fihead"><span id="fiPrev"></span><div><h2 style="margin:0">' + esc(f.name) + '</h2><p class="hint" style="margin:2px 0 0">Folder icon</p></div></div>' +
      '<div class="grp"><p class="mono">Style · every folder</p><div class="seg3"><button class="btn sm" data-fis="filled">Filled</button><button class="btn sm" data-fis="line">Line</button><button class="btn sm" data-fis="off">None</button></div></div>' +
      '<div class="grp"><p class="mono">Color</p><div class="fpal">' + FPAL.map(([n, c]) => '<button class="fsw" data-fic="' + n + '" aria-label="' + n + '" style="background:' + (c || 'var(--ink)') + '"></button>').join('') + '</div></div>' +
      '<div class="grp"><p class="mono">Icon</p><div class="fgrid">' + Object.keys(FICONS).map((g) => '<button class="fg" data-fig="' + g + '" aria-label="' + g + '"></button>').join('') + '</div></div>');
    markFolderIcon();
  }
  function markFolderIcon() {
    if (sheetKind !== 'ficon' || !S.folders[ficonFolder]) return;
    const ic = folderIconOf(S.folders[ficonFolder]), style = S.theme.ficons === 'line' ? 'line' : 'filled';
    $('#fiPrev').innerHTML = ficonHTML(ic, 48, style);
    document.querySelectorAll('#sbody [data-fis]').forEach((b) => b.classList.toggle('on', b.dataset.fis === (S.theme.ficons || 'off')));
    document.querySelectorAll('#sbody [data-fic]').forEach((b) => { const c = (FPAL.find((p) => p[0] === b.dataset.fic) || [])[1]; b.classList.toggle('on', (c || '') === (ic.c || '')); });
    document.querySelectorAll('#sbody [data-fig]').forEach((b) => { b.innerHTML = ficonHTML({ g: b.dataset.fig, c: ic.c }, 30, style); b.classList.toggle('on', b.dataset.fig === ic.g); });
  }
  function setFolderIcon(patch) {
    const f = S.folders[ficonFolder]; if (!f) return;
    f.icon = Object.assign({}, folderIconOf(f), patch); save(); renderFolders(); markFolderIcon(); haptic('tick');
  }
