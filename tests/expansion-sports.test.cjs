'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { gameHarness } = require('./helpers/arcade-harness.cjs');
const IDS = ['rooftop-rally', 'hoops-minute', 'pocket-bowler', 'home-run-hero', 'wicket-rush', 'downhill-dash', 'archery-grove', 'curling-cove', 'sail-sprint', 'orchard-keeper', 'cafe-rush', 'colony-balance'];
function point(h, x, y, down = false, pressed = false) { Object.assign(h.api.input.pointer, { x, y, down, pressed, inside: true, active: true }); }
function run(h, controller, frames = 18000) { for (let f = 0; f < frames && !h.result; f++) { controller(h, h.snapshot(), f); h.frame(); } h.assertSettled(); return h.snapshot(); }
function drag(h, x, y, angle, length) { point(h, x, y, true, true); h.frame(); point(h, x - Math.cos(angle) * length, y - Math.sin(angle) * length, true); h.frame(); point(h, 0, 0); h.api.input.pointer.released = true; h.frame(); }

for (const id of IDS) test(id + ': seeded inputs, finite state and pure drawing', () => {
  const a = gameHarness(id), b = gameHarness(id);
  assert.equal(a.config.medals.length, 3); assert.ok(a.config.medals.every((n, i, arr) => n > 0 && (!i || n > arr[i - 1])));
  assert.ok(a.config.howTo.length >= 3 && a.config.controls.length >= 3);
  for (let f = 0; f < 420; f++) {
    if (f % 73 === 0) { const control = a.config.controls[Math.floor(f / 73) % a.config.controls.length].id; a.edges.add(control); b.edges.add(control); }
    a.frame(); b.frame();
    if (f % 47 === 0) { const state = a.snapshot(), calls = a.randomCalls; a.draw(); a.draw(); assert.deepEqual(a.snapshot(), state); assert.equal(a.randomCalls, calls); }
  }
  assert.deepEqual(a.snapshot(), b.snapshot()); assert.equal(a.randomCalls, b.randomCalls);
});

test('rooftop rally: edge placement and smash win a complete seven-point match', () => {
  const h = gameHarness('rooftop-rally');
  const s = run(h, (h, s) => { let target = s.ball.x; if (s.ball.vy > 0) { target += s.ball.vx * (445 - s.ball.y) / s.ball.vy; while (target < 161 || target > 799) target = target < 161 ? 322 - target : 1598 - target; target += s.rival < 480 ? -40 : 40; } point(h, target, 445, true); h.held.add('smash'); });
  assert.equal(s.us, 7); assert.equal(s.them, 0); assert.ok(s.longest >= 2); assert.ok(h.result.score >= h.config.medals[2]);
});

test('hoops: moving-rim shots score, change spots, and finish at sixty seconds', () => {
  const h = gameHarness('hoops-minute'); h.step(.1); const initial = h.snapshot(), t = h.api.time;
  // Infer the visible rim movement from its two axes, then lead the target with a ballistic shot.
  const A = .7 * t, B = .93 * t, a = (initial.hoop.x - 730) / 38, b = (initial.hoop.y - 252) / 34;
  const phase = Math.atan2((a * Math.sin(B) - b * Math.sin(A)) / Math.sin(B - A), (b * Math.cos(A) - a * Math.cos(B)) / Math.sin(B - A));
  let last = -1;
  const s = run(h, (h, s) => {
    if (s.flight || h.api.time - last <= .4) return;
    let best = { error: Infinity }; const launch = h.api.time + .05;
    for (let flight = .9; flight < 1.7; flight += .015) {
      const x = 730 + Math.sin((launch + flight) * .7 + phase) * 38, y = 252 + Math.sin((launch + flight) * .93 + phase) * 34;
      const vx = (x - s.spot) / flight, vy = (y - 475 - 280 * flight * flight) / flight, angle = Math.atan2(vy, vx), power = (Math.hypot(vx, vy) - 410) / 370;
      if (angle < -1.38 || angle > -.28 || power < 0 || power > 1 || vy + 560 * flight < 50) continue;
      if (Math.abs(power - .65) < best.error) best = { error: Math.abs(power - .65), angle, power };
    }
    if (best.power != null) { drag(h, s.spot, 475, best.angle, 12 + best.power * 160); last = h.api.time; }
  });
  assert.ok(s.baskets >= 12); assert.ok(s.shots >= s.baskets); assert.ok(s.points > s.baskets * 2); assert.ok(h.result.score >= h.config.medals[2]); assert.ok(h.api.time >= 60 && h.api.time < 61);
});

