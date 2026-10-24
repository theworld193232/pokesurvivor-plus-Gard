/* Gard adapter for the friend's 75-social.js: greetings, chase games, shared
   rest, comforting and non-lethal rival sparring. One movement controller only. */
(() => {
  'use strict';
  const E=()=>window.PS_HOOPA_ENGINE,st=e=>window.PS_ENEMY_AI?.ensure(e)?.wildlife;
  const allowed=e=>!!(window.PS_WILDLIFE?.available(e)&&!e.dead);
  const active=[],KINDS=new Set(['greet','play','rest','comfort','spar']);
  let player=null,next=0,attacker=null,attackKind=null;
  const now=()=>performance.now()/1000;
  function end(pair){const i=active.indexOf(pair);if(i>=0)active.splice(i,1);
    for(const e of [pair.a,pair.b]){const w=st(e);if(w?.socialPair===pair){w.socialPair=null;w.socialCooldown=now()+(pair.type==='spar'?20:7);}}
  }
  function start(a,b,type='greet'){
    if(!KINDS.has(type)||a===b||!allowed(a)||!allowed(b)||active.length>=6)return null;
    const wa=st(a),wb=st(b);if(!wa||!wb||wa.socialPair||wb.socialPair)return null;
    const pair={a,b,type,start:now(),until:now()+(type==='play'?10:type==='spar'?12:type==='rest'?10:6),hitA:0,hitB:0};
    wa.socialPair=wb.socialPair=pair;active.push(pair);return pair;
  }
  function beginFrame(all,p){
    const t=now();
    if(p!==player||E()?.Coop?.active||window.PS_SETTINGS?.wildlife===false){for(const pair of [...active])end(pair);player=p;next=t+.5;}
    for(const pair of [...active])if(t>pair.until||!allowed(pair.a)||!allowed(pair.b))end(pair);
    if(t<next||E()?.Coop?.active||window.PS_SETTINGS?.wildlife===false)return;next=t+.5;
    const candidates=all.filter(e=>allowed(e)&&Math.hypot(e.x-p.x,e.y-p.y)<800).slice(0,48);
    const S=window.PS_GARD_WILDLIFE_DATA.Species;
    for(const a of candidates){if(active.length>=6)break;const wa=st(a);
      if(!wa||wa.socialPair||wa.hurt>0||wa.legendReaction||wa.socialCooldown>t||wa.cryFor>0)continue;
      // Combat with the player has priority over social life.
      if(window.PS_WILDLIFE_SOCIAL.canTarget(a,p)&&Math.hypot(a.x-p.x,a.y-p.y)<300)continue;
      const b=candidates.find(b=>{const wb=st(b);return b!==a&&wb&&!wb.socialPair&&!wb.legendReaction&&!(wb.socialCooldown>t)&&Math.hypot(a.x-b.x,a.y-b.y)<180&&
        (wb.cryFor>0||wb.hurt<=0)&&(!window.PS_WILDLIFE_SOCIAL.canTarget(b,p)||Math.hypot(b.x-p.x,b.y-p.y)>300);});
      if(!b)continue;const wb=st(b),relation=S.relationOf(S.profile(a.dex),S.profile(b.dex),wa.pers);
      let type=wb.cryFor>0 && wa.pers.tr.sociability>.45?'comfort':relation==='rival'?'spar':
        wa.pers.tr.playfulness>.55&&wb.pers.tr.playfulness>.45?'play':relation==='kin'||relation==='friend'?'rest':'greet';
      start(a,b,type);
    }
  }
  function hit(a,b,kind){
    // Sparring stops at half HP and cannot grant kills, loot or player rewards.
    const damage=Math.min(Math.max(1,b.maxHp*.025),Math.max(0,b.hp-Math.max(1,b.maxHp*.5)));
    if(!(damage>0)||!allowed(b))return;
    const env=b._env,dot=b._dot;attacker=a;attackKind=kind;b._env=true;b._dot=true;
    try{b.hurt(damage,'#ffd285',b.x-a.x,b.y-a.y,8,null);}finally{b._env=env;b._dot=dot;attacker=null;attackKind=null;}
  }
  function step(e,w,p,dt,move,s,mark){
    const pair=w.socialPair;if(!pair)return false;
    const other=e===pair.a?pair.b:pair.a,ow=st(other),t=now()-pair.start;
    if(!allowed(other)||!ow||w.legendReaction||w.hurt>0&&!w.npcAttacker||ow.hurt>0&&!ow.npcAttacker&&pair.type!=='comfort') {end(pair);return false;}
    const dx=other.x-e.x,dy=other.y-e.y,d=Math.hypot(dx,dy)||1,space=(Number(e.r)||14)+(Number(other.r)||14)+18;
    let vx=0,vy=0,speed=.5;
    if(pair.type==='play'){
      const chasing=(Math.floor(t/3.2)%2===0)===(e===pair.a);
      vx=dx/d*(chasing?1:-1);vy=dy/d*(chasing?1:-1);speed=chasing?1.05:.95;w.action='play-npc';
    }else if(pair.type==='spar'){
      w.action='spar';if(t>1.5){vx=d>space?dx/d:0;vy=d>space?dy/d:0;speed=.8;
        const key=e===pair.a?'hitA':'hitB';if(d<space+8&&now()>pair[key]){pair[key]=now()+1.1;hit(e,other,'spar');}
        if(e.hp<=Math.max(1,e.maxHp*.5)||other.hp<=Math.max(1,other.maxHp*.5)){end(pair);w.sadFor=e.hp<other.hp?3:0;return false;}
      }
    }else{w.action=pair.type==='rest'?'rest-together':pair.type;vx=d>space?dx/d:0;vy=d>space?dy/d:0;
      if(pair.type==='comfort'&&d<space+8){ow.fear=Math.max(0,ow.fear-dt*.1);ow.cryFor=Math.max(0,(ow.cryFor||0)-dt*.6);}
    }
    move(e,s,vx,vy,dt*speed);w.hostile=false;s.flee=false;
    e.touchCd=Math.max(Number(e.touchCd)||0,.6);e.shotCd=Math.max(Number(e.shotCd)||0,.6);s.tc=e.touchCd;
    e.psAi='wildlife:'+w.pers.temp+':'+w.action;return true;
  }
  window.PS_WILDLIFE_INTERACTIONS={beginFrame,step,start,end,get active(){return active.slice();},get attacker(){return attacker;},get attackKind(){return attackKind;}};
})();
