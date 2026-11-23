'use strict';

const { getCommonDefs, renderSpriteToSvg } = require('./svg-helpers.cjs');
const {
  ninjaSprite,
  racerSprite,
  strikerSprite,
  mechSprite,
  alchemistSprite,
  kingSprite,
  djSprite,
  hopperSprite
} = require('./pixel-art-data.cjs');

/**
 * Builds individual showcase cards for each of the 8 genre mascots
 * and the grand Mascots Lineup banner (960x360).
 */

const mascotData = [
  {
    id: 'neon-ninja',
    name: 'NEON NINJA',
    wing: 'WING 1: ACTION &amp; BRAWLERS',
    title: 'Cyber Shinobi of Neo-Tokyo',
    lore: 'Master of high-speed reflex combat, wall jumps, and twin energy katanas.',
    themeColor: '#00f0ff',
    glowFilter: 'glow-cyan',
    sprite: ninjaSprite,
    stats: { speed: 95, power: 85, precision: 98, wit: 78 }
  },
  {
    id: 'velocity-racer',
    name: 'VELOCITY RACER',
    wing: 'WING 2: SPEED &amp; RACING',
    title: 'Apex Drift Pilot',
    lore: 'Tears up neon highways with twin-turbo nitrous and supersonic apex cornering.',
    themeColor: '#ff0066',
    glowFilter: 'glow-magenta',
    sprite: racerSprite,
    stats: { speed: 99, power: 88, precision: 92, wit: 75 }
  },
  {
    id: 'pixel-striker',
    name: 'PIXEL STRIKER',
    wing: 'WING 3: SPORTS &amp; ATHLETICS',
    title: 'Grand Champion Striker #10',
    lore: 'Electric bicycle kicks, curve-shot volleys, and unstoppable stadium momentum.',
    themeColor: '#00e575',
    glowFilter: 'glow-cyan',
    sprite: strikerSprite,
    stats: { speed: 90, power: 94, precision: 90, wit: 80 }
  },
  {
    id: 'orbital-mech',
    name: 'ORBITAL MECH',
    wing: 'WING 4: TACTICS &amp; STRATEGY',
    title: 'Titan Vanguard Defense Unit',
    lore: 'Hexagonal force fields, laser turrets, and orbital grid area denial.',
    themeColor: '#ff7700',
    glowFilter: 'glow-gold',
    sprite: mechSprite,
    stats: { speed: 65, power: 98, precision: 88, wit: 95 }
  },
  {
    id: 'quantum-alchemist',
    name: 'QUANTUM ALCHEMIST',
    wing: 'WING 5: LOGIC &amp; PUZZLES',
    title: 'Grand Transmuter of Runes',
    lore: 'Bends probabilities, swaps elemental matter, and decodes cosmic glyphs.',
    themeColor: '#d600ff',
    glowFilter: 'glow-magenta',
    sprite: alchemistSprite,
    stats: { speed: 70, power: 82, precision: 96, wit: 100 }
  },
  {
    id: 'pixel-king',
    name: 'PIXEL KING',
    wing: 'WING 6: TABLETOP &amp; CLASSICS',
    title: 'Sovereign of the Checkered Throne',
    lore: 'Grandmaster strategist of chessboards, dice rolls, and classic parlor games.',
    themeColor: '#ffe600',
    glowFilter: 'glow-gold',
    sprite: kingSprite,
    stats: { speed: 60, power: 80, precision: 95, wit: 99 }
  },
  {
    id: 'beat-master',
    name: 'BEAT MASTER',
    wing: 'WING 7: RHYTHM &amp; TIMING',
    title: 'Vinyl Synesthete &amp; BPM Overlord',
    lore: 'Synchronizes 180 BPM drum tracks, laser lightshows, and rhythm combo chains.',
    themeColor: '#00e5ff',
    glowFilter: 'glow-cyan',
    sprite: djSprite,
    stats: { speed: 92, power: 75, precision: 99, wit: 88 }
  },
  {
    id: 'sweet-hopper',
    name: 'SWEET HOPPER',
    wing: 'WING 8: ARCADE ORIGINALS',
    title: 'Founding Gummy Mascot of Candy Drop',
    lore: 'Bouncy, cheerful, and loves hopping over gumdrops and star-shaped candies.',
    themeColor: '#ff4088',
    glowFilter: 'glow-magenta',
    sprite: hopperSprite,
    stats: { speed: 85, power: 78, precision: 88, wit: 92 }
  }
];

