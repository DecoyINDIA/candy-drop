'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { CATALOG } = require('../assets/core.js');

const rootDir = path.resolve(__dirname, '..');

function verifyAll() {
  const issues = [];
  const warnings = [];
  const stats = {
    linksChecked: 0,
    imagesChecked: 0,
    filesChecked: 0,
    catalogCoverage: 0
  };

  console.log('=== ARCADE UNIVERSE COMPREHENSIVE QA & VERIFICATION ===\n');

  // 1. Files to verify
  const targetFiles = [
    'README.md',
    'docs/ABOUT.md',
    'docs/REPO_METADATA.md',
    'docs/game-api.md',
    'portal.html'
  ];

  const presentFiles = [];
  for (const relPath of targetFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      presentFiles.push(relPath);
      stats.filesChecked++;
    } else {
      if (relPath === 'README.md') {
        issues.push(`CRITICAL: README.md does not exist!`);
      } else {
        warnings.push(`File ${relPath} not found yet (may be pending author commit).`);
      }
    }
  }

  // 2. Map of catalog games
  const catalogGameIds = new Set(CATALOG.map(g => g.id));
  const seenCatalogIdsInReadme = new Set();

  // Helper to resolve github.io URL to local path
  function mapGithubIoToLocal(url) {
    const base = 'https://decoyindia.github.io/candy-drop/';
    if (url === base || url === base + 'index.html') {
      return 'index.html';
    }
    if (url === base + 'arcade.html') {
      return 'arcade.html';
    }
    if (url.startsWith(base + 'games/')) {
      const rest = url.substring(base.length);
      return rest;
    }
    if (url.startsWith(base + 'assets/')) {
      const rest = url.substring(base.length);
      return rest;
    }
    if (url.startsWith(base)) {
      const rest = url.substring(base.length);
      return rest;
    }
    return null;
  }

  // Helper to check valid image
  function checkImageFile(imageRelPath, sourceFile) {
    stats.imagesChecked++;
    // Handle query params or hashes
    const cleanPath = imageRelPath.split('?')[0].split('#')[0];
    const fullPath = path.resolve(rootDir, cleanPath);

    if (!fs.existsSync(fullPath)) {
      issues.push(`Missing image asset: "${imageRelPath}" referenced in ${sourceFile} does not exist at ${fullPath}`);
      return false;
    }

    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      issues.push(`Empty image asset: "${imageRelPath}" referenced in ${sourceFile} is 0 bytes`);
      return false;
    }

    const ext = path.extname(cleanPath).toLowerCase();
    if (ext === '.svg') {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('<svg')) {
        issues.push(`Invalid SVG: "${imageRelPath}" has no <svg opening tag`);
      }
      if (!content.includes('</svg>')) {
        issues.push(`Invalid SVG: "${imageRelPath}" is missing </svg> closing tag`);
      }
      if (!content.includes('viewBox') && (!content.includes('width=') || !content.includes('height='))) {
        warnings.push(`SVG without viewBox or explicit dimensions: "${imageRelPath}"`);
      }
    } else if (ext === '.gif') {
      const buf = fs.readFileSync(fullPath);
      const header = buf.subarray(0, 6).toString('ascii');
      if (header !== 'GIF87a' && header !== 'GIF89a') {
        issues.push(`Invalid GIF header: "${imageRelPath}" has header "${header}", expected GIF87a or GIF89a`);
      }
    } else if (ext === '.png') {
      const buf = fs.readFileSync(fullPath);
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      if (!isPng) {
        issues.push(`Invalid PNG header: "${imageRelPath}"`);
      }
    }

    return true;
  }

  // 3. Inspect each file
  for (const relPath of presentFiles) {
    const fullPath = path.join(rootDir, relPath);
    let content = fs.readFileSync(fullPath, 'utf8');

    // For HTML files, strip out <script> and <style> bodies before scanning static HTML tags
    let markupContent = content;
    if (relPath.endsWith('.html')) {
      markupContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    }

    // Check link references [text](url) in markdown
    const mdLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = mdLinkRegex.exec(content)) !== null) {
      stats.linksChecked++;
      const [full, linkText, hrefRaw] = match;
      const href = hrefRaw.trim();

      // Skip anchors inside the same file
      if (href.startsWith('#')) continue;
      // Skip mailto or external protocols
      if (href.startsWith('mailto:')) continue;

      if (href.startsWith('https://decoyindia.github.io/candy-drop/')) {
        const localRel = mapGithubIoToLocal(href);
        if (localRel) {
          const localFull = path.join(rootDir, localRel);
          if (!fs.existsSync(localFull)) {
            issues.push(`Broken GitHub Pages link in ${relPath}: [${linkText}](${href}) -> local ${localRel} not found!`);
          } else {
            // Track game id if game link
            const gameMatch = href.match(/\/games\/([a-z0-9-]+)\/index\.html/);
            if (gameMatch) {
              seenCatalogIdsInReadme.add(gameMatch[1]);
              if (!catalogGameIds.has(gameMatch[1])) {
                issues.push(`Link in ${relPath} references non-catalog game ID: ${gameMatch[1]}`);
              }
            } else if (href.endsWith('/index.html') || href.endsWith('/arcade.html')) {
              if (href.endsWith('/index.html')) seenCatalogIdsInReadme.add('candy-drop');
            }
          }
        }
      } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
        // Relative file link
        const cleanHref = href.split('#')[0].split('?')[0];
        if (cleanHref) {
          const dirOfFile = path.dirname(fullPath);
          const targetPath = path.resolve(dirOfFile, cleanHref);
          if (!fs.existsSync(targetPath)) {
            issues.push(`Broken relative link in ${relPath}: [${linkText}](${href}) -> ${cleanHref} does not exist`);
          }
        }
      }
    }

    // Check HTML <a href="..."> in markup
    const htmlLinkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
    while ((match = htmlLinkRegex.exec(markupContent)) !== null) {
      stats.linksChecked++;
      const href = match[1].trim();
      if (href.startsWith('#') || href.startsWith('mailto:')) continue;
      if (href.startsWith('https://decoyindia.github.io/candy-drop/')) {
        const localRel = mapGithubIoToLocal(href);
        if (localRel && !fs.existsSync(path.join(rootDir, localRel))) {
          issues.push(`Broken GitHub Pages link in HTML tag in ${relPath}: href="${href}" -> ${localRel} not found`);
        }
      } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
        const cleanHref = href.split('#')[0].split('?')[0];
        if (cleanHref) {
          const targetPath = path.resolve(path.dirname(fullPath), cleanHref);
          if (!fs.existsSync(targetPath)) {
            issues.push(`Broken relative HTML link in ${relPath}: href="${href}" -> ${cleanHref} does not exist`);
          }
        }
      }
    }

    // Check Markdown images ![alt](src)
    const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((match = mdImgRegex.exec(content)) !== null) {
      const src = match[2].trim();
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        checkImageFile(src, relPath);
      }
    }

    // Check HTML <img src="..."> in markup
    const htmlImgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    while ((match = htmlImgRegex.exec(markupContent)) !== null) {
      const src = match[1].trim();
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        checkImageFile(src, relPath);
      }
    }

    // Check for unclosed HTML tags (excluding void tags)
    const voidTags = new Set(['img', 'br', 'hr', 'input', 'meta', 'link']);
    const tagMatches = content.match(/<(\/?[a-zA-Z1-6]+)(?:\s+[^>]*?)?(\/?)>/g) || [];
    const openTags = [];
    for (const tagStr of tagMatches) {
      const parsed = tagStr.match(/<(\/?)([a-zA-Z1-6]+)(?:\s+[^>]*?)?(\/?)>/);
      if (!parsed) continue;
      const isClosing = parsed[1] === '/';
      const tagName = parsed[2].toLowerCase();
      const isSelfClosing = parsed[3] === '/' || voidTags.has(tagName);

      if (isSelfClosing) continue;
      if (!isClosing) {
        openTags.push({ tag: tagName, str: tagStr });
      } else {
        // Pop matching tag
        const lastIdx = openTags.findLastIndex(t => t.tag === tagName);
        if (lastIdx === -1) {
          warnings.push(`Closing tag </${tagName}> without matching open tag in ${relPath}`);
        } else {
          openTags.splice(lastIdx, 1);
        }
      }
    }
    if (openTags.length > 0) {
      // Filter out markdown code blocks or edge cases if needed
      for (const unclosed of openTags) {
        if (['p', 'div', 'table', 'tr', 'td', 'th', 'details', 'summary', 'span', 'b', 'strong', 'i', 'em', 'kbd'].includes(unclosed.tag)) {
          warnings.push(`Potentially unclosed tag <${unclosed.tag}> in ${relPath}`);
        }
      }
    }

    // Check tables in markdown files
    if (relPath.endsWith('.md')) {
      const lines = content.split('\n');
      let inTable = false;
      let colCount = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
          const cells = line.split('|').slice(1, -1);
          if (!inTable) {
            inTable = true;
            colCount = cells.length;
          } else {
            // separator or row
            if (line.includes('---')) {
              // separator
              if (cells.length !== colCount) {
                issues.push(`Table separator column mismatch at line ${i + 1} of ${relPath}: got ${cells.length}, expected ${colCount}`);
              }
            } else {
              if (cells.length !== colCount) {
                issues.push(`Table row column mismatch at line ${i + 1} of ${relPath}: got ${cells.length}, expected ${colCount}`);
              }
            }
          }
        } else {
          inTable = false;
        }
      }
    }
  }

  // 4. Validate All Brand Assets in assets/brand/ and docs/assets/
  const expectedBrandFiles = [
    'achievement-badges.svg',
    'arcade-cabinet-hero.gif',
    'arcade-cabinet-hero.svg',
    'arcade-ticket.svg',
    'badge-100-club.svg',
    'badge-coin-hunter.svg',
    'badge-daily-champion.svg',
    'badge-gold-medalist.svg',
    'badge-pixel-perfect.svg',
    'badge-speedrunner.svg',
    'candy-arcade-banner.svg',
    'hall-of-fame.svg',
    'insert-coin.gif',
    'insert-coin.svg',
    'konami-cheat-card.svg',
    'mascot-beat-master.svg',
    'mascot-neon-ninja.svg',
    'mascot-orbital-mech.svg',
    'mascot-pixel-king.svg',
    'mascot-pixel-striker.svg',
    'mascot-quantum-alchemist.svg',
    'mascot-sweet-hopper.svg',
    'mascot-velocity-racer.svg',
    'mascots-lineup.svg',
    'social-preview.svg'
  ];

  for (const dir of ['assets/brand', 'docs/assets']) {
    const fullDirPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullDirPath)) {
      issues.push(`Brand directory ${dir} does not exist`);
      continue;
    }
    for (const file of expectedBrandFiles) {
      const fp = path.join(fullDirPath, file);
      if (!fs.existsSync(fp)) {
        issues.push(`Expected brand asset missing: ${dir}/${file}`);
      } else {
        const stat = fs.statSync(fp);
        if (stat.size === 0) {
          issues.push(`Brand asset ${dir}/${file} is empty (0 bytes)`);
        }
      }
    }
  }

  // 5. Validate All 100 Art SVGs
  const artDir = path.join(rootDir, 'assets/art');
  for (const g of CATALOG) {
    const artPath = path.join(artDir, g.id + '.svg');
    if (!fs.existsSync(artPath)) {
      issues.push(`Missing catalog art SVG for game ${g.id} at assets/art/${g.id}.svg`);
    } else {
      const stat = fs.statSync(artPath);
      if (stat.size === 0) {
        issues.push(`Catalog art SVG for game ${g.id} is empty (0 bytes)`);
      }
    }
  }

  // Catalog coverage in README
  stats.catalogCoverage = seenCatalogIdsInReadme.size;

  console.log('--- VERIFICATION SUMMARY ---');
  console.log(`Files inspected: ${stats.filesChecked}`);
  console.log(`Links checked: ${stats.linksChecked}`);
  console.log(`Images checked: ${stats.imagesChecked}`);
  console.log(`Catalog games referenced: ${stats.catalogCoverage} / ${CATALOG.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Issues / Errors: ${issues.length}\n`);

  if (warnings.length > 0) {
    console.log('--- WARNINGS ---');
    warnings.forEach(w => console.log('  [WARN] ' + w));
    console.log();
  }

  if (issues.length > 0) {
    console.log('--- CRITICAL ISSUES ---');
    issues.forEach(err => console.log('  [FAIL] ' + err));
    console.log();
    return { success: false, issues, warnings, stats };
  } else {
    console.log('✔ All checks passed cleanly with 0 errors.');
    return { success: true, issues, warnings, stats };
  }
}

if (require.main === module) {
  const result = verifyAll();
  process.exit(result.success ? 0 : 1);
}

module.exports = { verifyAll };
