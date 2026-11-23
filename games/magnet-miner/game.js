(function () {
  'use strict';
  const TAU = Math.PI * 2, ORIGIN = { x: 480, y: 81 };
  Arcade.mount({
    id: 'magnet-miner', title: 'Magnet Miner', category: 'Swing-hook mining', accent: '#f5d183',
    description: 'Wait for the angle. Bring something worthwhile to the surface.',
    howTo: ['Meet three mining quotas: 550, 800, then 1,050 points. Each shift gives you 55 seconds. Extra points carry into your final score, but each quota starts fresh.', 'The hook swings automatically. Press Space or tap to cast when it lines up with a nugget. It grabs the first object it touches, then pulls it back.', 'Large gold is valuable but heavy; gems return quickly. Rocks are slow and cheap. X uses one of your two dynamite charges to discard a held load and retract quickly.'],
    controls: [{ id: 'cast', label: 'Cast hook', keys: ['Space', 'ArrowDown'] }, { id: 'blast', label: 'Dynamite', keys: ['KeyX', 'ArrowUp'] }], medals: [800, 2200, 4000],
    create(api) {
      let shift = 1, earned = 0, score = 0, time = 55, quota = 550, angle = Math.PI / 2, clock = 0, objects = [], hook = { length: 0, mode: 'swing', load: null }, dynamite = 2, transition = 0, ended = false, loads = 0;
      function field() { objects = []; for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) { const n = row * 6 + col, type = n % 6 === 1 ? 'rock' : n % 8 === 4 ? 'gem' : 'gold', large = n % 3 === 0; objects.push({ id: n, x: 153 + col * 130 + (api.random() - .5) * 24, y: 229 + row * 107 + (api.random() - .5) * 19, type, r: type === 'gem' ? 14 : type === 'rock' ? 28 : large ? 29 : 21, value: type === 'gem' ? 230 : type === 'rock' ? 45 : large ? 230 : 150, weight: type === 'gem' ? .8 : type === 'rock' ? 3.8 : large ? 2.1 : 1.2, taken: false }); } hook = { length: 0, mode: 'swing', load: null }; }
      const at = () => ({ x: ORIGIN.x + Math.cos(angle) * hook.length, y: ORIGIN.y + Math.sin(angle) * hook.length });
      function finish(won) { if (ended) return; ended = true; if (won) score += 700 + Math.floor(time * 10) + dynamite * 150; api.score(score); api.end({ score, title: won ? 'A very good day underground.' : 'A better angle next shift.', message: won ? 'All three quotas filled. A lighter load can be worth more than a longer wait.' : 'Choose the next nugget before casting. Rocks take time, and dynamite can save a difficult shift.', stats: [{ label: 'Shift', value: shift + ' / 3' }, { label: 'Quota', value: earned + ' / ' + quota }, { label: 'Loads returned', value: loads }] }); }
      function ui() { api.score(score); api.hud([{ label: 'Shift', value: shift + ' / 3' }, { label: 'Quota', value: earned + ' / ' + quota }, { label: 'Dynamite', value: dynamite }, { label: 'Clock', value: Math.ceil(time) + 's' }]); }
      field(); ui();
      return {
        update(dt) {
          if (ended) return; clock += dt;
          if (transition > 0) { transition = Math.max(0, transition - dt); if (!transition) { shift++; earned = 0; quota = [550, 800, 1050][shift - 1]; time = 55; field(); } ui(); return; }
          time = Math.max(0, time - dt); if (!time) { finish(false); return; }
          if (hook.mode === 'swing') { angle = Math.PI / 2 + Math.sin(clock * 1.12) * 1.04; if (api.input.pressed('cast') || api.input.pointer.pressed && api.input.pointer.inside) { hook.mode = 'out'; api.sound('shoot', .8); } }
          if (hook.mode === 'out') {
            hook.length += 320 * dt; const p = at(); const hit = objects.find(o => !o.taken && Math.hypot(p.x - o.x, p.y - o.y) < o.r + 9);
            if (hit) { hit.taken = true; hook.load = { ...hit }; hook.mode = 'back'; api.sound('hit'); }
            else if (hook.length >= 535 || p.x < 28 || p.x > 932 || p.y > 560) hook.mode = 'back';
          }
          if (hook.mode === 'back') {
            if (api.input.pressed('blast') && hook.load && dynamite > 0) { dynamite--; const p = at(); api.burst(p.x, p.y, '#f6c184', 18); hook.load = null; api.sound('bad'); api.shake(3); }
            hook.length = Math.max(0, hook.length - (hook.load ? 320 / hook.load.weight : 510) * dt);
            if (hook.length <= 0) { if (hook.load) { earned += hook.load.value; score += hook.load.value; loads++; api.sound('good'); } hook.load = null; hook.mode = 'swing'; if (earned >= quota) { if (shift === 3) { finish(true); return; } transition = 1.2; api.toast('Quota met · a deeper seam awaits'); } }
          }
          ui();
        },
        draw(ctx) {
          ctx.save(); ctx.fillStyle = '#322b38'; ctx.fillRect(0, 0, 960, 600); ctx.fillStyle = '#66505a'; ctx.fillRect(0, 96, 960, 504); ctx.fillStyle = '#4e3c49'; ctx.beginPath(); ctx.moveTo(0, 130); for (let x = 0; x <= 960; x += 80) ctx.lineTo(x, 124 + Math.sin(x * .04) * 17); ctx.lineTo(960, 600); ctx.lineTo(0, 600); ctx.fill();
          ctx.strokeStyle = '#ad7f6733'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, 158 + i * 60); ctx.bezierCurveTo(260, 124 + i * 60, 600, 204 + i * 60, 960, 145 + i * 60); ctx.stroke(); }
          const nugget = (o, x, y) => { if (o.type === 'gem') { ctx.fillStyle = '#9bcfce'; ctx.beginPath(); ctx.moveTo(x, y - o.r); ctx.lineTo(x + o.r, y); ctx.lineTo(x, y + o.r); ctx.lineTo(x - o.r, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#dbf0dd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - o.r); ctx.lineTo(x - 3, y); ctx.lineTo(x, y + o.r); ctx.stroke(); } else { ctx.fillStyle = o.type === 'gold' ? '#d9af67' : '#8d8691'; ctx.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, r = o.r * (k % 2 ? .86 : 1); if (!k) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.fillStyle = o.type === 'gold' ? '#f1d68d' : '#b5a8ac'; ctx.beginPath(); ctx.ellipse(x - o.r * .2, y - o.r * .25, o.r * .32, o.r * .15, -.4, 0, TAU); ctx.fill(); } };
          objects.forEach(o => { if (!o.taken) nugget(o, o.x, o.y); });
          const p = at(); ctx.strokeStyle = '#d4cbb3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ORIGIN.x, ORIGIN.y); if (hook.mode === 'swing') ctx.lineTo(ORIGIN.x + Math.cos(angle) * 49, ORIGIN.y + Math.sin(angle) * 49); else ctx.lineTo(p.x, p.y); ctx.stroke(); const hp = hook.mode === 'swing' ? { x: ORIGIN.x + Math.cos(angle) * 49, y: ORIGIN.y + Math.sin(angle) * 49 } : p; ctx.strokeStyle = '#abc0bd'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hp.x, hp.y, 10, 0, Math.PI); ctx.stroke(); if (hook.load) nugget(hook.load, p.x, p.y + 14);
          ctx.fillStyle = '#aa9270'; ctx.fillRect(342, 59, 276, 25); ctx.fillStyle = '#465b65'; ctx.beginPath(); ctx.roundRect(445, 35, 70, 45, 9); ctx.fill(); ctx.fillStyle = '#e1bf7e'; ctx.beginPath(); ctx.arc(480, 57, 16, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6b6957'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(480, 57); ctx.lineTo(495, 50); ctx.stroke();
          ctx.textAlign = 'center'; ctx.fillStyle = '#d7cbb4'; ctx.font = '800 16px system-ui'; ctx.fillText('WAIT FOR SOMETHING WORTHWHILE.', 480, 25); if (transition > 0) { ctx.fillStyle = '#302a3add'; ctx.fillRect(280, 255, 400, 74); ctx.fillStyle = '#f1d58e'; ctx.font = '900 30px system-ui'; ctx.fillText('A GOOD SHIFT.', 480, 302); } ctx.restore();
        },
        inspect() { return { shift, earned, score, time, quota, angle, clock, objects: objects.map(o => ({ ...o })), hook: { ...hook, load: hook.load && { ...hook.load } }, dynamite, transition, loads, ended }; }
      };
    }
  });
})();
