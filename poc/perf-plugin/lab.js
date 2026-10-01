const clone = value => JSON.parse(JSON.stringify(value));

module.exports = class DrawingLab extends Base {
  async sync(){if(this.syncBusy)return;this.syncBusy=true;try{await super.sync()}finally{this.syncBusy=false}}
  async onload() {
    this.color = '#d53c83'; this.size = 12; this.opacity = 1;
    this.mixing=false;this.mixStrength=.5;this.mixScope='current';this.pressureEnabled=true;this.minSize=.1;this.spacing=.15;this.stabilization=0;this.roundness=1;this.angle=0;this.hardness=1;this.scatter=0;this.flow=1;
    this.layers=[{id:'one',name:'Layer 1',visible:true,locked:false,opacity:1,blend:'source-over'},{id:'two',name:'Layer 2',visible:true,locked:false,opacity:1,blend:'source-over'}];this.activeLayer='one';this.tips=[];this.tipId='';this.tipImages=new Map();
    this.penProof={events:0,min:1,max:0,tiltX:0,tiltY:0};this.historyBindings = new Map();
    await super.onload();
  }

  attach() {
    this.layers=[{id:'one',name:'Layer 1',visible:true,locked:false,opacity:1,blend:'source-over'},{id:'two',name:'Layer 2',visible:true,locked:false,opacity:1,blend:'source-over'}];this.activeLayer='one';this.penProof={events:0,min:1,max:0,tiltX:0,tiltY:0};
    super.attach();
    this.controls.classList.add('drawing-lab');
    const add = (label, fn) => { const b=document.createElement('button');b.textContent=label;b.onclick=fn;this.controls.append(b);return b; };
    this.colorInput=document.createElement('input');this.colorInput.type='color';this.colorInput.value=this.color;
    this.colorInput.setAttribute('aria-label','붓 색');this.colorInput.oninput=()=>this.color=this.colorInput.value;this.controls.append(this.colorInput);
    this.sizeInput=document.createElement('input');this.sizeInput.type='range';this.sizeInput.min='1';this.sizeInput.max='80';this.sizeInput.value=String(this.size);
    this.sizeInput.setAttribute('aria-label','붓 크기');this.sizeInput.oninput=()=>this.size=Number(this.sizeInput.value);this.controls.append(this.sizeInput);
    this.eyeButton=add('스포이드',()=>this.setMode('eye'));
    add('되돌리기',()=>this.obCanvas?.undo());add('다시 실행',()=>this.obCanvas?.redo());
    this.status=document.createElement('div');this.status.className='drawing-lab-status';this.status.textContent='실험실 0.0.3 · 그림 → 카드 이동 → 그림 → 되돌리기를 시험하세요.';this.host.append(this.status);
    this.obCanvas=this.app.workspace.activeLeaf.view.canvas;
    this.installHistory(this.obCanvas);
    this.attachOptions();
  }

  detach() { this.tintCache?.clear();this.tintPixels=0; this.options?.remove();this.options=null;this.status?.remove();this.status=null;super.detach(); }

  setMode(mode) { super.setMode(mode);this.eyeButton?.classList.toggle('is-active',mode==='eye'); }

  snapshot() { return {layers:clone(this.layers),strokes:this.strokes.map(s=>({points:s.map(p=>[...p]),style:clone(s.style||{color:'#dd3c84',size:5,opacity:1,layer:'one'})}))}; }
  restore(data) {const items=Array.isArray(data)?data:(data?.strokes||[]);if(data?.layers)this.layers=clone(data.layers);this.strokes=items.map(s=>{const p=s.points.map(p=>[...p]);p.style=clone(s.style);return p});this.strokeBounds=this.strokes.map(s=>this.getBounds(s));this.render(); }

  attachOptions(){
    const panel=document.createElement('details');panel.className='drawing-lab-options';panel.open=true;const summary=document.createElement('summary');summary.textContent='브러시 · 레이어 시험';panel.append(summary);this.host.append(panel);this.options=panel;
    const label=(text,el)=>{const l=document.createElement('label');l.append(text,el);panel.append(l);return el};
    const range=(text,key,min,max,step)=>{const i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;i.value=this[key];i.setAttribute('aria-label',text);i.oninput=()=>{this[key]=Number(i.value);this.status.textContent=text+': '+i.value};return label(text,i)};
    const check=(text,key)=>{const i=document.createElement('input');i.type='checkbox';i.checked=this[key];i.setAttribute('aria-label',text);i.onchange=()=>this[key]=i.checked;return label(text,i)};
    check('색 혼합 켜기','mixing');range('색 혼합 강도','mixStrength',0,1,.05);const scope=document.createElement('select');scope.setAttribute('aria-label','혼합 참조');scope.innerHTML='<option value="current">현재 레이어 색만</option><option value="visible">보이는 그림 레이어 색</option>';scope.value=this.mixScope;scope.onchange=()=>this.mixScope=scope.value;label('혼합 참조',scope);
    check('필압으로 굵기','pressureEnabled');range('최소 굵기 비율','minSize',.01,1,.01);range('불투명도','opacity',.05,1,.05);range('브러시 간격','spacing',.05,2,.05);range('손떨림 보정','stabilization',0,.9,.1);range('둥근 정도','roundness',.1,1,.1);range('각도','angle',0,180,5);range('가장자리 선명도','hardness',.1,1,.1);range('흩뿌림','scatter',0,1,.1);range('물감 흐름','flow',.1,1,.1);
    this.penInfo=document.createElement('div');this.penInfo.className='lab-pen-info';this.penInfo.textContent='실제 펜으로 그리면 필압·기울기가 여기에 표시됩니다.';summary.after(this.penInfo);
    const layer=document.createElement('select');layer.setAttribute('aria-label','현재 레이어');layer.innerHTML=this.layers.map(l=>'<option value="'+l.id+'">'+l.name+'</option>').join('');layer.value=this.activeLayer;layer.onchange=()=>{this.activeLayer=layer.value;this.updateLayerControls()};label('현재 레이어',layer);
    const blend=document.createElement('select');blend.setAttribute('aria-label','레이어 혼합');for(const mode of ['source-over','multiply','screen','overlay','darken','lighten','difference']){const o=document.createElement('option');o.value=mode;o.textContent=mode;blend.append(o)}blend.onchange=()=>this.editLayer({blend:blend.value});label('레이어 혼합',blend);this.blendInput=blend;
    const visible=document.createElement('input');visible.type='checkbox';visible.setAttribute('aria-label','레이어 표시');visible.onchange=()=>this.editLayer({visible:visible.checked});label('레이어 표시',visible);this.visibleInput=visible;
    const locked=document.createElement('input');locked.type='checkbox';locked.setAttribute('aria-label','레이어 잠금');locked.onchange=()=>this.editLayer({locked:locked.checked});label('레이어 잠금',locked);this.lockedInput=locked;
    const alpha=document.createElement('input');alpha.type='range';alpha.min='0';alpha.max='1';alpha.step='.05';alpha.setAttribute('aria-label','레이어 불투명도');alpha.onchange=()=>this.editLayer({opacity:Number(alpha.value)});label('레이어 불투명도',alpha);this.layerAlphaInput=alpha;
    const input=document.createElement('input');input.type='file';input.accept='.abr';input.setAttribute('aria-label','ABR 가져오기');input.onchange=async()=>{try{const f=input.files[0];if(f)await this.importAbr(await f.arrayBuffer(),f.name)}catch(e){this.status.textContent='ABR 오류: '+e.message;console.error(e)}};label('ABR 가져오기',input);
    this.tipSelect=document.createElement('select');this.tipSelect.setAttribute('aria-label','브러시 팁');this.tipSelect.onchange=()=>this.tipId=this.tipSelect.value;label('브러시 팁',this.tipSelect);this.updateTips();this.updateLayerControls();
  }
  editLayer(values){Object.assign(this.layers.find(l=>l.id===this.activeLayer),values);this.obCanvas.pushHistory(this.obCanvas.getData());this.render();this.queueSave();}
  updateLayerControls(){const l=this.layers.find(l=>l.id===this.activeLayer)||this.layers[0];if(this.blendInput){this.blendInput.value=l.blend;this.visibleInput.checked=l.visible;this.lockedInput.checked=l.locked;this.layerAlphaInput.value=l.opacity}}
  updateTips(){if(!this.tipSelect)return;this.tipSelect.replaceChildren();const basic=document.createElement('option');basic.value='';basic.textContent='기본 원형';this.tipSelect.append(basic);for(const t of this.tips){const o=document.createElement('option');o.value=t.id;o.textContent=t.name;this.tipSelect.append(o)}this.tipSelect.value=this.tipId;}
  async importAbr(buffer,name){
    if(buffer.byteLength>32*1024*1024)throw Error('시험 버전: 32 MB 이하 파일을 사용하세요');
    const abr=new LabDeps.AbrBrushFile(buffer);const imported=[];
    for(const sample of abr.samples){if(sample.width>4096||sample.height>4096)continue;const bytes=sample.getOrCreatePNG();const img=new Image();img.src='data:image/png;base64,'+Buffer.from(bytes).toString('base64');await img.decode();const c=document.createElement('canvas');c.width=sample.width;c.height=sample.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const pixels=x.getImageData(0,0,c.width,c.height);for(let i=0;i<pixels.data.length;i+=4){const alpha=pixels.data[i];pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=alpha}x.putImageData(pixels,0,0);const tip={id:name+':'+sample.index,name:sample.brushName||name+' '+sample.index,width:sample.width,height:sample.height,png:c.toDataURL(),settings:sample.brushData};imported.push(tip);this.tipImages.set(tip.id,c)}
    this.tips=this.tips.filter(t=>!imported.some(n=>n.id===t.id)).concat(imported);this.tipId=imported[0]?.id||'';this.updateTips();this.lastImport={file:name,version:abr.version,subversion:abr.subversion,count:imported.length,limit:'팁과 이름 변환. Dynamics·Dual Brush 등의 설정은 원본 자료 보존만 하며 아직 자동 적용하지 않음.'};this.status.textContent=imported.length+'개 팁 가져옴 · 이름/팁 사용 가능 · 고급 설정 자동 변환은 후속 확인';this.queueSave();
  }
  toCanvasPoint(event){let p=super.toCanvasPoint(event);if(this.active&&this.stabilization){const prev=this.active.points[this.active.points.length-1];p=p.map((v,i)=>v*(1-this.stabilization)+prev[i]*this.stabilization)}const pressure=event.pointerType==='pen'?event.pressure:1;const info={type:event.pointerType,pressure:pressure,tiltX:event.tiltX||0,tiltY:event.tiltY||0,trusted:event.isTrusted};this.lastPen=info;if(info.type==='pen'&&info.trusted&&pressure>0){this.penProof.events++;this.penProof.min=Math.min(this.penProof.min,pressure);this.penProof.max=Math.max(this.penProof.max,pressure);this.penProof.tiltX=Math.max(this.penProof.tiltX,Math.abs(info.tiltX));this.penProof.tiltY=Math.max(this.penProof.tiltY,Math.abs(info.tiltY))}if(this.penInfo)this.penInfo.textContent=info.type+' · 필압 '+pressure.toFixed(3)+' · 기울기 '+info.tiltX+'/'+info.tiltY+(info.trusted?'':' · 자동 시험');return [...p,pressure,event.tiltX||0,event.tiltY||0];}
  sampleMix(event){if(!this.mixing||!this.raster)return this.color;const surface=this.mixReference||(this.mixScope==='current'?this.layerSurfaces?.get(this.activeLayer):this.raster);if(!surface)return this.color;const r=this.host.getBoundingClientRect(),d=devicePixelRatio||1,x=Math.floor((event.clientX-r.x)*d),y=Math.floor((event.clientY-r.y)*d);if(x<0||y<0||x>=surface.width||y>=surface.height)return this.color;const px=surface.getContext('2d').getImageData(x,y,1,1).data;if(!px[3])return this.color;const picked='#'+[...px].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');return LabDeps.spectral.mix([new LabDeps.spectral.Color(this.color),1-this.mixStrength],[new LabDeps.spectral.Color(picked),this.mixStrength]).toString();}

  installHistory(c) {
    if(this.historyBindings.has(c))return;
    const push=c.history.push,replace=c.history.replace,apply=c.applyHistory;
    const plugin=this;
    for(const entry of c.history.data)entry.__drawingLab=[];
    c.history.push=function(data){const next={...data,__drawingLab:plugin.filePath===c.view.file?.path?plugin.snapshot():[]};return push.call(this,next)};
    c.history.replace=function(data){const next={...data,__drawingLab:plugin.filePath===c.view.file?.path?plugin.snapshot():[]};return replace.call(this,next)};
    c.applyHistory=function(data){const {__drawingLab,...native}=data;apply.call(c,native);if(plugin.filePath===c.view.file?.path){plugin.restore(__drawingLab||[]);plugin.queueSave();if(plugin.status)plugin.status.textContent='되돌리기/다시 실행 · 그림 '+plugin.strokes.length+'개'}};
    this.historyBindings.set(c,{push,replace,apply});
  }

  handlePointerDown(event) {
    if(this.loadingDrawing)return;
    if(this.mode==='eye'&&event.button===0&&!event.target.closest('.canvas-drawing-poc-controls,.canvas-controls,.drawing-lab-status')){
      event.preventDefault();event.stopImmediatePropagation();
      this.pickScreenColor(event.clientX,event.clientY).catch(e=>{if(this.status)this.status.textContent='색 선택 오류: '+e.message;console.error(e)});return;
    }
    if(event.target.closest('.drawing-lab-options'))return;
    if(this.mode==='draw'&&this.layers.find(l=>l.id===this.activeLayer)?.locked){event.preventDefault();event.stopImmediatePropagation();this.status.textContent='현재 레이어가 잠겨 있습니다';return}
    if(this.mode==='draw'&&this.mixing){const source=this.mixScope==='current'?this.layerSurfaces?.get(this.activeLayer):this.raster;this.mixReference=document.createElement('canvas');this.mixReference.width=source?.width||1;this.mixReference.height=source?.height||1;if(source)this.mixReference.getContext('2d',{willReadFrequently:true}).drawImage(source,0,0)}
    const mixed=this.mode==='draw'?this.sampleMix(event):this.color;
    if(this.mode==='draw'&&!this.spaceHeld&&event.button===0&&!event.target.closest('.canvas-drawing-poc-controls,.canvas-controls'))this.obCanvas?.requestPushHistory?.run();
    super.handlePointerDown(event);
    if(this.active){this.active.points.style={color:this.color,size:this.size,opacity:this.opacity,layer:this.activeLayer,colors:[mixed],pressure:this.pressureEnabled,minSize:this.minSize,tipId:this.tipId,spacing:this.spacing,roundness:this.roundness,angle:this.angle,hardness:this.hardness,scatter:this.scatter,flow:this.flow};this.render();}
  }

  handlePointerMove(event){if(this.active)this.active.points.style.colors.push(this.sampleMix(event));super.handlePointerMove(event);}

  handlePointerUp(event) {
    const wasActive=!!this.active;super.handlePointerUp(event);
    this.mixReference=null;
    if(wasActive&&!this.active){this.obCanvas.pushHistory(this.obCanvas.getData());if(this.status)this.status.textContent='그림 '+this.strokes.length+'개 · Canvas와 같은 되돌리기 순서';}
  }

  async pickScreenColor(x,y) {
    const remote=require('@electron/remote');
    const picture=await remote.getCurrentWebContents().capturePage({x:Math.floor(x),y:Math.floor(y),width:1,height:1});
    if(picture.isEmpty())throw new Error('화면 캡처가 비어 있습니다');
    const img=new Image();img.src=picture.toDataURL();await img.decode();
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    const rgb=ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data;
    this.color='#'+[...rgb].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');this.colorInput.value=this.color;
    this.lastPicked={x,y,color:this.color};this.setMode('draw');if(this.status)this.status.textContent='화면에서 선택한 색: '+this.color+' · 이 색으로 그려보세요.';
  }

  render() {
    if(!this.raster)return;
    const cr=this.canvas.getBoundingClientRect(),hr=this.host.getBoundingClientRect(),scale=cr.width/this.canvas.offsetWidth,dpr=devicePixelRatio||1;
    if(!scale||!hr.width||!hr.height)return;
    const w=Math.ceil(hr.width*dpr),h=Math.ceil(hr.height*dpr);if(this.raster.width!==w||this.raster.height!==h){this.raster.width=w;this.raster.height=h}
    const ctx=this.raster.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.setTransform(scale*dpr,0,0,scale*dpr,(cr.left-hr.left)*dpr,(cr.top-hr.top)*dpr);ctx.lineCap='round';ctx.lineJoin='round';
    let count=0;this.layerSurfaces=this.layerSurfaces||new Map();for(const layer of this.layers){let surface=this.layerSurfaces.get(layer.id);if(!surface){surface=document.createElement('canvas');this.layerSurfaces.set(layer.id,surface)}if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h}const lx=surface.getContext('2d',{willReadFrequently:true});lx.setTransform(1,0,0,1,0,0);lx.clearRect(0,0,w,h);lx.setTransform(scale*dpr,0,0,scale*dpr,(cr.left-hr.left)*dpr,(cr.top-hr.top)*dpr);
      for(const s of this.strokes){if(!s.length)continue;const st=s.style||{color:'#dd3c84',size:5,opacity:1};if((st.layer||'one')!==layer.id)continue;const bb=this.getBounds(s);if(cr.left+bb.right*scale<hr.left-100||cr.left+bb.left*scale>hr.right+100||cr.top+bb.bottom*scale<hr.top-100||cr.top+bb.top*scale>hr.bottom+100)continue;this.paintStroke(lx,s,st);count++}
      if(layer.visible){ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation=layer.blend;ctx.globalAlpha=layer.opacity;ctx.drawImage(surface,0,0)}}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;this.renderedStrokeCount=count;
  }

  // Reuse the exact full-resolution colored mask. Keep a bounded FIFO cache;
  // source object identity also invalidates entries after a brush is reimported.
  coloredTip(tip,color){
    this.tintCache ||= new Map();this.tintPixels ||= 0;
    let colors=this.tintCache.get(tip);if(colors?.has(color))return colors.get(color);
    const mask=document.createElement('canvas');mask.width=tip.width;mask.height=tip.height;
    const mx=mask.getContext('2d');mx.drawImage(tip,0,0);mx.globalCompositeOperation='source-in';mx.fillStyle=color;mx.fillRect(0,0,mask.width,mask.height);
    const pixels=mask.width*mask.height;
    while(this.tintPixels+pixels>16000000&&this.tintCache.size){
      const [oldTip,oldColors]=this.tintCache.entries().next().value;
      const oldColor=oldColors.keys().next().value;const oldMask=oldColors.get(oldColor);
      this.tintPixels-=oldMask.width*oldMask.height;oldColors.delete(oldColor);
      if(!oldColors.size)this.tintCache.delete(oldTip);
    }
    if(pixels<=16000000){colors=this.tintCache.get(tip)||new Map();colors.set(color,mask);this.tintCache.set(tip,colors);this.tintPixels+=pixels;}
    return mask;
  }
  paintStroke(ctx,s,st){
    const spacing=Math.max(.5,st.size*(st.spacing||.15));let remaining=0;let stampIndex=0;
    const stamp=(x,y,pressure,color)=>{const size=st.size*(st.pressure?Math.max(st.minSize||.1,pressure??1):1);const jitter=st.scatter||0;x+=Math.sin(stampIndex*12.98)*size*jitter;y+=Math.cos(stampIndex*9.23)*size*jitter;stampIndex++;ctx.save();ctx.translate(x,y);ctx.rotate((st.angle||0)*Math.PI/180);ctx.scale(1,st.roundness||1);ctx.globalAlpha=st.opacity*(st.flow||1);const tip=this.tipImages.get(st.tipId);if(tip){const mask=this.coloredTip(tip,color);ctx.drawImage(mask,-size/2,-size*tip.height/tip.width/2,size,size*tip.height/tip.width)}else{const r=size/2;if((st.hardness??1)<1){const g=ctx.createRadialGradient(0,0,r*st.hardness,0,0,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');ctx.fillStyle=g}else ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill()}ctx.restore()};
    stamp(s[0][0],s[0][1],s[0][2],st.colors?.[0]||st.color);for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!length)continue;let pos=spacing-remaining;for(;pos<=length;pos+=spacing){const t=pos/length;stamp(a[0]+dx*t,a[1]+dy*t,(a[2]??1)*(1-t)+(b[2]??1)*t,st.colors?.[i]||st.color)}remaining=(remaining+length)%spacing}
  }

  async loadStrokes(path) {
    this.loadingDrawing=true;try{
    const serial=++this.loadSerial;const name=this.dataPath(path);if(!await this.app.vault.adapter.exists(name))return;
    const data=JSON.parse(await this.app.vault.adapter.read(name));if(serial!==this.loadSerial||this.filePath!==path)return;
    if(data.tips){this.tips=data.tips;for(const tip of this.tips){const image=new Image();image.src=tip.png;await image.decode();this.tipImages.set(tip.id,image)}this.updateTips()}
    if(data.penProof)this.penProof=data.penProof;if(data.labStrokes)this.restore(data.labStrokes);else {this.strokes=data.strokes||[];this.strokeBounds=this.strokes.map(s=>this.getBounds(s));this.render()}this.updateLayerControls();
    const c=this.obCanvas;if(c)for(const entry of c.history.data)entry.__drawingLab=this.snapshot();
    }finally{this.loadingDrawing=false}
  }
  async save() { if(!this.filePath||this.loadingDrawing)return;await this.app.vault.adapter.write(this.dataPath(this.filePath),JSON.stringify({version:2,strokes:this.strokes.map(s=>s.map(p=>[...p])),labStrokes:this.snapshot(),tips:this.tips,penProof:this.penProof})); }

  onunload(){for(const[c,old]of this.historyBindings){c.history.push=old.push;c.history.replace=old.replace;c.applyHistory=old.apply;for(const entry of c.history.data)delete entry.__drawingLab;}this.historyBindings.clear();super.onunload();}
};
