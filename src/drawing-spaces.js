'use strict';
const {validId,randomUUID}=require('./storage');
const {History}=require('./history');
const {LayerRenderer,upgradeLayers}=require('./layers');
const {seal}=require('./history-state');
const {defaults:paperDefaults}=require('./paper');
class DrawingSpaces{
 constructor(plugin){this.plugin=plugin;this.path='.canvas-drawing/spaces.json';this.data={version:1,canvases:{}};this.queue=Promise.resolve();}
 async load(){const a=this.plugin.app.vault.adapter;if(await a.exists(this.path)){const data=JSON.parse(await a.read(this.path));if(data?.version!==1||!data.canvases||typeof data.canvases!=='object')throw Error('공간별 그림 연결을 읽을 수 없습니다.');for(const row of Object.values(data.canvases)){if(!validId(row.root)||!row.portals||Object.values(row.portals).some(id=>!validId(id)))throw Error('손상된 공간별 그림 연결입니다.');}this.data=data;}}
 ensureBridge(){if(this.destroyed)return;const portal=this.plugin.app.plugins.getPlugin('ultimate-canvas-toolkit')?.portal;if(this.bridge?.portal===portal)return;this.detachBridge();if(typeof portal?.show!=='function')return;const state={owner:this},old=portal.show;const wrapped=function(session,...args){const owner=state.owner,s=owner&&[...owner.plugin.sessions.values()].find(s=>s.view===session.v);if(s)owner.prepare(s);const result=old.call(this,session,...args);if(s)owner.sync(s);return result;};portal.show=wrapped;this.bridge={portal,state,old,wrapped};}
 detachBridge(){const b=this.bridge;if(!b)return;b.state.owner=null;if(b.portal.show===b.wrapped)b.portal.show=b.old;this.bridge=null;}
 destroy(){this.destroyed=true;this.detachBridge();}
 context(s){this.ensureBridge();const uct=this.plugin.app.plugins.getPlugin('ultimate-canvas-toolkit'),explicit=uct?.getCanvasSpace?.(s.view);if(explicit)return explicit;const session=uct?.session?.(s.view),portalId=session?.v?.file?.path===s.file.path?session.current??null:null;return{view:s.view,filePath:s.file.path,portalId,key:portalId?s.file.path+'#uct-portal:'+portalId:s.file.path};}
 save(){const raw=JSON.stringify(this.data,null,2),a=this.plugin.app.vault.adapter;const work=this.queue.catch(()=>{}).then(()=>a.write(this.path,raw));this.queue=work;return work;}
 rename(oldPath,newPath){if(!oldPath||oldPath===newPath)return;const move=value=>value===oldPath||value.startsWith(oldPath+'/')||value.startsWith(oldPath+'#uct-portal:')?newPath+value.slice(oldPath.length):value;let changed=false;for(const key of Object.keys(this.data.canvases)){const next=move(key);if(next!==key){if(this.data.canvases[next])throw Error('이름 변경 대상에 기존 공간별 그림 연결이 있습니다.');this.data.canvases[next]=this.data.canvases[key];delete this.data.canvases[key];changed=true;}}for(const r of this.plugin.store.records.values()){const next=move(r.data.sourcePath);if(next!==r.data.sourcePath){r.data.sourcePath=next;this.plugin.store.changed(r);}}for(const s of this.plugin.sessions.values()){if(s.drawingSpaceKey)s.drawingSpaceKey=move(s.drawingSpaceKey);if(s.pendingSpaceKey)s.pendingSpaceKey=move(s.pendingSpaceKey);}if(changed)return this.save();}
 async registerRoot(filePath, rootId, fresh = false) {
  const previous = this.data.canvases[filePath];
  if (previous?.root === rootId) return;
  if (previous && !fresh) throw Error('Canvas와 공간별 그림 연결이 다릅니다. 원본을 보호합니다.');
  if (previous) {
   // Retain both the old portal links and their drawing documents.
   const backup = this.path + '.replaced-' + randomUUID() + '.bak';
   await this.plugin.app.vault.adapter.write(backup, JSON.stringify({
    version: 1, canvases: { [filePath]: previous }
   }, null, 2));
  }
  this.data.canvases[filePath] = {root: rootId, portals: {}};
  try { await this.save(); }
  catch (error) {
   if (previous) this.data.canvases[filePath] = previous;
   else delete this.data.canvases[filePath];
   throw error;
  }
 }
 async attach(s,root){await this.registerRoot(s.file.path,root.data.id);s.rootDrawingRecord=root;s.drawingSpaceKey=s.file.path;await this.sync(s);}
 prepare(s){if(!s.rootDrawingRecord||s.disposed||this.context(s).key===s.drawingSpaceKey)return;s.figures?.confirm();s.selection?.confirm(false);s.selection?.end();s.finishStroke();s.colorUI?.close();s.ready=false;s.raster.hidden=true;this.plugin.queueSave();}
 sync(s){if(!s.rootDrawingRecord||s.disposed)return Promise.resolve();const context=this.context(s);if(context.portalId&&!s.canvas.data.canvasDrawing)s.canvas.data.canvasDrawing={version:1,id:s.rootDrawingRecord.data.id};if(s.pendingSpaceKey===context.key&&s.spaceWork)return s.spaceWork;if(context.key===s.drawingSpaceKey&&s.ready)return s.spaceWork||Promise.resolve();this.prepare(s);s.pendingSpaceKey=context.key;const generation=s.spaceGeneration=(s.spaceGeneration||0)+1;s.spaceWork=(s.spaceWork||Promise.resolve()).catch(()=>{}).then(()=>this.switch(s,context,generation)).catch(error=>{if(!s.disposed&&generation===s.spaceGeneration)s.protect(error)});return s.spaceWork;}
 async switch(s,context,generation){if(s.disposed||generation!==s.spaceGeneration)return;const row=this.data.canvases[s.file.path];let record=s.rootDrawingRecord;
  if(context.portalId){let id=row.portals[context.portalId],fresh=!id;if(fresh){id=randomUUID();row.portals[context.portalId]=id;}record=this.plugin.store.load(id,context.key,!fresh);if(fresh){upgradeLayers(record.data);record.data.version=8;record.data.assets={};record.data.paper=paperDefaults();this.plugin.store.changed(record);if(!await this.plugin.store.flush(record))throw Error(record.error);await this.save();}}
  record.releaseWhenSaved=false;record.history??=new History(record,this.plugin.settings.historyLimit,()=>{for(const t of this.plugin.sessions.values())if(t.record===record)t.historyUI?.update()});seal(record.data);const engine=new LayerRenderer(()=>s.doc.createElement('canvas'));try{await engine.load(record.data);if(s.disposed||generation!==s.spaceGeneration)return;await s.paper.loadImage(record.data.paper?.image);if(s.disposed||generation!==s.spaceGeneration)return;const previous=s.engine;s.record=record;s.engine=engine;s.drawingSpaceKey=context.key;s.anchors?.removed?.clear();s.lineOrigin=null;s.layerUI.solo=[];s.layerUI.last=null;s.layerUI.thumbs.clear();s.pendingSpaceKey=null;s.ready=true;s.raster.hidden=false;s.visibility?.apply();s.layerUI.render();s.historyUI?.update();s.showStatus();s.scheduleRender();previous?.dispose?.();}finally{if(s.engine!==engine)engine.dispose();}
 }
}
module.exports={DrawingSpaces};
