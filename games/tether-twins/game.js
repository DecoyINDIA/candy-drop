(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), TAU = Math.PI * 2;
  Arcade.mount({
    id: 'tether-twins', title: 'Tether Twins', category: 'Linked-body navigation', accent: '#a5b4fc',
    description: 'Two little worlds. One careful way through.',
    howTo: ['Guide both linked bodies through 24 gates. Some have one wide opening; others have two small openings. You have three shared shields.', 'Up / Down moves the pair. Left / Right rotates the tether. Both bodies must fit; the thin tether can pass through a wall.', 'Turn sideways for one opening and upright for the split openings. The ghost circles on each gate show a safe alignment. Move and rotate while the gate is still far away.'],
    controls: [{ id: 'left', label: 'Rotate ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'up', label: 'Move ↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: 'Move ↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'right', label: 'Rotate ↷', keys: ['ArrowRight', 'KeyD'] }], medals: [800, 2000, 3500],
    create(api) {
      const pair = { x: 220, y: 300, angle: 0, radius: 52 }; let gates = [], lastCenter = 300, passed = 0, score = 0, shields = 3, invincible = 0, clean = 0, clock = 0, ended = false;
      function gate(x, first) { lastCenter = clamp(lastCenter + (api.random() - .5) * 150, 170, 430); return { x, center: lastCenter, split: first ? false : api.random() < .55, counted: false, touched: false }; }
      gates.push(gate(980, true), gate(1400), gate(1820));
      const bodies = () => [-1, 1].map(side => ({ x: pair.x + Math.cos(pair.angle) * pair.radius * side, y: pair.y + Math.sin(pair.angle) * pair.radius * side }));
      const fits = (y, g) => g.split ? Math.abs(y - (g.center - 52)) <= 15 || Math.abs(y - (g.center + 52)) <= 15 : Math.abs(y - g.center) <= 29;
      function finish(won) { if (ended) return; ended = true; if (won) score += 700 + shields * 220; api.score(score); api.end({ score, title: won ? 'A beautiful way together.' : 'One more turn together.', message: won ? 'Both bodies through every gate. A clear view of the next opening keeps the pair in rhythm.' : 'The tether may cross a wall, but the two bodies must find open space. Align early and make small adjustments.', stats: [{ label: 'Gates', value: passed + ' / 24' }, { label: 'Clean gates', value: clean }, { label: 'Shields', value: shields }] }); }
      function ui() { const next = gates.find(g => !g.counted); api.score(score); api.hud([{ label: 'Gates', value: passed + ' / 24' }, { label: 'Shields', value: shields }, { label: 'Next opening', value: next && next.split ? 'Split ↕' : 'Wide ↔' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; clock += dt; invincible = Math.max(0, invincible - dt); pair.angle += (Number(api.input.down('right')) - Number(api.input.down('left'))) * 2.8 * dt; pair.y = clamp(pair.y + (Number(api.input.down('down')) - Number(api.input.down('up'))) * 230 * dt, 112, 488);
          const speed = 180 + Math.min(30, passed * 1.5), points = bodies();
          for (const g of gates) {
            g.x -= speed * dt;
            if (invincible <= 0 && points.some(p => p.x + 11 > g.x && p.x - 11 < g.x + 36 && !fits(p.y, g))) { shields--; g.touched = true; invincible = 1.7; api.shake(4); api.sound('bad'); if (!shields) { finish(false); return; } pair.y = g.center; pair.angle = g.split ? Math.PI / 2 : 0; }
            if (!g.counted && g.x + 36 < pair.x - pair.radius - 12) { g.counted = true; passed++; score += 110; if (!g.touched) { clean++; score += 35; } api.sound('good'); if (passed >= 24) { finish(true); return; } }
          }
          if (gates[0].x < -60) { gates.shift(); gates.push(gate(gates[gates.length - 1].x + 420)); }
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 960, 600); g.addColorStop(0, '#1b2942'); g.addColorStop(1, '#3f3655'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600); ctx.strokeStyle = '#b7bded15'; ctx.lineWidth = 1; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(480, 300, 40 + i * 42, 0, TAU); ctx.stroke(); }
          gates.forEach(gate => { const holes = gate.split ? [[gate.center - 78, gate.center - 26], [gate.center + 26, gate.center + 78]] : [[gate.center - 40, gate.center + 40]]; let from = 65; ctx.fillStyle = '#85769c'; for (const [a, b] of holes) { ctx.fillRect(gate.x, from, 36, Math.max(0, a - from)); from = b; } ctx.fillRect(gate.x, from, 36, Math.max(0, 535 - from)); ctx.fillStyle = '#b4a8c6'; for (const [a, b] of holes) { ctx.fillRect(gate.x, a - 4, 36, 4); ctx.fillRect(gate.x, b, 36, 4); } ctx.strokeStyle = '#a6dcd280'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); for (const y of gate.split ? [gate.center - 52, gate.center + 52] : [gate.center]) { ctx.beginPath(); ctx.arc(gate.x + 18, y, 11, 0, TAU); ctx.stroke(); } ctx.setLineDash([]); });
          const points = bodies(); ctx.globalAlpha = invincible > 0 ? .6 : 1; ctx.strokeStyle = '#a6d9d4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke(); ctx.strokeStyle = '#b4bbdc44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(pair.x, pair.y, pair.radius, 0, TAU); ctx.stroke(); points.forEach((p, i) => { ctx.fillStyle = i ? '#d3b2e8' : '#f0c18f'; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff77'; ctx.beginPath(); ctx.arc(p.x - 3, p.y - 3, 3, 0, TAU); ctx.fill(); }); ctx.globalAlpha = 1;
          ctx.fillStyle = '#101f35'; ctx.fillRect(0, 0, 960, 60); ctx.fillRect(0, 540, 960, 60); ctx.fillStyle = '#bfc5df'; ctx.textAlign = 'center'; ctx.font = '800 16px system-ui'; ctx.fillText('TWO WORLDS. ONE WAY THROUGH.', 480, 35); ctx.font = '700 14px system-ui'; ctx.fillText('MOVE THE CENTER · ROTATE THE PAIR', 480, 576); ctx.restore();
        },
        inspect() { return { pair: { ...pair }, bodies: bodies(), gates: gates.map(g => ({ ...g })), passed, score, shields, invincible, clean, clock, ended }; }
      };
    }
  });
})();
