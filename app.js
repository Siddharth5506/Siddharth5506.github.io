// Portfolio site: theme toggle + Stellar Capital live % charts (inline SVG, no libraries).
(function () {
  // ---- theme toggle (remembers choice; safe if storage is blocked)
  const root = document.documentElement;
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  document.getElementById('themeBtn').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  const LIVE = window.LIVE || {};
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtD = d => +d.slice(8, 10) + ' ' + MONTHS[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
  const fmtS = d => +d.slice(8, 10) + ' ' + MONTHS[+d.slice(5, 7) - 1];

  // ---- every strategy: real money first, then paper
  const SI = 'Stellar India book · % of Stellar India capital';
  const REAL = [
    { key: 'stellar_india', name: 'Stellar India', asset: 'Indian equities · Astra, Morning Wood, Stellar Swing, Result Short', since: 'Live since ' },
    { key: 'astra', name: 'Astra', asset: SI, since: 'Live since ' },
    { key: 'mw', name: 'Morning Wood', asset: SI, since: 'Live since ' },
    { key: 'swing', name: 'Stellar Swing', asset: SI, since: 'Live since ' },
    { key: 'rshort', name: 'Result Short', asset: SI, since: 'Live since ' },
    { key: 'combo_flow', name: 'Stellar Combo Flow', asset: 'Crypto + gold perpetual futures · Delta Exchange', since: 'Live since ' },
    { key: 'indmoney', name: 'US Stocks', asset: 'US equities · INDmoney', since: 'Live since ' },
    { key: 'manual', name: 'Manual Trading', asset: 'Indian stocks & options · Groww now, Dhan scalping next', since: 'Gain on capital used, since ' },
  ];
  const PAPER = [
    { key: 'cf_paper', name: 'Stellar Combo Flow', asset: 'Crypto + gold perpetual futures · paper engine', since: 'Paper since ' },
    { key: 'crypto_paper', name: 'Stellar Crypto Flow', asset: 'Crypto perpetual futures · crypto leg of the paper engine', since: 'Paper since ' },
    { key: 'gold_paper', name: 'Stellar Gold Flow', asset: 'Gold (XAUT) perpetual futures · gold legs of the paper engine', since: 'Paper since ' },
    { key: 'gamma', name: 'Gamma Reactor', asset: 'Nifty / Bank Nifty options', since: 'Paper since ' },
  ];

  function cards(list, gridId, kind) {
    const grid = document.getElementById(gridId);
    list.forEach(s => {
      const c = LIVE[s.key];
      if (!c) return;
      const card = document.createElement('article');
      card.className = 'card';
      const head = document.createElement('div'); head.className = 'card-head';
      const h = document.createElement('h3'); h.textContent = s.name;
      const v = c.v[c.v.length - 1] - 1;
      const ret = document.createElement('span');
      const flat = Math.abs(v) < 0.0005;              // rounds to 0.0%
      ret.className = 'ret ' + (flat ? '' : v > 0 ? 'up' : 'down');
      ret.textContent = flat ? '0.0%' : (v > 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1) + '%';
      head.append(h, ret);
      const a = document.createElement('p'); a.className = 'asset'; a.textContent = s.asset;
      const meta = document.createElement('p'); meta.className = 'span';
      const chip = document.createElement('span'); chip.className = 'chip ' + kind; chip.textContent = kind === 'live' ? 'Real' : 'Paper';
      meta.append(chip, document.createTextNode(' ' + s.since + fmtD(c.start)));
      const ch = document.createElement('div'); ch.className = 'chart'; ch.dataset.key = s.key;
      ch.setAttribute('role', 'img'); ch.setAttribute('aria-label', s.name + ' equity curve, percent return since start');
      card.append(head, a, meta, ch);
      grid.appendChild(card);
    });
  }
  cards(REAL, 'realGrid', 'live');
  cards(PAPER, 'paperGrid', 'paper');

  const idx = LIVE.index;
  if (idx) {
    const v = idx.v[idx.v.length - 1] - 1;
    const big = document.getElementById('indexRet');
    big.textContent = (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1) + '%';
    big.className = 'big-ret ' + (v >= 0 ? 'up' : 'down');
    document.getElementById('indexSub').textContent = 'All real-money accounts together · since ' + fmtD(idx.start)
      + (LIVE._updated ? ' · updated ' + LIVE._updated.replace(/^(\d{4})-(\d\d)-(\d\d)/, (m, y, mo, d) => fmtD(`${y}-${mo}-${d}`)) : '');
  }

  // ---- drawing
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, attrs) => { const e = document.createElementNS(NS, n); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const txt = (attrs, s) => { const t = el('text', attrs); t.textContent = s; return t; };
  const tip = document.getElementById('tip');

  function frame(box) {
    const W = box.clientWidth, H = box.clientHeight;
    box.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' });
    box.appendChild(svg);
    return { W, H, svg, m: { l: 50, r: 10, t: 10, b: 22 } };
  }

  function message(box, line1, line2) {
    const { W, H, svg, m } = frame(box);
    const y0 = m.t + (H - m.t - m.b) / 2;
    svg.appendChild(el('line', { class: 'zero', x1: m.l, x2: W - m.r, y1: y0, y2: y0 }));
    svg.appendChild(txt({ class: 'tick', x: m.l - 6, y: y0 + 4, 'text-anchor': 'end' }, '0%'));
    svg.appendChild(txt({ class: 'note', x: (m.l + W - m.r) / 2, y: y0 - 18, 'text-anchor': 'middle' }, line1));
    if (line2) svg.appendChild(txt({ class: 'note2', x: (m.l + W - m.r) / 2, y: y0 + 24, 'text-anchor': 'middle' }, line2));
  }

  function plot(box, c) {
    const { W, H, svg, m } = frame(box);
    const iw = W - m.l - m.r, ih = H - m.t - m.b, base = m.t + ih;
    const t0 = Date.parse(c.d[0]), t1 = Date.parse(c.d[c.d.length - 1]);
    const X = t => m.l + (t - t0) / (t1 - t0) * iw;
    const pc = c.v.map(v => (v - 1) * 100);
    let lo = Math.min(0, ...pc), hi = Math.max(0, ...pc);
    const pad = Math.max((hi - lo) * 0.12, 1); lo -= pad; hi += pad;
    const Y = v => m.t + (1 - (((v - 1) * 100) - lo) / (hi - lo)) * ih;
    const raw = (hi - lo) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const st = [1, 2, 2.5, 5, 10].map(k => k * mag).find(k => k >= raw);
    for (let p = Math.ceil(lo / st) * st; p <= hi + 1e-9; p += st) {
      const y = Y(1 + p / 100), zero = Math.abs(p) < 1e-9;
      svg.appendChild(el('line', { class: zero ? 'zero' : 'gl', x1: m.l, x2: W - m.r, y1: y, y2: y }));
      svg.appendChild(txt({ class: 'tick', x: m.l - 6, y: y + 4, 'text-anchor': 'end' }, (p > 0 ? '+' : '') + +p.toFixed(1) + '%'));
    }
    const n = c.d.length, k = Math.max(1, Math.ceil(n / (W < 420 ? 3 : W < 700 ? 4 : 7)));
    for (let i = 0; i < n; i += k)
      svg.appendChild(txt({ class: 'tick', x: X(Date.parse(c.d[i])), y: H - 5, 'text-anchor': i ? 'middle' : 'start' }, fmtS(c.d[i])));
    let d = '';
    c.v.forEach((v, i) => { d += (i ? 'L' : 'M') + X(Date.parse(c.d[i])).toFixed(1) + ',' + Y(v).toFixed(1); });
    const zy = Y(1);
    svg.appendChild(el('path', { class: 'ar', d: d + `L${X(t1)},${zy}L${X(t0)},${zy}Z` }));
    svg.appendChild(el('path', { class: 'ln', d }));
    const xh = el('line', { class: 'xh', y1: m.t, y2: base, visibility: 'hidden' });
    const dot = el('circle', { class: 'dot', r: 4, visibility: 'hidden' });
    svg.append(xh, dot);

    const xs = c.d.map(s => X(Date.parse(s)));
    box.onpointermove = box.onpointerdown = ev => {
      const r = box.getBoundingClientRect(), px = ev.clientX - r.left;
      let i = 0, best = 1e9;
      xs.forEach((x, j) => { const dd = Math.abs(x - px); if (dd < best) { best = dd; i = j; } });
      xh.setAttribute('x1', xs[i]); xh.setAttribute('x2', xs[i]); xh.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', xs[i]); dot.setAttribute('cy', Y(c.v[i])); dot.setAttribute('visibility', 'visible');
      tip.textContent = '';
      const p = (c.v[i] - 1) * 100, s = document.createElement('strong');
      s.textContent = (p >= 0 ? '+' : '−') + Math.abs(p).toFixed(2) + '%';
      const sp = document.createElement('span'); sp.textContent = fmtD(c.d[i]);
      tip.append(s, sp);
      tip.style.display = 'block';
      tip.style.left = Math.min(ev.clientX + 14, window.innerWidth - tip.offsetWidth - 8) + 'px';
      tip.style.top = (ev.clientY - tip.offsetHeight - 12) + 'px';
    };
    box.onpointerleave = () => { xh.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.style.display = 'none'; };
  }

  function draw(box) {
    if (!box.clientWidth) return;
    const c = LIVE[box.dataset.key];
    if (!c || c.d.length < 2) return message(box, 'Day 1 · started ' + fmtD((c || LIVE.index).start), 'The curve updates after each trading session');
    plot(box, c);
  }

  const boxes = [...document.querySelectorAll('.chart')];
  const drawAll = () => boxes.forEach(draw);
  drawAll();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawAll, 120); });
})();
