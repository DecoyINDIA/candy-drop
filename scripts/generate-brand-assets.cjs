'use strict';

/**
 * Main generator script for all Arcade Universe brand and motion assets.
 * Outputs crisp SVG and optimized GIF assets to assets/brand/ and docs/assets/.
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  buildArcadeCabinetSvg,
  buildCandyArcadeBannerSvg,
  buildSocialPreviewSvg,
  generateArcadeCabinetGif
} = require('./brand-builder/build-banners.cjs');

const {
  mascotData,
  buildMascotCardSvg,
  buildMascotsLineupSvg
} = require('./brand-builder/build-mascots.cjs');

const {
  buildInsertCoinSvg,
  generateInsertCoinGif,
  buildArcadeTicketSvg,
  buildHallOfFameSvg,
  buildKonamiCheatCardSvg
} = require('./brand-builder/build-arcade-props.cjs');

const {
  badgesData,
  buildSingleBadgeSvg,
  buildAchievementBadgesRackSvg
} = require('./brand-builder/build-badges.cjs');

const rootDir = path.resolve(__dirname, '..');
const brandDir = path.join(rootDir, 'assets', 'brand');
const docsAssetsDir = path.join(rootDir, 'docs', 'assets');

// Ensure directories exist
fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(docsAssetsDir, { recursive: true });

console.log('🎮 Generating Arcade Universe brand & motion assets...');

const generatedFiles = [];

function saveAsset(filename, content) {
  const brandPath = path.join(brandDir, filename);
  const docsPath = path.join(docsAssetsDir, filename);

  fs.writeFileSync(brandPath, content);
  fs.writeFileSync(docsPath, content);

  const stats = fs.statSync(brandPath);
  generatedFiles.push({
    filename,
    size: stats.size,
    isBinary: Buffer.isBuffer(content)
  });
  console.log(`  ✔ ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
}

// 1. Hero Banners & Cabinet
console.log('\n[1/4] Generating Hero Banners & Arcade Cabinet...');
saveAsset('arcade-cabinet-hero.svg', buildArcadeCabinetSvg());
saveAsset('arcade-cabinet-hero.gif', generateArcadeCabinetGif());
saveAsset('candy-arcade-banner.svg', buildCandyArcadeBannerSvg());
saveAsset('social-preview.svg', buildSocialPreviewSvg());

// 2. Arcade Props
console.log('\n[2/4] Generating Arcade Props & Ephemera...');
saveAsset('insert-coin.svg', buildInsertCoinSvg());
saveAsset('insert-coin.gif', generateInsertCoinGif());
saveAsset('arcade-ticket.svg', buildArcadeTicketSvg());
saveAsset('hall-of-fame.svg', buildHallOfFameSvg());
saveAsset('konami-cheat-card.svg', buildKonamiCheatCardSvg());

// 3. Genre Mascots
console.log('\n[3/4] Generating 8 Genre Mascots & Lineup...');
for (const mascot of mascotData) {
  saveAsset(`mascot-${mascot.id}.svg`, buildMascotCardSvg(mascot));
}
saveAsset('mascots-lineup.svg', buildMascotsLineupSvg());

// 4. Retro Achievement Badges
console.log('\n[4/4] Generating Retro Achievement Badges...');
for (const badge of badgesData) {
  saveAsset(`badge-${badge.id}.svg`, buildSingleBadgeSvg(badge));
}
saveAsset('achievement-badges.svg', buildAchievementBadgesRackSvg());

console.log('\n✨ All brand assets successfully generated!');
console.log(`Total unique assets created: ${generatedFiles.length}`);
console.log(`Saved to both: \n  • ${brandDir}\n  • ${docsAssetsDir}\n`);
