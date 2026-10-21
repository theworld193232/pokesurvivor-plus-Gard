/* =====================================================================================================
   SPECIAL GACHA (both modes; your friend's Story Gacha, adapted)
   The Gacha now only gives first-stage Pokemon of Rare rarity and below, from a special pool, by region:
     Kanto     Bulbasaur, Charmander, Squirtle, Dratini, Chansey, Meowth, Psyduck, Slowpoke
     Johto     Chikorita, Cyndaquil, Totodile          Hoenn  Treecko, Torchic, Mudkip, Beldum
     Sinnoh    Turtwig, Chimchar, Piplup               Unova  Snivy, Tepig, Oshawott, Audino
     Kalos / Alola / Galar / Paldea: their starters
   Rare cards (and Epic rolls) give a Rare one; Common / Uncommon cards give an Uncommon one when the region has one.
   The Legendaries you allowed on the banners stay, with exactly the same chance as before (a Legendary roll on
   their region's banner): Magearna (Alola), Meloetta (Unova), Manaphy and Phione (Sinnoh).
   The game's own pull still runs (ticket costs, pity, shiny luck, stats); each result is then swapped.
   Story Mode only: starters and the other special Pokemon never appear as wild Pokemon (catching), so the Gacha is
   the only way to get them.
   ===================================================================================================== */
(()=>{'use strict';
 const E=()=>window.PS_HOOPA_ENGINE,STORY=()=>!!(window.PS_STORY&&window.PS_STORY.on());
 // [dex, rarity shown on the pull card]
 const POOL=[
   [147,3],[374,3],[113,3],[531,2],[52,2],[54,2],[79,2],
   [1,3],[4,3],[7,3],[152,3],[155,3],[158,3],[252,3],[255,3],[258,3],[387,3],[390,3],[393,3],[495,3],[498,3],[501,3],
   [650,3],[653,3],[656,3],[722,3],[725,3],[728,3],[810,3],[813,3],[816,3],[906,3],[909,3],[912,3]];
 // the Legendaries allowed on the banners (same list and weights as js/dens.js)
 const LEGENDS={801:3,648:3,490:1,489:1};
 // Evolution families of the special pool: never spawned as wild Pokemon in Story Mode.
 const NOT_WILD=new Set([1,2,3,4,5,6,7,8,9,52,53,54,55,79,80,113,147,148,149,152,153,154,155,156,157,158,159,160,199,242,252,253,254,255,256,257,258,259,260,374,375,376,387,388,389,390,391,392,393,394,395,440,495,496,497,498,499,500,501,502,503,531,650,651,652,653,654,655,656,657,658,722,723,724,725,726,727,728,729,730,801,810,811,812,813,814,815,816,817,818,863,906,907,908,909,910,911,912,913,914]);
 const genOf=d=>{const p=E()?.DEX_BY?.[d];return p?p.gen:0;};
 function poolFor(gen,rarity){
   const inGen=POOL.filter(([d])=>genOf(d)===gen&&E().SPRITE_META[d]);
   const want=rarity<=2?2:3;let L=inGen.filter(x=>x[1]===want);if(!L.length)L=inGen;if(!L.length)L=POOL;return L;
 }
 const pick=L=>L[Math.floor(Math.random()*L.length)];
 function featured(gen){   // banner icons: the region's allowed Legendary (if any) in the middle, its special Pokemon around it
   const leg=Object.keys(LEGENDS).map(Number).filter(d=>genOf(d)===gen);
   const rest=POOL.filter(([d])=>genOf(d)===gen).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
   if(leg.length)return [rest[0],leg[0],rest[1]].filter(Boolean);
   return rest.slice(0,3);
 }
 window.PS_SPECIAL_GACHA={POOL,LEGENDS,NOT_WILD,featured,poolFor};
 let hooked=false;
 function hook(){
   const X=E();if(hooked||!X?.Gacha?.pull||!X.Enemies?.bagAt||!X.DEX_BY)return;hooked=true;const G=X.Gacha;
   const pull=G.pull;
   G.pull=function(save,count,gen){
     const res=pull.apply(this,arguments);if(!Array.isArray(res)||!save)return res;
     const refund=G.REFUND||{1:15,2:30,3:60,4:120,5:300},bannerGen=Number(gen)||0;
     for(const r of res){
       if(LEGENDS[r.dex])continue;   // an allowed Legendary: same chance as before, keep it
       const single=!!window.PS_GACHA_SINGLE,legendRoll=single&&Number(r.rarity)===5;
       // undo what the original pick gave...
       if(r.shiny){if(r.isNew&&save.shiny)delete save.shiny[r.dex];}
       if(r.isNew&&save.owned&&!['catch','starter','evolve','evo-line'].includes(save.owned[r.dex]?.from))delete save.owned[r.dex];
       save.coins=(Number(save.coins)||0)-(Number(r.refund)||0);
       // ...and give one from the special pool instead (same shiny luck)
       let dex,rarity;
       if(single){   // one Special Summon banner: Legendary roll -> an allowed Legendary; Rare/Epic roll -> a Rare one; otherwise any of the pool
         if(legendRoll){const L=[];for(const [d,w] of Object.entries(LEGENDS))for(let i=0;i<w;i++)L.push(Number(d));dex=L[Math.floor(Math.random()*L.length)];rarity=5;}
         else{const rr=Number(r.rarity)||1,L=rr>=3?POOL.filter(x=>x[1]===3):POOL;[dex,rarity]=pick(L.filter(x=>E().SPRITE_META[x[0]]).length?L.filter(x=>E().SPRITE_META[x[0]]):L);}
       }else{const g=bannerGen||genOf(r.dex)||1;[dex,rarity]=pick(poolFor(g,Number(r.rarity)||1));}
       // shiny chance 1.5% (the game rolls 1%; top it up)
       if(!r.shiny&&Math.random()<0.0072&&E().Sprites?.hasShiny?.(dex))r.shiny=true;
       let isNew=false,coins=0;
       if(r.shiny){save.shiny=save.shiny||{};isNew=!save.shiny[dex];if(isNew)save.shiny[dex]={at:Date.now(),from:'gacha'};else coins=3*(refund[rarity]||30);if(!save.owned[dex])save.owned[dex]={at:Date.now(),from:'gacha'};}
       else{isNew=!save.owned[dex];if(isNew)save.owned[dex]={at:Date.now(),from:'gacha'};else coins=refund[rarity]||30;}
       save.coins+=coins;r.dex=dex;r.rarity=rarity;r.isNew=isNew;r.refund=coins;
     }
     return res;
   };
   // wild Pokemon (Story Mode): never a starter or another Gacha-only Pokemon (all maps)
   const EN=X.Enemies,bag=EN.bagAt;
   EN.bagAt=function(){const r=bag.apply(this,arguments);if(!Array.isArray(r)||!STORY())return r;const f=r.filter(d=>!NOT_WILD.has(Number(d.dex)));return f.length?f:r;};
 }
 (function tick(){hook();if(!hooked)setTimeout(tick,200);})();
})();
