/* Sum Cross — small Kakuro grids certified by an independent search at construction. */
(() => {
  'use strict';
  const X = 260, Y = 74, S = 100;
  function runFits(values, total) {
    const used = values.filter(Boolean), sum = used.reduce((a, b) => a + b, 0), empty = values.length - used.length;
    if (new Set(used).size !== used.length) return false;
    if (!empty) return sum === total;
    const free = Array.from({ length: 9 }, (_, i) => i + 1).filter(n => !used.includes(n));
    return sum + free.slice(0, empty).reduce((a, b) => a + b, 0) <= total && sum + free.slice(-empty).reduce((a, b) => a + b, 0) >= total;
  }
  function countSolutions(board, rows, cols) {
    function allowed(i, value) {
      const old = board[i]; board[i] = value;
      const r = Math.floor(i / 3), c = i % 3;
      const okay = runFits(board.slice(r * 3, r * 3 + 3), rows[r]) && runFits([board[c], board[c + 3], board[c + 6]], cols[c]);
      board[i] = old; return okay;
    }
    function search() {
      let cell = -1, options = null;
      for (let i = 0; i < 9; i++) if (!board[i]) { const a = [1,2,3,4,5,6,7,8,9].filter(n => allowed(i, n)); if (!a.length) return 0; if (!options || a.length < options.length) { cell = i; options = a; } }
      if (cell < 0) return 1;
      let count = 0;
      for (const n of options) { board[cell] = n; count += search(); board[cell] = 0; if (count > 1) return 2; }
      return count;
    }
    return search();
  }
  Arcade.mount({
    id: 'sum-cross', title: 'Sum Cross', category: 'Mini Kakuro', accent: '#d1bd85',
    description: 'Where a little arithmetic meets a satisfying crossing.',
    howTo: ['Complete three mini Kakuro grids. Each white row and column must add to its clue, using digits 1–9 without repeats inside that row or column.', 'Clues above the grid give column sums; clues to the left give row sums. Printed numbers stay fixed. Every puzzle has exactly one solution.', 'Select a white cell with arrows or a tap, then use 1–9 or the number palette. Backspace erases. H checks your entries for a small bonus deduction.'],
    controls: [{id:'left',label:'←',keys:['ArrowLeft']},{id:'right',label:'→',keys:['ArrowRight']},{id:'up',label:'↑',keys:['ArrowUp']},{id:'down',label:'↓',keys:['ArrowDown']}].concat(Array.from({length:9},(_,i)=>({id:'n'+(i+1),label:String(i+1),keys:['Digit'+(i+1),'Numpad'+(i+1)]})),[{id:'erase',label:'Erase',keys:['Backspace','Delete']},{id:'check',label:'Check',keys:['KeyH','Enter']}]),
    medals: [900, 2000, 2700],
    create(api) {
      let board=[],solution=[],givens=[],rows=[],cols=[],selected=0,round=1,checks=0,roundChecks=0,entries=0,score=0,errorTime=0,transition=0,ended=false;
      function shuffle(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(api.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} }
      function load() {
        solution=[1,2,3,4,5,6,7,8,9];shuffle(solution);rows=[0,1,2].map(r=>solution.slice(r*3,r*3+3).reduce((a,b)=>a+b,0));cols=[0,1,2].map(c=>solution[c]+solution[c+3]+solution[c+6]);board=solution.slice();
        const order=[0,1,2,3,4,5,6,7,8];shuffle(order);
        for(const i of order){if(board.filter(Boolean).length<=(round===1?3:2))break;const old=board[i];board[i]=0;if(countSolutions(board.slice(),rows,cols)!==1)board[i]=old;}
        givens=board.map(Boolean);selected=board.indexOf(0);roundChecks=0;transition=0;errorTime=0;
      }
      function put(n) {
        if(transition>0||givens[selected])return;board[selected]=n;entries++;api.sound('click',.8+n*.045);
        if(board.every((v,i)=>v===solution[i])){score+=Math.max(300,1050-roundChecks*60);api.score(score);api.sound('win');transition=.9;}
      }
      function hud(){api.hud([{label:'Cross',value:round+' / 3'},{label:'Filled',value:board.filter(Boolean).length+' / 9'},{label:'Checks',value:checks}]);}
      load();hud();
      return {
        update(dt){
          if(ended)return;errorTime=Math.max(0,errorTime-dt);
          if(transition>0){transition-=dt;if(transition<=0){if(round===3){ended=true;api.end({score,title:'Every sum, in harmony.',message:'Three crossings solved. The right number works in both directions.',stats:[{label:'Grids',value:'3 / 3'},{label:'Checks',value:checks},{label:'Entries',value:entries}]});return;}round++;load();hud();}return;}
          const k=api.input;if(k.pressed('left')&&selected%3)selected--;if(k.pressed('right')&&selected%3<2)selected++;if(k.pressed('up')&&selected>=3)selected-=3;if(k.pressed('down')&&selected<6)selected+=3;
          const p=k.pointer;if(p.pressed&&p.inside){if(p.x>=X+S&&p.x<X+4*S&&p.y>=Y+S&&p.y<Y+4*S)selected=Math.floor((p.y-Y-S)/S)*3+Math.floor((p.x-X-S)/S);else if(p.x>=X&&p.x<X+400&&p.y>=503&&p.y<560)put(Math.floor((p.x-X)/(400/9))+1);}
          for(let n=1;n<=9;n++)if(k.pressed('n'+n))put(n);if(k.pressed('erase'))put(0);
          if(k.pressed('check')&&!transition){checks++;roundChecks++;errorTime=2;const wrong=board.filter((v,i)=>v&&v!==solution[i]).length;api.toast(wrong?wrong+' entries need another look.':'The entries agree with the crossing.');}hud();
        },
        draw(c){
          c.save();c.fillStyle='#efece0';c.fillRect(0,0,960,600);c.textAlign='left';c.fillStyle='#5f6451';c.font='800 31px Georgia,serif';c.fillText('THE SUM',28,184);c.fillText('OF SMALL',28,224,205);c.fillText('THINGS.',28,264);c.fillStyle='#96957c';c.font='16px system-ui';['A number across.','A number down.','One clear crossing.'].forEach((t,i)=>c.fillText(t,29,320+i*26,203));
          for(let r=0;r<4;r++)for(let col=0;col<4;col++){const x=X+col*S,y=Y+r*S;if(!r||!col){c.fillStyle='#687765';c.fillRect(x+2,y+2,96,96);if(r||col){c.strokeStyle='#9caa8c';c.lineWidth=1.5;c.beginPath();c.moveTo(x+8,y+8);c.lineTo(x+92,y+92);c.stroke();c.fillStyle='#f4eed6';c.font='800 26px system-ui';c.textAlign='center';c.fillText(!r?cols[col-1]:rows[r-1],x+(!r?33:68),y+(!r?76:40));}}else{const i=(r-1)*3+col-1,wrong=errorTime>0&&board[i]&&board[i]!==solution[i];c.fillStyle=wrong?'#e6b9a7':i===selected?'#e4d6a9':givens[i]?'#e0e3d3':'#fffaf0';c.fillRect(x+2,y+2,96,96);if(board[i]){c.fillStyle=givens[i]?'#5b695b':'#a5824f';c.font=(givens[i]?'800 ':'600 ')+'39px system-ui';c.textAlign='center';c.fillText(board[i],x+50,y+64);if(givens[i]){c.fillStyle='#aeb79e';c.beginPath();c.arc(x+50,y+83,2,0,Math.PI*2);c.fill();}}if(i===selected){c.strokeStyle='#b59759';c.lineWidth=2;c.strokeRect(x+5,y+5,90,90);}}}
          for(let i=0;i<9;i++){const x=X+i*400/9;c.fillStyle='#ddd8bd';c.beginPath();c.roundRect(x+2,505,400/9-4,52,7);c.fill();c.fillStyle='#62725b';c.textAlign='center';c.font='800 22px system-ui';c.fillText(i+1,x+200/9,540);}
          c.textAlign='left';c.fillStyle='#879171';c.font='700 14px system-ui';c.fillText('BOTH DIRECTIONS',721,177);c.font='800 37px Georgia,serif';c.fillText('1 TO 9',721,236);c.fillStyle='#9e9b81';c.font='15px system-ui';['Meet each sum.','Never repeat a digit','inside the same run.'].forEach((t,i)=>c.fillText(t,722,292+i*26));
          if(transition>0){c.fillStyle='#536d59ed';c.fillRect(347,257,326,91);c.fillStyle='#fff4d6';c.textAlign='center';c.font='800 28px system-ui';c.fillText('IT ALL ADDS UP',510,313);}c.restore();
        },
        inspect(){return{board:board.slice(),solution:solution.slice(),givens:givens.slice(),rows:rows.slice(),cols:cols.slice(),selected,round,checks,entries,score,transition,ended,solutionCount:countSolutions(board.map((v,i)=>givens[i]?v:0),rows,cols)};}
      };
    }
  });
})();
