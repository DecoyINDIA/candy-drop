/* Balance Box — generated torque puzzles with a certified arrangement. */
(() => {
  'use strict';
  Arcade.mount({
    id: 'balance-box', title: 'Balance Box', category: 'Balance puzzle', accent: '#dfbd91',
    description: 'A little weight in the right place makes everything feel level.',
    howTo: ['Balance three beams. Place every weight on a hook so the totals on the two sides match. Each weight is multiplied by its hook distance.', 'Tap a weight, then a hook. On a keyboard, 1–6 chooses a weight, Left / Right chooses a hook, and Space places it. A weight of 3 at distance 2 contributes 6.', 'Weights can be moved again. Replacing one returns the old weight to the box. U undoes, R clears the beam, and H suggests one placement. Every puzzle has a solution.'],
    controls: Array.from({ length: 6 }, (_, i) => ({ id: 'weight' + i, label: 'Weight ' + (i + 1), keys: ['Digit' + (i + 1), 'Numpad' + (i + 1)] })).concat([{ id: 'left', label: 'Hook ←', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Hook →', keys: ['ArrowRight', 'KeyD'] }, { id: 'act', label: 'Place', keys: ['Space', 'Enter'] }, { id: 'undo', label: 'Undo', keys: ['KeyU', 'KeyZ'] }, { id: 'reset', label: 'Clear beam', keys: ['KeyR'] }, { id: 'hint', label: 'Hint', keys: ['KeyH'] }]),
    medals: [800, 1900, 2500],
    create(api) {
      let weights = [], positions = [], slots = [], solution = [], history = [], selected = -1, cursor = 0;
      let round = 1, moves = 0, totalMoves = 0, penalty = 0, hints = 0, undos = 0, resets = 0, score = 0, transition = 0, ended = false;
      function balance() { let left = 0, right = 0; slots.forEach((id, i) => { if (id >= 0) { const v = weights[id] * Math.abs(positions[i]); if (positions[i] < 0) left += v; else right += v; } }); return { left, right, torque: right - left, full: slots.every(id => id >= 0) }; }
      function load() {
        positions = round === 1 ? [-2, -1, 1, 2] : [-3, -2, -1, 1, 2, 3];
        const n = positions.length, max = round === 1 ? 6 : round === 2 ? 8 : 12;
        let values = null;
        for (let attempt = 0; attempt < 240; attempt++) {
          const a = Array.from({ length: n - 1 }, () => 1 + Math.floor(api.random() * max));
          const last = -a.reduce((sum, value, i) => sum + value * positions[i], 0) / positions[n - 1];
          if (Number.isInteger(last) && last >= 1 && last <= max && new Set(a).size >= 3) { values = a.concat(last); break; }
        }
        if (!values) values = n === 4 ? [2, 5, 3, 3] : [2, 5, 7, 3, 4, 4];
        const ids = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(api.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
        weights = ids.map(i => values[i]); solution = values.map((_, i) => ids.indexOf(i));
        slots = Array(n).fill(-1); history = []; selected = -1; cursor = 0; moves = 0; penalty = 0; transition = 0;
      }
      function place() {
        if (transition > 0 || selected < 0 || selected >= weights.length) return;
        if (slots[cursor] === selected) { selected = -1; return; }
        history.push({ slots: slots.slice(), selected, cursor }); if (history.length > 256) history.shift();
        const old = slots.indexOf(selected); if (old >= 0) slots[old] = -1;
        slots[cursor] = selected; selected = -1; moves++; totalMoves++; api.sound('click');
        const b = balance();
        if (b.full && b.torque === 0) { score += Math.max(250, 1100 - moves * 22 - penalty); api.score(score); api.sound('win'); transition = 1; }
        else if (b.full) api.toast('All weights placed. Move one to change the balance.');
      }
      function hud() { const b = balance(); api.hud([{ label: 'Beam', value: round + ' / 3' }, { label: 'Left total', value: b.left }, { label: 'Right total', value: b.right }, { label: 'Placed', value: slots.filter(id => id >= 0).length + ' / ' + weights.length }]); }
      load(); hud();
      return {
        update(dt) {
          if (ended) return;
          if (transition > 0) { transition -= dt; if (transition <= 0) { if (round === 3) { ended = true; api.end({ score, title: 'Everything in balance.', message: 'Three beams, perfectly level. A small weight farther out can make a surprising difference.', stats: [{ label: 'Beams', value: '3 / 3' }, { label: 'Placements', value: totalMoves }, { label: 'Hints', value: hints }] }); return; } round++; load(); hud(); } return; }
          const k = api.input;
          for (let i = 0; i < weights.length; i++) if (k.pressed('weight' + i)) selected = i;
          if (k.pressed('left')) cursor = Math.max(0, cursor - 1);
          if (k.pressed('right')) cursor = Math.min(slots.length - 1, cursor + 1);
          if (k.pressed('undo') && history.length) { const p = history.pop(); slots = p.slots; selected = p.selected; cursor = p.cursor; undos++; penalty += 15; }
          if (k.pressed('reset')) { slots.fill(-1); selected = -1; history = []; resets++; penalty += 65; }
          if (k.pressed('hint')) { const i = slots.findIndex((id, at) => id !== solution[at]); if (i >= 0) { cursor = i; selected = solution[i]; hints++; penalty += 100; api.toast('Place the selected weight on the outlined hook.'); } }
          if (k.pressed('act')) place();
          const p = k.pointer, poolX = 480 - weights.length * 44;
          if (p.pressed && p.inside) {
            if (p.x >= poolX && p.x < poolX + weights.length * 88 && p.y >= 446 && p.y < 531) selected = Math.floor((p.x - poolX) / 88);
            else if (p.y >= 162 && p.y < 340) { const i = positions.findIndex(v => Math.abs(p.x - (480 + v * 76)) < 33); if (i >= 0) { cursor = i; if (selected >= 0) place(); else if (slots[i] >= 0) selected = slots[i]; } }
          }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#eee9de'; c.fillRect(0, 0, 960, 600); c.textAlign = 'left'; c.fillStyle = '#675a4b'; c.font = '800 30px Georgia,serif'; c.fillText('A LITTLE', 30, 73); c.fillText('PERSPECTIVE.', 30, 111, 255); c.fillStyle = '#998a73'; c.font = '15px system-ui'; c.fillText('Weight × distance. A place for everything.', 30, 143);
          const b = balance(), tilt = Math.max(-.16, Math.min(.16, b.torque / 120));
          c.fillStyle = '#d9c9ae'; c.fillRect(152, 369, 656, 16); c.fillStyle = '#8a9e8b'; c.beginPath(); c.moveTo(480, 287); c.lineTo(430, 369); c.lineTo(530, 369); c.closePath(); c.fill();
          c.strokeStyle = '#a88b67'; c.lineWidth = 13; c.lineCap = 'round'; c.beginPath(); c.moveTo(196, 286 - 284 * tilt); c.lineTo(764, 286 + 284 * tilt); c.stroke();
          positions.forEach((pos, i) => {
            const x = 480 + pos * 76, y = 286 + pos * 76 * tilt, id = slots[i];
            c.strokeStyle = '#9a8064'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y - 27); c.stroke();
            c.fillStyle = id >= 0 ? '#647e6f' : '#e4d9c5'; c.beginPath(); c.roundRect(x - 25, y - 84, 50, 56, 8); c.fill();
            if (i === cursor) { c.strokeStyle = '#ce9e5d'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 30, y - 89, 60, 66, 11); c.stroke(); }
            c.textAlign = 'center'; c.fillStyle = id >= 0 ? '#f4edda' : '#ae9a7e'; c.font = '800 28px Georgia,serif'; c.fillText(id >= 0 ? weights[id] : '·', x, y - 46); c.fillStyle = '#957e60'; c.font = '700 13px system-ui'; c.fillText('×' + Math.abs(pos), x, y + 27);
          });
          c.fillStyle = '#eee9de'; c.beginPath(); c.arc(480, 286, 10, 0, Math.PI * 2); c.fill();
          c.textAlign = 'center'; c.font = '800 32px Georgia,serif'; c.fillStyle = '#617b6a'; c.fillText(b.left, 112, 261); c.fillText(b.right, 848, 261); c.fillStyle = '#a18d73'; c.font = '700 12px system-ui'; c.fillText('LEFT TOTAL', 112, 287); c.fillText('RIGHT TOTAL', 848, 287); c.font = '14px system-ui'; c.fillText(b.full && !b.torque ? 'PERFECTLY LEVEL' : !b.torque ? 'Place every weight to finish.' : b.torque > 0 ? 'The right side is heavier.' : 'The left side is heavier.', 480, 418);
          const poolX = 480 - weights.length * 44;
          weights.forEach((weight, i) => { const x = poolX + i * 88, placed = slots.includes(i); c.fillStyle = placed ? '#ded8cb' : '#fcf7eb'; c.beginPath(); c.roundRect(x + 4, 446, 80, 85, 12); c.fill(); if (selected === i) { c.strokeStyle = '#ce9e5d'; c.lineWidth = 3; c.stroke(); } c.fillStyle = placed ? '#adac9b' : '#627968'; c.font = '800 34px Georgia,serif'; c.fillText(weight, x + 44, 490); c.font = '11px system-ui'; c.fillStyle = '#a59279'; c.fillText((i + 1) + (placed ? ' · ON BEAM' : ' · PICK UP'), x + 44, 516); });
          c.textAlign = 'right'; c.fillStyle = '#9e876b'; c.font = '700 14px system-ui'; c.fillText('BEAM ' + round + ' / 3', 921, 55); c.textAlign = 'center'; c.font = '13px system-ui'; c.fillText('NUMBER KEYS PICK A WEIGHT · ARROWS CHOOSE A HOOK · SPACE PLACES IT', 480, 568);
          if (transition > 0) { c.fillStyle = '#496c5ef0'; c.fillRect(278, 211, 404, 94); c.fillStyle = '#f8edce'; c.font = '800 30px system-ui'; c.fillText('A BEAUTIFUL BALANCE', 480, 269, 380); }
          c.restore();
        },
        inspect() { return { weights: weights.slice(), positions: positions.slice(), slots: slots.slice(), solution: solution.slice(), selected, cursor, round, moves, totalMoves, hints, undos, resets, penalty, score, transition, ended, ...balance() }; }
      };
    }
  });
})();
