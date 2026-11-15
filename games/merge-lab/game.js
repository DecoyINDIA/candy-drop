/* Merge Lab — deterministic 2048 puzzle with one carefully bounded undo. */
(() => {
  'use strict';
  const N = 4, GAP = 10, CELL = 112, BOARD = 498, BX = 231, BY = 54;
  const colors = {
    2: ['#f5f0e5', '#3a4950'], 4: ['#cbdcc9', '#294b41'], 8: ['#efd581', '#5e4817'],
    16: ['#eaa66f', '#563a24'], 32: ['#dc7f72', '#fff7ec'], 64: ['#8baec3', '#173e54'],
    128: ['#7b789e', '#ffffff'], 256: ['#3d796f', '#effff9'], 512: ['#ca623e', '#ffffff'],
    1024: ['#2e4655', '#effff8'], 2048: ['#cef28b', '#263a32']
  };
  const pos = i => ({ x: BX + GAP + (i % 4) * (CELL + GAP), y: BY + GAP + Math.floor(i / 4) * (CELL + GAP) });
  const rounded = (c, x, y, w, h, r = 10) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };

  Arcade.mount({
    id: 'merge-lab', title: 'Merge Lab', category: 'Puzzle', accent: '#bef264',
    description: 'A little room for a big idea. Slide, combine, and engineer your way to 2048.',
    howTo: [
      'Slide the entire board to combine equal tiles. Each pair merges once per move. Build a 2048 tile to complete the experiment.',
      'Use arrow keys / WASD, the direction buttons, or swipe across the scene. A new 2 or 4 appears only after a move changes the board.',
      'Keep your largest tile in a corner. U undoes one move per run. F / Bank score finishes early and saves your result.'
    ],
    controls: [
      { id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] },
      { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] },
      { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] },
      { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] },
      { id: 'undo', label: 'Undo ↶', keys: ['KeyU', 'KeyZ'] },
      { id: 'finish', label: 'Bank score', keys: ['KeyF'] }
    ],
    medals: [1200, 4000, 12000],
    create(api) {
      let grid = Array(16).fill(0), score = 0, moves = 0, maxTile = 2, clock = 0, ended = false;
      let undoUsed = false, previous = null, anim = 0, slides = [], spawned = -1, merged = [];
      let added = 0, addedLife = 0, invalid = 0, lastMilestone = 4, gesture = null, pendingEnd = null;
      // A cached random tape preserves the same spawn when the one undo is replayed.
      let randomTape = [], randomCursor = 0;
      function roll() {
        if (randomCursor >= randomTape.length) randomTape.push(api.random());
        return randomTape[randomCursor++];
      }
      function spawn() {
        const free = grid.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
        if (!free.length) return;
        spawned = free[Math.min(free.length - 1, Math.floor(roll() * free.length))];
        grid[spawned] = roll() < 0.9 ? 2 : 4;
      }
      spawn(); spawn();
      maxTile = Math.max(...grid);

      function hasMoves(board = grid) {
        for (let i = 0; i < 16; i++) {
          if (!board[i]) return true;
          if (i % 4 < 3 && board[i] === board[i + 1]) return true;
          if (i < 12 && board[i] === board[i + 4]) return true;
        }
        return false;
      }
      function finish(reason) {
        if (ended) return;
        ended = true;
        api.score(score); api.sound(reason === 'win' ? 'win' : 'click');
        api.end({ score, title: reason === 'win' ? 'Experiment: extraordinary' : reason === 'bank' ? 'A good place to pause' : 'Every tile tells a story',
          message: reason === 'win' ? 'You built 2048. A fresh board is a chance to reach it in fewer moves.' : reason === 'bank' ? 'Your score is saved. Come back with a fresh idea for your next board.' : 'No moves remain. Keep the biggest tile in a corner and preserve one open lane on your next run.',
          stats: [{ label: 'Largest tile', value: maxTile }, { label: 'Moves', value: moves }, { label: 'Undo', value: undoUsed ? 'Used' : 'Unused' }] });
      }

      function line(direction, n) {
        if (direction === 'left') return [0, 1, 2, 3].map(i => n * 4 + i);
        if (direction === 'right') return [3, 2, 1, 0].map(i => n * 4 + i);
        if (direction === 'up') return [0, 1, 2, 3].map(i => i * 4 + n);
        return [3, 2, 1, 0].map(i => i * 4 + n);
      }

      function move(direction) {
        if (ended || anim > 0 || pendingEnd) return;
        const next = Array(16).fill(0), movement = [], merges = [];
        let earned = 0;
        for (let n = 0; n < N; n++) {
          const indexes = line(direction, n), filled = indexes.filter(i => grid[i]);
          let destination = 0;
          for (let k = 0; k < filled.length; k++) {
            const from = filled[k], value = grid[from], to = indexes[destination];
            if (k + 1 < filled.length && grid[filled[k + 1]] === value) {
              next[to] = value * 2; earned += value * 2; merges.push(to);
              movement.push({ from, to, value }, { from: filled[++k], to, value });
            } else { next[to] = value; movement.push({ from, to, value }); }
            destination++;
          }
        }
        if (next.every((v, i) => v === grid[i])) { invalid = 0.18; return; }
        previous = { grid: grid.slice(), score, moves, maxTile, randomCursor, lastMilestone };
        grid = next; score += earned; moves++; maxTile = Math.max(...grid);
        slides = movement; merged = merges; anim = api.reducedMotion ? 0 : 0.13;
        added = earned; addedLife = earned ? 0.9 : 0;
        spawn();
        // Once undo is spent, the old tape can be discarded to bound long sessions.
        if (undoUsed && randomCursor > 64) { randomTape = randomTape.slice(randomCursor); randomCursor = 0; }
        api.sound(earned ? 'good' : 'click', earned ? 0.8 + Math.log2(Math.max(2, earned)) / 12 : 0.8);
        if (maxTile > lastMilestone && maxTile >= 64) {
          lastMilestone = maxTile; api.toast(maxTile + ' · a new discovery');
          const i = grid.indexOf(maxTile), p = pos(i); api.burst(p.x + CELL / 2, p.y + CELL / 2, colors[maxTile][0], 10);
        }
        if (maxTile >= 2048) pendingEnd = 'win';
        else if (!hasMoves()) pendingEnd = 'loss';
        api.score(score);
      }

      function undo() {
        if (!previous || undoUsed) { api.toast(undoUsed ? 'Your one undo is already used' : 'Make a move first'); return; }
        grid = previous.grid.slice(); score = previous.score; moves = previous.moves; maxTile = previous.maxTile;
        randomCursor = previous.randomCursor; lastMilestone = previous.lastMilestone;
        undoUsed = true; previous = null; anim = 0; slides = []; merged = []; addedLife = 0; pendingEnd = null;
        api.score(score); api.sound('click', 0.6); api.toast('One step back. A new possibility.');
      }

      function update(dt) {
        if (ended) return;
        clock += dt; anim = Math.max(0, anim - dt); invalid = Math.max(0, invalid - dt); addedLife = Math.max(0, addedLife - dt);
        if (api.input.pressed('undo')) undo();
        if (api.input.pressed('finish')) { finish('bank'); return; }
        if (pendingEnd && anim === 0) {
          // Leave a brief decision window for the one undo when the board fills.
          if (pendingEnd === 'loss' && previous && !undoUsed) {
            api.toast('Board full · U / Undo to try one different move');
            pendingEnd = 'last-chance';
          } else if (pendingEnd !== 'last-chance') { finish(pendingEnd); return; }
        }
        for (const direction of ['left', 'right', 'up', 'down']) {
          if (api.input.pressed(direction)) {
            if (pendingEnd === 'last-chance') { finish('loss'); return; }
            move(direction); break;
          }
        }
        const pointer = api.input.pointer;
        if (pointer.pressed && pointer.inside) gesture = { x: pointer.x, y: pointer.y };
        if (pointer.released && gesture) {
          const x = pointer.x - gesture.x, y = pointer.y - gesture.y;
          gesture = null;
          if (Math.max(Math.abs(x), Math.abs(y)) >= 30) {
            if (pendingEnd === 'last-chance') { finish('loss'); return; }
            move(Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'));
          }
        }
        if (gesture && !pointer.down && !pointer.released) gesture = null;
        const free = grid.filter(v => !v).length;
        api.hud([{ label: 'Largest', value: maxTile }, { label: 'Moves', value: moves }, { label: 'Open cells', value: free }]);
      }

      function tile(ctx, value, x, y, scale = 1, alpha = 1) {
        if (!value) return;
        const palette = colors[value] || colors[2048];
        ctx.save(); ctx.translate(x + CELL / 2, y + CELL / 2); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
        ctx.fillStyle = '#2d3b3a12'; rounded(ctx, -CELL / 2, -CELL / 2 + 4, CELL, CELL, 11);
        ctx.fillStyle = palette[0]; rounded(ctx, -CELL / 2, -CELL / 2, CELL, CELL, 11);
        ctx.fillStyle = palette[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '700 ' + (value < 100 ? 44 : value < 1000 ? 36 : 29) + 'px system-ui'; ctx.fillText(value, 0, 2);
        if (value >= 128) { ctx.globalAlpha = alpha * 0.22; ctx.fillStyle = palette[1]; rounded(ctx, -22, CELL / 2 - 12, 44, 3, 2); }
        ctx.restore();
      }

      function draw(ctx) {
        ctx.fillStyle = '#edece3'; ctx.fillRect(0, 0, api.w, api.h);
        ctx.strokeStyle = '#32554908'; ctx.lineWidth = 1;
        for (let x = 24; x < api.w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, api.h); ctx.stroke(); }
        for (let y = 12; y < api.h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(api.w, y); ctx.stroke(); }
        ctx.fillStyle = '#285245'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'left'; ctx.fillText('EXPERIMENT NO. 2048', 28, 77);
        ctx.font = '800 32px system-ui';
        ['MAKE', 'ROOM FOR', 'A BIG', 'IDEA.'].forEach((s, i) => ctx.fillText(s, 28, 145 + i * 39));
        ctx.fillStyle = '#728079'; ctx.font = '16px system-ui';
        ['Equal tiles.', 'New possibilities.'].forEach((s, i) => ctx.fillText(s, 28, 323 + i * 25));
        ctx.strokeStyle = '#5c756a44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(29, 381); ctx.lineTo(194, 381); ctx.stroke();
        ctx.fillStyle = '#3d5c4f'; ctx.font = '700 13px system-ui'; ctx.fillText('YOUR NEXT DISCOVERY', 28, 416);
        const goal = Math.min(2048, Math.max(8, maxTile * 2));
        ctx.font = '800 43px system-ui'; ctx.fillText(goal, 27, 468);
        ctx.fillStyle = '#819083'; ctx.font = '14px system-ui'; ctx.fillText('Keep a corner clear.', 28, 505);
        ctx.save();
        if (invalid > 0 && !api.reducedMotion) ctx.translate(Math.sin(invalid * 100) * 3, 0);
        ctx.fillStyle = '#b6c2b7'; rounded(ctx, BX, BY + 6, BOARD, BOARD, 18);
        ctx.fillStyle = '#c6cfc4'; rounded(ctx, BX, BY, BOARD, BOARD, 18);
        for (let i = 0; i < 16; i++) { const p = pos(i); ctx.fillStyle = '#b6c2b799'; rounded(ctx, p.x, p.y, CELL, CELL, 11); }
        if (anim > 0) {
          const t = 1 - (anim / 0.13) ** 3;
          for (const s of slides) {
            const a = pos(s.from), b = pos(s.to); tile(ctx, s.value, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
          }
          const p = pos(spawned); tile(ctx, grid[spawned], p.x, p.y, 0.65 + t * 0.35, t);
        } else {
          for (let i = 0; i < 16; i++) {
            const p = pos(i), scale = !api.reducedMotion && merged.includes(i) && addedLife > 0.65 ? 1 + Math.sin((0.9 - addedLife) / 0.25 * Math.PI) * 0.055 : 1;
            tile(ctx, grid[i], p.x, p.y, scale);
          }
        }
        ctx.restore();
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#315346'; ctx.font = '700 13px system-ui'; ctx.fillText('THE METHOD', 761, 143);
        ctx.fillStyle = '#65796e'; ctx.font = '17px system-ui';
        ['Slide the board.', 'Match the numbers.', 'Plan one move', 'ahead.'].forEach((s, i) => ctx.fillText(s, 761, 181 + i * 27));
        ctx.fillStyle = '#d6ded1'; rounded(ctx, 762, 321, 162, 77, 12);
        ctx.fillStyle = undoUsed ? '#859384' : '#315346'; ctx.font = '700 18px system-ui'; ctx.fillText(undoUsed ? 'UNDO USED' : 'ONE UNDO', 777, 353);
        ctx.font = '13px system-ui'; ctx.fillText(undoUsed ? 'Trust the next move.' : 'U / ↶ · make it count', 777, 377);
        if (addedLife > 0) { ctx.globalAlpha = Math.min(1, addedLife * 2); ctx.fillStyle = '#3d796f'; ctx.font = '800 36px system-ui'; ctx.fillText('+' + added, 777, 470 - (0.9 - addedLife) * 22); ctx.globalAlpha = 1; }
        ctx.fillStyle = '#7a8c7e'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SLIDE WITH ARROW KEYS OR SWIPE', api.w / 2, 580);
        if (pendingEnd === 'last-chance') {
          ctx.fillStyle = '#233b32dd'; rounded(ctx, BX + 16, BY + 173, BOARD - 32, 150, 14);
          ctx.fillStyle = '#f3f7ec'; ctx.font = '800 28px system-ui'; ctx.textAlign = 'center'; ctx.fillText('One more possibility.', api.w / 2, BY + 217);
          ctx.font = '16px system-ui'; ctx.fillText('U / Undo to take your last move back.', api.w / 2, BY + 254);
          ctx.fillText('Any direction or Bank score to finish.', api.w / 2, BY + 281);
        }
      }
      api.hud([{ label: 'Largest', value: maxTile }, { label: 'Moves', value: 0 }, { label: 'Open cells', value: 14 }]);
      return { update, draw, cancelInput() { gesture = null; }, inspect: () => ({ grid: grid.slice(), score, moves, maxTile, undoUsed, canUndo: !!previous && !undoUsed, hasMoves: hasMoves(), pendingEnd, ended }) };
    }
  });
})();
