'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function fixture(initial={}){
 const files=new Map(Object.entries(initial)),events=[];
 class Manager{constructor(app){this.app=app;}async onload(){this.data=await this.loadData();this.sessions=new Map();this.addCommand({id:'toggle-ink'});}persist(){return this.saveData(this.data);}}
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../markdown/integrated.js'),'utf8'),{module,require:()=>Manager,window:{setInterval:()=>1},console});
 const app={vault:{configDir:'.obsidian',adapter:{exists:async p=>files.has(p),read:async p=>files.get(p),write:async(p,v)=>files.set(p,v)}},plugins:{getPlugin:()=>null,enabledPlugins:new Set(),disablePluginAndSave:async()=>events.push('disable')},commands:{commands:{}},hotkeyManager:{customKeys:{},setHotkeys(id,keys){this.customKeys[id]=keys},save:async()=>{}}};
 const plugin={app,manifest:{id:'canvas-drawing-tool-bar',dir:'main'},register(){},registerEvent(){},registerInterval(){},registerEditorExtension(){},addCommand(c){app.commands.commands['canvas-drawing-tool-bar:'+c.id]=c;}};
 return{files,app,plugin,start:()=>module.exports.start(plugin)};
}
test('main-only install creates MD index and namespaced commands without addon',async()=>{const f=fixture();await f.start();assert.deepEqual(JSON.parse(f.files.get('main/markdown-data.json')).notes,{});assert.ok(f.app.commands.commands['canvas-drawing-tool-bar:md-toggle-ink']);});
test('legacy MD index is copied losslessly and never overwrites integrated drawings',async()=>{const source='.obsidian/plugins/ink-anchor-prototype/data.json',raw=JSON.stringify({notes:{'note.md':{drawingId:'kept',text:'한글'}}});const f=fixture({[source]:raw});await f.start();assert.equal(f.files.get(source),raw);assert.equal(f.files.get('main/markdown-migration-backup.json'),raw);assert.equal(f.plugin.markdown.data.notes['note.md'].drawingId,'kept');f.plugin.markdown.data.notes['new.md']={drawingId:'new'};await f.plugin.markdown.persist();await f.start();assert.equal(f.plugin.markdown.data.notes['new.md'].drawingId,'new');});
test('existing custom MD shortcut moves once without replacing an existing new binding',async()=>{const f=fixture();f.app.hotkeyManager.customKeys={'ink-anchor-prototype:toggle-ink':[{key:'F9',modifiers:[]}]};await f.start();assert.equal(f.app.hotkeyManager.customKeys['canvas-drawing-tool-bar:md-toggle-ink'][0].key,'F9');delete f.app.hotkeyManager.customKeys['canvas-drawing-tool-bar:md-toggle-ink'];await f.start();assert.equal(f.app.hotkeyManager.customKeys['canvas-drawing-tool-bar:md-toggle-ink'],undefined);});
test('malformed legacy index cannot silently replace drawings with an empty index',async()=>{const f=fixture({'.obsidian/plugins/ink-anchor-prototype/data.json':'{"notes":null}'});await assert.rejects(f.start());assert.equal(f.files.has('main/markdown-data.json'),false);});
