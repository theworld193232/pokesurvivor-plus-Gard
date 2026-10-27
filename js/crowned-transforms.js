/* Crowned Sword/Shield awakening: original pixel VFX, referenced to Pokémon Evolutions ep.1. */
(() => {
 'use strict';const R=window.__PSX_REG__,F=window.PS_FX;if(!R||!F?.styles)return;
 const REVEAL=2.05,END=4.1,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
 const recognizes=key=>/^(888|889)_crowned$/.test(String(key)),colors={888:{main:'#5be5ff',dark:'#2678be',warm:'#e6c66b',pale:'#e9ffff'},889:{main:'#ff79bd',dark:'#9a255e',warm:'#ffe39a',pale:'#fff2d8'}};
 const sound=name=>{try{R.Audio.sfx(name);}catch(_){}};
 function reveal(c){if(c.revealed)return;c.revealed=true;const p=c.player;if(!p||p.dead||p.megaKey!==c.key)return;if(c.fx.newAnim)p.anim=c.fx.newAnim;sound('chest');try{R.Camera.kick(.45);}catch(_){}
  try{const settings=R.Audio.settings||{},volume=Number(settings.sfx??.7),master=Number(settings.master??1);if(volume>0&&master>0&&settings.muted!==true&&settings.mute!==true&&R.Audio.muted!==true){c.cry=new Audio('assets/cries/'+p.dex+'.ogg');c.cry.volume=Math.min(1,volume*master);c.cry.play()?.catch(()=>{});}}catch(_){}
 }
 function dispose(c){const p=c.player;if(p?.__crownedScene===c){if(!p.dead&&p.megaKey===c.key&&p.anim===c.previous&&c.fx.newAnim)p.anim=c.fx.newAnim;delete p.__crownedScene;}if(c.t<END||p?.dead||p?.megaKey!==c.key)try{c.cry?.pause();}catch(_){} }
 function polygon(g,points,fill,stroke){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke();}}
 function star(g,x,y,s,col){g.fillStyle=col;g.fillRect(Math.round(x-s),Math.round(y-1),Math.round(s*2+1),3);g.fillRect(Math.round(x-1),Math.round(y-s),3,Math.round(s*2+1));}
 function wolfLight(c){if(!c.previous?.draw||typeof document==='undefined')return null;const frame=Math.floor(c.t*24);if(c.maskFrame===frame&&c.mask)return c.mask;c.maskFrame=frame;
  if(!c.mask){c.mask=document.createElement('canvas');c.mask.width=c.mask.height=Math.min(512,Math.max(224,Math.ceil(c.h*4)));}
  const g=c.mask.getContext('2d'),w=c.mask.width;g.clearRect(0,0,w,w);g.save();g.imageSmoothingEnabled=false;c.previous.draw(g,w/2,w*.72);g.globalCompositeOperation='source-in';g.fillStyle=c.palette.main;g.fillRect(0,0,w,w);g.restore();return c.mask;
 }
 // Jagged, layered flame sheets use a small pixel canvas, then nearest-neighbor scaling.
 function flame(g,t,r,index,col,alpha){
  const phase=t*(index%2?-2.4:2.8)+index*1.7,points=[];
  for(let i=0;i<=64;i++){const a=i/64*TAU,wave=Math.sin(a*7+phase*2)*.07+Math.sin(a*13-phase*3)*.045+Math.pow(Math.max(0,Math.sin(a*5+phase)),9)*.21;
   const d=r*(1+wave);points.push([Math.round(Math.cos(a)*d),Math.round(Math.sin(a)*d*1.09)]);}
  g.globalAlpha=alpha;polygon(g,points,col);
 }
 function energy(c){
  if(typeof document==='undefined')return null;
  if(!c.energy){c.energy=document.createElement('canvas');c.energy.width=c.energy.height=192;}
  const g=c.energy.getContext('2d'),t=c.t,P=c.palette,after=Math.max(0,t-REVEAL),gather=ease((t-.35)/.85),opening=ease(after/.65),r=(32+gather*18)*(1+Math.sin(t*12)*.045+Math.sin(t*19)*.018);
  g.clearRect(0,0,192,192);g.save();g.translate(96,100);g.imageSmoothingEnabled=false;
  // The cloak gathers into a white-hot cocoon, then tears into outward curling sheets.
  if(t<REVEAL){
   flame(g,t,r*1.18,0,P.main,.18+gather*.22);
   flame(g,t,r,1,paletteOuter(c),.35+gather*.6);
   flame(g,t,r*.84,2,P.main,.4+gather*.6);
   flame(g,t,r*.66,3,P.pale,gather*.97);
   for(let j=0;j<7;j++){
    const phase=t*(j%2?-3:3.4)+j*TAU/7,rad=r*(.55+j*.075),pts=[];
    for(let i=0;i<=16;i++){const u=i/16,a=phase+u*2.2,d=rad*(1-u*.65);pts.push([Math.round(Math.cos(a)*d),Math.round(Math.sin(a)*d)]);}
    for(let i=16;i>=0;i--){const u=i/16,a=phase+u*2.2,d=rad*(1-u*.65)-(1-u)*9;pts.push([Math.round(Math.cos(a)*d),Math.round(Math.sin(a)*d)]);}
    g.globalAlpha=.45+gather*.45;polygon(g,pts,j%5===0?P.warm:j%2?P.pale:P.main);
   }
  }else if(after<1.2){
   for(let j=0;j<10;j++){const a=j*TAU/10+t*.35,d=20+opening*59;g.save();g.translate(Math.round(Math.cos(a)*d),Math.round(Math.sin(a)*d));g.rotate(a+opening*1.4);g.globalAlpha=(1-opening)*.9;
    polygon(g,[[-5,-20],[-12,-8],[-8,5],[0,21],[2,6],[10,-5],[3,-1],[5,-15]],j%3?P.main:P.warm);g.restore();}
   if(after<.16){g.globalAlpha=(1-after/.16)*.85;flame(g,t,54,4,P.pale,g.globalAlpha);}
  }
  g.restore();return c.energy;
 }
 function paletteOuter(c){return c.player.dex===889?'#ff397b':'#238fff';}
 const style={cast(c){const p=c.player;if(!p||!recognizes(p.megaKey))return null;c.key=p.megaKey;c.previous=p.anim;c.h=Math.max(40,Number(p.bodyH)||60);c.r=Math.max(42,Math.min(92,c.h*.75));c.palette=colors[p.dex];c.revealed=false;c.seed=Number(p.dex);p.__crownedScene=c;p.invuln=Math.max(Number(p.invuln)||0,REVEAL+.25);sound('shinyGet');return c;},
  update(c,dt){const p=c.player;if(!p||p.dead||p.megaKey!==c.key||p!==R.Game.player)return false;c.t+=Math.max(0,Math.min(.1,Number(dt)||0));if(c.t>=REVEAL)reveal(c);return c.t<END;},
  draw(c,g,v){const p=c.player;if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
   const t=c.t,k=v.k,x=v.sx(p.x),foot=v.sy(p.y),y=v.sy(p.y-c.h*.65),r=c.r*k*1.4,P=c.palette,after=Math.max(0,t-REVEAL),fade=t<REVEAL?1:1-clamp(after/(END-REVEAL)),charge=ease(t/.65);
   g.save();g.imageSmoothingEnabled=false;
   // Local bloom, never a full-screen flash or floor rune.
   const pulse=1+Math.sin(t*11)*.07,hr=r*2.1*pulse;const halo=g.createRadialGradient(x,y,0,x,y,hr);halo.addColorStop(0,p.dex===888?'rgba(80,200,255,.36)':'rgba(255,90,145,.36)');halo.addColorStop(1,'transparent');g.globalAlpha=charge*fade*(.86+.14*Math.sin(t*13));g.fillStyle=halo;g.fillRect(x-hr,y-hr,hr*2,hr*2);
   // Counter-rotating wisps make the bloom move independently of the flame core.
   for(let j=0;j<3;j++){g.save();g.translate(x,y);g.rotate(t*(j%2?-2.1:1.7)+j*TAU/3);g.globalAlpha=charge*fade*.55;g.strokeStyle=j===1?P.warm:P.main;g.lineWidth=(2+j%2)*k;g.shadowColor=P.main;g.shadowBlur=10*k;g.beginPath();g.ellipse(0,0,r*(1.05+j*.15)*pulse,r*(.55+j*.1),.5,0,Math.PI*1.3);g.stroke();g.restore();}
   const mask=wolfLight(c);
   if(mask&&t<REVEAL){g.save();g.globalAlpha=charge*.85;g.shadowColor=P.main;g.shadowBlur=16*k;g.drawImage(mask,x-mask.width/2*k,foot-mask.height*.72*k,mask.width*k,mask.height*k);g.restore();}
   const layer=energy(c);if(layer){g.save();g.globalAlpha=fade;g.shadowColor=P.main;g.shadowBlur=22*k;const size=r*3.2;g.drawImage(layer,x-size*.5,y-size*100/192,size,size);g.restore();}
   // Spiralling sparks gather toward the body, then drift off the revealed armor.
   for(let i=0;i<44;i++){const u=(t*.55+i*.173)%1,a=i*2.399+t*(i%2?1:-1),d=t<REVEAL?r*(1.8-u*1.3):r*(.6+after*(.55+i%4*.12)),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.85-(t<REVEAL?u:after)*r*.22;
    g.globalAlpha=Math.sin(u*Math.PI)*fade*charge;star(g,px,py,(i%7===0?2:1)*k,i%4===0?P.warm:P.pale);}
   // Crowned silhouette shines briefly as the flame cocoon breaks apart.
   if(after>0&&after<.6&&c.fx.newAnim?.draw){g.save();g.globalAlpha=(1-after/.6)*.32;g.translate(x,foot);g.scale(k,k);g.shadowColor=P.pale;g.shadowBlur=12;c.fx.newAnim.draw(g,0,0);g.restore();}
   g.restore();},dispose};
 F.styles.crowned=style;
 function begin(p,previous,next){if(!recognizes(p?.megaKey))return false;p.anim=previous;const ok=F.cast('crowned',p,{id:'crowned-awakening',type:p.dex===888?'fairy':'fighting',dmg:0,fx:{newAnim:next}},null,true);if(!ok)p.anim=next;return ok;}
 window.PS_CROWNED_TRANSFORMS={begin,recognizes,revealTime:REVEAL,duration:END,style,colors};
})();
