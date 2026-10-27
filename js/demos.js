/* Interactive demos: pile-up, GHOSTDAG, coins race, cheat calculator, savings jar. */
(() => {
  const KX = window.KX, S = KX.S, $ = id => document.getElementById(id);
  function fitCanvas(cv) {
    const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = +cv.getAttribute('height');
    cv.style.height = h + 'px'; cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, w, h };
  }
  function onScreen(el, cb) { let v = false; new IntersectionObserver(e => { v = e[0].isIntersecting; cb && cb(v); }, { rootMargin: '100px' }).observe(el); return () => v; }
  const url = new URL(location.href);
  function setParam(k, v) { url.searchParams.set(k, v); history.replaceState(null, '', url.pathname + url.search + location.hash); }

  /* ---------- 01 pile-up ---------- */
  (() => {
    const cv = $('collide-cv'); if (!cv) return;
    let G = fitCanvas(cv); addEventListener('resize', () => { G = fitCanvas(cv); });
    const vis = onScreen(cv);
    const rateEl = $('c-rate'), delEl = $('c-delay');
    const LMIN = Math.log10(1 / 600), LMAX = Math.log10(20);
    const toRate = v => 10 ** (LMIN + (LMAX - LMIN) * v / 100), fromRate = r => Math.round((Math.log10(r) - LMIN) / (LMAX - LMIN) * 100);
    const fmtRate = r => r >= 1 ? r.toFixed(r < 10 ? 1 : 0) + ' a second' : r >= 1 / 60 ? 'one every ' + Math.round(1 / r) + ' s' : 'one every ' + Math.round(1 / r / 60) + ' min';
    if (url.searchParams.get('rate')) rateEl.value = fromRate(+url.searchParams.get('rate'));
    if (url.searchParams.get('delay')) delEl.value = Math.round(+url.searchParams.get('delay') * 10);
    let chain = [], dag = [], lost = [], next = 0;
    function params() { const rate = toRate(+rateEl.value), d = +delEl.value / 10; return { rate, d }; }
    function upd() {
      const { rate, d } = params(); $('c-rate-o').textContent = fmtRate(rate); $('c-delay-o').textContent = d.toFixed(1) + ' s';
      const p = 1 - Math.exp(-rate * d); $('c-p').textContent = (p * 100).toFixed(p < .01 ? 2 : 0) + '%';
      chain = []; dag = []; lost = []; next = 0;
    }
    rateEl.oninput = delEl.oninput = () => { upd(); const { rate, d } = params(); setParam('rate', rate.toPrecision(3)); setParam('delay', d); };
    document.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
      const p = { btc: [1 / 600, .5], k1: [1, .5], k10: [10, .5] }[b.dataset.preset]; rateEl.value = fromRate(p[0]); delEl.value = p[1] * 10; rateEl.oninput();
    });
    upd();
    let t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame); if (!vis()) { t0 = now; return; }
      const dt = Math.min(.1, (now - t0) / 1000); t0 = now;
      const { rate, d } = params(); const vr = Math.min(Math.max(rate, .6), 5), vd = d * rate / vr; // keep rate×delay, slow to watchable
      const T = now / 1000; if (!next) next = T + .2;
      while (T >= next) {
        const b = { t: next, y: Math.random() };
        const prev = chain.filter(x => !x.orph).slice(-1)[0];
        if (prev && b.t - prev.t < vd) { (Math.random() < .5 ? b : prev).orph = next; lost.push(1); } else lost.push(0);
        if (lost.length > 120) lost.shift();
        chain.push(b); dag.push({ t: next, y: Math.random(), par: dag.filter(x => next - x.t >= vd).slice(-3) });
        next += -Math.log(1 - Math.random()) / vr;
      }
      const { c, w, h } = G; c.clearRect(0, 0, w, h);
      const pps = w / 7, X = t => w - 30 - (T - t) * pps;
      chain = chain.filter(b => X(b.t) > -20); dag = dag.filter(b => X(b.t) > -20);
      c.font = '12px JBMono, monospace'; c.fillStyle = '#4a453b';
      c.fillText('ONE CHAIN', 12, 20); c.fillText('BLOCKDAG', 12, h / 2 + 18);
      c.strokeStyle = 'rgba(27,25,20,.2)'; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
      const cy = h / 4 + 6; let px = null;
      for (const b of chain) { const x = X(b.t);
        if (b.orph) { const fall = Math.min(60, (T - b.orph) * 80); c.globalAlpha = Math.max(0, 1 - fall / 60); c.strokeStyle = '#c2341c'; c.lineWidth = 1.5; c.strokeRect(x - 7, cy - 7 + fall, 14, 14); c.globalAlpha = 1; continue; }
        if (px != null) { c.strokeStyle = '#1b1914'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px + 7, cy); c.lineTo(x - 7, cy); c.stroke(); }
        c.fillStyle = '#1b1914'; c.fillRect(x - 7, cy - 7, 14, 14); px = x; }
      const dy0 = h / 2 + 34, dy1 = h - 18;
      for (const b of dag) { const x = X(b.t), y = dy0 + b.y * (dy1 - dy0);
        b.par.forEach(p => { c.strokeStyle = 'rgba(35,71,198,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(X(p.t) + 6, dy0 + p.y * (dy1 - dy0)); c.stroke(); }); }
      for (const b of dag) { const x = X(b.t), y = dy0 + b.y * (dy1 - dy0); c.fillStyle = '#2347c6'; c.fillRect(x - 6, y - 6, 12, 12); }
      const ls = lost.length ? lost.reduce((a, b) => a + b, 0) / lost.length : 0; $('c-lost').textContent = Math.round(ls * 100) + '%';
      if (rate < .6) { c.fillStyle = '#6f685a'; c.fillText('sped up so you can watch', w - 190, 20); }
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- 02 GHOSTDAG ---------- */
  (() => {
    const cv = $('gd-cv'); if (!cv) return;
    let G = fitCanvas(cv); addEventListener('resize', () => { G = fitCanvas(cv); });
    const vis = onScreen(cv);
    let nodes, id, playing = true, hiding = false, hideStart = 0, honestDuringHide = 0, nextH = 0, nextA = 0, color = {}, k = 3, released = [];
    const kEl = $('gd-k'); kEl.oninput = () => { k = +kEl.value; $('gd-k-o').textContent = k; recompute(); };
    function reset() { nodes = [{ id: 0, t: performance.now() / 1000 - 30, parents: [], lane: 2, genesis: true }]; id = 1; hiding = false; released = []; color = {}; msg('Honest blocks arrive and all see each other. Start a secret chain, wait a few seconds, then release it.'); syncBtns(); recompute(); }
    function msg(s) { $('gd-msg').textContent = s; }
    function syncBtns() { $('gd-hide').setAttribute('aria-pressed', hiding); $('gd-release').disabled = !hiding; $('gd-play').setAttribute('aria-pressed', playing); $('gd-play').textContent = 'Honest miners: ' + (playing ? 'on' : 'paused'); }
    const pub = () => nodes.filter(n => !n.secret);
    function tipsOf(set) { const has = new Set(); set.forEach(n => n.parents.forEach(p => has.add(p))); return set.filter(n => !has.has(n.id)); }
    function recompute() {
      const P = pub(); const byId = new Map(P.map(n => [n.id, n])); const past = new Map(), bs = new Map(), blues = new Map();
      for (const n of P) { // topo by time
        const pars = n.parents.filter(p => byId.has(p));
        const ps = new Set(); pars.forEach(p => { ps.add(p); past.get(p).forEach(x => ps.add(x)); }); past.set(n.id, ps);
        if (!pars.length) { bs.set(n.id, 1); blues.set(n.id, new Set([n.id])); continue; }
        const res = ghost(pars, past, bs, blues); bs.set(n.id, res.score); blues.set(n.id, res.blue);
      }
      const tips = tipsOf(P).map(n => n.id); const v = ghost(tips, past, bs, blues);
      color = {}; P.forEach(n => color[n.id] = v.blue.has(n.id) ? 'b' : 'r');
      $('gd-blue').textContent = P.filter(n => color[n.id] === 'b').length; $('gd-red').textContent = P.filter(n => color[n.id] === 'r').length;
      $('gd-sec').textContent = nodes.filter(n => n.secret).length;
      if (released.length) { const red = released.filter(i => color[i] === 'r').length;
        msg(red ? `Busted. ${red} of your ${released.length} secret blocks came out red: while you hid, more than k = ${k} honest blocks were made that they never saw.` : `Your ${released.length} released blocks squeaked in as blue: you didn't hide long enough to stand out. Try hiding longer, or lower k.`); }
    }
    function ghost(pars, past, bs, blues) {
      const sp = pars.reduce((a, b) => (bs.get(a) > bs.get(b) || (bs.get(a) === bs.get(b) && a < b)) ? a : b);
      const pastB = new Set(); pars.forEach(p => { pastB.add(p); past.get(p).forEach(x => pastB.add(x)); });
      const spPast = past.get(sp); const merge = [...pastB].filter(x => x !== sp && !spPast.has(x)).sort((a, b) => bs.get(a) - bs.get(b) || a - b);
      const blue = new Set(blues.get(sp)); blue.add(sp);
      const anti = (a, b) => a !== b && !past.get(a).has(b) && !past.get(b).has(a);
      for (const c of merge) {
        const ac = [...blue].filter(x => anti(x, c)); if (ac.length > k) continue;
        if (ac.every(x => [...blue].filter(y => anti(x, y)).length + 1 <= k)) blue.add(c);
      }
      return { score: blue.size, blue };
    }
    function laneFor(t) { const used = new Set(nodes.filter(n => !n.secret && Math.abs(n.t - t) < .9).map(n => n.lane)); for (const l of [2, 1, 3, 0, 4]) if (!used.has(l)) return l; return Math.floor(Math.random() * 5); }
    function addHonest(T) {
      const seen = pub().filter(n => T - n.t > .7 || n.genesis); const tips = tipsOf(seen);
      nodes.push({ id: id++, t: T, parents: tips.map(n => n.id), lane: laneFor(T) }); if (hiding) honestDuringHide++;
    }
    function addSecret(T) {
      const mine = nodes.filter(n => n.secret); const par = mine.length ? mine[mine.length - 1].id : tipsOf(pub())[0].id;
      nodes.push({ id: id++, t: T, parents: [par], lane: 5, secret: true }); KX.audio && KX.audio.note(180, .3, .03, 'sawtooth');
    }
    $('gd-play').onclick = () => { playing = !playing; syncBtns(); };
    $('gd-hide').onclick = () => { if (hiding) return; hiding = true; honestDuringHide = 0; released = []; nextA = performance.now() / 1000 + .8; msg('Mining in secret… nobody can see your blocks yet. Give it a few seconds.'); syncBtns(); };
    $('gd-release').onclick = () => { released = nodes.filter(n => n.secret).map(n => n.id); nodes.forEach(n => { n.secret = false; if (n.lane === 5) n.lane = 4.6; }); hiding = false; syncBtns(); recompute(); };
    $('gd-reset').onclick = reset;
    reset();
    function frame(now) {
      requestAnimationFrame(frame); if (!vis()) return; const T = now / 1000;
      if (!nextH) nextH = T + .5;
      if (playing && T >= nextH) { addHonest(T); nextH = T + .35 + -Math.log(1 - Math.random()) * .5; recompute(); }
      if (hiding && T >= nextA) { addSecret(T); nextA = T + .9 + Math.random() * .8; recompute(); }
      if (nodes.length > 70) { const drop = nodes.length - 70; const gone = new Set(nodes.slice(0, drop).map(n => n.id)); nodes = nodes.slice(drop); nodes.forEach(n => n.parents = n.parents.filter(p => !gone.has(p))); if (!nodes.some(n => n.genesis)) nodes[0].genesis = true; recompute(); }
      const { c, w, h } = G; c.clearRect(0, 0, w, h); const pps = w / 14, X = t => w - 30 - (T - t) * pps, Y = l => 30 + l * ((h - 60) / 5);
      c.fillStyle = 'rgba(194,52,28,.06)'; c.fillRect(0, Y(4.6) + 14, w, h);
      c.font = '11px JBMono, monospace'; c.fillStyle = '#6f685a'; c.fillText('hidden from everyone', 10, h - 8);
      const byId = new Map(nodes.map(n => [n.id, n]));
      for (const n of nodes) for (const p of n.parents) { const q = byId.get(p); if (!q) continue; c.strokeStyle = n.secret ? 'rgba(194,52,28,.6)' : 'rgba(27,25,20,.28)'; c.setLineDash(n.secret ? [4, 3] : []); c.beginPath(); c.moveTo(X(n.t), Y(n.lane)); c.lineTo(X(q.t), Y(q.lane)); c.stroke(); }
      c.setLineDash([]);
      for (const n of nodes) { const x = X(n.t), y = Y(n.lane); if (x < -10) continue;
        c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2);
        if (n.secret) { c.setLineDash([3, 3]); c.strokeStyle = '#c2341c'; c.lineWidth = 2; c.stroke(); c.setLineDash([]); }
        else { c.fillStyle = color[n.id] === 'r' ? '#c2341c' : '#2347c6'; c.fill(); if (released.includes(n.id)) { c.strokeStyle = '#1b1914'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.stroke(); } } }
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- 03 coins race ---------- */
  (() => {
    const btn = $('race'); if (!btn) return;
    const pays = [['Ana → café', 'coin #1'], ['Ben → bakery', 'coin #2'], ['Cy → bike shop', 'coin #3'], ['Dee → bookshop', 'coin #4'], ['Eli → cinema', 'coin #5']];
    const render = (el, list) => { el.innerHTML = list.map(p => `<div class="tx wait"><span>${p[0]}</span><span class="st">${p[1]}</span></div>`).join(''); return [...el.children]; };
    let busy = false;
    function setup() { const list = pays.slice(); if ($('dbl').checked) list.splice(3, 0, ['Ben again → arcade', 'coin #2']); return list; }
    function draw0() { const l = setup(); render($('tab-list'), l.map(p => [p[0], 'queued'])); render($('coin-list'), l); $('tab-clock').textContent = '0 steps'; $('coin-clock').textContent = '0 steps'; }
    $('dbl').onchange = () => !busy && draw0(); draw0();
    btn.onclick = async () => {
      if (busy) return; busy = true; const list = setup(); const tab = render($('tab-list'), list.map(p => [p[0], 'queued'])), coins = render($('coin-list'), list);
      const sleep = ms => new Promise(r => setTimeout(r, KX.reduced ? 0 : ms)); let step = 0;
      const seenC = new Set(); coins.forEach(n => n.classList.replace('wait', 'run')); await sleep(500);
      coins.forEach((n, i) => { const c = list[i][1]; const dup = seenC.has(c); seenC.add(c); n.classList.remove('run'); n.classList.add(dup ? 'no' : 'ok'); n.querySelector('.st').textContent = dup ? c + ' already spent ✕' : c + ' ✓'; });
      $('coin-clock').textContent = '1 step: every payment checked side by side';
      const seenT = new Set();
      for (let i = 0; i < tab.length; i++) { tab[i].classList.replace('wait', 'run'); tab[i].querySelector('.st').textContent = 'updating balance…'; await sleep(450);
        const who = list[i][0].split(' ')[0], dup = list[i][0].includes('again'); tab[i].classList.remove('run'); tab[i].classList.add(dup ? 'no' : 'ok'); tab[i].querySelector('.st').textContent = dup ? 'balance too low ✕' : 'done ✓'; seenT.add(who);
        step++; $('tab-clock').textContent = step + ' step' + (step > 1 ? 's' : '') + ': one at a time'; }
      busy = false;
    };
  })();

  /* ---------- 04 cheat calculator ---------- */
  (() => {
    const cv = $('att-cv'); if (!cv) return;
    let G = fitCanvas(cv); addEventListener('resize', () => { G = fitCanvas(cv); draw(); });
    const qEl = $('att-q'), zEl = $('att-z');
    if (url.searchParams.get('q')) qEl.value = url.searchParams.get('q');
    function logP(q, z) { // log10 of Nakamoto's catch-up probability after z blocks, summed in log space (no cancellation)
      if (q >= .5) return 0; if (z === 0) return 0; const p = 1 - q, lam = z * q / p, r = Math.log(q / p); const terms = []; let lp = -lam;
      for (let k = 0; k <= z + 400; k++) { if (k > 0) lp += Math.log(lam) - Math.log(k); terms.push(k <= z ? lp + (z - k) * r : lp); }
      const m = Math.max(...terms); const s = terms.reduce((a, t) => a + Math.exp(t - m), 0); return Math.min(0, (m + Math.log(s)) / Math.LN10);
    }
    function approxLog(q, z) { if (q >= .5) return 0; const v = logP(q, z); return isFinite(v) ? v : z * Math.log10(q / (1 - q)); }
    function human(l) { if (l >= -0.0001) return 'certain'; if (l > -2) return Math.round(10 ** l * 100) + '%';
      if (l > -12) return '1 in ' + KX.fmt(Math.round(10 ** -l)); return '1 in 10^' + Math.round(-l); }
    function draw() {
      const q = +qEl.value / 100, sec = +zEl.value; $('att-q-o').textContent = qEl.value + '%'; $('att-z-o').textContent = sec + ' s';
      const l = approxLog(q, sec * 10); $('att-p').textContent = human(l);
      const hon = S.hashTH; $('att-tag').textContent = hon ? 'live hashrate' : 'hashrate loading';
      $('att-need').textContent = q >= 1 ? '…' : hon ? KX.fmt(hon * q / (1 - q) / 1000) + ' PH/s' : (KX.S.online === false ? 'needs live data' : '…');
      const { c, w, h } = G; c.clearRect(0, 0, w, h); const L = 36, R = w - 12, T = 12, B = h - 26, maxD = 40;
      c.strokeStyle = 'rgba(27,25,20,.25)'; c.font = '10px JBMono, monospace'; c.fillStyle = '#6f685a';
      [0, -10, -20, -30, -40].forEach(d => { const y = T + (B - T) * (-d / maxD); c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke(); c.fillText(d === 0 ? '100%' : '1e' + d, 2, y + 3); });
      c.fillText('0 s', L, h - 8); c.fillText('wait →  120 s', R - 80, h - 8);
      c.strokeStyle = q >= .5 ? '#c2341c' : '#1b1914'; c.lineWidth = 2; c.beginPath();
      for (let s = 0; s <= 120; s += 1) { const y = T + (B - T) * Math.min(1, -approxLog(q, s * 10) / maxD), x = L + (R - L) * s / 120; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      const mx = L + (R - L) * sec / 120, my = T + (B - T) * Math.min(1, -l / maxD); c.fillStyle = '#c2341c'; c.beginPath(); c.arc(mx, my, 5, 0, Math.PI * 2); c.fill();
      if (q >= .5) { c.fillStyle = '#c2341c'; c.font = '600 13px Atkinson, sans-serif'; c.fillText('Majority: you win eventually, whatever the wait', L + 10, T + 22); }
    }
    qEl.oninput = () => { draw(); setParam('q', qEl.value); }; zEl.oninput = draw; KX.on('info', draw); KX.on('online', draw); draw();
    KX.on('info', () => { if (!S.hashTH) return; const hps = S.hashTH * 1e12; $('g-hash').textContent = (hps / 1e15).toFixed(0) + ' quadrillion';
      const yrs = hps / 8e9 / 31557600; $('g-years').textContent = yrs.toFixed(1) + ' years';
      $('r-hash').innerHTML = KX.fmt(S.hashTH / 1000) + ' <small>PH/s</small>'; });
  })();

  /* ---------- 05 savings jar ---------- */
  (() => {
    const ver = $('v-verdict'); if (!ver) return; let bal = 1000;
    const rules = [...document.querySelectorAll('#v-rules li')], amt = $('v-amt'), to = $('v-to'), keep = $('v-keep');
    const fmtK = n => KX.fmt(n, n % 1 ? 1 : 0) + ' KAS';
    function show() { $('v-bal').textContent = fmtK(bal); amt.max = Math.max(1, Math.ceil(bal)); $('v-amt-o').textContent = amt.value; }
    amt.oninput = show;
    function attempt(a, dest, keepRules, who) {
      rules.forEach(r => r.className = ''); ver.className = 'verdict';
      if (a > bal) { ver.textContent = `There's only ${fmtK(bal)} in the jar.`; return; }
      const change = +(bal - a).toFixed(2), big = a > 50;
      const r1 = !big || dest === 'save', r2 = !big || dest === 'save', r3 = change <= 0 || keepRules;
      void ver.offsetWidth;
      rules[0].className = !big ? 'pass' : '';
      rules[1].className = r2 ? 'pass' : 'fail'; rules[2].className = r3 ? 'pass' : 'fail';
      if (r1 && r2 && r3) { bal = change; ver.classList.add('ok'); ver.textContent = who === 'coffee' ? 'Approved. Enjoy the flat white.' : dest === 'save' ? `Approved: ${fmtK(a)} went to your savings address.` : `Approved: ${fmtK(a)} sent.`; KX.audio && KX.audio.note(660, .4, .05, 'sine'); }
      else { ver.classList.add('no'); const why = !r2 ? 'more than 50 KAS can only go to your savings address' : 'the change tried to escape the rules';
        ver.textContent = (who === 'thief' ? 'Nice try, thief. Refused: ' : 'Refused by every node on the network: ') + why + '.'; KX.audio && KX.audio.note(110, .5, .06, 'square'); }
      show();
    }
    document.querySelectorAll('[data-try]').forEach(b => b.onclick = () => {
      const t = b.dataset.try;
      if (t === 'coffee') attempt(4.5, 'any', true, t); if (t === 'rent') attempt(900, 'any', true, t); if (t === 'save') attempt(900, 'save', true, t);
      if (t === 'thief') attempt(bal, 'any', false, t); if (t === 'sneaky') attempt(40, 'any', false, t);
    });
    $('v-send').onclick = () => attempt(+amt.value, to.value, keep.checked, 'custom');
    $('v-refill').onclick = () => { bal = 1000; rules.forEach(r => r.className = ''); ver.className = 'verdict'; ver.textContent = 'Jar refilled. Pick a spend.'; show(); };
    show();
  })();
})();
