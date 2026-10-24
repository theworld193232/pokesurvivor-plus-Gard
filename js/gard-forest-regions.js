/* Gard's seeded terrain-extension approach, layered onto the friend's forest.
   The friend owns lakes, paths, trees, giant trunks, logs and native terrain.
   These rare, abandoned cabins are exterior scenery; no Story or Trainer logic. */
(() => {
 'use strict';const R=window.__PSX_REG__,AI=window.PSXAI,CELL=1152,cache=new Map();let seed=null;
 const on=()=>!!(AI.Forest?.on()&&!R.Maps.endless&&!window.PS_SAFEZONE?.active&&!R.Rift.inArena);
 function cabin(cx,cy){
  const s=AI.Decor.seed;if(s!==seed){cache.clear();seed=s;}
  const key=cx+','+cy;if(cache.has(key))return cache.get(key);
  const h=R.U.hash(cx,cy,s+17031);let c=null;
  if(h<.3){const x=(cx+.25+R.U.hash(cx,cy,s+17032)*.5)*CELL,y=(cy+.25+R.U.hash(cx,cy,s+17033)*.5)*CELL;
   let clear=Math.hypot(x,y)>650&&R.World.isFree(x,y,120);
   if(clear)for(let i=0;i<16;i++){const a=i/16*Math.PI*2;if(R.World.isLiquid(x+Math.cos(a)*116,y+Math.sin(a)*88)){clear=false;break;}}
   if(clear)c={x,y,cx,cy};
  }
  if(cache.size>256)cache.delete(cache.keys().next().value);cache.set(key,c);return c;
 }
 let querying=false;
 function near(x,y,r=1500){if(!on()||querying)return [];querying=true;try{const out=[];for(let cy=Math.floor((y-r)/CELL);cy<=Math.floor((y+r)/CELL);cy++)for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++){const c=cabin(cx,cy);if(c)out.push(c);}return out;}finally{querying=false;}}
 function blocked(x,y,r=0){return near(x,y,200).some(c=>Math.abs(x-c.x)<74+r&&y>c.y-35-r&&y<c.y+22+r);}
 const free=R.World.isFree;R.World.isFree=function(x,y,r,...a){return free.call(this,x,y,r,...a)&&!blocked(x,y,r||0);};
 const collide=R.World.collide;R.World.collide=function(b,...a){const result=collide.call(this,b,...a);if(!b)return result;
  const r=Number(b.r)||0;for(const c of near(b.x,b.y,220)){const dx=b.x-c.x,dy=b.y-(c.y-6.5),rx=74+r,ry=28.5+r;if(Math.abs(dx)<rx&&Math.abs(dy)<ry){if(rx-Math.abs(dx)<ry-Math.abs(dy))b.x=c.x+(dx<0?-rx:rx);else b.y=c.y-6.5+(dy<0?-ry:ry);}}
  return result;
 };
 function draw(ctx,c){const x=Math.round(c.x),y=Math.round(c.y);ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(10,20,12,.23)';ctx.beginPath();ctx.ellipse(0,15,87,20,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#373b2d';ctx.fillRect(-77,-34,154,60);ctx.fillStyle='#777054';ctx.fillRect(-71,-82,142,100);
  for(let row=0;row<10;row++){ctx.fillStyle=row%2?'#5b5942':'#686348';ctx.fillRect(-71,-80+row*9,142,3);}
  ctx.fillStyle='#393e32';ctx.beginPath();ctx.moveTo(-86,-81);ctx.lineTo(-4,-131);ctx.lineTo(86,-81);ctx.closePath();ctx.fill();ctx.fillStyle='#535743';
  for(let row=0;row<6;row++){const w=150-row*24;ctx.fillRect(-w/2,-86-row*7,w,4);}
  ctx.fillStyle='#202c28';ctx.fillRect(-15,-31,30,49);ctx.fillRect(-54,-63,24,25);ctx.fillRect(31,-63,24,25);
  ctx.fillStyle='#898069';ctx.fillRect(-56,-51,30,5);ctx.fillRect(28,-58,30,5);ctx.fillStyle='#363529';ctx.fillRect(-15,-29,5,47);ctx.fillRect(-78,19,156,5);
  ctx.fillStyle='#47603b';for(const [a,b,w] of [[-67,-83,33],[36,-83,29],[-55,-100,28],[13,-116,20],[-74,-31,12],[61,-18,11]])ctx.fillRect(a,b,w,6);
  ctx.strokeStyle='#4a4938';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-30,-73);ctx.lineTo(-22,-39);ctx.lineTo(-29,-18);ctx.stroke();ctx.restore();
 }
 const drawables=R.Training.drawables;R.Training.drawables=function(...a){const list=drawables.apply(this,a)||[],p=R.Game.player;if(!p||!on()||['ui','over'].includes(R.Game.state))return list;return [...list,...near(p.x,p.y).map(c=>({y:c.y+22,draw:ctx=>draw(ctx,c)}))];};
 window.PS_GARD_FOREST={near,blocked,on,cell:CELL};
})();
