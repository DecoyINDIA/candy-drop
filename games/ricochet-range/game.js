(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'ricochet-range', title: 'Ricochet Range', category: 'Bank-shot puzzle', accent: '#fb923c',
    description: 'Find the angle that turns one clean shot into a roomful of bullseyes.',
    howTo: ['Clear five targets in each of four rooms within two minutes. Start with ten shots; each cleared room restores three.', 'Left / Right changes aim. Space fires. Point or drag above the launcher to aim, and tap to shoot. R recalls a moving shot without refunding it.', 'Walls and rails reflect the ball. Targets hit after a bounce earn extra points, and one shot can clear several targets.'],
    controls: [{ id: 'left', label: 'Aim ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Aim ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'shoot', label: 'Fire', keys: ['Space'] }, { id: 'recall', label: 'Recall', keys: ['KeyR'] }], medals: [600, 1800, 4000],
    create(api) {
      let room = 1, angle = -0.9, charges = 10, targets = [], walls = [], ball = null, score = 0, time = 120, hits = 0, ended = false, transition = 0;
      function setup() {
        const points = [[360, 180], [565, 125], [785, 220], [640, 395], [340, 350]];
        targets = points.map((p, i) => ({ x: p[0] + (room === 1 ? 0 : (api.random() - 0.5) * 55), y: p[1] + (room === 1 ? 0 : (api.random() - 0.5) * 35), hit: false, number: i + 1 }));
        walls = room === 1 ? [] : room === 2 ? [{ x: 430, y: 235, w: 235, h: 17 }] : room === 3 ? [{ x: 450, y: 145, w: 18, h: 175 }, { x: 610, y: 400, w: 160, h: 18 }] : [{ x: 430, y: 225, w: 185, h: 17 }, { x: 710, y: 320, w: 18, h: 125 }];
      }
      function finish(won) { if (ended) return; ended = true; if (won) score += 700 + charges * 100 + Math.floor(time * 6); api.score(score); api.end({ score, title: won ? 'Every angle accounted for.' : 'A different angle next time.', message: won ? 'Twenty targets, four rooms. Bounce bonuses reward the less obvious line.' : 'Use the outer rails to get around a barrier. Recall a spent shot early to save time.', stats: [{ label: 'Room', value: room + ' / 4' }, { label: 'Targets', value: hits + ' / 20' }, { label: 'Shots left', value: charges }] }); }
      function fire() { if (ball || transition > 0 || !charges) return; charges--; ball = { x: 120, y: 493, vx: Math.cos(angle) * 590, vy: Math.sin(angle) * 590, bounces: 0, life: 5.5, hits: 0 }; api.sound('shoot'); }
      function ui() { api.score(score); api.hud([{ label: 'Room', value: room + ' / 4' }, { label: 'Targets left', value: targets.filter(t => !t.hit).length }, { label: 'Shots', value: charges }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      setup(); ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; }
          if (transition > 0) { transition -= dt; if (transition <= 0) { transition = 0; room++; charges += 3; setup(); } ui(); return; }
          angle = clamp(angle + (Number(api.input.down('right')) - Number(api.input.down('left'))) * 1.2 * dt, -Math.PI + 0.1, -0.1);
          const p = api.input.pointer; if (p.down && p.inside && p.y < 480) angle = clamp(Math.atan2(p.y - 493, p.x - 120), -Math.PI + 0.1, -0.1);
          if (p.pressed && p.inside && p.y < 480) { angle = clamp(Math.atan2(p.y - 493, p.x - 120), -Math.PI + 0.1, -0.1); fire(); }
          if (api.input.pressed('shoot')) fire(); if (api.input.pressed('recall')) ball = null;
          if (ball) {
            ball.life -= dt;
            for (let sub = 0; sub < 4; sub++) {
              const ox = ball.x, oy = ball.y; ball.x += ball.vx * dt / 4; ball.y += ball.vy * dt / 4;
              if (ball.x < 67 || ball.x > 893) { ball.x = clamp(ball.x, 67, 893); ball.vx *= -1; ball.bounces++; }
              if (ball.y < 67 || ball.y > 533) { ball.y = clamp(ball.y, 67, 533); ball.vy *= -1; ball.bounces++; }
              for (const w of walls) if (ball.x + 7 > w.x && ball.x - 7 < w.x + w.w && ball.y + 7 > w.y && ball.y - 7 < w.y + w.h) { if (oy + 7 <= w.y || oy - 7 >= w.y + w.h) { ball.y = oy; ball.vy *= -1; } else { ball.x = ox; ball.vx *= -1; } ball.bounces++; break; }
              for (const t of targets) if (!t.hit && Math.hypot(ball.x - t.x, ball.y - t.y) < 24) { t.hit = true; hits++; ball.hits++; score += 120 + Math.min(8, ball.bounces) * 35 + (ball.hits - 1) * 45; api.burst(t.x, t.y, '#d97c54', 12); api.sound('good', 0.9 + ball.hits * 0.1); }
            }
            if (ball.life <= 0 || ball.bounces >= 12) ball = null;
          }
          if (targets.every(t => t.hit)) { ball = null; if (room === 4) { finish(true); return; } transition = 1.2; api.toast('Room cleared · +3 shots'); api.sound('win'); }
          else if (!charges && !ball) { finish(false); return; }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#e9e4d8'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#d0cdc0'; ctx.beginPath(); ctx.roundRect(48, 48, 864, 504, 24); ctx.fill(); ctx.fillStyle = '#f1eee5'; ctx.beginPath(); ctx.roundRect(59, 59, 842, 482, 15); ctx.fill();
          ctx.fillStyle = '#acb2a766'; for (let x = 82; x < 900; x += 24) for (let y = 82; y < 540; y += 24) ctx.fillRect(x, y, 1.5, 1.5);
          walls.forEach(w => { ctx.fillStyle = '#397b79'; ctx.beginPath(); ctx.roundRect(w.x, w.y, w.w, w.h, 7); ctx.fill(); ctx.strokeStyle = '#b2d7bf'; ctx.lineWidth = 2; ctx.strokeRect(w.x + 3, w.y + 3, Math.max(1, w.w - 6), Math.max(1, w.h - 6)); });
          targets.forEach(t => { if (t.hit) { ctx.strokeStyle = '#b5bdad'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(t.x - 6, t.y); ctx.lineTo(t.x, t.y + 6); ctx.lineTo(t.x + 10, t.y - 7); ctx.stroke(); return; } for (const [r, c] of [[23, '#b95f4a'], [16, '#f6d1a0'], [9, '#b95f4a']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#fff0d3'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(t.number, t.x, t.y + 4); });
          ctx.strokeStyle = '#617d7988'; ctx.lineWidth = 2; ctx.setLineDash([3, 8]); ctx.beginPath(); ctx.moveTo(120, 493); ctx.lineTo(120 + Math.cos(angle) * 130, 493 + Math.sin(angle) * 130); ctx.stroke(); ctx.setLineDash([]);
          ctx.save(); ctx.translate(120, 493); ctx.rotate(angle); ctx.fillStyle = '#355c61'; ctx.beginPath(); ctx.roundRect(-13, -12, 45, 24, 8); ctx.fill(); ctx.fillStyle = '#ebac65'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          if (ball) { ctx.fillStyle = '#274e56'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2); ctx.fill(); }
          ctx.textAlign = 'center'; ctx.fillStyle = '#57736c'; ctx.font = '800 14px system-ui'; ctx.fillText('ONE CLEAN SHOT. A NEW POSSIBILITY.', 480, 30); ctx.font = '700 14px system-ui'; ctx.fillText('ROOM ' + String(room).padStart(2, '0'), 480, 583); if (transition) { ctx.fillStyle = '#f5f1e8ee'; ctx.fillRect(300, 254, 360, 70); ctx.fillStyle = '#397b79'; ctx.font = '900 30px system-ui'; ctx.fillText('A LOVELY LINE.', 480, 300); } ctx.restore();
        },
        inspect() { return { room, angle, charges, ball: ball && { ...ball }, targets: targets.map(t => ({ ...t })), walls: walls.map(w => ({ ...w })), score, time, hits, transition, ended }; }
      };
    }
  });
})();
