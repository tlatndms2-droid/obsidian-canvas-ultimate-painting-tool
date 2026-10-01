const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const result=await page.evaluate(async()=>{
   const id='canvas-drawing-integration-poc';
   const old=app.plugins.plugins[id];
   old?.detach?.();
   await app.plugins.unloadPlugin(id);
   const dataPath='Integration-PoC.canvas.drawing-poc.json';
   if(await app.vault.adapter.exists(dataPath)) await app.vault.adapter.remove(dataPath);
   const p=await app.plugins.loadPlugin(id);
   await new Promise(resolve=>setTimeout(resolve,500));
   return {oldLoaded:old?._loaded,newLoaded:p?._loaded,mode:p?.mode,spaceHeld:p?.spaceHeld,strokes:p?.strokes?.length,buttons:document.querySelectorAll('.canvas-drawing-poc-controls button').length};
 });
 console.log(JSON.stringify({result,errors},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
