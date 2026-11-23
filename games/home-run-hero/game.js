/* Home Run Hero: twelve varied pitches, contact timing and field placement. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'home-run-hero', title: 'Home Run Hero', category: 'Baseball', accent: '#ffcb8c',
    description: 'Twelve pitches. One sweet spot. Send the next one into the lights.',
    howTo: ['Take batting practice against 12 pitches: fastballs, changeups and curves. Swing as the ball reaches the glowing plate.', 'Left / Right chooses left field, center or right field. Space / Swing or tap the scene swings once per pitch.', 'Perfect timing drives home runs. Earlier or later contact makes shorter hits, and a weak hit toward a fielder becomes an out.'],
    controls: [{ id: 'left', label: '← Field', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Field →', keys: ['ArrowRight', 'KeyD'] }, { id: 'swing', label: 'Swing', keys: ['Space', 'KeyX'] }],
    medals: [1800, 4500, 7500],
    create(api) {
      let pitch = 0, phase = 'ready', timer = 1.3, progress = 0, duration = 1.15, kind = 'FASTBALL', aim = 1, swung = false, score = 0, hits = 0, homers = 0, best = 0, quality = 0, distance = 0, flight = 0, ended = false, clock = 0;
      let message = 'WAIT FOR YOUR PITCH', fielder = 1, curve = 0;
      const pitches = Array.from({ length: 12 }, (_, i) => ({ duration: i === 0 ? 1.25 : 0.88 + api.random() * 0.7, curve: i > 1 && api.random() < 0.4 ? (api.random() < 0.5 ? -1 : 1) : 0, fielder: Math.floor(api.random() * 3) }));
      function hud() { api.score(score); api.hud([{ label: 'Pitch', value: Math.min(12, pitch + 1) + ' / 12' }, { label: 'Home runs', value: homers }, { label: 'Aim', value: ['Left', 'Center', 'Right'][aim] }, { label: 'Best drive', value: best + ' ft' }]); }
      function begin() { const p = pitches[pitch]; duration = p.duration; curve = p.curve; fielder = p.fielder; kind = curve ? 'CURVEBALL' : duration > 1.3 ? 'CHANGEUP' : 'FASTBALL'; progress = 0; swung = false; phase = 'pitch'; message = kind; }
      function resolve() { phase = 'between'; timer = 1.5; }
      function swing() {
        if (phase !== 'pitch' || swung) return; swung = true;
        const timing = Math.abs(progress - 0.97); quality = clamp(1 - timing / 0.19, 0, 1);
        if (quality <= 0) { message = 'SWING & MISS'; api.sound('bad'); return; }
        distance = Math.round(100 + 340 * quality); best = Math.max(best, distance); flight = 0; phase = 'flight';
        const caught = quality < 0.7 && aim === fielder;
        if (quality > 0.87) { homers++; hits++; score += 650 + Math.round(quality * 180); message = 'HOME RUN!  ' + distance + ' FT'; }
        else if (caught) { score += 60; message = 'CAUGHT IN THE OUTFIELD'; }
        else { hits++; score += Math.round(100 + quality * 430); message = distance > 300 ? 'OFF THE WALL!  DOUBLE' : distance > 220 ? 'GAP SHOT!  DOUBLE' : 'BASE HIT'; }
        api.sound(quality > 0.87 ? 'win' : 'hit', 1.2); api.burst(480, 489, '#ffe4ad', 15);
      }
      function finish() { ended = true; score += hits >= 8 ? 350 : 0; api.end({ score, title: homers >= 5 ? 'You brought the power.' : 'The next pitch is yours.', message: homers + ' home runs in 12 pitches. Each pitch has its own rhythm; wait until the ball enters the plate.', stats: [{ label: 'Hits', value: hits }, { label: 'Home runs', value: homers }, { label: 'Longest drive', value: best + ' ft' }] }); }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; const input = api.input;
          if (input.pressed('left')) aim = Math.max(0, aim - 1); if (input.pressed('right')) aim = Math.min(2, aim + 1);
          if (input.pressed('swing') || input.pointer.pressed && input.pointer.inside) swing();
          if (phase === 'ready' || phase === 'between') { timer -= dt; if (timer <= 0) { if (phase === 'between') pitch++; if (pitch >= 12) { finish(); return; } begin(); } }
          else if (phase === 'pitch') { progress += dt / duration; if (progress >= 1.18) { message = swung ? 'SWING & MISS' : 'STRIKE. WATCH THE PLATE.'; api.sound('bad'); resolve(); } }
          else if (phase === 'flight') { flight += dt; if (flight >= 1.8) resolve(); }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#183b43'; c.fillRect(0, 0, 960, 600);
          c.fillStyle = '#28544f'; c.beginPath(); c.moveTo(480, 500); c.arc(480, 500, 430, Math.PI * 1.18, Math.PI * 1.82); c.closePath(); c.fill();
          c.strokeStyle = '#80bca0'; c.lineWidth = 5; c.beginPath(); c.arc(480, 500, 415, Math.PI * 1.18, Math.PI * 1.82); c.stroke();
          for (let i = 0; i < 7; i++) { c.strokeStyle = i % 2 ? '#34725933' : '#275c5033'; c.lineWidth = 45; c.beginPath(); c.arc(480, 500, 80 + i * 48, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); }
          c.fillStyle = '#ba8964'; c.beginPath(); c.moveTo(480, 502); c.lineTo(320, 342); c.lineTo(480, 182); c.lineTo(640, 342); c.closePath(); c.fill(); c.fillStyle = '#4e805b'; c.beginPath(); c.moveTo(480, 451); c.lineTo(370, 342); c.lineTo(480, 232); c.lineTo(590, 342); c.closePath(); c.fill();
          c.strokeStyle = '#f2e5c3'; c.lineWidth = 2; c.beginPath(); c.moveTo(166, 185); c.lineTo(480, 500); c.lineTo(794, 185); c.stroke();
          for (const [x, y] of [[320, 342], [480, 182], [640, 342]]) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillStyle = '#fff4d3'; c.fillRect(-7, -7, 14, 14); c.restore(); }
          c.fillStyle = '#dec5a5'; c.beginPath(); c.ellipse(480, 343, 22, 15, 0, 0, Math.PI * 2); c.fill();
          const fieldX = [290, 480, 670]; fieldX.forEach((x, i) => { c.fillStyle = i === fielder ? '#f2ae83' : '#658f8a'; c.beginPath(); c.arc(x, i === 1 ? 150 : 236, 12, 0, Math.PI * 2); c.fill(); });
          c.strokeStyle = '#f4c47b88'; c.setLineDash([5, 7]); c.beginPath(); c.moveTo(480, 490); c.lineTo(fieldX[aim], aim === 1 ? 96 : 180); c.stroke(); c.setLineDash([]);
          c.strokeStyle = '#f4d697'; c.lineWidth = 3; c.beginPath(); c.ellipse(480, 488, 35, 17, 0, 0, Math.PI * 2); c.stroke();
          c.fillStyle = '#edf0da'; c.beginPath(); c.moveTo(465, 483); c.lineTo(495, 483); c.lineTo(495, 498); c.lineTo(480, 507); c.lineTo(465, 498); c.fill();
          c.fillStyle = '#a4d1c2'; c.beginPath(); c.arc(444, 482, 13, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#e3bb89'; c.lineWidth = 7; c.beginPath(); c.moveTo(448, 478); c.lineTo(swung ? 503 : 420, swung ? 469 : 443); c.stroke();
          if (phase === 'pitch') { const t = Math.min(1.2, progress), x = 480 + Math.sin(t * Math.PI) * curve * 66, y = 348 + t * 145; c.fillStyle = '#fff3da'; c.beginPath(); c.arc(x, y, 3 + t * 5, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#bd654d'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 3 + t * 4, -1, 1); c.stroke(); }
          if (phase === 'flight') { const t = Math.min(1, flight / 1.8), x = 480 + (fieldX[aim] - 480) * t * 1.6, y = 488 - t * distance * 0.95 - Math.sin(t * Math.PI) * 100; c.fillStyle = '#fff4d0'; c.beginPath(); c.arc(x, y, 6 - t * 3, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = '#f2d8ab'; c.textAlign = 'center'; c.font = '900 30px system-ui'; c.fillText('HOME RUN / HERO', 480, 44); c.font = '700 17px system-ui'; c.fillStyle = '#c5dccb'; c.fillText(message, 480, 574);
          c.fillStyle = '#bbd4c9'; c.font = '13px system-ui'; c.textAlign = 'left'; c.fillText('PITCH ' + Math.min(12, pitch + 1) + ' / 12', 29, 81); c.textAlign = 'right'; c.fillText('AIM: ' + ['LEFT', 'CENTER', 'RIGHT'][aim], 930, 81); c.restore();
        },
        inspect() { return { pitch: pitch + 1, phase, timer, progress, duration, kind, curve, aim, fielder, swung, quality, score, hits, homers, best, distance, flight, ended }; }
      };
    }
  });
})();
