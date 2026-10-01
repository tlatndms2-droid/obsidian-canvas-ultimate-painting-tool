const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9287');
  const page = browser.contexts()[0].pages().find((p) => p.url().startsWith('app://'));
  const value = await page.evaluate(async () => ({
    plugins: Object.keys(window.app.plugins || {}),
    pluginMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(window.app.plugins || {})).filter((x) => /load|enable|disable|save|scan/i.test(x)),
    pluginIds: Object.keys(window.app.plugins?.plugins || {}),
    enabled: Array.from(window.app.plugins?.enabledPlugins || []),
    loadSource: String(window.app.plugins?.loadPlugin).slice(0, 1600),
    enableSource: String(window.app.plugins?.enablePlugin).slice(0, 1600),
    isEnabledSource: String(window.app.plugins?.isEnabled).slice(0, 1200),
    setEnableSource: String(window.app.plugins?.setEnable).slice(0, 1200),
    globalEnabled: window.app.plugins?.isEnabled(),
    pluginState: (() => {const p=window.app.plugins?.plugins?.['canvas-drawing-integration-poc'];return p?{host:!!p.host,filePath:p.filePath,mode:p.mode,activeView:window.app.workspace.activeLeaf?.view?.getViewType?.(),file:window.app.workspace.activeLeaf?.view?.file?.path,wrapper:!!window.app.workspace.activeLeaf?.view?.containerEl?.querySelector('.canvas-wrapper')}:null})(),
    componentLoadSource: String(window.app.plugins?.plugins?.['canvas-drawing-integration-poc']?.load).slice(0,800),
    syncError: await (async () => {try{await window.app.plugins?.plugins?.['canvas-drawing-integration-poc']?.sync();return null}catch(e){return String(e?.stack||e)}})(),
    controls: [...document.querySelectorAll('.canvas-controls [aria-label]')].map(b => ({tag:b.tagName,label:b.getAttribute('aria-label')})),
  }));
  console.log(JSON.stringify(value, null, 2));
  await browser.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
