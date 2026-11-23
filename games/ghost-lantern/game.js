(function () {
  'use strict';
  const W = 21, H = 15, CELL = 32, OX = 144, OY = 64;
  const moves = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }, key = (x, y) => x + ',' + y;
  Arcade.mount({
    id: 'ghost-lantern', title: 'Ghost Lantern', category: 'Maze chase', accent: '#fcd34d',
    description: 'Carry a little light. Gather every spark before the ghosts close in.',
    howTo: ['Gather every gold spark in a seeded maze before three hearts or 150 seconds run out. Ghosts follow the corridors.', 'Use arrows / WASD or the touch directions. Space flashes your lantern, frightening ghosts for three seconds; it recharges in twelve seconds.', 'Large corner sparks also frighten ghosts. A frightened ghost can be caught for a bonus. Queue a turn before the junction to keep moving.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'pulse', label: 'Lantern', keys: ['Space'] }], medals: [700, 1800, 4200],
    create(api) {
      const maze = Array.from({ length: H }, () => Array(W).fill(1)); const stack = [{ x: 1, y: 1 }]; maze[1][1] = 0;
      while (stack.length) { const at = stack[stack.length - 1], choices = Object.values(moves).map(v => ({ x: at.x + v[0] * 2, y: at.y + v[1] * 2, dx: v[0], dy: v[1] })).filter(p => p.x > 0 && p.x < W - 1 && p.y > 0 && p.y < H - 1 && maze[p.y][p.x]); if (!choices.length) stack.pop(); else { const p = choices[Math.floor(api.random() * choices.length)]; maze[at.y + p.dy][at.x + p.dx] = 0; maze[p.y][p.x] = 0; stack.push(p); } }
      for (let i = 0; i < 18; i++) { const x = 2 + Math.floor(api.random() * (W - 4)), y = 2 + Math.floor(api.random() * (H - 4)); if (maze[y][x] && ((!maze[y][x - 1] && !maze[y][x + 1]) || (!maze[y - 1][x] && !maze[y + 1][x]))) maze[y][x] = 0; }
      const sparks = new Set(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!maze[y][x] && (x !== 1 || y !== 1)) sparks.add(key(x, y));
      const total = sparks.size, powers = new Set([key(19, 1), key(1, 13), key(19, 13)]), player = { x: 1, y: 1, dir: 'right' };
      const ghosts = [{ x: 19, y: 13, homeX: 19, homeY: 13, color: '#fb7185', wait: 2, last: '' }, { x: 19, y: 1, homeX: 19, homeY: 1, color: '#c4b5fd', wait: 3, last: '' }, { x: 1, y: 13, homeX: 1, homeY: 13, color: '#67e8f9', wait: 4, last: '' }];
      let queued = 'right', playerTick = 0, ghostTick = 0, lives = 3, score = 0, time = 150, fear = 0, cooldown = 0, invincible = 2, caught = 0, ended = false;
      const open = (x, y) => x >= 0 && x < W && y >= 0 && y < H && !maze[y][x];
      function distances() { const map = new Map([[key(player.x, player.y), 0]]), queue = [{ x: player.x, y: player.y }]; for (let i = 0; i < queue.length; i++) for (const v of Object.values(moves)) { const p = { x: queue[i].x + v[0], y: queue[i].y + v[1] }, k = key(p.x, p.y); if (open(p.x, p.y) && !map.has(k)) { map.set(k, map.get(key(queue[i].x, queue[i].y)) + 1); queue.push(p); } } return map; }
      function finish(won) { ended = true; if (won) score += 1000 + lives * 300 + Math.floor(time * 8); api.score(score); api.end({ score, title: won ? 'Every light, brought home.' : 'Keep a little light with you.', message: won ? 'The entire maze is glowing. A shorter route can carry you to the next record.' : 'Save the lantern for a narrow corridor. The corner sparks offer another escape when its battery is recharging.', stats: [{ label: 'Sparks', value: total - sparks.size + ' / ' + total }, { label: 'Ghosts caught', value: caught }, { label: 'Hearts', value: lives }] }); }
      function collect() { const k = key(player.x, player.y); if (sparks.delete(k)) { score += 20; api.sound('click', 1.1); if (powers.delete(k)) { fear = 5; api.sound('good'); } if (!sparks.size) finish(true); } }
      function collision() { for (const g of ghosts) if (!g.wait && g.x === player.x && g.y === player.y) { if (fear > 0) { caught++; score += 150; g.x = g.homeX; g.y = g.homeY; g.wait = 3; api.sound('good'); } else if (invincible <= 0) { lives--; api.sound('bad'); api.shake(5); if (!lives) { finish(false); return; } player.x = 1; player.y = 1; player.dir = queued = 'right'; invincible = 2.5; } } }
      function ui() { api.score(score); api.hud([{ label: 'Sparks left', value: sparks.size }, { label: 'Hearts', value: lives }, { label: 'Lantern', value: cooldown > 0 ? Math.ceil(cooldown) + 's' : 'Ready' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; } fear = Math.max(0, fear - dt); cooldown = Math.max(0, cooldown - dt); invincible = Math.max(0, invincible - dt); ghosts.forEach(g => { g.wait = Math.max(0, g.wait - dt); });
          for (const id of Object.keys(moves)) if (api.input.pressed(id)) queued = id;
          if (api.input.pressed('pulse') && cooldown <= 0) { fear = 3; cooldown = 12; api.sound('good'); api.toast('Lantern flash · ghosts retreat'); }
          playerTick += dt; ghostTick += dt;
          if (playerTick >= 0.13) { playerTick -= 0.13; let v = moves[queued]; if (open(player.x + v[0], player.y + v[1])) player.dir = queued; v = moves[player.dir]; if (open(player.x + v[0], player.y + v[1])) { player.x += v[0]; player.y += v[1]; collect(); } if (ended) return; collision(); if (ended) return; }
          if (ghostTick >= (fear > 0 ? 0.4 : 0.3)) { ghostTick = 0; const map = distances(); for (const g of ghosts) { if (g.wait > 0) continue; const all = Object.values(moves).map(v => ({ x: g.x + v[0], y: g.y + v[1] })).filter(p => open(p.x, p.y)); let candidates = all.filter(p => key(p.x, p.y) !== g.last); if (!candidates.length) candidates = all; candidates.sort((a, b) => (map.get(key(a.x, a.y)) - map.get(key(b.x, b.y))) * (fear > 0 ? -1 : 1)); if (candidates.length) { g.last = key(g.x, g.y); g.x = candidates[0].x; g.y = candidates[0].y; } } collision(); if (ended) return; }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#111625'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#161e32'; ctx.beginPath(); ctx.roundRect(OX - 12, OY - 12, W * CELL + 24, H * CELL + 24, 20); ctx.fill();
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = OX + x * CELL, sy = OY + y * CELL; if (maze[y][x]) { ctx.fillStyle = '#35415e'; ctx.beginPath(); ctx.roundRect(sx + 2, sy + 2, 28, 28, 5); ctx.fill(); ctx.fillStyle = '#4a5a7a'; ctx.fillRect(sx + 5, sy + 3, 22, 2); } else if (sparks.has(key(x, y))) { ctx.fillStyle = '#efcf7b'; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, powers.has(key(x, y)) ? 7 : 3, 0, Math.PI * 2); ctx.fill(); } }
          const px = OX + player.x * CELL + 16, py = OY + player.y * CELL + 16;
          const light = ctx.createRadialGradient(px, py, 10, px, py, fear > 0 ? 175 : 100); light.addColorStop(0, '#fcd34d25'); light.addColorStop(1, '#fcd34d00'); ctx.fillStyle = light; ctx.fillRect(px - 180, py - 180, 360, 360);
          ghosts.forEach(g => { const x = OX + g.x * CELL + 16, y = OY + g.y * CELL + 16; ctx.globalAlpha = g.wait > 0 ? 0.4 : 1; ctx.fillStyle = fear > 0 ? '#7d83a9' : g.color; ctx.beginPath(); ctx.arc(x, y - 2, 12, Math.PI, 0); ctx.lineTo(x + 12, y + 12); ctx.lineTo(x + 6, y + 7); ctx.lineTo(x, y + 12); ctx.lineTo(x - 6, y + 7); ctx.lineTo(x - 12, y + 12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#eef2ff'; ctx.fillRect(x - 7, y - 4, 5, 6); ctx.fillRect(x + 2, y - 4, 5, 6); }); ctx.globalAlpha = 1;
          ctx.fillStyle = invincible > 0 ? '#ffe9b088' : '#fcd34d'; ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill(); const v = moves[player.dir]; ctx.fillStyle = '#423b32'; ctx.beginPath(); ctx.arc(px + v[0] * 5 - v[1] * 4, py + v[1] * 5 + v[0] * 4, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.textAlign = 'center'; ctx.fillStyle = '#d9c188'; ctx.font = '800 15px system-ui'; ctx.fillText(fear > 0 ? 'THE GHOSTS ARE AFRAID OF YOUR LIGHT' : 'BRING EVERY LITTLE LIGHT HOME', 480, 31); ctx.font = '600 13px system-ui'; ctx.fillStyle = '#8c96b3'; ctx.fillText('A new maze from the same daily seed.', 480, 582); ctx.restore();
        },
        inspect() { return { maze: maze.map(row => row.slice()), player: { ...player }, ghosts: ghosts.map(g => ({ ...g })), sparks: [...sparks], powers: [...powers], total, queued, lives, score, time, fear, cooldown, invincible, caught, ended }; }
      };
    }
  });
})();
