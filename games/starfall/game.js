/* Starfall — a five-sector bullet-dodging space arcade. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const rounded = (c, x, y, w, h, color, r = 8) => { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  Arcade.mount({
    id: 'starfall', title: 'Starfall', category: 'Space shooter', accent: '#93c5fd',
    description: 'A tiny ship. An enormous sky. Break the blockade and bring down the mothership.',
    howTo: [
      'Clear four enemy fleets, then defeat the sector-five mothership. Your ship fires automatically.',
      'Move with arrows / WASD, the direction buttons, or drag on the scene. Space / X releases a pulse that clears hostile shots and shields you for 2 seconds.',
      'Collect blue weapon cores and green repairs. The bright center of your ship is its small collision zone. Move out of red laser warnings.'
    ],
    controls: [
      { id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] },
      { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] },
      { id: 'up', label: '↑', keys: ['ArrowUp', 'KeyW'] },
      { id: 'down', label: '↓', keys: ['ArrowDown', 'KeyS'] },
      { id: 'pulse', label: 'Pulse ◉', keys: ['Space', 'KeyX'] }
    ],
    medals: [1600, 4000, 7000],
    create(api) {
      const W = api.w, H = api.h;
      const ship = { x: W / 2, y: H - 94, hp: 5, inv: 1.6, shield: 0, power: 1 };
      let sector = 1, totalKills = 0, score = 0, clock = 0, ended = false;
      let enemies = [], shots = [], bullets = [], drops = [];
      let remaining = 10, spawnTimer = 0.5, fireTimer = 0, pulseCooldown = 0, intermission = 0;
      let waveCleared = false, pulseRing = 0, boss = null, laser = null, cleanSectors = 0, sectorDamage = false;
      const stars = Array.from({ length: 100 }, (_, i) => ({ x: i * 137.37 % W, y: i * 73.93 % H, layer: i % 3 + 1 }));

      function finish(win) {
        if (ended) return;
        ended = true;
        if (win) score += 1500 + ship.hp * 250;
        api.score(score); api.sound(win ? 'win' : 'bad');
        api.end({ score, title: win ? 'The sky is yours' : 'Signal lost. Pilot remembered.',
          message: win ? 'Blockade broken. Chase a damage-free flight for a bigger score.' : 'Use Pulse before the screen fills up. Small movements beat big panicked sweeps.',
          stats: [{ label: 'Sector', value: sector + ' / 5' }, { label: 'Ships defeated', value: totalKills }, { label: 'Clean fleets', value: cleanSectors }] });
      }

      function damage() {
        if (ship.inv > 0 || ship.shield > 0 || ended) return;
        ship.hp--; ship.inv = 1.4; sectorDamage = true;
        api.sound('bad'); api.shake(7); api.burst(ship.x, ship.y, '#fb7185', 14);
        if (ship.hp <= 0) finish(false);
      }

      function spawnEnemy() {
        const kind = sector > 1 && api.random() < 0.35 ? 'wraith' : 'dart';
        const x = 85 + api.random() * (W - 170);
        enemies.push({ x, origin: x, y: -45, hp: kind === 'wraith' ? 30 : 18,
          r: kind === 'wraith' ? 23 : 17, kind, age: 0, phase: api.random() * 6.28,
          fire: 1.2 + api.random() * 0.8, speed: 66 + sector * 12 + api.random() * 16, flash: 0 });
      }

      function enemyDestroyed(enemy) {
        score += enemy.kind === 'wraith' ? 140 : 100; totalKills++;
        api.sound('hit', 0.9 + api.random() * 0.2); api.burst(enemy.x, enemy.y, enemy.kind === 'wraith' ? '#c4b5fd' : '#93c5fd', 13);
        if (totalKills % 7 === 0) drops.push({ x: enemy.x, y: enemy.y, type: ship.power < 3 ? 'power' : 'repair', life: 8 });
        else if (api.random() < 0.1 && ship.hp < 5) drops.push({ x: enemy.x, y: enemy.y, type: 'repair', life: 8 });
      }

      function pulse() {
        if (pulseCooldown > 0) return;
        pulseCooldown = 8; ship.shield = 2; pulseRing = 0.8;
        const count = bullets.length; bullets = [];
        for (const e of enemies) if (Math.hypot(e.x - ship.x, e.y - ship.y) < 250) e.hp -= 24;
        if (boss && Math.hypot(boss.x - ship.x, boss.y - ship.y) < 270) boss.hp -= 36;
        api.sound('good', 0.65); api.shake(3); api.toast('PULSE · ' + count + ' shots cleared');
      }

      function advanceSector() {
        sector++;
        sectorDamage = false; waveCleared = false;
        if (sector === 5) {
          boss = { x: W / 2, y: 105, hp: 560, maxHp: 560, age: 0, fire: 1.5, laserTimer: 6, flash: 0 };
          remaining = 0; api.toast('SECTOR 05 · THE MOTHERSHIP');
        } else { remaining = 8 + sector * 3; spawnTimer = 0.6; api.toast('SECTOR 0' + sector + ' · Fleet incoming'); }
        api.sound('win');
      }

      function update(dt) {
        if (ended) return;
        clock += dt;
        ship.inv = Math.max(0, ship.inv - dt); ship.shield = Math.max(0, ship.shield - dt);
        pulseCooldown = Math.max(0, pulseCooldown - dt); pulseRing = Math.max(0, pulseRing - dt);
        const dx = Number(api.input.down('right')) - Number(api.input.down('left'));
        const dy = Number(api.input.down('down')) - Number(api.input.down('up'));
        const mag = Math.hypot(dx, dy) || 1;
        ship.x += dx / mag * 370 * dt; ship.y += dy / mag * 370 * dt;
        const pointer = api.input.pointer;
        if (pointer.down && pointer.inside && !dx && !dy) {
          const tx = pointer.x, ty = pointer.y - 26;
          const angle = Math.atan2(ty - ship.y, tx - ship.x), travel = Math.min(600 * dt, Math.hypot(tx - ship.x, ty - ship.y));
          ship.x += Math.cos(angle) * travel; ship.y += Math.sin(angle) * travel;
        }
        ship.x = clamp(ship.x, 28, W - 28); ship.y = clamp(ship.y, 185, H - 35);
        if (api.input.pressed('pulse')) pulse();
        fireTimer -= dt;
        if (fireTimer <= 0) {
          fireTimer += ship.power >= 3 ? 0.145 : 0.18;
          shots.push({ x: ship.x, y: ship.y - 28, vy: -780, vx: 0, damage: 10 });
          if (ship.power >= 2) {
            shots.push({ x: ship.x - 14, y: ship.y - 14, vy: -750, vx: -32, damage: 6 });
            shots.push({ x: ship.x + 14, y: ship.y - 14, vy: -750, vx: 32, damage: 6 });
          }
          // Firing is intentionally quiet; impacts and warnings carry useful feedback.
        }
        if (sector < 5 && !waveCleared) {
          spawnTimer -= dt;
          if (remaining > 0 && spawnTimer <= 0) { spawnEnemy(); remaining--; spawnTimer = 0.7 + api.random() * 0.35; }
        }
        for (const enemy of enemies) {
          enemy.age += dt; enemy.y += enemy.speed * dt;
          enemy.x = clamp(enemy.origin + Math.sin(enemy.age * 1.65 + enemy.phase) * (enemy.kind === 'wraith' ? 85 : 36), 30, W - 30);
          enemy.fire -= dt; enemy.flash = Math.max(0, enemy.flash - dt);
          if (enemy.fire <= 0 && enemy.y > 18 && enemy.y < H - 150) {
            const a = Math.atan2(ship.y - enemy.y, ship.x - enemy.x);
            const spreads = enemy.kind === 'wraith' ? [-0.16, 0, 0.16] : [0];
            for (const spread of spreads) bullets.push({ x: enemy.x, y: enemy.y + 12, vx: Math.cos(a + spread) * (185 + sector * 16), vy: Math.sin(a + spread) * (185 + sector * 16), r: enemy.kind === 'wraith' ? 5 : 6 });
            enemy.fire = 1.7 + api.random() * 0.8;
          }
          if (Math.hypot(enemy.x - ship.x, enemy.y - ship.y) < enemy.r + 9) { enemy.hp = 0; damage(); if (ended) return; }
        }
        if (boss) {
          boss.age += dt; boss.x = W / 2 + Math.sin(boss.age * 0.68) * 275;
          boss.fire -= dt; boss.flash = Math.max(0, boss.flash - dt); boss.laserTimer -= dt;
          if (boss.fire <= 0) {
            const aim = Math.atan2(ship.y - boss.y, ship.x - boss.x);
            const enraged = boss.hp < boss.maxHp * 0.45;
            const n = enraged ? 9 : 7;
            for (let j = 0; j < n; j++) {
              const a = aim + (j - (n - 1) / 2) * 0.17;
              bullets.push({ x: boss.x, y: boss.y + 40, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, r: 6 });
            }
            boss.fire = enraged ? 0.95 : 1.3;
          }
          if (boss.laserTimer <= 0) { laser = { x: ship.x, warning: 1.3, life: 0.5 }; boss.laserTimer = 5; api.sound('bad', 1.8); }
        }
        if (laser) {
          if (laser.warning > 0) laser.warning -= dt;
          else { laser.life -= dt; if (Math.abs(ship.x - laser.x) < 28) { damage(); if (ended) return; } }
          if (laser.life <= 0) laser = null;
        }
        for (const shot of shots) {
          const oldY = shot.y; shot.y += shot.vy * dt; shot.x += shot.vx * dt;
          for (const e of enemies) {
            if (e.hp > 0 && !shot.dead && Math.abs(shot.x - e.x) < e.r + 3 && shot.y < e.y + e.r && oldY > e.y - e.r) {
              e.hp -= shot.damage; e.flash = 0.08; shot.dead = true;
            }
          }
          if (boss && !shot.dead && Math.abs(shot.x - boss.x) < 80 && shot.y < boss.y + 46 && oldY > boss.y - 35) {
            boss.hp -= shot.damage; boss.flash = 0.06; shot.dead = true;
          }
        }
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (e.hp <= 0) { enemyDestroyed(e); enemies.splice(i, 1); }
          else if (e.y > H + 60) { enemies.splice(i, 1); score = Math.max(0, score - 30); }
        }
        for (const bullet of bullets) {
          bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt;
          if (Math.hypot(bullet.x - ship.x, bullet.y - ship.y) < bullet.r + 8) {
            bullet.dead = true; damage(); if (ended) return;
          }
        }
        for (const drop of drops) {
          drop.y += dt * 90; drop.life -= dt;
          if (Math.hypot(drop.x - ship.x, drop.y - ship.y) < 31) {
            drop.life = 0; score += 80; api.sound('good', 1.2); api.burst(drop.x, drop.y, '#a7f3d0', 9);
            if (drop.type === 'power') { ship.power = Math.min(3, ship.power + 1); api.toast('WEAPON CORE · Level ' + ship.power); }
            else { ship.hp = Math.min(5, ship.hp + 1); api.toast('Hull repaired +1'); }
          }
        }
        shots = shots.filter(s => s.y > -30 && !s.dead).slice(-100);
        bullets = bullets.filter(b => !b.dead && b.y < H + 30 && b.y > -50 && b.x > -30 && b.x < W + 30).slice(-220);
        drops = drops.filter(d => d.life > 0 && d.y < H + 20);
        if (boss && boss.hp <= 0) {
          api.burst(boss.x, boss.y, '#c4b5fd', 50); totalKills++; finish(true); return;
        }
        if (sector < 5 && remaining === 0 && enemies.length === 0 && !waveCleared) {
          waveCleared = true; intermission = 2.4; bullets = [];
          if (!sectorDamage) { cleanSectors++; score += 250; api.toast('CLEAN SECTOR · +250'); }
          else api.toast('Sector clear · catch the next fleet');
          ship.hp = Math.min(5, ship.hp + 1);
        }
        if (waveCleared) { intermission -= dt; if (intermission <= 0) advanceSector(); }
        api.score(score);
        api.hud([{ label: 'Sector', value: sector + ' / 5' }, { label: 'Hull', value: '◆'.repeat(ship.hp) }, { label: 'Pulse', value: pulseCooldown > 0 ? pulseCooldown.toFixed(1) + 's' : 'READY' }]);
      }

      function drawShip(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        if (ship.inv > 0 && Math.floor(clock * 12) % 2) ctx.globalAlpha = 0.5;
        if (ship.shield > 0) { circle(ctx, 0, 0, 35, '#93c5fd1c'); ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 35, clock * 2, clock * 2 + Math.PI * 1.8); ctx.stroke(); }
        const flame = 16 + Math.sin(clock * 35) * 5;
        ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.moveTo(-9, 16); ctx.lineTo(0, 26 + flame); ctx.lineTo(9, 16); ctx.fill();
        ctx.fillStyle = '#eff6ff'; ctx.beginPath(); ctx.moveTo(0, -29); ctx.lineTo(27, 20); ctx.lineTo(12, 17); ctx.lineTo(0, 6); ctx.lineTo(-12, 17); ctx.lineTo(-27, 20); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4d6ea7'; ctx.beginPath(); ctx.moveTo(0, -29); ctx.lineTo(0, 6); ctx.lineTo(-12, 17); ctx.lineTo(-5, -13); ctx.closePath(); ctx.fill();
        rounded(ctx, -4, -13, 8, 15, '#93c5fd', 3); circle(ctx, 0, 0, 3, '#ffffff');
        ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, 16); ctx.lineTo(-12, 0); ctx.moveTo(20, 16); ctx.lineTo(12, 0); ctx.stroke();
        ctx.restore();
      }

      function draw(ctx) {
        const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#090f28'); bg.addColorStop(0.5, '#142449'); bg.addColorStop(1, '#1b1539');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const nebula = ctx.createRadialGradient(780, 140, 20, 780, 140, 360); nebula.addColorStop(0, '#6d4b8b40'); nebula.addColorStop(1, '#0d153900'); ctx.fillStyle = nebula; ctx.fillRect(0, 0, W, H);
        circle(ctx, 810, 100, 72, '#233960'); circle(ctx, 830, 84, 65, '#162747');
        ctx.strokeStyle = '#4566a322'; ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(810, 100, 80 + i * 16, 30 + i * 6, -0.3, 0, Math.PI * 2); ctx.stroke(); }
        for (const s of stars) { const y = (s.y + clock * (16 + s.layer * 17)) % H; ctx.globalAlpha = 0.25 + s.layer * 0.2; ctx.fillStyle = '#dbeafe'; ctx.fillRect(s.x, y, s.layer > 2 ? 2 : 1, s.layer > 2 ? 4 : 2); }
        ctx.globalAlpha = 1;
        if (laser) {
          ctx.fillStyle = laser.warning > 0 ? '#fb718522' : '#fda4afaa'; ctx.fillRect(laser.x - 25, 0, 50, H);
          ctx.strokeStyle = laser.warning > 0 ? '#fb7185' : '#fff1f2'; ctx.lineWidth = laser.warning > 0 ? 2 : 8;
          ctx.setLineDash(laser.warning > 0 ? [9, 11] : []); ctx.beginPath(); ctx.moveTo(laser.x, 0); ctx.lineTo(laser.x, H); ctx.stroke(); ctx.setLineDash([]);
          if (laser.warning > 0) { ctx.font = '700 17px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fda4af'; ctx.fillText('MOVE', clamp(laser.x, 60, W - 60), 190); }
        }
        for (const s of shots) { rounded(ctx, s.x - 2.5, s.y - 10, 5, 20, '#bfdbfe', 2); ctx.fillStyle = '#60a5fa55'; ctx.fillRect(s.x - 4, s.y, 8, 24); }
        for (const e of enemies) {
          ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.sin(e.age * 2 + e.phase) * 0.13);
          const purple = e.kind === 'wraith'; ctx.fillStyle = e.flash > 0 ? '#ffffff' : purple ? '#9b84db' : '#647b9e';
          ctx.beginPath(); ctx.moveTo(0, e.r); ctx.lineTo(-e.r - 5, -e.r); ctx.lineTo(0, -e.r / 2); ctx.lineTo(e.r + 5, -e.r); ctx.closePath(); ctx.fill();
          circle(ctx, 0, 0, purple ? 7 : 5, purple ? '#f5d0fe' : '#fda4af');
          if (e.fire < 0.4 && e.y > 0 && e.y < H - 150) { ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.r + 8, 0, Math.PI * 2 * (1 - e.fire / 0.4)); ctx.stroke(); }
          ctx.restore();
        }
        if (boss) {
          ctx.save(); ctx.translate(boss.x, boss.y);
          ctx.fillStyle = boss.flash > 0 ? '#ffffff' : '#55477c'; ctx.beginPath(); ctx.moveTo(-100, -24); ctx.lineTo(-65, 32); ctx.lineTo(-24, 48); ctx.lineTo(0, 28); ctx.lineTo(24, 48); ctx.lineTo(65, 32); ctx.lineTo(100, -24); ctx.lineTo(47, -12); ctx.lineTo(0, -43); ctx.lineTo(-47, -12); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-85, -18); ctx.lineTo(-45, 21); ctx.lineTo(0, -22); ctx.lineTo(45, 21); ctx.lineTo(85, -18); ctx.stroke();
          circle(ctx, 0, 8, 14, '#f0abfc'); circle(ctx, 0, 8, 7, '#fff1f2');
          rounded(ctx, -65, 22, 18, 10, '#c4b5fd', 4); rounded(ctx, 47, 22, 18, 10, '#c4b5fd', 4); ctx.restore();
          rounded(ctx, 280, 24, 400, 7, '#c4b5fd22', 4); rounded(ctx, 280, 24, Math.max(0, 400 * boss.hp / boss.maxHp), 7, '#c4b5fd', 4);
          ctx.fillStyle = '#e9d5ff'; ctx.font = '700 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('THE MOTHERSHIP', W / 2, 51);
        }
        for (const b of bullets) { circle(ctx, b.x, b.y, b.r + 3, '#fb718522'); circle(ctx, b.x, b.y, b.r, '#fb7185'); circle(ctx, b.x - 1, b.y - 1, 2, '#ffe4e6'); }
        for (const d of drops) {
          const color = d.type === 'power' ? '#93c5fd' : '#a7f3d0';
          ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(clock * 1.4); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(-13, -13, 26, 26); ctx.restore();
          circle(ctx, d.x, d.y, 9, '#14273e'); ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.font = 'bold 20px system-ui'; ctx.fillText(d.type === 'power' ? '↑' : '+', d.x, d.y + 7);
        }
        if (pulseRing > 0 && !api.reducedMotion) { ctx.strokeStyle = '#93c5fd'; ctx.globalAlpha = pulseRing; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ship.x, ship.y, (0.8 - pulseRing) * 700 + 25, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
        drawShip(ctx, ship.x, ship.y);
        ctx.fillStyle = '#bfdbfeaa'; ctx.font = '600 14px system-ui'; ctx.textAlign = 'left'; ctx.fillText('WEAPON ' + '▰'.repeat(ship.power) + '▱'.repeat(3 - ship.power), 24, H - 22);
        ctx.textAlign = 'right'; ctx.fillText('AUTO FIRE ON', W - 24, H - 22);
        if (waveCleared) { ctx.fillStyle = '#c7d2fe'; ctx.font = '800 32px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SECTOR CLEAR', W / 2, 260); ctx.font = '16px system-ui'; ctx.fillText('Hull +1 · next jump in ' + Math.max(1, Math.ceil(intermission)), W / 2, 292); }
      }
      api.hud([{ label: 'Sector', value: '1 / 5' }, { label: 'Hull', value: '◆◆◆◆◆' }, { label: 'Pulse', value: 'READY' }]);
      return { update, draw, inspect: () => ({ sector, score, totalKills, remaining, ship: { ...ship }, boss: boss ? { ...boss } : null, enemies: enemies.map(e => ({ x: e.x, y: e.y, hp: e.hp, kind: e.kind })), bullets: bullets.map(b => ({ ...b })), pulseCooldown, ended }) };
    }
  });
})();
