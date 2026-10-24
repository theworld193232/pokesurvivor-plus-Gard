/* =====================================================================================================
   SMARTER WILD POKEMON: each wild Pokemon gets a personality when it appears (both modes).
   Most still chase you like before, so the game keeps its pace (and js/pressure.js keeps the field full).
   Your friend's personalities (same rates as his):
     aggressive  chases you and attacks (the game's normal behaviour)                          ~32%
     skittish    runs away whenever you come near, then creeps back                             15%
     passive     wanders around and leaves you alone until you hit it (then it turns aggressive) 15%
     sniper      ranged attackers keep their distance and never come close (all ranged Pokemon)
     coward      (extra trait, 30%) at low HP stops attacking and flees (sweat drop)
   Provocation (v73): keep pushing a shy one around and it fights back - a skittish one chased for 5 s, a fleeing
   coward or a skittish one hit 3 times, or a cry baby made to cry twice turns berserk ("Provoked!", red mark).
   Added on top:
     hit & run   VERY aggressive (rushes you faster) but the moment it actually hurts you it
                 runs away for a few seconds, then comes back for another hit                  10%
     flanker     circles around you at a distance, then dashes straight in                       7%
     ambusher    sits still (hiding in place) until you get close, then lunges at you            5%
     berserker   chases like normal, but gets faster and angrier as its HP drops (red mark)     10%
     cry baby    chases you like normal, but the moment you hit it, it bursts into tears: sits
                 sobbing for a few seconds (no attacks), runs off, then comes back            6%
   Bosses, Legendaries, roaming Legendaries, Raid Den bosses and wave enemies always stay aggressive.
   The game moves every enemy first; for the special ones this file then adjusts or replaces that step, so they
   still collide with walls and keep their own speed. Little marks over their heads show what they're up to.
   (Original idea and the first four personalities: your friend's js/enemy-ai.js.)
   ===================================================================================================== */
