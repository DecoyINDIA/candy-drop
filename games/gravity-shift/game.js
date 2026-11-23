(function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'gravity-shift', title: 'Gravity Shift', category: 'Gravity runner', accent: '#93c5fd',
    description: 'The floor is a choice. Find your next safe landing.',
    howTo: ['Pass 26 crystal barriers. The course moves automatically; you have three shields. Blue barriers hang from the ceiling and coral barriers rise from the floor.', 'Press Space / Up or tap the playfield to reverse gravity. Give yourself time to cross the chamber before the next barrier arrives.', 'Ride the surface opposite each barrier for a clean-pass bonus. Read the next obstacle before you flip; repeated taps can leave you in the middle.'],
    controls: [{ id: 'flip', label: 'Flip gravity', keys: ['Space', 'ArrowUp', 'KeyW'] }], medals: [800, 2200, 4000],
    create(api) {
      const runner = { x: 220, y: 504, vy: 0, gravity: 1 }; let barriers = [], trail = [], passed = 0, score = 0, shields = 3, invincible = 0, flipLock = 0, clean = 0, scroll = 0, grace = 1.2, ended = false;
      function barrier(x) { return { x, w: 56, height: 110 + api.random() * 65, side: api.random() < 0.5 ? 1 : -1, counted: false, touched: false }; }
      barriers.push(barrier(1080), barrier(1460), barrier(1840));
      function finish(won) { if (ended) return; ended = true; if (won) score += 600 + shields * 250; api.score(score); api.end({ score, title: won ? 'A new point of view.' : 'The next landing is yours.', message: won ? 'Twenty-six barriers, seen from both sides. Cleaner transitions make a smoother route.' : 'Flip while the next barrier is still across the chamber. The full crossing takes about a second.', stats: [{ label: 'Barriers', value: passed + ' / 26' }, { label: 'Clean passes', value: clean }, { label: 'Shields', value: shields }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Barriers', value: passed + ' / 26' }, { label: 'Shields', value: shields }, { label: 'Gravity', value: runner.gravity > 0 ? 'Floor ↓' : 'Ceiling ↑' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; flipLock = Math.max(0, flipLock - dt); invincible = Math.max(0, invincible - dt);
          if ((api.input.pressed('flip') || api.input.pointer.pressed && api.input.pointer.inside) && flipLock <= 0) { runner.gravity *= -1; runner.vy = runner.gravity * 75; flipLock = 0.12; api.sound('click', runner.gravity > 0 ? 0.9 : 1.2); }
          runner.vy = clamp(runner.vy + runner.gravity * 900 * dt, -520, 520); runner.y = clamp(runner.y + runner.vy * dt, 96, 504); if (runner.y === 96 || runner.y === 504) runner.vy = 0;
          trail.push({ x: runner.x, y: runner.y }); if (trail.length > 18) trail.shift();
          if (grace > 0) { grace -= dt; ui(); return; }
          const speed = 235 + Math.min(42, passed * 2); scroll += speed * dt;
          for (const b of barriers) {
            b.x -= speed * dt;
            if (b.x < runner.x + 15 && b.x + b.w > runner.x - 15 && (b.side > 0 ? runner.y + 15 > 520 - b.height : runner.y - 15 < 80 + b.height) && invincible <= 0) {
              shields--; b.touched = true; invincible = 1.6; api.burst(runner.x, runner.y, '#fda4af', 20); api.sound('bad'); api.shake(5); if (!shields) { finish(false); return; }
              runner.gravity = -b.side; runner.y = b.side > 0 ? 96 : 504; runner.vy = 0;
            }
            if (!b.counted && b.x + b.w < runner.x - 16) { b.counted = true; passed++; score += 100; if (!b.touched && (b.side > 0 ? runner.y < 120 : runner.y > 480)) { clean++; score += 45; api.sound('good', 1.2); } else api.sound('good'); if (passed >= 26) { finish(true); return; } }
          }
          if (barriers[0].x < -70) { barriers.shift(); barriers.push(barrier(barriers[barriers.length - 1].x + 380)); }
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#233655'); g.addColorStop(0.5, '#17263b'); g.addColorStop(1, '#3c293d'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
          ctx.strokeStyle = '#93b6cc19'; ctx.lineWidth = 1; for (let x = -scroll * 0.25 % 60; x < 960; x += 60) { ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, 520); ctx.stroke(); } for (let y = 100; y < 520; y += 55) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
          ctx.fillStyle = '#2e4a62'; ctx.fillRect(0, 0, 960, 80); ctx.fillStyle = '#584251'; ctx.fillRect(0, 520, 960, 80); ctx.fillStyle = '#93c5fd'; ctx.fillRect(0, 76, 960, 4); ctx.fillStyle = '#e6a3ad'; ctx.fillRect(0, 520, 960, 4);
          barriers.forEach(b => { const y = b.side > 0 ? 520 - b.height : 80; ctx.fillStyle = b.side > 0 ? '#c48194' : '#7fa5d1'; ctx.beginPath(); ctx.roundRect(b.x, y, b.w, b.height, 7); ctx.fill(); ctx.fillStyle = b.side > 0 ? '#f3c0bc' : '#c0ddf1'; ctx.fillRect(b.x + 7, y + 7, 6, b.height - 14); ctx.strokeStyle = '#182a4344'; ctx.lineWidth = 3; for (let k = 12; k < b.height; k += 25) { ctx.beginPath(); ctx.moveTo(b.x + 19, y + k); ctx.lineTo(b.x + 43, y + Math.min(b.height - 5, k + 18)); ctx.stroke(); } });
          trail.forEach((p, i) => { ctx.fillStyle = '#b3e9dc'; ctx.globalAlpha = i / trail.length * 0.15; ctx.beginPath(); ctx.arc(p.x - (trail.length - i) * 7, p.y, 8, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = invincible > 0 ? 0.6 : 1;
          ctx.save(); ctx.translate(runner.x, runner.y); ctx.rotate(runner.gravity > 0 ? 0 : Math.PI); ctx.fillStyle = '#b6e4d6'; ctx.beginPath(); ctx.roundRect(-15, -16, 30, 32, 7); ctx.fill(); ctx.fillStyle = '#395b68'; ctx.fillRect(-8, -8, 16, 8); ctx.fillStyle = '#f4e6b5'; ctx.fillRect(9, 7, 9, 5); ctx.restore(); ctx.globalAlpha = 1;
          ctx.fillStyle = '#b0cfdf'; ctx.font = '800 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('A DIFFERENT WAY TO SEE THE FLOOR.', 480, 43); ctx.fillStyle = '#d9b2c0'; ctx.font = '700 14px system-ui'; ctx.fillText('FLIP EARLY. LAND SOFTLY.', 480, 563);
          if (grace > 0) { ctx.fillStyle = '#d8eee7'; ctx.font = '800 28px system-ui'; ctx.fillText('THE FLOOR IS A CHOICE.', 530, 300); } ctx.restore();
        },
        inspect() { return { runner: { ...runner }, barriers: barriers.map(b => ({ ...b })), passed, score, shields, invincible, flipLock, clean, scroll, grace, ended }; }
      };
    }
  });
})();
