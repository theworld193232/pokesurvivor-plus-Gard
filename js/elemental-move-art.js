/* Animated PMD-style elemental move art. Inspired by the public PokéHorde/Doofcraft
 * type palettes and move cards; original generators, native combat remains authoritative. */
(() => {
 'use strict';
 const R=window.__PSX_REG__,V=R?.VFX;if(!V?.SHAPES||!V.forMove||!V.forType)return;
 const shapes={fire:'gard-fire',water:'gard-water',grass:'gard-leaf',electric:'gard-bolt',psychic:'gard-psi',ice:'gard-ice',fairy:'gard-fairy'};
 function generate(kind,P,frame){const t=frame*Math.PI/3,c=7;
  for(let y=1;y<14;y++)for(let x=1;x<14;x++){const dx=x-c,dy=y-c;let color=null;
   if(kind==='fire'){const bend=Math.sin(t+dy*.45)*1.6,width=Math.max(1,(13-y)*.34);if(y>2&&y<13&&Math.abs(dx-bend)<width)color=y>8?'w':x<c?'m':'l';}
   else if(kind==='water'){const r=Math.hypot(dx,dy),wave=4.7+Math.sin(t)*.6;if(Math.abs(r-wave)<1)color=dy<0?'w':'l';else if(r<wave-1)color=x+y<14?'l':'m';if(x===4&&y===4)color='w';}
   else if(kind==='grass'){const bend=dx+Math.sin(t)*dy*.2;if(Math.abs(bend)<(6-Math.abs(dy))*.65&&Math.abs(dy)<6)color=Math.abs(bend)<.8?'w':bend<0?'l':'m';}
   else if(kind==='electric'){const zig=(y<5?2:y<9?-1:1)+Math.sin(t)*.7;if(Math.abs(dx-zig)<1.5&&y>1&&y<13)color='w';if(frame%2===0&&((x===2&&y===4)||(x===12&&y===10)))color='l';}
   else if(kind==='psychic'){const a=Math.atan2(dy,dx),r=Math.hypot(dx,dy*1.25);if(Math.abs(r-(3.8+Math.sin(a*2+t)*.8))<1)color=Math.sin(a+t)>.1?'w':'m';if(Math.abs(dx)+Math.abs(dy)<2)color='l';}
   else if(kind==='ice'){if(Math.abs(dx)<(6-Math.abs(dy))*.6&&Math.abs(dy)<6)color=dx<0?'l':'m';if(Math.abs(dx)<.7&&Math.abs(dy)<5)color='w';if((y+frame*2)%9===0&&Math.abs(dx)<2)color='w';}
   else {const a=Math.atan2(dy,dx),r=Math.hypot(dx,dy),edge=3+2.3*Math.cos(a*5+t*.18);if(r<edge)color=r<1.8?'w':dx<0?'l':'m';if((frame+x+y)%6===0&&r>5&&r<6)color='l';}
   if(color)P.set(x,y,color);
  }P.outline?.();
 }
 for(const [type,name]of Object.entries(shapes))V.SHAPES[name]={w:15,h:15,frames:6,gen(P,f){generate(type,P,f);}};
 const originalMove=V.forMove,originalType=V.forType;
 const named=new Set(['ember','water-gun','bubble','razor-leaf','thunder-shock','confusion','psychic','psybeam','ice-shard','fairy-wind','dazzling-gleam','electro-ball','energy-ball','mist-ball','disarming-voice','draining-kiss','leaf-storm','powder-snow','flamethrower','hydro-pump','ice-beam']);
 V.forMove=function(m,...args){const profile=originalMove.call(this,m,...args),shape=shapes[m?.type];if(!shape||!named.has(m?.id))return profile;const next={...profile,proj:shape};if(profile.beam&&profile.beam!=='lightning')next.beam=shape;if(profile.aura)next.aura=shape;return next;};
 V.forType=function(type,...args){const profile=originalType.call(this,type,...args);return shapes[type]?{...profile,proj:shapes[type]}:profile;};
 window.PS_ELEMENTAL_ART={shapes,moves:Array.from(named),generate,installed:true};
})();
