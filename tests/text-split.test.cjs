'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../src/brush'),W=require('../src/workspaces');
test('Legacy drawing workspaces release the text shortcut without losing existing drawing assignments',()=>{
 const q=B.upgrade({shortcuts:{text:'T',drawing:'F4',color:'F5'},lastTool:'text',textStyle:{fontFamily:'Batang',size:30,border:true}});
 W.upgradeWorkspaces(q);assert.equal(q.shortcuts.text,undefined);assert.equal(q.shortcuts.drawing,'F4');assert.equal(q.shortcuts.color,'F5');assert.equal(q.lastTool,'brush');
 W.captureCurrent(q);W.applyState(q,{...q.workspaces[0].state,shortcuts:{...q.shortcuts,text:'F6'},lastTool:'text'});W.upgradeWorkspaces(q);
 assert.equal(q.shortcuts.text,undefined);assert.equal(q.lastTool,'brush');assert.equal(q.textStyle.fontFamily,'Batang');
});
