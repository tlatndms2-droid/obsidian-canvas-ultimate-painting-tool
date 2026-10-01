const { chromium } = require('playwright');
const fs = require('fs');

async function openInMain(page, path){return page.evaluate(async path=>{
 const leaves=app.workspace.getLeavesOfType('canvas');
 const leaf=leaves.sort((a,b)=>b.view.containerEl.getBoundingClientRect().width-a.view.containerEl.getBoundingClientRect().width)[0]||app.workspace.getLeaf(false);
 app.workspace.setActiveLeaf(leaf,{focus:true});
 const file=app.vault.getAbstractFileByPath(path);
 const start=performance.now();
 await leaf.openFile(file);
 return {openMs:performance.now()-start,rect:(()=>{const r=leaf.view.containerEl.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()};
},path)}

async function samplePan(page){
 const box=await page.evaluate(()=>{const r=app.workspace.activeLeaf.view.containerEl.querySelector('.canvas-wrapper').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});
 const cx=box.x+box.width*0.53,cy=box.y+box.height*0.58;
 const frames=page.evaluate(()=>new Promise(resolve=>{
   const diffs=[];let prev=0,start=0;
   const tick=t=>{if(!start)start=t;if(prev)diffs.push(t-prev);prev=t;if(t-start<1200)requestAnimationFrame(tick);else resolve(diffs)};
   requestAnimationFrame(tick);
 }));
 await page.keyboard.down('Space');
 await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+75,cy+35,{steps:24});await page.mouse.move(cx,cy,{steps:24});await page.mouse.up();
 await page.keyboard.up('Space');
 const diffs=(await frames).sort((a,b)=>a-b);
 const pct=p=>Math.round(diffs[Math.min(diffs.length-1,Math.floor(diffs.length*p))]*10)/10;
 return {frames:diffs.length,medianMs:pct(.5),p95Ms:pct(.95),maxMs:pct(1),over50Ms:diffs.filter(n=>n>50).length};
}

async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const id='canvas-drawing-integration-poc';
 await page.evaluate(async id=>app.plugins.disablePluginAndSave(id),id);
 const baselineOpen=await openInMain(page,'Large-PoC.canvas');
 await page.waitForTimeout(700);
 const baselineState=await page.evaluate(()=>({title:document.title,nodes:app.workspace.activeLeaf.view.containerEl.querySelectorAll('.canvas-node').length,paths:app.workspace.activeLeaf.view.containerEl.querySelectorAll('.canvas-drawing-poc-svg path').length,raster:!!app.workspace.activeLeaf.view.containerEl.querySelector('.canvas-drawing-poc-raster'),heap:performance.memory?.usedJSHeapSize??null}));
 const baseline=[];for(let i=0;i<3;i++)baseline.push(await samplePan(page));
 await page.evaluate(async id=>app.plugins.enablePluginAndSave(id),id);
 await page.waitForFunction(()=>app.plugins.plugins['canvas-drawing-integration-poc']?.strokes?.length===1500,{timeout:10000});
 await page.waitForTimeout(400);
 const enabledState=await page.evaluate(()=>({title:document.title,nodes:app.workspace.activeLeaf.view.containerEl.querySelectorAll('.canvas-node').length,paths:app.workspace.activeLeaf.view.containerEl.querySelectorAll('.canvas-drawing-poc-svg path').length,raster:!!app.workspace.activeLeaf.view.containerEl.querySelector('.canvas-drawing-poc-raster'),rendered:app.plugins.plugins['canvas-drawing-integration-poc']?.renderedStrokeCount,heap:performance.memory?.usedJSHeapSize??null}));
 const enabled=[];for(let i=0;i<3;i++)enabled.push(await samplePan(page));
 const suffix=process.argv[2]||'initial';
 await page.screenshot({path:`poc/evidence/large-canvas-${suffix}.png`});
 const result={fixture:{nodes:151,strokes:1500,baselineOpenMs:Math.round(baselineOpen.openMs)},baselineState,baseline,enabledState,enabled};
 fs.writeFileSync(`poc/evidence/large-results-${suffix}.json`,JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
