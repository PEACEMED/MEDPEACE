/* Timer state machine, no UI. Time is derived from timestamps, never from counting ticks.
   Status: idle | studying | break | paused. */
const Study = (() => {
  const KEY = 'ps_active', now = () => Date.now();
  const fresh = () => ({ id: 's_' + now().toString(36) + Math.random().toString(36).slice(2, 7), createdAt: now(), status: 'idle', studyMs: 0, segStart: null, breakStart: null, flag: 0, breaks: [], lastLap: 0, laps: [] });
  const valid = s => s && ['idle', 'studying', 'break', 'paused'].includes(s.status) && typeof s.studyMs === 'number' && Array.isArray(s.breaks) && Array.isArray(s.laps);
  let s = Store.get(KEY, null); if (!valid(s)) s = fresh();
  const save = () => Store.set(KEY, s);
  const studyMs = () => s.studyMs + (s.status === 'studying' ? now() - s.segStart : 0);
  const breakMs = () => s.status === 'break' ? now() - s.breakStart : 0;
  const freeze = () => { if (s.status === 'studying') { s.studyMs += now() - s.segStart; s.segStart = null } };
  const closeBreak = limit => { const e = now(), d = e - s.breakStart; s.breaks.push({ start: s.breakStart, end: e, duration: d, extended: d > limit }); s.breakStart = null; s.flag = 0 };
  return {
    get: () => s, save, studyMs, breakMs,
    start() { if (s.status === 'idle') s.createdAt = now(); if (s.status === 'idle' || s.status === 'paused') { s.status = 'studying'; s.segStart = now(); save() } },
    pause() { if (s.status === 'studying') { freeze(); s.status = 'paused'; save() } },
    takeBreak() { if (s.status === 'studying' || s.status === 'paused') { freeze(); s.status = 'break'; s.breakStart = now(); save() } },
    resume(limit) { if (s.status === 'break') { closeBreak(limit); s.status = 'studying'; s.segStart = now(); save() } },
    lap() { const t = studyMs(); s.laps.push(t - s.lastLap); s.lastLap = t; save() },
    reset() { s = fresh(); save() },
    /* Close any open break, freeze study time, return a record, start a fresh state. */
    finish(limit) {
      if (s.status === 'break') closeBreak(limit); freeze();
      const rec = { id: s.id, start: s.createdAt, end: now(), studyMs: s.studyMs, breaks: s.breaks, laps: s.laps };
      s = fresh(); save(); return rec;
    }
  };
})();
