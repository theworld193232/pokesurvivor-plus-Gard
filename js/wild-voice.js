/* WILD VOICE — every Pokemon talks in its own voice, generated on the fly (used by js/wild-life.js).
   Each wild Pokemon gets a Nature (the 25 from the games), and the Nature picks its VOICE:
     Brave / Adamant → brave        Hasty / Rash → hothead         Timid / Careful → timid
     Lonely / Bashful → shy         Jolly / Naive → cheerful       Relaxed / Lax / Quiet → lazy
     Bold / Sassy → sassy           Modest / Calm → polite         Naughty / Impish → prankster
     Hardy / Serious → stoic        Docile / Gentle / Mild → gentle    Quirky → quirky
   A line is built from: what is happening (the situation) + who is talking (voice, type, species cry, gender) +
   who they're talking to (same species, a possible sweetheart, a type they beat or fear, the same type, the
   explorer you play as and your companions) + what happened this run (Giratina's Void, the Creation Rift,
   the Creation Rift...). The voice then shapes the sentence: openers ("U-um...", "Oi!", "*yawn*..."), stutters, shouting,
   trailing off, sign-offs, the occasional cry ("Ratta!"). Same Pokemon, same voice for its whole life.
   PS_VOICE.line(pokemon, situation, context) → [face, text, emote]; PS_VOICE.chat(a, b) → a whole conversation. */
