/* Colony Balance: twenty consequential days of planning on a small new world. */
(() => {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const NAMES = ['Grow food', 'Collect water', 'Generate power', 'Crew rest', 'Build facility'];
  const COLORS = ['#bed18c', '#9bd1db', '#efc989', '#dfadb3'];
  Arcade.mount({
    id: 'colony-balance', title: 'Colony Balance', category: 'Colony management', accent: '#dfbd9f',
    description: 'Twenty days on a quiet red planet. Make tomorrow possible, one decision at a time.',
    howTo: ['Keep food, water, power and morale above zero for 20 days. Choose one action each day. The forecast shows tomorrow’s extra resource costs.', 'Left / Right selects an action. Space commits one day. T changes which facility you will build. Tap an action card to select it, then Commit day.', 'The crew uses 4 food, 4 water, 3 power and 1 morale daily. A facility adds 3 of its resource each day. Build early, but keep reserves for storms. Each resource is capped at 100.'],
    controls: [{ id: 'left', label: '← Action', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Action →', keys: ['ArrowRight', 'KeyD'] }, { id: 'focus', label: 'Build type', keys: ['KeyT'] }, { id: 'commit', label: 'Commit day', keys: ['Space'] }],
    medals: [1000, 2200, 3300],
    create(api) {
      let day = 1, selected = 0, focus = 0, food = 45, water = 45, energy = 45, morale = 65, score = 0, delay = 0, ended = false, builds = 0;
      const facilities = [0, 0, 0], weather = Array.from({ length: 20 }, (_, i) => i < 3 ? 0 : Math.floor(api.random() * 5));
      const WEATHER = [{ name: 'Clear sky', water: 0, energy: 0 }, { name: 'Dust storm', water: 1, energy: 4 }, { name: 'Cold night', water: 0, energy: 5 }, { name: 'Dry wind', water: 3, energy: 1 }, { name: 'Mild day', water: 0, energy: 0 }];
      const log = ['Arrival complete. Supplies unloaded.'];
      function reserves() { return Math.round(food + water + energy + morale); }
      function hud() { score = (day - 1) * 50 + reserves() * 5; api.score(score); api.hud([{ label: 'Day', value: Math.min(day, 20) + ' / 20' }, { label: 'Food', value: food }, { label: 'Water', value: water }, { label: 'Power', value: energy }, { label: 'Morale', value: morale }]); }
      function commit() {
        if (delay > 0) return;
        if (selected === 4 && (facilities[focus] >= 2 || food < 9 || water < 9 || energy < 13)) { api.toast(facilities[focus] >= 2 ? 'This facility is fully upgraded.' : 'Building needs 8 food, 8 water and 12 power, plus a reserve.'); return; }
        const today = WEATHER[weather[day - 1]], productivity = morale < 30 ? .75 : 1; let note = NAMES[selected];
        if (selected === 0) { food += Math.round(18 * productivity); water -= 3; energy -= 2; }
        if (selected === 1) { water += Math.round(21 * productivity); energy -= 4; }
        if (selected === 2) { energy += Math.round((today.name === 'Clear sky' ? 29 : 25) * productivity); morale -= 2; }
        if (selected === 3) { morale += 23; food -= 2; }
        if (selected === 4) { food -= 8; water -= 8; energy -= 12; facilities[focus]++; builds++; note = ['Greenhouse', 'Water recycler', 'Solar array'][focus] + ' built'; }
        food += facilities[0] * 3 - 4; water += facilities[1] * 3 - 4 - today.water; energy += facilities[2] * 3 - 3 - today.energy; morale--;
        food = clamp(Math.round(food), 0, 100); water = clamp(Math.round(water), 0, 100); energy = clamp(Math.round(energy), 0, 100); morale = clamp(Math.round(morale), 0, 100);
        log.unshift('DAY ' + day + ' · ' + note); if (log.length > 3) log.pop(); day++; delay = .3; hud();
        const survived = food > 0 && water > 0 && energy > 0 && morale > 0;
        if (!survived || day > 20) { ended = true; const won = survived && day > 20; if (won) score += 1000 + builds * 100; const empty = food <= 0 ? 'Food' : water <= 0 ? 'Water' : energy <= 0 ? 'Power' : 'Morale'; api.end({ score, title: won ? 'A colony with a future.' : empty + ' ran out.', message: won ? 'Twenty days, a steady crew, and a place to call home. Reserves and infrastructure reward long-term planning.' : 'You kept the colony going for ' + (day - 1) + ' days. Watch tomorrow’s forecast and replenish before a resource runs low.', stats: [{ label: 'Days survived', value: won ? 20 : day - 1 }, { label: 'Reserve total', value: reserves() }, { label: 'Facilities', value: builds }, { label: 'Morale', value: morale }] }); return; }
        api.sound('good', selected === 4 ? 1.3 : .9);
      }
      hud();
      return {
        update(dt) { if (ended) return; delay = Math.max(0, delay - dt); const input = api.input; if (input.pressed('left')) selected = (selected + 4) % 5; if (input.pressed('right')) selected = (selected + 1) % 5; if (input.pressed('focus')) focus = (focus + 1) % 3;
          if (input.pointer.pressed && input.pointer.inside) { const p = input.pointer; if (p.y >= 370 && p.y <= 462) { const index = Math.floor((p.x - 39) / 179); if (index >= 0 && index < 5) selected = index; } if (p.y >= 490 && p.y <= 539 && p.x >= 683 && p.x <= 916) commit(); if (p.y >= 485 && p.y <= 535 && p.x >= 43 && p.x < 620) focus = Math.min(2, Math.floor((p.x - 43) / 192)); }
          if (input.pressed('commit')) commit(); if (!ended) hud();
        },
        draw(c) {
          c.save(); const sky = c.createLinearGradient(0, 0, 0, 360); sky.addColorStop(0, '#292c40'); sky.addColorStop(1, '#9a766e'); c.fillStyle = sky; c.fillRect(0, 0, 960, 600); c.fillStyle = '#dec29b'; c.beginPath(); c.arc(790, 99, 44, 0, Math.PI * 2); c.fill(); c.fillStyle = '#68525d'; c.beginPath(); c.moveTo(0, 228); c.lineTo(150, 148); c.lineTo(290, 233); c.lineTo(432, 163); c.lineTo(625, 249); c.lineTo(798, 190); c.lineTo(960, 252); c.lineTo(960, 400); c.lineTo(0, 400); c.fill(); c.fillStyle = '#ac7c69'; c.beginPath(); c.moveTo(0, 284); c.quadraticCurveTo(320, 239, 600, 295); c.quadraticCurveTo(780, 260, 960, 278); c.lineTo(960, 600); c.lineTo(0, 600); c.fill();
          for (let i = 0; i < 3; i++) { const x = 270 + i * 178, y = 287; c.fillStyle = '#4f575c'; c.fillRect(x - 53, y, 106, 35); c.fillStyle = i === 0 ? '#b2c79c' : i === 1 ? '#b0d1ce' : '#d4bf99'; c.beginPath(); c.ellipse(x, y, 53, 40, 0, Math.PI, Math.PI * 2); c.fill(); c.strokeStyle = '#ece1bb'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#56666a'; c.fillRect(x - 13, y + 5, 26, 30); c.fillStyle = '#f3d9a6'; for (let j = 0; j < facilities[i]; j++) { c.beginPath(); c.arc(x - 32 + j * 64, y + 13, 6, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#efe2c5'; c.textAlign = 'center'; c.font = '10px system-ui'; c.fillText(['FOOD', 'WATER', 'POWER'][i] + ' +' + facilities[i] * 3 + '/DAY', x, y + 52); }
          c.fillStyle = '#293b41'; c.fillRect(0, 353, 960, 247); c.fillStyle = '#eadac0'; c.textAlign = 'left'; c.font = '900 29px Georgia,serif'; c.fillText('Colony Balance', 38, 45); c.font = '12px system-ui'; c.fillStyle = '#c6beb3'; c.fillText('TWENTY DAYS TO MAKE A HOME.', 40, 68);
          const values = [food, water, energy, morale]; ['FOOD', 'WATER', 'POWER', 'MORALE'].forEach((name, i) => { const x = 40 + i * 230; c.fillStyle = '#24323ee8'; c.beginPath(); c.roundRect(x, 91, 211, 66, 7); c.fill(); c.fillStyle = COLORS[i]; c.font = 'bold 12px system-ui'; c.fillText(name, x + 11, 112); c.textAlign = 'right'; c.font = '900 19px system-ui'; c.fillText(values[i], x + 198, 114); c.textAlign = 'left'; c.fillStyle = '#53606a'; c.fillRect(x + 11, 132, 187, 7); c.fillStyle = COLORS[i]; c.fillRect(x + 11, 132, 187 * values[i] / 100, 7); });
          c.fillStyle = '#283843dd'; c.beginPath(); c.roundRect(38, 174, 195, 128, 8); c.fill(); c.fillStyle = '#e7d4b7'; c.font = 'bold 13px system-ui'; c.fillText('DAY ' + Math.min(day, 20) + ' FORECAST', 50, 198); c.font = '17px Georgia,serif'; c.fillText(WEATHER[weather[Math.min(19, day - 1)]].name, 50, 226); c.fillStyle = '#bdc6bf'; c.font = '12px system-ui'; c.fillText('Tomorrow: ' + (day < 20 ? WEATHER[weather[day]].name : 'a new beginning'), 50, 252); c.fillText('One action, then one day.', 50, 280);
          const costs = ['+18 food · −3 water, −2 power', '+21 water · −4 power', '+25 power · −2 morale', '+23 morale · −2 food', '−8 food, −8 water, −12 power'];
          NAMES.forEach((name, i) => { const x = 39 + i * 179; c.fillStyle = i === selected ? '#596d65' : '#354d4f'; c.beginPath(); c.roundRect(x, 370, 168, 92, 8); c.fill(); c.strokeStyle = i === selected ? '#eed19f' : '#637979'; c.lineWidth = i === selected ? 3 : 1; c.stroke(); c.fillStyle = '#e7ddbf'; c.textAlign = 'center'; c.font = 'bold 16px system-ui'; c.fillText(name, x + 84, 400); c.fillStyle = '#b5c5b8'; c.font = '10px system-ui'; c.fillText(costs[i], x + 84, 423); c.fillText(i === 2 ? '29 power under clear skies' : i === 4 ? 'Passive +3 every day' : 'Then daily supplies consumed', x + 84, 445); });
          ['Greenhouse', 'Recycler', 'Solar array'].forEach((name, i) => { const x = 43 + i * 192; c.fillStyle = i === focus ? '#536961' : '#2c4144'; c.beginPath(); c.roundRect(x, 489, 180, 43, 7); c.fill(); c.fillStyle = i === focus ? '#e5d1a8' : '#9db3a9'; c.textAlign = 'center'; c.font = 'bold 13px system-ui'; c.fillText(name + ' ' + facilities[i] + '/2', x + 90, 515); });
          c.fillStyle = delay > 0 ? '#7b8973' : '#dfba8d'; c.beginPath(); c.roundRect(683, 490, 233, 49, 24); c.fill(); c.fillStyle = '#344b47'; c.font = '900 15px system-ui'; c.fillText('COMMIT DAY  ·  SPACE', 799, 521); c.textAlign = 'left'; c.font = '11px system-ui'; c.fillStyle = '#b6c4b7'; log.forEach((line, i) => c.fillText(line, 45 + i * 303, 572)); c.restore();
        },
        inspect() { return { day, selected, focus, food, water, energy, morale, score, delay, facilities: [...facilities], builds, weather: [...weather], today: { ...WEATHER[weather[Math.min(19, day - 1)]] }, nextWeather: day < 20 ? { ...WEATHER[weather[day]] } : null, ended }; }
      };
    }
  });
})();
