/* Species and form heights share one world scale for player and wild Pokémon.
 * One 32px terrain tile represents one metre. No player, rarity or boss size bonuses.
 * Sprite padding and native Animator.scale are removed from the calculation.
 * Dynamax and other explicit transformation effects remain separate game mechanics. */
(function(){
 'use strict';const AI=window.PSXAI,U=AI.U,D=window.PSXAI_CANON_SIZE||{},SZ=window.PSXAI_SIZES||{h:[]},SH=D.opaquePx||window.PSXAI_SPRITE_H||{},H=D.heightDm||{};
 const PPM=32,cache=new Map();
 const on=()=>AI.enabled&&AI.cfg.speciesScale!==false;
 function meters(key){const base=Number(String(key).split(/[_-]/)[0]);return Number(H[key]??H[base]??SZ.h[base]??10)/10;}
 function target(m){return Math.max(.01,Number(m)||1)*PPM;}
 function spriteH(key){return 2*(SH[key]||SH[String(key).split(/[_-]/)[0]]||26);}
 function species(key){if(!cache.has(key))cache.set(key,target(meters(key))/spriteH(key));return cache.get(key);}
 function keyOf(e){return e?.anim?.dex??e?.megaKey??e?.mon?.skin??e?.mon?.dex??e?.dex;}
 function factor(e){const key=keyOf(e);if(!on()||key==null)return 1;return species(key)/Math.max(.01,Number(e?.anim?.scale)||1);}
 function of(e){if(!e)return 1;const k=factor(e);e.psxK=k;e._psxKOn=true;return k;}
 function apply(e){if(!on()||!e||e._psxR0!=null||e.dummy)return;const k=of(e);e._psxR0=e.r;e.r=Math.min(48,e.r*U.clamp(.35+.65*k,.7,2.6));}
 function top(e){if(!e)return 0;return on()?target(meters(keyOf(e))):(e.bodyH||30);}
 function scaledDraw(orig,kOf){return function(ctx){const k=kOf(this);if(k===1||!(k>0))return orig.apply(this,arguments);ctx.save();ctx.translate(this.x,this.y);ctx.scale(k,k);ctx.translate(-this.x,-this.y);try{return orig.apply(this,arguments);}finally{ctx.restore();}};}
 const playerScale=factor,wrapEnemyDraw=orig=>scaledDraw(orig,of),wrapPlayerDraw=orig=>scaledDraw(orig,playerScale);
 AI.define('Scale',{meters,target,spriteH,species,keyOf,of,apply,top,playerScale,wrapEnemyDraw,wrapPlayerDraw,cache,PPM,metric:key=>meters(key),MAX_PX:Infinity});
})();
