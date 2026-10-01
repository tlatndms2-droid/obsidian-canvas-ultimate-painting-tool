const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const modal=page.locator('.modal').filter({hasText:'Trash-PoC.canvas'});
 if(await modal.count()!==1)throw new Error('Targeted Trash-PoC confirmation is missing');
 await modal.getByRole('button',{name:'삭제',exact:true}).click();
 await page.waitForTimeout(900);
 const state=await page.evaluate(async()=>({title:document.title,activeFile:app.workspace.activeLeaf?.view?.file?.path,canvasPresent:!!app.vault.getAbstractFileByPath('Trash-PoC.canvas'),trashedCanvas:await app.vault.adapter.exists('.trash/Trash-PoC.canvas'),companionPresent:await app.vault.adapter.exists('Trash-PoC.canvas.drawing-poc.json'),trashedCompanion:await app.vault.adapter.exists('.trash/Trash-PoC.canvas.drawing-poc.json')}));
 await page.screenshot({path:'poc/evidence/trashed.png'});
 console.log(JSON.stringify(state,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
