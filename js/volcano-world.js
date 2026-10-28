/* Act 4 — Cinderwake Caldera. Original seeded terrain and scenery; friend AI stays in control. */
(function install() {
 'use strict';
 const R=window.__PSX_REG__,A=window.PSXAI,TAU=Math.PI*2,CELL=1536,CH=512,Q=4;
 if(!R?.World||!A)return;
 const target=R.Maps.LIST.find(m=>m.psLevel===4)||R.Maps.LIST.find(m=>m.n===5);
 if(!target){setTimeout(install,50);return;}
 if(window.PS_VOLCANO)return;
 Object.assign(target,{name:'Cinderwake Caldera',diff:'Caldera',biome:2,crystalPeak:false,volcano:true,types:['fire','rock','ground','flying','steel','dark','poison'],col:'#f58c4c'});
 const active=()=>!!(R.Maps.cur?.volcano&&!R.Maps.endless&&!R.Rift?.inArena&&!window.PS_SAFEZONE?.active&&!A.Mansion?.inside);
 let seed=1,lastPlayer=null,lastStep=null,stepSide=1,bannerUrl=null;const prints=[];const regions=new Map(),propCache=new Map(),chunks=new Map(),bumps=new Map(),discovered=new Set();
 const hash=(x,y=0,s=seed)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const ROPE_HALF=30;let reserveFn=null;const ropeCache=new Map();
 function noise(x,y,s=seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return lerp(lerp(hash(ix,iy,s),hash(ix+1,iy,s),u),lerp(hash(ix,iy+1,s),hash(ix+1,iy+1,s),u),v);}
 const fbm=(x,y)=>noise(x,y)*.65+noise(x*2.03,y*2.03,seed+19)*.25+noise(x*4.07,y*4.07,seed+41)*.1;
 function put(cache,key,value,cap){cache.set(key,value);if(cache.size>cap)cache.delete(cache.keys().next().value);return value;}
 function reset(s){seed=Number(s)||1;bannerUrl=null;regions.clear();ropeCache.clear();lmCache&&lmCache.clear();propCache.clear();chunks.clear();bumps.clear();discovered.clear();prints.length=0;lastStep=null;lastPlayer=null;}
 function region(cx,cy){const key=cx+','+cy;if(regions.has(key))return regions.get(key);const x=cx*CELL,y=cy*CELL,h=hash(cx,cy,seed+501),crater={x:x+480+hash(cx,cy,seed+502)*220,y:y+370+hash(cx,cy,seed+503)*100,rx:140+h*65,ry:100+h*40},basin={x:x+720+hash(cx,cy,seed+504)*230,y:y+1120,rx:290+h*90,ry:180+h*60};
  const hero=cx===0&&cy===0||h>.84?{id:'cone'+key,x:crater.x-155,y:crater.y-30,kind:21,scale:1,h}:null;
  const pts=[];for(let i=0;i<=9;i++){const t=i/9;pts.push([lerp(crater.x,basin.x,t)+Math.sin(t*TAU+h*5)*105*Math.sin(t*Math.PI),lerp(crater.y,basin.y,t)]);}
  const branches=[-1,1].map(side=>{const a=pts[4],end=[basin.x+side*basin.rx*.5,basin.y+side*25];return [a,[a[0]+side*110,a[1]+120],[end[0]+side*35,end[1]-110],end];});
  return put(regions,key,{cx,cy,x,y,h,crater,basin,pts,branches,shape:Math.floor(hash(cx,cy,seed+505)*4),hero,live:h>.15||cx===0&&cy===0,camp:{x:x+180,y:y+190},grove:h<.55},96);
 }
 function segment(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1));return {d:Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy),t};}
 const ellipse=(x,y,p)=>Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry);
 function route(x,y){const cx=Math.round(x/CELL),cy=Math.round(y/CELL);return Math.min(Math.abs(x-cx*CELL-Math.sin(y/370)*42),Math.abs(y-cy*CELL-Math.sin(x/430)*42));}
 function sample(x,y){const p=region(Math.floor(x/CELL),Math.floor(y/CELL));let d=999,flow=0;
  if(p.live){const wobble=(noise(x/95,y/95,seed+73)-.5)*.23,bx=(x-p.basin.x)/p.basin.rx,by=(y-p.basin.y)/p.basin.ry,ang=Math.atan2(by,bx),rim=1+.18*Math.sin(ang*3+p.h*9)+.09*Math.sin(ang*5+p.h*4);let basinD=(Math.hypot(bx,by)-rim-wobble)*120;
   if(p.shape===1||p.shape===2){const side=p.shape===1?-1:1,notch=Math.hypot((x-(p.basin.x+side*p.basin.rx*.9))/(p.basin.rx*.62),(y-(p.basin.y+p.basin.ry*.08))/(p.basin.ry*.52));basinD=Math.max(basinD,(1-notch)*85);}
   d=Math.min((ellipse(x,y,p.crater)-1-wobble-.08*Math.sin(Math.atan2(y-p.crater.y,x-p.crater.x)*3+p.h))*105,basinD);
   for(const path of [p.pts,...p.branches])for(let i=0;i<path.length-1;i++){const s=segment(x,y,path[i],path[i+1]);const w=path===p.pts?36+Math.sin((i+s.t)/9*Math.PI)*19:25+Math.sin((i+s.t)/3*Math.PI)*12;if(s.d-w<d){d=s.d-w;flow=(i+s.t)/(path.length-1);}}
  }
  // A broad cooled causeway is reserved before rocks/vegetation, connecting both banks.
  const bridge=p.live&&Math.abs(y-(p.y+850+Math.sin(x/180)*13))<(27+Math.sin(x/80)*4);
  // [Gard v92] where a road meets lava it crosses on a rope bridge (30 px either side of the road), instead of a
  // 136 px wide strip of plain ash cutting through the lava
  const rd=route(x,y),crossing=rd<ROPE_HALF,protectedRoute=crossing||Math.hypot(x,y)<190;
  let lava=d<0&&!bridge&&!protectedRoute;
  const rv=reserveFn&&reserveFn(x,y);if(rv&&rv.lava!=null)lava=rv.lava;
  const bank=d<27&&!lava,rope=!lava&&!(rv&&rv.lava===false)&&d<6&&(bridge||crossing&&Math.hypot(x,y)>=190);
  return {lava,bank,d,bridge:bridge&&d<45,rope,flow,p,rv};
 }
 const dry=(x,y,r=0)=>![[0,0],[-r,0],[r,0],[0,-r],[0,r],[-r,-r],[r,r]].some(([dx,dy])=>sample(x+dx,y+dy).lava);
 const ART=[
  {rect:[26,16,344,410],w:148,rx:17,ry:12}, {rect:[403,89,314,326],w:136,rx:38,ry:19},
  {rect:[762,200,295,214],w:104,rx:33,ry:17}, {rect:[1119,237,310,184],w:88,rx:25,ry:13},
  {rect:[19,433,370,307],w:188,rx:57,ry:23}, {rect:[407,553,317,184],w:104,rx:36,ry:11},
  {rect:[774,508,282,225],w:36,rx:0,ry:0}, {rect:[1113,517,317,222],w:44,rx:0,ry:0},
  {rect:[33,752,302,308],w:90,rx:26,ry:14}, {rect:[370,762,354,293],w:168,rx:0,ry:0},
  {rect:[748,822,297,239],w:48,rx:0,ry:0}, {rect:[1073,787,356,268],w:76,rx:23,ry:14},
  {rect:[1119,237,310,184],w:176,rx:49,ry:25}
 ];
 ART.push(...[{"rect":[64,76,308,513],"w":136,"rx":19,"ry":13,"atlas":1},{"rect":[395,99,364,483],"w":156,"rx":25,"ry":15,"atlas":1},{"rect":[759,150,381,441],"w":156,"rx":23,"ry":14,"atlas":1},{"rect":[1140,155,370,440],"w":142,"rx":23,"ry":13,"atlas":1},{"rect":[7,713,374,262],"w":104,"rx":34,"ry":18,"atlas":1},{"rect":[392,617,361,356],"w":142,"rx":40,"ry":20,"atlas":1},{"rect":[761,642,369,333],"w":124,"rx":39,"ry":21,"atlas":1},{"rect":[1137,718,395,257],"w":182,"rx":56,"ry":23,"atlas":1}]);
 const isTree=k=>k===0||k>=13&&k<=16;
 const atlas=new Image();atlas.src='assets/env/volcano-scenery-v91.png';
 const variants=new Image();variants.src='assets/env/volcano-variants-v91.png';const landmarks=new Image();landmarks.src='assets/env/volcano-landmarks-v91.png';const atlases=[atlas,variants,landmarks];
 ART.push(...[{"rect":[16,86,988,669],"w":440,"rx":185,"ry":60,"atlas":2},{"rect":[1014,260,950,495],"w":260,"rx":78,"ry":28,"atlas":2}]);
 /* [Gard v92] More life, less sameness: every region of the caldera has its own character, so walking on you keep
  * finding new ground instead of the same mix of rocks and trees. Ash Woodland (the original mix), Obsidian Fields
  * (black glass crystals), Sulfur Flats (yellow fumaroles and steam), Basalt Steps (column clusters and ledges),
  * Fossil Badlands (fossil stones and slabs) and Ember Grove (red ferns and fruiting ash trees). Each has its own
  * ground tint, its own name when you walk in, and sometimes a landmark worth finding (with a reward the first time). */
 const THEMES=[{n:'Ash Woodland'},{n:'Obsidian Fields',tint:[-9,-9,-2],k:[8,8,8,2,4,19]},{n:'Sulfur Flats',tint:[10,7,-6],k:[3,12,3,2,17]},{n:'Basalt Steps',tint:[-4,-4,-2],k:[1,18,20,1,18,4]},{n:'Fossil Badlands',tint:[9,4,-2],k:[19,20,17,19,4,2]},{n:'Ember Grove',tint:[10,-2,-4],k:[7,15,7,0,13,15]}];
 const theme=(cx,cy)=>cx===0&&cy===0||cx===-1&&cy===-1?0:Math.floor(hash(cx,cy,seed+880)*THEMES.length);
 const lmCache=new Map();
 function landmarkOf(cx,cy){const key=cx+','+cy+','+seed;if(lmCache.has(key))return lmCache.get(key);const v=findLandmark(cx,cy);put(lmCache,key,v,256);return v;}
 function findLandmark(cx,cy){const t=theme(cx,cy);if(!t||hash(cx,cy,seed+881)>.55)return null;let x=0,y=0,ok=false;
  for(let k=0;k<8&&!ok;k++){x=cx*CELL+330+hash(cx,cy,seed+882+k*7)*880;y=cy*CELL+300+hash(cx,cy,seed+883+k*7)*930;ok=dry(x,y,150)&&dry(x+150,y,40)&&dry(x-150,y,40)&&route(x,y)>200&&Math.hypot(x,y)>600&&!(reserveFn&&(reserveFn(x,y)||reserveFn(x+150,y)||reserveFn(x-150,y)));}
  if(!ok)return null;
  const L={x,y,t,id:'lm'+cx+','+cy,parts:[]},P=(dx,dy,kind,scale)=>L.parts.push({id:L.id+':'+L.parts.length,x:x+dx,y:y+dy,kind,scale,h:hash(L.parts.length,cx,seed+cy)});
  if(t===1){L.name='Obsidian Henge';L.say='A ring of black glass hums with heat. Something was left at its heart.';for(let i=0;i<6;i++){const a=i/6*TAU+.3;P(Math.cos(a)*150,Math.sin(a)*96,8,.72+(i%2)*.12);}}
  else if(t===2){L.name='Sulfur Springs';L.say='Steam hisses from the springs. The yellow crust here is warm and soft.';P(-110,-20,3,1.05);P(95,-35,12,.95);P(10,60,3,.8);P(-30,-95,12,.7);}
  else if(t===3){L.name='Basalt Throne';L.say='Columns of basalt rise in a circle around a flat stone seat.';for(let i=0;i<5;i++){const a=i/5*TAU-1.57+(i>2?.35:0);P(Math.cos(a)*145,Math.sin(a)*92,i%2?18:1,.85);}P(0,10,20,.8);}
  else if(t===4){L.name='Fossil Dig';L.say='An old dig site: spades, packs and a fossil half out of the rock.';P(-60,0,19,1.1);P(80,-30,11,.9);P(60,70,20,.8);P(-130,85,4,.8);}
  else if(t===5){L.name='Ember Shrine';L.say='A campfire burns in a ring of fruiting trees. Someone tends it still.';P(0,10,10,1);for(let i=0;i<5;i++){const a=i/5*TAU+.6;P(Math.cos(a)*165,Math.sin(a)*105,i%2?15:7,i%2?.8:1);}}
  return L;}
 function props(cx,cy){const key=cx+','+cy;if(propCache.has(key))return propCache.get(key);const out=[],pit={id:'pit'+key,x:cx*CELL+310+hash(cx,cy,seed+992)*45,y:cy*CELL+650,kind:12,scale:1,h:hash(cx,cy,seed+993)};const hasPit=(cx===0&&cy===0||hash(cx,cy,seed+994)<.74)&&dry(pit.x,pit.y,135)&&route(pit.x,pit.y)>140&&!(reserveFn&&reserveFn(pit.x,pit.y)?.clear);
  const TH=THEMES[theme(cx,cy)],LM=landmarkOf(cx,cy);if(LM)out.push(...LM.parts);
  for(let gy=0;gy<10;gy++)for(let gx=0;gx<10;gx++){const ix=cx*10+gx,iy=cy*10+gy,h=hash(ix,iy,seed+208),x=cx*CELL+(gx+.3+hash(ix,iy,seed+209)*.4)*CELL/10,y=cy*CELL+(gy+.3+hash(ix,iy,seed+210)*.4)*CELL/10,s=sample(x,y);
   if(region(cx,cy).hero&&Math.abs(x-region(cx,cy).hero.x)<255&&y>region(cx,cy).hero.y-260&&y<region(cx,cy).hero.y+65)continue;
   if(route(x,y)<78||Math.hypot(x,y)<210||!dry(x,y,88)||s.bridge||s.rv&&s.rv.clear||hasPit&&Math.hypot(x-pit.x,y-pit.y)<175)continue;
   const grove=s.d>170&&fbm(x/630,y/630)>(theme(cx,cy)===5?.38:.50),bank=s.d<155;
   if(!grove&&!bank&&h>.38)continue;
   let kind=grove?(h<.67?0:h<.8?5:2):bank?(h<.32?1:h<.64?2:h<.83?4:8):(h<.16?3:h<.27?2:5);
   if(kind===0){const choices=region(cx,cy).grove?[0,13,14,15,16]:[0,13,14,16];kind=choices[Math.floor(hash(ix,iy,seed+213)*choices.length)];}else if(kind===1&&hash(ix,iy,seed+214)<.5)kind=18;else if(kind===2&&hash(ix,iy,seed+215)<.5)kind=17;else if(kind===4){const r=hash(ix,iy,seed+216);kind=r<.25?22:r<.62?20:4;}else if(kind===8&&hash(ix,iy,seed+217)<.3)kind=19;
   if(TH.k&&hash(ix,iy,seed+218)<.55)kind=TH.k[Math.floor(hash(ix,iy,seed+219)*TH.k.length)];
   if(LM&&Math.hypot(x-LM.x,(y-LM.y)*1.3)<260)continue;
   if(h>.97)continue;const scale=.8+hash(ix,iy,seed+211)*.35;if(route(x,y)<Math.max(78,ART[kind].rx*scale+28))continue;
   if(out.some(d=>Math.hypot(d.x-x,(d.y-y)*1.3)<(ART[d.kind].rx*d.scale+ART[kind].rx*scale)+24))continue;
   out.push({id:'p'+ix+','+iy,x,y,kind,scale,h});
  }
  // Walk-through ruins and small, quiet miner camps are landmarks rather than blocked roads.
  const p=region(cx,cy),site={x:p.x+180,y:p.y+190};
  if(p.h<.45&&dry(site.x,site.y,130)&&Math.hypot(site.x,site.y)>280&&!(reserveFn&&reserveFn(site.x,site.y)?.clear)&&!(LM&&Math.hypot(site.x-LM.x,site.y-LM.y)<420)){out.push({id:'arch'+key,x:site.x,y:site.y,kind:9,scale:1,h:p.h});out.push({id:'fire'+key,x:site.x+85,y:site.y+70,kind:10,scale:1,h:p.h});out.push({id:'packs'+key,x:site.x+120,y:site.y+30,kind:11,scale:1,h:p.h});}
  if(region(cx,cy).hero&&!(reserveFn&&reserveFn(region(cx,cy).hero.x,region(cx,cy).hero.y)?.clear))out.push(region(cx,cy).hero);
  if(hasPit)out.push(pit);
  if(cx===-1&&cy===-1)out.push({id:'start-packs',x:-175,y:-120,kind:11,scale:1,h:.2},{id:'start-fire',x:-105,y:-165,kind:10,scale:1,h:.4},{id:'start-log',x:-255,y:-160,kind:5,scale:.9,h:.3});
  return put(propCache,key,out,64);
 }
 function near(x,y,r=900){const out=[];for(let cy=Math.floor((y-r)/CELL);cy<=Math.floor((y+r)/CELL);cy++)for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++)for(const d of props(cx,cy))if(Math.abs(d.x-x)<r+200&&Math.abs(d.y-y)<r+240)out.push(d);return out;}
 function boxes(d){const a=ART[d.kind];if(d.kind===21)return [{x:d.x,y:d.y-30,rx:170,ry:32},{x:d.x-12,y:d.y-94,rx:137,ry:34},{x:d.x-42,y:d.y-156,rx:85,ry:34}];if(d.kind===9)return [-1,1].map(s=>({x:d.x+s*56,y:d.y-8,rx:13,ry:17}));return a.rx?[{x:d.x,y:d.y-3,rx:a.rx*d.scale,ry:a.ry*d.scale}]:[];}
 const touches=(b,x,y,r=0)=>Math.abs(x-b.x)<b.rx+r&&Math.abs(y-b.y)<b.ry+r;
 // [Gard v92] reserved ground (Groudon's mountain, js/groudon-den.js) can be solid too
 const resSolid=(x,y,r)=>!!reserveFn&&[[0,0],[-r,0],[r,0],[0,-r],[0,r]].some(([dx,dy])=>reserveFn(x+dx,y+dy)?.solid);
 const blocked=(x,y,r=0)=>resSolid(x,y,r)||near(x,y,120).some(d=>boxes(d).some(b=>touches(b,x,y,r)));
 function free(x,y,r=0,wet=false){return (wet||dry(x,y,r))&&!blocked(x,y,r);}
 function repair(e){if(!e)return false;const flying=window.PS_LEGEND_FLIGHT?.active(e),wet=e===R.Game.player||e.flying||(e.types||e.mon?.types||[]).includes('fire');
  const ok=(x,y)=>flying||free(x,y,Math.min(28,e.r||12),wet),old=e.__volcanoSafe,x=e.x,y=e.y;
  if(old&&Math.hypot(x-old[0],y-old[1])<180){const n=Math.max(1,Math.ceil(Math.hypot(x-old[0],y-old[1])/3));let sx=old[0],sy=old[1];for(let i=1;i<=n;i++){const nx=lerp(old[0],x,i/n),ny=lerp(old[1],y,i/n);if(!ok(nx,ny)){e.x=sx;e.y=sy;for(const d of near(nx,ny,90))if(isTree(d.kind)&&boxes(d).some(b=>touches(b,nx,ny,e.r||12)))bumps.set(d.id,{at:Number(R.Game.time)||0,dir:x>=old[0]?1:-1});e.__volcanoSafe=[sx,sy];return true;}sx=nx;sy=ny;}}
  if(ok(x,y)){e.__volcanoSafe=[x,y];return false;}
  for(let d=3;d<180;d+=5)for(let i=0;i<24;i++){const nx=x+Math.cos(i*TAU/24)*d,ny=y+Math.sin(i*TAU/24)*d;if(ok(nx,ny)){e.x=nx;e.y=ny;e.__volcanoSafe=[nx,ny];return true;}}
  if(old)[e.x,e.y]=old;return true;
 }
 function bounds(){const c=R.Camera;return [c.left()-100,c.top()-130,c.left()+c.w+100,c.top()+c.h+170];}
 function terrain(cx,cy){const key=cx+','+cy;if(chunks.has(key))return chunks.get(key);const cv=document.createElement('canvas');cv.width=cv.height=CH/Q;const g=cv.getContext('2d'),im=g.createImageData(CH/Q,CH/Q),data=im.data;
  for(let j=0;j<CH/Q;j++)for(let i=0;i<CH/Q;i++){const x=cx*CH+i*Q,y=cy*CH+j*Q,s=sample(x,y),n=fbm(x/170,y/170),grain=hash(Math.floor(x/4),Math.floor(y/4),seed+907),k=(j*CH/Q+i)*4;let c;
   if(s.lava||s.rope&&s.d<0){const heat=clamp(-s.d/55);c=[193+heat*43+grain*9,43+heat*50+grain*6,20+heat*12];const vein=Math.sin(x*.044+y*.023+noise(x/66,y/66,seed+9)*8);if(vein>.76)c=[255,130+heat*50,47];}
   else if(s.bridge)c=[43+n*19+grain*6,37+n*18+grain*5,39+n*19+grain*5];
   else if(s.bank)c=[50+grain*15,36+grain*10,36+grain*10];
   else{const ash=noise(x/230,y/230,seed+32),path=1-clamp(route(x,y)/85),base=43+ash*17+path*5;c=[base+n*16+grain*6,base-10+n*14+grain*5,base-6+n*15+grain*5];const cover=noise(x/165,y/165,seed+761),tone=noise(x/310,y/310,seed+762),mix=clamp((cover-.42)*2.2);if(route(x,y)>32&&s.d>30){if(tone>.57){c[0]+=mix*9;c[1]-=mix*3;}else if(tone<.34)c=c.map(v=>v-mix*7);else c=c.map(v=>v+mix*3);}if(grain>.94)c=c.map(v=>v+10);const tt=THEMES[theme(Math.floor(x/CELL),Math.floor(y/CELL))].tint;if(tt){const fade=clamp(Math.min(x-Math.floor(x/CELL)*CELL,(Math.floor(x/CELL)+1)*CELL-x,y-Math.floor(y/CELL)*CELL,(Math.floor(y/CELL)+1)*CELL-y)/260);c=[c[0]+tt[0]*fade,c[1]+tt[1]*fade,c[2]+tt[2]*fade];if(theme(Math.floor(x/CELL),Math.floor(y/CELL))===2&&noise(x/90,y/90,seed+884)>.68&&route(x,y)>40)c=[c[0]+38*fade,c[1]+30*fade,c[2]-4];if(theme(Math.floor(x/CELL),Math.floor(y/CELL))===1&&grain>.985)c=[120,110,150];}}
   data[k]=c[0];data[k+1]=c[1];data[k+2]=c[2];data[k+3]=255;
  }g.putImageData(im,0,0);return put(chunks,key,cv,40);
 }
 /* [Gard v92] Rope bridges: wooden planks lashed between rope rails and posts, wherever a road or the cooled causeway
  * crosses lava (they used to be a plain strip of dark ground across the lava). Built once per crossing, in pixel art. */
 function ropeRuns(cx,cy){const key=cx+','+cy;if(ropeCache.has(key))return ropeCache.get(key);const p=region(cx,cy),out=[];
  const scan=(dir,a,b,line,half,amp)=>{let st=null;for(let u=a;u<=b;u+=4){const v=line(u),x=dir==='h'?u:v,y=dir==='h'?v:u,q=sample(x,y),on=q.rope&&q.d<0;if(on&&st===null)st=u;if((!on||u+4>b)&&st!==null){if(u-st>24)out.push({dir,a:st-18,b:u+18,line,half,amp});st=null;}}};
  if(p.live)scan('h',p.x,p.x+CELL,x=>p.y+850+Math.sin(x/180)*13,27,13);
  scan('h',p.x,p.x+CELL,x=>cy*CELL+Math.sin(x/430)*42,ROPE_HALF,42);
  scan('v',p.y,p.y+CELL,y=>cx*CELL+Math.sin(y/370)*42,ROPE_HALF,42);
  return put(ropeCache,key,out,96);}
 function ropeCanvas(r){if(r.cv)return r.cv;const L=r.b-r.a,W=r.half*2+20,Hs=Math.ceil(r.amp*2+W),cv=document.createElement('canvas');
  const horiz=r.dir==='h';cv.width=Math.ceil((horiz?L:Hs)/2);cv.height=Math.ceil((horiz?Hs:L)/2);const g=cv.getContext('2d');
  const base=horiz?r.line(r.a)-r.amp-W/2:r.line(r.a)-r.amp-W/2;r.off=horiz?(r.line(0)*0, (r.line(r.a+L/2)-r.line(r.a+L/2))):0;
  // origin of the canvas in world space: along = r.a, across = (line min) - W/2
  let mn=1e9;for(let u=r.a;u<=r.b;u+=4)mn=Math.min(mn,r.line(u));r.o0=mn-W/2-4;
  const P=(along,across,w,h,c)=>{g.fillStyle=c;if(horiz)g.fillRect(along,across,w,h);else g.fillRect(across,along,h,w);};
  const hh=r.half/2|0,n=Math.ceil(L/2);
  for(let i=0;i<n;i++){const u=r.a+i*2,c=Math.round((r.line(u)-r.o0)/2),plank=Math.floor(i/4),gap=i%4===3,h=hash(plank,r.a|0,seed+77);
   const top=c-hh+(h>.85?1:0),bot=c+hh-(h<.15?1:0);
   // the planks (dark gaps between boards), worn lighter in the middle where feet go
   for(let k=top;k<=bot;k++){const mid=Math.abs(k-c)<hh*.45;let col=gap?'#2e1d12':(plank%2?'#6e4a2a':'#7b5531');if(!gap&&mid&&h>.4)col=plank%2?'#7d5734':'#8a6239';if(!gap&&(k===top||k===bot))col='#4a3019';P(i,k,1,1,col);}
   if(!gap&&i%4===1){P(i,top+1,1,1,'#3a2614');P(i,bot-1,1,1,'#3a2614');}
   // rope rails along both edges, sagging between posts
   const ph=(i%24)/24,sag=Math.round(Math.sin(ph*Math.PI)*2);for(const side of [-1,1]){const ry=side<0?top-3+sag:bot+3-sag;P(i,ry,1,1,'#d8b47a');P(i,ry+1,1,1,'#8a6a3d');
    // criss-cross lashings to the deck (the "V" ropes)
    const v=i%24,vy=side<0?top-1:bot+1;if(v===6||v===18){P(i,vy,1,1,'#c9a46a');}if(v===5||v===7||v===17||v===19)P(i,side<0?top-2+sag:bot+2-sag,1,1,'#b08b55');}
   // posts every 48 px, and heavier ones at both ends
   if(i%24===0||i===n-1){const big=i===0||i===n-1;for(const side of [-1,1]){const py=side<0?top-6:bot+1;for(let k=0;k<6;k++){P(i,py+k,1,1,k===0?'#b88b57':'#4a2f18');P(i+1,py+k,1,1,k===0?'#9c7246':'#3a2412');if(big)P(i+2,py+k,1,1,k===0?'#9c7246':'#2e1c0e');}}}
  }
  r.cv=cv;return cv;}
 function drawRopes(ctx,x0,y0,x1,y1){for(let cy=Math.floor(y0/CELL)-1;cy<=Math.floor(y1/CELL);cy++)for(let cx=Math.floor(x0/CELL)-1;cx<=Math.floor(x1/CELL);cx++)for(const r of ropeRuns(cx,cy)){
   const cv=ropeCanvas(r);if(r.dir==='h'){if(r.b<x0||r.a>x1||r.o0>y1||r.o0+cv.height*2<y0)continue;ctx.drawImage(cv,Math.round(r.a),Math.round(r.o0),cv.width*2,cv.height*2);}
   else{if(r.b<y0||r.a>y1||r.o0>x1||r.o0+cv.width*2<x0)continue;ctx.drawImage(cv,Math.round(r.o0),Math.round(r.a),cv.width*2,cv.height*2);}}}
 function drawGround(ctx){const [x0,y0,x1,y1]=bounds();ctx.save();ctx.imageSmoothingEnabled=false;for(let cy=Math.floor(y0/CH);cy<=Math.floor(y1/CH);cy++)for(let cx=Math.floor(x0/CH);cx<=Math.floor(x1/CH);cx++)ctx.drawImage(terrain(cx,cy),cx*CH,cy*CH,CH,CH);
  const t=Number(R.Game.time)||0;
  // Hot ribbons advect from each crater down its actual channel into the receiving basin.
  for(let cy=Math.floor(y0/CELL);cy<=Math.floor(y1/CELL);cy++)for(let cx=Math.floor(x0/CELL);cx<=Math.floor(x1/CELL);cx++){const p=region(cx,cy);if(!p.live)continue;
   for(const path of [p.pts,...p.branches])for(let i=0;i<55;i++){const u=((t*.035+i/55+p.h)%1)*(path.length-1),k=Math.floor(u),f=u-k,a=path[k],b=path[Math.min(path.length-1,k+1)],x=lerp(a[0],b[0],f)+Math.sin(i*19.1)*22,y=lerp(a[1],b[1],f);if(x<x0||x>x1||y<y0||y>y1||!sample(x,y).lava)continue;ctx.fillStyle=i%3?'#ffb54d':'#f46b32';ctx.globalAlpha=.4+.35*Math.sin(Math.PI*f);ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,8+i%3*3,2+i%2*2);}
   ctx.globalAlpha=1;
   for(const b of [p.crater,p.basin])for(let i=0;i<22;i++){const a=i*2.3999,r=(.2+hash(i,cx,seed+cy)*.7),x=b.x+Math.cos(a)*b.rx*r,y=b.y+Math.sin(a)*b.ry*r;if(!sample(x,y).lava)continue;if(![[12,0],[-12,0],[0,12],[0,-12]].every(([dx,dy])=>sample(x+dx,y+dy).lava))continue;const age=(t*(.32+hash(i,0,seed)*.15)+i*.37)%1;
    if(age<.56){const r=2+Math.sin(age/.56*Math.PI/2)*6;ctx.globalAlpha=.75;ctx.fillStyle='#ac371e';ctx.beginPath();ctx.ellipse(x,y+1,r+2,r*.7+1,0,0,TAU);ctx.fill();ctx.fillStyle='#ffbc50';ctx.beginPath();ctx.ellipse(x,y,r,r*.75,0,0,TAU);ctx.fill();ctx.fillStyle='#ffe7a0';ctx.fillRect(Math.round(x-r*.4),Math.round(y-r*.4),3,2);}
    else{const u=(age-.56)/.44;ctx.globalAlpha=(1-u)*.7;ctx.strokeStyle='#ffd777';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,5+u*16,3+u*8,0,0,TAU);ctx.stroke();for(let k=0;k<4;k++){const a=k*Math.PI/2+i,rr=4+u*20;ctx.fillStyle=k%2?'#ffb240':'#ffe7a0';ctx.fillRect(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.5-Math.sin(u*Math.PI)*12,2,3);}}
}
  }
  ctx.globalAlpha=1;
  drawRopes(ctx,x0,y0,x1,y1);
  for(const p of prints){const age=t-p.t;if(age>40)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=(1-age/40)*.35;ctx.fillStyle='#b7a294';ctx.fillRect(p.side*4-2,-3,3,5);ctx.restore();}
  // Fine, wind-tossed ash grass lives on cool ground; transparent sprites never cover lava banks.
  for(let gy=Math.floor(y0/88);gy<=Math.floor(y1/88);gy++)for(let gx=Math.floor(x0/88);gx<=Math.floor(x1/88);gx++){const h=hash(gx,gy,seed+609);if(h>.46)continue;const x=gx*88+h*42,y=gy*88+hash(gx,gy,seed+610)*50;if(route(x,y)<36||!dry(x,y,28)||blocked(x,y,12))continue;drawSprite(ctx,{x,y,kind:h>.36?7:6,scale:.65+h*.65,h},true);}
  ctx.restore();
 }
 function drawSprite(ctx,d,ground=false){const a=ART[d.kind],image=atlases[a.atlas||0];if(!image.complete||!image.naturalWidth)return;const [sx,sy,sw,sh]=a.rect,w=a.w*d.scale,h=w*sh/sw,t=Number(R.Game.time)||0,b=bumps.get(d.id),age=b?t-b.at:99;
  const sway=isTree(d.kind)?Math.sin(t*1.4+d.h*9)*.018+(age<.7?Math.sin(age*32)*Math.exp(-age*5)*.1*b.dir:0):d.kind===6||d.kind===7?Math.sin(t*2+d.x*.01)*.07:0;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(d.x),Math.round(d.y));if(!ground){ctx.fillStyle='rgba(15,10,17,.3)';ctx.beginPath();ctx.ellipse(0,-5,Math.max(9,(a.rx||w*.24)*d.scale*.95),Math.max(2,(a.ry||6)*d.scale*.25),0,0,TAU);ctx.fill();}const player=R.Game.player;if(d.kind!==21&&!ground&&player&&Math.abs(player.x-d.x)<w*.38&&player.y<d.y-9&&player.y>d.y-h*.88)ctx.globalAlpha=.55;ctx.transform(1,0,sway,1,0,0);ctx.drawImage(image,sx,sy,sw,sh,-w/2,-h,w,h);
  if(d.kind===3){const phase=(t+d.h*12)%14,hot=phase>8&&phase<10;for(let i=0;i<6;i++){const u=(t*.28+i/6+d.h)%1;ctx.globalAlpha=(1-u)*(hot?.32:.15);ctx.fillStyle=hot?'#ddc1a3':'#a5a2a4';ctx.beginPath();ctx.ellipse(Math.sin(u*4+d.h)*8+u*25,-h*.87-u*70,5+u*18,4+u*12,0,0,TAU);ctx.fill();}ctx.globalAlpha=1;if(phase>6&&phase<10){ctx.fillStyle=hot?'#ffd07a':'#da8b48';ctx.globalAlpha=.25+.2*Math.sin(t*8);ctx.fillRect(-9,-h*.6,18,3);}}
  if(isTree(d.kind)&&age<1)for(let i=0;i<5;i++){ctx.globalAlpha=1-age;ctx.fillStyle=i%2?'#d69851':'#555057';ctx.fillRect(Math.sin(i*2+age*5)*35,-h*.35+age*60+i*3,2,2);}
  if(d.kind===10){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.2*Math.sin(t*9);ctx.fillStyle='#ffce70';ctx.fillRect(-3,-15,6,6);}
  ctx.restore();
 }
 function drawables(){const p=R.Game.player;if(!p)return [];return near(p.x,p.y,Math.max(R.Camera.w,R.Camera.h)+180).map(d=>({y:d.y,draw:ctx=>drawSprite(ctx,d)}));}
 function atmosphere(ctx){const [x0,y0,x1,y1]=bounds(),t=Number(R.Game.time)||0,w=x1-x0,h=y1-y0,intensity=.25+.4*Math.max(0,Math.sin(t/43));ctx.save();ctx.globalAlpha=.045+intensity*.045;ctx.fillStyle='#9d6c50';ctx.fillRect(x0,y0,w,h);
  const count=window.PS_SETTINGS?.lowEffects?25:85;for(let i=0;i<count;i++){const phase=hash(i,0,seed+311),x=x0+((phase*w+t*(18+phase*26)+Math.sin(t*.6+i)*20)%w+w)%w,y=y0+((hash(i,0,seed+312)*h+t*(9+phase*15))%h+h)%h;ctx.globalAlpha=.14+phase*.25;ctx.fillStyle=i%11===0?'#e9a46a':'#c5b6ae';ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,i%11===0?3:2,2);}
  // each region's own air: steam drifting over the Sulfur Flats, glints over the Obsidian Fields, ember leaves in the Ember Grove, ash over the Badlands
  {const pl=R.Game.player,th=theme(Math.floor(pl.x/CELL),Math.floor(pl.y/CELL));
   if(th===2)for(let i=0;i<14;i++){const ph=hash(i,5,seed+885),x=x0+((ph*w+t*12)%w),y=y0+((hash(i,6,seed+886)*h-t*10)%h+h)%h;ctx.globalAlpha=.08+.06*Math.sin(t+i);ctx.fillStyle='#e8e0a0';ctx.beginPath();ctx.ellipse(x,y,18+ph*20,9+ph*8,0,0,TAU);ctx.fill();}
   if(th===1)for(let i=0;i<22;i++){const x=x0+hash(i,7,seed+887)*w,y=y0+hash(i,8,seed+888)*h,tw=Math.sin(t*3+i*2.1);if(tw<.85)continue;ctx.globalAlpha=(tw-.85)*6;ctx.fillStyle='#d8d0ff';ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,2,2);ctx.fillRect(Math.round(x/2)*2-2,Math.round(y/2)*2,6,2);ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2-2,2,6);}
   if(th===5)for(let i=0;i<20;i++){const ph=hash(i,9,seed+889),x=x0+((ph*w+t*(16+ph*10)+Math.sin(t+i)*24)%w+w)%w,y=y0+((hash(i,10,seed+890)*h+t*(24+ph*16))%h);ctx.globalAlpha=.6;ctx.fillStyle=i%3?'#d8502a':'#f2a03a';ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,4,2);}
   if(th===4)for(let i=0;i<26;i++){const ph=hash(i,11,seed+891),x=x0+((ph*w+t*(40+ph*30))%w),y=y0+hash(i,12,seed+892)*h+Math.sin(t*2+i)*6;ctx.globalAlpha=.18;ctx.fillStyle='#c8a880';ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,6,2);}
   ctx.globalAlpha=1;}
  for(const d of near(R.Game.player.x,R.Game.player.y,Math.max(w,h)).filter(d=>isTree(d.kind)||d.kind===3||d.kind===10)){for(let i=0;i<3;i++){const age=(t*.24+i/3+d.h)%1,x=d.x+Math.sin(i*4+t)*9+age*28,y=d.y-25-age*90;ctx.globalAlpha=(1-age)*.7;ctx.fillStyle=i%2?'#d1793a':'#ffc15b';ctx.fillRect(x,y,2,2);}}
  ctx.restore();
 }
 const POOL=[37,58,74,77,88,95,109,111,126,155,218,228,240,255,299,304,322,324,343,390,443,498,513,524,551,554,607,631,632,636,662,757,837,843,850,935];
 const HIGH=[38,59,75,76,78,89,110,112,157,219,229,257,305,306,323,344,392,445,464,500,514,525,526,552,553,555,608,609,663,758,838,839,844,851,936,937];
 function pool(level){return [...POOL,...HIGH].filter(d=>R.DEX_BY[d]&&R.SPRITE_META[d]&&(window.PS_WILD_LEVELS?.minimum(d)||1)<=level);}
 function bag(base){const ids=pool(Number(R.Game.player?.level)||1);if(!base?.length)return [];return ids.map((dex,i)=>({...base[i%base.length],dex,name:R.DEX_BY[dex].name}));}
 function bannerImage(){if(bannerUrl)return bannerUrl;if(!atlases.every(im=>im.complete&&im.naturalWidth>0))return null;const cv=document.createElement('canvas');cv.width=640;cv.height=240;const g=cv.getContext('2d'),p=region(0,0),x0=p.crater.x-460,y0=p.crater.y-140,sc=640/920;g.imageSmoothingEnabled=false;g.scale(sc,sc);g.translate(-x0,-y0);for(let cy=Math.floor(y0/CH);cy<=Math.floor((y0+350)/CH);cy++)for(let cx=Math.floor(x0/CH);cx<=Math.floor((x0+920)/CH);cx++)g.drawImage(terrain(cx,cy),cx*CH,cy*CH,CH,CH);for(const d of near(p.crater.x,p.crater.y,700).sort((a,b)=>a.y-b.y))drawSprite(g,d);bannerUrl=cv.toDataURL('image/png');return bannerUrl;}
 const api=window.PS_VOLCANO={landmarkOf,theme,THEMES,setReserve(fn){reserveFn=fn||null;lmCache.clear();chunks.clear();propCache.clear();ropeCache.clear();bannerUrl=null;},ropeRuns,active,bannerImage,reset,region,sample,route,dry,near,props,boxes,blocked,free,repair,hash,pool,ART,drawGround,drawables,atmosphere,discovered,get seed(){return seed;},get ready(){return atlases.every(im=>im.complete&&im.naturalWidth>0);},stats:()=>({chunks:chunks.size,regions:regions.size,propCells:propCache.size,discoveries:discovered.size,footprints:prints.length})};
 function wrap(o,k,fn){const old=o?.[k];if(typeof old==='function')o[k]=function(...a){return active()?fn.call(this,old,...a):old.apply(this,a);};}
 const resetWorld=R.World.reset;R.World.reset=function(s,...a){reset(s);return resetWorld.call(this,s,...a);};
 wrap(R.World,'biomeName',()=> 'Cinderwake Caldera');wrap(R.World,'drawGround',(_,ctx)=>drawGround(ctx));wrap(R.World,'drawLiquid',()=>{});wrap(A.Ground,'drawGround',()=>{});wrap(A.Light,'drawAir',(_,ctx)=>atmosphere(ctx));wrap(A.Sky,'weatherKind',()=> 'clear');
 wrap(R.World,'visibleProps',()=>[]);wrap(R.World,'specialsNear',()=>[]);wrap(R.World,'kindAt',(_,x,y)=>sample(x,y).lava?'liquid':'floor');wrap(R.World,'isWall',()=>false);wrap(R.World,'walkable',(_,tx,ty)=>dry(tx*32+16,ty*32+16));wrap(R.World,'isLiquid',(_,x,y)=>sample(x,y).lava);wrap(R.World,'liquidKind',()=> 'lava');wrap(R.World,'liquidEffect',()=>({}));wrap(R.World,'isFree',(_,x,y,r,wet)=>free(x,y,r,wet));wrap(R.World,'underCanopy',()=>false);wrap(R.World,'collide',(_,e)=>repair(e));
 wrap(R.World,'propsInCircle',(_,x,y,r)=>near(x,y,r).flatMap(d=>boxes(d).map(b=>({...b,r:Math.max(b.rx,b.ry),type:isTree(d.kind)?'tree':'rock',solid:true,volcano:true}))));
 wrap(R.World,'projectileBlock',(_,x,y,r=0)=>blocked(x,y,r)?{x,y,r:12,type:'rock'}:null);
 wrap(R.World,'obstacleNear',(_,x,y,r=12)=>blocked(x,y,r));wrap(R.World,'clearance',()=>null);
 const nativeDrawables=R.Training.drawables;R.Training.drawables=function(...a){const base=nativeDrawables.apply(this,a)||[];return active()?[...base,...drawables()]:base;};
 // Forest's light callback is a public extension point used by the shared night-light map.
 const forestLights=A.Forest.lights;A.Forest.lights=function(list,...a){const result=forestLights.call(this,list,...a);if(active()){const p=R.Game.player;if(p){for(const d of near(p.x,p.y,850).filter(d=>[0,3,10,12].includes(d.kind)).slice(0,12))list.push({x:d.x,y:d.y-20,r:d.kind===10?180:d.kind===12?200:85,c:[255,151,68],i:d.kind===10?1.25:d.kind===12?.9:.42});for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const x=Math.floor(p.x/240)*240+i*240,y=Math.floor(p.y/240)*240+j*240;if(sample(x,y).lava)list.push({x,y,r:200,c:[255,112,47],i:.65});}}}return result;};
 const bagAt=R.Enemies.bagAt;R.Enemies.bagAt=function(...a){const base=bagAt.apply(this,a);return active()?bag(base):base;};
 const add=R.EnemyMgr.add;R.EnemyMgr.add=function(e,...a){if(active()&&e){if(!window.PS_WILD_LEVELS?.exempt(e)&&!pool(Number(R.Game.player?.level)||1).includes(Number(e.dex))){const ids=pool(Number(R.Game.player?.level)||1),dex=ids[Math.floor(hash(e.id||0,Math.floor(R.Game.time||0),seed+600)*ids.length)],d=R.DEX_BY[dex];if(!d)return false;e.dex=dex;e.name=d.name;e.types=[...d.types];e.atkType=e.types[0];e.def={...e.def,dex,name:d.name};e.anim=new R.Sprites.Animator(dex,e.scale||1,!!e.shiny);e.r=R.Sprites.bodyRadius(dex,e.scale||1);e.bodyH=R.Sprites.bodyHeight(dex,e.scale||1);e.flying=R.Sprites.hovers(dex);e._psxR0=null;e._psxKOn=false;e.psxK=null;if(e.psx)e.psx.p=A.Species.profile(dex);}
   if(!free(e.x,e.y,e.r||12,e.flying||e.types?.includes('fire')))repair(e);if(blocked(e.x,e.y,e.r||12))return false;}return add.call(this,e,...a);};
 function tick(p,dt){if(!active()||p!==R.Game.player||R.Game.state!=='playing'||p.dead)return;if(lastPlayer!==p){lastPlayer=p;lastStep=null;p.__volcanoHurt=0;p.__volcanoSafe=null;}const t=Number(R.Game.time)||0,immune=(p.types||p.mon?.types||[]).includes('fire')||Number(p.dex)===383||p.flying||window.PS_LEGEND_FLIGHT?.active(p),lava=sample(p.x,p.y).lava,vent=near(p.x,p.y,80).find(d=>d.kind===3&&Math.hypot(p.x-d.x,p.y-d.y)<52&&(t+d.h*12)%14>8&&(t+d.h*12)%14<10);
  if(!lastStep)lastStep=[p.x,p.y];const moved=Math.hypot(p.x-lastStep[0],p.y-lastStep[1]);if(moved>16){if(moved<90&&!lava&&!p.flying){prints.push({x:p.x,y:p.y,t,a:Math.atan2(p.y-lastStep[1],p.x-lastStep[0])-Math.PI/2,side:stepSide});stepSide*=-1;if(prints.length>120)prints.shift();}lastStep=[p.x,p.y];}while(prints.length&&t-prints[0].t>40)prints.shift();
  if(!immune&&(lava||vent)&&t>=(p.__volcanoHurt||0)){p.__volcanoHurt=t+1;try{p.hurt(Math.max(1,Math.round(p.maxHp*(lava ? .025 : .018))),'#ef9a52',0,0,0);}catch(_){} }
  {const rc=Math.floor(p.x/CELL),rr=Math.floor(p.y/CELL),th=theme(rc,rr);if(p.__volcanoTheme!==th){if(p.__volcanoTheme!=null&&t-(p.__volcanoThemeT||-99)>6){try{R.Spawner.say(THEMES[th].n,2.2);}catch(_){}}p.__volcanoTheme=th;p.__volcanoThemeT=t;}
   const L=landmarkOf(rc,rr);if(L&&!discovered.has(L.id)&&Math.hypot(p.x-L.x,p.y-L.y)<190){discovered.add(L.id);try{R.Spawner.say(L.name+' — '+L.say,4);R.Pickups.drop(L.t===5||L.t===2?'heal':'coin',L.x,L.y+20,0);if(L.t===1||L.t===4)R.Pickups.drop('heal',L.x+24,L.y+30,0);R.FX.burst(L.x,L.y,'#ffc15b',16,120);}catch(_){}}}
  for(const d of near(p.x,p.y,160).filter(d=>d.kind===9)){if(Math.hypot(p.x-d.x,p.y-d.y)<130&&!discovered.has(d.id)){discovered.add(d.id);R.Spawner.say('An old caldera waystation… the fire is still warm.',3);}}
  for(const [k,b]of bumps)if(t-b.at>1.2)bumps.delete(k);
 }
 const update=R.Player.prototype.update;R.Player.prototype.update=function(dt,...a){const out=update.call(this,dt,...a);tick(this,dt);return out;};
 const banner=R.MenuUI.open;R.MenuUI.open=function(...a){const out=banner.apply(this,a);const b=document.getElementById('pp-banner');if(b&&R.Maps.selected?.()===target.n){const img=bannerImage();b.style.backgroundImage=img?'url("'+img+'")':'linear-gradient(135deg,#29232f,#723c31 65%,#ea8b43)';b.querySelectorAll('.pp-bgs i').forEach(el=>el.style.backgroundImage='none');}return out;};
})();
