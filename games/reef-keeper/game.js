/* Reef Keeper: a sixteen-day ecosystem, where fish, food, coral and water affect each other. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ACTIONS = ['Restore coral', 'Feed the reef', 'Clean the water', 'Guided tour', 'Protect habitat'];
  const COSTS = [8, 4, 6, 0, 10];
  const WEATHERS = ['Calm water', 'Algae bloom', 'Storm swell', 'Fresh tide'];
  Arcade.mount({
    id: 'reef-keeper', title: 'Reef Keeper', category: 'Ecosystem strategy', accent: '#acdacc',
    description: 'A reef is a relationship. Keep the coral, fish and water thriving together.',
    howTo: ['Care for the reef over sixteen days. Finish with coral at least 60, fish at least 45, and pollution at most 45. If coral or fish reaches zero, the reef is lost.', 'Left / Right chooses an action. Space advances one day. Tap a card, then Tend the reef. Tours earn funds; all other actions spend them. The forecast helps you plan.', 'Fish eat food each day and grow in clean water, up to the coral’s capacity. Pollution rises with the fish population. Protection adds ten young fish and shields coral from four storm days.'],
    controls: [{ id: 'left', label: '← Action', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Action →', keys: ['ArrowRight', 'KeyD'] }, { id: 'tend', label: 'Tend the reef', keys: ['Space'] }],
    medals: [1400, 2500, 3300],
    create(api) {
      const weather = Array.from({ length: 16 }, (_, i) => i < 2 ? 0 : Math.floor(api.random() * 4));
      let day = 1, coral = 45, fish = 30, food = 38, pollution = 20, coins = 26, protection = 0, selected = 0, delay = 0, clock = 0, score = 0, ended = false, message = 'A HEALTHY REEF STARTS WITH ONE GOOD DECISION.';
      const fishArt = Array.from({ length: 20 }, () => ({ x: 90 + api.random() * 780, y: 165 + api.random() * 170, phase: api.random() * Math.PI * 2, size: 7 + api.random() * 7 }));
      function value() { return coral * 9 + fish * 12 + (100 - pollution) * 7 + coins * 5 + (day - 1) * 20; }
      function hud() {
        score = Math.round(value()); api.score(score);
        const forecast = ['Calm', 'Bloom', 'Storm', 'Tide'][weather[Math.min(15, day - 1)]];
        const action = ['Restore', 'Feed', 'Clean', 'Tour', 'Shield'][selected];
        api.hud([
          { label: 'Day ' + Math.min(16, day) + ' / 16', value: forecast },
          { label: 'Coral / fish', value: coral + ' / ' + fish },
          { label: 'Poll. / funds', value: pollution + ' / ' + coins },
          { label: 'Food / need', value: food + ' / ' + (Math.ceil(fish / 10) + 1) },
          { label: 'Action / funds', value: action + (selected === 3 ? ' +14' : ' −' + COSTS[selected]) }
        ]);
      }
      function tend() {
        if (delay > 0) return; if (coins < COSTS[selected]) { api.toast('Not enough funds. A guided tour earns 14.'); return; } coins -= COSTS[selected];
        if (selected === 0) coral += 15; if (selected === 1) food += 24; if (selected === 2) pollution -= 24; if (selected === 3) { coins += 14; pollution += 3; } if (selected === 4) { fish += 10; protection = 4; }
        const event = weather[day - 1], shielded = protection > 0; if (event === 1) { food += 6; pollution += 6; } if (event === 2) { if (!shielded) coral -= 6; pollution += 3; } if (event === 3) pollution -= 4;
        pollution = clamp(pollution, 0, 100); const appetite = Math.ceil(fish / 10) + 1, fed = food >= appetite; food = Math.max(0, food - appetite);
        if (!fed) fish -= 6; else if (pollution < 45) fish += 3; else if (pollution >= 70) fish -= 4;
        const capacity = Math.floor(20 + coral * .75); if (fish > capacity) fish = Math.max(capacity, fish - 4);
        if (pollution < 30) coral += 1; else if (pollution > 45) coral -= Math.ceil((pollution - 45) / 10);
        pollution += 2 + Math.floor(fish / 35); if (protection > 0) protection--;
        coral = clamp(Math.round(coral), 0, 100); fish = clamp(Math.round(fish), 0, 100); food = clamp(food, 0, 100); pollution = clamp(pollution, 0, 100); coins = Math.min(150, coins);
        message = !fed ? 'FOOD RAN LOW. SIX FISH LEFT THE REEF.' : event === 2 && !shielded ? 'A STORM PASSED. REPAIR THE CORAL.' : ACTIONS[selected].toUpperCase() + ' · THE REEF RESPONDS'; day++; delay = .35; hud();
        if (day > 16 || coral <= 0 || fish <= 0) { ended = true; const won = day > 16 && coral >= 60 && fish >= 45 && pollution <= 45; if (won) score += 800; api.end({ score, title: won ? 'A reef full of tomorrow.' : coral <= 0 || fish <= 0 ? 'The reef needs a fresh start.' : 'A season of small lessons.', message: won ? 'The fish have food, the coral has room, and the water is clear. Every part of the reef helped the others.' : 'Balance feeding, restoration and clean water. A thriving reef needs all three, supported by a few careful tours.', stats: [{ label: 'Coral', value: coral }, { label: 'Fish', value: fish }, { label: 'Pollution', value: pollution }, { label: 'Days', value: Math.min(16, day - 1) }] }); return; }
        api.sound(selected === 3 ? 'click' : 'good', .9 + selected * .1);
      }
      hud();
      return {
        update(dt) { if (ended) return; clock += dt; delay = Math.max(0, delay - dt); const input = api.input; if (input.pressed('left')) selected = (selected + 4) % 5; if (input.pressed('right')) selected = (selected + 1) % 5; if (input.pointer.pressed && input.pointer.inside) { const p = input.pointer; if (p.y >= 420 && p.y <= 509) { const i = Math.floor((p.x - 35) / 180); if (i >= 0 && i < 5) selected = i; } if (p.x >= 650 && p.x <= 926 && p.y >= 532 && p.y <= 580) tend(); } if (input.pressed('tend')) tend(); if (!ended) hud(); },
        draw(c) {
          c.save(); const water = c.createLinearGradient(0, 0, 0, 420); water.addColorStop(0, '#519d9f'); water.addColorStop(1, '#1e555e'); c.fillStyle = water; c.fillRect(0, 0, 960, 600); c.fillStyle = '#a4d6bf13'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(125 + i * 187, 0); c.lineTo(25 + i * 175, 405); c.lineTo(180 + i * 185, 405); c.lineTo(156 + i * 187, 0); c.fill(); }
          c.fillStyle = '#b6bc8e'; c.beginPath(); c.moveTo(0, 367); c.quadraticCurveTo(210, 327, 400, 367); c.quadraticCurveTo(710, 325, 960, 365); c.lineTo(960, 430); c.lineTo(0, 430); c.fill();
          for (let i = 0; i < 12; i++) { const x = 42 + i * 79, y = 376 + Math.sin(i) * 14, height = 28 + coral * .54 + i % 3 * 13; c.strokeStyle = ['#dca08f', '#b8c68e', '#c5a4bb'][i % 3]; c.lineWidth = 7 + coral * .025; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - height); c.moveTo(x, y - height * .4); c.lineTo(x - 19, y - height * .65); c.lineTo(x - 24, y - height * .92); c.moveTo(x, y - height * .6); c.lineTo(x + 20, y - height * .83); c.lineTo(x + 22, y - height * 1.1); c.stroke(); }
          for (let i = 0; i < Math.min(20, Math.ceil(fish / 4)); i++) { const f = fishArt[i], xx = f.x + Math.sin(clock * .45 + f.phase) * 28, yy = f.y + Math.sin(clock * .9 + f.phase) * 8; c.save(); c.translate(xx, yy); c.fillStyle = ['#edcb84', '#c4d9b3', '#e0a58d'][i % 3]; c.beginPath(); c.ellipse(0, 0, f.size * 1.5, f.size * .75, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(-f.size, 0); c.lineTo(-f.size * 2.3, -f.size); c.lineTo(-f.size * 2.3, f.size); c.fill(); c.fillStyle = '#376269'; c.beginPath(); c.arc(f.size * .8, -2, 2, 0, Math.PI * 2); c.fill(); c.restore(); }
          if (pollution > 20) { c.fillStyle = '#665b3933'; c.globalAlpha = pollution / 100; c.fillRect(0, 99, 960, 311); c.globalAlpha = 1; }
          c.fillStyle = '#163e47ee'; c.fillRect(0, 0, 960, 98); c.fillStyle = '#e3e6c4'; c.textAlign = 'left'; c.font = '900 28px Georgia,serif'; c.fillText('Reef Keeper', 31, 40); c.fillStyle = '#b5d2bf'; c.font = '13px system-ui'; c.fillText('A REEF IS A RELATIONSHIP.', 33, 65); c.textAlign = 'right'; c.font = 'bold 14px system-ui'; c.fillText(WEATHERS[weather[Math.min(15, day - 1)]] + ' · DAY ' + Math.min(16, day), 926, 36); c.font = '12px system-ui'; c.fillText('Tomorrow: ' + (day < 16 ? WEATHERS[weather[day]] : 'a living reef'), 926, 60);
          c.fillStyle = '#e7dfb9'; c.font = 'bold 14px system-ui'; c.textAlign = 'left'; c.fillText('FOOD  ' + food + '  ·  DAILY NEED  ' + (Math.ceil(fish / 10) + 1), 35, 124); c.textAlign = 'right'; c.fillText(protection ? 'STORM SHIELD  ' + protection + ' DAYS' : 'HABITAT CAPACITY  ' + Math.floor(20 + coral * .75), 924, 124);
          c.fillStyle = '#214e53'; c.fillRect(0, 409, 960, 191); const effects = ['+15 coral', '+24 food', '−24 pollution', '+14 funds · +3 pollution', '+10 fish · 4-day shield']; ACTIONS.forEach((action, i) => { const x = 35 + i * 180; c.fillStyle = i === selected ? '#4c7972' : '#2e5e60'; c.beginPath(); c.roundRect(x, 420, 170, 89, 9); c.fill(); c.strokeStyle = i === selected ? '#e8d398' : '#729b87'; c.lineWidth = i === selected ? 3 : 1; c.stroke(); c.fillStyle = '#e5e1bb'; c.textAlign = 'center'; c.font = 'bold 14px system-ui'; c.fillText(action, x + 85, 448); c.fillStyle = '#b6d0b8'; c.font = '11px system-ui'; c.fillText(effects[i], x + 85, 471); c.fillText(COSTS[i] ? COSTS[i] + ' funds' : 'Earn funds', x + 85, 493); });
          c.fillStyle = delay > 0 ? '#91aa8e' : '#ddcf9d'; c.beginPath(); c.roundRect(650, 532, 276, 48, 24); c.fill(); c.fillStyle = '#2f5655'; c.textAlign = 'center'; c.font = '900 15px system-ui'; c.fillText('TEND THE REEF  ·  SPACE', 788, 562); c.textAlign = 'left'; c.fillStyle = '#c3d5b8'; c.font = 'bold 12px system-ui'; c.fillText(message, 35, 558); c.restore();
        },
        inspect() { return { day, coral, fish, food, pollution, coins, protection, selected, delay, score, weather: [...weather], currentWeather: weather[Math.min(15, day - 1)], nextWeather: day < 16 ? weather[day] : null, ended }; }
      };
    }
  });
})();
