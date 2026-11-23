(function () {
  'use strict';
  const W = 7, H = 6, X = 120, Y = 104, S = 70;
  function winner(b) {
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const p = b[r * W + c]; if (!p) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
        if (c + dx * 3 < 0 || c + dx * 3 >= W || r + dy * 3 >= H) continue;
        if ([1, 2, 3].every(k => b[(r + dy * k) * W + c + dx * k] === p)) return p;
      }
    }
    return 0;
  }
  function drop(b, c, p) { for (let r = H - 1; r >= 0; r--) if (!b[r * W + c]) { b[r * W + c] = p; return r; } return -1; }
  function value(b) {
    let n = 0;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
      if (c + dx * 3 < 0 || c + dx * 3 >= W || r + dy * 3 >= H) continue;
      const line = [0, 1, 2, 3].map(k => b[(r + dy * k) * W + c + dx * k]);
      const ai = line.filter(x => x === 2).length, human = line.filter(x => x === 1).length;
      if (!human) n += [0, 1, 8, 70, 10000][ai];
      if (!ai) n -= [0, 1, 9, 90, 10000][human];
    }
    return n;
  }
  function search(b, depth, p, alpha, beta) {
    const won = winner(b); if (won) return won === 2 ? 100000 + depth : -100000 - depth;
    if (!depth || b.every(Boolean)) return value(b);
    let best = p === 2 ? -Infinity : Infinity;
    for (const c of [3, 2, 4, 1, 5, 0, 6]) {
      if (b[c]) continue; const next = b.slice(); drop(next, c, p);
      const n = search(next, depth - 1, 3 - p, alpha, beta);
      best = p === 2 ? Math.max(best, n) : Math.min(best, n);
      if (p === 2) alpha = Math.max(alpha, n); else beta = Math.min(beta, n);
      if (beta <= alpha) break;
    }
    return best;
  }
  Arcade.mount({
    id: 'four-in-row', title: 'Four in a Row', category: 'Tabletop', accent: '#ffcd76',
    description: 'One little board. A hundred ways to set a trap.',
    howTo: ['Connect four gold counters horizontally, vertically or diagonally before the coral AI.', 'Choose a column with Left / Right and drop with Space, or tap the board.', 'Look for two threats at once. The AI looks ahead and blocks obvious wins.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'drop', label: 'Drop', keys: ['Space'] }], medals: [700, 1800, 3000],
    create(api) {
      const board = Array(42).fill(0); let selected = 3, turn = 1, moves = 0, wait = 0, finished = false, won = 0;
      function play(c) {
        if (drop(board, c, turn) < 0) { api.sound('bad'); return; }
        moves++; api.sound('click'); won = winner(board);
        api.score(Math.floor(moves / 2) * 35);
        if (won || moves === 42) {
          finished = true; const score = won === 1 ? 2200 + (42 - moves) * 55 : won === 2 ? Math.floor(moves / 2) * 35 : 1400;
          api.end({ score, title: won === 1 ? 'Four looks good on you.' : won === 2 ? 'The rival found a line.' : 'A perfectly full board.', message: 'Build a fork: two winning columns the opponent cannot both block.', stats: [{ label: 'Counters', value: moves }, { label: 'Result', value: won === 1 ? 'You win' : won === 2 ? 'AI wins' : 'Draw' }] }); return;
        }
        turn = 3 - turn; wait = .48;
      }
      return {
        update(dt) {
          if (finished) return;
          if (turn === 2) {
            wait -= dt;
            if (wait <= 0) {
              let best = -Infinity, choice = 3;
              for (const c of [3, 2, 4, 1, 5, 0, 6]) if (!board[c]) { const next = board.slice(); drop(next, c, 2); const n = search(next, 3, 1, -Infinity, Infinity); if (n > best) { best = n; choice = c; } }
              play(choice);
            }
          } else {
            if (api.input.pressed('left')) selected = (selected + 6) % 7;
            if (api.input.pressed('right')) selected = (selected + 1) % 7;
            const p = api.input.pointer;
            if (p.pressed && p.x >= X && p.x < X + W * S && p.y > Y - 50 && p.y < Y + H * S) { selected = Math.floor((p.x - X) / S); play(selected); }
            else if (api.input.pressed('drop')) play(selected);
          }
          api.hud([{ label: 'Turn', value: turn === 1 ? 'You' : 'Rival' }, { label: 'Column', value: selected + 1 }, { label: 'Counters', value: moves }]);
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#171c32'; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#253552'; ctx.beginPath(); ctx.roundRect(X - 15, Y - 12, W * S + 30, H * S + 24, 22); ctx.fill();
          for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { ctx.fillStyle = ['#11182a', '#ffd27b', '#f4859b'][board[r * W + c]]; ctx.beginPath(); ctx.arc(X + c * S + 35, Y + r * S + 35, 27, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = '#ffd27b'; ctx.beginPath(); ctx.moveTo(X + selected * S + 23, Y - 36); ctx.lineTo(X + selected * S + 47, Y - 36); ctx.lineTo(X + selected * S + 35, Y - 20); ctx.fill();
          ctx.fillStyle = '#fff3d6'; ctx.font = 'bold 28px system-ui'; ctx.fillText('MAKE', 675, 220); ctx.fillText('YOUR', 675, 255); ctx.fillText('CONNECTION.', 675, 290);
          ctx.font = '17px system-ui'; ctx.fillStyle = '#adb8cc'; ctx.fillText('Gold is you.', 675, 340); ctx.fillText('Four is the goal.', 675, 368); ctx.fillText(turn === 2 ? 'Rival is thinking…' : 'Pick your column.', 675, 430); ctx.restore();
        },
        inspect() { return { board: board.slice(), selected, turn, moves, finished, winner: won }; }
      };
    }
  });
})();
