# Candy Arcade

**Candy Drop + eight new browser games.** A collection of quick, original games with distinct mechanics, keyboard and touch controls, personal records, and replayable daily seeds.

Open **[arcade.html](arcade.html)** to browse the collection. The original **[Candy Drop](index.html)** stays at its existing `index.html` address.

![Sunset Sprint artwork](assets/art/sunset-sprint.svg)

## The collection

| Game | Category | The play loop | Typical session |
| --- | --- | --- | --- |
| [Neon Dojo](games/neon-dojo/index.html) | Fighting | Read attacks, jump sweeps, parry and break guards across three rooftop bouts. | 1–3 min |
| [Sunset Sprint](games/sunset-sprint/index.html) | Racing | Steer a 6 km coastal course, draft traffic, manage boost, and reach timed checkpoints. | 1–2 min |
| [Pocket Striker](games/pocket-striker/index.html) | Football simulation | Move, pass, sprint, tackle, switch players and charge shots against an AI team. | 75-second match |
| [Orbit Guard](games/orbit-guard/index.html) | Tower defense | Build and upgrade three turret types to protect a reactor across eight waves. | 3–5 min |
| [Mini Golf Club](games/mini-golf-club/index.html) | Physics / sports | Read the angle and power across six handcrafted holes with walls, sand and water. | 4–6 min |
| [Skybound](games/skybound/index.html) | Platform runner | Double-jump rooftops, dash through obstacles and collect shards over a 1,200 m route. | About 1 min |
| [Starfall](games/starfall/index.html) | Space shooter | Dodge, collect upgrades and time shield pulses through four fleets and a mothership. | 2–3 min |
| [Merge Lab](games/merge-lab/index.html) | Number puzzle | Merge equal tiles toward 2048, plan around limited space, and use one exact undo. | At your pace |
| [Candy Drop](index.html) | Original arcade | Catch falling candy, avoid bombs, and build combo multipliers. | Score chase |

Session lengths describe normal play, not time limits for every game. Pausing is always available.

## Play locally

No installation, account, external assets, API keys or build step is needed to play. Open `arcade.html` in a modern browser, or serve the folder using one of these options:

```bash
# Node 22+; no npm install needed for the server
npm start

# Or Python 3
python3 -m http.server 8321
```

Visit **http://localhost:8321/arcade.html**. The included Node server also opens the hub at `/`; ordinary static hosting keeps the original Candy Drop at `/index.html`.

All links are relative, so the collection works under a GitHub Pages repository subpath or on any static host. Publish the repository files without a bundler. No server application or database is required.

## Controls

Every new game has visible touch buttons, a short introduction, and an expandable control guide. Mouse/touch gestures supplement the keyboard controls where appropriate.

| Game | Keyboard |
| --- | --- |
| Neon Dojo | A/D or ←/→ move; Space/↑ jump; J jab; K kick; L guard. |
| Sunset Sprint | A/D or ←/→ steer; W/↑ throttle; S/↓ brake; Space boost. |
| Pocket Striker | WASD/arrows move; Space charges and releases a shot; E passes/switches; Shift sprints. Move into an opponent to tackle. |
| Orbit Guard | ←/→ select a build pad; T cycles turret type; B/Space builds; U upgrades; X sells; N launches a wave. |
| Mini Golf Club | ←/→ aim; ↑/↓ set power; Space putt; R returns to the tee for one penalty. Drag back from the ball to aim with touch or mouse. Holes advance automatically. |
| Skybound | Space/↑ jump, then jump again in the air; Shift/X dash. |
| Starfall | WASD/arrows move; Space/X pulse shield. Weapons fire automatically. Drag the ship with touch/mouse. |
| Merge Lab | WASD/arrows or swipe to move; U/Z undo once; F banks the current score. |
| Candy Drop | Mouse/touch, A/D or ←/→ move; Enter/Space starts. |

**P / Escape** pauses and resumes. Leaving the tab pauses active games and clears held controls. Sound can be muted; all eight new games have a fullscreen control. The games honor reduced-motion preferences for shake and decorative particles.

## Reasons to come back

- **Different skills:** timing, precision, steering, tactics, spatial planning and puzzle strategy each have their own game.
- **Quick starts and immediate retries:** no signup or loading screen; replay is one click from results.
- **Personal bests and three medal goals per game:** visible targets make improvement concrete.
- **Daily runs:** the eight new games offer a date-based seed, with daily records stored separately from classic records. The same game and UTC date reproduce the initial course/board and random stream. Player actions still affect outcomes.
- **Discovery:** category filters, search, saved favorites, a rotating daily pick and a suggested next game at the end of a run.
- **Local progress:** games explored, runs started, medals and records remain on the device. Candy Drop keeps its original `candydrop_best` record and also reports new completed runs to the hub.
- **Shareable results:** copy a score and game link. Sharing is initiated by the player; the app sends no messages or telemetry.

Progress is stored in `localStorage`. If storage is blocked or full, gameplay continues with a page-lifetime memory fallback. There is no account sync, global leaderboard or server-side score validation. Daily reset is **00:00 UTC**. Browser/device data clearing removes saved progress.

## Project layout

```text
arcade.html                    Collection hub
index.html                     Original Candy Drop, with arcade navigation/pause/mute
assets/core.js                 Catalog, seeded randomness and resilient local progress
assets/arcade.js               Shared canvas lifecycle, input, menus, audio and results
assets/arcade.css              Responsive hub and game UI
assets/hub.js                  Discovery, favorites and local statistics
assets/art/*.svg               Nine original vector illustrations
games/<game>/index.html        Direct entry page
games/<game>/game.js           Independent simulation and canvas drawing
scripts/serve.cjs              Optional dependency-free local server
scripts/generate-pages.cjs     Rebuild committed game entry pages
scripts/generate-art.py        Rebuild original SVG artwork
tests/                        Simulation, storage and real-browser checks
docs/game-api.md               Contract for adding another game
```

The eight new games share a 960 × 600 logical canvas. The runtime scales it to the display, caps pixel density, limits particle counts and throttles DOM HUD updates. Each game owns only its simulation and drawing; one runtime owns time, events and storage. Paused time never advances the simulation. Game code and vector art are local; audio uses a small Web Audio synthesizer.

## Development and checks

The games do not need development dependencies at runtime. For contributors:

```bash
npm ci
npm test
npx playwright install chromium
npm run test:browser
```

`npm test` exercises deterministic state, game mechanics, meaningful victory/loss transitions, and progress storage. `npm run test:browser` starts a temporary static server and checks actual browser input, menus, replay, daily reset, touch interactions, asset loading and mobile layouts. Set `CHROMIUM_PATH` to use an existing Chromium installation.

The GitHub Actions workflow runs both suites on pushes and pull requests. Browser screenshots and failure diagnostics are retained as workflow artifacts for visual review. Test-only simulation hooks are exposed only with `?test=1`.

To regenerate pages after catalog changes, run `npm run pages`. To regenerate the card artwork, run `python3 scripts/generate-art.py`. Both outputs are committed so deployment remains build-free.
