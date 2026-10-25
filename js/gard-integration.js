/* One owner for each overlapping system: friend AI, Gard terrain/evolution,
   native friend accounts plus additive Gard gameplay and summon rules. */
(() => {
 'use strict';const R=window.__PSX_REG__,AI=window.PSXAI;
 if(!R||!AI?.R)throw Error('Gard integration: friend AI did not install');
 const enforced={forestWorld:true,naturalTerrain:true,newArt:true,areaSpawns:true,gameWeather:false,evolution:false,earnedEvents:false,hordes:true,
  maxNpcs:96,localCap:18,localRadius:360,spawnInterval:.18,spawnBurst:20,speech:false};
 function configure(){
  Object.assign(AI.cfg,enforced);Object.assign(AI.DEFAULTS,enforced);
  for(const key of ['forestWorld','naturalTerrain','newArt','areaSpawns','gameWeather','evolution','earnedEvents'])Object.defineProperty(AI.cfg,key,{configurable:true,enumerable:true,get:()=>['forestWorld','naturalTerrain','newArt','areaSpawns'].includes(key)?(!R.Maps?.endless&&!(R.Maps?.cur?.n===2&&R.Maps?.cur?.crystalPeak)):enforced[key],set:()=>{}});
 }
 configure();
 // The full friend's AI controller remains; never install Gard's old AI adapters.
 // Menus from removed Gard Story/Trainer systems are never loaded.
 const menuOpen=R.MenuUI.open;R.MenuUI.open=function(...a){const r=menuOpen.apply(this,a),label=document.querySelector('[data-go="gacha"] small');if(label)label.textContent='Special Summon · starters and rare Legendaries';return r;};
 const s=R.DB.save;if(s){s.psGameMode='original';delete s.psTrainer;}
 // Settings reset must preserve the chosen single-owner integration boundaries.
 const reset=AI.resetCfg;if(reset)AI.resetCfg=function(...args){const r=reset.apply(this,args);configure();return r;};
 // Idle animation follows actual displacement. Do not interrupt attacks/hurt.
 const update=R.Enemy.prototype.update;
 R.Enemy.prototype.update=function(dt,...args){const x=this.x,y=this.y,r=update.call(this,dt,...args);
  if(!this.dead&&this.anim&&!this.anim.busy?.()){
   const moving=Math.hypot(this.x-x,this.y-y)>Math.max(.04,(Number(dt)||0)*2);
   const intent=this.psx?.it,explicit=intent?.anim;
   if(!moving && this.anim.cur==='Walk')this.anim.loop('Idle');
   else if(moving && this.anim.cur==='Idle'&&!explicit)this.anim.loop('Walk');
  }return r;
 };
 // Refill a sparse field with the native spawner, retaining its safe placement,
 // species weighting and host ownership. No enemies appear on top of the player.
 let refillIn=0,run=null;
 const spawnUpdate=R.Spawner.update;
 R.Spawner.update=function(dt,...args){const result=spawnUpdate.call(this,dt,...args),p=R.Game.player;
  if(p!==run){run=p;refillIn=1;}
  if(R.Game.state!=='playing'||!p||p.dead||R.Rift?.inArena||R.Judgment?.active||window.PS_SAFEZONE?.active||window.PS_MODES?.run?.mode==='legend'||(R.Coop?.active&&!R.Coop.isHost))return result;
  refillIn-=Math.max(0,Number(dt)||0);if(refillIn>0)return result;refillIn=3;
  const alive=R.EnemyMgr.all().filter(e=>!e.dead&&!e.remote&&!e.dummy).length;
  const target=Math.min(64,32+Math.floor((Number(R.Game.time)||0)/60)*8);
  if(alive<target)this.burst(Math.min(10,target-alive));
  return result;
 };
 window.PS_GARD_PORT.integration={enforced,ai:'friend-original-controller',story:false};
})();
