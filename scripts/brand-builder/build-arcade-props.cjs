'use strict';

const { getCommonDefs, renderSpriteToSvg } = require('./svg-helpers.cjs');
const { coinFrames, coinPalette } = require('./pixel-art-data.cjs');
const { GifWriter } = require('./gif-encoder.cjs');

/**
 * Builds:
 * 1. Animated "INSERT COIN" Marquee (SVG + GIF)
 * 2. Vintage Arcade Ticket Stub (SVG)
 * 3. Arcade High Scores Hall of Fame (SVG)
 * 4. Secret Konami Code / Arcade Cheat Card (SVG)
 */

// 1. INSERT COIN SVG (480x160)
function buildInsertCoinSvg() {
  const defs = getCommonDefs();
  const coinSvg = renderSpriteToSvg(coinFrames[0], 28, 42, 4.6);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" width="100%" height="100%">
  ${defs}
  <style>
    @keyframes insertCoinBlink {
      0%, 100% { opacity: 1; filter: drop-shadow(0 0 10px #ffe600) drop-shadow(0 0 20px #ff9900); }
      50% { opacity: 0.25; filter: drop-shadow(0 0 2px #ffe600); }
    }
    @keyframes marqueeChase {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 40; }
    }
    @keyframes coinFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-4px); }
    }
    .insert-coin-text { animation: insertCoinBlink 1.4s ease-in-out infinite; }
    .marquee-edge { stroke-dasharray: 8 6; animation: marqueeChase 1.5s linear infinite; }
    .animated-coin { animation: coinFloat 1.8s ease-in-out infinite; }
  </style>

  <!-- Marquee Box Outer Frame -->
  <rect x="6" y="6" width="468" height="148" rx="14" fill="#0b0e17" stroke="#252f44" stroke-width="3"/>
  <rect x="12" y="12" width="456" height="136" rx="10" fill="#141824" stroke="#ffe600" stroke-width="2" class="marquee-edge"/>

  <!-- Left: Animated Coin & Coin Slot -->
  <!-- Coin Slot Metal Inset Plate -->
  <rect x="22" y="22" width="86" height="116" rx="8" fill="#0d111a" stroke="#3d4d68" stroke-width="2"/>

  <!-- Rotating Coin Graphic -->
  <g class="animated-coin" filter="drop-shadow(0 4px 8px #000000)">
    ${coinSvg}
  </g>

  <!-- Mechanical Coin Chute Mouth -->
  <rect x="37" y="106" width="56" height="24" rx="4" fill="#05070a" stroke="#ff2200" stroke-width="1.5"/>
  <rect x="47" y="110" width="36" height="5" fill="#000000"/>
  <text x="65" y="124" font-family="'Impact', sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#ff3300">PUSH 25¢</text>

  <!-- Right: Pulsing "INSERT COIN" Typography -->
  <g class="insert-coin-text" transform="translate(290, 72)">
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" font-weight="900" text-anchor="middle" fill="#ffe600" letter-spacing="4">INSERT COIN</text>
  </g>

  <!-- Secondary Instruction -->
  <text x="290" y="104" font-family="'Courier New', monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#00f0ff" letter-spacing="2">
    1 OR 2 PLAYERS • 100 GAMES READY
  </text>
  <text x="290" y="122" font-family="'Courier New', monospace" font-size="9.5" font-weight="900" text-anchor="middle" fill="#8899aa" letter-spacing="1.5">
    FREE PLAY AVAILABLE • NO DOWNLOAD REQUIRED
  </text>
</svg>
`;
}

// 2. INSERT COIN ANIMATED GIF (320x110)
function generateInsertCoinGif() {
  const w = 320;
  const h = 110;

  const palette = [
    [11, 14, 23],   // 0: dark navy bg
    [20, 24, 36],   // 1: frame inner
    [37, 47, 68],   // 2: border grey
    [255, 230, 0],  // 3: yellow neon
    [255, 140, 0],  // 4: orange
    [0, 240, 255],  // 5: cyan
    [255, 34, 0],   // 6: red slot
    [255, 255, 255],// 7: white
    [10, 10, 10],   // 8: black
    [184, 120, 0],  // 9: gold dark
    [255, 192, 0],  // 10: gold mid
    [255, 234, 96], // 11: gold bright
    [136, 153, 170] // 12: muted grey
  ];

  const gw = new GifWriter(w, h, { palette, loopCount: 0 });

  // Render 8 frames (synchronized with coin rotation and blinking text)
  for (let f = 0; f < 8; f++) {
    const frame = new Uint8Array(w * h).fill(0);

    // Frame border
    for (let x = 4; x < w - 4; x++) {
      frame[4 * w + x] = 2;
      frame[(h - 5) * w + x] = 2;
    }
    for (let y = 4; y < h - 4; y++) {
      frame[y * w + 4] = 2;
      frame[y * w + w - 5] = 2;
    }

    // Inner background
    for (let y = 6; y < h - 6; y++) {
      for (let x = 6; x < w - 6; x++) {
        frame[y * w + x] = 1;
      }
    }

    // Left coin box
    for (let y = 12; y < h - 12; y++) {
      for (let x = 12; x < 85; x++) {
        frame[y * w + x] = 0;
      }
    }

    // Draw spinning coin from coinFrames[f]
    const coinSprite = coinFrames[f];
    const coinStartX = 28;
    const coinStartY = 18;
    for (let r = 0; r < coinSprite.length; r++) {
      for (let c = 0; c < coinSprite[r].length; c++) {
        const col = coinSprite[r][c];
        if (col) {
          // Map to palette index
          let idx = 10;
          if (col === '#ffea60') idx = 11;
          else if (col === '#ffffff') idx = 7;
          else if (col === '#b87800') idx = 9;
          else if (col === '#1a1005') idx = 8;
          // Scale 2x
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              frame[(coinStartY + r * 2 + dy) * w + (coinStartX + c * 2 + dx)] = idx;
            }
          }
        }
      }
    }

    // Coin slot mouth at bottom
    for (let y = 78; y < 94; y++) {
      for (let x = 24; x < 74; x++) {
        frame[y * w + x] = 6;
      }
    }
    for (let x = 32; x < 66; x++) {
      frame[82 * w + x] = 8;
      frame[83 * w + x] = 8;
    }

    // Right: INSERT COIN text (blinks: visible on frames 0, 1, 2, 4, 5, 6; dimmed on 3 and 7)
    const isVisible = (f !== 3 && f !== 7);
    const textColor = isVisible ? 3 : 2;

    // Draw "INSERT COIN" pixel representation
    // Let's draw blocky pixel letters for "INSERT COIN"
    const textPixels = [
      // I
      [110, 32, 2, 16], [107, 32, 8, 2], [107, 46, 8, 2],
      // N
      [120, 32, 2, 16], [122, 34, 4, 12], [128, 32, 2, 16],
      // S
      [133, 32, 8, 2], [133, 34, 2, 6], [133, 39, 8, 2], [139, 41, 2, 6], [133, 46, 8, 2],
      // E
      [144, 32, 8, 2], [144, 34, 2, 12], [144, 39, 6, 2], [144, 46, 8, 2],
      // R
      [155, 32, 8, 2], [155, 34, 2, 12], [161, 34, 2, 6], [155, 39, 8, 2], [160, 41, 3, 7],
      // T
      [166, 32, 10, 2], [170, 34, 2, 14],
      // Space
      // C
      [184, 32, 8, 2], [184, 34, 2, 12], [184, 46, 8, 2],
      // O
      [195, 32, 8, 2], [195, 34, 2, 12], [201, 34, 2, 12], [195, 46, 8, 2],
      // I
      [207, 32, 2, 16], [204, 32, 8, 2], [204, 46, 8, 2],
      // N
      [215, 32, 2, 16], [217, 34, 4, 12], [223, 32, 2, 16]
    ];

    for (let [tx, ty, tw, th] of textPixels) {
      for (let dy = 0; dy < th; dy++) {
        for (let dx = 0; dx < tw; dx++) {
          frame[(ty + dy) * w + (tx + dx)] = textColor;
        }
      }
    }

    // Subtitle bar
    for (let x = 110; x < 280; x++) {
      frame[62 * w + x] = 5;
    }

    gw.addFrame(frame, { delay: 12 });
  }

  return gw.finish();
}

// 3. VINTAGE ARCADE TICKET STUB (SVG, 740x260)
function buildArcadeTicketSvg() {
  const defs = getCommonDefs();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 260" width="100%" height="100%">
  ${defs}
  <defs>
    <!-- Vintage paper texture gradient -->
    <linearGradient id="ticket-paper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8e7"/>
      <stop offset="50%" stop-color="#faebd0"/>
      <stop offset="100%" stop-color="#f0dac0"/>
    </linearGradient>

    <!-- Vintage red ink gradient -->
    <linearGradient id="stamp-ink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b82626"/>
      <stop offset="100%" stop-color="#8a1818"/>
    </linearGradient>

    <!-- Die-cut scalloped mask for ticket notches -->
    <mask id="ticket-notch-mask">
      <rect x="0" y="0" width="740" height="260" fill="#ffffff"/>
      <!-- Left edge semi-circle cutouts -->
      <circle cx="10" cy="50" r="10" fill="#000000"/>
      <circle cx="10" cy="90" r="10" fill="#000000"/>
      <circle cx="10" cy="130" r="10" fill="#000000"/>
      <circle cx="10" cy="170" r="10" fill="#000000"/>
      <circle cx="10" cy="210" r="10" fill="#000000"/>
      <!-- Right edge semi-circle cutouts -->
      <circle cx="730" cy="50" r="10" fill="#000000"/>
      <circle cx="730" cy="90" r="10" fill="#000000"/>
      <circle cx="730" cy="130" r="10" fill="#000000"/>
      <circle cx="730" cy="170" r="10" fill="#000000"/>
      <circle cx="730" cy="210" r="10" fill="#000000"/>
      <!-- Middle perforation notch cutouts -->
      <circle cx="180" cy="10" r="12" fill="#000000"/>
      <circle cx="180" cy="250" r="12" fill="#000000"/>
    </mask>
  </defs>

  <!-- Ticket Outer Body with Notches -->
  <g mask="url(#ticket-notch-mask)">
    <rect x="10" y="10" width="720" height="240" rx="10" fill="url(#ticket-paper)" stroke="#9c7b4f" stroke-width="3"/>

    <!-- Guilloche / Security Pattern Borders -->
    <rect x="20" y="20" width="700" height="220" rx="6" fill="none" stroke="#ba9567" stroke-width="1.5" stroke-dasharray="6 3"/>
    <rect x="24" y="24" width="692" height="212" rx="4" fill="none" stroke="#7a5833" stroke-width="2"/>
  </g>

  <!-- Dotted Perforation Line separating Stub from Main Ticket -->
  <line x1="180" y1="22" x2="180" y2="238" stroke="#7a5833" stroke-width="2.5" stroke-dasharray="5 7"/>

  <!-- ==================== LEFT STUB ("KEEP THIS COUPON") ==================== -->
  <g transform="translate(100, 130)">
    <!-- Vertical Text -->
    <text x="0" y="-72" font-family="'Courier New', monospace" font-size="10" font-weight="900" text-anchor="middle" fill="#7a5833" letter-spacing="2">★ CANDY ARCADE ★</text>
    <text x="0" y="-48" font-family="'Impact', sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#2d2218" letter-spacing="1">ADMIT ONE</text>
    <text x="0" y="-30" font-family="'Courier New', monospace" font-size="9" font-weight="bold" text-anchor="middle" fill="#b82626">TICKET #00100</text>

    <!-- Stub Barcode Lines -->
    <g transform="translate(-50, -10)">
      ${Array.from({ length: 26 }, (_, i) => {
        const x = i * 4;
        const w = (i % 3 === 0 || i % 7 === 0) ? 2.5 : 1.2;
        return `<line x1="${x}" y1="0" x2="${x}" y2="35" stroke="#2d2218" stroke-width="${w}"/>`;
      }).join('')}
    </g>

    <text x="0" y="44" font-family="'Courier New', monospace" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#5c432d">NO REFUNDS</text>
    <text x="0" y="58" font-family="'Courier New', monospace" font-size="8" font-weight="bold" text-anchor="middle" fill="#7a5833">KEEP THIS STUB</text>
    <text x="0" y="74" font-family="'Impact', sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#b82626">100 GAMES</text>
  </g>

  <!-- ==================== MAIN TICKET BODY ==================== -->
  <!-- Top Marquee Header -->
  <text x="450" y="52" font-family="'Courier New', monospace" font-size="12" font-weight="900" text-anchor="middle" fill="#7a5833" letter-spacing="3">
    ★ ARCADE RUN ENTERTAINMENT SYSTEM ★
  </text>

  <!-- Giant Bold Headline -->
  <text x="450" y="96" font-family="'Impact', 'Arial Black', sans-serif" font-size="38" font-weight="900" text-anchor="middle" fill="#2d2218" letter-spacing="3">
    ADMIT ONE : 100 GAMES
  </text>

  <!-- Core Pillars Tagline -->
  <g transform="translate(450, 126)">
    <rect x="-240" y="-14" width="480" height="26" rx="4" fill="#2d2218"/>
    <text x="0" y="4" font-family="'Courier New', monospace" font-size="12" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="2">
      ZERO INSTALL • ZERO DEPENDENCIES • INFINITE PLAYS
    </text>
  </g>

  <!-- Sub-features row -->
  <text x="450" y="166" font-family="'Georgia', serif" font-size="12" font-style="italic" text-anchor="middle" fill="#5c432d">
    Valid for unlimited gameplay across 8 curated arcade wings. 60 FPS guaranteed on desktop and mobile.
  </text>

  <!-- Vintage Red Circular Stamp -->
  <g transform="translate(630, 160) rotate(-14)" opacity="0.88">
    <circle cx="0" cy="0" r="34" fill="none" stroke="url(#stamp-ink)" stroke-width="2.5" stroke-dasharray="4 2"/>
    <circle cx="0" cy="0" r="30" fill="none" stroke="url(#stamp-ink)" stroke-width="1.2"/>
    <text x="0" y="-12" font-family="'Courier New', monospace" font-size="7" font-weight="900" text-anchor="middle" fill="#b82626">★ VERIFIED ★</text>
    <text x="0" y="4" font-family="'Impact', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#b82626">ZERO-DEP</text>
    <text x="0" y="16" font-family="'Courier New', monospace" font-size="6.5" font-weight="900" text-anchor="middle" fill="#b82626">60 FPS OK</text>
  </g>

  <!-- Bottom Barcode & Serial Number -->
  <g transform="translate(230, 195)">
    <!-- Barcode lines -->
    ${Array.from({ length: 65 }, (_, i) => {
      const x = i * 4.2;
      const w = (i % 4 === 0 || i % 6 === 0) ? 2.8 : 1.2;
      return `<line x1="${x}" y1="0" x2="${x}" y2="24" stroke="#2d2218" stroke-width="${w}"/>`;
    }).join('')}
  </g>
  <text x="365" y="232" font-family="'Courier New', monospace" font-size="9" font-weight="bold" text-anchor="middle" fill="#5c432d" letter-spacing="2">
    SERIAL NO. 2026-ARCADE-RUN-100G-INFINITY
  </text>
</svg>
`;
}

