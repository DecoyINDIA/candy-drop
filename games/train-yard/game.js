/* Train Yard: three live switches, four depots, a signal and eighteen scheduled trains. */
(() => {
  'use strict';
  const NODES = [{ x: 62, y: 300 }, { x: 300, y: 52 }, { x: 300, y: 548 }, { x: 300, y: 300 }, { x: 615, y: 153 }, { x: 615, y: 447 }, { x: 895, y: 94 }, { x: 895, y: 245 }, { x: 895, y: 355 }, { x: 895, y: 506 }];
  const COLORS = ['#df9985', '#e3c480', '#9acdb7'];
  const TRACKS = [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [4, 7], [5, 8], [5, 9]];
  Arcade.mount({
    id: 'train-yard', title: 'Train Yard', category: 'Railway dispatch', accent: '#c6d9aa',
    description: 'Three switches. Eighteen trains. Keep the whole little railway moving.',
    howTo: ['Send eighteen trains to depots of their own color. Three mistakes or collisions close the yard. Deliver at least fifteen to complete the shift.', 'A switches the first junction between the upper and lower branches. S switches the upper exit (coral / gold). D switches the lower exit (gold / mint). Tap a switch to change it.', 'Hold Space / Signal to stop incoming trains before the first junction while you plan. Trains keep arriving, so release the signal before a queue collides. Gold trains can use either gold platform.'],
    controls: [{ id: 'switchA', label: 'A · Branch', keys: ['KeyA', 'Digit1'] }, { id: 'switchB', label: 'S · Upper', keys: ['KeyS', 'Digit2'] }, { id: 'switchC', label: 'D · Lower', keys: ['KeyD', 'Digit3'] }, { id: 'signal', label: 'Hold signal', keys: ['Space'] }],
    medals: [1600, 3500, 5400],
    create(api) {
      const plan = Array.from({ length: 18 }, (_, i) => ({ color: i < 3 ? [0, 2, 1][i] : Math.floor(api.random() * 3), source: i % 3, speed: i < 3 ? 95 : 90 + api.random() * 35 }));
      const switches = [0, 0, 1]; let trains = [], clock = 0, spawnTimer = 1.2, spawned = 0, resolved = 0, delivered = 0, mistakes = 0, collisions = 0, hearts = 3, score = 0, streak = 0, ended = false, message = 'CORAL UP. MINT DOWN. GOLD HAS TWO PLATFORMS.';
      function hud() { api.score(score); api.hud([{ label: 'Delivered', value: delivered + ' / 18' }, { label: 'Incoming', value: 18 - spawned }, { label: 'Safety', value: hearts + ' / 3' }, { label: 'Streak', value: streak }]); }
      function finish() { ended = true; const won = delivered >= 15 && hearts > 0; if (won) score += 700 + hearts * 100; api.end({ score, title: won ? 'A railway in perfect rhythm.' : 'Reset the signals.', message: delivered + ' trains delivered. Set the exit before a train reaches the switch, and use the signal for a short planning pause.', stats: [{ label: 'Delivered', value: delivered + ' / 18' }, { label: 'Wrong platforms', value: mistakes }, { label: 'Collisions', value: collisions }, { label: 'Safety remaining', value: hearts }] }); }
      function switchTrack(i) { switches[i] = 1 - switches[i]; api.sound('click', .8 + i * .2); }
      function spawn() { const p = plan[spawned], origin = NODES[p.source]; trains.push({ id: spawned++, color: p.color, source: p.source, from: p.source, to: 3, distance: 0, x: origin.x, y: origin.y, angle: Math.atan2(300 - origin.y, 300 - origin.x), speed: p.speed, phase: 'incoming', trail: [], live: true }); spawnTimer = spawned < 4 ? 5 : 3.6; }
      function arrive(t) { t.from = t.to; t.distance = 0; if (t.to === 3) { t.to = switches[0] === 0 ? 4 : 5; t.phase = 'branch'; }
        else if (t.to === 4) { t.to = switches[1] === 0 ? 6 : 7; t.phase = 'depot'; }
        else if (t.to === 5) { t.to = switches[2] === 0 ? 8 : 9; t.phase = 'depot'; }
        else { const color = t.to === 6 ? 0 : t.to === 9 ? 2 : 1; t.live = false; resolved++; if (color === t.color) { delivered++; streak++; score += 250 + Math.min(10, streak) * 15; message = 'RIGHT ON SCHEDULE · ' + delivered + ' DELIVERED'; api.burst(t.x, t.y, COLORS[t.color], 10); api.sound('good'); } else { hearts--; mistakes++; streak = 0; message = 'WRONG PLATFORM. CHECK THE EXIT SWITCH.'; api.sound('bad'); } }
      }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; const input = api.input;
          ['switchA', 'switchB', 'switchC'].forEach((id, i) => { if (input.pressed(id)) switchTrack(i); });
          if (input.pointer.pressed && input.pointer.inside) [3, 4, 5].forEach((n, i) => { if (Math.hypot(input.pointer.x - NODES[n].x, input.pointer.y - NODES[n].y) < 50) switchTrack(i); });
          spawnTimer -= dt; if (spawned < 18 && spawnTimer <= 0) spawn();
          for (const t of trains) { const a = NODES[t.from], b = NODES[t.to], length = Math.hypot(b.x - a.x, b.y - a.y); if (!(t.to === 3 && input.down('signal') && length - t.distance <= 53)) t.distance += t.speed * dt; const fraction = Math.min(1, t.distance / length); t.x = a.x + (b.x - a.x) * fraction; t.y = a.y + (b.y - a.y) * fraction; t.angle = Math.atan2(b.y - a.y, b.x - a.x); t.trail.push({ x: t.x, y: t.y, angle: t.angle }); if (t.trail.length > 46) t.trail.shift(); if (fraction >= 1) arrive(t); }
          for (let i = 0; i < trains.length; i++) for (let j = i + 1; j < trains.length; j++) { const a = trains[i], b = trains[j]; if (a.live && b.live && Math.hypot(a.x - b.x, a.y - b.y) < 27) { a.live = b.live = false; resolved += 2; hearts--; collisions++; streak = 0; message = 'TRACK COLLISION. KEEP THE SIGNAL QUEUE MOVING.'; api.burst((a.x + b.x) / 2, (a.y + b.y) / 2, '#e1b78c', 18); api.sound('bad'); api.shake(5); } }
          trains = trains.filter(t => t.live); if (hearts <= 0 || resolved >= 18 || clock >= 180) { finish(); return; } hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#536c58'; c.fillRect(0, 0, 960, 600); c.fillStyle = '#667b5e'; for (let i = 0; i < 23; i++) { c.beginPath(); c.arc((i * 179 + 55) % 960, (i * 83 + 30) % 600, 19 + i % 4 * 7, 0, Math.PI * 2); c.fill(); }
          for (const [a, b] of TRACKS) { const A = NODES[a], B = NODES[b], dx = B.x - A.x, dy = B.y - A.y, angle = Math.atan2(dy, dx), distance = Math.hypot(dx, dy); c.strokeStyle = '#354b42'; c.lineWidth = 23; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); c.save(); c.translate(A.x, A.y); c.rotate(angle); for (let x = 9; x < distance; x += 15) { c.fillStyle = '#a59370'; c.fillRect(x - 3, -12, 6, 24); } c.strokeStyle = '#b8c4ad'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -7); c.lineTo(distance, -7); c.moveTo(0, 7); c.lineTo(distance, 7); c.stroke(); c.restore(); }
          for (const [i, n] of [3, 4, 5].entries()) { const a = NODES[n], dest = i === 0 ? NODES[switches[i] ? 5 : 4] : i === 1 ? NODES[switches[i] ? 7 : 6] : NODES[switches[i] ? 9 : 8]; c.fillStyle = '#304e47'; c.beginPath(); c.arc(a.x, a.y, 32, 0, Math.PI * 2); c.fill(); c.strokeStyle = i === 0 ? '#e9d3a0' : i === 1 ? COLORS[switches[i] ? 1 : 0] : COLORS[switches[i] ? 2 : 1]; c.lineWidth = 5; c.beginPath(); c.moveTo(a.x - 12, a.y); const angle = Math.atan2(dest.y - a.y, dest.x - a.x); c.lineTo(a.x + Math.cos(angle) * 25, a.y + Math.sin(angle) * 25); c.stroke(); c.fillStyle = '#e1dbb6'; c.textAlign = 'center'; c.font = 'bold 13px system-ui'; c.fillText(['A · BRANCH', 'S · UPPER', 'D · LOWER'][i], a.x, a.y + (i === 1 ? -45 : 51)); }
          [6, 7, 8, 9].forEach(n => { const p = NODES[n], color = n === 6 ? 0 : n === 9 ? 2 : 1; c.fillStyle = '#354c42'; c.fillRect(p.x - 22, p.y - 24, 49, 49); c.fillStyle = COLORS[color]; c.fillRect(p.x - 15, p.y - 16, 34, 33); c.fillStyle = '#345148'; c.font = '900 13px system-ui'; c.textAlign = 'center'; c.fillText(['C', 'G', 'M'][color], p.x + 2, p.y + 5); });
          const signal = api.input.down('signal'); c.fillStyle = '#233e37'; c.fillRect(239, 239, 17, 30); c.fillStyle = signal ? '#e39a83' : '#b2d1a0'; c.beginPath(); c.arc(247, 252, 5, 0, Math.PI * 2); c.fill();
          for (const t of trains) { const positions = [t.trail[Math.max(0, t.trail.length - 34)], t.trail[Math.max(0, t.trail.length - 17)], t]; positions.forEach((p, i) => { if (!p) return; c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.fillStyle = '#253c34'; c.fillRect(-13, -11, 26, 22); c.fillStyle = COLORS[t.color]; c.beginPath(); c.roundRect(-12, -8, 24, 16, 3); c.fill(); c.fillStyle = '#45675c'; if (i === 2) c.fillRect(3, -6, 6, 12); else c.fillRect(-7, -5, 14, 10); c.restore(); }); }
          c.fillStyle = '#2c4840ee'; c.fillRect(18, 15, 225, 69); c.fillStyle = '#e6ddba'; c.textAlign = 'left'; c.font = '900 28px Georgia,serif'; c.fillText('Train Yard', 34, 48); c.fillStyle = '#b8c6a5'; c.font = '10px system-ui'; c.fillText('KEEP THE WHOLE YARD MOVING.', 35, 70); c.fillStyle = '#e4dab4'; c.font = 'bold 13px system-ui'; c.textAlign = 'center'; c.fillText(message, 480, 584); c.restore();
        },
        inspect() { return { clock, spawnTimer, spawned, resolved, delivered, mistakes, collisions, hearts, score, streak, switches: [...switches], trains: trains.map(t => ({ id: t.id, color: t.color, source: t.source, from: t.from, to: t.to, distance: t.distance, remaining: Math.hypot(NODES[t.to].x - t.x, NODES[t.to].y - t.y), x: t.x, y: t.y, speed: t.speed, phase: t.phase, trailLength: t.trail.length })), ended }; }
      };
    }
  });
})();
