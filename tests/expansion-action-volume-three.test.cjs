'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { gameHarness } = require('./helpers/arcade-harness.cjs');
const IDS = ['drift-circuit', 'dungeon-lantern', 'boomerang-bay', 'magnet-miner', 'snowball-siege', 'tether-twins', 'echo-dodge', 'spark-sweep'];
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function play(id, controller, frames = 18000) { const h = gameHarness(id); for (let f = 0; f < frames && !h.result; f++) { controller(h, h.snapshot(), f); h.frame(); } return h; }
function win(h, title) { assert.equal(h.result?.title, title); assert.equal(h.score, h.result.score); h.assertSettled(); }
function point(h, x, y, down = false, pressed = false) { Object.assign(h.api.input.pointer, { active: true, inside: true, x, y, down, pressed }); }

for (const id of IDS) test(`${id}: deterministic play, draw purity, bounded terminal lifecycle`, () => {
  const h = gameHarness(id), same = gameHarness(id);
  assert.equal(new Set(h.config.controls.map(c => c.id)).size, h.config.controls.length);
  assert.ok(h.config.controls.every(c => c.label && c.keys.length));
  assert.ok(h.config.medals.every((m, i, a) => m > 0 && (!i || m > a[i - 1])));
  h.draw(); h.step(3); same.step(3); assert.deepEqual(h.snapshot(), same.snapshot());
  const before = h.snapshot(), calls = h.randomCalls; h.draw(); h.draw();
  assert.deepEqual(h.snapshot(), before); assert.equal(h.randomCalls, calls);
  h.step(210); h.assertSettled();
});

test('Drift Circuit: braking removes momentum and the handbrake changes tire grip', () => {
  const normal = gameHarness('drift-circuit'), drifting = gameHarness('drift-circuit');
  for (const h of [normal, drifting]) { h.held.add('throttle'); h.step(.8); h.held.add('right'); }
  drifting.held.add('drift'); normal.step(.45); drifting.step(.45);
  const slip = h => { const c = h.snapshot().car; return Math.abs(-c.vx * Math.sin(c.angle) + c.vy * Math.cos(c.angle)); };
  assert.ok(slip(drifting) > slip(normal) * 1.25, 'loose rear tires preserve more sideways velocity');
  normal.held.clear(); const speed = Math.hypot(normal.snapshot().car.vx, normal.snapshot().car.vy);
  normal.held.add('brake'); normal.step(.4);
  assert.ok(Math.hypot(normal.snapshot().car.vx, normal.snapshot().car.vy) < speed * .3);
});

test('Drift Circuit: twenty-four ordered checkpoints complete three actual laps', () => {
  const h = play('drift-circuit', (h, s) => {
    h.held.clear(); const p = s.checkpoints[s.next], difference = wrap(Math.atan2(p.y - s.car.y, p.x - s.car.x) - s.car.angle), speed = Math.hypot(s.car.vx, s.car.vy);
    if (Math.abs(difference) > .035) h.held.add(difference > 0 ? 'right' : 'left');
    if (speed < 220) h.held.add('throttle');
    if (Math.abs(difference) > .7 && speed > 140) h.held.add('brake');
  });
  win(h, 'A beautiful line around.'); assert.equal(h.snapshot().laps, 3); assert.equal(h.snapshot().checkpointsHit, 24);
});

test('Dungeon Lantern: a locked exit cannot skip the room or its key', () => {
  const h = gameHarness('dungeon-lantern'); h.held.add('right'); h.step(3);
  assert.ok(h.snapshot().player.x > 797); assert.equal(h.snapshot().room, 1); assert.equal(h.snapshot().hasKey, false);
});

test('Dungeon Lantern: melee, keys, doors, and guardian recovery permit a full adventure', () => {
  const h = play('dungeon-lantern', (h, s) => {
    h.held.clear(); h.held.add('attack');
    const e = s.enemies.slice().sort((a, b) => Math.hypot(a.x - s.player.x, a.y - s.player.y) - Math.hypot(b.x - s.player.x, b.y - s.player.y))[0];
    const target = e || s.key || (s.hasKey ? { x: 820, y: 300 } : { x: 480, y: 300 });
    let dx = target.x - s.player.x, dy = target.y - s.player.y;
    if (e && e.type === 'boss' && e.state === 'warn' && Math.hypot(dx, dy) < 126) { dx = -dx; dy = -dy; }
    if (Math.abs(dx) > 5) h.held.add(dx > 0 ? 'right' : 'left');
    if (Math.abs(dy) > 5) h.held.add(dy > 0 ? 'down' : 'up');
    assert.ok(s.projectiles.length < 30);
  });
  win(h, 'The lantern found the morning.'); assert.equal(h.snapshot().room, 6); assert.equal(h.snapshot().enemies.length, 0); assert.equal(h.snapshot().kills, 19);
});

