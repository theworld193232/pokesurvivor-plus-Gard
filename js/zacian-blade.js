/* Zacian's sword art: bounded real hit geometry, native damage pipeline, original pixel VFX. */
(() => {
 'use strict';const F=window.PS_FX;if(!F?.styles)return;
 const B=()=>window.PS_MEGA_BRIDGE_V5,TAU=Math.PI*2;
 const enemies=()=>B()?.enemies?.all?.()||[];
 function blocked(ax,ay,bx,by){const W=B()?.world;if(!W?.isWall)return false;const d=Math.hypot(bx-ax,by-ay);for(let n=8;n<d;n+=8)if(W.isWall(ax+(bx-ax)*n/d,ay+(by-ay)*n/d))return true;return false;}
 function distance(e,s){const dx=s.bx-s.ax,dy=s.by-s.ay,l=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((e.x-s.ax)*dx+(e.y-s.ay)*dy)/l));return Math.hypot(e.x-s.ax-dx*u,e.y-s.ay-dy*u);}
 function hide(c,on){const p=c.player;if(!p)return;if(on&&!c.hidden&&typeof p.draw==='function'){if(!p.__ascDraw){const draw=p.draw;p.__ascDraw=true;p.draw=function(){if(this.__ascHidden>0)return;return draw.apply(this,arguments);};}p.__ascHidden=(p.__ascHidden||0)+1;c.hidden=true;}else if(!on&&c.hidden){p.__ascHidden=Math.max(0,(p.__ascHidden||0)-1);c.hidden=false;}}
 function damage(c,e,mult){if(c.ghost||!c.hit||e.dead)return;const p=c.player,dmg=(Number(c.move.dmg)||38)*(Number(p.atk)||1)*mult;
  c.hit(p,e,dmg,'#8feeff',e.x-p.x||.01,e.y-p.y,Number(c.move.knock)||65,c.move);
 }
 function strike(c,s){if(c.ghost)return;for(const e of enemies()){if(!e||e.dead||typeof e.hurt!=='function')continue;const near=Math.hypot(e.x-c.player.x,e.y-c.player.y)<=72+(Number(e.r)||10);if((distance(e,s)>(c.width/2+(Number(e.r)||10))&&!near)||blocked(c.player.x,c.player.y,e.x,e.y))continue;damage(c,e,c.evolved?.32:1);}
  // Use native destructible-prop rules; entrances and scenery marked indestructible stay intact.
  const W=B()?.world;if(W?.propsInCircle&&W.damageProp){const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,rr=Math.hypot(s.bx-s.ax,s.by-s.ay)/2+c.width;
   for(const q of W.propsInCircle(mx,my,rr)||[])if(q?.destructible&&q.hp>0&&distance(q,s)<c.width/2+(q.r||10)&&!blocked(s.ax,s.ay,q.x,q.y))W.damageProp(q,Math.max(1,(Number(c.move.dmg)||38)*.32),'#8feeff');}
 }
 function dash(c){if(c.ghost||c.dashBlocked)return;const p=c.player,W=B()?.world,u=Math.max(0,Math.min(1,(c.t-.5)/.16)),delta=(u-(c.dashProgress||0))*105;c.dashProgress=u;
  for(let left=delta;left>0;left-=4){const step=Math.min(4,left),ox=p.x,oy=p.y,nx=ox+Math.cos(c.aim)*step,ny=oy+Math.sin(c.aim)*step,r=Math.max(5,Number(p.r)||10);
   if([[nx,ny],[nx-r,ny],[nx+r,ny],[nx,ny-r],[nx,ny+r]].some(([x,y])=>W?.isWall?.(x,y))){c.dashBlocked=true;break;}
   p.x=nx;p.y=ny;W?.collide?.(p);const moved=Math.hypot(p.x-ox,p.y-oy);if(!Number.isFinite(moved)||moved>step+1){p.x=ox;p.y=oy;c.dashBlocked=true;break;}if(moved<step*.3){c.dashBlocked=true;break;}
  }
 }
 function burst(c){if(c.ghost)return;for(const e of enemies())if(e&&!e.dead&&typeof e.hurt==='function'&&Math.hypot(e.x-c.tx,e.y-c.ty)<c.blast+(e.r||10)&&!blocked(c.tx,c.ty,e.x,e.y))damage(c,e,.8);}
 function shape(g,pts,col){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=col;g.fill();}
 const style={
  cast(c){const p=c.player;if(Number(p?.dex)!==888||p.dead||p.__crownedScene)return null;
   c.evolved=!!c.move.behemothEvolved&&p.megaKey==='888_crowned';c.key=p.megaKey||null;c.ox=p.x;c.oy=p.y;c.range=Math.min(390,Math.max(80,Number(c.move.radius)||270));c.width=Math.min(66,Number(c.move.width)||48);c.blast=82;c.slashes=[];c.next=0;
   let target=null,bd=c.range;for(const e of enemies()){if(!e||e.dead||e.harmless||e.friendly||e.__friendly)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd&&!blocked(p.x,p.y,e.x,e.y)){target=e;bd=d;}}
   const a=target?Math.atan2(target.y-p.y,target.x-p.x):Number(p.aim)||0,d=target?Math.min(c.range,bd):c.range*.65;c.tx=p.x+Math.cos(a)*d;c.ty=p.y+Math.sin(a)*d;
   if(blocked(p.x,p.y,c.tx,c.ty))return null;
   const n=c.evolved?6:1;for(let i=0;i<n;i++){const ang=c.evolved?a+(i%2?-.85:.85)+(i>>1)*.38:a,len=c.evolved?Math.min(210,c.range*.62):c.range;
    const cx=c.evolved?c.tx:p.x+Math.cos(a)*len/2,cy=c.evolved?c.ty:p.y+Math.sin(a)*len/2;
    let ax=cx-Math.cos(ang)*len/2,ay=cy-Math.sin(ang)*len/2,bx=cx+Math.cos(ang)*len/2,by=cy+Math.sin(ang)*len/2;
    // Trim each blade at terrain instead of damaging through a cave wall.
    for(let j=0;j<=32;j++){const u=j/32,x=ax+(bx-ax)*u,y=ay+(by-ay)*u;if(B()?.world?.isWall?.(x,y)){if(j===0){ax=cx;ay=cy;}else{bx=x;by=y;}break;}}
    c.slashes.push({ax,ay,bx,by,at:.16+i*.105});}
   c.aim=a;c.flightAnim=p.anim;c.air=.84;c.flightAnim?.play?.('Charge');for(const sl of c.slashes)sl.at+=.54;c.burstAt=.70+n*.105+.1;c.duration=c.evolved?c.burstAt+.65:1.15;if(!c.ghost)hide(c,true);return c;
  },
  update(c,dt){const p=c.player;if(!p||p.dead||Number(p.dex)!==888||p!==B()?.game?.player||(p.megaKey||null)!==c.key){hide(c,false);return false;}
   c.t+=Math.max(0,Math.min(.1,Number(dt)||0));dash(c);if(c.t>.5&&!c.launched){c.launched=true;c.flightAnim?.play?.('Attack');}if(c.t>=c.air)hide(c,false);while(c.next<c.slashes.length&&c.t>=c.slashes[c.next].at)strike(c,c.slashes[c.next++]);
   if(c.evolved&&!c.burstDone&&c.t>=c.burstAt){c.burstDone=true;burst(c);try{B()?.camera?.kick?.(.06);}catch(_){}}
   return c.t<c.duration;
  },
  draw(c,g,v){const k=v.k,lift=Number(B()?.lift)||18;g.save();g.imageSmoothingEnabled=false;
   // Reference sequence: raised blade charge, rising leap, sword-first descent, luminous cleave.
   if(c.t<c.air&&c.flightAnim?.draw){const u=c.t/c.air,arc=Math.sin(Math.PI*u),launch=Math.max(0,Math.min(1,(u-.5)/.35)),forward=arc*(20+launch*45),px=c.player.x+Math.cos(c.aim)*forward,py=c.player.y+Math.sin(c.aim)*forward,up=arc*90;
    g.save();g.globalAlpha=.3;g.fillStyle='#102943';g.beginPath();g.ellipse(v.sx(c.player.x),v.sy(c.player.y),22*k*(1-arc*.3),8*k,0,0,TAU);g.fill();g.restore();
    for(let j=3;j>=0;j--){g.save();g.globalAlpha=j?(.2-j*.035):1;g.translate(v.sx(px-Math.cos(c.aim)*j*16),v.sy(py)-up*k+j*5*k);g.scale(k,k);g.shadowColor='#6eeaff';g.shadowBlur=j?15:10;c.flightAnim.draw(g,0,0);g.restore();}
    const x=v.sx(px),y=v.sy(py)-up*k-(Number(c.player.bodyH)||60)*.4*k,charge=Math.min(1,u/.5),L=(35+charge*155)*k,angle=c.aim-(1-launch)*.9;
    g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=Math.min(1,u*6);g.shadowColor='#54d9ff';g.shadowBlur=(12+charge*14)*k;
    shape(g,[[0,-10*k],[L,0],[0,10*k],[35*k,0]],'#329cff');shape(g,[[5*k,-6*k],[L,0],[5*k,6*k],[25*k,0]],'#83f3ff');shape(g,[[12*k,-2*k],[L,0],[12*k,2*k]],'#ffffff');
    // Gathering star points and curling light along the lengthening blade.
    for(let j=0;j<9;j++){const q=(c.t*1.8+j/9)%1,bx=L*(1-q),by=Math.sin(c.t*14+j*2)*18*k*(1-q);g.fillStyle=j%3?'#c9ffff':'#ffc5ee';g.fillRect(bx,by,2*k,2*k);}
    g.strokeStyle='#b8fcff';g.lineWidth=2*k;g.beginPath();g.ellipse(L*.4,0,L*.35,16*k,c.t*4,0,Math.PI*1.6);g.stroke();g.restore();
    if(launch>0){g.save();g.translate(x,y);g.rotate(c.aim);g.globalAlpha=Math.sin(launch*Math.PI)*.7;g.strokeStyle='#d9ffff';g.lineWidth=7*k;g.shadowColor='#38aaff';g.shadowBlur=18*k;g.beginPath();g.arc(0,0,115*k,-1.1+launch,.8+launch);g.stroke();g.restore();}
   }
   for(const s of c.slashes){const u=(c.t-s.at)/.32;if(u<0||u>1)continue;const ax=v.sx(s.ax),ay=v.sy(s.ay-lift),bx=v.sx(s.bx),by=v.sy(s.by-lift),L=Math.hypot(bx-ax,by-ay),a=Math.atan2(by-ay,bx-ax),q=Math.min(1,u*5),w=(1-u)*c.width*k*.32;
    g.save();g.translate(ax,ay);g.rotate(a);g.globalAlpha=(1-u)*.85;g.shadowColor='#348fff';g.shadowBlur=12*k;
    shape(g,[[0,0],[L*q*.4,-w],[L*q,0],[L*q*.55,w]],'#328bff');shape(g,[[0,0],[L*q*.5,-w*.4],[L*q,0],[L*q*.6,w*.4]],'#eeffff');
    g.fillStyle='#ffe8a0';for(let j=0;j<5;j++)g.fillRect(L*q*(j/5),Math.sin(j*3+c.t*12)*w*1.5,2*k,2*k);g.restore();}
   if(c.evolved&&c.burstDone){const u=(c.t-c.burstAt)/.65,r=c.blast*k*Math.max(0,u),x=v.sx(c.tx),y=v.sy(c.ty-lift);g.globalAlpha=Math.max(0,1-u);g.shadowColor='#70dfff';g.shadowBlur=16*k;g.strokeStyle='#b7f7ff';g.lineWidth=Math.max(1,(1-u)*5*k);g.beginPath();g.arc(x,y,r,0,TAU);g.stroke();
    for(let j=0;j<12;j++){const a=j*TAU/12,L=r*(j%2?1:1.35),w=(1-u)*6*k;g.save();g.translate(x,y);g.rotate(a);shape(g,[[L*.25,-w],[L,0],[L*.25,w]],j%3?'#c4faff':'#ffe69b');g.restore();}}
   g.restore();
  },dispose(c){hide(c,false);}
 };
 F.styles.behemoth=style;window.PS_ZACIAN_BLADE={style,blocked,damageBudget:{base:1,evolvedSlashes:6,perSlash:.32,burst:.8,total:2.72}};
})();
