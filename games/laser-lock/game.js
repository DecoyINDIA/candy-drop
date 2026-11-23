/* Laser Lock — three hand-built optical rooms, every beam trace is bounded. */
(() => {
  'use strict';
  const N = 7, H = 6, X = 240, Y = 88, S = 69;
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const ROOMS = [
    { source: 4, receiver: 4, mirrors: [[29, 1], [8, 1], [12, 2], [33, 2], [3, 1], [37, 2]], targets: [22, 10, 19, 34], walls: [17, 24], route: [29, 8, 12, 33] },
    { source: 1, receiver: 5, mirrors: [[8, 2], [29, 1], [28, 2], [14, 1], [18, 2], [39, 2], [5, 1], [34, 2]], targets: [7, 22, 21, 17, 32, 40], walls: [10, 11, 26], route: [8, 29, 28, 14, 18, 39] },
    { source: 5, receiver: 5, mirrors: [[37, 1], [9, 2], [7, 2], [0, 1], [6, 2], [34, 1], [32, 1], [39, 2], [15, 1], [11, 2]], targets: [36, 23, 8, 3, 20, 33, 40], walls: [17, 18, 24, 25], route: [37, 9, 7, 0, 6, 34, 32, 39] }
  ];
  Arcade.mount({
    id: 'laser-lock', title: 'Laser Lock', category: 'Light routing', accent: '#a8e5df',
    description: 'A little reflection can open a whole new room.',
    howTo: ['Rotate the mirrors to light every crystal and send the beam into the receiver on the right. Unlock three optical rooms.', 'Tap a mirror, or move with arrows and press Space, to turn it. Mirrors reflect at right angles; dark blocks absorb the beam.', 'U undoes a turn, R restores this room, and H points to a mirror that differs from a proven route. Hints and extra turns reduce the room bonus.'],
    controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] }, { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] }, { id: 'act', label: 'Turn mirror', keys: ['Space', 'Enter'] }, { id: 'undo', label: 'Undo', keys: ['KeyU', 'KeyZ'] }, { id: 'reset', label: 'Reset', keys: ['KeyR'] }, { id: 'hint', label: 'Hint', keys: ['KeyH'] }],
    medals: [900, 2200, 3000],
    create(api) {
      let board = [], solution = [], initial = [], history = [], selected = 0;
      let round = 1, moves = 0, totalMoves = 0, hints = 0, undos = 0, resets = 0, penalty = 0, score = 0, transition = 0, ended = false;
      const room = () => ROOMS[round - 1];
      function trace() {
        let col = 0, row = room().source, dir = 0, loop = false, receiver = false;
        const points = [{ x: X - 29, y: Y + (row + .5) * S }], cells = [], lit = [], seen = new Set();
        for (let n = 0; n < N * H * 4 + 1; n++) {
          if (col < 0 || col >= N || row < 0 || row >= H) {
            receiver = col === N && row === room().receiver;
            points.push({ x: X + (col < 0 ? -.4 : col >= N ? N + .4 : col + .5) * S, y: Y + (row < 0 ? -.4 : row >= H ? H + .4 : row + .5) * S });
            break;
          }
          const i = row * N + col, key = i * 4 + dir;
          if (seen.has(key)) { loop = true; break; }
          seen.add(key); cells.push(i); points.push({ x: X + (col + .5) * S, y: Y + (row + .5) * S });
          if (board[i] === -1) break;
          if (room().targets.includes(i) && !lit.includes(i)) lit.push(i);
          if (board[i] === 1) dir = [3, 2, 1, 0][dir];
          else if (board[i] === 2) dir = [1, 0, 3, 2][dir];
          col += DIRS[dir][0]; row += DIRS[dir][1];
        }
        return { points, cells, lit, receiver, loop, solved: receiver && lit.length === room().targets.length };
      }
      function load() {
        solution = Array(N * H).fill(0);
        for (const i of room().walls) solution[i] = -1;
        for (const [i, type] of room().mirrors) solution[i] = type;
        board = solution.map(v => v > 0 && api.random() < .5 ? 3 - v : v);
        if (trace().solved) board[room().route[0]] = 3 - board[room().route[0]];
        initial = board.slice(); history = []; selected = room().route[0]; moves = 0; penalty = 0; transition = 0;
      }
      function turn() {
        if (transition > 0 || board[selected] <= 0) return;
        history.push({ i: selected, value: board[selected] }); if (history.length > 256) history.shift();
        board[selected] = 3 - board[selected]; moves++; totalMoves++; api.sound('click', 1.2);
        if (trace().solved) { score += Math.max(250, 1200 - moves * 24 - penalty); api.score(score); api.sound('win'); transition = .95; }
      }
      function hud() { const b = trace(); api.hud([{ label: 'Room', value: round + ' / 3' }, { label: 'Crystals', value: b.lit.length + ' / ' + room().targets.length }, { label: 'Turns', value: moves }, { label: 'Beam', value: b.loop ? 'LOOP' : b.receiver ? 'ARRIVED' : 'ROUTING' }]); }
      load(); hud();
      return {
        update(dt) {
          if (ended) return;
          if (transition > 0) {
            transition -= dt;
            if (transition <= 0) {
              if (round === 3) { ended = true; api.end({ score, title: 'A moment of illumination.', message: 'Every crystal lit, every room unlocked. A good reflection changes the whole route.', stats: [{ label: 'Rooms', value: '3 / 3' }, { label: 'Mirror turns', value: totalMoves }, { label: 'Hints', value: hints }] }); return; }
              round++; load(); hud();
            }
            return;
          }
          const k = api.input;
          if (k.pressed('left') && selected % N) selected--;
          if (k.pressed('right') && selected % N < N - 1) selected++;
          if (k.pressed('up') && selected >= N) selected -= N;
          if (k.pressed('down') && selected < N * (H - 1)) selected += N;
          if (k.pressed('undo') && history.length) { const old = history.pop(); board[old.i] = old.value; selected = old.i; undos++; penalty += 12; }
          if (k.pressed('reset')) { board = initial.slice(); history = []; resets++; penalty += 70; }
          if (k.pressed('hint')) { const i = room().route.find(i => board[i] !== solution[i]); if (i !== undefined) { selected = i; hints++; penalty += 100; api.toast('Try turning the highlighted mirror.'); } }
          if (k.pressed('act')) turn();
          const p = k.pointer;
          if (p.pressed && p.inside && p.x >= X && p.x < X + N * S && p.y >= Y && p.y < Y + H * S) { selected = Math.floor((p.y - Y) / S) * N + Math.floor((p.x - X) / S); turn(); }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#122c35'; c.fillRect(0, 0, 960, 600); c.textAlign = 'left'; c.fillStyle = '#d6f4e5'; c.font = '800 31px system-ui'; c.fillText('A LITTLE', 28, 181, 190); c.fillText('REFLECTION.', 28, 222, 190);
          c.fillStyle = '#8eafb1'; c.font = '16px system-ui'; ['Follow the light.', 'Consider the turn.', 'Let the room open.'].forEach((t, i) => c.fillText(t, 30, 282 + i * 27));
          c.fillStyle = '#21434c'; c.beginPath(); c.roundRect(X - 9, Y - 9, N * S + 18, H * S + 18, 18); c.fill();
          const beam = trace();
          for (let i = 0; i < board.length; i++) {
            const x = X + i % N * S, y = Y + Math.floor(i / N) * S;
            c.fillStyle = board[i] === -1 ? '#1c303b' : '#173741'; c.fillRect(x + 3, y + 3, S - 6, S - 6);
            if (board[i] === -1) { c.strokeStyle = '#3b5662'; c.lineWidth = 2; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(x + 14, y + 18 + j * 14); c.lineTo(x + S - 14, y + 18 + j * 14); c.stroke(); } }
          }
          c.lineJoin = c.lineCap = 'round';
          for (const [width, color] of [[13, '#e8d37d18'], [6, '#edd58970'], [2.5, '#ffedb1']]) { c.lineWidth = width; c.strokeStyle = color; c.beginPath(); beam.points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); }
          for (let i = 0; i < board.length; i++) {
            const x = X + (i % N + .5) * S, y = Y + (Math.floor(i / N) + .5) * S;
            if (board[i] > 0) { c.strokeStyle = '#b5e3e3'; c.lineWidth = 7; c.beginPath(); c.moveTo(x - 20, y + (board[i] === 1 ? 20 : -20)); c.lineTo(x + 20, y + (board[i] === 1 ? -20 : 20)); c.stroke(); c.strokeStyle = '#efffff'; c.lineWidth = 2; c.stroke(); }
            if (room().targets.includes(i)) { c.fillStyle = beam.lit.includes(i) ? '#ffeab0' : '#7d899c'; c.strokeStyle = '#f2d48c'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 15); c.lineTo(x + 11, y); c.lineTo(x, y + 15); c.lineTo(x - 11, y); c.closePath(); c.fill(); c.stroke(); }
            if (i === selected) { c.strokeStyle = '#80d8cd'; c.lineWidth = 2; c.strokeRect(x - 30, y - 30, 60, 60); }
          }
          c.fillStyle = '#f2d18b'; c.beginPath(); c.arc(X - 26, Y + (room().source + .5) * S, 12, 0, Math.PI * 2); c.fill();
          c.fillStyle = beam.receiver ? '#a8ead5' : '#547b80'; c.fillRect(X + N * S + 13, Y + (room().receiver + .5) * S - 20, 14, 40);
          c.fillStyle = '#a9d6cb'; c.font = '700 13px system-ui'; c.fillText('OPTICAL ROOM', 772, 176); c.font = '800 62px system-ui'; c.fillText('0' + round, 769, 250); c.fillStyle = '#83aaa8'; c.font = '15px system-ui'; ['Light every crystal.', 'Reach the receiver.', 'Mirrors turn both ways.'].forEach((t, i) => c.fillText(t, 772, 305 + i * 26, 165));
          c.textAlign = 'center'; c.font = '13px system-ui'; c.fillText('THE BRIGHTEST ROUTE BEGINS WITH ONE GOOD TURN', 480, 565);
          if (transition > 0) { c.fillStyle = '#133c42ed'; c.fillRect(275, 247, 410, 94); c.fillStyle = '#dff7d7'; c.font = '800 29px system-ui'; c.fillText('ROOM ILLUMINATED', 480, 304); }
          c.restore();
        },
        inspect() { const beam = trace(); return { board: board.slice(), solution: solution.slice(), targets: room().targets.slice(), source: room().source, receiver: room().receiver, selected, round, moves, totalMoves, hints, undos, resets, score, transition, ended, beam }; }
      };
    }
  });
})();
