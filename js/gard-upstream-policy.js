/* Integration boundaries set before the new friend modules install. */
(() => {'use strict';const A=window.PSXAI;const rules={evolution:false,noGacha:false,powerRework:false,megaRework:true,totemTrials:false,storyContent:false,forestMusic:false,mansionMusic:false};
 function apply(){for(const [key,value]of Object.entries(rules)){A.DEFAULTS[key]=value;Object.defineProperty(A.cfg,key,{configurable:true,enumerable:true,get:()=>value,set:()=>{}});}}
 apply();const reset=A.resetCfg;A.resetCfg=function(...a){const result=reset.apply(this,a);apply();return result;};window.PS_GARD_UPSTREAM_POLICY={rules,apply};})();