(() => {
  'use strict';
  if (window.PS_VOICE) return;
  const E = () => window.PS_HOOPA_ENGINE;
  const pick = L => L[Math.floor(Math.random() * L.length)];
  const chance = p => Math.random() < p;

  // ================= natures → voices =================
  const NATURES = { Hardy: 'stoic', Serious: 'stoic', Lonely: 'shy', Bashful: 'shy', Brave: 'brave', Adamant: 'brave', Naughty: 'prankster', Impish: 'prankster', Bold: 'sassy', Sassy: 'sassy',
    Docile: 'gentle', Gentle: 'gentle', Mild: 'gentle', Relaxed: 'lazy', Lax: 'lazy', Quiet: 'lazy', Timid: 'timid', Careful: 'timid', Hasty: 'hothead', Rash: 'hothead', Jolly: 'cheerful', Naive: 'cheerful',
    Modest: 'polite', Calm: 'polite', Quirky: 'quirky' };
  const VOICE = {
    brave:     { face: 'determined', em: 'exclaim', open: ['Hah!', 'Listen up!', 'Alright!', ''], close: ['!', '! Bring it on!', '!'], cry: 0.2 },
    hothead:   { face: 'angry', em: 'anger', open: ['HEY!', 'Argh!', 'Grr—', 'Oi!'], close: ['!!', '!! Got it?!', '!'], caps: true },
    timid:     { face: 'worried', em: 'sweat', open: ['Eep!', 'Oh no...', 'Um, um...', 'W-wait...'], close: ['...', '... r-right?', '...'], stutter: 0.55 },
    shy:       { face: 'worried', em: 'dots', open: ['U-um...', 'Er...', 'S-sorry, but...', ''], close: ['...', '...', '... sorry.'], stutter: 0.4 },
    cheerful:  { face: 'happy', em: 'note', open: ['Hey hey!', 'Ooh!', 'Yay!', 'Hiya!'], close: ['~!', '!', '! Hehe~'], cry: 0.35 },
    lazy:      { face: 'sigh', em: 'dots', open: ['*yawn*...', 'Mmh...', 'Eh...', ''], close: ['...', '... zzz...', '... whatever.'], slow: true },
    sassy:     { face: 'normal', em: 'dots', open: ['Hmph.', 'Ugh.', 'Oh please.', 'Well, well.'], close: ['.', ', obviously.', ', darling.', '. Try to keep up.'] },
    polite:    { face: 'normal', em: 'note', open: ['Pardon me,', 'Ah,', 'Greetings.', 'If I may,'], close: ['.', ', I believe.', '. Good day.'] },
    prankster: { face: 'joyous', em: 'note', open: ['Heh heh~', 'Psst!', 'Nyeh!', 'Ooh, ooh!'], close: ['! Hehehe!', '~', '! Gotcha!'], cry: 0.2 },
    stoic:     { face: 'normal', em: 'dots', open: ['...', 'Hm.', ''], close: ['.', '.', '. That is all.'] },
    gentle:    { face: 'happy', em: 'heart', open: ['Oh my,', 'Hello there,', 'Ah,'], close: ['.', ' ♪', '. Take care.'], cry: 0.15 },
    quirky:    { face: 'surprised', em: 'question', open: ['Did you know—', 'Bloop!', 'Hmm hmm!', 'Fun fact:'], close: ['! Bloop.', '?!', '... or was it?'], cry: 0.25 } };
  const GRAVE = new Set(['hurt', 'die', 'witness', 'witnessSame', 'witnessMate', 'beg', 'allyFaint', 'lowHp', 'avenge']);
  const BOLD = new Set(['brave', 'hothead', 'sassy', 'prankster']), SOFT = new Set(['timid', 'shy', 'gentle', 'lazy']);

  // ================= types: where they live, what they love, fear and brag about =================
  const TYPE = {
    normal: { home: 'the tall grass', like: 'a long nap in the sun', fear: 'Fighting-types', snack: 'a Leppa Berry', boast: 'my good looks' },
    fire: { home: 'the volcano', like: 'sunbathing on hot rocks', fear: 'the rain', snack: 'a spicy Tamato Berry', boast: 'my flames' },
    water: { home: 'the river', like: 'a long swim', fear: 'droughts', snack: 'an Oran Berry', boast: 'my tidal wave' },
    grass: { home: 'the sunny meadow', like: 'soaking up sunlight', fear: 'Bug-types nibbling on me', snack: 'fresh morning dew', boast: 'my leaves' },
    electric: { home: 'the old power plant', like: 'thunderstorms', fear: 'Ground-types', snack: 'a fizzy Wacan Berry', boast: 'my voltage' },
    ice: { home: 'the frozen cave', like: 'fresh snowfall', fear: 'summer', snack: 'shaved ice', boast: 'my frost' },
    fighting: { home: 'the mountain dojo', like: 'training till dawn', fear: 'Psychic-types', snack: 'a protein-packed Aspear Berry', boast: 'my fists' },
    poison: { home: 'the swamp', like: 'bubbling sludge', fear: 'Psychic-types', snack: 'a sour Pecha Berry', boast: 'my toxins' },
    ground: { home: 'the deep tunnels', like: 'digging holes', fear: 'water', snack: 'crunchy roots', boast: 'my digging' },
    flying: { home: 'the treetops', like: 'riding the wind', fear: 'Electric-types', snack: 'a juicy Pinap Berry', boast: 'my wings' },
    psychic: { home: 'the quiet ruins', like: 'meditating', fear: 'Dark-types', snack: 'a Mago Berry', boast: 'my mind' },
    bug: { home: 'the leafy canopy', like: 'crawling around', fear: 'Flying-types', snack: 'a tender leaf', boast: 'my shell' },
    rock: { home: 'the rocky cliffs', like: 'standing very, very still', fear: 'water', snack: 'tasty pebbles', boast: 'my sturdiness' },
    ghost: { home: 'the old tower', like: 'spooking travelers', fear: 'Dark-types', snack: 'souls— kidding! Berries', boast: 'my curses' },
    dragon: { home: 'the mountain peak', like: 'hoarding shiny things', fear: 'Fairy-types', snack: 'a whole Sitrus Berry', boast: 'my ancient blood' },
    dark: { home: 'the shadows', like: 'sneaking around', fear: 'Fairy-types', snack: 'stolen berries', boast: 'my cunning' },
    steel: { home: 'the old mine', like: 'polishing myself', fear: 'Fire-types', snack: 'iron filings', boast: 'my armor' },
    fairy: { home: 'the moonlit glade', like: 'sweets and sparkles', fear: 'Poison-types', snack: 'a sweet Poffin', boast: 'my sparkles' } };
  const SE = { fire: ['grass', 'ice', 'bug', 'steel'], water: ['fire', 'ground', 'rock'], grass: ['water', 'ground', 'rock'], electric: ['water', 'flying'], ice: ['grass', 'ground', 'flying', 'dragon'],
    fighting: ['normal', 'ice', 'rock', 'dark', 'steel'], poison: ['grass', 'fairy'], ground: ['fire', 'electric', 'poison', 'rock', 'steel'], flying: ['grass', 'fighting', 'bug'], psychic: ['fighting', 'poison'],
    bug: ['grass', 'psychic', 'dark'], rock: ['fire', 'ice', 'flying', 'bug'], ghost: ['psychic', 'ghost'], dragon: ['dragon'], dark: ['psychic', 'ghost'], steel: ['ice', 'rock', 'fairy'], fairy: ['fighting', 'dragon', 'dark'] };
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

  // ================= who is this Pokemon =================
  const NAT = Object.keys(NATURES);
  function who(w) {
    if (!w) return null; if (w.__voice && w.__voice.dex === Number(w.dex)) return w.__voice;   // (your Pokemon can change species mid-run)
    const dex = Number(w.dex), d = (E()?.DEX_BY || {})[dex] || {}, types = (d.types || ['normal']).map(t => String(t).toLowerCase()).filter(t => TYPE[t]);
    const nature = w.__nature || (w === E()?.Game?.player ? NAT[(dex * 7 + 3) % NAT.length] : pick(NAT)), name = w.name || d.name || ('#' + dex), clean = name.replace(/[^A-Za-z]/g, '');
    const cry = clean.length > 5 ? clean.slice(0, Math.min(5, Math.ceil(clean.length * 0.6))) : clean;   // "Rattata" → "Ratta"
    return (w.__voice = { dex, nature, voice: NATURES[nature], type: types[0] || 'normal', types: types.length ? types : ['normal'], name, cry: cry || name, g: w.__g || w.g || null, bst: d.bst || 300 });
  }
  function relation(a, b) {
    const A = who(a), Bv = who(b); if (!A || !Bv) return 'none';
    if (Number(a.dex) === Number(b.dex)) return A.g && Bv.g && A.g !== Bv.g ? 'mate' : 'twin';
    if (A.types.some(t => (SE[t] || []).some(x => Bv.types.includes(x)))) return 'adv';
    if (Bv.types.some(t => (SE[t] || []).some(x => A.types.includes(x)))) return 'dis';
    if (A.types.some(t => Bv.types.includes(t))) return 'kin';
    return 'none';
  }
  // what happened this run (for gossip)
  const RUN = { giratina: false, rift: false, kills: 0, harmless: 0 };
  function rumor() { const P = E()?.Game?.player, L = [];
    if (RUN.giratina) L.push('a Giratina tore open the dark itself', 'the shadows swallowed everyone near that explorer');
    if (RUN.rift) L.push('Dialga and Palkia showed up and BICKERED', 'the sky cracked open like an egg');
    if (P && [480, 481, 482].includes(Number(P.dex))) L.push('the Lake Guardians are wandering around together', 'one of the Lake Guardians left the lake');
    if (RUN.kills > 40) L.push('that explorer has knocked out ' + RUN.kills + ' of us already');
    L.push('there\'s a Golden Pokemon hiding nearby', 'a legendary was spotted past the trees', 'the bosses around here get grumpier every minute', 'someone found a whole chest of Rare Candy');
    return pick(L); }

  // ================= the explorer you play as =================
  function explorer() { const p = E()?.Game?.player; if (!p) return { name: 'that explorer', type: 'normal', dex: 0 }; const d = (E().DEX_BY || {})[Number(p.dex)] || {};
    const name = (p.mon && p.mon.name) || d.name || 'explorer'; return { name, type: String((d.types || ['normal'])[0]).toLowerCase(), dex: Number(p.dex), p }; }
  function aboutPlayer(me) {   // a remark about who the explorer is
    const X = explorer(), V = who(me), L = [];
    if ([480, 481, 482].includes(X.dex)) L.push('A L-Lake Guardian?! Here?!', 'Wait... you\'re one of the legends from the lake!');
    if (V && (SE[X.type] || []).some(t => V.types.includes(t))) L.push('A ' + cap(X.type) + '-type... that\'s really bad news for me.', 'Please don\'t use ' + cap(X.type) + ' moves on me!');
    if (V && (SE[V.type] || []).includes(X.type)) L.push('Heh, a ' + cap(X.type) + '-type. My ' + cap(V.type) + ' moves would wreck you.');
    L.push('You\'re that ' + X.name + ' everyone\'s whispering about!', 'An explorer! A real one!', 'You\'re not from around here, are you?');
    return pick(L); }

  // ================= what they say: situation → cores (per voice where it matters most) =================
  // {me} {other} {player} {home} {like} {fear} {snack} {boast} {type} {otype} {ptype} {rumor} {about} {cry}
  // ================= generated fragments: built from who's talking, who's around and what's happening =================
  // {pack} the nearest Pokemon on their own side · {grievance} something the pack did to them · {praise} something about the explorer
  // {threat} {insult} {wish} {memory} {fearline} {reason} why they're switching sides · {kills} how many the explorer knocked out
  function packOf(me) { const L = (E()?.EnemyMgr?.all?.() || []).filter(o => o && !o.dead && o !== me && !o.__role && !o.boss && Math.hypot(o.x - me.x, o.y - me.y) < 360); const o = L[Math.floor(Math.random() * L.length)]; return o ? (who(o) || {}).name : null; }
  const RUNSTAT = () => ({ kills: RUN.kills || 0, harmless: RUN.harmless || 0 });
  const GEN = {
    pack: (me) => packOf(me) || pick(['the others', 'the gang', 'the big ones', 'the boss']),
    grievance: (me, T) => { const p = packOf(me) || pick(['The others', 'The gang', 'The big ones']); return pick([p + ' took my ' + T.snack.replace(/^(a |an |some )/, ''), p + ' laughed at ' + T.boast, p + ' keeps shoving me to the front line', p + ' never lets me rest', 'nobody here even knows my name', p + ' called ' + T.home + ' a dump', 'I only came because ' + p + ' made me', p + ' blamed ME for the last loss', 'they never let me near the good berries']); },
    praise: (me, T, X) => { const st = RUNSTAT(); return pick([(st.kills > 5 ? 'you\'ve taken down ' + st.kills + ' of us' : 'you haven\'t backed down once'), 'you fight like a real ' + cap(X.type) + '-type hero', 'you didn\'t even flinch', 'you look out for the ones beside you', 'you hit harder than our boss', (st.harmless ? 'you\'re strong... even if you\'re scary' : 'you never hurt the ones who weren\'t fighting')]); },
    threat: (me, T) => pick(['I\'ll show you ' + T.boast, 'you\'ll go running back home', 'this is where your trip ends', 'I\'ll knock you all the way to ' + T.home, 'you\'re about to see why everyone fears ' + T.boast]),
    insult: (me, T, X) => pick(['you look like a soggy ' + (X.name || 'explorer'), 'my grandma hits harder', 'nice moves... NOT', 'you smell like ' + pick(['wet Psyduck', 'old berries', 'a Grimer']), 'even a Magikarp could dodge that']),
    wish: (me, T) => pick(['to go back to ' + T.home, 'a quiet day of ' + T.like, 'just one bite of ' + T.snack, 'to evolve someday', 'friends who don\'t push me around']),
    memory: (me, T) => pick(['back in ' + T.home, 'when I was just a little hatchling', 'before the bullies came', 'the last time it rained']),
    fearline: (me, T) => pick(['I\'m scared of ' + T.fear, 'I\'ve never been this scared', 'my legs won\'t stop shaking']),
    reason: (me, T, X, ctx) => ({ kin: 'you\'re a ' + X.name + ' too! We should stick together', awe: 'I\'ve never seen anyone fight like that', freed: 'the boss is gone... nobody can make me fight now', convinced: (ctx.ally || 'your friend') + ' says you\'re good people', saved: 'you saved me back there', friendly: (ctx.other ? who(ctx.other).name : 'my own team') + ' attacked ME', beg: 'I don\'t want to fight anymore', heart: GEN.grievance(me, T) })[ctx.reason || 'heart'] || GEN.grievance(me, T),
    kills: () => String(RUNSTAT().kills) };
  const S = {
    greet: { brave: ['Yo, {other}! Ready for a sparring match?', '{other}! Stay sharp out here.'], hothead: ['What are YOU looking at, {other}?', '{other}! Outta my way!'], timid: ['H-hi, {other}... you\'re not going to bite, are you?', 'Oh! {other}... you scared me.'],
      shy: ['H-hello, {other}...', '...Hi, {other}.'], cheerful: ['{other}! Wanna be friends?!', 'Hiii {other}! What a great day!'], lazy: ['Oh... it\'s you, {other}.', 'Hey {other}... wake me up later.'], sassy: ['Oh. It\'s {other}.', '{other}, your fur is a mess.'],
      polite: ['Good day to you, {other}.', 'A pleasure, {other}.'], prankster: ['Boo! Hehe, gotcha, {other}!', '{other}! Wanna help me prank someone?'], stoic: ['{other}.', '...{other}. Hm.'], gentle: ['Hello, {other}. Are you well?', 'Oh, {other}! Lovely to see you.'], quirky: ['{other}! Did you know clouds are just sky-water?', 'Hello {other}, I\'ve been counting blades of grass.'] },
    meetPlayer: { all: ['{about}', '{about} I\'m just looking for {snack}.', '{about} Have you been to {home}?'], brave: ['{about} Don\'t think I\'ll go easy if you start something.'], timid: ['{about} P-please don\'t hurt me!'], cheerful: ['{about} Can I get your autograph?!'],
      lazy: ['{about} ...anyway, I\'m napping.'], sassy: ['{about} Not impressed, though.'], polite: ['{about} Welcome to {home}.'], gentle: ['{about} Be careful out there, okay?'], prankster: ['{about} Wanna see a trick?'] },
    hurt: { all: ['Ow! I was just {like}!', 'Why?! I only wanted {wish}!'], brave: ['Hey! Fight fair, I wasn\'t even ready!'], hothead: ['YOU HIT ME?! For WHAT?!'], timid: ['Ow ow ow! Why?! I wasn\'t doing anything!', 'P-please stop! {fearline}!'], shy: ['Ow... w-why...?'],
      cheerful: ['Ow! I thought we were friends!'], lazy: ['Ow... I was SLEEPING...'], sassy: ['Excuse me?! Do you know who I AM?'], polite: ['That was entirely uncalled for!'], prankster: ['Hey, no fair! I\'M the one who does the surprises!'], stoic: ['...Why.'], gentle: ['Ah! Why would you hurt me?'], quirky: ['Ow! Was that a hug?! It hurt like a hit!'] },
    provoked: { all: ['That\'s IT! {threat}!', 'Fine! You want a fight?! {threat}!', 'I was minding my own business... NOT ANYMORE!'], timid: ['I-I\'m scared... but I\'m ANGRIER!'], lazy: ['...Okay. Now I\'m awake. And mad.'], polite: ['Very well. You leave me no choice.'], gentle: ['I didn\'t want this... but I\'ll protect myself.'] },
    die: { all: ['I just wanted... {wish}...', 'I miss... {memory}...', 'W-why...?'], timid: ['Mom...? I\'m scared...'], cheerful: ['I thought... we could\'ve been... friends...'], lazy: ['Guess... I\'ll take... a really long nap...'], sassy: ['Ugh... not... my face...'],
      polite: ['Tell my family... I was brave...'], gentle: ['It was... such a nice day...'], brave: ['At least... I didn\'t run...'], prankster: ['Heh... last prank... I didn\'t see coming...'], stoic: ['...So this is it.'], shy: ['...nobody will even... notice...'], hothead: ['This... isn\'t... over...'], quirky: ['Fun fact... this... hurts...'] },
    witness: { all: ['NO! Leave them alone!', 'You MONSTER!', 'They only wanted {wish}!', 'They never hurt anybody!'], timid: ['Y-you... you\'re a monster! Stay away!'], brave: ['You\'ll answer for that!'], lazy: ['...Hey. That wasn\'t cool. At all.'], polite: ['That... was cruel beyond words.'], gentle: ['No... no, no... they were so kind...'], sassy: ['Oh, real classy, hero.'] },
    witnessSame: { all: ['My friend...! NOOO!', 'Wake up! Please, WAKE UP!', 'You\'ll pay for that! They were my FAMILY!', 'We were going home to {home} together...!'], timid: ['B-big sibling...?! No...!'], hothead: ['MY BROTHER! YOU\'RE DONE!'], gentle: ['My little one... no...'] },
    witnessMate: { all: ['NO! We were going to be together FOREVER!', 'My love...! Please... open your eyes...', 'We were going to see {home} together...'] },
    spotPlayer: { all: ['{threat}!', 'Hey, {player}! {insult}!', 'This is OUR turf! {threat}!'], brave: ['An intruder! Face me!', 'You picked the wrong path, {player}!'], hothead: ['THERE you are! GET \'EM!', 'Outsider! {threat}!'], timid: ['A-an explorer...! W-we have to attack, right?', 'I-I\'m supposed to fight you... sorry!'],
      shy: ['I... I have to fight you... sorry...'], cheerful: ['Ooh, a challenger! Let\'s battle!'], lazy: ['Ugh... do I HAVE to fight you?', 'Fine... let\'s get this over with.'], sassy: ['You? Here? How adorable.', 'Hah! {insult}.'],
      polite: ['I\'m afraid this is our territory. Please leave.'], prankster: ['Fresh target! Hehehe!', 'Tag, you\'re IT! And by tag I mean ATTACK!'], stoic: ['Leave. Or fall.'], gentle: ['I\'m sorry, but you can\'t stay here.'], quirky: ['You smell like adventure. And victory. MY victory.'] },
    lowHp: { all: ['I\'ll remember this!', 'Ugh... {pack}, help me!', 'I just wanted {wish}...'], brave: ['I\'m... not done yet!'], hothead: ['ARGH! Retreat! ...For now!'], timid: ['I-I give up! Please!', 'Too strong! Too strong!'], shy: ['I... I can\'t...'], cheerful: ['Ow ow ow! Good battle, I quit!'], lazy: ['...I\'m too tired for this.'],
      sassy: ['This never happened!'], polite: ['I concede... this round.'], prankster: ['Running away is a valid strategy!'], stoic: ['...Retreating.'], gentle: ['Please... no more...'], quirky: ['Statistically I should flee now!'] },
    avenge: { all: ['N-no! You\'ll pay for that!', 'Buddy!! ...You MONSTER!', 'They were from {home}, like me...!'], stoic: ['...You will regret that.'], timid: ['Th-they were my friend...!'] },
    playerLow: { all: ['They\'re almost down! {pack}, now!', 'Look at you, {player}. Barely standing.'], brave: ['You\'re almost finished, {player}!'], hothead: ['You\'re DONE! Finish \'em!'], sassy: ['{insult}. And you\'re about to fall.'], prankster: ['Ooh, wobbly! Hehehe!'], stoic: ['Your end is near.'] },
    boss: { all: ['So YOU\'RE the one making all this noise...', 'This is MY domain. {threat}.'] },
    thief: { all: ['Shiny things are MINE!', 'Ooh, what\'s in your bag? Gimme!', 'Hand over the loot and maybe I\'ll let you pass!'] },
    traitor: { all: ['TRAITOR!', 'Hey! Get back here!', 'How COULD you?!', 'Fine! Go with them! See if I care!'] },
    turn1: { all: ['...Wait. Why am I even fighting you? {grievance}.', 'Hold on... {reason}...', '{grievance}... and {praise}. What am I even doing?', 'You know... {praise}.'], timid: ['I d-don\'t even like fighting... {reason}...'], lazy: ['...This is so much work. {reason}.'], brave: ['Hmph. {praise}. I respect that.'], sassy: ['Ugh. {grievance}. I\'m so done with them.'] },
    turn2: { all: ['You know what? I\'d rather team up with YOU!', 'Forget {pack}! Can I join your team?!', 'I\'m switching sides! Let\'s go, partner!', 'From now on, I fight for YOU!'], polite: ['Allow me to offer my services instead.'], stoic: ['...I will follow you.'], prankster: ['Hehe, the ultimate prank: switching sides!'], hothead: ['{pack}! You hear that?! I QUIT!'] },
    beg: { all: ['P-please... {reason}... can I come with you instead?', 'Please... take me with you... I only wanted {wish}...'] },
    defect: { all: ['That\'s IT! If that\'s how you treat me, I\'m with the explorer!', '{reason}?! Fine! I\'m switching sides!'], hothead: ['YOU HIT ME?! I\'M DONE WITH ALL OF YOU!'], timid: ['Th-they hurt me... the explorer never did that...'] },
    friendlyFire: { all: ['OW! Watch where you\'re shooting, {other}!', 'HEY! {other}! That was MY back!', '{other}, you did that on PURPOSE!'], timid: ['Ow! {other}... why...?'], hothead: ['{other}! You wanna go?! LET\'S GO!'] },
    bump: { all: ['Quit shoving, {other}!', 'Watch it, {other}!', 'Hey! That\'s my spot, {other}!'] },
    saved: { all: ['You... you saved me!', 'I owe you one, explorer!'], stoic: ['...I owe you.'], cheerful: ['My hero!'] },
    recruit: { all: ['Come on, {other}! They\'re good people!', '{other}! Join us! It\'s way better over here!', 'Psst, {other}... the explorer shares their berries.'] },
    allyKill: { all: ['Got one!', 'Take that!', 'Did you see that? Did you SEE that?!', 'That one\'s for {home}!'], stoic: ['Target down.'], polite: ['One less, partner.'], lazy: ['...That one\'s done. Nap time?'], hothead: ['WHO\'S NEXT?!'] },
    allyLow: { all: ['Ow... I\'m hanging in there!', 'Th-they hit hard...', 'I need a breather...'] },
    allyIdle: { all: ['Thanks for letting me tag along!', 'Team life is SO much better!', 'When this is over, let\'s go to {home}!', 'I could really go for {snack}... later!'], brave: ['I\'ll protect you, partner!'], lazy: ['Can we stop for a snack? ...No? Okay.'], cheerful: ['Adventure! Adventure! Adventure!'], polite: ['It\'s an honor to travel with you.'], sassy: ['Admit it. I\'m your best teammate.'] },
    allyFaint: { all: ['S-sorry... I can\'t fight anymore... Thank you for taking me in...', 'I\'ll... go rest in {home}... thank you...'] },
    win: { all: ['Hmph! And STAY down!', 'HA! That\'ll teach you!', 'Next time, keep your paws off my {snack}!'] }, truce: { all: ['...Fine. Truce. For now.', 'Ugh. Whatever. We\'re even.'] }, home: { all: ['Now that THAT\'s settled... I\'m going home to {home}.'] },
    grudge: { all: ['HEY! {other}! You stole my Gold Ball!', 'I was saving {snack} and YOU ate it, {other}!', 'You stepped on my tail AGAIN, {other}!', 'You told everyone I can\'t evolve!', 'This is MY napping spot, {other}!'] },
    grudgeSame: { all: ['Give back my Gold Ball, you copycat!', 'Mom always liked you better!'] },
    grudgeReply: { all: ['Finders keepers! Get lost!', 'Should\'ve been faster, then!', 'Make me!', 'Prove it!', '{insult}!'], timid: ['I-I didn\'t mean to!'], sassy: ['Oh, cry me a river.'] } };
  // speech-bubble small talk (short)
  const B = {
    nap: ['Zzz...', '*snore*', '...five more minutes...', 'Mmh... {snack}...'], wake: ['Wha—?!', 'H-huh?! I wasn\'t sleeping!', 'Who\'s there?!'], eat: ['*munch munch*', 'Nom nom~', 'Mmm, {snack}!', 'So juicy!'], sniff: ['Mmm, flowers~', 'So pretty...', 'Smells like {home}...'],
    dig: ['There\'s gotta be treasure here...', '*dig dig dig*'], digFound: ['Ooh! Treasure!', 'I found a coin!'], digNone: ['...Nothing. Again.', 'Just dirt...'],
    tail: ['I\'ll get you this time!', 'Come back here, tail!'], dizzy: ['@_@', 'The ground is spinning...'], gaze: ['That cloud looks like {snack}...', 'So peaceful...', 'I miss {home}...', 'I wonder what\'s past the trees...'],
    play: ['Tag! You\'re it!', 'Hehe! Can\'t catch me!'], cry: ['*sniff*...', 'Waaah...'], shiny: ['Ooh, shiny!', 'So sparkly...'], cheer: ['Fight! Fight! Fight!', 'Get \'em!', 'Ooh, that\'s gotta hurt!'],
    scared: ['Eek!', 'Run away!', 'Not again!'], lvl: ['Whoa! It\'s glowing!', 'What was THAT?!'], bossFlee: ['That one\'s HUGE! Run!', 'Nope nope nope!'],
    swimTry: ['I can do it! I can sw— *blub blub*', 'Just one stroke... *glub*', 'Paddle, paddle... AAAH!'], swimFail: ['...Water is too wet.', '*cough* Maybe tomorrow.', 'Why can\'t I float?!'], swimOk: ['Ahh~ refreshing!', 'Splish splash~'],
    climbTry: ['Hup! Hup!', 'Just... a little... higher...!', 'I can see the top!'], climbFall: ['Oof!', 'Owie...', '...One day I\'ll reach the top.'],
    giratina: ['W-what IS that thing?!', 'The shadows are MOVING!', 'RUN!! Everyone RUN!', 'I don\'t wanna get eaten!', 'It\'s looking at us!'], rift: ['The sky is TEARING!', 'Legendaries?! HERE?!', 'Time is... bending?!', 'Hide! HIDE!'],
    stuck: ['I can\'t move!!', 'My legs won\'t work!', 'Mommyyy!'] };
  // a reply in someone's own voice, by mood
  const REPLY = {
    agree: { brave: ['Heh, you got that right!'], hothead: ['Obviously!'], timid: ['Y-yeah... I think so too...'], shy: ['...Me too.'], cheerful: ['YES! Totally!'], lazy: ['...yeah, sure.'], sassy: ['For once, you\'re right.'], polite: ['I quite agree.'], prankster: ['Heh, same!'], stoic: ['Agreed.'], gentle: ['I feel the same way.'], quirky: ['Agreed! Bloop!'] },
    disagree: { brave: ['No way! I\'d never!'], hothead: ['WRONG!'], timid: ['U-um... I don\'t think so...'], shy: ['...I don\'t know about that.'], cheerful: ['Hmm, nope!'], lazy: ['...nah.'], sassy: ['Ew. No.'], polite: ['I must respectfully disagree.'], prankster: ['Nuh-uh!'], stoic: ['No.'], gentle: ['Oh, I don\'t think so, dear.'], quirky: ['Opposite day? Then YES! I mean no!'] },
    scared: { brave: ['I\'m not scared! ...Much.'], hothead: ['Scared?! ME?! ...Okay, a little.'], timid: ['S-so scary...!'], shy: ['...I\'m scared.'], cheerful: ['Eep! That\'s spooky!'], lazy: ['...I\'ll worry about it tomorrow.'], sassy: ['Not my problem.'], polite: ['How very alarming.'], prankster: ['Ooh, spooky! I love it!'], stoic: ['...Concerning.'], gentle: ['Oh dear... stay safe, okay?'], quirky: ['Fun fact: I\'m terrified!'] },
    excited: { brave: ['Now THAT\'s worth fighting for!'], hothead: ['YEAH! LET\'S GO!'], timid: ['O-oh! Really?!'], shy: ['...That\'s nice.'], cheerful: ['WOW! Amazing!'], lazy: ['Huh. Neat.'], sassy: ['Hm. Not bad, I suppose.'], polite: ['How marvelous!'], prankster: ['Hehehe, sounds fun!'], stoic: ['...Interesting.'], gentle: ['How wonderful!'], quirky: ['Bloop bloop! Exciting!'] } };

  // ================= the voice shapes the line =================
  function fill(s, me, ctx) {
    const V = who(me), T = TYPE[V.type] || TYPE.normal, X = explorer(), O = ctx && ctx.other ? who(ctx.other) : null;
    const base = { me: V.name, other: O ? O.name : (ctx && ctx.otherName) || 'you', player: X.name, home: T.home, like: T.like, fear: T.fear, snack: T.snack, boast: T.boast, type: cap(V.type), otype: O ? cap(O.type) : '', ptype: cap(X.type), cry: V.cry, n: ctx && ctx.n };
    return s.replace(/\{(\w+)\}/g, (_, k) => { if (k in base) return base[k] ?? ''; if (k === 'rumor') return (ctx && ctx.rumor) || rumor(); if (k === 'about') return aboutPlayer(me); if (GEN[k]) return GEN[k](me, Object.assign({ name: V.name }, T), X, ctx || {}); return ''; })
      .replace(/(^|(?<!\.)[.!?]\s+)([a-z])/g, (m, a, c) => a + c.toUpperCase());   // generated pieces may start a sentence (not after a '...' pause)
  }
  let NAMES = null; const isName = w => { if (!NAMES) { NAMES = new Set(); for (const k in (E()?.DEX_BY || {})) NAMES.add(E().DEX_BY[k].name); } return NAMES.has(w); };
  function shape(text, V, short, grave) {
    const v = VOICE[V.voice] || VOICE.stoic; let t = text.trim();
    if (v.stutter && chance(v.stutter)) t = t.replace(/^([A-Za-z])(?!-)/, (m, c) => c + '-' + (c === 'I' ? c : c.toLowerCase()));
    if (grave) return t;   // pain, grief, last words: no cheery openers or sign-offs
    if (!short && chance(0.5) && v.open.length) { const o = pick(v.open); if (o) t = o + ' ' + (/,$/.test(o) && /^[A-Z][a-z]/.test(t) && !/^(I|I'm|I'll|I've)\b/.test(t) && !isName(t.split(/[^A-Za-z.'-]/)[0]) ? t[0].toLowerCase() + t.slice(1) : t); }
    if (!short && /[.!]$/.test(t) && !/\.\.\.$/.test(t) && !/\?[!.]*$/.test(t) && chance(0.45)) t = t.replace(/[.!]+$/, '') + pick(v.close);
    if (v.caps && chance(0.5)) { const w = t.split(' '); const i = w.findIndex(x => x.replace(/[^a-z]/gi, '').length > 3); if (i >= 0) w[i] = w[i].toUpperCase(); t = w.join(' '); }
    if (v.slow && chance(0.4)) t = t.replace(/, /, '... ');
    if (v.cry && chance(v.cry)) t = chance(0.5) ? V.cry + '! ' + t : t + ' ' + V.cry + '!';
    return t.replace(/(?<!\.)([.!?]\s+)([a-z])/g, (m, a, c) => a + c.toUpperCase());   // a capital after every full stop
  }
  function emoteFor(sit, V) { const v = VOICE[V.voice] || VOICE.stoic;
    return ({ hurt: 'tear', die: 'tear', witness: BOLD.has(V.voice) ? 'anger' : 'tear', witnessSame: 'tear', witnessMate: 'tear', provoked: 'anger', lowHp: 'sweat', spotPlayer: BOLD.has(V.voice) ? 'anger' : v.em, traitor: 'anger', turn2: 'heart', beg: 'tear', allyFaint: 'tear', grudge: 'anger', avenge: 'anger', boss: 'anger' })[sit] || v.em; }
  function faceFor(sit, V) { const v = VOICE[V.voice] || VOICE.stoic;
    return ({ hurt: SOFT.has(V.voice) ? 'crying' : 'pain', die: 'crying', witness: BOLD.has(V.voice) ? 'shouting' : 'crying', witnessSame: 'crying', witnessMate: 'crying', provoked: 'angry', lowHp: 'pain', traitor: 'angry', turn1: 'worried', turn2: 'joyous', beg: 'teary', allyFaint: 'crying', grudge: 'angry', avenge: 'angry' })[sit] || v.face; }
  function line(me, sit, ctx) {
    const V = who(me); if (!V) return ['normal', '...', 'dots']; const pool = S[sit] || P[sit] || {}; let list = pool[V.voice] || pool.all;
    if (pool[V.voice] && pool.all && chance(0.3)) list = pool.all; if (!list) list = ['...'];
    if (sit === 'turn1' && ctx && ctx.reason && ctx.reason !== 'heart') list = ['Hold on... {reason}...', '{reason}. I want to fight beside you!', '...{reason}. I\'ve made up my mind.', 'Wait, wait... {reason}!'];   // a specific reason to switch sides
    return [faceFor(sit, V), shape(fill(pick(list), me, ctx), V, false, GRAVE.has(sit)), emoteFor(sit, V)];
  }
  function bubble(me, kind, ctx) { const V = who(me); const L = B[kind]; if (!V || !L) return '...'; return shape(fill(pick(L), me, ctx), V, true); }
  function reply(me, mood) { const V = who(me); const L = (REPLY[mood] || REPLY.agree)[V.voice] || ['...']; return [V.voice === 'timid' || V.voice === 'shy' ? 'worried' : (VOICE[V.voice] || VOICE.stoic).face, shape(pick(L), V, true), (VOICE[V.voice] || VOICE.stoic).em]; }

  // ================= conversations between two Pokemon =================
  // returns [[speaker, face, text, emote], ...] and an outcome ('love' | 'reject' | 'fight' | null)
  function chat(a, b, o) {
    o = o || {}; const A = who(a), Bv = who(b), rel = relation(a, b), out = [], L = (w, l) => out.push([w, l[0], l[1], l[2]]);
    const mood = (w, pos) => { const V = who(w); return pos ? (V.voice === 'sassy' || V.voice === 'stoic' ? 'agree' : 'excited') : 'disagree'; };
    const X = explorer(); let outcome = null;
    if (o.hostile) {   // two hostile ones on the march
      L(a, [VOICE[A.voice].face, shape(fill(pick(['That {player} is around here somewhere...', 'Let\'s surround that explorer!', 'Boss says nobody passes through here.', 'I heard {rumor}.', 'After this, berries are on me.']), a), A), VOICE[A.voice].em]);
      L(b, SOFT.has(Bv.voice) ? reply(b, 'scared') : reply(b, 'agree'));
      if (chance(0.4)) L(a, SOFT.has(Bv.voice) ? [VOICE[A.voice].face, shape(pick(['Toughen up!', 'Stay behind me, then.', 'You\'ll be fine.']), A, true), VOICE[A.voice].em] : reply(a, 'agree'));
      return { lines: out, outcome };
    }
    if (rel === 'mate' && chance(0.75)) {   // a possible sweetheart
      const comp = pick(['Your {type}-type glow is... really pretty, {other}.', 'Hey {other}... wanna share {snack} with me?', '{other}, would you... walk with me for a while?', 'I-I made you a flower crown, {other}!']);
      L(a, [A.voice === 'shy' || A.voice === 'timid' ? 'worried' : 'happy', shape(fill(comp, a, { other: b }), A), 'heart']);
      const yes = !(Bv.voice === 'sassy' && chance(0.6)) && !(Bv.voice === 'stoic' && chance(0.5)) && !(Bv.voice === 'hothead' && chance(0.4)) && chance(0.8);
      if (yes) { L(b, ['joyous', shape(pick(['...I\'d love that.', 'Y-yes! I was hoping you\'d ask!', 'Only if you hold my paw.', 'Hehe... you\'re sweet.']), Bv, true), 'heart']); outcome = 'love'; }
      else { L(b, ['normal', shape(pick(['Hmph. In your dreams.', 'Not interested.', 'Maybe after you evolve.', 'Ew, no.']), Bv, true), Bv.voice === 'stoic' ? 'dots' : 'anger']); L(a, ['sad', shape('...Oh. Okay.', A, true), 'tear']); outcome = 'reject'; }
      return { lines: out, outcome };
    }
    if (rel === 'twin') { L(a, line(a, 'greet', { other: b })); L(b, [faceFor('greet', Bv), shape(fill(pick(['We look exactly alike! Are you me?', 'Family reunion!', 'Copycat!', 'Hey, sibling!']), b), Bv), 'note']); L(a, reply(a, 'excited')); return { lines: out, outcome }; }
    if (rel === 'adv' && BOLD.has(A.voice)) {   // a type matchup
      L(a, ['determined', shape(fill(pick(['One {type} move and you\'re done, {other}.', 'Careful, {other}. {type} beats {otype}, everyone knows that.', 'Hey {other}, ever been hit by a {type}-type? You\'d remember.']), a, { other: b }), A), 'anger']);
      if (SOFT.has(Bv.voice)) { L(b, reply(b, 'scared')); } else { L(b, ['angry', shape(fill(pick(['Type matchups aren\'t everything!', 'Try it, {other}!', 'Big words for someone so small.']), b, { other: a }), Bv), 'anger']); if (BOLD.has(Bv.voice) && chance(0.35)) outcome = 'fight'; }
      return { lines: out, outcome };
    }
    if (rel === 'kin') { L(a, [VOICE[A.voice].face, shape(fill(pick(['Another {type}-type! We should stick together, {other}.', 'Hey {other}, {home} misses you too?', 'Fellow {type}-type! Still into {like}?']), a, { other: b }), A), VOICE[A.voice].em]); L(b, reply(b, 'agree')); return { lines: out, outcome }; }
    if (BOLD.has(A.voice) && BOLD.has(Bv.voice) && chance(0.4)) {   // two hotheads
      L(a, ['angry', shape(fill(pick(['You\'re in MY spot, {other}.', 'Nice face, {other}. Did a Geodude sit on it?', 'Bet I could beat you in a race, {other}.']), a, { other: b }), A), 'anger']);
      L(b, ['angry', shape(fill(pick(['Says the one who smells like {snack}!', 'Wanna settle this?!', 'Your spot? I don\'t see your name on it!']), b, { other: a }), Bv), 'anger']);
      L(a, reply(a, 'disagree')); if (chance(0.3)) outcome = 'fight'; return { lines: out, outcome };
    }
    // small talk on a topic
    const topic = pick(['food', 'home', 'explorer', 'rumor', 'dream', 'weather']);
    if (topic === 'food') { L(a, [VOICE[A.voice].face, shape(fill('Have you ever tried {snack}? It\'s the best.', a), A), 'note']); const same = A.type === Bv.type;
      L(b, [VOICE[Bv.voice].face, shape(fill(same ? 'Of course! Nothing beats it.' : 'Eh, I\'d rather have {snack}.', b), Bv), 'note']); L(a, reply(a, same ? 'excited' : chance(0.5) ? 'disagree' : 'agree')); }
    else if (topic === 'home') { L(a, [VOICE[A.voice].face, shape(fill('I\'m from {home}. Where are you from, {other}?', a, { other: b }), A), 'question']); L(b, [VOICE[Bv.voice].face, shape(fill('Me? I\'m from {home}. I miss it, honestly.', b), Bv), 'dots']); L(a, reply(a, 'agree')); }
    else if (topic === 'explorer') { L(a, [VOICE[A.voice].face, shape(fill(pick(['Did you see {player}? Everyone\'s talking about them.', 'That {player} keeps knocking everyone out...', 'Do you think {player} is friendly?']), a), A), 'question']);
      L(b, SOFT.has(Bv.voice) ? reply(b, 'scared') : BOLD.has(Bv.voice) ? ['determined', shape(fill(pick(['I could take \'em.', 'Pfft, overrated.', 'If they come here, I\'ll show \'em!']), b), Bv), 'anger']
        : [VOICE[Bv.voice].face, shape(pick(['They seem nice enough!', 'Hard to say... they\'re always fighting.', 'They waved at me once! I think.', 'As long as they leave the berries alone.']), Bv), VOICE[Bv.voice].em]); }
    else if (topic === 'rumor') { const r = rumor(); L(a, [VOICE[A.voice].face, shape(fill('Psst... did you hear? They say {rumor}.', a, { rumor: r }), A), 'exclaim']); L(b, reply(b, /Giratina|shadows|cracked|tore|grump|knocked|legendary|Golden/.test(r) ? (/Golden|Candy/.test(r) ? 'excited' : 'scared') : 'excited')); }
    else if (topic === 'dream') { L(a, [VOICE[A.voice].face, shape(fill(pick(['Someday I\'ll evolve and be the strongest in {home}.', 'One day I want to see the ocean.', 'I dream about {like} every night.']), a), A), 'spark']); L(b, reply(b, Bv.voice === 'sassy' ? 'disagree' : 'excited')); }
    else { L(a, [VOICE[A.voice].face, shape(fill(pick(['Nice weather for {like}, huh?', 'Feels like rain soon...', 'Perfect day to do nothing.']), a), A), 'note']); L(b, reply(b, chance(0.7) ? 'agree' : 'disagree')); }
    if (chance(0.5)) L(b, [VOICE[Bv.voice].face, shape(pick(['Anyway, see you around!', 'Gotta go!', 'Later!', 'Bye-bye!']), Bv, true), 'note']);
    return { lines: out, outcome };
  }


  // ================= YOUR Pokemon: whoever you play as has a voice too =================
  const P = {
    p_start: { brave: ['Alright, let\'s do this!', 'Nobody\'s stopping me today!'], hothead: ['LET\'S GOOO! Who wants some?!'], timid: ['O-okay... I can do this... I think.'], shy: ['...Here goes.'], cheerful: ['Adventure time! Yay!'], lazy: ['...Fine. Let\'s get this over with.'],
      sassy: ['Try to keep up, wild ones.'], polite: ['Let us begin, then.'], prankster: ['Hehe, time to cause some trouble~'], stoic: ['...Begin.'], gentle: ['Let\'s all stay safe out there.'], quirky: ['Today\'s forecast: 100% chance of me!'] },
    p_hurtBig: { all: ['Ugh! That one hurt!', 'Gah—! Okay, okay, I felt that.'], timid: ['Ow ow ow! Too much!'], stoic: ['...Tch.'], sassy: ['Did you just— the NERVE!'] },
    p_low: { brave: ['I\'m not going down here!'], hothead: ['Is that ALL you\'ve got?!'], timid: ['I-I need to get out of here...!'], shy: ['...I can\'t lose... not yet...'], cheerful: ['Hehe... I\'m fine! Totally fine!'], lazy: ['...Can I just lie down for a bit?'],
      sassy: ['This is NOT how my story ends.'], polite: ['I must... retreat and regroup.'], prankster: ['Okay, okay, maybe I\'m in a little trouble.'], stoic: ['...Still standing.'], gentle: ['I need to be careful now...'], quirky: ['HP is just a number! A very low number!'] },
    p_level: { all: ['I feel stronger!', 'Level up! Hehe.'], stoic: ['...Growing.'], lazy: ['Neat. Stronger. Nap now?'], hothead: ['STRONGER! YEAH!'], polite: ['My training bears fruit.'] },
    p_boss: { brave: ['A big one! Finally, a real fight!'], hothead: ['You think you\'re tough?! Prove it!'], timid: ['Th-that thing is HUGE...'], cheerful: ['Whoa! Big battle time!'], lazy: ['...Oh great. A big one.'], sassy: ['Big doesn\'t mean scary.'], polite: ['A formidable foe. Very well.'], stoic: ['...So you\'re the boss.'], all: ['Here comes a big one...'] },
    p_legend: { brave: ['A legendary?! I\'m not backing down!'], hothead: ['Legendary or not, I\'ll knock you OUT!'], timid: ['A-a real legendary...?! I\'m doomed...'], cheerful: ['A LEGENDARY! Can I get a picture first?!'], lazy: ['...A legendary. Of course. Today of all days.'], sassy: ['Legendary? We\'ll see about that.'],
      polite: ['An honor to face you... truly.'], stoic: ['...So the legends are real.'], gentle: ['Please... we don\'t have to fight.'], prankster: ['Ooh, a legendary! Bet I can make it trip!'], quirky: ['Fun fact: I\'m about to fight a legend!'], shy: ['...H-hello, legend...'] },
    p_bossDown: { all: ['Got it! The big one\'s down!', 'Phew! That was close!'], brave: ['HA! Who\'s next?!'], timid: ['I-I actually did it...!'], sassy: ['Was there ever any doubt?'], stoic: ['...Done.'], lazy: ['Can I nap now?'], cheerful: ['WE WON! Yay!'] },
    p_killHarmless: { gentle: ['No... I\'m so sorry... I didn\'t mean to...'], timid: ['Oh no, oh no... I didn\'t mean it!'], shy: ['...I\'m sorry.'], cheerful: ['Wait— were they friendly?! Oh no...'], brave: ['...I didn\'t mean to. I\'m sorry.'], polite: ['That was... regrettable.'],
      sassy: ['They got in my way.'], hothead: ['They shouldn\'t have been in the way!'], lazy: ['...Oops.'], stoic: ['...It happens.'], prankster: ['Eh... sorry. That wasn\'t a prank.'], quirky: ['Oh no. Oh no no no.'] },
    p_feud: { all: ['Are they... fighting each other?', 'Wow, they hate each other more than me!'], prankster: ['Ooh, drama! Hehe~'], polite: ['Let them settle it themselves.'] },
    p_allyJoin: { all: ['Welcome aboard!', 'Glad to have you with me!'], stoic: ['...Stay close.'], sassy: ['Fine. Try not to slow me down.'], cheerful: ['A new friend! YAY!'] },
    p_allyFaint: { all: ['No! Hang in there!', 'Thank you for fighting with me...'], hothead: ['Who did that?! YOU\'RE DONE!'] },
    p_scene: { all: ['Aww...', 'Heh. Life goes on out here.'], cheerful: ['Aww, congrats you two!'], sassy: ['Cute. Disgusting, but cute.'], gentle: ['How lovely...'], stoic: ['...Hm.'] },
    p_shiny: { all: ['Whoa, a shiny one!', 'Is that... SPARKLING?!'] },
    p_arena: { all: ['A rift... something big is in here.', 'This place feels... different.'], timid: ['I-I don\'t like this place...'], brave: ['Show yourself!'] },
    p_idle: { all: ['I miss {home} sometimes.', 'I could really go for {snack} right now.', 'One day I\'ll be legendary too.', 'So many Pokemon out here...'], lazy: ['*yawn*... is it nap time yet?'], cheerful: ['This is the best adventure EVER!'], stoic: ['...'], quirky: ['What if the berries are watching US?'], hothead: ['Come on! Where are the tough ones?!'] },
    p_replyMeet: { all: ['Hi there!', 'Nice to meet you too!', 'Don\'t worry, I won\'t hurt you.'], sassy: ['Sure, whatever.'], stoic: ['...Hello.'], timid: ['H-hi...'], hothead: ['Stay out of my way and we\'re good!'], prankster: ['Boo! Hehe, kidding!'] },
    p_replyHurt: { gentle: ['I\'m so sorry! That was an accident!'], timid: ['S-sorry! My moves just go everywhere!'], sassy: ['Then don\'t stand there.'], hothead: ['Then MOVE!'], all: ['Sorry! I didn\'t see you there!'] },
    p_replyTaunt: { brave: ['Bring it!'], hothead: ['Say that to my FACE!'], timid: ['Eep! P-please go away!'], sassy: ['Cute. Really.'], lazy: ['...Yeah, yeah.'], stoic: ['...'], all: ['We\'ll see about that!'] },
    p_replyLegendDown: { all: ['...Thank you for the battle.', 'You were incredible.'], sassy: ['Not so legendary now, huh?'], hothead: ['WHO\'S LEGENDARY NOW?!'], gentle: ['Rest well...'], stoic: ['...Respect.'] },
    p_kills: { all: ['That\'s {n} down!', '{n} knocked out... and counting!'], timid: ['{n}...?! Wow, did I do that?'], stoic: ['{n}.'] } };

  // ================= legendaries: a title, a manner, and a signature line =================
  const LEG = {
    144: ['the Freezing Wings', 'serene', 'The wind itself freezes where I fly.'], 145: ['the Thunder Wings', 'fierce', 'Feel the storm in your bones!'], 146: ['the Flame Wings', 'regal', 'My wings are the dawn on fire.'],
    150: ['the Genetic Pokemon', 'cold', 'I was not born. I was MADE. And I will not lose.'], 151: ['the New Species', 'playful', 'Mew~! Wanna play? I play rough~'],
    243: ['the Thunder Beast', 'fierce', 'Lightning answers my roar!'], 244: ['the Volcano Beast', 'fierce', 'A volcano erupts when I roar!'], 245: ['the Aurora Beast', 'serene', 'I am the north wind that purifies.'],
    249: ['the Guardian of the Seas', 'ancient', 'Your storm stirs the deep, little one.'], 250: ['the Rainbow Guardian', 'regal', 'Only the pure of heart may see my rainbow.'], 251: ['the Time Travel Pokemon', 'playful', 'I\'ve seen how this ends~ Wanna know?'],
    377: ['the Rock Peak', 'mechanical', '...RE-GI... ROCK... DEFEND.'], 378: ['the Iceberg', 'mechanical', '...RE-GI... ICE... FREEZE.'], 379: ['the Iron', 'mechanical', '...RE-GI... STEEL... CRUSH.'],
    380: ['the Eon Pokemon', 'serene', 'Please... I don\'t want to hurt you. Stop.'], 381: ['the Eon Pokemon', 'regal', 'For my sister, I will not hold back.'],
    382: ['the Sea Basin', 'wrathful', 'The oceans will swallow the land... and YOU.'], 383: ['the Continent', 'wrathful', 'The land will burn dry under my sun!'], 384: ['the Sky High', 'ancient', 'I rule the sky. Fall from it.'],
    385: ['the Wish Pokemon', 'playful', '*yawn*... You woke me. Make a wish... that you\'d stayed away.'], 386: ['the DNA Pokemon', 'mechanical', 'Specimen detected. Commencing analysis.'],
    480: ['the Being of Knowledge', 'serene', 'I already know how you\'ll move.'], 481: ['the Being of Emotion', 'playful', 'I can feel your heart racing~'], 482: ['the Being of Willpower', 'fierce', 'My will is stronger than yours!'],
    483: ['the Temporal Pokemon', 'ancient', 'Your time ends here.'], 484: ['the Spatial Pokemon', 'regal', 'There is no space left for you to run.'], 485: ['the Lava Dome', 'fierce', 'Magma flows in my veins!'], 486: ['the Colossal', 'ancient', '...The continents moved for me once.'],
    487: ['the Renegade Pokemon', 'cold', 'The Distortion World is always hungry.'], 488: ['the Lunar Pokemon', 'serene', 'Sleep... and dream of better days.'], 491: ['the Pitch-Black Pokemon', 'cold', 'Your nightmares have already begun.'], 492: ['the Gratitude Pokemon', 'playful', 'Flowers bloom where I fight~'],
    493: ['the Alpha Pokemon', 'ancient', 'I shaped this world. I can unshape you.'], 494: ['the Victory Pokemon', 'playful', 'Victory is MY thing! V for Victini!'],
    643: ['the Vast White', 'regal', 'Show me your truth!'], 644: ['the Deep Black', 'fierce', 'Show me your ideals!'], 646: ['the Boundary', 'cold', 'I am the empty half. Fill me with your despair.'],
    716: ['the Life Pokemon', 'serene', 'All life returns to the tree.'], 717: ['the Destruction Pokemon', 'wrathful', 'All life ends beneath my wings.'], 718: ['the Order Pokemon', 'cold', 'You disturb the ecosystem. You will be corrected.'],
    720: ['the Mischief Pokemon', 'playful', 'Surprise! Hehe, where\'d you come from?'], 791: ['the Sunne', 'regal', 'Behold the blazing sun!'], 792: ['the Moone', 'serene', 'The moon watches. The moon judges.'], 800: ['the Prism Pokemon', 'wrathful', 'LIGHT... GIVE ME... LIGHT!'],
    801: ['the Artificial Pokemon', 'mechanical', 'Soul-Heart online. Hostility... confirmed.'], 888: ['the Warrior', 'regal', 'My sword answers to no one!'], 889: ['the Warrior', 'fierce', 'My shield will not break!'], 890: ['the Gigantic', 'wrathful', 'THE DARKEST DAY BEGINS.'] };
  const RIVAL = { 150: { 151: 'Mew... the original. I will prove I am the greater.' }, 151: { 150: 'Mewtwo~! You still mad at me? Hehe~' }, 382: { 383: 'GROUDON. The sea will drown your sun!' }, 383: { 382: 'KYOGRE! I will boil your oceans dry!' },
    384: { 382: 'Enough, both of you. I will end this.', 383: 'Enough, both of you. I will end this.' }, 483: { 484: 'Palkia... why are you ALWAYS in my way?!', 487: 'Giratina... return to your exile.' }, 484: { 483: 'Dialga! Out of my space!', 487: 'The renegade dares show itself?' },
    487: { 483: 'Dialga... I remember what you did.', 484: 'Palkia... you never visit.', 480: 'The Lake\'s little Knowledge... how quaint.', 481: 'Little Emotion... feel your fear.', 482: 'Little Willpower... bend.' },
    643: { 644: 'Zekrom... my other half. Our ideals clash again!' }, 644: { 643: 'Reshiram! Your truth is nothing against my ideals!' }, 249: { 250: 'Ho-Oh... the skies remember our old bond.' }, 250: { 249: 'Lugia. The tower burned, but I remember you.' },
    380: { 381: 'Brother?! W-what are you doing here?!' }, 381: { 380: 'Latias! Stay behind me— wait, you\'re the explorer?' }, 488: { 491: 'Darkrai! Your nightmares end tonight!' }, 491: { 488: 'Cresselia... always chasing me.' },
    716: { 717: 'Yveltal. Life always returns.' }, 717: { 716: 'Xerneas. And death always follows.' }, 791: { 792: 'Lunala! The sun and moon meet at last.' }, 792: { 791: 'Solgaleo... the moon greets the sun.' }, 888: { 889: 'Brother! Raise your shield beside me— oh. You\'re the enemy.' }, 889: { 888: 'Sister... why do you point your sword at me?' } };
  const LS = {   // legendary manners: intro, at 75/50/25% HP, defeat, the explorer nearly down, their companions, after a big event
    regal: { intro: ['I am {name}, {title}. Kneel... or fall.', 'You stand before {title}. Choose your next breath wisely.'], hp75: ['A scratch. Nothing more.', 'You have some courage, {player}.'], hp50: ['Impressive... for a mortal.', 'You dare wound {title}?!'], hp25: ['This... cannot be!', 'I will NOT be humbled by you!'],
      defeat: ['...You have earned my respect, {player}.', 'Remember this day... you defeated {title}.'], playerLow: ['Bow now, and I may spare you.'], companion: ['You travel with {comp}? A worthy company.'], event: ['Even that power... did not frighten me.'] },
    fierce: { intro: ['RAAAH! I am {name}! FIGHT ME!', 'You smell like a challenge, {player}!'], hp75: ['Good! GOOD! More!', 'Is that all?!'], hp50: ['Now I\'m angry!', 'You hit hard... I hit HARDER!'], hp25: ['I won\'t fall! NOT TO YOU!', 'RAAAAAAGH!'],
      defeat: ['Heh... a good fight... the best...', 'Strong... you\'re... strong...'], playerLow: ['STAY DOWN!'], companion: ['Bring {comp} too! I\'ll take you ALL!'], event: ['HA! That was something! But I\'m still here!'] },
    cold: { intro: ['{name}. Remember the name. It will be the last you hear.', 'You are a curiosity, {player}. Nothing more.'], hp75: ['Predictable.', '...Noted.'], hp50: ['You are... more than I calculated.', 'Interesting. You bleed me.'], hp25: ['No. NO. This is not the outcome.', 'Impossible...!'],
      defeat: ['...So. This is what losing feels like.', 'You... are stronger than I was made to be.'], playerLow: ['Your heart is slowing. I can hear it.'], companion: ['{comp}? Your attachments make you weak.'], event: ['Such power... I want it.'] },
    playful: { intro: ['Hiii~ I\'m {name}! Let\'s play!', 'Ooh, a new toy! I mean... friend!'], hp75: ['Hehe, that tickled!', 'Ooh, you\'re fun!'], hp50: ['Hey! Ow! No fair~', 'Okay, now I\'m playing for real!'], hp25: ['Waaah! I don\'t wanna lose!', 'Time out! TIME OUT!'],
      defeat: ['Aww... you win! Play again sometime?', 'Hehe... you\'re really strong... I like you~'], playerLow: ['Tag, you\'re almost OUT~!'], companion: ['Ooh, {comp}! Can they play too?'], event: ['WHOA! Do it again! Do it again!'] },
    ancient: { intro: ['I have slept for a thousand years. You woke me, {player}.', 'I am {name}, {title}. I was old when the mountains were young.'], hp75: ['Time does not fear you.', 'A single grain of sand.'], hp50: ['The ages... stir.', 'You remind me of one I fought long ago.'], hp25: ['Is this... how eras end?', 'The world trembles... with me.'],
      defeat: ['A new age... begins with you.', 'Rest now, {name}... the young have won.'], playerLow: ['Return to the dust, little one.'], companion: ['{comp}... I have seen your kind before.'], event: ['That power... it shakes even the oldest bones.'] },
    serene: { intro: ['Peace, traveler. Why have you come to {title}?', 'I am {name}. I do not wish to fight... but I will.'], hp75: ['Please... we can stop this.', 'Calm yourself.'], hp50: ['You leave me no choice.', 'The wind grows cold.'], hp25: ['Is violence... truly your answer?', 'I... must not fall here.'],
      defeat: ['Go in peace... you\'ve proven your heart.', 'Thank you... for ending it gently.'], playerLow: ['Rest now. You need not suffer.'], companion: ['{comp} walks beside you... you are not alone. Good.'], event: ['What a terrible power... be careful with it.'] },
    wrathful: { intro: ['FALL BEFORE {name}!', 'The world will END, and you with it!'], hp75: ['INSECT!', 'You only make me ANGRIER!'], hp50: ['ENOUGH!', 'I WILL UNMAKE YOU!'], hp25: ['NO! NOOO!', 'MY WRATH... IS... ENDLESS!'],
      defeat: ['This... is not... the end...', 'The world... is spared... for now...'], playerLow: ['BREAK!'], companion: ['{comp} TOO?! I WILL CRUSH YOU BOTH!'], event: ['THAT is your power?! It is NOTHING to mine!'] },
    mechanical: { intro: ['TARGET ACQUIRED: {player}.', '...{name}... ONLINE.'], hp75: ['DAMAGE: MINIMAL.', '...RECALCULATING.'], hp50: ['WARNING. INTEGRITY: FIFTY PERCENT.', 'ERROR... ERROR...'], hp25: ['CRITICAL. CRITICAL.', 'SYSTEMS... FAILING...'],
      defeat: ['...SHUTTING... DOWN...', '...GOOD... BYE...'], playerLow: ['TARGET VITALS: CRITICAL.'], companion: ['ADDITIONAL UNIT DETECTED: {comp}.'], event: ['UNKNOWN ENERGY SIGNATURE. LOGGED.'] } };
  const LTITLE = { fire: 'Lord of Flames', water: 'Sovereign of the Seas', grass: 'Heart of the Forest', electric: 'Master of Storms', ice: 'Queen of Winter', fighting: 'Undefeated Champion', poison: 'Plague of the Swamp', ground: 'King of the Earth', flying: 'Ruler of the Skies',
    psychic: 'Mind Beyond Minds', bug: 'Monarch of the Swarm', rock: 'Mountain That Walks', ghost: 'Lord of the Dead', dragon: 'Ancient Dragon', dark: 'Shadow Sovereign', steel: 'Iron Titan', fairy: 'Moonlit Majesty', normal: 'the One Who Rules Here' };
  // legendaries and bosses speak in a grander voice (the regular bosses pick a manner from their own Nature)
  function isLegend(e) { const d = (E()?.DEX_BY || {})[Number(e && e.dex)] || {}; return !!(e && (LEG[Number(e.dex)] || e.legend || e.arceus || e.boss || d.rarity >= 5)); }
  function faceOf(style, sit) { if (sit === 'defeat') return 'sad'; if (sit === 'hp25') return 'pain'; return ({ regal: 'determined', fierce: 'shouting', cold: 'normal', playful: 'joyous', ancient: 'determined', serene: 'normal', wrathful: 'angry', mechanical: 'normal' })[style] || 'determined'; }
  function legendLine(e, sit, ctx) {
    const V = who(e), L = LEG[Number(e.dex)], style = L ? L[1] : (V.voice === 'polite' || V.voice === 'stoic' ? 'regal' : V.voice === 'cheerful' || V.voice === 'prankster' || V.voice === 'quirky' ? 'playful' : SOFT.has(V.voice) ? 'serene' : 'fierce');
    const ttl = L ? L[0] : LTITLE[V.type] || LTITLE.normal, X = explorer(); ctx = ctx || {};
    if (sit === 'intro') { const r = RIVAL[Number(e.dex)] && RIVAL[Number(e.dex)][X.dex]; if (r) return ['angry', r, 'anger']; if (Number(e.dex) === 493 && LEG[X.dex]) return ['determined', 'You... are one of my creations. Return to me, ' + X.name + '.', 'exclaim'];
      if (L && chance(0.5)) return [faceOf(style), L[2], 'exclaim']; }
    const list = (LS[style] || LS.regal)[sit] || ['...'];
    const t = pick(list).replace(/\{(\w+)\}/g, (_, k) => ({ name: V.name, title: ttl, player: X.name, comp: ctx.comp || 'friends' })[k] ?? '');
    return [faceOf(style, sit), t, sit === 'defeat' ? 'dots' : sit === 'hp25' ? 'sweat' : style === 'playful' ? 'note' : 'anger'];
  }
  function title(e) { const L = LEG[Number(e.dex)]; return L ? L[0] : LTITLE[(who(e) || {}).type] || ''; }
  const rivalOf = (a, b) => !!(RIVAL[Number(a)] && RIVAL[Number(a)][Number(b)]);
  const rivalLine = (a, b) => (RIVAL[Number(a)] && RIVAL[Number(a)][Number(b)]) || null;

  window.PS_VOICE = { isLegend, legendLine, title, rivalOf, rivalLine, explorer, who, line, bubble, reply, chat, relation, run: RUN, natures: NATURES, voices: Object.keys(VOICE), label: w => { const V = who(w); return V ? V.nature : ''; } };
})();