for (const id of ['hoops-minute', 'archery-grove']) test(id + ': canceled input discards a pending shot', () => {
  const h = gameHarness(id); h.held.add('shoot'); h.step(.5); assert.equal(h.snapshot().charging, true); h.game.cancelInput(); h.held.clear(); h.frame(); assert.equal(Boolean(h.snapshot().flight || h.snapshot().flying), false);
  const origin = id === 'hoops-minute' ? [200, 475] : [130, 431]; point(h, ...origin, true, true); h.frame(); assert.equal(h.snapshot().dragging, true); h.game.cancelInput(); point(h, 0, 0); h.api.input.pointer.released = true; h.frame(); assert.equal(Boolean(h.snapshot().flight || h.snapshot().flying), false);
});

function bowlingReference(rolls) { let sum = 0, ball = 0; for (let f = 0; f < 10; f++) { if (rolls[ball] === 10) { sum += 10 + (rolls[ball + 1] || 0) + (rolls[ball + 2] || 0); ball++; } else { const pair = (rolls[ball] || 0) + (rolls[ball + 1] || 0); sum += pair + (pair === 10 ? rolls[ball + 2] || 0 : 0); ball += 2; } } return sum; }
test('bowling: compensation for oil gives twelve strikes and the legal 300 maximum', () => {
  const h = gameHarness('pocket-bowler');
  const s = run(h, (h, s) => { h.held.clear(); if (s.rolling || s.delay > 0) return; const difference = -s.oil * .00145 + .008 - s.aim; if (Math.abs(difference) > .0025) h.held.add(difference > 0 ? 'aimRight' : 'aimLeft'); else h.edges.add('bowl'); });
  assert.equal(s.bowlingScore, 300); assert.deepEqual(s.rolls, Array(12).fill(10)); assert.equal(s.frames.length, 10); assert.deepEqual(s.frames[9], [10, 10, 10]); assert.equal(h.result.score, 3000);
});
test('bowling: mixed rolls retain spare/strike bonuses and a finite tenth frame', () => {
  const h = gameHarness('pocket-bowler'); const s = run(h, (h, s) => { if (!s.rolling && s.delay <= 0) h.edges.add('bowl'); });
  assert.ok(s.spares > 0 && s.strikes > 0); assert.equal(s.bowlingScore, bowlingReference(s.rolls)); assert.equal(s.frames.length, 10); assert.ok(s.rolls.length <= 21);
});

test('baseball: twelve timed swings all reach home-run distance', () => {
  const h = gameHarness('home-run-hero'); const s = run(h, (h, s) => { if (s.phase === 'pitch' && s.progress >= .96 && !s.swung) h.edges.add('swing'); });
  assert.equal(s.homers, 12); assert.equal(s.hits, 12); assert.ok(s.best >= 420); assert.ok(h.result.score >= h.config.medals[2]);
});
test('baseball and cricket: waiting has fair, finite failure conditions', () => {
  const base = gameHarness('home-run-hero'); base.step(100); base.assertSettled(); assert.equal(base.snapshot().hits, 0);
  const cricket = gameHarness('wicket-rush'); cricket.step(30); cricket.assertSettled(); assert.equal(cricket.snapshot().wickets, 3); assert.equal(cricket.snapshot().deliveries, 3);
});
test('cricket: six well-timed lofts complete the chase without a wicket', () => {
  const h = gameHarness('wicket-rush'); h.press('loft'); const s = run(h, (h, s) => { if (s.phase === 'pitch' && s.progress >= .96 && !s.swung) h.edges.add('bat'); });
  assert.equal(s.runs, 36); assert.equal(s.wickets, 0); assert.equal(s.deliveries, 6); assert.equal(s.boundaries, 6); assert.ok(h.result.score >= h.config.medals[2]);
});

test('skiing: a visible-gate controller clears all forty gates and the finish', () => {
  const h = gameHarness('downhill-dash'); const s = run(h, (h, s) => { const gate = s.gates.find(g => !g.passed && g.ahead > 0); point(h, gate ? gate.center : 480, 450, true); h.held.add('tuck'); });
  assert.equal(s.passed, 40); assert.equal(s.missed, 0); assert.equal(s.lives, 3); assert.ok(s.distance >= 2200); assert.ok(h.result.score >= h.config.medals[2]);
});

