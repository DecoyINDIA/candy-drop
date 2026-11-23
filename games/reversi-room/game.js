(function () {
  'use strict';
  const N = 6, X = 235, Y = 82, S = 73;
  const dirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  function flips(b, i, p) {
    if (b[i]) return []; const x = i % N, y = Math.floor(i / N), out = [];
    for (const [dx,dy] of dirs) { let xx = x + dx, yy = y + dy, run = []; while (xx >= 0 && yy >= 0 && xx < N && yy < N && b[yy*N+xx] === 3-p) { run.push(yy*N+xx); xx += dx; yy += dy; } if (run.length && xx >= 0 && yy >= 0 && xx < N && yy < N && b[yy*N+xx] === p) out.push(...run); }
    return out;
  }
  function legal(b,p) { return b.map((_,i)=>i).filter(i=>flips(b,i,p).length); }
  function place(b,i,p) { const next=b.slice(); for(const k of flips(b,i,p)) next[k]=p; next[i]=p; return next; }
  function rating(b) { let v=0; b.forEach((p,i)=>{const edge=i%6===0||i%6===5||i<6||i>=30, corner=[0,5,30,35].includes(i);v+=(p===2?1:p===1?-1:0)*(corner?40:edge?5:1);}); return v+legal(b,2).length*3-legal(b,1).length*3; }
  Arcade.mount({ id:'reversi-room', title:'Reversi Room', category:'Tabletop', accent:'#8fdfbc', description:'Turn a quiet corner into a winning board.',
    howTo:['On this 6 × 6 board, you are mint. Place a disc to trap coral discs between two of yours.', 'Move the cursor with arrows and place with Space, or tap a marked square. Turns with no legal move are passed.', 'The most discs wins once neither player can move. Corners cannot be flipped: make them count.'],
    controls:[{id:'left',label:'←',keys:['ArrowLeft','KeyA']},{id:'right',label:'→',keys:['ArrowRight','KeyD']},{id:'up',label:'↑',keys:['ArrowUp','KeyW']},{id:'down',label:'↓',keys:['ArrowDown','KeyS']},{id:'place',label:'Place',keys:['Space']}],medals:[900,1800,2900],
    create(api){
      let board=Array(36).fill(0),cursor=8,turn=1,wait=0,finished=false,passes=0,moves=0;
      board[14]=board[21]=1;board[15]=board[20]=2;
      function finish(){finished=true;const mine=board.filter(p=>p===1).length, rival=board.filter(p=>p===2).length;api.end({score:mine*55+(mine>rival?1500:mine===rival?700:0),title:mine>rival?'The room is yours.':mine===rival?'An even split.':'A coral finish.',message:'Protect the corners and avoid gifting the squares beside them.',stats:[{label:'Mint discs',value:mine},{label:'Coral discs',value:rival},{label:'Moves',value:moves}]});}
      function play(i){const f=flips(board,i,turn);if(!f.length)return;board=place(board,i,turn);moves++;passes=0;turn=3-turn;wait=.55;api.sound('good');api.score(board.filter(p=>p===1).length*30);}
      return {
        update(dt){if(finished)return;let available=legal(board,turn);if(!available.length){passes++;turn=3-turn;wait=.5;if(passes>=2){finish();return;}api.toast('No legal move. Turn passed.');return;}
          if(turn===2){wait-=dt;if(wait<=0){let best=-Infinity,choice=available[0];for(const i of available){const next=place(board,i,2), replies=legal(next,1);const v=replies.length?Math.min(...replies.map(j=>rating(place(next,j,1)))):rating(next)+10;if(v>best){best=v;choice=i;}}play(choice);}}
          else {if(api.input.pressed('left'))cursor=Math.floor(cursor/N)*N+(cursor%N+N-1)%N;if(api.input.pressed('right'))cursor=Math.floor(cursor/N)*N+(cursor%N+1)%N;if(api.input.pressed('up'))cursor=(cursor+30)%36;if(api.input.pressed('down'))cursor=(cursor+6)%36;const p=api.input.pointer;if(p.pressed&&p.x>=X&&p.x<X+N*S&&p.y>=Y&&p.y<Y+N*S){cursor=Math.floor((p.y-Y)/S)*N+Math.floor((p.x-X)/S);play(cursor);}else if(api.input.pressed('place'))play(cursor);}
          api.hud([{label:'Mint',value:board.filter(p=>p===1).length},{label:'Coral',value:board.filter(p=>p===2).length},{label:'Turn',value:turn===1?'You':'Rival'}]);
        },
        draw(ctx){ctx.save();ctx.fillStyle='#142c2d';ctx.fillRect(0,0,960,600);ctx.font='bold 28px system-ui';ctx.fillStyle='#d6f1dd';ctx.fillText('A QUIET',35,240);ctx.fillText('LITTLE',35,277);ctx.fillText('REVERSAL.',35,314);const available=turn===1?legal(board,1):[];
          for(let i=0;i<36;i++){const x=X+(i%N)*S,y=Y+Math.floor(i/N)*S;ctx.fillStyle=(i+Math.floor(i/N))%2?'#31534b':'#2b4944';ctx.fillRect(x+2,y+2,S-4,S-4);if(i===cursor){ctx.strokeStyle='#fff2ba';ctx.lineWidth=3;ctx.strokeRect(x+5,y+5,S-10,S-10);}if(board[i]||available.includes(i)){ctx.fillStyle=board[i]===1?'#a7e5c2':board[i]===2?'#f28e93':'#9ac5b2';ctx.beginPath();ctx.arc(x+S/2,y+S/2,board[i]?27:6,0,Math.PI*2);ctx.fill();}}
          ctx.font='17px system-ui';ctx.fillStyle='#b5cec5';ctx.fillText('Mint is you.',715,240);ctx.fillText('Corners stay.',715,273);ctx.fillText('Edges matter.',715,306);ctx.restore();},
        inspect(){return{board:board.slice(),cursor,turn,moves,finished,legal:legal(board,turn)};}
      };
    }
  });
})();
