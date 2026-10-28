/* Volcanic life: erupting vents, magma arcs, local wildlife responses and warm resting spots. */
(function install(){
 'use strict';
 const R=window.__PSX_REG__,A=window.PSXAI,V=window.PS_VOLCANO;
 if(!V){setTimeout(install,50);return;}if(window.PS_VOLCANO_LIFE)return;
 const TAU=Math.PI*2,states=new Map(),magma=[],scorch=[],clamp=v=>Math.max(0,Math.min(1,v));let nextSense=0,actor=null,runSeed=null,lastTime=null;
 const hash=(a,b=0)=>V.hash(a,b,V.seed+4801);
 function phase(d,t){const period=32+d.h*18,local=t-(states.get(d.id)?.epoch||0),p=(local+d.h*13)%period;return {period,p,cycle:Math.floor((local+d.h*13)/period),warning:p>=9&&p<12,erupting:p>=12&&p<15,heat:p<9?.16:p<12?.2+(p-9)/3*.8:p<15?1:p<19?1-(p-15)/4:.16};}
 function reset(){states.clear();magma.length=0;scorch.length=0;nextSense=0;actor=null;lastTime=null;runSeed=V.seed;}
 function mouth(d){const art=V.ART[d.kind],h=art.w*d.scale*art.rect[3]/art.rect[2];return {x:d.x-3,y:d.y-h*.87};}
 function react(d,t){A.Bus?.emit({type:'boom',x:d.x,y:d.y,loud:620,power:1.15,srcKey:'volcano:'+d.id});
  for(const e of R.EnemyMgr.all()){const s=e.psx;if(!s||e.dead||e.legend||Math.hypot(e.x-d.x,e.y-d.y)>310)continue;const brave=(s.pers?.tr?.bravery||.5)>.8,fire=e.types?.includes('fire');if(brave&&fire){A.Mind?.feel(s,'curiosity',.2,'vent');continue;}s.volcanoDanger={x:d.x,y:d.y,until:t+5};s.forceThink=true;A.Mind?.say(s,'surprise',1.1,2);}
 }
 function launch(d,t,volley){const m=mouth(d);for(let i=0;i<3;i++){const a=hash(volley*3+i+Math.round(d.x),Math.round(d.y))*TAU,r=115+hash(i+volley*9,Math.round(d.x))*125,x=d.x+Math.cos(a)*r,y=d.y+Math.sin(a)*r*.8;
   magma.push({x0:m.x,y0:m.y,x,y,born:t,life:1.55+i*.12,r:29+i*3,hit:false,seed:i+volley*7});}
  if(magma.length>36)magma.splice(0,magma.length-36);try{R.Camera.kick?.(.09);}catch(_){}if(volley===0)react(d,t);
 }
 function dangerous(d,t){const f=phase(d,t);return d.kind===12&&(f.warning||f.erupting);}
 function step(dt){if(!V.active()||R.Game.state!=='playing')return;const p=R.Game.player;if(!p||p.dead)return;const t=Number(R.Game.time)||0;if(actor!==p||runSeed!==V.seed){reset();actor=p;}if(lastTime!==null&&(t-lastTime>1.5||t<lastTime)){states.clear();magma.length=0;scorch.length=0;}lastTime=t;
  for(const d of V.near(p.x,p.y,400).filter(d=>d.kind===12&&Math.hypot(p.x-d.x,p.y-d.y)<340)){let s=states.get(d.id);if(!s||t-(s.lastSeen??t)>2){s={epoch:t+d.h*13-7,cycle:0,armed:true,launched:0,warned:false};states.set(d.id,s);}s.lastSeen=t;const f=phase(d,t);if(s.cycle!==f.cycle){s.cycle=f.cycle;s.armed=true;s.launched=0;s.warned=false;}
   if(f.warning&&s.armed&&!s.warned){s.warned=true;try{R.Camera.kick?.(.045);}catch(_){}react(d,t);}
   if(s.armed&&f.erupting&&s.launched<3&&f.p>=12+s.launched*.7){launch(d,t,s.launched);s.launched++;}
  }
  // Impact damage is once per rock; lava itself retains its separate one-second damage interval.
  for(const b of magma){if(b.hit||t-b.born<b.life)continue;b.hit=true;if(t-b.born>b.life+.5)continue;scorch.push({x:b.x,y:b.y,born:t,r:b.r});if(Math.hypot(p.x-b.x,p.y-b.y)<b.r+(p.r||12)&&!p.dead){p.hurt(Math.max(1,Math.round(p.maxHp*.045)),'#ffbd66',0,0,0);}try{R.FX.burst(b.x,b.y-3,'#ffad43',10,90);R.Camera.kick?.(.035);}catch(_){} }
  for(let i=magma.length-1;i>=0;i--)if(t-magma[i].born>magma[i].life+.5)magma.splice(i,1);
  for(let i=scorch.length-1;i>=0;i--)if(t-scorch[i].born>4)scorch.splice(i,1);if(scorch.length>36)scorch.splice(0,scorch.length-36);
  if(states.size>48)states.delete(states.keys().next().value);
  if(t>=nextSense){nextSense=t+2;for(const e of R.EnemyMgr.all()){const s=e.psx;if(!s||e.dead||s.inCombat||hash(e.id||e.dex,Math.floor(t/30))>.12)continue;if((Math.sin(t/43)>.8)&&!e.types?.includes('fire')){s.vis.shake=.03;A.Mind?.say(s,'sweat',1,1);}}}
 }
 function drawGround(ctx){const t=Number(R.Game.time)||0;ctx.save();for(const b of magma){if(b.hit)continue;const u=clamp((t-b.born)/b.life);ctx.globalAlpha=.16+.3*u;ctx.fillStyle='#29151b';ctx.beginPath();ctx.ellipse(b.x,b.y,b.r*(.45+.55*u),b.r*(.3+.2*u),0,0,TAU);ctx.fill();ctx.globalAlpha=.25+.5*u;ctx.strokeStyle='#f4a44c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y,b.r*.8,b.r*.5,0,0,TAU);ctx.stroke();}
  for(const q of scorch){const u=clamp((t-q.born)/4);ctx.globalAlpha=(1-u)*.55;ctx.fillStyle='#261921';ctx.beginPath();ctx.ellipse(q.x,q.y,q.r,q.r*.6,0,0,TAU);ctx.fill();ctx.fillStyle='#f98b3b';ctx.globalAlpha=(1-u)*.35;for(let i=0;i<6;i++)ctx.fillRect(q.x+Math.cos(i*2.4)*q.r*.65,q.y+Math.sin(i*2.4)*q.r*.35,4,2);}
  ctx.restore();
 }
 function drawMouth(ctx,d){const t=Number(R.Game.time)||0,f=phase(d,t),m=mouth(d),pulse=.85+.15*Math.sin(t*11);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(m.x,m.y,1,m.x,m.y,25+f.heat*32);g.addColorStop(0,'rgba(255,202,91,'+(.35+f.heat*.5)+')');g.addColorStop(1,'rgba(255,85,26,0)');ctx.fillStyle=g;ctx.fillRect(m.x-60,m.y-60,120,120);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.45+f.heat*.45;ctx.fillStyle='#ff7a24';ctx.beginPath();ctx.ellipse(m.x,m.y,18,7,0,0,TAU);ctx.fill();ctx.fillStyle='#ffdc80';ctx.fillRect(m.x-8,m.y-2,16*pulse,3);
  for(let i=0;i<8;i++){const u=(t*(f.erupting?.65:.22)+i/8+d.h)%1;ctx.globalAlpha=(1-u)*(f.erupting?.45:.17);ctx.fillStyle=f.erupting?'#6c5350':'#b3a59b';ctx.beginPath();ctx.ellipse(m.x+Math.sin(u*4+i)*9+u*20,m.y-u*(f.erupting?165:90),5+u*25,4+u*18,0,0,TAU);ctx.fill();}
  if(f.erupting){for(let i=0;i<10;i++){const u=(t*1.6+i/10)%1;ctx.globalAlpha=1-u;ctx.fillStyle=i%2?'#ff8c2c':'#ffe3a2';ctx.fillRect(m.x+Math.sin(i*4+t)*u*40,m.y-u*115,3,5);}}
  ctx.restore();
 }
 function drawAir(ctx){const t=Number(R.Game.time)||0;ctx.save();for(const b of magma){if(b.hit)continue;const u=clamp((t-b.born)/b.life),x=b.x0+(b.x-b.x0)*u,y=b.y0+(b.y-b.y0)*u-Math.sin(u*Math.PI)*135;ctx.globalCompositeOperation='lighter';for(let i=3;i>=0;i--){const v=Math.max(0,u-i*.025),tx=b.x0+(b.x-b.x0)*v,ty=b.y0+(b.y-b.y0)*v-Math.sin(v*Math.PI)*135;ctx.globalAlpha=.15+(3-i)*.12;ctx.fillStyle='#ff8a32';ctx.fillRect(tx-5,ty-5,10,10);}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#44212a';ctx.fillRect(x-6,y-5,12,10);ctx.fillStyle='#fb6e22';ctx.fillRect(x-4,y-4,8,8);ctx.fillStyle='#ffe09b';ctx.fillRect(x-2,y-3,4,4);}
  ctx.restore();
 }
 const draw=R.World.drawGround;R.World.drawGround=function(ctx,...a){const out=draw.call(this,ctx,...a);if(V.active())drawGround(ctx);return out;};
 const air=A.Light.drawAir;A.Light.drawAir=function(ctx,...a){const out=air.call(this,ctx,...a);if(V.active())drawAir(ctx);return out;};
 const ds=R.Training.drawables;R.Training.drawables=function(...a){const list=ds.apply(this,a)||[],p=R.Game.player;return V.active()&&p?[...list,...V.near(p.x,p.y,900).filter(d=>d.kind===12).map(d=>({y:d.y+.1,draw:ctx=>drawMouth(ctx,d)}))]:list;};
 const lights=A.Forest.lights;A.Forest.lights=function(list,...a){const out=lights.call(this,list,...a),p=R.Game.player;if(V.active()&&p){const t=Number(R.Game.time)||0;for(const d of V.near(p.x,p.y,800).filter(d=>d.kind===12)){const m=mouth(d),f=phase(d,t);list.push({x:m.x,y:m.y,r:150+f.heat*130,c:[255,139,50],i:.8+f.heat*.7});}for(const b of magma.slice(0,12))if(!b.hit)list.push({x:b.x,y:b.y,r:65,c:[255,170,64],i:.7});}return out;};
 const update=R.Player.prototype.update;R.Player.prototype.update=function(dt,...a){const out=update.call(this,dt,...a);if(this===R.Game.player)step(dt);return out;};
 // Add small, contextual activities through the friend's behavior library; no second AI controller.
 A.Behaviors?.add({id:'caldera-vent-escape',tier:2,minCommit:.7,cd:2,score(e,s){return V.active()&&s.volcanoDanger&&s.volcanoDanger.until>(Number(R.Game.time)||0)?1:0;},start(e,s){const d=s.volcanoDanger;s.bs.target=A.Behaviors.escapePoint(e,s,d.x,d.y,180);},update(e,s,dt,it){const q=s.bs.target;if(!V.active()||!q||!s.volcanoDanger||s.volcanoDanger.until<=(Number(R.Game.time)||0))return false;A.Behaviors.go(it,q[0],q[1],.85);return Math.hypot(e.x-q[0],e.y-q[1])>20;}});
 A.Behaviors?.add({id:'caldera-bask',tier:8,minCommit:2,cd:24,score(e,s){if(!V.active()||s.inCombat||s.combat?.target||s.stance==='hostile'||!e.types?.includes('fire')||hash(e.id||e.dex)>.32)return 0;const t=Number(R.Game.time)||0,q=V.near(e.x,e.y,140).find(d=>[3,10,12].includes(d.kind)&&Math.hypot(e.x-d.x,e.y-d.y)<105&&!dangerous(d,t));return !q?0:q.kind===12 ? .15 : q.kind===10 ? .2 : q.kind===3 ? .18:0;},start(e,s){s.bs.t=0;A.Mind?.say(s,'happy',1.2,1);},update(e,s,dt,it){s.bs.t+=dt;if(!V.active()||s.inCombat||s.combat?.target||s.bs.t>4)return false;A.Behaviors.stay(it);it.anim='Idle';return true;}});
 const resetWorld=R.World.reset;R.World.reset=function(...a){reset();return resetWorld.apply(this,a);};
 window.PS_VOLCANO_LIFE={phase,mouth,step,drawGround,drawAir,drawMouth,reset,dangerous,magma,scorch,states};
})();
