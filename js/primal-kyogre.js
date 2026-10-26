/* Primordial Sea. All hazards are stored in world coordinates; rendering never moves actors. */
(()=>{'use strict';
 const FORM='382-primal',TAU=Math.PI*2,REVEAL=3.25,END=5.8;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
 const bridge=()=>window.PS_MEGA_BRIDGE_V5;
 const canvas=document.createElement('canvas');canvas.id='ps-kyogre-fx';canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:3;display:none';document.body.append(canvas);
 const ctx=canvas.getContext('2d');
 let owner=null,scene=null,clock=0,last=0,spawnIn=0,thunderIn=0,frameView=null;
 // [Gard co-op] a teammate's Primordial Sea is seen (visual only) while you stand inside its domain
 let viewOnly=false;const DOMAIN_R=430;
 function remoteOwner(){const b=bridge(),p=b?.game?.player;if(!p)return null;let best=null,bd=DOMAIN_R;for(const q of b?.game?.everyone?.()||[]){if(!q||q===p||q.dead||q.megaForm!==FORM||!Number.isFinite(q.x))continue;const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best=q;}}return best;}
 const spouts=[],strikes=[],rain=[],assets={tornado:null,lightning:[]};
 const image=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});
 async function sheet(path,mime){const r=await fetch(path);if(!r.ok)throw new Error('Missing effect asset: '+path);return image('data:'+mime+';base64,'+(await r.text()).trim());}
 sheet('assets/fx/primal-water-tornado.base64','image/png').then(img=>{assets.tornado=img;}).catch(console.warn);
 // Remove the exterior white matte, preserving enclosed white lightning cores and the original gold shading.
 function cutLightning(img,box){
   const [sx,sy,w,h]=box,c=document.createElement('canvas');c.width=w;c.height=h;
   const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,sx,sy,w,h,0,0,w,h);
   const data=g.getImageData(0,0,w,h),p=data.data,outside=new Uint8Array(w*h),queue=[];
   const white=i=>Math.min(p[i*4],p[i*4+1],p[i*4+2])>222;
   const add=i=>{if(i>=0&&i<w*h&&!outside[i]&&white(i)){outside[i]=1;queue.push(i);}};
   for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
   for(let n=0;n<queue.length;n++){const i=queue[n];if(i%w)add(i-1);if(i%w<w-1)add(i+1);add(i-w);add(i+w);}
   for(let i=0;i<w*h;i++){
     const j=i*4;if(outside[i]){p[j+3]=0;continue;}
     // Undo the white matte at the outer edge rather than painting every pixel yellow.
     const edge=(i%w&&outside[i-1])||(i%w<w-1&&outside[i+1])||outside[i-w]||outside[i+w];
     if(edge){const a=clamp((255-Math.min(p[j],p[j+1],p[j+2]))/95);p[j+3]=Math.round(a*255);
       if(a>0)for(let k=0;k<3;k++)p[j+k]=clamp((p[j+k]-255*(1-a))/a,0,255);}
   }
   g.putImageData(data,0,0);return c;
 }
 sheet('assets/fx/primal-lightning.base64','image/jpeg').then(img=>{
   assets.lightning=[[7,231,108,108],[128,231,94,109]].map(box=>cutLightning(img,box));
 }).catch(console.warn);
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
   scene=null;owner=null;spouts.length=strikes.length=rain.length=0;spawnIn=thunderIn=0;clock=0;canvas.style.display='none';
 }
 // Called at the real evolution event: the original animator stays visible until the shell breaks.
 // Sounds: the Primal Reversion sound plays as the transformation starts, the Primal Kyogre cry when the orb cracks.
 // Drop the ORAS Primal Reversion sound in at assets/sfx/primal-reversion.mp3 (silently skipped if it is missing).
 const SOUNDS={reversion:'assets/sfx/primal-reversion.mp3',cry:'assets/cries/382-primal.mp3'},audio={};
 for(const [k,src] of Object.entries(SOUNDS)){try{const a=new Audio(src);a.preload='auto';a.onerror=()=>{audio[k]=null;};audio[k]=a;}catch(e){}}
 function sound(k){const a=audio[k];if(!a)return;
   try{const sv=Number(window.PS_MEGA_BRIDGE_V5?.audio?.settings?.sfx);a.volume=Math.max(0.15,Math.min(1,(Number.isFinite(sv)?sv:0.7)*1.2));a.currentTime=0;a.play().catch(()=>{});}catch(e){}}
 function begin(p,previous,next){
   clear();owner=p;scene={player:p,previous,next,t:0,revealed:false,kickIn:0};sound('reversion');
   p.anim=previous;p.invuln=Math.max(p.invuln||0,REVEAL+.2);
 }
 // a teammate turning Primal near you: the same Reversion scene, visual only
 function beginRemote(p,previous,next){const me=bridge()?.game?.player;if(me&&me.megaForm===FORM){p.anim=next;return;}begin(p,previous,next);}
 window.PS_PRIMAL_KYOGRE={begin,beginRemote,radius:DOMAIN_R};
 function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}}
 function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(20,130,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 // Filled silhouette traced from the supplied Blue Orb insignia (no doubled outline).
 function crest(x,y,r,alpha){
   ctx.save();ctx.translate(x+r*.11,y);ctx.scale(r/800,r/800);ctx.globalAlpha=alpha;
   ctx.fillStyle='#7ffbff';ctx.shadowColor='#20dfff';ctx.shadowBlur=18;
   ctx.beginPath();ctx.arc(-260,0,285,0,TAU);ctx.arc(-260,0,191,0,TAU,true);ctx.fill('evenodd');
   for(const sign of [-1,1]){ctx.beginPath();[[ -165,-270],[ -39,-326],[ -23,-405],[341,-532],[371,-447],[55,-336],[39,-261],[-70,-211]].forEach(([a,b],i)=>i?ctx.lineTo(a,b*sign):ctx.moveTo(a,b*sign));ctx.closePath();ctx.fill();}
   ctx.restore();
 }
 // A triangulated hemisphere produces a solid gem, rather than transparent slices meeting at the center.
 function crystal(x,y,r,t){
   const bands=4,sectors=11,vertices=[];
   for(let band=0;band<=bands;band++){
     const phi=(band/bands)*Math.PI/2,ring=[];
     for(let i=0;i<sectors;i++){const a=i*TAU/sectors+(band%2)*.1+t*.075;ring.push({x:x+Math.cos(a)*Math.sin(phi)*r,y:y+Math.sin(a)*Math.sin(phi)*r,z:Math.cos(phi)});}vertices.push(ring);
   }
   const outline=vertices[bands];ctx.save();polygon(outline,'#061b42');ctx.clip();
   for(let band=0;band<bands;band++)for(let i=0;i<sectors;i++){
     const n=(i+1)%sectors,a=vertices[band][i],b=vertices[band+1][i],c=vertices[band+1][n],d=vertices[band][n];
     for(const [j,tri] of [[0,[a,b,c]],[1,[a,c,d]]]){
       const seed=(i*17+band*23+j*11)%19,light=seed/19,front=1-band/bands;
       polygon(tri,'rgb('+Math.round(7+light*18)+','+Math.round(25+light*36+front*8)+','+Math.round(55+light*60+front*15)+')','rgba(114,201,237,.12)');
     }
   }
   const sheen=ctx.createLinearGradient(x-r,y-r,x+r,y+r);sheen.addColorStop(0,'rgba(141,224,255,.3)');sheen.addColorStop(.35,'rgba(54,128,209,.03)');sheen.addColorStop(1,'rgba(0,4,23,.45)');ctx.fillStyle=sheen;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
   ctx.strokeStyle='rgba(102,216,255,.6)';ctx.lineWidth=1.5;ctx.beginPath();outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();
 }
 function transformation(){
   if(!scene)return;
   const p=scene.player,t=scene.t,k=frameView.k,pos=screen(p.x,p.y-(Number(p.bodyH)||40)*.45);
   const r=clamp(Math.max((p.r||16)*2.5,(p.bodyH||40)*.9),50,95)*k;
   const jitter=t>2.45&&t<REVEAL?(Math.sin(t*68)+Math.sin(t*111))*(t-2.45)*3*k:0,x=pos.x+jitter,y=pos.y;
   ctx.save();
   if(t<REVEAL){
     ctx.fillStyle='rgba(0,8,30,'+(.25*ease(t/.5))+')';ctx.fillRect(frameView.rect.left,frameView.rect.top,frameView.rect.width,frameView.rect.height);
     glow(x,y,r*2.1,'rgba(0,173,250,'+(.25+.1*Math.sin(t*3))+')');
     // Only the gathering phase uses orbiting water. It settles before the crystal hold.
     if(t<1.15){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-ease((t-.7)/.45);
       for(let i=0;i<24;i++){const a=i*2.4+t*2.8,d=r*(1+(1-ease(t/.9))*1.3),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.8;
         ctx.strokeStyle=i%3?'#30bcff':'#c0ffff';ctx.lineWidth=(1+i%2)*k;ctx.beginPath();ctx.arc(x,y,d,a,a+.08);ctx.stroke();glow(px,py,4*k,'rgba(131,247,255,.65)');}ctx.restore();}
     const size=r*(.15+.85*ease(t/.7));
     if(t<.9){const g=ctx.createRadialGradient(x-size*.3,y-size*.4,0,x,y,size);g.addColorStop(0,'#63d8ff');g.addColorStop(.3,'#145bba');g.addColorStop(1,'#061333');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();}
     ctx.save();ctx.globalAlpha=ease((t-.55)/.45);crystal(x,y,size,t);ctx.restore();
     crest(x,y,size*1.2,ease((t-.75)/.55));
     if(t>2.85){const crack=clamp((t-2.85)/.32);ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.clip();ctx.shadowColor='#b4ffff';ctx.shadowBlur=9*k;
       for(let i=0;i<6;i++){const a=i*TAU/6+.23*Math.sin(i*7);ctx.strokeStyle='#d9faff';ctx.lineWidth=(.65+crack*.55)*k;ctx.beginPath();
         for(let n=0;n<=5;n++){const d=r*n/5*crack,b=a+Math.sin(i*13+n*5)*.09,px=x-r*.12+Math.cos(b)*d,py=y+r*.08+Math.sin(b)*d;n?ctx.lineTo(px,py):ctx.moveTo(px,py);if(n===3){ctx.lineTo(px+Math.cos(b+.6)*r*.18,py+Math.sin(b+.6)*r*.18);ctx.moveTo(px,py);}}ctx.stroke();}ctx.restore();}
   }else{
     const e=t-REVEAL,fade=clamp(1-e/.85);
     if(e<1.35){ctx.save();ctx.globalCompositeOperation='lighter';glow(x,y-r*.45,r*1.5,'rgba(35,211,255,'+(.25*clamp(1-e/1.35))+')');crest(x,y-r*(.55+e*.3),r*.9,clamp(1-e/1.35)*.65);ctx.restore();}
     if(e<.85){
       for(let i=0;i<22;i++){const a=i*2.4,dist=r*(.75+e*(2+i%4*.2)),px=x+Math.cos(a)*dist,py=y+Math.sin(a)*dist+e*e*50*k,s=(8+i%5*3)*k,spin=a+e*(i%2?2:-2);
         ctx.save();ctx.translate(px,py);ctx.rotate(spin);ctx.globalAlpha=fade;polygon([{x:-s,y:-s*.6},{x:s,y:-s*.2},{x:s*.3,y:s}],i%3?'#175c9b':'#a4f7ff','#5ddfff');ctx.restore();}
       ctx.strokeStyle='rgba(107,233,255,'+fade*.8+')';ctx.lineWidth=4*k*fade;ctx.beginPath();ctx.ellipse(x,y+r*.5,r*(1+e*3),r*(.3+e),0,0,TAU);ctx.stroke();
       const flash=clamp(1-e/.2);ctx.fillStyle='rgba(214,252,255,'+flash*.78+')';ctx.fillRect(frameView.rect.left,frameView.rect.top,frameView.rect.width,frameView.rect.height);
     }
   }
   ctx.restore();
 }
 function randomPoint(){
   const v=frameView,w=v.rect.width/v.k,h=v.rect.height/v.k,near=Math.random()<.5;
   const radius=near?120+Math.random()*160:Math.min(w,h)*(.42+Math.random()*.32),angle=Math.random()*TAU;
   return {x:clamp(owner.x+Math.cos(angle)*radius,v.left+w*.05,v.left+w*.95),y:clamp(owner.y+Math.sin(angle)*radius,v.top+h*.08,v.top+h*.92)};
 }
 function spawnSpout(){
   let q=randomPoint();for(let i=0;i<12&&spouts.some(s=>Math.hypot(s.x-q.x,s.y-q.y)<260);i++)q=randomPoint();
   if(spouts.some(s=>Math.hypot(s.x-q.x,s.y-q.y)<200))return;
   spouts.push({...q,age:0,life:12+Math.random()*4,phase:Math.random()*9,vx:(Math.random()-.5)*12,vy:(Math.random()-.5)*8,size:235+Math.random()*35,damageAt:new WeakMap()});
 }
 function moveUnit(e,dx,dy){
   const w=bridge()?.world,r=Math.min(e.r||10,18);
   const clear=(x,y)=>!w?.isWall||(!w.isWall(x-r,y)&&!w.isWall(x+r,y)&&!w.isWall(x,y-r)&&!w.isWall(x,y+r));
   if(clear(e.x+dx,e.y))e.x+=dx;if(clear(e.x,e.y+dy))e.y+=dy;
 }
 function currents(dt){
   if(viewOnly)return;   // a teammate's sea: you only see it
   const b=bridge(),enemies=new Set(b?.enemies?.all?.()||[]),actors=new Set([...enemies,...(b?.game?.everyone?.()||[])]);
   for(const e of actors){if(!e||e===owner||e.dead||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
     const hostile=enemies.has(e),punishment=hostile?1:.5;
     // Rough sea currents surge in all directions across the map, making enemies fight to approach.
     const heading=clock*1.1+e.x*.012+Math.sin(e.y*.009+clock*.7)*1.7;
     let vx=Math.cos(heading)*245,vy=Math.sin(heading)*245;
     for(const q of spouts){const dx=q.x-e.x,dy=q.y-e.y,d=Math.hypot(dx,dy),reach=q.size*.75;if(d>=reach||d<1)continue;
       const f=(1-d/reach)*ease(q.age/.7)*ease((q.life-q.age)/.8),pull=210*f;
       vx+=dx/d*pull-dy/d*78*f;vy+=dy/d*pull+dx/d*78*f;
       if(enemies.has(e)&&d<q.size*.32&&typeof e.hurt==='function'){
         const lastHit=q.damageAt.get(e)??-Infinity;
         if(clock-lastHit>=.35){e.hurt(Math.max(1,(Number(e.maxHp)||Number(e.hp)||40)*.006),'#39caff',0,0,0);q.damageAt.set(e,clock);}
       }
     }
     const speed=Math.hypot(vx,vy),cap=Math.min(1,330/(speed||1));moveUnit(e,vx*cap*dt*punishment,vy*cap*dt*punishment);
     // The whole primal sea slows enemies by 80%; allies receive half-duration, half-strength current effects.
     if(hostile&&typeof e.applySlow==='function')e.applySlow(.8,.65);
     else if(!hostile&&typeof e.slowT==='number'){e.seaSlowFactor=.6;e.slowT=Math.max(e.slowT,.35);}
   }
 }
 function strikeDamage(q){
   if(viewOnly)return;
   const b=bridge(),enemies=new Set(b?.enemies?.all?.()||[]),actors=new Set([...enemies,...(b?.game?.everyone?.()||[])]),radius=58;
   for(const e of actors){if(!e||e===owner||e.dead||q.hit.has(e)||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
     const d=Math.hypot(e.x-q.x,e.y-q.y);if(d>radius+(e.r||0))continue;
     const max=Number(e.maxHp)||Number(e.hp)||40,damage=Math.max(1,max*.025)*(enemies.has(e)?1:.5);
     if(typeof e.hurt==='function'){e.hurt(damage,'#ffe76b',0,0,0);q.hit.add(e);}
   }
 }
 const deltaStream=()=>!!window.PS_DELTA_STREAM?.active?.();
 function update(dt){
   clock+=dt;
   if(scene&&(Number(scene.player.dex)!==382||scene.player.megaForm!==FORM))scene=null;
   if(scene){scene.t+=dt;
     if(!scene.revealed&&scene.t>=REVEAL){scene.player.anim=scene.next;scene.revealed=true;sound('cry');}
     if(scene.t>=REVEAL&&scene.t<END){scene.kickIn-=dt;if(scene.kickIn<=0){kick(.07*(1-(scene.t-REVEAL)/(END-REVEAL)));scene.kickIn=.09;}}
     if(scene.t>=END)scene=null;
   }
   if(scene&&!scene.revealed)return;
   if(deltaStream()){spouts.length=strikes.length=0;return;}   // Mega Rayquaza's Delta Stream negates the Primordial Sea
   spawnIn-=dt;if(spawnIn<=0){if(spouts.length<8)spawnSpout();spawnIn=1.5;}
   for(let i=spouts.length-1;i>=0;i--){const q=spouts[i];q.age+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.age>=q.life)spouts.splice(i,1);}
   thunderIn-=dt;if(thunderIn<=0){
     const count=1+Math.floor(Math.random()*8);
     for(let n=0;n<count;n++)strikes.push({...randomPoint(),age:-n*.065,variant:Math.floor(Math.random()*2),height:300+Math.random()*95,hit:new Set(),damaged:false});
     thunderIn=2.5;
   }
   for(let i=strikes.length-1;i>=0;i--){const q=strikes[i],was=q.age;q.age+=dt;if(!q.damaged&&was<.12&&q.age>=.12){q.damaged=true;strikeDamage(q);kick(.022);}if(q.age>.82)strikes.splice(i,1);}
   currents(dt);
 }
 function field(){
   const v=frameView,k=v.k,rect=v.rect;
   ctx.fillStyle='rgba(1,8,22,.42)';ctx.fillRect(rect.left,rect.top,rect.width,rect.height);
   ctx.fillStyle='rgba(2,22,61,.2)';ctx.fillRect(rect.left,rect.top,rect.width,rect.height);
   // Long low waves make the rough-water current visible at fixed world positions.
   ctx.save();ctx.strokeStyle='rgba(57,164,205,.28)';ctx.lineWidth=2.5*k;
   for(let yy=Math.floor(v.top/80)*80;yy<v.top+rect.height/k+80;yy+=80){ctx.beginPath();
     for(let xx=Math.floor(v.left/30)*30;xx<v.left+rect.width/k+30;xx+=30){const p=screen(xx,yy+Math.sin(xx*.015-clock*1.8)*12);xx===Math.floor(v.left/30)*30?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}ctx.stroke();}ctx.restore();
   for(const q of [...spouts].sort((a,b)=>a.y-b.y)){
     if(!assets.tornado)continue;const p=screen(q.x,q.y),f=Math.floor(q.age*10+q.phase)%9;
     // The reference uses 320px rows, with unused space below row three. Do not divide its height by three.
     const sw=333,sh=320,w=q.size*k,h=w*sh/sw;
     if(p.x+w<rect.left||p.x-w>rect.right||p.y+h<rect.top||p.y-h>rect.bottom)continue;
     const alpha=ease(q.age/.65)*ease((q.life-q.age)/.8);ctx.save();ctx.globalAlpha=alpha;
     ctx.fillStyle='rgba(0,15,29,.22)';ctx.beginPath();ctx.ellipse(p.x,p.y,w*.22,w*.045,0,0,TAU);ctx.fill();
     ctx.drawImage(assets.tornado,(f%3)*333,Math.floor(f/3)*320,sw,sh,p.x-w/2,p.y-h*.98,w,h);ctx.restore();
   }
   for(const q of strikes){const p=screen(q.x,q.y),age=q.age;if(age<0)continue;
     if(age<.12){const tell=age/.12;ctx.strokeStyle='rgba(255,249,191,'+(.65+.3*tell)+')';ctx.shadowColor='#fff19a';ctx.shadowBlur=26*k;ctx.lineWidth=(3+tell*3)*k;ctx.beginPath();ctx.ellipse(p.x,p.y,(35+tell*24)*k,(10+tell*7)*k,0,0,TAU);ctx.stroke();ctx.shadowBlur=0;continue;}
     const img=assets.lightning[q.variant];if(!img)continue;
     const flash=clamp(1-(age-.12)/.58),h=q.height*k,w=h*img.width/img.height;
     ctx.save();ctx.globalAlpha=flash;ctx.shadowColor='#fff8c7';ctx.shadowBlur=40*k;ctx.drawImage(img,p.x-w/2,p.y-h,w,h);glow(p.x,p.y,132*k,'rgba(255,238,133,'+flash*.98+')');
     if(age<.21){ctx.fillStyle='rgba(243,247,255,'+(.3*(1-(age-.12)/.09))+')';ctx.fillRect(rect.left,rect.top,rect.width,rect.height);}ctx.restore();
   }
   const count=Math.min(440,Math.round(rect.width*rect.height/2250));
   while(rain.length<count)rain.push({x:Math.random(),y:Math.random(),speed:.7+Math.random(),len:18+Math.random()*25});
   ctx.strokeStyle='rgba(178,222,239,.56)';ctx.lineWidth=1.35;ctx.beginPath();
   for(let i=0;i<count;i++){const q=rain[i],x=rect.left+((q.x-clock*.11)%1+1)%1*rect.width,y=rect.top+((q.y+clock*q.speed*2)%1)*rect.height;ctx.moveTo(x,y);ctx.lineTo(x-10,y+q.len);}ctx.stroke();
 }
 // ---- Glowing Water moves: while Primal, every Water move Kyogre uses glows like Origin Pulse ----
 // Water projectiles are found by their move type; beams, slashes, rings and splashes by the Water colour / palette.
 const glows=[],WATER_COL=/^#(4b9bff|7fc8ff)$/i;
 let fxHooked=false;
 function primalOn(){const b=bridge();return !!(owner&&owner.megaForm===FORM&&b?.game?.player===owner&&b.game.state==='playing');}
 function isWater(color,opts){return (opts&&opts.pal==='water')||WATER_COL.test(String(color||''));}
 function nearOwner(x,y,d){return Math.hypot(x-owner.x,y-owner.y)<d;}
 function addGlow(g){g.t=0;glows.push(g);if(glows.length>240)glows.splice(0,glows.length-240);}
 function hookFx(){
   const F=bridge()?.fx;if(fxHooked||!F||F.__psWaterGlow)return;fxHooked=F.__psWaterGlow=true;
   const wrap=(name,fn)=>{const orig=F[name];if(typeof orig!=='function')return;F[name]=function(...a){try{if(primalOn())fn(...a);}catch(e){}return orig.apply(this,a);};};
   wrap('beam',(x,y,ang,len,w,color,opts)=>{if(isWater(color,opts)&&nearOwner(x,y,110))addGlow({k:'beam',x,y,ang,len,w:Number(w)||24,life:.16});});
   wrap('slash',(x,y,ang,r,arc,color,opts)=>{if(isWater(color,opts)&&nearOwner(x,y,160))addGlow({k:'slash',x,y,ang,r:Number(r)||60,arc:Number(arc)||2,life:.28});});
   wrap('ring',(x,y,r0,r1,color,life)=>{if(isWater(color))addGlow({k:'ring',x,y,r0:Number(r0)||8,r1:Number(r1)||40,life:Math.max(.2,Number(life)||.3)});});
   wrap('burst',(x,y,color)=>{if(isWater(color))addGlow({k:'dot',x,y,r:24,life:.32});});
   wrap('spark',(x,y,color)=>{if(isWater(color))addGlow({k:'dot',x,y,r:15,life:.22});});
   wrap('sp',(shape,pal,x,y)=>{if(pal==='water')addGlow({k:'dot',x,y,r:13,life:.3});});
 }
 function halo(x,y,r,a=1){glow(x,y,r*2.8,'rgba(42,140,255,'+(.6*a)+')');glow(x,y,r*1.5,'rgba(127,216,255,'+(.95*a)+')');glow(x,y,r*.6,'rgba(255,255,255,'+a+')');}
 function waterGlow(dt){
   hookFx();
   for(const g of glows)g.t+=dt;for(let i=glows.length-1;i>=0;i--)if(glows[i].t>=glows[i].life)glows.splice(i,1);
   if(!primalOn()){glows.length=0;return;}
   const b=bridge(),k=frameView.k,lift=Number(b?.lift)||18,pulse=.85+.15*Math.sin(clock*9);
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
   for(const q of b?.projectiles?.all?.()||[]){
     if(!q||!q.friendly||q.ghost||q.mtype!=='water')continue;
     // fresh shots fade in, so a burst of bubbles leaving Kyogre doesn't stack into one white blob
     const s=screen(q.x,q.y-lift);halo(s.x,s.y,Math.max(6,Number(q.r)||6)*k*1.8*pulse,q.orb?1:clamp((Number(q.t)||0)/.15));
   }
   for(const g of glows){const f=1-g.t/g.life,s=screen(g.x,g.y);
     if(g.k==='dot'){halo(s.x,s.y,g.r*k*(.6+.4*f),f);continue;}
     const lines=[[2.2,'rgba(42,140,255,',.45],[1.2,'rgba(127,216,255,',.8],[.45,'rgba(255,255,255,',.95]];
     if(g.k==='beam'){const e=screen(g.x+Math.cos(g.ang)*g.len,g.y+Math.sin(g.ang)*g.len);
       for(const [w,c,a] of lines){ctx.strokeStyle=c+(a*f)+')';ctx.lineWidth=g.w*w*k*.55;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();}
       halo(s.x,s.y,g.w*.6*k,f);halo(e.x,e.y,g.w*.7*k,f);}
     else if(g.k==='slash'){for(const [w,c,a] of lines){ctx.strokeStyle=c+(a*f)+')';ctx.lineWidth=7*w*k;ctx.beginPath();ctx.arc(s.x,s.y,g.r*k,g.ang-g.arc/2,g.ang+g.arc/2);ctx.stroke();}}
     else if(g.k==='ring'){const r=(g.r0+(g.r1-g.r0)*(1-f*f))*k;for(const [w,c,a] of lines){ctx.strokeStyle=c+(a*f)+')';ctx.lineWidth=3.5*w*k;ctx.beginPath();ctx.arc(s.x,s.y,r,0,TAU);ctx.stroke();}}
   }
   ctx.restore();
 }
 function frame(ts){
   requestAnimationFrame(frame);const b=bridge(),p=b?.game?.player,dt=Math.min(.04,last?(ts-last)/1000:0);last=ts;
   const mine=!!(p&&!p.dead&&p.megaForm===FORM),o=mine?p:remoteOwner();
   if(!o){if(owner)clear();return;}
   // Loading an already transformed run should resume the field, not replay the evolution.
   if(owner!==o){if(!(scene&&scene.player===o))clear();owner=o;}
   viewOnly=!mine;
   if(b.game.state!=='playing'){canvas.style.display='none';return;}
   frameView=view();if(!frameView)return;
   const dpr=Math.min(2,devicePixelRatio||1),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}
   canvas.style.display='block';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
   update(dt);ctx.save();ctx.beginPath();ctx.rect(frameView.rect.left,frameView.rect.top,frameView.rect.width,frameView.rect.height);ctx.clip();if(!deltaStream()){const ob=window.PS_PRIMAL_OUTBREAK,split=!!ob?.active?.();if(split){ctx.save();ob.clip(ctx,'kyogre');}field();if(split)ctx.restore();}waterGlow(dt);   // Primal Outbreak: the sea only fills Kyogre's half
  transformation();ctx.restore();
 }
 requestAnimationFrame(frame);
})();

