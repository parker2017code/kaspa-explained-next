/* KaspOS core: helpers, sound, toasts, stickers, Dag the ghost, the ticker and the clock. */
(() => {
  const KX = window.KX, S = KX.S;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const isNarrow = () => matchMedia('(max-width:700px)').matches;
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('kos-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('kos-' + k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------- sound (off until you ask) ---------- */
  const A = KX.audio = { on: false, ctx: null, master: null,
    init() { if (this.ctx) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = .55; this.master.connect(this.ctx.destination); },
    note(f, dur = .3, g = .05, type = 'triangle', delay = 0) {
      if (!this.on || !this.ctx) return; const c = this.ctx, t = c.currentTime + delay;
      const o = c.createOscillator(), v = c.createGain(); o.type = type; o.frequency.value = f;
      v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + .008); v.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(v); v.connect(this.master); o.start(t); o.stop(t + dur + .02);
    },
    set(on) { this.on = on; if (on) { this.init(); this.ctx && this.ctx.resume(); }
      const b = $('#soundbtn'); if (b) { b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'); }
      KX.emit('sound', on); },
  };
  const yay = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => A.note(f, .25, .05, 'square', i * .07));
  const nope = () => [392, 370, 349, 262].forEach((f, i) => A.note(f, i === 3 ? .7 : .22, .05, 'sawtooth', i * .2));
  const blip = (f = 880) => A.note(f, .08, .04, 'square');

  /* ---------- toasts + effects ---------- */
  function toast(msg, ms = 3200, cls = '') {
    const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = msg; $('#toasts').appendChild(t);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
    setTimeout(() => { t.style.opacity = 0; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, ms);
  }
  function rain(chars = ['🟩', '🟦', '🟨', '🟪', '🟥'], n = 40) {
    if (KX.reduced) return; const fx = $('#fx');
    for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'fall'; s.textContent = rnd(chars);
      s.style.left = Math.random() * 100 + 'vw'; s.style.fontSize = 14 + Math.random() * 22 + 'px';
      s.style.animationDuration = 1.6 + Math.random() * 2 + 's'; s.style.animationDelay = Math.random() * .8 + 's'; s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      fx.appendChild(s); setTimeout(() => s.remove(), 4600); }
  }
  function floatText(txt, x, y, color = '#fff') {
    const s = document.createElement('span'); s.className = 'float'; s.textContent = txt; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.color = color;
    s.style.textShadow = '2px 2px 0 #14101f'; s.style.setProperty('--r', (Math.random() * 16 - 8) + 'deg'); $('#fx').appendChild(s); setTimeout(() => s.remove(), 1700);
  }

  /* ---------- Dag, the ghost ---------- */
  const TIPS = [
    'Bitcoin makes one block about every 10 minutes. Kaspa makes about 10 every second. That\'s 6,000 times as often.',
    'When two blocks are made at the same moment, most chains throw one away. Kaspa keeps both. That\'s the whole trick.',
    'I\'m named after GHOSTDAG, the rule that puts all those blocks in one fair order. Yes, I am a pun. Boo.',
    'Try Group Photo: hide some blocks, then reveal them. Everyone will notice. That\'s the point.',
    'Nothing here shows a price. If you came for a price, try the 🌊 Lake. It\'s very calm.',
    'Every number in the ticker is live from the real network, unless it says "simulated".',
    'Type "gm" anywhere. Or "wen". Or "price". I dare you.',
    'The Jar holds coins that come with rules. Try to rob it. It will be rude to you.',
    'Collect stickers by poking things. There are 15. Some are hidden.',
    'The wallpaper is the network. Each square is a block, and lines point back to the blocks it saw. Tap one.',
    'Right-click the desktop (or long-press) for a secret menu.',
  ];
  let tipI = 0, sayT;
  function say(msg, ms = 9000) {
    const h = $('#helper'); if (!h || h.classList.contains('hidden')) return;
    $('#helpertext').textContent = msg; h.classList.remove('quiet'); clearTimeout(sayT); sayT = setTimeout(() => h.classList.add('quiet'), ms);
  }

  /* ---------- stickers (achievements) ---------- */
  const STICKERS = [
    ['tuned', '🎧', 'Tuned in', 'Turned the sound on and heard the network', '#49eacb'],
    ['block', '🔎', 'Block spotter', 'Tapped a real block on the wallpaper', '#5ac8fa'],
    ['pileup', '💥', 'Pile-up', 'Watched a single chain choke at Kaspa speed', '#ff8a3d'],
    ['busted', '🚨', 'Busted', 'Tried to sneak blocks into the group photo and got caught', '#ff5fa2'],
    ['double', '🪙', 'Double trouble', 'Tried to spend the same coin twice', '#ffd23f'],
    ['heist', '🦹', 'Criminal mastermind', 'Planned a majority attack (on paper)', '#a685ff'],
    ['thief', '🫙', 'Nice try, thief', 'Got told off by a jar', '#b8f35a'],
    ['pianist', '🎹', 'Pianist', 'Played the whole money supply so far', '#49eacb'],
    ['real', '🕵️', 'Fact checker', 'Scored 5 or more in Real or Not', '#ffd23f'],
    ['grad', '🎓', 'Pub certified', 'Passed the Pub Quiz', '#ff5fa2'],
    ['skeptic', '🤨', 'Healthy skeptic', 'Read the doubts file', '#ff8a3d'],
    ['bin', '🗑️', 'Empty bin', 'Looked for thrown-away blocks and found none', '#5ac8fa'],
    ['gm', '☀️', 'gm', 'Said gm to a computer', '#ffd23f'],
    ['konami', '🕹️', 'Cheat code', 'Found the cheat code (it does nothing real)', '#a685ff'],
    ['back', '🔁', 'Regular', 'Came back on another day', '#b8f35a'],
  ];
  const got = new Set(store.get('stickers', []));
  function award(id) {
    if (got.has(id)) return false; const s = STICKERS.find(x => x[0] === id); if (!s) return false;
    got.add(id); store.set('stickers', [...got]); updCount(); yay(); rain([s[1]], 18);
    toast(`${s[1]} Sticker unlocked: ${s[2]}. ${got.size} of ${STICKERS.length}.`, 4200, 'st'); KX.emit('sticker', id);
    if (got.size === STICKERS.length) setTimeout(() => { say('You found every sticker. You now know more about Kaspa than most people who talk about it online.'); rain(['⭐', '🟩', '👻'], 80); }, 1200);
    return true;
  }
  function updCount() { const c = $('#stickcount'); if (c) c.textContent = got.size; }
  // a visit on a new day is a sticker
  const today = new Date().toDateString(), lastDay = store.get('day');
  if (lastDay && lastDay !== today) setTimeout(() => award('back'), 4000);
  store.set('day', today);

  /* ---------- ticker, live pill, wallpaper caption ---------- */
  const tk = (label, val, app) => `<button class="tk" type="button" data-open="${app}" tabindex="-1">${label} <span class="v">${val}</span></button>`;
  function ticker() {
    const since = S.blueScore && S.firstScore ? KX.fmt(S.blueScore - S.firstScore) : '0';
    const sim = S.online === false;
    const items = [
      tk(sim ? '<i>SIMULATED</i> blocks/sec' : '<b>LIVE</b> blocks/sec', sim ? '10 (pretend)' : (S.rateBps ? S.rateBps.toFixed(1) : '10'), 'radio'),
      tk('block count', S.blueScore ? KX.fmt(S.blueScore) : '…', 'radio'),
      tk('added since you arrived', since, 'radio'),
      tk('guessing power', S.hashTH ? KX.fmt(S.hashTH / 1000) + ' PH/s' : '…', 'heist'),
      tk('new coins per block', S.reward ? S.reward.toFixed(2) + ' KAS' : '…', 'piano'),
      tk('blocks thrown away', 'none (they\'re all kept)', 'bin'),
      tk('price', 'not here. go touch grass 🌱', 'lake'),
      tk('next supply step down', S.next ? new Date(S.next).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '…', 'piano'),
      tk('mood', rnd(['ordering things fairly', 'keeping every block', 'unbothered', 'busy, 10x a second']), 'jargon'),
    ];
    const row = items.join('<span aria-hidden="true">✦</span>') + '<span aria-hidden="true">✦</span>';
    $('#ticker').innerHTML = `<span class="tk-half">${row}</span><span class="tk-half" aria-hidden="true" inert>${row}</span>`;
  }
  ticker(); setInterval(ticker, 20000); KX.on('info', ticker); KX.on('online', ticker);
  $('#tickerbar').addEventListener('click', e => { const b = e.target.closest('[data-open]'); b && window.KOS.open(b.dataset.open); });
  KX.on('online', on => {
    const p = $('#livepill'); p.classList.toggle('on', on); p.classList.toggle('off', !on);
    $('#livetxt').textContent = on ? 'live' : 'simulated'; p.title = on ? 'Connected to the real Kaspa network' : 'Can\'t reach api.kaspa.org. Showing a simulated rhythm.';
    $('#wp-mode').textContent = on ? 'live from the real network' : 'simulated (the network API is unreachable)';
    if (!on) toast('Can\'t reach the Kaspa network right now. The blocks you see are simulated until it\'s back.', 5000);
  });
  KX.on('score', () => { const r = S.rateBps; $('#wp-bps').textContent = r ? r.toFixed(1) : '10'; });

  /* ---------- clock (tap it 5 times) ---------- */
  let taps = 0, tapT;
  function clock() { $('#clock').textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  clock(); setInterval(clock, 15000);
  $('#clock').onclick = () => { taps++; clearTimeout(tapT); tapT = setTimeout(() => taps = 0, 1500);
    if (taps >= 5) { taps = 0; const n = S.blueScore && S.firstScore ? S.blueScore - S.firstScore : null;
      say(n ? `Since you opened this page, Kaspa has made about ${KX.fmt(n)} blocks. On Bitcoin's schedule that would take ${(n * 10 / 60 / 24).toFixed(1)} days.` : 'Time is a flat circle. Blocks are small squares. Tap the clock again in a minute.'); } };

  console.log('%cKaspOS', 'font:800 28px sans-serif;color:#49eacb;text-shadow:2px 2px #ff5fa2', '\nYou opened the console. Respect. Everything here is plain files, no tracking, no build step. Live numbers come from api.kaspa.org.');

  window.KOS = { $, $$, esc, rnd, isNarrow, store, toast, rain, floatText, say, award, got, STICKERS, yay, nope, blip, TIPS, APPS: {},
    app(id, def) { this.APPS[id] = def; }, nextTip() { say(TIPS[tipI++ % TIPS.length]); } };
})();
