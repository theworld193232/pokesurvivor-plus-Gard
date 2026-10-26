/* Team members own their passive stacks, one-use revives and direct stat bonuses. */
(() => {
 'use strict';const R=window.__PSX_REG__;
 const fields=['__pf','__pfKey','__absorbAt','__auraAt','__bb','__bbK','__bornAt','__buff','__chargeAt','__chargeReady','__crowd','__crowdAt','__echoBond','__echoCrit','__echoLives','__echoLow','__echoXp','__echoBondUsed','__jWillUsed','__echoLifeLast','__echoLivesLeft','__fflCrit','__fflXp','__hitAt','__jInt','__kills','__ks','__qAt','__wxAt','__ownedKillCount','__ownedKillLast'];
 const rawKills=p=>{try{return Number(p.myKills?.())||0;}catch(_){return Number(p.kills)||0;}};
 function kills(p){const n=rawKills(p),last=p.__ownedKillLast??n;p.__ownedKillCount=(p.__ownedKillCount||0)+Math.max(0,n-last);p.__ownedKillLast=n;return p.__ownedKillCount;}
 function contributions(p){const E=window.PS_ECHO_CONFIG||{xp:1.6,crit:.25,lives:2};return {xp:(p.__echoXp?E.xp:1)*(Number(p.__fflXp)||1),crit:(p.__echoCrit?E.crit:0)+(Number(p.__fflCrit)||0),reroll:!!p.__jInt,hearts:p.__echoLives?Math.min(Number(p.lives)||0,Math.max(0,(p.__echoLivesLeft??E.lives)-Math.max(0,(p.__echoLifeLast??p.lives)-p.lives))):0};}
 function remove(p,c){p.xpMul=(Number(p.xpMul)||1)/c.xp;p.critChance=(Number(p.critChance)||0)-c.crit;if(c.reroll)p.rerollBonus=((Number(p.rerollBonus)||0)-1)/2;if(c.hearts)p.lives=Math.max(0,(Number(p.lives)||0)-c.hearts);}
 function detach(p){kills(p);const c=contributions(p),data={};if(p.__echoLives){p.__echoLivesLeft=c.hearts;p.__echoLifeLast=c.hearts;}for(const k of fields)if(p[k]!==undefined)data[k]=p[k];remove(p,c);for(const k of fields)delete p[k];p.weatherImmune=false;window.PS_FX?.clearForPlayer?.(p);window.PS_GARD_WEATHER?.clear?.(p);return {data,contribution:c};}
 function enter(p,state){for(const k of fields)delete p[k];if(state){Object.assign(p,state.data);const c=state.contribution;p.xpMul=(Number(p.xpMul)||1)*c.xp;p.critChance=(Number(p.critChance)||0)+c.crit;if(c.reroll)p.rerollBonus=(Number(p.rerollBonus)||0)*2+1;p.lives=(Number(p.lives)||0)+c.hearts;if(p.__echoLives)p.__echoLifeLast=p.lives;}const n=rawKills(p);p.__ownedKillLast=n;p.__kills=n;p.__bbK=n;p.weatherImmune=false;}
 function stripEcho(p){if(!p||!(p.__echoXp||p.__echoCrit||p.__jInt||p.__fflXp||p.__fflCrit||p.__echoLives))return;remove(p,contributions(p));for(const k of fields)if(k.startsWith('__echo')||k.startsWith('__ffl')||k==='__jInt')delete p[k];}
 window.PS_SPECIES_PASSIVES={detach,enter,stripEcho,kills};
})();
