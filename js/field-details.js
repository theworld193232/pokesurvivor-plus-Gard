/* Small, seeded Sunnyside mushrooms. Decorative only; never new collision barriers. */
(() => {
 'use strict';const R=window.__PSX_REG__,A=window.PSXAI,C=window.PS_CRYSTAL_PEAK;if(!R||!A)return;
 const strips=['blue','red'].map(color=>{const im=new Image();im.src='assets/env/sunnyside/spr_deco_mushroom_'+color+'_01_strip4.png';return im;}),CELL=192;
 function on(){return !!R.Game.player&&R.Game.state==='playing'&&!R.Rift?.inArena&&!window.PS_SAFEZONE?.active&&(C?.active()?C.model.zone==='cave':A.Forest?.on());}
 function near(x,y,r=650){if(!on())return [];const seed=Number(A.Decor.seed)||0,out=[];for(let cy=Math.floor((y-r)/CELL);cy<=Math.floor((y+r)/CELL);cy++)for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++){if(R.U.hash(cx,cy,seed+37101)>.24)continue;const px=(cx+.15+R.U.hash(cx,cy,seed+37102)*.7)*CELL,py=(cy+.15+R.U.hash(cx,cy,seed+37103)*.7)*CELL;if(!R.Camera.sees(px,py,40)||!R.World.isFree(px,py,8)||R.World.isLiquid(px,py))continue;if(C?.active()){if(!C.model.crystalsNear(px,py,180).some(c=>Math.hypot(c.x-px,c.y-py)>65&&Math.hypot(c.x-px,c.y-py)<180))continue;if(C.doorList(px,py,180).some(d=>Math.hypot(d.x-px,d.y-py)<150))continue;}out.push({x:px,y:py,color:C?.active()?0:Math.floor(R.U.hash(cx,cy,seed+37104)*2),phase:R.U.hash(cx,cy,seed+37105)*4});if(out.length>=24)return out;}return out;}
 function draw(ctx,p){const im=strips[p.color];if(!im.complete||!im.naturalWidth)return;const f=Math.floor((A.time||0)*2+p.phase)%4;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,f*16,0,16,16,Math.round(p.x-16),Math.round(p.y-26),32,32);ctx.restore();}
 const old=R.Training.drawables;R.Training.drawables=function(...a){const out=old.apply(this,a)||[],p=R.Game.player;return p&&on()?[...out,...near(p.x,p.y).map(q=>({y:q.y,draw:ctx=>draw(ctx,q)}))]:out;};
 window.PS_FIELD_DETAILS={near,on,draw};
})();
