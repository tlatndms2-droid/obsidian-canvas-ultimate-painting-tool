'use strict';
// Pen input does not reliably start Chromium's native HTML drag-and-drop.
function bindPenDrag(row,ui,layer){
 let state=null,ignoreClick=false;
 const stop=e=>{e.preventDefault();e.stopPropagation();};
 const finish=()=>{if(!state)return;const id=state.id;state.preview?.remove();state=null;ui.penDragCancel=null;row.draggable=true;row.classList.remove('cdt-drag-source');ui.clearDrop();ui.s.anchors?.highlight?.(null);ui.dragIds=null;row.ownerDocument.removeEventListener('keydown',key,true);if(row.hasPointerCapture(id))row.releasePointerCapture(id);};
 const key=e=>{if(e.key==='Escape'&&state){stop(e);ignoreClick=true;finish();}};
 row.addEventListener('click',e=>{if(ignoreClick){ignoreClick=false;stop(e);e.stopImmediatePropagation();}},true);
 row.addEventListener('pointerdown',e=>{if(e.pointerType!=='pen'||e.button!==0||e.target.closest('button,input,select'))return;finish();ignoreClick=false;state={id:e.pointerId,x:e.clientX,y:e.clientY,active:false};ui.penDragCancel=()=>{ignoreClick=true;finish();};row.draggable=false;row.setPointerCapture(e.pointerId);row.ownerDocument.addEventListener('keydown',key,true);stop(e);});
 const preview=e=>{
  if(!state.preview){
   const rect=row.getBoundingClientRect(),copy=row.cloneNode(true);
   copy.classList.remove('cdt-drag-source');copy.classList.add('cdt-layer-drag-preview');
   copy.removeAttribute('data-layer-id');copy.removeAttribute('id');copy.draggable=false;copy.inert=true;copy.setAttribute('aria-hidden','true');
   // cloneNode does not copy the bitmap held by thumbnail canvases.
   const originals=row.querySelectorAll('canvas');
   copy.querySelectorAll('canvas').forEach((canvas,i)=>canvas.getContext('2d')?.drawImage(originals[i],0,0));
   Object.assign(copy.style,{position:'fixed',left:'0',top:'0',width:rect.width+'px',height:rect.height+'px',boxSizing:'border-box',margin:'0',opacity:'.5',pointerEvents:'none',zIndex:'2147483647',color:row.ownerDocument.defaultView.getComputedStyle(row).color});
   state.preview=copy;state.grabX=state.x-rect.left;state.grabY=state.y-rect.top;
   row.ownerDocument.body.append(copy);
  }
  state.preview.style.transform='translate3d('+(e.clientX-state.grabX)+'px,'+(e.clientY-state.grabY)+'px,0)';
 };
 const hover=e=>{
  const hit=row.ownerDocument.elementFromPoint(e.clientX,e.clientY),target=hit?.closest('.cdt-layer-row');
  const l=ui.d.layers.find(l=>l.id===target?.dataset.layerId),anchors=ui.s.anchors;
  state.card=null;
  if(target&&ui.s.layers.contains(target)&&l){
   anchors?.highlight?.(null);
   ui.showDrop(target,l,{clientY:e.clientY,dataTransfer:{types:['application/cdt-layers']},preventDefault(){},stopPropagation(){}});
  }else{
   ui.clearDrop();
   if(hit&&ui.s.host.contains(hit)&&anchors?.usable?.())state.card=anchors.target({target:hit,clientX:e.clientX,clientY:e.clientY});
   anchors?.highlight?.(state.card);
  }
 };
 row.addEventListener('pointermove',e=>{if(!state||e.pointerId!==state.id)return;stop(e);if(!state.active){if(Math.hypot(e.clientX-state.x,e.clientY-state.y)<6)return;if(!ui.d.selectedLayers.includes(layer.id))ui.select(layer.id);ui.dragIds=[...ui.d.selectedLayers];state.active=true;row.classList.add('cdt-drag-source');}preview(e);hover(e);});
 row.addEventListener('pointerup',e=>{if(!state||e.pointerId!==state.id)return;stop(e);const active=state.active;if(active)hover(e);const drop=ui.drop,ids=ui.dragIds,card=state.card;ignoreClick=true;finish();if(active&&card&&ids?.length)ui.s.anchors.bind(ids,card.id);else if(active&&drop&&ids?.length)ui.move(ids,drop.id,drop.zone==='inside',drop.zone==='after');else if(!active)ui.select(layer.id,e);});
 row.addEventListener('pointercancel',e=>{if(state&&e.pointerId===state.id){ignoreClick=true;finish();}});
 row.addEventListener('lostpointercapture',finish);
 return finish;
}
module.exports={bindPenDrag};
