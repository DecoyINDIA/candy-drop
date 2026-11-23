(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), TAU = Math.PI * 2;
  Arcade.mount({
    id: 'echo-dodge', title: 'Echo Dodge', category: 'Memory-path survival', accent: '#f0abfc',
    description: 'Your past is catching up. Leave it a little room.',
    howTo: ['Survive sixty seconds while echoes replay your actual movement from 2.3, 4.7, and 7.1 seconds earlier. New echoes appear gradually. You have four hearts.', 'Move with arrows / WASD, or hold the playfield to move toward your finger. Space dashes in your last direction and avoids an echo briefly; it recharges in three seconds.', 'Collect the gold lights for points. Hollow echoes are warning previews; solid echoes are dangerous. Keep moving, and think twice before crossing the path you just left.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'dash', label: 'Dash', keys: ['Space', 'ShiftLeft'] }], medals: [600, 1900, 3200],
    create(api) {
      const player = { x: 480, y: 300, face: -Math.PI / 2, hp: 4, invincible: 0, dash: 0, cooldown: 0 }, specs = [{ delay: 2.3, starts: 5, color: '#eaa1ae' }, { delay: 4.7, starts: 20, color: '#b8a1dd' }, { delay: 7.1, starts: 37, color: '#e6b282' }];
      let history = [{ x: 480, y: 300, t: 0 }], motes = [{ x: 250, y: 170 }, { x: 710, y: 170 }, { x: 250, y: 430 }, { x: 710, y: 430 }], time = 0, sample = 0, collected = 0, score = 0, dodges = 0, dodgeLock = 0, ended = false;
      function echoes() { return specs.filter(e => time >= e.starts - 1.1).map((e, i) => { const at = time - e.delay; let p = history[0]; for (const h of history) { if (h.t > at) break; p = h; } return { ...e, id: i, x: p.x, y: p.y, active: time >= e.starts, recordedAt: p.t }; }); }
      function finish(won) { if (ended) return; ended = true; score = Math.floor(time * 10) + collected * 125 + dodges * 80 + (won ? 1000 + player.hp * 180 : 0); api.score(score); api.end({ score, title: won ? 'You left the past behind.' : 'Make room for your next move.', message: won ? 'One minute, three versions of your past. More lights and cleaner crossings await on the next route.' : 'Long routes give your echoes room. A sudden return along the same path can bring yesterday’s position straight toward you.', stats: [{ label: 'Survived', value: time.toFixed(1) + ' / 60s' }, { label: 'Lights', value: collected }, { label: 'Dash escapes', value: dodges }] }); }
      function ui() { score = Math.floor(time * 10) + collected * 125 + dodges * 80; api.score(score); api.hud([{ label: 'Time left', value: Math.ceil(60 - time) + 's' }, { label: 'Hearts', value: player.hp }, { label: 'Echoes', value: echoes().filter(e => e.active).length + ' / 3' }, { label: 'Dash', value: player.cooldown > 0 ? player.cooldown.toFixed(1) + 's' : 'Ready' }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.min(60, time + dt); player.invincible = Math.max(0, player.invincible - dt); player.dash = Math.max(0, player.dash - dt); player.cooldown = Math.max(0, player.cooldown - dt); dodgeLock = Math.max(0, dodgeLock - dt);
          let dx = Number(api.input.down('right')) - Number(api.input.down('left')), dy = Number(api.input.down('down')) - Number(api.input.down('up')); const p = api.input.pointer; if (p.down && p.inside) { dx = p.x - player.x; dy = p.y - player.y; if (Math.hypot(dx, dy) < 8) dx = dy = 0; } const length = Math.hypot(dx, dy); if (length) { dx /= length; dy /= length; player.face = Math.atan2(dy, dx); }
          if (api.input.pressed('dash') && !player.cooldown) { player.dash = .22; player.cooldown = 3; api.sound('shoot', 1.2); }
          const speed = player.dash > 0 ? 610 : 230; if (player.dash > 0) { dx = Math.cos(player.face); dy = Math.sin(player.face); } player.x = clamp(player.x + dx * speed * dt, 78, 882); player.y = clamp(player.y + dy * speed * dt, 78, 522);
          sample += dt; if (sample >= .05) { sample -= .05; history.push({ x: player.x, y: player.y, t: time }); } while (history.length > 175 || history.length > 1 && history[1].t < time - 8.6) history.shift();
          for (const e of echoes()) { const distance = Math.hypot(player.x - e.x, player.y - e.y); if (!e.active || distance >= 28) continue; if (player.dash > 0) { if (!dodgeLock) { dodges++; dodgeLock = 1; api.sound('good'); } } else if (!player.invincible) { player.hp--; player.invincible = 1.3; api.sound('bad'); api.shake(4); if (!player.hp) { finish(false); return; } } }
          for (const m of motes) if (Math.hypot(m.x - player.x, m.y - player.y) < 25) { collected++; api.sound('good', 1.2); api.burst(m.x, m.y, '#efce8c', 8); let tries = 0; do { m.x = 150 + api.random() * 660; m.y = 125 + api.random() * 350; tries++; } while (tries < 12 && Math.hypot(m.x - player.x, m.y - player.y) < 120); }
          if (time >= 60) { finish(true); return; } ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#211f36'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#181e31'; ctx.beginPath(); ctx.roundRect(58, 58, 844, 484, 24); ctx.fill(); ctx.strokeStyle = '#7c759d55'; ctx.lineWidth = 2; ctx.strokeRect(68, 68, 824, 464); ctx.strokeStyle = '#8996b513'; ctx.lineWidth = 1; for (let x = 90; x < 900; x += 40) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 530); ctx.stroke(); } for (let y = 90; y < 540; y += 40) { ctx.beginPath(); ctx.moveTo(70, y); ctx.lineTo(890, y); ctx.stroke(); }
          motes.forEach(m => { ctx.fillStyle = '#edd08e'; ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore(); });
          for (const e of echoes()) { const path = history.filter(p => p.t >= e.recordedAt - .7 && p.t <= e.recordedAt); ctx.strokeStyle = e.color + '45'; ctx.lineWidth = 5; ctx.beginPath(); path.forEach((p, i) => { if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke(); ctx.strokeStyle = e.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, 16, 0, TAU); if (e.active) { ctx.fillStyle = e.color + 'bb'; ctx.fill(); } ctx.stroke(); if (!e.active) { ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(e.x, e.y, 29, 0, TAU); ctx.stroke(); ctx.setLineDash([]); } }
          ctx.strokeStyle = '#9bdccb35'; ctx.lineWidth = 2; const recent = history.filter(p => p.t > time - .45); ctx.beginPath(); recent.forEach((p, i) => { if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke(); ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.face); ctx.globalAlpha = player.invincible > 0 ? .6 : 1; ctx.fillStyle = '#a9e1d1'; ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(-10, -12); ctx.lineTo(-5, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill(); if (player.dash > 0) { ctx.strokeStyle = '#e1f1d1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.stroke(); } ctx.restore();
          ctx.fillStyle = '#c6bddc'; ctx.textAlign = 'center'; ctx.font = '800 17px system-ui'; ctx.fillText('LEAVE YOUR PAST A LITTLE ROOM.', 480, 35); ctx.font = '700 14px system-ui'; ctx.fillText('ECHO DELAYS  ·  2.3s  /  4.7s  /  7.1s', 480, 575); ctx.restore();
        },
        inspect() { return { player: { ...player }, history: history.map(p => ({ ...p })), motes: motes.map(m => ({ ...m })), echoes: echoes(), time, collected, score, dodges, ended }; }
      };
    }
  });
})();
