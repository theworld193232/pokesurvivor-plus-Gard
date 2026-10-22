/* =====================================================================================================
   CATCHING POKEMON + YOUR TRAINER
   - Your Trainer walks behind your Pokemon during runs.
   - Click / tap a wild Pokemon to target it, then press Z (or the ball button) and your Trainer throws a ball.
     The ball shakes up to 3 times; it needs all 3 rolls to catch, otherwise the Pokemon breaks out.
     Odds follow the main games: catch rate x ball x status, better at low HP.
     Caught Pokemon join your collection (like the ones from the Gacha).
   - B (or tap the ball icon) switches ball. X (or the potion button): your Trainer uses a Potion on you.
   - Balls and Potions: 5 Poke Balls + 3 Potions to start, found in runs (Master Balls very rarely),
     and sold at the Poke Mart in the main menu (Master Balls are never sold).
   - Story bosses (e.g. Blue's Squirtle, flag psNoCatch) can't be caught; wild bosses can.
   ===================================================================================================== */
(()=>{'use strict';
 const E=()=>window.PS_HOOPA_ENGINE,B=()=>window.PS_MEGA_BRIDGE_V5;
 // [Gard] Story Mode only (js/story-mode.js). In Original mode none of this runs or shows.
 const STORY=()=>!!(window.PS_STORY&&window.PS_STORY.on());
 // Catch rates from the main games, by National Dex number (index 0 unused).
 const RATES=[0,45,45,45,45,45,45,45,45,45,255,120,45,255,120,45,255,120,45,255,127,255,90,255,90,190,75,255,90,235,120,45,235,120,45,150,25,190,75,170,50,255,90,255,120,45,190,75,190,75,255,50,255,90,190,75,190,75,190,75,255,120,45,200,100,50,180,90,45,255,120,45,190,60,255,120,45,190,60,190,75,190,60,45,190,45,190,75,190,75,190,60,190,90,45,45,190,75,225,60,190,60,90,45,190,75,45,45,45,190,60,120,60,30,45,45,225,75,225,60,225,60,45,45,45,45,45,45,45,255,45,45,35,45,45,45,45,45,45,45,45,45,45,25,3,3,3,45,45,45,3,45,45,45,45,45,45,45,45,45,45,255,90,255,90,255,90,255,90,90,190,75,190,150,170,190,75,190,75,235,120,45,45,190,75,65,45,255,120,45,45,235,120,75,255,90,45,45,30,70,45,225,45,60,190,75,190,60,25,190,75,45,25,190,45,60,120,60,190,75,225,75,60,190,75,45,25,25,120,45,45,120,60,45,45,45,75,45,45,45,45,45,30,3,3,3,45,45,45,3,3,45,45,45,45,45,45,45,45,45,45,255,127,255,90,255,120,45,120,45,255,120,45,255,120,45,200,45,190,45,235,120,45,200,75,255,90,255,120,45,255,120,45,190,120,45,180,200,150,255,255,60,45,45,180,90,45,180,90,120,45,200,200,150,150,150,225,75,225,60,125,60,255,150,90,255,60,255,255,120,45,190,60,255,45,90,90,45,45,190,75,205,155,255,90,45,45,45,45,255,60,45,200,225,45,190,90,200,45,30,125,190,75,255,120,45,255,60,60,25,225,45,45,45,3,3,3,3,3,3,3,3,3,3,45,3,3,45,45,45,45,45,45,45,45,45,255,120,45,255,127,255,45,235,120,45,255,75,45,45,45,45,120,45,45,120,45,200,190,75,190,75,190,75,45,125,60,190,60,45,30,190,75,120,225,60,255,90,255,145,130,30,100,45,45,45,50,75,45,140,60,120,45,140,75,200,190,75,25,120,60,45,30,30,30,30,30,30,30,30,45,45,30,50,30,45,60,45,75,45,3,3,3,3,3,3,3,3,3,30,3,3,45,3,3,45,45,45,45,45,45,45,45,45,255,255,255,120,45,255,90,190,75,190,75,190,75,190,75,255,120,45,190,75,255,120,45,190,45,120,60,255,180,90,45,255,120,45,45,45,255,120,45,255,120,45,190,75,190,75,25,180,90,45,120,60,255,190,75,180,90,45,190,90,45,45,45,45,190,60,75,45,255,60,200,100,50,200,100,50,190,45,255,120,45,190,75,200,200,75,190,75,190,60,75,190,75,255,90,130,60,30,190,60,30,255,90,190,90,45,75,60,45,120,60,25,200,75,75,180,45,45,190,90,120,45,45,190,60,190,60,90,90,45,45,45,45,15,3,3,3,3,3,3,3,3,3,3,3,3,45,45,45,45,45,45,45,45,45,255,127,255,120,45,255,120,45,220,65,225,120,45,200,45,220,65,160,190,75,180,90,45,200,140,200,140,190,80,120,45,225,55,225,55,190,75,45,45,45,45,45,100,180,60,45,45,45,75,120,60,120,60,190,55,190,45,45,45,3,3,3,3,45,45,45,45,45,45,45,45,45,255,120,45,255,127,255,120,45,225,60,45,190,75,190,90,60,190,75,190,60,200,100,190,75,190,75,120,45,140,70,235,120,45,60,45,45,90,45,140,60,60,3,3,30,45,70,180,45,80,70,25,45,45,45,3,3,3,3,45,45,45,45,45,45,45,45,45,45,45,255,3,3,45,45,30,30,3,3,3,45,45,45,45,45,45,45,45,45,255,90,255,120,45,255,120,45,255,127,190,75,255,127,255,75,255,45,255,120,45,255,45,45,255,120,45,255,60,75,45,190,75,180,45,120,60,235,120,45,255,120,45,45,90,30,45,45,90,200,100,45,75,190,75,60,60,30,180,190,90,45,45,45,45,45,45,45,45,10,10,255,3,3,3,3,3,3,3,3,135,115,75,135,135,135,3,45,45,45,45,45,45,45,45,45,255,100,255,120,190,30,190,80,45,150,75,190,90,255,120,45,190,255,120,45,90,25,25,190,50,180,90,150,75,190,90,190,45,190,90,120,190,75,190,45,120,60,190,90,45,255,50,25,200,45,190,75,190,25,70,25,120,60,100,150,50,100,25,100,45,90,45,45,25,30,50,50,30,30,30,30,50,50,30,30,30,45,25,10,45,45,6,6,6,6,10,10,3,3,5,5,45,120,60,3,3,3,5,10,10,10,10,10,10,255,3];
 const BALLS={
   poke:{name:'Poké Ball',bonus:1,price:200,img:'assets/fx/ball-poke.png'},
   great:{name:'Great Ball',bonus:1.5,price:600,img:'assets/fx/ball-great.png'},
   ultra:{name:'Ultra Ball',bonus:2,price:1200,img:'assets/fx/ball-ultra.png'},
   master:{name:'Master Ball',bonus:Infinity,price:0,img:'assets/fx/ball-master.png'}};
 const BALL_ORDER=['poke','great','ultra','master'];
 const ITEMS={potion:{name:'Potion',heal:.30,price:300,img:'assets/fx/potion.png'},superpotion:{name:'Super Potion',heal:.60,price:700,img:'assets/fx/superpotion.png'}};
 // Tuning knobs.
 const TUNE={
   start:{poke:5,great:0,ultra:0,master:0,potion:3,superpotion:0},
   range:520,            // how far your Trainer can throw (world units)
   shakeGap:.6,          // seconds between shakes
   potionCd:1.2,
   // drop chance per defeated wild Pokemon (bosses: master chance uses masterBoss)
   drops:{poke:1/45,great:1/180,ultra:1/500,potion:1/70,superpotion:1/320,master:1/6000,masterBoss:1/40},
   dropsFrom:{great:90,ultra:180}   // seconds into the run before these can drop
 };
 const imgs={};for(const [k,v] of Object.entries({...BALLS,...ITEMS})){const i=new Image();i.src=v.img+'?v=1';imgs[k]=i;}
 // Trainer sprites: 4x4 sheets, 64px frames, rows facing down, left, right, up
 // [Gard] more Trainers (same 4x4 sheet layout: rows down, left, right, up; 4 walk frames each).
 // Girl / Boy are your friend's. tr* and Iono are walking sheets you sent (Iono by Mid117); chibi* are front-only.
 // To rename one, just change its label here.
 const TRAINERS=[['girl','Girl'],['boy','Boy'],['tr1','Midnight'],['tr2a','Gold Band'],['tr2b','Blue Hair'],['iono','Iono'],['tr5','Green Streak'],['tr6','Black Hat'],['tr7','White Hat'],
   ...Array.from({length:13},(_,i)=>['chibi'+(i+1),'Chibi '+(i+1)])];
 const TR_KEYS=new Set(TRAINERS.map(t=>t[0]));
 const trKey=()=>{const k=E()?.DB?.save?.psTrainer;return TR_KEYS.has(k)?k:'girl';};
 const sheets={};
 const sheet=()=>{const k=trKey();if(!sheets[k]){const i=new Image();i.src='assets/trainer/'+k+'.png?v=1';sheets[k]=i;}return sheets[k];};

 // ---- the bag (saved with your profile) ----
 function bag(){const S=E()?.DB?.save;if(!S)return null;if(!S.psBag){S.psBag=Object.assign({},TUNE.start);save();}for(const k in TUNE.start)if(!Number.isFinite(S.psBag[k]))S.psBag[k]=0;return S.psBag;}
 let saveT=null;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{E()?.DB?.commit?.();}catch(e){}},400);}
 let sel='poke';
 function pickBall(){const b=bag();if(!b)return;if(!(b[sel]>0)){const n=BALL_ORDER.find(k=>b[k]>0);if(n)sel=n;}}
 function cycleBall(){const b=bag();if(!b)return;const have=BALL_ORDER.filter(k=>b[k]>0);if(!have.length)return;sel=have[(have.indexOf(sel)+1)%have.length];hud();}

 // ---- catch maths (Gen III/IV style; 3 shake checks that together equal the games' catch chance) ----
 function rateOf(e){const d=Number(e.dex)||0;return RATES[d]||45;}
 function catchA(e,ball){
   const M=Math.max(1,Number(e.maxHp)||1),H=Math.max(1,Math.min(M,Number(e.hp)||1));
   let status=1;if(Number(e.stunT)>0||e.frozen)status=2;else if(Number(e.burnT)>0||Number(e.poisonT)>0||Number(e.slowT)>0)status=1.5;
   if(!Number.isFinite(BALLS[ball].bonus))return 255;
   return Math.min(255,((3*M-2*H)*rateOf(e)*BALLS[ball].bonus*status)/(3*M));
 }
 const chance=(e,ball)=>Math.min(1,catchA(e,ball)/255);
 const catchable=e=>e&&!e.dead&&!e.remote&&!e.psNoCatch&&!e.__psCatch&&Number(e.hp)>0;

 // ---- targeting: click / tap a Pokemon ----
 let target=null;
 function view(){const cam=B()?.camera,game=document.getElementById('game');if(!cam||!game||typeof cam.left!=='function')return null;
   const rect=game.getBoundingClientRect(),k=cam.scale*(cam._cw>0?rect.width/cam._cw:1);if(!(k>0))return null;return {k,rect,left:cam.left(),top:cam.top()};}
 addEventListener('pointerdown',ev=>{
   const g=B()?.game;if(!STORY()||!g?.player||g.state!=='playing'||ev.target?.closest?.('#ps-catch-hud,#ps-mart,#ps-bag'))return;
   const v=view();if(!v)return;const wx=v.left+(ev.clientX-v.rect.left)/v.k,wy=v.top+(ev.clientY-v.rect.top)/v.k;
   if(clickedTrainer(wx,wy)){ev.preventDefault();ev.stopPropagation();openBag();return;}   // the Trainer opens the bag
   let best=null,bd=1e9;for(const e of B().enemies.all()){if(!catchable(e))continue;const h=Number(e.bodyH)||24,d=Math.hypot(e.x-wx,e.y-h*.45-wy);if(d<Math.max(30,h*.7)+8&&d<bd){bd=d;best=e;}}
   if(best){target=best;hud();}
 },true);

 // ---- your Trainer: follows the path you walk, a few steps behind ----
 const tr={x:0,y:0,dir:0,moving:false,frame:0,ft:0,trail:[],for:null,act:null};
 function updateTrainer(dt,p){
   if(tr.for!==p){tr.for=p;tr.x=p.x-30;tr.y=p.y+10;tr.trail=[];}
   const last=tr.trail[tr.trail.length-1];if(!last||Math.hypot(last.x-p.x,last.y-p.y)>4)tr.trail.push({x:p.x,y:p.y});if(tr.trail.length>200)tr.trail.shift();
   // the point ~46 units behind the player along the trail
   let need=46,gx=p.x,gy=p.y;for(let i=tr.trail.length-1;i>0;i--){const a=tr.trail[i],b=tr.trail[i-1],d=Math.hypot(a.x-b.x,a.y-b.y);if(d>=need){const f=need/d;gx=a.x+(b.x-a.x)*f;gy=a.y+(b.y-a.y)*f;need=0;break;}need-=d;gx=b.x;gy=b.y;}
   // never stand on top of your Pokemon: keep at least ~38 units away (beside it when it hasn't walked anywhere yet)
   if(Math.hypot(gx-p.x,gy-p.y)<38){let ox=tr.x-p.x,oy=tr.y-p.y,ol=Math.hypot(ox,oy);if(ol<1){ox=-1;oy=.6;ol=Math.hypot(ox,oy);}gx=p.x+ox/ol*38;gy=p.y+oy/ol*38;}
   const dx=gx-tr.x,dy=gy-tr.y,d=Math.hypot(dx,dy);
   if(d>400){tr.x=gx;tr.y=gy;}
   else if(d>1.5){const sp=Math.min(d,Math.max(60,(Number(p.spd)||110)*1.15)*dt*(d>80?1.8:1));tr.x+=dx/d*sp;tr.y+=dy/d*sp;tr.moving=true;
     tr.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);}
   else tr.moving=false;
   if(tr.act){tr.act.t+=dt;if(tr.act.t>tr.act.dur)tr.act=null;else{const tx=tr.act.x-tr.x,ty=tr.act.y-tr.y;tr.dir=Math.abs(tx)>Math.abs(ty)?(tx<0?1:2):(ty<0?3:0);}}
   tr.ft+=dt;if(tr.ft>(tr.moving?.12:.14)){tr.ft=0;tr.frame=(tr.frame+1)%4;}
 }
 function drawTrainer(g){
   const girl=sheet();if(!girl.complete||!girl.naturalWidth)return;const s=.85,W=64*s,H=64*s,f=tr.moving||tr.act?tr.frame:0;
   g.save();g.imageSmoothingEnabled=false;g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(tr.x,tr.y,13,5,0,0,Math.PI*2);g.fill();
   const bob=(tr.moving||tr.act)?((f%2)?-1.2:0):(Math.sin(performance.now()/380)>0.6?-0.6:0);   // [Gard] step bounce / idle breathing
   g.drawImage(girl,f*64,tr.dir*64,64,64,tr.x-W/2,tr.y-H*.93+bob,W,H);g.restore();
 }

 // ---- throwing ----
 const throws=[];
 function throwBall(){
   const b=bag(),p=B()?.game?.player;if(!b||!p||B().game.state!=='playing')return;
   pickBall();if(!(b[sel]>0)){toast('No Poké Balls left! Buy some at the Poké Mart.');return;}
   if(!catchable(target)){target=null;toast('Click a wild Pokémon to target it first.');hud();return;}
   if(target.psNoCatch){toast("You can't catch another Trainer's Pokémon!");return;}
   if(Math.hypot(target.x-tr.x,target.y-tr.y)>TUNE.range){toast('Too far away to throw!');return;}
   if(throws.some(t=>t.e===target))return;
   b[sel]--;save();
   const e=target;throws.push({e,ball:sel,phase:'fly',t:0,x0:tr.x,y0:tr.y-30,x:tr.x,y:tr.y-30,shakes:0,rolls:[]});
   tr.act={t:0,dur:.4,x:e.x,y:e.y};hud();
 }
 function hold(e,on){   // the Pokemon disappears into the ball: frozen, hidden and untouchable
   if(on){if(e.__psCatch)return;e.__psCatch={x:e.x,y:e.y,draw:e.draw,hurt:e.hurt,stun:e.stunT};e.draw=function(){};e.hurt=function(){};e.stunT=99;}
   else{const s=e.__psCatch;if(!s)return;delete e.__psCatch;delete e.draw;delete e.hurt;if(s.draw!==Object.getPrototypeOf(e).draw)e.draw=s.draw;if(s.hurt!==Object.getPrototypeOf(e).hurt)e.hurt=s.hurt;e.stunT=Math.max(Number(s.stun)||0,.6);}
 }
 function updateThrows(dt){
   for(let i=throws.length-1;i>=0;i--){const t=throws[i],e=t.e;t.t+=dt;
     if(t.phase==='fly'){const u=Math.min(1,t.t/.45),tx=e.x,ty=e.y-(Number(e.bodyH)||24)*.5;t.x=t.x0+(tx-t.x0)*u;t.y=t.y0+(ty-t.y0)*u-Math.sin(Math.PI*u)*70;
       if(e.dead||!(Number(e.hp)>0)){throws.splice(i,1);const b=bag();if(b){b[t.ball]++;save();hud();}toast('It fainted before the ball reached it! (ball returned)');continue;}
       if(u>=1){t.phase='absorb';t.t=0;hold(e,true);t.gx=e.x;t.gy=e.y;}}
     else if(t.phase==='absorb'){t.x=t.gx;t.y=t.gy-28+Math.min(1,t.t/.35)*28;if(t.t>.45){t.phase='shake';t.t=0;
       const a=catchA(e,t.ball),p=a>=255?1:Math.pow(a/255,1/3);for(let k=0;k<3;k++)t.rolls.push(Math.random()<p);}}
     else if(t.phase==='shake'){if(e.__psCatch){e.x=e.__psCatch.x;e.y=e.__psCatch.y;}
       if(t.t>=TUNE.shakeGap){t.t=0;const ok=t.rolls[t.shakes];t.shakes++;
         if(!ok){t.phase='break';t.t=0;hold(e,false);try{E().FX.burst(e.x,e.y-14,'#ffffff',16,200);}catch(_){}toast(['Oh no! The Pokémon broke free!','Aww! It appeared to be caught!','Aargh! Almost had it!'][Math.min(2,t.shakes-1)]);}
         else if(t.shakes>=3){t.phase='caught';t.t=0;caught(e,t.ball);}}}
     else if(t.phase==='break'){if(t.t>.4)throws.splice(i,1);}
     else if(t.phase==='caught'){if(t.t>1.4)throws.splice(i,1);}
   }
 }
 function caught(e,ball){
   const X=E(),dex=Number(e.dex),name=e.name||'Pokémon',shiny=!!(e.shiny===true||e.anim?.shiny);
   let isNew=false;const size=e.psSize||'normal',hadSize=!!sizesOf(dex)[size];
   try{isNew=!X.DB.owns(dex);grantSize(dex,size,!isNew);try{const bs=window.PS_PARTNER?window.PS_PARTNER.base(dex):dex;if(bs!==dex&&size!=='normal')grantSize(bs,size,true);}catch(_){}X.DB.grant(dex,'catch');if(shiny)X.DB.grantShiny(dex,'catch');}catch(_){}
   if(!isNew&&hadSize){try{X.DB.save.coins=(Number(X.DB.save.coins)||0)+50;}catch(_){}}
   save();
   // gone from the field (it counts as defeated, so you still get its experience)
   const s=e.__psCatch;if(s){e.__psCatch=null;delete e.hurt;}e.__psCaughtGone=true;
   try{e.hp=0;if(typeof e.die==='function')e.die();else e.hurt(1e6,'#ffffff',0,0,0);}catch(_){try{e.hurt(1e6,'#ffffff',0,0,0);}catch(__){}}
   if(target===e)target=null;
   const sz=size!=='normal'?SIZES[size].name+' ':'';
   toast('Gotcha! '+(shiny?'✨ Shiny ':'')+sz+name+' was caught!'+(isNew?' New Pokémon added to your collection!':!hadSize?' New size unlocked: '+SIZES[size].name+'!':' (already registered: +50 PokéCoins)'),3.2);
   try{X.FX.burst(e.x,e.y-10,'#ffe066',20,180);}catch(_){}
   hud();
 }
 function drawThrows(g){
   for(const t of throws){const ball=imgs[t.ball];if(!ball?.complete)continue;let x=t.x,y=t.y,rot=0,sc=1;
     if(t.phase==='fly')rot=t.t*18;
     else if(t.phase==='shake'){const u=t.t/TUNE.shakeGap;rot=u<.35?Math.sin(u/.35*Math.PI)*.45*(t.shakes%2?-1:1):0;}
     else if(t.phase==='break'){sc=1+t.t*1.5;g.save();g.globalAlpha=Math.max(0,1-t.t/.4);g.fillStyle='#ffffff';g.beginPath();g.arc(x,y-8,10+t.t*60,0,Math.PI*2);g.fill();g.restore();}
     g.save();g.imageSmoothingEnabled=false;g.translate(x,y-7);g.rotate(rot);g.globalAlpha=t.phase==='break'?Math.max(0,1-t.t/.4):1;g.drawImage(ball,-8*sc,-8*sc,16*sc,16*sc);g.restore();
     if(t.phase==='caught'&&t.t<1.2){g.save();g.fillStyle='#ffe066';for(let i=0;i<3;i++){const a=-Math.PI/2+(i-1)*.6,d=10+t.t*24;g.globalAlpha=Math.max(0,1-t.t/1.2);g.fillRect(x+Math.cos(a)*d-2,y-14+Math.sin(a)*d-2,4,4);}g.restore();}
   }
 }

 // ---- potions (X) ----
 let potionCd=0;const heals=[];
 function usePotion(){
   const b=bag(),p=B()?.game?.player;if(!b||!p||B().game.state!=='playing'||potionCd>0)return;
   if(!(p.hp<p.maxHp)){toast("You're already at full HP!");return;}
   const k=b.potion>0?'potion':b.superpotion>0?'superpotion':null;if(!k){toast('No Potions left!');return;}
   b[k]--;save();potionCd=TUNE.potionCd;const amt=Math.round(p.maxHp*ITEMS[k].heal),before=p.hp;p.hp=Math.min(p.maxHp,p.hp+amt);
   heals.push({t:0,n:Math.round(p.hp-before)});tr.act={t:0,dur:.5,x:p.x,y:p.y};
   try{E().FX.burst(p.x,p.y-20,'#7dff9a',14,140);}catch(_){}toast(ITEMS[k].name+'! +'+Math.round(p.hp-before)+' HP');hud();
 }
 function drawHeals(g,p){for(const h of heals){const u=h.t/.9;g.save();g.globalAlpha=1-u;g.fillStyle='#7dff9a';g.font='bold 12px monospace';g.textAlign='center';g.fillText('+'+h.n,p.x,p.y-(Number(p.bodyH)||40)-10-u*20);
   for(let i=0;i<6;i++){const a=i/6*Math.PI*2+h.t*4,r=18+u*10;g.fillRect(p.x+Math.cos(a)*r-1.5,p.y-20+Math.sin(a)*r*.6-1.5,3,3);}g.restore();}}

 // ---- drops from defeated wild Pokemon ----
 const alive=new Set();
 function drops(){
   const list=B()?.enemies?.all?.()||[],now=new Set(list.filter(e=>!e.dead));const time=Number(E()?.Game?.time)||0,b=bag();if(!b)return;
   for(const e of alive){if(now.has(e)||e.__psCaughtGone||e.remote)continue;
     const D=TUNE.drops,got=[];
     if(Math.random()<(e.boss?D.masterBoss:D.master))got.push('master');
     else if(time>=TUNE.dropsFrom.ultra&&Math.random()<D.ultra)got.push('ultra');
     else if(time>=TUNE.dropsFrom.great&&Math.random()<D.great)got.push('great');
     else if(Math.random()<D.poke)got.push('poke');
     if(Math.random()<D.superpotion)got.push('superpotion');else if(Math.random()<D.potion)got.push('potion');
     for(const k of got){b[k]++;toast((k==='master'?'✨ ':'')+'Found a '+(BALLS[k]||ITEMS[k]).name+'!',k==='master'?3.5:2);}
     if(got.length){save();hud();}
   }
   alive.clear();for(const e of now)if(!e.__psCatch)alive.add(e);
 }

 // ---- world drawing: the Trainer, balls and heal sparkles are drawn in the game's own world pass (under the HUD) ----
 let drawHooked=false;
 function hookDraws(){const T=E()?.Training;if(drawHooked||!T||typeof T.drawables!=='function')return;drawHooked=true;const orig=T.drawables;
   T.drawables=function(){const r=orig.apply(this,arguments);const p=B()?.game?.player;if(!p||p.dead||!running())return r;
     const extra=[{y:tr.y,draw:drawTrainer}];
     if(throws.length)extra.push({y:1e9,draw:drawThrows});
     if(target&&catchable(target))extra.push({y:target.y-.5,draw(g){const e=target,r=Math.max(16,(Number(e.r)||12)*1.4);g.save();g.strokeStyle='#ffe066';g.lineWidth=2;g.setLineDash([5,4]);g.lineDashOffset=-performance.now()/60;g.beginPath();g.ellipse(e.x,e.y,r,r*.42,0,0,Math.PI*2);g.stroke();g.restore();}});
     if(heals.length)extra.push({y:1e9,draw:g=>drawHeals(g,p)});
     return [...(r||[]),...extra];};}
 const running=()=>{if(!STORY())return false;const s=B()?.game?.state;return s&&s!=='ui'&&s!=='over';};

 // ---- HUD: ball + potion buttons (also work on touch screens) ----
 let hudEl=null,toastEl=null,toastT=0;
 function css(){const st=document.createElement('style');st.textContent=`
   #ps-catch-hud{position:fixed;right:12px;bottom:168px;z-index:60;display:none;flex-direction:column;align-items:flex-end;gap:6px;font:700 12px Pixelify,Fredoka,system-ui,sans-serif;color:#fff;pointer-events:auto}
   #ps-catch-hud .row{display:flex;gap:6px}
   #ps-catch-hud button{display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:10px;border:2px solid #3b3f5c;background:rgba(16,22,36,.88);color:#fff;font:inherit;cursor:pointer}
   #ps-catch-hud button img{width:22px;height:22px;image-rendering:pixelated}
   #ps-catch-hud .key{opacity:.6;font-size:10px}
   #ps-catch-hud .tgt{padding:4px 8px;border-radius:8px;background:rgba(16,22,36,.8);border:2px solid #ffe066;max-width:240px;text-align:right}
   #ps-catch-toast{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:66;padding:8px 16px;border-radius:10px;background:rgba(16,22,36,.92);border:2px solid #ffe066;color:#fff;font:700 15px Pixelify,Fredoka,system-ui,sans-serif;display:none;pointer-events:none;text-align:center;max-width:min(560px,calc(100vw - 32px))}`;document.head.append(st);}
 function hud(){
   const b=bag(),p=B()?.game?.player;if(!hudEl){css();hudEl=document.createElement('div');hudEl.id='ps-catch-hud';document.body.append(hudEl);
     hudEl.addEventListener('pointerdown',ev=>{const a=ev.target.closest('[data-a]')?.dataset.a;if(!a)return;ev.preventDefault();ev.stopPropagation();if(a==='ball')throwBall();else if(a==='cycle')cycleBall();else if(a==='potion')usePotion();});}
   if(!b||!p||!running()){hudEl.style.display='none';return;}
   pickBall();const pot=b.potion>0?'potion':'superpotion';
   const tgt=target&&catchable(target)?`<div class="tgt">🎯 ${target.psSize&&target.psSize!=='normal'?SIZES[target.psSize].name+' ':''}${target.name||'Pokémon'}${target.boss?' (boss)':''} · catch ≈ ${Math.round(chance(target,sel)*100)}%</div>`:'';
   hudEl.innerHTML=`${tgt}${holdFire?'<div class="tgt" style="border-color:#ff9a3d">⏸ Attacks paused</div>':''}<div class="row"><button data-a="cycle" title="Switch ball (B)"><img src="${BALLS[sel].img}?v=1" alt="">${BALLS[sel].name} ×${b[sel]||0}</button><button data-a="ball" title="Throw (Z)">Throw <span class="key">Z</span></button></div>
     <div class="row"><button data-a="potion" title="Potion (X)"><img src="${ITEMS[pot].img}?v=1" alt="">${ITEMS[pot].name} ×${b[pot]||0} <span class="key">X</span></button></div>`;
   hudEl.style.display='flex';
 }
 function toast(text,dur=2.2){if(!toastEl){toastEl=document.createElement('div');toastEl.id='ps-catch-toast';document.body.append(toastEl);}toastEl.textContent=text;toastEl.style.display='block';toastT=dur;}
 addEventListener('keydown',ev=>{if(!running()||ev.repeat||ev.target?.matches?.('input,textarea'))return;const k=ev.key.toLowerCase();
   if(k==='z'){throwBall();}else if(k==='x'){usePotion();}else if(k==='b'){cycleBall();}},true);

 // ---- Poke Mart (main menu) ----
 // =====================================================================================================
 //  SIZES: wild Pokemon come in Small, Normal or Big. Small: weaker hits but faster. Big: harder hits, more
 //  bulk, slower. Catching one unlocks that size of that species for your partner (Trainer menu). Pokemon you
 //  got any other way count as Normal. Caught only a Big Magikarp? Then Big is the only size you can use.
 // =====================================================================================================
 const SIZES={
   small:{name:'Small',scale:.78,hp:.8,dmg:.85,spd:1.15,def:0,chance:.18},
   normal:{name:'Normal',scale:1,hp:1,dmg:1,spd:1,def:0,chance:.64},
   big:{name:'Big',scale:1.3,hp:1.35,dmg:1.2,spd:.88,def:.12,chance:.18}};
 const SIZE_ORDER=['small','normal','big'];
 function sizesOf(dex){const S=E()?.DB?.save;if(!S)return {};if(String(B()?.user||'').trim().toLowerCase()==='lovergare')return {small:true,normal:true,big:true};   // [Gard] the owner has every size
 S.psSizes=S.psSizes||{};const r=S.psSizes[dex];
   if(r)return r;return S.owned&&S.owned[dex]?{normal:true}:{};}      // owned before sizes existed / from the Gacha: Normal
 function grantSize(dex,size,wasOwned){const S=E().DB.save;S.psSizes=S.psSizes||{};const cur=S.psSizes[dex]||(wasOwned?{normal:true}:{});cur[size]=true;S.psSizes[dex]=cur;}
 function chosenSize(dex){const S=E()?.DB?.save,have=sizesOf(dex);let s=S?.psSizeSel?.[dex];if(!s||!have[s])s=have.normal?'normal':SIZE_ORDER.find(k=>have[k])||'normal';return s;}
 function scaleBody(o,f){if(o.anim&&Number.isFinite(o.anim.scale))o.anim.scale*=f;if(Number.isFinite(o.r))o.r*=f;if(Number.isFinite(o.bodyH))o.bodyH*=f;}
 // wild Pokemon: a size is rolled as each one appears (bosses stay Normal)
 // [Gard] Scarlet/Violet-style sizes (both modes): every wild Pokemon gets its own size (a little smaller or bigger,
 // looks only). Very rarely one is TINY (1 in 256) or JUMBO (1 in 256) - those are the marked ones: catching one
 // (Story) or defeating one (Original) unlocks Small / Big for its first form. Bosses stay normal.
 const MARK={tiny:{chance:1/256,size:'small',scale:.6,label:'TINY',col:'#9ae6ff'},jumbo:{chance:1/256,size:'big',scale:1.5,label:'JUMBO',col:'#ffd23f'}};
 const sized=new WeakSet();
 function sizeEnemies(){for(const e of B()?.enemies?.all?.()||[]){if(!e||sized.has(e))continue;sized.add(e);if(e.dead||e.remote||e.boss||e.legend||e.__roamer||e.__maxRaid)continue;
   const r=Math.random();let mark=null;if(r<MARK.tiny.chance)mark='tiny';else if(r<MARK.tiny.chance+MARK.jumbo.chance)mark='jumbo';
   if(!mark){const v=(Math.random()+Math.random())/2;e.psSize='normal';scaleBody(e,.88+.24*v);continue;}   // XS..XL, looks only
   const m=MARK[mark],z=SIZES[m.size];e.psMark=mark;e.psSize=m.size;scaleBody(e,m.scale);
   if(Number.isFinite(e.maxHp)){e.maxHp*=z.hp;e.hp*=z.hp;}if(Number.isFinite(e.spd))e.spd*=z.spd;if(Number.isFinite(e._dmg))e._dmg*=z.dmg;if(Number.isFinite(e.shotDmg))e.shotDmg*=z.dmg;}}
 // Original mode: defeating a Tiny / Jumbo unlocks that size for its first form
 let killWrapped=false;
 function wrapKill(){const P=E()?.Progress;if(killWrapped||!P||typeof P.kill!=='function')return;killWrapped=true;const k=P.kill;
   P.kill=function(e,...a){try{if(e&&e.psMark&&!e.remote&&!e.__psCaughtGone&&!STORY()){const base=window.PS_PARTNER?window.PS_PARTNER.base(e.dex):Number(e.dex),sz=MARK[e.psMark].size,had=!!sizesOf(base)[sz];
       if(!had){grantSize(base,sz,!!E().DB.owns(base));save();const nm=(E().DEX_BY[base]||{}).name||'it';toast((e.psMark==='jumbo'?'JUMBO ':'TINY ')+(e.name||'Pokémon')+' defeated! '+SIZES[sz].name+' size unlocked for '+nm+'!',3.2);}}}catch(_){}
     return k.call(this,e,...a);};}
 // the TINY / JUMBO tag over marked Pokemon
 let markHooked=false;
 function hookMarks(){const T=E()?.Training;if(markHooked||!T||typeof T.drawables!=='function')return;markHooked=true;const orig=T.drawables;
   T.drawables=function(){const r=orig.apply(this,arguments),extra=[];for(const e of B()?.enemies?.all?.()||[]){if(!e||e.dead||!e.psMark)continue;const m=MARK[e.psMark];
     extra.push({y:e.y+.2,draw(g){const h=Number(e.bodyH)||24;g.save();g.font='bold 9px monospace';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#1a1a2e';g.strokeText(m.label,e.x,e.y-h-14);g.fillStyle=m.col;g.fillText(m.label,e.x,e.y-h-14);g.restore();}});}
     return extra.length?[...(r||[]),...extra]:r;};}
 // your Pokemon: the size chosen in the Trainer menu, applied when the run starts (and kept through Mega Evolution)
 let sizedPlayer=null;
 function sizePlayer(p){
   const dex=Number(p.dex),size=chosenSize(dex),z=SIZES[size];
   if(sizedPlayer!==p){sizedPlayer=p;p.psSize=size;if(size!=='normal'){
     if(Number.isFinite(p.baseAtk))p.baseAtk*=z.dmg;if(Number.isFinite(p.baseSpa))p.baseSpa*=z.dmg;if(Number.isFinite(p.baseSpd))p.baseSpd*=z.spd;
     if(Number.isFinite(p.maxHp)){p.maxHp=Math.round(p.maxHp*z.hp);p.hp=p.maxHp;}if(z.def)p.dmgReduce=Math.min(.8,(Number(p.dmgReduce)||0)+z.def);
     scaleBody(p,z.scale);}p.__psSizeAnim=p.anim;}
   else if(p.anim&&p.anim!==p.__psSizeAnim){p.__psSizeAnim=p.anim;if(p.psSize&&p.psSize!=='normal'&&p.anim&&Number.isFinite(p.anim.scale))p.anim.scale*=SIZES[p.psSize].scale;}   // new sprite (Mega / Primal)
 }

 // ---- Trainer menu: Girl / Boy and your partner's size ----
 function trainerButton(){
   const list=document.querySelector('.menu-box .menu-list');if(!list||list.querySelector('[data-go="pstrainer"]'))return;
   const btn=document.createElement('button');btn.className='menu-item';btn.dataset.go='pstrainer';
   btn.innerHTML=`<span class="mi-ico"><span class="ps-tr-ico" style="display:block;width:32px;height:32px;background:url(${trainerSrc()}) 0 0/128px 128px;image-rendering:pixelated"></span></span>Trainer<small>Pick your Trainer · your Pokémon's size</small>`;
   btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openTrainer();},true);
   const mart=list.querySelector('[data-go="psmart"]');mart?mart.after(btn):list.append(btn);
 }
 const trainerSrc=()=>'assets/trainer/'+trKey()+'.png?v=1';
 function openTrainer(first){
   let m=document.getElementById('ps-trainer-menu');
   if(!m){m=document.createElement('div');m.id='ps-trainer-menu';m.style.cssText='position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;background:rgba(6,8,16,.6)';document.body.append(m);
     m.addEventListener('click',ev=>{const t=ev.target.closest('[data-g],[data-s],[data-close]');const S=E().DB.save;
       if(ev.target===m&&S.psTrainer){m.style.display='none';return;}if(!t)return;
       if(t.dataset.close!==undefined){if(S.psTrainer)m.style.display='none';return;}
       if(t.dataset.g){S.psTrainer=t.dataset.g;save();renderTrainer();const ic=document.querySelector('[data-go="pstrainer"] .ps-tr-ico');if(ic)ic.style.backgroundImage='url('+trainerSrc()+')';}
       if(t.dataset.s&&!t.disabled){S.psSizeSel=S.psSizeSel||{};S.psSizeSel[S.partner]=t.dataset.s;save();renderTrainer();}});}
   m.style.display='flex';renderTrainer();
 }
 function renderTrainer(){
   const m=document.getElementById('ps-trainer-menu'),S=E()?.DB?.save;if(!m||!S)return;
   const dex=Number(S.partner),mon=(E().DEX||[]).find(d=>d.dex===dex),have=sizesOf(dex),cur=chosenSize(dex);
   const card=(g,label)=>`<button data-g="${g}" style="padding:4px 2px 6px;border-radius:12px;border:3px solid ${S.psTrainer===g?'#ffd23f':'#3b3f5c'};background:#1b2238;color:#fff;cursor:pointer;font:800 12px Pixelify,Fredoka,system-ui,sans-serif">
     <div style="width:64px;height:64px;margin:0 auto 2px;background:url(assets/trainer/${g}.png?v=1) 0 0/256px 256px;image-rendering:pixelated"></div>${label}</button>`;
   const sz=k=>{const ok=!!have[k];return `<button data-s="${k}" ${ok?'':'disabled'} style="flex:1;padding:8px;border-radius:10px;border:3px solid ${cur===k?'#ffd23f':'#3b3f5c'};background:${ok?'#1b2238':'#151a28'};color:${ok?'#fff':'#666'};cursor:${ok?'pointer':'not-allowed'};font:800 13px Pixelify,Fredoka,system-ui,sans-serif">${SIZES[k].name}${ok?'':' 🔒'}<br><small style="opacity:.75;font-weight:600">${k==='small'?'faster · less damage':k==='big'?'more damage & defense · slower':'balanced'}</small></button>`;};
   const btn='padding:6px 10px;border-radius:8px;border:2px solid #3b3f5c;background:#3b3f5c;color:#fff;font:800 12px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer';
   m.innerHTML=`<div style="width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;padding:16px;border-radius:14px;background:#101824;border:3px solid #b89a60;color:#f7e4bc;font:600 13px Pixelify,Fredoka,system-ui,sans-serif">
     <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">${S.psTrainer?'Trainer':'Choose your Trainer'}</b>${S.psTrainer?`<button data-close style="${btn}">✕</button>`:''}</div>
     <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:6px;margin:12px 0;max-height:min(330px,46vh);overflow-y:auto;padding-right:4px">${TRAINERS.map(t=>card(t[0],t[1])).join('')}</div>
     <small style="opacity:.7;display:block">Your Pokémon's size is under its Upgrades button on the main menu.</small></div>`;
 }
 // ---- [Gard] Pokemon size: its own button right under the partner's Upgrades button (both modes) ----
 function sizeMenu(){
   let m=document.getElementById('ps-size-menu');
   if(!m){m=document.createElement('div');m.id='ps-size-menu';m.style.cssText='position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;background:rgba(6,8,16,.6)';document.body.append(m);
     m.addEventListener('click',ev=>{const t=ev.target.closest('[data-s],[data-close]');if(ev.target===m||t?.dataset.close!==undefined){m.style.display='none';return;}if(!t||t.disabled)return;
       const S=E().DB.save;S.psSizeSel=S.psSizeSel||{};S.psSizeSel[S.partner]=t.dataset.s;save();renderSize();sizeButton(true);});}
   m.style.display='flex';renderSize();
 }
 function renderSize(){
   const m=document.getElementById('ps-size-menu'),S=E()?.DB?.save;if(!m||!S)return;
   const dex=Number(S.partner),mon=(E().DEX||[]).find(d=>d.dex===dex),have=sizesOf(dex),cur=chosenSize(dex);
   const sz=k=>{const ok=!!have[k],z=SIZES[k];return `<button data-s="${k}" ${ok?'':'disabled'} style="flex:1;padding:8px;border-radius:10px;border:3px solid ${cur===k?'#ffd23f':'#3b3f5c'};background:${ok?'#1b2238':'#151a28'};color:${ok?'#fff':'#666'};cursor:${ok?'pointer':'not-allowed'};font:800 14px Pixelify,Fredoka,system-ui,sans-serif">${z.name}${ok?'':' 🔒'}<br><small style="opacity:.75;font-weight:600">${k==='small'?'Faster, weaker hits':k==='big'?'Stronger, bulkier, slower':'Balanced'}</small></button>`;};
   const btn='padding:6px 10px;border-radius:8px;border:2px solid #3b3f5c;background:#3b3f5c;color:#fff;font:800 12px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer';
   m.innerHTML=`<div style="width:min(420px,calc(100vw - 32px));padding:16px;border-radius:14px;background:#101824;border:3px solid #b89a60;color:#f7e4bc;font:600 13px Pixelify,Fredoka,system-ui,sans-serif">
     <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">${mon?mon.name:'Your Pokémon'}'s size</b><button data-close style="${btn}">✕</button></div>
     <div style="display:flex;gap:8px;margin-top:12px">${SIZE_ORDER.map(sz).join('')}</div>
     <small style="opacity:.7;display:block;margin-top:10px">Catch a Small or Big ${mon?mon.name:'one'} in a Story run to unlock that size.</small></div>`;
 }
 function sizeButton(force){
   const up=document.getElementById('menu-partner-upg');let b=document.getElementById('ps-size-btn');
   if(!up){if(b)b.style.display='none';return;}
   const S=E()?.DB?.save;if(!S)return;
   if(!document.getElementById('ps-pc-css')){const st=document.createElement('style');st.id='ps-pc-css';st.textContent='#ps-pc-tools .pp-upg{margin:0 !important;font-size:12px;padding:2px 9px}';document.head.append(st);}
   // Upgrades, the skin toggle and Size share one row under the partner (they used to stack and get cut off)
   let row=document.getElementById('ps-pc-tools');
   if(!row||!row.isConnected){row=document.createElement('div');row.id='ps-pc-tools';row.style.cssText='display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 6px;margin-top:4px;max-width:100%';}
   if(up.parentElement!==row){up.insertAdjacentElement('beforebegin',row);row.appendChild(up);}
   const sk=document.getElementById('ps-skin-toggle');if(sk&&sk.parentElement!==row)up.insertAdjacentElement('afterend',sk);
   if(!b){b=document.createElement('button');b.type='button';b.className='pp-upg';b.id='ps-size-btn';b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();sizeMenu();});}
   if(b.parentElement!==row||b!==row.lastElementChild)row.appendChild(b);
   b.style.display='';const z=SIZES[chosenSize(Number(S.partner))]||SIZES.normal,t='📏 '+z.name;b.title='Your Pokémon\'s size';
   if(force||b.textContent!==t)b.textContent=t;
   const old=document.getElementById('ps-size-row');if(old)old.remove();
 }
 // New save: ask Boy or Girl once the main menu is really on screen (not behind the intro / personality quiz)
 function firstTime(){const S=E()?.DB?.save,g=B()?.game;if(!S||S.psTrainer||!g||g.state!=='ui'||document.getElementById('ps-trainer-menu')?.offsetParent)return;
   const list=document.querySelector('.menu-box .menu-list');if(!list||!list.offsetParent)return;const r=list.getBoundingClientRect();if(r.width<10||r.height<10)return;
   const top=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(40,r.height/2));if(!top||!list.contains(top))return;
   openTrainer(true);}
 // =====================================================================================================
 //  TRAINER'S BAG: click / tap your Trainer during a run to pause the game and look in the bag.
 // =====================================================================================================
 let bagOpen=false;
 function openBag(){
   const X=E();if(!X||bagOpen)return;bagOpen=true;try{X.Game.soloHold(true);}catch(e){}
   let m=document.getElementById('ps-bag');
   if(!m){m=document.createElement('div');m.id='ps-bag';m.style.cssText='position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(6,8,16,.55)';document.body.append(m);
     m.addEventListener('pointerdown',ev=>{ev.stopPropagation();const t=ev.target.closest('[data-ball],[data-use],[data-close]');
       if(ev.target===m||t?.dataset.close!==undefined){closeBag();return;}if(!t)return;
       if(t.dataset.ball){sel=t.dataset.ball;renderBag();hud();}
       if(t.dataset.use){const k=t.dataset.use,b=bag(),p=B()?.game?.player;if(b&&p&&b[k]>0&&p.hp<p.maxHp){b[k]--;save();const before=p.hp;p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*ITEMS[k].heal));heals.push({t:0,n:Math.round(p.hp-before)});renderBag();hud();}}});
     addEventListener('keydown',ev=>{if(bagOpen&&(ev.key==='Escape'||ev.key.toLowerCase()==='i')){ev.preventDefault();ev.stopPropagation();closeBag();}},true);}
   m.style.display='flex';renderBag();
 }
 function closeBag(){bagOpen=false;const m=document.getElementById('ps-bag');if(m)m.style.display='none';try{E().Game.soloHold(false);}catch(e){}}
 function renderBag(){
   const m=document.getElementById('ps-bag'),b=bag(),p=B()?.game?.player,S=E()?.DB?.save;if(!m||!b)return;
   const trk=trKey(),btn='padding:5px 10px;border-radius:8px;border:2px solid #3b3f5c;font:800 12px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer';
   const ballRow=k=>`<div style="display:flex;align-items:center;gap:10px;padding:7px;border-radius:10px;background:${sel===k?'#2a3354':'#1b2238'};margin:5px 0;border:2px solid ${sel===k?'#ffd23f':'transparent'}">
     <img src="${BALLS[k].img}?v=1" width="28" height="28" style="image-rendering:pixelated"><div style="flex:1"><b>${BALLS[k].name}</b> ×${b[k]||0}<br><small style="opacity:.7">${k==='master'?'Always catches':'Catch bonus ×'+BALLS[k].bonus}</small></div>
     ${b[k]>0?`<button data-ball="${k}" style="${btn};background:${sel===k?'#3b3f5c':'#ffd23f'};color:${sel===k?'#fff':'#2a1d00'}">${sel===k?'Selected':'Use this ball'}</button>`:''}</div>`;
   const itemRow=k=>`<div style="display:flex;align-items:center;gap:10px;padding:7px;border-radius:10px;background:#1b2238;margin:5px 0">
     <img src="${ITEMS[k].img}?v=1" width="28" height="28" style="image-rendering:pixelated"><div style="flex:1"><b>${ITEMS[k].name}</b> ×${b[k]||0}<br><small style="opacity:.7">Restores ${Math.round(ITEMS[k].heal*100)}% HP</small></div>
     ${b[k]>0&&p&&p.hp<p.maxHp?`<button data-use="${k}" style="${btn};background:#7dff9a;color:#0b2a14">Use</button>`:''}</div>`;
   m.innerHTML=`<div style="width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;padding:16px;border-radius:14px;background:#101824;border:3px solid #b89a60;color:#f7e4bc;font:600 13px Pixelify,Fredoka,system-ui,sans-serif">
     <div style="display:flex;align-items:center;gap:10px"><div style="width:48px;height:48px;background:url(assets/trainer/${trk}.png?v=1) 0 0/192px 192px;image-rendering:pixelated"></div>
       <div style="flex:1"><b style="font-size:20px">Trainer's Bag</b><br><small style="opacity:.75">Game paused · ${p?Math.round(p.hp)+' / '+Math.round(p.maxHp)+' HP':''}</small></div><button data-close style="${btn};background:#3b3f5c;color:#fff">✕</button></div>
     <div style="margin-top:10px;font-size:11px;letter-spacing:2px;opacity:.7">POKÉ BALLS</div>${BALL_ORDER.map(ballRow).join('')}
     <div style="margin-top:8px;font-size:11px;letter-spacing:2px;opacity:.7">MEDICINE</div>${Object.keys(ITEMS).map(itemRow).join('')}
     <div style="margin-top:8px;font-size:11px;letter-spacing:2px;opacity:.7">KEY ITEMS</div><div style="padding:8px;border-radius:10px;background:#151a28;opacity:.6">Nothing here yet.</div>
     <small style="display:block;margin-top:10px;opacity:.65">Esc or ✕ to close and resume.</small></div>`;
 }
 function clickedTrainer(wx,wy){return Math.abs(wx-tr.x)<20&&wy<tr.y+6&&wy>tr.y-52;}

 // =====================================================================================================
 //  HOLD FIRE: press the number of the move you're already using (e.g. 1 while using move 1) and your Pokemon
 //  stops attacking (handy for catching). Press it again, or switch moves, to attack again.
 // =====================================================================================================
 let holdFire=false,combatHooked=false;
 function hookCombat(){const C=E()?.Combat;if(combatHooked||!C||typeof C.tick!=='function')return;combatHooked=true;const tick=C.tick;
   C.tick=function(dt,player){if(holdFire&&STORY()&&player===B()?.game?.player)return;return tick.apply(this,arguments);};}
 addEventListener('keydown',ev=>{
   if(!running()||ev.repeat||ev.target?.matches?.('input,textarea'))return;const m=/^Digit([1-9])$/.exec(ev.code)||/^Numpad([1-9])$/.exec(ev.code);if(!m)return;
   const p=B()?.game?.player;if(!p)return;const i=Number(m[1])-1;
   if(i===Number(p.active)){holdFire=!holdFire;toast(holdFire?'⏸ Attacks paused — press '+(i+1)+' again to attack':'▶ Attacking again',1.6);hud();}
   else if(holdFire){holdFire=false;hud();}
 },true);
 function martButton(){
   const list=document.querySelector('.menu-box .menu-list');if(!list||list.querySelector('[data-go="psmart"]'))return;
   const btn=document.createElement('button');btn.className='menu-item';btn.dataset.go='psmart';
   btn.innerHTML='<span class="mi-ico"><img src="assets/fx/ball-poke.png?v=1" width="32" height="32" alt="" style="image-rendering:pixelated;display:block"></span>Poké Mart<small>Poké Balls and Potions</small>';
   btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openMart();},true);
   const gacha=list.querySelector('[data-go="gacha"]');gacha?gacha.after(btn):list.append(btn);
 }
 function openMart(){
   let m=document.getElementById('ps-mart');
   if(!m){m=document.createElement('div');m.id='ps-mart';m.style.cssText='position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;background:rgba(6,8,16,.6)';document.body.append(m);
     m.addEventListener('click',ev=>{const t=ev.target.closest('[data-buy],[data-close]');if(ev.target===m||t?.dataset.close!==undefined){m.style.display='none';return;}if(!t)return;
       const [k,n]=t.dataset.buy.split(':'),S=E().DB.save,price=(BALLS[k]||ITEMS[k]).price*Number(n);
       if((Number(S.coins)||0)<price){t.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:200});return;}
       S.coins-=price;bag()[k]+=Number(n);save();renderMart();});}
   m.style.display='flex';renderMart();
 }
 function renderMart(){
   const m=document.getElementById('ps-mart'),b=bag(),coins=Number(E()?.DB?.save?.coins)||0;if(!m||!b)return;
   const row=(k,it)=>`<div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;background:#1b2238;margin:6px 0">
     <img src="${it.img}?v=1" width="32" height="32" style="image-rendering:pixelated"><div style="flex:1"><b>${it.name}</b><br><small style="opacity:.75">${it.price?it.price+' PokéCoins':'Not for sale: found very rarely in runs'} · you have ${b[k]||0}</small></div>
     ${it.price?`<button data-buy="${k}:1" style="${btn}">Buy 1</button><button data-buy="${k}:10" style="${btn}">Buy 10</button>`:''}</div>`;
   const btn='padding:6px 10px;border-radius:8px;border:2px solid #3b3f5c;background:#ffd23f;color:#2a1d00;font:800 12px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer';
   m.innerHTML=`<div style="width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;padding:16px;border-radius:14px;background:#101824;border:3px solid #b89a60;color:#f7e4bc;font:600 13px Pixelify,Fredoka,system-ui,sans-serif">
     <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">Poké Mart</b><button data-close style="${btn};background:#3b3f5c;color:#fff">✕</button></div>
     <div style="margin:6px 0 10px;opacity:.85">PokéCoins: <b>${coins}</b></div>
     ${BALL_ORDER.map(k=>row(k,BALLS[k])).join('')}${Object.entries(ITEMS).map(([k,it])=>row(k,it)).join('')}
     <small style="opacity:.7">In a run: click a wild Pokémon, then Z to throw · B switches ball · X uses a Potion.</small></div>`;
 }

 // ---- main loop ----
 let last=0,hudT=0;
 function frame(ts){
   requestAnimationFrame(frame);const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;hookDraws();hookCombat();sizeButton();if(STORY()){martButton();trainerButton();firstTime();}else{for(const k of ['psmart','pstrainer']){const b=document.querySelector('[data-go="'+k+'"]');if(b)b.remove();}}
   if(toastT>0){toastT-=dt;if(toastT<=0&&toastEl)toastEl.style.display='none';}
   const p=B()?.game?.player;
   if(running()){const tm=document.getElementById('ps-trainer-menu');if(tm&&tm.style.display!=='none')tm.style.display='none';}   // menus never stay over a run
   wrapKill();hookMarks();
   if(p){const st=B()?.game?.state;if(st&&st!=='ui'&&st!=='over'){sizeEnemies();if(!STORY())sizePlayer(p);}}   // [Gard] sizes work in Original too
   if(!p||!running()){holdFire=false;if(bagOpen)closeBag();if(hudEl)hudEl.style.display='none';throws.length=0;target=null;alive.clear();return;}
   sizePlayer(p);
   if(B().game.state==='playing'){updateTrainer(dt,p);updateThrows(dt);drops();potionCd=Math.max(0,potionCd-dt);for(const h of heals)h.t+=dt;while(heals.length&&heals[0].t>.9)heals.shift();}
   if(target&&!catchable(target)&&!throws.some(t=>t.e===target))target=null;
   hudT-=dt;if(hudT<=0){hudT=.25;hud();}
 }
 requestAnimationFrame(frame);
 window.PS_CATCH={bag,throwBall,usePotion,chance:(e,b)=>chance(e,b||sel),RATES,SIZES,MARK,sizesOf,chosenSize,trainer:()=>({x:tr.x,y:tr.y}),bagOpen:()=>bagOpen,holdFire:()=>holdFire};
})();
