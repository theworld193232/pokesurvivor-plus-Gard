/* Primal Kyogre transformation and field-wide Primordial Sea effects. */
(()=>{'use strict';
 const FORM='382-primal',TAU=Math.PI*2;
 let canvas,ctx,lastForm='',reversionAt=0,last=0,tornadoes=[],bolts=[],rain=[],fieldOn=false,nextBolt=0;
 const tornadoSheet=new Image(),boltSprite=new Image();
 fetch('assets/fx/primal-water-tornado.base64?v=1').then(r=>r.ok?r.text():'').then(data=>{if(data.trim())tornadoSheet.src='data:image/png;base64,'+data.trim();}).catch(()=>{});
 fetch('assets/fx/primal-lightning.base64?v=1').then(r=>r.ok?r.text():'').then(data=>{
   if(!data.trim())return;const src=new Image();src.onload=()=>{
     const c=document.createElement('canvas');c.width=64;c.height=144;const g=c.getContext('2d',{willReadFrequently:true});
     g.drawImage(src,372,0,64,144,0,0,64,144);const im=g.getImageData(0,0,64,144);
     for(let i=0;i<im.data.length;i+=4){const r=im.data[i],gg=im.data[i+1],b=im.data[i+2],lo=Math.min(r,gg,b),hi=Math.max(r,gg,b);
       im.data[i+3]=Math.max(0,Math.min(255,Math.round((255-lo)*1.45+(hi-lo)*.45)));im.data[i]=255;im.data[i+1]=231;im.data[i+2]=48;}
     g.putImageData(im,0,0);boltSprite.src=c.toDataURL('image/png');
   };src.src='data:image/jpeg;base64,'+data.trim();
 }).catch(()=>{});
 const $=id=>document.getElementById(id);
 function bridge(){return window.PS_MEGA_BRIDGE_V5;}
 function player(){return bridge()?.game?.player||null;}
 function setup(){
   canvas=$('ps-kyogre-fx');
   if(!canvas){canvas=document.createElement('canvas');canvas.id='ps-kyogre-fx';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3;display:none;';document.body.appendChild(canvas);}
   ctx=canvas.getContext('2d');
 }
 function resize(){
   const dpr=Math.min(2,window.devicePixelRatio||1),w=innerWidth,h=innerHeight;
   if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
   ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 function cameraView(){
   const b=bridge(),cam=b?.camera,g=$('game');
   if(cam&&g&&typeof cam.left==='function'&&Number.isFinite(cam.scale)){
     const r=g.getBoundingClientRect(),css=Number(cam._cw)>0?r.width/cam._cw:1,k=cam.scale*css;
     return {cam,g,r,k,left:cam.left(),top:cam.top()};
   }return null;
 }
 function worldToScreen(wx,wy){
   const v=cameraView();if(v)return {x:v.r.left+(wx-v.left)*v.k,y:v.r.top+(wy-v.top)*v.k,k:v.k};
   return {x:innerWidth/2,y:innerHeight/2,k:1};
 }
 function screenRectWorld(pad){
   const v=cameraView();
   if(v&&v.k>0)return {left:v.left+pad/v.k,top:v.top+pad/v.k,width:innerWidth/v.k-2*pad/v.k,height:innerHeight/v.k-2*pad/v.k};
   const p=player();return {left:(p?.x||0)-500,top:(p?.y||0)-350,width:1000,height:700};
 }
 function center(p){
   const q=worldToScreen(p.x,p.y),h=(Number(p.bodyH)||40)*q.k*.45;
   return {x:q.x,y:q.y-h,k:q.k};
 }
 function orbSymbol(x,y,r,t,alpha){
   const pulse=1+0.025*Math.sin(t*8),q=r*pulse;
   ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;ctx.shadowColor='#27aaff';ctx.shadowBlur=18;
   ctx.strokeStyle='#b8f4ff';ctx.lineWidth=Math.max(3,q*.105);ctx.lineCap='round';ctx.lineJoin='round';
   ctx.beginPath();ctx.arc(0,0,q*.43,0,TAU);ctx.stroke();
   ctx.beginPath();ctx.moveTo(q*.25,-q*.34);ctx.lineTo(q*.34,-q*.67);ctx.lineTo(q*.94,-q*.91);ctx.lineTo(q*1.02,-q*.73);ctx.lineTo(q*.51,-q*.54);ctx.lineTo(q*.49,-q*.35);
   ctx.moveTo(q*.25,q*.34);ctx.lineTo(q*.34,q*.67);ctx.lineTo(q*.94,q*.91);ctx.lineTo(q*1.02,q*.73);ctx.lineTo(q*.51,q*.54);ctx.lineTo(q*.49,q*.35);ctx.stroke();
   ctx.restore();
 }
 function drawReversion(p,t){
   const c=center(p),u=t-reversionAt,total=6.0,x=c.x,y=c.y,k=c.k;
   const gather=Math.max(0,Math.min(1,u/.72)),charge=Math.max(0,Math.min(1,(u-.65)/2.45));
   const orbR=(36+112*Math.min(1,u/.9))*k;
   const shake=u>2.45&&u<3.25?Math.sin(u*74)*5*k:0;
   const cx=x+shake,cy=y;
   if(u<3.55){
     // Focus the scene, then wrap Kyogre in a bright, layered ocean-energy shell.
     const dim=Math.min(.48,.12+u*.13);ctx.fillStyle='rgba(0,5,28,'+dim+')';ctx.fillRect(0,0,innerWidth,innerHeight);
     ctx.save();ctx.globalCompositeOperation='lighter';
     const aura=ctx.createRadialGradient(cx,cy,orbR*.08,cx,cy,orbR*1.9);
     aura.addColorStop(0,'rgba(85,239,255,.46)');aura.addColorStop(.42,'rgba(14,139,255,.26)');aura.addColorStop(1,'rgba(0,77,255,0)');
     ctx.fillStyle=aura;ctx.beginPath();ctx.arc(cx,cy,orbR*1.9,0,TAU);ctx.fill();
     // Fast ribbons orbit like the cyan energy loops in the reference.
     for(let i=0;i<3;i++){
       const a=u*(1.3+i*.23)+(i*TAU/3),rx=orbR*(1.08+i*.12),ry=orbR*(.34+i*.06);
       ctx.save();ctx.translate(cx,cy);ctx.rotate(a*.18);
       ctx.strokeStyle=i===1?'rgba(235,255,255,.95)':'rgba(45,221,255,.9)';ctx.lineWidth=(3+i)*k;
       ctx.shadowColor='#4de9ff';ctx.shadowBlur=16*k;ctx.beginPath();ctx.ellipse(0,0,rx,ry,a,0,TAU);ctx.stroke();ctx.restore();
     }
     // Moving sparks race around the shell and stream into it.
     for(let i=0;i<28;i++){
       const a=i*TAU/28-u*(1.5+(i%4)*.17),r=orbR*(1.22+.18*Math.sin(i*5+u*4));
       const px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r*.8,sz=(1.4+(i%3))*k;
       ctx.strokeStyle=i%3?'rgba(89,227,255,.82)':'rgba(245,255,255,.96)';ctx.lineWidth=sz;
       ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(a)*sz*5,py-Math.sin(a)*sz*5);ctx.stroke();
     }
     ctx.restore();
     if(u>.52){
       // Faceted blue shell: translucent enough to show Kyogre's silhouette inside.
       const shell=Math.min(1,(u-.52)/.38),fade=u>3.05?Math.max(0,1-(u-3.05)/.5):1,rr=orbR*shell;
       ctx.save();ctx.globalAlpha=fade;ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.clip();
       const g=ctx.createRadialGradient(cx-rr*.24,cy-rr*.3,rr*.05,cx,cy,rr*1.2);
       g.addColorStop(0,'rgba(107,246,255,.68)');g.addColorStop(.38,'rgba(18,159,255,.74)');g.addColorStop(.78,'rgba(5,77,205,.86)');g.addColorStop(1,'rgba(1,25,105,.94)');
       ctx.fillStyle=g;ctx.fillRect(cx-rr,cy-rr,rr*2,rr*2);
       for(let i=0;i<9;i++){
         const a=i*TAU/9-u*.12,ax=cx+Math.cos(a)*rr,ay=cy+Math.sin(a)*rr;
         const b=a+TAU/9,bx=cx+Math.cos(b)*rr,by=cy+Math.sin(b)*rr;
         ctx.fillStyle=i%2?'rgba(137,248,255,.12)':'rgba(0,53,168,.17)';
         ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ax,ay);ctx.lineTo(bx,by);ctx.closePath();ctx.fill();
       }
       ctx.restore();ctx.globalAlpha=1;
       ctx.strokeStyle='rgba(171,251,255,.95)';ctx.lineWidth=4*k;ctx.shadowColor='#38dfff';ctx.shadowBlur=22*k;
       ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();ctx.shadowBlur=0;
       // The Blue Orb mark becomes a luminous crystalline crest over the shell.
       if(u>.86){const emblem=rr*.54;
         ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(205,255,255,.96)';ctx.lineWidth=Math.max(5*k,emblem*.13);ctx.shadowColor='#7ff4ff';ctx.shadowBlur=18*k;
         ctx.beginPath();ctx.arc(cx,cy,emblem*.46,0,TAU);ctx.stroke();
         ctx.beginPath();ctx.moveTo(cx+emblem*.26,cy-emblem*.35);ctx.lineTo(cx+emblem*.40,cy-emblem*.73);ctx.lineTo(cx+emblem*1.04,cy-emblem*.98);ctx.lineTo(cx+emblem*1.11,cy-emblem*.74);ctx.lineTo(cx+emblem*.56,cy-emblem*.56);ctx.lineTo(cx+emblem*.5,cy-emblem*.36);
         ctx.moveTo(cx+emblem*.26,cy+emblem*.35);ctx.lineTo(cx+emblem*.40,cy+emblem*.73);ctx.lineTo(cx+emblem*1.04,cy+emblem*.98);ctx.lineTo(cx+emblem*1.11,cy+emblem*.74);ctx.lineTo(cx+emblem*.56,cy+emblem*.56);ctx.lineTo(cx+emblem*.5,cy+emblem*.36);ctx.stroke();ctx.restore();
       }
       // Cracks branch through the crystal before the shell breaks.
       if(u>2.42){const ca=Math.min(1,(u-2.42)/.2);ctx.save();ctx.globalAlpha=ca;ctx.strokeStyle='#f3ffff';ctx.lineWidth=3*k;ctx.shadowColor='#b9faff';ctx.shadowBlur=12*k;
         for(let i=0;i<5;i++){const a=i*TAU/5+.3,caX=cx+Math.cos(a)*rr*.12,caY=cy+Math.sin(a)*rr*.12;
           ctx.beginPath();ctx.moveTo(caX,caY);ctx.lineTo(cx+Math.cos(a+.1)*rr*.4,cy+Math.sin(a+.1)*rr*.4);ctx.lineTo(cx+Math.cos(a-.08)*rr*.62,cy+Math.sin(a-.08)*rr*.62);ctx.lineTo(cx+Math.cos(a)*rr*.96,cy+Math.sin(a)*rr*.96);ctx.stroke();}
         ctx.restore();}
     }
   }
   if(u>=3.12&&u<3.85){
     // The crystal bursts outward in bright facets and a water-blue shockwave.
     const e=Math.min(1,(u-3.12)/.65),fade=Math.max(0,1-e),rr=orbR;
     ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade;
     ctx.strokeStyle='rgba(196,251,255,.95)';ctx.lineWidth=8*k;ctx.beginPath();ctx.arc(x,y,rr*(.55+e*1.5),0,TAU);ctx.stroke();
     for(let i=0;i<18;i++){
       const a=i*TAU/18+.14*Math.sin(i*7),dist=rr*(.8+e*(1.3+(i%4)*.18));
       const px=x+Math.cos(a)*dist,py=y+Math.sin(a)*dist*.84,size=(12+(i%5)*4)*k;
       ctx.fillStyle=i%3?'rgba(53,203,255,.92)':'rgba(231,255,255,.98)';
       ctx.beginPath();ctx.moveTo(x+Math.cos(a)*rr*.48,y+Math.sin(a)*rr*.4);ctx.lineTo(px,py);ctx.lineTo(px-Math.sin(a)*size,py+Math.cos(a)*size);ctx.closePath();ctx.fill();
     }
     ctx.restore();
     if(u>3.45){const flash=Math.max(0,1-(u-3.45)/.22);ctx.fillStyle='rgba(224,251,255,'+(.76*flash)+')';ctx.fillRect(0,0,innerWidth,innerHeight);}
   }
   // Shaking starts on the reveal and eases out over about two seconds.
   if(u>=3.72&&u<5.8){
     const amount=Math.min(1,(u-3.72)/.1)*Math.max(0,1-(u-3.72)/2.08);
     const dx=(Math.random()-.5)*24*amount,dy=(Math.random()-.5)*20*amount;
     const game=$('game');if(game){game.style.transform='translate('+dx+'px,'+dy+'px)';canvas.style.transform='translate('+dx+'px,'+dy+'px)';}
   }else if(u>=5.8){const game=$('game');if(game)game.style.transform='';canvas.style.transform='';}
   return u<total;
 }
 function randomInView(){
   const r=screenRectWorld(75),x=r.left+Math.random()*Math.max(1,r.width),y=r.top+Math.random()*Math.max(1,r.height);
   return {x,y};
 }
 function seedField(){
   if(fieldOn)return;fieldOn=true;
   tornadoes=Array.from({length:5},(_,i)=>{const q=randomInView();return {...q,phase:Math.random()*TAU,frame:Math.random()*9,vx:(Math.random()-.5)*13,vy:(Math.random()-.5)*9,life:9+Math.random()*7};});
   rain=Array.from({length:260},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,l:18+Math.random()*28,s:700+Math.random()*600}));
   bolts=[];nextBolt=0;
 }
 function units(){
   const b=bridge(),out=new Set(),add=v=>{if(v&&Number.isFinite(v.x)&&Number.isFinite(v.y))out.add(v);};
   for(const e of enemies())add(e);
   const lists=[b?.allies?.all?.(),b?.players?.all?.(),b?.game?.players,b?.game?.allies,b?.game?.mates];
   for(const list of lists)if(Array.isArray(list))for(const v of list)add(v);
   add(player());
   return [...out];
 }
 function enemies(){const e=bridge()?.enemies;try{return typeof e?.all==='function'?e.all().filter(q=>q&&!q.dead):[];}catch(_){return [];}}
 function pushAndPull(dt){
   for(const e of units()){
     const boss=e.boss?0.35:1;
     for(const q of tornadoes){
       const dx=e.x-q.x,dy=e.y-q.y,d=Math.hypot(dx,dy)||1,rad=330;
       if(d>rad)continue;
       const nx=dx/d,ny=dy/d;
       // The violent eye tugs units inward; the outer wall of water throws them back.
       const radial=d<105?78:((d<250)?-34:0);
       const tangent=52;
       const falloff=(1-d/rad)*boss*dt;
       e.x+=(-nx*radial-ny*tangent)*falloff;
       e.y+=(-ny*radial+nx*tangent)*falloff;
     }
     e.x+=Math.sin(e.x*.013+performance.now()*.0014)*5*dt*boss;
     e.y+=Math.cos(e.y*.012+performance.now()*.0011)*3*dt*boss;
   }
 }
 function spawnBolt(t){
   const q=randomInView();bolts.push({...q,born:t,life:.42+Math.random()*.18,seed:Math.random()*100});
   if(bolts.length>4)bolts.shift();
 }
 function drawBolt(q,t,k){
   const s=worldToScreen(q.x,q.y),age=t-q.born,fade=Math.max(0,1-age/q.life),height=(150+Math.random()*90)*k;
   ctx.save();ctx.globalAlpha=fade;ctx.shadowColor='#fff29a';ctx.shadowBlur=18;
   if(boltSprite.complete&&boltSprite.naturalWidth){ctx.drawImage(boltSprite,s.x-36*k,s.y-height,72*k,height+6*k);}
   else{ctx.strokeStyle='#fffbe0';ctx.lineWidth=5*k;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s.x,s.y-height);let x=s.x,y=s.y-height;
     for(let i=0;i<8;i++){x+=(Math.random()-.5)*34*k;y+=height/8;ctx.lineTo(x,y);}ctx.stroke();}
   ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,246,170,.8)';ctx.lineWidth=2*k;ctx.beginPath();ctx.moveTo(s.x,s.y-height*.46);ctx.lineTo(s.x-34*k,s.y-height*.27);ctx.moveTo(s.x,s.y-height*.3);ctx.lineTo(s.x+39*k,s.y-height*.12);ctx.stroke();
   const g=ctx.createRadialGradient(s.x,s.y,1,s.x,s.y,55*k);g.addColorStop(0,'rgba(255,255,220,.85)');g.addColorStop(.2,'rgba(255,226,61,.4)');g.addColorStop(1,'rgba(255,211,37,0)');
   ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(s.x,s.y,55*k,16*k,0,0,TAU);ctx.fill();ctx.restore();
 }
 function drawTornado(q,t,dt){
   q.x+=q.vx*dt;q.y+=q.vy*dt;q.frame=(q.frame+dt*10)%9;q.life-=dt;
   const r=screenRectWorld(130);
   if(q.life<=0||q.x<r.left-180||q.x>r.left+r.width+180||q.y<r.top-180||q.y>r.top+r.height+180){
     const n=randomInView();Object.assign(q,n,{phase:Math.random()*TAU,frame:0,vx:(Math.random()-.5)*13,vy:(Math.random()-.5)*9,life:8+Math.random()*9});
   }
   const p=worldToScreen(q.x,q.y),k=p.k,sw=1024/3,frame=Math.floor(q.frame)%9;
   if(tornadoSheet.complete&&tornadoSheet.naturalWidth){
     const sizeW=390*k,sizeH=490*k;ctx.save();ctx.globalAlpha=.94;ctx.drawImage(tornadoSheet,(frame%3)*sw,Math.floor(frame/3)*sw,sw,sw,p.x-sizeW/2,p.y-sizeH*.88,sizeW,sizeH);ctx.restore();
   }else{
     ctx.fillStyle='rgba(0,166,240,.55)';ctx.beginPath();ctx.ellipse(p.x,p.y,175*k,245*k,0,0,TAU);ctx.fill();
   }
 }
 function drawField(p,dt,t){
   seedField();pushAndPull(dt);
   // A heavy storm nearly blacks out the battlefield while keeping effects readable.
   ctx.fillStyle='rgba(1,7,22,.62)';ctx.fillRect(0,0,innerWidth,innerHeight);
   const vg=ctx.createRadialGradient(innerWidth/2,innerHeight/2,Math.min(innerWidth,innerHeight)*.16,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.72);
   vg.addColorStop(0,'rgba(0,15,40,.12)');vg.addColorStop(1,'rgba(0,4,16,.72)');ctx.fillStyle=vg;ctx.fillRect(0,0,innerWidth,innerHeight);
   // Heavy diagonal rain fills the whole arena.
   ctx.strokeStyle='rgba(138,210,255,.64)';ctx.lineWidth=1.4;ctx.beginPath();
   for(const d of rain){d.y+=d.s*dt;d.x-=190*dt;if(d.y>innerHeight+30){d.y=-d.l;d.x=Math.random()*innerWidth;}if(d.x<-20)d.x=innerWidth+10;ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-9,d.y+d.l);}
   ctx.stroke();
   for(const q of tornadoes)drawTornado(q,t,dt);
   bolts=bolts.filter(q=>t-q.born<q.life);
   if(t>nextBolt){spawnBolt(t);nextBolt=t+1.6+Math.random()*2.1;}
   for(const q of bolts)drawBolt(q,t,1);
   if(bolts.some(q=>t-q.born<.11)){ctx.fillStyle='rgba(255,245,185,.14)';ctx.fillRect(0,0,innerWidth,innerHeight);}
 }
 function frame(ts){
   requestAnimationFrame(frame);if(!ctx)return;
   const p=player(),active=!!p&&p.megaForm===FORM&&bridge()?.game?.state==='playing';
   const now=ts/1000,dt=Math.min(.05,last?(ts-last)/1000:.016);last=ts;
   if(p&&p.megaForm===FORM&&lastForm!==FORM){reversionAt=now;fieldOn=false;}
   lastForm=p?.megaForm||'';
   if(!active){fieldOn=false;if(p?.megaForm!==FORM){const game=$('game');if(game)game.style.transform='';}}
   const inReveal=!!p&&p.megaForm===FORM&&now-reversionAt<6.0;
   const showing=active||inReveal;
   if(!showing){canvas.style.display='none';return;}
   canvas.style.display='block';resize();ctx.clearRect(0,0,innerWidth,innerHeight);
   if(active)drawField(p,dt,now);
   if(p&&p.megaForm===FORM)drawReversion(p,now);
 }
 setup();requestAnimationFrame(frame);
})();