const {test}=require('node:test'),assert=require('node:assert/strict');
const {preset,clone,inputPoint}=require('../src/brush');
const {enable}=require('../src/pressure-defaults');
test('all new brush and eraser channels respond to pressure while mouse remains full',()=>{
 for(const tool of ['brush','eraser']){
  const p=preset('new',tool,tool);for(const k of ['size','opacity','density'])assert.equal(p[k+'Dynamics'].enabled,true);
  const settings={inputMode:'automatic',globalCurve:[[0,0],[1,1]]};
  const low=inputPoint(0,0,{pointerType:'pen',pressure:.2},p,settings),high=inputPoint(0,0,{pointerType:'pen',pressure:.8},p,settings);
  for(const i of [2,3,4])assert.ok(low[i]<high[i]);
  assert.deepEqual(inputPoint(0,0,{pointerType:'mouse',pressure:.2},p,settings).slice(2,5),[1,1,1]);
 }
});
test('existing presets, reset defaults and inactive workspaces enable once and preserve curves and strengths',()=>{
 const p=preset('custom','custom','brush');for(const k of ['size','opacity','density'])p[k+'Dynamics']={enabled:false,min:.13,strength:.67,curve:[[0,0],[.4,.8],[1,1]]};p.defaults=clone(p);const settings={presets:[p],workspaces:[{id:'other',state:{presets:[clone(p)]}}]};
 assert.equal(enable(settings),true);for(const state of [settings,settings.workspaces[0].state])for(const target of [state.presets[0],state.presets[0].defaults])for(const k of ['size','opacity','density'])assert.deepEqual(target[k+'Dynamics'],{enabled:true,min:.13,strength:.67,curve:[[0,0],[.4,.8],[1,1]]});
 p.opacityDynamics.enabled=false;assert.equal(enable(settings),false);assert.equal(p.opacityDynamics.enabled,false);
});
