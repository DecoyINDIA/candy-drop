/* Sunset Sprint: a six-kilometre checkpoint road race with projected vector scenery. */
(function () {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const LENGTH = 6000, VIEW = 760, HORIZON = 208;
  Arcade.mount({
    id: 'sunset-sprint', title: 'Sunset Sprint', category: 'Racing', accent: '#fb923c',
    description: 'Six kilometres. Three checkpoints. One last run into the sunset.',
    howTo: [
      'Reach the 6 km finish before the clock or your car runs out. Checkpoints every 1.5 km add 26 seconds and repair 10 integrity.',
      'A/D or arrows steer. W/↑ holds the throttle, S/↓ brakes, and Space boosts. Your car cruises when the throttle is released.',
      'Avoid traffic, barriers and the shoulders. Draft behind traffic to recharge boost. Close passes earn extra points.'
    ],
    controls: [
      { id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] },
      { id: 'right', label: '→', keys: ['ArrowRight', 'KeyD'] },
      { id: 'brake', label: 'Brake', keys: ['ArrowDown', 'KeyS'] },
      { id: 'gas', label: 'Gas', keys: ['ArrowUp', 'KeyW'] },
      { id: 'boost', label: 'Boost', keys: ['Space', 'ShiftLeft'] }
    ],
    medals: [1000, 2400, 3500],
    create(api) {
      let distance = 0, speed = 90, x = 0, integrity = 100, charge = 100, timer = 34;
      let checkpoint = 1, score = 0, bonus = 0, overtakes = 0, nearMisses = 0, collisions = 0;
      let invincible = 0, shakeCar = 0, finished = false, drafting = false, boosting = false;
      let banner = 'THE COAST IS CALLING', bannerTime = 2.2, intro = 0.8;
      let laneVelocity = 0;
      const cars = [];
      const barriers = [];
      const colors = ['#38bdf8', '#e879f9', '#fbbf24', '#a3e635', '#f8fafc'];
      for (let i = 0; i < 24; i++) {
        cars.push({ position: 280 + i * 215 + api.random() * 65, lane: [-0.64, 0, 0.64][Math.floor(api.random() * 3)], speed: 22 + api.random() * 15,
          color: colors[i % colors.length], passed: false, hit: false });
      }
      for (let i = 0; i < 12; i++) {
        const position = 600 + i * 425;
        if (Math.abs(position % 1500) < 150) continue;
        barriers.push({ position, lane: [-0.66, 0.66][Math.floor(api.random() * 2)], passed: false, hit: false });
      }
      const mountains = Array.from({ length: 14 }, (_, i) => ({ x: i * 90 - 80, height: 25 + api.random() * 65 }));
      const bend = p => Math.sin(p / 510) * 0.6 + Math.sin(p / 1170 + 1) * 0.4;
      function project(z, lane) {
        const scale = 1 / (1 + z / 78);
        const curve = bend(distance + z * 0.55) * Math.pow(z / VIEW, 1.3) * 275;
        return { x: 480 + curve + lane * 455 * scale, y: HORIZON + (578 - HORIZON) * scale, scale, half: 455 * scale };
      }
      function hud() {
        api.score(score);
        api.hud([{ label: 'Speed', value: `${Math.round(speed)} km/h` }, { label: 'Time', value: `${Math.ceil(timer)}s` },
          { label: 'Distance', value: `${(distance / 1000).toFixed(2)} / 6 km` }, { label: 'Integrity', value: `${Math.ceil(integrity)}%` }]);
      }
      function finish(won) {
        if (finished) return;
        finished = true;
        if (won) { bonus += 900 + Math.round(timer * 25) + Math.round(integrity * 4); score = Math.floor(distance * 0.12) + bonus; api.score(score); api.sound('win'); }
        api.end({ score, title: won ? 'Sunset conquered' : integrity <= 0 ? 'Ride over' : 'Out of time',
          message: won ? 'You brought it home. Cleaner passes and more time on the clock are the road to a gold medal.' : 'Use the throttle on open road, brake before traffic, and save boost for a clear exit.',
          stats: [{ label: 'Distance', value: `${(distance / 1000).toFixed(2)} km` }, { label: 'Overtakes', value: `${overtakes}` },
            { label: 'Close passes', value: `${nearMisses}` }, { label: 'Collisions', value: `${collisions}` }] });
      }
      function collide(obj, damage) {
        obj.hit = true;
        if (invincible > 0) return;
        integrity = Math.max(0, integrity - damage); speed = Math.max(65, speed * 0.49);
        invincible = 1.25; shakeCar = 0.5; collisions++;
        api.sound('bad'); api.shake(8); api.burst(480 + x * 455, 510, '#fdba74', 20);
        banner = 'KEEP IT CLEAN'; bannerTime = 0.8;
      }
      hud();
      return {
        update(dt) {
          if (finished) return;
          bannerTime = Math.max(0, bannerTime - dt); invincible = Math.max(0, invincible - dt); shakeCar = Math.max(0, shakeCar - dt);
          if (intro > 0) { intro -= dt; hud(); return; }
          timer = Math.max(0, timer - dt);
          const braking = api.input.down('brake');
          boosting = api.input.down('boost') && charge > 2 && !braking && Math.abs(x) < 1.12;
          const throttle = api.input.down('gas');
          const offroad = Math.abs(x) > 1.06;
          let targetSpeed = braking ? 100 : boosting ? 336 : throttle ? 282 : 210;
          if (offroad) targetSpeed = 95;
          const acceleration = speed < targetSpeed ? (boosting ? 125 : 58) : (braking ? 250 : offroad ? 150 : 58);
          speed += clamp(targetSpeed - speed, -acceleration * dt, acceleration * dt);
          charge = clamp(charge + (boosting ? -30 : drafting ? 22 : 8) * dt, 0, 100);
          const direction = (api.input.down('right') ? 1 : 0) - (api.input.down('left') ? 1 : 0);
          laneVelocity += (direction * (1.35 + speed / 290) - laneVelocity) * Math.min(1, dt * 9);
          x = clamp(x + laneVelocity * dt - bend(distance) * (speed / 282) * 0.1 * dt, -1.2, 1.2);
          if (offroad && speed > 105) integrity = Math.max(0, integrity - 3.2 * dt);
          const previousDistance = distance;
          distance = Math.min(LENGTH, distance + speed / 3.6 * dt);
          drafting = false;
          for (const car of cars) {
            const previousZ = car.position - previousDistance;
            car.position += car.speed * dt;
            const z = car.position - distance;
            const lateral = Math.abs(car.lane - x);
            if (z > 15 && z < 105 && lateral < 0.22) drafting = true;
            if (!car.hit && z < 9 && z > -9 && lateral < 0.22) collide(car, 24);
            if (!car.passed && previousZ >= -8 && z < -8) {
              car.passed = true;
              if (!car.hit) {
                overtakes++; bonus += 70;
                if (lateral < 0.45 && lateral >= 0.22) { nearMisses++; bonus += 100; charge = Math.min(100, charge + 15); banner = 'CLOSE PASS +170'; bannerTime = 0.9; api.sound('good', 1.3); }
              }
            }
          }
          for (const barrier of barriers) {
            const z = barrier.position - distance;
            if (!barrier.hit && Math.abs(z) < 9 && Math.abs(barrier.lane - x) < 0.24) collide(barrier, 18);
            if (!barrier.passed && z < -9) { barrier.passed = true; if (!barrier.hit) bonus += 30; }
          }
          if (checkpoint <= 3 && distance >= checkpoint * 1500) {
            timer += 26; integrity = Math.min(100, integrity + 10); charge = Math.min(100, charge + 20); bonus += 240;
            banner = `CHECKPOINT ${checkpoint} · +26 SECONDS`; bannerTime = 2; checkpoint++;
            api.sound('good'); api.toast('Checkpoint! +26 seconds · +10 integrity · +20 boost');
          }
          score = Math.floor(distance * 0.12) + bonus;
          hud();
          if (distance >= LENGTH) { finish(true); return; }
          if (timer <= 0 || integrity <= 0) finish(false);
        },
        draw(ctx) {
          ctx.save();
          const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 40); sky.addColorStop(0, '#211938'); sky.addColorStop(0.55, '#b44e6c'); sky.addColorStop(1, '#fba267');
          ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 600);
          ctx.fillStyle = '#ffd08a'; ctx.beginPath(); ctx.arc(480 - bend(distance) * 45, 150, 76, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#b6516966'; for (let i = 0; i < 5; i++) ctx.fillRect(370, 160 + i * 12, 220, 3 + i * 2);
          ctx.fillStyle = '#653e60'; ctx.beginPath(); ctx.moveTo(-100, HORIZON + 15); mountains.forEach(m => ctx.lineTo(m.x - bend(distance) * 30, HORIZON - m.height)); ctx.lineTo(1060, HORIZON + 25); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#b77f76'; ctx.fillRect(0, HORIZON, 960, 600 - HORIZON);
          // Paint terrain first, then a continuous road ribbon, avoiding visible raster seams.
          for (let z = VIEW; z > 0; z -= 12) {
            const far = project(z, 0), near = project(Math.max(0, z - 12), 0);
            const stripe = Math.floor((distance + z) / 28) % 2;
            quad(ctx, 0, far.y, 960, far.y, 960, near.y, 0, near.y, stripe ? '#9c776e' : '#a27c70');
          }
          ribbon(ctx, 1.1, '#e07164');
          for (let z = VIEW; z > 0; z -= 12) {
            const far = project(z, 0), near = project(Math.max(0, z - 12), 0);
            if (Math.floor((distance + z) / 28) % 2) quad(ctx, far.x - far.half * 1.1, far.y, far.x + far.half * 1.1, far.y, near.x + near.half * 1.1, near.y, near.x - near.half * 1.1, near.y, '#f8d5b7');
          }
          ribbon(ctx, 1, '#323446');
          for (let z = VIEW; z > 0; z -= 12) {
            const far = project(z, 0), near = project(Math.max(0, z - 12), 0);
            const stripe = Math.floor((distance + z) / 28) % 2;
            if (stripe) for (const lane of [-1 / 3, 1 / 3]) quad(ctx, far.x + far.half * (lane - 0.008), far.y, far.x + far.half * (lane + 0.008), far.y, near.x + near.half * (lane + 0.008), near.y, near.x + near.half * (lane - 0.008), near.y, '#efdbb8');
          }
          // Palm trees and chevron signs flow past in world-space, never changing collisions.
          const firstTree = Math.floor(distance / 100) * 100;
          for (let world = firstTree + 800; world > distance; world -= 100) {
            const z = world - distance;
            for (const side of [-1, 1]) {
              const p = project(z, side * 1.35); drawPalm(ctx, p.x, p.y, p.scale, side);
            }
          }
          const objects = cars.map(c => ({ kind: 'car', value: c, z: c.position - distance }))
            .concat(barriers.map(b => ({ kind: 'barrier', value: b, z: b.position - distance })))
            .filter(o => o.z >= -6 && o.z < VIEW).sort((a, b) => b.z - a.z);
          for (const object of objects) {
            const p = project(Math.max(0, object.z), object.value.lane);
            if (object.kind === 'car') drawCar(ctx, p.x, p.y, p.scale * 0.86, object.value.color, false, 0);
            else drawBarrier(ctx, p.x, p.y, p.scale);
          }
          const gateDistance = checkpoint <= 3 ? checkpoint * 1500 - distance : LENGTH - distance;
          if (gateDistance > 0 && gateDistance < VIEW) {
            const p = project(gateDistance, 0), w = p.half;
            ctx.strokeStyle = '#f5cb8e'; ctx.lineWidth = Math.max(2, p.scale * 12);
            ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x - w, p.y - 210 * p.scale); ctx.lineTo(p.x + w, p.y - 210 * p.scale); ctx.lineTo(p.x + w, p.y); ctx.stroke();
            ctx.fillStyle = '#193145'; ctx.fillRect(p.x - w, p.y - 212 * p.scale, w * 2, 45 * p.scale);
            ctx.fillStyle = '#fff0d0'; ctx.textAlign = 'center'; ctx.font = `900 ${Math.max(7, 24 * p.scale)}px system-ui`; ctx.fillText(checkpoint <= 3 ? 'CHECKPOINT' : 'FINISH', p.x, p.y - 181 * p.scale);
          }
          const px = clamp(480 + x * 455, 45, 915);
          if (boosting) {
            ctx.fillStyle = '#38bdf899';
            for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px + side * 24 - 7, 561); ctx.lineTo(px + side * 24 + 7, 561); ctx.lineTo(px + side * 24, 595); ctx.fill(); }
            if (!api.reducedMotion) { ctx.strokeStyle = '#ffedd544'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1, yy = 270 + (i * 57 + api.time * 450) % 290; ctx.beginPath(); ctx.moveTo(480 + side * (200 + i * 23), yy); ctx.lineTo(480 + side * (250 + i * 23), yy + 28); ctx.stroke(); } }
          }
          ctx.globalAlpha = invincible > 0 && Math.floor(invincible * 12) % 2 && !api.reducedMotion ? 0.65 : 1;
          drawCar(ctx, px + (shakeCar > 0 && !api.reducedMotion ? Math.sin(api.time * 60) * 6 : 0), 572, 0.96, '#fb923c', true, laneVelocity * 0.04);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#181d35e6'; ctx.fillRect(28, 27, 220, 84); ctx.fillRect(712, 27, 220, 84);
          ctx.textAlign = 'left'; ctx.fillStyle = '#e9d6cb'; ctx.font = '700 14px system-ui'; ctx.fillText('COASTAL HIGHWAY', 45, 51);
          ctx.fillStyle = '#fff3e0'; ctx.font = '900 30px system-ui'; ctx.fillText(`${Math.round(speed)}`, 45, 88); ctx.font = '700 14px system-ui'; ctx.fillStyle = '#c5a99e'; ctx.fillText('KM/H', 115, 88);
          ctx.textAlign = 'right'; ctx.fillStyle = timer < 12 ? '#fda4af' : '#fff3e0'; ctx.font = '900 30px system-ui'; ctx.fillText(`${Math.ceil(timer)}s`, 915, 88);
          ctx.font = '700 14px system-ui'; ctx.fillStyle = '#e9d6cb'; ctx.fillText(`GATE ${Math.min(checkpoint, 4)} / 4`, 915, 51);
          ctx.fillStyle = '#1b2138e8'; ctx.fillRect(335, 27, 290, 53);
          ctx.fillStyle = '#4f4751'; ctx.fillRect(349, 55, 262, 7); ctx.fillStyle = '#fdba74'; ctx.fillRect(349, 55, 262 * distance / LENGTH, 7);
          ctx.fillStyle = '#fff3e0'; ctx.textAlign = 'center'; ctx.font = '800 14px system-ui'; ctx.fillText(`${(distance / 1000).toFixed(1)} KM  /  6.0 KM`, 480, 46);
          ctx.fillStyle = '#161c32e8'; ctx.fillRect(28, 535, 200, 42); ctx.fillStyle = '#526177'; ctx.fillRect(107, 551, 105, 11); ctx.fillStyle = boosting ? '#7dd3fc' : '#38bdf8'; ctx.fillRect(107, 551, 105 * charge / 100, 11);
          ctx.fillStyle = '#d5e7f3'; ctx.textAlign = 'left'; ctx.font = '800 13px system-ui'; ctx.fillText('BOOST', 43, 561);
          ctx.fillStyle = '#161c32e8'; ctx.fillRect(732, 535, 200, 42); ctx.fillStyle = '#526177'; ctx.fillRect(814, 551, 104, 11); ctx.fillStyle = integrity > 35 ? '#5eead4' : '#fb7185'; ctx.fillRect(814, 551, 104 * integrity / 100, 11);
          ctx.fillStyle = '#d5e7f3'; ctx.fillText('CAR', 749, 561);
          if (drafting) { ctx.fillStyle = '#a5f3fc'; ctx.textAlign = 'center'; ctx.font = '900 20px system-ui'; ctx.fillText('SLIPSTREAM · BOOST RECHARGING', 480, 403); }
          if (Math.abs(x) > 1.06) { ctx.fillStyle = '#fde68a'; ctx.textAlign = 'center'; ctx.font = '900 23px system-ui'; ctx.fillText('OFF ROAD · STEER BACK', 480, 145); }
          if (bannerTime > 0) { ctx.fillStyle = '#171b33d9'; ctx.fillRect(160, 123, 640, 58); ctx.fillStyle = '#ffedd5'; ctx.textAlign = 'center'; ctx.font = '900 27px system-ui'; ctx.fillText(banner, 480, 161); }
          ctx.restore();
        },
        inspect() { return { distance, speed, x, integrity, charge, timer, checkpoint, score, overtakes, nearMisses, collisions, finished, drafting, boosting, cars: cars.filter(c => c.position - distance > -10 && c.position - distance < 250).map(c => ({ z: c.position - distance, lane: c.lane })), barriers: barriers.filter(b => b.position - distance > -10 && b.position - distance < 250).map(b => ({ z: b.position - distance, lane: b.lane })) }; }
      };

      // Overlap strips by one logical pixel to avoid subpixel antialias seams.
      function quad(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x1, y1 - 1); ctx.lineTo(x2, y2 - 1); ctx.lineTo(x3, y3 + 1); ctx.lineTo(x4, y4 + 1); ctx.closePath(); ctx.fill(); }
      function ribbon(ctx, factor, color) {
        ctx.fillStyle = color; ctx.beginPath();
        const horizonX = project(VIEW, 0).x;
        ctx.moveTo(horizonX, HORIZON);
        for (let z = VIEW; z > 0; z -= 12) { const p = project(z, 0); ctx.lineTo(p.x - p.half * factor, p.y); }
        const near = project(0, 0); ctx.lineTo(near.x - near.half * factor, near.y); ctx.lineTo(near.x + near.half * factor, near.y);
        for (let z = 4; z <= VIEW; z += 12) { const p = project(z, 0); ctx.lineTo(p.x + p.half * factor, p.y); }
        ctx.lineTo(horizonX, HORIZON); ctx.closePath(); ctx.fill();
      }
      function drawCar(ctx, cx, cy, scale, color, playerCar, tilt) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.rotate(tilt);
        ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.ellipse(0, -3, 48, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111625'; ctx.fillRect(-45, -74, 17, 65); ctx.fillRect(28, -74, 17, 65);
        const shell = ctx.createLinearGradient(-38, 0, 38, 0); shell.addColorStop(0, color); shell.addColorStop(0.5, playerCar ? '#ffb968' : color); shell.addColorStop(1, color);
        ctx.fillStyle = shell; ctx.beginPath(); ctx.moveTo(-39, -7); ctx.lineTo(-36, -65); ctx.lineTo(-27, -104); ctx.lineTo(27, -104); ctx.lineTo(36, -65); ctx.lineTo(39, -7); ctx.quadraticCurveTo(0, 4, -39, -7); ctx.fill();
        ctx.fillStyle = '#25344c'; ctx.beginPath(); ctx.moveTo(-25, -94); ctx.lineTo(25, -94); ctx.lineTo(29, -61); ctx.lineTo(-29, -61); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7393ae'; ctx.beginPath(); ctx.moveTo(-20, -90); ctx.lineTo(21, -90); ctx.lineTo(24, -83); ctx.lineTo(-21, -83); ctx.fill();
        ctx.fillStyle = '#1e293b'; ctx.fillRect(-27, -52, 54, 5); ctx.fillRect(-27, -40, 54, 4);
        ctx.fillStyle = '#ffdb9c'; ctx.fillRect(-31, -21, 17, 5); ctx.fillRect(14, -21, 17, 5);
        ctx.fillStyle = '#f43f5e'; ctx.fillRect(-32, -15, 17, 5); ctx.fillRect(15, -15, 17, 5);
        ctx.fillStyle = '#111b2b'; ctx.fillRect(-18, -7, 36, 7); ctx.fillStyle = '#fff0c7'; ctx.fillRect(-8, -13, 16, 6);
        if (playerCar) { ctx.strokeStyle = '#47292588'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, -59); ctx.lineTo(-9, -28); ctx.moveTo(9, -59); ctx.lineTo(9, -28); ctx.stroke(); }
        ctx.restore();
      }
      function drawBarrier(ctx, cx, cy, scale) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
        ctx.fillStyle = '#473b3e'; ctx.fillRect(-36, -15, 7, 18); ctx.fillRect(29, -15, 7, 18); ctx.fillStyle = '#ffd69c'; ctx.fillRect(-43, -43, 86, 31);
        ctx.fillStyle = '#c45e56'; for (let i = -35; i < 40; i += 26) { ctx.beginPath(); ctx.moveTo(i, -43); ctx.lineTo(i + 15, -43); ctx.lineTo(i + 2, -12); ctx.lineTo(i - 13, -12); ctx.fill(); }
        ctx.restore();
      }
      function drawPalm(ctx, cx, cy, scale, side) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.strokeStyle = '#5a454c'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * 20, -100, side * 5, -177); ctx.stroke();
        ctx.strokeStyle = '#3b3d4f'; ctx.lineWidth = 13;
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(side * 5, -177); ctx.quadraticCurveTo(Math.cos(a) * 57, -220 + Math.sin(a) * 35, Math.cos(a) * 100, -177 + Math.sin(a) * 45); ctx.stroke(); }
        ctx.restore();
      }
    }
  });
})();