(()=>{'use strict';
 const E=()=>window.PS_HOOPA_ENGINE,B=()=>window.PS_MEGA_BRIDGE_V5;
 // Tuning knobs.
 const AI={
   mix:[['skittish',.15],['passive',.15],['hitrun',.10],['flanker',.07],['ambusher',.05],['berserker',.10],['crybaby',.06]],   // the rest are aggressive (skittish/passive/coward rates are your friend's)
   cowardChance:.30,cowardHp:.25,
   provoke:{chased:5,hits:3,cries:2},   // shy Pokemon fight back after 5 s of being chased / 3 hits; a cry baby after crying twice
   sniperRange:260,skittishRange:170,passiveWander:.55,
   hitrun:{rush:1.35,flee:2.6,fleeSpd:1.25},           // speed while rushing, seconds spent running away, run speed
   flanker:{radius:175,orbit:2.4,dash:1.0,dashSpd:1.7},
   ambusher:{trigger:210,lunge:1.1,lungeSpd:1.9},
   berserker:{maxBoost:1.6},
   crybaby:{cry:2.6,run:1.8}                            // seconds sobbing, seconds running off afterwards                             // speed at 0 HP
 };
 const RANGED=new Set(['ranged','fan','beamer','zoner']);
 const st=new WeakMap();
 const special=e=>e.boss||e.legend||e.__roamer||e.__maxRaid||e.__wave||e.__legendDen;
 function assign(e){
   let kind='aggressive';
   if(!special(e)){if(RANGED.has(e.behavior))kind='sniper';else{let r=Math.random();for(const [k,p] of AI.mix){if(r<p){kind=k;break;}r-=p;}}}
   const s={kind,coward:!special(e)&&Math.random()<AI.cowardChance,x:e.x,y:e.y,hp:Number(e.hp)||0,wa:Math.random()*Math.PI*2,wt:0,flee:false,
     t:0,phase:'',ph:0,tc:Number(e.touchCd)||0,mark:'',markT:0,dir:Math.random()<.5?1:-1};
   if(kind==='flanker'){s.phase='orbit';s.ph=AI.flanker.orbit*(.5+Math.random());}
   if(kind==='ambusher')s.phase='hide';
   if(kind==='hitrun')s.phase='rush';
   s.wildlife=window.PS_WILDLIFE?.create(e)||null;
   // When wildlife is enabled, the unselected majority keep native combat:
   // no wandering, fear cascades or legacy retreat personalities.
   if(window.PS_WILDLIFE && !E()?.Coop?.active && window.PS_SETTINGS?.wildlife!==false && !s.wildlife){
     kind=RANGED.has(e.behavior)?'sniper':'aggressive';s.kind=kind;s.coward=false;
   }
   s.baseKind=kind;
   e.psAi=kind;st.set(e,s);return s;
 }
 const spdOf=e=>(Number.isFinite(Number(e.spd))?Number(e.spd):60)*(Number(e.slowT)>0?.5:1)*(Number(e.stunT)>0?0:1);
 function moveTo(e,s,vx,vy,dt){   // our own step at the Pokemon's speed (its slows from sizes / domains already applied by the game)
   const l=Math.hypot(vx,vy);let nx=s.x,ny=s.y;
   if(l>.01){const sp=spdOf(e);nx=s.x+vx/l*sp*dt;ny=s.y+vy/l*sp*dt;}
   e.x=nx;e.y=ny;try{E()?.World?.collide?.(e);}catch(_){}
   if(l>.01)try{if(e.anim)e.anim.dir=B().sprites.dirFromAngle(Math.atan2(vy,vx));}catch(_){}
 }
 function push(e,vx,vy,extra,dt){   // add to the game's own chase step (for faster rushes)
   const l=Math.hypot(vx,vy);if(l<.01||extra<=0)return;const sp=spdOf(e)*extra*dt;e.x+=vx/l*sp;e.y+=vy/l*sp;try{E()?.World?.collide?.(e);}catch(_){}
 }
 const mark=(s,m,t)=>{s.mark=m;s.markT=t;};
 function provoke(e,s){   // cornered: stops running and turns aggressive (faster, like a berserker)
   if(s.provoked)return;s.provoked=true;s.flee=false;s.coward=false;s.kind=e.psAi='berserker';mark(s,'💢',1e9);
   try{B().fx.dmgText(e.x,e.y-(Number(e.bodyH)||24)-14,'Provoked!','#ff5f5f');}catch(_){}
 }
 // Peaceful wildlife must suppress native attacks before cooldowns are consumed.
 (function hookWildlife(){const proto=E()?.Enemy?.prototype;if(!proto?.update){setTimeout(hookWildlife,300);return;}
   const original=proto.update;proto.update=function(dt,...args){
     const p=B()?.game?.player;
     if(p&&window.PS_WILDLIFE?.available(this)){
       const s=st.get(this)||assign(this);
       if(window.PS_WILDLIFE.peaceful(this,s,p)){
         const hold=Math.max(.5,Number(dt)||0)+.1;
         this.touchCd=Math.max(Number(this.touchCd)||0,hold);this.shotCd=Math.max(Number(this.shotCd)||0,hold);
       }
     }
     return original.call(this,dt,...args);
   };
 })();
 let last=0,php=null,pRef=null;
 function frame(ts){
   requestAnimationFrame(frame);const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;
   const g=B()?.game,p=g?.player;if(!p||g.state!=='playing')return;
   if(p!==pRef){pRef=p;php=Number(p.hp)||0;}
   const pHp=Number(p.hp)||0,hurt=pHp<php-.01;php=pHp;   // did you just take damage?
   const enemies=B().enemies.all();window.PS_WILDLIFE_SOCIAL?.beginFrame(enemies,p,dt);
   for(const e of enemies){
     if(!e||e.dead||e.remote||e.__psCatch)continue;let s=st.get(e)||assign(e);
     if(window.PS_WILDLIFE?.available(e)){
       if(Math.hypot(e.x-s.x,e.y-s.y)>60){s.x=e.x;s.y=e.y;continue;}
       if(window.PS_WILDLIFE.step(e,s,p,dt,moveTo,mark)){s.x=e.x;s.y=e.y;continue;}
     }else if(s.wildlife){s.wildlife=null;s.kind=s.baseKind;s.flee=false;s.x=e.x;s.y=e.y;s.mark='';s.markT=0;e.psAi=s.kind;}
     const hp=Number(e.hp)||0,wasHit=hp<s.hp-.01;s.hp=hp;s.t+=dt;if(s.markT>0)s.markT-=dt;
     const tc=Number(e.touchCd)||0,attacked=tc>s.tc+.05;s.tc=tc;   // its contact attack just fired
     // [Gard] provocation: keep pushing a shy / scared Pokemon around and it eventually fights back
     const P=AI.provoke,shy=s.flee||s.kind==='skittish';
     if(wasHit&&shy){s.hits=(s.hits||0)+1;if(s.hits>=P.hits)provoke(e,s);}
     if(wasHit&&s.kind==='crybaby'&&s.phase!=='cry'&&(s.cries=(s.cries||0)+1)>P.cries){s.kind=e.psAi='berserker';s.phase='';mark(s,'💢',1e9);try{B().fx.dmgText(e.x,e.y-(Number(e.bodyH)||24)-14,'Enough!','#ff5f5f');}catch(_){}}
     if(wasHit&&s.kind==='crybaby'&&s.phase!=='cry'){s.phase='cry';s.ph=AI.crybaby.cry;mark(s,'cry',AI.crybaby.cry);try{if(Math.random()<.5)B().fx.dmgText(e.x,e.y-(Number(e.bodyH)||24)-14,['Waaah!','*sob*','Wahh!','*sniff*'][Math.floor(Math.random()*4)],'#8fd3ff');}catch(_){}}
     if(wasHit&&s.kind==='passive'){s.kind=e.psAi='aggressive';mark(s,'!',.8);}          // provoked
     if(wasHit&&s.kind==='ambusher'&&s.phase==='hide'){s.phase='lunge';s.ph=AI.ambusher.lunge;mark(s,'!',.8);}
     if(s.coward&&!s.flee&&Number(e.maxHp)>0&&hp<Number(e.maxHp)*AI.cowardHp){s.flee=true;mark(s,'',0);}
     const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1,jump=Math.hypot(e.x-s.x,e.y-s.y)>60;
     if(jump){s.x=e.x;s.y=e.y;continue;}   // a teleport / knockback: let it be
     if(s.flee){   // coward: no more attacks, run straight away
       e.shotCd=Math.max(Number(e.shotCd)||0,1);e.touchCd=Math.max(Number(e.touchCd)||0,.5);s.tc=e.touchCd;
       moveTo(e,s,dx/d+Math.sin(ts/400+s.wa)*.25,dy/d+Math.cos(ts/400+s.wa)*.25,dt*1.15);}
     else if(s.kind==='aggressive'){/* the game's own chase */}
     else if(s.kind==='berserker'){   // the lower its HP, the faster it charges
       const f=Number(e.maxHp)>0?1-hp/Number(e.maxHp):0,boost=(AI.berserker.maxBoost-1)*f;if(f>.35&&!s.mark)mark(s,'💢',1e9);push(e,-dx,-dy,boost,dt);}
     else if(s.kind==='hitrun'){
       if(s.phase==='rush'){push(e,-dx,-dy,AI.hitrun.rush-1,dt);
         if(attacked&&hurt&&d<(Number(e.r)||14)+(Number(p.r)||14)+30){s.phase='run';s.ph=AI.hitrun.flee;mark(s,'💨',AI.hitrun.flee);}}
       else{s.ph-=dt;e.touchCd=Math.max(Number(e.touchCd)||0,.3);s.tc=e.touchCd;moveTo(e,s,dx/d+Math.sin(ts/300+s.wa)*.3,dy/d,dt*AI.hitrun.fleeSpd);if(s.ph<=0){s.phase='rush';mark(s,'',0);}}}
     else if(s.kind==='flanker'){
       const F=AI.flanker;s.ph-=dt;
       if(s.phase==='orbit'){const want=F.radius,rad=(d-want)/Math.max(40,want)*1.6;moveTo(e,s,-dy/d*s.dir-dx/d*rad,dx/d*s.dir-dy/d*rad,dt);e.touchCd=Math.max(Number(e.touchCd)||0,.15);s.tc=e.touchCd;
         if(s.ph<=0&&d<want+120){s.phase='dash';s.ph=F.dash;s.ax=-dx/d;s.ay=-dy/d;mark(s,'!',.5);}}
       else{moveTo(e,s,s.ax,s.ay,dt*F.dashSpd);if(s.ph<=0){s.phase='orbit';s.ph=F.orbit*(.6+Math.random()*.8);s.dir=Math.random()<.5?1:-1;}}}
     else if(s.kind==='ambusher'){
       const A=AI.ambusher;
       if(s.phase==='hide'){moveTo(e,s,0,0,dt);e.touchCd=Math.max(Number(e.touchCd)||0,.2);e.shotCd=Math.max(Number(e.shotCd)||0,.3);s.tc=e.touchCd;
         if(d<A.trigger){s.phase='lunge';s.ph=A.lunge;mark(s,'!',.8);}}
       else if(s.phase==='lunge'){s.ph-=dt;moveTo(e,s,-dx,-dy,dt*A.lungeSpd);if(s.ph<=0){s.phase='hunt';}}
       /* hunt: the game's own chase from then on */}
     else if(s.kind==='crybaby'){
       if(s.phase==='cry'){s.ph-=dt;moveTo(e,s,Math.sin(ts/45)*.0001,0,dt*0);e.x=s.x+Math.sin(ts/40)*1.2;   // sobbing in place, shaking
         e.touchCd=Math.max(Number(e.touchCd)||0,.3);e.shotCd=Math.max(Number(e.shotCd)||0,.5);s.tc=e.touchCd;if(s.ph<=0){s.phase='run';s.ph=AI.crybaby.run;mark(s,'drop',AI.crybaby.run);}}
       else if(s.phase==='run'){s.ph-=dt;e.touchCd=Math.max(Number(e.touchCd)||0,.3);s.tc=e.touchCd;moveTo(e,s,dx/d,dy/d,dt*1.2);if(s.ph<=0)s.phase='';}
       /* otherwise: the game's own chase */}
     else if(s.kind==='sniper'){   // keep at range: back off when you come closer, never walk in
       const want=AI.sniperRange;if(d<want-20)moveTo(e,s,dx/d,dy/d,dt);else if(d>want+140)moveTo(e,s,-dx/d,-dy/d,dt*.8);else moveTo(e,s,-dy/d,dx/d,dt*.35);   // strafe sideways
       e.touchCd=Math.max(Number(e.touchCd)||0,.2);s.tc=e.touchCd;}
     else if(s.kind==='skittish'){if(d<AI.skittishRange){s.chased=(s.chased||0)+dt;if(s.chased>=AI.provoke.chased){provoke(e,s);s.x=e.x;s.y=e.y;continue;}}if(d<AI.skittishRange)moveTo(e,s,dx/d,dy/d,dt*1.1);else if(d>AI.skittishRange+180)moveTo(e,s,-dx/d,-dy/d,dt*.6);else moveTo(e,s,0,0,dt);}
     else if(s.kind==='passive'){s.wt-=dt;if(s.wt<=0){s.wt=1.2+Math.random()*2;s.wa+=(Math.random()-.5)*2.4;}
       if(d>700)moveTo(e,s,-dx/d,-dy/d,dt*.6);else moveTo(e,s,Math.cos(s.wa),Math.sin(s.wa),dt*AI.passiveWander);
       e.shotCd=Math.max(Number(e.shotCd)||0,.5);e.touchCd=Math.max(Number(e.touchCd)||0,.3);s.tc=e.touchCd;}
     s.x=e.x;s.y=e.y;
   }
 }
 requestAnimationFrame(frame);
 // marks over their heads: tears + ';_;' bubble (cry baby), sweat drop (fleeing coward / cry baby running off), ! (spotted you / dashing), 💨 (running off after a hit), 💢 (berserk)
 let hooked=false;
 function drop(g,x,y){g.fillStyle='#8fd3ff';g.strokeStyle='#1d4a7a';g.lineWidth=1;g.beginPath();g.moveTo(x,y-6);g.quadraticCurveTo(x+4,y,x,y+3);g.quadraticCurveTo(x-4,y,x,y-6);g.fill();g.stroke();}
 function bang(g,x,y){g.fillStyle='#ffe066';g.strokeStyle='#5a3a00';g.lineWidth=1.2;g.beginPath();g.moveTo(x-2.5,y-9);g.lineTo(x+2.5,y-9);g.lineTo(x+1.2,y+1);g.lineTo(x-1.2,y+1);g.closePath();g.fill();g.stroke();g.beginPath();g.arc(x,y+4.5,2,0,Math.PI*2);g.fill();g.stroke();}
 function anger(g,x,y){g.strokeStyle='#ff3d3d';g.lineWidth=2;g.lineCap='round';for(const [a,b] of [[[-4,-1],[-1,-1]],[[-1,-4],[-1,-1]],[[4,-1],[1,-1]],[[1,-4],[1,-1]],[[-4,1],[-1,1]],[[-1,4],[-1,1]],[[4,1],[1,1]],[[1,4],[1,1]]]){g.beginPath();g.moveTo(x+a[0],y+a[1]);g.lineTo(x+b[0],y+b[1]);g.stroke();}}
 function tears(g,e,h,t){const x=e.x,y=e.y-h*.62;g.fillStyle='rgba(120,200,255,.95)';for(const sd of [-1,1]){for(let i=0;i<3;i++){const u=((t*2.2+i/3)%1),tx=x+sd*(5+u*6),ty=y+u*14+u*u*6;g.globalAlpha=1-u;g.beginPath();g.ellipse(tx,ty,1.6,2.4,0,0,Math.PI*2);g.fill();}}g.globalAlpha=1;
   g.fillStyle='#ffffff';g.strokeStyle='#3b3f5c';g.lineWidth=1;g.beginPath();g.ellipse(x+14,y-h*.55,9,6,0,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#3b3f5c';g.font='bold 7px monospace';g.textAlign='center';g.fillText(';_;',x+14,y-h*.55+2.5);}
 function puff(g,x,y,t){g.fillStyle='rgba(235,240,255,.85)';for(let i=0;i<3;i++){const r=2.5+i*.8;g.beginPath();g.arc(x+6+i*4+Math.sin(t*10+i)*1,y+1-i,r,0,Math.PI*2);g.fill();}}
 (function hook(){const T=E()?.Training;if(!T||typeof T.drawables!=='function'){setTimeout(hook,300);return;}if(hooked)return;hooked=true;const orig=T.drawables;
   T.drawables=function(){const r=orig.apply(this,arguments),extra=[];const now=performance.now()/1000;for(const e of B()?.enemies?.all?.()||[]){const s=st.get(e);if(!s||e.dead||e.__psCatch||(s.wildlife&&window.PS_WILDLIFE_SOCIAL?.enabled()))continue;
     const m=s.flee?'drop':s.markT>0?s.mark:'';if(!m)continue;
     extra.push({y:e.y+.1,draw(g){const h=Number(e.bodyH)||24,x=e.x+10,y=e.y-h-4;g.save();
       if(m==='drop')drop(g,x,y);else if(m==='cry')tears(g,e,h,now);else if(m==='swirl'){g.strokeStyle='#b7aeff';g.lineWidth=1.5;g.beginPath();for(let i=0;i<30;i++){const a=i*.5,r=i*.16;i?g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):g.moveTo(x,y);}g.stroke();}else if(m==='note'||m==='zzz'||m==='?'){g.fillStyle='#e8f4ff';g.font='bold 11px monospace';g.textAlign='center';g.fillText(m==='note'?'♪':m==='zzz'?'z Z':'?',x,y);}else if(m==='!')bang(g,e.x,y-2);else if(m==='💢')anger(g,x,y);else if(m==='💨')puff(g,e.x,e.y-h*.4,now);g.restore();}});}
     return extra.length?[...(r||[]),...extra]:r;};})();
 window.PS_ENEMY_AI={AI,stateOf:e=>st.get(e),ensure:e=>st.get(e)||assign(e)};
})();
