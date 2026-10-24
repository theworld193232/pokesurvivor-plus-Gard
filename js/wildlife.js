/* Gard solo wildlife adapter. Species weights/traits are ported from the friend's
   Living World AI; short-lived anger/fear follow its personality-scaled model.
   Occasional individuals only; the majority retains survivor combat.
   Gard's enemy-ai.js remains the only movement controller. */
(() => {
  'use strict';
  const engine = () => window.PS_HOOPA_ENGINE;
  const U = {
    clamp: (v,a,b) => Math.max(a,Math.min(b,v)),
    rng(seed) { let s=seed>>>0||1; return () => {s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}; },
    wpick(weights,rnd) {let total=0;for(const v of Object.values(weights))total+=Math.max(0,v);let n=rnd()*total;for(const k in weights){n-=Math.max(0,weights[k]);if(n<=0)return k;}return 'neutral';}
  };
  const data = window.PS_GARD_WILDLIFE_DATA = {
    U, cfg:{hostility:1,hostilityRamp:600,wildlifeChance:.10,maxWildlife:6}, time:0,
    get R() {const E=engine();return {...E,Sprites:{bodyRadius:(dex,scale)=>E.Sprites?.bodyRadius?.(dex,scale)||16,hovers:dex=>!!E.Sprites?.hovers?.(dex)}};},
    define(name,mod) {this[name]=mod;}
  };
  const excluded = e => !e || e.dead || e.remote || e.boss || e.legend || e.isLegend || e.judge || e.arceus || e.dummy || e.elite || e.ally || e.friendly || e.__roamer || e.__maxRaid || e.__wave || e.__legendDen || e.__psCatch || e.__psCaughtGone || ['remote','thief','bomber','healer','shielder','summoner'].includes(e.behavior);
  // Select once per individual. Most enemies keep native survivor combat.
  const choices=new WeakMap(),selected=new Set();
  let runPlayer=null;
  function selectedForWildlife(e){
    const player=engine()?.Game?.player;
    if(player!==runPlayer){selected.clear();runPlayer=player;}
    if(choices.has(e))return choices.get(e);
    for(const actor of selected)if(actor.dead || actor.__psCaughtGone)selected.delete(actor);
    const chosen=selected.size<data.cfg.maxWildlife && Math.random()<data.cfg.wildlifeChance;
    choices.set(e,chosen);if(chosen)selected.add(e);return chosen;
  }
  function available(e) {
    const E=engine();
    return !!(E && data.Species && !E.Coop?.active && window.PS_SETTINGS?.wildlife!==false && !excluded(e) &&
      !E.Rift?.inArena && !E.Judgment?.active && !window.PS_SAFEZONE?.active && !window.PS_ROUTE1?.active?.() && window.PS_MODES?.run?.mode!=='legend' && selectedForWildlife(e));
  }
  function create(e) {
    if(!available(e))return null;
    data.time=Number(engine().Game?.time)||0;
    const seed=(Math.random()*4294967296)>>>0,pers=data.Species.roll(e,seed);
    return {pers,dex:e.dex,homeX:e.x,homeY:e.y,hp:Number(e.hp)||0,anger:0,fear:0,hurt:0,t:0,decision:0,angle:U.rng(seed)()*Math.PI*2,awakeFor:0,cryFor:0,hits:0,gestureBeat:-1,action:'wander',hostile:false};
  }
  function stance(e,w,p) {
    const d=Math.hypot(e.x-p.x,e.y-p.y),home=Math.hypot(p.x-w.homeX,p.y-w.homeY);
    return w.hurt>0 && !w.npcAttacker && !w.environmentHit || w.pers.temp==='aggressive' ||
      (['territorial','protective'].includes(w.pers.temp) && home<(w.hostile?230:170)) ||
      (w.pers.temp==='opportunistic' && p.maxHp>0 && p.hp/p.maxHp<.35 && d<280);
  }
  function peaceful(e,s,p) {
    if(!s?.wildlife || !available(e))return false;
    const w=s.wildlife;
    if(w.socialPair || w.cryFor>0 || w.legendReaction || w.pers.temp==='timid' || w.fear>.45 && w.pers.tr.bravery<.35)return true;
    return Number(e.hp)>=w.hp && (w.npcAttacker || !stance(e,w,p));
  }
  function step(e,s,p,dt,move,mark) {
    if(!available(e)) {s.wildlife=null;return false;}
    let w=s.wildlife;
    if(!w || w.dex!==e.dex) {w=s.wildlife=create(e);if(!w)return false;}
    w.t+=dt;w.decision-=dt;
    const tr=w.pers.tr,hp=Number(e.hp)||0;
    if(hp<w.hp-.01) {
      w.npcAttacker=w.pendingFromNPC||null;w.environmentHit=!!w.pendingEnvironment;
      const spar=!!w.pendingSpar;w.pendingFromNPC=null;w.pendingEnvironment=false;w.pendingSpar=false;w.hits+=spar?0:1;
      if(!spar && w.hits<3 && ['friendly','playful'].includes(w.pers.temp) && tr.bravery<.55 && tr.aggression<.45){w.cryFor=2.5;w.fear=Math.max(w.fear,.6);}

      w.anger=U.clamp(w.anger+.45+tr.aggression*.8,0,1);
      w.fear=U.clamp(w.fear+.35*(1.35-tr.bravery*.9),0,1);
      if(!spar && w.hits>=3 && w.pers.temp!=='timid'){w.cryFor=0;w.fear=Math.min(w.fear,.3);w.anger=1;}
      w.hurt=spar?0:12+tr.grudge*16;mark(s,'!',.8);
    }
    w.hp=hp;w.hurt=Math.max(0,w.hurt-dt);w.sadFor=Math.max(0,(w.sadFor||0)-dt);
    w.anger=Math.max(0,w.anger-dt*.045*(.4+tr.forgiveness*1.1-tr.grudge*.2));
    w.fear=Math.max(0,w.fear-dt*.05*(.55+tr.bravery*.9));
    const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;
    w.awakeFor=d<75+tr.alertness*45 ? 4+tr.alertness*4 : Math.max(0,w.awakeFor-dt);
    if(w.cryFor>0){w.cryFor=Math.max(0,w.cryFor-dt);w.action='cry';w.hostile=false;
      move(e,s,0,0,0);e.touchCd=Math.max(Number(e.touchCd)||0,.6);e.shotCd=Math.max(Number(e.shotCd)||0,.6);s.tc=e.touchCd;s.hp=hp;s.flee=false;e.psAi='wildlife:'+w.pers.temp+':cry';return true;}
    if(window.PS_WILDLIFE_SOCIAL?.react(e,w,p,dt,move,s,mark))return true;
    const frightened=w.pers.temp==='timid' && (d<190 || w.hurt>0) || (w.fear>.45 && tr.bravery<.55);
    w.hostile=!frightened && stance(e,w,p);
    if(w.hostile) {
      w.action='fight';s.kind=['skittish','passive','crybaby'].includes(s.baseKind)?'aggressive':s.baseKind;
      e.psAi='wildlife:'+w.pers.temp+':fight';return false;
    }
    // Suppress before the native update too (enemy-ai hook), so a resting Pokémon
    // cannot land a contact hit or create a shot on the same tick it is peaceful.
    e.touchCd=Math.max(Number(e.touchCd)||0,.25);e.shotCd=Math.max(Number(e.shotCd)||0,.5);s.tc=e.touchCd;
    s.flee=false;s.kind=s.baseKind;s.hp=hp;
    if(frightened) {w.action='flee';move(e,s,dx/d,dy/d,dt*1.05);mark(s,'drop',.3);}
    else if(w.hurt>0 && tr.bravery<.35) {w.action='retreat';move(e,s,dx/d,dy/d,dt);}
    else {
      if(w.decision<=0) {
        w.decision=2+tr.alertness*2;w.angle+=(Math.random()-.5)*2;
        const q=w.pers.quirks;
        w.action=q.has('sleepy')||q.has('lazy') ? (Math.sin(w.t*.18)>-.4?'rest':'wander')
          : q.has('headache') && Math.sin(w.t*.4)>.2 ? 'headache'
          : (q.has('dancer')||q.has('singer')||q.has('cheer')) && Math.sin(w.t*.3)>.2 ? 'dance'
          : w.pers.temp==='playful'?'play':w.pers.temp==='friendly'?'curious':['territorial','protective'].includes(w.pers.temp)?'guard':'wander';
      }
      let vx=Math.cos(w.angle),vy=Math.sin(w.angle),speed=.45;
      const hx=w.homeX-e.x,hy=w.homeY-e.y,hd=Math.hypot(hx,hy);
      if(w.action==='rest' && w.awakeFor>0)w.action='watch';
      if(w.action==='watch' && w.awakeFor<=0){w.action='rest';w.decision=0;}
      if(w.action==='rest') {vx=vy=0;mark(s,'zzz',.3);}
      else if(w.action==='watch') {vx=vy=0;mark(s,'?',.3);}
      else if(w.action==='headache'||w.action==='dance') {
        vx=vy=0;mark(s,w.action==='dance'?'note':'swirl',.3);
        const beat=Math.floor(w.t/(w.action==='dance'?.6:2));
        if(beat!==w.gestureBeat){w.gestureBeat=beat;
          if(w.action==='dance' && e.anim && !e.anim.busy?.())e.anim.dir=(Number(e.anim.dir)+1||0)%8;
          else if(w.action==='headache' && typeof e.anim?.play==='function' && !e.anim.busy?.())e.anim.play('Hurt',{speed:.7});
        }
      }
      else if(w.action==='play' && d<340) {const radial=(d-170)/100;vx=-dy/d-dx/d*radial;vy=dx/d-dy/d*radial;speed=.7;mark(s,'?',.3);}
      else if(w.action==='curious' && d<320) {const radial=(d-140)/100;vx=-dx/d*radial;vy=-dy/d*radial;speed=d>120&&d<160?0:.45;mark(s,'?',.3);}
      if(hd>220 || w.action==='guard' && hd>40) {vx=hx;vy=hy;speed=.55;}
      // Soft arrival and no frame-by-frame random decisions avoid visible jitter.
      move(e,s,vx,vy,dt*speed);
    }
    e.psAi='wildlife:'+w.pers.temp+':'+w.action;return true;
  }
  window.PS_WILDLIFE={available,create,step,peaceful};
})();
