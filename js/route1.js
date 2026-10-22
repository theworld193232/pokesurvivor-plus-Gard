/* =====================================================================================================
   STORY MODE · CHAPTER 1: KANTO ROUTE 1   (the normal Level 1 is still the Forest)
   - Started from the "Story Mode" button on the main menu. Clearing it gives story rewards (not a Level 1 win).
   - A hand-made map traced from Route 1: tree borders, tall grass, sand paths, ledges, flowers, the sign and
     the fence by Pallet Town. You start at the southern entrance.
     The engine asks this file for the terrain and props of every tile (hooks PS_ROUTE_TERR / PS_ROUTE_PROP in
     js/app.min.js), so walls, trees, pathfinding and spawns all follow the map.
   - Wild Pokemon: only Route 1 species (stronger evolutions join as time goes on).
   - Goal: survive 5 minutes. Then Blue shows up, challenges you to your first battle and sends out Squirtle (the
     boss). Beat Squirtle to clear the route.
   ===================================================================================================== */
(()=>{'use strict';
 // Map legend: T tree, G tall grass, S sand path, L ledge, X fence, R flowers, N sign, . grass
 const GRID=[
   'TTTTTTTTTTSSSSTTTTTTTTTT',
   'TTTTTTTTTTSSSSTTTTTTTTTT',
   'TT........SSSS.....R.RTT',
   'TT......TTSSSSSSSSSSS.TT',
   'TT......TT.SSSSSSSSSSSTT',
   'TTLLLLLLTTLLLLLL...SS.TT',
   'TT.R...RTTGGGGGGGGGGGGTT',
   'TTR...R.TTGGGGGGGGGGGGTT',
   'TT.R...RTTGGGGGGGGGGGGTT',
   'TTR...R.TTGGGGGGGGGGGGTT',
   'TTLLLLLLTTGGGGGGGGGGGGTT',
   'TT.R....TT....SSSSSSS.TT',
   'TTR..........SSSSSSSS.TT',
   'TT.R..........S.GGGGGGTT',
   'TTTT......TTTTTTGGGGGGTT',
   'TTTTLLLLLLTTTTTTGGGGGGTT',
   'TTTT......TTTTTTGGGGGGTT',
   'TT............S.GGGGGGTT',
   'TT....SSSSSSSSSS...R.RTT',
   'TT...SSSSSSSSSS...R.R.TT',
   'TTLL.LLLL..LLLLLLLLLLLTT',
   'TT...SSSSSSSSSSSSSSSS.TT',
   'TT....SSSSSSSSSSSSSSSSTT',
   'TT................SSSSTT',
   'TTTTTTTTTTTTGGGGGGSSSSTT',
   'TTTTTTTTTTTTGGGGGGSSSSTT',
   'TTTTTTTTTTTTGGGGGGLLLLTT',
   'TT.R.R......GGGGGGSSSSTT',
   'TTR.R.......GGGGGGSSSSTT',
   'TT.SSSSSSSSSSSSSSSSSSSTT',
   'TT.SSSSSSSSSSSSSSSSSS.TT',
   'TTLLLL...NLLLLLLLLLLLLTT',
   'TT..GGGGGGGSSSS..GGGGGTT',
   'TT..GGGGGGGSSSS..GGGGGTT',
   'TTGGGGGGG.R.SS.GGGGGR.TT',
   'TTGGGGGGGR..GG.GGGGG.RTT',
   'TTXXXXXXXXXXGGXXXXXXXXTT',
   'TTTTTTTTTTTTGGTTTTTTTTTT',
   'TTTTTTTTTTTTGGTTTTTTTTTT',
   'TTTTTTTTTTTTGGTTTTTTTTTT'
 ];
 // Each map cell is 2x2 game tiles. World tile (0,0) - where every run starts - is the southern entrance.
 const SCALE=2,X0=-25,Y0=-71,COLS=GRID[0].length;
 // Tuning knobs.
 const TUNE={
   blueAt:300,                 // seconds of survival before Blue arrives (5:00)
   squirtle:{hp:2600,spd:74,dmg:26,xp:420,shotDmg:14,shotCd:1.25,range:260},
   name:'Route 1',types:['normal','flying','grass','poison','bug','electric']
 };
 // Wild Pokemon, by the second they start appearing. Stats are level-1 values; the game scales them over time.
 const WILD=[
   {from:0,list:[
     {dex:16,name:'Pidgey',behavior:'chase',hp:14,spd:62,dmg:6,xp:4},
     {dex:19,name:'Rattata',behavior:'runner',hp:10,spd:90,dmg:6,xp:4},
     {dex:161,name:'Sentret',behavior:'chase',hp:13,spd:58,dmg:6,xp:4},
     {dex:163,name:'Hoothoot',behavior:'chase',hp:14,spd:56,dmg:6,xp:4},
     {dex:167,name:'Spinarak',behavior:'ranged',hp:12,spd:50,dmg:6,xp:4,shotDmg:4,shotCd:2.6,range:190},
     {dex:265,name:'Wurmple',behavior:'chase',hp:12,spd:48,dmg:5,xp:4},
     {dex:172,name:'Pichu',behavior:'ranged',hp:11,spd:56,dmg:6,xp:4,shotDmg:4,shotCd:2.6,range:190},
     {dex:43,name:'Oddish',behavior:'chase',hp:14,spd:46,dmg:6,xp:4},
     {dex:69,name:'Bellsprout',behavior:'chase',hp:13,spd:52,dmg:6,xp:4},
     {dex:204,name:'Pineco',behavior:'chase',hp:19,spd:40,dmg:7,xp:5}]},
   {from:100,list:[
     {dex:17,name:'Pidgeotto',behavior:'chase',hp:30,spd:68,dmg:8.5,xp:6},
     {dex:20,name:'Raticate',behavior:'runner',hp:24,spd:92,dmg:8.5,xp:6},
     {dex:162,name:'Furret',behavior:'chase',hp:32,spd:72,dmg:8.5,xp:6},
     {dex:25,name:'Pikachu',behavior:'ranged',hp:24,spd:62,dmg:8,xp:6,shotDmg:6,shotCd:2.2,range:210}]},
   {from:200,list:[
     {dex:18,name:'Pidgeot',behavior:'chase',hp:52,spd:78,dmg:11,xp:10}]}
 ];
 const E=()=>window.PS_HOOPA_ENGINE,B=()=>window.PS_MEGA_BRIDGE_V5;
 // Route 1 is only used for a Story Mode run (the normal Level 1 stays the Forest).
 let story=false;
 function menuRoute(){const g=B()?.game;return !!(window.PS_STORY&&window.PS_STORY.on()&&g&&!g.player&&!E()?.Coop?.active);}   // [Gard] the main-menu background shows Route 1 in Story
 function active(){if(menuRoute())return true;const M=E()?.Maps;return !!(story&&window.PS_STORY&&window.PS_STORY.on()&&M&&M.cur&&M.cur.n===1&&!M.cur.endless);}
 const STORY_REWARD={coins:3000,poke:5};
 function cell(tx,ty){const gx=Math.floor((tx-X0)/SCALE),gy=Math.floor((ty-Y0)/SCALE);return gy>=0&&gy<GRID.length&&gx>=0&&gx<COLS?GRID[gy][gx]:null;}

 // ---- terrain and props (asked by the engine for every tile it generates) ----
 // Trees on the edge of a wooded area are real (solid) tree props; deep forest and everything off the map is canopy.
 // Ledges and the fence are a low wall along the lower half of their cell.
 window.PS_ROUTE_TERR=(tx,ty)=>{
   if(!active())return null;const c=cell(tx,ty);if(c===null)return 1;
   if(c==='T'){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=cell(tx+dx,ty+dy);if(n!==null&&n!=='T')return 0;}return 1;}
   if(c==='L'||c==='X')return (((ty-Y0)%SCALE)+SCALE)%SCALE===SCALE-1?1:0;
   return 0;
 };
 window.PS_ROUTE_PROP=(tx,ty)=>{
   if(!active())return undefined;const c=cell(tx,ty);
   return c==='T'?'tree':c==='G'?'grass':null;
 };
 const isSand=(tx,ty)=>{const c=cell(tx,ty);return c==='S'||c==='N';};

 // ---- hook the engine objects once they exist ----
 let hooked=false;const BOSSES_ROUTE=[{at:1e9,dex:7,name:'Squirtle',behavior:'ranged',...TUNE.squirtle}];
 function hook(){
   const X=E();if(hooked||!X||!X.Tiles||!X.Enemies||!X.Maps||!X.World)return;hooked=true;
   // map name and allowed types for Level 1
   const m1=X.Maps.LIST&&X.Maps.LIST[0];if(m1&&m1.n===1){const bi=X.Tiles.BIOMES?.[m1.biome];orig={name:m1.name,types:m1.types,biome:bi&&bi.name};}
   // sand paths painted exactly where Route 1 has them (instead of random dirt patches)
   const paint=X.Tiles.paintChunk;
   X.Tiles.paintChunk=function(){const a=[...arguments];if(active()){const T=X.Tiles.T||16;a[4]=(px,py)=>isSand(Math.floor(px/T),Math.floor(py/T))?1:0;}return paint.apply(this,a);};
   // Route 1 wild Pokemon
   const EN=X.Enemies,bag=EN.bagAt,upcoming=EN.upcomingDex;
   const listAt=t=>{const out=[];for(const g of WILD)if(t>=g.from)out.push(...g.list);return out;};
   EN.bagAt=function(t){if(!active())return bag.apply(this,arguments);try{if(X.Events?.bag?.())return bag.apply(this,arguments);}catch(e){}return listAt(t);};
   EN.upcomingDex=function(t,ahead=60){if(!active())return upcoming.apply(this,arguments);return listAt(t+ahead).map(d=>d.dex);};
   // the only boss of Route 1 is Blue's Squirtle (it appears when Blue throws his Poke Ball)
   const own=Object.getOwnPropertyDescriptor(EN,'BOSSES');let normal=EN.BOSSES;
   if(own&&own.configurable!==false)Object.defineProperty(EN,'BOSSES',{configurable:true,enumerable:true,get(){return active()?BOSSES_ROUTE:normal;},set(v){normal=v;}});
   // flowers and the route sign, drawn on the ground (under every Pokemon)
   const liquid=X.World.drawLiquid;
   X.World.drawLiquid=function(g){const r=liquid.apply(this,arguments);try{if(active())drawDecor(g);}catch(e){}return r;};
 }
 // Level 1 is renamed (HUD, types) only while a Story run is on, and put back afterwards.
 let orig=null;
 function setStory(on){
   story=on;const X=E(),m1=X?.Maps?.LIST?.[0];if(!m1||!orig)return;const bi=X.Tiles?.BIOMES?.[m1.biome];
   if(on){m1.name=TUNE.name;m1.types=TUNE.types.slice();if(bi)bi.name=TUNE.name;}else{m1.name=orig.name;m1.types=orig.types;if(bi)bi.name=orig.biome;}
 }
 // ---- Story Mode menu ----
 function storyButton(){
   const list=document.querySelector('.menu-box .menu-list');
   {const o=list&&list.querySelector('[data-go="psstory"]');if(o)o.remove();return;}   // [Gard] the chapters now sit where the Acts are (js/story-mode.js), no menu button
   if(!list||list.querySelector('[data-go="psstory"]'))return;
   const btn=document.createElement('button');btn.className='menu-item';btn.dataset.go='psstory';
   btn.innerHTML='<span class="mi-ico"><img src="assets/fx/blue.png?v=1" width="32" height="32" alt="" style="image-rendering:pixelated;display:block;object-fit:contain"></span>Story Mode<small>Chapter 1 · Kanto Route 1</small>';
   btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openStory();},true);
   list.prepend(btn);
 }
 function openStory(){
   let m=document.getElementById('ps-story');const S=E()?.DB?.save;
   if(!m){m=document.createElement('div');m.id='ps-story';m.style.cssText='position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;background:rgba(6,8,16,.6)';document.body.append(m);
     m.addEventListener('click',ev=>{const t=ev.target.closest('[data-play],[data-close]');if(ev.target===m||t?.dataset.close!==undefined){m.style.display='none';return;}
       if(t?.dataset.play!==undefined){m.style.display='none';startStory();}});}
   const done=Number(S?.psStory?.route1)||0,btn='padding:8px 14px;border-radius:10px;border:2px solid #3b3f5c;font:800 14px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer';
   m.innerHTML=`<div style="width:min(460px,calc(100vw - 32px));padding:16px;border-radius:14px;background:#101824;border:3px solid #b89a60;color:#f7e4bc;font:600 13px Pixelify,Fredoka,system-ui,sans-serif">
     <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">Story Mode</b><button data-close style="${btn};background:#3b3f5c;color:#fff">✕</button></div>
     <div style="margin-top:12px;padding:12px;border-radius:12px;background:#1b2238;display:flex;gap:12px;align-items:center">
       <img src="assets/fx/blue.png?v=1" width="48" style="image-rendering:pixelated">
       <div style="flex:1"><b style="font-size:16px">Chapter 1 · Kanto Route 1</b><br><small style="opacity:.8">Survive 5 minutes on Route 1. Your rival Blue is waiting…</small>
       <br><small style="color:${done?'#7dff9a':'#ffd23f'}">${done?'✔ Cleared'+(done>1?' ×'+done:''):'Reward: '+STORY_REWARD.coins+' PokéCoins + '+STORY_REWARD.poke+' Poké Balls'}</small></div>
       <button data-play style="${btn};background:#ffd23f;color:#2a1d00">Play</button></div></div>`;
   m.style.display='flex';
 }
 function startStory(){const X=E();if(!X)return;try{X.Maps.choose(1);}catch(e){}setStory(true);try{X.Game.startRun();}catch(e){console.warn('Story start',e);setStory(false);}}
 setInterval(()=>{try{storyButton();const st=B()?.game?.state;if(story&&(st==='ui'||!B()?.game?.player)&&!(run&&run.phase==='done'))setStory(false);}catch(e){}},400);
 function drawDecor(g){
   const p=B()?.game?.player;if(!p)return;const T=Number(E().World.TS)||32,r=900;
   const t0=Math.floor((p.x-r)/T),t1=Math.floor((p.x+r)/T),u0=Math.floor((p.y-r)/T),u1=Math.floor((p.y+r)/T);
   for(let ty=u0;ty<=u1;ty++)for(let tx=t0;tx<=t1;tx++){const c=cell(tx,ty);
     if(c==='R'){const x=tx*T,y=ty*T;for(let i=0;i<3;i++){const fx=x+6+((tx*7+ty*3+i*11)%20),fy=y+6+((tx*5+ty*9+i*13)%20);
       g.fillStyle='#2f7a3a';g.fillRect(fx,fy+3,2,4);g.fillStyle=i%2?'#f08a6a':'#d83a4a';for(const [dx,dy] of [[-3,0],[3,0],[0,-3],[0,3]])g.fillRect(fx+dx-1.5,fy+dy-1.5,3,3);g.fillStyle='#ffe066';g.fillRect(fx-1,fy-1,2,2);}}
     else if(c==='N'&&(((tx-X0)%SCALE)+SCALE)%SCALE===0&&(((ty-Y0)%SCALE)+SCALE)%SCALE===0){const x=tx*T+T*.5,y=ty*T+T*.4;   // the Route 1 sign
       g.fillStyle='#6b4a2a';g.fillRect(x-3,y+8,6,22);g.fillStyle='#8a6640';g.fillRect(x-22,y-12,44,24);g.fillStyle='#d8c08a';g.fillRect(x-19,y-9,38,18);
       g.fillStyle='#5a3a20';g.font='bold 9px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('ROUTE 1',x,y);}
   }
 }

 // ---- Blue: "You snooze, you lose..." ----
 const blueImg=new Image();blueImg.src='assets/fx/blue.png?v=1';
 const ballImg=new Image();ballImg.src='assets/fx/pokeball.png?v=1';
 const canvas=document.createElement('canvas');canvas.id='ps-route1';canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:6;display:none';document.body.append(canvas);
 const ctx=canvas.getContext('2d');
 const LINES=["You snooze, you lose, and you're way behind right from the start...",
   "If you showed up on time you would have seen that I got the best Pokémon from Professor Oak. It's good to have a grandfather in the business...",
   "Now let's have a battle!"];
 const LOSE_LINE="WHAT? Unbelievable! I picked the wrong Pokémon!";
 let run=null,last=0;   // per-run state
 function newRun(p){run={player:p,phase:'wait',t:0,bx:0,by:0,line:0,shown:0,boss:null,landX:0,landY:0,ball:null,flash:0,won:false};BOSSES_ROUTE[0].at=1e9;}
 // Pokemon-style text box with a BLUE name tag; click / tap / any key moves on.
 let box=null;
 function textBox(){
   if(box)return box;const st=document.createElement('style');st.textContent=`
   #ps-blue-box{position:fixed;left:50%;bottom:110px;z-index:70;width:min(620px,calc(100vw - 32px));transform:translateX(-50%);display:none;pointer-events:auto;cursor:pointer}
   #ps-blue-box .bb{position:relative;padding:18px 24px 18px 20px;background:linear-gradient(#ffffff,#f1f3fb);border:4px solid #3b3f5c;border-radius:14px;box-shadow:inset 0 0 0 3px #c9d3ff,0 6px 0 rgba(0,0,0,.25),0 10px 30px rgba(0,0,0,.35)}
   #ps-blue-box .tag{position:absolute;left:18px;top:-15px;padding:3px 12px;border-radius:8px;background:linear-gradient(90deg,#3b6cff,#6a3cff);border:3px solid #3b3f5c;color:#fff;font:800 12px Pixelify,Fredoka,system-ui,sans-serif;letter-spacing:2px}
   #ps-blue-box .tx{color:#33354a;font:700 20px Pixelify,Fredoka,system-ui,sans-serif;line-height:1.35;min-height:54px;text-shadow:2px 2px 0 #d9dbe9}
   #ps-blue-box .ar{position:absolute;right:16px;bottom:10px;color:#3b3f5c;font:700 16px monospace;animation:bbB .7s steps(2) infinite}
   @keyframes bbB{50%{transform:translateY(3px)}}`;document.head.append(st);
   box=document.createElement('div');box.id='ps-blue-box';box.innerHTML='<div class="bb"><div class="tag">BLUE</div><div class="tx"></div><div class="ar">▼</div></div>';
   document.body.append(box);const next=e=>{if(box.style.display==='none'||!run)return;e.preventDefault?.();e.stopPropagation?.();advance();};
   box.addEventListener('pointerdown',next);addEventListener('keydown',e=>{if(box.style.display!=='none'&&run&&(run.phase==='talk'||run.phase==='lose'))next(e);},true);
   return box;
 }
 function say(text){const b=textBox();b.style.display='block';run.text=text;run.shown=0;run.lineT=0;b.querySelector('.tx').textContent='';}
 function advance(){if(!run)return;
   if(run.shown<run.text.length){run.shown=run.text.length;box.querySelector('.tx').textContent=run.text;return;}   // first tap finishes the line
   if(run.phase==='talk'){run.line++;if(run.line<LINES.length)say(LINES[run.line]);else{box.style.display='none';startThrow();}}
   else if(run.phase==='lose'){box.style.display='none';finish();}
 }
 function hold(on){try{E().Game.soloHold(on);}catch(e){}}
 function startBlue(p){run.phase='walk';run.t=0;run.bx=p.x;run.by=p.y-170;hold(true);}
 function startThrow(){const p=run.player;run.phase='throw';run.t=0;run.landX=(run.bx+p.x)/2;run.landY=(run.by+p.y)/2+10;}
 function releaseSquirtle(){run.phase='battle';run.t=0;hold(false);BOSSES_ROUTE[0].at=Math.max(0,(Number(E().Game.time)||0)-.01);}
 // Chapter clear: story rewards, a "Chapter 1 cleared!" card, then the run ends (it is not a Level 1 / Arceus win).
 function finish(){run.phase='done';
   const X=E(),S=X.DB.save,first=!(Number(S.psStory?.route1)>0);
   S.psStory=S.psStory||{};S.psStory.route1=(Number(S.psStory.route1)||0)+1;
   const coins=first?STORY_REWARD.coins:Math.round(STORY_REWARD.coins/5),balls=first?STORY_REWARD.poke:1;
   S.coins=(Number(S.coins)||0)+coins;try{const b=window.PS_CATCH?.bag?.();if(b)b.poke+=balls;}catch(e){}try{X.DB.commit();}catch(e){}
   let m=document.getElementById('ps-story-clear');if(!m){m=document.createElement('div');m.id='ps-story-clear';m.style.cssText='position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;background:rgba(6,8,16,.55)';document.body.append(m);}
   m.innerHTML=`<div style="width:min(440px,calc(100vw - 32px));padding:18px;border-radius:14px;background:#101824;border:3px solid #ffd23f;color:#f7e4bc;text-align:center;font:600 14px Pixelify,Fredoka,system-ui,sans-serif">
     <div style="font-size:12px;letter-spacing:3px;color:#ffd23f">STORY MODE</div><div style="font-size:24px;font-weight:900;margin:4px 0">Chapter 1 cleared!</div>
     <div style="opacity:.85">You beat your rival Blue on Kanto Route 1.</div>
     <div style="margin:12px 0;padding:10px;border-radius:10px;background:#1b2238">+${coins} PokéCoins · +${balls} Poké Ball${balls>1?'s':''}${first?'':' (replay reward)'}</div>
     <button data-ok style="padding:8px 18px;border-radius:10px;border:2px solid #3b3f5c;background:#ffd23f;color:#2a1d00;font:800 14px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer">Continue</button></div>`;
   m.style.display='flex';
   m.querySelector('[data-ok]').onclick=()=>{m.style.display='none';hold(false);try{X.Game.quit();}catch(e){}setStory(false);
     let n=0;const sweep=setInterval(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let t;   // the results screen says the chapter was cleared
       while((t=w.nextNode()))if(/^\s*(Run over|Partida terminada|Fin de la partida)\s*$/.test(t.nodeValue||''))t.nodeValue='Chapter 1 cleared!';
       if(++n>30)clearInterval(sweep);},100);};
 }
 function view(){const cam=B()?.camera,game=document.getElementById('game');if(!cam||!game||typeof cam.left!=='function')return null;
   const rect=game.getBoundingClientRect(),k=cam.scale*(cam._cw>0?rect.width/cam._cw:1);if(!(k>0))return null;return {k,rect,left:cam.left(),top:cam.top()};}
 function frame(ts){
   requestAnimationFrame(frame);const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;hook();hookDraws();
   const b=B(),g=b?.game,p=g?.player;
   if(!p||!active()||!g||g.state==='ui'||g.state==='over'){if(run&&(!p||!active()||g?.state==='ui'))run=null;canvas.style.display='none';if(box)box.style.display='none';return;}
   if(!run||run.player!==p)newRun(p);
   const time=Number(E()?.Game?.time)||0;run.t+=dt;
   if(run.phase==='wait'&&time>=TUNE.blueAt&&g.state==='playing')startBlue(p);
   if(run.phase==='walk'&&run.t>=1.3){run.phase='talk';run.line=0;say(LINES[0]);}
   if((run.phase==='talk'||run.phase==='lose')&&run.text){run.lineT+=dt;const n=Math.min(run.text.length,Math.floor(run.lineT*38));if(n!==run.shown){run.shown=n;box.querySelector('.tx').textContent=run.text.slice(0,n);}}
   if(run.phase==='throw'&&run.t>=1.25)releaseSquirtle();
   if(run.flash>0)run.flash-=dt;
   keepInBounds();
   if(run.phase==='battle'){
     if(!run.boss){const s=(b.enemies?.all?.()||[]).find(e=>e&&e.boss&&Number(e.dex)===7&&!e.dead);if(s){run.boss=s;s.psNoCatch=true;s.x=run.landX;s.y=run.landY;run.flash=.5;try{E().Spawner.say(E().I18n?.lang==='es'?'¡Blue sacó a Squirtle!':'Blue sent out Squirtle!',2.8,true);}catch(e){}}}
     else if(run.boss.dead||run.boss.hp<=0){run.phase='lose';run.t=0;hold(true);say(LOSE_LINE);}
   }
   canvas.style.display='none';
 }
 // [Gard] nothing walks through Route 1's trees, ledges and fences or leaves the map (bosses included)
 const lastOk=new WeakMap();
 function keepInBounds(){
   const W=B()?.world,T=Number(E()?.World?.TS)||32;if(!W)return;
   const minX=X0*T,maxX=(X0+COLS*SCALE)*T,minY=Y0*T,maxY=(Y0+GRID.length*SCALE)*T;
   for(const e of B()?.enemies?.all?.()||[]){if(!e||e.dead||e.remote||!Number.isFinite(e.x))continue;
     const r=Math.min(12,Number(e.r)||10);
     if(e.x<minX+T*2.5||e.x>maxX-T*2.5||e.y<minY+T*2.5||e.y>maxY-T*2.5){e.x=Math.max(minX+T*2.5,Math.min(maxX-T*2.5,e.x));e.y=Math.max(minY+T*2.5,Math.min(maxY-T*2.5,e.y));}
     let free=true;try{free=W.isFree?W.isFree(e.x,e.y,r):!W.isWall(e.x,e.y);}catch(_){}
     if(free)lastOk.set(e,{x:e.x,y:e.y});else{const l=lastOk.get(e);if(l){e.x=l.x;e.y=l.y;}else{try{E().World.collide(e);}catch(_){}}}
   }
 }
 // ---- Blue, his Poke Ball and its flash are drawn INSIDE the game's world pass (sorted with the Pokemon), so the
 // HUD, health bars and boss bar are always drawn on top of them ----
 function worldDraws(){
   if(!run||run.phase==='wait'||run.phase==='done')return [];
   const out=[];let bx=run.bx,by=run.by;if(run.phase==='walk'){const u=Math.min(1,run.t/1.2);by=run.by-(1-u)*320;}
   out.push({x:bx,y:by,draw(g){if(!blueImg.complete||!blueImg.naturalWidth)return;const h=58,w=h*blueImg.naturalWidth/blueImg.naturalHeight,bob=run.phase==='walk'?Math.abs(Math.sin(run.t*12))*3:0;
     g.save();g.imageSmoothingEnabled=false;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(this.x,this.y,w*.35,w*.12,0,0,Math.PI*2);g.fill();g.drawImage(blueImg,this.x-w/2,this.y-h-bob,w,h);g.restore();}});
   if(run.phase==='throw'){const u=Math.min(1,run.t/.75),x=bx+(run.landX-bx)*u,gy=by+(run.landY-by)*u;
     out.push({x,y:gy,draw(g){if(!ballImg.complete)return;let y=by-30+(run.landY-(by-30))*u-Math.sin(Math.PI*u)*90;if(run.t>.75&&run.t<1)y-=Math.abs(Math.sin((run.t-.75)/.25*Math.PI))*10;
       g.save();g.imageSmoothingEnabled=false;g.translate(this.x,y);g.rotate(run.t*14*(u<1?1:0)+(run.t>.75?Math.sin(run.t*30)*.3:0));g.drawImage(ballImg,-9,-9,18,18);g.restore();
       if(run.t>1.05){const f=(run.t-1.05)/.2,r=90*f,gr=g.createRadialGradient(run.landX,run.landY,0,run.landX,run.landY,Math.max(1,r));gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');
         g.save();g.fillStyle=gr;g.beginPath();g.arc(run.landX,run.landY,Math.max(1,r),0,Math.PI*2);g.fill();g.restore();}}});}
   if(run.flash>0){const f=Math.max(0,run.flash/.5);out.push({x:run.landX,y:run.landY+1,draw(g){g.save();g.fillStyle='rgba(255,255,255,'+(.8*f)+')';g.beginPath();g.arc(this.x,this.y-20,60+80*(1-f),0,Math.PI*2);g.fill();g.restore();}});}
   return out;
 }
 let drawHooked=false;
 function hookDraws(){const T=E()?.Training;if(drawHooked||!T||typeof T.drawables!=='function')return;drawHooked=true;
   const orig=T.drawables;T.drawables=function(){const r=orig.apply(this,arguments);if(!active())return r;const extra=worldDraws();return extra.length?[...(r||[]),...extra]:r;};}
 window.PS_ROUTE1={active,start:startStory,wild:()=>WILD.flatMap(g=>g.list.map(d=>d.dex)),cleared:()=>Number(E()?.DB?.save?.psStory?.route1)||0,reward:STORY_REWARD};
 requestAnimationFrame(frame);
})();
