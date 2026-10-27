/* Keep the friend's Regirock encounter visible and solid in Gard's custom Act 2. */
(() => {
 const R=window.__PSX_REG__,A=window.PSXAI,C=window.PS_CRYSTAL_PEAK;
 const on=()=>!!(C?.active()&&C.model.zone==='cave');
 const caves=()=>A.Regi?.st.caves.filter(c=>c.dex===377)||[];
 const ground=R.World.drawGround;R.World.drawGround=function(ctx,...args){const result=ground.call(this,ctx,...args);if(on())for(const c of caves())if(R.Camera.sees(c.x,c.y,220))A.Regi.drawItem(ctx,c.it);return result;};
 function blocked(x,y,r=12){return on()&&caves().some(c=>Math.abs(x-c.x)<112+r&&y>c.y-35-r&&y<c.y+8+r);}
 const free=R.World.isFree;R.World.isFree=function(x,y,r,...a){return free.call(this,x,y,r,...a)&&!blocked(x,y,r);};
 const collide=R.World.collide;R.World.collide=function(e,...a){const result=collide.call(this,e,...a);if(!e||!on()||window.PS_LEGEND_FLIGHT?.active(e))return result;for(const c of caves()){const r=e.r||12,b=[c.x-112,c.y-35,c.x+112,c.y+8],x=Math.max(b[0],Math.min(b[2],e.x)),y=Math.max(b[1],Math.min(b[3],e.y)),dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d>=r)continue;if(d>.001){e.x=x+dx/d*r;e.y=y+dy/d*r;}else e.y=e.y<(b[1]+b[3])/2?b[1]-r:b[3]+r;}return result;};
 window.PS_REGI_CAVE={blocked,caves};
})();
