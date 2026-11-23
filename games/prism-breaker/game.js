(function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const palette = ['#fb7185', '#fb923c', '#fbbf24', '#6ee7b7', '#67e8f9', '#c4b5fd'];
  Arcade.mount({
    id: 'prism-breaker', title: 'Prism Breaker', category: 'Brick breaker', accent: '#67e8f9',
    description: 'One little paddle. Four walls of beautiful destruction.',
    howTo: ['Clear four prism formations before three balls or the three-minute clock run out. Striped bricks take two hits.', 'Move with Left / Right or drag across the playfield. Space launches; a waiting ball launches automatically after two seconds.', 'The paddle edge changes your bounce angle. Catch blue drops for a wider paddle and gold drops for a one-use floor shield.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'launch', label: 'Launch', keys: ['Space'] }],
    medals: [1500, 4000, 7500],
    create(api) {
      let level = 1, lives = 3, score = 0, time = 180, ended = false, wide = 0, shield = false, transition = 0, hits = 0;
      const paddle = { x: 480, width: 128 }, ball = { x: 480, y: 504, vx: 150, vy: -340, waiting: 2 };
      let bricks = [], drops = [];
      function formation() {
        bricks = []; drops = []; ball.waiting = 2; ball.x = paddle.x; ball.y = 504;
        for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) {
          if (level === 2 && (row + col) % 4 === 0 || level === 3 && row === 0 && col % 2 || level === 4 && Math.abs(col - 3.5) < 1 && row < 3) continue;
          bricks.push({ x: 143 + col * 84, y: 101 + row * 36, w: 76, h: 24, hp: level >= 3 && (row + col) % 3 === 0 ? 2 : 1, color: palette[(row + level - 1) % palette.length] });
        }
      }
      function launch() { if (ball.waiting <= 0) return; ball.waiting = 0; const speed = 420 + level * 32; ball.vx = speed * 0.4; ball.vy = -speed * Math.sqrt(0.84); api.sound('shoot'); }
      function finish(won) { if (ended) return; ended = true; if (won) score += 1200 + lives * 350 + Math.floor(time * 8); api.score(score); api.end({ score, title: won ? 'Every prism, scattered.' : 'A new angle awaits.', message: won ? 'All four formations cleared. Chase cleaner bounces and more balls in reserve.' : 'Meet the ball early. Use the center of your paddle for control and its edges to open a new angle.', stats: [{ label: 'Formation', value: level + ' / 4' }, { label: 'Bricks hit', value: hits }, { label: 'Balls left', value: lives }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Formation', value: level + ' / 4' }, { label: 'Balls', value: lives }, { label: 'Prisms', value: bricks.length }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      formation(); ui();
      return {
        update(dt) {
          if (ended) return;
          time = Math.max(0, time - dt); if (!time) { finish(false); return; }
          wide = Math.max(0, wide - dt); paddle.width = wide > 0 ? 190 : 128;
          const direction = Number(api.input.down('right')) - Number(api.input.down('left'));
          if (direction) paddle.x += direction * 640 * dt;
          else if (api.input.pointer.active && api.input.pointer.inside) paddle.x += clamp(api.input.pointer.x - paddle.x, -850 * dt, 850 * dt);
          paddle.x = clamp(paddle.x, 35 + paddle.width / 2, 925 - paddle.width / 2);
          if (transition > 0) { transition -= dt; if (transition <= 0) { transition = 0; level++; formation(); } ui(); return; }
          if (ball.waiting > 0) {
            ball.x = paddle.x; ball.y = 504;
            if (api.input.pressed('launch') || api.input.pointer.pressed || ball.waiting <= dt) launch();
            else ball.waiting -= dt;
          } else {
            for (let sub = 0; sub < 3; sub++) {
              const oldX = ball.x, oldY = ball.y; ball.x += ball.vx * dt / 3; ball.y += ball.vy * dt / 3;
              if (ball.x < 43 || ball.x > 917) { ball.x = clamp(ball.x, 43, 917); ball.vx *= -1; }
              if (ball.y < 54) { ball.y = 54; ball.vy = Math.abs(ball.vy); }
              if (ball.vy > 0 && oldY <= 511 && ball.y >= 511 && Math.abs(ball.x - paddle.x) <= paddle.width / 2 + 7) {
                const offset = clamp((ball.x - paddle.x) / (paddle.width / 2), -1, 1), speed = Math.min(620, Math.hypot(ball.vx, ball.vy) + 2);
                ball.y = 510; ball.vx = speed * Math.sin(offset * 1.08 + (Math.abs(offset) < 0.08 ? 0.08 : 0)); ball.vy = -Math.sqrt(Math.max(1, speed * speed - ball.vx * ball.vx)); api.sound('click', 0.9);
              }
              for (let i = 0; i < bricks.length; i++) {
                const b = bricks[i]; if (ball.x + 8 < b.x || ball.x - 8 > b.x + b.w || ball.y + 8 < b.y || ball.y - 8 > b.y + b.h) continue;
                if (oldY + 8 <= b.y || oldY - 8 >= b.y + b.h) { ball.vy *= -1; ball.y = oldY; } else { ball.vx *= -1; ball.x = oldX; }
                b.hp--; hits++; score += 10;
                if (!b.hp) { score += 45 + level * 8; bricks.splice(i, 1); api.burst(b.x + 37, b.y + 12, b.color, 9); if (api.random() < 0.14 && drops.length < 8) drops.push({ x: b.x + 37, y: b.y + 12, type: api.random() < 0.65 ? 'wide' : 'shield' }); }
                api.sound('hit', 0.8 + i % 5 * 0.12); break;
              }
              if (shield && ball.y > 554 && ball.vy > 0) { shield = false; ball.y = 553; ball.vy = -Math.abs(ball.vy); api.sound('good'); }
              if (ball.y > 620) { lives--; if (!lives) { finish(false); return; } ball.waiting = 2; api.sound('bad'); break; }
            }
          }
          for (let i = drops.length - 1; i >= 0; i--) {
            const d = drops[i]; d.y += 120 * dt;
            if (d.y >= 511 && d.y < 540 && Math.abs(d.x - paddle.x) < paddle.width / 2 + 10) { if (d.type === 'wide') wide = 12; else shield = true; score += 70; api.toast(d.type === 'wide' ? 'Wide paddle · 12 seconds' : 'Floor shield ready'); api.sound('good'); drops.splice(i, 1); }
            else if (d.y > 610) drops.splice(i, 1);
          }
          if (!bricks.length && !transition) { if (level === 4) { finish(true); return; } transition = 1.3; ball.waiting = 2; score += 250; api.toast('Formation cleared'); api.sound('win'); }
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 960, 600); g.addColorStop(0, '#12152e'); g.addColorStop(1, '#29203c'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
          ctx.strokeStyle = '#a5dff014'; ctx.lineWidth = 1; for (let x = 38; x < 960; x += 40) { ctx.beginPath(); ctx.moveTo(x, 45); ctx.lineTo(x, 564); ctx.stroke(); }
          ctx.strokeStyle = '#67e8f944'; ctx.lineWidth = 3; ctx.strokeRect(35, 45, 890, 519);
          bricks.forEach(b => { ctx.fillStyle = b.color; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 5); ctx.fill(); ctx.fillStyle = '#ffffff55'; ctx.fillRect(b.x + 5, b.y + 4, b.w - 10, 3); if (b.hp > 1) { ctx.strokeStyle = '#16263f88'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x + 16, b.y + 20); ctx.lineTo(b.x + 30, b.y + 4); ctx.moveTo(b.x + 39, b.y + 20); ctx.lineTo(b.x + 53, b.y + 4); ctx.stroke(); } });
          drops.forEach(d => { ctx.fillStyle = d.type === 'wide' ? '#67e8f9' : '#fbbf24'; ctx.beginPath(); ctx.roundRect(d.x - 15, d.y - 10, 30, 20, 6); ctx.fill(); ctx.fillStyle = '#122235'; ctx.font = '900 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(d.type === 'wide' ? '↔' : 'S', d.x, d.y + 4); });
          if (shield) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(38, 556); ctx.lineTo(922, 556); ctx.stroke(); }
          ctx.fillStyle = '#67e8f9'; ctx.beginPath(); ctx.roundRect(paddle.x - paddle.width / 2, 520, paddle.width, 16, 8); ctx.fill(); ctx.fillStyle = '#e0fbff'; ctx.fillRect(paddle.x - paddle.width / 2 + 15, 521, paddle.width - 30, 3);
          ctx.fillStyle = '#fff5d9'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.textAlign = 'center'; ctx.font = '800 14px system-ui'; ctx.fillStyle = '#a2bdd6'; ctx.fillText('FIND YOUR ANGLE', 480, 32);
          if (ball.waiting > 0 && !transition) { ctx.fillStyle = '#d1f7ff'; ctx.font = '700 20px system-ui'; ctx.fillText('SPACE / TAP TO LAUNCH', 480, 360); }
          if (transition > 0) { ctx.fillStyle = '#e0f2fe'; ctx.font = '900 38px system-ui'; ctx.fillText('A BEAUTIFUL BREAK.', 480, 350); }
          ctx.restore();
        },
        inspect() { return { level, lives, score, time, ended, hits, wide, shield, transition, paddle: { ...paddle }, ball: { ...ball }, bricks: bricks.map(b => ({ ...b })), drops: drops.map(d => ({ ...d })) }; }
      };
    }
  });
})();
