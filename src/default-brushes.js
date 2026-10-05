'use strict';
const {preset,clone}=require('./brush');
function install(settings,load=()=>require('./default-brush-pack')()){
 if(settings.defaultABRPackVersion>=1)return false;
 const brushes=load();
 for(const state of [settings,...(settings.workspaces||[]).map(w=>w.state)]){
  if(!Array.isArray(state?.presets))continue;
  state.library??=[];
  for(const item of brushes){
   const id='default-abr-'+item.asset.id;
   // Imported copies may have user names, shortcuts and materials. Keep them intact.
   const existing=state.presets.some(p=>p.id===id||p.tool==='brush'&&p.tips?.some(a=>a.id===item.asset.id));
   if(existing)continue;
   const p=preset(id,item.asset.name,'brush',{size:Math.min(80,item.size),spacing:item.spacing,tipType:'custom',tips:[clone(item.asset)],group:'ABR 질감'});
   p.defaults=clone(Object.fromEntries(Object.entries(p).filter(([k])=>!['id','name','tool','pinned','shortcut','defaults'].includes(k))));
   state.presets.push(p);
   if(!state.library.some(a=>a.id===item.asset.id))state.library.push(clone(item.asset));
  }
 }
 settings.defaultABRPackVersion=1;
 return true;
}
module.exports={install};
