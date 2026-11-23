'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { gameHarness } = require('./helpers/arcade-harness.cjs');
const IDS = ['gravity-shift', 'cargo-crane', 'rocket-landing', 'harbor-rescue'];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

function play(id, controller) {
  const h = gameHarness(id);
  for (let frame = 0; frame < 12000 && !h.result; frame++) {
    controller(h, h.snapshot(), frame); h.frame();
  }
  return h;
}
function win(h, title) { assert.equal(h.result?.title, title); assert.equal(h.score, h.result.score); h.assertSettled(); }

for (const id of IDS) test(`${id}: reproducible state, pure drawing, finite idle ending`, () => {
  const h = gameHarness(id), b = gameHarness(id);
  assert.ok(h.config.controls.every(c => c.label && c.keys.length));
  assert.ok(h.config.medals.every((n, i, a) => n > 0 && (!i || n > a[i - 1])));
  h.draw(); h.step(3); b.step(3); assert.deepEqual(h.snapshot(), b.snapshot());
  const before = h.snapshot(), calls = h.randomCalls;
  h.draw(); h.draw(); assert.deepEqual(h.snapshot(), before); assert.equal(h.randomCalls, calls);
  h.step(210); h.assertSettled();
});

test('Gravity Shift: a flip reverses acceleration and the input lock prevents instant repeats', () => {
  const h = gameHarness('gravity-shift');
  h.press('flip'); assert.equal(h.snapshot().runner.gravity, -1);
  h.press('flip'); assert.equal(h.snapshot().runner.gravity, -1);
  h.step(1.5); assert.equal(h.snapshot().runner.y, 96);
  assert.equal(h.snapshot().shields, 3, 'the ceiling is a safe surface');
});

test('Gravity Shift: reading the next barrier permits a clean full-course finish', () => {
  const h = play('gravity-shift', (h, s) => {
    const barrier = s.barriers.find(b => !b.counted);
    if (barrier && s.runner.gravity === barrier.side) h.edges.add('flip');
    assert.ok(s.barriers.length <= 3);
  });
  win(h, 'A new point of view.');
  assert.equal(h.snapshot().passed, 26);
  assert.equal(h.snapshot().clean, 26);
  assert.equal(h.snapshot().shields, 3);
});

test('Cargo Crane: a released crate preserves sideways momentum independently of the trolley', () => {
  const h = gameHarness('cargo-crane');
  h.held.add('right'); h.step(.6); h.press('drop');
  const released = h.snapshot().cargo;
  assert.equal(released.attached, false);
  assert.ok(Math.abs(released.vx) > 5, 'the swinging load has sideways momentum');
  h.held.clear(); h.held.add('left'); h.step(.2);
  const falling = h.snapshot().cargo;
  assert.equal(falling.vx, released.vx);
  assert.ok(Math.abs(falling.x - released.x - released.vx * .2) < 1e-6);
  assert.ok(falling.vy > released.vy);
});

test('Cargo Crane: careful positioning and release deliver eight loads without loss', () => {
  const h = play('cargo-crane', (h, s) => {
    h.held.clear(); if (s.transition || !s.cargo.attached) return;
    const c = s.cargo;
    const fall = (-c.vy + Math.sqrt(c.vy * c.vy + 960 * Math.max(0, s.dock.y - 18 - c.y))) / 480;
    const landing = c.x + c.vx * fall;
    if (Math.abs(landing - s.dock.x) < (s.dock.w / 2 - 19) * .45 && Math.abs(c.vx) < 140) { h.edges.add('drop'); return; }
    const target = clamp((s.dock.x - s.crane.x) * 1.3, -170, 170);
    if (s.crane.vx < target - 8) h.held.add('right');
    else if (s.crane.vx > target + 8) h.held.add('left');
  });
  win(h, 'A harbor in good hands.');
  assert.equal(h.snapshot().delivered, 8);
  assert.equal(h.snapshot().lost, 0);
  assert.ok(h.snapshot().lastAccuracy >= 50);
});

test('Rocket Landing: tilt, upright control, and fuel-consuming thrust affect the flight', () => {
  const h = gameHarness('rocket-landing');
  h.held.add('right'); h.step(.3); assert.ok(h.snapshot().craft.angle > .4);
  h.held.clear(); h.held.add('level'); h.step(.4); assert.ok(Math.abs(h.snapshot().craft.angle) < .001);
  const before = h.snapshot().craft;
  h.held.add('thrust'); h.step(.5);
  const after = h.snapshot().craft;
  assert.ok(after.fuel < before.fuel);
  assert.ok(after.vy < before.vy, 'upright thrust brakes the descent');
});

