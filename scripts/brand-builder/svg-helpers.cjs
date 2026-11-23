'use strict';

/**
 * SVG generating helpers, filters, gradients, and pixel-art renderers.
 */

function renderSpriteToSvg(sprite, x, y, pixelSize = 4, extraAttrs = '') {
  const rects = [];
  for (let r = 0; r < sprite.length; r++) {
    const row = sprite[r];
    for (let c = 0; c < row.length; c++) {
      const color = row[c];
      if (color) {
        rects.push(`<rect x="${x + c * pixelSize}" y="${y + r * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`);
      }
    }
  }
  return `<g shape-rendering="crispEdges" ${extraAttrs}>\n${rects.join('\n')}\n</g>`;
}

function getCommonDefs() {
  return `
  <defs>
    <!-- CRT Scanlines pattern -->
    <pattern id="crt-scanlines" width="100" height="4" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="100" y2="0" stroke="#000000" stroke-width="1.2" opacity="0.32"/>
    </pattern>

    <!-- Retro Wireframe Grid pattern -->
    <pattern id="retro-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a1f4d" stroke-width="1.2" stroke-opacity="0.6"/>
    </pattern>

    <!-- Glowing Filters -->
    <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5" result="blur1"/>
      <feGaussianBlur stdDeviation="8" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="glow-magenta" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5" result="blur1"/>
      <feGaussianBlur stdDeviation="8" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur1"/>
      <feGaussianBlur stdDeviation="6" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="cabinet-shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#02040a" flood-opacity="0.75"/>
    </filter>

    <!-- Gradients -->
    <linearGradient id="bg-synthwave" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a0518"/>
      <stop offset="45%" stop-color="#140a2e"/>
      <stop offset="75%" stop-color="#241242"/>
      <stop offset="100%" stop-color="#0d081e"/>
    </linearGradient>

    <linearGradient id="neon-text-candy" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff3377"/>
      <stop offset="40%" stop-color="#ff0055"/>
      <stop offset="70%" stop-color="#00f0ff"/>
      <stop offset="100%" stop-color="#ffe600"/>
    </linearGradient>

    <linearGradient id="gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff5a0"/>
      <stop offset="30%" stop-color="#ffc700"/>
      <stop offset="70%" stop-color="#d48800"/>
      <stop offset="100%" stop-color="#fff080"/>
    </linearGradient>

    <linearGradient id="cabinet-body" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="15%" stop-color="#182234"/>
      <stop offset="50%" stop-color="#202b40"/>
      <stop offset="85%" stop-color="#182234"/>
      <stop offset="100%" stop-color="#0d1117"/>
    </linearGradient>

    <linearGradient id="cabinet-screen-bezel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#101520"/>
      <stop offset="100%" stop-color="#05080f"/>
    </linearGradient>

    <radialGradient id="screen-crt-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1a3854" stop-opacity="0.8"/>
      <stop offset="80%" stop-color="#08101a" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#03060a" stop-opacity="1.0"/>
    </radialGradient>
  </defs>
  `;
}

module.exports = {
  renderSpriteToSvg,
  getCommonDefs
};
