/* Reaction Lab — a visual timing game, with no claims about health or ability. */
(() => {
  'use strict';
  Arcade.mount({
    id: 'reaction-lab', title: 'Reaction Lab', category: 'Reaction timing', accent: '#b6deb6',
    description: 'A quiet moment. One clear signal. Twelve chances to find your rhythm.',
    howTo: ['Press Space or tap to arm each round. Wait for the circle to turn green and say NOW, then react.', 'An early press is a false start and scores zero. A missed signal also scores zero. The wait changes every round.', 'Complete twelve rounds. Quick, accurate responses earn more points; your result also shows your median successful response.'],
    controls: [{ id: 'react', label: 'Ready / React', keys: ['Space', 'Enter'] }], medals: [3500, 7000, 10000],
    create(api) {
      let phase = 'ready', round = 0, clock = 0, delay = 0, elapsed = 0, score = 0, falseStarts = 0, misses = 0, last = '', finished = false;
      const responses = [], results = [];
      function median() { const a = responses.slice().sort((a, b) => a - b); const n = a.length; return n ? Math.round(n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : 0; }
      function hud() { api.hud([{ label: 'Round', value: Math.min(12, round + 1) + '/12' }, { label: 'Clean signals', value: responses.length }, { label: 'False starts', value: falseStarts }, { label: 'Median', value: responses.length ? median() + ' ms' : '—' }]); }
      function complete(kind) {
        let points = 0;
        if (kind === 'hit') {
          const ms = Math.max(1, Math.round(clock * 1000)); responses.push(ms);
          points = Math.round(Math.max(0, Math.min(1000, 1000 - Math.max(0, ms - 150) * 2.5)));
          last = ms + ' ms'; api.sound('good');
        } else if (kind === 'early') { falseStarts++; last = 'A little too soon'; api.sound('bad'); }
        else { misses++; last = 'Signal missed'; api.sound('bad'); }
        results.push({ kind, points }); score += points; round++; api.score(score); phase = 'between'; clock = 0; hud();
        if (round === 12) {
          finished = true; phase = 'finished';
          api.end({ score, title: responses.length === 12 ? 'Twelve clean moments.' : 'Find a calmer rhythm.', message: 'This is a timing game. Your device, display and input all influence the response times shown.', stats: [{ label: 'Clean rounds', value: responses.length + '/12' }, { label: 'Median', value: responses.length ? median() + ' ms' : '—' }, { label: 'False starts', value: falseStarts }, { label: 'Misses', value: misses }] });
        }
      }
      function react() {
        if (phase === 'ready' || phase === 'between') { phase = 'wait'; clock = 0; delay = .9 + api.random() * 2.5; last = ''; api.sound('click'); }
        else if (phase === 'wait') complete('early');
        else if (phase === 'go') complete('hit');
      }
      hud();
      return {
        update(dt) {
          if (finished) return; elapsed += dt; clock += dt;
          if (phase === 'wait' && clock >= delay) { phase = 'go'; clock = 0; }
          else if (phase === 'go' && clock > 1.8) complete('miss');
          if (finished) return;
          if (api.input.pressed('react') || (api.input.pointer.pressed && api.input.pointer.inside)) react();
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#172c30'; c.fillRect(0, 0, 960, 600);
          c.strokeStyle = '#294245'; c.lineWidth = 1;
          for (let x = 40; x < 960; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 600); c.stroke(); }
          for (let y = 40; y < 600; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke(); }
          const color = phase === 'go' ? '#bbeab6' : phase === 'wait' ? '#c58e7e' : '#bdcdd0';
          c.fillStyle = color; c.beginPath(); c.arc(480, 270, 128, 0, Math.PI * 2); c.fill();
          c.strokeStyle = color + '50'; c.lineWidth = 2; c.beginPath(); c.arc(480, 270, 145, 0, Math.PI * 2); c.stroke();
          c.textAlign = 'center'; c.fillStyle = '#203c3d'; c.font = '800 42px system-ui';
          c.fillText(phase === 'go' ? 'NOW' : phase === 'wait' ? 'WAIT' : phase === 'between' ? 'NEXT' : 'READY', 480, 286);
          c.fillStyle = '#edf0df'; c.font = '700 26px system-ui'; c.fillText(last || (phase === 'wait' ? 'Let the signal come to you.' : phase === 'go' ? 'Press or tap.' : 'Press or tap when you are ready.'), 480, 451);
          c.fillStyle = '#9eb7b1'; c.font = '17px system-ui'; c.fillText('TWELVE ROUNDS · ONE CLEAR SIGNAL', 480, 65);
          c.fillText(phase === 'between' ? 'Start the next round at your pace.' : 'Space, Enter, or tap the circle.', 480, 487);
          for (let i = 0; i < 12; i++) { c.fillStyle = i < results.length ? results[i].kind === 'hit' ? '#b4ddb0' : '#c58e7e' : '#3b5351'; c.beginPath(); c.arc(315 + i * 30, 540, 7, 0, Math.PI * 2); c.fill(); }
          c.restore();
        },
        inspect() { return { phase, round, clock, delay, elapsed, score, falseStarts, misses, last, responses: responses.slice(), results: results.map(r => ({ ...r })), finished }; }
      };
    }
  });
})();
