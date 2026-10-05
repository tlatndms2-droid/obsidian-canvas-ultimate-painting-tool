'use strict';
const {snapshot,restore}=require('./history-state');
// Estimates managed history payload, not JS heap/GPU/process memory.
const sizes=new WeakMap();
function size(v){if(v===null||v===undefined)return 0;if(typeof v==='string')return v.length*2;if(typeof v!=='object')return 8;if(Object.isFrozen(v)&&sizes.has(v))return sizes.get(v);const n=32+Object.entries(v).reduce((n,[k,x])=>n+k.length*2+size(x),0);if(Object.isFrozen(v))sizes.set(v,n);return n;}
class History{
 constructor(record,limit=50,onChange=()=>{}){this.r=record;this.limit=limit;this.onChange=onChange;this.refs=new Map();this.bytes=0;record.undo??=[];record.redo??=[];for(const s of [...record.undo,...record.redo])this.account(s,1);this.trim(limit);}
 atoms(s){return [...s.strokes,...Object.values(s.assets||{}),...(s.layers||[]).flatMap(l=>[l.tiles,...l.tiles])];}
 atomSize(a){return Array.isArray(a)?32+a.length*8:size(a);}
 overhead(s){return 64+s.strokes.length*8+size({...s,strokes:[],assets:{},layers:(s.layers||[]).map(l=>({...l,tiles:[]}))});}
 account(s,delta){this.bytes+=this.overhead(s)*delta;for(const a of this.atoms(s)){const n=this.refs.get(a)||0;if(delta>0){if(!n)this.bytes+=this.atomSize(a);this.refs.set(a,n+1);}else if(n<=1){this.refs.delete(a);this.bytes-=this.atomSize(a);}else this.refs.set(a,n-1);}this.bytes=Math.max(0,this.bytes);}
 notify(){this.onChange(this);}
 push(before){for(const s of this.r.redo)this.account(s,-1);this.r.redo=[];this.r.undo.push(before);this.account(before,1);this.trim(this.limit);}
 trim(limit){this.limit=limit;while(this.r.undo.length+this.r.redo.length>limit){const list=this.r.undo.length>=this.r.redo.length?this.r.undo:this.r.redo;this.account(list.shift(),-1);}this.notify();}
 travel(redo=false){const from=redo?this.r.redo:this.r.undo,to=redo?this.r.undo:this.r.redo;if(!from.length)return false;const current=snapshot(this.r.data),target=from.pop();this.account(target,-1);to.push(current);this.account(current,1);restore(this.r.data,target);this.notify();return true;}
 clear(){this.r.undo=[];this.r.redo=[];this.refs.clear();this.bytes=0;this.notify();}
 get count(){return this.r.undo.length+this.r.redo.length;}
}
module.exports={History};
