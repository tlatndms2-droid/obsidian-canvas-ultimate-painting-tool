const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const result=await page.evaluate(async()=>{
   const path='SystemTrash-PoC-20260927.canvas';
   const file=app.vault.getAbstractFileByPath(path);
   await app.vault.trash(file,true);
   await new Promise(r=>setTimeout(r,1300));
   return {filePresent:!!app.vault.getAbstractFileByPath(path),dataPresent:await app.vault.adapter.exists(`${path}.drawing-poc.json`),localTrash:await app.vault.adapter.exists(`.trash/${path}`),mode:app.vault.getConfig('trashOption')};
 });
 console.log(JSON.stringify(result,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
