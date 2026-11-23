# Arcade Universe · Repository Metadata & Brand Specification

> **Official repository branding, discovery metadata, and game design manifesto for Candy Arcade (Arcade Run).**

---

## 1. GitHub Repository Metadata

### Short Description (About Sidebar)
*Character count: 336 / 350 max*

```text
100 original, zero-dependency browser games in pure vanilla JavaScript & HTML5 Canvas. No build steps, no installs, no frameworks, no telemetry—just pure 60 FPS retro arcade joy. Featuring deterministic daily seeds, synthesized Web Audio sound chips, responsive keyboard + touch controls, and 3-tier medal challenges. Insert coin and play!
```

---

### Alternative Short Descriptions (By Channel)

| Context | Length | Description |
| :--- | :---: | :--- |
| **Punchy / Twitter / X** | 138 chars | 100 browser games. Zero downloads. Zero dependencies. Pure HTML5 Canvas & Web Audio. Pick a game and find your flow at 60 FPS. Just play. |
| **Hacker News / Reddit** | 224 chars | 100 dependency-free browser games built with pure vanilla JS and HTML5 Canvas. Features a 960×600 virtual stage, deterministic Mulberry32 PRNG, procedural Web Audio oscillator sound effects, and full touch + keyboard parity. |
| **Product Hunt / Directory** | 280 chars | An open web arcade featuring 100 original, handcrafted mini-games across 8 vibrant genres. No frameworks, no bundlers, no tracking. Every title runs at 60 FPS with offline persistence, seeded daily competitions, and 3-tier medal challenges. Free forever. |

---

### Repository Topics (GitHub Tags)

```text
arcade, browser-games, canvas-games, html5-games, javascript, no-dependencies, retro-gaming, pixel-art, game-collection, vanilla-js, web-audio, offline-first, mobile-games, touch-controls, daily-challenge, procedural-generation, open-source-games, game-dev, indie-games, zero-build, 60fps, casual-games
```

#### Topic Taxonomies & Justifications

* **Platform & Web Tech**: `browser-games`, `canvas-games`, `html5-games`, `javascript`, `vanilla-js`, `web-audio`, `offline-first`
* **Architecture & Philosophy**: `no-dependencies`, `zero-build`, `procedural-generation`, `60fps`
* **Genre & Culture**: `arcade`, `retro-gaming`, `pixel-art`, `game-collection`, `indie-games`, `casual-games`
* **Mechanics & Ergonomics**: `touch-controls`, `mobile-games`, `daily-challenge`, `open-source-games`, `game-dev`

---

## 2. Brand Identity & Taglines

### The Core Tagline Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRIMARY BRAND SLOGAN                            │
│           "100 Games. Zero Downloads. Infinite One More Tries."        │
└────────────────────────────────────────────────────────────────────────┘
```

* **Hero Marquee**: *Small games. Great little escapes.*
* **Retro Arcade Marquee**: *INSERT COIN · PRESS START · NO QUARTERS REQUIRED*
* **The Engineering Truth**: *Pure Web Craftsmanship. 960×600 Logical Canvas. Zero Dependencies. 60 FPS Everywhere.*
* **The Player Promise**: *No accounts. No ads. No telemetry. Your scores stay in your browser.*
* **The Daily Challenge Call**: *One shared seed across the globe. One day to claim the crown.*

---

## 3. Brand Pillars

```
       ┌───────────────────────────────┐
       │     THE 5 BRAND PILLARS       │
       └──────────────┬────────────────┘
                      │
   ┌───────────┬──────┴──────┬───────────┬───────────┐
   ▼           ▼             ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  ZERO   │ │  PURE   │ │  MICRO  │ │  INPUT  │ │ FAIR    │
│FRICTION │ │   WEB   │ │  DEPTH  │ │ DUALITY │ │ SEEDS   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Pillar 1: Zero Friction, Zero Footprint
* **Instant Gratification**: The distance between discovering the repository and playing any game is zero seconds. Double-click `arcade.html` in your file manager or click the GitHub Pages link.
* **No Pipeline Debt**: No Node.js build step, no Webpack/Vite bundler, no transpilers, no TypeScript compilation steps required to enjoy the games.
* **Zero Dark Patterns**: No loot boxes, no energy meters, no forced ads, no telemetry pings, and no user tracking. Progress is stored strictly in client-side `localStorage` with resilient in-memory fallback.

### Pillar 2: Pure Web Craftsmanship
* **Platform-Native Purity**: Built entirely on standard browser APIs: ECMAScript 2022, HTML5 Canvas 2D Rendering Context, and the Web Audio API.
* **Synthesized Audio**: Zero audio file downloads. Every punch, jump, laser, and celebration is synthesized live through procedural oscillator math.
* **Long-Term Permanence**: Built to survive for decades. A pure HTML5/Canvas game created without third-party runtime frameworks will run identically in web browsers thirty years from now.

### Pillar 3: Mechanical Depth in Micro Sessions
* **Respecting Time**: Sessions range from 15-second lightning rounds (`Sprint Start`) to 5-minute tactical masterclasses (`Orbit Guard`, `Queens Court`).
* **High Skill Ceilings**: Easy to understand within 3 seconds, challenging to master over 300 runs.
* **No Idle Filler**: Every second of gameplay demands intentional decision-making, timing, or puzzle deduction.

