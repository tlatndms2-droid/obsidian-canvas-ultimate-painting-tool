'use strict';
// Ordered add/subtract polygons. The same mask is used by selection editing and painting.
function mask(make,regions,x,y,size=256){const c=make();c.width=c.height=size;const ctx=c.getContext('2d');ctx.fillStyle='#fff';for(const r of regions){ctx.globalCompositeOperation=r.op==='subtract'?'destination-out':'source-over';ctx.beginPath();r.points.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0]-x,p[1]-y));ctx.closePath();ctx.fill();}return c;}
function contains(regions,p){let selected=false;for(const r of regions){let inside=false;for(let i=0,j=r.points.length-1;i<r.points.length;j=i++){const a=r.points[i],b=r.points[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)selected=r.op!=='subtract';}return selected;}
module.exports={mask,contains};
