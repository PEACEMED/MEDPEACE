/* Central storage: localStorage (safe JSON) + IndexedDB (wallpaper blobs). */
const Store = (() => {
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v } catch { return d } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch { return false } };
  const del = k => { try { localStorage.removeItem(k) } catch { } };
  const db = () => new Promise((res, rej) => { const r = indexedDB.open('penguin', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) });
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const q = fn(d.transaction('kv', mode).objectStore('kv')); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) }) };
  return { get, set, del, idbGet: k => tx('readonly', s => s.get(k)).catch(() => null), idbPut: (k, v) => tx('readwrite', s => s.put(v, k)), idbDel: k => tx('readwrite', s => s.delete(k)).catch(() => { }) };
})();
