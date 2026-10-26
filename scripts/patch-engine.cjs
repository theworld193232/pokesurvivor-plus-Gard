// Reproducible, bounded hooks into the supplied friend's engine. The original
// obfuscated source is retained; decoded text is used only to locate insertions.
const fs=require('fs');const raw=fs.readFileSync('/private/tmp/friend-base-engine.js','utf8');const decoded=fs.readFileSync('/private/tmp/friend-readable.js','utf8');const map=JSON.parse(fs.readFileSync('/private/tmp/friend-decode-map.json','utf8'));const patches=[];
function offset(i){let lo=0,hi=map.length;while(lo<hi){const m=(lo+hi)>>1;if(map[m][3]<=i)lo=m+1;else hi=m;}if(lo<map.length&&map[lo][2]<i&&i<map[lo][3])throw Error('endpoint inside decoded string');return lo?i-(map[lo-1][3]-map[lo-1][1]):i;}
function replace(needle,out){const i=decoded.indexOf(needle);if(i<0||decoded.indexOf(needle,i+1)>=0)throw Error('nonunique hook: '+needle.slice(0,100));patches.push({a:offset(i),b:offset(i+needle.length),out});}
function insertBefore(needle,code){replace(needle,code+raw.slice(offset(decoded.indexOf(needle)),offset(decoded.indexOf(needle)+needle.length)));}
insertBefore("switch(_0x2c869d['kind']){case'projectile':", "if(_0x2c869d.psCast&&window.PS_CAST){window.PS_CAST(_0xb44b33,_0x2c869d,_0x490a79,_0x9b4e06);return;}");
replace("function _0x577f93(_0x2257c3,_0x4e3705){return _0x4a5217['Types']['mult'](_0x2257c3,_0x4e3705['types'])*_0x4a5217['Weather']['mult'](_0x2257c3);}","function _0x577f93(_0x2257c3,_0x4e3705,_psMove){return _0x4a5217.Types.mult(_0x2257c3,_0x4e3705.types)*_0x4a5217.Weather.mult(_0x2257c3)*(window.PS_HOOKS?.deal?.(_0x2257c3,_0x4e3705,_psMove)??1);}");
replace("_0x577f93(_0x55a47c['type'],_0xa3209b)","_0x577f93(_0x55a47c.type,_0xa3209b,_0x55a47c)");
insertBefore("const _0x3afce0=Math['hypot'](_0x31da16,_0x1ffcbf);", "if(window.PS_TERRAIN){const t=window.PS_TERRAIN(_0x31da16,_0x1ffcbf,_0x12414e);if(t!=null)return t;}");
insertBefore("if(_0x21ff63<_0x471ffd()+0x2){", "if(window.PS_PROP_AT&&_0x21ff63>=_0x471ffd()+2){const kind=window.PS_PROP_AT(_0x2f1da9,_0x387290,_0x5f0bd6);if(kind!==undefined){if(kind){const q=_0xbedf93(kind,_0x2f1da9,_0x387290);_0x241ac0.props.push(q);if(q.solid){_0x241ac0.propAt.set(_0x2f1da9+','+_0x387290,q);_0x241ac0.pa[_0x3ce674*_0x5737f6+_0x2a8df8]=q;}}continue;}}");
replace("'orb'===_0x21af98['kind']?_0x23f162(_0x33f3ff,_0x21af98,!0x1)","'orb'===_0x21af98['kind']?((window.PS_ZCAST&&window.PS_ZCAST(_0x33f3ff,_0x21af98))||_0x23f162(_0x33f3ff,_0x21af98,!0x1))");
insertBefore("_0x4a5217['Judgment']['cinematic']||_0x4a5217['HUD']['draw'](_0x10a5c4,_0x17dd43,_0x28dec2,_0x621497,_0x5778e7)","if(window.PS_PRE_HUD)window.PS_PRE_HUD(_0x10a5c4,_0x17dd43,_0x28dec2);");
replace("_0x4a5217['Updater']['init']()",'void 0 /* local merged build: no automatic upstream reload */');
replace("Math['min'](_0x121788['SPD_CAP'],this['baseSpd']*", "Math['min'](_0x121788['SPD_CAP'],this['baseSpd']*(window.PS_HOOKS?.spd?.(this)??1)*");
replace("case'melee':!function(_0x145c30,_0x1d6766)", "case'melee':window.PS_HOOKS?.melee?.(_0xb44b33,_0x2c869d,_0x9b4e06),!function(_0x145c30,_0x1d6766)");
insertBefore("let _0x551cbe=null;if(_0x36b7eb)", "_0x4b23fe*=window.PS_HOOKS?.take?.(_0x36b7eb,this,_0x4b23fe)??1;if(_0x4b23fe<=0)return;");
insertBefore("this['hp']<=0x0&&this['lives']>0x0", "(this.hp<=0&&!(this.lives>0)&&window.PS_LASTSTAND&&window.PS_LASTSTAND(this)),");
replace("function _0x97def9(_0x40c84b,_0x2cfe75){const _0x23d02c=a0_0x617a;return _0x4a5217[\"DEX\"][\"filter\"](_0x4e3b89=>_0x3a2bc6(_0x4e3b89,_0x2cfe75)&&_0x4e3b89['rarity']===_0x40c84b);}","function _0x97def9(_0x40c84b,_0x2cfe75){const pool=_0x4a5217.DEX.filter(d=>_0x3a2bc6(d,_0x2cfe75)&&d.rarity===_0x40c84b);return window.PS_GACHA_POOL?window.PS_GACHA_POOL(pool,_0x40c84b,_0x2cfe75):pool;}");
replace("_0x592667+=_0x136529", "_0x592667+=_0x136529+(window.__psTA=(window.PS_TIME_ADD?window.PS_TIME_ADD(_0x136529):0))");
replace("_0x1e651e+=_0x136529", "_0x1e651e+=_0x136529+(window.__psTA||0),window.__psTA=0");
replace("return{'tick':function(_0x523794,_0x26127f,_0x4c6640)","return{hoopaCast:_0x598ba4,'tick':function(_0x523794,_0x26127f,_0x4c6640)");
insertBefore("'trapEffect':function(_0x4c9907)","hoopaActivateAltar:_0x254147,");
let out=raw;patches.sort((a,b)=>b.a-a.a);for(const p of patches)out=out.slice(0,p.a)+p.out+out.slice(p.b);out=require('./patch-hud-portrait.cjs').patch(out);fs.writeFileSync('js/app.min.js',out);fs.writeFileSync('docs/ENGINE_HOOKS.json',JSON.stringify(patches.map(p=>({offset:p.a,removed:p.b-p.a,added:p.out})),null,2));console.log('Applied',patches.length,'engine hooks');
