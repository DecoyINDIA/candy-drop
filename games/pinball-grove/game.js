(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), TAU = Math.PI * 2;
  Arcade.mount({
    id: 'pinball-grove', title: 'Pinball Grove', category: 'Pinball', accent: '#a3d9a5',
    description: 'A little woodland table. Real bounces. One more ball.',
    howTo: ['Light all five flower bumpers for a 500-point bonus. Reach 8,000 points, or play until three balls or 150 seconds are gone.', 'Hold Left / A and Right / D for the flippers. Space launches a waiting ball; it also launches automatically after two seconds.', 'Up / Nudge gives the ball one upward push every four seconds. Time the flipper lift as the ball arrives; holding it up creates a different rebound.'],
    controls: [{ id: 'left', label: 'L flipper', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'R flipper', keys: ['ArrowRight', 'KeyD'] }, { id: 'launch', label: 'Launch', keys: ['Space'] }, { id: 'nudge', label: 'Nudge ↑', keys: ['ArrowUp', 'KeyW'] }], medals: [600, 2200, 5000],
    create(api) {
      const ball = { x: 667, y: 506, vx: 0, vy: 0, waiting: 2 }, bumpers = [[372, 175], [480, 135], [588, 175], [428, 275], [532, 275]].map(p => ({ x: p[0], y: p[1], r: 24, lit: false, cool: 0 }));
      const flippers = [{ x: 370, y: 490, angle: 0.44, rest: 0.44, raised: -0.44, omega: 0, side: 1, active: false }, { x: 590, y: 490, angle: Math.PI - 0.44, rest: Math.PI - 0.44, raised: Math.PI + 0.44, omega: 0, side: -1, active: false }];
      const rails = [[278, 110, 330, 65], [682, 110, 630, 65], [278, 330, 330, 450], [330, 450, 370, 475], [635, 330, 605, 450], [605, 450, 590, 475], [638, 295, 638, 550]];
      let balls = 3, score = 0, time = 150, nudge = 0, flowers = 0, hits = 0, ended = false, contactSound = 0;
      function finish(won) { if (ended) return; ended = true; if (won) score += balls * 250; api.score(score); api.end({ score, title: won ? 'The whole grove is glowing.' : 'There is always one more ball.', message: won ? 'Eight thousand points. Time your flippers and keep the flowers blooming on the next table.' : 'Lift a flipper just as the ball rolls onto it. Use Nudge before the ball has slipped below the flippers.', stats: [{ label: 'Flower sets', value: flowers }, { label: 'Bumper hits', value: hits }, { label: 'Balls left', value: balls }] }); }
      function launch() { if (ball.waiting <= 0) return; ball.waiting = 0; ball.vx = -105 - api.random() * 25; ball.vy = -790; api.sound('shoot'); }
      function segment(ax, ay, bx, by, moving) {
        const dx = bx - ax, dy = by - ay, length2 = dx * dx + dy * dy, t = clamp(((ball.x - ax) * dx + (ball.y - ay) * dy) / length2, 0, 1), px = ax + dx * t, py = ay + dy * t;
        let nx = ball.x - px, ny = ball.y - py, d = Math.hypot(nx, ny); if (d >= 16) return;
        if (d < 0.001) { const len = Math.sqrt(length2); nx = -dy / len; ny = dx / len; d = 1; } else { nx /= d; ny /= d; }
        ball.x = px + nx * 16.1; ball.y = py + ny * 16.1;
        const surfaceX = moving ? -moving.omega * (py - moving.y) : 0, surfaceY = moving ? moving.omega * (px - moving.x) : 0;
        const dot = (ball.vx - surfaceX) * nx + (ball.vy - surfaceY) * ny;
        if (dot < 0) { ball.vx -= 1.7 * dot * nx; ball.vy -= 1.7 * dot * ny; if (moving && moving.active && Math.abs(moving.omega) > 0.5) { ball.vy = Math.min(ball.vy, -500); ball.vx += moving.side * 100; } if (!contactSound) { api.sound('hit', 0.65); contactSound = 0.1; } }
      }
      function ui() { api.score(score); api.hud([{ label: 'Balls', value: balls }, { label: 'Flowers', value: bumpers.filter(b => b.lit).length + ' / 5' }, { label: 'Nudge', value: nudge > 0 ? nudge.toFixed(1) + 's' : 'Ready' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; } nudge = Math.max(0, nudge - dt); contactSound = Math.max(0, contactSound - dt); bumpers.forEach(b => { b.cool = Math.max(0, b.cool - dt); });
          flippers.forEach((f, i) => { f.active = api.input.down(i ? 'right' : 'left'); const target = f.active ? f.raised : f.rest, old = f.angle; f.angle += clamp(target - f.angle, -10 * dt, 10 * dt); f.omega = (f.angle - old) / dt; });
          if (ball.waiting > 0) { if (api.input.pressed('launch') || ball.waiting <= dt) launch(); else ball.waiting -= dt; ui(); return; }
          if (api.input.pressed('nudge') && nudge <= 0) { ball.vy -= 220; nudge = 4; api.shake(3); api.sound('click'); }
          for (let sub = 0; sub < 4; sub++) {
            const step = dt / 4; ball.vy += 665 * step; ball.x += ball.vx * step; ball.y += ball.vy * step;
            if (ball.x < 276 || ball.x > 684) { ball.x = clamp(ball.x, 276, 684); ball.vx *= -0.85; }
            if (ball.y < 70) { ball.y = 70; ball.vy = Math.abs(ball.vy) * 0.8; }
            for (const r of rails) segment(...r);
            for (const f of flippers) segment(f.x, f.y, f.x + Math.cos(f.angle) * 95, f.y + Math.sin(f.angle) * 95, f);
            for (const bumper of bumpers) {
              let dx = ball.x - bumper.x, dy = ball.y - bumper.y, d = Math.hypot(dx, dy); if (d >= bumper.r + 9) continue;
              if (d < 0.01) { dx = 0; dy = -1; d = 1; } const nx = dx / d, ny = dy / d;
              ball.x = bumper.x + nx * (bumper.r + 9.5); ball.y = bumper.y + ny * (bumper.r + 9.5);
              const dot = ball.vx * nx + ball.vy * ny; if (dot < 0) { ball.vx -= 1.8 * dot * nx; ball.vy -= 1.8 * dot * ny; }
              ball.vx += nx * 110; ball.vy += ny * 110;
              if (bumper.cool <= 0) { bumper.cool = 0.16; hits++; score += bumper.lit ? 65 : 100; bumper.lit = true; api.burst(bumper.x, bumper.y, '#f5cf80', 7); api.sound('good', 1.2); if (bumpers.every(b => b.lit)) { flowers++; score += 500; bumpers.forEach(b => { b.lit = false; }); api.toast('The grove blooms · +500'); } }
            }
            const speed = Math.hypot(ball.vx, ball.vy); if (speed > 1050) { ball.vx *= 1050 / speed; ball.vy *= 1050 / speed; }
            if (ball.y > 610) { balls--; api.sound('bad'); if (!balls) { finish(false); return; } ball.x = 667; ball.y = 506; ball.vx = ball.vy = 0; ball.waiting = 2; break; }
          }
          if (score >= 8000) { finish(true); return; } ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#d9e2cd'; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#b9c9ab'; for (let i = 0; i < 9; i++) { const x = i < 5 ? 70 + i * 31 : 780 + (i - 5) * 35; ctx.beginPath(); ctx.ellipse(x, 160 + i * 70 % 370, 30, 75, i % 2 ? 0.4 : -0.4, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#997a55'; ctx.beginPath(); ctx.roundRect(250, 35, 460, 555, [90, 90, 20, 20]); ctx.fill(); ctx.fillStyle = '#284f48'; ctx.beginPath(); ctx.roundRect(265, 50, 430, 525, [78, 78, 12, 12]); ctx.fill(); ctx.strokeStyle = '#a9c5a655'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(277, 62, 406, 490, [65, 65, 7, 7]); ctx.stroke();
          ctx.strokeStyle = '#598778'; ctx.lineWidth = 1; for (let y = 100; y < 500; y += 34) { ctx.beginPath(); ctx.moveTo(290, y); ctx.quadraticCurveTo(480, y + 80, 670, y); ctx.stroke(); }
          bumpers.forEach(b => { ctx.fillStyle = b.lit ? '#f6d98d' : '#7fa88d'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * 16, b.y + Math.sin(a) * 16, 13, 0, TAU); ctx.fill(); } ctx.fillStyle = b.lit ? '#fff3c2' : '#c1d1ad'; ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, TAU); ctx.fill(); ctx.fillStyle = '#a9794e'; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, TAU); ctx.fill(); });
          ctx.strokeStyle = '#bed2bc'; ctx.lineWidth = 12; ctx.lineCap = 'round'; rails.forEach(r => { ctx.beginPath(); ctx.moveTo(r[0], r[1]); ctx.lineTo(r[2], r[3]); ctx.stroke(); });
          flippers.forEach(f => { ctx.strokeStyle = '#e8bd78'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(f.angle) * 95, f.y + Math.sin(f.angle) * 95); ctx.stroke(); ctx.fillStyle = '#b27e50'; ctx.beginPath(); ctx.arc(f.x, f.y, 12, 0, TAU); ctx.fill(); });
          ctx.fillStyle = '#0e2d2e'; ctx.fillRect(441, 573, 78, 17); ctx.fillStyle = '#b7ccb5'; ctx.fillRect(651, 539, 31, 14); ctx.strokeStyle = '#e4d5b8'; ctx.lineWidth = 2; for (let y = 547; y < 572; y += 5) { ctx.beginPath(); ctx.moveTo(654, y); ctx.lineTo(679, y + 3); ctx.stroke(); }
          const shine = ctx.createRadialGradient(ball.x - 3, ball.y - 4, 1, ball.x, ball.y, 11); shine.addColorStop(0, '#ffffff'); shine.addColorStop(1, '#8ca6ac'); ctx.fillStyle = shine; ctx.beginPath(); ctx.arc(ball.x, ball.y, 9, 0, TAU); ctx.fill();
          ctx.fillStyle = '#476c5b'; ctx.font = '800 24px system-ui'; ctx.textAlign = 'center'; ctx.fillText('THE', 135, 260); ctx.fillText('GROVE', 135, 293); ctx.font = '600 14px system-ui'; ctx.fillText('Five flowers.', 825, 270); ctx.fillText('One more ball.', 825, 293); if (ball.waiting > 0) { ctx.fillStyle = '#ecdfaf'; ctx.font = '800 16px system-ui'; ctx.fillText('SPACE TO LAUNCH', 480, 390); } ctx.restore();
        },
        inspect() { return { ball: { ...ball }, bumpers: bumpers.map(b => ({ ...b })), flippers: flippers.map(f => ({ ...f })), balls, score, time, nudge, flowers, hits, ended }; }
      };
    }
  });
})();
