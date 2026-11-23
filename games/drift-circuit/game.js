(function () {
  'use strict';
  const TAU = Math.PI * 2, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'drift-circuit', title: 'Drift Circuit', category: 'Drift racing', accent: '#fda4af',
    description: 'Find the line. Let the rear tires tell the rest.',
    howTo: ['Complete three laps through the eight checkpoints in order before the 90-second clock ends. The two ghost cars provide a pace to chase.', 'Left / Right steers, Up accelerates, Space brakes, and hold Shift to loosen the rear tires for a drift. Touch buttons can be held together.', 'Brake before the bend and release the drift to regain grip. Grass slows the car. Controlled slides on the road add style points.'],
    controls: [{ id: 'left', label: 'Steer ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Steer ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'throttle', label: 'Throttle', keys: ['ArrowUp', 'KeyW'] }, { id: 'brake', label: 'Brake', keys: ['Space', 'ArrowDown'] }, { id: 'drift', label: 'Drift', keys: ['ShiftLeft', 'KeyX'] }], medals: [900, 2200, 3800],
    create(api) {
      const point = a => ({ x: 480 + Math.cos(a) * 310, y: 300 + Math.sin(a) * 184 });
      const route = Array.from({ length: 96 }, (_, i) => point(i / 96 * TAU)), checkpoints = Array.from({ length: 8 }, (_, i) => point(i / 8 * TAU));
      const car = { x: 790, y: 300, vx: 0, vy: 0, angle: Math.PI / 2 }, ghosts = [{ phase: -.06, speed: .54, color: '#a5b4fc' }, { phase: -.13, speed: .46, color: '#f5d68b' }];
      let next = 1, laps = 0, checkpointsHit = 0, time = 90, score = 0, style = 0, onRoad = true, drifting = false, skidTick = 0, skids = [], ended = false;
      const roadDistance = () => Math.min(...route.map(p => Math.hypot(car.x - p.x, car.y - p.y)));
      function finish(won) { if (ended) return; ended = true; const position = 1 + ghosts.filter(g => g.phase >= 3 * TAU).length; if (won) score += 900 + Math.floor(time * 22) + (3 - position) * 250; score = Math.floor(score); api.score(score); api.end({ score, title: won ? 'A beautiful line around.' : 'Another line to discover.', message: won ? 'Three complete laps. Cleaner exits and purposeful drifts can carry you past both ghosts.' : 'Look toward the next checkpoint. Slow the car before turning, then add throttle as the road opens.', stats: [{ label: 'Laps', value: laps + ' / 3' }, { label: 'Style points', value: Math.floor(style) }, { label: 'Ghost position', value: position + ' / 3' }] }); }
      function ui() { api.score(Math.floor(score)); api.hud([{ label: 'Lap', value: Math.min(3, laps + 1) + ' / 3' }, { label: 'Checkpoint', value: (next || 8) + ' / 8' }, { label: 'Speed', value: Math.round(Math.hypot(car.vx, car.vy)) }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; }
          onRoad = roadDistance() < 59; const speed = Math.hypot(car.vx, car.vy); drifting = api.input.down('drift') && speed > 55;
          car.angle += (Number(api.input.down('right')) - Number(api.input.down('left'))) * clamp(.65 + speed / 130, .65, 2.5) * dt;
          const fx = Math.cos(car.angle), fy = Math.sin(car.angle), forward = car.vx * fx + car.vy * fy, lateral = -car.vx * fy + car.vy * fx;
          const grip = Math.exp(-(drifting ? 1.3 : 8.5) * dt), drag = Math.exp(-(api.input.down('brake') ? 5 : onRoad ? .55 : 3.4) * dt);
          const along = clamp((forward + (api.input.down('throttle') ? onRoad ? 240 : 140 : 0) * dt) * drag, -25, 340), across = lateral * grip;
          car.vx = fx * along - fy * across; car.vy = fy * along + fx * across; car.x = clamp(car.x + car.vx * dt, 32, 928); car.y = clamp(car.y + car.vy * dt, 38, 562);
          if (drifting && onRoad && speed > 110 && Math.abs(lateral) > 26) { const points = dt * Math.min(28, Math.abs(lateral) * .2); style += points; score += points; skidTick += dt; if (skidTick > .08) { skidTick = 0; skids.push({ x: car.x, y: car.y, angle: car.angle }); if (skids.length > 100) skids.shift(); } }
          ghosts.forEach(g => { g.phase += g.speed * dt; });
          const target = checkpoints[next]; if (onRoad && Math.hypot(car.x - target.x, car.y - target.y) < 57) { checkpointsHit++; score += 65; api.sound('click', 1 + next * .06); if (next === 0) { laps++; score += 220; api.toast('Lap ' + laps + ' complete'); if (laps >= 3) { finish(true); return; } } next = (next + 1) % 8; }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#b1bea1'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#93a78c'; for (let i = 0; i < 24; i++) { const x = i * 113 % 960, y = i * 79 % 600; ctx.beginPath(); ctx.arc(x, y, 9 + i % 4 * 4, 0, TAU); ctx.fill(); }
          ctx.strokeStyle = '#d8cfb1'; ctx.lineWidth = 132; ctx.beginPath(); ctx.ellipse(480, 300, 310, 184, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#535c65'; ctx.lineWidth = 116; ctx.beginPath(); ctx.ellipse(480, 300, 310, 184, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#9ca4a177'; ctx.lineWidth = 2; ctx.setLineDash([20, 18]); ctx.beginPath(); ctx.ellipse(480, 300, 310, 184, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          for (let i = 0; i < 8; i++) { const p = checkpoints[i]; ctx.strokeStyle = i === next ? '#f8d99b' : '#d7d9c64d'; ctx.lineWidth = i === next ? 5 : 2; ctx.beginPath(); ctx.arc(p.x, p.y, 37, 0, TAU); ctx.stroke(); if (i === next) { ctx.fillStyle = '#f8e6bb'; ctx.font = '800 20px system-ui'; ctx.textAlign = 'center'; ctx.fillText(i || 'LAP', p.x, p.y + 7); } }
          skids.forEach(s => { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle); ctx.fillStyle = '#26344055'; ctx.fillRect(-8, -12, 16, 3); ctx.fillRect(-8, 9, 16, 3); ctx.restore(); });
          const vehicle = (x, y, a, color, alpha) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = alpha; ctx.fillStyle = '#172b3a'; ctx.fillRect(-17, -14, 10, 5); ctx.fillRect(-17, 9, 10, 5); ctx.fillRect(9, -14, 8, 5); ctx.fillRect(9, 9, 8, 5); ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-23, -11, 46, 22, 7); ctx.fill(); ctx.fillStyle = '#364b60'; ctx.fillRect(-3, -8, 14, 16); ctx.fillStyle = '#f8e3b4'; ctx.fillRect(18, -8, 3, 5); ctx.fillRect(18, 3, 3, 5); ctx.restore(); };
          ghosts.forEach(g => { const p = point(g.phase); vehicle(p.x, p.y, Math.atan2(Math.cos(g.phase) * 184, -Math.sin(g.phase) * 310), g.color, .5); }); vehicle(car.x, car.y, car.angle, '#eaa0a7', 1);
          ctx.fillStyle = '#50695c'; ctx.textAlign = 'center'; ctx.font = '900 30px system-ui'; ctx.fillText('DRIFT CIRCUIT', 480, 286); ctx.font = '700 15px system-ui'; ctx.fillText('BRAKE. TURN. FIND THE EXIT.', 480, 318); ctx.restore();
        },
        inspect() { return { car: { ...car }, checkpoints: checkpoints.map(p => ({ ...p })), ghosts: ghosts.map(g => ({ ...g })), next, laps, checkpointsHit, time, score, style, onRoad, drifting, ended }; }
      };
    }
  });
})();
