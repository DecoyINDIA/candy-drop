'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { gameHarness } = require('./helpers/arcade-harness.cjs');

function tap(h, x, y) {
  Object.assign(h.api.input.pointer, { x, y, down: true, pressed: true, inside: true, active: true }); h.frame();
  Object.assign(h.api.input.pointer, { down: false, released: true }); h.frame();
}
function moveCursor(h, target, n, field = 'cursor') {
  for (let i = 0; i < 100 && h.snapshot()[field] !== target; i++) {
    const at = h.snapshot()[field];
    h.press(Math.floor(at / n) < Math.floor(target / n) ? 'down' : Math.floor(at / n) > Math.floor(target / n) ? 'up' : at % n < target % n ? 'right' : 'left');
  }
  assert.equal(h.snapshot()[field], target);
}
function forge(h, word, touch = false) {
  while (h.snapshot().chosen.length) h.press('erase');
  const rack = h.snapshot().rack, used = new Set();
  for (const letter of word) {
    const i = rack.findIndex((value, at) => value === letter && !used.has(at)); assert.ok(i >= 0, `${word} is made from the rack`); used.add(i);
    if (touch) tap(h, 218 + (i + .5) * 76, 372); else h.press('tile' + i);
  }
  assert.equal(h.snapshot().draft, word);
  if (touch) tap(h, 462, 477); else h.press('submit');
}
function balancePlace(h, slot, weight, touch = false) {
  const s = h.snapshot();
  if (touch) { tap(h, 480 - s.weights.length * 44 + weight * 88 + 44, 487); tap(h, 480 + s.positions[slot] * 76, 242); }
  else { h.press('weight' + weight); while (h.snapshot().cursor < slot) h.press('right'); while (h.snapshot().cursor > slot) h.press('left'); h.press('act'); }
}
function pathDraw(h, path, touch = false) {
  const { n } = h.snapshot(), size = 432 / n;
  if (touch) {
    const point = i => ({ x: 264 + (i % n + .5) * size, y: 75 + (Math.floor(i / n) + .5) * size });
    Object.assign(h.api.input.pointer, point(path[0]), { down: true, pressed: true, inside: true, active: true }); h.frame();
    for (const i of path.slice(1)) { Object.assign(h.api.input.pointer, point(i)); h.frame(); }
    Object.assign(h.api.input.pointer, { down: false, released: true }); h.frame();
  } else {
    moveCursor(h, path[0], n); h.press('act');
    for (let j = 1; j < path.length; j++) { const diff = path[j] - path[j - 1]; h.press(diff === n ? 'down' : diff === -n ? 'up' : diff === 1 ? 'right' : 'left'); }
  }
}

for (const id of ['laser-lock', 'word-forge', 'balance-box', 'trail-weaver']) {
  test(`${id}: reproducible construction, finite state and pure repeated rendering`, () => {
    const a = gameHarness(id, { seed: 97 }), b = gameHarness(id, { seed: 97 });
    assert.deepEqual(a.snapshot(), b.snapshot());
    const before = a.snapshot(), calls = a.randomCalls;
    a.draw(); a.draw(); a.draw(); assert.deepEqual(a.snapshot(), before); assert.equal(a.randomCalls, calls);
    a.step(.4); a.draw(); assert.ok(a.config.controls.length); assert.equal(new Set(a.config.controls.map(c => c.id)).size, a.config.controls.length);
    assert.ok(a.config.medals.every((value, i, medals) => value >= 0 && (!i || value > medals[i - 1])));
  });
}

