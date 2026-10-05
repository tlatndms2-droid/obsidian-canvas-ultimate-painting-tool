'use strict';
const {Modal,Menu,Notice,setIcon}=require('obsidian');
const {clone,linear,slopes,clamp,selected,preset}=require('./brush');
const ToolList=require('./tool-list');
const Defaults=require('./tool-defaults');
const {MaterialUI}=require('./material-ui');
const {shortcutDialog}=require('./tool-shortcuts');
const fields={tipScale:['끝 모양 배율',10,300,100],textureDensity:['종이 재질 농도',0,100,100],textureScale:['재질 확대율',10,300,100],textureAngle:['재질 회전각',-180,180,1],size:['브러시 크기',1,1000,1],opacity:['불투명도',0,100,100],density:['브러시 농도',0,100,100],hardness:['경도',0,100,100],roundness:['두께 / 원형도',5,100,100],angle:['각도',-180,180,1],spacing:['브러시 끝 간격',1,100,100],stabilization:['손떨림 보정',0,100,100],paintAmount:['물감량',0,100,100],colorStretch:['색 늘이기',0,100,100],particleSize:['입자 크기',5,100,100],particleCount:['입자 밀도',1,16,1],spread:['퍼짐 범위',0,200,100]};
const tabs=[['size','브러시 크기'],['ink','잉크'],['mix','색 혼합'],['tip','브러시 끝'],['stroke','스트로크'],['stabilization','손떨림 보정'],['texture','종이 재질'],['scatter','분사 / 산포'],['dynamics','입력 반응']];
class BrushUI {
 constructor(session){this.s=session;this.plugin=session.plugin;this.modals=new Set();this.previews=[];this.groupsByTool={};this.materials=new MaterialUI(this);}
 get group(){return this.groupsByTool[this.s.tool]||'전체';}
 set group(value){this.groupsByTool[this.s.tool]=value;}
 get quick(){const q=this.plugin.settings;q.sharedQuick??={};for(const tool of ['brush','eraser'])q.sharedQuick[tool]??=clone(selected(q,tool).quick);return q.sharedQuick[this.p.tool];}
 get p(){return selected(this.plugin.settings,this.s.tool==='eraser'?'eraser':'brush');}
 el(tag,cls,parent,text){return this.s.element(tag,cls,parent,text);}
 btn(parent,text,action){const b=this.el('button','',parent,text);b.type='button';b.onclick=action;return b;}
 icon(parent,name,label,action){return this.s.button(parent,name,label,action);}
 save(){this.plugin.saveData(this.plugin.settings);for(const s of this.plugin.sessions.values()){s.brushUI?.previewsRefresh();for(const el of s.doc.querySelectorAll('[data-cdt-field]')){const p=this.plugin.settings.presets.find(p=>p.id===el.dataset.preset);if(p&&el!==s.doc.activeElement)el.value=Math.round(p[el.dataset.cdtField]*fields[el.dataset.cdtField][3]);}}for(const el of this.s.doc.querySelectorAll('[data-cdt-check]')){const p=this.plugin.settings.presets.find(p=>p.id===el.dataset.preset);if(p)el.checked=p[el.dataset.cdtCheck];}this.s.updateCursor(this.s.lastPointer||{target:this.s.panel});}
 canvas(parent,p){const c=this.el('canvas','cdt-brush-preview',parent);c.width=220;c.height=64;this.previews.push({c,p});this.s.paintPreview(c,p);return c;}
 scrollSelected(){const list=this.s.panel.querySelector('.cdt-preset-list'),active=list?.querySelector('.is-active');if(active&&!this.s.panel.hidden)list.scrollTop=active.offsetTop-list.offsetTop;}
 previewsRefresh(){this.previews=this.previews.filter(x=>x.c.isConnected);for(const {c,p} of this.previews)this.s.paintPreview(c,p);}
 render(){
  const panel=this.s.panel;panel.replaceChildren();this.previews=this.previews.filter(x=>!panel.contains(x.c)&&x.c.isConnected);
  this.el('div','cdt-panel-heading',panel,this.s.tool==='eraser'?'지우개':'브러시');
  const all=this.plugin.settings.presets.filter(p=>p.tool===this.s.tool),pins=all.filter(p=>p.pinned);
  if(pins.length){const row=this.el('div','cdt-pins',panel);for(const p of pins)this.btn(row,'★ '+p.name,()=>this.choose(p));}
  const groups=[...new Set(all.map(p=>p.group||'기본'))];if(this.group!=='전체'&&!groups.includes(this.group))this.group='전체';if(groups.length>1){const select=this.el('select','cdt-group-filter',panel);select.setAttribute('aria-label','브러시 도구 그룹');for(const name of ['전체',...groups]){const o=this.el('option','',select,name);o.value=name;}select.value=this.group;select.onchange=()=>{this.group=select.value;this.render();};}
  const list=this.el('div','cdt-preset-list',panel);
  for(const p of all.filter(p=>!this.group||this.group==='전체'||(p.group||'기본')===this.group)){const b=this.el('button','cdt-preset'+(p===this.p?' is-active':''),list);b.setAttribute('aria-label',p.name+' 프리셋');b.setAttribute('aria-pressed',String(p===this.p));ToolList.badge(this.s,b,'preset:'+p.id);ToolList.draggable(this.s,b,p.id,()=>this.plugin.settings.presets.map(p=>p.id),ids=>{const all=this.plugin.settings.presets;this.plugin.settings.presets=ids.map(id=>all.find(p=>p.id===id));this.save();},()=>this.render());this.canvas(b,p);this.el('span','cdt-preset-name',b,p.name);b.onclick=()=>this.choose(p);b.oncontextmenu=e=>{e.preventDefault();this.menu(p,e);};}
  const active=list.querySelector('.is-active');if(active)list.scrollTop=active.offsetTop-list.offsetTop;
  const actions=this.el('div','cdt-row-actions',panel);this.btn(actions,'＋ 새 프리셋',()=>this.nameDialog('새 프리셋','새 브러시',name=>{const p=preset(crypto.randomUUID(),name,this.s.tool);p.defaults=clone(Object.fromEntries(Object.entries(p).filter(([k])=>!['id','name','tool','pinned','shortcut','defaults'].includes(k))));this.plugin.settings.presets.push(p);this.choose(p);}));this.icon(actions,'ellipsis','프리셋 메뉴',e=>this.menu(this.p,e));
  require('./panel-layout').split(this.s,panel,list,this.s.tool);this.properties(panel);this.s.quickTools?.render();
 }
 properties(panel){
  this.el('div','cdt-section-label',panel,'도구 속성');if(this.s.tool==='brush')require('./brush-snap').panel(this.s,panel,require('./ui-actions').bind);this.canvas(panel,this.p);
  const quick=this.el('div','cdt-quick',panel);for(const key of this.quick){if(fields[key])this.field(quick,key);else if(['mix','texture','textureEachPlot','flipX','flipY'].includes(key))this.exposedCheck(quick,{mix:'바탕색 혼합',texture:'종이 재질 사용',textureEachPlot:'점별로 적용',flipX:'좌우 반전',flipY:'상하 반전'}[key],key);}
  this.icon(panel,'rotate-ccw','도구 기본값 복원',()=>this.resetDefaults(this.p));
  require('./ui-actions').bind(this.s,this.btn(panel,'브러시 상세 설정',()=>this.details()),'action:brush-details','브러시 상세 설정',()=>require('./ui-actions').dialog(this.s,'보조 도구 상세',()=>this.details()));require('./ui-actions').bind(this.s,this.btn(panel,'펜 / 커서 설정',()=>this.device()),'action:device','펜 / 커서 설정',()=>require('./ui-actions').dialog(this.s,'펜 / 커서 설정',()=>this.device()));this.btn(panel,'ABR 가져오기',()=>this.materials.abr());
  this.el('p','cdt-hint',panel,'B / E: 도구 · Z: 색 전환 · X: 혼합 · C: 투명색\nCtrl + Alt + 좌우 드래그: 크기\nCtrl + 펜 보조 버튼 + 좌우 드래그: 확대 / 축소\nSpace: 이동 · Ctrl + Z: 실행 취소');
 }
 choose(p){if(!this.s.quickTools?.selecting)this.s.quickTools?.close();this.s.finishStroke();this.s.figures.confirm();this.s.selection.confirm(true);this.plugin.settings[p.tool==='eraser'?'selectedEraser':'selectedBrush']=p.id;this.s.tool=p.tool;this.s.workspaceUI?.remember();this.render();this.s.refreshControls();for(const s of this.plugin.sessions.values())if(s!==this.s&&s.tool===p.tool)s.brushUI.render();this.save();}
 field(parent,key,eyes=false){
  const p=this.p,[label,min,max,factor]=fields[key],row=this.el('div','cdt-property',parent);
  if(eyes){const eye=this.icon(row,this.quick.includes(key)?'eye':'eye-off','기본 패널 표시: '+label,()=>{this.plugin.settings.sharedQuick[p.tool]=this.quick.includes(key)?this.quick.filter(k=>k!==key):[...this.quick,key];setIcon(eye,this.quick.includes(key)?'eye':'eye-off');eye.setAttribute('aria-pressed',String(this.quick.includes(key)));this.render();this.save();});eye.setAttribute('aria-pressed',String(this.quick.includes(key)));require('./ui-actions').bind(this.s,eye,'action:quick:'+key,label+' 기본 패널 표시',()=>eye.click());}
  const body=this.el('label','cdt-property-body',row,label),line=this.el('div','cdt-range-line',body),range=this.el('input','',line),number=this.el('input','',line);range.type='range';number.type='number';
  for(const input of [range,number]){input.dataset.cdtField=key;input.dataset.preset=p.id;input.min=min;input.max=max;input.step=1;input.value=Math.round(p[key]*factor);input.setAttribute('aria-label',label+(input===number?' 수치':''));input.oninput=()=>{const n=Number(input.value);if(!Number.isFinite(n))return;p[key]=clamp(n,min,max)/factor;range.value=number.value=Math.round(p[key]*factor);this.save();};}
  if(['size','opacity','density'].includes(key)){const b=this.icon(line,'spline',label+' 필압 곡선',()=>this.pressure(key));b.classList.toggle('is-active',p[key+'Dynamics'].enabled);}
  return row;
 }
 exposedCheck(parent,label,key,eyes=false){
  const p=this.p,row=this.el('div','cdt-property',parent);
  if(eyes){const eye=this.icon(row,this.quick.includes(key)?'eye':'eye-off','기본 패널 표시: '+label,()=>{this.plugin.settings.sharedQuick[p.tool]=this.quick.includes(key)?this.quick.filter(k=>k!==key):[...this.quick,key];setIcon(eye,this.quick.includes(key)?'eye':'eye-off');eye.setAttribute('aria-pressed',String(this.quick.includes(key)));this.render();this.save();});eye.setAttribute('aria-pressed',String(this.quick.includes(key)));require('./ui-actions').bind(this.s,eye,'action:quick:'+key,label+' 기본 패널 표시',()=>eye.click());}
  const input=this.check(row,label,p,key);input.dataset.cdtCheck=key;input.dataset.preset=p.id;return row;
 }
 check(parent,label,object,key,after){const row=this.el('label','cdt-mix-row',parent),input=this.el('input','',row);input.type='checkbox';input.checked=object[key];input.setAttribute('aria-label',label);this.el('span','',row,label);require('./ui-actions').check(this.s,input,object,key,label);input.onchange=()=>{object[key]=input.checked;this.save();after?.();};return input;}
 select(parent,label,object,key,options){const row=this.el('label','cdt-select-row',parent,label),el=this.el('select','',row);el.setAttribute('aria-label',label);for(const [v,t] of options){const o=this.el('option','',el,t);o.value=v;}el.value=object[key];el.onchange=()=>{object[key]=el.value;this.save();};return el;}
 modal(title,cls=''){const m=new Modal(this.plugin.app);m.setTitle(title);m.modalEl.classList.add('cdt-dialog');if(cls)m.modalEl.classList.add(cls);this.modals.add(m);m.onClose=()=>{this.modals.delete(m);this.previewsRefresh();};m.open();return m;}
 nameDialog(title,value,done){const m=this.modal(title),i=this.el('input','',m.contentEl);i.value=value;i.setAttribute('aria-label',title);this.btn(m.contentEl,'저장',()=>{if(i.value.trim()){done(i.value.trim());m.close();}});i.focus();i.select();}
 confirm(title,action){const m=this.modal(title);this.btn(m.contentEl,'취소',()=>m.close());this.btn(m.contentEl,'확인',()=>{action();m.close();});}
 menu(p,event){const menu=new Menu();this.s.quickTools?.addMenu(menu,"preset:"+p.id);const add=(label,fn)=>menu.addItem(i=>i.setTitle(label).onClick(fn));
  add(p.pinned?'고정 해제':'목록 상단에 고정',()=>{p.pinned=!p.pinned;this.render();this.save();});
  add('도구 그룹 지정',()=>this.nameDialog('도구 그룹',p.group||'기본',name=>{p.group=name;this.render();this.save();}));
  add('위로 이동',()=>{const list=this.plugin.settings.presets,i=list.indexOf(p),j=list.findLastIndex((x,n)=>n<i&&x.tool===p.tool);if(j>=0){[list[i],list[j]]=[list[j],list[i]];this.render();this.save();}});
  add('아래로 이동',()=>{const list=this.plugin.settings.presets,i=list.indexOf(p),j=list.findIndex((x,n)=>n>i&&x.tool===p.tool);if(j>=0){[list[i],list[j]]=[list[j],list[i]];this.render();this.save();}});
  add('이름 변경',()=>this.nameDialog('프리셋 이름',p.name,name=>{p.name=name;this.render();this.save();}));
  add('복제',()=>{const c=clone(p);c.id=crypto.randomUUID();c.name+=' 복사';c.shortcut='';this.plugin.settings.presets.push(c);this.choose(c);});
  add('단축키 지정',()=>this.shortcut(p));
  add('기본값 복원',()=>this.resetDefaults(p));
  add('현재 값을 기본값으로 저장',()=>this.registerDefaults(p));
  add('삭제',()=>{if(this.plugin.settings.presets.filter(x=>x.tool===p.tool).length===1){new Notice('도구별 프리셋은 하나 이상 유지합니다.');return;}this.confirm(p.name+' 프리셋을 삭제할까요?',()=>{this.plugin.settings.presets=this.plugin.settings.presets.filter(x=>x!==p);this.choose(this.plugin.settings.presets.find(x=>x.tool===p.tool));});});
  menu.showAtMouseEvent(event);
 }
 registerDefaults(p){this.confirm(p.name+'의 현재 설정을 기본값으로 등록할까요? 이전 기본값이 바뀝니다.',()=>{Defaults.register(p);this.save();});}
 resetDefaults(p){this.confirm(p.name+'을 저장한 기본값으로 복원할까요?',()=>{Defaults.reset(p);this.render();this.save();});}
 shortcut(p){shortcutDialog(this.s,'preset:'+p.id,p.name);}
 details(){const m=this.modal('보조 도구 상세 · '+this.p.name,'cdt-details-dialog'),layout=this.el('div','cdt-detail-layout',m.contentEl),nav=this.el('nav','cdt-detail-nav',layout),body=this.el('div','cdt-detail-body',layout);const p=this.p;
  const show=key=>{body.replaceChildren();for(const b of nav.children)b.classList.toggle('is-active',b.dataset.tab===key);this.canvas(body,p);this.el('p','cdt-hint',body,'눈 아이콘을 켠 항목은 기본 패널에도 표시됩니다.');const field=k=>this.field(body,k,true);
   if(key==='size'){field('size');this.btn(body,'크기 필압 곡선',()=>this.pressure('size'));}
   if(key==='ink'){field('opacity');this.select(body,'합성 모드',p,'blend',[['source-over','보통'],['multiply','곱하기'],['screen','스크린'],['overlay','오버레이']]);}
   if(key==='mix'){this.exposedCheck(body,'바탕색 혼합','mix',true);const rowType=this.el('label','cdt-select-row',body,'혼합 종류'),choice=this.el('select','',rowType),mixing=require('./color-mixing');choice.setAttribute('aria-label','혼합 종류');for(const[value,label]of mixing.types){const option=this.el('option','',choice,label);option.value=value;}choice.value=this.p.mixType||'blend';const help=this.el('p','cdt-hint',body,mixing.descriptions[choice.value]);choice.onchange=()=>{this.p.mixType=choice.value;help.textContent=mixing.descriptions[choice.value];this.save();};field('paintAmount');field('colorStretch');const row=this.el('label','cdt-select-row',body,'참고할 레이어'),input=this.el('select','',row);input.setAttribute('aria-label','혼합 참고 레이어');for(const [value,label]of [['current','현재 레이어'],['visible','보이는 Drawing 레이어']]){const o=this.el('option','',input,label);o.value=value;}input.value=this.p.mixSource||'current';input.onchange=()=>{this.p.mixSource=input.value;this.save();};this.el('p','cdt-hint',body,'참고한 다른 레이어의 그림은 변경하지 않습니다.');}
   if(key==='tip')this.materials.tip(body,()=>show('tip'));if(key==='texture')this.materials.texture(body,()=>show('texture'));
   if(key==='stroke')field('spacing');if(key==='stabilization')field('stabilization');
   if(key==='scatter'){this.check(body,'분사 효과 사용',p,'scatter');field('particleSize');field('particleCount');field('spread');}
   if(key==='dynamics'){for(const k of ['size','opacity','density'])this.btn(body,fields[k][0]+' 필압 곡선',()=>this.pressure(k));this.check(body,'기울기 → 끝 모양 각도',p,'tilt');this.btn(body,'공통 필압 곡선',()=>this.pressure('global'));}
  };
  for(const [k,label] of tabs){const b=this.btn(nav,label,()=>show(k));b.dataset.tab=k;}show('size');const foot=this.el('div','cdt-dialog-footer',m.contentEl);this.btn(foot,'현재 값을 기본값으로 저장',()=>this.registerDefaults(p));this.btn(foot,'기본값 복원',()=>{this.confirm(p.name+'을 저장한 기본값으로 복원할까요?',()=>{Defaults.reset(p);this.render();this.save();show('size');});});this.btn(foot,'닫기',()=>m.close());
 }
 pressure(kind){
  const global=kind==='global',p=this.p,label=global?'공통 필압':fields[kind][0]+' 필압';
  const original=clone(global?{enabled:true,min:0,strength:1,curve:this.plugin.settings.globalCurve}:p[kind+'Dynamics']),draft=clone(original);
  const m=this.modal(label+' 설정','cdt-pressure-dialog'),body=m.contentEl;
  const preview=this.canvas(body,p);const applyPreview=()=>{const copy=clone(p);if(!global)copy[kind+'Dynamics']=draft;this.s.paintPreview(preview,copy,global?draft.curve:undefined);};
  if(!global){const i=this.check(body,'필압 사용',draft,'enabled',applyPreview);require('./ui-actions').bind(this.s,i.closest('label'),'action:brush:'+kind+'Dynamics.enabled',label+' 사용',()=>require('./ui-actions').brush(this.s,kind+'Dynamics.enabled'));}
  for(const [key,text] of global?[]:[['min','최소 출력 (%)'],['strength','영향 강도 (%)']]){const row=this.el('label','cdt-range-line',body,text),input=this.el('input','',row);input.type='number';input.min=0;input.max=100;input.value=draft[key]*100;input.setAttribute('aria-label',text);input.oninput=()=>{draft[key]=clamp(Number(input.value)/100);applyPreview();};}
  this.el('div','cdt-axis-label',body,'출력 100%');
  const graph=this.el('div','cdt-curve-graph',body);graph.tabIndex=0;graph.setAttribute('aria-label',label+' 입력 출력 그래프');
  const ns='http://www.w3.org/2000/svg',svg=this.s.doc.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');graph.append(svg);
  const make=(tag,attrs)=>{const e=this.s.doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;};
  make('path',{d:'M0 25H100M0 50H100M0 75H100M25 0V100M50 0V100M75 0V100',class:'cdt-curve-grid'});const path=make('path',{class:'cdt-curve-line'}),dots=make('g',{});
  let current=-1,drag=null;
  const redraw=()=>{const a=draft.curve,m=slopes(a);let d=`M${a[0][0]*100} ${100-a[0][1]*100}`;for(let i=0;i<a.length-1;i++){const h=(a[i+1][0]-a[i][0])*100/3;d+=` C${a[i][0]*100+h} ${100-a[i][1]*100-m[i]*h} ${a[i+1][0]*100-h} ${100-a[i+1][1]*100+m[i+1]*h} ${a[i+1][0]*100} ${100-a[i+1][1]*100}`;}path.setAttribute('d',d);dots.replaceChildren();a.forEach((p,i)=>{const r=this.s.doc.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:p[0]*100-1.5,y:98.5-p[1]*100,width:3,height:3,'data-point':i}))r.setAttribute(k,v);dots.append(r);});applyPreview();};
  const pos=e=>{const r=graph.getBoundingClientRect();return [(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height];};
  graph.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();graph.focus();const point=pos(e),a=draft.curve;current=a.findIndex(p=>Math.hypot((p[0]-point[0])*graph.clientWidth,(p[1]-point[1])*graph.clientHeight)<12);if(current<0){if(a.length>=16)return;const x=clamp(point[0],.01,.99);if(a.some(p=>Math.abs(p[0]-x)<.01))return;a.push([x,clamp(point[1])]);a.sort((a,b)=>a[0]-b[0]);current=a.findIndex(p=>p[0]===x);}drag={id:e.pointerId,original:clone(a)};graph.setPointerCapture(e.pointerId);redraw();};
  graph.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;const a=draft.curve,pt=pos(e);a[current]=[current===0?0:current===a.length-1?1:clamp(pt[0],a[current-1][0]+.005,a[current+1][0]-.005),clamp(pt[1])];redraw();};
  graph.onpointerup=e=>{if(!drag||drag.id!==e.pointerId)return;const pt=pos(e);if(current>0&&current<draft.curve.length-1&&pt.some(v=>v<-.04||v>1.04)){draft.curve.splice(current,1);current=-1;}graph.releasePointerCapture(e.pointerId);drag=null;redraw();};
  graph.onpointercancel=()=>{if(drag)draft.curve=drag.original;drag=null;redraw();};graph.onkeydown=e=>{if(['Delete','Backspace'].includes(e.key)&&current>0&&current<draft.curve.length-1){e.preventDefault();draft.curve.splice(current,1);current=-1;redraw();}};
  this.el('div','cdt-axis-label',body,'0%　　　　　　　　필압 입력　　　　　　　　100%');this.el('p','cdt-hint',body,'클릭: 점 추가 · 드래그: 곡선 조절 · 밖으로 끌기: 중간점 삭제');
  const footer=this.el('div','cdt-dialog-footer',body);this.btn(footer,'초기화',()=>{draft.curve=linear();redraw();});this.btn(footer,'취소',()=>m.close());this.btn(footer,'확인',()=>{if(global)this.plugin.settings.globalCurve=clone(draft.curve);else p[kind+'Dynamics']=clone(draft);this.render();this.save();m.close();});redraw();
 }
 device(){const m=this.modal('펜 / 커서 설정'),s=this.plugin.settings;this.select(m.contentEl,'펜 입력',s,'inputMode',[['automatic','자동 감지'],['pen','펜만'],['mouse','마우스 / 필압 없음']]);this.select(m.contentEl,'펜 보조 버튼',s,'penButton',[['eraser','누르는 동안 지우개'],['pan','누르는 동안 이동'],['none','사용 안 함']]);this.select(m.contentEl,'브러시 커서',s,'cursorMode',[['both','끝 모양 + 중심점'],['tip','끝 모양'],['hotspot','중심점']]);this.check(m.contentEl,'커서 크기에 필압 반영',s,'cursorPressure');this.el('p','cdt-hint',m.contentEl,'획의 필압은 그대로 유지됩니다. Ctrl+Alt 크기 조절 중에는 커서 중심이 고정되고 필압 표시가 잠시 꺼집니다.');this.btn(m.contentEl,'공통 필압 곡선',()=>this.pressure('global'));this.el('p','cdt-hint',m.contentEl,'장치별 필압·기울기·펜 버튼 감각은 실제 펜으로 확인해야 합니다.');this.btn(m.contentEl,'닫기',()=>m.close());}
 destroy(){for(const m of [...this.modals])m.close();}
}
function shortcutKey(e){return require('./keyboard-keys').keyOf(e);}

module.exports={BrushUI,shortcutKey};
