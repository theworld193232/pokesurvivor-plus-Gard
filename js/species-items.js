/* The item catalog follows the selected Pokémon; shared items remain available. */
(() => {
 'use strict';const R=window.__PSX_REG__;
 function owner(id){const it=typeof id==='object'?id:R.Items.BY[id];if(!it)return null;if(Number(it.dex)>0&&R.DEX_BY[it.dex])return Number(it.dex);const key=it.psxStone||(/^mstone_/.test(it.id||'')?it.id.slice(7):'');return key?Number(key.split('_')[0])||null:null;}
 const allowed=(id,dex)=>!owner(id)||owner(id)===Number(dex);
 function selected(){const p=R.Game.player;return p&&R.Game.state!=='ui'&&R.Game.state!=='over'?p.dex:Number(R.DB.save.partner);}
 const list=dex=>R.Items.LIST.filter(it=>allowed(it,dex));
 function render(){const dex=selected(),body=document.getElementById('lex-body');if(!body)return;body.replaceChildren();const heading=document.createElement('h3');heading.textContent='Items · '+(R.DEX_BY[dex]?.name||'your Pokémon');body.append(heading);const grid=document.createElement('div');grid.className='lex-list';for(const it of list(dex)){const card=document.createElement('div');card.className='lex-card';card.dataset.item=it.id;const head=document.createElement('div');head.className='lex-h';head.innerHTML=R.Icons.html(it.id,40);const title=document.createElement('b');title.textContent=R.T?R.T(it.name):it.name;head.append(title);const description=document.createElement('p');description.textContent=R.T?R.T(it.desc):it.desc;card.append(head,description);grid.append(card);}body.append(grid);}
 addEventListener('click',e=>{const tab=e.target.closest?.('#lex-tabs [data-tab="items"]');if(!tab)return;e.preventDefault();e.stopImmediatePropagation();for(const t of document.querySelectorAll('#lex-tabs .tab'))t.classList.toggle('on',t===tab);render();},true);
 const open=R.LexiconUI.open;R.LexiconUI.open=function(...a){const result=open.apply(this,a);if(document.querySelector('#lex-tabs .tab.on')?.dataset.tab==='items')render();return result;};
 window.PS_SPECIES_ITEMS={owner,allowed,list,selected,render};
})();