test('Laser Lock: the optical layouts illuminate every target and unlock all three rooms', () => {
  for (const seed of [1, 7, 23, 97, 1204]) {
    const h = gameHarness('laser-lock', { seed });
    for (let round = 1; round <= 3; round++) {
      const initial = h.snapshot(); assert.equal(initial.round, round); assert.equal(initial.beam.solved, false);
      for (let i = 0; i < initial.board.length && !h.snapshot().transition; i++) if (initial.board[i] > 0 && initial.board[i] !== initial.solution[i]) tap(h, 240 + (i % 7 + .5) * 69, 88 + (Math.floor(i / 7) + .5) * 69);
      const s = h.snapshot(); assert.equal(s.beam.solved, true); assert.equal(s.beam.receiver, true); assert.equal(s.beam.loop, false);
      assert.deepEqual(s.beam.lit.slice().sort((a, b) => a - b), s.targets.slice().sort((a, b) => a - b));
      assert.ok(s.beam.cells.length <= 42 * 4); h.draw(); h.step(1.1);
    }
    h.assertSettled(); assert.ok(h.result.score > 0);
  }
});

test('Laser Lock: only mirrors turn, undo restores an orientation and reset preserves the room', () => {
  const h = gameHarness('laser-lock', { seed: 123 }), initial = h.snapshot();
  const wall = initial.board.indexOf(-1); tap(h, 240 + (wall % 7 + .5) * 69, 88 + (Math.floor(wall / 7) + .5) * 69); assert.deepEqual(h.snapshot().board, initial.board);
  h.press('hint'); const hinted = h.snapshot(); assert.ok(hinted.board[hinted.selected] > 0); assert.notEqual(hinted.board[hinted.selected], hinted.solution[hinted.selected]); assert.deepEqual(hinted.board, initial.board);
  h.press('act'); assert.equal(h.snapshot().board[hinted.selected], hinted.solution[hinted.selected]);
  h.press('undo'); assert.deepEqual(h.snapshot().board, initial.board); assert.equal(h.snapshot().undos, 1);
  h.press('act'); h.press('reset'); assert.deepEqual(h.snapshot().board, initial.board); assert.equal(h.snapshot().resets, 1);
});

test('Word Forge: every curated rack is valid and eighteen real words finish three racks', () => {
  const seen = new Set();
  for (const seed of [4, 29, 97]) {
    const h = gameHarness('word-forge', { seed });
    for (let round = 1; round <= 3; round++) {
      const s = h.snapshot(); assert.equal(s.round, round); seen.add(s.rack.slice().sort().join('')); assert.equal(new Set(s.words).size, 12);
      for (const word of s.words) { const pool = s.rack.slice(); for (const ch of word) { const at = pool.indexOf(ch); assert.ok(at >= 0); pool.splice(at, 1); } }
      for (const word of s.words.slice(0, 6)) forge(h, word, round === 2);
      assert.equal(h.snapshot().found.length, 6); assert.ok(h.snapshot().transition > 0); h.step(1.1);
    }
    h.assertSettled(); assert.equal(h.snapshot().totalWords, 18); assert.equal(h.snapshot().cleared, 3); assert.ok(h.result.score >= 5500);
  }
  assert.equal(seen.size, 4, 'all four local word packs were exercised');
});

test('Word Forge: tiles cannot be reused and invalid or duplicate words never award points', () => {
  const h = gameHarness('word-forge'); h.press('tile0'); h.press('tile0'); assert.equal(h.snapshot().chosen.length, 1); h.press('submit'); assert.equal(h.snapshot().mistakes, 1); assert.equal(h.score, 0); assert.equal(h.snapshot().found.length, 0);
  const word = h.snapshot().words[0]; forge(h, word); const score = h.score; forge(h, word); assert.equal(h.score, score); assert.equal(h.snapshot().found.length, 1); assert.equal(h.snapshot().chosen.length, 0);
  h.press('tile0'); h.press('tile1'); h.press('erase'); assert.deepEqual(h.snapshot().chosen, [0]);
  const letters = h.snapshot().rack.slice().sort(); h.press('shuffle'); assert.deepEqual(h.snapshot().rack.slice().sort(), letters); assert.equal(h.snapshot().chosen.length, 0);
});

