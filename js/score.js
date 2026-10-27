/* Hero: the live score. Rhythm is real (blue score polled every second); geometry is a sketch; ringed notes are real sampled blocks. */
(() => {
  const KX = window.KX, S = KX.S;
  // ---------- sound ----------
  const A = KX.audio = { on: false, ctx: null, master: null,
    init() { if (this.ctx) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = .6; this.master.connect(this.ctx.destination); },
    note(f, dur = .35, g = .05, type = 'triangle') {
      if (!this.on || !this.ctx) return; const c = this.ctx, t = c.currentTime;
      const o = c.createOscillator(), v = c.createGain(); o.type = type; o.frequency.value = f;
      v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + .008); v.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(v); v.connect(this.master); o.start(t); o.stop(t + dur + .02);
    },
    set(on) { this.on = on; if (on) { this.init(); this.ctx && this.ctx.resume(); }
      document.querySelectorAll('#sound,#c-sound').forEach(b => b.setAttribute('aria-pressed', on)); KX.emit('sound', on); }
  };
  const PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25]; // A minor pentatonic, low to high

  // ---------- canvas ----------
  const cv = document.getElementById('score'); if (!cv) return;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1;
  const LANES = 9; const blocks = KX._blocks = []; let pendingSamples = [];
  let visible = true, last = performance.now();
  function size() { dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener('resize', size);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
  const windowSec = () => (W < 640 ? 5 : 9);
  const pxPerSec = () => (W - 60) / windowSec();
  const laneY = i => { const top = 46, bot = H - 40; return top + (bot - top) * (1 - i / (LANES - 1)); };
  const beat = document.getElementById('beat');
  function spawn(now) {
    const recent = blocks.filter(b => now - b.t > 150 && now - b.t < 1400);
    const kids = new Set(); recent.forEach(b => b.parents.forEach(p => kids.add(p)));
    let tips = recent.filter(b => !kids.has(b)).slice(-4);
    if (!tips.length && recent.length) tips = [recent[recent.length - 1]];
    const sel = tips.length ? tips.reduce((a, b) => (a.depth >= b.depth ? a : b)) : null;
    const parents = sel ? [sel, ...tips.filter(t => t !== sel).slice(0, 2)] : [];
    let lane = sel ? Math.max(0, Math.min(LANES - 1, sel.lane + Math.round((Math.random() - .5) * 4))) : 4;
    const b = { t: now, lane, parents, depth: (sel ? sel.depth : 0) + 1, real: null };
    if (pendingSamples.length) { b.real = pendingSamples.shift(); }
    blocks.push(b);
    if (beat) { beat.classList.add('hit'); setTimeout(() => beat.classList.remove('hit'), 70); }
    A.note(PENTA[lane] * (b.real ? 2 : 1), b.real ? .9 : .28, b.real ? .05 : .025, b.real ? 'sine' : 'triangle');
  }
  // The API caches the blue score for several seconds, so we don't replay its jumps. We play a steady
  // Poisson rhythm at the measured rate and nudge it so the count we've drawn tracks the real count.
  let drawn = null, target = null;
  KX.on('score', ({ score, delta }) => {
    if (score != null) { target = score; if (drawn == null) drawn = score; }
    else if (target != null) target += delta; // offline: simulated
    else { target = 0; drawn = 0; }
  });
  KX.on('sample', s => { pendingSamples = [s]; });

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    // staff
    ctx.strokeStyle = 'rgba(27,25,20,.18)'; ctx.lineWidth = 1;
    for (let i = 0; i < LANES; i += 2) { const y = Math.round(laneY(i)) + .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // bar lines each second
    const pps = pxPerSec(), nowX = W - 40;
    ctx.font = '11px JBMono, monospace'; ctx.fillStyle = 'rgba(27,25,20,.45)';
    const sec = now / 1000;
    for (let s = Math.floor(sec); s > sec - windowSec() - 1; s--) {
      const x = nowX - (sec - s) * pps; if (x < 0) continue;
      ctx.strokeStyle = 'rgba(27,25,20,.10)'; ctx.beginPath(); ctx.moveTo(x, laneY(LANES - 1)); ctx.lineTo(x, laneY(0)); ctx.stroke();
    }
    ctx.fillText('1 second', nowX - pps - 2, H - 14);
    ctx.strokeStyle = 'rgba(27,25,20,.45)'; ctx.beginPath(); ctx.moveTo(nowX - pps, H - 24); ctx.lineTo(nowX, H - 24); ctx.stroke();
    // prune
    while (blocks.length && (now - blocks[0].t) / 1000 > windowSec() + 1.5) blocks.shift();
    const X = b => nowX - ((now - b.t) / 1000) * pps;
    // edges
    for (const b of blocks) {
      const x = X(b), y = laneY(b.lane);
      b.parents.forEach((p, i) => {
        const px = X(p), py = laneY(p.lane);
        ctx.strokeStyle = i === 0 ? 'rgba(27,25,20,.55)' : 'rgba(27,25,20,.18)'; ctx.lineWidth = i === 0 ? 1.4 : 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 18, y, px + 18, py, px, py); ctx.stroke();
      });
    }
    // notes
    for (const b of blocks) {
      const x = X(b), y = laneY(b.lane), age = (now - b.t) / 1000;
      const r = b.real ? 6 : 4.2; const pop = Math.min(1, age * 6);
      ctx.fillStyle = b.real ? '#13786c' : '#1b1914';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.25 * pop, r * pop, -0.35, 0, Math.PI * 2); ctx.fill();
      if (b.real) { ctx.strokeStyle = '#13786c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 12 + Math.sin(now / 300) * 1.5, 0, Math.PI * 2); ctx.stroke(); }
      b.x = x; b.y = y;
    }
    // now line
    ctx.strokeStyle = '#13786c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nowX + 12, 30); ctx.lineTo(nowX + 12, H - 30); ctx.stroke();
    ctx.fillStyle = '#13786c'; ctx.fillText('now', nowX + 2, 22);
    if (S.online === false) { ctx.fillStyle = 'rgba(194,52,28,.85)'; ctx.fillText('offline: simulated rhythm', 14, 22); }
  }
  function frame(now) {
    const dt = Math.min(.25, (now - last) / 1000);
    if (target != null) {
      const lag = target - drawn, rate = (S.rateBps || 10) * Math.max(.6, Math.min(1.6, 1 + lag / 120));
      if (lag > 400) drawn = target - 50; // came back from a hidden tab: skip ahead
      let n = 0, p = rate * dt; // Poisson draw for this frame
      for (let L = Math.exp(-p), k = 1; (k *= Math.random()) > L && n < 20;) n++;
      for (let i = 0; i < n; i++) { spawn(now - (n - 1 - i) * dt * 1000 / n); drawn++; }
    }
    if (visible) draw(now);
    last = now; requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // offline fallback: simulate 10 bps
  setInterval(() => { if (S.online === false) KX.emit('score', { score: null, delta: 10 }); }, 1000);

  // ---------- block card ----------
  const stage = document.getElementById('stage'); let card = null;
  function closeCard() { if (card) { card.remove(); card = null; } }
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = null, bd = 22 * 22;
    for (const b of blocks) { const d = (b.x - mx) ** 2 + (b.y - my) ** 2 * 1.5; const bonus = b.real ? .4 : 1; if (d * bonus < bd) { bd = d * bonus; best = b; } }
    closeCard(); if (!best) return;
    card = document.createElement('div'); card.className = 'blockcard'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Block details');
    const left = Math.min(Math.max(8, mx - 170), r.width - 350); card.style.left = left + 'px'; card.style.top = Math.max(8, my - 200) + 'px';
    if (best.real) {
      const s = best.real, t = new Date(s.time);
      card.innerHTML = `<button class="x" aria-label="Close">×</button><h3>A real block</h3>
      <p style="margin:0">Mined at ${t.toLocaleTimeString()}, your time. ${s.parents} parents: it built on ${s.parents} blocks at once${s.reds ? `, and placed ${s.reds} late arrival${s.reds > 1 ? 's' : ''} in red` : ''}.</p>
      <dl><dt>Fingerprint</dt><dd>${s.hash.slice(0, 20)}…</dd><dt>Blue score</dt><dd>${KX.fmt(s.blueScore)}</dd><dt>Parents</dt><dd>${s.parents}</dd>
      <dt>Merged blue / red</dt><dd>${s.blues} / ${s.reds}</dd><dt>Transactions</dt><dd>${s.txs}</dd></dl>
      <a href="https://explorer.kaspa.org/blocks/${s.hash}" target="_blank" rel="noopener">Open in the explorer ↗</a>`;
    } else {
      card.innerHTML = `<button class="x" aria-label="Close">×</button><h3>A sketched block</h3><p style="margin:0">The timing is real: the network really is adding about ${Math.round(S.rateBps)} blocks a second. The positions and links are drawn to show the idea. <b>Tap a ringed note for a real block</b> with its actual parents.</p>`;
    }
    stage.appendChild(card); card.querySelector('.x').onclick = closeCard; card.querySelector('.x').focus();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });
})();
