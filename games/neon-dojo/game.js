/* Neon Dojo: a three-bout fighting ladder. All simulation uses the shared clock. */
(function () {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const FLOOR = 466;
  const opponents = [
    { name: 'RED FOX', color: '#fb7185', hp: 88, pace: 124, tell: 0.69, damage: 1, subtitle: 'Watch the wind-up. Find your opening.' },
    { name: 'IRON MOTH', color: '#fbbf24', hp: 112, pace: 145, tell: 0.59, damage: 1.1, subtitle: 'A kick breaks a guard. A jump evades a sweep.' },
    { name: 'VIOLET GHOST', color: '#c4b5fd', hp: 136, pace: 167, tell: 0.5, damage: 1.2, subtitle: 'The final challenger. Make every opening count.' }
  ];
  const attackData = {
    jab: { wind: 0.09, active: 0.11, recovery: 0.23, reach: 105, damage: 10, cost: 8 },
    kick: { wind: 0.19, active: 0.14, recovery: 0.35, reach: 146, damage: 19, cost: 19 },
    heavy: { wind: 0.59, active: 0.13, recovery: 0.62, reach: 143, damage: 21, cost: 0 },
    sweep: { wind: 0.62, active: 0.17, recovery: 0.65, reach: 137, damage: 16, cost: 0 }
  };
  Arcade.mount({
    id: 'neon-dojo', title: 'Neon Dojo', category: 'Fighting', accent: '#2dd4bf',
    description: 'Read the tell. Land the counter. Take the rooftop crown.',
    howTo: [
      'Defeat three rooftop challengers. Your health carries between bouts, with a 30-point recovery after a win.',
      'Move with A/D or arrows. Space jumps. J jabs, K kicks, and L holds guard. Touch buttons work together.',
      'Jump over orange sweeps. Guard just before a hit to parry. Kicks break enemy guards; stamina limits attack spam.'
    ],
    controls: [
      { id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] },
      { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] },
      { id: 'jump', label: 'Jump', keys: ['Space', 'ArrowUp', 'KeyW'] },
      { id: 'jab', label: 'Jab', keys: ['KeyJ', 'KeyZ'] },
      { id: 'kick', label: 'Kick', keys: ['KeyK', 'KeyX'] },
      { id: 'guard', label: 'Guard', keys: ['KeyL', 'KeyC', 'ShiftLeft'] }
    ],
    medals: [1000, 3000, 5000],
    create(api) {
      const fighter = (x, color, hp) => ({ x, y: 0, vy: 0, hp, maxHp: hp, color, face: x < 480 ? 1 : -1,
        action: null, stun: 0, flash: 0, guard: false, guardAge: 2, stamina: 100, step: 0, pressure: 0 });
      let bout = 0, score = 0, finished = false, timer = 70, intro = 1.65, transition = 0;
      let chain = 0, chainClock = 0, maxChain = 0, parries = 0, hits = 0, knockouts = 0;
      let aiClock = 0.85, aiGuard = 0, attackBuffer = null, bufferClock = 0;
      let banner = 'RED FOX', bannerTime = 1.6;
      const player = fighter(310, '#2dd4bf', 100);
      let enemy = fighter(650, opponents[0].color, opponents[0].hp);
      const skyline = Array.from({ length: 32 }, (_, i) => ({ x: i * 33 - 40, height: 45 + api.random() * 145, width: 22 + api.random() * 18, windows: api.random() }));

      function hud() {
        api.score(score);
        api.hud([{ label: 'Bout', value: `${bout + 1} / 3` }, { label: 'Health', value: `${Math.max(0, Math.ceil(player.hp))}` },
          { label: 'Stamina', value: `${Math.ceil(player.stamina)}` }, { label: 'Clock', value: `${Math.ceil(timer)}s` }]);
      }
      function startAttack(f, kind, isEnemy) {
        const base = attackData[kind];
        if (f.action || f.stun > 0 || (!isEnemy && f.stamina < base.cost)) return false;
        const data = Object.assign({}, base);
        if (isEnemy) {
          data.wind = opponents[bout].tell + (kind === 'sweep' ? 0.07 : kind === 'jab' ? -0.1 : 0);
          data.damage *= opponents[bout].damage;
          data.recovery += 0.05;
        } else f.stamina -= base.cost;
        f.face = player === f ? (enemy.x > f.x ? 1 : -1) : (player.x > f.x ? 1 : -1);
        f.action = { kind, time: 0, data, struck: false };
        f.guard = false;
        return true;
      }
      function finish(won, message) {
        if (finished) return;
        finished = true;
        api.end({ score, title: won ? 'Rooftop champion' : 'A worthy challenger', message,
          stats: [{ label: 'Opponents beaten', value: `${knockouts} / 3` }, { label: 'Best combo', value: `${maxChain}` },
            { label: 'Perfect parries', value: `${parries}` }] });
      }
      function hit(attacker, defender, action, isPlayer) {
        const distance = Math.abs(attacker.x - defender.x);
        const correctDirection = (defender.x - attacker.x) * attacker.face > -10;
        const low = action.kind === 'sweep';
        if (distance > action.data.reach || !correctDirection || Math.abs(attacker.y - defender.y) > 83 || (low && defender.y < -45)) return;
        action.struck = true;
        let damage = action.data.damage;
        const guarded = defender.guard && defender.stamina > 6 && defender.y === 0;
        if (guarded && !isPlayer && defender.guardAge < 0.19) {
          attacker.action = null;
          attacker.stun = 0.85;
          defender.stamina = Math.min(100, defender.stamina + 15);
          parries++;
          score += 100;
          banner = 'PERFECT PARRY'; bannerTime = 0.8;
          api.burst(defender.x + defender.face * 35, FLOOR + defender.y - 70, '#ccfbf1', 18);
          api.sound('good', 1.4);
          return;
        }
        if (guarded) {
          defender.stamina = Math.max(0, defender.stamina - (action.kind === 'kick' ? 40 : 24));
          if (isPlayer && action.kind === 'kick') {
            damage *= 0.8; defender.guard = false; aiGuard = 0; defender.stun = 0.6;
            banner = 'GUARD BREAK'; bannerTime = 0.7;
          } else {
            damage *= 0.16;
            defender.stun = 0.1;
            if (isPlayer) {
              // Repeating jabs into a visible guard gives the defender a short counter.
              defender.guard = false; aiGuard = 0; defender.stun = 0;
              startAttack(defender, 'jab', true);
              if (defender.action) defender.action.data.wind = 0.26;
              aiClock = 1.2;
            }
          }
          api.sound('hit', 1.5);
        } else {
          const committed = isPlayer && defender.action && defender.action.time > defender.action.data.wind * 0.45;
          if (!committed) {
            defender.stun = action.kind === 'kick' ? 0.33 : 0.2;
            defender.action = null;
          }
          api.sound(isPlayer ? 'hit' : 'bad', isPlayer ? 1.1 : 0.8);
        }
        defender.hp = Math.max(0, defender.hp - damage);
        defender.flash = 0.15;
        defender.x = clamp(defender.x + attacker.face * (guarded ? 9 : action.kind === 'kick' ? 35 : 18), 65, 895);
        api.burst(defender.x - attacker.face * 18, FLOOR + defender.y - (low ? 18 : 66), guarded ? '#dbeafe' : defender.color, 12);
        api.shake(isPlayer ? 3 : 6);
        if (isPlayer) {
          hits++;
          chain = chainClock > 0 ? chain + 1 : 1;
          chainClock = 1.8; maxChain = Math.max(maxChain, chain);
          score += Math.round(damage * 8) + Math.min(chain, 5) * 10;
          if (!guarded) {
            defender.pressure++;
            if (defender.pressure >= 2 && !defender.action) {
              defender.pressure = 0;
              aiGuard = 1.05;
              defender.x = clamp(defender.x + attacker.face * 18, 65, 895);
            }
          }
        } else { chain = 0; chainClock = 0; }
      }
      function tickFighter(f, dt, isPlayer) {
        f.stun = Math.max(0, f.stun - dt); f.flash = Math.max(0, f.flash - dt);
        f.vy += 1750 * dt; f.y += f.vy * dt;
        if (f.y >= 0) { f.y = 0; f.vy = 0; }
        f.stamina = clamp(f.stamina + (f.guard ? -5 : f.action ? 5 : 25) * dt, 0, 100);
        if (!f.action) return;
        const a = f.action; a.time += dt;
        if (a.time >= a.data.wind && a.time <= a.data.wind + a.data.active && !a.struck) hit(f, isPlayer ? enemy : player, a, isPlayer);
        if (f.action === a && a.time >= a.data.wind + a.data.active + a.data.recovery) f.action = null;
      }
      function nextBout() {
        bout++;
        if (bout >= opponents.length) { bout = 2; finish(true, 'All three challengers defeated. The rooftop is yours. Chase cleaner counters for a higher medal.'); return; }
        player.hp = Math.min(100, player.hp + 30); player.x = 310; player.y = 0; player.vy = 0; player.action = null;
        player.stamina = 100; player.stun = 0; player.guard = false; player.guardAge = 2;
        enemy = fighter(650, opponents[bout].color, opponents[bout].hp);
        timer = 70; intro = 1.65; aiClock = 0.85; aiGuard = 0; chainClock = 0; chain = 0;
        attackBuffer = null; bufferClock = 0; banner = opponents[bout].name; bannerTime = 1.6;
        api.toast(opponents[bout].subtitle);
      }
      hud();
      return {
        update(dt) {
          if (finished) return;
          bannerTime = Math.max(0, bannerTime - dt);
          if (transition > 0) { transition -= dt; if (transition <= 0) nextBout(); hud(); return; }
          if (intro > 0) { intro -= dt; hud(); return; }
          timer = Math.max(0, timer - dt);
          chainClock = Math.max(0, chainClock - dt);
          bufferClock = Math.max(0, bufferClock - dt);
          if (api.input.pressed('jab')) { attackBuffer = 'jab'; bufferClock = 0.22; }
          if (api.input.pressed('kick')) { attackBuffer = 'kick'; bufferClock = 0.22; }
          const heldGuard = api.input.down('guard') && !player.action && player.stun <= 0 && player.y === 0 && player.stamina > 5;
          if (heldGuard && !player.guard) player.guardAge = 0;
          else player.guardAge += dt;
          player.guard = heldGuard;
          if (player.stun <= 0) {
            if (!player.action) player.face = enemy.x >= player.x ? 1 : -1;
            const direction = (api.input.down('right') ? 1 : 0) - (api.input.down('left') ? 1 : 0);
            const movement = direction * (player.action ? 65 : player.guard ? 85 : 245) * dt;
            player.x = clamp(player.x + movement, 65, 895); player.step += Math.abs(movement) * 0.08;
            if (api.input.pressed('jump') && player.y === 0 && !player.action) { player.vy = -640; player.guard = false; api.sound('click', 1.2); }
            if (bufferClock > 0 && attackBuffer && !player.guard && startAttack(player, attackBuffer, false)) { attackBuffer = null; bufferClock = 0; }
          }
          const spec = opponents[bout];
          aiClock -= dt; aiGuard = Math.max(0, aiGuard - dt);
          enemy.guard = aiGuard > 0 && !enemy.action && enemy.stun <= 0 && enemy.stamina > 10;
          if (!enemy.action && enemy.stun <= 0) {
            enemy.face = player.x >= enemy.x ? 1 : -1;
            const gap = Math.abs(player.x - enemy.x);
            if (gap > 112 && !enemy.guard) {
              const move = enemy.face * spec.pace * dt;
              enemy.x = clamp(enemy.x + move, 65, 895); enemy.step += Math.abs(move) * 0.08;
            }
            if (aiClock <= 0 && !enemy.guard) {
              if (gap <= 155) {
                const choice = api.random();
                if (choice < 0.16 + bout * 0.035) { aiGuard = 0.65; aiClock = 0.78; }
                else { startAttack(enemy, choice < 0.45 ? 'sweep' : choice < 0.72 ? 'jab' : 'heavy', true); aiClock = 1.15 + api.random() * 0.5; }
              } else aiClock = 0.15;
            }
          }
          // Body separation keeps fighters from passing through each other on the floor.
          if (Math.abs(player.x - enemy.x) < 58 && Math.abs(player.y - enemy.y) < 65) {
            const push = (58 - Math.abs(player.x - enemy.x)) / 2;
            const direction = player.x <= enemy.x ? -1 : 1;
            player.x = clamp(player.x + direction * push, 65, 895);
            enemy.x = clamp(enemy.x - direction * push, 65, 895);
          }
          tickFighter(player, dt, true); tickFighter(enemy, dt, false);
          if (player.hp <= 0) { hud(); finish(false, enemy.hp <= 0 ? 'Double knockout! You both landed the final blow. Keep some health in reserve to claim the next bout.' : 'Use short jabs in recovery windows, jump over sweeps, and save stamina for a perfectly timed guard.'); return; }
          if (enemy.hp <= 0) {
            knockouts++; score += 500 + Math.round(timer * 6) + Math.round(player.hp * 3);
            enemy.action = null; player.action = null; transition = 1.6;
            banner = bout === 2 ? 'CHAMPION' : 'KNOCKOUT'; bannerTime = 1.6;
            api.sound('win'); api.burst(enemy.x, FLOOR - 80, enemy.color, 28);
          } else if (timer <= 0) { hud(); finish(false, 'Time expired. Close the distance and punish each recovery window to finish the next bout.'); return; }
          hud();
        },
        draw(ctx) {
          ctx.save();
          const bg = ctx.createLinearGradient(0, 0, 0, 600); bg.addColorStop(0, '#090d25'); bg.addColorStop(0.62, '#232048'); bg.addColorStop(1, '#101428');
          ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#f0e1ff'; ctx.beginPath(); ctx.arc(742, 114, 48, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1c1a39'; ctx.beginPath(); ctx.arc(762, 104, 45, 0, Math.PI * 2); ctx.fill();
          skyline.forEach((b, index) => {
            ctx.fillStyle = index % 2 ? '#141b37' : '#19213e'; ctx.fillRect(b.x, 352 - b.height, b.width, b.height + 55);
            ctx.fillStyle = index % 3 ? '#2dd4bf55' : '#fb718555';
            for (let y = 365 - b.height; y < 348; y += 15) for (let x = b.x + 5; x < b.x + b.width - 5; x += 9) if ((Math.floor(y) + index * 7) % 4 !== 0) ctx.fillRect(x, y, 3, 5);
          });
          ctx.fillStyle = '#151b30'; ctx.fillRect(0, 360, 960, 108);
          ctx.strokeStyle = '#33445f'; ctx.lineWidth = 4;
          for (let x = 35; x < 960; x += 95) { ctx.beginPath(); ctx.moveTo(x, 340); ctx.lineTo(x, 450); ctx.stroke(); }
          ctx.beginPath(); ctx.moveTo(0, 349); ctx.lineTo(960, 349); ctx.stroke();
          ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 3; ctx.shadowColor = '#2dd4bf'; ctx.shadowBlur = api.reducedMotion ? 0 : 12;
          ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(960, FLOOR); ctx.stroke(); ctx.shadowBlur = 0;
          const floor = ctx.createLinearGradient(0, FLOOR, 0, 600); floor.addColorStop(0, '#1d3041'); floor.addColorStop(1, '#0b1120');
          ctx.fillStyle = floor; ctx.fillRect(0, FLOOR + 2, 960, 134);
          ctx.strokeStyle = '#36516566'; ctx.lineWidth = 1;
          for (let x = -300; x < 1400; x += 100) { ctx.beginPath(); ctx.moveTo(480 + (x - 480) * 0.64, FLOOR); ctx.lineTo(x, 600); ctx.stroke(); }
          [487, 523, 574].forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); });
          drawHealth(ctx, 40, 47, 330, player.hp / player.maxHp, '#2dd4bf', 'YOU', false);
          drawHealth(ctx, 590, 47, 330, enemy.hp / enemy.maxHp, enemy.color, opponents[bout].name, true);
          ctx.fillStyle = '#a9bacf'; ctx.font = '700 15px system-ui'; ctx.textAlign = 'left'; ctx.fillText('ENERGY', 40, 109);
          ctx.fillStyle = '#263249'; ctx.fillRect(111, 100, 150, 8); ctx.fillStyle = player.stamina > 20 ? '#fbbf24' : '#fb7185'; ctx.fillRect(111, 100, 150 * player.stamina / 100, 8);
          ctx.textAlign = 'center'; ctx.fillStyle = '#e2e8f0'; ctx.font = '900 32px system-ui'; ctx.fillText(Math.ceil(timer), 480, 70);
          ctx.fillStyle = '#899bb6'; ctx.font = '700 13px system-ui'; ctx.fillText(`BOUT ${bout + 1} / 3`, 480, 94);
          drawFighter(ctx, player, false); drawFighter(ctx, enemy, true);
          if (enemy.action && enemy.action.time < enemy.action.data.wind) {
            const a = enemy.action, progress = a.time / a.data.wind;
            const color = a.kind === 'sweep' ? '#fbbf24' : '#fb7185';
            ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(enemy.x, FLOOR + enemy.y - 158, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
            ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.font = '900 15px system-ui'; ctx.fillText(a.kind === 'sweep' ? 'SWEEP · JUMP' : 'STRIKE · GUARD', clamp(enemy.x, 130, 830), FLOOR + enemy.y - 194);
          }
          if (chain >= 2 && chainClock > 0) { ctx.textAlign = 'left'; ctx.fillStyle = '#fbbf24'; ctx.font = '900 28px system-ui'; ctx.fillText(`${chain} HIT CHAIN`, 42, 160); }
          if (bannerTime > 0) {
            ctx.textAlign = 'center'; ctx.fillStyle = '#071022cc'; ctx.fillRect(225, 192, 510, 65);
            ctx.fillStyle = banner === 'PERFECT PARRY' ? '#5eead4' : banner === 'GUARD BREAK' ? '#fbbf24' : '#f8fafc';
            ctx.font = '900 35px system-ui'; ctx.fillText(banner, 480, 236);
            if (intro > 0) { ctx.fillStyle = '#b6c9df'; ctx.font = '600 17px system-ui'; ctx.fillText(opponents[bout].subtitle, 480, 289); }
          }
          ctx.fillStyle = '#6f859e'; ctx.textAlign = 'center'; ctx.font = '700 13px system-ui'; ctx.fillText('JAB → KICK     •     TIME YOUR GUARD     •     JUMP THE SWEEP', 480, 566);
          ctx.restore();
        },
        inspect() { return { bout: bout + 1, player: { x: player.x, y: player.y, hp: player.hp, stamina: player.stamina, action: player.action && player.action.kind, guard: player.guard }, enemy: { x: enemy.x, hp: enemy.hp, action: enemy.action && enemy.action.kind, guard: enemy.guard, stun: enemy.stun, attackTime: enemy.action ? enemy.action.time : null, windup: enemy.action ? enemy.action.data.wind : null, telegraph: !!(enemy.action && enemy.action.time < enemy.action.data.wind) }, timer, score, knockouts, parries, maxChain, finished, intro, transition }; }
      };

      function drawHealth(ctx, x, y, width, ratio, color, label, right) {
        ctx.fillStyle = '#10192ce8'; ctx.fillRect(x - 4, y - 4, width + 8, 26);
        ctx.fillStyle = '#334155'; ctx.fillRect(x, y, width, 18);
        ctx.fillStyle = color; ctx.fillRect(right ? x + width * (1 - ratio) : x, y, width * ratio, 18);
        ctx.textAlign = right ? 'right' : 'left'; ctx.fillStyle = '#e2e8f0'; ctx.font = '800 17px system-ui'; ctx.fillText(label, right ? x + width : x, y - 13);
      }
      function drawFighter(ctx, f, isEnemy) {
        const groundX = f.x, baseY = FLOOR + f.y;
        ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(groundX, FLOOR + 9, 50 + f.y * 0.05, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(groundX, baseY); ctx.scale(f.face, 1);
        if (f.hp <= 0) { ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.6; }
        const bob = f.y < 0 ? 0 : Math.sin(f.step) * 3;
        ctx.translate(0, bob);
        const a = f.action;
        let extend = 0;
        if (a) extend = a.time < a.data.wind ? -0.2 * a.time / a.data.wind : a.time < a.data.wind + a.data.active ? 1 : Math.max(0, 1 - (a.time - a.data.wind - a.data.active) / a.data.recovery);
        const kick = a && (a.kind === 'kick' || a.kind === 'sweep');
        const low = a && a.kind === 'sweep';
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        function limb(points, color, width) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
        const fabric = f.flash > 0 ? '#f8fafc' : f.color;
        limb([[-8, -52], [-23 - Math.sin(f.step) * 5, -27], [-30, -4]], '#253649', 18);
        if (kick && extend > 0) limb([[8, -54], [32 + extend * 30, -50 - (low ? -15 : 13)], [33 + extend * 95, low ? -20 : -62]], fabric, 17);
        else limb([[8, -52], [18 + Math.sin(f.step) * 6, -28], [27, -4]], fabric, 17);
        limb([[-8, -96], [-29, -75], [-17, -61]], '#253649', 14);
        limb([[0, -98], [0, -55]], fabric, 30);
        ctx.fillStyle = '#0b1728'; ctx.fillRect(-17, -64, 34, 8);
        if (f.guard) limb([[6, -94], [27, -95], [35, -125]], fabric, 14);
        else if (a && !kick && extend > 0) limb([[6, -94], [34 + extend * 10, -96], [35 + extend * 65, -101]], fabric, 14);
        else limb([[6, -94], [23 - extend * 12, -77], [39 - extend * 21, -93]], fabric, 14);
        ctx.fillStyle = '#0f2233'; ctx.beginPath(); ctx.arc(0, -121, 19, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = fabric; ctx.fillRect(-17, -129, 35, 11);
        ctx.fillStyle = '#e6fffb'; ctx.fillRect(6, -127, 10, 5);
        ctx.fillStyle = fabric; ctx.beginPath(); ctx.moveTo(-14, -126); ctx.lineTo(-39, -133 + Math.sin(api.time * 9) * 4); ctx.lineTo(-18, -118); ctx.fill();
        if (f.guard) { ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 4; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(13, -84, 55, -1.05, 1.05); ctx.stroke(); ctx.globalAlpha = 1; }
        if (f.stun > 0.4) { ctx.fillStyle = '#fde68a'; ctx.font = '800 24px system-ui'; ctx.textAlign = 'center'; ctx.fillText('✦', 0, -160); }
        if (a && extend > 0.5) { ctx.strokeStyle = `${f.color}99`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(36, -77, kick ? 75 : 53, -0.7, 0.3); ctx.stroke(); }
        ctx.restore();
      }
    }
  });
})();
