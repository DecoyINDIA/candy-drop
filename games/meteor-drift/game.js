(function () {
  'use strict';
  const TAU = Math.PI * 2, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'meteor-drift', title: 'Meteor Drift', category: 'Asteroid survival', accent: '#c4b5fd',
    description: 'Trust your thrusters. Carve a path through four drifting debris fields.',
    howTo: ['Break apart four asteroid fields. Large rocks split into smaller ones. You have three ships and 150 seconds.', 'Left / Right rotate, Up applies thrust, and Space fires. Hold Shift for a shield while its battery lasts. Touch buttons can be held together.', 'Your ship keeps drifting after thrust stops. Use short bursts, keep turning, and let bullets open a safe route.'],
    controls: [{ id: 'left', label: 'Rotate ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Rotate ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'thrust', label: 'Thrust', keys: ['ArrowUp', 'KeyW'] }, { id: 'shoot', label: 'Fire', keys: ['Space', 'KeyJ'] }, { id: 'shield', label: 'Shield', keys: ['ShiftLeft', 'KeyK'] }], medals: [1000, 3000, 6000],
    create(api) {
      const ship = { x: 480, y: 300, vx: 0, vy: 0, angle: -Math.PI / 2, lives: 3, invincible: 2, energy: 1 };
      let rocks = [], bullets = [], wave = 1, score = 0, time = 150, cooldown = 0, transition = 0, ended = false, destroyed = 0, shielding = false, thrusting = false;
      const stars = Array.from({ length: 90 }, () => ({ x: api.random() * 960, y: api.random() * 600, r: 0.5 + api.random() * 1.3 }));
      function rock(x, y, size, heading) { const speed = (4 - size) * 28 + wave * 8 + api.random() * 20; return { x, y, size, r: size * 13 + 5, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed, rotation: api.random() * TAU, spin: (api.random() - 0.5) * 0.7, shape: Array.from({ length: 9 }, () => 0.75 + api.random() * 0.25) }; }
      function spawnWave() { rocks = []; for (let i = 0; i < 3 + wave; i++) { const angle = i / (3 + wave) * TAU + api.random() * 0.3; rocks.push(rock(480 + Math.cos(angle) * 390, 300 + Math.sin(angle) * 235, 3, angle + Math.PI + (api.random() - 0.5))); } ship.invincible = 2; }
      function finish(won) { if (ended) return; ended = true; if (won) score += 1100 + ship.lives * 400 + Math.floor(time * 8); api.score(score); api.end({ score, title: won ? 'Clear skies, pilot.' : 'The drift goes on.', message: won ? 'Four fields cleared. Controlled bursts and a little patience make a beautiful flight.' : 'Thrust in short bursts. A slow turn spreads your shots; a shield gives you time to escape.', stats: [{ label: 'Field', value: wave + ' / 4' }, { label: 'Rocks cleared', value: destroyed }, { label: 'Ships', value: ship.lives }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Field', value: wave + ' / 4' }, { label: 'Ships', value: ship.lives }, { label: 'Shield', value: Math.round(ship.energy * 100) + '%' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      spawnWave(); ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; }
          cooldown = Math.max(0, cooldown - dt); ship.invincible = Math.max(0, ship.invincible - dt);
          ship.angle += (Number(api.input.down('right')) - Number(api.input.down('left'))) * 3.5 * dt;
          thrusting = api.input.down('thrust'); shielding = api.input.down('shield') && ship.energy > 0.015;
          ship.energy = clamp(ship.energy + (shielding ? -0.35 : 0.11) * dt, 0, 1);
          if (thrusting) { ship.vx += Math.cos(ship.angle) * 250 * dt; ship.vy += Math.sin(ship.angle) * 250 * dt; }
          ship.vx *= Math.exp(-0.28 * dt); ship.vy *= Math.exp(-0.28 * dt); const velocity = Math.hypot(ship.vx, ship.vy); if (velocity > 325) { ship.vx *= 325 / velocity; ship.vy *= 325 / velocity; }
          ship.x = (ship.x + ship.vx * dt + 960) % 960; ship.y = (ship.y + ship.vy * dt + 600) % 600;
          if (api.input.down('shoot') && cooldown <= 0 && bullets.length < 32) { bullets.push({ x: ship.x + Math.cos(ship.angle) * 21, y: ship.y + Math.sin(ship.angle) * 21, vx: ship.vx + Math.cos(ship.angle) * 560, vy: ship.vy + Math.sin(ship.angle) * 560, life: 1.05 }); cooldown = 0.16; api.sound('shoot', 0.6); }
          for (const r of rocks) { r.x = (r.x + r.vx * dt + 960) % 960; r.y = (r.y + r.vy * dt + 600) % 600; r.rotation += r.spin * dt; }
          for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i]; b.life -= dt; b.x = (b.x + b.vx * dt + 960) % 960; b.y = (b.y + b.vy * dt + 600) % 600;
            if (b.life <= 0) { bullets.splice(i, 1); continue; }
            const at = rocks.findIndex(r => Math.hypot(b.x - r.x, b.y - r.y) < r.r + 3);
            if (at >= 0) { const r = rocks.splice(at, 1)[0]; bullets.splice(i, 1); destroyed++; score += (4 - r.size) * 35; api.burst(r.x, r.y, '#c4b5fd', 10); api.sound('hit'); if (r.size > 1) for (const side of [-1, 1]) rocks.push(rock(r.x + side * 8, r.y, r.size - 1, Math.atan2(r.vy, r.vx) + side * 0.8)); }
          }
          if (ship.invincible <= 0 && !shielding && rocks.some(r => Math.hypot(ship.x - r.x, ship.y - r.y) < r.r + 12)) { ship.lives--; api.burst(ship.x, ship.y, '#fda4af', 25); api.shake(7); api.sound('bad'); if (!ship.lives) { finish(false); return; } ship.x = 480; ship.y = 300; ship.vx = ship.vy = 0; ship.invincible = 2.7; }
          if (!rocks.length) { if (!transition) { if (wave === 4) { finish(true); return; } transition = 1.4; score += 200; api.toast('Debris field clear'); } else { transition -= dt; if (transition <= 0) { transition = 0; wave++; spawnWave(); } } }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#0b1023'; ctx.fillRect(0, 0, 960, 600); const nebula = ctx.createRadialGradient(720, 220, 20, 720, 220, 400); nebula.addColorStop(0, '#38285c'); nebula.addColorStop(1, '#0b102300'); ctx.fillStyle = nebula; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#d3dbf8'; stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); });
          rocks.forEach(r => { ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rotation); ctx.fillStyle = '#302e48'; ctx.strokeStyle = '#a7a0c5'; ctx.lineWidth = 2; ctx.beginPath(); r.shape.forEach((n, i) => { const a = i / 9 * TAU; if (!i) ctx.moveTo(Math.cos(a) * r.r * n, Math.sin(a) * r.r * n); else ctx.lineTo(Math.cos(a) * r.r * n, Math.sin(a) * r.r * n); }); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#151a32'; ctx.beginPath(); ctx.arc(-r.r * 0.2, r.r * 0.1, r.r * 0.22, 0, TAU); ctx.fill(); ctx.restore(); });
          ctx.fillStyle = '#fde68a'; bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, TAU); ctx.fill(); });
          ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle); if (ship.invincible > 0) ctx.globalAlpha = 0.6; if (thrusting) { ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(-11, -7); ctx.lineTo(-28, 0); ctx.lineTo(-11, 7); ctx.fill(); } ctx.fillStyle = '#e8e0ff'; ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-13, -13); ctx.lineTo(-7, 0); ctx.lineTo(-13, 13); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
          if (shielding || ship.invincible > 0) { ctx.strokeStyle = shielding ? '#67e8f9' : '#c4b5fd66'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ship.x, ship.y, 31, 0, TAU); ctx.stroke(); }
          ctx.fillStyle = '#a99dc9'; ctx.font = '800 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('DEEP FIELD ' + String(wave).padStart(2, '0'), 480, 33); if (transition > 0) { ctx.fillStyle = '#ece4ff'; ctx.font = '900 35px system-ui'; ctx.fillText('A MOMENT OF QUIET.', 480, 280); } ctx.restore();
        },
        inspect() { return { ship: { ...ship }, wave, score, time, cooldown, transition, ended, destroyed, shielding, rocks: rocks.map(r => ({ x: r.x, y: r.y, r: r.r, size: r.size, vx: r.vx, vy: r.vy })), bullets: bullets.map(b => ({ ...b })) }; }
      };
    }
  });
})();
