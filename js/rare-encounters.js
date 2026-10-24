/* Dens and safe pink rifts share one rare encounter roll. */
(() => {
 'use strict';
 const cfg=Object.freeze({minSeconds:120,maxSeconds:180,chance:.1});
 let player=null,nextAt=null;
 const delay=()=>cfg.minSeconds+Math.random()*(cfg.maxSeconds-cfg.minSeconds);
 function occupied(){return !!(window.PS_SAFEZONE?.occupied||window.PS_DENS?.occupied);}
 function tick(){
  const R=window.__PSX_REG__,g=R?.Game,p=g?.player;
  if(!p||g.state==='ui'||g.state==='over'){player=null;nextAt=null;return;}
  const t=Number(typeof g.time==='function'?g.time():g.time)||0;
  if(p!==player){player=p;nextAt=t+delay();}
  if(g.state!=='playing'||p.dead||R.Coop?.active)return;
  if(t<nextAt)return;
  // One attempt, never catch up with multiple rolls after a clock jump.
  nextAt=t+delay();
  if(occupied()||R.Rift?.inArena||R.Judgment?.active||window.PS_MODES?.run?.mode==='legend'||window.PS_STORY?.on())return;
  if(Math.random()>=cfg.chance)return;
  if(Math.random()<.5){
   const D=window.PS_DENS;if(!D)return;
   if(Math.random()<(D.lcfg?.chance||0))D.spawnLegend();else D.spawn(false);
  }else window.PS_SAFEZONE?.spawnRift();
 }
 window.PS_RARE_ENCOUNTERS={cfg,tick,occupied,get nextAt(){return nextAt;}};
})();
