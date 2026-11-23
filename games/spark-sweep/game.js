(function () {
  'use strict';
  const W = 28, H = 16, CELL = 27, OX = 102, OY = 84, TAU = Math.PI * 2, dirs = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }, index = (x, y) => y * W + x;
  Arcade.mount({
    id: 'spark-sweep', title: 'Spark Sweep', category: 'Area claiming', accent: '#88dcc3',
    description: 'Draw a little courage. Bring the empty space into the light.',
    howTo: ['Claim at least 70% of each of three panels within two minutes. Start on the safe boundary, draw across empty space, and reconnect to safe territory to seal a region.', 'Arrows / WASD moves one cell at a time. Space arms drawing; move from safe territory into empty cells to begin. You cannot cancel an open trail.', 'The roaming light keeps its connected region; the other side fills in. A light touching your open trail, an orange boundary spark, or crossing your own trail costs a heart. You have three.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'draw', label: 'Arm draw', keys: ['Space'] }], medals: [700, 2000, 3600],
    create(api) {
      const perimeter = []; for (let x = 0; x < W; x++) perimeter.push({ x, y: 0 }); for (let y = 1; y < H; y++) perimeter.push({ x: W - 1, y }); for (let x = W - 2; x >= 0; x--) perimeter.push({ x, y: H - 1 }); for (let y = H - 2; y > 0; y--) perimeter.push({ x: 0, y });
      const player = { x: 14, y: 0 }, light = { x: 22, y: 9, vx: 2.1, vy: 1.55 }; let grid = [], trail = [], anchor = { x: 14, y: 0 }, armed = false, panel = 1, hearts = 3, score = 0, time = 120, tick = 0, invincible = 0, transition = 0, claimed = 0, closures = 0, ended = false, sparks = [];
      function setup() { grid = Array.from({ length: W * H }, (_, i) => i % W === 0 || i % W === W - 1 || i < W || i >= W * (H - 1) ? 1 : 0); trail = []; armed = false; claimed = 0; player.x = 14; player.y = 0; anchor = { ...player }; light.x = 21 + api.random() * 2; light.y = 7 + api.random() * 3; light.vx = (2 + panel * .3) * (api.random() < .5 ? 1 : -1); light.vy = 1.45 + panel * .18; sparks = [{ at: 31, speed: 2.9 + panel * .2 }, { at: 69, speed: -2.5 - panel * .18 }]; invincible = 1; }
      const valid = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
      const filled = (x, y) => !valid(x, y) || grid[index(x, y)] === 1;
      function finish(won) { if (ended) return; ended = true; if (won) score += 1000 + hearts * 200 + Math.floor(time * 8); api.score(score); api.end({ score, title: won ? 'Every panel has a little more light.' : 'Leave a safer line next time.', message: won ? 'Three panels claimed. Shorter trails leave the roaming lights less time to find you.' : 'The moving light chooses the region that stays empty. Draw when it is far from your planned line, then close the trail quickly.', stats: [{ label: 'Panel', value: panel + ' / 3' }, { label: 'Regions closed', value: closures }, { label: 'Hearts', value: hearts }] }); }
      function hurt() { if (invincible) return; hearts--; api.sound('bad'); api.shake(4); if (!hearts) { finish(false); return; } trail = []; player.x = anchor.x; player.y = anchor.y; armed = false; invincible = 1.5; }
      function closeTrail() {
        trail.forEach(p => { grid[index(p.x, p.y)] = 1; }); trail = []; const remaining = [];
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (!grid[index(x, y)]) remaining.push({ x, y });
        remaining.sort((a, b) => Math.hypot(a.x - light.x, a.y - light.y) - Math.hypot(b.x - light.x, b.y - light.y));
        const keep = new Set(), queue = remaining.length ? [remaining[0]] : []; if (queue.length) keep.add(index(queue[0].x, queue[0].y));
        for (let i = 0; i < queue.length; i++) for (const [dx, dy] of Object.values(dirs)) { const x = queue[i].x + dx, y = queue[i].y + dy, k = index(x, y); if (valid(x, y) && !grid[k] && !keep.has(k)) { keep.add(k); queue.push({ x, y }); } }
        let added = 0; for (const p of remaining) if (!keep.has(index(p.x, p.y))) { grid[index(p.x, p.y)] = 1; added++; }
        let total = 0; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) total += grid[index(x, y)]; claimed = total / ((W - 2) * (H - 2)); closures++; score += Math.round(added * 5 + 100); armed = false; anchor = { ...player }; api.sound('good');
        if (remaining.length && filled(Math.round(light.x), Math.round(light.y))) { light.x = remaining[0].x; light.y = remaining[0].y; }
        if (claimed >= .7) { score += 300; if (panel === 3) { finish(true); return; } transition = 1.2; api.toast('Panel sealed · a new blank canvas'); }
      }
      function ui() { api.score(score); api.hud([{ label: 'Panel', value: panel + ' / 3' }, { label: 'Claimed', value: Math.floor(claimed * 100) + ' / 70%' }, { label: 'Hearts', value: hearts }, { label: 'Draw', value: trail.length ? 'Close trail' : armed ? 'Armed' : 'Safe' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      setup(); ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; } invincible = Math.max(0, invincible - dt);
          if (transition > 0) { transition = Math.max(0, transition - dt); if (!transition) { panel++; setup(); } ui(); return; }
          const nx = light.x + light.vx * dt, ny = light.y + light.vy * dt;
          if (filled(Math.round(nx), Math.round(light.y))) light.vx *= -1; else light.x = nx;
          if (filled(Math.round(light.x), Math.round(ny))) light.vy *= -1; else light.y = ny;
          for (const s of sparks) { s.at = (s.at + s.speed * dt + perimeter.length) % perimeter.length; const p = perimeter[Math.floor(s.at)]; if (p.x === player.x && p.y === player.y) { hurt(); if (ended) return; } }
          if (trail.some(p => Math.hypot(p.x - light.x, p.y - light.y) < .72)) { hurt(); if (ended) return; }
          if (api.input.pressed('draw') && !trail.length) armed = !armed;
          tick += dt; if (tick >= .085) { tick %= .085; const direction = Object.keys(dirs).find(id => api.input.down(id) || api.input.pressed(id)); if (direction) { const [dx, dy] = dirs[direction], x = player.x + dx, y = player.y + dy; if (valid(x, y)) { if (grid[index(x, y)]) { player.x = x; player.y = y; if (trail.length) { closeTrail(); if (ended) return; } else anchor = { ...player }; } else if (armed || trail.length) { if (trail.some(p => p.x === x && p.y === y)) { hurt(); if (ended) return; } else { if (!trail.length) anchor = { ...player }; player.x = x; player.y = y; trail.push({ x, y }); } } } } }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#20363d'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#142936'; ctx.fillRect(OX - 8, OY - 8, W * CELL + 16, H * CELL + 16);
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ctx.fillStyle = grid[index(x, y)] ? '#619b91' : '#223c48'; ctx.fillRect(OX + x * CELL + 1, OY + y * CELL + 1, CELL - 2, CELL - 2); if (grid[index(x, y)]) { ctx.fillStyle = '#8ec5ac55'; ctx.fillRect(OX + x * CELL + 3, OY + y * CELL + 3, CELL - 6, 2); } }
          ctx.fillStyle = '#edcc8d'; trail.forEach(p => { ctx.fillRect(OX + p.x * CELL + 7, OY + p.y * CELL + 7, 13, 13); }); ctx.strokeStyle = '#f1d999'; ctx.lineWidth = 3; if (trail.length) { ctx.beginPath(); ctx.moveTo(OX + (anchor.x + .5) * CELL, OY + (anchor.y + .5) * CELL); trail.forEach(p => { ctx.lineTo(OX + (p.x + .5) * CELL, OY + (p.y + .5) * CELL); }); ctx.stroke(); }
          ctx.fillStyle = '#dd9bb4'; ctx.beginPath(); ctx.arc(OX + (light.x + .5) * CELL, OY + (light.y + .5) * CELL, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#f2c4d166'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(OX + (light.x + .5) * CELL, OY + (light.y + .5) * CELL, 17, 0, TAU); ctx.stroke();
          sparks.forEach(s => { const p = perimeter[Math.floor(s.at)], x = OX + (p.x + .5) * CELL, y = OY + (p.y + .5) * CELL; ctx.fillStyle = '#edaa75'; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 10, y); ctx.lineTo(x, y + 12); ctx.lineTo(x - 10, y); ctx.closePath(); ctx.fill(); }); ctx.globalAlpha = invincible > 0 ? .65 : 1; ctx.fillStyle = armed || trail.length ? '#fff0bf' : '#d3f0dd'; ctx.beginPath(); ctx.roundRect(OX + player.x * CELL + 5, OY + player.y * CELL + 5, 17, 17, 4); ctx.fill(); ctx.globalAlpha = 1;
          ctx.fillStyle = '#d5dfc4'; ctx.textAlign = 'center'; ctx.font = '800 19px system-ui'; ctx.fillText('BRING THE EMPTY SPACE INTO THE LIGHT.', 480, 40); ctx.font = '700 14px system-ui'; ctx.fillText('RECONNECT YOUR TRAIL TO SAFE TERRITORY', 480, 560); if (transition > 0) { ctx.fillStyle = '#19323ddd'; ctx.fillRect(300, 250, 360, 72); ctx.fillStyle = '#bbdfbc'; ctx.font = '900 30px system-ui'; ctx.fillText('A LITTLE MORE LIGHT.', 480, 296); } ctx.restore();
        },
        inspect() { return { player: { ...player }, light: { ...light }, grid: grid.slice(), trail: trail.map(p => ({ ...p })), anchor: { ...anchor }, armed, panel, hearts, score, time, invincible, transition, claimed, closures, sparks: sparks.map(s => ({ ...s, position: { ...perimeter[Math.floor(s.at)] } })), ended, cols: W, rows: H }; }
      };
    }
  });
})();
