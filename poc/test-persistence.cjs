const { chromium } = require('playwright');

async function state(page){return page.evaluate(()=>{
 const p=app.plugins.plugins['canvas-drawing-integration-poc'];
 return {title:document.title,view:app.workspace.activeLeaf?.view?.getViewType?.(),file:app.workspace.activeLeaf?.view?.file?.path,pluginLoaded:p?._loaded,buttons:document.querySelectorAll('.canvas-drawing-poc-controls button').length,paths:document.querySelectorAll('.canvas-drawing-poc-svg path').length,strokes:p?.strokes?.length,nodeCount:document.querySelectorAll('.canvas-node').length,dataPathExists:null};
})}

async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/drawing.poc|integration.poc/i.test(m.text()))errors.push(m.text())});
 const target=await page.evaluate(()=>app.workspace.activeLeaf?.view?.file?.path);
 const before=await state(page);
 await page.evaluate(async()=>{await app.workspace.activeLeaf.setViewState({type:'empty'});});
 await page.waitForTimeout(500);
 const closed=await state(page);
 await page.evaluate(async(path)=>{const f=app.vault.getAbstractFileByPath(path);await app.workspace.activeLeaf.openFile(f)},target);
 await page.waitForTimeout(900);
 const reopened=await state(page);
 await page.screenshot({path:'poc/evidence/reopened.png'});
 await page.evaluate(async()=>{await app.plugins.disablePluginAndSave('canvas-drawing-integration-poc')});
 await page.waitForTimeout(250);
 const disabled=await state(page);
 const dataWhenDisabled=await page.evaluate(path=>app.vault.adapter.exists(`${path}.drawing-poc.json`),target);
 await page.evaluate(async()=>{await app.plugins.enablePluginAndSave('canvas-drawing-integration-poc')});
 await page.waitForTimeout(700);
 const reenabled=await state(page);
 await page.screenshot({path:'poc/evidence/reenabled.png'});
 console.log(JSON.stringify({before,closed,reopened,disabled,dataWhenDisabled,reenabled,errors},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
