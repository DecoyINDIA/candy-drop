/* Shared, dependency-free data and persistence. Also importable by Node tests. */
(function (root, factory) {
  'use strict';
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.ArcadeCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CATALOG = [
    { id: 'neon-dojo', title: 'Neon Dojo', category: 'Fighting', group: 'Action', color: '#fb719f', hook: 'Read the rival. Land the counter.', duration: '1–3 min', tag: 'Fight for the crown' },
    { id: 'sunset-sprint', title: 'Sunset Sprint', category: 'Racing', group: 'Racing', color: '#ffb86b', hook: 'Chase the horizon. Beat the clock.', duration: '1–2 min', tag: 'Find your racing line' },
    { id: 'pocket-striker', title: 'Pocket Striker', category: 'Football', group: 'Sports', color: '#a4e87b', hook: 'One pitch. Every touch matters.', duration: '75-second match', tag: 'Play the beautiful game' },
    { id: 'orbit-guard', title: 'Orbit Guard', category: 'Strategy', group: 'Strategy', color: '#b2a0ff', hook: 'Build smart. Hold the final wave.', duration: '3–5 min', tag: 'Your defense. Your call.' },
    { id: 'mini-golf-club', title: 'Mini Golf Club', category: 'Physics', group: 'Sports', color: '#79e2c1', hook: 'Six holes. One perfect little round.', duration: '4–6 min', tag: 'Find a better angle' },
    { id: 'skybound', title: 'Skybound', category: 'Platformer', group: 'Action', color: '#87caff', hook: 'Leap the rooftops. Keep your flow.', duration: '1 min', tag: 'Take the scenic route' },
    { id: 'starfall', title: 'Starfall', category: 'Space shooter', group: 'Action', color: '#c3a3ff', hook: 'A small ship. A very big mission.', duration: '2–3 min', tag: 'Make every wave count' },
    { id: 'merge-lab', title: 'Merge Lab', category: 'Number puzzle', group: 'Puzzle', color: '#ffd27b', hook: 'Make room for your next big idea.', duration: 'At your pace', tag: 'Think a move ahead' },
    { id: 'candy-drop', title: 'Candy Drop', category: 'Original arcade', group: 'Original', color: '#ff8dc5', hook: 'Catch the candy. Chase the combo.', duration: 'One more try', tag: 'The one that started it' }
  ];
  const STORAGE_KEY = 'candy-arcade-v1';
  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
    return value >>> 0;
  }
  function random(seed) {
    let value = typeof seed === 'number' ? seed >>> 0 : hash(String(seed));
    return function () {
      value += 0x6D2B79F5;
      let n = Math.imul(value ^ (value >>> 15), value | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dayKey(date = new Date()) { return date.toISOString().slice(0, 10); }
  function dailyGame(day = dayKey()) { return CATALOG[hash(day) % 8]; }
  function score(value) { return Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0; }
  function medal(value, thresholds) { return thresholds.reduce((count, threshold) => count + (value >= threshold ? 1 : 0), 0); }
  function blank() { return { version: 1, games: {}, favorites: [], sound: true, last: null }; }
  function sanitize(data) {
    const out = blank();
    if (!data || typeof data !== 'object') return out;
    out.sound = data.sound !== false;
    out.last = CATALOG.some(g => g.id === data.last) ? data.last : null;
    out.favorites = Array.isArray(data.favorites) ? [...new Set(data.favorites.filter(id => CATALOG.some(g => g.id === id)))] : [];
    for (const game of CATALOG) {
      const entry = data.games && data.games[game.id];
      if (!entry || typeof entry !== 'object') continue;
      out.games[game.id] = {
        best: score(entry.best), medals: Math.min(3, score(entry.medals)),
        plays: Math.min(1e9, score(entry.plays)), completed: Math.min(1e9, score(entry.completed)),
        daily: entry.daily && /^\d{4}-\d{2}-\d{2}$/.test(entry.daily.day) ? { day: entry.daily.day, best: score(entry.daily.best), medals: Math.min(3, score(entry.daily.medals)) } : null
      };
    }
    return out;
  }
  function storage(adapter) {
    let memory = blank();
    let available = true;
    function read() {
      if (!available) return sanitize(memory);
      let raw;
      try { raw = adapter.getItem(STORAGE_KEY); }
      catch (_) { available = false; return sanitize(memory); }
      if (raw) {
        try { memory = sanitize(JSON.parse(raw)); }
        catch (_) { memory = blank(); }
      }
      return sanitize(memory);
    }
    function write(data) {
      memory = sanitize(data);
      if (available) {
        try { adapter.setItem(STORAGE_KEY, JSON.stringify(memory)); }
        catch (_) { available = false; }
      }
      return sanitize(memory);
    }
    function change(fn) { const data = read(); fn(data); return write(data); }
    function entry(data, id) {
      if (!data.games[id]) data.games[id] = { best: 0, medals: 0, plays: 0, completed: 0, daily: null };
      return data.games[id];
    }
    return {
      read, write, change, available: () => available,
      begin(id) { return change(data => { entry(data, id).plays++; data.last = id; }); },
      finish(id, value, thresholds, mode = 'classic', day = dayKey()) {
        return change(data => {
          const item = entry(data, id); item.completed++;
          const points = score(value), rank = medal(points, thresholds);
          if (mode === 'daily') {
            if (item.daily && item.daily.day > day) return;
            if (!item.daily || item.daily.day !== day) item.daily = { day, best: 0, medals: 0 };
            item.daily.best = Math.max(item.daily.best, points);
            item.daily.medals = Math.max(item.daily.medals, rank);
          } else {
            item.best = Math.max(item.best, points);
            item.medals = Math.max(item.medals, rank);
          }
        });
      }
    };
  }
  function browserStorage() {
    return storage({ getItem(key) { return window.localStorage.getItem(key); }, setItem(key, value) { window.localStorage.setItem(key, value); } });
  }
  function href(game, prefix = '') { return game.id === 'candy-drop' ? prefix + 'index.html' : prefix + 'games/' + game.id + '/index.html'; }
  return { CATALOG, STORAGE_KEY, hash, random, dayKey, dailyGame, score, medal, blank, sanitize, storage, browserStorage, href };
});
