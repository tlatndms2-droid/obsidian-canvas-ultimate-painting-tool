'use strict';
const {Notice,setIcon}=require('obsidian');
const {CanvasSession}=require('../src/main');
const {LayerRenderer,makeLayer,upgradeLayers}=require('../src/layers');
const {History}=require('../src/history');
const {seal}=require('../src/history-state');
const {defaults:paperDefaults}=require('../src/paper');
const id=()=>crypto.randomUUID();
class MarkdownSession extends CanvasSession {
 constructor(owner,cm,leaf){
  const canvas={mdAltPan:true,canvasEl:cm.contentDOM,nodes:new Map(),selection:new Set(),data:{},tZoom:0,zoom:1,isHoldingSpace:false,getData(){return{nodes:[],edges:[]}},requestSave(){},markDirty(){},panBy(x,y){cm.scrollDOM.scrollLeft+=x;cm.scrollDOM.scrollTop+=y},zoomBy(){},domPosFromEvt(e){const r=cm.contentDOM.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}};
  const view={get file(){return leaf.view.file},canvas,editor:{cm},containerEl:cm.dom,requestSave(){},save:()=>owner.persist()};
  const host=cm.dom.ownerDocument.createElement('div');host.className='mdt-host';cm.dom.append(host);
  super(owner.bridge,view,host);
  this.owner=owner;this.cm=cm;this.leaf=leaf;this.mdPanel=null;this.mdReady=false;
  this.host.tabIndex=-1;this.raster.removeAttribute('aria-label');
  // Obsidian refocuses CodeMirror when returning to a tab. Keep drawing keys
  // out of the document while allowing text fields in tool panels to work.
  this.listen(cm.dom,'focusin',e=>{if(this.drawing&&this.isActive()&&cm.contentDOM.contains(e.target))this.host.focus({preventScroll:true});});
  // Keep panel visibility local to this editor rather than changing Canvas workspace settings.
  const layout=this.workspaceUI.applyLayout.bind(this.workspaceUI);
  this.workspaceUI.applyLayout=()=>{layout();this.applyMdLayout()};
  this.workspaceUI.toggle=key=>{if(key==='layersCollapsed')this.openMdPanel('layers');else if(key==='contextCollapsed')this.openMdPanel(this.tool==='shape'?'shape':'brush');else if(key==='toolbarCollapsed')this.setMode(false);else this.workspaceUI.applyLayout()};
  // The shared input router recognizes controls inside .cdt-panel as UI, not ink.
  this.mdUi=this.element('div','cdt-panel mdt-ui',this.host);this.mdUi.style.display='contents';
  this.visibility=new (require('./md-visibility').MdVisibility)(this);
  this.destroyZoom=require('./md-zoom').installZoom(this);
  this.layerToggle=this.button(this.tools,'layers','MD 레이어 패널',()=>this.openMdPanel('layers'));
  this.colorButton=this.button(this.tools,'palette','MD 색상 패널',()=>{this.mdPanel=null;this.colorUI.toggle();this.applyMdLayout();});
  this.undoButton=this.button(this.tools,'undo-2','MD 필기 실행 취소',()=>this.undoDrawing());
  this.redoButton=this.button(this.tools,'redo-2','MD 필기 다시 실행',()=>this.undoDrawing(true));
  const oldSelect=this.selectTool.bind(this);
  this.selectTool=tool=>{const panel=['brush','eraser'].includes(tool)?'brush':tool==='shape'?'shape':null;const close=this.tool===tool&&this.mdPanel===panel;oldSelect(tool);this.mdPanel=close?null:panel;this.applyMdLayout();};
  const layerRender=this.layerUI.render.bind(this.layerUI);this.layerUI.render=()=>{layerRender();this.layerUI.linkButton?.remove();const filter=this.layers.querySelector('[aria-label="레이어 필터"]');for(const v of ['canvas','anchor'])filter?.querySelector(`option[value="${v}"]`)?.remove();};
  this.anchors={sync(){},render(){},down(){return false},move(){},linked(){return false},toggle(){},affected:ids=>new Set(ids),mergeTarget:async()=>null,menu(){},destroy(){}};
  this.listen(cm.scrollDOM,'scroll',()=>{this.scheduleRender();this.selection.render();});
  this.listen(this.host,'wheel',e=>{if(!this.drawing||e.target.closest('.cdt-panel,.cdt-layers,.cdt-color-popup,.cdt-quick-panel'))return;e.preventDefault();cm.scrollDOM.scrollTop+=e.deltaY;cm.scrollDOM.scrollLeft+=e.deltaX;this.scheduleRender();},{passive:false});
  const choose=this.brushUI.choose.bind(this.brushUI);this.brushUI.choose=p=>{choose(p);this.mdPanel=null;this.applyMdLayout();this.host.focus({preventScroll:true});};
  this.installClose(this.panel,'브러시 설정 닫기');
  this.installClose(this.figures.panel,'도형 설정 닫기');
  this.navigator=new (require('./md-navigator').MdNavigator)(this);
  this.applyMdLayout();
 }
 installClose(panel,label){const close=this.button(this.mdUi,'x',label,()=>{this.mdPanel=null;this.applyMdLayout();this.host.focus({preventScroll:true});});close.classList.add('mdt-panel-close');close.dataset.closePanel=panel===this.panel?'brush':'shape';}
 isActive(){return this.plugin.app.workspace.activeLeaf===this.leaf||this.plugin.app.workspace.activeLeaf?.view?.editor?.cm===this.view.editor.cm;}
 async initialize(){
  const owner=this.owner,text=this.cm.state.doc.toString(),path=this.file.path,meta=owner.data.notes[path]??={text,strokes:[]};
  const drawingId=meta.drawingId||id();this.record=this.plugin.store.load(drawingId,path,!!meta.drawingId);this.record.releaseWhenSaved=false;
  const d=this.record.data;upgradeLayers(d);d.version=Math.max(8,d.version);d.assets??={};d.paper??=paperDefaults();
  this.record.history??=new History(this.record,this.plugin.settings.historyLimit,()=>{});
  this.canvas.data.canvasDrawing={version:1,id:drawingId};
  this.engine=new LayerRenderer(()=>this.doc.createElement('canvas'));await this.engine.load(d);
  if(!meta.drawingId){
   for(const stroke of meta.strokes||[]){
    const l=makeLayer(stroke.kind==='fixed'?'이전 위치 고정':`이전 글 · ${stroke.quote||''}`);let anchor=null;
    if(stroke.kind!=='fixed')anchor=this.legacyAnchorPosition(stroke.from,stroke.to,stroke.quote);
    const orphan=stroke.orphan||(!anchor&&stroke.kind!=='fixed')||((meta.text!==text)&&stroke.kind!=='fixed');
    if(anchor)l.mdAnchor={...anchor,orphan:!!orphan,reason:stroke.reason};else if(stroke.kind!=='fixed')l.mdAnchor={from:stroke.from,to:stroke.to,quote:stroke.quote,x:0,y:0,orphan:true};
    if(orphan){l.mdWasVisible=true;l.visible=false;}
    const base=anchor||{x:0,y:0};d.layers.push(l);d.strokes.push({id:stroke.id||id(),layerId:l.id,color:'#b6a0e2',size:3,points:stroke.points.map(p=>[p[0]+(stroke.kind==='fixed'?0:base.x),p[1]+(stroke.kind==='fixed'?0:base.y)])});
   }
   if(d.layers.length)d.selectedLayers=[d.layers[0].id];
  }
  // Detach links without changing geometry, offsets, layer visibility, or saved pixels.
  // Also detach history states so drawing Undo cannot reintroduce text following.
  for(const layers of [d.layers,...this.record.undo.map(s=>s.layers||[]),...this.record.redo.map(s=>s.layers||[])])for(const l of layers)if(l.mdAnchor){l.mdFormerAnchor=l.mdAnchor;delete l.mdAnchor;delete l.mdWasVisible;}
  d.mdFixedOnly=true;delete d.mdText;seal(d);this.plugin.store.changed(this.record);
  if(!await this.plugin.store.flush(this.record))throw Error(this.record.error||'MD 필기 저장 실패');
  meta.drawingId=drawingId;await owner.persist();this.ready=this.mdReady=true;this.layerUI.render();this.refreshControls();this.applyMdLayout();this.scheduleRender();
 }
 legacyAnchorPosition(from,to,quote){if(from<0||from>this.cm.state.doc.length)return null;const c=this.cm.coordsAtPos(from,1),r=this.cm.contentDOM.getBoundingClientRect();return c?{from,to,quote,x:c.left-r.left,y:c.top-r.top,orphan:false}:null;}
 pointerDown(e){if(!this.ready||e.target.closest('.mdt-panel-close'))return;super.pointerDown(e);if(this.drawing&&!e.target.closest('input,select,textarea'))this.host.focus({preventScroll:true});}
 keyDown(e,fromScope=false){if(!this.isActive())return;
  if(require('../src/pie-input').picker(this,e))return;
  if(this.brushPie?.key(e)||this.detailPie?.key(e)||this.eraserPie?.key(e))return;
  if(this.colorUI?.pie?.key(e))return;
  if(this.quickTools?.pie?.key(e))return;
  if(this.drawing&&e.code==='Escape'&&!this.figures.pending&&!this.selection.drag&&!this.selection.parts?.length&&!this.colorUI.pick){e.preventDefault();e.stopImmediatePropagation();this.setMode(false);return;}
  super.keyDown(e,fromScope);
 }
 toggleInput(){if(this.active||this.figures.pending||this.selection.drag){new Notice('현재 획이나 도형을 마친 뒤 전환하세요.');return;}this.setMode(!this.drawing);}
 setMode(on){const was=this.drawing;super.setMode(on);if(this.ready&&this.mdZoom&&this.drawing!==was)this.switchMdViewport(this.drawing);this.mdPanel=null;this.applyMdLayout();if(!this.ready)return;if(this.drawing)this.host.focus({preventScroll:true});else this.view.editor.cm.focus();}
 openMdPanel(which){this.mdPanel=this.mdPanel===which?null:which;this.colorUI.close();this.applyMdLayout();}
 applyMdLayout(){
  if(!this.host.classList.contains('mdt-host'))return;
  this.tools.hidden=!this.drawing;this.workspaceUI.footer.hidden=true;this.paperButton.hidden=true;this.quickTools.button.hidden=!this.drawing;
  const order=[this.brushButton,this.eraserButton,this.editButtons.rectangle,this.editButtons['move-layer'],this.editButtons.shape,this.colorButton,this.quickTools.button,this.layerToggle,...(this.navigator?[this.navigator.button]:[]),this.undoButton,this.redoButton];
  const current=[...this.tools.children].filter(b=>order.includes(b));if(current.some((b,i)=>b!==order[i]))for(const b of order)this.tools.append(b);
  this.toolbar.classList.toggle('mdt-expanded',this.drawing);this.toggle.setAttribute('aria-label',this.drawing?'MD 타이핑으로 전환':'MD 그리기 시작');this.toggle.title=this.drawing?'타이핑 · Ctrl+Alt+D':'그리기 · Ctrl+Alt+D';
  this.panel.hidden=!(this.drawing&&this.mdPanel==='brush'&&['brush','eraser'].includes(this.tool));
  if(this.zoomReset)this.zoomReset.hidden=!this.drawing;
  this.figures.panel.hidden=!(this.drawing&&this.mdPanel==='shape'&&this.tool==='shape');this.layers.hidden=!(this.drawing&&this.mdPanel==='layers');
  if(this.quickTools.opened)this.quickTools.panel.hidden=!this.drawing;
  const width=this.host.clientWidth,height=this.host.clientHeight;
  for(const panel of [this.panel,this.figures.panel,this.layers,this.quickTools.panel]){Object.assign(panel.style,{left:'58px',right:'auto',top:'58px',width:Math.min(276,Math.max(140,width-72))+'px',maxHeight:Math.max(120,height-75)+'px',height:'auto'});}
  if(this.brushPie?.root||this.quickTools.pie?.root||this.colorUI.pie?.root||this.eraserPie?.root||this.detailPie?.root)for(const panel of [this.panel,this.figures.panel,this.layers,this.quickTools.panel])panel.hidden=true;
  for(const b of this.host.querySelectorAll('.mdt-panel-close')){const panel=b.dataset.closePanel==='brush'?this.panel:this.figures.panel;b.hidden=panel.hidden;Object.assign(b.style,{left:(58+Math.min(276,Math.max(140,width-72))-28)+'px',top:'62px'});}
 }
 updateText(update){if(!this.ready)return;if(update.docChanged){clearTimeout(this.navTextTimer);this.navTextTimer=setTimeout(()=>{this.navTextTimer=null;if(!this.disposed)this.scheduleRender();},150);this.figures.confirm();this.selection.confirm(false);this.selection.end();this.finishStroke();}this.scheduleRender();}
 render(){if(!this.mdReady)return;super.render();this.applyMdLayout();this.navigator?.render();}
 inspect(){return{path:this.file.path,mode:this.drawing,kind:'fixed',zoom:this.mdZoom?.value||1,pan:{x:this.mdZoom?.panX||0,y:this.mdZoom?.panY||0},tool:this.tool,panel:this.mdPanel,ready:this.ready,id:this.record?.data.id,layers:this.record?.data.layers,strokes:this.record?.data.strokes.length,tiles:this.engine.tiles.size};}
 destroy(){clearTimeout(this.navTextTimer);this.navigator?.destroy();this.destroyZoom?.();this.mdUi?.remove();super.destroy();this.host.remove();}
}
module.exports={MarkdownSession};