test('Word Forge: hints cost future earnings even at zero, and banking ends a partial collection', () => {
  const h = gameHarness('word-forge'); h.press('hint'); h.press('hint'); assert.equal(h.score, 0); const word = h.snapshot().words[0]; forge(h, word);
  assert.equal(h.score, word.length * 50 + (word.length === 6 ? 100 : 0) - 80); assert.equal(h.snapshot().reveals[word], 2);
  h.press('bank'); h.assertSettled(); assert.equal(h.snapshot().totalWords, 1); assert.equal(h.result.score, h.score);
});

test('Balance Box: generated certified weights solve three beams using keyboard and touch', () => {
  for (const seed of [1, 7, 23, 97, 1204]) {
    const h = gameHarness('balance-box', { seed });
    for (let round = 1; round <= 3; round++) {
      const s = h.snapshot(); assert.equal(s.round, round); assert.equal(new Set(s.solution).size, s.weights.length);
      assert.equal(s.positions.reduce((sum, pos, i) => sum + pos * s.weights[s.solution[i]], 0), 0, 'the certificate balances torque');
      s.weights.forEach(w => assert.ok(Number.isInteger(w) && w > 0 && w <= 12));
      for (let i = 0; i < s.slots.length; i++) balancePlace(h, i, s.solution[i], round === 2);
      const solved = h.snapshot(); assert.equal(solved.torque, 0); assert.equal(solved.full, true); assert.ok(solved.transition > 0); h.draw(); h.step(1.1);
    }
    h.assertSettled(); assert.ok(h.result.score >= 2500);
  }
});

test('Balance Box: all weights must be placed and a full unequal beam does not finish', () => {
  const h = gameHarness('balance-box'), initial = h.snapshot(); h.step(.1); assert.equal(h.snapshot().transition, 0, 'an empty level beam is not solved');
  const wrong = initial.solution.slice(); const j = wrong.findIndex((id, i) => i > 0 && initial.weights[id] !== initial.weights[wrong[0]]); assert.ok(j > 0); [wrong[0], wrong[j]] = [wrong[j], wrong[0]];
  wrong.forEach((id, i) => balancePlace(h, i, id)); assert.notEqual(h.snapshot().torque, 0); assert.equal(h.snapshot().full, true); assert.equal(h.snapshot().transition, 0); assert.equal(h.result, null);
});

test('Balance Box: moves conserve weight IDs, undo restores the beam and hints require placement', () => {
  const h = gameHarness('balance-box'), initial = h.snapshot(); balancePlace(h, 0, 0); const one = h.snapshot().slots;
  balancePlace(h, 1, 0); assert.equal(h.snapshot().slots[0], -1); assert.equal(h.snapshot().slots.filter(id => id >= 0).length, 1);
  h.press('undo'); assert.deepEqual(h.snapshot().slots, one); balancePlace(h, 0, 1); assert.equal(h.snapshot().slots.includes(0), false); assert.equal(h.snapshot().slots[0], 1);
  h.press('reset'); assert.deepEqual(h.snapshot().weights, initial.weights); assert.ok(h.snapshot().slots.every(id => id === -1));
  h.press('hint'); const hinted = h.snapshot(); assert.equal(hinted.selected, hinted.solution[hinted.cursor]); assert.ok(hinted.slots.every(id => id === -1)); h.press('act'); assert.equal(h.snapshot().slots[hinted.cursor], hinted.selected);
});

test('Balance Box: a constant random stream still yields a bounded solvable fallback', () => {
  const h = gameHarness('balance-box', { random: () => 0 });
  for (let round = 1; round <= 3; round++) { const s = h.snapshot(); assert.equal(s.positions.reduce((v, pos, i) => v + pos * s.weights[s.solution[i]], 0), 0); s.solution.forEach((id, i) => balancePlace(h, i, id)); h.step(1.1); }
  h.assertSettled(); assert.ok(h.randomCalls < 4000);
});

