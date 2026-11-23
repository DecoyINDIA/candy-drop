'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { gameHarness } = require('./helpers/arcade-harness.cjs');
const IDS = ['mine-garden','memory-lane','light-circuit','crate-escape','slide-studio','number-nook','color-flood','word-trail','pipe-works','nonogram-nook','code-breaker','peg-parlor'];

function tap(h, x, y) {
  Object.assign(h.api.input.pointer, { x, y, inside: true, active: true, down: true, pressed: true }); h.frame();
  Object.assign(h.api.input.pointer, { down: false, released: true }); h.frame();
}
function cell(h, index, width, x, y, size) { tap(h, x + (index % width + .5) * size, y + (Math.floor(index / width) + .5) * size); }
function select(h, index, width, property='selected') {
  for(let attempts=0;attempts<40;attempts++) {
    const current=h.snapshot()[property]; if(current===index)return;
    const row=Math.floor(current/width),goalRow=Math.floor(index/width),col=current%width,goalCol=index%width;
    h.press(row<goalRow?'down':row>goalRow?'up':col<goalCol?'right':'left');
  }
  assert.equal(h.snapshot()[property],index,'keyboard reaches the requested cell');
}
function drag(h, start, end, width=8, x=264, y=68, size=54) {
  const point=index=>({x:x+(index%width+.5)*size,y:y+(Math.floor(index/width)+.5)*size});
  Object.assign(h.api.input.pointer,point(start),{inside:true,down:true,pressed:true});h.frame();
  Object.assign(h.api.input.pointer,point(end));h.frame();
  Object.assign(h.api.input.pointer,{down:false,released:true});h.frame();
}

for(const id of IDS) test(`${id}: deterministic construction, finite rendering and draw purity`,()=>{
  const a=gameHarness(id,{seed:97,reducedMotion:false}),b=gameHarness(id,{seed:97,reducedMotion:false});
  assert.deepEqual(a.snapshot(),b.snapshot());assert.ok(a.config.controls.length>0);assert.equal(new Set(a.config.controls.map(c=>c.id)).size,a.config.controls.length);
  for(let n=0;n<3;n++){const before=a.snapshot(),calls=a.randomCalls;a.draw();a.draw();assert.deepEqual(a.snapshot(),before);assert.equal(a.randomCalls,calls,'drawing leaves the random stream untouched');a.step(.25);b.step(.25);assert.deepEqual(a.snapshot(),b.snapshot());}
});

