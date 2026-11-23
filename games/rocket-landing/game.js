(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), TAU = Math.PI * 2;
  Arcade.mount({
    id: 'rocket-landing', title: 'Rocket Landing', category: 'Lunar lander', accent: '#c4b5fd',
    description: 'A quiet moon. A little fuel. Bring the next landing home.',
    howTo: ['Land safely on three marked pads within 150 seconds. You have three craft, each with a full fuel tank. The next pad refuels you for a new approach.', 'Left / Right tilts the craft, Up applies thrust, and hold Space to return upright. Touch controls can be held together. Your craft keeps drifting when thrust stops.', 'Touch down fully inside the pad, almost upright, with sideways speed below 32 and downward speed below 44. The landing indicators turn mint when your approach is safe.'],
    controls: [{ id: 'left', label: 'Tilt ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Tilt ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'thrust', label: 'Thrust', keys: ['ArrowUp', 'KeyW'] }, { id: 'level', label: 'Upright', keys: ['Space'] }], medals: [650, 2000, 3800],
    create(api) {
      const craft = { x: 165, y: 120, vx: 0, vy: 0, angle: 0, fuel: 100 }, pad = { x: 730, y: 514, w: 126 };
      let landed = 0, lives = 3, score = 0, time = 150, transition = 0, nextStage = false, ended = false, thrusting = false, clock = 0;
      const stars = Array.from({ length: 70 }, () => ({ x: api.random() * 960, y: api.random() * 420, r: 0.5 + api.random() * 1.1 }));
      const ground = x => Math.abs(x - pad.x) <= pad.w / 2 + 4 ? pad.y : 490 + Math.sin(x / 91) * 21 + Math.sin(x / 43) * 10;
      function reset() { pad.x = [730, 252, 696][landed]; pad.w = 126 - landed * 10; craft.x = pad.x > 480 ? 165 : 800; craft.y = 120; craft.vx = craft.vy = craft.angle = 0; craft.fuel = 100; thrusting = false; }
      function finish(won) { if (ended) return; ended = true; if (won) score += 800 + lives * 220 + Math.floor(time * 7); api.score(score); api.end({ score, title: won ? 'Three soft arrivals.' : 'The moon will wait.', message: won ? 'Every pad reached. A quiet approach and careful braking keep fuel in the tank.' : 'Build sideways speed high above the ground, then tilt the other way to brake. Return upright for the final descent.', stats: [{ label: 'Landings', value: landed + ' / 3' }, { label: 'Craft remaining', value: lives }, { label: 'Fuel', value: Math.round(craft.fuel) + '%' }] }); }
      function crash() { lives--; api.burst(craft.x, craft.y, '#eaa795', 22); api.shake(7); api.sound('bad'); thrusting = false; if (!lives) { finish(false); return; } transition = 1.2; nextStage = false; api.toast('A new craft · watch your landing speed'); }
      function safe() { return Math.abs(craft.angle) < 0.2 && Math.abs(craft.vx) < 32 && craft.vy < 44; }
      function ui() { api.score(score); api.hud([{ label: 'Landings', value: landed + ' / 3' }, { label: 'Craft', value: lives }, { label: 'Fuel', value: Math.ceil(craft.fuel) + '%' }, { label: 'Descent', value: Math.max(0, Math.round(craft.vy)) + ' / 44' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); clock += dt; if (!time) { finish(false); return; }
          if (transition > 0) { transition = Math.max(0, transition - dt); if (!transition) reset(); ui(); return; }
          const turn = Number(api.input.down('right')) - Number(api.input.down('left'));
          if (turn) craft.angle = clamp(craft.angle + turn * 1.65 * dt, -1.25, 1.25);
          else if (api.input.down('level')) craft.angle += clamp(-craft.angle, -2 * dt, 2 * dt);
          thrusting = api.input.down('thrust') && craft.fuel > 0;
          if (thrusting) { craft.vx += Math.sin(craft.angle) * 116 * dt; craft.vy -= Math.cos(craft.angle) * 116 * dt; craft.fuel = Math.max(0, craft.fuel - 7 * dt); }
          craft.vy += 38 * dt; craft.vx *= Math.exp(-0.04 * dt); craft.vy = clamp(craft.vy, -175, 220); craft.x += craft.vx * dt; craft.y += craft.vy * dt;
          if (craft.y < 38) { craft.y = 38; craft.vy = Math.max(0, craft.vy); }
          if (craft.x < 16 || craft.x > 944) { crash(); ui(); return; }
          if (craft.y + 20 >= ground(craft.x)) {
            if (Math.abs(craft.x - pad.x) <= pad.w / 2 - 17 && safe()) {
              craft.y = pad.y - 20; craft.vx = craft.vy = 0; thrusting = false; landed++; const accuracy = Math.max(0, 1 - Math.abs(craft.x - pad.x) / (pad.w / 2)); score += 500 + Math.round(craft.fuel * 5 + accuracy * 150); api.sound('win'); api.burst(craft.x, craft.y, '#a7e0cf', 15);
              if (landed >= 3) { finish(true); return; } transition = 1.5; nextStage = true; api.toast('Soft landing · next pad refueled');
            } else { crash(); if (ended) return; }
          }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#111c32'; ctx.fillRect(0, 0, 960, 600); const glow = ctx.createRadialGradient(760, 110, 10, 760, 110, 250); glow.addColorStop(0, '#53638b55'); glow.addColorStop(1, '#111c3200'); ctx.fillStyle = glow; ctx.fillRect(400, 0, 560, 420);
          ctx.fillStyle = '#d6deec'; stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }); ctx.fillStyle = '#8fb2b6'; ctx.beginPath(); ctx.arc(798, 112, 43, 0, TAU); ctx.fill(); ctx.fillStyle = '#172238'; ctx.beginPath(); ctx.arc(816, 100, 42, 0, TAU); ctx.fill();
          ctx.fillStyle = '#383b52'; ctx.beginPath(); ctx.moveTo(0, 600); for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, ground(x)); ctx.lineTo(960, 600); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#252d43'; for (let i = 0; i < 15; i++) { ctx.beginPath(); ctx.ellipse(30 + i * 71 % 930, 552 + i % 3 * 14, 14 + i % 4 * 5, 5 + i % 3 * 2, 0.2, 0, TAU); ctx.fill(); }
          const good = safe(); ctx.fillStyle = good ? '#9bd7bd' : '#b6a4cd'; ctx.fillRect(pad.x - pad.w / 2, pad.y, pad.w, 6); ctx.strokeStyle = '#b7c7c4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pad.x - pad.w / 2, pad.y); ctx.lineTo(pad.x - pad.w / 2, pad.y - 34); ctx.moveTo(pad.x + pad.w / 2, pad.y); ctx.lineTo(pad.x + pad.w / 2, pad.y - 34); ctx.stroke(); ctx.fillStyle = good ? '#9bd7bd' : '#e3be8a'; ctx.fillRect(pad.x - pad.w / 2, pad.y - 36, 18, 11); ctx.fillRect(pad.x + pad.w / 2 - 18, pad.y - 36, 18, 11);
          ctx.textAlign = 'center'; ctx.font = '800 14px system-ui'; ctx.fillStyle = '#d5d6e4'; ctx.fillText('PAD ' + Math.min(3, landed + 1), pad.x, pad.y + 35);
          if (!transition || nextStage) { ctx.save(); ctx.translate(craft.x, craft.y); ctx.rotate(craft.angle); if (thrusting) { ctx.fillStyle = '#e9ad77'; ctx.beginPath(); ctx.moveTo(-8, 15); ctx.lineTo(0, 34 + Math.sin(clock * 35) * 5); ctx.lineTo(8, 15); ctx.fill(); ctx.fillStyle = '#fff0be'; ctx.beginPath(); ctx.moveTo(-4, 14); ctx.lineTo(0, 26); ctx.lineTo(4, 14); ctx.fill(); } ctx.strokeStyle = '#a7b6c7'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(-18, 20); ctx.lineTo(-24, 20); ctx.moveTo(9, 8); ctx.lineTo(18, 20); ctx.lineTo(24, 20); ctx.stroke(); ctx.fillStyle = '#e5d7e9'; ctx.beginPath(); ctx.moveTo(0, -23); ctx.quadraticCurveTo(-14, -16, -13, 11); ctx.lineTo(13, 11); ctx.quadraticCurveTo(14, -16, 0, -23); ctx.fill(); ctx.fillStyle = '#668da8'; ctx.beginPath(); ctx.arc(0, -6, 7, 0, TAU); ctx.fill(); ctx.restore(); }
          ctx.fillStyle = '#c3c3dd'; ctx.font = '800 15px system-ui'; ctx.fillText('A QUIET APPROACH.', 480, 31); ctx.font = '700 14px system-ui'; const labels = [['UPRIGHT', Math.abs(craft.angle) < 0.2], ['SIDEWAYS < 32', Math.abs(craft.vx) < 32], ['DESCENT < 44', craft.vy < 44]]; labels.forEach((item, i) => { ctx.fillStyle = item[1] ? '#9bd7bd' : '#e0b491'; ctx.fillText(item[0], 315 + i * 165, 63); }); ctx.restore();
        },
        inspect() { return { craft: { ...craft }, pad: { ...pad }, landed, lives, score, time, transition, nextStage, ended, thrusting }; }
      };
    }
  });
})();
