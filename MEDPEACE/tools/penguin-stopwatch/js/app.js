/* UI wiring. Timer logic: stopwatch.js. Persistence: storage.js. */
const App = (() => {
  const $ = s => document.querySelector(s);
  const fmt = ms => { const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60, p = n => String(n).padStart(2, '0'); return h ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}` };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const settings = () => ({ breakLimitMin: 15, autoReset: false, ...Store.get('ps_settings', {}) });
  const limit = () => Math.max(1, Number(settings().breakLimitMin) || 15) * 60000;
  const dt = t => new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const tm = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let toastT, asked = null;
  function toast(m) { const e = $('#toast'); e.textContent = m; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 3500) }

  const LABEL = { idle: 'READY', studying: 'FOCUSING', break: 'ON BREAK', paused: 'PAUSED' };
  function render() {
    const s = Study.get(), st = Study.studyMs(), b = Study.breakMs(), last = s.breaks.length ? s.breaks[s.breaks.length - 1].duration : 0;
    $('#status').textContent = LABEL[s.status]; $('#main').textContent = fmt(st); $('#lap').textContent = fmt(st - s.lastLap);
    $('#info').textContent = s.status === 'idle' && !s.breaks.length ? '' : `Focus ${fmt(st)} · ${s.status === 'break' ? 'Break' : 'Last break'} ${fmt(s.status === 'break' ? b : last)} · Breaks ${s.breaks.length}`;
    const sb = $('#startBtn'), bb = $('#breakBtn'), lb = $('#lapBtn');
    sb.textContent = s.status === 'studying' ? 'Pause' : s.status === 'paused' ? 'Resume' : 'Start'; sb.disabled = s.status === 'break';
    bb.textContent = s.status === 'break' ? 'Resume Study' : 'Take a Break'; bb.disabled = s.status === 'idle';
    lb.textContent = s.status === 'studying' ? 'Lap' : 'Reset'; lb.disabled = s.status === 'break' || (s.status === 'idle' && st === 0);
    $('#endBtn').disabled = s.status === 'idle';
    if (s.status === 'break' && b > limit()) { // extended break: notify once; never auto-resume or delete anything
      if (!s.flag) { s.flag = 1; Study.save(); toast('Extended break: you passed your ' + settings().breakLimitMin + ' min limit.') }
      if (settings().autoReset && b > limit() * 2 && asked !== s.breakStart) { asked = s.breakStart; if (confirm('Very long break. End this session and start a new one?')) endSession(true) }
    }
  }
  const loop = () => { if (!$('#v-timer').hidden) render(); requestAnimationFrame(loop) };

  function endSession(skipConfirm) {
    const s = Study.get(); if (s.status === 'idle') return;
    if (!skipConfirm && s.status === 'break' && !confirm('You are on a break. End the break and finish the session?')) return;
    const rec = Study.finish(limit());
    if (rec.studyMs < 1000 && !rec.breaks.length) { toast('Nothing to save.'); render(); return }
    if (!Sessions.add(rec)) toast('Could not save (storage full or duplicate).');
    summary(rec);
  }

  const page = html => { $('#v-timer').hidden = true; const p = $('#v-page'); p.hidden = false; p.innerHTML = html; window.scrollTo(0, 0) };
  function nav(v) { closeMenu(); if (v === 'timer') { $('#v-page').hidden = true; $('#v-timer').hidden = false; render(); return } ({ history, stats, settings: settingsPage, about })[v]() }
  function summary(r) {
    const x = Sessions.stats(r);
    page(`<h1>Session Summary</h1><p>${dt(r.start)} · ${tm(r.start)}–${tm(r.end)}</p>
    <div class="grid"><div class="stat"><b>${fmt(x.study)}</b><span>Total study time</span></div><div class="stat"><b>${fmt(x.brk)}</b><span>Total break time</span></div>
    <div class="stat"><b>${fmt(x.total)}</b><span>Session duration</span></div><div class="stat"><b>${x.count}</b><span>Breaks</span></div>
    <div class="stat"><b>${fmt(x.avg)}</b><span>Average break</span></div><div class="stat"><b>${fmt(x.longest)}</b><span>Longest break</span></div></div>
    <b>Focus efficiency: ${x.eff}%</b><div class="bar"><i style="width:${x.eff}%"></i></div>
    <p><b>${Sessions.feedback(r)}</b></p><p class="muted" style="margin-top:.4rem">Time statistics show how long you studied, not how well you learned.</p>
    ${r.breaks.length ? '<h3 style="margin:1rem 0 .3rem">Breaks</h3>' + r.breaks.map((b, i) => `<div class="row"><span>#${i + 1} · ${tm(b.start)}–${tm(b.end)}</span><span>${fmt(b.duration)}${b.extended ? ' ⚠ extended' : ''}</span></div>`).join('') : ''}
    <div class="btns"><button class="btn primary" data-go="home">Save &amp; Return Home</button><button class="btn" data-go="new">Start New Session</button></div>`);
  }
  function history() {
    const h = Sessions.all().sort((a, b) => b.start - a.start);
    page(`<h1>Study History</h1>` + (h.length ? h.map(r => {
      const x = Sessions.stats(r); return `<div class="card"><b>${dt(r.start)}</b><br><small>${tm(r.start)}–${tm(r.end)} · Focus ${fmt(x.study)} · Break ${fmt(x.brk)} · ${x.count} breaks · ${x.eff}%</small>
      <div class="det">${r.breaks.map((b, i) => `<div class="row"><span>Break #${i + 1} (${tm(b.start)})</span><span>${fmt(b.duration)}${b.extended ? ' ⚠' : ''}</span></div>`).join('') || '<p>No breaks.</p>'}<div class="btns"><button class="btn" data-del="${esc(r.id)}">Delete</button></div></div></div>`
    }).join('') + `<div class="btns"><button class="btn" data-clear>Clear all history</button></div>` : `<p>No sessions yet. Finish a study session and it will appear here. 🐧</p><div class="btns"><button class="btn primary" data-go="home">Start studying</button></div>`));
  }
  function stats() {
    const s = Stats.compute();
    page(`<h1>Statistics</h1>${s.n ? '' : '<p>Complete a session to see your statistics.</p>'}<div class="grid">
    <div class="stat"><b>${fmt(s.today)}</b><span>Study today</span></div><div class="stat"><b>${fmt(s.week)}</b><span>Study this week</span></div>
    <div class="stat"><b>${s.n}</b><span>Completed sessions</span></div><div class="stat"><b>${fmt(s.avgDur)}</b><span>Avg session</span></div>
    <div class="stat"><b>${fmt(s.brk)}</b><span>Total break time</span></div><div class="stat"><b>${s.avgEff}%</b><span>Avg focus efficiency</span></div></div>
    <h3>Last 7 days</h3>${Stats.chart(s.days)}`);
  }
  function settingsPage() {
    const c = settings(), t = Theme.get();
    page(`<h1>Settings</h1><label for="bl">Maximum break (minutes)</label><input type="number" id="bl" min="1" max="240" value="${c.breakLimitMin}">
    <label><input type="checkbox" id="ar" ${c.autoReset ? 'checked' : ''}> Offer to end the session after a very long break</label>
    <label for="ac">Accent color</label><input type="color" id="ac" value="${t.accent || '#01c1fc'}">
    <label for="in">Interface intensity</label><input type="range" id="in" min="0" max="1" step=".05" value="${t.intensity}">
    <div class="btns"><button class="btn" id="ra">Restore auto colors</button><button class="btn" id="rs">Reset all customization</button></div>`);
    $('#bl').onchange = e => { const v = Math.min(240, Math.max(1, Number(e.target.value) || 15)); e.target.value = v; Store.set('ps_settings', { ...settings(), breakLimitMin: v }) };
    $('#ar').onchange = e => Store.set('ps_settings', { ...settings(), autoReset: e.target.checked });
    $('#ac').oninput = e => Theme.setAccent(e.target.value); $('#in').oninput = e => Theme.setIntensity(+e.target.value);
    $('#ra').onclick = () => { Theme.restoreAuto(); settingsPage() }; $('#rs').onclick = resetAll;
  }
  async function resetAll() { if (!confirm('Reset theme colors and wallpaper to the defaults?')) return; await Wall.remove(); Theme.reset(); toast('Customization reset'); if (!$('#v-page').hidden && $('#bl')) settingsPage() }
  const about = () => page(`<h1>About Penguin Stopwatch 🐧</h1><p>A distraction-free study session tracker. It records focus time and breaks separately and saves everything in your browser only. Your data and wallpaper are never uploaded. ENJOY!!!! <span style="color: #000; font-size: 18px; font-weight: 900;">  <br> * Made by <i> Dr.Mohamed Abdelfatah</i> wish you a happy medical life :) <span> </p>`);

  const menu = $('#menu'), mb = $('#menuBtn');
  function openMenu() { menu.classList.add('open'); $('#scrim').classList.add('open'); mb.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false'); menu.querySelector('button').focus() }
  function closeMenu() { menu.classList.remove('open'); $('#scrim').classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true') }

  function init() {
    Theme.apply(); Wall.init();
    mb.onclick = () => menu.classList.contains('open') ? closeMenu() : openMenu(); $('#scrim').onclick = closeMenu;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu() });
    menu.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.nav) nav(b.dataset.nav); else { closeMenu(); b.dataset.act === 'wall' ? Wall.openDialog() : resetAll() } };
    $('#startBtn').onclick = () => { Study.get().status === 'studying' ? Study.pause() : Study.start(); render() };
    $('#breakBtn').onclick = () => { Study.get().status === 'break' ? Study.resume(limit()) : Study.takeBreak(); render() };
    $('#lapBtn').onclick = () => { if (Study.get().status === 'studying') Study.lap(); else if (confirm('Reset the stopwatch? Unsaved time will be lost.')) Study.reset(); render() };
    $('#endBtn').onclick = () => endSession(false);
    $('#fsBtn').onclick = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); $('#fsBtn').textContent = '⤢' } else { document.exitFullscreen(); $('#fsBtn').textContent = '⛶' } };
    $('#v-page').addEventListener('click', e => {
      const t = e.target, go = t.closest('[data-go]'), del = t.closest('[data-del]'), card = t.closest('.card');
      if (go) { nav('timer'); if (go.dataset.go === 'new') { Study.start(); render() } }
      else if (del) { if (confirm('Delete this session?')) { Sessions.remove(del.dataset.del); history() } }
      else if (t.closest('[data-clear]')) { if (confirm('Delete ALL saved sessions? This cannot be undone.')) { Sessions.clear(); history() } }
      else if (card) card.classList.toggle('open');
    });
    render(); requestAnimationFrame(loop);
  }
  document.addEventListener('DOMContentLoaded', init);
  return { toast };
})();
