/* LoverGare's Ralts/Gardevoir companion: cosmetic sprite + local world light. */
(() => {
 'use strict';
 const R=window.__PSX_REG__,A=window.PSXAI;
 function eligible(p=R.Game.player){return !!p&&p===R.Game.player&&!p.dead&&R.Game.state==='playing'&&[280,282].includes(Number(p.dex))&&String(R.DB?.user||'').trim().toLowerCase()==='lovergare';}
 // Opaque Idle/Walk half-widths across all eight facings, relative to measured idle height.
 const motion=new WeakMap();
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
 function light(){const p=R.Game.player;if(!eligible(p)){if(p)motion.delete(p);return null;}const t=Number(R.Game.time)||0,h=A?.Scale?.top(p)||p.bodyH||40,key=p.anim?.dex??p.megaKey??p.dex,half=h*(HALF_WIDTH[key]||HALF_WIDTH[p.dex]||.8),bob=Math.sin(t*1.7)*5,drift=Math.sin(t*.9)*4,boxes=obstacles(p);
  const clear=(x,y)=> (R.World?.isFree?.(x,y,6,true)??true)&&!boxes.some(b=>x+7>b.left&&x-7<b.right&&y+7>b.top&&y-7<b.bottom);
  const offsets=[[half+16+drift,-h*.65+bob],[-half-16-drift,-h*.65+bob],[half+20,-h*.95+bob],[-half-20,-h*.95+bob],[0,-h-18+bob],[half+20,-h*.3+bob],[-half-20,-h*.3+bob]];
  const safe=([x,y])=>!(Math.abs(x)<half+8&&y>-h-8&&y<8)&&clear(p.x+x,p.y+y);
  const at=offsets.find(safe);let state=motion.get(p);
  if(!state||t<state.t){state={at:at||[0,-h*.65],t,alpha:1};motion.set(p,state);}
  const dt=Math.max(0,Math.min(.05,t-state.t));state.t=t;
  if(at){
   if(!safe(state.at)){state.at=at.slice();state.alpha=0;}
   else {
    // Visibility graph around the body; every segment is swept against scenery.
    const nodes=[state.at,at,[state.at[0],-h-22],[at[0],-h-22],...offsets,[half+20,-h-22],[-half-20,-h-22],[0,-h-22],[half+20,20],[-half-20,20],[0,20]].filter((n,i)=>i<2||safe(n));
    const edge=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/4));for(let i=1;i<=n;i++)if(!safe([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]))return false;return true;};
    const prev=new Map([[0,-1]]),queue=[0];
    while(queue.length&&!prev.has(1)){const k=queue.shift();for(let j=1;j<nodes.length;j++)if(!prev.has(j)&&edge(nodes[k],nodes[j])){prev.set(j,k);queue.push(j);if(j===1)break;}}
    if(prev.has(1)){let j=1;while(prev.get(j)!==0)j=prev.get(j);const goal=nodes[j],dx=goal[0]-state.at[0],dy=goal[1]-state.at[1],d=Math.hypot(dx,dy),step=Math.min(d,100*dt);if(d>.001){state.at=[state.at[0]+dx/d*step,state.at[1]+dy/d*step];}state.alpha=Math.min(1,state.alpha+dt*4);}
    else {state.alpha=Math.max(0,state.alpha-dt*5);if(state.alpha===0)state.at=at.slice();}
   }
  }else state.alpha=0;
  return {x:p.x+state.at[0],y:p.y+state.at[1],visible:!!at&&state.alpha>0,alpha:state.alpha,r:145,c:[255,165,220],i:.88+Math.sin(t*2)*.06,halo:0};
 }
 // The cave uses a separate darkness mask, so illuminate it before multiplication too.
 function paintLightMap(ctx,cam,q=1){const l=light();if(!l)return;const x=(l.x-cam.left())*cam.scale/q,y=(l.y-cam.top())*cam.scale/q,r=l.r*cam.scale/q,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,205,235,'+l.i+')');g.addColorStop(.38,'rgba(255,165,220,.44)');g.addColorStop(1,'rgba(255,165,220,0)');ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}finally{ctx.restore();}}
 function draw(ctx){const l=light();if(!l||!l.visible)return;const cam=R.Camera,z=cam.scale,x=Math.round((l.x-cam.left())*z),y=Math.round((l.y-cam.top())*z),u=Math.max(1,z),r=12*u;
  ctx.save();try{ctx.globalAlpha*=l.alpha;ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,150,215,.65)');g.addColorStop(1,'rgba(255,150,215,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#ed75b6';ctx.fillRect(x-3*u,y-2*u,6*u,4*u);ctx.fillRect(x-2*u,y-3*u,4*u,6*u);ctx.fillStyle='#ffc1e5';ctx.fillRect(x-2*u,y-2*u,4*u,4*u);ctx.fillStyle='#fff1fa';ctx.fillRect(x-u,y-2*u,2*u,2*u);}finally{ctx.restore();}
 }
 window.PS_COMPANION_ORB={eligible,light,paintLightMap,draw};
 const old=R.Weather.draw;R.Weather.draw=function(ctx,...args){const result=old.call(this,ctx,...args);draw(ctx);return result;};
})();
