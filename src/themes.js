  // ------------------------------------------------------------------ themes (hidden folder: search "themes")
  // A theme = a color (flat, one-hue, loud, gradient or a time-of-day sky) + an optional pattern drawn over it.
  // Everything on screen reads CSS variables derived here from three inputs: background, ink, accent.
  const rgbOf = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const toHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgbOf(a), y = rgbOf(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = (h) => { const [r, g, b] = rgbOf(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hsl = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return toHex([f(0) * 255, f(8) * 255, f(4) * 255]); };

  const TH = [];
  const T = (g, id, n, bg, ink, acc, grad, ang) => TH.push({ g, id, n, bg: bg || grad[Math.floor(grad.length / 2)], ink, acc, grad, ang });
  // palettes
  T('pal', 'paper', 'Paper', '#ECE9E2', '#171614', '#C4551F');
  T('pal', 'sage', 'Sage', '#DDE5D8', '#1B2A1E', '#B5532A');
  T('pal', 'sand', 'Sand', '#EADFC8', '#2A2114', '#1F6F6B');
  T('pal', 'blush', 'Blush', '#F1DCD9', '#2B1517', '#3B4FBF');
  T('pal', 'sky', 'Sky', '#D8E6F2', '#10202E', '#D2552B');
  T('pal', 'lilac', 'Lilac', '#E4DCF2', '#1E1630', '#C2410C');
  T('pal', 'butter', 'Butter', '#F5E9B8', '#2A2408', '#1D4ED8');
  T('pal', 'mint', 'Mint', '#D5F0E3', '#0E2A1F', '#C2410C');
  T('pal', 'peach', 'Peach', '#F6D9C4', '#2B160C', '#0F766E');
  T('pal', 'news', 'Newsprint', '#F2F2EE', '#111111', '#E11D48');
  T('pal', 'ink', 'Ink', '#121110', '#F2EEE6', '#FF7A45');
  T('pal', 'lapis', 'Lapis', '#16207A', '#EFE8D8', '#F2B544');
  T('pal', 'forest', 'Forest', '#0F2A1E', '#E6F0E4', '#F2B544');
  T('pal', 'oxblood', 'Oxblood', '#3A0D12', '#F5E3DC', '#F2B544');
  T('pal', 'plum', 'Plum', '#2A1433', '#F0E4F5', '#FF8A5B');
  T('pal', 'midnight', 'Midnight', '#0B1426', '#E3ECF7', '#7CC4FF');
  T('pal', 'espresso', 'Espresso', '#2A1C14', '#F1E6D8', '#E8A66B');
  T('pal', 'slate', 'Slate', '#1F2937', '#E5E7EB', '#F59E0B');
  T('pal', 'arcade', 'Arcade', '#0D0221', '#F6F1FF', '#FF2E97');
  T('pal', 'terminal', 'Terminal', '#06140A', '#8EF5A8', '#C8F169');
  T('pal', 'blueprint', 'Blueprint', '#1B4A9C', '#F2F6FF', '#FFD84A');
  T('pal', 'void', 'Void', '#000000', '#EDEDED', '#FF453A');
  // one color all the way through: light and dark of each hue
  [['Red', 5], ['Orange', 26], ['Gold', 45], ['Green', 135], ['Teal', 175], ['Blue', 212], ['Indigo', 245], ['Purple', 278], ['Pink', 330]].forEach(([n, h]) => {
    T('mono', 'm-' + n.toLowerCase(), n, hsl(h, 48, 88), hsl(h, 60, 13), hsl(h, 62, 36));
    T('mono', 'd-' + n.toLowerCase(), n + ' dark', hsl(h, 50, 11), hsl(h, 55, 86), hsl(h, 75, 66));
  });
  // loud: one saturated color, edge to edge
  T('loud', 'cobalt', 'Cobalt', '#2438E0', '#FFFFFF', '#FFD84A');
  T('loud', 'emerald', 'Emerald', '#0B6E4F', '#FFFFFF', '#FFD84A');
  T('loud', 'violet', 'Violet', '#5B21B6', '#FFFFFF', '#FFB86B');
  T('loud', 'magenta', 'Magenta', '#A21359', '#FFFFFF', '#FFD84A');
  T('loud', 'cherry', 'Cherry', '#C4162F', '#FFFFFF', '#FFE08A');
  T('loud', 'sun', 'Sun', '#FFD23F', '#1A1400', '#1D4ED8');
  T('loud', 'tangerine', 'Tangerine', '#FF8A1F', '#1F0E00', '#1B2A9A');
  T('loud', 'hotpink', 'Hot pink', '#FF6FAE', '#2B0015', '#1B2A9A');
  T('loud', 'lime', 'Lime', '#C8F169', '#142000', '#5B21B6');
  T('loud', 'aqua', 'Aqua', '#5FE0D0', '#00201C', '#A21359');
  // gradients: a color at the top falling into the dark, with grain
  T('grad', 'g-ember', 'Ember', null, '#F6E9DF', '#FFB86B', ['#8F3F1E', '#3A190D', '#0F0A08', '#0B0A0A']);
  T('grad', 'g-plum', 'Plumfade', null, '#F0E4F5', '#FF8A5B', ['#4A2A5E', '#1F1229', '#0A0A0E']);
  T('grad', 'g-moss', 'Moss', null, '#E6F0E4', '#F2B544', ['#2F5D3A', '#12251B', '#0A0D0B']);
  T('grad', 'g-ice', 'Ice', null, '#E3F0F7', '#7CE0FF', ['#1F5C7A', '#0C202D', '#07090C']);
  T('grad', 'g-blood', 'Blood', null, '#F5E3DC', '#FFB86B', ['#7A1420', '#27090C', '#0A0808']);
  T('grad', 'g-gold', 'Gold', null, '#F5ECD8', '#FFD84A', ['#7A5A12', '#261D08', '#0B0A08']);
  T('grad', 'g-rose', 'Rose', null, '#F7E4EC', '#FFB86B', ['#8A2F55', '#2A111C', '#0B0909']);
  T('grad', 'g-lapis', 'Deep lapis', null, '#EFE8D8', '#F2B544', ['#1B2A9A', '#0E1448', '#06081A']);
  T('grad', 'g-aurora', 'Aurora', null, '#E9F5F2', '#C8F169', ['#0E5E5A', '#1B2A6E', '#3A1458'], 160);
  T('grad', 'g-smoke', 'Smoke', null, '#EDEDED', '#FF7A45', ['#3A3A3A', '#161616', '#000000']);
  T('grad', 'g-sunrise', 'Sunrise', null, '#2A1C14', '#C2410C', ['#FAD9C0', '#F6E7C8', '#DDE9F2']);
  T('grad', 'g-sherbet', 'Sherbet', null, '#2B1520', '#3B4FBF', ['#FFD6E0', '#FFE9C7', '#D9F2E4']);
  T('grad', 'g-haze', 'Haze', null, '#1E1A2E', '#C2410C', ['#E6E0F5', '#DCE9F5', '#EEF2E6']);
  T('grad', 'g-dune', 'Dune', null, '#2A2114', '#1F6F6B', ['#F3E3C8', '#EAD3B2', '#E4C9A6']);
  // the sky by time of day
  T('sun', 'sun-dawn', 'Dawn', null, '#2A1C24', '#C2410C', ['#F6C9B8', '#F3DCCB', '#DCD9EC', '#C9D6EC']);
  T('sun', 'sun-day', 'Day', null, '#13202B', '#C4551F', ['#BFDDF5', '#DDEBF3', '#F1EEE4']);
  T('sun', 'sun-dusk', 'Dusk', null, '#F6E9DF', '#FFB86B', ['#1E1A3E', '#4A2452', '#8E3B3B', '#2A1620']);
  T('sun', 'sun-night', 'Night', null, '#E6EAF5', '#8FB8FF', ['#0A1030', '#070B1E', '#04050C']);
  // SHELL's themes, as in SHELL: the accent at the top falling through a darker accent into black, a grey band at the very bottom, grain.
  // Text is judged against the top three (the grey band holds only the dots and the frosted dock, which go dark on these themes).
  [['ember', '#b65424', '#7d3716'], ['mono', '#0a0a0a', '#0a0a0a'], ['dusk', '#5a4a8c', '#33295a'], ['moss', '#566a35', '#303d1d'], ['ice', '#3f6f8c', '#234458'],
    ['blood', '#8f2222', '#571212'], ['gold', '#8f6b14', '#5a430c'], ['rose', '#a8546c', '#6a3042'], ['void', '#0a0a0a', '#0a0a0a', '#0d0d0d', '#161616']].forEach(([id, a, a2, g2, g]) => {
    if (ratio(a, '#f5f3ef') < 4.6) a = mix(a, '#000000', 0.07);   // ember and gold sit just under 4.5:1 with SHELL's ink; a hair darker
    T('shell', 's-' + id, id.charAt(0).toUpperCase() + id.slice(1), '#0a0a0a', '#f5f3ef', id === 'mono' || id === 'void' ? '#d9d6cf' : mix(a, '#ffffff', 0.38), [a, a, a2, '#0a0a0a', '#0a0a0a', g2 || '#8d8d8a', g || '#aaaaa6']);
    const c = TH[TH.length - 1]; c.pos = [0, 14, 36, 55, 74, 90, 100]; c.text = [a, a2, '#0a0a0a']; c.shell = true;
  });
  // One color per page: Calendar, Home, Folders. The background slides from one to the next as you swipe.
  [['tri-neapolitan', 'Neapolitan', ['#F3D3D8', '#F6EEDF', '#E2CDB9'], '#2A1A14', '#B5532A'],
    ['tri-fruit', 'Fruit', ['#FFD6C2', '#FFF0B3', '#D5F0C6'], '#1F1A10', '#C2410C'],
    ['tri-pastel', 'Pastel', ['#DCE5FF', '#EFE3FF', '#D8F3E8'], '#161A2E', '#C2410C'],
    ['tri-earth', 'Earth', ['#E9D3C4', '#EADFC8', '#D9E2D3'], '#22201A', '#1F6F6B'],
    ['tri-sea', 'Sea', ['#CDE8F0', '#E4F1EC', '#D3DDF2'], '#0E1E28', '#D2552B'],
    ['tri-loud', 'Loud three', ['#2438E0', '#A21359', '#0B6E4F'], '#FFFFFF', '#FFD84A'],
    ['tri-night', 'Night three', ['#0B1426', '#2A1433', '#0F2A1E'], '#EDE8F5', '#F2B544'],
    ['tri-shell', 'SHELL three', ['#7d3716', '#33295a', '#303d1d'], '#f5f3ef', '#F2B544'],
    ['tri-candy', 'Candy', ['#FF8FB8', '#FFD23F', '#5FE0D0'], '#1A0E14', '#3B2A9A']].forEach(([id, n, P, ink, acc]) => {
    T('tri', id, n, P[1], ink, acc); TH[TH.length - 1].pages = P;
  });

  function derive(c) {
    const stops = c.text || c.pages || c.grad || [c.bg];
    const worst = stops.reduce((w, s) => (ratio(c.ink, s) < ratio(c.ink, w) ? s : w), stops[0]);
    let t = 0.42, ink2 = c.ink;
    do { ink2 = mix(c.ink, worst, Math.max(0, t)); t -= 0.04; } while (ratio(ink2, worst) < 4.6 && t > -0.05);
    const dark = lum(c.bg) < 0.3;
    const onAcc = ratio(c.acc, '#141312') > ratio(c.acc, '#FFFFFF') ? '#141312' : '#FFFFFF';
    return {
      dark, ink2,
      inkMin: Math.min(...stops.map((s) => ratio(c.ink, s))), ink2Min: Math.min(...stops.map((s) => ratio(ink2, s))),
      vars: {
        '--bg': c.bg, '--bgRGB': rgbOf(c.bg).join(','), '--ink': c.ink, '--inkRGB': rgbOf(c.ink).join(','), '--ink2': ink2, '--acc': c.acc, '--onAcc': onAcc,
        '--card': dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.5)',
        '--pop': dark ? mix(c.bg, '#FFFFFF', 0.14) : mix(c.bg, '#FFFFFF', 0.72),
        '--sheet': dark ? mix(c.bg, '#FFFFFF', 0.08) : mix(c.bg, '#FFFFFF', 0.45),
        '--glass': c.shell ? 'rgba(14,14,14,.62)' : dark ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.58)',
        '--glassEdge': dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.75)',
        '--chipGlass': dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.65)',
        '--card': c.shell ? 'rgba(20,20,20,.72)' : dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.5)',
        '--red': dark ? '#FF7B6E' : '#B42318'
      }
    };
  }

  // ---- patterns: small seamless SVG tiles, drawn in the theme's ink (and accent) at low strength
  const rng = (seed) => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const n1 = (v) => Math.round(v * 10) / 10;
  const stroke = (d, w) => "<path d='" + d + "' fill='none' stroke='{c}' stroke-width='" + (w || 1.4) + "' stroke-linecap='round' stroke-linejoin='round'/>";
  const PATS = [
    ['none', 'None', null],
    ['wedges', 'Tablet', () => {   // wedge-and-line marks set in rows, like writing pressed into clay
      const r = rng(11), o = [];
      const Hh = (x, y, l) => o.push('M' + n1(x) + ' ' + n1(y - 3.5) + 'L' + n1(x + 6.5) + ' ' + n1(y) + 'L' + n1(x) + ' ' + n1(y + 3.5) + 'ZM' + n1(x + 6.5) + ' ' + n1(y) + 'H' + n1(x + l));
      const Vv = (x, y, l) => o.push('M' + n1(x - 3.5) + ' ' + n1(y) + 'L' + n1(x) + ' ' + n1(y + 6.5) + 'L' + n1(x + 3.5) + ' ' + n1(y) + 'ZM' + n1(x) + ' ' + n1(y + 6.5) + 'V' + n1(y + l));
      const Cc = (x, y) => o.push('M' + n1(x + 7) + ' ' + n1(y - 6.5) + 'L' + n1(x) + ' ' + n1(y) + 'L' + n1(x + 7) + ' ' + n1(y + 6.5));
      for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
        const x = col * 58 + 8 + r() * 4, y = row * 54 + 8 + r() * 3, k = Math.floor(r() * 5);
        if (k === 0) { const nh = 2 + Math.floor(r() * 3); for (let i = 0; i < nh; i++) Hh(x, y + 5 + i * 9, 26 + r() * 10); Vv(x + 12 + r() * 14, y, 34); }
        else if (k === 1) { const nv = 2 + Math.floor(r() * 2); for (let i = 0; i < nv; i++) Vv(x + 6 + i * 11, y + 3, 30); Hh(x, y + 4 + r() * 26, 34); }
        else if (k === 2) { const nc = 1 + Math.floor(r() * 3); for (let i = 0; i < nc; i++) Cc(x + i * 8, y + 18); Hh(x + nc * 8 + 3, y + 18, 16); if (r() < 0.6) Vv(x + nc * 8 + 12, y + 2, 30); }
        else if (k === 3) { Hh(x, y + 8, 30); Hh(x, y + 26, 30); Vv(x + 9, y, 36); Vv(x + 23, y, 36); }
        else { Vv(x + 4, y + 2, 32); Vv(x + 15, y + 2, 32); Vv(x + 26, y + 2, 32); Hh(x - 2, y + 18, 38); }
      }
      return { w: 232, h: 216, body: stroke(o.join(''), 1.3) };
    }],
    ['dots', 'Dots', () => ({ w: 22, h: 22, body: "<circle cx='11' cy='11' r='1.7' fill='{c}'/>" })],
    ['grid', 'Graph', () => ({ w: 24, h: 24, body: stroke('M24 0V24H0', 1) })],
    ['blueprint', 'Blueprint', () => ({ w: 120, h: 120, body: stroke('M24 0V120M48 0V120M72 0V120M96 0V120M0 24H120M0 48H120M0 72H120M0 96H120', 0.6) + stroke('M120 0V120H0', 1.6) + stroke('M56 60H64M60 56V64', 1.2) })],
    ['hatch', 'Hatch', () => ({ w: 14, h: 14, body: stroke('M-2 2L2 -2M0 14L14 0M12 16L16 12', 1.2) })],
    ['ripples', 'Ripples', () => ({ w: 48, h: 18, body: stroke('M0 9Q12 0 24 9T48 9', 1.3) })],
    ['dunes', 'Dunes', () => {
      const o = [];
      for (let k = 0; k < 12; k++) { let d = ''; for (let x = 0; x <= 480; x += 12) { const y = k * 22 + 11 + 7 * Math.sin(2 * Math.PI * x / 480 + k * 0.9) + 4 * Math.sin(4 * Math.PI * x / 480 + k * 1.7); d += (x ? 'L' : 'M') + x + ' ' + n1(y); } o.push(d); }
      return { w: 480, h: 264, body: stroke(o.join(''), 1.2) };
    }],
    ['stars', 'Stars', () => {
      const r = rng(5), o = []; let dots = '';
      for (let i = 0; i < 14; i++) { const x = n1(14 + r() * 192), y = n1(14 + r() * 192), s = n1(3 + r() * 6); o.push('M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'Z'); }
      for (let i = 0; i < 22; i++) dots += "<circle cx='" + n1(6 + r() * 208) + "' cy='" + n1(6 + r() * 208) + "' r='" + n1(0.6 + r() * 0.8) + "' fill='{c}'/>";
      return { w: 220, h: 220, body: "<path d='" + o.join('') + "' fill='{c}'/>" + dots };
    }],
    ['terrazzo', 'Terrazzo', () => {
      const r = rng(23); let o = '';
      for (let i = 0; i < 30; i++) {
        const cx = 18 + r() * 204, cy = 18 + r() * 204, n = 4 + Math.floor(r() * 2), R0 = 5 + r() * 9, a0 = r() * 6.28; let d = '';
        for (let k = 0; k < n; k++) { const a = a0 + k * 6.28 / n + (r() - 0.5) * 0.6, rr = R0 * (0.65 + r() * 0.5); d += (k ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ' ' + n1(cy + Math.sin(a) * rr); }
        o += "<path d='" + d + "Z' fill='" + (i % 3 === 0 ? '{a}' : '{c}') + "' opacity='" + n1(0.5 + r() * 0.5) + "'/>";
      }
      return { w: 240, h: 240, body: o, k: 0.8 };
    }],
    ['maze', 'Maze', () => { const r = rng(3), o = []; for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) o.push(r() < 0.5 ? 'M' + x * 16 + ' ' + (y * 16 + 16) + 'L' + (x * 16 + 16) + ' ' + y * 16 : 'M' + x * 16 + ' ' + y * 16 + 'L' + (x * 16 + 16) + ' ' + (y * 16 + 16)); return { w: 96, h: 96, body: stroke(o.join(''), 1.5) }; }],
    ['crosses', 'Crosses', () => ({ w: 36, h: 36, body: stroke('M14 18H22M18 14V22M-4 0H4M0 -4V4M32 0H40M36 -4V4M-4 36H4M0 32V40M32 36H40M36 32V40', 1.4) })],
    ['confetti', 'Confetti', () => { const r = rng(9); let o = ''; for (let i = 0; i < 30; i++) { const x = 12 + r() * 176, y = 12 + r() * 176, a = r() * 6.28; o += "<path d='M" + n1(x) + ' ' + n1(y) + 'l' + n1(Math.cos(a) * 8) + ' ' + n1(Math.sin(a) * 8) + "' stroke='" + (i % 2 ? '{a}' : '{c}') + "' stroke-width='3' stroke-linecap='round'/>"; } return { w: 200, h: 200, body: o }; }],
    ['memphis', 'Memphis', () => {
      const r = rng(41); let o = '';
      for (let i = 0; i < 15; i++) {
        const x = n1(14 + r() * 206), y = n1(20 + r() * 220), col = i % 2 ? '{a}' : '{c}', k = Math.floor(r() * 5), s = "' fill='none' stroke='" + col + "' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/>";
        if (k === 0) o += "<path d='M" + x + ' ' + y + 'q5 -9 10 0t10 0t10 0' + s;
        else if (k === 1) o += "<path d='M" + x + ' ' + y + 'l14 0l-7 -12z' + s;
        else if (k === 2) o += "<circle cx='" + x + "' cy='" + y + "' r='6" + s;
        else if (k === 3) o += "<path d='M" + x + ' ' + y + 'l6 -8l6 8l6 -8l6 8' + s;
        else o += "<circle cx='" + x + "' cy='" + y + "' r='2.2' fill='" + col + "'/><circle cx='" + (x + 9) + "' cy='" + y + "' r='2.2' fill='" + col + "'/><circle cx='" + (x + 18) + "' cy='" + y + "' r='2.2' fill='" + col + "'/>";
      }
      return { w: 260, h: 260, body: o };
    }],
    ['stripes', 'Stripes', () => ({ w: 36, h: 36, body: "<rect width='18' height='36' fill='{c}'/>", k: 0.5 })],
    ['scan', 'Scanlines', () => ({ w: 6, h: 3, body: "<rect y='2' width='6' height='1' fill='#000'/>", k: 2.2 })],
    ['gingham', 'Gingham', () => ({ w: 32, h: 32, body: "<rect width='16' height='32' fill='{c}'/><rect width='32' height='16' fill='{c}'/>", k: 0.4 })]
  ];
  const patCache = {};
  function patURL(id, ink, acc, alpha) {
    const p = PATS.find((x) => x[0] === id); if (!p || !p[2]) return '';
    const t = patCache[id] || (patCache[id] = p[2]());
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + t.w + "' height='" + t.h + "' viewBox='0 0 " + t.w + ' ' + t.h + "'><g opacity='" + n1(alpha * (t.k || 1) * 100) / 100 + "'>" + t.body.replace(/\{c\}/g, ink).replace(/\{a\}/g, acc) + '</g></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  const GRAIN = 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='220' height='220' filter='url(#n)' opacity='.55'/></svg>") + '")';
  const STRENGTH = { soft: 0.11, bold: 0.3 };
  const gradCSS = (c) => (c.grad ? 'linear-gradient(' + (c.ang || 180) + 'deg,' + c.grad.map((g, i) => g + (c.pos ? ' ' + c.pos[i] + '%' : '')).join(',') + ')'
    : c.pages ? 'linear-gradient(90deg,' + c.pages[0] + ' 0 33.4%,' + c.pages[1] + ' 33.4% 66.6%,' + c.pages[2] + ' 66.6%)' : c.bg);

  // ---- the sun: sunrise and sunset for Reston, VA, so the sky themes can follow the day
  function sunUT(d, lat, lon, rise) {
    const D = Math.PI / 180, N1 = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
    const lh = lon / 15, t = N1 + ((rise ? 6 : 18) - lh) / 24, M = 0.9856 * t - 3.289;
    let L = (M + 1.916 * Math.sin(M * D) + 0.02 * Math.sin(2 * M * D) + 282.634) % 360; if (L < 0) L += 360;
    let RA = Math.atan(0.91764 * Math.tan(L * D)) / D; RA = (RA + 360) % 360; RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90; RA /= 15;
    const sd = 0.39782 * Math.sin(L * D), cd = Math.cos(Math.asin(sd)), cH = (Math.cos(90.833 * D) - sd * Math.sin(lat * D)) / (cd * Math.cos(lat * D));
    if (cH > 1 || cH < -1) return null;
    const Hh = (rise ? 360 - Math.acos(cH) / D : Math.acos(cH) / D) / 15;
    let UT = (Hh + RA - 0.06571 * t - 6.622 - lh) % 24; if (UT < 0) UT += 24;
    return UT;
  }
  function sunTimes(d) {
    const base = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()), r = sunUT(d, 38.9586, -77.357, true), s = sunUT(d, 38.9586, -77.357, false);
    if (r == null || s == null) return null;
    const rise = base + r * 36e5; let set = base + s * 36e5; if (set < rise) set += 864e5;
    return { rise, set };
  }
  function sunPhase(now) {
    const t = sunTimes(new Date(now)), m = 6e4; if (!t) return 'day';
    if (now >= t.rise - 45 * m && now <= t.rise + 60 * m) return 'dawn';
    if (now > t.rise + 60 * m && now < t.set - 60 * m) return 'day';
    if (now >= t.set - 60 * m && now <= t.set + 45 * m) return 'dusk';
    return 'night';
  }

  // ---- applying
  let themeBars = ['rgb(236,233,226)', 'rgb(236,233,226)'], lastPhase = '', PAGEBG = null, lastTint = '';
  // Three-color themes: the wall follows the page you're on, blending as you swipe (called from paint()).
  function pageTint(h) {
    if (!PAGEBG) return;
    const v = wide() ? 0 : Math.max(-1, Math.min(1, h)), col = v < 0 ? mix(PAGEBG[1], PAGEBG[0], -v) : mix(PAGEBG[1], PAGEBG[2], v);
    if (col === lastTint) return; lastTint = col;
    $('#wall').style.backgroundColor = col; document.body.style.background = col;
    const r = 'rgb(' + rgbOf(col).join(',') + ')'; themeBars = [r, r];
  }
  const themeColor = () => (S.theme.auto ? TH.find((c) => c.id === 'sun-' + sunPhase(Date.now())) : TH.find((c) => c.id === S.theme.color)) || TH[0];
  function applyTheme(animate) {
    const c = themeColor(), d = derive(c), st = document.documentElement.style, wall = $('#wall'), old = $('#wallOld');
    if (animate) {
      ['backgroundColor', 'backgroundImage', 'backgroundBlendMode'].forEach((k) => { old.style[k] = wall.style[k]; });
      old.style.transition = 'none'; old.style.opacity = '1'; void old.offsetWidth; old.style.transition = 'opacity .7s ease'; old.style.opacity = '0';
      $('#app').classList.add('theming'); clearTimeout(applyTheme.t); applyTheme.t = setTimeout(() => $('#app').classList.remove('theming'), 720);
    }
    Object.entries(d.vars).forEach(([k, v]) => st.setProperty(k, v));
    const layers = [], blend = [], pat = patURL(S.theme.pat, c.ink, c.acc, STRENGTH[S.theme.str] || STRENGTH.soft);
    if (pat) { layers.push(pat); blend.push('normal'); }
    if (c.grad) { layers.push(GRAIN, gradCSS(c)); blend.push('overlay', 'normal'); }
    $('#app').classList.toggle('patterned', !!pat);
    $('#app').classList.toggle('shellish', !!c.shell);
    wall.style.backgroundColor = c.bg; wall.style.backgroundImage = layers.join(',') || 'none'; wall.style.backgroundBlendMode = blend.join(',') || 'normal';
    document.body.style.background = c.bg;
    const rgb = (h) => 'rgb(' + rgbOf(h).join(',') + ')';
    themeBars = c.grad ? [rgb(c.grad[0]), rgb(c.grad[c.grad.length - 1])] : [rgb(c.bg), rgb(c.bg)];
    lastPhase = S.theme.auto ? sunPhase(Date.now()) : '';
    wxColor = null;
    PAGEBG = c.pages || null; lastTint = ''; if (PAGEBG) pageTint(typeof hx === 'number' ? hx : 0);
    applyFont(); applyLayout(); updateDuo(c);
  }

  // ---- weather, as on jere.ing: Clear, Rain or Storm, drawn behind everything. "Real" follows Reston's actual weather.
  // The rain only animates while Paper is on screen and nothing full-screen covers it.
  const WX = [['clear', 'Clear'], ['rain', 'Rain'], ['storm', 'Storm'], ['real', 'Real']];
  let wxDrops = [], wxRaf = 0, wxLast = 0, wxBoltAt = 0, wxColor = null, wxKind = '', wxFetching = false;
  const WX_TEXT = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Freezing rain', 71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' };
  const codeKind = (c) => (c >= 95 ? 'storm' : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) ? 'rain' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'snow' : 'clear');
  function liveWeather() {
    const L = S.theme.live;
    if (L && Date.now() - L.at < 30 * 6e4) return L;
    if (!wxFetching) {
      wxFetching = true;
      fetch('https://api.open-meteo.com/v1/forecast?latitude=38.9586&longitude=-77.357&current=weather_code,temperature_2m&temperature_unit=fahrenheit')
        .then((r) => r.json()).then((j) => { const c = j.current; S.theme.live = { at: Date.now(), code: c.weather_code, temp: Math.round(c.temperature_2m) }; save(); })
        .catch(() => { S.theme.live = { at: Date.now() - 25 * 6e4, code: -1 }; })
        .then(() => { wxFetching = false; applyWeather(); markThemes(); });
    }
    return L || null;
  }
  function weatherKind() {
    if (S.theme.wx !== 'real') return S.theme.wx || 'clear';
    const L = liveWeather(); return L && L.code >= 0 ? codeKind(L.code) : 'clear';
  }
  function wxSeed() {
    const cv = $('#wx'), w = innerWidth, h = innerHeight, d = Math.min(2, devicePixelRatio || 1);
    cv.width = w * d; cv.height = h * d; cv.getContext('2d').setTransform(d, 0, 0, d, 0, 0);
    const snow = wxKind === 'snow', n = Math.round(w * h / (wxKind === 'storm' ? 5200 : snow ? 7000 : 9500));
    wxDrops = Array.from({ length: n }, () => ({ x: Math.random() * w * 1.2, y: Math.random() * h, l: 9 + Math.random() * 12, v: snow ? 30 + Math.random() * 50 : 520 + Math.random() * 340, a: 0.35 + Math.random() * 0.65, r: 1 + Math.random() * 2.2, p: Math.random() * 6.28 }));
  }
  function wxFrame(t) {
    wxRaf = 0;
    if (!wxKind || document.hidden || toyOpen) return;
    wxRaf = requestAnimationFrame(wxFrame);
    if (t - wxLast < 30) return;                                 // ~30 fps is plenty for rain and kinder to the battery
    const dt = Math.min(0.05, (t - wxLast) / 1000); wxLast = t;
    const cv = $('#wx'), ctx = cv.getContext('2d'), w = innerWidth, h = innerHeight;
    if (!wxColor) wxColor = cssv('--inkRGB');
    ctx.clearRect(0, 0, w, h);
    if (wxKind === 'snow') {
      ctx.fillStyle = 'rgb(' + wxColor + ')';
      wxDrops.forEach((d) => { d.y += d.v * dt; d.x += Math.sin(t / 900 + d.p) * 12 * dt; if (d.y > h + 4) { d.y = -4; d.x = Math.random() * w; } ctx.globalAlpha = d.a * 0.5; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); });
    } else {
      const slant = wxKind === 'storm' ? 0.28 : 0.16;
      ctx.strokeStyle = 'rgb(' + wxColor + ')'; ctx.lineWidth = 1; ctx.lineCap = 'round';
      wxDrops.forEach((d) => { d.y += d.v * dt; d.x -= d.v * slant * dt; if (d.y > h + 20) { d.y = -20; d.x = Math.random() * w * 1.2; }
        ctx.globalAlpha = d.a * 0.32; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * slant, d.y - d.l); ctx.stroke(); });
      if (wxKind === 'storm' && t > wxBoltAt) {
        if (wxBoltAt) { const b = $('#bolt'); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }
        wxBoltAt = t + 6000 + Math.random() * 12000;
      }
    }
    ctx.globalAlpha = 1;
  }
  function applyWeather() {
    const k = weatherKind(), cv = $('#wx');
    if (k === 'clear') { wxKind = ''; cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; return; }
    cv.style.display = '';
    if (k !== wxKind) { wxKind = k; wxSeed(); wxBoltAt = performance.now() + 2500; }
    if (!wxRaf) { wxLast = performance.now(); wxRaf = requestAnimationFrame(wxFrame); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) applyWeather(); });
  window.addEventListener('resize', () => { if (wxKind) wxSeed(); });

  // ---- fonts
  const FONTS = [
    ['paper', 'Paper', "Inter,system-ui,'Roboto',sans-serif", "'IBM Plex Mono',ui-monospace,monospace", ''],
    ['shell', 'SHELL', "'JetBrains Mono',ui-monospace,monospace", "'JetBrains Mono',ui-monospace,monospace", 'JetBrains+Mono:wght@100;200;300;400;500'],
    ['serif', 'Serif', "Fraunces,Georgia,serif", "'IBM Plex Mono',ui-monospace,monospace", 'Fraunces:opsz,wght@9..144,200;9..144,300;9..144,400;9..144,500'],
    ['editorial', 'Editorial', "'Instrument Serif',Georgia,serif", "'IBM Plex Mono',ui-monospace,monospace", 'Instrument+Serif'],
    ['grotesk', 'Grotesk', "'Space Grotesk',system-ui,sans-serif", "'Space Mono',ui-monospace,monospace", 'Space+Grotesk:wght@300;400;500;600&family=Space+Mono'],
    ['rounded', 'Rounded', "Nunito,system-ui,sans-serif", "'IBM Plex Mono',ui-monospace,monospace", 'Nunito:wght@200;300;400;500;600'],
    ['typewriter', 'Typewriter', "'Courier Prime','Courier New',monospace", "'Courier Prime','Courier New',monospace", 'Courier+Prime:wght@400;700'],
    ['terminal', 'Terminal', "VT323,ui-monospace,monospace", "VT323,ui-monospace,monospace", 'VT323'],
    ['system', 'System', "system-ui,'Roboto',sans-serif", "ui-monospace,'Roboto Mono',monospace", '']
  ];
  // Fonts whose letters run small or large get nudged to the same x-height as Inter, so nothing reflows.
  const FSA = { editorial: 0.56, terminal: 0.56, typewriter: 0.52 };
  // Monospace fonts are wider: Home's app names shrink a little so the two columns never collide.
  const FS = { shell: 0.8, typewriter: 0.82, terminal: 0.9, grotesk: 0.96 };
  function loadFont(f) {
    if (!f[4] || document.getElementById('font-' + f[0])) return;
    const l = document.createElement('link'); l.id = 'font-' + f[0]; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + f[4] + '&display=swap'; document.head.appendChild(l);
  }
  function applyFont() {
    // the SHELL layout always uses SHELL's font (JetBrains Mono; the clock is Inter Thin)
    const f = FONTS.find((x) => x[0] === (S.theme.layout === 'shell' ? 'shell' : S.theme.font)) || FONTS[0], st = document.documentElement.style;
    loadFont(f); st.setProperty('--sans', f[2]); st.setProperty('--mono', f[3]);
    st.setProperty('font-size-adjust', FSA[f[0]] ? String(FSA[f[0]]) : 'none');
    st.setProperty('--fs', String(FS[f[0]] || 1));
    document.documentElement.dataset.font = f[0];
  }
  function setTheme(patch) { const wxOnly = Object.keys(patch).every((k) => k === 'wx'); Object.assign(S.theme, patch); save(); if (!wxOnly) applyTheme(true); applyWeather(); if ('view' in patch || 'layout' in patch || 'icons' in patch || 'ficons' in patch || 'font' in patch) { renderHome(); renderFolders(); } markThemes(); haptic('tick'); }
  function sunTick() { if (S.theme.auto && sunPhase(Date.now()) !== lastPhase) { applyTheme(true); markThemes(); } if (S.theme.wx === 'real') applyWeather(); }

  // ---- the Themes folder
  const SETS = [['Tablet', 'lapis', 'wedges', 'bold'], ['Blueprint', 'blueprint', 'blueprint', 'bold'], ['Arcade', 'arcade', 'maze', 'soft'], ['Terrazzo', 'sand', 'terrazzo', 'bold'], ['Night sky', 'sun-night', 'stars', 'bold'],
    ['Desert', 'g-dune', 'dunes', 'bold'], ['Memphis', 'butter', 'memphis', 'bold'], ['Graph paper', 'news', 'grid', 'soft'], ['Picnic', 'm-red', 'gingham', 'soft'], ['Paper', 'paper', 'none', 'soft'], ['SHELL', 's-ember', 'none', 'soft', 'shell'], ['Terminal', 'terminal', 'scan', 'bold', 'terminal'], ['Newspaper', 'news', 'none', 'soft', 'editorial']];
  const swatch = (c) => '<button class="sw" data-color="' + c.id + '"><span class="swp" style="background:' + gradCSS(c) + ';color:' + c.ink + '">Aa<i style="background:' + c.acc + '"></i></span><span class="swn">' + esc(c.n) + '</span></button>';
  const group = (g) => '<div class="swg">' + TH.filter((c) => c.g === g).map(swatch).join('') + '</div>';
  function openThemes() {
    FONTS.forEach(loadFont);   // so the font tiles show themselves
    sheetKind = 'themes';
    openSheet('<h2>Themes</h2><div class="btnrow"><button class="btn solid" data-thact="surprise">Surprise me</button><button class="btn" data-thact="reset">Back to Paper</button></div>' +
      '<div class="grp"><p class="mono">View</p><div class="seg"><button class="btn sm" data-view="grid">Icons</button><button class="btn sm" data-view="list">Names</button></div>' +
        '<p class="hint" style="margin:8px 0 0">Icons: Home is a grid of icons (hold one for its name), folder tiles preview what\'s inside, an open folder shows big icons. Names: the lists.</p></div>' +
      '<div class="grp"><p class="mono">Layout</p><div class="seg"><button class="btn sm" data-layout="paper">Paper</button><button class="btn sm" data-layout="shell">SHELL</button></div>' +
        '<p class="hint" style="margin:8px 0 0">SHELL: everything in JetBrains Mono, a ledger of today on the left, the time stacked thin on the right. Works with any color.</p></div>' +
      '<div class="grp"><p class="mono">Icons</p><p class="hint" style="margin:0 0 8px">Beside app names on Home (Names view) · Tinted also recolors the icon grid</p><div class="seg3"><button class="btn sm" data-icons="off">Off</button><button class="btn sm" data-icons="color">App colors</button><button class="btn sm" data-icons="tint">Tinted</button></div>' +
        '<p class="hint" style="margin:14px 0 8px">Beside folder names · hold a folder → Icon to pick its own</p><div class="seg3"><button class="btn sm" data-ficons="off">Off</button><button class="btn sm" data-ficons="filled">Filled</button><button class="btn sm" data-ficons="line">Line</button></div></div>' +
      '<div class="grp"><p class="mono">Follow the sun</p><div class="kv"><span class="k" id="sunLine" style="font-size:15px"></span><button class="btn sm" data-thact="auto" id="sunBtn"></button></div><div class="swg" style="margin-top:12px">' + TH.filter((c) => c.g === 'sun').map(swatch).join('') + '</div>' +
      '<p class="mono" style="margin:18px 0 8px">Weather</p><div class="wxseg">' + WX.map(([k, n]) => '<button class="btn sm" data-wx="' + k + '">' + n + '</button>').join('') + '</div><p class="hint" id="wxLine" style="margin:8px 0 0"></p></div>' +
      '<div class="grp"><p class="mono">Sets</p><div class="btnrow" style="margin-top:0">' + SETS.map((s, i) => '<button class="btn sm" data-set="' + i + '">' + s[0] + '</button>').join('') + '</div></div>' +
      '<div class="grp"><p class="mono">Palettes</p>' + group('pal') + '</div>' +
      '<div class="grp"><p class="mono">One color, all the way through</p>' + group('mono') + '</div>' +
      '<div class="grp"><p class="mono">Loud</p>' + group('loud') + '</div>' +
      '<div class="grp"><p class="mono">Gradients</p>' + group('grad') + '</div>' +
      '<div class="grp"><p class="mono">SHELL</p>' + group('shell') + '</div>' +
      '<div class="grp"><p class="mono">A color for each page</p><p class="hint" style="margin:0 0 10px">Calendar, Home and Folders each get their own; it blends as you swipe.</p>' + group('tri') + '</div>' +
      '<div class="grp"><p class="mono">Fonts</p><div class="swg fontg">' + FONTS.map((f) => '<button class="sw" data-font="' + f[0] + '"><span class="swp fsw" style="font-family:' + esc(f[2]) + '">Aa</span><span class="swn">' + f[1] + '</span></button>').join('') + '</div></div>' +
      '<div class="grp"><p class="mono">Patterns · over any color</p><div class="seg" style="margin-bottom:12px"><button class="btn sm" data-str="soft">Soft</button><button class="btn sm" data-str="bold">Bold</button></div><div class="swg" id="patGrid"></div></div>');
    markThemes();
  }
  function markThemes() {
    if (sheetKind !== 'themes') return;
    const c = themeColor(), t = sunTimes(new Date());
    document.querySelectorAll('#sbody [data-color]').forEach((b) => b.classList.toggle('on', b.dataset.color === c.id));
    document.querySelectorAll('#sbody [data-str]').forEach((b) => b.classList.toggle('on', b.dataset.str === S.theme.str));
    [['view', 'grid'], ['layout', 'paper'], ['icons', 'off'], ['ficons', 'off']].forEach(([k, d]) => document.querySelectorAll('#sbody [data-' + k + ']').forEach((b) => b.classList.toggle('on', b.dataset[k] === (S.theme[k] || d))));
    document.querySelectorAll('#sbody [data-font]').forEach((b) => b.classList.toggle('on', b.dataset.font === (S.theme.font || 'paper')));
    $('#patGrid').innerHTML = PATS.map((p) => '<button class="sw' + (p[0] === S.theme.pat ? ' on' : '') + '" data-pat="' + p[0] + '"><span class="swp"></span><span class="swn">' + p[1] + '</span></button>').join('');
    $('#patGrid').querySelectorAll('.swp').forEach((el, i) => { const id = PATS[i][0], t = patCache[id] || (PATS[i][2] && (patCache[id] = PATS[i][2]())); el.style.backgroundColor = c.bg; el.style.backgroundImage = patURL(id, c.ink, c.acc, 0.6) || 'none'; if (t && t.w > 110) el.style.backgroundSize = Math.round(t.w * 0.5) + 'px'; });
    $('#sunLine').textContent = (S.theme.auto ? 'On · ' : '') + ({ dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' })[sunPhase(Date.now())] + ' now' + (t ? ' · up ' + hm(new Date(t.rise)) + ' · down ' + hm(new Date(t.set)) : '');
    document.querySelectorAll('#sbody [data-wx]').forEach((x) => x.classList.toggle('on', x.dataset.wx === (S.theme.wx || 'clear')));
    const L = S.theme.live, wl = $('#wxLine');
    wl.textContent = S.theme.wx === 'real' ? (L && L.code >= 0 ? 'Reston now: ' + (WX_TEXT[L.code] || 'Weather') + (L.temp != null ? ', ' + L.temp + '°' : '') + '. Checks every 30 minutes.' : L ? 'Couldn’t reach the weather. Showing clear; trying again soon.' : 'Checking Reston…')
      : 'Rain and storms fall behind everything, over any theme. Real follows Reston’s actual weather.';
    $('#sunBtn').textContent = S.theme.auto ? 'Turn off' : 'Turn on'; $('#sunBtn').classList.toggle('on', !!S.theme.auto);
  }
  function themeAct(a) {
    if (a === 'surprise') { const pool = TH.filter((c) => c.g !== 'sun'); setTheme({ auto: false, color: pool[Math.floor(Math.random() * pool.length)].id, pat: Math.random() < 0.45 ? 'none' : PATS[1 + Math.floor(Math.random() * (PATS.length - 1))][0], str: Math.random() < 0.5 ? 'soft' : 'bold' }); }
    if (a === 'reset') { setTheme({ auto: false, color: 'paper', pat: 'none', str: 'soft', wx: 'clear', font: 'paper', layout: 'paper', icons: 'off', ficons: 'off' }); renderHome(); renderFolders(); }
    if (a === 'auto') setTheme({ auto: !S.theme.auto });
  }
