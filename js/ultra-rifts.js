/* Ultra Beast rifts. Keeps native arena difficulty, shiny legendary rolls and co-op arena packets. */
(function install(){
 'use strict';
 const R=window.__PSX_REG__,A=window.PSXAI;
 if(!R?.Rift||!R.World?.setArena||!R.DB||!R.EnemyMgr||!A){setTimeout(install,100);return;}
 if(window.PS_ULTRA_RIFTS)return;
 const IDS=[793,794,795,796,797,798,799,803,804,805,806],SET=new Set(IDS),TAU=Math.PI*2;
 const CFG={every:180,chance:.25,life:80};
 const st={next:180,run:null,preview:null,cry:null,grantDepth:0},rewarded=new WeakSet();
 const isUB=d=>SET.has(Number(d)),pool=()=>IDS.filter(d=>R.DEX_BY[d]&&R.SPRITE_META[d]);
 const pick=()=>{const L=pool();return L[Math.floor(Math.random()*L.length)];};
 const time=()=>Number(R.Game.time)||0,host=()=>!R.Coop?.active||!!R.Coop.isHost;
 const say=(s,d=4)=>{try{R.Spawner.say(s,d);}catch(_){}};
 function stopCry(){try{st.cry?.pause();}catch(_){}st.cry=null;}
 function cry(dex){stopCry();try{const s=R.Audio.settings||{},n=v=>Math.max(0,Math.min(1,Number(v)>1?Number(v)/100:Number(v))),v=n(s.sfx??.6)*n(s.master??1);if(!v||s.muted||s.mute||R.Audio.muted)return;const a=new Audio('assets/cries/'+dex+'.mp3');a.volume=Math.min(1,v*.4);st.cry=a;a.play()?.catch(()=>{});}catch(_){}}
 function normalize(arena){
  if(!arena||arena.gold)return arena;
  if(arena.shiny&&!isUB(arena.dex))return arena; // Native shiny legendary roll has priority, unchanged.
  if(arena.psUltra&&isUB(arena.dex))return arena;
  const d=arena.psUltraDex||R.Rift.rift?.psUltraDex||st.pendingDex||pick();if(!isUB(d)||!R.SPRITE_META[d])return arena;
  arena.psOriginalDex=Number(arena.dex);arena.dex=Number(d);arena.psUltra=true;
  try{R.Sprites.preload?.([arena.dex]);}catch(_){}return arena;
 }
 // The host packet is normalized before sending, so clients receive exactly the chosen encounter.
 const broadcast=R.Coop?.broadcast;
 if(typeof broadcast==='function')R.Coop.broadcast=function(ev,...args){if(ev?.[0]==='arena')normalize(ev[1]);return broadcast.call(this,ev,...args);};
 const setArena=R.World.setArena;
 R.World.setArena=function(...args){if(R.Rift.inArena)normalize(R.Rift.arena);return setArena.apply(this,args);};
 const onEvent=R.Rift.onEvent;
 R.Rift.onEvent=function(ev,...args){if(ev?.[0]==='arena')normalize(ev[1]);const result=onEvent.call(this,ev,...args);if(ev?.[0]==='rift'&&ev[5]?.psUltraDex&&R.Rift.rift){Object.assign(R.Rift.rift,{psUltraDex:Number(ev[5].psUltraDex),psWormhole:true});announce(R.Rift.rift);}if(ev?.[0]==='arena'||ev?.[0]==='riftx')st.preview=null;return result;};
 // Normal waves and randomized non-rift encounters never select Ultra Beasts.
 const bagAt=R.Enemies.bagAt;
 R.Enemies.bagAt=function(...args){const list=bagAt.apply(this,args);return Array.isArray(list)&&!R.Rift.inArena?list.filter(d=>!isUB(d.dex)):list;};
 const choose=R.U.pick;
 R.U.pick=function(list,...args){if(Array.isArray(list)&&(!R.Rift.inArena||R.Rift.arena?.gold)){const filtered=list.filter(d=>!isUB(typeof d==='object'?d?.dex:typeof d==='number'?d:0));if(filtered.length&&filtered.length!==list.length)list=filtered;}return choose.call(this,list,...args);};
 const gacha=window.PS_GACHA_POOL;
 window.PS_GACHA_POOL=function(list,...args){const out=typeof gacha==='function'?gacha.call(this,list,...args):list;return Array.isArray(out)?out.filter(d=>!isUB(d.dex??d)):out;};
 const add=R.EnemyMgr.add;
 R.EnemyMgr.add=function(e,...args){if(e?.legend&&R.Rift.inArena&&!R.Rift.arena?.gold)e.__psLegendRolled=true;if(e&&isUB(e.dex)&&(!R.Rift.inArena||R.Rift.arena?.gold))return false;return add.call(this,e,...args);};
 // Existing collection entries remain untouched. New UB collection grants require a won rift.
 for(const key of ['grant','grantShiny']){const original=R.DB[key];if(typeof original!=='function')continue;R.DB[key]=function(dex,...args){if(isUB(dex)&&!st.grantDepth)return false;return original.call(this,dex,...args);};}
 function reward(){const ar=R.Rift.arena;if(!ar||ar.gold||!isUB(ar.dex)||ar.phase!=='won'||rewarded.has(ar))return false;rewarded.add(ar);st.grantDepth++;try{R.DB.grant(ar.dex,'ultra-rift');if(ar.shiny)R.DB.grantShiny(ar.dex,'ultra-rift');R.DB.commit();say(R.DEX_BY[ar.dex].name+' joined you from Ultra Space!',4);}finally{st.grantDepth--;}return true;}
 function permitted(){return R.Game.state==='playing'&&R.Game.player&&!R.Game.player.dead&&!R.Rift.open&&!R.Rift.inArena&&!R.Judgment?.active&&!R.EnemyMgr.bossAlive?.()&&!window.PS_SAFEZONE?.active&&!window.PS_GROUDON_DEN?.st.inDen&&!window.PS_DENS?.occupied&&!window.PS_MODES?.run?.mode?.includes('legend')&&!A.Mansion?.inside&&!A.Totem?.active?.()&&!['regigigas','terapagos'].includes(window.PS_CRYSTAL_PEAK?.model?.zone)&&host();}
 function announce(r){st.preview=null;const dex=r.psUltraDex,name=R.DEX_BY[dex]?.name||'An Ultra Beast';say('An Ultra Wormhole has opened! '+name+' is on the other side…',5);try{R.Sprites.preload?.([dex]);R.Audio.sfx('rift');R.Camera.kick(.18);}catch(_){}cry(dex);}
 function open(dex=pick()){
  if(!permitted()||!isUB(dex)||!R.SPRITE_META[dex])return false;const p=R.Game.player;let at=null;
  for(let i=0;i<60;i++){const a=Math.random()*TAU,d=240+Math.random()*180,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d*.75;const crowded=(R.World.propsInCircle?.(x,y,140)||[]).some(q=>q.solid!==false&&Math.hypot((q.x??x)-x,((q.y??y)-y)*1.2)<125+(q.rx||q.r||0));if(!crowded&&R.World.isFree(x,y,40,false)&&!R.World.isLiquid(x,y)){at=[x,y];break;}}
  if(!at)return false;const ev=['rift',at[0],at[1],CFG.life,false,{psUltraDex:dex}];R.Rift.onEvent(ev);if(R.Coop?.active&&R.Coop.isHost)R.Coop.broadcast(ev);return true;
 }
 function tick(){if(st.run!==R.Game.player){st.run=R.Game.player;st.next=time()+CFG.every;st.preview=null;}reward();if(R.Game.state!=='playing'||!R.Game.player||R.Game.player.dead)return;const t=time();if(t>=st.next&&host()){st.next=t+CFG.every;if(permitted()&&Math.random()<CFG.chance)open();}}
 const enter=R.Rift.enterRequest;R.Rift.enterRequest=function(...args){st.pendingDex=R.Rift.rift?.psUltraDex||null;return enter.apply(this,args);};
 const update=R.Rift.update;
 R.Rift.update=function(...args){st.pendingDex=R.Rift.rift?.psUltraDex||null;const before=R.Rift.arena,result=update.apply(this,args);tick();const ar=R.Rift.arena;if(ar&&ar!==before&&!ar.gold){st.preview=null;if(isUB(ar.dex))cry(ar.dex);}return result;};
 const reset=R.Rift.reset;
 R.Rift.reset=function(...args){stopCry();st.run=null;st.next=CFG.every;st.preview=null;return reset.apply(this,args);};
 function visualState(age,ttl){const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},opening=smooth((age-.25)/2.25),closing=smooth(ttl/2.4);return {opening,closing,alpha:Math.min(smooth(age/.55),closing),stage:ttl<2.4?'collapsing':age<2.5?'forming':'stable'};}
 function draw(ctx,r){
  const t=time(),age=r.t||0,v=visualState(age,Math.max(0,r.ttl||0));if(v.alpha<=0)return;
  const low=!!window.PS_SETTINGS?.lowEffects,x=r.x,y=r.y-67,spread=Math.max(.018,v.opening*v.closing),pulse=1+Math.sin(t*2.1)*.025;
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=v.alpha;ctx.globalCompositeOperation='lighter';
  const halo=ctx.createRadialGradient(0,0,8,0,0,166);halo.addColorStop(0,'rgba(205,251,255,.68)');halo.addColorStop(.3,'rgba(85,200,255,.28)');halo.addColorStop(.62,'rgba(169,84,245,.12)');halo.addColorStop(1,'rgba(90,150,255,0)');ctx.fillStyle=halo;ctx.fillRect(-166,-166,332,332);
  // A hairline tear widens into the mouth of a funnel, then contracts into a point on expiry.
  ctx.save();ctx.scale(spread*pulse,(.5+.5*spread)*pulse);
  const mouth=ctx.createRadialGradient(14,-6,2,0,0,78);mouth.addColorStop(0,'rgba(255,255,255,.96)');mouth.addColorStop(.22,'rgba(225,255,255,.9)');mouth.addColorStop(.55,'rgba(86,197,255,.35)');mouth.addColorStop(.82,'rgba(62,108,231,.2)');mouth.addColorStop(1,'rgba(112,63,220,0)');ctx.fillStyle=mouth;ctx.beginPath();ctx.ellipse(0,0,63,71,0,0,TAU);ctx.fill();
  // Offset perspective rings and curved meridians reveal a tunnel behind the luminous mouth.
  for(let j=0;j<(low?4:7);j++){const z=(j/7+t*.12)%1,k=.18+.82*z*z,cx=(1-k)*29,cy=(1-k)*-13;ctx.globalAlpha=v.alpha*(.18+.44*z);ctx.strokeStyle=j%2?'#d6fcff':'#75d9ff';ctx.lineWidth=.8+z;ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*TAU,wr=1+.025*Math.sin(a*5+t*1.8+j);const X=cx+Math.cos(a)*58*k*wr,Y=cy+Math.sin(a)*66*k*wr;if(i===0)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);}ctx.stroke();}
  for(let j=0;j<(low?6:12);j++){const a=j/12*TAU+t*.08;ctx.strokeStyle=j%3?'#9befff':'#d5bdff';ctx.lineWidth=1;ctx.globalAlpha=v.alpha*.43;ctx.beginPath();for(let k=0;k<=16;k++){const z=k/16,scale=.16+.84*z*z,X=(1-scale)*29+Math.cos(a+z*.12)*58*scale,Y=(1-scale)*-13+Math.sin(a+z*.12)*66*scale;if(k===0)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);}ctx.stroke();}
  // Broken auroral ribbons race around the edge rather than forming static hoops.
  const colors=['#8cf7ff','#b2c8ff','#f7b5ff','#b0ffd9','#ffffff'];
  for(let j=0;j<(low?5:10);j++){const a=t*(j%2?.34:-.25)+j*.71,len=.36+.22*Math.sin(j*8+t*.7),rad=1+.035*Math.sin(t*2+j);ctx.strokeStyle=colors[j%colors.length];ctx.lineWidth=j%3?2:3.5;ctx.globalAlpha=v.alpha*(.5+.25*Math.sin(t*1.6+j)**2);ctx.beginPath();for(let i=0;i<=16;i++){const u=a+i/16*len,k=1+.018*Math.sin(u*13+t*3);const X=Math.cos(u)*61*k*rad,Y=Math.sin(u)*70*k*rad;if(i===0)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);}ctx.stroke();}
  ctx.restore();
  // Radial fractures branch away from the rim. Smooth pulses avoid a harsh full-screen flash.
  const rays=low?7:14;
  for(let i=0;i<rays;i++){const a=i/rays*TAU+.07*Math.sin(t*.6+i),life=.35+.65*Math.sin(t*1.8+i*3.1)**2,length=(96+35*Math.sin(i*14)**2)*(.45+.55*spread),sx=Math.cos(a)*59*spread,sy=Math.sin(a)*68*(.5+.5*spread);ctx.globalAlpha=v.alpha*life*.72;ctx.strokeStyle=i%3?'#b8efff':'#e4baff';ctx.lineWidth=low?1.3:2;ctx.beginPath();ctx.moveTo(sx,sy);let branch=null;for(let k=1;k<=5;k++){const d=k/5*length,jag=Math.sin(i*19+k*6+Math.floor(t*5)*.7)*9*(k===5?.45:1),X=sx+Math.cos(a)*d-Math.sin(a)*jag,Y=sy+Math.sin(a)*d+Math.cos(a)*jag;ctx.lineTo(X,Y);if(k===3)branch=[X,Y];}ctx.stroke();if(!low&&i%2===0){ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(branch[0],branch[1]);ctx.lineTo(branch[0]+Math.cos(a+.55)*19,branch[1]+Math.sin(a+.55)*19);ctx.lineTo(branch[0]+Math.cos(a+.4)*36,branch[1]+Math.sin(a+.4)*36);ctx.stroke();}}
  // Stardust spirals inward along the pressure field.
  for(let i=0;i<(low?12:30);i++){const u=(t*.19+i*.618)%1,a=i*2.399+t*.25+u*.9,rad=(67+(1-u)*70)*Math.max(.2,spread),X=Math.cos(a)*rad,Y=Math.sin(a)*rad*1.05;ctx.globalAlpha=v.alpha*Math.sin(u*Math.PI)*.75;ctx.fillStyle=colors[i%5];ctx.fillRect(Math.round(X/2)*2,Math.round(Y/2)*2,i%5?2:3,i%5?2:3);}
  ctx.globalCompositeOperation='source-over';
  if(r.psUltraDex&&v.opening>.8){if(st.preview?.dex!==r.psUltraDex){st.preview={dex:r.psUltraDex,anim:new R.Sprites.Animator(r.psUltraDex,.84,false)};st.preview.anim.loop('Idle');}ctx.save();ctx.scale(spread,1);ctx.beginPath();ctx.ellipse(7,-3,46,56,0,0,TAU);ctx.clip();ctx.globalAlpha=v.alpha*Math.min(1,(v.opening-.8)*5)*.88;st.preview.anim.draw(ctx,7,31+Math.sin(t*1.6)*2);ctx.restore();}
  ctx.restore();
 }
 const drawable=R.Rift.drawable;
 R.Rift.drawable=function(...args){const original=drawable.apply(this,args),r=R.Rift.rift;if(!r?.psWormhole)return original;return {y:r.y,draw:ctx=>draw(ctx,r)};};
 const playerUpdate=R.Player.prototype.update;
 R.Player.prototype.update=function(dt,...args){const result=playerUpdate.call(this,dt,...args);if(st.preview&&R.Game.state==='playing')st.preview.anim.update(Math.min(.1,Math.max(0,dt)));return result;};
 const lights=A.Forest.lights;
 A.Forest.lights=function(list,...args){const result=lights.call(this,list,...args),r=R.Rift.rift;if(r?.psWormhole)list.push({x:r.x,y:r.y-60,r:285,c:[173,235,255],i:1.06});return result;};
 window.PS_ULTRA_RIFTS={IDS,CFG,st,isUB,pool,normalize,reward,open,permitted,visualState,draw};
})();
