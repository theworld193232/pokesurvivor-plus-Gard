/* Gard solo wildlife: emotion bubbles, Legendary reactions and peaceful targeting.
   Adapted around Gard from the friend's Living World mind/render/player concepts.
   Does not install the friend's combat, population, weather or evolution controllers. */
(() => {
  'use strict';
  const E=()=>window.PS_HOOPA_ENGINE,B=()=>window.PS_MEGA_BRIDGE_V5;
  const enabled=()=>!!(E() && !E().Coop?.active && window.PS_SETTINGS?.wildlife!==false);
  const state=e=>window.PS_ENEMY_AI?.stateOf(e)?.wildlife;
  const profile=e=>window.PS_WILDLIFE?.available(e)?(window.PS_ENEMY_AI?.ensure(e)?.wildlife):null;
  let legends=[],legendDex=null;
  function legendary(e){
    if(!e)return false;const d=E()?.DEX_BY?.[e.dex];
    if(e.legend || d?.leg)return true;
    try{if(!legendDex&&window.PS_LEGEND_DEX)legendDex=window.PS_LEGEND_DEX();return !!legendDex?.has(Number(e.dex));}catch(_){return false;}
  }
  function beginFrame(all,p){
    legends=enabled()?[...(legendary(p)?[p]:[]),...all.filter(e=>e&&!e.dead&&!e.__psCatch&&legendary(e))].slice(0,16):[];
    window.PS_WILDLIFE_INTERACTIONS?.beginFrame(all,p);
  }
  function react(e,w,p,dt,move,s,mark){
    w.legendReaction=null;
    if(!enabled())return false;
    let near=null,best=420;
    if(w.hurt<=0 && w.pers.temp!=='aggressive' && w.pers.tr.aggression<=.8)
      for(const l of legends){if(l===e)continue;const d=Math.hypot(l.x-e.x,l.y-e.y);if(d<best){near=l;best=d;}}
    if(near){
      if(w.socialPair)window.PS_WILDLIFE_INTERACTIONS.end(w.socialPair);
      const shy=w.pers.temp==='timid'||w.pers.tr.bravery<.58;
      if(shy){const dx=e.x-near.x,dy=e.y-near.y,d=Math.hypot(dx,dy)||1;
        w.legendReaction='fear';w.action='flee';w.fear=Math.min(1,w.fear+dt*.5);move(e,s,dx/d,dy/d,dt*1.1);mark(s,'drop',.3);
      }else{w.legendReaction='awe';w.action='awe';move(e,s,0,0,0);mark(s,'?',.3);}
      w.hostile=false;s.flee=false;s.hp=w.hp;e.touchCd=Math.max(Number(e.touchCd)||0,.6);e.shotCd=Math.max(Number(e.shotCd)||0,.6);s.tc=e.touchCd;
      e.psAi='wildlife:'+w.pers.temp+':'+w.action;return true;
    }
    return !!window.PS_WILDLIFE_INTERACTIONS?.step(e,w,p,dt,move,s,mark);
  }
  function canTarget(e,p){
    if(!e || e.dead || e.__psCatch || e.__psCaughtGone)return false;
    if(!enabled() || !window.PS_WILDLIFE?.available(e))return true;
    const w=profile(e);if(!w)return true;
    // Evaluate initial temperament before the first native update or RAF step.
    if(w.legendReaction)return false;
    if(w.pers.temp==='aggressive')return true;
    if(w.cryFor>0 || w.npcAttacker || w.environmentHit)return false;
    if(w.hurt>0)return w.pers.temp!=='timid' && !(w.fear>.45&&w.pers.tr.bravery<.55);
    if(['territorial','protective'].includes(w.pers.temp))return Math.hypot(p.x-w.homeX,p.y-w.homeY)<(w.hostile?230:170);
    if(w.pers.temp==='opportunistic')return p.maxHp>0 && p.hp/p.maxHp<.35 && Math.hypot(e.x-p.x,e.y-p.y)<280;
    return false;
  }
  function scoped(p,fn){
    if(!enabled() || !p || p.remote)return fn();
    const M=E().EnemyMgr,saved=[];
    for(const key of ['all','queryCircle'])if(typeof M[key]==='function'){
      const original=M[key];saved.push([key,original]);
      M[key]=function(...args){return original.apply(this,args).filter(e=>canTarget(e,p));};
    }
    try{return fn();}finally{for(const [key,original] of saved)M[key]=original;}
  }
  function chooseTarget(p){
    if(!enabled()||p.remote||p.manualAim)return;
    if(p.target && canTarget(p.target,p))return;
    let target=null,dist=520;
    for(const e of E().EnemyMgr.all())if(canTarget(e,p)){
      if(E().Camera?.sees && !E().Camera.sees(e.x,e.y,0))continue;
      const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<dist){dist=d;target=e;}
    }
    p.target=target;if(target)p.aim=Math.atan2(target.y-p.y,target.x-p.x);
  }
  function expression(w){
    if(w.legendReaction==='fear')return ['Scared','!','#adc7ff'];
    if(w.legendReaction==='awe')return ['Awe','*','#e2c2ff'];
    if(w.action==='flee'||w.action==='retreat')return ['Scared','!','#adc7ff'];
    if(w.action==='fight')return ['Angry','!','#ffadad'];
    if(w.action==='headache')return ['Confused','?','#d4c3ff'];
    if(w.action==='dance')return ['Happy','♪','#ffe2a7'];
    if(w.action==='rest')return ['Sleepy','z Z','#c8dbff'];
    if(w.action==='watch')return ['Alert','?','#fff1b1'];
    if(w.action==='curious')return ['Curious','?','#c6f4d6'];
    if(w.action==='play')return ['Playful','♪','#ffe2a7'];
    if(w.pers.temp==='friendly')return ['Friendly','♡','#ffceeb'];
    if(w.action==='guard')return ['Guarding','…','#fff1b1'];
    return ['Calm','…','#d3ecd8'];
  }
  function emotionIcon(w){
    if(w.action==='cry')return 'sad';
    if(w.legendReaction==='fear'||w.action==='flee'||w.action==='retreat')return 'scared';
    if(w.legendReaction==='awe'||w.action==='awe')return 'sparkle';
    if(w.action==='fight'||w.action==='fight-npc'||w.action==='spar')return 'anger';
    if(w.action==='headache')return 'swirl';
    if(w.action==='dance')return 'note';
    if(w.sadFor>0)return 'tear';
    if(w.action==='rest'||w.action==='rest-together')return 'zzz';
    if(w.action==='watch'||w.action==='curious'||w.action==='greet')return 'question';
    if(w.action==='play'||w.action==='race'||w.action==='play-npc')return 'happy';
    if(w.action==='comfort')return 'love';
    if(w.action==='guard')return 'eyes';
    return w.pers.temp==='friendly'?'love':'dots';
  }
  function bubble(ctx,e,w){
    window.PS_WILDLIFE_EMOTES?.bubble(ctx,e.x,e.y-(Number(e.bodyH)||24)-12,emotionIcon(w));
    if(w.action==='cry'){const t=(performance.now()/450)%1;ctx.save();ctx.fillStyle='#7fc8ff';const y=e.y-(Number(e.bodyH)||24)*.72+t*12;ctx.fillRect(Math.round(e.x-5),Math.round(y),2,3);ctx.fillRect(Math.round(e.x+4),Math.round(y+4-t*4),2,3);ctx.restore();}
  }
  let installed=false;
  function install(){
    const N=E();if(installed)return;
    if(!N?.Player?.prototype?.update || !N.Enemy?.prototype || !N.Training?.drawables){setTimeout(install,300);return;}
    installed=true;
    const update=N.Player.prototype.update;
    N.Player.prototype.update=function(...args){const result=scoped(this,()=>update.apply(this,args));chooseTarget(this);return result;};
    // Only acquisition is filtered. Damage resolution, projectile collision and
    // area/field queries keep the full population so stray attacks can hit anyone.
    if(typeof N.Combat?.tick==='function'){
      const tick=N.Combat.tick;N.Combat.tick=function(dt,p,...args){chooseTarget(p);return tick.call(this,dt,p,...args);};
    }
    // This native method moves/steers projectiles; collision damage happens later
    // in Combat.resolve, which deliberately receives the complete population.
    if(typeof N.Projectiles?.update==='function'){
      const updateProjectiles=N.Projectiles.update;N.Projectiles.update=function(dt,p,list,...args){
        const targets=enabled()&&p&&Array.isArray(list)?list.filter(e=>canTarget(e,p)):list;
        return updateProjectiles.call(this,dt,p,targets,...args);
      };
    }
    if(typeof N.Projectiles?.nearest==='function'){
      const nearest=N.Projectiles.nearest;N.Projectiles.nearest=function(list,...args){
        const p=N.Game.player,targets=enabled()&&p&&Array.isArray(list)?list.filter(e=>canTarget(e,p)):list;
        return nearest.call(this,targets,...args);
      };
    }
    const hurt=N.Enemy.prototype.hurt;
    N.Enemy.prototype.hurt=function(...args){
      const before=Number(this.hp),result=hurt.apply(this,args);
      if(enabled() && Number(this.hp)<before){const w=profile(this);if(w){
        w.pendingFromNPC=window.PS_WILDLIFE_INTERACTIONS?.attacker||null;
        w.pendingSpar=window.PS_WILDLIFE_INTERACTIONS?.attackKind==='spar';
        w.pendingEnvironment=!w.pendingFromNPC&&!!this._env;
      }}return result;
    };
    const draw=N.Training.drawables;
    N.Training.drawables=function(...args){const list=draw.apply(this,args)||[];if(!enabled())return list;
      const p=N.Game.player;if(!p)return list;
      const actors=N.EnemyMgr.all().filter(e=>!e.dead&&!e.__psCatch&&window.PS_WILDLIFE?.available(e)&&state(e)&&Math.hypot(e.x-p.x,e.y-p.y)<600)
        .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,10);
      return [...list,...actors.map(e=>({y:e.y+.2,draw:ctx=>bubble(ctx,e,state(e))}))];
    };
  }
  window.PS_WILDLIFE_SOCIAL={beginFrame,react,canTarget,scoped,expression,emotionIcon,get installed(){return installed;},enabled};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
