/* Mirror Memory — timed sequence recall, with every third round played backward. */
(() => {
  'use strict';const X=270,Y=110,S=190,G=22,COLORS=['#e6c16c','#93c1a0','#9db9d5','#dca5b5'],NAMES=['SUN','LEAF','SKY','ROSE'];
  Arcade.mount({
    id:'mirror-memory',title:'Mirror Memory',category:'Sequence memory',accent:'#c6b7e0',description:'Keep a little melody in mind. Then turn it around.',
    howTo:['Watch the lit pads, then repeat their sequence. Finish nine rounds. Every third round is a mirror round: enter the sequence in reverse order.','Use keys 1–4 or D, F, J, K, or tap the matching pads. Inputs during the demonstration are ignored. You have three hearts.','A wrong note or expired recall clock costs a heart and repeats that round. R replays the demonstration for a point deduction. Sound is optional; colors, names and numbers show every note.'],
    controls:[{id:'pad0',label:'1 · Sun',keys:['Digit1','KeyD']},{id:'pad1',label:'2 · Leaf',keys:['Digit2','KeyF']},{id:'pad2',label:'3 · Sky',keys:['Digit3','KeyJ']},{id:'pad3',label:'4 · Rose',keys:['Digit4','KeyK']},{id:'replay',label:'Replay sequence',keys:['KeyR']}],medals:[1500,3700,5700],
    create(api){
      const sequence=[];for(let i=0;i<10;i++){let n=Math.floor(api.random()*4);if(i>1&&sequence[i-1]===n&&sequence[i-2]===n)n=(n+1+Math.floor(api.random()*3))%4;sequence.push(n);}
      let round=1,phase='watch',revealIndex=0,inputIndex=0,lit=-1,timer=.65,remaining=0,flash=0,hearts=3,errors=0,roundErrors=0,replays=0,earned=0,penalty=0,score=0,ended=false;
      const length=()=>round+1,reverse=()=>round%3===0,expected=()=>{const a=sequence.slice(0,length());return reverse()?a.reverse():a;};
      function tally(){score=Math.max(0,earned-penalty);api.score(score);}
      function watch(){phase='watch';revealIndex=0;inputIndex=0;lit=-1;timer=.65;remaining=0;flash=0;}
      function finish(win){ended=true;phase='ended';api.end({score,title:win?'A melody, beautifully remembered.':'A few notes to remember.',message:win?'Nine rounds echoed, with every mirror turned the right way.':'Watch the whole sequence before moving. On mirror rounds, begin with the last note you saw.',stats:[{label:'Rounds',value:(win?9:round-1)+' / 9'},{label:'Hearts left',value:hearts},{label:'Replays',value:replays},{label:'Mistakes',value:errors}]});}
      function fail(note){hearts--;errors++;roundErrors++;penalty+=120;tally();phase='mistake';lit=note;timer=.85;flash=.85;api.sound('bad');}
      function answer(note){if(phase!=='input')return;lit=note;flash=.19;if(note!==expected()[inputIndex]){fail(note);return;}inputIndex++;api.sound('good',.9+note*.22);if(inputIndex===length()){earned+=200+length()*50+round*20+(roundErrors===0?100:0);tally();phase='complete';timer=.8;api.sound('win');}}
      function hud(){api.hud([{label:'Round',value:round+' / 9'},{label:'Hearts',value:hearts},{label:'Order',value:reverse()?'REVERSE':'FORWARD'},{label:'Recall',value:phase==='input'?Math.ceil(remaining)+'s':phase==='watch'?'WATCH':phase==='complete'?'CLEAR':'RESET'}]);}
      hud();return{
        update(dt){if(ended)return;flash=Math.max(0,flash-dt);if(phase==='input'&&!flash)lit=-1;
          if(phase==='watch'){timer-=dt;if(timer<=0){if(lit>=0){lit=-1;revealIndex++;timer+=.18;}else if(revealIndex<length()){lit=sequence[revealIndex];timer+=Math.max(.32,.5-round*.012);api.sound('good',.9+lit*.22);}else{phase='input';inputIndex=0;remaining=8+length()*1.8;timer=0;}}hud();return;}
          if(phase==='mistake'||phase==='complete'){timer-=dt;if(timer<=0){if(phase==='mistake'){if(!hearts){finish(false);return;}watch();}else{if(round===9){finish(true);return;}round++;roundErrors=0;watch();}}hud();return;}
          remaining=Math.max(0,remaining-dt);if(!remaining){fail(-1);hud();return;}const k=api.input;if(k.pressed('replay')){replays++;roundErrors++;penalty+=80;tally();watch();hud();return;}
          for(let i=0;i<4;i++)if(k.pressed('pad'+i)){answer(i);if(phase!=='input')break;}
          const p=k.pointer;if(phase==='input'&&p.pressed&&p.inside&&p.x>=X&&p.x<X+S*2+G&&p.y>=Y&&p.y<Y+S*2+G){const col=Math.floor((p.x-X)/(S+G)),row=Math.floor((p.y-Y)/(S+G));if((p.x-X)%(S+G)<S&&(p.y-Y)%(S+G)<S)answer(row*2+col);}hud();
        },
        draw(c){c.save();c.fillStyle='#26263d';c.fillRect(0,0,960,600);c.textAlign='left';c.fillStyle='#e3d5eb';c.font='800 31px Georgia,serif';c.fillText('A LITTLE',28,184);c.fillText('MELODY.',28,226);c.fillStyle='#aaa0ba';c.font='16px system-ui';['Watch it closely.','Keep it in mind.','Turn it around.'].forEach((t,i)=>c.fillText(t,29,287+i*26,202));c.textAlign='center';c.fillStyle=reverse()?'#e1b5ca':'#b1c9c4';c.font='800 21px system-ui';c.fillText(reverse()?'↶ MIRROR · PLAY BACKWARD':'→ ECHO · PLAY FORWARD',471,73,425);
          for(let i=0;i<4;i++){const x=X+i%2*(S+G),y=Y+Math.floor(i/2)*(S+G),on=lit===i;c.fillStyle=on?COLORS[i]:'#3a3b50';c.beginPath();c.roundRect(x,y,S,S,25);c.fill();c.strokeStyle=on?'#fff3d9':COLORS[i];c.globalAlpha=on?1:.45;c.lineWidth=on?5:2;c.stroke();c.globalAlpha=1;c.fillStyle=on?'#39414b':COLORS[i];c.font='800 59px Georgia,serif';c.fillText(i+1,x+S/2,y+106);c.font='700 15px system-ui';c.fillText(NAMES[i],x+S/2,y+146);if(on){c.fillStyle='#fff5db80';c.beginPath();c.arc(x+S-30,y+29,6,0,Math.PI*2);c.fill();}}
          c.fillStyle='#d4c5df';c.font='800 22px system-ui';c.fillText(phase==='watch'?'WATCH THE LIGHTS':phase==='input'?'YOUR TURN · '+inputIndex+' / '+length():phase==='complete'?'BEAUTIFULLY REMEMBERED':'TAKE ANOTHER LOOK',471,555,440);c.textAlign='left';c.fillStyle='#b8aac9';c.font='700 14px system-ui';c.fillText('A MOMENT TO RECALL',738,170);c.font='800 60px Georgia,serif';c.fillText(String(round).padStart(2,'0'),739,246);c.font='16px system-ui';c.fillStyle='#a79ab7';c.fillText('of nine little rounds',739,284,185);c.fillText(reverse()?'Last note comes first.':'Keep the same order.',739,336,185);c.fillText('Three hearts to begin.',739,363,185);c.restore();},
        inspect(){return{sequence:sequence.slice(),expected:expected(),round,length:length(),reverse:reverse(),phase,revealIndex,inputIndex,lit,timer,remaining,hearts,errors,roundErrors,replays,earned,penalty,score,ended};}
      };
    }
  });
})();
