/* Crystal Hollow → Frostcrown Summit: a bounded, connected map with crystal-only cave lighting. */
(() => {
 'use strict';
 const rooms=[[0,0,530,400,'Crystal Hollow'],[-820,-650,460,330,'Forgotten Mine'],[650,-700,500,360,'Echo Pools'],[0,-1580,390,470,'The Black Passage'],[0,-2210,740,360,'Upper Crystal Lake'],[-1030,-2510,430,350,'Regigigas Temple'],[1010,-2460,460,390,'Prismatic Sanctuary'],[0,-3400,1800,640,'Frostcrown Summit']];
 const links=[[0,1,135],[0,2,165],[1,3,120],[2,3,145],[3,4,110],[4,5,150],[4,6,145],[5,7,115],[6,7,115]];
 const colors=['#60baff','#5ef5ff','#6fffb2','#bd80ff','#ff99dc','#e7faff','#fb677c'];
 const hash=(x,y=0)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);};
 function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
 const outside=(x,y)=>y<-2940;
 const floor=(x,y)=>rooms.some((r,i)=>(i!==7||outside(x,y))&&((x-r[0])/r[2])**2+((y-r[1])/r[3])**2<1)||links.some(([a,b,w])=>distance(x,y,rooms[a],rooms[b])<w);
 const pillars=[[-1180,-2540,30],[-880,-2540,30],[-1180,-2680,30],[-1300,-2680,30],[850,-2520,25],[1170,-2520,25]];
 function free(x,y,r=12){if(!floor(x,y)||pillars.some(p=>Math.hypot(x-p[0],y-p[1])<r+p[2]))return false;for(let i=0;i<12;i++){const a=i*Math.PI/6;if(!floor(x+Math.cos(a)*r,y+Math.sin(a)*r))return false;}return true;}
 function region(x,y){let best=rooms[0],d=Infinity;for(const r of rooms){const v=Math.hypot(x-r[0],y-r[1]);if(v<d){best=r;d=v;}}return best[4];}
 const crystals=[];
 for(let j=0;j<rooms.length-1;j++){const r=rooms[j];if(j===3)continue;const n=j===4?16:j===6?18:9;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+.13,rr=.45+hash(i,j)*.3;crystals.push({x:r[0]+Math.cos(a)*r[2]*rr,y:r[1]+Math.sin(a)*r[3]*rr,size:j===6?38+hash(i,j+2)*38:17+hash(i,j+3)*36,col:colors[(i+j)% (i%11===0?7:6)],radius:135+hash(i,j+4)*100});}}
 crystals.push({x:0,y:-90,size:38,col:colors[1],radius:230},{x:0,y:-1160,size:16,col:colors[3],radius:105},{x:0,y:-1910,size:22,col:colors[0],radius:125});
 const pools=[[650,-740,200,100],[120,-2240,340,120],[-200,-2120,160,60]];
 const model={rooms,links,crystals,pillars,pools,floor,free,outside,region,distance};
 const R=window.__PSX_REG__,AI=window.PSXAI;
 const api=window.PS_CRYSTAL_PEAK={model,active:()=>!!(R?.Maps.cur?.n===2&&R.Maps.cur.crystalPeak&&!R.Rift?.inArena&&!window.PS_SAFEZONE?.active)};
 if(!R||!AI)return;
 const active=api.active;
 const map=R.Maps.LIST.find(m=>m.n===2);
 Object.assign(map,{name:'Crystal Hollow → Frostcrown Summit',crystalPeak:true,col:'#72dfff'});
 // Act 2 keeps the native forest-clear unlock, rewards and difficulty scaling.
 function wrap(obj,key,fn){const orig=obj?.[key];if(typeof orig==='function')obj[key]=function(...a){return active()?fn.call(this,orig,...a):orig.apply(this,a);};}
 let oldTerr=window.PS_TERRAIN,oldProp=window.PS_PROP_AT,oldRegion=window.PS_TERRAIN_REGION;
 const terrainHook=function(tx,ty,...a){return active()?(floor(tx*32+16,ty*32+16)?0:1):oldTerr?.(tx,ty,...a);};
 const propHook=function(...a){return active()?null:oldProp?.(...a);};
 const regionHook=function(x,y){return active()?region(x,y):oldRegion?.(x,y);};
 function ensureHooks(){
  if(window.PS_TERRAIN!==terrainHook){oldTerr=window.PS_TERRAIN;window.PS_TERRAIN=terrainHook;}
  if(window.PS_PROP_AT!==propHook){oldProp=window.PS_PROP_AT;window.PS_PROP_AT=propHook;}
  if(window.PS_TERRAIN_REGION!==regionHook){oldRegion=window.PS_TERRAIN_REGION;window.PS_TERRAIN_REGION=regionHook;}
 }
 ensureHooks();setInterval(ensureHooks,500);
 wrap(R.World,'isWall',(_,x,y)=>!floor(x,y));wrap(R.World,'isLiquid',()=>false);wrap(R.World,'isFree',(_,x,y,r)=>free(x,y,r));
 wrap(R.World,'propsInCircle',()=>[]);wrap(R.World,'specialsNear',()=>[]);wrap(R.World,'visibleProps',()=>[]);wrap(R.World,'drawLiquid',()=>{});
 wrap(R.World,'collide',(_,e)=>{if(!e)return false;if(free(e.x,e.y,e.r||12)){e.__cpSafe=[e.x,e.y];return false;}
  // Find the nearest valid point, rather than moving through a cliff or wall.
  const x=e.x,y=e.y;for(let d=4;d<=180;d+=4)for(let i=0;i<24;i++){const a=i*Math.PI/12,nx=x+Math.cos(a)*d,ny=y+Math.sin(a)*d;if(free(nx,ny,e.r||12)){e.x=nx;e.y=ny;e.__cpSafe=[nx,ny];return true;}}
  if(e.__cpSafe)[e.x,e.y]=e.__cpSafe;return true;});
 wrap(AI.Ground,'drawGround',()=>{});wrap(AI.Light,'drawAir',()=>{});wrap(AI.Light,'drawClock',()=>{});
 wrap(AI.Sky,'indoor',()=>!outside(R.Game.player?.x||0,R.Game.player?.y||0));
 for(const key of ['tick','thunder','rumble','mansion','musicBox'])wrap(AI.Ambience,key,function(orig,...a){if(outside(R.Game.player?.x||0,R.Game.player?.y||0))return orig.apply(this,a);});
 const view=()=>{const c=R.Camera;return [c.left()-64,c.top()-120,c.left()+c.w+64,c.top()+c.h+100];};
 function ellipse(ctx,x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 function crystal(ctx,c){ctx.save();ctx.translate(c.x,c.y);const n=3+Math.floor(hash(c.x)*3);for(let i=0;i<n;i++){const x=(i-(n-1)/2)*c.size*.37,h=c.size*(.65+hash(i,c.x)*.7),w=c.size*.24;ctx.fillStyle=c.col;ctx.beginPath();ctx.moveTo(x-w,0);ctx.lineTo(x-w,-h*.65);ctx.lineTo(x,-h);ctx.lineTo(x+w,-h*.65);ctx.lineTo(x+w,0);ctx.closePath();ctx.fill();ctx.fillStyle='#ecfbff';ctx.globalAlpha=.65;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,-h);ctx.lineTo(x+w,-h*.65);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}ctx.restore();}
 function temple(ctx,x,y,prism){
  ctx.save();ctx.translate(x,y);
  for(let i=3;i>=0;i--){ctx.fillStyle=i%2?'#6d7988':'#8895a3';ctx.fillRect(-170-i*12,-100-i*9,340+i*24,170+i*18);}
  ctx.strokeStyle='#303e50';ctx.lineWidth=2;for(let row=0;row<5;row++)for(let col=0;col<9;col++)ctx.strokeRect(-168+col*38+(row%2)*14,-100+row*34,38,34);
  if(prism){for(let i=0;i<6;i++){const a=i*Math.PI/3;crystal(ctx,{x:Math.cos(a)*95,y:Math.sin(a)*50,size:40,col:colors[i]});}
   ellipse(ctx,0,-8,65,48,'#517e9e');for(let i=0;i<7;i++){const a=i*Math.PI/3;ctx.strokeStyle=colors[i%6];ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(Math.cos(a)*62,Math.sin(a)*45-12);ctx.stroke();}crystal(ctx,{x:0,y:-15,size:72,col:'#b5eeff'});
  }else{ctx.fillStyle='#3a4451';ctx.fillRect(-85,-176,170,150);ctx.fillStyle='#101823';ctx.fillRect(-55,-140,110,114);ctx.strokeStyle='#9aa5a8';ctx.lineWidth=9;ctx.strokeRect(-86,-178,172,153);for(const [dx,dy] of [[-22,-111],[0,-111],[22,-111],[-22,-90],[22,-90],[0,-69],[0,-48]])ellipse(ctx,dx,dy,4,4,'#a49b63');
   for(let i=0;i<3;i++){const x=-120+i*120;ctx.fillStyle=['#8f8370','#8eb1c6','#89949c'][i];ctx.fillRect(x-19,28,38,63);ctx.fillStyle='#c5cbd0';ctx.fillRect(x-23,23,46,9);}}
  ctx.restore();
 }
 function drawGround(ctx){const [x0,y0,x1,y1]=view();ctx.save();ctx.fillStyle='#10131d';ctx.fillRect(x0,y0,x1-x0,y1-y0);
  const step=32;for(let y=Math.floor(y0/step)*step;y<y1;y+=step)for(let x=Math.floor(x0/step)*step;x<x1;x+=step){const h=hash(x/step,y/step),walk=floor(x+16,y+16),snow=outside(x,y);ctx.fillStyle=walk?(snow?['#cedeea','#d9e5ed','#e5eef5'][Math.floor(h*3)]:['#3e4454','#424a59','#38404f'][Math.floor(h*3)]):(snow?'#586a80':'#191d29');ctx.fillRect(x,y,step+1,step+1);if(walk){ctx.strokeStyle=snow?'#bacdda':'#515766';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+5,y+8);ctx.lineTo(x+14+h*8,y+5);ctx.lineTo(x+24,y+10);ctx.stroke();}else if(floor(x+48,y+16)||floor(x-16,y+16)||floor(x+16,y+48)){ctx.fillStyle=snow?'#8fa4b6':'#343a4b';ctx.fillRect(x,y,32,7);}}
  for(const [x,y,rx,ry] of pools){ellipse(ctx,x,y,rx,ry,'#183f54');for(let i=0;i<5;i++){ctx.strokeStyle='#4c98b4';ctx.globalAlpha=.25;ctx.beginPath();ctx.ellipse(x+Math.sin(i)*rx*.3,y+i*9-20,rx*.55-i*8,ry*.3,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
  // Old mining timbers and sparse non-luminous mushrooms.
  ctx.strokeStyle='#6e5747';ctx.lineWidth=12;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-1040+i*125,-660);ctx.lineTo(-1020+i*125,-800);ctx.stroke();}ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-1050,-800);ctx.lineTo(-620,-800);ctx.stroke();
  for(let i=0;i<14;i++){const c=crystals[i*3];ctx.fillStyle='#968b95';ctx.fillRect(c.x+29,c.y-5,3,8);ellipse(ctx,c.x+30,c.y-7,7,4,'#ad8aa4');}
  temple(ctx,-1030,-2510,false);temple(ctx,1010,-2460,true);
  for(const p of pillars){ctx.fillStyle='#596577';ctx.fillRect(p[0]-p[2],p[1]-80,p[2]*2,85);ellipse(ctx,p[0],p[1]-80,p[2]+5,12,'#a5b2bf');}
  for(const c of crystals)if(c.x>x0-200&&c.x<x1+200&&c.y>y0-100&&c.y<y1+150)crystal(ctx,c);
  // Mountain silhouettes and wind-cut rock teeth beyond the northern shelf.
  if(y0<-3700){for(let i=-5;i<=5;i++){const x=i*440;ctx.fillStyle=i%2?'#688298':'#8099ad';ctx.beginPath();ctx.moveTo(x-280,-3900);ctx.lineTo(x,-4400-hash(i)*220);ctx.lineTo(x+340,-3900);ctx.fill();ctx.fillStyle='#e4f0f6';ctx.beginPath();ctx.moveTo(x-90,-4230);ctx.lineTo(x,-4400-hash(i)*220);ctx.lineTo(x+100,-4220);ctx.fill();}}
  ctx.restore();
 }
 wrap(R.World,'drawGround',(_,ctx)=>drawGround(ctx));
 let mask=null,mg=null;
 function light(ctx,w,h){const cam=R.Camera;if(!mask){mask=document.createElement('canvas');mg=mask.getContext('2d');}const q=3,lw=Math.ceil(w/q),lh=Math.ceil(h/q);if(mask.width!==lw||mask.height!==lh){mask.width=lw;mask.height=lh;}
  mg.globalCompositeOperation='source-over';mg.fillStyle='#000000';mg.fillRect(0,0,lw,lh);
  // Exterior light stops at the cave threshold, independent of the camera/player position.
  const boundary=(-2940-cam.top())*cam.scale/q;mg.fillStyle='#f2f7ff';mg.fillRect(0,0,lw,Math.max(0,Math.min(lh,boundary)));
  mg.save();mg.beginPath();mg.rect(0,Math.max(0,boundary),lw,lh);mg.clip();mg.globalCompositeOperation='lighter';
  for(const c of crystals){const x=(c.x-cam.left())*cam.scale/q,y=(c.y-c.size*.4-cam.top())*cam.scale/q,r=c.radius*cam.scale/q;if(x+r<0||x-r>lw||y+r<0||y-r>lh)continue;const g=mg.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c.col);g.addColorStop(.28,c.col+'b0');g.addColorStop(1,c.col+'00');mg.fillStyle=g;mg.fillRect(x-r,y-r,r*2,r*2);}mg.restore();
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.imageSmoothingEnabled=true;ctx.drawImage(mask,0,0,w,h);ctx.restore();
  // Snow and drifting crystal dust are clipped to their respective environments.
  const time=(performance.now()/1000);ctx.save();ctx.beginPath();ctx.rect(0,0,w,Math.max(0,Math.min(h,boundary*q)));ctx.clip();ctx.fillStyle='#ffffffbb';for(let i=0;i<75;i++){const x=(hash(i)*w+Math.sin(time*.4+i)*24+time*12)%w,y=(hash(i,4)*h+time*(12+hash(i,2)*14))%h;ctx.fillRect(x,y,2,2);}ctx.restore();
  ctx.save();ctx.fillStyle='#d9eaff';for(const c of crystals){const x=(c.x+Math.sin(time*.3+c.x)*35-cam.left())*cam.scale,y=(c.y-40-(time*5+hash(c.x)*80)%90-cam.top())*cam.scale;if(x>0&&x<w&&y>0&&y<h){ctx.globalAlpha=.25;ctx.fillRect(x,y,1.5,1.5);}}ctx.restore();
 }
 wrap(R.Weather,'draw',(_,ctx,w,h)=>light(ctx,w,h));
 api.drawGround=drawGround;api.light=light;api.map=map;
 // Keep the native map selector; use a code-native banner for the new entry.
 const style=document.createElement('style');style.textContent='body.cp-selected #pp-banner{background-image:radial-gradient(ellipse at 25% 75%,#62e7ff77,transparent 28%),radial-gradient(ellipse at 75% 50%,#c383ff66,transparent 30%),linear-gradient(160deg,#07101b 60%,#d6eaf4 61%,#94b5ce)!important}body.cp-selected #pp-banner .pp-bgs{opacity:0}';document.head.append(style);
 let last='';const label=document.createElement('div');label.style='position:fixed;left:50%;top:118px;transform:translateX(-50%);pointer-events:none;z-index:24;color:#d2f3ff;text-shadow:0 2px 5px #000;font:600 12px system-ui;letter-spacing:1px;opacity:.8';document.body.append(label);
 setInterval(()=>{document.body.classList.toggle('cp-selected',R.Maps.selected()===2);const p=R.Game.player;label.textContent=active()&&R.Game.state==='playing'&&p?region(p.x,p.y):'';if(label.textContent!==last){last=label.textContent;label.animate?.([{opacity:0},{opacity:.85}],{duration:1000,fill:'forwards'});}},700);
})();
