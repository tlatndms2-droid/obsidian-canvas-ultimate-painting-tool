const { chromium } = require('playwright');
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const state=()=>page.evaluate(()=>{const p=app.plugins.plugins['canvas-drawing-integration-poc'];const r=document.querySelector('.canvas-node:not(.canvas-node-group)').getBoundingClientRect();return{strokes:p.strokes.length,card:{x:r.x,y:r.y},canvas:document.querySelector('.canvas-wrapper .canvas').getAttribute('style')}});
 const before=await state();
 await page.keyboard.down('Space');
 const keyHeld=await page.evaluate(()=>app.plugins.plugins['canvas-drawing-integration-poc'].spaceHeld);
 await page.mouse.move(600,400);await page.mouse.down();await page.mouse.move(400,300,{steps:12});await page.mouse.up();
 await page.keyboard.up('Space');await page.waitForTimeout(300);
 const after=await state();
 await page.screenshot({path:'poc/evidence/pan-fixed.png'});
 console.log(JSON.stringify({before,keyHeld,after},null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
