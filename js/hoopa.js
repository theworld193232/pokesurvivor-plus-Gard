/* Hyperspace Hole: tiered summons; collectible shiny rewards use the game save. */
(() => {
  'use strict';
  const E = window.PS_HOOPA_ENGINE;
  if (!E) throw new Error('Hyperspace Hole requires the Hoopa engine bridge.');
  const ID = 'hyperspace-hole', LIFETIME = 30, SIGNATURE_TIME = 12;
  const SHINY_RATE = 0.20, COLLECTIBLE_RATE = 0.001, IMMUNITY = 10;
  const stages = [
    {tier:1,cap:2,name:'Common'}, {tier:1,cap:3,name:'Common'},
    {tier:2,cap:3,name:'Uncommon'}, {tier:3,cap:3,name:'Rare'},
    {tier:3,cap:3,name:'Rare'}, {tier:4,cap:3,name:'Epic'},
    {tier:5,cap:4,name:'Legendary'}
  ];
  const stageOf = def => stages[Math.max(0,Math.min(stages.length-1,(def.lvl||1)-1))];
  const attacksFor = level => level>=7?4:level>=4?3:level>=2?2:1;
  // Signature or iconic attacks, adapted to the survival game's combat shapes.
  // Species without a damaging signature use an iconic damaging attack.
  const signatures = {
    144:['Ice Beam','ice','beam'],145:['Thunder','electric','burst'],146:['Fire Blast','fire','burst'],
    150:['Psystrike','psychic','burst'],151:['Psychic','psychic','burst'],
    243:['Thunder','electric','burst'],244:['Sacred Fire','fire','burst'],245:['Hydro Pump','water','beam'],
    249:['Aeroblast','flying','beam'],250:['Sacred Fire','fire','burst'],251:['Future Sight','psychic','burst'],
    377:['Stone Edge','rock','burst'],378:['Ice Beam','ice','beam'],379:['Flash Cannon','steel','beam'],
    380:['Mist Ball','psychic','burst'],381:['Luster Purge','psychic','beam'],382:['Origin Pulse','water','beam'],
    383:['Precipice Blades','ground','burst'],384:['Dragon Ascent','flying','strike'],385:['Doom Desire','steel','burst'],386:['Psycho Boost','psychic','burst'],
    480:['Extrasensory','psychic','beam'],481:['Extrasensory','psychic','beam'],482:['Extrasensory','psychic','beam'],
    483:['Roar of Time','dragon','beam'],484:['Spacial Rend','dragon','strike'],485:['Magma Storm','fire','burst'],
    486:['Crush Grip','normal','strike'],487:['Shadow Force','ghost','strike'],488:['Moonblast','fairy','burst'],
    489:['Bubble Beam','water','beam'],490:['Surf','water','burst'],491:['Dark Pulse','dark','burst'],492:['Seed Flare','grass','burst'],493:['Judgment','normal','burst'],494:['V-create','fire','strike'],
    638:['Sacred Sword','fighting','strike'],639:['Sacred Sword','fighting','strike'],640:['Sacred Sword','fighting','strike'],
    641:['Bleakwind Storm','flying','burst'],642:['Wildbolt Storm','electric','burst'],643:['Blue Flare','fire','beam'],644:['Bolt Strike','electric','strike'],645:['Sandsear Storm','ground','burst'],646:['Glaciate','ice','burst'],
    647:['Secret Sword','fighting','strike'],648:['Relic Song','normal','burst'],649:['Techno Blast','normal','beam'],
    716:['Moonblast','fairy','burst'],717:['Oblivion Wing','flying','beam'],718:['Thousand Arrows','ground','burst'],719:['Diamond Storm','rock','burst'],720:['Hyperspace Fury','dark','strike'],721:['Steam Eruption','water','burst'],
    772:['Crush Claw','normal','strike'],773:['Multi-Attack','normal','strike'],
    785:["Nature's Madness",'fairy','burst'],786:["Nature's Madness",'fairy','burst'],787:["Nature's Madness",'fairy','burst'],788:["Nature's Madness",'fairy','burst'],
    789:['Teleport','psychic','support'],790:['Cosmic Power','psychic','support'],791:['Sunsteel Strike','steel','strike'],792:['Moongeist Beam','ghost','beam'],
    800:['Prismatic Laser','psychic','beam'],801:['Fleur Cannon','fairy','beam'],802:['Spectral Thief','ghost','strike'],807:['Plasma Fists','electric','strike'],808:['Flash Cannon','steel','beam'],809:['Double Iron Bash','steel','strike'],
    888:['Behemoth Blade','steel','strike'],889:['Behemoth Bash','steel','strike'],890:['Dynamax Cannon','dragon','beam'],891:['Close Combat','fighting','strike'],892:['Wicked Blow','dark','strike'],893:['Jungle Healing','grass','support'],
    894:['Thunder Cage','electric','burst'],895:['Dragon Energy','dragon','beam'],896:['Icicle Crash','ice','burst'],897:['Shadow Ball','ghost','burst'],898:['Psychic','psychic','burst'],905:['Springtide Storm','fairy','burst'],
    1001:['Ruination','dark','burst'],1002:['Ruination','dark','burst'],1003:['Ruination','dark','burst'],1004:['Ruination','dark','burst'],1007:['Collision Course','fighting','strike'],1008:['Electro Drift','electric','strike'],
    1014:['Gunk Shot','poison','burst'],1015:['Psychic','psychic','burst'],1016:['Moonblast','fairy','burst'],1017:['Ivy Cudgel','grass','strike'],1024:['Tera Starstorm','normal','burst'],1025:['Malignant Chain','poison','beam']
  };
  const roster = Object.values(E.DEX_BY).filter(mon => E.SPRITE_META[mon.dex]);
  // Match exact rarity, across every region. Legendary flags never enter an earlier pool.
  const pools = stages.map(({tier}) => roster.filter(mon => tier===5 ? mon.rarity===5 : mon.rarity===tier && !mon.leg));
  const move = {id:ID,name:'Hyperspace Hole',type:'psychic',kind:'summon',psCast:ID,
    desc:'Summon defenders for 30 seconds (60 at final tier); 10s fixed cooldown; summons a left/right pair. Starts with 2 Common allies, ends with 4 Legendary allies. Allies spread out, intercept threats, collect loot, activate crystals, and open chests. 1 to 4 native attacks; max tier fully upgrades attacks and switches rapidly. 10s immunity (20s at final tier). Water walking, held items, and final-tier Z-Moves. Temporary shiny: 20%; collectible shiny: 0.1%.',
    cd:10,dmg:32,radius:400,count:1,maxLvl:7,ups:[
      {t:'+1 summon capacity (3 Common); 2 attacks per ally',m:{}},
      {t:'Summon tier: Uncommon (3 allies)',m:{}},
      {t:'Summon tier: Rare (3 allies); 3 attacks per ally',m:{}},
      {t:'Rare defenders: faster attack switching',m:{}},
      {t:'Summon tier: Epic (3 allies)',m:{}},
      {t:'Final tier: Legendary (4 allies); 4 attacks per ally',m:{}}
    ]};
  E.Moves.ALL.push(move);
  E.Moves.BY_ID[ID] = move;
  // The Pokédex's learnable kit and level-up choices use poolFor, not startMoveOf.
  const originalPoolFor = E.Moves.poolFor;
  E.Moves.poolFor = function(mon, ...args) {
    const ids = originalPoolFor.call(this, mon, ...args);
    return Number(mon.dex) === 720 ? [...new Set([...ids, ID])] : ids;
  };
  const originalStart = E.baseStartMoveOf;
  E.baseStartMoveOf = function(dex, ...args) { return Number(dex) === 720 ? ID : originalStart.call(this,dex,...args); };
  const originalPreferred = E.startMoveOf;
  E.startMoveOf = function(dex, ...args) { return Number(dex) === 720 ? ID : originalPreferred.call(this,dex,...args); };
  let units = [], owner = null;
  let targets = new WeakMap();
  let targetTimers = new WeakMap();
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const color = type => E.U.TYPE_COLOR[type] || '#d68cff';
  const BALANCE={statScale:.2,inherit:.5,zDamage:.5,zCooldown:30,bonusChance:.1,blastRadius:140,blastDamage:60,blastDelay:.8,stun:3};
  let portals=[],bombers=[],sharedZ=0;
  const halfStat=(base,value)=>base+(value-base)*BALANCE.inherit;
  const summonHp=p=>Math.max(1,Math.round(halfStat(p.mon.hp,p.maxHp)*BALANCE.statScale));
  const summonAtk=p=>halfStat(p.baseAtk,p.atk)*BALANCE.statScale;
  function clear() { for (const s of units){s.dead=true;if(s.caster)E.Ult.end(s.caster);} units = []; portals=[];bombers=[];sharedZ=0;targets = new WeakMap(); targetTimers = new WeakMap(); owner = null; }
  function portal(s) { if(s.dead&&s.caster)E.Ult.end(s.caster);portals.push({x:s.x,y:s.y,age:0,leaving:s.dead,anim:s.dead?s.anim:null});E.FX.ring(s.x,s.y,8,40,'#ffd45c',0.65,5); }
  function kitFor(mon,signature,level){
    const kit=[signature], seen=new Set([signature[0]]);
    const candidates=E.Moves.poolFor(mon).map(id=>E.Moves.BY_ID[id]).filter(m=>m && m.id!==ID && !m.psCast && ['projectile','beam','cone','melee','dash','chain','nova','meteor','boomerang'].includes(m.kind) && m.dmg>0);
    candidates.sort((a,b)=>Number(mon.types.includes(b.type))-Number(mon.types.includes(a.type)));
    for(const m of candidates){
      if(seen.has(m.name))continue;
      seen.add(m.name);kit.push([m.name,m.type,m.kind==='beam'?'beam':['melee','dash'].includes(m.kind)?'strike':'burst',m.id]);
      if(kit.length>=attacksFor(level))break;
    }
    for(const id of ['ember','hydro-pump','thunderbolt','body-slam','shadow-ball']){
      if(kit.length>=attacksFor(level))break;
      const m=E.Moves.BY_ID[id];if(!seen.has(m.name)&&!kit.some(k=>k[3]===id)){kit.push([m.name,m.type,m.kind==='beam'?'beam':'burst',id]);seen.add(m.name);}
    }
    return kit.slice(0,attacksFor(level));
  }
  function cast(player, def, hit, ghost) {
    // Remote casts never create a second set of damaging allies.
    if (ghost || player !== E.Game.player || player.dead || Number(player.dex) !== 720) return;
    if (owner !== player) { clear(); owner = player; }
    units = units.filter(s => !s.dead && s.age < lifetime(s));
    const stage=stageOf(def), pool=pools[Math.max(0,Math.min(6,(def.lvl||1)-1))];
    if (units.length >= stage.cap || !pool.length) return;
    const count=Math.min(2,stage.cap-units.length);
    for(let member=0;member<count;member++){
    // Independent species and shiny rolls for each member of the pair.
    const roll=Math.random(), collectible=roll<COLLECTIBLE_RATE;
    const wantsShiny=collectible || roll<COLLECTIBLE_RATE+SHINY_RATE;
    const shinyPool=wantsShiny?pool.filter(mon=>E.Sprites.hasShiny(mon.dex)):[];
    const choices=shinyPool.length?shinyPool:pool;
    const mon = choices[Math.floor(Math.random()*choices.length)];
    const shiny=wantsShiny && E.Sprites.hasShiny(mon.dex);
    const angle = member===0?Math.PI:0;
    const signature = signatures[mon.dex] || [E.Moves.BY_ID[originalStart(mon.dex)]?.name || 'Psychic',mon.types[0],'burst',originalStart(mon.dex)];
    const hp=summonHp(player);
    const s = {dex:mon.dex,types:mon.types,name:mon.name,signature,owner:player,age:0,next:0,shiny,collectible:collectible&&shiny,
      x:player.x+Math.cos(angle)*55,y:player.y+Math.sin(angle)*55,r:16,bodyH:32,
      side:units.length,floating:true,dead:false,hp,maxHp:hp,hurtCd:0,wanderT:0,slowT:0,stunT:0,
      atk:player.atk||1,speed:Math.max(60,player.spd||110),magnet:45,
      kit:kitFor(mon,signature,def.lvl||1),attackIndex:0,
      anim:new E.Sprites.Animator(mon.dex,1,shiny),hit,move:{...def},
      hurt(amount,type){
        if(this.dead || this.age<immunity(this) || this.hurtCd>0 || !Number.isFinite(amount) || amount<=0)return;
        E.Player.prototype.hurt.call(this.caster,amount,type);
        this.hurtCd=0.5;
        if(this.dead)portal(this);
      },
      applySlow(){if(this.age>=immunity(this))this.slowT=2;},
      applyStun(){if(this.age>=immunity(this))this.stunT=0.5;},
      applyBurn(){this.hurt(this.maxHp*0.03,'fire');},
      applyPoison(){this.hurt(this.maxHp*0.03,'poison');}};
    makeActor(s);units.push(s); E.Sprites.preload([mon.dex],4000,shiny); portal(s);
    if(s.collectible && !E.Game.training){
      const save=E.DB.save;
      if(save){
        E.DB.grant(mon.dex,'hyperspace-hole');
        save.shiny=save.shiny||{};
        save.shiny[mon.dex]=save.shiny[mon.dex]||{at:Date.now(),from:'hyperspace-hole'};
        E.DB.commit(true);
        E.UI.toast(`A collectible Shiny ${mon.name} joined your collection!`,5000);
        E.Audio.sfx('shiny');
      }
    }
  }
    if(Math.random()<BALANCE.bonusChance)spawnBomber(player,pool);
  }
  const previousCast = window.PS_CAST;
  window.PS_CAST = function(player,def,hit,ghost) {
    if (def?.psCast === ID) return cast(player,def,hit,ghost);
    return previousCast?.(player,def,hit,ghost);
  };
  const maxed = s => (s.owner.moves?.find(m=>m.id===ID)?.lvl||s.move.lvl)>=7;
  const immunity = s => maxed(s)?20:IMMUNITY;
  const lifetime = s => maxed(s)?60:LIFETIME;
  function upgradedMove(s,base){return E.Moves.instance(base.id,maxed(s)?base.maxLvl||1:1);}
  function nativeMove(s,signature,spec){
    if(!signature)return upgradedMove(s,E.Moves.BY_ID['tackle']);
    const entry=spec||s.signature;
    const supported=m=>m&&!m.psCast&&['projectile','beam','cone','melee','dash','chain','nova','meteor','boomerang'].includes(m.kind);
    const candidate=entry[3]&&E.Moves.BY_ID[entry[3]];
    const exact=supported(candidate)?candidate:null;
    const named=E.Moves.ALL.find(m=>m.name.toLowerCase()===entry[0].toLowerCase()&&supported(m));
    const fallback=E.Moves.BY_ID[entry[2]==='beam'?'hydro-pump':entry[2]==='strike'?'body-slam':'shadow-ball'];
    return {...upgradedMove(s,exact||named||fallback),name:entry[0],type:entry[1]};
  }
  function attack(s,target,signature,spec){
    const def=nativeMove(s,signature,spec);
    s.target=target;s.aim=Math.atan2(target.y-s.y,target.x-s.x);
    E.Player.prototype.cast.call(s.caster,def);
    E.Combat.hoopaCast(s.caster,def);
    return def;
  }
  const chestKey = c => c.type+':'+c.tx+':'+c.ty+':'+c.x+':'+c.y;
  const chestsNear = (x,y,r) => [...new Set([...E.World.propsInCircle(x,y,r),...E.World.specialsNear(x,y,r)])].filter(c=>['chest','bigchest'].includes(c.type)&&!c.hoopaOpened);
  function attackRange(def){
    const close=['melee','dash','cone'].includes(def.kind);
    const reach=Math.max(24,def.kind==='meteor' ? (def.range||360) : def.radius || (def.speed||200)*(def.life||1));
    const max=Math.min(600,reach);
    return {min:close?0:Math.min(140,max*0.35),ideal:close?max*0.7:Math.min(240,max*0.72),max};
  }
  function spawnBomber(player,pool){
    const mon=pool[Math.floor(Math.random()*pool.length)];
    const target=E.EnemyMgr.all().filter(e=>!e.dead&&distance(player,e)<360).sort((a,b)=>distance(player,a)-distance(player,b))[0];
    const b={dex:mon.dex,x:target?.x??player.x,y:target?.y??player.y+65,age:0,owner:player,anim:new E.Sprites.Animator(mon.dex,1,false)};
    bombers.push(b);E.Sprites.preload([mon.dex],4000,false);portal(b);
  }
  function updateBombers(dt){
    for(const b of bombers){
      b.age+=dt;b.anim.update(dt);if(b.age<BALANCE.blastDelay)continue;
      E.FX.ring(b.x,b.y,12,BALANCE.blastRadius,'#bd71ff',.5,6);E.FX.burst(b.x,b.y,'#ffdc64',32,180);E.Audio.sfx('boss');
      for(const e of E.EnemyMgr.all())if(!e.dead&&distance(b,e)<=BALANCE.blastRadius){
        const damage=BALANCE.blastDamage*summonAtk(b.owner)*E.Types.mult('psychic',e.types||['normal']);
        e.hurt(damage,'#bd71ff',e.x-b.x,e.y-b.y,60);e.applyStun(BALANCE.stun);
        if(!e.remote)e.stunT=Math.max(e.stunT||0,BALANCE.stun);
        E.Stats.dmg(b.owner,ID,damage);
      }
      b.done=true;b.dead=true;portal(b);
    }
    bombers=bombers.filter(b=>!b.done);
  }

  function makeActor(s){
    const a=new E.Player(E.DEX_BY[s.dex],{},s.shiny);s.caster=a;a.psHoopa=true;
    for(const k of ['x','y','r','bodyH','anim','dead','hp','maxHp','aim','target'])Object.defineProperty(a,k,{configurable:true,get:()=>s[k],set:v=>s[k]=v});
    let critBonus=0;
    Object.defineProperties(a,{
      baseAtk:{get:()=>summonAtk(s.owner)},baseSpd:{get:()=>halfStat(s.owner.baseSpd,s.owner.spd)},
      dmgReduce:{get:()=>(s.owner.reduction||0)*BALANCE.inherit},level:{get:()=>Math.max(10,s.owner.level)},
      floating:{get:()=>true},cdK:{get:()=>Math.max(.1,halfStat(1,s.owner.cdK)*a.cdMul)},
      critChance:{get:()=>(s.owner.critChance||0)*BALANCE.inherit+critBonus,set:v=>critBonus=v-(s.owner.critChance||0)*BALANCE.inherit}
    });
    a.hurt=amount=>s.hurt(amount);a.ultCd=0;a.ultT=0;
  }
  function escapeGoal(s,enemies,dt){
    const near=enemies.filter(e=>distance(s,e)<170);
    if(near.length<3){s.fleeing=false;s.escape=null;return null;}
    s.fleeing=true;s.escapeT=(s.escapeT||0)-dt;
    if(s.escape&&s.escapeT>0&&distance(s,s.escape)>24)return s.escape;
    let best=null,score=-Infinity;
    for(let i=0;i<24;i++){
      const a=i*Math.PI/12,point={x:s.x+Math.cos(a)*300,y:s.y+Math.sin(a)*300};
      if(!summonFree(point.x,point.y,s.r+2))continue;
      const safety=Math.min(...near.map(e=>distance(point,e)))-near.reduce((n,e)=>n+5000/(distance(point,e)+20),0);
      if(safety>score){score=safety;best=point;}
    }
    s.escape=best;s.escapeT=1.2;if(best){s.path=[];s.navT=0;}return best;
  }
  // Native party transitions already synchronize all human players. Carry local allies too.
  let riftTransition=false;
  function movePartySummons(before){
    if(before===E.Rift.inArena||!owner)return;
    units.forEach((s,i)=>{s.x=owner.x+(i%2?45:-45);s.y=owner.y+Math.floor(i/2)*40;s.chest=null;s.crystal=null;s.loot=null;s.path=[];s.escape=null;s.riftRequested=false;});
  }
  for(const name of ['update','onEvent','enterRequest']){
    const original=E.Rift[name];
    E.Rift[name]=function(...args){const before=E.Rift.inArena;riftTransition=true;try{return original.apply(this,args);}finally{riftTransition=false;movePartySummons(before);}};
  }
  const nativeZCast=E.Ult.cast;
  E.Ult.cast=function(actor){
    if(!actor?.psHoopa)return nativeZCast.call(this,actor);
    if(!units.some(s=>s.caster===actor&&maxed(s))||sharedZ>0||units.some(s=>s.caster.ultT>0))return false;
    const fired=nativeZCast.call(this,actor);if(fired)sharedZ=BALANCE.zCooldown;return fired;
  };
  for(const name of ['drawGround','drawAir']){
    const draw=E.Ult[name];
    E.Ult[name]=function(...args){const everyone=E.Game.everyone;E.Game.everyone=()=>[...everyone.call(E.Game),...units.filter(s=>!s.dead).map(s=>s.caster)];try{return draw.apply(this,args);}finally{E.Game.everyone=everyone;}};
  }

  // Match actual movement collision, not the stricter spawn-position validator.
  // The latter rejects harmless non-solid shoreline props even with water enabled.
  function summonFree(x,y,r){
    const probe={x,y,r,floating:true};E.World.collide(probe);
    return Math.hypot(probe.x-x,probe.y-y)<0.01;
  }
  function clearPath(s,a,b){
    const n=Math.max(1,Math.ceil(distance(a,b)/10));
    for(let i=1;i<=n;i++)if(!summonFree(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,s.r+2))return false;
    return true;
  }
  function route(s,goal){
    const grid=32,start={x:s.x,y:s.y,g:0,key:'0,0',ix:0,iy:0},open=[start],seen=new Map([[start.key,start]]);
    let best=start;
    start.h=distance(start,goal);
    // A bounded A* search can take a temporary detour away from the destination.
    for(let count=0;open.length&&count<1500;count++){
      let idx=0;for(let i=1;i<open.length;i++)if(open[i].g+open[i].h<open[idx].g+open[idx].h)idx=i;
      const node=open.splice(idx,1)[0];node.closed=true;
      if(node.h<best.h)best=node;
      if(node.h<grid||clearPath(s,node,goal)){best={...goal,parent:node};break;}
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const ix=node.ix+dx,iy=node.iy+dy,key=ix+','+iy;
        if(Math.abs(ix)>32||Math.abs(iy)>32)continue;
        const next={x:start.x+ix*grid,y:start.y+iy*grid,ix,iy,key},g=node.g+Math.hypot(dx,dy)*grid,old=seen.get(key);
        if(old&&(old.closed||old.g<=g)||!clearPath(s,node,next))continue;
        if(old)open.splice(open.indexOf(old),1);
        Object.assign(next,{g,h:distance(next,goal),parent:node});seen.set(key,next);open.push(next);
      }
    }
    const path=[];for(let n=best;n?.parent;n=n.parent)path.unshift({x:n.x,y:n.y});return path;
  }
  function navigate(s,goal,step,dt,enemies){
    s.navT=(s.navT||0)-dt;
    let waypoint=goal;
    if(!clearPath(s,s,goal)){
      if(!s.path?.length||s.navT<=0||distance(s.navGoal||goal,goal)>96){s.path=route(s,goal);s.navT=0.9;s.navGoal={x:goal.x,y:goal.y};}
      while(s.path?.length&&distance(s,s.path[0])<8)s.path.shift();
      waypoint=s.path?.[0]||goal;
    }else s.path=[];
    const heading=Math.atan2(waypoint.y-s.y,waypoint.x-s.x),near=enemies.filter(e=>distance(s,e)<140);
    let best=null,bestScore=-Infinity;
    for(const offset of [0,0.4,-0.4,0.8,-0.8,1.3,-1.3,1.8,-1.8,Math.PI]){
      const a=heading+offset,travel=Math.min(step,distance(s,waypoint)),point={x:s.x+Math.cos(a)*travel,y:s.y+Math.sin(a)*travel};
      if(!clearPath(s,s,point))continue;
      let score=(distance(s,waypoint)-distance(point,waypoint))*3-Math.abs(offset)*0.2;
      for(const e of near){const safe=s.r+(e.r||12)+18,d=distance(point,e),old=distance(s,e);
        // Reject moving into contact; retreat strongly if already too close.
        if(!s.fleeing&&d<s.r+(e.r||12)+3&&d<old){score=-Infinity;break;}
        if(s.fleeing)score+=(1/(old+20)-1/(d+20))*3000;
        if(old<safe||d<safe)score+=(d-old)*12-Math.max(0,safe-d)*0.1;
      }
      if(score>bestScore){bestScore=score;best={...point,a};}
    }
    if(best){s.x=best.x;s.y=best.y;s.anim.dir=E.Sprites.dirFromAngle(best.a);}
  }

  function update(dt) {
    const player=E.Game.player;
    if (player!==owner || player?.dead || Number(player?.dex)!==720) { clear(); return; }
    if (E.Game.state!=='playing') return;
    sharedZ=Math.max(0,sharedZ-dt);updateBombers(dt);
    for(const portal of portals)portal.age+=dt;
    portals=portals.filter(portal=>portal.age<1.2);
    const enemies=E.EnemyMgr.all().filter(e=>!e.dead);
    for (const s of units) {
      if(s.dead)continue;
      s.age+=dt;
      const actor=s.caster;
      const scaledHp=summonHp(s.owner);
      if(scaledHp!==s.maxHp){s.hp=s.hp/s.maxHp*scaledHp;s.maxHp=scaledHp;}
      s.atk=actor.atk;s.speed=Math.max(60,actor.spd);
      if(maxed(s)&&s.kit.length<4)s.kit=kitFor(E.DEX_BY[s.dex],s.signature,7);
      for(const buff of Object.values(actor.buffs))if(buff.t>0&&(buff.t-=dt)<=0){buff.n=0;buff.amount=0;}
      for(const k of ['invuln','reviveShield','shadeInv','balloonCd'])actor[k]=Math.max(0,(actor[k]||0)-dt);
      actor.berryTick(dt);s.hp=Math.min(s.maxHp,s.hp+((s.owner.regen||0)*BALANCE.inherit+actor.regen+(actor.bellHeal||0))*dt);actor.bellHeal=0;
      if(maxed(s))E.Ult.update(actor,dt);
      s.hurtCd=Math.max(0,s.hurtCd-dt);s.slowT=Math.max(0,s.slowT-dt);if(s.slowT<=0)delete s.seaSlowFactor;s.stunT=Math.max(0,s.stunT-dt);
      if (s.age>=lifetime(s)) { s.dead=true; portal(s); continue; }
      let target=null,nearest=Infinity;
      for(const e of enemies){
        const d=distance(s,e),claimed=units.filter(u=>u!==s&&!u.dead&&u.target===e).length;
        const score=d+claimed*180-((e.behavior==='thief'||e.golden||[52,1000].includes(e.dex))?700:0)-(distance(player,e)<140?240:0);
        if(score<nearest){target=e;nearest=score;}
      }
      s.target=target;
      // Keep a chest job by world coordinates, not a transient object reference.
      if(s.chest){
        s.chest=chestsNear(s.chest.x,s.chest.y,8).find(c=>chestKey(c)===chestKey(s.chest))||null;
        if(!s.chest)s.chestTime=0;
      }
      if(s.crystal)s.crystal=E.World.specialsNear(s.crystal.x,s.crystal.y,8).find(c=>c.type==='altar'&&!c.used&&chestKey(c)===chestKey(s.crystal))||null;
      if(!s.chest&&!s.crystal)s.crystal=E.World.specialsNear(s.x,s.y,600).filter(c=>c.type==='altar'&&!c.used&&c.kind!==4).sort((a,b)=>distance(s,a)-distance(s,b)).find(c=>!units.some(u=>u!==s&&!u.dead&&u.crystal&&chestKey(u.crystal)===chestKey(c)));
      if(!s.chest&&!s.crystal)s.chest=chestsNear(s.x,s.y,240).sort((a,b)=>distance(s,a)-distance(s,b)).find(c=>!units.some(u=>u!==s&&!u.dead&&u.chest&&chestKey(u.chest)===chestKey(c)));
      const index=s.attackIndex%s.kit.length;
      const signature=maxed(s)||index!==0 || s.age<SIGNATURE_TIME;
      const spec=index===0 ? null : s.kit[index];
      const range=attackRange(nativeMove(s,signature,spec));
      if(target){const safe=s.r+(target.r||12)+12;range.min=Math.max(range.min,Math.min(safe,range.max*0.8));range.ideal=Math.max(range.ideal,range.min+4);}
      const drops=E.Pickups.all();
      if(s.loot&&!drops.includes(s.loot))s.loot=null;
      if(!s.loot)s.loot=drops.filter(drop=>distance(s,drop)<600&&!units.some(u=>u!==s&&!u.dead&&u.loot===drop)).sort((a,b)=>{
        const score=d=>distance(s,d)-(d.kind==='bomb'?160:d.kind==='item'?100:d.kind==='heal'&&player.hp<player.maxHp?80:0);
        return score(a)-score(b);
      })[0]||null;
      const nearbyPickup=s.loot;
      s.magnet=45*halfStat(1,player.magnet/78);
      const nearbyCrystal=E.World.specialsNear(s.x,s.y,160).find(prop=>prop.type==='altar'&&!prop.used);
      // Separate guard posts, with interception between Hoopa and approaching threats.
      const angle=s.side*Math.PI*0.618*2+s.age*0.55;
      const guard={x:player.x+Math.cos(angle)*140,y:player.y+Math.sin(angle)*140};
      let combatGoal=guard;
      if(target){
        const d=distance(s,target),a=d>0.01?Math.atan2(s.y-target.y,s.x-target.x):angle;
        // Close in for short attacks; back off for ranged attacks before firing.
        const orbit=a+(s.side%2?1:-1)*0.22;
        const heading=(d<range.min||d>range.ideal+12)?a:orbit;
        combatGoal={x:target.x+Math.cos(heading)*range.ideal,y:target.y+Math.sin(heading)*range.ideal};
      }
      const escape=escapeGoal(s,enemies,dt);
      const rift=E.Rift.open?E.Rift.rift:null;
      const goal=escape || s.chest || rift || s.crystal || (nearbyPickup|| (target?combatGoal:nearbyCrystal||guard));
      const chestRange=s.chest?Math.max(46,(s.chest.r||16)+s.r+24):0;
      const stop=s.chest&&!escape?chestRange-8:0;
      const dist=distance(s,goal);
      const step=s.stunT>0?0:Math.min(Math.max(0,dist-stop),s.speed*(s.slowT>0?(Number(s.seaSlowFactor)||0.5):1)*dt);
      if(step>0)navigate(s,goal,step,dt,enemies);
      // Repulsion prevents allies stacking, including those attacking the same boss.
      for(const other of units){if(s.chest||other===s||other.dead)continue;
        let dx=s.x-other.x,dy=s.y-other.y,d=Math.hypot(dx,dy);
        if(d<48){if(d<0.01){dx=Math.cos(angle);dy=Math.sin(angle);d=1;}const push=Math.min(48-d,85*dt);const next={x:s.x+dx/d*push,y:s.y+dy/d*push};if(summonFree(next.x,next.y,s.r)&&!enemies.some(e=>distance(next,e)<s.r+(e.r||12)+3&&distance(next,e)<distance(s,e))){s.x=next.x;s.y=next.y;}}
      }
      E.World.collide(s);
      if(s.chest && distance(s,s.chest)<chestRange && !s.stunT){
        const chest=s.chest;
        if(chest.type==='bigchest'){
          s.chestTime=(s.chestTime||0)+dt;chest.open=Math.max(chest.open||0,s.chestTime);
          if(s.chestTime>=(E.Interact.CHEST_TIME||3.5)){chest.hoopaOpened=true;E.World.breakProp(chest);s.chest=null;s.chestTime=0;}
        }else{
          s.chestTime=(s.chestTime||0)+dt;
          if(s.chestTime>=0.6){s.anim.play('Attack');chest.hoopaOpened=true;E.World.breakProp(chest);s.chest=null;s.chestTime=0;}
        }
      }else if(s.chest && distance(s,s.chest)>=chestRange)s.chestTime=0;
      for(const altar of E.World.specialsNear(s.x,s.y,80)){
        if(altar.type==='altar'&&!altar.used&&distance(s,altar)<Math.max(30,(altar.r||12)+s.r+14))E.Interact.hoopaActivateAltar(player,altar);
      }
      s.anim.loop(step>0?'Walk':'Idle');s.anim.update(dt);
      if(rift&&distance(s,{x:rift.x,y:rift.y-10})<28&&!E.Rift.inArena){
        if(!E.Coop.active||E.Coop.isHost){E.Rift.enterRequest();return;}
        else if(!s.riftRequested){s.riftRequested=true;E.Coop.toHost(['re']);}
      }
      if(maxed(s)&&target&&!s.chest&&!s.stunT&&distance(s,target)<360&&!(actor.ultCd>0)&&!(actor.ultT>0))E.Ult.cast(actor);
      // Fire only inside the selected native move's effective distance.
      s.next-=dt;
      if(!s.chest && !s.stunT && target && distance(s,target)>=range.min && distance(s,target)<=range.max && s.next<=0){const fired=attack(s,target,signature,spec);s.attackIndex++;s.next=maxed(s)?Math.max(0.18,Math.min(0.3,(fired.cd||1)*0.35*actor.cdK)):Math.max(0.3,(fired.cd||1)*((s.move.lvl||1)>=5?.75:1)*actor.cdK);}
    }
    units=units.filter(s=>!s.dead);
  }
  // Summoning uses its own fixed timer, independent of target acquisition and cooldown buffs.
  const nativeCombatTick=E.Combat.tick;
  E.Combat.tick=function(dt,player,...args){
    const m=Number(player?.dex)===720?player.moves?.find(m=>m.id===ID):null;
    if(!m)return nativeCombatTick.call(this,dt,player,...args);
    const timer=m.t; m.t=Infinity;
    try{return nativeCombatTick.call(this,dt,player,...args);}
    finally{
      m.t=timer;
      if(player===E.Game.player&&!player.dead&&E.Game.state==='playing'){
        m.t=Math.max(0,(Number.isFinite(timer)?timer:0)-dt);
        if(m.t<=0){cast(player,m,null,false);m.t=10;}
      }
    }
  };
  const nativeInteract=E.Interact.update;
  E.Interact.update=function(dt,player){
    const held=units.filter(s=>!s.dead&&s.chest?.type==='bigchest'&&distance(s,s.chest)<Math.max(46,(s.chest.r||16)+s.r+24)).map(s=>({chest:s.chest,open:s.chest.open}));
    const result=nativeInteract.call(this,dt,player);
    for(const {chest,open} of held)if(!chest.hoopaOpened)chest.open=Math.max(chest.open||0,open||0);
    return result;
  };
  const nativeBreak=E.World.breakProp;
  E.World.breakProp=function(chest,...args){
    const result=nativeBreak.call(this,chest,...args);
    if(['chest','bigchest'].includes(chest.type))chest.hoopaOpened=true;
    return result;
  };
  const nativeUpdate=E.EnemyMgr.update;
  E.EnemyMgr.update=function(dt,...args){
    update(dt);const result=nativeUpdate.call(this,dt,...args);
    if(E.Game.state==='playing'){
      // These units are separate from the Z-move summons, so resolve their collisions here.
      for(const s of units){
        if(s.dead)continue;
        for(const enemy of E.EnemyMgr.all()){
          if(!enemy.dead && distance(s,enemy)<s.r+(enemy.r||12))s.hurt(enemy.dmg,enemy.atkType);
        }
        const shots=E.Projectiles.all();
        for(let i=shots.length-1;i>=0;i--){const shot=shots[i];
          if(!shot.friendly && !shot.ghost && distance(s,shot)<s.r+(shot.r||4)){
            s.hurt(shot.pct?Math.max(shot.dmg,s.maxHp*shot.pct):shot.dmg,shot.mtype);
            shots.splice(i,1);
          }
        }
      }
      units=units.filter(s=>!s.dead);
    }
    return result;
  };
  const nativeClear=E.EnemyMgr.clear;
  E.EnemyMgr.clear=function(...args){if(!riftTransition)clear();return nativeClear.apply(this,args);};
  // Advance pickups once, with summon collectors; rewards always go to their owner.
  const nativePickups=E.Pickups.update;
  E.Pickups.update=function(dt,players,onCollect){
    const collectors=Array.isArray(players)?players.slice():[players];
    if(owner===E.Game.player&&!owner?.dead)collectors.push(...units.filter(s=>!s.dead));
    return nativePickups.call(this,dt,collectors,(drop,collector)=>{
      if(units.includes(collector)&&drop.kind==='item'&&E.Items.BY[drop.value]){collector.caster.equip(drop.value);E.UI.toast(collector.name+' equipped '+E.Items.BY[drop.value].name,2000);return;}
      return onCollect(drop,units.includes(collector)?collector.owner:collector);
    });
  };
  const nativeEnemyUpdate=E.Enemy.prototype.update;
  E.Enemy.prototype.update=function(dt,target,...args){
    if(owner===E.Game.player && !owner?.dead && units.length){
      let chosen=targets.get(this);
      const remaining=(targetTimers.get(this)||0)-dt;
      targetTimers.set(this,remaining);
      if(remaining<=0 || !chosen || chosen.dead || distance(this,chosen)>800 || (chosen!==owner && !units.includes(chosen))){
        const candidates=[owner,...units.filter(s=>!s.dead)];
        chosen=candidates.reduce((best,c)=>distance(this,c)<distance(this,best)?c:best,owner);targets.set(this,chosen);
        targetTimers.set(this,0.75);
      }
      target=chosen;
    }
    return nativeEnemyUpdate.call(this,dt,target,...args);
  };
  const nativeDraw=E.Ult.drawUnits;
  E.Ult.drawUnits=function(ctx){
    nativeDraw.call(this,ctx);
    const player=E.Game.player;
    if(owner!==E.Game.player || owner?.dead) return;
    for(const portal of portals){
      const open=Math.min(1,portal.age/0.25,Math.max(0,(1.2-portal.age)/0.4)),fade=Math.min(1,(1.2-portal.age)/0.35);
      if(portal.leaving&&portal.anim){ctx.save();ctx.globalAlpha=Math.max(0,1-portal.age/0.8);portal.anim.draw(ctx,portal.x,portal.y);ctx.restore();}
      ctx.save();ctx.translate(portal.x,portal.y);ctx.scale(Math.max(0.01,open),Math.max(0.01,open)*0.45);
      ctx.globalAlpha=Math.max(0,fade);ctx.shadowColor='#bd4aff';ctx.shadowBlur=24;
      const glow=ctx.createRadialGradient(0,0,2,0,0,38);glow.addColorStop(0,'#190525');glow.addColorStop(0.6,'#6817a6');glow.addColorStop(1,'#da7dff');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);ctx.fill();
      ctx.shadowColor='#ffdc64';ctx.shadowBlur=10;ctx.strokeStyle='#ffd45c';ctx.lineWidth=5;ctx.stroke();
      ctx.rotate(portal.age*2);ctx.shadowBlur=0;ctx.strokeStyle='#efc0ff';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*1.3);ctx.stroke();ctx.restore();
    }
    for(const b of bombers){ctx.save();ctx.globalAlpha=Math.min(1,b.age/.25);b.anim.draw(ctx,b.x,b.y);ctx.restore();}
    for(const s of units){
      ctx.save();ctx.strokeStyle='#ffd45c';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(s.x,s.y,23,9,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=Math.min(1,s.age/0.35);s.anim.draw(ctx,s.x,s.y);ctx.globalAlpha=1;
      ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#21122e';ctx.lineWidth=3;
      const label=`${s.shiny?'★ ':''}${s.name}${s.caster?.item?' · '+E.Items.BY[s.caster.item].name:''} · ${Math.ceil(lifetime(s)-s.age)}s${s.age<immunity(s)?' · Shield':''}`;
      ctx.strokeText(label,s.x,s.y-46);ctx.fillText(label,s.x,s.y-46);ctx.restore();
      ctx.save();ctx.fillStyle='#25152f';ctx.fillRect(s.x-22,s.y-39,44,4);
      ctx.fillStyle=s.age<immunity(s)?'#65e5ff':'#72e58a';ctx.fillRect(s.x-22,s.y-39,44*s.hp/s.maxHp,4);ctx.restore();
    }
  };
  window.PS_HOOPA={version:11,summonFree,BALANCE,summonHp,summonAtk,get sharedZ(){return sharedZ;},get bombers(){return bombers.slice();},attackRange,nativeMove,navigate,lifetime,immunity,escapeGoal,get summons(){return units.slice();},get portals(){return portals.slice();},signatures,move,stages,stageOf,attacksFor,SHINY_RATE,COLLECTIBLE_RATE};
})();

