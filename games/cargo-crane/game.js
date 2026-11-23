(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), LENGTH = 234;
  Arcade.mount({
    id: 'cargo-crane', title: 'Cargo Crane', category: 'Pendulum delivery', accent: '#f5cc83',
    description: 'A little momentum. A careful release. A harbor running beautifully.',
    howTo: ['Place eight crates fully on their marked barges within two minutes. You can lose three crates. A sideways landing faster than 180 pixels per second breaks the cargo.', 'Hold Left / Right to move the trolley. Space releases the hanging crate. The rope swings with your movement, and a released crate keeps its sideways momentum.', 'The dotted arc estimates the landing. Stop the trolley and wait for a gentle swing before releasing; accurate placement earns a larger bonus.'],
    controls: [{ id: 'left', label: 'Trolley ←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Trolley →', keys: ['ArrowRight', 'KeyD'] }, { id: 'drop', label: 'Release', keys: ['Space', 'ArrowDown'] }], medals: [600, 1700, 3000],
    create(api) {
      const crane = { x: 480, vx: 0, angle: 0.3, omega: 0 }, cargo = { x: 480, y: 330, vx: 0, vy: 0, attached: true }, dock = { x: 660, y: 500, w: 126 }; let delivered = 0, lost = 0, score = 0, time = 120, transition = 0, ended = false, lastAccuracy = 0, clock = 0;
      function attach() { cargo.attached = true; crane.vx = 0; crane.angle = (api.random() < 0.5 ? -1 : 1) * (0.2 + api.random() * 0.15); crane.omega = 0; dock.x = 210 + api.random() * 540; dock.w = 126 - delivered * 5; align(); }
      function align() { cargo.x = crane.x + Math.sin(crane.angle) * LENGTH; cargo.y = 98 + Math.cos(crane.angle) * LENGTH; cargo.vx = crane.vx + Math.cos(crane.angle) * LENGTH * crane.omega; cargo.vy = -Math.sin(crane.angle) * LENGTH * crane.omega; }
      function finish(won) { if (ended) return; ended = true; if (won) score += 700 + (3 - lost) * 180 + Math.floor(time * 6); api.score(score); api.end({ score, title: won ? 'A harbor in good hands.' : 'A gentler swing next time.', message: won ? 'Eight careful deliveries. Accurate placements and a steady trolley keep the harbor moving.' : 'The falling crate keeps moving sideways. Let the dotted landing guide settle over the barge before releasing.', stats: [{ label: 'Delivered', value: delivered + ' / 8' }, { label: 'Lost cargo', value: lost + ' / 3' }, { label: 'Last accuracy', value: lastAccuracy + '%' }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Delivered', value: delivered + ' / 8' }, { label: 'Cargo left', value: 3 - lost }, { label: 'Crate', value: transition > 0 ? 'Reloading' : cargo.attached ? 'Attached' : 'Falling' }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      align(); ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); clock += dt; if (!time) { finish(false); return; }
          if (transition > 0) { transition = Math.max(0, transition - dt); if (!transition) attach(); ui(); return; }
          if (cargo.attached) {
            const dir = Number(api.input.down('right')) - Number(api.input.down('left')), old = crane.vx;
            crane.vx += clamp(dir * 170 - crane.vx, -520 * dt, 520 * dt); crane.x += crane.vx * dt;
            if (crane.x < 150 || crane.x > 810) { crane.x = clamp(crane.x, 150, 810); crane.vx = 0; }
            const acceleration = (crane.vx - old) / dt;
            crane.omega += (-700 / LENGTH * Math.sin(crane.angle) - acceleration / LENGTH * Math.cos(crane.angle) - crane.omega * 0.48) * dt;
            crane.angle += crane.omega * dt; crane.angle = clamp(crane.angle, -1.05, 1.05); align();
            if (api.input.pressed('drop')) { cargo.attached = false; api.sound('click'); }
          } else {
            const oldBottom = cargo.y + 18; cargo.vy += 480 * dt; cargo.x += cargo.vx * dt; cargo.y += cargo.vy * dt;
            if (oldBottom <= dock.y && cargo.y + 18 >= dock.y) {
              const error = Math.abs(cargo.x - dock.x), fit = dock.w / 2 - 19;
              if (error <= fit && Math.abs(cargo.vx) < 180) { delivered++; cargo.y = dock.y - 18; cargo.vx = cargo.vy = 0; lastAccuracy = Math.round((1 - error / fit) * 100); score += 180 + Math.round(lastAccuracy * 1.8); api.sound('good'); api.burst(cargo.x, cargo.y, '#f5cc83', 12); api.toast(lastAccuracy + '% placement · cargo delivered'); if (delivered >= 8) { finish(true); return; } transition = 1.1; }
            }
            if (cargo.y > 590 || cargo.x < -60 || cargo.x > 1020) { lost++; lastAccuracy = 0; api.sound('bad'); api.burst(clamp(cargo.x, 0, 960), 540, '#9fd4dd', 15); if (lost >= 3) { finish(false); return; } transition = 1.1; }
          }
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#d7ddd2'); g.addColorStop(0.78, '#b2cbd0'); g.addColorStop(1, '#668d9c'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#91adb3'; for (let i = 0; i < 9; i++) ctx.fillRect(i * 130 - 30, 395 - i % 3 * 28, 94, 150);
          ctx.fillStyle = '#5b8696'; ctx.fillRect(0, 530, 960, 70); ctx.strokeStyle = '#a2ced244'; ctx.lineWidth = 2; for (let i = 0; i < 18; i++) { const x = (i * 71 + clock * 12) % 1040 - 40; ctx.beginPath(); ctx.moveTo(x, 545 + i % 4 * 13); ctx.lineTo(x + 31, 545 + i % 4 * 13); ctx.stroke(); }
          ctx.fillStyle = '#7b8278'; ctx.fillRect(74, 60, 17, 488); ctx.fillRect(869, 60, 17, 488); ctx.fillStyle = '#b7a579'; ctx.fillRect(75, 60, 811, 26); ctx.strokeStyle = '#7b785f'; ctx.lineWidth = 3; for (let x = 81; x < 880; x += 40) { ctx.beginPath(); ctx.moveTo(x, 62); ctx.lineTo(x + 36, 83); ctx.stroke(); }
          ctx.fillStyle = '#546978'; ctx.beginPath(); ctx.roundRect(crane.x - 27, 78, 54, 25, 6); ctx.fill(); ctx.fillStyle = '#e0c68c'; ctx.fillRect(crane.x - 11, 84, 22, 9);
          if (cargo.attached) { ctx.strokeStyle = '#52636b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(crane.x, 98); ctx.lineTo(cargo.x, cargo.y - 18); ctx.stroke();
            const fall = Math.max(0, (-cargo.vy + Math.sqrt(cargo.vy * cargo.vy + 960 * Math.max(0, dock.y - 18 - cargo.y))) / 480); ctx.strokeStyle = '#42687980'; ctx.lineWidth = 2; ctx.setLineDash([3, 8]); ctx.beginPath(); ctx.moveTo(cargo.x, cargo.y); for (let i = 1; i <= 12; i++) { const t = fall * i / 12; ctx.lineTo(cargo.x + cargo.vx * t, cargo.y + cargo.vy * t + 240 * t * t); } ctx.stroke(); ctx.setLineDash([]); }
          ctx.fillStyle = '#48626c'; ctx.beginPath(); ctx.moveTo(dock.x - dock.w / 2 - 15, dock.y + 7); ctx.lineTo(dock.x + dock.w / 2 + 15, dock.y + 7); ctx.lineTo(dock.x + dock.w / 2, 530); ctx.lineTo(dock.x - dock.w / 2, 530); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d4be89'; ctx.fillRect(dock.x - dock.w / 2, dock.y, dock.w, 8); ctx.strokeStyle = '#f7e7b5'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.strokeRect(dock.x - dock.w / 2 + 4, dock.y - 10, dock.w - 8, 8); ctx.setLineDash([]);
          if (cargo.y < 590) { ctx.fillStyle = '#ba8b5b'; ctx.fillRect(cargo.x - 19, cargo.y - 18, 38, 36); ctx.strokeStyle = '#e4c58a'; ctx.lineWidth = 3; ctx.strokeRect(cargo.x - 15, cargo.y - 14, 30, 28); ctx.beginPath(); ctx.moveTo(cargo.x - 14, cargo.y - 13); ctx.lineTo(cargo.x + 14, cargo.y + 13); ctx.stroke(); }
          ctx.textAlign = 'center'; ctx.fillStyle = '#536c72'; ctx.font = '800 15px system-ui'; ctx.fillText('A LITTLE MOMENTUM. A CAREFUL RELEASE.', 480, 35); ctx.font = '800 14px system-ui'; ctx.fillStyle = '#eef3dc'; ctx.fillText('DELIVERY ' + Math.min(8, delivered + 1), dock.x, 565); ctx.restore();
        },
        inspect() { return { crane: { ...crane }, cargo: { ...cargo }, dock: { ...dock }, delivered, lost, score, time, transition, lastAccuracy, clock, ended }; }
      };
    }
  });
})();
