'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { gameHarness } = require('./helpers/arcade-harness.cjs');
const IDS = ['penalty-keeper', 'rally-courier', 'train-yard', 'reef-keeper'];
const point = (h, x, y) => Object.assign(h.api.input.pointer, { x, y, down: false, pressed: true, inside: true, active: true });
function run(h, controller, limit = 14000) { for (let f = 0; f < limit && !h.result; f++) { controller(h, h.snapshot(), f); h.frame(); } h.assertSettled(); return h.snapshot(); }

for (const id of IDS) test(id + ': determinism, finite rendering and draw purity', () => {
  const a = gameHarness(id), b = gameHarness(id); assert.ok(a.config.controls.length >= 3); assert.ok(a.config.howTo.length >= 3); assert.equal(a.config.medals.length, 3);
  for (let f = 0; f < 360; f++) { if (f % 79 === 0) { const action = a.config.controls[Math.floor(f / 79) % a.config.controls.length].id; a.edges.add(action); b.edges.add(action); } a.frame(); b.frame(); if (f % 60 === 0) { const before = a.snapshot(), calls = a.randomCalls; a.draw(); a.draw(); assert.deepEqual(a.snapshot(), before); assert.equal(a.randomCalls, calls); } }
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test('goalkeeper: public touch zones and a correctly timed dive save all twelve shots', () => {
  const h = gameHarness('penalty-keeper'); const s = run(h, (h, s) => { if (s.phase === 'shot' && s.progress > .55 && !s.diving) point(h, 270 + s.targetLane * 210, s.targetHigh ? 168 : 281); }); assert.equal(s.saves, 12); assert.equal(s.conceded, 0); assert.ok(h.result.score >= h.config.medals[2]);
});
test('goalkeeper: keyboard zones offer the same complete save path', () => {
  const h = gameHarness('penalty-keeper'); const s = run(h, (h, s) => { if (s.phase === 'runup') { if (s.lane !== s.targetLane) h.edges.add(s.lane < s.targetLane ? 'right' : 'left'); if (s.high !== s.targetHigh) h.edges.add(s.targetHigh ? 'up' : 'down'); } if (s.phase === 'shot' && s.progress > .55 && !s.diving) h.edges.add('dive'); }); assert.equal(s.saves, 12);
});
test('goalkeeper: premature dives recover before impact and concede the shot', () => {
  const h = gameHarness('penalty-keeper'); const s = run(h, (h, s) => { if (s.phase === 'runup' && !s.diving) point(h, 270 + s.targetLane * 210, s.targetHigh ? 168 : 281); }); assert.equal(s.saves, 0); assert.equal(s.conceded, 12);
});

test('courier: pointer routing takes an open detour around the closed 7–8 street', () => {
  const h = gameHarness('rally-courier'); point(h, 276, 204); h.frame(); for (let f = 0; f < 1200 && (h.snapshot().node !== 7 || h.snapshot().next >= 0); f++) h.frame(); assert.equal(h.snapshot().node, 7); point(h, 412, 204); h.frame(); assert.notEqual(h.snapshot().next, 8); assert.ok(h.snapshot().path.includes(8));
});
test('courier: pedal, route, pickup and bell mechanics complete all five deliveries', () => {
  const h = gameHarness('rally-courier'); const s = run(h, (h, s, f) => { if (f % 15 === 0) point(h, 140 + s.target % 6 * 136, 119 + Math.floor(s.target / 6) * 85); h.held.add('boost'); if (s.cooldown <= 0 && s.cars.some(c => Math.hypot(s.x - c.x, s.y - c.y) < 90)) h.edges.add('bell'); }); assert.equal(s.delivered, 5); assert.equal(s.carrying, false); assert.ok(s.time > 0); assert.ok(s.energy >= 0 && s.energy <= 100); assert.equal(s.cars.length, 6); assert.ok(h.result.score >= h.config.medals[2]);
});
test('courier: keyboard navigation leaves the start, while an idle rider has a finite clock', () => {
  const h = gameHarness('rally-courier'); h.held.add('right'); h.step(1.1); assert.ok(h.snapshot().x > 140); h.held.clear(); h.step(100); h.assertSettled(); assert.equal(h.snapshot().delivered, 0);
});

test('railway: correct live switching routes eighteen trains with bounded trails and no collisions', () => {
  const h = gameHarness('train-yard'); const s = run(h, (h, s) => { for (let i = 0; i < 3; i++) { const to = [3, 4, 5][i], train = s.trains.filter(t => t.to === to).sort((a, b) => a.remaining - b.remaining)[0]; if (train) { const desired = i === 0 ? train.color === 2 ? 1 : 0 : i === 1 ? train.color === 1 ? 1 : 0 : train.color === 2 ? 1 : 0; if (s.switches[i] !== desired) h.edges.add(['switchA', 'switchB', 'switchC'][i]); } } assert.ok(s.trains.length <= 18 && s.trains.every(t => t.trailLength <= 46)); }); assert.equal(s.delivered, 18); assert.equal(s.resolved, 18); assert.equal(s.hearts, 3); assert.equal(s.collisions, 0); assert.ok(h.result.score >= h.config.medals[2]);
});
test('railway: touch switch selection and a held signal change routing and stop arrivals', () => {
  const h = gameHarness('train-yard'); point(h, 300, 300); h.frame(); assert.equal(h.snapshot().switches[0], 1); h.held.add('signal'); h.step(4.8); const before = h.snapshot().trains[0]; assert.equal(before.to, 3); assert.ok(before.remaining < 54); h.step(.5); assert.equal(h.snapshot().trains[0].distance, before.distance); h.held.clear(); h.step(1); assert.equal(h.snapshot().trains[0].to, 5);
});
test('railway: blocking the queue causes collisions and closes the yard', () => {
  const h = gameHarness('train-yard'); h.held.add('signal'); h.step(170); h.assertSettled(); const s = h.snapshot(); assert.equal(s.hearts, 0); assert.equal(s.collisions, 3); assert.equal(s.delivered, 0);
});
test('railway: wrong color depots cost safety and cannot count as deliveries', () => {
  const h = gameHarness('train-yard'); h.step(170); h.assertSettled(); assert.equal(h.snapshot().hearts, 0); assert.equal(h.snapshot().mistakes, 3); assert.ok(h.snapshot().delivered < 15);
});

test('reef: restoration spends funds and clean water supports feeding and fish growth', () => {
  const h = gameHarness('reef-keeper'); h.press('tend'); const s = h.snapshot(); assert.equal(s.day, 2); assert.equal(s.coral, 61); assert.equal(s.fish, 33); assert.equal(s.food, 34); assert.equal(s.coins, 18); assert.equal(s.pollution, 22);
});
test('reef: unaffordable actions leave the day and ecosystem unchanged', () => {
  const h = gameHarness('reef-keeper'); for (let i = 0; i < 3; i++) { h.press('tend'); h.step(.4); } const before = h.snapshot(); assert.equal(before.coins, 2); h.press('tend'); assert.equal(h.snapshot().day, before.day); assert.equal(h.snapshot().coral, before.coral); assert.equal(h.snapshot().coins, 2);
});
test('reef: balancing tours, food, clean water and restoration achieves all ecological goals', () => {
  const h = gameHarness('reef-keeper'); const s = run(h, (h, s) => { if (s.delay > 0) return; let action = s.coins < 8 ? 3 : s.food < (Math.ceil(s.fish / 10) + 1) * 2 ? 1 : s.pollution > 32 ? 2 : s.coral < 67 ? 0 : s.fish < 50 ? 4 : s.food < 35 ? 1 : s.pollution > 17 ? 2 : 3; if (s.coins < [8, 4, 6, 0, 10][action]) action = 3; point(h, 100 + action * 180, 450); h.edges.add('tend'); }); assert.equal(s.day, 17); assert.ok(s.coral >= 60 && s.fish >= 45 && s.pollution <= 45); assert.ok(h.result.score >= h.config.medals[2]);
});
test('reef: continual tourism without care fails the ecological targets', () => {
  const h = gameHarness('reef-keeper');
  point(h, 100 + 3 * 180, 450); h.frame(); const s = run(h, (h, s) => { if (s.delay <= 0) h.edges.add('tend'); }); assert.ok(s.coral < 60 || s.fish < 45 || s.pollution > 45); assert.ok(s.day <= 17);
});
