const fs=require('fs');const {chromium}=require('playwright');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9287');const p=b.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
const result=await p.evaluate(source=>{
 const q=app.plugins.plugins['canvas-drawing-integration-poc'];if(q.active)throw Error('User drawing; retry later');
 const m={};new Function('Base','module',source)(class{},m);const optimized=Object.create(q);optimized.paintStroke=m.exports.prototype.paintStroke;optimized.coloredTip=m.exports.prototype.coloredTip;
 const ids=[q.tipId,...q.tips.filter(t=>t.width>=1400).slice(0,2).map(t=>t.id)].filter((v,i,a)=>a.indexOf(v)===i);
 const cases=[];for(const id of ids){const tip=q.tipImages.get(id);if(!tip)continue;
 const style={color:'#75451f',size:55,opacity:.7,flow:.8,pressure:true,minSize:.1,spacing:.25,roundness:.7,angle:25,scatter:.1,tipId:id};
 const points=Array.from({length:20},(_,i)=>[40+i*12,90+Math.sin(i*.25)*20,.1+i*.045]);
 const make=()=>{const c=document.createElement('canvas');c.width=340;c.height=200;return c};const a=make(),z=make();
 const ax=a.getContext('2d',{willReadFrequently:true}),zx=z.getContext('2d',{willReadFrequently:true});
 let start=performance.now();q.paintStroke(ax,points,style);const beforeMs=performance.now()-start;
 start=performance.now();optimized.paintStroke(zx,points,style);const coldMs=performance.now()-start;
 const ap=ax.getImageData(0,0,340,200).data,zp=zx.getImageData(0,0,340,200).data;let diffs=0,max=0;for(let i=0;i<ap.length;i++){const d=Math.abs(ap[i]-zp[i]);if(d)diffs++;max=Math.max(max,d)}
 const timings=[];for(let n=0;n<5;n++){zx.clearRect(0,0,340,200);start=performance.now();optimized.paintStroke(zx,points,style);timings.push(performance.now()-start)}
 cases.push({id,width:tip.width,height:tip.height,beforeMs,coldMs,warmMs:timings.reduce((a,b)=>a+b)/timings.length,differentChannels:diffs,maxDifference:max});}
 return {file:q.filePath,title:document.title,version:q.manifest.version,strokes:q.strokes.length,penProof:q.penProof,cases,cachePixels:optimized.tintPixels};
},fs.readFileSync('poc/perf-plugin/lab.js','utf8'));fs.writeFileSync('poc/evidence/brush-perf-comparison.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await b.close();if(result.cases.some(c=>c.differentChannels))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
