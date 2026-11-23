(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'lava-lift', title: 'Lava Lift', category: 'Vertical platformer', accent: '#fb923c',
    description: 'Keep climbing. There is a bright little exit above the rising lava.',
    howTo: ['Climb 2,200 metres of the old tower before the rising lava catches you. Each sun shard adds 100 points.', 'Move with A/D or arrows. Space / Up jumps. Hold Jump to bounce on landing, or tap again in the air for a second jump.', 'Gold platforms spring you higher. Cracked platforms fall after a short landing. Follow the alternating ledges and keep looking one jump ahead.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'jump', label: 'Jump ↑', keys: ['Space', 'ArrowUp', 'KeyW'] }], medals: [800, 2200, 4200],
    create(api) {
      const player = { x: 450, y: 484, vy: 0, grounded: true, jumps: 0, spring: false };
      const platforms = [{ x: 190, y: 520, w: 580, kind: 'solid', breakTime: -1 }], shards = [];
      let previousX = 450, y = 520;
      for (let i = 1; i <= 29; i++) { y -= 75 + api.random() * 25; previousX = clamp(previousX + (api.random() - 0.5) * 350, 115, 695); platforms.push({ x: previousX, y, w: 145 + api.random() * 40, kind: i % 7 === 0 ? 'spring' : i % 5 === 0 ? 'crack' : 'solid', breakTime: -1 }); if (i % 2) shards.push({ x: previousX + 75, y: y - 24, taken: false }); }
      let clock = 0, lava = 590, camera = 0, height = 0, gems = 0, score = 0, ended = false;
      function finish(won) { ended = true; if (won) score += 900 + Math.max(0, 700 - Math.floor(clock * 5)); api.score(score); api.end({ score, title: won ? 'A breath of fresh air.' : 'Another way up awaits.', message: won ? 'You found the top of the tower. Try gathering every sun shard on the climb.' : 'A second jump gives you time to correct your landing. Leave the cracked platforms quickly.', stats: [{ label: 'Height', value: Math.floor(height) + ' m' }, { label: 'Sun shards', value: gems }, { label: 'Climb time', value: Math.floor(clock) + 's' }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Height', value: Math.floor(height) + ' / 2200 m' }, { label: 'Shards', value: gems }, { label: 'Lava gap', value: Math.max(0, Math.floor(lava - player.y - 36)) + ' m' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; clock += dt; if (clock > 3) lava -= Math.min(39, 20 + clock * 0.17) * dt;
          const direction = Number(api.input.down('right')) - Number(api.input.down('left')); player.x = clamp(player.x + direction * 295 * dt, 65, 861);
          if ((api.input.pressed('jump') && player.jumps < 2) || api.input.down('jump') && player.grounded) { player.vy = player.spring ? -730 : player.jumps === 0 ? -560 : -530; player.jumps++; player.grounded = false; player.spring = false; api.sound('good', player.jumps === 1 ? 0.8 : 1.1); }
          const oldBottom = player.y + 36; player.vy += 1200 * dt; player.y += player.vy * dt; player.grounded = false;
          if (player.vy >= 0) for (const p of platforms) {
            if (p.breakTime === 0 || oldBottom > p.y + 1 || player.y + 36 < p.y || player.x + 34 < p.x || player.x > p.x + p.w) continue;
            player.y = p.y - 36; player.vy = 0; player.grounded = true; player.jumps = 0; player.spring = p.kind === 'spring'; if (p.kind === 'crack' && p.breakTime < 0) p.breakTime = 0.5; break;
          }
          for (const p of platforms) if (p.breakTime > 0) p.breakTime = Math.max(0, p.breakTime - dt);
          for (const s of shards) if (!s.taken && Math.hypot(player.x + 17 - s.x, player.y + 18 - s.y) < 30) { s.taken = true; gems++; api.burst(s.x, s.y - camera, '#fde68a', 9); api.sound('good', 1.5); }
          height = Math.max(height, 484 - player.y); score = Math.floor(height) + gems * 100; camera = Math.min(camera, player.y - 270);
          if (player.y + 34 >= lava) { finish(false); return; } if (height >= 2200) { finish(true); return; } ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#211f3b'); g.addColorStop(1, '#553238'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#171a2b'; ctx.fillRect(0, 0, 52, 600); ctx.fillRect(908, 0, 52, 600); ctx.strokeStyle = '#86708733'; ctx.lineWidth = 1;
          for (let yy = Math.floor(camera / 80) * 80; yy < camera + 680; yy += 80) { const sy = yy - camera; ctx.beginPath(); ctx.moveTo(54, sy); ctx.lineTo(906, sy); ctx.stroke(); for (let xx = 80 + (Math.floor(yy / 80) % 2 ? 80 : 0); xx < 900; xx += 160) { ctx.beginPath(); ctx.moveTo(xx, sy); ctx.lineTo(xx, sy + 80); ctx.stroke(); } }
          platforms.forEach(p => { const sy = p.y - camera; if (sy < -30 || sy > 640 || p.breakTime === 0) return; ctx.fillStyle = p.kind === 'spring' ? '#e9b960' : p.kind === 'crack' ? '#bc7e75' : '#7f9d9b'; ctx.beginPath(); ctx.roundRect(p.x, sy, p.w, 16, 5); ctx.fill(); ctx.fillStyle = '#e5dfbd66'; ctx.fillRect(p.x + 5, sy + 2, p.w - 10, 3); if (p.kind === 'crack') { ctx.strokeStyle = '#694c59'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, sy); ctx.lineTo(p.x + p.w / 2 - 12, sy + 9); ctx.lineTo(p.x + p.w / 2 + 7, sy + 16); ctx.stroke(); } });
          shards.forEach(s => { if (s.taken || s.y - camera < -30 || s.y - camera > 630) return; ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.moveTo(s.x, s.y - camera - 12); ctx.lineTo(s.x + 8, s.y - camera); ctx.lineTo(s.x, s.y - camera + 12); ctx.lineTo(s.x - 8, s.y - camera); ctx.fill(); });
          const py = player.y - camera; ctx.fillStyle = '#fbd3a7'; ctx.beginPath(); ctx.roundRect(player.x, py, 34, 36, 10); ctx.fill(); ctx.fillStyle = '#51415b'; ctx.fillRect(player.x + 6, py + 11, 6, 5); ctx.fillRect(player.x + 22, py + 11, 6, 5); ctx.fillStyle = '#ef886e'; ctx.fillRect(player.x - 4, py + 25, 42, 7);
          const ly = clamp(lava - camera, -30, 630); if (ly < 600) { ctx.fillStyle = '#eb704d'; ctx.fillRect(0, ly, 960, 630 - ly); ctx.fillStyle = '#f6ba62'; ctx.beginPath(); ctx.moveTo(0, ly + 15); for (let x = 0; x <= 960; x += 20) ctx.lineTo(x, ly + Math.sin(x / 53 + api.time * 2) * 7); ctx.lineTo(960, ly + 22); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = '#f6dfba'; ctx.textAlign = 'center'; ctx.font = '800 14px system-ui'; ctx.fillText('KEEP A LITTLE SKY ABOVE YOU', 480, 30); ctx.restore();
        },
        inspect() { return { player: { ...player }, platforms: platforms.map(p => ({ ...p })), shards: shards.map(s => ({ ...s })), clock, lava, camera, height, gems, score, ended }; }
      };
    }
  });
})();
