/* Homepage: renders tool cards and the "recently used" list (localStorage, key mp_recent). */
(() => {
  const KEY = 'mp_recent', $ = s => document.querySelector(s);
  const read = () => { try { const r = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(r) ? r : [] } catch { return [] } };
  const remember = id => { try { localStorage.setItem(KEY, JSON.stringify([id, ...read().filter(x => x !== id)].slice(0, 4))) } catch { } };
  const card = t => t.status === 'live'
    ? `<a class="card" href="${t.href}" data-id="${t.id}"><span class="icon">${t.icon}</span><h3>${t.name}</h3><p>${t.desc}</p><span class="open">Open tool →</span></a>`
    : `<article class="card soon" aria-label="${t.name}, coming soon"><span class="icon">${t.icon}</span><h3>${t.name}</h3><p>${t.desc}</p><span class="badge">COMING SOON</span></article>`;
  function renderRecent() {
    const items = read().map(id => TOOLS.find(t => t.id === id && t.status === 'live')).filter(Boolean);
    $('#recent').innerHTML = items.length ? items.map(t => `<a href="${t.href}" data-id="${t.id}"><span class="icon">${t.icon}</span>${t.name}</a>`).join('') : '';
    $('#recentEmpty').hidden = items.length > 0;
  }
  $('#tools').innerHTML = TOOLS.map(card).join('');
  document.addEventListener('click', e => { const a = e.target.closest('a[data-id]'); if (a) remember(a.dataset.id) });
  window.addEventListener('pageshow', renderRecent); // also refreshes when returning via Back
  renderRecent(); $('#year').textContent = new Date().getFullYear();
})();
