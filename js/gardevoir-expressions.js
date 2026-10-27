/* Local Gardevoir's occasional idle gestures and situational HUD expressions. */
(() => {
 'use strict';const R=window.__PSX_REG__,A=window.PSXAI,data=window.PS_GARDEVOIR_EXPRESSION_DATA,states=new WeakMap(),images=new Map();
 for(const [key,e]of Object.entries(data)){const m=R.SPRITE_META[key];if(!m)continue;Object.assign(m.a,e.normal);m.sa={...(m.sa||{}),...e.shiny};}
 for(const shiny of [false,true])R.Sprites.preload([282,'282_mega'],4000,shiny);
 const now=()=>performance.now()/1000,valid=p=>!!(p&&Number(p.dex)===282),mega=p=>/282[_-]mega/.test(String(p.megaKey||p.megaForm||p.anim?.dex||''));
 function state(p){let s=states.get(p);if(!s){const t=now();s={idle:0,nextPose:6+Math.random()*8,nextHappy:t+18+Math.random()*18,happyUntil:0,pose:null,lastScan:-Infinity,near:0,boss:false,worryUntil:0,lastX:p.x,lastY:p.y};states.set(p,s);}return s;}
 function threats(p,s){const t=now();if(t-s.lastScan<.3&&t>=s.lastScan)return;s.lastScan=t;s.near=0;s.boss=false;for(const e of R.EnemyMgr.all()){if(e.dead||e.psAlly||e.dummy||e.friendly||e.psx?.temp==='friendly'||e.psx?.temp==='timid')continue;if(e.psx&&!e.boss&&!e.legend&&e.psx.stance!=='hostile'&&e.psx.pers?.temp!=='aggressive'&&e.psx.combat?.target!==p)continue;if(Math.hypot(e.x-p.x,e.y-p.y)>450)continue;s.near++;if(e.boss||e.legend)s.boss=true;}}
 function darkness(){if(window.PS_CRYSTAL_PEAK?.active()&&window.PS_CRYSTAL_PEAK.model.zone==='cave')return 1;return Number(A.Sky?.darkness?.())||0;}
 function emotion(p){if(!valid(p))return 'Normal';const s=state(p),t=now(),hp=p.maxHp>0?p.hp/p.maxHp:1;threats(p,s);if(p.dead||hp<=.25)return 'Pain';if(hp<=.55)return 'Worried';const danger=s.boss||s.near>=7||darkness()>.65&&s.near>=3;if(danger)s.worryUntil=t+1.4;if(danger||s.near>2&&t<s.worryUntil)return 'Worried';if(s.near<=2&&t<s.happyUntil)return 'Happy';return 'Normal';}
 function cancel(p,s,moving=false){if(s.pose&&p.anim===s.pose.anim&&['Appeal','Pose'].includes(p.anim.cur)){p.anim.once=false;p.anim.done=false;p.anim.hold=false;p.anim.loop(moving?'Walk':'Idle');}s.pose=null;s.idle=0;}
 function gesture(p,name){if(!valid(p)||p!==R.Game.player||p.dead||R.Game.state!=='playing'||p.walking||p.anim?.busy?.()||p.evoAnim||p.evoTo||p.__ascHidden||p.psxBoat)return false;if(p.megaKey&&String(p.anim?.dex)!==String(p.megaKey)||A.Regi?.busy()||A.Trio?.busy()||A.Guardians?.busy())return false;const key=String(p.anim?.dex),clips=data[key];if(!clips)return false;const s=state(p);threats(p,s);if(s.near>0||p.hp/p.maxHp<.6)return false;const chosen=name&&clips.normal[name]?name:clips.normal.Pose&&Math.random()<.45?'Pose':'Appeal';p.anim.loop('Idle');p.anim.play(chosen,{speed:chosen==='Pose'?.35:.7});s.pose={anim:p.anim,name:chosen};s.idle=0;s.nextPose=12+Math.random()*16;s.happyUntil=now()+1.4;return true;}
 function tick(p,dt){if(!p)return;if(!valid(p)||p!==R.Game.player||R.Game.state!=='playing'||p.dead){const s=states.get(p);if(s?.pose)cancel(p,s);return;}const s=state(p),t=now();threats(p,s);const moving=p.walking||Math.hypot(p.x-s.lastX,p.y-s.lastY)>.15;s.lastX=p.x;s.lastY=p.y;const busy=!!(p.evoAnim||p.evoTo||p.__ascHidden||p.psxBoat||A.Regi?.busy()||A.Trio?.busy()||A.Guardians?.busy()||A.Birth?.busy());
  if(s.pose&&(moving||busy||s.near>0||p.hp/p.maxHp<.6||p.anim!==s.pose.anim||!['Appeal','Pose'].includes(p.anim.cur))){cancel(p,s,moving);}
  else if(s.pose&&!p.anim.busy())s.pose=null;
  if(t>=s.nextHappy){s.nextHappy=t+20+Math.random()*20;if(s.near<=2&&p.hp/p.maxHp>.7)s.happyUntil=t+1.6;}
  if(moving||busy||s.near>0||p.anim?.busy?.()){s.idle=0;return;}s.idle+=Math.max(0,Math.min(.2,Number(dt)||0));if(s.idle>=s.nextPose)gesture(p);
 }
 const update=R.Player.prototype.update;R.Player.prototype.update=function(dt,...a){const result=update.call(this,dt,...a);tick(this,dt);return result;};
 const dir='assets/ui/gardevoir-emotions/';
 function face(p,expression=emotion(p)){const shiny=!!(p.shiny||p.anim?.shiny),isMega=mega(p);if(shiny&&(isMega||expression!=='Pain')){const cell={Normal:[0,0],Happy:[1,0],Pain:[2,0],Worried:[4,0]}[expression]||[0,0];return {src:dir+(isMega?'mega':'base')+'-shiny-sheet.png',rect:[cell[0]*40,cell[1]*40,40,40]};}return {src:dir+(isMega?'mega-normal':shiny?'base-shiny':'base-normal')+'-'+expression.toLowerCase()+'.png',rect:[0,0,40,40]};}
 function image(src){let im=images.get(src);if(!im){im=new Image();im.src=src;images.set(src,im);}return im;}
 function drawPortrait(ctx,p,x,y,size,alpha=1){if(!valid(p))return false;const f=face(p),im=image(f.src);if(!im.complete||!im.naturalWidth)return false;ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,...f.rect,Math.round(x),Math.round(y),size,size);ctx.restore();return true;}
 for(const prefix of ['base-normal','base-shiny','mega-normal'])for(const mood of ['normal','happy','pain','worried'])image(dir+prefix+'-'+mood+'.png');for(const kind of ['base','mega'])image(dir+kind+'-shiny-sheet.png');
 const hud=window.PS_PORTRAITS.drawHud;window.PS_PORTRAITS.drawHud=function(ctx,p,x,y,size){return drawPortrait(ctx,p,x,y,size)||hud.apply(this,arguments);};
 function manualPose(){const p=R.Game.player;if(!valid(p)||R.Game.state!=='playing')return false;const ok=gesture(p,mega(p)?'Appeal':'Pose');state(p).manual={ok,at:now(),clip:p.anim.cur};if(!ok)R.UI?.toast?.('Stand still in a calm spot to pose.',1600);return ok;}
 addEventListener('keydown',e=>{if(e.code!=='KeyM'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')||e.target?.isContentEditable||!valid(R.Game.player)||R.Game.state!=='playing')return;e.preventDefault();e.stopImmediatePropagation();manualPose();},true);
 window.PS_GARDEVOIR_EXPRESSIONS={emotion,face,drawPortrait,gesture,manualPose,tick,state,valid};
})();
