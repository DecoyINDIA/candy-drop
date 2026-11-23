'use strict';

const { getCommonDefs, renderSpriteToSvg } = require('./svg-helpers.cjs');
const { ninjaSprite, hopperSprite, racerSprite, mechSprite, coinFrames } = require('./pixel-art-data.cjs');
const { GifWriter } = require('./gif-encoder.cjs');

/**
 * Builds the Animated Arcade Cabinet Hero (SVG + GIF),
 * the Main Candy Arcade Banner (SVG + GIF),
 * and the 1280x640 Social Preview Card (SVG).
 */

// Helper to generate animated arcade screen contents (spaceship shooting lasers)
function getScreenFrameSvg(frameIndex) {
  const stars = [
    [20, 30], [50, 80], [90, 40], [130, 70], [170, 25], [210, 85], [250, 45],
    [35, 110], [75, 140], [115, 105], [155, 130], [195, 115], [235, 145],
    [30, 60], [80, 20], [140, 50], [200, 30], [240, 75]
  ];

  // Moving stars based on frame
  const starElements = stars.map(([sx, sy], i) => {
    const y = (sy + frameIndex * 12) % 170 + 10;
    const opacity = ((i % 3) + 1) * 0.25;
    return `<circle cx="${sx}" cy="${y}" r="1.5" fill="#ffffff" opacity="${opacity}"/>`;
  }).join('');

  // Player ship at bottom center
  const shipX = 135 + Math.sin(frameIndex * 0.8) * 20;
  const shipY = 145;
  const shipSvg = `
    <!-- Player Starfighter -->
    <g transform="translate(${shipX}, ${shipY})">
      <polygon points="0,-14 -10,8 10,8" fill="#00f0ff"/>
      <polygon points="0,-10 -6,6 6,6" fill="#ffffff"/>
      <rect x="-3" y="8" width="6" height="${4 + (frameIndex % 2) * 4}" fill="#ff0055"/>
      <!-- Laser bolts -->
      <line x1="-8" y1="-18" x2="-8" y2="-30" stroke="#00f0ff" stroke-width="2.5"/>
      <line x1="8" y1="-18" x2="8" y2="-30" stroke="#00f0ff" stroke-width="2.5"/>
    </g>
  `;

  // Alien invader saucers
  const alien1X = 70 + (frameIndex * 8) % 140;
  const alien1Y = 45;
  const alien2X = 200 - (frameIndex * 8) % 140;
  const alien2Y = 70;

  const aliensSvg = `
    <!-- Alien 1 -->
    <g transform="translate(${alien1X}, ${alien1Y})">
      <ellipse cx="0" cy="0" rx="14" ry="7" fill="#ff3388"/>
      <circle cx="0" cy="-4" r="5" fill="#ffd200"/>
      <circle cx="-5" cy="0" r="1.8" fill="#ffffff"/>
      <circle cx="0" cy="0" r="1.8" fill="#ffffff"/>
      <circle cx="5" cy="0" r="1.8" fill="#ffffff"/>
    </g>
    <!-- Alien 2 -->
    <g transform="translate(${alien2X}, ${alien2Y})">
      <ellipse cx="0" cy="0" rx="12" ry="6" fill="#00e575"/>
      <circle cx="0" cy="-3" r="4" fill="#00f0ff"/>
      <circle cx="-4" cy="0" r="1.5" fill="#ffffff"/>
      <circle cx="0" cy="0" r="1.5" fill="#ffffff"/>
      <circle cx="4" cy="0" r="1.5" fill="#ffffff"/>
    </g>
  `;

  // HUD text
  const hudSvg = `
    <text x="15" y="22" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#00f0ff" letter-spacing="1">1UP: ${12400 + frameIndex * 150}</text>
    <text x="190" y="22" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#ff3388" letter-spacing="1">HIGH: 99990</text>
  `;

  return starElements + shipSvg + aliensSvg + hudSvg;
}

