'use strict';
// One-time preference change. Later manual opt-outs remain user choices.
function enable(settings){
 if(settings.pressureDefaultsVersion>=1)return false;
 for(const state of [settings,...(settings.workspaces||[]).map(w=>w.state)])for(const preset of state?.presets||[]){
  for(const target of [preset,preset.defaults].filter(Boolean))for(const kind of ['size','opacity','density']){
   const key=kind+'Dynamics';target[key]??={min:kind==='size'?.05:0,strength:1,curve:[[0,0],[1,1]]};target[key].enabled=true;
  }
 }
 settings.pressureDefaultsVersion=1;return true;
}
module.exports={enable};
