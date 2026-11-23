(function () {
  'use strict';
  const TAU = Math.PI * 2, norm = a => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'shield-spin', title: 'Shield Spin', category: 'Radial defense', accent: '#5eead4',
    description: 'A small shield around a very important star. Keep it shining.',
    howTo: ['Intercept 60 incoming sparks before the core loses five shields or 100 seconds run out. A green spark repairs one shield when caught.', 'Hold Left / Right to rotate. Drag around the core to aim directly. Space spends a full pulse charge to clear all incoming sparks.', 'Meet threats with the center of your shield for a precision bonus and faster pulse charging. A missed red spark damages the core.'],
    controls: [{ id: 'left', label: 'Rotate ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Rotate ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'pulse', label: 'Pulse', keys: ['Space'] }], medals: [700, 2300, 5000],
    create(api) {
      let angle = -Math.PI / 2, charge = 1, hp = 5, incoming = [], spawn = 0.75, serial = 0, blocked = 0, perfect = 0, chain = 0, score = 0, time = 100, pulseRing = 0, ended = false;
      const stars = Array.from({ length: 58 }, () => ({ x: api.random() * 960, y: api.random() * 600, r: 0.5 + api.random() * 1.2 }));
      function finish(won) { if (ended) return; ended = true; if (won) score += 900 + hp * 250; api.score(score); api.end({ score, title: won ? 'Your star is still shining.' : 'Every star needs a guardian.', message: won ? 'Sixty threats turned away. Centered interceptions are the next mastery challenge.' : 'Read the longest trails first. Save a full pulse for threats arriving from opposite directions.', stats: [{ label: 'Intercepted', value: blocked + ' / 60' }, { label: 'Precision blocks', value: perfect }, { label: 'Core shields', value: hp }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Intercepted', value: blocked + ' / 60' }, { label: 'Core', value: hp + ' / 5' }, { label: 'Pulse', value: Math.floor(charge * 100) + '%' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; } pulseRing = Math.max(0, pulseRing - dt);
          const turn = Number(api.input.down('right')) - Number(api.input.down('left')); angle = norm(angle + turn * 3.8 * dt);
          if (!turn && api.input.pointer.down && api.input.pointer.inside) angle = Math.atan2(api.input.pointer.y - 300, api.input.pointer.x - 480);
          if (api.input.pressed('pulse') && charge >= 0.999) { const count = incoming.filter(s => s.type !== 'repair').length; blocked += count; score += count * 40; incoming = []; charge = 0; pulseRing = 0.7; api.sound('win'); if (blocked >= 60) { finish(true); return; } }
          spawn -= dt;
          if (spawn <= 0) { const a = serial === 0 ? -Math.PI / 2 : api.random() * TAU; incoming.push({ angle: a, radius: 335, speed: 100 + Math.min(70, blocked * 1.1), type: serial % 12 === 11 ? 'repair' : 'threat', crossed: false }); serial++; spawn += Math.max(0.48, 0.95 - blocked * 0.007); }
          for (let i = incoming.length - 1; i >= 0; i--) {
            const spark = incoming[i]; spark.radius -= spark.speed * dt;
            if (!spark.crossed && spark.radius <= 136) {
              spark.crossed = true; const alignment = Math.abs(norm(spark.angle - angle));
              if (alignment <= 0.49) { incoming.splice(i, 1); if (spark.type === 'repair') { hp = Math.min(5, hp + 1); score += 100; api.toast('Core shield repaired'); } else { blocked++; chain++; const precise = alignment < 0.18; if (precise) perfect++; score += 45 + Math.min(50, chain * 3) + (precise ? 25 : 0); charge = Math.min(1, charge + (precise ? 0.15 : 0.08)); } api.burst(480 + Math.cos(spark.angle) * 130, 300 + Math.sin(spark.angle) * 130, '#5eead4', 8); api.sound('good', 1.1); if (blocked >= 60) { finish(true); return; } continue; }
            }
            if (spark.radius < 25) { incoming.splice(i, 1); if (spark.type !== 'repair') { hp--; chain = 0; api.sound('bad'); api.shake(5); if (!hp) { finish(false); return; } } }
          }
          charge = clamp(charge + 0.008 * dt, 0, 1); ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#10252d'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#9fc2c7'; stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); });
          for (const radius of [70, 130, 205, 280]) { ctx.strokeStyle = '#72c2bb20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(480, 300, radius, 0, TAU); ctx.stroke(); }
          ctx.strokeStyle = '#71b9b120'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(480 + Math.cos(a) * 70, 300 + Math.sin(a) * 70); ctx.lineTo(480 + Math.cos(a) * 280, 300 + Math.sin(a) * 280); ctx.stroke(); }
          const glow = ctx.createRadialGradient(480, 300, 0, 480, 300, 90); glow.addColorStop(0, '#f5da8b55'); glow.addColorStop(1, '#f5da8b00'); ctx.fillStyle = glow; ctx.fillRect(390, 210, 180, 180);
          ctx.fillStyle = '#f5da8b'; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + api.time * 0.15, r = i % 2 ? 19 : 31; ctx.lineTo(480 + Math.cos(a) * r, 300 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(480, 300, 130, angle - 0.49, angle + 0.49); ctx.stroke(); ctx.strokeStyle = '#e5ffed'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(480, 300, 130, angle - 0.17, angle + 0.17); ctx.stroke();
          incoming.forEach(s => { const x = 480 + Math.cos(s.angle) * s.radius, y = 300 + Math.sin(s.angle) * s.radius; ctx.strokeStyle = s.type === 'repair' ? '#a3e63588' : '#fb927488'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(480 + Math.cos(s.angle) * (s.radius + 35), 300 + Math.sin(s.angle) * (s.radius + 35)); ctx.stroke(); ctx.fillStyle = s.type === 'repair' ? '#a3e635' : '#fb9274'; ctx.beginPath(); ctx.arc(x, y, s.type === 'repair' ? 10 : 8, 0, TAU); ctx.fill(); });
          if (pulseRing > 0) { ctx.globalAlpha = pulseRing; ctx.strokeStyle = '#b9fff2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(480, 300, (1 - pulseRing / 0.7) * 430, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
          ctx.fillStyle = '#b6d9cf'; ctx.textAlign = 'center'; ctx.font = '800 14px system-ui'; ctx.fillText('KEEP A LITTLE STAR ALIVE', 480, 29); ctx.fillStyle = '#f5da8b'; ctx.font = '800 24px system-ui'; ctx.fillText('•'.repeat(hp), 480, 361); ctx.restore();
        },
        inspect() { return { angle, charge, hp, incoming: incoming.map(s => ({ ...s })), blocked, perfect, chain, score, time, pulseRing, ended }; }
      };
    }
  });
})();
