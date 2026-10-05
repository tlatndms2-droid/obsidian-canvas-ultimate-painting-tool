'use strict';
const {Modal,Notice,Menu}=require('obsidian');
const {descendants,ancestors}=require('./layers');
const {position,reconcile,detach,restoreLinks}=require('./anchor-model');
const clone=x=>JSON.parse(JSON.stringify(x));
class AnchorUI{
 constructor(s){this.s=s;this.removed=new Map();this.wrappers=[];this.markers=new Map();this.modals=new Set();this.overlay=s.element('div','cdt-anchors',s.host);this.importing=0;this.install();}
 get d(){return this.s.record.data;}
 usable(){return this.s.ready&&!this.s.disposed&&this.s.view.file===this.s.file;}
 wrap(key,fn){const c=this.s.canvas,old=c[key];if(typeof old!=='function')return;const wrapped=function(...args){return fn(old,this,args);};c[key]=wrapped;this.wrappers.push(()=>{if(c[key]===wrapped)c[key]=old;});}
 install(){const s=this.s;
  this.wrap('importData',(old,ctx,args)=>{this.importing++;try{return old.apply(ctx,args);}finally{this.importing--;s.scheduleRender();}});
  this.wrap('removeNode',(old,ctx,args)=>{if(this.usable()&&!this.importing){this.sync();const id=args[0].id,removed=detach(this.d,id);if(removed.length){this.removed.set(id,removed);this.changed();}}return old.apply(ctx,args);});
  this.wrap('applyHistory',(old,ctx,args)=>{const before=new Set(s.canvas.nodes.keys());this.importing++;let result;try{result=old.apply(ctx,args);}finally{this.importing--;}if(this.usable()){let changed=false;for(const id of before)if(!s.canvas.nodes.has(id)){const removed=detach(this.d,id);if(removed.length){this.removed.set(id,removed);changed=true;}}for(const [id,links]of this.removed)if(s.canvas.nodes.has(id)){changed=restoreLinks(this.d,links,s.canvas.nodes)||changed;this.removed.delete(id);}if(changed)this.changed();this.sync();}return result;});
  this.wrap('selectOnly',(old,ctx,args)=>{const out=old.apply(ctx,args);if(this.usable()&&!this.picking&&args[0]?.id)this.reveal(args[0].id);return out;});
  this.wrap('requestFrame',(old,ctx,args)=>{const result=old.apply(ctx,args);if(this.usable())s.scheduleRender();return result;});
  s.listen(s.host,'dragover',e=>{if(!this.usable()||!e.dataTransfer.types.includes('application/cdt-layers'))return;const node=this.target(e);this.highlight(node);if(node){e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='link';}},true);
  s.listen(s.host,'drop',e=>{if(!this.usable()||!e.dataTransfer.types.includes('application/cdt-layers'))return;const node=this.target(e);this.highlight(null);if(!node)return;e.preventDefault();e.stopImmediatePropagation();const ids=JSON.parse(e.dataTransfer.getData('application/cdt-layers')||'[]');this.bind(ids,node.id);},true);
  s.listen(s.host,'dragend',()=>this.highlight(null),true);s.listen(s.host,'dragleave',e=>{if(!s.host.contains(e.relatedTarget))this.highlight(null);},true);
 }
 changed(){this.s.plugin.store.changed(this.s.record);this.s.plugin.queueSave();this.s.plugin.refreshLayers(this.s.record);this.s.plugin.repaint(this.s.record);}
 sync(){if(!this.usable()||this.importing)return;const result=reconcile(this.d,this.s.canvas.nodes);if(result.changed){this.s.selection?.end();this.s.finishStroke();this.changed();}return result;}
 target(e){if(e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-layers,.cdt-panel,.cdt-toolbar,.cdt-selection-bar'))return null;const candidates=[...this.s.canvas.nodes.values()].filter(n=>{if(n.unknownData?.cdtText)return false;const r=n.nodeEl.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});return candidates.sort((a,b)=>b.zIndex-a.zIndex)[0]||null;}
 highlight(node){if(this.hover===node)return;this.hover?.nodeEl.classList.remove('cdt-anchor-hover');this.hover=node;node?.nodeEl.classList.add('cdt-anchor-hover');}
 name(id){const n=this.s.canvas.nodes.get(id);if(!n)return '연결 대상 대기';const d=n.getData();return (d.text?.split('\n').find(line=>line.trim())?.replace(/[#*`]/g,'').trim()||d.file||d.label||d.url||'Canvas 항목').slice(0,32);}
 roots(ids){return this.d.layers.filter(l=>ids.includes(l.id)&&!ancestors(this.d,l).some(a=>ids.includes(a.id)));}
 affected(ids){return new Set(this.roots(ids).flatMap(l=>[...descendants(this.d,l.id)]));}
 async ask(title,message,choices){return new Promise(resolve=>{const modal=new Modal(this.s.plugin.app);this.modals.add(modal);modal.setTitle(title);modal.contentEl.createEl('p',{text:message});const row=modal.contentEl.createDiv({cls:'cdt-anchor-options'});let done=false;const finish=value=>{done=true;resolve(value);modal.close();};for(const [label,value]of choices)row.createEl('button',{text:label}).onclick=()=>finish(value);row.createEl('button',{text:'취소'}).onclick=()=>finish(undefined);modal.onClose=()=>{this.modals.delete(modal);if(!done)resolve(undefined);};modal.open();});}
 async bind(ids,targetId){if(!ids.length)return;this.sync();const node=targetId?this.s.canvas.nodes.get(targetId):null;if(targetId&&(!node||node.unknownData?.cdtText))return;const roots=this.roots(ids),all=this.affected(ids),conflict=!!targetId&&roots.some(l=>l.type==='group'&&this.d.layers.some(n=>all.has(n.id)&&n.anchor&&n.anchor.targetId!==targetId));if(roots.some(l=>ancestors(this.d,l).some(a=>a.anchor?.targetId&&a.anchor.targetId!==targetId&&!all.has(a.id)))){new Notice('연결된 그룹의 대상은 그룹에서 변경해주세요. 개별 변경은 그룹 밖으로 옮긴 뒤 할 수 있습니다.');return;}
  if(conflict&&!await this.ask('그룹 연결 변경','그룹 안의 기존 연결이 모두 새 대상으로 바뀝니다. 그림 위치는 유지됩니다.',[['변경',true]]))return;
  if(targetId&&!this.s.canvas.nodes.has(targetId))return;this.s.layerUI.change(()=>{for(const l of this.d.layers)if(all.has(l.id)){l.anchor=node?position(node):null;for(const [id,links]of this.removed){this.removed.set(id,links.filter(item=>item.id!==l.id));}}});this.highlight(null);new Notice(node?'⚓ '+this.name(node.id)+'에 연결했습니다.':'연결을 해제했습니다. 그림 위치는 유지됩니다.');}
 choose(ids=this.d.selectedLayers){if(!ids.length){new Notice('연결할 레이어를 선택해주세요.');return;}this.picking=[...ids];new Notice('Canvas에서 연결할 카드를 클릭하세요 · Esc: 취소');}
 linked(ids=this.d.selectedLayers){return this.d.layers.some(l=>ids.includes(l.id)&&l.anchor);}
 toggle(ids=this.d.selectedLayers){if(this.linked(ids))this.bind([...ids],null);else this.choose([...ids]);}
 down(e){if(!this.picking)return false;if(e.target.closest('.cdt-history,.cdt-panel-edge,.cdt-layers,.cdt-toolbar,.cdt-panel'))return false;e.preventDefault();e.stopImmediatePropagation();if(e.button===0){const n=this.target(e);if(n){const ids=this.picking;this.picking=null;this.bind(ids,n.id);}}return true;}
 move(e){if(this.picking)this.highlight(this.target(e));}
 cancel(){this.picking=null;this.highlight(null);}
 focus(id){const n=this.s.canvas.nodes.get(id);if(!n)return;this.s.selection.end();this.s.setMode(false);this.s.canvas.selectOnly(n);const c=this.s.canvas,h=this.s.host.getBoundingClientRect(),scale=Math.min(1.5,(h.width-160)/(n.width*1.6),(h.height-100)/(n.height*1.6));c.setViewport(n.x+n.width/2,n.y+n.height/2,Math.log2(Math.max(.1,scale)));this.s.canvas.requestFrame();}
 reveal(id){const ids=this.d.layers.filter(l=>l.anchor?.targetId===id).map(l=>l.id);if(ids.length)require('./layer-pick').reveal(this.s,ids);}
 async mergeTarget(roots){const all=this.affected(roots.map(l=>l.id)),values=[...new Set(this.d.layers.filter(l=>all.has(l.id)&&l.type==='layer').map(l=>l.anchor?.targetId||null))];if(values.length<=1)return values[0]||null;return this.ask('병합 후 연결 대상','여러 연결 대상이 섞여 있습니다. 병합한 그림이 따라갈 대상을 선택해주세요.',[['Canvas에 고정',null],...values.filter(Boolean).map(id=>[this.name(id),id])]);}
 menu(menu,ids){const linked=this.linked(ids);menu.addItem(i=>i.setTitle(linked?'연결 해제 · 현재 위치 유지':'Canvas에서 연결 대상 고르기').setIcon(linked?'unlink':'link').onClick(()=>this.toggle(ids)));}
 render(){if(!this.usable())return;const s=this.s,hr=s.host.getBoundingClientRect(),targets=new Set(this.d.layers.map(l=>l.anchor?.targetId).filter(Boolean));for(const [id,b]of this.markers)if(!targets.has(id)||!s.canvas.nodes.has(id)){b.remove();this.markers.delete(id);}for(const id of targets){const node=s.canvas.nodes.get(id);if(!node)continue;let button=this.markers.get(id);if(!button){button=s.button(this.overlay,'anchor',this.name(id)+' 연결된 그림 보기',()=>this.reveal(id));button.classList.add('cdt-anchor-badge');button.dataset.targetId=id;this.markers.set(id,button);}const r=node.nodeEl.getBoundingClientRect();Object.assign(button.style,{left:(r.left-hr.left-8)+'px',top:(r.top-hr.top-8)+'px'});button.classList.toggle('is-selected',s.canvas.selection.has(node));button.hidden=r.right<hr.left||r.left>hr.right||r.bottom<hr.top||r.top>hr.bottom;}}
 destroy(){this.cancel();for(const close of this.wrappers.reverse())close();for(const modal of [...this.modals])modal.close();this.overlay.remove();}
}
module.exports={AnchorUI};
