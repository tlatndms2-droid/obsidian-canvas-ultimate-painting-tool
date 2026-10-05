'use strict';
const {Menu}=require('obsidian');
const {keyOf,keyFor,shortcutDialog}=require('./tool-shortcuts');
function bind(s,el,id,name,run){s.uiActions??=new Map();s.uiActions.set(id,{name,run});if(el){el.dataset.cdtAction=id;el.dataset.cdtActionName=name;const key=keyFor(s.plugin.settings,id);el.title=name+(key?' ('+key+')':'');}}
function dialog(s,title,open){const m=[...s.brushUI.modals].find(m=>m.titleEl?.textContent.startsWith(title));if(m)m.close();else open();}
function brush(s,key){const p=require('./brush').selected(s.plugin.settings,s.tool==='eraser'?'eraser':'brush'),[a,b]=key.split('.'),o=b?p[a]:p,k=b||a;if(!o||typeof o[k]!=='boolean')return;o[k]=!o[k];s.brushUI.save();if(['brush','eraser'].includes(s.tool))s.brushUI.render();}
function install(s){s.refreshActionLabels=()=>labels(s);
 const q=s.plugin.settings;
 bind(s,null,'action:brush-snap','브러시 각도 스냅',()=>require('./brush-snap').toggle(s));
 const togglePanel=(box,key)=>{q[key]=!q[key];s.workspaceUI.applyLayout();s.plugin.saveData(q);};
 for(const [el,id,name,run]of [
 [s.toggle,'panel:drawing','드로잉 모드',()=>s.setMode(!s.drawing)],
 [s.brushButton,'panel:brush','브러시 도구',()=>s.selectTool('brush')],
 [s.eraserButton,'panel:eraser','지우개 도구',()=>s.selectTool('eraser')],
 [s.editButtons.shape,'panel:shape','도형 도구',()=>s.selectTool('shape')],
 [s.editButtons.rectangle,'panel:selection','선택 방식 전환',()=>{q.selectionMethod=s.tool==='rectangle'?'lasso':s.tool==='lasso'?'rectangle':q.selectionMethod;s.selectTool(q.selectionMethod)}],
 [s.editButtons['move-layer'],'tool:move-layer','오브젝트 도구',()=>s.selectTool('move-layer')],
 [s.paperButton,'action:paper','배경 용지 설정',()=>{if(s.paper.modal?.modalEl.isConnected)s.paper.modal.close();else s.paper.open()}],
 [s.quickTools.button,'panel:quick','지정 도구 모음',()=>s.quickTools.toggle()],
 [s.layers,'panel:layers','레이어 패널',()=>togglePanel(s.layers,'layersCollapsed')],
 [s.colorPopup,'panel:color','색상 패널',()=>s.colorUI.toggle()],
 [s.panel,'action:context','도구 속성 패널',()=>togglePanel(s.panel,'contextCollapsed')],
 [s.figures.panel,'action:context','도구 속성 패널',()=>togglePanel(s.panel,'contextCollapsed')],
 [s.quickTools.panel,'panel:quick','지정 도구 모음',()=>s.quickTools.toggle()]
 ])bind(s,el,id,name,run);
 bind(s,null,'action:brush-details','브러시 상세 설정',()=>dialog(s,'보조 도구 상세',()=>s.brushUI.details()));
 bind(s,null,'action:device','펜 / 커서 설정',()=>dialog(s,'펜 / 커서 설정',()=>s.brushUI.device()));
 const footer=[...s.workspaceUI.footer.querySelectorAll('button')];
 for(const [i,id,name,run]of [[0,'action:toolbar','도구막대 접기 / 펼치기',()=>s.workspaceUI.toggle('toolbarCollapsed')],[1,'action:context','도구 속성 패널',()=>s.workspaceUI.toggle('contextCollapsed')],[2,'action:layout','도구막대 편집',()=>dialog(s,'도구막대 편집',()=>s.workspaceUI.layout())],[3,'action:library','소재 라이브러리',()=>dialog(s,'소재 라이브러리',()=>s.brushUI.materials.library())],[4,'action:workspace','작업환경',()=>dialog(s,'Drawing 작업환경',()=>s.workspaceUI.open())]])bind(s,footer[i],id,name,run);
 bind(s,s.colorPopup.querySelector('.cdt-transparent-color'),'panel:transparent','투명색',()=>s.toggleTransparentColor());
 for(const b of s.colorPopup.querySelectorAll('[data-color-slot]'))bind(s,b,'action:color:'+b.dataset.colorSlot,b.dataset.colorSlot==='main'?'메인색 선택':'보조색 선택',()=>s.selectColorSlot(b.dataset.colorSlot));
 // Capture only registered controls or bare panel background; preserve tool and layer menus.
 s.listen(s.doc,'contextmenu',e=>{if(!s.isActive())return;const target=e.target.closest('[data-cdt-action]');if(!target||(!s.host.contains(target)&&!target.closest('.cdt-dialog')))return;
 if(target.matches('.cdt-panel,.cdt-layers,.cdt-color-popup')&&e.target.closest('button,input,select,textarea,.cdt-layer-row,.cdt-preset,.cdt-shape-kind'))return;
 e.preventDefault();e.stopImmediatePropagation();const m=new Menu();m.addItem(i=>i.setTitle('단축키 설정 · '+target.dataset.cdtActionName).onClick(()=>shortcutDialog(s,target.dataset.cdtAction,target.dataset.cdtActionName)));m.showAtMouseEvent(e);
 },true);
}
function check(s,input,object,key,label){const q=s.plugin.settings;const owner=q.presets?.find(p=>p===object||['size','opacity','density'].some(k=>p[k+'Dynamics']===object));let id,run;
 if(owner){const dyn=['size','opacity','density'].find(k=>owner[k+'Dynamics']===object);id=key==='mix'&&!dyn?'panel:mix':'action:brush:'+ (dyn?dyn+'Dynamics.':'')+key;run=()=>{const p=s.brushUI.p,o=dyn?p[dyn+'Dynamics']:p;o[key]=!o[key];s.brushUI.save();s.brushUI.render();};}
 else if(object===q){id='action:setting:'+key;run=()=>{q[key]=!q[key];s.plugin.saveData(q);};}
 else return;
 bind(s,input.closest('label')||input,id,label,run);
}
function handle(s,e){if(!s.drawing)return false;const key=keyOf(e);if(!key)return false;const q=s.plugin.settings;
 for(const id of Object.keys(q.toolShortcuts||{})){
  if(id.startsWith('action:brush:'))s.uiActions.set(id,{run:()=>brush(s,id.slice(13))});
  if(id.startsWith('action:text:'))s.uiActions.set(id,{run:()=>{const key=id.slice(12);if(!['background','border'].includes(key))return;const n=s.textItems.current,st=n?n.unknownData.cdtText:q.textStyle;st[key]=!st[key];if(n){s.textItems.decorate(n);s.canvas.requestSave();}s.plugin.saveData(q);s.figures.panelRender();}});
  if(id==='action:paper-enabled')s.uiActions.set(id,{run:()=>s.layerUI.change(()=>{s.record.data.paper.enabled=!s.record.data.paper.enabled})});
  if(id==='action:setting:cursorPressure')s.uiActions.set(id,{run:()=>{q.cursorPressure=!q.cursorPressure;s.plugin.saveData(q)}});
  if(id.startsWith('action:quick:'))s.uiActions.set(id,{run:()=>{const k=id.slice(13),list=s.brushUI.quick;q.sharedQuick[s.tool==='eraser'?'eraser':'brush']=list.includes(k)?list.filter(v=>v!==k):[...list,k];s.brushUI.render();s.brushUI.save();}});
 }
 const special=[['panel:swap','색 전환',()=>s.selectColorSlot(q.activeColor==='main'?'secondary':'main')],['panel:transparent','투명색',()=>s.toggleTransparentColor()],['panel:mix','색 혼합',()=>{const p=require('./brush').selected(q,'brush');p.mix=!p.mix;s.brushUI.save();if(s.tool==='brush')s.brushUI.render();}]];
 for(const[id,name,run]of special)s.uiActions.set(id,{name,run});
 const entry=[...s.uiActions].find(([id])=>keyFor(q,id)===key&&!['panel:brush','panel:eraser','panel:shape','panel:selection'].includes(id));if(!entry)return false;
 if(!s.drawing&&(/^(action:brush:|panel:(mix|swap|transparent)$)/.test(entry[0])))return false;
 e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)entry[1].run();return true;
}
function labels(s){for(const el of s.host.querySelectorAll('[data-cdt-action]')){const key=keyFor(s.plugin.settings,el.dataset.cdtAction);el.title=el.dataset.cdtActionName+(key?' ('+key+')':'');}}
module.exports={bind,install,check,handle,dialog,brush,labels};
