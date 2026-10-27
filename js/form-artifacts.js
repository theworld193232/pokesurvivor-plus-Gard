/* Form artifacts: native held-item rules, and Deoxys's Meteor Shard. */
(() => {
 'use strict';const R=window.__PSX_REG__,A=window.PSXAI,ID='meteor-shard',ORDER=['','attack','defense','speed'],last=new WeakMap();
 const item={id:ID,name:'Meteor Shard',dex:386,psxForm:true,desc:'Deoxys: after beating Act 3, press Space to cycle Normal, Attack, Defense and Speed forms. Takes your held-item slot.',on(){},off(){}};
 if(!R.Items.BY[ID]){R.Items.BY[ID]=item;R.Items.LIST.push(item);}
 function ready(p){return !!(p&&p===R.Game.player&&p.dex===386&&p.item===ID&&A.Power.megaStage()&&R.Game.state==='playing'&&!p.dead&&!p.megaKey&&!p.evoAnim&&!p.evoTo&&!window.PS_QUALITY?.dyn.active);}
 function cycle(p){if(!ready(p))return false;const now=performance.now();if(now-(last.get(p)||-Infinity)<450)return false;const old=R.FORM_EVOS[386],form=ORDER[(ORDER.indexOf(p.mon.form||'')+1)%ORDER.length],hp=p.hp/p.maxHp;R.FORM_EVOS[386]=[[p.mon.form||'',form,0]];let ok=false;try{ok=p.formEvolve();}finally{if(old)R.FORM_EVOS[386]=old;else delete R.FORM_EVOS[386];}if(!ok)return false;last.set(p,now);p.hp=Math.max(1,Math.round(p.maxHp*hp));R.FX.ring(p.x,p.y,8,64,'#fe8c71',.45,3);R.Spawner.say('Deoxys · '+(form?form[0].toUpperCase()+form.slice(1):'Normal')+' Forme',2);return true;}
 addEventListener('keydown',e=>{const t=e.target;if(e.code!=='Space'||e.repeat||/INPUT|TEXTAREA|SELECT/.test(t?.tagName||'')||t?.isContentEditable||A.Boats?.spaceIsBoat?.())return;if(ready(R.Game.player)){e.preventDefault();e.stopImmediatePropagation();cycle(R.Game.player);}},true);
 A.Bus.on('birth',e=>{if(e.what==='won')R.Pickups.drop('item',e.x,e.y,ID);});
 const icon='assets/items/meteor-shard.svg',I=R.Icons;if(I){const html=I.html,draw=I.draw,url=I.url;I.html=function(id,size){return id===ID?'<img src="'+icon+'" alt="Meteor Shard" width="'+(Number(size)||24)+'" height="'+(Number(size)||24)+'">':html.apply(this,arguments);};if(url)I.url=function(id){return id===ID?icon:url.apply(this,arguments);};const im=new Image();im.src=icon;I.draw=function(ctx,id,x,y,size){if(id!==ID)return draw.apply(this,arguments);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x,y,size,size);};}
 window.PS_FORM_ARTIFACTS={ready,cycle,meteor:ID,order:ORDER};
})();
