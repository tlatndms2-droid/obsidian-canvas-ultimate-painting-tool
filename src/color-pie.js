'use strict';
const {keyOf}=require('./keyboard-keys');
const {hsvToHex}=require('./color');
class ColorPie{
 constructor(ui){this.ui=ui;this.s=ui.s;}
 toggle(){if(this.root)this.close();else this.open();}
 open(){const s=this.s;if(!s.ready||s.active||s.figures.pending||s.selection.drag)return;
  require('./pie-theme').closeOthers(s,this);if(!s.drawing)s.setMode(true);this.ui.close();this.ui.sync();this.previous=s.toolColor();
  this.panels=[s.panel,s.figures.panel,s.layers,s.quickTools.panel].map(el=>({el,hidden:el.hidden}));for(const {el}of this.panels)el.hidden=true;
  this.root=s.element('div','cdt-panel cdt-pie-overlay cdt-color-pie-overlay',s.doc.body);this.root.setAttribute('role','dialog');this.root.setAttribute('aria-label','색상 파이 메뉴');this.root.tabIndex=-1;this.unwatch=require('./pie-theme').watch(s,this.root,'color');
  this.root.onpointerdown=e=>{e.stopPropagation();if(e.target===this.root){e.preventDefault();this.close();}};
  this.root.oncontextmenu=e=>{e.preventDefault();if(e.target===this.root)this.close();};this.root.onwheel=e=>{e.preventDefault();e.stopPropagation();};
  const rect=s.host.getBoundingClientRect(),size=require('./pie-settings').fit(s),p=s.lastPointer,overUi=p?.target?.closest?.('.cdt-panel,.cdt-toolbar,.cdt-layers,.cdt-color-popup');
  const x=Math.max(rect.left+size/2,Math.min(rect.right-size/2,(!overUi&&p?.clientX)||rect.left+rect.width/2)),y=Math.max(rect.top+size/2,Math.min(rect.bottom-size/2-100,(!overUi&&p?.clientY)||rect.top+rect.height/2));
  this.disk=s.element('div','cdt-color-pie-disk',this.root);this.disk.style.cssText=`left:${x}px;top:${y}px;width:${size}px;height:${size}px;--color-pie-scale:${size/430}`;
  s.element('div','cdt-color-pie-orbit',this.disk);
  this.wheelParent=this.ui.wheel.parentNode;this.wheelNext=this.ui.wheel.nextSibling;this.disk.append(this.ui.wheel);this.ui.wheel.classList.add('cdt-color-pie-wheel');
  this.swatches=s.element('div','cdt-color-pie-swatches',this.disk);this.renderSwatches();
  const controls=s.element('div','cdt-color-pie-controls',this.disk);
  s.button(controls,'settings','파이 메뉴 크기 설정',e=>{e.preventDefault();e.stopPropagation();this.close();s.plugin.app.setting.open();s.plugin.app.setting.openTabById('canvas-drawing-tool-bar');});
  s.button(controls,'x','색상 파이 메뉴 닫기',()=>this.close());
  const values=s.element('div','cdt-color-pie-values',this.disk);
  const previous=s.element('button','cdt-color-pie-chip',values);previous.style.background=this.previous;previous.setAttribute('aria-label','이전 색상');previous.title='이전 색상';previous.onclick=()=>this.ui.choose(this.previous);
  s.element('span','cdt-color-pie-arrow',values,'→');this.current=s.element('span','cdt-color-pie-chip',values);this.current.setAttribute('aria-label','현재 색상');
  this.hex=s.element('input','cdt-color-pie-hex',values);this.hex.setAttribute('aria-label','파이 메뉴 색상 HEX');this.hex.maxLength=7;this.hex.onchange=()=>{if(/^#[0-9a-f]{6}$/i.test(this.hex.value))this.ui.choose(this.hex.value.toLowerCase());else this.sync();};
  s.element('div','cdt-color-pie-help',this.disk,'색상환 · 채도/명도 선택   |   바깥 색 우클릭: 편집');
  this.ui.draw();this.sync();this.root.focus({preventScroll:true});this.onKey=e=>this.key(e);s.doc.addEventListener('keydown',this.onKey,true);this.onResize=()=>this.close();s.win.addEventListener('resize',this.onResize);
 }
 renderSwatches(){if(!this.root)return;const s=this.s;this.swatches.replaceChildren();const colors=s.plugin.settings.paletteColors;
  // Existing palette and order are reused. Eight colors are shown at a time.
  this.page=Math.min(this.page||0,Math.max(0,Math.ceil(colors.length/8)-1));colors.slice(this.page*8,this.page*8+8).forEach((color,i)=>{const index=this.page*8+i,a=(-90+i*45)*Math.PI/180,b=s.element('button','cdt-color-pie-swatch',this.swatches);b.style.left=(50+44*Math.cos(a))+'%';b.style.top=(50+44*Math.sin(a))+'%';b.style.background=color;b.dataset.color=color;b.setAttribute('aria-label','파이 팔레트 '+(index+1)+' '+color);b.title=color+' · 우클릭: 편집';b.onclick=()=>this.ui.choose(s.plugin.settings.paletteColors[index]);b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();this.close();this.ui.editSwatch(index);};});
  if(colors.length>8){const pages=s.element('div','cdt-color-pie-pages',this.swatches);s.button(pages,'chevron-left','이전 팔레트 페이지',()=>{this.page=(this.page-1+Math.ceil(colors.length/8))%Math.ceil(colors.length/8);this.renderSwatches();this.sync();});s.element('span','',pages,`${this.page+1} / ${Math.ceil(colors.length/8)}`);s.button(pages,'chevron-right','다음 팔레트 페이지',()=>{this.page=(this.page+1)%Math.ceil(colors.length/8);this.renderSwatches();this.sync();});}
 }
 sync(){if(!this.root||!this.current)return;const color=hsvToHex(...this.ui.hsv);this.current.style.background=color;if(this.s.doc.activeElement!==this.hex)this.hex.value=color;for(const b of this.swatches.querySelectorAll('[data-color]')){const on=b.dataset.color.toLowerCase()===color;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));}}
 key(e){if(!this.root)return false;if(e.code==='Escape'||keyOf(e)===this.s.plugin.settings.shortcuts.colorPie){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)this.close();return true;}
  if(e.target===this.hex){e.stopPropagation();if(e.code==='Enter'){e.preventDefault();this.hex.onchange();this.close();}return true;}
  if(e.code==='Enter'){e.preventDefault();e.stopImmediatePropagation();this.close();return true;}
  if(e.code!=='Tab'){e.preventDefault();e.stopImmediatePropagation();}return true;
 }
 close(){if(!this.root)return;const s=this.s;this.ui.drag=null;if(this.ui.dragPointerId!==undefined&&this.ui.wheel.hasPointerCapture(this.ui.dragPointerId))this.ui.wheel.releasePointerCapture(this.ui.dragPointerId);
  this.ui.wheel.classList.remove('cdt-color-pie-wheel');if(this.wheelNext?.parentNode===this.wheelParent)this.wheelParent.insertBefore(this.ui.wheel,this.wheelNext);else this.wheelParent.append(this.ui.wheel);
  this.root.remove();this.root=null;this.unwatch?.();for(const {el,hidden}of this.panels||[])el.hidden=hidden;this.panels=null;s.doc.removeEventListener('keydown',this.onKey,true);s.win.removeEventListener('resize',this.onResize);if(s.drawing&&!s.disposed&&s.host.isConnected)s.host.focus({preventScroll:true});
 }
}
module.exports={ColorPie};
