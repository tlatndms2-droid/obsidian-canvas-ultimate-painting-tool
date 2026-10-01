const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const config=await page.evaluate(async()=>{const old=app.vault.getConfig('trashOption');app.vault.setConfig('trashOption','local');const f=app.vault.getAbstractFileByPath('Trash-PoC.canvas');await app.workspace.activeLeaf.openFile(f);return {old,current:app.vault.getConfig('trashOption'),file:f?.path}});
 await page.waitForTimeout(650);
 const nav=await page.evaluate(()=>[...document.querySelectorAll('[data-path="Trash-PoC.canvas"]')].map(e=>({tag:e.tagName,cls:e.className,html:e.outerHTML.slice(0,400)})));
 const item=page.locator('.nav-file-title[data-path="Trash-PoC.canvas"]').first();
 await item.click({button:'right'});
 const menu=await page.evaluate(()=>[...document.querySelectorAll('.menu-item')].map(e=>e.innerText));
 await page.screenshot({path:'poc/evidence/trash-menu.png'});
 console.log(JSON.stringify({config,nav,menu},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
