const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const result=await page.evaluate(async()=>{
   const events=[];
   const e1=app.vault.on('delete',f=>events.push({type:'delete',path:f.path,time:Date.now()}));
   const e2=app.vault.on('create',f=>events.push({type:'create',path:f.path,time:Date.now()}));
   const f=app.vault.getAbstractFileByPath('Event-PoC.canvas');
   await app.vault.trash(f,false);
   await new Promise(r=>setTimeout(r,550));
   const afterTrash={canvas:await app.vault.adapter.exists('Event-PoC.canvas'),trash:await app.vault.adapter.exists('.trash/Event-PoC.canvas'),companion:await app.vault.adapter.exists('Event-PoC.canvas.drawing-poc.json')};
   await app.vault.adapter.rename('.trash/Event-PoC.canvas','Event-PoC.canvas');
   await new Promise(r=>setTimeout(r,900));
   const afterRestore={canvas:!!app.vault.getAbstractFileByPath('Event-PoC.canvas'),companion:await app.vault.adapter.exists('Event-PoC.canvas.drawing-poc.json')};
   app.vault.offref(e1);app.vault.offref(e2);
   return {events,afterTrash,afterRestore};
 });
 console.log(JSON.stringify(result,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