test('Rocket Landing: a controlled approach lands on all three pads without losing a craft', () => {
  let throttle = 0, descending = false;
  const h = play('rocket-landing', (h, s) => {
    h.held.clear(); if (s.transition) { descending = false; throttle = 0; return; }
    const c = s.craft, dx = s.pad.x - c.x;
    if (Math.abs(dx) < 40 && Math.abs(c.vx) < 18) descending = true;
    if (Math.abs(dx) > 75) descending = false;
    const targetVX = clamp(dx * .55, -65, 65), ax = clamp((targetVX - c.vx) * 1.5, -65, 65);
    const targetVY = descending ? Math.min(32, Math.max(12, (s.pad.y - 20 - c.y) * .4)) : clamp((155 - c.y) * .8, -55, 55);
    const ay = clamp((targetVY - c.vy) * 1.7, -95, 35), upward = 38 - ay;
    const targetAngle = clamp(Math.atan2(ax, upward), -1.1, 1.1), difference = targetAngle - c.angle;
    if (Math.abs(difference) > .025) h.held.add(difference > 0 ? 'right' : 'left');
    throttle += Math.min(1, Math.hypot(ax, upward) / 116);
    if (throttle >= 1) { h.held.add('thrust'); throttle -= 1; }
    assert.ok(c.fuel >= 0 && c.fuel <= 100);
  });
  win(h, 'Three soft arrivals.');
  assert.equal(h.snapshot().landed, 3);
  assert.equal(h.snapshot().lives, 3);
  assert.ok(h.snapshot().craft.fuel > 0);
});

// Grid routing merely chooses safe waypoints; the boat must navigate each through
// its real steering, acceleration, currents, inertia, and braking controls.
function harborRoute(start, end, islands) {
  const cols = 24, rows = 14, cell = 40;
  const grid = p => ({ x: clamp(Math.round((p.x - 20) / cell), 0, cols - 1), y: clamp(Math.round((p.y - 60) / cell), 0, rows - 1) });
  const a = grid(start), b = grid(end), queue = [{ ...a, path: [] }], seen = new Set([a.x + ',' + a.y]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === b.x && p.y === b.y) return p.path.map(p => ({ x: 20 + p.x * cell, y: 60 + p.y * cell })).concat(end);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = p.x + dx, y = p.y + dy, key = x + ',' + y;
      if (x < 0 || x >= cols || y < 0 || y >= rows || seen.has(key) || islands.some(i => Math.hypot(i.x - (20 + x * cell), i.y - (60 + y * cell)) < i.r + 38)) continue;
      seen.add(key); queue.push({ x, y, path: p.path.concat({ x, y }) });
    }
  }
  throw new Error('No safe harbor route');
}

test('Harbor Rescue: currents cause drift and braking reduces the boat’s momentum', () => {
  const h = gameHarness('harbor-rescue'); h.step(1);
  assert.ok(Math.hypot(h.snapshot().boat.vx, h.snapshot().boat.vy) > .1);
  h.held.add('thrust'); h.step(.7); h.held.clear();
  const speed = Math.hypot(h.snapshot().boat.vx, h.snapshot().boat.vy);
  h.held.add('brake'); h.step(.5);
  assert.ok(Math.hypot(h.snapshot().boat.vx, h.snapshot().boat.vy) < speed * .25);
});

test('Harbor Rescue: two three-passenger trips rescue everyone and refuel at the harbor', () => {
  let waypoints = [], targetId = null, lastFuel = 100, refueled = false, maxAboard = 0;
  const h = play('harbor-rescue', (h, s) => {
    h.held.clear(); maxAboard = Math.max(maxAboard, s.aboard);
    if (s.boat.fuel > lastFuel + 1) refueled = true;
    lastFuel = s.boat.fuel;
    const target = s.aboard >= 3 || s.people.every(p => p.rescued) ? { ...s.harbor, id: 'harbor' } : s.people.filter(p => !p.rescued).sort((a, b) => Math.hypot(a.x - s.boat.x, a.y - s.boat.y) - Math.hypot(b.x - s.boat.x, b.y - s.boat.y))[0];
    if (target.id !== targetId) { targetId = target.id; waypoints = harborRoute(s.boat, target, s.islands); }
    while (waypoints.length > 1 && Math.hypot(waypoints[0].x - s.boat.x, waypoints[0].y - s.boat.y) < 32) waypoints.shift();
    const point = waypoints[0] || target, dx = point.x - s.boat.x, dy = point.y - s.boat.y, distance = Math.hypot(dx, dy);
    const difference = wrap(Math.atan2(dy, dx) - s.boat.angle), speed = Math.hypot(s.boat.vx, s.boat.vy);
    if (Math.abs(difference) > .04) h.held.add(difference > 0 ? 'right' : 'left');
    const docking = target.id === 'harbor' && waypoints.length === 1;
    if (Math.abs(difference) < .4 && (!docking || distance > 35)) h.held.add('thrust');
    if (Math.abs(difference) > .7 && speed > 50 || docking && distance < 70) h.held.add('brake');
    assert.ok(s.aboard <= 3);
  });
  win(h, 'Everyone is home.');
  assert.equal(h.snapshot().delivered, 6);
  assert.equal(h.snapshot().aboard, 0);
  assert.equal(h.snapshot().hull, 4);
  assert.equal(maxAboard, 3);
  assert.equal(refueled, true);
});
