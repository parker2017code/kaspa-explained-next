/* The wallpaper is the network: blocks drawn at the real measured rate, each pointing back to the blocks it saw.
   Ringed blocks are real blocks sampled from api.kaspa.org. If the API is down, the rhythm is simulated and labelled so. */
(() => {
  const KX = window.KX, S = KX.S, K = window.KOS, A = KX.audio;
  const cv = document.getElementById('wall'), c = cv.getContext('2d');
  const COLS = ['#49eacb', '#ff5fa2', '#ffd23f', '#a685ff', '#b8f35a', '#ff8a3d', '#5ac8fa', '#fffaf0'];
  const PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
  let W = 0, H = 0, dpr = 1, LANES = 10;
  const blocks = []; let pending = null, next = 0, last = performance.now(), turbo = 1;
  function size() { dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); LANES = Math.max(6, Math.min(14, Math.floor(H / 52))); }
  size(); addEventListener('resize', size);
  const span = () => (W < 700 ? 6 : 12); // seconds visible
  const laneY = l => 30 + (H - 70) * (l / (LANES - 1));
  KX.on('sample', s => { pending = s; });
  function spawn(T) {
    const recent = blocks.filter(b => T - b.t > .12 && T - b.t < 1.2);
    const kids = new Set(); recent.forEach(b => b.par.forEach(p => kids.add(p)));
    let tips = recent.filter(b => !kids.has(b)).slice(-4); if (!tips.length && recent.length) tips = [recent[recent.length - 1]];
    const lane = tips.length ? Math.max(0, Math.min(LANES - 1, tips[0].lane + Math.round((Math.random() - .5) * 5))) : Math.floor(LANES / 2);
    const b = { t: T, lane, par: tips.slice(0, 3), col: COLS[Math.floor(Math.random() * COLS.length)], real: null, pop: 0 };
    if (pending) { b.real = pending; pending = null; }
    blocks.push(b); KX.emit('block', b);
    if (A.on && !document.hidden) A.note(PENTA[lane % PENTA.length] * (b.real ? 2 : 1), b.real ? .8 : .22, b.real ? .045 : .018, b.real ? 'sine' : 'triangle');
  }
  const X = (b, T) => W - 40 - (T - b.t) * (W / span());
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.25, (now - last) / 1000); last = now; if (document.hidden) return;
    const T = now / 1000, rate = (S.rateBps || 10) * turbo;
    if (!next || next < T - 1) next = T;
    while (T >= next) { spawn(next); next += -Math.log(1 - Math.random()) / rate; }
    while (blocks.length && X(blocks[0], T) < -40) blocks.shift();
    if (KX.reduced && Math.floor(now / 500) === frame.k) return; frame.k = Math.floor(now / 500);
    c.clearRect(0, 0, W, H);
    // edges
    c.lineWidth = 1.5;
    for (const b of blocks) { const x = X(b, T), y = laneY(b.lane);
      b.par.forEach((p, i) => { c.strokeStyle = i ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.42)'; const px = X(p, T), py = laneY(p.lane);
        c.beginPath(); c.moveTo(x - 8, y); c.bezierCurveTo(x - 30, y, px + 30, py, px + 8, py); c.stroke(); }); }
    // blocks
    for (const b of blocks) { const x = X(b, T), y = laneY(b.lane); b.pop = Math.min(1, b.pop + dt * 6);
      const s = (b.real ? 22 : 15) * (b.pop < 1 ? 1 + (1 - b.pop) * .8 : 1);
      c.fillStyle = '#14101f'; rr(x - s / 2 + 3, y - s / 2 + 3, s, s, 5); c.fill();
      c.fillStyle = b.col; rr(x - s / 2, y - s / 2, s, s, 5); c.fill(); c.strokeStyle = '#14101f'; c.lineWidth = 2.5; c.stroke();
      if (b.real) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, s * .95, 0, 7); c.stroke(); } }
    // "now" line
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(W - 40, 10); c.lineTo(W - 40, H - 30); c.stroke(); c.setLineDash([]);
  }
  function rr(x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  requestAnimationFrame(frame);

  // tap a block
  document.getElementById('desktop').addEventListener('click', e => {
    if (!e.target.isConnected || e.target.closest('.win,.ico,#helper,#blockcard,#tickerbar,.menu')) return;
    const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, T = performance.now() / 1000;
    let best = null, bd = 30; for (const b of blocks) { const d = Math.hypot(X(b, T) - mx, laneY(b.lane) - my); if (d < bd) { bd = d; best = b; } }
    if (!best) return; showCard(best, e.clientX, e.clientY);
  });
  function showCard(b, cx, cy) {
    let card = document.getElementById('blockcard'); if (card) card.remove();
    card = document.createElement('div'); card.id = 'blockcard'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'About this block');
    const real = b.real || (S.online ? null : null);
    if (b.real) {
      const s = b.real; K.award('block');
      card.innerHTML = `<button class="tb-btn x" type="button" aria-label="Close">×</button><h2>🔎 A real block</h2>
        <p style="margin:0">Made ${s.time ? Math.max(0, Math.round((Date.now() - s.time) / 1000)) + ' seconds ago' : 'a moment ago'} by a miner somewhere on Earth.</p>
        <dl><dt>Block number</dt><dd>${KX.fmt(s.blueScore)}</dd><dt>Pointed back to</dt><dd>${s.parents} earlier block${s.parents === 1 ? '' : 's'}</dd>
        <dt>Payments inside</dt><dd>${s.txs}</dd><dt>Blocks it vouched for</dt><dd>${s.blues} blue · ${s.reds} red</dd></dl>
        <p class="muted" style="margin:4px 0 8px">"Pointed back to" is the DAG part: one block can see several blocks made at the same time. A single chain only allows one.</p>
        <a class="btn sm kas" href="https://explorer.kaspa.org/blocks/${encodeURIComponent(s.hash)}" target="_blank" rel="noopener">See it in the explorer ↗</a>`;
    } else {
      card.innerHTML = `<button class="tb-btn x" type="button" aria-label="Close">×</button><h2>🟩 A block (sketch)</h2>
        <p style="margin:0 0 6px">Every square is drawn ${S.online === false ? 'to a <b>simulated</b> beat of 10 a second, because the network API is unreachable right now.' : 'to the <b>real</b> beat of the network, about ten a second.'}
        Lines point back to the blocks each one had seen.</p><p class="muted" style="margin:0">The <b>ringed</b> squares are real blocks fetched from the network every few seconds. Tap one of those to see inside.</p>`;
    }
    document.getElementById('desktop').appendChild(card);
    const dr = document.getElementById('desktop').getBoundingClientRect();
    card.style.left = Math.max(10, Math.min(cx - dr.left - 150, dr.width - card.offsetWidth - 10)) + 'px';
    card.style.top = Math.max(40, Math.min(cy - dr.top + 14, dr.height - card.offsetHeight - 10)) + 'px';
    card.querySelector('.x').onclick = () => card.remove(); card.querySelector('.x').focus({ preventScroll: true });
    K.blip(1200);
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') { const c = document.getElementById('blockcard'); c && c.remove(); } });
  KX.wall = { setTurbo(v) { turbo = v; }, blocks };
})();
