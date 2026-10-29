'use strict';
const {inkBounds}=require('../src/raster-edit');
const fontKeys=['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','tabSize','color','whiteSpace','wordBreak','overflowWrap'];
class MdNavigator{
 constructor(s){
  this.s=s;this.open=s.owner.data.navigatorVisible!==false;this.drag=null;this.lastDoc=null;this.lastTiles=null;
  this.box=s.element('div','cdt-panel mdt-navigator',s.host);this.box.setAttribute('aria-label','MD 문서와 필기 네비게이터');
  this.area=s.element('div','mdt-nav-area',this.box);this.area.setAttribute('role','img');this.area.setAttribute('aria-label','문서와 바깥 필기 전체 축소본');
  this.scene=s.element('div','mdt-nav-scene',this.area);this.text=s.element('div','cm-content mdt-nav-text',this.scene);this.text.setAttribute('aria-hidden','true');
  this.ink=s.element('canvas','mdt-nav-ink',this.area);this.frame=s.element('div','mdt-nav-viewport',this.area);
  this.fit=s.button(this.box,'maximize','MD 문서와 필기 전체 보기',()=>this.fitAll());this.fit.classList.add('mdt-nav-fit');
  this.button=s.button(s.tools,'map','MD 네비게이터 열기 / 닫기',()=>this.toggle());
  s.listen(this.area,'pointerdown',e=>this.down(e));s.listen(this.area,'pointermove',e=>this.move(e));
  for(const type of ['pointerup','pointercancel'])s.listen(this.area,type,e=>this.up(e));
  s.listen(this.box,'contextmenu',e=>e.preventDefault());
  s.listen(this.box,'wheel',e=>{e.preventDefault();e.stopPropagation();},{passive:false});
  this.refreshVisibility();
 }
 refreshVisibility(){if(!this.open&&this.drag){if(this.area.hasPointerCapture(this.drag.id))this.area.releasePointerCapture(this.drag.id);this.drag=null;this.area.classList.remove('is-dragging');}this.box.hidden=!this.open;this.button.setAttribute('aria-pressed',String(this.open));this.button.classList.toggle('is-active',this.open);}
 toggle(){const visible=!this.open;this.s.owner.data.navigatorVisible=visible;for(const session of this.s.owner.sessions.values())if(session.navigator){session.navigator.open=visible;session.navigator.refreshVisibility();session.scheduleRender();}this.s.owner.persist();}
 coordinates(){const s=this.s,c=s.cm.contentDOM.getBoundingClientRect(),scale=c.width/s.cm.contentDOM.offsetWidth||s.mdZoom.value;return{c,scale};}
 viewport(){const {c,scale}=this.coordinates(),h=this.s.host.getBoundingClientRect();return{left:(h.left-c.left)/scale,top:(h.top-c.top)/scale,right:(h.right-c.left)/scale,bottom:(h.bottom-c.top)/scale};}
 clone(el){const copy=el.cloneNode(true);for(const n of [copy,...copy.querySelectorAll('*')]){n.removeAttribute('id');n.removeAttribute('contenteditable');n.removeAttribute('tabindex');}return copy;}
 rebuildText(){
  const s=this.s,cm=s.cm,{c,scale}=this.coordinates(),width=cm.contentDOM.offsetWidth,live=!s.leaf.view.getState().source,titleText=cm.scrollDOM.querySelector('.inline-title')?.textContent||'';
  const style=s.win.getComputedStyle(cm.contentDOM),font=fontKeys.map(key=>style[key]).join(';');
  if(this.lastDoc===cm.state.doc&&this.lastWidth===width&&this.lastLive===live&&this.lastTitle===titleText&&this.lastFont===font)return;
  this.lastDoc=cm.state.doc;this.lastWidth=width;this.lastLive=live;this.lastTitle=titleText;this.lastFont=font;this.text.replaceChildren();
  for(const key of fontKeys)this.text.style[key]=style[key];
  Object.assign(this.text.style,{width:width+'px',padding:'0',minHeight:'0',height:'auto'});
  const paddingTop=parseFloat(style.paddingTop)||0,lines=cm.state.doc.lines;
  let bottom=0;const fragment=s.doc.createDocumentFragment();
  // Visible lines retain the exact editor markup. Virtualized lines use their
  // actual source text and CodeMirror's document-space line layout, never bars.
  for(let n=1;n<=lines;n++){
   const line=cm.state.doc.line(n),block=cm.lineBlockAt(line.from);if(block.from<line.from&&block.to>=line.to)continue;
   let original=null;const pos=cm.domAtPos(line.from+Math.min(1,line.length)),node=pos.node.nodeType===1?pos.node:pos.node.parentElement;
   const found=node?.closest?.('.cm-line');if(found&&cm.contentDOM.contains(found)){try{if(cm.posAtDOM(found,0)===line.from)original=found;}catch{}}
   const el=original?this.clone(original):s.doc.createElement('div');let top=paddingTop+block.top;
   if(original)top=(original.getBoundingClientRect().top-c.top)/scale;
   else{el.className='cm-line';el.textContent=line.text||'\u00a0';const heading=/^(#{1,6})\s+/.exec(line.text);if(heading){el.classList.add('HyperMD-header','HyperMD-header-'+heading[1].length);if(live)el.textContent=line.text.slice(heading[0].length);}}
   el.dataset.mdNavFrom=String(line.from);Object.assign(el.style,{position:'absolute',left:'0',top:top+'px',width:width+'px',margin:'0',minHeight:Math.max(1,block.height)+'px'});fragment.append(el);bottom=Math.max(bottom,paddingTop+block.bottom);
  }
  const title=cm.scrollDOM.querySelector('.inline-title');let left=0,top=0,right=width;
  if(title&&title.offsetHeight){const r=title.getBoundingClientRect(),el=this.clone(title),cs=s.win.getComputedStyle(title);for(const key of fontKeys)el.style[key]=cs[key];const x=(r.left-c.left)/scale,y=(r.top-c.top)/scale;Object.assign(el.style,{position:'absolute',left:x+'px',top:y+'px',width:title.offsetWidth+'px',height:title.offsetHeight+'px',margin:'0'});fragment.append(el);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+title.offsetWidth);}
  this.text.append(fragment);this.documentBounds={left,top,right,bottom:Math.max(bottom,1)};
 }
 render(){
  this.refreshVisibility();if(!this.open||!this.s.ready||this.s.navTextTimer)return;
  const s=this.s;this.rebuildText();
  if(this.lastTiles!==s.engine.tiles&&(!s.active||Date.now()-(this.boundsAt||0)>120)){this.lastTiles=s.engine.tiles;this.boundsAt=Date.now();this.paintBounds=inkBounds(s.engine.tiles);}
  const doc=this.documentBounds,ink=this.paintBounds;const raw={left:Math.min(doc.left,ink?.left??Infinity),top:Math.min(doc.top,ink?.top??Infinity),right:Math.max(doc.right,ink?.right??-Infinity),bottom:Math.max(doc.bottom,ink?.bottom??-Infinity)};
  const pad=Math.max(24,Math.max(raw.right-raw.left,raw.bottom-raw.top)*.035);this.contentBounds=raw;
  if(!this.drag)this.bounds={left:raw.left-pad,top:raw.top-pad,right:raw.right+pad,bottom:raw.bottom+pad};
  const b=this.bounds,w=this.area.clientWidth,h=this.area.clientHeight;if(!w||!h)return;
  this.ratio=Math.min(w/(b.right-b.left),h/(b.bottom-b.top));this.tx=(w-(b.right-b.left)*this.ratio)/2-b.left*this.ratio;this.ty=(h-(b.bottom-b.top)*this.ratio)/2-b.top*this.ratio;
  this.scene.style.transform=`translate(${this.tx}px,${this.ty}px) scale(${this.ratio})`;
  const dpr=s.win.devicePixelRatio||1;if(this.ink.width!==Math.ceil(w*dpr)||this.ink.height!==Math.ceil(h*dpr)){this.ink.width=Math.ceil(w*dpr);this.ink.height=Math.ceil(h*dpr);}
  const inkKey=[s.engine.displayTiles||s.engine.tiles,this.ink.width,this.ink.height,dpr,this.ratio,this.tx,this.ty];
  if(!this.inkKey||inkKey.some((v,i)=>v!==this.inkKey[i])){
   const ctx=this.ink.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,this.ink.width,this.ink.height);ctx.setTransform(this.ratio*dpr,0,0,this.ratio*dpr,this.tx*dpr,this.ty*dpr);s.engine.render(ctx);this.inkKey=inkKey;
  }
  const v=this.viewport();Object.assign(this.frame.style,{left:(this.tx+v.left*this.ratio)+'px',top:(this.ty+v.top*this.ratio)+'px',width:((v.right-v.left)*this.ratio)+'px',height:((v.bottom-v.top)*this.ratio)+'px'});
 }
 world(e){const r=this.area.getBoundingClientRect();return{x:(e.clientX-r.left-this.tx)/this.ratio,y:(e.clientY-r.top-this.ty)/this.ratio};}
 centerAt(x,y){const s=this.s,{c,scale}=this.coordinates(),h=s.host.getBoundingClientRect();s.panViewport(h.left+h.width/2-(c.left+x*scale),h.top+h.height/2-(c.top+y*scale));}
 down(e){if(!this.s.drawing||e.button!==0||!this.s.ready||this.s.active||this.s.selection.drag||this.s.figures.drag)return;e.preventDefault();e.stopImmediatePropagation();const p=this.world(e),v=this.viewport(),inside=p.x>=v.left&&p.x<=v.right&&p.y>=v.top&&p.y<=v.bottom;this.drag={id:e.pointerId,x:inside?p.x-(v.left+v.right)/2:0,y:inside?p.y-(v.top+v.bottom)/2:0};this.area.setPointerCapture(e.pointerId);this.area.classList.add('is-dragging');if(!inside)this.centerAt(p.x,p.y);}
 move(e){if(this.drag?.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const p=this.world(e);this.centerAt(p.x-this.drag.x,p.y-this.drag.y);}
 up(e){if(this.drag?.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();if(this.area.hasPointerCapture(e.pointerId))this.area.releasePointerCapture(e.pointerId);this.drag=null;this.area.classList.remove('is-dragging');this.s.scheduleRender();}
 fitAll(){if(!this.s.drawing||!this.contentBounds)return;const s=this.s,b=this.contentBounds,h=s.host.getBoundingClientRect(),z=Math.min(3,(h.width-100)/(b.right-b.left),(h.height-80)/(b.bottom-b.top));s.setZoom(z,undefined,{fit:true});this.centerAt((b.left+b.right)/2,(b.top+b.bottom)/2);}
 inspect(){return{open:this.open,bounds:this.bounds,contentBounds:this.contentBounds,paintBounds:this.paintBounds,documentBounds:this.documentBounds,ratio:this.ratio,tx:this.tx,ty:this.ty,viewport:this.s.ready?this.viewport():null,textLines:this.lastDoc?.lines};}
 destroy(){if(this.drag&&this.area.hasPointerCapture(this.drag.id))this.area.releasePointerCapture(this.drag.id);this.box.remove();this.button.remove();}
}
module.exports={MdNavigator};
