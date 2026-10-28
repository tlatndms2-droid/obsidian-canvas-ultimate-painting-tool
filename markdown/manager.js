'use strict';
const {Plugin,Notice}=require('obsidian');
const {ViewPlugin}=require('@codemirror/view');
const {MarkdownSession}=require('./md-session');
module.exports=class MdDrawingPlugin extends Plugin {
 async onload(){
  this.data=await this.loadData()||{notes:{}};this.data.notes??={};this.sessions=new Map();this.editors=new Set();this.saveQueue=Promise.resolve();this.pending=new Set();
  const owner=this;
  this.registerEditorExtension(ViewPlugin.fromClass(class{
   constructor(view){this.view=view;owner.editors.add(this);queueMicrotask(()=>owner.sync());}
   update(update){const s=[...owner.sessions.values()].find(s=>s.cm===this.view);if(s&&s.file===s.leaf.view.file)s.updateText(update);else queueMicrotask(()=>owner.sync());}
   destroy(){owner.editors.delete(this);owner.sync();}
  }));
  for(const event of ['file-open','layout-change','active-leaf-change'])this.registerEvent(this.app.workspace.on(event,()=>this.sync()));
  this.registerEvent(this.app.vault.on('rename',(file,old)=>{if(this.data.notes[old]){this.data.notes[file.path]=this.data.notes[old];delete this.data.notes[old];for(const s of this.sessions.values())if(s.file===file){s.record.data.sourcePath=file.path;s.plugin.store.changed(s.record);}this.persist();}}));
  this.registerInterval(window.setInterval(()=>this.sync(),500));
  const command=(id,name,key,action)=>this.addCommand({id,name,hotkeys:[{modifiers:['Mod','Alt'],key}],checkCallback:checking=>{const s=this.sessions.get(this.app.workspace.activeLeaf);if(!s?.ready)return false;if(!checking)action(s);return true;}});
  command('toggle-ink','그리기 / 타이핑 전환','D',s=>s.toggleInput());
  this.addCommand({id:'toggle-brush-pie',name:'브러시 파이 메뉴 열기 / 닫기',checkCallback:checking=>{const s=this.sessions.get(this.app.workspace.activeLeaf);if(!s?.ready)return false;if(!checking)s.toggleBrushPie();return true;}});
  command('toggle-eraser-pie','지우개 파이 메뉴 열기 / 닫기','E',s=>s.toggleEraserPie());
  command('toggle-brush-details','브러시 상세 파이 메뉴 열기 / 닫기','B',s=>s.toggleBrushDetails());
  command('toggle-color-pie','색상 파이 메뉴 열기 / 닫기','C',s=>s.colorUI.toggle());
  command('toggle-pie','지정 도구 파이 메뉴 열기 / 닫기','Q',s=>s.quickTools.toggle());
  command('toggle-navigator','네비게이터 열기 / 닫기','N',s=>s.navigator.toggle());
  this.app.workspace.onLayoutReady(()=>this.sync());
 }
 connect(){const drawing=this.integratedDrawing||this.app.plugins.getPlugin('canvas-drawing-tool-bar');if(!drawing?.store)return false;
  if(this.drawing===drawing)return true;
  this.drawing=drawing;const owner=this;
  this.bridge={get settings(){return drawing.settings},get sessions(){return new Map([...drawing.sessions,...owner.sessions])},app:this.app,store:drawing.store,
   saveData:q=>drawing.saveData(q),flush:()=>drawing.flush(),queueSave:()=>drawing.queueSave(),sync:()=>owner.sync(),
   repaint:r=>{drawing.repaint(r);for(const s of owner.sessions.values())if(s.record===r)s.scheduleRender();},
   refreshLayers:r=>{drawing.refreshLayers(r);for(const s of owner.sessions.values())if(s.record===r)s.layerUI.render();}
  };return true;
 }
 sync(){if(this.stopping)return;
  for(const s of this.sessions.values())if(!s.isActive())s.settle(false);
  const leaves=this.app.workspace.getLeavesOfType('markdown'),live=new Set([...this.editors].map(e=>e.view));
  for(const [leaf,s]of this.sessions)if(!leaves.includes(leaf)||leaf.view.editor?.cm!==s.cm||leaf.view.file!==s.file||!live.has(s.cm)||!s.host.isConnected||(!this.integratedDrawing&&!this.app.plugins.getPlugin('canvas-drawing-tool-bar'))){s.destroy();this.sessions.delete(leaf);}
  if(!this.connect())return;
  for(const leaf of leaves){const cm=leaf.view.editor?.cm;if(!leaf.view.file||!cm||!live.has(cm)||this.sessions.has(leaf)||this.pending.has(cm))continue;
   this.pending.add(cm);let s;
   try{s=new MarkdownSession(this,cm,leaf);this.sessions.set(leaf,s);s.initialize().catch(e=>{s.protect(e);new Notice('MD 필기를 열지 못했습니다: '+e.message)}).finally(()=>this.pending.delete(cm));}catch(e){this.pending.delete(cm);console.error('MD Drawing setup',e);new Notice('MD 도구 연결 실패: '+e.message);}
  }
 }
 persist(){const data=JSON.parse(JSON.stringify(this.data));this.saveQueue=this.saveQueue.catch(()=>{}).then(()=>this.saveData(data));return this.saveQueue;}
 inspect(){return[...this.sessions.values()].map(s=>s.inspect());}
 async onunload(){this.stopping=true;for(const s of this.sessions.values())s.destroy();this.sessions.clear();await this.drawing?.flush();await this.persist();}
};
