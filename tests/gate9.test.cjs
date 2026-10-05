const {test}=require('node:test'),assert=require('node:assert/strict');
const {encode,decode,randomUUID}=require('../src/storage'),{makeLayer}=require('../src/layers'),{preset,upgrade}=require('../src/brush'),W=require('../src/workspaces');
test('Visible-layer pickup colors survive encoding and reject incomplete sample data',()=>{
 const id=randomUUID(),l=makeLayer(),stroke={...preset('p','test','brush'),id:randomUUID(),layerId:l.id,color:'#0000ff',mix:true,mixSource:'visible',points:[[0,0,1,1,1,0],[20,0,1,1,1,0]],mixSamples:[[255,0,0,255],[128,0,128,255]]};
 delete stroke.mixType; // Legacy v8 strokes predate explicit mixing methods.
 const d={format:'canvas-drawing',id,version:8,revision:1,sourcePath:'test.canvas',layers:[l],selectedLayers:[l.id],assets:{},strokes:[stroke]};
 assert.deepEqual(decode(encode(d),id).strokes[0].mixSamples,stroke.mixSamples);stroke.mixSamples.pop();assert.throws(()=>encode(d),/혼합/);
});
test('Revision retains compatible toolbar order, removes obsolete tools and preserves mix reference',()=>{
 const q=upgrade({color:'#ffffff',toolOrder:['eraser','brush','color']});W.upgradeWorkspaces(q);assert.deepEqual(q.toolOrder.slice(0,2),['eraser','brush']);assert.equal(q.toolOrder.includes('eyedropper'),false);assert.equal(q.shortcuts.color,'2');q.presets[0].mixSource='visible';W.captureCurrent(q);
 const out=W.importWorkspaces({format:'canvas-drawing-workspace',version:1,workspace:q.workspaces[0]});assert.equal(out.workspaces[0].state.presets[0].mixSource,'visible');
});

