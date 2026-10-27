/* Readouts, conductor bar, welcome-back, share, palette, keys, easter egg. */
(() => {
  const KX = window.KX, S = KX.S, $ = id => document.getElementById(id);
  const toast = (msg, ms = 2600) => { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, ms); };
  const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const ago = ms => { const m = Math.round(ms / 60000); if (m < 60) return m + ' minute' + (m === 1 ? '' : 's'); const h = Math.round(m / 60); if (h < 48) return h + ' hour' + (h === 1 ? '' : 's'); return Math.round(h / 24) + ' days'; };
  const prev = LS.get('kx-last'); let greeted = false, lastSave = 0;
  const atParam = +new URL(location.href).searchParams.get('at') || 0;

  KX.on('online', on => { $('livedot').classList.toggle('on', on); $('livetxt').textContent = on ? 'Live from the Kaspa network' : 'Can\u2019t reach api.kaspa.org. Showing a simulated rhythm.'; if (!on) { $('c-tempo').textContent = '600 (sim)'; ['r-rate','r-score','r-hash','r-reward'].forEach(id => { const n = $(id); if (n && /…|measuring/.test(n.textContent)) n.textContent = 'offline'; }); } });
  KX.on('score', ({ score }) => {
    if (score == null) return;
    $('r-score').textContent = KX.fmt(score);
    $('r-rate').textContent = S.perMin ? KX.fmt(S.perMin) : 'measuring…';
    $('c-tempo').textContent = S.perMin ? KX.fmt(Math.round(S.perMin / 10) * 10) : '…';
    $('c-since').textContent = KX.fmt(score - S.firstScore);
    if (!greeted) { greeted = true; const w = $('welcome');
      if (atParam && atParam < score) { w.hidden = false; w.textContent = `Someone shared a moment with you. Since then the network has added about ${KX.fmt(score - atParam)} blocks.`; }
      else if (prev && prev.score && score - prev.score > 100) { w.hidden = false; w.textContent = `Welcome back. In the ${ago(Date.now() - prev.t)} since your last visit, about ${KX.fmt(score - prev.score)} blocks were added. Nobody threw any away.`; } }
    if (Date.now() - lastSave > 5000) { lastSave = Date.now(); LS.set('kx-last', { score, t: Date.now() }); }
  });
  KX.on('info', () => {
    if (S.reward) $('r-reward').innerHTML = S.reward.toFixed(2) + ' <small>KAS</small>';
    if (S.hashTH) $('r-hash').innerHTML = KX.fmt(S.hashTH / 1000) + ' <small>PH/s</small>';
    if (S.next) { const d = S.next - Date.now(); $('c-next').textContent = d > 0 ? 'in ' + (d > 86400000 ? Math.round(d / 86400000) + ' d' : Math.round(d / 3600000) + ' h') : 'now'; }
  });

  // share
  $('c-share').onclick = async () => {
    const u = new URL(location.origin + location.pathname); if (S.blueScore) u.searchParams.set('at', S.blueScore);
    const text = u.toString();
    try { if (navigator.share && matchMedia('(pointer:coarse)').matches) { await navigator.share({ title: 'Kaspa, played live', url: text }); return; } await navigator.clipboard.writeText(text); toast('Link copied. Whoever opens it sees how many blocks happened since this second.'); }
    catch (e) { toast(text, 6000); }
  };
  // sound
  const toggleSound = () => { KX.audio.set(!KX.audio.on); toast(KX.audio.on ? 'Sound on: each block plays a note.' : 'Sound off.', 1600); };
  $('sound') && ($('sound').onclick = toggleSound); $('c-sound').onclick = toggleSound;

  // palette
  const pal = $('pal'), inp = $('pal-in'), list = $('pal-list');
  const entries = [...document.querySelectorAll('.programme li a')].map((a, i) => ({ href: a.getAttribute('href'), name: a.querySelector('.t').firstChild.textContent.trim(), sub: a.querySelector('em').textContent, k: i + 1 }))
    .concat([{ href: '#notes', name: 'Receipts', sub: 'every source', k: '' }, { href: '#top', name: 'Back to the live score', sub: '', k: '' }]);
  let sel = 0, shown = entries, lastFocus = null;
  function renderPal() { const q = inp.value.toLowerCase(); shown = entries.filter(e => (e.name + ' ' + e.sub + ' ' + e.href).toLowerCase().includes(q)); sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.map((e, i) => `<li role="option" id="po${i}" aria-selected="${i === sel}" data-h="${e.href}">${e.name}<small>${e.k ? 'press ' + e.k : ''}</small></li>`).join('') || '<li>Nothing by that name. Try "toccata".</li>';
    inp.setAttribute('aria-activedescendant', 'po' + sel); }
  function openPal() { lastFocus = document.activeElement; pal.hidden = false; inp.value = ''; sel = 0; renderPal(); inp.focus(); }
  function closePal() { pal.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); }
  function go(h) { closePal(); const el = h === '#top' ? document.body : document.querySelector(h); el && el.scrollIntoView({ behavior: KX.reduced ? 'auto' : 'smooth' }); if (h !== '#top') history.replaceState(null, '', h); }
  inp.oninput = () => { if (inp.value.trim().toLowerCase() === 'toccata') { closePal(); toccata(); return; } sel = 0; renderPal(); };
  inp.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); renderPal(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); renderPal(); e.preventDefault(); } else if (e.key === 'Enter' && shown[sel]) go(shown[sel].href); else if (e.key === 'Escape') closePal(); };
  list.onclick = e => { const li = e.target.closest('li[data-h]'); li && go(li.dataset.h); };
  pal.onclick = e => { if (e.target === pal) closePal(); };
  $('c-menu').onclick = openPal;

  // keys + easter egg
  let typed = '';
  addEventListener('keydown', e => {
    const t = e.target; if (t.matches && t.matches('input,textarea,select,[contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openPal(); return; }
    if (/^[1-9]$/.test(e.key)) { const a = document.querySelectorAll('.programme li a')[+e.key - 1]; a && go(a.getAttribute('href')); return; }
    if (e.key === 's') toggleSound();
    typed = (typed + e.key.toLowerCase()).slice(-7); if (typed === 'toccata') toccata();
  });
  // Opening of Bach's Toccata in D minor (BWV 565): A-G-A, G-F-E-D-C#-D, transposed for a sine wave
  function toccata() {
    KX.audio.set(true); const seq = [[880, 120], [784, 120], [880, 900], [784, 110], [698, 110], [659, 110], [587, 110], [554, 450], [587, 1200]];
    let t = 0; seq.forEach(([f, d]) => { setTimeout(() => KX.audio.note(f, d / 1000 + .3, .07, 'sawtooth'), t); t += d + 40; });
    toast('Toccata: also the name of the June 2026 upgrade that switched covenants on. Like Crescendo before it, a musical name.', 5000);
  }
})();
