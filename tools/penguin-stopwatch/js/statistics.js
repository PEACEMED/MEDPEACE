/* Aggregates computed only from saved sessions. */
const Stats = (() => {
  const WEEK_START = 6; // Saturday (Egypt). Use 1 for Monday.
  const day0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() };
  function compute() {
    const h = Sessions.all(), today = day0(Date.now()), wk = today - ((new Date().getDay() - WEEK_START + 7) % 7) * 864e5;
    const ss = h.map(r => ({ r, s: Sessions.stats(r) })), sum = (f, k) => f.reduce((a, x) => a + x.s[k], 0);
    const days = [...Array(7)].map((_, i) => { const d = today - (6 - i) * 864e5; return { d, ms: ss.filter(x => day0(x.r.start) === d).reduce((a, x) => a + x.s.study, 0) } });
    return {
      n: h.length, today: sum(ss.filter(x => day0(x.r.start) === today), 'study'), week: sum(ss.filter(x => x.r.start >= wk), 'study'),
      avgDur: h.length ? sum(ss, 'total') / h.length : 0, brk: sum(ss, 'brk'), avgEff: h.length ? Math.round(sum(ss, 'eff') / h.length) : 0, days
    };
  }
  function chart(days) {
    const max = Math.max(...days.map(d => d.ms), 1);
    return `<svg viewBox="0 0 280 110" width="100%" role="img" aria-label="Study time, last 7 days">` + days.map((d, i) => {
      const h = Math.round(d.ms / max * 70); return `<rect x="${i * 40 + 6}" y="${80 - h}" width="28" height="${Math.max(h, 2)}" rx="6" fill="var(--primary)"/><text x="${i * 40 + 20}" y="98" font-size="10" text-anchor="middle" fill="var(--text-secondary)">${new Date(d.d).toLocaleDateString('en', { weekday: 'short' })}</text>`
    }).join('') + `</svg>`;
  }
  return { compute, chart };
})();
