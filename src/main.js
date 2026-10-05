'use strict';
const {Plugin, Notice, setIcon} = require('obsidian');
const {DrawingStore, validId, randomUUID} = require('./storage');
const {DrawingEngine} = require('./engine');
const {upgrade,selected,inputPoint,Stabilizer,clone}=require('./brush');
const {captureCurrent}=require('./workspaces');
const {freezeMaterials,packMaterials,unpackMaterials}=require('./materials');
const {WorkspaceUI,upgradeWorkspaces}=require('./workspace-ui');
const {ColorUI}=require('./color-ui');
const {floating}=require('./panel-layout');
const {update:updateTipCursor}=require('./tip-cursor');
const {BrushUI,shortcutKey}=require('./brush-ui');
const {LayerUI}=require('./layer-ui');
const {AnchorUI}=require('./anchor-ui');
const {Figures}=require('./figures');
const {QuickTools}=require('./quick-tools');
const {ToolShift}=require('./tool-shift');
const R=require('./raster-edit');
const {seal,freeze}=require('./history-state');
const {History}=require('./history');
const {HistoryUI,HistorySettings}=require('./history-ui');
const {TextItems}=require('./text-items');
const {DrawingSelection}=require('./selection');
const {PaperUI,defaults:paperDefaults}=require('./paper');
const {makeLayer,upgradeLayers,writable,ancestors,snapshot,restore,LayerRenderer}=require('./layers');

module.exports = class CanvasDrawingPlugin extends Plugin {
  async saveData(data){captureCurrent(data);const packed=packMaterials(data);this.settingsSave=(this.settingsSave||Promise.resolve()).catch(()=>{}).then(()=>super.saveData(packed));return this.settingsSave;}
  async onload() {
    this.store = new (require('./storage-async').AsyncDrawingStore)(this.app.vault.adapter.getBasePath());
    const retained=this.app[Symbol.for('canvas-drawing-unsaved')];if(retained){for(const [id,r]of retained)this.store.records.set(id,{data:r.data,dirty:true,error:r.error,undo:[],redo:[]});delete this.app[Symbol.for('canvas-drawing-unsaved')];}
    this.sessions = new Map();this.keyboard=new (require('./drawing-keyboard').DrawingKeyboard)(this);
    this.settings = {size:12, color:'#b6a0e2', opacity:1, density:1, hardness:1, mix:false, paintAmount:.5, colorStretch:.5, eraserSize:32, ...unpackMaterials(await this.loadData() || {})};
    upgrade(this.settings);upgradeWorkspaces(this.settings);this.settings.historyLimit=Number.isSafeInteger(this.settings.historyLimit)&&this.settings.historyLimit>0?this.settings.historyLimit:50;this.addSettingTab(new HistorySettings(this.app,this));
    if(require('./default-brushes').install(this.settings))await this.saveData(this.settings);
    this.registerEvent(this.app.workspace.on('layout-change', () => this.sync()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => {this.settleInactive();this.flush(); this.sync();queueMicrotask(()=>this.keyboard?.update());}));
    this.registerEvent(this.app.workspace.on('file-open', () => {this.settleInactive();this.flush(); this.sync();}));
    this.registerEvent(this.app.vault.on('rename', file => {
      for (const s of this.sessions.values()) if (s.file === file && s.record) {
        s.record.data.sourcePath = file.path; this.store.changed(s.record);
      }
      this.flush();
    }));
    this.registerInterval(window.setInterval(() => this.sync(), 500));
    this.addCommand({id:'toggle-drawing',name:'Drawing 툴바 켜기 / 끄기',checkCallback:checking=>{
      const session = this.sessions.get(this.app.workspace.activeLeaf);
      if (!session) return false;
      if (!checking) session.setMode(!session.drawing);
      return true;
    }});
    this.app.workspace.onLayoutReady(() => this.sync());
  }
  settleInactive(){for(const s of this.sessions.values())if(!s.isActive())s.settle();}
  sync() {
    this.keyboard?.update();
    const leaves = new Set(this.app.workspace.getLeavesOfType('canvas'));
    for (const [leaf, s] of this.sessions) {
      if (!leaves.has(leaf) || leaf.view !== s.view || leaf.view.file !== s.file || !s.host.isConnected) {
        const record=s.record;s.destroy(); this.sessions.delete(leaf);if(record&&!Array.from(this.sessions.values()).some(x=>x.record===record))this.releaseRecord(record);
      }
    }
    for (const leaf of leaves) {
      const view=leaf.view, host=view.containerEl?.querySelector('.canvas-wrapper');
      if (!this.sessions.has(leaf) && view.file && host && view.canvas?.getData) {
        const session = new CanvasSession(this, view, host);
        this.sessions.set(leaf, session);
        session.initialize().catch(error => session.protect(error));
      }
    }
  }
  async releaseRecord(record){record.releaseWhenSaved=true;if(!await this.store.flush(record))return;if([...this.sessions.values()].some(s=>s.record===record)||record.dirty)return;record.history?.clear();this.store.records.delete(record.data.id);}
  repaint(record) { for (const s of this.sessions.values()) if (s.record === record) {
    if(record.data.layers?.some(l=>l.tiles.some(t=>!s.engine.images?.has(t.png))))s.engine.load(record.data).then(()=>s.scheduleRender()).catch(error=>s.protect(error));
    else s.scheduleRender();
  } }
  refreshLayers(record){for(const s of this.sessions.values())if(s.record===record)s.layerUI?.render();}
  queueSave() { clearTimeout(this.saveTimer); this.saveTimer=setTimeout(()=>this.flush(),350); }
  async flush() {
    clearTimeout(this.saveTimer);
    if (!this.store) return;
    const ok=await this.store.flushAll();
    for(const record of this.store.records.values())if(record.releaseWhenSaved&&!record.dirty&&![...this.sessions.values()].some(s=>s.record===record)){record.history?.clear();this.store.records.delete(record.data.id);}
    for (const s of this.sessions.values()){s.showStatus();s.historyUI?.updateBusy();}return ok;
  }
  onunload() {
    for (const s of this.sessions.values()) s.destroy();
    this.sessions.clear();this.keyboard?.destroy();clearTimeout(this.saveTimer);const saved=this.store.close();if(!saved){this.app[Symbol.for('canvas-drawing-unsaved')]=new Map([...this.store.records].filter(([,r])=>r.dirty).map(([id,r])=>[id,{data:r.data,error:r.error}]));new Notice('저장하지 못한 그림을 메모리에 보관했습니다. 플러그인을 다시 켜서 저장을 재시도해주세요.');}
  }
};

