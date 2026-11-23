(function () {
  'use strict';
  const COLS = 24, ROWS = 14, CELL = 28, X = 144, Y = 104;
  const vectors = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  Arcade.mount({
    id: 'serpent-garden', title: 'Serpent Garden', category: 'Snake', accent: '#a3e635',
    description: 'A quiet garden. A growing appetite. Leave yourself a way home.',
    howTo: ['Gather 20 fruit to complete the garden. Hitting the border, a stone, or your own body ends the run.', 'Steer with arrows / WASD or the four touch buttons. You cannot reverse into your neck; the first turn before each step is kept.', 'Every five fruit adds a stone and raises the pace. Plan a wide route and keep your tail moving out of your way.'],
    controls: ['left', 'up', 'down', 'right'].map((id, i) => ({ id, label: ['←', '↑', '↓', '→'][i], keys: [['ArrowLeft', 'KeyA'], ['ArrowUp', 'KeyW'], ['ArrowDown', 'KeyS'], ['ArrowRight', 'KeyD']][i] })), medals: [400, 1100, 2400],
    create(api) {
      let snake = [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }, { x: 3, y: 7 }], direction = 'right', queued = null, timer = 0, grace = 1.3;
      let fruit = { x: 9, y: 7 }, stones = [], eaten = 0, score = 0, ended = false, clock = 0;
      function occupied(x, y) { return snake.some(p => p.x === x && p.y === y) || stones.some(p => p.x === x && p.y === y); }
      function freeCell(excludeFruit) { const free = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!occupied(x, y) && (!excludeFruit || x !== fruit.x || y !== fruit.y)) free.push({ x, y }); return free.length ? free[Math.floor(api.random() * free.length)] : null; }
      function finish(won) { ended = true; if (won) score += 900 + Math.max(0, 600 - Math.floor(clock * 2)); api.score(score); api.end({ score, title: won ? 'The garden is flourishing.' : 'A little room to grow.', message: won ? 'Twenty fruit, one careful route. Try leaving more open space on your next visit.' : 'Turn early, make broad loops, and remember that the tail frees one cell every step.', stats: [{ label: 'Fruit', value: eaten + ' / 20' }, { label: 'Length', value: snake.length }, { label: 'Stones', value: stones.length }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Fruit', value: eaten + ' / 20' }, { label: 'Length', value: snake.length }, { label: 'Pace', value: (1 + Math.floor(eaten / 5)) + ' / 4' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; clock += dt;
          for (const id of ['left', 'up', 'down', 'right']) if (api.input.pressed(id) && !queued) { const a = vectors[direction], b = vectors[id]; if (a[0] + b[0] !== 0 || a[1] + b[1] !== 0) queued = id; }
          if (grace > 0) { grace -= dt; return; }
          timer += dt; const interval = 0.17 - Math.floor(eaten / 5) * 0.022;
          if (timer >= interval) {
            timer -= interval; if (queued) { direction = queued; queued = null; }
            const v = vectors[direction], next = { x: snake[0].x + v[0], y: snake[0].y + v[1] }, grow = next.x === fruit.x && next.y === fruit.y;
            const body = grow ? snake : snake.slice(0, -1);
            if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS || stones.some(p => p.x === next.x && p.y === next.y) || body.some(p => p.x === next.x && p.y === next.y)) { finish(false); return; }
            snake.unshift(next); if (!grow) snake.pop();
            else {
              eaten++; score += 60 + eaten * 3; api.sound('good', 0.8 + eaten * 0.025); api.burst(X + next.x * CELL + 14, Y + next.y * CELL + 14, '#fbbf24', 8);
              if (eaten >= 20) { finish(true); return; }
              fruit = freeCell(false); if (!fruit) { finish(true); return; }
              if (eaten % 5 === 0) { const rock = freeCell(true); if (rock) stones.push(rock); api.toast('A new stone. A little more pace.'); }
            }
            ui();
          }
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#e8eddd'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#cad7b5'; ctx.beginPath(); ctx.roundRect(X - 18, Y - 18, COLS * CELL + 36, ROWS * CELL + 36, 25); ctx.fill();
          for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { ctx.fillStyle = (x + y) % 2 ? '#dce6cc' : '#e2ead4'; ctx.fillRect(X + x * CELL, Y + y * CELL, CELL, CELL); }
          stones.forEach(p => { ctx.fillStyle = '#829188'; ctx.beginPath(); ctx.roundRect(X + p.x * CELL + 2, Y + p.y * CELL + 2, 24, 24, 7); ctx.fill(); ctx.strokeStyle = '#b5bfb7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + p.x * CELL + 8, Y + p.y * CELL + 7); ctx.lineTo(X + p.x * CELL + 19, Y + p.y * CELL + 11); ctx.stroke(); });
          if (fruit) { const fx = X + fruit.x * CELL + 14, fy = Y + fruit.y * CELL + 15; ctx.fillStyle = '#d36d55'; ctx.beginPath(); ctx.arc(fx, fy, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#547c42'; ctx.beginPath(); ctx.ellipse(fx + 4, fy - 11, 6, 3, -0.5, 0, Math.PI * 2); ctx.fill(); }
          for (let i = snake.length - 1; i >= 0; i--) { const p = snake[i]; ctx.fillStyle = i === 0 ? '#315c3e' : i % 2 ? '#6a9c54' : '#79a85d'; ctx.beginPath(); ctx.roundRect(X + p.x * CELL + 1, Y + p.y * CELL + 1, 26, 26, i ? 7 : 9); ctx.fill(); }
          const head = snake[0], v = vectors[direction], hx = X + head.x * CELL + 14, hy = Y + head.y * CELL + 14;
          for (const side of [-1, 1]) { ctx.fillStyle = '#f5f9e9'; ctx.beginPath(); ctx.arc(hx + v[0] * 7 + v[1] * side * 5, hy + v[1] * 7 + v[0] * side * 5, 3, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = '#42654b'; ctx.textAlign = 'center'; ctx.font = '800 30px system-ui'; ctx.fillText('A LITTLE ROOM TO GROW', 480, 60); ctx.fillStyle = '#7b8d70'; ctx.font = '600 16px system-ui'; ctx.fillText('Twenty fruit. A thoughtful route.', 480, 551);
          if (grace > 0) { ctx.fillStyle = '#edf2e2ee'; ctx.fillRect(310, 261, 340, 65); ctx.fillStyle = '#315c3e'; ctx.font = '800 26px system-ui'; ctx.fillText('MAKE YOUR FIRST TURN', 480, 302); }
          ctx.restore();
        },
        inspect() { return { snake: snake.map(p => ({ ...p })), fruit: fruit && { ...fruit }, stones: stones.map(p => ({ ...p })), direction, queued, timer, grace, eaten, score, ended, clock, cols: COLS, rows: ROWS }; }
      };
    }
  });
})();
