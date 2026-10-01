const { chromium } = require('playwright');
const fs = require('fs');

async function capture(page) {
  return page.evaluate(() => {
    const rect = (el) => { if (!el) return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
    const card=document.querySelector('.canvas-node:not(.canvas-node-group)');
    const path=document.querySelector('.canvas-drawing-poc-svg path');
    const canvas=document.querySelector('.canvas-wrapper .canvas');
    return {card:rect(card),cardStyle:card?.getAttribute('style'),path:rect(path),pathData:path?.getAttribute('d'),paths:document.querySelectorAll('.canvas-drawing-poc-svg path').length,nodes:document.querySelectorAll('.canvas-node').length,canvasStyle:canvas?.getAttribute('style'),tool:document.querySelector('.canvas-drawing-poc-controls button.is-active')?.textContent};
  });
}

async function main() {
  const browser=await chromium.connectOverCDP('http://127.0.0.1:9287');
  const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
  const beforeFit=await capture(page);
  await page.locator('.canvas-controls [aria-label^="화면 맞춤 확대"]').click();
  await page.waitForTimeout(400);
  const fit=await capture(page);
  await page.locator('.canvas-drawing-poc-controls button').filter({hasText:'선택'}).click();
  const box=await page.locator('.canvas-node:not(.canvas-node-group)').first().boundingBox();
  await page.mouse.move(box.x+30,box.y+30);
  await page.mouse.down();
  await page.mouse.move(box.x+75,box.y+65,{steps:12});
  await page.mouse.up();
  await page.waitForTimeout(600);
  const afterMove=await capture(page);
  await page.screenshot({path:'poc/evidence/selection-move.png'});
  const dataPath='C:/Users/tlatn/AppData/Local/Temp/CanvasDrawingSandbox-20260927/Integration-PoC.canvas.drawing-poc.json';
  const data=fs.existsSync(dataPath)?JSON.parse(fs.readFileSync(dataPath,'utf8')):null;
  console.log(JSON.stringify({beforeFit,fit,afterMove,data:{strokes:data?.strokes?.length,points:data?.strokes?.map(s=>s.length)}},null,2));
  await browser.close();
}

main().catch(e=>{console.error(e);process.exitCode=1});
