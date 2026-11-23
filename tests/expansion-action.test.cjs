'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { gameHarness } = require('./helpers/arcade-harness.cjs');

const IDS = ['prism-breaker', 'serpent-garden', 'meteor-drift', 'bubble-bay', 'flappy-fin', 'tunnel-dash', 'lava-lift', 'ghost-lantern', 'ricochet-range', 'shield-spin', 'blade-bloom', 'pinball-grove'];
const DIRECTIONS = [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// The controllers use only the public inspection and input interfaces. They never
// change a game object, replace its rules, or call api.end to manufacture a result.
function play(id, control, maxFrames = 12000) {
  const h = gameHarness(id);
  for (let frame = 0; frame < maxFrames && !h.result; frame++) {
    control(h, h.snapshot(), frame);
    h.frame();
  }
  return h;
}
function win(h, title) {
  assert.equal(h.result?.title, title);
  assert.equal(h.score, h.result.score);
  h.assertSettled();
}
function point(h, x, y, down = false, pressed = false) {
  Object.assign(h.api.input.pointer, { active: true, inside: true, x, y, down, pressed });
}
function pathTo(start, goal, open) {
  const queue = [{ x: start.x, y: start.y, path: [] }];
  const seen = new Set([start.x + ',' + start.y]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (goal(p.x, p.y)) return p.path;
    for (const [action, dx, dy] of DIRECTIONS) {
      const x = p.x + dx, y = p.y + dy, key = x + ',' + y;
      if (!seen.has(key) && open(x, y)) {
        seen.add(key); queue.push({ x, y, path: p.path.concat(action) });
      }
    }
  }
  return null;
}

for (const id of IDS) test(`${id}: seeded state, pure rendering, and a settled idle ending`, () => {
  const h = gameHarness(id), again = gameHarness(id);
  assert.equal(h.config.controls.length, new Set(h.config.controls.map(c => c.id)).size);
  assert.ok(h.config.controls.every(c => c.label && c.keys.length));
  assert.ok(h.config.howTo.length >= 3);
  assert.ok(h.config.medals.every((n, i, list) => n > 0 && (!i || n > list[i - 1])));
  h.draw(); h.step(3); again.step(3);
  assert.deepEqual(h.snapshot(), again.snapshot());
  const before = h.snapshot(), randomCalls = h.randomCalls;
  h.draw(); h.draw();
  assert.deepEqual(h.snapshot(), before, 'painting a menu or paused frame cannot change play');
  assert.equal(h.randomCalls, randomCalls, 'painting does not advance the seeded random stream');
  h.step(210);
  h.assertSettled();
});

test('Prism Breaker: edge aiming clears all four formations within the clock', () => {
  const h = play('prism-breaker', (h, s) => {
    const b = s.ball; let destination = b.x;
    if (b.vy > 0 && !b.waiting) {
      let landing = b.x + b.vx * Math.max(0, (510 - b.y) / b.vy);
      while (landing < 43 || landing > 917) landing = landing < 43 ? 86 - landing : 1834 - landing;
      const target = s.bricks[s.bricks.length - 1];
      const angle = target ? Math.atan2(target.x + target.w / 2 - landing, 510 - target.y) : 0;
      destination = landing - clamp(angle / 1.08, -0.9, 0.9) * s.paddle.width / 2;
    }
    point(h, destination, 520);
  });
  win(h, 'Every prism, scattered.');
  assert.equal(h.snapshot().level, 4);
  assert.equal(h.snapshot().bricks.length, 0);
  assert.ok(h.snapshot().time > 0);
});

test('Serpent Garden: reversal is rejected and only one turn is queued per grid step', () => {
  const h = gameHarness('serpent-garden');
  h.press('left');
  assert.equal(h.snapshot().queued, null);
  h.press('up'); h.press('down');
  assert.equal(h.snapshot().queued, 'up');
  h.step(1.5);
  assert.equal(h.snapshot().direction, 'up');
});

test('Serpent Garden: all twenty fruits remain reachable during a growing route', () => {
  const h = play('serpent-garden', (h, s) => {
    if (s.queued) return;
    const blocked = new Set(s.snake.slice(0, -1).concat(s.stones).map(p => p.x + ',' + p.y));
    const path = pathTo(s.snake[0], (x, y) => x === s.fruit.x && y === s.fruit.y,
      (x, y) => x >= 0 && x < 24 && y >= 0 && y < 14 && !blocked.has(x + ',' + y));
    assert.ok(path?.length, 'the next fruit has a safe path for this route');
    h.edges.add(path[0]);
  }, 18000);
  win(h, 'The garden is flourishing.');
  assert.equal(h.snapshot().eaten, 20);
  assert.ok(h.snapshot().stones.length >= 3);
});

test('Meteor Drift: aimed fire, bursts of thrust, and a limited shield clear four fields', () => {
  const h = play('meteor-drift', (h, s, frame) => {
    h.held.clear(); h.held.add('shoot');
    const rock = s.rocks.slice().sort((a, b) => Math.hypot(a.x - s.ship.x, a.y - s.ship.y) - Math.hypot(b.x - s.ship.x, b.y - s.ship.y))[0];
    if (rock) {
      const angle = Math.atan2(rock.y + rock.vy * 0.25 - s.ship.y, rock.x + rock.vx * 0.25 - s.ship.x);
      const delta = wrap(angle - s.ship.angle);
      if (Math.abs(delta) > 0.04) h.held.add(delta > 0 ? 'right' : 'left');
      if (frame % 180 < 100) h.held.add('thrust');
    }
    if (s.ship.energy > 0.1 && s.rocks.some(r => Math.hypot(r.x - s.ship.x, r.y - s.ship.y) < r.r + 90)) h.held.add('shield');
    assert.ok(s.rocks.length <= 40 && s.bullets.length <= 32);
  });
  win(h, 'Clear skies, pilot.');
  assert.equal(h.snapshot().wave, 4);
  assert.equal(h.snapshot().destroyed, 154, 'each large rock and both generations of fragments are cleared');
});

test('Bubble Bay: swap is reversible, bank shots pop clusters and detach the whole board', () => {
  const h = gameHarness('bubble-bay'), initial = h.snapshot();
  h.press('swap');
  assert.equal(h.snapshot().current, initial.next);
  h.press('swap');
  assert.equal(h.snapshot().current, initial.current);
  // Recorded input route for seed 123. It includes banks, swaps, setup shots,
  // three-bubble matches, and larger groups falling from ceiling connections.
  const shots = [[-2.79659265, 0], [-2.87159265, 0], [-2.39659265, 0], [-2.32159265, 0], [-0.82159265, 1], [-2.82159265, 1], [-2.39659265, 0], [-2.37159265, 0], [-2.84659265, 0], [-2.37159265, 1], [-2.84659265, 0], [-2.84659265, 1], [-2.59659265, 1], [-2.84659265, 1], [-1.34659265, 1], [-2.84659265, 1], [-2.52159265, 0], [-2.87159265, 1], [-2.92159265, 0], [-2.72159265, 0], [-2.79659265, 1], [-2.69659265, 0], [-2.77159265, 0], [-2.92159265, 0]];
  let largestRelease = 0;
  for (const [angle, swap] of shots) {
    const popped = h.snapshot().popped;
    if (swap) h.press('swap');
    point(h, 480 + Math.cos(angle) * 350, 529 + Math.sin(angle) * 350, false, true);
    h.frame();
    for (let frame = 0; frame < 500 && !h.result && h.snapshot().shot; frame++) h.frame();
    assert.equal(h.snapshot().shot, null);
    largestRelease = Math.max(largestRelease, h.snapshot().popped - popped);
  }
  win(h, 'A perfectly clear bay.');
  assert.equal(h.snapshot().board.length, 0);
  assert.equal(h.snapshot().shots, 24);
  assert.ok(largestRelease >= 7, 'large connected releases are rewarded');
});

test('Flappy Fin: timed impulses pass all twenty-four gates without damage', () => {
  const h = play('flappy-fin', (h, s) => {
    const gate = s.gates.find(g => g.x + 65 > s.fish.x - 20), target = gate ? gate.center : 300;
    if (s.fish.y + s.fish.vy * 0.1 > target + 20 && s.fish.vy > -50) h.edges.add('flap');
    assert.ok(s.gates.length <= 3);
  });
  win(h, 'A lovely little crossing.');
  assert.equal(h.snapshot().passed, 24);
  assert.equal(h.snapshot().lives, 3);
});

test('Tunnel Dash: readable safe lanes allow a clean forty-five-gate finish', () => {
  const h = play('tunnel-dash', (h, s) => {
    const gate = s.gates[0];
    if (gate && gate.safe !== s.lane) h.edges.add(gate.safe < s.lane ? 'left' : 'right');
  });
  win(h, 'You found the flow.');
  assert.equal(h.snapshot().passed, 45);
  assert.equal(h.snapshot().lives, 3);
});

test('Lava Lift: normal jumps and spring platforms can reach the summit', () => {
  let target = 1;
  const h = play('lava-lift', (h, s) => {
    const p = s.player;
    h.held.clear(); h.held.add('jump');
    if (p.grounded) {
      const stood = s.platforms.findIndex(t => Math.abs(p.y + 36 - t.y) < 2 && p.x + 34 >= t.x && p.x <= t.x + t.w);
      if (stood >= 0) target = stood + 1;
    }
    const platform = s.platforms[target];
    if (platform && p.x + 17 < platform.x + platform.w / 2 - 8) h.held.add('right');
    if (platform && p.x + 17 > platform.x + platform.w / 2 + 8) h.held.add('left');
  });
  win(h, 'A breath of fresh air.');
  assert.ok(h.snapshot().height >= 2200);
  assert.ok(h.snapshot().gems > 0);
});

test('Ghost Lantern: generated maze is connected and its full spark route can be completed', () => {
  const initial = gameHarness('ghost-lantern').snapshot();
  for (const spark of initial.sparks) {
    const [tx, ty] = spark.split(',').map(Number);
    assert.ok(pathTo(initial.player, (x, y) => x === tx && y === ty, (x, y) => initial.maze[y]?.[x] === 0));
  }
  const h = play('ghost-lantern', (h, s) => {
    if (s.cooldown === 0 && s.ghosts.some(g => !g.wait && Math.abs(g.x - s.player.x) + Math.abs(g.y - s.player.y) < 7)) h.edges.add('pulse');
    const sparks = new Set(s.sparks);
    const path = pathTo(s.player, (x, y) => sparks.has(x + ',' + y), (x, y) => s.maze[y]?.[x] === 0);
    if (path?.length) h.edges.add(path[0]);
  });
  win(h, 'Every light, brought home.');
  assert.equal(h.snapshot().sparks.length, 0);
  assert.ok(h.snapshot().caught > 0);
});

test('Ricochet Range: eight bank shots clear four different rooms, with recalls and shot refills', () => {
  const h = gameHarness('ricochet-range');
  const shots = [[-2.777592653589793, 153], [-0.22159265358979052, 53], [-2.3935926535897925, 158], [-0.6535926535897909, 23], [-2.765592653589793, 205], [-0.9175926535897911, 38], [-2.6575926535897927, 211], [-0.4015926535897907, 72]];
  for (const [angle, frames] of shots) {
    point(h, 120 + Math.cos(angle) * 400, 493 + Math.sin(angle) * 400, true, true);
    h.frame(); h.step((frames + 3) / 60);
    if (!h.result && h.snapshot().ball) h.press('recall');
    h.step(1.4);
  }
  win(h, 'Every angle accounted for.');
  assert.equal(h.snapshot().hits, 20);
  assert.equal(h.snapshot().room, 4);
  assert.equal(h.snapshot().charges, 11, 'ten initial shots minus eight used plus three room refills');
});

test('Shield Spin: accurate shield positioning blocks sixty incoming threats', () => {
  const h = play('shield-spin', (h, s) => {
    const threat = s.incoming.filter(t => !t.crossed).sort((a, b) => a.radius - b.radius)[0];
    if (threat) point(h, 480 + Math.cos(threat.angle) * 200, 300 + Math.sin(threat.angle) * 200, true);
  });
  win(h, 'Your star is still shining.');
  assert.equal(h.snapshot().blocked, 60);
  assert.equal(h.snapshot().hp, 5);
  assert.ok(h.snapshot().perfect > 40);
});

test('Blade Bloom: slicing a full harvest survives the clock and pause cancels the swipe', () => {
  const h = play('blade-bloom', (h, s) => {
    const target = s.fruit.find(f => !f.bomb && f.y > 70 && f.y < 540);
    if (target) point(h, target.x, target.y, true, true);
    else h.api.input.pointer.down = false;
  }, 6000);
  win(h, 'A colorful little harvest.');
  assert.ok(h.snapshot().sliced > 60);
  const paused = gameHarness('blade-bloom');
  point(paused, 300, 300, true); paused.frame();
  assert.equal(paused.snapshot().active, true);
  paused.game.cancelInput();
  assert.equal(paused.snapshot().active, false);
});

test('Pinball Grove: launches reach the bumpers and timed flippers reach the table goal', () => {
  const h = play('pinball-grove', (h, s) => {
    const b = s.ball; h.held.clear();
    if (b.y > 460 && b.vy > 0) h.held.add(b.x < 480 ? 'left' : 'right');
    if (b.y > 510 && s.nudge === 0) h.edges.add('nudge');
  });
  win(h, 'The whole grove is glowing.');
  assert.ok(h.snapshot().hits > 50);
  assert.ok(h.snapshot().flowers > 0);
  assert.ok(h.snapshot().balls > 0);
});
