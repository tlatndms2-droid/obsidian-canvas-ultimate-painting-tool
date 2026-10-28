'use strict';
const Manager=require('./manager');
const LEGACY='ink-anchor-prototype';
async function start(plugin){
 const app=plugin.app,adapter=app.vault.adapter;
 const directory=plugin.manifest.dir||`${app.vault.configDir}/plugins/${plugin.manifest.id}`;
 const destination=`${directory}/markdown-data.json`;
 // Finish the old writer before copying its index. Keep its files as a backup.
 const old=app.plugins.getPlugin(LEGACY);
 if(old){for(const s of old.sessions?.values()||[])s.settle(false);await old.drawing?.flush();await old.persist();}
 if(!await adapter.exists(destination)){
  const source=`${app.vault.configDir}/plugins/${LEGACY}/data.json`;
  const raw=await adapter.exists(source)?await adapter.read(source):JSON.stringify({notes:{}});
  const data=JSON.parse(raw);if(!data?.notes||typeof data.notes!=='object'||Array.isArray(data.notes))throw Error('기존 MD 필기 연결 정보가 올바르지 않습니다.');
  await adapter.write(`${directory}/markdown-migration-backup.json`,raw);
  await adapter.write(destination,raw);
 }
 if(app.plugins.enabledPlugins.has(LEGACY))await app.plugins.disablePluginAndSave(LEGACY);
 const manager=new Manager(app,plugin.manifest);
 manager.integratedDrawing=plugin;
 manager.loadData=async()=>JSON.parse(await adapter.read(destination));
 manager.saveData=data=>adapter.write(destination,JSON.stringify(data,null,2));
 for(const method of ['register','registerEvent','registerInterval','registerEditorExtension'])manager[method]=plugin[method].bind(plugin);
 manager.addCommand=command=>plugin.addCommand({...command,id:'md-'+command.id,name:'MD · '+command.name});
 plugin.markdown=manager;
 await manager.onload();
 if(!manager.data.integrationHotkeysMigrated){
  const hotkeys=app.hotkeyManager;
  for(const [id,keys] of Object.entries(hotkeys.customKeys||{})){
   if(!id.startsWith(LEGACY+':'))continue;
   const target=plugin.manifest.id+':md-'+id.slice(LEGACY.length+1);
   if(app.commands.commands[target]&&!Object.hasOwn(hotkeys.customKeys,target))hotkeys.setHotkeys(target,keys);
  }
  await hotkeys.save();
  manager.data.integrationHotkeysMigrated=true;await manager.persist();
 }
 // A user re-enabling the obsolete addon must not create a second input owner.
 let disabling=false;
 plugin.registerInterval(window.setInterval(async()=>{
  if(disabling||!app.plugins.getPlugin(LEGACY))return;
  disabling=true;try{await app.plugins.disablePluginAndSave(LEGACY);}finally{disabling=false;}
 },500));
 return manager;
}
function stop(plugin){const m=plugin.markdown;if(!m)return;m.stopping=true;for(const s of m.sessions.values())s.destroy();m.sessions.clear();m.persist().catch(console.error);}
module.exports={start,stop};
