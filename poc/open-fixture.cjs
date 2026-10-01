const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9287');
  const page = browser.contexts()[0].pages().find((p) => p.url().startsWith('app://'));
  const opened = await page.evaluate(async (path) => {
    const file = window.app.vault.getAbstractFileByPath(path);
    if (!file) return { error: 'fixture not discovered' };
    await window.app.workspace.getLeaf(false).openFile(file);
    return { path: file.path, title: document.title };
  }, process.argv[2] || 'Integration-PoC.canvas');
  await page.waitForTimeout(1200);
  const state = await page.evaluate(() => ({
    title: document.title,
    body: document.body.innerText.slice(-2200),
    canvasLeaves: window.app.workspace.getLeavesOfType('canvas').length,
    canvasGeometry: (() => {
      const canvas = document.querySelector('.canvas-wrapper .canvas');
      const node = document.querySelector('.canvas-wrapper .canvas-node:not(.canvas-node-group)');
      const view = window.app.workspace.getLeavesOfType('canvas')[0]?.view;
      return { canvasStyle: canvas?.getAttribute('style'), canvasComputed: canvas ? { transform: getComputedStyle(canvas).transform, position: getComputedStyle(canvas).position, width: getComputedStyle(canvas).width, height: getComputedStyle(canvas).height } : null, nodeStyle: node?.getAttribute('style'), viewKeys: view ? Object.keys(view).slice(0, 50) : [] };
    })(),
    canvasClasses: [...document.querySelectorAll('[class*=canvas]')].slice(0, 35).map(e => ({tag:e.tagName, cls:e.className, box:(() => {const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()})),
  }));
  await page.screenshot({ path: 'poc/evidence/fixture-open.png' });
  console.log(JSON.stringify({ opened, state }, null, 2));
  await browser.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