test('archery: wind compensation can place all ten arrows in the bullseye', () => {
  const h = gameHarness('archery-grove');
  for (let arrow = 0; arrow < 10; arrow++) {
    const s = h.snapshot(), speed = 716; let best = { error: Infinity };
    // Solve the flight equation against the target plane; this uses no mutable game internals.
    for (let angle = -1.1; angle < -.08; angle += .0005) {
      const vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
      const time = Math.abs(s.wind) < .0001 ? 672 / vx : (-vx + Math.sqrt(vx * vx + 2 * s.wind * 672)) / s.wind;
      const error = Math.abs(431 + vy * time + 150 * time * time - s.targetY); if (error < best.error) best = { angle, error };
    }
    drag(h, 130, 431, best.angle, 84); while (!h.result && (h.snapshot().flying || h.snapshot().delay > 0)) h.frame();
  }
  h.assertSettled(); assert.equal(h.snapshot().bullseyes, 10); assert.equal(h.snapshot().ringTotal, 100); assert.equal(h.result.score, 10750);
});

test('curling: real stones settle, score only the closer team, and complete three ends', () => {
  const h = gameHarness('curling-cove'); let maximumStones = 0;
  const s = run(h, (h, s) => { maximumStones = Math.max(maximumStones, s.stones.length); if (s.phase === 'aim') h.edges.add('throw'); });
  assert.equal(s.endScores.length, 3); for (const [a, b] of s.endScores) assert.ok((a === 0 || b === 0) && a <= 4 && b <= 4); assert.equal(maximumStones, 8); assert.ok(s.us > s.them); assert.ok(h.result.score >= h.config.medals[1]);
});
test('curling: sweeping adds controllable distance', () => {
  const a = gameHarness('curling-cove'), b = gameHarness('curling-cove'); a.press('throw'); b.press('throw'); b.held.add('sweep'); a.step(1); b.step(1); assert.ok(b.snapshot().stones[0].y < a.snapshot().stones[0].y);
});

test('sailing: six numbered buoys can be rounded cleanly within the clock', () => {
  const h = gameHarness('sail-sprint'); const s = run(h, (h, s) => point(h, s.target.x, s.target.y, true)); assert.equal(s.next, 6); assert.equal(s.bumps, 0); assert.ok(s.time > 60); assert.ok(h.result.score >= h.config.medals[2]);
});
test('sailing: tacks cross the wind and reefing reduces speed', () => {
  const a = gameHarness('sail-sprint'), b = gameHarness('sail-sprint'); a.press('tack'); assert.equal(a.snapshot().tacks, 1); assert.ok(Math.abs(Math.atan2(Math.sin(a.snapshot().heading - a.snapshot().wind), Math.cos(a.snapshot().heading - a.snapshot().wind))) > .58); b.held.add('reef'); b.step(3); const c = gameHarness('sail-sprint'); c.step(3); assert.ok(b.snapshot().speed < c.snapshot().speed * .7);
});

test('farm: planting costs resources, immature crops stay planted, ripe sales pay the current contract', () => {
  const h = gameHarness('orchard-keeper'); h.press('work'); assert.equal(h.snapshot().coins, 32); assert.equal(h.snapshot().water, 13); h.press('work'); assert.equal(h.snapshot().harvests, 0); h.step(8); const before = h.snapshot(); h.press('work'); const after = h.snapshot(); assert.equal(after.coins - before.coins, before.wanted === 0 ? 23 : 15); assert.equal(after.plots[0].crop, -1);
});
test('farm: repeated sowing and harvests reach a rewarding season result', () => {
  const h = gameHarness('orchard-keeper'); const grow = [8, 15, 25]; const s = run(h, (h, s, f) => { if (f % 6) return; const ready = s.plots.findIndex(p => p.crop >= 0 && p.age >= grow[p.crop]), empty = s.plots.findIndex(p => p.crop < 0), i = ready >= 0 ? ready : empty; if (i >= 0) { point(h, 100 + i % 3 * 193, 170 + Math.floor(i / 3) * 132, false, true); h.edges.add('work'); } if (s.water < 1 && s.coins >= 8) h.edges.add('water'); });
  assert.ok(s.coins >= 220); assert.ok(s.harvests > 50); assert.ok(s.contracts > 0); assert.ok(s.water >= 0 && s.water <= 30); assert.ok(h.result.score >= h.config.medals[2]);
});

