/* Angewomon is a separate, owner-account playable character. No existing species is replaced. */
(()=>{'use strict';const R=window.__PSX_REG__,A=window.PSXAI,ID=10001,OWNER='lovergare',MOVE='ang-heavens-arrow';if(!R?.DEX_BY||window.PS_ANGEWOMON)return;
const owner=()=>String(R.DB?.user||'').trim().toLowerCase()===OWNER;
const mon={dex:ID,name:'Angewomon',types:['fairy','flying'],hp:103,spd:114,atk:1.35,rarity:5,bst:565,starter:false,gen:0,start:MOVE,privateOwner:OWNER};
if(R.DEX_BY[ID]&&R.DEX_BY[ID].name!==mon.name)throw Error('Angewomon character ID is already in use');
R.DEX_BY[ID]=mon;R.BASE_STATS[ID]=[85,75,85,120,105,95];
const native={owns:R.DB.owns,ownsShiny:R.DB.ownsShiny,grant:R.DB.grant,grantShiny:R.DB.grantShiny};
R.DB.owns=function(d,...a){return Number(d)===ID?!owner()?false:native.owns.call(this,d,...a):native.owns.call(this,d,...a)};
if(native.ownsShiny)R.DB.ownsShiny=function(d,...a){return Number(d)===ID?false:native.ownsShiny.call(this,d,...a)};
R.DB.grant=function(d,...a){if(Number(d)===ID&&!owner())return false;return native.grant.call(this,d,...a)};
if(native.grantShiny)R.DB.grantShiny=function(d,...a){if(Number(d)===ID)return false;return native.grantShiny.call(this,d,...a)};
function sync(){const allowed=owner(),i=R.DEX.findIndex(d=>Number(d.dex)===ID);if(allowed&&i<0)R.DEX.push(mon);else if(!allowed&&i>=0)R.DEX.splice(i,1);const s=R.DB.save;if(!s)return allowed;if(allowed&&!native.owns.call(R.DB,ID))native.grant.call(R.DB,ID,'private-character');if(!allowed&&Number(s.partner)===ID){s.partner=[Number(s.starter),...Object.keys(s.owned||{}).map(Number),1].find(d=>d!==ID&&R.DEX_BY[d])||1;s.partnerShiny=false;}if(!allowed&&Array.isArray(s.psxTeam))s.psxTeam=s.psxTeam.filter(d=>Number(d?.dex??d)!==ID);return allowed;}
const start=R.Game.startRun;R.Game.startRun=function(...a){sync();return start.apply(this,a)};
const menu=R.MenuUI.open;R.MenuUI.open=function(...a){sync();return menu.apply(this,a)};
const gacha=window.PS_GACHA_POOL;window.PS_GACHA_POOL=function(pool,...a){const clean=pool.filter(d=>Number(d?.dex??d)!==ID);return gacha?gacha.call(this,clean,...a):clean};
const bag=R.Enemies.bagAt;R.Enemies.bagAt=function(...a){const b=bag.apply(this,a);return Array.isArray(b)?b.filter(d=>Number(d.dex)!==ID):b};
const add=R.EnemyMgr.add;R.EnemyMgr.add=function(e,...a){if(Number(e?.dex)===ID&&!e.psAlly&&!e.ally)return false;return add.call(this,e,...a)};
const arrow={...R.Moves.BY_ID['aura-sphere'],id:MOVE,name:"Heaven's Arrow",type:'fairy',kind:'projectile',desc:'A guided arrow of holy light.',cd:.9,dmg:16,speed:360,count:1,spread:0,pierce:1,life:1.6,size:4,homing:1.5};R.Moves.BY_ID[MOVE]=arrow;
const poolFor=R.Moves.poolFor;R.Moves.poolFor=function(m,...a){const list=poolFor.call(this,m,...a)||[];return Number(m?.dex)===ID?[...new Set([MOVE,...list])]:list.filter(v=>(v?.id||v)!==MOVE)};
const hovers=R.Sprites.hovers;R.Sprites.hovers=function(d,...a){return Number(d)===ID||hovers.call(this,d,...a)};
const radius=R.Sprites.bodyRadius;R.Sprites.bodyRadius=function(d,s=1,...a){return Number(d)===ID?12*s:radius.call(this,d,s,...a)};
const height=R.Sprites.bodyHeight;R.Sprites.bodyHeight=function(d,s=1,...a){return Number(d)===ID?45*s:height.call(this,d,s,...a)};
const cry=R.Audio.cry;if(cry)R.Audio.cry=function(d,...a){if(Number(d)===ID)return;return cry.call(this,d,...a)};
// The headshot follows the character ID in every UI, including the HUD and team bar.
const P=window.PS_PORTRAITS,src='assets/ui/angewomon/Normal.png',im=new Image();im.src=src;
function paint(ctx,x,y,size,alpha=1){if(!im.complete||!im.naturalWidth)return false;ctx.save();try{ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,0,40,40,Math.round(x),Math.round(y),size,size);}finally{ctx.restore();}return true;}
if(P){const draw=P.draw,hud=P.drawHud,element=P.element;P.draw=function(ctx,d,x,y,size,alpha=1){return Number(d)===ID&&paint(ctx,x,y,size,alpha)||draw.apply(this,arguments)};P.drawHud=function(ctx,p,x,y,size){return Number(p?.dex)===ID&&paint(ctx,x,y,size)||hud.apply(this,arguments)};P.element=function(d,size=80,o={}){if(Number(d)!==ID)return element.apply(this,arguments);const el=document.createElement('span');el.className='ps-headshot';el.role='img';el.ariaLabel='Angewomon portrait';el.style.cssText='display:inline-block;flex:none;image-rendering:pixelated;border-radius:6px;width:'+size+'px;height:'+size+'px;background-size:100% 100%;background-image:url("'+src+'");'+(o.silhouette?'filter:brightness(0);':'');return el;};}
if(A?.Light?.MOVE_LIGHT)A.Light.MOVE_LIGHT[MOVE]={c:[255,236,185],r:85,i:.6,dur:.18,at:'self'};
const drawables=R.Training.drawables;R.Training.drawables=function(...a){const list=drawables.apply(this,a)||[];if(Number(R.Game.player?.dex)!==ID)return list;for(const q of R.Projectiles.all()){if((q.m?.id||q.psxMove?.id||q.m?.def?.id)!==MOVE)continue;const prev=q.__angPrevious,ang=prev&&Math.hypot(q.x-prev[0],q.y-prev[1])>.01?Math.atan2(q.y-prev[1],q.x-prev[0]):q.__angAngle??R.Game.player.aim??0;q.__angPrevious=[q.x,q.y];q.__angAngle=ang;list.push({y:q.y,draw(ctx){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(ang);ctx.fillStyle='#fff2bc';ctx.fillRect(-12,-1,22,2);ctx.fillStyle='#ffd67b';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(5,-4);ctx.lineTo(5,4);ctx.closePath();ctx.fill();ctx.fillStyle='#e9c9f5';ctx.fillRect(-13,-3,4,6);ctx.restore();}});}return list;};
window.PS_ANGEWOMON={ID,MOVE,mon,owner,sync,paint,select(){if(!sync())return false;const s=R.DB.save;if(!s)return false;s.partner=ID;s.partnerShiny=false;R.DB.commit();return true;}};
setInterval(sync,500);sync();
})();
