/* Curling Cove: three ends, four stones per side, collision play and nearest-stone scoring. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), HX = 480, HY = 161;
  Arcade.mount({
    id: 'curling-cove', title: 'Curling Cove', category: 'Curling', accent: '#a5dfe9',
    description: 'A quiet sheet of ice. A very competitive little house.',
    howTo: ['Play 3 ends against the computer, with 4 stones per side per end. Only the team nearest the center scores: one point for each stone closer than the opponent’s nearest.', 'Left / Right aims. Up / Down sets weight. Space delivers a stone. Hold X / Sweep while your stone slides to make it travel farther. T reverses its curl.', 'Use about 48% weight for an unswept center draw. Stones collide: protect your best stone or knock a rival out of the scoring rings. Tap the ice to set your aim.'],
    controls: [{ id: 'left', label: 'Aim ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Aim ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'up', label: 'Weight +', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: 'Weight −', keys: ['ArrowDown', 'KeyS'] }, { id: 'throw', label: 'Deliver', keys: ['Space'] }, { id: 'sweep', label: 'Sweep', keys: ['KeyX'] }, { id: 'curl', label: 'Curl', keys: ['KeyT'] }],
    medals: [600, 1700, 3000],
    create(api) {
      let end = 1, turn = 0, us = 0, them = 0, score = 0, aim = 0, weight = 0.48, curl = 1, phase = 'aim', timer = 0, rollingAge = 0, stopped = 0, ended = false, active = null, clock = 0;
      let stones = [], endScores = [], message = 'YOUR FIRST STONE. FIND THE BUTTON.';
      function hud() { api.score(score); api.hud([{ label: 'End', value: end + ' / 3' }, { label: 'Match', value: us + ' : ' + them }, { label: 'Stone', value: Math.min(4, Math.floor(turn / 2) + 1) + ' / 4' }, { label: 'Weight', value: Math.round(weight * 100) + '%' }]); }
      function deliver(team, angle, amount, spin) { const speed = 135 + amount * 170; active = { x: 480, y: 520, vx: Math.sin(angle) * speed, vy: -Math.cos(angle) * speed, team, spin, live: true }; stones.push(active); phase = 'rolling'; rollingAge = stopped = 0; message = team ? 'RIVAL DELIVERS' : 'SWEEP FOR MORE DISTANCE'; api.sound('shoot', 0.5); }
      function scoreEnd() {
        const mine = stones.filter(s => s.live && s.team === 0 && Math.hypot(s.x - HX, s.y - HY) <= 107).map(s => Math.hypot(s.x - HX, s.y - HY)).sort((a, b) => a - b);
        const theirs = stones.filter(s => s.live && s.team === 1 && Math.hypot(s.x - HX, s.y - HY) <= 107).map(s => Math.hypot(s.x - HX, s.y - HY)).sort((a, b) => a - b);
        let a = 0, b = 0; if (mine.length && (!theirs.length || mine[0] < theirs[0])) a = mine.filter(d => !theirs.length || d < theirs[0]).length; else if (theirs.length && (!mine.length || theirs[0] < mine[0])) b = theirs.filter(d => !mine.length || d < mine[0]).length;
        us += a; them += b; score += a * 300 + Math.round(mine.reduce((sum, d) => sum + Math.max(0, 110 - d), 0)); endScores.push([a, b]); message = a ? 'YOUR END! +' + a : b ? 'RIVAL TAKES ' + b : 'BLANK END'; api.sound(a ? 'win' : b ? 'bad' : 'click');
        if (end >= 3) { ended = true; if (us > them) score += 800; api.end({ score, title: us > them ? 'You own the button.' : us === them ? 'An ice-cold draw.' : 'A good match on the ice.', message: us + '–' + them + ' after three ends. Protect the center, then use the last stone to change the picture.', stats: [{ label: 'Your points', value: us }, { label: 'Rival points', value: them }, { label: 'Ends played', value: 3 }] }); return; }
        phase = 'between'; timer = 2.3;
      }
      function settle() { active = null; turn++; if (turn >= 8) { scoreEnd(); return; } if (turn % 2) { phase = 'ai'; timer = 1.1; } else { phase = 'aim'; message = 'YOUR STONE. READ THE HOUSE.'; } }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; const input = api.input;
          if (phase === 'aim') {
            aim = clamp(aim + (Number(input.down('right')) - Number(input.down('left'))) * 0.5 * dt, -0.38, 0.38); weight = clamp(weight + (Number(input.down('up')) - Number(input.down('down'))) * 0.32 * dt, 0.05, 1);
            if (input.pressed('curl')) curl *= -1;
            if (input.pointer.down && input.pointer.inside && input.pointer.y < 450) aim = clamp(Math.atan2(input.pointer.x - 480, 520 - input.pointer.y), -0.38, 0.38);
            if (input.pressed('throw')) deliver(0, aim, weight, curl);
          } else if (phase === 'ai') {
            timer -= dt; if (timer <= 0) { const nearest = stones.filter(s => s.live && s.team === 0).sort((a, b) => Math.hypot(a.x - HX, a.y - HY) - Math.hypot(b.x - HX, b.y - HY))[0]; const target = nearest && turn >= 5 && Math.hypot(nearest.x - HX, nearest.y - HY) < 65 ? nearest : { x: HX + (api.random() - 0.5) * 65, y: HY + (api.random() - 0.5) * 45 }; const d = Math.hypot(target.x - 480, target.y - 520), speed = Math.sqrt(2 * 66 * d) + (target === nearest ? 35 : (api.random() - 0.5) * 12); deliver(1, Math.atan2(target.x - 480, 520 - target.y) - 0.018, clamp((speed - 135) / 170, 0.1, 1), 1); }
          } else if (phase === 'between') { timer -= dt; if (timer <= 0) { end++; turn = 0; stones = []; phase = 'aim'; message = 'NEW END. A CLEAN SHEET.'; } }
          if (phase === 'rolling') {
            rollingAge += dt; let motion = 0;
            for (let sub = 0; sub < 3; sub++) {
              const step = dt / 3;
              for (const s of stones) { if (!s.live) continue; let speed = Math.hypot(s.vx, s.vy); if (speed > 0) { if (s === active && speed > 15) s.vx += s.spin * 3.1 * step; const loss = (s === active && s.team === 0 && input.down('sweep') ? 40 : 66) * step, next = Math.max(0, speed - loss); s.vx *= next / speed; s.vy *= next / speed; s.x += s.vx * step; s.y += s.vy * step; if (s.x < 308 || s.x > 652 || s.y < 41 || s.y > 556) s.live = false; } }
              for (let i = 0; i < stones.length; i++) for (let j = i + 1; j < stones.length; j++) { const a = stones[i], b = stones[j]; if (!a.live || !b.live) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if (d > 0 && d < 26) { const nx = dx / d, ny = dy / d, overlap = (26 - d) / 2; a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap; const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (closing > 0) { const impulse = closing * 0.96; a.vx -= impulse * nx; a.vy -= impulse * ny; b.vx += impulse * nx; b.vy += impulse * ny; if (closing > 18) api.sound('hit', 1.5); } } }
            }
            for (const s of stones) if (s.live) motion += Math.hypot(s.vx, s.vy);
            if (motion < 2) stopped += dt; else stopped = 0;
            if (stopped > 0.45 || rollingAge > 10) { for (const s of stones) s.vx = s.vy = 0; settle(); if (ended) return; }
          }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#1a3b4e'; c.fillRect(0, 0, 960, 600); c.fillStyle = '#bddde0'; c.fillRect(289, 23, 382, 554); c.fillStyle = '#e7f0e8'; c.fillRect(304, 35, 352, 530);
          c.strokeStyle = '#9cb9c333'; c.lineWidth = 1; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(315 + i * 35, 38); c.lineTo(322 + i * 35, 563); c.stroke(); }
          for (const [r, color] of [[95, '#89b9c8'], [66, '#f3f3e7'], [36, '#d98d7d'], [13, '#f4ead5']]) { c.fillStyle = color; c.beginPath(); c.arc(HX, HY, r, 0, Math.PI * 2); c.fill(); }
          c.strokeStyle = '#7b9eaa88'; c.lineWidth = 1; c.beginPath(); c.moveTo(HX, 35); c.lineTo(HX, 565); c.moveTo(304, HY); c.lineTo(656, HY); c.stroke(); c.strokeStyle = '#cc8c82'; c.lineWidth = 3; c.beginPath(); c.moveTo(304, 393); c.lineTo(656, 393); c.stroke(); c.fillStyle = '#6a8a94'; c.fillRect(462, 538, 36, 6);
          if (phase === 'aim') { c.strokeStyle = '#627d86aa'; c.setLineDash([4, 8]); c.lineWidth = 2; c.beginPath(); c.moveTo(480, 520); c.lineTo(480 + Math.sin(aim) * 340, 520 - Math.cos(aim) * 340); c.stroke(); c.setLineDash([]); }
          function stone(s) { c.fillStyle = '#46677744'; c.beginPath(); c.ellipse(s.x + 3, s.y + 4, 15, 10, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#718990'; c.beginPath(); c.arc(s.x, s.y, 13, 0, Math.PI * 2); c.fill(); c.fillStyle = s.team === 0 ? '#d78d74' : '#619ab3'; c.beginPath(); c.arc(s.x, s.y - 1, 10, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#f8eedb'; c.lineWidth = 3; c.beginPath(); c.moveTo(s.x - 5, s.y - 2); c.lineTo(s.x + 5, s.y - 2); c.stroke(); }
          stones.filter(s => s.live).forEach(stone); if (phase === 'aim') stone({ x: 480, y: 520, team: 0 });
          if (phase === 'rolling' && active && active.team === 0 && api.input.down('sweep')) { c.strokeStyle = '#d3ab7d'; c.lineWidth = 5; c.beginPath(); c.moveTo(active.x - 40, active.y - 45); c.lineTo(active.x + 30, active.y - 15); c.stroke(); c.strokeStyle = '#8ab8b6'; c.lineWidth = 9; c.beginPath(); c.moveTo(active.x + 17, active.y - 27); c.lineTo(active.x + 39, active.y - 8); c.stroke(); }
          c.fillStyle = '#dce7dd'; c.font = '900 30px Georgia,serif'; c.textAlign = 'left'; c.fillText('Curling', 35, 94); c.fillText('Cove', 35, 130); c.fillStyle = '#9fbfc7'; c.font = '14px system-ui'; c.fillText('THREE ENDS.', 37, 169); c.fillText('EVERY STONE MATTERS.', 37, 192);
          c.fillStyle = '#f0d8b0'; c.font = '900 46px system-ui'; c.fillText(us + ' : ' + them, 37, 282); c.fillStyle = '#a5c2cd'; c.font = '13px system-ui'; c.fillText('YOU       RIVAL', 39, 307);
          c.fillStyle = '#cbded6'; c.font = '800 18px system-ui'; c.fillText('END ' + end + ' / 3', 714, 98); c.font = '14px system-ui'; endScores.forEach((s, i) => c.fillText('END ' + (i + 1) + '      ' + s[0] + ' : ' + s[1], 714, 139 + i * 29));
          c.fillStyle = '#d1e0d3'; c.font = 'bold 14px system-ui'; c.fillText('WEIGHT ' + Math.round(weight * 100) + '%', 714, 307); c.fillStyle = '#385c6b'; c.fillRect(714, 326, 190, 8); c.fillStyle = '#d7b392'; c.fillRect(714, 326, weight * 190, 8); c.fillStyle = '#9cbcc8'; c.fillText(curl > 0 ? 'CURL: CLOCKWISE ↷' : 'CURL: ANTICLOCKWISE ↶', 714, 371);
          c.textAlign = 'center'; c.fillStyle = '#dce7dd'; c.font = 'bold 15px system-ui'; c.fillText(message, 480, 594); c.restore();
        },
        inspect() { return { end, turn, us, them, score, aim, weight, curl, phase, timer, rollingAge, stopped, stones: stones.map(s => ({ ...s })), endScores: endScores.map(s => s.slice()), ended }; }
      };
    }
  });
})();
