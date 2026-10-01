const { chromium } = require('playwright');
const fs = require('fs');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/drawing.poc|integration.poc/i.test(m.text()))errors.push(m.text())});
 await page.waitForTimeout(900);
 const state=await page.evaluate(()=>{const p=app.plugins.plugins['canvas-drawing-integration-poc'];return{title:document.title,file:app.workspace.activeLeaf?.view?.file?.path,pluginVersion:p?.manifest?.version,pluginLoaded:p?._loaded,strokes:p?.strokes?.length,rendered:p?.renderedStrokeCount,raster:!!p?.raster,nodes:p?.host?.querySelectorAll('.canvas-node').length,buttons:[...document.querySelectorAll('.canvas-drawing-poc-controls button')].map(e=>e.textContent)}});
 await page.screenshot({path:'poc/evidence/raster-restarted.png'});
 const result={state,errors};fs.writeFileSync('poc/evidence/raster-restart-results.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
