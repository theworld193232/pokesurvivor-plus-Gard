/* Crystal Hollow → Frostcrown Summit: a bounded, connected map with crystal-only cave lighting. */
(() => {
 'use strict';
 const rooms=[[0,0,530,400,'Crystal Hollow'],[-820,-650,460,330,'Forgotten Mine'],[650,-700,500,360,'Echo Pools'],[0,-1580,390,470,'The Black Passage'],[0,-2210,740,360,'Upper Crystal Lake'],[-1030,-2510,430,350,'Regigigas Temple'],[1010,-2460,460,390,'Prismatic Sanctuary'],[0,-3400,1800,640,'Frostcrown Summit']];
 const baseRooms=rooms.map(r=>r.slice());
 const links=[[0,1,135],[0,2,165],[1,3,120],[2,3,145],[3,4,110],[4,5,150],[4,6,145]];
 const colors=['#60baff','#5ef5ff','#6fffb2','#bd80ff','#ff99dc','#e7faff','#fb8472','#ffb66b'];
 const hash=(x,y=0)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);};
 function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
 let zone='cave';
 const outside=()=>zone==='peak';
 function setZone(next){zone=next==='peak'?'peak':'cave';}
 function doors(){return [5,6].map(i=>({x:rooms[i][0],y:rooms[i][1]-rooms[i][3]*.65,room:i}));}
 const floor=(x,y)=>outside()?((x-rooms[7][0])/rooms[7][2])**2+((y-rooms[7][1])/rooms[7][3])**2<1:rooms.slice(0,7).some(r=>((x-r[0])/r[2])**2+((y-r[1])/r[3])**2<1)||links.some(([a,b,w])=>distance(x,y,rooms[a],rooms[b])<w);
 const findings={seed:1,regigigas:false,terapagos:false};
 const pillars=[[-1180,-2540,30],[-880,-2540,30],[-1180,-2680,30],[-1300,-2680,30],[850,-2520,25],[1170,-2520,25]];
 function free(x,y,r=12){if(!floor(x,y)||(!outside()&&(solidPillars().some(p=>Math.hypot(x-p[0],y-p[1])<r+p[2])||crystals.some(c=>Math.hypot(x-c.x,y-c.y)<r+c.solid)||deepWater(x,y,r))))return false;for(let i=0;i<12;i++){const a=i*Math.PI/6;if(!floor(x+Math.cos(a)*r,y+Math.sin(a)*r))return false;}return true;}
 function region(x,y){if(outside())return 'Frostcrown Summit';let best=rooms[0],d=Infinity;for(const r of rooms.slice(0,7)){const v=Math.hypot(x-r[0],y-r[1]);if(v<d){best=r;d=v;}}return best===rooms[5]&&!findings.regigigas?'Western Frostgate':best===rooms[6]&&!findings.terapagos?'Eastern Frostgate':best[4];}
 const crystals=[];
 const pools=[[770,-820,240,130],[230,-2340,310,115],[-240,-2330,190,85],[-930,-730,125,65]];
 const debris=[];
 const channels=[[[920,-840],[870,-1040],[660,-1080],[570,-1260]],[[570,-1260],[530,-1500],[400,-1790],[400,-2110],[230,-2340]],[[-1050,-820],[-990,-980],[-700,-1080]]];
 function solidPillars(){return pillars.filter((p,i)=>(i<4?findings.regigigas:findings.terapagos)&&!reserved(p[0],p[1],p[2]+16));}
 function waterAt(x,y){if(outside()||!floor(x,y))return false;return pools.some(p=>((x-p[0])/p[2])**2+((y-p[1])/p[3])**2<1)||channels.some(line=>line.some((p,i)=>i&&distance(x,y,line[i-1],p)<23));}
 function reserved(x,y,r=0){return doors().some(d=>Math.hypot(x-d.x,y-d.y)<r+70)||links.some(([a,b])=>distance(x,y,rooms[a],rooms[b])<r+36)||rooms.some(p=>Math.hypot(x-p[0],y-p[1])<r+65);}
 function deepWater(x,y,r=0){return !outside()&&!reserved(x,y,r+15)&&pools.some(p=>((x-p[0])/Math.max(1,p[2]*.66+r))**2+((y-p[1])/Math.max(1,p[3]*.55+r))**2<1);}
 // Stable independent 1% rolls from the world's seed; movement never rerolls discoveries.
 function generate(seed){findings.seed=Number(seed)||1;setZone('cave');const S=findings.seed,H=(a,b=0)=>hash(a+S*.731,b+S*.193);
  findings.regigigas=hash(S,701)<.01;findings.terapagos=hash(S,1703)<.01;
  // Vary every chamber but retain the connected northward route and fixed exterior threshold.
  for(let i=0;i<rooms.length;i++){const b=baseRooms[i],r=rooms[i];r[0]=b[0]+(i&&i!==7?(H(i,1)-.5)*240:0);r[1]=b[1]+(i&&i!==7?(H(i,2)-.5)*130:0);r[2]=b[2]*(.9+H(i,3)*.24);r[3]=b[3]*(.92+H(i,4)*.2);}
  pillars.splice(0,pillars.length,...[[-150,-30,30],[150,-30,30],[-150,-170,30],[-270,-170,30]].map(p=>[rooms[5][0]+p[0],rooms[5][1]+p[1],p[2]]),...[[-160,-60,25],[160,-60,25]].map(p=>[rooms[6][0]+p[0],rooms[6][1]+p[1],p[2]]));
  pools.splice(0,pools.length,[rooms[2][0]+rooms[2][2]*.38,rooms[2][1]-120,180+H(1,7)*90,95+H(2,7)*45],[rooms[4][0]+rooms[4][2]*.42,rooms[4][1]-120,230+H(3,7)*100,90+H(4,7)*40],[rooms[4][0]-rooms[4][2]*.45,rooms[4][1]-110,130+H(5,7)*80,65+H(6,7)*30],[rooms[1][0]-130,rooms[1][1]-100,100+H(7,7)*40,55]);
  channels.splice(0,channels.length,[[pools[0][0],pools[0][1]],[rooms[2][0]+80,rooms[2][1]-260],[rooms[3][0]+220,rooms[3][1]+240],[rooms[3][0]+200,rooms[3][1]-220],[pools[1][0],pools[1][1]]],[[pools[2][0],pools[2][1]],[rooms[4][0]-150,rooms[4][1]-50],[pools[1][0],pools[1][1]]]);
  crystals.length=0;debris.length=0;
  for(let j=0;j<rooms.length-1;j++){const r=rooms[j];if(j===3)continue;const n=12+Math.floor(H(j,8)*10)+(j===4?8:0);
   for(let i=0;i<n;i++){const a=i/n*Math.PI*2+H(j,9)*.3,rr=.52+H(i,j+11)*.23,size=30+H(i,j+21)*65,x=r[0]+Math.cos(a)*r[2]*rr,y=r[1]+Math.sin(a)*r[3]*rr,solid=Math.min(90,size*.65*(j===6&&findings.terapagos?1.35:1));
    if(reserved(x,y,solid+16)||deepWater(x,y,solid)||!floor(x,y))continue;
    crystals.push({x,y,size,solid,col:colors[Math.floor(H(i,j+31)*(i%11===0?8:6))],radius:145+H(i,j+41)*90,prismatic:j===6&&findings.terapagos});
   }
   // Flat edge details add history without turning the route into an obstacle course.
   for(let k=0;k<4;k++){const a=H(j,k+71)*Math.PI*2,x=r[0]+Math.cos(a)*r[2]*.7,y=r[1]+Math.sin(a)*r[3]*.65;if(!reserved(x,y,45)&&!waterAt(x,y))debris.push({x,y,kind:['rails','fossil','cart','timbers'][Math.floor(H(j,k+81)*4)],angle:(H(j,k+91)-.5)*1.2});}
  }
  crystals.push({x:0,y:-100,size:42,solid:20,col:colors[1],radius:200},{x:rooms[3][0]-170,y:rooms[3][1]+380,size:24,solid:12,col:colors[3],radius:105},{x:rooms[3][0]+170,y:rooms[3][1]-370,size:30,solid:15,col:colors[0],radius:125});
  return findings;
 }
 generate(1);
 const model={rooms,links,crystals,pillars,pools,channels,debris,findings,generate,solidPillars,waterAt,deepWater,reserved,floor,free,outside,setZone,doors,region,distance};
 const R=window.__PSX_REG__,AI=window.PSXAI;
 const api=window.PS_CRYSTAL_PEAK={model,active:()=>!!(R?.Maps.cur?.n===2&&R.Maps.cur.crystalPeak&&!R.Rift?.inArena&&!window.PS_SAFEZONE?.active)};
 if(!R||!AI)return;
 const active=api.active;
 const reset=R.World.reset;R.World.reset=function(seed,...a){generate(seed);return reset.call(this,seed,...a);};
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
 wrap(R.EnemyMgr,'add',function(orig,e,...a){if(!e||!free(e.x,e.y,e.r||12))return false;return orig.call(this,e,...a);});
 wrap(R.World,'walkable',(_,x,y)=>free(x,y,4));
 wrap(R.World,'kindAt',(_,x,y)=>floor(x,y)?'floor':'wall');
 wrap(R.World,'isWall',(_,x,y)=>!floor(x,y));wrap(R.World,'isLiquid',(_,x,y)=>deepWater(x,y));wrap(R.World,'isFree',(_,x,y,r)=>free(x,y,r));
 wrap(R.World,'propsInCircle',(_,x,y,r)=>outside()?[]:crystals.filter(c=>Math.hypot(c.x-x,c.y-y)<r+c.solid).map(c=>({x:c.x,y:c.y,r:c.solid,type:'crystal',solid:true,destructible:false})));wrap(R.World,'specialsNear',()=>[]);wrap(R.World,'visibleProps',()=>[]);wrap(R.World,'drawLiquid',()=>{});
 wrap(R.World,'collide',(_,e)=>{if(!e)return false;if(free(e.x,e.y,e.r||12)){e.__cpSafe=[e.x,e.y];return false;}
  // Find the nearest valid point, rather than moving through a cliff or wall.
  const x=e.x,y=e.y;for(let d=4;d<=180;d+=4)for(let i=0;i<24;i++){const a=i*Math.PI/12,nx=x+Math.cos(a)*d,ny=y+Math.sin(a)*d;if(free(nx,ny,e.r||12)){e.x=nx;e.y=ny;e.__cpSafe=[nx,ny];return true;}}
  if(e.__cpSafe)[e.x,e.y]=e.__cpSafe;return true;});
 wrap(AI.Ground,'drawGround',()=>{});wrap(AI.Light,'drawAir',()=>{});wrap(AI.Light,'drawClock',()=>{});
 wrap(AI.Sky,'indoor',()=>!outside(R.Game.player?.x||0,R.Game.player?.y||0));
 for(const key of ['tick','thunder','rumble','mansion','musicBox'])wrap(AI.Ambience,key,function(orig,...a){if(outside(R.Game.player?.x||0,R.Game.player?.y||0))return orig.apply(this,a);});
 const view=()=>{const c=R.Camera;return [c.left()-64,c.top()-120,c.left()+c.w+64,c.top()+c.h+100];};
 function ellipse(ctx,x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 function polygon(ctx,points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
 const crystalAtlas=new Image();crystalAtlas.src='assets/env/cave-power-crystals.png';const crystalSprites=new Map();
 function crystalSprite(col){if(!crystalAtlas.complete||!crystalAtlas.naturalWidth)return null;let sprite=crystalSprites.get(col);if(sprite)return sprite;
  const c=document.createElement('canvas');c.width=68;c.height=84;const g=c.getContext('2d'),rgb=[1,3,5].map(i=>parseInt(col.slice(i,i+2),16)/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;let hue=0;if(d)hue=max===rgb[0]?((rgb[1]-rgb[2])/d)%6:max===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4;hue=(hue*60+360)%360;
  // Reuse the exact power-up crystal sprite; hue shifts preserve its pixel facets and stone base.
  g.filter=col==='#e7faff'?'saturate(.12) brightness(1.22)':`hue-rotate(${hue-225}deg) saturate(1.2)`;g.drawImage(crystalAtlas,68*2,0,68,84,0,0,68,84);crystalSprites.set(col,c);return c;
 }
 function crystal(ctx,c){const sprite=crystalSprite(c.col);if(!sprite)return;const height=c.size*(c.prismatic?1.7:1.3),width=height*68/84;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,Math.round(c.x-width/2),Math.round(c.y-height+height*.14),Math.round(width),Math.round(height));ctx.restore();}
 function waterPath(ctx){ctx.beginPath();for(const [x,y,rx,ry] of pools){const points=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,k=.91+hash(i+x,findings.seed+y)*.14;points.push([x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k]);}const last=points[23],first=points[0];ctx.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);for(let i=0;i<24;i++){const a=points[i],b=points[(i+1)%24];ctx.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}ctx.closePath();}for(const line of channels)for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len*23,ny=dx/len*23;ctx.moveTo(a[0]-nx,a[1]-ny);ctx.lineTo(b[0]-nx,b[1]-ny);ctx.lineTo(b[0]+nx,b[1]+ny);ctx.lineTo(a[0]+nx,a[1]+ny);ctx.closePath();ctx.moveTo(b[0]+23,b[1]);ctx.arc(b[0],b[1],23,0,Math.PI*2);}}
 function drawWater(ctx){const t=performance.now()/1000;ctx.save();waterPath(ctx);ctx.fillStyle='#101e2e';ctx.shadowColor='#020711';ctx.shadowBlur=6;ctx.fill();ctx.shadowBlur=0;waterPath(ctx);ctx.clip();
  for(const [x,y,rx,ry] of pools){const g=ctx.createRadialGradient(x,y,0,x,y,rx);g.addColorStop(0,'#050e1b');g.addColorStop(1,'#203e51');ctx.fillStyle=g;ctx.fillRect(x-rx,y-ry,rx*2,ry*2);}
  // Mirror the actual faceted formations, clipped to water, with gentle wave displacement.
  for(const c of crystals){if(!waterAt(c.x,c.y+30)&&!waterAt(c.x,c.y+80)&&!waterAt(c.x,c.y+140))continue;ctx.save();ctx.translate(c.x+Math.sin(t+c.x)*3,c.y+16);ctx.scale(1,-.5);ctx.globalAlpha=.38;crystal(ctx,{...c,x:0,y:0});ctx.restore();
   const g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,c.radius*.6);g.addColorStop(0,c.col+'30');g.addColorStop(1,c.col+'00');ctx.fillStyle=g;ctx.fillRect(c.x-c.radius,c.y-c.radius,c.radius*2,c.radius*2);}
  for(const [x,y,rx,ry] of pools)for(let i=0;i<14;i++){const yy=y-ry+i*ry/7+Math.sin(t*.6+i)*3;ctx.strokeStyle=i%3?'#7998ab24':'#11213366';ctx.lineWidth=i%3?1:3;ctx.beginPath();ctx.moveTo(x-rx,yy);ctx.bezierCurveTo(x-rx*.3,yy+3,x+rx*.3,yy-3,x+rx,yy);ctx.stroke();}
  for(const line of channels)for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];for(let j=0;j<5;j++){const u=(j/5+t*.08)%1,x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u;ctx.strokeStyle='#9dd5e533';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y-2);ctx.stroke();}}
  ctx.restore();
 }
 function temple(ctx,x,y,prism){
  ctx.save();ctx.translate(x,y);
  for(let i=3;i>=0;i--){ctx.fillStyle=i%2?'#6d7988':'#8895a3';ctx.fillRect(-170-i*12,-100-i*9,340+i*24,170+i*18);}
  ctx.strokeStyle='#303e50';ctx.lineWidth=2;for(let row=0;row<5;row++)for(let col=0;col<9;col++)ctx.strokeRect(-168+col*38+(row%2)*14,-100+row*34,38,34);
  if(prism){ellipse(ctx,0,-8,85,55,'#30475a');for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.strokeStyle=colors[i];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(Math.cos(a)*82,Math.sin(a)*52-12);ctx.stroke();}polygon(ctx,[[-42,-12],[0,-42],[42,-12],[0,18]],'#809bad','#c3e6ef');
  }else{ctx.fillStyle='#3a4451';ctx.fillRect(-85,-176,170,150);ctx.fillStyle='#101823';ctx.fillRect(-55,-140,110,114);ctx.strokeStyle='#9aa5a8';ctx.lineWidth=9;ctx.strokeRect(-86,-178,172,153);for(const [dx,dy] of [[-22,-111],[0,-111],[22,-111],[-22,-90],[22,-90],[0,-69],[0,-48]])ellipse(ctx,dx,dy,4,4,'#a49b63');
   for(let i=0;i<3;i++){const x=-120+i*120;ctx.fillStyle=['#8f8370','#8eb1c6','#89949c'][i];ctx.fillRect(x-19,28,38,63);ctx.fillStyle='#c5cbd0';ctx.fillRect(x-23,23,46,9);}}
  ctx.restore();
 }
 function drawDebris(ctx){for(const d of debris){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);
  if(d.kind==='rails'){for(let i=-4;i<=4;i++){ctx.fillStyle=i%3?'#51463f':'#655449';ctx.fillRect(-28,i*16,56,6);}ctx.strokeStyle='#6d7379';ctx.lineWidth=3;for(const x of [-17,17]){ctx.beginPath();ctx.moveTo(x,-70);ctx.lineTo(x,52);ctx.lineTo(x+(x<0?-6:8),69);ctx.stroke();}}
  else if(d.kind==='cart'){ellipse(ctx,0,12,34,13,'#11131c');ctx.fillStyle='#414751';ctx.fillRect(-29,-12,58,27);ctx.fillStyle='#6c5947';ctx.fillRect(-23,-8,46,17);ctx.strokeStyle='#92939a';ctx.lineWidth=3;ctx.strokeRect(-29,-12,58,27);for(const x of [-18,18]){ellipse(ctx,x,18,8,8,'#222630');ellipse(ctx,x,18,3,3,'#777a84');}ctx.fillStyle='#181e29';ctx.fillRect(5,-12,13,20);ctx.strokeStyle='#373b44';ctx.beginPath();ctx.moveTo(-26,-9);ctx.lineTo(20,15);ctx.stroke();}
  else if(d.kind==='fossil'){ctx.strokeStyle='#a49c87';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<65;i++){const a=i*.19,r=i*.4;const x=Math.cos(a)*r,y=Math.sin(a)*r*.7;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.lineWidth=1;for(let i=10;i<65;i+=5){const a=i*.19,r=i*.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*.7);ctx.lineTo(Math.cos(a)*(r+5),Math.sin(a)*(r+5)*.7);ctx.stroke();}}
  else{ctx.strokeStyle='#655545';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-32,16);ctx.lineTo(25,-18);ctx.moveTo(-25,-24);ctx.lineTo(31,20);ctx.stroke();}ctx.restore();}}
 const groundCache=new Map();let groundKey='';const CH=384;
 function noiseHash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(findings.seed|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
 function noise(x,y,scale){x/=scale;y/=scale;const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);const a=noiseHash(ix,iy)*(1-u)+noiseHash(ix+1,iy)*u,b=noiseHash(ix,iy+1)*(1-u)+noiseHash(ix+1,iy+1)*u;return a*(1-v)+b*v;}
 function groundChunk(cx,cy){const key=findings.seed+':'+zone;if(groundKey!==key){groundCache.clear();groundKey=key;}const id=cx+','+cy;if(groundCache.has(id))return groundCache.get(id);const c=document.createElement('canvas');c.width=c.height=CH/2;const g=c.getContext('2d'),data=g.createImageData(c.width,c.height),pixels=data.data,snow=outside();
  for(let py=0;py<c.height;py++)for(let px=0;px<c.width;px++){const x=cx*CH+px*2,y=cy*CH+py*2,walk=floor(x,y),broad=noise(x,y,190),mid=noise(x,y,43),grain=noiseHash(Math.floor(x),Math.floor(y)),warm=noise(x+1750,y-930,420),edge=walk&&(!floor(x+22,y)||!floor(x-22,y)||!floor(x,y-28)||!floor(x,y+20));let color;
   if(snow){const a=broad*18+mid*9+grain*6;color=walk?[194+a,210+a,222+a]:[54+a*.4,73+a*.4,91+a*.4];}
   else if(walk){const a=broad*25+mid*13+(grain-.5)*9,vein=Math.abs(noise(x*.8+y*.15,y,68)-.5)<.018?-8:0,shade=edge?.7:1;const dust=grain>.985?13:0;color=[(29+a+warm*7+vein+dust)*shade,(32+a+vein+dust)*shade,(42+a+warm*4+vein+dust)*shade];}
   else{const face=floor(x,y+48)||floor(x+26,y+32)||floor(x-26,y+32),a=broad*12+mid*9;const stratum=Math.sin(y*.065+noise(x,y,90)*8)>.6?4:0;color=face?[30+a+stratum,32+a+stratum,44+a+stratum]:[8+a*.4,10+a*.4,17+a*.4];}
   const i=(py*c.width+px)*4;pixels[i]=color[0];pixels[i+1]=color[1];pixels[i+2]=color[2];pixels[i+3]=255;
  }g.putImageData(data,0,0);groundCache.set(id,c);if(groundCache.size>100)groundCache.delete(groundCache.keys().next().value);return c;
 }
 function paintedGround(ctx){const [x0,y0,x1,y1]=view();ctx.save();ctx.imageSmoothingEnabled=false;for(let cy=Math.floor(y0/CH);cy<=Math.floor(y1/CH);cy++)for(let cx=Math.floor(x0/CH);cx<=Math.floor(x1/CH);cx++)ctx.drawImage(groundChunk(cx,cy),cx*CH,cy*CH,CH,CH);ctx.restore();}
 function drawDoors(ctx){const list=outside()?[{x:0,y:-3180}]:doors();for(const d of list){ctx.save();ctx.translate(d.x,d.y);ctx.fillStyle='#59616f';ctx.beginPath();ctx.moveTo(-58,24);ctx.lineTo(-54,-47);ctx.lineTo(-24,-80);ctx.lineTo(28,-77);ctx.lineTo(57,-43);ctx.lineTo(62,24);ctx.closePath();ctx.fill();ctx.fillStyle=outside()?'#030409':'#b3c8db';ctx.beginPath();ctx.ellipse(0,-17,35,49,0,Math.PI,Math.PI*2);ctx.lineTo(35,23);ctx.lineTo(-35,23);ctx.fill();ctx.fillStyle=outside()?'#182331':'#e1edf5';ctx.fillRect(-35,17,70,7);ctx.restore();}}
 function drawGround(ctx){const [x0,y0,x1,y1]=view();ctx.save();paintedGround(ctx);
  if(!outside()){drawWater(ctx);
  drawDebris(ctx);
  // Dry stepping stones make reserved crossings visible across the shallow channels.
  for(const [ai,bi] of links){const a=rooms[ai],b=rooms[bi],len=Math.hypot(a[0]-b[0],a[1]-b[1]);for(let d=0;d<len;d+=28){const x=a[0]+(b[0]-a[0])*d/len,y=a[1]+(b[1]-a[1])*d/len;if(waterAt(x,y))ellipse(ctx,x,y,17,11,'#58606b');}}
  for(let i=0;i<crystals.length;i+=5){const c=crystals[i];ctx.fillStyle='#968b95';ctx.fillRect(c.x+29,c.y-5,3,8);ellipse(ctx,c.x+30,c.y-7,7,4,'#ad8aa4');}
  if(findings.regigigas)temple(ctx,rooms[5][0],rooms[5][1],false);if(findings.terapagos)temple(ctx,rooms[6][0],rooms[6][1],true);
  for(const p of solidPillars()){ctx.fillStyle='#596577';ctx.fillRect(p[0]-p[2],p[1]-80,p[2]*2,85);ellipse(ctx,p[0],p[1]-80,p[2]+5,12,'#a5b2bf');}

  }
  drawDoors(ctx);
  // Mountain silhouettes and wind-cut rock teeth beyond the northern shelf.
  if(outside()&&y0<-3700){for(let i=-5;i<=5;i++){const x=i*440;ctx.fillStyle=i%2?'#688298':'#8099ad';ctx.beginPath();ctx.moveTo(x-280,-3900);ctx.lineTo(x,-4400-hash(i)*220);ctx.lineTo(x+340,-3900);ctx.fill();ctx.fillStyle='#e4f0f6';ctx.beginPath();ctx.moveTo(x-90,-4230);ctx.lineTo(x,-4400-hash(i)*220);ctx.lineTo(x+100,-4220);ctx.fill();}}
  ctx.restore();
 }
 wrap(R.World,'drawGround',(_,ctx)=>drawGround(ctx));
 const drawables=R.Training.drawables;R.Training.drawables=function(...a){const list=drawables.apply(this,a)||[];return active()&&!outside()?[...list,...crystals.filter(c=>R.Camera.sees(c.x,c.y,c.size*2)).map(c=>({y:c.y+c.solid*.3,draw:ctx=>crystal(ctx,c)}))]:list;};
 let mask=null,mg=null;
 function light(ctx,w,h){const cam=R.Camera;if(!mask){mask=document.createElement('canvas');mg=mask.getContext('2d');}const q=3,lw=Math.ceil(w/q),lh=Math.ceil(h/q);if(mask.width!==lw||mask.height!==lh){mask.width=lw;mask.height=lh;}
  mg.globalCompositeOperation='source-over';mg.fillStyle='#000000';mg.fillRect(0,0,lw,lh);
  // Exterior light stops at the cave threshold, independent of the camera/player position.
  const boundary=outside()?lh:0;mg.fillStyle='#f2f7ff';mg.fillRect(0,0,lw,Math.max(0,Math.min(lh,boundary)));
  mg.save();mg.beginPath();mg.rect(0,Math.max(0,boundary),lw,lh);mg.clip();mg.globalCompositeOperation='lighter';
  if(!outside())for(const c of crystals){const x=(c.x-cam.left())*cam.scale/q,y=(c.y-c.size*.4-cam.top())*cam.scale/q,r=c.radius*cam.scale/q;if(x+r<0||x-r>lw||y+r<0||y-r>lh)continue;const g=mg.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c.col);g.addColorStop(.28,c.col+'b0');g.addColorStop(1,c.col+'00');mg.fillStyle=g;mg.fillRect(x-r,y-r,r*2,r*2);}mg.restore();
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.imageSmoothingEnabled=true;ctx.drawImage(mask,0,0,w,h);ctx.restore();
  // Snow and drifting crystal dust are clipped to their respective environments.
  const time=(performance.now()/1000);ctx.save();ctx.beginPath();ctx.rect(0,0,w,Math.max(0,Math.min(h,boundary*q)));ctx.clip();ctx.fillStyle='#ffffffbb';for(let i=0;i<75;i++){const x=(hash(i)*w+Math.sin(time*.4+i)*24+time*12)%w,y=(hash(i,4)*h+time*(12+hash(i,2)*14))%h;ctx.fillRect(x,y,2,2);}ctx.restore();
  ctx.save();ctx.fillStyle='#d9eaff';if(!outside())for(const c of crystals){const x=(c.x+Math.sin(time*.3+c.x)*35-cam.left())*cam.scale,y=(c.y-40-(time*5+hash(c.x)*80)%90-cam.top())*cam.scale;if(x>0&&x<w&&y>0&&y<h){ctx.globalAlpha=.25;ctx.fillRect(x,y,1.5,1.5);}}ctx.restore();
 }
 wrap(R.Weather,'draw',(_,ctx,w,h)=>light(ctx,w,h));
 let transit=false,cooldown=0,returnTo=null,stashed=false;
 const fade=document.createElement('div');fade.style='position:fixed;inset:0;z-index:200;background:#000;opacity:0;pointer-events:none;transition:opacity .3s';document.body.append(fade);
 function travel(which){const p=R.Game.player;if(!active()||!p||transit||R.Coop?.active||window.PS_DENS?.raid||window.PS_DENS?.legend)return false;transit=true;fade.style.opacity='1';R.Game.soloHold?.(true);
  setTimeout(()=>{try{
   if(!outside()){returnTo=[which.x,which.y+100];R.EnemyMgr.stash();stashed=true;setZone('peak');p.x=0;p.y=-3300;}
   else{R.EnemyMgr.clear();setZone('cave');if(stashed)R.EnemyMgr.restore();stashed=false;[p.x,p.y]=returnTo||[0,0];}
   p.__cpSafe=[p.x,p.y];p._vx=p._vy=0;R.Projectiles.clear();R.Hazards.clear();R.Combat.clearFields?.();R.Camera.x=p.x;R.Camera.y=p.y;cooldown=performance.now()+1800;
  }finally{R.Game.soloHold?.(false);fade.style.opacity='0';transit=false;}},320);return true;
 }
 api.travel=travel;
 // Native attacks, fleeing and special spawns can move actors without World.collide.
 // Apply the same boundary to every active actor, including the player, after movement.
 setInterval(()=>{if(!active()||transit||R.Game.state!=='playing')return;const p=R.Game.player;if(!p)return;
  for(const e of [p,...R.EnemyMgr.all()]){if(!e||e.dead||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;if(!free(e.x,e.y,e.r||12))R.World.collide(e);if(!free(e.x,e.y,e.r||12)){const r=outside()?rooms[7]:rooms.reduce((a,b)=>Math.hypot(b[0]-e.x,b[1]-e.y)<Math.hypot(a[0]-e.x,a[1]-e.y)&&b!==rooms[7]?b:a,rooms[0]);e.x=r[0];e.y=r[1];e.__cpSafe=[e.x,e.y];}}
  if(performance.now()<cooldown)return;const d=outside()?{x:0,y:-3180}:doors().find(d=>Math.hypot(p.x-d.x,p.y-d.y)<42);if(d&&Math.hypot(p.x-d.x,p.y-d.y)<42)travel(d);
 },100);
 api.drawGround=drawGround;api.light=light;api.map=map;api.crystal=crystal;api.drawWater=drawWater;api.groundChunk=groundChunk;
 // Keep the native map selector; use a code-native banner for the new entry.
 const style=document.createElement('style');style.textContent='body.cp-selected #pp-banner{background-image:radial-gradient(ellipse at 25% 75%,#62e7ff77,transparent 28%),radial-gradient(ellipse at 75% 50%,#c383ff66,transparent 30%),linear-gradient(160deg,#07101b 60%,#d6eaf4 61%,#94b5ce)!important}body.cp-selected #pp-banner .pp-bgs{opacity:0}';document.head.append(style);
 let last='';const label=document.createElement('div');label.style='position:fixed;left:50%;top:118px;transform:translateX(-50%);pointer-events:none;z-index:24;color:#d2f3ff;text-shadow:0 2px 5px #000;font:600 12px system-ui;letter-spacing:1px;opacity:.8';document.body.append(label);
 setInterval(()=>{document.body.classList.toggle('cp-selected',R.Maps.selected()===2);const p=R.Game.player;label.textContent=active()&&R.Game.state==='playing'&&p?region(p.x,p.y):'';if(label.textContent!==last){last=label.textContent;label.animate?.([{opacity:0},{opacity:.85}],{duration:1000,fill:'forwards'});}},700);
})();