function buildStatBar(label, value, color, y) {
  const barWidth = 140;
  const filledWidth = Math.round((value / 100) * barWidth);
  return `
    <g transform="translate(180, ${y})">
      <text x="-70" y="4" font-family="'Courier New', monospace" font-size="9" font-weight="bold" fill="#8899aa" text-anchor="end">${label}</text>
      <!-- Background track -->
      <rect x="-60" y="-5" width="${barWidth}" height="10" rx="3" fill="#131826" stroke="#253045" stroke-width="1"/>
      <!-- Filled bar -->
      <rect x="-60" y="-5" width="${filledWidth}" height="10" rx="3" fill="${color}"/>
      <!-- Value text -->
      <text x="${barWidth - 52}" y="4" font-family="'Courier New', monospace" font-size="9" font-weight="900" fill="#ffffff">${value}</text>
    </g>
  `;
}

// Builds individual mascot showcase card SVG (360x420)
function buildMascotCardSvg(mascot) {
  const defs = getCommonDefs();
  // Center sprite: 32 pixels wide * 5 scale = 160px width. Center at (360 - 160)/2 = 100.
  const spriteSvg = renderSpriteToSvg(mascot.sprite, 100, 75, 5);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 420" width="100%" height="100%">
  ${defs}

  <!-- Card Background -->
  <rect x="0" y="0" width="360" height="420" fill="url(#bg-synthwave)" rx="14"/>

  <!-- Card Outer Neon Border -->
  <rect x="8" y="8" width="344" height="404" rx="10" fill="none" stroke="${mascot.themeColor}" stroke-width="2" opacity="0.85"/>
  <rect x="12" y="12" width="336" height="396" rx="8" fill="none" stroke="#221838" stroke-width="1.5"/>

  <!-- Top Genre Wing Chip -->
  <g transform="translate(180, 36)">
    <rect x="-130" y="-12" width="260" height="24" rx="12" fill="#0c0e18" stroke="${mascot.themeColor}" stroke-width="1.5"/>
    <text x="0" y="4" font-family="'Courier New', monospace" font-size="10" font-weight="900" text-anchor="middle" fill="${mascot.themeColor}" letter-spacing="1.5">${mascot.wing}</text>
  </g>

  <!-- Pedestal Platform & Glow -->
  <ellipse cx="180" cy="232" rx="72" ry="16" fill="${mascot.themeColor}" opacity="0.25" filter="blur(6px)"/>
  <ellipse cx="180" cy="230" rx="60" ry="12" fill="#0d1422" stroke="${mascot.themeColor}" stroke-width="1.5"/>

  <!-- Pixel Sprite -->
  <g filter="drop-shadow(0 6px 12px #000000)">
    ${spriteSvg}
  </g>

  <!-- Mascot Title & Name -->
  <text x="180" y="270" font-family="'Impact', 'Arial Black', sans-serif" font-size="24" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="2">${mascot.name}</text>
  <text x="180" y="286" font-family="'Courier New', monospace" font-size="10" font-weight="bold" text-anchor="middle" fill="${mascot.themeColor}" letter-spacing="1">${mascot.title}</text>

  <!-- Lore / Hook -->
  <text x="180" y="306" font-family="'Arial', sans-serif" font-size="9.5" text-anchor="middle" fill="#a0b0c4">
    ${mascot.lore}
  </text>

  <!-- Divider Line -->
  <line x1="40" y1="324" x2="320" y2="324" stroke="#253045" stroke-width="1"/>

  <!-- Stat Meters -->
  ${buildStatBar('SPEED', mascot.stats.speed, mascot.themeColor, 342)}
  ${buildStatBar('POWER', mascot.stats.power, mascot.themeColor, 359)}
  ${buildStatBar('PRECISION', mascot.stats.precision, mascot.themeColor, 376)}
  ${buildStatBar('WIT', mascot.stats.wit, mascot.themeColor, 393)}
</svg>
`;
}

// Builds the Panoramic Mascots Lineup Banner SVG (960x360)
function buildMascotsLineupSvg() {
  const defs = getCommonDefs();

  // Render all 8 mascots in a row across 960px width
  const mascotSprites = mascotData.map((m, idx) => {
    // 8 mascots: spacing = 110px. Start at x = 40.
    const x = 32 + idx * 112;
    const y = 130;
    // Sprite 32x32 scaled by 2.8 = 90x90px
    const svgSprite = renderSpriteToSvg(m.sprite, x, y, 2.8);
    const podiumX = x + 45;
    return `
      <!-- Mascot ${m.id} -->
      <g>
        <!-- Floor Glow -->
        <ellipse cx="${podiumX}" cy="${y + 92}" rx="38" ry="10" fill="${m.themeColor}" opacity="0.22" filter="blur(4px)"/>
        <!-- Podium pedestal -->
        <ellipse cx="${podiumX}" cy="${y + 90}" rx="32" ry="8" fill="#101524" stroke="${m.themeColor}" stroke-width="1.2"/>
        <!-- Sprite -->
        ${svgSprite}
        <!-- Name Label -->
        <text x="${podiumX}" y="${y + 115}" font-family="'Courier New', monospace" font-size="8.5" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="1">${m.name.split(' ')[0]}</text>
        <text x="${podiumX}" y="${y + 126}" font-family="'Arial', sans-serif" font-size="7.5" font-weight="bold" text-anchor="middle" fill="${m.themeColor}">WING ${idx + 1}</text>
      </g>
    `;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 360" width="100%" height="100%">
  ${defs}

  <!-- Background -->
  <rect x="0" y="0" width="960" height="360" fill="url(#bg-synthwave)" rx="16"/>

  <!-- Perspective Horizon Grid -->
  <g opacity="0.32">
    ${Array.from({ length: 18 }, (_, i) => {
      const x = i * 60 - 30;
      return `<line x1="${x}" y1="360" x2="${480 + (i - 8) * 26}" y2="230" stroke="#ff00aa" stroke-width="1"/>`;
    }).join('')}
    <line x1="0" y1="240" x2="960" y2="240" stroke="#00f0ff" stroke-width="1"/>
    <line x1="0" y1="270" x2="960" y2="270" stroke="#00f0ff" stroke-width="1.4"/>
    <line x1="0" y1="315" x2="960" y2="315" stroke="#00f0ff" stroke-width="1.8"/>
  </g>

  <!-- Border & Neon Trim -->
  <rect x="14" y="14" width="932" height="332" rx="12" fill="none" stroke="#2b1a45" stroke-width="2"/>
  <rect x="20" y="20" width="920" height="320" rx="8" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="14 10" opacity="0.75"/>

  <!-- Header Banner -->
  <g transform="translate(480, 52)">
    <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#0d101e" stroke="#ff0077" stroke-width="2"/>
    <text x="0" y="6" font-family="'Courier New', monospace" font-size="13" font-weight="900" text-anchor="middle" fill="#ff0077" letter-spacing="3">★ ARCADE UNIVERSE ALL-STARS ★</text>
  </g>

  <text x="480" y="106" font-family="'Impact', 'Arial Black', sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="3">
    THE 8 GENRE MASCOTS OF CANDY ARCADE
  </text>
  <text x="480" y="125" font-family="'Courier New', monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffe600" letter-spacing="2">
    100 ORIGINAL TITLES • 8 CURATED WINGS • ENDLESS ACTION
  </text>

  <!-- Mascot Sprites Row -->
  ${mascotSprites}

  <!-- Bottom Strip -->
  <g transform="translate(480, 316)">
    <rect x="-260" y="-14" width="520" height="26" rx="13" fill="#0b0e18" stroke="#ffe600" stroke-width="1.5"/>
    <text x="0" y="4" font-family="'Courier New', monospace" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#ffe600" letter-spacing="2">CHOOSE YOUR FIGHTER • CLICK ANY GAME TO PLAY INSTANTLY</text>
  </g>
</svg>
`;
}

module.exports = {
  mascotData,
  buildMascotCardSvg,
  buildMascotsLineupSvg
};
