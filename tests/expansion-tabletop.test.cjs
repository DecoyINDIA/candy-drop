'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {gameHarness}=require('./helpers/arcade-harness.cjs');
function tap(h,x,y){Object.assign(h.api.input.pointer,{x,y,pressed:true,down:true,inside:true,active:true});h.frame();h.api.input.pointer.down=false;h.api.input.pointer.released=true;h.frame();}
function cell(h,i,x,y,s,n){tap(h,x+(i%n+.5)*s,y+(Math.floor(i/n)+.5)*s);}

test('Four in a Row: legal gravity, alternating AI turns and a terminal board',()=>{
  const h=gameHarness('four-in-row');
  for(let turn=0;turn<42&&!h.result;turn++){
    const s=h.snapshot(); if(s.turn!==1){h.step(.6);continue;}
    const c=[0,1,2,3,4,5,6].find(c=>!s.board[c]);
    tap(h,120+c*70+35,200);h.step(.6);
    const b=h.snapshot().board;
    for(let c=0;c<7;c++){let occupied=false;for(let r=0;r<6;r++){if(b[r*7+c])occupied=true;else assert.equal(occupied,false,'no floating counter');}}
  }
  h.assertSettled();assert.ok(h.snapshot().winner||h.snapshot().moves===42);
});
test('Reversi Room: valid flips, forced passes and complete AI match',()=>{
  const h=gameHarness('reversi-room');
  const initial=h.snapshot();assert.equal(initial.legal.length,4);
  cell(h,initial.legal[0],235,82,73,6);assert.equal(h.snapshot().board.filter(x=>x===1).length,4);
  for(let i=0;i<100&&!h.result;i++){const s=h.snapshot();if(s.turn===1&&s.legal.length)cell(h,s.legal[0],235,82,73,6);else h.step(.6);}
  h.assertSettled();const s=h.snapshot();assert.equal(s.board.filter(Boolean).length,s.moves+4);assert.equal(s.legal.length,0);
});
test('Tidal Tactics: seeded fleets, duplicate shot prevention and seven-hit victory',()=>{
  const h=gameHarness('tidal-tactics'),s=h.snapshot();
  for(const fleet of [s.enemy,s.own]){assert.equal(fleet.filter(Boolean).length,7);assert.deepEqual([1,2,3].map(n=>fleet.filter(x=>x===n).length),[3,2,2]);}
  for(const i of s.enemy.map((v,i)=>v?i:-1).filter(i=>i>=0)){cell(h,i,205,102,68,6);if(!h.result)h.step(.6);}
  h.assertSettled();assert.equal(h.snapshot().hit,7);assert.equal(h.snapshot().attempts,7);assert.ok(h.result.score>=3300);
});
test('Royal Checkers: compulsory captures, legal AI play and a complete game',()=>{
  const h=gameHarness('royal-checkers');let sawCapture=false;
  for(let i=0;i<500&&!h.result;i++){
    const s=h.snapshot();if(s.legal.some(m=>m.capture>=0)){sawCapture=true;assert.ok(s.legal.every(m=>m.capture>=0));}
    if(s.turn===1&&s.legal.length){const m=s.legal[0];cell(h,m.from,250,60,59,8);cell(h,m.to,250,60,59,8);}else h.step(.65);
  }
  h.assertSettled();assert.ok(sawCapture);assert.ok(h.snapshot().ply<=160);
});
test('Dice District: held dice, limited rerolls, category scoring and 13-round completion',()=>{
  const h=gameHarness('dice-district'),before=h.snapshot();h.press('hold');h.press('roll');assert.equal(h.snapshot().dice[0],before.dice[0]);h.press('roll');const last=h.snapshot().dice;h.press('roll');assert.deepEqual(h.snapshot().dice,last);assert.equal(h.snapshot().rolls,0);
  const offer=h.snapshot().offers[0];h.press('bank');assert.equal(h.snapshot().sheet[0],offer);
  for(let i=1;i<13;i++)h.press('bank');h.assertSettled();const s=h.snapshot();assert.equal(s.sheet.filter(v=>v!==null).length,13);assert.equal(s.total,s.sheet.reduce((a,b)=>a+b,0)+s.bonus);assert.equal(h.result.score,s.total*10);
});
test('Domino Trail: matching chain, draw restrictions and complete round',()=>{
  const h=gameHarness('domino-trail');const initial=h.snapshot().boneyard;h.press('draw');assert.equal(h.snapshot().boneyard,initial);
  for(let i=0;i<300&&!h.result;i++){
    const s=h.snapshot();if(s.turn===0){if(s.legal.length){const m=s.legal[0];while(h.snapshot().selected!==m.index)h.press('next');h.press(m.side);}else h.press('draw');}else h.step(.7);
    const c=h.snapshot().chain;for(let j=1;j<c.length;j++)assert.equal(c[j-1][1],c[j][0]);
    const now=h.snapshot();assert.equal(now.hands[0].length+now.hands[1].length+now.chain.length+now.boneyard,28);
  }
  h.assertSettled();assert.ok(h.snapshot().winner>=0);
});
test('Knight Quest: legal L-shaped moves, exact undo and banking',()=>{
  const h=gameHarness('knight-quest'),before=h.snapshot();cell(h,before.legal[0],240,75,74,6);assert.equal(h.snapshot().path.length,2);h.press('undo');assert.deepEqual(h.snapshot().path,before.path);assert.equal(h.snapshot().undos,1);
  for(let i=0;i<35&&!h.result;i++){const s=h.snapshot();if(!s.legal.length)break;cell(h,s.legal[0],240,75,74,6);}
  if(!h.result)h.press('bank');h.assertSettled();const p=h.snapshot().path;assert.equal(new Set(p).size,p.length);for(let i=1;i<p.length;i++){const dx=Math.abs(p[i]%6-p[i-1]%6),dy=Math.abs(Math.floor(p[i]/6)-Math.floor(p[i-1]/6));assert.equal(dx*dy,2);}
});
test('Constellation Link: pointer cancellation and three untangled skies',()=>{
  const h=gameHarness('constellation-link');let s=h.snapshot();Object.assign(h.api.input.pointer,{...s.nodes[0],pressed:true,down:true,inside:true});h.frame();h.game.cancelInput();assert.equal(h.snapshot().drag,-1);h.api.input.pointer.down=false;
  for(let stage=0;stage<3;stage++){
    s=h.snapshot();for(let i=0;i<s.nodes.length;i++){const at=h.snapshot().nodes[i];Object.assign(h.api.input.pointer,{...at,pressed:true,down:true,inside:true});h.frame();Object.assign(h.api.input.pointer,s.targets[i]);h.frame();h.api.input.pointer.down=false;h.api.input.pointer.released=true;h.frame();}assert.equal(h.snapshot().crossings,0);h.press('check');
  }
  h.assertSettled();assert.equal(h.snapshot().cleared,3);assert.ok(h.result.score>=2800);
});
test('Rhythm Rail: an exact four-key performance can hit every note',()=>{
  const h=gameHarness('rhythm-rail');
  for(let i=0;i<2700&&!h.result;i++){const s=h.game.inspect();for(const n of s.notes)if(!n.status&&Math.abs(n.at-s.time-1/60)<.009)h.edges.add('lane'+n.lane);h.frame();}
  h.assertSettled();assert.equal(h.snapshot().hits,80);assert.equal(h.snapshot().perfect,80);assert.equal(h.snapshot().misses,0);assert.ok(h.result.score>=11000);
});
test('Stack Harbor: timing alone can build all 25 blocks',()=>{
  const h=gameHarness('stack-harbor');for(let i=0;i<5400&&!h.result;i++){const s=h.game.inspect(),predicted=s.x+s.dir*(145+s.blocks.length*9)/60;if(Math.abs(predicted-s.blocks[s.blocks.length-1].x)<=6)h.edges.add('drop');h.frame();}
  h.assertSettled();assert.equal(h.snapshot().blocks.length,26);assert.equal(h.snapshot().perfect,25);
});
test('Perfect Pour: pause cancels a pour and ten accurate releases finish the shift',()=>{
  const h=gameHarness('perfect-pour');h.held.add('pour');h.step(.4);h.held.clear();h.game.cancelInput();h.frame();assert.equal(h.snapshot().served,0);assert.equal(h.snapshot().level,0);
  for(let cup=0;cup<10;cup++){const s=h.snapshot();h.held.add('pour');h.step(s.targets[cup]/(.36+cup*.015));h.held.clear();h.frame();if(!h.result)h.step(.85);}
  h.assertSettled();assert.equal(h.snapshot().served,10);assert.equal(h.snapshot().hearts,3);assert.ok(h.result.score>=9500);
});
test('Orbit Hop: tangent alignment reaches all eight worlds without changing state',()=>{
  const h=gameHarness('orbit-hop');for(let i=0;i<10000&&!h.result;i++){const s=h.game.inspect();if(!s.flight){const p=s.planets[s.index+1],dx=p.x-s.ship.x,dy=p.y-s.ship.y,vx=-Math.sin(s.angle),vy=Math.cos(s.angle),forward=dx*vx+dy*vy,miss=Math.abs(dx*vy-dy*vx);if(forward>100&&miss<p.r*.3)h.edges.add('launch');}h.frame();}
  h.assertSettled();assert.equal(h.snapshot().index,8);assert.equal(h.snapshot().fuel,3);
});

test('Rhythm Rail: indiscriminate all-lane tapping cannot earn gold',()=>{
  const h=gameHarness('rhythm-rail');for(let i=0;i<2700&&!h.result;i++){for(let lane=0;lane<4;lane++)h.edges.add('lane'+lane);h.frame();}
  h.assertSettled();assert.ok(h.snapshot().offbeats>100);assert.ok(h.result.score<h.config.medals[2]);
});
test('Stack Harbor: a complete miss leaves a zero-width top, never negative geometry',()=>{
  const h=gameHarness('stack-harbor');for(let i=0;i<1000;i++){const s=h.game.inspect();if(Math.abs(s.x+s.dir*(145+s.blocks.length*9)/60-350)<6){h.press('drop');break;}h.frame();}
  h.press('drop');h.assertSettled();assert.equal(h.snapshot().w,0);
});
