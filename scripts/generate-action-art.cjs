'use strict';
// Original illustrated card scenes, generated with SVG primitives and no dependencies.
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, '..', 'assets', 'art');
const circle = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, r, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const line = (d, color, width = 3, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const shape = (d, color, extra = '') => `<path d="${d}" fill="${color}" ${extra}/>`;
const ellipse = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const palette = ['#f58d9f', '#f3b078', '#f1cf88', '#88dcc3', '#93d8e5', '#bdade7'];
function stars(color = '#e4dcff') {
  return Array.from({ length: 46 }, (_, i) => circle((i * 137 + 29) % 600, (i * 83 + 17) % 380, i % 5 === 0 ? 1.8 : 1, color, `opacity="${0.18 + i % 4 * 0.12}"`)).join('');
}
function bubble(x, y, r, color) { return circle(x, y + 3, r, '#0e304d55') + circle(x, y, r, color) + circle(x - r * .32, y - r * .34, r * .23, '#ffffff85'); }
function leaf(x, y, rotation, color, scale = 1) { return `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${ellipse(0, 0, 13, 32, color)}${line('M0 25V-23', '#d2e1b333', 1.5)}</g>`; }
function shell(top, bottom, content, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><radialGradient id="halo"><stop stop-color="#c7c4ff" stop-opacity=".22"/><stop offset="1" stop-color="#c7c4ff" stop-opacity="0"/></radialGradient><linearGradient id="metal" x2="1" y2="1"><stop stop-color="#fffef2"/><stop offset=".35" stop-color="#e4eee9"/><stop offset="1" stop-color="#76939e"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="6"/></filter>${defs}</defs>${rect(0, 0, 600, 380, 0, 'url(#bg)')}${content}</svg>\n`;
}
const scenes = {};

// A playable-looking formation and a banked ball arc identify the brick breaker.
{
  let s = circle(300, 170, 270, 'url(#halo)');
  for (let x = 50; x < 600; x += 50) s += line(`M${x} 0V380`, '#8290c918', 1);
  for (let y = 38; y < 380; y += 38) s += line(`M0 ${y}H600`, '#8290c918', 1);
  s += rect(68, 47, 464, 288, 16, '#111d3033', 'stroke="#91d6e14d" stroke-width="3"');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) {
    if (row === 2 && col >= 3 && col <= 4) continue;
    const x = 94 + col * 59, y = 76 + row * 37;
    s += rect(x, y + 5, 52, 26, 5, '#0b162c88') + rect(x, y, 52, 26, 5, palette[row + (col % 3 === 0 ? 2 : 0)]) + rect(x + 7, y + 4, 38, 3, 1, '#ffffff65');
  }
  s += line('M170 297L423 194 340 126', '#f5dfa3', 2.5, 'stroke-dasharray="4 9" opacity=".65"');
  s += shape('M340 125L353 108 360 132Z', '#86e0d3') + shape('M365 148L380 139 386 153Z', '#f0d39b') + shape('M326 151L333 164 315 165Z', '#e7a0c9');
  s += ellipse(219, 316, 86, 11, '#0b172b99') + rect(149, 291, 140, 19, 10, '#6fceda') + rect(162, 294, 114, 4, 2, '#d4f8eb');
  s += circle(422, 195, 16, '#fff0ae44', 'filter="url(#blur)"') + circle(422, 195, 8, '#fff4cb');
  scenes['prism-breaker'] = shell('#18203b', '#30203c', s);
}

// A winding snake, fruit, stones, and garden borders are kept inside the crop-safe area.
{
  let s = rect(84, 45, 432, 290, 27, '#708b6850') + rect(96, 55, 408, 270, 20, '#dbe1b9');
  for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) if ((r + c) % 2 === 0) s += rect(104 + c * 33, 62 + r * 32, 32, 32, 2, '#c7d4a9');
  s += line('M181 263H250Q275 263 275 238V204Q275 180 249 180H210Q184 180 184 153V136Q184 110 212 110H321Q347 110 347 137V163', '#688d55', 30);
  s += line('M181 258H250Q271 258 271 235V204Q271 184 249 184H210Q180 184 180 153V136Q180 106 212 106H321Q351 106 351 137V163', '#91bd6b', 22);
  s += ellipse(351, 174, 21, 26, '#acd784') + circle(341, 178, 3.7, '#2e4f40') + circle(361, 178, 3.7, '#2e4f40');
  s += line('M351 194V201M351 201L346 206M351 201L356 206', '#ce7d82', 2.5);
  s += shape('M407 206C380 188 368 218 381 241Q397 265 407 252Q422 265 438 240C451 215 431 191 407 206', '#dc8378') + line('M407 209Q402 198 412 188', '#78694b', 4) + ellipse(421, 192, 12, 6, '#658b55', 'transform="rotate(-25 421 192)"');
  for (const [x, y] of [[133, 290], [466, 104], [389, 293]]) s += ellipse(x, y, 17, 10, '#8e9c7c') + ellipse(x - 4, y - 3, 9, 4, '#b8bea1');
  for (let i = 0; i < 8; i++) s += leaf(45 + i % 2 * 508, 50 + i * 47, i % 2 ? -30 : 30, i % 3 ? '#8fa679' : '#b7c294');
  scenes['serpent-garden'] = shell('#e4e5cf', '#bccdad', s);
}

{
  let s = stars() + circle(435, 120, 240, 'url(#halo)') + ellipse(125, 320, 210, 70, '#3c345b33', 'transform="rotate(-25 125 320)"');
  function asteroid(x, y, r, rotation) {
    let d = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, n = r * (i % 3 === 0 ? .82 : 1); d += `${i ? 'L' : 'M'}${Math.cos(a) * n} ${Math.sin(a) * n}`; }
    return `<g transform="translate(${x} ${y}) rotate(${rotation})">${shape(d + 'Z', '#55516b', 'stroke="#aca0c5" stroke-width="3"')}${ellipse(-r * .23, -r * .2, r * .2, r * .16, '#32334e')}${ellipse(r * .35, r * .2, r * .15, r * .18, '#78708e')}${line(`M${-r * .5} ${r * .45}Q0 ${r * .6} ${r * .35} ${r * .44}`, '#9990b2', 2)}</g>`;
  }
  s += asteroid(178, 108, 54, 15) + asteroid(443, 220, 67, -25) + asteroid(150, 294, 28, -20) + asteroid(433, 73, 20, 30);
  s += line('M238 271Q291 243 299 194', '#b3a4dd55', 2, 'stroke-dasharray="5 10"');
  s += `<g transform="translate(300 205) rotate(-38)">${shape('M-17 14L-9 55 0 40 9 56 17 14Z', '#e29b72')}${shape('M-7 18L0 45 8 18Z', '#ffe2a0')}${shape('M0-43L-27 22 0 9 27 22Z', '#e7ddf4', 'stroke="#b8a0db" stroke-width="3"')}${shape('M0-26L-9 2 9 2Z', '#7197ad')}${line('M0-26V1', '#b5d7de', 2)}</g>`;
  s += line('M333 152L340 141M352 122L359 111M369 93L376 82', '#f2d598', 4);
  scenes['meteor-drift'] = shell('#151a30', '#241f3d', s);
}

{
  let s = ''; for (let i = 0; i < 7; i++) s += shape(`M${i * 110 - 80} 0h35l130 380h-100Z`, '#9ce1d009');
  s += rect(135, 35, 330, 270, 24, '#0c284965', 'stroke="#8bd8d433" stroke-width="2"');
  const colors = ['#ed8fa4', '#edc879', '#86dac2', '#94bde7'];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
    if (row === 3 && col > 3 || row === 2 && col === 5) continue;
    s += bubble(165 + col * 37 + row % 2 * 18, 66 + row * 33, 17, colors[(Math.floor(col / 2) + row) % 4]);
  }
  s += line('M300 317L449 224 393 178', '#c3f0db99', 2.5, 'stroke-dasharray="3 8"');
  s += bubble(418, 202, 17, '#86dac2') + bubble(342, 197, 17, '#edc879') + bubble(365, 220, 17, '#edc879') + bubble(384, 248, 17, '#edc879');
  s += line('M341 185l-4-9M351 182l4-10M369 205l8-6', '#c8e7b3', 2);
  s += ellipse(300, 341, 53, 9, '#091e3580') + shape('M254 331a46 46 0 0 1 92 0Z', '#80b6b1') + bubble(300, 311, 22, '#86dac2') + bubble(374, 332, 14, '#ed8fa4');
  for (let i = 0; i < 9; i++) s += circle(60 + i * 63, 280 + i * 39 % 100, 4 + i % 3 * 3, 'none', 'stroke="#95d9d42d" stroke-width="2"');
  scenes['bubble-bay'] = shell('#28546a', '#142c45', s);
}

{
  let s = ''; for (let i = 0; i < 7; i++) s += shape(`M${i * 113 - 60} 0h24l130 380h-74Z`, '#def0ca18');
  s += shape('M0 350Q105 334 221 355T600 347V380H0Z', '#d6c09c');
  for (const [x, top, bottom] of [[92, 155, 267], [372, 126, 241], [554, 162, 292]]) {
    s += rect(x, -35, 54, top + 35, 14, '#ab6d79') + rect(x, bottom, 54, 160, 14, '#ab6d79');
    s += rect(x + 5, top - 14, 44, 8, 4, '#e9a291') + rect(x + 5, bottom + 6, 44, 8, 4, '#e9a291');
    s += line(`M${x + 17} 5V${top - 31}M${x + 37} ${bottom + 27}V366`, '#7b526d', 4);
  }
  s += line('M182 233Q212 264 239 203T341 184', '#d5e8ba55', 3, 'stroke-dasharray="3 9"');
  s += `<g transform="translate(271 194) rotate(-12)">${shape('M-29 0L-58-25-55 25Z', '#e8a56e')}${ellipse(0, 0, 38, 27, '#f4c38a')}${ellipse(-7, 11, 13, 8, '#da905b', 'transform="rotate(-25 -7 11)"')}${circle(19, -8, 10, '#fff3d8')}${circle(23, -8, 4.7, '#263b55')}${line('M32 11q6 3 10-2', '#b47860', 2)}</g>`;
  for (let i = 0; i < 7; i++) s += line(`M${i * 100 + 35} 370Q${i * 100 + 12} 326 ${i * 100 + 34} 312`, '#487c70', 7);
  for (let i = 0; i < 18; i++) s += circle((i * 113 + 29) % 600, 40 + i * 61 % 280, 2 + i % 3 * 2, 'none', 'stroke="#d2eee34d" stroke-width="1.5"');
  scenes['flappy-fin'] = shell('#8bc6d0', '#396c89', s);
}

{
  let s = circle(300, 170, 200, 'url(#halo)');
  for (let i = 5; i >= 0; i--) { const k = .2 + i * .155, x = 300 - 320 * k, y = 170 - 190 * k; s += rect(x, y, 640 * k, 380 * k, 35 * k, 'none', `stroke="${i % 2 ? '#7970a4' : '#a58ec7'}" stroke-width="${2 + i * .7}" opacity="${.25 + i * .1}"`); }
  s += line('M300 170L0 380M300 170L600 380M300 170L0 0M300 170L600 0', '#8474ac55', 2);
  s += line('M300 170L177 380M300 170L425 380', '#ada0e166', 3);
  s += shape('M142 104H257V279L142 315Z', '#e09ab455') + shape('M344 104H459V315L344 279Z', '#e09ab455');
  s += line('M142 105H257V279L142 315ZM344 105H459V315L344 279Z', '#e7a5c8', 3);
  s += line('M282 111H319V274H282', '#88e0d4', 5) + line('M298 130v29m-9-9 9 9 9-9', '#a7f2da', 3);
  s += ellipse(300, 328, 54, 11, '#0e142b99') + shape('M300 257L265 314 300 304 335 314Z', '#c4bbf0', 'stroke="#e3d9ff" stroke-width="2"') + shape('M300 272L287 297H313Z', '#5d6898') + shape('M285 319L300 354 316 319Z', '#dfb47a') + shape('M294 318L300 340 307 318Z', '#fbe8af');
  scenes['tunnel-dash'] = shell('#171a35', '#322743', s);
}

{
  let s = rect(111, 0, 378, 380, 0, '#2c2635');
  for (let r = 0; r < 9; r++) for (let c = 0; c < 8; c++) s += rect(112 + c * 49 - r % 2 * 24, r * 44, 45, 39, 3, (r + c) % 3 ? '#40323d' : '#47353d');
  s += rect(85, 0, 30, 380, 0, '#78605d') + rect(486, 0, 30, 380, 0, '#78605d');
  for (const [x, y, w] of [[139, 289, 137], [325, 224, 133], [166, 147, 132], [318, 70, 133]]) s += rect(x, y + 6, w, 17, 4, '#251f2a') + rect(x, y, w, 15, 4, '#a58b77') + rect(x + 4, y + 1, w - 8, 4, 2, '#cfb694');
  s += line('M227 284Q275 125 373 215', '#e9bf8c77', 2.5, 'stroke-dasharray="4 8"');
  s += `<g transform="translate(282 185) rotate(12)">${rect(-14, -20, 29, 35, 8, '#6fbaa9')}${circle(0, -30, 14, '#e1b799')}${shape('M-15-33Q-5-55 14-36L17-28H-16Z', '#4b5469')}${line('M-12-14L-28-23M13-13L28-3', '#87d3b8', 8)}${line('M-7 14L-14 31M8 14L21 24', '#a3b8b0', 9)}</g>`;
  s += shape('M355 116l10 15-10 15-10-15Z', '#eacf91') + shape('M230 213l9 13-9 13-9-13Z', '#eacf91');
  s += shape('M0 343Q40 318 80 345T160 344T240 345T320 342T400 344T480 343T560 342L600 340V380H0Z', '#dc6f53') + shape('M0 360Q44 335 88 358T176 359T264 357T352 360T440 355T528 359L600 355V380H0Z', '#ee9b5c');
  s += line('M145 357q40-13 80 1M302 364q45-15 80-1M451 351h26', '#ffd295', 5);
  scenes['lava-lift'] = shell('#54414a', '#8a4b46', s);
}

{
  let s = rect(66, 41, 468, 298, 19, '#111b30');
  const paths = ['M91 68H258V112H179V155H95', 'M298 68H505V110H429V152H506', 'M91 199H178V241H259V309H91V281H133', 'M299 151H343V241H302', 'M385 199H502V309H427V268H386', 'M215 153H258V197H215', 'M300 284H345V310'];
  for (const d of paths) s += line(d, '#3e526c', 15) + line(d, '#657594', 3);
  for (const [x, y] of [[104, 176], [140, 176], [179, 176], [277, 91], [277, 124], [277, 158], [277, 193], [277, 230], [320, 127], [361, 127], [402, 127], [364, 176], [364, 213], [364, 253], [454, 175], [489, 175]]) s += circle(x, y, 3, '#f0cd88');
  s += circle(228, 247, 75, '#f4ce7630') + circle(228, 247, 40, '#f4ce7630') + circle(228, 247, 17, '#efd18d') + circle(234, 243, 3.4, '#624a43');
  const ghost = (x, y, color) => shape(`M${x - 18} ${y + 19}V${y - 2}a18 18 0 0 1 36 0v21l-9-7-9 7-9-7Z`, color) + ellipse(x - 6, y - 2, 4, 6, '#f8f0ef') + ellipse(x + 6, y - 2, 4, 6, '#f8f0ef') + circle(x - 5, y, 2, '#45425f') + circle(x + 7, y, 2, '#45425f');
  s += ghost(403, 175, '#c69fb8') + ghost(139, 127, '#91c8cf') + ghost(462, 239, '#b4a4d1');
  scenes['ghost-lantern'] = shell('#1d263b', '#25283e', s);
}

{
  let s = rect(72, 47, 456, 286, 22, '#b9bdb055') + rect(84, 56, 432, 266, 15, '#f2ead9', 'stroke="#b4b9a9" stroke-width="3"');
  for (let x = 104; x < 510; x += 22) for (let y = 75; y < 315; y += 22) s += circle(x, y, .8, '#b6b8a4');
  s += line('M139 285L490 121 376 74 277 222', '#c48365', 2.5, 'stroke-dasharray="5 8"');
  s += rect(250, 155, 113, 12, 6, '#43827f') + rect(397, 235, 12, 52, 6, '#43827f');
  for (const [x, y] of [[222, 98], [376, 106], [449, 179], [277, 222], [356, 279]]) s += circle(x, y + 4, 22, '#c5b69e55') + circle(x, y, 21, '#bf795b') + circle(x, y, 14, '#f0d6a8') + circle(x, y, 7, '#bf795b');
  s += `<g transform="translate(139 285) rotate(-25)">${rect(-14, -11, 49, 22, 7, '#477777')}${circle(0, 0, 17, '#e4b679')}${circle(0, 0, 8, '#bf8b59')}</g>`;
  s += circle(489, 122, 8, '#355e69') + line('M497 108l9-8M504 124h10M497 139l8 7', '#b78162', 2.5);
  scenes['ricochet-range'] = shell('#e7dfd0', '#d2ceba', s);
}

{
  let s = stars('#a1d7d1') + circle(300, 190, 180, 'url(#halo)');
  for (const r of [74, 106, 158]) s += circle(300, 190, r, 'none', `stroke="#80b7bd${r === 106 ? '77' : '25'}" stroke-width="1.5"`);
  s += shape('M300 150L309 177 337 178 315 195 322 223 300 207 277 223 285 195 263 178 291 177Z', '#edd7a7') + circle(300, 188, 13, '#fff0c6');
  s += line('M221 119A106 106 0 0 1 374 114', '#7bd5c4', 17) + line('M223 114A113 113 0 0 1 371 108', '#d0f5df', 3);
  for (const [x, y, dx, dy] of [[270, 72, -18, -48], [439, 263, 46, 25], [173, 251, -46, 24], [369, 61, 27, -45]]) {
    s += line(`M${x + dx} ${y + dy}L${x} ${y}`, '#d89ca15c', 7) + circle(x, y, 9, '#eaa8ac') + circle(x - 2, y - 3, 3, '#ffe1d7');
  }
  s += line('M263 108l-7-13M276 102l1-15M287 105l9-10', '#e4ecd0', 3);
  s += circle(427, 138, 8, '#99d9b5') + line('M423 138h8M427 134v8', '#214858', 2);
  scenes['shield-spin'] = shell('#182d3a', '#223c48', s);
}

{
  let s = ''; for (let i = 0; i < 9; i++) s += leaf(i * 83 - 10, 10 + i % 2 * 355, i % 2 ? -55 : 55, i % 3 ? '#bbc59c' : '#ccd1b0', 1.7);
  s += ellipse(300, 335, 174, 17, '#cbb39844');
  s += line('M143 280Q254 287 342 190T462 120', '#fff4da', 18) + line('M163 275Q254 271 339 188T453 123', '#fffef0', 5);
  const peach = (x, y, angle) => `<g transform="translate(${x} ${y}) rotate(${angle})">${shape('M0-25C-37-42-53-9-29 25Q-9 43 0 31Q12 42 30 22C52-11 31-42 0-25', '#e99c89')}${line('M0-22Q-12 0-4 27', '#c47f79', 2)}${ellipse(13, -36, 18, 7, '#799e76', 'transform="rotate(-20 13 -36)"')}</g>`;
  s += peach(190, 169, -20) + peach(398, 251, 25);
  s += `<g transform="translate(297 144) rotate(23)">${shape('M-35 0A35 35 0 0 1 35 0Z', '#cc806e')}${shape('M-29-3A29 29 0 0 1 29-3Z', '#f3c38c')}${line('M0-7V-29M-6-6L-24-20M6-6L24-20', '#d78f64', 2)}${shape('M-31 18A32 32 0 0 0 32 18Z', '#d88d78')}${shape('M-26 20A26 26 0 0 0 26 20Z', '#f4c68f')}</g>`;
  s += circle(440, 119, 23, '#505468') + circle(434, 111, 8, '#7d7e8a') + rect(435, 89, 10, 12, 3, '#6d695c') + line('M440 89q15-13 9-22', '#96865f', 3) + line('M450 66l3-8M445 65l-6-5M455 70h8', '#dfab6d', 3);
  for (const [x, y] of [[270, 195], [302, 203], [333, 126], [322, 116], [370, 213]]) s += ellipse(x, y, 4, 7, '#e9a76b', `transform="rotate(${x} ${x} ${y})"`);
  scenes['blade-bloom'] = shell('#f0ded0', '#ddc6b0', s);
}

{
  let s = ''; for (let i = 0; i < 10; i++) s += leaf(i < 5 ? 51 + i * 14 : 474 + i * 9, 47 + i * 34, i % 2 ? -35 : 35, i % 3 ? '#a4b595' : '#b9c2a1', 1.3);
  s += rect(172, 22, 256, 344, 51, '#987c58') + rect(184, 34, 232, 320, 43, '#376154') + rect(195, 46, 210, 293, 33, 'none', 'stroke="#94b49a" stroke-width="2"');
  for (let y = 90; y < 310; y += 35) s += line(`M202 ${y}Q300 ${y + 54}398 ${y}`, '#a0c1a225', 1);
  const flower = (x, y, lit) => {
    let f = ''; for (let i = 0; i < 6; i++) f += circle(x + Math.cos(i * Math.PI / 3) * 14, y + Math.sin(i * Math.PI / 3) * 14, 12, lit ? '#e4c98b' : '#85aa8b');
    return f + circle(x, y, 14, lit ? '#f5e1ae' : '#c1ccac') + circle(x, y, 6, '#9c7854');
  };
  s += flower(246, 116, true) + flower(300, 91, false) + flower(354, 116, true) + flower(269, 188, true) + flower(333, 188, false);
  s += line('M202 216L231 278M398 216L368 278M383 214V320', '#b5c9ad', 7);
  s += line('M241 292L285 307M358 292L314 280', '#e4bc7b', 11) + circle(241, 292, 8, '#a17c52') + circle(358, 292, 8, '#a17c52');
  s += line('M321 259Q353 229 348 212', '#b5d0c66b', 2, 'stroke-dasharray="3 6"') + circle(348, 225, 8, 'url(#metal)') + rect(391, 321, 11, 9, 2, '#c4cbb0');
  s += line('M276 342h47', '#1f403b', 9);
  scenes['pinball-grove'] = shell('#dbe2cb', '#b9c9ac', s);
}

fs.mkdirSync(out, { recursive: true });
for (const [id, svg] of Object.entries(scenes)) fs.writeFileSync(path.join(out, id + '.svg'), svg);
console.log(`Generated ${Object.keys(scenes).length} original action card illustrations.`);
