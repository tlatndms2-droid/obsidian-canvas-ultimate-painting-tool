const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../src/brush'),W=require('../src/workspaces');
test('Imported quick tools follow remapped preset IDs and erasers are not re-added after deletion',()=>{
 const s=B.upgrade({});W.upgradeWorkspaces(s);const p=s.presets.find(p=>p.tool==='brush');s.quickTools=['preset:'+p.id,'shape:ellipse','tool:move-layer'];s.textStyle.fontFamily='Batang';W.captureCurrent(s);
 const result=W.importWorkspaces({format:'canvas-drawing-workspace',version:1,workspace:s.workspaces[0]}).workspaces[0].state;
 assert.notEqual(result.presets[0].id,p.id);assert.equal(result.quickTools[0],'preset:'+result.presets[0].id);assert.equal(result.textStyle.fontFamily,'Batang');assert.equal(result.shortcuts.quick,'4');
 W.applyState(s,result);const n=s.presets.length;s.presets=s.presets.filter(p=>p.name!=='부드러운 지우개');B.upgrade(s);assert.equal(s.presets.length,n-1);
});
