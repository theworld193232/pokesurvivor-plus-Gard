/* Friend Mega mechanics, Gard transformation presentation. */
(() => {
 'use strict';
 const R=window.__PSX_REG__,A=window.PSXAI,M=R?.Mega;
 if(!M||!A?.Power)throw Error('Mega integration requires friend Mega and Power modules');
 window.PS_FRIEND_MEGA=true;
 const sessions=new WeakMap();let resuming=false;
 const cries={282:'assets/cries/282.mp3',384:'assets/cries/384-mega.mp3'};
 const formName=key=>String(key||'').replace(/_megax$/,'-mega-x').replace(/_megay$/,'-mega-y').replace(/_megaz$/,'-mega-z').replace(/_/g,'-');
 const isMega=key=>/_mega(?:[xyz])?$/.test(String(key||''));
 const begin=M.start,end=M.end,tick=M.tick;
 function cleanup(p){const state=sessions.get(p);if(!state)return;state.undoMoves?.();if(p.anim===state.baseAnim&&p.megaKey===state.key)p.anim=state.megaAnim;if(p.megaForm===state.form)delete p.megaForm;delete p.__psBaseAnim;sessions.delete(p);}
 function quietNative(fn){const changed=[];for(const [obj,key]of [[R.FX,'ring'],[R.FX,'burst'],[R.FX,'dmgText'],[R.Camera,'kick'],[R.Audio,'sfx']]){if(typeof obj?.[key]!=='function')continue;changed.push([obj,key,obj[key]]);obj[key]=()=>{};}try{return fn();}finally{for(const [obj,key,old]of changed)obj[key]=old;}}
 M.start=function(p,...args){
  if(!p)return false;
  const previous=p.anim,key=M.keyOf(p.dex),custom=isMega(key)&&window.PS_FX?.has('megaevo');
  const result=resuming?quietNative(()=>begin.call(this,p,...args)):custom?quietNative(()=>begin.call(this,p,...args)):begin.call(this,p,...args);
  if(!result||!p.megaKey)return result;
  const form=formName(p.megaKey),next=p.anim,state={key:p.megaKey,form,dex:p.dex,age:0,baseAnim:previous,megaAnim:next};
  sessions.set(p,state);p.megaForm=form;p.__psBaseAnim=previous;state.undoMoves=window.PS_GARD_MEGA_MOVES?.grant(p,form);
  if(form==='383-primal')A.Sky?.set({hour:12});
  if(resuming){p.anim=next;if(isMega(p.megaKey))window.PS_MUSIC?.mega?.();}
  else if(isMega(p.megaKey)){
   // The sprite is revealed when Gard's orb shatters, not at activation.
   if(custom){p.anim=previous;p.invuln=Math.max(Number(p.invuln)||0,1.4);const ok=window.PS_FX.cast('megaevo',p,{id:'mega-evolution',type:'normal',dmg:0,fx:{newAnim:next,form,cry:cries[Number(p.dex)]||null}},null,true);if(!ok)p.anim=next;}
   window.PS_MUSIC?.mega?.();
  }else if(form==='382-primal')window.PS_PRIMAL_KYOGRE?.begin(p,previous,next);
  else if(form==='383-primal')window.PS_PRIMAL_GROUDON?.begin(p,previous,next);
  return result;
 };
 M.end=function(p,...args){const result=end.call(this,p,...args);if(p&&!p.megaKey)cleanup(p);return result;};
 M.tick=function(p,...args){const elapsed=Math.max(0,Number(args[0])||0);if(p&&!p.dead&&/_primal$/.test(String(p.megaKey||'')))p.megaT=(Number(p.megaT)||0)+elapsed;const result=tick.call(this,p,...args);const state=p&&sessions.get(p);
  if(p&&!p.megaKey)cleanup(p);
  else if(state&&p.megaKey===state.key&&p.dex===state.dex&&!p.dead){state.age+=Math.max(0,Number(args[0])||0);
   if(state.age>(/_primal$/.test(state.key)?3.6:1.3)&&p.anim?.dex!==state.megaAnim?.dex){state.megaAnim.dir=p.anim?.dir??state.megaAnim.dir;p.anim=state.megaAnim;}
  }return result;};
 // Reinstall after adapters so native Space/controller/HUD activation asks the stone rules.
 A.Power.registerItems();A.Power.install();
 function exclusiveRevive(p){if(A.Power.megaStage&&!A.Power.megaStage())return false;if(p!==R.Game.player||Number(p.dex)!==282||String(R.DB?.user||'').trim().toLowerCase()!=='lovergare'||Number(p.level)<50||!p.__jWillUsed||!window.__psJWill||p.megaKey)return false;const gate=window.PSXGEN,prior=gate.mega,cd=p.megaCd;p.megaCd=0;gate.mega=q=>q===p?true:prior(q);try{const ok=M.start(p);if(!ok)p.megaCd=cd;return ok;}finally{gate.mega=prior;}}
 function suspend(p){if(!p?.megaKey||p.dead)return null;const state={dex:p.dex,key:p.megaKey,time:p.megaT,cd:Number(p.megaCd)||0};M.end(p);p.megaCd=state.cd;return state;}
 function resume(p,state){if(!state||Number(state.dex)!==Number(p.dex)||p.dead)return false;const gate=window.PSXGEN,prior=gate?.mega,cd=p.megaCd;try{if(gate)gate.mega=q=>q===p?true:prior?.(q);if(M.keyOf(p.dex)!==state.key)M.setForm?.(p.dex,state.key);p.megaCd=0;resuming=true;const ok=M.start(p);if(ok&&p.megaKey===state.key){p.megaT=Math.max(.001,Number(state.time)||.001);const session=sessions.get(p);if(session){session.age=10;p.anim=session.megaAnim;}return true;}p.megaCd=cd;return false;}finally{resuming=false;if(gate)gate.mega=prior;}}
 window.PS_GARD_MEGA_PRESENTATION={formName,isMega,exclusiveRevive,suspend,resume,session:p=>sessions.get(p)||null,mechanics:'friend',presentation:'Gard'};
})();
