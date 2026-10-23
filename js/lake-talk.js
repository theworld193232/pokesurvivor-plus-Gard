/* LAKE GUARDIANS TALK — Uxie, Mesprit and Azelf speak to each other (portraits from assets/portraits/<dex>.png,
   PMD SpriteCollab sheets: 5x4 grid of 40 px faces in the standard emotion order).
   - A talk box with the speaker's portrait (Mystery Dungeon style) pops up bottom-left; emote bubbles pop over heads.
   - Played alone: lonely, sad and scared lines (they miss the other two).
   - Summoning one of the others: a reunion, hearts. Hurting one makes the others angry; a faint makes them cry out;
     coming back is a teary relief. They also cheer on each other's skills, react to bosses and to their Z-Move,
     and chat now and then while together. Their passives get lines too: Uxie confusing an attacker and her last
     stand (the others rush to cover her), Azelf's rising ATK & SPEED (everyone cheers at +50%), and Mesprit's
     5-second pulse (stun / confuse / drain / heal, with thanks from her sisters).
   Personalities: Uxie (knowledge) calm, logical, quietly protective · Mesprit (emotion) warm, teasing, empathic ·
   Azelf (willpower) brash, hot-headed, secretly the softest of the three. Needs js/lake-trio.js.
   Up to THREE talk boxes show at once, stacked just above one another (newest at the bottom), so wild Pokemon
   (js/wild-life.js) and companions can talk over each other like a real conversation. Pokemon without a local
   portrait sheet use their PMD SpriteCollab portrait (or, failing that, their own sprite).
   Everything here is drawn only on your own screen (never sent to the other players in co-op). */
