(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  Arcade.mount({
    id: 'pocket-striker', title: 'Pocket Striker', category: 'Sports', accent: '#6ee7a0',
    description: 'A whole stadium. Seventy-five seconds. Make the beautiful game yours.',
    howTo: [
      'Win a 75-second, three-a-side match. You attack the goal on the right.',
      'Move with arrows / WASD. Hold Shot (Space) to charge, release to shoot. Up / Down adjusts your aim. Sprint with Shift.',
      'Pass (E) sends the ball to your teammate and switches control. Without the ball, E switches players. Run into an opponent to tackle.'
    ],
    controls: [
      { id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] },
      { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] },
      { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] },
      { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] },
      { id: 'sprint', label: 'Sprint', keys: ['ShiftLeft', 'ShiftRight'] },
      { id: 'shoot', label: 'Shot', keys: ['Space'] },
      { id: 'pass', label: 'Pass / swap', keys: ['KeyE'] }
    ],
    medals: [500, 1200, 2200],
    create(api) {
      const field = { l: 80, r: 880, t: 94, b: 514, gy: 304, mouth: 76 };
      const players = [
        { x: 400, y: 304, team: 0, no: 9 }, { x: 300, y: 400, team: 0, no: 7 },
        { x: 625, y: 264, team: 1, no: 10 }, { x: 670, y: 390, team: 1, no: 8 }
      ];
      const keepers = [{ x: 101, y: 304, team: 0 }, { x: 859, y: 304, team: 1 }];
      const ball = { x: 422, y: 304, vx: 0, vy: 0, owner: 0, lock: 0.7, spin: 0 };
      let controlled = 0, us = 0, them = 0, time = 75, charge = 0, charging = false;
      let kickoff = 0.8, goalText = 'ATTACK THE RIGHT GOAL', goalTimer = 1.8;
      let stamina = 1, tackles = 0, passes = 0, shots = 0, saves = 0, ended = false;
      let matchScore = 0, aiShot = 0, tackleCooldown = 0, lastTouch = 0, turf = 0;
      const trails = [];
      const crowd = Array.from({ length: 120 }, () => ({ color: api.random() < 0.55 ? '#5ebc99' : '#436d95', offset: api.random() * 6 }));

      function ui() {
        api.score(matchScore);
        api.hud([{ label: 'Match', value: us + ' : ' + them }, { label: 'Time', value: Math.ceil(time) + 's' }, { label: 'Sprint', value: Math.round(stamina * 100) + '%' }]);
      }
      ui();
      function reset(kickingTeam) {
        const positions = [[400, 304], [300, 400], [560, 304], [665, 400]];
        players.forEach((p, i) => { p.x = positions[i][0]; p.y = positions[i][1]; });
        controlled = 0;
        ball.owner = kickingTeam === 0 ? 0 : 2;
        ball.x = players[ball.owner].x + (kickingTeam ? -22 : 22);
        ball.y = 304; ball.vx = ball.vy = 0; ball.lock = 1.4;
        charge = 0; charging = false; kickoff = 1.6; tackleCooldown = 1.3;
      }
      function kick(targetX, targetY, speed, lock) {
        const dx = targetX - ball.x, dy = targetY - ball.y, d = Math.hypot(dx, dy) || 1;
        lastTouch = ball.owner >= 0 ? players[ball.owner].team : lastTouch;
        ball.owner = -1; ball.vx = dx / d * speed; ball.vy = dy / d * speed;
        ball.lock = lock || 0.19; ball.spin += 0.8;
        api.sound('shoot', 0.8 + speed / 1200);
      }
      function goal(team) {
        if (team === 0) { us++; matchScore += 400 + Math.round(time * 2); goalText = 'GOOOAL!'; }
        else { them++; goalText = 'THEY SCORE. RESET & RESPOND.'; }
        goalTimer = 2; api.sound(team === 0 ? 'win' : 'bad');
        api.burst(team === 0 ? 892 : 68, field.gy, team === 0 ? '#6ee7a0' : '#ff947d', 36);
        api.shake(6); reset(team === 0 ? 1 : 0);
      }
      function moveToward(p, x, y, speed, dt) {
        const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
        if (d > 3) { const step = Math.min(d, speed * dt); p.x += dx / d * step; p.y += dy / d * step; }
      }
      function finish() {
        ended = true;
        const won = us > them, tied = us === them;
        matchScore += won ? 600 + Math.max(0, us - them) * 100 : tied ? 250 : 75;
        api.end({ score: matchScore, title: won ? 'Full time. Your stadium.' : tied ? 'Honours even.' : 'A comeback starts here.',
          message: us + '–' + them + '. ' + (won ? 'Quick passes opened the pitch. Can you keep a clean sheet next time?' : 'Move the defense with a pass, then charge your shot from a clear angle.'),
          stats: [{ label: 'Goals', value: us }, { label: 'Shots', value: shots }, { label: 'Passes', value: passes }, { label: 'Tackles', value: tackles }] });
      }
      return {
        update(dt) {
          if (ended) return;
          turf += dt;
          time = Math.max(0, time - dt); goalTimer = Math.max(0, goalTimer - dt);
          ball.lock = Math.max(0, ball.lock - dt); aiShot = Math.max(0, aiShot - dt);
          tackleCooldown = Math.max(0, tackleCooldown - dt);
          if (time <= 0) { finish(); return; }
          if (kickoff > 0) { kickoff -= dt; ui(); return; }
          const input = api.input;
          if (input.pressed('pass')) {
            const other = controlled === 0 ? 1 : 0;
            if (ball.owner === controlled) {
              kick(players[other].x, players[other].y, 470, 0.16);
              passes++; matchScore += 15;
            }
            controlled = other; charging = false; charge = 0;
            api.sound('click');
          }
          const player = players[controlled];
          let dx = Number(input.down('right')) - Number(input.down('left'));
          let dy = Number(input.down('down')) - Number(input.down('up'));
          const moving = !!(dx || dy), length = Math.hypot(dx, dy) || 1;
          const sprinting = input.down('sprint') && stamina > 0.06 && moving;
          const speed = sprinting ? 296 : 211;
          if (moving) { player.x += dx / length * speed * dt; player.y += dy / length * speed * dt; }
          stamina = clamp(stamina + (sprinting ? -0.38 : 0.21) * dt, 0, 1);

          // The teammate opens passing lanes and collects loose balls nearby.
          const partner = players[controlled === 0 ? 1 : 0];
          if (ball.owner >= 0 && players[ball.owner].team === 0) {
            moveToward(partner, clamp(player.x + 115, 190, 760), player.y < 304 ? 408 : 204, 148, dt);
          } else if (ball.owner < 0 && dist(partner, ball) < 190) moveToward(partner, ball.x, ball.y, 173, dt);
          else moveToward(partner, clamp(ball.x - 80, 170, 720), ball.y < 304 ? 392 : 216, 136, dt);

          for (let i = 2; i < 4; i++) {
            const p = players[i], closest = dist(players[2], ball) <= dist(players[3], ball) ? 2 : 3;
            if (ball.owner === i) {
              moveToward(p, 145, field.gy + Math.sin(turf * 1.6) * 40, 154, dt);
              if (p.x < 380 && aiShot <= 0) {
                kick(58, field.gy + (api.random() - 0.5) * 118, 500 + api.random() * 100, 0.25);
                aiShot = 1.5;
              }
            } else if (i === closest && !(ball.owner >= 2)) {
              moveToward(p, ball.x - (ball.owner >= 0 ? 8 : 0), ball.y, 167 + Math.min(14, us * 3), dt);
            } else {
              moveToward(p, clamp(ball.x + 115, 245, 750), ball.y < 304 ? 370 : 234, 128, dt);
            }
          }
          for (const p of players) { p.x = clamp(p.x, 115, 844); p.y = clamp(p.y, 117, 491); }

          if (input.down('shoot') && ball.owner === controlled) { charging = true; charge = Math.min(1, charge + dt / 0.85); }
          if (charging && !input.down('shoot')) {
            if (ball.owner === controlled) {
              const targetY = clamp(field.gy + dy * 62 + (player.y - field.gy) * 0.17, field.gy - 66, field.gy + 66);
              kick(916, targetY, 500 + charge * 400, 0.22); shots++;
            }
            charging = false; charge = 0;
          }
          if (ball.owner >= 0) {
            const owner = players[ball.owner], team = owner.team;
            ball.x = owner.x + (team === 0 ? 23 : -23); ball.y = owner.y + Math.sin(turf * 15) * 2;
            ball.vx = ball.vy = 0;
            if (ball.lock <= 0 && tackleCooldown <= 0) {
              for (let i = 0; i < players.length; i++) {
                if (players[i].team !== team && dist(players[i], owner) < 30) {
                  ball.owner = i; ball.lock = 0.95; tackleCooldown = 0.65;
                  if (i < 2) { tackles++; matchScore += 35; }
                  charging = false; charge = 0;
                  api.burst(ball.x, ball.y, '#fff7c4', 8); api.sound('hit', 1.2);
                  break;
                }
              }
            }
          } else {
            const steps = 3;
            for (let sub = 0; sub < steps; sub++) {
              ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps;
              if (ball.y < field.t + 8 || ball.y > field.b - 8) { ball.vy *= -0.72; ball.y = clamp(ball.y, field.t + 8, field.b - 8); }
              if (ball.x < field.l || ball.x > field.r) {
                if (Math.abs(ball.y - field.gy) < field.mouth - 7) { goal(ball.x > field.r ? 0 : 1); ui(); return; }
                ball.vx *= -0.72; ball.x = clamp(ball.x, field.l, field.r);
              }
              for (const keeper of keepers) {
                if (dist(ball, keeper) < 23 && ball.lock <= 0.1) {
                  const incoming = Math.hypot(ball.vx, ball.vy);
                  ball.vx = (keeper.team === 0 ? 1 : -1) * Math.max(230, incoming * 0.58);
                  ball.vy = (ball.y - keeper.y) * 11;
                  ball.x = keeper.x + (keeper.team === 0 ? 25 : -25); ball.lock = 0.22;
                  api.burst(ball.x, ball.y, '#ffda70', 9); api.sound('hit'); saves++;
                }
              }
            }
            const friction = Math.exp(-0.58 * dt); ball.vx *= friction; ball.vy *= friction;
            if (ball.lock <= 0) {
              let nearest = -1, distance = 28;
              players.forEach((p, i) => { const d = dist(p, ball); if (d < distance) { distance = d; nearest = i; } });
              if (nearest >= 0 && Math.hypot(ball.vx, ball.vy) < 560) {
                ball.owner = nearest; ball.lock = 0.6; lastTouch = players[nearest].team;
                if (nearest < 2) controlled = nearest;
                api.sound('click', 1.1);
              }
            }
          }
          // Keepers must travel: a placed shot can beat them across the goal.
          keepers.forEach(k => {
            const desired = clamp(ball.y, field.gy - 60, field.gy + 60);
            const dyK = desired - k.y;
            k.y += Math.sign(dyK) * Math.min(Math.abs(dyK), (k.team ? 98 : 112) * dt);
          });
          ball.spin += Math.hypot(ball.vx, ball.vy) * dt * 0.03;
          if (Math.hypot(ball.vx, ball.vy) > 350) trails.push({ x: ball.x, y: ball.y, life: 0.22 });
          trails.forEach(t => t.life -= dt); while (trails.length && trails[0].life <= 0) trails.shift();
          ui();
        },
        draw(ctx) {
          ctx.save();
          const bg = ctx.createLinearGradient(0, 0, 0, 600); bg.addColorStop(0, '#102c31'); bg.addColorStop(1, '#071a22');
          ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 600);
          // Two little grandstands make a real stadium out of a small canvas.
          for (let row = 0; row < 3; row++) for (let col = 0; col < 40; col++) {
            const c = crowd[row * 40 + col]; ctx.fillStyle = c.color;
            ctx.fillRect(48 + col * 22, 16 + row * 15 + Math.sin(turf * 2 + c.offset) * (goalTimer > 0 ? 2 : 0), 11, 7);
            ctx.fillRect(48 + col * 22, 546 + row * 15, 11, 7);
          }
          ctx.fillStyle = '#083d39'; ctx.fillRect(66, 80, 828, 448);
          for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#176448' : '#1c6e4f'; ctx.fillRect(80 + i * 80, 94, 80, 420); }
          ctx.strokeStyle = 'rgba(218,255,221,.67)'; ctx.lineWidth = 2;
          ctx.strokeRect(80, 94, 800, 420); ctx.beginPath(); ctx.moveTo(480, 94); ctx.lineTo(480, 514); ctx.stroke();
          ctx.beginPath(); ctx.arc(480, 304, 66, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(480, 304, 4, 0, Math.PI * 2); ctx.fillStyle = '#d9ffdf'; ctx.fill();
          ctx.strokeRect(80, 185, 124, 238); ctx.strokeRect(756, 185, 124, 238);
          ctx.strokeRect(80, 247, 47, 114); ctx.strokeRect(833, 247, 47, 114);
          [64, 896].forEach((x, index) => {
            ctx.fillStyle = '#183b42'; ctx.fillRect(x - 16, 228, 32, 152);
            ctx.strokeStyle = '#8bc3c2'; ctx.lineWidth = 1;
            for (let y = 228; y <= 380; y += 13) { ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y); ctx.stroke(); }
            for (let xx = x - 16; xx <= x + 16; xx += 8) { ctx.beginPath(); ctx.moveTo(xx, 228); ctx.lineTo(xx, 380); ctx.stroke(); }
            ctx.strokeStyle = index === 0 ? '#e5f3f0' : '#b9ffe5'; ctx.lineWidth = 4; ctx.strokeRect(x - 16, 228, 32, 152);
          });
          ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#79bb99';
          ctx.fillText('POCKET STRIKER   /   THE SMALL-SIDED SERIES', 480, 78);
          ctx.fillStyle = 'rgba(230,255,233,.18)'; ctx.font = '900 66px system-ui'; ctx.fillText('PLAY', 480, 490);
          function athlete(p, selected, keeper) {
            ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 13, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
            if (selected) {
              ctx.strokeStyle = '#b7ffe1'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, 23, 0, Math.PI * 2); ctx.stroke();
              ctx.fillStyle = '#c0ffe7'; ctx.beginPath(); ctx.moveTo(p.x - 7, p.y - 35); ctx.lineTo(p.x + 7, p.y - 35); ctx.lineTo(p.x, p.y - 27); ctx.fill();
            }
            ctx.fillStyle = keeper ? '#ffe19b' : p.team === 0 ? '#a4ffda' : '#ff8e7c';
            ctx.beginPath(); ctx.arc(p.x, p.y, keeper ? 15 : 16, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = keeper ? '#9a742e' : p.team === 0 ? '#197f6c' : '#ae483c'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(p.x, p.y, 15, Math.PI * 0.13, Math.PI * 0.87); ctx.stroke();
            if (!keeper) { ctx.fillStyle = '#163b3b'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(p.no, p.x, p.y + 5); }
          }
          keepers.forEach(p => athlete(p, false, true)); players.forEach((p, i) => athlete(p, i === controlled, false));
          trails.forEach(t => { ctx.globalAlpha = t.life * 1.6; ctx.fillStyle = '#fff3bd'; ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
          if (charging && ball.owner === controlled) {
            const yAim = clamp(field.gy + (Number(api.input.down('down')) - Number(api.input.down('up'))) * 62 + (players[controlled].y - field.gy) * 0.17, 238, 370);
            ctx.setLineDash([8, 8]); ctx.strokeStyle = '#fff0a4'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(894, yAim); ctx.stroke(); ctx.setLineDash([]);
            ctx.strokeStyle = '#ffe796'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(players[controlled].x, players[controlled].y, 28, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2); ctx.stroke();
          }
          ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.spin);
          ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 6; ctx.fillStyle = '#fffdeb'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = '#163a40'; ctx.fillRect(-3, -3, 6, 6); ctx.restore();
          ctx.fillStyle = '#0a2629'; ctx.fillRect(350, 14, 260, 42); ctx.fillStyle = '#c8ffdf'; ctx.font = '900 24px system-ui'; ctx.textAlign = 'center'; ctx.fillText('YOU  ' + us + ' : ' + them + '  RIVALS', 480, 44);
          if (goalTimer > 0) {
            ctx.fillStyle = 'rgba(6,30,31,.86)'; ctx.fillRect(190, 255, 580, 84); ctx.fillStyle = '#edffe6';
            ctx.font = '900 ' + (goalText.length > 20 ? '24' : '38') + 'px system-ui'; ctx.fillText(goalText, 480, 309);
          }
          ctx.restore();
        },
        cancelInput() { charging = false; charge = 0; },
        inspect() { return { time, us, them, score: matchScore, controlled, possession: ball.owner, ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy }, players: players.map(p => ({ x: p.x, y: p.y, team: p.team })), charge, stamina, shots, passes, tackles, saves, kickoff, ended, lastTouch }; }
      };
    }
  });
}());
