(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  Arcade.mount({
    id: 'orbit-guard', title: 'Orbit Guard', category: 'Strategy', accent: '#c4a4ff',
    description: 'Build a tiny defense. Hold the last outpost against eight incoming waves.',
    howTo: [
      'Protect the reactor through 8 waves. Select a build pad, choose a turret and press Build. Launch when your defense is ready.',
      'Tap a pad or use Left / Right to select. T cycles Pulse, Frost and Nova. B builds, U upgrades, X sells, N launches the next wave.',
      'Pulse is efficient damage. Frost slows groups. Nova deals splash damage. Upgrade chokepoints and mix turret types; the final wave brings a boss.'
    ],
    controls: [
      { id: 'left', label: '← Pad', keys: ['ArrowLeft', 'KeyA'] },
      { id: 'right', label: 'Pad →', keys: ['ArrowRight', 'KeyD'] },
      { id: 'type', label: 'Type', keys: ['KeyT'] },
      { id: 'build', label: 'Build', keys: ['KeyB', 'Space'] },
      { id: 'upgrade', label: 'Upgrade', keys: ['KeyU'] },
      { id: 'sell', label: 'Sell', keys: ['KeyX'] },
      { id: 'wave', label: 'Launch', keys: ['KeyN'] }
    ],
    medals: [2500, 6500, 10000],
    create(api) {
      const path = [{ x: -28, y: 155 }, { x: 140, y: 155 }, { x: 140, y: 385 }, { x: 365, y: 385 }, { x: 365, y: 190 }, { x: 590, y: 190 }, { x: 590, y: 433 }, { x: 795, y: 433 }, { x: 795, y: 276 }, { x: 978, y: 276 }];
      const pads = [
        { x: 216, y: 243 }, { x: 255, y: 461 }, { x: 282, y: 315 }, { x: 455, y: 281 },
        { x: 484, y: 112 }, { x: 674, y: 347 }, { x: 696, y: 486 }, { x: 866, y: 363 }
      ];
      const types = [
        { name: 'PULSE', color: '#91f9d5', cost: 90, damage: 16, range: 148, delay: 0.51, desc: 'Fast & focused' },
        { name: 'FROST', color: '#7acaff', cost: 125, damage: 7, range: 148, delay: 0.9, desc: 'Slows a group' },
        { name: 'NOVA', color: '#ffc48a', cost: 155, damage: 36, range: 175, delay: 1.45, desc: 'Splash damage' }
      ];
      const segments = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
      const totalLength = segments.reduce((a, b) => a + b, 0);
      const stars = Array.from({ length: 60 }, () => ({ x: api.random() * 960, y: api.random() * 600, r: api.random() * 1.3 + 0.4 }));
      let selected = 0, chosen = 0, credits = 260, integrity = 15, wave = 0, kills = 0, score = 0;
      let active = false, pending = 0, spawnTimer = 0, intermission = -1, waveSize = 0, ended = false, elapsed = 0, uid = 0;
      let notice = 'SELECT A PAD. BUILD YOUR FIRST DEFENSE.', noticeTime = 5;
      const enemies = [], bullets = [], impacts = [];

      function ui() {
        api.score(score);
        api.hud([{ label: 'Wave', value: wave + ' / 8' }, { label: 'Credits', value: credits }, { label: 'Reactor', value: integrity + ' / 15' }, { label: 'Phase', value: active ? 'Defend' : 'Build' }]);
      }
      ui();
      function say(text) { notice = text; noticeTime = 3; api.toast(text); }
      function at(distance) {
        let remaining = distance;
        for (let i = 0; i < segments.length; i++) {
          if (remaining <= segments[i]) {
            const t = remaining / segments[i];
            return { x: path[i].x + (path[i + 1].x - path[i].x) * t, y: path[i].y + (path[i + 1].y - path[i].y) * t };
          }
          remaining -= segments[i];
        }
        return { x: 978, y: 276 };
      }
      function build() {
        const pad = pads[selected], type = types[chosen];
        if (pad.tower) { say('THIS PAD HAS A TURRET. USE UPGRADE.'); return; }
        if (credits < type.cost) { say('NEED ' + type.cost + ' CREDITS FOR ' + type.name); return; }
        credits -= type.cost;
        pad.tower = { type: chosen, level: 1, cool: 0.1, spent: type.cost, angle: -Math.PI / 2 };
        api.burst(pad.x, pad.y, type.color, 14); api.sound('good'); say(type.name + ' ONLINE');
      }
      function upgrade() {
        const tower = pads[selected].tower;
        if (!tower) { say('BUILD A TURRET ON THIS PAD FIRST.'); return; }
        if (tower.level >= 3) { say('TURRET IS AT MAX LEVEL.'); return; }
        const cost = 75 * tower.level;
        if (credits < cost) { say('UPGRADE NEEDS ' + cost + ' CREDITS.'); return; }
        credits -= cost; tower.spent += cost; tower.level++;
        api.burst(pads[selected].x, pads[selected].y, types[tower.type].color, 20); api.sound('good', 1.3); say('UPGRADED TO LEVEL ' + tower.level);
      }
      function sell() {
        const pad = pads[selected];
        if (!pad.tower) return;
        const refund = Math.floor(pad.tower.spent * 0.7); credits += refund; delete pad.tower;
        api.sound('click'); say('TURRET RECYCLED. +' + refund + ' CREDITS');
      }
      function launch() {
        if (active || wave >= 8) return;
        if (!pads.some(p => p.tower)) { say('BUILD AT LEAST ONE TURRET BEFORE LAUNCH.'); return; }
        wave++; waveSize = 6 + wave * 2; pending = waveSize; spawnTimer = 0.2; active = true; intermission = -1;
        api.sound('shoot', 0.6); say(wave === 8 ? 'FINAL WAVE. THE CARRIER IS INBOUND.' : 'WAVE ' + wave + ' INBOUND');
      }
      function spawn() {
        const index = waveSize - pending;
        let kind = wave === 8 && index === waveSize - 1 ? 'boss' : wave >= 3 && index % 4 === 3 ? 'brute' : wave >= 2 && index % 3 === 1 ? 'scout' : 'drone';
        const base = 33 * Math.pow(1.28, wave - 1);
        const factor = kind === 'boss' ? 6 : kind === 'brute' ? 2.7 : kind === 'scout' ? 0.68 : 1;
        const health = Math.round(base * factor);
        const speed = kind === 'boss' ? 41 : kind === 'brute' ? 44 : kind === 'scout' ? 99 + wave * 2 : 61 + wave * 2;
        enemies.push({ id: ++uid, x: -28, y: 155, progress: 0, hp: health, maxHp: health, speed, kind, slow: 0, r: kind === 'boss' ? 24 : kind === 'brute' ? 17 : 12, dead: false });
        pending--;
      }
      function damage(enemy, amount) {
        if (enemy.dead) return;
        enemy.hp -= amount;
        if (enemy.hp <= 0) {
          enemy.dead = true; kills++; credits += enemy.kind === 'boss' ? 100 : enemy.kind === 'brute' ? 28 : 16;
          score += enemy.kind === 'boss' ? 500 : enemy.kind === 'brute' ? 85 : 45;
          api.burst(enemy.x, enemy.y, enemy.kind === 'scout' ? '#f3a2ef' : '#b6a3ff', enemy.kind === 'boss' ? 28 : 9);
          api.sound('hit', 1 + (kills % 5) * 0.08);
        }
      }
      function finish(won) {
        ended = true;
        if (won) score += integrity * 100 + 700;
        api.end({ score, title: won ? 'The outpost holds.' : 'Reactor offline.', message: won ? 'All eight waves repelled. Try finishing with every reactor shield intact.' : 'Mix Frost with Nova at the bends, and upgrade the turrets covering the longest stretch.', stats: [{ label: 'Waves', value: wave + ' / 8' }, { label: 'Defeated', value: kills }, { label: 'Shields', value: integrity }, { label: 'Credits left', value: credits }] });
      }
      return {
        update(dt) {
          if (ended) return;
          elapsed += dt; noticeTime = Math.max(0, noticeTime - dt);
          const input = api.input;
          if (input.pressed('left')) selected = (selected + pads.length - 1) % pads.length;
          if (input.pressed('right')) selected = (selected + 1) % pads.length;
          if (input.pressed('type')) { chosen = (chosen + 1) % 3; api.sound('click'); }
          const pointer = input.pointer;
          if (pointer.pressed && pointer.inside) {
            for (let i = 0; i < pads.length; i++) if (Math.hypot(pointer.x - pads[i].x, pointer.y - pads[i].y) < 38) { selected = i; api.sound('click'); break; }
            if (pointer.y >= 540 && pointer.y <= 594 && pointer.x >= 18 && pointer.x <= 555) chosen = Math.min(2, Math.floor((pointer.x - 18) / 180));
            if (pointer.y >= 540 && pointer.x >= 785) launch();
          }
          if (input.pressed('build')) build();
          if (input.pressed('upgrade')) upgrade();
          if (input.pressed('sell')) sell();
          if (input.pressed('wave')) launch();
          if (!active && intermission >= 0) { intermission -= dt; if (intermission <= 0) launch(); }
          if (active && pending > 0) {
            spawnTimer -= dt;
            if (spawnTimer <= 0) { spawn(); spawnTimer = Math.max(0.49, 0.95 - wave * 0.04); }
          }
          for (const enemy of enemies) {
            if (enemy.dead) continue;
            enemy.slow = Math.max(0, enemy.slow - dt);
            enemy.progress += enemy.speed * (enemy.slow > 0 ? 0.48 : 1) * dt;
            const pos = at(enemy.progress); enemy.x = pos.x; enemy.y = pos.y;
            if (enemy.progress >= totalLength) {
              enemy.dead = true; integrity = Math.max(0, integrity - (enemy.kind === 'boss' ? 5 : enemy.kind === 'brute' ? 2 : 1));
              api.shake(5); api.sound('bad'); api.burst(928, 276, '#ff787e', 16);
              if (integrity <= 0) { finish(false); return; }
            }
          }
          for (const pad of pads) {
            const tower = pad.tower; if (!tower) continue;
            const type = types[tower.type]; tower.cool -= dt;
            const range = type.range + (tower.level - 1) * 17;
            let target = null;
            for (const e of enemies) if (!e.dead && Math.hypot(e.x - pad.x, e.y - pad.y) <= range && (!target || e.progress > target.progress)) target = e;
            if (target) {
              tower.angle = Math.atan2(target.y - pad.y, target.x - pad.x);
              if (tower.cool <= 0) {
                bullets.push({ x: pad.x, y: pad.y, target, type: tower.type, damage: type.damage * Math.pow(1.62, tower.level - 1), life: 1.5, level: tower.level });
                tower.cool = type.delay / (1 + (tower.level - 1) * 0.1);
              }
            }
          }
          for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i]; b.life -= dt;
            if (b.target.dead || b.life <= 0) { bullets.splice(i, 1); continue; }
            const dx = b.target.x - b.x, dy = b.target.y - b.y, d = Math.hypot(dx, dy), step = (b.type === 2 ? 390 : 600) * dt;
            if (d <= step + 9) {
              const x = b.target.x, y = b.target.y;
              if (b.type === 0) damage(b.target, b.damage);
              else {
                const radius = b.type === 2 ? 62 : 48;
                for (const e of enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < radius) { damage(e, b.damage); if (b.type === 1) e.slow = 1.6 + b.level * 0.2; }
                impacts.push({ x, y, radius, life: 0.32, type: b.type });
              }
              bullets.splice(i, 1);
            } else { b.x += dx / d * step; b.y += dy / d * step; }
          }
          for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
          for (let i = impacts.length - 1; i >= 0; i--) { impacts[i].life -= dt; if (impacts[i].life <= 0) impacts.splice(i, 1); }
          if (active && pending === 0 && enemies.length === 0) {
            active = false; credits += 60 + wave * 8; score += 180 + integrity * 4;
            if (wave === 8) { finish(true); return; }
            intermission = 12; say('WAVE CLEAR. BUILD & UPGRADE. NEXT WAVE IN 12s.'); api.sound('good');
          }
          ui();
        },
        draw(ctx) {
          ctx.save();
          const bg = ctx.createLinearGradient(0, 0, 960, 600); bg.addColorStop(0, '#111528'); bg.addColorStop(1, '#1b1831'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 600);
          stars.forEach(s => { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(elapsed + s.x); ctx.fillStyle = '#b3bde5'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(157,145,210,.055)'; ctx.lineWidth = 1;
          for (let x = 0; x < 960; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
          for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
          function route(color, width) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
          route('#302e4a', 50); route('#24243d', 42);
          ctx.setLineDash([7, 17]); ctx.lineDashOffset = -elapsed * 22; route('#585276', 2); ctx.setLineDash([]); ctx.lineDashOffset = 0;
          ctx.font = '900 15px system-ui'; ctx.fillStyle = '#9c8cbc'; ctx.textAlign = 'left'; ctx.fillText('INBOUND', 21, 117);
          ctx.save(); ctx.translate(923, 276); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#a78cf9'; ctx.shadowColor = '#a78cf9'; ctx.shadowBlur = 25; ctx.fillRect(-22, -22, 44, 44); ctx.shadowBlur = 0; ctx.fillStyle = '#f2ecff'; ctx.fillRect(-10, -10, 20, 20); ctx.restore();
          ctx.fillStyle = '#d9c9ff'; ctx.textAlign = 'center'; ctx.font = 'bold 13px system-ui'; ctx.fillText('REACTOR', 918, 329);
          const selectedPad = pads[selected], selectedType = selectedPad.tower ? types[selectedPad.tower.type] : types[chosen];
          const range = selectedType.range + (selectedPad.tower ? (selectedPad.tower.level - 1) * 17 : 0);
          ctx.fillStyle = selectedType.color + '0c'; ctx.strokeStyle = selectedType.color + '45'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(selectedPad.x, selectedPad.y, range, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          pads.forEach((pad, i) => {
            ctx.fillStyle = '#292b45'; ctx.strokeStyle = selected === i ? '#f2e9ff' : '#54516e'; ctx.lineWidth = selected === i ? 2.5 : 1.5;
            ctx.beginPath(); for (let v = 0; v < 6; v++) { const a = v / 6 * Math.PI * 2; const x = pad.x + Math.cos(a) * 28, y = pad.y + Math.sin(a) * 28; v ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); ctx.stroke();
            if (pad.tower) {
              const t = pad.tower, type = types[t.type];
              ctx.save(); ctx.translate(pad.x, pad.y); ctx.rotate(t.angle);
              ctx.fillStyle = type.color; ctx.shadowColor = type.color; ctx.shadowBlur = 9;
              ctx.fillRect(3, -5, 25, 10); ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
              ctx.fillStyle = '#232439'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
              for (let level = 0; level < t.level; level++) { ctx.fillStyle = type.color; ctx.fillRect(pad.x - t.level * 4 + level * 8, pad.y + 21, 5, 4); }
            } else {
              ctx.fillStyle = selected === i ? '#eee5ff' : '#8b87a5'; ctx.font = 'bold 19px system-ui'; ctx.textAlign = 'center'; ctx.fillText('+', pad.x, pad.y + 7);
            }
            ctx.fillStyle = '#827e9c'; ctx.font = 'bold 12px system-ui'; ctx.fillText(i + 1, pad.x, pad.y + 43);
          });
          enemies.forEach(e => {
            ctx.save(); ctx.translate(e.x, e.y);
            ctx.fillStyle = e.slow > 0 ? '#85d3ff' : e.kind === 'boss' ? '#ffbb87' : e.kind === 'brute' ? '#c1a4ee' : e.kind === 'scout' ? '#e798cf' : '#a49ce2';
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = e.kind === 'boss' ? 16 : 6;
            ctx.beginPath(); const sides = e.kind === 'scout' ? 3 : e.kind === 'boss' ? 6 : 4;
            for (let v = 0; v < sides; v++) { const a = v / sides * Math.PI * 2 + elapsed * (e.kind === 'brute' ? 0.5 : 1); v ? ctx.lineTo(Math.cos(a) * e.r, Math.sin(a) * e.r) : ctx.moveTo(Math.cos(a) * e.r, Math.sin(a) * e.r); }
            ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#242239'; ctx.beginPath(); ctx.arc(0, 0, e.r * 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#363043'; ctx.fillRect(-e.r, -e.r - 8, e.r * 2, 4); ctx.fillStyle = e.slow > 0 ? '#9edfff' : '#f8c9ec'; ctx.fillRect(-e.r, -e.r - 8, e.r * 2 * clamp(e.hp / e.maxHp, 0, 1), 4); ctx.restore();
          });
          bullets.forEach(b => { ctx.fillStyle = types[b.type].color; ctx.beginPath(); ctx.arc(b.x, b.y, b.type === 2 ? 5 : 3, 0, Math.PI * 2); ctx.fill(); });
          impacts.forEach(e => { ctx.globalAlpha = e.life * 1.8; ctx.strokeStyle = types[e.type].color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * (1 - e.life / 0.4), 0, Math.PI * 2); ctx.stroke(); }); ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(13,16,31,.92)'; ctx.fillRect(0, 0, 960, 64); ctx.fillRect(0, 532, 960, 68);
          ctx.fillStyle = '#e6dcff'; ctx.textAlign = 'left'; ctx.font = '900 21px system-ui'; ctx.fillText('ORBIT / GUARD', 24, 29);
          ctx.fillStyle = '#a29ab9'; ctx.font = '13px system-ui'; ctx.fillText('OUTPOST 08  ·  HOLD THE LINE', 24, 49);
          ctx.textAlign = 'right'; ctx.fillStyle = '#c4b6dc'; ctx.font = 'bold 16px system-ui';
          ctx.fillText(active ? 'INBOUND  ' + (pending + enemies.length) : wave === 0 ? 'BUILD PHASE' : 'NEXT WAVE  ' + Math.max(0, Math.ceil(intermission)) + 's', 935, 37);
          types.forEach((type, i) => {
            ctx.fillStyle = chosen === i ? '#34314b' : '#1b1d32'; ctx.fillRect(18 + i * 180, 540, 170, 51);
            ctx.fillStyle = type.color; ctx.textAlign = 'left'; ctx.font = '900 15px system-ui'; ctx.fillText(type.name + '  ' + type.cost, 30 + i * 180, 561);
            ctx.fillStyle = '#ada6bf'; ctx.font = '12px system-ui'; ctx.fillText(type.desc, 30 + i * 180, 581);
          });
          const tower = selectedPad.tower;
          ctx.textAlign = 'left'; ctx.fillStyle = '#e3dcf5'; ctx.font = 'bold 15px system-ui'; ctx.fillText('PAD ' + (selected + 1) + (tower ? ' · LV ' + tower.level : ' · EMPTY'), 570, 559);
          ctx.fillStyle = '#9e96b3'; ctx.font = '12px system-ui'; ctx.fillText(tower ? tower.level === 3 ? 'Max level · X to sell' : 'Upgrade: ' + (75 * tower.level) + ' credits' : 'B to build ' + types[chosen].name, 570, 580);
          ctx.fillStyle = active ? '#29283c' : '#c8b5fc'; ctx.fillRect(785, 542, 158, 46); ctx.fillStyle = active ? '#9288ad' : '#231a39'; ctx.font = '900 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText(active ? 'DEFENDING' : 'LAUNCH  →', 864, 571);
          if (noticeTime > 0) { ctx.fillStyle = '#eadfff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText(notice, 480, 81); }
          ctx.restore();
        },
        inspect() { return { wave, active, pending, enemies: enemies.length, enemyState: enemies.map(e => ({ kind: e.kind, hp: Math.round(e.hp), progress: Math.round(e.progress), slow: e.slow })), credits, integrity, score, kills, selected, chosen, intermission, ended, towers: pads.map(p => p.tower ? { type: p.tower.type, level: p.tower.level, spent: p.tower.spent } : null) }; }
      };
    }
  });
}());
