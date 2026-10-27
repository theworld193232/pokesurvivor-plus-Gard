/* Existing transformation routes shown in the collection. */
(() => {
 const routes={888:'Crowned Sword: after beating Act 3, hold the Rusted Sword and press Space.',889:'Crowned Shield: after beating Act 3, hold the Rusted Shield and press Space.',646:'After beating Act 3, select Black or White Kyurem, hold the matching DNA Splicers, then press Space.',720:'Hoopa Unbound: after beating Act 3, hold the Prison Bottle and press Space.',718:'Zygarde reaches Complete (100%) at level 40. Its form stays with that team member when switching.'};
 window.PS_FORM_HELP={controls(el,dex){const hint=routes[Number(dex)];if(!hint)return;const text=document.createElement('div');text.className='sub';text.textContent=hint;el.append(text);}};
})();