test('Mine Garden: safe first region, flags protect a cell, all safe cells win',()=>{
  const h=gameHarness('mine-garden',{seed:3});h.press('act');let s=h.snapshot();
  assert.equal(s.mines.filter(Boolean).length,10);assert.ok(!s.mines[40]);assert.equal(s.counts[40],0);assert.ok(s.open[40]);
  const mine=s.mines.findIndex(Boolean);h.press('tool');cell(h,mine,9,255,72,50);assert.equal(h.snapshot().flags[mine],true);
  h.press('tool');cell(h,mine,9,255,72,50);assert.equal(h.result,null,'a flagged mine cannot be revealed');
  for(let i=0;i<81&&!h.result;i++)if(!s.mines[i])cell(h,i,9,255,72,50);
  h.assertSettled();assert.equal(h.snapshot().revealed,71);assert.ok(h.result.score>=1800);
});
test('Mine Garden: revealing an unflagged thorn ends the game',()=>{
  const h=gameHarness('mine-garden');h.press('act');const mine=h.snapshot().mines.findIndex(Boolean);cell(h,mine,9,255,72,50);h.assertSettled();assert.ok(h.snapshot().revealed<71);
});
test('Memory Lane: pairs remain open and all eight pairs complete the collection',()=>{
  const h=gameHarness('memory-lane'),deck=h.snapshot().deck;
  for(let value=0;value<8;value++){const pair=deck.map((v,i)=>v===value?i:-1).filter(i=>i>=0);cell(h,pair[0],4,258,66,112);cell(h,pair[1],4,258,66,112);h.step(1);}
  h.assertSettled();assert.equal(h.snapshot().pairs,8);assert.equal(h.snapshot().moves,8);
});
test('Memory Lane: unmatched cards close, input during the reveal is ignored, and the turn cap ends play',()=>{
  const h=gameHarness('memory-lane'),deck=h.snapshot().deck,a=0,b=deck.findIndex(v=>v!==deck[0]);
  for(let turn=0;turn<24;turn++){cell(h,a,4,258,66,112);cell(h,b,4,258,66,112);const moves=h.snapshot().moves;cell(h,(b+1)%16,4,258,66,112);assert.equal(h.snapshot().moves,moves);h.step(1);}
  h.assertSettled();assert.equal(h.snapshot().pairs,0);assert.equal(h.snapshot().moves,24);
});
test('Light Circuit: recorded legal toggles solve every generated board',()=>{
  for(const seed of[1,9,230]){const h=gameHarness('light-circuit',{seed});for(let round=1;round<=3;round++){const s=h.snapshot();assert.equal(s.round,round);assert.ok(s.board.some(Boolean));for(const i of s.solution){if(h.snapshot().transition>0)break;select(h,i,5);h.press('act');}assert.ok(h.snapshot().board.every(v=>!v));h.step(1);}h.assertSettled();}
});
test('Crate Escape: all four designed rooms have verified legal solutions',()=>{
  const h=gameHarness('crate-escape'),routes=['RRUU','LUURRDDRUU','LUURDRRRLLUUDLLUURR','LUURRLLUDDDRRRUUDRUULDLU'];
  for(let room=0;room<4;room++){assert.equal(h.snapshot().level,room+1);for(const d of routes[room])h.press({L:'left',R:'right',U:'up',D:'down'}[d]);assert.ok(h.snapshot().boxes.every(i=>h.snapshot().goals.includes(i)));h.step(1);}
  h.assertSettled();assert.ok(h.result.score>1500);
});
test('Crate Escape: undo restores pushed crates and reset restores the room',()=>{
  const h=gameHarness('crate-escape'),initial=h.snapshot();h.press('right');h.press('right');const before=h.snapshot();h.press('up');assert.notDeepEqual(h.snapshot().boxes,before.boxes);h.press('undo');assert.deepEqual(h.snapshot().boxes,before.boxes);assert.equal(h.snapshot().player,before.player);h.press('reset');assert.deepEqual(h.snapshot().boxes,initial.boxes);assert.equal(h.snapshot().player,initial.player);
});
test('Slide Studio: reversing each legal shuffle restores the ordered board',()=>{
  const opposite={left:'right',right:'left',up:'down',down:'up'};
  for(const seed of[1,22,700]){const h=gameHarness('slide-studio',{seed}),s=h.snapshot();assert.equal(new Set(s.board).size,16);for(const d of s.scramble.slice().reverse())h.press(opposite[d]);h.assertSettled();assert.deepEqual(h.snapshot().board,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]);}
});
test('Slide Studio: undo and reset preserve the original shuffled puzzle',()=>{
  const h=gameHarness('slide-studio'),initial=h.snapshot(),direction=initial.empty%4?'left':'right';h.press(direction);assert.notDeepEqual(h.snapshot().board,initial.board);h.press('undo');assert.deepEqual(h.snapshot().board,initial.board);h.press(direction);h.press('reset');assert.deepEqual(h.snapshot().board,initial.board);
});
test('Number Nook: generated puzzles are unique and all three accept legal digit entry',()=>{
  const h=gameHarness('number-nook',{seed:19});
  for(let round=1;round<=3;round++){const s=h.snapshot();assert.equal(s.solutionCount,1);assert.ok(s.givens.filter(Boolean).length<=8);for(let i=0;i<16;i++)if(!s.givens[i]){cell(h,i,4,264,75,108);h.press('n'+s.solution[i]);}assert.ok(h.snapshot().transition>0);h.step(1);}
  h.assertSettled();assert.equal(h.snapshot().round,3);
});
test('Number Nook: printed clues cannot change and a wrong entry can be erased',()=>{
  const h=gameHarness('number-nook'),s=h.snapshot(),fixed=s.givens.findIndex(Boolean),empty=s.givens.findIndex(v=>!v);cell(h,fixed,4,264,75,108);h.press('n'+(s.solution[fixed]%4+1));assert.equal(h.snapshot().board[fixed],s.solution[fixed]);cell(h,empty,4,264,75,108);h.press('n'+(s.solution[empty]%4+1));h.press('check');assert.equal(h.snapshot().checks,1);h.press('clear');assert.equal(h.snapshot().board[empty],0);
});
test('Color Flood: the certified route completes within the advertised budget on several seeds',()=>{
  for(const seed of[2,8,91,733]){const h=gameHarness('color-flood',{seed}),s=h.snapshot();assert.equal(s.budget,s.solution.length+2);for(const color of s.solution)h.press('c'+color);h.assertSettled();assert.equal(h.snapshot().region.length,81);assert.ok(h.snapshot().moves<=s.budget);}
});
test('Color Flood: ineffective color changes can exhaust the budget',()=>{
  const h=gameHarness('color-flood');for(let n=0;n<100&&!h.result;n++)h.press('c'+(n%2));h.assertSettled();assert.equal(h.snapshot().moves,h.snapshot().budget);assert.ok(h.snapshot().region.length<81);
});
test('Word Trail: every generated word can be found by a forward or reverse drag',()=>{
  const h=gameHarness('word-trail',{seed:73}),s=h.snapshot();assert.equal(s.placements.length,6);s.placements.forEach((p,i)=>{assert.equal(p.cells.map(cell=>s.board[cell]).join(''),p.word);drag(h,p.cells[i%2?p.cells.length-1:0],p.cells[i%2?0:p.cells.length-1]);});h.assertSettled();assert.equal(h.snapshot().found.length,6);
});
test('Word Trail: keyboard selection works and cancellation discards an unfinished drag',()=>{
  const h=gameHarness('word-trail'),p=h.snapshot().placements[0];select(h,p.cells[0],8);h.press('act');select(h,p.cells[p.cells.length-1],8);h.press('act');assert.equal(h.snapshot().found.length,1);
  const other=h.snapshot().placements[1],first=other.cells[0],last=other.cells.at(-1);Object.assign(h.api.input.pointer,{x:264+(first%8+.5)*54,y:68+(Math.floor(first/8)+.5)*54,down:true,pressed:true,inside:true});h.frame();h.game.cancelInput();Object.assign(h.api.input.pointer,{x:264+(last%8+.5)*54,y:68+(Math.floor(last/8)+.5)*54,down:false,released:true});h.frame();assert.equal(h.snapshot().found.length,1);
});
test('Pipe Works: rotating the constructed path connects all three networks',()=>{
  for(const seed of[5,51,713]){const h=gameHarness('pipe-works',{seed});for(let round=1;round<=3;round++){const s=h.snapshot();assert.equal(s.round,round);for(const i of s.path){for(let turns=0;turns<4&&h.snapshot().board[i]!==s.solution[i]&&h.snapshot().transition<=0;turns++)cell(h,i,5,265,78,86);if(h.snapshot().transition>0)break;}assert.ok(h.snapshot().wet.includes(24));assert.ok(h.snapshot().transition>0);h.step(1.2);}h.assertSettled();}
});

