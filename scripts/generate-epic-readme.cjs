'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { CATALOG } = require('../assets/core.js');

const rootDir = path.resolve(__dirname, '..');
const base = 'https://decoyindia.github.io/candy-drop/';

// 1. Load configs for all 100 games
const gameConfigs = {};
for (const g of CATALOG) {
  if (g.id === 'candy-drop') {
    gameConfigs[g.id] = {
      title: 'Candy Drop',
      howTo: [
        'Catch falling candies to score points and build escalating combos.',
        'Dodge falling bombs and hazardous spikes to preserve your lives.',
        'Collect sparkling star power-ups to trigger frenzy multipliers.'
      ],
      controls: [
        { id: 'move', label: 'Mouse / Touch / Arrows', keys: ['ArrowLeft', 'ArrowRight'] }
      ],
      medals: [50, 150, 300]
    };
    continue;
  }
  const code = fs.readFileSync(path.join(rootDir, 'games', g.id, 'game.js'), 'utf8');
  let cfg;
  vm.runInNewContext(code, { Arcade: { mount(c) { cfg = c; } } });
  gameConfigs[g.id] = cfg;
}

// Helper to format keys cleanly
function formatControls(controls) {
  if (!controls || !controls.length) return 'Touch / Pointer / Keyboard';
  return controls.map(c => {
    const keysFormatted = (c.keys || []).map(k => {
      if (k.startsWith('Key')) return '`' + k.slice(3) + '`';
      if (k.startsWith('Arrow')) return '`' + ({ ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[k] || k) + '`';
      if (k === 'Space') return '`Space`';
      if (k.startsWith('Digit')) return '`' + k.slice(5) + '`';
      return '`' + k + '`';
    }).join(' or ');
    return `**${c.label}** (${keysFormatted})`;
  }).join(' &nbsp;•&nbsp; ');
}

// Helper to format medals
function formatMedals(medals) {
  if (!medals || medals.length < 3) return '🥉 Bronze &nbsp;•&nbsp; 🥈 Silver &nbsp;•&nbsp; 🥇 Gold';
  return `🥉 **${medals[0].toLocaleString()}** &nbsp;•&nbsp; 🥈 **${medals[1].toLocaleString()}** &nbsp;•&nbsp; 🥇 **${medals[2].toLocaleString()}**`;
}

// 2. Define Wing Metadata & Mascot mapping
const WING_METADATA = {
  Action: {
    mascot: 'assets/brand/mascot-neon-ninja.svg',
    title: 'Wing 1: Action Sector',
    subtitle: 'Lightning reflexes, orbital combat, martial duels & subterranean gauntlets',
    badge: 'Cyber Shinobi • 19 Cabinets',
    desc: 'High-speed kinetic tests where split-second reaction times and spatial navigation dictate survival. Dodge bullet curtains, deflect sword strikes, leap crumbling rooftops, and delve into shadow-cast dungeons.'
  },
  Racing: {
    mascot: 'assets/brand/mascot-velocity-racer.svg',
    title: 'Wing 2: Velocity Raceway',
    subtitle: 'Horizon sprints, hairpin drifts, alpine descents & coastal regattas',
    badge: 'Apex Drift Pilot • 5 Cabinets',
    desc: 'Pure mechanical motion and tire-smoke physics. Master braking points, thread through heavy rush-hour traffic, draft behind rival chassis for slipstream boosts, and hit every apex across asphalt, snow, and water.'
  },
  Sports: {
    mascot: 'assets/brand/mascot-pixel-striker.svg',
    title: 'Wing 3: Champions Arena',
    subtitle: 'Billiards geometry, beach spikes, pitch strikes & six-hole links',
    badge: 'Grand Champion Striker • 13 Cabinets',
    desc: 'Precision physics, trajectory angles, and tactical timing. Sink clutch putts on undulating greens, time your jump spike at the volleyball net, curl stones to the button, and chase 300 at the pocket bowling alley.'
  },
  Strategy: {
    mascot: 'assets/brand/mascot-orbital-mech.svg',
    title: 'Wing 4: Tactical Command',
    subtitle: 'Orbital turret defense, sea-lane logistics, power grids & colony survival',
    badge: 'Titan Defense Vanguard • 12 Cabinets',
    desc: 'Macro planning meets crisis management. Construct synchronized turret kill-zones, route sixteen cargo fleets without collisions, balance lunar colony oxygen budgets, and command the underground ant legion.'
  },
  Puzzle: {
    mascot: 'assets/brand/mascot-quantum-alchemist.svg',
    title: 'Wing 5: Logic Sanctum',
    subtitle: 'Arithmetic cross-sums, 8-queens chess, laser optics & synthesis labs',
    badge: 'Grand Transmuter of Runes • 30 Cabinets',
    desc: 'The intellectual heart of the arcade floor. Thirty pristine analytical puzzles with provable solutions: untangle celestial constellations, synthesize high-value elements in Merge Lab, redirect laser beams, and decipher color codes.'
  },
  Tabletop: {
    mascot: 'assets/brand/mascot-pixel-king.svg',
    title: 'Wing 6: Parlor & Tabletop',
    subtitle: 'Mahjong matches, Reversi flips, dice poker & checkered tacticians',
    badge: 'Sovereign of the Checkered Throne • 8 Cabinets',
    desc: 'Centuries of analog parlor elegance recreated with instant digital responsiveness. Outwit intelligent heuristic AI in four-in-a-row, claim critical corner tiles in Reversi, and clean the felt in Dice District.'
  },
  Timing: {
    mascot: 'assets/brand/mascot-beat-master.svg',
    title: 'Wing 7: Rhythm & Reflex',
    subtitle: 'Curved boomerang catches, magnetic hauls, four-rail beats & cafe rushes',
    badge: 'Vinyl Synesthete & BPM Overlord • 12 Cabinets',
    desc: 'Pure rhythmic synchronization and cadence. Calculate the aerodynamic return loop of boomerangs, time crane trolley releases with momentum preservation, brew espresso orders under pressure, and surf sonic rails.'
  },
  Original: {
    mascot: 'assets/brand/mascot-sweet-hopper.svg',
    title: 'Wing 8: The Genesis Vault',
    subtitle: 'The founding confectionery spectacle that sparked the entire arcade universe',
    badge: 'Sweet Hopper • 1 Cabinet',
    desc: 'The timeless classic that started it all in late 2024. Catch falling sweets, dodge explosive hazard bombs, maintain the combo multiplier, and experience the original zero-dependency browser game in its purest form.'
  }
};

// 3. Signature Spotlight Games
const SIGNATURE_GAMES = [
  {
    id: 'sunset-sprint',
    wing: 'Wing 2: Racing',
    flavor: 'Synthwave Highway Pursuit',
    highlight: 'High-speed 6 km arcade horizon racer with dynamic traffic drafting, emergency braking, and pulse-pounding checkpoint countdowns.'
  },
  {
    id: 'starfall',
    wing: 'Wing 1: Action',
    flavor: 'Vertical Space Fleet Shmup',
    highlight: 'Four escalating alien fleets culminating in a massive sector-five mothership encounter with EMP pulse shields and laser warning grids.'
  },
  {
    id: 'neon-dojo',
    wing: 'Wing 1: Action',
    flavor: 'Rooftop Martial Arts Duel',
    highlight: 'Authentic fighting game stamina management, high-risk parry windows, orange sweep jumps, and guard-breaking roundhouse kicks.'
  },
  {
    id: 'mini-golf-club',
    wing: 'Wing 3: Sports',
    flavor: 'Six-Hole Championship Links',
    highlight: 'Realistic ball physics with kinetic wall rebounds, sand trap drag, water hazard penalties, and delicate green deceleration.'
  },
  {
    id: 'merge-lab',
    wing: 'Wing 5: Puzzle',
    flavor: 'Atomic Element Synthesizer',
    highlight: 'Smooth directional tile synthesis with exact single-move undo, emergency score banking, and mathematically pure grid mechanics.'
  },
  {
    id: 'orbit-guard',
    wing: 'Wing 4: Strategy',
    flavor: 'Deep-Space Orbital Defense',
    highlight: 'Eight intense alien onslaughts featuring Pulse, Frost, and Nova turrets with budget credit economy, pad upgrades, and boss encounters.'
  },
  {
    id: 'boomerang-bay',
    wing: 'Wing 7: Timing',
    flavor: 'Aerodynamic Catch & Throw',
    highlight: 'Curved clockwise flight arcs requiring precise launch angles and split-second return catches to build lucrative multiplier streaks.'
  },
  {
    id: 'mahjong-meadow',
    wing: 'Wing 6: Tabletop',
    flavor: 'Traditional Tile Solitaire',
    highlight: 'Layered bamboo and flower tiles with edge-freedom rules, multi-level board clearing, and tranquil procedural vector graphics.'
  },
  {
    id: 'candy-drop',
    wing: 'Wing 8: Original',
    flavor: 'The Founding Confectionery Run',
    highlight: 'Catch luscious candies, dodge lethal ticking bombs, collect shimmering star power-ups, and keep the timeless arcade dream alive.'
  }
];

let doc = '';

// ==========================================
// 1. HERO MARQUEE & BANNER
// ==========================================
doc += `<p align="center">
  <a href="${base}arcade.html">
    <img src="assets/brand/candy-arcade-banner.svg" alt="Candy Arcade - 100 Browser Games" width="880">
  </a>
</p>

<p align="center">
  <b>100 ORIGINAL BROWSER GAMES &nbsp;•&nbsp; ZERO INSTALL &nbsp;•&nbsp; ZERO DEPENDENCIES &nbsp;•&nbsp; 60 FPS PURE CANVAS</b>
</p>

<p align="center">
  <a href="https://github.com/decoyindia/candy-drop"><img src="https://img.shields.io/badge/Games-100%20Playable-ff0077.svg?style=for-the-badge&logo=gamepad&logoColor=white" alt="100 Playable Games"></a>
  <a href="${base}arcade.html"><img src="https://img.shields.io/badge/Dependencies-0%20Zero-00f0ff.svg?style=for-the-badge&logo=javascript&logoColor=black" alt="Zero Dependencies"></a>
  <a href="${base}arcade.html"><img src="https://img.shields.io/badge/Engine-960x600%20Canvas-7928ca.svg?style=for-the-badge&logo=html5&logoColor=white" alt="960x600 Virtual Canvas"></a>
  <a href="${base}arcade.html"><img src="https://img.shields.io/badge/Audio-Procedural%20Web%20Audio-ffe600.svg?style=for-the-badge&logo=audio&logoColor=black" alt="Procedural Sound Chip"></a>
  <a href="${base}arcade.html"><img src="https://img.shields.io/badge/Offline-100%25%20Ready-00ff66.svg?style=for-the-badge&logo=powershell&logoColor=black" alt="100% Offline Ready"></a>
</p>

<p align="center">
  <a href="${base}arcade.html">
    <img src="assets/brand/arcade-cabinet-hero.gif" alt="Animated Arcade Cabinet - Play Live" width="300">
  </a>
  <br>
  <a href="${base}arcade.html">
    <img src="assets/brand/insert-coin.gif" alt="INSERT COIN - Launch Candy Arcade" width="280">
  </a>
</p>

<p align="center">
  <a href="${base}arcade.html"><b>🕹️ ENTER CANDY ARCADE HUB (100 GAMES) →</b></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="${base}index.html"><b>🍬 PLAY ORIGINAL CANDY DROP →</b></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="portal.html"><b>✨ ARCADE LAB & SOUNDBOARD PORTAL →</b></a>
</p>

---

`;

// ==========================================
// 2. ARCADE PASSPORT & TICKET STUB
// ==========================================
doc += `## 🎟️ The Arcade Passport: Admit One

<p align="center">
  <a href="${base}arcade.html">
    <img src="assets/brand/arcade-ticket.svg" alt="Vintage Die-Cut Arcade Ticket: Admit One, 100 Games, Zero Downloads, Infinite Plays" width="760">
  </a>
</p>

Welcome to **Candy Arcade**—an extraordinary universe of **100 handcrafted, zero-dependency browser games** built entirely on the native web platform. 

In an era where loading a casual web page often demands forty megabytes of bloated JavaScript bundles, intrusive tracking telemetry, and mandatory account paywalls, Candy Arcade stands as a radical design manifesto: **pure, instant, unadulterated gameplay that boots in milliseconds, runs offline, and will still play flawlessly thirty years from today.**

Every single game in this collection is an autonomous micro-world featuring:
* 🚀 **Zero Downloads & Zero Install:** Run directly from GitHub Pages or locally via \`file://\` protocol.
* 📦 **Zero External Dependencies:** No React, no Vue, no Webpack, no Vite, no Phaser. Pure HTML5 Canvas, Web Audio, and Vanilla JavaScript.
* 🖥️ **Unified 960 × 600 Virtual Canvas:** Responsive 16:10 aspect ratio with integer DPR scaling and dedicated board focus crops.
* 🎮 **Universal Input Duality:** Responsive multi-touch on-screen d-pads and comprehensive desktop keyboard bindings on every title.
* 📅 **Daily Seeded Global Challenges:** Synchronized UTC midnight PRNG seeds for daily competition on an even playing field.
* 🏆 **Trophy & Medal Progression:** Bronze, Silver, and Gold mastery thresholds backed by resilient, isolated local storage.

---

`;

// ==========================================
// 3. FEATURE HIGHLIGHTS
// ==========================================
doc += `## ⚡ Why This Arcade Is Built Different

| Architectural Pillar | How Typical Web Games Work | How Candy Arcade Operates |
| :--- | :--- | :--- |
| **Dependency Footprint** | Heavy 15–50 MB node_modules, bundlers, and third-party engines. | **0 KB dependencies.** 100% written in standard, evergreen browser APIs. |
| **Startup Latency** | Lengthy loading screens, asset fetching, and splash ads. | **Instantaneous.** 0ms bundle parse; renders first interactive frame immediately. |
| **Audio Engine** | Hundreds of megabytes of MP3/WAV files causing buffering lag. | **Zero-byte Web Audio synthesizer chip.** Procedural sine, triangle, square, saw & noise waveforms. |
| **Persistence & Privacy** | Remote telemetry, analytics trackers, cloud authentication logins. | **100% private & offline.** High scores remain strictly in your browser's \`localStorage\`. |
| **Deterministic PRNG** | Non-repeatable \`Math.random()\` making fair competition impossible. | **Seeded Mulberry32 PRNG.** Daily challenges reset at 00:00 UTC with identical procedural layouts. |
| **Platform Portability** | Fragmented touch support; breaks on mobile without native apps. | **Native input duality.** Automatic viewport scaling from 390px phones to 4K desktop screens. |

---

`;

// ==========================================
// 4. THE ARCADE FLOOR: 8 WINGS & MASCOTS
// ==========================================
doc += `## 🏛️ The Arcade Floor: Eight Curated Wings

The 100 cabinets of Candy Arcade are systematically organized into eight specialized architectural wings, each presided over by a legendary genre champion mascot:

<p align="center">
  <img src="assets/brand/mascots-lineup.svg" alt="The Eight Arcade Genre Mascots on Tournament Podium" width="940">
</p>

| Wing & Sector | Mascot Champion | Cabinets | Signature Mechanical Essence |
| :--- | :--- | :---: | :--- |
| **[Wing 1: Action](#wing-1-action-sector-)** | **Neon Ninja** (*Cyber Shinobi*) | 19 | Kinetic agility, parry frames, bullet-hell evasion, and dungeon survival. |
| **[Wing 2: Racing](#wing-2-velocity-raceway-)** | **Velocity Racer** (*Apex Drift Pilot*) | 5 | Tire slipstream drafting, counter-steering, braking physics, and checkpoint rushes. |
| **[Wing 3: Sports](#wing-3-champions-arena-)** | **Pixel Striker** (*Grand Champion Striker*) | 13 | Angular ballistics, putting gradients, pocket billiards, and clutch beach spikes. |
| **[Wing 4: Strategy](#wing-4-tactical-command-)** | **Orbital Mech** (*Titan Defense Vanguard*) | 12 | Chokepoint defense grids, maritime fleet routing, grid power flow, and ecosystem balance. |
| **[Wing 5: Puzzle](#wing-5-logic-sanctum-)** | **Quantum Alchemist** (*Grand Transmuter*) | 30 | Arithmetic cross-sums, atomic element synthesis, laser refraction, and Hamiltonian paths. |
| **[Wing 6: Tabletop](#wing-6-parlor--tabletop-)** | **Pixel King** (*Sovereign of the Throne*) | 8 | Heuristic board AI, Reversi flanking tactics, domino matching, and parlor dice poker. |
| **[Wing 7: Timing](#wing-7-rhythm--reflex-)** | **Beat Master** (*BPM Overlord*) | 12 | Curved boomerang aerodynamics, resonant cargo drops, multi-lane beats, and barista rushes. |
| **[Wing 8: Original](#wing-8-the-genesis-vault-)** | **Sweet Hopper** (*Founding Mascot*) | 1 | The timeless confection run: catch candy, dodge bombs, and ride astronomical combo streaks. |

---

`;

// ==========================================
// 5. SIGNATURE STANDOUT SHOWCASES
// ==========================================
doc += `## 🌟 Signature Standout Cabinets

Step up to the most celebrated cabinets on the arcade floor. Each title features original procedural vector art, tailored gameplay physics, and full touch/keyboard integration:

`;

for (const item of SIGNATURE_GAMES) {
  const cfg = gameConfigs[item.id];
  const g = CATALOG.find(x => x.id === item.id);
  const link = item.id === 'candy-drop' ? `${base}index.html` : `${base}games/${item.id}/index.html`;
  const artPath = `assets/art/${item.id}.svg`;
  const controlsText = formatControls(cfg.controls);
  const medalsText = formatMedals(cfg.medals);

  doc += `### 🕹️ ${cfg.title} &nbsp;•&nbsp; *${item.flavor}*

| Visual Cabinet Art | Cabinet Dossier & Interactive Play |
| :---: | :--- |
| <a href="${link}"><img src="${artPath}" alt="${cfg.title} Artwork" width="280"></a><br><sub><a href="${link}"><b>[ Click to Launch Cabinet ]</b></a></sub> | 🏷️ **Wing:** ${item.wing}<br>⏱️ **Session:** ${g.duration}<br>🎯 **Objective:** ${cfg.howTo[0]}<br><br>💡 **Gameplay Hook:** ${g.hook}<br>✨ **Dossier:** ${item.highlight}<br><br>🎮 **Controls:** ${controlsText}<br>🏆 **Medals:** ${medalsText}<br><br><a href="${link}"><b>▶ PLAY ${cfg.title.toUpperCase()} LIVE NOW →</b></a> |

`;
}

doc += `---

`;

// ==========================================
// 6. THE COMPLETE 100-GAME FLOOR DIRECTORY
// ==========================================
doc += `## 📜 The Master Floor Directory: All 100 Cabinets

Browse the entire 100-cabinet collection organized across all eight arcade wings. Click any game to immediately launch its standalone, dedicated entry page:

`;

const WING_ORDER = ['Action', 'Racing', 'Sports', 'Strategy', 'Puzzle', 'Tabletop', 'Timing', 'Original'];

for (const group of WING_ORDER) {
  const games = CATALOG.filter(g => g.group === group);
  if (!games.length) continue;
  const meta = WING_METADATA[group];

  doc += `### <a id="wing-${WING_ORDER.indexOf(group) + 1}-${group.toLowerCase()}"></a>${meta.title} &nbsp;(${games.length} Cabinets)

<p align="center">
  <img src="${meta.mascot}" alt="${meta.title} Mascot" width="120" align="right">
  <b>${meta.subtitle}</b><br>
  <i>${meta.badge}</i><br>
  ${meta.desc}
</p>
<br clear="all">

| Game | Category | Gameplay Hook | Session | Direct Cabinet Link |
| :--- | :--- | :--- | :---: | :--- |
`;

  for (const g of games) {
    const playUrl = g.id === 'candy-drop' ? `${base}index.html` : `${base}games/${g.id}/index.html`;
    doc += `| [**${g.title}**](${playUrl}) | \`${g.category}\` | ${g.hook} | ${g.duration} | [**Play Now →**](${playUrl}) |\n`;
  }

  doc += '\n';
}

doc += `---

`;

// ==========================================
// 7. "INSERT COIN TO RUN" (LOCAL DEV & QUICKSTART)
// ==========================================
doc += `## 🪙 "Insert Coin to Run": Quickstart & Local Play

Candy Arcade is built from the ground up to require **zero compilation, zero transpilation, and zero build tools**. You can run the entire arcade directly off your local filesystem.

<p align="center">
  <a href="${base}arcade.html">
    <img src="assets/brand/insert-coin.svg" alt="Pulsing Insert Coin Neon Marquee" width="460">
  </a>
</p>

### 1. Direct Browser Launch (Zero Install)
Simply double-click \`arcade.html\` in your file explorer, or drag and drop \`arcade.html\` into any modern web browser (Chrome, Firefox, Safari, Edge). The entire arcade operates completely offline using relative asset paths!

### 2. Local HTTP Server
If you prefer running with a lightweight local web server for development or testing:

\`\`\`bash
# Option A: Built-in Node 22+ server (Zero npm dependencies!)
npm start
# -> Serving Candy Arcade at http://localhost:8321/arcade.html

# Option B: Python 3 instant server
python3 -m http.server 8321
# -> Visit http://localhost:8321/arcade.html
\`\`\`

### 3. Automated Verification & Quality Gate
The repository comes equipped with an industrial-grade verification harness that inspects rule determinism, puzzle solvability, storage isolation, and asset integrity:

\`\`\`bash
# Run all 381 unit and contract tests in Node.js
npm test

# Run repository link, asset, HTML, and catalog verification
node scripts/verify-all.cjs

# (Optional) Run Playwright browser smoke test suite on desktop & mobile viewports
npm run test:browser
\`\`\`

---

`;

// ==========================================
// 8. ARCHITECTURE & THE CABINET'S GUTS
// ==========================================
doc += `## ⚙️ Architecture: Inside the Cabinet's Guts

Candy Arcade is engineered as a masterclass in modern, dependency-free web systems. Here is how the runtime operates under the hood:

\`\`\`
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       BROWSER VIEWPORT / CANVAS                        │
   │               (Dynamic 16:10 Integer DPR Scaled Surface)               │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌────────────────────────────────┐           ┌────────────────────────────────┐
│        assets/arcade.js        │           │         assets/core.js         │
│  (Universal Cabinet Firmware)  │           │   (Nervous System & Catalog)   │
├────────────────────────────────┤           ├────────────────────────────────┤
│ • 60 FPS requestAnimationFrame │           │ • 100-Game Master Catalog      │
│ • Input Duality (Keys & Touch) │           │ • Mulberry32 Seeded PRNG       │
│ • Procedural Web Audio Synth   │           │ • UTC Midnight Daily Cycle     │
│ • cancelInput Gesture Safety   │           │ • Resilient Dual-Tier Storage  │
│ • Responsive Board Zoom (+/-)  │           │ • Schema Sanitization & Memory │
└────────────────────────────────┘           └────────────────────────────────┘
                                       │
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 games/<slug>/game.js (x100)                 │
        │               Independent Game Micro-Engines                │
        │       • Pure Canvas 2D Drawing   • Deterministic Rules      │
        │       • Isolated Local State     • Three-Tier Medals        │
        └─────────────────────────────────────────────────────────────┘
\`\`\`

### 1. The 960 × 600 Virtual Canvas Engine
Every game renders into a canonical **960 × 600 logical coordinate space** (a comfortable 16:10 widescreen proportion).
* **Deterministic DPR Bounding:** The engine queries \`window.devicePixelRatio\` and caps the backing store resolution at \`2.0\` to prevent GPU overheating and memory exhaustion on high-density Retina or 4K mobile displays.
* **Aspect Preservation:** The canvas automatically scales via CSS transform matrices, maintaining letterboxed or pillarboxed centering with zero distortion.
* **Focus View Cropping:** Board-focused titles define a \`focus: [x, y, w, h]\` viewport crop. Players can tap the \`+\` / \`−\` zoom button on dense boards to enlarge the interactive puzzle area on smaller phone screens without sacrificing control access.

### 2. The Deterministic PRNG & UTC Daily Synchronization
Procedural levels and shuffle algorithms avoid \`Math.random()\` entirely:
* **Mulberry32 Algorithm:** Implements a 32-bit stateful linear generator initialized via 32-bit FNV-1a hash strings.
* **Global Daily Seed:** The daily challenge seed is computed from \`dailySeedForDate(new Date())\` using ISO UTC format (\`YYYY-MM-DD\`). At exactly \`00:00:00 UTC\`, players across the entire planet automatically receive identical puzzle layouts, hazard patterns, and card decks.
* **Purity Guarantee:** Automated tests verify that rendering passes never advance the PRNG seed, guaranteeing reproducible simulations.

### 3. Universal Input Duality & The \`cancelInput\` Safety Valve
* **Simultaneous Pointer & Key Translation:** Arrow keys, WASD, touch taps, mouse clicks, and drag gestures map to identical action identifiers.
* **Interrupted Gesture Protection:** If a player drags to charge a golf putt or slingshot throw and drags off-screen or pauses mid-gesture, \`cancelInput\` cleanly discards the accumulated force, preventing accidental misfires.
* **Tab Visibility Protection:** Leaving the browser tab immediately pauses the game loop, mutes procedural audio, and flushes all held input states.

### 4. Zero-Byte Procedural Web Audio Chip
Rather than burdening users with dozens of audio asset HTTP requests, the cabinet includes an onboard polyphonic synthesizer powered by the native Web Audio API:
* **Waveform Synthesis:** Real-time generation of \`sine\`, \`triangle\`, \`square\`, \`sawtooth\`, and periodic white noise buffers.
* **Six Universal Sonic Profiles:** \`tap\`, \`coin\`, \`hit\`, \`powerup\`, \`win\`, and \`gameover\`.
* **Dynamic Pitch Modulation:** Frequencies dynamically scale with combo streaks and score multipliers for rich auditory tactile feedback.

### 5. Resilient Local Data Storage
Scores and achievements are safeguarded by a fault-tolerant storage adapter:
* **Dual-Tier Fallback:** If \`localStorage\` is blocked by private browsing mode or quota limits, the engine gracefully transitions to an in-memory session cache.
* **Sanitization Boundary:** Stored data is validated against catalog IDs to discard foreign or corrupted keys without crashing.

---

`;

// ==========================================
// 9. RETRO ARCADE ACHIEVEMENTS
// ==========================================
doc += `## 🏆 Retro Arcade Achievements

Test your mastery across the entire 100-cabinet floor to unlock all six legendary arcade achievement badges:

<p align="center">
  <img src="assets/brand/achievement-badges.svg" alt="Retro Arcade Achievement Trophy Case" width="840">
</p>

| Badge | Achievement Title | Qualification Criteria |
| :---: | :--- | :--- |
| <img src="assets/brand/badge-coin-hunter.svg" width="64"> | **Coin Hunter** | Play and complete a session on at least 10 different arcade cabinets in a single day. |
| <img src="assets/brand/badge-gold-medalist.svg" width="64"> | **Gold Medalist** | Surpass the Gold medal score threshold on any arcade cabinet. |
| <img src="assets/brand/badge-100-club.svg" width="64"> | **The 100 Club** | Explore and log a recorded run across all 100 cabinets in the collection. |
| <img src="assets/brand/badge-daily-champion.svg" width="64"> | **Daily Champion** | Achieve a personal best score on the rotating UTC Midnight Daily Challenge. |
| <img src="assets/brand/badge-speedrunner.svg" width="64"> | **Speedrunner** | Finish any timed course or puzzle cabinet in under 50% of par duration. |
| <img src="assets/brand/badge-pixel-perfect.svg" width="64"> | **Pixel Perfect** | Complete a full game session with zero damage, zero penalties, or a 100% combo rate. |

---

`;

// ==========================================
// 10. EASTER EGGS & CABINET SECRETS
// ==========================================
doc += `## 🕹️ Easter Eggs & Cabinet Secrets

True retro arcades always conceal hidden dip switches, secret button sequences, and legendary leaderboards. Candy Arcade is no exception:

### 🏆 Retro High Scores Hall of Fame

<p align="center">
  <img src="assets/brand/hall-of-fame.svg" alt="Retro CRT High Scores Hall of Fame" width="760">
</p>

### 🤫 The Secret Konami Code Protocol

<p align="center">
  <a href="${base}arcade.html">
    <img src="assets/brand/konami-cheat-card.svg" alt="Arcade Konami Cheat Protocol Card" width="720">
  </a>
</p>

On any keyboard, while browsing the collection hub or playing in a cabinet, enter the legendary sequence:

\`\`\`
   [ ↑ ]  [ ↑ ]  [ ↓ ]  [ ↓ ]  [ ← ]  [ → ]  [ ← ]  [ → ]  [ B ]  [ A ]
\`\`\`

**Cabinet Perks Unlocked:**
* 🌟 **Golden CRT Phosphor Glow:** Overrides the hub styling with high-voltage amber retro CRT scanlines.
* 🎆 **Cosmic Confetti Explosion:** Rains retro canvas pixel fireworks across the screen.
* 🍬 **Secret Hopper Soundboard:** Triggers retro sound chip arpeggios and unlocks developer easter egg remarks.

### 🛠️ Developer Inspection Mode
Append \`?test=1\` to any game URL (e.g. \`${base}games/sunset-sprint/index.html?test=1\`) to expose the hidden simulation test harness. This unlocks step-by-step frame ticking, collision boundary outlines, and automated rule inspection hooks used by the verification test suite.

---

`;

// ==========================================
// 11. "CONTINUE? 9... 8... 7..." RETRO FINALE
// ==========================================
doc += `## 👾 CONTINUE? 9... 8... 7...

\`\`\`
    ╔════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                ║
    ║   ██████╗  █████╗ ███╗   ███╗███████╗     ██████╗ ██╗   ██╗███████╗██████╗     ║
    ║  ██╔════╝ ██╔══██╗████╗ ████║██╔════╝    ██╔═══██╗██║   ██║██╔════╝██╔══██╗    ║
    ║  ██║  ███╗███████║██╔████╔██║█████╗      ██║   ██║██║   ██║█████╗  ██████╔╝    ║
    ║  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝      ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗    ║
    ║  ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗    ╚██████╔╝ ╚████╔╝ ███████╗██║  ██║    ║
    ║   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝     ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝    ║
    ║                                                                                ║
    ║                         C O N T I N U E  ?   9 ... 8 ... 7 ...                 ║
    ║                                                                                ║
    ║                 [ INSERT COIN TO KEEP THE ARCADE RUNNING FOREVER ]             ║
    ║                                                                                ║
    ╚════════════════════════════════════════════════════════════════════════════════╝
\`\`\`

<p align="center">
  <a href="${base}arcade.html"><b>🕹️ JUMP BACK TO THE ARCADE FLOOR →</b></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="docs/ABOUT.md"><b>📖 READ THE FULL DESIGN MANIFESTO →</b></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="docs/REPO_METADATA.md"><b>🏷️ VIEW REPO METADATA & TOPICS →</b></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="docs/game-api.md"><b>🛠️ CONTRIBUTE A 101ST CABINET →</b></a>
</p>

### 📚 Further Reading & Deep Dives
* [docs/ABOUT.md](docs/ABOUT.md) — The deep editorial history, zero-dependency manifesto, sound chip specs, and 30-year web artifact promise.
* [docs/REPO_METADATA.md](docs/REPO_METADATA.md) — Repository description, 22 curated GitHub topic tags, and brand manifesto.
* [docs/game-api.md](docs/game-api.md) — The complete developer contract for authoring and mounting new arcade cabinets.
* [portal.html](portal.html) — The interactive web audio soundboard, PRNG hasher, and lucky cabinet draw.

### 📜 Open Source License
This repository and its entire 100-cabinet game collection are open source and free for the world to explore, study, play, and enjoy. Built with ❤️ for the pure web platform.

<p align="center">
  <b>Candy Arcade © 2024–2026. Made with pure web standards. No cookies. No trackers. Just play.</b>
</p>
`;

fs.writeFileSync(path.join(rootDir, 'README.md'), doc, 'utf8');
console.log('Successfully generated award-winning README.md with all 100 games and brand assets!');
