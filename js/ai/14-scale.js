/* Native sprite sizes for ordinary Pokémon; species/form sizing only for legendaries.
 * Native Animator.scale and explicit transformations remain untouched for ordinary species. */
(function(){
 'use strict';const AI=window.PSXAI,U=AI.U,D=window.PSXAI_CANON_SIZE||{},SZ=window.PSXAI_SIZES||{h:[]},SH=D.opaquePx||window.PSXAI_SPRITE_H||{},H=D.heightDm||{};
 const PPM=56,EXPONENT=.55,MIN_PX=28,cache=new Map();
 const on=()=>AI.enabled&&AI.cfg.speciesScale!==false;
 function meters(key){const base=Number(String(key).split(/[_-]/)[0]);return Number(H[key]??H[base]??SZ.h[base]??10)/10;}
 function target(m){return legendaryTarget(m);}
 function legendaryTarget(m){return Math.max(MIN_PX,PPM*Math.pow(Math.max(.01,Number(m)||1),EXPONENT));}
 function legendary(key){const dex=Number(String(key).split(/[_-]/)[0]);return !!(AI.Legend?.isLegendDex?.(dex)||(AI.R?.DEX_BY?.[dex]?.leg)||Number(AI.R?.DEX_BY?.[dex]?.rarity)>=5);}
 function height(key){return legendary(key)?legendaryTarget(meters(key)):spriteH(key);}
 function spriteH(key){return 2*(SH[key]||SH[String(key).split(/[_-]/)[0]]||26);}
 function species(key){if(!cache.has(key))cache.set(key,height(key)/spriteH(key));return cache.get(key);}
 function keyOf(e){return e?.anim?.dex??e?.megaKey??e?.mon?.skin??e?.mon?.dex??e?.dex;}
 function factor(e){const key=keyOf(e);if(!on()||key==null||!legendary(key))return 1;return species(key)/Math.max(.01,Number(e?.anim?.scale)||1);}
 function of(e){if(!e)return 1;const k=factor(e);e.psxK=k;e._psxKOn=true;return k;}
 function apply(e){if(!on()||!e||e.dummy)return;if(!legendary(keyOf(e))){of(e);if(e._psxR0!=null){e.r=e._psxR0;delete e._psxR0;}return;}if(e._psxR0!=null)return;const k=of(e);e._psxR0=e.r;e.r=Math.min(48,e.r*U.clamp(.35+.65*k,.7,2.6));}
 function top(e){if(!e)return 0;const key=keyOf(e);return on()&&legendary(key)?height(key):spriteH(key)*Math.max(.01,Number(e.anim?.scale)||1);}
 function scaledDraw(orig,kOf){return function(ctx){const k=kOf(this);if(k===1||!(k>0))return orig.apply(this,arguments);ctx.save();ctx.translate(this.x,this.y);ctx.scale(k,k);ctx.translate(-this.x,-this.y);try{return orig.apply(this,arguments);}finally{ctx.restore();}};}
 const playerScale=factor,wrapEnemyDraw=orig=>scaledDraw(orig,of),wrapPlayerDraw=orig=>scaledDraw(orig,playerScale);
 AI.define('Scale',{meters,target,legendaryTarget,legendary,height,spriteH,species,keyOf,of,apply,top,playerScale,wrapEnemyDraw,wrapPlayerDraw,cache,PPM,EXPONENT,MIN_PX,metric:key=>meters(key),MAX_PX:Infinity});
})();
