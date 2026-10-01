const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const read=()=>page.evaluate(()=>{const p=app.plugins.plugins['canvas-drawing-integration-poc'];return {loaded:p._loaded,keys:Object.keys(p),spaceHeld:p.spaceHeld,mode:p.mode,active:document.activeElement?.outerHTML.slice(0,200),strokes:p.strokes.length}});
 await page.locator('.canvas-drawing-poc-controls button').filter({hasText:'그리기'}).click();
 const before=await read();
 await page.keyboard.down('Space');
 const down=await read();
 await page.keyboard.up('Space');
 const up=await read();
 console.log(JSON.stringify({before,down,up},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
