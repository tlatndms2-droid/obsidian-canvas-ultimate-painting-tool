const test=require('node:test'),assert=require('node:assert/strict');
const {install}=require('../src/extended-zoom');
test('Extended Canvas zoom preserves the world point under cursor, native rendering and cleanup',()=>{
 let frames=0,renders=0;const native=function(){frames++;};const c={requestFrame:native,viewportChanged:true,tZoom:7,zoom:1,scale:2,x:20,y:30,tx:20,ty:30,zoomCenter:{x:200,y:100},canvasRect:{width:1000,height:800},canvasEl:{style:{}},gridSpacing:20,backgroundPatternEl:{setAttrs(){}},wrapperEl:{removeClass(){},setCssProps(){}},menu:{render(){renders++;}},app:{workspace:{requestSaveLayout(){}}}};
 const remove=install({canvas:c,scheduleRender(){}});const before=[c.x+200/c.scale,c.y+100/c.scale];c.requestFrame();assert.equal(c.scale,16);assert.deepEqual([c.x+200/c.scale,c.y+100/c.scale],before);assert.equal(frames,1);assert.equal(renders,1);assert.equal(c.viewportChanged,false);assert.match(c.canvasEl.style.transform,/scale\(16\)/);
 c.tZoom=0;c.viewportChanged=true;c.requestFrame();assert.equal(frames,2);assert.equal(c.viewportChanged,true);remove();assert.equal(c.requestFrame,native);
});
