'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../assets/core.js');
const IDS = Core.CATALOG.filter(game => game.id !== 'candy-drop').map(game => game.id);
const STEP = 1 / 60;
const sources = new Map(IDS.map(id => [id, fs.readFileSync(path.join(__dirname, '..', 'games', id, 'game.js'), 'utf8')]));

function finite(value, location = 'state') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${location} is finite`);
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) finite(child, `${location}.${key}`);
  }
}

function plain(value) { return JSON.parse(JSON.stringify(value)); }

// This small, repeatable stream is supplied through the public API, never by changing game state.
function lcg(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

function canvasContext() {
  let depth = 0;
  const methods = new Map();
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key in target) return target[key];
      if (!methods.has(key)) methods.set(key, (...args) => {
        for (const value of args) if (typeof value === 'number') assert.ok(Number.isFinite(value), `canvas.${String(key)} receives finite coordinates`);
        if (key === 'save') depth++;
        if (key === 'restore') { depth--; assert.ok(depth >= 0, 'canvas restore matches a save'); }
        if (key === 'arc') assert.ok(args[2] >= 0, 'arc radius is not negative');
        if (key === 'ellipse') assert.ok(args[2] >= 0 && args[3] >= 0, 'ellipse radii are not negative');
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return { addColorStop(offset) { assert.ok(offset >= 0 && offset <= 1); } };
        if (key === 'measureText') return { width: String(args[0]).length * 9 };
      });
      return methods.get(key);
    },
    set(target, key, value) { target[key] = value; return true; }
  });
  return { ctx, balanced() { assert.equal(depth, 0, 'drawing restores its canvas state'); } };
}

function gameHarness(id, { seed = 123, random = lcg(seed), reducedMotion = true } = {}) {
  let config, result = null, randomCalls = 0, resultCalls = 0, score = 0;
  const held = new Set(), edges = new Set();
  const safeMath = Object.create(Math);
  safeMath.random = () => { throw new Error(`${id} must use the supplied seed, not Math.random()`); };
  vm.runInNewContext(sources.get(id), { Arcade: { mount(value) { assert.equal(config, undefined, 'one registration per module'); config = value; } }, Math: safeMath }, { filename: `${id}/game.js` });
  assert.equal(config.id, id);
  const api = {
    w: 960, h: 600, mode: 'daily', time: 0, reducedMotion,
    random() { randomCalls++; return random(); },
    input: { down: id => held.has(id), pressed: id => edges.has(id), pointer: { x: 480, y: 300, down: false, pressed: false, released: false, inside: false, active: false } },
    score(value) { assert.ok(Number.isFinite(value) && value >= 0, 'score is a finite nonnegative number'); score = value; },
    hud(items) { assert.ok(Array.isArray(items)); for (const item of items) { assert.equal(typeof item.label, 'string'); finite(item.value, 'HUD'); } },
    sound() {}, burst() {}, shake() {}, toast() {},
    end(value) { resultCalls++; assert.equal(resultCalls, 1, 'end is emitted once'); finite(value, 'result'); assert.ok(value.score >= 0); result = plain(value); }
  };
  const game = config.create(api), context = canvasContext();
  function snapshot() { const value = game.inspect(); finite(value); return plain(value); }
  function frame() {
    if (result) return;
    api.time += STEP; game.update(STEP);
    edges.clear(); api.input.pointer.pressed = api.input.pointer.released = false;
  }
  function step(seconds) { const frames = Math.ceil(seconds * 60 - 1e-8); for (let i = 0; i < frames && !result; i++) frame(); }
  function press(...actions) { for (const action of actions) edges.add(action); frame(); }
  function draw() { game.draw(context.ctx); context.balanced(); }
  function assertSettled() {
    assert.ok(result, `${id} reached an end condition`);
    const before = snapshot();
    game.update(STEP); game.update(STEP);
    assert.deepEqual(snapshot(), before, 'ended game no longer changes');
    assert.equal(resultCalls, 1);
    draw();
  }
  return { api, config, game, held, edges, frame, step, press, draw, snapshot, assertSettled,
    get result() { return result; }, get score() { return score; }, get randomCalls() { return randomCalls; } };
}

for (const id of IDS) {
  test(`${id}: construction, finite draw, seed reproducibility and render purity`, () => {
    const a = gameHarness(id, { reducedMotion: false }), b = gameHarness(id, { reducedMotion: false });
    assert.ok(a.config.controls.length > 0);
    assert.equal(new Set(a.config.controls.map(c => c.id)).size, a.config.controls.length);
    assert.equal(a.config.medals.length, 3);
    assert.deepEqual(a.snapshot(), b.snapshot());
    for (let i = 0; i < 3; i++) {
      const before = a.snapshot(), calls = a.randomCalls;
      a.draw(); a.draw();
      assert.deepEqual(a.snapshot(), before, 'drawing does not alter simulation');
      assert.equal(a.randomCalls, calls, 'drawing does not consume the seeded random stream');
      a.step(1); b.step(1);
      assert.deepEqual(a.snapshot(), b.snapshot(), 'extra renders do not change the run');
    }
  });
}

test('Neon Dojo: movement, stamina-consuming kick, contact and defeat transition', () => {
  const h = gameHarness('neon-dojo');
  h.step(2);
  for (let i = 0; i < 100; i++) {
    const s = h.snapshot(), gap = s.enemy.x - s.player.x;
    if (Math.abs(gap) <= 95) break;
    h.held.clear(); h.held.add(gap > 0 ? 'right' : 'left'); h.frame();
  }
  h.held.clear();
  const before = h.snapshot();
  h.press('kick');
  assert.ok(h.snapshot().player.stamina < before.player.stamina);
  h.step(0.5);
  assert.ok(h.snapshot().enemy.hp < before.enemy.hp, 'an in-range kick damages the opponent');
  h.step(90);
  h.assertSettled();
  assert.equal(h.snapshot().finished, true);
});

test('Sunset Sprint: a steering and throttle controller can finish all checkpoints', () => {
  const h = gameHarness('sunset-sprint', { seed: 19 });
  for (let i = 0; i < 12000 && !h.result; i++) {
    const s = h.game.inspect();
    const hazards = s.cars.concat(s.barriers).filter(object => object.z > 0 && object.z < 100);
    const danger = lane => hazards.reduce((sum, object) => sum + Math.max(0, 0.5 - Math.abs(object.lane - lane)) * (110 - object.z), 0) + Math.abs(lane - s.x) * 3;
    const target = hazards.length ? [-0.64, 0, 0.64].sort((a, b) => danger(a) - danger(b))[0] : 0;
    h.held.clear(); h.held.add('gas');
    if (s.x < target - 0.04) h.held.add('right');
    if (s.x > target + 0.04) h.held.add('left');
    if (hazards.every(object => Math.abs(object.lane - s.x) > 0.3)) h.held.add('boost');
    h.frame();
  }
  h.assertSettled();
  assert.equal(h.snapshot().distance, 6000);
  assert.equal(h.snapshot().checkpoint, 4);
  assert.ok(h.snapshot().integrity > 0);
  assert.ok(h.result.score > 2000);
});

test('Pocket Striker: charge/release shoots, pass switches control, and full time ends the match', () => {
  const h = gameHarness('pocket-striker');
  h.step(0.9);
  h.held.add('shoot'); h.step(0.3);
  assert.ok(h.snapshot().charge > 0);
  h.held.delete('shoot'); h.frame();
  assert.equal(h.snapshot().shots, 1);
  const controlled = h.snapshot().controlled;
  h.press('pass');
  assert.notEqual(h.snapshot().controlled, controlled);
  h.step(76);
  h.assertSettled();
  assert.equal(h.snapshot().time, 0);
  assert.ok(h.result.score >= 75);
});

test('Pocket Striker: cancelling held input discards a charged shot without firing', () => {
  const h = gameHarness('pocket-striker');
  h.step(0.9); h.held.add('shoot'); h.step(0.3);
  assert.ok(h.snapshot().charge > 0);
  h.game.cancelInput(); h.held.clear(); h.frame();
  assert.equal(h.snapshot().charge, 0);
  assert.equal(h.snapshot().shots, 0);
  h.held.add('shoot'); h.step(0.2); h.held.clear(); h.frame();
  assert.equal(h.snapshot().shots, 1, 'a fresh charge and release still works after resume');
});

test('Orbit Guard: build, duplicate prevention, upgrade and sale respect the credit budget', () => {
  const h = gameHarness('orbit-guard');
  const start = h.snapshot().credits;
  h.press('wave'); assert.equal(h.snapshot().active, false, 'a defense must exist before launch');
  h.press('build'); const built = h.snapshot();
  assert.ok(built.towers[0]); assert.ok(built.credits < start);
  h.press('build'); assert.equal(h.snapshot().credits, built.credits, 'building twice cannot charge twice');
  h.press('upgrade'); assert.equal(h.snapshot().towers[0].level, 2);
  const upgradedCredits = h.snapshot().credits;
  h.press('sell');
  assert.equal(h.snapshot().towers[0], null);
  assert.ok(h.snapshot().credits > upgradedCredits && h.snapshot().credits < start, 'selling returns only part of the investment');
});

test('Orbit Guard: a mixed, upgraded defense survives all eight waves', () => {
  const h = gameHarness('orbit-guard', { seed: 1234 });
  const select = index => { const count = (index - h.game.inspect().selected + 8) % 8; for (let n = 0; n < count; n++) h.press('right'); };
  const type = index => { const count = (index - h.game.inspect().chosen + 3) % 3; for (let n = 0; n < count; n++) h.press('type'); };
  select(0); h.press('build'); select(2); h.press('build'); h.press('wave');
  const plan = [[0, 0, 3], [2, 2, 3], [3, 1, 2], [1, 0, 3], [5, 2, 3], [4, 0, 2], [6, 1, 2], [7, 0, 2]];
  for (let frame = 0; frame < 60 * 360 && !h.result; frame++) {
    h.frame();
    let state = h.game.inspect();
    if (!state.active && state.wave > 0 && !h.result) {
      for (const [pad, kind, targetLevel] of plan) {
        select(pad); state = h.game.inspect();
        if (!state.towers[pad] && state.credits >= [90, 125, 155][kind]) { type(kind); h.press('build'); }
        state = h.game.inspect();
        if (state.towers[pad] && state.towers[pad].level < targetLevel && state.credits >= 75 * state.towers[pad].level) h.press('upgrade');
      }
      h.press('wave');
    }
  }
  h.assertSettled();
  assert.equal(h.snapshot().wave, 8);
  assert.ok(h.snapshot().integrity > 0);
  assert.ok(h.snapshot().kills > 80);
});

test('Mini Golf Club: a calibrated keyboard putt sinks the first hole and every hole can close', () => {
  const h = gameHarness('mini-golf-club');
  h.held.add('up'); h.step(0.41); h.held.clear();
  const before = h.snapshot().ball.x;
  h.press('shoot'); h.step(0.2);
  assert.ok(h.snapshot().ball.x > before);
  assert.equal(h.snapshot().strokes, 1);
  h.step(8);
  assert.equal(h.snapshot().hole, 2);
  assert.equal(h.snapshot().scores[0].completed, true, 'ball reaches and settles into the cup');
  // The stroke cap is a deliberate escape hatch, preventing a difficult hole from trapping a run.
  for (let frame = 0; frame < 2400 && !h.result; frame++) {
    const state = h.game.inspect();
    if (!state.moving && state.holeTimer <= 0 && state.waterTimer <= 0) h.edges.add('reset');
    h.frame();
  }
  h.assertSettled();
  assert.equal(h.snapshot().scores.length, 6);
  assert.equal(h.snapshot().scores.filter(hole => hole.completed).length, 1);
});

test('Mini Golf Club: cancelling a drag never turns cancellation into a putt', () => {
  const h = gameHarness('mini-golf-club'), ball = h.snapshot().ball;
  Object.assign(h.api.input.pointer, { x: ball.x, y: ball.y, down: true, pressed: true, inside: true }); h.frame();
  Object.assign(h.api.input.pointer, { x: ball.x - 100, down: true }); h.frame();
  assert.equal(h.snapshot().dragging, true);
  h.game.cancelInput();
  Object.assign(h.api.input.pointer, { down: false, released: true }); h.frame();
  assert.equal(h.snapshot().dragging, false);
  assert.equal(h.snapshot().strokes, 0);
  assert.deepEqual(h.snapshot().ball, ball);
  h.press('shoot'); assert.equal(h.snapshot().strokes, 1, 'a fresh deliberate putt still works');
});

test('Skybound: an input-only route reaches the finish, including district recovery', () => {
  const h = gameHarness('skybound', { seed: 3 });
  for (let i = 0; i < 7500 && !h.result; i++) {
    const s = h.game.inspect(), player = s.player;
    const roof = s.platforms.find(p => p.x < player.x && p.x + p.w > player.x);
    const obstacle = s.obstacles.find(o => o.x > player.x - 15 && o.x < player.x + 95);
    if (obstacle && s.dashCooldown <= 0) h.edges.add('dash');
    if (player.grounded && ((roof && roof.x + roof.w - player.x < 65) || (obstacle && obstacle.type === 'crate' && player.dash <= 0))) h.edges.add('jump');
    if (!player.grounded && player.jumps === 1 && player.vy > 100 && (!roof || roof.x + roof.w - player.x < 15)) h.edges.add('jump');
    h.frame();
  }
  h.assertSettled();
  assert.ok(h.snapshot().distance >= 1200);
  assert.ok(h.snapshot().lives > 0);
  assert.ok(h.snapshot().gems > 0);
  assert.equal(h.result.title, 'Above it all');
});

test('Starfall: dodging, pulse and aiming can clear the fleets and final boss', () => {
  const h = gameHarness('starfall', { seed: 2 });
  for (let i = 0; i < 16000 && !h.result; i++) {
    const s = h.game.inspect(), ship = s.ship;
    const target = s.boss || s.enemies.filter(e => e.y < 450).sort((a, b) => b.y - a.y)[0] || { x: 480, y: 200 };
    let best = { x: ship.x, y: ship.y, cost: Infinity };
    for (const dx of [-70, -35, 0, 35, 70]) for (const dy of [-50, 0, 50]) {
      const x = Math.max(30, Math.min(930, ship.x + dx)), y = Math.max(290, Math.min(560, ship.y + dy));
      let cost = Math.abs(x - target.x) * 0.08 + Math.abs(y - 490) * 0.05 + Math.hypot(dx, dy) * 0.03;
      for (const bullet of s.bullets) for (const t of [0, 0.18, 0.4]) {
        const distance = Math.hypot(x - (bullet.x + bullet.vx * t), y - (bullet.y + bullet.vy * t));
        cost += distance < 28 ? 1000 : distance < 90 ? 90 - distance : 0;
      }
      if (cost < best.cost) best = { x, y, cost };
    }
    h.held.clear();
    if (best.x > ship.x + 5) h.held.add('right'); if (best.x < ship.x - 5) h.held.add('left');
    if (best.y > ship.y + 5) h.held.add('down'); if (best.y < ship.y - 5) h.held.add('up');
    if (s.pulseCooldown <= 0 && (s.bullets.some(b => Math.hypot(b.x - ship.x, b.y - ship.y) < 110) || s.sector === 5)) h.edges.add('pulse');
    h.frame();
  }
  h.assertSettled();
  assert.equal(h.snapshot().sector, 5);
  assert.ok(h.snapshot().boss.hp <= 0);
  assert.ok(h.snapshot().ship.hp > 0);
  assert.equal(h.result.title, 'The sky is yours');
});

test('Skybound and Starfall each have a reachable loss with no input', () => {
  for (const id of ['skybound', 'starfall']) {
    const h = gameHarness(id); h.step(150); h.assertSettled();
    assert.equal(id === 'skybound' ? h.snapshot().lives : h.snapshot().ship.hp, 0);
  }
});

test('Merge Lab: merges, invalid slides, exact undo and replay use only valid moves', () => {
  const h = gameHarness('merge-lab', { random: () => 0 });
  assert.deepEqual(h.snapshot().grid, [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const initial = h.snapshot();
  h.press('left');
  const merged = h.snapshot();
  assert.deepEqual(merged.grid.slice(0, 4), [4, 2, 0, 0]);
  assert.equal(merged.score, 4); assert.equal(merged.moves, 1);
  const calls = h.randomCalls;
  h.press('left');
  assert.deepEqual(h.snapshot(), merged, 'a compressed row with unequal values cannot move again');
  assert.equal(h.randomCalls, calls, 'an invalid move must not spawn or consume randomness');
  h.press('undo');
  assert.deepEqual(h.snapshot().grid, initial.grid);
  assert.equal(h.snapshot().score, 0); assert.equal(h.snapshot().moves, 0);
  h.press('left');
  assert.deepEqual(h.snapshot().grid, merged.grid, 'replaying an undone move restores the same spawn');
  assert.equal(h.randomCalls, calls);
  h.press('undo'); assert.equal(h.snapshot().moves, 1, 'undo is available only once');
  h.press('finish'); h.assertSettled(); assert.equal(h.result.score, 4);
});

test('Merge Lab: a swipe is accepted, but a cancelled swipe cannot commit on resume', () => {
  const h = gameHarness('merge-lab', { random: () => 0 });
  Object.assign(h.api.input.pointer, { x: 700, y: 300, down: true, pressed: true, inside: true }); h.frame();
  Object.assign(h.api.input.pointer, { x: 300, down: false, released: true }); h.frame();
  assert.equal(h.snapshot().moves, 1);
  Object.assign(h.api.input.pointer, { x: 300, y: 300, down: true, pressed: true, inside: true }); h.frame();
  h.game.cancelInput();
  Object.assign(h.api.input.pointer, { x: 700, down: false, released: true }); h.frame();
  assert.equal(h.snapshot().moves, 1, 'pointer cancellation discards the gesture');
});

test('Merge Lab: four equal tiles merge into two pairs, never chain twice in one move', () => {
  const h = gameHarness('merge-lab', { random: () => 0 });
  // This legal sequence creates four 2s across the top row without injecting game state.
  for (const direction of ['right', 'down', 'right', 'up']) h.press(direction);
  assert.deepEqual(h.snapshot().grid.slice(0, 4), [2, 2, 2, 2]);
  const before = h.snapshot().score;
  h.press('left');
  assert.deepEqual(h.snapshot().grid.slice(0, 4), [4, 4, 2, 0], 'two merged 4s plus the single new 2');
  assert.equal(h.snapshot().score - before, 8);
});

test('Merge Lab: long legal input sequences conserve tile mass plus one spawn per move', () => {
  const h = gameHarness('merge-lab', { seed: 841 });
  const directions = ['left', 'down', 'right', 'down', 'left', 'up'];
  for (let turn = 0; turn < 250 && !h.result; turn++) {
    const before = h.snapshot();
    if (before.pendingEnd === 'last-chance') { h.press('undo'); continue; }
    h.press(directions[turn % directions.length]);
    const after = h.snapshot();
    const increase = after.grid.reduce((sum, v) => sum + v, 0) - before.grid.reduce((sum, v) => sum + v, 0);
    if (after.moves > before.moves) assert.ok(increase === 2 || increase === 4, 'exactly one new tile appears after a move');
    else assert.equal(increase, 0);
    for (const value of after.grid) assert.ok(value === 0 || (value > 0 && Number.isInteger(Math.log2(value))), 'every tile remains a power of two');
  }
  if (!h.result) h.press('finish');
  h.assertSettled();
  assert.ok(h.result.score > 0);
});
