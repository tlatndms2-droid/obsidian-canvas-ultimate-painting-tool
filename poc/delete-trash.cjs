const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const target='Trash-PoC.canvas';
 const menu=page.locator('.menu-item').filter({hasText:/^삭제$/});
 if(await menu.count()!==1)throw new Error(`Expected one delete action, got ${await menu.count()}`);
 await menu.click();
 await page.waitForTimeout(350);
 const after=await page.evaluate(async path=>({title:document.title,modal:document.querySelector('.modal')?.innerText,file:!!app.vault.getAbstractFileByPath(path),trash:await app.vault.adapter.exists(`.trash/${path}`),data:await app.vault.adapter.exists(`${path}.drawing-poc.json`) }),target);
 await page.screenshot({path:'poc/evidence/after-trash-delete.png'});
 console.log(JSON.stringify(after,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
