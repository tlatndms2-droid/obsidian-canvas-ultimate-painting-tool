const { chromium } = require('playwright');

async function state(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.canvas-node:not(.canvas-node-group)');
    const path = document.querySelector('.canvas-drawing-poc-svg path');
    const canvas = document.querySelector('.canvas-wrapper .canvas');
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; };
    return {
      nodeCount: document.querySelectorAll('.canvas-node').length,
      cardStyle: card?.getAttribute('style'), cardRect: rect(card),
      pathCount: document.querySelectorAll('.canvas-drawing-poc-svg path').length,
      path: path?.getAttribute('d'), pathRect: rect(path),
      canvasStyle: canvas?.getAttribute('style'),
      activeTool: document.querySelector('.canvas-drawing-poc-controls button.is-active')?.textContent,
    };
  });
}

async function drag(page, from, to, steps=12) {
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(...to, {steps});
  await page.mouse.up();
}

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9287');
  const page = browser.contexts()[0].pages().find((p) => p.url().startsWith('app://'));
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && /drawing.poc|integration.poc/i.test(m.text())) errors.push(m.text()); });
  const before = await state(page);
  await page.getByRole('button', {name:'그리기'}).click();
  await drag(page, [455,420], [617,465]);
  await drag(page, [465,620], [800,650]);
  await page.waitForTimeout(600);
  const afterDraw = await state(page);
  await page.screenshot({path:'poc/evidence/drawn.png'});
  await page.keyboard.down('Space');
  await drag(page, [600,620], [645,660]);
  await page.keyboard.up('Space');
  await page.waitForTimeout(300);
  const afterPan = await state(page);
  await page.screenshot({path:'poc/evidence/panned.png'});
  await page.mouse.move(680,500);
  await page.mouse.wheel(0,-360);
  await page.waitForTimeout(400);
  const afterZoom = await state(page);
  await page.screenshot({path:'poc/evidence/zoomed.png'});
  await page.getByRole('button', {name:'선택'}).click();
  const card = await page.locator('.canvas-node:not(.canvas-node-group)').first().boundingBox();
  await drag(page, [card.x + 30, card.y + 30], [card.x + 70, card.y + 60]);
  await page.waitForTimeout(500);
  const afterSelectMove = await state(page);
  await page.screenshot({path:'poc/evidence/selection-move.png'});
  console.log(JSON.stringify({before,afterDraw,afterPan,afterZoom,afterSelectMove,errors},null,2));
  await browser.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
