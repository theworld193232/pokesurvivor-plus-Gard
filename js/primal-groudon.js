/* Primal Groudon: the reversion cutscene (embers gather, a dark faceted crystal forms with the glowing Omega
   symbol, it cracks, and Primal Groudon bursts out with its cry) and the Desolate Land domain (see below). */
(()=>{'use strict';
 const FORM='383-primal',TAU=Math.PI*2,REVEAL=3.25,END=5.8;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
 const bridge=()=>window.PS_MEGA_BRIDGE_V5;
 const canvas=document.createElement('canvas');canvas.id='ps-groudon-fx';canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:3;display:none';document.body.append(canvas);
 const ctx=canvas.getContext('2d');
 let scene=null,last=0,frameView=null;

 // Omega symbol (assets/fx/groudon-symbol.png is a white mask), tinted once into a glowing gold copy.
 let symbol=null,symbolRed=null;
 {const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');
   g.drawImage(img,0,0);g.globalCompositeOperation='source-in';const gr=g.createLinearGradient(0,0,0,c.height);
   gr.addColorStop(0,'#fff3a0');gr.addColorStop(.55,'#ffc21a');gr.addColorStop(1,'#ff8a00');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);symbol=c;};
  img.addEventListener('load',()=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');   // red copy for the Enraged nuke
   g.drawImage(img,0,0);g.globalCompositeOperation='source-in';const gr=g.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,'#ff6a4a');gr.addColorStop(1,'#d40000');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);symbolRed=c;});
  img.src='assets/fx/groudon-symbol.png?v=1';}

 // Sounds: the Primal Reversion sound plays as the transformation starts, the Primal Groudon cry when the crystal cracks.
 // Groudon uses assets/sfx/primal-reversion-groudon.mp3 if present, otherwise the shared assets/sfx/primal-reversion.mp3.
 const SOUNDS={reversion:['assets/sfx/primal-reversion-groudon.mp3','assets/sfx/primal-reversion.mp3'],cry:['assets/cries/383-primal.mp3']},audio={};
 function load(k,list){if(!list.length){audio[k]=null;return;}try{const a=new Audio(list[0]);a.preload='auto';a.onerror=()=>load(k,list.slice(1));audio[k]=a;}catch(e){audio[k]=null;}}
 for(const [k,list] of Object.entries(SOUNDS))load(k,list);
 function sound(k){const a=audio[k];if(!a)return;
   try{const sv=Number(bridge()?.audio?.settings?.sfx);a.volume=Math.max(0.15,Math.min(1,(Number.isFinite(sv)?sv:0.7)*1.2));a.currentTime=0;a.play().catch(()=>{});}catch(e){}}

 function view(){
   const b=bridge(),cam=b?.camera,game=document.getElementById('game');
   if(!cam||!game||typeof cam.left!=='function')return null;
   const rect=game.getBoundingClientRect(),k=cam.scale*(cam._cw>0?rect.width/cam._cw:1);
   if(!(k>0))return null;
   return {k,rect,left:cam.left(),top:cam.top()};
 }
 const screen=(x,y)=>({x:frameView.rect.left+(x-frameView.left)*frameView.k,y:frameView.rect.top+(y-frameView.top)*frameView.k});
 function kick(amount){const b=bridge();window.__psModKick=true;try{b?.camera?.kick?.(amount);}finally{window.__psModKick=false;}}
 function clear(){
   if(scene&&!scene.revealed&&scene.player.megaForm===FORM)scene.player.anim=scene.next;
   scene=null;canvas.style.display='none';
 }
 // Called at the real Primal Reversion event: the original sprite stays visible until the crystal breaks.
 function begin(p,previous,next){
   clear();scene={player:p,previous,next,t:0,revealed:false,kickIn:0};
   p.anim=previous;p.invuln=Math.max(p.invuln||0,REVEAL+.2);sound('reversion');
 }
 // a teammate turning Primal near you: the same Reversion scene, visual only
 function beginRemote(p,previous,next){const me=bridge()?.game?.player;if(me&&me.megaForm===FORM){p.anim=next;return;}begin(p,previous,next);}
 window.PS_PRIMAL_GROUDON={begin,beginRemote,get radius(){return LAND.radius;}};

 function polygon(points,fill,stroke,w){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w||.7;ctx.stroke();}}
 function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(255,120,20,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function crest(x,y,w,alpha){
   if(!symbol||alpha<=0)return;const h=w*symbol.height/symbol.width;
   ctx.save();ctx.globalAlpha=clamp(alpha);ctx.shadowColor='#ff9a1a';ctx.shadowBlur=w*.18;ctx.drawImage(symbol,x-w/2,y-h*.52,w,h);ctx.restore();
 }
 // The crystal from the ORAS Red Orb cutscene: a dark, rounded octagonal gem made of facets that meet at the centre.
 function outline(x,y,r){const pts=[];for(let i=0;i<8;i++){const a=i*TAU/8+TAU/16;
   for(const off of [-.3,.3]){const b=a+off;pts.push({x:x+Math.cos(b)*r*1.04,y:y+Math.sin(b)*r*.98});}}return pts;}
 function crystal(x,y,r,t){
   const rim=outline(x,y,r),mid=outline(x,y,r*.62).map((p,i)=>({x:p.x+Math.sin(i*2.7)*r*.04,y:p.y+Math.cos(i*1.9)*r*.04}));
   ctx.save();polygon(rim,'#1a0f0c');ctx.clip();
   for(let i=0;i<rim.length;i++){const n=(i+1)%rim.length,s=(i*7+3)%11/11,turn=.5+.5*Math.sin(t*1.3+i*.8);
     polygon([rim[i],rim[n],mid[n],mid[i]],'rgb('+Math.round(34+s*30+turn*14)+','+Math.round(20+s*16)+','+Math.round(16+s*10)+')','rgba(255,170,90,.18)');
     polygon([mid[i],mid[n],{x,y}],'rgb('+Math.round(24+s*22)+','+Math.round(14+s*12)+','+Math.round(12+s*8)+')','rgba(255,150,70,.12)');}
   const sheen=ctx.createLinearGradient(x-r,y-r,x+r,y+r);sheen.addColorStop(0,'rgba(255,214,150,.28)');sheen.addColorStop(.4,'rgba(120,60,30,.04)');sheen.addColorStop(1,'rgba(10,0,0,.5)');
   ctx.fillStyle=sheen;ctx.fillRect(x-r*1.1,y-r*1.1,r*2.2,r*2.2);ctx.restore();
   polygon(rim,null,'rgba(255,170,70,.75)',2);
 }
 // Golden light rays fanning out behind the crystal, like the ORAS cutscene.
 function rays(x,y,r,t,alpha){
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(t*.25);
   for(let i=0;i<18;i++){const a=i*TAU/18,w=.07+.04*Math.sin(i*3.1),L=r*(2.4+.6*Math.sin(t*2+i));
     const g=ctx.createLinearGradient(0,0,Math.cos(a)*L,Math.sin(a)*L);g.addColorStop(0,'rgba(255,226,140,.55)');g.addColorStop(1,'rgba(255,140,30,0)');
     ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a-w)*L,Math.sin(a-w)*L);ctx.lineTo(Math.cos(a+w)*L,Math.sin(a+w)*L);ctx.closePath();ctx.fill();}
   ctx.restore();
 }
 // The red crystals that rise around Groudon.
 function redCrystal(x,y,s,a,alpha){
   ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=alpha;
   polygon([{x:0,y:-s},{x:s*.42,y:-s*.2},{x:s*.3,y:s*.6},{x:-s*.3,y:s*.6},{x:-s*.42,y:-s*.2}],'#c8243c','#ffb0c0',1);
   polygon([{x:0,y:-s},{x:s*.42,y:-s*.2},{x:0,y:s*.1}],'rgba(255,170,190,.75)');ctx.restore();
 }
 function transformation(){
   if(!scene)return;
   const p=scene.player,t=scene.t,k=frameView.k,pos=screen(p.x,p.y-(Number(p.bodyH)||40)*.45);
   const r=clamp(Math.max((p.r||16)*2.5,(p.bodyH||40)*.9),50,95)*k;
   const jitter=t>2.45&&t<REVEAL?(Math.sin(t*68)+Math.sin(t*111))*(t-2.45)*3*k:0,x=pos.x+jitter,y=pos.y;
   ctx.save();
   if(t<REVEAL){
     ctx.fillStyle='rgba(30,8,0,'+(.3*ease(t/.5))+')';ctx.fillRect(frameView.rect.left,frameView.rect.top,frameView.rect.width,frameView.rect.height);
     rays(x,y,r,t,ease((t-.4)/.6)*.9);
     glow(x,y,r*2.1,'rgba(255,150,40,'+(.3+.1*Math.sin(t*3))+')');
     // Embers spiral in while the crystal forms.
     if(t<1.15){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-ease((t-.7)/.45);
       for(let i=0;i<24;i++){const a=i*2.4+t*2.8,d=r*(1+(1-ease(t/.9))*1.3),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.8;
         ctx.strokeStyle=i%3?'#ff8a1a':'#ffe08a';ctx.lineWidth=(1+i%2)*k;ctx.beginPath();ctx.arc(x,y,d,a,a+.08);ctx.stroke();glow(px,py,4*k,'rgba(255,190,90,.7)');}ctx.restore();}
     // Red crystals rise on either side.
     const rise=ease((t-.3)/.8);
     for(let i=0;i<6;i++){const side=i%2?1:-1,cx=x+side*r*(1.55+(i>>1)*.38),cy=y+r*(.55-(i>>1)*.42)-rise*r*.25+Math.sin(t*2+i)*3*k;
       redCrystal(cx,cy,r*(.32-(i>>1)*.05),side*.18,rise*.95);}
     const size=r*(.15+.85*ease(t/.7));
     if(t<.9){const g=ctx.createRadialGradient(x-size*.3,y-size*.4,0,x,y,size);g.addColorStop(0,'#ffb35a');g.addColorStop(.35,'#8a2a10');g.addColorStop(1,'#1a0806');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();}
     ctx.save();ctx.globalAlpha=ease((t-.55)/.45);crystal(x,y,size,t);ctx.restore();
     crest(x,y,size*1.25,ease((t-.75)/.55));
     if(t>2.85){const crack=clamp((t-2.85)/.32);ctx.save();ctx.beginPath();ctx.arc(x,y,r*1.05,0,TAU);ctx.clip();ctx.shadowColor='#ffd27a';ctx.shadowBlur=9*k;
       for(let i=0;i<6;i++){const a=i*TAU/6+.23*Math.sin(i*7);ctx.strokeStyle='#fff0c8';ctx.lineWidth=(.65+crack*.55)*k;ctx.beginPath();
         for(let n=0;n<=5;n++){const d=r*n/5*crack,b=a+Math.sin(i*13+n*5)*.09,px=x+Math.cos(b)*d,py=y+r*.05+Math.sin(b)*d;n?ctx.lineTo(px,py):ctx.moveTo(px,py);if(n===3){ctx.lineTo(px+Math.cos(b+.6)*r*.18,py+Math.sin(b+.6)*r*.18);ctx.moveTo(px,py);}}ctx.stroke();}ctx.restore();}
   }else{
     const e=t-REVEAL,fade=clamp(1-e/.85);
     if(e<1.35){ctx.save();ctx.globalCompositeOperation='lighter';glow(x,y-r*.45,r*1.5,'rgba(255,170,50,'+(.3*clamp(1-e/1.35))+')');ctx.restore();crest(x,y-r*(.55+e*.3),r*1.05,clamp(1-e/1.35)*.75);}
     if(e<.85){
       for(let i=0;i<22;i++){const a=i*2.4,dist=r*(.75+e*(2+i%4*.2)),px=x+Math.cos(a)*dist,py=y+Math.sin(a)*dist+e*e*50*k,s=(8+i%5*3)*k,spin=a+e*(i%2?2:-2);
         ctx.save();ctx.translate(px,py);ctx.rotate(spin);ctx.globalAlpha=fade;polygon([{x:-s,y:-s*.6},{x:s,y:-s*.2},{x:s*.3,y:s}],i%4===0?'#c8243c':i%3?'#2e1a14':'#ffb24a','#ff9a3a');ctx.restore();}
       ctx.strokeStyle='rgba(255,170,60,'+fade*.85+')';ctx.lineWidth=4*k*fade;ctx.beginPath();ctx.ellipse(x,y+r*.5,r*(1+e*3),r*(.3+e),0,0,TAU);ctx.stroke();
       const flash=clamp(1-e/.2);ctx.fillStyle='rgba(255,238,200,'+flash*.78+')';ctx.fillRect(frameView.rect.left,frameView.rect.top,frameView.rect.width,frameView.rect.height);
     }
   }
   ctx.restore();
 }
 // =====================================================================================================
 //  DESOLATE LAND: Primal Groudon's domain (replaces the old sun circle from js/mega-native.js)
 //  - harsh light shining down from the sky, like sunlight on glass over the screen
 //  - the ground Groudon walks on (and, slowly, everything inside the domain) turns to desert / ash / stone
 //  - Groudon burns through trees, rocks and walls, leaving scorched ground he (and everyone) can cross
 //  - foes inside get slower and take more burn damage the longer they stay
 //  - waves of Bulldoze / Earthquake / Spikes / Fissure (the game's own moves) erupt around the domain
 //  - every 20 s, PRIMAL ROAR: Groudon stops, roars, the screen whites out in heat and every foe takes 6x damage
 //  - ENRAGED (once, below 10% HP): a louder cry, the red Omega, a 360-degree Beam of Red Death and a map-wide
 //    final explosion, then 15 s i-frames,
 //    2x damage, 1.5x speed and 50% HP
 // =====================================================================================================
 // Tuning knobs.
 const LAND={
   radius:430,          // domain radius (world units)
   trail:40,            // Groudon scorches the ground within this radius as he walks
   spreadTime:14,       // seconds for the desert to spread across the whole domain
   slowBase:.10,slowPerSec:.06,slowMax:.60,          // foe slow: 10% on entry, +6% per second inside, max 60%
   dmgBase:.004,dmgPerSec:.002,dmgMax:.03,tick:.5,   // burn per tick, as a fraction of max HP (grows the longer they stay)
   bossMult:.25,        // bosses take this share of the domain burn
   quakeEvery:3,quakeCount:[1,8],confuse:3,         // a wave of 1-8 ground moves every 3 s; Bulldoze / Earthquake confuse for 3 s
   roarEvery:20,roarWindup:.55,roarTime:2.1,roarMult:6,  // Primal Roar: every 20 s, 6x Groudon's best move damage to every foe
   rageBelow:.10,rageTime:6,rageNukeAt:3.4,rageMult:12,  // Enraged: below 10% HP, a 6 s cinematic ending in a map nuke for 12x Groudon's best move damage...
   beamFrom:.7,beamTime:2.6,beamMult:2.5,beamTick:.1,beamLen:1500,beamWidth:76,   // ...the Beam of Red Death spins 360 deg first (2.5x per tick)
   rageIframes:15,rageAtk:2,rageSpd:1.5,rageHeal:.5,      // ...then 15 s of i-frames, 2x damage, 1.5x speed (rest of the run), 50% HP
   maxTiles:9000
 };
 const E=()=>window.PS_HOOPA_ENGINE;
 const scorched=new Map();       // "tx,ty" -> {kind,born,v}
 const heat=new Map();           // "tx,ty" -> seconds of domain heat (turns to desert when hot enough)
 let groundHooked=false,landClock=0,tickAcc=0,quakeIn=1.2;
 const inside=new Map();         // enemy -> {t,x,y,cf,cfA,cfT}
 const quakes=[];                // cracked-ground marks for Bulldoze / Earthquake (overlay)
 const motes=[];
 const deltaStream=()=>!!window.PS_DELTA_STREAM?.active?.();   // Mega Rayquaza's Delta Stream negates Desolate Land
 // [Gard co-op] a teammate's Desolate Land is seen (visual only) while you stand inside its domain
 let viewOnly=false;
 function domOwner(){const b=bridge(),p=b?.game?.player;if(!p)return null;if(!p.dead&&p.megaForm===FORM)return p;let best=null,bd=LAND.radius;
   for(const q of b?.game?.everyone?.()||[]){if(!q||q===p||q.dead||q.megaForm!==FORM||!Number.isFinite(q.x))continue;const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best=q;}}return best;}
 function landOn(){const b=bridge(),o=domOwner();return !!(o&&!o.dead&&b.game.state==='playing'&&(!scene||scene.revealed||scene.player!==o));}
 function tileSize(){return Number(E()?.World?.TS)||32;}
 const key=(tx,ty)=>tx+','+ty;
 function isScorched(x,y){const T=tileSize();return scorched.has(key(Math.floor(x/T),Math.floor(y/T)));}

 // ---- ground textures: painted from the game's own biome palettes (Red Desert, Ash Volcano, Igneous Volcano) ----
 const PAL={
   sand:{floor:['#b08a52','#b4905b','#a5824d'],speck:'#94723f',light:'#d0aa6c',dark:'#8c6a3c'},
   burnt:{floor:['#5b4537','#644c3c','#533f32'],speck:'#3a2b22',light:'#806452',dark:'#2a1f19',ember:'#ff8d3d'},
   stone:{floor:['#554d49','#6a605b','#5e5551'],speck:'#3c3532',light:'#8b837f',dark:'#2e2826'}
 };
 function biomePalettes(){
   const B=E()?.Tiles?.BIOMES;if(!Array.isArray(B))return;
   const find=re=>B.find(b=>re.test(b.name||''));
   const desert=find(/Desierto/i),ash=find(/Ceniza/i),igneo=find(/[ÍI]gneo/i);
   if(desert)Object.assign(PAL.sand,{floor:desert.floor,speck:desert.speck,light:desert.light});
   if(ash)Object.assign(PAL.burnt,{floor:ash.floor,speck:ash.speck,light:ash.light});
   if(igneo&&igneo.rock)Object.assign(PAL.stone,{floor:igneo.rock,speck:igneo.wallEdge||PAL.stone.speck,light:igneo.wallLight||PAL.stone.light});
 }
 const textures={};
 function texture(kind,v){
   const id=kind+v;if(textures[id])return textures[id];
   // 16x16 pixels for the tile plus a 2-pixel ragged fringe that overlaps the neighbours (no hard square edges).
   const P=PAL[kind],c=document.createElement('canvas');c.width=c.height=20;const g=c.getContext('2d');
   let s=(v+1)*9301+kind.length*49297;const rnd=()=>((s=(s*233280+49297)%2147483647)/2147483647);
   for(let y=0;y<20;y++)for(let x=0;x<20;x++){const edge=Math.min(x,y,19-x,19-y);if(edge<2&&rnd()<(edge?.45:.75))continue;
     g.fillStyle=P.floor[Math.floor(rnd()*P.floor.length)];g.fillRect(x,y,1,1);}
   g.translate(2,2);
   for(let i=0;i<10;i++){g.fillStyle=rnd()<.5?P.speck:P.light;g.fillRect(Math.floor(rnd()*16),Math.floor(rnd()*16),1,1);}
   if(kind==='sand'){g.fillStyle=P.light;for(let i=0;i<2;i++){const y=2+Math.floor(rnd()*12),x=Math.floor(rnd()*8);g.fillRect(x,y,5+Math.floor(rnd()*4),1);}}
   else{ // cracks
     g.fillStyle=P.dark;let x=Math.floor(rnd()*16),y=Math.floor(rnd()*16);
     for(let i=0;i<9;i++){g.fillRect(x,y,1,1);x=(x+(rnd()<.5?1:-1)+16)%16;y=(y+(rnd()<.6?1:0))%16;}
     if(kind==='burnt'&&rnd()<.6){g.fillStyle=P.ember;g.fillRect(Math.floor(rnd()*16),Math.floor(rnd()*16),1,1);}
   }
   return textures[id]=c;
 }
 function scorch(tx,ty,kind,now){
   const k=key(tx,ty);if(scorched.has(k))return false;
   scorched.set(k,{kind,born:now,v:(tx*7+ty*13)&3});
   if(scorched.size>LAND.maxTiles){const first=scorched.keys().next().value;scorched.delete(first);}
   return true;
 }
 // Smooth value noise over tiles, so desert and ash grow in organic blobs instead of scattered squares.
 function hash(x,y){let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967295;}
 function noise(tx,ty,scale){const x=tx/scale,y=ty/scale,x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
   const a=hash(x0,y0),b=hash(x0+1,y0),c=hash(x0,y0+1),d=hash(x0+1,y0+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}
 // What a tile becomes: water / lava / swamp -> stone, walls -> ash, grass and dirt -> desert with patches of ash.
 function kindFor(x,y,tx,ty){
   const W=E()?.World;let k='floor';try{k=W.kindAt(x,y);}catch(e){}
   if(k==='liquid')return 'stone';if(k==='wall')return 'burnt';
   return noise(tx+500,ty+500,3)>.68?'burnt':'sand';
 }
 function scorchAround(x,y,r,now){
   const T=tileSize(),t0=Math.floor((x-r)/T),t1=Math.floor((x+r)/T),u0=Math.floor((y-r)/T),u1=Math.floor((y+r)/T);
   for(let ty=u0;ty<=u1;ty++)for(let tx=t0;tx<=t1;tx++){const cx=(tx+.5)*T,cy=(ty+.5)*T;if(Math.hypot(cx-x,cy-y)>r+T*.5)continue;scorch(tx,ty,kindFor(cx,cy,tx,ty),now);}
 }
 // Drawn into the game's own ground pass (world coordinates), so Pokemon and props stay on top of it.
 function drawScorched(g){
   if(!scorched.size||deltaStream())return;const p=bridge()?.game?.player;if(!p)return;
   const T=tileSize(),now=landClock,reach=1500;
   g.save();g.imageSmoothingEnabled=false;
   for(const [k,s] of scorched){const i=k.indexOf(','),tx=+k.slice(0,i),ty=+k.slice(i+1),x=tx*T,y=ty*T;
     if(Math.abs(x-p.x)>reach||Math.abs(y-p.y)>reach)continue;
     const age=now-s.born,a=clamp(age/.6);
     g.globalAlpha=a;g.drawImage(texture(s.kind,s.v),x-T/8,y-T/8,T*1.25,T*1.25);
     if(age<.9){g.globalAlpha=(1-age/.9)*.55;g.fillStyle=s.kind==='stone'?'#ffb070':'#ff7a2a';g.fillRect(x,y,T,T);}   // glows hot while it changes
   }
   g.restore();
 }
 // ---- engine hooks: scorched ground under the world, and scorched walls / water no longer block ----
 function hookWorld(){
   const W=E()?.World;if(groundHooked||!W||W.__psDesolate)return;groundHooked=W.__psDesolate=true;biomePalettes();
   const liquid=W.drawLiquid;
   if(typeof liquid==='function')W.drawLiquid=function(g){const r=liquid.apply(this,arguments);try{drawScorched(g);}catch(e){}return r;};
   const isWall=W.isWall,isLiquid=W.isLiquid,block=W.projectileBlock,collide=W.collide;
   W.isWall=function(x,y){return isScorched(x,y)?false:isWall.apply(this,arguments);};
   W.isLiquid=function(x,y){return isScorched(x,y)?false:isLiquid.apply(this,arguments);};
   if(typeof block==='function')W.projectileBlock=function(x,y){const r=block.apply(this,arguments);return r==='wall'&&isScorched(x,y)?null:r;};
   W.collide=function(ent){
     if(ent&&landOn()&&!viewOnly&&!deltaStream()&&ent===bridge()?.game?.player)burnThrough(ent);
     if(!scorched.size||!ent||!nearScorchedWall(ent))return collide.apply(this,arguments);
     return collideSkippingScorched(ent,isWall);
   };
 }
 function nearScorchedWall(ent){const T=tileSize(),r=(Number(ent.r)||10)+2;
   for(let ty=Math.floor((ent.y-r)/T);ty<=Math.floor((ent.y+r)/T);ty++)for(let tx=Math.floor((ent.x-r)/T);tx<=Math.floor((ent.x+r)/T);tx++)if(scorched.has(key(tx,ty)))return true;return false;}
 // Same push-out as the game's collide, but scorched wall tiles are open ground now.
 function collideSkippingScorched(ent,isWall){
   const W=E().World,T=tileSize(),r=Number(ent.r)||10;let hit=false;
   for(let pass=0;pass<2;pass++){
     for(let ty=Math.floor((ent.y-r)/T);ty<=Math.floor((ent.y+r)/T);ty++)for(let tx=Math.floor((ent.x-r)/T);tx<=Math.floor((ent.x+r)/T);tx++){
       if(scorched.has(key(tx,ty))||!isWall.call(W,(tx+.5)*T,(ty+.5)*T))continue;
       const x0=tx*T,y0=ty*T,x1=x0+T,y1=y0+T,cx=clamp(ent.x,x0,x1),cy=clamp(ent.y,y0,y1),dx=ent.x-cx,dy=ent.y-cy,d2=dx*dx+dy*dy;
       if(d2>=r*r)continue;hit=true;
       if(d2>1e-6){const d=Math.sqrt(d2);ent.x+=dx/d*(r-d);ent.y+=dy/d*(r-d);}
       else{const l=ent.x-x0,rr=x1-ent.x,u=ent.y-y0,dd=y1-ent.y,m=Math.min(l,rr,u,dd);if(m===l)ent.x=x0-r;else if(m===rr)ent.x=x1+r;else if(m===u)ent.y=y0-r;else ent.y=y1+r;}
     }
   }
   for(const q of propsNear(ent.x,ent.y,r+24)){if(!q.solid)continue;const dx=ent.x-q.x,dy=ent.y-q.y,R=r+(q.r||12),d2=dx*dx+dy*dy;
     if(d2<R*R){hit=true;const d=Math.sqrt(d2)||.01;ent.x=q.x+dx/d*R;ent.y=q.y+dy/d*R;}}
   return hit;
 }
 // Groudon burns obstacles in his path: trees, rocks and bushes crumble, wall tiles become scorched ground.
 const KEEP=new Set(['chest','bigchest','altar','spring','trap']);
 function burnThrough(p){
   const W=E().World,T=tileSize(),r=(Number(p.r)||16)+10,now=landClock;
   for(const q of propsNear(p.x,p.y,r)){
     if(KEEP.has(q.type)||q.burnt)continue;q.burnt=true;
     try{W.breakAt(q.tx,q.ty);}catch(e){}
     scorch(q.tx,q.ty,'burnt',now);burstFire(q.x,q.y);
   }
   for(let ty=Math.floor((p.y-r)/T);ty<=Math.floor((p.y+r)/T);ty++)for(let tx=Math.floor((p.x-r)/T);tx<=Math.floor((p.x+r)/T);tx++){
     const cx=(tx+.5)*T,cy=(ty+.5)*T;if(scorched.has(key(tx,ty)))continue;
     let wall=false;try{wall=E().World.kindAt(cx,cy)==='wall';}catch(e){}
     if(wall&&scorch(tx,ty,'burnt',now))burstFire(cx,cy);
   }
 }
 // Every prop near a point, trees included (the game's own propsInCircle only lists breakable ones).
 let propCache=null,propCacheAt=-1;
 function propsNear(x,y,r){
   const W=E().World;if(propCacheAt!==landClock){propCacheAt=landClock;try{propCache=W.visibleProps(E().Camera)||[];}catch(e){propCache=[];}}
   const out=[];for(const q of propCache)if(q&&Math.abs(q.x-x)<r+40&&Math.abs(q.y-y)<r+40&&Math.hypot(q.x-x,q.y-y)<=r+(q.r||12))out.push(q);return out;
 }
 function burstFire(x,y){const F=E()?.FX;try{F.burst(x,y,'#ff8a3d',12,150);F.sp('fire','fire',x,y-6,{vy:-60,life:.6});}catch(e){}}

 // ---- foes in the domain: slower and burning more the longer they stay; confusion from quakes ----
 function domainFoes(dt){
   const b=bridge(),p=b.game.player,list=b?.enemies?.all?.()||[],seen=new Set();
   tickAcc+=dt;const tick=tickAcc>=LAND.tick;if(tick)tickAcc-=LAND.tick;
   for(const e of list){if(!e||e.dead||!Number.isFinite(e.x))continue;seen.add(e);
     let s=inside.get(e);if(!s){s={t:0,x:e.x,y:e.y,cf:0,cfA:0,cfT:0};inside.set(e,s);}
     const dx=e.x-s.x,dy=e.y-s.y,jump=dx*dx+dy*dy>1600;
     const inDomain=Math.hypot(e.x-p.x,e.y-p.y)<LAND.radius;
     s.t=inDomain?s.t+dt:Math.max(0,s.t-dt*2);
     if(!jump){
       let mx=dx,my=dy;
       if(inDomain){const slow=Math.min(LAND.slowMax,LAND.slowBase+LAND.slowPerSec*s.t);mx*=1-slow;my*=1-slow;}
       if(s.cf>0){s.cfT-=dt;if(s.cfT<=0){s.cfA=(Math.random()<.5?1:-1)*(1.6+Math.random()*1.4);s.cfT=.6;}const c=Math.cos(s.cfA),n=Math.sin(s.cfA);[mx,my]=[mx*c-my*n,mx*n+my*c];}
       e.x=s.x+mx;e.y=s.y+my;
     }
     if(s.cf>0)s.cf-=dt;
     if(inDomain&&tick&&typeof e.hurt==='function'){const max=Number(e.maxHp)||Number(e.hp)||40,f=Math.min(LAND.dmgMax,LAND.dmgBase+LAND.dmgPerSec*s.t)*(e.boss?LAND.bossMult:1);
       e.hurt(Math.max(1,max*f),'#ff7a2a',0,0,0);}
     s.x=e.x;s.y=e.y;
   }
   for(const e of inside.keys())if(!seen.has(e))inside.delete(e);
 }
 // Ground moves erupting around the domain, cast through stand-in Groudons (the way Hoopa's portals cast moves).
 // Each one picks a move from QUAKE_MOVES and a random upgrade level (1 to max); at max level it may be the evolved form.
 const QUAKE_MOVES=[
   {id:'bulldoze',w:4,confuse:true},          // Bulldoze -> evolves into Earthquake (Terremoto)
   {id:'mega-earthquake',w:2,confuse:true},   // Earthquake
   {id:'spikes',w:2,confuse:false}            // Spikes -> evolves into Fissure (Fisura)
 ];
 const quakers=[];let quakerNext=0;
 function stand(p){
   const X=E();if(quakers.length<8){try{const a=new X.Player(X.DEX_BY?.[383],{},false);a.psGroudon=true;quakers.push(a);}catch(e){}}
   const a=quakers[quakerNext++%Math.max(1,quakers.length)];if(!a)return null;
   for(const k of ['baseAtk','baseSpa','atkMul','atkPerm','critChance','critPerm','level'])if(p[k]!=null)a[k]=p[k];
   a.dead=false;return a;
 }
 function quake(p){
   const X=E();if(!X?.Combat?.hoopaCast||!X.Player)return;
   const a=stand(p);if(!a)return;
   const ang=Math.random()*TAU,d=Math.random()<.35?60+Math.random()*120:140+Math.random()*(LAND.radius-160);
   a.x=p.x+Math.cos(ang)*d;a.y=p.y+Math.sin(ang)*d;a.aim=ang;
   let total=0;for(const q of QUAKE_MOVES)total+=q.w;let r=Math.random()*total,pick=QUAKE_MOVES[0];for(const q of QUAKE_MOVES){if((r-=q.w)<0){pick=q;break;}}
   const def=X.Moves.BY_ID[pick.id];if(!def)return;
   const max=Number(def.maxLvl)||1,lvl=1+Math.floor(Math.random()*max),inst=X.Moves.instance(pick.id,lvl);
   const evolved=lvl>=max&&X.Moves.EVO?.[pick.id]&&Math.random()<.5;if(evolved)X.Moves.evolve(inst);
   try{X.Combat.hoopaCast(a,inst);}catch(e){console.warn('Desolate Land quake',e);return;}
   const R=Number(inst.radius)||100,big=evolved||pick.id==='mega-earthquake';
   if(pick.confuse)for(const e of bridge().enemies.all()){if(!e||e.dead||Math.hypot(e.x-a.x,e.y-a.y)>R+(e.r||10))continue;
     const s=inside.get(e)||{t:0,x:e.x,y:e.y,cf:0,cfA:0,cfT:0};s.cf=LAND.confuse;s.cfT=0;inside.set(e,s);}
   quakes.push({x:a.x,y:a.y,R,t:0,eq:big,seed:Math.random()*99});
   kick(big?.14:.06);
 }
 // A wave of 1-8 ground moves every few seconds, slightly staggered so they rumble one after another.
 const pendingQuakes=[];
 function quakeWave(){const n=LAND.quakeCount[0]+Math.floor(Math.random()*(LAND.quakeCount[1]-LAND.quakeCount[0]+1));for(let i=0;i<n;i++)pendingQuakes.push(i*(.06+Math.random()*.1));}

 // ---- PRIMAL ROAR: every 20 s Groudon plants himself, roars, and the whole screen erupts in fire ----
 let roarIn=LAND.roarEvery,roar=null;const fires=[];
 function bestDamage(p){let best=0;for(const m of p.moves||[])if(Number(m.dmg)>best)best=Number(m.dmg);return (best||40)*(Number(p.atk)||1);}
 function startRoar(p){roar={t:0,x:p.x,y:p.y,hit:false};p.invuln=Math.max(Number(p.invuln)||0,LAND.roarTime+.4);sound('cry');}
 function roarBlast(p){
   const b=bridge(),v=frameView,T=tileSize(),now=landClock;
   // 6x Groudon's damage to every foe on the map
   const dmg=bestDamage(p)*LAND.roarMult;
   for(const e of b.enemies.all()){if(!e||e.dead||typeof e.hurt!=='function')continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;
     e.hurt(dmg,'#ff5a1a',dx/d,dy/d,160);try{E().FX.burst(e.x,e.y-12,'#ff8a3d',10,170);}catch(_){}}
   // everything on screen becomes desolate wasteland
   const w=v.rect.width/v.k,h=v.rect.height/v.k,x0=v.left-T*2,y0=v.top-T*2;
   for(let ty=Math.floor(y0/T);ty<=Math.floor((y0+h+T*4)/T);ty++)for(let tx=Math.floor(x0/T);tx<=Math.floor((x0+w+T*4)/T);tx++){
     const cx=(tx+.5)*T,cy=(ty+.5)*T;let k='floor';try{k=E().World.kindAt(cx,cy);}catch(e){}if(k!=='wall')scorch(tx,ty,kindFor(cx,cy,tx,ty),now);}
   // fire explosions all over the screen
   for(let i=0;i<34;i++)fires.push({x:v.left+Math.random()*w,y:v.top+Math.random()*h,t:-Math.random()*.7,r:40+Math.random()*70});
   kick(1.3);
 }
 function updateRoar(dt,p){
   if(!roar){roarIn-=dt;if(roarIn<=0){roarIn=LAND.roarEvery;startRoar(p);}return;}
   roar.t+=dt;p.x=roar.x;p.y=roar.y;p.invuln=Math.max(Number(p.invuln)||0,.3);    // planted in place, untouchable
   if(!roar.hit&&roar.t>=LAND.roarWindup){roar.hit=true;roarBlast(p);}
   if(roar.hit&&roar.t<LAND.roarWindup+1.1&&Math.random()<dt*12)kick(.35);       // the whole screen keeps shaking
   if(roar.t>=LAND.roarTime)roar=null;
 }
 function drawRoar(){
   const v=frameView,R=v.rect,k=v.k;
   for(let i=fires.length-1;i>=0;i--){const f=fires[i];f.t+=1/60;if(f.t>.9){fires.splice(i,1);continue;}if(f.t<0)continue;
     if(!f.boom){f.boom=1;try{E().FX.burst(f.x,f.y,'#ffb347',14,200);E().FX.sp('fire','fire',f.x,f.y-10,{vy:-80,life:.7});}catch(e){}}
     const s=screen(f.x,f.y),q=f.t/.9,r=f.r*k*(.3+.9*Math.sqrt(q));
     ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,r);
     g.addColorStop(0,'rgba(255,250,210,'+(1-q)+')');g.addColorStop(.35,'rgba(255,190,70,'+(.9*(1-q))+')');g.addColorStop(.7,'rgba(255,90,20,'+(.6*(1-q))+')');g.addColorStop(1,'rgba(160,30,0,0)');
     ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,r,0,TAU);ctx.fill();ctx.restore();}
   if(!roar)return;
   const p=bridge().game.player,c=screen(p.x,p.y-(Number(p.bodyH)||40)*.45),t=roar.t,W=LAND.roarWindup;
   ctx.save();
   if(t<W){ // gathering heat around Groudon while he roars
     const q=t/W;ctx.globalCompositeOperation='lighter';
     const g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,120*k*(.5+q));g.addColorStop(0,'rgba(255,230,160,'+(.6*q)+')');g.addColorStop(1,'rgba(255,90,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y,120*k*(.5+q),0,TAU);ctx.fill();
     ctx.strokeStyle='rgba(255,180,80,'+(.8*q)+')';ctx.lineWidth=4*k;for(let i=0;i<3;i++){const rr=((t*1.8+i/3)%1)*160*k;ctx.beginPath();ctx.ellipse(c.x,c.y+20*k,rr,rr*.45,0,0,TAU);ctx.stroke();}
     ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(120,30,0,'+(.25*q)+')';ctx.fillRect(R.left,R.top,R.width,R.height);
   }else{ // heat blinds the screen, then fades
     const e=t-W,blind=e<.18?e/.18:Math.max(0,1-(e-.18)/1.1);
     ctx.globalCompositeOperation='lighter';
     const ring=e*1800*k;ctx.strokeStyle='rgba(255,200,110,'+Math.max(0,.9-e)+')';ctx.lineWidth=26*k*Math.max(0,1-e);ctx.beginPath();ctx.ellipse(c.x,c.y,ring,ring*.6,0,0,TAU);ctx.stroke();
     ctx.globalCompositeOperation='source-over';
     let g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,Math.max(R.width,R.height));g.addColorStop(0,'rgba(255,252,235,'+(.95*blind)+')');g.addColorStop(.45,'rgba(255,200,120,'+(.85*blind)+')');g.addColorStop(1,'rgba(255,110,30,'+(.75*blind)+')');
     ctx.fillStyle=g;ctx.fillRect(R.left,R.top,R.width,R.height);
     // heat haze bands rolling over the screen as it clears
     ctx.globalCompositeOperation='lighter';ctx.lineWidth=6;for(let i=0;i<12;i++){const y=R.top+((i/12*R.height+e*260)%R.height);ctx.strokeStyle='rgba(255,210,150,'+(.12*blind)+')';ctx.beginPath();
       for(let x=0;x<=R.width;x+=30){const yy=y+Math.sin(x*.02+e*9+i)*7;x?ctx.lineTo(R.left+x,yy):ctx.moveTo(R.left+x,yy);}ctx.stroke();}
   }
   ctx.restore();
 }
 // ---- ENRAGED: the first time Primal Groudon drops below 10% HP he lets out a louder cry and nukes the map ----
 // 6 s cinematic (planted, untouchable): the red Omega fills the screen, Groudon spins a giant beam through a full
 // circle, then a final explosion: a blinding heat wave sweeps the whole map,
 // the screen shakes and stays tinted dark red. Then: 15 s of i-frames, 2x damage, 1.5x speed, back to 50% HP.
 let enraged=false,rage=null;
 function loudCry(){
   try{const src=audio.cry&&audio.cry.src;if(!src)return;
     for(const [rate,vol] of [[1,1],[.8,1]]){const a=new Audio(src);a.volume=vol;a.playbackRate=rate;a.preservesPitch=false;a.play().catch(()=>{});}}catch(e){}
 }
 function startRage(p){
   enraged=true;rage={t:0,x:p.x,y:p.y,hit:false,done:false,aim0:Number(p.aim)||0,aim:Number(p.aim)||0,tick:0,beamHits:[]};roar=null;
   p.invuln=Math.max(Number(p.invuln)||0,LAND.rageTime+.5);loudCry();kick(.6);
 }
 function rageNuke(p){
   const b=bridge(),v=frameView,T=tileSize(),now=landClock,dmg=bestDamage(p)*LAND.rageMult;
   for(const e of b.enemies.all()){if(!e||e.dead||typeof e.hurt!=='function')continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;
     e.hurt(dmg,'#ff2a1a',dx/d,dy/d,260);try{E().FX.burst(e.x,e.y-12,'#ff4a1a',14,220);}catch(_){}}
   const w=v.rect.width/v.k,h=v.rect.height/v.k,x0=v.left-T*3,y0=v.top-T*3;
   for(let ty=Math.floor(y0/T);ty<=Math.floor((y0+h+T*6)/T);ty++)for(let tx=Math.floor(x0/T);tx<=Math.floor((x0+w+T*6)/T);tx++){
     const cx=(tx+.5)*T,cy=(ty+.5)*T;let k='floor';try{k=E().World.kindAt(cx,cy);}catch(e){}if(k!=='wall')scorch(tx,ty,noise(tx+90,ty+90,3)>.42&&k==='floor'?'burnt':kindFor(cx,cy,tx,ty),now);}
   for(let i=0;i<50;i++)fires.push({x:v.left+Math.random()*w,y:v.top+Math.random()*h,t:-Math.random()*1.4,r:50+Math.random()*90});
   kick(1.6);
 }
 function updateRage(dt,p){
   if(!enraged&&!rage&&p.maxHp>0&&p.hp>0&&p.hp<p.maxHp*LAND.rageBelow&&!roar&&(!scene||scene.revealed)){startRage(p);}
   if(!rage)return false;
   rage.t+=dt;p.x=rage.x;p.y=rage.y;p.invuln=Math.max(Number(p.invuln)||0,.3);
   updateBeam(dt,p);
   if(!rage.hit&&rage.t>=LAND.rageNukeAt){rage.hit=true;rageNuke(p);}
   if(rage.t<LAND.rageTime&&Math.random()<dt*14)kick(.45);                 // the whole screen shakes for 5 s
   if(rage.t>=LAND.rageTime){
     // Enraged for the rest of the run: base stats so permanent upgrades can't hide the boost
     if(Number.isFinite(p.baseAtk))p.baseAtk*=LAND.rageAtk;if(Number.isFinite(p.baseSpa))p.baseSpa*=LAND.rageAtk;
     if(Number.isFinite(p.baseSpd))p.baseSpd*=LAND.rageSpd;
     p.hp=Math.max(p.hp,Math.round(p.maxHp*LAND.rageHeal));p.invuln=Math.max(Number(p.invuln)||0,LAND.rageIframes);
     p.psEnraged=true;rage=null;unlockFacing(p);roarIn=LAND.roarEvery;
   }
   return true;
 }
 // ---- Beam of Red Death: a giant red / gold beam from Groudon's mouth while he turns a full circle ----
 function beamMouth(p,aim){const r=Number(p.r)||16,lift=Number(E()?.LIFT||bridge()?.lift)||18,h=Math.max(lift,(Number(p.bodyH)||40)*.62);return {x:p.x+Math.cos(aim)*r*.9,y:p.y-h+Math.sin(aim)*r*.45};}
 // The game re-aims Groudon every frame; while the beam spins, his sprite faces the beam instead.
 function lockFacing(p){const a=p.anim;if(!a||a.__rageDir)return;let saved=a.dir;a.__rageDir=true;
   Object.defineProperty(a,'dir',{configurable:true,get(){try{return rage?bridge().sprites.dirFromAngle(rage.aim):saved;}catch(e){return saved;}},set(v){saved=v;}});}
 function unlockFacing(p){const a=p&&p.anim;if(!a||!a.__rageDir)return;const d=a.dir;delete a.dir;delete a.__rageDir;a.dir=d;}
 function beamOn(){return rage&&rage.t>=LAND.beamFrom&&rage.t<LAND.beamFrom+LAND.beamTime;}
 function updateBeam(dt,p){
   if(!rage)return;const u=(rage.t-LAND.beamFrom)/LAND.beamTime;
   if(u<0){rage.aim=rage.aim0;return;}
   // ease in / out over one full turn, then face forward again
   const q=Math.min(1,u);rage.aim=rage.aim0+TAU*q*q*(3-2*q);
   p.aim=rage.aim;lockFacing(p);
   if(!beamOn())return;
   rage.tick-=dt;if(rage.tick>0)return;rage.tick=LAND.beamTick;
   const dmg=bestDamage(p)*LAND.beamMult,c=Math.cos(rage.aim),sn=Math.sin(rage.aim),W=LAND.beamWidth;
   for(const e of bridge().enemies.all()){if(!e||e.dead||typeof e.hurt!=='function')continue;
     const dx=e.x-p.x,dy=e.y-p.y,along=dx*c+dy*sn,side=Math.abs(-dx*sn+dy*c);
     if(along<0||along>LAND.beamLen||side>W/2+(Number(e.r)||10))continue;
     e.hurt(dmg,'#ff3a1a',c,sn,90);if(Math.random()<.5)try{E().FX.burst(e.x,e.y-12,'#ffcf5a',8,180);}catch(_){}}
   // the ground scorches along the beam
   const T=tileSize();for(let d=40;d<LAND.beamLen;d+=T){const x=p.x+c*d,y=p.y+sn*d;let k='floor';try{k=E().World.kindAt(x,y);}catch(e){}if(k!=='wall')scorch(Math.floor(x/T),Math.floor(y/T),'burnt',landClock);}
 }
 function drawBeam(){
   if(!beamOn())return;const p=bridge().game.player,k=frameView.k,u=rage.t-LAND.beamFrom,fadeIn=Math.min(1,u/.15),fadeOut=Math.min(1,(LAND.beamTime-u)/.2),a=fadeIn*fadeOut;
   const m=beamMouth(p,rage.aim),S=screen(m.x,m.y),lift=Number(E()?.LIFT||bridge()?.lift)||18;
   const end=screen(p.x+Math.cos(rage.aim)*LAND.beamLen,p.y-lift+Math.sin(rage.aim)*LAND.beamLen),ang=Math.atan2(end.y-S.y,end.x-S.x),L=Math.hypot(end.x-S.x,end.y-S.y);
   const W=LAND.beamWidth*k*(1+.08*Math.sin(landClock*40));
   ctx.save();ctx.translate(S.x,S.y);ctx.rotate(ang);ctx.globalAlpha=a;
   // dark red outer aura, then red, orange, gold and a white-hot core
   ctx.globalCompositeOperation='source-over';let g=ctx.createLinearGradient(0,-W*1.6,0,W*1.6);g.addColorStop(0,'rgba(80,0,0,0)');g.addColorStop(.5,'rgba(120,0,0,.55)');g.addColorStop(1,'rgba(80,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,-W*1.6,L,W*3.2);
   ctx.globalCompositeOperation='lighter';
   for(const [w,col,al] of [[1,'255,40,10',.75],[.62,'255,130,30',.85],[.36,'255,215,90',.95],[.14,'255,255,235',1]]){g=ctx.createLinearGradient(0,-W*w,0,W*w);g.addColorStop(0,'rgba('+col+',0)');g.addColorStop(.5,'rgba('+col+','+al+')');g.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=g;ctx.fillRect(0,-W*w,L,W*w*2);}
   // energy rings racing down the beam, and sparks
   ctx.strokeStyle='rgba(255,225,140,.7)';ctx.lineWidth=2.5*k;for(let i=0;i<9;i++){const d=((u*1400+i*L/9)%L);ctx.beginPath();ctx.ellipse(d,0,W*.18,W*.85,0,0,TAU);ctx.stroke();}
   ctx.fillStyle='rgba(255,240,180,.9)';for(let i=0;i<26;i++){const d=Math.random()*L,o=(Math.random()-.5)*W*1.4;ctx.fillRect(d,o,3*k,2*k);}
   ctx.restore();
   // blazing glow at Groudon's mouth
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;g=ctx.createRadialGradient(S.x,S.y,0,S.x,S.y,W*.75);g.addColorStop(0,'rgba(255,255,230,.95)');g.addColorStop(.35,'rgba(255,200,80,.7)');g.addColorStop(1,'rgba(255,30,0,0)');
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(S.x,S.y,W*.75,0,TAU);ctx.fill();ctx.restore();
 }
 function drawRage(){
   const v=frameView,R=v.rect,k=v.k,p=bridge().game.player,c=screen(p.x,p.y-(Number(p.bodyH)||40)*.45),t=landClock;
   ctx.save();
   if(rage){const e=rage.t,N=LAND.rageNukeAt,end=LAND.rageTime;
     // dark red tint over everything for the whole 5 s
     ctx.fillStyle='rgba(70,0,0,'+(.55*Math.min(1,e/.4)*(e>end-.6?(end-e)/.6:1))+')';ctx.fillRect(R.left,R.top,R.width,R.height);
     // the giant red Omega
     if(symbolRed){const a=(e<LAND.beamFrom?Math.min(1,e/.5):e<N?.22:Math.min(1,(e-N)/.15))*(e>end-.8?Math.max(0,(end-e)/.8):1),W=Math.min(R.width,R.height)*(.7+.08*Math.sin(e*7)),H=W*symbolRed.height/symbolRed.width;
       ctx.globalAlpha=a*.9;ctx.globalCompositeOperation='lighter';ctx.drawImage(symbolRed,R.left+R.width/2-W/2,R.top+R.height/2-H/2,W,H);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
     drawBeam();
     if(e>=N){const u=e-N;
       // the heat wave rolling across the whole map
       const ring=u*2400*k;ctx.globalCompositeOperation='lighter';
       for(const [w,col] of [[60,'255,60,20'],[24,'255,170,80'],[8,'255,240,200']]){ctx.strokeStyle='rgba('+col+','+Math.max(0,.95-u*.45)+')';ctx.lineWidth=w*k*Math.max(.2,1-u*.3);ctx.beginPath();ctx.ellipse(c.x,c.y,ring,ring*.62,0,0,TAU);ctx.stroke();}
       ctx.globalCompositeOperation='source-over';
       // blinding flash: white, then burning red
       const blind=u<.15?1:Math.max(0,1-(u-.15)/1.6);
       ctx.fillStyle='rgba(255,250,240,'+(blind*(u<.6?1:Math.max(0,1-(u-.6)/.5)))+')';ctx.fillRect(R.left,R.top,R.width,R.height);
       ctx.fillStyle='rgba(255,40,10,'+(.55*blind)+')';ctx.fillRect(R.left,R.top,R.width,R.height);
       // heat haze rolling over the screen
       ctx.globalCompositeOperation='lighter';ctx.lineWidth=8;for(let i=0;i<14;i++){const y=R.top+((i/14*R.height+u*300)%R.height);ctx.strokeStyle='rgba(255,90,40,'+(.14*Math.max(0,1-u/4))+')';ctx.beginPath();
         for(let x=0;x<=R.width;x+=30){const yy=y+Math.sin(x*.02+u*10+i)*9;x?ctx.lineTo(R.left+x,yy):ctx.moveTo(R.left+x,yy);}ctx.stroke();}
     }else if(e<LAND.beamFrom){ // charging: red heat gathering around Groudon
       ctx.globalCompositeOperation='lighter';const q=e/LAND.beamFrom,g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,200*k*(.4+q));g.addColorStop(0,'rgba(255,200,160,'+(.8*q)+')');g.addColorStop(1,'rgba(255,20,0,0)');
       ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y,200*k*(.4+q),0,TAU);ctx.fill();}
   }else if(p.psEnraged){ // enraged aura: a red, flickering heat glow around Groudon
     ctx.globalCompositeOperation='lighter';const r=(Number(p.bodyH)||40)*k*(1.1+.08*Math.sin(t*9)),g=ctx.createRadialGradient(c.x,c.y,r*.2,c.x,c.y,r);
     g.addColorStop(0,'rgba(255,60,20,.0)');g.addColorStop(.6,'rgba(255,40,10,.22)');g.addColorStop(1,'rgba(255,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y,r,0,TAU);ctx.fill();
   }
   ctx.restore();
 }
 function updateLand(dt){
   const p=bridge().game.player;landClock+=dt;hookWorld();
   if(deltaStream()){roar=null;updateRage(dt,p);return;}   // only Groudon's own Enraged state survives the winds
   scorchAround(p.x,p.y,LAND.trail,landClock);
   // The domain slowly turns to desert: blobs grow outward from Groudon until the whole circle has changed.
   // Each tile heats up while it is inside the domain (faster near Groudon) and changes once hot enough.
   const T=tileSize(),R=LAND.radius,t0=Math.floor((p.x-R)/T),t1=Math.floor((p.x+R)/T),u0=Math.floor((p.y-R)/T),u1=Math.floor((p.y+R)/T);
   if(heat.size>20000)heat.clear();
   for(let ty=u0;ty<=u1;ty++)for(let tx=t0;tx<=t1;tx++){const k0=key(tx,ty);if(scorched.has(k0))continue;
     const x=(tx+.5)*T,y=(ty+.5)*T,d=Math.hypot(x-p.x,y-p.y)/R;if(d>1)continue;
     const h=(heat.get(k0)||0)+dt*(1.6-d);heat.set(k0,h);
     if(h<LAND.spreadTime*(.3+.7*noise(tx,ty,4)))continue;heat.delete(k0);
     let k='floor';try{k=E().World.kindAt(x,y);}catch(e){}
     if(k!=='wall')scorch(tx,ty,kindFor(x,y,tx,ty),landClock);}
   domainFoes(dt);
   quakeIn-=dt;if(quakeIn<=0){quakeWave();quakeIn=LAND.quakeEvery;}
   for(let i=pendingQuakes.length-1;i>=0;i--){pendingQuakes[i]-=dt;if(pendingQuakes[i]<=0){pendingQuakes.splice(i,1);quake(p);}}
   if(!updateRage(dt,p))updateRoar(dt,p);
   for(const q of quakes)q.t+=dt;for(let i=quakes.length-1;i>=0;i--)if(quakes[i].t>1.2)quakes.splice(i,1);
 }

 // ---- overlay: harsh sunlight from the sky + heat shimmer + lens glare, confusion stars, quake cracks ----
 function drawSky(){
   const v=frameView,R=v.rect,k=v.k,p=domOwner()||bridge().game.player,t=landClock;
   ctx.save();
   // warm heat tint and a hot vignette
   ctx.fillStyle='rgba(255,150,60,.07)';ctx.fillRect(R.left,R.top,R.width,R.height);
   let g=ctx.createRadialGradient(R.left+R.width/2,R.top+R.height/2,Math.min(R.width,R.height)*.35,R.left+R.width/2,R.top+R.height/2,Math.max(R.width,R.height)*.75);
   g.addColorStop(0,'rgba(255,120,30,0)');g.addColorStop(1,'rgba(200,60,10,.28)');ctx.fillStyle=g;ctx.fillRect(R.left,R.top,R.width,R.height);
   ctx.globalCompositeOperation='lighter';
   // sunbeams pouring down from the top of the screen at a slant
   const src={x:R.left+R.width*.18,y:R.top-R.height*.25};
   for(let i=0;i<7;i++){
     const base=R.left+R.width*(.02+i*.16)+Math.sin(t*.35+i*1.7)*R.width*.03,w=R.width*(.035+.025*Math.sin(i*2.3))*(1+.15*Math.sin(t*.8+i)),
       a=.13+.06*Math.sin(t*1.1+i*2.1),len=R.height*1.25;
     const ang=Math.atan2(R.top+len-src.y,base-src.x);
     g=ctx.createLinearGradient(base,R.top,base+Math.cos(ang)*len*.3,R.top+len);g.addColorStop(0,'rgba(255,250,215,'+a+')');g.addColorStop(.6,'rgba(255,200,110,'+a*.45+')');g.addColorStop(1,'rgba(255,160,60,0)');
     ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(base-w*.35,R.top);ctx.lineTo(base+w*.35,R.top);ctx.lineTo(base+w+len*.32,R.top+len);ctx.lineTo(base-w+len*.32,R.top+len);ctx.closePath();ctx.fill();
   }
   // the sun glaring on the "glass": a hot bloom in the corner and a trail of lens flares
   g=ctx.createRadialGradient(src.x,R.top,0,src.x,R.top,R.height*.55);g.addColorStop(0,'rgba(255,252,230,.55)');g.addColorStop(.25,'rgba(255,215,140,.22)');g.addColorStop(1,'rgba(255,150,60,0)');
   ctx.fillStyle=g;ctx.fillRect(R.left,R.top,R.width,R.height*.6);
   const cx=R.left+R.width/2,cy=R.top+R.height/2;
   for(const [f,r,c,a] of [[.35,26,'255,230,170',.18],[.6,14,'255,190,120',.22],[.85,40,'255,170,90',.1],[1.25,20,'255,240,200',.16],[1.5,60,'255,140,60',.07]]){
     const fx=src.x+(cx-src.x)*f*1.2,fy=R.top+(cy-R.top)*f*1.2;g=ctx.createRadialGradient(fx,fy,0,fx,fy,r*Math.max(1,k));
     g.addColorStop(0,'rgba('+c+','+a+')');g.addColorStop(.7,'rgba('+c+','+a*.5+')');g.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(fx,fy,r*Math.max(1,k),0,TAU);ctx.fill();}
   // heat shimmer: faint wavy bands drifting upward
   ctx.lineWidth=2;for(let i=0;i<9;i++){const y=R.top+((i/9*R.height-(t*38)%(R.height/9)+R.height)%R.height);
     ctx.strokeStyle='rgba(255,235,200,.05)';ctx.beginPath();for(let x=0;x<=R.width;x+=24){const yy=y+Math.sin(x*.025+t*3+i)*4;x?ctx.lineTo(R.left+x,yy):ctx.moveTo(R.left+x,yy);}ctx.stroke();}
   ctx.globalCompositeOperation='source-over';
   // heat motes rising inside the domain, and its shimmering edge
   const c=screen(p.x,p.y),rad=LAND.radius*k;
   while(motes.length<70){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*LAND.radius;motes.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,vy:-(25+Math.random()*45),life:1+Math.random()*1.6,t:0,c:Math.random()<.5?'#ffd27a':'#fff2c4'});}
   for(let i=motes.length-1;i>=0;i--){const m=motes[i];m.t+=1/60;m.y+=m.vy/60;if(m.t>m.life){motes.splice(i,1);continue;}const s=screen(m.x,m.y);ctx.globalAlpha=Math.sin(Math.PI*m.t/m.life)*.7;ctx.fillStyle=m.c;ctx.fillRect(Math.round(s.x),Math.round(s.y),2*Math.max(1,k*.8),2*Math.max(1,k*.8));}
   ctx.globalAlpha=.35+.12*Math.sin(t*3);ctx.strokeStyle='#ffb347';ctx.lineWidth=3;ctx.setLineDash([16,12]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.arc(c.x,c.y,rad,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
   // cracked ground where Bulldoze / Earthquake hit
   for(const q of quakes){const s=screen(q.x,q.y),f=1-q.t/1.2,R2=q.R*k;ctx.strokeStyle='rgba(60,30,15,'+(.8*f)+')';ctx.lineWidth=(q.eq?3:2)*Math.max(1,k*.7);
     for(let i=0;i<(q.eq?9:6);i++){const a=i*TAU/(q.eq?9:6)+q.seed;ctx.beginPath();ctx.moveTo(s.x,s.y);let x=s.x,y=s.y;for(let n=1;n<=4;n++){const b=a+Math.sin(q.seed+i*3+n)*.35;x=s.x+Math.cos(b)*R2*n/4*.9;y=s.y+Math.sin(b)*R2*n/4*.55;ctx.lineTo(x,y);}ctx.stroke();}
     if(q.t<.25){ctx.fillStyle='rgba(255,180,90,'+(.35*(1-q.t/.25))+')';ctx.beginPath();ctx.ellipse(s.x,s.y,R2,R2*.6,0,0,TAU);ctx.fill();}}
   // confused foes: little stars circling their heads
   for(const [e,s] of inside){if(!(s.cf>0)||e.dead)continue;const h=Number(e.bodyH)||24,s0=screen(e.x,e.y-h-6);
     for(let i=0;i<3;i++){const a=t*5+i*TAU/3,x=s0.x+Math.cos(a)*10*k,y=s0.y+Math.sin(a)*3.5*k;ctx.fillStyle=i%2?'#fff4a8':'#ffd23f';
       ctx.beginPath();for(let j=0;j<10;j++){const rr=j%2?1.6*k:4*k,aa=j*TAU/10-Math.PI/2;ctx.lineTo(x+Math.cos(aa)*rr,y+Math.sin(aa)*rr);}ctx.closePath();ctx.fill();}}
   ctx.restore();
 }
 function update(dt){
   if(!scene)return;scene.t+=dt;
   if(!scene.revealed&&scene.t>=REVEAL){scene.player.anim=scene.next;scene.revealed=true;sound('cry');}
   if(scene.t>=REVEAL&&scene.t<END){scene.kickIn-=dt;if(scene.kickIn<=0){kick(.07*(1-(scene.t-REVEAL)/(END-REVEAL)));scene.kickIn=.09;}}
   if(scene.t>=END)scene=null;
 }
 function frame(ts){
   requestAnimationFrame(frame);const b=bridge(),p=b?.game?.player,dt=Math.min(.04,last?(ts-last)/1000:0);last=ts;
   if(!p||p.megaForm!==FORM){enraged=false;rage=null;}
   const own=domOwner();viewOnly=!!own&&own!==p;
   if(!own){if(scene)clear();if(scorched.size&&(!p||p.megaForm!==FORM)){scorched.clear();heat.clear();inside.clear();quakes.length=0;pendingQuakes.length=0;fires.length=0;roar=null;roarIn=LAND.roarEvery;rage=null;enraged=false;}canvas.style.display='none';return;}
   if(scene&&own!==scene.player)clear();
   if(b.game.state!=='playing'){canvas.style.display='none';return;}
   frameView=view();if(!frameView)return;
   const dpr=Math.min(2,devicePixelRatio||1),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}
   canvas.style.display='block';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
   update(dt);if(landOn()&&!viewOnly)updateLand(dt);else if(landOn())landClock+=dt;
   ctx.save();ctx.beginPath();ctx.rect(frameView.rect.left,frameView.rect.top,frameView.rect.width,frameView.rect.height);ctx.clip();
   if(landOn()){if(!deltaStream()){const ob=window.PS_PRIMAL_OUTBREAK,split=!!ob?.active?.();   // Primal Outbreak: Desolate Land only fills Groudon's half
     if(split){ctx.save();ob.clip(ctx,'groudon');}drawSky();if(split)ctx.restore();drawRoar();}drawRage();}transformation();ctx.restore();
 }
 requestAnimationFrame(frame);
})();
