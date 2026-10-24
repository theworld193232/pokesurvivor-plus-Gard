/* Gard test panel extras; client gameplay controls only, no server role edits. */
(() => {setInterval(()=>{const panel=document.getElementById('ps-sz-test');if(!panel||panel.querySelector('[data-gard-mega]'))return;
 const b=document.createElement('button');b.dataset.gardMega='1';b.textContent='Test Mega / Primal';b.onclick=()=>{if(window.PS_GARD_TEST_ACCESS?.()){const test=window.PS_GARD_MEGA_TEST,list=test?.forms()||[];if(list.length)test.evolve(list[0].key);else window.__PSX_REG__.UI.toast('This Pokémon has no Mega or Primal form.',2000);}};panel.append(b);
},500);})();
