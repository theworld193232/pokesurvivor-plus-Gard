// Bounded post-import hook: only replace the sprite inside the native HUD's left portrait frame.
const fs=require('node:fs'),crypto=require('node:crypto');
const START='try{const _0x5662cb=',END='}}catch(_0x43c0dc){}';
const HOOK='window.PS_PORTRAITS&&window.PS_PORTRAITS.drawHud(_0x4e43cf,_0x5de3f5,_0x9de174+2,_0x347475+2,_0x3f92fb-4)';
function patch(source){if(source.includes(HOOK))return source;const a=source.indexOf(START),b=source.indexOf(END,a);if(a<0||b<0||source.indexOf(START,a+1)>=0||b-a>2500)throw Error('HUD portrait hook: expected unique bounded sprite block');const inner=source.slice(a+'try{'.length,b+1);return source.slice(0,a)+'try{if(!('+HOOK+')){'+inner+'}}catch(_0x43c0dc){}'+source.slice(b+END.length);}
if(require.main===module){const file='js/app.min.js',s=fs.readFileSync(file,'utf8'),out=patch(s);fs.writeFileSync(file,out);fs.writeFileSync('docs/HUD-PORTRAIT-HOOK-v30.json',JSON.stringify({scope:'native HUD left portrait frame only',beforeSha256:crypto.createHash('sha256').update(s).digest('hex'),afterSha256:crypto.createHash('sha256').update(out).digest('hex'),hook:HOOK,fallback:'original animated sprite when portrait unavailable'},null,2)+'\n');console.log('HUD portrait hook installed');}
module.exports={patch,HOOK};
