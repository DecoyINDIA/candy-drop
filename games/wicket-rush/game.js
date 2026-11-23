/* Wicket Rush: a two-over chase with timing, placement, lofting and risky running. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'wicket-rush', title: 'Wicket Rush', category: 'Cricket', accent: '#d7ef97',
    description: 'Two overs. Three wickets. A field full of gaps and a target worth chasing.',
    howTo: ['Chase 36 runs from 12 balls, with 3 wickets. Time your shot as the delivery reaches the crease. A miss costs a wicket.', 'Left / Right chooses one of five gaps. Space bats. L toggles lofted shots. Tap the field to choose a gap; use the Bat button to swing.', 'After contact, press R / Run to attempt a single. Run again only if there is time before the throw returns. Ground boundaries score 4; lofted boundaries score 6, but descending lofts can be caught.'],
    controls: [{ id: 'left', label: '← Gap', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Gap →', keys: ['ArrowRight', 'KeyD'] }, { id: 'loft', label: 'Loft', keys: ['KeyL', 'KeyX'] }, { id: 'bat', label: 'Bat', keys: ['Space'] }, { id: 'run', label: 'Run', keys: ['KeyR'] }],
    medals: [900, 2600, 4000],
    create(api) {
      let deliveries = 0, runs = 0, wickets = 0, lane = 2, loft = false, phase = 'ready', timer = 1.2, progress = 0, pitchDuration = 1.35;
      let swung = false, quality = 0, air = 0, running = 0, deliveryRuns = 0, playTime = 0, returnTime = 0, score = 0, boundaries = 0, goodHits = 0, ended = false, clock = 0, message = 'CHASE 36 FROM 12 BALLS';
      const angles = [-1.03, -0.51, 0, 0.51, 1.03], ball = { x: 480, y: 450, vx: 0, vy: 0 };
      const plan = Array.from({ length: 12 }, (_, i) => ({ duration: i === 0 ? 1.35 : 0.95 + api.random() * 0.7, field: Array.from({ length: 4 }, (_, j) => ({ x: 205 + j * 183 + (api.random() - 0.5) * 65, y: 170 + api.random() * 170 })) }));
      let fielders = plan[0].field.map(f => ({ ...f }));
      function hud() { score = runs * 90 + goodHits * 20; api.score(score); api.hud([{ label: 'Chase', value: runs + ' / 36' }, { label: 'Overs', value: Math.floor(deliveries / 6) + '.' + deliveries % 6 + ' / 2' }, { label: 'Wickets', value: wickets + ' / 3' }, { label: 'Shot', value: loft ? 'Loft' : 'Ground' }]); }
      function finish() { ended = true; const won = runs >= 36; score = runs * 90 + goodHits * 20 + (won ? 600 + (3 - wickets) * 100 : 0); api.end({ score, title: won ? 'Chase complete!' : 'The next chase awaits.', message: runs + ' runs, ' + wickets + ' wickets. ' + (won ? 'You found the gaps and trusted your timing.' : 'Choose a clear gap, then watch the return before asking for another run.'), stats: [{ label: 'Runs', value: runs }, { label: 'Balls faced', value: deliveries }, { label: 'Boundaries', value: boundaries }, { label: 'Wickets', value: wickets }] }); }
      function endBall(text, wicket) { if (wicket) wickets++; deliveries++; phase = 'between'; timer = 1.6; running = 0; message = text; api.sound(wicket ? 'bad' : 'good'); if (deliveries >= 12 || wickets >= 3 || runs >= 36) { hud(); finish(); } }
      function begin() { phase = 'pitch'; progress = 0; swung = false; running = 0; deliveryRuns = 0; air = 0; playTime = 0; pitchDuration = plan[deliveries].duration; fielders = plan[deliveries].field.map(f => ({ ...f })); message = 'WATCH THE DELIVERY'; }
      function bat() { if (phase !== 'pitch' || swung) return; swung = true; quality = clamp(1 - Math.abs(progress - 0.97) / 0.19, 0, 1); if (quality <= 0) { message = 'BEATEN BY THE BALL'; return; } goodHits++; phase = 'field'; ball.x = 480; ball.y = 450; const speed = 240 + quality * 270; ball.vx = Math.sin(angles[lane]) * speed; ball.vy = -Math.cos(angles[lane]) * speed; air = loft ? 0.45 + quality * 1.65 : 0; playTime = 0; message = loft ? 'IN THE AIR…' : 'INTO THE GAP. RUN?'; api.sound('hit', 1.25); }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; const input = api.input;
          if (input.pressed('left')) lane = Math.max(0, lane - 1); if (input.pressed('right')) lane = Math.min(4, lane + 1); if (input.pressed('loft')) loft = !loft;
          if (input.pointer.pressed && input.pointer.inside && input.pointer.y < 430) lane = clamp(Math.round((Math.atan2(input.pointer.x - 480, 450 - input.pointer.y) + 1.03) / 0.515), 0, 4);
          if (input.pressed('bat')) bat();
          if (input.pressed('run') && (phase === 'field' || phase === 'return') && running <= 0) { running = 1.15; message = 'RUNNING!'; }
          if (phase === 'ready' || phase === 'between') { timer -= dt; if (timer <= 0) begin(); }
          else if (phase === 'pitch') { progress += dt / pitchDuration; if (progress >= 1.16) { endBall('BOWLED! FIND THE TIMING.', true); if (ended) return; } }
          else if (phase === 'field' || phase === 'return') {
            playTime += dt;
            if (running > 0) { running -= dt; if (running <= 0) { runs++; deliveryRuns++; message = 'ONE MORE? WATCH THE FIELDER.'; api.sound('click', 1.5); } }
            if (phase === 'field') {
              air = Math.max(0, air - dt); ball.x += ball.vx * dt; ball.y += ball.vy * dt; const friction = Math.exp(-(air > 0 ? 0.32 : 1.15) * dt); ball.vx *= friction; ball.vy *= friction;
              if (((ball.x - 480) / 365) ** 2 + ((ball.y - 280) / 225) ** 2 >= 1) { const award = air > 0 ? 6 : 4; runs += award - deliveryRuns; boundaries++; api.burst(ball.x, ball.y, '#e8efad', 22); endBall(award === 6 ? 'SIX! INTO THE STANDS.' : 'FOUR! FOUND THE ROPE.', false); if (ended) return; }
              else {
                for (const f of fielders) { const dx = ball.x - f.x, dy = ball.y - f.y, d = Math.hypot(dx, dy); if (d > 1) { const step = Math.min(d, dt * 92); f.x += dx / d * step; f.y += dy / d * step; } if (Math.hypot(ball.x - f.x, ball.y - f.y) < 25 && air < 0.35) { if (air > 0 && loft) { endBall('CAUGHT! THE GAP WAS TOO SMALL.', true); if (ended) return; } else { phase = 'return'; returnTime = 0.55 + Math.hypot(ball.x - 480, ball.y - 450) / 370; message = 'THROW INCOMING. STAY HOME?'; } break; } }
                if (phase === 'field' && playTime > 7) { phase = 'return'; returnTime = 0.65; message = 'BALL COLLECTED. THROW INCOMING.'; }
              }
            } else { returnTime -= dt; if (returnTime <= 0) { endBall(running > 0 ? 'RUN OUT! A STEP TOO FAR.' : deliveryRuns ? deliveryRuns + ' RUN' + (deliveryRuns > 1 ? 'S' : '') + ' BANKED' : 'DOT BALL. RESET.', running > 0); if (ended) return; } }
          }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#163e38'; c.fillRect(0, 0, 960, 600); c.fillStyle = '#67915a'; c.beginPath(); c.ellipse(480, 280, 375, 235, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#e5e2b5'; c.lineWidth = 3; c.beginPath(); c.ellipse(480, 280, 365, 225, 0, 0, Math.PI * 2); c.stroke();
          for (let i = 0; i < 6; i++) { c.strokeStyle = '#94ac6a25'; c.lineWidth = 24; c.beginPath(); c.ellipse(480, 280, 80 + i * 48, 50 + i * 30, 0, 0, Math.PI * 2); c.stroke(); }
          c.fillStyle = '#c9bc85'; c.fillRect(451, 280, 58, 182); c.strokeStyle = '#fbf0cc'; c.lineWidth = 2; c.strokeRect(441, 433, 78, 18); c.strokeRect(441, 284, 78, 18);
          c.strokeStyle = '#f3dca7'; c.lineWidth = 3; for (let x = 473; x <= 487; x += 7) { c.beginPath(); c.moveTo(x, 453); c.lineTo(x, 469); c.stroke(); }
          c.fillStyle = '#bcd7ee'; c.beginPath(); c.arc(480, 285, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f3c18b'; c.beginPath(); c.arc(460, 450, 12, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ead4a7'; c.lineWidth = 6; c.beginPath(); c.moveTo(468, 446); c.lineTo(swung ? 496 : 468, swung ? 430 : 414); c.stroke();
          angles.forEach((a, i) => { c.strokeStyle = i === lane ? '#f3ecab99' : '#c5dda522'; c.lineWidth = i === lane ? 3 : 1; c.setLineDash([5, 9]); c.beginPath(); c.moveTo(480, 450); c.lineTo(480 + Math.sin(a) * 270, 450 - Math.cos(a) * 270); c.stroke(); }); c.setLineDash([]);
          fielders.forEach(f => { c.fillStyle = '#e9947c'; c.beginPath(); c.arc(f.x, f.y, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f5d5a7'; c.beginPath(); c.arc(f.x, f.y - 6, 5, 0, Math.PI * 2); c.fill(); });
          if (phase === 'pitch') { c.fillStyle = '#f7d1ad'; c.beginPath(); c.arc(480 + Math.sin(progress * Math.PI) * 13, 288 + progress * 163, 5, 0, Math.PI * 2); c.fill(); }
          if (phase === 'field' || phase === 'return') { c.fillStyle = '#263d2455'; c.beginPath(); c.ellipse(ball.x, ball.y + 4, 7, 4, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f6c89a'; c.beginPath(); c.arc(ball.x, ball.y - Math.sin(Math.min(1, air / 2) * Math.PI / 2) * 36, 6, 0, Math.PI * 2); c.fill(); }
          if (running > 0) { c.fillStyle = '#fff0ba'; c.beginPath(); c.arc(475, 450 - (1 - running / 1.15) * 153, 9, 0, Math.PI * 2); c.fill(); }
          c.textAlign = 'center'; c.fillStyle = '#eff1c8'; c.font = '900 29px system-ui'; c.fillText('WICKET / RUSH', 480, 35); c.font = '800 18px system-ui'; c.fillText(message, 480, 553); c.fillStyle = '#abcba3'; c.font = '14px system-ui'; c.fillText(runs + '/' + wickets + '   ·   TARGET 36   ·   ' + (12 - deliveries) + ' BALLS LEFT', 480, 582); c.restore();
        },
        inspect() { return { deliveries, runs, wickets, lane, loft, phase, timer, progress, pitchDuration, swung, quality, air, running, deliveryRuns, playTime, returnTime, score, boundaries, fielders: fielders.map(f => ({ ...f })), ball: { ...ball }, ended }; }
      };
    }
  });
})();
