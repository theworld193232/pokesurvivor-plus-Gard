/* Groudon's run-local land trail. Only real liquid tiles convert; structures and entrances stay solid. */
(() => {
 'use strict';const R=window.__PSX_REG__,A=window.PSXAI,W=R.World,T=32,tiles=new Map();let run=null;
 const zone=()=>String(R.Maps.cur?.n??R.Maps.selected?.()??0)+':'+(window.PS_CRYSTAL_PEAK?.active?.()?window.PS_CRYSTAL_PEAK.model.zone:'world');
 const key=(x,y)=>zone()+':'+Math.floor(x/T)+','+Math.floor(y/T);
 const has=(x,y)=>tiles.has(key(x,y));
 const liquid=W.isLiquid.bind(W),wall=W.isWall.bind(W);
 function grow(p=R.Game.player){if(window.PS_VOLCANO?.active())return 0;if(!p||Number(p.dex)!==383||p.dead||R.Game.state!=='playing'||p.psxBoat)return 0;if(run!==R.Game.player){tiles.clear();run=R.Game.player;}let count=0;const radius=(Number(p.r)||18)+28;for(let ty=Math.floor((p.y-radius)/T);ty<=Math.floor((p.y+radius)/T);ty++)for(let tx=Math.floor((p.x-radius)/T);tx<=Math.floor((p.x+radius)/T);tx++){const x=(tx+.5)*T,y=(ty+.5)*T;if(Math.hypot(x-p.x,y-p.y)>radius+T*.4||has(x,y)||!liquid(x,y)||wall(x,y))continue;tiles.set(key(x,y),{x:tx*T,y:ty*T,zone:zone(),born:Number(R.Game.time)||0});count++;}return count;}
 function draw(ctx){if(!tiles.size)return;const cam=R.Camera,z=zone(),p=R.Game.player;if(!p)return;ctx.save();try{ctx.imageSmoothingEnabled=false;for(const d of tiles.values()){if(d.zone!==z||Math.abs(d.x-cam.x)>cam.w+64||Math.abs(d.y-cam.y)>cam.h+64)continue;ctx.fillStyle='#806e58';ctx.fillRect(d.x,d.y,T+1,T+1);for(let i=0;i<6;i++){const h=Math.abs((d.x*17+d.y*23+i*379)%997);ctx.fillStyle=i%2?'#9a886c':'#655746';ctx.fillRect(d.x+h%28,d.y+Math.floor(h/29)%28,2,2);}const age=(Number(R.Game.time)||0)-d.born;if(age<.7){ctx.globalAlpha=Math.max(0,.3-age*.4);ctx.fillStyle='#ffe6bf';ctx.fillRect(d.x,d.y,T,T);ctx.globalAlpha=1;}}}finally{ctx.restore();}}
 const collide=W.collide;W.collide=function(p,...args){grow(p);return collide.call(this,p,...args);};
 for(const [name,value]of [['isLiquid',false],['isWall',false],['kindAt','floor']]){const old=W[name];if(typeof old==='function')W[name]=function(x,y,...args){return has(x,y)?value:old.call(this,x,y,...args);};}
 const ground=W.drawGround;W.drawGround=function(ctx,...args){const result=ground.call(this,ctx,...args);grow();draw(ctx);return result;};
 const frame=A.Player.frame;A.Player.frame=function(...args){grow();return frame.apply(this,args);};
 const start=R.Game.startRun;R.Game.startRun=function(...args){tiles.clear();run=null;return start.apply(this,args);};
 window.PS_GROUDON_LAND={has,grow,tiles,draw,clear(){tiles.clear();run=null;}};
})();
