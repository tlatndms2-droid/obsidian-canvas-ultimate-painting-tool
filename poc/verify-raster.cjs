const { chromium } = require('playwright');
const fs = require('fs');

async function state(page) {
  return page.evaluate(() => {
    const p = app.plugins.plugins['canvas-drawing-integration-poc'];
    const card = p?.host?.querySelector('.canvas-node:not(.canvas-node-group)');
    const rect = card?.getBoundingClientRect();
    return {
      file: app.workspace.activeLeaf?.view?.file?.path,
      loaded: p?._loaded,
      strokes: p?.strokes?.length,
      rendered: p?.renderedStrokeCount,
      nodes: p?.host?.querySelectorAll('.canvas-node').length,
      raster: !!p?.raster,
      mode: p?.mode,
      card: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  });
}

async function drag(page, from, to) {
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(...to, { steps: 12 });
  await page.mouse.up();
}

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9287');
  const page = browser.contexts()[0].pages().find(p => p.url().startsWith('app://'));
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.evaluate(async () => {
    const file = app.vault.getAbstractFileByPath('Raster-PoC.canvas');
    if (!file) throw new Error('Raster fixture not found');
    await app.workspace.getLeaf(false).openFile(file);
  });
  await page.waitForTimeout(900);
  const before = await state(page);
  await page.locator('.canvas-drawing-poc-controls button').filter({ hasText: '그리기' }).click();
  const card = before.card;
  await drag(page, [card.x + 30, card.y + 70], [card.x + 210, card.y + 100]);
  await drag(page, [card.x + 80, card.y + card.height + 55], [card.x + 220, card.y + card.height + 80]);
  await page.waitForTimeout(600);
  const drawn = await state(page);
  await page.screenshot({ path: 'poc/evidence/raster-drawn.png' });
  await page.keyboard.down('Space');
  await drag(page, [card.x + 250, card.y + 230], [card.x + 300, card.y + 260]);
  await page.keyboard.up('Space');
  await page.waitForTimeout(250);
  const panned = await state(page);
  await page.locator('.canvas-controls [aria-label="확대"]').last().click();
  await page.waitForTimeout(250);
  const zoomed = await state(page);
  await page.locator('.canvas-drawing-poc-controls button').filter({ hasText: '선택' }).click();
  const movedCard = zoomed.card;
  await drag(page, [movedCard.x + 30, movedCard.y + 30], [movedCard.x + 70, movedCard.y + 60]);
  await page.waitForTimeout(500);
  const selected = await state(page);
  await page.screenshot({ path: 'poc/evidence/raster-selected.png' });
  const dataPath = 'C:/Users/tlatn/AppData/Local/Temp/CanvasDrawingSandbox-20260927/Raster-PoC.canvas.drawing-poc.json';
  const data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : null;
  const result = { before, drawn, panned, zoomed, selected, savedStrokes: data?.strokes?.length, errors };
  fs.writeFileSync('poc/evidence/raster-results.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exitCode = 1; });
