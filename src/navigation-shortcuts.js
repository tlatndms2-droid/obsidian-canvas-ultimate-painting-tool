'use strict';
const {keyOf}=require('./keyboard-keys');
const names={canvasPan:'Canvas 화면 이동',canvasZoom:'Canvas 확대 / 축소',canvasEyedropper:'스포이트'};
const excluded='.cdt-panel,.cdt-toolbar,.cdt-layers,.cdt-color-popup,.cdt-history,.cdt-panel-edge,.cdt-anchors,.cdt-selection-bar,.cdt-save-warning,.canvas-controls,.canvas-menu,.canvas-card-menu,.modal';
function ensure(q){q.shortcuts??={};if(!q.navigationMouseDefaults){q.shortcuts.canvasPan='MouseRight';q.navigationMouseDefaults=true;}if(q.shortcuts.canvasPan===undefined)q.shortcuts.canvasPan='MouseRight';if(q.shortcuts.canvasZoom===undefined)q.shortcuts.canvasZoom='Ctrl+MouseRight';if(q.shortcuts.canvasEyedropper===undefined)q.shortcuts.canvasEyedropper='Shift+MouseRight';delete q.shortcuts.canvasZoomIn;delete q.shortcuts.canvasZoomOut;}
function mouseKey(e){const code=['MouseLeft','MouseMiddle','MouseRight','MouseBack','MouseForward'][e.button];return code?keyOf({code,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,metaKey:e.metaKey}):'';}
function label(key){return (key||'미지정').replace('MouseLeft','왼쪽 버튼').replace('MouseMiddle','가운데 버튼').replace('MouseRight','우클릭').replace('MouseBack','뒤로 버튼').replace('MouseForward','앞으로 버튼');}
function stop(e){e.preventDefault();e.stopImmediatePropagation();}
function reset(s){s.navigationHeld=null;s.space=false;const d=s.navigationDrag;if(d&&s.host.hasPointerCapture(d.id))s.host.releasePointerCapture(d.id);s.navigationDrag=null;}
function down(s,e){ensure(s.plugin.settings);const key=keyOf(e),q=s.plugin.settings.shortcuts;if(!key)return false;
 if(key===q.canvasPan&&!key.includes('Mouse')){stop(e);if(!s.active&&!s.figures?.pending&&!s.selection?.drag&&!s.colorUI?.pick){s.navigationHeld={code:e.code,ctrl:e.ctrlKey,alt:e.altKey,shift:e.shiftKey,meta:e.metaKey};s.space=true;s.cursor.hidden=true;}return true;}return false;
}
function install(s){
 s.listen(s.doc,'keyup',e=>{const h=s.navigationHeld;if(h&&(e.code===h.code||h.ctrl&&!e.ctrlKey||h.alt&&!e.altKey||h.shift&&!e.shiftKey||h.meta&&!e.metaKey))reset(s);},true);
 s.listen(s.win,'blur',()=>reset(s));
 s.listen(s.doc,'pointerdown',e=>{if(!s.drawing||!s.ready||!s.isActive()||e.pointerType==='touch'||!s.host.contains(e.target)||e.target.closest(excluded))return;ensure(s.plugin.settings);const q=s.plugin.settings.shortcuts,k=mouseKey(e),mode=k===q.canvasEyedropper?'pick':k===q.canvasZoom?'zoom':k===q.canvasPan||s.navigationHeld&&e.button===0?'pan':null;if(!mode)return;stop(e);if(mode==='pick'){s.colorUI.startHeld(e);return;}s.finishStroke();s.colorUI?.cancelPick();s.navigationDrag={id:e.pointerId,button:e.button,key:k,mode,x:e.clientX,y:e.clientY,zoom:s.canvas.tZoom,center:s.canvas.domPosFromEvt(e)};s.host.setPointerCapture(e.pointerId);s.cursor.hidden=true;if(s.mixHint)s.mixHint.hidden=true;},true);
 s.listen(s.win,'pointermove',e=>{const d=s.navigationDrag;if(!d||d.id!==e.pointerId)return;stop(e);if(mouseKey({...e,button:d.button,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,metaKey:e.metaKey})!==d.key)d.ended=true;if(d.ended)return;
 if(d.mode==='zoom'){s.canvas.zoomBy(d.zoom+(e.clientX-d.x)/200-s.canvas.tZoom,d.center);s.canvas.finishViewportAnimation=true;}else{s.canvas.panBy(-(e.clientX-d.x)/s.canvas.scale,-(e.clientY-d.y)/s.canvas.scale);d.x=e.clientX;d.y=e.clientY;}},true);
 for(const type of ['pointerup','pointercancel'])s.listen(s.win,type,e=>{const d=s.navigationDrag;if(d?.id!==e.pointerId)return;stop(e);if(s.host.hasPointerCapture(d.id))s.host.releasePointerCapture(d.id);s.navigationDrag=null;s.navigationSuppressUntil=Date.now()+100;s.updateCursor(e);},true);
 for(const type of ['mousedown','mousemove','mouseup','click','dblclick','contextmenu'])s.listen(s.doc,type,e=>{if(s.drawing&&(s.navigationDrag||s.navigationHeld||Date.now()<s.navigationSuppressUntil)&&s.host.contains(e.target)&&!e.target.closest(excluded))stop(e);},true);
 s.listeners.push(()=>reset(s));
}
function settings(plugin,container,refresh){const {Setting}=require('obsidian');ensure(plugin.settings);container.createEl('h2',{text:'드로잉 모드 · 마우스 조작과 스포이트'});container.createEl('p',{text:'드로잉 모드에서 우클릭 드래그는 화면 이동, Shift + 우클릭은 스포이트입니다. Ctrl + 우클릭을 누른 채 오른쪽으로 드래그하면 확대, 왼쪽으로 드래그하면 축소합니다. 설정 버튼을 눌러 마우스 버튼과 보조 키 조합을 변경할 수 있습니다.'});
 const buttons=new Map();const updateLabels=()=>{for(const [key,button]of buttons)button.setButtonText(label(plugin.settings.shortcuts[key]));};
 const adapter={plugin,element:(tag,cls,parent,text)=>parent.createEl(tag,{cls,text})};
 for(const [key,name]of Object.entries(names))new Setting(container).setName(name).setDesc(key==='canvasEyedropper'?'누르는 동안 색 채취 · 기본 Shift + 우클릭':key==='canvasPan'?'키 + 왼쪽 드래그 또는 마우스 조합 · 기본 우클릭 드래그':'마우스 드래그로 연속 확대·축소 · 기본 Ctrl + 우클릭').addButton(b=>{buttons.set(key,b);b.setButtonText(label(plugin.settings.shortcuts[key])).onClick(()=>{const m=require('./tool-shortcuts').shortcutDialog(adapter,'panel:'+key,name,{mouse:true,requireMouse:key!=='canvasPan'}),close=m.onClose;m.onClose=()=>{close?.call(m);updateLabels();};});});
}
module.exports={ensure,down,install,reset,settings,names,mouseKey};
