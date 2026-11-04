const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../src/storage-commit.js'),'utf8');
function create(epoch=0){const m={exports:{}};vm.runInNewContext(src,{require:id=>id==='@electron/remote'?{require}:require(id),module:m,SharedArrayBuffer,Int32Array,Atomics});return m.exports.createCommitter(epoch);}
async function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cdt-commit-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const target=path.join(dir,'record'),temporary=target+'.tmp';fs.writeFileSync(target,'old');fs.writeFileSync(temporary,'new');return{target,temporary};}
test('commit verifies old content and replaces file off the calling thread',async t=>{const c=create(),f=await fixture(t);t.after(()=>c.close());assert.equal(await c.commit(f.temporary,f.target,'old',0),true);assert.equal(fs.readFileSync(f.target,'utf8'),'new');});
test('external modification preserves both files',async t=>{const c=create(),f=await fixture(t);t.after(()=>c.close());await assert.rejects(c.commit(f.temporary,f.target,'different',0));assert.equal(fs.readFileSync(f.target,'utf8'),'old');assert.equal(fs.readFileSync(f.temporary,'utf8'),'new');});
test('invalidation cancels stale commits without overwriting a checkpoint',async t=>{const c=create(),f=await fixture(t);t.after(()=>c.close());c.invalidate();assert.equal(await c.commit(f.temporary,f.target,'old',0),false);assert.equal(fs.readFileSync(f.target,'utf8'),'old');assert.equal(await c.commit(f.temporary,f.target,'old',1),true);});
test('worker created after an earlier checkpoint starts at that generation',async t=>{const c=create(3),f=await fixture(t);t.after(()=>c.close());assert.equal(await c.commit(f.temporary,f.target,'old',3),true);});
for(const method of ['checkpoint','close'])test(method+' recognizes a final commit before its Promise continuation',async t=>{
 const {DrawingStore,randomUUID}=require('../src/storage'),{AsyncDrawingStore}=require('../src/storage-async');
 const f=await fixture(t),base=new DrawingStore(path.dirname(f.target)),store=Object.assign(Object.create(AsyncDrawingStore.prototype),base,{generation:0,jobs:new Map(),worker:{terminate(){}},workerUrl:'',committer:{invalidate(){},close(){}}});
 const record=store.load(randomUUID(),'test.canvas');store.changed(record);assert.equal(DrawingStore.prototype.flush.call(store,record),true);
 // Disk rename is complete; the old asynchronous continuation has not cleared dirty.
 record.dirty=true;assert.equal(store[method](),true);assert.equal(record.dirty,false);assert.equal(record.error,null);
});
