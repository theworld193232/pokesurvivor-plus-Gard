/* Draw opaque terrain chunks on shared device-pixel edges at every camera scale/DPR. */
(function(){
 'use strict';
 const near=(a,b)=>Math.abs(a-b)<1e-6;
 function rect(m,x,y,w,h){if(!m||!near(m.b,0)||!near(m.c,0)||m.a<=0||m.d<=0)return null;const x0=Math.floor(m.a*x+m.e+1e-7),y0=Math.floor(m.d*y+m.f+1e-7),x1=Math.ceil(m.a*(x+w)+m.e-1e-7),y1=Math.ceil(m.d*(y+h)+m.f-1e-7);return {x:x0,y:y0,w:x1-x0,h:y1-y0};}
 function tile(ctx,draw,image,x,y,w,h){const r=rect(ctx.getTransform(),x,y,w,h);if(!r)return draw.call(ctx,image,x,y,w,h);ctx.save();try{ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;return draw.call(ctx,image,r.x,r.y,r.w,r.h);}finally{ctx.restore();}}
 function ground(ctx,fn,self,args){if(!ctx?.drawImage||ctx.__psGroundEdges)return fn.apply(self,args);const draw=ctx.drawImage,own=Object.prototype.hasOwnProperty.call(ctx,'drawImage');ctx.__psGroundEdges=true;ctx.drawImage=function(image,...a){const canvas=typeof image?.getContext==='function',square=image?.width>=64&&image.width===image.height;if(a.length===4&&canvas&&square&&a[2]>=128&&near(a[2],a[3])&&ctx.globalAlpha===1&&ctx.globalCompositeOperation==='source-over')return tile(ctx,draw,image,...a);return draw.call(ctx,image,...a);};try{return fn.apply(self,args);}finally{if(own)ctx.drawImage=draw;else delete ctx.drawImage;delete ctx.__psGroundEdges;}}
 const api=window.PS_GROUND_EDGES={rect,tile,ground};
 (function install(){const R=window.__PSX_REG__;if(!R?.World?.drawGround){setTimeout(install,100);return;}if(R.World.__psGroundEdges)return;const wrap=fn=>function(...args){return ground(args[0],fn,this,args);};let current=wrap(R.World.drawGround);Object.defineProperty(R.World,'drawGround',{configurable:true,enumerable:true,get(){return current;},set(fn){current=typeof fn==='function'?wrap(fn):fn;}});R.World.__psGroundEdges=true;})();
})();
