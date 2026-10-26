/* Pixel headshots from the credited SpriteCollab/PokéHorde atlas. */
(() => {
 'use strict';
 const data=window.PS_PORTRAIT_INDEX,im=new Image();let ready=false;
 const base=dex=>Number(String(dex).split(/[_-]/)[0]);
 function rect(dex){const n=data?.index?.[base(dex)];return n==null?null:{x:n%data.cols*data.size,y:Math.floor(n/data.cols)*data.size,w:data.size,h:data.size};}
 function draw(ctx,dex,x,y,size,alpha=1){const r=rect(dex);if(!ready||!r)return false;ctx.save();try{ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,r.x,r.y,r.w,r.h,Math.round(x),Math.round(y),size,size);}finally{ctx.restore();}return true;}
 function element(dex,size=80,options={}){const r=rect(dex);if(!r||options.silhouette)return null;const n=document.createElement('span'),scale=size/data.size;n.className='ps-headshot';n.setAttribute('role','img');n.setAttribute('aria-label',options.name?options.name+' portrait':'Pokémon portrait');n.style.cssText='display:inline-block;flex:none;image-rendering:pixelated;border-radius:6px;width:'+size+'px;height:'+size+'px;background-image:url("'+data.src+'");background-repeat:no-repeat;background-size:'+data.cols*size+'px auto;background-position:-'+r.x*scale+'px -'+r.y*scale+'px;'+(options.silhouette?'filter:brightness(0);':'');return n;}
 im.onload=()=>{ready=true;};im.onerror=()=>{ready=false;};if(data)im.src=data.src;
 window.PS_PORTRAITS={rect,draw,element,get ready(){return ready;},count:Object.keys(data?.index||{}).length};
})();
