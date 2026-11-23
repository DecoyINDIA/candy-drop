/* Downhill Dash: a finite slalom with readable gates, rocks and tuck management. */
(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Arcade.mount({
    id: 'downhill-dash', title: 'Downhill Dash', category: 'Skiing', accent: '#a6e0ee',
    description: 'Find your line through a mountain of fresh snow. Every gate keeps the rhythm.',
    howTo: ['Reach the 2,200m finish before 82 seconds. Pass between the paired flags to build a gate streak. Rocks cost one of your three hearts.', 'Left / Right or A / D carves. Down / S brakes. Space / Tuck trades turning agility for speed. You can also drag sideways on the snow.', 'Tuck on open sections, release before a sharp turn, and use the gate ahead to plan your line. Missing a gate breaks your streak but does not end the run.'],
    controls: [{ id: 'left', label: '← Carve', keys: ['ArrowLeft', 'KeyA'] }, { id: 'right', label: 'Carve →', keys: ['ArrowRight', 'KeyD'] }, { id: 'brake', label: 'Brake', keys: ['ArrowDown', 'KeyS'] }, { id: 'tuck', label: 'Tuck', keys: ['Space', 'ArrowUp', 'KeyW'] }],
    medals: [1600, 3600, 5500],
    create(api) {
      let x = 480, distance = 0, speed = 310, time = 82, lives = 3, score = 0, passed = 0, missed = 0, streak = 0, best = 0, inv = 0, ended = false, lean = 0;
      let center = 480; const gates = [], rocks = [], trail = [];
      for (let i = 0; i < 40; i++) { center = clamp(center + (api.random() - 0.5) * 300, 240, 720); const position = 700 + i * 535, gap = 210 - Math.min(50, i * 1.4); gates.push({ position, center, gap, passed: false }); const side = api.random() < 0.5 ? -1 : 1; rocks.push({ position: position + 240, x: clamp(center + side * (175 + api.random() * 90), 140, 820), r: 19 + api.random() * 6, hit: false }); }
      function hud() { api.score(score); api.hud([{ label: 'Route', value: Math.min(2200, Math.floor(distance)) + ' / 2,200m' }, { label: 'Gates', value: passed + ' / 40' }, { label: 'Hearts', value: lives }, { label: 'Time', value: Math.ceil(time) + 's' }]); }
      function finish(won) { if (ended) return; ended = true; if (won) score += 700 + lives * 180 + Math.round(time * 15); api.end({ score, title: won ? 'A line worth remembering.' : 'Fresh tracks next time.', message: passed + ' gates cleared. ' + (won ? 'A smooth line beats a frantic correction.' : 'Release Tuck before the next gate, then accelerate through the opening.'), stats: [{ label: 'Gates', value: passed }, { label: 'Missed', value: missed }, { label: 'Best streak', value: best }, { label: 'Distance', value: Math.floor(distance) + 'm' }] }); }
      hud();
      return {
        update(dt) {
          if (ended) return; time = Math.max(0, time - dt); inv = Math.max(0, inv - dt); const input = api.input, tuck = input.down('tuck') && !input.down('brake'), dir = Number(input.down('right')) - Number(input.down('left'));
          const target = input.down('brake') ? 180 : tuck ? 420 : 320; speed += clamp(target - speed, -300 * dt, 155 * dt); lean += (dir - lean) * Math.min(1, dt * 9);
          if (dir) x += dir * (tuck ? 330 : 470) * dt; else if (input.pointer.down && input.pointer.inside) x += clamp(input.pointer.x - x, -480 * dt, 480 * dt);
          x = clamp(x, 105, 855); const before = distance * 10; distance = Math.min(2200, distance + speed * dt * 0.1); const world = distance * 10;
          for (const gate of gates) if (!gate.passed && gate.position >= before && gate.position < world) { gate.passed = true; if (Math.abs(x - gate.center) < gate.gap / 2 - 9) { passed++; streak++; best = Math.max(best, streak); score += 80 + Math.min(12, streak) * 8; api.sound('good', 0.9 + Math.min(12, streak) * 0.04); api.burst(x, 430, '#7ecacb', 7); } else { missed++; streak = 0; api.toast('Gate missed. Find the next line.'); } }
          for (const rock of rocks) if (!rock.hit && Math.abs(rock.position - world) < 28 && Math.abs(rock.x - x) < rock.r + 15) { rock.hit = true; if (inv <= 0) { lives--; streak = 0; inv = 1.4; speed *= 0.6; api.sound('bad'); api.shake(6); } }
          if (!api.reducedMotion) { trail.push({ x, world, lean }); while (trail.length > 50) trail.shift(); }
          if (lives <= 0 || time <= 0) { finish(false); return; } if (distance >= 2200) { finish(true); return; } hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#dbe9e7'; c.fillRect(0, 0, 960, 600); const world = distance * 10;
          c.fillStyle = '#c2d8d9'; c.beginPath(); c.moveTo(0, 0); c.lineTo(160, 0); c.lineTo(96, 600); c.lineTo(0, 600); c.fill(); c.beginPath(); c.moveTo(800, 0); c.lineTo(960, 0); c.lineTo(960, 600); c.lineTo(855, 600); c.fill();
          for (let i = 0; i < 13; i++) { const y = (i * 118 + world) % 760 - 80; for (const side of [0, 1]) { const xx = side ? 887 + i % 2 * 30 : 35 + i % 2 * 35; c.fillStyle = '#4f7c75'; c.beginPath(); c.moveTo(xx, y - 33); c.lineTo(xx - 27, y + 19); c.lineTo(xx + 27, y + 19); c.fill(); c.fillStyle = '#77998b'; c.beginPath(); c.moveTo(xx, y - 44); c.lineTo(xx - 19, y - 5); c.lineTo(xx + 19, y - 5); c.fill(); } }
          c.strokeStyle = '#adcaca'; c.lineWidth = 3; for (const side of [-1, 1]) { c.beginPath(); trail.forEach((t, i) => { const yy = 430 + (world - t.world); if (yy > 650) return; i ? c.lineTo(t.x + side * 10, yy) : c.moveTo(t.x + side * 10, yy); }); c.stroke(); }
          for (const gate of gates) { const yy = 430 - (gate.position - world); if (yy < -80 || yy > 650) continue; c.strokeStyle = gate.passed ? '#9ebdb0' : '#659b9b'; c.lineWidth = 2; c.setLineDash([5, 8]); c.beginPath(); c.moveTo(gate.center - gate.gap / 2, yy); c.lineTo(gate.center + gate.gap / 2, yy); c.stroke(); c.setLineDash([]); for (const side of [-1, 1]) { const xx = gate.center + side * gate.gap / 2; c.strokeStyle = '#2d5b65'; c.lineWidth = 3; c.beginPath(); c.moveTo(xx, yy + 6); c.lineTo(xx, yy - 40); c.stroke(); c.fillStyle = gate.passed ? '#82b5a0' : side < 0 ? '#d78577' : '#5a9bb4'; c.fillRect(xx, yy - 38, side * -24, 18); } }
          for (const rock of rocks) { const yy = 430 - (rock.position - world); if (yy < -40 || yy > 640) continue; c.fillStyle = '#b6c8c9'; c.beginPath(); c.ellipse(rock.x + 4, yy + 5, rock.r + 5, rock.r * 0.6, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#778f96'; c.beginPath(); c.ellipse(rock.x, yy, rock.r, rock.r * 0.7, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f4f4e9'; c.beginPath(); c.ellipse(rock.x - 3, yy - 7, rock.r * 0.75, rock.r * 0.35, -0.2, 0, Math.PI * 2); c.fill(); }
          c.save(); c.translate(x, 430); c.rotate(lean * 0.32); if (inv > 0 && !api.reducedMotion) c.globalAlpha = 0.55; c.strokeStyle = '#31576a'; c.lineWidth = 6; for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * 10, -20); c.lineTo(side * 10, 35); c.stroke(); } c.fillStyle = '#dc8c6d'; c.beginPath(); c.ellipse(0, 0, 15, 22, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ead8af'; c.beginPath(); c.arc(0, -17, 10, 0, Math.PI * 2); c.fill(); c.fillStyle = '#426b78'; c.fillRect(-8, -21, 16, 5); c.restore();
          c.fillStyle = '#f6f8eef0'; c.fillRect(24, 22, 258, 69); c.fillStyle = '#345f68'; c.textAlign = 'left'; c.font = '900 23px system-ui'; c.fillText('DOWNHILL / DASH', 41, 51); c.font = '13px system-ui'; c.fillText('FIND YOUR LINE. KEEP YOUR FLOW.', 42, 75); c.textAlign = 'right'; c.fillStyle = '#355967'; c.font = '900 28px system-ui'; c.fillText(streak + ' GATE STREAK', 930, 55); c.fillStyle = '#b0ccca'; c.fillRect(24, 576, 912, 6); c.fillStyle = '#508f91'; c.fillRect(24, 576, 912 * distance / 2200, 6); c.restore();
        },
        inspect() { return { x, distance, speed, time, lives, score, passed, missed, streak, best, inv, gates: gates.filter(g => !g.passed && g.position - distance * 10 < 1200).map(g => ({ ...g, ahead: g.position - distance * 10 })), rocks: rocks.filter(r => !r.hit && Math.abs(r.position - distance * 10) < 1000).map(r => ({ ...r, ahead: r.position - distance * 10 })), ended }; }
      };
    }
  });
})();
