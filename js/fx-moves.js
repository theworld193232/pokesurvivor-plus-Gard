// =====================================================================
//  CUSTOM MOVE EFFECTS v2 (legendary signature moves + remade Mega moves)
//  Loaded before mega-native.js. Uses the GAME'S OWN assets wherever possible:
//   - VFX sprites (fire, drop, bubble, leaf, bolt, shard, rock, star, crescent, note, heart, shadow ...)
//   - FX effects (lightning strikes/zaps, slashes, rings, bursts, sprite particles, game beam flash)
//   - Z-move pieces: the Z Asteroid falling field, Z tornadoes, Fire/Toxic Z ground fields
//  plus custom-drawn glows. All damage goes through the game's own hit function.
//
//  A move uses a style with psCast:'<style>' and fx:{...} (see js/legend-moves.js).
//  Styles: beam rift lances void spikes shock comet vortex geyser orbs dash
// =====================================================================
(function(){
 const B=()=>window.PS_MEGA_BRIDGE_V5;
 const live=[];
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const TAU=Math.PI*2;
 const FX=()=>B()?.fx,VFX=()=>B()?.vfx;
 function enemies(){const E=B()?.enemies;return E&&typeof E.all==='function'?E.all().filter(e=>e&&!e.dead&&typeof e.hurt==='function'):[];}
 function nearest(x,y,maxD,list){let best=null,bd=maxD*maxD;for(const e of list||enemies()){const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e;}}return best;}
 function densest(p,range,avoid){
   const all=enemies(),near=all.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<range);let best=null,bs=-1;
   for(const c of near){if(avoid&&avoid.some(a=>Math.hypot(a.x-c.x,a.y-c.y)<120))continue;
     let s=0;for(const o of all)if(Math.hypot(o.x-c.x,o.y-c.y)<130)s++;s-=Math.hypot(c.x-p.x,c.y-p.y)/1000;if(s>bs){bs=s;best=c;}}
   return best;
 }
 function kick(v){try{window.__psFullKick=true;B()?.camera?.kick?.(v);}catch(e){}finally{window.__psFullKick=false;}}   // our effects always shake at full strength
 function typeColor(c){return c.fx.color||(c.fx.colors&&c.fx.colors[1])||'#ffffff';}
 // Where the move comes out of: the Pokemon's mouth / front, at head height, in its aim direction.
 function mouth(p,aim){
   const r=Number(p.r)||16,lift=Number(B()?.lift)||18,h=Math.max(lift,(Number(p.bodyH)||40)*0.62);
   return {x:p.x+Math.cos(aim)*r*0.9,y:p.y-h+Math.sin(aim)*r*0.45};
 }
 function wallClip(x,y,ang,len){const W=B()?.world;if(!W||typeof W.isWall!=='function')return len;const c=Math.cos(ang),s=Math.sin(ang);for(let d=12;d<len;d+=12)if(W.isWall(x+c*d,y+s*d))return d;return len;}
 function baseDmg(c,mult){return (Number(c.move.dmg)||10)*(Number(c.player.atk)||1)*(mult||1)*(c.fx.mult||1);}
 function applyHit(c,e,dmg,opts,dx,dy){
   try{c.hit(c.player,e,dmg,c.fx.color||typeColor(c),dx||0.01,dy||0,opts.knock==null?(c.move.knock||60):opts.knock,c.move);}catch(err){console.warn('fx hit',err);}
   const st=opts.stun||c.fx.stun;if(st&&Math.random()<st.chance&&typeof e.applyStun==='function')e.applyStun(st.dur||0.8);
   const sl=opts.slow||c.fx.slow;if(sl&&typeof e.applySlow==='function')e.applySlow(sl,opts.slowDur||1.4);
   if((opts.burn||c.fx.burn)&&typeof e.applyBurn==='function')e.applyBurn(1);
   if((opts.poison||c.fx.poison)&&typeof e.applyPoison==='function')e.applyPoison(1);
 }
 // break chests / rocks / grass like the game's own attacks do (big:true also bursts big chests open)
 function hitProps(c,x,y,r,dmg,big,once){const Wd=B()?.world;if(c.ghost||!Wd||typeof Wd.propsInCircle!=='function')return;
   try{const list=Wd.propsInCircle(x,y,r+16);if(big&&typeof Wd.specialsNear==='function')for(const q of Wd.specialsNear(x,y,r+16))if(q&&q.type==='bigchest')list.push(q);
     for(const q of list){if(!q||Math.hypot(q.x-x,q.y-y)>r+(q.r||12))continue;if(once){if(once.has(q))continue;once.add(q);}
     if(q.type==='bigchest'){if(big&&!q.hoopaOpened&&typeof Wd.breakProp==='function'){q.hoopaOpened=true;Wd.breakProp(q);}continue;}
     if(q.destructible&&q.hp>0&&typeof Wd.damageProp==='function')Wd.damageProp(q,Math.max(1,dmg),c.fx.color||'#ffffff');}}catch(e){}}
 function hitCircle(c,x,y,r,opts={}){
   if(c.ghost||typeof c.hit!=='function')return 0;let n=0;const dmg=baseDmg(c,opts.mult);
   if(!opts.noProps)hitProps(c,x,y,r,dmg,opts.bigProps||c.fx.bigProps);
   for(const e of enemies()){const dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy>(r+(e.r||10))**2)continue;if(opts.skip&&opts.skip.has(e))continue;opts.skip&&opts.skip.add(e);applyHit(c,e,dmg,opts,dx,dy);n++;}
   return n;
 }
 function segDist(px,py,ax,ay,bx,by){const vx=bx-ax,vy=by-ay,l=vx*vx+vy*vy||1;let t=((px-ax)*vx+(py-ay)*vy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+vx*t),py-(ay+vy*t));}
 // returns the distance along the line of the farthest foe hit (or -1)
 function hitLine(c,ax,ay,bx,by,w,opts={}){
   if(c.ghost||typeof c.hit!=='function')return -1;const dmg=baseDmg(c,opts.mult);let far=-1;
   const nx=bx-ax,ny=by-ay,l=Math.hypot(nx,ny)||1;
   for(const e of enemies()){if(opts.skip&&opts.skip.has(e))continue;if(segDist(e.x,e.y,ax,ay,bx,by)>w/2+(e.r||10))continue;opts.skip&&opts.skip.add(e);
     applyHit(c,e,dmg,opts,nx/l,ny/l);const along=((e.x-ax)*nx+(e.y-ay)*ny)/l;if(along>far)far=along;}
   return far;
 }
 function glow(ctx,x,y,r,c0,c1){const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,c0);g.addColorStop(1,c1||'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,Math.max(1,r),0,TAU);ctx.fill();}
 function rgba(hex,a){const n=parseInt((hex||'#ffffff').slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';}
 // draw a GAME sprite on the overlay (shape from the game's VFX library, tinted with a game palette)
 function sprite(ctx,shape,pal,X,Y,scale,angle,frame,alpha){const V=VFX();if(!V||typeof V.draw!=='function')return;try{V.draw(ctx,shape,pal||'normal',X,Y,{scale,angle:angle||0,frame:frame||0,alpha:alpha==null?1:alpha});}catch(e){}}
 function frames(shape){try{return VFX().frames(shape)||1;}catch(e){return 1;}}
 // engine particles (drawn by the game itself, in world space)
 function sp(shape,pal,x,y,o){try{FX().sp(shape,pal,x,y,o||{});}catch(e){}}
 function ring(x,y,r0,r1,col,life,w){try{FX().ring(x,y,r0,r1,col,life||0.4,w||4);}catch(e){}}
 function burst(x,y,col,n,spd){try{FX().burst(x,y,col,n||12,spd||140);}catch(e){}}
 // ---- custom drawn pieces (Ultra Beasts etc.)
 function drawJaw(ctx,X,Y,w,h,up,body){ // one jaw (up=true: upper jaw, teeth pointing down)
   const s=up?-1:1;ctx.fillStyle=body||'#2a0a24';ctx.beginPath();ctx.ellipse(X,Y,w,h,0,up?Math.PI:0,up?TAU:Math.PI);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#c8325a';ctx.lineWidth=Math.max(2,h*0.12);ctx.beginPath();ctx.moveTo(X-w,Y);ctx.lineTo(X+w,Y);ctx.stroke();
   ctx.fillStyle='#fff8ec';const n=8,tw=w*2/n;for(let i=0;i<n;i++){const tx=X-w+tw*(i+0.5),edge=Math.sqrt(Math.max(0,1-((tx-X)/w)**2)),th=h*0.45*(0.6+0.4*edge);
     ctx.beginPath();ctx.moveTo(tx-tw*0.42,Y);ctx.lineTo(tx+tw*0.42,Y);ctx.lineTo(tx,Y-s*th);ctx.closePath();ctx.fill();}}
 function drawRocket(ctx,X,Y,ang,L,t){ctx.save();ctx.translate(X,Y);ctx.rotate(ang);const W=L*0.28;
   for(let i=0;i<3;i++){const fl=L*(0.55+0.25*Math.sin(t*50+i*2));const g=ctx.createLinearGradient(-L*0.5,0,-L*0.5-fl,0);g.addColorStop(0,'rgba(255,240,180,0.95)');g.addColorStop(0.4,'rgba(255,140,40,0.8)');g.addColorStop(1,'rgba(255,60,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-L*0.5,-W*0.4);ctx.lineTo(-L*0.5-fl,0);ctx.lineTo(-L*0.5,W*0.4);ctx.fill();}
   ctx.fillStyle='#6e8296';ctx.beginPath();ctx.moveTo(-L*0.42,-W*0.5);ctx.lineTo(-L*0.62,-W*1.05);ctx.lineTo(-L*0.2,-W*0.5);ctx.fill();ctx.beginPath();ctx.moveTo(-L*0.42,W*0.5);ctx.lineTo(-L*0.62,W*1.05);ctx.lineTo(-L*0.2,W*0.5);ctx.fill();
   const b=ctx.createLinearGradient(0,-W/2,0,W/2);b.addColorStop(0,'#f4f8fc');b.addColorStop(0.5,'#b8c6d4');b.addColorStop(1,'#6e8296');ctx.fillStyle=b;ctx.fillRect(-L*0.5,-W/2,L*0.72,W);
   ctx.beginPath();ctx.moveTo(L*0.22,-W/2);ctx.quadraticCurveTo(L*0.5,0,L*0.22,W/2);ctx.fill();ctx.fillStyle='#3cb84a';ctx.fillRect(-L*0.1,-W/2,L*0.08,W);ctx.restore();}
 function drawBlock(ctx,x,y,w,h,shade){ctx.fillStyle=shade||'#8e8a84';ctx.fillRect(x-w/2,y-h,w,h);ctx.fillStyle='rgba(255,255,255,0.28)';ctx.fillRect(x-w/2,y-h,w,h*0.22);ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+w*0.3,y-h,w*0.2,h);
   ctx.strokeStyle='#3a3632';ctx.lineWidth=2;ctx.strokeRect(x-w/2,y-h,w,h);ctx.fillStyle='#ff3c3c';ctx.beginPath();ctx.arc(x-w*0.1,y-h*0.55,Math.max(1.5,w*0.08),0,TAU);ctx.fill();}
 // draw a real Pokemon sprite frame on the overlay (used for afterimages and summoned allies)
 const pokeImgs={};
 function pokeSprite(ctx,dex,anim,ang,t,X,Y,scale,alpha,comp){const M=B()?.spriteMeta?.[String(dex)],a=M&&M.a&&(M.a[anim]||M.a.Idle);if(!a)return false;
   const key=dex+'/'+(M.a[anim]?anim:'Idle');let img=pokeImgs[key];if(!img){img=new Image();img.src='assets/pokemon/'+key+'.png';pokeImgs[key]=img;}if(!img.complete||!img.naturalWidth)return false;
   const n=a.n||1,dur=(a.d||[]).reduce((x,y)=>x+y,0)||n*4;let tick=Math.floor(t*60)%dur,f=0;if(a.d){for(let i=0;i<n;i++){tick-=a.d[i];if(tick<0){f=i;break;}}}else f=Math.floor(t*8)%n;
   const dir=B()?.sprites?.dirFromAngle?B().sprites.dirFromAngle(ang):0,row=Math.min((a.r||1)-1,dir),k=scale;
   ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha==null?1:alpha;if(comp)ctx.globalCompositeOperation=comp;
   ctx.drawImage(img,f*a.w,row*a.h,a.w,a.h,X-a.ax*k,Y-a.ay*k,a.w*k,a.h*k);ctx.restore();return true;}
 const spikeImg=new Image();spikeImg.src='assets/fx/precipice-spikes.png?v=1';
 const S={};

 // ---------------------------------------------------------------- BEAM (fired from the mouth, follows your aim)
 S.beam={cast(c){const p=c.player;c.aim=Number(p.aim)||0;c.dur=c.fx.dur||1.1;c.charge=c.fx.charge||0.25;c.tickT=0;c.parts=[];c.w=c.fx.width||64;c.len=Number(c.move.radius)||480;c.far=-1;c.child=null;return c;},
   update(c,dt){c.t+=dt;const p=c.player;
     // turn toward the Pokemon's current aim (like the game's Z beam), max 3 rad/s
     const target=Number(p.aim)||c.aim,diff=Math.atan2(Math.sin(target-c.aim),Math.cos(target-c.aim));c.aim+=Math.max(-3*dt,Math.min(3*dt,diff));
     const m=mouth(p,c.aim);c.x=m.x;c.y=m.y;c.L=wallClip(p.x,p.y,c.aim,c.len);
     // the beam leaves the mouth and angles down to land on the ground line it actually hits
     const lift=Number(B()?.lift)||18,ex=p.x+Math.cos(c.aim)*c.L,ey=p.y-lift+Math.sin(c.aim)*c.L;c.va=Math.atan2(ey-c.y,ex-c.x);c.VL=Math.hypot(ex-c.x,ey-c.y);
     if(c.t<c.charge){if(c.parts.length<40)for(let i=0;i<3;i++)c.parts.push({a:rnd(0,TAU),r:rnd(40,90)});for(const q of c.parts)q.r-=170*dt;c.parts=c.parts.filter(q=>q.r>3);return true;}
     if(!c.started){c.started=1;kick(0.08);}
     const live=c.t<c.charge+c.dur;
     c.tickT-=dt;if(c.tickT<=0&&live){c.tickT=c.fx.tick||0.2;const bx=c.x+Math.cos(c.aim)*c.L,by=c.y+Math.sin(c.aim)*c.L;
       const f=hitLine(c,p.x,p.y,p.x+Math.cos(c.aim)*c.L,p.y+Math.sin(c.aim)*c.L,c.w,{knock:30});if(f>0)c.far=f;
       try{FX().beam(c.x,c.y,c.va,c.VL,c.w*0.55,typeColor(c),{beam:c.fx.beamShape||null,pal:c.fx.pal||c.move.type});}catch(e){}}
     // Roar of Time-style rebound: a big aura bursts from where the beam hit
     if(!live&&c.fx.rebound&&!c.reb){c.reb=1;const d=c.far>0?Math.min(c.far,c.L):c.L,rx=p.x+Math.cos(c.aim)*d,ry=p.y+Math.sin(c.aim)*d,R=c.fx.rebound.radius||170;
       c.rebX=rx;c.rebY=ry;c.rebT=c.t;hitCircle(c,rx,ry,R,{mult:c.fx.rebound.mult||1.5,knock:120,slow:c.fx.rebound.slow||0.55,slowDur:2.2,stun:c.fx.rebound.stun});ring(rx,ry,10,R,c.fx.colors?c.fx.colors[1]:'#8ff0ff',0.6,6);kick(0.12);}
     return c.t<c.charge+c.dur+(c.fx.rebound?1.1:0.25);},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#8fd3ff','#2a6cff'],k=v.k,X=v.sx(c.x),Y=v.sy(c.y);
     if(c.t<c.charge){for(const q of c.parts){ctx.fillStyle=col[1];ctx.fillRect(X+Math.cos(q.a)*q.r*k,Y+Math.sin(q.a)*q.r*k,3,3);}
       glow(ctx,X,Y,(8+26*c.t/c.charge)*k,rgba(col[0],0.95),rgba(col[1],0));sprite(ctx,'ball',c.fx.pal||c.move.type,X,Y,0.6+1.4*c.t/c.charge,0,0,0.9);return;}
     const u=c.t-c.charge;
     if(u<c.dur+0.25){const fade=u>c.dur?Math.max(0,1-(u-c.dur)/0.25):Math.min(1,u/0.08),L=(c.VL||c.L||c.len)*k,W=c.w*k*(0.85+0.15*Math.sin(u*40));
       ctx.save();ctx.translate(X,Y);ctx.rotate(c.va==null?c.aim:c.va);ctx.globalAlpha=fade;
       if(c.fx.dark){let g=ctx.createLinearGradient(0,-W*1.15,0,W*1.15);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(0.5,'rgba(10,0,0,0.85)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,-W*1.15,L,W*2.3);}
       ctx.globalCompositeOperation='lighter';
       let g=ctx.createLinearGradient(0,-W,0,W);g.addColorStop(0,rgba(col[2],0));g.addColorStop(0.5,rgba(col[2],0.55));g.addColorStop(1,rgba(col[2],0));ctx.fillStyle=g;ctx.fillRect(0,-W,L,W*2);
       g=ctx.createLinearGradient(0,-W*0.5,0,W*0.5);g.addColorStop(0,rgba(col[1],0));g.addColorStop(0.5,rgba(col[1],0.9));g.addColorStop(1,rgba(col[1],0));ctx.fillStyle=g;ctx.fillRect(0,-W*0.5,L,W);
       ctx.fillStyle=rgba(col[0],0.95);ctx.fillRect(0,-W*0.13,L,W*0.26);
       const deco=c.fx.deco;
       for(let i=0;i<6;i++){const d=((u*c.len*1.6+i*c.len/6)%c.len)*k;if(d>L)continue;
         if(deco==='clock'){ctx.strokeStyle=rgba(col[0],0.8);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(d,0,W*0.25,W*0.95,0,0,TAU);ctx.stroke();
           for(let j=0;j<12;j++){const a=j/12*TAU;ctx.beginPath();ctx.moveTo(d+Math.cos(a)*W*0.18,Math.sin(a)*W*0.8);ctx.lineTo(d+Math.cos(a)*W*0.25,Math.sin(a)*W*0.95);ctx.stroke();}}
         else if(deco==='feather'){sprite(ctx,'wind',c.fx.pal||'flying',d,Math.sin(u*9+i)*W*0.6,1.6*k,0.3);}
         else if(deco==='rainbow'){ctx.strokeStyle='hsla('+((u*300+i*60)%360)+',100%,70%,0.8)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(d,0,W*0.2,W*0.9,0,0,TAU);ctx.stroke();}
         else if(deco==='shards'||deco==='bubbles'){sprite(ctx,deco==='shards'?'shard':'bubble',c.fx.pal||c.move.type,d,Math.sin(u*7+i*2)*W*0.55,1.4*k,c.va||c.aim,i);}
         else {ctx.strokeStyle=rgba(col[0],0.55);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(d,0,W*0.18,W*0.8,0,0,TAU);ctx.stroke();}}
       glow(ctx,0,0,W*1.1,rgba(col[0],0.95),rgba(col[1],0));glow(ctx,L,0,W*1.2,rgba(col[0],0.85),rgba(col[2],0));
       ctx.restore();}
     if(c.reb){const w=c.t-c.rebT,R=(c.fx.rebound.radius||170)*k,q=Math.min(1,w/0.3),fade=Math.max(0,1-Math.max(0,w-0.35)/0.75),RX=v.sx(c.rebX),RY=v.sy(c.rebY);
       ctx.save();ctx.globalAlpha=fade;
       const g=ctx.createRadialGradient(RX,RY,0,RX,RY,R*q);g.addColorStop(0,rgba(col[0],0.55));g.addColorStop(0.6,rgba(col[1],0.3));g.addColorStop(1,rgba(col[2],0.05));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(RX,RY,R*q,R*q*0.62,0,0,TAU);ctx.fill();
       ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba(col[1],0.95);ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(RX,RY,R*q,R*q*0.62,0,0,TAU);ctx.stroke();
       if(c.fx.deco==='clock'){ // a clock face spinning backwards = time distortion
         ctx.strokeStyle=rgba(col[0],0.9);ctx.lineWidth=2;const cr=R*q*0.55;ctx.beginPath();ctx.ellipse(RX,RY,cr,cr*0.62,0,0,TAU);ctx.stroke();
         for(let j=0;j<12;j++){const a=j/12*TAU;ctx.beginPath();ctx.moveTo(RX+Math.cos(a)*cr*0.85,RY+Math.sin(a)*cr*0.62*0.85);ctx.lineTo(RX+Math.cos(a)*cr,RY+Math.sin(a)*cr*0.62);ctx.stroke();}
         const h1=-w*9,h2=-w*2.2;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(RX,RY);ctx.lineTo(RX+Math.cos(h1)*cr*0.8,RY+Math.sin(h1)*cr*0.5);ctx.stroke();ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(RX,RY);ctx.lineTo(RX+Math.cos(h2)*cr*0.5,RY+Math.sin(h2)*cr*0.31);ctx.stroke();}
       for(let j=0;j<3;j++){const rr=R*Math.min(1,q+j*0.18)*(1+w*0.3);ctx.strokeStyle=rgba(col[2],0.5*fade);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(RX,RY,rr,rr*0.62,0,0,TAU);ctx.stroke();}
       ctx.restore();}}};

 // ---------------------------------------------------------------- RIFT (space-tearing slashes + the game's slash arcs)
 S.rift={cast(c){const t=densest(c.player,(c.move.radius||300)+60)||nearest(c.player.x,c.player.y,500);if(!t)return null;
     c.cx=t.x;c.cy=t.y;c.n=Math.max(1,Math.round(c.move.count||3));c.slashes=[];const base=rnd(0,Math.PI);
     for(let i=0;i<c.n;i++)c.slashes.push({a:base+i*Math.PI/c.n+rnd(-0.2,0.2),ox:rnd(-40,40),oy:rnd(-30,30),at:i*(c.fx.delay||0.11),done:false});
     c.len=c.fx.len||360;c.w=c.fx.width||46;return c;},
   update(c,dt){c.t+=dt;for(const s of c.slashes)if(!s.done&&c.t>=s.at){s.done=true;const x=c.cx+s.ox,y=c.cy+s.oy,dx=Math.cos(s.a)*c.len/2,dy=Math.sin(s.a)*c.len/2;hitLine(c,x-dx,y-dy,x+dx,y+dy,c.w,{knock:90});if(c.fx.paper){c.paper=c.paper||[];for(let j=0;j<9;j++){const f=rnd(-0.5,0.5);c.paper.push({x:x+dx*f*2,y:y+dy*f*2,vx:rnd(-120,120),vy:rnd(-160,-40),r:rnd(0,TAU),vr:rnd(-12,12),s:rnd(5,10),t:0});}}
       try{FX().slash(x,y,s.a,c.len*0.45,0.9,typeColor(c),{pal:c.fx.pal||c.move.type});}catch(e){}kick(0.05);}
     if(c.paper)for(const q of c.paper){q.t+=dt;q.vy+=260*dt;q.vx*=0.98;q.x+=q.vx*dt;q.y+=q.vy*dt*0.6;q.r+=q.vr*dt;}
     return c.t<c.slashes[c.slashes.length-1].at+(c.paper?1.1:0.75);},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff8ad8','#7a2cff'];
     if(c.paper)for(const q of c.paper){const a=Math.max(0,1-q.t/1.0);if(!a)continue;ctx.save();ctx.globalAlpha=a;ctx.translate(v.sx(q.x),v.sy(q.y));ctx.rotate(q.r);const sz=q.s*v.k;ctx.fillStyle='#fbfbf4';ctx.beginPath();ctx.moveTo(-sz,-sz*0.7);ctx.lineTo(sz,-sz*0.2);ctx.lineTo(-sz*0.3,sz);ctx.closePath();ctx.fill();ctx.fillStyle='#d8dccc';ctx.beginPath();ctx.moveTo(-sz,-sz*0.7);ctx.lineTo(-sz*0.3,sz);ctx.lineTo(0,0);ctx.fill();ctx.restore();}
     for(const s of c.slashes){const u=c.t-s.at;if(u<0)continue;const grow=Math.min(1,u/0.07),fade=Math.max(0,1-Math.max(0,u-0.25)/0.5);
       const x=v.sx(c.cx+s.ox),y=v.sy(c.cy+s.oy),L=c.len*v.k*grow/2,W=c.w*v.k;
       ctx.save();ctx.translate(x,y);ctx.rotate(s.a);ctx.globalAlpha=fade;
       if(c.fx.space){ctx.fillStyle='rgba(8,0,24,0.85)';ctx.beginPath();ctx.ellipse(0,0,L,W*0.35*(1-0.5*Math.max(0,u-0.25)),0,0,TAU);ctx.fill();
         for(let j=0;j<8;j++)sprite(ctx,'star','violet',Math.cos(j*1.7)*L*0.8,Math.sin(j*2.3)*W*0.15,0.7*v.k,0,0,0.5+0.5*Math.sin(u*20+j));}
       ctx.globalCompositeOperation='lighter';
       let g=ctx.createLinearGradient(0,-W,0,W);g.addColorStop(0,rgba(col[2],0));g.addColorStop(0.5,rgba(col[2],0.6));g.addColorStop(1,rgba(col[2],0));
       ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,L*1.05,W,0,0,TAU);ctx.fill();
       ctx.fillStyle=rgba(col[1],0.9);ctx.beginPath();ctx.ellipse(0,0,L,W*0.22,0,0,TAU);ctx.fill();
       ctx.fillStyle=rgba(col[0],1);ctx.beginPath();ctx.ellipse(0,0,L*0.95,W*0.07+1,0,0,TAU);ctx.fill();
       ctx.restore();}}};

 // ---------------------------------------------------------------- LANCES (light pillars / REAL game lightning / falling star sprites)
 S.lances={cast(c){const n=Math.max(1,Math.round(c.move.count||6)),R=c.move.radius||280,p=c.player;
     const list=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<R+120).sort(()=>Math.random()-0.5);if(!list.length)return null;
     c.hits=[];for(let i=0;i<n;i++){const e=list[i%list.length];c.hits.push({x:e.x+(i>=list.length?rnd(-50,50):0),y:e.y+(i>=list.length?rnd(-40,40):0),at:(c.fx.delay||0)+i*(c.fx.gap||0.07),fall:c.fx.fall||0.4,done:false});}
     c.r=c.fx.r||58;return c;},
   update(c,dt){c.t+=dt;for(const h of c.hits)if(!h.done&&c.t>=h.at+h.fall){h.done=true;hitCircle(c,h.x,h.y,c.r,{knock:80});kick(0.03);
       const col=typeColor(c);if(c.fx.style==='bolt'){try{FX().strike(h.x,h.y,col);FX().zap(h.x+rnd(-30,30),h.y-420,h.x,h.y,0.12,col,40,2.2);}catch(e){}}
       ring(h.x,h.y,6,c.r*1.2,col,0.4,3);if(c.fx.style==='star')burst(h.x,h.y,col,10,160);}
     return c.t<c.hits[c.hits.length-1].at+c.hits[0].fall+0.6;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ffe27a','#ffb000'],style=c.fx.style||'light';
     for(const h of c.hits){const u=c.t-h.at;if(u<0)continue;const X=v.sx(h.x),Y=v.sy(h.y),R=c.r*v.k;
       if(u<h.fall){const q=u/h.fall;ctx.strokeStyle=rgba(col[1],0.35+0.5*q);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.45,0,0,TAU);ctx.stroke();
         if(style==='star'){const sx=X+(1-q)*220*v.k,sy=Y-(1-q)*620*v.k;glow(ctx,sx,sy,18*v.k,rgba(col[0],0.9),rgba(col[1],0));sprite(ctx,'star',c.fx.pal||'steel',sx,sy,2.2*v.k,0,Math.floor(c.t*12));}continue;}
       const w=u-h.fall,fade=Math.max(0,1-w/0.55);ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       if(style!=='bolt'){const g=ctx.createLinearGradient(X,Y-800*v.k,X,Y);g.addColorStop(0,rgba(col[1],0));g.addColorStop(1,rgba(col[0],0.95));ctx.fillStyle=g;const bw=(style==='star'?14:22)*v.k*(1-w/0.55*0.6);ctx.fillRect(X-bw/2,Y-800*v.k,bw,800*v.k);}
       glow(ctx,X,Y,R*1.3*(0.6+w),rgba(col[0],0.9),rgba(col[2],0));
       ctx.strokeStyle=rgba(col[1],0.9);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X,Y,R*(0.5+w*2),R*(0.5+w*2)*0.45,0,0,TAU);ctx.stroke();ctx.restore();}}};

 // ---------------------------------------------------------------- VOID (pull, ticks, collapse; shadow sprites spiral in)
 S.void={cast(c){const t=densest(c.player,360)||nearest(c.player.x,c.player.y,420);if(!t)return null;
     c.x=t.x;c.y=t.y;c.R=c.move.radius||170;c.pullT=c.fx.pull||1.0;c.life=c.pullT+0.5;c.tick=0;c.parts=[];c.seed=rnd(0,TAU);return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     if(c.t<c.pullT){for(const e of all){const dx=c.x-e.x,dy=c.y-e.y,d=Math.hypot(dx,dy);if(d>c.R||d<6)continue;const pl=(140+240*(1-d/c.R))*(e.boss?0.3:1)*dt;e.x+=dx/d*Math.min(pl,d-6);e.y+=dy/d*Math.min(pl,d-6);}
       c.tick-=dt;if(c.tick<=0){c.tick=0.25;hitCircle(c,c.x,c.y,c.R*0.6,{mult:0.12,knock:0});}
       if(c.parts.length<26)c.parts.push({a:rnd(0,TAU),r:c.R*rnd(0.6,1.1),f:(Math.random()*4)|0});}
     else if(!c.boom){c.boom=1;hitCircle(c,c.x,c.y,c.R*0.8,{mult:c.fx.blast||2.5,knock:150});kick(0.12);ring(c.x,c.y,10,c.R,typeColor(c),0.5,6);burst(c.x,c.y,typeColor(c),20,220);}
     for(const q of c.parts){q.a+=dt*(2+40/(q.r+10));q.r-=(80+c.R*0.6)*dt;}c.parts=c.parts.filter(q=>q.r>4);
     return c.t<c.life;},
   draw(c,ctx,v){const X=v.sx(c.x),Y=v.sy(c.y),R=c.R*v.k,col=c.fx.colors||['#000000','#7a3cff','#d7b4ff'];
     if(c.t<c.pullT){const grow=Math.min(1,c.t/0.25),core=(22+8*Math.sin(c.t*9))*v.k*grow;
       glow(ctx,X,Y,R*grow,rgba(col[1],0.35),rgba(col[1],0));
       ctx.lineWidth=Math.max(2,3*v.k);for(let j=0;j<5;j++){const a0=c.seed+c.t*(3+j*0.5)+j*1.26,rr=core*(1.6+j*0.35);ctx.strokeStyle=rgba(j%2?col[2]:col[1],0.85);ctx.beginPath();ctx.ellipse(X,Y,rr,rr*0.62,0,a0,a0+1.7);ctx.stroke();}
       if(c.fx.rings){ctx.strokeStyle=rgba(c.fx.rings,0.9);ctx.lineWidth=4;for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(X,Y,core*(2.6+j*0.6),core*(1.0+j*0.25),c.t*(j%2?1:-1),0,TAU);ctx.stroke();}}
       if(c.fx.maw){const gw=core*3,gap=core*1.9*(0.85+0.15*Math.sin(c.t*6));drawJaw(ctx,X,Y-gap,gw,gw*0.55,true);drawJaw(ctx,X,Y+gap*0.6,gw,gw*0.5,false);}
       for(const q of c.parts)sprite(ctx,c.fx.shape||'shadow',c.fx.pal||c.move.type,X+Math.cos(q.a)*q.r*v.k,Y+Math.sin(q.a)*q.r*v.k*0.62,0.9*v.k*Math.min(1,q.r/60),q.a,q.f);
       ctx.fillStyle=col[0];ctx.beginPath();ctx.arc(X,Y,core,0,TAU);ctx.fill();ctx.strokeStyle=rgba(col[2],0.9);ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y,core+2,0,TAU);ctx.stroke();}
     else{const u=Math.min(1,(c.t-c.pullT)/0.5),rr=R*(0.2+0.9*u);
       if(c.fx.maw){const sn=Math.min(1,u*5),gw=R*0.42*(1+0.15*u),gap=gw*1.0*(1-sn);ctx.save();ctx.globalAlpha=Math.max(0,1-Math.max(0,u-0.45)/0.55);drawJaw(ctx,X,Y-gap-2,gw,gw*0.55,true);drawJaw(ctx,X,Y+gap*0.6+2,gw,gw*0.5,false);ctx.restore();}
       ctx.globalAlpha=1-u;glow(ctx,X,Y,rr,'rgba(255,255,255,0.9)',rgba(col[1],0));ctx.strokeStyle=rgba(col[2],0.95);ctx.lineWidth=5*(1-u)+1;ctx.beginPath();ctx.arc(X,Y,rr,0,TAU);ctx.stroke();ctx.globalAlpha=1;}}};

 // ---------------------------------------------------------------- SPIKES (rings of spikes, recolorable; game rock debris)
 S.spikes={cast(c){c.x=c.player.x;c.y=c.player.y;c.waves=(c.move.count||12)>=20?4:3;c.next=0;c.sp=[];c.R=[62,128,194,260];return c;},
   update(c,dt){c.t+=dt;while(c.next<c.waves&&c.t>=c.next*0.13){const k=c.next++,R=c.R[k],n=Math.max(7,Math.round(TAU*R/66)),off=rnd(0,TAU);
       for(let j=0;j<n;j++){const a=off+j*TAU/n,x=c.x+Math.cos(a)*R,y=c.y+Math.sin(a)*R*0.8;if(Math.abs(x-c.x)<50&&y-c.y>-100&&y-c.y<28)continue;c.sp.push({x,y,v:(Math.random()*4)|0,t:-rnd(0,0.05),s:rnd(0.75,1.1)});
         if(j%3===0)sp('rock',c.fx.pal||'ground',x,y,{vx:rnd(-40,40),vy:-rnd(60,120),life:0.5,grav:320});}
       if(!c.ghost)for(const e of enemies()){const d=Math.hypot(e.x-c.x,(e.y-c.y)/0.8);if(d>(k?R-36:0)&&d<R+36)applyHit(c,e,baseDmg(c),{knock:120},e.x-c.x,e.y-c.y);}kick(0.04);}
     for(const s of c.sp)s.t+=dt;return c.t<c.waves*0.13+0.7;},
   draw(c,ctx,v){if(c.fx.bricks){ctx.save();const px=1.05*v.k;for(const s of c.sp.slice().sort((a,b)=>a.y-b.y)){if(s.t<0)continue;const f=Math.max(0,Math.min(1,s.t/0.09)-Math.max(0,(s.t-0.44)/0.18));if(f<=0)continue;const gx=v.sx(s.x),gy=v.sy(s.y),bw=26*px*s.s,bh=17*px*s.s;
       ctx.fillStyle='rgba(30,25,20,'+(0.35*Math.max(0,1-s.t/0.62))+')';ctx.beginPath();ctx.ellipse(gx,gy,bw*0.8,bw*0.3,0,0,TAU);ctx.fill();ctx.save();ctx.beginPath();ctx.rect(gx-bw,gy-bh*4,bw*2,bh*4);ctx.clip();const lift=bh*3*(1-f);
       for(let k=0;k<3;k++)drawBlock(ctx,gx+(k%2?bw*0.08:-bw*0.06),gy+lift-k*bh,bw,bh,['#8e8a84','#7b7771','#a29d96'][(s.v+k)%3]);ctx.restore();}ctx.restore();return;}
     if(!spikeImg.complete)return;ctx.save();ctx.imageSmoothingEnabled=false;if(c.fx.filter)ctx.filter=c.fx.filter;const px=1.05*v.k;
     for(const s of c.sp.slice().sort((a,b)=>a.y-b.y)){if(s.t<0)continue;const f=Math.max(0,Math.min(1,s.t/0.09)-Math.max(0,(s.t-0.44)/0.18));const w=32*px*s.s,h=56*px*s.s,gx=v.sx(s.x),gy=v.sy(s.y)+3*px;
       ctx.globalAlpha=Math.max(0,1-s.t/0.62);ctx.drawImage(spikeImg,s.v*32,56,32,16,gx-w/2,gy-8*px,w,16*px*s.s);ctx.globalAlpha=1;
       ctx.save();ctx.beginPath();ctx.rect(gx-w,gy-h*1.1,w*2,h*1.1);ctx.clip();ctx.drawImage(spikeImg,s.v*32,0,32,56,gx-w/2,gy-h*f,w,h);ctx.restore();}
     ctx.restore();}};

 // ---------------------------------------------------------------- SHOCK (expanding rings; GAME sprites ride the rings: notes, stars, moons, hearts)
 S.shock={cast(c){c.x=c.player.x;c.y=c.player.y;c.rings=Math.max(1,c.fx.rings||3);c.R=c.move.radius||260;c.speed=c.fx.speed||520;c.gap=c.fx.gap||0.16;c.skips=[];for(let i=0;i<c.rings;i++)c.skips.push(new Set());
     if(c.fx.heal){const p=c.player;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*c.fx.heal);}
     if(c.fx.fireworks){c.fw=[];for(let i=0;i<9;i++){const a=rnd(0,TAU),r=rnd(0.25,0.95)*c.R;c.fw.push({x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r*0.7,at:0.05+i*0.07,h:rnd(0,360),n:14+((Math.random()*6)|0)});}}kick(0.06);ring(c.x,c.y,8,c.R,typeColor(c),0.5,5);return c;},
   update(c,dt){c.t+=dt;if(c.fx.follow){c.x=c.player.x;c.y=c.player.y;}
     for(let i=0;i<c.rings;i++){const u=c.t-i*c.gap;if(u<0)continue;const r=Math.min(c.R,u*c.speed);if(u*c.speed>c.R+40)continue;
       if(!c.ghost)for(const e of enemies()){if(c.skips[i].has(e))continue;const d=Math.hypot(e.x-c.x,e.y-c.y);if(d<=r+(e.r||10)){c.skips[i].add(e);applyHit(c,e,baseDmg(c),{knock:70},e.x-c.x,e.y-c.y);}}}
     if(c.fw)for(const f of c.fw)if(!f.done&&c.t>=f.at){f.done=1;try{FX().burst(f.x,f.y-30,'hsl('+f.h+',100%,65%)',10,150);}catch(e){}}
     return c.t<Math.max((c.rings-1)*c.gap+c.R/c.speed+0.35,c.fw?1.4:0);},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#c86bff','#6b2cff'],X=v.sx(c.x),Y=v.sy(c.y);
     const shape={notes:'note',stars:'star',moon:'crescent',hearts:'heart',bubbles:'bubble',leaves:'leaf',flakes:'flake'}[c.fx.deco]||null;
     for(let i=0;i<c.rings;i++){const u=c.t-i*c.gap;if(u<0)continue;const r=Math.min(c.R,u*c.speed)*v.k,fade=Math.max(0,1-u*c.speed/(c.R+60));
       ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       ctx.strokeStyle=c.fx.deco==='rainbow'?'hsla('+((u*400+i*90)%360)+',100%,65%,0.9)':rgba(col[1],0.9);ctx.lineWidth=Math.max(3,10*v.k*fade);ctx.beginPath();ctx.ellipse(X,Y,r,r*0.62,0,0,TAU);ctx.stroke();
       ctx.strokeStyle=rgba(col[0],0.9);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,r*0.97,r*0.6,0,0,TAU);ctx.stroke();ctx.restore();
       if(shape)for(let j=0;j<8;j++){const a=j/8*TAU+u*1.5;sprite(ctx,shape,c.fx.pal||c.move.type,X+Math.cos(a)*r,Y+Math.sin(a)*r*0.62,1.5*v.k,0,Math.floor(c.t*10),fade);}}
     glow(ctx,X,Y,40*v.k*Math.max(0,1-c.t*2),rgba(col[0],0.8),rgba(col[1],0));
     if(c.fw){ctx.save();ctx.globalCompositeOperation='lighter';for(const f of c.fw){const u=c.t-f.at;if(u<0||u>0.9)continue;const FX0=v.sx(f.x),FY0=v.sy(f.y)-30*v.k,a=1-u/0.9;
       if(u<0.12){ctx.strokeStyle='hsla('+f.h+',100%,80%,0.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(FX0,FY0+70*v.k*(1-u/0.12));ctx.lineTo(FX0,FY0+70*v.k*(1-u/0.12)+14*v.k);ctx.stroke();continue;}
       const w=u-0.12,rr=(16+95*Math.sqrt(w))*v.k;glow(ctx,FX0,FY0,rr*0.35,'hsla('+f.h+',100%,90%,'+(0.9*a)+')','hsla('+f.h+',100%,60%,0)');
       for(let j=0;j<f.n;j++){const ang=j/f.n*TAU,px=FX0+Math.cos(ang)*rr,py=FY0+Math.sin(ang)*rr+60*w*w*v.k;ctx.fillStyle='hsla('+((f.h+j*8)%360)+',100%,'+(62+18*Math.sin(j+u*30))+'%,'+a+')';ctx.fillRect(px-3,py-3,6,6);
         ctx.strokeStyle='hsla('+f.h+',100%,62%,'+(a*0.85)+')';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(FX0+Math.cos(ang)*rr*0.6,FY0+Math.sin(ang)*rr*0.6+40*w*w*v.k);ctx.lineTo(px,py);ctx.stroke();}}ctx.restore();}}};

 // ---------------------------------------------------------------- COMET (the game's Z ASTEROID field: a giant game sprite falls from the sky)
 S.comet={cast(c){const n=Math.max(1,Math.min(4,Math.round(c.move.count||1)));c.list=[];const used=[],p=c.player,Cb=B()?.combat,V=VFX();
     for(let i=0;i<n;i++){const t=densest(p,380,used)||nearest(p.x,p.y,460);if(!t)break;used.push(t);c.list.push({x:t.x+rnd(-15,15),y:t.y+rnd(-15,15),at:i*0.22,done:false});}
     if(!c.list.length)return null;c.R=c.move.radius||150;c.fall=c.fx.fall||0.75;
     c.engine=!c.fx.rocket&&!!(Cb&&typeof Cb.addField==='function'&&V);
     if(c.engine){const vis={proj:c.fx.shape||'rock',pal:c.fx.pal||c.move.type};
       for(const m of c.list)Cb.addField({kind:'meteor',big:!!c.fx.big,owner:p,ghost:c.ghost,m:c.move,col:typeColor(c),vis,x:m.x,y:m.y,t:-m.at,fall:c.fall,r:c.R,dmg:c.ghost?0:baseDmg(c),scale:c.fx.scale||(c.fx.big?6:5),drop:c.fx.drop||820});}
     return c;},
   update(c,dt){c.t+=dt;for(const m of c.list)if(!m.done&&c.t>=m.at+c.fall){m.done=true;if(!c.engine)hitCircle(c,m.x,m.y,c.R,{knock:170});else if(c.fx.stun||c.fx.burn||c.fx.slow){for(const e of enemies())if(Math.hypot(e.x-m.x,e.y-m.y)<c.R){const st=c.fx.stun;if(st&&Math.random()<st.chance&&e.applyStun)e.applyStun(st.dur);if(c.fx.burn&&e.applyBurn)e.applyBurn(1);if(c.fx.slow&&e.applySlow)e.applySlow(c.fx.slow,1.4);}}
       kick(0.16);ring(m.x,m.y,10,c.R*1.15,typeColor(c),0.55,7);burst(m.x,m.y,typeColor(c),26,260);for(let j=0;j<8;j++)sp(c.fx.debris||'rock',c.fx.pal||c.move.type,m.x,m.y,{vx:rnd(-160,160),vy:-rnd(100,240),life:0.7,grav:420});}
     return c.t<c.list[c.list.length-1].at+c.fall+0.8;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff9ad8','#a040ff'];
     for(const m of c.list){const u=c.t-m.at;if(u<0)continue;const X=v.sx(m.x),Y=v.sy(m.y),R=c.R*v.k;
       if(u<c.fall){const q=u/c.fall;ctx.strokeStyle=rgba(col[1],0.3+0.6*q);ctx.lineWidth=2+2*q;ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.5,0,0,TAU);ctx.stroke();
         ctx.fillStyle=rgba(col[2],0.12+0.15*q);ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.5,0,0,TAU);ctx.fill();
         if(c.fx.rocket){const sx=X+(1-q)*260*v.k,sy=Y-(1-q)*620*v.k;drawRocket(ctx,sx,sy,Math.atan2(620,-260),46*v.k,c.t);}
         else if(!c.engine){const sx=X-(1-q)*420*v.k,sy=Y-(1-q)*620*v.k;glow(ctx,sx,sy,30*v.k,rgba(col[0],1),rgba(col[1],0));}
         else{const sc=c.fx.scale||(c.fx.big?6:5),drop=c.fx.drop||820,gx=v.sx(m.x+(1-q)*drop*0.24),gy=v.sy(m.y-(1-q)*drop-6*sc);ctx.save();ctx.globalCompositeOperation='lighter';
           const tl=ctx.createLinearGradient(gx,gy,gx+70*v.k,gy-290*v.k);tl.addColorStop(0,rgba(col[1],0.75));tl.addColorStop(1,rgba(col[2],0));ctx.strokeStyle=tl;ctx.lineCap='round';ctx.lineWidth=sc*9*v.k;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+70*v.k,gy-290*v.k);ctx.stroke();
           ctx.lineWidth=sc*3.5*v.k;ctx.strokeStyle=rgba(col[0],0.55);ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+40*v.k,gy-170*v.k);ctx.stroke();glow(ctx,gx,gy,sc*13*v.k,rgba(col[1],0.55),rgba(col[2],0));ctx.restore();}continue;}
       const w=u-c.fall,fade=Math.max(0,1-w/0.8);ctx.save();ctx.globalAlpha=fade;
       ctx.fillStyle='rgba(20,10,10,'+(0.45*fade)+')';ctx.beginPath();ctx.ellipse(X,Y,R*0.8,R*0.4,0,0,TAU);ctx.fill();
       ctx.globalCompositeOperation='lighter';glow(ctx,X,Y,R*(0.6+w*1.4),rgba(col[0],0.95),rgba(col[2],0));
       ctx.strokeStyle=rgba(col[1],0.9);ctx.lineWidth=6*fade+1;ctx.beginPath();ctx.ellipse(X,Y,R*(0.4+w*2.2),R*(0.4+w*2.2)*0.5,0,0,TAU);ctx.stroke();ctx.restore();}}};

 // ---------------------------------------------------------------- VORTEX (the game's real Z TORNADOES, steered by us; we do the damage)
 S.vortex={cast(c){const n=Math.max(1,Math.min(4,Math.round(c.move.count||2))),p=c.player,P=B()?.projectiles;c.list=[];c.life=c.fx.life||3;c.R=c.move.radius||90;
     for(let i=0;i<n;i++){const a=i/n*TAU,w={x:p.x+Math.cos(a)*40,y:p.y+Math.sin(a)*30,tick:i*0.1,parts:[],proj:null};
       if(P&&typeof P.spawn==='function'&&c.fx.zTornado!==false){try{w.proj=P.spawn({owner:p,mid:'ultfx',ultFx:true,tornado:true,ghost:true,friendly:true,x:w.x,y:w.y,vx:0,vy:0,dmg:0,r:c.R*0.6,life:c.life,pierce:Infinity,color:typeColor(c),hits:new Set()});}catch(e){}}
       c.list.push(w);}
     return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     for(const w of c.list){const t=nearest(w.x,w.y,600,all);if(t){const dx=t.x-w.x,dy=t.y-w.y,d=Math.hypot(dx,dy)||1;w.x+=dx/d*(c.fx.speed||130)*dt;w.y+=dy/d*(c.fx.speed||130)*dt;}
       if(w.proj){w.proj.x=w.x;w.proj.y=w.y;w.proj.vx=0;w.proj.vy=0;}
       for(const e of all){const dx=w.x-e.x,dy=w.y-e.y,d=Math.hypot(dx,dy);if(d>c.R*1.6||d<5)continue;const pl=120*(e.boss?0.3:1)*dt;e.x+=dx/d*Math.min(pl,d-5);e.y+=dy/d*Math.min(pl,d-5);}
       w.tick-=dt;if(w.tick<=0){w.tick=c.fx.tick||0.3;hitCircle(c,w.x,w.y,c.R,{knock:20});if(c.fx.bolts&&Math.random()<0.5){try{FX().zap(w.x+rnd(-20,20),w.y-160,w.x+rnd(-30,30),w.y,0.1,typeColor(c),30,1.8);}catch(e){}}}
       if(w.parts.length<12&&Math.random()<0.5)w.parts.push({a:rnd(0,TAU),h:0,r:rnd(0.6,1.1),f:(Math.random()*3)|0});for(const q of w.parts){q.a+=dt*5;q.h+=dt*75;}w.parts=w.parts.filter(q=>q.h<130);}
     if(c.t>=c.life)for(const w of c.list)if(w.proj)w.proj.life=0;
     return c.t<c.life;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#bff0d0','#5fcb6a'],fade=Math.min(1,(c.life-c.t)/0.3);
     for(const w of c.list){const X=v.sx(w.x),Y=v.sy(w.y),R=c.R*v.k;
       if(!w.proj){ctx.save();ctx.globalAlpha=fade*0.95;for(let j=0;j<7;j++){const h=j*16*v.k,rr=R*(0.35+j*0.1);ctx.strokeStyle=rgba(j%2?col[1]:col[2],0.75);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X+Math.sin(c.t*5+j)*6*v.k,Y-h,rr,rr*0.32,0,c.t*8+j,c.t*8+j+4.4);ctx.stroke();}ctx.restore();}
       ctx.save();ctx.globalAlpha=fade*0.6;ctx.fillStyle=rgba(col[2],0.25);ctx.beginPath();ctx.ellipse(X,Y,R,R*0.4,0,0,TAU);ctx.fill();ctx.restore();
       for(const q of w.parts)sprite(ctx,c.fx.shape||'leaf',c.fx.pal||c.move.type,X+Math.cos(q.a)*R*q.r*(0.7+q.h/110),Y-q.h*v.k+Math.sin(q.a)*R*0.25,0.8*v.k,q.a,q.f,fade*Math.min(1,(130-q.h)/30));}}};

 // ---------------------------------------------------------------- GEYSER (pillars; game sprite spray; optional lingering Fire/Toxic Z ground field)
 S.geyser={cast(c){const n=Math.max(1,Math.round(c.move.count||4)),p=c.player;c.list=[];
     if(c.fx.ring){for(let i=0;i<n;i++){const a=i/n*TAU,r=c.fx.ring;c.list.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*0.8,at:i*0.04});}}
     else{const L=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<420).sort(()=>Math.random()-0.5);if(!L.length)return null;for(let i=0;i<n;i++){const e=L[i%L.length];c.list.push({x:e.x+(i>=L.length?rnd(-50,50):0),y:e.y+(i>=L.length?rnd(-40,40):0),at:i*0.09});}}
     c.R=c.move.radius||60;c.warn=c.fx.warn||0.35;return c;},
   update(c,dt){c.t+=dt;for(const g of c.list)if(!g.done&&c.t>=g.at+c.warn){g.done=true;hitCircle(c,g.x,g.y,c.R,{knock:110});kick(0.03);
       for(let j=0;j<6;j++)sp(c.fx.shape||'fire',c.fx.pal||c.move.type,g.x+rnd(-c.R*0.4,c.R*0.4),g.y,{vx:rnd(-50,50),vy:-rnd(160,300),life:0.7,grav:260});
       if(c.fx.patch&&!c.ghost){const Cb=B()?.combat,V=VFX();try{Cb.addField({kind:'patch',big:!!c.fx.patch.big,bog:!!c.fx.patch.bog,owner:c.player,ghost:c.ghost,m:{id:c.move.id,type:c.move.type,burn:c.fx.burn?1:0,poison:c.fx.poison?1:0,knock:0},col:typeColor(c),vis:V.forType(c.move.type),x:g.x,y:g.y,t:0,life:c.fx.patch.life||2.5,r:c.R*1.1,tick:0,dmg:baseDmg(c,c.fx.patch.mult||0.25),seed:Math.random()*9});}catch(e){}}}
     return c.t<c.list[c.list.length-1].at+c.warn+0.8;},
   draw(c,ctx,v){const col=c.fx.colors||['#fff6c8','#ff9a3d','#ff3d1a'];
     for(const g of c.list){const u=c.t-g.at;if(u<0)continue;const X=v.sx(g.x),Y=v.sy(g.y),R=c.R*v.k;
       if(u<c.warn){const q=u/c.warn;ctx.fillStyle=rgba(col[2],0.25+0.3*q);ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.45,0,0,TAU);ctx.fill();continue;}
       const w=u-c.warn,h=Math.min(1,w/0.12)*(c.fx.height||220)*v.k,fade=Math.max(0,1-Math.max(0,w-0.35)/0.45);
       ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       const gr=ctx.createLinearGradient(X,Y-h,X,Y);gr.addColorStop(0,rgba(col[1],0));gr.addColorStop(0.3,rgba(col[1],0.8));gr.addColorStop(1,rgba(col[0],1));ctx.fillStyle=gr;
       ctx.beginPath();ctx.moveTo(X-R*0.55,Y);for(let s=0;s<=10;s++){const yy=Y-h*s/10;ctx.lineTo(X-R*(0.55-0.25*s/10)+Math.sin(w*30+s)*4*v.k,yy);}for(let s=10;s>=0;s--){const yy=Y-h*s/10;ctx.lineTo(X+R*(0.55-0.25*s/10)+Math.sin(w*30+s+2)*4*v.k,yy);}ctx.closePath();ctx.fill();
       glow(ctx,X,Y,R*1.1,rgba(col[0],0.8),rgba(col[2],0));ctx.restore();
       for(let j=0;j<3;j++)sprite(ctx,c.fx.shape||'fire',c.fx.pal||c.move.type,X+Math.sin(w*8+j*2)*R*0.3,Y-h*(0.35+j*0.25),1.6*v.k,0,Math.floor(c.t*12)+j,fade);}}};

 // ---------------------------------------------------------------- ORBS (GAME sprites burst out and home in; game burst on impact)
 S.orbs={cast(c){const n=Math.max(1,Math.round(c.move.count||6)),p=c.player;c.list=[];const m0=mouth(p,Number(p.aim)||0);
     for(let i=0;i<n;i++){const a=i/n*TAU;c.list.push({x:m0.x,y:m0.y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,t:0,trail:[],dead:false,f:(Math.random()*4)|0});}
     c.life=c.fx.life||2.2;c.size=c.fx.size||12;return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     for(const o of c.list){if(o.dead)continue;o.t+=dt;const tg=nearest(o.x,o.y,700,all);
       if(tg&&o.t>0.18){const dx=tg.x-o.x,dy=tg.y-o.y,d=Math.hypot(dx,dy)||1,spd=c.fx.speed||380;o.vx+=(dx/d*spd-o.vx)*Math.min(1,dt*(c.fx.homing||6));o.vy+=(dy/d*spd-o.vy)*Math.min(1,dt*(c.fx.homing||6));}
       o.x+=o.vx*dt;o.y+=o.vy*dt;o.trail.push({x:o.x,y:o.y});if(o.trail.length>10)o.trail.shift();
       if(tg&&Math.hypot(tg.x-o.x,tg.y-o.y)<(tg.r||12)+c.size){o.dead=true;o.boomT=0;o.bx=o.x;o.by=o.y;hitCircle(c,o.x,o.y,c.fx.splash||40,{knock:60});burst(o.x,o.y,typeColor(c),8,140);}
       if(o.t>c.life)o.dead=true;}
     for(const o of c.list)if(o.boomT!=null)o.boomT+=dt;
     return c.list.some(o=>!o.dead||(o.boomT!=null&&o.boomT<0.35));},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#c86bff','#6b2cff'],shape=c.fx.shape||'ball';
     for(const o of c.list){
       if(!o.dead){ctx.save();ctx.globalCompositeOperation='lighter';o.trail.forEach((q,i)=>glow(ctx,v.sx(q.x),v.sy(q.y),c.size*v.k*(i/o.trail.length),rgba(col[1],0.35),rgba(col[2],0)));glow(ctx,v.sx(o.x),v.sy(o.y),c.size*1.6*v.k,rgba(col[0],0.7),rgba(col[1],0));ctx.restore();
         sprite(ctx,shape,c.fx.pal||c.move.type,v.sx(o.x),v.sy(o.y),(c.fx.spriteScale||1.6)*v.k,Math.atan2(o.vy,o.vx),Math.floor(c.t*12)+o.f);}
       else if(o.boomT!=null&&o.boomT<0.35){const q=o.boomT/0.35;ctx.save();ctx.globalCompositeOperation='lighter';glow(ctx,v.sx(o.bx),v.sy(o.by),(c.fx.splash||40)*v.k*(0.5+q),rgba(col[0],0.9*(1-q)),rgba(col[2],0));ctx.restore();}}}};

 // ---------------------------------------------------------------- PHANTOM DASH (afterimage streak + game slash/burst at the end)
 S.dash={cast(c){const p=c.player,t=nearest(p.x,p.y,(c.move.radius||300)+80);if(!t)return null;const a=Math.atan2(t.y-p.y,t.x-p.x),L=wallClip(p.x,p.y,a,c.move.radius||300);
     c.ax=p.x;c.ay=p.y;c.bx=p.x+Math.cos(a)*L;c.by=p.y+Math.sin(a)*L;c.ang=a;c.w=c.move.width||60;c.dur=0.18;c.skip=new Set();return c;},
   update(c,dt){c.t+=dt;const q=Math.min(1,c.t/c.dur),hx=c.ax+(c.bx-c.ax)*q,hy=c.ay+(c.by-c.ay)*q;hitLine(c,c.ax,c.ay,hx,hy,c.w,{skip:c.skip,knock:120});
     if(q>=1&&!c.burst){c.burst=1;hitCircle(c,c.bx,c.by,c.fx.burst||90,{mult:c.fx.burstMult||1,knock:160});kick(0.1);burst(c.bx,c.by,typeColor(c),20,220);ring(c.bx,c.by,8,c.fx.burst||90,typeColor(c),0.4,5);
       try{FX().slash(c.bx,c.by,c.ang,(c.fx.burst||90)*0.8,1.4,typeColor(c),{pal:c.fx.pal||c.move.type});}catch(e){}}return c.t<c.dur+0.6;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff9a3d','#ff3d1a'],q=Math.min(1,c.t/c.dur),fade=c.t>c.dur?Math.max(0,1-(c.t-c.dur)/0.6):1;
     const AX=v.sx(c.ax),AY=v.sy(c.ay),HX=v.sx(c.ax+(c.bx-c.ax)*q),HY=v.sy(c.ay+(c.by-c.ay)*q),W=c.w*v.k;
     ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
     ctx.strokeStyle=rgba(col[2],0.5);ctx.lineWidth=W;ctx.beginPath();ctx.moveTo(AX,AY);ctx.lineTo(HX,HY);ctx.stroke();
     ctx.strokeStyle=rgba(col[1],0.85);ctx.lineWidth=W*0.45;ctx.stroke();ctx.strokeStyle=rgba(col[0],1);ctx.lineWidth=W*0.12;ctx.stroke();
     for(let i=1;i<=4;i++){const f=q-i*0.12;if(f<0)break;glow(ctx,v.sx(c.ax+(c.bx-c.ax)*f),v.sy(c.ay+(c.by-c.ay)*f),W*0.7,rgba(col[1],0.4),rgba(col[2],0));}
     if(c.burst){const u=(c.t-c.dur)/0.6,R=(c.fx.burst||90)*v.k;glow(ctx,v.sx(c.bx),v.sy(c.by),R*(0.6+u),rgba(col[0],0.95),rgba(col[2],0));
       if(c.fx.vshape){ctx.strokeStyle=rgba(col[1],0.95);ctx.lineWidth=8*(1-u)+2;const bx=v.sx(c.bx),by=v.sy(c.by);ctx.beginPath();ctx.moveTo(bx-R,by-R);ctx.lineTo(bx,by+R*0.3);ctx.lineTo(bx+R,by-R);ctx.stroke();}}
     ctx.restore();}};

 // ---------------------------------------------------------------- HIGH JUMP KICK (Pheromosa leaps at a foe, kicks down, shockwave + aftershock)
 S.hjk={cast(c){const p=c.player,R=(c.move.radius||340);const t=densest(p,R+60)||nearest(p.x,p.y,R+80);if(!t)return null;
     const a=Math.atan2(t.y-p.y,t.x-p.x),D=Math.min(Math.hypot(t.x-p.x,t.y-p.y),R),L=wallClip(p.x,p.y,a,D);
     c.ax=p.x;c.ay=p.y;c.bx=p.x+Math.cos(a)*L;c.by=p.y+Math.sin(a)*L;c.ang=a;c.dur=c.fx.leap||0.26;c.skip=new Set();c.R=c.fx.burst||135;c.ghosts=[];c.cracks=[];
     if(B()?.game?.state&&B().game.state!=='playing')return null;c.lx=p.x;c.ly=p.y;
     c.dex=Number(p.dex)||795;c.sc=(Number(p.anim?.scale)||1)*2;try{p.invuln=Math.max(Number(p.invuln)||0,c.dur+0.15);}catch(e){}
     for(let i=0;i<9;i++){const ca=i/9*TAU+rnd(-0.2,0.2),pts=[[0,0]];let r=0;for(let j=0;j<4;j++){r+=rnd(0.18,0.32);pts.push([Math.cos(ca+rnd(-0.25,0.25))*r,Math.sin(ca+rnd(-0.25,0.25))*r]);}c.cracks.push(pts);}
     return c;},
   update(c,dt){c.t+=dt;const p=c.player,q=Math.min(1,c.t/c.dur),e=q<1?1-Math.pow(1-q,2):1;
     // she got teleported mid-jump (entering a Rift, a door...): stop steering her and let the game place her
     if(!c.land&&!c.cancel&&Math.hypot(p.x-c.lx,p.y-c.ly)>90)c.cancel=true;
     if(c.cancel)return c.t<c.dur+0.3;
     if(q<1||!c.land){const x=c.ax+(c.bx-c.ax)*e,y=c.ay+(c.by-c.ay)*e;if(!c.land){p.x=x;p.y=y;c.lx=x;c.ly=y;}
       if(c.ghosts.length<8&&c.t>c.ghosts.length*c.dur/7)c.ghosts.push({x,y,q,t:c.t});
       hitLine(c,c.ax,c.ay,x,y,46,{skip:c.skip,knock:60,mult:0.45});}
     if(q>=1&&!c.land){c.land=c.t;p.x=c.bx;p.y=c.by;c.lx=c.bx;c.ly=c.by;
       hitCircle(c,c.bx,c.by,c.R,{mult:c.fx.burstMult||1.6,knock:230});kick(0.22);
       ring(c.bx,c.by,10,c.R*1.15,'#ffffff',0.45,7);ring(c.bx,c.by,6,c.R*0.8,typeColor(c),0.35,4);burst(c.bx,c.by-8,typeColor(c),24,260);
       try{FX().slash(c.bx,c.by-30,c.ang+Math.PI/2,c.R*0.75,2.2,'#ffffff',{pal:'fighting'});}catch(err){}
       for(let j=0;j<10;j++)sp(j%3?'rock':'impact',j%3?'ground':'fighting',c.bx,c.by,{vx:rnd(-200,200),vy:-rnd(80,260),life:0.7,grav:520});}
     if(c.land&&!c.after&&c.t-c.land>0.28){c.after=1;hitCircle(c,c.bx,c.by,c.R*1.5,{mult:0.7,knock:140,slow:0.5,slowDur:1.6,stun:c.fx.stun});ring(c.bx,c.by,c.R*0.6,c.R*1.6,typeColor(c),0.5,5);kick(0.1);}
     return !c.land||c.t-c.land<0.95;},
   draw(c,ctx,v){if(c.cancel)return;const col=c.fx.colors||['#ffffff','#fff1c8','#ff9ad8'],k=v.k;
     // leap: a glowing arc + Pheromosa afterimages up in the air
     const fadeL=c.land?Math.max(0,1-(c.t-c.land)/0.35):1;
     if(fadeL>0){ctx.save();ctx.globalAlpha=fadeL;ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
       const AX=v.sx(c.ax),AY=v.sy(c.ay)-30*k,BX=v.sx(c.bx),BY=v.sy(c.by)-30*k,CX=(AX+BX)/2,CY=Math.min(AY,BY)-110*k;
       const q=Math.min(1,c.t/c.dur);ctx.strokeStyle=rgba(col[2],0.45);ctx.lineWidth=22*k;ctx.beginPath();ctx.moveTo(AX,AY);
       for(let i=1;i<=20;i++){const u=i/20*q,x=(1-u)*(1-u)*AX+2*u*(1-u)*CX+u*u*BX,y=(1-u)*(1-u)*AY+2*u*(1-u)*CY+u*u*BY;ctx.lineTo(x,y);}ctx.stroke();
       ctx.strokeStyle=rgba(col[1],0.9);ctx.lineWidth=8*k;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,0.95)';ctx.lineWidth=2.5*k;ctx.stroke();ctx.restore();
       c.ghosts.forEach((g,i)=>{const u=g.q,gx=(1-u)*(1-u)*AX+2*u*(1-u)*CX+u*u*BX,gy=(1-u)*(1-u)*AY+2*u*(1-u)*CY+u*u*BY+30*k;
         const al=fadeL*0.55*Math.max(0.2,1-(c.t-g.t)/0.6);
         if(!pokeSprite(ctx,c.dex,'Attack',c.ang,c.t,gx,gy,c.sc*k,al,'lighter'))glow(ctx,gx,gy-20*k,18*k,rgba(col[1],al),rgba(col[2],0));});}
     if(!c.land)return;
     const w=c.t-c.land,X=v.sx(c.bx),Y=v.sy(c.by),R=c.R*k,fade=Math.max(0,1-w/0.95);
     ctx.save();
     // crater + cracks in the ground
     ctx.globalAlpha=fade;ctx.fillStyle='rgba(40,28,20,0.45)';ctx.beginPath();ctx.ellipse(X,Y,R*0.55,R*0.24,0,0,TAU);ctx.fill();
     ctx.strokeStyle='rgba(30,20,14,0.85)';ctx.lineWidth=Math.max(2,3*k);ctx.lineJoin='round';
     for(const cr of c.cracks){ctx.beginPath();cr.forEach(([x,y],i)=>{const px=X+x*R*Math.min(1,w*8),py=Y+y*R*0.45*Math.min(1,w*8);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();}
     ctx.globalCompositeOperation='lighter';
     // impact star flash
     if(w<0.22){const s2=R*(0.5+w*3),a2=1-w/0.22;ctx.fillStyle='rgba(255,255,255,'+a2+')';ctx.beginPath();for(let i=0;i<16;i++){const r=i%2?s2*0.35:s2,an=i/16*TAU+0.2;ctx.lineTo(X+Math.cos(an)*r,Y-26*k+Math.sin(an)*r*0.7);}ctx.closePath();ctx.fill();
       ctx.fillStyle=rgba(col[1],a2*0.9);ctx.beginPath();for(let i=0;i<16;i++){const r=i%2?s2*0.2:s2*0.6,an=i/16*TAU;ctx.lineTo(X+Math.cos(an)*r,Y-26*k+Math.sin(an)*r*0.7);}ctx.closePath();ctx.fill();}
     // shockwave + aftershock
     const r1=R*Math.min(1.2,0.3+w*4);ctx.strokeStyle=rgba(col[0],0.95*fade);ctx.lineWidth=Math.max(2,10*k*(1-w));ctx.beginPath();ctx.ellipse(X,Y,r1,r1*0.45,0,0,TAU);ctx.stroke();
     if(w>0.28){const u=(w-0.28)/0.67,r2=R*(0.6+u*1.1);ctx.strokeStyle=rgba(col[2],0.9*(1-u));ctx.lineWidth=Math.max(2,8*k*(1-u));ctx.beginPath();ctx.ellipse(X,Y,r2,r2*0.45,0,0,TAU);ctx.stroke();
       glow(ctx,X,Y,r2*0.7,rgba(col[1],0.35*(1-u)),rgba(col[2],0));}
     // dust puffs
     for(let i=0;i<10;i++){const an=i/10*TAU,dd=R*(0.5+w*1.3);ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(220,205,180,'+(0.5*fade)+')';ctx.beginPath();ctx.arc(X+Math.cos(an)*dd,Y+Math.sin(an)*dd*0.42-6*k,(10+w*20)*k,0,TAU);ctx.fill();}
     ctx.restore();}};

 // ---------------------------------------------------------------- SUMMONED ALLIES (little Pokemon that follow you and shoot)
 //  move.fx = {dex, life, shot:'poison-sting', rate, poison, slow}
 // move with real collision: walls, trees/rocks (solid props) and liquids (lava/water) block like for enemies
 function minionMove(c,dx,dy){const Wd=B()?.world;if(!Wd){c.x+=dx;c.y+=dy;return;}
   const ok=(x,y)=>{try{if(typeof Wd.isFree==='function'&&!Wd.isFree(x,y,9,true))return false;if(typeof Wd.isLiquid==='function'&&Wd.isLiquid(x,y))return false;if(typeof Wd.propsInCircle==='function'){for(const q of Wd.propsInCircle(x,y,22))if(q&&q.solid&&q.hp>0&&Math.hypot(q.x-x,q.y-y)<(q.r||12)+9)return false;}}catch(e){}return true;};
   if(ok(c.x+dx,c.y+dy)){c.x+=dx;c.y+=dy;}else if(ok(c.x+dx,c.y)){c.x+=dx;}else if(ok(c.x,c.y+dy)){c.y+=dy;}
   else{const a=Math.atan2(dy,dx)+(c.side||1)*Math.PI/2,L=Math.hypot(dx,dy);if(ok(c.x+Math.cos(a)*L,c.y+Math.sin(a)*L)){c.x+=Math.cos(a)*L;c.y+=Math.sin(a)*L;}else c.side=-(c.side||1);}}
 S.minion={cast(c){const p=c.player,a=rnd(0,TAU);c.off=a;c.maxHp=Math.max(1,(Number(p.maxHp)||100)*(c.fx.share||1));c.hp=c.maxHp;c.hitT=0;c.touch=new Map();
     // pop in on free ground near her
     for(let i=0;i<8;i++){const a2=a+i*0.8,x=p.x+Math.cos(a2)*60,y=p.y+Math.sin(a2)*45;const Wd=B()?.world;let free=true;try{free=!Wd||((!Wd.isFree||Wd.isFree(x,y,9,true))&&!(Wd.isLiquid&&Wd.isLiquid(x,y)));}catch(e){}if(free){c.sx0=x;c.sy0=y;break;}}c.x=c.sx0??p.x;c.y=c.sy0??p.y;c.life=c.fx.life||15;c.cd=rnd(0.3,0.9);c.face=0;c.walk=0;
     const hc=c.fx.heart||'#9cff7a';ring(c.x,c.y,4,c.fx.tier==='epic'?90:40,hc,0.45,c.fx.tier==='epic'?6:3);burst(c.x,c.y-10,hc,c.fx.tier==='epic'?30:10,c.fx.tier==='epic'?200:110);if(c.fx.tier==='epic')kick(0.1);return c;},
   update(c,dt){c.t+=dt;const p=c.player;if(!p||p.dead)return false;const P=B()?.projectiles;
     // stay inside the screen around the Pokemon that summoned it
     const cam=B()?.camera;let vw=null;if(c.fx.onScreen&&cam&&typeof cam.left==='function'&&cam.scale){const L=cam.left(),T=cam.top(),W=(cam._cw||800)/cam.scale,H=(cam._ch||600)/cam.scale;vw={l:L+24,t:T+40,r:L+W-24,b:T+H-24};}
     const inView=e=>!vw||(e.x>vw.l-10&&e.x<vw.r+10&&e.y>vw.t-10&&e.y<vw.b+10);
     const t=nearest(c.x,c.y,520,enemies().filter(inView));let gx,gy;
     if(t&&Math.hypot(t.x-p.x,t.y-p.y)<650){const d=Math.hypot(t.x-c.x,t.y-c.y)||1;c.face=Math.atan2(t.y-c.y,t.x-c.x);const sx2=t.x+Math.cos(c.off)*120,sy2=t.y+Math.sin(c.off)*85;if(Math.hypot(sx2-c.x,sy2-c.y)>14){gx=sx2;gy=sy2;}
       c.cd-=dt;if(c.cd<=0&&P&&typeof P.spawn==='function'&&!c.ghost&&!c.dead){c.cd=c.fx.rate||0.9;const sp2=330,ang=Math.atan2(t.y-(c.y-8),t.x-c.x);
         try{const mid=c.fx.shot||'poison-sting',md=B()?.moves?.BY_ID?.[mid],vis=VFX()&&md?VFX().forMove(md):null;P.spawn({owner:p,mid,x:c.x,y:c.y-10,vx:Math.cos(ang)*sp2,vy:Math.sin(ang)*sp2,dmg:baseDmg(c),r:c.fx.tier==='epic'?9:6,life:1.3,friendly:true,pierce:c.fx.pierce||0,burn:c.fx.burn||0,color:md?(B()?.types?.color?.(md.type)||typeColor(c)):typeColor(c),poison:c.fx.poison||0,slow:c.fx.slow||0,knock:20,hits:new Set(),vis,homing:0});}catch(e){}}}
     else{ // no foe on screen: go open a chest if there is one, otherwise stay by her side
       let chest=null;const Wd=B()?.world;
       if(c.fx.chests&&Wd&&typeof Wd.propsInCircle==='function'){let bd=1e9;try{for(const q of Wd.propsInCircle(c.x,c.y,520))if(q&&q.type==='chest'&&q.hp>0&&!q.used&&inView(q)){const d=Math.hypot(q.x-c.x,q.y-c.y);if(d<bd){bd=d;chest=q;}}}catch(e){}}
       if(chest){gx=chest.x+Math.cos(c.off)*22;gy=chest.y+Math.sin(c.off)*16;c.face=Math.atan2(chest.y-c.y,chest.x-c.x);
         c.cd-=dt;if(Math.hypot(chest.x-c.x,chest.y-c.y)<46&&c.cd<=0&&!c.ghost){c.cd=0.45;try{Wd.damageProp(chest,Math.max(4,baseDmg(c)),c.fx.heart||'#ffd23f');}catch(e){}burst(chest.x,chest.y-10,'#ffe27a',4,90);}}
       else{gx=p.x+Math.cos(c.off+c.t*0.6)*70;gy=p.y+Math.sin(c.off+c.t*0.6)*50;}}
     c.walk=0;if(gx!=null){const dx=gx-c.x,dy=gy-c.y,d=Math.hypot(dx,dy);if(d>8){const spd=Math.min(d,(c.fx.speed||Math.max(95,(Number(p.spd)||120)*1.5*(c.fx.share||1))))*dt;minionMove(c,dx/d*spd,dy/d*spd);c.walk=1;if(!t)c.face=Math.atan2(dy,dx);}}
     // enemies go after it and hurt it on contact, like they do with you
     if(!c.dead){const now2=c.t;for(const e of enemies()){const d=Math.hypot(e.x-c.x,e.y-c.y);
         if(d<170&&d<Math.hypot(e.x-p.x,e.y-p.y)&&!e.boss){const sp3=(Number(e.spd)||60)*0.85*dt*(e.slowT>0?1-(e.slow||0):1);if(d>(e.r||12)+8){const nx=e.x+(c.x-e.x)/d*sp3,ny=e.y+(c.y-e.y)/d*sp3;let ok=true;try{const Wd=B()?.world;ok=!Wd||!Wd.isFree||Wd.isFree(nx,ny,(e.r||12)*0.6);}catch(er){}if(ok){e.x=nx;e.y=ny;}}}
         if(d<(e.r||12)+11){const last=c.touch.get(e)||-9;if(now2-last>=0.6){c.touch.set(e,now2);const dmg=Math.max(1,Number(e._dmg)||Number(e.dmg)||8);c.hp-=dmg;c.hitT=0.15;try{FX().dmgText(c.x,c.y-28,String(Math.round(dmg)),'#ff6a6a');}catch(er){}}}}
       if(c.hp<=0){c.dead=true;c.gone=1;c.life=Math.min(c.life,c.t+0.5);burst(c.x,c.y-10,'#ffffff',14,140);try{FX().dmgText(c.x,c.y-40,'fainted','#c8c8ff');}catch(er){}}}
     if(c.hitT>0)c.hitT-=dt;
     for(const o of live)if(o!==c&&o.style===S.minion){const dx=c.x-o.x,dy=c.y-o.y,d=Math.hypot(dx,dy);if(d>0.1&&d<34){c.x+=dx/d*(34-d)*0.5;c.y+=dy/d*(34-d)*0.5;}}
     if(vw){c.x=Math.max(vw.l,Math.min(vw.r,c.x));c.y=Math.max(vw.t,Math.min(vw.b,c.y));}
     if(Math.hypot(p.x-c.x,p.y-c.y)>900){c.x=p.x;c.y=p.y;}   // she teleported (Rift etc.): come along
     if(c.t>=c.life&&!c.gone){c.gone=1;burst(c.x,c.y-10,'#e8ffd0',10,110);}
     return c.t<c.life;},
   draw(c,ctx,v){const X=v.sx(c.x),Y=v.sy(c.y),k=v.k;let al=Math.min(1,c.t/0.3,(c.life-c.t)/0.4);
     ctx.save();ctx.globalAlpha=0.3*al;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X,Y,11*k,4.5*k,0,0,TAU);ctx.fill();ctx.restore();
     if(c.fx.tier==='epic'||c.fx.tier==='rare'){const ep=c.fx.tier==='epic';ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al*(0.55+0.25*Math.sin(c.t*4));glow(ctx,X,Y-14*k,(ep?40:26)*k,rgba(c.fx.heart,ep?0.55:0.35),rgba(c.fx.heart,0));
       ctx.strokeStyle=rgba(c.fx.heart,0.8);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,(ep?22:16)*k,(ep?8:6)*k,0,0,TAU);ctx.stroke();
       if(ep)for(let i=0;i<4;i++){const a2=c.t*2+i*Math.PI/2;sprite(ctx,'star','electric',X+Math.cos(a2)*24*k,Y-20*k+Math.sin(a2)*10*k,0.6*k,0,0,al);}ctx.restore();}
     if(c.hitT>0)al*=0.55+0.45*Math.sin(c.t*60);
     if(!pokeSprite(ctx,c.fx.dex||10,c.walk?'Walk':'Idle',c.face,c.t,X,Y,2*(c.fx.scale||1)*k,al))glow(ctx,X,Y-10*k,10*k,'rgba(160,255,120,0.9)','rgba(0,0,0,0)');
     const top=(()=>{const M=B()?.spriteMeta?.[String(c.fx.dex)]?.a?.Idle;return M?M.ay*2*(c.fx.scale||1)*k:30*k;})();
     {const bw=26*k,bh=Math.max(3,3.5*k),bx=X-bw/2,by=Y-top-16*k,f=Math.max(0,c.hp/c.maxHp);ctx.save();ctx.globalAlpha=Math.min(1,al+0.2);ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(bx-1,by-1,bw+2,bh+2);ctx.fillStyle=f>0.5?'#5fe08a':f>0.25?'#ffd23f':'#ff5f5f';ctx.fillRect(bx,by,bw*f,bh);ctx.restore();}ctx.save();ctx.globalAlpha=al*(0.6+0.4*Math.sin(c.t*5));ctx.fillStyle=c.fx.heart||'#ff7ad0';const hx=X,hy=Y-top-24*k,hs=3.2*k;ctx.beginPath();ctx.moveTo(hx,hy+hs);ctx.bezierCurveTo(hx-hs*2,hy-hs*0.5,hx-hs*0.6,hy-hs*2,hx,hy-hs*0.6);ctx.bezierCurveTo(hx+hs*0.6,hy-hs*2,hx+hs*2,hy-hs*0.5,hx,hy+hs);ctx.fill();ctx.restore();}};

 // ---------------------------------------------------------------- MEGA EVOLUTION cutscene
 //  rainbow energy gathers -> a white/pink orb wraps the Pokemon -> it cracks and shatters ->
 //  the Mega symbol pops above its head. The new Mega sprite is revealed when the orb breaks.
 const megaSym=new Image();megaSym.src='assets/fx/mega-symbol.png?v=1';
 S.megaevo={cast(c){const p=c.player;c.R=Math.max(40,(Number(p.bodyH)||40)*0.8);c.H=Number(p.bodyH)||40;c.streaks=[];c.shards=[];c.cracks=[];c.sparks=[];
     for(let i=0;i<14;i++)c.streaks.push({a:i/14*TAU+rnd(-0.1,0.1),d:rnd(180,280),h:i*25});
     for(let i=0;i<7;i++){const a0=rnd(0,TAU),pts=[[0,0]];let r=0,a=a0;for(let j=0;j<5;j++){r+=rnd(0.15,0.26);a+=rnd(-0.5,0.5);pts.push([Math.cos(a)*r,Math.sin(a)*r]);}c.cracks.push({pts,at:0.72+i*0.05});}
     try{B()?.audio?.sfx?.('shinyGet');}catch(e){}kick(0.35);
     if(c.fx.cry){try{c.cry=new Audio(c.fx.cry);c.cry.preload='auto';const sv=Number(B()?.audio?.settings?.sfx);c.cry.volume=Math.max(0.15,Math.min(1,(Number.isFinite(sv)?sv:0.7)*1.2));}catch(e){}}
     return c;},
   update(c,dt){c.t+=dt;const p=c.player;if(!p)return false;c.x=p.x;c.y=p.y;
     // rumble: the screen shakes harder and harder while the orb cracks
     if(c.t>0.45&&c.t<1.1){c.rum=(c.rum||0)-dt;if(c.rum<=0){c.rum=0.07;kick(0.06+0.22*Math.max(0,(c.t-0.45)/0.65));}}
     if(c.t>=1.1&&!c.broke){c.broke=1;if(c.fx.newAnim&&p.megaForm===c.fx.form)p.anim=c.fx.newAnim;kick(1.15);
       if(c.cry){try{c.cry.currentTime=0;c.cry.play().catch(()=>{});}catch(e){}}
       const cy=c.y-c.H*0.5;ring(c.x,cy,c.R*0.6,c.R*3,'#ffffff',0.55,7);ring(c.x,cy,c.R*0.4,c.R*2.2,'#ff8ad8',0.5,5);burst(c.x,cy,'#ffb8e8',30,260);burst(c.x,cy,'#ffffff',20,200);
       for(let i=0;i<22;i++){const a=i/22*TAU+rnd(-0.15,0.15),sp2=rnd(160,330);c.shards.push({x:Math.cos(a)*c.R*0.8,y:Math.sin(a)*c.R*0.8,vx:Math.cos(a)*sp2,vy:Math.sin(a)*sp2-60,r:rnd(0,TAU),vr:rnd(-10,10),s:rnd(7,15),hue:(i*37)%360});}
       try{B()?.audio?.sfx?.('chest');}catch(e){}}
     for(const q of c.shards){q.vy+=380*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.r+=q.vr*dt;}
     if(c.t>1.1&&c.t<3&&Math.random()<0.5)c.sparks.push({a:rnd(0,TAU),r:rnd(20,46),t:c.t});
     return c.t<3.4;},
   draw(c,ctx,v){const k=v.k,X=v.sx(c.x),CY=v.sy(c.y-c.H*0.5),R=c.R*k,t=c.t;ctx.save();
     // 1) rainbow DNA ribbons converge into the Pokemon
     if(t<0.55){ctx.globalCompositeOperation='lighter';ctx.lineCap='round';for(const s2 of c.streaks){const q=Math.min(1,t/0.5),d=s2.d*(1-q)*k,a=s2.a+q*1.4;
         const x1=X+Math.cos(a)*d,y1=CY+Math.sin(a)*d*0.7,x0=X+Math.cos(a-0.35)*(d+60*k),y0=CY+Math.sin(a-0.35)*(d+60*k)*0.7;
         ctx.strokeStyle='hsla('+((s2.h+t*400)%360)+',100%,75%,'+(0.9*(1-Math.max(0,q-0.8)/0.2))+')';ctx.lineWidth=4*k;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo((x0+x1)/2+20*k,(y0+y1)/2-20*k,x1,y1);ctx.stroke();}}
     // 2) the orb
     if(t>0.15&&t<1.1){const q=Math.min(1,(t-0.15)/0.2),pulse=1+0.05*Math.sin(t*22)+(t>0.8?0.06*(t-0.8)/0.3:0),r=R*q*pulse;
       ctx.globalCompositeOperation='source-over';
       const g=ctx.createRadialGradient(X-r*0.3,CY-r*0.35,r*0.05,X,CY,r);g.addColorStop(0,'rgba(255,255,255,0.98)');g.addColorStop(0.55,'rgba(255,232,248,0.96)');g.addColorStop(0.85,'rgba(255,170,226,0.95)');g.addColorStop(1,'rgba(255,105,200,0.95)');
       ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,CY,r,0,TAU);ctx.fill();
       ctx.globalCompositeOperation='lighter';for(let i=0;i<12;i++){const a0=i/12*TAU+t*3;ctx.strokeStyle='hsla('+((i*30+t*300)%360)+',100%,72%,0.75)';ctx.lineWidth=3*k;ctx.beginPath();ctx.arc(X,CY,r*1.02,a0,a0+TAU/12+0.02);ctx.stroke();}
       ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(255,255,255,0.85)';ctx.beginPath();ctx.ellipse(X-r*0.38,CY-r*0.42,r*0.22,r*0.12,-0.6,0,TAU);ctx.fill();
       for(let i=0;i<6;i++){const a=t*4+i*1.05,rr=r*(0.3+0.5*((i*0.37+t)%1));sprite(ctx,'star','fairy',X+Math.cos(a)*rr,CY+Math.sin(a)*rr*0.8,0.5*k,0,0,0.8);}
       for(const cr of c.cracks){if(t<cr.at)continue;const g2=Math.min(1,(t-cr.at)/0.12);ctx.strokeStyle='rgba(255,255,255,0.95)';ctx.lineWidth=2.4*k;ctx.shadowColor='#ff5ab4';ctx.shadowBlur=8*k;ctx.beginPath();
         cr.pts.forEach(([x,y],i)=>{const px=X+x*r*g2*1.3,py=CY+y*r*g2*1.3;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();ctx.shadowBlur=0;}}
     // 3) shatter: flash + flying shards
     if(t>=1.1&&t<1.45&&v.box){const u=(t-1.1)/0.35;ctx.save();ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(255,236,250,'+(0.75*(1-u)*(1-u))+')';ctx.fillRect(v.box.left,v.box.top,v.box.width,v.box.height);ctx.restore();}   // full-screen flash
     if(t>=1.1){const u=t-1.1;if(u<0.3){ctx.globalCompositeOperation='lighter';glow(ctx,X,CY,R*(1.2+u*6),'rgba(255,255,255,'+(1-u/0.3)+')','rgba(255,140,220,0)');}
       ctx.globalCompositeOperation='source-over';for(const q of c.shards){const a=Math.max(0,1-u/1.1);if(!a)continue;ctx.save();ctx.globalAlpha=a;ctx.translate(X+q.x*k,CY+q.y*k);ctx.rotate(q.r);const sz=q.s*k;
         ctx.fillStyle=u<0.2?'#ffffff':'hsl('+(320+q.hue%40)+',100%,'+(85-q.hue%20)+'%)';ctx.beginPath();ctx.moveTo(-sz,-sz*0.6);ctx.lineTo(sz,-sz*0.3);ctx.lineTo(-sz*0.2,sz);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}}
     // 4) the Mega symbol above its head
     if(t>=1.15&&megaSym.complete&&megaSym.naturalWidth){const u=t-1.15,pop=u<0.18?u/0.18*1.3:u<0.32?1.3-(u-0.18)/0.14*0.3:1,fade=Math.min(1,Math.max(0,(3.4-t)/0.5)),
         hy=v.sy(c.y-c.H-24)-6*k*Math.sin(u*3),sh=58*k*pop,sw=sh*megaSym.naturalWidth/megaSym.naturalHeight;
       ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';glow(ctx,X,hy,sh*0.9,'rgba(255,255,255,0.85)','rgba(255,150,230,0)');
       for(const s2 of c.sparks){const w=t-s2.t;if(w>0.7)continue;const a=s2.a+w*3;sprite(ctx,'star','fairy',X+Math.cos(a)*s2.r*k,hy+Math.sin(a)*s2.r*0.6*k,0.45*k,0,0,1-w/0.7);}
       ctx.globalCompositeOperation='source-over';ctx.drawImage(megaSym,X-sw/2,hy-sh/2,sw,sh);}
     ctx.restore();}};

 // ---------------------------------------------------------------- ECHO'S TRUE POTENTIAL (LoverGare's Mega Gardevoir)
 //  a giant white moon orb rolls forward in the aim direction (as big as a tree), leaves damaging glitter behind,
 //  then a moon meteor crashes down where it ends for a big AOE.
 S.echoblast={cast(c){const p=c.player;c.aim=Number(p.aim)||0;c.R=c.fx.size||58;c.speed=c.fx.speed||430;c.range=wallClip(p.x,p.y,c.aim,c.fx.range||620);
     c.x=p.x+Math.cos(c.aim)*30;c.y=p.y+Math.sin(c.aim)*30;c.dist=0;c.skip=new Set();c.glit=[];c.gStep=0;c.parts=[];c.phase='roll';kick(0.15);
     ring(p.x,p.y,10,90,'#ffffff',0.35,5);return c;},
   update(c,dt){c.t+=dt;
     if(c.phase==='roll'){const st=Math.min(c.speed*dt,c.range-c.dist);c.dist+=st;c.x+=Math.cos(c.aim)*st;c.y+=Math.sin(c.aim)*st;
       hitCircle(c,c.x,c.y,c.R,{skip:c.skip,mult:1.4,knock:160,bigProps:true});
       c.gStep+=st;while(c.gStep>=36){c.gStep-=36;c.glit.push({x:c.x+rnd(-c.R*0.5,c.R*0.5),y:c.y+rnd(-c.R*0.4,c.R*0.4),t:0,life:2.6,tick:0,seed:Math.random()*99});}
       if(c.parts.length<40)for(let i=0;i<3;i++)c.parts.push({a:rnd(0,TAU),r:rnd(c.R*0.9,c.R*1.5),t:0,s:rnd(2,5)});
       if(c.dist>=c.range-0.5){c.phase='pop';c.pt=0;c.fx0=c.x;c.fy0=c.y;c.wskip=new Set();   // the ball bursts
         hitCircle(c,c.x,c.y,c.R*1.8,{mult:c.fx.popMult||1.8,knock:200,bigProps:true});kick(0.5);burst(c.x,c.y-20,'#ffffff',30,280);burst(c.x,c.y-20,'#ffb8ec',20,220);ring(c.x,c.y,c.R,c.R*2.2,'#ffffff',0.4,7);}}
     else if(c.phase==='pop'){c.pt+=dt;const wr=c.R+(c.fx.wave||300)*Math.min(1,c.pt/0.5);   // shockwave rolls outward, hitting what it passes
       for(const e of enemies()){if(c.wskip.has(e))continue;const d=Math.hypot(e.x-c.fx0,e.y-c.fy0);if(d<=wr+(e.r||10)){c.wskip.add(e);if(!c.ghost)applyHit(c,e,baseDmg(c,c.fx.waveMult||1.1),{knock:220},e.x-c.fx0,e.y-c.fy0);}}
       if(!c.ghost)hitProps(c,c.fx0,c.fy0,wr,baseDmg(c,c.fx.waveMult||1.1),true,c.pskip||(c.pskip=new Set()));   // the shockwave also breaks rocks, chests, grass
       if(c.pt>=0.55){c.phase='fall';c.ft=0;const n=Math.max(1,c.fx.meteors||1),px=-Math.sin(c.aim),py=Math.cos(c.aim),fx=Math.cos(c.aim),fy=Math.sin(c.aim);
         c.mets=[{x:c.fx0,y:c.fy0,at:0}];if(n>=2)c.mets.push({x:c.fx0+px*130+fx*60,y:c.fy0+py*130+fy*60,at:0.28});if(n>=3)c.mets.push({x:c.fx0-px*130+fx*60,y:c.fy0-py*130+fy*60,at:0.56});}}
     else if(c.phase==='fall'){c.ft+=dt;let all=true;const BR=c.fx.boom||175;
       for(const m of c.mets){if(!m.hit&&c.ft>=m.at+0.55){m.hit=true;m.bt=0;hitCircle(c,m.x,m.y,BR,{mult:c.fx.boomMult||2.6,knock:240,bigProps:true});kick(0.75);
           ring(m.x,m.y,10,BR*1.2,'#ffffff',0.6,8);ring(m.x,m.y,10,BR*0.8,'#ff9ad8',0.5,6);burst(m.x,m.y,'#ffe6f6',34,300);burst(m.x,m.y,'#b8d8ff',20,240);}
         if(m.hit)m.bt+=dt;if(!m.hit||m.bt<0.9)all=false;}
       if(all)c.phase='done';}
     for(const g of c.glit){g.t+=dt;g.tick-=dt;if(g.tick<=0&&g.t<g.life){g.tick=0.4;hitCircle(c,g.x,g.y,30,{mult:0.22,knock:0,noProps:true});}}
     for(const q of c.parts){q.t+=dt;q.a+=dt*4;}c.parts=c.parts.filter(q=>q.t<0.6);
     return c.phase!=='done'||c.glit.some(g=>g.t<g.life);},
   draw(c,ctx,v){const k=v.k;ctx.save();
     // glitter trail on the ground
     for(const g of c.glit){if(g.t>=g.life)continue;const a=Math.min(1,(g.life-g.t)/0.5),X=v.sx(g.x),Y=v.sy(g.y);ctx.globalCompositeOperation='lighter';glow(ctx,X,Y,26*k,'rgba(255,190,240,'+(0.28*a)+')','rgba(160,180,255,0)');
       for(let i=0;i<5;i++){const tw=0.5+0.5*Math.sin(c.t*9+g.seed+i*1.7),gx=X+Math.cos(g.seed+i*1.3)*20*k,gy=Y+Math.sin(g.seed*1.7+i)*9*k;star4(ctx,gx,gy,(2+3*tw)*k,a*tw,i%2?'#ffffff':(i%3?'#ffc8f0':'#c8dcff'));}}
     // the moon orb
     if(c.phase==='roll'){const X=v.sx(c.x),Y=v.sy(c.y)-c.R*0.6*k,R=c.R*k;ctx.globalCompositeOperation='lighter';
       for(let i=1;i<=3;i++){const bx=X-Math.cos(c.aim)*i*R*0.45,by=Y-Math.sin(c.aim)*i*R*0.45;glow(ctx,bx,by,R*(1-i*0.12),'rgba(255,220,250,'+(0.22-i*0.035)+')','rgba(200,180,255,0)');}
       glow(ctx,X,Y,R*1.5,'rgba(255,200,245,0.32)','rgba(140,170,255,0)');
       ctx.globalCompositeOperation='source-over';const g=ctx.createRadialGradient(X-R*0.3,Y-R*0.35,R*0.1,X,Y,R);g.addColorStop(0,'#ffffff');g.addColorStop(0.38,'#f9edff');g.addColorStop(0.78,'#c8b8ee');g.addColorStop(1,'#7966b5');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y,R,0,TAU);ctx.fill();
       ctx.fillStyle='rgba(225,205,245,0.55)';[[0.3,-0.2,0.18],[-0.35,0.25,0.13],[0.1,0.42,0.1],[-0.1,-0.45,0.08]].forEach(([cx,cy,cr])=>{ctx.beginPath();ctx.arc(X+cx*R,Y+cy*R,cr*R,0,TAU);ctx.fill();});
       ctx.strokeStyle='rgba(255,150,220,0.9)';ctx.lineWidth=3*k;ctx.beginPath();ctx.arc(X,Y,R*1.06,c.t*3,c.t*3+2.2);ctx.stroke();ctx.strokeStyle='rgba(150,190,255,0.9)';ctx.beginPath();ctx.arc(X,Y,R*1.12,-c.t*2.4,-c.t*2.4+1.8);ctx.stroke();
       // Lunar crescent and orbiting diamond glints, with a readable silhouette through bloom.
       ctx.save();ctx.beginPath();ctx.arc(X,Y,R,0,TAU);ctx.clip();ctx.strokeStyle='rgba(255,252,255,.95)';ctx.lineWidth=Math.max(2,R*.1);ctx.beginPath();ctx.arc(X-R*.07,Y-R*.06,R*.78,-2.2,.5);ctx.stroke();ctx.restore();
       ctx.globalCompositeOperation='lighter';for(let j=0;j<6;j++){const a=c.t*1.7+j*TAU/6,rr=R*(1.22+.08*Math.sin(c.t*4+j)),xx=X+Math.cos(a)*rr,yy=Y+Math.sin(a)*rr*.48;star4(ctx,xx,yy,(j%2?3:4)*k,.75,j%2?'#b9ddff':'#ffd0f2');}
       for(const q of c.parts){const a=1-q.t/0.6;star4(ctx,X+Math.cos(q.a)*q.r*k,Y+Math.sin(q.a)*q.r*0.7*k,q.s*k,a,'#ffffff');}}
     // the meteor falling onto the end point
     if(c.phase==='pop'||(c.phase==='fall'&&c.ft<0.3)){const u=c.phase==='pop'?c.pt:0.55+c.ft,X=v.sx(c.fx0),Y=v.sy(c.fy0),R0=c.R*k,W=(c.fx.wave||300)*k;
       ctx.globalCompositeOperation='lighter';
       if(u<0.3){const f=1-u/0.3;glow(ctx,X,Y-R0*0.6,R0*(1.4+u*5),'rgba(255,255,255,'+f+')','rgba(255,150,230,0)');
         ctx.fillStyle='rgba(255,255,255,'+f+')';ctx.beginPath();for(let i=0;i<16;i++){const r=i%2?R0*0.5:R0*(1.4+u*3),an=i/16*TAU+0.3;ctx.lineTo(X+Math.cos(an)*r,Y-R0*0.6+Math.sin(an)*r*0.75);}ctx.closePath();ctx.fill();}
       const wq=Math.min(1,u/0.5),wr=R0+W*wq,wa=Math.max(0,1-u/0.85);
       for(let j=0;j<3;j++){const rr=wr*(1-j*0.12);ctx.strokeStyle=j===0?'rgba(255,255,255,'+wa+')':(j===1?'rgba(255,150,225,'+(wa*0.8)+')':'rgba(160,170,255,'+(wa*0.6)+')');ctx.lineWidth=Math.max(2,(12-j*3)*k*wa);ctx.beginPath();ctx.ellipse(X,Y,rr,rr*0.5,0,0,TAU);ctx.stroke();}
       ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(230,220,210,'+(0.35*wa)+')';for(let i=0;i<14;i++){const an=i/14*TAU;ctx.beginPath();ctx.arc(X+Math.cos(an)*wr*0.95,Y+Math.sin(an)*wr*0.48-6*k,(8+14*wq)*k,0,TAU);ctx.fill();}}
     if(c.phase==='fall')for(const m of c.mets){const X=v.sx(m.x),Y=v.sy(m.y),R=(c.fx.boom||175)*k;ctx.save();
       if(!m.hit&&c.ft>=m.at){const q=Math.min(1,(c.ft-m.at)/0.55);
         ctx.strokeStyle='rgba(255,170,230,'+(0.4+0.5*q)+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.45,0,0,TAU);ctx.stroke();ctx.fillStyle='rgba(255,170,230,'+(0.12+0.15*q)+')';ctx.fill();
         const mx=X+(1-q)*240*k,my=Y-(1-q)*640*k,mr=34*k;ctx.globalCompositeOperation='lighter';const tl=ctx.createLinearGradient(mx,my,mx+150*k,my-380*k);tl.addColorStop(0,'rgba(255,220,250,0.9)');tl.addColorStop(1,'rgba(160,140,255,0)');
         ctx.strokeStyle=tl;ctx.lineCap='round';ctx.lineWidth=mr*1.6;ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+150*k,my-380*k);ctx.stroke();glow(ctx,mx,my,mr*2.2,'rgba(255,255,255,0.95)','rgba(255,150,230,0)');
         ctx.globalCompositeOperation='source-over';ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(mx,my,mr,0,TAU);ctx.fill();}
       if(m.hit&&m.bt<0.9){const u=m.bt/0.9;ctx.globalCompositeOperation='lighter';
         glow(ctx,X,Y,R*(0.5+u*1.2),'rgba(255,255,255,'+(1-u)+')','rgba(255,140,220,0)');ctx.strokeStyle='rgba(255,200,240,'+(1-u)+')';ctx.lineWidth=10*k*(1-u)+1;ctx.beginPath();ctx.ellipse(X,Y,R*(0.3+u*1.4),R*(0.3+u*1.4)*0.45,0,0,TAU);ctx.stroke();
         for(let i=0;i<12;i++){const a=i/12*TAU,d=R*(0.2+u*1.1);star4(ctx,X+Math.cos(a)*d,Y+Math.sin(a)*d*0.5-20*k*u,(6-4*u)*k,1-u,'#ffffff');}}
       ctx.restore();}
     ctx.restore();}};

 // ---------------------------------------------------------------- "I'LL CALL YOU... ECHO" (LoverGare's Psychic Z-move)
 //  4 huge psychic orbs circle Gardevoir and swing in and out across a big field, hitting whatever they touch;
 //  a psychic barrier shoves anyone who gets too close away; at the end the orbs collapse into a giant explosion.
 S.echoz={cast(c){c.dur=c.fx.dur||9;c.n=4;c.hits=new Map();c.ang=0;c.trails=[[],[],[],[]];kick(0.5);try{B()?.audio?.sfx?.('shinyGet');}catch(e){}return c;},
   update(c,dt){c.t+=dt;const p=c.player;if(!p)return false;c.x=p.x;c.y=p.y;const all=enemies();
     if(c.t<c.dur){c.ang+=dt*(2.4+0.6*Math.sin(c.t));const ph=(Math.sin(c.t*TAU/1.8)+1)/2,R=90+ph*(c.fx.reach||330);c.R=R;c.orbs=[];
       for(let i=0;i<c.n;i++){const a=c.ang+i*TAU/c.n,ox=p.x+Math.cos(a)*R,oy=p.y+Math.sin(a)*R*0.8;c.orbs.push({x:ox,y:oy});c.trails[i].push({x:ox,y:oy});if(c.trails[i].length>9)c.trails[i].shift();
         for(const e of all){if(Math.hypot(e.x-ox,e.y-oy)>34+(e.r||12))continue;const last=c.hits.get(e)||-9;if(c.t-last<0.3)continue;c.hits.set(e,c.t);applyHit(c,e,baseDmg(c,1.6),{knock:180},e.x-p.x,e.y-p.y);}}
       for(const e of all){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<(c.fx.barrier||130)){const push=(e.boss?90:420)*dt*(1-d/(c.fx.barrier||130))+8;e.x+=dx/d*push;e.y+=dy/d*push;}}
       if(Math.random()<dt*6){const o=c.orbs[(Math.random()*4)|0];burst(o.x,o.y-10,'#ff7ad8',4,90);}}
     else if(!c.boom){c.boom=1;hitCircle(c,p.x,p.y,c.fx.boomR||420,{mult:c.fx.boomMult||6,knock:300});kick(1.2);ring(p.x,p.y,20,(c.fx.boomR||420)*1.1,'#ffffff',0.7,9);ring(p.x,p.y,10,(c.fx.boomR||420)*0.8,'#ff5ab4',0.6,7);burst(p.x,p.y-20,'#ff9ad8',50,360);burst(p.x,p.y-20,'#ffffff',30,280);}
     return c.t<c.dur+1.1;},
   draw(c,ctx,v){const k=v.k,X=v.sx(c.x),Y=v.sy(c.y);ctx.save();
     if(c.t<c.dur){const fade=Math.min(1,c.t/0.3,(c.dur-c.t)/0.3+0.3),FR=((c.fx.reach||330)+110)*k;
       // psychic field on the ground
       ctx.globalAlpha=0.55*fade;const g=ctx.createRadialGradient(X,Y,0,X,Y,FR);g.addColorStop(0,'rgba(255,120,220,0.18)');g.addColorStop(0.8,'rgba(160,80,255,0.12)');g.addColorStop(1,'rgba(160,80,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(X,Y,FR,FR*0.8,0,0,TAU);ctx.fill();
       ctx.globalAlpha=fade;ctx.strokeStyle='rgba(255,140,230,0.7)';ctx.lineWidth=2;ctx.setLineDash([10*k,8*k]);ctx.lineDashOffset=-c.t*60;ctx.beginPath();ctx.ellipse(X,Y,FR*0.97,FR*0.97*0.8,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
       // barrier bubble
       const BR=(c.fx.barrier||130)*k;ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,180,240,'+(0.45+0.25*Math.sin(c.t*8))+')';ctx.lineWidth=3*k;ctx.beginPath();ctx.ellipse(X,Y-20*k,BR,BR*0.8,0,0,TAU);ctx.stroke();
       glow(ctx,X,Y-20*k,BR,'rgba(255,150,230,0.12)','rgba(255,150,230,0)');
       // tethers between orbs
       if(c.orbs){ctx.strokeStyle='rgba(255,170,240,0.5)';ctx.lineWidth=2*k;ctx.beginPath();c.orbs.forEach((o,i)=>{const ox=v.sx(o.x),oy=v.sy(o.y)-26*k;i?ctx.lineTo(ox,oy):ctx.moveTo(ox,oy);});ctx.closePath();ctx.stroke();
         c.orbs.forEach((o,i)=>{c.trails[i].forEach((q,j)=>{glow(ctx,v.sx(q.x),v.sy(q.y)-26*k,30*k*(j/9),'rgba(255,90,200,0.22)','rgba(150,60,255,0)');});
           const ox=v.sx(o.x),oy=v.sy(o.y)-26*k,R=32*k;glow(ctx,ox,oy,R*2.2,'rgba(255,120,220,0.55)','rgba(140,60,255,0)');
           ctx.globalCompositeOperation='source-over';const gg=ctx.createRadialGradient(ox-R*0.3,oy-R*0.3,R*0.1,ox,oy,R);gg.addColorStop(0,'#ffffff');gg.addColorStop(0.35,'#ffb8ec');gg.addColorStop(0.8,'#e040b8');gg.addColorStop(1,'#8a2cff');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(ox,oy,R,0,TAU);ctx.fill();
           ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2*k;ctx.beginPath();ctx.arc(ox,oy,R*1.15,c.t*6+i,c.t*6+i+2);ctx.stroke();});}}
     else{const u=Math.min(1,(c.t-c.dur)/1.1),R=(c.fx.boomR||420)*k;ctx.globalCompositeOperation='lighter';
       if(u<0.25&&v.box){ctx.fillStyle='rgba(255,220,245,'+(0.7*(1-u/0.25))+')';ctx.fillRect(v.box.left,v.box.top,v.box.width,v.box.height);}
       glow(ctx,X,Y-20*k,R*(0.3+u),'rgba(255,255,255,'+(1-u)+')','rgba(255,80,200,0)');ctx.strokeStyle='rgba(255,140,230,'+(1-u)+')';ctx.lineWidth=12*k*(1-u)+1;ctx.beginPath();ctx.ellipse(X,Y,R*(0.2+u),R*(0.2+u)*0.8,0,0,TAU);ctx.stroke();}
     ctx.restore();}};

 // ---------------------------------------------------------------- DYNAMAX (ported from the Android port of PokeSurvivor, adapted)
 //  dynaura: red Dynamax aura around the giant Pokemon (ground glow, rising red/violet mist, sparks)
 S.dynaura={cast(c){c.life=c.fx.life||60;return c;},
   update(c,dt){c.t+=dt;if(c.fx.done&&c.fx.done())return false;return c.t<c.life;},
   draw(c,ctx,v){const p=c.player;if(!p)return;const k=v.k,sc=c.fx.scale?c.fx.scale():1.6,h=(Number(p.bodyH)||40)*sc,w=(Number(p.r)||14)*1.8*sc,X=v.sx(p.x),Y=v.sy(p.y),t=c.t,beat=0.5+0.5*Math.sin(t*4),fade=Math.min(1,t/0.4,(c.life-t)/0.4);
     ctx.save();ctx.globalAlpha=fade;
     ctx.fillStyle='rgba(230,20,64,'+(0.3+0.1*beat)+')';ctx.beginPath();ctx.ellipse(X,Y,w*(1.7+0.12*beat)*k,w*0.55*k,0,0,TAU);ctx.fill();
     ctx.globalCompositeOperation='lighter';const cy=Y-h*0.5*k;
     for(let i=0;i<4;i++){const q=i/3;glow(ctx,X,cy,(Math.max(w,h*0.5)*(1.55-q*0.55)+beat*4)*k,'rgba(255,'+Math.round(40+80*q)+','+Math.round(90+60*q)+','+(0.05+0.02*q)+')','rgba(255,30,80,0)');}
     for(let i=0;i<14;i++){const ph=(t*0.55+i*0.0714)%1,a2=t*1.6+i*0.9,rr=w*(0.9+0.35*Math.sin(t*2+i)),px=X+Math.cos(a2)*rr*k,py=cy+(h*0.55-ph*h*1.25)*k+Math.sin(a2)*rr*0.3*k,al=Math.sin(ph*Math.PI)*0.22;
       const mix=0.5+0.5*Math.sin(i);ctx.fillStyle='rgba('+Math.round(230-100*mix)+','+Math.round(20+5*mix)+','+Math.round(64+110*mix)+','+al+')';ctx.beginPath();ctx.arc(px,py,(3+4*(1-ph)+1.5*beat)*k,0,TAU);ctx.fill();}
     for(let i=0;i<9;i++){const ph2=(t*0.9+i*0.111)%1,xx=Math.sin(i*7.3+t*1.7)*w*1.1*k,yy=cy+(h*0.5-ph2*h*1.5)*k,sz=(2+2*(1-ph2))*k;ctx.fillStyle='rgba(255,217,230,'+(Math.sin(ph2*Math.PI)*0.9)+')';ctx.fillRect(X+xx-sz/2,yy-sz/2,sz,sz);}
     ctx.restore();}};
 //  maxwave: a Max shockwave of your type; every 3rd one is big (bigger radius, more damage, stars)
 S.maxwave={cast(c){const p=c.player;c.x=p.x;c.y=p.y;c.R=c.fx.radius||280;c.done=false;const st=c.fx.status||{};
     hitCircle(c,c.x,c.y,c.R,{knock:c.fx.big?260:140,stun:st.stun,slow:st.slow,slowDur:1.6});
     if(st.poison&&!c.ghost)for(const e of enemies())if(Math.hypot(e.x-c.x,e.y-c.y)<c.R&&e.applyPoison)e.applyPoison(1);
     kick(c.fx.big?0.35:0.15);const col=typeColor(c);ring(c.x,c.y,10,c.R,col,0.5,c.fx.big?7:4);if(c.fx.big){ring(c.x,c.y,10,c.R*0.7,'#ffffff',0.45,5);burst(c.x,c.y-20,col,26,260);}
     c.stars=[];if(c.fx.big)for(let i=0;i<14;i++)c.stars.push(i/14*TAU);return c;},
   update(c,dt){c.t+=dt;return c.t<0.7;},
   draw(c,ctx,v){const k=v.k,X=v.sx(c.x),Y=v.sy(c.y),u=c.t/0.7,R=c.R*k*Math.min(1,0.2+u*1.3),col=c.fx.colors||['#ffffff','#ff6a8a','#ff1a4a'];ctx.save();ctx.globalCompositeOperation='lighter';
     glow(ctx,X,Y,R,rgba(col[1],0.25*(1-u)),rgba(col[2],0));ctx.strokeStyle=rgba(col[1],0.95*(1-u));ctx.lineWidth=Math.max(2,(c.fx.big?12:7)*k*(1-u));ctx.beginPath();ctx.ellipse(X,Y,R,R*0.55,0,0,TAU);ctx.stroke();
     ctx.strokeStyle='rgba(255,40,90,'+(0.7*(1-u))+')';ctx.lineWidth=Math.max(1,4*k*(1-u));ctx.beginPath();ctx.ellipse(X,Y,R*0.85,R*0.47,0,0,TAU);ctx.stroke();
     for(const a of c.stars)sprite(ctx,'star',c.fx.pal||c.move.type,X+Math.cos(a)*R,Y+Math.sin(a)*R*0.55-14*k*u,1.6*k,0,0,1-u);ctx.restore();}};

 // ---------------------------------------------------------------- SHINY FLAIR
 //  shiny Pokemon (you, and shiny wild ones) get twinkling stars above their head and leave sparkles when they move
 const shinySp=[];let shinyLast=0;
 function star4(ctx,x,y,r,a,col){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();for(let i=0;i<8;i++){const rr=i%2?r*0.32:r,an=i/8*TAU-Math.PI/2;ctx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr);}ctx.closePath();ctx.fill();ctx.restore();}
 function shinyOf(o){return !!(o&&!o.dead&&((o.anim&&o.anim.shiny)||o.shiny===true||o.isShiny===true||(o.__skin&&o.__skin.prev&&o.__skin.prev.shiny)));}
 function drawShiny(ctx,v){const now=performance.now()/1000,dt=Math.min(0.05,shinyLast?now-shinyLast:0);shinyLast=now;
   const list=[];const p=B()?.game?.player;if(shinyOf(p))list.push(p);for(const e of enemies())if(shinyOf(e))list.push(e);
   for(const o of list){
     const mv=Math.hypot(o.x-(o.__shx??o.x),o.y-(o.__shy??o.y));o.__shx=o.x;o.__shy=o.y;
     if(mv>0.6){o.__shT=(o.__shT||0)-dt;if(o.__shT<=0){o.__shT=0.035;const h=Number(o.bodyH)||36;shinySp.push({x:o.x+rnd(-14,14),y:o.y-rnd(2,h*0.9),vy:-rnd(20,45),t:0,life:rnd(0.5,0.9),r:rnd(3.5,6.5),c:Math.random()<0.5?'#fff6c0':'#ffffff'});}}
     const h=Number(o.bodyH)||36,X=v.sx(o.x),Y=v.sy(o.y-h*0.92-2),k=v.k;
     for(let i=0;i<3;i++){const a=now*1.6+i*TAU/3,tw=0.55+0.45*Math.sin(now*6+i*2.1);
       star4(ctx,X+Math.cos(a)*14*k,Y+Math.sin(a)*4.5*k-(i===1?3*k:0),(4.6+2.2*tw)*k,0.65+0.35*tw,i===1?'#ffe36a':'#ffffff');}}
   for(let i=shinySp.length-1;i>=0;i--){const q=shinySp[i];q.t+=dt;q.y+=q.vy*dt;if(q.t>=q.life){shinySp.splice(i,1);continue;}
     const f=q.t/q.life;star4(ctx,v.sx(q.x),v.sy(q.y),q.r*v.k*(1-f*0.5)*(f<0.2?f/0.2:1),1-f,q.c);}
   if(shinySp.length>220)shinySp.splice(0,shinySp.length-220);}

 // ---------------------------------------------------------------- ORIGIN PULSE (Kyogre)
 //  Glowing blue orbs spawn around Kyogre, each tracks its own nearest foe and fires bright blue
 //  beams that chain from foe to foe. When an orb runs out it bursts into bubbles: splash damage +
 //  a 25% slow. move.count = orbs, move.pierce = extra foes each beam chains to.
 //  The evolved form (Origin Pulse (Primal), move.primalPulse) has bigger orbs, a bigger burst and executes foes below 5% HP.
 const opSlowed=new Set();
 function opSlow(e,dur){if(!e||e.dead)return;e.__opSlowT=Math.max(e.__opSlowT||0,dur);if(!opSlowed.has(e)){e.__opX=e.x;e.__opY=e.y;opSlowed.add(e);}}
 // 25% slow: give back a quarter of each step the foe takes (skipped while the game's own 50% slow is on).
 function opSlowTick(dt){for(const e of opSlowed){if(e.dead||!(e.__opSlowT>0)){opSlowed.delete(e);delete e.__opSlowT;continue;}
   e.__opSlowT-=dt;if(!(Number(e.slowT)>0)){const dx=e.x-e.__opX,dy=e.y-e.__opY;if(dx*dx+dy*dy<900){e.x-=dx*0.25;e.y-=dy*0.25;}}e.__opX=e.x;e.__opY=e.y;}}
 // Origin Pulse (Primal) annihilates any foe its beams or bursts leave below 5% HP.
 function opExecute(c,e){if(!c.pr||!e||e.dead)return;const hp=Number(e.hp),max=Number(e.maxHp);if(!(hp>0&&max>0&&hp<=max*(c.fx.execute||0.05)))return;
   try{c.hit(c.player,e,hp*50+1000,'#ffffff',0.01,0,0,c.move);}catch(err){}
   if(!e.dead&&Number(e.hp)>0&&typeof e.hurt==='function')try{e.hurt(Number(e.hp)*50+1000,'#ffffff',0,0,0);}catch(err){}
   c.kills.push({x:e.x,y:e.y-(Number(e.bodyH)||24)*0.5,t:0});burst(e.x,e.y,'#bff6ff',10,180);}
 S.originpulse={cast(c){const p=c.player,n=Math.max(1,Math.round(c.move.count||2)),pr=!!c.move.primalPulse;
     c.jumps=Math.max(0,Math.round(c.move.pierce||0));c.life=c.fx.life||3.6;c.fire=c.fx.fireEvery||0.55;c.reach=c.fx.reach||300;c.hop=c.fx.hop||190;
     c.size=(pr?15:11);c.blast=(c.fx.blast||80)*(pr?1.45:1);c.pr=pr;c.list=[];c.beams=[];c.pops=[];c.kills=[];
     const h=(Number(p.bodyH)||40)*0.55;
     for(let i=0;i<n;i++){const a=i/n*TAU-Math.PI/2;c.list.push({a,x:p.x+Math.cos(a)*34,y:p.y+Math.sin(a)*22,h,t:0,fireT:0.35+i*0.12,tg:null,dead:false,ph:rnd(0,TAU)});}
     return c;},
   update(c,dt){c.t+=dt;const p=c.player,all=enemies();
     for(const o of c.list){if(o.dead)continue;o.t+=dt;
       if(o.t<0.35){o.a+=dt*7;o.x+=(p.x+Math.cos(o.a)*34-o.x)*Math.min(1,dt*14);o.y+=(p.y+Math.sin(o.a)*22-o.y)*Math.min(1,dt*14);continue;}
       // each orb keeps its own target: the nearest foe no other orb is chasing (falls back to the nearest one)
       if(!o.tg||o.tg.dead){const taken=new Set(c.list.filter(q=>q!==o&&!q.dead&&q.tg).map(q=>q.tg));
         o.tg=nearest(o.x,o.y,700,all.filter(e=>!taken.has(e)))||nearest(o.x,o.y,700,all);}
       let gx=p.x+Math.cos(o.a)*60,gy=p.y+Math.sin(o.a)*40;
       if(o.tg){const dx=o.x-o.tg.x,dy=o.y-o.tg.y,d=Math.hypot(dx,dy)||1;gx=o.tg.x+dx/d*55;gy=o.tg.y+dy/d*55;}
       const dx=gx-o.x,dy=gy-o.y,d=Math.hypot(dx,dy),step=Math.min(d,(c.fx.speed||330)*dt);if(d>0.5){o.x+=dx/d*step;o.y+=dy/d*step;}
       o.fireT-=dt;
       if(o.fireT<=0&&o.tg&&Math.hypot(o.tg.x-o.x,o.tg.y-o.y)<c.reach){o.fireT=c.fire;
         // the beam strikes the target, then chains to the nearest foes not yet hit
         const pts=[{x:o.x,y:o.y-o.h}],hit=new Set();let cur=o.tg,mult=1;
         for(let j=0;j<=c.jumps&&cur;j++){hit.add(cur);pts.push({x:cur.x,y:cur.y-(Number(cur.bodyH)||24)*0.5});
           if(!c.ghost){applyHit(c,cur,baseDmg(c,mult),{knock:25},cur.x-o.x,cur.y-o.y);opExecute(c,cur);}
           mult*=0.88;cur=nearest(cur.x,cur.y,c.hop,all.filter(e=>!hit.has(e)));}
         c.beams.push({pts,t:0,seed:rnd(0,99)});kick(0.02);}
       if(o.t>c.life){o.dead=true;c.pops.push({x:o.x,y:o.y,h:o.h,t:0,b:Array.from({length:c.pr?18:12},()=>({a:rnd(0,TAU),v:rnd(40,140),r:rnd(3,8),up:rnd(10,50)}))});
         if(!c.ghost){hitCircle(c,o.x,o.y,c.blast,{mult:c.pr?1.6:1.3,knock:70});for(const e of enemies())if(Math.hypot(e.x-o.x,e.y-o.y)<c.blast+(e.r||10)){opSlow(e,c.fx.slowDur||2.5);opExecute(c,e);}}
         for(let i=0;i<(c.pr?14:9);i++)sp('bubble','water',o.x+rnd(-c.blast,c.blast)*0.6,o.y+rnd(-c.blast,c.blast)*0.4,{vy:-rnd(30,90),life:rnd(0.5,0.9)});
         ring(o.x,o.y,8,c.blast,'#7fe4ff',0.45,4);kick(0.05);}}
     for(const b of c.beams)b.t+=dt;c.beams=c.beams.filter(b=>b.t<0.28);
     for(const q of c.pops)q.t+=dt;c.pops=c.pops.filter(q=>q.t<0.7);
     for(const q of c.kills)q.t+=dt;c.kills=c.kills.filter(q=>q.t<0.45);
     return c.list.some(o=>!o.dead)||c.beams.length>0||c.pops.length>0||c.kills.length>0;},
   draw(c,ctx,v){const k=v.k,col=c.pr?['#ffffff','#5ff2ff','#1f6dff']:['#ffffff','#7fd8ff','#2a8cff'];
     ctx.save();ctx.globalCompositeOperation='lighter';
     for(const b of c.beams){const f=1-b.t/0.28;
       for(const [w,cl,a] of [[9,col[2],0.45],[4.5,col[1],0.85],[1.8,col[0],1]]){ctx.strokeStyle=rgba(cl,a*f);ctx.lineWidth=w*k*(c.pr?1.3:1);ctx.lineCap='round';ctx.beginPath();
         b.pts.forEach((q,i)=>{const X=v.sx(q.x),Y=v.sy(q.y);if(!i){ctx.moveTo(X,Y);return;}const pq=b.pts[i-1],mx=(v.sx(pq.x)+X)/2,my=(v.sy(pq.y)+Y)/2,j=Math.sin(b.seed+i*3+b.t*40)*8*k;ctx.quadraticCurveTo(mx+j,my-j,X,Y);});ctx.stroke();}
       for(let i=1;i<b.pts.length;i++)glow(ctx,v.sx(b.pts[i].x),v.sy(b.pts[i].y),16*k*f,rgba(col[0],0.8*f),rgba(col[1],0));}
     for(const o of c.list){if(o.dead)continue;const X=v.sx(o.x),Y=v.sy(o.y-o.h-Math.sin(c.t*4+o.ph)*4),pulse=1+0.12*Math.sin(c.t*9+o.ph),R=c.size*k*pulse,
         fadeIn=Math.min(1,o.t/0.2),fadeOut=Math.min(1,(c.life-o.t)/0.25+0.4);ctx.globalAlpha=fadeIn*Math.min(1,fadeOut);
       glow(ctx,X,Y,R*3.4,rgba(col[2],0.5),rgba(col[2],0));glow(ctx,X,Y,R*1.8,rgba(col[1],0.9),rgba(col[1],0));glow(ctx,X,Y,R*0.9,rgba(col[0],1),rgba(col[0],0.2));
       ctx.strokeStyle=rgba(col[1],0.8);ctx.lineWidth=1.5*k;ctx.beginPath();ctx.ellipse(X,Y,R*1.5,R*0.55,c.t*3+o.ph,0,TAU);ctx.stroke();
       if(c.pr){ctx.beginPath();ctx.ellipse(X,Y,R*1.5,R*0.55,-c.t*3-o.ph,0,TAU);ctx.stroke();}}
     ctx.globalAlpha=1;
     for(const q of c.kills){const u=q.t/0.45,X=v.sx(q.x),Y=v.sy(q.y);glow(ctx,X,Y,(18+46*u)*k,rgba('#ffffff',1-u),rgba(col[1],0));
       ctx.strokeStyle=rgba(col[1],1-u);ctx.lineWidth=3*k*(1-u);ctx.beginPath();ctx.arc(X,Y,(10+40*u)*k,0,TAU);ctx.stroke();}
     for(const q of c.pops){const u=q.t/0.7,X=v.sx(q.x),Y=v.sy(q.y-q.h*(1-u));
       glow(ctx,X,Y,c.blast*k*(0.3+0.7*Math.min(1,u*3)),rgba(col[1],0.6*(1-u)),rgba(col[2],0));
       for(const b of q.b){const bx=X+Math.cos(b.a)*b.v*u*k,by=Y+Math.sin(b.a)*b.v*u*0.6*k-b.up*u*k;
         ctx.strokeStyle=rgba('#d8f6ff',0.9*(1-u));ctx.lineWidth=1.4*k;ctx.beginPath();ctx.arc(bx,by,b.r*k*(0.6+u*0.6),0,TAU);ctx.stroke();
         ctx.fillStyle=rgba('#ffffff',0.7*(1-u));ctx.beginPath();ctx.arc(bx-b.r*0.3*k,by-b.r*0.3*k,Math.max(0.8,b.r*0.22*k),0,TAU);ctx.fill();}}
     ctx.restore();}};

 // ---------------------------------------------------------------- PRECIPICE BLADES (Groudon)
 //  A full wall of volcanic rock spikes erupts outward from Groudon, impaling every foe it reaches; the strongest
 //  foes on screen are each impaled by a GIANT spike that stuns them for 5 s. Everything hit burns for 10 s.
 //  move.radius = wall size, move.count = giant spikes. The evolved form (Precipice Blades (Primal),
 //  move.primalBlades) keeps its outer wall standing for a few seconds and that wall deletes enemy projectiles.
 function pbBurn(e){if(typeof e.applyBurn==='function'){e.applyBurn(1);if(Number.isFinite(e.burnT))e.burnT=Math.max(e.burnT,10);}}
 function pbStun(e,dur){if(typeof e.applyStun==='function')e.applyStun(dur);e.stunT=Math.max(Number(e.stunT)||0,dur);}   // bosses too
 // Footprints in world units: a spike sprite stands on (x,y) and rises 56 sheet pixels; Groudon stands on (px,py).
 const PB_PX=1.05;
 function pbRect(x,y,s){const w=32*PB_PX*s,h=56*PB_PX*s;return {l:x-w*.38,r:x+w*.38,t:y-h*.92,b:y+6*s};}
 function pbBody(p,m){const r=Number(p.r)||16,h=Math.max(Number(p.bodyH)||40,r*2),w=Math.max(r*1.4,h*.5);return {l:p.x-w-m,r:p.x+w+m,t:p.y-h-m,b:p.y+r*.6+m};}
 const pbHits=(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t;
 function pbBlocked(x,y){   // walls and solid props (trees, rocks...) never have spikes growing through them
   try{const W=B()?.world;if(W&&typeof W.isWall==='function'&&W.isWall(x,y))return true;}catch(e){}
   try{const E=window.PS_HOOPA_ENGINE;for(const q of E.World.visibleProps(E.Camera)||[])if(q&&q.solid&&Math.abs(q.x-x)<60&&Math.hypot(q.x-x,q.y-y)<(q.r||12)+16)return true;}catch(e){}
   return false;
 }
 // A giant spike stands where its target is, but is pushed out until it no longer covers Groudon or another giant.
 function pbPlaceGiant(c,g,x,y){
   const p=c.player,body=pbBody(p,14),S=c.pr?3.6:3.2;let a=Math.atan2(y-p.y,x-p.x),d=Math.hypot(x-p.x,y-p.y);
   for(let i=0;i<40;i++){const gx=p.x+Math.cos(a)*d,gy=p.y+Math.sin(a)*d,rect=pbRect(gx,gy,S);
     if(!pbHits(rect,body)&&!c.giants.some(o=>o!==g&&o.placed&&Math.abs(o.x-gx)<46*S*.5&&Math.abs(o.y-gy)<30))return [gx,gy];
     d+=10;if(i%8===7)a+=.35;}
   return [p.x+Math.cos(a)*d,p.y+Math.sin(a)*d];
 }
 S.precipice={cast(c){const p=c.player,R=Math.max(90,Number(c.move.radius)||130),pr=!!c.move.primalBlades;
     c.x=p.x;c.y=p.y;c.R=R;c.pr=pr;c.wave=.35;c.life=pr?(c.fx.wallLife||3):1.15;c.spikes=[];c.hitSet=new Set();c.giants=[];c.cuts=[];
     // Spikes are scattered at random over a ring around Groudon (never on him or right beside him), each keeping a
     // minimum gap from the others (no clumps, no overlaps), and never inside walls, trees or rocks.
     const minR=Math.max(62,(Number(p.r)||16)*3),gap=46,body=pbBody(p,12),want=Math.min(pr?75:55,Math.round(Math.PI*(R*R-minR*minR)/(gap*gap*1.6)));
     const cell=gap/Math.SQRT2,grid=new Map(),gk=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell);
     for(let tries=0;tries<want*30&&c.spikes.length<want;tries++){
       const a=rnd(0,TAU),r=Math.sqrt(rnd(minR*minR,R*R)),x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r*.85,sc=r>R*.78?rnd(1.05,1.3):rnd(.75,1.05);
       let ok=true;const cx=Math.floor(x/cell),cy=Math.floor(y/cell);
       for(let j=-2;j<=2&&ok;j++)for(let i=-2;i<=2&&ok;i++){const q=grid.get((cx+i)+','+(cy+j));if(q&&Math.hypot(q.x-x,(q.y-y)*1.25)<gap)ok=false;}
       if(!ok||pbHits(pbRect(x,y,sc),body)||pbBlocked(x,y))continue;
       const sp={x,y,d:r/R*c.wave,v:(Math.random()*4)|0,s:sc,outer:r>R*.78};c.spikes.push(sp);grid.set(gk(x,y),sp);
     }
     // the strongest foes on screen (bosses first, then by max HP) each get a giant spike
     const n=Math.max(0,Math.round(c.move.count||1)),foes=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<620)
       .sort((a,b)=>(b.boss?1:0)-(a.boss?1:0)||(Number(b.maxHp)||0)-(Number(a.maxHp)||0)||(Number(b.hp)||0)-(Number(a.hp)||0));
     for(let i=0;i<n;i++){const e=foes[i],a=rnd(0,TAU),r=rnd(Math.max(minR+40,R*.45),R);
       c.giants.push({e,x:e?e.x:p.x+Math.cos(a)*r,y:e?e.y:p.y+Math.sin(a)*r*.85,t:-(.18+i*(pr?.07:.16)),v:(Math.random()*4)|0,done:false,placed:false,giant:true});}
     kick(pr?.35:.2);return c;},
   update(c,dt){c.t+=dt;const waveR=c.R*Math.min(1,c.t/c.wave);
     if(!c.ghost&&c.t<c.wave+.1)for(const e of enemies()){if(c.hitSet.has(e))continue;if(Math.hypot(e.x-c.x,(e.y-c.y)/.85)>waveR+(e.r||10))continue;
       c.hitSet.add(e);applyHit(c,e,baseDmg(c),{knock:60},e.x-c.x,e.y-c.y);pbBurn(e);}
     if(c.t<c.wave&&Math.random()<dt*30){const a=rnd(0,TAU);burst(c.x+Math.cos(a)*waveR,c.y+Math.sin(a)*waveR*.85,'#ff8a3d',4,120);}
     for(const g of c.giants){const was=g.t;g.t+=dt;if(g.e&&!g.e.dead&&g.t<0){g.x=g.e.x;g.y=g.e.y;}
       if(was<0&&g.t>=0&&!g.done){g.done=true;[g.x,g.y]=pbPlaceGiant(c,g,g.x,g.y);g.placed=true;
         {const S=c.pr?3.6:3.2,gr=pbRect(g.x,g.y,S);for(const sp of c.spikes)if(!sp.gone&&pbHits(pbRect(sp.x,sp.y,sp.s),gr))sp.gone=c.t;}kick(c.pr?.18:.28);ring(g.x,g.y,10,90,'#ff7a2a',.5,6);burst(g.x,g.y,'#ffb347',18,220);
         for(let i=0;i<10;i++)sp('rock','ground',g.x+rnd(-20,20),g.y,{vx:rnd(-120,120),vy:-rnd(120,260),life:.7,grav:520});
         if(!c.ghost){const hitList=g.e&&!g.e.dead?[g.e]:enemies().filter(e=>Math.hypot(e.x-g.x,e.y-g.y)<40+(e.r||10));
           for(const e of hitList){applyHit(c,e,baseDmg(c,c.fx.giantMult||3),{knock:0},0.01,0);pbStun(e,c.fx.stun||5);pbBurn(e);}}}}
     // Primal: the standing wall swallows enemy projectiles
     if(c.pr&&!c.ghost&&c.t<c.life){const P=B()?.projectiles;if(P&&typeof P.all==='function')for(const q of P.all().slice()){if(!q||q.friendly)continue;
       if(Math.hypot(q.x-c.x,(q.y-c.y)/.85)<c.R+14){try{P.remove(q);}catch(e){}burst(q.x,q.y,'#ffb347',6,110);c.cuts.push({x:q.x,y:q.y,t:0});}}}
     for(const q of c.cuts)q.t+=dt;c.cuts=c.cuts.filter(q=>q.t<.3);
     // Groudon may walk on after casting: any spike he would stand in sinks back into the ground
     {const body=pbBody(c.player,6);for(const sp of c.spikes)if(!sp.gone&&pbHits(pbRect(sp.x,sp.y,sp.s),body))sp.gone=c.t;
      for(const g of c.giants)if(g.placed&&!g.gone&&pbHits(pbRect(g.x,g.y,c.pr?3.6:3.2),body))g.gone=c.t;}
     return c.t<c.life+.3||c.giants.some(g=>g.t<1.7);},
   draw(c,ctx,v){const k=v.k,px=1.05*k,img=spikeImg.complete&&spikeImg.naturalWidth?spikeImg:null,waveR=c.R*Math.min(1,c.t/c.wave);ctx.imageSmoothingEnabled=false;
     // glowing magma front of the eruption
     if(c.t<c.wave+.25){const f=c.t<c.wave?1:1-(c.t-c.wave)/.25;ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba('#ff8a3d',.7*f);ctx.lineWidth=8*k;
       ctx.beginPath();ctx.ellipse(v.sx(c.x),v.sy(c.y),waveR*k,waveR*.85*k,0,0,TAU);ctx.stroke();ctx.restore();}
     if(!img)return;
     const draw=(x,y,vv,s,f,glowA)=>{const w=32*px*s,h=56*px*s,X=v.sx(x),Y=v.sy(y)+3*px*s;
       ctx.globalAlpha=.85;ctx.drawImage(img,vv*32,56,32,16,X-w/2,Y-16*px*s/2,w,16*px*s);ctx.globalAlpha=1;
       ctx.drawImage(img,vv*32,0,32,56*f,X-w/2,Y-h*f,w,h*f);
       if(glowA>0){ctx.save();ctx.globalCompositeOperation='lighter';glow(ctx,X,Y-h*f*.45,w*.9,rgba('#ff9a3d',glowA),rgba('#ff5a1a',0));ctx.restore();}};
     // spikes and giants are drawn back-to-front together so nothing pokes through what stands in front of it
     const list=[];for(const sp of c.spikes)list.push(sp);for(const g of c.giants)if(g.placed)list.push(g);list.sort((a,b)=>a.y-b.y);
     for(const s of list){
       if(s.giant){const g=s;let f=g.t<.1?g.t/.1:(g.t>1.35?Math.max(0,1-(g.t-1.35)/.3):1);if(g.gone)f=Math.min(f,Math.max(0,1-(c.t-g.gone)/.15));if(f>0)draw(g.x,g.y,g.v,c.pr?3.6:3.2,f,g.t<.35?.9*(1-g.t/.35):.15);continue;}
       const u=c.t-s.d;if(u<0)continue;const end=s.outer&&c.pr?c.life:c.life-.25;
       let f=u<.12?u/.12:(c.t>end?Math.max(0,1-(c.t-end)/.25):1);if(s.gone)f=Math.min(f,Math.max(0,1-(c.t-s.gone)/.15));if(f<=0)continue;draw(s.x,s.y,s.v,s.s,f,u<.2?.5*(1-u/.2):0);}
     for(const g of c.giants){const X=v.sx(g.x),Y=v.sy(g.y);
       if(g.t<0){const q=1+g.t/.4;ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba('#ff6a1a',.25+.35*Math.max(0,q));ctx.beginPath();ctx.ellipse(X,Y,34*k,15*k,0,0,TAU);ctx.fill();
         ctx.strokeStyle=rgba('#ffd27a',.8);ctx.lineWidth=2*k;ctx.beginPath();ctx.ellipse(X,Y,34*k*(1.4-.4*Math.max(0,q)),15*k*(1.4-.4*Math.max(0,q)),0,0,TAU);ctx.stroke();ctx.restore();}}
     for(const q of c.cuts){ctx.save();ctx.globalCompositeOperation='lighter';glow(ctx,v.sx(q.x),v.sy(q.y),16*k*(1-q.t/.3),rgba('#ffe0a0',.9),rgba('#ff7a2a',0));ctx.restore();}
   }};

 // ---------------------------------------------------------------- DRAGON ASCENT / AD ASTRA (Rayquaza)
 //  Dragon Ascent: Rayquaza becomes a long green-and-gold comet and drills straight through everything in its path
 //  (i-frames the whole time). move.count = drill legs (each new leg turns toward the next foe), move.radius = leg
 //  length, move.execute = finish foes below that HP share, move.allSE = super effective against every type.
 //  Ad Astra (evolved, Mega Rayquaza, move.adAstra): Rayquaza leaves the screen, then crashes across it three times
 //  with energy arrows beside it, carving the Delta symbol, which then blazes green; every non-boss foe on screen
 //  below 50% HP is executed. Rayquaza then dives back down where it started.
 const deltaImg=new Image();let deltaGlow=null;
 deltaImg.onload=()=>{const c=document.createElement('canvas');c.width=deltaImg.width;c.height=deltaImg.height;const g=c.getContext('2d');g.drawImage(deltaImg,0,0);
   g.globalCompositeOperation='source-in';const gr=g.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,'#c8ffb0');gr.addColorStop(.5,'#39e05a');gr.addColorStop(1,'#13a83a');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);deltaGlow=c;};
 deltaImg.src='assets/fx/delta-symbol.png?v=1';
 const ASC_COL=['#ffffff','#fff27a','#3dff7a','#0f9a3c'];
 function ascHide(p,on){if(!p)return;if(!p.__ascDraw){const d=p.draw;p.__ascDraw=true;p.draw=function(){if(this.__ascHidden>0)return;return d.apply(this,arguments);};}p.__ascHidden=Math.max(0,(p.__ascHidden||0)+(on?1:-1));}
 function ascHit(c,e,mult,dx,dy){
   if(c.ghost||e.dead)return;let m=mult||1;
   if(c.move.allSE){try{const eff=window.PS_HOOPA_ENGINE.Types.mult(c.move.type,e.types||[]);if(eff>0)m*=2/eff;}catch(_){}}   // always 2x, whatever the types
   applyHit(c,e,baseDmg(c,m),{knock:90},dx,dy);
   const ex=Number(c.move.execute)||0,hp=Number(e.hp),max=Number(e.maxHp);
   if(ex>0&&!e.dead&&hp>0&&max>0&&hp<=max*ex&&!(c.move.adAstra&&e.boss)){try{c.hit(c.player,e,hp*50+1000,'#ffffff',dx||.01,dy||0,0,c.move);}catch(_){}
     if(!e.dead&&Number(e.hp)>0&&typeof e.hurt==='function')try{e.hurt(Number(e.hp)*50+1000,'#ffffff',0,0,0);}catch(_){}
     c.kos.push({x:e.x,y:e.y-(Number(e.bodyH)||24)*.5,t:0});}
 }
 function ascLine(c,ax,ay,bx,by,w,skip,mult){
   const nx=bx-ax,ny=by-ay,l=Math.hypot(nx,ny)||1;
   for(const e of enemies()){if(skip.has(e))continue;if(segDist(e.x,e.y,ax,ay,bx,by)>w/2+(e.r||10))continue;skip.add(e);ascHit(c,e,mult,nx/l,ny/l);
     burst(e.x,e.y-10,'#c8ff7a',8,200);}
 }
 // The comet: a white-hot drill head, a long green/gold tail, a spinning helix and sparks.
 function drawComet(ctx,v,hx,hy,ang,len,w,t,alpha){
   const k=v.k,X=v.sx(hx),Y=v.sy(hy),L=len*k,W=w*k;
   ctx.save();ctx.translate(X,Y);ctx.rotate(ang);ctx.globalAlpha=alpha;ctx.globalCompositeOperation='lighter';
   for(const [ww,col,a] of [[1.25,ASC_COL[3],.55],[.85,ASC_COL[2],.75],[.5,ASC_COL[1],.85],[.2,ASC_COL[0],1]]){
     const g=ctx.createLinearGradient(-L,0,0,0);g.addColorStop(0,rgba(col,0));g.addColorStop(.75,rgba(col,a*.8));g.addColorStop(1,rgba(col,a));
     ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(W*.55,0);ctx.quadraticCurveTo(0,-W*ww*.6,-L*.2,-W*ww*.45);ctx.lineTo(-L,0);ctx.lineTo(-L*.2,W*ww*.45);ctx.quadraticCurveTo(0,W*ww*.6,W*.55,0);ctx.fill();}
   // drill helix
   ctx.lineWidth=2.2*k;for(const ph of [0,Math.PI]){ctx.strokeStyle=rgba(ph?ASC_COL[1]:ASC_COL[2],.9);ctx.beginPath();
     for(let i=0;i<=24;i++){const d=-i/24*L*.55,y=Math.sin(i*.9-t*38+ph)*W*.42*(1-i/30);i?ctx.lineTo(d,y):ctx.moveTo(d,y);}ctx.stroke();}
   // spiralling tornado rings around the head
   ctx.strokeStyle=rgba(ASC_COL[1],.7);ctx.lineWidth=1.6*k;for(let i=0;i<4;i++){const d=-((t*900+i*W*.9)%(W*3.6));ctx.beginPath();ctx.ellipse(d,0,W*.16,W*.55*(1+d/(W*7)),0,0,TAU);ctx.stroke();}
   glow(ctx,0,0,W*.9,rgba(ASC_COL[0],.95),rgba(ASC_COL[2],0));
   ctx.fillStyle=rgba('#fffbd0',.9);for(let i=0;i<10;i++){const d=-Math.random()*L*.7,o=(Math.random()-.5)*W*1.3;ctx.fillRect(d,o,3*k,1.6*k);}
   ctx.restore();
 }
 // A green / gold energy arrow that flies alongside the Ad Astra comet.
 function drawArrow(ctx,v,x,y,ang,s,alpha,col){const k=v.k;ctx.save();ctx.translate(v.sx(x),v.sy(y));ctx.rotate(ang);ctx.globalAlpha=alpha;ctx.globalCompositeOperation='lighter';
   const g=ctx.createLinearGradient(-s*3*k,0,s*k,0);g.addColorStop(0,rgba(col,0));g.addColorStop(1,rgba(col,.9));ctx.fillStyle=g;ctx.fillRect(-s*3*k,-s*.12*k,s*3*k,s*.24*k);
   ctx.fillStyle=rgba('#ffffff',.95);ctx.beginPath();ctx.moveTo(s*1.1*k,0);ctx.lineTo(-s*.2*k,-s*.42*k);ctx.lineTo(0,0);ctx.lineTo(-s*.2*k,s*.42*k);ctx.closePath();ctx.fill();
   ctx.strokeStyle=rgba(col,1);ctx.lineWidth=1.5*k;ctx.stroke();ctx.restore();}
 function cameraBox(){const cam=B()?.camera,game=document.getElementById('game');if(!cam||!game||typeof cam.left!=='function')return null;
   const r=game.getBoundingClientRect(),k=cam.scale*(cam._cw>0?r.width/cam._cw:1);return {left:cam.left(),top:cam.top(),w:r.width/k,h:r.height/k};}
 function freeSpot(x,y,fx,fy){const W=B()?.world;if(!W||typeof W.isWall!=='function')return [x,y];for(let i=0;i<=20;i++){const q=i/20,px=x+(fx-x)*q,py=y+(fy-y)*q;if(!W.isWall(px,py))return [px,py];}return [fx,fy];}

 S.ascent={cast(c){const p=c.player;c.kos=[];c.trail=[];
     if(c.move.adAstra)return S.ascent.castAstra(c);
     c.legs=Math.max(1,Math.round(c.move.count||1));c.R=Math.max(120,Number(c.move.radius)||260);c.w=Number(c.move.width)||70;c.legT=.24;c.gap=.06;
     c.cur=0;c.lt=0;c.hitAll=new Set();c.x=p.x;c.y=p.y;c.lock=true;
     c.dur=c.legs*(c.legT+c.gap)+.05;p.invuln=Math.max(Number(p.invuln)||0,c.dur+.35);ascHide(p,true);c.hidden=true;
     S.ascent.nextLeg(c,true);kick(.12);return c;},
   nextLeg(c,first){const p=c.player;let t=null;
     const cands=enemies().filter(e=>!c.hitAll.has(e)&&Math.hypot(e.x-c.x,e.y-c.y)<c.R+180);
     if(first)t=densest({x:c.x,y:c.y},c.R+150)||nearest(c.x,c.y,c.R+200,cands);else t=nearest(c.x,c.y,c.R+220,cands);
     let a=t?Math.atan2(t.y-c.y,t.x-c.x):(first?(Number(p.aim)||0):c.ang+TAU/3);
     const ex=c.x+Math.cos(a)*c.R,ey=c.y+Math.sin(a)*c.R,[bx,by]=freeSpot(ex,ey,c.x,c.y);
     c.ang=a;c.ax=c.x;c.ay=c.y;c.bx=bx;c.by=by;c.lt=0;c.skip=new Set();},
   castAstra(c){const p=c.player,box=cameraBox();c.astra=true;c.x0=p.x;c.y0=p.y;
     // the Delta symbol, centred on the screen, as three strokes in world space
     const H=box?box.h*.92:520,Wd=H*390/512,ox=box?box.left+box.w/2-Wd/2:p.x-Wd/2,oy=box?box.top+box.h/2-H/2:p.y-H/2,P=(u,v)=>({x:ox+u*Wd,y:oy+v*H});
     c.sym={x:ox,y:oy,w:Wd,h:H};
     const strokes=[[P(.113,.199),P(.472,.973)],[P(.887,.199),P(.528,.973)],[P(.503,.004),P(.503,.309)]];
     c.passes=strokes.map(([a,b],i)=>{const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l,ext=box?Math.max(box.w,box.h)*.8:900;
       return {a,b,ax:a.x-ux*ext,ay:a.y-uy*ext,bx:b.x+ux*ext*.9,by:b.y+uy*ext*.9,ang:Math.atan2(dy,dx),start:.65+i*.75,dur:.42,skip:new Set(),drawn:false};});
     c.dur=.65+3*.75+2.3;c.symT=.65+3*.75+.05;c.tints=[];
     p.invuln=Math.max(Number(p.invuln)||0,c.dur+.4);ascHide(p,true);c.hidden=true;kick(.2);return c;},
   // Shattered-glass cracks across the whole screen (screen space, from the centre of the Delta).
   makeCracks(c){const box=document.getElementById('game')?.getBoundingClientRect();if(!box)return;const cx=box.left+box.width/2,cy=box.top+box.height*.5,R=Math.hypot(box.width,box.height);
     const rays=[],rings=[];const n=13;
     for(let i=0;i<n;i++){const a=i/n*TAU+rnd(-.18,.18),pts=[{x:cx,y:cy}];let d=0,ang=a;while(d<R){d+=rnd(40,110);ang+=rnd(-.22,.22);pts.push({x:cx+Math.cos(ang)*d,y:cy+Math.sin(ang)*d});}rays.push(pts);}
     for(const r0 of [90,190,320,470]){const ring=[];for(let i=0;i<n;i++){const p=rays[i],q=p[Math.min(p.length-1,Math.max(1,Math.round(r0/75)))];ring.push({x:q.x+rnd(-12,12),y:q.y+rnd(-12,12)});}rings.push(ring);}
     c.cracks={rays,rings,cx,cy,R};},
   drawCracks(c,ctx,v,grow,fade){const K=c.cracks;ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
     ctx.globalAlpha=fade*.18;ctx.fillStyle='#e8fff0';ctx.fillRect(v.box.left,v.box.top,v.box.width,v.box.height);ctx.globalAlpha=fade;
     const path=(pts,lim)=>{ctx.beginPath();let len=0;ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);if(len+d>lim){const f=(lim-len)/d;ctx.lineTo(pts[i-1].x+(pts[i].x-pts[i-1].x)*f,pts[i-1].y+(pts[i].y-pts[i-1].y)*f);break;}len+=d;ctx.lineTo(pts[i].x,pts[i].y);}};
     for(const [w,col] of [[5,'rgba(10,40,20,.65)'],[2,'rgba(255,255,255,.95)']]){ctx.strokeStyle=col;ctx.lineWidth=w;
       for(const r of K.rays){path(r,K.R*grow);ctx.stroke();}
       if(grow>=1)for(const ring of K.rings){ctx.beginPath();ring.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.stroke();}}
     // impact point
     const g=ctx.createRadialGradient(K.cx,K.cy,0,K.cx,K.cy,70);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(160,255,190,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(K.cx,K.cy,70,0,TAU);ctx.fill();
     ctx.restore();},
   update(c,dt){c.t+=dt;const p=c.player;
     for(const q of c.kos)q.t+=dt;c.kos=c.kos.filter(q=>q.t<.45);
     if(c.astra)return S.ascent.updateAstra(c,dt);
     if(c.cur<c.legs){c.lt+=dt;const q=Math.min(1,c.lt/c.legT),hx=c.ax+(c.bx-c.ax)*q,hy=c.ay+(c.by-c.ay)*q;
       ascLine(c,c.ax,c.ay,hx,hy,c.w,c.skip,1);for(const e of c.skip)c.hitAll.add(e);
       p.x=hx;p.y=hy;c.x=hx;c.y=hy;c.trail.push({x:hx,y:hy,t:0});
       if(q>=1&&c.lt>=c.legT+c.gap){c.cur++;burst(hx,hy,'#c8ff7a',14,200);kick(.06);if(c.cur<c.legs)S.ascent.nextLeg(c,false);}}
     else if(c.hidden){c.hidden=false;ascHide(p,false);ring(c.x,c.y,8,90,'#7dff9a',.4,5);}
     for(const q of c.trail)q.t+=dt;c.trail=c.trail.filter(q=>q.t<.35);
     return c.t<c.dur+.45;},
   updateAstra(c,dt){const p=c.player;
     if(c.t<c.dur-.5){p.x=c.x0;p.y=c.y0;}                       // Rayquaza is in the sky; its spot on the ground waits for it
     for(const ps of c.passes){const u=(c.t-ps.start)/ps.dur;if(u<0||u>1.15)continue;
       const q=Math.min(1,u),hx=ps.ax+(ps.bx-ps.ax)*q,hy=ps.ay+(ps.by-ps.ay)*q;
       if(!ps.k){ps.k=1;kick(.6);c.tints.push({t:0});}       // each pierce: a heavy jolt and a green flash
       ascLine(c,ps.ax,ps.ay,hx,hy,170,ps.skip,1.6);
       if(u<1&&Math.random()<dt*18)kick(.3);}                  // the screen keeps shaking while each pierce tears across it
     for(const q of c.tints)q.t+=dt;c.tints=c.tints.filter(q=>q.t<.5);
     if(!c.symHit&&c.t>=c.symT){c.symHit=true;kick(1.2);S.ascent.makeCracks(c);
       // the finished Delta executes every non-boss foe on screen below 50% HP
       const box=cameraBox();for(const e of enemies()){if(e.boss||e.dead)continue;if(box&&(e.x<box.left||e.x>box.left+box.w||e.y<box.top||e.y>box.top+box.h))continue;
         if(Number(e.hp)<=Number(e.maxHp)*.5){try{c.hit(c.player,e,Number(e.hp)*50+1000,'#ffffff',.01,0,0,c.move);}catch(_){}if(!e.dead&&typeof e.hurt==='function')try{e.hurt(Number(e.hp)*50+1000,'#ffffff',0,0,0);}catch(_){}
           c.kos.push({x:e.x,y:e.y-(Number(e.bodyH)||24)*.5,t:0});burst(e.x,e.y-10,'#9dff7a',12,220);}}}
     if(c.t>=c.dur-.5&&!c.landed){c.landed=true;}
     if(c.hidden&&c.t>=c.dur-.12){c.hidden=false;ascHide(p,false);kick(.18);ring(c.x0,c.y0,10,120,'#7dff9a',.5,6);burst(c.x0,c.y0,'#c8ff7a',20,240);}
     return c.t<c.dur+.3;},
   draw(c,ctx,v){const k=v.k;
     if(c.astra){S.ascent.drawAstra(c,ctx,v);}
     else{
       for(const q of c.trail){const f=1-q.t/.35;ctx.save();ctx.globalCompositeOperation='lighter';glow(ctx,v.sx(q.x),v.sy(q.y-18),c.w*.55*k*f,rgba(ASC_COL[2],.35*f),rgba(ASC_COL[3],0));ctx.restore();}
       if(c.cur<c.legs){const q=Math.min(1,c.lt/c.legT),hx=c.ax+(c.bx-c.ax)*q,hy=c.ay+(c.by-c.ay)*q,len=Math.max(60,Math.hypot(hx-c.ax,hy-c.ay))+80;
         drawComet(ctx,v,hx,hy-18,c.ang,Math.min(620,Math.max(380,len+220)),c.w*1.35,c.t,1);}}
     for(const q of c.kos){const u=q.t/.45;ctx.save();ctx.globalCompositeOperation='lighter';glow(ctx,v.sx(q.x),v.sy(q.y),(16+40*u)*k,rgba('#ffffff',1-u),rgba(ASC_COL[2],0));ctx.restore();}
   },
   drawAstra(c,ctx,v){const k=v.k,t=c.t,lift=18;
     // lift-off: a comet streaks straight up off the screen
     if(t<.65){const u=t/.65,hy=c.y0-u*u*900;drawComet(ctx,v,c.x0,hy-lift,-Math.PI/2,520,110,t,1-Math.max(0,u-.8)*5);}
     // glowing scars of the strokes already carved
     for(const ps of c.passes){const u=(t-ps.start)/ps.dur;if(u<.05)continue;const fade=t>c.dur-.8?Math.max(0,(c.dur-t)/.8):1,q=Math.min(1,u);
       const hx=ps.ax+(ps.bx-ps.ax)*q,hy=ps.ay+(ps.by-ps.ay)*q;ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
       for(const [w,col,a] of [[58,ASC_COL[3],.35],[28,ASC_COL[2],.6],[9,ASC_COL[1],.9]]){ctx.strokeStyle=rgba(col,a*fade);ctx.lineWidth=w*k;ctx.beginPath();ctx.moveTo(v.sx(ps.ax),v.sy(ps.ay));ctx.lineTo(v.sx(hx),v.sy(hy));ctx.stroke();}
       ctx.restore();
       if(u<=1.1){const ang=ps.ang;drawComet(ctx,v,hx,hy,ang,820,150,t,1);
         // energy arrows flying with it
         for(let i=0;i<8;i++){const side=(i%2?1:-1)*(80+(i>>1)*34),back=90+i*46+Math.sin(t*20+i)*14,ax=hx-Math.cos(ang)*back-Math.sin(ang)*side,ay=hy-Math.sin(ang)*back+Math.cos(ang)*side;
           drawArrow(ctx,v,ax,ay,ang,24+(i%3)*5,.95,i%2?ASC_COL[1]:ASC_COL[2]);}}}
     // the Delta symbol blazes green
     if(t>=c.symT&&deltaGlow){const u=t-c.symT,a=Math.min(1,u/.15)*(u>1.5?Math.max(0,1-(u-1.5)/.6):1),pulse=1+.04*Math.sin(u*14);
       const X=v.sx(c.sym.x+c.sym.w/2),Y=v.sy(c.sym.y+c.sym.h/2),Wd=c.sym.w*k*pulse,Hd=c.sym.h*k*pulse;
       ctx.save();ctx.globalAlpha=a;ctx.shadowColor='#3dff7a';ctx.shadowBlur=40*k;ctx.drawImage(deltaGlow,X-Wd/2,Y-Hd/2,Wd,Hd);
       ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*.5;ctx.drawImage(deltaGlow,X-Wd/2,Y-Hd/2,Wd,Hd);ctx.restore();
       if(u<.25){ctx.save();ctx.fillStyle=rgba('#e8ffe0',.55*(1-u/.25));ctx.fillRect(v.box.left,v.box.top,v.box.width,v.box.height);ctx.restore();}}
     // the dive back down to the ground
     if(t>c.dur-.5&&t<c.dur){const u=(t-(c.dur-.5))/.38;if(u<=1)drawComet(ctx,v,c.x0,c.y0-lift-(1-u)*(1-u)*900,Math.PI/2,520,110,t,1);}
     // green flash with every pierce
     for(const q of c.tints){ctx.save();ctx.fillStyle=rgba('#3dff7a',.32*(1-q.t/.5));ctx.fillRect(v.box.left,v.box.top,v.box.width,v.box.height);ctx.restore();}
     // the screen CRACKS when the Delta is complete, then the glass clears
     if(c.cracks&&t>=c.symT){const u=t-c.symT,grow=Math.min(1,u/.12),fade=u<1.3?1:Math.max(0,1-(u-1.3)/.5);if(fade>0)S.ascent.drawCracks(c,ctx,v,grow,fade);}
   }};

 // Release temporary actor state even when a move is interrupted by switching or an error.
 function dispose(c){if(!c)return;if(c.hidden){c.hidden=false;ascHide(c.player,false);}if(typeof c.style?.dispose==='function')try{c.style.dispose(c);}catch(e){console.warn('fx dispose',e);}}
 // ---------------------------------------------------------------- manager
 window.PS_FX={
   styles:S,
   sprite:pokeSprite,
   count(name){return live.filter(c=>c.style===S[name]).length;},
   list(name){return live.filter(c=>c.style===S[name]);},
   has(name){return !!S[name];},
   cast(name,player,move,hit,ghost){const st=S[name];if(!st)return false;
     const c={style:st,player,move,hit:hit||window.__psHit||((pl,e,dmg,col,kx,ky,kn)=>e.hurt(dmg,col,kx,ky,kn)),ghost:!!ghost,fx:Object.assign({},move.fx||{}),t:0};
     try{const r=st.cast(c);if(r)live.push(r);else dispose(c);}catch(e){dispose(c);console.warn('fx cast',name,e);}return true;},
   active(){if(live.length||shinySp.length||opSlowed.size)return true;const p=B()?.game?.player;if(shinyOf(p))return true;for(const e of enemies())if(e.shiny===true)return true;return false;},
   update(dt){opSlowTick(dt);for(let i=live.length-1;i>=0;i--){let keep=false;try{keep=live[i].style.update(live[i],dt);}catch(e){console.warn('fx update',e);}if(!keep){dispose(live[i]);live.splice(i,1);}}},
   draw(ctx,view){try{ctx.save();drawShiny(ctx,view);ctx.restore();}catch(e){}for(const c of live){try{ctx.save();c.style.draw(c,ctx,view);ctx.restore();}catch(e){console.warn('fx draw',e);}}},
   clearForPlayer(player){for(let i=live.length-1;i>=0;i--)if(live[i].player===player){dispose(live[i]);live.splice(i,1);}if(player)player.__ascHidden=0;},
   clear(){for(const c of live)dispose(c);live.length=0;}
 };
})();
