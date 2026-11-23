(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), colors = ['#f5b75b', '#e48776', '#aac66f', '#bf99c2'];
  function segmentDistance(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - ax - dx * t, py - ay - dy * t); }
  Arcade.mount({
    id: 'blade-bloom', title: 'Blade Bloom', category: 'Fruit slicing', accent: '#fda4af',
    description: 'A bright harvest in the air. Make every little sweep count.',
    howTo: ['Slice flying fruit during a 75-second harvest. Avoid dark thorn bombs. A bomb costs one heart; three missed fruit cost one heart. You have five.', 'Hold and drag through the playfield to slice. With a keyboard, move the blade with arrows / WASD and hold Space to cut.', 'Several fruit in one quick sweep build a combo. Let a risky cluster pass if a thorn bomb is hiding inside it.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'slice', label: 'Slice', keys: ['Space'] }], medals: [500, 1500, 3500],
    create(api) {
      let fruit = [], trail = [], cursor = { x: 480, y: 300 }, last = null, active = false, spawn = 0.5, batches = 0, score = 0, hp = 5, missed = 0, sliced = 0, chain = 0, bestChain = 0, chainTime = 0, time = 75, ended = false;
      function finish(won) { if (ended) return; ended = true; if (won) score += hp * 120; api.score(score); api.end({ score, title: won ? 'A colorful little harvest.' : 'The orchard will bloom again.', message: won ? 'A full harvest in the bag. Cleaner sweeps and longer combos will lift your next score.' : 'Read the whole cluster before you cut. Three missed fruit are safer than rushing through a thorn bomb.', stats: [{ label: 'Fruit sliced', value: sliced }, { label: 'Best combo', value: bestChain }, { label: 'Hearts', value: hp }] }); }
      function damage() { hp--; chain = 0; chainTime = 0; api.shake(5); api.sound('bad'); if (!hp) finish(false); }
      function ui() { api.score(score); api.hud([{ label: 'Harvest', value: Math.ceil(time) + 's' }, { label: 'Hearts', value: hp }, { label: 'Misses', value: missed + ' / 3' }, { label: 'Combo', value: chain }] ); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(true); return; } chainTime = Math.max(0, chainTime - dt); if (!chainTime) chain = 0;
          const pointer = api.input.pointer, dx = Number(api.input.down('right')) - Number(api.input.down('left')), dy = Number(api.input.down('down')) - Number(api.input.down('up'));
          const previous = { x: cursor.x, y: cursor.y };
          if (pointer.down && pointer.inside) { cursor.x = pointer.x; cursor.y = pointer.y; }
          else { const len = Math.hypot(dx, dy) || 1; cursor.x = clamp(cursor.x + dx / len * 475 * dt, 35, 925); cursor.y = clamp(cursor.y + dy / len * 475 * dt, 55, 555); }
          active = pointer.down && pointer.inside || api.input.down('slice');
          const start = last || (pointer.pressed ? { ...cursor } : previous);
          if (active) { trail.push({ x: cursor.x, y: cursor.y, life: 0.2 }); last = { ...cursor }; } else last = null;
          trail = trail.filter(p => p.life > 0).slice(-18); trail.forEach(p => { p.life -= dt; });
          spawn -= dt;
          if (spawn <= 0 && fruit.length < 14) {
            const count = 2 + (batches % 3 === 2 ? 1 : 0);
            for (let i = 0; i < count; i++) { const bomb = batches > 1 && i === count - 1 && api.random() < 0.42; fruit.push({ x: batches === 0 && i === 0 ? 480 : 180 + api.random() * 600, y: 640 + i * 15, vx: (api.random() - 0.5) * 135, vy: -570 - api.random() * 110, r: bomb ? 23 : 25, color: Math.floor(api.random() * colors.length), bomb, rotation: api.random() * 6.28, spin: (api.random() - 0.5) * 4 }); }
            batches++; spawn += Math.max(0.75, 1.55 - (75 - time) * 0.007);
          }
          for (let i = fruit.length - 1; i >= 0; i--) {
            const f = fruit[i]; f.vy += 510 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rotation += f.spin * dt;
            if (active && segmentDistance(f.x, f.y, start.x, start.y, cursor.x, cursor.y) <= f.r + 4) {
              fruit.splice(i, 1);
              if (f.bomb) { api.burst(f.x, f.y, '#4b3b4d', 18); damage(); if (ended) return; }
              else { sliced++; chain = chainTime > 0 ? chain + 1 : 1; bestChain = Math.max(bestChain, chain); chainTime = 0.35; score += 35 + Math.min(7, chain - 1) * 15; api.burst(f.x, f.y, colors[f.color], 14); api.sound('good', 0.9 + Math.min(chain, 6) * 0.1); }
            } else if (f.y > 700 && f.vy > 0 || f.x < -60 || f.x > 1020) { fruit.splice(i, 1); if (!f.bomb) { missed++; if (missed >= 3) { missed = 0; damage(); if (ended) return; } } }
          }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#f1e4d7'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#e1d4bd'; ctx.beginPath(); ctx.ellipse(240, 630, 440, 220, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c6cbb0'; ctx.beginPath(); ctx.ellipse(820, 630, 440, 170, 0, 0, Math.PI * 2); ctx.fill();
          for (let i = 0; i < 10; i++) { ctx.fillStyle = '#d5c2b044'; ctx.beginPath(); ctx.arc(70 + i * 103, 110 + i * 73 % 330, 3 + i % 3 * 2, 0, Math.PI * 2); ctx.fill(); }
          fruit.forEach(f => { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rotation); ctx.fillStyle = f.bomb ? '#403446' : colors[f.color]; ctx.beginPath(); ctx.arc(0, 0, f.r, 0, Math.PI * 2); ctx.fill(); if (f.bomb) { ctx.strokeStyle = '#403446'; ctx.lineWidth = 6; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); ctx.lineTo(Math.cos(a) * 31, Math.sin(a) * 31); ctx.stroke(); } ctx.fillStyle = '#f5d6c0'; ctx.font = '900 24px system-ui'; ctx.textAlign = 'center'; ctx.fillText('!', 0, 9); } else { ctx.fillStyle = '#fff8e666'; ctx.beginPath(); ctx.ellipse(-7, -9, 6, 9, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6a8554'; ctx.beginPath(); ctx.ellipse(7, -26, 11, 5, -0.5, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); });
          if (trail.length > 1) { ctx.strokeStyle = '#fffdf3'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
          ctx.strokeStyle = active ? '#a56066' : '#8b9781'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cursor.x, cursor.y, active ? 10 : 15, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cursor.x - 20, cursor.y); ctx.lineTo(cursor.x - 8, cursor.y); ctx.moveTo(cursor.x + 8, cursor.y); ctx.lineTo(cursor.x + 20, cursor.y); ctx.stroke();
          ctx.fillStyle = '#806e67'; ctx.font = '800 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('A BRIGHT LITTLE HARVEST', 480, 35); if (chain > 1) { ctx.fillStyle = '#a56066'; ctx.font = '900 28px system-ui'; ctx.fillText(chain + ' FRUIT COMBO', 480, 82); } ctx.restore();
        },
        cancelInput() { last = null; active = false; trail = []; },
        inspect() { return { fruit: fruit.map(f => ({ ...f })), cursor: { ...cursor }, active, batches, score, hp, missed, sliced, chain, bestChain, time, ended }; }
      };
    }
  });
})();