test('café: only correct prepared ingredients can satisfy an order', () => {
  const h = gameHarness('cafe-rush'); h.press('serve'); assert.equal(h.snapshot().served, 0); h.press('coffee', 'milk'); h.step(3.1); assert.equal(h.snapshot().stock.coffee, 1); assert.equal(h.snapshot().stock.milk, 1); h.press('serve'); assert.equal(h.snapshot().served, 1); assert.equal(h.snapshot().stock.coffee, 0); assert.equal(h.snapshot().stock.milk, 1); h.press('serve'); assert.equal(h.snapshot().served, 1);
});
test('café: a pipelined kitchen can serve a full shift with no expired orders', () => {
  const h = gameHarness('cafe-rush'); const s = run(h, (h, s, f) => { if (f % 6) return; const need = { coffee: 0, milk: 0, tea: 0, cocoa: 0, lemon: 0 }; for (const order of s.orders) for (const item of order.need) need[item]++; if (s.brew.left <= 0) { if (s.stock.coffee < Math.max(1, need.coffee)) h.edges.add('coffee'); else if (s.stock.tea < Math.max(1, need.tea)) h.edges.add('tea'); } if (s.froth.left <= 0 && s.stock.milk < Math.max(1, need.milk)) h.edges.add('milk'); for (const item of ['cocoa', 'lemon']) if (s.stock[item] < Math.max(1, need[item])) h.edges.add(item); const i = s.orders.findIndex(o => o.need.every(item => s.stock[item] > 0)); if (i >= 0) { point(h, 100 + i * 224, 150, false, true); h.edges.add('serve'); } });
  assert.equal(s.lost, 0); assert.ok(s.served >= 20); assert.ok(s.orders.length <= 4); assert.ok(Object.values(s.stock).every(n => n >= 0 && n <= 4)); assert.ok(h.result.score >= h.config.medals[2]);
});
test('café: five expired tickets end the shift', () => { const h = gameHarness('cafe-rush'); h.step(100); h.assertSettled(); assert.equal(h.snapshot().lost, 5); assert.equal(h.snapshot().served, 0); });

test('colony: facilities cost supplies and produce on the building day', () => {
  const h = gameHarness('colony-balance'); point(h, 80 + 4 * 179, 400, false, true); h.edges.add('commit'); h.frame(); const s = h.snapshot(); assert.equal(s.day, 2); assert.deepEqual(s.facilities, [1, 0, 0]); assert.equal(s.food, 45 - 8 + 3 - 4); assert.equal(s.water, 45 - 8 - 4); assert.equal(s.energy, 45 - 12 - 3);
});
test('colony: reserves and early infrastructure support a complete twenty-day settlement', () => {
  const h = gameHarness('colony-balance'); const s = run(h, (h, s) => { if (s.delay > 0) return; let action; if (s.energy < 22 + s.today.energy) action = 2; else if (s.food < 20) action = 0; else if (s.water < 22 + s.today.water) action = 1; else if (s.morale < 25) action = 3; else if (s.day < 13 && s.food > 25 && s.water > 27 && s.energy > 30) { action = 4; const focus = s.facilities.indexOf(Math.min(...s.facilities)); while (h.snapshot().focus !== focus) h.press('focus'); } else { const reserves = [s.food / 4, s.water / (4 + s.today.water), s.energy / (3 + s.today.energy), s.morale / 1.3]; action = reserves.indexOf(Math.min(...reserves)); } point(h, 80 + action * 179, 400, false, true); h.edges.add('commit'); });
  assert.equal(s.day, 21); assert.ok(s.food > 0 && s.water > 0 && s.energy > 0 && s.morale > 0); assert.ok(s.builds >= 3); assert.ok(h.result.score >= h.config.medals[2]);
});
test('colony: neglecting a critical resource ends the run immediately', () => { const h = gameHarness('colony-balance'); const s = run(h, (h, s) => { if (s.delay <= 0) h.edges.add('commit'); }); assert.ok(s.day < 21); assert.ok(s.food === 0 || s.water === 0 || s.energy === 0 || s.morale === 0); });
