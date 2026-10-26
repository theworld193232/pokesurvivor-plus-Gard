/* Friend Mega mechanics, Gard transformation presentation. */
(() => {
 'use strict';
 const R=window.__PSX_REG__,A=window.PSXAI,M=R?.Mega;
 if(!M||!A?.Power)throw Error('Mega integration requires friend Mega and Power modules');
 window.PS_FRIEND_MEGA=true;
 const sessions=new WeakMap();
 const cries={282:'assets/cries/282.mp3',384:'assets/cries/384-mega.mp3'};
 const formName=key=>String(key||'').replace(/_megax$/,'-mega-x').replace(/_megay$/,'-mega-y').replace(/_megaz$/,'-mega-z').replace(/_/g,'-');
 const isMega=key=>/_mega(?:[xyz])?$/.test(String(key||''));
 const begin=M.start,end=M.end,tick=M.tick;
 function cleanup(p){const state=sessions.get(p);if(!state)return;if(p.anim===state.baseAnim&&p.megaKey===state.key)p.anim=state.megaAnim;if(p.megaForm===state.form)delete p.megaForm;delete p.__psBaseAnim;sessions.delete(p);}
 function quietNative(fn){const changed=[];for(const [obj,key]of [[R.FX,'ring'],[R.FX,'burst'],[R.FX,'dmgText'],[R.Camera,'kick'],[R.Audio,'sfx']]){if(typeof obj?.[key]!=='function')continue;changed.push([obj,key,obj[key]]);obj[key]=()=>{};}try{return fn();}finally{for(const [obj,key,old]of changed)obj[key]=old;}}
 M.start=function(p,...args){
  if(!p)return false;
  const previous=p.anim,key=M.keyOf(p.dex),custom=isMega(key)&&window.PS_FX?.has('megaevo');
  const result=custom?quietNative(()=>begin.call(this,p,...args)):begin.call(this,p,...args);
  if(!result||!p.megaKey)return result;
  const form=formName(p.megaKey),next=p.anim,state={key:p.megaKey,form,baseAnim:previous,megaAnim:next};
  sessions.set(p,state);p.megaForm=form;p.__psBaseAnim=previous;
  if(isMega(p.megaKey)){
   // The sprite is revealed when Gard's orb shatters, not at activation.
   if(custom){p.anim=previous;p.invuln=Math.max(Number(p.invuln)||0,1.4);const ok=window.PS_FX.cast('megaevo',p,{id:'mega-evolution',type:'normal',dmg:0,fx:{newAnim:next,form,cry:cries[Number(p.dex)]||null}},null,true);if(!ok)p.anim=next;}
   window.PS_MUSIC?.mega?.();
  }else if(form==='382-primal')window.PS_PRIMAL_KYOGRE?.begin(p,previous,next);
  else if(form==='383-primal')window.PS_PRIMAL_GROUDON?.begin(p,previous,next);
  return result;
 };
 M.end=function(p,...args){const result=end.call(this,p,...args);if(p&&!p.megaKey)cleanup(p);return result;};
 M.tick=function(p,...args){const result=tick.call(this,p,...args);if(p&&!p.megaKey)cleanup(p);return result;};
 // Reinstall after adapters so native Space/controller/HUD activation asks the stone rules.
 A.Power.registerItems();A.Power.install();
 window.PS_GARD_MEGA_PRESENTATION={formName,isMega,session:p=>sessions.get(p)||null,mechanics:'friend',presentation:'Gard'};
})();
