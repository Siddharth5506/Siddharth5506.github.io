// Portfolio site: theme toggle + Stellar Capital equity charts (Live since real-capital start, or Backtest) as inline SVG.
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

  const BT = window.CURVES || {}, LIVE = window.LIVE || {};
  let mode = 'live';

  // ---- strategy cards. live: key in LIVE, or null when the book is tracked inside another one
  const STRATS = [
    { key: 'stellar_india', live: 'stellar_india', name: 'Stellar India', asset: 'Indian equities (NSE)', status: 'Live' },
    { key: 'indmoney', live: 'indmoney', name: 'US Stocks', asset: 'US equities · INDmoney', status: 'Live', noBt: 'Discretionary account · no backtest' },
    { key: 'manual', live: 'manual', name: 'Manual Trading', asset: 'Indian stocks & options · Groww now, Dhan scalping next', status: 'Manual',
      noBt: 'Discretionary trading · no backtest', liveLabel: 'Gain on capital used, since ' },
    { key: 'combo_flow', live: 'combo_flow', name: 'Stellar Combo Flow', asset: 'Crypto + gold perpetual futures', status: 'Live' },
    { key: 'crypto_flow', live: null, name: 'Stellar Crypto Flow', asset: 'Crypto perpetual futures', status: 'Live', note: 'inside Combo Flow' },
    { key: 'gold_flow', live: null, name: 'Stellar Gold Flow', asset: 'Gold (XAUT) perpetual futures', status: 'Live', note: 'inside Combo Flow' },
    { key: 'gamma', live: 'gamma', name: 'Gamma Reactor', asset: 'Nifty / Bank Nifty options', status: 'Paper' },
  ];
  const grid = document.getElementById('stratGrid');
  const yr = d => d.slice(0, 4);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtD = d => +d.slice(8, 10) + ' ' + MONTHS[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
  const fmtM = d => MONTHS[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
  const spans = [];

  STRATS.forEach(s => {
    const card = document.createElement('article');
    card.className = 'card';
    const head = document.createElement('div'); head.className = 'card-head';
    const h = document.createElement('h3'); h.textContent = s.name;
    const chip = document.createElement('span');
    chip.className = 'chip ' + (s.status === 'Live' ? 'live' : s.status === 'Paper' ? 'paper' : ''); chip.textContent = s.status;
    head.append(h, chip);
    const a = document.createElement('p'); a.className = 'asset';
    a.textContent = s.asset + (s.note ? ' · ' + s.note : '');
    const span = document.createElement('p'); span.className = 'span';
    spans.push({ el: span, s });
    const ch = document.createElement('div'); ch.className = 'chart';
    ch.dataset.key = s.key; ch.dataset.live = s.live || '';
    if (s.noBt) ch.dataset.nobt = s.noBt;
    if (s.liveMsg) { ch.dataset.lm1 = s.liveMsg[0]; ch.dataset.lm2 = s.liveMsg[1]; }
    ch.setAttribute('role', 'img');
    card.append(head, a, span, ch);
    grid.appendChild(card);
  });
  const idxBox = document.querySelector('.chart.big');
  idxBox.dataset.live = 'index';

  function labels() {
    spans.forEach(({ el, s }) => {
      const c = BT[s.key];
      if (mode === 'bt') el.textContent = c ? 'Backtest ' + yr(c.start) + '–' + yr(c.end) : 'No backtest';
      else if (s.liveMsg) el.textContent = 'Not started yet';
      else if (s.liveLabel) el.textContent = s.liveLabel + fmtD(LIVE[s.live].start);
      else el.textContent = s.live ? (s.status === 'Paper' ? 'Paper trading' : 'Live') + ' since ' + fmtD(LIVE[s.live].start)
                                   : 'Live as part of Stellar Combo Flow';
    });
    document.getElementById('indexSub').textContent = mode === 'bt'
      ? '50/50 blend of Stellar India and Stellar Combo Flow, rebalanced daily · backtest 2016–2026'
      : 'All real-money accounts together (Stellar India, Manual Trading, US Stocks, Stellar Combo Flow), deposits and withdrawals excluded · live since '
        + fmtD(LIVE.index.start) + (LIVE._updated ? ' · updated ' + LIVE._updated : '');
    document.querySelectorAll('.chart').forEach(b => b.setAttribute('aria-label',
      (b.closest('.card') ? b.closest('.card').querySelector('h3').textContent : 'Stellar Capital Index') +
      (mode === 'bt' ? ' equity curve, backtest, log scale' : ' equity curve, live, percent return')));
  }

  // ---- drawing helpers
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, attrs) => { const e = document.createElementNS(NS, n); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const txt = (attrs, s) => { const t = el('text', attrs); t.textContent = s; return t; };
  const tip = document.getElementById('tip');

  function frame(box) {
    const W = box.clientWidth, H = box.clientHeight;
    box.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' });
    box.appendChild(svg);
    return { W, H, svg, m: { l: 48, r: 10, t: 10, b: 22 } };
  }

  function message(box, line1, line2) {
    const { W, H, svg, m } = frame(box);
    const y0 = m.t + (H - m.t - m.b) / 2;
    svg.appendChild(el('line', { class: 'zero', x1: m.l, x2: W - m.r, y1: y0, y2: y0 }));
    svg.appendChild(txt({ class: 'tick', x: m.l - 6, y: y0 + 4, 'text-anchor': 'end' }, '0%'));
    svg.appendChild(txt({ class: 'note', x: (m.l + W - m.r) / 2, y: y0 - 18, 'text-anchor': 'middle' }, line1));
    if (line2) svg.appendChild(txt({ class: 'note2', x: (m.l + W - m.r) / 2, y: y0 + 24, 'text-anchor': 'middle' }, line2));
    box.onpointermove = box.onpointerdown = box.onpointerleave = null;
  }

  function plot(box, c, log) {
    const { W, H, svg, m } = frame(box);
    const iw = W - m.l - m.r, ih = H - m.t - m.b, base = m.t + ih;
    const t0 = Date.parse(c.d[0]), t1 = Date.parse(c.d[c.d.length - 1]);
    const X = t => m.l + (t - t0) / (t1 - t0) * iw;
    let Y, ticks;
    if (log) {
      const lo = Math.floor(Math.log10(Math.min(...c.v)));
      const hi = Math.max(Math.ceil(Math.log10(Math.max(...c.v))), lo + 1);
      Y = v => m.t + (1 - (Math.log10(v) - lo) / (hi - lo)) * ih;
      const step = (hi - lo) > 4 ? 2 : 1;
      ticks = [];
      for (let p = lo; p <= hi; p++) if (!(((p % step) + step) % step)) ticks.push([Math.pow(10, p), Math.pow(10, p).toLocaleString('en-IN') + '×']);
    } else {
      const pc = c.v.map(v => (v - 1) * 100);
      let lo = Math.min(0, ...pc), hi = Math.max(0, ...pc);
      const pad = Math.max((hi - lo) * 0.12, 1); lo -= pad; hi += pad;
      Y = v => m.t + (1 - (((v - 1) * 100) - lo) / (hi - lo)) * ih;
      const raw = (hi - lo) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const st = [1, 2, 2.5, 5, 10].map(k => k * mag).find(k => k >= raw);
      ticks = [];
      for (let p = Math.ceil(lo / st) * st; p <= hi; p += st) ticks.push([1 + p / 100, (p > 0 ? '+' : '') + +p.toFixed(1) + '%']);
    }
    ticks.forEach(([v, s]) => {
      const y = Y(v);
      svg.appendChild(el('line', { class: Math.abs(v - 1) < 1e-9 && !log ? 'zero' : 'gl', x1: m.l, x2: W - m.r, y1: y, y2: y }));
      svg.appendChild(txt({ class: 'tick', x: m.l - 6, y: y + 4, 'text-anchor': 'end' }, s));
    });
    // x ticks: years for backtest, dates for live
    if (log) {
      const ys = +yr(c.d[0]), ye = +yr(c.d[c.d.length - 1]);
      const span = ye - ys, ystep = W < 420 ? (span > 8 ? 4 : 2) : (span > 8 ? 2 : 1);
      for (let y = ys + 1; y <= ye; y++) if (!((y - ys - 1) % ystep))
        svg.appendChild(txt({ class: 'tick', x: X(Date.parse(y + '-01-01')), y: H - 5, 'text-anchor': 'middle' }, y));
    } else {
      const n = c.d.length, k = Math.max(1, Math.ceil(n / (W < 420 ? 3 : 6)));
      for (let i = 0; i < n; i += k)
        svg.appendChild(txt({ class: 'tick', x: X(Date.parse(c.d[i])), y: H - 5, 'text-anchor': 'middle' }, +c.d[i].slice(8, 10) + ' ' + MONTHS[+c.d[i].slice(5, 7) - 1]));
    }
    let d = '';
    c.v.forEach((v, i) => { d += (i ? 'L' : 'M') + X(Date.parse(c.d[i])).toFixed(1) + ',' + Y(v).toFixed(1); });
    const floorY = log ? base : Y(1);
    svg.appendChild(el('path', { class: 'ar', d: d + `L${X(t1)},${floorY}L${X(t0)},${floorY}Z` }));
    svg.appendChild(el('path', { class: 'ln', d }));
    const xh = el('line', { class: 'xh', y1: m.t, y2: base, visibility: 'hidden' });
    const dot = el('circle', { class: 'dot', r: 4, visibility: 'hidden' });
    svg.append(xh, dot);

    const xs = c.d.map(s => X(Date.parse(s)));
    box.onpointermove = box.onpointerdown = ev => {
      const r = box.getBoundingClientRect(), px = ev.clientX - r.left;
      let i = 0, best = 1e9;
      xs.forEach((x, k) => { const dd = Math.abs(x - px); if (dd < best) { best = dd; i = k; } });
      xh.setAttribute('x1', xs[i]); xh.setAttribute('x2', xs[i]); xh.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', xs[i]); dot.setAttribute('cy', Y(c.v[i])); dot.setAttribute('visibility', 'visible');
      tip.textContent = '';
      const v = c.v[i], s = document.createElement('strong');
      s.textContent = log ? (v >= 100 ? Math.round(v).toLocaleString('en-IN') : v >= 10 ? v.toFixed(0) : v.toFixed(2)) + '× growth'
                          : ((v - 1) * 100 >= 0 ? '+' : '') + ((v - 1) * 100).toFixed(2) + '% since start';
      const sp = document.createElement('span'); sp.textContent = log ? fmtM(c.d[i]) : fmtD(c.d[i]);
      tip.append(s, sp);
      tip.style.display = 'block';
      tip.style.left = Math.min(ev.clientX + 14, window.innerWidth - tip.offsetWidth - 8) + 'px';
      tip.style.top = (ev.clientY - tip.offsetHeight - 12) + 'px';
    };
    box.onpointerleave = () => { xh.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.style.display = 'none'; };
  }

  function draw(box) {
    if (!box.clientWidth) return;
    if (mode === 'bt') return BT[box.dataset.key] ? plot(box, BT[box.dataset.key], true)
                                                  : message(box, box.dataset.nobt || 'No backtest', '');
    if (box.dataset.lm1) return message(box, box.dataset.lm1, box.dataset.lm2);
    const lk = box.dataset.live;
    if (!lk) return message(box, 'Trades inside Stellar Combo Flow', 'See the Combo Flow curve for live results');
    const c = LIVE[lk];
    if (!c || c.d.length < 2) return message(box, 'Day 1 · started ' + fmtD((c || LIVE.index).start), 'The curve updates after each trading session');
    plot(box, c, false);
  }

  const boxes = [...document.querySelectorAll('.chart')];
  const drawAll = () => boxes.forEach(draw);
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    labels(); drawAll();
  }));
  labels(); drawAll();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawAll, 120); });
})();
