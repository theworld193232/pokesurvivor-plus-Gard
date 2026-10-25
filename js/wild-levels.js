/* Level-appropriate wild evolution stages. Native AI, move choice and combat scaling stay in use. */
(() => {
 'use strict';
 const R=window.__PSX_REG__,AI=window.PSXAI;
 const overrides={...(window.PS_CRYSTAL_PEAK?.model?.CAVE_LEVELS||{}),...(window.PS_CRYSTAL_PEAK?.model?.MOUNTAIN_LEVELS||{220:1,221:20,473:35})};
 const babies=new Set([172,173,174,175,236,238,239,240,298,360,406,433,438,439,440,446,447,458]);
 const parents=new Map(),minimumCache=new Map();
 function edge(parent,child,level){parent=Number(parent);child=Number(child);if(!parent||!child||parent===child)return;if(!parents.has(child))parents.set(child,[]);if(!parents.get(child).some(p=>p.dex===parent))parents.get(child).push({dex:parent,level:Number(level)||0});}
 for(const [from,list]of Object.entries(R?.EVOS||{}))if(Array.isArray(list))for(const e of list)if(Array.isArray(e))edge(from,e[0],e[1]);
 // Explicit fallback edges also cover stone/move evolutions omitted by some registry builds.
 for(const chain of [[220,221,473],[363,364,365],[582,583,584],[821,822,823],[86,87],[90,91],[459,460],[361,362],[361,478],[613,614],[712,713],[872,873],[974,975],[627,628],[133,471]])for(let i=1;i<chain.length;i++)edge(chain[i-1],chain[i],0);
 function minimum(dex,seen=new Set()){
  dex=Number(dex);if(overrides[dex]!=null)return overrides[dex];if(minimumCache.has(dex))return minimumCache.get(dex);if(seen.has(dex))return 1;seen.add(dex);
  const previous=(parents.get(dex)||[]).filter(p=>!babies.has(p.dex));let value=1;
  if(previous.length)value=Math.min(...previous.map(p=>Math.max(11,minimum(p.dex,new Set(seen))+10,Math.min(35,Math.max(11,p.level||16)))));
  minimumCache.set(dex,value);return value;
 }
 const available=dex=>!R||!!(R.DEX_BY?.[dex]&&R.SPRITE_META?.[dex]);
 function ancestor(dex,level){level=Math.max(1,Number(level)||1);const queue=[Number(dex)],seen=new Set();while(queue.length){const d=queue.shift();if(seen.has(d))continue;seen.add(d);if(minimum(d)<=level&&available(d))return d;for(const p of parents.get(d)||[])queue.push(p.dex);}return null;}
 function pool(bag,level){if(!Array.isArray(bag)||!bag.length)return bag;level=Math.max(1,Number(level)||1);const eligible=bag.filter(d=>minimum(d.dex)<=level);if(eligible.length)return eligible;const out=[];for(const d of bag){const dex=ancestor(d.dex,level);if(dex)out.push({...d,dex,name:R?.DEX_BY?.[dex]?.name||d.name});}return out;}
 function exempt(e){return !e||e.remote||e.dummy||e.legend||e.judge||e.arceus||e.__maxRaid||e.__templeGuardian||e.__roamer||e.psAlly||e.ally||e.psxStory||AI?.summoning;}
 const api=window.PS_WILD_LEVELS={minimum,ancestor,pool,exempt,level:()=>Math.max(1,Number(R?.Game?.player?.level)||1)};
 if(!R||!AI)return;
 const bagAt=R.Enemies.bagAt;R.Enemies.bagAt=function(...args){return pool(bagAt.apply(this,args),api.level());};
 const add=R.EnemyMgr.add;R.EnemyMgr.add=function(e,...args){if(!exempt(e)&&minimum(e.dex)>api.level()){
  let dex=ancestor(e.dex,api.level());if(!dex){const choice=pool(R.Enemies.bagAt(Number(R.Game.time)||0)||[],api.level());dex=choice?.[0]?.dex;}
  if(!dex||!available(dex))return false;const d=R.DEX_BY[dex],dir=e.anim?.dir;
  e.dex=dex;e.name=d.name;e.types=[...(d.types||['normal'])];e.atkType=e.types[0];e.def={...e.def,dex,name:d.name};e.anim=new R.Sprites.Animator(dex,e.scale||1,!!e.shiny);if(dir!=null)e.anim.dir=dir;
  e.r=R.Sprites.bodyRadius(dex,e.scale||1);e.bodyH=R.Sprites.bodyHeight(dex,e.scale||1);e.flying=R.Sprites.hovers(dex);e._psxR0=null;e._psxKOn=false;e.psxK=null;
  if(e.psx&&AI.Species)e.psx.p=AI.Species.profile(dex);
 }return add.call(this,e,...args);};
})();
