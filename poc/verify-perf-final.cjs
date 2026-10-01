const fs=require('fs'),path=require('path');const{chromium}=require('playwright');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9287');const p=b.contexts()[0].pages().find(p=>p.url().startsWith('app://'));const id='canvas-drawing-integration-poc',cx=JSON.parse(fs.readFileSync('poc/evidence/brush-perf-context.json'));const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.evaluate(id=>{const q=app.plugins.plugins[id];const l=app.workspace.getLeavesOfType('canvas').find(l=>l.view.file?.path==='Brush-Performance-Check.canvas');if(!l)throw Error('Fixture leaf missing');app.workspace.setActiveLeaf(l,{focus:true})},id);
await p.waitForFunction(id=>{const q=app.plugins.plugins[id];return q?.canvas&&q.strokes.length>=1&&q.tipImages.size===66},id);await p.waitForTimeout(500);
const count=await p.evaluate(id=>app.plugins.plugins[id].strokes.length,id);
await p.evaluate(async id=>{await app.plugins.plugins[id].save();await app.plugins.disablePlugin(id)},id);
fs.copyFileSync('poc/perf-plugin/main.js',path.join(cx.plugin,'main.js'));
await p.evaluate(async id=>{await app.plugins.enablePlugin(id)},id);
await p.waitForFunction(({id,count})=>{const q=app.plugins.plugins[id];return q?.canvas&&!q.loadingDrawing&&q.strokes.length===count},{id,count});
const comparison=await p.evaluate(oldSource=>{const q=app.plugins.plugins['canvas-drawing-integration-poc'];const m={};new Function('Base','module',oldSource)(class{},m);const a=Object.create(q),z=Object.create(q);a.paintStroke=m.exports.prototype.paintStroke;
for(const c of[a,z]){c.raster=document.createElement('canvas');c.layerSurfaces=new Map()}
const t=performance.now();a.render();const beforeMs=performance.now()-t;const times=[];for(let i=0;i<4;i++){const t=performance.now();z.render();times.push(performance.now()-t)}
const ap=a.raster.getContext('2d').getImageData(0,0,a.raster.width,a.raster.height).data,zp=z.raster.getContext('2d').getImageData(0,0,z.raster.width,z.raster.height).data;let diffs=0;for(let i=0;i<ap.length;i++)if(ap[i]!==zp[i])diffs++;
q.tipId=q.tips.find(t=>t.width===816&&t.height===859).id;q.tipSelect.value=q.tipId;q.size=48;q.sizeInput.value=48;q.mixing=false;q.options.open=false;
window.__perfTimes=[];const render=q.render;q.render=function(){const t=performance.now();const r=render.call(this);window.__perfTimes.push(performance.now()-t);return r};
return{beforeMs,afterMs:times,differentChannels:diffs,count:q.strokes.length};
},fs.readFileSync(path.join(cx.backup,'plugin/main.js'),'utf8').split('const clone = value => JSON.parse(JSON.stringify(value));')[1].replace(/^/,'const clone = value => JSON.parse(JSON.stringify(value));'));
await p.locator('.canvas-drawing-poc-controls button').filter({hasText:'그리기'}).click();
const r=await p.evaluate(id=>{const r=app.plugins.plugins[id].host.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}},id);
await p.mouse.move(r.x+r.w*.25,r.y+r.h*.7);await p.mouse.down();await p.mouse.move(r.x+r.w*.65,r.y+r.h*.75,{steps:30});await p.mouse.up();await p.waitForTimeout(600);
await p.waitForFunction(id=>!app.plugins.plugins[id].loadingDrawing,id);
const ui=await p.evaluate(async id=>{const q=app.plugins.plugins[id];await q.save();const t=window.__perfTimes.sort((a,b)=>a-b);return{count:q.strokes.length,tip:q.strokes.at(-1)?.style?.tipId,points:q.strokes.at(-1)?.length,median:t[Math.floor(t.length/2)],p95:t[Math.floor(t.length*.95)],max:t.at(-1),version:q.manifest.version}},id);
await p.screenshot({path:'poc/evidence/brush-perf-final.png'});const result={comparison,ui,errors};fs.writeFileSync('poc/evidence/brush-perf-final.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await b.close();if(comparison.differentChannels||ui.count!==count+1||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
