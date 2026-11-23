/* Orchard Keeper: a two-minute farm with crop cycles, water, weather and market contracts. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const CROPS = [{ name: 'Carrots', cost: 4, water: 1, grow: 8, sell: 15, color: '#eaa66f' }, { name: 'Berries', cost: 9, water: 2, grow: 15, sell: 34, color: '#de8895' }, { name: 'Pumpkins', cost: 18, water: 3, grow: 25, sell: 72, color: '#e8bc72' }];
  Arcade.mount({
    id: 'orchard-keeper', title: 'Orchard Keeper', category: 'Farm management', accent: '#d4e6a0',
    description: 'Nine little plots. A changing sky. Grow a very good season in two minutes.',
    howTo: ['Finish the 120-second season with at least 220 coins. Plant crops, harvest when ripe and sell into the changing market contract for a 50% bonus.', 'Arrows select a plot. T cycles seeds. Space / Work plants an empty plot or harvests a ripe one. R buys 10 water for 8 coins. Tap a plot or seed card to select it.', 'Carrots grow in 8s, berries in 15s, pumpkins in 25s. Rain refills water. Crops left ripe for 20s become overripe and sell for half, so stagger your planting.'],
    controls: [{ id: 'left', label: '← Plot', keys: ['ArrowLeft', 'KeyA'] }, { id: 'up', label: '↑ Plot', keys: ['ArrowUp', 'KeyW'] }, { id: 'down', label: '↓ Plot', keys: ['ArrowDown', 'KeyS'] }, { id: 'right', label: 'Plot →', keys: ['ArrowRight', 'KeyD'] }, { id: 'seed', label: 'Seeds', keys: ['KeyT'] }, { id: 'work', label: 'Work', keys: ['Space'] }, { id: 'water', label: 'Buy water', keys: ['KeyR'] }],
    medals: [2200, 5200, 8500],
    create(api) {
      let time = 120, clock = 0, coins = 36, water = 14, selected = 0, seed = 0, harvests = 0, contracts = 0, score = 0, ended = false, message = 'PLANT A LITTLE. GROW A LOT.';
      const plots = Array.from({ length: 9 }, () => ({ crop: -1, age: 0 })), weather = ['Sun', 'Cloud', 'Rain', 'Sun', 'Rain', 'Sun'], market = Array.from({ length: 4 }, () => Math.floor(api.random() * 3));
      let weatherIndex = 0, wanted = market[0];
      function hud() { score = Math.round(coins * 10 + harvests * 25); api.score(score); api.hud([{ label: 'Coins', value: coins + ' / 220' }, { label: 'Water', value: Math.floor(water) }, { label: 'Season', value: Math.ceil(time) + 's' }, { label: 'Weather', value: weather[weatherIndex] }]); }
      function work() {
        const p = plots[selected];
        if (p.crop < 0) { const c = CROPS[seed]; if (coins < c.cost || water < c.water) { message = coins < c.cost ? 'NEED MORE COINS FOR THESE SEEDS.' : 'LOW WATER. REFILL OR WAIT FOR RAIN.'; api.toast(message); return; } coins -= c.cost; water -= c.water; p.crop = seed; p.age = 0; message = c.name.toUpperCase() + ' PLANTED'; api.sound('click'); }
        else { const c = CROPS[p.crop]; if (p.age < c.grow) { message = 'GROWING. READY IN ' + Math.ceil(c.grow - p.age) + 's'; api.toast(message); return; } const bonus = p.crop === wanted, overripe = p.age > c.grow + 20; const earned = Math.round(c.sell * (bonus ? 1.5 : 1) * (overripe ? 0.5 : 1)); coins += earned; harvests++; if (bonus) contracts++; p.crop = -1; p.age = 0; message = '+' + earned + ' COINS' + (bonus ? ' · MARKET BONUS' : overripe ? ' · OVERRIPE' : ' · FRESH HARVEST'); api.sound('good', 1.2); const x = 66 + selected % 3 * 193, y = 139 + Math.floor(selected / 3) * 132; api.burst(x + 80, y + 40, c.color, 13); }
      }
      function refill() { if (coins < 8) { api.toast('Water refill costs 8 coins.'); return; } if (water >= 25) { api.toast('The water tank is almost full.'); return; } coins -= 8; water = Math.min(30, water + 10); message = 'WATER TANK REFILLED'; api.sound('click'); }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; time = Math.max(0, 120 - clock); weatherIndex = Math.min(5, Math.floor(clock / 20)); wanted = market[Math.min(3, Math.floor(clock / 30))];
          if (weather[weatherIndex] === 'Rain') water = Math.min(30, water + dt * 0.8);
          for (const p of plots) if (p.crop >= 0) p.age += dt * (weather[weatherIndex] === 'Sun' ? 1.12 : 1);
          const input = api.input; if (input.pressed('left')) selected = selected % 3 ? selected - 1 : selected + 2; if (input.pressed('right')) selected = selected % 3 < 2 ? selected + 1 : selected - 2; if (input.pressed('up')) selected = (selected + 6) % 9; if (input.pressed('down')) selected = (selected + 3) % 9; if (input.pressed('seed')) seed = (seed + 1) % 3;
          if (input.pointer.pressed && input.pointer.inside) { const p = input.pointer; const col = Math.floor((p.x - 66) / 193), row = Math.floor((p.y - 139) / 132); if (col >= 0 && col < 3 && row >= 0 && row < 3 && p.x < 645 && p.y < 535) selected = row * 3 + col; if (p.x > 696 && p.x < 924 && p.y >= 232 && p.y < 433) seed = Math.floor((p.y - 232) / 67); }
          if (input.pressed('work')) work(); if (input.pressed('water')) refill();
          if (time <= 0) { ended = true; score = Math.round(coins * 10 + harvests * 25 + (coins >= 220 ? 600 : 0)); api.end({ score, title: coins >= 220 ? 'A season well tended.' : 'Every season teaches you.', message: coins + ' coins and ' + harvests + ' harvests. Follow the market, stagger your crops, and let the rain refill your plans.', stats: [{ label: 'Coins', value: coins }, { label: 'Harvests', value: harvests }, { label: 'Market bonuses', value: contracts }, { label: 'Goal', value: coins >= 220 ? 'Reached' : '220 coins' }] }); return; }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#243e37'; c.fillRect(0, 0, 960, 600); c.fillStyle = '#557753'; c.fillRect(38, 107, 626, 443); c.fillStyle = '#8c9d68'; for (let i = 0; i < 20; i++) { const x = 49 + i * 31; c.fillRect(x, 104, 7, 445); } c.fillStyle = '#bba875'; c.fillRect(38, 106, 626, 10); c.fillRect(38, 540, 626, 10);
          function cropIcon(type, x, y, size) { c.save(); c.translate(x, y); c.scale(size, size); if (type === 0) { c.fillStyle = '#d98e5b'; c.beginPath(); c.moveTo(-12, -8); c.lineTo(12, -8); c.lineTo(0, 23); c.fill(); c.strokeStyle = '#8cbd6d'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -6); c.lineTo(-13, -21); c.moveTo(0, -6); c.lineTo(12, -22); c.stroke(); } else if (type === 1) { c.fillStyle = '#b7c17a'; c.beginPath(); c.ellipse(0, -12, 17, 8, -0.3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#dd8695'; for (const [a, b] of [[-9, 0], [9, 0], [0, 13]]) { c.beginPath(); c.arc(a, b, 10, 0, Math.PI * 2); c.fill(); } } else { c.fillStyle = '#deb471'; c.beginPath(); c.ellipse(0, 5, 22, 18, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#b48450'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 5, 10, 18, 0, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#a9b877'; c.fillRect(-3, -19, 6, 11); } c.restore(); }
          plots.forEach((p, i) => { const x = 66 + i % 3 * 193, y = 139 + Math.floor(i / 3) * 132, crop = p.crop >= 0 ? CROPS[p.crop] : null, ripe = crop && p.age >= crop.grow;
            c.fillStyle = '#4a4536'; c.beginPath(); c.roundRect(x, y, 165, 104, 10); c.fill(); c.strokeStyle = i === selected ? '#f1e6ad' : ripe ? '#b5d48a' : '#7b7555'; c.lineWidth = i === selected ? 3 : 1; c.stroke(); c.strokeStyle = '#6c6043'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 13, y + 20 + k * 20); c.lineTo(x + 152, y + 20 + k * 20); c.stroke(); }
            if (crop) { const size = 0.3 + Math.min(1, p.age / crop.grow) * 0.65; for (let j = 0; j < 3; j++) cropIcon(p.crop, x + 37 + j * 45, y + 44, size); c.fillStyle = '#d5dfb2'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillText(ripe ? p.age > crop.grow + 20 ? 'OVERRIPE · HARVEST' : 'RIPE · HARVEST' : Math.ceil(crop.grow - p.age) + 's TO HARVEST', x + 82, y + 88); c.fillStyle = ripe ? '#c4d595' : '#94aa7c'; c.fillRect(x + 12, y + 97, 141 * Math.min(1, p.age / crop.grow), 3); }
            else { c.fillStyle = '#b4ae87'; c.textAlign = 'center'; c.font = 'bold 27px system-ui'; c.fillText('+', x + 82, y + 54); c.font = '11px system-ui'; c.fillText('PLANT HERE', x + 82, y + 80); }
          });
          c.fillStyle = '#e5e7bc'; c.textAlign = 'left'; c.font = '900 30px Georgia,serif'; c.fillText('Orchard Keeper', 47, 51); c.font = '12px system-ui'; c.fillStyle = '#a7c29b'; c.fillText('NINE PLOTS. A GOOD LITTLE SEASON.', 49, 77);
          c.fillStyle = '#334e42'; c.beginPath(); c.roundRect(688, 108, 238, 438, 14); c.fill(); c.fillStyle = '#dddfb4'; c.font = '900 19px system-ui'; c.fillText('TODAY’S MARKET', 706, 141); c.font = 'bold 16px system-ui'; c.fillStyle = CROPS[wanted].color; c.fillText(CROPS[wanted].name.toUpperCase() + '  ×1.5', 706, 174); c.fillStyle = '#a9bd9b'; c.font = '12px system-ui'; c.fillText('Changes in ' + Math.ceil(30 - clock % 30) + 's', 706, 199);
          CROPS.forEach((crop, i) => { c.fillStyle = seed === i ? '#4e6750' : '#2b443a'; c.beginPath(); c.roundRect(698, 232 + i * 67, 218, 58, 8); c.fill(); cropIcon(i, 723, 259 + i * 67, 0.7); c.fillStyle = crop.color; c.font = 'bold 15px system-ui'; c.fillText(crop.name, 751, 254 + i * 67); c.fillStyle = '#b4c1a4'; c.font = '11px system-ui'; c.fillText(crop.cost + ' coins · ' + crop.water + ' water · ' + crop.grow + 's', 751, 276 + i * 67); });
          c.fillStyle = '#abc9bd'; c.font = 'bold 15px system-ui'; c.fillText('WATER  ' + Math.floor(water) + '/30', 706, 473); c.fillStyle = '#244138'; c.fillRect(706, 488, 202, 9); c.fillStyle = '#95c7c3'; c.fillRect(706, 488, 202 * water / 30, 9); c.fillStyle = '#a6bb9c'; c.font = '11px system-ui'; c.fillText('R: +10 water for 8 coins', 706, 526);
          if (weather[weatherIndex] === 'Rain' && !api.reducedMotion) { c.strokeStyle = '#bed7cb55'; c.lineWidth = 1; for (let i = 0; i < 35; i++) { const x = (i * 47) % 640 + 35, y = (i * 83 + clock * 180) % 430 + 109; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 12); c.stroke(); } }
          c.fillStyle = '#dfdfb5'; c.textAlign = 'center'; c.font = 'bold 13px system-ui'; c.fillText(message, 480, 580); c.restore();
        },
        inspect() { return { time, clock, coins, water, selected, seed, harvests, contracts, score, weather: weather[weatherIndex], wanted, plots: plots.map(p => ({ ...p })), ended }; }
      };
    }
  });
})();
