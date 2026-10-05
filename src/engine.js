'use strict';
// Raster tiles use Canvas coordinates, independent of viewport zoom and pan.
const TILE=256;
const {tipIndex,resolveAsset,applyTexture}=require('./materials');
class DrawingEngine {
  constructor(makeCanvas) {this.makeCanvas=makeCanvas;this.reset();}
  reset() {this.sharedTiles=new WeakSet([...this.seed?.values()||[]].map(t=>t.c));this.tiles=new Map([...this.seed||[]].map(([key,t])=>[key,{...t,ctx:t.ctx||t.c.getContext('2d',{willReadFrequently:true})}]));this.source=null;this.done=0;this.current=null;this.dabs=0;}
  writeTile(x,y){const key=x+','+y,old=this.tiles.get(key);if(old&&!this.sharedTiles.has(old.c)){old.revision=(old.revision||0)+1;return old;}const c=this.makeCanvas();c.width=c.height=TILE;const ctx=c.getContext('2d',{willReadFrequently:true});if(old)ctx.drawImage(old.c,0,0);const tile={x,y,c,ctx,revision:(old?.revision||0)+1};this.tiles.set(key,tile);return tile;}
  tile(map,x,y) {
    const key=x+','+y;
    if(!map.has(key)){const c=this.makeCanvas();c.width=c.height=TILE;map.set(key,{x,y,c,ctx:c.getContext('2d',{willReadFrequently:true})});}
    return map.get(key);
  }
  sync(strokes,activeId=null) {
    if(this.source!==strokes || this.done>strokes.length){this.reset();this.source=strokes;}
    while(this.done<strokes.length){
      const s=strokes[this.done];
      if(!this.current)this.current={s,tiles:new Map(),seen:0,last:null,carry:0,color:null};
      if(!s.tool){this.legacy(s);this.current=null;this.done++;continue;}
      this.advance();
      if(s.id===activeId)break;
      this.commit();this.done++;
    }
  }
  legacy(s) {
    const r=s.size/2+1;
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const [x,y] of s.points){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    for(let y=Math.floor((minY-r)/TILE);y<=Math.floor((maxY+r)/TILE);y++)for(let x=Math.floor((minX-r)/TILE);x<=Math.floor((maxX+r)/TILE);x++){
      const {ctx}=this.writeTile(x,y);ctx.save();ctx.translate(-x*TILE,-y*TILE);ctx.strokeStyle=ctx.fillStyle=s.color;ctx.lineWidth=s.size;ctx.lineCap=ctx.lineJoin='round';ctx.beginPath();
      if(s.points.length===1){ctx.arc(...s.points[0],s.size/2,0,Math.PI*2);ctx.fill();}
      else{ctx.moveTo(...s.points[0]);for(let i=1;i<s.points.length;i++)ctx.lineTo(...s.points[i]);ctx.stroke();}ctx.restore();
    }
  }
  advance() {
    const q=this.current,s=q.s,step=Math.max(.25,s.size*(s.spacing??.12));
    while(q.seen<s.points.length){
      const p=s.points[q.seen++];q.reference=s.mixSamples?.[q.seen-1];
      if(!q.last){this.stamp(p);q.last=p;continue;}
      const a=q.last,dx=p[0]-a[0],dy=p[1]-a[1],length=Math.hypot(dx,dy);
      if(length){let d=step-q.carry;for(;d<=length;d+=step)this.stamp(p.map((v,i)=>(a[i]??v)+(v-(a[i]??v))*d/length));q.carry=(q.carry+length)%step;}
      q.last=p;
    }
  }
  sample(x,y) {
    const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),px=Math.floor(x-tx*TILE),py=Math.floor(y-ty*TILE);
    const base=this.tiles.get(tx+','+ty)?.ctx.getImageData(px,py,1,1).data||[0,0,0,0];
    const q=this.current,over=q?.tiles.get(tx+','+ty)?.ctx.getImageData(px,py,1,1).data||[0,0,0,0];
    const a=over[3]/255*(q?.s.opacity??1),b=base[3]/255;
    if(q?.s.tool==='eraser')return [base[0],base[1],base[2],Math.round(base[3]*(1-a))];
    const out=a+b*(1-a);return out?[0,1,2].map(i=>(over[i]*a+base[i]*b*(1-a))/out).concat(out*255):[0,0,0,0];
  }
  stamp(p) {
    const q=this.current,s=q.s,index=q.index||0;q.index=index+1;
    if(!s.scatter){this.dab(p);return;}
    const random=n=>{const v=Math.sin((index+1)*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
    for(let i=0;i<s.particleCount;i++){const angle=random(i*2)*Math.PI*2,d=Math.sqrt(random(i*2+1))*s.size*s.spread/2;const point=p.slice();point[0]+=Math.cos(angle)*d;point[1]+=Math.sin(angle)*d;point[2]=(point[2]??1)*s.particleSize;this.dab(point);}
  }
  dab(p) {
    const q=this.current,s=q.s,r=s.size/2*(p[2]??1)*(s.tipScale??1);
    if(r<=0)return;
    let color=s.color,pigment=1;
    if(s.mix && s.tool==='brush'){
      const paint=[1,3,5].map(i=>parseInt(s.color.slice(i,i+2),16));
      const tx=Math.floor(p[0]/TILE),ty=Math.floor(p[1]/TILE);
      const picked=s.mixSource==='visible'&&q.reference?q.reference:this.tiles.get(tx+','+ty)?.ctx.getImageData(Math.floor(p[0]-tx*TILE),Math.floor(p[1]-ty*TILE),1,1).data||[0,0,0,0];
      const mixed=require('./color-mixing').mix(s,q,picked,p);pigment=mixed.pigment;if(!pigment)return;
      color=`rgb(${q.color.map(Math.round).join(',')})`;
    }
    const custom=s.tipType==='custom'&&s.tips?.length,texture=resolveAsset(s.textureAsset,this.assets);
    let stamp=null;
    if(custom||(s.texture&&s.textureEachPlot&&texture)){
      const i=tipIndex((q.index||1)-1,s.tips?.length||0,s.tipRepeat,q.seed??=(s.id||'').split('').reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0)),tip=custom?resolveAsset(s.tips[i],this.assets):null;
      if(custom&&!tip)return;
      const dimension=Math.max(2,Math.min(1024,Math.ceil(r*2))),stampKey=[tip?.id,dimension,color,s.hardness,s.texture&&s.textureEachPlot?texture?.id:'',s.textureDensity,s.textureScale,s.textureAngle,s.textureMode].join('|');this.stampCache??=new Map();const cached=this.stampCache.get(stampKey);if(cached)stamp=cached;else{const c=this.makeCanvas();c.width=c.height=dimension;const cx=c.getContext('2d');
      if(tip){this.maskCache??=new Map();let mask=this.maskCache.get(tip.id);if(!mask){mask=this.makeCanvas();mask.width=tip.width;mask.height=tip.height;const mc=mask.getContext('2d'),im=mc.createImageData(tip.width,tip.height),a=Buffer.from(tip.mask,'base64');for(let j=0;j<a.length;j++){im.data[j*4]=im.data[j*4+1]=im.data[j*4+2]=255;im.data[j*4+3]=a[j];}mc.putImageData(im,0,0);this.maskCache.set(tip.id,mask);}const ratio=dimension/Math.max(tip.width,tip.height),w=tip.width*ratio,h=tip.height*ratio;cx.drawImage(mask,(dimension-w)/2,(dimension-h)/2,w,h);cx.globalCompositeOperation='source-in';cx.fillStyle=color;cx.fillRect(0,0,dimension,dimension);}
      else{const radius=dimension/2,g=cx.createRadialGradient(radius,radius,radius*(s.hardness??1)*.999,radius,radius,radius);const rgb=color.startsWith('#')?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)):q.color.map(Math.round);g.addColorStop(0,color);g.addColorStop(1,`rgba(${rgb.join(',')},0)`);cx.fillStyle=g;cx.fillRect(0,0,dimension,dimension);}
      if(s.texture&&s.textureEachPlot)applyTexture(c,s,texture);stamp=c;let pixels=[...this.stampCache.values()].reduce((n,c)=>n+c.width*c.height,0);while(this.stampCache.size&&(this.stampCache.size>=24||pixels+dimension*dimension>4194304)){const key=this.stampCache.keys().next().value,old=this.stampCache.get(key);pixels-=old.width*old.height;this.stampCache.delete(key);}this.stampCache.set(stampKey,c);}
    }
    const extent=r*1.42+1;
    for(let y=Math.floor((p[1]-extent)/TILE);y<=Math.floor((p[1]+extent)/TILE);y++)for(let x=Math.floor((p[0]-extent)/TILE);x<=Math.floor((p[0]+extent)/TILE);x++){
      const tile=this.tile(q.tiles,x,y);tile.revision=(tile.revision||0)+1;const {ctx}=tile,cx=p[0]-x*TILE,cy=p[1]-y*TILE;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(((s.angle||0)+(p[5]||0))*Math.PI/180);ctx.scale((s.roundness??1)*(s.flipX?-1:1),s.flipY?-1:1);
      ctx.globalAlpha=(s.density??1)*pigment*(p[3]??1)*(p[4]??1);
      if(stamp){ctx.drawImage(stamp,-r,-r,r*2,r*2);ctx.restore();continue;}
      const hardness=s.hardness??1;
      if(hardness<1){
        const gradient=ctx.createRadialGradient(0,0,Math.max(0,r*hardness),0,0,r);
        // Fade alpha only. Transparent black also interpolates RGB toward black.
        const rgb=color.startsWith('#')?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)):q.color.map(Math.round);
        gradient.addColorStop(0,color);gradient.addColorStop(1,`rgba(${rgb.join(',')},0)`);ctx.fillStyle=gradient;
      }
      else ctx.fillStyle=color;
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    this.dabs++;
  }
  commit() {
    const q=this.current;
    for(const t of q.tiles.values()){
      const target=this.writeTile(t.x,t.y);const {ctx}=target;ctx.save();ctx.globalAlpha=q.s.opacity??1;ctx.globalCompositeOperation=q.s.tool==='eraser'?'destination-out':(q.s.alphaLock?'source-atop':(q.s.blend||'source-over'));ctx.drawImage(this.textured(t,q.s),0,0);ctx.restore();
    }
    this.current=null;
  }
  textured(t,s){this.textureCache??=new WeakMap();const old=this.textureCache.get(t);if(old&&old.s===s&&old.revision===t.revision)return old.c;const result=this.textureOnly(t,s);if(!s.selectionClip){this.textureCache.set(t,{s,revision:t.revision,c:result});return result;}const c=this.makeCanvas();c.width=c.height=TILE;const ctx=c.getContext('2d');ctx.drawImage(result,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(require('./selection-mask').mask(this.makeCanvas,s.selectionClip,t.x*TILE,t.y*TILE),0,0);this.textureCache.set(t,{s,revision:t.revision,c});return c;}
  textureOnly(t,s){const a=resolveAsset(s.textureAsset,this.assets);if(!s.texture||s.textureEachPlot||!a)return t.c;const c=this.makeCanvas();c.width=c.height=TILE;c.getContext('2d').drawImage(t.c,0,0);return applyTexture(c,s,a,t.x*TILE,t.y*TILE);}
  renderTile(ctx,key) {
    const base=this.tiles.get(key),over=this.current?.tiles.get(key),t=base||over;if(!t)return;const x=t.x*TILE,y=t.y*TILE;
    if(!over){ctx.drawImage(base.c,x,y);return;}
    if(!this.composite){this.composite=this.makeCanvas();this.composite.width=this.composite.height=TILE;}
    const c=this.composite.getContext('2d');c.clearRect(0,0,TILE,TILE);if(base)c.drawImage(base.c,0,0);
    c.save();c.globalAlpha=this.current.s.opacity??1;c.globalCompositeOperation=this.current.s.tool==='eraser'?'destination-out':(this.current.s.alphaLock?'source-atop':(this.current.s.blend||'source-over'));c.drawImage(this.textured(over,this.current.s),0,0);c.restore();ctx.drawImage(this.composite,x,y);
  }
  render(ctx,bounds) {for(const key of new Set([...this.tiles.keys(),...(this.current?.tiles.keys()||[])])){const t=this.tiles.get(key)||this.current.tiles.get(key),x=t.x*TILE,y=t.y*TILE;if(bounds&&(x+TILE<bounds.left||x>bounds.right||y+TILE<bounds.top||y>bounds.bottom))continue;this.renderTile(ctx,key);}}
}
module.exports={DrawingEngine,TILE};
