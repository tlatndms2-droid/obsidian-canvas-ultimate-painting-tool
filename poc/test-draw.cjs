const { chromium } = require('playwright');
const fs = require('fs');

async function state(page){return page.evaluate(()=>{
 const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
 const p=app.plugins.plugins['canvas-drawing-integration-poc'];
 const card=document.querySelector('.canvas-node:not(.canvas-node-group)');
 const paths=[...document.querySelectorAll('.canvas-drawing-poc-svg path')];
 return {strokes:p.strokes.length,points:p.strokes.map(s=>s.length),nodes:document.querySelectorAll('.canvas-node').length,card:box(card),cardStyle:card?.getAttribute('style'),paths:paths.map(e=>({box:box(e),d:e.getAttribute('d')})),canvas:document.querySelector('.canvas-wrapper .canvas')?.getAttribute('style'),mode:p.mode};
})}
async function drag(page,from,to){await page.mouse.move(...from);await page.mouse.down();await page.mouse.move(...to,{steps:12});await page.mouse.up()}
async function main(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/drawing.poc|integration.poc/i.test(m.text()))errors.push(m.text())});
 await page.locator('.canvas-drawing-poc-controls button').filter({hasText:'그리기'}).click();
 const before=await state(page);
 const c=before.card;
 await drag(page,[c.x+25,c.y+50],[c.x+220,c.y+100]);
 await drag(page,[450,620],[730,660]);
 await page.waitForTimeout(600);
 const drawn=await state(page);
 await page.screenshot({path:'poc/evidence/clean-drawn.png'});
 await page.keyboard.down('Space');
 await drag(page,[540,600],[590,630]);
 await page.keyboard.up('Space');
 await page.waitForTimeout(250);
 const panned=await state(page);
 await page.screenshot({path:'poc/evidence/clean-panned.png'});
 await page.locator('.canvas-controls [aria-label="확대"]').click();
 await page.waitForTimeout(300);
 const zoomed=await state(page);
 await page.screenshot({path:'poc/evidence/clean-zoomed.png'});
 await page.locator('.canvas-drawing-poc-controls button').filter({hasText:'선택'}).click();
 const card=await page.locator('.canvas-node:not(.canvas-node-group)').first().boundingBox();
 await drag(page,[card.x+30,card.y+30],[card.x+70,card.y+60]);
 await page.waitForTimeout(500);
 const selected=await state(page);
 await page.screenshot({path:'poc/evidence/clean-selection.png'});
  const filePath=await page.evaluate(()=>app.workspace.activeLeaf?.view?.file?.path);
  const dataPath=`C:/Users/tlatn/AppData/Local/Temp/CanvasDrawingSandbox-20260927/${filePath}.drawing-poc.json`;
 const data=fs.existsSync(dataPath)?JSON.parse(fs.readFileSync(dataPath,'utf8')):null;
 const summary={before:{strokes:before.strokes,nodes:before.nodes,card:before.card},drawn:{strokes:drawn.strokes,nodes:drawn.nodes,card:drawn.card,pathBoxes:drawn.paths.map(p=>p.box)},panned:{strokes:panned.strokes,card:panned.card,pathBoxes:panned.paths.map(p=>p.box)},zoomed:{strokes:zoomed.strokes,card:zoomed.card,pathBoxes:zoomed.paths.map(p=>p.box)},selected:{strokes:selected.strokes,card:selected.card,cardStyle:selected.cardStyle,pathBoxes:selected.paths.map(p=>p.box)},saved:{strokes:data?.strokes?.length,points:data?.strokes?.map(s=>s.length)},errors};
 fs.writeFileSync('poc/evidence/basic-results.json',JSON.stringify(summary,null,2));
 console.log(JSON.stringify(summary,null,2));
 await browser.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
