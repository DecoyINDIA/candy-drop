'use strict';

const { getCommonDefs } = require('./svg-helpers.cjs');

/**
 * Builds individual retro achievement badge SVGs (180x180)
 * and the composite Achievement Badges showcase SVG (840x260).
 */

const badgesData = [
  {
    id: 'coin-hunter',
    title: 'COIN HUNTER',
    subtitle: '10,000 Arcade Coins',
    color: '#ffc700',
    accent: '#ff9000',
    iconSvg: `
      <!-- Treasure Chest with Coins -->
      <g transform="translate(90, 80)">
        <!-- Chest Base -->
        <rect x="-24" y="2" width="48" height="26" rx="4" fill="#6d3916" stroke="#ffc700" stroke-width="2"/>
        <rect x="-20" y="6" width="40" height="18" rx="2" fill="#422008"/>
        <!-- Chest Lid (open) -->
        <path d="M -26 2 Q 0 -18 26 2 Z" fill="#8b4a1e" stroke="#ffc700" stroke-width="2"/>
        <!-- Gold Coins Overflowing -->
        <circle cx="-10" cy="0" r="7" fill="#ffea60" stroke="#d48800" stroke-width="1.2"/>
        <circle cx="8" cy="-2" r="8" fill="#ffd200" stroke="#b87800" stroke-width="1.2"/>
        <circle cx="-1" cy="-6" r="7.5" fill="#fff080" stroke="#d48800" stroke-width="1.2"/>
        <circle cx="15" cy="4" r="6" fill="#ffc700" stroke="#996000" stroke-width="1.2"/>
        <circle cx="-16" cy="4" r="6.5" fill="#ffd200" stroke="#b87800" stroke-width="1.2"/>
        <!-- Sparkles -->
        <polygon points="0,-18 3,-12 9,-12 4,-8 6,-2 0,-6 -6,-2 -4,-8 -9,-12 -3,-12" fill="#ffffff"/>
        <circle cx="-18" cy="-12" r="1.8" fill="#ffffff"/>
        <circle cx="20" cy="-10" r="1.8" fill="#ffffff"/>
      </g>
    `
  },
  {
    id: 'gold-medalist',
    title: 'GOLD MEDALIST',
    subtitle: '25 Gold Trophies',
    color: '#ffd200',
    accent: '#ff0055',
    iconSvg: `
      <!-- Laurel Wreath & Gold Star Medal -->
      <g transform="translate(90, 80)">
        <!-- Ribbon -->
        <polygon points="-10,-32 0,-18 -10,12" fill="#b81d3d"/>
        <polygon points="10,-32 0,-18 10,12" fill="#e62e54"/>
        <!-- Laurel Wreath -->
        <path d="M -26 12 C -36 -10 -20 -30 0 -30 C 20 -30 36 -10 26 12" fill="none" stroke="#00e575" stroke-width="3" stroke-dasharray="4 3"/>
        <!-- Medal Disc -->
        <circle cx="0" cy="0" r="22" fill="#ffc700" stroke="#8a5500" stroke-width="2"/>
        <circle cx="0" cy="0" r="18" fill="#ffe066" stroke="#ffc700" stroke-width="1"/>
        <!-- 5-Point Star -->
        <polygon points="0,-12 4,-3 13,-3 6,3 9,12 0,6 -9,12 -6,3 -13,-3 -4,-3" fill="#ffffff"/>
      </g>
    `
  },
  {
    id: '100-club',
    title: '100 CLUB',
    subtitle: 'Completed All 100 Games',
    color: '#00f0ff',
    accent: '#00e575',
    iconSvg: `
      <!-- Heavy Hexagonal Token with 100 -->
      <g transform="translate(90, 80)">
        <!-- Hexagon -->
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="#0c1626" stroke="#00f0ff" stroke-width="3"/>
        <polygon points="0,-23 20,-11 20,11 0,23 -20,11 -20,-11" fill="#13243c" stroke="#00e575" stroke-width="1.5"/>
        <!-- Bold 100 -->
        <text x="0" y="8" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="1">100</text>
        <!-- Star beneath -->
        <text x="0" y="19" font-family="'Courier New', monospace" font-size="8" font-weight="bold" text-anchor="middle" fill="#00f0ff">★ ★ ★</text>
      </g>
    `
  },
  {
    id: 'daily-champion',
    title: 'DAILY CHAMPION',
    subtitle: 'Rank #1 Daily Seed',
    color: '#ff9900',
    accent: '#ffe600',
    iconSvg: `
      <!-- Sunburst & Championship Trophy -->
      <g transform="translate(90, 80)">
        <!-- Sunburst Rays -->
        <circle cx="0" cy="-2" r="24" fill="none" stroke="#ffe600" stroke-width="2" stroke-dasharray="3 4"/>
        <!-- Trophy Cup -->
        <path d="M -16 -18 L 16 -18 L 12 4 Q 0 14 -12 4 Z" fill="#ffc700" stroke="#8a5500" stroke-width="1.5"/>
        <!-- Handles -->
        <path d="M -16 -14 C -26 -14 -24 0 -12 2" fill="none" stroke="#ffc700" stroke-width="2"/>
        <path d="M 16 -14 C 26 -14 24 0 12 2" fill="none" stroke="#ffc700" stroke-width="2"/>
        <!-- Stem & Base -->
        <rect x="-3" y="12" width="6" height="8" fill="#d48800"/>
        <rect x="-12" y="20" width="24" height="6" rx="2" fill="#6d3916" stroke="#ffc700" stroke-width="1"/>
        <!-- Star on cup -->
        <polygon points="0,-10 2,-4 8,-4 3,0 5,6 0,2 -5,6 -3,0 -8,-4 -2,-4" fill="#ffffff"/>
      </g>
    `
  },
  {
    id: 'speedrunner',
    title: 'SPEEDRUNNER',
    subtitle: 'Sub-60s Speed Clear',
    color: '#00f0ff',
    accent: '#ff0077',
    iconSvg: `
      <!-- Winged Stopwatch & Lightning -->
      <g transform="translate(90, 80)">
        <!-- Left Wing -->
        <path d="M -14 -4 C -34 -20 -38 10 -18 12" fill="#182c44" stroke="#00f0ff" stroke-width="1.5"/>
        <!-- Right Wing -->
        <path d="M 14 -4 C 34 -20 38 10 18 12" fill="#182c44" stroke="#00f0ff" stroke-width="1.5"/>
        <!-- Stopwatch Body -->
        <circle cx="0" cy="4" r="18" fill="#101828" stroke="#00f0ff" stroke-width="2"/>
        <!-- Top Crown Pin -->
        <rect x="-3" y="-18" width="6" height="5" fill="#a0b8d0"/>
        <!-- Clock Face -->
        <circle cx="0" cy="4" r="14" fill="#080e18"/>
        <!-- Lightning hand -->
        <polyline points="0,4 3,-2 0,-2 2,-8" fill="none" stroke="#ffe600" stroke-width="2"/>
        <!-- Sonic boom rings -->
        <circle cx="0" cy="4" r="22" fill="none" stroke="#ff0077" stroke-width="1" stroke-dasharray="2 4"/>
      </g>
    `
  },
  {
    id: 'pixel-perfect',
    title: 'PIXEL PERFECT',
    subtitle: '100% Accuracy Rating',
    color: '#d600ff',
    accent: '#00f0ff',
    iconSvg: `
      <!-- Prismatic Gem with Crosshairs -->
      <g transform="translate(90, 80)">
        <!-- Targeting Crosshair Rings -->
        <circle cx="0" cy="0" r="25" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="-28" y1="0" x2="-20" y2="0" stroke="#00f0ff" stroke-width="2"/>
        <line x1="20" y1="0" x2="28" y2="0" stroke="#00f0ff" stroke-width="2"/>
        <line x1="0" y1="-28" x2="0" y2="-20" stroke="#00f0ff" stroke-width="2"/>
        <line x1="0" y1="20" x2="0" y2="28" stroke="#00f0ff" stroke-width="2"/>
        <!-- Prismatic Diamond Gem -->
        <polygon points="0,-18 18,-4 0,18 -18,-4" fill="#a000e0" stroke="#ff77ff" stroke-width="2"/>
        <polygon points="0,-18 10,-4 0,18" fill="#c020ff"/>
        <polygon points="0,-18 0,18 -10,-4" fill="#8000b0"/>
        <!-- Specular Star Sparkle -->
        <circle cx="0" cy="-4" r="3" fill="#ffffff"/>
      </g>
    `
  }
];

