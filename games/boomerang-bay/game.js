(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), TAU = Math.PI * 2, ORIGIN = { x: 220, y: 478 }, SPEED = 405, TURN = .75;
  Arcade.mount({
    id: 'boomerang-bay', title: 'Boomerang Bay', category: 'Returning throws', accent: '#f5cc8b',
    description: 'Find the curve. Leave something beautiful on the way back.',
    howTo: ['Clear three numbered targets in order in each of five arrangements before 90 seconds. Only the glowing next target can be collected.', 'Left / Right changes your throwing angle. Space throws; press it again as the returning boomerang reaches the ring around your hand for a perfect catch. You can also aim and tap above the hand.', 'The boomerang curves clockwise, then flies home. It returns automatically if you leave it alone; a well-timed catch adds points and builds your catch streak.'],
    controls: [{ id: 'left', label: 'Aim ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Aim ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'throw', label: 'Throw / Catch', keys: ['Space'] }], medals: [900, 2400, 4000],
    create(api) {
      let angle = -1.1, round = 1, targets = [], targetIndex = 0, boomerang = null, score = 0, time = 90, catches = 0, streak = 0, hits = 0, throws = 0, ended = false, clock = 0;
      function layout() { targetIndex = 0; const base = -1.02 + (api.random() - .5) * .52; targets = [.42, .72, 1.02].map((t, i) => ({ x: ORIGIN.x + SPEED / TURN * (Math.sin(base + TURN * t) - Math.sin(base)), y: ORIGIN.y - SPEED / TURN * (Math.cos(base + TURN * t) - Math.cos(base)), hit: false, number: i + 1 })); }
      function finish(won) { if (ended) return; ended = true; if (won) score += 850 + Math.floor(time * 9); api.score(score); api.end({ score, title: won ? 'Every throw found its way home.' : 'The bay will bring it back.', message: won ? 'Five complete arrangements. Follow the whole curve, and make the return part of your rhythm.' : 'Aim a little to the left of the first target. The throw bends clockwise before it turns for home.', stats: [{ label: 'Targets', value: hits + ' / 15' }, { label: 'Perfect catches', value: catches }, { label: 'Throws', value: throws }] }); }
      function catchBoomerang(perfect) { if (!boomerang) return; boomerang = null; if (perfect) { catches++; streak++; score += 110 + Math.min(5, streak) * 25; api.sound('good', 1.3); api.burst(ORIGIN.x, ORIGIN.y, '#f5cc8b', 12); } else { streak = 0; api.sound('click'); } if (targetIndex === 3) { if (round === 5) { finish(true); return; } round++; layout(); api.toast('Arrangement ' + round + ' · a new curve'); } }
      function action() { if (boomerang) { if (boomerang.returning && Math.hypot(boomerang.x - ORIGIN.x, boomerang.y - ORIGIN.y) < 76) catchBoomerang(true); return; } boomerang = { x: ORIGIN.x, y: ORIGIN.y, vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED, age: 0, returning: false }; throws++; api.sound('shoot'); }
      function ui() { api.score(score); api.hud([{ label: 'Arrangement', value: round + ' / 5' }, { label: 'Target', value: Math.min(3, targetIndex + 1) + ' / 3' }, { label: 'Catches', value: catches }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      layout(); ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); clock += dt; if (!time) { finish(false); return; }
          angle = clamp(angle + (Number(api.input.down('right')) - Number(api.input.down('left'))) * 1.3 * dt, -2.3, -.15);
          const p = api.input.pointer; if (!boomerang && p.down && p.inside && p.y < 450) angle = clamp(Math.atan2(p.y - ORIGIN.y, p.x - ORIGIN.x), -2.3, -.15);
          if (api.input.pressed('throw') || p.pressed && p.inside) { if (!boomerang && p.y < 450 && p.pressed) angle = clamp(Math.atan2(p.y - ORIGIN.y, p.x - ORIGIN.x), -2.3, -.15); action(); if (ended) return; }
          if (boomerang) {
            const b = boomerang; b.age += dt;
            if (!b.returning) { const a = Math.atan2(b.vy, b.vx) + TURN * dt; b.vx = Math.cos(a) * SPEED; b.vy = Math.sin(a) * SPEED; if (b.age >= 1.3 || b.x < 30 || b.x > 930 || b.y < 35 || b.y > 550 || targetIndex === 3) b.returning = true; }
            if (b.returning) { const dx = ORIGIN.x - b.x, dy = ORIGIN.y - b.y, d = Math.hypot(dx, dy); const blend = 1 - Math.exp(-6 * dt); b.vx += (dx / Math.max(1, d) * 540 - b.vx) * blend; b.vy += (dy / Math.max(1, d) * 540 - b.vy) * blend; }
            b.x += b.vx * dt; b.y += b.vy * dt;
            const target = targets[targetIndex]; if (target && Math.hypot(b.x - target.x, b.y - target.y) < 28) { target.hit = true; targetIndex++; hits++; score += 120 + targetIndex * 25; api.sound('good', .9 + targetIndex * .12); api.burst(target.x, target.y, '#f5ce90', 10); }
            if (b.returning && Math.hypot(b.x - ORIGIN.x, b.y - ORIGIN.y) < 19 || b.age > 5) { catchBoomerang(false); if (ended) return; }
          }
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#d9dfcd'); g.addColorStop(.65, '#9bbfbd'); g.addColorStop(1, '#517b8a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#a4c3bf'; ctx.beginPath(); ctx.moveTo(0, 300); ctx.quadraticCurveTo(250, 230, 500, 310); ctx.quadraticCurveTo(720, 350, 960, 270); ctx.lineTo(960, 600); ctx.lineTo(0, 600); ctx.fill();
          ctx.strokeStyle = '#e6ecdb44'; ctx.lineWidth = 2; for (let i = 0; i < 20; i++) { const x = (i * 83 + clock * 8) % 1000; ctx.beginPath(); ctx.moveTo(x, 350 + i % 6 * 29); ctx.lineTo(x + 30, 350 + i % 6 * 29); ctx.stroke(); }
          ctx.fillStyle = '#b4a281'; ctx.beginPath(); ctx.moveTo(0, 600); ctx.lineTo(0, 467); ctx.quadraticCurveTo(160, 440, 330, 530); ctx.lineTo(410, 600); ctx.fill();
          targets.forEach((t, i) => { ctx.strokeStyle = t.hit ? '#76978d88' : i === targetIndex ? '#b77d47' : '#b1bba4'; ctx.lineWidth = t.hit ? 3 : 6; ctx.beginPath(); ctx.arc(t.x, t.y, 24, 0, TAU); ctx.stroke(); if (!t.hit) { ctx.fillStyle = i === targetIndex ? '#ffe5b0' : '#e0e2c9'; ctx.beginPath(); ctx.arc(t.x, t.y, 15, 0, TAU); ctx.fill(); ctx.fillStyle = '#566b68'; ctx.font = '900 20px system-ui'; ctx.textAlign = 'center'; ctx.fillText(i + 1, t.x, t.y + 7); } });
          ctx.setLineDash([3, 8]); ctx.strokeStyle = '#48737a88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ORIGIN.x, ORIGIN.y); ctx.lineTo(ORIGIN.x + Math.cos(angle) * 115, ORIGIN.y + Math.sin(angle) * 115); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = boomerang && boomerang.returning ? '#f9df9a' : '#d1c7a555'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ORIGIN.x, ORIGIN.y, 74, 0, TAU); ctx.stroke();
          ctx.fillStyle = '#537a78'; ctx.beginPath(); ctx.roundRect(ORIGIN.x - 14, ORIGIN.y + 7, 28, 47, 8); ctx.fill(); ctx.fillStyle = '#e3bc91'; ctx.beginPath(); ctx.arc(ORIGIN.x, ORIGIN.y - 4, 15, 0, TAU); ctx.fill();
          const b = boomerang || { x: ORIGIN.x + 20, y: ORIGIN.y - 4 }; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(boomerang ? clock * 19 : -.7); ctx.strokeStyle = '#98623f'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-17, 12); ctx.lineTo(0, -9); ctx.lineTo(19, 9); ctx.stroke(); ctx.strokeStyle = '#edca88'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
          ctx.fillStyle = '#507877'; ctx.textAlign = 'center'; ctx.font = '800 18px system-ui'; ctx.fillText('FOLLOW THE WHOLE CURVE.', 480, 35); if (boomerang && boomerang.returning) { ctx.fillStyle = '#e4e9d3'; ctx.font = '800 17px system-ui'; ctx.fillText('CATCH WHEN IT REACHES YOUR RING', 610, 552); } ctx.restore();
        },
        inspect() { return { angle, round, targets: targets.map(t => ({ ...t })), targetIndex, boomerang: boomerang && { ...boomerang }, score, time, catches, streak, hits, throws, ended }; }
      };
    }
  });
})();
