# Arcade Universe: The Definitive Chronicle & Design Manifesto

> *“In an era where loading a static blog post requires downloading forty megabytes of telemetry, tracking beacons, and framework runtimes, we built an entire hundred-game arcade that requires zero megabytes, zero installs, zero accounts, and runs instantly at sixty frames per second anywhere the web breathes.”*

---

## Table of Contents

1. [The Origin Story: From Candy Drop to 100 Worlds](#1-the-origin-story-from-candy-drop-to-100-worlds)
2. [The Philosophy of Zero-Dependency Browser Games](#2-the-philosophy-of-zero-dependency-browser-games)
   - [The Modern Web Dilemma](#the-modern-web-dilemma)
   - [The Browser as a Pure Arcade Cabinet](#the-browser-as-a-pure-arcade-cabinet)
   - [The 30-Year Web Promise: Permanent Artifacts](#the-30-year-web-promise-permanent-artifacts)
3. [The Core Architectural Blueprint](#3-the-core-architectural-blueprint)
   - [The 960 × 600 Virtual Canvas Engine](#the-960--600-virtual-canvas-engine)
   - [Dynamic Board Cropping & Focus Views](#dynamic-board-cropping--focus-views)
   - [Deterministic Seeded PRNG Architecture](#deterministic-seeded-prng-architecture)
   - [Global UTC Daily Synchronization](#global-utc-daily-synchronization)
   - [The Game Lifecycle State Machine](#the-game-lifecycle-state-machine)
   - [Headless Simulation Harness](#headless-simulation-harness)
4. [Input Duality & Tactile Ergonomics](#4-input-duality--tactile-ergonomics)
   - [Universal Input Translation](#universal-input-translation)
   - [Virtual Touchpad Ergonomics](#virtual-touchpad-ergonomics)
   - [The `cancelInput` Safety Valve](#the-cancelinput-safety-valve)
5. [The Procedural Web Audio Sound Chip](#5-the-procedural-web-audio-sound-chip)
   - [Zero-Byte Audio Architecture](#zero-byte-audio-architecture)
   - [Waveform Synthesis & Exponential Envelopes](#waveform-synthesis--exponential-envelopes)
   - [The Six Universal Sonic Profiles](#the-six-universal-sonic-profiles)
   - [Frequency Pitch Scaling](#frequency-pitch-scaling)
   - [Browser Autoplay Compliance](#browser-autoplay-compliance)
6. [Data Resilience & Privacy Architecture](#6-data-resilience--privacy-architecture)
   - [The Privacy Guarantee: Zero Telemetry](#the-privacy-guarantee-zero-telemetry)
   - [Multi-Tier Storage Fallback](#multi-tier-storage-fallback)
   - [Schema Sanitization & Stale Cache Protection](#schema-sanitization--stale-cache-protection)
7. [The Style Guide & Game Design System](#7-the-style-guide--game-design-system)
   - [Canvas-Native Procedural Vector Aesthetics](#canvas-native-procedural-vector-aesthetics)
   - [The Cyber-Retro Neon Color Token Palette](#the-cyber-retro-neon-color-token-palette)
   - [Canvas Ergonomics & Safe Action Zones](#canvas-ergonomics--safe-action-zones)
   - [Particle & Motion Budgets](#particle--motion-budgets)
   - [The Three-Tier Medal Threshold Curve](#the-three-tier-medal-threshold-curve)
8. [The Eight Arcade Wings](#8-the-eight-arcade-wings)
9. [Authoring a New Cabinet: Contributor Walkthrough](#9-authoring-a-new-cabinet-contributor-walkthrough)

---

## 1. The Origin Story: From Candy Drop to 100 Worlds

The Arcade Universe did not begin as an ambitious master plan; it began with a single basket, falling sweets, and a handful of ticking bombs.

In late 2024, [Candy Drop](../index.html) was born as a celebration of immediate arcade fun: move left, move right, catch the peppermint swirls, avoid the red explosives, and ride an escalating combo multiplier. It possessed no build configuration, no external assets, no analytics trackers, and no monetization barriers. You opened the page, and the game ran immediately at full display refresh rate.

```
       🍬 CANDY DROP (Genesis)                ARCADE UNIVERSE (Modern)
    ┌───────────────────────────┐          ┌───────────────────────────┐
    │  1 Game                   │          │  100 Independent Games    │
    │  1 Mechanic (Catch/Dodge) │  ─────►  │  8 Genre Wings            │
    │  Single Canvas Loop       │          │  Modular Arcade Runtime   │
    │  Local High Score         │          │  Deterministic Daily Seed │
    └───────────────────────────┘          └───────────────────────────┘
```

Players fell in love with that immediate purity, but they asked a provocative question: *What if the entire web worked like this? What if you had an entire cabinet arcade—racing, tactical puzzles, fighting arenas, sports sims, precision platformers, and turn-based strategy—built on the exact same zero-bloat foundation?*

That question became **Arcade Run** (Candy Arcade). We set out to design 100 completely distinct games, each with:
- Dedicated physical simulation rules and fine-tuned control feel.
- Custom vector art and vibrant cyber-retro color palettes.
- Desktop keyboard mastery alongside responsive mobile touch ergonomics.
- Seeded daily challenges synchronizing players across the globe.
- Full automated test coverage verifying mathematical determinism and winning sequences.

Today, the Arcade Universe stands as living proof that the open web platform remains the most accessible, durable, and joyful gaming medium ever conceived.

---

## 2. The Philosophy of Zero-Dependency Browser Games

### The Modern Web Dilemma

Contemporary web development has suffered from systematic complexity inflation. Today, delivering a game to a player frequently involves:
- Gigabytes of `node_modules` dependencies.
- Multi-megabyte WebAssembly or JavaScript bundle payloads.
- Intrusive cookie consent banners, marketing trackers, and analytics SDKs.
- Fragile build pipelines that break when minor semver bumps occur.
- Cloud backends that inevitably shut down when funding expires, stranding games forever.

### The Browser as a Pure Arcade Cabinet

We chose an intentionally radical counter-philosophy: **The web browser itself is the complete arcade machine.**

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE ZERO-DEPENDENCY STACK                       │
├────────────────────────────────┬───────────────────────────────────────┤
│ Graphics & Animation           │ Native HTML5 Canvas 2D Context        │
│ Audio Synthesis                │ Web Audio API (Live Oscillators)      │
│ Persistence                    │ Client-Side Web Storage API           │
│ Input & Touch                  │ Pointer Events & DOM Keyboard API     │
│ Lifecycle & UI                 │ Pure Vanilla ES6 ECMAScript           │
│ Artwork                        │ Canvas Primitives & Semantic SVG      │
└────────────────────────────────┴───────────────────────────────────────┘
```

1. **Zero Build Steps**: You can clone this repository, double-click `arcade.html`, and play immediately in any browser from Chrome and Safari to Firefox and Edge. No `npm install`, no `vite build`, no compilation.
2. **Zero External Assets**: No remote `.png`, `.jpg`, `.mp3`, or `.wasm` files are downloaded during gameplay. Every visual sprite is drawn through canvas geometry; every sound wave is calculated on the fly.
3. **Zero Tracking or Telemetry**: We collect zero personal data, IP addresses, session recordings, or analytics. Your high scores belong to you and live strictly on your device.
4. **100% Offline Resilience**: Once the browser caches the lightweight HTML, CSS, and JS files, the entire arcade operates with zero internet connection—on high-speed fiber, in rural transit, or on an airplane.

### The 30-Year Web Promise: Permanent Artifacts

Web frameworks and third-party game engines come and go. When an engine sunsets or changes its licensing model, games built on top of it often rot.

Pure ECMAScript, HTML5 Canvas 2D, and the Web Audio API are web standards backed by decades of backward compatibility. A game written strictly against the standard `CanvasRenderingContext2D` specification without third-party abstraction layers will continue to render with 100% fidelity decades from today. By choosing zero dependencies, we ensure these 100 games are permanent cultural artifacts.

---

## 3. The Core Architectural Blueprint

The runtime architecture is split into two cleanly decoupled layers:
- `assets/core.js`: Data models, catalog metadata, seeded PRNG math, daily rotation keys, scoring math, and persistent storage management.
- `assets/arcade.js`: Canvas lifecycle management, DOM HUD binding, event routing, Web Audio oscillator synthesis, modal overlays, and automated test hooks.

```
       ┌────────────────────────────────────────────────────────┐
       │                   Browser Window / Tab                 │
       └───────────────────────────┬────────────────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
          ┌─────────────────────┐     ┌─────────────────────┐
          │   assets/core.js    │     │   assets/arcade.js  │
          ├─────────────────────┤     ├─────────────────────┤
          │ • CATALOG (100)     │     │ • 960×600 Canvas    │
          │ • Mulberry32 PRNG   │     │ • Sound Chip (Web   │
          │ • FNV-1a Hash       │     │   Audio Oscillators)│
          │ • Daily UTC Keys    │     │ • Input Translation │
          │ • Storage Engine    │     │ • HUD & Overlays    │
          └──────────┬──────────┘     └──────────┬──────────┘
                     │                           │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │            games/<slug>/game.js                 │
          ├─────────────────────────────────────────────────┤
          │  Arcade.mount({                                 │
          │    create(api) {                                │
          │      return { update(dt), draw(ctx) };          │
          │    }                                            │
          │  })                                             │
          └─────────────────────────────────────────────────┘
```

### The 960 × 600 Virtual Canvas Engine

Every game in the arcade operates inside a strict logical coordinate space:

$$\text{Width} = 960\text{px}, \quad \text{Height} = 600\text{px} \quad (16:10 \text{ Aspect Ratio})$$

#### Why 16:10?
1. **Ergonomic Golden Mean**: 16:10 provides optimal vertical breathing room compared to aggressive 16:9 widescreen formats, while comfortably filling both desktop landscape monitors and horizontally oriented mobile tablets and phones.
2. **Subpixel Stability**: 960 and 600 divide cleanly by 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50, and 60. This enables clean grid layouts for puzzles, tilemaps, and UI blocks without fractional subpixel blur.
3. **Device Pixel Ratio (DPR) Scaling**: The shared runtime monitors `window.devicePixelRatio`. On Retina / High-DPI screens, the physical canvas buffer is scaled up by `DPR` (capped at 2.0 to conserve mobile GPU fill rate and battery), while the 2D context is scaled by `ctx.scale(DPR, DPR)`. Games continue to draw in simple logical 960×600 pixels, producing razor-sharp visuals on any screen density.

```
Logical Scene: 960 × 600
┌────────────────────────────────────────────────────────────────────────┐
│ (0,0)                                                        (960,0)   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Safe HUD Band (Y: 0 - 45px)                                    │   │
│   ├────────────────────────────────────────────────────────────────┤   │
│   │                                                                │   │
│   │                                                                │   │
│   │                   Active Gameplay Canvas                       │   │
│   │                                                                │   │
│   │                                                                │   │
│   ├────────────────────────────────────────────────────────────────┤   │
│   │ Safe Action / Touch Baseline (Y: 540 - 600px)                  │   │
│   └────────────────────────────────────────────────────────────────┘   │
│ (0,600)                                                      (960,600) │
└────────────────────────────────────────────────────────────────────────┘
```

### Dynamic Board Cropping & Focus Views

Certain dense grid titles (e.g. *Queens Court*, *Nonogram Nook*, *Merge Lab*, *Royal Checkers*) benefit from magnifying the playfield on smaller mobile screens.

The runtime supports an optional catalog configuration property:

```js
focus: [x, y, width, height]
```

When present:
1. The game toolbar displays an **Enlarge Board (`+`) / Show Full Scene (`-`)** toggle button.
2. Upon toggle, the stage container crops into the target bounding box and scales it smoothly to fill the player's viewport.
3. The runtime’s input translation matrix automatically re-maps screen touch coordinates back into the original 960×600 logical coordinate space. Game simulation and drawing code remain 100% unaware of whether the view is zoomed or wide.

### Deterministic Seeded PRNG Architecture

Randomness in game design is a double-edged sword: unseeded randomness makes daily tournaments impossible to compare fairly and renders automated testing flaky.

Arcade Universe enforces strict mathematical determinism:

```
Seed Text / Int ──► FNV-1a Hash (32-bit) ──► Mulberry32 Generator ──► Deterministic [0, 1) Floats
```

#### 1. FNV-1a 32-bit Hash
Text seeds (such as UTC date strings `'2026-11-23'`) are transformed into a 32-bit unsigned integer using the Fowler–Noll–Vo prime hash algorithm:

```js
function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  }
  return value >>> 0;
}
```

#### 2. Mulberry32 Bit-Mixer
The resulting 32-bit seed powers Mulberry32, an ultra-fast, high-quality pseudo-random number generator that passes standard dieharder statistical tests:

```js
function random(seed) {
  let value = typeof seed === 'number' ? seed >>> 0 : hash(String(seed));
  return function () {
    value += 0x6D2B79F5;
    let n = Math.imul(value ^ (value >>> 15), value | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
```

#### Why This Matters:
- **Global Tournament Fairness**: Two players in Tokyo and Toronto starting today's daily challenge receive the exact same obstacle distribution, card deal, or maze configuration.
- **Cross-Platform Parity**: The algorithm uses `Math.imul` and unsigned bit shifts (`>>>`), guaranteeing identical 32-bit integer arithmetic across V8 (Chrome/Node), SpiderMonkey (Firefox), JavaScriptCore (Safari), and headless Node test runners.
- **Draw Purity**: Game modules must never invoke `api.random()` inside their `draw()` method. If a user resizes their window or triggers additional paint passes, the gameplay state and future random numbers remain pristine.

### Global UTC Daily Synchronization

Daily challenges synchronize on a strict UTC date boundary calculated via:

```js
function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10); // e.g. "2026-11-23"
}
```

At exactly `00:00:00 UTC`, the active daily game rotates to the next designated catalog title, and the daily random seed transitions seamlessly worldwide.

### The Game Lifecycle State Machine

Every game interacts with the shared runtime via the lifecycle contract documented in [game-api.md](game-api.md).

```
   ┌───────────────┐
   │ Arcade.mount  │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ create(api)   │ ◄── Creates initial scene state without ticking physics
   └───────┬───────┘
           │
           ├───────────────────────────────┐
           ▼                               ▼
    ┌──────────────┐                ┌──────────────┐
    │  MENU STATE  │                │  PLAY STATE  │
    └──────┬───────┘                └──────┬───────┘
           │                               │
           │ (Player presses Start)        ├────────────────┐
           └──────────────────────────────►│                │
                                           ▼                ▼
                                    ┌──────────────┐ ┌──────────────┐
                                    │ update(dt)   │ │  draw(ctx)   │
                                    └──────┬───────┘ └──────────────┘
                                           │
                        (Run Ends / api.end)
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  GAME OVER   │
                                    │ (Result Card)│
                                    └──────────────┘
```

1. **`create(api)`**: Constructs internal entities, allocates particle pools, and returns the module interface. It must render a beautiful initial frame into `draw(ctx)` without advancing simulation time.
2. **`update(dt)`**: Called exclusively when the game is active. Delta time `dt` is clamped to a maximum of $\frac{1}{30}$th second (33.3ms) to prevent simulation explosions if the browser experiences a background tab hiccup.
3. **`draw(ctx)`**: Pure render pass. It receives the standard 2D canvas context and must never mutate gameplay state.
4. **`api.end({ score, title, message, stats })`**: Concludes the run, triggers high-score verification, updates medal status, and presents the end-of-run modal card.

### Headless Simulation Harness

For continuous integration and automated test suites, the runtime exposes an automation bridge only when the URL contains `?test=1`:

```js
window.__arcade = {
  start(mode),      // Launches 'classic' or 'daily' run
  state(),          // Inspects current phase: 'menu' | 'playing' | 'paused' | 'ended'
  inspect(),        // Returns game-specific debug telemetry
  step(seconds),    // Advances the clock using discrete 1/60s fixed substeps
  pause(),          // Simulates immediate pause
  resume()          // Simulates immediate resume
};
```

This architecture allows the Node.js test suite to run thousands of simulated frames in milliseconds without spinning up real-time timers.

---

## 4. Input Duality & Tactile Ergonomics

A game that only works well with a mechanical keyboard fails mobile players; a game that only works with touch swipes feels sluggish on desktop. Arcade Universe treats both input paradigms as equal.

```
       Desktop Keyboard (WASD / Arrows / Space)
                         │
                         ├──────────► ┌───────────────────────────┐
                         │            │                           │
          Mobile Touch / Mouse Drag ──►   api.input (Unified API) ├──► Game Simulation
                         │            │                           │
                         ├──────────► └───────────────────────────┘
                         │
        Declarative On-Screen Touch Buttons
```

### Universal Input Translation

Games declare their required controls declaratively:

```js
controls: [
  { id: 'left',  label: '←',     keys: ['ArrowLeft',  'KeyA'] },
  { id: 'right', label: '→',     keys: ['ArrowRight', 'KeyD'] },
  { id: 'jump',  label: 'JUMP',  keys: ['Space',      'KeyW', 'ArrowUp'] }
]
```

The runtime handles the rest:
- **`api.input.down('left')`**: True continuously while either the mapped keyboard key is held or the corresponding on-screen virtual button is pressed.
- **`api.input.pressed('jump')`**: True for exactly one simulation frame on the leading edge of the input.
- **`api.input.released('jump')`**: True for exactly one simulation frame on the trailing edge.

### Virtual Touchpad Ergonomics

On touch devices:
- Touch buttons are injected into the DOM below the canvas with minimum dimensions of $48 \times 48\text{px}$, fulfilling WCAG and mobile touch guidelines.
- Touch listeners utilize `touch-action: none` and `passive: false` to eliminate the 300ms mobile tap delay and prevent accidental screen zooming.
- For pointer-driven games (slingshots, putts, paddles), `api.input.pointer` exposes `{ x, y, down, pressed, released, inside, active }` mapped precisely to 960×600 logical space regardless of display size or orientation.

### The `cancelInput` Safety Valve

When a player is charging a slingshot or lining up a golf putt and suddenly pauses the game, switches browser tabs, or minimizes their phone browser, releasing the finger upon returning could trigger an unintended catastrophic move.

Games can implement the optional `cancelInput()` hook:

```js
cancelInput() {
  this.charging = false;
  this.dragStart = null;
}
```

Whenever the runtime detects a pause event or blur notification, it invokes `cancelInput()`, clearing all pending gestures safely.

---

## 5. The Procedural Web Audio Sound Chip

Audio is fifty percent of an arcade game's feel. Rather than bundling megabytes of compressed audio files, Arcade Universe implements a **procedural Web Audio sound chip** right inside `assets/arcade.js`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYNTHETIC SOUND CHIP                            │
│                                                                        │
│   AudioContext                                                         │
│       │                                                                │
│   OscillatorNode ──► Exponential Frequency Ramp ──► GainNode (Envelope)│
│   (Sine / Tri / Saw)                                    │              │
│                                                         ▼              │
│                                                   AudioDestination     │
└────────────────────────────────────────────────────────────────────────┘
```

### Zero-Byte Audio Architecture

Every sound effect in the entire catalog is synthesized on demand through an `OscillatorNode` feeding into a `GainNode`. The total bundle size cost of sound across all 100 games is **zero bytes**.

### Waveform Synthesis & Exponential Envelopes

Sound profiles use exponential frequency ramps to produce punchy, authentic retro arcade tones:

```js
const node = audio.createOscillator();
const gain = audio.createGain();
const t = audio.currentTime;

node.type = type; // 'sine' | 'triangle' | 'sawtooth'
node.frequency.setValueAtTime(Math.max(20, from * pitch), t);
node.frequency.exponentialRampToValueAtTime(Math.max(20, to * pitch), t + duration);
gain.gain.setValueAtTime(volume, t);
gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
```

### The Six Universal Sonic Profiles

The sound chip exposes six standard acoustic archetypes:

| Trigger Kind | Waveform | Start Freq | End Freq | Duration | Sonic Character & Gameplay Application |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`hit`** | Triangle | 170 Hz | 65 Hz | 0.10s | Low percussive thud for collisions, obstacle bumps, and landings. |
| **`good`** | Sine | 540 Hz | 900 Hz | 0.14s | Bright rising chime for coin collection, gem pickups, and level progress. |
| **`bad`** | Sawtooth | 150 Hz | 45 Hz | 0.22s | Downward buzz for damage taken, lives lost, and hazard contact. |
| **`win`** | Triangle | 523 Hz | 1046 Hz | 0.35s | Ascending octave fanfarina ($C_5 \to C_6$) for stage clear and victory. |
| **`click`** | Sine | 390 Hz | 520 Hz | 0.07s | Subtle micro-switch chirp for UI navigation and menu clicks. |
| **`shoot`** | Triangle | 680 Hz | 120 Hz | 0.065s | Sharp downward frequency laser pulse for projectiles and blasters. |

### Frequency Pitch Scaling

The `api.sound(kind, pitch)` API accepts a pitch multiplier ($0.25 \le \text{pitch} \le 4.0$). This allows games to build dynamic audio feedback:
- Accelerating combo multipliers (*pitch increases by $1.08\times$ with each consecutive catch in Candy Drop*).
- Speed-dependent engine revs in *Sunset Sprint*.
- Varying note pitches for musical puzzle games in *Mirror Memory*.

### Browser Autoplay Compliance

Modern browsers block audio contexts from playing until the user interacts with the page. The runtime creates its `AudioContext` lazily and resumes it on the player's first gesture (`keydown`, `pointerdown`, or `click`), guaranteeing clean, artifact-free audio without console warnings.

---

## 6. Data Resilience & Privacy Architecture

### The Privacy Guarantee: Zero Telemetry

Arcade Universe adheres to a strict client-side data boundary:
- **No Remote Database**: Your scores, medals, and favorites never leave your computer or phone.
- **No Third-Party Cookies or Beacons**: No third-party network requests are ever made.
- **Zero Identity Requirements**: No usernames, passwords, social logins, or wallet connections.

### Multi-Tier Storage Fallback

Browser storage can fail in numerous environments: private/incognito browsing windows with restricted permissions, embedded webviews, or storage quota exhaustion.

The storage engine in `assets/core.js` implements a graceful dual-tier fallback:

```
┌────────────────────────────────────────────────────────┐
│                   Arcade Storage Engine                │
├────────────────────────────────────────────────────────┤
│ 1. Attempt window.localStorage Read/Write              │
│    ├── Success: Persist to disk                        │
│    └── QuotaExceeded / SecurityError:                  │
│        ▼                                               │
│ 2. Seamless In-Memory Transient Fallback               │
│    └── Retains high scores for current tab session     │
└────────────────────────────────────────────────────────┘
```

If `localStorage` is disabled or throws an exception, the runtime falls back to an in-memory dictionary. The player experiences zero crashes, scores function normally during their session, and the UI displays a helpful privacy note.

### Schema Sanitization & Stale Cache Protection

To prevent corrupt or outdated storage payloads from causing fatal runtime errors:
1. Every record read from storage passes through `ArcadeCore.sanitize()`. Unknown keys, malformed score numbers, and non-existent game IDs are stripped out automatically.
2. Classic high scores and daily challenge records are partitioned into separate storage namespaces (`scores` vs `daily`).
3. Completing a delayed yesterday run cannot overwrite a fresh today daily record.

---

## 7. The Style Guide & Game Design System

### Canvas-Native Procedural Vector Aesthetics

All visual art in Arcade Universe is rendered with pure mathematical 2D canvas routines:
- Path geometry (`ctx.beginPath()`, `ctx.arc()`, `ctx.roundRect()`, `ctx.lineTo()`)
- Multi-stop linear and radial gradients (`ctx.createLinearGradient()`, `ctx.createRadialGradient()`)
- Glow effects (`ctx.shadowColor`, `ctx.shadowBlur`)
- Dynamic particle emitters (sparks, dust puffs, speed lines)

This procedural vector approach ensures that graphics scale with infinite mathematical sharpness to any 4K/8K monitor without pixelation or texture memory overhead.

### The Cyber-Retro Neon Color Token Palette

The Arcade Universe uses a curated color system designed for high contrast, retro warmth, and instantaneous genre recognition against dark canvas grounds:

```
Canvas Grounds:
  [#101219] Deep Space Ground   [#12082b] Cosmic Plum   [#1a1c26] Slate Navy

Genre Voltage Accents:
  [#fb719f] Action Pink         [#ffb86b] Racing Amber  [#a4e87b] Sports Grass
  [#b2a0ff] Strategy Lavender   [#79e2c1] Puzzle Mint   [#5eead4] Tabletop Cyan
  [#c084fc] Timing Violet       [#fcd34d] Genesis Gold
```

#### Palette Tokens Table

| Token Name | Hex Code | Semantic Role & Visual Function |
| :--- | :---: | :--- |
| **`space-black`** | `#101219` | The default deep canvas background. Eliminates eye strain and amplifies neon luminosity. |
| **`cosmic-plum`** | `#12082b` | The genesis ground of Candy Drop. Adds warmth and nostalgic CRT depth. |
| **`action-pink`** | `#fb719f` | Energetic, sharp highlight color for combat strikes, laser blasts, and rival warnings. |
| **`racing-amber`** | `#ffb86b` | Warm horizon gold for asphalt speedways, sunset skylines, and turbo slipstreams. |
| **`sports-grass`** | `#a4e87b` | Fresh vibrant lime for turf pitches, fairway greens, and successful field goals. |
| **`strategy-lavender`** | `#b2a0ff` | Cool, cerebral violet for defensive shields, energy conduits, and tactical zones. |
| **`puzzle-mint`** | `#79e2c1` | Soothing teal-mint for puzzle tiles, path connections, and spatial clarity. |
| **`tabletop-cyan`** | `#5eead4` | Crisp aqua for wooden board inlays, card borders, and domino pips. |
| **`timing-violet`** | `#c084fc` | Electric amethyst for pendulum arcs, rhythm beats, and precision targets. |
| **`genesis-gold`** | `#fcd34d` | Classic arcade marquee gold for medals, bonus coins, and the Candy Drop crown. |

### Canvas Ergonomics & Safe Action Zones

When composing scenes inside the 960×600 canvas:
- **Top Safe Zone (Y: 0–45px)**: Keep primary gameplay objects clear of this upper band. Essential metrics should be passed to `api.hud([{ label, value }])` to live in the accessible DOM header.
- **Bottom Safe Zone (Y: 540–600px)**: The baseline floor where player avatars, launch platforms, or paddles reside. Ensure clear vertical margin so fingertip touches do not obscure critical action.
- **Lateral Safe Inset (X: 30px from left/right)**: Critical puzzle grids and platform landings must stay 30px away from the lateral edge to prevent touch clipping on edge-swipe mobile gestures.

### Particle & Motion Budgets

1. **Max Live Particles (120)**: Game modules must cap active particles to 120 simultaneous instances. When creating particle bursts via `api.burst(x, y, color, count)`, use 8 to 16 particles per event.
2. **Reduced Motion Respect**: The runtime inspects `window.matchMedia('(prefers-reduced-motion: reduce)')` and exposes `api.reducedMotion`. Games must disable screen shake (`api.shake()`) and intense camera oscillation when this flag is active.
3. **Garbage Collection Hygiene**: Avoid allocating new arrays, vectors, or objects inside `update()` or `draw()`. Pre-allocate reusable scratch objects to guarantee consistent 60 FPS without garbage collection stutter.

### The Three-Tier Medal Threshold Curve

Every game establishes three ascending score milestones:

$$\text{Bronze} \quad < \quad \text{Silver} \quad < \quad \text{Gold}$$

```
Score: 0               Bronze (~1x)          Silver (~2.5x)           Gold (~5x+)
───────┼───────────────────┼─────────────────────┼─────────────────────┼────────►
       │     Rookie        │      Skilled        │      Master         │  Flow State
       │ (Found the loop)  │ (Consistent rhythm) │ (Near-flawless run) │
```

- **Bronze Threshold**: Achieved when a player grasps the core mechanic and finishes a competent first run.
- **Silver Threshold**: Requires tactical awareness, risk management, and sustained focus.
- **Gold Threshold**: Reserved for mastery, perfect combos, and flawless play.
- **The Anti-Idle Mandate**: An idle player who opens the cabinet and submits zero inputs must never receive a Bronze medal. Scores must require active, intentional interaction.

---

## 8. The Eight Arcade Wings

The 100 titles in the collection are curated into 8 thematic wings:

### 1. Action Wing · 19 Cabinets
*High-velocity reflexes, martial combat, acrobatic rooftop parkour, and cosmic dogfights.*
- **Anthem Titles**: [Neon Dojo](https://decoyindia.github.io/candy-drop/games/neon-dojo/index.html) *(counter-strike fighting)*, [Skybound](https://decoyindia.github.io/candy-drop/games/skybound/index.html) *(momentum platformer)*, [Starfall](https://decoyindia.github.io/candy-drop/games/starfall/index.html) *(space fleet shoot-em-up)*.
- **Complete Wing Roster**: `neon-dojo`, `skybound`, `starfall`, `dungeon-lantern`, `tether-twins`, `echo-dodge`, `spark-sweep`, `gravity-shift`, `treasure-diver`, `paper-flight`, `rocket-landing`, `harbor-rescue`, `prism-breaker`, `serpent-garden`, `meteor-drift`, `lava-lift`, `ghost-lantern`, `shield-spin`, `blade-bloom`.

### 2. Racing Wing · 5 Cabinets
*Precision apex drifting, mountain rallies, and horizon time trials.*
- **Anthem Titles**: [Sunset Sprint](https://decoyindia.github.io/candy-drop/games/sunset-sprint/index.html) *(outrun-style horizon racer)*, [Drift Circuit](https://decoyindia.github.io/candy-drop/games/drift-circuit/index.html) *(top-down tire-smoke drifting)*.
- **Complete Wing Roster**: `sunset-sprint`, `drift-circuit`, `rally-courier`, `downhill-dash`, `sail-sprint`.

### 3. Sports Wing · 13 Cabinets
*Ballistics, trajectory estimation, pitch timing, and tactical tournament duels.*
- **Anthem Titles**: [Pocket Striker](https://decoyindia.github.io/candy-drop/games/pocket-striker/index.html) *(fast 75-second football match)*, [Mini Golf Club](https://decoyindia.github.io/candy-drop/games/mini-golf-club/index.html) *(six-hole physics putting)*.
- **Complete Wing Roster**: `pocket-striker`, `mini-golf-club`, `volley-vista`, `sprint-start`, `pool-parlor`, `penalty-keeper`, `rooftop-rally`, `hoops-minute`, `pocket-bowler`, `home-run-hero`, `wicket-rush`, `archery-grove`, `curling-cove`.

### 4. Strategy Wing · 12 Cabinets
*Wave defense, tactical routing, resource management, and island logistics.*
- **Anthem Titles**: [Orbit Guard](https://decoyindia.github.io/candy-drop/games/orbit-guard/index.html) *(orbital tower defense)*, [Harbor Master](https://decoyindia.github.io/candy-drop/games/harbor-master/index.html) *(sea lane air-traffic control)*.
- **Complete Wing Roster**: `orbit-guard`, `harbor-master`, `snowball-siege`, `city-blocks`, `power-grid`, `ant-colony`, `weather-station`, `train-yard`, `reef-keeper`, `tidal-tactics`, `orchard-keeper`, `colony-balance`.

### 5. Puzzle Wing · 30 Cabinets
*Spatial logic, number theory, path connectivity, and deductive reasoning.*
- **Anthem Titles**: [Merge Lab](https://decoyindia.github.io/candy-drop/games/merge-lab/index.html) *(tile evolution)*, [Queens Court](https://decoyindia.github.io/candy-drop/games/queens-court/index.html) *(n-queens chess deduction)*, [Island Bridges](https://decoyindia.github.io/candy-drop/games/island-bridges/index.html) *(hashiwokakero bridges)*.
- **Complete Wing Roster**: `merge-lab`, `sum-cross`, `queens-court`, `patchwork-park`, `logic-locks`, `word-ladder`, `island-bridges`, `mirror-memory`, `loop-garden`, `marble-maze`, `laser-lock`, `word-forge`, `balance-box`, `trail-weaver`, `mine-garden`, `memory-lane`, `light-circuit`, `bubble-bay`, `crate-escape`, `slide-studio`, `number-nook`, `knight-quest`, `color-flood`, `constellation-link`, `word-trail`, `ricochet-range`, `pipe-works`, `nonogram-nook`, `code-breaker`, `peg-parlor`.

### 6. Tabletop Wing · 8 Cabinets
*Classic wooden board mechanics, AI turn-taking duels, and tile-matching parlors.*
- **Anthem Titles**: [Mahjong Meadow](https://decoyindia.github.io/candy-drop/games/mahjong-meadow/index.html) *(zen tile clearing)*, [Royal Checkers](https://decoyindia.github.io/candy-drop/games/royal-checkers/index.html) *(strategic leaps)*.
- **Complete Wing Roster**: `mahjong-meadow`, `ultimate-grid`, `four-in-row`, `reversi-room`, `royal-checkers`, `dice-district`, `domino-trail`, `pinball-grove`.

### 7. Timing Wing · 12 Cabinets
*Sub-second precision, pendulum physics, crane inertia, and rhythm groove.*
- **Anthem Titles**: [Boomerang Bay](https://decoyindia.github.io/candy-drop/games/boomerang-bay/index.html) *(curving throw & catch)*, [Cargo Crane](https://decoyindia.github.io/candy-drop/games/cargo-crane/index.html) *(momentum container drop)*.
- **Complete Wing Roster**: `boomerang-bay`, `magnet-miner`, `reaction-lab`, `cargo-crane`, `chroma-switch`, `flappy-fin`, `tunnel-dash`, `rhythm-rail`, `stack-harbor`, `perfect-pour`, `cafe-rush`, `orbit-hop`.

### 8. Original Genesis Wing · 1 Cabinet
*The game that started it all.*
- **The Flagship**: [Candy Drop](https://decoyindia.github.io/candy-drop/index.html) *(combo-chasing basket catch)*.

---

## 9. Authoring a New Cabinet: Contributor Walkthrough

Adding a new game to the Arcade Universe requires no complex toolchains. Follow this five-step walkthrough:

### Step 1: Register in Catalog
Add your game definition to `CATALOG` inside `assets/core.js`:

```js
{
  id: 'stellar-leap',
  title: 'Stellar Leap',
  category: 'Platformer',
  group: 'Action',
  color: '#fb719f',
  hook: 'Time the gravity surge. Reach orbit.',
  duration: '1–2 min',
  tag: 'Master the planetary hop'
}
```

### Step 2: Implement the Game Module
Create `games/stellar-leap/game.js`:

```js
Arcade.mount({
  id: 'stellar-leap',
  title: 'Stellar Leap',
  category: 'Platformer',
  accent: '#fb719f',
  description: 'Time the gravity surge. Reach orbit.',
  howTo: [
    'Tap or press Space to trigger your thruster pulse.',
    'Align with planetary gravity wells to slingshot higher.',
    'Avoid dark matter anomalies and collect stardust.'
  ],
  controls: [
    { id: 'jump', label: 'PULSE', keys: ['Space', 'KeyW', 'ArrowUp'] }
  ],
  medals: [150, 450, 1000],
  create(api) {
    let altitude = 0;
    let velocity = 0;

    return {
      update(dt) {
        if (api.input.pressed('jump')) {
          velocity = 300;
          api.sound('shoot', 1.2);
          api.burst(480, 500, '#fb719f', 12);
        }
        altitude += velocity * dt;
        api.score(Math.floor(altitude));
        api.hud([{ label: 'ALTITUDE', value: Math.floor(altitude) + 'm' }]);
      },
      draw(ctx) {
        ctx.fillStyle = '#101219';
        ctx.fillRect(0, 0, 960, 600);
        ctx.fillStyle = '#fb719f';
        ctx.beginPath();
        ctx.arc(480, 500 - (altitude % 400), 20, 0, Math.PI * 2);
        ctx.fill();
      }
    };
  }
});
```

### Step 3: Generate Card Artwork
Create `assets/art/stellar-leap.svg` with dimensions `viewBox="0 0 600 380"` featuring original vector elements and your cabinet's accent colors.

### Step 4: Run Contributor Automation
Run the page generator and readme synchronizer:

```bash
npm run pages
node scripts/generate-readme.cjs
```

### Step 5: Verify Everything
Run the test suite to ensure your new game fulfills all determinism, seed reproducibility, and memory boundedness contracts:

```bash
npm test
```

When all tests pass, submit your pull request. Welcome to the Arcade Universe!

---

*Arcade Run (Candy Arcade) is free, open-source software built for the joy of playing. Explore the full collection at [Candy Arcade Hub](../arcade.html), launch the interactive [Companion Portal](../portal.html), or dive straight into the classic [Candy Drop](../index.html).*
