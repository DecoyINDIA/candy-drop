/* Penalty Keeper: read six shot zones, choose a dive and meet the ball at impact. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'penalty-keeper', title: 'Penalty Keeper', category: 'Goalkeeping', accent: '#c6e2bb',
    description: 'Read the shoulders. Trust the dive. Twelve penalties, one pair of gloves.',
    howTo: ['Face twelve penalties. Save seven to win the shootout. The glowing goal zone previews the shot during the run-up; watch it before the striker kicks.', 'Left / Right chooses a column. Up / Down chooses high or low. Space dives. On touch, tap a goal zone to choose it and dive in one motion.', 'Dive after the kick. Your gloves take 0.3 seconds to reach the target and stay extended briefly. Diving too early leaves the goal open.'],
    controls: [{ id: 'left', label: '← Zone', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Zone →', keys: ['ArrowRight', 'KeyD'] }, { id: 'up', label: 'High', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: 'Low', keys: ['ArrowDown', 'KeyS'] }, { id: 'dive', label: 'Dive', keys: ['Space'] }],
    medals: [1400, 3200, 4900],
    create(api) {
      const shots = Array.from({ length: 12 }, (_, i) => ({ lane: Math.floor(api.random() * 3), high: api.random() > .5, flight: i ? .72 + api.random() * .32 : 1.02 }));
      let round = 0, phase = 'runup', timer = 2.2, progress = 0, lane = 1, high = false, diving = false, diveAge = 0, diveLane = 1, diveHigh = false, saves = 0, conceded = 0, streak = 0, score = 0, ended = false, message = 'READ THE GLOW. WAIT FOR THE KICK.';
      const keeper = { x: 480, y: 295 }, ball = { x: 480, y: 502, r: 16 };
      const gx = l => 270 + l * 210, gy = h => h ? 168 : 281;
      function hud() { api.score(score); api.hud([{ label: 'Penalty', value: Math.min(12, round + 1) + ' / 12' }, { label: 'Saves', value: saves + ' / 7 to win' }, { label: 'Conceded', value: conceded }, { label: 'Dive zone', value: ['Left', 'Center', 'Right'][lane] + ' ' + (high ? 'high' : 'low') }]); }
      function dive() { if (diving || phase === 'between') return; diving = true; diveAge = 0; diveLane = lane; diveHigh = high; api.sound('shoot', .6); }
      function finish() { ended = true; if (saves >= 7) score += 500; api.end({ score, title: saves >= 7 ? 'Safe hands. Big moments.' : 'The next save is yours.', message: saves + ' saves from twelve penalties. Watch the run-up, then let the kick start your dive.', stats: [{ label: 'Saves', value: saves }, { label: 'Conceded', value: conceded }, { label: 'Save rate', value: Math.round(saves / 12 * 100) + '%' }] }); }
      hud();
      return {
        update(dt) {
          if (ended) return; const input = api.input;
          if (input.pressed('left')) lane = Math.max(0, lane - 1); if (input.pressed('right')) lane = Math.min(2, lane + 1); if (input.pressed('up')) high = true; if (input.pressed('down')) high = false;
          if (input.pointer.pressed && input.pointer.inside && input.pointer.x >= 170 && input.pointer.x <= 790 && input.pointer.y >= 107 && input.pointer.y <= 342) { lane = clamp(Math.floor((input.pointer.x - 165) / 210), 0, 2); high = input.pointer.y < 225; dive(); }
          if (input.pressed('dive')) dive();
          if (diving) { diveAge += dt; const extend = Math.min(1, diveAge / .3) * (diveAge > 1.0 ? Math.max(0, 1 - (diveAge - 1.0) / .4) : 1); keeper.x = 480 + (gx(diveLane) - 480) * extend; keeper.y = 295 + (gy(diveHigh) - 295) * extend; }
          if (phase === 'runup') { timer -= dt; if (timer <= 0) { phase = 'shot'; progress = 0; message = 'KICK!'; api.sound('hit', .6); } }
          else if (phase === 'shot') { progress = Math.min(1, progress + dt / shots[round].flight); const shot = shots[round], ease = progress * progress; ball.x = 480 + (gx(shot.lane) - 480) * ease; ball.y = 502 + (gy(shot.high) - 502) * ease - Math.sin(progress * Math.PI) * 54; ball.r = 16 - progress * 7;
            if (progress >= 1) { const distance = Math.hypot(ball.x - keeper.x, ball.y - keeper.y), saved = diving && diveAge >= .2 && diveAge <= 1.2 && distance < 66; if (saved) { saves++; streak++; score += 330 + Math.round((1 - Math.min(66, distance) / 66) * 100) + Math.min(streak, 6) * 20; message = 'SAVED. HOLD THAT MOMENT.'; api.burst(ball.x, ball.y, '#f1e4b9', 18); api.sound('win', 1.2); } else { conceded++; streak = 0; message = diving && diveAge > 1.2 ? 'TOO EARLY. WAIT FOR THE KICK.' : !diving ? 'GOAL. COMMIT TO YOUR DIVE.' : 'GOAL. READ THE ZONE.'; api.sound('bad'); } phase = 'between'; timer = 1.4; }
          } else { timer -= dt; if (timer <= 0) { round++; if (round >= 12) { round = 11; finish(); return; } phase = 'runup'; timer = 1.9; progress = 0; diving = false; diveAge = 0; keeper.x = 480; keeper.y = 295; ball.x = 480; ball.y = 502; ball.r = 16; message = 'READ THE RUN-UP'; } }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#243f43'; c.fillRect(0, 0, 960, 600); c.fillStyle = '#3b6260'; c.fillRect(0, 80, 960, 163); for (let r = 0; r < 5; r++) for (let i = 0; i < 40; i++) { c.fillStyle = (i + r) % 3 ? '#8eaf91' : '#d2b18c'; c.fillRect(i * 25 + r % 2 * 8, 96 + r * 24, 10, 10); }
          c.fillStyle = '#507c55'; c.fillRect(0, 244, 960, 356); for (let y = 262; y < 600; y += 70) { c.fillStyle = '#5b865b'; c.fillRect(0, y, 960, 35); } c.strokeStyle = '#dce2b6'; c.lineWidth = 3; c.beginPath(); c.moveTo(85, 244); c.lineTo(22, 570); c.lineTo(938, 570); c.lineTo(875, 244); c.stroke(); c.beginPath(); c.ellipse(480, 559, 174, 30, 0, Math.PI, Math.PI * 2); c.stroke();
          c.fillStyle = '#203e45d9'; c.fillRect(170, 108, 620, 238); c.strokeStyle = '#9cbaa66b'; c.lineWidth = 1; for (let x = 170; x <= 790; x += 31) { c.beginPath(); c.moveTo(x, 108); c.lineTo(x, 346); c.stroke(); } for (let y = 108; y <= 346; y += 24) { c.beginPath(); c.moveTo(170, y); c.lineTo(790, y); c.stroke(); }
          c.strokeStyle = '#e7e5c9'; c.lineWidth = 9; c.beginPath(); c.moveTo(170, 346); c.lineTo(170, 108); c.lineTo(790, 108); c.lineTo(790, 346); c.stroke();
          if (phase === 'runup' && timer < 1.5 && timer > .2) { c.strokeStyle = '#f0d892'; c.lineWidth = 3; c.beginPath(); c.arc(gx(shots[round].lane), gy(shots[round].high), 40, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#f1dc9e26'; c.fill(); }
          c.strokeStyle = '#b8e3ca'; c.lineWidth = 2; c.setLineDash([5, 5]); c.strokeRect(gx(lane) - 86, gy(high) - 43, 172, 86); c.setLineDash([]);
          c.save(); c.translate(keeper.x, keeper.y); const lean = diving ? (keeper.x - 480) / 250 : 0; c.rotate(lean * .65); c.strokeStyle = '#88d5bd'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -2); c.lineTo(0, 34); c.moveTo(0, 3); c.lineTo(-31, -12); c.moveTo(0, 3); c.lineTo(31, -12); c.stroke(); c.strokeStyle = '#263e48'; c.lineWidth = 10; c.beginPath(); c.moveTo(-5, 34); c.lineTo(-17, 54); c.moveTo(5, 34); c.lineTo(17, 54); c.stroke(); c.fillStyle = '#edc29c'; c.beginPath(); c.arc(0, -18, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff1c6'; for (const x of [-34, 34]) { c.beginPath(); c.arc(x, -12, 9, 0, Math.PI * 2); c.fill(); } c.restore();
          c.fillStyle = '#d4a27e'; c.beginPath(); c.arc(508, phase === 'runup' ? 450 - (2.2 - timer) * 8 : 439, 13, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#e6c191'; c.lineWidth = 18; c.beginPath(); c.moveTo(508, 458); c.lineTo(514, 482); c.stroke(); c.strokeStyle = '#29454a'; c.lineWidth = 10; c.beginPath(); c.moveTo(510, 482); c.lineTo(495, 510); c.moveTo(518, 482); c.lineTo(540, 505); c.stroke();
          c.fillStyle = '#172e353b'; c.beginPath(); c.ellipse(ball.x, ball.y + ball.r + 8, ball.r * 1.1, ball.r * .35, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff1d4'; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); c.fill(); c.fillStyle = '#526c62'; c.beginPath(); c.arc(ball.x, ball.y, ball.r * .4, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#efe6bf'; c.textAlign = 'center'; c.font = '900 29px Georgia,serif'; c.fillText('Penalty Keeper', 480, 47); c.fillStyle = '#b7d2b3'; c.font = '13px system-ui'; c.fillText('TWELVE SHOTS. ONE PAIR OF GLOVES.', 480, 74); c.font = 'bold 16px system-ui'; c.fillStyle = '#e7dfb8'; c.fillText(message, 480, 583); c.restore();
        },
        inspect() { return { round: round + 1, phase, timer, progress, lane, high, diving, diveAge, diveLane, diveHigh, saves, conceded, streak, score, targetLane: shots[round].lane, targetHigh: shots[round].high, flightDuration: shots[round].flight, keeper: { ...keeper }, ball: { ...ball }, ended }; }
      };
    }
  });
})();