// Builds an individual 180x180 badge SVG
function buildSingleBadgeSvg(badge) {
  const defs = getCommonDefs();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="100%" height="100%">
  ${defs}

  <!-- Outer Rounded Shield -->
  <rect x="6" y="6" width="168" height="168" rx="16" fill="url(#bg-synthwave)" stroke="#221838" stroke-width="2"/>
  <rect x="10" y="10" width="160" height="160" rx="12" fill="none" stroke="${badge.color}" stroke-width="1.8" opacity="0.85"/>

  <!-- Glowing Emblem Base -->
  <circle cx="90" cy="80" r="42" fill="#0d1422" stroke="${badge.color}" stroke-width="2"/>
  <circle cx="90" cy="80" r="36" fill="${badge.color}" opacity="0.12" filter="blur(4px)"/>

  <!-- Icon Graphic -->
  ${badge.iconSvg}

  <!-- Title Pill -->
  <g transform="translate(90, 142)">
    <rect x="-65" y="-10" width="130" height="20" rx="10" fill="#0c101c" stroke="${badge.color}" stroke-width="1.2"/>
    <text x="0" y="4" font-family="'Courier New', monospace" font-size="9" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="1">${badge.title}</text>
  </g>

  <!-- Subtitle -->
  <text x="90" y="162" font-family="'Arial', sans-serif" font-size="7.5" font-weight="bold" text-anchor="middle" fill="${badge.accent}">${badge.subtitle}</text>
</svg>
`;
}

// Builds the Composite Achievement Badges Rack (840x260)
function buildAchievementBadgesRackSvg() {
  const defs = getCommonDefs();

  const badgesRowSvg = badgesData.map((b, i) => {
    // 6 badges across 840px. Spacing = 132px. Center offset: 40 + i * 132.
    const x = 30 + i * 132;
    const y = 85;
    return `
      <!-- Badge ${i + 1}: ${b.id} -->
      <g transform="translate(${x}, ${y})">
        <!-- Shield Background -->
        <rect x="0" y="0" width="124" height="145" rx="12" fill="#0d121f" stroke="${b.color}" stroke-width="1.5"/>
        <rect x="4" y="4" width="116" height="137" rx="8" fill="#141a29"/>

        <!-- Circular Icon Well -->
        <circle cx="62" cy="52" r="32" fill="#0b0f18" stroke="${b.color}" stroke-width="1.5"/>
        <!-- Mini Icon -->
        <g transform="translate(-28, -28)">
          ${b.iconSvg}
        </g>

        <!-- Brass Nameplate -->
        <rect x="10" y="96" width="104" height="18" rx="4" fill="#0c101a" stroke="${b.color}" stroke-width="1"/>
        <text x="62" y="108" font-family="'Courier New', monospace" font-size="8" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="0.5">${b.title}</text>

        <!-- Condition string -->
        <text x="62" y="125" font-family="'Arial', sans-serif" font-size="7" font-weight="bold" text-anchor="middle" fill="${b.accent}">${b.subtitle}</text>
      </g>
    `;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 260" width="100%" height="100%">
  ${defs}

  <!-- Trophy Rack Background -->
  <rect x="0" y="0" width="840" height="260" fill="url(#bg-synthwave)" rx="16"/>

  <!-- Border & Neon Trim -->
  <rect x="10" y="10" width="820" height="240" rx="12" fill="none" stroke="#251a3d" stroke-width="2"/>
  <rect x="14" y="14" width="812" height="232" rx="8" fill="none" stroke="#ffe600" stroke-width="1.5" stroke-dasharray="12 8" opacity="0.75"/>

  <!-- Header Banner -->
  <g transform="translate(420, 42)">
    <rect x="-220" y="-16" width="440" height="32" rx="16" fill="#0d111d" stroke="#ffe600" stroke-width="1.8"/>
    <text x="0" y="5" font-family="'Courier New', monospace" font-size="12" font-weight="900" text-anchor="middle" fill="#ffe600" letter-spacing="2.5">
      ★ ARCADE TROPHY ROOM // ACHIEVEMENTS ★
    </text>
  </g>
  <text x="420" y="74" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#8899aa">
    Earn retro achievements across all 100 dependency-free browser games!
  </text>

  <!-- Badges Row -->
  ${badgesRowSvg}
</svg>
`;
}

module.exports = {
  badgesData,
  buildSingleBadgeSvg,
  buildAchievementBadgesRackSvg
};
