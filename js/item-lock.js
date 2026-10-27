/* Opt-in held-item locks. Native item-choice callbacks still own pause/co-op cleanup. */
(() => {
 'use strict';const R=window.__PSX_REG__;if(!R?.Settings||!R?.RunUI)return;
 const key=p=>{const own=window.PS_HELD_ITEMS?.owner(p?.item);if(own)return String(own);let d=Number(p?.dex)||0,seen=new Set();while(!seen.has(d)){seen.add(d);const base=Object.entries(R.EVOS||{}).find(([,evos])=>evos.some(e=>Number(e[0])===d));if(!base)break;d=Number(base[0]);}return String(d);};
 const locks=()=>R.DB.save&&(R.DB.save.psItemLocks??={});
 function locked(p=R.Game.player){return !!(p?.item&&locks()?.[key(p)]===p.item);}
 function set(p,on){if(!p?.item||!R.Items.BY[p.item]||!R.DB.save)return false;const map=locks(),k=key(p);if(on)map[k]=p.item;else delete map[k];R.DB.commit?.();render();return true;}
 const get=R.Settings.get;R.Settings.get=function(name,...args){if(name==='itemLock'&&locked())return true;return get.call(this,name,...args);};
 function label(p){const it=R.Items.BY[p?.item];return it?(R.T?R.T(it.name):it.name):'';}
 function render(){if(typeof document==='undefined')return;const grid=document.querySelector('#scr-pause .pause-grid');if(!grid)return;let b=document.getElementById('ps-held-item-lock');if(!b){b=document.createElement('button');b.id='ps-held-item-lock';b.className='btn pg-wide';b.onclick=e=>{e.preventDefault();e.stopPropagation();const p=R.Game.player;set(p,!locked(p));};grid.insertBefore(b,grid.querySelector('#btn-save-run'));}
  const p=R.Game.player;b.disabled=!p?.item;b.textContent=p?.item?(locked(p)?'🔒 Unlock ':'🔓 Lock ')+label(p):'No held item to lock';b.setAttribute('aria-pressed',String(locked(p)));b.title='Keep this held item and skip replacement prompts. Each Pokémon has its own lock.';
 }
 const show=R.UI.show;R.UI.show=function(id,...a){const result=show.call(this,id,...a);if(id==='scr-pause')render();return result;};
 const choice=R.RunUI.showItemChoice;R.RunUI.showItemChoice=function(current,next,done){const p=R.Game.player;if(locked(p)&&current===p.item){done(current);return;}
  const result=choice.apply(this,arguments);if(typeof document==='undefined')return result;document.getElementById('ps-item-lock-keep')?.remove();const box=document.querySelector('#scr-item .box');if(!box||!current||current!==p?.item)return result;
  const b=document.createElement('button');b.id='ps-item-lock-keep';b.className='btn';b.style.marginTop='12px';b.textContent='Keep and lock '+label(p);b.onclick=e=>{e.preventDefault();e.stopPropagation();if(p!==R.Game.player||p.item!==current)return;set(p,true);R.UI.hide('scr-item');done(current);};box.append(b);return result;
 };
 render();window.PS_ITEM_LOCK={locked,set,key,render};
})();