### Pillar 4: Universal Input Duality
* **True Parity**: Keyboard and touch are co-equal first-class citizens.
* **Ergonomic Design**: 48px minimum virtual touch targets for mobile thumb play, alongside crisp Arrow/WASD/Space bindings for desktop keyboardists.
* **Tactile Recovery**: Automatic input cancellation (`cancelInput()`) when games pause or windows blur, preventing accidental input commitment.

### Pillar 5: Deterministic Fair Play
* **Global Synchronization**: Daily challenge seeds roll over at exactly `00:00 UTC` worldwide.
* **Mulberry32 PRNG**: Deterministic random streams ensure that players worldwide face identical puzzle layouts and obstacle sequences on any given calendar day.
* **Separation of Concerns**: Rendering logic is strictly pure and never consumes or advances gameplay random seeds.

---

## 4. The Game Design Manifesto

Every title in the Arcade Universe adheres to the **Ten Golden Rules**:

1. **The Three-Second Rule**: A player must understand their primary objective and core interaction within three seconds of launching the cabinet.
2. **Mechanical Purity**: Focus on one verb (jump, slice, drift, launch, merge, rotate) and polish its kinetic feel until it sings.
3. **Deterministic Math**: State progression must be mathematically reproducible. Never call `Math.random()` during game simulation; always use the injected `api.random()`.
4. **Pure Drawing Separation**: The `draw(ctx)` loop must be a strictly read-only projection of game state. Re-rendering a frame must never advance physics, decrement timers, or mutate random seeds.
5. **Bounded Memory Footprint**: No unbounded array growth. Projectiles, particles, obstacles, and historical trails must live in pre-allocated pools or capped arrays. Frame rate must never decay over time.
6. **Input Redundancy**: Every pointer-only mechanic must have a keyboard alternative. Every multi-button desktop scheme must have an accessible virtual touch configuration.
7. **Procedural Sonic Feedback**: Sound is game feel. Provide clear audio cues for collisions (`hit`), success (`good`), error (`bad`), fanfare (`win`), UI selection (`click`), and discharge (`shoot`).
8. **The Three-Tier Medal Progression**:
   * **Bronze**: Awarded for completing a solid introductory run.
   * **Silver**: Awarded for demonstrating tactical competence and rhythm.
   * **Gold**: Awarded only for exceptional, near-flawless mastery.
   * *Anti-Idling Clause*: An idle player who provides zero inputs must never earn a medal.
9. **Graceful Suspension**: When the player switches tabs, presses `P`, or receives a phone call, the simulation freezes instantly, audio context is gated, and pending drag inputs are safely discarded.
10. **Zero External Burden**: Never import external fonts, images, audio clips, or libraries. Every visual is drawn with canvas primitives or inline SVG; every sound is generated from waveforms.

---

## 5. Arcade Wing Architecture

The 100 games are distributed across 8 thematic wings:

| Wing | Count | Color Token | Representative Anthem Title | Gameplay Archetype |
| :--- | :---: | :---: | :--- | :--- |
| **Action** | 19 | `#fb719f` | *Neon Dojo*, *Skybound*, *Starfall* | High-reflex dodge, melee counters, platform flow |
| **Racing** | 5 | `#ffb86b` | *Sunset Sprint*, *Drift Circuit* | Apex cornering, slipstream overtaking, time trials |
| **Sports** | 13 | `#a4e87b` | *Pocket Striker*, *Mini Golf Club* | Ballistics, trajectory estimation, timing angles |
| **Strategy** | 12 | `#b2a0ff` | *Orbit Guard*, *Harbor Master* | Tower defense, resource routing, wave management |
| **Puzzle** | 30 | `#79e2c1` | *Merge Lab*, *Queens Court*, *Island Bridges* | Spatial reasoning, logic deduction, path connectivity |
| **Tabletop** | 8 | `#5eead4` | *Mahjong Meadow*, *Royal Checkers* | Classic board mechanics, AI turn duels, tile matching |
| **Timing** | 12 | `#c084fc` | *Boomerang Bay*, *Magnet Miner*, *Cargo Crane* | Rhythmic accuracy, release inertia, reaction testing |
| **Original** | 1 | `#fcd34d` | *Candy Drop* | The legendary genesis title: combo-chasing basket catch |

---

## 6. GitHub Repository Configuration Checklist

- [x] **Repository Name**: `candy-drop` (Internal: `Arcade Run` / `Candy Arcade`)
- [x] **Primary Branch**: `main`
- [x] **GitHub Pages Publishing**: Enabled from `/` (root) on `main` branch
- [x] **Social Preview Graphic**: `assets/brand/social-preview.png` (1280×640px)
- [x] **Favicon**: `assets/favicon.svg` (SVG candy icon)
- [x] **License**: Open Source MIT
- [x] **Contributing Guide**: Documented in `docs/game-api.md` and `docs/ABOUT.md`
- [x] **Interactive Companion Portal**: [portal.html](../portal.html) (Live Web Audio synthesizer, PRNG simulator, and cabinet picker)
- [x] **Zero Build Deployment**: Native static hosting compatibility with zero CI build steps required to serve.