function clues(values){const out=[];let run=0;for(const v of[...values,0]){if(v)run++;else if(run){out.push(run);run=0;}}return out.length?out:[0];}
function nonogramSolutions(rows,columns){const patterns=Array.from({length:32},(_,mask)=>Array.from({length:5},(_,i)=>(mask>>i)&1));const match=(p,c)=>JSON.stringify(clues(p))===JSON.stringify(c);const rowOptions=rows.map(c=>patterns.filter(p=>match(p,c))),colOptions=columns.map(c=>patterns.filter(p=>match(p,c)));let count=0;const selected=[];function search(r){if(r===5){count++;return;}for(const option of rowOptions[r]){selected.push(option);if(colOptions.every((choices,c)=>choices.some(p=>selected.every((row,i)=>row[c]===p[i]))))search(r+1);selected.pop();}}search(0);return count;}
test('Nonogram Nook: clues uniquely determine every picture and correct fills finish the collection',()=>{
  for(const seed of[1,19,72]){const h=gameHarness('nonogram-nook',{seed});for(let round=1;round<=3;round++){const s=h.snapshot();assert.equal(nonogramSolutions(s.rowClues,s.colClues),1);for(let i=0;i<25;i++)if(s.solution[i])cell(h,i,5,330,163,72);assert.ok(h.snapshot().transition>0);h.step(1.2);}h.assertSettled();}
});
test('Code Breaker: feedback counts duplicate colors exactly once and accepts the correct code',()=>{
  const h=gameHarness('code-breaker'),secret=h.snapshot().secret,guess=[0,1,1,2];for(const n of guess)h.press('c'+n);h.press('act');const row=h.snapshot().history[0],exact=guess.filter((v,i)=>v===secret[i]).length,total=Array.from({length:6},(_,n)=>Math.min(guess.filter(v=>v===n).length,secret.filter(v=>v===n).length)).reduce((a,b)=>a+b,0);assert.equal(row.exact,exact);assert.equal(row.misplaced,total-exact);assert.ok(row.exact+row.misplaced<=4);if(!h.result){for(const n of secret)h.press('c'+n);h.press('act');}h.assertSettled();assert.equal(h.snapshot().history.at(-1).exact,4);
});
test('Code Breaker: eight wrong guesses reveal the result without a ninth turn',()=>{
  const h=gameHarness('code-breaker'),wrong=(h.snapshot().secret[0]+1)%6;for(let row=0;row<8;row++){for(let col=0;col<4;col++)h.press('c'+wrong);h.press('act');}h.assertSettled();assert.equal(h.snapshot().history.length,8);assert.ok(h.snapshot().history.at(-1).exact<4);
});
test('Peg Parlor: inverse construction supplies legal solutions for all three boards',()=>{
  for(const seed of[1,28,390]){const h=gameHarness('peg-parlor',{seed});for(let round=1;round<=3;round++){const s=h.snapshot();assert.equal(s.round,round);assert.ok(s.board.filter(Boolean).length>=8);for(const jump of s.solution){assert.ok(h.snapshot().legal.some(j=>j.from===jump.from&&j.to===jump.to));cell(h,jump.from,7,263,78,62);cell(h,jump.to,7,263,78,62);}assert.equal(h.snapshot().board.filter(Boolean).length,1);assert.equal(h.snapshot().board[24],true);h.step(1.1);}h.assertSettled();}
});
test('Peg Parlor: undo restores all three holes affected by a jump',()=>{
  const h=gameHarness('peg-parlor'),initial=h.snapshot(),jump=initial.solution[0];cell(h,jump.from,7,263,78,62);cell(h,jump.to,7,263,78,62);assert.equal(h.snapshot().board.filter(Boolean).length,initial.board.filter(Boolean).length-1);h.press('undo');assert.deepEqual(h.snapshot().board,initial.board);assert.equal(h.snapshot().moves,0);
});
