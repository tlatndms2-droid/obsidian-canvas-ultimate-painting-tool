const test=require('node:test'),assert=require('node:assert/strict'),D=require('../src/tool-defaults'),M=require('../src/selection-mask');
test('Default reset restores saved settings deeply while preserving tool identity and registration metadata',()=>{
 const p={id:'p',name:'나의 펜',tool:'brush',group:'등록 그룹',pinned:true,shortcut:'F7',size:43,quick:['size'],texture:true,textureAsset:{id:'paper'},sizeDynamics:{curve:[[0,0],[1,1]]}};
 D.register(p);p.size=97;p.sizeDynamics.curve[0][1]=.7;p.quick.push('opacity');p.extraAfterRegistration=true;p.name='바꾼 이름';p.group='새 그룹';D.reset(p);
 assert.equal(p.size,43);assert.equal(p.name,'바꾼 이름');assert.equal(p.group,'새 그룹');assert.equal(p.shortcut,'F7');assert.equal(p.pinned,true);assert.equal(p.extraAfterRegistration,undefined);assert.equal(p.sizeDynamics.curve[0][1],0);assert.deepEqual(p.quick,['size']);
 p.textureAsset.id='other';assert.equal(p.defaults.textureAsset.id,'paper');
});
test('Ordered selection supports union, subtraction, re-addition and disjoint regions',()=>{
 const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 const regions=[{op:'add',points:rect(0,0,20,20)},{op:'add',points:rect(30,0,20,20)},{op:'subtract',points:rect(5,5,40,10)}];
 assert.equal(M.contains(regions,[2,10]),true);assert.equal(M.contains(regions,[10,10]),false);assert.equal(M.contains(regions,[25,2]),false);assert.equal(M.contains(regions,[35,2]),true);regions.push({op:'add',points:rect(8,8,4,4)});assert.equal(M.contains(regions,[10,10]),true);
});
test('Selected paint round-trips without flattening existing strokes and rejects malformed masks',()=>{
 const {encode,decode,randomUUID}=require('../src/storage'),{makeLayer}=require('../src/layers'),{preset}=require('../src/brush');
 const l=makeLayer(),st={...preset(randomUUID(),'펜','brush'),id:randomUUID(),layerId:l.id,color:'#ff0000',points:[[0,0,1,1,1,0]],selectionClip:[{op:'add',points:[[0,0],[30,0],[30,30],[0,30]]},{op:'subtract',points:[[10,10],[20,10],[20,20],[10,20]]}]};
 const d={format:'canvas-drawing',version:9,id:randomUUID(),revision:1,sourcePath:'test.canvas',layers:[l],selectedLayers:[l.id],assets:{},strokes:[st]};
 assert.deepEqual(decode(encode(d),d.id).strokes[0],st);d.version=8;assert.throws(()=>encode(d),/선택/);d.version=9;st.selectionClip[0].points[0][0]=Infinity;assert.throws(()=>encode(d),/선택/);
});
test('Modifier-only keys never switch tools; short and held tool keys have distinct outcomes',()=>{
 const fs=require('fs'),vm=require('vm');const m={exports:{}};let now=1000;
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/tool-shift'),'utf8'),{module:m,Date:{now:()=>now},require:()=>({keyOf:e=>e.code.startsWith('Key')?e.code.slice(3):'',keyFor:()=>''})});
 const q={shortcuts:{brush:'B',eraser:'E',shape:'A',selection:'W'},selectedBrush:'p',selectedEraser:'e',shapeStyle:{kind:'line'}};
 const s={drawing:true,tool:'brush',plugin:{settings:q},quickTools:{entries:()=>[{id:'p'}],opened:false,render(){}},selectTool(t){this.tool=t;},finishStroke(){},figures:{confirm(){}},workspaceUI:{applyLayout(){}}};
 const shift=new m.exports.ToolShift(s),event=code=>({code,preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(shift.down(event('ShiftLeft')),false);shift.down(event('KeyE'));assert.equal(s.tool,'eraser');now+=300;shift.up(event('KeyE'));assert.equal(s.tool,'brush');
 shift.down(event('KeyE'));now+=30;shift.up(event('KeyE'));assert.equal(s.tool,'eraser');
});
