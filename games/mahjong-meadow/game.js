/* Mahjong Meadow — layered matching solitaire, generated from a legal removal order. */
(() => {
  'use strict';
  const COLORS = ['#a95656','#4e8877','#547f9e','#a58143','#7a699d','#bc7761','#598b51','#597c85','#a06987'];
  Arcade.mount({ id: 'mahjong-meadow', title: 'Mahjong Meadow', category: 'Tile solitaire', accent: '#b7d39c',
    description: 'Make a little space. Match the tiles at the edges of a quiet meadow.',
    howTo: ['Match two tiles with the same number and symbol. A free tile has nothing above it and an open left or right edge.', 'Tap a free tile, then its matching partner. Arrows select tiles; Space chooses. Clear all 36 tiles.', 'Hint marks an available pair; Undo restores the last pair. Mix spreads remaining tiles into a solvable flat garden. Hints and mixes reduce your score.'],
    controls: [{id:'left',label:'←',keys:['ArrowLeft','KeyA']},{id:'right',label:'→',keys:['ArrowRight','KeyD']},{id:'up',label:'↑',keys:['ArrowUp','KeyW']},{id:'down',label:'↓',keys:['ArrowDown','KeyS']},{id:'act',label:'Choose',keys:['Space','Enter']},{id:'hint',label:'Hint',keys:['KeyH']},{id:'undo',label:'Undo',keys:['KeyZ']},{id:'mix',label:'Mix',keys:['KeyM']},{id:'bank',label:'Finish',keys:['KeyB']}], medals:[900,2200,3200],
    create(api) {
      let tiles = [], cursor = 0, chosen = -1, cleared = 0, time = 0, penalty = 0, finished = false, mixes = 0, hints = 0, hintPair = [], hintTime = 0, rows = 4;
      const history = []; let solution = [];
      for(let z=0;z<3;z++)for(let y=z?1:0;y<(z?3:4);y++)for(let x=z===0?0:z===1?1:2;x<(z===0?6:z===1?5:4);x++)tiles.push({id:tiles.length,x,y,z,type:0,removed:false});
      function free(i, items=tiles) {
        const t=items[i];if(!t||t.removed)return false;
        if(items.some(o=>!o.removed&&o.z>t.z&&o.x===t.x&&o.y===t.y))return false;
        return !items.some(o=>!o.removed&&o.z===t.z&&o.y===t.y&&o.x===t.x-1)||!items.some(o=>!o.removed&&o.z===t.z&&o.y===t.y&&o.x===t.x+1);
      }
      function assignPairs() {
        const copy=tiles.map(t=>({...t}));solution=[];let count=0;
        while(copy.some(t=>!t.removed)){
          const top=Math.max(...copy.filter(t=>!t.removed).map(t=>t.z));
          const rowIds=[...new Set(copy.filter(t=>!t.removed&&t.z===top).map(t=>t.y))];
          const row=rowIds[Math.floor(api.random()*rowIds.length)];
          const ends=copy.filter(t=>!t.removed&&t.z===top&&t.y===row&&free(t.id,copy));
          const pair=[ends[0].id,ends[ends.length-1].id];
          // Construction and the flat rescue layout both have an even number in each row.
          const type=count++%9;for(const id of pair){tiles[id].type=type;copy[id].removed=true;}solution.push(pair);
        }
      }
      assignPairs();cursor=tiles.findIndex((_,i)=>free(i));
      const remaining=()=>tiles.filter(t=>!t.removed).length;
      const value=()=>Math.max(0,cleared*120-penalty);
      function pairs(){const open=tiles.filter(t=>free(t.id)),out=[];for(let i=0;i<open.length;i++)for(let j=i+1;j<open.length;j++)if(open[i].type===open[j].type)out.push([open[i].id,open[j].id]);return out;}
      function hud(){api.score(value());api.hud([{label:'Tiles',value:remaining()+'/36'},{label:'Available pairs',value:pairs().length},{label:'Hints',value:hints},{label:'Mixes',value:mixes}]);}
      function finish(win){finished=true;api.end({score:value()+(win?Math.max(0,1600-Math.floor(time*1.5)):0),title:win?'A meadow with room to breathe.':'A quiet moment in the meadow.',message:'Look beneath a pair before removing it. Opening a lower layer can change the whole garden.',stats:[{label:'Pairs',value:cleared+'/18'},{label:'Hints',value:hints},{label:'Mixes',value:mixes},{label:'Time',value:Math.round(time)+'s'}]});}
      function choose(i){cursor=i;if(!free(i)){api.toast('Choose a tile with nothing above it and one open side.');return;}if(chosen===i){chosen=-1;return;}if(chosen>=0&&tiles[chosen].type===tiles[i].type){history.push([chosen,i]);tiles[chosen].removed=tiles[i].removed=true;cleared++;chosen=-1;hintPair=[];api.sound('good');if(!remaining()){finish(true);return;}cursor=tiles.findIndex((_,n)=>free(n));if(!pairs().length)api.toast('No matching free pairs. Undo a pair or use Mix.');}else{chosen=i;api.sound('click');}}
      function mix(){const alive=tiles.filter(t=>!t.removed);if(alive.length<2)return;rows=Math.ceil(alive.length/6);alive.forEach((t,i)=>{t.x=i%6;t.y=Math.floor(i/6);t.z=0;});chosen=-1;hintPair=[];history.length=0;mixes++;penalty+=250;assignPairs();cursor=alive[0].id;api.sound('click');api.toast('A fresh, solvable arrangement of the remaining tiles.');}
      function rect(t){return{x:252+t.x*76+t.z*4,y:300-rows*40+t.y*80-t.z*5,w:72,h:76};}
      function move(dx,dy){const alive=tiles.filter(t=>!t.removed),current=rect(tiles[cursor]);let best=null,dist=1e9;for(const t of alive){if(t.id===cursor)continue;const r=rect(t),xx=r.x-current.x,yy=r.y-current.y;if(dx&&xx*dx<=2||dy&&yy*dy<=2)continue;const d=Math.abs(dx?xx:yy)+Math.abs(dx?yy:xx)*3;if(d<dist){dist=d;best=t.id;}}if(best!==null)cursor=best;}
      hud();
      return{ update(dt){if(finished)return;time+=dt;hintTime=Math.max(0,hintTime-dt);const k=api.input;if(k.pressed('bank')){finish(false);return;}if(k.pressed('left'))move(-1,0);if(k.pressed('right'))move(1,0);if(k.pressed('up'))move(0,-1);if(k.pressed('down'))move(0,1);
          if(k.pressed('undo')&&history.length){const pair=history.pop();for(const i of pair)tiles[i].removed=false;cleared--;chosen=-1;cursor=pair[0];hintPair=[];api.sound('click');}
          if(k.pressed('mix'))mix();
          if(k.pressed('hint')){const p=pairs()[0];if(p){hintPair=p;hintTime=3;hints++;penalty+=75;cursor=p[0];api.toast('The outlined tiles make an available pair.');}else api.toast('No pair is free. Undo or mix the remaining tiles.');}
          if(k.pressed('act'))choose(cursor);if(finished)return;
          const p=k.pointer;if(p.pressed&&p.inside){const hit=tiles.slice().sort((a,b)=>b.z-a.z||b.id-a.id).find(t=>{if(t.removed)return false;const r=rect(t);return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;});if(hit)choose(hit.id);}if(!finished)hud();
        },
        draw(c){c.save();c.fillStyle='#dfe7cd';c.fillRect(0,0,960,600);c.fillStyle='#c7d4b7';for(let i=0;i<16;i++){c.beginPath();c.ellipse(45+i*61,535+(i%3)*12,34,12,(i%2?1:-1)*.5,0,Math.PI*2);c.fill();}c.fillStyle='#365646';c.font='800 28px system-ui';c.textAlign='center';c.fillText('A LITTLE ROOM TO GROW.',480,35);
          for(const t of tiles.slice().sort((a,b)=>a.z-b.z||a.id-b.id)){if(t.removed)continue;const r=rect(t),available=free(t.id);c.fillStyle='#6f806a45';c.beginPath();c.roundRect(r.x+3,r.y+6,r.w,r.h,8);c.fill();c.fillStyle=chosen===t.id?'#eed6a5':available?'#fff9e8':'#d6d9c8';c.beginPath();c.roundRect(r.x,r.y,r.w,r.h-3,8);c.fill();c.strokeStyle=t.id===cursor?'#446a4f':hintTime&&hintPair.includes(t.id)?'#c28c35':'#b9c2a8';c.lineWidth=t.id===cursor||hintTime&&hintPair.includes(t.id)?3:1;c.stroke();c.fillStyle=COLORS[t.type];c.font='800 30px system-ui';c.fillText(t.type+1,r.x+36,r.y+36);for(let j=0;j<3;j++){c.beginPath();c.arc(r.x+25+j*11,r.y+54,3+(t.type%3),0,Math.PI*2);c.fill();}}
          c.fillStyle='#527052';c.textAlign='left';c.font='700 18px system-ui';c.fillText('FREE TILE',35,210);c.font='16px system-ui';['Nothing above.','An open side.','A matching partner.'].forEach((s,i)=>c.fillText(s,35,246+i*26));c.textAlign='right';c.fillText('Hint · Undo · Mix',925,281);c.fillText('Take your time.',925,310);c.restore();},
        inspect(){return{tiles:tiles.map(t=>({...t,free:free(t.id),rect:rect(t)})),solution:solution.map(p=>p.slice()),available:pairs(),cursor,chosen,cleared,time,penalty,mixes,hints,finished,history:history.map(p=>p.slice()),score:value()};}
      };
    }
  });
})();
