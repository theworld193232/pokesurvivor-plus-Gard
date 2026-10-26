from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
p=root/'index.html';html=p.read_text();html=re.sub(r'(src="js/[^"?]+)\?[^"\n]+',r'\1?v=friend-gard-6',html);p.write_text(html)
mute='<script>HTMLMediaElement.prototype.play=function(){this.muted=true;return Promise.resolve()};for(const k of ["AudioContext","webkitAudioContext"]){const C=window[k];if(C)window[k]=class extends C{constructor(...a){super(...a);this.suspend()}resume(){return Promise.resolve()}}}</script>'
html=html.replace('<head>','<head>'+mute,1).replace('<script src="config.js"></script>','<script>window.PS_FIREBASE=null;</script>').replace('</body>','<script defer src="tests/port-fixture.js?v=7"></script></body>');(root/'.port-preview.html').write_text(html)
