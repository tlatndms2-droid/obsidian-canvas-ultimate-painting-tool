const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {DrawingStore,randomUUID}=require('../src/storage'),{upgradeLayers}=require('../src/layers');
const paper=()=>({enabled:false,preset:'plain',color:'#fffdf6',strength:30,size:100,image:''});
const m={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/drawing-spaces.js'),'utf8'),{module:m,require:n=>n==='./paper'?{defaults:paper}:require('../src/'+n.slice(2))});
async function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cdt-spaces-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const files=new Map(),view={file:{path:'A.canvas'}},ctx={view,filePath:'A.canvas',portalId:null,key:'A.canvas'};const plugin={settings:{historyLimit:50},sessions:new Map(),queueSave(){},store:new DrawingStore(dir),app:{plugins:{getPlugin:()=>({getCanvasSpace:()=>({...ctx})})},vault:{adapter:{exists:async p=>files.has(p),read:async p=>files.get(p),write:async(p,raw)=>files.set(p,raw)}}}};
 const spaces=new m.exports.DrawingSpaces(plugin),record=plugin.store.load(randomUUID(),'A.canvas');upgradeLayers(record.data);record.data.version=8;record.data.assets={};record.data.paper=paper();plugin.store.changed(record);plugin.store.flush(record);
 const s={view,file:view.file,canvas:{data:{canvasDrawing:{version:1,id:record.data.id}}},ready:true,record,rootDrawingRecord:null,engine:{dispose(){}},doc:{createElement(){throw Error('unexpected DOM creation')}},paper:{async loadImage(){}},layerUI:{solo:[],thumbs:new Map(),render(){}},raster:{hidden:false},finishStroke(){},showStatus(){},scheduleRender(){},protect(e){throw e}};plugin.sessions.set(view,s);await spaces.load();await spaces.attach(s,record);return{plugin,spaces,s,ctx,files};}
test('legacy root remains unchanged; portal and nested IDs survive reopening',async t=>{const f=await fixture(t),root=f.s.record;f.ctx.portalId='outer';f.ctx.key='A.canvas#uct-portal:outer';await f.spaces.sync(f.s);const outer=f.s.record;assert.notEqual(outer.data.id,root.data.id);f.ctx.portalId='inner';f.ctx.key='A.canvas#uct-portal:inner';await f.spaces.sync(f.s);assert.notEqual(f.s.record.data.id,outer.data.id);f.ctx.portalId=null;f.ctx.key='A.canvas';await f.spaces.sync(f.s);assert.equal(f.s.record,root);const reload=new m.exports.DrawingSpaces(f.plugin);await reload.load();assert.equal(reload.data.canvases['A.canvas'].portals.outer,outer.data.id);});
test('latest rapid transition wins and root metadata stays the canonical root ID',async t=>{const f=await fixture(t),root=f.s.record.data.id;f.ctx.portalId='one';f.ctx.key='A.canvas#uct-portal:one';f.spaces.sync(f.s);f.ctx.portalId='two';f.ctx.key='A.canvas#uct-portal:two';delete f.s.canvas.data.canvasDrawing;await f.spaces.sync(f.s);assert.equal(f.s.drawingSpaceKey,f.ctx.key);assert.equal(f.s.canvas.data.canvasDrawing.id,root);assert.equal(f.s.ready,true);assert.equal(f.s.raster.hidden,false);});
test('repeated refresh during an in-flight transition does not supersede its own work',async t=>{const f=await fixture(t);f.ctx.portalId='one';f.ctx.key='A.canvas#uct-portal:one';const first=f.spaces.sync(f.s),generation=f.s.spaceGeneration;f.spaces.sync(f.s);assert.equal(f.s.spaceGeneration,generation);await first;assert.equal(f.s.drawingSpaceKey,f.ctx.key);});
test('Canvas rename keeps portal IDs and loaded drawing ownership',async t=>{const f=await fixture(t);f.ctx.portalId='one';f.ctx.key='A.canvas#uct-portal:one';await f.spaces.sync(f.s);const id=f.s.record.data.id;f.s.file.path='renamed.canvas';await f.spaces.rename('A.canvas','renamed.canvas');assert.equal(f.spaces.data.canvases['renamed.canvas'].portals.one,id);assert.equal(f.spaces.data.canvases['A.canvas'],undefined);assert.equal(f.s.record.data.sourcePath,'renamed.canvas#uct-portal:one');assert.equal(f.s.drawingSpaceKey,'renamed.canvas#uct-portal:one');});
test('existing UCT show/session API switches spaces without new UCT events and restores its hook',async t=>{const f=await fixture(t),old=function(){return 'shown'},session={v:f.s.view,current:null},portal={show:old},uct={portal,session:()=>session};f.plugin.app.plugins.getPlugin=()=>uct;f.spaces.ensureBridge();session.current='legacy';assert.equal(portal.show(session),'shown');await f.s.spaceWork;assert.equal(f.s.drawingSpaceKey,'A.canvas#uct-portal:legacy');assert.equal(f.s.ready,true);f.spaces.destroy();assert.equal(portal.show,old);});

test('fresh Canvas reusing a path archives old root and portals before replacing the link',async t=>{
 const f=await fixture(t),old=f.spaces.data.canvases['A.canvas'];
 old.portals.saved=randomUUID();
 const next=randomUUID();
 await f.spaces.registerRoot('A.canvas',next,true);
 assert.equal(f.spaces.data.canvases['A.canvas'].root,next);
 assert.equal(Object.keys(f.spaces.data.canvases['A.canvas'].portals).length,0);
 const backup=[...f.files].find(([name])=>name.includes('.replaced-'));
 assert.ok(backup);
 assert.deepEqual(JSON.parse(backup[1]).canvases['A.canvas'],JSON.parse(JSON.stringify(old)));
 assert.ok(fs.existsSync(f.plugin.store.file(old.root)));
});
test('existing Canvas mismatch remains protected and cannot rewrite its space links',async t=>{
 const f=await fixture(t),old=f.spaces.data.canvases['A.canvas'];
 await assert.rejects(f.spaces.registerRoot('A.canvas',randomUUID()),/연결이 다릅니다/);
 assert.equal(f.spaces.data.canvases['A.canvas'],old);
});
test('failed backup prevents replacing old links',async t=>{
 const f=await fixture(t),old=f.spaces.data.canvases['A.canvas'];
 f.plugin.app.vault.adapter.write=async()=>{throw Error('disk unavailable')};
 await assert.rejects(f.spaces.registerRoot('A.canvas',randomUUID(),true),/disk unavailable/);
 assert.equal(f.spaces.data.canvases['A.canvas'],old);
});
