'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const STEP = 1 / 60;
const sources = { get(id) { return fs.readFileSync(path.join(__dirname, '../..', 'games', id, 'game.js'), 'utf8'); } };

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

module.exports = { gameHarness, finite, plain, lcg, canvasContext, STEP };
