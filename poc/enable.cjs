const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9287');
  const page = browser.contexts()[0].pages().find((p) => p.url().startsWith('app://'));
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const result = await page.evaluate(async () => {
    const id = 'canvas-drawing-integration-poc';
    await window.app.plugins.loadManifests();
    await window.app.plugins.setEnable(true);
    await window.app.plugins.enablePluginAndSave(id);
    const plugin = window.app.plugins.plugins[id];
    if (plugin && !plugin._loaded) await plugin.load();
    return { manifest: window.app.plugins.manifests[id], enabled: window.app.plugins.isEnabled(), loaded: !!plugin, initialized: plugin?._loaded };
  });
  await page.waitForTimeout(1000);
  const ui = await page.evaluate(() => ({
    title: document.title,
    buttons: [...document.querySelectorAll('.canvas-drawing-poc-controls button')].map(b => ({text:b.innerText,active:b.classList.contains('is-active')})),
    svg: !!document.querySelector('.canvas-drawing-poc-svg'),
  }));
  await page.screenshot({path:'poc/evidence/plugin-enabled.png'});
  console.log(JSON.stringify({ result, ui, errors }, null, 2));
  await browser.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