(() => {
  'use strict';
  if (window.PS_LAKE_TALK_INSTALLED) return; window.PS_LAKE_TALK_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, TAU = Math.PI * 2;
  const NAME = { 480: 'Uxie', 481: 'Mesprit', 482: 'Azelf', 483: 'Dialga', 484: 'Palkia', 487: 'Giratina' }, COLOR = { 480: '#ffd84a', 481: '#ff8ad0', 482: '#5ab0ff', 483: '#8fd8ff', 484: '#ff9ad8', 487: '#ff4a5e' };
  // sheets that only have some faces: the closest one they do have
  const HAS = {}, BRAVE = ['normal', 'happy', 'joyous', 'inspired', 'determined', 'surprised'];
  const TRIO = [480, 481, 482];   // Dialga, Palkia and Giratina only speak as guests (js/creation-rift.js, js/giratina-void.js)
  const FACE = { normal: 0, happy: 1, pain: 2, angry: 3, worried: 4, sad: 5, crying: 6, shouting: 7, teary: 8, determined: 9, joyous: 10, inspired: 11, surprised: 12, dizzy: 13, sigh: 16, stunned: 17 };
  const CFG = { gap: 5, aloneEvery: [45, 75], chatEvery: [55, 90] };   // seconds between low-priority lines, lonely lines, banter

  // ================= lines: [face, text, emote] — {name} = the Pokemon being talked about =================
  const L = {
    480: {   // Uxie: calm, logical, quietly protective
      aloneStart: [['sigh', 'Mesprit... Azelf... I calculated a hundred ways this could go. In none of them was I alone.', 'dots'], ['sad', 'The lake is so quiet without the other two. I keep listening for their voices.', 'dots'], ['worried', 'Knowledge says I can survive alone. Something else says I shouldn\'t have to.', 'sweat']],
      alone: [['sad', '...I keep turning to explain things to Azelf. There\'s no one there.', 'dots'], ['sigh', 'Mesprit would be laughing at me for talking to myself by now.', 'dots'], ['worried', 'Too many of them. Too few of us. ...Too few of me.', 'sweat'], ['teary', 'If I close my eyes, it almost feels like the three of us are back at the lake.', 'tear'], ['sad', 'All the knowledge in the world, and I don\'t know how to stop missing them.', 'dots']],
      aloneHurt: [['worried', 'Th-this is... statistically very bad. I need them. I need them here.', 'sweat'], ['teary', 'Mesprit... Azelf... please, wherever you are... I can\'t hold this alone.', 'tear'], ['crying', 'I-I\'m scared... I know I shouldn\'t be, but I am...', 'tear']],
      bigHit: [['stunned', '...What... was that? My thoughts are scattered...', 'question'], ['dizzy', 'Ugh... I didn\'t foresee that. I always foresee things...', 'question']],
      call: { 481: [['joyous', 'Mesprit! I knew— no, I HOPED you\'d answer. Come here!', 'heart'], ['happy', 'Mesprit, I need you. ...And not only tactically.', 'heart']], 482: [['joyous', 'Azelf! Your timing is impulsive and perfect, as always!', 'heart'], ['happy', 'Azelf, stand with me. I\'ve calculated we\'re stronger together.', 'heart']] },
      arrive: { 481: [['happy', 'I felt your heart racing, Mesprit, so I came. Stay behind me.', 'heart'], ['determined', 'I\'m here. I\'ve analyzed every enemy. None of them will touch you.', 'note']], 482: [['happy', 'Azelf. Breathe. I\'m here now — let\'s think before we charge. ...A little.', 'heart'], ['determined', 'You called and I came. Point me at the problem.', 'note']] },
      again: [['teary', '...I\'m back. I\'m sorry I scared you. I won\'t let that happen twice.', 'tear'], ['determined', 'I\'ve reformed. And I\'ve learned exactly how they hit me. It won\'t work again.', 'exclaim']],
      angry: [['angry', 'You will NOT touch {name}. I have memorized your every move.', 'anger'], ['angry', 'Step away from {name}. That is the last calm thing I will say.', 'anger'], ['determined', 'Hurt {name} again and I\'ll make you forget your own name.', 'anger']],
      pain: [['pain', 'Ngh... I\'m fine. I\'m built for this.', 'sweat'], ['pain', 'That... was within my margin of error. Barely.', 'sweat']],
      faint: [['shouting', '{name}!! NO — get up, please get up!', 'exclaim'], ['crying', '{name}... I promised I\'d protect you...', 'tear']],
      cry: [['crying', '{name}... no... not again...', 'tear'], ['teary', 'Hold on, {name}... the lake will bring you back. It has to.', 'tear']],
      reunion: [['joyous', '{name}! You\'re back! Don\'t ever do that to me again!', 'heart'], ['teary', 'Welcome back, {name}. I may have... calculated the worst.', 'heart']],
      ownerLow: [['worried', '{name}, fall back behind me! I\'ll take the hits!', 'sweat'], ['determined', 'Stay close, {name}. Nothing reaches you while I\'m standing.', 'exclaim']],
      lostLast: [['sad', '...Alone again. I hate how familiar this silence feels.', 'dots']],
      boss: [['surprised', 'That one\'s... large. Recalculating. Recalculating!', 'exclaim'], ['surprised', 'Everyone, focus! That signature is far beyond the others!', 'exclaim']],
      z: [['inspired', 'Knowledge, emotion, willpower — together! Now!', 'spark'], ['inspired', 'This is the answer to every problem. All of us, at once!', 'spark']],
      skill: { cosmic: [['determined', 'Cosmic Power. Stand inside my shield.', 'note'], ['determined', 'Defense rising. Trust the numbers.', 'note']], shove: [['angry', 'Back. Away. From. My. Family.', 'anger']], recover: [['happy', 'Recovering... and sharing it with you all.', 'note']] },
      chat: [['happy', 'Mesprit says I think too much. I\'ve thought about it, and she\'s right.', 'note'], ['joyous', 'Being together like this... I could study this feeling forever.', 'heart'], ['inspired', 'Did you know we\'re stronger as three than the sum of us? I checked.', 'spark'], ['happy', 'Azelf, stop showing off. ...Fine. It was impressive.', 'heart']],
      level: [['inspired', 'We\'re growing. I can feel it in my mind.', 'spark']],
      // passives
      confuse: [['determined', 'You struck me. Now you can\'t tell friend from foe — go on, hit your friends.', 'spark'], ['happy', 'Confusion is just knowledge, rearranged badly.', 'note'], ['determined', 'Touch me again and you\'ll forget which side you\'re on.', 'spark'], ['sigh', 'I told you not to touch me. Now look at you.', 'dots']],
      stand: [['worried', 'I-I\'m at my limit! Falling back — Azelf! Mesprit!', 'sweat'], ['teary', 'I need my sisters... just for a moment... please...', 'tear'], ['worried', 'Shield up! I\'m retreating — someone cover me!', 'sweat']],
      standAlone: [['crying', 'Not here... not like this... Shield, hold! Please hold!', 'tear'], ['worried', 'Twenty seconds... I have twenty seconds to think of something...', 'sweat']],
      standEnd: [['determined', 'The shield\'s fading... I\'ve recovered enough. Back to work.', 'note'], ['sigh', 'Thank you... I\'m okay now. Mostly.', 'dots']],
      cheerConfuse: [['happy', 'Well done, Mesprit. Chaos, applied precisely.', 'note']],
      riseMax: [['inspired', 'Azelf\'s fire is in my veins. ...Figuratively. Mostly.', 'spark'], ['surprised', 'Fifty percent?! Azelf, that\'s — that\'s actually remarkable!', 'exclaim']],
      thanks: [['happy', 'Thank you, Mesprit. That was... very warm.', 'heart'], ['happy', 'Ah... much better. You always know exactly what I need.', 'heart']],
      tether: [['worried', 'Don\'t stray so far. Statistically, alone is how things go wrong.', 'sweat'], ['determined', 'Come back here. I\'m not losing track of you again.', 'exclaim'], ['sigh', 'I\'m pulling you back. Please stay where I can see you.', 'dots']],
      item: [['happy', 'I\'ll hold on to this. I already know three ways to use it.', 'note'], ['inspired', 'Fascinating. This should help.', 'spark']],
      mystic: { push: [['determined', 'Mystical Power. Five studs back — exactly as calculated.', 'spark'], ['determined', 'Shields up, sisters. And you lot — out of our space.', 'anger'], ['happy', 'Knowledge is a wall. Lean on it.', 'note']] } },
    481: {   // Mesprit: warm, teasing, empathic
      aloneStart: [['sad', 'Uxie? Azelf? ...It\'s so quiet. I can\'t feel your hearts from here.', 'dots'], ['teary', 'I\'m the Being of Emotion and right now all I feel is lonely.', 'tear'], ['worried', 'I don\'t like this. I don\'t like being the only one.', 'sweat']],
      alone: [['sigh', 'Uxie would have a plan by now. Azelf would have charged already. And me? I just miss them.', 'dots'], ['sad', 'Every heart out here is angry or scared. None of them are theirs.', 'dots'], ['teary', 'I keep making jokes and there\'s no one to laugh at them...', 'tear'], ['sad', 'Hey, lake... if you can hear me, send them back to me, okay?', 'dots'], ['worried', 'Being brave is Azelf\'s thing... I\'m just pretending really hard.', 'sweat']],
      aloneHurt: [['crying', 'It hurts... I want Uxie\'s shield... I want Azelf\'s yelling... I want them!', 'tear'], ['worried', 'N-no no no, I can\'t fall here, not alone, not like this...', 'sweat'], ['teary', 'Someone... anyone... please...', 'tear']],
      bigHit: [['stunned', 'Wh— everything\'s spinning~ That was NOT a nice feeling!', 'question'], ['dizzy', 'Ooh... I think I saw three of me. That\'s still not enough...', 'question']],
      call: { 480: [['joyous', 'Uxie!! I knew you\'d come! Okay, I hoped. Same thing~', 'heart'], ['happy', 'Uxie, come shield me and tell me I\'m being reckless. I missed it!', 'heart']], 482: [['joyous', 'Azelf! Get over here, you wonderful hothead!', 'heart'], ['happy', 'Azelf~! Come on, I saved you the biggest ones!', 'heart']] },
      arrive: { 480: [['happy', 'Did you miss me, Uxie? Your heart says yes. Your face says "logically, yes."', 'heart'], ['joyous', 'I\'m here! I could feel how lonely you were from across the lake~', 'heart']], 482: [['joyous', 'Azelf! I felt you calling — loud as ever~', 'heart'], ['happy', 'You were lonely. Don\'t argue, I can FEEL it. I\'m here now.', 'heart']] },
      again: [['teary', 'I\'m back... I\'m okay... I could feel you worrying the whole time.', 'tear'], ['happy', 'Miss me? Don\'t answer, I already know~', 'heart']],
      angry: [['angry', 'HEY! Nobody makes {name} cry but ME!', 'anger'], ['angry', 'You hurt {name}?! Oh, you are SO getting it now!', 'anger'], ['shouting', 'Get AWAY from {name}!', 'anger']],
      pain: [['pain', 'Ow ow ow! Okay, that one stung!', 'sweat'], ['pain', 'I\'m fine! Mostly! Kind of!', 'sweat']],
      faint: [['shouting', '{name}!!! No, no, no — look at me!', 'exclaim'], ['crying', '{name}... I can\'t feel your heart anymore...', 'tear']],
      cry: [['crying', '{name}... come back... please come back...', 'tear'], ['crying', 'This isn\'t fair... we just found each other again...', 'tear']],
      reunion: [['joyous', '{name}!! You\'re okay! Hug! Group hug! Now!', 'heart'], ['teary', 'Don\'t you EVER scare me like that again, {name}...', 'heart']],
      ownerLow: [['worried', '{name}, you\'re hurt! Hold on, I\'m coming!', 'sweat'], ['worried', 'Your heart is racing, {name}! Let me help!', 'sweat']],
      lostLast: [['crying', 'Alone again... I really hate this feeling...', 'tear']],
      boss: [['surprised', 'Eek! That one\'s HUGE! And so grumpy!', 'exclaim'], ['surprised', 'Whoa — that one\'s heart is pure rage!', 'exclaim']],
      z: [['inspired', 'All three hearts at once — here we gooo!', 'spark'], ['joyous', 'Together! This is my favorite feeling in the world!', 'spark']],
      skill: { wish: [['happy', 'Healing Wish! Everybody, feel better~', 'heart']], lullaby: [['happy', 'Shhh... sleep tight, meanies~', 'note']], protect: [['determined', 'Protect! I\'ve got you!', 'exclaim']] },
      chat: [['happy', 'Uxie, you\'re overthinking again. I can tell, your eyebrows are doing the thing.', 'note'], ['joyous', 'Azelf, admit it, you missed us. ...Your heart just said yes!', 'heart'], ['happy', 'This is nice. Fighting monsters, sure, but together~', 'heart'], ['inspired', 'Knowledge, emotion, willpower. We\'re basically unbeatable!', 'spark']],
      level: [['joyous', 'We leveled up! Celebration! Okay, celebrate later, fight now!', 'spark']],
      // passives
      pulse: { stun: [['happy', 'Freeze right there~!', 'note'], ['determined', 'Stay put, you!', 'exclaim'], ['happy', 'Hold still~ This won\'t hurt. Much.', 'note']],
        confuse: [['happy', 'Spin, spin, spin~ Which way is up?', 'note'], ['joyous', 'Now you don\'t know who your friends are~', 'note'], ['happy', 'Oopsie, did I scramble your heart?', 'heart']],
        drain: [['happy', 'Just a little piece of your heart, please~', 'heart'], ['determined', 'I\'ll take that, thank you!', 'note'], ['happy', 'Five percent each! Fair\'s fair~', 'note']],
        heal: [['happy', 'Everyone okay? Here, have some love~', 'heart'], ['joyous', 'Heal time! Feel my heart~', 'heart'], ['happy', 'There we go. All better~', 'heart']] },
      guardUxie: [['determined', 'Uxie! Over here, I\'ve got you!', 'exclaim'], ['worried', 'Get behind me, Uxie! Nobody touches you!', 'sweat']],
      cheerConfuse: [['joyous', 'Hehe, look at it go! Uxie made it dizzy~', 'note'], ['happy', 'Uxie! That one\'s punching its own friends!', 'note']],
      riseMax: [['joyous', 'I can feel Azelf\'s heart burning — it\'s contagious!', 'spark'], ['inspired', 'Fifty percent! Azelf, you\'re on FIRE~!', 'spark']],
      rise: [['happy', 'Ooh, I feel faster! Thanks, Azelf~', 'spark']],
      tether: [['angry', 'Hey! Where do you think you\'re going without us?!', 'anger'], ['happy', 'Nope~ Too far! Back you come!', 'heart'], ['worried', 'I can barely feel your heart from there — come closer!', 'sweat']],
      item: [['joyous', 'Ooh, shiny! Finders keepers~', 'heart'], ['happy', 'Look what I found! It\'s mine now~', 'note']],
      mystic: { boost: [['joyous', 'Mystical Power — and a little extra love for my sisters~!', 'heart'], ['inspired', 'Twenty percent more! Feel my heart, both of you!', 'spark']],
        fear: [['happy', 'Mystical Power! Now walk it back, meanies~', 'note'], ['determined', 'Shoo! Backwards, all of you!', 'exclaim'], ['happy', 'Feel that? That\'s how scary a big sister can be~', 'note']] } },
    482: {   // Azelf: brash, hot-headed, secretly the softest
      aloneStart: [['sigh', 'Tch. Fine. I don\'t need them. ...I don\'t.', 'dots'], ['sad', '...Uxie? Mesprit? Guys? This isn\'t funny.', 'dots'], ['worried', 'Since when is it this quiet? Since when am I this... small?', 'sweat']],
      alone: [['sad', 'I\'d never say it out loud, but... I miss them. A lot.', 'dots'], ['sigh', 'Uxie would tell me I\'m being reckless. Wish he were here to say it.', 'dots'], ['teary', 'Willpower, willpower... why does willpower feel so lonely?', 'tear'], ['angry', 'I can do this alone! I can! ...I just don\'t want to.', 'anger'], ['sad', 'Mesprit would know what I\'m feeling. I don\'t even know.', 'dots']],
      aloneHurt: [['crying', 'D-damn it... I\'m not scared! I\'m not... I just want them here...', 'tear'], ['worried', 'Too many... Uxie, where are you?! Mesprit?!', 'sweat'], ['teary', 'I can\'t lose here. I can\'t. ...Somebody...', 'tear']],
      bigHit: [['stunned', 'Gah—! Who— which one of you did that?!', 'question'], ['dizzy', 'The sky\'s spinning... no it\'s not, I\'M spinning...', 'question']],
      call: { 480: [['joyous', 'UXIE! Get over here, brainiac! I need a plan — and you!', 'heart'], ['happy', 'Uxie... yeah, I called. Don\'t make it weird.', 'heart']], 481: [['joyous', 'MESPRIT! Finally! Okay, okay, I\'m happy, don\'t read my heart!', 'heart'], ['happy', 'Mesprit, come on! It\'s way less fun without you yelling at me!', 'heart']] },
      arrive: { 480: [['determined', 'Uxie! I\'m here! Point at something and I\'ll blow it up!', 'exclaim'], ['happy', 'You called me? Ha! Knew you couldn\'t do it without me!', 'heart']], 481: [['happy', 'Mesprit! I\'m here, I\'m here! Who made you sad? I\'ll fight them.', 'heart'], ['joyous', 'Missed me? ...Yeah. Me too.', 'heart']] },
      again: [['determined', 'I\'m BACK! Did you think a little faint would stop ME?!', 'exclaim'], ['teary', '...Sorry. I got careless. I\'m here now. I\'m not leaving.', 'tear']],
      angry: [['angry', 'THAT\'S IT. Nobody hurts {name} and walks away!', 'anger'], ['shouting', 'HEY! That\'s MY {name}! You\'re DONE!', 'anger'], ['angry', 'You just made the worst mistake of your life. {name} is family.', 'anger']],
      pain: [['pain', 'Gh— that\'s nothing! NOTHING!', 'sweat'], ['pain', 'Ow! Okay — okay, that one actually hurt.', 'sweat']],
      faint: [['shouting', '{name}!!! NO! GET UP, YOU HEAR ME?!', 'exclaim'], ['crying', '{name}... no... this is my fault...', 'tear']],
      cry: [['crying', '{name}... I should\'ve been faster... I\'m sorry...', 'tear'], ['angry', 'You\'ll PAY for {name}. Every last one of you!', 'anger']],
      reunion: [['joyous', '{name}! You\'re back!! Don\'t— don\'t ever do that again, got it?!', 'heart'], ['teary', 'I wasn\'t crying. Shut up. Welcome back, {name}.', 'heart']],
      ownerLow: [['worried', '{name}! You\'re hurt — stay back, I\'ll handle it!', 'sweat'], ['angry', 'Who touched {name}?! I\'ll take them ALL down!', 'anger']],
      lostLast: [['sad', '...Alone again. I hate this. I HATE this.', 'dots']],
      boss: [['determined', 'A big one! Finally, something worth hitting!', 'exclaim'], ['surprised', 'Whoa — okay, that\'s bigger than I thought. Still hitting it!', 'exclaim']],
      z: [['inspired', 'TOGETHER! Let\'s show them what the three of us can do!', 'spark'], ['shouting', 'ALL OF US — FULL POWER!!', 'spark']],
      skill: { boost: [['shouting', 'PSYCHO BOOST! Take THAT!', 'exclaim']], plot: [['determined', 'Nasty Plot. Everyone, hit HARDER.', 'spark']], future: [['determined', 'Future Sight. In a second, that whole crowd\'s gone.', 'note']] },
      chat: [['happy', 'Uxie, I took out more than you. Don\'t count, just trust me.', 'note'], ['joyous', 'This is way better than fighting alone. ...Don\'t tell anyone I said that.', 'heart'], ['determined', 'Mesprit, watch this one! ...Did you see?! Did you see?!', 'exclaim'], ['happy', 'Being together like this... yeah. This is good.', 'heart']],
      level: [['determined', 'Stronger! We\'re getting STRONGER!', 'spark']],
      // passives
      rise: [['determined', 'Hah! I\'m just getting started!', 'spark'], ['happy', 'Feel that? That\'s willpower! It\'s yours too!', 'spark'], ['determined', 'Faster! Stronger! Keep up, you two!', 'spark'], ['joyous', 'Another one! Can you feel it?!', 'spark']],
      riseMax: [['shouting', 'FIFTY PERCENT! NOTHING can stop us now!!', 'spark'], ['inspired', 'MAX POWER! Sisters — let\'s END this!', 'spark']],
      guardUxie: [['angry', 'Uxie! Behind me, NOW! I\'ll handle these jerks!', 'anger'], ['determined', 'I\'ve got you, Uxie. Breathe. I\'m right here.', 'exclaim']],
      cheerConfuse: [['happy', 'Ha! It\'s hitting its own buddies! Nice one!', 'note'], ['joyous', 'Look at them fight each other! Do it again!', 'note']],
      thanks: [['happy', 'Th-thanks, Mesprit. I wasn\'t hurt. Much.', 'heart'], ['happy', '...Okay, that felt nice. Don\'t make it a thing.', 'heart']],
      tether: [['angry', 'HEY! Get back here! We stick TOGETHER!', 'anger'], ['determined', 'Too far! I\'m dragging you back, whether you like it or not!', 'exclaim'], ['sigh', 'Ugh, don\'t make me chase you. ...Fine, I\'ll pull you.', 'dots']],
      item: [['determined', 'Mine! ...What does it do? Doesn\'t matter, it\'s mine!', 'exclaim'], ['happy', 'Ha! Even stronger now!', 'spark']],
      mystic: { power: [['determined', 'Mystical Power! Faster, stronger — ALL of us!', 'spark'], ['shouting', 'Take my willpower, sisters! Hit HARDER!', 'spark'], ['joyous', 'You feel that?! That\'s us!', 'spark']] } } };

  // ================= talk boxes (three, stacked) =================
  const css = document.createElement('style');
  css.textContent = `
  .ps-talk{position:fixed;left:16px;bottom:132px;z-index:60;width:min(440px,calc(100vw - 32px));display:flex;gap:10px;align-items:stretch;pointer-events:none;
    padding:8px;border-radius:12px;background:linear-gradient(180deg,#2c519f,#1a3170);border:3px solid #f4f8ff;box-shadow:inset 0 0 0 2px #5b83d6,0 4px 0 rgba(0,0,0,.35);
    color:#fff;font:15px Pixelify,system-ui,sans-serif;opacity:0;transform:translateY(12px);transition:opacity .2s,transform .25s,bottom .25s,top .25s;transform-origin:left bottom}
  .ps-talk.on{opacity:1;transform:none}
  .ps-talk.old{opacity:.9;transform:scale(.95)}
  .ps-talk.wild{background:linear-gradient(180deg,#3d6b33,#24461f);box-shadow:inset 0 0 0 2px #7fb36a,0 4px 0 rgba(0,0,0,.35)}
  .ps-talk.legend{background:linear-gradient(180deg,#4a2a6a,#24103a);border-color:#ffe08a;box-shadow:inset 0 0 0 2px #d8b04a,0 0 14px rgba(255,210,110,.45),0 4px 0 rgba(0,0,0,.35)}
  .ps-talk.player{background:linear-gradient(180deg,#2c6a9f,#173e6e);box-shadow:inset 0 0 0 2px #7ac0ff,0 4px 0 rgba(0,0,0,.35)}
  .ps-talk.foe{background:linear-gradient(180deg,#8a2f35,#561a20);box-shadow:inset 0 0 0 2px #d06a6a,0 4px 0 rgba(0,0,0,.35)}
  .ps-talk .pf{position:relative;flex:none;width:80px;height:80px;border-radius:6px;border:3px solid #f4f8ff;box-shadow:0 0 0 2px #0b1838;background-repeat:no-repeat;background-size:400px 320px;image-rendering:pixelated;background-color:#0b1838;overflow:hidden}
  .ps-talk .pf canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;display:none}
  .ps-talk .tx{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
  .ps-talk .nm{font-weight:700;font-size:16px;margin-bottom:2px;text-shadow:2px 2px 0 #0b1838}
  .ps-talk .ln{line-height:1.3;text-shadow:1px 1px 0 #0b1838;min-height:2.6em}
  @media (max-width:700px),(max-height:520px){.ps-talk{bottom:auto;top:58px;font-size:13px;transform-origin:left top}.ps-talk .pf{width:60px;height:60px;background-size:300px 240px}}`;
  const slots = [0, 1, 2].map(i => { const el = document.createElement('div'); el.className = 'ps-talk'; el.id = i ? 'ps-lake-talk-' + (i + 1) : 'ps-lake-talk';
    el.innerHTML = '<div class="pf"><canvas width="80" height="80"></canvas></div><div class="tx"><div class="nm"></div><div class="ln"></div></div>';
    return { el, pf: el.querySelector('.pf'), cv: el.querySelector('canvas'), nm: el.querySelector('.nm'), ln: el.querySelector('.ln'), cur: null }; });
  const box = slots[0].el;
  const queue = []; let order = [], lastLow = -1e9, lastStart = -1e9, lastType = 0;   // order: the boxes on screen, newest first
  const LOCAL = new Set([480, 481, 482, 483, 484, 487]);
  const EMO = { normal: 'Normal', happy: 'Happy', pain: 'Pain', angry: 'Angry', worried: 'Worried', sad: 'Sad', crying: 'Crying', shouting: 'Shouting', teary: 'Teary-Eyed', determined: 'Determined', joyous: 'Joyous', inspired: 'Inspired', surprised: 'Surprised', dizzy: 'Dizzy', sigh: 'Sigh', stunned: 'Stunned' };
  const SC = (dex, e) => 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/' + String(dex).padStart(4, '0') + '/' + e + '.png';
  const known = {};   // portrait url -> true (loads) / false (missing) / null (checking)
  function probe(url) { if (url in known) return known[url]; known[url] = null; const i = new Image(); i.onload = () => { known[url] = true; }; i.onerror = () => { known[url] = false; }; i.src = url; return null; }
  function face(sl, it) {
    const dex = Number(it.dex), f = it.face, k = sl.pf.offsetWidth / 40 || 2; sl.cv.style.display = 'none'; sl.drawn = false;
    if (LOCAL.has(dex)) { let i = FACE[f] ?? 0; if (HAS[dex] && !HAS[dex].includes(i)) i = BRAVE.includes(f) ? HAS[dex][0] : HAS[dex][HAS[dex].length - 1];
      sl.pf.style.backgroundImage = 'url(assets/portraits/' + dex + '.png)'; sl.pf.style.backgroundSize = ''; sl.pf.style.backgroundPosition = -(i % 5) * 40 * k + 'px ' + -Math.floor(i / 5) * 40 * k + 'px'; return; }
    const uF = SC(dex, EMO[f] || 'Normal'), uN = SC(dex, 'Normal'); probe(uF); probe(uN);   // the emotion if it exists, Normal behind it
    sl.pf.style.backgroundImage = 'url(' + uF + '),url(' + uN + ')'; sl.pf.style.backgroundSize = '100% 100%,100% 100%'; sl.pf.style.backgroundPosition = '0 0,0 0';
  }
  function spriteFace(sl, it) {   // no portrait anywhere: the Pokemon's own sprite, zoomed in
    const N = E(); if (!N || sl.drawn) return; sl.drawn = true; try { const a = new N.Sprites.Animator(Number(it.dex), 1, !!it.shiny); const c = sl.cv.getContext('2d'); c.clearRect(0, 0, 80, 80); c.imageSmoothingEnabled = false;
      c.fillStyle = '#d8e8c0'; c.fillRect(0, 0, 80, 80); c.save(); c.translate(40, 70); c.scale(1.6, 1.6); a.draw(c, 0, 0); c.restore(); sl.cv.style.display = 'block'; setTimeout(() => { if (sl.cur && sl.cur.it === it) { sl.drawn = false; spriteFace(sl, it); } }, 400); } catch (_) {} }
  const recent = {};
  function pick(list) { if (!list || !list.length) return null; const key = list[0][1]; const last = recent[key]; let i = Math.floor(Math.random() * list.length); if (list.length > 1 && i === last) i = (i + 1) % list.length; recent[key] = i; return list[i]; }
  const busy = () => order.length > 0 || queue.length > 0;
  // say: dex speaks one of the lines; prio lines skip the gap and cut the queue
  function say(dex, list, o) {
    o = o || {}; const ln0 = pick(list); if (!ln0 || !NAME[dex]) return false; const now = clock();
    if (!o.prio && !o.follow && (busy() || now - lastLow < CFG.gap)) return false;   // follow: a reply chained to the line just queued
    if (!o.prio) lastLow = now;
    const item = { dex, face: ln0[0], text: ln0[1].replace(/\{name\}/g, o.name || ''), emote: ln0[2], delay: o.delay || 0, prio: !!o.prio };
    if (o.prio && queue.length > 2) queue.splice(0, queue.length - 2);
    if (o.front) queue.unshift(item); else queue.push(item); return true;   // front: urgent, it plays next
  }
  const clock = () => performance.now() / 1000;
  function layout() { const small = matchMedia('(max-width:700px),(max-height:520px)').matches;
    order.forEach((sl, i) => { const h = sl.el.offsetHeight || 100, off = i * (h + 6); if (small) { sl.el.style.top = 58 + off + 'px'; sl.el.style.bottom = 'auto'; } else { sl.el.style.bottom = 132 + off + 'px'; sl.el.style.top = 'auto'; } sl.el.classList.toggle('old', i > 0); }); }
  function end(sl) { sl.cur = null; sl.el.classList.remove('on', 'old'); order = order.filter(x => x !== sl); layout(); }
  function show(it) {
    let sl = slots.find(x => !x.cur); if (!sl) { sl = order[order.length - 1]; end(sl); }
    sl.cur = { it, t: 0, dur: it.dur || Math.max(2.8, Math.min(6, 1.6 + it.text.length * 0.045)) };
    sl.nm.textContent = it.name || NAME[it.dex] || ('#' + it.dex); sl.nm.style.color = it.color || COLOR[it.dex] || '#fff';
    sl.el.classList.toggle('wild', it.kind === 'wild' || it.kind === 'ally'); sl.el.classList.toggle('foe', it.kind === 'foe'); sl.el.classList.toggle('legend', it.kind === 'legend'); sl.el.classList.toggle('player', it.kind === 'player');
    face(sl, it); sl.ln.textContent = ''; order.unshift(sl); sl.el.classList.add('on'); layout();
    lastStart = clock(); lastType = it.text.length / 45;
    if (it.emote) { if (it.obj) emoteAt(it.obj, it.emote); else emote(it.dex, it.emote); }
  }
  function tickBox(dt) {
    for (const sl of order.slice()) { const c = sl.cur; c.t += dt; const n = Math.min(c.it.text.length, Math.floor(c.t * 45)); if (sl.ln.textContent.length !== n) sl.ln.textContent = c.it.text.slice(0, n);
      if (!LOCAL.has(Number(c.it.dex)) && known[SC(c.it.dex, 'Normal')] === false) spriteFace(sl, c.it);
      if (c.t >= c.dur) end(sl); }
    const nx = queue[0]; if (!nx) return; nx.delay -= dt;
    if (nx.delay <= 0 && clock() - lastStart >= lastType + 0.35 && (slots.some(x => !x.cur) || nx.prio)) show(queue.shift());   // the next line waits for the last one to finish typing
  }
  function drop(fn) { for (let i = queue.length - 1; i >= 0; i--) if (fn(queue[i])) queue.splice(i, 1); for (const sl of slots) if (sl.cur && fn(sl.cur.it)) end(sl); }   // e.g. lines from an area you just left
  function clearAll() { queue.length = 0; for (const sl of slots) if (sl.cur) end(sl); }

  // ================= emote bubbles (world space) =================
  const emotes = [];
  const places = {};   // guests (Dialga, Palkia): where their emotes pop up
  function where(dex) { if (places[dex]) return places[dex]; const p = E()?.Game?.player; if (p && Number(p.dex) === Number(dex)) return p; const s = window.PS_LAKE?._ally?.(dex); return s && !s.dead && s.spawnT >= 1.4 ? s : null; }
  function emote(dex, kind) { for (let i = emotes.length - 1; i >= 0; i--) if (emotes[i].dex === dex && !emotes[i].obj) emotes.splice(i, 1); emotes.push({ dex, kind, t: 0, life: 2.4, hearts: kind === 'heart' ? [0, 1, 2].map(i => ({ dx: (i - 1) * 9, d: i * 0.25 })) : null }); }
  function emoteAt(obj, kind, life) { if (!obj) return; for (let i = emotes.length - 1; i >= 0; i--) if (emotes[i].obj === obj) emotes.splice(i, 1); if (emotes.length > 14) emotes.shift(); emotes.push({ obj, kind, t: 0, life: life || 2.2, hearts: kind === 'heart' ? [0, 1, 2].map(i => ({ dx: (i - 1) * 9, d: i * 0.25 })) : null }); }
  function heartPath(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.4); ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35); }
  function drop(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s * 0.8, y, x, y + s * 0.55); ctx.quadraticCurveTo(x - s * 0.8, y, x, y - s); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - s * 0.25, y - s * 0.2, s * 0.2, s * 0.35); }
  function drawEmote(ctx, e, x, y) {
    const pop = Math.min(1, e.t / 0.15), fade = Math.min(1, (e.life - e.t) / 0.3), bob = Math.sin(e.t * 6) * 1.5;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, y + bob); ctx.scale(pop, pop);
    // bubble
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, -11); ctx.arcTo(13, -11, 13, 9, 6); ctx.arcTo(13, 9, -12, 9, 6); ctx.lineTo(3, 9); ctx.lineTo(-2, 15); ctx.lineTo(-3, 9); ctx.arcTo(-12, 9, -12, -11, 6); ctx.arcTo(-12, -11, 13, -11, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    const k = e.kind;
    if (k === 'heart') { heartPath(ctx, 0.5, 0, 8); ctx.fillStyle = '#ff4f86'; ctx.fill(); ctx.fillStyle = '#ffd0e0'; ctx.fillRect(-4, -4, 2, 2); }
    else if (k === 'anger') { ctx.strokeStyle = '#e8303a'; ctx.lineWidth = 2.5; for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2 + Math.PI / 4); ctx.beginPath(); ctx.moveTo(2, -6); ctx.quadraticCurveTo(2, -2, 6, -2); ctx.stroke(); ctx.restore(); } }
    else if (k === 'sweat') drop(ctx, 1, 0, 7, '#4aa8ff');
    else if (k === 'tear') { drop(ctx, -4, 1, 5, '#4aa8ff'); drop(ctx, 5, -1, 5, '#4aa8ff'); }
    else { ctx.fillStyle = k === 'exclaim' ? '#e8303a' : k === 'spark' ? '#f0b400' : k === 'note' ? '#7a4cff' : '#1a1030'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k === 'exclaim' ? '!' : k === 'question' ? '?' : k === 'note' ? '♪' : k === 'spark' ? '★' : '...', 0.5, k === 'dots' ? -2 : 0); }
    ctx.restore();
    if (e.hearts) for (const h of e.hearts) { const u = e.t - h.d; if (u <= 0 || u > 1.6) continue; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - u / 1.6); heartPath(ctx, x + h.dx + Math.sin(u * 5 + h.dx) * 4, y - 16 - u * 26, 4.5); ctx.fillStyle = '#ff6a9a'; ctx.fill(); ctx.restore(); }
  }
  function drawEmotes(ctx) { for (const e of emotes) { const w = e.obj ? (e.obj.dead || e.obj.gone ? null : e.obj) : where(e.dex); if (!w) continue; if (e.obj) { drawEmote(ctx, e, w.x + 12, w.y - (Number(w.bodyH) || 40) - 26 - (w.lift || 0)); continue; } const h = Number(w.bodyH) || 40; drawEmote(ctx, e, w.x + 14, w.psLake !== undefined || w.caster ? w.y - 78 : w.y - h - 30); } }   // allies: above their name label

  // ================= what they react to =================
  let runP = null, aloneT = 0, chatT = 0, lastHp = 0, low = false, bigCd = 0, bossCd = 0, lvl = 0, lostLastCd = 0;
  const seenBoss = new WeakSet();
  // only ever YOUR screen: the box, emotes and lines follow your own player and your own sisters, and nothing is sent over co-op
  const me = () => { const p = E()?.Game?.player; return p && !p.remote && TRIO.includes(Number(p.dex)) ? p : null; };
  const live = () => (window.PS_LAKE?.allies || []).filter(a => !a.dead && !a.spawning).map(a => a.dex);
  const party = () => { const p = me(); return p ? [Number(p.dex), ...live()] : []; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const scene = () => !!(window.PS_CREATION_RIFT?.active || window.PS_GIRATINA?.active);   // a cutscene owns the talk box
  function onLake(ev) {
    if (scene()) return;
    const d = ev.detail || {}, p = me(); if (!p) return; const P = Number(p.dex), dex = Number(d.dex);
    if (d.type === 'summon') { if (!d.again) say(P, L[P].call[dex], { prio: true }); }
    else if (d.type === 'arrive') {
      if (d.again) { say(dex, L[dex].again, { prio: true }); say(P, L[P].reunion, { prio: true, name: NAME[dex], delay: 0.4 }); }
      else { say(dex, L[dex].arrive[P], { prio: true, delay: 0.2 }); setTimeout(() => emote(P, 'heart'), 300); }
      aloneT = 0; }
    else if (d.type === 'hurt') { say(dex, L[dex].pain, { prio: true }); const others = party().filter(x => x !== dex); const by = others[Math.floor(Math.random() * others.length)]; if (by) say(by, L[by].angry, { prio: true, name: NAME[dex], delay: 0.3 }); }
    else if (d.type === 'faint') { const others = party().filter(x => x !== dex); others.forEach((by, i) => say(by, i === 0 ? L[by].faint : L[by].cry, { prio: true, name: NAME[dex], delay: i * 0.3 }));
      if (!live().filter(x => x !== dex).length && clock() > lostLastCd) { lostLastCd = clock() + 60; say(P, L[P].lostLast, { prio: true, delay: 0.5 }); } }
    else if (d.type === 'skill') { const S = L[dex] && L[dex].skill && L[dex].skill[d.skill]; if (S && Math.random() < 0.35) say(dex, S); }
    else if (d.type === 'confuse') {   // Uxie confused the Pokemon that hit her (or her own pulse)
      if (say(480, L[480].confuse) && Math.random() < 0.6) { const others = party().filter(x => x !== 480); const by = others[Math.floor(Math.random() * others.length)]; if (by) say(by, L[by].cheerConfuse, { delay: 0.2, follow: true }); } }
    else if (d.type === 'stand') {     // Uxie below 10%: untouchable, running to a sister
      const sis = party().filter(x => x !== 480);
      say(480, sis.length ? L[480].stand : L[480].standAlone, { prio: true });
      sis.forEach((by, i) => { if (L[by].guardUxie) say(by, L[by].guardUxie, { prio: true, delay: 0.3 + i * 0.3 }); }); }
    else if (d.type === 'standEnd') say(480, L[480].standEnd, { prio: true });
    else if (d.type === 'rise') {      // Azelf's ATK & SPEED stacks (shared with her sisters)
      if (d.max) { say(482, L[482].riseMax, { prio: true }); party().filter(x => x !== 482).forEach((by, i) => say(by, L[by].riseMax, { prio: true, delay: 0.3 + i * 0.3 })); }
      else if (Math.random() < 0.5) { if (say(482, L[482].rise) && Math.random() < 0.4 && party().includes(481)) say(481, L[481].rise, { delay: 0.2, follow: true }); } }
    else if (d.type === 'mesprit') {   // Mesprit's 5-second pulse
      if (Math.random() < 0.35 && say(481, L[481].pulse[d.kind]) && d.kind === 'heal') { const others = party().filter(x => x !== 481 && L[x].thanks); const by = others[Math.floor(Math.random() * others.length)]; if (by && Math.random() < 0.5) say(by, L[by].thanks, { delay: 0.2, follow: true }); } }
    else if (d.type === 'item') say(dex, L[dex] && L[dex].item);
    else if (d.type === 'tether') { const t = clock(); if (t - (onLake.tetherAt || -99) > 15) { onLake.tetherAt = t; say(dex, L[dex] && L[dex].tether, { prio: true, front: true }); for (const sl of order) if (sl.cur.it.dex !== dex) sl.cur.dur = Math.min(sl.cur.dur, sl.cur.t + 0.4); } }
    else if (d.type === 'mystical') {   // Mystical Power buffing the sisters
      const S = L[dex] && L[dex].mystic && L[dex].mystic[d.kind]; if (S && Math.random() < (d.kind === 'boost' || d.kind === 'fear' ? 0.5 : 0.35)) say(dex, S); }
    else if (d.type === 'z') { const all = party(); all.forEach((by, i) => say(by, L[by].z, { prio: true, delay: i * 0.25 })); }
  }
  addEventListener('ps-lake', onLake);
  function watch(dt) {
    const N = E(), g = N?.Game, p = me();
    if (!p || !g || g.state === 'over' || g.state === 'ui') { if (runP) { runP = null; clearAll(); emotes.length = 0; } return; }
    if (p !== runP) { runP = p; aloneT = 3; chatT = rnd(...CFG.chatEvery); lastHp = p.hp; low = false; lvl = p.level; bigCd = 0; bossCd = 0; clearAll(); }
    if (g.state !== 'playing' || scene()) { if (scene()) lastHp = p.hp; return; }
    const P = Number(p.dex), allies = live(), alone = !allies.length && !(window.PS_LAKE?.allies || []).some(a => a.spawning);
    // alone: lonely, sad, scared
    if (alone) { aloneT -= dt; if (aloneT <= 0) { say(P, runP.__lakeStarted ? L[P].alone : L[P].aloneStart, { prio: !runP.__lakeStarted }); runP.__lakeStarted = true; aloneT = rnd(...CFG.aloneEvery); } }
    else { chatT -= dt; if (chatT <= 0) { chatT = rnd(...CFG.chatEvery); const all = party(); const by = all[Math.floor(Math.random() * all.length)]; if (say(by, L[by].chat)) { const other = all.find(x => x !== by); if (other) setTimeout(() => emote(other, 'heart'), 900); } } }
    // your HP
    const f = p.hp / p.maxHp; bigCd -= dt; bossCd -= dt;
    if (lastHp - p.hp > p.maxHp * 0.22 && bigCd <= 0) { bigCd = 25; say(P, L[P].bigHit, { prio: true }); }
    if (!low && f < 0.35) { low = true; if (alone) say(P, L[P].aloneHurt, { prio: true }); else { const by = allies[Math.floor(Math.random() * allies.length)]; say(by, L[by].ownerLow, { prio: true, name: NAME[P] }); } }
    if (low && f > 0.6) low = false; lastHp = p.hp;
    // bosses
    if (bossCd <= 0) for (const e of N.EnemyMgr.all()) { if (!e || e.dead || !(e.boss || e.legend) || seenBoss.has(e)) continue; seenBoss.add(e); bossCd = 40; const all = party(); const by = all[Math.floor(Math.random() * all.length)]; say(by, L[by].boss, { prio: true }); break; }
    // level ups (with company)
    if (p.level > lvl) { lvl = p.level; if (!alone && Math.random() < 0.4) { const all = party(); const by = all[Math.floor(Math.random() * all.length)]; say(by, L[by].level); } }
  }
  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; try { watch(dt); tickBox(dt); for (let i = emotes.length - 1; i >= 0; i--) if ((emotes[i].t += dt) > emotes[i].life) emotes.splice(i, 1); } catch (e) { console.warn('[lake-talk]', e); } }
  let hooked = false;
  function hook() { const N = E(); if (hooked || !N || !N.Ult || !N.Ult.drawUnits) return; hooked = true; const du = N.Ult.drawUnits; N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { if (me() || Object.keys(places).length || emotes.some(e => e.obj)) drawEmotes(ctx); } catch (e) { console.warn('[lake-talk]', e); } }; }
  function init() { document.head.append(css); for (const sl of slots) document.body.append(sl.el); for (const d of [480, 481, 482, 483, 484, 487]) { const i = new Image(); i.src = 'assets/portraits/' + d + '.png'; } (function h() { hook(); if (!hooked) setTimeout(h, 200); })(); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  // a line from anyone else (js/digger-bros.js, js/wild-life.js): queued like the trio's, prio / front like say().
  // o.name / o.color / o.kind ('wild' | 'foe' | 'ally') / o.obj (the Pokemon the emote pops over) for Pokemon outside the NAME list
  function line(dex, f, text, em, o) { o = o || {}; const now = clock(); if (scene() && !o.scene) return false;
    if (!o.prio && !o.follow && (busy() || now - lastLow < (o.gap ?? CFG.gap))) return false; if (!o.prio) lastLow = now;
    const item = { dex, face: f, text, emote: em, delay: o.delay || 0, dur: o.dur, prio: !!o.prio, name: o.name, color: o.color, kind: o.kind, obj: o.obj, shiny: o.shiny };
    if (o.prio && queue.length > 4) queue.splice(0, queue.length - 4); if (o.front) queue.unshift(item); else queue.push(item); return true; }
  // a cutscene line: shown right away for a fixed time (clears whatever was waiting)
  function cut(dex, f, text, em, dur) { clearAll(); show({ dex, face: f, text, emote: em, dur }); }
  window.PS_LAKE_TALK = { cut, line, place: (dex, obj) => { if (obj) places[dex] = obj; else delete places[dex]; }, hide: clearAll, drop, lines: L, faces: FACE, say: (dex, situation, name) => say(Number(dex), (L[dex] || {})[situation], { prio: true, name }), emote, emoteAt, busy, cfg: CFG };
})();
