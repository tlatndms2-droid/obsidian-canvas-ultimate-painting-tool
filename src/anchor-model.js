'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
function position(node){return {targetId:node.id,x:node.x,y:node.y,width:node.width,height:node.height};}
function reconcile(data,nodes){let moved=false,changed=false;for(const l of data.layers){const a=l.anchor;if(!a)continue;const n=nodes.get(a.targetId);if(!n||![n.x,n.y,n.width,n.height].every(Number.isFinite))continue;const resized=n.width!==a.width||n.height!==a.height,dx=n.x-a.x,dy=n.y-a.y;if(dx||dy||resized){if(!resized&&l.type==='layer'){l.offset={x:(l.offset?.x||0)+dx,y:(l.offset?.y||0)+dy};moved=true;}l.anchor=position(n);changed=true;}}return {changed,moved};}
function detach(data,targetId){const removed=[];for(const l of data.layers)if(l.anchor?.targetId===targetId){removed.push({id:l.id,anchor:copy(l.anchor)});l.anchor=null;}return removed;}
function restoreLinks(data,removed,nodes){let changed=false;for(const item of removed){const l=data.layers.find(l=>l.id===item.id),n=nodes.get(item.anchor.targetId);if(l&&!l.anchor&&n){l.anchor=copy(item.anchor);changed=true;}}if(changed)reconcile(data,nodes);return changed;}
module.exports={position,reconcile,detach,restoreLinks};
