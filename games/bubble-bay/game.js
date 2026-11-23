(function () {
  'use strict';
  const R = 20, COLS = 12, ROWS = 11, STEP = 35, LEFT = 239, TOP = 82, palette = ['#fb7185', '#fbbf24', '#5eead4', '#93c5fd'];
  const pos = (row, col) => ({ x: LEFT + col * 40 + (row % 2 ? 20 : 0), y: TOP + row * STEP });
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'bubble-bay', title: 'Bubble Bay', category: 'Bubble shooter', accent: '#5eead4',
    description: 'Bank a bright little shot. Let the whole cluster drift away.',
    howTo: ['Match at least three connected bubbles of one color. Bubbles disconnected from the ceiling fall away too. Clear the bay within 40 shots and 150 seconds.', 'Aim with Left / Right and fire with Space. Point or tap above the launcher to aim and shoot. X swaps your current and next bubble.', 'Five shots without a match bring a new ceiling row. The run ends if bubbles reach the warning line. Bank shots off the side rails to reach awkward gaps.'],
    controls: [{ id: 'left', label: 'Aim ↶', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Aim ↷', keys: ['ArrowRight', 'KeyD'] }, { id: 'shoot', label: 'Shoot', keys: ['Space'] }, { id: 'swap', label: 'Swap', keys: ['KeyX'] }], medals: [900, 2300, 4000],
    create(api) {
      let board = [], angle = -Math.PI / 2, shot = null, shots = 0, misses = 0, score = 0, time = 150, ended = false, popped = 0, falling = [];
      for (let row = 0; row < 4; row++) for (let col = 0; col < COLS; col++) board.push({ row, col, color: Math.floor((col / 2 + row + api.random() * 1.3)) % 4 });
      function choose() { const colors = [...new Set(board.map(b => b.color))]; return colors.length ? colors[Math.floor(api.random() * colors.length)] : 0; }
      let current = choose(), next = choose();
      function neighbors(b) { return board.filter(a => a !== b && Math.hypot(pos(a.row, a.col).x - pos(b.row, b.col).x, pos(a.row, a.col).y - pos(b.row, b.col).y) < 42); }
      function flood(first, color) { const seen = new Set(first), queue = first.slice(); for (let i = 0; i < queue.length; i++) for (const n of neighbors(queue[i])) if (!seen.has(n) && (color === undefined || n.color === color)) { seen.add(n); queue.push(n); } return seen; }
      function finish(won) { if (ended) return; ended = true; if (won) score += 1000 + (40 - shots) * 65 + Math.floor(time * 5); api.score(score); api.end({ score, title: won ? 'A perfectly clear bay.' : 'The tide will turn.', message: won ? 'Every bubble set free. Ceiling connections can be worth more than the obvious match.' : 'Look for groups anchored by a single color. Swap before firing, and use the side rails to reach them.', stats: [{ label: 'Bubbles freed', value: popped }, { label: 'Shots', value: shots + ' / 40' }, { label: 'Seconds left', value: Math.ceil(time) }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Shots left', value: 40 - shots }, { label: 'Pressure', value: misses + ' / 5' }, { label: 'Bubbles', value: board.length }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      function fire() { if (shot || ended) return; shots++; shot = { x: 480, y: 529, vx: Math.cos(angle) * 590, vy: Math.sin(angle) * 590, color: current }; current = next; next = choose(); api.sound('shoot', 1.2); }
      function settle(impact) {
        const candidates = [];
        for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
          if (board.some(b => b.row === row && b.col === col)) continue;
          const p = pos(row, col); if (impact ? Math.hypot(p.x - pos(impact.row, impact.col).x, p.y - pos(impact.row, impact.col).y) < 42 : row === 0) candidates.push({ row, col, distance: Math.hypot(p.x - shot.x, p.y - shot.y) });
        }
        candidates.sort((a, b) => a.distance - b.distance); if (!candidates.length) { finish(false); return; }
        const b = { row: candidates[0].row, col: candidates[0].col, color: shot.color }; board.push(b); shot = null;
        const matched = flood([b], b.color);
        if (matched.size >= 3) {
          let removed = [...matched]; board = board.filter(a => !matched.has(a));
          const anchored = flood(board.filter(a => a.row === 0)); removed = removed.concat(board.filter(a => !anchored.has(a))); board = board.filter(a => anchored.has(a));
          removed.forEach(a => { const p = pos(a.row, a.col); falling.push({ x: p.x, y: p.y, color: a.color, vy: 70, life: 1 }); });
          falling = falling.slice(-100); popped += removed.length; score += removed.length * 35 + Math.max(0, removed.length - 3) * 15; misses = 0; api.sound('good', 1.2);
          if (!board.length) { finish(true); return; }
          if (!board.some(a => a.color === current)) current = choose(); if (!board.some(a => a.color === next)) next = choose();
        } else { misses++; api.sound('click'); }
        if (misses >= 5) { misses = 0; board.forEach(a => a.row++); for (let col = 0; col < COLS; col++) board.push({ row: 0, col, color: Math.floor(api.random() * 4) }); api.toast('The tide rises · new ceiling row'); }
        if (board.some(a => a.row >= ROWS - 1) || shots >= 40) finish(false);
      }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; }
          angle = clamp(angle + (Number(api.input.down('right')) - Number(api.input.down('left'))) * 1.3 * dt, -Math.PI + 0.2, -0.2);
          const p = api.input.pointer;
          if (p.active && p.inside && p.y < 490 && !api.input.down('left') && !api.input.down('right')) angle = clamp(Math.atan2(p.y - 529, p.x - 480), -Math.PI + 0.2, -0.2);
          if (api.input.pressed('swap') && !shot) { [current, next] = [next, current]; api.sound('click'); }
          if (api.input.pressed('shoot') || p.pressed && p.inside && p.y < 490) fire();
          if (shot) for (let sub = 0; sub < 3; sub++) {
            shot.x += shot.vx * dt / 3; shot.y += shot.vy * dt / 3;
            if (shot.x < LEFT || shot.x > LEFT + 460) { shot.x = clamp(shot.x, LEFT, LEFT + 460); shot.vx *= -1; }
            const impact = board.find(b => { const at = pos(b.row, b.col); return Math.hypot(at.x - shot.x, at.y - shot.y) <= 39; });
            if (impact || shot.y <= TOP) { settle(impact); break; }
          }
          if (ended) return;
          falling = falling.filter(f => f.life > 0); falling.forEach(f => { f.life -= dt; f.vy += 390 * dt; f.y += f.vy * dt; }); ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#153e55'); g.addColorStop(1, '#0c233c'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
          for (let i = 0; i < 7; i++) { ctx.strokeStyle = '#8adbc018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(110 + i * 135, 620, 65 + i % 3 * 15, Math.PI, TAU()); ctx.stroke(); }
          ctx.fillStyle = '#0b263780'; ctx.beginPath(); ctx.roundRect(214, 55, 510, 426, 22); ctx.fill(); ctx.strokeStyle = '#70c8d444'; ctx.lineWidth = 2; ctx.strokeRect(219, 61, 500, 420);
          ctx.setLineDash([7, 7]); ctx.strokeStyle = '#fb718599'; ctx.beginPath(); ctx.moveTo(221, 432); ctx.lineTo(718, 432); ctx.stroke(); ctx.setLineDash([]);
          const bubble = (x, y, color, r = R) => { ctx.fillStyle = palette[color]; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffff70'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.23, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#17364a'; ctx.font = '800 ' + Math.round(r * 0.7) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(color + 1, x, y + r * 0.26); };
          board.forEach(b => { const p = pos(b.row, b.col); bubble(p.x, p.y, b.color); }); falling.forEach(f => { ctx.globalAlpha = Math.max(0, f.life); bubble(f.x, f.y, f.color); }); ctx.globalAlpha = 1;
          ctx.strokeStyle = '#9fded277'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.moveTo(480, 529); ctx.lineTo(480 + Math.cos(angle) * 125, 529 + Math.sin(angle) * 125); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#bfd8c3'; ctx.beginPath(); ctx.arc(480, 548, 39, Math.PI, Math.PI * 2); ctx.fill(); bubble(480, 529, current); bubble(570, 549, next, 16); if (shot) bubble(shot.x, shot.y, shot.color);
          ctx.fillStyle = '#b9d8db'; ctx.font = '800 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('LET A LITTLE COLOR GO.', 480, 35); ctx.font = '600 12px system-ui'; ctx.fillText('NEXT', 570, 582); ctx.restore();
        },
        inspect() { return { board: board.map(b => ({ ...b })), angle, shot: shot && { ...shot }, shots, misses, score, time, ended, popped, current, next }; }
      };
      function TAU() { return Math.PI * 2; }
    }
  });
})();
