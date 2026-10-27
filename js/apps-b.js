/* Apps, part two: money supply, news, what's real, the quiz, words, doubts, and the fun stuff. */
(() => {
  const KX = window.KX, S = KX.S, K = window.KOS, A = KX.audio, { $, $$, esc, rnd } = K, D = window.KDATA;
  const alive = win => win.isConnected;
  const why = (sum, html) => `<details class="why"><summary>${sum}</summary>${html}</details>`;
  const dfmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------- Coin Piano (emission) ---------- */
  const TABLE = D.TABLE, MONTH = 2629800, NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const noteOf = i => { const n = 9 - i; return NAMES[((n % 12) + 12) % 12] + (4 + Math.floor(n / 12)); };
  const isBlack = i => NAMES[(((9 - i) % 12) + 12) % 12].includes('♯');
  const playF = i => Math.max(55, 1760 * Math.pow(2, -i / 12));
  let cur = 53, nextTs = 1793800527 * 1000, liveCur = false;
  KX.on('info', () => { if (S.reward) { const ps = Math.round(S.reward * 10 * 1e8); let best = 0; TABLE.forEach((v, i) => { if (Math.abs(v - ps) < Math.abs(TABLE[best] - ps)) best = i; }); cur = best; liveCur = true; } if (S.next) nextTs = S.next; });
  const startOf = i => nextTs - (cur + 1 - i) * MONTH * 1000;
  K.app('piano', { title: 'Coin Piano', icon: '🎹', color: '#5ac8fa', w: 720, h: 600, status: 'Every key is one month of new coins · from the real supply table in the node code',
    render(b, win) {
      b.innerHTML = `<p class="kick">Play the money supply.</p><p class="lead">Kaspa makes new coins every block, and the amount drops a little <b>every month</b>, forever, until it's basically zero. The drop is exactly one piano semitone a month, so a year of it is one octave. You can literally play it. Tap any key.</p>
        <div class="row"><button class="btn sky" id="k-play" type="button">▶ Play the story so far</button><button class="btn sm" id="k-all" type="button">▶▶ Play all the way to zero</button><span class="tag ${liveCur ? 'live' : 'sim'}" id="k-tag">${liveCur ? 'live: matched to today\'s payout' : 'estimate until live data loads'}</span></div>
        <div class="pk-wrap" tabindex="0" aria-label="Piano of all 426 monthly payout steps. Scroll sideways."><canvas id="pk-cv" aria-label="Piano keys: one per month, getting shorter as the payout shrinks"></canvas></div>
        <p id="k-hover" class="panel" style="font-size:14px;margin-top:10px" aria-live="polite">Tap a key to hear that month.</p>
        <div class="stats"><div class="stat"><b id="k-now">…</b><span>new KAS a second right now</span></div><div class="stat"><b id="k-note">…</b><span>today's note</span></div><div class="stat"><b id="k-circ">…</b><span>KAS that exist (<span id="k-pct">…</span> of the max)</span></div><div class="stat"><b id="k-next">…</b><span>next step down</span></div></div>
        ${why('Why a semitone?', `<p>The node software has a table of 426 monthly payouts. Each is the previous one times 2<sup>−1/12</sup>, which is precisely the ratio between two neighbouring piano keys. Twelve steps halve it. Bitcoin halves suddenly every four years; Kaspa slides down smoothly, one key a month. The max that will ever exist is about 28.7 billion KAS.</p><p class="src">Source: <a href="https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/coinbase.rs" target="_blank" rel="noopener">coinbase.rs in rusty-kaspa</a>. Dates on keys are approximate.</p>`)}`;
      const cv = $('#pk-cv', b); let G, lit = -1, timer = 0;
      function fit() { const dpr = Math.min(2, devicePixelRatio || 1), w = Math.max(b.clientWidth - 30, 1400), h = 200; cv.style.width = w + 'px'; cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); G = { c, w, h }; draw(); }
      function draw() { if (!G) return; const { c, w, h } = G, n = TABLE.length, kw = (w - 20) / n, base = h - 26, top = 28; c.fillStyle = '#120b2c'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < n; i++) { const x = 10 + i * kw, bh = (base - top) * Math.sqrt(TABLE[i] / TABLE[0]);
          c.fillStyle = i === lit ? '#ff5fa2' : i === cur ? '#ffd23f' : i < cur ? (isBlack(i) ? '#1fb89b' : '#49eacb') : (isBlack(i) ? '#3d3560' : '#6b5fa0');
          c.fillRect(x, base - Math.max(2, bh), Math.max(1, kw - .5), Math.max(2, bh)); }
        c.font = '10px JB, monospace'; c.fillStyle = '#c9c2da'; for (let i = 0; i < n; i += 24) { const x = 10 + i * kw; c.fillText(new Date(startOf(i)).getUTCFullYear(), x, h - 8); c.fillRect(x, base + 3, 1, 5); }
        const cx = 10 + cur * kw; c.fillStyle = '#ffd23f'; c.font = '700 12px JB, monospace'; c.fillText('▼ you are here: ' + noteOf(cur), Math.max(4, Math.min(cx - 6, w - 170)), 16);
        c.fillStyle = '#49eacb'; c.fillText('already played', 12, 16); c.fillStyle = '#a99ee0'; c.fillText('…still to come, quieter and quieter', w - 270, 16); }
      new ResizeObserver(fit).observe(b); fit();
      function upd() { if (!alive(win)) return; const kas = TABLE[cur] / 1e8; $('#k-now', b).textContent = kas.toFixed(2); $('#k-note', b).textContent = noteOf(cur);
        $('#k-next', b).textContent = new Date(nextTs).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        if (S.circ) { $('#k-circ', b).textContent = (S.circ / 1e9).toFixed(2) + 'bn'; $('#k-pct', b).textContent = (S.circ / S.max * 100).toFixed(1) + '%'; } else { $('#k-circ', b).textContent = S.online === false ? 'offline' : '…'; }
        const t = $('#k-tag', b); t.className = 'tag ' + (liveCur ? 'live' : 'sim'); t.textContent = liveCur ? 'live: matched to today\'s payout' : 'estimate until live data loads'; draw(); }
      KX.on('info', upd); upd();
      const hint = i => { const d = new Date(startOf(i)); $('#k-hover', b).textContent = `Month ${i + 1} (${d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}, approx.): ${(TABLE[i] / 1e8).toFixed(i > 200 ? 6 : 2)} new KAS a second. Note ${noteOf(i)}.${i < cur ? ' Already happened.' : i === cur ? ' That\'s now.' : ' Still to come.'}`; };
      cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), i = Math.max(0, Math.min(TABLE.length - 1, Math.floor((e.clientX - r.left - 10) / ((r.width - 20) / TABLE.length))));
        lit = i; draw(); if (!A.on) A.set(true); A.note(playF(i), .6, .06, 'sine'); hint(i); });
      const run = (to, ms) => { if (timer) return; if (!A.on) A.set(true); let i = 0; timer = setInterval(() => { if (!alive(win)) { clearInterval(timer); return; } lit = i; draw(); A.note(playF(i), .2, .05, 'triangle'); i += to > 100 ? 2 : 1;
        if (i > to) { clearInterval(timer); timer = 0; setTimeout(() => { lit = -1; draw(); }, 400); if (to >= cur) K.award('pianist'); $('#k-hover', b).textContent = to > cur ? 'That\'s the whole thing: about 35 years, sliding to silence. The last notes are below human hearing, which feels right.' : `That was ${cur + 1} months of Kaspa, ten notes a second, the same speed blocks arrive. Each note was quieter money than the last.`; } }, ms); };
      $('#k-play', b).onclick = () => run(cur, 100); $('#k-all', b).onclick = () => run(TABLE.length - 1, 45);
    } });

  /* ---------- Overheard (X feed) ---------- */
  const tcls = t => /test/.test(t) ? 't-test' : /propos|announc/.test(t) ? 't-page' : /milestone|dev/.test(t) ? 't-live' : 't-talk';
  K.app('feed', { title: 'Overheard · builders on X', icon: '👂', color: '#ffd23f', w: 560, h: 640, status: 'Real posts by people building on Kaspa · the plain-English lines are ours',
    render(b) {
      b.innerHTML = `<p class="kick">What builders said, translated into human.</p><p class="muted" id="f-upd">Loading…</p><div class="row" role="group" aria-label="Filter posts"><button class="btn sm" data-f="all" aria-pressed="true" type="button">All</button><button class="btn sm" data-f="t-live" aria-pressed="false" type="button">Shipped</button><button class="btn sm" data-f="t-test" aria-pressed="false" type="button">Testing</button><button class="btn sm" data-f="t-page" aria-pressed="false" type="button">Promised</button></div><div id="f-list"></div>`;
      fetch('data/x-feed.json', { cache: 'no-cache' }).then(r => r.json()).then(d => {
        $('#f-upd', b).textContent = 'Updated ' + dfmt(d.updated) + ' · we only translate; we never post.';
        $('#f-list', b).innerHTML = d.items.map(p => `<article class="post" data-c="${tcls(p.tag)}"><div class="who"><a href="https://x.com/${esc(p.handle)}" rel="noopener" target="_blank">@${esc(p.handle)}</a><time datetime="${esc(p.date)}">${dfmt(p.date)}</time></div>
          <p class="plain">${esc(p.plain)}</p>${p.caveat ? `<p class="cav">⚠️ ${esc(p.caveat)}</p>` : ''}
          <details><summary class="muted">What they actually wrote</summary><blockquote>${esc(p.text)}</blockquote></details>
          <div class="meta"><span class="tlab ${tcls(p.tag)}">${esc(p.tag)}</span><a href="${esc(p.url)}" rel="noopener" target="_blank">Read on X ↗</a></div></article>`).join('');
        $$('[data-f]', b).forEach(x => x.onclick = () => { $$('[data-f]', b).forEach(y => y.setAttribute('aria-pressed', y === x)); $$('.post', b).forEach(p => p.hidden = x.dataset.f !== 'all' && p.dataset.c !== x.dataset.f); });
      }).catch(() => { $('#f-list', b).innerHTML = '<p class="panel">The feed file didn\'t load. Try again in a moment.</p>'; });
    } });

  /* ---------- Real or Not ---------- */
  const COLS = { live: 'Live on mainnet', test: 'Testing', page: 'On paper', comp: 'Research / announced' };
  K.app('real', { title: 'Real or Not?', icon: '🕵️', color: '#ff8a3d', w: 600, h: 640, status: 'Every answer links to its receipt',
    render(b) {
      let deck = D.items.slice().sort(() => Math.random() - .5).slice(0, 8), i = 0, score = 0;
      const board = () => `<div class="row" role="group" aria-label="Filter"><button class="btn sm" data-c="all" aria-pressed="true" type="button">All</button>${Object.entries(COLS).map(([k, n]) => `<button class="btn sm" data-c="${k}" aria-pressed="false" type="button">${n}</button>`).join('')}</div>
        <div class="board">${Object.entries(COLS).map(([k, n]) => `<div class="col ${k}" data-col="${k}"><h4>${n}</h4>${D.items.filter(x => x[0] === k).map(x => `<div class="item"><b>${esc(x[1])}</b><p>${esc(x[2])}</p><span class="muted">${esc(x[3])} · <a href="${esc(x[5])}" target="_blank" rel="noopener">${esc(x[4])} ↗</a></span></div>`).join('')}</div>`).join('')}</div>`;
      function card() {
        if (i >= deck.length) { if (score >= 5) K.award('real');
          b.innerHTML = `<div class="card"><h3>${score} / ${deck.length}</h3><p>${score >= 7 ? 'Elite. You can smell a roadmap from across the room.' : score >= 5 ? 'Solid. Most people online do worse.' : 'Crypto Twitter got you. Happens to the best of us.'}</p><div class="row" style="justify-content:center"><button class="btn orange" id="r-again" type="button">Play again</button></div></div><h3 class="kick" style="margin-top:16px">The full board: shipped vs promised</h3>${board()}`;
          $('#r-again', b).onclick = () => { deck = D.items.slice().sort(() => Math.random() - .5).slice(0, 8); i = 0; score = 0; card(); };
          $$('[data-c]', b).forEach(x => x.onclick = () => { $$('[data-c]', b).forEach(y => y.setAttribute('aria-pressed', y === x)); $$('.col', b).forEach(c => c.hidden = x.dataset.c !== 'all' && c.dataset.col !== x.dataset.c); }); return; }
        const it = deck[i];
        b.innerHTML = `<p class="kick">Can you use it on the real network today?</p><p class="muted">Card ${i + 1} of ${deck.length} · score ${score}</p><div class="card"><h3>${esc(it[1])}</h3><p class="muted">Real on the main network, or still being tested, written up, or announced?</p></div>
          <div class="guess"><button class="btn kas" data-g="y" type="button">✅ Real, live today</button><button class="btn pink" data-g="n" type="button">🔮 Not yet</button></div><div class="verdict" id="r-v" aria-live="polite" hidden></div><p><button class="btn sm" id="r-skip" type="button">Skip to the full board →</button></p>`;
        $('#r-skip', b).onclick = () => { i = deck.length; card(); };
        $$('[data-g]', b).forEach(x => x.onclick = () => { const live = it[0] === 'live', ok = (x.dataset.g === 'y') === live; if (ok) { score++; K.yay(); } else K.nope();
          $$('[data-g]', b).forEach(y => y.disabled = true); const v = $('#r-v', b); v.hidden = false; v.className = 'verdict ' + (ok ? 'ok' : 'no');
          v.innerHTML = `${ok ? 'Correct!' : 'Nope.'} It's <b>${COLS[it[0]]}</b> (${esc(it[3])}). ${esc(it[2])} <a href="${esc(it[5])}" target="_blank" rel="noopener">Receipt: ${esc(it[4])} ↗</a> <button class="btn sm" id="r-next" type="button">Next →</button>`;
          $('#r-next', b).onclick = () => { i++; card(); }; $('#r-next', b).focus(); });
      }
      card();
    } });

  /* ---------- Pub Quiz ---------- */
  const QS = [
    ['Roughly how many blocks does Kaspa make a second?', ['1', '10', '1,000'], 1, 'About ten a second, since May 2025. Bitcoin makes one every ten minutes or so.'],
    ['Two miners make a block at the same moment. Kaspa…', ['throws one away', 'keeps both and puts them in order', 'asks a committee'], 1, 'Keeps both. That\'s the "DAG" part: a block can point back to several blocks at once.'],
    ['Someone mines blocks in secret, then reveals them. What happens?', ['They take over', 'Their blocks stand out and go to the back of the line', 'Nothing, nobody can tell'], 1, 'Their blocks never saw the honest ones, so the ordering rule (GHOSTDAG) marks them red.'],
    ['Coins that carry rules ("covenants") are…', ['a future promise', 'live on the real network since June 2026', 'illegal'], 1, 'Live since the Toccata upgrade. That\'s The Jar.'],
    ['DAGKnight is…', ['live today', 'a proposed upgrade, on paper for now', 'a crypto influencer'], 1, 'A proposed next upgrade with a published paper. Not live. Anyone who says otherwise is early.'],
    ['How do new coins per block change over time?', ['They grow', 'They shrink a little every month', 'They stay the same forever'], 1, 'One semitone a month, which halves it every year. Go play it on the Coin Piano.'],
    ['What does this site say about the price?', ['Moon soon', 'Nothing. On purpose.', 'Sell everything'], 1, 'Correct. Nobody here knows, and anyone who says they know is selling something.'],
  ];
  K.app('quiz', { title: 'Pub Quiz', icon: '🍺', color: '#ff5fa2', w: 540, h: 600, status: 'Pass and you\'re certified to explain Kaspa at the pub',
    render(b) {
      let i = 0, score = 0;
      function q() {
        if (i >= QS.length) { const pass = score >= 5; if (pass) { K.award('grad'); K.rain(['🍺', '🎓', '🟩'], 50); }
          const blk = S.blueScore ? KX.fmt(S.blueScore) : 'a moment in time';
          b.innerHTML = pass ? `<div class="cert"><div class="seal" aria-hidden="true">🍺</div><h3>Certified Pub Explainer</h3><p>This certifies that <b>you</b> answered ${score} of ${QS.length} and may now explain Kaspa to a friend over one (1) drink, without mentioning the price.</p><p class="muted">Stamped at block <b>${blk}</b> · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p class="muted">Not a real qualification. Neither are most.</p></div><div class="row" style="justify-content:center"><button class="btn pink" id="q-share" type="button">📸 Share my certificate</button><button class="btn sm" id="q-again" type="button">Retake</button></div>
            <div class="panel" style="margin-top:12px"><b>Your 20-second pub explanation:</b><br>"Bitcoin makes a block every ten minutes, because if it went faster, blocks would clash and get thrown away. Kaspa keeps the clashing blocks and uses a clever rule to put them in a fair order, so it can do ten a second. Same kind of mining security, much faster. And since this summer, coins can carry their own rules."</div>`
            : `<div class="card"><h3>${score} / ${QS.length}</h3><p>Close! You need 5 to get certified. The bartender believes in you.</p></div><div class="row" style="justify-content:center"><button class="btn pink" id="q-again" type="button">Try again</button></div>`;
          $('#q-again', b).onclick = () => { i = 0; score = 0; q(); }; const sh = $('#q-share', b); if (sh) sh.onclick = () => K.share('I just got certified to explain Kaspa at the pub. ' + score + '/' + QS.length + '.'); return; }
        const [txt, raw, rawAns, exp] = QS[i];
        const order = raw.map((_, j) => j).sort(() => Math.random() - .5), opts = order.map(j => raw[j]), ans = order.indexOf(rawAns);
        b.innerHTML = `<p class="muted">Question ${i + 1} of ${QS.length} · score ${score}</p><p class="kick">${txt}</p><div class="q-opts">${opts.map((o, j) => `<button class="btn" data-o="${j}"${j === ans ? ' data-ok' : ''} type="button">${'ABC'[j]}. ${o}</button>`).join('')}</div><div class="verdict" id="q-v" hidden aria-live="polite"></div>`;
        $$('[data-o]', b).forEach(x => x.onclick = () => { const ok = +x.dataset.o === ans; if (ok) { score++; K.yay(); } else K.nope(); $$('[data-o]', b).forEach(y => { y.disabled = true; if (+y.dataset.o === ans) y.classList.add('kas'); });
          if (!ok) x.classList.add('red'); const v = $('#q-v', b); v.hidden = false; v.className = 'verdict ' + (ok ? 'ok' : 'no'); v.innerHTML = (ok ? '🎉 ' : '🙃 ') + exp + ' <button class="btn sm" id="q-n" type="button">Next →</button>'; $('#q-n', b).onclick = () => { i++; q(); }; $('#q-n', b).focus(); });
      }
      q();
    } });

  /* ---------- Jargon Buster ---------- */
  const TERMS = [
    ['Block', 'A page of payments, stamped and added to the shared record.', 'Like a page in a diary, if the diary had 10 new pages a second.'],
    ['Blockchain', 'Pages in a single line, each pointing to the one before.', 'One lane of traffic. Works great until rush hour.'],
    ['BlockDAG', 'Pages that can point back to several earlier pages at once, so pages made at the same moment can all be kept. Kaspa is one.', 'A family tree where kids can have lots of parents. Very modern.'],
    ['Miner', 'A computer that competes to make the next block by guessing a winning number.', 'No pickaxes involved. Mostly fans and electricity bills.'],
    ['Hashrate', 'How many guesses per second all the miners make together. More guessing power = harder to cheat.', 'The network\'s muscles. Shown live in Heist Planner.'],
    ['Proof of work', 'Security from real-world effort: to rewrite history you\'d have to out-guess everyone.', 'Bitcoin uses it. So does Kaspa.'],
    ['GHOSTDAG', 'Kaspa\'s rule for putting all those parallel blocks in one fair order. Well-connected blocks are "blue"; ones that hid are "red".', 'Also my name, roughly. Boo. – Dag'],
    ['Orphan block', 'On a normal chain, a block that lost a tie and got thrown away.', 'Kaspa doesn\'t have these. Check the Orphan Bin. Empty.'],
    ['Coins (UTXOs)', 'Your balance is a pile of specific coins, not one number. Payments spend specific coins.', 'Why Checkout Rush can check payments side by side.'],
    ['Covenant', 'A rule stored inside a coin about where it may go next. Live since June 2026.', 'A jar that tells thieves no. Try it.'],
    ['Mainnet / testnet', 'The real network vs a practice one with play money.', 'If someone says "on testnet", it\'s a rehearsal, not the show.'],
    ['KIP', 'A written proposal to change Kaspa. Being written down doesn\'t make it live.', 'A KIP is a recipe, not a meal.'],
    ['Finality', 'When a block can no longer be reorganised. Kaspa treats about 12 hours as final; in practice odds of reversal collapse in seconds.', 'The point of no return.'],
    ['DAGKnight', 'A proposed next upgrade that adapts to real network speed. On paper and in testing, not live.', '"wen DAGKnight?" is a whole personality on X.'],
    ['Sompi', 'The smallest piece of a KAS: one hundred-millionth.', 'Fun to say. Try it. Sompi.'],
    ['KCC-20', 'A shared recipe for making tokens with covenants. Final since October 2026.', 'Like a standard plug shape, so apps fit together.'],
  ];
  const HYPE = [[/to the moon|moon(ing)?/gi, 'go up in price (nobody knows)'], [/\bwagmi\b/gi, 'I hope this works out for everyone'], [/\bngmi\b/gi, 'I think that person is making a mistake'], [/\bgm\b/gi, 'good morning'],
    [/\bwen\b/gi, 'when will it be finished'], [/\bfud\b/gi, 'criticism I don\'t like'], [/\bhodl\b/gi, 'keep holding it'], [/\bape(d)? in(to)?\b/gi, 'bought without research'], [/\bbullish\b/gi, 'excited'], [/\bbearish\b/gi, 'worried'],
    [/\bbased\b/gi, 'I agree'], [/\blfg\b/gi, 'let\'s go'], [/\bdyor\b/gi, 'check it yourself'], [/\bnfa\b/gi, 'not financial advice'], [/\bsoon(tm|™)?\b/gi, 'at some unknown date'], [/\bto the moon\b/gi, 'up']];
  K.app('jargon', { title: 'Jargon Buster', icon: '📖', color: '#a685ff', w: 620, h: 620, status: 'Plain English for the words people throw around',
    render(b) {
      b.innerHTML = `<p class="kick">Tap a word. Get plain English.</p><div class="terms">${TERMS.map((t, i) => `<button class="btn sm term" data-i="${i}" type="button">${esc(t[0])}</button>`).join('')}</div>
        <div class="def panel" id="d-out" aria-live="polite"><h3>Pick one ☝️</h3><p>No jargon was harmed in the making of these definitions.</p></div>
        <h3 class="kick" style="margin-top:18px">🗯️ Hype translator</h3><p class="muted">Paste a crypto post. Get what it means.</p>
        <label class="sr" for="h-in">Text to translate</label><textarea id="h-in" rows="3" style="width:100%;border:2.5px solid var(--ink);border-radius:10px;padding:8px;font:inherit">gm. wen DAGKnight? bullish af, wagmi, dyor nfa 🚀 to the moon</textarea>
        <div class="row"><button class="btn violet" id="h-go" type="button">Translate</button></div><div class="verdict" id="h-out" aria-live="polite"></div>`;
      $$('[data-i]', b).forEach(x => x.onclick = () => { const t = TERMS[+x.dataset.i]; $('#d-out', b).innerHTML = `<h3>${esc(t[0])}</h3><p>${esc(t[1])}</p><p class="joke">${esc(t[2])}</p>`; K.blip(); });
      $('#h-go', b).onclick = () => { let s = $('#h-in', b).value; HYPE.forEach(([re, r]) => s = s.replace(re, r)); s = s.replace(/🚀/g, '(rocket emoji, means "I\'m excited")').replace(/\baf\b/gi, 'very'); $('#h-out', b).textContent = s.trim() || 'Nothing to translate. Very calm of you.'; K.blip(660); };
      $('#h-go', b).click();
    } });

  /* ---------- Doubts.txt ---------- */
  const DOUBTS = [['Speed costs something', 'Ten blocks a second means more data for every computer that checks the network. Push too far and only big operators can afford to check.', 'lots of independent people running nodes.'],
    ['Who pays miners later?', 'The new-coin payout halves every year. Eventually fees have to pay for security, and today fees are tiny.', 'real fee income growing over years.'],
    ['Electricity is the bill', 'Proof of work buys security with power and chips. Faster blocks don\'t make that bill smaller.', 'nothing settles this. It\'s the design.'],
    ['Mining is concentrated', 'Few companies make the special mining chips, and mining pools cluster.', 'production spread across many hands over time.'],
    ['Roadmaps aren\'t products', 'DAGKnight, "verifiable programs" and the finance apps are separate projects on separate timelines. A demo of one proves nothing about the others.', 'main-network releases people use twice.'],
    ['Cool tech, real users?', 'Cheap, fast payments are what apps need to exist. They aren\'t proof anyone wants those apps.', 'people coming back because it\'s better than an ordinary website.']];
  K.app('doubts', { title: 'doubts.txt · Notepad', icon: '📝', color: '#fffaf0', w: 560, h: 560, status: 'A fan site that only cheers is useless',
    render(b) { K.award('skeptic');
      b.innerHTML = `<div class="note">REASONS TO BE SKEPTICAL.txt\n(written by fans, which is exactly why it's here)\n${DOUBTS.map((d, i) => `<h3>${i + 1}. ${esc(d[0])}</h3><p>${esc(d[1])}\n→ Watch for: ${esc(d[2])}</p>`).join('')}\n<h3>7. This website</h3><p>Is made by fans. It tries hard to be accurate and links every claim. Check the receipts anyway.</p></div>`; } });

  /* ---------- Orphan Bin ---------- */
  K.app('bin', { title: 'Orphan Bin', icon: '🗑️', color: '#5ac8fa', w: 440, h: 440, status: '0 items · and it will stay that way',
    render(b) { K.award('bin');
      const n = S.blueScore && S.firstScore ? KX.fmt(S.blueScore - S.firstScore) : 'thousands of';
      b.innerHTML = `<div class="bin-big" aria-hidden="true">🗑️</div><p class="kick" style="text-align:center">This bin is empty.</p><div class="binlist">Thrown-away blocks: 0\nBlocks added since you arrived: ${n}\nOf those, kept: all of them.</div>
        <p>On a normal blockchain this bin would be full: every time two blocks tie, one gets tossed ("orphaned"), along with the electricity that made it. Kaspa keeps every block and just puts them in order. So: nothing to see here. Literally.</p><p class="muted">Blocks that try to cheat aren't binned either. They're kept, labelled red, and sent to the back of the line.</p>`; } });

  /* ---------- Sticker Book ---------- */
  K.app('stickers', { title: 'Sticker Book', icon: '⭐', color: '#ffd23f', w: 620, h: 560, status: 'Saved on this device only',
    render(b, win) {
      const draw = () => { if (!alive(win)) return; const n = K.got.size, T = K.STICKERS.length;
        b.innerHTML = `<p class="kick">${n} of ${T} stickers</p><div class="prog" aria-hidden="true"><i style="width:${n / T * 100}%"></i></div><p class="muted">Poke things to earn them. Each one means you understood something (or found something silly).</p>
          <div class="stickers">${K.STICKERS.map(([id, e, name, d, c], i) => { const g = K.got.has(id); return `<div class="stk ${g ? 'got' : ''}" style="--c:${c};--rot:${(i % 2 ? 2 : -2) * (1 + i % 3) / 2}deg"><span class="e" aria-hidden="true">${e}</span><b>${g ? esc(name) : '???'}</b><br>${g ? esc(d) : (['gm', 'konami'].includes(id) ? 'Hidden. Think like a crypto person.' : esc(d))}</div>`; }).join('')}</div>`; };
      draw(); KX.on('sticker', draw);
    } });

  /* ---------- Receipts ---------- */
  const RECEIPTS = [['The GHOSTDAG / PHANTOM paper', 'https://eprint.iacr.org/2018/104'], ['10 blocks a second (Crescendo): rusty-kaspa v1.0.0', 'https://github.com/kaspanet/rusty-kaspa/releases/tag/v1.0.0'], ['KIP-14: the Crescendo upgrade', 'https://github.com/kaspanet/kips/blob/master/kip-0014.md'],
    ['k = 124 at 10 blocks a second (bps.rs)', 'https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/core/src/config/bps.rs'], ['Finality of 12 hours (constants.rs)', 'https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/core/src/config/constants.rs'],
    ['Toccata: covenants live, rusty-kaspa v2.0.0', 'https://github.com/kaspanet/rusty-kaspa/releases/tag/v2.0.0'], ['KIP-17: covenants', 'https://github.com/kaspanet/kips/blob/master/kip-0017.md'], ['SilverScript releases', 'https://github.com/kaspanet/silverscript/releases'],
    ['KCC-20 token standard', 'https://github.com/kaspanet/kccs/blob/main/kcc-0020.md'], ['The supply table (coinbase.rs)', 'https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/coinbase.rs'], ['Bitcoin paper, section 11 (the heist maths)', 'https://bitcoin.org/bitcoin.pdf'],
    ['DAGKnight paper', 'https://eprint.iacr.org/2022/1494'], ['KIP-2: DAGKnight, status Proposed', 'https://github.com/kaspanet/kips/blob/master/kip-0002.md'], ['Live numbers: api.kaspa.org', 'https://api.kaspa.org/docs'], ['Block explorer', 'https://explorer.kaspa.org']];
  K.app('receipts', { title: 'Receipts', icon: '🧾', color: '#b8f35a', w: 520, h: 560, status: 'If a claim has no receipt, it\'s a bug',
    render(b) { b.innerHTML = `<p class="kick">Where every fact comes from.</p><ol style="padding-left:20px">${RECEIPTS.map(r => `<li style="margin:6px 0"><a href="${r[1]}" target="_blank" rel="noopener">${esc(r[0])} ↗</a></li>`).join('')}</ol><p class="muted">The "shipped vs promised" list has its own receipts in Real or Not.</p>`; } });

  /* ---------- About ---------- */
  K.app('about', { title: 'About KaspOS', icon: 'ℹ️', color: '#49eacb', w: 480, h: 520, status: 'Version 10 (blocks a second)',
    render(b) { b.innerHTML = `<p class="kick">KaspOS is a pretend computer.</p><p>Every app is a toy that explains one idea about Kaspa, a fast proof-of-work network. The wallpaper is the real network beating live.</p>
      <p><b>Not an official Kaspa site.</b> Made by fans, not affiliated with any Kaspa team. Not investment advice: there are no prices here, on purpose.</p>
      <p>Live numbers come from the public <a href="https://api.kaspa.org/docs" target="_blank" rel="noopener">api.kaspa.org</a>. If it's unreachable, the blocks are simulated and labelled that way. X posts belong to their authors; the plain-English lines are ours.</p>
      <p class="muted">Keyboard: type words like <b>gm</b> or <b>wen</b>. Press <b>Esc</b> to close a window. No tracking. Stickers are stored on this device only.</p>`; } });

  /* ---------- The Lake (type "price") ---------- */
  K.app('lake', { title: 'price.exe', icon: '🌊', color: '#5ac8fa', w: 460, h: 420, status: 'Current price: a lake',
    render(b) { b.innerHTML = `<div style="font-size:70px;text-align:center;line-height:1.1" aria-hidden="true">🏞️</div><p class="kick" style="text-align:center">Here is a calm lake instead.</p><p>You were looking for a price. We don't show one, because a price can't tell you how something works, and that's all this site is for.</p><p>Breathe in. A duck floats by. 🦆 Somewhere, about ten Kaspa blocks were just made. You didn't need to watch.</p><p class="muted">Feel better? Go rob The Jar.</p>`; } });

  /* ---------- error ---------- */
  K.app('error', { title: 'Error', icon: '⚠️', color: '#ff4d4d', w: 380, h: 250, status: '',
    render(b, win, arg) { b.innerHTML = `<p class="kick">${esc(arg || 'Something went wrong.')}</p><div class="row"><button class="btn" type="button" id="e-ok">OK</button></div>`; $('#e-ok', b).onclick = () => win.querySelector('.x').click(); } });
})();
