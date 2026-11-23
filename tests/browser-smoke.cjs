/* Browser integration checks. No test framework: node:assert + the Playwright dev dependency. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (error) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'test-results');
const PORT = Number(process.env.SMOKE_PORT || 32000 + process.pid % 20000);
const BASE = `http://127.0.0.1:${PORT}`;
const SLUGS = ['neon-dojo', 'sunset-sprint', 'pocket-striker', 'orbit-guard', 'mini-golf-club', 'skybound', 'starfall', 'merge-lab'];
const { CATALOG } = require('../assets/core.js');
const ALL_SLUGS = CATALOG.filter(g => g.id !== 'candy-drop').map(g => g.id);
const EXPANSION_SLUGS = ALL_SLUGS.filter(id => !SLUGS.includes(id));
const PAGE_SIZE = 12;
const FIXED_DATE = '2026-11-15T12:00:00Z';
const results = [];
let browser, server;
let serverLog = '';

async function step(page, seconds = 1 / 60) {
  await page.evaluate(seconds => window.__arcade.step(seconds), seconds);
}
async function inspect(page) { return page.evaluate(() => window.__arcade.inspect()); }
async function state(page) { return page.evaluate(() => window.__arcade.state()); }
async function press(page, key, seconds = 1 / 60) {
  await page.keyboard.down(key);
  await step(page, seconds);
  await page.keyboard.up(key);
  await step(page);
}
async function assertPhase(page, expected) { assert.equal((await state(page)).phase, expected); }
async function assertNoOverflow(page) {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(size.document <= size.viewport + 1, `Horizontal overflow: ${size.document}px on a ${size.viewport}px viewport`);
}
async function assertHubLayout(page, mobile) {
  const cardRatio = mobile ? 1.4 : 1.9, heroRatio = mobile ? 1.9 : 1.46;
  const cards = await page.locator('.card-art').evaluateAll(images => images.map(image => ({ width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height })));
  assert.equal(cards.length, Math.min(PAGE_SIZE, CATALOG.length));
  for (const [index, card] of cards.entries()) {
    assert.ok(card.width > 0 && card.height > 0 && Math.abs(card.width / card.height - cardRatio) < 0.08,
      `Card ${index + 1} art must keep a ${cardRatio}:1 ratio, got ${card.width}×${card.height}`);
  }
  const hero = await page.locator('.hero-feature img').boundingBox();
  assert.ok(hero && Math.abs(hero.width / hero.height - heroRatio) < 0.08,
    `Hero art must keep a ${heroRatio}:1 ratio, got ${hero && `${hero.width}×${hero.height}`}`);
  const icon = await page.locator('.search span').boundingBox(), input = await page.locator('#game-search').boundingBox();
  assert.ok(icon && input && icon.x >= input.x - 3 && icon.y >= input.y - 3 &&
    icon.x + icon.width <= input.x + input.width + 3 && icon.y + icon.height <= input.y + input.height + 3,
  'The search icon must remain inside the input bounds');
}
async function screenshot(page, filename, locator) {
  if (locator) await locator.screenshot({ path: path.join(OUTPUT, filename), animations: 'disabled' });
  else await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: true, animations: 'disabled' });
}
async function loadGame(page, slug, options = {}) {
  // Freeze the installed browser clock after loading. Real keyboard/pointer events still run;
  // simulation progresses only when step() or clock.runFor() is requested by the test.
  await page.clock.install({ time: new Date('2026-11-15T11:59:00Z') });
  await page.goto(`${BASE}/games/${slug}/index.html?test=1`, { waitUntil: 'load' });
  await page.clock.pauseAt(new Date(FIXED_DATE));
  assert.equal(await page.locator('#game').count(), 1);
  await assertPhase(page, 'menu');
  assert.ok(await page.locator('#overlay-panel .quick-rules li').count() >= 3);
  await assertNoOverflow(page);
  if (options.menuScreenshot) {
    const menu = await page.locator('#overlay-panel').evaluate(panel => ({
      width: panel.clientWidth, scrollWidth: panel.scrollWidth,
      height: panel.clientHeight, scrollHeight: panel.scrollHeight,
      ruleFont: parseFloat(getComputedStyle(panel.querySelector('.quick-rules')).fontSize)
    }));
    assert.ok(menu.scrollWidth <= menu.width + 1 && menu.scrollHeight <= menu.height + 1,
      'The mobile instructions must fit the menu without clipping');
    assert.ok(menu.ruleFont >= 11, 'Mobile instructions must retain the readable type size');
    await screenshot(page, `${slug}-mobile-menu.png`, page.locator('#game-shell'));
  }
  await page.locator('#overlay-panel .button.primary').click();
  await assertPhase(page, 'playing');
  await step(page, 0); // Exercise the initial draw immediately, without advancing the simulation.
}
async function restartThroughMenu(page, expectedScore = 0) {
  if ((await state(page)).phase === 'playing') await page.locator('#pause-button').click();
  await assertPhase(page, 'paused');
  await page.getByRole('button', { name: 'Restart run', exact: true }).click();
  await assertPhase(page, 'playing');
  assert.equal((await state(page)).time, 0);
  assert.equal((await state(page)).score, expectedScore, 'restart restores the game-specific initial score');
}

async function run(name, options, fn) {
  const context = await browser.newContext({
    viewport: options.mobile ? { width: 390, height: 844 } : { width: 1365, height: 1000 },
    deviceScaleFactor: options.mobile ? 2 : 1,
    isMobile: !!options.mobile, hasTouch: !!options.mobile,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('response', response => { if (response.url().startsWith(BASE) && response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const start = Date.now();
  try {
    await fn(page, context);
    assert.deepEqual(errors, [], 'Uncaught browser JavaScript errors');
    assert.deepEqual(badResponses, [], 'Failed local HTTP responses');
    results.push({ name, passed: true, milliseconds: Date.now() - start });
    console.log(`PASS ${name}`);
    await context.tracing.stop();
  } catch (error) {
    const slug = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    results.push({ name, passed: false, error: error.stack || String(error), browserErrors: errors, badResponses });
    console.error(`FAIL ${name}\n${error.stack || error}`);
    await page.screenshot({ path: path.join(OUTPUT, `${slug}-failure.png`), fullPage: true }).catch(() => {});
    await context.tracing.stop({ path: path.join(OUTPUT, `${slug}-trace.zip`) }).catch(() => {});
    const diagnostics = await page.evaluate(() => ({ url: location.href, state: window.__arcade?.state(), inspect: window.__arcade?.inspect() })).catch(() => ({}));
    fs.writeFileSync(path.join(OUTPUT, `${slug}-failure.json`), JSON.stringify({ diagnostics, errors, badResponses, error: error.stack || String(error) }, null, 2));
  } finally { await context.close(); }
}

async function desktopAction(page, slug) {
  let before, after;
  switch (slug) {
    case 'neon-dojo':
      await step(page, 1.8); before = await inspect(page); await press(page, 'ArrowLeft', 0.25); after = await inspect(page);
      assert.ok(after.player.x < before.player.x - 30, 'Left input must move the fighter');
      await press(page, 'Space', 0.12); assert.ok((await inspect(page)).player.y < 0, 'Jump must leave the floor');
      break;
    case 'sunset-sprint':
      before = await inspect(page); await press(page, 'ArrowUp', 2); after = await inspect(page);
      assert.ok(after.speed > before.speed + 40 && after.distance > 30, 'Throttle must accelerate and move the car');
      before = after; await press(page, 'ArrowRight', 0.2); assert.ok((await inspect(page)).x > before.x + 0.1, 'Steering must change the lane');
      break;
    case 'pocket-striker':
      await step(page, 0.9); before = await inspect(page); await press(page, 'ArrowRight', 0.25); after = await inspect(page);
      assert.ok(after.players[after.controlled].x > before.players[before.controlled].x + 25, 'Movement must control the selected footballer');
      await press(page, 'e'); assert.equal((await inspect(page)).controlled, 1 - after.controlled, 'Pass / swap must change the controlled footballer');
      break;
    case 'orbit-guard':
      await press(page, 'b'); after = await inspect(page); assert.equal(after.towers.filter(Boolean).length, 1, 'Build must create a turret');
      assert.ok(after.credits < 260, 'Building must spend credits'); await press(page, 'n');
      assert.equal((await inspect(page)).wave, 1, 'Launch must start a wave'); await step(page, 4);
      break;
    case 'mini-golf-club':
      before = await inspect(page); await press(page, 'ArrowRight', 0.15); assert.ok((await inspect(page)).angle > before.angle, 'Aim controls must change shot angle');
      await press(page, 'Space', 0.2); after = await inspect(page); assert.equal(after.strokes, 1); assert.ok(after.moving && after.ball.x > before.ball.x, 'Putt must move the ball');
      break;
    case 'skybound':
      before = await inspect(page); await press(page, 'Space', 0.15); after = await inspect(page);
      assert.ok(after.player.y < before.player.y && after.player.vy < 0, 'Jump must lift the runner');
      await press(page, 'x'); assert.ok((await inspect(page)).dashCooldown > 0, 'Dash must activate its cooldown');
      break;
    case 'starfall':
      before = await inspect(page); await press(page, 'ArrowLeft', 0.3); after = await inspect(page);
      assert.ok(after.ship.x < before.ship.x - 40, 'Movement must control the ship');
      await press(page, 'Space'); assert.ok((await inspect(page)).pulseCooldown > 0, 'Pulse must activate its cooldown'); await step(page, 4);
      break;
    case 'merge-lab':
      for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) await press(page, key, 0.2);
      after = await inspect(page); assert.ok(after.moves > 0, 'Valid arrow input must advance the puzzle');
      before = after; await press(page, 'u'); after = await inspect(page);
      assert.equal(after.moves, before.moves - 1, 'Undo must restore the previous move'); assert.equal(after.undoUsed, true);
      break;
  }
}

async function endAndReplay(page, slug) {
  // Outcomes are reached through the normal rules, never by injecting api.end or altering state.
  await page.evaluate(() => window.__arcade.start('classic'));
  if (slug === 'merge-lab') {
    for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) await press(page, key, 0.2);
    await press(page, 'f');
  } else if (slug === 'orbit-guard') {
    await press(page, 'b'); await press(page, 'n'); await step(page, 500);
  } else if (slug === 'mini-golf-club') {
    // The documented 12-stroke limit must close every hole, including the last one.
    for (let hole = 1; hole <= 6; hole++) {
      assert.equal((await inspect(page)).hole, hole);
      for (let stroke = 0; stroke < 12; stroke++) await press(page, 'r');
      await step(page, 2.3);
    }
  } else {
    const seconds = { 'neon-dojo': 100, 'sunset-sprint': 180, 'pocket-striker': 76, skybound: 100, starfall: 500 }[slug];
    await step(page, seconds);
  }
  await assertPhase(page, 'ended');
  const ended = await state(page);
  assert.ok(ended.result && Number.isFinite(ended.score) && ended.score >= 0, 'Result must contain a finite score');
  assert.ok(await page.locator('.result-total').isVisible(), 'Result screen must be visible');
  const snapshot = await inspect(page); await step(page, 10); assert.deepEqual(await inspect(page), snapshot, 'Ended games must stop simulating');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('candy-arcade-v1')));
  assert.ok(saved.games[slug].completed >= 1, 'A completed run must persist');
  assert.ok(saved.games[slug].best >= ended.score, 'Personal best must include the completed score');
  await page.getByRole('button', { name: /Play again/ }).click();
  await assertPhase(page, 'playing'); assert.equal((await state(page)).score, expectedScore, 'restart restores the game-specific initial score'); assert.equal((await state(page)).time, 0);
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  server = spawn(process.execPath, [path.join(ROOT, 'scripts/serve.cjs')], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', chunk => { serverLog += chunk; }); server.stderr.on('data', chunk => { serverLog += chunk; });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error('Static server exited: ' + serverLog);
    try { const response = await fetch(BASE + '/arcade.html'); if (response.ok) { ready = true; break; } } catch (_) { /* Wait for the local listener. */ }
    await delay(100);
  }
  assert.ok(ready, 'Static server did not become ready: ' + serverLog);
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });

  await run('Hub discovery and saved games', {}, async page => {
    await page.goto(BASE + '/arcade.html', { waitUntil: 'load' });
    assert.equal(await page.locator('.game-card').count(), Math.min(PAGE_SIZE, CATALOG.length));
    await page.locator('[data-filter="Action"]').click(); assert.equal(await page.locator('.game-card').count(), Math.min(PAGE_SIZE, CATALOG.filter(g => g.group === 'Action').length));
    await page.locator('[data-filter="Sports"]').click(); assert.equal(await page.locator('.game-card').count(), Math.min(PAGE_SIZE, CATALOG.filter(g => g.group === 'Sports').length));
    await page.locator('[data-filter="All"]').click(); await page.locator('#game-search').fill('sunset');
    assert.equal(await page.locator('.game-card').count(), 1); assert.equal(await page.locator('.game-card h3').textContent(), 'Sunset Sprint');
    await page.locator('#game-search').fill('no such game'); assert.equal(await page.locator('.game-card').count(), 0); assert.ok(await page.locator('#empty-state').isVisible());
    await page.locator('#game-search').fill('Neon Dojo'); await page.getByRole('button', { name: 'Save Neon Dojo', exact: true }).click();
    await page.reload({ waitUntil: 'load' }); await page.locator('#game-search').fill('Neon Dojo'); assert.equal(await page.getByRole('button', { name: 'Unsave Neon Dojo', exact: true }).getAttribute('aria-pressed'), 'true'); await page.locator('#game-search').fill('');
    await page.locator('[data-filter="Favorites"]').click(); assert.equal(await page.locator('.game-card').count(), 1);
    await page.getByRole('button', { name: 'Unsave Neon Dojo', exact: true }).click(); assert.equal(await page.locator('.game-card').count(), 0);
    await page.locator('[data-filter="All"]').click(); assert.equal(await page.locator('.game-card').count(), Math.min(PAGE_SIZE, CATALOG.length));
    await page.locator('#load-more').click(); assert.equal(await page.locator('.game-card').count(), Math.min(PAGE_SIZE * 2, CATALOG.length));
    const links = await page.locator('.card-link').evaluateAll(nodes => nodes.map(n => n.href)); assert.equal(new Set(links).size, links.length);
    await page.locator('#game-sort').selectOption('az'); assert.equal(await page.locator('.game-card h3').first().textContent(), CATALOG.map(g => g.title).sort((a,b) => a.localeCompare(b))[0]);
    await page.locator('#game-sort').selectOption('discover');
    await page.locator('[data-filter="New"]').click(); assert.ok(parseInt(await page.locator('#game-count').textContent(), 10) >= 48);
    await page.locator('[data-filter="All"]').click();
    // Check every shipped browser asset, including lazy-loaded card art and all game entry points.
    function assets(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.name.startsWith('.') || ['node_modules', 'test-results', 'tests', 'scripts', 'docs'].includes(entry.name) ? [] : entry.isDirectory() ? assets(path.join(dir, entry.name)) : /\.(?:html|css|js|svg)$/.test(entry.name) ? [path.join(dir, entry.name)] : []); }
    for (const file of assets(ROOT)) { const url = BASE + '/' + path.relative(ROOT, file).split(path.sep).join('/'); const response = await page.request.get(url); assert.equal(response.status(), 200, `Asset failed: ${url}`); }
    await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    await assertNoOverflow(page); await assertHubLayout(page, false); await screenshot(page, 'hub-desktop.png');
  });

  for (const slug of SLUGS) await run(`${slug} desktop lifecycle`, {}, async page => {
    await loadGame(page, slug); await desktopAction(page, slug); await assertNoOverflow(page);
    await screenshot(page, `${slug}-desktop.png`, page.locator('#game-shell'));
    await page.locator('#pause-button').click(); await assertPhase(page, 'paused');
    const before = await state(page), boardBefore = await inspect(page);
    await step(page, 4); await page.clock.runFor(240);
    assert.equal((await state(page)).time, before.time, 'Pause must stop the clock'); assert.deepEqual(await inspect(page), boardBefore, 'Pause must stop the game state');
    await page.getByRole('button', { name: /Keep playing/ }).click(); await assertPhase(page, 'playing');
    await page.clock.runFor(100); assert.ok((await state(page)).time > before.time, 'The real animation loop must advance after resume');
    await page.keyboard.press('p'); await restartThroughMenu(page);
    const first = await page.evaluate(() => { window.__arcade.start('daily'); return window.__arcade.inspect(); });
    await step(page, 3);
    const second = await page.evaluate(() => { window.__arcade.start('daily'); return window.__arcade.inspect(); });
    assert.deepEqual(second, first, 'Daily mode must reconstruct its initial state from the same seed');
    assert.equal((await state(page)).mode, 'daily');
    await endAndReplay(page, slug);
  });

  for (const slug of EXPANSION_SLUGS) await run(`${slug} desktop lifecycle`, {}, async page => {
    await loadGame(page, slug, { menuScreenshot: false });
    const first = await page.evaluate(() => { window.__arcade.start('daily'); return window.__arcade.inspect(); });
    const initialScore = (await state(page)).score;
    await page.locator('#game').focus();
    // Exercise a real mapped keyboard key, then real pointer events on the game surface.
    let config; require('node:vm').runInNewContext(fs.readFileSync(path.join(ROOT, 'games', slug, 'game.js'), 'utf8'), { Arcade: { mount(c) { config = c; } } });
    const code = config.controls.find(c => c.keys && c.keys.length)?.keys[0];
    const key = code && (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : code === 'ShiftLeft' || code === 'ShiftRight' ? 'Shift' : code);
    if (key) await press(page, key, .08);
    await step(page, .2);
    if ((await state(page)).phase === 'ended') await page.evaluate(() => window.__arcade.start('daily'));
    await page.locator('#pause-button').click(); await assertPhase(page, 'paused');
    const frozen = await inspect(page); await step(page, 1); await page.clock.runFor(60); assert.deepEqual(await inspect(page), frozen);
    await page.getByRole('button', { name: /Keep playing/ }).click(); await assertPhase(page, 'playing');
    await page.clock.runFor(80); assert.ok((await state(page)).time > 0);
    await page.evaluate(() => window.__arcade.start('daily'));
    assert.deepEqual(await inspect(page), first, 'daily restarting recreates the same puzzle or course');
    await step(page);
    await assertNoOverflow(page);
    await screenshot(page, `${slug}-desktop.png`, page.locator('#game-shell'));
    await restartThroughMenu(page, initialScore);
    const box = await page.locator('#game').boundingBox();
    await page.mouse.click(box.x + box.width * .5, box.y + box.height * .5); await step(page, .1);
    assert.ok(['playing', 'ended'].includes((await state(page)).phase));
  });

  await run('Golf pointer drag and pause cancellation', {}, async page => {
    await loadGame(page, 'mini-golf-club');
    const canvas = page.locator('#game'); await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox();
    const initial = await inspect(page);
    const screen = (x, y) => ({ x: box.x + x / 960 * box.width, y: box.y + y / 600 * box.height });
    const from = screen(initial.ball.x, initial.ball.y), to = screen(initial.ball.x - 105, initial.ball.y);
    await page.mouse.move(from.x, from.y); await page.mouse.down(); await step(page);
    assert.equal((await inspect(page)).dragging, true, 'Pressing the ball must begin aiming');
    await page.mouse.move(to.x, to.y, { steps: 4 }); await step(page);
    await page.mouse.up(); await step(page, 0.25);
    const shot = await inspect(page); assert.equal(shot.strokes, 1); assert.ok(shot.moving && shot.ball.x > initial.ball.x);
    await restartThroughMenu(page);
    await page.mouse.move(from.x, from.y); await page.mouse.down(); await step(page); await page.mouse.move(to.x, to.y); await step(page);
    await page.keyboard.press('p'); await page.mouse.up(); await page.getByRole('button', { name: /Keep playing/ }).click(); await step(page, 0.2);
    assert.equal((await inspect(page)).strokes, 0, 'Pausing during a drag must cancel it without firing');
  });

  await run('Hub mobile layout', { mobile: true }, async page => {
    await page.goto(BASE + '/arcade.html', { waitUntil: 'load' }); assert.equal(await page.locator('.game-card').count(), Math.min(PAGE_SIZE, CATALOG.length));
    await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    await assertNoOverflow(page); await assertHubLayout(page, true); await screenshot(page, 'hub-mobile.png');
  });
  for (const slug of ALL_SLUGS) await run(`${slug} mobile controls`, { mobile: true }, async (page, context) => {
    await loadGame(page, slug, { menuScreenshot: !SLUGS.includes(slug) || ['sunset-sprint', 'mini-golf-club'].includes(slug) }); await assertNoOverflow(page);
    const targets = await page.locator('.control-button').evaluateAll(buttons => buttons.map(button => ({ label: button.textContent, width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
    assert.ok(targets.length >= 1);
    for (const target of targets) assert.ok(target.width >= 43.5 && target.height >= 43.5, `${target.label} touch target is too small: ${target.width}×${target.height}`);
    const box = await page.locator('#game').boundingBox(); assert.ok(Math.abs(box.width / box.height - 1.6) < 0.02, 'Active canvas must preserve its aspect ratio');
    await step(page, slug === 'neon-dojo' ? 1.8 : 0.1);
    const control = page.locator('.control-button').first(); await control.scrollIntoViewIfNeeded(); const target = await control.boundingBox();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: target.x + target.width / 2, y: target.y + target.height / 2, id: 1 }] });
    assert.ok((await control.getAttribute('class')).includes('held'), 'Real touch must press the mapped control');
    await step(page, 0.12);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await step(page);
    assert.ok(!(await control.getAttribute('class')).includes('held'), 'Releasing touch must release the control');
    await assertNoOverflow(page); await screenshot(page, `${slug}-mobile.png`, page.locator('#game-shell'));
  });

  await run('Merge Lab touch swipe and saved result', { mobile: true }, async (page, context) => {
    await loadGame(page, 'merge-lab'); const before = await inspect(page);
    const left = before.grid.some((value, index) => value && index % 4 > 0);
    const canvas = page.locator('#game'); await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox();
    const center = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...center, id: 1 }] }); await step(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: center.x + (left ? -80 : 80), y: center.y, id: 1 }] }); await step(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await step(page, 0.2);
    assert.equal((await inspect(page)).moves, before.moves + 1, 'A valid touch swipe must move the board');
    const bank = page.locator('[data-control="finish"]'); await bank.tap(); await step(page);
    await assertPhase(page, 'ended'); const result = await state(page);
    await page.reload({ waitUntil: 'load' });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('candy-arcade-v1')).games['merge-lab']);
    assert.ok(saved.best >= result.score && saved.completed >= 1, 'The banked result must survive a reload');
  });

  await run('Original Candy Drop remains available', {}, async page => {
    await page.goto(BASE + '/index.html', { waitUntil: 'load' });
    assert.match(await page.title(), /Candy Drop/); assert.equal(await page.locator('canvas').count(), 1);
    const size = await page.locator('canvas').boundingBox(); assert.ok(size.width > 0 && size.height > 0);
    await page.keyboard.press('Enter'); assert.equal(await page.locator('#legacy-pause').isDisabled(), false);
    await page.locator('#legacy-pause').click(); assert.equal(await page.locator('#legacy-pause').textContent(), 'Resume');
    await page.locator('#legacy-pause').click(); assert.equal(await page.locator('#legacy-pause').textContent(), 'Pause');
    const audioLabel = await page.locator('#legacy-sound').textContent(); await page.locator('#legacy-sound').click();
    assert.notEqual(await page.locator('#legacy-sound').textContent(), audioLabel, 'The original game sound control must toggle');
    await screenshot(page, 'candy-drop-original.png');
  });
}

main().catch(error => {
  results.push({ name: 'Browser suite setup', passed: false, error: error.stack || String(error) }); console.error(error.stack || error);
}).finally(async () => {
  if (browser) await browser.close(); if (server) server.kill();
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, 'browser-results.json'), JSON.stringify({ results, serverLog }, null, 2));
  const failed = results.filter(result => !result.passed);
  console.log(`\n${results.length - failed.length}/${results.length} browser checks passed.`);
  if (failed.length) process.exitCode = 1;
});
