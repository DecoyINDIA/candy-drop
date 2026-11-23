'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const {gameHarness}=require('./helpers/arcade-harness.cjs');
for(const id of['marble-maze','treasure-diver','paper-flight','chroma-switch'])test(id+': seeded finite drawing and untouched state',()=>{const a=gameHarness(id),b=gameHarness(id);for(let i=0;i<4;i++){const before=a.snapshot(),calls=a.randomCalls;a.draw();assert.deepEqual(a.snapshot(),before);assert.equal(a.randomCalls,calls);a.step(.5);b.step(.5);assert.deepEqual(a.snapshot(),b.snapshot());}});
test('Marble Maze: a real tilt controller can follow the clear path through all keys',()=>{
  const h=gameHarness('marble-maze',{seed:19}),path=h.snapshot().solution;
  for(const i of path){const target={x:144+(i%12+.5)*56,y:76+(Math.floor(i/12)+.5)*56};Object.assign(h.api.input.pointer,target,{inside:true,active:true,down:true});for(let n=0;n<500&&!h.result;n++){h.frame();const b=h.game.inspect().ball;if(Math.hypot(b.x-target.x,b.y-target.y)<6)break;}}
  h.assertSettled();assert.ok(h.snapshot().keys.every(k=>k.found));assert.equal(h.snapshot().lives,3);
});
test('Treasure Diver: ten recovered treasures are banked at the surface',()=>{
  const h=gameHarness('treasure-diver',{seed:19}),treasures=h.snapshot().treasures;
  function swim(x,y){Object.assign(h.api.input.pointer,{x,y,inside:true,active:true,down:true});for(let n=0;n<400&&!h.result;n++){h.frame();const p=h.game.inspect().player;if(Math.hypot(p.x-x,p.y-y)<7)break;}}
  for(const t of treasures){swim(t.x,90);swim(t.x,t.y);assert.ok(h.snapshot().bag.length>0);swim(t.x,90);}
  h.assertSettled();assert.equal(h.snapshot().banked,10);assert.equal(h.snapshot().bag.length,0);assert.ok(h.result.score>4600);
});
test('Paper Flight: lift, dive and trim can fly the full coast route',()=>{
  const h=gameHarness('paper-flight',{seed:19});for(let i=0;i<3000&&!h.result;i++){const s=h.game.inspect(),next=s.rings.find(r=>!r.done),target=next?next.y:280,wanted=Math.max(-50,Math.min(50,(target-s.y)*1.2));h.held.clear();h.held.add(s.vy>wanted+5?'up':s.vy<wanted-5?'down':'trim');h.frame();}
  h.assertSettled();assert.equal(h.snapshot().distance,3000);assert.ok(h.snapshot().hits>=12);assert.equal(h.snapshot().hearts,3);
});
test('Chroma Switch: color preparation and pulses clear twelve rotating rings',()=>{
  const h=gameHarness('chroma-switch',{seed:19}),tau=Math.PI*2;for(let i=0;i<5500&&!h.result;i++){const s=h.game.inspect(),rotation=s.rotation+(.4+s.stage*.025)/60,theta=s.y>=280?Math.PI/2:Math.PI*1.5,wanted=Math.floor(((theta-rotation)%tau+tau)%tau/(Math.PI/2)),delta=(wanted-s.color+4)%4;if(delta)h.edges.add(delta===3?'left':'right');if(s.cooldown<=1/60&&s.vy>-225)h.edges.add('jump');h.frame();}
  h.assertSettled();assert.equal(h.snapshot().stage,12);assert.equal(h.snapshot().hearts,3);
});
test('Exploration games all have a finite idle ending',()=>{for(const[id,seconds]of[['marble-maze',151],['treasure-diver',181],['paper-flight',60],['chroma-switch',91]]){const h=gameHarness(id);h.step(seconds);h.assertSettled();}});
