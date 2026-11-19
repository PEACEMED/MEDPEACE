/* Completed-session history and per-session statistics, separate from the running session. */
const Sessions = (() => {
  const KEY = 'ps_history';
  const all = () => { const h = Store.get(KEY, []); return (Array.isArray(h) ? h : []).filter(x => x && x.id && typeof x.studyMs === 'number' && Array.isArray(x.breaks)) };
  const add = r => { const h = all(); if (h.some(x => x.id === r.id)) return false; h.push(r); return Store.set(KEY, h) }; // id check prevents duplicates
  const remove = id => Store.set(KEY, all().filter(x => x.id !== id));
  const clear = () => Store.del(KEY);
  function stats(r) {
    const br = r.breaks.reduce((a, b) => a + b.duration, 0), n = r.breaks.length;
    return {
      study: r.studyMs, brk: br, total: r.studyMs + br, count: n, avg: n ? br / n : 0, longest: n ? Math.max(...r.breaks.map(b => b.duration)) : 0,
      eff: r.studyMs + br > 0 ? Math.round(r.studyMs / (r.studyMs + br) * 100) : 0
    };
  }
  function feedback(r) {
    const s = stats(r);
    if (s.study < 60000) return 'Short session saved. Every start counts!';
    if (!s.count) return 'Excellent consistency! You studied without a single break.';
    if (s.eff >= 85) return 'Great job maintaining your focus.';
    if (s.eff >= 65) return 'You completed a productive study session.';
    return 'You took several breaks. Consider reviewing your study rhythm.';
  }
  return { all, add, remove, clear, stats, feedback };
})();
