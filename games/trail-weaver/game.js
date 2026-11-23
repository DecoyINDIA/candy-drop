/* Trail Weaver — designed path partitions, transformed without losing solvability. */
(() => {
  'use strict';
  const LEVELS = [
    { n: 5, paths: [[0, 1, 2, 3, 4], [5, 6, 11, 10, 15], [7, 8, 9, 14, 13], [12, 17, 16, 21, 20], [18, 19, 24, 23, 22]] },
    { n: 5, paths: [[0, 1, 2, 3, 4, 9], [14, 19, 24, 23, 22, 21], [20, 15, 10, 5, 6, 7], [8, 13, 18, 17, 16, 11, 12]] },
    { n: 6, paths: [[0, 1, 2, 3, 4, 5], [11, 17, 23, 29, 35, 34, 33], [32, 31, 30, 24, 18, 12, 6], [7, 8, 9, 10, 16, 22, 28], [27, 26, 25, 19, 13, 14, 15, 21, 20]] }
  ];
  const X = 264, Y = 75, SIZE = 432, COLORS = ['#e69d8d', '#80b9a2', '#b1a2d1', '#dfbf73', '#87b6ce'];
  Arcade.mount({
    id: 'trail-weaver', title: 'Trail Weaver', category: 'Numberlink', accent: '#b4cfa5',
    description: 'A place for every path. A connection for every color.',
    howTo: ['Connect matching numbered dots without crossing another trail. Every square must be covered. Weave all three gardens.', 'Drag from a dot, or tap a dot then neighboring squares. With a keyboard, arrows move the cursor; Space starts a trail and arrows extend it. Space releases it.', 'Move back along your own trail to shorten it. Selecting a dot restarts its color; selecting a trail lets you edit it. U undoes a trail, R clears the garden.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'act', label: 'Start / release', keys: ['Space', 'Enter'] }, { id: 'undo', label: 'Undo trail', keys: ['KeyU', 'KeyZ'] }, { id: 'reset', label: 'Clear garden', keys: ['KeyR'] }],
    medals: [1000, 2600, 3500],
    create(api) {
      let n = 5, solution = [], pairs = [], paths = [], palette = [], history = [], cursor = 0, active = -1, dragging = false;
      let round = 1, strokes = 0, totalStrokes = 0, undos = 0, resets = 0, penalty = 0, score = 0, transition = 0, ended = false;
      const adjacent = (a, b) => Math.abs(a % n - b % n) + Math.abs(Math.floor(a / n) - Math.floor(b / n)) === 1;
      const endpointColor = i => pairs.findIndex(p => p.includes(i));
      const pathColor = i => paths.findIndex(p => p.includes(i));
      const complete = color => paths[color].length > 1 && pairs[color].includes(paths[color][0]) && pairs[color].includes(paths[color][paths[color].length - 1]) && paths[color][0] !== paths[color][paths[color].length - 1];
      function covered() { return new Set(pairs.flat().concat(paths.flat())).size; }
      function load() {
        const level = LEVELS[round - 1]; n = level.n;
        const rotate = Math.floor(api.random() * 4), mirror = api.random() < .5;
        function transform(i) { let x = i % n, y = Math.floor(i / n); if (mirror) x = n - 1 - x; for (let j = 0; j < rotate; j++) [x, y] = [n - 1 - y, x]; return y * n + x; }
        solution = level.paths.map(p => p.map(transform)); pairs = solution.map(p => [p[0], p[p.length - 1]]); paths = pairs.map(() => []);
        palette = COLORS.slice(); for (let i = palette.length - 1; i > 0; i--) { const j = Math.floor(api.random() * (i + 1)); [palette[i], palette[j]] = [palette[j], palette[i]]; }
        cursor = pairs[0][0]; active = -1; dragging = false; history = []; strokes = 0; penalty = 0; transition = 0;
      }
      function remember() { history.push(paths.map(p => p.slice())); if (history.length > 100) history.shift(); strokes++; totalStrokes++; }
      function begin(i) {
        if (transition > 0) return false;
        const endpoint = endpointColor(i), color = endpoint >= 0 ? endpoint : pathColor(i);
        if (color < 0) return false;
        remember(); active = color; cursor = i;
        if (endpoint >= 0) paths[color] = [i]; else paths[color] = paths[color].slice(0, paths[color].indexOf(i) + 1);
        return true;
      }
      function check() {
        if (!paths.every((_, i) => complete(i))) return;
        if (covered() !== n * n) { api.toast('The pairs meet. Give every empty square a trail, too.'); return; }
        active = -1; dragging = false; score += Math.max(400, 1500 - strokes * 30 - penalty); api.score(score); api.sound('win'); transition = 1;
      }
      function extendOne(i) {
        if (active < 0 || transition > 0) return false;
        const path = paths[active], last = path[path.length - 1];
        if (!adjacent(last, i)) return false;
        const own = path.indexOf(i);
        if (own >= 0) { path.length = own + 1; cursor = i; return true; }
        const endpoint = endpointColor(i), occupied = pathColor(i);
        if (endpoint >= 0 && endpoint !== active || occupied >= 0 && occupied !== active) return false;
        path.push(i); cursor = i; api.sound('click', 1.05);
        if (endpoint === active) { active = -1; dragging = false; api.sound('good'); check(); }
        return true;
      }
      function extend(i) {
        if (active < 0) return false;
        const path = paths[active], last = path[path.length - 1]; if (last === i) return true;
        if (last % n !== i % n && Math.floor(last / n) !== Math.floor(i / n)) return false;
        const step = last % n === i % n ? Math.sign(i - last) * n : Math.sign(i - last);
        for (let at = last + step; ; at += step) { if (!extendOne(at)) return false; if (at === i || active < 0) return true; }
      }
      function pointCell(p) { if (p.x < X || p.x >= X + SIZE || p.y < Y || p.y >= Y + SIZE) return -1; const s = SIZE / n; return Math.floor((p.y - Y) / s) * n + Math.floor((p.x - X) / s); }
      function hud() { api.hud([{ label: 'Garden', value: round + ' / 3' }, { label: 'Pairs', value: paths.filter((_, i) => complete(i)).length + ' / ' + pairs.length }, { label: 'Covered', value: covered() + ' / ' + n * n }, { label: 'Trail', value: active >= 0 ? active + 1 : 'START' }]); }
      load(); hud();
      return {
        update(dt) {
          if (ended) return;
          if (transition > 0) { transition -= dt; if (transition <= 0) { if (round === 3) { ended = true; api.end({ score, title: 'Everything finds its way.', message: 'Three gardens, every pair connected, every square part of the picture.', stats: [{ label: 'Gardens', value: '3 / 3' }, { label: 'Trails drawn', value: totalStrokes }, { label: 'Undos', value: undos }] }); return; } round++; load(); hud(); } return; }
          const k = api.input;
          if (k.pressed('undo') && history.length) { paths = history.pop(); active = -1; dragging = false; undos++; penalty += 30; }
          if (k.pressed('reset')) { paths = pairs.map(() => []); active = -1; dragging = false; history = []; resets++; penalty += 75; }
          for (const [id, dx, dy] of [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]]) if (k.pressed(id)) {
            const x = cursor % n + dx, y = Math.floor(cursor / n) + dy;
            if (x >= 0 && x < n && y >= 0 && y < n) { const i = y * n + x; if (active >= 0) extendOne(i); else cursor = i; }
            break;
          }
          if (k.pressed('act')) { if (active >= 0) { active = -1; dragging = false; } else begin(cursor); }
          if (transition > 0) { hud(); return; }
          const p = k.pointer, cell = pointCell(p);
          if (p.pressed && p.inside && cell >= 0) {
            const last = active >= 0 ? paths[active][paths[active].length - 1] : -1;
            if (active >= 0 && adjacent(last, cell) && (endpointColor(cell) < 0 || endpointColor(cell) === active)) { dragging = extendOne(cell) && active >= 0; }
            else dragging = begin(cell);
          }
          if (dragging && p.down && cell >= 0) extend(cell);
          if (p.released) dragging = false;
          hud();
        },
        cancelInput() { active = -1; dragging = false; },
        draw(c) {
          c.save(); c.fillStyle = '#e8eddf'; c.fillRect(0, 0, 960, 600); c.textAlign = 'left'; c.fillStyle = '#506b55'; c.font = '800 31px Georgia,serif'; c.fillText('A WAY', 29, 183); c.fillText('TOGETHER.', 29, 225, 205); c.fillStyle = '#8ca080'; c.font = '16px system-ui'; ['Every dot has a pair.', 'Every path has a place.', 'Find a way for both.'].forEach((t, i) => c.fillText(t, 30, 286 + i * 27, 207));
          c.fillStyle = '#c7d4bd'; c.beginPath(); c.roundRect(X - 10, Y - 10, SIZE + 20, SIZE + 20, 18); c.fill(); const s = SIZE / n;
          for (let i = 0; i < n * n; i++) { c.fillStyle = '#f7f8ee'; c.beginPath(); c.roundRect(X + i % n * s + 3, Y + Math.floor(i / n) * s + 3, s - 6, s - 6, 9); c.fill(); }
          c.lineCap = c.lineJoin = 'round';
          paths.forEach((path, color) => { if (!path.length) return; c.strokeStyle = palette[color]; c.lineWidth = s * .26; c.beginPath(); path.forEach((i, k) => { const x = X + (i % n + .5) * s, y = Y + (Math.floor(i / n) + .5) * s; if (k) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); if (color === active) { const i = path[path.length - 1]; c.fillStyle = palette[color]; c.beginPath(); c.arc(X + (i % n + .5) * s, Y + (Math.floor(i / n) + .5) * s, 8, 0, Math.PI * 2); c.fill(); } });
          pairs.forEach((pair, color) => pair.forEach(i => { const x = X + (i % n + .5) * s, y = Y + (Math.floor(i / n) + .5) * s; c.fillStyle = palette[color]; c.beginPath(); c.arc(x, y, s * .25, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fffdf0'; c.textAlign = 'center'; c.font = '800 20px system-ui'; c.fillText(color + 1, x, y + 7); }));
          c.strokeStyle = active >= 0 ? palette[active] : '#859c73'; c.lineWidth = 2; c.beginPath(); c.roundRect(X + cursor % n * s + 5, Y + Math.floor(cursor / n) * s + 5, s - 10, s - 10, 8); c.stroke();
          c.textAlign = 'left'; c.fillStyle = '#7d9674'; c.font = '700 13px system-ui'; c.fillText('GARDEN ' + round + ' / 3', 750, 127); pairs.forEach((_, color) => { c.fillStyle = palette[color]; c.beginPath(); c.arc(765, 178 + color * 52, 13, 0, Math.PI * 2); c.fill(); c.fillStyle = '#6f8465'; c.font = '700 16px system-ui'; c.fillText(complete(color) ? 'CONNECTED' : 'PAIR ' + (color + 1), 791, 184 + color * 52, 150); }); c.fillStyle = '#8c9b7e'; c.font = '14px system-ui'; c.fillText('Fill every square.', 750, 470); c.fillText('Keep trails apart.', 750, 495);
          c.textAlign = 'center'; c.font = '13px system-ui'; c.fillText('GOOD CONNECTIONS LEAVE ROOM FOR EVERYONE', 480, 568);
          if (transition > 0) { c.fillStyle = '#426d5bed'; c.fillRect(277, 247, 406, 94); c.fillStyle = '#f0f2d0'; c.font = '800 29px system-ui'; c.fillText('BEAUTIFULLY CONNECTED', 480, 304, 387); }
          c.restore();
        },
        inspect() { return { n, solution: solution.map(p => p.slice()), pairs: pairs.map(p => p.slice()), paths: paths.map(p => p.slice()), palette: palette.slice(), cursor, active, dragging, round, strokes, totalStrokes, undos, resets, penalty, score, transition, ended, covered: covered(), complete: paths.map((_, i) => complete(i)) }; }
      };
    }
  });
})();
