/* Live data bus. Everything here comes from the public api.kaspa.org; on failure we say so and simulate. */
(() => {
  const API = 'https://api.kaspa.org';
  const subs = {};
  const S = { online: null, blueScore: null, firstScore: null, rateBps: 10, perMin: null, hashTH: null, reward: null,
    circ: null, max: 28704035605, next: null, nextAmt: null, samples: [] };
  const KX = window.KX = {
    S, API,
    on(ev, fn) { (subs[ev] ||= []).push(fn); },
    emit(ev, d) { (subs[ev] || []).forEach(f => { try { f(d); } catch (e) { console.warn(e); } }); },
    fmt(n, d = 0) { return n == null || isNaN(n) ? '…' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d }); },
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
  async function j(path, ms = 7000) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
    try { const r = await fetch(API + path, { signal: c.signal, cache: 'no-store' }); if (!r.ok) throw new Error(r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  KX.j = j;
  const hist = []; // [time, score]
  let fails = 0;
  function setOnline(v) { if (S.online !== v) { S.online = v; KX.emit('online', v); } }
  async function pollScore() {
    if (document.hidden) return;
    try {
      const d = await j('/info/virtual-chain-blue-score', 4000);
      const now = performance.now(); const sc = Number(d.blueScore);
      if (!sc) throw new Error('bad');
      fails = 0; setOnline(true);
      if (S.firstScore == null) S.firstScore = sc;
      const prev = S.blueScore; S.blueScore = sc;
      if (prev != null && sc !== prev) hist.push([now, sc]); while (hist.length > 2 && now - hist[0][0] > 120000) hist.shift(); // API caches; only count real changes
      if (hist.length > 2) {
        const [t0, s0] = hist[0], [t1, s1] = hist[hist.length - 1]; const dt = (t1 - t0) / 1000;
        if (dt > 20) { S.rateBps = Math.max(1, Math.min(20, (s1 - s0) / dt)); S.perMin = Math.round(S.rateBps * 60); }
      }
      const delta = prev == null ? 0 : Math.max(0, Math.min(60, sc - prev));
      KX.emit('score', { score: sc, delta });
    } catch (e) {
      if (++fails >= 3) setOnline(false);
      /* offline ticks come from score.js */
    }
  }
  async function pollInfo() {
    const r = await Promise.allSettled([j('/info/hashrate'), j('/info/blockreward'), j('/info/coinsupply'), j('/info/halving')]);
    if (r[0].status === 'fulfilled') S.hashTH = r[0].value.hashrate;
    if (r[1].status === 'fulfilled') S.reward = r[1].value.blockreward;
    if (r[2].status === 'fulfilled') { S.circ = Number(BigInt(r[2].value.circulatingSupply) / 100000000n); S.max = Number(BigInt(r[2].value.maxSupply) / 100000000n); }
    if (r[3].status === 'fulfilled') { S.next = r[3].value.nextHalvingTimestamp * 1000; S.nextAmt = r[3].value.nextHalvingAmount; }
    KX.emit('info', S);
  }
  async function sample() {
    if (document.hidden || !S.online || S.blueScore == null) return;
    try {
      const arr = await j('/blocks-from-bluescore?blueScore=' + (S.blueScore - 3) + '&includeTransactions=false', 6000);
      const b = Array.isArray(arr) ? arr[0] : null; if (!b) return;
      const v = b.verboseData || {}, h = b.header || {};
      KX.emit('sample', {
        hash: v.hash, blueScore: Number(v.blueScore || h.blueScore), daa: Number(h.daaScore), time: Number(h.timestamp),
        parents: (h.parents && h.parents[0] && h.parents[0].parentHashes || []).length,
        blues: (v.mergeSetBluesHashes || []).length, reds: (v.mergeSetRedsHashes || []).length,
        txs: (v.transactionIds || []).length, chain: !!v.isChainBlock,
      });
    } catch (e) { /* sampling is a garnish */ }
  }
  pollScore(); pollInfo();
  setInterval(pollScore, 1000); setInterval(pollInfo, 60000); setInterval(sample, 4000);
  setTimeout(sample, 1500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollScore(); });
})();
