/* Skybound — original rooftop runner. No external assets or dependencies. */
(() => {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rect = (c, x, y, w, h, r = 8) => {
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  };

  Arcade.mount({
    id: 'skybound', title: 'Skybound', category: 'Platformer', accent: '#a7f3d0',
    description: 'Own the skyline. Double-jump between rooftops and dash through danger.',
    howTo: [
      'Reach the 1,200 m finish with your three hearts. Collect golden sun shards for points. Each new district restores one heart.',
      'Tap the scene, press Space / ↑, or use Jump. Press again in the air to double-jump. X / Shift dashes through drones and crates.',
      'Watch the next rooftop. Dash recharges in 3 seconds; it protects against obstacles, but cannot save a missed landing.'
    ],
    controls: [
      { id: 'jump', label: 'Jump ↟', keys: ['Space', 'ArrowUp', 'KeyW'] },
      { id: 'dash', label: 'Dash ⚡', keys: ['KeyX', 'ShiftLeft', 'ShiftRight'] }
    ],
    medals: [1200, 3000, 5200],
    create(api) {
      const W = api.w, H = api.h, target = 1200;
      const player = { x: 220, y: 420, vy: 0, w: 30, h: 46, jumps: 0, grounded: true, inv: 0, dash: 0 };
      let distance = 0, score = 0, lives = 3, gems = 0, chain = 0, bestChain = 0;
      let dashCooldown = 0, clock = 0, ended = false, district = 0, hitFlash = 0;
      let platforms = [{ x: -120, y: 466, w: 920 }];
      let obstacles = [], shards = [], trails = [], signs = [];
      const shades = ['#237d9b', '#246b8e', '#275979', '#1f6a7e'];
      const city = Array.from({ length: 18 }, (_, i) => ({ x: i * 82, h: 80 + (i * 47 % 155), w: 44 + (i * 17 % 41) }));

      function addRoof() {
        const last = platforms[platforms.length - 1];
        const stage = Math.floor(distance / 400);
        const gap = 75 + api.random() * (stage > 0 ? 65 : 45);
        const w = 315 + api.random() * 220;
        const y = clamp(last.y + (api.random() - 0.5) * 85, 390, 485);
        const x = last.x + last.w + gap;
        platforms.push({ x, y, w });
        // Every jump has a readable arc of shards that teaches its trajectory.
        for (let j = 0; j < 5; j++) {
          const t = j / 4;
          shards.push({ x: x - gap + t * (gap + 100), y: Math.min(last.y, y) - 65 - Math.sin(t * Math.PI) * 80, phase: j });
        }
        if (api.random() > 0.2) {
          const type = api.random() > 0.56 ? 'drone' : 'crate';
          obstacles.push({ x: x + w * 0.62, y: y - (type === 'drone' ? 82 : 36), w: type === 'drone' ? 48 : 38, h: 36, type, phase: api.random() * 6.28, hit: false });
        }
        // Safe landing and takeoff space on each side of obstacles.
        shards.push({ x: x + w * 0.25, y: y - 42, phase: 0 });
        if (api.random() > 0.65) signs.push({ x: x + 36, y, text: ['UP / UP', 'KEEP FLYING', 'SKY CLUB'][stage % 3] });
      }
      while (platforms[platforms.length - 1].x < W + 700) addRoof();

      function end(win) {
        if (ended) return;
        ended = true;
        if (win) score += 1000 + lives * 300;
        api.score(score);
        api.sound(win ? 'win' : 'bad');
        api.end({ score, title: win ? 'Above it all' : 'Catch your next skyline',
          message: win ? 'The entire city is behind you. A cleaner route and a longer shard chain can beat this run.' : 'Double-jump a little later to stretch your airtime. The next rooftop is within reach.',
          stats: [{ label: 'Distance', value: Math.floor(Math.min(target, distance)) + ' m' }, { label: 'Sun shards', value: gems }, { label: 'Best chain', value: bestChain }] });
      }

      function hurt(fall) {
        if (ended || (player.inv > 0 && !fall)) return;
        lives--; chain = 0; hitFlash = 0.25;
        api.sound('bad'); api.shake(7); api.burst(player.x, player.y + 20, '#fb7185', 14);
        if (lives <= 0) { end(false); return; }
        player.inv = 2; player.dash = 0;
        if (fall) {
          // Place the runner directly on a real roof; no repeated fall loop after rescue.
          const roof = platforms.find(p => p.x + p.w > 230 && p.x < 680) || platforms[platforms.length - 1];
          player.x = clamp(Math.max(220, roof.x + 70), roof.x + 30, roof.x + roof.w - 50);
          player.y = roof.y - player.h; player.vy = 0; player.jumps = 0; player.grounded = true;
          api.toast('Saved by the skyline · ' + lives + (lives === 1 ? ' heart left' : ' hearts left'));
        }
      }

      function jump() {
        if (player.jumps >= 2) return;
        player.vy = player.jumps === 0 ? -560 : -510;
        player.grounded = false; player.jumps++;
        api.sound('good', player.jumps === 1 ? 1.1 : 1.4);
        api.burst(player.x, player.y + player.h, player.jumps === 1 ? '#a7f3d0' : '#fde68a', 8);
      }

      function update(dt) {
        if (ended) return;
        clock += dt;
        const speed = 250 + Math.min(85, distance * 0.075);
        const scroll = speed * dt;
        distance += scroll * 0.08;
        score = Math.max(score, Math.floor(distance) + gems * 35 + bestChain * 4);
        dashCooldown = Math.max(0, dashCooldown - dt);
        player.dash = Math.max(0, player.dash - dt);
        player.inv = Math.max(0, player.inv - dt);
        hitFlash = Math.max(0, hitFlash - dt);
        if (api.input.pressed('jump') || (api.input.pointer.pressed && api.input.pointer.inside)) jump();
        if (api.input.pressed('dash') && dashCooldown <= 0) {
          player.dash = 0.45; dashCooldown = 3;
          api.sound('shoot', 1.5); api.toast('DASH · obstacle shield');
        }
        // Respawn offsets ease back without changing the constant-forward runner controls.
        if (player.x > 220) player.x = Math.max(220, player.x - dt * 70);
        const oldBottom = player.y + player.h;
        player.vy += 1550 * dt;
        player.y += player.vy * dt;
        player.grounded = false;
        for (const p of platforms) {
          p.x -= scroll;
          if (player.vy >= 0 && oldBottom <= p.y + 6 && player.y + player.h >= p.y && player.x + player.w / 2 > p.x + 2 && player.x - player.w / 2 < p.x + p.w - 2) {
            player.y = p.y - player.h; player.vy = 0; player.grounded = true; player.jumps = 0;
          }
        }
        if (!player.grounded && player.jumps === 0 && player.vy > 130) player.jumps = 1;
        for (const obstacle of obstacles) {
          obstacle.x -= scroll;
          const oy = obstacle.y + (obstacle.type === 'drone' ? Math.sin(clock * 3 + obstacle.phase) * 12 : 0);
          if (!obstacle.hit && Math.abs(player.x - obstacle.x) < (player.w + obstacle.w) / 2 - 5 && player.y + player.h > oy + 7 && player.y < oy + obstacle.h - 3) {
            obstacle.hit = true;
            if (player.dash > 0) {
              gems += 2; score += 70; api.sound('hit'); api.burst(obstacle.x, oy, '#fde68a', 14);
            } else hurt(false);
            if (ended) return;
          }
        }
        for (let i = shards.length - 1; i >= 0; i--) {
          const g = shards[i]; g.x -= scroll;
          if (Math.abs(player.x - g.x) < 29 && Math.abs(player.y + player.h / 2 - g.y) < 36) {
            shards.splice(i, 1); gems++; chain++; bestChain = Math.max(bestChain, chain);
            api.sound('good', 1 + Math.min(chain, 20) * 0.035); api.burst(g.x, g.y, '#fde68a', 5);
            if (chain % 10 === 0) api.toast(chain + ' shard chain!');
          } else if (g.x < player.x - 55) {
            if (!g.missed) { g.missed = true; chain = 0; }
            if (g.x < -30) shards.splice(i, 1);
          }
        }
        for (const sign of signs) sign.x -= scroll;
        platforms = platforms.filter(p => p.x + p.w > -100);
        obstacles = obstacles.filter(o => o.x > -100 && !o.hit);
        signs = signs.filter(s => s.x > -140);
        while (platforms[platforms.length - 1].x < W + 700) addRoof();
        if (!api.reducedMotion) {
          trails.push({ x: player.x - 9, y: player.y + 20, life: player.dash > 0 ? 0.3 : 0.12 });
          for (const t of trails) { t.x -= scroll; t.life -= dt; }
          trails = trails.filter(t => t.life > 0).slice(-18);
        }
        if (player.y > H + 70) { hurt(true); if (ended) return; }
        const currentDistrict = Math.min(2, Math.floor(distance / 400));
        if (currentDistrict > district) { district = currentDistrict; lives = Math.min(3, lives + 1); api.toast(['', 'District 02 · Highline · heart restored', 'District 03 · Golden mile · heart restored'][district]); api.sound('win'); }
        if (distance >= target) { end(true); return; }
        api.score(score);
        api.hud([{ label: 'Route', value: Math.floor(distance) + ' / 1,200 m' }, { label: 'Hearts', value: '♥'.repeat(lives) }, { label: 'Dash', value: dashCooldown > 0 ? dashCooldown.toFixed(1) + 's' : 'READY' }]);
      }

      function draw(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#183f68'); sky.addColorStop(0.52, '#5597a5'); sky.addColorStop(1, '#f7c79e');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        // Sunrise, clouds, distant architecture and drifting sky lanes.
        ctx.fillStyle = '#ffdcad'; ctx.beginPath(); ctx.arc(760, 170, 70, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff0cf22'; ctx.beginPath(); ctx.arc(760, 170, 105, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 7; i++) {
          const x = ((i * 178 - distance * 0.5) % 1250 + 1250) % 1250 - 140;
          ctx.fillStyle = '#e3f1e744'; rect(ctx, x, 95 + (i % 3) * 48, 100 + i % 2 * 60, 9, 8);
        }
        for (const b of city) {
          const x = ((b.x - distance * 1.1) % 1450 + 1450) % 1450 - 180;
          ctx.fillStyle = '#2b647e'; rect(ctx, x, 490 - b.h, b.w, b.h + 110, 3);
          ctx.fillStyle = '#91b6b933';
          for (let k = 0; k < 5; k++) ctx.fillRect(x + 10, 503 - b.h + k * 30, b.w - 20, 4);
        }
        ctx.strokeStyle = '#fff6c61a'; ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 180 + i * 58); ctx.lineTo(W, 145 + i * 58); ctx.stroke(); }
        for (let i = 0; i < platforms.length; i++) {
          const p = platforms[i];
          ctx.fillStyle = '#17374b'; rect(ctx, p.x, p.y + 7, p.w, H - p.y + 30, 6);
          ctx.fillStyle = shades[i % shades.length]; ctx.fillRect(p.x + 7, p.y + 23, p.w - 14, H - p.y);
          ctx.fillStyle = '#a7f3d0'; rect(ctx, p.x - 4, p.y, p.w + 8, 9, 3);
          ctx.fillStyle = '#10394b'; ctx.fillRect(p.x + 10, p.y + 9, p.w - 20, 9);
          for (let k = 0; k < p.w / 48 - 1; k++) {
            ctx.fillStyle = k % 3 === 1 ? '#fcd89b99' : '#9cd3ce33';
            rect(ctx, p.x + 23 + k * 48, p.y + 46, 18, 25, 2);
          }
        }
        for (const s of signs) {
          ctx.strokeStyle = '#23526b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(s.x + 40, s.y); ctx.lineTo(s.x + 40, s.y - 54); ctx.stroke();
          ctx.fillStyle = '#18445b'; rect(ctx, s.x, s.y - 76, 116, 30, 5);
          ctx.fillStyle = '#a7f3d0'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(s.text, s.x + 58, s.y - 56);
        }
        for (const g of shards) {
          ctx.save(); ctx.translate(g.x, g.y + Math.sin(clock * 4 + g.phase) * 4); ctx.rotate(Math.PI / 4);
          ctx.fillStyle = '#fef3c7'; rect(ctx, -8, -8, 16, 16, 3); ctx.fillStyle = '#fbbf24'; rect(ctx, -5, -5, 10, 10, 2); ctx.restore();
        }
        for (const o of obstacles) {
          const y = o.y + (o.type === 'drone' ? Math.sin(clock * 3 + o.phase) * 12 : 0);
          if (o.type === 'crate') {
            ctx.fillStyle = '#d77f65'; rect(ctx, o.x - 19, y, 38, 36, 5);
            ctx.strokeStyle = '#ffc6a0'; ctx.lineWidth = 3; ctx.strokeRect(o.x - 14, y + 5, 28, 26);
            ctx.beginPath(); ctx.moveTo(o.x - 13, y + 6); ctx.lineTo(o.x + 13, y + 30); ctx.stroke();
          } else {
            ctx.fillStyle = '#263346'; rect(ctx, o.x - 24, y + 5, 48, 23, 10);
            ctx.fillStyle = '#fb7185'; rect(ctx, o.x - 14, y + 11, 28, 7, 3);
            ctx.strokeStyle = '#d1f3e8'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(o.x - 37, y); ctx.lineTo(o.x - 12, y); ctx.moveTo(o.x + 12, y); ctx.lineTo(o.x + 37, y); ctx.stroke();
            ctx.fillStyle = '#5eead4'; ctx.fillRect(o.x - 22, y + 29, 7, 5); ctx.fillRect(o.x + 15, y + 29, 7, 5);
          }
        }
        for (const t of trails) { ctx.fillStyle = player.dash > 0 ? '#fde68a' : '#a7f3d0'; ctx.globalAlpha = t.life * 1.3; rect(ctx, t.x - 12, t.y - 12, 25, 34, 7); }
        ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(player.x, player.y);
        if (player.inv > 0 && Math.floor(clock * 12) % 2) ctx.globalAlpha = 0.45;
        if (player.dash > 0) { ctx.fillStyle = '#fde68a35'; ctx.beginPath(); ctx.ellipse(0, 22, 42, 34, 0, 0, Math.PI * 2); ctx.fill(); }
        const stride = player.grounded ? Math.sin(clock * 19) * 8 : 7;
        ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = '#172f47';
        ctx.beginPath(); ctx.moveTo(-6, 29); ctx.lineTo(-8 - stride, 44); ctx.moveTo(6, 29); ctx.lineTo(8 + stride, 43); ctx.stroke();
        ctx.fillStyle = '#a7f3d0'; rect(ctx, -14, 8, 28, 25, 9);
        ctx.strokeStyle = '#b8fae0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-12, 15); ctx.lineTo(-20, 25 - stride * 0.4); ctx.moveTo(12, 15); ctx.lineTo(21, 21 + stride * 0.3); ctx.stroke();
        ctx.fillStyle = '#233b54'; rect(ctx, -12, -10, 26, 23, 8); ctx.fillStyle = '#fde68a'; rect(ctx, 0, -5, 16, 9, 4);
        ctx.fillStyle = '#f5ab91'; ctx.beginPath(); ctx.moveTo(-11, 9); ctx.lineTo(-33 - Math.sin(clock * 16) * 4, 3); ctx.lineTo(-35, 13); ctx.lineTo(-12, 16); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#10364a99'; rect(ctx, 24, 25, 240, 42, 20);
        ctx.fillStyle = '#d9fbe9'; ctx.font = '700 16px system-ui'; ctx.textAlign = 'left'; ctx.fillText(['01 / SUNRISE QUARTER', '02 / THE HIGHLINE', '03 / GOLDEN MILE'][district], 41, 52);
        ctx.fillStyle = '#a7f3d022'; rect(ctx, 24, H - 27, W - 48, 5, 3); ctx.fillStyle = '#a7f3d0'; rect(ctx, 24, H - 27, Math.max(5, (W - 48) * Math.min(1, distance / target)), 5, 3);
        if (hitFlash > 0 && !api.reducedMotion) { ctx.fillStyle = '#fb7185'; ctx.globalAlpha = hitFlash * 0.5; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      }
      api.hud([{ label: 'Route', value: '0 / 1,200 m' }, { label: 'Hearts', value: '♥♥♥' }, { label: 'Dash', value: 'READY' }]);
      return { update, draw, inspect: () => ({ distance: Math.floor(distance), score, lives, gems, chain, dashCooldown, player: { ...player }, platforms: platforms.map(p => ({ ...p })), obstacles: obstacles.map(o => ({ ...o })), ended }) };
    }
  });
})();
