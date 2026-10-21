/* Primal Kyogre transformation and Primordial Sea field effects. */
(()=>{'use strict';
 const FORM='382-primal',TAU=Math.PI*2;
 let canvas,ctx,lastForm='',reversionAt=0,last=0,tornadoes=[],bolts=[],rain=[],shakeUntil=0,fieldOn=false;
 const $=id=>document.getElementById(id);
 function bridge(){return window.PS_MEGA_BRIDGE_V5;}
 function player(){const b=bridge();return b&&(b.game?.player||b.player||b.game?.p)||null;}
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
 function center(p){
   const b=bridge(),cam=b?.camera,g=$('game');
   if(cam&&g&&typeof cam.left==='function'&&Number.isFinite(cam.scale)){
     const r=g.getBoundingClientRect(),css=Number(cam._cw)>0?r.width/cam._cw:1,k=cam.scale*css;
     return {x:r.left+(p.x-cam.left())*k,y:r.top+(p.y-cam.top())*k-((Number(p.bodyH)||40)*.45)*k,k};
   }
   return {x:innerWidth/2,y:innerHeight/2,k:1};
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
   const c=center(p),u=t-reversionAt,duration=3.5,progress=Math.min(1,u/duration);
   if(u<duration){
     const r=(34+Math.min(1,u/.7)*48)*c.k;
     const x=c.x,y=c.y;
     if(u<2.0){
       const grow=Math.min(1,u/.55),shake=u>1.35&&u<2.0?Math.sin(u*55)*3*c.k:0;
       const rr=r*grow;
       const g=ctx.createRadialGradient(x,y,rr*.18,x,y,rr);
       g.addColorStop(0,'rgba(17,151,255,.90)');g.addColorStop(.66,'rgba(6,86,218,.82)');g.addColorStop(1,'rgba(4,29,112,.95)');
       ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+shake,y,rr,0,TAU);ctx.fill();
       ctx.strokeStyle='rgba(156,235,255,.95)';ctx.lineWidth=3*c.k;ctx.beginPath();ctx.arc(x+shake,y,rr,0,TAU);ctx.stroke();
       // The supplied Blue Orb insignia crystallizes across the orb before it cracks.
       orbSymbol(x+shake,y,rr*.66,u,Math.min(1,Math.max(0,(u-.2)/.5)));
       if(u>1.35){
         const crackAlpha=Math.min(1,(u-1.35)/.35);ctx.globalAlpha=crackAlpha;ctx.strokeStyle='#efffff';ctx.lineWidth=2*c.k;ctx.beginPath();
         ctx.moveTo(x-rr*.74,y-rr*.15);ctx.lineTo(x-rr*.22,y+rr*.04);ctx.lineTo(x-rr*.05,y-rr*.32);ctx.lineTo(x+rr*.22,y-rr*.04);ctx.lineTo(x+rr*.64,y-rr*.28);
         ctx.moveTo(x+rr*.05,y-rr*.03);ctx.lineTo(x-rr*.16,y+rr*.52);ctx.moveTo(x+rr*.22,y-rr*.04);ctx.lineTo(x+rr*.4,y+rr*.45);ctx.stroke();ctx.globalAlpha=1;
       }
     }else{
       const e=Math.min(1,(u-2)/.43),fade=Math.max(0,1-e);
       ctx.globalCompositeOperation='lighter';
       const rays=22;
       for(let i=0;i<rays;i++){const a=TAU*i/rays+u*.2,inner=r*(.35+e*.55),outer=r*(1.1+e*1.8);
         ctx.strokeStyle=i%2?'rgba(69,190,255,.8)':'rgba(225,252,255,.95)';ctx.lineWidth=(2+Math.random()*3)*c.k;ctx.globalAlpha=fade;
         ctx.beginPath();ctx.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);ctx.lineTo(x+Math.cos(a)*outer,y+Math.sin(a)*outer);ctx.stroke();}
       ctx.globalAlpha=fade;ctx.fillStyle='rgba(195,245,255,.8)';ctx.beginPath();ctx.arc(x,y,r*(.2+e),0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
     }
     return true;
   }
   if(u<5.5){
     const amount=Math.max(0,1-(u-duration)/2.0);
     const dx=(Math.random()-.5)*18*amount,dy=(Math.random()-.5)*14*amount;
     const game=$('game');if(game){game.style.transform='translate('+dx+'px,'+dy+'px)';canvas.style.transform='translate('+dx+'px,'+dy+'px)';}
     return true;
   }
   const game=$('game');if(game)game.style.transform='';canvas.style.transform='';
   return false;
 }
 function seedField(p){
   if(fieldOn)return;fieldOn=true;
   tornadoes=[];const seed=Math.abs(Number(p.dex)||382);
   for(let i=0;i<5;i++){const a=TAU*i/5+seed*.37,rad=145+((i*73+seed)%150);tornadoes.push({a,rad,phase:i*1.7,spin:i%2?1:-1});}
   rain=Array.from({length:150},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,l:12+Math.random()*22,s:520+Math.random()*440}));
   bolts=[];
 }
 function enemyList(){const e=bridge()?.enemies;try{return typeof e?.all==='function'?e.all().filter(q=>q&&!q.dead):[];}catch(_){return [];}}
 function physics(p,dt,t){
   const all=enemyList(),centers=tornadoes.map(q=>({x:p.x+Math.cos(q.a+t*.12)*q.rad,y:p.y+Math.sin(q.a+t*.12)*q.rad*.72}));
   for(const e of all){
     let best=null,bd=1e9;
     for(const q of centers){const d=Math.hypot(e.x-q.x,e.y-q.y);if(d<bd){bd=d;best=q;}}
     const boss=e.boss?0.28:1;
     if(best&&bd<120){const dx=best.x-e.x,dy=best.y-e.y,d=bd||1,pull=Math.min(3.4*dt*60,(120-d)*.035)*boss;e.x+=dx/d*pull;e.y+=dy/d*pull;}
     const phase=t*1.35+(e.x*.003);
     e.x+=Math.sin(phase)*0.38*dt*60*boss;
     e.y+=Math.cos(phase*1.27)*0.24*dt*60*boss;
   }
 }
 function drawField(p,dt,t){
   seedField(p);physics(p,dt,t);
   const {x,y,k}=center(p),R=430*k;
   // Darken the entire arena around the Primal storm.
   ctx.fillStyle='rgba(3,13,34,.27)';ctx.fillRect(0,0,innerWidth,innerHeight);
   const shade=ctx.createRadialGradient(x,y,R*.25,x,y,R*1.55);shade.addColorStop(0,'rgba(0,13,38,0)');shade.addColorStop(1,'rgba(0,9,30,.48)');ctx.fillStyle=shade;ctx.fillRect(0,0,innerWidth,innerHeight);
   // Harsh slanted rain.
   ctx.strokeStyle='rgba(138,210,255,.5)';ctx.lineWidth=1.2;ctx.beginPath();
   for(const d of rain){d.y+=d.s*dt;d.x-=130*dt;if(d.y>innerHeight+20){d.y=-d.l;d.x=Math.random()*innerWidth;}if(d.x<-20)d.x=innerWidth+10;
     ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-5,d.y+d.l);}
   ctx.stroke();
   // Waterspouts pull enemies toward their cores and hold them in the current.
   for(let i=0;i<tornadoes.length;i++){
     const q=tornadoes[i],a=q.a+t*.12,wx=p.x+Math.cos(a)*q.rad,wy=p.y+Math.sin(a)*q.rad*.72,sx=x+(wx-p.x)*k,sy=y+(wy-p.y)*k;
     const rr=(42+8*Math.sin(t*4+q.phase))*k;
     const grd=ctx.createRadialGradient(sx,sy,rr*.08,sx,sy,rr);grd.addColorStop(0,'rgba(180,246,255,.72)');grd.addColorStop(.28,'rgba(32,170,225,.42)');grd.addColorStop(1,'rgba(20,102,190,0)');
     ctx.fillStyle=grd;ctx.beginPath();ctx.ellipse(sx,sy,rr*.7,rr*1.55,a*.4,0,TAU);ctx.fill();
     ctx.strokeStyle='rgba(163,237,255,.68)';ctx.lineWidth=2*k;ctx.beginPath();
     for(let j=0;j<30;j++){const f=j/29,ang=a*3+f*TAU*2+t*3*(i%2?1:-1),rad=rr*(.16+f*.7);const px=sx+Math.cos(ang)*rad,py=sy+Math.sin(ang)*rad*1.65;if(!j)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
     ctx.fillStyle='rgba(220,250,255,.68)';ctx.beginPath();ctx.ellipse(sx,sy,rr*.22,rr*.62,0,0,TAU);ctx.fill();
   }
   // Intermittent thunder flashes and branching lightning.
   if(!bolts.length||t>bolts[0].until){const bx=Math.random()*innerWidth,by=25+Math.random()*innerHeight*.48;bolts=[{x:bx,y:by,until:t+.12+Math.random()*.1},{x:bx+(Math.random()-.5)*80,y:by+Math.random()*65,until:t+.12}];}
   if(t<bolts[0].until){ctx.fillStyle='rgba(166,218,255,.11)';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.strokeStyle='rgba(222,247,255,.95)';ctx.lineWidth=3;ctx.shadowColor='#71d8ff';ctx.shadowBlur=18;
     for(let b=0;b<bolts.length;b++){const q=bolts[b];ctx.beginPath();ctx.moveTo(q.x,q.y);let xx=q.x,yy=q.y;for(let j=0;j<8;j++){xx+=(Math.random()-.5)*36;yy+=38+Math.random()*35;ctx.lineTo(xx,yy);}ctx.stroke();}ctx.shadowBlur=0;}
 }
 function frame(ts){
   requestAnimationFrame(frame);if(!ctx)return;
   const p=player(),active=!!p&&p.megaForm===FORM&&bridge()?.game?.state==='playing';
   const now=ts/1000,dt=Math.min(.05,last?(ts-last)/1000:.016);last=ts;
   if(p&&p.megaForm===FORM&&lastForm!==FORM){reversionAt=now;shakeUntil=now+5.5;fieldOn=false;}
   lastForm=p?.megaForm||'';
   const anim=active&&drawReversion(p,now);
   if(!active){fieldOn=false;const game=$('game');if(game)game.style.transform='';}
   if(!active&&!anim){canvas.style.display='none';ctx.clearRect(0,0,innerWidth,innerHeight);return;}
   canvas.style.display='block';resize();ctx.clearRect(0,0,innerWidth,innerHeight);
   if(active)drawField(p,dt,now);
   if(anim&&now>reversionAt+2.43){/* explosion and reveal are handled by the scene above */}
 }
 setup();requestAnimationFrame(frame);
})();