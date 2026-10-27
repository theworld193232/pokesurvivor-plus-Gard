/* The weathered grove: a forest encounter for Zacian and Zamazenta. */
(() => {
 'use strict';const R=window.__PSX_REG__,A=window.PSXAI,st={seed:null,site:null,battle:null,won:{},cool:0,discovered:false},DEX=[888,889];let art=null;const shrineImage=new Image();shrineImage.src='assets/env/forest-sanctuary-v36.png';
 const on=()=>!!(A.enabled&&A.Forest.on()&&!A.Mansion?.inside&&!A.Totem?.active()&&!R.Rift?.inArena&&R.Game.player);
 function createArt(){if(shrineImage.complete&&shrineImage.naturalWidth){if(!art?.generated){art=document.createElement('canvas');art.width=192;art.height=168;const g=art.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(shrineImage,0,0,192,168);art.generated=true;}return art;}if(art)return art;art=document.createElement('canvas');art.width=192;art.height=168;const g=art.getContext('2d');g.imageSmoothingEnabled=false;
  // Low-resolution stonework, moss and broken concentric arch segments.
  const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  for(let i=0;i<4;i++){g.fillStyle=['#253e3a','#52635b','#6c7c70','#899084'][i];g.beginPath();g.ellipse(96,113-i*4,73-i*6,30-i*2,0,0,7);g.fill();}
  for(let y=130;y<167;y+=7){box(61-(y-130)*.28,y,70+(y-130)*.56,6,'#53655c');box(62-(y-130)*.28,y,68+(y-130)*.56,2,'#8a9987');}
  for(const x of [43,139]){box(x-8,64,17,54,'#354e4a');box(x-6,62,11,52,'#73857b');box(x-6,64,3,48,'#9eaaa0');box(x-10,111,21,6,'#4d655b');for(let y=68;y<109;y+=11){box(x-6,y,11,1,'#3a514d');}}
  for(let i=0;i<22;i++){if(i===10||i===11||i===12)continue;const a=Math.PI+(i/21)*Math.PI,x=96+Math.cos(a)*50,y=66+Math.sin(a)*54;box(x-7,y-7,14,13,'#324b48');box(x-6,y-7,11,10,i%3?'#778b82':'#61796e');box(x-6,y-7,10,2,'#a1afa2');}
  // The two spiral fragments from the reference, broken stone pedestals and a central altar.
  for(const [cx,cy]of [[78,42],[111,38]])for(let i=0;i<24;i++){const a=i*.5,r=10-i*.33;box(cx+Math.cos(a)*r,cy+Math.sin(a)*r,2,2,'#3a5550');}
  box(85,92,23,14,'#394e48');box(83,88,27,8,'#88958a');box(87,87,19,2,'#b1b8a4');
  for(let i=0;i<42;i++){const x=(i*47+19)%180+6,y=70+(i*31)%88;if(Math.abs(x-96)<22&&y<120)continue;box(x,y,5,2,i%2?'#55734f':'#839552');if(i%5===0)box(x,y-2,2,3,'#a8ae79');}
  return art;
 }
 function place(at){const p=R.Game.player;if(!p||!on())return null;if(at){st.site={x:at[0],y:at[1]};return st.site;}
  for(let i=0;i<80;i++){const a=A.U.hash(A.Decor.seed,i,8811)*Math.PI*2,d=1300+A.U.hash(A.Decor.seed,i,8812)*1500,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d*.8;
   if(R.Camera.sees(x,y,420)||Math.hypot(x,y)<800)continue;
   if(A.Forest.region(x,y).siteK>.1)continue;let clear=true;for(const dx of [-170,0,170])for(const dy of [-150,0,150])if(A.Forest.water(x+dx,y+dy).e>-90)clear=false;if(!clear)continue;
   const m=A.Journey?.st.geo;if(m&&Math.hypot(x-m.D[0],y-m.D[1])<850)continue;st.site={x,y};clearSite();R.Sprites.preload(DEX,5000);return st.site;
  }return null;
 }
 function inClearing(x,y){const q=st.site;return !!(q&&st.seed===A.Decor.seed&&Math.abs(x-q.x)<170&&y>q.y-150&&y<q.y+140);}
 function clearSite(){const q=st.site;if(!q)return;for(const pr of R.World.propsInCircle(q.x,q.y,300)){if(!inClearing(pr.x,pr.y))continue;if(pr.type==='tree'||pr.type==='rock'||pr.type==='grass'){pr.solid=false;pr.hp=0;pr.__groveCleared=true;}}for(const it of A.Decor.inRect(q.x-170,q.y-150,q.x+170,q.y+140,[])){if(['tree','stone','log','stump','plant','bush','flower','tuft','litter','mush'].includes(it.k))A.Decor.breakItem(it);}}
 const visible=R.World.visibleProps;R.World.visibleProps=function(...a){const list=visible.apply(this,a);return on()&&st.site?list.filter(pr=>!pr.__groveCleared):list;};
 const clearGen=window.PSXGEN.clear;window.PSXGEN.clear=function(tx,ty){return on()&&inClearing((tx+.5)*32,(ty+.5)*32)||clearGen.apply(this,arguments);};
 function shapes(){const q=st.site;if(!q)return [];return [{x:q.x-106,y:q.y-24,rx:21,ry:18},{x:q.x+106,y:q.y-24,rx:21,ry:18},{x:q.x,y:q.y-40,rx:25,ry:12},...[-1,1].flatMap(side=>[{x:q.x+side*128,y:q.y+18,rx:15,ry:17},{x:q.x+side*80,y:q.y+68,rx:17,ry:14}])];}
 function blocked(x,y,r=12){return on()&&shapes().some(q=>(x-q.x)**2/(q.rx+r)**2+(y-q.y)**2/(q.ry+r)**2<1);}
 function start(dex){const q=st.site,p=R.Game.player;if(!on()||!q||st.battle||st.won[dex]||A.time<st.cool||R.Game.state!=='playing'||p.dead)return false;const hp=Math.max(1800,(R.Stats.hpRef?.()||300)*6),dmg=R.Enemies.bossDmg?.(R.Game.time)||18,e=new R.Enemy({dex,name:R.DEX_BY[dex].name,hp,spd:dex===888?100:75,dmg,xp:600,behavior:'chase',shotCd:1.6,shotDmg:Math.round(dmg*.45),range:220},q.x+(dex===888?-65:65),q.y+45,{hp:1,spd:1,dmg:1},true);e.legend=true;e.psxStory=true;e.psxPlaced=true;e.psxForceTemp='aggressive';e.psxGrove=true;R.EnemyMgr.add(e);st.battle={e,dex};R.Spawner.say(R.DEX_BY[dex].name+' steps forward to test you.',3);return true;}
 function tick(dt){if(!on())return;const seed=A.Decor.seed,p=R.Game.player;if(st.seed!==seed||st.player!==p){st.player=p;st.seed=seed;st.site=null;st.battle=null;st.won={};st.cool=0;st.discovered=false;}
  if(!st.site&&(R.Game.time||0)>30)place();const q=st.site;if(!q||R.Game.state!=='playing')return;
  if(st.battle){const b=st.battle;if(b.e.dead&&b.e.hp<=0){st.won[b.dex]=true;R.DB.grant(b.dex,'forest-sanctuary');R.DB.commit();R.Pickups.drop('item',p.x,p.y,'mstone_'+b.dex+'_crowned');R.Spawner.say(R.DEX_BY[b.dex].name+' joined you. Its rusted relic rests at your feet.',4);st.battle=null;st.cool=A.time+6;}else if(b.e.dead||p.dead||Math.hypot(p.x-q.x,p.y-q.y)>1600||!R.EnemyMgr.all().includes(b.e)){b.e.dead=true;b.e.hp=0;st.battle=null;st.cool=A.time+60;}return;}
  if(Math.hypot(p.x-q.x,p.y-q.y)<280&&!st.discovered){st.discovered=true;R.Spawner.say('A forgotten grove… two ancient guardians are watching.',4);}
  if(p.level>=20&&Math.hypot(p.x-q.x,p.y-(q.y+60))<100&&!A.Regi?.busy()&&!A.Trio?.busy()&&!R.EnemyMgr.bossAlive())start(!st.won[888]?888:889);
 }
 const ground=R.World.drawGround;R.World.drawGround=function(ctx,...a){const result=ground.call(this,ctx,...a),q=st.site;if(on()&&q&&R.Camera.sees(q.x,q.y,400)){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(createArt(),Math.round(q.x-192),Math.round(q.y-240),384,336);ctx.restore();}return result;};
 const collide=R.World.collide;R.World.collide=function(e,...a){const result=collide.call(this,e,...a);if(!e||!on()||window.PS_LEGEND_FLIGHT?.active(e))return result;for(const q of shapes()){const rx=q.rx+(e.r||12),ry=q.ry+(e.r||12),dx=e.x-q.x,dy=e.y-q.y,n=Math.hypot(dx/rx,dy/ry);if(n<1){if(n>.001){e.x=q.x+dx/n;e.y=q.y+dy/n;}else e.y=q.y+ry;}}return result;};
 const free=R.World.isFree;R.World.isFree=function(x,y,r,...a){return free.call(this,x,y,r,...a)&&!blocked(x,y,r);};
 const tickRegi=A.Regi.tick;A.Regi.tick=function(dt){const result=tickRegi.call(this,dt);tick(dt);return result;};
 const actors=new Map();const air=R.Training.drawAir;R.Training.drawAir=function(ctx,...a){const result=air.call(this,ctx,...a),q=st.site;if(on()&&q&&R.Camera.sees(q.x,q.y,400)&&!st.battle){for(const [i,dex]of DEX.entries()){if(st.won[dex])continue;let actor=actors.get(dex);if(!actor){actor=new R.Sprites.Animator(dex,1,false);actor.loop('Idle');actors.set(dex,actor);}actor.update(1/60);actor.dir=i?5:3;actor.draw(ctx,q.x+(i?64:-64),q.y+25);}}return result;};
 window.PS_FOREST_SANCTUARY={st,place,start,tick,blocked,shapes,createArt};
})();
