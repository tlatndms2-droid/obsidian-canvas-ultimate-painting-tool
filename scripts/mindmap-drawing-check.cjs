const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require('C:/Users/tlatn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),mind=path.resolve(root,'../obsidian advanced mindmap');
const vault='C:/Users/tlatn/Documents/Codex/Sandboxes/Canvas-Text-Split-Sandbox';
const out=path.join(root,'validation/mindmap-drawing');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const report=(name,value)=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(value,null,2));
const mode=process.argv[2]||'prepare';
(async()=>{
 const b=await chromium.connectOverCDP('http://127.0.0.1:9393'),p=b.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 assert.match(await p.title(),/Canvas-Text-Split-Sandbox/);
 assert.equal(await p.evaluate(()=>app.vault.adapter.basePath.replaceAll('\\','/')),vault);
 fs.mkdirSync(out,{recursive:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(mode==='prepare'){
  const dir=path.join(out,'baseline');assert.ok(!fs.existsSync(dir),'baseline already exists');fs.mkdirSync(dir);
  fs.cpSync(path.join(vault,'.obsidian'),path.join(dir,'.obsidian'),{recursive:true});
  const canvas=fs.readdirSync(vault).filter(f=>f.endsWith('.canvas'));for(const f of canvas)fs.copyFileSync(path.join(vault,f),path.join(dir,f));
  fs.copyFileSync(path.join(mind,'src/main.ts'),path.join(dir,'mindmap-main.ts'));
  fs.copyFileSync(path.join(root,'src/main.js'),path.join(dir,'drawing-main.js'));
  report('baseline',{title:await p.title(),canvas:canvas.map(f=>({file:f,sha256:hash(path.join(vault,f))})),source:{mindmap:hash(path.join(mind,'src/main.ts')),drawing:hash(path.join(root,'src/main.js'))}});
 }
 if(['prepare','install'].includes(mode)){
  await p.evaluate(async()=>{for(const id of ['canvas-mindmap','canvas-drawing-tool-bar'])await app.plugins.disablePlugin(id);});
  const installed=[];
  for(const[id,source]of [['canvas-mindmap',mind],['canvas-drawing-tool-bar',path.join(root,'dist')]]){
   const dest=path.join(vault,'.obsidian/plugins',id);fs.mkdirSync(dest,{recursive:true});
   for(const f of ['main.js','manifest.json','styles.css']){fs.copyFileSync(path.join(source,f),path.join(dest,f));assert.equal(hash(path.join(source,f)),hash(path.join(dest,f)));installed.push({id,file:f,sha256:hash(path.join(dest,f))});}
  }
  await p.evaluate(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('canvas-mindmap');await app.plugins.enablePluginAndSave('canvas-drawing-tool-bar');});
  report(mode,{installed,errors});
 }
 if(mode==='prepare'){
  await p.evaluate(async()=>{const name='드로잉 Mindmap 충돌 확인.canvas';if(app.vault.getAbstractFileByPath(name))throw Error('fixture already exists');const f=await app.vault.create(name,JSON.stringify({nodes:[{id:'a',type:'text',x:-300,y:-100,width:240,height:100,text:'드로잉 중 Alt로 선택되면 안 됩니다'},{id:'b',type:'text',x:130,y:100,width:240,height:100,text:'드로잉을 끄면 Mindmap 정상 작동'}],edges:[{id:'ab',fromNode:'a',fromSide:'right',toNode:'b',toSide:'left'}]}));await app.workspace.activeLeaf.openFile(f);});
 }
 await p.waitForFunction(()=>app.plugins.plugins['canvas-drawing-tool-bar']?.sessions.get(app.workspace.activeLeaf)?.ready);
 await p.evaluate(()=>{window.d=app.plugins.plugins['canvas-drawing-tool-bar'].sessions.get(app.workspace.activeLeaf);window.m=app.plugins.plugins['canvas-mindmap'];for(const n of d.canvas.nodes.values())if(n.isEditing)n.blur();d.canvas.wrapperEl.focus();});
 if(mode==='prepare'){
  await p.getByRole('button',{name:'Drawing 툴바 켜기',exact:true}).click();
  await p.evaluate(()=>{d.canvas.deselectAll();d.canvas.wrapperEl.focus();});await p.keyboard.press('Alt');
  const state=await p.evaluate(()=>({drawing:d.drawing,selected:[...d.canvas.selection].map(n=>n.id)}));assert.equal(state.drawing,true);assert.ok(state.selected.length,'must reproduce original Alt selection');report('reproduction',state);await p.screenshot({path:path.join(out,'before.png')});
  await p.evaluate(()=>{d.setMode(false);d.canvas.deselectAll();});
 }
 if(mode==='close'){
  await p.evaluate(async()=>{d.setMode(false);d.plugin.flush();await d.view.save();});
  report('before-restart',await p.evaluate(()=>({nodes:d.canvas.getData().nodes,edges:d.canvas.getData().edges,drawing:d.record.data})));
  await p.evaluate(()=>setTimeout(()=>window.close(),150));await p.waitForEvent('close');
 }
 if(mode==='validate'||mode==='restart'){
  const passed=[];
  const refs=async()=>{await p.waitForFunction(()=>app.plugins.plugins['canvas-drawing-tool-bar']?.sessions.get(app.workspace.activeLeaf)?.ready);await p.evaluate(()=>{window.d=app.plugins.plugins['canvas-drawing-tool-bar'].sessions.get(app.workspace.activeLeaf);window.m=app.plugins.plugins['canvas-mindmap'];for(const n of d.canvas.nodes.values())if(n.isEditing)n.blur();d.canvas.wrapperEl.focus();});};
  const cards=()=>p.evaluate(()=>({nodes:d.canvas.getData().nodes,edges:d.canvas.getData().edges,selected:[...d.canvas.selection].map(n=>n.id)}));
  if(mode==='restart'){
   const before=JSON.parse(fs.readFileSync(path.join(out,'before-restart.json')));const now=await cards();assert.deepEqual(now.nodes,before.nodes);assert.deepEqual(now.edges,before.edges);assert.deepEqual(await p.evaluate(()=>d.record.data),before.drawing);passed.push('saved cards, edges and drawing survive full restart');
  }
  for(const order of mode==='restart'?['restart']:['mindmap-first','drawing-first']){
   if(order==='drawing-first'){await p.evaluate(async()=>{await app.plugins.disablePlugin('canvas-mindmap');await app.plugins.enablePluginAndSave('canvas-mindmap');});await refs();}
   await p.evaluate(()=>{d.setMode(false);d.canvas.deselectAll();d.canvas.wrapperEl.focus();});await p.waitForTimeout(350);await p.keyboard.press('Alt');assert.equal((await cards()).selected.length,1);passed.push(order+': Alt selects normally outside drawing');
   await p.waitForTimeout(350);await p.evaluate(()=>{d.canvas.selectOnly(d.canvas.nodes.get('a'));d.setMode(true);d.canvas.wrapperEl.focus();});await p.waitForTimeout(400);
   const before=await cards(),viewport=await p.evaluate(()=>({x:d.canvas.x,y:d.canvas.y,z:d.canvas.zoom}));
   for(const key of ['Alt','Alt','Alt+ArrowRight','Control+ArrowRight','Tab','x','Enter','Shift+ArrowRight','Control+Shift+ArrowRight','Control+Shift+l','Alt+r','Alt+m','Alt+w','Numpad1'])await p.keyboard.press(key);
   for(const key of ['Control','Tab']){await p.keyboard.down(key);await p.waitForTimeout(600);await p.keyboard.up(key);}
   await p.waitForTimeout(400);assert.deepEqual(await cards(),before);assert.deepEqual(await p.evaluate(()=>({x:d.canvas.x,y:d.canvas.y,z:d.canvas.zoom})),viewport);
   assert.equal(await p.locator('.canvas-mindmap-menu,.cm-panel').count(),0);
   const commands=await p.evaluate(()=>Object.entries(app.commands.commands).filter(([id])=>id.startsWith('canvas-mindmap:')).map(([id,c])=>({id,checking:c.checkCallback?.(true),execution:c.checkCallback?.(false)})));
   assert.ok(commands.length>8);assert.ok(commands.every(c=>c.checking===false&&c.execution===false));assert.deepEqual(await cards(),before);
   passed.push(order+': Alt/Tab/X/navigation/holds and all registered Mindmap commands yield; card data, selection and viewport unchanged');
   // A key held before mode entry must not fire when released after mode exit.
   for(const key of ['Alt','Tab','Control']){await p.evaluate(()=>{d.setMode(false);d.canvas.wrapperEl.focus();});await p.keyboard.down(key);await p.evaluate(()=>{d.setMode(true);d.setMode(false);});await p.keyboard.up(key);await p.waitForTimeout(650);assert.deepEqual(await cards(),before);}
   passed.push(order+': held keys cancelled across rapid mode entry/exit');
   await p.evaluate(()=>{d.setMode(false);d.canvas.wrapperEl.focus();});await p.keyboard.down('Control');await p.waitForTimeout(600);assert.ok(await p.locator('.canvas-mindmap-menu').count());await p.evaluate(()=>d.setMode(true));assert.equal(await p.locator('.canvas-mindmap-menu,.cm-panel').count(),0);await p.keyboard.up('Control');assert.deepEqual(await cards(),before);passed.push(order+': an already-open Mindmap hold menu closes on drawing entry');
   await p.evaluate(()=>{d.setMode(true);d.selectTool('brush');d.colorUI.close();d.canvas.wrapperEl.focus();});
   const h=await p.locator('.workspace-leaf.mod-active .canvas-wrapper').boundingBox(),n=await p.evaluate(()=>d.record.data.strokes.length);
   await p.mouse.move(h.x+h.width*.52,h.y+h.height*.76);await p.mouse.down();await p.mouse.move(h.x+h.width*.58,h.y+h.height*.8,{steps:8});await p.mouse.up();assert.equal(await p.evaluate(()=>d.record.data.strokes.length),n+1);
   await p.keyboard.press('Control+z');assert.equal(await p.evaluate(()=>d.record.data.strokes.length),n);await p.keyboard.press('Control+Shift+z');assert.equal(await p.evaluate(()=>d.record.data.strokes.length),n+1);passed.push(order+': actual drawing input and drawing Undo/Redo');
   await p.evaluate(()=>d.selectTool('rectangle'));await p.keyboard.down('Alt');await p.waitForTimeout(120);await p.keyboard.up('Alt');assert.deepEqual(await cards(),before);
   await p.keyboard.press('t');assert.equal(await p.evaluate(()=>!d.drawing&&app.plugins.plugins['canvas-text-tool'].sessions.get(app.workspace.activeLeaf).textItems.armed),true);await p.keyboard.press('Escape');passed.push(order+': T still hands drawing to standalone text tool');
   await p.evaluate(()=>{d.setMode(false);d.canvas.selectOnly(d.canvas.nodes.get('a'));d.canvas.wrapperEl.focus();});await p.waitForTimeout(350);await p.keyboard.press('Alt+ArrowRight');assert.deepEqual((await cards()).selected,['b']);await p.waitForTimeout(350);
   const base=await cards();await p.keyboard.press('Control+ArrowDown');assert.equal((await cards()).nodes.length,base.nodes.length+1);await p.evaluate(()=>d.canvas.undo());assert.deepEqual((await cards()).nodes,base.nodes);assert.deepEqual((await cards()).edges,base.edges);passed.push(order+': Mindmap navigation/creation and Canvas Undo restored outside drawing');
  }
  if(mode==='validate'){
   await p.evaluate(async()=>{d.setMode(true);window.drawingLeaf=app.workspace.activeLeaf;const other=app.workspace.getLeaf('tab');await other.openFile(app.vault.getAbstractFileByPath('텍스트 분리 확인.canvas'));});
   await p.waitForFunction(()=>app.plugins.plugins['canvas-drawing-tool-bar'].sessions.get(app.workspace.activeLeaf)?.ready);
   await p.evaluate(()=>{const c=app.workspace.activeLeaf.view.canvas;for(const n of c.nodes.values())if(n.isEditing)n.blur();c.deselectAll();c.wrapperEl.focus();});await p.waitForTimeout(350);await p.keyboard.press('Alt');assert.equal(await p.evaluate(()=>app.workspace.activeLeaf.view.canvas.selection.size),1);assert.equal(await p.evaluate(()=>d.drawing),true);
   await p.evaluate(()=>{const other=app.workspace.activeLeaf;app.workspace.setActiveLeaf(drawingLeaf,{focus:true});other.detach();d.canvas.wrapperEl.focus();});await refs();assert.equal(await p.evaluate(()=>m.current()),null);passed.push('another Canvas keeps Mindmap enabled while the first Canvas is drawing');
  }
  await p.evaluate(()=>{d.setMode(true);d.selectTool('brush');d.colorUI.close();d.canvas.deselectAll();d.canvas.wrapperEl.focus();d.plugin.flush();});
  await p.screenshot({path:path.join(out,mode+'.png')});assert.deepEqual(errors,[]);report(mode,{versions:await p.evaluate(()=>({drawing:d.plugin.manifest.version,mindmap:m.manifest.version})),passed,errors});
 }
 if(mode==='final'){
  await p.evaluate(()=>{d.setMode(true);d.canvas.deselectAll();d.canvas.wrapperEl.focus();});
  for(const key of ['Alt','Alt','Alt+ArrowRight'])await p.keyboard.press(key);
  assert.equal(await p.evaluate(()=>d.canvas.selection.size),0);
  const installed=[];for(const[id,source]of [['canvas-mindmap',mind],['canvas-drawing-tool-bar',path.join(root,'dist')]])for(const f of ['main.js','manifest.json','styles.css']){const from=path.join(source,f),to=path.join(vault,'.obsidian/plugins',id,f);assert.equal(hash(from),hash(to));installed.push({id,file:f,sha256:hash(to)});}
  const baseline=JSON.parse(fs.readFileSync(path.join(out,'baseline.json')));const preserved=baseline.canvas.map(({file,sha256})=>({file,unchanged:hash(path.join(vault,file))===sha256}));assert.ok(preserved.every(f=>f.unchanged));
  await p.evaluate(async()=>{d.plugin.flush();await d.view.save();});
  await p.screenshot({path:path.join(out,'final.png')});assert.deepEqual(errors,[]);report('final',{title:await p.title(),emptyAltSelectionPreserved:true,installed,originalCanvases:preserved,errors});
 }
 assert.deepEqual(errors,[]);await b.close();console.log('PASS '+mode);
})().catch(e=>{console.error(e);process.exit(1)});
