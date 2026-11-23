'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../assets/core.js');

function memoryAdapter(initial = null) {
  let value = initial;
  return {
    getItem(key) { assert.equal(key, Core.STORAGE_KEY); return value; },
    setItem(key, next) { assert.equal(key, Core.STORAGE_KEY); value = next; },
    raw() { return value; }
  };
}

test('catalog exposes the expanded collection and preserves the original route', () => {
  assert.ok(Core.CATALOG.length >= 100);
  assert.equal(new Set(Core.CATALOG.map(game => game.id)).size, Core.CATALOG.length);
  assert.equal(Core.href(Core.CATALOG.find(game => game.id === 'candy-drop')), 'index.html');
  assert.equal(Core.href(Core.CATALOG[0], '../../'), '../../games/neon-dojo/index.html');
});

test('seeded random streams reproduce and remain in [0, 1)', () => {
  for (const seed of [0, 1, 4294967295, 'starfall:2026-11-15']) {
    const a = Core.random(seed), b = Core.random(seed);
    for (let i = 0; i < 10000; i++) {
      const value = a();
      assert.equal(value, b());
      assert.ok(value >= 0 && value < 1 && Number.isFinite(value));
    }
  }
  assert.notDeepEqual(Array.from({ length: 8 }, Core.random('today')), Array.from({ length: 8 }, Core.random('tomorrow')));
});

test('daily rotation is stable and dates use UTC boundaries', () => {
  assert.equal(Core.dayKey(new Date('2026-11-16T01:00:00+05:30')), '2026-11-15');
  assert.equal(Core.dayKey(new Date('2026-11-16T00:00:00Z')), '2026-11-16');
  assert.equal(Core.dailyGame('2026-11-15').id, Core.dailyGame('2026-11-15').id);
  assert.ok(Core.CATALOG.filter(g => g.id !== 'candy-drop').includes(Core.dailyGame('2026-11-15')));
  const picks = new Set(Array.from({ length: 730 }, (_, i) => Core.dailyGame(Core.dayKey(new Date(Date.UTC(2026, 0, i + 1)))).id));
  assert.ok(picks.size > 40, 'the daily pick rotates throughout the expanded collection');
  assert.ok(!picks.has('candy-drop'));
});

test('scores and medals handle invalid data and exact boundaries', () => {
  for (const [value, expected] of [[-20, 0], [NaN, 0], [Infinity, 0], ['broken', 0], [12.8, 13], ['42', 42], [undefined, 0]]) {
    assert.equal(Core.score(value), expected);
  }
  const thresholds = [100, 200, 300];
  for (const [value, rank] of [[0, 0], [99, 0], [100, 1], [199, 1], [200, 2], [299, 2], [300, 3], [999, 3]]) {
    assert.equal(Core.medal(value, thresholds), rank);
  }
});

test('sanitization rejects foreign IDs and malformed favorites and records', () => {
  const data = Core.sanitize({
    version: 99, sound: false, last: 'unknown',
    favorites: ['starfall', 'unknown', null, '__proto__', 'starfall', 'candy-drop'],
    games: {
      starfall: { best: -40, medals: 99, plays: 1e15, completed: 'bad', daily: { day: 'yesterday', best: 10 } },
      'merge-lab': { best: '750', medals: 2, plays: 2, completed: 1, daily: { day: '2026-11-15', best: '100', medals: 2 } },
      unknown: { best: 900000 }
    }
  });
  assert.equal(data.version, 1);
  assert.equal(data.sound, false);
  assert.equal(data.last, null);
  assert.deepEqual(data.favorites, ['starfall', 'candy-drop']);
  assert.equal(data.games.unknown, undefined);
  assert.deepEqual(data.games.starfall, { best: 0, medals: 3, plays: 1e9, completed: 0, daily: null });
  assert.equal(data.games['merge-lab'].best, 750);
  assert.equal(data.games['merge-lab'].daily.best, 100);
  assert.deepEqual(Core.sanitize(null), Core.blank());
  assert.deepEqual(Core.sanitize({ favorites: 'starfall', last: 'starfall' }).favorites, []);
});

