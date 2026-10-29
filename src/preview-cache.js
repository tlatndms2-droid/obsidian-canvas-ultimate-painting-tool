'use strict';
// Share exact rendered thumbnails across Canvas/Markdown sessions. Bound retained
// canvases and keys; settings edits produce a new key, never a stale thumbnail.
const caches=new WeakMap();
function paint(settings,canvas,p,curve,draw){
 let cache=caches.get(settings);if(!cache)caches.set(settings,cache=new Map());
 const {defaults,...values}=p;
 // Material IDs are content hashes validated at import; do not duplicate masks
 // in every size/opacity variant's cache key.
 const material=a=>a&&typeof a==='object'&&a.mask?{id:a.id,kind:a.kind,width:a.width,height:a.height}:a;
 values.tips=(p.tips||[]).map(material);values.textureAsset=material(p.textureAsset);
 const key=JSON.stringify([values,curve,canvas.width,canvas.height]);
 if(key.length>8192){draw();return;}
 let image=cache.get(key);
 if(image){cache.delete(key);cache.set(key,image);const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(image,0,0);return;}
 draw();image=canvas.ownerDocument.createElement('canvas');image.width=canvas.width;image.height=canvas.height;image.getContext('2d').drawImage(canvas,0,0);cache.set(key,image);
 if(cache.size>64)cache.delete(cache.keys().next().value);
}
module.exports={paint};
