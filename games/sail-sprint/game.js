/* Sail Sprint: a wind-driven buoy course where heading and tacking control speed. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  Arcade.mount({
    id: 'sail-sprint', title: 'Sail Sprint', category: 'Sailing', accent: '#ace6d2',
    description: 'Six buoys and a restless breeze. Read the water, tack cleanly, bring it home.',
    howTo: ['Round the six numbered buoys in order before the 120-second clock expires. Stay clear of islands and the edge of the chart.', 'Left / Right turns the boat. Space / Tack switches to the opposite close-hauled heading. Hold Down / Reef to slow for a precise turn. You can also drag toward a heading.', 'You cannot sail straight into the wind. Zigzag across it with tacks. Reaching across the wind is fastest; the sail trims automatically.'],
    controls: [{ id: 'left', label: '← Rudder', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Rudder →', keys: ['ArrowRight', 'KeyD'] }, { id: 'tack', label: 'Tack', keys: ['Space', 'KeyT'] }, { id: 'reef', label: 'Reef', keys: ['ArrowDown', 'KeyS'] }],
    medals: [1600, 4200, 6500],
    create(api) {
      const buoys = [{ x: 778, y: 445 }, { x: 790, y: 130 }, { x: 490, y: 93 }, { x: 197, y: 164 }, { x: 153, y: 451 }, { x: 475, y: 467 }];
      const islands = [{ x: 460, y: 292, r: 77 }, { x: 671, y: 315, r: 34 }, { x: 290, y: 327, r: 28 }];
      let x = 204, y = 452, heading = 0, speed = 55, next = 0, time = 120, clock = 0, score = 0, bumps = 0, tacks = 0, inv = 0, ended = false, sailMode = 'Reaching';
      const baseWind = -2.0 + (api.random() - 0.5) * 0.2; let wind = baseWind; const wakes = [];
      function hud() { api.score(score); api.hud([{ label: 'Buoys', value: next + ' / 6' }, { label: 'Time', value: Math.ceil(time) + 's' }, { label: 'Speed', value: (speed / 10).toFixed(1) + ' kn' }, { label: 'Sail', value: sailMode }]); }
      function finish(won) { ended = true; if (won) score += 1000 + Math.round(time * 15); api.end({ score, title: won ? 'A beautiful line home.' : 'The breeze will be back.', message: next + ' of 6 buoys rounded. ' + (won ? 'Good sailing is a conversation with the wind.' : 'Stay out of the no-go angle. Tack across the wind to make progress up the course.'), stats: [{ label: 'Buoys', value: next + ' / 6' }, { label: 'Time left', value: Math.ceil(time) + 's' }, { label: 'Tacks', value: tacks }, { label: 'Groundings', value: bumps }] }); }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; time = Math.max(0, time - dt); inv = Math.max(0, inv - dt); wind = baseWind + Math.sin(clock * 0.045) * 0.16;
          const input = api.input, reef = input.down('reef'), turn = Number(input.down('right')) - Number(input.down('left'));
          heading += turn * (reef ? 2.5 : 1.75) * dt;
          if (!turn && input.pointer.down && input.pointer.inside) heading += clamp(wrap(Math.atan2(input.pointer.y - y, input.pointer.x - x) - heading), -2 * dt, 2 * dt);
          if (input.pressed('tack')) { heading = wind + (wrap(heading - wind) > 0 ? -0.82 : 0.82); speed *= 0.68; tacks++; api.sound('click', 1.2); }
          heading = wrap(heading); const angle = Math.abs(wrap(heading - wind));
          sailMode = angle < 0.58 ? 'In irons' : angle < 1.0 ? 'Close haul' : angle < 2.2 ? 'Reaching' : 'Running';
          let target = angle < 0.58 ? 12 : 48 + Math.sin(angle) * 92; if (reef) target *= 0.5;
          speed += (target - speed) * Math.min(1, dt * 1.2); x += Math.cos(heading) * speed * dt; y += Math.sin(heading) * speed * dt;
          for (const island of islands) { const dx = x - island.x, dy = y - island.y, d = Math.hypot(dx, dy), minimum = island.r + 16; if (d < minimum) { const nx = d > 0 ? dx / d : 1, ny = d > 0 ? dy / d : 0; x = island.x + nx * minimum; y = island.y + ny * minimum; speed *= 0.35; if (inv <= 0) { bumps++; time = Math.max(0, time - 3); inv = 1.5; api.sound('bad'); api.toast('Shallow water. −3 seconds.'); } } }
          if (x < 43 || x > 917 || y < 62 || y > 541) { x = clamp(x, 43, 917); y = clamp(y, 62, 541); speed *= 0.6; if (inv <= 0) { time = Math.max(0, time - 2); inv = 1.3; api.toast('Stay inside the chart. Turn back.'); } }
          const buoy = buoys[next]; if (Math.hypot(x - buoy.x, y - buoy.y) < 39) { next++; score += 500 + Math.round(time * 4); api.burst(buoy.x, buoy.y, '#fff2c2', 18); api.sound('good'); if (next === buoys.length) { finish(true); return; } api.toast('Buoy ' + next + ' rounded. Find ' + (next + 1) + '.'); }
          if (!api.reducedMotion) { wakes.push({ x, y, life: 1.6 }); for (const wake of wakes) wake.life -= dt; while (wakes.length && wakes[0].life <= 0) wakes.shift(); }
          if (time <= 0) { finish(false); return; } hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#387b86'; c.fillRect(0, 0, 960, 600); c.strokeStyle = '#87c4c322'; c.lineWidth = 1; for (let yy = 92; yy < 580; yy += 32) { c.beginPath(); for (let xx = 0; xx <= 960; xx += 16) { const dy = Math.sin(xx * 0.02 + clock * 0.7 + yy) * 4; xx ? c.lineTo(xx, yy + dy) : c.moveTo(xx, yy + dy); } c.stroke(); }
          c.strokeStyle = '#b9ddd85a'; c.setLineDash([4, 11]); c.lineWidth = 2; c.beginPath(); buoys.forEach((b, i) => i ? c.lineTo(b.x, b.y) : c.moveTo(b.x, b.y)); c.stroke(); c.setLineDash([]);
          islands.forEach(island => { c.fillStyle = '#6eaba4'; c.beginPath(); c.arc(island.x, island.y, island.r + 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#e0c38e'; c.beginPath(); c.arc(island.x, island.y, island.r, 0, Math.PI * 2); c.fill(); c.fillStyle = '#7d9e70'; c.beginPath(); c.arc(island.x - 5, island.y - 6, island.r * 0.76, 0, Math.PI * 2); c.fill(); c.fillStyle = '#5c8866'; c.beginPath(); c.arc(island.x - 12, island.y - 13, island.r * 0.48, 0, Math.PI * 2); c.fill(); });
          buoys.forEach((b, i) => { if (i === next) { c.strokeStyle = '#f9e9b8'; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y, 38 + Math.sin(clock * 3) * 2, 0, Math.PI * 2); c.stroke(); } c.fillStyle = i < next ? '#a6c9b5' : '#eab88d'; c.beginPath(); c.arc(b.x, b.y, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = '#426c6e'; c.textAlign = 'center'; c.font = '900 14px system-ui'; c.fillText(i + 1, b.x, b.y + 5); });
          wakes.forEach(w => { c.globalAlpha = w.life * 0.18; c.strokeStyle = '#d1ebe1'; c.lineWidth = 3; c.beginPath(); c.arc(w.x, w.y, 5 + (1.6 - w.life) * 7, 0, Math.PI * 2); c.stroke(); }); c.globalAlpha = 1;
          c.save(); c.translate(x, y); c.rotate(heading); c.fillStyle = '#224c5c55'; c.beginPath(); c.ellipse(3, 3, 26, 12, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#eadcb6'; c.beginPath(); c.moveTo(28, 0); c.quadraticCurveTo(-6, -16, -23, -10); c.lineTo(-23, 10); c.quadraticCurveTo(-6, 16, 28, 0); c.fill(); c.fillStyle = '#c18467'; c.fillRect(-17, -6, 24, 12); const side = wrap(wind - heading) > 0 ? -1 : 1; c.fillStyle = '#fff4cf'; c.beginPath(); c.moveTo(15, 0); c.quadraticCurveTo(-3, side * 35, -15, side * 28); c.lineTo(-11, 0); c.fill(); c.strokeStyle = '#4e5c55'; c.lineWidth = 2; c.beginPath(); c.moveTo(-16, 0); c.lineTo(18, 0); c.stroke(); c.restore();
          c.fillStyle = '#1d4d5ce8'; c.fillRect(24, 20, 270, 61); c.fillStyle = '#e1efda'; c.textAlign = 'left'; c.font = '900 25px Georgia,serif'; c.fillText('Sail Sprint', 42, 49); c.font = '12px system-ui'; c.fillText('SIX BUOYS. FOLLOW THE BREEZE.', 43, 69);
          c.save(); c.translate(886, 99); c.strokeStyle = '#d1e3ce'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 35, 0, Math.PI * 2); c.stroke(); c.rotate(wind); c.fillStyle = '#f1d89c'; c.beginPath(); c.moveTo(27, 0); c.lineTo(-15, -9); c.lineTo(-9, 0); c.lineTo(-15, 9); c.fill(); c.restore(); c.textAlign = 'center'; c.fillStyle = '#d6e7d8'; c.font = 'bold 12px system-ui'; c.fillText('WIND FROM', 886, 152);
          c.fillStyle = sailMode === 'In irons' ? '#f5c49d' : '#d3e9d7'; c.font = 'bold 16px system-ui'; c.fillText(sailMode === 'In irons' ? 'INTO THE WIND. TACK TO FIND SPEED.' : 'NEXT: BUOY ' + (Math.min(next, 5) + 1) + '  ·  ' + sailMode.toUpperCase(), 480, 578); c.restore();
        },
        inspect() { return { x, y, heading, speed, next, time, clock, score, bumps, tacks, wind, sailMode, target: { ...buoys[Math.min(next, 5)] }, islands: islands.map(i => ({ ...i })), ended }; }
      };
    }
  });
})();