test('storage preserves high scores and separates classic from each daily record', () => {
  const adapter = memoryAdapter(), store = Core.storage(adapter), targets = [100, 200, 300];
  store.begin('starfall');
  store.finish('starfall', 260, targets);
  store.finish('starfall', 80, targets);
  store.finish('starfall', 180, targets, 'daily', '2026-11-15');
  store.finish('starfall', 90, targets, 'daily', '2026-11-15');
  let record = store.read().games.starfall;
  assert.equal(record.best, 260);
  assert.equal(record.medals, 2);
  assert.equal(record.plays, 1);
  assert.equal(record.completed, 4);
  assert.deepEqual(record.daily, { day: '2026-11-15', best: 180, medals: 1 });
  store.finish('starfall', 50, targets, 'daily', '2026-11-16');
  record = store.read().games.starfall;
  assert.equal(record.best, 260);
  assert.deepEqual(record.daily, { day: '2026-11-16', best: 50, medals: 0 });
  assert.equal(Core.storage(adapter).read().games.starfall.best, 260, 'a new session must read the saved result');
  assert.equal(JSON.parse(adapter.raw()).last, 'starfall');
});

test('denied browser storage falls back to useful in-memory records', () => {
  const store = Core.storage({ getItem() { throw new Error('Storage denied'); }, setItem() { throw new Error('Storage denied'); } });
  assert.doesNotThrow(() => store.read());
  store.begin('skybound');
  store.finish('skybound', 500, [100, 300, 900]);
  assert.equal(store.available(), false);
  assert.equal(store.read().games.skybound.best, 500);
  assert.equal(store.read().games.skybound.plays, 1);
  assert.equal(store.read().games.skybound.medals, 2);
});

test('finishing yesterday’s run cannot overwrite a newer daily record', () => {
  const store = Core.storage(memoryAdapter()), medals = [100, 300, 900];
  store.finish('starfall', 600, medals, 'classic');
  store.finish('starfall', 400, medals, 'daily', '2026-11-16');
  store.finish('starfall', 5000, medals, 'daily', '2026-11-15');
  const saved = store.read().games.starfall;
  assert.deepEqual(saved.daily, { day: '2026-11-16', best: 400, medals: 2 });
  assert.equal(saved.best, 600);
  assert.equal(saved.completed, 3, 'the older completed run still counts as a completed session');
});

test('malformed saved JSON can recover and be replaced without a crash', () => {
  const adapter = memoryAdapter('{ definitely not JSON'), store = Core.storage(adapter);
  assert.deepEqual(store.read(), Core.blank());
  store.finish('merge-lab', 1024, [500, 1000, 2000]);
  assert.equal(store.read().games['merge-lab'].best, 1024);
  assert.doesNotThrow(() => JSON.parse(adapter.raw()));
});

test('a failed write cannot replace a newer memory record with stale disk data', () => {
  const old = Core.blank();
  old.games.starfall = { best: 100, medals: 1, plays: 1, completed: 1, daily: null };
  const stale = JSON.stringify(old);
  const store = Core.storage({ getItem() { return stale; }, setItem() { throw new Error('Quota exceeded'); } });
  store.finish('starfall', 500, [100, 300, 900]);
  assert.equal(store.available(), false);
  assert.equal(store.read().games.starfall.best, 500);
  store.finish('starfall', 400, [100, 300, 900]);
  assert.equal(store.read().games.starfall.best, 500);
  assert.equal(store.read().games.starfall.completed, 3);
});

test('storage reads return isolated sanitized snapshots', () => {
  const store = Core.storage(memoryAdapter());
  store.finish('starfall', 500, [100, 300, 900]);
  const snapshot = store.read();
  snapshot.games.starfall.best = 999999;
  snapshot.favorites.push('unknown');
  assert.equal(store.read().games.starfall.best, 500);
  assert.deepEqual(store.read().favorites, []);
});
