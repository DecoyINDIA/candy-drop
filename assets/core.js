/* Shared, dependency-free data and persistence. Also importable by Node tests. */
(function (root, factory) {
  'use strict';
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.ArcadeCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CATALOG = [
    {
      "id": "neon-dojo",
      "title": "Neon Dojo",
      "category": "Fighting",
      "group": "Action",
      "color": "#fb719f",
      "hook": "Read the rival. Land the counter.",
      "duration": "1–3 min",
      "tag": "Fight for the crown"
    },
    {
      "id": "sunset-sprint",
      "title": "Sunset Sprint",
      "category": "Racing",
      "group": "Racing",
      "color": "#ffb86b",
      "hook": "Chase the horizon. Beat the clock.",
      "duration": "1–2 min",
      "tag": "Find your racing line"
    },
    {
      "id": "pocket-striker",
      "title": "Pocket Striker",
      "category": "Football",
      "group": "Sports",
      "color": "#a4e87b",
      "hook": "One pitch. Every touch matters.",
      "duration": "75-second match",
      "tag": "Play the beautiful game"
    },
    {
      "id": "orbit-guard",
      "title": "Orbit Guard",
      "category": "Strategy",
      "group": "Strategy",
      "color": "#b2a0ff",
      "hook": "Build smart. Hold the final wave.",
      "duration": "3–5 min",
      "tag": "Your defense. Your call."
    },
    {
      "id": "mini-golf-club",
      "title": "Mini Golf Club",
      "category": "Physics",
      "group": "Sports",
      "color": "#79e2c1",
      "hook": "Six holes. One perfect little round.",
      "duration": "4–6 min",
      "tag": "Find a better angle"
    },
    {
      "id": "skybound",
      "title": "Skybound",
      "category": "Platformer",
      "group": "Action",
      "color": "#87caff",
      "hook": "Leap the rooftops. Keep your flow.",
      "duration": "1 min",
      "tag": "Take the scenic route"
    },
    {
      "id": "starfall",
      "title": "Starfall",
      "category": "Space shooter",
      "group": "Action",
      "color": "#c3a3ff",
      "hook": "A small ship. A very big mission.",
      "duration": "2–3 min",
      "tag": "Make every wave count"
    },
    {
      "id": "merge-lab",
      "title": "Merge Lab",
      "category": "Number puzzle",
      "group": "Puzzle",
      "color": "#ffd27b",
      "hook": "Make room for your next big idea.",
      "duration": "At your pace",
      "tag": "Think a move ahead"
    },
    {
      "id": "four-in-row",
      "title": "Four in a Row",
      "category": "Tabletop",
      "group": "Tabletop",
      "color": "#ffcd76",
      "hook": "Build a fork. Connect your four.",
      "duration": "2–4 min",
      "tag": "Find the winning connection",
      "added": "2026-11-23"
    },
    {
      "id": "prism-breaker",
      "title": "Prism Breaker",
      "category": "Brick breaker",
      "group": "Action",
      "color": "#67e8f9",
      "hook": "Find your angle. Break a little brighter.",
      "duration": "1–3 min",
      "tag": "Four colorful formations",
      "added": "2026-11-23"
    },
    {
      "id": "mine-garden",
      "title": "Mine Garden",
      "category": "Minesweeper",
      "group": "Puzzle",
      "color": "#a3d6a4",
      "hook": "Read the numbers. Grow a safe garden.",
      "duration": "3–6 min",
      "tag": "A little careful thinking",
      "added": "2026-11-23"
    },
    {
      "id": "rooftop-rally",
      "title": "Rooftop Rally",
      "category": "Table tennis",
      "group": "Sports",
      "color": "#a8d4bf",
      "hook": "Find the paddle edge. Make the rooftop yours.",
      "duration": "1–3 min",
      "tag": "RALLY",
      "added": "2026-11-23"
    },
    {
      "id": "reversi-room",
      "title": "Reversi Room",
      "category": "Tabletop",
      "group": "Tabletop",
      "color": "#8fdfbc",
      "hook": "A quiet corner can change everything.",
      "duration": "3–5 min",
      "tag": "Turn the board your way",
      "added": "2026-11-23"
    },
    {
      "id": "serpent-garden",
      "title": "Serpent Garden",
      "category": "Snake",
      "group": "Action",
      "color": "#a3e635",
      "hook": "A growing appetite. A thoughtful route.",
      "duration": "1–3 min",
      "tag": "Leave a little room",
      "added": "2026-11-23"
    },
    {
      "id": "memory-lane",
      "title": "Memory Lane",
      "category": "Matching pairs",
      "group": "Puzzle",
      "color": "#f3b5a5",
      "hook": "Sixteen cards. Eight familiar faces.",
      "duration": "2–4 min",
      "tag": "Remember the little things",
      "added": "2026-11-23"
    },
    {
      "id": "hoops-minute",
      "title": "Hoops Minute",
      "category": "Basketball",
      "group": "Sports",
      "color": "#f2b693",
      "hook": "One minute. A drifting rim. Find your arc.",
      "duration": "1 min",
      "tag": "SHOOT",
      "added": "2026-11-23"
    },
    {
      "id": "tidal-tactics",
      "title": "Tidal Tactics",
      "category": "Naval strategy",
      "group": "Strategy",
      "color": "#89d9ec",
      "hook": "Find the fleet beneath the silence.",
      "duration": "2–4 min",
      "tag": "Make every sonar count",
      "added": "2026-11-23"
    },
    {
      "id": "meteor-drift",
      "title": "Meteor Drift",
      "category": "Asteroid survival",
      "group": "Action",
      "color": "#c4b5fd",
      "hook": "Trust your thrusters. Find clear skies.",
      "duration": "1–3 min",
      "tag": "Four drifting debris fields",
      "added": "2026-11-23"
    },
    {
      "id": "light-circuit",
      "title": "Light Circuit",
      "category": "Logic puzzle",
      "group": "Puzzle",
      "color": "#b6f875",
      "hook": "One switch changes the whole idea.",
      "duration": "3–6 min",
      "tag": "Find the quiet in the circuit",
      "added": "2026-11-23"
    },
    {
      "id": "pocket-bowler",
      "title": "Pocket Bowler",
      "category": "Bowling",
      "group": "Sports",
      "color": "#d9b48b",
      "hook": "Read the oil. Pick up the spare. Chase 300.",
      "duration": "2–4 min",
      "tag": "PRECISION",
      "added": "2026-11-23"
    },
    {
      "id": "royal-checkers",
      "title": "Royal Checkers",
      "category": "Tabletop",
      "group": "Tabletop",
      "color": "#eab98c",
      "hook": "Read the jump beyond the jump.",
      "duration": "3–6 min",
      "tag": "Play the long game",
      "added": "2026-11-23"
    },
    {
      "id": "bubble-bay",
      "title": "Bubble Bay",
      "category": "Bubble shooter",
      "group": "Puzzle",
      "color": "#5eead4",
      "hook": "One bright shot. A whole cluster free.",
      "duration": "1–3 min",
      "tag": "Let a little color go",
      "added": "2026-11-23"
    },
    {
      "id": "crate-escape",
      "title": "Crate Escape",
      "category": "Sokoban",
      "group": "Puzzle",
      "color": "#edba79",
      "hook": "A place for every crate.",
      "duration": "3–6 min",
      "tag": "Think before you push",
      "added": "2026-11-23"
    },
    {
      "id": "home-run-hero",
      "title": "Home Run Hero",
      "category": "Baseball",
      "group": "Sports",
      "color": "#d5cf92",
      "hook": "Twelve pitches, one perfect moment to swing.",
      "duration": "1 min",
      "tag": "TIMING",
      "added": "2026-11-23"
    },
    {
      "id": "dice-district",
      "title": "Dice District",
      "category": "Dice strategy",
      "group": "Tabletop",
      "color": "#f5cf89",
      "hook": "Five dice. Thirteen good decisions.",
      "duration": "3–5 min",
      "tag": "Make a little luck",
      "added": "2026-11-23"
    },
    {
      "id": "flappy-fin",
      "title": "Flappy Fin",
      "category": "One-button flight",
      "group": "Timing",
      "color": "#7dd3fc",
      "hook": "A tiny fin. A perfect little rhythm.",
      "duration": "1 min",
      "tag": "Catch the next current",
      "added": "2026-11-23"
    },
    {
      "id": "slide-studio",
      "title": "Slide Studio",
      "category": "Sliding puzzle",
      "group": "Puzzle",
      "color": "#adc6ec",
      "hook": "Fifteen tiles. One little space.",
      "duration": "At your pace",
      "tag": "Put the studio in order",
      "added": "2026-11-23"
    },
    {
      "id": "wicket-rush",
      "title": "Wicket Rush",
      "category": "Cricket",
      "group": "Sports",
      "color": "#c6dfa0",
      "hook": "Find the gap and chase 36 in two overs.",
      "duration": "1–2 min",
      "tag": "CHASE",
      "added": "2026-11-23"
    },
    {
      "id": "domino-trail",
      "title": "Domino Trail",
      "category": "Tabletop",
      "group": "Tabletop",
      "color": "#f3d5a2",
      "hook": "Follow the numbers. Clear your hand.",
      "duration": "2–5 min",
      "tag": "Find your way through",
      "added": "2026-11-23"
    },
    {
      "id": "tunnel-dash",
      "title": "Tunnel Dash",
      "category": "Reflex lanes",
      "group": "Timing",
      "color": "#a78bfa",
      "hook": "Read the opening. Stay one gate ahead.",
      "duration": "1 min",
      "tag": "Find your flow",
      "added": "2026-11-23"
    },
    {
      "id": "number-nook",
      "title": "Number Nook",
      "category": "Mini Sudoku",
      "group": "Puzzle",
      "color": "#d6b8df",
      "hook": "Four numbers. A moment of clarity.",
      "duration": "3–5 min",
      "tag": "A number for every nook",
      "added": "2026-11-23"
    },
    {
      "id": "downhill-dash",
      "title": "Downhill Dash",
      "category": "Ski racing",
      "group": "Racing",
      "color": "#b8dfe3",
      "hook": "Carve forty gates through a mountain morning.",
      "duration": "1–2 min",
      "tag": "SLALOM",
      "added": "2026-11-23"
    },
    {
      "id": "knight-quest",
      "title": "Knight Quest",
      "category": "Path puzzle",
      "group": "Puzzle",
      "color": "#c2b1f3",
      "hook": "Thirty-six squares. One winding path.",
      "duration": "At your pace",
      "tag": "Leave yourself a way out",
      "added": "2026-11-23"
    },
    {
      "id": "lava-lift",
      "title": "Lava Lift",
      "category": "Vertical platformer",
      "group": "Action",
      "color": "#fb923c",
      "hook": "Keep a little sky above you.",
      "duration": "1–2 min",
      "tag": "The only way is up",
      "added": "2026-11-23"
    },
    {
      "id": "color-flood",
      "title": "Color Flood",
      "category": "Flood puzzle",
      "group": "Puzzle",
      "color": "#e8bc80",
      "hook": "One corner becomes a whole canvas.",
      "duration": "2–4 min",
      "tag": "Let the color in",
      "added": "2026-11-23"
    },
    {
      "id": "archery-grove",
      "title": "Archery Grove",
      "category": "Archery",
      "group": "Sports",
      "color": "#c7d6ac",
      "hook": "Ten arrows. Read the breeze, trust your aim.",
      "duration": "1–3 min",
      "tag": "AIM",
      "added": "2026-11-23"
    },
    {
      "id": "constellation-link",
      "title": "Constellation Link",
      "category": "Spatial puzzle",
      "group": "Puzzle",
      "color": "#a9bdfa",
      "hook": "Untangle the night, star by star.",
      "duration": "At your pace",
      "tag": "Make room for the stars",
      "added": "2026-11-23"
    },
    {
      "id": "ghost-lantern",
      "title": "Ghost Lantern",
      "category": "Maze chase",
      "group": "Action",
      "color": "#fcd34d",
      "hook": "Carry a little light. Bring it home.",
      "duration": "1–3 min",
      "tag": "A fresh maze each day",
      "added": "2026-11-23"
    },
    {
      "id": "word-trail",
      "title": "Word Trail",
      "category": "Word search",
      "group": "Puzzle",
      "color": "#dfc488",
      "hook": "Follow a little trail of letters.",
      "duration": "2–5 min",
      "tag": "A word to the curious",
      "added": "2026-11-23"
    },
    {
      "id": "curling-cove",
      "title": "Curling Cove",
      "category": "Curling",
      "group": "Sports",
      "color": "#b0d9da",
      "hook": "Three ends. Place, protect, and own the button.",
      "duration": "2–4 min",
      "tag": "STRATEGY",
      "added": "2026-11-23"
    },
    {
      "id": "rhythm-rail",
      "title": "Rhythm Rail",
      "category": "Rhythm",
      "group": "Timing",
      "color": "#f49bac",
      "hook": "Four rails. Find your little groove.",
      "duration": "43 seconds",
      "tag": "Stay in the moment",
      "added": "2026-11-23"
    },
    {
      "id": "ricochet-range",
      "title": "Ricochet Range",
      "category": "Bank-shot puzzle",
      "group": "Puzzle",
      "color": "#fb923c",
      "hook": "One clean shot. A new possibility.",
      "duration": "1–2 min",
      "tag": "Look for a different angle",
      "added": "2026-11-23"
    },
    {
      "id": "pipe-works",
      "title": "Pipe Works",
      "category": "Pipe routing",
      "group": "Puzzle",
      "color": "#82cbd1",
      "hook": "Turn a few pipes into a flowing idea.",
      "duration": "3–6 min",
      "tag": "Find your own flow",
      "added": "2026-11-23"
    },
    {
      "id": "sail-sprint",
      "title": "Sail Sprint",
      "category": "Sailing",
      "group": "Racing",
      "color": "#ace6d2",
      "hook": "Six buoys and a breeze that rewards good lines.",
      "duration": "1–2 min",
      "tag": "SAIL",
      "added": "2026-11-23"
    },
    {
      "id": "stack-harbor",
      "title": "Stack Harbor",
      "category": "Precision",
      "group": "Timing",
      "color": "#95ddc9",
      "hook": "Build a little higher. Land cleaner.",
      "duration": "1–2 min",
      "tag": "Make your own skyline",
      "added": "2026-11-23"
    },
    {
      "id": "shield-spin",
      "title": "Shield Spin",
      "category": "Radial defense",
      "group": "Action",
      "color": "#5eead4",
      "hook": "Keep a little star alive.",
      "duration": "1–2 min",
      "tag": "Every star needs a guardian",
      "added": "2026-11-23"
    },
    {
      "id": "nonogram-nook",
      "title": "Nonogram Nook",
      "category": "Picture logic",
      "group": "Puzzle",
      "color": "#e2bca5",
      "hook": "The picture is in the numbers.",
      "duration": "3–6 min",
      "tag": "A little revelation",
      "added": "2026-11-23"
    },
    {
      "id": "orchard-keeper",
      "title": "Orchard Keeper",
      "category": "Farm management",
      "group": "Strategy",
      "color": "#d4e6a0",
      "hook": "Nine plots and two minutes to grow a good season.",
      "duration": "2 min",
      "tag": "GROW",
      "added": "2026-11-23"
    },
    {
      "id": "perfect-pour",
      "title": "Perfect Pour",
      "category": "Timing",
      "group": "Timing",
      "color": "#efb989",
      "hook": "A steady hand. Just enough.",
      "duration": "1 min",
      "tag": "Every drop counts",
      "added": "2026-11-23"
    },
    {
      "id": "blade-bloom",
      "title": "Blade Bloom",
      "category": "Fruit slicing",
      "group": "Action",
      "color": "#fda4af",
      "hook": "A bright harvest. One sweeping gesture.",
      "duration": "1 min",
      "tag": "Make your harvest colorful",
      "added": "2026-11-23"
    },
    {
      "id": "code-breaker",
      "title": "Code Breaker",
      "category": "Deduction",
      "group": "Puzzle",
      "color": "#c0abe1",
      "hook": "Four colors. One satisfying click.",
      "duration": "3–6 min",
      "tag": "Think your way into the lock",
      "added": "2026-11-23"
    },
    {
      "id": "cafe-rush",
      "title": "Café Rush",
      "category": "Time management",
      "group": "Timing",
      "color": "#e9b8a4",
      "hook": "Brew, froth, finish. Keep the morning moving.",
      "duration": "90 sec",
      "tag": "SERVE",
      "added": "2026-11-23"
    },
    {
      "id": "orbit-hop",
      "title": "Orbit Hop",
      "category": "Orbital timing",
      "group": "Timing",
      "color": "#b7c2fb",
      "hook": "Let go. Find a new world.",
      "duration": "1–2 min",
      "tag": "Time your next departure",
      "added": "2026-11-23"
    },
    {
      "id": "pinball-grove",
      "title": "Pinball Grove",
      "category": "Pinball",
      "group": "Tabletop",
      "color": "#a3d9a5",
      "hook": "Five flowers. One more ball.",
      "duration": "1–3 min",
      "tag": "Light up the woodland table",
      "added": "2026-11-23"
    },
    {
      "id": "peg-parlor",
      "title": "Peg Parlor",
      "category": "Peg solitaire",
      "group": "Puzzle",
      "color": "#cda77a",
      "hook": "A few thoughtful jumps. Just one peg.",
      "duration": "3–6 min",
      "tag": "Less is a little more",
      "added": "2026-11-23"
    },
    {
      "id": "colony-balance",
      "title": "Colony Balance",
      "category": "Colony management",
      "group": "Strategy",
      "color": "#dfbd9f",
      "hook": "Twenty decisions. A whole colony depends on you.",
      "duration": "3–5 min",
      "tag": "BALANCE",
      "added": "2026-11-23"
    },
    {
      "id": "candy-drop",
      "title": "Candy Drop",
      "category": "Original arcade",
      "group": "Original",
      "color": "#ff8dc5",
      "hook": "Catch the candy. Chase the combo.",
      "duration": "One more try",
      "tag": "The one that started it"
    }
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
  function dailyGame(day = dayKey()) { const games = CATALOG.filter(game => game.id !== 'candy-drop'); return games[hash(day) % games.length]; }
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
