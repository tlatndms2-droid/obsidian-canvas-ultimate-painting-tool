const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const mod={exports:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/tool-shortcuts'),'utf8'),{module:mod,require:n=>n==='obsidian'?({Modal:class{}}):require('../src/'+n.slice(2))});
const S=mod.exports;
test('Individual shortcuts share preset storage and report collisions and allow editor key reassignment',()=>{
 const q={presets:[{id:'p',name:'펜',shortcut:''}],shortcuts:{drawing:'1',mix:'X',quick:'4'},toolShortcuts:{}};
 S.setKey(q,'shape:ellipse','F6');assert.equal(S.conflict(q,'preset:p','F6'),'타원에서 사용하는 키입니다.');
 S.setKey(q,'preset:p','F7');assert.equal(S.keyFor(q,'preset:p'),'F7');assert.ok(S.conflict(q,'shape:line','F7'));assert.equal(S.conflict(q,'shape:line','Ctrl+Z'),'');assert.ok(S.owners(q,'shape:line','Ctrl+Z').some(o=>o.name==='실행 취소'));assert.ok(S.conflict(q,'shape:line','4'));
 assert.equal(S.conflict(q,'shape:ellipse','F6'),'');assert.equal(S.keyOf({code:'KeyQ',ctrlKey:true,shiftKey:true}),'Ctrl+Shift+Q');
 S.setKey(q,'shape:ellipse','');assert.equal(S.keyFor(q,'shape:ellipse'),'');
});
test('Workspace import preserves individual shortcuts and explicit text border choice',()=>{
 const B=require('../src/brush'),W=require('../src/workspaces'),q=B.upgrade({});W.upgradeWorkspaces(q);
 assert.equal(q.textStyle.border,false);q.textStyle.border=true;W.upgradeWorkspaces(q);assert.equal(q.textStyle.border,true);
 q.toolShortcuts={'shape:ellipse':'F6'};q.presets[0].shortcut='F7';W.captureCurrent(q);
 const s=W.importWorkspaces({format:'canvas-drawing-workspace',version:1,workspace:q.workspaces[0]}).workspaces[0].state;
 assert.equal(s.toolShortcuts['shape:ellipse'],'F6');assert.equal(s.presets[0].shortcut,'F7');assert.equal(s.textStyle.border,true);
});
