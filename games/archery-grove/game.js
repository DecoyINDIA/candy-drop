/* Archery Grove: ten ballistic arrows with visible wind and ring-based scoring. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'archery-grove', title: 'Archery Grove', category: 'Archery', accent: '#d9dca0',
    description: 'Ten arrows in a quiet grove. Read the breeze. Trust the release.',
    howTo: ['Shoot 10 arrows at the target. The center scores 10, with lower scores toward the edge. Both the wind and target height change between arrows.', 'Up / Down aims the bow. Left / Right sets draw power. Hold Space / Draw to add power, then release. You can also drag back from the bow.', 'Wind bends the arrow horizontally and changes its flight time. The dotted line previews the opening of your trajectory. Fine adjustments beat a rushed full-power shot.'],
    controls: [{ id: 'up', label: 'Aim ↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: 'Aim ↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'left', label: 'Power −', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Power +', keys: ['ArrowRight', 'KeyD'] }, { id: 'shoot', label: 'Draw', keys: ['Space'] }],
    medals: [2200, 5500, 8500],
    create(api) {
      const shots = Array.from({ length: 10 }, (_, i) => ({ wind: i === 0 ? 0 : (api.random() - 0.5) * 110, y: i === 0 ? 305 : 260 + api.random() * 110 }));
      let arrowIndex = 0, angle = -0.48, power = 0.63, flying = false, charging = false, dragging = false, delay = 0, age = 0, score = 0, ringTotal = 0, bullseyes = 0, ended = false, clock = 0;
      let message = 'BREATHE. AIM. RELEASE.', lastRing = null; const arrow = { x: 130, y: 431, vx: 0, vy: 0 }, results = [];
      function hud() { api.score(score); api.hud([{ label: 'Arrow', value: Math.min(10, arrowIndex + 1) + ' / 10' }, { label: 'Rings', value: ringTotal + ' / 100' }, { label: 'Wind', value: (shots[arrowIndex].wind < 0 ? '← ' : '→ ') + Math.round(Math.abs(shots[arrowIndex].wind)) }, { label: 'Power', value: Math.round(power * 100) + '%' }]); }
      function release() { if (flying || delay > 0 || ended) return; const speed = 450 + power * 380; arrow.x = 130; arrow.y = 431; arrow.vx = Math.cos(angle) * speed; arrow.vy = Math.sin(angle) * speed; flying = true; age = 0; api.sound('shoot', 0.8); }
      function resolve(ring) { flying = false; lastRing = ring; results.push(ring); ringTotal += ring; if (ring === 10) bullseyes++; score += ring * 100 + (ring === 10 ? 75 : 0); delay = 1.2; message = ring === 10 ? 'BULLSEYE. BEAUTIFULLY PLACED.' : ring ? ring + ' POINTS. A LITTLE CLOSER.' : 'WIDE OF THE TARGET.'; api.sound(ring >= 8 ? 'win' : ring ? 'good' : 'bad'); if (ring) api.burst(805, arrow.y, '#eee4a8', 10); }
      function finish() { ended = true; api.end({ score, title: ringTotal >= 75 ? 'A steady hand.' : 'The grove rewards patience.', message: ringTotal + ' out of 100 ring points. ' + bullseyes + ' bullseye' + (bullseyes === 1 ? '' : 's') + '. Read the breeze before your next draw.', stats: [{ label: 'Ring points', value: ringTotal + ' / 100' }, { label: 'Bullseyes', value: bullseyes }, { label: 'Arrows landed', value: results.filter(Boolean).length + ' / 10' }] }); }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt;
          if (delay > 0) { delay -= dt; if (delay <= 0) { arrowIndex++; if (arrowIndex >= 10) { arrowIndex = 9; finish(); return; } arrow.x = 130; arrow.y = 431; message = 'NEW WIND. NEW POSSIBILITY.'; } hud(); return; }
          const input = api.input, p = input.pointer;
          if (!flying) {
            angle = clamp(angle + (Number(input.down('down')) - Number(input.down('up'))) * 0.65 * dt, -1.2, -0.08); power = clamp(power + (Number(input.down('right')) - Number(input.down('left'))) * 0.42 * dt, 0, 1);
            if (input.down('shoot')) { charging = true; power = Math.min(1, power + dt * 0.26); }
            if (charging && !input.down('shoot')) { charging = false; release(); }
            if (p.pressed && p.inside && Math.hypot(p.x - 130, p.y - 431) < 65) dragging = true;
            if (dragging && p.down) { const dx = 130 - p.x, dy = 431 - p.y; if (dx > 3) { angle = clamp(Math.atan2(dy, dx), -1.2, -0.08); power = clamp(Math.hypot(dx, dy) / 120, 0, 1); } }
            if (dragging && p.released) { dragging = false; release(); } if (dragging && !p.down && !p.released) dragging = false;
          }
          if (flying) {
            age += dt;
            for (let sub = 0; sub < 4; sub++) { const step = dt / 4, oldX = arrow.x, oldY = arrow.y; arrow.vx += shots[arrowIndex].wind * step; arrow.vy += 300 * step; arrow.x += arrow.vx * step; arrow.y += arrow.vy * step;
              if (oldX < 802 && arrow.x >= 802) { const fraction = (802 - oldX) / (arrow.x - oldX); arrow.y = oldY + (arrow.y - oldY) * fraction; arrow.x = 802; const error = Math.abs(arrow.y - shots[arrowIndex].y); resolve(error <= 110 ? Math.max(1, 10 - Math.floor(error / 11)) : 0); break; }
            }
            if (flying && (arrow.y > 565 || arrow.x < -40 || age > 4)) resolve(0);
          }
          hud();
        },
        draw(c) {
          c.save(); const sky = c.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, '#b4c2aa'); sky.addColorStop(1, '#6e8d6c'); c.fillStyle = sky; c.fillRect(0, 0, 960, 600);
          for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 10; i++) { const x = i * 119 + layer * 40 - 70, y = 190 + layer * 90, r = 80 + i * 13 % 50; c.fillStyle = ['#7a9b83', '#567d6b', '#365e54'][layer]; c.fillRect(x - 9, y, 18, 390); c.beginPath(); c.ellipse(x, y, r * 0.55, r, 0, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = '#385a42'; c.fillRect(0, 521, 960, 79); c.fillStyle = '#798c58'; c.beginPath(); c.ellipse(470, 537, 440, 35, 0, 0, Math.PI * 2); c.fill();
          const targetY = shots[arrowIndex].y; c.strokeStyle = '#5c503a'; c.lineWidth = 8; c.beginPath(); c.moveTo(805, targetY + 65); c.lineTo(771, 535); c.moveTo(818, targetY + 65); c.lineTo(855, 535); c.stroke();
          const ringColors = ['#eee6c8', '#5a6060', '#83b1bf', '#d47d67', '#dfbb6d']; for (let i = 0; i < 5; i++) { c.fillStyle = ringColors[i]; c.beginPath(); c.ellipse(816, targetY, 25 - i * 4.5, 110 - i * 22, 0, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = '#e3c699'; c.beginPath(); c.arc(100, 399, 13, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#294c49'; c.lineWidth = 12; c.beginPath(); c.moveTo(99, 415); c.lineTo(101, 475); c.moveTo(101, 468); c.lineTo(78, 523); c.moveTo(101, 468); c.lineTo(122, 523); c.stroke(); c.strokeStyle = '#d4bf8c'; c.lineWidth = 7; c.beginPath(); c.moveTo(101, 427); c.lineTo(132, 431); c.stroke();
          c.save(); c.translate(130, 431); c.rotate(angle); c.strokeStyle = '#d4b67a'; c.lineWidth = 4; c.beginPath(); c.arc(-13, 0, 42, -1.15, 1.15); c.stroke(); c.strokeStyle = '#efe4b9'; c.lineWidth = 1; c.beginPath(); c.moveTo(4, -38); c.lineTo(charging || dragging ? -30 - power * 15 : -4, 0); c.lineTo(4, 38); c.stroke(); c.restore();
          if (!flying && delay <= 0) { const speed = 450 + power * 380; for (let i = 1; i <= 10; i++) { const t = i * 0.055; c.fillStyle = '#f5ebc777'; c.beginPath(); c.arc(130 + Math.cos(angle) * speed * t + shots[arrowIndex].wind * t * t / 2, 431 + Math.sin(angle) * speed * t + 150 * t * t, 2.5, 0, Math.PI * 2); c.fill(); } }
          if (flying || delay > 0) { c.save(); c.translate(arrow.x, arrow.y); c.rotate(Math.atan2(arrow.vy, arrow.vx)); c.strokeStyle = '#f5e8bd'; c.lineWidth = 2; c.beginPath(); c.moveTo(-23, 0); c.lineTo(9, 0); c.stroke(); c.fillStyle = '#263f3c'; c.beginPath(); c.moveTo(14, 0); c.lineTo(6, -4); c.lineTo(6, 4); c.fill(); c.strokeStyle = '#e9b694'; c.beginPath(); c.moveTo(-22, 0); c.lineTo(-28, -5); c.moveTo(-22, 0); c.lineTo(-28, 5); c.stroke(); c.restore(); }
          c.fillStyle = '#f1eac8'; c.font = '900 31px Georgia,serif'; c.textAlign = 'center'; c.fillText('Archery Grove', 480, 49); c.font = '700 14px system-ui'; c.fillText(message, 480, 581);
          c.fillStyle = '#213f3bbd'; c.fillRect(346, 71, 268, 43); c.fillStyle = '#dce6c4'; c.font = 'bold 16px system-ui'; c.fillText(shots[arrowIndex].wind < 0 ? '← WIND ' + Math.round(-shots[arrowIndex].wind) : 'WIND ' + Math.round(shots[arrowIndex].wind) + ' →', 480, 98);
          c.textAlign = 'left'; c.font = 'bold 15px system-ui'; c.fillText(results.map(n => n === 10 ? '◎' : n || '–').join('   '), 29, 45); c.restore();
        },
        cancelInput() { charging = dragging = false; },
        inspect() { return { arrowIndex, angle, power, flying, charging, dragging, delay, age, score, ringTotal, bullseyes, wind: shots[arrowIndex].wind, targetY: shots[arrowIndex].y, lastRing, results: results.slice(), arrow: { ...arrow }, ended }; }
      };
    }
  });
})();
