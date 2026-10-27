/* Persistent species loadouts; internal team transfers never count as unequipping. */
(() => {
 'use strict';const R=window.__PSX_REG__,A=window.PSXAI;let transferring=0;
 const map=()=>R.DB.save&&(R.DB.save.psHeldItems??={});
 function owner(id){const it=R.Items.BY[id];return Number(it?.dex)||Number((it?.psxStone||String(id||'').replace(/^mstone_/,'' )).split('_')[0])||null;}
 function ancestor(from,to){from=Number(from);to=Number(to);const seen=new Set(),queue=[from];while(queue.length){const d=queue.shift();if(d===to)return true;if(seen.has(d))continue;seen.add(d);for(const [base,evos]of Object.entries(R.EVOS||{}))if(evos.some(e=>Number(e[0])===d))queue.push(Number(base));}return false;}
 const compatible=(id,dex)=>!!R.Items.BY[id]&&(!owner(id)||ancestor(owner(id),dex));
 function forDex(dex){const held=map();if(!held)return null;const d=Number(dex);if(Object.hasOwn(held,d))return owner(held[d])&&compatible(held[d],d)?held[d]:null;
  const inherited=Object.entries(held).filter(([k,id])=>id&&owner(id)&&compatible(id,d)&&ancestor(Number(k),d));if(inherited.length===1)return inherited[0][1];
  // Old saves only recorded discovered artifacts. Migrate a single unambiguous species item.
  const known=Object.keys(R.DB.save.itemsFound||{}).filter(id=>R.DB.save.itemsFound[id]&&owner(id)===d&&compatible(id,d));if(known.length===1){held[d]=known[0];R.DB.commit?.();return known[0];}return null;
 }
 function remember(p,previous){if(!p||p!==R.Game.player||transferring||!R.DB.save)return;const item=p.item||null;if(item&&!compatible(item,p.dex))return;const held=map(),oldOwner=owner(previous),key=owner(item)||(!item&&oldOwner)||Number(p.dex);if(oldOwner&&oldOwner!==key)held[oldOwner]=null;held[key]=owner(item)?item:null;R.DB.commit?.();}
 const equip=R.Player.prototype.equip;R.Player.prototype.equip=function(...a){const id=a[0],target=owner(id);if(!transferring&&this===R.Game.player&&R.Items.BY[id]&&target&&!compatible(id,this.dex)){const held=map();if(held){held[target]=id;R.DB.commit?.();}return;}const previous=this.item,result=equip.apply(this,a);remember(this,previous);return result;};
 function transition(fn){transferring++;try{return fn();}finally{transferring--;}}
 const start=R.Game.startRun;R.Game.startRun=function(...a){const result=start.apply(this,a),p=R.Game.player;if(p&&R.Game.state==='playing'&&!R.Coop?.active){if(A.Team?.run?.p!==p&&A.cfg?.team!==false)A.Team?.startRun?.(p);const m=A.Team?.cur();if(p.item){remember(p);if(m)m.item=p.item;}else{const item=forDex(m?.dex||p.dex);if(item&&compatible(item,p.dex)){transition(()=>p.equip(item));if(m)m.item=item;}}}return result;};
 window.PS_HELD_ITEMS={forDex,owner,compatible,remember,transition};
})();