// 4. ARCADE HIGH SCORES HALL OF FAME (SVG, 800x520)
function buildHallOfFameSvg() {
  const defs = getCommonDefs();

  const highScores = [
    { rank: '1ST', score: '999,990', name: 'AAA', game: 'STARFALL', medals: '★★★ GOLD', isLeader: true },
    { rank: '2ND', score: '884,250', name: 'NEO', game: 'SUNSET SPRINT', medals: '★★★ GOLD', isLeader: false },
    { rank: '3RD', score: '772,100', name: 'ACE', game: 'ORBIT GUARD', medals: '★★★ GOLD', isLeader: false },
    { rank: '4TH', score: '658,400', name: 'VIP', game: 'MINI GOLF CLUB', medals: '★★☆ SILVER', isLeader: false },
    { rank: '5TH', score: '540,800', name: 'MAX', game: 'BOOMERANG BAY', medals: '★★☆ SILVER', isLeader: false },
    { rank: '6TH', score: '495,200', name: 'LNK', game: 'MERGE LAB', medals: '★★☆ SILVER', isLeader: false },
    { rank: '7TH', score: '412,900', name: 'JOY', game: 'NEON DOJO', medals: '★☆☆ BRONZE', isLeader: false },
    { rank: '8TH', score: '380,000', name: 'YOU', game: 'CANDY DROP', medals: '★☆☆ BRONZE', isLeader: false }
  ];

  const scoreRowsSvg = highScores.map((row, idx) => {
    const y = 175 + idx * 34;
    const rowBg = idx % 2 === 0 ? '#101626' : '#0c111e';
    const textColor = row.isLeader ? '#ffe600' : (row.rank === '8TH' ? '#00f0ff' : '#ffffff');
    const medalColor = row.isLeader ? '#ffe600' : (row.rank === '8TH' ? '#00f0ff' : '#ff9900');
    const leaderBorder = row.isLeader ? `stroke="#ffe600" stroke-width="1.2"` : `stroke="#1b2438" stroke-width="0.8"`;

    return `
      <!-- Row ${idx + 1} -->
      <g>
        <rect x="70" y="${y - 20}" width="660" height="28" rx="4" fill="${rowBg}" ${leaderBorder}/>
        <text x="110" y="${y}" font-family="'Courier New', monospace" font-size="14" font-weight="900" fill="${textColor}" text-anchor="middle">${row.rank}</text>
        <text x="210" y="${y}" font-family="'Courier New', monospace" font-size="14" font-weight="900" fill="${textColor}" text-anchor="end">${row.score}</text>
        <text x="310" y="${y}" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#00e575" text-anchor="middle">${row.name}</text>
        <text x="470" y="${y}" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">${row.game}</text>
        <text x="640" y="${y}" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="${medalColor}" text-anchor="middle">${row.medals}</text>
      </g>
    `;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%" height="100%">
  ${defs}
  <style>
    @keyframes blinkCursor {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .cursor-blink { animation: blinkCursor 0.9s infinite; }
  </style>

  <!-- Heavy Arcade Cabinet Bezel Frame -->
  <rect x="0" y="0" width="800" height="520" fill="#0a0d16" rx="18"/>
  <rect x="12" y="12" width="776" height="496" rx="14" fill="#141a27" stroke="#334158" stroke-width="3"/>

  <!-- Cabinet Screw Bolts in 4 Corners -->
  <circle cx="28" cy="28" r="6" fill="#475569" stroke="#1e293b" stroke-width="2"/>
  <circle cx="772" cy="28" r="6" fill="#475569" stroke="#1e293b" stroke-width="2"/>
  <circle cx="28" cy="492" r="6" fill="#475569" stroke="#1e293b" stroke-width="2"/>
  <circle cx="772" cy="492" r="6" fill="#475569" stroke="#1e293b" stroke-width="2"/>

  <!-- Curved Recessed CRT Glass Monitor -->
  <rect x="36" y="36" width="728" height="448" rx="16" fill="url(#screen-crt-glow)" stroke="#00f0ff" stroke-width="2"/>
  <rect x="36" y="36" width="728" height="448" rx="16" fill="url(#crt-scanlines)"/>

  <!-- Marquee Header Banner -->
  <g transform="translate(400, 72)">
    <rect x="-270" y="-20" width="540" height="40" rx="8" fill="#0c0e18" stroke="#ff0077" stroke-width="2"/>
    <text x="0" y="6" font-family="'Impact', 'Arial Black', sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="#ff0077" letter-spacing="3">
      ★ ALL-TIME HALL OF FAME ★
    </text>
  </g>
  <text x="400" y="112" font-family="'Courier New', monospace" font-size="11" font-weight="900" text-anchor="middle" fill="#00f0ff" letter-spacing="2">
    CANDY ARCADE GLOBAL LEADERBOARD • 100 PLAYABLE TITLES
  </text>

  <!-- Table Header Bar -->
  <g transform="translate(400, 138)">
    <rect x="-330" y="-12" width="660" height="24" rx="4" fill="#182338"/>
    <text x="-290" y="4" font-family="'Courier New', monospace" font-size="11" font-weight="900" fill="#00f0ff" text-anchor="middle">RANK</text>
    <text x="-190" y="4" font-family="'Courier New', monospace" font-size="11" font-weight="900" fill="#00f0ff" text-anchor="end">SCORE</text>
    <text x="-90" y="4" font-family="'Courier New', monospace" font-size="11" font-weight="900" fill="#00f0ff" text-anchor="middle">PILOT</text>
    <text x="70" y="4" font-family="'Courier New', monospace" font-size="11" font-weight="900" fill="#00f0ff" text-anchor="middle">SIGNATURE GAME</text>
    <text x="240" y="4" font-family="'Courier New', monospace" font-size="11" font-weight="900" fill="#00f0ff" text-anchor="middle">MEDALS</text>
  </g>

  <!-- High Scores Rows -->
  ${scoreRowsSvg}

  <!-- Bottom Interactive Prompt / Blinking Cursor -->
  <g transform="translate(400, 460)">
    <rect x="-290" y="-14" width="580" height="28" rx="6" fill="#080c14" stroke="#ffe600" stroke-width="1.5"/>
    <text x="0" y="4" font-family="'Courier New', monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffe600" letter-spacing="1.5">
      YOU HOLD RANK #8! INSERT COIN TO CHALLENGE AAA <tspan class="cursor-blink" fill="#00f0ff">_</tspan>
    </text>
  </g>
</svg>
`;
}

// 5. SECRET KONAMI CODE / ARCADE CHEAT CARD (SVG, 740x300)
function buildKonamiCheatCardSvg() {
  const defs = getCommonDefs();

  // Keys array: [symbol, label, color]
  const keys = [
    { sym: '↑', label: 'UP', color: '#00f0ff' },
    { sym: '↑', label: 'UP', color: '#00f0ff' },
    { sym: '↓', label: 'DOWN', color: '#00f0ff' },
    { sym: '↓', label: 'DOWN', color: '#00f0ff' },
    { sym: '←', label: 'LEFT', color: '#00f0ff' },
    { sym: '→', label: 'RIGHT', color: '#00f0ff' },
    { sym: '←', label: 'LEFT', color: '#00f0ff' },
    { sym: '→', label: 'RIGHT', color: '#00f0ff' },
    { sym: 'B', label: 'BTN B', color: '#ff0066' },
    { sym: 'A', label: 'BTN A', color: '#ffe600' }
  ];

  const keyElements = keys.map((k, i) => {
    // 10 buttons: width=56, gap=14. Total width = 10*56 + 9*14 = 560 + 126 = 686. Start at x=27.
    const x = 27 + i * 70;
    const y = 120;
    return `
      <!-- Key ${i + 1}: ${k.label} -->
      <g transform="translate(${x}, ${y})">
        <!-- Button Drop Shadow -->
        <rect x="0" y="4" width="56" height="56" rx="8" fill="#000000"/>
        <!-- Button Bevel -->
        <rect x="0" y="0" width="56" height="56" rx="8" fill="#141c2c" stroke="${k.color}" stroke-width="2"/>
        <rect x="4" y="4" width="48" height="48" rx="6" fill="#0b101b"/>
        <!-- Key Symbol -->
        <text x="28" y="34" font-family="'Impact', 'Arial Black', sans-serif" font-size="24" font-weight="900" fill="${k.color}" text-anchor="middle">${k.sym}</text>
        <!-- Key Sublabel -->
        <text x="28" y="46" font-family="'Courier New', monospace" font-size="7" font-weight="900" fill="#8899aa" text-anchor="middle">${k.label}</text>
      </g>
    `;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 300" width="100%" height="100%">
  ${defs}

  <!-- Laminated Card Background -->
  <rect x="0" y="0" width="740" height="300" fill="url(#bg-synthwave)" rx="16"/>

  <!-- Circuit Trace Pattern / Diagonal Hazard Stripes Top & Bottom -->
  <g opacity="0.4">
    ${Array.from({ length: 30 }, (_, i) => {
      const x = i * 26;
      return `<line x1="${x}" y1="0" x2="${x + 14}" y2="16" stroke="#ffe600" stroke-width="4"/>
              <line x1="${x}" y1="284" x2="${x + 14}" y2="300" stroke="#ffe600" stroke-width="4"/>`;
    }).join('')}
  </g>

  <!-- Outer Neon Frame -->
  <rect x="14" y="16" width="712" height="268" rx="12" fill="none" stroke="#ffe600" stroke-width="2" stroke-dasharray="14 8"/>
  <rect x="18" y="20" width="704" height="260" rx="10" fill="none" stroke="#251b47" stroke-width="1.5"/>

  <!-- Top Confidential Classification Pill -->
  <g transform="translate(370, 50)">
    <rect x="-240" y="-16" width="480" height="32" rx="16" fill="#0c0e18" stroke="#ff0066" stroke-width="2"/>
    <text x="0" y="5" font-family="'Courier New', monospace" font-size="12" font-weight="900" text-anchor="middle" fill="#ff0066" letter-spacing="3">
      ★ TOP SECRET // ARCADE OVERRIDE PROTOCOL ★
    </text>
  </g>

  <text x="370" y="96" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="3">
    THE LEGENDARY KONAMI CHEAT CODE
  </text>
  <text x="370" y="112" font-family="'Courier New', monospace" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#ffe600" letter-spacing="2">
    ENTER SEQUENCE ON TITLE SCREENS FOR MAXIMUM POWER
  </text>

  <!-- 10 Controller Buttons Row -->
  ${keyElements}

  <!-- Unlocked Perks Row -->
  <g transform="translate(370, 222)">
    <!-- Perk 1 -->
    <rect x="-310" y="-14" width="140" height="28" rx="6" fill="#121828" stroke="#00f0ff" stroke-width="1.5"/>
    <text x="-240" y="4" font-family="'Courier New', monospace" font-size="10" font-weight="900" text-anchor="middle" fill="#00f0ff">⚡ +30 LIVES</text>

    <!-- Perk 2 -->
    <rect x="-150" y="-14" width="140" height="28" rx="6" fill="#121828" stroke="#ff0066" stroke-width="1.5"/>
    <text x="-80" y="4" font-family="'Courier New', monospace" font-size="10" font-weight="900" text-anchor="middle" fill="#ff0066">🔓 100 UNLOCKED</text>

    <!-- Perk 3 -->
    <rect x="10" y="-14" width="140" height="28" rx="6" fill="#121828" stroke="#00e575" stroke-width="1.5"/>
    <text x="80" y="4" font-family="'Courier New', monospace" font-size="10" font-weight="900" text-anchor="middle" fill="#00e575">🎮 SOUND TEST</text>

    <!-- Perk 4 -->
    <rect x="170" y="-14" width="140" height="28" rx="6" fill="#121828" stroke="#ffe600" stroke-width="1.5"/>
    <text x="240" y="4" font-family="'Courier New', monospace" font-size="10" font-weight="900" text-anchor="middle" fill="#ffe600">🏆 GOD MODE</text>
  </g>

  <!-- Bottom Operator Verification -->
  <text x="370" y="266" font-family="'Courier New', monospace" font-size="9" font-weight="bold" text-anchor="middle" fill="#8899aa" letter-spacing="1.5">
    CLASSIFIED R&amp;D DIAGNOSTIC MATRIX • AUTH: ARCADE MASTER 2026 • ZERO REBUILD REQUIRED
  </text>
</svg>
`;
}

module.exports = {
  buildInsertCoinSvg,
  generateInsertCoinGif,
  buildArcadeTicketSvg,
  buildHallOfFameSvg,
  buildKonamiCheatCardSvg
};
