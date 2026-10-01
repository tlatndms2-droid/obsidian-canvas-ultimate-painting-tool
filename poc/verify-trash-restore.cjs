const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 await page.waitForTimeout(500);
 const state=await page.evaluate(async()=>{
   const file=app.vault.getAbstractFileByPath('Trash-PoC.canvas');
   if(file)await app.workspace.activeLeaf.openFile(file);
   return {discovered:!!file,originalTrashOption:app.vault.getConfig('trashOption')};
 });
 await page.waitForTimeout(700);
 const result=await page.evaluate(async()=>({title:document.title,file:app.workspace.activeLeaf?.view?.file?.path,paths:document.querySelectorAll('.canvas-drawing-poc-svg path').length,cardCount:document.querySelectorAll('.canvas-node').length,data:await app.vault.adapter.exists('Trash-PoC.canvas.drawing-poc.json'),trashCanvas:await app.vault.adapter.exists('.trash/Trash-PoC.canvas')}));
 await page.screenshot({path:'poc/evidence/trash-restored.png'});
 await page.evaluate(()=>app.vault.setConfig('trashOption','system'));
 console.log(JSON.stringify({state,result},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
