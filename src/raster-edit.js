'use strict';
const {TILE}=require('./engine');
const identity=()=>[1,0,0,1,0,0];
const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function inverse(m){const d=m[0]*m[3]-m[1]*m[2];return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
const translation=(x,y)=>[1,0,0,1,x,y];
const around=(p,m)=>multiply(translation(...p),multiply(m,translation(-p[0],-p[1])));
function bounds(points){if(!points.length)return null;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {left:Math.min(...xs),top:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};}
const corners=b=>[[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom]];
function canvas(make,w=TILE,h=TILE){const c=make();c.width=w;c.height=h;return c;}
function hasInk(c){const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<a.length;i+=4)if(a[i])return true;return false;}
function inkBounds(tiles){let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;for(const tile of tiles.values()){const a=tile.c.getContext('2d').getImageData(0,0,TILE,TILE).data;for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++)if(a[(y*TILE+x)*4+3]){l=Math.min(l,tile.x*TILE+x);t=Math.min(t,tile.y*TILE+y);r=Math.max(r,tile.x*TILE+x+1);b=Math.max(b,tile.y*TILE+y+1);}}return Number.isFinite(l)?{left:l,top:t,right:r,bottom:b}:null;}
function split(make,tiles,polygon){const selected=new Map(),remainder=new Map();for(const [key,t]of tiles){for(const [out,operation]of [[selected,'destination-in'],[remainder,'destination-out']]){const c=canvas(make),ctx=c.getContext('2d');ctx.drawImage(t.c,0,0);if(polygon?.[0]?.points){ctx.globalCompositeOperation=operation;ctx.drawImage(require('./selection-mask').mask(make,polygon,t.x*TILE,t.y*TILE),0,0);}else if(polygon){ctx.globalCompositeOperation=operation;ctx.beginPath();polygon.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0]-t.x*TILE,p[1]-t.y*TILE));ctx.closePath();ctx.fill();}else if(out===remainder)ctx.clearRect(0,0,TILE,TILE);if(hasInk(c))out.set(key,{x:t.x,y:t.y,c});}}return {selected,remainder};}
function merge(make,...maps){const result=new Map();for(const tiles of maps)for(const [key,t]of tiles){let dst=result.get(key);if(!dst){dst={x:t.x,y:t.y,c:canvas(make)};result.set(key,dst);}dst.c.getContext('2d').drawImage(t.c,0,0);}return result;}
function transform(make,tiles,m){if(!tiles.size)return new Map();const b=inkBounds(tiles);if(!b)return new Map();const outBounds=bounds(corners(b).map(p=>point(m,p))),result=new Map();
 const width=b.right-b.left,height=b.bottom-b.top;
 if(width*height<=16777216&&width<=8192&&height<=8192){const source=canvas(make,width,height),sc=source.getContext('2d');for(const t of tiles.values())sc.drawImage(t.c,t.x*TILE-b.left,t.y*TILE-b.top);for(let y=Math.floor(outBounds.top/TILE);y<Math.ceil(outBounds.bottom/TILE);y++)for(let x=Math.floor(outBounds.left/TILE);x<Math.ceil(outBounds.right/TILE);x++){const c=canvas(make),ctx=c.getContext('2d');ctx.translate(-x*TILE,-y*TILE);ctx.transform(...m);ctx.drawImage(source,b.left,b.top);if(hasInk(c))result.set(x+','+y,{x,y,c});}return result;}
 // Sample in premultiplied alpha across tile edges; no giant temporary bitmap.
 const inv=inverse(m),pixels=new Map([...tiles].map(([key,t])=>[key,t.c.getContext('2d').getImageData(0,0,TILE,TILE).data]));
 const read=(x,y,k)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),a=pixels.get(tx+','+ty);return a?a[((y-ty*TILE)*TILE+x-tx*TILE)*4+k]:0;};
 for(let ty=Math.floor(outBounds.top/TILE);ty<Math.ceil(outBounds.bottom/TILE);ty++)for(let tx=Math.floor(outBounds.left/TILE);tx<Math.ceil(outBounds.right/TILE);tx++){const c=canvas(make),ctx=c.getContext('2d'),img=ctx.createImageData(TILE,TILE);let used=false;
  for(let y=Math.max(0,Math.floor(outBounds.top-ty*TILE));y<Math.min(TILE,Math.ceil(outBounds.bottom-ty*TILE));y++)for(let x=Math.max(0,Math.floor(outBounds.left-tx*TILE));x<Math.min(TILE,Math.ceil(outBounds.right-tx*TILE));x++){const p=point(inv,[tx*TILE+x+.5,ty*TILE+y+.5]),sx=p[0]-.5,sy=p[1]-.5,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy],xx=[ix,ix+1,ix,ix+1],yy=[iy,iy,iy+1,iy+1],alpha=weights.map((w,i)=>w*read(xx[i],yy[i],3)),a=alpha.reduce((s,v)=>s+v,0),offset=(y*TILE+x)*4;if(a<.5)continue;used=true;img.data[offset+3]=a;for(let k=0;k<3;k++)img.data[offset+k]=alpha.reduce((sum,v,i)=>sum+v*read(xx[i],yy[i],k),0)/a;}
  if(used){ctx.putImageData(img,0,0);result.set(tx+','+ty,{x:tx,y:ty,c});}
 }return result;
}
function serialize(tiles,renderer){return [...tiles.values()].filter(t=>hasInk(t.c)).map(t=>{const png=t.c.toDataURL('image/png');renderer?.images.set(png,t.c);return {x:t.x,y:t.y,png};});}
module.exports={identity,point,multiply,inverse,translation,around,bounds,corners,inkBounds,split,merge,transform,serialize};
