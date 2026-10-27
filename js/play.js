/* Emission keyboard, the X feed, and the status board. */
(() => {
  const KX = window.KX, S = KX.S, $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dfmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------- 06 emission keyboard ---------- */
  // SUBSIDY_BY_MONTH_TABLE from rusty-kaspa consensus/src/processes/coinbase.rs, in sompi per second (1 KAS = 100,000,000 sompi)
  const TABLE = [44000000000,41530469757,39199543598,36999442271,34922823143,32962755691,31112698372,29366476791,27718263097,26162556530,24694165062,23308188075,22000000000,20765234878,19599771799,18499721135,17461411571,16481377845,15556349186,14683238395,13859131548,13081278265,12347082531,11654094037,11000000000,10382617439,9799885899,9249860567,8730705785,8240688922,7778174593,7341619197,6929565774,6540639132,6173541265,5827047018,5500000000,5191308719,4899942949,4624930283,4365352892,4120344461,3889087296,3670809598,3464782887,3270319566,3086770632,2913523509,2750000000,2595654359,2449971474,2312465141,2182676446,2060172230,1944543648,1835404799,1732391443,1635159783,1543385316,1456761754,1375000000,1297827179,1224985737,1156232570,1091338223,1030086115,972271824,917702399,866195721,817579891,771692658,728380877,687500000,648913589,612492868,578116285,545669111,515043057,486135912,458851199,433097860,408789945,385846329,364190438,343750000,324456794,306246434,289058142,272834555,257521528,243067956,229425599,216548930,204394972,192923164,182095219,171875000,162228397,153123217,144529071,136417277,128760764,121533978,114712799,108274465,102197486,96461582,91047609,85937500,81114198,76561608,72264535,68208638,64380382,60766989,57356399,54137232,51098743,48230791,45523804,42968750,40557099,38280804,36132267,34104319,32190191,30383494,28678199,27068616,25549371,24115395,22761902,21484375,20278549,19140402,18066133,17052159,16095095,15191747,14339099,13534308,12774685,12057697,11380951,10742187,10139274,9570201,9033066,8526079,8047547,7595873,7169549,6767154,6387342,6028848,5690475,5371093,5069637,4785100,4516533,4263039,4023773,3797936,3584774,3383577,3193671,3014424,2845237,2685546,2534818,2392550,2258266,2131519,2011886,1898968,1792387,1691788,1596835,1507212,1422618,1342773,1267409,1196275,1129133,1065759,1005943,949484,896193,845894,798417,753606,711309,671386,633704,598137,564566,532879,502971,474742,448096,422947,399208,376803,355654,335693,316852,299068,282283,266439,251485,237371,224048,211473,199604,188401,177827,167846,158426,149534,141141,133219,125742,118685,112024,105736,99802,94200,88913,83923,79213,74767,70570,66609,62871,59342,56012,52868,49901,47100,44456,41961,39606,37383,35285,33304,31435,29671,28006,26434,24950,23550,22228,20980,19803,18691,17642,16652,15717,14835,14003,13217,12475,11775,11114,10490,9901,9345,8821,8326,7858,7417,7001,6608,6237,5887,5557,5245,4950,4672,4410,4163,3929,3708,3500,3304,3118,2943,2778,2622,2475,2336,2205,2081,1964,1854,1750,1652,1559,1471,1389,1311,1237,1168,1102,1040,982,927,875,826,779,735,694,655,618,584,551,520,491,463,437,413,389,367,347,327,309,292,275,260,245,231,218,206,194,183,173,163,154,146,137,130,122,115,109,103,97,91,86,81,77,73,68,65,61,57,54,51,48,45,43,40,38,36,34,32,30,28,27,25,24,22,21,20,19,18,17,16,15,14,13,12,12,11,10,10,9,9,8,8,7,7,6,6,6,5,5,5,4,4,4,4,3,3,3,3,3,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,0];
  const MONTH = 2629800, NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const noteOf = i => { const n = 9 - i; return NAMES[((n % 12) + 12) % 12] + (4 + Math.floor(n / 12)); };
  const isBlack = i => NAMES[(((9 - i) % 12) + 12) % 12].includes('♯');
  let cur = 53, nextTs = 1793800513 * 1000;
  const cv = $('keys-cv'); let G;
  const startOf = i => nextTs - (cur + 1 - i) * MONTH * 1000;
  function fit() { const dpr = Math.min(2, devicePixelRatio || 1), w = Math.max(cv.parentElement.clientWidth, 1100), h = 230; cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); G = { c, w, h }; draw(); }
  let lit = -1;
  function draw() {
    if (!G) return; const { c, w, h } = G, n = TABLE.length, kw = (w - 20) / n, base = h - 28, top = 26;
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const x = 10 + i * kw, v = TABLE[i] / TABLE[0], bh = (base - top) * Math.sqrt(v);
      c.fillStyle = i === lit ? '#c2341c' : i === cur ? '#13786c' : i < cur ? (isBlack(i) ? '#3a3a3a' : '#8b8577') : (isBlack(i) ? '#cfc8b8' : '#e4ddcd');
      c.fillRect(x, base - Math.max(1, bh), Math.max(1, kw - .4), Math.max(1, bh)); }
    c.font = '10px JBMono, monospace'; c.fillStyle = '#6f685a';
    for (let i = 0; i < n; i += 24) { const x = 10 + i * kw; c.fillText(new Date(startOf(i)).getUTCFullYear(), x, h - 10); c.fillRect(x, base + 2, 1, 5); }
    const cx = 10 + cur * kw; c.fillStyle = '#13786c'; c.font = '600 12px JBMono, monospace'; c.fillText('▼ now: ' + noteOf(cur), Math.min(cx - 4, w - 110), 16);
    c.fillStyle = '#6f685a'; c.font = '10px JBMono, monospace'; c.fillText('A4 · 440/s', 10, 16); c.fillText('…zero', w - 50, base - 4);
    c.fillText('bar height = √payout, so the tail stays visible', w - 300, 16);
  }
  const playF = i => Math.max(55, 1760 * Math.pow(2, -i / 12)); // two octaves up
  function upd() {
    const kas = TABLE[cur] / 1e8; $('s-now').textContent = kas.toFixed(2); $('s-note').textContent = noteOf(cur) + ' (about ' + kas.toFixed(1) + ' Hz)';
    const nd = new Date(nextTs); $('s-next').textContent = 'around ' + nd.toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ' your time';
    if (S.circ) { $('s-circ').textContent = KX.fmt(S.circ); $('s-pct').textContent = (S.circ / S.max * 100).toFixed(2) + '%'; }
    draw();
  }
  KX.on('info', () => {
    if (S.reward) { const ps = Math.round(S.reward * 10 * 1e8); let best = 0; TABLE.forEach((v, i) => { if (Math.abs(v - ps) < Math.abs(TABLE[best] - ps)) best = i; }); cur = best; $('s-tag').textContent = 'live: matched to today\'s reward'; }
    if (S.next) nextTs = S.next; upd();
  });
  if (cv) {
    fit(); addEventListener('resize', fit); upd();
    cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), i = Math.max(0, Math.min(TABLE.length - 1, Math.floor((e.clientX - r.left - 10) / ((r.width - 20) / TABLE.length))));
      lit = i; draw(); if (!KX.audio.on) KX.audio.set(true); KX.audio.note(playF(i), .6, .06, 'sine');
      const d = new Date(startOf(i)); $('s-hover').textContent = `Month ${i + 1} (${d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}, approx.): ${(TABLE[i] / 1e8).toFixed(i > 200 ? 6 : 2)} KAS a second, note ${noteOf(i)}.`; });
    let playing = 0;
    $('s-play').onclick = () => { if (playing) return; if (!KX.audio.on) KX.audio.set(true); let i = 0; playing = setInterval(() => { lit = i; draw(); KX.audio.note(playF(i), .2, .05, 'triangle'); if (++i > cur) { clearInterval(playing); playing = 0; setTimeout(() => { lit = -1; draw(); }, 400); } }, 100);
      $('s-hover').textContent = 'Played at ♩=600: ten notes a second, the speed blocks arrive.'; };
  }

  /* ---------- 07 X feed ---------- */
  const tcls = t => /test/.test(t) ? 't-test' : /propos|announc/.test(t) ? 't-page' : /milestone|dev/.test(t) ? 't-live' : 't-talk';
  fetch('data/x-feed.json', { cache: 'no-cache' }).then(r => r.json()).then(d => {
    $('feed-upd').textContent = 'translated into human · updated ' + dfmt(d.updated);
    $('feed').innerHTML = d.items.map(p => `<article class="post">
      <div class="who"><a href="https://x.com/${esc(p.handle)}" rel="noopener" target="_blank">@${esc(p.handle)}</a><time datetime="${esc(p.date)}">${dfmt(p.date)}</time></div>
      <p class="plain">${esc(p.plain)}</p>
      <blockquote>${esc(p.text)}</blockquote>
      ${p.caveat ? `<p class="cav">${esc(p.caveat)}</p>` : ''}
      <div class="meta"><span class="tagx ${tcls(p.tag)}">${esc(p.tag)}</span><a class="open" href="${esc(p.url)}" rel="noopener" target="_blank">Read on X ↗</a></div></article>`).join('');
  }).catch(() => { $('feed').innerHTML = '<p class="hint">The feed file didn\'t load. Try reloading.</p>'; });

  /* ---------- 08 status board ---------- */
  const R = 'https://github.com/kaspanet/';
  const items = [
    ['live', 'Ten blocks a second', 'Mainnet has run at 10 blocks per second since the Crescendo upgrade.', 'May 2025', 'rusty-kaspa v1.0.0', R + 'rusty-kaspa/releases/tag/v1.0.0'],
    ['live', 'Covenants (Toccata upgrade)', 'Coins can carry rules about where they may go next. That\'s the savings jar in No. 05.', 'Jun 2026', 'KIP-17', R + 'kips/blob/master/kip-0017.md'],
    ['live', 'Zero-knowledge proof checks', 'The network can verify certain cryptographic proofs directly (KIP-16, part of Toccata).', 'Jun 2026', 'KIP-16', R + 'kips/blob/master/kip-0016.md'],
    ['live', 'Rusty Kaspa 2.1.0', 'The current release of the main node software.', 'Sep 22, 2026', 'release', R + 'rusty-kaspa/releases/tag/v2.1.0'],
    ['live', 'SilverScript 1.0', 'A language for writing those coin rules without hand-assembling them.', 'Sep 9, 2026', 'releases', R + 'silverscript/releases'],
    ['live', 'Token standard KCC-20 (final)', 'A shared recipe for tokens built from covenants. A convention apps follow, not a change to the network itself.', 'Oct 21, 2026', 'kcc-0020.md', R + 'kccs/blob/main/kcc-0020.md'],
    ['test', 'Private payments on testnet', 'A proof of concept for private transfers running on test network 10. Test coins only.', 'Oct 2026', 'post on X', 'https://x.com/WellerOlaf/status/2112660896136994874'],
    ['test', 'A bridge, tested then parked', 'A team ran a mainnet test of a bridge to other chains. Unaudited; not something to use.', 'Oct 2026', 'post on X', 'https://x.com/KasperoLabs/status/2113950984451817976'],
    ['test', 'Merged, not yet released', 'Node code changes (a "no-std" consensus core, mass-calculation and commitment fixes) are merged but not in a release yet.', 'Oct 14–16, 2026', 'PR #1060', R + 'rusty-kaspa/pull/1060'],
    ['page', 'DAGKnight', 'The next consensus upgrade, which adapts to real network conditions. Paper written, KIP status Proposed. A core developer hopes for a stable testnet this year.', 'Proposed', 'KIP-2', R + 'kips/blob/master/kip-0002.md'],
    ['page', 'Quantum-safer addresses', 'A proposal to hide public keys behind a hash until coins are spent. Still an open pull request.', 'Oct 19, 2026', 'kccs PR #37', R + 'kccs/pull/37'],
    ['page', 'Token metadata (KCC-23)', 'A standard way to attach names and icons to tokens. Draft.', 'Draft', 'kcc-0023.md', R + 'kccs/blob/main/kcc-0023.md'],
    ['page', 'KAS itself as a KCC-20 token', 'A proposal so apps can treat KAS like any other token. Being discussed.', 'Oct 2026', 'post on X', 'https://x.com/IzioDev/status/2113329374220910995'],
    ['comp', 'vProgs (verifiable programs)', 'Apps that run off-chain and prove their work to the network. Prototype code only.', 'Prototype', 'kaspanet/vprogs', R + 'vprogs'],
    ['comp', 'Argent language', 'A language for those programs. The repository says it isn\'t release-ready.', 'In development', 'argent-lang/argent', 'https://github.com/argent-lang/argent'],
    ['comp', 'KaspaDollar', 'A dollar-pegged coin that has been announced. Nothing to use yet.', 'Announced', 'post on X', 'https://x.com/KaspaDollar/status/2113601328975098237'],
  ];
  const cols = { live: 'Live on mainnet', test: 'Testing', page: 'On paper', comp: 'Research / announced' };
  const board = $('board');
  if (board) {
    board.innerHTML = Object.entries(cols).map(([k, name]) => `<div class="col ${k}" data-col="${k}"><h3>${name}</h3>${items.filter(i => i[0] === k).map(i =>
      `<div class="item"><b>${esc(i[1])}</b><p>${esc(i[2])}</p><span class="d">${esc(i[3])} · <a href="${esc(i[5])}" rel="noopener" target="_blank">${esc(i[4])} ↗</a></span></div>`).join('')}</div>`).join('');
    document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
      document.querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-pressed', x === b));
      board.querySelectorAll('.col').forEach(c => c.hidden = b.dataset.f !== 'all' && c.dataset.col !== b.dataset.f);
    });
  }
})();
