/* Pocket Bowler: ten frames, pin collisions, spares, strikes and tenth-frame bonuses. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function total(rolls) {
    let score = 0, i = 0;
    for (let f = 0; f < 10 && i < rolls.length; f++) {
      if (rolls[i] === 10) { score += 10 + (rolls[i + 1] || 0) + (rolls[i + 2] || 0); i++; }
      else { const pair = rolls[i] + (rolls[i + 1] || 0); score += pair + (pair === 10 ? rolls[i + 2] || 0 : 0); i += 2; }
    }
    return score;
  }
  Arcade.mount({
    id: 'pocket-bowler', title: 'Pocket Bowler', category: 'Bowling', accent: '#ffc78b',
    description: 'Ten frames under the lights. Find the pocket. Make the pins talk.',
    howTo: ['Play all 10 frames with standard strike and spare bonuses. A strike or spare in frame 10 earns bonus balls. The scoreboard includes bonuses as those rolls arrive.', 'Left / Right changes your starting position. Q / E aims, T cycles hook, and Space bowls. Tap the approach to set your starting position.', 'The oil pattern changes each frame and bends the ball in the indicated direction. Aim beside the front pin for a chain reaction, then adjust for any spare.'],
    controls: [{ id: 'left', label: '← Position', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Position →', keys: ['ArrowRight', 'KeyD'] }, { id: 'aimLeft', label: 'Aim ↶', keys: ['KeyQ'] }, { id: 'aimRight', label: 'Aim ↷', keys: ['KeyE'] }, { id: 'hook', label: 'Hook', keys: ['KeyT'] }, { id: 'bowl', label: 'Bowl', keys: ['Space'] }],
    medals: [700, 1400, 2200],
    create(api) {
      let frame = 1, local = [], rolls = [], frames = [], x = 480, aim = 0.012, hook = 0, rolling = false, rollAge = 0, delay = 0, ended = false;
      let pins = [], knocksBefore = 0, strikes = 0, spares = 0, banner = 'FIND THE POCKET', bannerTime = 2, clock = 0, gutter = false, score = 0;
      const oilPattern = Array.from({ length: 10 }, () => (api.random() < 0.5 ? -1 : 1) * (28 + api.random() * 36));
      const ball = { x, y: 502, vx: 0, vy: 0, spin: 0 };
      const hooks = [0, -1, 1];
      function rack() { pins = []; for (let row = 0; row < 4; row++) for (let col = 0; col <= row; col++) pins.push({ x: 480 + (col - row / 2) * 30, y: 200 - row * 32, vx: 0, vy: 0, down: false }); }
      rack();
      function hud() { score = total(rolls) * 10; api.score(score); api.hud([{ label: 'Frame', value: frame + ' / 10' }, { label: 'Ball', value: local.length + 1 }, { label: 'Bowling score', value: total(rolls) }, { label: 'Hook', value: hook < 0 ? 'Left' : hook > 0 ? 'Right' : 'Straight' }, { label: 'Lane drift', value: oilPattern[frame - 1] < 0 ? '← Left' : 'Right →' }]); }
      function finish() { ended = true; score = total(rolls) * 10; api.end({ score, title: total(rolls) >= 180 ? 'A night worth framing.' : 'Ten frames in the books.', message: total(rolls) + ' / 300. Strikes build a score; picking up the spare keeps the whole game moving.', stats: [{ label: 'Bowling total', value: total(rolls) }, { label: 'Strikes', value: strikes }, { label: 'Spares', value: spares }, { label: 'Balls bowled', value: rolls.length }] }); }
      function settle() {
        rolling = false;
        const count = pins.filter(p => p.down).length - knocksBefore; rolls.push(count); local.push(count);
        const strike = count === 10, spare = local.length === 2 && local[0] !== 10 && local[0] + count === 10;
        if (strike) strikes++; if (spare) spares++;
        banner = strike ? 'STRIKE!' : spare ? 'SPARE!' : count ? count + ' PINS DOWN' : gutter ? 'GUTTER. RESET YOUR LINE.' : 'NO PINS. NEXT BALL.'; bannerTime = 1.5; api.sound(strike || spare ? 'win' : count ? 'good' : 'bad');
        if (frame < 10) {
          if (strike || local.length === 2) { frames.push(local.slice()); frame++; local = []; rack(); }
        } else {
          if (local.length === 1 && strike) rack();
          else if (local.length === 2) {
            if (local[0] === 10) { if (count === 10) rack(); }
            else if (local[0] + count === 10) rack();
            else { frames.push(local.slice()); finish(); return; }
          } else if (local.length === 3) { frames.push(local.slice()); finish(); return; }
        }
        ball.x = x; ball.y = 502; ball.vx = ball.vy = 0; delay = 1.1; hud();
      }
      function bowl() { if (rolling || delay > 0 || ended) return; rolling = true; rollAge = 0; gutter = false; knocksBefore = pins.filter(p => p.down).length; ball.x = x; ball.y = 502; ball.vx = Math.sin(aim) * 330; ball.vy = -Math.cos(aim) * 330; api.sound('shoot', 0.65); }
      function knock(pin, vx, vy) { if (!pin.down) { pin.down = true; api.sound('hit', 1 + pin.y / 500); } pin.vx += vx; pin.vy += vy; }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; delay = Math.max(0, delay - dt); bannerTime = Math.max(0, bannerTime - dt);
          const input = api.input;
          if (!rolling && delay <= 0) {
            x = clamp(x + (Number(input.down('right')) - Number(input.down('left'))) * 150 * dt, 320, 640);
            aim = clamp(aim + (Number(input.down('aimRight')) - Number(input.down('aimLeft'))) * 0.28 * dt, -0.45, 0.45);
            if (input.pressed('hook')) hook = hooks[(hooks.indexOf(hook) + 1) % hooks.length];
            if (input.pointer.down && input.pointer.inside && input.pointer.y > 350) x = clamp(input.pointer.x, 320, 640);
            ball.x = x; if (input.pressed('bowl')) bowl();
          }
          if (rolling) {
            rollAge += dt;
            for (let stepIndex = 0; stepIndex < 3; stepIndex++) {
              const step = dt / 3; if (!gutter) ball.vx += (oilPattern[frame - 1] + (ball.y < 330 ? hook * 45 : 0)) * step;
              ball.x += ball.vx * step; ball.y += ball.vy * step; ball.spin += 5 * step;
              if (ball.x < 303 || ball.x > 657) { gutter = true; ball.x = ball.x < 480 ? 289 : 671; ball.vx = 0; }
              for (const pin of pins) {
                if (!pin.down && !gutter) {
                  const dx = pin.x - ball.x, dy = pin.y - ball.y, d = Math.hypot(dx, dy);
                  if (d < 24 && d > 0) { const speed = Math.hypot(ball.vx, ball.vy); knock(pin, dx / d * speed * 0.9 + ball.vx * 0.5, dy / d * speed * 0.9 + ball.vy * 0.5); ball.vx -= dx / d * 12; ball.vy *= 0.96; }
                }
                if (pin.down) { pin.x += pin.vx * step; pin.y += pin.vy * step; pin.vx *= Math.exp(-3.2 * step); pin.vy *= Math.exp(-3.2 * step); }
              }
              for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
                const a = pins[i], b = pins[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
                if (d > 0 && d < 28 && a.down !== b.down) {
                  const mover = a.down ? a : b, target = a.down ? b : a, speed = Math.hypot(mover.vx, mover.vy);
                  if (speed > 22) { const sign = a.down ? 1 : -1; knock(target, dx / d * speed * 0.75 * sign, dy / d * speed * 0.75 * sign); mover.vx *= 0.45; mover.vy *= 0.45; }
                }
              }
            }
            if (rollAge >= 2.6) { settle(); if (ended) return; }
          }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#202139'; c.fillRect(0, 0, 960, 600); c.fillStyle = '#11162b'; c.fillRect(244, 45, 472, 530);
          const wood = c.createLinearGradient(300, 0, 660, 0); wood.addColorStop(0, '#c19466'); wood.addColorStop(0.5, '#ead0a0'); wood.addColorStop(1, '#ba8c64'); c.fillStyle = wood; c.fillRect(302, 61, 356, 500);
          c.strokeStyle = '#99744e55'; c.lineWidth = 1; for (let xx = 310; xx < 660; xx += 17) { c.beginPath(); c.moveTo(xx, 61); c.lineTo(xx, 561); c.stroke(); }
          c.fillStyle = '#33394c'; c.fillRect(278, 61, 24, 500); c.fillRect(658, 61, 24, 500); c.fillStyle = '#50485b'; c.fillRect(280, 61, 7, 500); c.fillRect(671, 61, 7, 500);
          c.fillStyle = '#775743'; c.fillRect(302, 475, 356, 5); for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(480 + i * 33, 338 + Math.abs(i) * 8, 3, 0, Math.PI * 2); c.fill(); }
          if (!rolling) { c.strokeStyle = '#6c584a99'; c.lineWidth = 2; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(x, 495); c.lineTo(x + Math.sin(aim) * 230, 495 - Math.cos(aim) * 230); c.stroke(); c.setLineDash([]); }
          pins.forEach(pin => { c.save(); c.translate(pin.x, pin.y); if (pin.down) c.rotate(Math.atan2(pin.vy, pin.vx) + 1); c.globalAlpha = pin.down ? 0.45 : 1; c.fillStyle = '#3a302633'; c.beginPath(); c.ellipse(3, 6, 12, 7, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff7df'; c.beginPath(); c.roundRect(-8, -15, 16, 30, 7); c.fill(); c.fillStyle = '#d56565'; c.fillRect(-7, -7, 14, 4); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -13, 6, 0, Math.PI * 2); c.fill(); c.restore(); });
          c.fillStyle = '#57c9c6'; c.beginPath(); c.arc(ball.x, ball.y, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = '#164453'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(ball.x + Math.cos(ball.spin + i * 2.1) * 5, ball.y + Math.sin(ball.spin + i * 2.1) * 5, 2.3, 0, Math.PI * 2); c.fill(); }
          c.textAlign = 'left'; c.fillStyle = '#f4d6b0'; c.font = '900 30px system-ui'; c.fillText('POCKET', 32, 93); c.fillText('BOWLER', 32, 130); c.font = '14px system-ui'; c.fillStyle = '#a8a9bf'; c.fillText('TEN FRAMES.', 34, 166); c.fillText('ONE GOOD NIGHT.', 34, 187);
          c.fillStyle = '#c1d4d3'; c.font = '900 54px system-ui'; c.fillText(total(rolls), 34, 283); c.font = '12px system-ui'; c.fillStyle = '#9a9fb6'; c.fillText('BOWLING SCORE / 300', 34, 306); c.fillStyle = '#93cfcd'; c.fillText('OIL PATTERN / FRAME ' + frame, 34, 360); c.font = '900 21px system-ui'; c.fillText(oilPattern[frame - 1] < 0 ? '← DRIFTS LEFT' : 'DRIFTS RIGHT →', 34, 393);
          c.fillStyle = '#f4d6b0'; c.font = '800 17px system-ui'; c.fillText('FRAME ' + frame, 752, 95);
          const all = frames.concat(ended ? [] : [local]); for (let i = 0; i < 10; i++) { const yy = 132 + i * 35; c.fillStyle = i === frame - 1 ? '#414258' : '#2b2e43'; c.fillRect(748, yy - 18, 176, 29); c.fillStyle = '#9cabc0'; c.font = 'bold 12px system-ui'; c.fillText(i + 1, 760, yy + 1); const row = all[i] || []; c.fillStyle = '#efe0be'; c.font = '800 15px system-ui'; c.fillText(row.map((n, j) => n === 10 ? 'X' : j > 0 && row[j - 1] !== 10 && row[j - 1] + n === 10 ? '/' : n || '–').join('   '), 797, yy + 2); }
          c.textAlign = 'center'; c.fillStyle = '#e6e1cd'; c.font = 'bold 16px system-ui'; c.fillText(bannerTime > 0 ? banner : rolling ? 'LET IT ROLL.' : 'LINE IT UP. COMMIT TO THE SHOT.', 480, 588); c.restore();
        },
        inspect() { return { frame, local: local.slice(), rolls: rolls.slice(), frames: frames.map(f => f.slice()), bowlingScore: total(rolls), score, x, aim, hook, oil: oilPattern[frame - 1], rolling, rollAge, delay, strikes, spares, gutter, pins: pins.map(p => ({ ...p })), ball: { ...ball }, ended }; }
      };
    }
  });
})();
