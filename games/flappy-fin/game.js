(function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'flappy-fin', title: 'Flappy Fin', category: 'One-button flight', accent: '#7dd3fc',
    description: 'A tiny fin, a gentle current, and twenty-four gaps to glide through.',
    howTo: ['Swim through 24 coral gates. You have three hearts. Touching a gate, the surface, or the seabed costs a heart.', 'Tap the playfield, press Space / Up, or use Swim to rise. Release and let gravity carry you down.', 'Pass close to the center of a gap for a precision bonus. Short, evenly spaced taps give you the most control.'],
    controls: [{ id: 'flap', label: 'Swim ↑', keys: ['Space', 'ArrowUp', 'KeyW'] }], medals: [700, 1900, 3600],
    create(api) {
      const fish = { x: 238, y: 300, vy: 0 }; let gates = [], passed = 0, lives = 3, score = 0, invincible = 0, cooldown = 0, grace = 1.5, ended = false, perfect = 0, scroll = 0;
      let lastCenter = 300;
      function gate(x) { lastCenter = clamp(lastCenter + (api.random() - 0.5) * 155, 180, 420); return { x, center: lastCenter, gap: Math.max(150, 194 - passed * 1.7), counted: false }; }
      gates.push(gate(960), gate(1340), gate(1720));
      function finish(won) { if (ended) return; ended = true; if (won) score += 700 + lives * 220; api.score(score); api.end({ score, title: won ? 'A lovely little crossing.' : 'Catch the next current.', message: won ? 'All twenty-four gates behind you. Find more centered passes on your next swim.' : 'Tap before you feel too low. A steady rhythm beats holding your breath until the last second.', stats: [{ label: 'Gates', value: passed + ' / 24' }, { label: 'Centered passes', value: perfect }, { label: 'Hearts', value: lives }] }); }
      function hurt() { if (invincible > 0) return; lives--; invincible = 1.5; api.sound('bad'); api.shake(5); if (!lives) { finish(false); return; } const near = gates.find(g => g.x + 65 > fish.x); fish.y = near ? near.center : 300; fish.vy = -90; api.toast('Find your rhythm · ' + lives + ' hearts'); }
      function ui() { api.score(score); api.hud([{ label: 'Gates', value: passed + ' / 24' }, { label: 'Hearts', value: lives }, { label: 'Precision', value: perfect }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; cooldown = Math.max(0, cooldown - dt); invincible = Math.max(0, invincible - dt);
          if ((api.input.pressed('flap') || api.input.pointer.pressed && api.input.pointer.inside) && cooldown <= 0) { fish.vy = -255; cooldown = 0.08; grace = 0; api.sound('click', 1.3); }
          if (grace > 0) { grace -= dt; return; }
          fish.vy = Math.min(390, fish.vy + 650 * dt); fish.y += fish.vy * dt;
          const speed = 210 + Math.min(45, passed * 2); scroll += speed * dt;
          for (const g of gates) {
            g.x -= speed * dt;
            if (!g.counted && g.x + 65 < fish.x - 15) { g.counted = true; passed++; score += 100; if (Math.abs(fish.y - g.center) < 25) { perfect++; score += 45; api.burst(fish.x, fish.y, '#fde68a', 8); } api.sound('good', 1.1); if (passed >= 24) { finish(true); return; } }
            if (g.x < fish.x + 16 && g.x + 65 > fish.x - 16 && (fish.y - 12 < g.center - g.gap / 2 || fish.y + 12 > g.center + g.gap / 2)) hurt();
            if (ended) return;
          }
          if (fish.y < 52 || fish.y > 548) { hurt(); fish.y = clamp(fish.y, 53, 547); fish.vy = 0; if (ended) return; }
          if (gates[0].x < -90) { gates.shift(); gates.push(gate(gates[gates.length - 1].x + 380)); }
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#a8dbe1'); g.addColorStop(0.4, '#448da5'); g.addColorStop(1, '#20506f'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#d9f1d42b'; for (let i = 0; i < 8; i++) { const x = i * 150 - scroll * 0.08 % 150; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 180, 560); ctx.lineTo(x + 80, 560); ctx.fill(); }
          for (let i = 0; i < 20; i++) { ctx.strokeStyle = '#a5dae233'; ctx.lineWidth = 2; const x = (i * 97 - scroll * 0.2 % 970 + 970) % 970; ctx.beginPath(); ctx.arc(x, 110 + i * 73 % 420, 3 + i % 4, 0, Math.PI * 2); ctx.stroke(); }
          gates.forEach(p => { const top = p.center - p.gap / 2, bottom = p.center + p.gap / 2; ctx.fillStyle = '#bc716e'; ctx.beginPath(); ctx.roundRect(p.x, 36, 65, Math.max(1, top - 36), [0, 0, 13, 13]); ctx.fill(); ctx.beginPath(); ctx.roundRect(p.x, bottom, 65, 526 - bottom, [13, 13, 0, 0]); ctx.fill(); ctx.fillStyle = '#f3a18a'; ctx.fillRect(p.x + 5, top - 12, 55, 7); ctx.fillRect(p.x + 5, bottom + 5, 55, 7); ctx.strokeStyle = '#874d65'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x + 18, 65); ctx.lineTo(p.x + 18, top - 25); ctx.moveTo(p.x + 46, bottom + 25); ctx.lineTo(p.x + 46, 545); ctx.stroke(); });
          ctx.fillStyle = '#d7c39c'; ctx.fillRect(0, 558, 960, 42); ctx.fillStyle = '#d6efdf'; ctx.fillRect(0, 0, 960, 39);
          for (let i = 0; i < 14; i++) { const x = (i * 90 - scroll * 0.4 % 90); ctx.strokeStyle = '#386d62'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, 563); ctx.quadraticCurveTo(x - 20, 528, x + 5, 512); ctx.stroke(); }
          ctx.save(); ctx.translate(fish.x, fish.y); ctx.rotate(clamp(fish.vy / 600, -0.35, 0.55)); ctx.globalAlpha = invincible > 0 ? 0.65 : 1; ctx.fillStyle = '#ffc47d'; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-37, -15); ctx.lineTo(-37, 15); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 0, 24, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ed9a59'; ctx.beginPath(); ctx.ellipse(-3, 7, 9, 5, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff8de'; ctx.beginPath(); ctx.arc(11, -5, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#183c57'; ctx.beginPath(); ctx.arc(13, -5, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          if (grace > 0) { ctx.fillStyle = '#e0f6eb'; ctx.textAlign = 'center'; ctx.font = '800 28px system-ui'; ctx.fillText('TAP INTO THE CURRENT', 480, 290); } ctx.restore();
        },
        inspect() { return { fish: { ...fish }, gates: gates.map(g => ({ ...g })), passed, lives, score, invincible, cooldown, grace, perfect, ended }; }
      };
    }
  });
})();
