/* Story mode and Trainer systems are excluded from this build.
   The friend engine's optional story hooks receive an inert interface. */
(() => {const noop=()=>{};window.PSXAI.define('Story',{STAGES:['disabled'],stage:()=> 'disabled',stageN:()=>0,cam:null,tick:noop,reset:noop,drawScreen:noop,lockInput:()=>false,journal:()=>[],replay:noop,resetProgress:noop,onAction:noop,active:()=>false,busy:()=>false,blockEntry:()=>false,blockExit:()=>false,lights:noop});})();
