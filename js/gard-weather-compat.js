/* The friend's Sky/Light/ambience/lightning remain untouched. Gard weather
   abilities are temporary gameplay auras, not replacements for world climate. */
(() => {
 'use strict';const R=window.__PSX_REG__,AI=window.PSXAI,W=R.Weather;
 let aura=null;
 const current=Object.getOwnPropertyDescriptor(W,'current'),mult=W.mult;
 const active=()=>aura&&aura.player===R.Game.player&&R.Game.time<aura.until?aura:null;
 W.force=function(kind,seconds=30){if(!W.KINDS[kind]||!R.Game.player)return;const k=W.KINDS[kind];aura={...k,kind,player:R.Game.player,until:R.Game.time+Math.max(0,Number(seconds)||0),name:k.name||kind,mult:k.mult||{},hint:k.hint||'',t:0};};
 W.mult=function(type,...args){const a=active();return a?(Number.isFinite(a.mult[type])?a.mult[type]:1):mult.call(this,type,...args);};
 if(current?.get&&current.configurable)Object.defineProperty(W,'current',{configurable:true,enumerable:true,get(){
  const a=active();if(a)return {...a,left:a.until-R.Game.time};
  return current.get.call(W);
 }});
 window.PS_GARD_WEATHER={clear(p){if(!p||aura?.player===p)aura=null;},get aura(){return active();},world:AI.Sky};
})();
