(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'tunnel-dash', title: 'Tunnel Dash', category: 'Reflex lanes', accent: '#a78bfa',
    description: 'Read the opening. Change your lane. Stay one gate ahead.',
    howTo: ['Cross 45 tunnel gates. Only the glowing lane is open. Three collisions end the run.', 'Tap Left / Right or use A/D to move one lane. Space activates a short phase shield, then needs seven seconds to recharge.', 'Move early enough to finish the lane change before a gate reaches you. Consecutive clean passes grow your bonus.'],
    controls: [{ id: 'left', label: '← Lane', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Lane →', keys: ['ArrowRight', 'KeyD'] }, { id: 'phase', label: 'Phase', keys: ['Space'] }], medals: [1200, 3200, 6000],
    create(api) {
      let lane = 1, position = 1, gates = [{ depth: 1.2, safe: 1 }], spawn = 1.45, passed = 0, lives = 3, score = 0, chain = 0, bestChain = 0, phase = 0, cooldown = 0, ended = false, clock = 0;
      function finish(won) { ended = true; if (won) score += 800 + lives * 300; api.score(score); api.end({ score, title: won ? 'You found the flow.' : 'An opening is always coming.', message: won ? 'Forty-five gates, one uninterrupted route. Can you finish with the shield still unused?' : 'Watch the nearest opening, turn before it reaches you, and save Phase for a late read.', stats: [{ label: 'Gates', value: passed + ' / 45' }, { label: 'Best streak', value: bestChain }, { label: 'Hull', value: lives }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Gates', value: passed + ' / 45' }, { label: 'Hull', value: lives }, { label: 'Streak', value: chain }, { label: 'Phase', value: cooldown > 0 ? cooldown.toFixed(1) + 's' : 'Ready' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; clock += dt;
          if (api.input.pressed('left')) lane = Math.max(0, lane - 1); if (api.input.pressed('right')) lane = Math.min(2, lane + 1);
          position += clamp(lane - position, -6.5 * dt, 6.5 * dt);
          phase = Math.max(0, phase - dt); cooldown = Math.max(0, cooldown - dt);
          if (api.input.pressed('phase') && cooldown <= 0) { phase = 0.85; cooldown = 7; api.sound('good'); }
          const speed = 0.34 + Math.min(0.1, passed * 0.0025); spawn -= dt;
          if (spawn <= 0) { gates.push({ depth: 1.15, safe: Math.floor(api.random() * 3) }); spawn += Math.max(0.95, 1.45 - passed * 0.011); }
          for (let i = gates.length - 1; i >= 0; i--) {
            const g = gates[i]; g.depth -= speed * dt;
            if (g.depth <= 0) {
              gates.splice(i, 1); passed++;
              if (Math.abs(position - g.safe) < 0.3) { chain++; bestChain = Math.max(bestChain, chain); score += 100 + Math.min(60, chain * 4); api.sound('click', 0.9 + chain * 0.01); }
              else if (phase > 0) { chain = 0; score += 45; api.toast('Phased through'); }
              else { chain = 0; lives--; api.shake(6); api.sound('bad'); }
              if (!lives) { finish(false); return; } if (passed >= 45) { finish(true); return; }
            }
          }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#0c1023'; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#151c37'; ctx.beginPath(); ctx.moveTo(360, 110); ctx.lineTo(600, 110); ctx.lineTo(940, 600); ctx.lineTo(20, 600); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#a78bfa44'; ctx.lineWidth = 2;
          for (const x of [20, 320, 640, 940]) { ctx.beginPath(); ctx.moveTo(480 + (x - 480) * 0.2, 110); ctx.lineTo(x, 600); ctx.stroke(); }
          for (let i = 0; i < 10; i++) { const d = ((i / 10 + clock * 0.15) % 1), y = 110 + d * d * 490, half = 120 + d * 340; ctx.strokeStyle = '#8173bd22'; ctx.beginPath(); ctx.moveTo(480 - half, y); ctx.lineTo(480 + half, y); ctx.stroke(); }
          gates.slice().sort((a, b) => b.depth - a.depth).forEach(g => {
            const d = clamp(g.depth, 0, 1), scale = 0.22 + (1 - d) * 0.78, y = 130 + (1 - d) ** 2 * 390;
            for (let i = 0; i < 3; i++) { const x = 480 + (i - 1) * 190 * scale, w = 174 * scale, h = 78 * scale; ctx.fillStyle = i === g.safe ? '#67e8f920' : '#c45378cc'; ctx.strokeStyle = i === g.safe ? '#67e8f9' : '#fc90af'; ctx.lineWidth = Math.max(2, scale * 4); ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h); ctx.font = '900 ' + Math.max(12, 30 * scale) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = i === g.safe ? '#b5ffff' : '#471832'; ctx.fillText(i === g.safe ? '↓' : '×', x, y - h * 0.35); }
          });
          const x = 480 + (position - 1) * 190; ctx.fillStyle = '#c4b5fd'; ctx.beginPath(); ctx.moveTo(x, 487); ctx.lineTo(x - 28, 543); ctx.lineTo(x, 532); ctx.lineTo(x + 28, 543); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#67e8f9'; ctx.fillRect(x - 6, 536, 12, 25);
          if (phase > 0) { ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, 521, 43, 0, Math.PI * 2); ctx.stroke(); }
          const next = gates[0]; ctx.fillStyle = '#c4b5fd'; ctx.font = '800 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('THE NEXT OPENING', 480, 35); ctx.font = '900 25px system-ui'; ctx.fillStyle = '#a5f3fc'; ctx.fillText(next ? ['LEFT', 'CENTER', 'RIGHT'][next.safe] : 'KEEP YOUR FLOW', 480, 69); ctx.restore();
        },
        inspect() { return { lane, position, gates: gates.map(g => ({ ...g })), passed, lives, score, chain, bestChain, phase, cooldown, clock, ended }; }
      };
    }
  });
})();
