(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const TAU = Math.PI * 2;
  const COURSES = [
    { name: 'FIRST LIGHT', par: 2, tee: [158, 310], cup: [785, 310], walls: [], sand: [], water: [], bumpers: [], tip: 'A clear fairway. Start around 85% power.' },
    { name: 'BANK HOLIDAY', par: 3, tee: [174, 423], cup: [785, 205], walls: [{ x: 455, y: 110, w: 26, h: 278 }], sand: [{ x: 615, y: 342, w: 110, h: 110 }], water: [], bumpers: [], tip: 'Play below the wall, then turn toward the flag.' },
    { name: 'ISLAND TIME', par: 3, tee: [170, 311], cup: [788, 311], walls: [], sand: [{ x: 277, y: 372, w: 90, h: 90 }], water: [{ x: 411, y: 207, w: 145, h: 224 }], bumpers: [], tip: 'The safe route runs above the blue lagoon.' },
    { name: 'SOFT LANDING', par: 3, tee: [160, 420], cup: [795, 183], walls: [{ x: 325, y: 295, w: 235, h: 24 }], sand: [{ x: 603, y: 132, w: 105, h: 230 }], water: [], bumpers: [{ x: 738, y: 422, r: 27 }, { x: 210, y: 205, r: 24 }], tip: 'Sand slows the ball. A bank off the right rail can help.' },
    { name: 'THE DOGLEG', par: 4, tee: [150, 176], cup: [803, 423], walls: [{ x: 330, y: 110, w: 25, h: 270 }, { x: 596, y: 240, w: 25, h: 250 }], sand: [{ x: 415, y: 320, w: 90, h: 120 }], water: [], bumpers: [], tip: 'Below the first wall, above the second. Plan each landing.' },
    { name: 'GOLDEN HOUR', par: 4, tee: [160, 312], cup: [795, 310], walls: [{ x: 457, y: 250, w: 26, h: 123 }], sand: [{ x: 240, y: 395, w: 130, h: 70 }, { x: 625, y: 145, w: 95, h: 82 }], water: [{ x: 372, y: 110, w: 210, h: 75 }, { x: 372, y: 435, w: 210, h: 55 }], bumpers: [{ x: 650, y: 350, r: 23 }, { x: 297, y: 240, r: 22 }], tip: 'Choose the upper or lower channel, then set up your final putt.' }
  ];
  Arcade.mount({
    id: 'mini-golf-club', title: 'Mini Golf Club', category: 'Physics', accent: '#c9ed9c',
    description: 'Six little greens, one perfect line. Settle in for a round at golden hour.',
    howTo: [
      'Finish all 6 holes in as few strokes as possible. The ball must slow near the cup to drop. Walls bounce; sand slows; water costs one penalty stroke.',
      'Drag back from the ball and release to putt. Or use Left / Right to aim, Up / Down to set power, and Space to shoot.',
      'R returns a stopped ball to the tee for one penalty stroke. After 12 strokes a hole closes automatically. Let the ball stop before your next shot.'
    ],
    controls: [
      { id: 'left', label: 'Aim ↶', keys: ['ArrowLeft', 'KeyA'] },
      { id: 'right', label: 'Aim ↷', keys: ['ArrowRight', 'KeyD'] },
      { id: 'up', label: 'Power +', keys: ['ArrowUp', 'KeyW'] },
      { id: 'down', label: 'Power −', keys: ['ArrowDown', 'KeyS'] },
      { id: 'shoot', label: 'Putt', keys: ['Space'] },
      { id: 'reset', label: 'Tee +1', keys: ['KeyR'] }
    ],
    medals: [1400, 2700, 3600],
    create(api) {
      let hole = 0, strokes = 0, totalStrokes = 0, score = 0, angle = 0, power = 0.68;
      let ball = { x: 158, y: 310, vx: 0, vy: 0 }, lastSafe = { x: 158, y: 310 };
      let moving = false, dragging = false, dragX = 0, dragY = 0, holeTimer = 0, holeLabel = '', elapsed = 0, ended = false;
      let waterTimer = 0, bounceTimer = 0, puttTime = 0, sunk = false, penalties = 0;
      const scores = [], trail = [], leaves = Array.from({ length: 28 }, () => ({ x: api.random() * 960, y: api.random() * 600, size: 6 + api.random() * 10, rot: api.random() * TAU }));
      function ui() {
        api.score(score);
        api.hud([{ label: 'Hole', value: hole + 1 + ' / 6' }, { label: 'Par', value: COURSES[hole].par }, { label: 'Strokes', value: strokes }, { label: 'Power', value: Math.round(power * 100) + '%' }]);
      }
      ui();
      function inside(p, r, padding) { const d = padding || 0; return p.x > r.x - d && p.x < r.x + r.w + d && p.y > r.y - d && p.y < r.y + r.h + d; }
      function loadHole(index) {
        hole = index; strokes = 0; power = 0.55; moving = false; dragging = false; sunk = false;
        const c = COURSES[hole]; ball = { x: c.tee[0], y: c.tee[1], vx: 0, vy: 0 }; lastSafe = { x: ball.x, y: ball.y };
        angle = Math.atan2(c.cup[1] - ball.y, c.cup[0] - ball.x); trail.length = 0; waterTimer = 0; puttTime = 0;
        api.toast('Hole ' + (hole + 1) + ': ' + c.tip); ui();
      }
      function putt() {
        if (moving || holeTimer > 0 || waterTimer > 0 || ended) return;
        const speed = 90 + power * 620;
        lastSafe = { x: ball.x, y: ball.y }; ball.vx = Math.cos(angle) * speed; ball.vy = Math.sin(angle) * speed;
        moving = true; strokes++; totalStrokes++; puttTime = 0; trail.length = 0;
        api.sound('shoot', 0.55 + power * 0.6); ui();
      }
      function finishHole(forced) {
        if (holeTimer > 0) return;
        moving = false; dragging = false; ball.vx = ball.vy = 0;
        const par = COURSES[hole].par, relative = strokes - par;
        const earned = forced ? 20 : Math.max(50, 520 - relative * 85);
        score += earned; scores.push({ strokes, par, completed: !forced });
        holeLabel = forced ? 'HOLE CLOSED' : strokes === 1 ? 'HOLE IN ONE!' : relative <= -2 ? 'EAGLE!' : relative === -1 ? 'BIRDIE!' : relative === 0 ? 'PAR.' : relative === 1 ? 'BOGEY.' : '+' + relative + '. KEEP GOING.';
        holeTimer = 2.2;
        api.sound(forced ? 'bad' : 'win'); if (!forced) api.burst(ball.x, ball.y, '#e9eaa7', 28);
      }
      function resetToTee() {
        if (moving || holeTimer > 0 || waterTimer > 0) return;
        const c = COURSES[hole]; ball.x = c.tee[0]; ball.y = c.tee[1]; ball.vx = ball.vy = 0;
        lastSafe = { x: ball.x, y: ball.y }; strokes++; totalStrokes++; penalties++;
        angle = Math.atan2(c.cup[1] - ball.y, c.cup[0] - ball.x); api.toast('Back to the tee. +1 penalty stroke.'); api.sound('click');
      }
      function collideRect(r) {
        const closestX = clamp(ball.x, r.x, r.x + r.w), closestY = clamp(ball.y, r.y, r.y + r.h);
        let dx = ball.x - closestX, dy = ball.y - closestY, d = Math.hypot(dx, dy);
        if (d >= 9) return false;
        if (d < 0.001) {
          const distances = [Math.abs(ball.x - r.x), Math.abs(ball.x - r.x - r.w), Math.abs(ball.y - r.y), Math.abs(ball.y - r.y - r.h)];
          const minimum = Math.min.apply(null, distances), side = distances.indexOf(minimum);
          if (side === 0) { dx = -1; dy = 0; ball.x = r.x - 9; }
          else if (side === 1) { dx = 1; dy = 0; ball.x = r.x + r.w + 9; }
          else if (side === 2) { dx = 0; dy = -1; ball.y = r.y - 9; }
          else { dx = 0; dy = 1; ball.y = r.y + r.h + 9; }
          d = 1;
        } else { ball.x += dx / d * (9 - d); ball.y += dy / d * (9 - d); }
        const nx = dx / d, ny = dy / d, dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) { ball.vx -= 1.76 * dot * nx; ball.vy -= 1.76 * dot * ny; }
        return true;
      }
      return {
        update(dt) {
          if (ended) return;
          elapsed += dt; bounceTimer = Math.max(0, bounceTimer - dt);
          const course = COURSES[hole];
          if (holeTimer > 0) {
            holeTimer -= dt;
            if (holeTimer <= 0) {
              if (hole === COURSES.length - 1) {
                ended = true; const completed = scores.filter(s => s.completed).length; score += completed === 6 ? 450 : 0;
                const totalPar = COURSES.reduce((sum, c) => sum + c.par, 0), relative = totalStrokes - totalPar;
                api.end({ score, title: 'A lovely round.', message: totalStrokes + ' strokes over six holes (' + (relative > 0 ? '+' : '') + relative + ' to par). ' + (completed === 6 ? 'Every flag reached. There is always one cleaner line.' : completed + ' of 6 flags reached. Revisit the banks and try softer approaches.'), stats: [{ label: 'Strokes', value: totalStrokes }, { label: 'Course par', value: totalPar }, { label: 'Flags reached', value: completed + ' / 6' }, { label: 'Penalties', value: penalties }] });
                return;
              }
              loadHole(hole + 1);
            }
            ui(); return;
          }
          if (waterTimer > 0) {
            waterTimer -= dt;
            if (waterTimer <= 0) { ball.x = lastSafe.x; ball.y = lastSafe.y; moving = false; }
            ui(); return;
          }
          const input = api.input, pointer = input.pointer;
          if (!moving) {
            angle += (Number(input.down('right')) - Number(input.down('left'))) * 1.45 * dt;
            power = clamp(power + (Number(input.down('up')) - Number(input.down('down'))) * 0.43 * dt, 0.04, 1);
            if (pointer.pressed && pointer.inside && Math.hypot(pointer.x - ball.x, pointer.y - ball.y) < 65) { dragging = true; dragX = pointer.x; dragY = pointer.y; }
            if (dragging && pointer.down) {
              dragX = pointer.x; dragY = pointer.y;
              const dx = ball.x - dragX, dy = ball.y - dragY, distance = Math.hypot(dx, dy);
              if (distance > 5) { angle = Math.atan2(dy, dx); power = clamp(distance / 170, 0.04, 1); }
            }
            if (dragging && pointer.released) { dragging = false; if (Math.hypot(ball.x - dragX, ball.y - dragY) > 8) putt(); }
            if (dragging && !pointer.down && !pointer.released) dragging = false;
            if (input.pressed('shoot')) { dragging = false; putt(); }
            if (input.pressed('reset')) resetToTee();
          }
          if (moving) {
            puttTime += dt;
            const substeps = 4, step = dt / substeps;
            for (let sub = 0; sub < substeps; sub++) {
              ball.x += ball.vx * step; ball.y += ball.vy * step;
              let bounced = false;
              if (ball.x < 89 || ball.x > 871) { ball.x = clamp(ball.x, 89, 871); ball.vx *= -0.78; bounced = true; }
              if (ball.y < 119 || ball.y > 481) { ball.y = clamp(ball.y, 119, 481); ball.vy *= -0.78; bounced = true; }
              for (const wall of course.walls) if (collideRect(wall)) bounced = true;
              for (const bumper of course.bumpers) {
                const dx = ball.x - bumper.x, dy = ball.y - bumper.y, d = Math.hypot(dx, dy), radius = bumper.r + 9;
                if (d < radius) {
                  const nx = d > 0 ? dx / d : 1, ny = d > 0 ? dy / d : 0;
                  ball.x = bumper.x + nx * radius; ball.y = bumper.y + ny * radius;
                  const dot = ball.vx * nx + ball.vy * ny;
                  if (dot < 0) { ball.vx -= 1.93 * dot * nx; ball.vy -= 1.93 * dot * ny; } bounced = true;
                }
              }
              if (bounced && bounceTimer <= 0) { api.sound('hit', 1.45); bounceTimer = 0.11; }
              const sand = course.sand.some(r => inside(ball, r));
              const friction = Math.exp(-(sand ? 3.7 : 0.98) * step); ball.vx *= friction; ball.vy *= friction;
              if (course.water.some(r => inside(ball, r, -3))) {
                api.burst(ball.x, ball.y, '#8ccbd1', 18); api.sound('bad', 0.7);
                ball.vx = ball.vy = 0; strokes++; totalStrokes++; penalties++; waterTimer = 0.8;
                api.toast('Water hazard. +1 stroke. Play from your last safe spot.'); break;
              }
              const distanceToCup = Math.hypot(ball.x - course.cup[0], ball.y - course.cup[1]), speed = Math.hypot(ball.vx, ball.vy);
              if (distanceToCup < 13.5 && speed < 235) {
                ball.x = course.cup[0]; ball.y = course.cup[1]; sunk = true; finishHole(false); break;
              }
              // Near the lip, a slow ball settles naturally into the cup.
              if (distanceToCup < 25 && speed < 85 && distanceToCup > 0) {
                ball.vx += (course.cup[0] - ball.x) / distanceToCup * 115 * step;
                ball.vy += (course.cup[1] - ball.y) / distanceToCup * 115 * step;
              }
            }
            if (waterTimer <= 0 && !sunk && (Math.hypot(ball.vx, ball.vy) < 8 || puttTime > 10)) {
              moving = false; ball.vx = ball.vy = 0; angle = Math.atan2(course.cup[1] - ball.y, course.cup[0] - ball.x);
              if (strokes >= 12) finishHole(true);
            }
            trail.push({ x: ball.x, y: ball.y, life: 0.65 });
          }
          if (!moving && strokes >= 12 && holeTimer <= 0) finishHole(true);
          for (let i = trail.length - 1; i >= 0; i--) { trail[i].life -= dt; if (trail[i].life <= 0) trail.splice(i, 1); }
          ui();
        },
        draw(ctx) {
          ctx.save();
          const course = COURSES[hole];
          const bg = ctx.createLinearGradient(0, 0, 960, 600); bg.addColorStop(0, '#1d3b35'); bg.addColorStop(1, '#102e29'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 600);
          leaves.forEach(l => {
            if (l.x > 55 && l.x < 905 && l.y > 77 && l.y < 520) return;
            ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.fillStyle = '#32564a'; ctx.beginPath(); ctx.ellipse(0, 0, l.size, l.size * 0.4, 0, 0, TAU); ctx.fill(); ctx.restore();
          });
          ctx.fillStyle = '#0c2520'; ctx.fillRect(67, 102, 826, 408);
          ctx.fillStyle = '#b5c49a'; ctx.fillRect(72, 102, 816, 396);
          ctx.fillStyle = '#4c865c'; ctx.fillRect(80, 110, 800, 380);
          ctx.save(); ctx.beginPath(); ctx.rect(80, 110, 800, 380); ctx.clip();
          for (let i = 0; i < 17; i++) { ctx.fillStyle = i % 2 ? '#4c865c' : '#528d62'; ctx.beginPath(); ctx.moveTo(20 + i * 65, 110); ctx.lineTo(85 + i * 65, 110); ctx.lineTo(-100 + i * 65, 490); ctx.lineTo(-165 + i * 65, 490); ctx.fill(); }
          course.sand.forEach(s => {
            ctx.fillStyle = '#ceb98b'; ctx.fillRect(s.x, s.y, s.w, s.h); ctx.fillStyle = '#b79e72';
            for (let x = s.x + 8; x < s.x + s.w; x += 17) for (let y = s.y + 8; y < s.y + s.h; y += 19) ctx.fillRect(x, y, 2, 2);
          });
          course.water.forEach(w => {
            ctx.fillStyle = '#265f68'; ctx.fillRect(w.x - 4, w.y - 4, w.w + 8, w.h + 8); ctx.fillStyle = '#47919c'; ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeStyle = '#80bec1'; ctx.lineWidth = 1.2;
            for (let y = w.y + 14; y < w.y + w.h; y += 22) {
              ctx.beginPath(); for (let x = w.x + 6; x < w.x + w.w - 6; x += 4) { const yy = y + Math.sin(x * 0.06 + elapsed * 1.7) * 2; x === w.x + 6 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();
            }
          });
          course.walls.forEach(w => { ctx.fillStyle = 'rgba(12,38,25,.25)'; ctx.fillRect(w.x + 5, w.y + 7, w.w, w.h); ctx.fillStyle = '#e1d0a5'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.fillStyle = '#bca87c'; ctx.fillRect(w.x, w.y + w.h - 5, w.w, 5); });
          course.bumpers.forEach(b => {
            ctx.fillStyle = 'rgba(12,38,25,.2)'; ctx.beginPath(); ctx.arc(b.x + 4, b.y + 6, b.r + 3, 0, TAU); ctx.fill();
            ctx.fillStyle = '#dbaa78'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
            ctx.strokeStyle = '#f0d6ac'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 6, 0, TAU); ctx.stroke();
          });
          ctx.restore();
          ctx.strokeStyle = '#f4e8b4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(course.tee[0], course.tee[1], 14, 0, TAU); ctx.stroke();
          ctx.fillStyle = '#19392b'; ctx.beginPath(); ctx.ellipse(course.cup[0], course.cup[1], 13, 10, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#ebdfbb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(course.cup[0] + 5, course.cup[1]); ctx.lineTo(course.cup[0] + 5, course.cup[1] - 66); ctx.stroke();
          ctx.fillStyle = '#f1ba83'; ctx.beginPath(); ctx.moveTo(course.cup[0] + 6, course.cup[1] - 66); ctx.lineTo(course.cup[0] + 39, course.cup[1] - 55); ctx.lineTo(course.cup[0] + 6, course.cup[1] - 43); ctx.fill();
          ctx.fillStyle = '#664e32'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'left'; ctx.fillText(hole + 1, course.cup[0] + 13, course.cup[1] - 52);
          trail.forEach(t => { ctx.globalAlpha = t.life * 0.35; ctx.fillStyle = '#f7f4ce'; ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, TAU); ctx.fill(); }); ctx.globalAlpha = 1;
          if (!moving && holeTimer <= 0 && waterTimer <= 0) {
            const length = 35 + power * 125;
            ctx.strokeStyle = '#f5f2c8'; ctx.lineWidth = 2; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(angle) * length, ball.y + Math.sin(angle) * length); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = '#f4f0d2'; ctx.beginPath(); ctx.arc(ball.x + Math.cos(angle) * length, ball.y + Math.sin(angle) * length, 4, 0, TAU); ctx.fill();
            if (dragging) { ctx.strokeStyle = '#f4c38b'; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(dragX, dragY); ctx.stroke(); }
            ctx.strokeStyle = '#f3e8b4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ball.x, ball.y, 20 + Math.sin(elapsed * 3) * 2, 0, TAU); ctx.stroke();
          }
          if (!sunk && waterTimer <= 0) {
            ctx.fillStyle = 'rgba(10,30,18,.3)'; ctx.beginPath(); ctx.ellipse(ball.x + 3, ball.y + 5, 10, 6, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#fff9df'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#d7dfc8'; ctx.beginPath(); ctx.arc(ball.x + 2, ball.y + 3, 3, 0, TAU); ctx.fill();
          }
          ctx.fillStyle = '#d8e8bd'; ctx.textAlign = 'left'; ctx.font = '900 27px Georgia, serif'; ctx.fillText('Mini Golf Club', 74, 51);
          ctx.fillStyle = '#9cbaa4'; ctx.font = 'bold 13px system-ui'; ctx.fillText('SIX GREENS. TAKE YOUR TIME.', 75, 75);
          ctx.textAlign = 'right'; ctx.fillStyle = '#e8e2b9'; ctx.font = '900 19px system-ui'; ctx.fillText('0' + (hole + 1) + '  /  ' + course.name, 882, 51);
          ctx.fillStyle = '#a5bd9b'; ctx.font = '14px system-ui'; ctx.fillText('PAR ' + course.par + '  ·  TOTAL ' + totalStrokes + ' STROKES', 882, 75);
          ctx.fillStyle = '#c3d4aa'; ctx.font = '14px system-ui'; ctx.textAlign = 'left'; ctx.fillText(course.tip, 76, 532);
          ctx.fillStyle = '#395b47'; ctx.fillRect(76, 550, 325, 8); ctx.fillStyle = '#e1d7a2'; ctx.fillRect(76, 550, power * 325, 8);
          ctx.fillStyle = '#9fba9d'; ctx.font = '12px system-ui'; ctx.fillText('POWER  ' + Math.round(power * 100) + '%', 76, 579);
          ctx.textAlign = 'right'; ctx.fillStyle = '#b9cca5'; ctx.fillText(moving ? 'LET IT ROLL…' : 'DRAG BACK FROM THE BALL  ·  OR USE ARROWS + SPACE', 881, 566);
          if (holeTimer > 0) {
            ctx.fillStyle = 'rgba(20,48,37,.94)'; ctx.fillRect(220, 226, 520, 132);
            ctx.strokeStyle = '#a6c190'; ctx.lineWidth = 1; ctx.strokeRect(226, 232, 508, 120);
            ctx.fillStyle = '#ede7be'; ctx.textAlign = 'center'; ctx.font = '900 31px Georgia, serif'; ctx.fillText(holeLabel, 480, 280);
            ctx.font = '16px system-ui'; ctx.fillStyle = '#bfd0a7'; ctx.fillText(strokes + ' STROKES  ·  PAR ' + course.par, 480, 316);
          }
          ctx.restore();
        },
        cancelInput() { dragging = false; },
        inspect() { return { hole: hole + 1, name: COURSES[hole].name, par: COURSES[hole].par, strokes, totalStrokes, score, angle, power, moving, dragging, sunk, holeTimer, waterTimer, penalties, ball: { ...ball }, cup: COURSES[hole].cup.slice(), scores: scores.slice(), ended }; }
      };
    }
  });
}());
