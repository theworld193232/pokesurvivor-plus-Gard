/* PokéDive-inspired safe camp resting, independently implemented for existing mountain camps. */
(() => {
 'use strict';const R=window.__PSX_REG__,A=window.PSXAI,C=window.PS_CRYSTAL_PEAK;if(!R||!C)return;
 const used=new Set();let rest=null,actor=null,lastHit=-Infinity;
 const reset=R.World.reset;R.World.reset=function(...a){used.clear();rest=null;actor=null;lastHit=-Infinity;return reset.apply(this,a);};
 const hurt=R.Player.prototype.hurt;R.Player.prototype.hurt=function(...a){const hp=this.hp,result=hurt.apply(this,a);if(this===R.Game.player&&this.hp<hp){lastHit=Number(R.Game.time)||0;rest=null;}return result;};
 function hostile(e,p){if(!e||e.dead||e.psAlly||e.dummy||e.friendly||e.psx?.stance==='friendly'||Math.hypot(e.x-p.x,e.y-p.y)>360)return false;return e.boss||e.legend||!e.psx||e.psx.combat?.target===p||e.psx.stance==='hostile'||e.psx.pers?.temp==='aggressive';}
 function tick(p,dt){if(actor!==p){rest=null;actor=p;}if(!p||p.dead||p.hp<=0||R.Game.state!=='playing'||!C.mountain()||R.Coop?.active||p.megaEvolving||p.evo||R.Game.time-lastHit<8){rest=null;return;}
  const fire=C.model.decorNear(p.x,p.y,110).find(q=>q.kind==='campfire'&&Math.hypot(q.x-p.x,q.y-p.y)<85),key=fire&&C.model.seed+':'+fire.x+':'+fire.y;
  if(!fire||used.has(key)||R.EnemyMgr.all().some(e=>hostile(e,p))){rest=null;return;}
  if(!rest||rest.key!==key||Math.hypot(p.x-rest.x,p.y-rest.y)>3){rest={key,x:p.x,y:p.y,t:0};return;}
  rest.t+=Math.min(.1,Math.max(0,dt));if(rest.t<6||p.hp>=p.maxHp)return;
  const amount=Math.min(p.maxHp-p.hp,Math.max(1,Math.round(p.maxHp*.1)));p.hp=Math.min(p.maxHp,p.hp+amount);used.add(key);rest=null;R.FX.dmgText(p.x,p.y-48,'+'+amount+' HP','#a5f0bd');R.Spawner.say('A quiet rest by the fire.',2);
 }
 const update=R.Player.prototype.update;R.Player.prototype.update=function(dt,...a){const out=update.call(this,dt,...a);if(this===R.Game.player)tick(this,dt);return out;};
 window.PS_CAMP_REST={used,tick,hostile,state:()=>rest};
})();