test('Trail Weaver: every transformed garden has legal disjoint covering paths and can be finished', () => {
  for (const seed of [1, 7, 23, 97, 1204]) {
    const h = gameHarness('trail-weaver', { seed });
    for (let round = 1; round <= 3; round++) {
      const s = h.snapshot(); assert.equal(s.round, round); const all = s.solution.flat(); assert.equal(all.length, s.n * s.n); assert.equal(new Set(all).size, all.length);
      for (const path of s.solution) { for (let i = 1; i < path.length; i++) assert.equal(Math.abs(path[i] % s.n - path[i - 1] % s.n) + Math.abs(Math.floor(path[i] / s.n) - Math.floor(path[i - 1] / s.n)), 1); pathDraw(h, path, round === 2); }
      const done = h.snapshot(); assert.ok(done.complete.every(Boolean)); assert.equal(done.covered, s.n * s.n); assert.ok(done.transition > 0); h.draw(); h.step(1.1);
    }
    h.assertSettled(); assert.ok(h.result.score >= 3500);
  }
});

test('Trail Weaver: connected pairs alone do not finish a garden with uncovered squares', () => {
  const h = gameHarness('trail-weaver'), s = h.snapshot();
  s.solution.forEach((path, color) => pathDraw(h, color === 1 ? [path[0], path[3], path[4]] : path));
  const incomplete = h.snapshot(); assert.ok(incomplete.complete.every(Boolean)); assert.equal(incomplete.covered, 23); assert.equal(incomplete.transition, 0); assert.equal(h.result, null);
});

test('Trail Weaver: another color cannot enter an occupied trail or steal its endpoint', () => {
  const h = gameHarness('trail-weaver'), s = h.snapshot(); pathDraw(h, s.solution[0]);
  const occupied = s.solution[0].slice(1, -1); let collision;
  for (let color = 1; color < s.pairs.length; color++) for (const start of s.pairs[color]) for (const to of occupied) if (Math.abs(start % s.n - to % s.n) + Math.abs(Math.floor(start / s.n) - Math.floor(to / s.n)) === 1) collision = { start, to, color };
  assert.ok(collision); moveCursor(h, collision.start, s.n); h.press('act'); const before = h.snapshot().paths;
  const diff = collision.to - collision.start; h.press(diff === s.n ? 'down' : diff === -s.n ? 'up' : diff === 1 ? 'right' : 'left'); assert.deepEqual(h.snapshot().paths, before); assert.equal(h.snapshot().cursor, collision.start);
});

test('Trail Weaver: backtracking, gesture cancellation and undo preserve valid paths', () => {
  const h = gameHarness('trail-weaver'), s = h.snapshot(), path = s.solution[0], size = 432 / s.n;
  const point = i => ({ x: 264 + (i % s.n + .5) * size, y: 75 + (Math.floor(i / s.n) + .5) * size });
  Object.assign(h.api.input.pointer, point(path[0]), { down: true, pressed: true, inside: true, active: true }); h.frame();
  for (const i of [path[1], path[2], path[1]]) { Object.assign(h.api.input.pointer, point(i)); h.frame(); }
  assert.deepEqual(h.snapshot().paths[0], path.slice(0, 2)); const drawn = h.snapshot().paths;
  h.game.cancelInput(); assert.equal(h.snapshot().active, -1); assert.equal(h.snapshot().dragging, false); Object.assign(h.api.input.pointer, { down: false, released: true }); h.frame(); assert.deepEqual(h.snapshot().paths, drawn);
  h.press('undo'); assert.ok(h.snapshot().paths.every(p => p.length === 0)); assert.equal(h.snapshot().undos, 1);
  pathDraw(h, path); h.press('reset'); assert.deepEqual(h.snapshot().solution, s.solution); assert.ok(h.snapshot().paths.every(p => p.length === 0));
});
