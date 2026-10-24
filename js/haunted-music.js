/* Haunted soundtrack conditions; reads the original world without changing its weather. */
(() => {
 'use strict';let active=false;
 window.PS_HAUNTED_MUSIC={active(){
  const AI=window.PSXAI,R=window.__PSX_REG__,p=R?.Game?.player;
  if(!p||p.dead||R.Game.state==='ui'||R.Game.state==='over'){active=false;return false;}
  const M=AI?.Mansion,S=AI?.Sky;
  let near=!!M?.inside;
  if(!near&&AI?.Forest?.on()&&M?.on()){
   const g=M.geom();if(g){const dx=Math.max(0,Math.abs(p.x-g.D[0])-g.SW),dy=Math.max(g.D[1]-270-p.y,0,p.y-g.D[1]);near=Math.hypot(dx,dy)<(active?440:350);}
  }
  const eerie=AI?.cfg?.atmosphere!==false&&S&&S.darkness()>(active?.65:.78)&&S.fog>(active?.58:.7);
  active=!!(near||eerie);return active;
 }};
})();
