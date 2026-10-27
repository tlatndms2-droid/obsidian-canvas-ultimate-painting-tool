'use strict';
// Freeze the document's layout width, then scale its visual size. Font sizes and
// line wrapping stay in document units; shared Drawing tools already map input
// through canvasEl.getBoundingClientRect()/offsetWidth.
function installZoom(s){
 const cm=s.cm,sizer=cm.scrollDOM.querySelector('.cm-sizer')||cm.contentDOM;
 const saved=s.owner.data.notes[s.file.path]?.viewport;
 const properties=['width','min-width','max-width','flex','zoom','margin-left','margin-right','transform','transform-origin'];
 const zoom=s.mdZoom={value:1,editorValue:1,drawingValue:null,baseWidth:null,baseInset:null,panX:0,panY:0,sizer,originalStyle:properties.map(key=>[key,sizer.style.getPropertyValue(key),sizer.style.getPropertyPriority(key)]),frame:0,timer:0};
 s.canvas.scale=1;s.canvas.zoom=1;s.canvas.tZoom=0;
 const oldScrollAnchor=cm.scrollDOM.style.getPropertyValue('overflow-anchor');cm.scrollDOM.style.setProperty('overflow-anchor','none');
 const transform=()=>{sizer.style.setProperty('transform-origin','0 0','important');sizer.style.setProperty('transform',`translate(${zoom.panX/zoom.value}px,${zoom.panY/zoom.value}px)`,'important');};
 const save=()=>{if(!s.drawing)return;zoom.drawingValue=zoom.value;const meta=s.owner.data.notes[s.file.path]??={strokes:[]};meta.viewport={zoom:zoom.value,editorZoom:1,drawingZoom:zoom.drawingValue,baseWidth:zoom.baseWidth,baseInset:zoom.baseInset,panX:zoom.panX,panY:zoom.panY};clearTimeout(zoom.timer);zoom.timer=setTimeout(()=>s.owner.persist(),250);};
 const layout=()=>{
  if(!zoom.baseWidth)zoom.baseWidth=sizer.getBoundingClientRect().width/zoom.value;
  if(zoom.baseInset===null)zoom.baseInset=Math.max(0,sizer.getBoundingClientRect().left-cm.scrollDOM.getBoundingClientRect().left+cm.scrollDOM.scrollLeft-zoom.panX-parseFloat(s.win.getComputedStyle(cm.scrollDOM).paddingLeft||'0'));
  for(const [key,v]of Object.entries({width:zoom.baseWidth+'px','min-width':zoom.baseWidth+'px','max-width':zoom.baseWidth+'px',flex:'0 0 auto',zoom:String(zoom.value),'margin-left':zoom.baseInset/zoom.value+'px','margin-right':'0px'}))sizer.style.setProperty(key,v,'important');
  transform();
 };
 s.zoomReset=s.element('button','mdt-zoom-reset',s.mdUi,'100%');s.zoomReset.type='button';
 s.zoomReset.setAttribute('aria-label','MD 확대율 100% 복원');s.zoomReset.title='Alt+우클릭 드래그 / 우클릭 드래그: 이동 · Ctrl+우클릭 드래그 / Ctrl+휠: 확대·축소 · 클릭: 100%와 원래 위치 복원';
 s.zoomReset.onclick=()=>{if(s.active||s.selection.drag||s.figures.drag)return;s.setZoom(1);s.win.cancelAnimationFrame(zoom.frame);zoom.frame=0;zoom.panX=zoom.panY=0;transform();cm.scrollDOM.scrollLeft=cm.scrollDOM.scrollTop=0;cm.requestMeasure();save();s.scheduleRender();};
 s.panViewport=(dx,dy)=>{if(!s.drawing||s.active||s.selection.drag||s.figures.drag)return;layout();s.win.cancelAnimationFrame(zoom.frame);zoom.frame=0;zoom.panX+=dx;zoom.panY+=dy;transform();cm.requestMeasure();save();s.scheduleRender();};
 // The original Canvas gesture router supplies document-space pan deltas and
 // logarithmic zoom deltas. Keep its configurable mouse/pen bindings unchanged.
 s.canvas.panBy=(dx,dy)=>s.panViewport(-dx*zoom.value,-dy*zoom.value);
 s.canvas.domPosFromEvt=e=>({x:e.clientX,y:e.clientY});
 s.canvas.zoomBy=(delta,center)=>s.setZoom(2**(s.canvas.tZoom+delta),center);
 const updateCursor=s.updateCursor.bind(s);s.updateCursor=e=>{const nav=s.navigationDrag;s.host.classList.toggle('mdt-panning',nav?.mode==='pan');s.host.classList.toggle('mdt-zooming',nav?.mode==='zoom');if(nav){s.cursor.hidden=true;if(s.mixHint)s.mixHint.hidden=true;return;}updateCursor(e);};
 s.setZoom=(value,client,{fit=false}={})=>{
  if(!s.drawing||s.active||s.selection.drag||s.figures.drag){return;}
  const minimum=(fit||zoom.value<.5)?.01:.5;
  const next=Math.round(Math.max(minimum,Math.min(3,Number(value)||1))*1000)/1000;
  const host=s.host.getBoundingClientRect(),point=client||{x:host.left+host.width/2,y:host.top+host.height/2};
  const before=cm.contentDOM.getBoundingClientRect(),oldScale=before.width/cm.contentDOM.offsetWidth||1;
  const at={x:(point.x-before.left)/oldScale,y:(point.y-before.top)/oldScale};
  layout();zoom.value=next;layout();s.canvas.zoom=next;s.canvas.scale=next;s.canvas.tZoom=Math.log2(next);
  const anchor=()=>{if(!s.drawing)return;const after=cm.contentDOM.getBoundingClientRect(),scale=after.width/cm.contentDOM.offsetWidth||next;zoom.panX+=point.x-(after.left+at.x*scale);zoom.panY+=point.y-(after.top+at.y*scale);transform();save();s.scheduleRender();};
  anchor();cm.requestMeasure();s.win.cancelAnimationFrame(zoom.frame);zoom.frame=s.win.requestAnimationFrame(()=>{zoom.frame=0;anchor();});
  s.zoomReset.textContent=Math.round(next*100)+'%';
  save();s.scheduleRender();
 };
 s.listen(s.doc,'wheel',e=>{
  if(!s.drawing||!s.isActive()||!s.host.contains(e.target)||!(e.ctrlKey||e.metaKey)||e.target.closest('.cdt-panel,.cdt-layers,.cdt-color-popup,.cdt-toolbar,.cdt-selection-bar,.cdt-panel-edge'))return;
  e.preventDefault();e.stopImmediatePropagation();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?s.host.clientHeight:1);
  s.setZoom(zoom.value*Math.exp(-delta*.002),{x:e.clientX,y:e.clientY});
 },{capture:true,passive:false});
 // Old shared viewport values belong to drawing only. Never apply them to typing.
 const valid=(n,fallback)=>Number.isFinite(n)?n:fallback;
 zoom.drawingViewport={value:Math.max(.01,Math.min(3,valid(saved?.drawingZoom,valid(saved?.zoom,1)))),panX:valid(saved?.panX,0),panY:valid(saved?.panY,0),scrollLeft:0,scrollTop:0};
 const restoreStyle=()=>{for(const [key,value,priority]of zoom.originalStyle)if(value)sizer.style.setProperty(key,value,priority);else sizer.style.removeProperty(key);};
 s.switchMdViewport=on=>{
  s.win.cancelAnimationFrame(zoom.frame);zoom.frame=0;clearTimeout(zoom.timer);
  if(on){
   zoom.editorViewport={scrollLeft:cm.scrollDOM.scrollLeft,scrollTop:cm.scrollDOM.scrollTop};
   const v=zoom.drawingViewport;
   zoom.baseWidth=null;zoom.baseInset=null;zoom.value=1;zoom.panX=zoom.panY=0;layout();
   zoom.value=v.value;zoom.panX=v.panX;zoom.panY=v.panY;layout();
   cm.scrollDOM.scrollLeft=v.scrollLeft;cm.scrollDOM.scrollTop=v.scrollTop;
  }else{
   zoom.drawingViewport={value:zoom.value,panX:zoom.panX,panY:zoom.panY,scrollLeft:cm.scrollDOM.scrollLeft,scrollTop:cm.scrollDOM.scrollTop};
   const meta=s.owner.data.notes[s.file.path]??={strokes:[]};
   meta.viewport={zoom:zoom.value,editorZoom:1,drawingZoom:zoom.value,baseWidth:zoom.baseWidth,baseInset:zoom.baseInset,panX:zoom.panX,panY:zoom.panY};s.owner.persist();
   restoreStyle();zoom.value=zoom.editorValue=1;zoom.panX=zoom.panY=0;
   const v=zoom.editorViewport||{scrollLeft:0,scrollTop:0};
   cm.scrollDOM.scrollLeft=v.scrollLeft;cm.scrollDOM.scrollTop=v.scrollTop;
   // CodeMirror remeasures line heights after CSS zoom is removed and can
   // adjust scroll anchoring. Restore against the measured native layout.
   cm.requestMeasure({read:()=>null,write:()=>{
    if(s.drawing)return;
    cm.scrollDOM.scrollLeft=v.scrollLeft;cm.scrollDOM.scrollTop=v.scrollTop;
    zoom.frame=s.win.requestAnimationFrame(()=>{zoom.frame=0;if(s.drawing)return;cm.scrollDOM.scrollLeft=v.scrollLeft;cm.scrollDOM.scrollTop=v.scrollTop;s.scheduleRender();});
   }});
  }
  s.canvas.zoom=s.canvas.scale=zoom.value;s.canvas.tZoom=Math.log2(zoom.value);
  s.zoomReset.textContent=Math.round(zoom.value*100)+'%';cm.requestMeasure();s.scheduleRender();
 };
 return()=>{clearTimeout(zoom.timer);s.win.cancelAnimationFrame(zoom.frame);for(const [key,value,priority]of zoom.originalStyle)if(value)sizer.style.setProperty(key,value,priority);else sizer.style.removeProperty(key);if(oldScrollAnchor)cm.scrollDOM.style.setProperty('overflow-anchor',oldScrollAnchor);else cm.scrollDOM.style.removeProperty('overflow-anchor');s.zoomReset.remove();};
}
module.exports={installZoom};
