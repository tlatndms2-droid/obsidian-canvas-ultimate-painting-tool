const fs=require('fs');const file='poc/perf-plugin/lab.js';let src=fs.readFileSync(file,'utf8');
const old="const mask=document.createElement('canvas');mask.width=tip.width;mask.height=tip.height;const mx=mask.getContext('2d');mx.drawImage(tip,0,0);mx.globalCompositeOperation='source-in';mx.fillStyle=color;mx.fillRect(0,0,mask.width,mask.height);";
if(!src.includes(old))throw Error('Expected original stamp missing');
src=src.replace(old,'const mask=this.coloredTip(tip,color);');
src=src.replace('  paintStroke(ctx,s,st){',`  // Reuse the exact full-resolution colored mask. Keep a bounded FIFO cache;
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
  paintStroke(ctx,s,st){`);
src=src.replace('detach() {','detach() { this.tintCache?.clear();this.tintPixels=0;');
src=src.replace('실험실 0.0.2','실험실 0.0.3');
fs.writeFileSync(file,src);
