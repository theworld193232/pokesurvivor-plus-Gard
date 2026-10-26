/* Compatibility for friend revision 51d69 while Gard owns progression/private maps. */
(() => {
 'use strict';const A=window.PSXAI,R=window.__PSX_REG__;if(!A?.R||!R)throw Error('Friend update: native AI did not install');
 const act2=()=>!!window.PS_CRYSTAL_PEAK?.active?.();
 const quiet=()=>!!(act2()&&window.PS_CRYSTAL_PEAK.model.special());
 function guard(object,key,blocked,onBlock){const old=object?.[key];if(typeof old!=='function')return;object[key]=function(...args){if(blocked()){onBlock?.();return;}return old.apply(this,args);};}
 // Ocean owns stage 3, not Gard's Area Zero terrain or custom Act 2.
 const oceanOn=A.Ocean.on;A.Ocean.on=function(...a){return !R.Maps.endless&&!act2()&&oceanOn.apply(this,a);};
 // Story mode is absent; a mansion scene cannot indefinitely postpone the normal finale.
 A.Journey.blocksFinale=()=>false;
 // New legendary events and dialogue cannot leak into the quiet Act 2 temple rooms.
 for(const name of ['Journey','Trio','Sea','Guardians','Birth','Events','Well','Spiritomb','Totem','Power','Apparitions']){
  for(const key of ['tick','drawGround','drawUnder','drawAir','drawScreen','lights'])guard(A[name],key,quiet);
 }
 for(const key of ['say','party','npc','legend','tick','draw'])guard(A.Talk,key,quiet,()=>A.Talk.reset());
 // Breakable trees belong to the friend's forest/ocean props; custom mountain trees retain their own collision/shake.
 guard(A.Breakables,'tick',act2);
 window.PS_GARD_FRIEND_UPDATE={revision:'51d69dd6cf94a96019c0e5da484a05f6f2aff999',quiet,act2,progression:'Gard level based',ocean:true};
})();
