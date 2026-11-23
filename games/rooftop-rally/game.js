/* Rooftop Rally: a seven-point table-tennis duel with placement, spin and smash. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'rooftop-rally', title: 'Rooftop Rally', category: 'Table tennis', accent: '#7eead5',
    description: 'A table above the city. Find the corner, read the bounce, win the rally.',
    howTo: ['First to 7 points wins. The match closes after 3 minutes if neither player reaches 7.', 'Move your bottom paddle with Left / Right, A / D, or drag across the table. Hold Space / Smash as the ball arrives for a faster return.', 'Paddle edges send the ball wide. Moving into contact adds spin. Smash has a 3-second cooldown, so save it for an open corner.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'smash', label: 'Smash', keys: ['Space', 'KeyX'] }],
    medals: [700, 1800, 2700],
    create(api) {
      let player = 480, rival = 480, pv = 0, us = 0, them = 0, time = 180, score = 0, rally = 0, longest = 0;
      let delay = 1, cool = 0, flash = 0, message = 'YOUR SERVE', ended = false, clock = 0, aiBias = 0;
      const ball = { x: 480, y: 426, vx: 110, vy: -280, spin: 0 };
      const trail = [], buildings = Array.from({ length: 19 }, (_, i) => ({ x: i * 58 - 30, h: 30 + api.random() * 100 }));
      function hud() { api.score(score); api.hud([{ label: 'Points', value: us + ' : ' + them }, { label: 'Rally', value: rally }, { label: 'Smash', value: cool > 0 ? cool.toFixed(1) + 's' : 'Ready' }, { label: 'Time', value: Math.ceil(time) + 's' }]); }
      function serve(winner) { ball.x = 480; ball.y = winner === 0 ? 426 : 154; ball.vx = (api.random() - 0.5) * 180; ball.vy = winner === 0 ? -280 : 280; ball.spin = 0; delay = 1.1; rally = 0; aiBias = (api.random() - 0.5) * 54; trail.length = 0; }
      function finish() { if (ended) return; ended = true; const won = us > them; if (won) score += 700 + (7 - them) * 70; api.end({ score, title: won ? 'The rooftop is yours.' : us === them ? 'An even match.' : 'One more rally?', message: us + '–' + them + '. Use the paddle edges to open space, then finish with a smash.', stats: [{ label: 'Your points', value: us }, { label: 'Rival points', value: them }, { label: 'Longest rally', value: longest }] }); }
      function point(side) { if (side === 0) { us++; score += 180; message = 'YOUR POINT'; } else { them++; message = 'RIVAL POINT'; } api.sound(side === 0 ? 'good' : 'bad'); flash = 0.7; if (us >= 7 || them >= 7) { finish(); return; } serve(side); }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; time = Math.max(0, time - dt); cool = Math.max(0, cool - dt); flash = Math.max(0, flash - dt);
          if (time <= 0) { finish(); return; }
          const input = api.input, before = player, dir = Number(input.down('right')) - Number(input.down('left'));
          if (dir) player += dir * 510 * dt;
          else if (input.pointer.down && input.pointer.inside) player += clamp(input.pointer.x - player, -650 * dt, 650 * dt);
          player = clamp(player, 210, 750); pv = (player - before) / Math.max(dt, 0.001);
          const target = ball.vy < 0 ? clamp(ball.x + ball.vx * Math.max(0, (ball.y - 139) / -ball.vy) * 0.58 + aiBias, 199, 761) : 480;
          rival += clamp(target - rival, -(205 + them * 7) * dt, (205 + them * 7) * dt);
          if (delay > 0) { delay -= dt; hud(); return; }
          const oldY = ball.y; ball.vx += ball.spin * dt; ball.spin *= Math.exp(-1.8 * dt); ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < 161 || ball.x > 799) { ball.x = clamp(ball.x, 161, 799); ball.vx *= -1; ball.spin *= -0.5; api.sound('click', 1.6); }
          if (ball.vy > 0 && oldY <= 445 && ball.y >= 445 && Math.abs(ball.x - player) < 67) {
            const edge = (ball.x - player) / 58, smash = input.down('smash') && cool <= 0;
            const speed = Math.min(620, Math.hypot(ball.vx, ball.vy) + (smash ? 110 : 18));
            ball.vx = clamp(edge * speed * 0.76 + pv * 0.22, -speed * 0.82, speed * 0.82); ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx); ball.y = 444; ball.spin = pv * 0.36;
            rally++; longest = Math.max(longest, rally); score += 25 + Math.min(10, rally) * 4; aiBias = (api.random() - 0.5) * 65;
            if (smash) { cool = 3; message = 'SMASH'; flash = 0.5; api.burst(ball.x, ball.y, '#f9d78a', 12); }
            api.sound('hit', smash ? 1.6 : 1.1);
          }
          if (ball.vy < 0 && oldY >= 143 && ball.y <= 143 && Math.abs(ball.x - rival) < 56) {
            const speed = Math.min(590, Math.hypot(ball.vx, ball.vy) + 13), aim = clamp((ball.x - rival) / 51 * 0.7 + (api.random() - 0.5) * 0.3, -0.8, 0.8);
            ball.vx = aim * speed; ball.vy = Math.sqrt(speed * speed - ball.vx * ball.vx); ball.y = 144; ball.spin = (api.random() - 0.5) * 90; api.sound('hit', 0.8);
          }
          if (ball.y < 91) { point(0); if (ended) return; }
          else if (ball.y > 509) { point(1); if (ended) return; }
          if (!api.reducedMotion) { trail.push({ x: ball.x, y: ball.y, life: 0.16 }); for (const t of trail) t.life -= dt; while (trail.length && trail[0].life <= 0) trail.shift(); }
          hud();
        },
        draw(c) {
          c.save(); const sky = c.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, '#152a43'); sky.addColorStop(1, '#30345d'); c.fillStyle = sky; c.fillRect(0, 0, 960, 600);
          c.fillStyle = '#f2c8aa'; c.beginPath(); c.arc(775, 95, 42, 0, Math.PI * 2); c.fill();
          buildings.forEach((b, i) => { c.fillStyle = i % 2 ? '#1a2341' : '#212944'; c.fillRect(b.x, 180 - b.h, 45, b.h + 420); c.fillStyle = '#6c86a73b'; for (let y = 190 - b.h; y < 555; y += 24) c.fillRect(b.x + 9, y, 23, 5); });
          c.fillStyle = '#101f2b'; c.fillRect(136, 108, 688, 410); c.fillStyle = '#286e74'; c.fillRect(150, 96, 660, 404);
          c.strokeStyle = '#badbc7'; c.lineWidth = 3; c.strokeRect(160, 106, 640, 384); c.beginPath(); c.moveTo(480, 106); c.lineTo(480, 490); c.stroke();
          c.fillStyle = '#123e4e88'; c.fillRect(150, 290, 660, 12); c.strokeStyle = '#e7eee5'; c.lineWidth = 2; c.beginPath(); c.moveTo(143, 293); c.lineTo(817, 293); c.stroke();
          for (let x = 154; x < 810; x += 13) { c.strokeStyle = '#d5e9df88'; c.beginPath(); c.moveTo(x, 283); c.lineTo(x, 303); c.stroke(); }
          function paddle(x, y, color, width) { c.fillStyle = '#0004'; c.fillRect(x - width / 2 + 4, y + 4, width, 13); c.fillStyle = color; c.beginPath(); c.roundRect(x - width / 2, y - 6, width, 13, 6); c.fill(); c.fillStyle = '#ffffff66'; c.fillRect(x - width / 2 + 8, y - 4, width - 16, 2); }
          paddle(rival, 135, '#f2a293', 98); paddle(player, 452, cool <= 0 ? '#99f2d4' : '#67a9ac', 116);
          for (const t of trail) { c.globalAlpha = t.life * 3; c.fillStyle = '#fff1ce'; c.beginPath(); c.arc(t.x, t.y, 6, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1;
          c.fillStyle = '#0004'; c.beginPath(); c.ellipse(ball.x + 4, ball.y + 7, 9, 5, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff3d3'; c.beginPath(); c.arc(ball.x, ball.y, 8, 0, Math.PI * 2); c.fill();
          c.textAlign = 'center'; c.fillStyle = '#eaf1e9'; c.font = '900 28px system-ui'; c.fillText('ROOFTOP / RALLY', 480, 49); c.font = '700 16px system-ui'; c.fillStyle = '#8ddccb'; c.fillText('YOU  ' + us + '  :  ' + them + '  RIVAL', 480, 77);
          c.font = '700 16px system-ui'; c.fillStyle = '#c6d5dc'; c.fillText(delay > 0 || flash > 0 ? message : 'PLACE THE RETURN. OWN THE CORNER.', 480, 548);
          c.fillStyle = '#96a9c4'; c.font = '13px system-ui'; c.fillText('FIRST TO SEVEN  ·  ' + Math.ceil(time) + 's  ·  LONGEST RALLY ' + longest, 480, 578); c.restore();
        },
        inspect() { return { player, rival, us, them, time, score, rally, longest, delay, cool, ball: { ...ball }, ended }; }
      };
    }
  });
})();
