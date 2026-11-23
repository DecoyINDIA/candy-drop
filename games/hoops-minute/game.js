/* Hoops Minute: charge-and-release basketball with a moving basket and rim physics. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'hoops-minute', title: 'Hoops Minute', category: 'Basketball', accent: '#ffc08a',
    description: 'Sixty seconds on the rooftop court. Find your arc and make it rain.',
    howTo: ['Score as many baskets as possible in 60 seconds. The hoop drifts, and your shooting spot changes after every basket.', 'Left / Right adjusts the launch angle. Up / Down sets power. Hold Space / Shoot to charge and release, or drag back from the basketball.', 'The dotted arc shows the start of your shot. Long shots earn 3 points; closer shots earn 2. Consecutive baskets build a score bonus.'],
    controls: [{ id: 'left', label: 'Aim ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Aim ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'up', label: 'Power +', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: 'Power −', keys: ['ArrowDown', 'KeyS'] }, { id: 'shoot', label: 'Shoot', keys: ['Space'] }],
    medals: [700, 1800, 3500],
    create(api) {
      let time = 60, clock = 0, score = 0, baskets = 0, shots = 0, streak = 0, points = 0, angle = -0.91, power = 0.65;
      let charging = false, dragging = false, flight = false, flightAge = 0, scored = false, reset = 0, ended = false, banner = 'FIND YOUR ARC', bannerTime = 2;
      let spot = 200, phase = api.random() * Math.PI * 2, shotValue = 3;
      const ball = { x: spot, y: 475, vx: 0, vy: 0, spin: 0 }, hoop = { x: 740, y: 255 };
      function hud() { api.score(score); api.hud([{ label: 'Time', value: Math.ceil(time) + 's' }, { label: 'Buckets', value: baskets }, { label: 'Points', value: points }, { label: 'Power', value: Math.round(power * 100) + '%' }]); }
      function release() { if (flight || reset > 0 || ended) return; flight = true; flightAge = 0; scored = false; shots++; shotValue = hoop.x - spot > 430 ? 3 : 2; const speed = 410 + power * 370; ball.vx = Math.cos(angle) * speed; ball.vy = Math.sin(angle) * speed; api.sound('shoot'); }
      function next() { if (!scored) { streak = 0; banner = 'NEXT SHOT. SAME BELIEF.'; bannerTime = 1; } flight = false; ball.x = spot; ball.y = 475; ball.vx = ball.vy = 0; reset = 0.35; }
      hud();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); clock += dt; bannerTime = Math.max(0, bannerTime - dt); reset = Math.max(0, reset - dt);
          if (time <= 0) { ended = true; score += baskets >= 8 ? 400 : 0; api.end({ score, title: baskets >= 8 ? 'The court remembers.' : 'Every shot is a new chance.', message: baskets + ' baskets, ' + points + ' court points. Read the drifting rim and soften your next landing.', stats: [{ label: 'Baskets', value: baskets }, { label: 'Attempts', value: shots }, { label: 'Accuracy', value: shots ? Math.round(baskets / shots * 100) + '%' : '0%' }] }); return; }
          hoop.x = 730 + Math.sin(clock * 0.7 + phase) * 38; hoop.y = 252 + Math.sin(clock * 0.93 + phase) * 34;
          const input = api.input, p = input.pointer;
          if (!flight && reset <= 0) {
            angle = clamp(angle + (Number(input.down('right')) - Number(input.down('left'))) * 0.8 * dt, -1.38, -0.28);
            power = clamp(power + (Number(input.down('up')) - Number(input.down('down'))) * 0.5 * dt, 0, 1);
            if (input.down('shoot')) { if (!charging) charging = true; power = Math.min(1, power + dt * 0.4); }
            if (charging && !input.down('shoot')) { charging = false; release(); }
            if (p.pressed && p.inside && Math.hypot(p.x - ball.x, p.y - ball.y) < 70) dragging = true;
            if (dragging && p.down) { const dx = ball.x - p.x, dy = ball.y - p.y; if (dx > 4) { angle = clamp(Math.atan2(dy, dx), -1.38, -0.28); power = clamp((Math.hypot(dx, dy) - 12) / 160, 0, 1); } }
            if (dragging && p.released) { dragging = false; release(); }
            if (dragging && !p.down && !p.released) dragging = false;
          }
          if (flight) {
            flightAge += dt;
            for (let i = 0; i < 3; i++) {
              const step = dt / 3, oldY = ball.y, oldX = ball.x; ball.vy += 560 * step; ball.x += ball.vx * step; ball.y += ball.vy * step; ball.spin += ball.vx * step * 0.016;
              if (!scored && ball.vy > 0 && oldY < hoop.y && ball.y >= hoop.y && Math.abs(ball.x - hoop.x) < 27) {
                scored = true; baskets++; points += shotValue; streak++; score += shotValue * 80 + Math.min(streak, 6) * 30; spot = [200, 290, 365, 230][baskets % 4]; banner = (shotValue === 3 ? 'THREE!' : 'BUCKET!') + '  ×' + streak; bannerTime = 1.5; api.sound('good', 1.2); api.burst(hoop.x, hoop.y + 12, '#ffd49c', 18);
              }
              if (!scored) for (const rimX of [hoop.x - 37, hoop.x + 37]) { const dx = ball.x - rimX, dy = ball.y - hoop.y, d = Math.hypot(dx, dy); if (d < 16 && d > 0) { const nx = dx / d, ny = dy / d, dot = ball.vx * nx + ball.vy * ny; if (dot < 0) { ball.vx -= 1.7 * dot * nx; ball.vy -= 1.7 * dot * ny; ball.x = rimX + nx * 16; ball.y = hoop.y + ny * 16; api.sound('hit', 1.3); } } }
              if (oldX < hoop.x + 56 && ball.x >= hoop.x + 56 && ball.y > hoop.y - 94 && ball.y < hoop.y + 22) { ball.x = hoop.x + 55; ball.vx = -Math.abs(ball.vx) * 0.65; api.sound('hit', 0.9); }
            }
            if (ball.y > 555 || ball.x > 1000 || ball.x < -30 || flightAge > 4.5) next();
          }
          hud();
        },
        draw(c) {
          c.save(); const g = c.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#342b48'); g.addColorStop(1, '#b76f68'); c.fillStyle = g; c.fillRect(0, 0, 960, 600);
          c.fillStyle = '#ffcda0'; c.beginPath(); c.arc(180, 128, 59, 0, Math.PI * 2); c.fill();
          for (let i = 0; i < 12; i++) { const h = 90 + i * 71 % 140; c.fillStyle = i % 2 ? '#48364f' : '#3d354c'; c.fillRect(i * 88 - 10, 335 - h, 65, h + 200); c.fillStyle = '#c18b7e44'; for (let y = 350 - h; y < 470; y += 25) c.fillRect(i * 88 + 2, y, 40, 5); }
          c.strokeStyle = '#dca89655'; c.lineWidth = 2; for (let x = 0; x < 960; x += 32) { c.beginPath(); c.moveTo(x, 330); c.lineTo(x, 510); c.stroke(); } c.beginPath(); c.moveTo(0, 330); c.lineTo(960, 330); c.stroke();
          c.fillStyle = '#7c514e'; c.fillRect(0, 510, 960, 90); c.strokeStyle = '#edb78c'; c.lineWidth = 2; c.beginPath(); c.ellipse(600, 562, 236, 36, 0, Math.PI, Math.PI * 2); c.stroke();
          c.strokeStyle = '#37434c'; c.lineWidth = 13; c.beginPath(); c.moveTo(hoop.x + 70, 520); c.lineTo(hoop.x + 70, hoop.y - 72); c.stroke();
          c.fillStyle = '#e9dcc0'; c.fillRect(hoop.x + 48, hoop.y - 100, 14, 125); c.strokeStyle = '#fff4de'; c.lineWidth = 2;
          for (let i = 0; i <= 6; i++) { c.beginPath(); c.moveTo(hoop.x - 36 + i * 12, hoop.y + 5); c.lineTo(hoop.x - 24 + i * 8, hoop.y + 49); c.stroke(); }
          c.beginPath(); c.moveTo(hoop.x - 30, hoop.y + 24); c.lineTo(hoop.x + 30, hoop.y + 24); c.moveTo(hoop.x - 25, hoop.y + 43); c.lineTo(hoop.x + 25, hoop.y + 43); c.stroke(); c.strokeStyle = '#ffb56e'; c.lineWidth = 6; c.beginPath(); c.moveTo(hoop.x - 37, hoop.y); c.lineTo(hoop.x + 37, hoop.y); c.stroke();
          if (!flight) { const speed = 410 + power * 370; for (let i = 1; i < 12; i++) { const t = i * 0.06; c.fillStyle = '#ffe0b866'; c.beginPath(); c.arc(ball.x + Math.cos(angle) * speed * t, ball.y + Math.sin(angle) * speed * t + 280 * t * t, 2.5, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#ffd8a4'; c.fillRect(spot - 36, 530, 72 * power, 4); }
          c.save(); c.translate(ball.x, ball.y); c.rotate(ball.spin); c.fillStyle = '#e99a59'; c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#864a38'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-13, 0); c.lineTo(13, 0); c.moveTo(0, -13); c.lineTo(0, 13); c.stroke(); c.beginPath(); c.ellipse(0, 0, 5, 13, 0, 0, Math.PI * 2); c.stroke(); c.restore();
          c.fillStyle = '#fff0db'; c.font = '900 32px system-ui'; c.textAlign = 'center'; c.fillText('HOOPS / MINUTE', 480, 53); c.font = '700 17px system-ui'; c.fillStyle = '#f0c4b1'; c.fillText(bannerTime > 0 ? banner : 'ONE MORE. FROM RIGHT HERE.', 480, 85); c.font = '900 43px system-ui'; c.fillText(Math.ceil(time), 70, 65); c.font = '13px system-ui'; c.fillText('SECONDS', 70, 88); c.restore();
        },
        cancelInput() { charging = dragging = false; },
        inspect() { return { time, score, baskets, shots, streak, points, angle, power, charging, dragging, flight, flightAge, scored, spot, hoop: { ...hoop }, ball: { ...ball }, ended }; }
      };
    }
  });
})();
