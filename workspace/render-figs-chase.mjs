import { chromium } from 'playwright';
import { resolve } from 'node:path';

const root = process.cwd();
const htmlPath = resolve(root, 'workspace/figs-chase.html');
const outDir = resolve(root, 'public/blog-images/chase-meet');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 2 });
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
await page.waitForTimeout(300);

const shots = [
  ['#fig-vt-2018', 'vt-2018-options.png'],
];

for (const [selector, filename] of shots) {
  const el = page.locator(selector);
  await el.screenshot({ path: resolve(outDir, filename) });
  console.log('saved', filename);
}

await browser.close();
