const { chromium } = require('playwright');

async function main() {
  const port = Number(process.argv[2] || 9287);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const page = browser.contexts()[0].pages().find((p) => p.url().startsWith('app://')) || browser.contexts()[0].pages()[0];
  const state = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    body: document.body.innerText.slice(0, 1400),
    app: typeof window.app,
    leaves: window.app?.workspace?.getLeavesOfType?.('canvas').length ?? null,
    version: window.app?.version ?? null,
  }));
  console.log(JSON.stringify(state, null, 2));
  await browser.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