class CanvasSession {
  constructor(plugin, view, host) {
    this.plugin=plugin; this.view=view; this.file=view.file; this.host=host;
    this.canvas=view.canvas; this.doc=host.ownerDocument; this.win=this.doc.defaultView;
    this.drawing=false; this.disposed=false; this.listeners=[]; this.active=null;
    this.space=false; this.ready=false; this.record=null; this.loadError=null;
    this.originalGetData=this.canvas.getData;this.uiActions=new Map();
    this.tool='brush';this.engine=new DrawingEngine(()=>this.doc.createElement('canvas'));
    this.buildUI();
  }
  async initialize() {
    const raw=await this.plugin.app.vault.read(this.file);
    if (this.disposed) return;
    // Obsidian may show an empty surface after failing to parse a Canvas file.
    // Do not turn that fallback surface into a destructive "new" document.
    if (raw.trim()) {
      const disk=JSON.parse(raw);
      if (!disk || typeof disk!=='object' || Array.isArray(disk) ||
          (Object.keys(disk).length && (!Array.isArray(disk.nodes) || !Array.isArray(disk.edges)))) {
        throw Error('Canvas 파일을 읽을 수 없습니다. 원본을 보호합니다.');
      }
    }
    const meta=this.canvas.data?.canvasDrawing;
    if (meta && (meta.version!==1 || !validId(meta.id))) throw Error('지원하지 않는 Canvas 그림 연결입니다. 원본을 보호합니다.');
    let id=meta?.id || randomUUID();
    let record=this.plugin.store.load(id,this.file.path,!!meta);
    // Duplicating a Canvas must not make the two files share one drawing document.
    if (record.data.sourcePath !== this.file.path && this.plugin.app.vault.getAbstractFileByPath(record.data.sourcePath)) {
      const original=record; id=randomUUID(); record=this.plugin.store.load(id,this.file.path);
      Object.assign(record.data,JSON.parse(JSON.stringify(original.data)),{id,sourcePath:this.file.path,revision:0});
    }
    this.record=record;record.releaseWhenSaved=false;record.history??=new History(record,this.plugin.settings.historyLimit,()=>{for(const s of this.plugin.sessions.values())if(s.record===record)s.historyUI?.update();});
    if(!record.data.layers){upgradeLayers(record.data);this.plugin.store.changed(record);}
    if(record.data.version<8){record.data.version=8;record.data.paper??=paperDefaults();record.data.assets??={};this.plugin.store.changed(record);}
    seal(record.data);this.historyUI=new HistoryUI(this);this.engine=new LayerRenderer(()=>this.doc.createElement('canvas'));await this.engine.load(record.data);await this.paper.loadImage(record.data.paper?.image);
    if (!meta || meta.id !== id || record.data.sourcePath !== this.file.path) {
      record.data.sourcePath=this.file.path;
      this.plugin.store.changed(record);
      if (!await this.plugin.store.flush(record)) throw Error(record.error);
    }
    if (this.disposed) return;
    const session=this;
    this.wrappedGetData=function(...args) {
      const result=session.originalGetData.apply(this,args);
      result.canvasDrawing={version:1,id};
      return result;
    };
    this.canvas.getData=this.wrappedGetData;
    this.canvas.data.canvasDrawing={version:1,id};
    if (!meta || meta.id !== id) {
      this.view.requestSave();
      await this.view.save();
    }
    if (this.disposed) return;
    this.ready=true;
    for(const [name,redo]of [['undo',false],['redo',true]]){const old=this.canvas[name],session=this;if(typeof old!=='function')continue;const wrapped=function(...args){if(session.drawing&&session.tool!=='text'&&session.isActive()&&!session.doc.activeElement?.closest('input,textarea,select,[contenteditable=true],.modal')){session.nativeDrawingUndoAt=Date.now();session.win.setTimeout(()=>session.nativeDrawingUndoAt=0,0);session.undoDrawing(redo);return;}return old.apply(this,args);};this.canvas[name]=wrapped;this.listeners.push(()=>{if(this.canvas[name]===wrapped)this.canvas[name]=old;});}
    this.workspaceUI.applyLayout();this.anchors=new AnchorUI(this);this.zoomExtension=require('./extended-zoom').install(this);this.visibility=new (require('./canvas-visibility').CanvasVisibility)(this);this.anchors.sync(); this.layerUI.render();this.showStatus(); this.render();
  }
  listen(target,type,fn,options) {
    target.addEventListener(type,fn,options);
    this.listeners.push(()=>target.removeEventListener(type,fn,options));
  }
  element(tag,className,parent,text) {
    const el=this.doc.createElement(tag); el.className=className;
    if (text) el.textContent=text;
    parent?.append(el); return el;
  }
  button(parent,icon,label,action) {
    const b=this.element('button','cdt-icon',parent); setIcon(b,icon);
    b.setAttribute('aria-label',label); b.title=label; b.addEventListener('click',action); return b;
  }
  buildUI() {
    this.host.classList.add('cdt-session');this.toolbar=this.element('div','cdt-toolbar',this.host);
    this.toggle=this.button(this.toolbar,'pen-tool','Drawing 툴바 켜기',()=>this.setMode(!this.drawing));
    this.toggle.classList.add('cdt-toggle');
    this.tools=this.element('div','cdt-tools',this.toolbar);this.tools.hidden=true;
    this.brushButton=this.button(this.tools,'paintbrush','브러시 (B)',()=>this.selectTool('brush'));
    this.eraserButton=this.button(this.tools,'eraser','지우개 (E)',()=>this.selectTool('eraser'));
    this.colorButton=this.button(this.tools,'palette','색 선택',()=>this.colorUI.toggle());
    this.colorButton.remove();
    this.editButtons={};for(const [tool,icon,label]of [['rectangle','scan','선택 영역 (W로 방식 전환)']])this.editButtons[tool]=this.button(this.tools,icon,label,()=>this.selectTool(this.plugin.settings.selectionMethod||'rectangle'));
    for(const [tool,icon,label]of [['move-layer','box-select','오브젝트 · 레이어 전체 조작 (Ctrl+드래그)'],['shape','shapes','도형 (A)']])this.editButtons[tool]=this.button(this.tools,icon,label,()=>this.selectTool(tool));
    this.paperButton=this.button(this.tools,'file-image','배경 용지',()=>this.paper.open());
    this.raster=this.element('canvas','cdt-raster',this.host);
    this.raster.setAttribute('aria-label','Canvas 그림');
    this.cursor=this.element('div','cdt-cursor',this.host);this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;this.mixHint=this.element('span','cdt-mix-cursor',this.host,'Mix');this.mixHint.hidden=true;
    this.panel=this.element('aside','cdt-panel',this.host);
    this.brushUI=new BrushUI(this);this.brushUI.render();
    this.colorPopup=this.element('div','cdt-color-popup',this.host);this.colorPopup.hidden=true;
    this.colorUI=new ColorUI(this);
    this.refreshControls();
    this.layers=this.element('aside','cdt-layers',this.host);
    this.layerUI=new LayerUI(this);this.layerUI.render();
    this.selection=new DrawingSelection(this);this.paper=new PaperUI(this);this.figures=new Figures(this);this.textItems=new TextItems(this);this.quickTools=new QuickTools(this);this.workspaceUI=new WorkspaceUI(this);this.layerLayout=floating(this,this.layers,'layers');this.brushLayout=floating(this,this.panel,'context');this.figureLayout=floating(this,this.figures.panel,'context');this.quickLayout=floating(this,this.quickTools.panel,'quick');require('./ui-actions').install(this);
    this.notice=this.element('div','cdt-save-warning',this.host); this.notice.hidden=true;
    this.notice.setAttribute('role','status');
    this.retry=this.button(this.notice,'refresh-cw','저장 다시 시도',()=>this.plugin.flush());
    this.statusText=this.element('span','',this.notice);
    this.panel.hidden=this.layers.hidden=true;
    this.listen(this.host,'contextmenu',e=>{if(this.drawing&&!e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-panel,.cdt-layers,.cdt-toolbar,.cdt-color-popup')){e.preventDefault();e.stopImmediatePropagation();return;}if(this.drawing&&(this.selection.pasting||Date.now()<this.selection.suppressContextUntil)){e.preventDefault();e.stopImmediatePropagation();this.selection.endPaste();return;}if(this.drawing&&e.pointerType==='pen'&&(e.ctrlKey||this.plugin.settings.penButton!=='none')){e.preventDefault();e.stopImmediatePropagation();}},true);
    this.listen(this.host,'drop',e=>{if(this.drawing&&!e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-panel,.cdt-layers')&&!e.dataTransfer?.types.includes('application/cdt-layers')){e.preventDefault();e.stopImmediatePropagation();}},true);
    this.listen(this.host,'dblclick',e=>{if(!this.drawing||this.tool==='text'||this.space||this.canvas.isHoldingSpace)return;if(e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-anchors,.cdt-panel,.cdt-layers,.cdt-toolbar,.cdt-color-popup,.canvas-controls,.cdt-save-warning'))return;e.preventDefault();e.stopImmediatePropagation();if(this.tool==='shape'&&!['line','arrow-angle','arrow-curve'].includes(this.figures.pending?.kind))this.figures.confirm();},true);
    // Canvas has an earlier capture listener on the wrapper. Intercept shape input
    // on its ancestor before that listener can select or edit the underlying card.
    this.listen(this.doc,'pointerdown',e=>{if(this.ready&&this.drawing&&this.tool==='shape'&&!this.space&&!this.canvas.isHoldingSpace&&e.button===0&&e.pointerType!=='touch'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&this.host.contains(e.target)&&!e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-anchors,.cdt-selection-bar,.cdt-panel,.cdt-layers,.cdt-save-warning,.cdt-toolbar,.cdt-color-popup,.canvas-controls,.canvas-menu'))this.pointerDown(e);},true);
    for(const type of ['mousedown','mouseup','click','dblclick'])this.listen(this.doc,type,e=>{if(this.ready&&this.drawing&&this.tool==='shape'&&!this.space&&!this.canvas.isHoldingSpace&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&this.host.contains(e.target)&&!e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-anchors,.cdt-selection-bar,.cdt-panel,.cdt-layers,.cdt-save-warning,.cdt-toolbar,.cdt-color-popup,.canvas-controls,.canvas-menu')){e.preventDefault();e.stopImmediatePropagation();}},true);
    this.listen(this.doc,'pointerdown',e=>{if(this.ready&&this.drawing&&this.isActive()&&!this.space&&!this.canvas.isHoldingSpace&&e.button===2&&!e.ctrlKey&&!e.altKey&&!(e.pointerType==='pen'&&this.plugin.settings.penButton!=='none')&&this.host.contains(e.target)&&!e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-anchors,.cdt-selection-bar,.cdt-panel,.cdt-layers,.cdt-save-warning,.cdt-toolbar,.cdt-color-popup,.canvas-controls,.canvas-card-menu,.canvas-menu'))this.pointerDown(e);},true);
    for(const type of ['mousedown','mousemove','mouseup'])this.listen(this.doc,type,e=>{if(this.colorUI.pick&&(this.colorUI.pick.held||this.colorUI.pick.released)&&(e.button===2||(e.buttons&2))){e.preventDefault();e.stopImmediatePropagation();}},true);
    this.listen(this.host,'pointerdown',e=>this.pointerDown(e),true);
    this.listen(this.win,'pointermove',e=>this.pointerMove(e),true);
    this.listen(this.win,'pointerup',e=>this.pointerUp(e),true);
    this.listen(this.win,'pointercancel',e=>this.pointerUp(e),true);
    this.listen(this.doc,'keydown',e=>this.keyDown(e),true);
    this.listen(this.host,'pointerleave',()=>require('./layer-pick').clearHover(this));
    this.listen(this.win,'blur',()=>{require('./layer-pick').clearHover(this);this.colorUI?.cancelPick();});
    this.toolShift=new ToolShift(this);
    this.listen(this.doc,'keyup',e=>{this.toolShift.up(e);if(e.key==='Alt')require('./layer-pick').clearHover(this);if(e.code==='ShiftLeft'||e.code==='ShiftRight')this.linePreview?.replaceChildren();if(e.code==='Space')this.space=false;if(e.key==='Control'&&!this.selection.drag)this.restoreCtrlObject();if(e.key.toUpperCase()===this.plugin.settings.shortcuts.move)this.restoreTemporaryTool();},true);
    this.listen(this.win,'blur',()=>{this.toolShift.restore();this.textItems.cancel();this.space=false;this.restoreTemporaryTool();this.settle(false);this.plugin.flush();});
    this.listen(this.win,'beforeunload',()=>{this.settle();this.plugin.store.checkpoint();});
    this.listen(this.doc,'visibilitychange',()=>{if(this.doc.hidden){this.settle();this.plugin.flush();}});
    this.observer=new this.win.MutationObserver(()=>this.scheduleRender());
    this.observer.observe(this.canvas.canvasEl,{attributes:true,attributeFilter:['style']});
    this.resize=new this.win.ResizeObserver(()=>this.scheduleRender()); this.resize.observe(this.host);
    this.preview();
  }
  protect(error) { this.loadError=error.message; this.ready=false; this.setMode(false); this.showStatus(); }
  showStatus() {
    const error=this.loadError || this.record?.error;
    this.notice.hidden=!error; this.statusText.textContent=error ? `Drawing 저장 보호: ${error}` : '';
    this.retry.hidden=!!this.loadError;
  }
  setMode(on) {
    if(this.view.file!==this.file) {this.plugin.sync();return;}
    if (on && !this.ready) {new Notice(this.loadError || '그림 데이터를 준비하고 있습니다.');return;}
    this.figures?.confirm();this.textItems?.cancel();this.selection?.confirm(false);this.selection?.end();this.colorUI?.close();this.finishStroke(); this.plugin.flush(); this.drawing=on;this.linePreview?.replaceChildren();if(on&&this.tool==='text')this.tool='brush';
    this.panel.hidden=this.layers.hidden=this.tools.hidden=!on;this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;this.colorPopup.hidden=true;
    this.toggle.classList.toggle('is-active',on); this.toggle.setAttribute('aria-pressed',String(on));
    this.toggle.title=on?'Drawing 툴바 끄기':'Drawing 툴바 켜기'; this.toggle.setAttribute('aria-label',this.toggle.title);
    this.host.classList.toggle('cdt-drawing',on);this.plugin.keyboard?.update();this.visibility?.apply();this.refreshControls();if(on&&this.plugin.settings.colorCollapsed===false)this.colorUI?.open();this.scheduleRender();
  }
  settle(blurText=true){require('./layer-pick').clearHover(this);this.figures?.confirm();this.selection?.confirm(false);this.selection?.end();this.restoreCtrlObject();this.finishStroke();this.colorUI?.close();if(blurText)for(const n of this.canvas.nodes.values())if(n.isEditing)n.blur();}
  isActive() { return this.plugin.app.workspace.activeLeaf?.view===this.view; }
  keyDown(event,fromScope=false) {
    if(!fromScope&&this.plugin.keyboard?.handled.has(event))return;
    if(this.view.file!==this.file)return;
    if (!this.isActive() || event.target.closest('input,textarea,select,[contenteditable=true],.modal')) return;
    if(require('./keyboard-keys').keyOf(event)===this.plugin.settings.shortcuts.drawing){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)this.setMode(!this.drawing);return;}
    if(!this.drawing)return;
    if(event.key==='Alt'&&!event.repeat&&this.lastPointer)require('./layer-pick').hover(this,{target:this.lastPointer.target,clientX:this.lastPointer.clientX,clientY:this.lastPointer.clientY,buttons:this.lastPointer.buttons,altKey:true,ctrlKey:event.ctrlKey,metaKey:event.metaKey});
    if(this.toolShift.down(event))return;
    if(require('./ui-actions').handle(this,event))return;
    const assigned=this.plugin.settings.presets.find(p=>p.shortcut&&p.shortcut===shortcutKey(event));if(assigned){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)this.brushUI.choose(assigned);return;}
    if(event.code==='Escape'&&this.colorUI.pick){event.preventDefault();event.stopImmediatePropagation();this.colorUI.close();return;}
    if(this.anchors?.picking&&event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();this.anchors.cancel();return;}
    if((event.ctrlKey||event.metaKey)&&event.code==='KeyZ'&&this.nativeDrawingUndoAt){event.preventDefault();event.stopImmediatePropagation();return;}
    if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey){const k=event.key.toUpperCase(),q=this.plugin.settings,keys=q.shortcuts;let handled=true;
      if(k===keys.drawing){if(!event.repeat)this.setMode(!this.drawing);}
      else if(k===keys.color){if(!event.repeat)this.colorUI.toggle();}
      else if(k===keys.layers){if(!event.repeat)this.workspaceUI.toggle('layersCollapsed');}
      else if(this.drawing&&k===keys.swap){if(!event.repeat)this.selectColorSlot(q.activeColor==='main'?'secondary':'main');}
      else if(this.drawing&&k===keys.transparent){if(!event.repeat){this.toggleTransparentColor();}}
      else if(this.drawing&&k===keys.mix){if(!event.repeat){const p=selected(q,'brush');p.mix=!p.mix;this.brushUI.save();if(this.tool==='brush')this.brushUI.render();}}
      else if(this.drawing&&k===keys.selection){if(!event.repeat){q.selectionMethod=['rectangle','lasso'].includes(this.tool)?(this.tool==='rectangle'?'lasso':'rectangle'):(q.selectionMethod||'rectangle');this.selectTool(q.selectionMethod);}}
      else if(k===keys.quick){if(!event.repeat)this.quickTools.toggle();}
      else if(this.drawing&&k===keys.shape)this.selectTool('shape');
      else if(this.drawing&&k===keys.move){if(!event.repeat&&!this.temporaryTool){this.temporaryTool=this.tool;this.selectTool('move-layer');}}
      else handled=false;if(handled){event.preventDefault();event.stopImmediatePropagation();return;}}
    if(this.drawing&&this.quickTools?.handleKey(event))return;
    if(this.figures?.key(event))return;
    if(this.tool!=='text'&&this.selection?.key(event))return;
    if(event.code==='Space'){this.space=true;this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;}
    if(this.drawing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      if(event.key.toUpperCase()===this.plugin.settings.shortcuts.brush){event.preventDefault();event.stopImmediatePropagation();this.selectTool('brush');return;}
      if(event.key.toUpperCase()===this.plugin.settings.shortcuts.eraser){event.preventDefault();event.stopImmediatePropagation();this.selectTool('eraser');return;}
    }
    if(this.drawing){const match=this.plugin.settings.presets.find(p=>p.shortcut&&p.shortcut===shortcutKey(event));if(match){event.preventDefault();event.stopImmediatePropagation();this.brushUI.choose(match);}
    }
    if(this.drawing && this.tool!=='text' && (event.ctrlKey || event.metaKey) && event.code==='KeyZ') {
      event.preventDefault();event.stopImmediatePropagation();if(!this.nativeDrawingUndoAt)this.undoDrawing(event.shiftKey);
    }
  }
  restoreCtrlObject(){if(!this.ctrlObject)return;const tool=this.ctrlObject;this.ctrlObject=null;this.selectTool(tool);}
  restoreTemporaryTool(){if(!this.temporaryTool)return;const tool=this.temporaryTool;this.temporaryTool=null;this.selectTool(tool);}
  toggleTransparentColor(){const q=this.plugin.settings;q.transparentColor=!q.transparentColor;if(this.figures.pending){this.figures.pending.transparentColor=q.transparentColor;this.figures.preview();}this.colorUI.sync();if(this.lastPointer)this.updateCursor(this.lastPointer);this.plugin.saveData(q);}
  selectColorSlot(slot){const q=this.plugin.settings;q.transparentColor=false;q.activeColor=slot;q.color=slot==='main'?q.mainColor:q.secondaryColor;if(this.tool==='shape'){q.shapeStyle.color=q.color;if(this.figures.pending){this.figures.pending.transparentColor=false;this.figures.pending.color=q.color;this.figures.preview();}}this.colorUI.sync();this.refreshControls();this.plugin.saveData(q);}
  undoDrawing(redo=false){if(this.figures?.pending){if(!redo)this.figures.undoPoint();return;}this.selection.end();this.finishStroke();const r=this.record;if(r.history.travel(redo)){this.engine.load(r.data).then(()=>this.scheduleRender());this.plugin.refreshLayers(r);this.plugin.store.changed(r);this.plugin.repaint(r);this.plugin.queueSave();}}
  point(event) {
    const c=this.canvas.canvasEl,rect=c.getBoundingClientRect(),scale=rect.width/c.offsetWidth;
    return [(event.clientX-rect.left)/scale,(event.clientY-rect.top)/scale];
  }
  brushPoint(event,layer){const p=this.point(event);return [p[0]-(layer?.offset?.x||0),p[1]-(layer?.offset?.y||0)];}
  pointerDown(event) {
    require('./layer-pick').clearHover(this);
    if(this.view.file!==this.file || this.canvas.data?.canvasDrawing?.id!==this.record?.data.id) {
      if(this.drawing){event.preventDefault();event.stopImmediatePropagation();}
      this.plugin.sync();return;
    }
    if(this.ready&&this.anchors?.down(event))return;
    if(this.ready&&!this.drawing&&this.tool==='text'&&!event.target.closest('.cdt-history,.cdt-panel-edge,.cdt-panel,.cdt-layers,.cdt-toolbar,.cdt-color-popup,.canvas-controls,.canvas-menu,.canvas-card-menu')){this.textItems.down(event);return;}
    if(!this.ready || !this.drawing || this.space || this.canvas.isHoldingSpace || this.active || event.pointerType==='touch') return;
    if(event.target.closest('.cdt-history,.cdt-panel-edge,.cdt-anchors,.cdt-selection-bar,.cdt-panel,.cdt-layers,.cdt-save-warning,.cdt-toolbar,.cdt-color-popup,.canvas-controls,.canvas-card-menu,.canvas-menu'))return;
    if(event.button===0&&(event.ctrlKey||event.altKey)&&!(event.ctrlKey&&event.altKey)&&!(event.altKey&&['rectangle','lasso'].includes(this.tool))&&!this.selection.pasting&&require('./layer-pick').down(this,event))return;
    if(this.selection.pasting){this.selection.safe(()=>this.selection.down(event));return;}
    if(event.button===2&&!event.ctrlKey&&!event.altKey&&!(event.pointerType==='pen'&&this.plugin.settings.penButton!=='none')){event.preventDefault();event.stopImmediatePropagation();this.finishStroke();this.colorUI.pick={tool:this.tool,popup:!this.colorPopup.hidden,held:true,pointerId:event.pointerId};this.host.classList.add('cdt-picking-color');this.colorUI.down(event);return;}
    if(this.colorUI.pick){this.colorUI.down(event);return;}
    const device=this.plugin.settings;
    const side=event.pointerType==='pen'&&(event.button===2||(event.buttons&2)),back=event.pointerType==='pen'&&(event.button===5||(event.buttons&32));
    if(side&&event.ctrlKey){this.startPenZoom(event);return;}
    if(event.ctrlKey&&event.altKey&&event.button===0&&['brush','eraser'].includes(this.tool)){event.preventDefault();event.stopImmediatePropagation();this.sizeDrag={id:event.pointerId,x:event.clientX,y:event.clientY,size:selected(device,this.tool).size};this.host.classList.add('cdt-size-adjusting');this.host.setPointerCapture(event.pointerId);this.updateCursor(event);return;}
    if(event.ctrlKey&&!event.altKey&&!event.metaKey&&event.button===0&&!side&&!back&&this.tool!=='move-layer'){this.ctrlObject=this.tool;this.selectTool('move-layer');}
    if(this.tool==='shape'){this.figures.down(event);return;}
    if(this.tool==='text'){this.textItems.down(event);return;}
    if(this.selection.pasting||['rectangle','lasso','move-layer'].includes(this.tool)){this.selection.safe(()=>this.selection.down(event));if(this.ctrlObject&&!this.selection.drag){const tool=this.ctrlObject;this.ctrlObject=null;this.selectTool(tool);}return;}
    if(device.inputMode==='pen'&&event.pointerType!=='pen')return;
    if(side&&device.penButton==='pan'){event.preventDefault();event.stopImmediatePropagation();this.penPan={id:event.pointerId,x:event.clientX,y:event.clientY};this.host.setPointerCapture(event.pointerId);return;}
    const temporary=back||(side&&device.penButton==='eraser');
    if(event.button!==0&&!temporary)return;
    event.preventDefault();event.stopImmediatePropagation();
    // A settings input must not retain keyboard focus after starting a stroke.
    this.doc.activeElement?.blur();
    if([...this.plugin.sessions.values()].some(s=>s!==this&&s.record===this.record&&s.active))return;
    const r=this.record;
    let layer=r.data.layers.find(l=>l.id===r.data.selectedLayers[0]),firstParent=null;
    if(layer?.type==='group'&&!r.data.layers.some(l=>l.type==='layer')){if([layer,...ancestors(r.data,layer)].some(l=>!l.visible||l.locked)){new Notice('숨김 또는 잠긴 그룹에는 그릴 수 없습니다.');return;}firstParent=layer.id;layer=null;}
    if(!layer&&r.data.layers.some(l=>l.type==='layer')){new Notice('그릴 레이어를 선택해주세요.');return;}
    if(layer?.type==='group'){new Notice('그룹 안의 레이어를 선택해주세요.');return;}
    if(layer&&!writable(r.data,layer)){new Notice('숨김 또는 잠긴 레이어에는 그릴 수 없습니다.');return;}
    if(layer?.alphaLock&&(temporary||this.tool==='eraser'||device.transparentColor)){new Notice('투명 부분 잠금 중에는 지울 수 없습니다.');return;}
    r.history.push(snapshot(r.data));
    if(!layer){layer=makeLayer('Layer 1','layer',firstParent);layer.anchor=clone(r.data.layers.find(l=>l.id===firstParent)?.anchor||null);r.data.layers.push(layer);r.data.selectedLayers=[layer.id];this.layerUI.render();}
    const presetTool=temporary?'eraser':this.tool,tool=device.transparentColor?'eraser':presetTool,p=selected(device,presetTool),st=clone(p);if(device.transparentColor)st.mix=false;
    const stabilizer=new Stabilizer(p.stabilization),raw=this.brushPoint(event,layer),point=inputPoint(...raw,event,p,device);
    const stroke={...freezeMaterials(st,r.data),id:randomUUID(),layerId:layer.id,alphaLock:layer.alphaLock,tool,color:device.color,points:[stabilizer.add(point,event.timeStamp)]};
    if(stroke.mix&&stroke.mixSource==='visible')stroke.mixSamples=[this.engine.sample(...raw.map((v,i)=>v+(i?layer.offset?.y||0:layer.offset?.x||0)))];
    if(this.selection.regions?.length)stroke.selectionClip=this.selection.regions.map(r=>({op:r.op,points:r.points.map(pt=>[pt[0]-(layer.offset?.x||0),pt[1]-(layer.offset?.y||0)])}));
    const origin=event.shiftKey&&this.lineOrigin?.tool===presetTool&&this.lineOrigin.layerId===layer.id?this.lineOrigin:null;
    if(origin&&device.brushSnapEnabled&&presetTool==='brush'){const snapped=require('./brush-snap').point(origin.point,point,device.brushSnapAngle);point.splice(0,point.length,...snapped);}
    if(origin){stroke.points=[origin.point.slice(),point];if(stroke.mixSamples)stroke.mixSamples=[this.engine.sample(origin.point[0]+(layer.offset?.x||0),origin.point[1]+(layer.offset?.y||0)),stroke.mixSamples[0]];}
    this.linePreview?.replaceChildren();
    delete stroke.defaults;delete stroke.quick;delete stroke.shortcut;
    r.data.version=Math.max(r.data.version,stroke.mix&&stroke.mixType?10:stroke.selectionClip?9:8);
    r.data.strokes.push(stroke);this.plugin.store.changed(r);
    this.active={referenceTiles:stroke.mixSamples?new Map(this.engine.tiles):null,id:event.pointerId,stroke,stabilizer,preset:st,settings:clone(device),temporary,straight:!!origin,snap:device.brushSnapEnabled&&presetTool==='brush'&&!origin?device.brushSnapAngle:null};this.host.setPointerCapture(event.pointerId);
    this.plugin.repaint(r);
  }
  previewLine(e){if(!this.linePreview){this.linePreview=this.doc.createElementNS('http://www.w3.org/2000/svg','svg');this.linePreview.classList.add('cdt-straight-preview');this.host.append(this.linePreview);}this.linePreview.replaceChildren();if(!e.shiftKey||!this.drawing||this.space||!this.host.contains(e.target)||this.active||!['brush','eraser'].includes(this.tool)||this.lineOrigin?.tool!==this.tool||e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-panel,.cdt-layers,.cdt-toolbar'))return;const l=this.record.data.layers.find(l=>l.id===this.lineOrigin.layerId);if(!l||l.id!==this.record.data.selectedLayers[0])return;const hr=this.host.getBoundingClientRect(),cr=this.canvas.canvasEl.getBoundingClientRect(),scale=cr.width/this.canvas.canvasEl.offsetWidth,a=this.lineOrigin.point,shape=this.doc.createElementNS(this.linePreview.namespaceURI,'line');for(const[k,v]of Object.entries({x1:a[0]*scale+(l.offset?.x||0)*scale+cr.left-hr.left,y1:a[1]*scale+(l.offset?.y||0)*scale+cr.top-hr.top,x2:e.clientX-hr.left,y2:e.clientY-hr.top,stroke:this.tool==='eraser'||this.plugin.settings.transparentColor?'#888':this.plugin.settings.color,'stroke-width':Math.max(1,selected(this.plugin.settings,this.tool).size*scale),'stroke-opacity':.3,'stroke-linecap':'round'}))shape.setAttribute(k,v);if(this.tool==='brush'&&this.plugin.settings.brushSnapEnabled){const end=require('./brush-snap').point(a,this.brushPoint(e,l),this.plugin.settings.brushSnapAngle);shape.setAttribute('x2',(end[0]+(l.offset?.x||0))*scale+cr.left-hr.left);shape.setAttribute('y2',(end[1]+(l.offset?.y||0))*scale+cr.top-hr.top);}if(this.tool==='eraser'||this.plugin.settings.transparentColor){const x=Number(shape.getAttribute('x1')),y=Number(shape.getAttribute('y1')),dx=Number(shape.getAttribute('x2'))-x,dy=Number(shape.getAttribute('y2'))-y,w=Number(shape.getAttribute('stroke-width')),rect=this.doc.createElementNS(this.linePreview.namespaceURI,'rect');for(const[k,v]of Object.entries({x:-w/2,y:-w/2,width:Math.hypot(dx,dy)+w,height:w,rx:w/2,fill:'none',stroke:'#777','stroke-width':1,'stroke-dasharray':'4 3',transform:'translate('+x+' '+y+') rotate('+(Math.atan2(dy,dx)*180/Math.PI)+')'}))rect.setAttribute(k,v);this.linePreview.append(rect);}else this.linePreview.append(shape);}
  startPenZoom(event) {
    event.preventDefault();event.stopImmediatePropagation();this.finishStroke();
    this.penZoom={id:event.pointerId,x:event.clientX,zoom:this.canvas.tZoom,center:this.canvas.domPosFromEvt(event)};
    this.host.setPointerCapture(event.pointerId);this.host.classList.add('cdt-pen-zoom');this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;
  }
  pointerMove(event) {
    if(this.colorUI.pick){this.lastPointer=event;this.colorUI.move(event);this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;return;}
    this.lastPointer=event;if(['rectangle','lasso'].includes(this.tool))require('./layer-pick').hover(this,event);this.anchors?.move(event);if(require('./layer-pick').move(this,event))return;
    if(this.figures.move(event)||this.textItems.move(event))return;
    if(this.selection.safe(()=>this.selection.move(event)))return;
    const wantsZoom=event.pointerType==='pen'&&event.ctrlKey&&!!(event.buttons&2);
    if(this.penZoom?.id===event.pointerId){
      event.preventDefault();event.stopImmediatePropagation();this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;
      if(!wantsZoom){this.finishStroke();return;}
      const target=this.penZoom.zoom+(event.clientX-this.penZoom.x)/200;
      this.canvas.zoomBy(target-this.canvas.tZoom,this.penZoom.center);this.canvas.finishViewportAnimation=true;return;
    }
    if(wantsZoom&&this.drawing&&this.ready&&!this.space&&!this.sizeDrag&&this.view.file===this.file&&!event.target.closest('.cdt-history,.cdt-panel-edge,.cdt-anchors,.cdt-panel,.cdt-layers,.cdt-toolbar,.cdt-color-popup,.canvas-controls,.canvas-card-menu,.canvas-menu')){this.startPenZoom(event);return;}
    this.updateCursor(event);this.previewLine(event);
    if(this.active?.snap){this.snapBrush(event);return;}
    if(this.active?.straight)return;
    if(event.pointerType==='pen'&&event.buttons){
      const side=!!(event.buttons&2),back=!!(event.buttons&32),mode=this.plugin.settings.penButton;
      const wantsPan=side&&mode==='pan',temporary=back||(side&&mode==='eraser');
      if((this.penPan&&!wantsPan)||(this.active&&(wantsPan||temporary!==!!this.active.temporary))){
        this.finishStroke();
        const next=new Proxy(event,{get:(target,key)=>key==='button'?(back?5:side?2:0):typeof target[key]==='function'?target[key].bind(target):target[key]});
        this.pointerDown(next);return;
      }
    }

    if(this.sizeDrag?.id===event.pointerId){event.preventDefault();event.stopImmediatePropagation();selected(this.plugin.settings,this.tool).size=Math.max(1,Math.min(1000,Math.round(this.sizeDrag.size+(event.clientX-this.sizeDrag.x)/2)));for(const el of this.panel.querySelectorAll('[data-cdt-field="size"]'))el.value=selected(this.plugin.settings,this.tool).size;this.updateCursor(event);return;}
    if(this.penPan?.id===event.pointerId){this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;event.preventDefault();event.stopImmediatePropagation();const scale=this.canvas.canvasEl.getBoundingClientRect().width/this.canvas.canvasEl.offsetWidth;this.canvas.panBy(-(event.clientX-this.penPan.x)/scale,-(event.clientY-this.penPan.y)/scale);this.penPan.x=event.clientX;this.penPan.y=event.clientY;return;}
    if(!this.active || event.pointerId!==this.active.id)return;
    event.preventDefault();event.stopImmediatePropagation();
    const samples=event.getCoalescedEvents?.() || [event];
    for(const sample of samples.length?samples:[event]){const pt=inputPoint(...this.brushPoint(sample,this.record.data.layers.find(l=>l.id===this.active.stroke.layerId)),sample,this.active.preset,this.active.settings);const point=this.active.stabilizer.add(pt,sample.timeStamp);this.active.stroke.points.push(point);if(this.active.stroke.mixSamples){const l=this.record.data.layers.find(l=>l.id===this.active.stroke.layerId);const x=point[0]+(l.offset?.x||0),y=point[1]+(l.offset?.y||0),tx=Math.floor(x/256),ty=Math.floor(y/256);this.active.stroke.mixSamples.push(Array.from(this.active.referenceTiles.get(tx+','+ty)?.c.getContext('2d').getImageData(Math.floor(x-tx*256),Math.floor(y-ty*256),1,1).data||[0,0,0,0]));}}
    this.plugin.store.changed(this.record);this.plugin.repaint(this.record);
  }
  snapBrush(event){const a=this.active;if(!a?.snap||a.id!==event.pointerId)return;event.preventDefault();event.stopImmediatePropagation();const l=this.record.data.layers.find(l=>l.id===a.stroke.layerId),end=require('./brush-snap').point(a.stroke.points[0],inputPoint(...this.brushPoint(event,l),event,a.preset,a.settings),a.snap),next={...a.stroke,points:[a.stroke.points[0],end]};if(next.mixSamples){next.mixSamples=next.points.map(p=>{const x=p[0]+(l.offset?.x||0),y=p[1]+(l.offset?.y||0),tx=Math.floor(x/256),ty=Math.floor(y/256);return Array.from(a.referenceTiles.get(tx+','+ty)?.c.getContext('2d').getImageData(Math.floor(x-tx*256),Math.floor(y-ty*256),1,1).data||[0,0,0,0]);});}const index=this.record.data.strokes.indexOf(a.stroke);this.record.data.strokes[index]=next;a.stroke=next;this.plugin.store.changed(this.record);this.plugin.repaint(this.record);}
  pointerUp(event) {
    if(this.active?.snap&&event.type!=='pointercancel'&&!(event.pointerType==='pen'&&event.pressure===0))this.snapBrush(event);
    if(this.colorUI.up(event))return;
    if(require('./layer-pick').up(this,event))return;
    if(this.figures.up(event)||this.textItems.up(event))return;
    if(this.selection.safe(()=>this.selection.up(event))){if(this.ctrlObject){const tool=this.ctrlObject;this.ctrlObject=null;this.selectTool(tool);}return;}
    if(this.sizeDrag?.id===event.pointerId||this.penPan?.id===event.pointerId||this.penZoom?.id===event.pointerId){if(this.sizeDrag)this.brushUI.save();event.preventDefault();event.stopImmediatePropagation();if(this.host.hasPointerCapture(event.pointerId))this.host.releasePointerCapture(event.pointerId);this.sizeDrag=this.penPan=this.penZoom=null;this.host.classList.remove('cdt-size-adjusting','cdt-pen-zoom');this.updateCursor(event);return;}
    if(!this.active || event.pointerId!==this.active.id)return;
    event.preventDefault();event.stopImmediatePropagation();this.finishStroke();
  }
  finishStroke() {
    if(this.sizeDrag)this.brushUI.save();
    for(const gesture of [this.sizeDrag,this.penPan,this.penZoom])if(gesture&&this.host.hasPointerCapture(gesture.id))this.host.releasePointerCapture(gesture.id);this.sizeDrag=this.penPan=this.penZoom=null;this.host.classList.remove('cdt-size-adjusting','cdt-pen-zoom');this.cursor.hidden=true;if(this.mixHint)this.mixHint.hidden=true;
    if(!this.active)return;
    if(this.host.hasPointerCapture(this.active.id))this.host.releasePointerCapture(this.active.id);
    const done=this.active.stroke,layer=this.record.data.layers.find(l=>l.id===done.layerId);this.lineOrigin={tool:this.active.temporary?'eraser':this.tool,layerId:done.layerId,point:done.points.at(-1).slice()};
    freeze(done);for(const a of Object.values(this.record.data.assets||{}))freeze(a);this.active=null;if(this.selection.regions?.length)this.selection.prepareRegions(this.selection.regions);this.plugin.repaint(this.record);this.plugin.queueSave();
  }
  scheduleRender() {
    if(this.frame || this.disposed)return;
    this.frame=this.win.requestAnimationFrame(()=>{this.frame=null;this.render();});
  }
  selectTool(tool) {require('./layer-pick').clearHover(this);this.linePreview?.replaceChildren();if(!this.quickTools?.selecting)this.quickTools?.close();this.figures?.confirm();this.textItems?.cancel();if(this.tool==='text')for(const n of this.canvas.nodes.values())if(n.isEditing)n.blur();this.finishStroke();if(['brush','eraser','rectangle','lasso'].includes(tool)&&this.selection?.regions?.length)this.selection.confirm(true);else{this.selection?.confirm(false);this.selection?.end();}this.tool=tool;if(tool==='move-layer'&&this.ready)this.selection.safe(()=>this.selection.prepare(null));if(['brush','eraser'].includes(tool))this.brushUI.render();this.refreshControls();if(!this.temporaryTool&&!this.ctrlObject)this.workspaceUI?.remember();this.scheduleRender();}
  refreshControls() {if(this.mixHint)this.mixHint.hidden=true;
    this.host.classList.toggle('cdt-text-tool',this.tool==='text');this.figures?.panelRender();
    for(const [tool,b]of Object.entries(this.editButtons||{})){const active=this.tool===tool||(tool==='rectangle'&&this.tool==='lasso');b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));if(tool==='rectangle'){setIcon(b,this.tool==='lasso'?'lasso':'scan');b.title='선택 영역 · '+(this.tool==='lasso'?'올가미':'사각형')+' (W: 전환)';}}if(this.panel)this.panel.hidden=!this.drawing||!['brush','eraser'].includes(this.tool);
    this.host.classList.toggle('cdt-editing',!['brush','eraser'].includes(this.tool));
    this.brushButton.classList.toggle('is-active',this.tool==='brush');this.eraserButton.classList.toggle('is-active',this.tool==='eraser');
    this.brushButton.setAttribute('aria-pressed',String(this.tool==='brush'));this.eraserButton.setAttribute('aria-pressed',String(this.tool==='eraser'));this.colorButton.style.color=this.toolColor();if(this.colorInput)this.colorInput.value=this.toolColor();this.quickTools?.render();this.workspaceUI?.applyLayout();this.brushUI?.scrollSelected();
  }
  toolColor(){return this.tool==='shape'?this.plugin.settings.shapeStyle.color:this.tool==='text'?(this.textItems?.current?.unknownData.cdtText.color||this.plugin.settings.textStyle.color):this.plugin.settings.color;}
  setToolColor(color){const q=this.plugin.settings;q.transparentColor=false;q[q.activeColor==='secondary'?'secondaryColor':'mainColor']=color;q.color=color;if(this.tool==='shape'){this.plugin.settings.shapeStyle.color=color;if(this.figures.pending){this.figures.pending.transparentColor=false;this.figures.pending.color=color;this.figures.preview();}this.figures.panelRender();}else if(this.tool==='text'){this.plugin.settings.textStyle.color=color;const n=this.textItems.current;if(n){n.unknownData.cdtText={...n.unknownData.cdtText,color};this.textItems.decorate(n);this.canvas.requestSave();}this.figures.panelRender();}else this.plugin.settings.color=color;for(const s of this.plugin.sessions.values()){s.colorButton.style.color=s.toolColor();s.colorUI?.sync();}this.plugin.saveData(this.plugin.settings);}
  updateCursor(event) {
    const hr=this.host.getBoundingClientRect(),target=event.target;
    const allowed=!this.colorUI?.pick&&['brush','eraser'].includes(this.tool)&&this.drawing&&!this.penZoom&&(!!this.sizeDrag||(!this.space&&this.host.contains(target)&&!target.closest('.cdt-history,.cdt-panel-edge,.cdt-toolbar,.cdt-panel,.cdt-layers,.cdt-color-popup,.canvas-controls')));
    this.cursor.hidden=!allowed;if(this.mixHint)this.mixHint.hidden=true;if(!allowed)return;
    const cr=this.canvas.canvasEl.getBoundingClientRect(),scale=cr.width/this.canvas.canvasEl.offsetWidth;
    const preset=selected(this.plugin.settings,this.active?.temporary?'eraser':this.tool),f=inputPoint(0,0,event,preset,this.plugin.settings),size=preset.size*(preset.tipScale??1)*scale*(!this.sizeDrag&&this.plugin.settings.cursorPressure&&event.buttons?f[2]:1);
    if(this.mixHint){this.mixHint.hidden=!(this.tool==='brush'&&!this.active?.temporary&&preset.mix&&!this.plugin.settings.transparentColor);Object.assign(this.mixHint.style,{left:(event.clientX-hr.left+14)+'px',top:(event.clientY-hr.top+16)+'px'});}updateTipCursor(this,preset);const mode=this.plugin.settings.cursorMode;this.cursor.classList.toggle('cdt-hotspot',mode!=='tip');this.cursor.classList.toggle('cdt-hotspot-only',mode==='hotspot');
    Object.assign(this.cursor.style,{left:((this.sizeDrag?.x??event.clientX)-hr.left)+'px',top:((this.sizeDrag?.y??event.clientY)-hr.top)+'px',width:(size*preset.roundness)+'px',height:size+'px',transform:`translate(-50%,-50%) rotate(${preset.angle+(this.sizeDrag?0:f[5])}deg)`});
  }
  preview() {this.brushUI?.previewsRefresh();}
  paintPreview(canvas,p,globalCurve) {
    const settings={...this.plugin.settings,globalCurve:globalCurve||this.plugin.settings.globalCurve,inputMode:'automatic'},engine=new DrawingEngine(()=>this.doc.createElement('canvas'));
    const points=Array.from({length:81},(_,i)=>{const t=i/80;return inputPoint(15+190*t,32-13*Math.sin(t*Math.PI*2),{pointerType:'pen',pressure:Math.sin(Math.PI*t),tiltX:20,tiltY:10},p,settings);});
    engine.sync([{...p,id:'preview',tool:'brush',mix:false,size:4+Math.log2(1+p.size)*2.2,color:'#eee9f5',points}]);
    const c=canvas.getContext('2d');c.clearRect(0,0,220,64);engine.render(c);
  }
  render() {
    if(this.disposed || !this.record)return;
    if(this.view.file!==this.file) {
      const c=this.raster.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.raster.width,this.raster.height);
      return;
    }
    const cr=this.canvas.canvasEl.getBoundingClientRect(),hr=this.host.getBoundingClientRect();
    const scale=cr.width/this.canvas.canvasEl.offsetWidth,dpr=this.win.devicePixelRatio||1;
    if(!Number.isFinite(scale)||scale<=0||!hr.width||!hr.height)return;
    const width=Math.ceil(hr.width*dpr),height=Math.ceil(hr.height*dpr);
    if(this.raster.width!==width||this.raster.height!==height){this.raster.width=width;this.raster.height=height;}
    const c=this.raster.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);
    c.setTransform(scale*dpr,0,0,scale*dpr,(cr.left-hr.left)*dpr,(cr.top-hr.top)*dpr);
    const active=[...this.plugin.sessions.values()].find(s=>s.record===this.record&&s.active)?.active?.stroke.id;
    this.historyUI?.updateBusy();this.anchors?.sync();if(this.figures.pending&&this.figures.pending.revision!==this.record.data.revision)this.figures.cancel();this.paper.render();this.engine.sync(this.figures.previewData||this.selection.previewData||this.record.data,this.figures.pending?.id||active,this.layerUI.solo,this.paper.backdrop());
    this.engine.render(c,{left:(hr.left-cr.left)/scale,top:(hr.top-cr.top)/scale,right:(hr.right-cr.left)/scale,bottom:(hr.bottom-cr.top)/scale});
    if(!this.figures.pending&&!active&&!this.layers.hidden){this.layerUI.refreshThumbnails();this.thumbAt=Date.now();}this.selection.render();this.figures.render();this.anchors?.render();
  }
  destroy() {
    this.figures?.confirm();this.finishStroke();this.plugin.flush();this.disposed=true;
    this.zoomExtension?.();
    for(const off of this.listeners)off();
    clearTimeout(this.layerTipTimer);this.layerTip?.remove();this.linePreview?.remove();this.visibility?.destroy();this.quickTools?.destroy();this.colorUI?.destroy();this.workspaceUI?.destroy();this.figures?.destroy();this.textItems?.destroy();this.anchors?.destroy();this.brushUI.destroy();this.selection.destroy();this.paper.destroy();
    this.historyUI?.destroy();this.engine?.dispose();this.observer.disconnect();this.resize.disconnect();if(this.frame)this.win.cancelAnimationFrame(this.frame);
    if(this.canvas.getData===this.wrappedGetData)this.canvas.getData=this.originalGetData;
    for(const el of [this.toolbar,this.raster,this.panel,this.layers,this.notice,this.colorPopup,this.cursor,this.mixHint])el.remove();
    this.host.classList.remove('cdt-drawing','cdt-editing','cdt-session');
  }
}




