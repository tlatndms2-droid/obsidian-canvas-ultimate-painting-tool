'use strict';
// Share release-to-delete semantics between the dialog and radial editor.
function install(graph,{dragging,index,curve,remove}){
 const hint=graph.ownerDocument.createElement('small');hint.className='cdt-curve-drag-hint';hint.setAttribute('aria-live','polite');graph.after(hint);
 const normal='중간 점: 바깥에 놓으면 삭제 · 양 끝점 유지';
 const pending=value=>{graph.classList.toggle('is-delete-pending',value);for(const dot of graph.querySelectorAll('[data-point]'))dot.classList.toggle('is-delete-target',value&&Number(dot.dataset.point)===index());hint.textContent=value?'놓으면 삭제 · 안으로 돌아오면 취소':normal;};
 const outside=e=>{const r=graph.getBoundingClientRect();return e.clientX<r.left-r.width*.04||e.clientX>r.right+r.width*.04||e.clientY<r.top-r.height*.04||e.clientY>r.bottom+r.height*.04;};
 const deleting=e=>index()>0&&index()<curve().length-1&&outside(e);
 const move=graph.onpointermove,up=graph.onpointerup,cancel=graph.onpointercancel;
 graph.onpointermove=e=>{if(dragging()?.id!==e.pointerId)return;const drop=deleting(e);if(!drop)move?.(e);pending(drop);};
 graph.onpointerup=e=>{if(dragging()?.id!==e.pointerId)return;if(deleting(e))remove();pending(false);up?.(e);};
 graph.onpointercancel=e=>{if(dragging()?.id!==e.pointerId)return;cancel?.(e);pending(false);};
 graph.onlostpointercapture=e=>{if(dragging()?.id===e.pointerId)graph.onpointercancel(e);};
 pending(false);
}
module.exports={install};
