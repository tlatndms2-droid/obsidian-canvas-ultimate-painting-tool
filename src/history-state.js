'use strict';
// Only settled strokes/assets are shared. Mutable layer metadata is copied.
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
function seal(data){for(const s of data.strokes)freeze(s);for(const a of Object.values(data.assets||{}))freeze(a);for(const l of data.layers||[])freeze(l.tiles);}
function snapshot(data){return {assets:{...Object.fromEntries(Object.entries(data.assets||{}).map(([k,a])=>[k,Object.isFrozen(a)?a:freeze(clone(a))]))},strokes:data.strokes.map(s=>Object.isFrozen(s)?s:freeze(clone(s))),layers:data.layers?.map(l=>({...clone({...l,tiles:undefined}),tiles:Object.isFrozen(l.tiles)?l.tiles:freeze(clone(l.tiles||[]))})),selectedLayers:[...(data.selectedLayers||[])],paper:clone(data.paper||null)};}
function restore(data,state){if(Array.isArray(state)){data.strokes=clone(state);return;}data.assets={...state.assets};data.strokes=state.strokes.slice();data.layers=state.layers.map(l=>({...clone({...l,tiles:undefined}),tiles:l.tiles}));data.selectedLayers=state.selectedLayers.slice();data.paper=clone(state.paper);}
module.exports={freeze,seal,snapshot,restore};
