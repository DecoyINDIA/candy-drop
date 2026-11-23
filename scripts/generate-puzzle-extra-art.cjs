'use strict';
const fs = require('node:fs');
const dir = require('node:path').resolve(__dirname, '../assets/art');
const rect = (x,y,w,h,fill,r=8,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle = (x,y,r,fill,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const line = (x1,y1,x2,y2,color,width=3,extra='') => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const text = (v,x,y,color,size=24) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${size}" fill="${color}">${v}</text>`;
const group = (body,transform='',extra='') => `<g transform="${transform}" ${extra}>${body}</g>`;
function frame(id,top,bottom,scene,decor='') {
  fs.writeFileSync(`${dir}/${id}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><filter id="shadow" x="-25%" y="-25%" width="150%" height="165%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#152a29" flood-opacity=".18"/></filter></defs>${rect(0,0,600,380,'url(#bg)',0)}${decor}${scene}</svg>\n`);
}

{
  const X=145,Y=47,S=45;
  let room=rect(X-12,Y-12,339,294,'#284a54',18)+rect(X-5,Y-5,325,280,'#122f3b',12);
  for(let i=0;i<42;i++)room+=rect(X+i%7*S+2,Y+Math.floor(i/7)*S+2,41,41,[17,24].includes(i)?'#152a35':'#1b3a44',5);
  const cells=[28,29,22,15,8,9,10,11,12,19,26,33,34];
  const points=[[X-29,Y+4.5*S],...cells.map(i=>[X+(i%7+.5)*S,Y+(Math.floor(i/7)+.5)*S]),[X+7*S+27,Y+4.5*S]];
  for(const[width,color]of[[12,'#f4d78018'],[6,'#f4d78055'],[2.5,'#ffe4a3']])room+=`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  for(const[i,type]of[[29,1],[8,1],[12,2],[33,2],[3,1],[37,2]]){const x=X+(i%7+.5)*S,y=Y+(Math.floor(i/7)+.5)*S;room+=line(x-13,y+(type===1?13:-13),x+13,y+(type===1?-13:13),'#a6d6d6',6)+line(x-13,y+(type===1?13:-13),x+13,y+(type===1?-13:13),'#e2f7e8',1.5);}
  for(const i of[22,10,19,34]){const x=X+(i%7+.5)*S,y=Y+(Math.floor(i/7)+.5)*S;room+=`<path d="M${x} ${y-11}L${x+8} ${y} ${x} ${y+11} ${x-8} ${y}Z" fill="#fff0b4" stroke="#f3c96f" stroke-width="1.5"/>`;}
  for(const i of[17,24]){const x=X+i%7*S,y=Y+Math.floor(i/7)*S;for(let j=0;j<3;j++)room+=line(x+10,y+12+j*9,x+35,y+12+j*9,'#36535b',2);}
  room+=circle(X-28,Y+4.5*S,10,'#f1cd85')+rect(X+7*S+17,Y+4.5*S-17,16,34,'#b3e4cb',5);
  let traces='';for(let j=0;j<3;j++)traces+=`<path d="M0 ${81+j*86}H88V${103+j*86}H132M472 ${100+j*83}H533V${72+j*83}H600" fill="none" stroke="#547c74" stroke-width="2" opacity=".22"/>`;
  frame('laser-lock','#183943','#112c37',group(room,'rotate(-6 300 190)','filter="url(#shadow)"'),traces);
}

{
  let workshop=rect(127,68,346,254,'#c5a477',15)+rect(131,64,338,246,'#e8d3ad',13);
  workshop+=rect(147,94,306,84,'#b9976a',8);
  for(let i=0;i<5;i++){const x=154+i*59;workshop+=rect(x,101,53,69,'#f9ebc9',5)+text('STEAM'[i],x+26.5,147,'#7e5b3e',30);}
  workshop+=line(151,197,448,197,'#b4966f',2);
  for(let i=0;i<6;i++){const x=144+i*51,used=i!==2;workshop+=rect(x,225,45,64,used?'#cfb889':'#9e7148',6)+rect(x,220,45,62,used?'#dcc8a3':'#f6d39a',6);workshop+=text('STREAM'[i],x+22.5,259,used?'#b5a080':'#775337',25);}
  const clip=rect(438,55,22,42,'#9d9170',5)+rect(443,61,12,28,'#d9c7a0',3);
  let paper=rect(441,91,61,121,'#fff2ce',4)+line(451,117,490,117,'#b5c1a1',4)+line(451,140,482,140,'#c6c6a9',3)+line(451,163,487,163,'#c6c6a9',3)+line(451,186,476,186,'#c6c6a9',3);
  const pencil=group(rect(-5,-68,10,120,'#7d9b84',2)+`<path d="M-5 52H5L0 72Z" fill="#e2bf8a"/><path d="M-1.7 65H1.7L0 72Z" fill="#625849"/>`,`translate(103 255) rotate(22)`);
  frame('word-forge','#eedcc0','#ceaf89',group(workshop,'rotate(-5 300 190)','filter="url(#shadow)"')+group(paper+clip,'rotate(8 470 125)'),pencil+circle(66,53,96,'#fff0d3','opacity=".18"'));
}

{
  let bench=rect(113,299,374,29,'#b6a27f',8)+rect(121,291,358,19,'#d3bf97',6);
  bench+=`<path d="M300 208L249 291H351Z" fill="#75937d"/>`+`<path d="M300 221L269 281H331Z" fill="#9fb092"/>`;
  bench+=line(128,209,472,209,'#8b7354',12)+line(128,205,472,205,'#c2a178',4)+circle(300,209,9,'#e9d6ad');
  const xs=[180,240,360,420],values=[2,5,3,3],dist=[2,1,1,2];
  for(let i=0;i<4;i++){const x=xs[i];bench+=line(x,204,x,170,'#9a805d',2)+rect(x-24,119,48,54,'#4f7465',8)+rect(x-17,112,34,14,'#81a28a',5)+text(values[i],x,156,'#f4e8c6',30)+text('×'+dist[i],x,239,'#a08460',16);}
  bench+=text(9,127,268,'#7b8468',23)+text(9,473,268,'#7b8468',23);
  const ruler=group(rect(-11,-106,22,208,'#d5bb8e',4)+Array.from({length:15},(_,i)=>line(-9,-95+i*13,i%5===0?7:1,-95+i*13,'#aa9067',1)).join(''),'translate(94 197) rotate(-12)');
  const basket=rect(450,54,70,42,'#b6a589',7)+rect(457,61,56,29,'#e7dac0',4);
  frame('balance-box','#e7e5d3','#cfc2a9',group(bench,'rotate(-2 300 190)','filter="url(#shadow)"'),ruler+group(basket,'rotate(9 480 80)')+circle(500,320,90,'#f5e8c6','opacity=".2"'));
}

{
  const X=145,Y=37,S=62,colors=['#e3a28d','#82b69e','#b19eca','#ddbb70','#83b4ca'];
  const paths=[[0,1,2,3,4],[5,6,11,10,15],[7,8,9,14,13],[12,17,16,21,20],[18,19,24,23,22]];
  let board=rect(X-11,Y-11,332,332,'#aabb9d',20)+rect(X-4,Y-4,318,318,'#cad7b9',15);
  for(let i=0;i<25;i++)board+=rect(X+i%5*S+2,Y+Math.floor(i/5)*S+2,58,58,'#f2f4dd',8);
  paths.forEach((path,color)=>{const route=color===3?path.slice(0,3):path;board+=`<polyline points="${route.map(i=>[X+(i%5+.5)*S,Y+(Math.floor(i/5)+.5)*S].join(',')).join(' ')}" fill="none" stroke="${colors[color]}" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>`;[path[0],path.at(-1)].forEach(i=>{const x=X+(i%5+.5)*S,y=Y+(Math.floor(i/5)+.5)*S;board+=circle(x,y,19,colors[color])+text(color+1,x,y+6,'#fff9de',18);});});
  const i=16;board+=circle(X+(i%5+.5)*S,Y+(Math.floor(i/5)+.5)*S,23,'none','stroke="#d9b565" stroke-width="2" stroke-dasharray="4 4"');
  let leaves='';for(const[x,y,a]of[[94,120,-35],[505,280,25],[495,97,39]])leaves+=group(`<ellipse cx="0" cy="0" rx="11" ry="27" fill="#99af85"/>${line(0,-18,0,18,'#cdd9ad',1.5)}`,`translate(${x} ${y}) rotate(${a})`);
  frame('trail-weaver','#dce5cc','#a9c0a4',group(board,'rotate(-5 300 190)','filter="url(#shadow)"'),leaves);
}
console.log('Created four puzzle illustrations.');
