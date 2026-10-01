const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/drawing.poc|integration.poc|companion/i.test(m.text()))errors.push(m.text())});
 const result=await page.evaluate(async()=>{
   const path='Linked-PoC.canvas';const data=`${path}.drawing-poc.json`;
   app.vault.setConfig('trashOption','local');
   const file=app.vault.getAbstractFileByPath(path);
   await app.vault.trash(file,false);
   for(let i=0;i<20&&!await app.vault.adapter.exists(`.trash/${data}`);i++)await new Promise(r=>setTimeout(r,100));
   const trashed={canvas:await app.vault.adapter.exists(`.trash/${path}`),data:await app.vault.adapter.exists(`.trash/${data}`),originalData:await app.vault.adapter.exists(data)};
   await app.vault.adapter.rename(`.trash/${path}`,path);
   for(let i=0;i<20&&!await app.vault.adapter.exists(data);i++)await new Promise(r=>setTimeout(r,100));
   const restored={canvas:!!app.vault.getAbstractFileByPath(path),data:await app.vault.adapter.exists(data),trashData:await app.vault.adapter.exists(`.trash/${data}`)};
   app.vault.setConfig('trashOption','system');
   return {trashed,restored};
 });
 console.log(JSON.stringify({result,errors},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
