(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n)), TAU = Math.PI * 2;
  Arcade.mount({
    id: 'snowball-siege', title: 'Snowball Siege', category: 'Ballistic artillery', accent: '#bae6fd',
    description: 'Read the breeze. Leave a little less fort standing.',
    howTo: ['Take turns launching snowballs at the rival fort. Reduce its 150 health to zero before your 160 health, ten shots, or 150 seconds run out.', 'Left / Right lowers or raises the angle; Up / Down adjusts power. Space fires when it is your turn. The wind changes after each pair of shots.', 'Snow blocks stop enemy shots and break under the blast. High arcs clear the wall; close explosions deal more damage. Your own fort lets your shot leave freely.'],
    controls: [{ id: 'lower', label: 'Angle −', keys: ['ArrowLeft', 'KeyA'] }, { id: 'higher', label: 'Angle +', keys: ['ArrowRight', 'KeyD'] }, { id: 'powerUp', label: 'Power +', keys: ['ArrowUp', 'KeyW'] }, { id: 'powerDown', label: 'Power −', keys: ['ArrowDown', 'KeyS'] }, { id: 'fire', label: 'Fire', keys: ['Space'] }], medals: [600, 1800, 3200],
    create(api) {
      const player = { x: 170, y: 440, hp: 160 }, rival = { x: 790, y: 440, hp: 150 }; let blocks = [], angle = 1.02, power = 350, wind = (api.random() - .5) * 36, projectile = null, explosion = null, phase = 'aim', wait = 0, round = 1, ammo = 10, time = 150, score = 0, destroyed = 0, damageDealt = 0, enemyAngle = 1, ended = false;
      for (const [team, x] of [['player', 170], ['rival', 790]]) for (const [dx, dy] of [[-49, -10], [-49, -42], [-49, -74], [49, -10], [49, -42], [0, -82]]) blocks.push({ team, x: x + dx - 15, y: 440 + dy - 15, w: 30, h: 30 });
      function finish(won) { if (ended) return; ended = true; if (won) score += 850 + player.hp * 6 + Math.floor(time * 4); api.score(score); api.end({ score, title: won ? 'The snow has settled in your favor.' : 'A different arc next time.', message: won ? 'The rival fort is quiet. A good angle and a patient reading of the wind can change a whole round.' : 'Watch where each shot lands. Raise the angle to clear the fort, then adjust power for the next breeze.', stats: [{ label: 'Rival damage', value: damageDealt }, { label: 'Blocks cleared', value: destroyed }, { label: 'Shots used', value: 10 - ammo }] }); }
      function launch(owner, a, force) { const unit = owner === 'player' ? player : rival, direction = owner === 'player' ? 1 : -1; projectile = { owner, x: unit.x + Math.cos(a) * 25 * direction, y: unit.y - 18 - Math.sin(a) * 25, vx: Math.cos(a) * force * direction, vy: -Math.sin(a) * force, life: 0 }; phase = owner + '-flight'; api.sound('shoot'); }
      function blast(x, y, owner) { projectile = null; explosion = { x, y, life: .55, owner }; const old = blocks.length; blocks = blocks.filter(b => Math.hypot(b.x + 15 - x, b.y + 15 - y) > 83); const removed = old - blocks.length; destroyed += removed; if (owner === 'player') score += removed * 25;
        for (const unit of [player, rival]) { const amount = Math.max(0, Math.round((1 - Math.hypot(unit.x - x, unit.y - y) / 92) * 65)); const dealt = Math.min(unit.hp, amount); unit.hp -= dealt; if (unit === rival) { damageDealt += dealt; score += dealt * 7; } }
        api.burst(x, y, '#eff5e9', 22); api.sound('hit'); api.shake(4); if (rival.hp <= 0 || player.hp <= 0) { finish(rival.hp <= 0 && player.hp > 0); return; } phase = 'settle'; }
      function ui() { api.score(score); api.hud([{ label: 'Your fort', value: player.hp }, { label: 'Rival fort', value: rival.hp }, { label: 'Wind', value: (wind < 0 ? '← ' : '→ ') + Math.abs(Math.round(wind)) }, { label: 'Turn', value: phase === 'aim' ? 'Your shot' : phase === 'player-flight' ? 'In flight' : 'Rival' }, { label: 'Shots', value: ammo }]); }
      ui();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); if (!time) { finish(false); return; }
          if (phase === 'aim') { angle = clamp(angle + (Number(api.input.down('higher')) - Number(api.input.down('lower'))) * .7 * dt, .42, 1.35); power = clamp(power + (Number(api.input.down('powerUp')) - Number(api.input.down('powerDown'))) * 125 * dt, 220, 470); if (api.input.pressed('fire')) { ammo--; launch('player', angle, power); } }
          else if (phase === 'ai-wait') { wait -= dt; if (wait <= 0) { enemyAngle = .9 + api.random() * .25; const error = (api.random() - .5) * Math.max(70, 210 - round * 14), dx = player.x + error - rival.x, denominator = -Math.sin(2 * enemyAngle) / 180 + 2 * wind * Math.sin(enemyAngle) ** 2 / (180 * 180); const force = clamp(Math.sqrt(Math.abs(dx / denominator)), 270, 465); launch('rival', enemyAngle, force); } }
          if (projectile) {
            const p = projectile; p.life += dt;
            for (let sub = 0; sub < 3 && projectile; sub++) { const step = dt / 3; p.vx += wind * step; p.vy += 180 * step; p.x += p.vx * step; p.y += p.vy * step;
              const other = p.owner === 'player' ? rival : player, block = blocks.some(b => b.team !== p.owner && p.x + 7 > b.x && p.x - 7 < b.x + b.w && p.y + 7 > b.y && p.y - 7 < b.y + b.h);
              if (block || Math.hypot(p.x - other.x, p.y - other.y) < 23 || p.y >= 465 || p.life > 8 || p.x < -100 || p.x > 1060) { blast(clamp(p.x, -50, 1010), Math.min(465, p.y), p.owner); if (ended) return; }
            }
          }
          if (phase === 'settle' && explosion) { explosion.life -= dt; if (explosion.life <= 0) { const owner = explosion.owner; explosion = null; if (owner === 'player') { phase = 'ai-wait'; wait = .85; } else { if (!ammo) { finish(false); return; } round++; wind = (api.random() - .5) * 36; phase = 'aim'; api.toast('Your shot · the breeze has changed'); } } }
          ui();
        },
        draw(ctx) {
          ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#9cb8cf'); g.addColorStop(1, '#d9e6e0'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#eef0d9'; ctx.beginPath(); ctx.arc(710, 114, 52, 0, TAU); ctx.fill(); ctx.fillStyle = '#afc5cf'; ctx.beginPath(); ctx.moveTo(0, 462); for (let x = 0; x <= 960; x += 80) ctx.lineTo(x, 375 + Math.sin(x * .014) * 26); ctx.lineTo(960, 600); ctx.lineTo(0, 600); ctx.fill();
          for (let i = 0; i < 13; i++) { const x = i * 83 - 10, y = 385 + i % 3 * 15; ctx.fillStyle = '#799da5'; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x - 27, y); ctx.lineTo(x + 27, y); ctx.fill(); }
          ctx.fillStyle = '#edf1e6'; ctx.fillRect(0, 464, 960, 136); ctx.strokeStyle = '#c6d9d6'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(i * 121 + 22, 520 + i % 3 * 23, 43, 7, 0, 0, TAU); ctx.stroke(); }
          blocks.forEach(b => { ctx.fillStyle = '#bfd3d9'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill(); ctx.fillStyle = '#f4f5e9'; ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 5); ctx.strokeStyle = '#8fadb988'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h); });
          const fort = (unit, color, direction, aim) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(unit.x - 21, unit.y - 12, 42, 28, 8); ctx.fill(); ctx.strokeStyle = '#587482'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(unit.x, unit.y - 15); ctx.lineTo(unit.x + Math.cos(aim) * 30 * direction, unit.y - 15 - Math.sin(aim) * 30); ctx.stroke(); ctx.fillStyle = '#f4eee0'; ctx.beginPath(); ctx.arc(unit.x, unit.y - 20, 13, 0, TAU); ctx.fill(); ctx.fillStyle = '#566c7c'; ctx.fillRect(unit.x - 8, unit.y - 24, 5, 4); ctx.fillRect(unit.x + 3, unit.y - 24, 5, 4); }; fort(player, '#8eb7ad', 1, angle); fort(rival, '#c591a8', -1, enemyAngle);
          if (phase === 'aim') { ctx.setLineDash([3, 7]); ctx.strokeStyle = '#557c85'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(player.x, player.y - 18); ctx.lineTo(player.x + Math.cos(angle) * 125, player.y - 18 - Math.sin(angle) * 125); ctx.stroke(); ctx.setLineDash([]); }
          if (projectile) { ctx.fillStyle = '#fffdf0'; ctx.beginPath(); if (projectile.y < 15) { const x = clamp(projectile.x, 20, 940); ctx.moveTo(x, 9); ctx.lineTo(x - 7, 20); ctx.lineTo(x + 7, 20); } else ctx.arc(projectile.x, projectile.y, 7, 0, TAU); ctx.fill(); } if (explosion) { ctx.globalAlpha = Math.max(0, explosion.life / .55); ctx.fillStyle = '#fafbe6'; ctx.beginPath(); ctx.arc(explosion.x, explosion.y, 20 + (1 - explosion.life / .55) * 65, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
          ctx.textAlign = 'center'; ctx.font = '800 17px system-ui'; ctx.fillStyle = '#4a707f'; ctx.fillText('READ THE BREEZE. FIND YOUR ARC.', 480, 35); ctx.font = '800 18px system-ui'; ctx.fillText('ANGLE ' + Math.round(angle * 180 / Math.PI) + '°', 310, 548); ctx.fillText('POWER ' + Math.round(power), 580, 548); ctx.font = '700 14px system-ui'; ctx.fillText('ROUND ' + round + '  ·  ' + Math.ceil(time) + ' SECONDS', 480, 580); ctx.restore();
        },
        inspect() { return { player: { ...player }, rival: { ...rival }, blocks: blocks.map(b => ({ ...b })), angle, power, wind, projectile: projectile && { ...projectile }, explosion: explosion && { ...explosion }, phase, wait, round, ammo, time, score, destroyed, damageDealt, ended }; }
      };
    }
  });
})();
