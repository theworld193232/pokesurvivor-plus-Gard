/* Cohesive red, ash-grey and blackened grass patches, drawn at the forest's pixel scale. */
(function install(){
 'use strict';const R=window.__PSX_REG__,V=window.PS_VOLCANO;if(!V){setTimeout(install,50);return;}if(window.PS_VOLCANO_GRASS)return;
 const CELL=384,STEP=38.4,cache=new Map(),PAL={red:['#492a30','#874039','#c3644b'],grey:['#3b373d','#6b6268','#aaa09c'],black:['#24232b','#3e3a42','#625962']};
 const block=(g,x,y,w,h)=>g.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.max(2,Math.ceil(w/2)*2),Math.max(2,Math.ceil(h/2)*2));
 const h=(x,y,s)=>V.hash(x,y,V.seed+s);
 function value(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,fx=u*u*(3-2*u),fy=v*v*(3-2*v),a=h(ix,iy,s),b=h(ix+1,iy,s),c=h(ix,iy+1,s),d=h(ix+1,iy+1,s);return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;}
 function patch(cx,cy){const key=cx+','+cy;if(cache.has(key))return cache.get(key);const out=[];for(let gy=0;gy<10;gy++)for(let gx=0;gx<10;gx++){const ix=cx*10+gx,iy=cy*10+gy,n=h(ix,iy,763),x=cx*CELL+(gx+.2+n*.6)*STEP,y=cy*CELL+(gy+.2+h(ix,iy,764)*.6)*STEP,density=value(x/165,y/165,761);if(density<.35||n>(density-.18)*1.48||V.route(x,y)<32||V.sample(x,y).bridge||V.sample(x,y).rope||!V.dry(x,y,24)||V.blocked(x,y,14))continue;const tone=value(x/310,y/310,762),kind=tone>.57?'red':tone>.34?'grey':'black';out.push({x,y,kind,seed:n,density,w:19+n*20,h:16+h(ix,iy,765)*14});}cache.set(key,out);if(cache.size>64)cache.delete(cache.keys().next().value);return out;}
 function near(x,y,r=700){const out=[];for(let cy=Math.floor((y-r)/CELL);cy<=Math.floor((y+r)/CELL);cy++)for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++)for(const d of patch(cx,cy))if(Math.abs(d.x-x)<r&&Math.abs(d.y-y)<r)out.push(d);return out;}
 function draw(ctx){const p=R.Game.player;if(!p)return;const cam=R.Camera,t=Number(R.Game.time)||0,x0=cam.left()-40,y0=cam.top()-30,x1=x0+cam.w+80,y1=y0+cam.h+60;ctx.save();ctx.imageSmoothingEnabled=false;
  for(const d of near(cam.left()+cam.w/2,cam.top()+cam.h/2,Math.max(cam.w,cam.h)/2+90)){if(d.x<x0||d.x>x1||d.y<y0||d.y>y1)continue;const pal=PAL[d.kind],brush=Math.abs(p.x-d.x)<28&&Math.abs(p.y-d.y)<22?(d.x-p.x)/28*.26:0,wind=Math.sin(t*1.7-d.x*.008+d.y*.005)*.13+Math.sin(t*.45)*.04+brush;
   ctx.save();ctx.translate(Math.round(d.x/2)*2,Math.round(d.y/2)*2);ctx.globalAlpha=.22;ctx.fillStyle=pal[0];ctx.beginPath();ctx.ellipse(0,0,d.w*.6,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
   for(let i=0;i<9;i++){const n=h(i,Math.floor(d.seed*10000),767),x=Math.round(((i/8-.5)*d.w)/2)*2,height=d.h*(.42+n*.58),bend=wind*height+(n-.5)*5,y=-Math.floor(height/2)*2;ctx.fillStyle=pal[0];block(ctx,x,-height*.35,2,height*.35+2);ctx.fillStyle=pal[1];block(ctx,x+bend*.45,-height*.7,2,height*.42);ctx.fillStyle=pal[2];block(ctx,x+bend,y,2,height*.34);if(i%3===0){ctx.fillStyle=pal[1];block(ctx,x-2,-height*.4,2,4);}}
   ctx.restore();
  }ctx.restore();
 }
 const ground=R.World.drawGround;R.World.drawGround=function(ctx,...a){const out=ground.call(this,ctx,...a);if(V.active())draw(ctx);return out;};
 const props=R.World.propsInCircle;R.World.propsInCircle=function(x,y,r,...a){const list=props.call(this,x,y,r,...a)||[];return V.active()?[...list,...near(x,y,r).map(d=>({x:d.x,y:d.y,r:9,type:'grass',solid:false,volcanoGrass:true}))]:list;};
 const reset=R.World.reset;R.World.reset=function(...a){cache.clear();return reset.apply(this,a);};
 window.PS_VOLCANO_GRASS={near,patch,draw,colors:PAL,reset:()=>cache.clear(),stats:()=>({cells:cache.size})};
})();
