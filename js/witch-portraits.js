/* v83: skin portraits follow normal/shiny and base/Mega state; appearance-only. */
(() => {
 'use strict';const R=window.__PSX_REG__,src='assets/ui/witch-portraits/emotions-v82.png',megaSrc='assets/ui/witch-portraits/mega-emotions-blend-v83.png',shinySrc='assets/ui/witch-portraits/witch-shiny-emotions-v83.png',moods=['Normal','Happy','Inspired','Joyous','Worried','Angry','Crying','Teary-Eyed','Sad','Pain'];
 const atlases={witch:{src,width:1145,height:1374,cols:5,rows:6},'witch-shiny':{src:shinySrc,width:1983,height:793,cols:5,rows:2},'dread-normal':{src:megaSrc,width:1402,height:1122,cols:5,rows:4},'dread-shiny':{src:megaSrc,width:1402,height:1122,cols:5,rows:4,offset:2}};
 /* [v84] if the sheets were uploaded straight into assets/ui/ (not assets/ui/witch-portraits/), use them from there */
 const images=Object.values(atlases).map(a=>{const im=new Image();im.onerror=()=>{const alt=a.src.replace('witch-portraits/','');if(alt===a.src||im.src.endsWith(alt))return;for(const b of Object.values(atlases))if(b.src===a.src)b.src=alt;im.src=alt;};im.src=a.src;return im;});
 function face(p,mood='Normal'){
  if(Number(p?.dex)!==282||String(R.DB?.user||'').trim().toLowerCase()!=='lovergare'||window.PS_COSMETICS?.selected(282)!=='282-witch')return null;
  const form=String(p.megaKey||p.megaForm||p.anim?.dex||''),mega=/282[_-]mega/.test(form),shiny=!!(p.shiny||p.anim?.shiny||form.endsWith('-s')),skin=mega?(shiny?'dread-shiny':'dread-normal'):(shiny?'witch-shiny':'witch'),a=atlases[skin],i=Math.max(0,moods.indexOf(mood)),col=i%5,row=(a.offset||0)+Math.floor(i/5),cw=a.width/a.cols,ch=a.height/a.rows;
  return {src:a.src,rect:[col*cw,row*ch,cw,ch],grid:[a.cols,a.rows],cell:[col,row],skin,mood:moods[i]};
 }
 window.PS_WITCH_PORTRAITS={face,moods,src,megaSrc,shinySrc,images,atlases};
})();
