/* Presentation adapter only: original Guardian Signs strips, native combat/damage untouched. */
(() => {
 'use strict';const R=window.__PSX_REG__,V=R?.VFX,D=window.PS_GUARDIAN_EFFECTS;if(!V?.SHAPES||!D)return;
 const types={fire:35,water:163,electric:52,ice:25,psychic:41,fairy:14,dark:56,ghost:56,poison:56};
 const images=new Map(),cache=new Map(),prefix='guardian-';
 function source(id){const key='fx_'+String(id).padStart(3,'0'),d=D[key];if(!d)return null;if(!images.has(key)){const im=new Image();im.src='assets/fx/guardian-signs/'+d.file;images.set(key,im);}return {d,im:images.get(key)};}
 function frame(id,n=0){const s=source(id);if(!s?.im.complete||!s.im.naturalWidth)return null;const {d,im}=s,f=((Math.floor(n)%d.frames)+d.frames)%d.frames,key=id+':'+f;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const k=22/Math.max(d.frame_w,d.frame_h),w=Math.max(1,Math.round(d.frame_w*k)),h=Math.max(1,Math.round(d.frame_h*k));g.drawImage(im,f*d.frame_w,0,d.frame_w,d.frame_h,Math.round((24-w)/2),Math.round((24-h)/2),w,h);if(cache.size>=160)cache.delete(cache.keys().next().value);cache.set(key,c);return c;}
 for(const id of new Set(Object.values(types))){const d=D['fx_'+String(id).padStart(3,'0')];if(!d)continue;V.SHAPES[prefix+id]={w:24,h:24,frames:d.frames,gen(P){P.set(12,12,'w');}};source(id);}
 const draw=V.draw,sprite=V.sprite;
 V.draw=function(ctx,name,pal,x,y,opts={}){if(!name?.startsWith(prefix))return draw.apply(this,arguments);const canvas=frame(Number(name.slice(prefix.length)),opts.frame||0);if(!canvas)return draw.call(this,ctx,'star',pal,x,y,opts);const scale=2*(opts.scale||1);ctx.save();ctx.imageSmoothingEnabled=false;if(opts.alpha!=null)ctx.globalAlpha*=opts.alpha;ctx.translate(Math.round(x),Math.round(y));if(opts.angle)ctx.rotate(Math.round(opts.angle/(Math.PI/8))*Math.PI/8);ctx.drawImage(canvas,-12*scale,-12*scale,24*scale,24*scale);ctx.restore();};
 V.sprite=function(name,pal,n){if(name?.startsWith(prefix)){const c=frame(Number(name.slice(prefix.length)),n||0);if(c)return c;return sprite.call(this,'star',pal,n);}return sprite.apply(this,arguments);};
 const forMove=V.forMove,forType=V.forType;
 const named=new Set(['ember','water-gun','bubble','thunder-shock','confusion','psychic','psybeam','ice-shard','fairy-wind','dazzling-gleam','electro-ball','energy-ball','mist-ball','disarming-voice','draining-kiss','powder-snow','shadow-ball','dark-pulse','sludge-bomb']);
 V.forMove=function(m,...a){const p=forMove.call(this,m,...a),id=types[m?.type];return id&&named.has(m?.id)&&!m.psCast?{...p,proj:prefix+id}:p;};
 V.forType=function(type,...a){const p=forType.call(this,type,...a),id=types[type];return id?{...p,proj:prefix+id}:p;};
 window.PS_GUARDIAN_ART={types,frame,source,cache,named,installed:true};
})();
