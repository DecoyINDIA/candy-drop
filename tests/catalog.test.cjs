'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {CATALOG}=require('../assets/core.js');const root=path.resolve(__dirname,'..');
test('Enlarged board views stay within the logical scene',()=>{
  const boards=CATALOG.filter(g=>g.focus);assert.ok(boards.length>=20);
  for(const g of boards){const [x,y,w,h]=g.focus;assert.equal(g.focus.length,4);assert.ok(g.focus.every(Number.isFinite));assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=960&&y+h<=600,g.id+' has a valid board crop');}
});
test('Every catalog game has complete, matching source, entry page and original art',()=>{
  for(const g of CATALOG){assert.match(g.id,/^[a-z]+(?:-[a-z]+)*$/);assert.ok(['Action','Racing','Sports','Strategy','Puzzle','Tabletop','Timing','Original'].includes(g.group));for(const field of['title','category','color','hook','duration','tag'])assert.equal(typeof g[field],'string');assert.match(g.color,/^#[a-f0-9]{6}$/i);const art=fs.readFileSync(path.join(root,'assets/art',g.id+'.svg'),'utf8');assert.match(art,/<svg\b/);assert.match(art,/viewBox="0 0 600 380"/);if(g.id==='candy-drop')continue;
    const html=fs.readFileSync(path.join(root,'games',g.id,'index.html'),'utf8');assert.ok(html.includes('<title>'+g.title+' — Candy Arcade</title>'));assert.ok(html.includes('src="game.js"'));let config;vm.runInNewContext(fs.readFileSync(path.join(root,'games',g.id,'game.js'),'utf8'),{Arcade:{mount(c){assert.equal(config,undefined);config=c;}}});assert.equal(config.id,g.id);assert.equal(config.title,g.title);assert.equal(config.howTo.length>=3,true);assert.equal(config.medals.length,3);assert.ok(config.medals.every((n,i,a)=>Number.isFinite(n)&&n>0&&(!i||n>a[i-1])));const codes=config.controls.flatMap(c=>c.keys||[]);assert.equal(new Set(codes).size,codes.length,g.id+' has unambiguous key mappings');assert.ok(!codes.includes('KeyP')&&!codes.includes('Escape'),g.id+' respects reserved pause keys');
  }
});