test('Boomerang Bay: another press cannot create a second airborne boomerang', () => {
  const h = gameHarness('boomerang-bay'); h.press('throw'); h.press('throw');
  assert.equal(h.snapshot().throws, 1); assert.ok(h.snapshot().boomerang);
  h.step(5.5); assert.equal(h.snapshot().boomerang, null); assert.equal(h.snapshot().catches, 0, 'automatic returns do not earn a timed catch');
});

test('Boomerang Bay: curved throws hit ordered sequences and reward five timed catches', () => {
  const h = play('boomerang-bay', (h, s) => {
    const b = s.boomerang;
    if (!b) { const t = s.targets[0], angle = Math.atan2(t.y - 478, t.x - 220) - .75 * .42 / 2; point(h, 220 + Math.cos(angle) * 300, 478 + Math.sin(angle) * 300, false, true); }
    else if (b.returning && Math.hypot(b.x - 220, b.y - 478) < 70) h.edges.add('throw');
  });
  win(h, 'Every throw found its way home.'); assert.equal(h.snapshot().hits, 15); assert.equal(h.snapshot().catches, 5); assert.equal(h.snapshot().throws, 5);
});

function firstMinerContact(s, padding = 7) {
  const angle = Math.PI / 2 + Math.sin((s.clock + 1 / 60) * 1.12) * 1.04, dx = Math.cos(angle), dy = Math.sin(angle);
  let hit = null, near = Infinity;
  for (const o of s.objects) {
    if (o.taken) continue;
    const x = o.x - 480, y = o.y - 81, along = x * dx + y * dy, across = Math.abs(x * dy - y * dx), r = o.r + padding;
    if (along < 0 || across >= r) continue;
    const at = along - Math.sqrt(r * r - across * across);
    if (at < near) { near = at; hit = o; }
  }
  return hit;
}

test('Magnet Miner: heavy loads retract slowly and dynamite discards one at a cost', () => {
  const h = gameHarness('magnet-miner'); let launched = false;
  for (let f = 0; f < 600 && h.snapshot().hook.mode !== 'back'; f++) {
    const s = h.snapshot(); if (!launched && s.hook.mode === 'swing' && firstMinerContact(s, 9)?.type === 'rock') { h.edges.add('cast'); launched = true; } h.frame();
  }
  const before = h.snapshot(); assert.equal(before.hook.load?.type, 'rock'); h.step(.2);
  assert.ok(Math.abs(before.hook.length - h.snapshot().hook.length - 320 / 3.8 * .2) < .001);
  h.press('blast'); assert.equal(h.snapshot().hook.load, null); assert.equal(h.snapshot().dynamite, 1);
});

test('Magnet Miner: swing timing and valuable first contacts meet all three quotas', () => {
  const h = play('magnet-miner', (h, s) => { if (s.hook.mode === 'swing' && !s.transition) { const hit = firstMinerContact(s); if (hit && hit.type !== 'rock') h.edges.add('cast'); } });
  win(h, 'A very good day underground.'); assert.equal(h.snapshot().shift, 3); assert.ok(h.snapshot().earned >= 1050); assert.equal(h.snapshot().dynamite, 2);
});

test('Snowball Siege: shots consume one charge and the rival receives a real intervening turn', () => {
  const h = gameHarness('snowball-siege'), wind = h.snapshot().wind;
  h.press('fire'); assert.equal(h.snapshot().ammo, 9); assert.equal(h.snapshot().projectile.owner, 'player'); h.press('fire'); assert.equal(h.snapshot().ammo, 9);
  let sawRival = false;
  for (let f = 0; f < 1000 && !h.result; f++) { if (h.snapshot().projectile?.owner === 'rival') sawRival = true; if (h.snapshot().round === 2 && h.snapshot().phase === 'aim') break; h.frame(); }
  assert.equal(sawRival, true); assert.equal(h.snapshot().round, 2); assert.notEqual(h.snapshot().wind, wind);
});
function snowPower(s, angle) {
  const start = { x: 170 + Math.cos(angle) * 25, y: 422 - Math.sin(angle) * 25 }; let lo = 220, hi = 470;
  for (let i = 0; i < 24; i++) { const v = (lo + hi) / 2, vy = -Math.sin(angle) * v, t = (-vy + Math.sqrt(vy * vy + 360 * (440 - start.y))) / 180, x = start.x + Math.cos(angle) * v * t + .5 * s.wind * t * t; if (x < s.rival.x) lo = v; else hi = v; }
  return (lo + hi) / 2;
}

test('Snowball Siege: wind-adjusted ballistic shots break the fort and defeat the rival', () => {
  const h = play('snowball-siege', (h, s) => {
    h.held.clear(); if (s.phase !== 'aim') return;
    const angle = 1.18, force = snowPower(s, angle);
    if (Math.abs(angle - s.angle) > .008) h.held.add(angle > s.angle ? 'higher' : 'lower');
    if (Math.abs(force - s.power) > 1.2) h.held.add(force > s.power ? 'powerUp' : 'powerDown');
    if (Math.abs(angle - s.angle) <= .008 && Math.abs(force - s.power) <= 1.2) h.edges.add('fire');
  });
  win(h, 'The snow has settled in your favor.'); assert.equal(h.snapshot().rival.hp, 0); assert.ok(h.snapshot().player.hp > 0); assert.ok(h.snapshot().destroyed >= 3); assert.ok(h.snapshot().blocks.length < 12);
});

