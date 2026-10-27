/* Apps, part one: the speed and the safety. Each app is a toy; each toy explains one idea. */
(() => {
  const KX = window.KX, S = KX.S, K = window.KOS, A = KX.audio, { $, $$, esc, rnd } = K;
  // canvas that follows its box size; draw(c,w,h) is called on every resize
  K.canvas = (cv, h, onSize) => { const g = { c: cv.getContext('2d'), w: 0, h };
    const fit = cb => { const dpr = Math.min(2, devicePixelRatio || 1); g.w = Math.max(200, cv.clientWidth); cv.style.height = h + 'px'; cv.width = g.w * dpr; cv.height = h * dpr; g.c.setTransform(dpr, 0, 0, dpr, 0, 0); cb !== false && onSize && onSize(g); };
    new ResizeObserver(() => fit()).observe(cv); fit(false); return g; };
  const alive = win => win.isConnected;
  const loop = (win, fn) => { const f = now => { if (!alive(win)) return; requestAnimationFrame(f); if (!win.classList.contains('min') && !document.hidden) fn(now); }; requestAnimationFrame(f); };
  const why = (sum, html) => `<details class="why"><summary>${sum}</summary>${html}</details>`;

  /* ---------- Block Radio ---------- */
  K.app('radio', { title: 'Block Radio', icon: '📻', color: '#49eacb', w: 560, h: 560, status: 'Live beat from api.kaspa.org · each pad is a block',
    render(b, win) {
      b.innerHTML = `<div class="radio-top"><div><p class="kick">Now playing: the Kaspa network</p><p class="muted" style="margin:0">Every flash is a new block, live. No playlist, no pause button, no DJ.</p></div>
        <div class="bpm" aria-live="off"><span id="r-bps">10.0</span> <small>blocks a second</small></div></div>
        <div class="pads" id="r-pads" aria-hidden="true">${'<i></i>'.repeat(10)}</div>
        <div class="row"><button class="btn kas" id="r-snd" type="button">🔊 Turn it up</button><button class="btn yellow" id="r-btc" type="button" aria-pressed="false">🐢 Bitcoin's tempo</button><button class="btn pink" id="r-share" type="button">📸 Share this second</button></div>
        <div class="stats"><div class="stat"><b id="r-score">…</b><span>block count right now</span></div><div class="stat"><b id="r-since">0</b><span>made since you got here</span></div>
          <div class="stat"><b id="r-min">~600</b><span>blocks a minute</span></div><div class="stat"><b id="r-btcw">1</b><span>Bitcoin blocks in the same time</span></div></div>
        <div class="panel" id="r-real" style="font-size:13.5px">Fetching a real block to show you…</div>
        ${why('Why is fast hard?', `<p>Anyone can make blocks fast. The hard part: when blocks come this fast, two miners often make one at the same moment. A normal blockchain must pick one and bin the other, which wastes work and quietly favours big miners.</p><p>Kaspa keeps both and puts them in order afterwards. That's why it can go ten a second. Open <b>Pile-Up</b> to see the clash, and <b>Group Photo</b> to see the ordering.</p>`)}`;
      const pads = $$('#r-pads i', b); let btc = false, btcStart = 0;
      const PAD = ['#49eacb', '#ff5fa2', '#ffd23f', '#a685ff', '#b8f35a', '#ff8a3d', '#5ac8fa', '#ff4d4d', '#49eacb', '#ffd23f'];
      const onBlock = blk => { if (!alive(win) || btc) return; const p = pads[blk.lane % 10]; p.style.background = PAD[blk.lane % 10]; p.classList.add('hit'); setTimeout(() => { p.classList.remove('hit'); p.style.background = ''; }, 140); };
      KX.on('block', onBlock);
      const upd = () => { if (!alive(win)) return;
        $('#r-bps', b).textContent = S.online === false ? '10 (sim)' : (S.rateBps || 10).toFixed(1);
        $('#r-score', b).textContent = S.blueScore ? KX.fmt(S.blueScore) : S.online === false ? 'offline' : '…';
        const n = S.blueScore && S.firstScore ? S.blueScore - S.firstScore : 0; $('#r-since', b).textContent = KX.fmt(n);
        $('#r-min', b).textContent = '~' + KX.fmt(Math.round((S.rateBps || 10) * 60));
        const secs = (performance.now() - (K.t0 || 0)) / 1000; $('#r-btcw', b).textContent = (secs / 600).toFixed(secs < 600 ? 3 : 1);
        if (btc) { const left = Math.max(0, 600 - (performance.now() - btcStart) / 1000); $('#r-real', b).innerHTML = `<b>Bitcoin mode:</b> next note in <span class="mono">${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}</span>. Meanwhile Kaspa has quietly made <b>${KX.fmt(Math.round((600 - left) * (S.rateBps || 10)))}</b> blocks. Not a knock on Bitcoin: it picked slow and safe on purpose in 2009. Kaspa's bet is that you can be fast <i>and</i> safe.`; } };
      const tm = setInterval(() => alive(win) ? upd() : clearInterval(tm), 500); upd();
      KX.on('sample', s => { if (!alive(win) || btc) return; $('#r-real', b).innerHTML = `<b>Latest real block:</b> number ${KX.fmt(s.blueScore)}, with ${s.txs} payment${s.txs === 1 ? '' : 's'} inside. It points back to <b>${s.parents}</b> earlier block${s.parents === 1 ? '' : 's'} at once, which a normal chain can't do. <a href="https://explorer.kaspa.org/blocks/${encodeURIComponent(s.hash)}" target="_blank" rel="noopener">Open in explorer ↗</a>`; });
      $('#r-snd', b).onclick = () => { A.set(!A.on); $('#r-snd', b).textContent = A.on ? '🔇 Quiet please' : '🔊 Turn it up'; if (A.on) { K.award('tuned'); K.say('That\'s the network. Every note is a block. The louder, sparkly ones are real blocks I fetched for you.'); } };
      $('#r-btc', b).onclick = () => { btc = !btc; btcStart = performance.now(); $('#r-btc', b).setAttribute('aria-pressed', btc); pads.forEach(p => p.style.background = btc ? '#3a3350' : '');
        if (btc) { A.note(196, 1.5, .06, 'sine'); K.toast('🐢 One note. Now wait ten minutes for the next one.'); } upd(); };
      $('#r-share', b).onclick = () => K.share();
    } });

  /* ---------- Pile-Up ---------- */
  K.app('pileup', { title: 'Pile-Up.exe', icon: '💥', color: '#ff8a3d', w: 640, h: 600, status: 'A toy model · same maths as the real thing, slowed so you can watch',
    render(b, win) {
      b.innerHTML = `<p class="kick">What if any blockchain just went faster?</p><p class="lead">Drag the speed up. On top, an ordinary single chain: when two blocks land too close together, one gets thrown away 💥. Below, a blockDAG that keeps them all.</p>
        <canvas class="cv" id="p-cv" aria-label="Animated comparison: a single chain throws blocks away, a blockDAG keeps them"></canvas>
        <label class="sl"><span>Speed</span><input type="range" id="p-rate" min="0" max="100" value="38" aria-label="Blocks per second"><output id="p-rate-o"></output></label>
        <label class="sl"><span>Travel time</span><input type="range" id="p-del" min="1" max="30" value="5" aria-label="Seconds for a block to reach everyone"><output id="p-del-o"></output></label>
        <div class="row"><button class="btn sm" data-p="btc" type="button">Bitcoin speed</button><button class="btn sm" data-p="k1" type="button">1 a second</button><button class="btn sm orange" data-p="k10" type="button">Kaspa speed: 10 a second</button></div>
        <div class="stats"><div class="stat"><b id="p-p">…</b><span>chance a block clashes</span></div><div class="stat"><b id="p-lost">0%</b><span>thrown away by the single chain</span></div><div class="stat"><b>0%</b><span>thrown away by the blockDAG</span></div></div>
        <div class="verdict" id="p-v" aria-live="polite">Try "Kaspa speed" and watch the top row.</div>
        ${why('The maths, in one line', `<p>If blocks take about half a second to reach everyone, the chance that another block is made in that gap is 1 − e<sup>−rate × delay</sup>. At one block every 10 minutes that's almost zero. At 10 a second it's over 99%: nearly every block clashes. A single chain can't survive that; Kaspa's DAG was designed for it.</p>`)}`;
      const cv = $('#p-cv', b), G = K.canvas(cv, 230), rEl = $('#p-rate', b), dEl = $('#p-del', b);
      const LMIN = Math.log10(1 / 600), LMAX = Math.log10(20); const toR = v => 10 ** (LMIN + (LMAX - LMIN) * v / 100), fromR = r => Math.round((Math.log10(r) - LMIN) / (LMAX - LMIN) * 100);
      const fmtR = r => r >= 1 ? r.toFixed(r < 10 ? 1 : 0) + ' a sec' : r >= 1 / 60 ? '1 every ' + Math.round(1 / r) + ' s' : '1 every ' + Math.round(1 / r / 60) + ' min';
      let chain = [], dag = [], lost = [], next = 0;
      const P = () => ({ rate: toR(+rEl.value), d: +dEl.value / 10 });
      function upd() { const { rate, d } = P(); $('#p-rate-o', b).textContent = fmtR(rate); $('#p-del-o', b).textContent = d.toFixed(1) + ' s';
        const p = 1 - Math.exp(-rate * d); $('#p-p', b).textContent = (p * 100).toFixed(p < .01 ? 2 : 0) + '%'; chain = []; dag = []; lost = []; next = 0;
        $('#p-v', b).textContent = p > .9 ? 'A pile-up. The single chain is binning most of its blocks. This is why "just make it faster" doesn\'t work.' : p > .3 ? 'Getting messy. Lots of blocks clash and get thrown away up top.' : 'Calm. Blocks rarely clash at this speed, which is why slow chains are slow.';
        if (p > .9) setTimeout(() => alive(win) && K.award('pileup'), 3000); }
      rEl.oninput = dEl.oninput = upd;
      $$('[data-p]', b).forEach(x => x.onclick = () => { const p = { btc: [1 / 600, .5], k1: [1, .5], k10: [10, .5] }[x.dataset.p]; rEl.value = fromR(p[0]); dEl.value = p[1] * 10; upd(); K.blip(); });
      upd(); let t0 = performance.now();
      loop(win, now => {
        const dt = Math.min(.1, (now - t0) / 1000); t0 = now; const { rate, d } = P(); const vr = Math.min(Math.max(rate, .6), 5), vd = d * rate / vr; const T = now / 1000; if (!next) next = T + .2;
        while (T >= next) { const blk = { t: next, y: Math.random() }; const prev = chain.filter(x => !x.orph).slice(-1)[0];
          if (prev && blk.t - prev.t < vd) { (Math.random() < .5 ? blk : prev).orph = next; lost.push(1); A.note(110, .15, .03, 'square'); } else lost.push(0);
          if (lost.length > 120) lost.shift(); chain.push(blk); dag.push({ t: next, y: Math.random(), par: dag.filter(x => next - x.t >= vd).slice(-3) }); next += -Math.log(1 - Math.random()) / vr; }
        const { c, w, h } = G; c.fillStyle = '#120b2c'; c.fillRect(0, 0, w, h); const pps = w / 7, X = t => w - 30 - (T - t) * pps;
        chain = chain.filter(x => X(x.t) > -20); dag = dag.filter(x => X(x.t) > -20);
        c.font = '700 12px JB, monospace'; c.fillStyle = '#ffd23f'; c.fillText('ONE CHAIN', 12, 20); c.fillStyle = '#49eacb'; c.fillText('BLOCKDAG (KASPA)', 12, h / 2 + 22);
        c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
        const cy = h / 4 + 8; let px = null;
        for (const x0 of chain) { const x = X(x0.t);
          if (x0.orph) { const fall = Math.min(60, (T - x0.orph) * 90); c.globalAlpha = Math.max(0, 1 - fall / 60); c.font = '18px sans-serif'; c.fillText('💥', x - 9, cy + 6 + fall); c.globalAlpha = 1; continue; }
          if (px != null) { c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.moveTo(px + 8, cy); c.lineTo(x - 8, cy); c.stroke(); }
          c.fillStyle = '#ffd23f'; c.fillRect(x - 8, cy - 8, 16, 16); c.strokeStyle = '#14101f'; c.lineWidth = 2; c.strokeRect(x - 8, cy - 8, 16, 16); px = x; }
        const d0 = h / 2 + 36, d1 = h - 16;
        for (const x0 of dag) { const x = X(x0.t), y = d0 + x0.y * (d1 - d0); x0.par.forEach(p => { c.strokeStyle = 'rgba(73,234,203,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(X(p.t) + 6, d0 + p.y * (d1 - d0)); c.stroke(); }); }
        for (const x0 of dag) { const x = X(x0.t), y = d0 + x0.y * (d1 - d0); c.fillStyle = '#49eacb'; c.fillRect(x - 7, y - 7, 14, 14); c.strokeStyle = '#14101f'; c.lineWidth = 2; c.strokeRect(x - 7, y - 7, 14, 14); }
        const ls = lost.length ? lost.reduce((a, x) => a + x, 0) / lost.length : 0; $('#p-lost', b).textContent = Math.round(ls * 100) + '%';
        if (rate < .6) { c.fillStyle = '#c9c2da'; c.font = '11px JB, monospace'; c.fillText('sped up so you can watch', w - 180, 20); }
      });
    } });

  /* ---------- Group Photo (GHOSTDAG) ---------- */
  K.app('photo', { title: 'Group Photo · who was first?', icon: '📸', color: '#ff5fa2', w: 680, h: 640, status: 'A small real version of GHOSTDAG, the rule Kaspa uses to order blocks',
    render(b, win) {
      b.innerHTML = `<p class="kick">Try to cheat the ordering. Get caught.</p><p class="lead">Honest miners show their blocks to everyone at once, like friends who all appear in each other's photos. Start mining in <b>secret</b>, wait a few seconds, then reveal. Your blocks never saw the honest ones, so they stand out.</p>
        <canvas class="cv" id="g-cv" aria-label="Animated blockDAG. Blue blocks are honest and well connected; red are ones that didn't see enough of the others"></canvas>
        <div class="legend"><span><i style="background:#5ac8fa"></i>blue: in the photo</span><span><i style="background:#ff4d4d"></i>red: didn't see enough of the others</span><span><i style="background:transparent;border-style:dashed;border-color:#ff4d4d"></i>yours, hidden</span></div>
        <div class="row"><button class="btn pink" id="g-hide" type="button" aria-pressed="false">🤫 Start secret mining</button><button class="btn kas" id="g-rel" type="button" disabled>🎉 Reveal my blocks</button><button class="btn sm" id="g-play" type="button" aria-pressed="true">Honest miners: on</button><button class="btn sm" id="g-reset" type="button">Reset</button></div>
        <label class="sl"><span>Tolerance (k)</span><input type="range" id="g-k" min="0" max="6" value="3" aria-label="How many unseen blocks are tolerated"><output id="g-k-o">3</output></label>
        <div class="stats"><div class="stat"><b id="g-blue">0</b><span>blue blocks</span></div><div class="stat"><b id="g-red">0</b><span>red blocks</span></div><div class="stat"><b id="g-sec">0</b><span>your hidden blocks</span></div></div>
        <div class="verdict" id="g-msg" aria-live="polite"></div>
        ${why('What is "k", and what does real Kaspa use?', `<p>k is how many blocks a block is allowed to have missed and still count as honest. Honest blocks only miss the few made at the same instant. A hidden attacker misses lots. Here k is small so you can see it; at 10 blocks a second real Kaspa uses k = 124.</p><p>Red blocks aren't deleted. They stay in the record, they just come later in the order, so they can't jump the queue. Kaspa's real name for this rule is GHOSTDAG. (I, Dag the ghost, am named after it.)</p>`)}`;
      const G = K.canvas($('#g-cv', b), 260);
      let nodes, id, playing = true, hiding = false, nextH = 0, nextA = 0, color = {}, k = 3, released = [], busted = false;
      const msg = s => $('#g-msg', b).textContent = s;
      const pub = () => nodes.filter(n => !n.secret);
      const tipsOf = set => { const has = new Set(); set.forEach(n => n.parents.forEach(p => has.add(p))); return set.filter(n => !has.has(n.id)); };
      function sync() { $('#g-hide', b).setAttribute('aria-pressed', hiding); $('#g-rel', b).disabled = !hiding; $('#g-play', b).setAttribute('aria-pressed', playing); $('#g-play', b).textContent = 'Honest miners: ' + (playing ? 'on' : 'paused'); }
      function reset() { nodes = [{ id: 0, t: performance.now() / 1000 - 30, parents: [], lane: 2, genesis: true }]; id = 1; hiding = false; released = []; color = {}; busted = false; msg('Honest blocks arrive and see each other. Press "Start secret mining".'); sync(); recompute(); }
      function ghost(pars, past, bs, blues) {
        const sp = pars.reduce((a, c) => (bs.get(a) > bs.get(c) || (bs.get(a) === bs.get(c) && a < c)) ? a : c);
        const pastB = new Set(); pars.forEach(p => { pastB.add(p); past.get(p).forEach(x => pastB.add(x)); });
        const spPast = past.get(sp); const merge = [...pastB].filter(x => x !== sp && !spPast.has(x)).sort((a, c) => bs.get(a) - bs.get(c) || a - c);
        const blue = new Set(blues.get(sp)); blue.add(sp); const anti = (a, c) => a !== c && !past.get(a).has(c) && !past.get(c).has(a);
        for (const c of merge) { const ac = [...blue].filter(x => anti(x, c)); if (ac.length > k) continue; if (ac.every(x => [...blue].filter(y => anti(x, y)).length + 1 <= k)) blue.add(c); }
        return { score: blue.size, blue };
      }
      function recompute() {
        const P = pub(), byId = new Map(P.map(n => [n.id, n])), past = new Map(), bs = new Map(), blues = new Map();
        for (const n of P) { const pars = n.parents.filter(p => byId.has(p)); const ps = new Set(); pars.forEach(p => { ps.add(p); past.get(p).forEach(x => ps.add(x)); }); past.set(n.id, ps);
          if (!pars.length) { bs.set(n.id, 1); blues.set(n.id, new Set([n.id])); continue; } const r = ghost(pars, past, bs, blues); bs.set(n.id, r.score); blues.set(n.id, r.blue); }
        const v = ghost(tipsOf(P).map(n => n.id), past, bs, blues); color = {}; P.forEach(n => color[n.id] = v.blue.has(n.id) ? 'b' : 'r');
        $('#g-blue', b).textContent = P.filter(n => color[n.id] === 'b').length; $('#g-red', b).textContent = P.filter(n => color[n.id] === 'r').length; $('#g-sec', b).textContent = nodes.filter(n => n.secret).length;
        if (released.length) { const red = released.filter(i => color[i] === 'r').length;
          if (red && !busted) { busted = true; K.award('busted'); K.nope(); K.say(rnd(['🚨 Caught on camera. Your blocks never saw the honest ones, so they came out red and go to the back of the queue.', 'Busted. Hiding blocks is like photoshopping yourself into a group photo: everyone can tell.'])); }
          msg(red ? `🚨 Busted. ${red} of your ${released.length} secret blocks came out red: while you hid, more than k = ${k} honest blocks were made that they never saw. They go to the back of the line.` : `Your ${released.length} blocks squeaked in as blue: you didn't hide long enough to matter. Try hiding longer, or lower k.`); }
      }
      function laneFor(t) { const used = new Set(nodes.filter(n => !n.secret && Math.abs(n.t - t) < .9).map(n => n.lane)); for (const l of [2, 1, 3, 0, 4]) if (!used.has(l)) return l; return Math.floor(Math.random() * 5); }
      const addH = T => { const seen = pub().filter(n => T - n.t > .7 || n.genesis); nodes.push({ id: id++, t: T, parents: tipsOf(seen).map(n => n.id), lane: laneFor(T) }); A.note(523 + Math.random() * 200, .12, .02, 'triangle'); };
      const addS = T => { const mine = nodes.filter(n => n.secret); const par = mine.length ? mine[mine.length - 1].id : tipsOf(pub())[0].id; nodes.push({ id: id++, t: T, parents: [par], lane: 5, secret: true }); A.note(160, .3, .03, 'sawtooth'); };
      $('#g-k', b).oninput = e => { k = +e.target.value; $('#g-k-o', b).textContent = k; recompute(); };
      $('#g-play', b).onclick = () => { playing = !playing; sync(); };
      $('#g-hide', b).onclick = () => { if (hiding) return; hiding = true; released = []; busted = false; nextA = performance.now() / 1000 + .8; msg('🤫 Mining in secret… nobody can see your blocks. Wait 5 seconds or so, then reveal.'); sync(); };
      $('#g-rel', b).onclick = () => { released = nodes.filter(n => n.secret).map(n => n.id); nodes.forEach(n => { n.secret = false; if (n.lane === 5) n.lane = 4.6; }); hiding = false; sync(); recompute(); };
      $('#g-reset', b).onclick = reset; reset();
      loop(win, now => {
        const T = now / 1000; if (!nextH) nextH = T + .5;
        if (playing && T >= nextH) { addH(T); nextH = T + .3 + -Math.log(1 - Math.random()) * .45; recompute(); }
        if (hiding && T >= nextA) { addS(T); nextA = T + 1.5 + Math.random() * .7; recompute(); }
        if (nodes.length > 70) { const drop = nodes.length - 70, gone = new Set(nodes.slice(0, drop).map(n => n.id)); nodes = nodes.slice(drop); nodes.forEach(n => n.parents = n.parents.filter(p => !gone.has(p))); if (!nodes.some(n => n.genesis)) nodes[0].genesis = true; recompute(); }
        const { c, w, h } = G; c.fillStyle = '#120b2c'; c.fillRect(0, 0, w, h); const pps = w / 14, X = t => w - 30 - (T - t) * pps, Y = l => 28 + l * ((h - 56) / 5);
        c.fillStyle = 'rgba(255,77,77,.12)'; c.fillRect(0, Y(4.6) + 14, w, h); c.font = '700 11px JB, monospace'; c.fillStyle = '#ff9a9a'; c.fillText('YOUR SECRET HIDEOUT', 10, h - 8);
        const byId = new Map(nodes.map(n => [n.id, n]));
        for (const n of nodes) for (const p of n.parents) { const q = byId.get(p); if (!q) continue; c.strokeStyle = n.secret ? 'rgba(255,77,77,.7)' : 'rgba(255,255,255,.3)'; c.lineWidth = 1.3; c.setLineDash(n.secret ? [4, 3] : []); c.beginPath(); c.moveTo(X(n.t), Y(n.lane)); c.lineTo(X(q.t), Y(q.lane)); c.stroke(); }
        c.setLineDash([]);
        for (const n of nodes) { const x = X(n.t), y = Y(n.lane); if (x < -10) continue; c.beginPath(); c.arc(x, y, 9, 0, 7);
          if (n.secret) { c.setLineDash([3, 3]); c.strokeStyle = '#ff4d4d'; c.lineWidth = 2.5; c.stroke(); c.setLineDash([]); }
          else { c.fillStyle = color[n.id] === 'r' ? '#ff4d4d' : '#5ac8fa'; c.fill(); c.strokeStyle = '#14101f'; c.lineWidth = 2; c.stroke();
            if (released.includes(n.id)) { c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 14, 0, 7); c.stroke(); } } }
      });
    } });

  /* ---------- Checkout Rush ---------- */
  K.app('checkout', { title: 'Checkout Rush', icon: '🛒', color: '#ffd23f', w: 640, h: 560, status: 'Two ways to keep track of money, racing',
    render(b) {
      b.innerHTML = `<p class="kick">Two shops. Same five customers. Who's done first?</p><p class="lead">Left: a bank-style ledger that updates one balance at a time. Right: Kaspa's way, where each payment spends specific coins, so payments that don't touch the same coins can all be checked at once.</p>
        <div class="row"><button class="btn yellow" id="c-go" type="button">🏁 Race!</button><label class="row" style="margin:0"><input type="checkbox" id="c-dbl"> Let Ben try to spend coin #2 twice 😈</label></div>
        <div class="lanes"><div class="lane panel"><h3>🏦 One at a time</h3><div id="c-tab"></div><p class="muted" id="c-tc">0 steps</p></div><div class="lane panel"><h3>🪙 Coin by coin (Kaspa)</h3><div id="c-coin"></div><p class="muted" id="c-cc">0 steps</p></div></div>
        <div class="verdict" id="c-v" aria-live="polite">Press Race.</div>
        ${why('Is this how Kaspa really works?', `<p>Yes, in spirit. Kaspa uses "coins" (the jargon is UTXOs): each payment names exactly which coins it spends. Two payments that use different coins can't conflict, so they can be checked side by side. Two payments that use the same coin can't both win: the first in the agreed order is kept and the second is refused. That's the double-spend check, and it's why the ordering in Group Photo matters.</p>`)}`;
      const pays = [['Ana → café', 'coin #1'], ['Ben → bakery', 'coin #2'], ['Cy → bike shop', 'coin #3'], ['Dee → bookshop', 'coin #4'], ['Eli → cinema', 'coin #5']];
      const render = (el, list) => { el.innerHTML = list.map(p => `<div class="tx"><span>${p[0]}</span><span class="st">${p[1]}</span></div>`).join(''); return [...el.children]; };
      const setup = () => { const l = pays.slice(); if ($('#c-dbl', b).checked) l.splice(3, 0, ['Ben again → arcade', 'coin #2']); return l; };
      const draw0 = () => { const l = setup(); render($('#c-tab', b), l.map(p => [p[0], 'queued'])); render($('#c-coin', b), l); $('#c-tc', b).textContent = '0 steps'; $('#c-cc', b).textContent = '0 steps'; };
      let busy = false; $('#c-dbl', b).onchange = () => !busy && draw0(); draw0();
      const sleep = ms => new Promise(r => setTimeout(r, KX.reduced ? 0 : ms));
      $('#c-go', b).onclick = async () => {
        if (busy) return; busy = true; const list = setup(), dbl = $('#c-dbl', b).checked; const tab = render($('#c-tab', b), list.map(p => [p[0], 'queued'])), coins = render($('#c-coin', b), list);
        coins.forEach(n => n.classList.add('run')); await sleep(500); const seen = new Set();
        coins.forEach((n, i) => { const c = list[i][1], dup = seen.has(c); seen.add(c); n.classList.remove('run'); n.classList.add(dup ? 'no' : 'ok'); n.querySelector('.st').textContent = dup ? c + ' already spent ✕' : c + ' ✓'; });
        $('#c-cc', b).textContent = '1 step: all checked side by side'; A.note(880, .3, .05, 'sine'); K.floatText('⚡ done', innerWidth / 2, innerHeight / 2, '#49eacb');
        for (let i = 0; i < tab.length; i++) { tab[i].classList.add('run'); tab[i].querySelector('.st').textContent = 'updating…'; await sleep(450); const dup = list[i][0].includes('again');
          tab[i].classList.remove('run'); tab[i].classList.add(dup ? 'no' : 'ok'); tab[i].querySelector('.st').textContent = dup ? 'balance too low ✕' : 'done ✓'; A.note(330 + i * 40, .1, .03, 'square'); $('#c-tc', b).textContent = (i + 1) + ' step' + (i ? 's' : '') + ', one at a time'; }
        $('#c-v', b).textContent = dbl ? '😈 Ben\'s second spend of coin #2 was refused on both sides. Same coin, twice? No. The coin side caught it instantly, without waiting in line.' : 'The coin side finished in one step. The ledger took ' + tab.length + '. Now tick the box and let Ben try something.';
        $('#c-v', b).className = 'verdict ' + (dbl ? 'no' : 'ok'); if (dbl) { K.award('double'); K.nope(); } busy = false; };
    } });

  /* ---------- Heist Planner ---------- */
  function logP(q, z) { if (q >= .5) return 0; if (z === 0) return 0; const p = 1 - q, lam = z * q / p, r = Math.log(q / p); const t = []; let lp = -lam;
    for (let k = 0; k <= z + 400; k++) { if (k > 0) lp += Math.log(lam) - Math.log(k); t.push(k <= z ? lp + (z - k) * r : lp); }
    const m = Math.max(...t); const s = t.reduce((a, x) => a + Math.exp(x - m), 0); return Math.min(0, (m + Math.log(s)) / Math.LN10); }
  const aLog = (q, z) => { if (q >= .5) return 0; const v = logP(q, z); return isFinite(v) ? v : z * Math.log10(q / (1 - q)); };
  const human = l => l >= -.0001 ? 'certain' : l > -2 ? Math.round(10 ** l * 100) + '%' : l > -12 ? '1 in ' + KX.fmt(Math.round(10 ** -l)) : '1 in 10^' + Math.round(-l);
  K.app('heist', { title: 'Heist Planner', icon: '🦹', color: '#a685ff', w: 620, h: 640, status: 'Odds from the Bitcoin paper\'s catch-up formula · guessing power is live',
    render(b, win) {
      b.innerHTML = `<p class="kick" style="color:#fff;background:#14101f;display:inline-block;padding:2px 10px;border-radius:8px">TOP SECRET: rewrite history</p>
        <p class="lead">Your plan: pay a shop, get the goods, then secretly build a rival history where you never paid. To win, your crew must out-guess the whole honest network. Today the honest network makes <b id="h-live">…</b> guesses a second (live).</p>
        <label class="sl"><span>Your crew's share</span><input type="range" id="h-q" min="1" max="60" value="10" aria-label="Your share of all guessing power"><output id="h-q-o"></output></label>
        <label class="sl"><span>Shop waits</span><input type="range" id="h-z" min="1" max="60" value="10" aria-label="Seconds the shop waits before handing over goods"><output id="h-z-o"></output></label>
        <div class="crew"><div class="stat"><b class="big-n" id="h-p">…</b><span>chance you pull it off</span></div><div class="stat"><b class="big-n" id="h-need">…</b><span>guessing power you'd need to bring</span></div></div>
        <canvas class="cv" id="h-cv" aria-label="Chart: your chance falls as the shop waits longer"></canvas>
        <div class="verdict" id="h-v" aria-live="polite"></div>
        ${why('Honest small print', `<p>This is the catch-up formula from the original Bitcoin paper, run with Kaspa's 10 blocks a second. It's a simplified model. The real point: what protects Kaspa is the same as Bitcoin, the cost of out-guessing everyone. Faster blocks just mean the odds collapse in seconds instead of hours.</p><p>Above half the world's guessing power, any proof-of-work coin can be rewritten. Kaspa is no exception, and we say so. Blocks are also counted as truly final after about 12 hours.</p>`)}`;
      const qEl = $('#h-q', b), zEl = $('#h-z', b); let warned = false;
      const G = K.canvas($('#h-cv', b), 170, () => draw());
      function draw() { if (!G.c) return; const q = +qEl.value / 100, sec = +zEl.value; $('#h-q-o', b).textContent = qEl.value + '%'; $('#h-z-o', b).textContent = sec + ' s';
        const l = aLog(q, sec * 10); $('#h-p', b).textContent = human(l);
        const hon = S.hashTH; $('#h-live', b).textContent = hon ? KX.fmt(hon * 1e12 / 1e15) + ' quadrillion' : S.online === false ? '(offline: live number unavailable)' : '…';
        $('#h-need', b).textContent = hon ? KX.fmt(hon * q / (1 - q) / 1000) + ' PH/s' : S.online === false ? 'needs live data' : '…';
        const v = $('#h-v', b);
        if (q >= .5) { v.className = 'verdict no'; v.innerHTML = '🦹 With a majority you win eventually, whatever the shop does. True of every proof-of-work coin. The catch: you\'d need more machines than everyone else on Earth combined, and you\'d be wrecking the thing you just stole.'; if (!warned) { warned = true; K.award('heist'); K.nope(); } }
        else if (l < -6) { v.className = 'verdict ok'; v.textContent = `😂 Your odds: ${human(l)}. Your crew has been arrested by mathematics. The shop waited ${sec} seconds, which at Kaspa speed is ${sec * 10} blocks.`; }
        else { v.className = 'verdict'; v.textContent = `Your odds: ${human(l)}. Not great, not zero. Make the shop wait a few more seconds and watch them vanish.`; }
        const { c, w, h } = G; c.fillStyle = '#120b2c'; c.fillRect(0, 0, w, h); const L = 40, R = w - 12, T0 = 12, B = h - 24, maxD = 40;
        c.font = '10px JB, monospace'; [0, -10, -20, -30, -40].forEach(d => { const y = T0 + (B - T0) * (-d / maxD); c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke(); c.fillStyle = '#c9c2da'; c.fillText(d === 0 ? '100%' : '1e' + d, 2, y + 3); });
        c.fillText('0 s', L, h - 6); c.fillText('shop waits →  60 s', R - 130, h - 6);
        c.strokeStyle = q >= .5 ? '#ff4d4d' : '#b8f35a'; c.lineWidth = 3; c.beginPath();
        for (let s = 0; s <= 60; s += .5) { const y = T0 + (B - T0) * Math.min(1, -aLog(q, Math.round(s * 10)) / maxD), x = L + (R - L) * s / 60; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
        const mx = L + (R - L) * sec / 60, my = T0 + (B - T0) * Math.min(1, -l / maxD); c.fillStyle = '#ff5fa2'; c.beginPath(); c.arc(mx, my, 7, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
      qEl.oninput = zEl.oninput = draw; KX.on('info', () => alive(win) && draw()); KX.on('online', () => alive(win) && draw()); draw();
    } });

  /* ---------- The Jar (covenants) ---------- */
  K.app('jar', { title: 'The Jar 🔒', icon: '🫙', color: '#b8f35a', w: 640, h: 600, status: 'Covenants: live on mainnet since the Toccata upgrade (June 2026)',
    render(b) {
      b.innerHTML = `<p class="kick">These coins come with rules. Try to rob them.</p>
        <div class="jar-wrap"><div><div class="jar" aria-hidden="true"><div class="lid"></div><div class="fill" id="j-fill" style="height:80%"></div><div class="amt" id="j-amt">1,000 KAS</div><div class="face" id="j-face">😌</div></div></div>
        <div><ul class="rules" id="j-rules"><li>Up to 50 KAS can go anywhere.</li><li>More than 50 KAS can only go to your savings address.</li><li>Any change must carry these same rules with it.</li></ul>
        <p class="muted" style="margin:0">The rules live <b>inside the coins</b>. Every computer on the network checks them. No bank, no app, no "are you sure?" popup.</p></div></div>
        <div class="row"><button class="btn sm kas" data-t="coffee" type="button">☕ Coffee, 4.5</button><button class="btn sm" data-t="rent" type="button">🏠 Rent, 900</button><button class="btn sm lime" data-t="save" type="button">🐷 Save 900</button><button class="btn sm red" data-t="thief" type="button">🦝 Steal it all</button><button class="btn sm orange" data-t="sneaky" type="button">🥷 Sneaky: 40, change escapes</button><button class="btn sm" id="j-refill" type="button">Refill</button></div>
        <div class="verdict" id="j-v" aria-live="polite">Pick something to do with the jar.</div>
        ${why('Is this real, today?', `<p>Yes. Rules attached to coins ("covenants") went live on Kaspa's main network with the Toccata upgrade in June 2026. Apps use them for savings vaults, tokens and more. This jar is a simplified toy: real rules are written in a language called SilverScript. The rule-check is the real idea: the network itself refuses anything that breaks the coin's rules.</p>`)}`;
      let bal = 1000; const rules = $$('#j-rules li', b), v = $('#j-v', b), face = $('#j-face', b);
      const fmtK = n => KX.fmt(n, n % 1 ? 1 : 0) + ' KAS';
      const show = () => { $('#j-amt', b).textContent = fmtK(bal); $('#j-fill', b).style.height = Math.max(3, bal / 1000 * 80) + '%'; };
      const TAUNTS = ['Nice try, thief.', 'Absolutely not.', 'Lol. No.', 'I\'m a jar. I have no feelings, only rules.', 'Bold. Wrong, but bold.', 'Every computer on Earth just said no to you.'];
      function attempt(a, dest, keep, who) {
        rules.forEach(r => r.className = ''); v.className = 'verdict'; void v.offsetWidth;
        if (a > bal) { v.textContent = `There's only ${fmtK(bal)} in the jar.`; return; }
        const big = a > 50, r2 = !big || dest === 'save', r3 = bal - a <= 0 || keep;
        rules[0].className = !big ? 'pass' : ''; rules[1].className = r2 ? 'pass' : 'fail'; rules[2].className = r3 ? 'pass' : 'fail';
        if (r2 && r3) { bal = +(bal - a).toFixed(2); v.classList.add('ok'); face.textContent = '😌'; v.textContent = who === 'coffee' ? 'Approved. Enjoy your flat white. ☕' : dest === 'save' ? `Approved: ${fmtK(a)} went to your savings address. Future you says thanks.` : `Approved: ${fmtK(a)} sent.`; A.note(660, .4, .05, 'sine'); }
        else { v.classList.add('no'); face.textContent = rnd(['😤', '🙄', '😏', '🤨']); const why = !r2 ? 'more than 50 KAS can only go to your savings address' : 'the change tried to escape the rules';
          v.textContent = (who === 'thief' ? rnd(TAUNTS) + ' Refused: ' : who === 'sneaky' ? 'Sneaky! Still refused: ' : 'Refused by every node on the network: ') + why + '.'; K.nope(); if (who === 'thief' || who === 'sneaky') K.award('thief'); }
        show(); }
      $$('[data-t]', b).forEach(x => x.onclick = () => { const t = x.dataset.t; ({ coffee: () => attempt(4.5, 'any', true, t), rent: () => attempt(900, 'any', true, t), save: () => attempt(900, 'save', true, t), thief: () => attempt(bal, 'any', false, t), sneaky: () => attempt(40, 'any', false, t) })[t](); });
      $('#j-refill', b).onclick = () => { bal = 1000; rules.forEach(r => r.className = ''); v.className = 'verdict'; v.textContent = 'Jar refilled.'; face.textContent = '😌'; show(); };
      show();
    } });
})();
