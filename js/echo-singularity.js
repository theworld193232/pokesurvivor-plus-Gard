/* Echo's Singularity V2 — exact-length GIF cut-in, then camera pullback to a
 * starfield-tinted LIVE battlefield and a full-screen black-hole shockwave.
 * Owner-only Mega Gardevoir. No extra network packets during playback.
 * Keep this as a standalone add-on; the native Mega/revive scripts are untouched.
 */
(() => {
  'use strict';
  if (window.PS_ECHO_SINGULARITY) return;
  const OWNER = 'lovergare', FORM = '282-mega', LOW = 0.20;
  // Source is 16 GIF frames totaling 2130 ms. DO NOT keep showing GIF after this.
  const GIF_MS = 2130, PULLBACK_MS = 550, REALM_MS = 1550;
  const IMPACT_MS = GIF_MS + PULLBACK_MS;
  const TOTAL_MS = IMPACT_MS + REALM_MS;
  const PROTECTION_AFTER = 5;
  const bridge = () => window.PS_MEGA_BRIDGE_V5;
  const engine = () => window.PS_HOOPA_ENGINE;
  const who = () => String(bridge()?.user || '').trim().toLowerCase();
  const me = () => bridge()?.game?.player;
  const coop = () => !!engine()?.Coop?.active;
  const host = () => { const x = engine()?.Coop?.isHost; return typeof x === 'function' ? !!x() : !!x; };
  const hpRatio = p => Number(p?.maxHp) > 0 ? Number(p.hp) / Number(p.maxHp) : 1;
  const playing = () => ['playing', 'levelup', 'choice'].includes(String(bridge()?.game?.state));
  const ownerForm = p => who() === OWNER && p && !p.dead && Number(p.dex) === 282 && p.megaForm === FORM;
  const ready = p => ownerForm(p) && playing() && !p.__echoSingularityUsed && !window.PS_ECHO_CUTSCENE?.playing;
  const lowAlly = p => coop() && (engine()?.Coop?.mates || []).some(m => m && m.connected && m.pl && m.pl !== p && !m.pl.dead && hpRatio(m.pl) > 0 && hpRatio(m.pl) <= LOW);
  const lowSelf = p => hpRatio(p) > 0 && hpRatio(p) <= LOW && Number(p.lives) <= 0 && p.__echoBondUsed === true;

  let scene = null, playerRef = null, used = false, netHooked = false, debugButton = null;
  let previous = performance.now(), sheetInstalled = false;
  const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function style() {
    if (sheetInstalled) return; sheetInstalled = true;
    const el = document.createElement('style');
    el.textContent = `
      #ps-echo-singularity {position:fixed;inset:0;z-index:2147483500;pointer-events:none;overflow:hidden;background:#03000b;}
      #ps-echo-singularity .ps-echo-cutin {position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#020007;}
      #ps-echo-singularity .ps-echo-cutin img {height:min(96vmin,790px);width:min(96vmin,790px);object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 0 25px #7d31b0);}
      #ps-echo-singularity .ps-echo-realm {position:absolute;inset:0;width:100%;height:100%;display:none;image-rendering:pixelated;}
      #ps-echo-singularity .ps-echo-name {position:absolute;top:4%;width:100%;text-align:center;color:#ebd8ff;font:900 clamp(16px,2.8vw,32px) Pixelify,system-ui,sans-serif;letter-spacing:2px;text-shadow:0 0 14px #9f46eb;}
      #ps-echo-singularity .ps-echo-flash {position:absolute;inset:0;background:#fef2ff;opacity:0;}
      #ps-echo-singularity .ps-echo-flash.blast {animation:ps-echo-realm-flash .85s ease-out both;}
      @keyframes ps-echo-realm-flash {0%{opacity:1}30%{opacity:.60}100%{opacity:0}}
      #ps-echo-singularity-test {position:fixed;right:14px;bottom:68px;z-index:2147483499;color:white;background:#34124f;border:2px solid #dd78fc;border-radius:8px;padding:9px;font:700 12px system-ui;cursor:pointer;}
    `;
    document.head.appendChild(el);
  }
  function getGameCanvas() {
    let found=null, best=0;
    for (const cv of document.querySelectorAll('canvas')) {
      if ((cv.id || '').startsWith('ps-') || !cv.width || !cv.height) continue;
      const r = cv.getBoundingClientRect(); const a = r.width*r.height;
      if (a>best && r.width>200 && r.height>150) { best=a; found={cv,r}; }
    }
    return found;
  }
  function drawRealm(r, t) {
    // The map is redrawn at ~30 fps to reduce co-op/GPU pressure.
    if(r.lastPaint!=null && t-r.lastPaint < 33) return; r.lastPaint=t;
    const canvas=r.map, ctx=canvas.getContext('2d'); if (!ctx) return;
    const dpr=Math.min(1.5,window.devicePixelRatio||1),W=window.innerWidth,H=window.innerHeight;
    if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)) {canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    // A cool nebula under the live map makes the whole visible battlefield a space realm.
    const bg=ctx.createRadialGradient(W*.5,H*.48,10,W*.5,H*.5,Math.max(W,H)*.85);
    bg.addColorStop(0,'#3d115c');bg.addColorStop(.40,'#131039');bg.addColorStop(1,'#03020c');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const c=getGameCanvas();
    if(c) {
      const pull = ease((t-GIF_MS)/PULLBACK_MS), zoom=1.55-(.55*pull);
      ctx.save();ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
      ctx.globalAlpha=.8;ctx.imageSmoothingEnabled=false;
      try {ctx.filter='hue-rotate(165deg) saturate(.75) brightness(.6)';
        ctx.drawImage(c.cv,c.r.left,c.r.top,c.r.width,c.r.height);
      } catch(e) { /* e.g. temporarily unavailable WebGL canvas */ }
      ctx.restore();
    }
    // Seeded stable stars, slight drift. No sprite flicker, no additional textures.
    for(let i=0;i<100;i++) {
      const sx=((i*127.7+i*i*19.03)%1000)/1000*W;
      const sy=((i*79.33+i*i*3.29)%1000)/1000*H;
      const twinkle=.35+.4*Math.sin(i*2.39+t/260+i);
      ctx.fillStyle=`rgba(205,208,255,${Math.max(.13,twinkle)})`;
      ctx.fillRect(Math.round(sx),Math.round((sy+t*.014)%H),i%11===0?3:2,i%7===0?3:2);
    }
    const violet=ctx.createRadialGradient(W*.5,H*.5,30,W*.5,H*.5,Math.max(W,H)*.68);
    violet.addColorStop(0,'rgba(75,10,130,.0)');violet.addColorStop(.5,'rgba(92,12,150,.13)');violet.addColorStop(1,'rgba(0,0,10,.72)');
    ctx.fillStyle=violet;ctx.fillRect(0,0,W,H);
    if(t>=IMPACT_MS) {
      const f=ease((t-IMPACT_MS)/REALM_MS),R=Math.hypot(W,H)*1.15*f;
      // Black-hole implosion -> bright expanding ring that overtakes the whole map.
      const core=Math.max(1,60*(1-f));
      const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(R,core));
      g.addColorStop(0,`rgba(255,244,255,${1-f})`);
      g.addColorStop(.10,`rgba(218,117,255,${.9*(1-f)})`);
      g.addColorStop(.55,`rgba(72,12,162,${.45*(1-f)})`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      ctx.beginPath();ctx.ellipse(W/2,H/2,Math.max(2,R),Math.max(2,R*.78),0,0,Math.PI*2);
      ctx.lineWidth=Math.max(3,15*(1-f));ctx.strokeStyle=`rgba(252,203,255,${1-f})`;
      ctx.shadowColor='#bb64ff';ctx.shadowBlur=35;ctx.stroke();ctx.shadowBlur=0;
      if(f>.6){ctx.fillStyle=`rgba(245,200,255,${.25*ease((f-.6)/.4)})`;ctx.fillRect(0,0,W,H);}
    }
  }
  function stop() {
    if(!scene)return; const r=scene; scene=null;
    try {r.ui.remove();}catch(_){ }
    // First full movement frame after the cutscene is free again.
    if(r.owner && r.p && !r.p.dead) {
      r.p.invuln=Math.max(Number(r.p.invuln)||0,PROTECTION_AFTER);
      r.p.reviveShield=Math.max(Number(r.p.reviveShield)||0,PROTECTION_AFTER);
      r.p.hp=Math.max(Number(r.p.hp)||1,(Number(r.p.maxHp)||1)*.30);
      r.p._vx=0;r.p._vy=0;
    } else if(r.p&&!r.p.dead){r.p.invuln=Math.max(Number(r.p.invuln)||0,1);}
  }
  function killField() {
    if(coop()&&!host())return 0;
    const N=engine(),p=me();if(!N?.EnemyMgr?.all)return 0;
    let killed=0;
    for(const e of [...N.EnemyMgr.all()]){
      if(!e||e.dead||e.remote||typeof e.hurt!=='function')continue;
      const hp=Math.max(1,Number(e.hp)||1),sh=Math.max(0,Number(e.shield)||0);
      try {e.hurt(Math.max(1e8,(hp+sh)*100),'#ffb6ff',(e.x||0)-(p?.x||0),(e.y||0)-(p?.y||0),600);if(e.dead)killed++;}
      catch(err){console.warn('[EchoSingularity] damage',err);}
    }
    try {bridge()?.fx?.dmgText?.(p.x,p.y-100,'SINGULARITY · '+killed+' KO','#efc5ff');}catch(_){ }
    return killed;
  }
  function start(nonce, caster, owner) {
    if(scene||!playing()||!nonce||typeof nonce!=='string'||nonce.length>64)return false;
    const p=me();if(owner&&!ownerForm(p))return false;
    style();
    const ui=document.createElement('div');ui.id='ps-echo-singularity';
    const cut=document.createElement('div');cut.className='ps-echo-cutin';
    const pic=document.createElement('img');pic.alt='Shiny Mega Gardevoir opens the Singularity';pic.src='assets/fx/echo-singularity.gif?v=2&play='+encodeURIComponent(nonce);
    const cap=document.createElement('div');cap.className='ps-echo-name';cap.textContent="ECHO'S SINGULARITY";
    const map=document.createElement('canvas');map.className='ps-echo-realm';map.id='ps-echo-realm-map';
    const flash=document.createElement('div');flash.className='ps-echo-flash';
    cut.appendChild(pic);ui.append(cut,map,cap,flash);document.body.append(ui);
    scene={nonce,p,owner,caster,ui,cut,map,flash,start:performance.now(),x:p?.x||0,y:p?.y||0,realm:false,impact:false};
    // Immediate protection before the first animation frame.
    if(p&&!p.dead){p.invuln=Math.max(Number(p.invuln)||0,2);p.reviveShield=Math.max(Number(p.reviveShield)||0,2);}
    return true;
  }
  function announce(nonce,reason){const N=engine();if(!coop()){start(nonce,reason,true);return;}
    start(nonce,reason,true);
    if(host())N?.Net?.broadcast?.({k:'psEchoSingularity',nonce,who:String(N.Coop.me||''),form:FORM});
    else N?.Net?.toHost?.({k:'psEchoSingularityReq',nonce,form:FORM});
  }
  function trigger(p,reason){if(!ready(p)||used||scene)return false;
    used=true;p.__echoSingularityUsed=true;
    const nonce=String(Date.now())+'-'+Math.floor(Math.random()*1e8).toString(16);
    announce(nonce,reason);return true;
  }
  function hookNet(){const N=engine();if(netHooked||!N?.Net?.on||!N?.Coop)return;netHooked=true;
    N.Net.on((uid,msg)=>{
      if(!coop()||!msg||typeof msg.nonce!=='string'||!/^[0-9]{10,14}-[a-f0-9]{1,8}$/.test(msg.nonce))return;
      if(msg.k==='psEchoSingularityReq'&&host()){
        const m=N.Coop.mate?.(uid),other=m?.pl;
        if(!m?.connected||Number(other?.dex)!==282||other?.megaForm!==FORM||m.__echoSingularityNetUsed)return;
        const declared=String(m.user||m.name||m.username||m.displayName||'').trim().toLowerCase();
        if(declared!==OWNER)return; // never accept an unidentified remote account
        m.__echoSingularityNetUsed=true;
        if(start(msg.nonce,'teammate',false))N.Net.broadcast({k:'psEchoSingularity',nonce:msg.nonce,who:String(uid),form:FORM});
      }else if(msg.k==='psEchoSingularity'&&!host()){
        if(String(uid)!==String(N.Net.hostUid)||scene?.nonce===msg.nonce)return;
        start(msg.nonce,'remote',false);
      }
    });
  }
  function loop(now){requestAnimationFrame(loop);previous=now;
    const p=me();if(p!==playerRef){stop();playerRef=p;used=!!p?.__echoSingularityUsed;}
    hookNet();
    if(debugButton)debugButton.style.display=ownerForm(p)&&playing()?'':'none';
    if(scene){const r=scene,t=now-r.start;
      if(bridge()?.game?.state==='ui'){stop();return;}
      if(r.p&&!r.p.dead){r.p.invuln=Math.max(Number(r.p.invuln)||0,.5);r.p.reviveShield=Math.max(Number(r.p.reviveShield)||0,.5);
        if(r.owner){r.p.x=r.x;r.p.y=r.y;r.p._vx=0;r.p._vy=0;}
      }
      // Exactly one 2.13s GIF playback. The remaining time belongs to the map explosion.
      if(t>=GIF_MS&&!r.realm){r.realm=true;r.cut.style.display='none';r.map.style.display='block';}
      if(r.realm)drawRealm(r,t);
      if(t>=IMPACT_MS&&!r.impact){r.impact=true;r.flash.classList.add('blast');killField();}
      if(t>=TOTAL_MS)stop();
      return;
    }
    if(ready(p)&&!used){if(lowAlly(p))trigger(p,'ally-critical');else if(lowSelf(p))trigger(p,'final-revive');}
  }
  function install(){style();
    if(new URLSearchParams(location.search).has('singularityTest')){
      debugButton=document.createElement('button');debugButton.id='ps-echo-singularity-test';debugButton.textContent='TEST · Singularity';
      debugButton.onclick=()=>{const p=me();if(ready(p)&&!used)trigger(p,'test');};document.body.append(debugButton);
    }
    requestAnimationFrame(loop);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.PS_ECHO_SINGULARITY=Object.freeze({version:2,trigger,get playing(){return !!scene;},get used(){return used;},get owner(){return who()===OWNER;},
    config:Object.freeze({hpThreshold:LOW,gifDurationMs:GIF_MS,pullbackMs:PULLBACK_MS,realmMs:REALM_MS,totalMs:TOTAL_MS})});
})();