test('Tether Twins: translation moves both bodies and rotation preserves their separation', () => {
  const h = gameHarness('tether-twins'); h.held.add('up'); h.step(.3); const moved = h.snapshot();
  assert.ok(moved.bodies.every(b => b.y < 240)); h.held.clear(); h.held.add('right'); h.step(.4);
  const s = h.snapshot(); assert.ok(Math.abs(s.bodies[0].y - s.bodies[1].y) > 70);
  assert.ok(Math.abs(Math.hypot(s.bodies[0].x - s.bodies[1].x, s.bodies[0].y - s.bodies[1].y) - 104) < 1e-8);
});

test('Tether Twins: both bodies fit all wide and split gates without losing a shield', () => {
  const h = play('tether-twins', (h, s) => {
    h.held.clear(); const g = s.gates.find(g => !g.counted); if (!g) return;
    const difference = wrap((g.split ? Math.PI / 2 : 0) - s.pair.angle);
    if (Math.abs(difference) > .025) h.held.add(difference > 0 ? 'right' : 'left');
    if (s.pair.y < g.center - 2) h.held.add('down'); if (s.pair.y > g.center + 2) h.held.add('up');
  });
  win(h, 'A beautiful way together.'); assert.equal(h.snapshot().passed, 24); assert.equal(h.snapshot().clean, 24); assert.equal(h.snapshot().shields, 3);
});

test('Echo Dodge: hazards replay actual delayed historical positions', () => {
  const h = gameHarness('echo-dodge');
  for (const action of ['right', 'down', 'left']) { h.held.clear(); h.held.add(action); h.step(2); }
  const s = h.snapshot(), e = s.echoes.find(e => e.active), sample = s.history.find(p => p.t === e.recordedAt);
  assert.ok(sample); assert.equal(e.x, sample.x); assert.equal(e.y, sample.y);
  assert.ok(Math.abs(s.time - e.delay - e.recordedAt) <= .051);
  assert.ok(s.history.length <= 175);
});

test('Echo Dodge: a sustained route survives three simultaneous delayed copies', () => {
  let corner = 0;
  const h = play('echo-dodge', (h, s) => {
    const points = [[180, 120], [780, 120], [780, 480], [180, 480]], p = points[corner];
    if (Math.hypot(p[0] - s.player.x, p[1] - s.player.y) < 12) corner = (corner + 1) % points.length;
    point(h, points[corner][0], points[corner][1], true);
    assert.ok(s.history.length <= 175);
  });
  win(h, 'You left the past behind.'); assert.equal(h.snapshot().time, 60); assert.equal(h.snapshot().echoes.filter(e => e.active).length, 3); assert.equal(h.snapshot().player.hp, 4);
});

test('Spark Sweep: closing a trail fills one region and leaves the roaming light connected', () => {
  const h = gameHarness('spark-sweep'); h.press('draw'); h.held.add('down');
  for (let f = 0; f < 200 && h.snapshot().player.y < 15; f++) h.frame();
  const s = h.snapshot(); assert.equal(s.trail.length, 0); assert.equal(s.armed, false); assert.ok(s.claimed > .45 && s.claimed < .6);
  const zeros = s.grid.map((value, i) => value ? -1 : i).filter(i => i >= 0), seen = new Set([zeros[0]]), queue = [zeros[0]];
  for (let i = 0; i < queue.length; i++) { const at = queue[i], x = at % 28, y = Math.floor(at / 28); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, n = ny * 28 + nx; if (nx >= 0 && nx < 28 && ny >= 0 && ny < 16 && !s.grid[n] && !seen.has(n)) { seen.add(n); queue.push(n); } } }
  assert.equal(seen.size, zeros.length);
  assert.equal(s.grid[Math.round(s.light.y) * 28 + Math.round(s.light.x)], 0);
});

test('Spark Sweep: six public-input closures claim all three panels', () => {
  let panel = 0, phase = 0;
  const h = play('spark-sweep', (h, s) => {
    h.held.clear(); if (s.transition) return; if (panel !== s.panel) { panel = s.panel; phase = 0; }
    if (phase === 0) { if (!s.armed && !s.trail.length) h.edges.add('draw'); h.held.add('down'); if (s.player.y === 15) phase = 1; }
    else if (phase === 1) { if (s.player.y > 8) h.held.add('up'); else phase = 2; }
    else if (phase === 2) { if (!s.armed && !s.trail.length) h.edges.add('draw'); h.held.add('right'); if (s.player.x === 27) phase = 3; }
  });
  win(h, 'Every panel has a little more light.'); assert.equal(h.snapshot().panel, 3); assert.equal(h.snapshot().closures, 6); assert.ok(h.snapshot().claimed >= .7); assert.equal(h.snapshot().hearts, 3);
});
