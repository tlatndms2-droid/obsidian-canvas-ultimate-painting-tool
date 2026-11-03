'use strict';
function clearDrawingCommand(plugin){return{id:'clear-drawing',name:'드로잉 전체 지우기',checkCallback:checking=>{
 const leaf=plugin.app.workspace.activeLeaf,s=plugin.sessions.get(leaf)||plugin.markdown?.sessions.get(leaf);
 if(!s?.ready||s.disposed||s.file!==leaf?.view.file)return false;
 if(!checking)s.layerUI.confirmClearAll();return true;
}};}
async function migrateClearShortcut(plugin){
 const h=plugin.app.hotkeyManager,old=plugin.manifest.id+':md-clear-drawing',id=plugin.manifest.id+':clear-drawing';
 if(!Object.hasOwn(h.customKeys||{},old))return;
 const keys=[...(h.customKeys[id]||[])];for(const key of h.customKeys[old]||[])if(!keys.some(k=>k.key===key.key&&JSON.stringify([...k.modifiers].sort())===JSON.stringify([...key.modifiers].sort())))keys.push(key);
 h.setHotkeys(id,keys);delete h.customKeys[old];await h.save();
}
module.exports={clearDrawingCommand,migrateClearShortcut};
