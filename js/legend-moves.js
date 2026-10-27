// =====================================================================
//  LEGENDARY SIGNATURE MOVES + REMADE MEGA MOVES   (loaded before mega-native.js)
//
//  PS_LEGEND_MOVES: each legendary's own move. It ONLY appears in that legendary's level-up
//  reward cards (never for other Pokemon), starts at Lv.1 and upgrades like any other move.
//  'from' = the game move it copies (decides its upgrade path and when it auto-fires);
//  psCast = visual/effect style from js/fx-moves.js; fx = style settings.
//    styles: beam rift lances void spikes shock comet vortex geyser orbs dash
//    fx.colors = [core, middle, edge]; fx.stun = {chance,dur}; fx.slow; fx.burn; fx.poison;
//    fx.mult = extra damage multiplier; style-specific: deco ('clock','feather','rainbow','notes',
//    'moon','stars'), space (rift), style ('light','bolt','star'), filter (spikes recolor), ring (geyser) ...
// =====================================================================
(function(){
 const C={
  time:['#ffffff','#8ff0ff','#2a7cff'], space:['#ffffff','#ff9ad8','#a03cff'], gold:['#ffffff','#ffe27a','#ffb000'],
  fire:['#fff6c8','#ff9a3d','#ff3d1a'], blueFire:['#ffffff','#8fd8ff','#2a5cff'], elec:['#ffffff','#fff07a','#ffc800'],
  water:['#ffffff','#8fd3ff','#2a6cff'], ice:['#ffffff','#bff4ff','#5fb8ff'], psy:['#ffffff','#ff9ef0','#c03cff'],
  dark:['#000000','#7a3cff','#d7b4ff'], ghost:['#0a0018','#8a5cff','#c8b0ff'], fairy:['#ffffff','#ffb8e8','#ff5ab4'],
  grass:['#ffffff','#b8ff9a','#3cb84a'], steel:['#ffffff','#d8e6f0','#7f98b0'], rock:['#fff3d6','#d8b070','#8a6430'],
  dragon:['#ffffff','#b48aff','#5a2cff'], poison:['#ffffff','#e0a0ff','#9a2cc8'], light:['#ffffff','#fff6c8','#ffd23f'],
  air:['#ffffff','#e8f4ff','#9cc4ff'], sand:['#fff6dc','#e8c890','#b08a50'], red:['#ffffff','#ff8a8a','#e01e3c'],
  green:['#ffffff','#9affc0','#1ec86e'], pink:['#ffffff','#ffc0e0','#ff6ab0']
 };
 const M=(from,id,name,type,psCast,desc,stats,fx)=>{const st=Object.assign({},stats||{});delete st.fx;return Object.assign({from,id,name,type,psCast,desc},st,{fx:fx||{}});};
 const beam=(id,name,type,desc,col,deco,extra)=>M('hydro-pump',id,name,type,'beam',desc,Object.assign({dmg:13,radius:480,width:30,cd:2.4},extra||{}),Object.assign({colors:col,deco,width:64,dur:1.1},extra&&extra.fx||{}));
 const lances=(id,name,type,desc,col,style,extra)=>M('meteor-mash',id,name,type,'lances',desc,Object.assign({dmg:26,count:6,radius:280,cd:2.0,knock:80},extra||{}),Object.assign({colors:col,style},extra&&extra.fx||{}));
 const rift=(id,name,type,desc,col,extra)=>M('meteor-mash',id,name,type,'rift',desc,Object.assign({dmg:34,count:3,radius:300,cd:1.8,knock:90},extra||{}),Object.assign({colors:col},extra&&extra.fx||{}));
 const comet=(id,name,type,desc,col,extra)=>M('meteor-mash',id,name,type,'comet',desc,Object.assign({dmg:70,count:1,radius:150,cd:2.4,knock:170},extra||{}),Object.assign({colors:col},extra&&extra.fx||{}));
 const shock=(id,name,type,desc,col,deco,extra)=>M('dazzling-gleam',id,name,type,'shock',desc,Object.assign({dmg:28,radius:260,cd:2.2},extra||{}),Object.assign({colors:col,deco,rings:3},extra&&extra.fx||{}));
 const vortex=(id,name,type,desc,col,extra)=>M('meteor-mash',id,name,type,'vortex',desc,Object.assign({dmg:12,count:2,radius:90,cd:4.0,knock:20},extra||{}),Object.assign({colors:col,life:3},extra&&extra.fx||{}));
 const geyser=(id,name,type,desc,col,extra)=>M('meteor-mash',id,name,type,'geyser',desc,Object.assign({dmg:34,count:5,radius:60,cd:2.2,knock:110},extra||{}),Object.assign({colors:col},extra&&extra.fx||{}));
 const orbs=(id,name,type,desc,col,extra)=>M('dark-pulse',id,name,type,'orbs',desc,Object.assign({dmg:22,count:6,cd:1.8},extra||{}),Object.assign({colors:col},extra&&extra.fx||{}));
 const voidm=(id,name,type,desc,col,extra)=>M('meteor-mash',id,name,type,'void',desc,Object.assign({dmg:40,count:1,radius:170,cd:3.0,knock:150},extra||{}),Object.assign({colors:col},extra&&extra.fx||{}));
 const spikes=(id,name,type,desc,filter,extra)=>M('dark-pulse',id,name,type,'spikes',desc,Object.assign({dmg:32,count:12,cd:2.6},extra||{}),Object.assign({filter},extra&&extra.fx||{}));
 const dash=(id,name,type,desc,col,extra)=>M('aerial-ace',id,name,type,'dash',desc,Object.assign({dmg:46,radius:300,width:60,cd:1.6,knock:120},extra||{}),Object.assign({colors:col},extra&&extra.fx||{}));

 window.PS_LEGEND_MOVES={
  144:[shock('freeze-dry','Freeze-Dry','ice','Freezing shockwaves that can freeze foes solid.',C.ice,'flakes',{fx:{stun:{chance:0.2,dur:1.2},slow:0.4}})],
  145:[beam('zap-cannon','Zap Cannon','electric','A crackling electric beam that paralyzes.',C.elec,null,{fx:{stun:{chance:0.25,dur:0.8}}})],
  146:[comet('sky-attack','Sky Attack','flying','Moltres dives from the sky as a blazing comet.',C.fire,{fx:{burn:1,shape:'fire',pal:'fire'}})],
  150:[shock('psystrike-l','Psystrike','psychic','Waves of pure psychic power ripple out from Mewtwo.',C.psy,null,{dmg:32,fx:{rings:4,pal:'psychic'}})],
  151:[orbs('psywave','Psywave','psychic','Playful pink psychic bubbles chase down foes.',C.pink,{count:7,fx:{shape:'bubble',pal:'psychic'}})],
  243:[lances('raikou-thunder','Thunder','electric','Bolts of lightning crash onto foes.',C.elec,'bolt',{fx:{stun:{chance:0.15,dur:0.6}}})],
  244:[geyser('entei-eruption','Eruption','fire','Volcanic pillars burst up under foes.',C.fire,{fx:{burn:1,shape:'fire',pal:'fire'}})],
  245:[beam('aurora-beam-l','Aurora Beam','ice','A shimmering rainbow beam that chills foes.',C.ice,'rainbow',{fx:{slow:0.4}})],
  249:[beam('aeroblast','Aeroblast','flying','A spiralling vortex of air blasts from Lugia.',C.air,'feather',{dmg:14})],
  250:[geyser('sacred-fire','Sacred Fire','fire','Rainbow-tinged holy flames erupt and burn.',['#ffffff','#ffd86a','#ff4a1a'],{count:6,fx:{burn:1,shape:'fire',pal:'fire',patch:{big:true,life:2.5}}})],
  251:[vortex('leaf-storm-l','Leaf Storm','grass','Whirling storms of leaves sweep up foes.',C.grass,{fx:{shape:'leaf',pal:'grass'}})],
  377:[spikes('stone-edge-l','Stone Edge','rock','Jagged stone pillars erupt in rings around Regirock.',null)],
  378:[beam('ice-beam-l','Ice Beam','ice','A freezing beam that can freeze foes.',C.ice,'shards',{fx:{stun:{chance:0.2,dur:1}}})],
  379:[beam('flash-cannon-l','Flash Cannon','steel','A blinding beam of steel light.',C.steel,null,{dmg:14})],
  380:[orbs('mist-ball-l','Mist Ball','psychic','Glowing mist orbs home in on foes.',C.psy,{count:6})],
  381:[beam('luster-purge-l','Luster Purge','psychic','A brilliant beam of light.',['#ffffff','#a8d0ff','#3c6cff'],null,{dmg:14})],
  382:[geyser('water-spout','Water Spout','water','Towering water spouts burst up under foes.',C.water,{count:6,fx:{shape:'drop',pal:'water'}}),
   // Origin Pulse: count = orbs, pierce = extra foes each beam chains to (the game adds both on upgrade, multiplies dmg).
   // Evolves into Origin Pulse (Primal) once Kyogre is in its Primal form (see js/mega-native.js).
   M('thunderbolt','origin-pulse-k','Origin Pulse','water','originpulse','Glowing blue orbs circle Kyogre, hunt the nearest foes and fire beams that chain between them. When they fade they burst into bubbles that damage and slow foes by 25%.',
     {dmg:11,count:2,pierce:2,radius:320,cd:4.2,maxLvl:6,evoText:'14 orbs, chain up to 20 foes, x1.5 damage, and instantly annihilates any foe below 5% HP',
      ups:[{t:'+1 orb',m:{count:1}},{t:'Chain up to 4 foes',m:{pierce:2}},{t:'+50% damage, +1 chain',m:{dmg:1.5,pierce:1}},{t:'+1 orb, +1 chain',m:{count:1,pierce:1}},{t:'+50% damage, +2 chain',m:{dmg:1.5,pierce:2}}]},
     {colors:['#ffffff','#7fd8ff','#2a8cff'],life:3.6,blast:80,slowDur:2.5})],
  383:[spikes('earth-power-l','Earth Power','ground','The ground erupts in rings of molten stone.',null,{dmg:34}),
   // Precipice Blades: radius = spike wall size, count = Giant Spikes (the game multiplies radius/dmg and adds count on upgrade).
   // Evolves into Precipice Blades (Primal) once Groudon is in its Primal form (see js/mega-native.js).
   M('dark-pulse','precipice-blades-g','Precipice Blades','ground','precipice','A full wall of volcanic rock spikes erupts around Groudon, impaling every foe it reaches. The strongest foe is impaled by a GIANT spike and stunned for 5 s. Everything hit burns for 10 s.',
     {dmg:30,count:1,radius:130,cd:3.2,maxLvl:6,evoText:'10 Giant Spikes, and the spike wall stands longer and destroys enemy projectiles',
      ups:[{t:'Bigger spike wall',m:{radius:1.3}},{t:'+50% damage, +25% range',m:{dmg:1.5,radius:1.25}},{t:'+1 Giant Spike (2nd strongest foe)',m:{count:1}},{t:'Even bigger spike wall',m:{radius:1.35}},{t:'+1 Giant Spike',m:{count:1}}]},
     {giantMult:3,stun:5,wallLife:3})],
  // Dragon Ascent: count = drill directions (chains), radius = drill range; execute / allSE are set by upgrades 4 and 5.
  // Evolves into Ad Astra once Rayquaza is Mega Rayquaza (see js/mega-native.js).
  384:[M('aerial-ace','dragon-ascent-r','Dragon Ascent','flying','ascent','Rayquaza becomes a long comet of green and gold energy and drills straight through every foe in its path. Untouchable while drilling.',
     {dmg:42,count:1,radius:260,width:70,cd:2.6,knock:90,maxLvl:6,evoText:'Ad Astra: Rayquaza leaves the screen and crashes across it three times, carving a glowing Delta symbol. Executes every non-boss foe below 50% HP',
      ups:[{t:'Drills in 2 directions',m:{count:1}},{t:'+50% damage, +50% range',m:{dmg:1.5,radius:1.5}},{t:'+1 drill direction',m:{count:1}},{t:'Executes foes below 10% HP',m:{execute:.1}},{t:'Super effective against every type',m:{allSE:1}}]},
     {})],
  385:[lances('doom-desire','Doom Desire','steel','Wishing stars rain down after a short delay.',C.gold,'star',{count:7,fx:{delay:0.6}})],
  386:[comet('psycho-boost','Psycho Boost','psychic','A violent psychic comet crashes down.',C.psy,{dmg:80,fx:{shape:'ball',pal:'psychic',big:true}})],
  480:[shock('mystical-power-uxie','Mystical Power','psychic','Golden waves of knowledge.',C.gold,'stars')],
  481:[shock('mystical-power-mesprit','Mystical Power','psychic','Pink waves of emotion.',C.pink,'stars')],
  482:[shock('mystical-power-azelf','Mystical Power','psychic','Blue waves of willpower.',C.water,'stars')],
  483:[beam('roar-of-time','Roar of Time','dragon','Dialga roars a colossal beam of time from its mouth. Where it lands, a time-distortion dome rebounds, slowing and freezing foes.',C.time,'clock',{dmg:16,cd:2.8,fx:{width:80,dur:1.3,stun:{chance:0.12,dur:0.8},rebound:{radius:185,mult:1.6,slow:0.6,stun:{chance:0.55,dur:1.3}}}})],
  484:[rift('spacial-rend','Spacial Rend','dragon','Palkia tears space apart around its foes.',C.space,{count:3,fx:{space:true,len:400,width:52}})],
  485:[vortex('magma-storm-l','Magma Storm','fire','Swirling vortexes of magma trap and burn foes.',C.fire,{fx:{burn:1,shape:'fire',pal:'fire'}})],
  486:[comet('crush-grip','Crush Grip','normal','Regigigas slams down with colossal force.',['#ffffff','#f0e6d0','#b0a080'],{dmg:85,radius:170,fx:{shape:'rock',pal:'normal',big:true}})],
  487:[voidm('shadow-force','Shadow Force','ghost','Giratina vanishes into a rift and strikes from the shadows.',C.ghost)],
  488:[shock('lunar-blessing','Lunar Blessing','psychic','Moonlight waves that also heal Cresselia.',['#ffffff','#fff3b0','#c8a0ff'],'moon',{fx:{heal:0.08}})],
  489:[shock('take-heart-phione','Take Heart','water','Calming water waves that restore HP.',C.water,'bubbles',{fx:{heal:0.06}})],
  490:[orbs('heart-swap','Heart Swap','water','Pink heart orbs seek out foes.',C.pink,{count:7,fx:{shape:'heart',pal:'fairy'}})],
  491:[voidm('dark-void','Dark Void','dark','A void of darkness that drags foes in and puts them to sleep.',C.dark,{fx:{stun:{chance:0.7,dur:1.8}}})],
  492:[shock('seed-flare','Seed Flare','grass','A massive burst of seeds and light.',C.grass,'leaves',{dmg:32,fx:{rings:2,slow:0.3}})],
  493:[lances('judgment','Judgment','normal','Countless lances of divine light rain down.',C.gold,'light',{dmg:28,count:9,fx:{gap:0.05}})],
  494:[dash('v-create','V-create','fire','Victini blazes forward and erupts in a V of fire.',C.fire,{dmg:50,fx:{vshape:true,burn:1,burst:110}})],
  638:[rift('sacred-sword-cobalion','Sacred Sword','fighting','Holy steel-blue sword slashes.',['#ffffff','#b8e0ff','#3c8cff'])],
  639:[rift('sacred-sword-terrakion','Sacred Sword','fighting','Earth-shaking sword slashes.',C.rock)],
  640:[rift('sacred-sword-virizion','Sacred Sword','fighting','Swift verdant sword slashes.',C.grass)],
  641:[vortex('bleakwind-storm','Bleakwind Storm','flying','Freezing winds whip foes around.',C.air,{fx:{slow:0.3,shape:'flake',pal:'ice'}})],
  642:[vortex('wildbolt-storm','Wildbolt Storm','electric','Thunderstorms that paralyze foes.',C.elec,{fx:{bolts:true,shape:'bolt',pal:'electric',stun:{chance:0.1,dur:0.6}}})],
  645:[vortex('sandsear-storm','Sandsear Storm','ground','Scorching sandstorms that burn.',C.sand,{fx:{burn:1,shape:'rock',pal:'ground'}})],
  643:[geyser('blue-flare','Blue Flare','fire','Pillars of blue flame that burn.',C.blueFire,{count:5,fx:{burn:1,shape:'fire',pal:'water',patch:{big:true,life:2.2}}})],
  644:[lances('bolt-strike','Bolt Strike','electric','Massive black-blue lightning strikes.',['#ffffff','#9ad8ff','#2a3cff'],'bolt',{dmg:30,fx:{stun:{chance:0.2,dur:0.8}}})],
  646:[spikes('glaciate','Glaciate','ice','Rings of glacial spikes freeze foes in place.','hue-rotate(185deg) saturate(1.6) brightness(1.3)',{fx:{slow:0.5}})],
  647:[rift('secret-sword','Secret Sword','fighting','A shining aqua blade cuts through foes.',['#ffffff','#8ff0ff','#2a9cff'],{count:2,fx:{len:420}})],
  648:[shock('relic-song','Relic Song','normal','An ancient melody that can lull foes to sleep.',C.green,'notes',{fx:{stun:{chance:0.2,dur:1.2}}})],
  649:[beam('techno-blast','Techno Blast','normal','A beam fired from Genesect\'s cannon.',['#ffffff','#ffd0a0','#ff6a2a'],null,{dmg:14})],
  716:[shock('geomancy','Geomancy','fairy','Rainbow waves of life energy.',C.fairy,'rainbow',{dmg:30})],
  717:[beam('oblivion-wing','Oblivion Wing','flying','A crimson beam that drains life.',C.red,'feather',{dmg:14})],
  718:[spikes('lands-wrath','Land\'s Wrath','ground','The land itself erupts in green-veined spikes.','hue-rotate(95deg) saturate(1.4)')],
  719:[spikes('diamond-storm-l','Diamond Storm','rock','Glittering crystal spikes burst out.','hue-rotate(290deg) saturate(1.5) brightness(1.35)')],
  // 720 Hoopa: uses its own Hyperspace Hole summon move from js/hoopa.js
  721:[geyser('steam-eruption','Steam Eruption','water','Scalding steam geysers that burn.',['#ffffff','#f0f0f0','#a0c8ff'],{fx:{burn:1,shape:'bubble',pal:'water'}})],
  772:[rift('crush-claw','Crush Claw','normal','Heavy claw slashes.',C.steel,{count:2})],
  773:[beam('multi-attack','Multi-Attack','normal','A prismatic beam of every type.',C.light,'rainbow',{dmg:14})],
  785:[lances('natures-madness-koko','Nature\'s Madness','fairy','Guardian lightning strikes.',C.elec,'bolt')],
  786:[shock('natures-madness-lele','Nature\'s Madness','fairy','Psychic waves of the island guardian.',C.pink,'stars')],
  787:[spikes('natures-madness-bulu','Nature\'s Madness','fairy','Thorny vines erupt from the ground.','hue-rotate(80deg) saturate(1.3)')],
  788:[geyser('natures-madness-fini','Nature\'s Madness','fairy','Misty water pillars.',C.water,{fx:{shape:'drop',pal:'fairy'}})],
  789:[orbs('cosmic-sparkle','Cosmic Sparkle','psychic','Tiny stars drift toward foes.',['#ffffff','#a8c8ff','#5a3cff'],{dmg:16,fx:{shape:'star',pal:'violet'}})],
  790:[shock('cosmic-power','Cosmic Power','psychic','Pulses of cosmic energy.',['#ffffff','#a8c8ff','#5a3cff'],'stars',{dmg:22})],
  791:[comet('sunsteel-strike','Sunsteel Strike','steel','Solgaleo crashes down like a falling sun.',C.gold,{dmg:85,fx:{shape:'fire',pal:'fire',big:true,scale:11}})],
  792:[beam('moongeist-beam','Moongeist Beam','ghost','A ghostly beam of moonlight.',['#ffffff','#c8a0ff','#5a2cc8'],'moon',{dmg:15})],
  800:[beam('photon-geyser','Photon Geyser','psychic','Necrozma fires a crimson-and-black beam of light from its mouth.',['#ffffff','#ff4a4a','#a8001c'],'shards',{dmg:17,cd:2.6,fx:{width:76,dur:1.2,dark:true,pal:'dark'}})],
  801:[beam('fleur-cannon-l','Fleur Cannon','fairy','A tremendous beam of flowering energy.',C.fairy,null,{dmg:15})],
  802:[rift('spectral-thief','Spectral Thief','ghost','Shadowy strikes from Marshadow\'s shadow.',C.ghost,{count:4,fx:{space:true}})],
  807:[dash('plasma-fists-l','Plasma Fists','electric','Zeraora streaks through foes in a flash of plasma.',C.elec,{fx:{stun:{chance:0.15,dur:0.6}}})],
  808:[beam('flash-cannon-meltan','Flash Cannon','steel','A small but sharp beam of light.',C.steel,null,{dmg:10})],
  809:[comet('double-iron-bash','Double Iron Bash','steel','Melmetal slams down twice.',C.steel,{dmg:60,count:2,fx:{shape:'rock',pal:'steel'}})],
  888:[M('meteor-mash','behemoth-blade','Behemoth Blade','steel','behemoth',
   'A cyan sword cleaves a line of foes. At move level 6, evolve while Crowned into Behemoth Blade: Royal Tempest — six crossing slashes and a delayed starburst.',
   {dmg:38,count:1,radius:270,width:48,cd:2.6,knock:65,maxLvl:6,
    evoText:'Crowned Zacian: six slashes share a controlled damage budget, followed by a localized starburst. No screen-wide damage.',
    ups:[{t:'+20% damage',m:{dmg:1.2}},{t:'+20% reach',m:{radius:1.2}},{t:'+20% damage',m:{dmg:1.2}},{t:'15% faster cooldown',m:{cd:.85}},{t:'+20% damage',m:{dmg:1.2}}]},
   {colors:['#ffffff','#8feeff','#328bff']})],
  889:[dash('behemoth-bash','Behemoth Bash','steel','Zamazenta charges shield-first.',C.red,{dmg:52})],
  890:[beam('eternabeam','Eternabeam','dragon','The most powerful beam of all.',['#ffffff','#ff6ab4','#c0003c'],null,{dmg:18,cd:3.2,fx:{width:90,dur:1.4}})],
  891:[rift('surging-strikes-kubfu','Surging Strikes','fighting','Three flowing water strikes.',C.water,{dmg:26})],
  892:[rift('wicked-blow','Wicked Blow','dark','Devastating dark strikes.',C.dark,{dmg:38,count:3})],
  894:[lances('thunder-cage','Thunder Cage','electric','Electric cages lock foes in place.',C.elec,'bolt',{count:8,fx:{stun:{chance:0.3,dur:0.8}}})],
  895:[beam('dragon-energy','Dragon Energy','dragon','A gigantic draconic beam.',C.green,null,{dmg:15,fx:{width:80}})],
  896:[spikes('glacial-lance','Glacial Lance','ice','Rings of giant ice lances.','hue-rotate(185deg) saturate(1.5) brightness(1.3)',{dmg:36})],
  897:[orbs('astral-barrage','Astral Barrage','ghost','A barrage of ghostly orbs.',C.ghost,{count:8,fx:{shape:'shadow',pal:'ghost'}})],
  898:[orbs('pollen-puff-l','Pollen Puff','grass','Exploding puffs of pollen.',C.grass,{count:6,fx:{splash:55,shape:'ball',pal:'grass'}})],
  905:[vortex('springtide-storm','Springtide Storm','fairy','Storms of love and hate.',C.pink,{fx:{shape:'heart',pal:'fairy'}})],
  // ---- Ultra Beasts
  793:[geyser('acid-downpour','Acid Downpour','poison','Nihilego bursts toxic pillars that leave a poison bog behind.',C.poison,{dmg:30,count:5,fx:{poison:1,shape:'bubble',pal:'poison',patch:{bog:true,life:3,mult:0.25}}})],
  794:[comet('muscle-meteor','Muscle Meteor','fighting','Buzzwole leaps into the sky and crashes down fist-first.',C.red,{dmg:78,radius:160,fx:{shape:'impact',pal:'fighting',big:true,stun:{chance:0.3,dur:0.8}}})],
  795:[M('aerial-ace','high-jump-kick-ub','High Jump Kick','fighting','hjk','Pheromosa leaps high into the air and drives a kick into the ground: a shockwave, then an aftershock that slows foes.',{dmg:50,radius:290,width:60,cd:1.4,knock:200},{colors:['#ffffff','#fff1c8','#ff9ad8'],burst:135,burstMult:1.7,stun:{chance:0.35,dur:0.8}})],
  796:[lances('electro-overload','Electro Overload','electric','Xurkitree overloads, raining bolts on every nearby foe.',C.elec,'bolt',{dmg:24,count:10,radius:320,fx:{gap:0.05,stun:{chance:0.2,dur:0.7}}})],
  797:[comet('meteor-launch','Meteor Launch','steel','Celesteela fires a volley of steel rockets that fall from the sky.',['#ffffff','#ffd0a0','#ff6a2a'],{dmg:52,count:3,radius:130,fx:{rocket:true,burn:1,debris:'rock',pal:'steel'}})],
  798:[rift('origami-slash','Origami Slash','grass','Kartana slices space with paper-thin blades.',['#ffffff','#f4fff0','#7fd27a'],{dmg:34,count:4,fx:{delay:0.06,len:380,width:40,paper:true}})],
  799:[voidm('gigantic-gulp','Gigantic Gulp','dark','Guzzlord opens a maw that swallows foes, then bites down.',['#000000','#c03c6a','#ffb0d0'],{dmg:44,radius:190,fx:{shape:'jaws',pal:'dark',blast:2.8,maw:true}})],
  803:[orbs('venom-darts','Venom Darts','poison','Poipole spits homing poison needles.',C.poison,{dmg:18,count:6,fx:{shape:'needle',pal:'poison',poison:1,spriteScale:1.3}})],
  804:[beam('dragon-venom','Dragon Venom','poison','Naganadel fires a toxic dragon beam from its stinger mouth.',['#ffffff','#e0a0ff','#7a1ca8'],'shards',{dmg:15,fx:{width:68,poison:1,pal:'poison'}})],
  805:[spikes('stone-rampart','Stone Rampart','rock','Stakataka raises walls of stone blocks around itself.','saturate(0.35) brightness(1.2)',{dmg:34,count:20,fx:{bricks:true,stun:{chance:0.15,dur:0.8}}})],
  806:[shock('mind-blown','Mind Blown','fire','Blacephalon\'s head explodes in rings of ghostly fireworks.',['#ffffff','#ffb04a','#a03cff'],'stars',{dmg:34,radius:280,fx:{rings:3,burn:1,pal:'fire',fireworks:true}})],
  1004:[shock('ruination','Ruination','dark','A ruinous wave of dark fire.',['#ffffff','#ff8a4a','#6a1a3c'],null,{dmg:30,fx:{burn:1}})],
  1007:[dash('collision-course','Collision Course','fighting','Koraidon crashes through foes at full speed.',C.red,{dmg:54,fx:{burst:120}})],
  1015:[shock('sludge-wave-l','Sludge Wave','poison','Waves of toxic sludge.',C.poison,'bubbles',{fx:{poison:1}})],
  1016:[orbs('alluring-voice','Alluring Voice','fairy','Enchanting notes that home in.',C.pink,{count:6,fx:{shape:'note',pal:'fairy'}})],
  1017:[comet('ivy-cudgel','Ivy Cudgel','grass','Ogerpon swings down its mighty club.',C.grass,{dmg:75,fx:{shape:'rock',pal:'grass'}})],
  1024:[lances('tera-starstorm','Tera Starstorm','normal','Rainbow starlight rains down.',['#ffffff','#ffd0ff','#a0c8ff'],'star',{dmg:28,count:8})]
 };

 // Remade Mega signature moves: visual style + numbers merged into the Mega's kit move.
 window.PS_MEGA_FX={
  '6-mega-y':{psCast:'geyser',dmg:30,count:8,radius:55,cd:1.8,fx:{ring:110,colors:C.fire,burn:1,shape:'fire',pal:'fire',patch:{big:true,life:2}}},
  '9-mega':{psCast:'beam',dmg:14,radius:480,cd:2.0,fx:{colors:C.water,width:70,deco:'bubbles'}},
  '150-mega-y':{psCast:'shock',dmg:30,radius:280,cd:1.6,fx:{colors:C.psy,rings:4}},
  '181-mega':{psCast:'beam',dmg:13,radius:460,cd:1.8,fx:{colors:C.elec,width:60}},
  '248-mega':{psCast:'spikes',dmg:34,count:14,cd:2.2,fx:{}},
  '323-mega':{psCast:'geyser',dmg:34,count:5,radius:60,cd:2.0,fx:{colors:C.fire,burn:1,shape:'fire',pal:'fire',patch:{big:true,life:2.2}}},
  '373-mega':{psCast:'comet',dmg:70,count:1,radius:150,cd:2.0,fx:{colors:C.dragon,shape:'fire',pal:'dragon',big:true}},
  '376-mega':{psCast:'comet',dmg:60,count:2,radius:130,cd:2.0,fx:{colors:C.steel,shape:'star',pal:'steel'}},
  '380-mega':{psCast:'orbs',dmg:24,count:6,cd:1.4,fx:{colors:C.psy,shape:'ball',pal:'psychic'}},
  '381-mega':{psCast:'beam',dmg:15,radius:480,cd:1.8,fx:{colors:['#ffffff','#a8d0ff','#3c6cff']}},
  '384-mega':{psCast:'ascent',dmg:60,count:3,radius:320,width:76,cd:1.6,execute:.1,fx:{}},   // Mega Rayquaza's own Dragon Ascent: the new comet drill
  '485-mega':{psCast:'vortex',dmg:14,count:2,radius:90,cd:3.5,fx:{colors:C.fire,burn:1,shape:'fire',pal:'fire'}},
  '491-mega':{psCast:'void',dmg:40,radius:170,cd:2.6,fx:{colors:C.dark,stun:{chance:0.7,dur:1.8}}},
  '670-mega':{psCast:'beam',dmg:15,radius:480,cd:2.2,fx:{colors:C.fairy,width:70}},
  '718-mega':{psCast:'spikes',dmg:30,count:14,cd:2.2,fx:{filter:'hue-rotate(95deg) saturate(1.4)'}},
  '719-mega':{psCast:'spikes',dmg:30,count:14,cd:2.2,fx:{filter:'hue-rotate(290deg) saturate(1.5) brightness(1.35)'}},
  '801-mega':{psCast:'beam',dmg:16,radius:480,cd:2.2,fx:{colors:C.fairy,width:72}}
 };
})();
