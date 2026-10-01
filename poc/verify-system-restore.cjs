const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const result=await page.evaluate(async()=>{
   const path='SystemTrash-PoC-20260927.canvas';
   const file=app.vault.getAbstractFileByPath(path);
   const leaves=app.workspace.getLeavesOfType('canvas');
   const leaf=leaves.sort((a,b)=>b.view.containerEl.getBoundingClientRect().width-a.view.containerEl.getBoundingClientRect().width)[0];
   if(!file||!leaf)return {discovered:!!file,leaf:!!leaf};
   app.workspace.setActiveLeaf(leaf,{focus:true});
   await leaf.openFile(file);
   return {discovered:true,activeFile:leaf.view.file?.path};
 });
 await page.waitForTimeout(800);
 const state=await page.evaluate(async()=>{const p=app.plugins.plugins['canvas-drawing-integration-poc'];return{title:document.title,activeFile:app.workspace.activeLeaf?.view?.file?.path,pluginFile:p?.filePath,strokes:p?.strokes?.length,visiblePaths:app.workspace.activeLeaf?.view?.containerEl?.querySelectorAll('.canvas-drawing-poc-svg path').length,companion:await app.vault.adapter.exists('SystemTrash-PoC-20260927.canvas.drawing-poc.json')}});
 await page.screenshot({path:'poc/evidence/system-trash-restored.png'});
 console.log(JSON.stringify({result,state},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