// 1. ARCADE CABINET HERO (SVG with CSS animations)
function buildArcadeCabinetSvg() {
  const defs = getCommonDefs();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 560" width="100%" height="100%">
  ${defs}
  <style>
    @keyframes marqueeFlicker {
      0%, 100% { opacity: 1; filter: drop-shadow(0 0 12px #ff0077) drop-shadow(0 0 24px #ff0077); }
      50% { opacity: 0.88; filter: drop-shadow(0 0 6px #ff0077) drop-shadow(0 0 14px #ff0077); }
    }
    @keyframes bulbPulse {
      0%, 100% { opacity: 0.95; }
      50% { opacity: 0.35; }
    }
    @keyframes screenFlicker {
      0%, 100% { opacity: 0.98; }
      50% { opacity: 0.94; }
    }
    @keyframes coinSlotGlow {
      0%, 100% { filter: drop-shadow(0 0 4px #ff2200); }
      50% { filter: drop-shadow(0 0 10px #ff5500); }
    }
    .marquee-glow { animation: marqueeFlicker 2.8s ease-in-out infinite; }
    .bulb-a { animation: bulbPulse 1.2s infinite; }
    .bulb-b { animation: bulbPulse 1.2s infinite 0.6s; }
    .crt-screen { animation: screenFlicker 0.15s infinite; }
    .coin-glow { animation: coinSlotGlow 1.8s ease-in-out infinite; }
  </style>

  <!-- Ground Shadow & Floor Reflection -->
  <ellipse cx="320" cy="528" rx="210" ry="24" fill="#03050c" opacity="0.8"/>
  <ellipse cx="320" cy="522" rx="170" ry="14" fill="#ff0066" opacity="0.12" filter="blur(8px)"/>
  <ellipse cx="320" cy="520" rx="140" ry="10" fill="#00f0ff" opacity="0.10" filter="blur(6px)"/>

  <!-- Cabinet Main Body Shell -->
  <g filter="url(#cabinet-shadow)">
    <!-- Outer Side wings -->
    <polygon points="170,40 470,40 515,100 515,480 480,515 160,515 125,480 125,100" fill="#0d1117" stroke="#303b4f" stroke-width="3"/>

    <!-- Cabinet Profile Chamfer & Trim -->
    <!-- Left outer wing decal -->
    <polygon points="125,100 170,40 175,510 135,480" fill="#141a24"/>
    <path d="M 135 120 L 165 65 L 168 470 L 140 460 Z" fill="#ff0066" opacity="0.85"/>
    <path d="M 142 140 L 162 90 L 165 440 L 146 430 Z" fill="#00f0ff" opacity="0.85"/>

    <!-- Right outer wing decal -->
    <polygon points="470,40 515,100 505,480 465,510" fill="#141a24"/>
    <path d="M 505 120 L 475 65 L 472 470 L 500 460 Z" fill="#ff0066" opacity="0.85"/>
    <path d="M 498 140 L 478 90 L 475 440 L 494 430 Z" fill="#00f0ff" opacity="0.85"/>

    <!-- Front Center Section -->
    <rect x="172" y="44" width="296" height="466" fill="url(#cabinet-body)" rx="4"/>

    <!-- 1. TOP MARQUEE HOOD -->
    <!-- Marquee Housing Outer -->
    <polygon points="168,40 472,40 482,126 158,126" fill="#0f141d" stroke="#2a3547" stroke-width="2"/>
    <rect x="176" y="48" width="288" height="70" rx="6" fill="#06090e" stroke="#ffe600" stroke-width="2.5"/>

    <!-- Chasing Marquee Bulbs Top & Bottom -->
    <!-- Top row bulbs -->
    ${Array.from({ length: 18 }, (_, i) => {
      const bx = 186 + i * 16;
      const cls = i % 2 === 0 ? 'bulb-a' : 'bulb-b';
      const col = i % 3 === 0 ? '#ff0066' : (i % 3 === 1 ? '#00f0ff' : '#ffe600');
      return `<circle cx="${bx}" cy="54" r="3.2" fill="${col}" class="${cls}"/>`;
    }).join('')}
    <!-- Bottom row bulbs -->
    ${Array.from({ length: 18 }, (_, i) => {
      const bx = 186 + i * 16;
      const cls = i % 2 === 0 ? 'bulb-b' : 'bulb-a';
      const col = i % 3 === 0 ? '#00f0ff' : (i % 3 === 1 ? '#ffe600' : '#ff0066');
      return `<circle cx="${bx}" cy="112" r="3.2" fill="${col}" class="${cls}"/>`;
    }).join('')}

    <!-- Marquee Acrylic Backlit Sign -->
    <rect x="184" y="62" width="272" height="42" rx="4" fill="#150826"/>
    <g class="marquee-glow">
      <text x="320" y="86" font-family="'Impact', 'Arial Black', sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#ffffff" letter-spacing="3" stroke="#ff0077" stroke-width="1.2">★ CANDY ARCADE ★</text>
      <text x="320" y="99" font-family="'Courier New', monospace" font-size="8.5" font-weight="900" text-anchor="middle" fill="#00f0ff" letter-spacing="2">100 GAMES • ZERO DEPS • 60 FPS</text>
    </g>

    <!-- 2. CRT MONITOR SECTION -->
    <!-- Recessed Bezel -->
    <polygon points="160,126 480,126 466,336 174,336" fill="url(#cabinet-screen-bezel)" stroke="#1a2332" stroke-width="2"/>
    <rect x="180" y="136" width="280" height="190" rx="14" fill="#060c14" stroke="#2d3b4e" stroke-width="3"/>

    <!-- CRT Screen Glass -->
    <g class="crt-screen">
      <rect x="186" y="142" width="268" height="178" rx="10" fill="url(#screen-crt-glow)"/>

      <!-- Inner Game Screen Content -->
      <g transform="translate(186, 142)">
        <clipPath id="screen-clip">
          <rect x="0" y="0" width="268" height="178" rx="10"/>
        </clipPath>
        <g clip-path="url(#screen-clip)">
          <!-- Dynamic Space Shooter Scene -->
          ${getScreenFrameSvg(3)}
          <!-- Scanline overlay -->
          <rect x="0" y="0" width="268" height="178" fill="url(#crt-scanlines)"/>
          <!-- Curved Glass Reflection -->
          <path d="M 10 10 Q 134 40 258 10 L 258 45 Q 134 75 10 45 Z" fill="#ffffff" opacity="0.08"/>
        </g>
      </g>
    </g>

    <!-- Bezel Instruction Badge -->
    <rect x="250" y="324" width="140" height="10" rx="3" fill="#111823"/>
    <text x="320" y="332" font-family="'Courier New', monospace" font-size="7" font-weight="bold" text-anchor="middle" fill="#8899aa">INSERT COIN TO PLAY</text>

    <!-- 3. CONTROL PANEL SECTION -->
    <!-- Cantilevered Control Panel Deck (Isometric slope) -->
    <polygon points="146,336 494,336 508,396 132,396" fill="#1b2434" stroke="#3d4d68" stroke-width="2.5"/>
    <!-- Panel Diamond Plate / Texture -->
    <polygon points="152,340 488,340 502,392 138,392" fill="#141c28"/>

    <!-- Neon racing stripes on control panel -->
    <line x1="144" y1="344" x2="496" y2="344" stroke="#00f0ff" stroke-width="2" opacity="0.8"/>
    <line x1="140" y1="388" x2="500" y2="388" stroke="#ff0066" stroke-width="2" opacity="0.8"/>

    <!-- Player 1 Controls (Left) -->
    <!-- 1P Start Button -->
    <circle cx="210" cy="354" r="6" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <text x="210" y="346" font-family="'Arial', sans-serif" font-size="6.5" font-weight="bold" text-anchor="middle" fill="#ffffff">1P</text>
    <!-- 1P Joystick (Red Ball Top) -->
    <ellipse cx="230" cy="376" rx="14" ry="7" fill="#080c12" stroke="#222c3d" stroke-width="1.5"/>
    <rect x="228" y="358" width="4" height="14" fill="#a0b0c0"/>
    <circle cx="230" cy="356" r="11" fill="#ff1144" stroke="#770011" stroke-width="1.5" filter="drop-shadow(0 2px 4px #000000)"/>
    <circle cx="227" cy="352" r="3" fill="#ff88aa" opacity="0.8"/>
    <!-- 1P Action Buttons (6 in 2x3 curved layout) -->
    <circle cx="264" cy="364" r="6.5" fill="#00f0ff" stroke="#006688" stroke-width="1.2"/>
    <circle cx="280" cy="362" r="6.5" fill="#ff0066" stroke="#880033" stroke-width="1.2"/>
    <circle cx="296" cy="366" r="6.5" fill="#ffe600" stroke="#887700" stroke-width="1.2"/>
    <circle cx="262" cy="379" r="6.5" fill="#00e575" stroke="#006633" stroke-width="1.2"/>
    <circle cx="278" cy="377" r="6.5" fill="#ff7700" stroke="#883300" stroke-width="1.2"/>
    <circle cx="294" cy="381" r="6.5" fill="#aa00ff" stroke="#550088" stroke-width="1.2"/>

    <!-- Player 2 Controls (Right) -->
    <!-- 2P Start Button -->
    <circle cx="430" cy="354" r="6" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <text x="430" y="346" font-family="'Arial', sans-serif" font-size="6.5" font-weight="bold" text-anchor="middle" fill="#ffffff">2P</text>
    <!-- 2P Joystick (Blue Ball Top) -->
    <ellipse cx="350" cy="376" rx="14" ry="7" fill="#080c12" stroke="#222c3d" stroke-width="1.5"/>
    <rect x="348" y="358" width="4" height="14" fill="#a0b0c0"/>
    <circle cx="350" cy="356" r="11" fill="#0088ff" stroke="#003377" stroke-width="1.5" filter="drop-shadow(0 2px 4px #000000)"/>
    <circle cx="347" cy="352" r="3" fill="#88ccff" opacity="0.8"/>
    <!-- 2P Action Buttons (6 in 2x3 curved layout) -->
    <circle cx="384" cy="364" r="6.5" fill="#00f0ff" stroke="#006688" stroke-width="1.2"/>
    <circle cx="400" cy="362" r="6.5" fill="#ff0066" stroke="#880033" stroke-width="1.2"/>
    <circle cx="416" cy="366" r="6.5" fill="#ffe600" stroke="#887700" stroke-width="1.2"/>
    <circle cx="382" cy="379" r="6.5" fill="#00e575" stroke="#006633" stroke-width="1.2"/>
    <circle cx="398" cy="377" r="6.5" fill="#ff7700" stroke="#883300" stroke-width="1.2"/>
    <circle cx="414" cy="381" r="6.5" fill="#aa00ff" stroke="#550088" stroke-width="1.2"/>

    <!-- 4. LOWER COIN DOOR SECTION -->
    <polygon points="132,396 508,396 480,515 160,515" fill="#101520" stroke="#283447" stroke-width="2"/>
    <!-- Steel Coin Door Inset Frame -->
    <rect x="230" y="412" width="180" height="92" rx="6" fill="#0a0e16" stroke="#405068" stroke-width="3"/>
    <!-- Key Lock -->
    <circle cx="320" cy="424" r="5" fill="#708090" stroke="#333333" stroke-width="1.5"/>
    <rect x="319" y="423" width="2" height="4" fill="#111111"/>

    <!-- Dual Mechanical Coin Chutes -->
    <!-- Chute 1 (Left) -->
    <g class="coin-glow">
      <rect x="254" y="440" width="44" height="48" rx="4" fill="#171e2b" stroke="#334155" stroke-width="1.5"/>
      <rect x="264" y="446" width="24" height="4" fill="#05080c"/>
      <!-- Orange/Red Reject Button -->
      <rect x="260" y="456" width="32" height="24" rx="3" fill="#ff2200" stroke="#880000" stroke-width="1"/>
      <text x="276" y="472" font-family="'Impact', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffff">25¢</text>
    </g>

    <!-- Chute 2 (Right) -->
    <g class="coin-glow">
      <rect x="342" y="440" width="44" height="48" rx="4" fill="#171e2b" stroke="#334155" stroke-width="1.5"/>
      <rect x="352" y="446" width="24" height="4" fill="#05080c"/>
      <!-- Orange/Red Reject Button -->
      <rect x="348" y="456" width="32" height="24" rx="3" fill="#ff2200" stroke="#880000" stroke-width="1"/>
      <text x="364" y="472" font-family="'Impact', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffff">25¢</text>
    </g>

    <!-- Speaker Grille on bottom -->
    <line x1="260" y1="497" x2="380" y2="497" stroke="#253245" stroke-width="2"/>
    <line x1="270" y1="501" x2="370" y2="501" stroke="#253245" stroke-width="2"/>
  </g>
</svg>
`;
}

// 2. MAIN HERO BANNER (SVG with dynamic pulsing neon glow and mascots)
function buildCandyArcadeBannerSvg() {
  const defs = getCommonDefs();
  const ninjaSvg = renderSpriteToSvg(ninjaSprite, 54, 72, 4.2);
  const hopperSvg = renderSpriteToSvg(hopperSprite, 770, 72, 4.2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 320" width="100%" height="100%">
  ${defs}
  <style>
    @keyframes neonGlowPulse {
      0%, 100% {
        filter: drop-shadow(0 0 8px #ff0077) drop-shadow(0 0 25px #ff0077) drop-shadow(0 0 50px #ff0077);
      }
      50% {
        filter: drop-shadow(0 0 4px #ff0077) drop-shadow(0 0 15px #ff0077) drop-shadow(0 0 30px #ff0077);
      }
    }
    @keyframes borderChase {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 80; }
    }
    @keyframes coinSpin {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-6px) scale(1.05); }
    }
    .neon-title { animation: neonGlowPulse 3s ease-in-out infinite; }
    .chase-border { stroke-dasharray: 12 12; animation: borderChase 3s linear infinite; }
    .floating-coin { animation: coinSpin 2.5s ease-in-out infinite; }
  </style>

  <!-- Deep Synthwave Canvas Background -->
  <rect x="0" y="0" width="960" height="320" fill="url(#bg-synthwave)" rx="16"/>

  <!-- Perspective Cyber Grid Floor -->
  <g opacity="0.35">
    ${Array.from({ length: 15 }, (_, i) => {
      const x = i * 70 - 40;
      return `<line x1="${x}" y1="320" x2="${480 + (i - 7) * 22}" y2="200" stroke="#ff00aa" stroke-width="1.2"/>`;
    }).join('')}
    <line x1="0" y1="220" x2="960" y2="220" stroke="#00f0ff" stroke-width="1"/>
    <line x1="0" y1="245" x2="960" y2="245" stroke="#00f0ff" stroke-width="1.2"/>
    <line x1="0" y1="275" x2="960" y2="275" stroke="#00f0ff" stroke-width="1.6"/>
    <line x1="0" y1="315" x2="960" y2="315" stroke="#00f0ff" stroke-width="2.2"/>
  </g>

  <!-- Starfield Nebulae -->
  ${Array.from({ length: 48 }, (_, i) => {
    const cx = (i * 127 + 37) % 940 + 10;
    const cy = (i * 73 + 19) % 190 + 10;
    const r = (i % 5 === 0) ? 2 : 1;
    const op = 0.2 + (i % 4) * 0.2;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="${op}"/>`;
  }).join('')}

  <!-- Neon Frame Border with Corner Brackets -->
  <rect x="18" y="18" width="924" height="284" rx="12" fill="none" stroke="#251b47" stroke-width="2.5"/>
  <rect x="24" y="24" width="912" height="272" rx="8" fill="none" stroke="#ff0077" stroke-width="1.8" class="chase-border" opacity="0.75"/>

  <!-- Cyber Corner Brackets -->
  <path d="M 18 50 L 18 18 L 50 18" fill="none" stroke="#00f0ff" stroke-width="4"/>
  <path d="M 942 50 L 942 18 L 910 18" fill="none" stroke="#00f0ff" stroke-width="4"/>
  <path d="M 18 270 L 18 302 L 50 302" fill="none" stroke="#00f0ff" stroke-width="4"/>
  <path d="M 942 270 L 942 302 L 910 302" fill="none" stroke="#00f0ff" stroke-width="4"/>

  <!-- Left Mascot: Neon Ninja -->
  <g filter="drop-shadow(0 8px 16px #000000)">
    <ellipse cx="120" cy="205" rx="42" ry="10" fill="#00f0ff" opacity="0.18" filter="blur(5px)"/>
    ${ninjaSvg}
    <text x="120" y="226" font-family="'Courier New', monospace" font-size="10" font-weight="bold" text-anchor="middle" fill="#00f0ff" letter-spacing="1">NEON NINJA</text>
  </g>

  <!-- Right Mascot: Sweet Hopper -->
  <g filter="drop-shadow(0 8px 16px #000000)">
    <ellipse cx="836" cy="205" rx="42" ry="10" fill="#ff0077" opacity="0.18" filter="blur(5px)"/>
    ${hopperSvg}
    <text x="836" y="226" font-family="'Courier New', monospace" font-size="10" font-weight="bold" text-anchor="middle" fill="#ff7db3" letter-spacing="1">SWEET HOPPER</text>
  </g>

  <!-- Centerpiece Neon Typography -->
  <!-- Top Eyebrow Chip -->
  <g transform="translate(480, 52)">
    <rect x="-180" y="-14" width="360" height="28" rx="14" fill="#130826" stroke="#00f0ff" stroke-width="1.8"/>
    <text x="0" y="5" font-family="'Courier New', monospace" font-size="11" font-weight="900" text-anchor="middle" fill="#00f0ff" letter-spacing="3">★ THE ZERO-DEPENDENCY ARCADE ★</text>
  </g>

  <!-- Giant Glowing Neon Title -->
  <g class="neon-title" transform="translate(480, 138)">
    <!-- Cyan glow tube shadow -->
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="78" font-weight="900" text-anchor="middle" fill="#ff0077" letter-spacing="6">CANDY ARCADE</text>
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="78" font-weight="900" text-anchor="middle" fill="url(#neon-text-candy)" letter-spacing="6" stroke="#ffffff" stroke-width="1.5">CANDY ARCADE</text>
  </g>

  <!-- Subtitle Tagline Pill -->
  <g transform="translate(480, 196)">
    <rect x="-290" y="-15" width="580" height="30" rx="15" fill="#120c24" stroke="#ffe600" stroke-width="2"/>
    <text x="0" y="5" font-family="'Courier New', monospace" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffe600" letter-spacing="2">100 ORIGINAL GAMES • ZERO BUILD • 100% OFFLINE</text>
  </g>

  <!-- Feature Chips Row -->
  <g transform="translate(480, 252)">
    <!-- Chip 1 -->
    <rect x="-310" y="-12" width="140" height="24" rx="6" fill="#181c2f" stroke="#00f0ff" stroke-width="1"/>
    <text x="-240" y="4" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">🕹️ 100 Classics</text>

    <!-- Chip 2 -->
    <rect x="-150" y="-12" width="140" height="24" rx="6" fill="#181c2f" stroke="#ff0066" stroke-width="1"/>
    <text x="-80" y="4" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">⚡ Zero Install</text>

    <!-- Chip 3 -->
    <rect x="10" y="-12" width="140" height="24" rx="6" fill="#181c2f" stroke="#00e575" stroke-width="1"/>
    <text x="80" y="4" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">📱 Mobile &amp; PC</text>

    <!-- Chip 4 -->
    <rect x="170" y="-12" width="140" height="24" rx="6" fill="#181c2f" stroke="#ffe600" stroke-width="1"/>
    <text x="240" y="4" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">🏆 Daily Medals</text>
  </g>
</svg>
`;
}

// 3. SOCIAL PREVIEW CARD (1280x640 OpenGraph Image)
function buildSocialPreviewSvg() {
  const defs = getCommonDefs();
  const ninjaSvg = renderSpriteToSvg(ninjaSprite, 94, 210, 6.2);
  const racerSvg = renderSpriteToSvg(racerSprite, 1080, 210, 6.2);
  const hopperSvg = renderSpriteToSvg(hopperSprite, 930, 220, 5.8);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 640" width="1280" height="640">
  ${defs}

  <!-- Dark Synthwave Background Canvas -->
  <rect x="0" y="0" width="1280" height="640" fill="url(#bg-synthwave)"/>

  <!-- Perspective Cyber Grid -->
  <g opacity="0.38">
    ${Array.from({ length: 22 }, (_, i) => {
      const x = i * 80 - 180;
      return `<line x1="${x}" y1="640" x2="${640 + (i - 10) * 36}" y2="380" stroke="#ff00aa" stroke-width="1.5"/>`;
    }).join('')}
    <line x1="0" y1="410" x2="1280" y2="410" stroke="#00f0ff" stroke-width="1.2"/>
    <line x1="0" y1="450" x2="1280" y2="450" stroke="#00f0ff" stroke-width="1.5"/>
    <line x1="0" y1="500" x2="1280" y2="500" stroke="#00f0ff" stroke-width="2"/>
    <line x1="0" y1="565" x2="1280" y2="565" stroke="#00f0ff" stroke-width="2.5"/>
    <line x1="0" y1="635" x2="1280" y2="635" stroke="#00f0ff" stroke-width="3"/>
  </g>

  <!-- Distant Glowing Cyber Sun -->
  <circle cx="640" cy="380" r="160" fill="#ff0066" opacity="0.18" filter="blur(30px)"/>
  <circle cx="640" cy="380" r="90" fill="#ffe600" opacity="0.14" filter="blur(20px)"/>

  <!-- Outer Frame -->
  <rect x="24" y="24" width="1232" height="592" rx="16" fill="none" stroke="#2b1f4d" stroke-width="3"/>
  <rect x="32" y="32" width="1216" height="576" rx="12" fill="none" stroke="#ff0077" stroke-width="2" stroke-dasharray="16 12" opacity="0.8"/>

  <!-- Left Mascot: Neon Ninja -->
  <g filter="drop-shadow(0 14px 28px #000000)">
    <ellipse cx="190" cy="410" rx="65" ry="16" fill="#00f0ff" opacity="0.22" filter="blur(8px)"/>
    ${ninjaSvg}
    <rect x="110" y="430" width="160" height="28" rx="6" fill="#111625" stroke="#00f0ff" stroke-width="1.5"/>
    <text x="190" y="449" font-family="'Courier New', monospace" font-size="13" font-weight="bold" text-anchor="middle" fill="#00f0ff" letter-spacing="1.5">WING 1: ACTION</text>
  </g>

  <!-- Right Mascots: Velocity Racer & Sweet Hopper -->
  <g filter="drop-shadow(0 14px 28px #000000)">
    <ellipse cx="1175" cy="410" rx="65" ry="16" fill="#ff0066" opacity="0.22" filter="blur(8px)"/>
    ${racerSvg}
    <rect x="1095" y="430" width="160" height="28" rx="6" fill="#111625" stroke="#ff0066" stroke-width="1.5"/>
    <text x="1175" y="449" font-family="'Courier New', monospace" font-size="13" font-weight="bold" text-anchor="middle" fill="#ff0066" letter-spacing="1.5">WING 2: RACING</text>
  </g>

  <!-- Center Content Block -->
  <!-- Top Badge -->
  <g transform="translate(640, 100)">
    <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#130a28" stroke="#00f0ff" stroke-width="2"/>
    <text x="0" y="6" font-family="'Courier New', monospace" font-size="14" font-weight="900" text-anchor="middle" fill="#00f0ff" letter-spacing="4">★ 100% DEPENDENCY-FREE BROWSER ARCADE ★</text>
  </g>

  <!-- Giant Brand Title -->
  <g transform="translate(640, 205)" filter="url(#glow-magenta)">
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="108" font-weight="900" text-anchor="middle" fill="#ff0077" letter-spacing="8">CANDY ARCADE</text>
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="108" font-weight="900" text-anchor="middle" fill="url(#neon-text-candy)" letter-spacing="8" stroke="#ffffff" stroke-width="2">CANDY ARCADE</text>
  </g>

  <!-- Tagline Pill -->
  <g transform="translate(640, 280)">
    <rect x="-380" y="-20" width="760" height="40" rx="20" fill="#160c2e" stroke="#ffe600" stroke-width="2.5"/>
    <text x="0" y="7" font-family="'Courier New', monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="#ffe600" letter-spacing="2.5">100 ORIGINAL CANVAS GAMES • PURE WEB PLATFORM</text>
  </g>

  <!-- Feature Grid (4 Pillars) -->
  <g transform="translate(640, 360)">
    <!-- Pillar 1 -->
    <g transform="translate(-330, 0)">
      <rect x="-95" y="-22" width="190" height="44" rx="10" fill="#121828" stroke="#00f0ff" stroke-width="2"/>
      <text x="0" y="6" font-family="'Arial', sans-serif" font-size="15" font-weight="bold" text-anchor="middle" fill="#ffffff">🕹️ 100 Games</text>
    </g>

    <!-- Pillar 2 -->
    <g transform="translate(-110, 0)">
      <rect x="-95" y="-22" width="190" height="44" rx="10" fill="#121828" stroke="#ff0066" stroke-width="2"/>
      <text x="0" y="6" font-family="'Arial', sans-serif" font-size="15" font-weight="bold" text-anchor="middle" fill="#ffffff">⚡ 0 Dependencies</text>
    </g>

    <!-- Pillar 3 -->
    <g transform="translate(110, 0)">
      <rect x="-95" y="-22" width="190" height="44" rx="10" fill="#121828" stroke="#00e575" stroke-width="2"/>
      <text x="0" y="6" font-family="'Arial', sans-serif" font-size="15" font-weight="bold" text-anchor="middle" fill="#ffffff">⏱️ Instant 60 FPS</text>
    </g>

    <!-- Pillar 4 -->
    <g transform="translate(330, 0)">
      <rect x="-95" y="-22" width="190" height="44" rx="10" fill="#121828" stroke="#ffe600" stroke-width="2"/>
      <text x="0" y="6" font-family="'Arial', sans-serif" font-size="15" font-weight="bold" text-anchor="middle" fill="#ffffff">🏆 Daily Medals</text>
    </g>
  </g>

  <!-- Bottom Interactive CTA Marquee -->
  <g transform="translate(640, 520)">
    <rect x="-280" y="-24" width="560" height="48" rx="24" fill="#000000" stroke="#00f0ff" stroke-width="2.5" filter="drop-shadow(0 0 12px #00f0ff)"/>
    <text x="0" y="8" font-family="'Courier New', monospace" font-size="18" font-weight="900" text-anchor="middle" fill="#00f0ff" letter-spacing="4">INSERT COIN TO PLAY ONLINE ➔</text>
  </g>
</svg>
`;
}

// 4. GENERATE ANIMATED GIF FOR ARCADE CABINET
function generateArcadeCabinetGif() {
  const w = 240;
  const h = 210;

  // 16-color retro arcade palette
  const palette = [
    [10, 14, 22],   // 0: dark navy bg
    [20, 26, 38],   // 1: cabinet shadow
    [32, 43, 64],   // 2: cabinet body
    [48, 64, 96],   // 3: cabinet highlight
    [255, 0, 119],  // 4: neon magenta / marquee
    [0, 240, 255],  // 5: neon cyan
    [255, 230, 0],  // 6: neon yellow
    [0, 230, 117],  // 7: neon green
    [255, 255, 255],// 8: white
    [255, 34, 0],   // 9: red coin slot
    [15, 20, 30],   // 10: screen bezel
    [8, 14, 24],    // 11: crt screen deep
    [30, 70, 110],  // 12: crt screen glow
    [180, 20, 70],  // 13: alien pink
    [20, 170, 90],  // 14: alien green
    [160, 175, 195] // 15: joystick silver
  ];

  const gw = new GifWriter(w, h, { palette, loopCount: 0 });

  // 8 animation frames
  for (let f = 0; f < 8; f++) {
    const frame = new Uint8Array(w * h).fill(0);

    // Draw cabinet body
    for (let y = 16; y < 195; y++) {
      for (let x = 45; x < 195; x++) {
        // Cabinet trapezoid shape
        if (y < 45 && (x < 55 || x > 185)) continue;
        if (y > 175 && (x < 50 || x > 190)) continue;
        frame[y * w + x] = 2;
      }
    }

    // Cabinet border trim
    for (let y = 16; y < 195; y++) {
      frame[y * w + 46] = 3;
      frame[y * w + 194] = 3;
    }

    // Top Marquee (flashing lights)
    const marqueeBg = f % 2 === 0 ? 4 : 5;
    for (let y = 20; y < 46; y++) {
      for (let x = 60; x < 180; x++) {
        frame[y * w + x] = marqueeBg;
      }
    }
    // Marquee bulbs
    for (let i = 0; i < 8; i++) {
      const bx = 66 + i * 14;
      const bColor = (i + f) % 2 === 0 ? 6 : 8;
      frame[22 * w + bx] = bColor;
      frame[44 * w + bx] = bColor;
    }

    // CRT Bezel & Screen
    for (let y = 52; y < 125; y++) {
      for (let x = 60; x < 180; x++) {
        frame[y * w + x] = 10;
      }
    }
    // Screen display (CRT space shooter scene)
    for (let y = 56; y < 120; y++) {
      for (let x = 65; x < 175; x++) {
        // Scanline modulation
        frame[y * w + x] = (y % 2 === 0) ? 11 : 12;
      }
    }

    // Moving stars
    for (let s = 0; s < 10; s++) {
      const sx = 70 + (s * 37 + 12) % 100;
      const sy = 60 + (s * 23 + f * 4) % 55;
      frame[sy * w + sx] = 8;
    }

    // Alien Invader moving horizontally
    const alienX = 80 + ((f * 6) % 65);
    const alienY = 68;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        frame[(alienY + dy) * w + (alienX + dx)] = 13;
      }
    }

    // Player spaceship moving and shooting
    const shipX = 120 + Math.floor(Math.sin(f * 0.78) * 16);
    const shipY = 112;
    // Ship hull
    frame[shipY * w + shipX] = 8;
    frame[(shipY + 1) * w + shipX - 1] = 5;
    frame[(shipY + 1) * w + shipX] = 5;
    frame[(shipY + 1) * w + shipX + 1] = 5;
    frame[(shipY + 2) * w + shipX - 2] = 5;
    frame[(shipY + 2) * w + shipX + 2] = 5;

    // Laser blast
    const laserY = 112 - ((f * 5) % 35);
    if (laserY > 58) {
      frame[laserY * w + shipX] = 6;
      frame[(laserY + 1) * w + shipX] = 6;
    }

    // Control Panel
    for (let y = 126; y < 155; y++) {
      for (let x = 52; x < 188; x++) {
        frame[y * w + x] = 1;
      }
    }
    // P1 Joystick
    frame[138 * w + 85] = 15;
    frame[137 * w + 85] = 15;
    frame[135 * w + 85] = 9; // red ball top
    // P1 Buttons
    frame[138 * w + 102] = 5;
    frame[138 * w + 110] = 4;
    frame[138 * w + 118] = 6;

    // P2 Joystick
    frame[138 * w + 135] = 15;
    frame[137 * w + 135] = 15;
    frame[135 * w + 135] = 5; // blue ball top
    // P2 Buttons
    frame[138 * w + 152] = 5;
    frame[138 * w + 160] = 4;
    frame[138 * w + 168] = 6;

    // Lower Coin Door
    for (let y = 158; y < 190; y++) {
      for (let x = 85; x < 155; x++) {
        frame[y * w + x] = 10;
      }
    }
    // Flashing coin slots
    const coinGlow = (f % 2 === 0) ? 9 : 6;
    for (let y = 166; y < 180; y++) {
      for (let x = 95; x < 112; x++) frame[y * w + x] = coinGlow;
      for (let x = 128; x < 145; x++) frame[y * w + x] = coinGlow;
    }

    gw.addFrame(frame, { delay: 12 });
  }

  return gw.finish();
}

module.exports = {
  buildArcadeCabinetSvg,
  buildCandyArcadeBannerSvg,
  buildSocialPreviewSvg,
  generateArcadeCabinetGif
};
