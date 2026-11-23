/* Cafe Rush: a small production line with real recipes, patience and stock decisions. */
(() => {
  'use strict';
  const RECIPES = [
    { name: 'Espresso', need: ['coffee'], color: '#c99470' },
    { name: 'Latte', need: ['coffee', 'milk'], color: '#e6d5ad' },
    { name: 'Mocha', need: ['coffee', 'milk', 'cocoa'], color: '#ba9286' },
    { name: 'Citrus tea', need: ['tea', 'lemon'], color: '#cfce82' },
    { name: 'Hot cocoa', need: ['milk', 'cocoa'], color: '#d5b29b' }
  ];
  const ITEMS = ['coffee', 'milk', 'tea', 'cocoa', 'lemon'];
  Arcade.mount({
    id: 'cafe-rush', title: 'Café Rush', category: 'Time management', accent: '#e9b8a4',
    description: 'Brew, froth, finish. Keep a tiny café humming through its morning rush.',
    howTo: ['Serve as many correct orders as you can in 90 seconds. Each ticket shows its recipe and patience. Five expired tickets end the shift.', 'C brews coffee, T brews tea (one kettle at a time). M froths milk. X stocks cocoa and L stocks lemon. Left / Right selects an order; Space serves it. You can tap tickets and station buttons.', 'Coffee and tea take 3 seconds; milk takes 2.5. Stocks hold four portions each. Prepare the next drink while the first one brews. Fast service builds a tip streak.'],
    controls: [{ id: 'left', label: '← Order', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Order →', keys: ['ArrowRight', 'KeyD'] }, { id: 'coffee', label: 'Coffee', keys: ['KeyC'] }, { id: 'milk', label: 'Milk', keys: ['KeyM'] }, { id: 'tea', label: 'Tea', keys: ['KeyT'] }, { id: 'cocoa', label: 'Cocoa', keys: ['KeyX'] }, { id: 'lemon', label: 'Lemon', keys: ['KeyL'] }, { id: 'serve', label: 'Serve', keys: ['Space'] }],
    medals: [1400, 3500, 6200],
    create(api) {
      let time = 90, clock = 0, score = 0, served = 0, lost = 0, streak = 0, best = 0, selected = 0, spawn = 3.4, nextId = 0, ended = false, message = 'YOUR FIRST TWO ORDERS ARE READY.';
      const stock = { coffee: 0, milk: 0, tea: 0, cocoa: 0, lemon: 0 }, orders = [];
      const brew = { item: '', left: 0, total: 3 }, froth = { left: 0, total: 2.5 };
      function addOrder(type) { const patience = 26 + api.random() * 8; orders.push({ id: nextId++, type, left: patience, max: patience }); }
      addOrder(0); addOrder(1);
      function hud() { api.score(score); api.hud([{ label: 'Shift', value: Math.ceil(time) + 's' }, { label: 'Served', value: served }, { label: 'Reputation', value: (5 - lost) + ' / 5' }, { label: 'Tip streak', value: '×' + (1 + Math.min(streak, 10) / 10).toFixed(1) }]); }
      function prepare(item) {
        if (stock[item] >= 4) { message = item.toUpperCase() + ' STOCK IS FULL'; return; }
        if (item === 'coffee' || item === 'tea') { if (brew.left > 0) { message = 'THE KETTLE IS STILL BREWING'; return; } brew.item = item; brew.left = brew.total; }
        else if (item === 'milk') { if (froth.left > 0) { message = 'MILK IS ALREADY FROTHING'; return; } froth.left = froth.total; }
        else stock[item]++;
        message = item.toUpperCase() + (item === 'cocoa' || item === 'lemon' ? ' STOCKED' : ' STARTED'); api.sound('click');
      }
      function serve() {
        if (!orders.length) return; const order = orders[selected], recipe = RECIPES[order.type], missing = recipe.need.filter(item => !stock[item]);
        if (missing.length) { message = 'NEED: ' + missing.join(' + ').toUpperCase(); api.toast(message); return; }
        recipe.need.forEach(item => stock[item]--); streak++; best = Math.max(best, streak); served++;
        const earned = Math.round((120 + recipe.need.length * 30 + order.left * 4) * (1 + Math.min(streak, 10) / 10)); score += earned;
        orders.splice(selected, 1); selected = Math.max(0, Math.min(selected, orders.length - 1)); message = recipe.name.toUpperCase() + ' SERVED · +' + earned; api.sound('good', 1 + Math.min(streak, 10) * .035); api.burst(475, 273, recipe.color, 12);
      }
      function finish() { ended = true; api.end({ score, title: lost < 5 ? 'A good morning, beautifully made.' : 'Time for a fresh pot.', message: served + ' drinks served. ' + (served >= 16 ? 'You kept the whole counter moving.' : 'Brew ahead, watch ticket patience, and keep milk in reserve.'), stats: [{ label: 'Served', value: served }, { label: 'Best streak', value: best }, { label: 'Missed orders', value: lost }, { label: 'Time left', value: Math.ceil(time) + 's' }] }); }
      hud();
      return {
        update(dt) {
          if (ended) return; clock += dt; time = Math.max(0, time - dt);
          if (brew.left > 0) { brew.left = Math.max(0, brew.left - dt); if (!brew.left) { stock[brew.item] = Math.min(4, stock[brew.item] + 1); api.sound('click', 1.4); } }
          if (froth.left > 0) { froth.left = Math.max(0, froth.left - dt); if (!froth.left) { stock.milk = Math.min(4, stock.milk + 1); api.sound('click', 1.6); } }
          for (let i = orders.length - 1; i >= 0; i--) { orders[i].left -= dt; if (orders[i].left <= 0) { orders.splice(i, 1); lost++; streak = 0; message = 'A CUSTOMER LEFT. CHECK THE OLDEST TICKET.'; api.sound('bad'); } }
          selected = Math.max(0, Math.min(selected, orders.length - 1));
          if (lost >= 5 || time <= 0) { finish(); return; }
          spawn -= dt; if (spawn <= 0 && orders.length < 4) { addOrder(Math.floor(api.random() * RECIPES.length)); spawn = Math.max(2.9, 5.2 - clock * .02); }
          const input = api.input;
          if (orders.length) { if (input.pressed('left')) selected = (selected + orders.length - 1) % orders.length; if (input.pressed('right')) selected = (selected + 1) % orders.length; }
          for (const item of ITEMS) if (input.pressed(item)) prepare(item);
          if (input.pointer.pressed && input.pointer.inside) { const p = input.pointer; if (p.y >= 98 && p.y <= 282) { const index = Math.floor((p.x - 42) / 224); if (index >= 0 && index < orders.length) selected = index; } if (p.y >= 430 && p.y <= 526) { const index = Math.floor((p.x - 47) / 174); if (index >= 0 && index < 5) prepare(ITEMS[index]); } if (p.x >= 360 && p.x <= 600 && p.y >= 324 && p.y <= 380) serve(); }
          if (input.pressed('serve')) serve(); hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#3f4e49'; c.fillRect(0, 0, 960, 600); c.fillStyle = '#56685d'; for (let x = 0; x < 960; x += 80) { c.fillRect(x, 0, 3, 400); } c.fillStyle = '#293a35'; c.fillRect(0, 383, 960, 217); c.fillStyle = '#c89574'; c.fillRect(0, 394, 960, 21); c.fillStyle = '#8c644f'; c.fillRect(0, 413, 960, 9);
          c.fillStyle = '#efe0c6'; c.font = '900 30px Georgia,serif'; c.textAlign = 'left'; c.fillText('Café Rush', 43, 49); c.fillStyle = '#b9c7af'; c.font = '12px system-ui'; c.fillText('A LITTLE COUNTER. A VERY GOOD MORNING.', 45, 73);
          orders.forEach((order, i) => { const x = 42 + i * 224, recipe = RECIPES[order.type]; c.fillStyle = '#1d302e55'; c.fillRect(x + 5, 104, 210, 184); c.fillStyle = i === selected ? '#f3e5c8' : '#ddd5bb'; c.beginPath(); c.roundRect(x, 98, 210, 184, 6); c.fill(); c.strokeStyle = i === selected ? '#e5b28c' : '#e2dfc8'; c.lineWidth = i === selected ? 4 : 1; c.stroke(); c.fillStyle = '#d3ad84'; c.fillRect(x + 85, 89, 40, 17); c.fillStyle = '#354c43'; c.font = '900 20px Georgia,serif'; c.textAlign = 'left'; c.fillText(recipe.name, x + 15, 133); c.font = 'bold 13px system-ui'; recipe.need.forEach((item, j) => { c.fillStyle = stock[item] ? '#567954' : '#867562'; c.fillText((stock[item] ? '✓ ' : '○ ') + item.toUpperCase(), x + 16, 164 + j * 23); }); c.fillStyle = '#b6b698'; c.fillRect(x + 15, 254, 180, 8); c.fillStyle = order.left < 9 ? '#be7263' : '#72936f'; c.fillRect(x + 15, 254, 180 * order.left / order.max, 8); c.fillStyle = '#6e7963'; c.font = '10px system-ui'; c.textAlign = 'right'; c.fillText(Math.ceil(order.left) + 's', x + 194, 246); });
          if (!orders.length) { c.textAlign = 'center'; c.fillStyle = '#c3d0b9'; c.font = '20px Georgia,serif'; c.fillText('A quiet moment. Stock up for the next order.', 480, 195); }
          c.fillStyle = '#dfb396'; c.beginPath(); c.roundRect(360, 324, 240, 56, 28); c.fill(); c.fillStyle = '#324b41'; c.font = '900 14px system-ui'; c.textAlign = 'center'; c.fillText('SERVE SELECTED  ·  SPACE', 480, 359);
          ITEMS.forEach((item, i) => { const x = 47 + i * 174, active = item === 'milk' ? froth.left : brew.item === item ? brew.left : 0, total = item === 'milk' ? froth.total : brew.total; c.fillStyle = '#455d50'; c.beginPath(); c.roundRect(x, 430, 162, 96, 11); c.fill(); c.strokeStyle = active ? '#e4c58f' : '#738674'; c.lineWidth = 2; c.stroke(); c.fillStyle = ['#c89370', '#eee1c3', '#b8c77b', '#b8927e', '#d8d58b'][i]; c.beginPath(); c.roundRect(x + 16, 454, 30, 35, 6); c.fill(); c.strokeStyle = '#cbd0b5'; c.beginPath(); c.arc(x + 49, 471, 8, -Math.PI / 2, Math.PI / 2); c.stroke(); c.fillStyle = '#ede2c6'; c.textAlign = 'left'; c.font = '900 14px system-ui'; c.fillText(item.toUpperCase(), x + 62, 460); c.fillStyle = '#bdccb1'; c.font = '12px system-ui'; c.fillText(active ? Math.ceil(active) + 's to ready' : 'Stock ' + stock[item] + '/4', x + 62, 483); c.font = '11px system-ui'; c.fillText('[' + ['C', 'M', 'T', 'X', 'L'][i] + '] ' + (i < 3 ? 'PREPARE' : 'RESTOCK'), x + 17, 513); if (active) { c.fillStyle = '#e4c58f'; c.fillRect(x + 4, 521, 154 * (1 - active / total), 3); } });
          c.fillStyle = '#e6dac1'; c.font = 'bold 13px system-ui'; c.textAlign = 'center'; c.fillText(message, 480, 571); c.restore();
        },
        inspect() { return { time, clock, score, served, lost, streak, best, selected, spawn, stock: { ...stock }, brew: { ...brew }, froth: { ...froth }, orders: orders.map(order => ({ ...order, need: [...RECIPES[order.type].need] })), ended }; }
      };
    }
  });
})();
