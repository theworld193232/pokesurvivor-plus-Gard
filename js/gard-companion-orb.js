/* LoverGare's Ralts/Gardevoir companion: cosmetic sprite + local world light. */
(() => {
 'use strict';
 const R=window.__PSX_REG__,A=window.PSXAI;
 function eligible(p=R.Game.player){return !!p&&p===R.Game.player&&!p.dead&&R.Game.state==='playing'&&[280,282].includes(Number(p.dex))&&String(R.DB?.user||'').trim().toLowerCase()==='lovergare';}
 // Opaque Idle/Walk half-widths across all eight facings, relative to measured idle height.
 const HALF_WIDTH={280:16/20,282:15/23,'282_mega':15/26,'282-mega':15/26};
 function obstacles(p){
  const cp=window.PS_CRYSTAL_PEAK,M=cp?.model,boxes=[];
  if(cp?.active()){
   for(const c of M.crystalsNear(p.x,p.y,400))boxes.push(M.crystalBounds(c));
   for(const d of M.decorNear(p.x,p.y,400))if(['pine','ridge','tent','cart','timbers','snowlog','stump'].includes(d.kind))boxes.push(M.decorBounds(d));
   for(const d of M.cliffRocksNear(p.x,p.y,400))boxes.push({left:d.x-65,right:d.x+65,top:d.y-108,bottom:d.y+10});
   for(const d of cp.doorList(p.x,p.y,400))boxes.push({left:d.x-95,right:d.x+95,top:d.y-185,bottom:d.y+12});
   if(M.special())for(const d of M.solidSceneryNear(p.x,p.y,350))boxes.push({left:d.x-(d.rx||20),right:d.x+(d.rx||20),top:d.y-(d.ry||15)-90,bottom:d.y+(d.ry||15)});
  }else for(const d of R.World?.propsInCircle?.(p.x,p.y,400)||[]){
   if(!d.solid&&d.type!=='tree')continue;
   const name=d.type==='tree'?A.Ground?.artFor(d):null,size=name&&A.Art?.size(name),scale=d._psxScale||1;
   const w=size?size[0]*scale:2*(d.r||18),h=size?size[1]*scale:2*(d.r||18);
   boxes.push({left:d.x-w*.55-5,right:d.x+w*.55+5,top:d.y-h-5,bottom:d.y+10});
  }
  return boxes;
 }
 function light(){const p=R.Game.player;if(!eligible(p))return null;const h=A?.Scale?.top(p)||p.bodyH||40,key=p.anim?.dex??p.megaKey??p.dex,half=h*(HALF_WIDTH[key]||HALF_WIDTH[p.dex]||.8),x=p.x+half+8,y=p.y-h*.65,boxes=obstacles(p);
  // A fixed shoulder position: scenery occludes the orb instead of moving it elsewhere.
  const visible=(R.World?.isFree?.(x,y,6,true)??true)&&!boxes.some(b=>x+7>b.left&&x-7<b.right&&y+7>b.top&&y-7<b.bottom);
  return {x,y,visible,alpha:1,r:320,c:[255,225,242],i:1,halo:0};
 }

 // The cave uses a separate darkness mask, so illuminate it before multiplication too.
 function paintLightMap(ctx,cam,q=1){const l=light();if(!l)return;const x=(l.x-cam.left())*cam.scale/q,y=(l.y-cam.top())*cam.scale/q,r=l.r*cam.scale/q,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,240,250,'+l.i+')');g.addColorStop(.25,'rgba(255,225,242,.9)');g.addColorStop(.6,'rgba(255,190,225,.45)');g.addColorStop(1,'rgba(255,190,225,0)');ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}finally{ctx.restore();}}
 function draw(ctx){const l=light();if(!l||!l.visible)return;const cam=R.Camera,z=cam.scale,x=Math.round((l.x-cam.left())*z),y=Math.round((l.y-cam.top())*z),u=Math.max(1,z)*1.5,r=12*u;
  ctx.save();try{ctx.globalAlpha*=l.alpha;ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,150,215,.65)');g.addColorStop(1,'rgba(255,150,215,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#ed75b6';ctx.fillRect(x-3*u,y-2*u,6*u,4*u);ctx.fillRect(x-2*u,y-3*u,4*u,6*u);ctx.fillStyle='#ffc1e5';ctx.fillRect(x-2*u,y-2*u,4*u,4*u);ctx.fillStyle='#fff1fa';ctx.fillRect(x-u,y-2*u,2*u,2*u);}finally{ctx.restore();}
 }
 window.PS_COMPANION_ORB={eligible,light,paintLightMap,draw};
 const old=R.Weather.draw;R.Weather.draw=function(ctx,...args){const result=old.call(this,ctx,...args);draw(ctx);return result;};
})();
