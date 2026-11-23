(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), TAU = Math.PI * 2;
  Arcade.mount({
    id: 'harbor-rescue', title: 'Harbor Rescue', category: 'Boat rescue', accent: '#7dd3fc',
    description: 'Follow the current. Find every passenger. Bring them home.',
    howTo: ['Rescue six swimmers and deliver everyone to the striped harbor circle within 150 seconds. The boat carries three people. Watch your four hull points and fuel.', 'Left / Right steers, Up accelerates, and Space / Down brakes. Glide close to a swimmer to pick them up automatically; enter the harbor slowly to unload.', 'Currents move the boat even with the engine off. Leave room around islands, brake before docking, and return with passengers to refill part of your fuel tank.'],
    controls: [{ id: 'left', label: 'Steer ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Steer ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'thrust', label: 'Throttle', keys: ['ArrowUp', 'KeyW'] }, { id: 'brake', label: 'Brake', keys: ['Space', 'ArrowDown', 'KeyS'] }], medals: [500, 1500, 3300],
    create(api) {
      const boat = { x: 114, y: 480, vx: 0, vy: 0, angle: -Math.PI / 2, fuel: 100 }, harbor = { x: 114, y: 480, r: 56 };
      const islands = [{ x: 315, y: 267, r: 64 }, { x: 577, y: 272, r: 74 }, { x: 778, y: 295, r: 44 }];
      const people = [[286, 113], [475, 91], [752, 127], [791, 447], [550, 494], [345, 421]].map((p, i) => ({ x: p[0] + (api.random() - .5) * 22, y: p[1] + (api.random() - .5) * 22, id: i, rescued: false }));
      let aboard = 0, delivered = 0, hull = 4, score = 0, time = 150, invincible = 0, clock = 0, wakeTick = 0, wake = [], ended = false, engine = false, braking = false;
      function finish(won) { if (ended) return; ended = true; if (won) score += 800 + hull * 180 + Math.floor(time * 6) + Math.floor(boat.fuel * 4); api.score(score); api.end({ score, title: won ? 'Everyone is home.' : 'The harbor is still waiting.', message: won ? 'Six passengers, safely ashore. A calmer route leaves more fuel and a healthier hull.' : 'Carry up to three swimmers, then return to the harbor. Slow down near islands and use Brake to settle inside the harbor circle.', stats: [{ label: 'Delivered', value: delivered + ' / 6' }, { label: 'Aboard', value: aboard }, { label: 'Hull', value: hull + ' / 4' }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Home', value: delivered + ' / 6' }, { label: 'Aboard', value: aboard + ' / 3' }, { label: 'Hull', value: hull + ' / 4' }, { label: 'Fuel', value: Math.ceil(boat.fuel) + '%' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; clock += dt; time = Math.max(0, time - dt); invincible = Math.max(0, invincible - dt); if (!time || boat.fuel <= 0) { finish(false); return; }
          engine = api.input.down('thrust'); braking = api.input.down('brake');
          boat.angle += (Number(api.input.down('right')) - Number(api.input.down('left'))) * 2.3 * dt;
          if (engine) { boat.vx += Math.cos(boat.angle) * 180 * dt; boat.vy += Math.sin(boat.angle) * 180 * dt; }
          const flowX = 13 * Math.sin(boat.y / 100 + clock * .18), flowY = 9 * Math.cos(boat.x / 120 + clock * .12), drag = Math.exp(-(braking ? 5.8 : 1.25) * dt);
          boat.vx = (boat.vx + flowX * dt) * drag; boat.vy = (boat.vy + flowY * dt) * drag; boat.fuel = Math.max(0, boat.fuel - (engine ? 1.05 : 0.16) * dt);
          boat.x = clamp(boat.x + boat.vx * dt, 28, 932); boat.y = clamp(boat.y + boat.vy * dt, 58, 566);
          for (const island of islands) {
            let dx = boat.x - island.x, dy = boat.y - island.y, d = Math.hypot(dx, dy); if (d >= island.r + 16) continue;
            if (d < .01) { dx = 1; dy = 0; d = 1; } const nx = dx / d, ny = dy / d; boat.x = island.x + nx * (island.r + 16.5); boat.y = island.y + ny * (island.r + 16.5);
            const approach = boat.vx * nx + boat.vy * ny; if (approach < 0) { boat.vx -= 1.5 * approach * nx; boat.vy -= 1.5 * approach * ny; }
            if (invincible <= 0) { hull--; invincible = 1.6; api.sound('bad'); api.shake(4); if (!hull) { finish(false); return; } }
          }
          for (const p of people) if (!p.rescued && aboard < 3 && Math.hypot(p.x - boat.x, p.y - boat.y) < 30) { p.rescued = true; aboard++; score += 75; api.sound('good', 1.2); api.toast(aboard === 3 ? 'Boat full · return to the harbor' : 'Passenger aboard · ' + aboard + ' / 3'); }
          if (aboard && Math.hypot(boat.x - harbor.x, boat.y - harbor.y) < harbor.r - 8 && Math.hypot(boat.vx, boat.vy) < 55) { delivered += aboard; score += aboard * 220; boat.fuel = Math.min(100, boat.fuel + aboard * 13); aboard = 0; api.sound('win'); api.burst(boat.x, boat.y, '#f4d59b', 14); api.toast('Passengers home · tank refilled'); if (delivered >= 6) { finish(true); return; } }
          wakeTick += dt; if (wakeTick >= .08) { wakeTick = 0; wake.push({ x: boat.x - Math.cos(boat.angle) * 16, y: boat.y - Math.sin(boat.angle) * 16, life: 1.3 }); if (wake.length > 20) wake.shift(); } wake.forEach(w => { w.life -= dt; }); wake = wake.filter(w => w.life > 0);
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 960, 600); g.addColorStop(0, '#83bfc9'); g.addColorStop(1, '#4a8b9f'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
          ctx.strokeStyle = '#d0e4d32b'; ctx.lineWidth = 2; for (let i = 0; i < 45; i++) { const x = (i * 127 + clock * 7) % 1000 - 20, y = 70 + i * 73 % 500; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 5, x + 32, y); ctx.stroke(); }
          ctx.fillStyle = '#b2cfb0'; ctx.fillRect(0, 387, 44, 213); ctx.fillStyle = '#8d785c'; ctx.fillRect(32, 454, 94, 13); ctx.fillRect(32, 510, 94, 13); ctx.fillRect(102, 449, 13, 79); ctx.strokeStyle = '#cbb492'; ctx.lineWidth = 2; for (let x = 40; x < 124; x += 10) { ctx.beginPath(); ctx.moveTo(x, 456); ctx.lineTo(x, 465); ctx.moveTo(x, 512); ctx.lineTo(x, 521); ctx.stroke(); }
          ctx.setLineDash([7, 7]); ctx.strokeStyle = '#f3e6b7'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(harbor.x, harbor.y, harbor.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#f5e9c7'; ctx.font = '800 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('HARBOR', harbor.x, 560);
          for (const island of islands) { ctx.fillStyle = '#d0d49c55'; ctx.beginPath(); ctx.arc(island.x, island.y, island.r + 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#d7c79e'; ctx.beginPath(); ctx.arc(island.x, island.y, island.r, 0, TAU); ctx.fill(); ctx.fillStyle = '#8aab80'; ctx.beginPath(); ctx.arc(island.x - 3, island.y - 3, island.r - 12, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8c8460'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(island.x, island.y + 16); ctx.lineTo(island.x + 4, island.y - 17); ctx.stroke(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.save(); ctx.translate(island.x + 4, island.y - 17); ctx.rotate(a); ctx.fillStyle = '#4f8669'; ctx.beginPath(); ctx.ellipse(15, 0, 24, 8, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
          people.forEach(p => { if (p.rescued) return; const y = p.y + Math.sin(clock * 2 + p.id) * 2; ctx.fillStyle = '#e9a37e'; ctx.beginPath(); ctx.arc(p.x, y, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#f4e5c7'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, y, 8, 0, Math.PI); ctx.stroke(); ctx.fillStyle = '#e7c09d'; ctx.beginPath(); ctx.arc(p.x, y - 6, 5, 0, TAU); ctx.fill(); });
          wake.forEach(w => { ctx.globalAlpha = w.life / 1.3 * .35; ctx.strokeStyle = '#e0eee0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w.x, w.y, 3 + (1.3 - w.life) * 9, 0, TAU); ctx.stroke(); }); ctx.globalAlpha = invincible > 0 ? .6 : 1;
          ctx.save(); ctx.translate(boat.x, boat.y); ctx.rotate(boat.angle); ctx.fillStyle = '#f2e6c9'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.quadraticCurveTo(10, -15, -19, -12); ctx.lineTo(-19, 12); ctx.quadraticCurveTo(10, 15, 25, 0); ctx.fill(); ctx.fillStyle = '#b7736e'; ctx.fillRect(-14, -9, 18, 18); ctx.fillStyle = '#abcbd0'; ctx.fillRect(-4, -7, 10, 14); ctx.fillStyle = '#e8c48b'; for (let i = 0; i < aboard; i++) { ctx.beginPath(); ctx.arc(-12 + i * 6, 1, 2.5, 0, TAU); ctx.fill(); } ctx.restore(); ctx.globalAlpha = 1;
          ctx.fillStyle = '#e6efe1'; ctx.font = '800 16px system-ui'; ctx.fillText('BRING EVERYONE HOME.', 480, 31); if (aboard === 3) { ctx.font = '800 14px system-ui'; ctx.fillText('BOAT FULL · RETURN TO THE HARBOR', 480, 57); } ctx.restore();
        },
        inspect() { return { boat: { ...boat }, harbor: { ...harbor }, islands: islands.map(i => ({ ...i })), people: people.map(p => ({ ...p })), aboard, delivered, hull, score, time, invincible, clock, ended, engine, braking }; }
      };
    }
  });
})();
