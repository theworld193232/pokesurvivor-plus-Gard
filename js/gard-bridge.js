/* Compatibility surface for Gard addons on the friend's current engine. */
(() => {
 'use strict';
 const R=window.__PSX_REG__;if(!R?.Game||!R.Player||!R.Combat)throw Error('Gard bridge: expected friend engine registry');
 window.PS_HOOPA_ENGINE=R;
 window.PS_MEGA_BRIDGE_V5={game:R.Game,sprites:R.Sprites,spriteMeta:R.SPRITE_META,moves:R.Moves,
  get weather(){return R.Weather;},get types(){return R.Types;},get camera(){return R.Camera;},
  get projectiles(){return R.Projectiles;},get user(){return R.DB?.user;},get enemies(){return R.EnemyMgr;},
  get combat(){return R.Combat;},get fx(){return R.FX;},get vfx(){return R.VFX;},get world(){return R.World;},get lift(){return R.LIFT;},get audio(){return R.Audio;}};
 const hurt=R.Player.prototype.hurt;
 R.Player.prototype.hurt=function(...args){const prev=window.PS_ATTACKER,contact=window.PS_CONTACT;
  window.PS_ATTACKER=window.PSXAI?.curAttacker||window.PSXAI?.curEnemy||prev||null;
  window.PS_CONTACT=!!window.PSXAI?.curEnemy;
  try{return hurt.apply(this,args);}finally{window.PS_ATTACKER=prev;window.PS_CONTACT=contact;}
 };
 window.PS_GARD_TEST_ACCESS=()=>String(R.DB?.user||'').trim().toLowerCase()==='lovergare';
 window.PS_GARD_PORT={version:'friend-gard-v21',base:'76180a2196d2deff569f7f9712d7afba275e8bb4',story:false};
})();
