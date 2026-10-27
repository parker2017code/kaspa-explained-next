/* KaspOS window manager: boot, icons, windows, taskbar, menus, easter eggs, share links, deep links. */
(() => {
  const KX = window.KX, S = KX.S, K = window.KOS, A = KX.audio, { $, $$, esc, rnd, store } = K;
  K.t0 = performance.now();
  const params = new URL(location.href).searchParams, atParam = +params.get('at') || 0, prev = store.get('last');

  /* ---------- Start here ---------- */
  const HOOKS = [['radio', '📻', 'Hear the network', 'Ten blocks a second, as music', '#49eacb'], ['photo', '📸', 'Try to cheat it', 'Hide blocks. Get caught.', '#ff5fa2'],
    ['jar', '🫙', 'Rob the jar', 'Coins with rules. It\'s rude.', '#b8f35a'], ['heist', '🦹', 'Plan a heist', 'Priced with today\'s real numbers', '#a685ff'],
    ['piano', '🎹', 'Play the supply', 'The money supply is a piano', '#5ac8fa'], ['quiz', '🍺', 'Get pub-certified', '7 questions. Then explain it to a friend.', '#ff8a3d']];
  K.app('welcome', { title: 'Start here.txt', icon: '👋', color: '#ffd23f', w: 600, h: 560, status: 'Not an official Kaspa site · no prices, on purpose',
    render(b) {
      b.innerHTML = `<p class="kick" style="font-size:28px">Kaspa is a money network that makes ten blocks a second.</p>
        <p class="lead">This whole computer runs on it: the squares drifting across the wallpaper are the real network, live. Every app is a toy that explains one idea. Poke anything. Nothing here can cost you money.</p>
        <p class="panel" id="w-back" hidden></p>
        <div class="hooks">${HOOKS.map(h => `<button class="hook" type="button" data-open="${h[0]}" style="--c:${h[4]}"><span class="e" aria-hidden="true">${h[1]}</span><b>${h[2]}</b><span>${h[3]}</span></button>`).join('')}</div>
        <p class="muted" style="margin-top:12px">Psst: there are 15 stickers to find ⭐, and some words do things when you type them.</p>`;
      $$('[data-open]', b).forEach(x => x.onclick = () => open(x.dataset.open));
      const back = () => { const w = $('#w-back', b); if (!w || !S.blueScore) return;
        if (atParam && atParam < S.blueScore) { w.hidden = false; w.innerHTML = `📸 <b>Someone shared a moment with you.</b> Since they sent it, the network has added about <b>${KX.fmt(S.blueScore - atParam)}</b> blocks. None were thrown away.`; }
        else if (prev && prev.score && S.blueScore - prev.score > 100) { w.hidden = false; w.innerHTML = `👋 <b>Welcome back.</b> Since your last visit (${ago(Date.now() - prev.t)} ago), about <b>${KX.fmt(S.blueScore - prev.score)}</b> blocks were added. Nobody threw any away.`; } };
      back(); KX.on('score', back);
    } });
  const ago = ms => { const m = Math.round(ms / 60000); if (m < 60) return m + ' minute' + (m === 1 ? '' : 's'); const h = Math.round(m / 60); if (h < 48) return h + ' hour' + (h === 1 ? '' : 's'); return Math.round(h / 24) + ' days'; };
  let lastSave = 0; KX.on('score', ({ score }) => { if (score && Date.now() - lastSave > 5000) { lastSave = Date.now(); store.set('last', { score, t: Date.now() }); } });

  /* ---------- icons ---------- */
  const ICONS = [['welcome', 'Start here'], ['radio', 'Block Radio'], ['pileup', 'Pile-Up.exe'], ['photo', 'Group Photo'], ['checkout', 'Checkout Rush'], ['heist', 'Heist Planner'], ['jar', 'The Jar'], ['piano', 'Coin Piano'],
    ['feed', 'Overheard'], ['real', 'Real or Not?'], ['quiz', 'Pub Quiz'], ['jargon', 'Jargon Buster'], ['doubts', 'doubts.txt'], ['stickers', 'Stickers'], ['bin', 'Orphan Bin'], ['receipts', 'Receipts']];
  const DAG_SAYS = { radio: 'Turn the sound up. Every note is a block. The sparkly ones are real blocks I fetched.', pileup: 'Hit "Kaspa speed" and watch the top row explode. That\'s why Bitcoin goes slow.',
    photo: 'Press "Start secret mining", wait 5 seconds, then reveal. I\'ll be watching. 👻', checkout: 'Tick the naughty box and let Ben try to spend a coin twice.', heist: 'Drag your crew past 50% and see what happens. Then drag the wait time.',
    jar: 'Press "Steal it all". Go on. It wants you to.', piano: 'Press play. That\'s every month of Kaspa so far, at block speed.', feed: 'Real posts from real builders. We just translate.', real: 'Guess what\'s live. Every answer has a receipt.',
    quiz: 'Pass this and you\'re officially allowed to explain Kaspa at the pub.', jargon: 'Paste the most unhinged crypto post you know into the hype translator.', bin: 'Told you. Empty.', doubts: 'Respect. Skeptics make the best explainers.' };
  $('#icons').innerHTML = ICONS.map(([id, label]) => { const d = K.APPS[id]; return `<button class="ico" type="button" data-app="${id}"><span class="emo" style="--c:${d.color}" aria-hidden="true">${d.icon}</span><span class="lbl">${esc(label)}</span>${K.got.size === 0 && id === 'welcome' ? '' : ''}</button>`; }).join('');
  $('#icons').addEventListener('click', e => { const x = e.target.closest('.ico'); if (!x) return; $$('.ico').forEach(i => i.classList.toggle('sel', i === x)); open(x.dataset.app); });

  /* ---------- windows ---------- */
  const open_ = new Map(); let z = 20, cascade = 0;
  function open(id, arg) {
    const def = K.APPS[id]; if (!def) return;
    if (open_.has(id) && !arg) { const w = open_.get(id); w.classList.remove('min'); focus(w); return w; }
    if (open_.has(id)) close(open_.get(id), true);
    const dt = $('#desktop').getBoundingClientRect(), top = 30;
    const w = document.createElement('section'); w.className = 'win'; w.dataset.app = id; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', def.title); w.style.setProperty('--c', def.color);
    const W = Math.min(def.w, dt.width - 40), H = Math.min(def.h, dt.height - top - 20);
    const x = Math.max(10, Math.min(dt.width - W - 10, (dt.width - W) / 2 + 60 + cascade * 28 - 90)), y = Math.max(top + 8, Math.min(dt.height - H - 10, top + 20 + cascade * 26));
    cascade = (cascade + 1) % 6;
    Object.assign(w.style, { left: x + 'px', top: y + 'px', width: W + 'px', height: H + 'px' });
    w.innerHTML = `<div class="titlebar"><span class="t-ico" aria-hidden="true">${def.icon}</span><h2 class="t-txt" style="margin:0;font-size:inherit">${esc(def.title)}</h2>
      <button class="tb-btn mn" type="button" aria-label="Minimise">–</button><button class="tb-btn mx" type="button" aria-label="Maximise">□</button><button class="tb-btn x" type="button" aria-label="Close">×</button></div>
      <div class="win-body" tabindex="0"></div>${def.status ? `<div class="win-status">${esc(def.status)}</div>` : ''}`;
    $('#windows').appendChild(w); open_.set(id, w);
    const body = $('.win-body', w);
    try { def.render(body, w, arg); } catch (e) { console.error(e); body.innerHTML = '<p>This app tripped over a block. Close and reopen it.</p>'; }
    $('.mn', w).onclick = () => { w.classList.add('min'); tasks(); };
    $('.mx', w).onclick = () => w.classList.toggle('max');
    $('.x', w).onclick = () => close(w);
    w.addEventListener('pointerdown', () => focus(w));
    drag(w); focus(w); tasks(); K.blip(1040);
    if (id !== 'welcome' && id !== 'error') { history.replaceState(null, '', location.pathname + location.search + '#' + id); }
    if (DAG_SAYS[id] && !K.isNarrow()) K.say(DAG_SAYS[id], 8000);
    setTimeout(() => { const f = body.querySelector('button,a,input,[tabindex]'); (f || $('.x', w)).focus({ preventScroll: true }); }, 30);
    return w;
  }
  function close(w, quick) { const id = w.dataset.app; open_.delete(id); if (location.hash === '#' + id) history.replaceState(null, '', location.pathname + location.search);
    if (quick || KX.reduced) w.remove(); else { w.classList.add('closing'); setTimeout(() => w.remove(), 160); } tasks(); const top = topWin(); top && focus(top); }
  function focus(w) { w.style.zIndex = ++z; $$('.win').forEach(x => x.classList.toggle('inactive', x !== w)); $$('.task').forEach(t => t.classList.toggle('active', t.dataset.app === w.dataset.app)); }
  const topWin = () => [...open_.values()].filter(w => !w.classList.contains('min')).sort((a, b) => b.style.zIndex - a.style.zIndex)[0];
  function tasks() { $('#tasks').innerHTML = [...open_.entries()].map(([id, w]) => `<button class="btn task" type="button" data-app="${id}"><span aria-hidden="true">${K.APPS[id].icon}</span><span class="tt">${esc(K.APPS[id].title)}</span></button>`).join('');
    document.body.classList.toggle('has-win', [...open_.values()].some(w => !w.classList.contains('min')));
    const t = topWin(); t && $$('.task').forEach(x => x.classList.toggle('active', x.dataset.app === t.dataset.app)); }
  $('#tasks').addEventListener('click', e => { const t = e.target.closest('.task'); if (!t) return; const w = open_.get(t.dataset.app);
    if (w.classList.contains('min')) { w.classList.remove('min'); focus(w); } else if (topWin() === w) { w.classList.add('min'); } else focus(w); tasks(); });
  function drag(w) { const bar = $('.titlebar', w); let sx, sy, ox, oy, on = false;
    bar.addEventListener('pointerdown', e => { if (e.target.closest('button') || K.isNarrow() || w.classList.contains('max')) return; on = true; sx = e.clientX; sy = e.clientY; ox = w.offsetLeft; oy = w.offsetTop; bar.setPointerCapture(e.pointerId); bar.style.cursor = 'grabbing'; });
    bar.addEventListener('pointermove', e => { if (!on) return; const dt = $('#desktop').getBoundingClientRect();
      w.style.left = Math.max(-w.offsetWidth + 80, Math.min(dt.width - 80, ox + e.clientX - sx)) + 'px'; w.style.top = Math.max(30, Math.min(dt.height - 40, oy + e.clientY - sy)) + 'px'; });
    bar.addEventListener('pointerup', () => { on = false; bar.style.cursor = ''; });
    bar.addEventListener('dblclick', e => { if (!e.target.closest('button') && !K.isNarrow()) w.classList.toggle('max'); }); }
  K.open = open;

  /* ---------- share ---------- */
  K.share = async (text) => {
    const u = new URL(location.origin + location.pathname); if (S.blueScore) u.searchParams.set('at', S.blueScore);
    const msg = text || 'This is how Kaspa works: a pretend computer running on the real network.';
    try { if (navigator.share && matchMedia('(pointer:coarse)').matches) { await navigator.share({ title: 'KaspOS', text: msg, url: u.toString() }); return; }
      await navigator.clipboard.writeText(msg + ' ' + u.toString()); K.toast('📋 Link copied. Whoever opens it sees how many blocks were made since this exact second.', 4500); }
    catch (e) { K.toast(u.toString(), 7000); }
  };

  /* ---------- start menu ---------- */
  const sm = $('#startmenu'), sb = $('#startbtn');
  const fnItems = [['🔗', 'Share this moment', 'a link stamped with this block', () => K.share()], ['🔊', 'Sound on / off', 'every block is a note', () => toggleSound()],
    ['👻', 'Show / hide Dag', 'your ghost helper', () => toggleDag()], ['ℹ️', 'About KaspOS', 'not official, no prices', () => open('about')], ['⏻', 'Shut down…', 'good luck', () => shutdown()]];
  $('#smitems').innerHTML = ICONS.map(([id, l]) => `<button class="mi" role="menuitem" type="button" data-app="${id}"><span class="emo" aria-hidden="true">${K.APPS[id].icon}</span><span>${esc(l)}</span></button>`).join('') + '<div class="sep" role="separator"></div>' +
    fnItems.map((f, i) => `<button class="mi" role="menuitem" type="button" data-fn="${i}"><span class="emo" aria-hidden="true">${f[0]}</span><span>${esc(f[1])}<small>${esc(f[2])}</small></span></button>`).join('');
  const smOpen = v => { sm.hidden = !v; sb.setAttribute('aria-expanded', v); if (v) { $('#ctxmenu').hidden = true; $('.mi', sm).focus(); } };
  sb.onclick = e => { e.stopPropagation(); smOpen(sm.hidden); K.blip(700); };
  sm.addEventListener('click', e => { const m = e.target.closest('.mi'); if (!m) return; smOpen(false); m.dataset.app ? open(m.dataset.app) : fnItems[+m.dataset.fn][3](); });
  sm.addEventListener('keydown', e => { const items = $$('.mi', sm), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { items[(i + 1) % items.length].focus(); e.preventDefault(); } if (e.key === 'ArrowUp') { items[(i - 1 + items.length) % items.length].focus(); e.preventDefault(); } if (e.key === 'Escape') { smOpen(false); sb.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('#startmenu,#startbtn')) smOpen(false); if (!e.target.closest('#ctxmenu')) $('#ctxmenu').hidden = true; });

  /* ---------- right-click menu ---------- */
  const ctxItems = [['🧱', 'New block', () => K.toast('You can\'t make one. Miners do that, about ten times a second. One just happened. And another.')],
    ['🔄', 'Refresh', () => K.toast('No need. The network refreshed itself about 50 times while you found this button.')],
    ['🧮', 'Sort blocks by… GHOSTDAG', () => open('photo')], ['🗑️', 'Empty Orphan Bin', () => { open('bin'); }], ['🔗', 'Share this moment', () => K.share()], ['⏻', 'Shut down…', () => shutdown()]];
  const cm = $('#ctxmenu');
  cm.innerHTML = ctxItems.map((c, i) => `<button class="mi" type="button" data-c="${i}"><span class="emo" aria-hidden="true">${c[0]}</span>${esc(c[1])}</button>`).join('');
  $('#desktop').addEventListener('contextmenu', e => { if (e.target.closest('.win')) return; e.preventDefault(); cm.hidden = false; smOpen(false);
    cm.style.left = Math.min(e.clientX, innerWidth - cm.offsetWidth - 8) + 'px'; cm.style.top = Math.min(e.clientY, innerHeight - cm.offsetHeight - 60) + 'px'; $('.mi', cm).focus(); });
  cm.addEventListener('click', e => { const m = e.target.closest('.mi'); if (!m) return; cm.hidden = true; ctxItems[+m.dataset.c][2](); });
  cm.addEventListener('keydown', e => { if (e.key === 'Escape') cm.hidden = true; });

  /* ---------- tray, Dag, shutdown ---------- */
  function toggleSound() { A.set(!A.on); if (A.on) { K.award('tuned'); K.toast('🔊 Sound on. Every block is a note.', 2000); } else K.toast('🔇 Sound off.', 1400); }
  $('#soundbtn').onclick = toggleSound; $('#stickerbtn').onclick = () => open('stickers');
  function toggleDag() { const h = $('#helper'); h.classList.toggle('hidden'); store.set('nodag', h.classList.contains('hidden')); }
  if (store.get('nodag')) $('#helper').classList.add('hidden');
  $('#helperx').onclick = () => { $('#helper').classList.add('quiet'); };
  $('#helperbody').onclick = () => { K.nextTip(); A.note(880, .15, .04, 'sine'); A.note(1320, .2, .03, 'sine', .08); };
  function shutdown() { const s = $('#shutdown'); s.hidden = false; $('#soback').focus(); let n = 0; const t = setInterval(() => { if (s.hidden) return clearInterval(t); n += 10; $('#sd-n').textContent = KX.fmt(n); }, 1000); }
  $('#soback').onclick = () => { $('#shutdown').hidden = true; K.toast('Welcome back. It didn\'t notice you left.'); };

  /* ---------- keys, words, Konami ---------- */
  let typed = ''; const KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kp = 0;
  const WORDS = {
    gm: () => { K.award('gm'); bubbles(['gm', 'gm ☀️', 'gm gm', 'gm fren']); K.say('gm. The network never sleeps, so it\'s always morning somewhere in it.'); },
    gn: () => { document.body.classList.toggle('night'); K.say('gn. The blocks will keep going. They don\'t need you. (Affectionately.)'); },
    wen: () => { K.say('wen DAGKnight? It\'s a proposed upgrade with a paper, on paper. Nothing unshipped gets shown as live here. Check Real or Not.'); open('real'); },
    price: () => open('lake'), moon: () => { K.say('No moon here. There is a lake, though.'); open('lake'); },
    kaspa: () => { K.rain(['🟩', '🟦', '🟨', '🟪', '🟥', '🟧'], 90); A.set(true); [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(i => A.note(392 * 2 ** (i / 12 * 2), .12, .04, 'square', i * .1)); K.say('That was ten blocks in one second. Normal Tuesday.'); },
    rug: () => { K.say('You can\'t rug a jar with rules. Try it.'); open('jar'); }, fud: () => open('doubts'), hodl: () => K.say('hodl what? There are no prices here. Hold a sticker instead.'),
    ghost: () => { $('#helper').classList.remove('hidden'); const h = $('#helperbody'); h.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(720deg) scale(1.4)' }, { transform: 'rotate(720deg)' }], { duration: 900 }); K.say('Boo! You found me. I\'m GHOSTDAG\'s mascot. Unofficially. Very unofficially.'); },
    toccata: () => toccata(), wagmi: () => K.say('wagmi? We\'re all going to… learn how blockDAGs work. Yes. That.'),
  };
  function bubbles(words) { if (KX.reduced) return; for (let i = 0; i < 14; i++) setTimeout(() => { const s = document.createElement('span'); s.className = 'gmb'; s.textContent = rnd(words);
    s.style.left = Math.random() * (innerWidth - 120) + 'px'; s.style.top = 40 + Math.random() * (innerHeight - 200) + 'px'; s.style.background = rnd(['#49eacb', '#ff5fa2', '#ffd23f', '#b8f35a', '#5ac8fa']); $('#fx').appendChild(s); setTimeout(() => s.remove(), 2700); A.note(600 + Math.random() * 600, .1, .03, 'square'); }, i * 90); }
  function toccata() { A.set(true); const seq = [[880, 120], [784, 120], [880, 900], [784, 110], [698, 110], [659, 110], [587, 110], [554, 450], [587, 1200]]; let t = 0;
    seq.forEach(([f, d]) => { setTimeout(() => A.note(f, d / 1000 + .3, .07, 'sawtooth'), t); t += d + 40; });
    K.toast('🎼 Toccata: also the name of the June 2026 upgrade that switched covenants on. Like Crescendo before it, a musical name.', 6000); }
  function turbo() { K.award('konami'); KX.wall && KX.wall.setTurbo(10); document.body.classList.add('tilt'); K.toast('🕹️ TURBO: 100 blocks a second! (Not real. Kaspa runs at 10. This is just your screen showing off.)', 5000);
    setTimeout(() => { KX.wall && KX.wall.setTurbo(1); document.body.classList.remove('tilt'); K.toast('Back to reality: 10 a second, which is already plenty.'); }, 9000); }
  addEventListener('keydown', e => {
    if (e.key === KON[kp] || e.key.toLowerCase() === KON[kp]) { kp++; if (kp === KON.length) { kp = 0; typed = ''; turbo(); return; } } else kp = e.key === KON[0] ? 1 : 0;
    if (e.key === 'Escape') { if (!$('#shutdown').hidden) { $('#soback').click(); return; } const t = topWin(); if (t && !e.target.closest('#startmenu,#ctxmenu')) close(t); return; }
    const t = e.target; if (t.matches && t.matches('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-12);
    for (const w in WORDS) if (typed.endsWith(w) && (w.length > 3 || typed.length === w.length || !/[a-z]/.test(typed[typed.length - w.length - 1]))) { WORDS[w](); typed = ''; break; }
  });
  // tap the ghost 7 times fast for a party
  let gt = 0, gtT; $('#helperbody').addEventListener('click', () => { gt++; clearTimeout(gtT); gtT = setTimeout(() => gt = 0, 1500); if (gt >= 7) { gt = 0; WORDS.ghost(); } });

  /* ---------- tab title while away ---------- */
  const title = document.title; let awayAt = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { awayAt = S.blueScore; let n = 0; const tt = setInterval(() => { if (!document.hidden) return clearInterval(tt); n += 10; document.title = `🟩 ${KX.fmt(n)} blocks since you left`; }, 1000); }
    else { document.title = title; if (awayAt && S.blueScore > awayAt + 50) K.toast(`While you were away the network added about ${KX.fmt(S.blueScore - awayAt)} blocks. All kept.`); }
  });

  /* ---------- boot ---------- */
  const LINES = ['<b>KaspOS 10</b> (blocks a second)', 'Checking memory… 640K ought to be enough', 'Connecting to the Kaspa network… ', 'Loading GHOSTDAG… ghost found 👻', 'Emptying orphan bin… already empty', 'Hiding price ticker… hidden forever', 'Ready.'];
  const boot = $('#boot'); let done = false;
  function finish() { if (done) return; done = true; boot.classList.add('gone'); setTimeout(() => boot.remove(), 500); try { sessionStorage.setItem('kos-booted', 1); } catch (e) {} start(); }
  function start() {
    const h = location.hash.slice(1);
    if (h && K.APPS[h]) open(h); else if (!K.isNarrow() || atParam) open('welcome');
    setTimeout(() => K.say(K.isNarrow() ? 'Boo! I\'m Dag. Tap any app. Start with 📻 Block Radio or 🫙 The Jar.' : 'Boo! I\'m Dag, the friendly ghost who keeps blocks in order. Tap me for tips. The squares behind me are the real network.', 9000), 600);
  }
  let skip = params.has('noboot'); try { skip = skip || sessionStorage.getItem('kos-booted'); } catch (e) {}
  if (skip || KX.reduced) { boot.remove(); done = true; start(); }
  else {
    $('#bootskip').onclick = finish; let i = 0; const log = $('#bootlog');
    const step = () => { if (done) return; if (i >= LINES.length) { setTimeout(finish, 350); return; }
      let l = LINES[i]; if (i === 2) l += S.online ? '<b>live ✓</b>' : S.online === false ? 'unreachable, simulating' : '<b>ok</b>';
      log.innerHTML += l + '\n'; $('#bootfill').style.width = ((i + 1) / LINES.length * 100) + '%'; i++; setTimeout(step, 230 + Math.random() * 160); };
    setTimeout(step, 250);
  }
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (K.APPS[h]) open(h); });
})();
