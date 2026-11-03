'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope={module:{exports:{}},require:()=>({})};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/layer-ui'),'utf8'),scope);
const {LayerUI}=scope.module.exports;
test('thumbnail reuse invalidates for edits, live offsets, undo, images and replacement panels',()=>{
 let draws=0;const layer={id:'a',type:'layer',offset:{x:0,y:0},tiles:[]};
 const data={revision:1,strokes:[],layers:[layer],assets:{}};
 const engine={images:new Map(),leaf:()=>new Map(),thumbnail:()=>draws++};
 const s={record:{data},engine},ui=new LayerUI(s);ui.thumbs.set('a',{width:104,height:80});
 const changed=fn=>{const before=draws;fn();ui.refreshThumbnails();assert.equal(draws,before+1);ui.refreshThumbnails();assert.equal(draws,before+1);};
 ui.refreshThumbnails();for(let i=0;i<20;i++)ui.refreshThumbnails();assert.equal(draws,1);
 changed(()=>layer.offset.x++);changed(()=>layer.opacity=.5);changed(()=>layer.visible=false);
 changed(()=>data.strokes.push({points:[[0,0]]}));changed(()=>data.strokes[0].points.push([1,1]));
 changed(()=>data.strokes=[]);changed(()=>data.revision++);changed(()=>layer.tiles=[]);
 changed(()=>engine.images.set('ready',{}));changed(()=>engine.overrides=new Map());
 changed(()=>ui.thumbs.get('a').width=200);changed(()=>ui.thumbs.set('a',{width:104,height:80}));
 changed(()=>s.record.data={...data,strokes:[]});
});
