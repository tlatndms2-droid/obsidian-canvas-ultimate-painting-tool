'use strict';
const {setIcon}=require('obsidian');
const {keyOf}=require('./keyboard-keys');
class PieMenu{
 constructor(quick,kind='tool'){this.quick=quick;this.s=quick.s;this.kind=kind;this.page=0;this.root=null;}
 entries(){const all=this.quick.entries();if(['brush','eraser'].includes(this.kind))return all.filter(e=>e.preset?.tool===this.kind);return this.s.plugin.settings.quickTools.map(id=>all.find(e=>e.id===id)).filter(Boolean);}
 toggle(){if(this.root){this.close();return;}this.open();}
 open(){const s=this.s;if(!s.ready||s.active||s.figures.pending||s.selection.drag)return;
  require('./pie-theme').closeOthers(s,this);
  const pointer=s.lastPointer,overUi=pointer?.target?.closest?.('.cdt-panel,.cdt-toolbar,.cdt-layers,.cdt-color-popup');this.returnFocus=s.doc.activeElement;this.quick.close();if(!s.drawing)s.setMode(true);
  this.hiddenPanels=[s.panel,s.figures.panel,s.layers,this.quick.panel].map(el=>({el,hidden:el.hidden}));for(const {el}of this.hiddenPanels)el.hidden=true;
  this.root=s.element('div','cdt-panel cdt-pie-overlay',s.doc.body);this.root.setAttribute('role','dialog');this.root.setAttribute('aria-label',this.kind==='brush'?'브러시 파이 메뉴':this.kind==='eraser'?'지우개 파이 메뉴':'지정 도구 파이 메뉴');this.unwatch=require('./pie-theme').watch(s,this.root,this.kind);this.root.tabIndex=-1;
  this.root.onpointerdown=e=>{e.stopPropagation();if(e.target===this.root){e.preventDefault();this.close();}};
  this.root.oncontextmenu=e=>{e.preventDefault();this.close();};
  this.root.onwheel=e=>{e.preventDefault();e.stopPropagation();};
  const r=s.host.getBoundingClientRect(),size=require('./pie-settings').fit(s);
  const x=Math.max(r.left+size/2,Math.min(r.right-size/2,(!overUi&&pointer?.clientX)||r.left+r.width/2));
  const y=Math.max(r.top+size/2,Math.min(r.bottom-size/2,(!overUi&&pointer?.clientY)||r.top+r.height/2));
  this.disk=s.element('div','cdt-pie-disk',this.root);this.disk.style.cssText=`left:${x}px;top:${y}px;width:${size}px;height:${size}px;--pie-scale:${size/430}`;
  this.root.addEventListener('cdt-pie-theme',()=>this.render());this.root.focus({preventScroll:true});this.page=0;this.render();
  this.disk.onpointermove=e=>{if(e.target.closest('.cdt-pie-secondary,.cdt-pie-controls'))return;const b=this.disk.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2;if(Math.hypot(dx,dy)<b.width*.28)return;const i=Math.round((Math.atan2(dy,dx)*180/Math.PI+450)%360/(this.step||45))%Math.max(1,this.visible.length);if(this.visible[i]&&this.hovered!==this.visible[i].id)this.highlight(this.visible[i].id);};
  this.disk.onclick=e=>{if(e.target===this.disk||e.target.classList.contains('cdt-pie-orbit')){if(this.hovered)this.select(this.hovered);}};
  this.onKey=e=>this.key(e);s.doc.addEventListener('keydown',this.onKey,true);
  this.onResize=()=>this.close();s.win.addEventListener('resize',this.onResize);
 }
 preview(parent,entry){const c=this.quick.preview(parent,entry);c.classList.add('cdt-pie-preview');
  // Native previews use pale ink. Recolor its alpha mask for a legible thumbnail
  // without changing the user's preset or rebuilding a second brush renderer.
  {const ctx=c.getContext('2d');ctx.globalCompositeOperation='source-in';ctx.fillStyle=this.root?.dataset.pieTheme==='dark'?'#eee9f5':'#35323d';ctx.fillRect(0,0,c.width,c.height);ctx.globalCompositeOperation='source-over';}
  return c;
 }
 render(){if(!this.root)return;const s=this.s,all=this.entries();this.pages=Math.max(1,Math.ceil(all.length/8));this.page=Math.min(this.page,this.pages-1);this.visible=all.slice(this.page*8,this.page*8+8);this.disk.replaceChildren();this.step=['brush','eraser'].includes(this.kind)?360/Math.max(1,this.visible.length):45;
  s.element('div','cdt-pie-orbit',this.disk);
  this.hub=s.element('div','cdt-pie-hub',this.disk);this.hub.setAttribute('aria-live','polite');
  this.buttons=[];
  for(let i=0;i<this.visible.length;i++){const entry=this.visible[i],a=(-90+i*this.step)*Math.PI/180;
   const b=s.element('button','cdt-pie-item',this.disk);b.style.left=(50+36*Math.cos(a))+'%';b.style.top=(50+36*Math.sin(a))+'%';b.setAttribute('aria-label',entry.name);b.title=entry.name;b.dataset.entryId=entry.id;
   this.preview(b,entry);b.onpointerenter=()=>this.highlight(entry.id);b.onfocus=()=>this.highlight(entry.id);b.onclick=e=>{e.stopPropagation();this.select(entry.id);};b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();this.close();this.quick.context(entry.id,e);};this.buttons.push(b);
  }
  const q=s.plugin.settings,secondary=[{id:'preset:'+q.selectedEraser,icon:'eraser'},{id:'tool:rectangle',icon:'scan'},{id:'tool:lasso',icon:'lasso'},{id:'shape:'+q.selectedShape,icon:'shapes'}],entries=this.quick.entries();
  secondary.forEach((v,i)=>{const entry=entries.find(e=>e.id===v.id)|| (v.icon==='shapes'?entries.find(e=>e.kind):null);if(!entry)return;const a=(-90+i*90)*Math.PI/180,b=s.element('button','cdt-pie-secondary',this.disk);b.style.left=(50+21*Math.cos(a))+'%';b.style.top=(50+21*Math.sin(a))+'%';setIcon(b,v.icon);b.setAttribute('aria-label',entry.name);b.title=entry.name;b.onclick=()=>this.select(entry.id);});
  const controls=s.element('div','cdt-pie-controls',this.disk);
  if(this.pages>1){s.button(controls,'chevron-left','이전 도구 페이지',()=>this.turn(-1));s.element('span','',controls,`${this.page+1} / ${this.pages}`);s.button(controls,'chevron-right','다음 도구 페이지',()=>this.turn(1));}
  s.button(controls,'settings-2',this.kind==='brush'?'브러시 목록 관리':this.kind==='eraser'?'지우개 목록 관리':'지정 도구 관리',()=>{this.close();s.mdPanel=null;if(['brush','eraser'].includes(this.kind)){s.openToolPanel(this.kind);}else this.quick.togglePanel();s.applyMdLayout?.();});
  s.button(controls,'sliders-horizontal','브러시 상세 파이 메뉴',()=>{this.close();s.toggleBrushDetails();});
  s.button(controls,'x','파이 메뉴 닫기',()=>this.close());
  s.element('div','cdt-pie-help',this.disk,'방향 이동 후 클릭 · Esc 닫기');
  const current=this.visible.find(e=>e.id===this.quick.currentId())||this.visible[0];this.highlight(current?.id);
 }
 highlight(id){if(!this.root)return;if(this.hovered===id&&this.hub.childElementCount)return;this.hovered=id;this.s.brushUI.previews=this.s.brushUI.previews.filter(v=>v.c.isConnected);const entry=this.quick.entries().find(e=>e.id===id);this.hub.replaceChildren();if(entry){this.preview(this.hub,entry);this.s.element('strong','',this.hub,entry.name.replace(/^(브러시|지우개|도형) · /,''));if(entry.preset)this.s.element('small','',this.hub,Math.round(entry.preset.size)+' px');}else{this.s.element('strong','',this.hub,'지정 도구');this.s.element('small','',this.hub,'등록한 도구가 없습니다');}this.buttons.forEach(b=>{const on=b.dataset.entryId===id;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});}
 select(id){this.close();this.quick.choose(id);this.quick.close();if('mdPanel'in this.s){this.s.mdPanel=null;this.s.applyMdLayout();}}
 turn(delta){this.page=(this.page+delta+this.pages)%this.pages;this.render();}
 key(e){if(!this.root)return false;const k=keyOf(e);if(e.code==='Escape'||(this.kind==='eraser'&&k===this.s.plugin.settings.shortcuts.eraserPie)||k===this.s.plugin.settings.shortcuts[this.kind==='brush'?'brush':this.kind==='eraser'?'eraser':'pie']||(!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key.toUpperCase()===this.s.plugin.settings.shortcuts.quick)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)this.close();return true;}
  if(e.code==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(this.hovered)this.select(this.hovered);return true;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();let i=this.visible.findIndex(v=>v.id===this.hovered);i=(i+(e.code==='ArrowLeft'||e.code==='ArrowUp'?-1:1)+this.visible.length)%this.visible.length;if(this.visible[i])this.highlight(this.visible[i].id);return true;}
  if(e.code==='PageDown'||e.code==='PageUp'){e.preventDefault();e.stopImmediatePropagation();this.turn(e.code==='PageDown'?1:-1);return true;}
  // Preserve native Tab navigation; all other shortcuts must not draw or exit mode behind the menu.
  if(e.code!=='Tab'){e.preventDefault();e.stopImmediatePropagation();}return true;
 }
 close(){if(!this.root)return;const s=this.s;this.root.remove();this.root=null;this.unwatch?.();for(const {el,hidden}of this.hiddenPanels||[])el.hidden=hidden;this.hiddenPanels=null;s.doc.removeEventListener('keydown',this.onKey,true);s.win.removeEventListener('resize',this.onResize);s.brushUI.previews=s.brushUI.previews.filter(v=>v.c.isConnected);if(s.drawing&&!s.disposed&&s.host.isConnected)s.host.focus({preventScroll:true});else if(this.returnFocus?.isConnected)this.returnFocus.focus({preventScroll:true});}
}
module.exports={PieMenu};
