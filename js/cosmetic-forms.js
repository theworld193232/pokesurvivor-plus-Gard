/* Optional appearance-only forms. Base-species ownership is required; stats stay native. */
(() => {
 'use strict';const R=window.__PSX_REG__,forms=window.PS_COSMETIC_FORMS||[],byKey=Object.fromEntries(forms.map(f=>[f.key,f]));
 for(const f of forms){R.SPRITE_META[f.key]=f.meta;if(window.PSXAI_CANON_SIZE){window.PSXAI_CANON_SIZE.opaquePx[f.key]=f.opaqueHeight;window.PSXAI_CANON_SIZE.heightDm[f.key]=window.PSXAI_CANON_SIZE.heightDm[f.dex];}}
 const owns=d=>!!R.DB.owns(d),list=d=>forms.filter(f=>f.dex===Number(d));
 function selected(d){const key=R.DB.save.psAppearance?.[d];return owns(d)&&byKey[key]?.dex===Number(d)?key:null;}
 function choose(d,key){d=Number(d);if(!owns(d)||key&&byKey[key]?.dex!==d)return false;const save=R.DB.save;save.psAppearance=save.psAppearance||{};if(key)save.psAppearance[d]=key;else delete save.psAppearance[d];R.DB.commit();const p=R.Game.player;if(p&&p.dex===d)apply(p);return true;}
 function apply(p){if(!p||p.megaKey||p.megaForm)return;const key=selected(p.dex),old=p.anim;if(p.shiny||old?.shiny){if(p.mon?.skin&&byKey[p.mon.skin]){p.mon={...p.mon};delete p.mon.skin;p.anim=new R.Sprites.Animator(p.dex,p.scale||1,true);}return;}if(key){p.mon={...p.mon,skin:key};if(old?.dex!==key){p.anim=new R.Sprites.Animator(key,p.scale||1,false);p.anim.dir=old?.dir??0;}}else if(byKey[p.mon?.skin]){p.mon={...p.mon};delete p.mon.skin;p.anim=new R.Sprites.Animator(p.dex,p.scale||1,!!p.shiny);}}
 function controls(el,dex,refresh){const L=list(dex);if(!L.length||!owns(dex))return;const label=document.createElement('label');label.textContent='Appearance ';const select=document.createElement('select');select.className='field';select.setAttribute('aria-label','Pokémon appearance');for(const [key,text]of [['','Original'],...L.map(f=>[f.key,f.label])]){const o=document.createElement('option');o.value=key;o.textContent=text;select.append(o);}select.value=selected(dex)||'';select.onchange=()=>{choose(dex,select.value);refresh();};label.append(select);const hint=document.createElement('small');hint.textContent='Appearance only · original stats and abilities · original palette (turn Shiny off)';el.append(label,hint);}
 const evolve=R.Player.prototype.evolveTo;R.Player.prototype.evolveTo=function(...args){const result=evolve.apply(this,args);apply(this);return result;};
 const start=R.Game.startRun;R.Game.startRun=function(...args){const result=start.apply(this,args);apply(R.Game.player);return result;};
 const end=R.Mega.end;R.Mega.end=function(p,...args){const result=end.call(this,p,...args);apply(p);return result;};
 window.PS_COSMETICS={forms,list,selected,choose,apply,controls};
})();
