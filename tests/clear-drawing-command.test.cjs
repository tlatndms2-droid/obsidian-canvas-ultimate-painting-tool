const {test}=require('node:test'),assert=require('node:assert/strict');
const {clearDrawingCommand,migrateClearShortcut}=require('../src/clear-drawing-command');
test('one command targets only the active ready document in either mode',()=>{
 const c={view:{file:{path:'a.canvas'}}},m={view:{file:{path:'b.md'}}};let canvas=0,md=0;
 const cs={file:c.view.file,ready:true,drawing:false,layerUI:{confirmClearAll(){canvas++}}},ms={file:m.view.file,ready:true,drawing:false,layerUI:{confirmClearAll(){md++}}};
 const p={app:{workspace:{activeLeaf:c}},sessions:new Map([[c,cs]]),markdown:{sessions:new Map([[m,ms]])}};
 const cmd=clearDrawingCommand(p);assert.equal(cmd.checkCallback(true),true);assert.equal(canvas,0);
 cmd.checkCallback(false);assert.equal(canvas,1);assert.equal(md,0);
 p.app.workspace.activeLeaf=m;cmd.checkCallback(false);assert.equal(md,1);ms.drawing=true;cmd.checkCallback(false);assert.equal(md,2);
 ms.ready=false;assert.equal(cmd.checkCallback(false),false);ms.ready=true;m.view.file={path:'other.md'};assert.equal(cmd.checkCallback(false),false);
 p.app.workspace.activeLeaf={view:{}};assert.equal(cmd.checkCallback(false),false);assert.equal(canvas,1);assert.equal(md,2);
});
test('merging commands retains both custom shortcuts without duplicate keys',async()=>{
 const a={key:'F8',modifiers:[]},b={key:'Q',modifiers:['Shift']};let saves=0;
 const h={customKeys:{'p:clear-drawing':[a],'p:md-clear-drawing':[a,b]},setHotkeys(id,keys){this.customKeys[id]=keys},async save(){saves++}};
 await migrateClearShortcut({manifest:{id:'p'},app:{hotkeyManager:h}});assert.deepEqual(h.customKeys['p:clear-drawing'],[a,b]);assert.equal(h.customKeys['p:md-clear-drawing'],undefined);
 await migrateClearShortcut({manifest:{id:'p'},app:{hotkeyManager:h}});assert.equal(saves,1);
});
