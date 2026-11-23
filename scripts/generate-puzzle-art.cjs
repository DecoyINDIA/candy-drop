/* Original, reproducible SVG cover illustrations for the twelve puzzle games. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, '..', 'assets', 'art');
fs.mkdirSync(output, { recursive: true });

const rect = (x, y, w, h, fill, r = 8, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, color, width = 3, extra = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const text = (value, x, y, color, size = 24, weight = 700) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="${weight}" font-size="${size}" fill="${color}">${value}</text>`;
const group = (content, transform = '', extra = '') => `<g transform="${transform}" ${extra}>${content}</g>`;
const sparkle = (x, y, color, size = 12) => `<path d="M${x} ${y-size}L${x+3} ${y-3} ${x+size} ${y} ${x+3} ${y+3} ${x} ${y+size} ${x-3} ${y+3} ${x-size} ${y} ${x-3} ${y-3}Z" fill="${color}"/>`;
function frame(id, top, bottom, scene, accents = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
<defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><filter id="shadow" x="-25%" y="-25%" width="150%" height="165%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#102733" flood-opacity=".18"/></filter><linearGradient id="glass" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
${rect(0,0,600,380,'url(#bg)',0)}${accents}${scene}</svg>\n`;
  fs.writeFileSync(path.join(output, `${id}.svg`), svg);
}

// Garden beds, careful number clues, and two small planted flags.
{
  let bed = rect(150,45,300,296,'#5c7d60',20) + rect(157,50,286,282,'#9eb78b',15);
  const values = [0,0,-1,-1,-1,0,1,3,-1,-1,0,1,-1,2,1,0,1,1,1,0,0,0,0,0,0];
  for(let i=0;i<25;i++) {
    const x=165+i%5*54,y=58+Math.floor(i/5)*54,open=values[i]>=0;
    bed += rect(x,y+3,49,49,open?'#c0d0a4':'#679267',6) + rect(x,y,49,46,open?'#f0f1d8':'#a9ca8b',6);
    if(values[i]>0) bed += text(values[i],x+24.5,y+33,values[i]===1?'#4e84a1':'#71915a',25,800);
    if(i===8||i===12) bed += line(x+18,y+36,x+18,y+10,'#4e6c53',3)+`<path d="M${x+19} ${y+10}L${x+38} ${y+17} ${x+19} ${y+26}Z" fill="#df9272"/>`;
  }
  let leaves='';for(const [x,y,a] of [[113,287,-30],[489,91,35],[100,123,-40],[486,300,20]]) leaves+=group(`<ellipse cx="0" cy="0" rx="13" ry="32" fill="#8fa96d"/>${line(0,-22,0,22,'#c7d59d',2)}`,`translate(${x} ${y}) rotate(${a})`);
  frame('mine-garden','#d5dfbc','#a8c29b',group(bed,'rotate(-6 300 190)','filter="url(#shadow)"'),leaves+circle(511,253,79,'#e9edcb','opacity=".2"'));
}

// A real spread of postcards: two pairs face up among patterned backs.
{
  let cards='';const palette=['#e69580','#a0bea5','#b295c9','#e0bd73'];
  function flower(x,y,color,n){let out='';for(let i=0;i<n;i++)out+=`<ellipse cx="${x}" cy="${y-14}" rx="9" ry="19" fill="${color}" transform="rotate(${i*360/n} ${x} ${y})"/>`;return out+circle(x,y,9,'#fff6df');}
  for(let r=0;r<2;r++)for(let col=0;col<4;col++){
    const x=132+col*84,y=79+r*112,face=[0,2,5,7].includes(r*4+col);
    let card=rect(x,y+5,76,101,'#a96f68',10)+rect(x,y,76,98,face?'#fff4e4':'#c78f83',10);
    if(face)card+=flower(x+38,y+47,palette[col%2],col%2?5:4);
    else card+=rect(x+10,y+11,56,75,'none',5,'stroke="#efd0b9" stroke-width="2"')+group(rect(-10,-10,20,20,'#f4c6a7',3),`translate(${x+38} ${y+49}) rotate(45)`);
    cards+=group(card,`rotate(${(col-1.5)*2} ${x+38} ${y+49})`);
  }
  frame('memory-lane','#efd3c4','#d6aaa2',group(cards,'rotate(-7 300 190)','filter="url(#shadow)"'),circle(95,317,114,'#f7e8c6','opacity=".2"')+sparkle(503,88,'#fff0d0',15)+sparkle(100,183,'#fff0d0',8));
}

// A luminous, wired board with individual switch housings and real connecting traces.
{
  let scene=rect(148,40,304,302,'#132b30',22)+rect(156,48,288,286,'#203e3f',17);
  for(let r=0;r<5;r++)for(let col=0;col<5;col++){
    const x=192+col*54,y=83+r*54;
    if(col<4)scene+=line(x,y,x+54,y,'#527f63',3);
    if(r<4)scene+=line(x,y,x,y+54,'#527f63',3);
  }
  for(let i=0;i<25;i++){
    const x=168+i%5*54,y=59+Math.floor(i/5)*54,on=[0,2,6,7,10,11,12,13,14,17,22].includes(i);
    scene+=rect(x,y+4,48,48,on?'#719849':'#163033',11)+rect(x,y,48,45,on?'#b3df79':'#335650',10)+circle(x+24,y+22,10,on?'#e7ffad':'#4f7665');
    if(i===12)scene+=rect(x-4,y-4,56,54,'none',13,'stroke="#efffc8" stroke-width="2"');
  }
  let traces='';for(let k=0;k<5;k++)traces+=`<path d="M0 ${70+k*58}H${85+k*9}V${103+k*41}H150M450 ${65+k*57}H${512-k*7}V${100+k*48}H600" fill="none" stroke="#5d916a" stroke-width="2" opacity=".25"/>`;
  frame('light-circuit','#102c31','#213d34',group(scene,'rotate(-7 300 190)','filter="url(#shadow)"'),traces+circle(490,90,90,'#b4e879','opacity=".04"'));
}

// A small warehouse seen from above, with stacked wooden crates and a courier.
{
  const map=['########','# . .  #','#      #','# $ $  #','#  ##  #','# @    #','########'];let scene='';
  for(let r=0;r<7;r++)for(let col=0;col<8;col++){
    const x=148+col*38,y=57+r*38,ch=map[r][col];
    scene+=rect(x,y,36,36,ch==='#'?'#6b7c82':(r+col)%2?'#354b53':'#3c525a',4);
    if(ch==='#')scene+=rect(x+3,y+3,30,6,'#839398',2);
    if(ch==='.')scene+=circle(x+18,y+18,12,'none','stroke="#dfbd77" stroke-width="3"')+rect(x+13,y+13,10,10,'#dfbd77',1);
    if(ch==='$')scene+=rect(x+4,y+5,29,30,'#866146',4)+rect(x+4,y+2,29,29,'#c69964',4)+rect(x+8,y+6,21,21,'none',1,'stroke="#efcc91" stroke-width="2"')+line(x+8,y+6,x+29,y+27,'#efcc91',2);
    if(ch==='@')scene+=circle(x+18,y+19,14,'#8bc8cd')+rect(x+6,y+6,25,10,'#efd2a3',4)+circle(x+13,y+20,2,'#315565')+circle(x+23,y+20,2,'#315565');
  }
  const accents=line(82,289,124,289,'#e1b77b',4)+`<path d="M113 279L124 289 113 299" fill="none" stroke="#e1b77b" stroke-width="4" stroke-linejoin="round"/>`+sparkle(500,101,'#f0ca8c',13);
  frame('crate-escape','#304752','#172d36',group(scene,'rotate(-8 300 190)','filter="url(#shadow)"'),accents);
}

// Numbered porcelain sliders: a displaced row and a single unmistakable empty slot.
{
  const values=[1,2,3,4,5,6,8,0,9,10,7,12,13,14,11,15];let scene=rect(161,49,278,282,'#6e8ba3',20)+rect(168,53,264,270,'#a5bdcd',15);
  for(let i=0;i<16;i++){
    const x=177+i%4*62,y=63+Math.floor(i/4)*62,correct=values[i]===i+1;
    scene+=rect(x,y+4,57,57,values[i]?'#8da9b6':'#88a6bd',9);
    if(values[i])scene+=rect(x,y,57,55,correct?'#d6e8df':'#f4f5e8',9)+text(values[i],x+28.5,y+37,correct?'#44756d':'#5c7690',25,800);
    else scene+=rect(x+10,y+10,37,36,'none',4,'stroke="#607f98" stroke-width="2" stroke-dasharray="4 5"');
  }
  scene+=`<path d="M${177+2*62+23} 151H${177+3*62+22}M${177+3*62+10} 141L${177+3*62+22} 151 ${177+3*62+10} 161" fill="none" stroke="#c69162" stroke-width="4" stroke-linecap="round"/>`;
  frame('slide-studio','#d3e0e9','#9cb8cc',group(scene,'rotate(-7 300 190)','filter="url(#shadow)"'),circle(87,96,74,'#edf1da','opacity=".22"')+sparkle(496,294,'#eaf2dd',14));
}

// A compact Sudoku notebook, clearly divided into four 2×2 boxes.
{
  let scene=rect(160,43,280,296,'#b3a4ba',15)+rect(166,47,268,282,'#f6f1f6',11);
  const digits=[1,0,3,4,3,4,0,0,2,0,4,0,0,3,0,1];
  for(let i=0;i<16;i++){
    const x=175+i%4*62,y=62+Math.floor(i/4)*62;
    scene+=rect(x,y,60,60,i===6?'#ddc5e6':'#f0ebf2',1);
    if(digits[i])scene+=text(digits[i],x+30,y+42,'#75627f',28,700);
    if(i===6)scene+=text(1,x+30,y+42,'#a076ac',28,600);
  }
  for(let i=0;i<=4;i+=2)scene+=line(174+i*62,61,174+i*62,310,'#a38aaa',3)+line(174,61+i*62,423,61+i*62,'#a38aaa',3);
  scene+=group(rect(-8,-89,16,147,'#b798c5',3)+rect(-5,-89,5,147,'#dcc7e3',2)+`<path d="M-8 58L0 83 8 58Z" fill="#d9b892"/><path d="M-3 74L0 83 3 74Z" fill="#69546f"/>`,`translate(450 261) rotate(28)`);
  frame('number-nook','#e6dbe9','#c2afcd',group(scene,'rotate(-5 300 190)','filter="url(#shadow)"'),circle(93,295,95,'#f6eadb','opacity=".18"')+sparkle(499,98,'#f7e7e0',12));
}

// A colorful flood advancing from the corner, with a complete five-color palette.
{
  const palette=['#e89479','#e4c465','#8eb89d','#8aaec8','#b29ccb'];let scene=rect(156,39,288,284,'#c5b899',17)+rect(162,43,276,274,'#e8dec1',12);
  for(let r=0;r<8;r++)for(let col=0;col<8;col++){
    const value=r+col<6?0:(r*7+col*3+(r%3)*2)%5,x=171+col*32,y=52+r*32;
    scene+=rect(x,y,29,29,palette[value],4);
    if(r+col<6)scene+=circle(x+14.5,y+14.5,2,'#ffe0c5','opacity=".6"');
  }
  for(let n=0;n<5;n++)scene+=circle(202+n*49,340,15,palette[n])+circle(202+n*49,340,10,'none','stroke="#ffefcf" stroke-width="1.5" opacity=".5"');
  const droplet=`<path d="M118 136C118 136 96 164 96 180A22 22 0 0 0 140 180C140 164 118 136 118 136Z" fill="#e89479"/><path d="M108 177Q104 190 117 192" fill="none" stroke="#ffc9a6" stroke-width="4" stroke-linecap="round"/>`;
  frame('color-flood','#f0ddb1','#d5bc91',group(scene,'rotate(-5 300 190)','filter="url(#shadow)"'),droplet+sparkle(497,270,'#fff0cf',15));
}

// A discovered word on a paper letter grid, with a small brass magnifier.
{
  let scene=rect(157,41,286,298,'#bbad87',15)+rect(163,45,274,285,'#fbf4da',11);
  const rows=['AORBITX','BLKNCAD','MOONELR','SRAVENU','TENOVAM','COASTRE','COMETLS'];
  scene+=line(219.5,71,365.5,71,'#b9cc9d',27,'opacity=".65"')+line(183,290,329,290,'#e5c274',27,'opacity=".7"');
  for(let r=0;r<7;r++)for(let col=0;col<7;col++)scene+=text(rows[r][col],183+col*36.5,78+r*36.5,'#657156',19,700);
  const magnifier=circle(414,263,41,'#f9f7d4','fill-opacity=".2" stroke="#b89656" stroke-width="9"')+circle(414,263,32,'none','stroke="#ead8a1" stroke-width="3"')+line(443,292,486,334,'#8c6f45',15)+line(443,292,486,334,'#bd9c61',9)+line(395,244,405,235,'#fffbe5',5);
  frame('word-trail','#dce0bb','#acbb93',group(scene,'rotate(-6 300 190)','filter="url(#shadow)"')+magnifier,circle(98,107,65,'#edf0cb','opacity=".3"')+sparkle(101,292,'#fff4d3',13));
}

// An actual pipe route turns through the tile field and meets a brass drain.
{
  const route=[0,1,6,11,12,13,18,23,24],masks=Array.from({length:25},(_,i)=>[3,5,6,9,10,12][i%6]);
  route.forEach((cell,i)=>{let m=0;for(const next of[i?route[i-1]:-1,i<route.length-1?route[i+1]:-2])m|=next===-1?8:next===-2?2:next===cell-1?8:next===cell+1?2:next===cell-5?1:4;masks[cell]=m;});
  let scene=rect(150,40,300,300,'#6caba7',19)+rect(157,47,286,286,'#c2ded1',14);
  for(let i=0;i<25;i++){
    const x=166+i%5*54,y=56+Math.floor(i/5)*54,cx=x+24,cy=y+24,wet=route.includes(i);
    scene+=rect(x,y,49,49,'#edf3dd',8);
    for(const[dx,dy,bit]of[[-1,0,8],[1,0,2],[0,-1,1],[0,1,4]])if(masks[i]&bit)scene+=line(cx,cy,cx+dx*24,cy+dy*24,wet?'#54a6b0':'#a7c5b7',12);
    scene+=circle(cx,cy,7,wet?'#a3e0d8':'#c8ded0');
  }
  scene+=line(132,80,166,80,'#d5af61',10)+line(430,296,464,296,'#d5af61',10)+circle(132,80,11,'#e5c67d')+circle(464,296,11,'#e5c67d');
  frame('pipe-works','#d5e7d5','#9fc8bd',group(scene,'rotate(-6 300 190)','filter="url(#shadow)"'),circle(87,300,60,'#f0eed5','opacity=".2"')+sparkle(499,111,'#f2efce',12));
}

// Nonogram clues and a partly revealed heart, with crosses in the empty cells.
{
  const art=['01010','11111','11111','01110','00100'];let scene=rect(156,40,298,304,'#d4bd9d',18)+rect(162,45,286,288,'#f7ead7',12);
  const rowClues=['1 1','5','5','3','1'],columnClues=['2','3','4','3','2'];
  for(let col=0;col<5;col++)scene+=text(columnClues[col],231+col*42,83,'#96806a',17,700);
  for(let r=0;r<5;r++){
    scene+=text(rowClues[r],184,119+r*42,'#96806a',15,700);
    for(let col=0;col<5;col++){
      const x=210+col*42,y=91+r*42,filled=art[r][col]==='1'&&(r<3||col<3);
      scene+=rect(x,y,39,39,filled?'#84a18e':'#fff7e6',4);
      if(art[r][col]==='0')scene+=line(x+13,y+13,x+26,y+26,'#c7b69d',2)+line(x+26,y+13,x+13,y+26,'#c7b69d',2);
    }
  }
  scene+=rect(336,217,43,43,'none',5,'stroke="#be9473" stroke-width="3"');
  frame('nonogram-nook','#efdecb','#d4b99c',group(scene,'rotate(-6 300 190)','filter="url(#shadow)"'),sparkle(102,267,'#fff0d2',14)+sparkle(504,102,'#ffe9c6',10));
}

// Colored guesses, exact/misplaced feedback pins, and a four-slot lock at the top.
{
  const palette=['#ec927f','#e4c66d','#89bca7','#88afce','#b19ccc','#d59eb2'];let scene=rect(174,31,253,321,'#171c29',20)+rect(181,36,239,306,'#343747',15);
  const rows=[[0,1,2,3],[3,2,1,0],[4,1,1,2],[4,1,5,2],[4,1,5,0]];
  for(let col=0;col<4;col++)scene+=rect(198+col*42,48,33,25,'#555165',7)+circle(214.5+col*42,60.5,3,'#bca3ce');
  for(let row=0;row<5;row++){
    for(let col=0;col<4;col++)scene+=circle(215+col*42,105+row*43,15,palette[rows[row][col]])+circle(210+col*42,100+row*43,4,'#ffffff','opacity=".26"');
    const exact=[1,1,2,3,4][row], misplaced=[1,1,0,0,0][row];
    for(let n=0;n<4;n++)scene+=circle(381+n%2*13,99+row*43+Math.floor(n/2)*13,3.5,n<exact?'#e5d19f':n<exact+misplaced?'none':'#5e5969',n>=exact&&n<exact+misplaced?'stroke="#e5d19f" stroke-width="1.5"':'');
  }
  for(let n=0;n<6;n++)scene+=circle(204+n*36,324,10,palette[n]);
  frame('code-breaker','#3a314b','#1d2838',group(scene,'rotate(-7 300 190)','filter="url(#shadow)"'),circle(503,95,102,'#8e71a8','opacity=".13"')+sparkle(111,139,'#dcbfe3',13)+sparkle(487,296,'#e7c29e',12));
}

// A walnut peg board with a real legal jump indicated by its vacant landing hole.
{
  let scene=rect(145,38,310,309,'#926e4d',35)+rect(151,42,298,293,'#c6a37b',31);
  for(let k=0;k<8;k++)scene+=`<ellipse cx="300" cy="190" rx="${70+k*15}" ry="${115+k*8}" fill="none" stroke="#95704c" stroke-width="2" opacity=".12" transform="rotate(15 300 190)"/>`;
  const occupied=[3,10,16,17,18,21,22,23,24,28,30,31,32,38],valid=(r,c)=>(r>=2&&r<=4)||(c>=2&&c<=4);
  for(let r=0;r<7;r++)for(let col=0;col<7;col++)if(valid(r,col)){
    const x=180+col*40,y=69+r*40,i=r*7+col;scene+=circle(x,y,12,'#876b4e')+circle(x,y+2,9,'#a78863');
    if(occupied.includes(i))scene+=circle(x,y-2,15,'#436c5d')+circle(x-4,y-7,5,'#88a890');
    if(i===23||i===25)scene+=circle(x,y-2,19,'none','stroke="#f4e5ad" stroke-width="2"');
  }
  scene+=`<path d="M260 206Q300 166 340 206M330 195L340 206 326 209" fill="none" stroke="#f6e6ba" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  frame('peg-parlor','#e1c9a3','#b3916d',group(scene,'rotate(-6 300 190)','filter="url(#shadow)"'),sparkle(96,113,'#f9e8bf',12)+sparkle(508,291,'#f2dbb3',14));
}

console.log('Generated 12 original puzzle illustrations.');
