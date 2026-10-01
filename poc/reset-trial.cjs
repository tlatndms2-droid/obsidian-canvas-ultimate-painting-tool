const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const result=await page.evaluate(async()=>{
   const id='canvas-drawing-integration-poc';
   await app.plugins.disablePluginAndSave(id);
   const path='Integration-PoC.canvas.drawing-poc.json';
   if(await app.vault.adapter.exists(path))await app.vault.adapter.remove(path);
   await app.plugins.enablePluginAndSave(id);
   await new Promise(resolve=>setTimeout(resolve,700));
   const p=app.plugins.plugins[id];
   return {loaded:p?._loaded,strokes:p?.strokes?.length,paths:document.querySelectorAll('.canvas-drawing-poc-svg path').length,exists:await app.vault.adapter.exists(path)};
 });
 console.log(JSON.stringify(result,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
